import rateLimit from 'express-rate-limit';
import { z } from "zod";
import { db } from "../db";
import { paymentIdempotency } from "@shared/schema";
import { eq } from "drizzle-orm";

export const smsRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  message: {
    error: 'Too many SMS requests from this IP',
    errorFa: 'تعداد درخواست‌های پیامک از این IP زیاد است',
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const smsBulkRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many bulk SMS requests from this IP',
    errorFa: 'تعداد درخواست‌های پیامک انبوه از این IP زیاد است', 
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const authRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many authentication attempts. Please try again later.',
    errorFa: 'تعداد تلاش‌های احراز هویت زیاد است. لطفاً بعداً تلاش کنید.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpRequestRateLimit = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 5,
  message: {
    error: 'Too many OTP requests. Please try again later.',
    errorFa: 'تعداد درخواست کد تأیید زیاد است. لطفاً بعداً تلاش کنید.',
    retryAfter: '1 hour'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const otpVerifyRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: {
    error: 'Too many OTP verification attempts. Please try again later.',
    errorFa: 'تعداد تلاش‌های تأیید کد زیاد است. لطفاً بعداً تلاش کنید.',  
    retryAfter: '15 minutes'
  },
  standardHeaders: true,
  legacyHeaders: false,
});

export const sendSmsSchema = z.object({
  recipientPhone: z.string().min(10),
  recipientName: z.string().optional(),
  variableData: z.record(z.string()).optional(),
  sendingType: z.string().default('individual'),
  contextType: z.string().optional(),
  contextId: z.string().optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format')
});

export const sendBulkSmsSchema = z.object({
  recipients: z.array(z.object({
    phone: z.string().min(10),
    name: z.string().optional(),
    variableData: z.record(z.string()).optional()
  })).max(500, 'Maximum 500 recipients allowed per bulk send'),
  campaignId: z.string().optional(),
  sendingType: z.string().default('bulk'),
  contextType: z.string().optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format')
});

export const sendTestSmsSchema = z.object({
  testPhone: z.string().min(10),
  variableData: z.record(z.string()).optional(),
  idempotencyKey: z.string().uuid('Invalid idempotency key format')
});

export const SMS_MAX_LENGTH = 1000;
export const validateSmsContent = (content: string): string | null => {
  if (!content) return 'SMS content is required';
  if (content.length > SMS_MAX_LENGTH) return `SMS content exceeds maximum length of ${SMS_MAX_LENGTH} characters`;
  return null;
};

export const checkIdempotency = async (req: any, res: any, next: any) => {
  const idempotencyKey = req.body.idempotencyKey;
  if (!idempotencyKey) {
    return res.status(400).json({ 
      error: 'Idempotency key is required',
      errorFa: 'کلید منحصر به فرد الزامی است'
    });
  }

  try {
    const existing = await db.select()
      .from(paymentIdempotency)
      .where(eq(paymentIdempotency.callbackId, idempotencyKey))
      .limit(1);

    if (existing.length > 0 && existing[0].requestPayload) {
      console.log(`Duplicate request blocked by idempotency key: ${idempotencyKey}`);
      return res.json(existing[0].requestPayload);
    }
  } catch (err) {
    console.warn('Idempotency check failed, proceeding:', err);
  }

  req.idempotencyKey = idempotencyKey;
  next();
};
