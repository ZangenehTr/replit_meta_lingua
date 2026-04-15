/**
 * Class Lateness Detection & Check-in Routes
 *
 * Handles:
 * - Public SMS check-in link (/api/cs/:token)
 * - Teacher "Start Class" button
 * - Admin lateness report
 * - CallerN lateness detection hook
 */

import type { Express } from "express";
import { db } from "../db";
import { eq, and, gte, lte, isNull, desc, asc, inArray, sql, ne } from "drizzle-orm";
import type { SQL } from "drizzle-orm";
import { alias } from "drizzle-orm/pg-core";
import type { Request, Response } from "express";
import {
  classSessions,
  classStartConfirmations,
  latenessRecords,
  classEnrollments,
  classes,
  users,
  callSessions,
  employees,
  performanceScores,
} from "@shared/schema";
import { kavenegarService } from "../kavenegar-service";
import crypto from "crypto";

type AuthMiddleware = (req: Request, res: Response, next: () => void) => void;

interface AuthenticatedRequest extends Request {
  user: { id: number; role: string };
}

interface RouteContext {
  authenticateToken: AuthMiddleware;
  requireRole: (roles: string[]) => AuthMiddleware;
}

// ─── HR Integration helper ────────────────────────────────────────────────────

async function writeHRPerformanceScore(
  teacherId: number,
  delayMinutes: number,
  classType: string
): Promise<void> {
  try {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;

    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, teacherId))
      .limit(1);

    if (!emp) return;

    const penalty = Math.min(30, delayMinutes); // cap penalty at 30 points
    await db.insert(performanceScores).values({
      employeeId: emp.id,
      periodYear: year,
      periodMonth: month,
      metricName: "lateness_penalty",
      metricValue: String(-penalty),
      normalizedScore: String(Math.max(0, 100 - penalty * 2)),
      dataSource: "lateness_detection",
      notes: `${classType} class late by ${delayMinutes} min`,
    });
  } catch (err) {
    console.error("HR perf score write failed:", err);
  }
}

// ─── WebSocket broadcast helper (injected at startup) ─────────────────────────
let _io: any = null;
export function setClassCheckinIO(io: any) {
  _io = io;
}

function broadcastToSupervisors(event: string, data: any) {
  if (_io) {
    _io.to("lateness-supervisors").emit(event, data);
  }
}

// ─── Route setup ──────────────────────────────────────────────────────────────

