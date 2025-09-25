import { Express } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs/promises';
import { storage } from './storage';
import jwt from 'jsonwebtoken';

// Create recordings directory if it doesn't exist
const RECORDINGS_DIR = path.join(process.cwd(), 'recordings');
fs.mkdir(RECORDINGS_DIR, { recursive: true }).catch(console.error);

// Configure multer for local file storage
const upload = multer({
  storage: multer.diskStorage({
    destination: async (req, file, cb) => {
      const yearMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
      const dir = path.join(RECORDINGS_DIR, yearMonth);
      await fs.mkdir(dir, { recursive: true });
      cb(null, dir);
    },
    filename: (req, file, cb) => {
      const timestamp = Date.now();
      const roomId = req.body.roomId || 'unknown';
      const extension = file.mimetype.includes('video') ? 'webm' : 'bin';
      const filename = `recording-${roomId}-${timestamp}.${extension}`;
      cb(null, filename);
    }
  }),
  limits: { 
    fileSize: 500 * 1024 * 1024 // 500MB max file size
  }
});

// Use the centralized authentication middleware
import { authenticate, type AuthenticatedRequest } from './auth';

export function setupCallernRecordingRoutes(app: Express) {
  // Upload and save recording route
  app.post('/api/callern/upload-recording', authenticate, upload.single('recording'), async (req: AuthenticatedRequest, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ error: 'No recording file provided' });
      }

      const { roomId, duration, studentId, teacherId } = req.body;
      const yearMonth = new Date().toISOString().substring(0, 7);
      const recordingPath = `/recordings/${yearMonth}/${req.file.filename}`;

      // Update call history with recording URL
      const callHistory = await storage.getCallernCallHistory();
      const latestCall = callHistory
        .filter((call: any) => 
          call.studentId === parseInt(studentId) && 
          (!teacherId || call.teacherId === parseInt(teacherId))
        )
        .sort((a: any, b: any) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0))[0];

      if (latestCall) {
        await storage.updateCallernCallHistory(latestCall.id, {
          recordingUrl: recordingPath,
          durationMinutes: Math.ceil(parseInt(duration) / 60),
          endTime: new Date(),
          status: 'completed'
        });
      } else {
        // Create new call history entry if not found
        await storage.createCallernCallHistory({
          studentId: parseInt(studentId),
          teacherId: parseInt(teacherId) || 1,
          packageId: 1, // Will be updated with actual package
          startTime: new Date(Date.now() - parseInt(duration) * 1000),
          endTime: new Date(),
          durationMinutes: Math.ceil(parseInt(duration) / 60),
          status: 'completed',
          recordingUrl: recordingPath
        });
      }

      res.json({ 
        success: true, 
        recordingPath,
        message: 'Recording saved successfully' 
      });
    } catch (error) {
      console.error('Error saving recording:', error);
      res.status(500).json({ error: 'Failed to save recording' });
    }
  });

  // Get call history for a user
  app.get('/api/callern/call-history', authenticate, async (req, res) => {
    try {
      const userId = (req as any).user?.id;
      const userRole = (req as any).user?.role || 'Student';
      
      let history = await storage.getCallernCallHistory();
      
      // Filter based on user role
      if (userRole === 'Student') {
        history = history.filter((call: any) => call.studentId === userId);
      } else if (userRole === 'Teacher') {
        history = history.filter((call: any) => call.teacherId === userId);
      }
      
      // Sort by date (newest first)
      history.sort((a: any, b: any) => (b.startTime?.getTime() || 0) - (a.startTime?.getTime() || 0));
      
      res.json(history);
    } catch (error) {
      console.error('Error fetching call history:', error);
      res.status(500).json({ error: 'Failed to fetch call history' });
    }
  });

  // Serve recordings (authenticated)
  app.get('/recordings/:year/:filename', authenticate, async (req, res) => {
    try {
      const filePath = path.join(RECORDINGS_DIR, req.params.year, req.params.filename);
      
      // Check if file exists
      await fs.access(filePath);
      
      // Send the file
      res.sendFile(filePath);
    } catch (error) {
      res.status(404).json({ error: 'Recording not found' });
    }
  });
}