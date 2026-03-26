import type {
  PaymentGateway, PaymentInitRequest, PaymentInitResponse,
  PaymentVerifyRequest, PaymentVerifyResponse,
  PaymentRefundRequest, PaymentRefundResponse
} from '../gateway.interface.js';
import { decryptCredential } from '../../utils/gateway-crypto.js';

interface ZibalConfig {
  merchantId: string;
  sandbox: boolean;
}

export class ZibalAdapter implements PaymentGateway {
  name = 'zibal';
  private config: ZibalConfig;

  constructor(config: ZibalConfig) {
    this.config = config;
  }

  private get effectiveMerchant(): string {
    return this.config.sandbox ? 'zibal' : this.config.merchantId;
  }

  async initiate(request: PaymentInitRequest): Promise<PaymentInitResponse> {
    try {
      const response = await fetch('https://gateway.zibal.ir/v1/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: this.effectiveMerchant,
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
        error: `Zibal error: result code ${result.result} (${(result.message as string) ?? 'unknown'})`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Zibal initiate error:', msg);
      return { success: false, error: 'Network error contacting Zibal' };
    }
  }

  async verify(request: PaymentVerifyRequest): Promise<PaymentVerifyResponse> {
    try {
      const response = await fetch('https://gateway.zibal.ir/v1/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          merchant: this.effectiveMerchant,
          trackId: Number(request.transactionId),
        }),
      });

      const result = await response.json();

      if (result.result === 100) {
        return {
          success: true,
          referenceNumber: String(result.refNumber ?? result.trackId),
          cardNumber: result.cardNumber as string | undefined,
          amount: result.amount as number | undefined,
          status: 'completed',
        };
      }

      return {
        success: false,
        status: result.status === -2 ? 'cancelled' : 'failed',
        error: `Zibal verify error: result ${result.result}`,
      };
    } catch (error: unknown) {
      const msg = error instanceof Error ? error.message : 'Unknown error';
      console.error('Zibal verify error:', msg);
      return { success: false, status: 'failed', error: 'Network error verifying Zibal payment' };
    }
  }

  async refund(_request: PaymentRefundRequest): Promise<PaymentRefundResponse> {
    return {
      success: false,
      status: 'not_supported',
      error: 'Zibal does not support programmatic refunds. Use the Zibal merchant dashboard.',
    };
  }
}

export function createZibalAdapter(
  settings: { zibalEnabled?: boolean; zibalMerchantId?: string; zibalSandbox?: boolean },
  _callbackUrl: string
): ZibalAdapter | null {
  if (!settings.zibalEnabled || !settings.zibalMerchantId) return null;
  const merchantId = decryptCredential(settings.zibalMerchantId);
  return new ZibalAdapter({
    merchantId,
    sandbox: settings.zibalSandbox ?? true,
  });
}
