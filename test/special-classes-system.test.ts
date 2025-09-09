import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import request from 'supertest';
import { app } from '../server/index';
import { db } from '../server/db';
import { users, courses, specialClasses, classEnrollments } from '@shared/schema';
import { eq, inArray } from 'drizzle-orm';

describe('Special Classes Display System - Admin Featured Classes', () => {
  let authToken: string;
  let adminUserId: number;
  let studentUserId: number;
  let instructorUserId: number;
  let courseId: number;
  let specialClassId: number;
  let createdUserIds: number[] = [];

  beforeEach(async () => {
    // Create test admin user
    const [admin] = await db.insert(users).values({
      email: 'admin@test.com',
      firstName: 'Admin',
      lastName: 'User',
      role: 'Admin',
      password: 'hashedpassword',
      gender: 'male',
      age: 35
    }).returning();
    adminUserId = admin.id;
    createdUserIds.push(adminUserId);

    // Create test student
    const [student] = await db.insert(users).values({
      email: 'student@test.com',
      firstName: 'Test',
      lastName: 'Student',
      role: 'Student',
      password: 'hashedpassword',
      gender: 'female',
      age: 22
    }).returning();
    studentUserId = student.id;
    createdUserIds.push(studentUserId);

    // Create test instructor
    const [instructor] = await db.insert(users).values({
      email: 'instructor@test.com',
      firstName: 'Sarah',
      lastName: 'Johnson',
      role: 'Teacher',
      password: 'hashedpassword',
      gender: 'female',
      age: 30
    }).returning();
    instructorUserId = instructor.id;
    createdUserIds.push(instructorUserId);

    // Create test course
    const [course] = await db.insert(courses).values({
      title: 'Business English Advanced',
      description: 'Advanced business communication skills',
      level: 'Advanced',
      language: 'English',
      price: 1000000, // 1,000,000 Toman
      instructorId: instructorUserId,
      deliveryMode: 'online',
      classFormat: 'group',
      totalSessions: 8,
      sessionDuration: 90
    }).returning();
    courseId = course.id;

    // Create special class
    const [specialClass] = await db.insert(specialClasses).values({
      courseId: courseId,
      title: 'انگلیسی تجاری پیشرفته - ویژه',
      description: 'کلاس ویژه با استاد بومی و تخفیف 25 درصد',
      badge: 'Featured',
      badgeColor: 'blue',
      priority: 5,
      isActive: true,
      maxEnrollments: 12,
      currentEnrollments: 8,
      discountPercentage: 25,
      originalPrice: 1000000,
      specialFeatures: ['Native Speaker', 'Certificate', 'Small Class'],
      targetAudience: 'Business Professionals',
      createdBy: adminUserId
    }).returning();
    specialClassId = specialClass.id;

    authToken = 'mock-jwt-token';
  });

  afterEach(async () => {
    // Clean up test data
    await db.delete(classEnrollments).where(eq(classEnrollments.studentId, studentUserId));
    await db.delete(specialClasses).where(eq(specialClasses.id, specialClassId));
    await db.delete(courses).where(eq(courses.id, courseId));
    await db.delete(users).where(inArray(users.id, createdUserIds));
    createdUserIds = [];
  });

  it('should fetch special classes for student dashboard', async () => {
    const response = await request(app)
      .get('/api/student/special-classes')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBeGreaterThan(0);

    const specialClass = response.body[0];
    expect(specialClass.id).toBe(specialClassId);
    expect(specialClass.title).toBe('انگلیسی تجاری پیشرفته - ویژه');
    expect(specialClass.badge).toBe('Featured');
    expect(specialClass.discountPercentage).toBe(25);
    expect(specialClass.originalPrice).toBe(1000000);
    expect(specialClass.finalPrice).toBe(750000); // 25% discount applied
    expect(specialClass.isAvailable).toBe(true);
    expect(specialClass.spotsLeft).toBe(4); // 12 max - 8 current = 4 left
    expect(specialClass.specialFeatures).toContain('Native Speaker');
    expect(specialClass.instructorFullName).toBe('Sarah Johnson');
  });

  it('should calculate discount pricing correctly', async () => {
    // Create another special class with different discount
    const [discountClass] = await db.insert(specialClasses).values({
      courseId: courseId,
      title: 'IELTS Preparation Special',
      description: '50% discount for limited time',
      badge: 'Limited Time',
      badgeColor: 'red',
      priority: 10,
      isActive: true,
      maxEnrollments: 20,
      currentEnrollments: 5,
      discountPercentage: 50,
      originalPrice: 1500000,
      specialFeatures: ['IELTS Certified', 'Mock Tests'],
      targetAudience: 'IELTS Candidates',
      createdBy: adminUserId
    }).returning();

    const response = await request(app)
      .get('/api/student/special-classes')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    
    const discountedClass = response.body.find((c: any) => c.id === discountClass.id);
    expect(discountedClass).toBeTruthy();
    expect(discountedClass.discountPercentage).toBe(50);
    expect(discountedClass.finalPrice).toBe(750000); // 50% of 1,500,000
    expect(discountedClass.spotsLeft).toBe(15); // 20 max - 5 current = 15

    // Clean up
    await db.delete(specialClasses).where(eq(specialClasses.id, discountClass.id));
  });

  it('should enroll student in special class successfully', async () => {
    const response = await request(app)
      .post(`/api/student/special-classes/${specialClassId}/enroll`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
    expect(response.body.message).toContain('Successfully enrolled');
    expect(response.body.finalPrice).toBe(750000);
    expect(response.body.originalPrice).toBe(1000000);
    expect(response.body.discount).toBe(25);

    // Verify enrollment was created
    const enrollments = await db
      .select()
      .from(classEnrollments)
      .where(eq(classEnrollments.studentId, studentUserId));
    
    expect(enrollments).toHaveLength(1);
    expect(enrollments[0].courseId).toBe(courseId);
    expect(enrollments[0].paymentAmount).toBe(750000);
    expect(enrollments[0].status).toBe('active');

    // Verify special class enrollment count updated
    const [updatedSpecialClass] = await db
      .select()
      .from(specialClasses)
      .where(eq(specialClasses.id, specialClassId));
    
    expect(updatedSpecialClass.currentEnrollments).toBe(9); // Was 8, now 9
  });

  it('should prevent enrollment when class is full', async () => {
    // Update special class to be full
    await db
      .update(specialClasses)
      .set({ 
        currentEnrollments: 12, // Equal to maxEnrollments
        updatedAt: new Date()
      })
      .where(eq(specialClasses.id, specialClassId));

    const response = await request(app)
      .post(`/api/student/special-classes/${specialClassId}/enroll`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('Special class is full');
  });

  it('should prevent duplicate enrollment', async () => {
    // First enrollment
    await request(app)
      .post(`/api/student/special-classes/${specialClassId}/enroll`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    // Attempt duplicate enrollment
    const response = await request(app)
      .post(`/api/student/special-classes/${specialClassId}/enroll`)
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(400);
    expect(response.body.error).toContain('already enrolled');
  });

  it('should handle special class availability correctly', async () => {
    // Create limited availability class
    const [limitedClass] = await db.insert(specialClasses).values({
      courseId: courseId,
      title: 'Exclusive Small Group',
      description: 'Only 3 spots available',
      badge: 'Exclusive',
      badgeColor: 'purple',
      priority: 8,
      isActive: true,
      maxEnrollments: 3,
      currentEnrollments: 2,
      discountPercentage: 30,
      originalPrice: 2000000,
      specialFeatures: ['Exclusive', 'Personal Attention'],
      targetAudience: 'VIP Students',
      createdBy: adminUserId
    }).returning();

    const response = await request(app)
      .get('/api/student/special-classes')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    
    const limitedClassData = response.body.find((c: any) => c.id === limitedClass.id);
    expect(limitedClassData).toBeTruthy();
    expect(limitedClassData.isAvailable).toBe(true);
    expect(limitedClassData.spotsLeft).toBe(1); // 3 max - 2 current = 1 left
    expect(limitedClassData.maxEnrollments).toBe(3);
    expect(limitedClassData.currentEnrollments).toBe(2);

    // Clean up
    await db.delete(specialClasses).where(eq(specialClasses.id, limitedClass.id));
  });

  it('should prioritize special classes by priority value', async () => {
    // Create high priority class
    const [highPriorityClass] = await db.insert(specialClasses).values({
      courseId: courseId,
      title: 'High Priority Class',
      description: 'Should appear first',
      badge: 'Hot',
      badgeColor: 'red',
      priority: 10, // Higher than existing class (priority: 5)
      isActive: true,
      maxEnrollments: 15,
      currentEnrollments: 3,
      discountPercentage: 35,
      originalPrice: 1200000,
      specialFeatures: ['Priority', 'Top Quality'],
      targetAudience: 'All Levels',
      createdBy: adminUserId
    }).returning();

    const response = await request(app)
      .get('/api/student/special-classes')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    expect(response.body.length).toBeGreaterThanOrEqual(2);
    
    // High priority class should appear first
    expect(response.body[0].id).toBe(highPriorityClass.id);
    expect(response.body[0].priority).toBe(10);
    
    // Lower priority class should appear after
    const lowerPriorityIndex = response.body.findIndex((c: any) => c.id === specialClassId);
    expect(lowerPriorityIndex).toBeGreaterThan(0);

    // Clean up
    await db.delete(specialClasses).where(eq(specialClasses.id, highPriorityClass.id));
  });

  it('should handle inactive special classes correctly', async () => {
    // Deactivate the special class
    await db
      .update(specialClasses)
      .set({ 
        isActive: false,
        updatedAt: new Date()
      })
      .where(eq(specialClasses.id, specialClassId));

    const response = await request(app)
      .get('/api/student/special-classes')
      .set('Authorization', `Bearer ${authToken}`)
      .set('x-test-user-id', studentUserId.toString());

    expect(response.status).toBe(200);
    
    // Inactive class should not appear in results
    const inactiveClass = response.body.find((c: any) => c.id === specialClassId);
    expect(inactiveClass).toBeFalsy();
  });
});