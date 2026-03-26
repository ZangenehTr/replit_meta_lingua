import type { PaymentGateway, PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../gateway.interface.js';

interface ZarinpalConfig {
  merchantId: string;
  sandbox: boolean;
  callbackUrl: string;
}

export class ZarinpalAdapter implements PaymentGateway {
  name = 'zarinpal';
  private config: ZarinpalConfig;

  constructor(config: ZarinpalConfig) {
    this.config = config;
  }

  private get baseUrl(): string {
    return this.config.sandbox
      ? 'https://sandbox.zarinpal.com/pg/v4/payment'
      : 'https://api.zarinpal.com/pg/v4/payment';
  }

  private get redirectBase(): string {
    return this.config.sandbox
      ? 'https://sandbox.zarinpal.com/pg/StartPay'
      : 'https://www.zarinpal.com/pg/StartPay';
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/request.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: this.config.merchantId,
          amount: request.amount,
          callback_url: request.callbackUrl,
          description: request.description,
          metadata: {
            mobile: request.customerPhone,
            email: request.customerEmail,
            order_id: request.orderId,
          },
        }),
      });

      const result = await response.json();

      if (result.data?.code === 100) {
        const authority = result.data.authority;
        return {
          success: true,
          gatewayUrl: `${this.redirectBase}/${authority}`,
          transactionId: authority,
        };
      }

      return {
        success: false,
        error: result.errors?.message || `Zarinpal error code: ${result.data?.code}`,
      };
    } catch (error: any) {
      console.error('Zarinpal initiate error:', error);
      return { success: false, error: 'Network error contacting Zarinpal' };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await fetch(`${this.baseUrl}/verify.json`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant_id: this.config.merchantId,
          amount: request.amount,
          authority: request.transactionId,
        }),
      });

      const result = await response.json();

      if (result.data?.code === 100 || result.data?.code === 101) {
        return {
          success: true,
          referenceNumber: String(result.data.ref_id),
          cardNumber: result.data.card_pan,
          amount: result.data.fee,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: 'failed',
        error: result.errors?.message || `Zarinpal verify error: ${result.data?.code}`,
      };
    } catch (error: any) {
      console.error('Zarinpal verify error:', error);
      return { success: false, status: 'failed', error: 'Network error verifying Zarinpal payment' };
    }
  }
}

export function createZarinpalAdapter(settings: any, callbackUrl: string): ZarinpalAdapter | null {
  if (!settings?.zarinpalEnabled || !settings?.zarinpalMerchantId) return null;
  return new ZarinpalAdapter({
    merchantId: settings.zarinpalMerchantId,
    sandbox: settings.zarinpalSandbox ?? true,
    callbackUrl,
  });
}
