import { Router } from "express";
import { db } from "../db";
import { eq, sql, desc, and } from "drizzle-orm";
import {
  users,
  sessionRatings,
  callernTeacherFollowers,
  teacherCallernAuthorization,
} from "@shared/schema";
import { authenticate, authorize } from "../auth";

const router = Router();

// ---------------------------------------------------------------------------
// GET /api/teachers/admin/followers-dashboard  (admin/supervisor)
// MUST be registered BEFORE /:id/profile to avoid "admin" being treated as id
// ---------------------------------------------------------------------------
router.get(
  "/admin/followers-dashboard",
  authenticate,
  authorize(["Admin", "Supervisor"]),
  async (_req, res) => {
    try {
      const rows = await db
        .select({
          teacherId: callernTeacherFollowers.teacherId,
          followerCount: sql<number>`count(*)`,
        })
        .from(callernTeacherFollowers)
        .where(eq(callernTeacherFollowers.isActive, true))
        .groupBy(callernTeacherFollowers.teacherId)
        .orderBy(desc(sql`count(*)`));

      const enriched = await Promise.all(
        rows.map(async (row) => {
          const [teacher] = await db
            .select({
              id: users.id,
              firstName: users.firstName,
              lastName: users.lastName,
              profileImageUrl: users.profileImageUrl,
            })
            .from(users)
            .where(eq(users.id, row.teacherId))
            .limit(1);

          return {
            teacherId: row.teacherId,
            teacherName: teacher
              ? `${teacher.firstName} ${teacher.lastName}`
              : `Teacher #${row.teacherId}`,
            profileImageUrl: teacher?.profileImageUrl ?? null,
            followerCount: Number(row.followerCount),
          };
        })
      );

      res.json(enriched);
    } catch (err) {
      console.error("Error fetching followers dashboard:", err);
      res.status(500).json({ message: "Failed to fetch followers dashboard" });
    }
  }
);

// ---------------------------------------------------------------------------
// GET /api/teachers/:id/profile  (public – no auth required)
// ---------------------------------------------------------------------------
router.get("/:id/profile", async (req, res) => {
  try {
    const teacherId = parseInt(req.params.id, 10);
    if (isNaN(teacherId)) return res.status(400).json({ message: "Invalid teacher id" });

    const [teacher] = await db
      .select()
      .from(users)
      .where(eq(users.id, teacherId))
      .limit(1);

    if (!teacher || (teacher.role !== "teacher" && teacher.role !== "mentor")) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Rating aggregate
    const [ratingAgg] = await db
      .select({
        avg: sql<string>`coalesce(avg(${sessionRatings.teacherRating})::numeric(3,2), 0)`,
        count: sql<number>`count(${sessionRatings.id})`,
      })
      .from(sessionRatings)
      .where(
        and(
          eq(sessionRatings.teacherId, teacherId),
          sql`${sessionRatings.teacherRating} IS NOT NULL`
        )
      );

    // Follower count
    const [followerAgg] = await db
      .select({ count: sql<number>`count(*)` })
      .from(callernTeacherFollowers)
      .where(
        and(
          eq(callernTeacherFollowers.teacherId, teacherId),
          eq(callernTeacherFollowers.isActive, true)
        )
      );

    // CallerN authorization metadata
    const [auth] = await db
      .select()
      .from(teacherCallernAuthorization)
      .where(eq(teacherCallernAuthorization.teacherId, teacherId))
      .limit(1);

    const avgRating = parseFloat(String(ratingAgg?.avg ?? 0));
    const reviewCount = Number(ratingAgg?.count ?? 0);
    const followerCount = Number(followerAgg?.count ?? 0);

    const profile = {
      id: teacher.id,
      firstName: teacher.firstName,
      lastName: teacher.lastName,
      fullName: `${teacher.firstName} ${teacher.lastName}`,
      email: teacher.email,
      phone: teacher.phone,
      profileImageUrl: teacher.profileImageUrl ?? null,
      bio: (teacher as any).teacherBio ?? null,
      introVideoUrl: (teacher as any).introVideoUrl ?? null,
      specializations: (teacher as any).teacherSpecializations ?? [],
      languages: ["Persian", "English"],
      rating: avgRating,
      reviewCount,
      followerCount,
      isCallernAuthorized: auth?.isAuthorized === true,
      hourlyRate: auth ? parseInt(String((auth as any).hourlyRate ?? 500000)) : 500000,
      successRate: reviewCount > 0 ? Math.min(98, 80 + Math.round(avgRating * 3)) : null,
    };

    res.json(profile);
  } catch (err) {
    console.error("Error fetching teacher profile:", err);
    res.status(500).json({ message: "Failed to fetch teacher profile" });
  }
});

