/**
 * HR Module — REST API Routes
 * Accessible to Admin, Supervisor (read-only), and Accountant (payroll only).
 */

import { Router, type Request, type Response } from "express";
import { db } from "../db";
import { eq, and, desc, sql, asc } from "drizzle-orm";
import {
  employees, contracts, leaveRequests, payrollRecords, performanceReviews, users,
  type InsertEmployee, type InsertContract, type InsertLeaveRequest,
  type InsertPayrollRecord, type InsertPerformanceReview,
} from "@shared/schema";
import { authenticate } from "../auth";
import { computeEmployeeMetrics } from "../services/hr-performance-aggregator";
import { generateAiNarrative } from "../services/hr-ai-narratives";

const router = Router();

// ─── Guards ──────────────────────────────────────────────────────────────────

const isHrRole = (req: any, res: Response, next: () => void) => {
  const role = req.user?.role;
  if (["Admin", "Supervisor"].includes(role)) return next();
  return res.status(403).json({ message: "HR access requires Admin or Supervisor role" });
};

const isHrOrAccountant = (req: any, res: Response, next: () => void) => {
  const role = req.user?.role;
  if (["Admin", "Supervisor", "Accountant"].includes(role)) return next();
  return res.status(403).json({ message: "Access denied" });
};

// ─── Employee CRUD ────────────────────────────────────────────────────────────

