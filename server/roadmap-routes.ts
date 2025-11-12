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
      
      // Get first milestone
      const [firstMilestone] = await db
        .select()
        .from(roadmapMilestones)
        .where(eq(roadmapMilestones.roadmapId, roadmapId))
        .orderBy(roadmapMilestones.orderIndex)
        .limit(1);
      
      // Create enrollment (only using columns that exist in database)
      const [enrollment] = await db.insert(userRoadmapEnrollments).values({
        userId,
        roadmapId,
        status: 'active',
        currentMilestoneId: firstMilestone?.id || null,
        progressPercentage: 0,
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
        progressPercentage: enrollment.progressPercentage,
        currentMilestoneId: enrollment.currentMilestoneId
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
            assessmentScore: score || null,
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
          assessmentScore: score || null,
          timeSpentMinutes: timeSpentMinutes || 0,
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
      
      // Count total steps for this roadmap
      const totalStepsCount = await db
        .select({ count: sql<number>`COUNT(*)` })
        .from(roadmapSteps)
        .innerJoin(roadmapMilestones, eq(roadmapSteps.milestoneId, roadmapMilestones.id))
        .where(eq(roadmapMilestones.roadmapId, enrollment.roadmapId));
      
      const totalSteps = totalStepsCount[0]?.count || 1;
      const progressPercentage = Math.round((completedSteps / totalSteps) * 100);
      
      await db
        .update(userRoadmapEnrollments)
        .set({
          progressPercentage: progressPercentage
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
      const { storage } = await import('./storage');
      const user = await storage.getUser(req.user.id);
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
  
  // ===== GUEST PLACEMENT TEST ROADMAP GENERATION =====
  
  // Generate personalized roadmap from placement test results (no auth required)
  app.post("/api/roadmaps/generate-from-placement", async (req: any, res) => {
    try {
      const { testResults, contactInfo } = req.body;
      
      if (!testResults || !testResults.overallLevel) {
        return res.status(400).json({ message: "Invalid test results" });
      }
      
      // Use AI to generate personalized roadmap based on test results
      const { OllamaService } = await import('./ollama-service');
      const ollamaService = new OllamaService();
      
      const currentLevel = testResults.overallLevel; // e.g., "A2", "B1", "C1"
      
      // Helper function to get numeric CEFR level for comparison
      const levelOrder = { 'A1': 1, 'A2': 2, 'B1': 3, 'B2': 4, 'C1': 5, 'C2': 6 };
      const getCurrentLevelOrder = (level: string) => levelOrder[level as keyof typeof levelOrder] || 0;
      
      const weakSkills = Object.entries(testResults.skillLevels)
        .filter(([_, level]) => getCurrentLevelOrder(level as string) < getCurrentLevelOrder(currentLevel))
        .map(([skill, level]) => `${skill} (${level})`)
        .join(', ');
      
      const strongSkills = testResults.strengths?.join(', ') || 'None identified';
      
      // Generate AI roadmap using Ollama with fallback
      const prompt = `Generate a personalized 3-month English learning roadmap for a student with:
- Current CEFR Level: ${currentLevel}
- Weak Skills: ${weakSkills || 'Balanced across all skills'}
- Strong Skills: ${strongSkills}
- Test Scores: Speaking ${testResults.scores.speaking}%, Listening ${testResults.scores.listening}%, Reading ${testResults.scores.reading}%, Writing ${testResults.scores.writing}%

Create a JSON roadmap with:
1. title: "Personalized Learning Path - ${currentLevel} to [next level]"
2. description: Brief personalized description
3. estimatedWeeks: 12
4. milestones: Array of 4 milestones (one per skill focus area), each with:
   - title
   - description
   - orderIndex (1-4)
   - estimatedWeeks
   - steps: Array of 4-5 actionable steps, each with:
     - title
     - description
     - estimatedHours
     - orderIndex
     - resourceType (lesson/practice/video/quiz)

Focus on addressing weak areas while maintaining strengths. Return ONLY valid JSON, no markdown.`;

      let aiResponse;
      try {
        aiResponse = await ollamaService.generateCompletion(prompt);
      } catch (aiError) {
        console.warn('Ollama unavailable, using fallback roadmap generation');
        // Fallback: Generate structured roadmap without AI
        aiResponse = JSON.stringify(generateFallbackRoadmap(currentLevel, testResults));
      }
      
      // Parse AI response
      let roadmapData;
      try {
        const jsonMatch = aiResponse.match(/\{[\s\S]*\}/);
        roadmapData = jsonMatch ? JSON.parse(jsonMatch[0]) : JSON.parse(aiResponse);
      } catch (parseError) {
        console.warn('Failed to parse AI roadmap, using fallback');
        roadmapData = generateFallbackRoadmap(currentLevel, testResults);
      }
      
      // Create roadmap in database (as guest roadmap with auto-expiry after 30 days)
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);
      
      const [roadmap] = await db.insert(learningRoadmaps).values({
        title: roadmapData.title || `${contactInfo?.name || 'Guest'}'s Personalized Learning Path`,
        description: roadmapData.description || `Customized roadmap based on ${currentLevel} placement test results`,
        targetLevel: getNextLevel(currentLevel),
        estimatedWeeks: roadmapData.estimatedWeeks || 12,
        difficulty: currentLevel,
        isActive: true,
        createdBy: null, // Guest roadmap
        tags: ['placement-test', 'ai-generated', 'guest', currentLevel, `expires:${expiresAt.toISOString()}`]
      }).returning();
      
      // Create milestones
      const milestonesWithSteps = [];
      for (const milestoneData of (roadmapData.milestones || [])) {
        const [milestone] = await db.insert(roadmapMilestones).values({
          roadmapId: roadmap.id,
          title: milestoneData.title,
          description: milestoneData.description,
          orderIndex: milestoneData.orderIndex,
          estimatedWeeks: milestoneData.estimatedWeeks || 3
        }).returning();
        
        // Create steps for this milestone
        const steps = [];
        for (const stepData of (milestoneData.steps || [])) {
          const [step] = await db.insert(roadmapSteps).values({
            milestoneId: milestone.id,
            title: stepData.title,
            description: stepData.description,
            orderIndex: stepData.orderIndex,
            resourceType: stepData.resourceType || 'lesson',
            estimatedHours: stepData.estimatedHours || 2,
            contentUrl: null,
            prerequisites: []
          }).returning();
          steps.push(step);
        }
        
        milestonesWithSteps.push({ ...milestone, steps });
      }
      
      // Validate roadmap has content
      if (!milestonesWithSteps || milestonesWithSteps.length === 0) {
        console.error('Generated roadmap has no milestones');
        return res.status(500).json({ 
          message: "Failed to generate roadmap content",
          success: false 
        });
      }
      
      res.json({
        success: true,
        roadmap: {
          ...roadmap,
          milestones: milestonesWithSteps
        }
      });
    } catch (error) {
      console.error('Error generating roadmap from placement test:', error);
      res.status(500).json({ 
        message: "Failed to generate personalized roadmap",
        success: false 
      });
    }
  });
  
  // Cleanup endpoint for expired guest roadmaps (called by scheduled task or admin)
  app.delete("/api/roadmaps/cleanup-guest", async (req: any, res) => {
    try {
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
      
      // Find guest roadmaps older than 30 days
      const expiredRoadmaps = await db
        .select()
        .from(learningRoadmaps)
        .where(
          and(
            eq(learningRoadmaps.createdBy, null),
            sql`${learningRoadmaps.tags} && ARRAY['guest', 'placement-test']::text[]`
          )
        );
      
      let deletedCount = 0;
      for (const roadmap of expiredRoadmaps) {
        // Check if roadmap has expired based on tags
        const expiryTag = roadmap.tags?.find((tag: string) => tag.startsWith('expires:'));
        if (expiryTag) {
          const expiryDate = new Date(expiryTag.split(':')[1]);
          if (expiryDate < new Date()) {
            // Delete milestones and steps first (cascade)
            const milestones = await db
              .select()
              .from(roadmapMilestones)
              .where(eq(roadmapMilestones.roadmapId, roadmap.id));
            
            for (const milestone of milestones) {
              await db.delete(roadmapSteps).where(eq(roadmapSteps.milestoneId, milestone.id));
            }
            
            await db.delete(roadmapMilestones).where(eq(roadmapMilestones.roadmapId, roadmap.id));
            await db.delete(learningRoadmaps).where(eq(learningRoadmaps.id, roadmap.id));
            deletedCount++;
          }
        }
      }
      
      res.json({ success: true, deletedCount, message: `Deleted ${deletedCount} expired guest roadmaps` });
    } catch (error) {
      console.error('Error cleaning up guest roadmaps:', error);
      res.status(500).json({ message: "Failed to cleanup guest roadmaps" });
    }
  });
}

// Helper function to determine next CEFR level
function getNextLevel(current: string): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const currentIndex = levels.indexOf(current);
  return currentIndex < levels.length - 1 ? levels[currentIndex + 1] : 'C2';
}

// Fallback roadmap generation without AI
function generateFallbackRoadmap(currentLevel: string, testResults: any) {
  const weakestSkill = Object.entries(testResults.skillLevels)
    .sort((a: any, b: any) => {
      const scoreA = testResults.scores[a[0]] || 0;
      const scoreB = testResults.scores[b[0]] || 0;
      return scoreA - scoreB;
    })[0][0];
  
  const nextLevel = getNextLevel(currentLevel);
  
  return {
    title: `Personalized Learning Path - ${currentLevel} to ${nextLevel}`,
    description: `A structured 12-week program to advance from ${currentLevel} to ${nextLevel}, with focus on ${weakestSkill}.`,
    estimatedWeeks: 12,
    milestones: [
      {
        title: 'Speaking Fundamentals',
        description: 'Build confidence in conversational English',
        orderIndex: 1,
        estimatedWeeks: 3,
        steps: [
          { title: 'Pronunciation Practice', description: 'Master essential phonemes and intonation', orderIndex: 1, resourceType: 'practice', estimatedHours: 4 },
          { title: 'Daily Conversation Topics', description: 'Practice common situations (shopping, directions, small talk)', orderIndex: 2, resourceType: 'lesson', estimatedHours: 5 },
          { title: 'Fluency Building Exercises', description: 'Reduce hesitation and increase speaking speed', orderIndex: 3, resourceType: 'practice', estimatedHours: 3 },
          { title: 'Role-Play Scenarios', description: 'Interactive speaking practice with feedback', orderIndex: 4, resourceType: 'practice', estimatedHours: 4 }
        ]
      },
      {
        title: 'Listening Comprehension',
        description: 'Enhance your ability to understand spoken English',
        orderIndex: 2,
        estimatedWeeks: 3,
        steps: [
          { title: 'Active Listening Techniques', description: 'Learn strategies for better comprehension', orderIndex: 1, resourceType: 'lesson', estimatedHours: 2 },
          { title: 'Podcast & News Listening', description: 'Practice with authentic materials', orderIndex: 2, resourceType: 'practice', estimatedHours: 6 },
          { title: 'Dictation Exercises', description: 'Improve listening accuracy through dictation', orderIndex: 3, resourceType: 'practice', estimatedHours: 4 },
          { title: 'Accent Recognition', description: 'Familiarize with different English accents', orderIndex: 4, resourceType: 'video', estimatedHours: 3 }
        ]
      },
      {
        title: 'Reading Skills Development',
        description: 'Improve reading speed and comprehension',
        orderIndex: 3,
        estimatedWeeks: 3,
        steps: [
          { title: 'Vocabulary Building', description: 'Learn high-frequency words and phrases', orderIndex: 1, resourceType: 'lesson', estimatedHours: 5 },
          { title: 'Skimming & Scanning', description: 'Master efficient reading techniques', orderIndex: 2, resourceType: 'lesson', estimatedHours: 3 },
          { title: 'Reading Practice Passages', description: 'Graded reading materials with comprehension questions', orderIndex: 3, resourceType: 'practice', estimatedHours: 6 },
          { title: 'Context Clue Strategies', description: 'Learn to understand unknown words from context', orderIndex: 4, resourceType: 'lesson', estimatedHours: 2 }
        ]
      },
      {
        title: 'Writing Mastery',
        description: 'Develop clear and effective writing skills',
        orderIndex: 4,
        estimatedWeeks: 3,
        steps: [
          { title: 'Sentence Structure', description: 'Master complex sentence patterns', orderIndex: 1, resourceType: 'lesson', estimatedHours: 4 },
          { title: 'Paragraph Organization', description: 'Learn to structure coherent paragraphs', orderIndex: 2, resourceType: 'lesson', estimatedHours: 3 },
          { title: 'Essay Writing Practice', description: 'Write and receive feedback on essays', orderIndex: 3, resourceType: 'practice', estimatedHours: 6 },
          { title: 'Grammar & Punctuation', description: 'Review essential grammar rules', orderIndex: 4, resourceType: 'quiz', estimatedHours: 4 }
        ]
      }
    ]
  };
}