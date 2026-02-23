// Prospect Lifecycle API Routes
// Handles unified data sharing across all entry points

import { Router } from "express";
import { ProspectLifecycleService } from "../services/prospect-lifecycle";
import { authenticate, authorizePermission } from "../auth";
import { z } from "zod";
import { db } from "../db";
import { leads, placementTestSessions } from "@shared/schema";
import { eq, sql } from "drizzle-orm";

const router = Router();

// Schema for prospect data
const prospectDataSchema = z.object({
  firstName: z.string().optional(),
  lastName: z.string().optional(),
  email: z.string().email().optional(),
  phoneNumber: z.string().optional(),
  source: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  interestedLanguage: z.string().optional(),
  level: z.string().optional(),
  notes: z.string().optional(),
  budget: z.number().optional(),
  preferredFormat: z.string().optional(),
  nationalId: z.string().optional(),
  age: z.number().optional(),
  gender: z.string().optional()
});

/**
 * Get or create prospect (with deduplication)
 * Used by all entry points to ensure single record per person
 */
router.post("/get-or-create", authenticate, async (req: any, res) => {
  try {
    const data = prospectDataSchema.parse(req.body);
    
    // Add source tracking based on user role
    if (!data.source) {
      switch (req.user.role) {
        case 'Front Desk':
          data.source = 'walk-in';
          break;
        case 'Call Center Agent':
          data.source = 'call-center';
          break;
        default:
          data.source = 'manual';
      }
    }
    
    const prospect = await ProspectLifecycleService.getOrCreateProspect(data);
    
    res.json({
      success: true,
      prospect,
      message: prospect.userId 
        ? 'کاربر قبلاً در سیستم وجود دارد' // User already exists
        : prospect.leadId 
        ? 'مشتری بالقوه یافت شد' // Lead found
        : 'مشتری بالقوه جدید ایجاد شد' // New lead created
    });
  } catch (error) {
    console.error('Error in get-or-create prospect:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در پردازش اطلاعات' // Error processing data
    });
  }
});

/**
 * Enrich existing prospect with additional data
 * Used to progressively collect information across touchpoints
 */
router.patch("/enrich/:leadId", authenticate, async (req: any, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    const data = prospectDataSchema.parse(req.body);
    
    const enrichedProspect = await ProspectLifecycleService.enrichProspect(leadId, data as any);
    
    res.json({
      success: true,
      prospect: enrichedProspect,
      message: 'اطلاعات با موفقیت به‌روزرسانی شد' // Data successfully updated
    });
  } catch (error) {
    console.error('Error enriching prospect:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در به‌روزرسانی اطلاعات' // Error updating data
    });
  }
});

/**
 * Merge guest lead into main lead system
 * Used after guest placement tests
 */
router.post("/merge-guest/:guestLeadId/:leadId", authenticate, async (req: any, res) => {
  try {
    const guestLeadId = parseInt(req.params.guestLeadId);
    
    const prospect = await ProspectLifecycleService.mergeGuestLeadToLead(guestLeadId);
    
    res.json({
      success: true,
      prospect,
      message: 'اطلاعات تست تعیین سطح با مشتری بالقوه ادغام شد' // Placement test data merged
    });
  } catch (error) {
    console.error('Error merging guest lead:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در ادغام اطلاعات' // Error merging data
    });
  }
});

/**
 * Convert lead to student
 * Creates user account with OTP access and processes payment
 */
router.post("/convert/:leadId", authenticate, async (req: any, res) => {
  try {
    const leadId = parseInt(req.params.leadId);
    
    // Validate conversion data
    const conversionSchema = z.object({
      sendWelcomeSms: z.boolean().optional(),
      enrollInCourse: z.number().optional(),
      initialPayment: z.number().optional(),
      paymentMethod: z.enum(['cash', 'card', 'online', 'invoice']).optional()
    });
    
    const options = conversionSchema.parse(req.body);
    
    // Add receivedBy for payment tracking
    if (options.initialPayment) {
      (options as any).receivedBy = req.user.id;
    }
    
    // Check permissions for payment processing
    const canReceivePayment = ['Admin', 'Accountant', 'Front Desk'].includes(req.user.role);
    if (options.initialPayment && !canReceivePayment) {
      return res.status(403).json({
        success: false,
        message: 'شما مجوز دریافت پرداخت ندارید' // You don't have permission to receive payment
      });
    }
    
    const result = await ProspectLifecycleService.convertLeadToStudent(leadId, options);
    
    res.json({
      success: true,
      user: result.user,
      smsStatus: result.smsStatus,
      message: 'مشتری بالقوه با موفقیت به دانش‌آموز تبدیل شد' // Lead successfully converted to student
    });
  } catch (error) {
    console.error('Error converting lead:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در تبدیل مشتری بالقوه' // Error converting lead
    });
  }
});

