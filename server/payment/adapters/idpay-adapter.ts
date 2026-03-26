import type {
  PaymentGateway, PaymentInitRequest, PaymentInitResponse,
  PaymentVerifyRequest, PaymentVerifyResponse,
  PaymentRefundRequest, PaymentRefundResponse
} from '../gateway.interface.js';
import { decryptCredential } from '../../utils/gateway-crypto.js';

interface IDPayConfig {
  apiKey: string;
  sandbox: boolean;
}

export class IDPayAdapter implements PaymentGateway {
  name = 'idpay';
  private config: IDPayConfig;

  constructor(config: IDPayConfig) {
    this.config = config;
  }

  private get headers(): Record<string, string> {
    return {
      'Content-Type': 'application/json',
      'X-API-KEY': this.config.apiKey,
      'X-SANDBOX': this.config.sandbox ? '1' : '0',
    };
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const response = await fetch('https://api.idpay.ir/v1.1/payment', {
        method: 'POST',
        headers: this.headers,
        body: JSON.stringify({
          order_id: request.orderId,
          amount: request.amount,
          name: '',
          phone: request.customerPhone ?? '',
          mail: request.customerEmail ?? '',
          desc: request.description,
          callback: request.callbackUrl,
        }),
      });

      const result = await response.json();

      if (response.ok && result.id && result.link) {
        return {
          success: true,
          gatewayUrl: result.link as string,
          transactionId: result.id as string,
        };
      }

      return {
        success: false,
        error: (result.error_message as string) ?? `IDPay error code: ${result.error_code}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('IDPay initiate error:', msg);
      return { success: false, error: 'Network error contacting IDPay' };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await fetch('https://api.idpay.ir/v1.1/payment/verify', {
        method: 'POST',
        headers: this.headers,
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
          cardNumber: result.payment?.card_no as string | undefined,
          amount: result.amount as number | undefined,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: String(result.status) === '2' ? 'cancelled' : 'failed',
        error: (result.error_message as string) ?? `IDPay verify error: ${result.error_code}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('IDPay verify error:', msg);
      return { success: false, status: 'failed', error: 'Network error verifying IDPay payment' };
    }
  }

  async refund(_request: PaymentRefundRequest): Promise<PaymentRefundResponse> {
    return {
      success: false,
      status: 'not_supported',
      error: 'IDPay does not support programmatic refunds. Use the IDPay merchant dashboard.',
    };
  }
}

export function createIDPayAdapter(
  settings: { idpayEnabled?: boolean; idpayApiKey?: string; idpaySandbox?: boolean },
  _callbackUrl: string
): IDPayAdapter | null {
  if (!settings.idpayEnabled || !settings.idpayApiKey) return null;
  const apiKey = decryptCredential(settings.idpayApiKey);
  return new IDPayAdapter({
    apiKey,
    sandbox: settings.idpaySandbox ?? true,
  });
}
