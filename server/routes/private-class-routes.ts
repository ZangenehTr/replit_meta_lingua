import type { Express } from "express";
import { db } from "../db";
import { eq, desc, and, inArray, sql } from "drizzle-orm";
import {
  sessionPackages,
  studentSessionPackages,
  teacherStudentAssignments,
  privateSessions,
  liveClassSessions,
  leads,
  users,
  walletTransactions,
  coursePayments,
  leadActivityLog,
  frontDeskTasks,
  adminSettings,
  LEAD_STAGE_TRANSITIONS,
  LEAD_WORKFLOW_STAGE,
} from "../../shared/schema";
import { authenticate, authorize } from "../auth";
import { z } from "zod";
import { storage } from "../storage";

// ===== Session Bundle Templates (Admin CRUD) =====

export function registerPrivateClassRoutes(app: Express) {

  // GET /api/session-bundles — list session bundles; admin sees all, others only active
  app.get("/api/session-bundles", authenticate, authorize(['Admin', 'Supervisor', 'Call Center Agent', 'Front Desk', 'Front Desk Clerk']), async (req: any, res) => {
    try {
      const isAdmin = req.user?.role === 'Admin';
      const condition = isAdmin
        ? eq(sessionPackages.packageType, "private")
        : and(eq(sessionPackages.packageType, "private"), eq(sessionPackages.isActive, true));
      const bundles = await db.select().from(sessionPackages)
        .where(condition)
        .orderBy(desc(sessionPackages.createdAt));
      res.json(bundles);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch bundles" });
    }
  });

  // POST /api/session-bundles — create bundle
  app.post("/api/session-bundles", authenticate, authorize(['Admin']), async (req: any, res) => {
    try {
      const schema = z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        sessionCount: z.number().int().positive(),
        sessionDuration: z.number().int().positive().default(60),
        validityDays: z.number().int().positive().default(90),
        price: z.number().positive(),
        lowSessionAlertThreshold: z.number().int().min(1).default(2),
        features: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);
      const [bundle] = await db.insert(sessionPackages).values({
        name: data.name,
        description: data.description,
        packageType: "private",
        sessionCount: data.sessionCount,
        sessionDuration: data.sessionDuration,
        validityDays: data.validityDays,
        price: String(data.price),
        lowSessionAlertThreshold: data.lowSessionAlertThreshold,
        features: data.features || [],
        isActive: true,
      }).returning();
      res.status(201).json(bundle);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: "Failed to create bundle" });
    }
  });

  // PUT /api/session-bundles/:id — update bundle
  app.put("/api/session-bundles/:id", authenticate, authorize(['Admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      const schema = z.object({
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        sessionCount: z.number().int().positive().optional(),
        sessionDuration: z.number().int().positive().optional(),
        validityDays: z.number().int().positive().optional(),
        price: z.number().positive().optional(),
        lowSessionAlertThreshold: z.number().int().min(1).optional(),
        isActive: z.boolean().optional(),
        features: z.array(z.string()).optional(),
      });
      const data = schema.parse(req.body);
      const updateData: Partial<typeof sessionPackages.$inferInsert> & { updatedAt: Date } = {
        ...data,
        updatedAt: new Date(),
        ...(data.price !== undefined ? { price: String(data.price) } : {}),
      };
      const [updated] = await db.update(sessionPackages).set(updateData).where(eq(sessionPackages.id, id)).returning();
      if (!updated) return res.status(404).json({ message: "Bundle not found" });
      res.json(updated);
    } catch (e: any) {
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: "Failed to update bundle" });
    }
  });

  // DELETE/deactivate bundle
  app.delete("/api/session-bundles/:id", authenticate, authorize(['Admin']), async (req: any, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) return res.status(400).json({ message: "Invalid ID" });
      await db.update(sessionPackages).set({ isActive: false, updatedAt: new Date() }).where(eq(sessionPackages.id, id));
      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to deactivate bundle" });
    }
  });

  // ===== Private Class Creation (CRM agent action) =====
  //
  // CRM stage flow for private classes:
  //   contact_desk → ... → final_registration → private_class_setup
  //                                                      ↓
  //                                         (optionally) set_class_number
  //                                                      ↓
  //                                           active_private_class  ← this endpoint activates here
  //                                                      ↓
  //                                            charge_renewal (on low-session threshold)
  //                                                      ↓
  //                                   completed_private_class | private_class_withdrawal
  //
  // `final_registration` is the CRM stage where payment terms are agreed; it transitions the lead
  // to `private_class_setup` via the standard stage-transition API (/api/leads/:id/stage).
  // This endpoint then enforces a stage guard — rejecting activation unless the lead is in
  // `private_class_setup` or `set_class_number` (per LEAD_STAGE_TRANSITIONS).
  //
  // Lead linkage: `student_session_packages.leadId` is stored at creation to enable
  // direct lead resolution in threshold alerts (primary) with stage-based fallback.

  // POST /api/private-class/create — create student session package + payment record
  app.post("/api/private-class/create", authenticate, authorize(['Admin', 'Call Center Agent', 'Supervisor', 'Front Desk', 'Front Desk Clerk']), async (req: any, res) => {
    try {
      const schema = z.object({
        leadId: z.number().int(),
        packageId: z.number().int(),
        teacherId: z.number().int(),
        paymentMethod: z.enum(['cash', 'pos', 'cheque', 'wallet', 'bank_transfer', 'gateway']),
        amount: z.number().positive(),
        notes: z.string().optional(),
      });
      const { leadId, packageId, teacherId, paymentMethod, amount, notes } = schema.parse(req.body);

      const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
      if (!lead) return res.status(404).json({ message: "Lead not found" });
      if (!lead.studentId) return res.status(400).json({ message: "Lead has no linked student account" });

      // Stage guard: enforce that the lead is in a valid source stage before activating private class.
      // Valid source stages per LEAD_STAGE_TRANSITIONS: private_class_setup and set_class_number.
      const currentStage = (lead.workflowStage || 'contact_desk') as keyof typeof LEAD_STAGE_TRANSITIONS;
      const allowedTargets = LEAD_STAGE_TRANSITIONS[currentStage] || [];
      if (!allowedTargets.includes(LEAD_WORKFLOW_STAGE.ACTIVE_PRIVATE_CLASS)) {
        return res.status(400).json({
          message: `Lead cannot be activated for private class from stage '${currentStage}'. ` +
            `Lead must be in 'private_class_setup' or 'set_class_number' first.`,
          currentStage,
        });
      }

      const [bundle] = await db.select().from(sessionPackages).where(eq(sessionPackages.id, packageId));
      if (!bundle) return res.status(404).json({ message: "Session bundle not found" });
      if (!bundle.isActive) return res.status(400).json({ message: "Selected session bundle is no longer active" });

      const [teacher] = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName, role: users.role })
        .from(users).where(eq(users.id, teacherId));
      if (!teacher) return res.status(404).json({ message: "Teacher not found" });
      const TEACHER_ROLES = ['Teacher', 'Teacher/Tutor'];
      if (!TEACHER_ROLES.includes(teacher.role as string)) return res.status(400).json({ message: "Selected user is not a Teacher" });

      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + (bundle.validityDays || 90));

      // Validate wallet balance sufficiency before starting transaction
      if (paymentMethod === 'wallet') {
        const [student] = await db.select({ walletBalance: users.walletBalance })
          .from(users).where(eq(users.id, lead.studentId!));
        const balance = parseFloat(student?.walletBalance?.toString() || '0');
        if (balance < amount) {
          return res.status(400).json({
            message: "Insufficient wallet balance",
            required: amount,
            available: balance,
          });
        }
      }

      const result = await db.transaction(async (tx) => {
        // 1. Create student session package record
        const [pkg] = await tx.insert(studentSessionPackages).values({
          studentId: lead.studentId!,
          teacherId,
          packageId,
          leadId,
          totalSessions: bundle.sessionCount,
          remainingSessions: bundle.sessionCount,
          sessionDuration: bundle.sessionDuration || 60,
          lowSessionAlertThreshold: bundle.lowSessionAlertThreshold || 2,
          status: "active",
          expiryDate,
          notes: notes || null,
        }).returning();

        // 2. Create teacher-student assignment record
        await tx.insert(teacherStudentAssignments).values({
          teacherId,
          studentId: lead.studentId!,
          studentSessionPackageId: pkg.id,
          status: "active",
          notes: notes || null,
        });

        // 3. Record payment in course_payments (primary financial ledger)
        const txRef = `PRIV-${pkg.id}-${Date.now()}`;
        const [payment] = await tx.insert(coursePayments).values({
          userId: lead.studentId!,
          courseId: null,
          amount: String(amount),
          paymentMethod,
          status: "completed",
          merchantTransactionId: txRef,
          paidAt: new Date(),
        }).returning();

        // 4. If payment method is wallet, debit the student's wallet balance and log transaction
        if (paymentMethod === 'wallet') {
          await tx.update(users)
            .set({ walletBalance: sql`wallet_balance - ${Math.round(amount)}` })
            .where(eq(users.id, lead.studentId!));
          await tx.insert(walletTransactions).values({
            userId: lead.studentId!,
            type: "payment",
            amount: String(amount),
            description: `بسته کلاس خصوصی: ${bundle.name}`,
            status: "completed",
            merchantTransactionId: txRef,
            completedAt: new Date(),
          });
        }

        // 5. Advance lead to active_private_class stage
        await tx.update(leads).set({
          workflowStage: "active_private_class",
          status: "converted",
          updatedAt: new Date(),
        }).where(eq(leads.id, leadId));

        // 6. Log activity (no as-any — snapshot is Record<string, unknown>)
        const snapshot: Record<string, unknown> = {
          stage: "active_private_class",
          packageId,
          bundleName: bundle.name,
          teacherId,
          teacherName: `${teacher.firstName} ${teacher.lastName}`,
          amount,
          paymentMethod,
          studentSessionPackageId: pkg.id,
          coursePaymentId: payment.id,
        };
        await tx.insert(leadActivityLog).values({
          leadId,
          operatorId: req.user.id,
          fromStage: lead.workflowStage || "private_class_setup",
          toStage: "active_private_class",
          reason: `Private class bundle purchased: ${bundle.name}`,
          snapshot,
        });

        return { pkg, payment };
      });

      res.status(201).json({
        success: true,
        message: "Private class created successfully",
        studentSessionPackageId: result.pkg.id,
        coursePaymentId: result.payment.id,
      });
    } catch (e: any) {
      console.error("[Private Class] Create error:", e);
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: "Failed to create private class" });
    }
  });

  // ===== Session Logging (Teacher) =====

  // POST /api/private-sessions/log — teacher logs a completed session
  app.post("/api/private-sessions/log", authenticate, authorize(['Teacher', 'Teacher/Tutor', 'Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const schema = z.object({
        studentSessionPackageId: z.number().int(),
        sessionDate: z.string(),
        actualDuration: z.number().int().optional(),
        topicsCovered: z.string().optional(),
        teacherNotes: z.string().optional(),
        attendanceStatus: z.enum(['attended', 'absent', 'cancelled']).default('attended'),
        nextScheduledAt: z.string().optional(), // teacher can optionally set next session time
      });
      const data = schema.parse(req.body);

      const [pkg] = await db.select().from(studentSessionPackages)
        .where(and(
          eq(studentSessionPackages.id, data.studentSessionPackageId),
          eq(studentSessionPackages.status, "active")
        ));

      if (!pkg) return res.status(404).json({ message: "Active session package not found" });

      // Verify teacher owns this package
      if ((['Teacher', 'Teacher/Tutor'].includes(req.user.role)) && pkg.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized for this student's package" });
      }

      const deducted = data.attendanceStatus === 'attended' ? 1 : 0;
      const newRemaining = Math.max(0, pkg.remainingSessions - deducted);

      const result = await db.transaction(async (tx) => {
        // 1. Log session
        const [session] = await tx.insert(privateSessions).values({
          studentSessionPackageId: data.studentSessionPackageId,
          teacherId: pkg.teacherId,
          studentId: pkg.studentId,
          sessionDate: new Date(data.sessionDate),
          actualDuration: data.actualDuration || pkg.sessionDuration,
          topicsCovered: data.topicsCovered || null,
          teacherNotes: data.teacherNotes || null,
          attendanceStatus: data.attendanceStatus,
          sessionsDeducted: deducted,
          remainingAfter: newRemaining,
        }).returning();

        // 1b. Also write a compatibility record to live_class_sessions (classId nullable for private sessions)
        await tx.insert(liveClassSessions).values({
          classId: null,
          teacherId: pkg.teacherId,
          sessionDate: new Date(data.sessionDate),
          actualDuration: data.actualDuration || null,
          plannedTopic: data.topicsCovered || null,
          teacherNotes: data.teacherNotes || null,
          sessionType: 'private',
        });

        // 2. Decrement remaining sessions and optionally set next scheduled session
        const pkgUpdate: Partial<typeof studentSessionPackages.$inferInsert> = { updatedAt: new Date() };
        if (deducted > 0) pkgUpdate.remainingSessions = newRemaining;
        if (data.nextScheduledAt) pkgUpdate.nextScheduledAt = new Date(data.nextScheduledAt);
        await tx.update(studentSessionPackages).set(pkgUpdate)
          .where(eq(studentSessionPackages.id, data.studentSessionPackageId));

        return { session, newRemaining };
      });

      // 3. Check threshold — fire alerts if needed (non-blocking)
      if (deducted > 0 && result.newRemaining <= pkg.lowSessionAlertThreshold && !pkg.alertFiredAt) {
        fireThresholdAlerts(pkg, result.newRemaining).catch(err =>
          console.error("[Private Class] Alert fire error:", err)
        );
      }

      res.status(201).json({
        success: true,
        session: result.session,
        remainingSessions: result.newRemaining,
      });
    } catch (e: any) {
      console.error("[Private Class] Log session error:", e);
      if (e instanceof z.ZodError) return res.status(400).json({ message: "Validation error", errors: e.errors });
      res.status(500).json({ message: "Failed to log session" });
    }
  });

  // ===== Teacher Private Students =====

  // GET /api/teacher/private-students — list teacher's active private students
  app.get("/api/teacher/private-students", authenticate, authorize(['Teacher', 'Teacher/Tutor', 'Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const teacherId = (['Teacher', 'Teacher/Tutor'].includes(req.user.role)) ? req.user.id : (req.query.teacherId ? parseInt(req.query.teacherId as string) : null);
      if (!teacherId) return res.status(400).json({ message: "teacherId required" });

      const packages = await db.select({
        pkg: studentSessionPackages,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
        bundle: {
          id: sessionPackages.id,
          name: sessionPackages.name,
        },
      })
        .from(studentSessionPackages)
        .innerJoin(users, eq(studentSessionPackages.studentId, users.id))
        .innerJoin(sessionPackages, eq(studentSessionPackages.packageId, sessionPackages.id))
        .where(eq(studentSessionPackages.teacherId, teacherId))
        .orderBy(desc(studentSessionPackages.updatedAt));

      // Fetch last session for each package
      const packageIds = packages.map(p => p.pkg.id);
      let lastSessions: { studentSessionPackageId: number; sessionDate: Date | null }[] = [];
      if (packageIds.length > 0) {
        lastSessions = await db.select({
          studentSessionPackageId: privateSessions.studentSessionPackageId,
          sessionDate: privateSessions.sessionDate,
        })
          .from(privateSessions)
          .where(and(
            inArray(privateSessions.studentSessionPackageId, packageIds),
            eq(privateSessions.attendanceStatus, "attended")
          ))
          .orderBy(desc(privateSessions.sessionDate));
      }

      const lastSessionMap = new Map<number, Date>();
      for (const s of lastSessions) {
        if (!lastSessionMap.has(s.studentSessionPackageId) && s.sessionDate) {
          lastSessionMap.set(s.studentSessionPackageId, s.sessionDate);
        }
      }

      const result = packages.map(({ pkg, student, bundle }) => ({
        id: pkg.id,
        student,
        bundle,
        totalSessions: pkg.totalSessions,
        remainingSessions: pkg.remainingSessions,
        sessionDuration: pkg.sessionDuration,
        lowSessionAlertThreshold: pkg.lowSessionAlertThreshold,
        status: pkg.status,
        startDate: pkg.startDate,
        expiryDate: pkg.expiryDate,
        nextScheduledAt: pkg.nextScheduledAt,
        alertFiredAt: pkg.alertFiredAt,
        lastSessionDate: lastSessionMap.get(pkg.id) || null,
        isLowSession: pkg.remainingSessions <= pkg.lowSessionAlertThreshold,
      }));

      res.json(result);
    } catch (e: any) {
      console.error("[Private Class] Teacher students error:", e);
      res.status(500).json({ message: "Failed to fetch private students" });
    }
  });

  // GET /api/teacher/private-students/:packageId/sessions — session history for a student
  app.get("/api/teacher/private-students/:packageId/sessions", authenticate, authorize(['Teacher', 'Teacher/Tutor', 'Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) return res.status(400).json({ message: "Invalid package ID" });

      const [pkg] = await db.select().from(studentSessionPackages).where(eq(studentSessionPackages.id, packageId));
      if (!pkg) return res.status(404).json({ message: "Package not found" });

      if ((['Teacher', 'Teacher/Tutor'].includes(req.user.role)) && pkg.teacherId !== req.user.id) {
        return res.status(403).json({ message: "Not authorized" });
      }

      const sessions = await db.select().from(privateSessions)
        .where(eq(privateSessions.studentSessionPackageId, packageId))
        .orderBy(desc(privateSessions.sessionDate));

      res.json(sessions);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch sessions" });
    }
  });

  // ===== Student Private Class =====

  // GET /api/student/private-class — student's active private class info
  app.get("/api/student/private-class", authenticate, authorize(['Student', 'Admin']), async (req: any, res) => {
    try {
      const studentId = req.user.role === 'Student' ? req.user.id : parseInt(req.query.studentId as string);
      if (!studentId) return res.status(400).json({ message: "studentId required" });

      const packages = await db.select({
        pkg: studentSessionPackages,
        teacher: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage,
        },
        bundle: {
          id: sessionPackages.id,
          name: sessionPackages.name,
        },
      })
        .from(studentSessionPackages)
        .innerJoin(users, eq(studentSessionPackages.teacherId, users.id))
        .innerJoin(sessionPackages, eq(studentSessionPackages.packageId, sessionPackages.id))
        .where(and(
          eq(studentSessionPackages.studentId, studentId),
          eq(studentSessionPackages.status, "active")
        ))
        .orderBy(desc(studentSessionPackages.updatedAt))
        .limit(1);

      if (packages.length === 0) {
        return res.json(null);
      }

      const { pkg, teacher, bundle } = packages[0];

      // Fetch session history
      const sessions = await db.select().from(privateSessions)
        .where(eq(privateSessions.studentSessionPackageId, pkg.id))
        .orderBy(desc(privateSessions.sessionDate))
        .limit(20);

      res.json({
        id: pkg.id,
        teacher,
        bundle,
        totalSessions: pkg.totalSessions,
        remainingSessions: pkg.remainingSessions,
        sessionDuration: pkg.sessionDuration,
        status: pkg.status,
        startDate: pkg.startDate,
        expiryDate: pkg.expiryDate,
        nextScheduledAt: pkg.nextScheduledAt,
        isLowSession: pkg.remainingSessions <= pkg.lowSessionAlertThreshold,
        sessions,
      });
    } catch (e: any) {
      console.error("[Private Class] Student data error:", e);
      res.status(500).json({ message: "Failed to fetch private class data" });
    }
  });

  // ===== Admin/Supervisor Overview =====

  // GET /api/admin/private-classes — overview of all active private classes
  app.get("/api/admin/private-classes", authenticate, authorize(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      // Default to active-only; pass ?status=all to see all statuses
      const statusFilter = req.query.status as string | undefined;
      const statusCondition = statusFilter === 'all'
        ? undefined
        : eq(studentSessionPackages.status, "active");

      const rows = await db.select({
        pkg: studentSessionPackages,
        student: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
        },
        bundle: {
          id: sessionPackages.id,
          name: sessionPackages.name,
        },
      })
        .from(studentSessionPackages)
        .innerJoin(users, eq(studentSessionPackages.studentId, users.id))
        .innerJoin(sessionPackages, eq(studentSessionPackages.packageId, sessionPackages.id))
        .where(statusCondition)
        .orderBy(desc(studentSessionPackages.updatedAt));

      // Fetch teachers separately to avoid multiple joins confusion
      const teacherIds = [...new Set(rows.map(r => r.pkg.teacherId))];
      let teacherMap = new Map<number, { id: number; firstName: string; lastName: string }>();
      if (teacherIds.length > 0) {
        const teachers = await db.select({ id: users.id, firstName: users.firstName, lastName: users.lastName })
          .from(users).where(inArray(users.id, teacherIds));
        for (const t of teachers) teacherMap.set(t.id, t);
      }

      // Fetch last session dates
      const packageIds = rows.map(r => r.pkg.id);
      let lastSessionMap = new Map<number, Date>();
      if (packageIds.length > 0) {
        const lastSessions = await db.select({
          studentSessionPackageId: privateSessions.studentSessionPackageId,
          sessionDate: privateSessions.sessionDate,
        })
          .from(privateSessions)
          .where(inArray(privateSessions.studentSessionPackageId, packageIds))
          .orderBy(desc(privateSessions.sessionDate));
        for (const s of lastSessions) {
          if (!lastSessionMap.has(s.studentSessionPackageId) && s.sessionDate) {
            lastSessionMap.set(s.studentSessionPackageId, s.sessionDate);
          }
        }
      }

      // Fetch CRM stages from leads table using leadId
      const leadIds = rows.map(r => r.pkg.leadId).filter(Boolean) as number[];
      let leadStageMap = new Map<number, string>();
      if (leadIds.length > 0) {
        const leadRows = await db.select({ id: leads.id, workflowStage: leads.workflowStage })
          .from(leads).where(inArray(leads.id, leadIds));
        for (const l of leadRows) leadStageMap.set(l.id, l.workflowStage || '');
      }

      const result = rows.map(({ pkg, student, bundle }) => ({
        id: pkg.id,
        student,
        teacher: teacherMap.get(pkg.teacherId) || { id: pkg.teacherId, firstName: 'Unknown', lastName: '' },
        bundle,
        crmStage: pkg.leadId ? (leadStageMap.get(pkg.leadId) || 'active_private_class') : 'active_private_class',
        totalSessions: pkg.totalSessions,
        remainingSessions: pkg.remainingSessions,
        sessionDuration: pkg.sessionDuration,
        lowSessionAlertThreshold: pkg.lowSessionAlertThreshold,
        status: pkg.status,
        startDate: pkg.startDate,
        expiryDate: pkg.expiryDate,
        lastSessionDate: lastSessionMap.get(pkg.id) || null,
        nextScheduledAt: pkg.nextScheduledAt,
        alertFiredAt: pkg.alertFiredAt,
        isLowSession: pkg.remainingSessions <= pkg.lowSessionAlertThreshold,
        isAtRisk: pkg.remainingSessions === 0,
      }));

      res.json(result);
    } catch (e: any) {
      console.error("[Private Class] Admin overview error:", e);
      res.status(500).json({ message: "Failed to fetch overview" });
    }
  });
  // PATCH /api/private-sessions/:packageId/next-scheduled — teacher sets next session time
  app.patch("/api/private-sessions/:packageId/next-scheduled", authenticate, authorize(['Teacher', 'Teacher/Tutor', 'Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) return res.status(400).json({ message: "Invalid package ID" });

      const schema = z.object({ nextScheduledAt: z.string().nullable() });
      const { nextScheduledAt } = schema.parse(req.body);

      const [pkg] = await db.select().from(studentSessionPackages).where(eq(studentSessionPackages.id, packageId));
      if (!pkg) return res.status(404).json({ message: "Package not found" });
      if ((['Teacher', 'Teacher/Tutor'].includes(req.user.role)) && pkg.teacherId !== req.user.id) return res.status(403).json({ message: "Not authorized" });

      await db.update(studentSessionPackages).set({
        nextScheduledAt: nextScheduledAt ? new Date(nextScheduledAt) : null,
        updatedAt: new Date(),
      }).where(eq(studentSessionPackages.id, packageId));

      res.json({ success: true });
    } catch (e: any) {
      res.status(500).json({ message: "Failed to update schedule" });
    }
  });

  // GET /api/admin/private-classes/:packageId/sessions — admin session history with full detail
  app.get("/api/admin/private-classes/:packageId/sessions", authenticate, authorize(['Admin', 'Supervisor']), async (req: any, res) => {
    try {
      const packageId = parseInt(req.params.packageId);
      if (isNaN(packageId)) return res.status(400).json({ message: "Invalid package ID" });

      const sessions = await db.select().from(privateSessions)
        .where(eq(privateSessions.studentSessionPackageId, packageId))
        .orderBy(desc(privateSessions.sessionDate));

      res.json(sessions);
    } catch (e: any) {
      res.status(500).json({ message: "Failed to fetch session history" });
    }
  });
}

