import type { PaymentGateway } from './gateway.interface.js';
import { createZarinpalAdapter } from './adapters/zarinpal-adapter.js';
import { createIDPayAdapter } from './adapters/idpay-adapter.js';
import { createZibalAdapter } from './adapters/zibal-adapter.js';
import { getGatewaySettings, getActiveGatewayName, getAllGatewaySettings } from './gateway-config-store.js';
import type { GatewayName } from './gateway-config-store.js';

export type { GatewayName };

function buildCallbackUrl(gateway: GatewayName): string {
  const base = process.env.BASE_URL ?? process.env.APP_URL ?? 'http://localhost:5000';
  return `${base}/api/payments/${gateway}/callback`;
}

export async function getActiveGateway(): Promise<PaymentGateway | null> {
  try {
    const activeGateway = await getActiveGatewayName();

    switch (activeGateway) {
      case 'zarinpal': {
        const cfg = await getGatewaySettings('zarinpal');
        if (!cfg.isEnabled || !cfg.credentials.merchantId) return null;
        return createZarinpalAdapter({
          zarinpalEnabled: cfg.isEnabled,
          zarinpalMerchantId: cfg.credentials.merchantId,
          zarinpalSandbox: cfg.sandboxMode,
        }, buildCallbackUrl('zarinpal'));
      }
      case 'idpay': {
        const cfg = await getGatewaySettings('idpay');
        if (!cfg.isEnabled || !cfg.credentials.apiKey) return null;
        return createIDPayAdapter({
          idpayEnabled: cfg.isEnabled,
          idpayApiKey: cfg.credentials.apiKey,
          idpaySandbox: cfg.sandboxMode,
        }, buildCallbackUrl('idpay'));
      }
      case 'zibal': {
        const cfg = await getGatewaySettings('zibal');
        if (!cfg.isEnabled || !cfg.credentials.merchantId) return null;
        return createZibalAdapter({
          zibalEnabled: cfg.isEnabled,
          zibalMerchantId: cfg.credentials.merchantId,
          zibalSandbox: cfg.sandboxMode,
        }, buildCallbackUrl('zibal'));
      }
      case 'mellat':
        console.error('Mellat gateway selected but not yet implemented. Please choose another gateway.');
        return null;
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
              return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
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

export interface PublicGatewayConfig {
  activeGateway: GatewayName;
  gateways: Record<GatewayName, {
    isEnabled: boolean;
    sandboxMode: boolean;
    hasCredentials: boolean;
  }>;
}

export async function getPublicGatewayConfig(): Promise<PublicGatewayConfig> {
  const [activeGateway, allSettings] = await Promise.all([
    getActiveGatewayName(),
    getAllGatewaySettings(),
  ]);

  const gateways: Record<string, { isEnabled: boolean; sandboxMode: boolean; hasCredentials: boolean }> = {};
  for (const [name, settings] of Object.entries(allSettings)) {
    gateways[name] = {
      isEnabled: settings.isEnabled,
      sandboxMode: settings.sandboxMode,
      hasCredentials: settings.hasCredentials,
    };
  }

  return {
    activeGateway,
    gateways: gateways as Record<GatewayName, { isEnabled: boolean; sandboxMode: boolean; hasCredentials: boolean }>,
  };
}
