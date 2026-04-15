/**
 * Class Lateness Worker
 *
 * Two main jobs:
 * 1. Pre-class SMS: 15 minutes before scheduled start, send "I'm here" SMS
 *    to the first 3 enrolled students.
 * 2. Lateness monitor: every 60 seconds check for sessions due 5–30 min ago
 *    with no actualStartTime → flag as late, notify supervisors.
 */

import { db } from "../db";
import { eq, and, gte, lte, isNull, asc, lt, ne, inArray } from "drizzle-orm";
import {
  classSessions,
  classStartConfirmations,
  classEnrollments,
  classes,
  users,
  latenessRecords,
  employees,
  performanceScores,
} from "@shared/schema";
import { kavenegarService } from "../kavenegar-service";
import crypto from "crypto";
import { Worker as BullWorker } from "bullmq";
import {
  preClassSmsQueue,
  redisAvailable,
  redisConnection,
  type PreClassSmsJob,
} from "../services/queue-service";
import type { Server as SocketIOServer } from "socket.io";

let _io: SocketIOServer | null = null;
export function setLatenessWorkerIO(io: SocketIOServer) {
  _io = io;
}

function broadcastToSupervisors(event: string, data: Record<string, unknown>) {
  if (_io) _io.to("lateness-supervisors").emit(event, data);
}

const BASE_URL = process.env.REPLIT_DEV_DOMAIN
  ? `https://${process.env.REPLIT_DEV_DOMAIN}`
  : process.env.APP_URL || "http://localhost:5000";

// ─── HR Integration ────────────────────────────────────────────────────────────
async function writeHRPenalty(
  teacherId: number,
  delayMinutes: number,
  classType: string
) {
  try {
    const now = new Date();
    const [emp] = await db
      .select({ id: employees.id })
      .from(employees)
      .where(eq(employees.userId, teacherId))
      .limit(1);

    if (!emp) return;
    const penalty = Math.min(30, delayMinutes);
    await db.insert(performanceScores).values({
      employeeId: emp.id,
      periodYear: now.getFullYear(),
      periodMonth: now.getMonth() + 1,
      metricName: "lateness_penalty",
      metricValue: String(-penalty),
      normalizedScore: String(Math.max(0, 100 - penalty * 2)),
      dataSource: "lateness_detection",
      notes: `${classType} class late by ${delayMinutes} min (monitor)`,
    });
  } catch (err) {
    console.error("HR penalty write error:", err);
  }
}

// ─── Pre-class SMS: core processor (used by both BullMQ worker and direct path) ─
export async function processPreClassSmsForSession(sessionId: number): Promise<void> {
  const now = new Date();
  const [session] = await db
    .select()
    .from(classSessions)
    .where(eq(classSessions.id, sessionId))
    .limit(1);
  if (!session || session.smsSentAt || session.status === "cancelled") return;

  const [cls] = await db
    .select()
    .from(classes)
    .where(eq(classes.id, session.classId))
    .limit(1);
  if (!cls || cls.isOnline || cls.status === "cancelled") return; // Skip online or cancelled classes

  const enrolledStudents = await db
    .select({
      studentId: classEnrollments.studentId,
      phoneNumber: users.phoneNumber,
    })
    .from(classEnrollments)
    .leftJoin(users, eq(classEnrollments.studentId, users.id))
    .where(
      and(
        eq(classEnrollments.classId, session.classId),
        eq(classEnrollments.status, "active")
      )
    )
    .orderBy(asc(classEnrollments.enrollmentDate))
    .limit(3);

  let smsSent = false;
  for (const student of enrolledStudents) {
    if (!student.phoneNumber) continue;
    const token = crypto.randomBytes(32).toString("hex");
    await db.insert(classStartConfirmations).values({
      classSessionId: session.id,
      studentId: student.studentId,
      smsToken: token,
      isActive: true,
    });
    const checkInUrl = `${BASE_URL}/cs/${token}`;
    const message = `Your class "${cls.name}" starts in 15 minutes. Tap to confirm you're here: ${checkInUrl}`;
    await kavenegarService.sendSimpleSMS(student.phoneNumber, message);
    smsSent = true;
  }

  if (smsSent) {
    await db
      .update(classSessions)
      .set({ smsSentAt: now, updatedAt: now })
      .where(eq(classSessions.id, session.id));
    console.log(`Pre-class SMS sent for session ${sessionId} (class ${session.classId})`);
  }
}

