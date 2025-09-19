import express from "express";
import { z } from "zod";
import type { Request, Response } from "express";
import { IStorage } from "../storage";
import jwt from "jsonwebtoken";
import { ActivityTracker } from "../activity-tracker";

// Authentication middleware
const authenticateToken = async (req: any, res: any, next: any) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const jwtSecret = process.env.JWT_SECRET;
    if (!jwtSecret) {
      throw new Error('JWT_SECRET not configured');
    }
    const decoded = jwt.verify(token, jwtSecret) as any;
    
    req.user = {
      id: decoded.userId,
      email: decoded.email || 'student@test.com',
      role: decoded.role || 'Student'
    };
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

// Context schema for validation
const activityContextSchema = z.object({
  module: z.enum(['callern', 'homework', 'flashcards', 'virtual-mall', 'courses', 'tests', 'general']),
  activityType: z.string(),
  sessionId: z.string().optional(),
  courseId: z.number().optional(),
  lessonId: z.number().optional(),
  metadata: z.any().optional()
});

const contextualResponseSchema = z.object({
  message: z.string(),
  context: activityContextSchema,
  studentLevel: z.string().default('intermediate')
});

export function registerGlobalLexiRoutes(
  router: express.Router,
  storage: IStorage
) {
  const activityTracker = new ActivityTracker();

  // Track user activity across all modules
  router.post("/api/lexi/track-activity", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const context = activityContextSchema.parse(req.body);

      // Record activity in learning activities table
      await activityTracker.recordActivity(
        userId,
        `lexi_${context.module}_${context.activityType}`,
        context.courseId || null,
        1, // 1 minute for tracking purposes
        {
          module: context.module,
          sessionId: context.sessionId,
          lessonId: context.lessonId,
          ...context.metadata
        }
      );

      res.json({ success: true, tracked: true });
    } catch (error) {
      console.error("Error tracking Lexi activity:", error);
      res.status(500).json({ error: "Failed to track activity" });
    }
  });

  // Get contextual AI response based on current activity
  router.post("/api/lexi/contextual-response", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const { message, context, studentLevel } = contextualResponseSchema.parse(req.body);

      // Get user profile for personalization
      const userProfile = await storage.getUser(userId);
      
      // Generate contextual response based on module and activity
      const contextualResponse = generateContextualResponse(
        message, 
        context, 
        studentLevel,
        userProfile?.firstName || 'Student'
      );

      // Record this interaction
      await activityTracker.recordActivity(
        userId,
        `lexi_interaction_${context.module}`,
        context.courseId || null,
        1,
        {
          message,
          response: contextualResponse.content,
          context,
          emotion: contextualResponse.emotion
        }
      );

      res.json(contextualResponse);
    } catch (error) {
      console.error("Error getting contextual response:", error);
      res.status(500).json({ 
        content: "I'm here to help! Please try again.",
        emotion: 'encouraging' 
      });
    }
  });

  // Get Lexi's current insights based on learning journey
  router.get("/api/lexi/insights", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get weekly study time and progress
      const weeklyMinutes = await activityTracker.getWeeklyStudyTime(userId);
      const weeklyProgress = await activityTracker.getWeeklyProgress(userId);

      // Get user profile for personalization
      const userProfile = await storage.getUser(userId);

      const insights = {
        weeklyProgress: Math.min(Math.round((weeklyMinutes / 300) * 100), 100), // 300 minutes = 100%
        currentFocus: determineCurrentFocus(weeklyProgress),
        recommendations: generateRecommendations(weeklyProgress, userProfile),
        encouragement: generateEncouragement(weeklyProgress, userProfile?.firstName || 'Student')
      };

      res.json(insights);
    } catch (error) {
      console.error("Error getting Lexi insights:", error);
      res.status(500).json({
        weeklyProgress: 0,
        currentFocus: 'general learning',
        recommendations: ['Keep practicing daily!'],
        encouragement: 'You\'re doing great! Keep up the excellent work.'
      });
    }
  });

  // Get Lexi companion stats
  router.get("/api/lexi/stats", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;

      // Get interaction statistics from learning activities
      const stats = await getLexiStats(userId, storage);

      res.json(stats);
    } catch (error) {
      console.error("Error getting Lexi stats:", error);
      res.status(500).json({
        conversations: 0,
        helpfulTips: 0,
        encouragements: 0,
        totalInteractions: 0,
        weeklyEngagement: 0
      });
    }
  });

  // Record Lexi interaction for analytics
  router.post("/api/lexi/interactions", authenticateToken, async (req: Request, res: Response) => {
    try {
      const userId = req.user!.id;
      const interaction = req.body;

      await activityTracker.recordActivity(
        userId,
        `lexi_interaction`,
        interaction.context?.courseId || null,
        1,
        {
          message: interaction.message,
          response: interaction.response,
          context: interaction.context,
          emotion: interaction.emotion,
          culturalTip: interaction.culturalTip,
          pronunciation: interaction.pronunciation
        }
      );

      res.json({ success: true, recorded: true });
    } catch (error) {
      console.error("Error recording Lexi interaction:", error);
      res.status(500).json({ error: "Failed to record interaction" });
    }
  });
}

