import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { storage } from '../storage';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "meta-lingua-secret-key";

// Auth middleware
const requireAuth = async (req: any, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ message: 'Access token required' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    const user = await storage.getUser(decoded.userId);
    if (!user) {
      return res.status(401).json({ message: 'User not found' });
    }
    req.user = user;
    next();
  } catch (error) {
    console.error('Token verification error:', error);
    return res.status(403).json({ message: 'Invalid token' });
  }
};

const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const router = Router();

// Schema for roadmap step
const roadmapStepSchema = z.object({
  id: z.string().optional(),
  title: z.string().min(1),
  description: z.string(),
  objectives: z.array(z.string()),
  teacherAITips: z.string(),
  estimatedMinutes: z.number().min(5).max(180),
  skillFocus: z.array(z.string()),
  contentType: z.string(),
  cefrLevel: z.string(),
  materials: z.object({
    links: z.array(z.string()).default([]),
    documents: z.array(z.string()).default([]),
    exercises: z.array(z.any()).default([])
  }).optional(),
  assessmentCriteria: z.string()
});

// Schema for creating/updating roadmap
const roadmapSchema = z.object({
  packageId: z.number(),
  roadmapName: z.string().min(1),
  description: z.string(),
  totalSteps: z.number(),
  estimatedHours: z.number(),
  steps: z.array(roadmapStepSchema)
});

// Get all roadmaps
router.get('/callern/roadmaps', requireAuth, async (req, res) => {
  try {
    const roadmaps = await storage.getCallernRoadmaps();
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching roadmaps:', error);
    res.status(500).json({ error: 'Failed to fetch roadmaps' });
  }
});

// Get roadmap by ID with steps
router.get('/callern/roadmaps/:id', requireAuth, async (req, res) => {
  try {
    const roadmapId = parseInt(req.params.id);
    const roadmap = await storage.getCallernRoadmap(roadmapId);
    
    if (!roadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Get steps for this roadmap
    const steps = await storage.getRoadmapSteps(roadmapId);
    
    res.json({
      ...roadmap,
      steps: steps || []
    });
  } catch (error) {
    console.error('Error fetching roadmap:', error);
    res.status(500).json({ error: 'Failed to fetch roadmap' });
  }
});

// Create new roadmap
router.post('/callern/roadmaps', requireAuth, isAdmin, async (req, res) => {
  try {
    const validatedData = roadmapSchema.parse(req.body);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Create the roadmap
    const roadmap = await storage.createCallernRoadmap({
      packageId: validatedData.packageId,
      roadmapName: validatedData.roadmapName,
      description: validatedData.description,
      totalSteps: validatedData.totalSteps,
      estimatedHours: validatedData.estimatedHours,
      createdBy: userId,
      isActive: true
    });

    // Create steps for the roadmap
    for (let i = 0; i < validatedData.steps.length; i++) {
      const step = validatedData.steps[i];
      await storage.createCallernRoadmapStep({
        roadmapId: roadmap.id,
        stepNumber: i + 1,
        title: step.title,
        description: step.description,
        objectives: step.objectives.join('\n'),
        teacherAITips: step.teacherAITips,
        estimatedMinutes: step.estimatedMinutes,
        skillFocus: step.skillFocus.join(','),
        materials: step.materials || { links: [], documents: [], exercises: [] },
        assessmentCriteria: step.assessmentCriteria
      });
    }

    res.status(201).json({ 
      message: 'Roadmap created successfully', 
      roadmapId: roadmap.id 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid roadmap data', 
        details: error.errors 
      });
    }
    console.error('Error creating roadmap:', error);
    res.status(500).json({ error: 'Failed to create roadmap' });
  }
});

// Update existing roadmap
router.put('/callern/roadmaps/:id', requireAuth, isAdmin, async (req, res) => {
  try {
    const roadmapId = parseInt(req.params.id);
    const validatedData = roadmapSchema.parse(req.body);
    
    // Check if roadmap exists
    const existingRoadmap = await storage.getCallernRoadmap(roadmapId);
    if (!existingRoadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Update the roadmap
    await storage.updateCallernRoadmap(roadmapId, {
      packageId: validatedData.packageId,
      roadmapName: validatedData.roadmapName,
      description: validatedData.description,
      totalSteps: validatedData.totalSteps,
      estimatedHours: validatedData.estimatedHours
    });

    // Delete existing steps
    await storage.deleteRoadmapSteps(roadmapId);

    // Create new steps
    for (let i = 0; i < validatedData.steps.length; i++) {
      const step = validatedData.steps[i];
      await storage.createCallernRoadmapStep({
        roadmapId: roadmapId,
        stepNumber: i + 1,
        title: step.title,
        description: step.description,
        objectives: step.objectives.join('\n'),
        teacherAITips: step.teacherAITips,
        estimatedMinutes: step.estimatedMinutes,
        skillFocus: step.skillFocus.join(','),
        materials: step.materials || { links: [], documents: [], exercises: [] },
        assessmentCriteria: step.assessmentCriteria
      });
    }

    res.json({ 
      message: 'Roadmap updated successfully', 
      roadmapId: roadmapId 
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ 
        error: 'Invalid roadmap data', 
        details: error.errors 
      });
    }
    console.error('Error updating roadmap:', error);
    res.status(500).json({ error: 'Failed to update roadmap' });
  }
});