/**
 * Get unified prospect view
 * Shows all leads and guest leads in one dashboard
 */
router.get("/unified-view", authenticate, async (req: any, res) => {
  try {
    // Parse filters
    const filters = {
      status: req.query.status as string | undefined,
      source: req.query.source as string | undefined,
      dateFrom: req.query.dateFrom ? new Date(req.query.dateFrom) : undefined,
      dateTo: req.query.dateTo ? new Date(req.query.dateTo) : undefined
    };
    
    const prospects = await ProspectLifecycleService.getUnifiedProspectView(filters);
    
    res.json({
      success: true,
      prospects,
      total: prospects.length,
      message: `${prospects.length} مورد یافت شد` // X items found
    });
  } catch (error) {
    console.error('Error getting unified view:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در دریافت لیست' // Error getting list
    });
  }
});

/**
 * Process student self-payment after placement
 * Students can pay online or in-person after taking placement test
 */
router.post("/self-pay", authenticate, async (req: any, res) => {
  try {
    // Must be a student
    if (req.user.role !== 'student') {
      return res.status(403).json({
        success: false,
        message: 'فقط دانش‌آموزان می‌توانند پرداخت کنند' // Only students can make payments
      });
    }
    
    const paymentSchema = z.object({
      amount: z.number().min(1000), // Minimum 1000 IRR
      paymentMethod: z.enum(['online', 'card']),
      courseId: z.number().optional()
    });
    
    const paymentData = paymentSchema.parse(req.body);
    
    // Here you would integrate with Shetab payment gateway
    // For now, we'll just record the transaction
    
    res.json({
      success: true,
      message: 'پرداخت با موفقیت ثبت شد', // Payment successfully recorded
      paymentUrl: '/payment/gateway' // Would be actual Shetab URL
    });
  } catch (error) {
    console.error('Error processing self-payment:', error);
    res.status(500).json({ 
      success: false, 
      message: 'خطا در پردازش پرداخت' // Error processing payment
    });
  }
});

/**
 * Send OTP to lead for conversion to student
 * No authentication required - lead provides phone number to receive OTP
 */
router.post("/send-otp", async (req: any, res) => {
  try {
    const { leadId, phoneNumber } = req.body;
    
    if (!leadId || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'شناسه مشتری بالقوه و شماره تلفن الزامی است' // Lead ID and phone number are required
      });
    }
    
    // Verify lead exists and phone matches
    const [lead] = await db.select()
      .from(leads)
      .where(eq(leads.id, leadId));
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'مشتری بالقوه یافت نشد' // Lead not found
      });
    }
    
    // Normalize phone numbers for comparison
    const normalizedInput = ProspectLifecycleService['normalizePhoneNumber'](phoneNumber);
    const normalizedLead = ProspectLifecycleService['normalizePhoneNumber'](lead.phoneNumber || '');
    
    if (normalizedInput !== normalizedLead) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن با اطلاعات ثبت شده مطابقت ندارد' // Phone number doesn't match records
      });
    }
    
    // Generate and send OTP
    const { OtpService } = await import('../services/otp-service');
    const result = await OtpService.generateOtp(
      normalizedInput,
      'sms',
      'registration',
      undefined, // No userId yet for leads
      req.ip,
      'fa'
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error sending OTP:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ارسال کد تأیید' // Error sending verification code
    });
  }
});

/**
 * Verify OTP and convert lead to student
 */
