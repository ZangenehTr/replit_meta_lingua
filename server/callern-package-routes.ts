import { Express } from "express";
import { authenticateToken } from "./auth-middleware";
import { storage } from "./storage";
import { db } from "../db";
import { callernRoadmaps, callernRoadmapSteps } from "../shared/schema";
import { eq } from "drizzle-orm";

export function setupCallernPackageRoutes(app: Express, requireRole: any) {

  // Get all Callern packages
  app.get("/api/callern/packages", authenticateToken, async (req: any, res) => {
    try {
      const packages = await storage.getCallernPackages();
      
      // For each package, get its roadmap and steps
      const packagesWithRoadmaps = await Promise.all(packages.map(async (pkg) => {
        const roadmaps = await db.select()
          .from(callernRoadmaps)
          .where(eq(callernRoadmaps.packageId, pkg.id));
        
        if (roadmaps.length > 0) {
          const roadmap = roadmaps[0];
          const steps = await storage.getRoadmapSteps(roadmap.id);
          return {
            ...pkg,
            roadmap: {
              ...roadmap,
              steps
            }
          };
        }
        
        return pkg;
      }));
      
      res.json(packagesWithRoadmaps);
    } catch (error) {
      console.error("Error fetching Callern packages:", error);
      res.status(500).json({ error: "Failed to fetch packages" });
    }
  });

  // Create a new Callern package with roadmap
  app.post("/api/callern/packages", authenticateToken, requireRole(['Admin']), async (req: any, res) => {
    try {
      const { 
        packageName, 
        totalHours, 
        price, 
        description, 
        packageType, 
        targetLevel,
        maxStudents,
        availableFrom,
        availableTo,
        roadmap 
      } = req.body;

      // Create the package
      const newPackage = await storage.createCallernPackage({
        packageName,
        totalHours,
        price,
        description,
        packageType,
        targetLevel,
        isActive: true
      });

      // Create the roadmap if provided
      if (roadmap && roadmap.roadmapName) {
        const newRoadmap = await storage.db.insert(storage.db.callernRoadmaps).values({
          packageId: newPackage.id,
          roadmapName: roadmap.roadmapName,
          description: roadmap.description,
          totalSteps: roadmap.steps.length,
          estimatedHours: roadmap.estimatedHours,
          createdBy: req.user.id,
          isActive: true
        }).returning();

        // Create the roadmap steps
        if (roadmap.steps && roadmap.steps.length > 0) {
          for (const step of roadmap.steps) {
            await storage.createRoadmapStep({
              roadmapId: newRoadmap[0].id,
              stepNumber: step.stepNumber,
              title: step.title,
              description: step.description,
              objectives: step.objectives,
              estimatedMinutes: step.estimatedMinutes,
              skillFocus: step.skillFocus,
              materials: {
                ...step.materials,
                aiTeacherGuidance: step.aiTeacherGuidance
              },
              assessmentCriteria: step.assessmentCriteria
            });
          }
        }

        res.json({
          ...newPackage,
          roadmap: {
            ...newRoadmap[0],
            steps: roadmap.steps
          }
        });
      } else {
        res.json(newPackage);
      }
    } catch (error) {
      console.error("Error creating Callern package:", error);
      res.status(500).json({ error: "Failed to create package" });
    }
  });

  // Get roadmap steps for a specific roadmap
  app.get("/api/callern/roadmaps/:roadmapId/steps", authenticateToken, async (req: any, res) => {
    try {
      const steps = await storage.getRoadmapSteps(parseInt(req.params.roadmapId));
      res.json(steps);
    } catch (error) {
      console.error("Error fetching roadmap steps:", error);
      res.status(500).json({ error: "Failed to fetch steps" });
    }
  });

  // Get student's current progress in a roadmap
  app.get("/api/callern/student/:studentId/roadmap/:roadmapId/progress", authenticateToken, async (req: any, res) => {
    try {
      const { studentId, roadmapId } = req.params;
      
      const progress = await storage.db.select()
        .from(storage.db.studentRoadmapProgress)
        .where(storage.db.and(
          storage.db.eq(storage.db.studentRoadmapProgress.studentId, parseInt(studentId)),
          storage.db.eq(storage.db.studentRoadmapProgress.roadmapId, parseInt(roadmapId))
        ))
        .orderBy(storage.db.studentRoadmapProgress.stepId);
      
      res.json(progress);
    } catch (error) {
      console.error("Error fetching student progress:", error);
      res.status(500).json({ error: "Failed to fetch progress" });
    }
  });

  // Update student progress for a step
  app.post("/api/callern/progress", authenticateToken, async (req: any, res) => {
    try {
      const {
        studentId,
        packageId,
        roadmapId,
        stepId,
        teacherId,
        callId,
        status,
        teacherNotes,
        studentFeedback,
        performanceRating
      } = req.body;

      const [progress] = await storage.db.insert(storage.db.studentRoadmapProgress).values({
        studentId,
        packageId,
        roadmapId,
        stepId,
        teacherId: teacherId || req.user.id,
        callId,
        status,
        teacherNotes,
        studentFeedback,
        performanceRating,
        completedAt: status === 'completed' ? new Date() : null
      }).returning();

      res.json(progress);
    } catch (error) {
      console.error("Error updating progress:", error);
      res.status(500).json({ error: "Failed to update progress" });
    }
  });

  // Get teacher briefing for a student's next step
  app.get("/api/callern/teacher-briefing/:studentId/:packageId", authenticateToken, async (req: any, res) => {
    try {
      const { studentId, packageId } = req.params;

      // Get the student's package and roadmap
      const studentPackage = await storage.db.select()
        .from(storage.db.studentCallernPackages)
        .where(storage.db.eq(storage.db.studentCallernPackages.id, parseInt(packageId)))
        .limit(1);

      if (!studentPackage || studentPackage.length === 0) {
        return res.status(404).json({ error: "Package not found" });
      }

      // Get the roadmap for this package
      const roadmap = await storage.db.select()
        .from(storage.db.callernRoadmaps)
        .where(storage.db.eq(storage.db.callernRoadmaps.packageId, studentPackage[0].packageId))
        .limit(1);

      if (!roadmap || roadmap.length === 0) {
        return res.status(404).json({ error: "Roadmap not found" });
      }

      // Get all steps in the roadmap
      const allSteps = await storage.getRoadmapSteps(roadmap[0].id);

      // Get student's completed steps
      const completedSteps = await storage.db.select()
        .from(storage.db.studentRoadmapProgress)
        .where(storage.db.and(
          storage.db.eq(storage.db.studentRoadmapProgress.studentId, parseInt(studentId)),
          storage.db.eq(storage.db.studentRoadmapProgress.roadmapId, roadmap[0].id),
          storage.db.eq(storage.db.studentRoadmapProgress.status, 'completed')
        ));

      // Find the next step
      const completedStepIds = completedSteps.map(s => s.stepId);
      const nextStep = allSteps.find(step => !completedStepIds.includes(step.id));

      // Get previous teacher notes for context
      const previousNotes = completedSteps
        .sort((a, b) => b.completedAt - a.completedAt)
        .slice(0, 3)
        .map(step => ({
          stepId: step.stepId,
          teacherNotes: step.teacherNotes,
          performanceRating: step.performanceRating,
          completedAt: step.completedAt
        }));

      // Get student profile for additional context
      const studentProfile = await storage.db.select()
        .from(storage.db.userProfiles)
        .where(storage.db.eq(storage.db.userProfiles.userId, parseInt(studentId)))
        .limit(1);

      const briefing = {
        student: {
          id: studentId,
          profile: studentProfile[0] || {},
          completedSteps: completedSteps.length,
          totalSteps: allSteps.length,
          progressPercentage: Math.round((completedSteps.length / allSteps.length) * 100)
        },
        currentStep: nextStep || allSteps[allSteps.length - 1], // If all completed, show last step
        previousTeacherNotes,
        roadmap: {
          name: roadmap[0].roadmapName,
          description: roadmap[0].description
        },
        teachingGuidance: nextStep?.materials?.aiTeacherGuidance || {
          keyPoints: [],
          suggestedQuestions: [],
          commonMistakes: [],
          studentHesitationHelp: []
        }
      };

      res.json(briefing);
    } catch (error) {
      console.error("Error getting teacher briefing:", error);
      res.status(500).json({ error: "Failed to get briefing" });
    }
  });
}