// ─── Pre-class SMS: scan and schedule ──────────────────────────────────────────
async function sendPreClassSMS(): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() + 14 * 60 * 1000); // 14 min from now
    const windowEnd = new Date(now.getTime() + 16 * 60 * 1000);   // 16 min from now

    const upcoming = await db
      .select({ id: classSessions.id, scheduledStart: classSessions.scheduledStart })
      .from(classSessions)
      .innerJoin(
        classes,
        and(
          eq(classSessions.classId, classes.id),
          eq(classes.isOnline, false),
          ne(classes.status, "cancelled")
        )
      )
      .where(
        and(
          gte(classSessions.scheduledStart, windowStart),
          lte(classSessions.scheduledStart, windowEnd),
          eq(classSessions.status, "scheduled"),
          isNull(classSessions.smsSentAt)
        )
      );

    for (const session of upcoming) {
      try {
        if (redisAvailable) {
          // Schedule via BullMQ for reliability
          const delayMs = Math.max(0, session.scheduledStart.getTime() - now.getTime() - 15 * 60 * 1000);
          await preClassSmsQueue.add(
            "send-pre-class-sms",
            { classSessionId: session.id, scheduledStart: session.scheduledStart.toISOString() } satisfies PreClassSmsJob,
            { delay: delayMs, jobId: `pre-class-sms-${session.id}` }
          );
          console.log(`Queued BullMQ pre-class SMS for session ${session.id} (delay ${delayMs}ms)`);
        } else {
          // Fallback: process immediately when Redis unavailable
          await processPreClassSmsForSession(session.id);
        }
      } catch (sessionErr) {
        console.error(`Error scheduling pre-class SMS for session ${session.id}:`, sessionErr);
      }
    }
  } catch (err) {
    console.error("Pre-class SMS scan error:", err);
  }
}

// ─── Lateness Monitor ──────────────────────────────────────────────────────────
async function checkLateness(): Promise<void> {
  try {
    const now = new Date();
    const windowStart = new Date(now.getTime() - 30 * 60 * 1000); // 30 min ago
    const windowEnd = new Date(now.getTime() - 5 * 60 * 1000); // 5 min ago

    // Find sessions that should have started 5–30 min ago with no actual start.
    // Join classes to authoritatively filter out cancelled and online classes at the DB level.
    const overdue = await db
      .select({
        id: classSessions.id,
        classId: classSessions.classId,
        scheduledStart: classSessions.scheduledStart,
        teacherId: classes.teacherId,
        className: classes.name,
        isOnline: classes.isOnline,
      })
      .from(classSessions)
      .innerJoin(
        classes,
        and(
          eq(classSessions.classId, classes.id),
          eq(classes.isOnline, false),
          ne(classes.status, "cancelled")
        )
      )
      .where(
        and(
          gte(classSessions.scheduledStart, windowStart),
          lte(classSessions.scheduledStart, windowEnd),
          eq(classSessions.status, "scheduled"),
          isNull(classSessions.actualStartTime)
        )
      );

    for (const session of overdue) {
      try {
        const cls = { teacherId: session.teacherId, name: session.className, isOnline: session.isOnline };

        if (!cls?.teacherId || cls.isOnline) continue; // Skip online classes (monitored via CallerN)

        // Check if we've already recorded lateness for this session
        const [existing] = await db
          .select({ id: latenessRecords.id })
          .from(latenessRecords)
          .where(eq(latenessRecords.classSessionId, session.id))
          .limit(1);

        if (existing) continue; // Already flagged

        const delayMin = Math.floor(
          (now.getTime() - session.scheduledStart.getTime()) / 60000
        );

        await db.insert(latenessRecords).values({
          classSessionId: session.id,
          teacherId: cls.teacherId,
          scheduledStart: session.scheduledStart,
          actualStart: null,
          delayMinutes: delayMin,
          classType: "in_person",
          detectionMethod: "monitor_timeout",
        });

        await writeHRPenalty(cls.teacherId, delayMin, "in_person");

        // Get teacher info for SMS
        const [teacher] = await db
          .select({
            firstName: users.firstName,
            lastName: users.lastName,
            phoneNumber: users.phoneNumber,
          })
          .from(users)
          .where(eq(users.id, cls.teacherId))
          .limit(1);

        const teacherName = teacher
          ? `${teacher.firstName} ${teacher.lastName}`
          : "Unknown";

        // Notify supervisors via WebSocket
        broadcastToSupervisors("teacher-late-alert", {
          sessionId: session.id,
          teacherId: cls.teacherId,
          teacherName,
          className: cls.name,
          scheduledStart: session.scheduledStart,
          delayMinutes: delayMin,
        });

        // Get on-duty supervisors and send SMS; fall back to any supervisor if none flagged on-duty
        let supervisors = await db
          .select({ phoneNumber: users.phoneNumber, firstName: users.firstName })
          .from(users)
          .where(and(eq(users.role, "Supervisor"), eq(users.isOnDuty, true)));

        if (supervisors.length === 0) {
          supervisors = await db
            .select({ phoneNumber: users.phoneNumber, firstName: users.firstName })
            .from(users)
            .where(eq(users.role, "Supervisor"))
            .limit(1);
        }

        for (const supervisor of supervisors) {
          if (!supervisor.phoneNumber) continue;
          await kavenegarService.sendSimpleSMS(
            supervisor.phoneNumber,
            `ALERT: ${teacherName}'s class "${cls.name}" is ${delayMin} minutes late (no start confirmation). Check in with the teacher.`
          );
        }

        console.log(
          `Lateness flagged: teacher ${cls.teacherId}, session ${session.id}, delay ${delayMin} min`
        );
      } catch (sessionErr) {
        console.error(`Lateness check error for session ${session.id}:`, sessionErr);
      }
    }
  } catch (err) {
    console.error("Lateness monitor error:", err);
  }
}