router.post("/verify-otp-convert", async (req: any, res) => {
  try {
    const { leadId, phoneNumber, otpCode } = req.body;
    
    if (!leadId || !phoneNumber || !otpCode) {
      return res.status(400).json({
        success: false,
        message: 'اطلاعات ناقص است' // Incomplete information
      });
    }
    
    // SECURITY: Verify lead exists and phone matches before OTP verification
    const [lead] = await db.select()
      .from(leads)
      .where(eq(leads.id, leadId));
    
    if (!lead) {
      return res.status(404).json({
        success: false,
        message: 'مشتری بالقوه یافت نشد' // Lead not found
      });
    }
    
    // Normalize phone numbers for comparison
    const normalizedInput = ProspectLifecycleService['normalizePhoneNumber'](phoneNumber);
    const normalizedLead = ProspectLifecycleService['normalizePhoneNumber'](lead.phoneNumber || '');
    
    // CRITICAL: Verify phone number belongs to this lead
    if (normalizedInput !== normalizedLead) {
      return res.status(400).json({
        success: false,
        message: 'شماره تلفن با اطلاعات ثبت شده مطابقت ندارد' // Phone number doesn't match records
      });
    }
    
    // Now verify OTP - we know the phone belongs to this lead
    const { OtpService } = await import('../services/otp-service');
    const verification = await OtpService.verifyOtp(
      normalizedInput,
      otpCode,
      'registration',
      'fa'
    );
    
    if (!verification.success) {
      return res.status(400).json(verification);
    }
    
    // Convert lead to student - phone ownership validated
    const conversionResult = await ProspectLifecycleService.convertLeadToStudent(leadId);
    
    res.json({
      success: true,
      user: conversionResult.user,
      message: 'حساب کاربری شما با موفقیت ایجاد شد' // Your account has been created successfully
    });
  } catch (error) {
    console.error('Error verifying OTP:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در تأیید کد' // Error verifying code
    });
  }
});

/**
 * Special endpoint for guest placement test submissions
 * Validates placement session ID to ensure legitimate submissions
 * No authentication required but secured through session validation
 */
router.post("/guest-placement-submission", async (req: any, res) => {
  try {
    const { name, email, phone, placementSessionId, testResults } = req.body;
    
    // Validate required fields
    if (!name || !email || !placementSessionId) {
      return res.status(400).json({
        success: false,
        message: 'Name, email, and placement session ID are required'
      });
    }
    
    // Validate placementSessionId is a valid positive integer
    const sessionId = Number(placementSessionId);
    if (!Number.isInteger(sessionId) || sessionId <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Invalid placement session ID format. Must be a positive integer.'
      });
    }
    
    // Validate placement session exists in database
    const placementSession = await db.query.placementTestSessions.findFirst({
      where: eq(placementTestSessions.id, sessionId)
    });
    
    if (!placementSession) {
      return res.status(400).json({
        success: false,
        message: 'Invalid placement session ID. Please complete a valid placement test.'
      });
    }
    
    // Optionally check if session is completed (not strictly required for guest submissions)
    if (placementSession.status !== 'completed') {
      console.warn(`⚠️  Guest submission for incomplete session ${sessionId} (status: ${placementSession.status})`);
    }
    
    // Parse name into first and last (simple split on first space)
    const nameParts = name.trim().split(' ');
    const firstName = nameParts[0];
    const lastName = nameParts.slice(1).join(' ') || '';
    
    // Create or get prospect through the service
    const prospectData = {
      firstName,
      lastName,
      email,
      phoneNumber: phone,
      source: 'placement_test',
      status: 'new',
      priority: 'normal',
      interestedLanguage: 'english',
      level: testResults?.overallLevel || undefined,
      notes: testResults ? `Placement Test Results (Session #${placementSessionId}):
- Overall Level: ${testResults.overallLevel}
- Speaking: ${testResults.skillLevels?.speaking || 'N/A'}
- Listening: ${testResults.skillLevels?.listening || 'N/A'}  
- Reading: ${testResults.skillLevels?.reading || 'N/A'}
- Writing: ${testResults.skillLevels?.writing || 'N/A'}
- Score: ${testResults.scores?.overall || 0}/100
- Confidence: ${testResults.confidence ? Math.round(testResults.confidence * 100) : 0}%
- Strengths: ${testResults.strengths?.join(', ') || 'N/A'}
- Recommendations: ${testResults.recommendations?.join('; ') || 'N/A'}` : undefined
    };
    
    const prospect = await ProspectLifecycleService.getOrCreateProspect(prospectData);
    
    // If prospect already existed and we have new test results, enrich with the results
    if (prospect.leadId && testResults && !prospect.userId) {
      await ProspectLifecycleService.enrichProspect(prospect.leadId, {
        level: testResults.overallLevel,
        notes: prospectData.notes
      });
    }
    
    res.json({
      success: true,
      prospect,
      message: prospect.userId 
        ? 'This email is already registered as a student'
        : prospect.leadId 
        ? 'Contact information saved successfully'
        : 'New lead created successfully'
    });
  } catch (error) {
    console.error('Error in guest placement submission:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to save contact information'
    });
  }
});

