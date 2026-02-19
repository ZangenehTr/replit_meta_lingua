import { Router, Request, Response } from "express";
import { db } from "../db";
import { crashAvailability, crashSessions, users } from "../../shared/schema";
import { eq, and, ne, sql, desc } from "drizzle-orm";
import { authenticateToken } from "../auth-middleware";

const router = Router();

const CRASH_DURATION_SECONDS = 600;

router.get("/api/crash/availability", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [availability] = await db
      .select()
      .from(crashAvailability)
      .where(eq(crashAvailability.userId, userId));

    res.json(availability || { isActive: false });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch availability", error: error.message });
  }
});

router.post("/api/crash/availability", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { isActive, cefrLevel, language, genderPreference, availableFrom, availableTo, timezone } = req.body;

    const [existing] = await db
      .select()
      .from(crashAvailability)
      .where(eq(crashAvailability.userId, userId));

    let result;
    if (existing) {
      [result] = await db
        .update(crashAvailability)
        .set({
          isActive: isActive ?? existing.isActive,
          cefrLevel: cefrLevel ?? existing.cefrLevel,
          language: language ?? existing.language,
          genderPreference: genderPreference ?? existing.genderPreference,
          availableFrom: availableFrom ?? existing.availableFrom,
          availableTo: availableTo ?? existing.availableTo,
          timezone: timezone ?? existing.timezone,
          updatedAt: new Date(),
        } as any)
        .where(eq(crashAvailability.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(crashAvailability)
        .values({
          userId,
          isActive: isActive ?? false,
          cefrLevel: cefrLevel || "B1",
          language: language || "english",
          genderPreference: genderPreference || "any",
          availableFrom,
          availableTo,
          timezone: timezone || "Asia/Tehran",
        } as any)
        .returning();
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update availability", error: error.message });
  }
});

router.post("/api/crash/find-crasher", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { cefrLevel, language, genderPreference } = req.body;

    let conditions: any[] = [
      eq(crashAvailability.isActive, true),
      ne(crashAvailability.userId, userId),
    ];

    if (language) {
      conditions.push(eq(crashAvailability.language, language));
    }

    const available = await db
      .select({
        userId: crashAvailability.userId,
        cefrLevel: crashAvailability.cefrLevel,
        isPremium: crashAvailability.isPremium,
        genderPreference: crashAvailability.genderPreference,
      })
      .from(crashAvailability)
      .where(and(...conditions))
      .orderBy(sql`
        CASE WHEN ${crashAvailability.isPremium} = true THEN 0 ELSE 1 END,
        RANDOM()
      `)
      .limit(10);

    const cefrOrder = ["A0", "A1", "A2", "B1", "B2", "C1", "C2"];
    const currentIdx = cefrOrder.indexOf(cefrLevel || "B1");

    const filtered = available.filter((a) => {
      const aIdx = cefrOrder.indexOf(a.cefrLevel || "B1");
      return Math.abs(aIdx - currentIdx) <= 1;
    });

    if (filtered.length === 0) {
      return res.json({ found: false, message: "No matching crashers available" });
    }

    const match = filtered[0];
    const [matchUser] = await db
      .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
      .from(users)
      .where(eq(users.id, match.userId));

    res.json({
      found: true,
      crasher: {
        ...matchUser,
        cefrLevel: match.cefrLevel,
        isPremium: match.isPremium,
      },
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to find crasher", error: error.message });
  }
});

router.post("/api/crash/sessions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { crasherId, hostStudentId, teacherId, callSessionId } = req.body;

    const [session] = await db
      .insert(crashSessions)
      .values({
        crasherId,
        hostStudentId,
        teacherId,
        callSessionId,
        status: "invited",
        invitedAt: new Date(),
      } as any)
      .returning();

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create crash session", error: error.message });
  }
});

router.post("/api/crash/sessions/:id/join", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [session] = await db.select().from(crashSessions).where(eq(crashSessions.id, sessionId));
    if (!session) return res.status(404).json({ message: "Session not found" });
    if (session.crasherId !== userId) return res.status(403).json({ message: "Not your invite" });

    const [updated] = await db
      .update(crashSessions)
      .set({ status: "active", joinedAt: new Date() } as any)
      .where(eq(crashSessions.id, sessionId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to join session", error: error.message });
  }
});

router.post("/api/crash/sessions/:id/leave", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { rating } = req.body;
    const userId = (req as any).user.id;

    const [session] = await db.select().from(crashSessions).where(eq(crashSessions.id, sessionId));
    if (!session) return res.status(404).json({ message: "Session not found" });

    const joinedAt = session.joinedAt || new Date();
    const duration = Math.floor((Date.now() - joinedAt.getTime()) / 1000);

    const updateFields: any = {
      status: "completed",
      leftAt: new Date(),
      durationSeconds: duration,
      xpEarned: Math.min(duration / 60 * 5, 50),
    };

    if (session.crasherId === userId && rating) {
      updateFields.hostRating = rating;
    } else if (session.hostStudentId === userId && rating) {
      updateFields.crasherRating = rating;
    }

    const [updated] = await db
      .update(crashSessions)
      .set(updateFields as any)
      .where(eq(crashSessions.id, sessionId))
      .returning();

    await db
      .update(crashAvailability)
      .set({
        totalCrashes: sql`${crashAvailability.totalCrashes} + 1`,
        lastCrashAt: new Date(),
      } as any)
      .where(eq(crashAvailability.userId, session.crasherId));

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to leave session", error: error.message });
  }
});

router.post("/api/crash/sessions/:id/teacher-approve", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const { approved } = req.body;

    const [updated] = await db
      .update(crashSessions)
      .set({ teacherApproved: approved } as any)
      .where(eq(crashSessions.id, sessionId))
      .returning();

    if (!approved) {
      await db
        .update(crashSessions)
        .set({ status: "rejected", leftAt: new Date() } as any)
        .where(eq(crashSessions.id, sessionId));
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to process approval", error: error.message });
  }
});

router.get("/api/crash/sessions/history", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const sessions = await db
      .select()
      .from(crashSessions)
      .where(
        sql`${crashSessions.crasherId} = ${userId} OR ${crashSessions.hostStudentId} = ${userId}`
      )
      .orderBy(desc(crashSessions.createdAt))
      .limit(20);

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch history", error: error.message });
  }
});

export default router;
