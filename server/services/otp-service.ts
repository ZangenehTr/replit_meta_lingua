import bcrypt from 'bcrypt';
import crypto from 'crypto';
import { storage } from '../storage';
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

    try {
      // Check identifier-based rate limit (email/phone)
      const identifierAttempts = await storage.getOtpAttemptsByIdentifier(identifier, windowStart);
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
      // Rate limit check
      const rateLimit = await this.checkRateLimit(identifier, ip || '');
      if (!rateLimit.allowed) {
        return {
          success: false,
          message: locale === 'fa' 
            ? 'تعداد درخواست‌های شما از حد مجاز گذشته است. لطفاً بعداً تلاش کنید.'
            : 'Too many OTP requests. Please try again later.'
        };
      }

      // Invalidate any existing active OTPs for this identifier
      await storage.invalidateActiveOtps(identifier, purpose);

      // Generate new OTP
      const code = this.generateOtpCode();
      const codeHash = await this.hashOtpCode(code);
      const expiresAt = new Date();
      expiresAt.setMinutes(expiresAt.getMinutes() + this.EXPIRY_MINUTES);

      const otpData: InsertOtpCode = {
        userId,
        identifier,
        channel,
        purpose,
        codeHash,
        expiresAt,
        ip,
        locale
      };

      const otpRecord = await storage.createOtpCode(otpData);

      // TODO: Send OTP via email or SMS based on channel
      if (channel === 'sms') {
        await this.sendSmsOtp(identifier, code, locale);
      } else {
        await this.sendEmailOtp(identifier, code, locale);
      }

      return {
        success: true,
        message: locale === 'fa'
          ? `کد تأیید به ${channel === 'sms' ? 'شماره تلفن' : 'ایمیل'} شما ارسال شد.`
          : `OTP sent to your ${channel === 'sms' ? 'phone number' : 'email'}.`,
        otpId: otpRecord.id,
        expiresAt
      };
    } catch (error) {
      console.error('OTP generation failed:', error);
      return {
        success: false,
        message: locale === 'fa'
          ? 'خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.'
          : 'Failed to send OTP. Please try again.'
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
      // Find active OTP for this identifier and purpose
      const otpRecord = await storage.getActiveOtpCode(identifier, purpose);
      
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
      const user = await storage.getUserByIdentifier(identifier);
      
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
      // Get Kavenegar API settings from admin settings
      const smsSettings = await storage.getAdminSettings('sms');
      
      if (!smsSettings?.kavenegar_api_key) {
        console.warn('Kavenegar API key not configured');
        return;
      }

      const message = locale === 'fa'
        ? `کد تأیید Meta Lingua: ${code}\nاین کد تا 10 دقیقه معتبر است.`
        : `Meta Lingua verification code: ${code}\nValid for 10 minutes.`;

      // TODO: Implement actual Kavenegar SMS API call
      // For now, log the code (remove in production)
      console.log(`SMS OTP for ${phoneNumber}: ${code}`);
      
      // Placeholder for actual SMS implementation
      // await kavenegarClient.send({
      //   receptor: phoneNumber,
      //   message: message,
      //   sender: smsSettings.sender_number
      // });
      
    } catch (error) {
      console.error('SMS sending failed:', error);
      throw error;
    }
  }

  /**
   * Send OTP via Email
   */
  private static async sendEmailOtp(email: string, code: string, locale: string = 'fa'): Promise<void> {
    try {
      const subject = locale === 'fa'
        ? 'کد تأیید Meta Lingua'
        : 'Meta Lingua Verification Code';
        
      const message = locale === 'fa'
        ? `سلام!\n\nکد تأیید شما: ${code}\n\nاین کد تا 10 دقیقه معتبر است.\n\nتیم Meta Lingua`
        : `Hello!\n\nYour verification code: ${code}\n\nThis code is valid for 10 minutes.\n\nMeta Lingua Team`;

      // TODO: Implement actual email sending
      // For now, log the code (remove in production)
      console.log(`Email OTP for ${email}: ${code}`);
      
      // Placeholder for actual email implementation
      // await emailService.send({
      //   to: email,
      //   subject: subject,
      //   text: message
      // });
      
    } catch (error) {
      console.error('Email sending failed:', error);
      throw error;
    }
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