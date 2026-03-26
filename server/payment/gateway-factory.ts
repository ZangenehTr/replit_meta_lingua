import { storage } from '../storage.js';
import type { PaymentGateway } from './gateway.interface.js';
import { createZarinpalAdapter } from './adapters/zarinpal-adapter.js';
import { createIDPayAdapter } from './adapters/idpay-adapter.js';
import { createZibalAdapter } from './adapters/zibal-adapter.js';

export type GatewayName = 'shetab' | 'zarinpal' | 'idpay' | 'zibal' | 'mellat';

export interface GatewayConfig {
  activeGateway: GatewayName;
  shetab: { sandbox: boolean; enabled: boolean };
  zarinpal: { hasCredentials: boolean; sandbox: boolean; enabled: boolean };
  idpay: { hasCredentials: boolean; sandbox: boolean; enabled: boolean };
  zibal: { hasCredentials: boolean; sandbox: boolean; enabled: boolean };
  mellat: { hasCredentials: boolean; sandbox: boolean; enabled: boolean };
}

function buildCallbackUrl(gateway: GatewayName): string {
  const base = process.env.BASE_URL ?? process.env.APP_URL ?? 'http://localhost:5000';
  return `${base}/api/payments/${gateway}/callback`;
}

export async function getActiveGateway(): Promise<PaymentGateway | null> {
  try {
    const settings = (await storage.getAdminSettings()) as Record<string, unknown>;
    if (!settings) return null;

    const activeGateway = (settings.activePaymentGateway as GatewayName) ?? 'shetab';

    switch (activeGateway) {
      case 'zarinpal':
        return createZarinpalAdapter(settings, buildCallbackUrl('zarinpal'));
      case 'idpay':
        return createIDPayAdapter(settings, buildCallbackUrl('idpay'));
      case 'zibal':
        return createZibalAdapter(settings, buildCallbackUrl('zibal'));
      case 'shetab':
      default: {
        const { createShetabService } = await import('../shetab-service.js');
        const shetabSvc = createShetabService();
        if (!shetabSvc) return null;
        return {
          name: 'shetab',
          initiate: async (req) => {
            try {
              const result = await shetabSvc.initializePayment(
                ((req.metadata as Record<string, unknown>)?.userId as number) ?? 0,
                {
                  amount: req.amount,
                  orderId: req.orderId,
                  description: req.description,
                  customerEmail: req.customerEmail,
                  customerPhone: req.customerPhone,
                  metadata: req.metadata,
                }
              );
              return {
                success: true,
                gatewayUrl: result.gatewayUrl,
                transactionId: result.payment.merchantTransactionId ?? undefined,
              };
            } catch (e: unknown) {
              const msg = e instanceof Error ? e.message : 'Unknown error';
              return { success: false, error: msg };
            }
          },
          verify: async (req) => {
            const result = await shetabSvc.verifyPayment(req.orderId, req.transactionId);
            return {
              success: result.success,
              referenceNumber: result.referenceNumber,
              cardNumber: result.cardNumber,
              amount: result.amount,
              status: result.status,
              error: result.error,
            };
          },
          refund: async (_req) => ({
            success: false,
            status: 'not_supported' as const,
            error: 'Shetab refunds must be processed through your bank/merchant portal.',
          }),
        };
      }
    }
  } catch (error) {
    console.error('Gateway factory error:', error);
    return null;
  }
}

export async function getGatewayConfig(): Promise<GatewayConfig> {
  const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
  return {
    activeGateway: (settings.activePaymentGateway as GatewayName) ?? 'shetab',
    shetab: {
      sandbox: settings.shetabEnvironment === 'sandbox',
      enabled: (settings.shetabEnabled as boolean) ?? false,
    },
    zarinpal: {
      hasCredentials: !!settings.zarinpalMerchantId,
      sandbox: (settings.zarinpalSandbox as boolean) ?? true,
      enabled: (settings.zarinpalEnabled as boolean) ?? false,
    },
    idpay: {
      hasCredentials: !!settings.idpayApiKey,
      sandbox: (settings.idpaySandbox as boolean) ?? true,
      enabled: (settings.idpayEnabled as boolean) ?? false,
    },
    zibal: {
      hasCredentials: !!settings.zibalMerchantId,
      sandbox: (settings.zibalSandbox as boolean) ?? true,
      enabled: (settings.zibalEnabled as boolean) ?? false,
    },
    mellat: {
      hasCredentials: !!(settings.mellatTerminalId && settings.mellatUsername && settings.mellatPassword),
      sandbox: (settings.mellatSandbox as boolean) ?? true,
      enabled: (settings.mellatEnabled as boolean) ?? false,
    },
  };
}
