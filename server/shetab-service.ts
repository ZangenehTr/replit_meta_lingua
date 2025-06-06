import crypto from 'crypto';
import { InsertPayment, Payment } from '@shared/schema';
import { storage } from './storage';

export interface ShetabConfig {
  merchantId: string;
  terminalId: string;
  apiKey: string;
  gatewayUrl: string;
  callbackUrl: string;
}

export interface ShetabPaymentRequest {
  amount: number;
  orderId: string;
  description?: string;
  customerEmail?: string;
  customerPhone?: string;
  metadata?: Record<string, any>;
}

export interface ShetabPaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayUrl?: string;
  error?: string;
  errorCode?: string;
}

export interface ShetabVerifyResponse {
  success: boolean;
  transactionId?: string;
  referenceNumber?: string;
  cardNumber?: string;
  amount?: number;
  status: 'completed' | 'failed' | 'cancelled';
  error?: string;
  errorCode?: string;
}

export class ShetabPaymentService {
  private config: ShetabConfig;

  constructor(config: ShetabConfig) {
    this.config = config;
  }

  /**
   * Initialize a new payment transaction with Shetab gateway
   */
  async initializePayment(
    userId: number,
    request: ShetabPaymentRequest,
    ipAddress?: string,
    userAgent?: string
  ): Promise<{ payment: Payment; gatewayUrl: string }> {
    try {
      // Create payment record in database
      const paymentData: InsertPayment = {
        userId,
        amount: request.amount.toString(),
        currency: 'IRR',
        creditsAwarded: request.metadata?.creditsAwarded || 0,
        provider: 'shetab',
        transactionId: request.orderId,
        merchantTransactionId: this.generateMerchantTransactionId(),
        status: 'pending',
        ipAddress,
        userAgent,
      };

      const payment = await storage.createPayment(paymentData);

      // Generate Shetab payment URL
      const shetabResponse = await this.createShetabPayment({
        ...request,
        orderId: payment.merchantTransactionId!,
        amount: request.amount,
      });

      if (!shetabResponse.success) {
        // Update payment status to failed
        await storage.updatePaymentStatus(payment.id, 'failed');
        throw new Error(shetabResponse.error || 'Failed to initialize Shetab payment');
      }

      // Update payment with Shetab transaction ID
      await this.updatePaymentWithShetabData(payment.id, {
        gatewayTransactionId: shetabResponse.transactionId,
      });

      return {
        payment,
        gatewayUrl: shetabResponse.gatewayUrl!,
      };
    } catch (error) {
      console.error('Shetab payment initialization error:', error);
      throw error;
    }
  }