router.get("/", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeCode: employees.employeeCode,
        department: employees.department,
        jobTitle: employees.jobTitle,
        contractType: employees.contractType,
        baseSalary: employees.baseSalary,
        hireDate: employees.hireDate,
        terminationDate: employees.terminationDate,
        status: employees.status,
        createdAt: employees.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        avatar: users.avatar,
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .orderBy(asc(employees.employeeCode));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const [emp] = await db
      .select({
        id: employees.id,
        userId: employees.userId,
        employeeCode: employees.employeeCode,
        department: employees.department,
        jobTitle: employees.jobTitle,
        contractType: employees.contractType,
        baseSalary: employees.baseSalary,
        hourlyRate: employees.hourlyRate,
        hireDate: employees.hireDate,
        terminationDate: employees.terminationDate,
        status: employees.status,
        bankAccountNumber: employees.bankAccountNumber,
        nationalId: employees.nationalId,
        emergencyContact: employees.emergencyContact,
        notes: employees.notes,
        createdAt: employees.createdAt,
        updatedAt: employees.updatedAt,
        firstName: users.firstName,
        lastName: users.lastName,
        email: users.email,
        phoneNumber: users.phoneNumber,
        role: users.role,
        avatar: users.avatar,
      })
      .from(employees)
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(employees.id, id));
    if (!emp) return res.status(404).json({ message: "Employee not found" });
    res.json(emp);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const body = req.body as InsertEmployee;
    // Generate employee code if not provided
    if (!body.employeeCode) {
      const [cnt] = await db.select({ c: sql<number>`count(*)` }).from(employees);
      body.employeeCode = `EMP${String(Number(cnt?.c ?? 0) + 1).padStart(4, "0")}`;
    }
    const [created] = await db.insert(employees).values(body).returning();
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates.id;
    const [updated] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Employee not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.delete("/:id", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(employees).where(eq(employees.id, id));
    res.json({ message: "Employee deleted" });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Contracts ────────────────────────────────────────────────────────────────

router.get("/:id/contracts", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db.select().from(contracts).where(eq(contracts.employeeId, employeeId)).orderBy(desc(contracts.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/contracts", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const body: InsertContract = { ...req.body, employeeId, createdBy: (req as any).user.id };
    const [created] = await db.insert(contracts).values(body).returning();
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Leave Requests ───────────────────────────────────────────────────────────

router.get("/leaves/all", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: leaveRequests.id,
        employeeId: leaveRequests.employeeId,
        leaveType: leaveRequests.leaveType,
        startDate: leaveRequests.startDate,
        endDate: leaveRequests.endDate,
        daysRequested: leaveRequests.daysRequested,
        reason: leaveRequests.reason,
        status: leaveRequests.status,
        reviewNotes: leaveRequests.reviewNotes,
        createdAt: leaveRequests.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(leaveRequests)
      .leftJoin(employees, eq(leaveRequests.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .orderBy(desc(leaveRequests.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.get("/:id/leaves", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db.select().from(leaveRequests).where(eq(leaveRequests.employeeId, employeeId)).orderBy(desc(leaveRequests.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.post("/:id/leaves", authenticate, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const body: InsertLeaveRequest = { ...req.body, employeeId };
    const [created] = await db.insert(leaveRequests).values(body).returning();
    res.status(201).json(created);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/leaves/:leaveId/review", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const leaveId = parseInt(req.params.leaveId);
    const { status, reviewNotes } = req.body as { status: string; reviewNotes?: string };
    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
    }
    const [updated] = await db
      .update(leaveRequests)
      .set({ status, reviewNotes: reviewNotes ?? null, reviewedBy: (req as any).user.id, reviewedAt: new Date(), updatedAt: new Date() })
      .where(eq(leaveRequests.id, leaveId))
      .returning();
    if (!updated) return res.status(404).json({ message: "Leave request not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Payroll ──────────────────────────────────────────────────────────────────

router.get("/payroll/period", authenticate, isHrOrAccountant, async (req: Request, res: Response) => {
  try {
    const year = parseInt(req.query.year as string) || new Date().getFullYear();
    const month = parseInt(req.query.month as string) || new Date().getMonth() + 1;
    const rows = await db
      .select({
        id: payrollRecords.id,
        employeeId: payrollRecords.employeeId,
        periodYear: payrollRecords.periodYear,
        periodMonth: payrollRecords.periodMonth,
        baseSalary: payrollRecords.baseSalary,
        overtimePay: payrollRecords.overtimePay,
        bonus: payrollRecords.bonus,
        deductions: payrollRecords.deductions,
        leaveDeductions: payrollRecords.leaveDeductions,
        grossPay: payrollRecords.grossPay,
        netPay: payrollRecords.netPay,
        workingDays: payrollRecords.workingDays,
        presentDays: payrollRecords.presentDays,
        leavesDays: payrollRecords.leavesDays,
        status: payrollRecords.status,
        firstName: users.firstName,
        lastName: users.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
      })
      .from(payrollRecords)
      .leftJoin(employees, eq(payrollRecords.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(and(eq(payrollRecords.periodYear, year), eq(payrollRecords.periodMonth, month)))
      .orderBy(asc(employees.employeeCode));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Calculate (or recalculate) payroll for a period — auto-computes from contract + approved leaves
router.post("/payroll/calculate", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const { year, month } = req.body as { year: number; month: number };
    if (!year || !month) return res.status(400).json({ message: "year and month are required" });

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);

    // Working days in month (Mon-Fri excluding Iranian weekends: Fri-Sat here simplified to standard)
    const workingDaysInMonth = Math.ceil(
      (periodEnd.getDate() * 5) / 7
    );

    const allEmployees = await db.select().from(employees).where(eq(employees.status, "active"));
    const results = [];

    for (const emp of allEmployees) {
      // Get active contract
      const [activeContract] = await db
        .select()
        .from(contracts)
        .where(and(eq(contracts.employeeId, emp.id), eq(contracts.status, "active")))
        .orderBy(desc(contracts.createdAt))
        .limit(1);

      const baseSalary = activeContract ? Number(activeContract.salaryAmount) : Number(emp.baseSalary ?? 0);

      // Get approved leaves in period
      const approvedLeaves = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.employeeId, emp.id),
            eq(leaveRequests.status, "approved"),
            sql`${leaveRequests.startDate} <= ${periodEnd.toISOString().split("T")[0]}`,
            sql`${leaveRequests.endDate} >= ${periodStart.toISOString().split("T")[0]}`
          )
        );

      const leaveDays = approvedLeaves.reduce((s, l) => s + Number(l.daysRequested ?? 0), 0);
      const dailyRate = workingDaysInMonth > 0 ? baseSalary / workingDaysInMonth : 0;
      const unpaidLeaveDays = approvedLeaves.filter(l => l.leaveType === "unpaid").reduce((s, l) => s + Number(l.daysRequested ?? 0), 0);
      const leaveDeductions = unpaidLeaveDays * dailyRate;

      const grossPay = baseSalary - leaveDeductions;
      const netPay = grossPay; // Simplified — no tax in v1

      // Upsert payroll record
      const existing = await db
        .select()
        .from(payrollRecords)
        .where(and(eq(payrollRecords.employeeId, emp.id), eq(payrollRecords.periodYear, year), eq(payrollRecords.periodMonth, month)))
        .limit(1);

      if (existing.length > 0) {
        const [updated] = await db
          .update(payrollRecords)
          .set({
            baseSalary: baseSalary.toFixed(2),
            leaveDeductions: leaveDeductions.toFixed(2),
            grossPay: grossPay.toFixed(2),
            netPay: netPay.toFixed(2),
            workingDays: workingDaysInMonth,
            presentDays: workingDaysInMonth - Math.round(leaveDays),
            leavesDays: leaveDays.toFixed(1),
            updatedAt: new Date(),
          })
          .where(eq(payrollRecords.id, existing[0].id))
          .returning();
        results.push(updated);
      } else {
        const [created] = await db
          .insert(payrollRecords)
          .values({
            employeeId: emp.id,
            periodYear: year,
            periodMonth: month,
            baseSalary: baseSalary.toFixed(2),
            overtimePay: "0",
            bonus: "0",
            deductions: "0",
            leaveDeductions: leaveDeductions.toFixed(2),
            grossPay: grossPay.toFixed(2),
            netPay: netPay.toFixed(2),
            workingDays: workingDaysInMonth,
            presentDays: workingDaysInMonth - Math.round(leaveDays),
            leavesDays: leaveDays.toFixed(1),
            status: "draft",
          })
          .returning();
        results.push(created);
      }
    }

    res.json({ calculatedCount: results.length, records: results });
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/payroll/:recordId/approve", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    const [updated] = await db
      .update(payrollRecords)
      .set({ status: "approved", approvedBy: (req as any).user.id, updatedAt: new Date() })
      .where(eq(payrollRecords.id, recordId))
      .returning();
    if (!updated) return res.status(404).json({ message: "Payroll record not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Performance Reviews ──────────────────────────────────────────────────────

router.get("/:id/performance", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.employeeId, employeeId))
      .orderBy(desc(performanceReviews.reviewYear), desc(performanceReviews.reviewMonth));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// Generate (or regenerate) performance review for a given month
router.post("/:id/performance/generate", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const { year, month } = req.body as { year: number; month: number };
    if (!year || !month) return res.status(400).json({ message: "year and month are required" });

    const metrics = await computeEmployeeMetrics(employeeId, year, month);
    const { narrative, improvementPlan, anomalyDetected, anomalyDetails, threeMonthAvgScore, previousMonthScore } =
      await generateAiNarrative(employeeId, year, month, metrics.breakdown, metrics.overallScore) as any;

    const reviewData: InsertPerformanceReview = {
      employeeId,
      reviewYear: year,
      reviewMonth: month,
      overallScore: metrics.overallScore.toFixed(2),
      metricBreakdown: metrics.breakdown,
      aiNarrative: narrative,
      improvementPlan: improvementPlan ?? null,
      anomalyDetected,
      anomalyDetails: anomalyDetails ?? null,
      previousMonthScore: previousMonthScore != null ? String(previousMonthScore) : null,
      threeMonthAvgScore: threeMonthAvgScore != null ? String(threeMonthAvgScore) : null,
      generatedAt: new Date(),
      status: "draft",
    };

    // Upsert
    const existing = await db
      .select()
      .from(performanceReviews)
      .where(and(eq(performanceReviews.employeeId, employeeId), eq(performanceReviews.reviewYear, year), eq(performanceReviews.reviewMonth, month)))
      .limit(1);

    let review;
    if (existing.length > 0) {
      [review] = await db.update(performanceReviews).set({ ...reviewData, updatedAt: new Date() }).where(eq(performanceReviews.id, existing[0].id)).returning();
    } else {
      [review] = await db.insert(performanceReviews).values(reviewData).returning();
    }

    res.json(review);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

router.put("/:id/performance/:reviewId/publish", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const [updated] = await db
      .update(performanceReviews)
      .set({ status: "published", reviewedBy: (req as any).user.id, updatedAt: new Date() })
      .where(eq(performanceReviews.id, reviewId))
      .returning();
    if (!updated) return res.status(404).json({ message: "Review not found" });
    res.json(updated);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

// ─── Performance Anomalies (admin alert endpoint) ─────────────────────────────
router.get("/performance/anomalies", authenticate, isHrRole, async (req: Request, res: Response) => {
  try {
    const rows = await db
      .select({
        id: performanceReviews.id,
        employeeId: performanceReviews.employeeId,
        reviewYear: performanceReviews.reviewYear,
        reviewMonth: performanceReviews.reviewMonth,
        overallScore: performanceReviews.overallScore,
        anomalyDetails: performanceReviews.anomalyDetails,
        createdAt: performanceReviews.createdAt,
        firstName: users.firstName,
        lastName: users.lastName,
        employeeCode: employees.employeeCode,
      })
      .from(performanceReviews)
      .leftJoin(employees, eq(performanceReviews.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(eq(performanceReviews.anomalyDetected, true))
      .orderBy(desc(performanceReviews.createdAt));
    res.json(rows);
  } catch (err: any) {
    res.status(500).json({ message: err.message });
  }
});

export default router;
