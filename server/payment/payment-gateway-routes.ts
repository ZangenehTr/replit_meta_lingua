import type { Express, Request, Response } from 'express';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { walletTransactions, coursePayments } from '../../shared/schema.js';
import { getActiveGateway, getPublicGatewayConfig } from './gateway-factory.js';
import { createZarinpalAdapter } from './adapters/zarinpal-adapter.js';
import { createIDPayAdapter } from './adapters/idpay-adapter.js';
import { createZibalAdapter } from './adapters/zibal-adapter.js';
import {
  getGatewaySettings, updateGatewaySettings,
  getActiveGatewayName, setActiveGatewayName,
} from './gateway-config-store.js';
import type { GatewayName } from './gateway-config-store.js';
import { storage } from '../storage.js';

// ─── Shared callback dispatcher ──────────────────────────────────────────────

async function handleGatewayCallback(
  gatewayName: GatewayName,
  orderId: string,
  transactionId: string,
  amount: number | undefined,
  gatewayData: { transactionId?: string; referenceNumber?: string; cardNumber?: string },
  status: 'completed' | 'failed' | 'cancelled',
  res: Response
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? '';
  let redirectPath = 'dashboard';
  let userId = 0;

  if (status === 'completed') {
    if (orderId.startsWith('COURSE_')) {
      const [coursePayment] = await db.select().from(coursePayments)
        .where(eq(coursePayments.merchantTransactionId, orderId));
      if (coursePayment && coursePayment.status !== 'completed') {
        userId = coursePayment.userId;
        await storage.updateCoursePaymentStatus(coursePayment.id, 'completed', {
          shetabTransactionId: gatewayData.transactionId ?? '',
          shetabReferenceNumber: gatewayData.referenceNumber ?? '',
          cardNumber: gatewayData.cardNumber ?? '',
        });
        await db.update(coursePayments)
          .set({ gatewayName, gatewayTransactionId: gatewayData.transactionId, gatewayReferenceNumber: gatewayData.referenceNumber })
          .where(eq(coursePayments.id, coursePayment.id));
      }
      redirectPath = 'courses';
    } else if (orderId.startsWith('WALLET_')) {
      const [walletTxn] = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.merchantTransactionId, orderId));
      if (walletTxn && walletTxn.status !== 'completed') {
        userId = walletTxn.userId;
        await storage.updateWalletTransactionStatus(walletTxn.id, 'completed', {
          shetabTransactionId: gatewayData.transactionId ?? '',
          shetabReferenceNumber: gatewayData.referenceNumber ?? '',
          cardNumber: gatewayData.cardNumber ?? '',
        });
        await db.update(walletTransactions)
          .set({ gatewayName })
          .where(eq(walletTransactions.id, walletTxn.id));
      }
      redirectPath = 'student/wallet';
    }

    if (userId) {
      await storage.createNotification({
        userId,
        title: 'Payment Successful',
        message: `Payment confirmed. Reference: ${gatewayData.referenceNumber ?? transactionId}`,
        type: 'success',
      });
    }
  } else {
    if (orderId.startsWith('COURSE_')) {
      const [cp] = await db.select().from(coursePayments).where(eq(coursePayments.merchantTransactionId, orderId));
      if (cp) {
        userId = cp.userId;
        await storage.updateCoursePaymentStatus(cp.id, 'failed', {});
        await db.update(coursePayments)
          .set({ gatewayName, gatewayTransactionId: transactionId || undefined })
          .where(eq(coursePayments.id, cp.id));
      }
    } else if (orderId.startsWith('WALLET_')) {
      const [wt] = await db.select().from(walletTransactions).where(eq(walletTransactions.merchantTransactionId, orderId));
      if (wt) {
        userId = wt.userId;
        await storage.updateWalletTransactionStatus(wt.id, 'failed', {});
        await db.update(walletTransactions)
          .set({ gatewayName })
          .where(eq(walletTransactions.id, wt.id));
      }
    }
    if (userId) {
      await storage.createNotification({
        userId,
        title: 'Payment Failed',
        message: 'Your payment could not be completed. Please try again.',
        type: 'error',
      });
    }
  }

  const redirectUrl = status === 'completed'
    ? `${frontendUrl}/${redirectPath}?payment=success`
    : `${frontendUrl}/dashboard?payment=failed`;

  res.redirect(redirectUrl);
}

