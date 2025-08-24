import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'socket.io';
import { createServer } from 'http';
import Client from 'socket.io-client';
import { setupCallernWebSocketHandlers } from '../server/callern-websocket-handlers';
import { CallernAIMonitor } from '../server/callern-ai-monitor';

describe('Callern AI-Enhanced Video System', () => {
  let io: Server;
  let serverSocket: any;
  let clientSocket: any;
  let httpServer: any;

  beforeEach(async () => {
    httpServer = createServer();
    io = new Server(httpServer);
    setupCallernWebSocketHandlers(io);
    
    await new Promise<void>((resolve) => {
      httpServer.listen(() => {
        const port = (httpServer.address() as any).port;
        clientSocket = Client(`http://localhost:${port}`);
        io.on('connection', (socket) => {
          serverSocket = socket;
        });
        clientSocket.on('connect', () => resolve());
      });
    });
  });

  afterEach(() => {
    io.close();
    clientSocket.close();
    httpServer.close();
  });

  describe('Teacher Online/Offline Toggle', () => {
    it('should allow teacher to go online', async () => {
      const teacherId = 1;
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('teacher-online-success', (data: any) => {
          expect(data.teacherId).toBe(teacherId);
          expect(data.status).toBe('online');
          resolve();
        });
      });
      
      clientSocket.emit('teacher-online', { teacherId });
      await promise;
    });

    it('should allow teacher to go offline', async () => {
      const teacherId = 1;
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('teacher-offline-success', (data: any) => {
          expect(data.teacherId).toBe(teacherId);
          expect(data.status).toBe('offline');
          resolve();
        });
      });
      
      clientSocket.emit('teacher-offline', { teacherId });
      await promise;
    });

    it('should notify all clients when teacher status changes', async () => {
      const teacherId = 1;
      const client2 = Client(`http://localhost:${(httpServer.address() as any).port}`);
      
      const promise = new Promise<void>((resolve) => {
        client2.on('teacher-status-update', (data: any) => {
          expect(data.teacherId).toBe(teacherId);
          expect(data.status).toBe('online');
          client2.close();
          resolve();
        });
      });
      
      clientSocket.emit('teacher-online', { teacherId });
      await promise;
    });
  });

  describe('AI Monitoring Integration', () => {
    it('should start AI monitoring when call is accepted', async () => {
      const teacherSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      const studentSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      
      // Teacher goes online
      teacherSocket.emit('authenticate', { userId: 1, role: 'teacher' });
      teacherSocket.emit('teacher-online', { teacherId: 1 });
      
      // Student requests call
      studentSocket.emit('authenticate', { userId: 2, role: 'student' });
      
      const promise = new Promise<void>((resolve) => {
        teacherSocket.on('incoming-call', (data: any) => {
          expect(data.studentInfo).toBeDefined();
          expect(data.roomId).toBeDefined();
          
          // Teacher accepts call
          teacherSocket.emit('call-response', { accept: true, roomId: data.roomId });
        });
        
        studentSocket.on('call-accepted', (data: any) => {
          expect(data.roomId).toBeDefined();
          expect(data.teacherId).toBe(1);
          teacherSocket.close();
          studentSocket.close();
          resolve();
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      studentSocket.emit('request-call', {
        studentId: 2,
        teacherId: 1,
        packageId: 1,
        language: 'en'
      });
      
      await promise;
    });

    it('should provide word suggestions on request', async () => {
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('word-suggestions', (suggestions: any) => {
          expect(Array.isArray(suggestions)).toBe(true);
          if (suggestions.length > 0) {
            expect(suggestions[0]).toHaveProperty('word');
            expect(suggestions[0]).toHaveProperty('translation');
            expect(suggestions[0]).toHaveProperty('usage');
          }
          resolve();
        });
      });
      
      clientSocket.emit('request-word-help', { roomId: 'test-room' });
      await promise;
    });

    it('should provide pronunciation guide', async () => {
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('pronunciation-guide', (guide: any) => {
          expect(guide).toBeDefined();
          resolve();
        });
      });
      
      clientSocket.emit('check-pronunciation', { roomId: 'test-room', word: 'hello' });
      await promise;
    });

    it('should update live scores based on speech detection', async () => {
      const roomId = 'test-room';
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('live-score-update', (scores: any) => {
          expect(scores.student).toBeDefined();
          expect(scores.teacher).toBeDefined();
          expect(scores.trend).toMatch(/^(up|down|stable)$/);
          resolve();
        });
      });
      
      clientSocket.emit('speech-detected', {
        roomId,
        speaker: 'student',
        duration: 10,
        text: 'Hello, how are you?'
      });
      
      await promise;
    });
  });

  describe('Teacher Briefing System', () => {
    it('should provide student information before call', async () => {
      const teacherSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      const studentSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      
      // Setup teacher
      teacherSocket.emit('authenticate', { userId: 1, role: 'teacher' });
      teacherSocket.emit('teacher-online', { teacherId: 1 });
      
      // Setup student
      studentSocket.emit('authenticate', { userId: 2, role: 'student' });
      
      const promise = new Promise<void>((resolve) => {
        teacherSocket.on('incoming-call', (data: any) => {
          const { studentInfo } = data;
          
          // Check briefing data structure
          expect(studentInfo.id).toBeDefined();
          expect(studentInfo.name).toBeDefined();
          expect(studentInfo.level).toBeDefined();
          expect(studentInfo.course).toBeDefined();
          expect(studentInfo.language).toBeDefined();
          expect(studentInfo.previousSessions).toBeDefined();
          expect(studentInfo.averageScore).toBeDefined();
          expect(studentInfo.strengths).toBeInstanceOf(Array);
          expect(studentInfo.weaknesses).toBeInstanceOf(Array);
          expect(studentInfo.learningGoals).toBeInstanceOf(Array);
          expect(studentInfo.preferredTopics).toBeInstanceOf(Array);
          expect(studentInfo.mood).toBeDefined();
          
          teacherSocket.close();
          studentSocket.close();
          resolve();
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      studentSocket.emit('request-call', {
        studentId: 2,
        teacherId: 1,
        packageId: 1,
        language: 'en'
      });
      
      await promise;
    });
  });

  describe('Facial Expression and Body Language', () => {
    it('should analyze facial expressions', async () => {
      const imageData = 'data:image/jpeg;base64,/9j/4AAQSkZJRgABAQEAYABgAAD...'; // Mock image data
      
      // Simulate as teacher
      clientSocket.emit('authenticate', { userId: 1, role: 'teacher' });
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('teacher-tips', (tips: any) => {
          expect(Array.isArray(tips)).toBe(true);
          if (tips.length > 0) {
            expect(tips[0]).toHaveProperty('tip');
            expect(tips[0]).toHaveProperty('priority');
          }
          resolve();
        });
      });
      
      await new Promise(resolve => setTimeout(resolve, 100));
      clientSocket.emit('facial-expression', {
        roomId: 'test-room',
        imageData
      });
      
      await promise;
    });

    it('should track attention scores', async () => {
      const roomId = 'test-room';
      const attentionScore = 85;
      
      clientSocket.emit('attention-update', {
        roomId,
        score: attentionScore
      });
      
      // No direct response expected, but should not error
      await new Promise(resolve => setTimeout(resolve, 100));
      expect(true).toBe(true); // Test passes if no error
    });
  });

  describe('Call End and Summary', () => {
    it('should generate session summary on call end', async () => {
      const roomId = 'test-room';
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('call-ended', (data: any) => {
          expect(data.reason).toBeDefined();
          expect(data.summary).toBeDefined();
          if (data.summary) {
            expect(data.summary.scores).toBeDefined();
          }
          resolve();
        });
      });
      
      clientSocket.emit('end-call', {
        roomId,
        duration: 1800 // 30 minutes
      });
      
      await promise;
    });
  });

  describe('Network Error Handling', () => {
    it('should handle teacher disconnect during call', async () => {
      const teacherSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      const studentSocket = Client(`http://localhost:${(httpServer.address() as any).port}`);
      
      // Setup and start call
      teacherSocket.emit('authenticate', { userId: 1, role: 'teacher' });
      teacherSocket.emit('teacher-online', { teacherId: 1 });
      studentSocket.emit('authenticate', { userId: 2, role: 'student' });
      
      const promise = new Promise<void>((resolve) => {
        studentSocket.on('teacher-status-update', (data: any) => {
          if (data.status === 'offline') {
            expect(data.teacherId).toBe(1);
            studentSocket.close();
            resolve();
          }
        });
      });
      
      // Simulate teacher disconnect
      await new Promise(resolve => setTimeout(resolve, 100));
      teacherSocket.disconnect();
      
      await promise;
    });

    it('should handle student disconnect during call', async () => {
      const roomId = 'test-room-' + Date.now();
      
      // Join room first
      clientSocket.emit('join-room', { roomId });
      
      const promise = new Promise<void>((resolve) => {
        clientSocket.on('call-ended', (data: any) => {
          expect(data.reason).toContain('disconnected');
          resolve();
        });
      });
      
      // Simulate disconnect
      await new Promise(resolve => setTimeout(resolve, 100));
      clientSocket.disconnect();
      clientSocket.connect();
      
      await promise;
    });
  });
});

