import { Router } from "express";
import { db } from "../db.js";
import { certificates, users, courses, enrollments, promoCodeUsages, promoCodes, adminSettings } from "@shared/schema";
import { eq, desc, and, notInArray, sql, count } from "drizzle-orm";
import { authenticate } from "../auth.js";
import { generateCertificatePdf, getCertificatePdfPath } from "../services/certificate-pdf.js";
import fs from "fs";
import path from "path";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

export function generateCertificateNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${y}${m}${d}-${rand}`;
}

/**
 * Core certificate issuance logic — shared by auto-issuance and admin manual issuance.
 * Generates the PDF in the background (non-blocking).
 */
export async function issueCertificate(opts: {
  studentId: number;
  courseId: number;
  issuedBy?: number | null;
  expiresAt?: Date | null;
  metadata?: Record<string, any> | null;
  /** Only admin-triggered paths should set this to true. Revives a revoked cert. */
  adminForce?: boolean;
}): Promise<typeof certificates.$inferSelect> {
  const { studentId, courseId, issuedBy = null, expiresAt = null, metadata = null, adminForce = false } = opts;

  // Check for any existing certificate (active or revoked)
  const [existing] = await db
    .select()
    .from(certificates)
    .where(
      and(
        eq(certificates.studentId, studentId),
        eq(certificates.courseId, courseId)
      )
    )
    .orderBy(desc(certificates.issuedAt))
    .limit(1);

  if (existing) {
    if (existing.status === "active") {
      // Idempotent — return existing active cert
      return existing;
    }
    if (existing.status === "revoked") {
      if (!adminForce) {
        // Students cannot bypass revocation — only admins can re-issue
        throw Object.assign(new Error("Certificate has been revoked and cannot be reissued without admin action"), {
          code: "CERT_REVOKED",
          status: 403,
        });
      }
      // Admin re-issue: revive the revoked cert in-place (preserves history, single record)
      const [revived] = await db
        .update(certificates)
        .set({
          status: "active",
          revokedAt: null,
          revokeReason: null,
          issuedBy: issuedBy ?? existing.issuedBy,
          issuedAt: new Date(),
        })
        .where(eq(certificates.id, existing.id))
        .returning();
      return revived;
    }
  }

  // Fetch student + course for PDF generation
  const [student] = await db
    .select({ firstName: users.firstName, lastName: users.lastName })
    .from(users)
    .where(eq(users.id, studentId));

  const [course] = await db
    .select({ title: courses.title, level: courses.level, language: courses.language })
    .from(courses)
    .where(eq(courses.id, courseId));

  const certNumber = generateCertificateNumber();

  const [created] = await db
    .insert(certificates)
    .values({
      certificateNumber: certNumber,
      studentId,
      courseId,
      issuedBy,
      expiresAt,
      status: "active",
      metadata,
    })
    .returning();

  // Generate PDF asynchronously — don't block the API response
  const studentName =
    student
      ? `${student.firstName || ""} ${student.lastName || ""}`.trim() || `دانشجو #${studentId}`
      : `دانشجو #${studentId}`;

  // Load certificate template config from admin settings (non-blocking)
  const pdfGenerationPromise = (async () => {
    let templateConfig: Record<string, string> = {};
    try {
      const [settingsRow] = await db.select().from(adminSettings).limit(1);
      if (settingsRow?.certificateTemplate) {
        templateConfig = JSON.parse(settingsRow.certificateTemplate as string);
      }
    } catch { /* use defaults */ }

    return generateCertificatePdf({
      certificateNumber: certNumber,
      studentName,
      courseTitle: course?.title || `دوره #${courseId}`,
      courseLevel: course?.level,
      courseLanguage: course?.language,
      issuedAt: created.issuedAt,
      instituteName: templateConfig.instituteNameEn,
      instituteNameFa: templateConfig.instituteNameFa,
      logo: templateConfig.logoUrl,
      certTitle: templateConfig.certTitle,
      signatureTitle: templateConfig.signatureTitle,
      footerNote: templateConfig.footerNote,
    });
  })();

  pdfGenerationPromise
    .then((pdfPath) =>
      db
        .update(certificates)
        .set({ pdfPath })
        .where(eq(certificates.id, created.id))
        .catch((e) => console.error("Failed to update pdfPath:", e))
    )
    .catch((e) => console.error("Certificate PDF generation failed:", e));

  return created;
}

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/certificates — list all certificates with student + course info
router.get("/api/admin/certificates", authenticate, requireAdmin, async (req, res) => {
  try {
    const result = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        issuedAt: certificates.issuedAt,
        expiresAt: certificates.expiresAt,
        revokedAt: certificates.revokedAt,
        revokeReason: certificates.revokeReason,
        pdfPath: certificates.pdfPath,
        metadata: certificates.metadata,
        studentId: certificates.studentId,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentPhone: users.phoneNumber,
        courseId: certificates.courseId,
        courseTitle: courses.title,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .orderBy(desc(certificates.issuedAt));

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

// POST /api/admin/certificates — issue a certificate manually
router.post("/api/admin/certificates", authenticate, requireAdmin, async (req: any, res) => {
  try {
    const { studentId, courseId, expiresAt, metadata } = req.body;
    if (!studentId || !courseId) {
      return res.status(400).json({ message: "studentId and courseId are required" });
    }

    const cert = await issueCertificate({
      studentId: Number(studentId),
      courseId: Number(courseId),
      issuedBy: req.user.id,
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      metadata: metadata || null,
      adminForce: true, // Admins can re-issue even after revocation
    });

    res.status(201).json(cert);
  } catch (error: any) {
    console.error("Error issuing certificate:", error);
    res.status(500).json({ message: "Failed to issue certificate" });
  }
});

// PUT /api/admin/certificates/:id/revoke — revoke a certificate
router.put("/api/admin/certificates/:id/revoke", authenticate, requireAdmin, async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { reason } = req.body;

    const [updated] = await db
      .update(certificates)
      .set({
        status: "revoked",
        revokedAt: new Date(),
        revokeReason: reason || "Revoked by administrator",
      })
      .where(eq(certificates.id, id))
      .returning();

    if (!updated) return res.status(404).json({ message: "Certificate not found" });
    res.json(updated);
  } catch (error: any) {
    console.error("Error revoking certificate:", error);
    res.status(500).json({ message: "Failed to revoke certificate" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// ADMIN promo code analytics
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/admin/promo-codes/:id/usages — list usages for a specific promo code
router.get("/api/admin/promo-codes/:id/usages", authenticate, requireAdmin, async (req, res) => {
  try {
    const promoId = parseInt(req.params.id);

    const usages = await db
      .select({
        id: promoCodeUsages.id,
        usedAt: promoCodeUsages.usedAt,
        discountAmount: promoCodeUsages.discountAmount,
        originalAmount: promoCodeUsages.originalAmount,
        finalAmount: promoCodeUsages.finalAmount,
        userId: promoCodeUsages.userId,
        courseId: promoCodeUsages.courseId,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        studentPhone: users.phoneNumber,
        courseTitle: courses.title,
      })
      .from(promoCodeUsages)
      .leftJoin(users, eq(promoCodeUsages.userId, users.id))
      .leftJoin(courses, eq(promoCodeUsages.courseId, courses.id))
      .where(eq(promoCodeUsages.promoCodeId, promoId))
      .orderBy(desc(promoCodeUsages.usedAt));

    res.json(usages);
  } catch (error: any) {
    console.error("Error fetching promo usages:", error);
    res.status(500).json({ message: "Failed to fetch promo code usages" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// STUDENT routes
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/student/my-certificates — student's own certificates
router.get("/api/student/my-certificates", authenticate, async (req: any, res) => {
  try {
    const result = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        issuedAt: certificates.issuedAt,
        expiresAt: certificates.expiresAt,
        revokedAt: certificates.revokedAt,
        pdfPath: certificates.pdfPath,
        metadata: certificates.metadata,
        courseId: certificates.courseId,
        courseTitle: courses.title,
        courseLevel: courses.level,
        courseLanguage: courses.language,
      })
      .from(certificates)
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.studentId, req.user.id))
      .orderBy(desc(certificates.issuedAt));

    // Map: expose hasPdf flag (don't expose raw server path)
    const mapped = result.map((c) => ({
      ...c,
      hasPdf: !!c.pdfPath,
      pdfPath: undefined,
    }));

    res.json(mapped);
  } catch (error: any) {
    console.error("Error fetching student certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

// GET /api/student/completed-enrollments — completed courses not yet certified
router.get("/api/student/completed-enrollments", authenticate, async (req: any, res) => {
  try {
    const userId = req.user.id;

    const activeCerts = await db
      .select({ courseId: certificates.courseId })
      .from(certificates)
      .where(and(eq(certificates.studentId, userId), eq(certificates.status, "active")));

    const certifiedCourseIds = activeCerts.map((c) => c.courseId);

    const query = db
      .select({
        enrollmentId: enrollments.id,
        courseId: enrollments.courseId,
        progress: enrollments.progress,
        completedAt: enrollments.completedAt,
        courseTitle: courses.title,
        courseLevel: courses.level,
        courseLanguage: courses.language,
      })
      .from(enrollments)
      .leftJoin(courses, eq(enrollments.courseId, courses.id))
      .where(
        and(
          eq(enrollments.userId, userId),
          certifiedCourseIds.length > 0
            ? notInArray(enrollments.courseId, certifiedCourseIds)
            : undefined
        )
      );

    const all = await query;
    const completed = all.filter(
      (e) => (e.progress ?? 0) >= 100 || e.completedAt !== null
    );

    res.json(completed);
  } catch (error: any) {
    console.error("Error fetching completed enrollments:", error);
    res.status(500).json({ message: "Failed to fetch completed enrollments" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// DOWNLOAD endpoint — authenticated (student can download their own cert)
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/certificates/:number/download — download stored PDF
router.get("/api/certificates/:number/download", authenticate, async (req: any, res) => {
  try {
    const { number } = req.params;
    const certNumber = number.toUpperCase();

    const [cert] = await db
      .select({ id: certificates.id, studentId: certificates.studentId, pdfPath: certificates.pdfPath, status: certificates.status })
      .from(certificates)
      .where(eq(certificates.certificateNumber, certNumber));

    if (!cert) {
      return res.status(404).json({ message: "Certificate not found" });
    }

    // Students can only download their own cert; admins can download any
    const userId = req.user.id;
    const role = req.user.role?.toLowerCase();
    if (role !== "admin" && cert.studentId !== userId) {
      return res.status(403).json({ message: "Access denied" });
    }

    // Check stored PDF
    if (cert.pdfPath && fs.existsSync(cert.pdfPath)) {
      res.setHeader("Content-Type", "application/pdf");
      res.setHeader("Content-Disposition", `attachment; filename="${certNumber}.pdf"`);
      return fs.createReadStream(cert.pdfPath).pipe(res);
    }

    // PDF not yet generated — try to generate it on demand
    const [student] = await db
      .select({ firstName: users.firstName, lastName: users.lastName })
      .from(users)
      .where(eq(users.id, cert.studentId));

    const [course] = await db
      .select({ title: courses.title, level: courses.level, language: courses.language, issuedAt: certificates.issuedAt })
      .from(certificates)
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.id, cert.id));

    // Load certificate template config from admin settings
    let templateConfig: Record<string, string> = {};
    try {
      const [settingsRow] = await db.select().from(adminSettings).limit(1);
      if (settingsRow?.certificateTemplate) {
        templateConfig = JSON.parse(settingsRow.certificateTemplate as string);
      }
    } catch { /* use defaults */ }

    const pdfPath = await generateCertificatePdf({
      certificateNumber: certNumber,
      studentName: student
        ? `${student.firstName || ""} ${student.lastName || ""}`.trim()
        : `دانشجو`,
      courseTitle: course?.title || `دوره`,
      courseLevel: course?.level,
      courseLanguage: course?.language,
      issuedAt: cert.issuedAt ? new Date(cert.issuedAt) : new Date(),
      instituteName: templateConfig.instituteNameEn,
      instituteNameFa: templateConfig.instituteNameFa,
      logo: templateConfig.logoUrl,
      certTitle: templateConfig.certTitle,
      signatureTitle: templateConfig.signatureTitle,
      footerNote: templateConfig.footerNote,
    });

    // Persist path
    await db
      .update(certificates)
      .set({ pdfPath })
      .where(eq(certificates.id, cert.id));

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${certNumber}.pdf"`);
    fs.createReadStream(pdfPath).pipe(res);
  } catch (error: any) {
    console.error("Certificate download error:", error);
    res.status(500).json({ message: "Failed to download certificate" });
  }
});

// ─────────────────────────────────────────────────────────────────────────────
// PUBLIC verification
// ─────────────────────────────────────────────────────────────────────────────

// GET /api/certificates/verify/:number — public verification (no auth needed)
router.get("/api/certificates/verify/:number", async (req, res) => {
  try {
    const { number } = req.params;

    const [result] = await db
      .select({
        id: certificates.id,
        certificateNumber: certificates.certificateNumber,
        status: certificates.status,
        issuedAt: certificates.issuedAt,
        expiresAt: certificates.expiresAt,
        revokedAt: certificates.revokedAt,
        revokeReason: certificates.revokeReason,
        studentFirstName: users.firstName,
        studentLastName: users.lastName,
        courseTitle: courses.title,
        courseLevel: courses.level,
        courseLanguage: courses.language,
      })
      .from(certificates)
      .leftJoin(users, eq(certificates.studentId, users.id))
      .leftJoin(courses, eq(certificates.courseId, courses.id))
      .where(eq(certificates.certificateNumber, number.toUpperCase()));

    if (!result) {
      return res.status(404).json({
        valid: false,
        message: "گواهینامه‌ای با این شماره یافت نشد",
      });
    }

    const isExpired = result.expiresAt && new Date() > new Date(result.expiresAt);

    res.json({
      valid: result.status === "active" && !isExpired,
      certificate: result,
      isExpired: !!isExpired,
      message:
        result.status === "revoked"
          ? "این گواهینامه باطل شده است"
          : isExpired
          ? "این گواهینامه منقضی شده است"
          : "گواهینامه معتبر است",
    });
  } catch (error: any) {
    console.error("Error verifying certificate:", error);
    res.status(500).json({ valid: false, message: "خطا در بررسی گواهینامه" });
  }
});

export default router;