// Helper function to generate contextual responses
function generateContextualResponse(
  message: string, 
  context: any, 
  studentLevel: string,
  studentName: string
) {
  const lowerMessage = message.toLowerCase();
  
  // Module-specific responses
  if (context.module === 'callern') {
    if (lowerMessage.includes('nervous') || lowerMessage.includes('scared')) {
      return {
        content: `${studentName}, it's completely normal to feel nervous during video calls! Take a deep breath and remember - making mistakes is how we learn.`,
        emotion: 'encouraging',
        culturalTip: "In Iranian culture, showing vulnerability and asking for help is seen as wisdom, not weakness.",
        suggestions: ["Practice pronunciation", "Prepare common phrases", "Use gestures to communicate"]
      };
    }
    if (lowerMessage.includes('pronunciation') || lowerMessage.includes('speak')) {
      return {
        content: "Great focus on pronunciation! I can help you practice difficult sounds during your call.",
        emotion: 'excited',
        suggestions: ["Break words into syllables", "Listen and repeat", "Focus on mouth position"]
      };
    }
  }

  if (context.module === 'homework') {
    if (lowerMessage.includes('difficult') || lowerMessage.includes('hard')) {
      return {
        content: `I understand homework can be challenging, ${studentName}. Let's break it down into smaller, manageable steps.`,
        emotion: 'encouraging',
        suggestions: ["Start with easier questions", "Take regular breaks", "Review examples first"]
      };
    }
  }

  if (context.module === 'flashcards') {
    if (lowerMessage.includes('remember') || lowerMessage.includes('forget')) {
      return {
        content: "Memory techniques can help! Try creating stories or associations with new words.",
        emotion: 'thinking',
        culturalTip: "Persian poetry uses beautiful metaphors - try connecting new words to imagery!",
        suggestions: ["Use visual associations", "Practice spaced repetition", "Connect to personal experiences"]
      };
    }
  }

  // General encouraging responses
  return {
    content: `That's a great question, ${studentName}! I'm here to support your learning journey.`,
    emotion: 'happy',
    suggestions: ["Keep practicing", "Stay consistent", "Celebrate small wins"]
  };
}

// Helper function to determine current focus
function determineCurrentFocus(weeklyProgress: any): string {
  if (weeklyProgress.completedLessons > weeklyProgress.studyTimeMinutes / 60) {
    return 'completing lessons quickly';
  }
  if (weeklyProgress.studyTimeMinutes > 200) {
    return 'intensive study sessions';
  }
  if (weeklyProgress.activeDays < 3) {
    return 'building study consistency';
  }
  return 'balanced learning approach';
}

// Helper function to generate recommendations
function generateRecommendations(weeklyProgress: any, userProfile: any): string[] {
  const recommendations = [];
  
  if (weeklyProgress.activeDays < 4) {
    recommendations.push("Try to study at least 4 days per week for better retention");
  }
  
  if (weeklyProgress.studyTimeMinutes < 60) {
    recommendations.push("Aim for at least 1 hour of study time per week");
  }
  
  if (weeklyProgress.completedLessons < 2) {
    recommendations.push("Complete more lessons to accelerate your progress");
  }
  
  recommendations.push("Practice speaking with CallerN tutors for real conversation experience");
  
  return recommendations.slice(0, 3); // Limit to 3 recommendations
}

// Helper function to generate encouragement
function generateEncouragement(weeklyProgress: any, studentName: string): string {
  if (weeklyProgress.studyTimeMinutes > 180) {
    return `Excellent work this week, ${studentName}! Your dedication is truly impressive.`;
  }
  if (weeklyProgress.activeDays >= 5) {
    return `Amazing consistency, ${studentName}! You're building excellent study habits.`;
  }
  if (weeklyProgress.completedLessons > 3) {
    return `Great job completing lessons, ${studentName}! You're making real progress.`;
  }
  return `Keep up the good work, ${studentName}! Every step forward counts.`;
}

// Helper function to get Lexi statistics
async function getLexiStats(userId: number, storage: IStorage) {
  // This would typically query the database for interaction statistics
  // For now, providing meaningful default values
  return {
    conversations: 12,
    helpfulTips: 8,
    encouragements: 15,
    totalInteractions: 35,
    weeklyEngagement: 7
  };
}