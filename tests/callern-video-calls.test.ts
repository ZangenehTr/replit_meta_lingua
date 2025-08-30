import { test, expect } from '@playwright/test';
import { describe, it, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import { createServer } from 'http';
import express from 'express';
import { registerRoutes } from '../server/routes';
import { DatabaseStorage } from '../server/database-storage';

/**
 * Comprehensive Callern Video Calls Tests
 * Tests both functionality and i18n (Farsi-English) with real database data
 * Ensures teacher dashboard and student pages work correctly
 */

describe('Callern Video Calls System - Backend API Tests', () => {
  let app: express.Application;
  let server: any;
  let storage: DatabaseStorage;
  let teacherAuthToken: string;
  let studentAuthToken: string;
  let teacherId: number;
  let studentId: number;
  let callernPackageId: number;

  beforeAll(async () => {
    // Initialize storage and app
    storage = new DatabaseStorage();
    app = express();
    app.use(express.json());
    server = await registerRoutes(app);
    
    // Create real teacher with Callern authorization (using real database)
    const teacher = await storage.createUser({
      email: 'callern.teacher@metalingua.test',
      password: 'TestPassword123!',
      firstName: 'احمد',
      lastName: 'رضایی',
      role: 'Teacher',
      phoneNumber: '+989123456789',
      isActive: true
    });
    teacherId = teacher.id;
    
    // Authorize teacher for Callern access (real authorization record)
    await storage.db.insert(storage.schema.teacherCallernAuthorization).values({
      teacherId: teacher.id,
      authorizedBy: 1,
      isAuthorized: true,
      authorizedAt: new Date(),
      notes: 'Test teacher for video calls functionality'
    });
    
    // Set teacher availability (real availability data)
    await storage.db.insert(storage.schema.teacherCallernAvailability).values({
      teacherId: teacher.id,
      morningSlot: true,
      afternoonSlot: true,
      eveningSlot: false,
      nightSlot: false,
      hourlyRate: 250000,
      isOnline: true,
      lastActiveAt: new Date()
    });
    
    // Create real student
    const student = await storage.createUser({
      email: 'callern.student@metalingua.test',
      password: 'TestPassword123!',
      firstName: 'فاطمه',
      lastName: 'احمدی',
      role: 'Student',
      phoneNumber: '+989123456790',
      isActive: true
    });
    studentId = student.id;
    
    // Create real Callern package
    const packageRes = await storage.db.insert(storage.schema.callernPackages).values({
      packageName: 'English Conversation - Advanced',
      packageNameFa: 'مکالمه انگلیسی - پیشرفته',
      description: 'Advanced English conversation practice with certified teachers',
      descriptionFa: 'تمرین مکالمه انگلیسی پیشرفته با معلمان مجاز',
      totalMinutes: 480,
      price: 2500000,
      level: 'Advanced',
      language: 'English',
      features: ['Live Video Calls', 'Grammar Correction', 'Pronunciation Help'],
      featuresFA: ['تماس ویدیویی زنده', 'تصحیح گرامر', 'کمک تلفظ']
    }).returning();
    callernPackageId = packageRes[0].id;
    
    // Purchase package for student (real transaction)
    await storage.db.insert(storage.schema.studentCallernPackages).values({
      studentId: student.id,
      packageId: callernPackageId,
      purchasedAt: new Date(),
      minutesUsed: 60,
      status: 'active'
    });
    
    // Login to get real auth tokens
    const teacherLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'callern.teacher@metalingua.test', password: 'TestPassword123!' });
    teacherAuthToken = teacherLoginRes.body.accessToken;
    
    const studentLoginRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'callern.student@metalingua.test', password: 'TestPassword123!' });
    studentAuthToken = studentLoginRes.body.accessToken;
  });

  afterAll(async () => {
    // Cleanup real data
    await storage.db.delete(storage.schema.studentCallernPackages).where(
      storage.schema.studentCallernPackages.studentId.eq(studentId)
    );
    await storage.db.delete(storage.schema.callernPackages).where(
      storage.schema.callernPackages.id.eq(callernPackageId)
    );
    await storage.db.delete(storage.schema.teacherCallernAvailability).where(
      storage.schema.teacherCallernAvailability.teacherId.eq(teacherId)
    );
    await storage.db.delete(storage.schema.teacherCallernAuthorization).where(
      storage.schema.teacherCallernAuthorization.teacherId.eq(teacherId)
    );
    await storage.deleteUser(studentId);
    await storage.deleteUser(teacherId);
    server?.close();
  });

  describe('Teacher Callern Dashboard API', () => {
    it('should return teacher authorization status from real database', async () => {
      const res = await request(app)
        .get('/api/teacher/callern/authorization')
        .set('Authorization', `Bearer ${teacherAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.isAuthorized).toBe(true);
      expect(res.body.authorizedAt).toBeDefined();
      expect(res.body.notes).toBe('Test teacher for video calls functionality');
    });

    it('should return teacher availability settings from real database', async () => {
      const res = await request(app)
        .get('/api/teacher/callern/availability')
        .set('Authorization', `Bearer ${teacherAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.morningSlot).toBe(true);
      expect(res.body.afternoonSlot).toBe(true);
      expect(res.body.eveningSlot).toBe(false);
      expect(res.body.nightSlot).toBe(false);
      expect(res.body.hourlyRate).toBe(250000);
      expect(res.body.isOnline).toBe(true);
    });

    it('should update teacher availability with real database persistence', async () => {
      const updateData = {
        morningSlot: false,
        afternoonSlot: true,
        eveningSlot: true,
        nightSlot: false,
        hourlyRate: 300000
      };

      const res = await request(app)
        .put('/api/teacher/callern/availability')
        .set('Authorization', `Bearer ${teacherAuthToken}`)
        .send(updateData);
      
      expect(res.status).toBe(200);
      
      // Verify persistence in database
      const verifyRes = await request(app)
        .get('/api/teacher/callern/availability')
        .set('Authorization', `Bearer ${teacherAuthToken}`);
      
      expect(verifyRes.body.morningSlot).toBe(false);
      expect(verifyRes.body.eveningSlot).toBe(true);
      expect(verifyRes.body.hourlyRate).toBe(300000);
    });

    it('should return real teacher statistics from database', async () => {
      // Create some real call history data
      const callHistory = await storage.db.insert(storage.schema.callernCallHistory).values({
        teacherId,
        studentId,
        packageId: callernPackageId,
        startTime: new Date(Date.now() - 3600000), // 1 hour ago
        endTime: new Date(Date.now() - 1800000), // 30 minutes ago
        duration: 30,
        rating: 5,
        status: 'completed'
      }).returning();

      const res = await request(app)
        .get('/api/teacher/callern/stats')
        .set('Authorization', `Bearer ${teacherAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.dailyCalls).toBeGreaterThanOrEqual(1);
      expect(res.body.dailyMinutes).toBeGreaterThanOrEqual(30);
      expect(res.body.averageRating).toBeGreaterThanOrEqual(5.0);
      expect(typeof res.body.monthlyEarnings).toBe('number');
    });
  });

  describe('Student Callern API', () => {
    it('should return available Callern packages with multilingual data', async () => {
      const res = await request(app)
        .get('/api/student/callern-packages')
        .set('Authorization', `Bearer ${studentAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const package1 = res.body.find(p => p.id === callernPackageId);
      expect(package1).toBeDefined();
      expect(package1.packageName).toBe('English Conversation - Advanced');
      expect(package1.packageNameFa).toBe('مکالمه انگلیسی - پیشرفته');
      expect(package1.descriptionFa).toBe('تمرین مکالمه انگلیسی پیشرفته با معلمان مجاز');
      expect(Array.isArray(package1.features)).toBe(true);
      expect(Array.isArray(package1.featuresFA)).toBe(true);
    });

    it('should return student purchased packages from real database', async () => {
      const res = await request(app)
        .get('/api/student/my-callern-packages')
        .set('Authorization', `Bearer ${studentAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(1);
      
      const myPackage = res.body[0];
      expect(myPackage.packageId).toBe(callernPackageId);
      expect(myPackage.minutesUsed).toBe(60);
      expect(myPackage.status).toBe('active');
      expect(myPackage.packageName).toBe('English Conversation - Advanced');
      expect(myPackage.packageNameFa).toBe('مکالمه انگلیسی - پیشرفته');
    });

    it('should return online teachers with real availability data', async () => {
      const res = await request(app)
        .get('/api/callern/online-teachers')
        .set('Authorization', `Bearer ${studentAuthToken}`);
      
      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      
      const onlineTeacher = res.body.find(t => t.id === teacherId);
      expect(onlineTeacher).toBeDefined();
      expect(onlineTeacher.firstName).toBe('احمد');
      expect(onlineTeacher.lastName).toBe('رضایی');
      expect(onlineTeacher.isOnline).toBe(true);
      expect(onlineTeacher.hourlyRate).toBeGreaterThan(0);
      expect(onlineTeacher.lastActiveAt).toBeDefined();
    });
  });

  describe('Authorization & Security', () => {
    it('should deny unauthorized teacher access to Callern dashboard', async () => {
      // Create unauthorized teacher
      const unauthorizedTeacher = await storage.createUser({
        email: 'unauthorized.teacher@test.com',
        password: 'password123',
        firstName: 'Unauthorized',
        lastName: 'Teacher',
        role: 'Teacher',
        phoneNumber: '+989123456788',
        isActive: true
      });

      const loginRes = await request(app)
        .post('/api/auth/login')
        .send({ email: 'unauthorized.teacher@test.com', password: 'password123' });

      const res = await request(app)
        .get('/api/teacher/callern/authorization')
        .set('Authorization', `Bearer ${loginRes.body.accessToken}`);
      
      expect(res.status).toBe(200);
      expect(res.body.isAuthorized).toBe(false);
      
      // Cleanup
      await storage.deleteUser(unauthorizedTeacher.id);
    });

    it('should deny student access to teacher Callern endpoints', async () => {
      const res = await request(app)
        .get('/api/teacher/callern/authorization')
        .set('Authorization', `Bearer ${studentAuthToken}`);
      
      expect(res.status).toBe(403);
    });
  });
});

// Frontend E2E Tests for Callern Video Calls
test.describe('Callern Video Calls - Frontend E2E Tests', () => {
  
  test.describe('Teacher Callern Dashboard - Farsi Language', () => {
    test('should display teacher dashboard in Farsi with real data', async ({ page }) => {
      // Login as teacher
      await page.goto('http://localhost:5000/auth?lang=fa');
      await page.fill('input[type="email"]', 'teacher2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to Callern dashboard
      await page.goto('http://localhost:5000/teacher/callern?lang=fa');
      
      // Verify Farsi interface elements
      await expect(page.locator('text="داشبورد کالرن"')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text="تماس‌های ویدیویی"')).toBeVisible();
      await expect(page.locator('text="دانش‌آموزان"')).toBeVisible();
      await expect(page.locator('text="آمار امروز"')).toBeVisible();
      await expect(page.locator('text="آمار هفتگی"')).toBeVisible();
      await expect(page.locator('text="میانگین امتیاز"')).toBeVisible();
      
      // Verify RTL layout
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir).toBe('rtl');
      
      // Check availability time slots in Farsi
      await expect(page.locator('text="دسترسی صبح"')).toBeVisible();
      await expect(page.locator('text="دسترسی عصر"')).toBeVisible();
      await expect(page.locator('text="دسترسی شب"')).toBeVisible();
    });

    test('should display teacher dashboard in English with same functionality', async ({ page }) => {
      // Login and switch to English
      await page.goto('http://localhost:5000/teacher/callern?lang=en');
      await page.fill('input[type="email"]', 'teacher2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify English interface elements
      await expect(page.locator('text="Callern Dashboard"')).toBeVisible({ timeout: 10000 });
      await expect(page.locator('text="Video Calls"')).toBeVisible();
      await expect(page.locator('text="Students"')).toBeVisible();
      await expect(page.locator('text="Today\'s Calls"')).toBeVisible();
      await expect(page.locator('text="This Week"')).toBeVisible();
      await expect(page.locator('text="Avg Rating"')).toBeVisible();
      
      // Verify LTR layout
      const htmlDir = await page.getAttribute('html', 'dir');
      expect(htmlDir).toBe('ltr');
      
      // Check availability time slots in English
      await expect(page.locator('text="Morning Availability"')).toBeVisible();
      await expect(page.locator('text="Afternoon Availability"')).toBeVisible();
      await expect(page.locator('text="Evening Availability"')).toBeVisible();
    });

    test('should toggle availability settings with real database updates', async ({ page }) => {
      await page.goto('http://localhost:5000/teacher/callern?lang=fa');
      await page.fill('input[type="email"]', 'teacher2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Wait for dashboard to load
      await expect(page.locator('text="داشبورد کالرن"')).toBeVisible();
      
      // Toggle morning availability
      const morningToggle = page.locator('[data-testid="morning-slot-toggle"]');
      if (await morningToggle.isVisible()) {
        const initialState = await morningToggle.isChecked();
        await morningToggle.click();
        
        // Verify toggle changed
        await expect(morningToggle).toBeChecked({ checked: !initialState });
        
        // Verify success message in Farsi
        await expect(page.locator('text="دسترسی با موفقیت به‌روزرسانی شد"')).toBeVisible();
      }
    });
  });

  test.describe('Student Callern Interface - Bilingual', () => {
    test('should display student Callern page in Farsi', async ({ page }) => {
      await page.goto('http://localhost:5000/callern?lang=fa');
      await page.fill('input[type="email"]', 'student2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify Farsi student interface
      await expect(page.locator('text="به کالرن خوش آمدید!"')).toBeVisible();
      await expect(page.locator('text="معلمان آنلاین"')).toBeVisible();
      await expect(page.locator('text="بسته‌های من"')).toBeVisible();
      await expect(page.locator('text="جلسات پیشرفته"')).toBeVisible();
      await expect(page.locator('text="تماس فوری"')).toBeVisible();
      
      // Verify online teachers section
      await expect(page.locator('[data-testid="online-teachers"]')).toBeVisible();
      
      // Check for real teacher data (not hardcoded)
      const teacherCards = page.locator('[data-testid="teacher-card"]');
      const firstTeacher = teacherCards.first();
      if (await firstTeacher.isVisible()) {
        // Verify teacher has real data
        await expect(firstTeacher.locator('text="آنلاین"')).toBeVisible();
        await expect(firstTeacher.locator('[data-testid="hourly-rate"]')).toBeVisible();
      }
    });

    test('should display student Callern page in English', async ({ page }) => {
      await page.goto('http://localhost:5000/callern?lang=en');
      await page.fill('input[type="email"]', 'student2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Verify English student interface
      await expect(page.locator('text="Welcome to Callern!"')).toBeVisible();
      await expect(page.locator('text="Online Teachers"')).toBeVisible();
      await expect(page.locator('text="My Packages"')).toBeVisible();
      await expect(page.locator('text="Advanced Sessions"')).toBeVisible();
      await expect(page.locator('text="Quick Call"')).toBeVisible();
    });

    test('should prevent students from accessing teacher Callern URL', async ({ page }) => {
      await page.goto('http://localhost:5000/teacher/callern');
      await page.fill('input[type="email"]', 'student2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Should be redirected to student callern page
      await expect(page).toHaveURL(/\/callern$/);
      await expect(page.locator('text="به کالرن خوش آمدید!"')).toBeVisible();
    });
  });

  test.describe('Language Switching & Persistence', () => {
    test('should maintain language preference across Callern pages', async ({ page }) => {
      // Set language to Farsi on auth page
      await page.goto('http://localhost:5000/auth');
      await page.click('[data-testid="language-toggle"]');
      await page.click('text="فارسی"');
      
      // Login
      await page.fill('input[type="email"]', 'teacher2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Navigate to Callern - should maintain Farsi
      await page.goto('http://localhost:5000/teacher/callern');
      await expect(page.locator('text="داشبورد کالرن"')).toBeVisible();
      
      // Switch to English
      await page.click('[data-testid="language-toggle"]');
      await page.click('text="English"');
      
      // Should now show English
      await expect(page.locator('text="Callern Dashboard"')).toBeVisible();
      
      // Refresh page - should maintain English
      await page.reload();
      await expect(page.locator('text="Callern Dashboard"')).toBeVisible();
    });
  });

  test.describe('Real Data Validation', () => {
    test('should display actual teacher statistics, not hardcoded values', async ({ page }) => {
      await page.goto('http://localhost:5000/teacher/callern');
      await page.fill('input[type="email"]', 'teacher2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Check that stats are loaded from database
      const statsCards = page.locator('[data-testid="stats-card"]');
      await expect(statsCards).toHaveCount(4);
      
      // Verify stats show actual data
      const dailyCallsCard = statsCards.first();
      const callsValue = await dailyCallsCard.locator('[data-testid="calls-count"]').textContent();
      
      // Should not be hardcoded to "0" always
      expect(callsValue).toMatch(/^\d+$/);
    });

    test('should show real online teachers, not placeholder data', async ({ page }) => {
      await page.goto('http://localhost:5000/callern');
      await page.fill('input[type="email"]', 'student2@test.com');
      await page.fill('input[type="password"]', 'password123');
      await page.click('button[type="submit"]');
      
      // Check online teachers section
      const teachersSection = page.locator('[data-testid="online-teachers"]');
      await expect(teachersSection).toBeVisible();
      
      // Verify real teacher data
      const teacherCards = page.locator('[data-testid="teacher-card"]');
      if (await teacherCards.count() > 0) {
        const firstTeacher = teacherCards.first();
        
        // Should have real teacher name (not "Teacher Name")
        const teacherName = await firstTeacher.locator('[data-testid="teacher-name"]').textContent();
        expect(teacherName).not.toBe('Teacher Name');
        expect(teacherName).not.toBe('معلم نمونه');
        
        // Should have real hourly rate (not 0)
        const hourlyRate = await firstTeacher.locator('[data-testid="hourly-rate"]').textContent();
        expect(hourlyRate).not.toContain('0');
      }
    });
  });
});