import { Router, Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user: {
    id: number;
    email: string;
    role: string;
    [key: string]: any;
  };
}
import { z } from 'zod';
import { storage } from '../storage';
import { roadmapStorage } from '../services/roadmap-storage';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || "meta-lingua-secret-key";

// Auth middleware
const requireAuth = async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
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

const router = Router();

// Schema for roadmap instance creation
const createRoadmapInstanceSchema = z.object({
  templateId: z.number(),
  courseId: z.number().optional(), // Optional for individual student roadmaps
  studentId: z.number().optional(), // Optional for course-wide roadmaps
  startDate: z.string().datetime(),
  hoursPerWeek: z.number().min(1).max(40).default(4),
  adaptivePacing: z.boolean().default(true)
});

const paceAdjustmentSchema = z.object({
  adjustmentDays: z.number(), // Positive to delay, negative to advance
  reason: z.string().optional()
});

// CREATE ROADMAP INSTANCE
router.post('/roadmaps/instances', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceData = createRoadmapInstanceSchema.parse(req.body);
    const userRole = req.user.role;

    // Validate permissions
    if (!['Admin', 'Teacher', 'Mentor'].includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Verify template exists
    const template = await roadmapStorage.getRoadmapTemplate(instanceData.templateId);
    if (!template) {
      return res.status(404).json({ message: 'Roadmap template not found' });
    }

    // Verify course/student existence if provided
    if (instanceData.courseId) {
      const course = await storage.getCourse(instanceData.courseId);
      if (!course) {
        return res.status(404).json({ message: 'Course not found' });
      }
    }

    if (instanceData.studentId) {
      const student = await storage.getUser(instanceData.studentId);
      if (!student || student.role !== 'Student') {
        return res.status(404).json({ message: 'Student not found' });
      }
    }

    // Create instance first, then initialize activity instances
    const instance = await roadmapStorage.createRoadmapInstance(instanceData);
    await roadmapStorage.initializeActivityInstances(instance.id);

    res.status(201).json({
      message: 'Roadmap instance created successfully',
      instance
    });
  } catch (error) {
    console.error('Error creating roadmap instance:', error);
    res.status(500).json({ message: 'Failed to create roadmap instance' });
  }
});

// GET ROADMAP INSTANCE WITH FULL NESTING AND PROGRESS
router.get('/roadmaps/instances/:id', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const instanceWithProgress = await storage.getRoadmapInstanceWithProgress(instanceId);
    
    if (!instanceWithProgress) {
      return res.status(404).json({ message: 'Roadmap instance not found' });
    }

    // Check permissions - users can only see their own instances unless they're staff
    if (!['Admin', 'Teacher', 'Mentor', 'Supervisor'].includes(userRole)) {
      if (instanceWithProgress.studentId !== userId) {
        return res.status(403).json({ message: 'Access denied' });
      }
    }

    // Calculate readiness and mastery metrics server-side
    const enrichedInstance = await storage.enrichInstanceWithMetrics(instanceWithProgress);

    res.json(enrichedInstance);
  } catch (error) {
    console.error('Error fetching roadmap instance:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap instance' });
  }
});

// LIST ROADMAP INSTANCES
router.get('/roadmaps/instances', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { courseId, studentId, templateId, status } = req.query;
    const userRole = req.user.role;
    const userId = req.user.id;

    // Apply permission filters
    let filters: any = {};
    
    if (courseId) filters.courseId = parseInt(courseId as string);
    if (templateId) filters.templateId = parseInt(templateId as string);
    if (status) filters.status = status as string;

    // Non-admin users can only see their own instances
    if (!['Admin', 'Teacher', 'Mentor', 'Supervisor'].includes(userRole)) {
      filters.studentId = userId;
    } else if (studentId) {
      filters.studentId = parseInt(studentId as string);
    }

    const instances = await storage.getRoadmapInstances(filters);

    res.json(instances);
  } catch (error) {
    console.error('Error fetching roadmap instances:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap instances' });
  }
});

