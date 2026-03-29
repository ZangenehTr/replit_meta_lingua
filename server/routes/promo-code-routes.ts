import { Router } from "express";
import { db } from "../db.js";
import { promoCodes } from "@shared/schema";
import { eq, desc } from "drizzle-orm";
import { authenticate } from "../auth.js";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

// GET /api/admin/promo-codes — list all promo codes
router.get("/api/admin/promo-codes", authenticate, requireAdmin, async (req, res) => {
  try {
    const codes = await db.select().from(promoCodes).orderBy(desc(promoCodes.createdAt));
    res.json(codes);
  } catch (error: any) {
    console.error("Error fetching promo codes:", error);
    res.status(500).json({ message: "Failed to fetch promo codes" });
  }
});

// POST /api/admin/promo-codes — create
router.post("/api/admin/promo-codes", authenticate, requireAdmin, async (req: any, res) => {
  try {
    const {
      code, description, discountType, discountValue, minAmount,
      maxUsages, expiresAt, applicableCourseIds, isActive
    } = req.body;

    if (!code || !discountType || discountValue == null) {
      return res.status(400).json({ message: "code, discountType, and discountValue are required" });
    }
    if (!["percentage", "fixed"].includes(discountType)) {
      return res.status(400).json({ message: "discountType must be 'percentage' or 'fixed'" });
    }
    if (discountType === "percentage" && (discountValue < 1 || discountValue > 100)) {
      return res.status(400).json({ message: "Percentage discount must be between 1 and 100" });
    }

    const [created] = await db.insert(promoCodes).values({
      code: code.toUpperCase().trim(),
      description: description || null,
      discountType,
      discountValue: Number(discountValue),
      minAmount: minAmount ? Number(minAmount) : 0,
      maxUsages: maxUsages ? Number(maxUsages) : null,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      applicableCourseIds: applicableCourseIds || null,
      isActive: isActive !== false,
      createdBy: req.user.id,
    }).returning();

    res.status(201).json(created);
  } catch (error: any) {
    if (error.code === "23505") {
      return res.status(409).json({ message: "Promo code already exists" });
    }
    console.error("Error creating promo code:", error);
    res.status(500).json({ message: "Failed to create promo code" });
  }
});

// PUT /api/admin/promo-codes/:id — update
router.put("/api/admin/promo-codes/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const {
      description, discountType, discountValue, minAmount,
      maxUsages, expiresAt, applicableCourseIds, isActive
    } = req.body;

    const updates: Record<string, any> = { updatedAt: new Date() };
    if (description !== undefined) updates.description = description;
    if (discountType !== undefined) updates.discountType = discountType;
    if (discountValue !== undefined) updates.discountValue = Number(discountValue);
    if (minAmount !== undefined) updates.minAmount = Number(minAmount);
    if (maxUsages !== undefined) updates.maxUsages = maxUsages ? Number(maxUsages) : null;
    if (expiresAt !== undefined) updates.expiresAt = expiresAt ? new Date(expiresAt) : null;
    if (applicableCourseIds !== undefined) updates.applicableCourseIds = applicableCourseIds;
    if (isActive !== undefined) updates.isActive = isActive;

    const [updated] = await db.update(promoCodes).set(updates).where(eq(promoCodes.id, id)).returning();
    if (!updated) return res.status(404).json({ message: "Promo code not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Error updating promo code:", error);
    res.status(500).json({ message: "Failed to update promo code" });
  }
});

// DELETE /api/admin/promo-codes/:id
router.delete("/api/admin/promo-codes/:id", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const [deleted] = await db.delete(promoCodes).where(eq(promoCodes.id, id)).returning();
    if (!deleted) return res.status(404).json({ message: "Promo code not found" });
    res.json({ message: "Promo code deleted" });
  } catch (error: any) {
    console.error("Error deleting promo code:", error);
    res.status(500).json({ message: "Failed to delete promo code" });
  }
});

// POST /api/promo-codes/validate — validate a promo code (for students during enrollment)
router.post("/api/promo-codes/validate", authenticate, async (req, res) => {
  try {
    const { code, courseId, amount } = req.body;
    if (!code) return res.status(400).json({ message: "Code is required" });

    const [promo] = await db.select().from(promoCodes).where(eq(promoCodes.code, code.toUpperCase().trim()));
    if (!promo) return res.status(404).json({ valid: false, message: "کد تخفیف معتبر نیست" });
    if (!promo.isActive) return res.status(400).json({ valid: false, message: "این کد تخفیف غیرفعال است" });

    // Check expiry
    if (promo.expiresAt && new Date() > new Date(promo.expiresAt)) {
      return res.status(400).json({ valid: false, message: "کد تخفیف منقضی شده است" });
    }

    // Check usage limit
    if (promo.maxUsages !== null && promo.usedCount >= promo.maxUsages) {
      return res.status(400).json({ valid: false, message: "این کد تخفیف به حداکثر استفاده رسیده است" });
    }

    // Check minimum order amount
    const orderAmount = Number(amount) || 0;
    if (promo.minAmount && orderAmount < promo.minAmount) {
      return res.status(400).json({
        valid: false,
        message: `حداقل مبلغ سفارش برای استفاده از این کد ${promo.minAmount.toLocaleString('fa-IR')} تومان است`
      });
    }

    // Check applicable courses
    if (promo.applicableCourseIds && Array.isArray(promo.applicableCourseIds) && promo.applicableCourseIds.length > 0) {
      if (courseId && !(promo.applicableCourseIds as number[]).includes(Number(courseId))) {
        return res.status(400).json({ valid: false, message: "این کد تخفیف برای این دوره قابل استفاده نیست" });
      }
    }

    // Calculate discount
    let discountAmount = 0;
    if (promo.discountType === "percentage") {
      discountAmount = Math.round(orderAmount * promo.discountValue / 100);
    } else {
      discountAmount = Math.min(promo.discountValue, orderAmount);
    }
    const finalAmount = Math.max(0, orderAmount - discountAmount);

    res.json({
      valid: true,
      promoCodeId: promo.id,
      code: promo.code,
      discountType: promo.discountType,
      discountValue: promo.discountValue,
      discountAmount,
      finalAmount,
      message: `کد تخفیف اعمال شد: ${discountAmount.toLocaleString('fa-IR')} تومان تخفیف`
    });
  } catch (error: any) {
    console.error("Error validating promo code:", error);
    res.status(500).json({ valid: false, message: "خطا در بررسی کد تخفیف" });
  }
});

export default router;
