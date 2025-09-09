import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { users, teacherAvailability, callerNPackages, callerNSessions } from '@shared/schema';
import { eq, inArray, and } from 'drizzle-orm';

describe('Online Teacher Availability System - CallerN Integration', () => {
  let authToken: string;
  let studentUserId: number;
  let teacher1Id: number;
  let teacher2Id: number;
  let teacher3Id: number;
  let packageId: number;
  let createdUserIds: number[] = [];

  beforeEach(async () => {
    // Create test student
    const [student] = await db.insert(users).values({
      email: 'student@test.com',
      firstName: 'Ahmad',
      lastName: 'Rezai',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'male',
      age: 24
    }).returning();
    studentUserId = student.id;
    createdUserIds.push(studentUserId);

    // Create test teachers with different specializations
    const [teacher1] = await db.insert(users).values({
      email: 'sarah@test.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Teacher',
      password: 'hashedpassword',
      gender: 'female',
      age: 28
    }).returning();
    teacher1Id = teacher1.id;
    createdUserIds.push(teacher1Id);

    const [teacher2] = await db.insert(users).values({
      email: 'mike@test.com',
      firstName: 'Mike',
      lastName: 'Chen',
      role: 'Teacher',
      password: 'hashedpassword',
      gender: 'male',
      age: 32
    }).returning();
    teacher2Id = teacher2.id;
    createdUserIds.push(teacher2Id);

    const [teacher3] = await db.insert(users).values({
      email: 'anna@test.com',
      firstName: 'Anna',
      lastName: 'Williams',
      role: 'Teacher',
      password: 'hashedpassword',
      gender: 'female',
      age: 35
    }).returning();
    teacher3Id = teacher3.id;
    createdUserIds.push(teacher3Id);

    // Create teacher availability records
    await db.insert(teacherAvailability).values([
      {
        teacherId: teacher1Id,
        isOnline: true,
        isAvailableForCallerN: true,
        specializations: ['IELTS', 'General English'],
        languages: ['English'],
        pricePerMinute: 5000, // 5000 Toman per minute
        rating: 4.8,
        totalSessions: 150,
        isNativeSpeaker: true,
        lastActiveAt: new Date()
      },
      {
        teacherId: teacher2Id,
        isOnline: true,
        isAvailableForCallerN: true,
        specializations: ['Business English', 'Conversation'],
        languages: ['English'],
        pricePerMinute: 4500,
        rating: 4.6,
        totalSessions: 89,
        isNativeSpeaker: false,
        lastActiveAt: new Date()
      },
      {
        teacherId: teacher3Id,
        isOnline: false, // Offline teacher
        isAvailableForCallerN: false,
        specializations: ['Academic Writing', 'TOEFL'],
        languages: ['English'],
        pricePerMinute: 5500,
        rating: 4.9,
        totalSessions: 200,
        isNativeSpeaker: true,
        lastActiveAt: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 hours ago
      }
    ]);

    // Create test CallerN package
    const [callerNPackage] = await db.insert(callerNPackages).values({
      studentId: studentUserId,
      packageType: 'Standard',
      totalMinutes: 300, // 5 hours
      usedMinutes: 120, // 2 hours used
      price: 1500000, // 1.5M Toman
      purchaseDate: new Date(),
      expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      isActive: true
    }).returning();
    packageId = callerNPackage.id;

    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(callerNSessions).where(eq(callerNSessions.studentId, studentUserId));
    await db.delete(callerNPackages).where(eq(callerNPackages.id, packageId));
    await db.delete(teacherAvailability).where(inArray(teacherAvailability.teacherId, [teacher1Id, teacher2Id, teacher3Id]));
    await db.delete(users).where(inArray(users.id, createdUserIds));
    createdUserIds = [];
  });

  it('should fetch available online teachers for CallerN', async () => {
    const response = await request(app)
      .get('/api/student/online-teachers')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body.teachers)).toBe(true);
    expect(response.body.teachers.length).toBe(2); // Only online teachers

    const teachers = response.body.teachers;
    
    // Check first teacher (Sarah)
    const sarah = teachers.find((t: any) => t.firstName === 'Sarah');
    expect(sarah).toBeTruthy();
    expect(sarah.isOnline).toBe(true);
    expect(sarah.isAvailableForCallerN).toBe(true);
    expect(sarah.specializations).toContain('IELTS');
    expect(sarah.isNativeSpeaker).toBe(true);
    expect(sarah.rating).toBe(4.8);
    expect(sarah.pricePerMinute).toBe(5000);

    // Check second teacher (Mike)
    const mike = teachers.find((t: any) => t.firstName === 'Mike');
    expect(mike).toBeTruthy();
    expect(mike.isOnline).toBe(true);
    expect(mike.specializations).toContain('Business English');
    expect(mike.isNativeSpeaker).toBe(false);
    expect(mike.rating).toBe(4.6);

    // Offline teacher (Anna) should not be included
    const anna = teachers.find((t: any) => t.firstName === 'Anna');
    expect(anna).toBeFalsy();
  });

  it('should check student CallerN package status', async () => {
    const response = await request(app)
      .get('/api/student/callern-package-status')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.hasActivePackage).toBe(true);
    expect(response.body.package).toBeTruthy();
    expect(response.body.package.totalMinutes).toBe(300);
    expect(response.body.package.usedMinutes).toBe(120);
    expect(response.body.package.remainingMinutes).toBe(180);
    expect(response.body.package.packageType).toBe('Standard');
    expect(response.body.canStartSession).toBe(true);
  });

  it('should handle student without CallerN package', async () => {
    // Create student without package
    const [studentNoPackage] = await db.insert(users).values({
      email: 'nopackage@test.com',
      firstName: 'No',
      lastName: 'Package',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'female',
      age: 20
    }).returning();

    const response = await request(app)
      .get('/api/student/callern-package-status')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentNoPackage.id.toString());

    expect(response.status).toBe(200);
    expect(response.body.hasActivePackage).toBe(false);
    expect(response.body.package).toBeNull();
    expect(response.body.canStartSession).toBe(false);
    expect(response.body.redirectToPurchase).toBe(true);

    // Clean up
    await db.delete(users).where(eq(users.id, studentNoPackage.id));
  });

  it('should initiate CallerN session with available teacher', async () => {
    const sessionData = {
      teacherId: teacher1Id,
      estimatedDuration: 30, // 30 minutes
      sessionType: 'conversation',
      topic: 'IELTS Speaking Practice'
    };

    const response = await request(app)
      .post('/api/student/callern-sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString())
      .send(sessionData);

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.session).toBeTruthy();
    expect(response.body.session.teacherId).toBe(teacher1Id);
    expect(response.body.session.studentId).toBe(studentUserId);
    expect(response.body.session.status).toBe('waiting_for_teacher');
    expect(response.body.webrtcToken).toBeTruthy();
    expect(response.body.roomId).toBeTruthy();

    // Verify session was created in database
    const sessions = await db
      .select()
      .from(callerNSessions)
      .where(and(
        eq(callerNSessions.studentId, studentUserId),
        eq(callerNSessions.teacherId, teacher1Id)
      ));
    
    expect(sessions).toHaveLength(1);
    expect(sessions[0].sessionType).toBe('conversation');
    expect(sessions[0].topic).toBe('IELTS Speaking Practice');
  });

  it('should prevent session start with offline teacher', async () => {
    const sessionData = {
      teacherId: teacher3Id, // Offline teacher
      estimatedDuration: 30,
      sessionType: 'conversation',
      topic: 'Academic Writing Help'
    };

    const response = await request(app)
      .post('/api/student/callern-sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString())
      .send(sessionData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Teacher is not available');
  });

  it('should prevent session start without sufficient package minutes', async () => {
    // Update package to have insufficient minutes
    await db
      .update(callerNPackages)
      .set({ 
        usedMinutes: 295, // 295 out of 300 used (only 5 minutes left)
        updatedAt: new Date()
      })
      .where(eq(callerNPackages.id, packageId));

    const sessionData = {
      teacherId: teacher1Id,
      estimatedDuration: 30, // Requesting 30 minutes but only 5 available
      sessionType: 'conversation',
      topic: 'IELTS Speaking Practice'
    };

    const response = await request(app)
      .post('/api/student/callern-sessions/start')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString())
      .send(sessionData);

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Insufficient package minutes');
    expect(response.body.remainingMinutes).toBe(5);
    expect(response.body.requestedMinutes).toBe(30);
  });

  it('should filter teachers by specialization', async () => {
    const response = await request(app)
      .get('/api/student/online-teachers')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString())
      .query({ specialization: 'IELTS' });

    expect(response.status).toBe(200);
    expect(response.body.teachers.length).toBe(1);
    
    const teacher = response.body.teachers[0];
    expect(teacher.firstName).toBe('Sarah');
    expect(teacher.specializations).toContain('IELTS');
  });

  it('should sort teachers by rating and availability', async () => {
    const response = await request(app)
      .get('/api/student/online-teachers')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString())
      .query({ sortBy: 'rating' });

    expect(response.status).toBe(200);
    expect(response.body.teachers.length).toBe(2);
    
    // Sarah (4.8 rating) should come before Mike (4.6 rating)
    expect(response.body.teachers[0].firstName).toBe('Sarah');
    expect(response.body.teachers[0].rating).toBe(4.8);
    expect(response.body.teachers[1].firstName).toBe('Mike');
    expect(response.body.teachers[1].rating).toBe(4.6);
  });

  it('should get teacher detailed profile for CallerN', async () => {
    const response = await request(app)
      .get(`/api/student/teachers/${teacher1Id}/callern-profile`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.teacher).toBeTruthy();
    expect(response.body.teacher.id).toBe(teacher1Id);
    expect(response.body.teacher.firstName).toBe('Sarah');
    expect(response.body.teacher.lastName).toBe('Johnson');
    expect(response.body.teacher.isOnline).toBe(true);
    expect(response.body.teacher.specializations).toEqual(['IELTS', 'General English']);
    expect(response.body.teacher.pricePerMinute).toBe(5000);
    expect(response.body.teacher.totalSessions).toBe(150);
    expect(response.body.teacher.isNativeSpeaker).toBe(true);
    expect(response.body.estimatedCost30Min).toBe(150000); // 30 * 5000
    expect(response.body.estimatedCost60Min).toBe(300000); // 60 * 5000
  });

  it('should update teacher online status', async () => {
    // Teacher goes offline
    const response = await request(app)
      .post(`/api/teacher/availability/status`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', teacher1Id.toString())
      .send({ 
        isOnline: false,
        isAvailableForCallerN: false 
      });

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);

    // Verify teacher is no longer available
    const teachersResponse = await request(app)
      .get('/api/student/online-teachers')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(teachersResponse.status).toBe(200);
    expect(teachersResponse.body.teachers.length).toBe(1); // Only Mike available now
    expect(teachersResponse.body.teachers[0].firstName).toBe('Mike');
  });
});