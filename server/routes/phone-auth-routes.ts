import { Router, Request, Response } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import { storage } from '../storage';
import { OtpService } from '../services/otp-service';
import { generateTokens } from '../auth';
import { recordReferralRegistration } from './referral-routes.js';

const router = Router();

// ==========================================
// Phone-First Authentication Routes
// ==========================================

// Validation schemas
const phoneSchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  locale: z.enum(['fa', 'en', 'ar']).default('fa')
});

const phoneLoginSchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  locale: z.enum(['fa', 'en', 'ar']).default('fa')
});

const phoneSignupSchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  firstName: z.string().min(1, 'First name required'),
  lastName: z.string().min(1, 'Last name required'),
  locale: z.enum(['fa', 'en', 'ar']).default('fa'),
  role: z.enum(['Student', 'Teacher', 'Parent', 'Admin', 'Mentor', 'Supervisor', 'CallCenter', 'Accountant', 'FrontDesk']).optional().default('Student'),
  email: z.string().email('Valid email required').optional()
});

const otpVerifySchema = z.object({
  phoneNumber: z.string().min(10, 'Invalid phone number'),
  code: z.string().length(6, 'OTP code must be 6 digits'),
  purpose: z.enum(['login', 'registration']),
  locale: z.enum(['fa', 'en', 'ar']).default('fa')
});

// ==========================================
// 1. Request OTP for Phone Login
// ==========================================
router.post('/phone/request-otp-login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, locale } = phoneLoginSchema.parse(req.body);

    // Validate Iranian phone number format
    if (!OtpService.isValidIranianPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: locale === 'fa'
          ? 'شماره تلفن نامعتبر است. لطفاً شماره تلفن ایرانی معتبر وارد کنید.'
          : locale === 'ar'
          ? 'رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف إيراني صالح.'
          : 'Invalid phone number. Please enter a valid Iranian phone number.'
      });
    }

    // Format phone number to international format for database lookup
    const formattedPhone = OtpService.formatIranianPhoneNumber(phoneNumber);
    console.log(`[Phone Auth] Looking up user with phone: ${formattedPhone} (input: ${phoneNumber})`);

    // Check if user exists
    const existingUser = await storage.getUserByIdentifier(formattedPhone);
    if (!existingUser) {
      return res.status(404).json({
        success: false,
        message: locale === 'fa'
          ? 'این شماره تلفن در سیستم ثبت نشده است. ابتدا ثبت‌نام کنید.'
          : locale === 'ar'
          ? 'رقم الهاتف غير مسجل في النظام. يرجى التسجيل أولاً.'
          : 'This phone number is not registered. Please sign up first.'
      });
    }

    // Generate OTP
    const otpResult = await OtpService.generateOtp(
      phoneNumber,
      'sms',
      'login',
      existingUser.id,
      req.ip || undefined,
      locale
    );

    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    res.json({
      success: true,
      message: otpResult.message,
      expiresAt: otpResult.expiresAt,
      otpId: otpResult.otpId
    });
  } catch (error: any) {
    console.error('Phone login OTP request failed:', error);
    res.status(500).json({
      success: false,
      message: req.body.locale === 'fa'
        ? 'خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.'
        : 'Error sending OTP. Please try again.'
    });
  }
});

// ==========================================
// 2. Request OTP for Phone Registration (Signup)
// ==========================================
router.post('/phone/request-otp-signup', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, locale } = phoneSignupSchema.parse(req.body);

    // Validate Iranian phone number format
    if (!OtpService.isValidIranianPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: locale === 'fa'
          ? 'شماره تلفن نامعتبر است. لطفاً شماره تلفن ایرانی معتبر وارد کنید.'
          : locale === 'ar'
          ? 'رقم الهاتف غير صحيح. يرجى إدخال رقم هاتف إيراني صالح.'
          : 'Invalid phone number. Please enter a valid Iranian phone number.'
      });
    }

    // Format phone number for database lookup
    const formattedPhone = OtpService.formatIranianPhoneNumber(phoneNumber);
    console.log(`[Phone Auth Signup] Checking phone: ${formattedPhone} (input: ${phoneNumber})`);

    // Check if user already exists
    const existingUser = await storage.getUserByIdentifier(formattedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: locale === 'fa'
          ? 'این شماره تلفن قبلاً ثبت‌نام شده است. لطفاً وارد شوید.'
          : locale === 'ar'
          ? 'رقم الهاتف مسجل بالفعل. يرجى تسجيل الدخول.'
          : 'This phone number is already registered. Please log in.'
      });
    }

    // Generate OTP for registration verification
    const otpResult = await OtpService.generateOtp(
      phoneNumber,
      'sms',
      'registration',
      undefined,
      req.ip || undefined,
      locale
    );

    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    // Store signup data temporarily (in request session or could use cache)
    res.json({
      success: true,
      message: otpResult.message,
      expiresAt: otpResult.expiresAt,
      otpId: otpResult.otpId,
      pendingSignupData: {
        phoneNumber,
        firstName: req.body.firstName,
        lastName: req.body.lastName,
        role: req.body.role,
        email: req.body.email
      }
    });
  } catch (error: any) {
    console.error('Phone signup OTP request failed:', error);
    res.status(500).json({
      success: false,
      message: req.body.locale === 'fa'
        ? 'خطا در ارسال کد تأیید. لطفاً دوباره تلاش کنید.'
        : 'Error sending OTP. Please try again.'
    });
  }
});