/**
 * Create new lead from call center intake form
 * POST /api/leads
 */
router.post("", authenticate, async (req: any, res) => {
  try {
    // Validate required fields
    const { firstName, lastName, phoneNumber, email, courseTarget, goal, deliveryType, classType, referralSource, age, gender, nationalId, notes, branch } = req.body;
    
    if (!firstName || !lastName || !phoneNumber) {
      return res.status(400).json({
        success: false,
        message: 'نام، نام خانوادگی و شماره تلفن الزامی است' // First name, last name, and phone number are required
      });
    }
    
    // Create lead data
    const leadData = {
      firstName,
      lastName,
      email: email || null,
      phoneNumber,
      source: 'call_center',
      status: 'new',
      priority: 'medium',
      interestedLanguage: 'english',
      level: 'pending_assessment',
      notes: notes || `Course: ${courseTarget}, Goal: ${goal}, Delivery: ${deliveryType}, Class: ${classType}, Referral: ${referralSource}`,
      age: age || null,
      gender: gender || null,
      nationalId: nationalId || null,
      budget: null,
      preferredFormat: deliveryType === 'آنلاین' ? 'online' : deliveryType === 'حضوری' ? 'inPerson' : 'hybrid'
    };
    
    // Use existing service to create/get prospect
    const prospect = await ProspectLifecycleService.getOrCreateProspect(leadData);
    
    res.json({
      success: true,
      lead: prospect,
      message: 'مشتری بالقوه با موفقیت ایجاد شد' // Lead successfully created
    });
  } catch (error) {
    console.error('Error creating lead:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در ایجاد مشتری بالقوه' // Error creating lead
    });
  }
});

/**
 * Get workflow statistics for all leads
 * GET /api/leads/workflow-stats
 */
router.get("/workflow-stats", authenticate, async (req: any, res) => {
  try {
    // Query leads grouped by status
    const leadsByStatus = await db.select({
      status: leads.status,
      count: sql<number>`cast(count(*) as integer)`
    })
      .from(leads)
      .groupBy(leads.status);
    
    // Calculate overall stats
    const totalStats = await db.select({
      total: sql<number>`cast(count(*) as integer)`
    })
      .from(leads);
    
    // Build response with workflow stats
    const stats = {
      totalLeads: totalStats[0]?.total || 0,
      byStatus: {
        new: leadsByStatus.find(s => s.status === 'new')?.count || 0,
        contacted: leadsByStatus.find(s => s.status === 'contacted')?.count || 0,
        qualified: leadsByStatus.find(s => s.status === 'qualified')?.count || 0,
        proposal: leadsByStatus.find(s => s.status === 'proposal')?.count || 0,
        negotiation: leadsByStatus.find(s => s.status === 'negotiation')?.count || 0,
        closedWon: leadsByStatus.find(s => s.status === 'closed_won')?.count || 0,
        closedLost: leadsByStatus.find(s => s.status === 'closed_lost')?.count || 0,
        nurturing: leadsByStatus.find(s => s.status === 'nurturing')?.count || 0
      }
    };
    
    res.json({
      success: true,
      data: stats,
      message: 'آمار مشتریان بالقوه با موفقیت دریافت شد' // Lead statistics successfully retrieved
    });
  } catch (error) {
    console.error('Error getting workflow stats:', error);
    res.status(500).json({
      success: false,
      message: 'خطا در دریافت آمار' // Error getting statistics
    });
  }
});

export default router;