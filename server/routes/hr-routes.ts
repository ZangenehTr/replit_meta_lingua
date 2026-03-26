/**
 * HR Module — REST API Routes
 *
 * RBAC policy:
 *  Admin     → full read/write across all HR resources
 *  Supervisor → read employees/contracts/leaves/performance; approve or reject leaves
 *  Accountant → read payroll records only
 *
 * All mutating operations (create, update, delete employees/contracts, calculate/approve payroll,
 * generate/publish performance reviews) require Admin role.
 */

import { Router, type Request, type Response, type NextFunction } from "express";
import { db } from "../db";
import { eq, and, desc, sql, asc, gte, lte } from "drizzle-orm";
import {
  employees, contracts, leaveRequests, payrollRecords, performanceReviews, performanceScores, users,
  attendanceRecords,
  type InsertEmployee, type InsertContract, type InsertLeaveRequest,
  type InsertPayrollRecord, type InsertPerformanceReview, type InsertPerformanceScore,
} from "@shared/schema";
import { authenticate } from "../auth";
import { computeEmployeeMetrics } from "../services/hr-performance-aggregator";
import { generateAiNarrative, type AiNarrativeResult } from "../services/hr-ai-narratives";

const router = Router();

// ─── Typed request ────────────────────────────────────────────────────────────

interface AuthRequest extends Request {
  user?: { id: number; role: string; phoneNumber?: string };
}

// ─── Guards ───────────────────────────────────────────────────────────────────

function isAdmin(req: AuthRequest, res: Response, next: NextFunction): void {
  if (req.user?.role === "Admin") { next(); return; }
  res.status(403).json({ message: "Admin access required" });
}

function isHrReadRole(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role === "Admin" || role === "Supervisor") { next(); return; }
  res.status(403).json({ message: "HR access requires Admin or Supervisor role" });
}

function isPayrollReadRole(req: AuthRequest, res: Response, next: NextFunction): void {
  const role = req.user?.role;
  if (role === "Admin" || role === "Supervisor" || role === "Accountant") { next(); return; }
  res.status(403).json({ message: "Payroll access requires Admin, Supervisor, or Accountant role" });
}

// ─── Employee CRUD ────────────────────────────────────────────────────────────

