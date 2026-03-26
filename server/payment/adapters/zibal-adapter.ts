import type { PaymentGateway, PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../gateway.interface.js';

interface ZibalConfig {
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
}

export class ZibalAdapter implements PaymentGateway {
  name = 'zibal';
  private config: ZibalConfig;

  constructor(config: ZibalConfig) {
    this.config = config;
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const merchant = this.config.sandbox ? 'zibal' : this.config.merchantId;
      const response = await fetch('https://gateway.zibal.ir/v1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          amount: request.amount,
          callbackUrl: request.callbackUrl,
          description: request.description,
          orderId: request.orderId,
          mobile: request.customerPhone,
        }),
      });

      const result = await response.json();

      if (result.result === 100) {
        return {
          success: true,
          gatewayUrl: `https://gateway.zibal.ir/start/${result.trackId}`,
          transactionId: String(result.trackId),
        };
      }

      return {
        success: false,
        error: `Zibal error: result code ${result.result} (${result.message || 'unknown'})`,
      };
    } catch (error: any) {
      console.error('Zibal initiate error:', error);
      return { success: false, error: 'Network error contacting Zibal' };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const merchant = this.config.sandbox ? 'zibal' : this.config.merchantId;
      const response = await fetch('https://gateway.zibal.ir/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant,
          trackId: Number(request.transactionId),
        }),
      });

      const result = await response.json();

      if (result.result === 100) {
        return {
          success: true,
          referenceNumber: String(result.refNumber || result.trackId),
          cardNumber: result.cardNumber,
          amount: result.amount,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: result.status === -2 ? 'cancelled' : 'failed',
        error: `Zibal verify error: result ${result.result}`,
      };
    } catch (error: any) {
      console.error('Zibal verify error:', error);
      return { success: false, status: 'failed', error: 'Network error verifying Zibal payment' };
    }
  }
}

export function createZibalAdapter(settings: any, callbackUrl: string): ZibalAdapter | null {
  if (!settings?.zibalEnabled || !settings?.zibalMerchantId) return null;
  return new ZibalAdapter({
    merchantId: settings.zibalMerchantId,
    sandbox: settings.zibalSandbox ?? true,
    callbackUrl,
  });
}
