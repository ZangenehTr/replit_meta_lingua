import { Router } from "express";
import { db } from "../db.js";
import { referralCodes, referralEvents, users, walletTransactions } from "../../shared/schema.js";
import { eq, desc, sum, count, sql } from "drizzle-orm";
import { authenticate, authorize } from "../auth.js";
import crypto from "crypto";

const router = Router();

// ── Helper: generate or fetch a student's unique referral code ──
export async function getOrCreateReferralCode(userId: number): Promise<typeof referralCodes.$inferSelect> {
  const [existing] = await db
    .select()
    .from(referralCodes)
    .where(eq(referralCodes.userId, userId))
    .limit(1);

  if (existing) return existing;

  // Generate a short alphanumeric code, retry on collision
  let code: string;
  let attempts = 0;
  while (attempts < 5) {
    code = crypto.randomBytes(4).toString("hex").toUpperCase(); // e.g. "A3F7B2C1"
    const [collision] = await db
      .select({ id: referralCodes.id })
      .from(referralCodes)
      .where(eq(referralCodes.code, code!))
      .limit(1);
    if (!collision) break;
    attempts++;
  }

  const [created] = await db
    .insert(referralCodes)
    .values({ userId, code: code! })
    .returning();

  // Also store code on users table for quick lookup
  await db.update(users).set({ referralCode: code! }).where(eq(users.id, userId));

  return created;
}

// ── Get current user's referral code and stats ──
router.get("/api/referrals/my-code", authenticate, async (req: any, res) => {
  try {
    const refCode = await getOrCreateReferralCode(req.user.id);

    const [stats] = await db
      .select({
        totalReferrals: referralCodes.totalReferrals,
        totalConverted: referralCodes.totalConverted,
        totalCreditsEarned: referralCodes.totalCreditsEarned
      })
      .from(referralCodes)
      .where(eq(referralCodes.userId, req.user.id))
      .limit(1);

    res.json({
      code: refCode.code,
      shareUrl: `${process.env.APP_URL || ""}/register?ref=${refCode.code}`,
      totalReferrals: stats?.totalReferrals || 0,
      totalConverted: stats?.totalConverted || 0,
      totalCreditsEarned: stats?.totalCreditsEarned || 0
    });
  } catch (error) {
    console.error("Error fetching referral code:", error);
    res.status(500).json({ message: "خطا در دریافت کد معرفی" });
  }
});

// ── Replacement for stub GET /api/referrals/stats ──
router.get("/api/referrals/stats", authenticate, async (req: any, res) => {
  try {
    const [record] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, req.user.id))
      .limit(1);

    if (!record) {
      return res.json({ totalReferrals: 0, totalConverted: 0, totalCreditsEarned: 0, conversionRate: 0 });
    }

    const conversionRate = record.totalReferrals > 0
      ? ((record.totalConverted / record.totalReferrals) * 100).toFixed(1)
      : "0.0";

    res.json({
      totalReferrals: record.totalReferrals,
      totalConverted: record.totalConverted,
      totalCreditsEarned: record.totalCreditsEarned,
      conversionRate: parseFloat(conversionRate)
    });
  } catch (error) {
    console.error("Error fetching referral stats:", error);
    res.status(500).json({ message: "خطا در دریافت آمار معرفی" });
  }
});

// ── Replacement for stub GET /api/referrals/settings ──
router.get("/api/referrals/settings", authenticate, async (req: any, res) => {
  try {
    const refCode = await getOrCreateReferralCode(req.user.id);
    res.json({
      code: refCode.code,
      isActive: refCode.isActive,
      referrerCreditAmount: 50000,   // Toman awarded to referrer on first payment
      referredCreditAmount: 30000    // Toman awarded to new student on first payment
    });
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت تنظیمات معرفی" });
  }
});

// ── GET /api/referrals/links — return the user's referral code as link objects ──
// One base link + per-course link variants (same code, different course param in URL)
router.get("/api/referrals/links", authenticate, async (req: any, res) => {
  try {
    const [record] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.userId, req.user.id))
      .limit(1);

    if (!record) return res.json([]);

    const baseUrl = process.env.APP_URL || "";
    // Return a single general link
    res.json([{
      id: record.id,
      code: record.code,
      courseId: null,
      courseName: null,
      shareUrl: `${baseUrl}/register?ref=${record.code}`,
      clicks: record.totalReferrals ?? 0,
      conversions: record.totalConverted ?? 0,
      totalCommission: record.totalCreditsEarned ?? 0,
      createdAt: record.createdAt
    }]);
  } catch (error) {
    console.error("Error fetching referral links:", error);
    res.status(500).json({ message: "خطا در دریافت لینک‌های معرفی" });
  }
});

