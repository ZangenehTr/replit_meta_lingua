import type { Express } from 'express';
import { storage } from '../storage.js';
import { db } from '../db.js';
import { eq } from 'drizzle-orm';
import { walletTransactions, coursePayments } from '../../shared/schema.js';
import { getActiveGateway, getGatewayConfig } from './gateway-factory.js';
import type { GatewayName } from './gateway-factory.js';
import { createZarinpalAdapter } from './adapters/zarinpal-adapter.js';
import { createIDPayAdapter } from './adapters/idpay-adapter.js';
import { createZibalAdapter } from './adapters/zibal-adapter.js';
import { encryptCredential, isCredentialSet } from '../utils/gateway-crypto.js';

const SENTINEL = '***';

function shouldUpdate(value: unknown): value is string {
  return typeof value === 'string' && value.length > 0 && value !== SENTINEL;
}

export function registerPaymentGatewayRoutes(
  app: Express,
  authenticateToken: unknown,
  requireRole: (roles: string[]) => unknown
): void {
  // ─── Admin: Get gateway config (no secrets returned) ──────────────────────
  app.get(
    '/api/admin/payment-gateway/config',
    authenticateToken as never,
    requireRole(['Admin']) as never,
    async (_req: never, res: { json: (v: unknown) => void; status: (c: number) => { json: (v: unknown) => void } }) => {
      try {
        const config = await getGatewayConfig();
        res.json(config);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to fetch gateway config', error: msg });
      }
    }
  );

  // ─── Admin: Update gateway config (encrypt sensitive fields) ──────────────
  app.put(
    '/api/admin/payment-gateway/config',
    authenticateToken as never,
    requireRole(['Admin']) as never,
    async (req: { body: Record<string, unknown> }, res: { json: (v: unknown) => void; status: (c: number) => { json: (v: unknown) => void } }) => {
      try {
        const updates: Record<string, unknown> = {};
        const body = req.body;

        if (body.activePaymentGateway !== undefined) {
          updates.activePaymentGateway = body.activePaymentGateway;
        }

        // Boolean / non-sensitive fields — always update if present
        const boolFields = [
          'zarinpalEnabled', 'zarinpalSandbox',
          'idpayEnabled', 'idpaySandbox',
          'zibalEnabled', 'zibalSandbox',
          'mellatEnabled', 'mellatSandbox',
        ] as const;
        for (const f of boolFields) {
          if (body[f] !== undefined) updates[f] = body[f];
        }

        // Sensitive string fields — only write when client sends a real value (not '***')
        if (shouldUpdate(body.zarinpalMerchantId)) {
          updates.zarinpalMerchantId = encryptCredential(body.zarinpalMerchantId);
        }
        if (shouldUpdate(body.idpayApiKey)) {
          updates.idpayApiKey = encryptCredential(body.idpayApiKey);
        }
        if (shouldUpdate(body.zibalMerchantId)) {
          updates.zibalMerchantId = encryptCredential(body.zibalMerchantId);
        }
        if (shouldUpdate(body.mellatTerminalId)) {
          updates.mellatTerminalId = encryptCredential(body.mellatTerminalId);
        }
        if (shouldUpdate(body.mellatUsername)) {
          updates.mellatUsername = encryptCredential(body.mellatUsername);
        }
        if (shouldUpdate(body.mellatPassword)) {
          updates.mellatPassword = encryptCredential(body.mellatPassword);
        }

        if (Object.keys(updates).length === 0) {
          res.json({ success: true, message: 'No changes to save' });
          return;
        }

        await storage.updateAdminSettings(updates);
        const config = await getGatewayConfig();
        res.json({ success: true, config });
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ message: 'Failed to update gateway config', error: msg });
      }
    }
  );

  // ─── Admin: Test gateway connectivity ─────────────────────────────────────
  app.post(
    '/api/admin/payment-gateway/test',
    authenticateToken as never,
    requireRole(['Admin']) as never,
    async (req: { body: { gateway: GatewayName } }, res: { json: (v: unknown) => void; status: (c: number) => { json: (v: unknown) => void } }) => {
      try {
        const { gateway } = req.body;
        const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
        const base = process.env.BASE_URL ?? 'http://localhost:5000';
        let testResult: { success: boolean; error?: string } = { success: false, error: 'Unknown gateway' };

        if (gateway === 'zarinpal') {
          const adapter = createZarinpalAdapter(settings, `${base}/api/payments/zarinpal/callback`);
          if (!adapter) {
            testResult = { success: false, error: 'Zarinpal not configured or disabled' };
          } else {
            const r = await adapter.initiate({
              amount: 1000,
              orderId: `TEST_${Date.now()}`,
              description: 'Gateway connectivity test',
              callbackUrl: `${base}/api/payments/zarinpal/callback`,
            });
            testResult = { success: r.success, error: r.error };
          }
        } else if (gateway === 'idpay') {
          const adapter = createIDPayAdapter(settings, `${base}/api/payments/idpay/callback`);
          if (!adapter) {
            testResult = { success: false, error: 'IDPay not configured or disabled' };
          } else {
            const r = await adapter.initiate({
              amount: 1000,
              orderId: `TEST_${Date.now()}`,
              description: 'Gateway connectivity test',
              callbackUrl: `${base}/api/payments/idpay/callback`,
            });
            testResult = { success: r.success, error: r.error };
          }
        } else if (gateway === 'zibal') {
          const adapter = createZibalAdapter(settings, `${base}/api/payments/zibal/callback`);
          if (!adapter) {
            testResult = { success: false, error: 'Zibal not configured or disabled' };
          } else {
            const r = await adapter.initiate({
              amount: 1000,
              orderId: `TEST_${Date.now()}`,
              description: 'Gateway connectivity test',
              callbackUrl: `${base}/api/payments/zibal/callback`,
            });
            testResult = { success: r.success, error: r.error };
          }
        } else if (gateway === 'shetab') {
          const { createShetabService } = await import('../shetab-service.js');
          const svc = createShetabService();
          testResult = { success: !!svc, error: svc ? undefined : 'Shetab not configured' };
        }

        res.json(testResult);
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Unknown error';
        res.status(500).json({ success: false, error: msg });
      }
    }
  );

  // ─── Shared callback dispatcher ────────────────────────────────────────────
  async function handleGatewayCallback(
    gatewayName: GatewayName,
    orderId: string,
    transactionId: string,
    amount: number | undefined,
    gatewayData: { transactionId?: string; referenceNumber?: string; cardNumber?: string },
    status: 'completed' | 'failed' | 'cancelled',
    res: { redirect: (url: string) => void; status: (c: number) => { json: (v: unknown) => void } }
  ): Promise<void> {
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
            .set({
              gatewayName,
              gatewayTransactionId: gatewayData.transactionId,
              gatewayReferenceNumber: gatewayData.referenceNumber,
            })
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
          message: `Your payment of ${amount?.toLocaleString('fa-IR') ?? ''} IRR was successful. Reference: ${gatewayData.referenceNumber ?? transactionId}`,
          type: 'success',
        });
      }
    } else {
      if (orderId.startsWith('COURSE_')) {
        const [cp] = await db.select().from(coursePayments).where(eq(coursePayments.merchantTransactionId, orderId));
        if (cp) {
          userId = cp.userId;
          await storage.updateCoursePaymentStatus(cp.id, 'failed', {});
        }
      } else if (orderId.startsWith('WALLET_')) {
        const [wt] = await db.select().from(walletTransactions).where(eq(walletTransactions.merchantTransactionId, orderId));
        if (wt) {
          userId = wt.userId;
          await storage.updateWalletTransactionStatus(wt.id, 'failed', {});
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

    const frontendUrl = process.env.FRONTEND_URL ?? '';
    const redirectUrl = status === 'completed'
      ? `${frontendUrl}/${redirectPath}?payment=success`
      : `${frontendUrl}/dashboard?payment=failed`;

    res.redirect(redirectUrl);
  }

  // ─── Zarinpal GET callback ─────────────────────────────────────────────────
  app.get('/api/payments/zarinpal/callback', async (req: { query: Record<string, string> }, res: never) => {
    try {
      const { Authority, Status } = (req as unknown as { query: Record<string, string> }).query;
      if (!Authority || Status !== 'OK') {
        return (res as unknown as { redirect: (u: string) => void }).redirect(
          `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=cancelled`
        );
      }

      const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
      const base = process.env.BASE_URL ?? 'http://localhost:5000';
      const adapter = createZarinpalAdapter(settings, `${base}/api/payments/zarinpal/callback`);
      if (!adapter) {
        return (res as unknown as { status: (c: number) => { json: (v: unknown) => void } })
          .status(503).json({ message: 'Zarinpal not configured' });
      }

      // Find order by stored authority
      const [walletTxn] = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.shetabTransactionId, Authority));
      const [coursePmt] = await db.select().from(coursePayments)
        .where(eq(coursePayments.gatewayTransactionId, Authority));

      const record = walletTxn ?? coursePmt;
      const orderId = record?.merchantTransactionId;

      if (!orderId) {
        console.error('Zarinpal callback: no matching order for authority', Authority);
        return (res as unknown as { redirect: (u: string) => void }).redirect(
          `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=failed`
        );
      }

      const amount = record && 'amount' in record ? Number(record.amount) : undefined;
      const verifyResult = await adapter.verify({ orderId, transactionId: Authority, amount });

      await handleGatewayCallback(
        'zarinpal', orderId, Authority, amount,
        { transactionId: Authority, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res as unknown as { redirect: (u: string) => void; status: (c: number) => { json: (v: unknown) => void } }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('Zarinpal callback error:', msg);
      (res as unknown as { redirect: (u: string) => void }).redirect(
        `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=error`
      );
    }
  });

  // ─── IDPay POST callback ───────────────────────────────────────────────────
  app.post('/api/payments/idpay/callback', async (req: { body: Record<string, string> }, res: never) => {
    try {
      const { id, order_id, status } = (req as unknown as { body: Record<string, string> }).body;
      if (!order_id) {
        return (res as unknown as { redirect: (u: string) => void }).redirect(
          `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=failed`
        );
      }

      if (status !== '10') {
        await handleGatewayCallback('idpay', order_id, id, undefined, {}, 'failed',
          res as unknown as { redirect: (u: string) => void; status: (c: number) => { json: (v: unknown) => void } });
        return;
      }

      const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
      const base = process.env.BASE_URL ?? 'http://localhost:5000';
      const adapter = createIDPayAdapter(settings, `${base}/api/payments/idpay/callback`);
      if (!adapter) {
        return (res as unknown as { status: (c: number) => { json: (v: unknown) => void } })
          .status(503).json({ message: 'IDPay not configured' });
      }

      const verifyResult = await adapter.verify({ orderId: order_id, transactionId: id });
      await handleGatewayCallback(
        'idpay', order_id, id, verifyResult.amount,
        { transactionId: id, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res as unknown as { redirect: (u: string) => void; status: (c: number) => { json: (v: unknown) => void } }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('IDPay callback error:', msg);
      (res as unknown as { redirect: (u: string) => void }).redirect(
        `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=error`
      );
    }
  });

  // ─── Zibal GET callback ────────────────────────────────────────────────────
  app.get('/api/payments/zibal/callback', async (req: { query: Record<string, string> }, res: never) => {
    try {
      const { trackId, success, orderId } = (req as unknown as { query: Record<string, string> }).query;
      if (!orderId || success !== '1') {
        return (res as unknown as { redirect: (u: string) => void }).redirect(
          `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=cancelled`
        );
      }

      const settings = ((await storage.getAdminSettings()) ?? {}) as Record<string, unknown>;
      const base = process.env.BASE_URL ?? 'http://localhost:5000';
      const adapter = createZibalAdapter(settings, `${base}/api/payments/zibal/callback`);
      if (!adapter) {
        return (res as unknown as { status: (c: number) => { json: (v: unknown) => void } })
          .status(503).json({ message: 'Zibal not configured' });
      }

      const verifyResult = await adapter.verify({ orderId, transactionId: trackId });
      await handleGatewayCallback(
        'zibal', orderId, trackId, verifyResult.amount,
        { transactionId: trackId, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res as unknown as { redirect: (u: string) => void; status: (c: number) => { json: (v: unknown) => void } }
      );
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : 'Unknown error';
      console.error('Zibal callback error:', msg);
      (res as unknown as { redirect: (u: string) => void }).redirect(
        `${process.env.FRONTEND_URL ?? ''}/dashboard?payment=error`
      );
    }
  });
}
