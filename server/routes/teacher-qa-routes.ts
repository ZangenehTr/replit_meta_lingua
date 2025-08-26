/**
 * Teacher QA Routes
 * API endpoints for teacher quality assurance, performance evaluation, and peer reviews
 */

import { Router } from 'express';
import type { DatabaseStorage } from '../database-storage';
import { TeacherQAService } from '../services/teacher-qa-service';
import { OllamaService } from '../ollama-service';

export function createTeacherQARouter(storage: DatabaseStorage): Router {
  const router = Router();
  const ollamaService = new OllamaService();
  const qaService = new TeacherQAService(storage, ollamaService);

  // Middleware to check authentication
  const requireAuth = (req: any, res: any, next: any) => {
    if (!req.user && !req.headers.authorization) {
      return res.status(401).json({ error: 'Unauthorized' });
    }
    next();
  };

  // Middleware to check teacher role
  const requireTeacher = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'Teacher' && req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Only teachers and admins can access this resource' });
    }
    next();
  };

  // Middleware to check admin role
  const requireAdmin = (req: any, res: any, next: any) => {
    if (req.user?.role !== 'Admin') {
      return res.status(403).json({ error: 'Only admins can access this resource' });
    }
    next();
  };

  // =============== Performance Metrics ===============
  
  /**
   * Get performance metrics for a teacher
   * GET /api/teacher-qa/performance/:teacherId
   */
  router.get('/performance/:teacherId', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { startDate, endDate } = req.query;
      
      // Teachers can only view their own metrics unless they're admin
      if (req.user?.role === 'Teacher' && req.user?.id !== parseInt(teacherId)) {
        return res.status(403).json({ error: 'Teachers can only view their own performance metrics' });
      }

      const start = startDate ? new Date(startDate) : undefined;
      const end = endDate ? new Date(endDate) : undefined;

      const metrics = await qaService.calculatePerformanceMetrics(
        parseInt(teacherId),
        start,
        end
      );

      res.json({
        success: true,
        metrics,
        period: {
          start: start?.toISOString(),
          end: end?.toISOString()
        }
      });
    } catch (error: any) {
      console.error('Error getting performance metrics:', error);
      res.status(500).json({ 
        error: 'Failed to get performance metrics',
        message: error.message 
      });
    }
  });

  /**
   * Get current teacher's own performance metrics
   * GET /api/teacher-qa/my-performance
   */
  router.get('/my-performance', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const teacherId = req.user?.id || 1;
      const { period = 'monthly' } = req.query;
      
      const dateRange = getDateRange(period);
      const metrics = await qaService.calculatePerformanceMetrics(
        teacherId,
        dateRange.start,
        dateRange.end
      );

      res.json({
        success: true,
        metrics,
        period
      });
    } catch (error: any) {
      console.error('Error getting own performance metrics:', error);
      res.status(500).json({ 
        error: 'Failed to get performance metrics',
        message: error.message 
      });
    }
  });

  // =============== Peer Review ===============
  
  /**
   * Submit a peer review for a teacher's session
   * POST /api/teacher-qa/peer-review
   */
  router.post('/peer-review', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const reviewerId = req.user?.id || 1;
      const {
        teacherId,
        sessionId,
        overallRating,
        criteria,
        strengths,
        areasForImprovement,
        additionalComments
      } = req.body;

      // Validate input
      if (!teacherId || !sessionId || !overallRating) {
        return res.status(400).json({ 
          error: 'Missing required fields: teacherId, sessionId, overallRating' 
        });
      }

      // Teachers cannot review themselves
      if (reviewerId === teacherId) {
        return res.status(400).json({ 
          error: 'Teachers cannot review their own sessions' 
        });
      }

      const review = await qaService.submitPeerReview(
        reviewerId,
        teacherId,
        sessionId,
        {
          overallRating,
          criteria: criteria || {
            lessonStructure: 4,
            studentEngagement: 4,
            timeManagement: 4,
            contentDelivery: 4,
            feedbackQuality: 4,
            languageProficiency: 4
          },
          strengths: strengths || [],
          areasForImprovement: areasForImprovement || [],
          additionalComments: additionalComments || ''
        }
      );

      res.json({
        success: true,
        review,
        message: 'Peer review submitted successfully'
      });
    } catch (error: any) {
      console.error('Error submitting peer review:', error);
      res.status(500).json({ 
        error: 'Failed to submit peer review',
        message: error.message 
      });
    }
  });

  /**
   * Get peer reviews for a teacher
   * GET /api/teacher-qa/peer-reviews/:teacherId
   */
  router.get('/peer-reviews/:teacherId', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { limit = 10 } = req.query;
      
      // Teachers can only view their own reviews unless they're admin
      if (req.user?.role === 'Teacher' && req.user?.id !== parseInt(teacherId)) {
        return res.status(403).json({ 
          error: 'Teachers can only view their own peer reviews' 
        });
      }

      // For now, return mock data (in real implementation, would fetch from DB)
      const reviews = [];
      
      res.json({
        success: true,
        teacherId: parseInt(teacherId),
        reviews,
        totalReviews: reviews.length
      });
    } catch (error: any) {
      console.error('Error getting peer reviews:', error);
      res.status(500).json({ 
        error: 'Failed to get peer reviews',
        message: error.message 
      });
    }
  });

  // =============== Quality Scoring ===============
  
  /**
   * Calculate quality score for a teacher
   * GET /api/teacher-qa/quality-score/:teacherId
   */
  router.get('/quality-score/:teacherId', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { period = 'monthly' } = req.query;
      
      // Teachers can only view their own score unless they're admin
      if (req.user?.role === 'Teacher' && req.user?.id !== parseInt(teacherId)) {
        return res.status(403).json({ 
          error: 'Teachers can only view their own quality score' 
        });
      }

      const qualityScore = await qaService.calculateQualityScore(
        parseInt(teacherId),
        period as 'weekly' | 'monthly' | 'quarterly'
      );

      res.json({
        success: true,
        qualityScore
      });
    } catch (error: any) {
      console.error('Error calculating quality score:', error);
      res.status(500).json({ 
        error: 'Failed to calculate quality score',
        message: error.message 
      });
    }
  });

  /**
   * Get quality score leaderboard
   * GET /api/teacher-qa/quality-leaderboard
   */
  router.get('/quality-leaderboard', requireAuth, async (req: any, res) => {
    try {
      const { limit = 10, period = 'monthly' } = req.query;
      
      const topTeachers = await qaService.getTopTeachers(Number(limit));

      res.json({
        success: true,
        period,
        leaderboard: topTeachers.map((teacher, index) => ({
          rank: index + 1,
          teacherId: teacher.teacherId,
          teacherName: teacher.teacherName,
          overallScore: teacher.overallScore,
          totalSessions: teacher.totalSessions,
          averageRating: teacher.averageRating,
          strengths: teacher.strengths
        })),
        totalTeachers: topTeachers.length
      });
    } catch (error: any) {
      console.error('Error getting quality leaderboard:', error);
      res.status(500).json({ 
        error: 'Failed to get quality leaderboard',
        message: error.message 
      });
    }
  });

  // =============== Session Analysis ===============
  
  /**
   * Analyze a specific session for quality
   * POST /api/teacher-qa/analyze-session
   */
  router.post('/analyze-session', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const { sessionId } = req.body;
      
      if (!sessionId) {
        return res.status(400).json({ error: 'Session ID is required' });
      }

      const analysis = await qaService.analyzeSession(sessionId);

      res.json({
        success: true,
        analysis
      });
    } catch (error: any) {
      console.error('Error analyzing session:', error);
      res.status(500).json({ 
        error: 'Failed to analyze session',
        message: error.message 
      });
    }
  });

  /**
   * Get batch session analysis
   * POST /api/teacher-qa/batch-analyze
   */
  router.post('/batch-analyze', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { sessionIds } = req.body;
      
      if (!sessionIds || !Array.isArray(sessionIds)) {
        return res.status(400).json({ error: 'Session IDs array is required' });
      }

      const analyses = await Promise.all(
        sessionIds.map(id => qaService.analyzeSession(id).catch(err => ({
          sessionId: id,
          error: err.message
        })))
      );

      const successful = analyses.filter((a: any) => !a.error);
      const failed = analyses.filter((a: any) => a.error);

      res.json({
        success: true,
        totalAnalyzed: successful.length,
        totalFailed: failed.length,
        analyses: successful,
        errors: failed
      });
    } catch (error: any) {
      console.error('Error batch analyzing sessions:', error);
      res.status(500).json({ 
        error: 'Failed to batch analyze sessions',
        message: error.message 
      });
    }
  });

  // =============== Reports and Insights ===============
  
  /**
   * Generate comprehensive QA report for a teacher
   * GET /api/teacher-qa/report/:teacherId
   */
  router.get('/report/:teacherId', requireAuth, requireTeacher, async (req: any, res) => {
    try {
      const { teacherId } = req.params;
      const { period = 'monthly' } = req.query;
      
      // Teachers can only view their own report unless they're admin
      if (req.user?.role === 'Teacher' && req.user?.id !== parseInt(teacherId)) {
        return res.status(403).json({ 
          error: 'Teachers can only view their own reports' 
        });
      }

      const dateRange = getDateRange(period);
      
      // Get all metrics
      const performance = await qaService.calculatePerformanceMetrics(
        parseInt(teacherId),
        dateRange.start,
        dateRange.end
      );
      
      const qualityScore = await qaService.calculateQualityScore(
        parseInt(teacherId),
        period as 'weekly' | 'monthly' | 'quarterly'
      );

      res.json({
        success: true,
        report: {
          teacherId: parseInt(teacherId),
          teacherName: performance.teacherName,
          period,
          dateRange: {
            start: dateRange.start.toISOString(),
            end: dateRange.end.toISOString()
          },
          performance,
          qualityScore,
          summary: {
            overallPerformance: performance.overallScore,
            qualityRank: qualityScore.rank,
            percentile: qualityScore.percentile,
            trend: qualityScore.trend
          },
          recommendations: [
            ...qualityScore.recommendations,
            ...performance.improvements
          ]
        }
      });
    } catch (error: any) {
      console.error('Error generating QA report:', error);
      res.status(500).json({ 
        error: 'Failed to generate QA report',
        message: error.message 
      });
    }
  });

  /**
   * Get department-wide QA insights (Admin only)
   * GET /api/teacher-qa/insights
   */
  router.get('/insights', requireAuth, requireAdmin, async (req: any, res) => {
    try {
      const { period = 'monthly' } = req.query;
      const topTeachers = await qaService.getTopTeachers(100);
      
      // Calculate department averages
      const avgScore = topTeachers.reduce((sum, t) => sum + t.overallScore, 0) / Math.max(topTeachers.length, 1);
      const avgRating = topTeachers.reduce((sum, t) => sum + t.averageRating, 0) / Math.max(topTeachers.length, 1);
      const avgRetention = topTeachers.reduce((sum, t) => sum + t.studentRetention, 0) / Math.max(topTeachers.length, 1);
      
      // Identify top performers and those needing support
      const topPerformers = topTeachers.filter(t => t.overallScore > 85);
      const needSupport = topTeachers.filter(t => t.overallScore < 60);
      
      // Common strengths and improvements
      const allStrengths = topTeachers.flatMap(t => t.strengths);
      const allImprovements = topTeachers.flatMap(t => t.improvements);
      
      const strengthCounts = countOccurrences(allStrengths);
      const improvementCounts = countOccurrences(allImprovements);
      
      res.json({
        success: true,
        period,
        insights: {
          departmentMetrics: {
            totalTeachers: topTeachers.length,
            averageScore: Math.round(avgScore * 100) / 100,
            averageRating: Math.round(avgRating * 100) / 100,
            averageRetention: Math.round(avgRetention * 100),
            topPerformersCount: topPerformers.length,
            needSupportCount: needSupport.length
          },
          topPerformers: topPerformers.slice(0, 5).map(t => ({
            teacherId: t.teacherId,
            name: t.teacherName,
            score: t.overallScore
          })),
          needingSupport: needSupport.slice(0, 5).map(t => ({
            teacherId: t.teacherId,
            name: t.teacherName,
            score: t.overallScore,
            primaryIssues: t.improvements.slice(0, 2)
          })),
          commonStrengths: Object.entries(strengthCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([strength, count]) => ({ strength, count })),
          commonImprovements: Object.entries(improvementCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([improvement, count]) => ({ improvement, count })),
          recommendations: [
            'Schedule training sessions for common improvement areas',
            'Implement peer mentoring program pairing top performers with those needing support',
            'Recognize and reward top performing teachers',
            'Review curriculum and teaching resources for areas with low scores'
          ]
        }
      });
    } catch (error: any) {
      console.error('Error getting department insights:', error);
      res.status(500).json({ 
        error: 'Failed to get department insights',
        message: error.message 
      });
    }
  });

  return router;
}

// Helper function to get date range
function getDateRange(period: string) {
  const end = new Date();
  const start = new Date();

  switch (period) {
    case 'weekly':
      start.setDate(end.getDate() - 7);
      break;
    case 'monthly':
      start.setMonth(end.getMonth() - 1);
      break;
    case 'quarterly':
      start.setMonth(end.getMonth() - 3);
      break;
    case 'yearly':
      start.setFullYear(end.getFullYear() - 1);
      break;
    default:
      start.setMonth(end.getMonth() - 1);
  }

  return { start, end };
}

// Helper function to count occurrences
function countOccurrences(arr: string[]): Record<string, number> {
  return arr.reduce((acc, item) => {
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);
}