// ===== Threshold Alert Helper =====
async function fireThresholdAlerts(pkg: typeof studentSessionPackages.$inferSelect, remaining: number) {
  console.log(`[Private Class] Firing low-session alerts for package ${pkg.id}, remaining: ${remaining}`);

  // 1. Mark alert as fired
  await db.update(studentSessionPackages).set({ alertFiredAt: new Date(), updatedAt: new Date() })
    .where(eq(studentSessionPackages.id, pkg.id));

  // 2. Notify student in-app
  await storage.createNotification({
    userId: pkg.studentId,
    notificationType: "low_sessions_alert",
    title: "جلسات شما رو به اتمام است",
    message: `تنها ${remaining} جلسه خصوصی باقی مانده است. لطفاً برای تمدید با موسسه تماس بگیرید.`,
  });

  // 3. SMS the student via Kavenegar if enabled
  try {
    const [settings] = await db.select().from(adminSettings).limit(1);
    if (settings?.kavenegarEnabled && settings?.kavenegarApiKey) {
      const [student] = await db.select({ phoneNumber: users.phoneNumber })
        .from(users).where(eq(users.id, pkg.studentId));
      if (student?.phoneNumber) {
        const { kavenegarService } = await import('../kavenegar-service');
        await kavenegarService.sendSimpleSMS(
          student.phoneNumber,
          `جلسات خصوصی شما رو به اتمام است. تنها ${remaining} جلسه باقی مانده. برای تمدید با موسسه تماس بگیرید.`
        );
        console.log(`[Private Class] SMS sent to student ${pkg.studentId}`);
      }
    }
  } catch (smsErr) {
    console.error('[Private Class] SMS send error (non-blocking):', smsErr);
  }

  // 3. Find the lead and transition to charge_renewal
  // Primary: use pkg.leadId for direct lookup; fallback: find by studentId + active stage
  let lead: typeof leads.$inferSelect | undefined;
  if (pkg.leadId) {
    const [byId] = await db.select().from(leads).where(eq(leads.id, pkg.leadId));
    lead = byId;
  }
  if (!lead) {
    const [byStage] = await db.select().from(leads).where(
      and(eq(leads.studentId, pkg.studentId), eq(leads.workflowStage, "active_private_class"))
    );
    lead = byStage;
  }

  if (lead) {
    await db.update(leads).set({
      workflowStage: "charge_renewal",
      updatedAt: new Date(),
    }).where(eq(leads.id, lead.id));

    const alertSnapshot: Record<string, unknown> = {
      remainingSessions: remaining,
      studentSessionPackageId: pkg.id,
      alertThreshold: pkg.lowSessionAlertThreshold,
    };
    await db.insert(leadActivityLog).values({
      leadId: lead.id,
      operatorId: pkg.teacherId,
      fromStage: "active_private_class",
      toStage: "charge_renewal",
      reason: `Low session alert: ${remaining} sessions remaining`,
      snapshot: alertSnapshot,
    });

    // 4. Get the current bundle info for recommended next bundle prefill
    const [currentBundle] = await db.select().from(sessionPackages).where(eq(sessionPackages.id, pkg.packageId));

    // 4. Notify assigned agent — fall back to any Admin if lead has no assignee
    let agentId = lead.assignedTo;
    if (!agentId) {
      const [fallbackAdmin] = await db.select({ id: users.id }).from(users)
        .where(eq(users.role, "Admin")).limit(1);
      agentId = fallbackAdmin?.id ?? null;
      if (agentId) {
        console.log(`[Private Class] No agent assigned to lead ${lead.id}; falling back to admin ${agentId} for task/notification.`);
      }
    }

    if (agentId) {
      await storage.createNotification({
        userId: agentId,
        notificationType: "low_sessions_agent_alert",
        title: "هشدار تمدید کلاس خصوصی",
        message: `دانش‌آموز ${lead.firstName} ${lead.lastName} تنها ${remaining} جلسه باقی دارد. نیاز به پیگیری دارد.`,
      });

      // 5. Create front desk task with recommended next bundle prefill
      const recommendedBundle = currentBundle ? `بسته پیشنهادی: "${currentBundle.name}" (همان بسته قبلی)` : "لطفاً بسته مناسب را انتخاب کنید";
      await db.insert(frontDeskTasks).values({
        assigneeId: agentId,
        title: `تمدید بسته کلاس خصوصی — ${lead.firstName} ${lead.lastName}`,
        description: `دانش‌آموز ${lead.firstName} ${lead.lastName} تنها ${remaining} جلسه خصوصی باقی دارد.\n${recommendedBundle}\nلطفاً برای تمدید پیگیری کنید.`,
        taskType: "payment_reminder",
        priority: "high",
        status: "pending",
        relatedEntityType: "student",
        relatedEntityId: String(pkg.studentId),
        dueDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days
      });
    } else {
      console.warn(`[Private Class] No agent or admin found for lead ${lead.id}; threshold task not created.`);
    }

    // 6. Notify all supervisors
    try {
      const supervisors = await db.select({ id: users.id }).from(users)
        .where(eq(users.role, "Supervisor"));
      for (const sup of supervisors) {
        await storage.createNotification({
          userId: sup.id,
          notificationType: "low_sessions_supervisor_alert",
          title: "هشدار تمدید کلاس خصوصی",
          message: `دانش‌آموز ${lead.firstName} ${lead.lastName} تنها ${remaining} جلسه خصوصی باقی دارد.`,
        });
      }
    } catch (e) {
      console.error("[Private Class] Supervisor notification error:", e);
    }
  }

  console.log(`[Private Class] Alerts fired for package ${pkg.id}`);
}
