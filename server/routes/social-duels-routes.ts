import { Router, Request, Response } from "express";
import { db } from "../db";
import { socialDuels, duelQuestionBank, users } from "../../shared/schema";
import { eq, and, or, desc, asc, sql, ne, count } from "drizzle-orm";
import { authenticateToken } from "../auth-middleware";

const router = Router();

const DAILY_CHALLENGE_LIMIT = 10;
const CHALLENGE_EXPIRY_HOURS = 24;

router.get("/api/duels/my", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const { status } = req.query;

    let conditions: any[] = [
      or(eq(socialDuels.challengerId, userId), eq(socialDuels.challengedId, userId)),
    ];

    if (status) {
      conditions.push(eq(socialDuels.status, status as string));
    }

    const duels = await db
      .select()
      .from(socialDuels)
      .where(and(...conditions))
      .orderBy(desc(socialDuels.createdAt))
      .limit(50);

    const enrichedDuels = await Promise.all(
      duels.map(async (duel) => {
        const opponentId = duel.challengerId === userId ? duel.challengedId : duel.challengerId;
        const [opponent] = await db
          .select({ id: users.id, firstName: users.firstName, lastName: users.lastName, email: users.email })
          .from(users)
          .where(eq(users.id, opponentId));

        return {
          ...duel,
          isChallenger: duel.challengerId === userId,
          opponent: duel.isAnonymous && duel.status === "pending" ? { id: 0, firstName: "???", lastName: "", username: "mystery" } : opponent,
        };
      })
    );

    res.json(enrichedDuels);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch duels", error: error.message });
  }
});

router.get("/api/duels/stats", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;

    const [wins] = await db
      .select({ count: count() })
      .from(socialDuels)
      .where(and(eq(socialDuels.winnerId, userId), eq(socialDuels.status, "completed")));

    const [totalCompleted] = await db
      .select({ count: count() })
      .from(socialDuels)
      .where(
        and(
          or(eq(socialDuels.challengerId, userId), eq(socialDuels.challengedId, userId)),
          eq(socialDuels.status, "completed")
        )
      );

    const [draws] = await db
      .select({ count: count() })
      .from(socialDuels)
      .where(
        and(
          or(eq(socialDuels.challengerId, userId), eq(socialDuels.challengedId, userId)),
          eq(socialDuels.status, "completed"),
          sql`${socialDuels.winnerId} IS NULL`
        )
      );

    const total = totalCompleted.count;
    const winsCount = wins.count;
    const drawsCount = draws.count;
    const losses = total - winsCount - drawsCount;

    res.json({
      wins: winsCount,
      losses,
      draws: drawsCount,
      total,
      winRate: total > 0 ? Math.round((winsCount / total) * 100) : 0,
    });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch stats", error: error.message });
  }
});

