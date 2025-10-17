import crypto from 'crypto';
import { db } from './db';
import { walletTransactions, paymentIdempotency, users } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export interface ShetabConfig {
  merchantId: string;
  terminalId: string;
  secretKey: string;
  gatewayUrl: string;
  callbackUrl: string;
}

export interface ShetabPaymentRequest {
  amount: number;
  userId: number;
  description?: string;
  metadata?: Record<string, any>;
}

export interface ShetabPaymentResponse {
  success: boolean;
  transactionId?: string;
  gatewayUrl?: string;
  merchantTransactionId?: string;
  error?: string;
  errorCode?: string;
}

export interface ShetabCallbackData {
  merchantTransactionId: string;
  gatewayTransactionId: string;
  status: string;
  referenceNumber?: string;
  cardNumber?: string;
  amount: number;
  signature: string;
  timestamp?: string;
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

export class ShetabPaymentServiceV2 {
  private config: ShetabConfig;

  constructor(config: ShetabConfig) {
    this.config = config;
  }

  /**
   * Initialize a new payment transaction with Shetab gateway
   */
  async initializePayment(request: ShetabPaymentRequest): Promise<ShetabPaymentResponse> {
    try {
      const merchantTransactionId = this.generateMerchantTransactionId();

      // Create pending wallet transaction
      const [transaction] = await db.insert(walletTransactions).values({
        userId: request.userId,
        type: 'deposit',
        amount: request.amount.toString(),
        description: request.description || 'Wallet Top-up via Shetab',
        status: 'pending',
        merchantTransactionId,
      }).returning();

      // Create Shetab payment request
      const paymentData = {
        merchantId: this.config.merchantId,
        terminalId: this.config.terminalId,
        amount: request.amount,
        orderId: merchantTransactionId,
        description: request.description || 'Wallet Top-up',
        callbackUrl: this.config.callbackUrl,
      };

      const signature = this.generateSignature(paymentData, this.config.secretKey);

      const response = await fetch(`${this.config.gatewayUrl}/payment`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...paymentData,
          signature,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        // Update transaction status to failed
        await db.update(walletTransactions)
          .set({ status: 'failed' })
          .where(eq(walletTransactions.id, transaction.id));

        return {
          success: false,
          error: result.message || 'Payment creation failed',
          errorCode: result.code,
        };
      }

      // Update transaction with Shetab transaction ID
      await db.update(walletTransactions)
        .set({ shetabTransactionId: result.transactionId })
        .where(eq(walletTransactions.id, transaction.id));

      return {
        success: true,
        transactionId: result.transactionId,
        gatewayUrl: result.redirectUrl,
        merchantTransactionId,
      };
    } catch (error) {
      console.error('Shetab payment initialization error:', error);
      return {
        success: false,
        error: 'Network error during payment creation',
      };
    }
  }

