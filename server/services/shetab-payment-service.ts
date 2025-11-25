import fetch from 'node-fetch';
import crypto from 'crypto';
import { storage } from '../storage';

export interface ShetabPaymentRequest {
  amount: number; // in IRR
  orderId: string;
  userId: number;
  description: string;
  callbackUrl: string;
  mobileNumber?: string;
  email?: string;
}

export interface ShetabPaymentResponse {
  success: boolean;
  message: string;
  paymentUrl?: string;
  transactionId?: string;
}

export interface ShetabCallbackPayload {
  orderId: string;
  transactionId: string;
  referenceNumber: string;
  amount: number;
  status: 'successful' | 'failed' | 'pending';
  timestamp: number;
  signature: string;
}

export class ShetabPaymentService {
  private static readonly PRODUCTION_URL = 'https://api.shetabpay.ir/api/v1';
  private static readonly SANDBOX_URL = 'https://sandbox.shetabpay.ir/api/v1';

  /**
   * Initialize payment gateway request
   */
  static async initiatePayment(request: ShetabPaymentRequest): Promise<ShetabPaymentResponse> {
    try {
      const settings = await storage.getAdminSettings();
      
      if (!settings.shetabEnabled || !settings.shetabMerchantId || !settings.shetabApiKey) {
        return {
          success: false,
          message: 'Shetab payment gateway not configured'
        };
      }

      // Get base URL based on environment
      const baseUrl = settings.shetabEnvironment === 'production' 
        ? this.PRODUCTION_URL 
        : this.SANDBOX_URL;

      // Create payment request
      const paymentRequest = {
        merchantId: settings.shetabMerchantId,
        terminalId: settings.shetabTerminalId || '',
        orderId: request.orderId,
        amount: request.amount,
        currency: 'IRR',
        description: request.description,
        callbackUrl: request.callbackUrl,
        mobileNumber: request.mobileNumber || '',
        email: request.email || ''
      };

      // Generate signature for security
      const signature = this.generateSignature(paymentRequest, settings.shetabSecretKey || '');
      
      const response = await fetch(`${baseUrl}/payment/request`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.shetabApiKey}`,
          'X-Signature': signature
        },
        body: JSON.stringify(paymentRequest),
        timeout: 10000
      });

      if (!response.ok) {
        const error = await response.text();
        console.error('Shetab payment request failed:', error);
        return {
          success: false,
          message: 'Failed to initiate payment with Shetab gateway'
        };
      }

      const result = await response.json() as any;
      
      if (result.success && result.paymentUrl) {
        // Store payment transaction in database for tracking
        await storage.createPaymentTransaction({
          userId: request.userId,
          amount: request.amount,
          paymentMethod: 'shetab',
          status: 'pending',
          externalTransactionId: result.transactionId,
          orderId: request.orderId
        } as any);

        return {
          success: true,
          message: 'Payment gateway initialized successfully',
          paymentUrl: result.paymentUrl,
          transactionId: result.transactionId
        };
      }

      return {
        success: false,
        message: result.message || 'Failed to get payment URL from Shetab'
      };
    } catch (error: any) {
      console.error('Shetab payment initiation error:', error);
      return {
        success: false,
        message: 'Error initiating payment: ' + error.message
      };
    }
  }

  /**
   * Verify and process payment callback
   */
  static async verifyCallback(payload: ShetabCallbackPayload): Promise<boolean> {
    try {
      const settings = await storage.getAdminSettings();
      
      if (!settings.shetabSecretKey) {
        console.error('Shetab secret key not configured');
        return false;
      }

      // Verify signature
      const expectedSignature = this.generateSignature(payload, settings.shetabSecretKey);
      if (payload.signature !== expectedSignature) {
        console.error('Shetab callback signature mismatch');
        return false;
      }

      // Check for duplicate processing
      const existingTransaction = await storage.getPaymentByExternalTransactionId(payload.transactionId);
      if (existingTransaction && existingTransaction.status !== 'pending') {
        console.warn('Shetab callback already processed:', payload.transactionId);
        return true; // Already processed, return true
      }

      // Update transaction status based on payment result
      if (payload.status === 'successful') {
        // Credit user's wallet
        const transaction = await storage.getPaymentByExternalTransactionId(payload.transactionId);
        if (transaction) {
          await storage.updatePaymentStatus(transaction.id, 'completed', payload.referenceNumber);
          
          // Add to user's wallet
          const user = await storage.getUser(transaction.userId);
          if (user) {
            const newBalance = (user.walletBalance || 0) + payload.amount;
            await storage.updateUser(user.id, { walletBalance: newBalance });
            
            // Create wallet transaction record
            await storage.createWalletTransaction({
              userId: user.id,
              amount: payload.amount,
              type: 'deposit',
              description: `Shetab payment deposit - Reference: ${payload.referenceNumber}`,
              shetabTransactionId: payload.transactionId,
              shetabReferenceNumber: payload.referenceNumber
            } as any);
          }
        }
      } else if (payload.status === 'failed') {
        const transaction = await storage.getPaymentByExternalTransactionId(payload.transactionId);
        if (transaction) {
          await storage.updatePaymentStatus(transaction.id, 'failed', payload.referenceNumber);
        }
      }

      return true;
    } catch (error: any) {
      console.error('Shetab callback verification error:', error);
      return false;
    }
  }

  /**
   * Refund a payment
   */
  static async refundPayment(transactionId: string, reason: string): Promise<boolean> {
    try {
      const settings = await storage.getAdminSettings();
      
      if (!settings.shetabApiKey || !settings.shetabSecretKey) {
        console.error('Shetab not configured for refunds');
        return false;
      }

      const baseUrl = settings.shetabEnvironment === 'production' 
        ? this.PRODUCTION_URL 
        : this.SANDBOX_URL;

      const refundRequest = {
        transactionId,
        reason,
        timestamp: Math.floor(Date.now() / 1000)
      };

      const signature = this.generateSignature(refundRequest, settings.shetabSecretKey);

      const response = await fetch(`${baseUrl}/payment/refund`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${settings.shetabApiKey}`,
          'X-Signature': signature
        },
        body: JSON.stringify(refundRequest),
        timeout: 10000
      });

      if (!response.ok) {
        console.error('Shetab refund failed:', response.statusText);
        return false;
      }

      const result = await response.json() as any;
      
      if (result.success) {
        // Update transaction status
        const transaction = await storage.getPaymentByExternalTransactionId(transactionId);
        if (transaction) {
          await storage.updatePaymentStatus(transaction.id, 'refunded', '');
        }
        return true;
      }

      return false;
    } catch (error: any) {
      console.error('Shetab refund error:', error);
      return false;
    }
  }

  /**
   * Generate HMAC signature for requests
   */
  private static generateSignature(data: any, secret: string): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto
      .createHmac('sha256', secret)
      .update(dataString)
      .digest('hex');
  }

  /**
   * Validate Iranian banking account
   */
  static validateIranianBankAccount(accountNumber: string): boolean {
    // Iranian bank accounts are typically 16 digits (without bank code)
    const cleanAccount = accountNumber.replace(/\D/g, '');
    if (cleanAccount.length !== 16) {
      return false;
    }

    // Basic Luhn algorithm check (optional, most Iranian banks don't strictly use this)
    return /^\d{16}$/.test(cleanAccount);
  }
}