// ─── Session Producer ──────────────────────────────────────────────────────────
/**
 * Parse a class's schedule JSONB to compute the next occurrence timestamp.
 * Handles two common formats:
 *   { startTime: "HH:MM", intervalDays: N } — periodic from startDate
 *   { startTime: "HH:MM", days: [0-6, ...] } — weekly days-of-week
 */
function computeNextOccurrence(
  classStartDate: Date,
  schedule: Record<string, any>,
  after: Date,
  before: Date
): Date | null {
  const startTimeStr: string = schedule.startTime || "08:00";
  const [hh, mm] = startTimeStr.split(":").map(Number);

  // Day-of-week based (e.g., {days: [1,3,5]})
  const weekdays: number[] | undefined =
    Array.isArray(schedule.days) ? schedule.days :
    Array.isArray(schedule.weekdays) ? schedule.weekdays :
    undefined;

  if (weekdays && weekdays.length > 0) {
    // Scan up to 7 days forward from 'after' looking for a matching weekday
    for (let offset = 0; offset <= 7; offset++) {
      const candidate = new Date(after.getTime() + offset * 24 * 60 * 60 * 1000);
      candidate.setHours(hh, mm, 0, 0);
      if (
        weekdays.includes(candidate.getDay()) &&
        candidate >= after &&
        candidate <= before
      ) {
        return candidate;
      }
    }
    return null;
  }

  // Interval-based (e.g., {intervalDays: 7})
  const intervalDays = Number(schedule.intervalDays) || 7;
  const anchorMs = classStartDate.getTime();
  const intervalMs = intervalDays * 24 * 60 * 60 * 1000;
  if (intervalMs <= 0) return null;

  // Find the smallest n such that anchor + n*interval >= after
  const n = Math.ceil((after.getTime() - anchorMs) / intervalMs);
  for (let offset = 0; offset <= 1; offset++) {
    const candidate = new Date(anchorMs + (n + offset) * intervalMs);
    candidate.setHours(hh, mm, 0, 0);
    if (candidate >= after && candidate <= before) return candidate;
  }
  return null;
}

/**
 * Provisions class_sessions rows for all active classes that have an
 * occurrence in the next 25 hours (if one doesn't already exist).
 * Runs periodically so that the SMS sender and lateness monitor have rows to act on.
 */
async function provisionUpcomingSessions(): Promise<void> {
  try {
    const now = new Date();
    const horizon = new Date(now.getTime() + 25 * 60 * 60 * 1000);

    const activeClasses = await db
      .select()
      .from(classes)
      .where(
        and(
          ne(classes.status, "cancelled"),
          eq(classes.isOnline, false),
          lt(classes.startDate, horizon),
          gte(classes.endDate, now)
        )
      );

    for (const cls of activeClasses) {
      try {
        const schedule = (cls.schedule as Record<string, any>) || {};
        const occurrence = computeNextOccurrence(cls.startDate, schedule, now, horizon);
        if (!occurrence) continue;

        // Idempotent: skip if a session already exists for this class at this time
        const [existing] = await db
          .select({ id: classSessions.id })
          .from(classSessions)
          .where(
            and(
              eq(classSessions.classId, cls.id),
              gte(classSessions.scheduledStart, new Date(occurrence.getTime() - 60 * 1000)),
              lte(classSessions.scheduledStart, new Date(occurrence.getTime() + 60 * 1000))
            )
          )
          .limit(1);

        if (existing) continue;

        await db.insert(classSessions).values({
          classId: cls.id,
          scheduledStart: occurrence,
          status: "scheduled",
        });

        console.log(`[SessionProducer] Created session for class ${cls.id} at ${occurrence.toISOString()}`);
      } catch (classErr) {
        console.error(`[SessionProducer] Error for class ${cls.id}:`, classErr);
      }
    }
  } catch (err) {
    console.error("[SessionProducer] Error:", err);
  }
}

// ─── Authoritative Cancellation Sync ──────────────────────────────────────────
/**
 * Marks any class_sessions rows as 'cancelled' where the parent class is
 * already cancelled. Runs at startup and every 4 hours to ensure background
 * job queries never process sessions for cancelled classes, regardless of when
 * the class was cancelled and whether the teacher-facing route has been hit.
 */
