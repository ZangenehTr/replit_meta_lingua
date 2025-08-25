import { Server, Socket } from 'socket.io';
import { CallernAIMonitor } from './callern-ai-monitor';
import { storage } from './storage';

// Track online teachers
const onlineTeachers = new Map<number, { socketId: string; status: 'available' | 'busy' }>();
const teacherSockets = new Map<string, number>();
const studentSockets = new Map<string, number>();
const activeCalls = new Map<string, { studentId: number; teacherId: number; roomId: string }>();

// Track speech data for real metrics
const speechMetrics = new Map<string, {
  studentSpeechTime: number;
  teacherSpeechTime: number;
  lastStudentSpeech: number;
  lastTeacherSpeech: number;
  studentVolume: number[];
  teacherVolume: number[];
  sessionStart: number;
}>();

export function setupCallernWebSocketHandlers(io: Server) {
  const aiMonitor = new CallernAIMonitor(io);

  io.on('connection', (socket: Socket) => {
    console.log('New Callern socket connection:', socket.id);

    // Handle authentication
    socket.on('authenticate', async (data: { userId: number; role: string }) => {
      const { userId, role } = data;
      
      if (role === 'teacher' || role === 'Teacher') {
        teacherSockets.set(socket.id, userId);
        console.log(`Teacher ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { success: true, role: 'teacher' });
      } else if (role === 'student' || role === 'Student') {
        studentSockets.set(socket.id, userId);
        console.log(`Student ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { success: true, role: 'student' });
      }
    });

    // Handle teacher going online
    socket.on('teacher-online', async (data: { teacherId: number }) => {
      const { teacherId } = data;
      
      // Update teacher status in database
      try {
        await storage.updateTeacherCallernAvailability(teacherId, true);
        
        // Track online teacher
        onlineTeachers.set(teacherId, { socketId: socket.id, status: 'available' });
        teacherSockets.set(socket.id, teacherId);
        
        console.log(`Teacher ${teacherId} is now online for Callern`);
        
        // Notify all clients about teacher status change
        io.emit('teacher-status-update', {
          teacherId,
          status: 'online',
          socketId: socket.id
        });
        
        socket.emit('teacher-online-success', { teacherId, status: 'online' });
      } catch (error) {
        console.error('Error updating teacher status:', error);
        socket.emit('error', { message: 'Failed to update teacher status' });
      }
    });

    // Handle teacher going offline
    socket.on('teacher-offline', async (data: { teacherId: number }) => {
      const { teacherId } = data;
      
      try {
        await storage.updateTeacherCallernAvailability(teacherId, false);
        
        // Remove from online teachers
        onlineTeachers.delete(teacherId);
        
        console.log(`Teacher ${teacherId} is now offline for Callern`);
        
        // Notify all clients
        io.emit('teacher-status-update', {
          teacherId,
          status: 'offline'
        });
        
        socket.emit('teacher-offline-success', { teacherId, status: 'offline' });
      } catch (error) {
        console.error('Error updating teacher status:', error);
      }
    });

    // Handle call request from student
    socket.on('request-call', async (data: { 
      studentId: number; 
      teacherId: number; 
      packageId: number;
      language: string;
    }) => {
      const { studentId, teacherId, packageId, language } = data;
      
      // Check if teacher is available
      const teacherInfo = onlineTeachers.get(teacherId);
      if (!teacherInfo || teacherInfo.status !== 'available') {
        socket.emit('call-rejected', { reason: 'Teacher is not available' });
        return;
      }

      // Get student info for briefing
      const student = await storage.getUser(studentId);
      const studentProfiles = await storage.getStudentProfiles();
      const studentProfile = studentProfiles.find(p => p.userId === studentId);
      const courses = await storage.getCourses();
      
      // Create briefing data
      const briefingData = {
        id: studentId,
        name: `${student.firstName} ${student.lastName}`,
        level: studentProfile?.currentLevel || 'A1',
        course: courses[0]?.title || 'General English',
        language: language,
        previousSessions: 0, // Will track properly when sessions are saved
        averageScore: 75, // Default score
        strengths: ['Vocabulary', 'Listening'], // Default strengths
        weaknesses: ['Grammar', 'Pronunciation'], // Default weaknesses
        learningGoals: ['Improve fluency', 'Business English'], // Default goals
        preferredTopics: Array.isArray(studentProfile?.interests) 
          ? studentProfile.interests 
          : ['Travel', 'Technology'],
        mood: 'neutral', // Default mood
        lastSessionNotes: null
      };

      // Send briefing to teacher
      io.to(teacherInfo.socketId).emit('incoming-call', {
        studentId,
        studentName: briefingData.name,
        packageId,
        language,
        briefing: briefingData
      });

      // Mark teacher as busy
      onlineTeachers.set(teacherId, { ...teacherInfo, status: 'busy' });
      
      // Store active call info
      const roomId = `callern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      activeCalls.set(roomId, { studentId, teacherId, roomId });
      
      // Initialize speech metrics for this room
      speechMetrics.set(roomId, {
        studentSpeechTime: 0,
        teacherSpeechTime: 0,
        lastStudentSpeech: Date.now(),
        lastTeacherSpeech: Date.now(),
        studentVolume: [],
        teacherVolume: [],
        sessionStart: Date.now()
      });
      
      socket.emit('call-requesting', { teacherId, roomId });
    });

    // Handle teacher accepting call
    socket.on('accept-call', async (data: { studentId: number; roomId: string }) => {
      const { studentId, roomId } = data;
      const teacherId = teacherSockets.get(socket.id);
      
      if (!teacherId) {
        socket.emit('error', { message: 'Teacher not authenticated' });
        return;
      }

      // Find student socket
      let studentSocketId: string | null = null;
      for (const [socketId, id] of studentSockets.entries()) {
        if (id === studentId) {
          studentSocketId = socketId;
          break;
        }
      }

      if (!studentSocketId) {
        socket.emit('error', { message: 'Student not connected' });
        return;
      }

      // Initialize AI monitoring for this call
      aiMonitor.initializeCall(roomId, teacherId, studentId);

      // Notify student that call was accepted
      io.to(studentSocketId).emit('call-accepted', { 
        teacherId, 
        roomId,
        teacherName: 'Teacher Name' // You can fetch actual teacher name from DB
      });

      // Confirm to teacher
      socket.emit('call-started', { studentId, roomId });
    });

    // Handle real speech detection data
    socket.on('speech-detected', (data: {
      roomId: string;
      speaker: 'student' | 'teacher';
      duration: number;
      volumeLevel: number;
    }) => {
      const metrics = speechMetrics.get(data.roomId);
      if (!metrics) return;
      
      const now = Date.now();
      
      // Update speech time based on speaker
      if (data.speaker === 'student') {
        metrics.studentSpeechTime += 1;
        metrics.lastStudentSpeech = now;
        metrics.studentVolume.push(data.volumeLevel);
        // Keep only last 10 volume readings
        if (metrics.studentVolume.length > 10) metrics.studentVolume.shift();
      } else {
        metrics.teacherSpeechTime += 1;
        metrics.lastTeacherSpeech = now;
        metrics.teacherVolume.push(data.volumeLevel);
        if (metrics.teacherVolume.length > 10) metrics.teacherVolume.shift();
      }
      
      // Calculate real TTT ratio
      const totalSpeech = metrics.studentSpeechTime + metrics.teacherSpeechTime;
      if (totalSpeech > 0) {
        const tttRatio = {
          teacher: Math.round((metrics.teacherSpeechTime / totalSpeech) * 100),
          student: Math.round((metrics.studentSpeechTime / totalSpeech) * 100)
        };
        
        // Send real TTT update to all participants in the room
        io.to(data.roomId).emit('ttt-update', tttRatio);
        
        // Check for TTT imbalance warnings
        if (tttRatio.teacher > 70) {
          io.to(data.roomId).emit('ai-warning', {
            type: 'ttt-imbalance',
            message: 'Teacher is talking too much. Encourage student participation.',
            severity: 'medium'
          });
        } else if (tttRatio.student > 80) {
          io.to(data.roomId).emit('ai-warning', {
            type: 'ttt-imbalance',
            message: 'Student dominating conversation. Teacher should provide more guidance.',
            severity: 'low'
          });
        }
      }
      
      // Calculate real performance scores based on activity
      const avgStudentVolume = metrics.studentVolume.length > 0 
        ? metrics.studentVolume.reduce((a, b) => a + b, 0) / metrics.studentVolume.length 
        : 0;
      const avgTeacherVolume = metrics.teacherVolume.length > 0
        ? metrics.teacherVolume.reduce((a, b) => a + b, 0) / metrics.teacherVolume.length
        : 0;
      
      // Real scoring based on speech clarity and consistency
      const studentScore = Math.min(100, Math.round(
        50 + // Base score
        (avgStudentVolume / 2) + // Volume clarity (0-50 range)
        (metrics.studentSpeechTime > 10 ? 10 : metrics.studentSpeechTime) // Participation bonus
      ));
      
      const teacherScore = Math.min(100, Math.round(
        60 + // Base score for teacher
        (avgTeacherVolume / 3) + // Volume clarity
        (totalSpeech > 0 ? (metrics.teacherSpeechTime / totalSpeech * 20) : 0) // Balance bonus
      ));
      
      // Send real score updates
      io.to(data.roomId).emit('live-score-update', {
        student: studentScore,
        teacher: teacherScore,
        trend: studentScore > 70 ? 'up' : studentScore < 50 ? 'down' : 'stable'
      });
    });

    // Handle attention/engagement updates
    socket.on('attention-update', (data: {
      roomId: string;
      score: number;
    }) => {
      // Broadcast real engagement level to all participants
      io.to(data.roomId).emit('engagement-update', data.score);
      
      // Generate AI suggestions based on engagement
      if (data.score < 50) {
        const suggestions = [
          "Try asking an open-ended question",
          "Switch to a different topic",
          "Use visual aids or examples",
          "Take a short break if needed"
        ];
        io.to(data.roomId).emit('ai-suggestion', suggestions);
      } else if (data.score > 80) {
        const suggestions = [
          "Great engagement! Keep the momentum",
          "Now is a good time for complex topics",
          "Consider introducing new vocabulary",
          "Perfect time for role-play exercises"
        ];
        io.to(data.roomId).emit('ai-suggestion', suggestions);
      }
    });

    // Handle word help requests
    socket.on('request-word-help', (data: { roomId: string }) => {
      // Generate contextual word suggestions
      const suggestions = [
        { word: "Moreover", translation: "علاوه بر این", usage: "To add more information" },
        { word: "Nevertheless", translation: "با این حال", usage: "To show contrast" },
        { word: "Furthermore", translation: "همچنین", usage: "To continue a point" }
      ];
      
      io.to(data.roomId).emit('word-suggestions', suggestions);
    });

    // Handle call end
    socket.on('end-call', async (data: { roomId: string; duration: number }) => {
      const { roomId, duration } = data;
      const callInfo = activeCalls.get(roomId);
      
      if (callInfo) {
        // Mark teacher as available again
        const teacherInfo = onlineTeachers.get(callInfo.teacherId);
        if (teacherInfo) {
          onlineTeachers.set(callInfo.teacherId, { ...teacherInfo, status: 'available' });
        }
        
        // Get final metrics
        const metrics = speechMetrics.get(roomId);
        if (metrics) {
          const finalTTT = {
            teacher: metrics.teacherSpeechTime,
            student: metrics.studentSpeechTime
          };
          
          console.log(`Call ended - Room: ${roomId}, Duration: ${duration} minutes, TTT:`, finalTTT);
        }
        
        // Clean up
        activeCalls.delete(roomId);
        speechMetrics.delete(roomId);
        
        // Stop AI monitoring
        aiMonitor.endCall(roomId);
        
        // Notify participants
        io.to(roomId).emit('call-ended', {
          reason: 'Call ended normally',
          duration: duration
        });
      }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
      console.log('Socket disconnected:', socket.id);
      
      // Check if it was a teacher
      const teacherId = teacherSockets.get(socket.id);
      if (teacherId) {
        onlineTeachers.delete(teacherId);
        teacherSockets.delete(socket.id);
        
        // Notify all clients
        io.emit('teacher-status-update', {
          teacherId,
          status: 'offline'
        });
      }
      
      // Check if it was a student
      const studentId = studentSockets.get(socket.id);
      if (studentId) {
        studentSockets.delete(socket.id);
      }
    });
  });
}