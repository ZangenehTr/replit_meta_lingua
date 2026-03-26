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

export function registerPaymentGatewayRoutes(
  app: Express,
  authenticateToken: any,
  requireRole: any
) {
  // ─── Admin: Get gateway config ─────────────────────────────────────────────
  app.get(
    '/api/admin/payment-gateway/config',
    authenticateToken,
    requireRole(['Admin']),
    async (_req: any, res: any) => {
      try {
        const config = await getGatewayConfig();
        // Mask sensitive fields for the response
        const safeConfig = {
          ...config,
          shetab: { ...config.shetab, apiKey: config.shetab.apiKey ? '***' : '', secretKey: '***' },
          idpay: { ...config.idpay, apiKey: config.idpay.apiKey ? '***' : '' },
          mellat: { ...config.mellat, password: config.mellat.password ? '***' : '' },
        };
        res.json(safeConfig);
      } catch (e: any) {
        res.status(500).json({ message: 'Failed to fetch gateway config', error: e.message });
      }
    }
  );

  // ─── Admin: Update gateway config ─────────────────────────────────────────
  app.put(
    '/api/admin/payment-gateway/config',
    authenticateToken,
    requireRole(['Admin']),
    async (req: any, res: any) => {
      try {
        const updates: Record<string, any> = {};
        const {
          activePaymentGateway,
          zarinpalMerchantId, zarinpalEnabled, zarinpalSandbox,
          idpayApiKey, idpayEnabled, idpaySandbox,
          zibalMerchantId, zibalEnabled, zibalSandbox,
          mellatTerminalId, mellatUsername, mellatPassword, mellatEnabled, mellatSandbox,
        } = req.body;

        if (activePaymentGateway !== undefined) updates.activePaymentGateway = activePaymentGateway;
        if (zarinpalMerchantId !== undefined) updates.zarinpalMerchantId = zarinpalMerchantId;
        if (zarinpalEnabled !== undefined) updates.zarinpalEnabled = zarinpalEnabled;
        if (zarinpalSandbox !== undefined) updates.zarinpalSandbox = zarinpalSandbox;
        if (idpayApiKey !== undefined) updates.idpayApiKey = idpayApiKey;
        if (idpayEnabled !== undefined) updates.idpayEnabled = idpayEnabled;
        if (idpaySandbox !== undefined) updates.idpaySandbox = idpaySandbox;
        if (zibalMerchantId !== undefined) updates.zibalMerchantId = zibalMerchantId;
        if (zibalEnabled !== undefined) updates.zibalEnabled = zibalEnabled;
        if (zibalSandbox !== undefined) updates.zibalSandbox = zibalSandbox;
        if (mellatTerminalId !== undefined) updates.mellatTerminalId = mellatTerminalId;
        if (mellatUsername !== undefined) updates.mellatUsername = mellatUsername;
        if (mellatPassword !== undefined) updates.mellatPassword = mellatPassword;
        if (mellatEnabled !== undefined) updates.mellatEnabled = mellatEnabled;
        if (mellatSandbox !== undefined) updates.mellatSandbox = mellatSandbox;

        const saved = await storage.updateAdminSettings(updates);
        res.json({ success: true, settings: saved });
      } catch (e: any) {
        res.status(500).json({ message: 'Failed to update gateway config', error: e.message });
      }
    }
  );

  // ─── Admin: Test active gateway connectivity ────────────────────────────────
  app.post(
    '/api/admin/payment-gateway/test',
    authenticateToken,
    requireRole(['Admin']),
    async (req: any, res: any) => {
      try {
        const { gateway } = req.body as { gateway: GatewayName };
        const settings = (await storage.getAdminSettings()) as any;
        const base = process.env.BASE_URL || 'http://localhost:5000';

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
      } catch (e: any) {
        res.status(500).json({ success: false, error: e.message });
      }
    }
  );

  // ─── Shared callback handler (used by all gateways) ────────────────────────
  async function handleGatewayCallback(
    gatewayName: GatewayName,
    orderId: string,
    transactionId: string,
    amount: number | undefined,
    gatewayData: { transactionId?: string; referenceNumber?: string; cardNumber?: string },
    status: 'completed' | 'failed' | 'cancelled',
    res: any
  ) {
    let redirectPath = 'dashboard';
    let userId = 0;

    if (status === 'completed') {
      if (orderId.startsWith('COURSE_')) {
        const [coursePayment] = await db
          .select()
          .from(coursePayments)
          .where(eq(coursePayments.merchantTransactionId, orderId));

        if (coursePayment && coursePayment.status !== 'completed') {
          userId = coursePayment.userId;
          await storage.updateCoursePaymentStatus(coursePayment.id, 'completed', {
            shetabTransactionId: gatewayData.transactionId || '',
            shetabReferenceNumber: gatewayData.referenceNumber || '',
            cardNumber: gatewayData.cardNumber || '',
          });
          await db.update(coursePayments)
            .set({ gatewayName, gatewayTransactionId: gatewayData.transactionId, gatewayReferenceNumber: gatewayData.referenceNumber })
            .where(eq(coursePayments.id, coursePayment.id));
        }
        redirectPath = 'courses';
      } else if (orderId.startsWith('WALLET_')) {
        const [walletTxn] = await db
          .select()
          .from(walletTransactions)
          .where(eq(walletTransactions.merchantTransactionId, orderId));

        if (walletTxn && walletTxn.status !== 'completed') {
          userId = walletTxn.userId;
          await storage.updateWalletTransactionStatus(walletTxn.id, 'completed', {
            shetabTransactionId: gatewayData.transactionId || '',
            shetabReferenceNumber: gatewayData.referenceNumber || '',
            cardNumber: gatewayData.cardNumber || '',
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
          message: `Your payment of ${amount?.toLocaleString('fa-IR') || ''} IRR was successful. Reference: ${gatewayData.referenceNumber || transactionId}`,
          type: 'success',
        });
      }
    } else {
      if (orderId.startsWith('COURSE_')) {
        const [coursePayment] = await db
          .select()
          .from(coursePayments)
          .where(eq(coursePayments.merchantTransactionId, orderId));
        if (coursePayment) {
          userId = coursePayment.userId;
          await storage.updateCoursePaymentStatus(coursePayment.id, 'failed', {});
        }
      } else if (orderId.startsWith('WALLET_')) {
        const [walletTxn] = await db
          .select()
          .from(walletTransactions)
          .where(eq(walletTransactions.merchantTransactionId, orderId));
        if (walletTxn) {
          userId = walletTxn.userId;
          await storage.updateWalletTransactionStatus(walletTxn.id, 'failed', {});
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

    const frontendUrl = process.env.FRONTEND_URL || '';
    const redirectUrl = status === 'completed'
      ? `${frontendUrl}/${redirectPath}?payment=success`
      : `${frontendUrl}/dashboard?payment=failed`;

    res.redirect(redirectUrl);
  }

  // ─── Zarinpal callback ──────────────────────────────────────────────────────
  app.get('/api/payments/zarinpal/callback', async (req: any, res: any) => {
    try {
      const { Authority, Status } = req.query;
      if (!Authority || Status !== 'OK') {
        return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=cancelled`);
      }

      const settings = (await storage.getAdminSettings()) as any;
      const base = process.env.BASE_URL || 'http://localhost:5000';
      const adapter = createZarinpalAdapter(settings, `${base}/api/payments/zarinpal/callback`);
      if (!adapter) return res.status(503).json({ message: 'Zarinpal not configured' });

      // Look up orderId from authority
      const [walletTxn] = await db.select().from(walletTransactions)
        .where(eq(walletTransactions.shetabTransactionId, Authority as string));
      const [coursePmt] = await db.select().from(coursePayments)
        .where(eq(coursePayments.gatewayTransactionId, Authority as string));

      const record = walletTxn || coursePmt;
      const orderId = record?.merchantTransactionId;

      if (!orderId) {
        console.error('Zarinpal callback: no matching order for authority', Authority);
        return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=failed`);
      }

      const amount = record && 'amount' in record ? Number(record.amount) : undefined;
      const verifyResult = await adapter.verify({ orderId, transactionId: Authority as string, amount });

      await handleGatewayCallback(
        'zarinpal',
        orderId,
        Authority as string,
        amount,
        { transactionId: Authority as string, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res
      );
    } catch (e: any) {
      console.error('Zarinpal callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=error`);
    }
  });

  // ─── IDPay callback ─────────────────────────────────────────────────────────
  app.post('/api/payments/idpay/callback', async (req: any, res: any) => {
    try {
      const { id, order_id, status } = req.body;
      if (!order_id) return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=failed`);

      if (status !== '10') {
        await handleGatewayCallback('idpay', order_id, id, undefined, {}, 'failed', res);
        return;
      }

      const settings = (await storage.getAdminSettings()) as any;
      const base = process.env.BASE_URL || 'http://localhost:5000';
      const adapter = createIDPayAdapter(settings, `${base}/api/payments/idpay/callback`);
      if (!adapter) return res.status(503).json({ message: 'IDPay not configured' });

      const verifyResult = await adapter.verify({ orderId: order_id, transactionId: id });

      await handleGatewayCallback(
        'idpay',
        order_id,
        id,
        verifyResult.amount,
        { transactionId: id, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res
      );
    } catch (e: any) {
      console.error('IDPay callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=error`);
    }
  });

  // ─── Zibal callback ─────────────────────────────────────────────────────────
  app.get('/api/payments/zibal/callback', async (req: any, res: any) => {
    try {
      const { trackId, success, orderId } = req.query;
      if (!orderId || success !== '1') {
        return res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=cancelled`);
      }

      const settings = (await storage.getAdminSettings()) as any;
      const base = process.env.BASE_URL || 'http://localhost:5000';
      const adapter = createZibalAdapter(settings, `${base}/api/payments/zibal/callback`);
      if (!adapter) return res.status(503).json({ message: 'Zibal not configured' });

      const verifyResult = await adapter.verify({ orderId: orderId as string, transactionId: trackId as string });

      await handleGatewayCallback(
        'zibal',
        orderId as string,
        trackId as string,
        verifyResult.amount,
        { transactionId: trackId as string, referenceNumber: verifyResult.referenceNumber, cardNumber: verifyResult.cardNumber },
        verifyResult.status,
        res
      );
    } catch (e: any) {
      console.error('Zibal callback error:', e);
      res.redirect(`${process.env.FRONTEND_URL || ''}/dashboard?payment=error`);
    }
  });
}
