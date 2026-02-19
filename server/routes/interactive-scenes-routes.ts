import { Router, Request, Response } from "express";
import { db } from "../db";
import { interactiveScenes, sceneInteractionPoints, sceneProgress } from "../../shared/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";
import { authenticateToken, optionalAuth } from "../auth-middleware";

const router = Router();

router.get("/api/scenes", optionalAuth, async (req: Request, res: Response) => {
  try {
    const { cefrLevel, sceneType, language } = req.query;
    let conditions: any[] = [eq(interactiveScenes.isActive, true), eq(interactiveScenes.isPublished, true)];

    if (cefrLevel) {
      conditions.push(eq(interactiveScenes.cefrLevel, cefrLevel as string));
    }
    if (sceneType) {
      conditions.push(eq(interactiveScenes.sceneType, sceneType as string));
    }
    if (language) {
      conditions.push(eq(interactiveScenes.language, language as string));
    }

    const scenes = await db
      .select()
      .from(interactiveScenes)
      .where(and(...conditions))
      .orderBy(asc(interactiveScenes.sortOrder), asc(interactiveScenes.cefrLevel));

    res.json(scenes);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch scenes", error: error.message });
  }
});

router.get("/api/scenes/:id", optionalAuth, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    const [scene] = await db.select().from(interactiveScenes).where(eq(interactiveScenes.id, sceneId));

    if (!scene) {
      return res.status(404).json({ message: "Scene not found" });
    }

    const interactions = await db
      .select()
      .from(sceneInteractionPoints)
      .where(and(eq(sceneInteractionPoints.sceneId, sceneId), eq(sceneInteractionPoints.isActive, true)))
      .orderBy(asc(sceneInteractionPoints.sortOrder));

    res.json({ ...scene, interactions });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch scene", error: error.message });
  }
});

router.post("/api/scenes/:id/progress", optionalAuth, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    const userId = (req as any).user?.id;
    const { guestToken, completedInteractions, score, maxScore, timeSpentSeconds, status } = req.body;

    const [progress] = await db
      .insert(sceneProgress)
      .values({
        sceneId,
        userId: userId || null,
        guestToken: guestToken || null,
        completedInteractions,
        score: score || 0,
        maxScore: maxScore || 0,
        timeSpentSeconds: timeSpentSeconds || 0,
        status: status || "completed",
        completedAt: status === "completed" ? new Date() : null,
        xpEarned: status === "completed" ? 50 : 0,
      } as any)
      .returning();

    res.json(progress);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to save progress", error: error.message });
  }
});

router.get("/api/admin/scenes", authenticateToken, async (req: Request, res: Response) => {
  try {
    const scenes = await db
      .select()
      .from(interactiveScenes)
      .orderBy(desc(interactiveScenes.createdAt));

    res.json(scenes);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch scenes", error: error.message });
  }
});

router.post("/api/admin/scenes", authenticateToken, async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    const [scene] = await db
      .insert(interactiveScenes)
      .values({ ...req.body, createdBy: userId })
      .returning();

    res.json(scene);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create scene", error: error.message });
  }
});

router.put("/api/admin/scenes/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    const [scene] = await db
      .update(interactiveScenes)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(interactiveScenes.id, sceneId))
      .returning();

    res.json(scene);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update scene", error: error.message });
  }
});

router.delete("/api/admin/scenes/:id", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    await db.delete(sceneInteractionPoints).where(eq(sceneInteractionPoints.sceneId, sceneId));
    await db.delete(sceneProgress).where(eq(sceneProgress.sceneId, sceneId));
    await db.delete(interactiveScenes).where(eq(interactiveScenes.id, sceneId));

    res.json({ message: "Scene deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete scene", error: error.message });
  }
});

router.get("/api/admin/scenes/:id/interactions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    const interactions = await db
      .select()
      .from(sceneInteractionPoints)
      .where(eq(sceneInteractionPoints.sceneId, sceneId))
      .orderBy(asc(sceneInteractionPoints.sortOrder));

    res.json(interactions);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to fetch interactions", error: error.message });
  }
});

router.post("/api/admin/scenes/:id/interactions", authenticateToken, async (req: Request, res: Response) => {
  try {
    const sceneId = parseInt(req.params.id);
    const [interaction] = await db
      .insert(sceneInteractionPoints)
      .values({ ...req.body, sceneId })
      .returning();

    res.json(interaction);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to create interaction", error: error.message });
  }
});

router.put("/api/admin/scenes/:id/interactions/:interactionId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const interactionId = parseInt(req.params.interactionId);
    const [interaction] = await db
      .update(sceneInteractionPoints)
      .set({ ...req.body, updatedAt: new Date() })
      .where(eq(sceneInteractionPoints.id, interactionId))
      .returning();

    res.json(interaction);
  } catch (error: any) {
    res.status(500).json({ message: "Failed to update interaction", error: error.message });
  }
});

router.delete("/api/admin/scenes/:id/interactions/:interactionId", authenticateToken, async (req: Request, res: Response) => {
  try {
    const interactionId = parseInt(req.params.interactionId);
    await db.delete(sceneInteractionPoints).where(eq(sceneInteractionPoints.id, interactionId));

    res.json({ message: "Interaction deleted" });
  } catch (error: any) {
    res.status(500).json({ message: "Failed to delete interaction", error: error.message });
  }
});

export default router;