router.post("/api/duels/challenge", authenticateToken, async (req: Request, res: Response) => {
  try {
    const challengerId = (req as any).user.id;
    const { challengedId, challengeType, cefrLevel, language, isAnonymous, difficulty } = req.body;

    if (challengerId === challengedId) {
      return res.status(400).json({ message: "Cannot challenge yourself" });
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const [todayCount] = await db
      .select({ count: count() })
      .from(socialDuels)
      .where(
        and(
          eq(socialDuels.challengerId, challengerId),
          sql`${socialDuels.createdAt} >= ${today}`
        )
      );

    if (todayCount.count >= DAILY_CHALLENGE_LIMIT) {
      return res.status(429).json({ message: "Daily challenge limit reached" });
    }

    const questions = await db
      .select()
      .from(duelQuestionBank)
      .where(
        and(
          eq(duelQuestionBank.challengeType, challengeType),
          eq(duelQuestionBank.cefrLevel, cefrLevel || "B1"),
          eq(duelQuestionBank.isActive, true)
        )
      )
      .orderBy(sql`RANDOM()`)
      .limit(5);

    if (questions.length === 0) {
      return res.status(400).json({ message: "No questions available for this challenge type and level" });
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + CHALLENGE_EXPIRY_HOURS);

    const [duel] = await db
      .insert(socialDuels)
      .values({
        challengerId,
        challengedId,
        challengeType,
        cefrLevel: cefrLevel || "B1",
        language: language || "english",
        isAnonymous: isAnonymous || false,
        difficulty: difficulty || "medium",
        status: "pending",
        questions: questions.map((q) => ({
          id: q.id,
          question: q.question,
          questionFa: q.questionFa,
          questionAr: q.questionAr,
          options: q.options,
          correctAnswer: q.correctAnswer,
          timeLimitSeconds: q.timeLimitSeconds,
          points: q.points,
        })),
        expiresAt,
        xpReward: 25,
      } as any)
      .returning();

    res.json(duel);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create challenge", error: error.message });
  }
});

router.post("/api/duels/:id/accept", authenticateToken, async (req: Request, res: Response) => {
  try {
    const duelId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [duel] = await db.select().from(socialDuels).where(eq(socialDuels.id, duelId));
    if (!duel) return res.status(404).json({ message: "Duel not found" });
    if (duel.challengedId !== userId) return res.status(403).json({ message: "Not your challenge" });
    if (duel.status !== "pending") return res.status(400).json({ message: "Challenge already responded to" });

    const [updated] = await db
      .update(socialDuels)
      .set({ status: "active", updatedAt: new Date() } as any)
      .where(eq(socialDuels.id, duelId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to accept challenge", error: error.message });
  }
});

router.post("/api/duels/:id/decline", authenticateToken, async (req: Request, res: Response) => {
  try {
    const duelId = parseInt(req.params.id);
    const userId = (req as any).user.id;

    const [duel] = await db.select().from(socialDuels).where(eq(socialDuels.id, duelId));
    if (!duel) return res.status(404).json({ message: "Duel not found" });
    if (duel.challengedId !== userId) return res.status(403).json({ message: "Not your challenge" });

    const [updated] = await db
      .update(socialDuels)
      .set({ status: "declined", updatedAt: new Date() } as any)
      .where(eq(socialDuels.id, duelId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to decline challenge", error: error.message });
  }
});

router.post("/api/duels/:id/submit", authenticateToken, async (req: Request, res: Response) => {
  try {
    const duelId = parseInt(req.params.id);
    const userId = (req as any).user.id;
    const { answers, score } = req.body;

    const [duel] = await db.select().from(socialDuels).where(eq(socialDuels.id, duelId));
    if (!duel) return res.status(404).json({ message: "Duel not found" });

    const isChallenger = duel.challengerId === userId;
    const isChallenged = duel.challengedId === userId;
    if (!isChallenger && !isChallenged) return res.status(403).json({ message: "Not your duel" });

    const updateFields: any = { updatedAt: new Date() };

    if (isChallenger) {
      updateFields.challengerAnswers = answers;
      updateFields.challengerScore = score;
      updateFields.challengerCompletedAt = new Date();
    } else {
      updateFields.challengedAnswers = answers;
      updateFields.challengedScore = score;
      updateFields.challengedCompletedAt = new Date();
    }

    if (isChallenger && duel.challengedCompletedAt) {
      updateFields.status = "completed";
      if (score > (duel.challengedScore || 0)) updateFields.winnerId = userId;
      else if (score < (duel.challengedScore || 0)) updateFields.winnerId = duel.challengedId;
    } else if (isChallenged && duel.challengerCompletedAt) {
      updateFields.status = "completed";
      if (score > (duel.challengerScore || 0)) updateFields.winnerId = userId;
      else if (score < (duel.challengerScore || 0)) updateFields.winnerId = duel.challengerId;
    } else {
      updateFields.status = "active";
    }

    const [updated] = await db
      .update(socialDuels)
      .set(updateFields)
      .where(eq(socialDuels.id, duelId))
      .returning();

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to submit answers", error: error.message });
  }
});

router.get("/api/duels/leaderboard", async (req: Request, res: Response) => {
  try {
    const topPlayers = await db.execute(sql`
      SELECT 
        u.id, u.first_name, u.last_name, u.username,
        COUNT(CASE WHEN sd.winner_id = u.id THEN 1 END) as wins,
        COUNT(sd.id) as total_duels,
        ROUND(COUNT(CASE WHEN sd.winner_id = u.id THEN 1 END)::numeric / NULLIF(COUNT(sd.id), 0) * 100, 1) as win_rate
      FROM users u
      JOIN social_duels sd ON (sd.challenger_id = u.id OR sd.challenged_id = u.id)
      WHERE sd.status = 'completed'
      GROUP BY u.id, u.first_name, u.last_name, u.username
      HAVING COUNT(sd.id) >= 3
      ORDER BY wins DESC, win_rate DESC
      LIMIT 20
    `);

    res.json(topPlayers.rows || []);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch leaderboard", error: error.message });
  }
});

router.get("/api/admin/duels/questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const { challengeType, cefrLevel } = req.query;
    let conditions: any[] = [];

    if (challengeType) conditions.push(eq(duelQuestionBank.challengeType, challengeType as string));
    if (cefrLevel) conditions.push(eq(duelQuestionBank.cefrLevel, cefrLevel as string));

    const questions = await db
      .select()
      .from(duelQuestionBank)
      .where(conditions.length > 0 ? and(...conditions) : undefined)
      .orderBy(desc(duelQuestionBank.createdAt));

    res.json(questions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch questions", error: error.message });
  }
});

router.post("/api/admin/duels/questions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user.id;
    const [question] = await db
      .insert(duelQuestionBank)
      .values({ ...req.body, createdBy: userId })
      .returning();

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create question", error: error.message });
  }
});

router.put("/api/admin/duels/questions/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);
    const [question] = await db
      .update(duelQuestionBank)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(duelQuestionBank.id, questionId))
      .returning();

    res.json(question);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update question", error: error.message });
  }
});

router.delete("/api/admin/duels/questions/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const questionId = parseInt(req.params.id);
    await db.delete(duelQuestionBank).where(eq(duelQuestionBank.id, questionId));
    res.json({ message: "Question deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete question", error: error.message });
  }
});

export default router;