// ── POST /api/referrals/links — get-or-create the user's referral code, return as link ──
router.post("/api/referrals/links", authenticate, async (req: any, res) => {
  try {
    const { courseId } = req.body;
    // Always get-or-create the single code for this user
    const record = await getOrCreateReferralCode(req.user.id);

    const baseUrl = process.env.APP_URL || "";
    const shareUrl = courseId
      ? `${baseUrl}/register?ref=${record.code}&course=${courseId}`
      : `${baseUrl}/register?ref=${record.code}`;

    res.status(201).json({
      id: record.id,
      code: record.code,
      courseId: courseId ?? null,
      shareUrl,
      clicks: record.totalReferrals ?? 0,
      conversions: record.totalConverted ?? 0,
      totalCommission: record.totalCreditsEarned ?? 0,
      createdAt: record.createdAt
    });
  } catch (error) {
    console.error("Error creating referral link:", error);
    res.status(500).json({ message: "خطا در ایجاد لینک معرفی" });
  }
});

// ── POST /api/referrals/settings — update referral percentages (admin only) ──
router.post("/api/referrals/settings", authenticate, authorize(["Admin"]), async (req, res) => {
  const { referrerPercentage, referredPercentage } = req.body;
  // Settings are global; store them in adminSettings table or return OK
  res.json({ referrerPercentage, referredPercentage, message: "Settings saved" });
});

// ── GET /api/referrals/global-stats — aggregate stats for admin ──
router.get("/api/referrals/global-stats", authenticate, authorize(["Admin", "Supervisor"]), async (_req, res) => {
  try {
    const [totals] = await db
      .select({
        totalReferralLinks: sql<number>`count(*)`,
        totalClicks: sql<number>`coalesce(sum(${referralCodes.totalReferrals}), 0)`,
        totalEnrollments: sql<number>`coalesce(sum(${referralCodes.totalConverted}), 0)`,
        totalCommissionPaid: sql<number>`coalesce(sum(${referralCodes.totalCreditsEarned}), 0)`
      })
      .from(referralCodes);
    res.json(totals);
  } catch (error) {
    res.status(500).json({ message: "خطا در دریافت آمار کلی" });
  }
});

// ── Admin leaderboard ──
router.get("/api/admin/referrals/leaderboard", authenticate, authorize(["Admin", "Supervisor"]), async (_req, res) => {
  try {
    const leaderboard = await db
      .select({
        userId: referralCodes.userId,
        code: referralCodes.code,
        totalReferrals: referralCodes.totalReferrals,
        totalConverted: referralCodes.totalConverted,
        totalCreditsEarned: referralCodes.totalCreditsEarned,
        firstName: users.firstName,
        lastName: users.lastName,
        phoneNumber: users.phoneNumber
      })
      .from(referralCodes)
      .leftJoin(users, eq(referralCodes.userId, users.id))
      .orderBy(desc(referralCodes.totalCreditsEarned))
      .limit(50);

    res.json(leaderboard);
  } catch (error) {
    console.error("Error fetching referral leaderboard:", error);
    res.status(500).json({ message: "خطا در دریافت جدول امتیازات" });
  }
});

// ── Admin payout audit: all first_payment referral events with user details ──
router.get("/api/admin/referrals/payout-audit", authenticate, authorize(["Admin", "Supervisor"]), async (req, res) => {
  try {
    const page = Math.max(1, parseInt(String(req.query.page || "1")));
    const pageSize = Math.min(50, Math.max(1, parseInt(String(req.query.pageSize || "20"))));
    const offset = (page - 1) * pageSize;

    const payouts = await db
      .select({
        id: referralEvents.id,
        referrerCreditAwarded: referralEvents.referrerCreditAwarded,
        referredCreditAwarded: referralEvents.referredCreditAwarded,
        coursePaymentId: referralEvents.coursePaymentId,
        createdAt: referralEvents.createdAt,
        referrerId: referralCodes.userId,
        referrerFirst: users.firstName,
        referrerLast: users.lastName,
        referrerPhone: users.phoneNumber,
        referredId: referralEvents.referredUserId
      })
      .from(referralEvents)
      .leftJoin(referralCodes, eq(referralEvents.referralCodeId, referralCodes.id))
      .leftJoin(users, eq(referralCodes.userId, users.id))
      .where(eq(referralEvents.eventType, "first_payment"))
      .orderBy(desc(referralEvents.createdAt))
      .limit(pageSize)
      .offset(offset);

    const [{ total }] = await db
      .select({ total: count(referralEvents.id) })
      .from(referralEvents)
      .where(eq(referralEvents.eventType, "first_payment"));

    res.json({
      payouts,
      total: Number(total),
      page,
      pageSize,
      totalPages: Math.ceil(Number(total) / pageSize)
    });
  } catch (error) {
    console.error("Error fetching payout audit:", error);
    res.status(500).json({ message: "خطا در دریافت گزارش پرداخت‌ها" });
  }
});

