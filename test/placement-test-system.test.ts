import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { users, placementTestResults, courses } from '@shared/schema';
import { eq } from 'drizzle-orm';

describe('Placement Test Priority System', () => {
  let authToken: string;
  let newUserId: number;
  let existingUserId: number;
  let courseId: number;

  beforeEach(async () => {
    // Create test users
    const [newUser] = await db.insert(users).values({
      email: 'newuser@test.com',
      firstName: 'New',
      lastName: 'User',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'female',
      age: 25
    }).returning();
    newUserId = newUser.id;

    const [existingUser] = await db.insert(users).values({
      email: 'existing@test.com',
      firstName: 'Existing',
      lastName: 'User',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'male',
      age: 28
    }).returning();
    existingUserId = existingUser.id;

    // Create test course
    const [course] = await db.insert(courses).values({
      title: 'Test English Course',
      description: 'Test course for placement',
      level: 'Beginner',
      language: 'English',
      price: 1000000,
      instructorId: existingUserId,
      deliveryMode: 'online',
      classFormat: 'group',
      totalSessions: 10,
      sessionDuration: 90
    }).returning();
    courseId = course.id;

    // Create placement test result for existing user only
    await db.insert(placementTestResults).values({
      userId: existingUserId,
      courseId: courseId,
      totalQuestions: 50,
      correctAnswers: 35,
      scorePercentage: 70,
      level: 'Intermediate',
      recommendations: ['Focus on grammar', 'Practice speaking'],
      timeSpent: 45,
      completedAt: new Date()
    });

    // Mock authentication token (in real test, you'd get this from login)
    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(placementTestResults).where(eq(placementTestResults.userId, existingUserId));
    await db.delete(courses).where(eq(courses.id, courseId));
    await db.delete(users).where(eq(users.id, newUserId));
    await db.delete(users).where(eq(users.id, existingUserId));
  });

  it('should detect new learner without placement test', async () => {
    const response = await request(app)
      .get('/api/student/placement-test-status')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', newUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body).toEqual({
      hasCompletedPlacementTest: false,
      isNewLearner: true,
      shouldShowPlacementTest: true,
      placementTestResults: null
    });
  });

  it('should detect existing learner with completed placement test', async () => {
    const response = await request(app)
      .get('/api/student/placement-test-status')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', existingUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.hasCompletedPlacementTest).toBe(true);
    expect(response.body.isNewLearner).toBe(false);
    expect(response.body.shouldShowPlacementTest).toBe(false);
    expect(response.body.placementTestResults).toBeTruthy();
    expect(response.body.placementTestResults.level).toBe('Intermediate');
  });

  it('should submit placement test results successfully', async () => {
    const placementTestData = {
      courseId: courseId,
      answers: [
        { questionId: 1, selectedAnswer: 'A', isCorrect: true },
        { questionId: 2, selectedAnswer: 'B', isCorrect: false },
        { questionId: 3, selectedAnswer: 'C', isCorrect: true }
      ],
      timeSpent: 30
    };

    const response = await request(app)
      .post('/api/student/placement-test-submit')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', newUserId.toString())
      .send(placementTestData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.results).toBeTruthy();
    expect(response.body.results.scorePercentage).toBeGreaterThan(0);
    expect(response.body.results.level).toBeTruthy();

    // Verify placement test result was saved
    const savedResults = await db
      .select()
      .from(placementTestResults)
      .where(eq(placementTestResults.userId, newUserId));
    
    expect(savedResults).toHaveLength(1);
    expect(savedResults[0].courseId).toBe(courseId);
  });

  it('should prevent duplicate placement test submission', async () => {
    const placementTestData = {
      courseId: courseId,
      answers: [
        { questionId: 1, selectedAnswer: 'A', isCorrect: true }
      ],
      timeSpent: 30
    };

    const response = await request(app)
      .post('/api/student/placement-test-submit')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', existingUserId.toString())
      .send(placementTestData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already completed');
  });

  it('should prioritize placement test in dashboard for new learners', async () => {
    const response = await request(app)
      .get('/api/student/dashboard-priority')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', newUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.priorities).toContain('placement-test');
    expect(response.body.priorities[0]).toBe('placement-test');
  });
});