// Delete roadmap
router.delete('/callern/roadmaps/:id', requireAuth, isAdmin, async (req, res) => {
  try {
    const roadmapId = parseInt(req.params.id);
    
    // Check if roadmap exists
    const existingRoadmap = await storage.getCallernRoadmap(roadmapId);
    if (!existingRoadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Delete roadmap (steps will be cascade deleted)
    await storage.deleteCallernRoadmap(roadmapId);

    res.json({ message: 'Roadmap deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap:', error);
    res.status(500).json({ error: 'Failed to delete roadmap' });
  }
});

// Get roadmap step by ID
router.get('/callern/roadmap-steps/:id', requireAuth, async (req, res) => {
  try {
    const stepId = parseInt(req.params.id);
    const step = await storage.getRoadmapStep(stepId);
    
    if (!step) {
      return res.status(404).json({ error: 'Step not found' });
    }

    res.json(step);
  } catch (error) {
    console.error('Error fetching step:', error);
    res.status(500).json({ error: 'Failed to fetch step' });
  }
});

// Get all packages for dropdown
router.get('/callern/packages', requireAuth, async (req, res) => {
  try {
    const packages = await storage.getCallernPackages();
    res.json(packages);
  } catch (error) {
    console.error('Error fetching packages:', error);
    res.status(500).json({ error: 'Failed to fetch packages' });
  }
});

// Duplicate a roadmap
router.post('/callern/roadmaps/:id/duplicate', requireAuth, isAdmin, async (req, res) => {
  try {
    const roadmapId = parseInt(req.params.id);
    const userId = req.user?.id;
    
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    // Get existing roadmap
    const existingRoadmap = await storage.getCallernRoadmap(roadmapId);
    if (!existingRoadmap) {
      return res.status(404).json({ error: 'Roadmap not found' });
    }

    // Get existing steps
    const existingSteps = await storage.getRoadmapSteps(roadmapId);

    // Create new roadmap with "(Copy)" suffix
    const newRoadmap = await storage.createCallernRoadmap({
      packageId: existingRoadmap.packageId,
      roadmapName: `${existingRoadmap.roadmapName} (Copy)`,
      description: existingRoadmap.description,
      totalSteps: existingRoadmap.totalSteps,
      estimatedHours: existingRoadmap.estimatedHours,
      createdBy: userId,
      isActive: true
    });

    // Duplicate steps
    for (const step of existingSteps) {
      await storage.createCallernRoadmapStep({
        roadmapId: newRoadmap.id,
        stepNumber: step.stepNumber,
        title: step.title,
        description: step.description,
        objectives: step.objectives,
        teacherAITips: step.teacherAITips,
        estimatedMinutes: step.estimatedMinutes,
        skillFocus: step.skillFocus,
        materials: step.materials,
        assessmentCriteria: step.assessmentCriteria
      });
    }

    res.status(201).json({ 
      message: 'Roadmap duplicated successfully', 
      roadmapId: newRoadmap.id 
    });
  } catch (error) {
    console.error('Error duplicating roadmap:', error);
    res.status(500).json({ error: 'Failed to duplicate roadmap' });
  }
});

// Get roadmap templates (pre-made roadmaps)
router.get('/callern/roadmap-templates', async (req, res) => {
  try {
    // Return some pre-made templates for different CEFR levels
    const templates = [
      {
        id: 'template-a1',
        name: 'A1 Beginner English Foundation',
        description: 'Complete foundation for absolute beginners',
        cefrLevel: 'A1',
        estimatedWeeks: 12,
        steps: 24
      },
      {
        id: 'template-b1',
        name: 'B1 Conversational Fluency',
        description: 'Achieve conversational fluency in everyday situations',
        cefrLevel: 'B1',
        estimatedWeeks: 16,
        steps: 32
      },
      {
        id: 'template-c1',
        name: 'C1 Professional Mastery',
        description: 'Master professional and academic language',
        cefrLevel: 'C1',
        estimatedWeeks: 24,
        steps: 48
      }
    ];
    res.json(templates);
  } catch (error) {
    console.error('Error fetching templates:', error);
    res.status(500).json({ error: 'Failed to fetch templates' });
  }
});

export default router;