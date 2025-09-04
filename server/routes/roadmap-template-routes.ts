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

// Schema for roadmap template creation
const createRoadmapTemplateSchema = z.object({
  title: z.string().min(1).max(200),
  targetLanguage: z.string().min(2).max(10), // en, fa, ar, etc.
  targetLevel: z.string().min(2).max(20), // A1, A2, B1, B2, C1, C2
  audience: z.string().max(100).optional(), // adults, teens, business, ielts, etc.
  objectivesJson: z.any().optional(), // Learning objectives structure
  extraContextJson: z.any().optional() // Additional metadata
});

const createUnitSchema = z.object({
  orderIdx: z.number().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  estimatedHours: z.number().min(0).default(0)
});

const createLessonSchema = z.object({
  orderIdx: z.number().min(1),
  title: z.string().min(1).max(200),
  description: z.string().optional(),
  objectives: z.string().optional(),
  estimatedMinutes: z.number().min(5).default(30)
});

const createActivitySchema = z.object({
  orderIdx: z.number().min(1),
  type: z.enum(['quiz', 'matching', 'fill_in_blank', 'poll', 'vocab_game', 'dialogue_roleplay']),
  subtype: z.string().max(50).optional(),
  deliveryModesJson: z.any().optional(),
  estimatedMin: z.number().min(1).default(5),
  masteryJson: z.any().optional(),
  metaJson: z.any().optional(),
  title: z.string().min(1).max(200),
  description: z.string().optional()
});

// CREATE ROADMAP TEMPLATE
router.post('/roadmaps/templates', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateData = createRoadmapTemplateSchema.parse(req.body);
    
    const template = await storage.createRoadmapTemplate({
      ...templateData,
      createdBy: req.user.id,
      isActive: true
    });

    res.status(201).json({
      message: 'Roadmap template created successfully',
      template
    });
  } catch (error) {
    console.error('Error creating roadmap template:', error);
    res.status(500).json({ message: 'Failed to create roadmap template' });
  }
});

// GET ROADMAP TEMPLATE WITH FULL NESTING
router.get('/roadmaps/templates/:id', requireAuth, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    const templateWithContent = await storage.getRoadmapTemplateWithContent(templateId);
    
    if (!templateWithContent) {
      return res.status(404).json({ message: 'Roadmap template not found' });
    }

    res.json(templateWithContent);
  } catch (error) {
    console.error('Error fetching roadmap template:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap template' });
  }
});

// LIST ALL ROADMAP TEMPLATES
router.get('/roadmaps/templates', requireAuth, async (req, res) => {
  try {
    const { targetLanguage, targetLevel, audience } = req.query;
    
    const templates = await storage.getRoadmapTemplates({
      targetLanguage: targetLanguage as string,
      targetLevel: targetLevel as string,
      audience: audience as string
    });

    res.json(templates);
  } catch (error) {
    console.error('Error fetching roadmap templates:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap templates' });
  }
});

// CREATE UNIT IN TEMPLATE
router.post('/roadmaps/templates/:id/units', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const unitData = createUnitSchema.parse(req.body);

    // Verify template exists
    const template = await storage.getRoadmapTemplate(templateId);
    if (!template) {
      return res.status(404).json({ message: 'Roadmap template not found' });
    }

    const unit = await storage.createRoadmapUnit({
      templateId,
      ...unitData
    });

    res.status(201).json({
      message: 'Unit created successfully',
      unit
    });
  } catch (error) {
    console.error('Error creating unit:', error);
    res.status(500).json({ message: 'Failed to create unit' });
  }
});

// CREATE LESSON IN UNIT
router.post('/roadmaps/templates/:templateId/units/:unitId/lessons', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const unitId = parseInt(req.params.unitId);
    const lessonData = createLessonSchema.parse(req.body);

    // Verify unit exists and belongs to template
    const unit = await storage.getRoadmapUnit(unitId);
    if (!unit || unit.templateId !== templateId) {
      return res.status(404).json({ message: 'Unit not found' });
    }

    const lesson = await storage.createRoadmapLesson({
      unitId,
      ...lessonData
    });

    res.status(201).json({
      message: 'Lesson created successfully',
      lesson
    });
  } catch (error) {
    console.error('Error creating lesson:', error);
    res.status(500).json({ message: 'Failed to create lesson' });
  }
});

// CREATE ACTIVITY IN LESSON
router.post('/roadmaps/templates/:templateId/units/:unitId/lessons/:lessonId/activities', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.templateId);
    const unitId = parseInt(req.params.unitId);
    const lessonId = parseInt(req.params.lessonId);
    const activityData = createActivitySchema.parse(req.body);

    // Verify lesson exists and belongs to unit/template
    const lesson = await storage.getRoadmapLesson(lessonId);
    if (!lesson || lesson.unitId !== unitId) {
      return res.status(404).json({ message: 'Lesson not found' });
    }

    const activity = await storage.createRoadmapActivity({
      lessonId,
      ...activityData
    });

    res.status(201).json({
      message: 'Activity created successfully',
      activity
    });
  } catch (error) {
    console.error('Error creating activity:', error);
    res.status(500).json({ message: 'Failed to create activity' });
  }
});

// UPDATE ROADMAP TEMPLATE
router.put('/roadmaps/templates/:id', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    const updateData = createRoadmapTemplateSchema.partial().parse(req.body);

    const template = await storage.updateRoadmapTemplate(templateId, updateData);
    
    if (!template) {
      return res.status(404).json({ message: 'Roadmap template not found' });
    }

    res.json({
      message: 'Roadmap template updated successfully',
      template
    });
  } catch (error) {
    console.error('Error updating roadmap template:', error);
    res.status(500).json({ message: 'Failed to update roadmap template' });
  }
});

// DELETE ROADMAP TEMPLATE
router.delete('/roadmaps/templates/:id', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    // Check if template is in use by any instances
    const instances = await storage.getRoadmapInstancesByTemplate(templateId);
    if (instances.length > 0) {
      return res.status(409).json({ 
        message: 'Cannot delete template - it is being used by active roadmap instances',
        activeInstances: instances.length
      });
    }

    await storage.deleteRoadmapTemplate(templateId);

    res.json({ message: 'Roadmap template deleted successfully' });
  } catch (error) {
    console.error('Error deleting roadmap template:', error);
    res.status(500).json({ message: 'Failed to delete roadmap template' });
  }
});

// DUPLICATE ROADMAP TEMPLATE
router.post('/roadmaps/templates/:id/duplicate', requireAuth, isAdmin, async (req, res) => {
  try {
    const sourceTemplateId = parseInt(req.params.id);
    const { title } = z.object({ title: z.string().min(1) }).parse(req.body);

    const duplicatedTemplate = await storage.duplicateRoadmapTemplate(sourceTemplateId, title, req.user.id);

    res.status(201).json({
      message: 'Roadmap template duplicated successfully',
      template: duplicatedTemplate
    });
  } catch (error) {
    console.error('Error duplicating roadmap template:', error);
    res.status(500).json({ message: 'Failed to duplicate roadmap template' });
  }
});

// GET ROADMAP TEMPLATE STATISTICS
router.get('/roadmaps/templates/:id/stats', requireAuth, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);

    const stats = await storage.getRoadmapTemplateStats(templateId);

    res.json(stats);
  } catch (error) {
    console.error('Error fetching roadmap template stats:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap template stats' });
  }
});

export { router as roadmapTemplateRoutes };