// ─── Unified gateway callback (GET + POST) ──────────────────────────────────
// Single entry point: /api/payments/:gateway/callback
// Accepts both GET (Zarinpal, Zibal) and POST (IDPay).

async function handleUnifiedCallback(
  gatewayName: GatewayName,
  req: Request,
  res: Response
): Promise<void> {
  const frontendUrl = process.env.FRONTEND_URL ?? '';
  const base = process.env.BASE_URL ?? 'http://localhost:5000';

  try {
    switch (gatewayName) {
      case 'zarinpal': {
        const { Authority, Status } = req.query as Record<string, string>;
        if (!Authority || Status !== 'OK') {
          res.redirect(`${frontendUrl}/dashboard?payment=cancelled`);
          return;
        }
        const cfg = await getGatewaySettings('zarinpal');
        const adapter = createZarinpalAdapter({
          zarinpalEnabled: cfg.isEnabled,
          zarinpalMerchantId: cfg.credentials.merchantId ?? '',
          zarinpalSandbox: cfg.sandboxMode,
        }, `${base}/api/payments/zarinpal/callback`);
        if (!adapter) {
          res.status(503).json({ message: 'Zarinpal not configured' });
          return;
        }
        // Look up order by stored authority token — check both columns for backward compat
        const [walletByAuth] = await db.select().from(walletTransactions)
          .where(eq(walletTransactions.gatewayTransactionId, Authority));
        const [walletByLegacyAuth] = !walletByAuth
          ? await db.select().from(walletTransactions).where(eq(walletTransactions.shetabTransactionId, Authority))
          : [undefined];
        const [courseByAuth] = await db.select().from(coursePayments)
          .where(eq(coursePayments.gatewayTransactionId, Authority));
        const record = walletByAuth ?? walletByLegacyAuth ?? courseByAuth;
        if (!record?.merchantTransactionId) {
          console.error('Zarinpal callback: no matching order for authority', Authority);
          res.redirect(`${frontendUrl}/dashboard?payment=failed`);
          return;
        }
        const amount = 'amount' in record ? Number(record.amount) : undefined;
        const verifyResult = await adapter.verify({ orderId: record.merchantTransactionId, transactionId: Authority, amount });
        await handleGatewayCallback(
          'zarinpal', record.merchantTransactionId, Authority, amount,
          { transactionId: Authority, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
          verifyResult.status, res
        );
        break;
      }
      case 'idpay': {
        const body = req.body as Record<string, unknown>;
        const id = String(body.id ?? '');
        const order_id = String(body.order_id ?? '');
        // IDPay delivers status as either numeric 10 or string "10" — normalize
        const statusCode = String(body.status ?? '');
        if (!order_id) {
          res.redirect(`${frontendUrl}/dashboard?payment=failed`);
          return;
        }
        if (statusCode !== '10') {
          await handleGatewayCallback('idpay', order_id, id ?? '', undefined, {}, 'failed', res);
          return;
        }
        const cfg = await getGatewaySettings('idpay');
        const adapter = createIDPayAdapter({
          idpayEnabled: cfg.isEnabled,
          idpayApiKey: cfg.credentials.apiKey ?? '',
          idpaySandbox: cfg.sandboxMode,
        }, `${base}/api/payments/idpay/callback`);
        if (!adapter) {
          res.status(503).json({ message: 'IDPay not configured' });
          return;
        }
        const verifyResult = await adapter.verify({ orderId: order_id, transactionId: id ?? '' });
        await handleGatewayCallback(
          'idpay', order_id, id ?? '', verifyResult.amount,
          { transactionId: id, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
          verifyResult.status, res
        );
        break;
      }
      case 'zibal': {
        const { trackId, success, orderId } = req.query as Record<string, string>;
        if (!orderId || success !== '1') {
          res.redirect(`${frontendUrl}/dashboard?payment=cancelled`);
          return;
        }
        const cfg = await getGatewaySettings('zibal');
        const adapter = createZibalAdapter({
          zibalEnabled: cfg.isEnabled,
          zibalMerchantId: cfg.credentials.merchantId ?? '',
          zibalSandbox: cfg.sandboxMode,
        }, `${base}/api/payments/zibal/callback`);
        if (!adapter) {
          res.status(503).json({ message: 'Zibal not configured' });
          return;
        }
        const verifyResult = await adapter.verify({ orderId, transactionId: trackId ?? '' });
        await handleGatewayCallback(
          'zibal', orderId, trackId ?? '', verifyResult.amount,
          { transactionId: trackId, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
          verifyResult.status, res
        );
        break;
      }
      default:
        res.status(400).json({ message: `Unsupported gateway callback: ${gatewayName}` });
    }
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : 'Unknown error';
    console.error(`${gatewayName} callback error:`, msg);
    res.redirect(`${frontendUrl}/dashboard?payment=error`);
  }
}

const ALLOWED_GATEWAYS: GatewayName[] = ['shetab', 'zarinpal', 'idpay', 'zibal', 'mellat'];

function isGatewayName(g: string): g is GatewayName {
  return ALLOWED_GATEWAYS.includes(g as GatewayName);
}

export function registerPaymentGatewayRoutes(
  app: Express,
  authenticateToken: (req: Request, res: Response, next: () => void) => void,
  requireRole: (roles: string[]) => (req: Request, res: Response, next: () => void) => void
): void {

  // ─── GET config (no secrets returned — only hasCredentials flags) ──────────
  app.get('/api/admin/payment-gateway/config',
    authenticateToken,
    requireRole(['Admin']),
    async (_req: Request, res: Response) => {
      try {
        const config = await getPublicGatewayConfig();
        res.json(config);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to fetch gateway config', error: msg });
      }
    }
  );

  // ─── PUT config (only writes fields where real values are provided) ─────────
  app.put('/api/admin/payment-gateway/config',
    authenticateToken,
    requireRole(['Admin']),
    async (req: Request, res: Response) => {
      try {
        const body = req.body as {
          activePaymentGateway?: GatewayName;
          zarinpalEnabled?: boolean;
          zarinpalSandbox?: boolean;
          zarinpalMerchantId?: string;
          idpayEnabled?: boolean;
          idpaySandbox?: boolean;
          idpayApiKey?: string;
          zibalEnabled?: boolean;
          zibalSandbox?: boolean;
          zibalMerchantId?: string;
          mellatEnabled?: boolean;
          mellatSandbox?: boolean;
          mellatTerminalId?: string;
          mellatUsername?: string;
          mellatPassword?: string;
        };

        if (body.activePaymentGateway) {
          await setActiveGatewayName(body.activePaymentGateway);
        }

        const updates: Array<{ name: GatewayName; isEnabled?: boolean; sandboxMode?: boolean; credentials?: Record<string, string> }> = [
          {
            name: 'zarinpal',
            isEnabled: body.zarinpalEnabled,
            sandboxMode: body.zarinpalSandbox,
            credentials: body.zarinpalMerchantId ? { merchantId: body.zarinpalMerchantId } : undefined,
          },
          {
            name: 'idpay',
            isEnabled: body.idpayEnabled,
            sandboxMode: body.idpaySandbox,
            credentials: body.idpayApiKey ? { apiKey: body.idpayApiKey } : undefined,
          },
          {
            name: 'zibal',
            isEnabled: body.zibalEnabled,
            sandboxMode: body.zibalSandbox,
            credentials: body.zibalMerchantId ? { merchantId: body.zibalMerchantId } : undefined,
          },
          {
            name: 'mellat',
            isEnabled: body.mellatEnabled,
            sandboxMode: body.mellatSandbox,
            credentials: (body.mellatTerminalId || body.mellatUsername || body.mellatPassword)
              ? {
                  ...(body.mellatTerminalId && { terminalId: body.mellatTerminalId }),
                  ...(body.mellatUsername && { username: body.mellatUsername }),
                  ...(body.mellatPassword && { password: body.mellatPassword }),
                }
              : undefined,
          },
        ];

        await Promise.all(
          updates
            .filter(u => u.isEnabled !== undefined || u.sandboxMode !== undefined || u.credentials)
            .map(u => updateGatewaySettings(u.name, {
              ...(u.isEnabled !== undefined && { isEnabled: u.isEnabled }),
              ...(u.sandboxMode !== undefined && { sandboxMode: u.sandboxMode }),
              ...(u.credentials && { credentials: u.credentials }),
            }))
        );

        const config = await getPublicGatewayConfig();
        res.json({ success: true, config });
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to update gateway config', error: msg });
      }
    }
  );

  // ─── Test gateway connectivity ───────────────────────────────────────────
  app.post('/api/admin/payment-gateway/test',
    authenticateToken,
    requireRole(['Admin']),
    async (req: Request, res: Response) => {
      try {
        const { gateway } = req.body as { gateway: GatewayName };
        const base = process.env.BASE_URL ?? 'http://localhost:5000';

        if (gateway === 'shetab') {
          const { createShetabService } = await import('../shetab-service.js');
          const svc = createShetabService();
          res.json({ success: !!svc, error: svc ? undefined : 'Shetab not configured' });
          return;
        }

        const cfg = await getGatewaySettings(gateway);
        if (!cfg.hasCredentials) {
          res.json({ success: false, error: `${gateway} credentials not configured` });
          return;
        }

        let testResult: { success: boolean; error?: string } = { success: false, error: `Unsupported gateway: ${gateway}` };

        if (gateway === 'zarinpal') {
          const adapter = createZarinpalAdapter({
            zarinpalEnabled: true,
            zarinpalMerchantId: cfg.credentials.merchantId ?? '',
            zarinpalSandbox: cfg.sandboxMode,
          }, `${base}/api/payments/zarinpal/callback`);
          if (adapter) {
            const r = await adapter.initiate({ amount: 1000, orderId: `TEST_${Date.now()}`, description: 'Connectivity test', callbackUrl: `${base}/api/payments/zarinpal/callback` });
            testResult = { success: r.success, error: r.error };
          }
        } else if (gateway === 'idpay') {
          const adapter = createIDPayAdapter({
            idpayEnabled: true,
            idpayApiKey: cfg.credentials.apiKey ?? '',
            idpaySandbox: cfg.sandboxMode,
          }, `${base}/api/payments/idpay/callback`);
          if (adapter) {
            const r = await adapter.initiate({ amount: 1000, orderId: `TEST_${Date.now()}`, description: 'Connectivity test', callbackUrl: `${base}/api/payments/idpay/callback` });
            testResult = { success: r.success, error: r.error };
          }
        } else if (gateway === 'zibal') {
          const adapter = createZibalAdapter({
            zibalEnabled: true,
            zibalMerchantId: cfg.credentials.merchantId ?? '',
            zibalSandbox: cfg.sandboxMode,
          }, `${base}/api/payments/zibal/callback`);
          if (adapter) {
            const r = await adapter.initiate({ amount: 1000, orderId: `TEST_${Date.now()}`, description: 'Connectivity test', callbackUrl: `${base}/api/payments/zibal/callback` });
            testResult = { success: r.success, error: r.error };
          }
        }

        res.json(testResult);
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Unknown error';
        res.status(500).json({ success: false, error: msg });
      }
    }
  );

  // ─── Unified callback: GET (Zarinpal, Zibal) and POST (IDPay) ─────────────
  // Route: /api/payments/:gateway/callback
  // Note: /api/payments/shetab/callback is handled by the legacy shetab route.

  app.get('/api/payments/:gateway/callback', async (req: Request, res: Response) => {
    const { gateway } = req.params;
    if (!isGatewayName(gateway) || gateway === 'shetab') {
      res.status(400).json({ message: 'Invalid or unsupported gateway' });
      return;
    }
    await handleUnifiedCallback(gateway, req, res);
  });

  app.post('/api/payments/:gateway/callback', async (req: Request, res: Response) => {
    const { gateway } = req.params;
    if (!isGatewayName(gateway) || gateway === 'shetab') {
      res.status(400).json({ message: 'Invalid or unsupported gateway' });
      return;
    }
    await handleUnifiedCallback(gateway, req, res);
  });
}
