import { Router } from "express";
import { db } from "../db.js";
import { courseReviews, courses, enrollments, users } from "../../shared/schema.js";
import { eq, and, avg, count, desc, sql } from "drizzle-orm";
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

    // Check that the student has an active or completed enrollment in this course
    const [enrollment] = await db
      .select({ id: enrollments.id, status: enrollments.status })
      .from(enrollments)
      .where(and(eq(enrollments.userId, studentId), eq(enrollments.courseId, courseId)))
      .limit(1);

    if (!enrollment) {
      return res.status(403).json({ message: "فقط دانشجویان ثبت‌نام‌شده می‌توانند نظر بگذارند" });
    }

    if (enrollment.status !== "completed") {
      return res.status(403).json({ message: "فقط دانشجویانی که دوره را به پایان رسانده‌اند می‌توانند نظر بگذارند" });
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

// ── Check if authenticated user has a completed enrollment (for review eligibility) ──
router.get("/api/courses/:courseId/my-enrollment-status", authenticate, async (req: any, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const [enrollment] = await db
      .select({ status: enrollments.status })
      .from(enrollments)
      .where(and(eq(enrollments.userId, req.user.id), eq(enrollments.courseId, courseId)))
      .limit(1);

    res.json({
      hasEnrollment: !!enrollment,
      status: enrollment?.status ?? null,
      canReview: enrollment?.status === "completed"
    });
  } catch (error) {
    console.error("Error checking enrollment status:", error);
    res.status(500).json({ message: "خطا در بررسی وضعیت ثبت‌نام" });
  }
});

// ── Get approved reviews for a course (public, paginated) ──
router.get("/api/courses/:courseId/reviews", async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const pageSize = Math.min(20, Math.max(1, parseInt(String(req.query.pageSize || "10"))));
    const offset = (page - 1) * pageSize;

    const [agg] = await db
      .select({
        avgRating: avg(courseReviews.rating),
        totalCount: count(courseReviews.id)
      })
      .from(courseReviews)
      .where(and(eq(courseReviews.courseId, courseId), eq(courseReviews.status, "approved")));

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
      .orderBy(desc(courseReviews.createdAt))
      .limit(pageSize)
      .offset(offset);

    const totalReviews = Number(agg?.totalCount || 0);
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
      totalReviews,
      page,
      pageSize,
      totalPages: Math.ceil(totalReviews / pageSize)
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
      .where(status === "all" ? undefined : eq(courseReviews.status, status as "pending" | "approved" | "rejected"))
      .orderBy(desc(courseReviews.createdAt));

    res.json(reviews);
  } catch (error) {
    console.error("Error fetching admin course reviews:", error);
    res.status(500).json({ message: "خطا در دریافت نظرات" });
  }
});

// ── Admin: approve or reject a review ──
// Accepts both { status: 'approved'|'rejected' } (frontend) and { action: 'approve'|'reject' } (legacy)
router.patch("/api/admin/course-reviews/:id", authenticate, authorize(["Admin", "Supervisor"]), async (req: any, res) => {
  try {
    const reviewId = parseInt(req.params.id);
    const { action, status: statusField, rejectionReason } = req.body;

    // Normalize: accept either `action` or `status` field
    let resolvedStatus: "approved" | "rejected" | undefined;
    if (statusField === "approved" || statusField === "rejected") {
      resolvedStatus = statusField;
    } else if (action === "approve") {
      resolvedStatus = "approved";
    } else if (action === "reject") {
      resolvedStatus = "rejected";
    }

    if (!resolvedStatus) {
      return res.status(400).json({ message: "status باید approved یا rejected باشد" });
    }

    const [updated] = await db
      .update(courseReviews)
      .set({
        status: resolvedStatus,
        approvedBy: resolvedStatus === "approved" ? req.user.id : null,
        approvedAt: resolvedStatus === "approved" ? new Date() : null,
        rejectionReason: resolvedStatus === "rejected" ? (rejectionReason || null) : null,
        updatedAt: new Date()
      })
      .where(eq(courseReviews.id, reviewId))
      .returning();

    if (!updated) {
      return res.status(404).json({ message: "نظر پیدا نشد" });
    }

    res.json({ message: resolvedStatus === "approved" ? "نظر تأیید شد" : "نظر رد شد", review: updated });
  } catch (error) {
    console.error("Error moderating course review:", error);
    res.status(500).json({ message: "خطا در مدیریت نظر" });
  }
});

// In-memory deduplication: prevents double-voting within a server process session
// Key format: "userId:reviewId"
const helpfulVoteSeen = new Set<string>();

// ── POST /api/courses/:courseId/reviews/:reviewId/helpful — mark a review as helpful ──
// Requires authentication; deduplicates votes per user per review
router.post("/api/courses/:courseId/reviews/:reviewId/helpful", authenticate, async (req: any, res) => {
  try {
    const reviewId = parseInt(req.params.reviewId);
    const userId = req.user.id;

    const voteKey = `${userId}:${reviewId}`;
    if (helpfulVoteSeen.has(voteKey)) {
      return res.status(409).json({ message: "قبلاً این نظر را مفید علامت زده‌اید" });
    }

    helpfulVoteSeen.add(voteKey);
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