router.get("/", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
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
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

router.get("/:id(\\d+)", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
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
    if (!emp) { res.status(404).json({ message: "Employee not found" }); return; }
    res.json(emp);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const body = req.body as InsertEmployee;
    if (!body.employeeCode) {
      const [cnt] = await db.select({ c: sql<number>`count(*)` }).from(employees);
      body.employeeCode = `EMP${String(Number(cnt?.c ?? 0) + 1).padStart(4, "0")}`;
    }
    const [created] = await db.insert(employees).values(body).returning();
    res.status(201).json(created);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

router.put("/:id(\\d+)", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    const updates = { ...req.body, updatedAt: new Date() };
    delete updates.id;
    const [updated] = await db.update(employees).set(updates).where(eq(employees.id, id)).returning();
    if (!updated) { res.status(404).json({ message: "Employee not found" }); return; }
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

router.delete("/:id(\\d+)", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    await db.delete(employees).where(eq(employees.id, id));
    res.json({ message: "Employee deleted" });
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Contracts ────────────────────────────────────────────────────────────────

router.get("/:id(\\d+)/contracts", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db.select().from(contracts).where(eq(contracts.employeeId, employeeId)).orderBy(desc(contracts.createdAt));

    // Annotate contracts expiring within 30 days
    const today = new Date();
    const in30 = new Date();
    in30.setDate(today.getDate() + 30);
    const annotated = rows.map(c => ({
      ...c,
      renewalAlert: c.endDate && new Date(c.endDate) >= today && new Date(c.endDate) <= in30,
      isExpired: c.endDate && new Date(c.endDate) < today,
    }));
    res.json(annotated);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET /contracts/expiring — contracts expiring within N days (default 30)
router.get("/contracts/expiring", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(String(req.query.days ?? "30"));
    const today = new Date().toISOString().split("T")[0];
    const cutoff = new Date();
    cutoff.setDate(cutoff.getDate() + days);
    const cutoffStr = cutoff.toISOString().split("T")[0];

    const rows = await db
      .select({
        id: contracts.id,
        employeeId: contracts.employeeId,
        contractType: contracts.contractType,
        startDate: contracts.startDate,
        endDate: contracts.endDate,
        salaryAmount: contracts.salaryAmount,
        status: contracts.status,
        firstName: users.firstName,
        lastName: users.lastName,
        employeeCode: employees.employeeCode,
        department: employees.department,
      })
      .from(contracts)
      .leftJoin(employees, eq(contracts.employeeId, employees.id))
      .leftJoin(users, eq(employees.userId, users.id))
      .where(
        and(
          eq(contracts.status, "active"),
          gte(contracts.endDate, today),
          lte(contracts.endDate, cutoffStr)
        )
      )
      .orderBy(asc(contracts.endDate));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

router.post("/:id(\\d+)/contracts", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const adminId = req.user!.id;
    const body: InsertContract = { ...req.body, employeeId, createdBy: adminId };
    const [created] = await db.insert(contracts).values(body).returning();
    res.status(201).json(created);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Leave Requests ───────────────────────────────────────────────────────────

// GET all leave requests (HR view) — Admin + Supervisor
router.get("/leaves/all", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
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
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET leave balance summary for an employee
router.get("/:id(\\d+)/leaves/balance", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const year = parseInt(String(req.query.year ?? new Date().getFullYear()));
    const yearStart = `${year}-01-01`;
    const yearEnd = `${year}-12-31`;

    const yearLeaves = await db
      .select()
      .from(leaveRequests)
      .where(
        and(
          eq(leaveRequests.employeeId, employeeId),
          gte(leaveRequests.startDate, yearStart),
          lte(leaveRequests.endDate, yearEnd)
        )
      );

    const ANNUAL_ENTITLEMENT: Record<string, number> = {
      annual: 21,
      sick: 10,
      emergency: 3,
      unpaid: 0,
      maternity: 90,
      paternity: 10,
    };

    const used: Record<string, number> = {};
    const pending: Record<string, number> = {};
    for (const lr of yearLeaves) {
      const days = Number(lr.daysRequested ?? 0);
      if (lr.status === "approved") {
        used[lr.leaveType] = (used[lr.leaveType] ?? 0) + days;
      } else if (lr.status === "pending") {
        pending[lr.leaveType] = (pending[lr.leaveType] ?? 0) + days;
      }
    }

    const balance = Object.entries(ANNUAL_ENTITLEMENT).map(([type, entitled]) => ({
      leaveType: type,
      entitled,
      used: used[type] ?? 0,
      pending: pending[type] ?? 0,
      remaining: Math.max(0, entitled - (used[type] ?? 0)),
    }));

    res.json({ employeeId, year, balance });
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET employee's own leaves
router.get("/:id(\\d+)/leaves", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, employeeId))
      .orderBy(desc(leaveRequests.createdAt));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// POST create leave request — Admin only (HR staff manage on behalf of employees)
router.post("/:id(\\d+)/leaves", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const body: InsertLeaveRequest = { ...req.body, employeeId };
    const [created] = await db.insert(leaveRequests).values(body).returning();
    res.status(201).json(created);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// POST self-service leave submission — any authenticated employee
// Staff submit their OWN leave requests; the route resolves their employee record from JWT identity.
router.post("/leaves/self", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emp] = await db.select().from(employees).where(eq(employees.userId, userId));
    if (!emp) {
      res.status(404).json({ message: "No employee record found for your account. Contact HR." });
      return;
    }
    const { leaveType, startDate, endDate, daysRequested, reason } = req.body as {
      leaveType: string;
      startDate: string;
      endDate: string;
      daysRequested?: number;
      reason?: string;
    };
    if (!leaveType || !startDate || !endDate) {
      res.status(400).json({ message: "leaveType, startDate, and endDate are required" });
      return;
    }
    const body: InsertLeaveRequest = {
      employeeId: emp.id,
      leaveType,
      startDate,
      endDate,
      daysRequested: daysRequested ?? 1,
      reason: reason ?? null,
      status: "pending",
    };
    const [created] = await db.insert(leaveRequests).values(body).returning();
    res.status(201).json(created);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// GET self — employee views their own leave history
router.get("/leaves/self", authenticate, async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user!.id;
    const [emp] = await db.select().from(employees).where(eq(employees.userId, userId));
    if (!emp) { res.status(404).json({ message: "No employee record found" }); return; }
    const rows = await db
      .select()
      .from(leaveRequests)
      .where(eq(leaveRequests.employeeId, emp.id))
      .orderBy(desc(leaveRequests.createdAt));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// PUT review (approve/reject) leave — Admin + Supervisor
router.put("/leaves/:leaveId(\\d+)/review", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const leaveId = parseInt(req.params.leaveId);
    const { status, reviewNotes } = req.body as { status: string; reviewNotes?: string };
    if (!["approved", "rejected"].includes(status)) {
      res.status(400).json({ message: "status must be 'approved' or 'rejected'" });
      return;
    }
    const reviewerId = req.user!.id;
    const [updated] = await db
      .update(leaveRequests)
      .set({
        status,
        reviewNotes: reviewNotes ?? null,
        reviewedBy: reviewerId,
        reviewedAt: new Date(),
        updatedAt: new Date(),
      })
      .where(eq(leaveRequests.id, leaveId))
      .returning();
    if (!updated) { res.status(404).json({ message: "Leave request not found" }); return; }
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Payroll ──────────────────────────────────────────────────────────────────

router.get("/payroll/period", authenticate, isPayrollReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const year = parseInt(String(req.query.year ?? new Date().getFullYear()));
    const month = parseInt(String(req.query.month ?? new Date().getMonth() + 1));
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
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// Calculate payroll — Admin only
router.post("/payroll/calculate", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const { year, month } = req.body as { year: number; month: number };
    if (!year || !month) { res.status(400).json({ message: "year and month are required" }); return; }

    const periodStart = new Date(year, month - 1, 1);
    const periodEnd = new Date(year, month, 0, 23, 59, 59);
    // Count actual working days: Iranian work week is Sat–Thu; Friday is the weekly holiday
    let workingDaysInMonth = 0;
    for (let d = new Date(year, month - 1, 1); d <= periodEnd; d.setDate(d.getDate() + 1)) {
      if (d.getDay() !== 5) workingDaysInMonth++; // 5 = Friday in JS (0=Sun…6=Sat)
    }

    const allEmployees = await db.select().from(employees).where(eq(employees.status, "active"));
    const results = [];

    for (const emp of allEmployees) {
      const [activeContract] = await db
        .select()
        .from(contracts)
        .where(and(eq(contracts.employeeId, emp.id), eq(contracts.status, "active")))
        .orderBy(desc(contracts.createdAt))
        .limit(1);

      const baseSalary = activeContract ? Number(activeContract.salaryAmount) : Number(emp.baseSalary ?? 0);
      const periodStartStr = periodStart.toISOString().split("T")[0];
      const periodEndStr = periodEnd.toISOString().split("T")[0];

      const approvedLeaves = await db
        .select()
        .from(leaveRequests)
        .where(
          and(
            eq(leaveRequests.employeeId, emp.id),
            eq(leaveRequests.status, "approved"),
            lte(leaveRequests.startDate, periodEndStr),
            gte(leaveRequests.endDate, periodStartStr)
          )
        );

      const leaveDays = approvedLeaves.reduce((s, l) => s + Number(l.daysRequested ?? 0), 0);
      const dailyRate = workingDaysInMonth > 0 ? baseSalary / workingDaysInMonth : 0;
      const unpaidLeaveDays = approvedLeaves
        .filter(l => l.leaveType === "unpaid")
        .reduce((s, l) => s + Number(l.daysRequested ?? 0), 0);
      const leaveDeductions = unpaidLeaveDays * dailyRate;

      // Count actual present days from attendance records for this employee's user account
      const [attendanceRow] = await db
        .select({ presentDays: sql<number>`COUNT(DISTINCT DATE(${attendanceRecords.checkInTime}))` })
        .from(attendanceRecords)
        .where(
          and(
            eq(attendanceRecords.userId, emp.userId),
            sql`${attendanceRecords.attendanceType} IN ('present', 'late')`,
            gte(attendanceRecords.checkInTime, periodStart),
            lte(attendanceRecords.checkInTime, periodEnd)
          )
        );
      const presentDays = Number(attendanceRow?.presentDays ?? workingDaysInMonth - Math.round(leaveDays));
      const absentDays = Math.max(0, workingDaysInMonth - presentDays - Math.round(leaveDays));
      const absenceDeductions = absentDays * dailyRate;
      const grossPay = baseSalary - leaveDeductions - absenceDeductions;
      const netPay = grossPay;

      const existing = await db
        .select()
        .from(payrollRecords)
        .where(
          and(
            eq(payrollRecords.employeeId, emp.id),
            eq(payrollRecords.periodYear, year),
            eq(payrollRecords.periodMonth, month)
          )
        )
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
            presentDays,
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
            presentDays,
            leavesDays: leaveDays.toFixed(1),
            status: "draft",
          })
          .returning();
        results.push(created);
      }
    }

    res.json({ calculatedCount: results.length, records: results });
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// Approve payroll record — Admin only
router.put("/payroll/:recordId(\\d+)/approve", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const recordId = parseInt(req.params.recordId);
    const adminId = req.user!.id;
    const [updated] = await db
      .update(payrollRecords)
      .set({ status: "approved", approvedBy: adminId, updatedAt: new Date() })
      .where(eq(payrollRecords.id, recordId))
      .returning();
    if (!updated) { res.status(404).json({ message: "Payroll record not found" }); return; }
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Performance Scores (raw metric snapshots) ────────────────────────────────

// GET raw metric scores for an employee
router.get("/:id(\\d+)/scores", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db
      .select()
      .from(performanceScores)
      .where(eq(performanceScores.employeeId, employeeId))
      .orderBy(desc(performanceScores.periodYear), desc(performanceScores.periodMonth));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// POST upsert raw score snapshot — Admin only
router.post("/:id(\\d+)/scores", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const body = req.body as InsertPerformanceScore;
    const [created] = await db.insert(performanceScores).values({ ...body, employeeId }).returning();
    res.status(201).json(created);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Performance Reviews ──────────────────────────────────────────────────────

router.get("/:id(\\d+)/performance", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const rows = await db
      .select()
      .from(performanceReviews)
      .where(eq(performanceReviews.employeeId, employeeId))
      .orderBy(desc(performanceReviews.reviewYear), desc(performanceReviews.reviewMonth));
    res.json(rows);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// Generate/regenerate performance review — Admin only
router.post("/:id(\\d+)/performance/generate", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const employeeId = parseInt(req.params.id);
    const { year, month } = req.body as { year: number; month: number };
    if (!year || !month) { res.status(400).json({ message: "year and month are required" }); return; }

    const metrics = await computeEmployeeMetrics(employeeId, year, month);
    const aiResult: AiNarrativeResult = await generateAiNarrative(
      employeeId, year, month, metrics.breakdown, metrics.overallScore
    );

    const reviewData: InsertPerformanceReview = {
      employeeId,
      reviewYear: year,
      reviewMonth: month,
      overallScore: metrics.overallScore.toFixed(2),
      metricBreakdown: metrics.breakdown,
      aiNarrative: aiResult.narrative,
      improvementPlan: aiResult.improvementPlan,
      anomalyDetected: aiResult.anomalyDetected,
      anomalyDetails: aiResult.anomalyDetails,
      previousMonthScore: aiResult.previousMonthScore != null ? String(aiResult.previousMonthScore) : null,
      threeMonthAvgScore: aiResult.threeMonthAvgScore != null ? String(aiResult.threeMonthAvgScore) : null,
      generatedAt: new Date(),
      status: "draft",
    };

    const existing = await db
      .select()
      .from(performanceReviews)
      .where(
        and(
          eq(performanceReviews.employeeId, employeeId),
          eq(performanceReviews.reviewYear, year),
          eq(performanceReviews.reviewMonth, month)
        )
      )
      .limit(1);

    let review;
    if (existing.length > 0) {
      [review] = await db
        .update(performanceReviews)
        .set({ ...reviewData, updatedAt: new Date() })
        .where(eq(performanceReviews.id, existing[0].id))
        .returning();
    } else {
      [review] = await db.insert(performanceReviews).values(reviewData).returning();
    }

    res.json(review);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// Publish review — Admin only
router.put("/:empId(\\d+)/performance/:reviewId(\\d+)/publish", authenticate, isAdmin, async (req: AuthRequest, res: Response) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const adminId = req.user!.id;
    const [updated] = await db
      .update(performanceReviews)
      .set({ status: "published", reviewedBy: adminId, updatedAt: new Date() })
      .where(eq(performanceReviews.id, reviewId))
      .returning();
    if (!updated) { res.status(404).json({ message: "Review not found" }); return; }
    res.json(updated);
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

// ─── Performance Anomalies ────────────────────────────────────────────────────

router.get("/performance/anomalies", authenticate, isHrReadRole, async (req: AuthRequest, res: Response) => {
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
  } catch (err: unknown) {
    res.status(500).json({ message: err instanceof Error ? err.message : "Internal error" });
  }
});

export default router;
