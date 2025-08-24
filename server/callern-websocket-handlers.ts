import { Server, Socket } from 'socket.io';
import { CallernAIMonitor } from './callern-ai-monitor';
import { storage } from './storage';

// Track online teachers
const onlineTeachers = new Map<number, { socketId: string; status: 'available' | 'busy' }>();
const teacherSockets = new Map<string, number>();
const studentSockets = new Map<string, number>();
const activeCalls = new Map<string, { studentId: number; teacherId: number; roomId: string }>();

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
      const studentProfile = await storage.getStudentProfile(studentId);
      const previousSessions = await storage.getStudentCallernHistory(studentId, teacherId);
      
      // Create briefing data
      const briefingData = {
        id: studentId,
        name: `${student.firstName} ${student.lastName}`,
        level: studentProfile?.currentLevel || 'A1',
        course: studentProfile?.enrolledCourses?.[0] || 'General English',
        language: language,
        previousSessions: previousSessions.length,
        averageScore: previousSessions.reduce((acc, s) => acc + (s.score || 0), 0) / (previousSessions.length || 1),
        strengths: studentProfile?.strengths || ['Vocabulary', 'Listening'],
        weaknesses: studentProfile?.weaknesses || ['Grammar', 'Pronunciation'],
        learningGoals: studentProfile?.goals || ['Improve fluency', 'Business English'],
        preferredTopics: studentProfile?.interests || ['Travel', 'Technology'],
        mood: studentProfile?.currentMood || 'neutral',
        lastSessionNotes: previousSessions[0]?.notes || null
      };

      // Send briefing to teacher
      const teacherSocket = io.sockets.sockets.get(teacherInfo.socketId);
      if (teacherSocket) {
        const roomId = `callern-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
        
        teacherSocket.emit('incoming-call', {
          studentId,
          studentInfo: briefingData,
          roomId,
          packageId
        });

        // Wait for teacher response
        teacherSocket.once('call-response', async (response: { accept: boolean; roomId: string }) => {
          if (response.accept) {
            // Teacher accepted the call
            onlineTeachers.set(teacherId, { ...teacherInfo, status: 'busy' });
            activeCalls.set(roomId, { studentId, teacherId, roomId });
            
            // Start AI monitoring
            aiMonitor.startMonitoring({
              roomId,
              studentId,
              teacherId,
              languageCode: language
            });
            
            // Notify student that call was accepted
            socket.emit('call-accepted', {
              roomId,
              teacherId,
              teacherSocketId: teacherInfo.socketId
            });
            
            // Join both parties to the room
            socket.join(roomId);
            teacherSocket.join(roomId);
            
            // Start recording the session
            await storage.createCallernSession({
              studentId,
              teacherId,
              packageId,
              roomId,
              startTime: new Date(),
              status: 'active'
            });
          } else {
            // Teacher rejected the call
            socket.emit('call-rejected', { reason: 'Teacher declined the call' });
          }
        });

        // Auto-reject after 30 seconds if no response
        setTimeout(() => {
          if (!activeCalls.has(roomId)) {
            socket.emit('call-rejected', { reason: 'Teacher did not respond in time' });
          }
        }, 30000);
      } else {
        socket.emit('call-rejected', { reason: 'Teacher connection lost' });
      }
    });

    // Handle AI feature requests
    socket.on('request-word-help', async (data: { roomId: string }) => {
      const { roomId } = data;
      const callInfo = activeCalls.get(roomId);
      
      if (callInfo) {
        // Get current conversation context
        const suggestions = await aiMonitor.generateWordSuggestions(
          roomId,
          'current context', // This would be the actual conversation context
          'en' // This would be the target language
        );
        
        socket.emit('word-suggestions', suggestions.map(s => ({
          word: s,
          translation: 'translation here', // Would be actual translation
          usage: 'example usage' // Would be actual usage example
        })));
      }
    });

    socket.on('check-pronunciation', async (data: { roomId: string; word: string }) => {
      const { roomId, word } = data;
      
      const guide = await aiMonitor.generatePronunciationGuide(word, 'en');
      socket.emit('pronunciation-guide', guide);
    });

    socket.on('speech-detected', (data: { roomId: string; speaker: 'student' | 'teacher'; duration: number; text?: string }) => {
      const { roomId, speaker, duration, text } = data;
      
      // Update AI metrics
      aiMonitor.updateSpeechMetrics(roomId, speaker, duration);
      
      if (text) {
        aiMonitor.addTranscript(roomId, text, speaker);
      }
      
      // Calculate and send live scores
      const scores = aiMonitor.calculateLiveScore(roomId);
      io.to(roomId).emit('live-score-update', {
        student: scores.student,
        teacher: scores.teacher,
        trend: scores.student > 50 ? 'up' : scores.student < 30 ? 'down' : 'stable'
      });
    });

    socket.on('attention-update', (data: { roomId: string; score: number }) => {
      const { roomId, score } = data;
      aiMonitor.updateAttentionScore(roomId, score);
    });

    socket.on('facial-expression', async (data: { roomId: string; imageData: string }) => {
      const { roomId, imageData } = data;
      
      const expression = await aiMonitor.analyzeFacialExpression(imageData);
      const bodyLanguage = await aiMonitor.analyzeBodyLanguage(imageData);
      
      // Generate teacher tips based on student mood
      const teacherIdForSocket = teacherSockets.get(socket.id);
      if (teacherIdForSocket) {
        const tips = await aiMonitor.generateTeacherTips(roomId, expression, bodyLanguage);
        socket.emit('teacher-tips', tips.map(tip => ({
          icon: null, // Would be actual icon component
          tip,
          priority: 'medium' as const
        })));
      }
    });

    socket.on('end-call', async (data: { roomId: string; duration: number }) => {
      const { roomId, duration } = data;
      const callInfo = activeCalls.get(roomId);
      
      if (callInfo) {
        // Generate session summary
        const summary = await aiMonitor.generateSessionSummary(roomId);
        
        // Save session to database
        await storage.updateCallernSession(roomId, {
          endTime: new Date(),
          duration,
          status: 'completed',
          summary: JSON.stringify(summary),
          score: summary?.scores?.student || 0
        });
        
        // Update teacher availability
        const teacherInfo = onlineTeachers.get(callInfo.teacherId);
        if (teacherInfo) {
          onlineTeachers.set(callInfo.teacherId, { ...teacherInfo, status: 'available' });
        }
        
        // Clean up
        activeCalls.delete(roomId);
        aiMonitor.stopMonitoring(roomId);
        
        // Notify both parties
        io.to(roomId).emit('call-ended', { 
          reason: 'Call completed successfully',
          summary 
        });
        
        // Leave room
        socket.leave(roomId);
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
        
        // Notify about teacher going offline
        io.emit('teacher-status-update', {
          teacherId,
          status: 'offline'
        });
        
        // Update database
        storage.updateTeacherCallernAvailability(teacherId, false).catch(console.error);
      }
      
      // Check if it was a student in a call
      const studentId = studentSockets.get(socket.id);
      if (studentId) {
        studentSockets.delete(socket.id);
        
        // Check if student was in a call
        for (const [roomId, callInfo] of activeCalls.entries()) {
          if (callInfo.studentId === studentId) {
            io.to(roomId).emit('call-ended', { reason: 'Student disconnected' });
            activeCalls.delete(roomId);
            aiMonitor.stopMonitoring(roomId);
            break;
          }
        }
      }
    });
  });
}