// ==========================================
// 3. Verify OTP and Login (Phone Login Flow)
// ==========================================
router.post('/phone/verify-otp-login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code, locale } = otpVerifySchema.parse({
      ...req.body,
      purpose: 'login'
    });

    // Verify OTP
    const verifyResult = await OtpService.verifyOtp(phoneNumber, code, 'login', locale);
    
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }

    // Get user
    const user = await storage.getUser(verifyResult.userId!);
    if (!user || !user.isActive) {
      return res.status(401).json({
        success: false,
        message: locale === 'fa'
          ? 'حساب کاربری فعال نیست.'
          : 'User account is not active.'
      });
    }

    // Update phone verification status
    await storage.updateUser(user.id, {
      isPhoneVerified: true
    });

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Calculate expiry times
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session
    const session = await storage.createUserSession({
      userId: user.id,
      sessionToken: accessToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt,
      refreshExpiresAt,
      loginMethod: 'sms'
    } as any);

    res.json({
      success: true,
      message: locale === 'fa'
        ? 'ورود موفقیت‌آمیز بود.'
        : 'Login successful.',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        phoneNumber: user.phoneNumber,
        role: user.role,
        isPhoneVerified: true
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    });
  } catch (error: any) {
    console.error('Phone login OTP verification failed:', error);
    res.status(500).json({
      success: false,
      message: req.body.locale === 'fa'
        ? 'خطا در تأیید کد. لطفاً دوباره تلاش کنید.'
        : 'Error verifying code. Please try again.'
    });
  }
});

// ==========================================
// 4. Verify OTP and Register (Phone Signup Flow)
// ==========================================
router.post('/phone/verify-otp-signup', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, code, locale } = otpVerifySchema.parse({
      ...req.body,
      purpose: 'registration'
    });

    const signupData = phoneSignupSchema.parse(req.body);

    // Format phone number for database operations
    const formattedPhone = OtpService.formatIranianPhoneNumber(phoneNumber);

    // Verify OTP
    const verifyResult = await OtpService.verifyOtp(formattedPhone, code, 'registration', locale);
    
    if (!verifyResult.success) {
      return res.status(400).json(verifyResult);
    }

    // Check phone availability again (double-check)
    const existingUser = await storage.getUserByIdentifier(formattedPhone);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: locale === 'fa'
          ? 'این شماره تلفن قبلاً ثبت‌نام شده است.'
          : 'This phone number is already registered.'
      });
    }

    // Extract optional UTM and referral fields from request body
    const { utmSource, utmMedium, utmCampaign, referralCode } = req.body as {
      utmSource?: string; utmMedium?: string; utmCampaign?: string; referralCode?: string;
    };

    // Create new user with NORMALIZED phone number (+98 format)
    const newUser = await storage.createUser({
      email: signupData.email || `${formattedPhone.replace('+', '')}@metalingua.local`,
      firstName: signupData.firstName,
      lastName: signupData.lastName,
      role: signupData.role || 'Student',
      password: '', // No password for phone-first auth
      isPhoneVerified: true,
      isActive: true,
      phoneNumber: formattedPhone as any,
      utmSource: utmSource || null,
      utmMedium: utmMedium || null,
      utmCampaign: utmCampaign || null,
      referralCode: null, // user's own referral code; generated later
      referredByCode: referralCode || null // code used to invite this user
    } as any);

    // If referred via a referral code, record the event directly (no HTTP round-trip)
    if (referralCode) {
      recordReferralRegistration(referralCode, newUser.id).catch(() => {});
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(newUser);

    // Calculate expiry times
    const now = new Date();
    const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000); // 24 hours
    const refreshExpiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days

    // Create session
    const session = await storage.createUserSession({
      userId: newUser.id,
      sessionToken: accessToken,
      ipAddress: req.ip,
      userAgent: req.headers['user-agent'],
      expiresAt,
      refreshExpiresAt,
      loginMethod: 'sms'
    } as any);

    res.status(201).json({
      success: true,
      message: locale === 'fa'
        ? 'ثبت‌نام موفقیت‌آمیز بود. به Meta Lingua خوش آمدید!'
        : locale === 'ar'
        ? 'تم التسجيل بنجاح. مرحباً بك في Meta Lingua!'
        : 'Registration successful. Welcome to Meta Lingua!',
      user: {
        id: newUser.id,
        email: newUser.email,
        firstName: newUser.firstName,
        lastName: newUser.lastName,
        phoneNumber: newUser.phoneNumber,
        role: newUser.role,
        isPhoneVerified: true
      },
      tokens: {
        accessToken,
        refreshToken,
        expiresIn: '24h'
      }
    });
  } catch (error: any) {
    console.error('Phone signup OTP verification failed:', error);
    res.status(500).json({
      success: false,
      message: req.body.locale === 'fa'
        ? 'خطا در تأیید کد یا ایجاد حساب. لطفاً دوباره تلاش کنید.'
        : 'Error verifying code or creating account. Please try again.'
    });
  }
});

