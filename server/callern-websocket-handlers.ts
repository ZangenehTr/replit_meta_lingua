import { Server, Socket } from 'socket.io';
import { CallernAIMonitor } from './callern-ai-monitor';
import { storage } from './storage';
import { teacherCoachingService } from './services/teacher-coaching-service';

// Track online teachers and calls
const onlineTeachers = new Map<number, { socketId: string; status: 'available' | 'busy'; lastSeen: number }>();
const teacherSockets = new Map<string, number>();
const studentSockets = new Map<string, number>();
const adminSockets = new Map<string, { userId: number; role: string }>(); // Track admin/supervisor sockets
const activeCalls = new Map<string, { studentId: number; teacherId: number; roomId: string; startTime: number }>();
const pendingCalls = new Map<string, { studentId: number; teacherId: number; timestamp: number; timeout: NodeJS.Timeout }>();

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

// Helper function to send notifications to admin and supervisor roles only
function sendAdminNotification(io: any, notification: any) {
  // Send to all authenticated admin and supervisor sockets
  for (const [socketId, user] of adminSockets.entries()) {
    if (user.role === 'admin' || user.role === 'supervisor') {
      io.to(socketId).emit('admin-notification', notification);
    }
  }
  
  // Log the notification for server monitoring
  console.log(`📢 Admin notification sent to ${adminSockets.size} admin/supervisor(s):`, {
    type: notification.type,
    severity: notification.severity,
    message: notification.message
  });
}

