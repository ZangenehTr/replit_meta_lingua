import { Express } from 'express';
import { db } from './db';
import { 
  learningRoadmaps, 
  roadmapMilestones, 
  roadmapSteps,
  userRoadmapEnrollments,
  userRoadmapProgress,
  roadmapReviews,
  insertLearningRoadmapSchema,
  insertRoadmapMilestoneSchema,
  insertRoadmapStepSchema,
  insertUserRoadmapEnrollmentSchema,
  insertUserRoadmapProgressSchema
} from '../shared/roadmap-schema';
import { eq, and, desc, sql } from 'drizzle-orm';

export function setupRoadmapRoutes(app: Express, authenticateToken: any, requireRole: any) {
  
  // ===== ADMIN/TEACHER ROADMAP MANAGEMENT =====
  
  // Create a new learning roadmap
  app.post("/api/admin/roadmaps", authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const validatedData = insertLearningRoadmapSchema.parse({
        ...req.body,
        createdBy: req.user.id
      });
      
      const [roadmap] = await db.insert(learningRoadmaps).values(validatedData).returning();
      res.status(201).json(roadmap);
    } catch (error) {
      console.error('Error creating roadmap:', error);
      res.status(500).json({ message: "Failed to create roadmap" });
    }
  });
  
  // Get all roadmaps
  app.get("/api/roadmaps", authenticateToken, async (req: any, res) => {
    try {
      const roadmaps = await db
        .select()
        .from(learningRoadmaps)
        .where(eq(learningRoadmaps.isActive, true))
        .orderBy(desc(learningRoadmaps.createdAt));
      
      res.json(roadmaps);
    } catch (error) {
      console.error('Error fetching roadmaps:', error);
      res.status(500).json({ message: "Failed to fetch roadmaps" });
    }
  });
  
  // Get roadmap details with milestones and steps
  app.get("/api/roadmaps/:id", authenticateToken, async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      
      // Get roadmap
      const [roadmap] = await db
        .select()
        .from(learningRoadmaps)
        .where(eq(learningRoadmaps.id, roadmapId));
      
      if (!roadmap) {
        return res.status(404).json({ message: "Roadmap not found" });
      }
      
      // Get milestones
      const milestones = await db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, roadmapId))
        .orderBy(roadmapMilestones.orderIndex);
      
      // Get steps for each milestone
      const milestonesWithSteps = await Promise.all(
        milestones.map(async (milestone) => {
          const steps = await db
            .select()
            .from(roadmapSteps)
            .where(eq(roadmapSteps.milestoneId, milestone.id))
            .orderBy(roadmapSteps.orderIndex);
          
          return { ...milestone, steps };
        })
      );
      
      res.json({
        ...roadmap,
        milestones: milestonesWithSteps
      });
    } catch (error) {
      console.error('Error fetching roadmap details:', error);
      res.status(500).json({ message: "Failed to fetch roadmap details" });
    }
  });
  
  // Add milestone to roadmap
  app.post("/api/roadmaps/:id/milestones", authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      
      const validatedData = insertRoadmapMilestoneSchema.parse({
        ...req.body,
        roadmapId
      });
      
      const [milestone] = await db.insert(roadmapMilestones).values(validatedData).returning();
      res.status(201).json(milestone);
    } catch (error) {
      console.error('Error creating milestone:', error);
      res.status(500).json({ message: "Failed to create milestone" });
    }
  });
  
  // Add step to milestone
  app.post("/api/milestones/:id/steps", authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const milestoneId = parseInt(req.params.id);
      
      const validatedData = insertRoadmapStepSchema.parse({
        ...req.body,
        milestoneId
      });
      
      const [step] = await db.insert(roadmapSteps).values(validatedData).returning();
      res.status(201).json(step);
    } catch (error) {
      console.error('Error creating step:', error);
      res.status(500).json({ message: "Failed to create step" });
    }
  });
  
  // Update roadmap
  app.put("/api/roadmaps/:id", authenticateToken, requireRole(['Admin', 'Teacher']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      
      const [updated] = await db
        .update(learningRoadmaps)
        .set({
          ...req.body,
          updatedAt: new Date()
        })
        .where(eq(learningRoadmaps.id, roadmapId))
        .returning();
      
      res.json(updated);
    } catch (error) {
      console.error('Error updating roadmap:', error);
      res.status(500).json({ message: "Failed to update roadmap" });
    }
  });
  
  // ===== STUDENT ROADMAP ENROLLMENT =====
  
  // Enroll in a roadmap
  app.post("/api/student/roadmaps/:id/enroll", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Check if already enrolled
      const existing = await db
        .select()
        .from(userRoadmapEnrollments)
        .where(
          and(
            eq(userRoadmapEnrollments.userId, userId),
            eq(userRoadmapEnrollments.roadmapId, roadmapId),
            eq(userRoadmapEnrollments.status, 'active')
          )
        );
      
      if (existing.length > 0) {
        return res.status(400).json({ message: "Already enrolled in this roadmap" });
      }
      
      // Count total steps
      const stepsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(roadmapSteps)
        .innerJoin(roadmapMilestones, eq(roadmapSteps.milestoneId, roadmapMilestones.id))
        .where(eq(roadmapMilestones.roadmapId, roadmapId));
      
      const totalSteps = stepsCount[0]?.count || 0;
      
      // Get first milestone and step
      const [firstMilestone] = await db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, roadmapId))
        .orderBy(roadmapMilestones.orderIndex)
        .limit(1);
      
      let firstStepId = null;
      if (firstMilestone) {
        const [firstStep] = await db
          .select()
          .from(roadmapSteps)
          .where(eq(roadmapSteps.milestoneId, firstMilestone.id))
          .orderBy(roadmapSteps.orderIndex)
          .limit(1);
        firstStepId = firstStep?.id;
      }
      
      // Create enrollment
      const [enrollment] = await db.insert(userRoadmapEnrollments).values({
        userId,
        roadmapId,
        totalSteps,
        currentMilestoneId: firstMilestone?.id,
        currentStepId: firstStepId,
        targetCompletionDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000) // 90 days from now
      }).returning();
      
      res.status(201).json(enrollment);
    } catch (error) {
      console.error('Error enrolling in roadmap:', error);
      res.status(500).json({ message: "Failed to enroll in roadmap" });
    }
  });
  
  // Get user's enrolled roadmaps
  app.get("/api/student/my-roadmaps", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const enrollments = await db
        .select({
          enrollment: userRoadmapEnrollments,
          roadmap: learningRoadmaps
        })
        .from(userRoadmapEnrollments)
        .innerJoin(learningRoadmaps, eq(userRoadmapEnrollments.roadmapId, learningRoadmaps.id))
        .where(eq(userRoadmapEnrollments.userId, req.user.id))
        .orderBy(desc(userRoadmapEnrollments.lastActivityAt));
      
      res.json(enrollments);
    } catch (error) {
      console.error('Error fetching user roadmaps:', error);
      res.status(500).json({ message: "Failed to fetch user roadmaps" });
    }
  });
  
  // Get roadmap progress for user
  app.get("/api/student/roadmaps/:id/progress", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const roadmapId = parseInt(req.params.id);
      const userId = req.user.id;
      
      // Get enrollment
      const [enrollment] = await db
        .select()
        .from(userRoadmapEnrollments)
        .where(
          and(
            eq(userRoadmapEnrollments.userId, userId),
            eq(userRoadmapEnrollments.roadmapId, roadmapId)
          )
        );
      
      if (!enrollment) {
        return res.status(404).json({ message: "Not enrolled in this roadmap" });
      }
      
      // Get completed steps
      const completedSteps = await db
        .select()
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.enrollmentId, enrollment.id),
            eq(userRoadmapProgress.status, 'completed')
          )
        );
      
      res.json({
        enrollment,
        completedSteps: completedSteps.length,
        totalSteps: enrollment.totalSteps,
        progressPercentage: enrollment.progressPercentage,
        currentMilestoneId: enrollment.currentMilestoneId,
        currentStepId: enrollment.currentStepId
      });
    } catch (error) {
      console.error('Error fetching roadmap progress:', error);
      res.status(500).json({ message: "Failed to fetch roadmap progress" });
    }
  });
  
  // Complete a roadmap step
  app.post("/api/student/steps/:id/complete", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const stepId = parseInt(req.params.id);
      const userId = req.user.id;
      const { score, timeSpentMinutes, notes } = req.body;
      
      // Find the enrollment for this step
      const stepWithEnrollment = await db
        .select({
          step: roadmapSteps,
          milestone: roadmapMilestones,
          enrollment: userRoadmapEnrollments
        })
        .from(roadmapSteps)
        .innerJoin(roadmapMilestones, eq(roadmapSteps.milestoneId, roadmapMilestones.id))
        .innerJoin(userRoadmapEnrollments, 
          and(
            eq(userRoadmapEnrollments.roadmapId, roadmapMilestones.roadmapId),
            eq(userRoadmapEnrollments.userId, userId)
          )
        )
        .where(eq(roadmapSteps.id, stepId));
      
      if (!stepWithEnrollment[0]) {
        return res.status(404).json({ message: "Step not found or not enrolled" });
      }
      
      const { enrollment, step } = stepWithEnrollment[0];
      
      // Check if already completed
      const existing = await db
        .select()
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.enrollmentId, enrollment.id),
            eq(userRoadmapProgress.stepId, stepId)
          )
        );
      
      if (existing[0]?.status === 'completed') {
        return res.status(400).json({ message: "Step already completed" });
      }
      
      // Update or create progress
      if (existing[0]) {
        await db
          .update(userRoadmapProgress)
          .set({
            status: 'completed',
            completedAt: new Date(),
            score: score?.toString(),
            timeSpentMinutes,
            notes
          })
          .where(eq(userRoadmapProgress.id, existing[0].id));
      } else {
        await db.insert(userRoadmapProgress).values({
          enrollmentId: enrollment.id,
          stepId,
          status: 'completed',
          startedAt: new Date(),
          completedAt: new Date(),
          score: score?.toString(),
          timeSpentMinutes,
          notes
        });
      }
      
      // Update enrollment progress
      const completedCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(userRoadmapProgress)
        .where(
          and(
            eq(userRoadmapProgress.enrollmentId, enrollment.id),
            eq(userRoadmapProgress.status, 'completed')
          )
        );
      
      const completedSteps = completedCount[0]?.count || 0;
      const progressPercentage = (completedSteps / enrollment.totalSteps) * 100;
      
      // Find next step
      const nextStep = await db
        .select()
        .from(roadmapSteps)
        .where(
          and(
            eq(roadmapSteps.milestoneId, step.milestoneId),
            sql`${roadmapSteps.orderIndex} > ${step.orderIndex}`
          )
        )
        .orderBy(roadmapSteps.orderIndex)
        .limit(1);
      
      await db
        .update(userRoadmapEnrollments)
        .set({
          completedSteps,
          progressPercentage: progressPercentage.toString(),
          currentStepId: nextStep[0]?.id || enrollment.currentStepId,
          lastActivityAt: new Date(),
          updatedAt: new Date()
        })
        .where(eq(userRoadmapEnrollments.id, enrollment.id));
      
      // Record activity
      const { activityTracker } = await import('./activity-tracker');
      await activityTracker.recordActivity(
        userId,
        'roadmap_step',
        null,
        timeSpentMinutes || 30,
        { stepId, score, roadmapId: enrollment.roadmapId }
      );
      
      res.json({ message: "Step completed successfully", progressPercentage });
    } catch (error) {
      console.error('Error completing step:', error);
      res.status(500).json({ message: "Failed to complete step" });
    }
  });
  
  // Get recommended roadmaps for user
  app.get("/api/student/recommended-roadmaps", authenticateToken, requireRole(['Student']), async (req: any, res) => {
    try {
      const user = await import('./storage').then(s => s.default.getUserById(req.user.id));
      const userLevel = user?.level || 'A1';
      
      // Get roadmaps matching user level
      const roadmaps = await db
        .select()
        .from(learningRoadmaps)
        .where(
          and(
            eq(learningRoadmaps.isActive, true),
            eq(learningRoadmaps.targetLevel, userLevel)
          )
        )
        .limit(5);
      
      res.json(roadmaps);
    } catch (error) {
      console.error('Error fetching recommended roadmaps:', error);
      res.status(500).json({ message: "Failed to fetch recommended roadmaps" });
    }
  });
}