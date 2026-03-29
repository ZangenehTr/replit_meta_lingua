import { Router } from "express";
import { db } from "../db.js";
import { certificates, users, courses } from "@shared/schema";
import { eq, desc, and } from "drizzle-orm";
import { authenticate } from "../auth.js";

const router = Router();

function requireAdmin(req: any, res: any, next: any) {
  if (!req.user || req.user.role?.toLowerCase() !== "admin") {
    return res.status(403).json({ message: "Admin access required" });
  }
  next();
}

function generateCertificateNumber(): string {
  const date = new Date();
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `CERT-${y}${m}${d}-${rand}`;
}

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

    // Check existing active certificate for this student+course
    const [existing] = await db
      .select()
      .from(certificates)
      .where(
        and(
          eq(certificates.studentId, Number(studentId)),
          eq(certificates.courseId, Number(courseId)),
          eq(certificates.status, "active")
        )
      );

    if (existing) {
      return res.status(409).json({
        message: "An active certificate already exists for this student and course",
        existingCertificate: existing,
      });
    }

    const certNumber = generateCertificateNumber();

    const [created] = await db.insert(certificates).values({
      certificateNumber: certNumber,
      studentId: Number(studentId),
      courseId: Number(courseId),
      expiresAt: expiresAt ? new Date(expiresAt) : null,
      issuedBy: req.user.id,
      metadata: metadata || null,
      status: "active",
    }).returning();

    res.status(201).json(created);
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

    res.json(result);
  } catch (error: any) {
    console.error("Error fetching student certificates:", error);
    res.status(500).json({ message: "Failed to fetch certificates" });
  }
});

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

    // Check expiry
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