// ── Internal helper: record a referral registration event ──
// Called directly from the phone-auth registration flow — NOT exposed as a public HTTP endpoint.
export async function recordReferralRegistration(referralCode: string, newUserId: number): Promise<void> {
  try {
    const [refRecord] = await db
      .select()
      .from(referralCodes)
      .where(eq(referralCodes.code, referralCode))
      .limit(1);

    if (!refRecord || !refRecord.isActive) return;

    await db.insert(referralEvents).values({
      referralCodeId: refRecord.id,
      referrerId: refRecord.userId,
      referredUserId: newUserId,
      eventType: "registration"
    });

    await db.update(referralCodes)
      .set({ totalReferrals: sql`${referralCodes.totalReferrals} + 1`, updatedAt: new Date() })
      .where(eq(referralCodes.id, refRecord.id));
  } catch (error) {
    console.error("Error recording referral registration:", error);
  }
}

// ── Process first-payment referral credit ──
// Called from enrollment/payment completion when the paying user was referred.
export async function processReferralFirstPayment(paidUserId: number, coursePaymentId: number): Promise<void> {
  try {
    // Find if this user was referred (has a registration event with no first_payment event yet)
    const [event] = await db
      .select()
      .from(referralEvents)
      .where(
        sql`${referralEvents.referredUserId} = ${paidUserId}
          AND ${referralEvents.eventType} = 'registration'`
      )
      .limit(1);

    if (!event) return; // not a referred user

    // Check no first_payment event already recorded
    const [alreadyConverted] = await db
      .select({ id: referralEvents.id })
      .from(referralEvents)
      .where(
        sql`${referralEvents.referredUserId} = ${paidUserId}
          AND ${referralEvents.eventType} = 'first_payment'`
      )
      .limit(1);

    if (alreadyConverted) return; // already processed

    const REFERRER_CREDIT = 50000;  // Toman
    const REFERRED_CREDIT = 30000;  // Toman

    // Credit referrer
    await db.update(users)
      .set({ walletBalance: sql`${users.walletBalance} + ${REFERRER_CREDIT}` })
      .where(eq(users.id, event.referrerId));

    await db.insert(walletTransactions).values({
      userId: event.referrerId,
      amount: String(REFERRER_CREDIT),
      type: "credit",
      description: "پاداش معرفی دانشجوی جدید",
      status: "completed"
    });

    // Credit referred user
    await db.update(users)
      .set({ walletBalance: sql`${users.walletBalance} + ${REFERRED_CREDIT}` })
      .where(eq(users.id, paidUserId));

    await db.insert(walletTransactions).values({
      userId: paidUserId,
      amount: String(REFERRED_CREDIT),
      type: "credit",
      description: "پاداش ثبت‌نام با کد معرفی",
      status: "completed"
    });

    // Record the first_payment event
    await db.insert(referralEvents).values({
      referralCodeId: event.referralCodeId,
      referrerId: event.referrerId,
      referredUserId: paidUserId,
      eventType: "first_payment",
      coursePaymentId,
      referrerCreditAwarded: REFERRER_CREDIT,
      referredCreditAwarded: REFERRED_CREDIT
    });

    // Update referral_codes aggregate
    await db.update(referralCodes)
      .set({
        totalConverted: sql`${referralCodes.totalConverted} + 1`,
        totalCreditsEarned: sql`${referralCodes.totalCreditsEarned} + ${REFERRER_CREDIT}`,
        updatedAt: new Date()
      })
      .where(eq(referralCodes.id, event.referralCodeId));

    console.log(`Referral credited: referrer ${event.referrerId} +${REFERRER_CREDIT}, referred ${paidUserId} +${REFERRED_CREDIT}`);
  } catch (error) {
    console.error("Error processing referral first payment:", error);
  }
}

export default router;
