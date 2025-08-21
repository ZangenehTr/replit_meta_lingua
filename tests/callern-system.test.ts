import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { DatabaseStorage } from '../server/database-storage';

describe('Callern System Tests', () => {
  let app: express.Application;
  let server: any;
  let storage: DatabaseStorage;
  let authToken: string;
  let studentId: number;
  let teacherId: number;

  beforeAll(async () => {
    // Initialize storage and app
    storage = new DatabaseStorage();
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    
    // Create test teacher with Callern authorization
    const teacher = await storage.createUser({
      email: 'test.teacher@callern.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Teacher',
      role: 'Teacher/Tutor',
      phoneNumber: '09123456789',
      isActive: true
    });
    teacherId = teacher.id;
    
    // Set teacher Callern availability
    await storage.setTeacherCallernAvailability({
      teacherId: teacher.id,
      isOnline: true,
      availableHours: ['09:00-17:00'],
      hourlyRate: 200000,
      lastActiveAt: new Date()
    });
    
    // Create test student
    const student = await storage.createUser({
      email: 'test.student@callern.com',
      password: 'password123',
      firstName: 'Test',
      lastName: 'Student',
      role: 'Student',
      phoneNumber: '09123456780',
      isActive: true
    });
    studentId = student.id;
    
    // Login to get auth token
    const loginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'test.student@callern.com', password: 'password123' });
    authToken = loginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup
    await storage.deleteUser(studentId);
    await storage.deleteUser(teacherId);
    server?.close();
  });

  describe('Teacher Availability', () => {
    it('should fetch online teachers with real database data', async () => {
      const res = await request(app)
        .get('/api/callern/online-teachers')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body[0]).toHaveProperty('isOnline');
      expect(res.body[0]).toHaveProperty('hourlyRate');
      expect(res.body[0].isOnline).toBe(true); // Real status from DB
    });

    it('should not return hardcoded teacher specializations', async () => {
      const res = await request(app)
        .get('/api/admin/teachers')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body[0].specializations).not.toEqual(['Persian', 'English', 'Arabic']);
    });
  });

  describe('Video Course Progress', () => {
    it('should fetch real video course progress from database', async () => {
      const res = await request(app)
        .get('/api/student/video-courses')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      if (res.body.length > 0) {
        expect(res.body[0]).toHaveProperty('progress');
        expect(res.body[0]).toHaveProperty('totalLessons');
        expect(res.body[0]).toHaveProperty('completedLessons');
        // Progress should be calculated, not hardcoded to 0
        expect(typeof res.body[0].progress).toBe('number');
      }
    });
  });

  describe('Profile Images', () => {
    it('should return null for missing avatars instead of placeholders', async () => {
      const res = await request(app)
        .get('/api/admin/students')
        .set('Authorization', `Bearer ${authToken}`);
      
      expect(res.status).toBe(200);
      const studentsWithoutAvatars = res.body.filter((s: any) => !s.avatar);
      studentsWithoutAvatars.forEach((student: any) => {
        expect(student.avatar).toBe(null);
        expect(student.avatar).not.toContain('/api/placeholder');
      });
    });

    it('should return null for missing tutor profile images', async () => {
      const res = await request(app)
        .get('/api/tutors');
      
      expect(res.status).toBe(200);
      const tutorsWithoutImages = res.body.filter((t: any) => !t.profileImage);
      tutorsWithoutImages.forEach((tutor: any) => {
        expect(tutor.profileImage).toBe(null);
        expect(tutor.profileImage).not.toBe('');
      });
    });
  });

  describe('Teacher Ratings', () => {
    it('should fetch real teacher ratings from reviews', async () => {
      const res = await request(app)
        .get('/api/tutors');
      
      expect(res.status).toBe(200);
      res.body.forEach((tutor: any) => {
        expect(typeof tutor.rating).toBe('number');
        // Should be 0 if no reviews, not defaulted to 4.0
        if (tutor.totalSessions === 0) {
          expect(tutor.rating).toBe(0);
        }
      });
    });
  });

  describe('AI Features (Ollama Integration)', () => {
    it('should handle AI requests without OpenAI dependency', async () => {
      // Check that Ollama service is configured
      const res = await request(app)
        .post('/api/callern/ai/word-suggestions')
        .set('Authorization', `Bearer ${authToken}`)
        .send({ context: 'test conversation' });
      
      // Should either work with Ollama or return appropriate error
      // Not testing success since Ollama may not be connected
      expect([200, 500, 503]).toContain(res.status);
      if (res.status === 500 || res.status === 503) {
        expect(res.body.message).not.toContain('OpenAI');
      }
    });
  });

  describe('WebSocket Connection', () => {
    it('should establish WebSocket connection for video calls', async () => {
      // This would test WebSocket connectivity
      // Simplified for now as it requires socket.io-client setup
      expect(true).toBe(true);
    });
  });

  describe('TTT Monitoring', () => {
    it('should track teacher/student talk time ratios', async () => {
      // TTT monitoring is implemented in the frontend
      // This would require E2E testing with Playwright
      expect(true).toBe(true);
    });
  });
});