async function syncCancelledClassSessions(): Promise<void> {
  try {
    const cancelledClassIds = await db
      .select({ id: classes.id })
      .from(classes)
      .where(eq(classes.status, "cancelled"));

    if (cancelledClassIds.length === 0) return;

    const ids = cancelledClassIds.map((c) => c.id);
    const now = new Date();

    await db
      .update(classSessions)
      .set({ status: "cancelled", updatedAt: now })
      .where(
        and(
          inArray(classSessions.classId, ids),
          eq(classSessions.status, "scheduled")
        )
      );

    console.log(`[CancelSync] Synced cancelled status for sessions of ${ids.length} cancelled classes`);
  } catch (err) {
    console.error("[CancelSync] Error syncing cancelled class sessions:", err);
  }
}

// ─── Worker lifecycle ──────────────────────────────────────────────────────────
let smsIntervalId: NodeJS.Timeout | null = null;
let latenessIntervalId: NodeJS.Timeout | null = null;
let provisionIntervalId: NodeJS.Timeout | null = null;
let bullWorker: BullWorker | null = null;

export function startClassLatenessWorker(): void {
  if (smsIntervalId) return;

  console.log("Starting Class Lateness Worker...");

  // BullMQ Worker: processes pre-class SMS jobs (only when Redis is available)
  if (redisAvailable) {
    bullWorker = new BullWorker(
      "pre-class-sms",
      async (job) => {
        const { classSessionId } = job.data as PreClassSmsJob;
        await processPreClassSmsForSession(classSessionId);
      },
      { connection: redisConnection, concurrency: 5 }
    );
    bullWorker.on("failed", (job, err) => {
      console.error(`[BullMQ] pre-class-sms job ${job?.id} failed:`, err.message);
    });
    console.log("[BullMQ] pre-class-sms Worker started");
  }

  // Session producer: provisions class_sessions rows from active classes (every 4 hours)
  provisionIntervalId = setInterval(provisionUpcomingSessions, 4 * 60 * 60 * 1000);
  provisionUpcomingSessions().catch(console.error);

  // Authoritative cancellation sync: update class_sessions to 'cancelled' for cancelled classes
  setInterval(syncCancelledClassSessions, 4 * 60 * 60 * 1000);
  syncCancelledClassSessions().catch(console.error);

  // setInterval: scans and either queues BullMQ jobs (when Redis available) or processes directly
  smsIntervalId = setInterval(sendPreClassSMS, 60 * 1000);
  sendPreClassSMS().catch(console.error);

  // Lateness monitor (always interval-based — inherently periodic)
  latenessIntervalId = setInterval(checkLateness, 60 * 1000);
  checkLateness().catch(console.error);

  console.log("Class Lateness Worker started");
}

export async function stopClassLatenessWorker(): Promise<void> {
  if (provisionIntervalId) {
    clearInterval(provisionIntervalId);
    provisionIntervalId = null;
  }
  if (smsIntervalId) {
    clearInterval(smsIntervalId);
    smsIntervalId = null;
  }
  if (latenessIntervalId) {
    clearInterval(latenessIntervalId);
    latenessIntervalId = null;
  }
  if (bullWorker) {
    await bullWorker.close();
    bullWorker = null;
  }
  console.log("Class Lateness Worker stopped");
}

/**
 * Called when a CallerN session goes from pending → active.
 * If wait time > 5 min, record lateness.
 */
export async function detectCallerNLateness(
  teacherId: number,
  callSessionId: number,
  pendingAt: Date,
  activeAt: Date
): Promise<void> {
  try {
    const delayMs = activeAt.getTime() - pendingAt.getTime();
    const delayMin = Math.floor(delayMs / 60000);

    if (delayMin <= 5) return;

    // Idempotency: skip if a lateness record for this callSessionId already exists
    const [existing] = await db
      .select({ id: latenessRecords.id })
      .from(latenessRecords)
      .where(eq(latenessRecords.callSessionId, callSessionId))
      .limit(1);
    if (existing) return;

    await db.insert(latenessRecords).values({
      teacherId,
      callSessionId,
      scheduledStart: pendingAt,
      actualStart: activeAt,
      delayMinutes: delayMin,
      classType: "online",
      detectionMethod: "callern_auto",
    });

    await writeHRPenalty(teacherId, delayMin, "online");

    broadcastToSupervisors("callern-lateness", {
      teacherId,
      callSessionId,
      delayMinutes: delayMin,
      detectedAt: activeAt,
    });

    console.log(
      `CallerN lateness: teacher ${teacherId}, session ${callSessionId}, delay ${delayMin} min`
    );
  } catch (err) {
    console.error("detectCallerNLateness error:", err);
  }
}
