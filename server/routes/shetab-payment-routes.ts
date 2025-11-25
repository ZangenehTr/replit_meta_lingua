import { Router, Request, Response } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import { ShetabPaymentService } from '../services/shetab-payment-service';
import { authenticate, AuthenticatedRequest } from '../auth';

const router = Router();

// Validation schemas
const initiatePaymentSchema = z.object({
  amount: z.number().min(1000, 'Minimum amount is 1000 IRR').max(1000000000, 'Maximum amount exceeded'),
  description: z.string().min(1, 'Description required'),
  callbackUrl: z.string().url('Valid callback URL required'),
  orderId: z.string().optional(),
  mobileNumber: z.string().optional(),
  email: z.string().email().optional()
});

const verifyCallbackSchema = z.object({
  orderId: z.string(),
  transactionId: z.string(),
  referenceNumber: z.string(),
  amount: z.number(),
  status: z.enum(['successful', 'failed', 'pending']),
  timestamp: z.number(),
  signature: z.string()
});

const refundSchema = z.object({
  transactionId: z.string(),
  reason: z.string().min(1, 'Refund reason required')
});

/**
 * Check payment gateway status
 */
router.get('/shetab/status', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const settings = await storage.getAdminSettings();
    
    res.json({
      success: true,
      gateway: 'shetab',
      enabled: settings.shetabEnabled || false,
      configured: !!(settings.shetabMerchantId && settings.shetabApiKey),
      environment: settings.shetabEnvironment || 'sandbox',
      merchantId: settings.shetabMerchantId ? '***' + settings.shetabMerchantId.slice(-4) : 'not configured'
    });
  } catch (error: any) {
    console.error('Failed to get payment gateway status:', error);
    res.status(500).json({ success: false, message: 'Failed to check status' });
  }
});

/**
 * Initiate payment request
 */
router.post('/shetab/initiate', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { amount, description, callbackUrl, orderId, mobileNumber, email } = initiatePaymentSchema.parse(req.body);
    
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Generate unique order ID if not provided
    const uniqueOrderId = orderId || `order-${req.user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Initiate payment
    const paymentResult = await ShetabPaymentService.initiatePayment({
      amount,
      orderId: uniqueOrderId,
      userId: req.user.id,
      description,
      callbackUrl,
      mobileNumber: mobileNumber || req.user.phoneNumber,
      email: email || req.user.email
    });

    if (!paymentResult.success) {
      return res.status(400).json(paymentResult);
    }

    res.json({
      success: true,
      message: 'Payment initiated successfully',
      paymentUrl: paymentResult.paymentUrl,
      transactionId: paymentResult.transactionId,
      orderId: uniqueOrderId,
      amount,
      redirectUrl: paymentResult.paymentUrl // Alias for frontend compatibility
    });
  } catch (error: any) {
    console.error('Payment initiation error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to initiate payment'
    });
  }
});

/**
 * Payment callback webhook (no auth required - called by Shetab)
 */
router.post('/shetab/callback', async (req: Request, res: Response) => {
  try {
    const payload = verifyCallbackSchema.parse(req.body);

    // Verify and process callback
    const success = await ShetabPaymentService.verifyCallback(payload);

    if (success) {
      // Return success to Shetab
      res.json({ success: true, message: 'Callback processed successfully' });
    } else {
      res.status(400).json({ success: false, message: 'Callback verification failed' });
    }
  } catch (error: any) {
    console.error('Payment callback error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Invalid callback payload',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Callback processing failed'
    });
  }
});

/**
 * Get payment status
 */
router.get('/shetab/transaction/:transactionId', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactionId } = req.params;

    const transaction = await storage.getPaymentByExternalTransactionId(transactionId);
    
    if (!transaction) {
      return res.status(404).json({
        success: false,
        message: 'Transaction not found'
      });
    }

    // Verify user owns this transaction
    if (transaction.userId !== req.user?.id) {
      return res.status(403).json({
        success: false,
        message: 'Access denied'
      });
    }

    res.json({
      success: true,
      transaction: {
        transactionId: transaction.externalTransactionId,
        orderId: transaction.orderId,
        amount: transaction.amount,
        status: transaction.status,
        createdAt: transaction.createdAt,
        updatedAt: transaction.updatedAt,
        referenceNumber: transaction.referenceNumber
      }
    });
  } catch (error: any) {
    console.error('Failed to get transaction status:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve transaction'
    });
  }
});

/**
 * Request refund
 */
router.post('/shetab/refund', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { transactionId, reason } = refundSchema.parse(req.body);

    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    // Verify transaction belongs to user
    const transaction = await storage.getPaymentByExternalTransactionId(transactionId);
    if (!transaction || transaction.userId !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: 'Transaction not found or access denied'
      });
    }

    // Only refund completed transactions
    if (transaction.status !== 'completed') {
      return res.status(400).json({
        success: false,
        message: `Cannot refund transaction in ${transaction.status} status`
      });
    }

    // Process refund
    const refundSuccess = await ShetabPaymentService.refundPayment(transactionId, reason);

    if (refundSuccess) {
      res.json({
        success: true,
        message: 'Refund request processed successfully'
      });
    } else {
      res.status(500).json({
        success: false,
        message: 'Failed to process refund'
      });
    }
  } catch (error: any) {
    console.error('Refund error:', error);
    
    if (error instanceof z.ZodError) {
      return res.status(400).json({
        success: false,
        message: 'Validation error',
        errors: error.errors
      });
    }

    res.status(500).json({
      success: false,
      message: 'Failed to process refund request'
    });
  }
});

/**
 * Get user's payment history
 */
router.get('/shetab/history', authenticate, async (req: AuthenticatedRequest, res: Response) => {
  try {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    const limit = Math.min(parseInt(req.query.limit as string) || 10, 100);
    const offset = parseInt(req.query.offset as string) || 0;

    // Get payment transactions for user
    const payments = await storage.getPaymentTransactionsByUser(req.user.id, limit, offset);

    res.json({
      success: true,
      payments: payments.map(p => ({
        transactionId: p.externalTransactionId,
        orderId: p.orderId,
        amount: p.amount,
        status: p.status,
        method: p.paymentMethod,
        createdAt: p.createdAt,
        referenceNumber: p.referenceNumber
      })),
      total: payments.length,
      limit,
      offset
    });
  } catch (error: any) {
    console.error('Failed to get payment history:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to retrieve payment history'
    });
  }
});

export default router;