  /**
   * Handle payment callback from Shetab gateway WITH IDEMPOTENCY
   * 
   * This method ensures that duplicate callbacks are safely ignored,
   * preventing double-crediting of wallet balance.
   */
  async handleCallback(callbackData: ShetabCallbackData): Promise<{
    success: boolean;
    transaction?: any;
    error?: string;
    alreadyProcessed?: boolean;
  }> {
    const callbackId = callbackData.gatewayTransactionId;

    try {
      // ========================================
      // STEP 1: Verify Callback Signature
      // ========================================
      const isValid = this.verifyCallbackSignature(callbackData);
      if (!isValid) {
        console.error('Invalid Shetab callback signature:', callbackId);
        return {
          success: false,
          error: 'Invalid signature',
        };
      }

      // ========================================
      // STEP 2: Check Idempotency (Atomic)
      // ========================================
      // Try to insert idempotency record with "processing" status
      // This will fail if callback was already received
      let idempotencyRecord;
      try {
        [idempotencyRecord] = await db.insert(paymentIdempotency).values({
          callbackId,
          merchantTransactionId: callbackData.merchantTransactionId,
          status: 'processing',
          requestSignature: callbackData.signature,
          requestPayload: callbackData,
        }).returning();
      } catch (error: any) {
        // Check if this is a unique constraint violation
        if (error.code === '23505') { // PostgreSQL unique violation
          console.warn(`Duplicate callback detected and ignored: ${callbackId}`);
          
          // Fetch existing record to return the already-processed transaction
          const [existing] = await db.select()
            .from(paymentIdempotency)
            .where(eq(paymentIdempotency.callbackId, callbackId))
            .limit(1);

          return {
            success: true,
            alreadyProcessed: true,
            error: 'Callback already processed',
          };
        }
        throw error; // Re-throw if it's not a duplicate
      }

      // ========================================
      // STEP 3: Find Wallet Transaction
      // ========================================
      const [walletTxn] = await db.select()
        .from(walletTransactions)
        .where(eq(walletTransactions.merchantTransactionId, callbackData.merchantTransactionId))
        .limit(1);

      if (!walletTxn) {
        await db.update(paymentIdempotency)
          .set({ 
            status: 'failed',
            processedAt: new Date(),
          })
          .where(eq(paymentIdempotency.id, idempotencyRecord.id));

        return {
          success: false,
          error: 'Transaction not found',
        };
      }

      // ========================================
      // STEP 4: Verify with Shetab Gateway
      // ========================================
      const verifyResponse = await this.verifyPayment(
        callbackData.merchantTransactionId,
        callbackData.gatewayTransactionId
      );

      const finalStatus = verifyResponse.success ? 'completed' : 'failed';

      // ========================================
      // STEP 5: Process Payment in Transaction
      // ========================================
      await db.transaction(async (tx) => {
        // Update wallet transaction
        await tx.update(walletTransactions)
          .set({
            status: finalStatus,
            shetabTransactionId: callbackData.gatewayTransactionId,
            shetabReferenceNumber: callbackData.referenceNumber,
            cardNumber: callbackData.cardNumber ? this.maskCardNumber(callbackData.cardNumber) : null,
            gatewayResponse: callbackData,
            completedAt: verifyResponse.success ? new Date() : null,
          })
          .where(eq(walletTransactions.id, walletTxn.id));

        // Credit wallet balance ONLY if payment was successful
        if (verifyResponse.success) {
          // Use atomic SQL to prevent race conditions
          await tx.execute(`
            UPDATE users 
            SET wallet_balance = wallet_balance + ${parseInt(walletTxn.amount)}
            WHERE id = ${walletTxn.userId}
          `);
        }

        // Mark idempotency record as completed
        await tx.update(paymentIdempotency)
          .set({
            status: finalStatus,
            processedAt: new Date(),
          })
          .where(eq(paymentIdempotency.id, idempotencyRecord.id));
      });

      return {
        success: verifyResponse.success,
        transaction: walletTxn,
      };
    } catch (error) {
      console.error('Shetab callback handling error:', error);
      
      // Try to mark idempotency record as failed
      try {
        await db.update(paymentIdempotency)
          .set({ 
            status: 'failed',
            processedAt: new Date(),
          })
          .where(eq(paymentIdempotency.callbackId, callbackId));
      } catch (updateError) {
        console.error('Failed to update idempotency record:', updateError);
      }

      return {
        success: false,
        error: 'Internal error processing callback',
      };
    }
  }

  /**
   * Verify payment with Shetab gateway
   */
  private async verifyPayment(
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

      const signature = this.generateSignature(verifyData, this.config.secretKey);

      const response = await fetch(`${this.config.gatewayUrl}/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
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
   * Verify callback signature to prevent fraud
   */
  private verifyCallbackSignature(callbackData: ShetabCallbackData): boolean {
    const { signature, ...dataToSign } = callbackData;
    const expectedSignature = this.generateSignature(dataToSign, this.config.secretKey);
    
    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  }

  /**
   * Generate unique merchant transaction ID
   */
  private generateMerchantTransactionId(): string {
    const timestamp = Date.now().toString();
    const random = crypto.randomBytes(4).toString('hex');
    return `MLI_${timestamp}_${random}`;
  }

  /**
   * Generate HMAC signature for Shetab API requests
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
 * Create Shetab service instance with configuration from environment
 */
export function createShetabServiceV2(): ShetabPaymentServiceV2 | null {
  const config: ShetabConfig = {
    merchantId: process.env.SHETAB_MERCHANT_ID || '',
    terminalId: process.env.SHETAB_TERMINAL_ID || '',
    secretKey: process.env.SHETAB_SECRET_KEY || '',
    gatewayUrl: process.env.SHETAB_GATEWAY_URL || 'https://gateway.shetab.ir/api/v1',
    callbackUrl: process.env.SHETAB_CALLBACK_URL || `${process.env.BASE_URL}/api/payments/shetab/callback`,
  };

  // Validate required configuration
  if (!config.merchantId || !config.terminalId || !config.secretKey) {
    console.warn('⚠️  Shetab payment gateway not configured. Missing required environment variables.');
    return null;
  }

  return new ShetabPaymentServiceV2(config);
}