// ==========================================
// 5. Phone-First Login (Direct)
// ==========================================
router.post('/phone/login', async (req: Request, res: Response) => {
  try {
    const { phoneNumber, locale } = phoneLoginSchema.parse(req.body);

    // Validate Iranian phone number format
    if (!OtpService.isValidIranianPhoneNumber(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: locale === 'fa'
          ? 'شماره تلفن نامعتبر است.'
          : 'Invalid phone number.'
      });
    }

    // Format phone number for database lookup
    const formattedPhone = OtpService.formatIranianPhoneNumber(phoneNumber);

    // Check if user exists
    const user = await storage.getUserByIdentifier(formattedPhone);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: locale === 'fa'
          ? 'این شماره تلفن ثبت‌نام نشده است.'
          : 'This phone number is not registered.',
        requiresSignup: true
      });
    }

    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: locale === 'fa'
          ? 'این حساب غیرفعال است.'
          : 'This account is inactive.'
      });
    }

    // Generate and send OTP
    const otpResult = await OtpService.generateOtp(
      phoneNumber,
      'sms',
      'login',
      user.id,
      req.ip,
      locale
    );

    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    res.json({
      success: true,
      message: otpResult.message,
      step: 'otp_verification',
      expiresAt: otpResult.expiresAt,
      userId: user.id
    });
  } catch (error: any) {
    console.error('Phone login failed:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed. Please try again.'
    });
  }
});

// ==========================================
// 6. Phone-First Signup (Direct)
// ==========================================
router.post('/phone/signup', async (req: Request, res: Response) => {
  try {
    const signupData = phoneSignupSchema.parse(req.body);

    // Validate Iranian phone number format
    if (!OtpService.isValidIranianPhoneNumber(signupData.phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: signupData.locale === 'fa'
          ? 'شماره تلفن نامعتبر است.'
          : 'Invalid phone number.'
      });
    }

    // Check if phone already exists
    const existingUser = await storage.getUserByIdentifier(signupData.phoneNumber);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: signupData.locale === 'fa'
          ? 'این شماره تلفن قبلاً ثبت‌نام شده است.'
          : 'This phone number is already registered.',
        requiresLogin: true
      });
    }

    // Generate OTP for verification
    const otpResult = await OtpService.generateOtp(
      signupData.phoneNumber,
      'sms',
      'registration',
      undefined,
      req.ip,
      signupData.locale
    );

    if (!otpResult.success) {
      return res.status(400).json(otpResult);
    }

    res.status(200).json({
      success: true,
      message: otpResult.message,
      step: 'otp_verification',
      expiresAt: otpResult.expiresAt,
      pendingData: {
        phoneNumber: signupData.phoneNumber,
        firstName: signupData.firstName,
        lastName: signupData.lastName,
        email: signupData.email,
        role: signupData.role
      }
    });
  } catch (error: any) {
    console.error('Phone signup failed:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed. Please try again.'
    });
  }
});

// ==========================================
// Email/Password Registration (No SMS required)
// ==========================================
router.post('/email/signup', async (req: Request, res: Response) => {
  try {
    const signupSchema = z.object({
      email: z.string().email('Valid email required'),
      password: z.string().min(6, 'Password must be at least 6 characters'),
      firstName: z.string().min(1, 'First name required'),
      lastName: z.string().min(1, 'Last name required'),
      role: z.enum(['Student', 'Teacher', 'Parent', 'Admin', 'Mentor', 'Supervisor', 'CallCenter', 'Accountant', 'FrontDesk']).optional().default('Student')
    });

    const data = signupSchema.parse(req.body);

    // Check if email already exists
    const existingUser = await storage.getUserByEmail(data.email);
    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'Email already registered. Please login instead.'
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, 10);
    
    // Create user directly
    const user = await storage.createUser({
      email: data.email,
      password: hashedPassword,
      firstName: data.firstName,
      lastName: data.lastName,
      role: data.role,
      isPhoneVerified: false,
      isEmailVerified: true,
      locale: 'fa'
    } as any);

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Account created successfully',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Email signup failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Signup failed. Please try again.'
    });
  }
});

// ==========================================
// Email/Password Login (No SMS required)
// ==========================================
router.post('/email/login', async (req: Request, res: Response) => {
  try {
    const loginSchema = z.object({
      email: z.string().email('Valid email required'),
      password: z.string().min(1, 'Password required')
    });

    const { email, password } = loginSchema.parse(req.body);

    // Find user by email
    const user = await storage.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Verify password using bcrypt
    const isPasswordValid = await bcrypt.compare(password, user.password || '');
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password'
      });
    }

    // Generate tokens
    const { accessToken, refreshToken } = generateTokens(user);

    // Set secure cookies
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      message: 'Login successful',
      user: {
        id: user.id,
        email: user.email,
        firstName: user.firstName,
        lastName: user.lastName,
        role: user.role
      }
    });
  } catch (error: any) {
    console.error('Email login failed:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Login failed'
    });
  }
});

export default router;
