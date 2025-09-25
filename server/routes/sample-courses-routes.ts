import { Router, Request, Response, NextFunction } from 'express';
import { storage } from '../storage';
import { courseCreator } from '../services/course-creator';
import { authenticate, authorize, type AuthenticatedRequest } from '../auth';

// Use centralized authentication middleware
const requireAuth = authenticate;

const isAdmin = (req: any, res: Response, next: NextFunction) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({ message: 'Admin access required' });
  }
  next();
};

const router = Router();

// CREATE BUSINESS ENGLISH A2 COURSE
router.post('/sample-courses/business-english-a2', requireAuth, isAdmin, async (req, res) => {
  try {
    console.log('Creating Business English A2 sample course...');
    
    const template = await courseCreator.createBusinessEnglishA2Course();
    
    res.status(201).json({
      message: 'Business English A2 course created successfully',
      template,
      stats: {
        units: 5, // First 5 units created
        totalEstimatedHours: 24,
        targetAudience: 'Business professionals',
        level: 'A2'
      }
    });
  } catch (error) {
    console.error('Error creating Business English A2 course:', error);
    res.status(500).json({ 
      message: 'Failed to create Business English A2 course',
      error: error.message 
    });
  }
});

// CREATE IELTS SPEAKING B2 COURSE
router.post('/sample-courses/ielts-speaking-b2', requireAuth, isAdmin, async (req, res) => {
  try {
    console.log('Creating IELTS Speaking B2 sample course...');
    
    const template = await courseCreator.createIELTSSpeakingB2Course();
    
    res.status(201).json({
      message: 'IELTS Speaking B2 course created successfully',
      template,
      stats: {
        units: 5, // First 5 units created
        totalEstimatedHours: 26,
        targetAudience: 'IELTS test takers',
        level: 'B2',
        targetBand: '6.5-7.0'
      }
    });
  } catch (error) {
    console.error('Error creating IELTS Speaking B2 course:', error);
    res.status(500).json({ 
      message: 'Failed to create IELTS Speaking B2 course',
      error: error.message 
    });
  }
});

// CREATE BOTH SAMPLE COURSES (TEST ENDPOINT - NO AUTH)
router.post('/sample-courses/create-all-test', async (req, res) => {
  try {
    console.log('Creating both sample courses...');
    
    const courses = await courseCreator.createBothSampleCourses();
    
    res.status(201).json({
      message: 'Both sample courses created successfully',
      courses,
      stats: {
        businessEnglish: {
          units: 5,
          estimatedHours: 24,
          level: 'A2'
        },
        ieltsSpeaking: {
          units: 5,
          estimatedHours: 26,
          level: 'B2'
        },
        totalTemplates: 2
      }
    });
  } catch (error) {
    console.error('Error creating sample courses:', error);
    res.status(500).json({ 
      message: 'Failed to create sample courses',
      error: error.message 
    });
  }
});

// GET SAMPLE COURSE TEMPLATES
router.get('/sample-courses/templates', requireAuth, async (req, res) => {
  try {
    const templates = await storage.getRoadmapTemplates({
      audience: req.query.audience as string
    });
    
    const sampleCourses = templates.filter(t => 
      t.audience === 'business' || t.audience === 'ielts'
    );
    
    res.json({
      templates: sampleCourses,
      count: sampleCourses.length
    });
  } catch (error) {
    console.error('Error fetching sample course templates:', error);
    res.status(500).json({ message: 'Failed to fetch sample course templates' });
  }
});

// GET SAMPLE COURSE DETAILS WITH FULL CONTENT
router.get('/sample-courses/templates/:id', requireAuth, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    const templateWithContent = await storage.getRoadmapTemplateWithContent(templateId);
    
    if (!templateWithContent) {
      return res.status(404).json({ message: 'Sample course template not found' });
    }

    // Add sample course statistics
    const stats = {
      totalUnits: templateWithContent.units?.length || 0,
      totalLessons: templateWithContent.units?.reduce((sum, unit) => sum + (unit.lessons?.length || 0), 0) || 0,
      totalActivities: templateWithContent.units?.reduce((sum, unit) => 
        sum + (unit.lessons?.reduce((lessonSum, lesson) => lessonSum + (lesson.activities?.length || 0), 0) || 0), 0) || 0,
      estimatedHours: templateWithContent.units?.reduce((sum, unit) => sum + (unit.estimatedHours || 0), 0) || 0
    };

    res.json({
      template: templateWithContent,
      stats
    });
  } catch (error) {
    console.error('Error fetching sample course details:', error);
    res.status(500).json({ message: 'Failed to fetch sample course details' });
  }
});

// DELETE SAMPLE COURSE (FOR TESTING)
router.delete('/sample-courses/templates/:id', requireAuth, isAdmin, async (req, res) => {
  try {
    const templateId = parseInt(req.params.id);
    
    // Check if template is a sample course
    const template = await storage.getRoadmapTemplate(templateId);
    if (!template || (template.audience !== 'business' && template.audience !== 'ielts')) {
      return res.status(404).json({ message: 'Sample course template not found' });
    }
    
    await storage.deleteRoadmapTemplate(templateId);
    
    res.json({ 
      message: 'Sample course template deleted successfully',
      deletedTemplate: template.title
    });
  } catch (error) {
    console.error('Error deleting sample course template:', error);
    res.status(500).json({ message: 'Failed to delete sample course template' });
  }
});

export { router as sampleCoursesRoutes };