export function setupCallernWebSocketHandlers(io: Server) {
  const aiMonitor = new CallernAIMonitor(io);

  // Set up coaching service listeners
  teacherCoachingService.on('coaching-reminder', (data) => {
    // Send to teacher in the session
    const teacherSocket = Array.from(teacherSockets.entries())
      .find(([_, id]) => id === data.teacherId)?.[0];
    
    if (teacherSocket) {
      io.to(teacherSocket).emit('coaching-reminder', data);
    }
    
    // Also send to the room for monitoring
    if (data.sessionId) {
      io.to(data.sessionId).emit('coaching-reminder', data);
    }
  });

  teacherCoachingService.on('coaching-session-ended', (data) => {
    console.log(`Coaching session ended for teacher ${data.teacherId}:`, {
      duration: data.duration,
      reminders: data.reminderCount
    });
  });

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
      } else if (role === 'admin' || role === 'supervisor' || role === 'Admin' || role === 'Supervisor') {
        adminSockets.set(socket.id, { userId, role: role.toLowerCase() });
        console.log(`${role} ${userId} authenticated with socket ${socket.id}`);
        socket.emit('authenticated', { success: true, role: role.toLowerCase() });
      }
    });

    // Handle teacher going online
    socket.on('teacher-online', async (data: { teacherId: number }) => {
      const { teacherId } = data;
      
      // Update teacher status in database
      try {
        await storage.updateTeacherCallernAvailability(teacherId, { isOnline: true });
        
        // Track online teacher with timestamp
        onlineTeachers.set(teacherId, { 
          socketId: socket.id, 
          status: 'available',
          lastSeen: Date.now()
        });
        teacherSockets.set(socket.id, teacherId);
        
        console.log(`✅ Teacher ${teacherId} is now online for Callern`);
        
        // Notify all clients about teacher status change
        io.emit('teacher-status-update', {
          teacherId,
          status: 'online',
          socketId: socket.id,
          timestamp: Date.now()
        });
        
        // Notify admins/supervisors about teacher going online
        sendAdminNotification(io, {
          type: 'teacher-online',
          teacherId,
          timestamp: Date.now(),
          message: `Teacher ${teacherId} is now online and available`,
          severity: 'info'
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
      onlineTeachers.set(teacherId, { ...teacherInfo, status: 'busy', lastSeen: Date.now() });
      
      // Store active call info
      const roomId = `callern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
      activeCalls.set(roomId, { studentId, teacherId, roomId, startTime: Date.now() });
      
      // Set up missed call timeout (30 seconds)
      const callTimeout = setTimeout(async () => {
        const pendingCall = pendingCalls.get(roomId);
        if (pendingCall) {
          console.log(`⚠️ MISSED CALL: Teacher ${teacherId} did not respond to call from student ${studentId}`);
          
          // Update missed calls counter in database
          try {
            await storage.incrementTeacherMissedCalls(teacherId);
          } catch (error) {
            console.error('Failed to update missed calls counter:', error);
          }
          
          // Notify admin/supervisors about missed call
          sendAdminNotification(io, {
            type: 'missed-call',
            teacherId,
            studentId,
            timestamp: Date.now(),
            message: `Teacher ${teacherId} missed call from student ${studentId}`,
            severity: 'warning'
          });
          
          // Notify student that call was missed
          const studentSocketId = Array.from(studentSockets.entries())
            .find(([_, id]) => id === studentId)?.[0];
          
          if (studentSocketId) {
            io.to(studentSocketId).emit('call-missed', {
              message: 'Teacher is currently unavailable. Please try again later.',
              teacherId
            });
          }
          
          // Clean up pending call
          pendingCalls.delete(roomId);
          
          // Mark teacher as available again (in case they were marked busy)
          const teacher = onlineTeachers.get(teacherId);
          if (teacher) {
            onlineTeachers.set(teacherId, { ...teacher, status: 'available', lastSeen: Date.now() });
          }
        }
      }, 30000); // 30 second timeout
      
      // Store pending call for timeout tracking
      pendingCalls.set(roomId, {
        studentId,
        teacherId,
        timestamp: Date.now(),
        timeout: callTimeout
      });
      
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
      
      // Clear the missed call timeout since teacher accepted
      const pendingCall = pendingCalls.get(roomId);
      if (pendingCall) {
        clearTimeout(pendingCall.timeout);
        pendingCalls.delete(roomId);
        console.log(`✅ Teacher ${teacherId} accepted call from student ${studentId}`);
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
      
      // Start coaching session for the teacher
      teacherCoachingService.startCoachingSession(teacherId, studentId, roomId);

      // Update teacher status to busy with current timestamp
      const teacherInfo = onlineTeachers.get(teacherId);
      if (teacherInfo) {
        onlineTeachers.set(teacherId, { ...teacherInfo, status: 'busy', lastSeen: Date.now() });
      }

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
      const sessionDuration = (now - metrics.sessionStart) / 1000; // in seconds
      const totalTime = Math.max(sessionDuration, totalSpeech);
      
      if (totalSpeech > 0) {
        const tttRatio = {
          teacher: Math.round((metrics.teacherSpeechTime / totalSpeech) * 100),
          student: Math.round((metrics.studentSpeechTime / totalSpeech) * 100)
        };
        
        // Calculate silence percentage
        const silenceTime = totalTime - totalSpeech;
        const silencePercentage = totalTime > 0 ? Math.round((silenceTime / totalTime) * 100) : 0;
        
        // Send real TTT update to all participants in the room
        io.to(data.roomId).emit('ttt-update', tttRatio);
        
        // Update coaching service with real-time metrics
        teacherCoachingService.updateMetrics(data.roomId, {
          tttPercentage: tttRatio.teacher,
          silencePercentage: silencePercentage,
          sessionDuration: sessionDuration
        });
        
        // Check for TTT imbalance warnings (handled by coaching service now)
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
      
      // Update coaching service with engagement metrics
      teacherCoachingService.updateMetrics(data.roomId, {
        studentEngagement: data.score
      });
      
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

    // Handle coaching session start
    socket.on('start-coaching-session', (data: {
      sessionId: string;
      teacherId: number;
      studentId: number;
    }) => {
      teacherCoachingService.startCoachingSession(
        data.teacherId,
        data.studentId,
        data.sessionId
      );
      
      socket.emit('coaching-session-started', { sessionId: data.sessionId });
      console.log(`Coaching session started for teacher ${data.teacherId}`);
    });

    // Handle coaching metrics update
    socket.on('update-teaching-metrics', (data: {
      sessionId: string;
      metrics: any;
    }) => {
      // Update coaching service with latest metrics
      if (data.metrics.tttPercentage !== undefined || 
          data.metrics.studentEngagement !== undefined ||
          data.metrics.questionCount !== undefined) {
        teacherCoachingService.updateMetrics(data.sessionId, data.metrics);
      }
      
      // Broadcast metrics to room for monitoring
      io.to(data.sessionId).emit('teaching-metrics-update', {
        sessionId: data.sessionId,
        metrics: data.metrics
      });
    });

    // Handle manual coaching reminder trigger
    socket.on('trigger-coaching-reminder', (data: {
      sessionId: string;
      type: string;
      message: string;
    }) => {
      teacherCoachingService.triggerManualReminder(
        data.sessionId,
        data.type as any,
        data.message
      );
    });

    // Handle coaching session end
    socket.on('end-coaching-session', (data: { sessionId: string }) => {
      teacherCoachingService.endCoachingSession(data.sessionId);
      socket.emit('coaching-session-ended', { sessionId: data.sessionId });
    });

    // Handle call end
    socket.on('end-call', async (data: { roomId: string; duration: number }) => {
      const { roomId, duration } = data;
      const callInfo = activeCalls.get(roomId);
      
      if (callInfo) {
        // End coaching session if active
        teacherCoachingService.endCoachingSession(roomId);
        
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
    socket.on('disconnect', async () => {
      console.log('Socket disconnected:', socket.id);
      
      // Check if it was a teacher
      const teacherId = teacherSockets.get(socket.id);
      if (teacherId) {
        const teacherInfo = onlineTeachers.get(teacherId);
        const wasOnline = !!teacherInfo;
        
        // Clear any pending call timeouts for this teacher
        for (const [roomId, pendingCall] of pendingCalls.entries()) {
          if (pendingCall.teacherId === teacherId) {
            clearTimeout(pendingCall.timeout);
            pendingCalls.delete(roomId);
            console.log(`⚠️ Cleared pending call timeout for disconnected teacher ${teacherId}`);
          }
        }
        
        // Update database status
        try {
          await storage.updateTeacherCallernAvailability(teacherId, { isOnline: false });
          await storage.updateTeacherLastSeen(teacherId);
        } catch (error) {
          console.error('Error updating teacher offline status:', error);
        }
        
        // Clean up tracking
        onlineTeachers.delete(teacherId);
        teacherSockets.delete(socket.id);
        
        console.log(`⚠️ Teacher ${teacherId} went offline (disconnected)`);
        
        // Notify all clients
        io.emit('teacher-status-update', {
          teacherId,
          status: 'offline',
          timestamp: Date.now()
        });
        
        // Send admin/supervisor notification about unexpected offline status
        if (wasOnline) {
          sendAdminNotification(io, {
            type: 'teacher-offline',
            teacherId,
            timestamp: Date.now(),
            message: `Teacher ${teacherId} unexpectedly went offline (connection lost)`,
            severity: 'warning'
          });
        }
      }
      
      // Check if it was a student
      const studentId = studentSockets.get(socket.id);
      if (studentId) {
        studentSockets.delete(socket.id);
        console.log(`Student ${studentId} disconnected`);
      }

      // Check if it was an admin or supervisor
      const adminUser = adminSockets.get(socket.id);
      if (adminUser) {
        adminSockets.delete(socket.id);
        console.log(`${adminUser.role} ${adminUser.userId} disconnected`);
      }
    });
  });
}