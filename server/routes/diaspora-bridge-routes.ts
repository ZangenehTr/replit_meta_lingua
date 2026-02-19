import { Router, Request, Response } from "express";
import { db } from "../db";
import { diasporaProfiles, diasporaExchangeSessions, users } from "../../shared/schema";
import { eq, and, ne, sql, desc, asc } from "drizzle-orm";
import { authenticateToken } from "../auth-middleware";

const router = Router();

router.get("/api/diaspora/profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [profile] = await db
      .select()
      .from(diasporaProfiles)
      .where(eq(diasporaProfiles.userId, userId));

    res.json(profile || null);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch profile", error: error.message });
  }
});

router.post("/api/diaspora/profile", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const {
      isDiaspora, countryOfResidence, heritageLanguage, targetLanguage,
      teachingLanguages, proficiencyLevel, timezone, bio, bioFa,
      interests, availableSlots,
    } = req.body;

    const [existing] = await db
      .select()
      .from(diasporaProfiles)
      .where(eq(diasporaProfiles.userId, userId));

    let result;
    if (existing) {
      [result] = await db
        .update(diasporaProfiles)
        .set({
          isDiaspora, countryOfResidence, heritageLanguage, targetLanguage,
          teachingLanguages, proficiencyLevel, timezone, bio, bioFa,
          interests, availableSlots,
          updatedAt: new Date(),
        } as any)
        .where(eq(diasporaProfiles.id, existing.id))
        .returning();
    } else {
      [result] = await db
        .insert(diasporaProfiles)
        .values({
          userId, isDiaspora, countryOfResidence, heritageLanguage,
          targetLanguage, teachingLanguages, proficiencyLevel, timezone,
          bio, bioFa, interests, availableSlots,
        } as any)
        .returning();
    }

    res.json(result);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to save profile", error: error.message });
  }
});

router.get("/api/diaspora/matches", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [myProfile] = await db
      .select()
      .from(diasporaProfiles)
      .where(eq(diasporaProfiles.userId, userId));

    if (!myProfile) {
      return res.json([]);
    }

    let conditions: any[] = [
      ne(diasporaProfiles.userId, userId),
      eq(diasporaProfiles.isActive, true),
    ];

    if (myProfile.isDiaspora) {
      conditions.push(eq(diasporaProfiles.isDiaspora, false));
    } else {
      conditions.push(eq(diasporaProfiles.isDiaspora, true));
    }

    const matches = await db
      .select({
        profile: diasporaProfiles,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(diasporaProfiles)
      .innerJoin(users, eq(users.id, diasporaProfiles.userId))
      .where(and(...conditions))
      .orderBy(
        sql`CASE WHEN ${diasporaProfiles.isCulturalAmbassador} = true THEN 0 ELSE 1 END`,
        desc(diasporaProfiles.averageRating)
      )
      .limit(20);

    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to find matches", error: error.message });
  }
});

router.post("/api/diaspora/sessions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { partnerId, language, cefrLevel, scheduledAt, sessionType } = req.body;

    const [myProfile] = await db
      .select()
      .from(diasporaProfiles)
      .where(eq(diasporaProfiles.userId, userId));

    if (!myProfile) {
      return res.status(400).json({ message: "Please set up your diaspora profile first" });
    }

    const diasporaUserId = myProfile.isDiaspora ? userId : partnerId;
    const localUserId = myProfile.isDiaspora ? partnerId : userId;

    const [session] = await db
      .insert(diasporaExchangeSessions)
      .values({
        diasporaUserId,
        localUserId,
        language: language || "english",
        cefrLevel: cefrLevel || "B1",
        scheduledAt: scheduledAt ? new Date(scheduledAt) : new Date(),
        sessionType: sessionType || "exchange",
        status: "scheduled",
      } as any)
      .returning();

    res.json(session);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create session", error: error.message });
  }
});

router.get("/api/diaspora/sessions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status } = req.query;

    let conditions: any[] = [
      sql`${diasporaExchangeSessions.diasporaUserId} = ${userId} OR ${diasporaExchangeSessions.localUserId} = ${userId}`,
    ];

    if (status) {
      conditions.push(eq(diasporaExchangeSessions.status, status as string));
    }

    const sessions = await db
      .select()
      .from(diasporaExchangeSessions)
      .where(and(...conditions))
      .orderBy(desc(diasporaExchangeSessions.createdAt))
      .limit(20);

    res.json(sessions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch sessions", error: error.message });
  }
});

router.post("/api/diaspora/sessions/:id/rate", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sessionId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { rating, feedback, topicsCovered } = req.body;

    const [session] = await db
      .select()
      .from(diasporaExchangeSessions)
      .where(eq(diasporaExchangeSessions.id, sessionId));

    if (!session) return res.status(404).json({ message: "Session not found" });

    const updateFields: any = { topicsCovered: topicsCovered || [] };

    if (session.diasporaUserId === userId) {
      updateFields.diasporaRating = rating;
      updateFields.diasporaFeedback = feedback;
    } else if (session.localUserId === userId) {
      updateFields.localRating = rating;
      updateFields.localFeedback = feedback;
    } else {
      return res.status(403).json({ message: "Not your session" });
    }

    const [updated] = await db
      .update(diasporaExchangeSessions)
      .set(updateFields)
      .where(eq(diasporaExchangeSessions.id, sessionId))
      .returning();

    const partnerId = session.diasporaUserId === userId ? session.localUserId : session.diasporaUserId;
    const allSessions = await db
      .select()
      .from(diasporaExchangeSessions)
      .where(
        and(
          sql`${diasporaExchangeSessions.diasporaUserId} = ${partnerId} OR ${diasporaExchangeSessions.localUserId} = ${partnerId}`,
          eq(diasporaExchangeSessions.status, "completed")
        )
      );

    const ratings = allSessions
      .map((s) => (s.diasporaUserId === partnerId ? s.localRating : s.diasporaRating))
      .filter((r): r is number => r !== null);

    if (ratings.length > 0) {
      const avg = (ratings.reduce((a, b) => a + b, 0) / ratings.length).toFixed(2);
      await db
        .update(diasporaProfiles)
        .set({
          averageRating: avg,
          totalExchangeSessions: allSessions.length,
        } as any)
        .where(eq(diasporaProfiles.userId, partnerId));
    }

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to rate session", error: error.message });
  }
});

router.post("/api/diaspora/ambassador/apply", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [profile] = await db
      .select()
      .from(diasporaProfiles)
      .where(eq(diasporaProfiles.userId, userId));

    if (!profile) {
      return res.status(400).json({ message: "Please set up your diaspora profile first" });
    }

    if (!profile.isDiaspora) {
      return res.status(400).json({ message: "Cultural Ambassador is for diaspora members" });
    }

    const [updated] = await db
      .update(diasporaProfiles)
      .set({
        isCulturalAmbassador: true,
        ambassadorSince: new Date(),
        updatedAt: new Date(),
      } as any)
      .where(eq(diasporaProfiles.id, profile.id))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to apply", error: error.message });
  }
});

router.get("/api/admin/diaspora/profiles", authenticateToken, async (req: Request, res: Response) => {
  try {
    const profiles = await db
      .select({
        profile: diasporaProfiles,
        user: {
          id: users.id,
          firstName: users.firstName,
          lastName: users.lastName,
          email: users.email,
        },
      })
      .from(diasporaProfiles)
      .innerJoin(users, eq(users.id, diasporaProfiles.userId))
      .orderBy(desc(diasporaProfiles.createdAt));

    res.json(profiles);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch profiles", error: error.message });
  }
});

export default router;
