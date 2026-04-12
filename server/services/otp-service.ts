import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from '../storage';
import { emailService } from './email-service';
import { kavenegarService } from '../kavenegar-service';
import { InsertOtpCode, OtpCode } from '@shared/schema';

export interface OtpGenerationResult {
  success: boolean;
  message: string;
  otpId?: number;
  expiresAt?: Date;
}

export interface OtpVerificationResult {
  success: boolean;
  message: string;
  userId?: number;
  isNewUser?: boolean;
}

export interface RateLimitCheck {
  allowed: boolean;
  remainingAttempts: number;
  resetTime?: Date;
}

export class OtpService {
  private static readonly CODE_LENGTH = 6;
  private static readonly EXPIRY_MINUTES = 10;
  private static readonly MAX_ATTEMPTS_PER_IDENTIFIER = 5;
  private static readonly MAX_ATTEMPTS_PER_IP = 10;
  private static readonly RATE_LIMIT_WINDOW_HOURS = 1;
  
  // Whitelisted test account phone numbers (exact matches only)
  private static readonly TEST_ACCOUNT_PHONES = new Set([
    // International format
    '+989121234567', '+989127654321', '+989131234567', '+989137654321',
    '+989101234567', '+989101234568', '+989101234569', '+989101234570', '+989101234571',
    '+989101234572',
    '+98909090909',
    // Local format
    '09121234567', '09127654321', '09131234567', '09137654321',
    '09101234567', '09101234568', '09101234569', '09101234570', '09101234571',
    '09101234572',
    '0909090909',
    // Without country code (digits only)
    '9121234567', '9127654321', '9131234567', '9137654321',
    '9101234567', '9101234568', '9101234569', '9101234570', '9101234571',
    '9101234572',
    '909090909',
  ]);
  
