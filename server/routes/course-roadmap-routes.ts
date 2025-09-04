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

// Schema for roadmap assignment
const assignRoadmapSchema = z.object({
  courseId: z.number(),
  roadmapId: z.number()
});

// Schema for progress update
const progressUpdateSchema = z.object({
  courseId: z.number(),
  studentId: z.number(),
  stepId: z.number(),
  status: z.enum(['not_started', 'in_progress', 'completed', 'skipped']),
  progressPercentage: z.number().min(0).max(100).optional(),
  teacherNotes: z.string().optional(),
  studentSelfAssessment: z.string().optional(),
  aiEvaluationScore: z.number().min(0).max(100).optional(),
  homeworkAssigned: z.boolean().optional(),
  homeworkCompleted: z.boolean().optional(),
  homeworkScore: z.number().min(0).max(100).optional()
});

// =================== ADMIN ROUTES ===================

// Get all courses with their assigned roadmaps
router.get('/admin/courses-with-roadmaps', requireAuth, isAdmin, async (req, res) => {
  try {
    const courses = await storage.getCoursesWithRoadmaps();
    res.json(courses);
  } catch (error) {
    console.error('Error fetching courses with roadmaps:', error);
    res.status(500).json({ message: 'Failed to fetch courses with roadmaps' });
  }
});

// Get available roadmaps for course assignment
router.get('/admin/available-roadmaps', requireAuth, isAdmin, async (req, res) => {
  try {
    const roadmaps = await storage.getAvailableRoadmapsForCourse();
    res.json(roadmaps);
  } catch (error) {
    console.error('Error fetching available roadmaps:', error);
    res.status(500).json({ message: 'Failed to fetch available roadmaps' });
  }
});

// Assign roadmap to course
router.post('/admin/assign-roadmap', requireAuth, isAdmin, async (req, res) => {
  try {
    const { courseId, roadmapId } = assignRoadmapSchema.parse(req.body);
    const updatedCourse = await storage.assignRoadmapToCourse(courseId, roadmapId);
    
    res.json({
      message: 'Roadmap assigned successfully',
      course: updatedCourse
    });
  } catch (error: any) {
    console.error('Error assigning roadmap to course:', error);
    res.status(500).json({ 
      message: 'Failed to assign roadmap to course',
      error: error.message 
    });
  }
});

// Remove roadmap from course
router.delete('/admin/remove-roadmap/:courseId', requireAuth, isAdmin, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    if (isNaN(courseId)) {
      return res.status(400).json({ message: 'Invalid course ID' });
    }

    const updatedCourse = await storage.removeRoadmapFromCourse(courseId);
    
    res.json({
      message: 'Roadmap removed successfully',
      course: updatedCourse
    });
  } catch (error: any) {
    console.error('Error removing roadmap from course:', error);
    res.status(500).json({ 
      message: 'Failed to remove roadmap from course',
      error: error.message 
    });
  }
});

// =================== STUDENT/TEACHER ROUTES ===================

// Get student progress for a course
router.get('/course/:courseId/progress/:studentId', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    
    if (isNaN(courseId) || isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid course ID or student ID' });
    }

    // Check authorization - students can only see their own progress, teachers/admins can see any
    if (req.user.role === 'Student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const progress = await storage.getCourseRoadmapProgress(courseId, studentId);
    const summary = await storage.getCourseProgressSummary(courseId, studentId);
    
    res.json({
      progress,
      summary
    });
  } catch (error) {
    console.error('Error fetching course progress:', error);
    res.status(500).json({ message: 'Failed to fetch course progress' });
  }
});

// Update student progress for a roadmap step
router.put('/course/progress', requireAuth, async (req, res) => {
  try {
    const progressData = progressUpdateSchema.parse(req.body);
    
    // Check authorization - students can only update their own progress
    if (req.user.role === 'Student' && req.user.id !== progressData.studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Get course and roadmap details for the progress entry
    const course = await storage.getCourse(progressData.courseId);
    if (!course || !course.callernRoadmapId) {
      return res.status(404).json({ message: 'Course or roadmap not found' });
    }

    const updatedProgress = await storage.updateCourseRoadmapProgress({
      courseId: progressData.courseId,
      studentId: progressData.studentId,
      roadmapId: course.callernRoadmapId,
      stepId: progressData.stepId,
      status: progressData.status,
      progressPercentage: progressData.progressPercentage,
      teacherNotes: progressData.teacherNotes,
      studentSelfAssessment: progressData.studentSelfAssessment,
      aiEvaluationScore: progressData.aiEvaluationScore,
      homeworkAssigned: progressData.homeworkAssigned,
      homeworkCompleted: progressData.homeworkCompleted,
      homeworkScore: progressData.homeworkScore,
      teacherId: req.user.role === 'Teacher' ? req.user.id : undefined,
      updatedAt: new Date()
    });

    res.json({
      message: 'Progress updated successfully',
      progress: updatedProgress
    });
  } catch (error: any) {
    console.error('Error updating course progress:', error);
    res.status(500).json({ 
      message: 'Failed to update course progress',
      error: error.message 
    });
  }
});

// Get course progress summary (for charts)
router.get('/course/:courseId/summary/:studentId', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const studentId = parseInt(req.params.studentId);
    
    if (isNaN(courseId) || isNaN(studentId)) {
      return res.status(400).json({ message: 'Invalid course ID or student ID' });
    }

    // Check authorization
    if (req.user.role === 'Student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const summary = await storage.getCourseProgressSummary(courseId, studentId);
    res.json(summary);
  } catch (error) {
    console.error('Error fetching course progress summary:', error);
    res.status(500).json({ message: 'Failed to fetch course progress summary' });
  }
});

// =================== AI HOMEWORK ROUTES ===================

// Generate AI homework for a step
router.post('/course/:courseId/step/:stepId/generate-homework', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const stepId = parseInt(req.params.stepId);
    const { studentId } = req.body;
    
    if (isNaN(courseId) || isNaN(stepId) || !studentId) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    // Only teachers and admins can generate homework
    if (req.user.role !== 'Teacher' && req.user.role !== 'Admin') {
      return res.status(403).json({ message: 'Only teachers can generate homework' });
    }

    const homework = await storage.generateAIHomework(courseId, studentId, stepId);
    
    res.json({
      message: 'Homework generated successfully',
      homework
    });
  } catch (error: any) {
    console.error('Error generating AI homework:', error);
    res.status(500).json({ 
      message: 'Failed to generate AI homework',
      error: error.message 
    });
  }
});

// Submit and evaluate homework
router.post('/course/:courseId/step/:stepId/submit-homework', requireAuth, async (req, res) => {
  try {
    const courseId = parseInt(req.params.courseId);
    const stepId = parseInt(req.params.stepId);
    const { studentId, homework } = req.body;
    
    if (isNaN(courseId) || isNaN(stepId) || !studentId || !homework) {
      return res.status(400).json({ message: 'Invalid parameters' });
    }

    // Students can only submit their own homework
    if (req.user.role === 'Student' && req.user.id !== studentId) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const evaluation = await storage.evaluateHomeworkWithAI(courseId, studentId, stepId, homework);
    
    res.json({
      message: 'Homework submitted and evaluated successfully',
      evaluation
    });
  } catch (error: any) {
    console.error('Error submitting homework:', error);
    res.status(500).json({ 
      message: 'Failed to submit homework',
      error: error.message 
    });
  }
});

export default router;