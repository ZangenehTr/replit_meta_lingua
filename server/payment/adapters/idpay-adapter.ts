import type { PaymentGateway, PaymentInitRequest, PaymentInitResponse, PaymentVerifyRequest, PaymentVerifyResponse } from '../gateway.interface.js';

interface IDPayConfig {
  apiKey: string;
  sandbox: boolean;
  callbackUrl: string;
}

export class IDPayAdapter implements PaymentGateway {
  name = 'idpay';
  private config: IDPayConfig;

  constructor(config: IDPayConfig) {
    this.config = config;
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const response = await fetch('https://api.idpay.ir/v1.1/payment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey,
          'X-SANDBOX': this.config.sandbox ? '1' : '0',
        },
        body: JSON.stringify({
          order_id: request.orderId,
          amount: request.amount,
          name: '',
          phone: request.customerPhone || '',
          mail: request.customerEmail || '',
          desc: request.description,
          callback: request.callbackUrl,
        }),
      });

      const result = await response.json();

      if (response.ok && result.id && result.link) {
        return {
          success: true,
          gatewayUrl: result.link,
          transactionId: result.id,
        };
      }

      return {
        success: false,
        error: result.error_message || `IDPay error code: ${result.error_code}`,
      };
    } catch (error: any) {
      console.error('IDPay initiate error:', error);
      return { success: false, error: 'Network error contacting IDPay' };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await fetch('https://api.idpay.ir/v1.1/payment/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-API-KEY': this.config.apiKey,
          'X-SANDBOX': this.config.sandbox ? '1' : '0',
        },
        body: JSON.stringify({
          id: request.transactionId,
          order_id: request.orderId,
        }),
      });

      const result = await response.json();

      if (response.ok && result.status === 100) {
        return {
          success: true,
          referenceNumber: String(result.track_id),
          cardNumber: result.payment?.card_no,
          amount: result.amount,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: result.status === 2 ? 'cancelled' : 'failed',
        error: result.error_message || `IDPay verify error: ${result.error_code}`,
      };
    } catch (error: any) {
      console.error('IDPay verify error:', error);
      return { success: false, status: 'failed', error: 'Network error verifying IDPay payment' };
    }
  }
}

export function createIDPayAdapter(settings: any, callbackUrl: string): IDPayAdapter | null {
  if (!settings?.idpayEnabled || !settings?.idpayApiKey) return null;
  return new IDPayAdapter({
    apiKey: settings.idpayApiKey,
    sandbox: settings.idpaySandbox ?? true,
    callbackUrl,
  });
}