  /**
   * Generate time-based demo OTP code using HMAC
   * Security: Requires DEMO_TEST_SECRET environment variable
   * The code rotates every 30 minutes to limit exposure
   */
  private static generateDemoCode(phone: string): string | null {
    const secret = process.env.DEMO_TEST_SECRET;
    if (!secret) return null;
    
    // Use 30-minute time slices for code rotation
    const timeSlice = Math.floor(Date.now() / (30 * 60 * 1000));
    const data = `${phone}:${timeSlice}`;
    
    // Generate HMAC and extract 6-digit code
    const hmac = crypto.createHmac('sha256', secret);
    hmac.update(data);
    const hash = hmac.digest('hex');
    
    // Take first 6 hex chars, convert to number, mod to get 6 digits
    const code = (parseInt(hash.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
    return code;
  }
  
  /**
   * Check if demo mode bypass should be allowed and validate code
   * Security: Requires both DEMO_TEST_ACCOUNTS=true AND DEMO_TEST_SECRET
   * Only works for whitelisted test phone numbers with HMAC-generated codes
   */
  private static verifyDemoBypass(identifier: string, code: string): boolean {
    // Must have both env vars set
    const isDemoEnabled = process.env.DEMO_TEST_ACCOUNTS === 'true';
    const hasSecret = !!process.env.DEMO_TEST_SECRET;
    if (!isDemoEnabled || !hasSecret) return false;
    
    // Normalize phone number: remove spaces, dashes, parentheses
    const cleanedIdentifier = identifier.replace(/[\s\-\(\)]/g, '');
    
    // Must be an exact match to a whitelisted phone (check any format)
    if (!this.TEST_ACCOUNT_PHONES.has(cleanedIdentifier)) return false;
    
    // CRITICAL: Normalize to international format (+98...) for code generation
    // The script always generates codes using +98 format, so we must match that
    const internationalPhone = this.formatIranianPhoneNumber(cleanedIdentifier);
    
    console.log(`🔍 Demo bypass check: input=${identifier}, cleaned=${cleanedIdentifier}, international=${internationalPhone}`);
    
    // Generate expected code using international format (matches script)
    const expectedCode = this.generateDemoCode(internationalPhone);
    if (!expectedCode) return false;
    
    // Also check previous time slice to handle edge cases at slice boundaries
    const prevTimeSlice = Math.floor(Date.now() / (30 * 60 * 1000)) - 1;
    const prevData = `${internationalPhone}:${prevTimeSlice}`;
    const prevHmac = crypto.createHmac('sha256', process.env.DEMO_TEST_SECRET!);
    prevHmac.update(prevData);
    const prevHash = prevHmac.digest('hex');
    const prevCode = (parseInt(prevHash.substring(0, 8), 16) % 1000000).toString().padStart(6, '0');
    
    console.log(`🔍 Demo codes: expected=${expectedCode}, prevCode=${prevCode}, provided=${code}`);
    
    // Constant-time comparison to prevent timing attacks
    const codeMatches = crypto.timingSafeEqual(Buffer.from(code), Buffer.from(expectedCode));
    const prevCodeMatches = crypto.timingSafeEqual(Buffer.from(code), Buffer.from(prevCode));
    
    if (codeMatches || prevCodeMatches) {
      console.log(`🔓 Demo mode: HMAC-verified bypass for test account ${internationalPhone}`);
      return true;
    }
    
    console.log(`❌ Demo mode: Code mismatch for ${internationalPhone}`);
    return false;
  }

  /**
   * Generate a 6-digit OTP code
   */
  private static generateOtpCode(): string {
    return crypto.randomInt(100000, 999999).toString();
  }

  /**
   * Hash the OTP code for secure storage
   */
  private static async hashOtpCode(code: string): Promise<string> {
    return bcrypt.hash(code, 10);
  }

  /**
   * Verify OTP code against hash
   */
  private static async verifyOtpCode(code: string, hash: string): Promise<boolean> {
    return bcrypt.compare(code, hash);
  }

  /**
   * Check rate limits for OTP requests
   */
  static async checkRateLimit(identifier: string, ip: string): Promise<RateLimitCheck> {
    const now = new Date();
    const windowStart = new Date(now.getTime() - (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
    
    // Normalize phone number for consistent rate limiting
    const normalizedIdentifier = this.formatIranianPhoneNumber(identifier);

    try {
      // Check identifier-based rate limit (email/phone) - use normalized
      const identifierAttempts = await storage.getOtpAttemptsByIdentifier(normalizedIdentifier, windowStart);
      if (identifierAttempts >= this.MAX_ATTEMPTS_PER_IDENTIFIER) {
        const resetTime = new Date(windowStart.getTime() + (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime
        };
      }

      // Check IP-based rate limit
      const ipAttempts = await storage.getOtpAttemptsByIp(ip, windowStart);
      if (ipAttempts >= this.MAX_ATTEMPTS_PER_IP) {
        const resetTime = new Date(windowStart.getTime() + (this.RATE_LIMIT_WINDOW_HOURS * 60 * 60 * 1000));
        return {
          allowed: false,
          remainingAttempts: 0,
          resetTime
        };
      }

      return {
        allowed: true,
        remainingAttempts: Math.min(
          this.MAX_ATTEMPTS_PER_IDENTIFIER - identifierAttempts,
          this.MAX_ATTEMPTS_PER_IP - ipAttempts
        )
      };
    } catch (error) {
      console.error('Rate limit check failed:', error);
      return { allowed: false, remainingAttempts: 0 };
    }
  }

  /**
   * Generate and store OTP for email/phone verification
   */
  static async generateOtp(
    identifier: string,
    channel: 'email' | 'sms',
    purpose: 'login' | 'registration' | 'verification' | 'password_reset',
    userId?: number,
    ip?: string,
    locale: string = 'fa'
  ): Promise<OtpGenerationResult> {
    try {
      // CRITICAL: Normalize phone numbers to +98 format for consistent storage and lookup
      const normalizedIdentifier = channel === 'sms' 
        ? this.formatIranianPhoneNumber(identifier) 
        : identifier;
      
      console.log(`📱 OTP Generation: original=${identifier}, normalized=${normalizedIdentifier}`);
      
      // Rate limit check (use normalized identifier)
      const rateLimit = await this.checkRateLimit(normalizedIdentifier, ip || '');
      if (!rateLimit.allowed) {
        const rateLimitMessages = {
          fa: 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً بعداً تلاش کنید.',
          en: 'Too many OTP requests. Please try again later.',
          ar: 'لقد تجاوزت عدد محاولات طلب OTP. يرجى المحاولة لاحقاً.'
        };
        return {
          success: false,
          message: rateLimitMessages[locale] || rateLimitMessages['en']
        };
      }

      // Invalidate any existing active OTPs for this identifier (use normalized)
      await storage.invalidateActiveOtps(normalizedIdentifier, purpose);

      // Generate new OTP
      const code = this.generateOtpCode();
      const codeHash = await this.hashOtpCode(code);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

      // CRITICAL: Store with normalized identifier for consistent lookup
      const otpData: InsertOtpCode = {
        userId,
        identifier: normalizedIdentifier,
        phoneNumber: channel === 'sms' ? normalizedIdentifier : undefined,
        email: channel === 'email' ? normalizedIdentifier : undefined,
        channel,
        purpose,
        codeHash,
        expiresAt,
        ip,
        locale
      };

      const otpRecord = await storage.createOtpCode(otpData);

      // DEVELOPMENT MODE: Always log OTP code to console for testing
      const isDevelopment = process.env.NODE_ENV !== 'production';
      if (isDevelopment) {
        console.log(`\n🔐 ═══════════════════════════════════════════════`);
        console.log(`🔐 DEVELOPMENT OTP CODE for ${normalizedIdentifier} (input: ${identifier})`);
        console.log(`🔐 Code: ${code}`);
        console.log(`🔐 Purpose: ${purpose}`);
        console.log(`🔐 Expires: ${expiresAt.toLocaleString()}`);
        console.log(`🔐 ═══════════════════════════════════════════════\n`);
      }

      // Send OTP via email or SMS based on channel
      try {
        if (channel === 'sms') {
          await this.sendSmsOtp(identifier, code, locale);
        } else {
          await this.sendEmailOtp(identifier, code, locale);
        }
      } catch (error) {
        console.error(`Failed to send ${channel} OTP:`, error);
        
        // In development mode, still report success since code is logged
        if (isDevelopment) {
          console.log(`⚠️ SMS/Email delivery failed, but OTP code is logged above for development testing.`);
          const devMessages = {
            fa: `کد تأیید: ${code} (حالت توسعه - کد در کنسول چاپ شد)`,
            en: `Verification code: ${code} (Development mode - code logged to console)`,
            ar: `رمز التحقق: ${code} (وضع التطوير - الكود مسجل في وحدة التحكم)`
          };
          return {
            success: true,
            message: devMessages[locale] || devMessages['en'],
            otpId: otpRecord.id,
            expiresAt
          };
        }
        
        // In production, log but don't fail - OTP is created even if delivery fails
        return {
          success: true,
          message: locale === 'fa'
            ? `کد تأیید ایجاد شد ولی ارسال ناموفق بود. لطفاً دوباره تلاش کنید.`
            : locale === 'ar'
            ? `تم إنشاء الكود لكن فشل الإرسال. يرجى المحاولة مرة أخرى.`
            : `OTP created but delivery failed. Please try again.`,
          otpId: otpRecord.id,
          expiresAt
        };
      }

      const successMessages = {
        fa: `کد تأیید به ${channel === 'sms' ? 'شماره تلفن' : 'ایمیل'} شما ارسال شد.`,
        en: `OTP sent to your ${channel === 'sms' ? 'phone number' : 'email'}.`,
        ar: `تم إرسال رمز التحقق إلى ${channel === 'sms' ? 'رقم الهاتف' : 'البريد الإلكتروني'} الخاص بك.`
      };

      return {
        success: true,
        message: successMessages[locale] || successMessages['en'],
        otpId: otpRecord.id,
        expiresAt
      };
    } catch (error) {
      console.error('OTP generation failed:', error);
      const errorMessages = {
        fa: 'خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.',
        en: 'Failed to send OTP. Please try again.',
        ar: 'فشل إرسال OTP. يرجى المحاولة مرة أخرى.'
      };
      return {
        success: false,
        message: errorMessages[locale] || errorMessages['en']
      };
    }
  }

  /**
   * Verify OTP code
   */
  static async verifyOtp(
    identifier: string,
    code: string,
    purpose: 'login' | 'registration' | 'verification' | 'password_reset',
    locale: string = 'fa'
  ): Promise<OtpVerificationResult> {
    try {
      // CRITICAL: Normalize phone numbers to +98 format for consistent lookup
      const normalizedIdentifier = this.formatIranianPhoneNumber(identifier);
      
      console.log(`🔍 OTP Verification: original=${identifier}, normalized=${normalizedIdentifier}`);
      
      // Demo mode bypass for test accounts in production (HMAC-verified)
      if (this.verifyDemoBypass(identifier, code)) {
        // Check if user exists (for login) or is new (for registration)
        // Use normalized identifier for user lookup
        const user = await storage.getUserByIdentifier(normalizedIdentifier);
        
        return {
          success: true,
          message: locale === 'fa'
            ? 'کد تأیید با موفقیت تأیید شد. (حالت دمو)'
            : 'OTP verified successfully. (Demo mode)',
          userId: user?.id,
          isNewUser: !user
        };
      }
      
      // Find active OTP for this identifier and purpose (use normalized)
      const otpRecord = await storage.getActiveOtpCode(normalizedIdentifier, purpose);
      
      if (!otpRecord) {
        return {
          success: false,
          message: locale === 'fa'
            ? 'کد تأیید نامعتبر یا منقضی شده است.'
            : 'Invalid or expired OTP code.'
        };
      }

      // Check if OTP has expired
      if (new Date() > otpRecord.expiresAt) {
        return {
          success: false,
          message: locale === 'fa'
            ? 'کد تأیید منقضی شده است. لطفاً کد جدید درخواست کنید.'
            : 'OTP code has expired. Please request a new code.'
        };
      }

      // Check if OTP has been consumed
      if (otpRecord.consumedAt) {
        return {
          success: false,
          message: locale === 'fa'
            ? 'کد تأیید قبلاً استفاده شده است.'
            : 'OTP code has already been used.'
        };
      }

      // Check max attempts
      if (otpRecord.attempts >= otpRecord.maxAttempts) {
        return {
          success: false,
          message: locale === 'fa'
            ? 'تعداد تلاش‌های نامعتبر از حد مجاز گذشته است. لطفاً کد جدید درخواست کنید.'
            : 'Too many invalid attempts. Please request a new code.'
        };
      }

      // Verify the code
      const isValid = await this.verifyOtpCode(code, otpRecord.codeHash);
      
      if (!isValid) {
        // Increment attempt count
        await storage.incrementOtpAttempts(otpRecord.id);
        
        const remainingAttempts = otpRecord.maxAttempts - (otpRecord.attempts + 1);
        return {
          success: false,
          message: locale === 'fa'
            ? `کد تأیید نادرست است. ${remainingAttempts} تلاش باقی مانده.`
            : `Invalid OTP code. ${remainingAttempts} attempts remaining.`
        };
      }

      // Mark OTP as consumed
      await storage.consumeOtpCode(otpRecord.id);

      // Check if user exists (for login) or is new (for registration)
      // Use normalized identifier for user lookup
      const user = await storage.getUserByIdentifier(normalizedIdentifier);
      
      return {
        success: true,
        message: locale === 'fa'
          ? 'کد تأیید با موفقیت تأیید شد.'
          : 'OTP verified successfully.',
        userId: user?.id,
        isNewUser: !user
      };
    } catch (error) {
      console.error('OTP verification failed:', error);
      return {
        success: false,
        message: locale === 'fa'
          ? 'خطا در تأیید کد. لطفاً دوباره تلاش کنید.'
          : 'Verification failed. Please try again.'
      };
    }
  }

  /**
   * Send OTP via SMS (Iranian Kavenegar service)
   */
  private static async sendSmsOtp(phoneNumber: string, code: string, locale: string = 'fa'): Promise<void> {
    try {
      const kavenegarApiKey = process.env.KAVENEGAR_API_KEY;
      
      if (!kavenegarApiKey) {
        console.warn('⚠️ Kavenegar API key not configured. SMS OTP will not be sent in production.');
        console.log(`[DEV] SMS OTP for ${phoneNumber}: ${code}`);
        return;
      }

      const messages: Record<string, string> = {
        fa: `کد تأیید MetaLingo: ${code}\nاین کد تا 10 دقیقه معتبر است.`,
        en: `MetaLingo verification code: ${code}\nValid for 10 minutes.`,
        ar: `رمز التحقق MetaLingo: ${code}\nهذا الرمز صالح لمدة 10 دقائق.`
      };
      const message = messages[locale] || messages['en'];

      // Format phone number for Iranian network
      const formattedPhone = this.formatIranianPhoneNumber(phoneNumber);

      // Use the existing Kavenegar service for proper API handling
      const result = await kavenegarService.sendSimpleSMS(formattedPhone, message);
      
      if (result.success) {
        console.log(`✓ SMS OTP sent successfully to ${formattedPhone} (messageId: ${result.messageId})`);
      } else {
        console.error('Kavenegar API returned error:', result.error);
        throw new Error(`Kavenegar error: ${result.error || 'unknown'}`);
      }
      
    } catch (error) {
      console.error('❌ SMS sending failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP via Email (Iranian SMTP or fallback)
   */
  private static async sendEmailOtp(email: string, code: string, locale: string = 'fa'): Promise<void> {
    try {
      const subjects = {
        fa: 'کد تأیید MetaLingo',
        en: 'MetaLingo Verification Code',
        ar: 'رمز التحقق MetaLingo'
      };
      
      const messages = {
        fa: `سلام!\n\nکد تأیید شما: ${code}\n\nاین کد تا 10 دقیقه معتبر است.\n\nاگر این درخواست را انجام ندادید، این ایمیل را نادیده بگیرید.\n\nتیم MetaLingo`,
        en: `Hello!\n\nYour verification code: ${code}\n\nThis code is valid for 10 minutes.\n\nIf you didn't request this, please ignore this email.\n\nMetaLingo Team`,
        ar: `مرحبا!\n\nرمز التحقق الخاص بك: ${code}\n\nهذا الرمز صالح لمدة 10 دقائق.\n\nإذا لم تطلب هذا، يرجى تجاهل هذا البريد الإلكتروني.\n\nفريق MetaLingo`
      };

      const subject = subjects[locale] || subjects['en'];
      const message = messages[locale] || messages['en'];

      // Send via email service (Iranian infrastructure)
      const emailData = {
        subject,
        content: message,
        html: this.renderOtpEmailHTML(code, message, locale)
      };

      const result = await emailService.send(email, emailData);
      
      if (result) {
        console.log(`✓ Email OTP sent successfully to ${email}`);
      } else {
        console.warn(`⚠️ Email OTP delivery uncertain for ${email} - will try next attempt`);
      }
      
    } catch (error) {
      console.error('❌ Email sending failed:', error);
      throw error;
    }
  }

  /**
   * Render HTML email template for OTP
   */
  private static renderOtpEmailHTML(code: string, message: string, locale: string = 'fa'): string {
    const direction = locale === 'fa' || locale === 'ar' ? 'rtl' : 'ltr';
    return `
<!DOCTYPE html>
<html dir="${direction}" lang="${locale}">
<head>
  <meta charset="UTF-8">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f9f9f9; }
    .header { background: #007bff; color: white; padding: 20px; text-align: center; border-radius: 5px 5px 0 0; }
    .content { background: white; padding: 30px; }
    .code-box { 
      background: #f0f0f0; 
      border: 2px solid #007bff; 
      padding: 20px; 
      text-align: center; 
      border-radius: 5px; 
      margin: 20px 0;
      font-size: 24px;
      letter-spacing: 3px;
      font-weight: bold;
      color: #007bff;
    }
    .footer { background: #f9f9f9; padding: 20px; text-align: center; font-size: 12px; color: #666; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>${locale === 'fa' ? 'MetaLingo' : locale === 'ar' ? 'MetaLingo' : 'MetaLingo'}</h2>
    </div>
    <div class="content">
      <p>${message.split('\n').join('<br>')}</p>
      <div class="code-box">${code}</div>
      <p style="color: #999; font-size: 12px;">
        ${locale === 'fa' 
          ? 'این ایمیل خودکار ارسال شده است. لطفاً به آن پاسخ ندهید.'
          : locale === 'ar'
          ? 'تم إرسال هذا البريد الإلكتروني تلقائياً. يرجى عدم الرد عليه.'
          : 'This email was sent automatically. Please do not reply to it.'}
      </p>
    </div>
    <div class="footer">
      <p>© 2025 MetaLingo Academy. ${locale === 'fa' ? 'تمام حقوق محفوظ است.' : locale === 'ar' ? 'جميع الحقوق محفوظة.' : 'All rights reserved.'}</p>
    </div>
  </div>
</body>
</html>
    `;
  }

  /**
   * Clean up expired OTP codes (should be called periodically)
   */
  static async cleanupExpiredOtps(): Promise<void> {
    try {
      await storage.deleteExpiredOtpCodes();
    } catch (error) {
      console.error('OTP cleanup failed:', error);
    }
  }

  /**
   * Format phone number for Iranian compliance (+98 format)
   */
  static formatIranianPhoneNumber(phoneNumber: string): string {
    // Remove all non-digit characters
    let cleaned = phoneNumber.replace(/\D/g, '');
    
    // Handle different input formats
    if (cleaned.startsWith('98')) {
      // Already has country code without +
      cleaned = '+' + cleaned;
    } else if (cleaned.startsWith('0')) {
      // Remove leading 0 and add +98
      cleaned = '+98' + cleaned.substring(1);
    } else if (cleaned.length === 10) {
      // 10 digits without leading 0, add +98
      cleaned = '+98' + cleaned;
    } else if (!cleaned.startsWith('+98')) {
      // Add +98 if not present
      cleaned = '+98' + cleaned;
    }
    
    return cleaned;
  }

  /**
   * Validate Iranian phone number format
   */
  static isValidIranianPhoneNumber(phoneNumber: string): boolean {
    const formatted = this.formatIranianPhoneNumber(phoneNumber);
    // Iranian mobile numbers: +98 9XX XXX XXXX
    const iranianMobileRegex = /^\+989[0-9]{9}$/;
    return iranianMobileRegex.test(formatted);
  }
}