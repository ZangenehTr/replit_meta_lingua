import { Router } from "express";
import { db } from "../db.js";
import { courseReviews, courses, enrollments, users } from "../../shared/schema.js";
import { eq, and, avg, count, desc } from "drizzle-orm";
import { authenticate, authorize } from "../auth.js";

const router = Router();

// ── Submit a review (authenticated student, must have a completed enrollment) ──
router.post("/api/courses/:courseId/reviews", authenticate, async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = req.user.id;
    const { rating, reviewText, reviewTextFa, reviewTextAr, isAnonymous } = req.body;

    if (!rating || rating < 1 || rating > 5) {
      return res.status(400).json({ message: "امتیاز باید بین ۱ تا ۵ باشد" });
    }

    // Check that the student has an enrollment in this course
    const [enrollment] = await db
      .select({ id: enrollments.id, status: enrollments.status })
      .from(enrollments)
      .where(and(eq(enrollments.userId, studentId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      return res.status(403).json({ message: "فقط دانشجویان ثبت‌نام‌شده می‌توانند نظر بگذارند" });
    }

    // Prevent duplicate review
    const [existing] = await db
      .select({ id: courseReviews.id })
      .from(courseReviews)
      .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.studentId, studentId)))
      .limit(1);

    if (existing) {
      return res.status(409).json({ message: "شما قبلاً برای این دوره نظر ثبت کرده‌اید" });
    }

    const [review] = await db
      .insert(courseReviews)
      .values({
        courseId,
        studentId,
        enrollmentId: enrollment.id,
        rating,
        reviewText: reviewText || null,
        reviewTextFa: reviewTextFa || null,
        reviewTextAr: reviewTextAr || null,
        isAnonymous: isAnonymous || false,
        status: "pending"
      })
      .returning();

    res.status(201).json({
      message: "نظر شما با موفقیت ثبت شد و پس از تأیید مدیر نمایش داده می‌شود",
      review
    });
  } catch (error) {
    console.error("Error submitting course review:", error);
    res.status(500).json({ message: "خطا در ثبت نظر" });
  }
});

// ── Get approved reviews for a course (public) ──
router.get("/api/courses/:courseId/reviews", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);

    const reviews = await db
      .select({
        id: courseReviews.id,
        rating: courseReviews.rating,
        reviewText: courseReviews.reviewText,
        reviewTextFa: courseReviews.reviewTextFa,
        reviewTextAr: courseReviews.reviewTextAr,
        isAnonymous: courseReviews.isAnonymous,
        helpfulCount: courseReviews.helpfulCount,
        createdAt: courseReviews.createdAt,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentAvatar: users.avatar
      })
      .from(courseReviews)
      .leftJoin(users, eq(courseReviews.studentId, users.id))
      .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, "approved")))
      .orderBy(desc(courseReviews.createdAt));

    // Compute aggregate
    const [agg] = await db
      .select({
        avgRating: avg(courseReviews.rating),
        totalCount: count(courseReviews.id)
      })
      .from(courseReviews)
      .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, "approved")));

    const sanitized = reviews.map((r) => ({
      id: r.id,
      rating: r.rating,
      reviewText: r.reviewText,
      reviewTextFa: r.reviewTextFa,
      reviewTextAr: r.reviewTextAr,
      helpfulCount: r.helpfulCount,
      createdAt: r.createdAt,
      studentName: r.isAnonymous ? "ناشناس" : `${r.studentFirstName || ""} ${r.studentLastName || ""}`.trim(),
      studentAvatar: r.isAnonymous ? null : r.studentAvatar
    }));

    res.json({
      reviews: sanitized,
      averageRating: agg?.avgRating ? parseFloat(String(agg.avgRating)).toFixed(1) : null,
      totalReviews: Number(agg?.totalCount || 0)
    });
  } catch (error) {
    console.error("Error fetching course reviews:", error);
    res.status(500).json({ message: "خطا در دریافت نظرات" });
  }
});

// ── Admin: list all reviews (with filter by status) ──
router.get("/api/admin/course-reviews", authenticate, authorize(["Admin", "Supervisor"]), async (req: any, res) => {
  try {
    const status = (req.query.status as string) || "pending";

    const reviews = await db
      .select({
        id: courseReviews.id,
        rating: courseReviews.rating,
        reviewText: courseReviews.reviewText,
        reviewTextFa: courseReviews.reviewTextFa,
        status: courseReviews.status,
        rejectionReason: courseReviews.rejectionReason,
        isAnonymous: courseReviews.isAnonymous,
        createdAt: courseReviews.createdAt,
        courseId: courseReviews.courseId,
        studentId: courseReviews.studentId,
        courseTitle: courses.title,
        studentFirstName: users.firstName,
        studentLastName: users.lastName
      })
      .from(courseReviews)
      .leftJoin(courses, eq(courseReviews.courseId, courses.id))
      .leftJoin(users, eq(courseReviews.studentId, users.id))
      .where(status === "all" ? undefined : eq(courseReviews.status, status as any))
      .orderBy(desc(courseReviews.createdAt));

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching admin course reviews:", error);
    res.status(500).json({ message: "خطا در دریافت نظرات" });
  }
});

// ── Admin: approve or reject a review ──
router.patch("/api/admin/course-reviews/:id", authenticate, authorize(["Admin", "Supervisor"]), async (req: any, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { action, rejectionReason } = req.body; // action: "approve" | "reject"

    if (!["approve", "reject"].includes(action)) {
      return res.status(400).json({ message: "action باید approve یا reject باشد" });
    }

    const [updated] = await db
      .update(courseReviews)
      .set({
        status: action === "approve" ? "approved" : "rejected",
        approvedBy: action === "approve" ? req.user.id : null,
        approvedAt: action === "approve" ? new Date() : null,
        rejectionReason: action === "reject" ? (rejectionReason || null) : null,
        updatedAt: new Date()
      })
      .where(eq(courseReviews.id, reviewId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "نظر پیدا نشد" });
    }

    res.json({ message: action === "approve" ? "نظر تأیید شد" : "نظر رد شد", review: updated });
  } catch (error) {
    console.error("Error moderating course review:", error);
    res.status(500).json({ message: "خطا در مدیریت نظر" });
  }
});

// ── POST /api/courses/:courseId/reviews/:reviewId/helpful — mark a review as helpful ──
router.post("/api/courses/:courseId/reviews/:reviewId/helpful", async (req, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    await db
      .update(courseReviews)
      .set({ helpfulCount: sql`${courseReviews.helpfulCount} + 1` })
      .where(eq(courseReviews.id, reviewId));
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ message: "خطا" });
  }
});

export default router;