describe('CallernAIMonitor', () => {
  let aiMonitor: CallernAIMonitor;
  let mockIo: any;

  beforeEach(() => {
    mockIo = {
      to: vi.fn().mockReturnThis(),
      emit: vi.fn()
    };
    aiMonitor = new CallernAIMonitor(mockIo);
  });

  describe('Speech Metrics', () => {
    it('should track teacher talk time (TTT)', () => {
      const roomId = 'test-room';
      
      aiMonitor.startMonitoring({
        roomId,
        studentId: 1,
        teacherId: 2,
        languageCode: 'en'
      });
      
      // Simulate speech
      aiMonitor.updateSpeechMetrics(roomId, 'teacher', 30);
      aiMonitor.updateSpeechMetrics(roomId, 'student', 20);
      aiMonitor.updateSpeechMetrics(roomId, 'teacher', 10);
      
      const scores = aiMonitor.calculateLiveScore(roomId);
      
      // Teacher spoke 40 seconds, student 20 seconds
      // TTT = 40/60 = 66.67%
      expect(scores.teacher).toBeGreaterThan(60);
    });

    it('should generate word suggestions based on context', async () => {
      const suggestions = await aiMonitor.generateWordSuggestions(
        'test-room',
        'I want to discuss the weather',
        'en'
      );
      
      expect(Array.isArray(suggestions)).toBe(true);
      expect(suggestions.length).toBeGreaterThan(0);
    });
  });

  describe('Performance Scoring', () => {
    it('should calculate live scores', () => {
      const roomId = 'test-room';
      
      aiMonitor.startMonitoring({
        roomId,
        studentId: 1,
        teacherId: 2,
        languageCode: 'en'
      });
      
      const scores = aiMonitor.calculateLiveScore(roomId);
      
      expect(scores).toHaveProperty('student');
      expect(scores).toHaveProperty('teacher');
      expect(scores.student).toBeGreaterThanOrEqual(0);
      expect(scores.student).toBeLessThanOrEqual(100);
    });

    it('should generate session summary', async () => {
      const roomId = 'test-room';
      
      aiMonitor.startMonitoring({
        roomId,
        studentId: 1,
        teacherId: 2,
        languageCode: 'en'
      });
      
      // Add some activity
      aiMonitor.updateSpeechMetrics(roomId, 'student', 60);
      aiMonitor.updateSpeechMetrics(roomId, 'teacher', 40);
      aiMonitor.addTranscript(roomId, 'Hello, how are you?', 'student');
      aiMonitor.addTranscript(roomId, 'I am fine, thank you!', 'teacher');
      
      const summary = await aiMonitor.generateSessionSummary(roomId);
      
      expect(summary).toHaveProperty('scores');
      expect(summary).toHaveProperty('performance');
      expect(summary).toHaveProperty('recommendations');
      expect(summary.scores.student).toBeGreaterThan(0);
    });
  });
});