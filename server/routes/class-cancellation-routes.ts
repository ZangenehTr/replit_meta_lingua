import type { Express } from "express";
import { db } from "../db";
import { sql, eq, and, desc, inArray } from "drizzle-orm";
import { liveClassSessions, classCancellationRequests, supportTickets, classEnrollments, users } from "@shared/schema";
import { kavenegarService } from "../kavenegar-service";

interface RouteContext {
  authenticateToken: any;
  requireRole: (roles: string[]) => any;
  wsServer?: any;
}

export function setupClassCancellationRoutes(app: Express, context: RouteContext) {
  const { authenticateToken, requireRole } = context;

  // GET /api/teacher/live-sessions/upcoming — teacher's upcoming live sessions for cancel dropdown
  app.get("/api/teacher/live-sessions/upcoming", authenticateToken, async (req: any, res) => {
    try {
      const teacherId = req.user.id;
      const now = new Date();
      const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

      const sessions = await db
        .select({
          id: liveClassSessions.id,
          sessionDate: liveClassSessions.sessionDate,
          startTime: liveClassSessions.startTime,
          cancellationStatus: liveClassSessions.cancellationStatus,
          actualStartTime: liveClassSessions.actualStartTime,
          maxCapacity: liveClassSessions.maxCapacity
        })
        .from(liveClassSessions)
        .where(and(
          eq(liveClassSessions.teacherId, teacherId),
          eq(liveClassSessions.isCompleted, false)
        ))
        .orderBy(desc(liveClassSessions.sessionDate))
        .limit(20);

      res.json(sessions.filter(s => s.cancellationStatus !== 'cancelled'));
    } catch (error) {
      console.error("Error fetching teacher's upcoming sessions:", error);
      res.status(500).json({ message: "Failed to fetch upcoming sessions" });
    }
  });

  // POST /api/classes/:sessionId/cancel-request — teacher or student submits a request
  app.post("/api/classes/:sessionId/cancel-request", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const { reasonCategory, reasonText } = req.body;
      const userId = req.user.id;
      const userRole = req.user.role?.toLowerCase();

      if (!sessionId || !reasonCategory) {
        return res.status(400).json({ message: "sessionId and reasonCategory are required" });
      }

      const validReasons = ["sick", "emergency", "conflict", "weather", "other"];
      if (!validReasons.includes(reasonCategory)) {
        return res.status(400).json({ message: "Invalid reason category" });
      }

      // Fetch the session
      const [session] = await db.select().from(liveClassSessions).where(eq(liveClassSessions.id, sessionId)).limit(1);
      if (!session) {
        return res.status(404).json({ message: "Session not found" });
      }

      // Guard: if class already started (actual_start_time set)
      if (session.actualStartTime) {
        return res.status(400).json({ message: "Class in progress — contact admin directly" });
      }

      // Guard: if already cancelled
      if (session.cancellationStatus === "cancelled") {
        return res.status(400).json({ message: "Session is already cancelled" });
      }

      // Guard: only allow requests up to 24h before class
      const sessionTime = session.sessionDate ? new Date(session.sessionDate) : null;
      if (sessionTime) {
        const now = new Date();
        const hoursUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60 * 60);
        if (hoursUntil > 24) {
          return res.status(400).json({ message: "Cancellations more than 24 hours in advance should use normal class management" });
        }
      }

      // Guard: block duplicate pending requests
      const [existingPending] = await db
        .select({ id: classCancellationRequests.id })
        .from(classCancellationRequests)
        .where(and(
          eq(classCancellationRequests.classSessionId, sessionId),
          eq(classCancellationRequests.status, "pending")
        ))
        .limit(1);

      // For student requests in group classes, we allow multiple per student but aggregate count
      const isGroupClass = session.maxCapacity && session.maxCapacity > 1;
      const requesterRole = ["teacher", "admin"].includes(userRole) ? userRole : "student";

      if (existingPending && requesterRole !== "student") {
        return res.status(409).json({ message: "A cancellation request is already pending for this session" });
      }

      // For students, check if this student already requested
      if (requesterRole === "student" && existingPending) {
        const [myRequest] = await db
          .select({ id: classCancellationRequests.id })
          .from(classCancellationRequests)
          .where(and(
            eq(classCancellationRequests.classSessionId, sessionId),
            eq(classCancellationRequests.requestedByUserId, userId),
            eq(classCancellationRequests.status, "pending")
          ))
          .limit(1);
        if (myRequest) {
          return res.status(409).json({ message: "You have already submitted a cancellation request for this session" });
        }
      }

      // Check <30 min flag
      const minutesUntil = sessionTime ? (sessionTime.getTime() - new Date().getTime()) / (1000 * 60) : null;
      const isLessThan30Min = minutesUntil !== null && minutesUntil < 30;

      // For group student requests: count enrollments and existing student requests
      let studentRequestCount = 0;
      let enrolledCount = 0;
      if (requesterRole === "student" && isGroupClass && session.classId) {
        const enrollments = await db
          .select({ id: classEnrollments.id })
          .from(classEnrollments)
          .where(and(
            eq(classEnrollments.classId, session.classId),
            eq(classEnrollments.status, "active")
          ));
        enrolledCount = enrollments.length;

        const studentRequests = await db
          .select({ id: classCancellationRequests.id })
          .from(classCancellationRequests)
          .where(and(
            eq(classCancellationRequests.classSessionId, sessionId),
            eq(classCancellationRequests.requesterRole, "student"),
            eq(classCancellationRequests.status, "pending")
          ));
        studentRequestCount = studentRequests.length + 1; // +1 for this new request
      }

      // Create or update the cancellation request
      let cancellationRequestId: number;
      if (requesterRole === "student" && existingPending) {
        // Update student count on existing request
        await db.update(classCancellationRequests)
          .set({ studentRequestCount, updatedAt: new Date() })
          .where(eq(classCancellationRequests.id, existingPending.id));
        cancellationRequestId = existingPending.id;

        // Insert the student's own request for audit
        const [newReq] = await db.insert(classCancellationRequests).values({
          classSessionId: sessionId,
          requestedByUserId: userId,
          requesterRole,
          reasonCategory,
          reasonText: reasonText || null,
          studentRequestCount,
          status: "pending",
          isLessThan30Min
        }).returning({ id: classCancellationRequests.id });
        cancellationRequestId = newReq.id;
      } else {
        const [newReq] = await db.insert(classCancellationRequests).values({
          classSessionId: sessionId,
          requestedByUserId: userId,
          requesterRole,
          reasonCategory,
          reasonText: reasonText || null,
          studentRequestCount: requesterRole === "student" ? 1 : 0,
          status: "pending",
          isLessThan30Min
        }).returning({ id: classCancellationRequests.id });
        cancellationRequestId = newReq.id;
      }

      // Update session status
      await db.update(liveClassSessions)
        .set({ cancellationStatus: "cancel_requested", updatedAt: new Date() })
        .where(eq(liveClassSessions.id, sessionId));

      // Create URGENT support ticket
      const ticketNumber = `CANCEL-${sessionId}-${Date.now()}`;
      const [ticket] = await db.insert(supportTickets).values({
        ticketNumber,
        submitterId: userId,
        category: "class_cancellation",
        priority: "urgent",
        status: "open",
        subject: `Emergency Class Cancellation Request - Session #${sessionId}`,
        description: `${requesterRole.toUpperCase()} has requested emergency cancellation for class session #${sessionId}. Reason: ${reasonCategory}${reasonText ? ` — ${reasonText}` : ""}`,
        classSessionId: sessionId,
        source: "web",
        tags: ["class_cancellation", "urgent"]
      } as any).returning({ id: supportTickets.id });

      // Link ticket to request
      await db.update(classCancellationRequests)
        .set({ supportTicketId: ticket.id, updatedAt: new Date() })
        .where(eq(classCancellationRequests.id, cancellationRequestId));

      // Broadcast WebSocket event to supervisors/admins
      if (context.wsServer) {
        const requestData = {
          type: "class_cancellation_request",
          sessionId,
          cancellationRequestId,
          requestedBy: { id: userId, role: requesterRole },
          reasonCategory,
          reasonText,
          isLessThan30Min,
          studentRequestCount: requesterRole === "student" ? studentRequestCount : 0,
          enrolledCount,
          ticketId: ticket.id,
          timestamp: new Date().toISOString()
        };
        context.wsServer.broadcastToSupervisorsAndAdmins("cancellation_request", requestData);
      }

      // Determine if 50% threshold is met for group student requests
      const threshold50Pct = enrolledCount > 0 && studentRequestCount >= Math.ceil(enrolledCount * 0.5);

      res.json({
        message: "Cancellation request submitted — awaiting approval",
        cancellationRequestId,
        ticketId: ticket.id,
        isLessThan30Min,
        studentRequestCount: requesterRole === "student" ? studentRequestCount : undefined,
        enrolledCount: requesterRole === "student" ? enrolledCount : undefined,
        threshold50Pct,
        status: "pending"
      });
    } catch (error) {
      console.error("Error submitting cancellation request:", error);
      res.status(500).json({ message: "Failed to submit cancellation request" });
    }
  });

  // GET /api/classes/cancel-requests — supervisor/admin list
  app.get("/api/classes/cancel-requests", authenticateToken, requireRole(["supervisor", "Supervisor", "Admin", "admin"]), async (req: any, res) => {
    try {
      const { status, sessionId, page = "1", limit = "50" } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      let query = db
        .select({
          request: classCancellationRequests,
          session: {
            id: liveClassSessions.id,
            sessionDate: liveClassSessions.sessionDate,
            startTime: liveClassSessions.startTime,
            cancellationStatus: liveClassSessions.cancellationStatus,
            teacherId: liveClassSessions.teacherId,
            maxCapacity: liveClassSessions.maxCapacity,
            actualStartTime: liveClassSessions.actualStartTime
          },
          requester: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role,
            phone: users.phone
          }
        })
        .from(classCancellationRequests)
        .leftJoin(liveClassSessions, eq(classCancellationRequests.classSessionId, liveClassSessions.id))
        .leftJoin(users, eq(classCancellationRequests.requestedByUserId, users.id))
        .orderBy(desc(classCancellationRequests.createdAt));

      const requests = await query.limit(Number(limit)).offset(offset);

      // Filter in JS for now (simple approach)
      let filtered = requests;
      if (status) filtered = filtered.filter(r => r.request.status === status);
      if (sessionId) filtered = filtered.filter(r => r.request.classSessionId === Number(sessionId));

      res.json(filtered);
    } catch (error) {
      console.error("Error fetching cancellation requests:", error);
      res.status(500).json({ message: "Failed to fetch cancellation requests" });
    }
  });

  // POST /api/classes/cancel-requests/:id/approve
  app.post("/api/classes/cancel-requests/:id/approve", authenticateToken, requireRole(["supervisor", "Supervisor", "Admin", "admin"]), async (req: any, res) => {
    try {
      const requestId = Number(req.params.id);
      const reviewerId = req.user.id;
      const { makeupSessionId } = req.body;

      const [cancelReq] = await db
        .select()
        .from(classCancellationRequests)
        .where(eq(classCancellationRequests.id, requestId))
        .limit(1);

      if (!cancelReq) return res.status(404).json({ message: "Cancellation request not found" });
      if (cancelReq.status !== "pending") return res.status(400).json({ message: "Request has already been reviewed" });

      // Update request
      await db.update(classCancellationRequests)
        .set({
          status: "approved",
          reviewedByUserId: reviewerId,
          reviewedAt: new Date(),
          makeupSessionId: makeupSessionId || null,
          updatedAt: new Date()
        })
        .where(eq(classCancellationRequests.id, requestId));

      // Mark session as cancelled
      await db.update(liveClassSessions)
        .set({
          cancellationStatus: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: reviewerId,
          cancelledReason: cancelReq.reasonCategory,
          cancelledReasonText: cancelReq.reasonText,
          isChatroomReadOnly: true,
          updatedAt: new Date()
        })
        .where(eq(liveClassSessions.id, cancelReq.classSessionId));

      // Fetch session details for notifications
      const [session] = await db.select().from(liveClassSessions).where(eq(liveClassSessions.id, cancelReq.classSessionId)).limit(1);
      const [requester] = await db.select({ firstName: users.firstName, lastName: users.lastName, phone: users.phone, role: users.role })
        .from(users).where(eq(users.id, cancelReq.requestedByUserId)).limit(1);
      const [reviewer] = await db.select({ firstName: users.firstName, lastName: users.lastName })
        .from(users).where(eq(users.id, reviewerId)).limit(1);

      // Fetch enrolled students for notifications
      let enrolledStudents: Array<{ id: number; firstName: string; lastName: string; phone: string }> = [];
      if (session?.classId) {
        const enrollments = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone })
          .from(classEnrollments)
          .leftJoin(users, eq(classEnrollments.studentId, users.id))
          .where(and(eq(classEnrollments.classId, session.classId), eq(classEnrollments.status, "active")));
        enrolledStudents = enrollments.filter(e => e.phone) as any[];
      }

      // Send SMS to enrolled students
      let smsCount = 0;
      const makeupText = makeupSessionId ? "Makeup class will be announced soon." : "Makeup class: TBD";
      const reasonMap: Record<string, string> = { sick: "Sick leave", emergency: "Emergency", conflict: "Schedule conflict", weather: "Weather", other: "Unforeseen circumstances" };
      const reasonLabel = reasonMap[cancelReq.reasonCategory] || "Unforeseen circumstances";

      for (const student of enrolledStudents) {
        if (student.phone) {
          const faMsg = `کلاس شما لغو شده است. دلیل: ${reasonLabel}. ${makeupText} - MetaLingo`;
          const enMsg = `Your class (Session #${session.id}) has been cancelled. Reason: ${reasonLabel}. ${makeupText} - MetaLingo`;
          try {
            await kavenegarService.sendSimpleSMS(student.phone, `${faMsg}\n${enMsg}`);
            smsCount++;
          } catch (e) {
            console.error(`SMS failed for student ${student.id}:`, e);
          }
        }
      }

      // If student-requested: also notify teacher
      if (cancelReq.requesterRole === "student") {
        const [teacher] = await db.select({ phone: users.phone, firstName: users.firstName, lastName: users.lastName })
          .from(users).where(eq(users.id, session?.teacherId!)).limit(1);
        if (teacher?.phone) {
          const requesterNames = `${enrolledStudents.length} students`;
          const msg = `Student cancellation approved: ${requesterNames} requested cancellation for Session #${session?.id}. Approved by ${reviewer?.firstName} ${reviewer?.lastName}. - MetaLingo`;
          try {
            await kavenegarService.sendSimpleSMS(teacher.phone, msg);
          } catch (e) {
            console.error("SMS to teacher failed:", e);
          }
        }
      }

      // Update SMS count
      await db.update(classCancellationRequests)
        .set({ smsDeliveryCount: smsCount, chatroomMessageStatus: "sent", updatedAt: new Date() })
        .where(eq(classCancellationRequests.id, requestId));

      // Broadcast approval via WebSocket
      if (context.wsServer) {
        context.wsServer.broadcastToAll("cancellation_approved", {
          sessionId: cancelReq.classSessionId,
          cancellationRequestId: requestId,
          approvedBy: reviewerId,
          makeupSessionId: makeupSessionId || null,
          timestamp: new Date().toISOString()
        });
      }

      res.json({
        message: "Cancellation approved",
        sessionId: cancelReq.classSessionId,
        smsCount,
        enrolledStudents: enrolledStudents.length
      });
    } catch (error) {
      console.error("Error approving cancellation:", error);
      res.status(500).json({ message: "Failed to approve cancellation" });
    }
  });

  // POST /api/classes/cancel-requests/:id/reject
  app.post("/api/classes/cancel-requests/:id/reject", authenticateToken, requireRole(["supervisor", "Supervisor", "Admin", "admin"]), async (req: any, res) => {
    try {
      const requestId = Number(req.params.id);
      const reviewerId = req.user.id;

      const [cancelReq] = await db
        .select()
        .from(classCancellationRequests)
        .where(eq(classCancellationRequests.id, requestId))
        .limit(1);

      if (!cancelReq) return res.status(404).json({ message: "Cancellation request not found" });
      if (cancelReq.status !== "pending") return res.status(400).json({ message: "Request has already been reviewed" });

      await db.update(classCancellationRequests)
        .set({ status: "rejected", reviewedByUserId: reviewerId, reviewedAt: new Date(), updatedAt: new Date() })
        .where(eq(classCancellationRequests.id, requestId));

      // Restore session status
      await db.update(liveClassSessions)
        .set({ cancellationStatus: "active", updatedAt: new Date() })
        .where(eq(liveClassSessions.id, cancelReq.classSessionId));

      // Notify the original requester via SMS
      const [requester] = await db.select({ phone: users.phone, firstName: users.firstName, lastName: users.lastName })
        .from(users).where(eq(users.id, cancelReq.requestedByUserId)).limit(1);

      if (requester?.phone) {
        const msg = `Your cancellation request for Session #${cancelReq.classSessionId} was rejected. Please attend as scheduled. - MetaLingo`;
        try {
          await kavenegarService.sendSimpleSMS(requester.phone, msg);
        } catch (e) {
          console.error("SMS to requester failed:", e);
        }
      }

      // Broadcast rejection
      if (context.wsServer) {
        context.wsServer.broadcastToUser(cancelReq.requestedByUserId, "cancellation_rejected", {
          sessionId: cancelReq.classSessionId,
          cancellationRequestId: requestId,
          timestamp: new Date().toISOString()
        });
      }

      res.json({ message: "Cancellation request rejected", sessionId: cancelReq.classSessionId });
    } catch (error) {
      console.error("Error rejecting cancellation:", error);
      res.status(500).json({ message: "Failed to reject cancellation" });
    }
  });

  // POST /api/classes/:sessionId/force-cancel — admin only, bypasses approval
  app.post("/api/classes/:sessionId/force-cancel", authenticateToken, requireRole(["Admin", "admin"]), async (req: any, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const { reasonCategory = "other", reasonText } = req.body;
      const adminId = req.user.id;

      const [session] = await db.select().from(liveClassSessions).where(eq(liveClassSessions.id, sessionId)).limit(1);
      if (!session) return res.status(404).json({ message: "Session not found" });

      await db.update(liveClassSessions)
        .set({
          cancellationStatus: "cancelled",
          cancelledAt: new Date(),
          cancelledBy: adminId,
          cancelledReason: reasonCategory,
          cancelledReasonText: reasonText || null,
          isChatroomReadOnly: true,
          updatedAt: new Date()
        })
        .where(eq(liveClassSessions.id, sessionId));

      // Create a force-cancel record
      const [newReq] = await db.insert(classCancellationRequests).values({
        classSessionId: sessionId,
        requestedByUserId: adminId,
        requesterRole: "admin",
        reasonCategory,
        reasonText: reasonText || null,
        status: "force_cancelled",
        reviewedByUserId: adminId,
        reviewedAt: new Date()
      } as any).returning({ id: classCancellationRequests.id });

      // Notify enrolled students
      let smsCount = 0;
      if (session.classId) {
        const enrollments = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, phone: users.phone })
          .from(classEnrollments)
          .leftJoin(users, eq(classEnrollments.studentId, users.id))
          .where(and(eq(classEnrollments.classId, session.classId), eq(classEnrollments.status, "active")));

        for (const student of enrollments) {
          if (student.phone) {
            const msg = `کلاس شما (شماره ${sessionId}) توسط مدیریت لغو شده است. - MetaLingo\nYour class (Session #${sessionId}) has been cancelled by admin. - MetaLingo`;
            try {
              await kavenegarService.sendSimpleSMS(student.phone, msg);
              smsCount++;
            } catch (e) {
              console.error(`SMS failed for student ${student.id}:`, e);
            }
          }
        }
      }

      if (context.wsServer) {
        context.wsServer.broadcastToAll("cancellation_approved", {
          sessionId,
          forceCancelled: true,
          timestamp: new Date().toISOString()
        });
      }

      res.json({ message: "Session force-cancelled by admin", sessionId, smsCount });
    } catch (error) {
      console.error("Error force-cancelling session:", error);
      res.status(500).json({ message: "Failed to force-cancel session" });
    }
  });

  // GET /api/classes/cancel-requests/audit — admin audit log
  app.get("/api/classes/cancel-requests/audit", authenticateToken, requireRole(["Admin", "admin"]), async (req: any, res) => {
    try {
      const { startDate, endDate, classType, teacherId, page = "1", limit = "100" } = req.query;
      const offset = (Number(page) - 1) * Number(limit);

      const records = await db
        .select({
          request: classCancellationRequests,
          session: {
            id: liveClassSessions.id,
            sessionDate: liveClassSessions.sessionDate,
            teacherId: liveClassSessions.teacherId,
            maxCapacity: liveClassSessions.maxCapacity
          },
          requester: {
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            role: users.role
          }
        })
        .from(classCancellationRequests)
        .leftJoin(liveClassSessions, eq(classCancellationRequests.classSessionId, liveClassSessions.id))
        .leftJoin(users, eq(classCancellationRequests.requestedByUserId, users.id))
        .orderBy(desc(classCancellationRequests.createdAt))
        .limit(Number(limit))
        .offset(offset);

      res.json(records);
    } catch (error) {
      console.error("Error fetching cancellation audit log:", error);
      res.status(500).json({ message: "Failed to fetch audit log" });
    }
  });

  // GET /api/classes/:sessionId/cancel-status — check current status (for student counter)
  app.get("/api/classes/:sessionId/cancel-status", authenticateToken, async (req: any, res) => {
    try {
      const sessionId = Number(req.params.sessionId);
      const [session] = await db.select({
        id: liveClassSessions.id,
        cancellationStatus: liveClassSessions.cancellationStatus,
        maxCapacity: liveClassSessions.maxCapacity,
        actualStartTime: liveClassSessions.actualStartTime
      }).from(liveClassSessions).where(eq(liveClassSessions.id, sessionId)).limit(1);

      if (!session) return res.status(404).json({ message: "Session not found" });

      const pendingStudentRequests = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(classCancellationRequests)
        .where(and(
          eq(classCancellationRequests.classSessionId, sessionId),
          eq(classCancellationRequests.requesterRole, "student"),
          eq(classCancellationRequests.status, "pending")
        ));

      res.json({
        sessionId,
        cancellationStatus: session.cancellationStatus,
        maxCapacity: session.maxCapacity,
        studentRequestCount: pendingStudentRequests[0]?.count ?? 0,
        isClassInProgress: !!session.actualStartTime
      });
    } catch (error) {
      console.error("Error fetching cancel status:", error);
      res.status(500).json({ message: "Failed to fetch cancel status" });
    }
  });
}
