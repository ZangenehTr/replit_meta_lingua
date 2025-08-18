import { Router } from 'express';
import { storage } from './storage';
import { authenticateToken } from './auth-middleware';

const router = Router();

// Update TTT metrics during a call
router.post('/api/callern/ttt/update', authenticateToken, async (req, res) => {
  try {
    const { callId, metrics, alerts, minuteByMinuteData } = req.body;

    // For now, just return success since we don't have TTT monitoring table yet
    // This will be implemented when the database schema is updated
    console.log('TTT metrics update received:', { callId, metrics });
    
    res.json({ success: true });
  } catch (error) {
    console.error('Failed to update TTT metrics:', error);
    res.status(500).json({ error: 'Failed to update TTT metrics' });
  }
});

// Get TTT metrics for a specific call
router.get('/api/callern/ttt/:callId', authenticateToken, async (req, res) => {
  try {
    const { callId } = req.params;
    
    // Return default metrics for now
    res.json({
      teacherSpeakingTime: 0,
      studentSpeakingTime: 0,
      silenceTime: 0,
      teacherTalkPercentage: 0,
      studentTalkPercentage: 0,
      teacherExceededThreshold: false,
      studentBelowThreshold: false,
      teacherAlertCount: 0,
      studentAlertCount: 0,
      minuteByMinuteData: []
    });
  } catch (error) {
    console.error('Failed to get TTT metrics:', error);
    res.status(500).json({ error: 'Failed to get TTT metrics' });
  }
});

// Get TTT statistics for all calls
router.get('/api/callern/ttt/stats', authenticateToken, async (req, res) => {
  try {
    // Return default stats for now
    res.json({
      averageTeacherTalkPercentage: 35,
      averageStudentTalkPercentage: 65,
      totalCallsExceedingThreshold: 0,
      totalCallsBelowThreshold: 0,
      totalAlerts: 0
    });
  } catch (error) {
    console.error('Failed to get TTT statistics:', error);
    res.status(500).json({ error: 'Failed to get TTT statistics' });
  }
});

// Get TTT report for a teacher
router.get('/api/callern/ttt/teacher/:teacherId', authenticateToken, async (req, res) => {
  try {
    const { teacherId } = req.params;
    
    // Return empty report for now
    res.json({
      teacherId: parseInt(teacherId),
      averageTalkPercentage: 35,
      totalCalls: 0,
      alerts: []
    });
  } catch (error) {
    console.error('Failed to get teacher TTT report:', error);
    res.status(500).json({ error: 'Failed to get teacher TTT report' });
  }
});

// Get TTT report for a student
router.get('/api/callern/ttt/student/:studentId', authenticateToken, async (req, res) => {
  try {
    const { studentId } = req.params;
    
    // Return empty report for now
    res.json({
      studentId: parseInt(studentId),
      averageTalkPercentage: 65,
      totalCalls: 0,
      alerts: []
    });
  } catch (error) {
    console.error('Failed to get student TTT report:', error);
    res.status(500).json({ error: 'Failed to get student TTT report' });
  }
});

export default router;