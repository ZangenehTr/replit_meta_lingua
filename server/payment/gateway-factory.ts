import { storage } from '../storage.js';
import type { PaymentGateway } from './gateway.interface.js';
import { createZarinpalAdapter } from './adapters/zarinpal-adapter.js';
import { createIDPayAdapter } from './adapters/idpay-adapter.js';
import { createZibalAdapter } from './adapters/zibal-adapter.js';

export type GatewayName = 'shetab' | 'zarinpal' | 'idpay' | 'zibal' | 'mellat';

export interface GatewayConfig {
  activeGateway: GatewayName;
  shetab: { merchantId: string; terminalId: string; apiKey: string; secretKey: string; sandbox: boolean; enabled: boolean };
  zarinpal: { merchantId: string; sandbox: boolean; enabled: boolean };
  idpay: { apiKey: string; sandbox: boolean; enabled: boolean };
  zibal: { merchantId: string; sandbox: boolean; enabled: boolean };
  mellat: { terminalId: string; username: string; password: string; sandbox: boolean; enabled: boolean };
}

function buildCallbackUrl(gateway: GatewayName): string {
  const base = process.env.BASE_URL || process.env.APP_URL || 'http://localhost:5000';
  return `${base}/api/payments/${gateway}/callback`;
}

export async function getActiveGateway(): Promise<PaymentGateway | null> {
  try {
    const settings = await storage.getAdminSettings() as any;
    if (!settings) return null;

    const activeGateway = (settings.activePaymentGateway as GatewayName) || 'shetab';

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
                (req.metadata as any)?.userId || 0,
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
            } catch (e: any) {
              return { success: false, error: e.message };
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
        };
      }
    }
  } catch (error) {
    console.error('Gateway factory error:', error);
    return null;
  }
}

export async function getGatewayConfig(): Promise<GatewayConfig> {
  const settings = (await storage.getAdminSettings()) as any || {};
  return {
    activeGateway: (settings.activePaymentGateway as GatewayName) || 'shetab',
    shetab: {
      merchantId: settings.shetabMerchantId || '',
      terminalId: settings.shetabTerminalId || '',
      apiKey: settings.shetabApiKey || '',
      secretKey: settings.shetabSecretKey || '',
      sandbox: settings.shetabEnvironment === 'sandbox',
      enabled: settings.shetabEnabled || false,
    },
    zarinpal: {
      merchantId: settings.zarinpalMerchantId || '',
      sandbox: settings.zarinpalSandbox ?? true,
      enabled: settings.zarinpalEnabled || false,
    },
    idpay: {
      apiKey: settings.idpayApiKey || '',
      sandbox: settings.idpaySandbox ?? true,
      enabled: settings.idpayEnabled || false,
    },
    zibal: {
      merchantId: settings.zibalMerchantId || '',
      sandbox: settings.zibalSandbox ?? true,
      enabled: settings.zibalEnabled || false,
    },
    mellat: {
      terminalId: settings.mellatTerminalId || '',
      username: settings.mellatUsername || '',
      password: settings.mellatPassword || '',
      sandbox: settings.mellatSandbox ?? true,
      enabled: settings.mellatEnabled || false,
    },
  };
}