export function setupClassCheckinRoutes(
  app: Express,
  context: RouteContext
): void {
  const { authenticateToken, requireRole } = context;

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: SMS check-in landing page data
  // GET /api/cs/:token
  // ──────────────────────────────────────────────────────────────────────────
  app.get("/api/cs/:token", async (req, res) => {
    try {
      const { token } = req.params;

      const [confirmation] = await db
        .select()
        .from(classStartConfirmations)
        .where(eq(classStartConfirmations.smsToken, token))
        .limit(1);

      if (!confirmation) {
        return res.status(404).json({ message: "Invalid or expired link" });
      }

      const [session] = await db
        .select()
        .from(classSessions)
        .where(eq(classSessions.id, confirmation.classSessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      const [cls] = await db
        .select({
          name: classes.name,
          teacherId: classes.teacherId,
          isOnline: classes.isOnline,
          status: classes.status,
        })
        .from(classes)
        .where(eq(classes.id, session.classId))
        .limit(1);

      const [teacher] = cls?.teacherId
        ? await db
            .select({
              firstName: users.firstName,
              lastName: users.lastName,
            })
            .from(users)
            .where(eq(users.id, cls.teacherId))
            .limit(1)
        : [null];

      // Authoritative cancellation: if the parent class is cancelled, always report cancelled
      const effectiveStatus = cls?.status === "cancelled" ? "cancelled" : session.status;

      return res.json({
        token,
        className: cls?.name,
        teacherName: teacher
          ? `${teacher.firstName} ${teacher.lastName}`
          : "Unknown",
        scheduledStart: session.scheduledStart,
        sessionStatus: effectiveStatus,
        tokenActive: confirmation.isActive,
        alreadyConfirmed: !!confirmation.confirmedAt,
      });
    } catch (err) {
      console.error("CS token lookup error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // PUBLIC: Confirm presence via SMS link
  // POST /api/cs/:token/confirm
  // ──────────────────────────────────────────────────────────────────────────
  app.post("/api/cs/:token/confirm", async (req, res) => {
    try {
      const { token } = req.params;

      const [confirmation] = await db
        .select()
        .from(classStartConfirmations)
        .where(eq(classStartConfirmations.smsToken, token))
        .limit(1);

      if (!confirmation || !confirmation.isActive) {
        return res
          .status(400)
          .json({ message: "This link is no longer active" });
      }

      if (confirmation.confirmedAt) {
        return res
          .status(400)
          .json({ message: "You already confirmed presence" });
      }

      const [session] = await db
        .select()
        .from(classSessions)
        .where(eq(classSessions.id, confirmation.classSessionId))
        .limit(1);

      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Authoritative cancellation check: join against the class directly
      const [sessionClass] = await db
        .select({ status: classes.status })
        .from(classes)
        .where(eq(classes.id, session.classId))
        .limit(1);

      if (session.status === "cancelled" || sessionClass?.status === "cancelled") {
        return res
          .status(400)
          .json({ message: "This class has been cancelled" });
      }

      // Check link is within 30 min after scheduled start
      const now = new Date();
      const cutoff = new Date(
        session.scheduledStart.getTime() + 30 * 60 * 1000
      );
      if (now > cutoff) {
        return res
          .status(400)
          .json({ message: "Check-in window has expired" });
      }

      // First-write-wins: atomic update with RETURNING to detect races
      const updatedRows = await db
        .update(classSessions)
        .set({
          actualStartTime: now,
          startedByStudentId: confirmation.studentId,
          startMethod: "sms_link",
          status: "started",
          updatedAt: now,
        })
        .where(
          and(
            eq(classSessions.id, session.id),
            isNull(classSessions.actualStartTime)
          )
        )
        .returning({ id: classSessions.id });

      if (updatedRows.length === 0) {
        // Another request already claimed the start slot
        return res
          .status(409)
          .json({ message: "Class already started by another student" });
      }

      // Deactivate all other tokens for this session
      await db
        .update(classStartConfirmations)
        .set({ isActive: false })
        .where(
          and(
            eq(classStartConfirmations.classSessionId, session.id),
            eq(classStartConfirmations.smsToken, token)
          )
        );

      // Mark this token as confirmed; flag late if after scheduled start
      const isConfirmationLate = now > session.scheduledStart;
      await db
        .update(classStartConfirmations)
        .set({ confirmedAt: now, method: "sms_link", isLate: isConfirmationLate })
        .where(eq(classStartConfirmations.smsToken, token));

      // Deactivate remaining tokens for this session
      await db
        .update(classStartConfirmations)
        .set({ isActive: false })
        .where(
          and(
            eq(classStartConfirmations.classSessionId, session.id),
            eq(classStartConfirmations.isActive, true)
          )
        );

      // Get confirming student name
      const [student] = await db
        .select({ firstName: users.firstName, lastName: users.lastName })
        .from(users)
        .where(eq(users.id, confirmation.studentId))
        .limit(1);

      const studentName = student
        ? `${student.firstName} ${student.lastName}`
        : "A student";

      // Send confirmation SMS to other students who got the SMS
      const otherConfirmations = await db
        .select({ studentId: classStartConfirmations.studentId })
        .from(classStartConfirmations)
        .where(
          and(
            eq(classStartConfirmations.classSessionId, session.id),
            eq(classStartConfirmations.isActive, false)
          )
        );

      for (const other of otherConfirmations) {
        if (other.studentId === confirmation.studentId) continue;
        const [otherStudent] = await db
          .select({ phoneNumber: users.phoneNumber })
          .from(users)
          .where(eq(users.id, other.studentId))
          .limit(1);
        if (otherStudent?.phoneNumber) {
          await kavenegarService.sendSimpleSMS(
            otherStudent.phoneNumber,
            `Class opened by ${studentName}. Class has started!`
          );
        }
      }

      // Write lateness record if delayed > 5 min (idempotent: skip if already recorded)
      const delayMs = now.getTime() - session.scheduledStart.getTime();
      const delayMin = Math.floor(delayMs / 60000);
      if (delayMin > 5) {
        const [cls] = await db
          .select({ teacherId: classes.teacherId })
          .from(classes)
          .where(eq(classes.id, session.classId))
          .limit(1);

        if (cls?.teacherId) {
          const [existingRecord] = await db
            .select({ id: latenessRecords.id })
            .from(latenessRecords)
            .where(eq(latenessRecords.classSessionId, session.id))
            .limit(1);
          if (!existingRecord) {
            await db.insert(latenessRecords).values({
              classSessionId: session.id,
              teacherId: cls.teacherId,
              scheduledStart: session.scheduledStart,
              actualStart: now,
              delayMinutes: delayMin,
              classType: "in_person",
              detectionMethod: "sms_confirmation",
            });
            await writeHRPerformanceScore(cls.teacherId, delayMin, "in_person");
          }
        }
      }

      broadcastToSupervisors("class-started", {
        sessionId: session.id,
        startedBy: studentName,
        method: "sms_link",
        scheduledStart: session.scheduledStart,
        actualStart: now,
      });

      return res.json({ success: true, message: "Presence confirmed!" });
    } catch (err) {
      console.error("CS confirm error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // TEACHER: Start Class button
  // POST /api/teacher/class-sessions/:sessionId/start
  // ──────────────────────────────────────────────────────────────────────────
  app.post(
    "/api/teacher/class-sessions/:sessionId/start",
    authenticateToken,
    requireRole(["Teacher", "Teacher/Tutor"]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const sessionId = parseInt(req.params.sessionId);
        const teacherId = req.user.id;
        const now = new Date();

        const [session] = await db
          .select()
          .from(classSessions)
          .where(eq(classSessions.id, sessionId))
          .limit(1);

        if (!session) {
          return res.status(404).json({ message: "Session not found" });
        }

        if (session.status === "cancelled") {
          return res.status(400).json({ message: "Cannot start a cancelled session" });
        }

        // Verify this teacher owns the class
        const [cls] = await db
          .select({ teacherId: classes.teacherId, name: classes.name })
          .from(classes)
          .where(eq(classes.id, session.classId))
          .limit(1);

        if (!cls || cls.teacherId !== teacherId) {
          return res.status(403).json({ message: "Not your class" });
        }

        // Check window: 15 min before → 30 min after
        const windowStart = new Date(
          session.scheduledStart.getTime() - 15 * 60 * 1000
        );
        const windowEnd = new Date(
          session.scheduledStart.getTime() + 30 * 60 * 1000
        );

        if (now < windowStart || now > windowEnd) {
          return res
            .status(400)
            .json({ message: "Outside the allowed start window" });
        }

        // Atomic first-write-wins: only succeeds if no one else has started it
        const updatedTeacherRows = await db
          .update(classSessions)
          .set({
            actualStartTime: now,
            startMethod: "app_button",
            status: "started",
            updatedAt: now,
          })
          .where(
            and(
              eq(classSessions.id, sessionId),
              isNull(classSessions.actualStartTime)
            )
          )
          .returning({ id: classSessions.id });

        if (updatedTeacherRows.length === 0) {
          return res
            .status(409)
            .json({ message: "Class already started" });
        }

        // Deactivate all pending SMS tokens
        await db
          .update(classStartConfirmations)
          .set({ isActive: false })
          .where(
            and(
              eq(classStartConfirmations.classSessionId, sessionId),
              eq(classStartConfirmations.isActive, true)
            )
          );

        // Write lateness record if delayed > 5 min (idempotent: skip if already recorded)
        const delayMs = now.getTime() - session.scheduledStart.getTime();
        const delayMin = Math.floor(delayMs / 60000);
        if (delayMin > 5) {
          const [existingTeacherRecord] = await db
            .select({ id: latenessRecords.id })
            .from(latenessRecords)
            .where(eq(latenessRecords.classSessionId, session.id))
            .limit(1);
          if (!existingTeacherRecord) {
            await db.insert(latenessRecords).values({
              classSessionId: session.id,
              teacherId,
              scheduledStart: session.scheduledStart,
              actualStart: now,
              delayMinutes: delayMin,
              classType: "in_person",
              detectionMethod: "teacher_button",
            });
            await writeHRPerformanceScore(teacherId, delayMin, "in_person");
          }
        }

        broadcastToSupervisors("class-started", {
          sessionId,
          startedBy: "teacher",
          method: "app_button",
          scheduledStart: session.scheduledStart,
          actualStart: now,
        });

        return res.json({ success: true, message: "Class started" });
      } catch (err) {
        console.error("Teacher start class error:", err);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // TEACHER: Get upcoming/active class session for a class
  // GET /api/teacher/class-sessions/:classId/upcoming
  // ──────────────────────────────────────────────────────────────────────────
  app.get(
    "/api/teacher/class-sessions/:classId/upcoming",
    authenticateToken,
    requireRole(["Teacher", "Teacher/Tutor"]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const classId = parseInt(req.params.classId);
        const teacherUserId = req.user.id;

        // Verify the class belongs to this teacher (IDOR protection)
        const [ownerCheck] = await db
          .select({ id: classes.id, status: classes.status })
          .from(classes)
          .where(and(eq(classes.id, classId), eq(classes.teacherId, teacherUserId)));
        if (!ownerCheck) {
          return res.status(403).json({ message: "Access denied" });
        }

        const now = new Date();
        const windowStart = new Date(now.getTime() - 30 * 60 * 1000);
        const windowEnd = new Date(now.getTime() + 15 * 60 * 1000);

        const sessions = await db
          .select()
          .from(classSessions)
          .where(
            and(
              eq(classSessions.classId, classId),
              gte(classSessions.scheduledStart, windowStart),
              lte(classSessions.scheduledStart, windowEnd)
            )
          )
          .orderBy(asc(classSessions.scheduledStart))
          .limit(1);

        const session = sessions[0] || null;

        // If the parent class has been cancelled, sync the session status
        if (session && ownerCheck.status === "cancelled" && session.status !== "cancelled") {
          await db
            .update(classSessions)
            .set({ status: "cancelled", updatedAt: new Date() })
            .where(eq(classSessions.id, session.id));
          return res.json({ ...session, status: "cancelled" });
        }

        return res.json(session);
      } catch (err) {
        console.error("Get upcoming session error:", err);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // ADMIN: Lateness records report
  // GET /api/admin/lateness-records
  // ──────────────────────────────────────────────────────────────────────────
  app.get(
    "/api/admin/lateness-records",
    authenticateToken,
    requireRole(["Admin", "Supervisor"]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const { teacherId, from, to, limit: limitStr, offset: offsetStr } =
          req.query;

        const starterUser = alias(users, "starter_user");

        let query = db
          .select({
            id: latenessRecords.id,
            teacherId: latenessRecords.teacherId,
            teacherFirstName: users.firstName,
            teacherLastName: users.lastName,
            scheduledStart: latenessRecords.scheduledStart,
            actualStart: latenessRecords.actualStart,
            delayMinutes: latenessRecords.delayMinutes,
            classType: latenessRecords.classType,
            detectionMethod: latenessRecords.detectionMethod,
            createdAt: latenessRecords.createdAt,
            className: classes.name,
            startMethod: classSessions.startMethod,
            confirmerFirstName: starterUser.firstName,
            confirmerLastName: starterUser.lastName,
          })
          .from(latenessRecords)
          .leftJoin(users, eq(latenessRecords.teacherId, users.id))
          .leftJoin(classSessions, eq(latenessRecords.classSessionId, classSessions.id))
          .leftJoin(classes, eq(classSessions.classId, classes.id))
          .leftJoin(starterUser, eq(classSessions.startedByStudentId, starterUser.id));

        const conditions: SQL<unknown>[] = [];
        if (teacherId) {
          conditions.push(
            eq(latenessRecords.teacherId, parseInt(teacherId as string))
          );
        }
        if (from) {
          conditions.push(
            gte(latenessRecords.scheduledStart, new Date(from as string))
          );
        }
        if (to) {
          conditions.push(
            lte(latenessRecords.scheduledStart, new Date(to as string))
          );
        }

        const rawRecords = await query
          .where(conditions.length ? and(...conditions) : undefined)
          .orderBy(desc(latenessRecords.scheduledStart))
          .limit(parseInt((limitStr as string) || "100"))
          .offset(parseInt((offsetStr as string) || "0"));

        const records = rawRecords.map((r) => {
          let confirmedBy: string;
          if (r.startMethod === "sms_link") {
            confirmedBy = r.confirmerFirstName
              ? `${r.confirmerFirstName} ${r.confirmerLastName ?? ""}`.trim()
              : "Student (SMS)";
          } else if (r.startMethod === "app_button") {
            confirmedBy = "Teacher (App)";
          } else if (r.detectionMethod === "callern_pending_vs_active") {
            confirmedBy = "Auto (CallerN)";
          } else {
            confirmedBy = r.startMethod ?? "Auto";
          }
          return { ...r, confirmedBy };
        });

        // Dedicated DB-level aggregation for per-teacher summary (not limited by pagination)
        const aggregationBase = db
          .select({
            teacherId: latenessRecords.teacherId,
            teacherFirstName: users.firstName,
            teacherLastName: users.lastName,
            latenessCount: sql<number>`count(*)`,
            avgDelayMinutes: sql<number>`ROUND(AVG(CAST(${latenessRecords.delayMinutes} AS FLOAT)))`,
          })
          .from(latenessRecords)
          .leftJoin(users, eq(latenessRecords.teacherId, users.id))
          .groupBy(latenessRecords.teacherId, users.firstName, users.lastName)
          .orderBy(sql`count(*) desc`);

        const rawSummary = await aggregationBase
          .where(conditions.length ? and(...conditions) : undefined);

        const summary = rawSummary.map((s) => ({
          teacherId: s.teacherId,
          teacherName: `${s.teacherFirstName ?? ""} ${s.teacherLastName ?? ""}`.trim(),
          latenessCount: Number(s.latenessCount),
          avgDelayMinutes: Number(s.avgDelayMinutes),
        }));

        // Monthly grouped summary: count of lateness incidents per teacher per month
        const rawMonthly = await db
          .select({
            teacherId: latenessRecords.teacherId,
            teacherFirstName: users.firstName,
            teacherLastName: users.lastName,
            period: sql<string>`TO_CHAR(${latenessRecords.scheduledStart}, 'YYYY-MM')`,
            latenessCount: sql<number>`count(*)`,
            avgDelayMinutes: sql<number>`ROUND(AVG(CAST(${latenessRecords.delayMinutes} AS FLOAT)))`,
          })
          .from(latenessRecords)
          .leftJoin(users, eq(latenessRecords.teacherId, users.id))
          .where(conditions.length ? and(...conditions) : undefined)
          .groupBy(
            latenessRecords.teacherId,
            users.firstName,
            users.lastName,
            sql`TO_CHAR(${latenessRecords.scheduledStart}, 'YYYY-MM')`
          )
          .orderBy(
            sql`TO_CHAR(${latenessRecords.scheduledStart}, 'YYYY-MM') DESC`,
            sql`count(*) DESC`
          );

        const monthlySummary = rawMonthly.map((m) => ({
          teacherId: m.teacherId,
          teacherName: `${m.teacherFirstName ?? ""} ${m.teacherLastName ?? ""}`.trim(),
          period: m.period,
          latenessCount: Number(m.latenessCount),
          avgDelayMinutes: Number(m.avgDelayMinutes),
        }));

        return res.json({ records, summary, monthlySummary });
      } catch (err) {
        console.error("Lateness records error:", err);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // INTERNAL: Record CallerN lateness (called from websocket server)
  // POST /api/internal/callern-lateness
  // Requires X-Internal-Secret header matching INTERNAL_API_SECRET env var
  // ──────────────────────────────────────────────────────────────────────────
  app.post("/api/internal/callern-lateness", (req: Request, res: Response, next: () => void) => {
    const secret = process.env.INTERNAL_API_SECRET;
    if (!secret) {
      console.error("[Security] INTERNAL_API_SECRET env var is not set — /api/internal/callern-lateness is disabled");
      return res.status(503).json({ message: "Endpoint disabled: INTERNAL_API_SECRET not configured" });
    }
    if (req.headers['x-internal-secret'] !== secret) {
      return res.status(403).json({ message: "Forbidden" });
    }
    next();
  }, async (req, res) => {
    try {
      const { teacherId, callSessionId, delayMinutes, pendingAt, activeAt } =
        req.body;

      if (!teacherId || !delayMinutes) {
        return res.status(400).json({ message: "Missing required fields" });
      }

      // Idempotency: skip if a lateness record for this callSessionId already exists
      if (callSessionId) {
        const [existingCallRecord] = await db
          .select({ id: latenessRecords.id })
          .from(latenessRecords)
          .where(eq(latenessRecords.callSessionId, callSessionId))
          .limit(1);
        if (existingCallRecord) {
          return res.json({ success: true, duplicate: true });
        }
      }

      await db.insert(latenessRecords).values({
        teacherId,
        callSessionId: callSessionId || null,
        scheduledStart: pendingAt ? new Date(pendingAt) : new Date(),
        actualStart: activeAt ? new Date(activeAt) : new Date(),
        delayMinutes,
        classType: "online",
        detectionMethod: "callern_auto",
      });

      await writeHRPerformanceScore(teacherId, delayMinutes, "online");

      broadcastToSupervisors("callern-lateness", {
        teacherId,
        delayMinutes,
        detectedAt: new Date(),
      });

      return res.json({ success: true });
    } catch (err) {
      console.error("CallerN lateness record error:", err);
      return res.status(500).json({ message: "Server error" });
    }
  });

  // ──────────────────────────────────────────────────────────────────────────
  // SUPERVISOR: Toggle on-duty status
  // PATCH /api/supervisor/on-duty
  // Sets the calling supervisor as on-duty (and clears all other on-duty flags
  // in the same atomic write so only one supervisor is on duty at a time).
  // ──────────────────────────────────────────────────────────────────────────
  app.patch(
    "/api/supervisor/on-duty",
    authenticateToken,
    requireRole(["Supervisor", "Admin"]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.id;
        const { isOnDuty } = req.body as { isOnDuty: boolean };

        if (isOnDuty) {
          // Clear all other on-duty flags first so only one supervisor is on duty
          await db
            .update(users)
            .set({ isOnDuty: false, updatedAt: new Date() })
            .where(and(eq(users.role, "Supervisor"), eq(users.isOnDuty, true)));
        }

        await db
          .update(users)
          .set({ isOnDuty: !!isOnDuty, updatedAt: new Date() })
          .where(eq(users.id, userId));

        return res.json({ success: true, isOnDuty: !!isOnDuty });
      } catch (err) {
        console.error("On-duty toggle error:", err);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );

  // ──────────────────────────────────────────────────────────────────────────
  // SUPERVISOR: Get current on-duty status
  // GET /api/supervisor/on-duty
  // ──────────────────────────────────────────────────────────────────────────
  app.get(
    "/api/supervisor/on-duty",
    authenticateToken,
    requireRole(["Supervisor", "Admin"]),
    async (req: AuthenticatedRequest, res: Response) => {
      try {
        const userId = req.user.id;
        const [self] = await db
          .select({ isOnDuty: users.isOnDuty })
          .from(users)
          .where(eq(users.id, userId));
        return res.json({ isOnDuty: self?.isOnDuty ?? false });
      } catch (err) {
        console.error("On-duty status fetch error:", err);
        return res.status(500).json({ message: "Server error" });
      }
    }
  );
}