// ---------------------------------------------------------------------------
// GET /api/teachers/:id/follow-status  (student – authenticated)
// ---------------------------------------------------------------------------
router.get(
  "/:id/follow-status",
  authenticate,
  authorize(["Student"]),
  async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id, 10);
      if (isNaN(teacherId)) return res.status(400).json({ message: "Invalid teacher id" });
      const studentId: number = req.user.id;

      const [row] = await db
        .select()
        .from(callernTeacherFollowers)
        .where(
          and(
            eq(callernTeacherFollowers.teacherId, teacherId),
            eq(callernTeacherFollowers.studentId, studentId),
            eq(callernTeacherFollowers.isActive, true)
          )
        )
        .limit(1);

      res.json({ following: !!row });
    } catch (err) {
      console.error("Error checking follow status:", err);
      res.status(500).json({ message: "Failed to check follow status" });
    }
  }
);

// ---------------------------------------------------------------------------
// POST /api/teachers/:id/follow  (student – authenticated)
// ---------------------------------------------------------------------------
router.post(
  "/:id/follow",
  authenticate,
  authorize(["Student"]),
  async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id, 10);
      if (isNaN(teacherId)) return res.status(400).json({ message: "Invalid teacher id" });
      const studentId: number = req.user.id;

      const existing = await db
        .select()
        .from(callernTeacherFollowers)
        .where(
          and(
            eq(callernTeacherFollowers.teacherId, teacherId),
            eq(callernTeacherFollowers.studentId, studentId)
          )
        )
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(callernTeacherFollowers)
          .set({ isActive: true })
          .where(
            and(
              eq(callernTeacherFollowers.teacherId, teacherId),
              eq(callernTeacherFollowers.studentId, studentId)
            )
          );
      } else {
        await db.insert(callernTeacherFollowers).values({ teacherId, studentId, isActive: true });
      }

      res.json({ following: true, message: "You will be notified when this teacher becomes available" });
    } catch (err) {
      console.error("Error following teacher:", err);
      res.status(500).json({ message: "Failed to follow teacher" });
    }
  }
);

// ---------------------------------------------------------------------------
// DELETE /api/teachers/:id/follow  (student – authenticated)
// ---------------------------------------------------------------------------
router.delete(
  "/:id/follow",
  authenticate,
  authorize(["Student"]),
  async (req: any, res) => {
    try {
      const teacherId = parseInt(req.params.id, 10);
      if (isNaN(teacherId)) return res.status(400).json({ message: "Invalid teacher id" });
      const studentId: number = req.user.id;

      await db
        .update(callernTeacherFollowers)
        .set({ isActive: false })
        .where(
          and(
            eq(callernTeacherFollowers.teacherId, teacherId),
            eq(callernTeacherFollowers.studentId, studentId)
          )
        );

      res.json({ following: false, message: "You will no longer be notified for this teacher" });
    } catch (err) {
      console.error("Error unfollowing teacher:", err);
      res.status(500).json({ message: "Failed to unfollow teacher" });
    }
  }
);

export default router;