// ADJUST ROADMAP PACING (BULK SHIFT DATES)
router.patch('/roadmaps/instances/:id/pace', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const { adjustmentDays, reason } = paceAdjustmentSchema.parse(req.body);
    const userRole = req.user.role;

    // Check permissions
    if (!['Admin', 'Teacher', 'Mentor'].includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    // Verify instance exists
    const instance = await storage.getRoadmapInstance(instanceId);
    if (!instance) {
      return res.status(404).json({ message: 'Roadmap instance not found' });
    }

    // Perform bulk date adjustment
    const result = await storage.adjustRoadmapPacing(instanceId, adjustmentDays, reason, req.user.id);

    res.json({
      message: 'Roadmap pacing adjusted successfully',
      adjustmentDays,
      affectedActivities: result.affectedActivities,
      newEndDate: result.newEndDate
    });
  } catch (error) {
    console.error('Error adjusting roadmap pacing:', error);
    res.status(500).json({ message: 'Failed to adjust roadmap pacing' });
  }
});

// UPDATE ROADMAP INSTANCE STATUS
router.patch('/roadmaps/instances/:id/status', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const { status } = z.object({ 
      status: z.enum(['active', 'paused', 'completed', 'cancelled']) 
    }).parse(req.body);
    const userRole = req.user.role;

    // Check permissions
    if (!['Admin', 'Teacher', 'Mentor'].includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const instance = await storage.updateRoadmapInstanceStatus(instanceId, status);
    
    if (!instance) {
      return res.status(404).json({ message: 'Roadmap instance not found' });
    }

    res.json({
      message: 'Roadmap instance status updated successfully',
      instance
    });
  } catch (error) {
    console.error('Error updating roadmap instance status:', error);
    res.status(500).json({ message: 'Failed to update roadmap instance status' });
  }
});

// GET STUDENT'S CURRENT ROADMAP POSITION
router.get('/roadmaps/instances/:id/position', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const userId = req.user.id;
    const userRole = req.user.role;

    const instance = await storage.getRoadmapInstance(instanceId);
    if (!instance) {
      return res.status(404).json({ message: 'Roadmap instance not found' });
    }

    // Check permissions
    if (!['Admin', 'Teacher', 'Mentor'].includes(userRole) && instance.studentId !== userId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const position = await storage.getRoadmapPosition(instanceId);

    res.json(position);
  } catch (error) {
    console.error('Error fetching roadmap position:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap position' });
  }
});

// GET ROADMAP INSTANCE ANALYTICS
router.get('/roadmaps/instances/:id/analytics', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const userRole = req.user.role;

    // Check permissions
    if (!['Admin', 'Teacher', 'Mentor', 'Supervisor'].includes(userRole)) {
      return res.status(403).json({ message: 'Insufficient permissions' });
    }

    const analytics = await storage.getRoadmapInstanceAnalytics(instanceId);

    res.json(analytics);
  } catch (error) {
    console.error('Error fetching roadmap instance analytics:', error);
    res.status(500).json({ message: 'Failed to fetch roadmap instance analytics' });
  }
});

// RESET ROADMAP INSTANCE PROGRESS
router.post('/roadmaps/instances/:id/reset', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const instanceId = parseInt(req.params.id);
    const userRole = req.user.role;
    const { keepCompletedActivities } = z.object({
      keepCompletedActivities: z.boolean().default(false)
    }).parse(req.body);

    // Only admins can reset roadmaps
    if (userRole !== 'Admin') {
      return res.status(403).json({ message: 'Admin access required' });
    }

    const result = await storage.resetRoadmapInstance(instanceId, keepCompletedActivities);

    res.json({
      message: 'Roadmap instance reset successfully',
      resetActivities: result.resetActivities
    });
  } catch (error) {
    console.error('Error resetting roadmap instance:', error);
    res.status(500).json({ message: 'Failed to reset roadmap instance' });
  }
});

export { router as roadmapInstanceRoutes };