  /**
   * Verify payment with Shetab gateway
   */
  async verifyPayment(
    merchantTransactionId: string,
    gatewayTransactionId: string
  ): Promise<ShetabVerifyResponse> {
    try {
      const verifyData = {
        merchantId: this.config.merchantId,
        terminalId: this.config.terminalId,
        transactionId: gatewayTransactionId,
        orderId: merchantTransactionId,
      };

      const signature = this.generateSignature(verifyData, this.config.apiKey);
      
      const response = await fetch(`${this.config.gatewayUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          ...verifyData,
          signature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          status: 'failed',
          error: result.message || 'Verification failed',
          errorCode: result.code,
        };
      }

      return {
        success: true,
        transactionId: result.transactionId,
        referenceNumber: result.referenceNumber,
        cardNumber: result.cardNumber ? this.maskCardNumber(result.cardNumber) : undefined,
        amount: result.amount,
        status: this.mapShetabStatus(result.status),
      };
    } catch (error) {
      console.error('Shetab payment verification error:', error);
      return {
        success: false,
        status: 'failed',
        error: 'Network error during verification',
      };
    }
  }

  /**
   * Handle payment callback from Shetab gateway
   */
  async handleCallback(callbackData: any): Promise<Payment | null> {
    try {
      const {
        merchantTransactionId,
        gatewayTransactionId,
        status,
        referenceNumber,
        cardNumber,
        amount,
      } = callbackData;

      // Find payment by merchant transaction ID
      const payments = await storage.getUserPayments(0); // Get all payments
      const payment = payments.find(p => p.merchantTransactionId === merchantTransactionId);

      if (!payment) {
        console.error('Payment not found for merchant transaction ID:', merchantTransactionId);
        return null;
      }

      // Verify payment with Shetab
      const verifyResponse = await this.verifyPayment(merchantTransactionId, gatewayTransactionId);

      const updatedStatus = verifyResponse.success ? 'completed' : 'failed';
      const failureReason = verifyResponse.success ? undefined : verifyResponse.error;

      // Update payment in database
      await this.updatePaymentWithShetabData(payment.id, {
        gatewayTransactionId,
        referenceNumber: verifyResponse.referenceNumber,
        cardNumber: verifyResponse.cardNumber,
        status: updatedStatus,
        failureReason,
        shetabResponse: callbackData,
        completedAt: verifyResponse.success ? new Date() : undefined,
      });

      // Award credits if payment successful
      if (verifyResponse.success && payment.creditsAwarded && payment.creditsAwarded > 0) {
        await this.awardCredits(payment.userId, payment.creditsAwarded);
      }

      return payment;
    } catch (error) {
      console.error('Shetab callback handling error:', error);
      return null;
    }
  }

  /**
   * Create payment request with Shetab gateway
   */
  private async createShetabPayment(request: ShetabPaymentRequest): Promise<ShetabPaymentResponse> {
    try {
      const paymentData = {
        merchantId: this.config.merchantId,
        terminalId: this.config.terminalId,
        amount: request.amount,
        orderId: request.orderId,
        description: request.description || 'Language Learning Credits',
        callbackUrl: this.config.callbackUrl,
        customerEmail: request.customerEmail,
        customerPhone: request.customerPhone,
      };

      const signature = this.generateSignature(paymentData, this.config.apiKey);

      const response = await fetch(`${this.config.gatewayUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.config.apiKey}`,
        },
        body: JSON.stringify({
          ...paymentData,
          signature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        return {
          success: false,
          error: result.message || 'Payment creation failed',
          errorCode: result.code,
        };
      }

      return {
        success: true,
        transactionId: result.transactionId,
        gatewayUrl: result.redirectUrl,
      };
    } catch (error) {
      console.error('Shetab payment creation error:', error);
      return {
        success: false,
        error: 'Network error during payment creation',
      };
    }
  }

  /**
   * Update payment with Shetab-specific data
   */
  private async updatePaymentWithShetabData(
    paymentId: number,
    data: Partial<{
      gatewayTransactionId: string;
      referenceNumber: string;
      cardNumber: string;
      status: string;
      failureReason: string;
      shetabResponse: any;
      completedAt: Date;
    }>
  ): Promise<void> {
    // Note: This would need to be implemented in the storage layer
    // For now, we'll use the existing updatePaymentStatus method
    if (data.status) {
      await storage.updatePaymentStatus(paymentId, data.status);
    }
  }

  /**
   * Award credits to user after successful payment
   */
  private async awardCredits(userId: number, credits: number): Promise<void> {
    try {
      const user = await storage.getUser(userId);
      if (user) {
        await storage.updateUser(userId, {
          credits: (user.credits || 0) + credits,
        });
      }
    } catch (error) {
      console.error('Error awarding credits:', error);
    }
  }

  /**
   * Generate unique merchant transaction ID
   */
  private generateMerchantTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = Math.random().toString(36).substring(2, 8);
    return `MLI_${timestamp}_${random}`;
  }

  /**
   * Generate signature for Shetab API requests
   */
  private generateSignature(data: any, secret: string): string {
    const sortedKeys = Object.keys(data).sort();
    const signatureString = sortedKeys
      .map(key => `${key}=${data[key]}`)
      .join('&');
    
    return crypto
      .createHmac('sha256', secret)
      .update(signatureString)
      .digest('hex');
  }

  /**
   * Map Shetab status codes to our internal status
   */
  private mapShetabStatus(shetabStatus: string): 'completed' | 'failed' | 'cancelled' {
    switch (shetabStatus.toLowerCase()) {
      case 'success':
      case 'completed':
      case 'verified':
        return 'completed';
      case 'cancelled':
      case 'canceled':
        return 'cancelled';
      default:
        return 'failed';
    }
  }

  /**
   * Mask card number for security (show only last 4 digits)
   */
  private maskCardNumber(cardNumber: string): string {
    if (cardNumber.length < 4) return cardNumber;
    return '**** **** **** ' + cardNumber.slice(-4);
  }
}

/**
 * Create Shetab service instance with configuration
 */
export function createShetabService(): ShetabPaymentService | null {
  // In production, these would come from environment variables or database configuration
  const config: ShetabConfig = {
    merchantId: process.env.SHETAB_MERCHANT_ID || '',
    terminalId: process.env.SHETAB_TERMINAL_ID || '',
    apiKey: process.env.SHETAB_API_KEY || '',
    gatewayUrl: process.env.SHETAB_GATEWAY_URL || 'https://gateway.shetab.ir/api/v1',
    callbackUrl: process.env.SHETAB_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/shetab/callback`,
  };

  // Validate required configuration
  if (!config.merchantId || !config.terminalId || !config.apiKey) {
    console.warn('Shetab payment gateway not configured. Missing required environment variables.');
    return null;
  }

  return new ShetabPaymentService(config);
}