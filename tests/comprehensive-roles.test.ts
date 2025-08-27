import { test, expect } from '@playwright/test';
import { db } from '../server/db';
import { users, students, teachers, courses, enrollments, classes, tests as testsTable, payments, wallets, callernPackages } from '../shared/schema';
import { eq } from 'drizzle-orm';

// Test data from actual database
let testUsers: any = {};
let testData: any = {};

test.beforeAll(async () => {
  // Get real users from each role from the database
  const adminUser = await db.select().from(users).where(eq(users.role, 'admin')).limit(1);
  const teacherUser = await db.select().from(users).where(eq(users.role, 'teacher')).limit(1);
  const studentUser = await db.select().from(users).where(eq(users.role, 'student')).limit(1);
  const mentorUser = await db.select().from(users).where(eq(users.role, 'mentor')).limit(1);
  const supervisorUser = await db.select().from(users).where(eq(users.role, 'supervisor')).limit(1);
  const callcenterUser = await db.select().from(users).where(eq(users.role, 'callcenter')).limit(1);
  const accountantUser = await db.select().from(users).where(eq(users.role, 'accountant')).limit(1);
  
  testUsers = {
    admin: adminUser[0],
    teacher: teacherUser[0],
    student: studentUser[0],
    mentor: mentorUser[0],
    supervisor: supervisorUser[0],
    callcenter: callcenterUser[0],
    accountant: accountantUser[0]
  };

  // Get real test data from database
  const realCourses = await db.select().from(courses).limit(5);
  const realClasses = await db.select().from(classes).limit(5);
  const realTests = await db.select().from(testsTable).limit(5);
  const realPayments = await db.select().from(payments).limit(5);
  
  testData = {
    courses: realCourses,
    classes: realClasses,
    tests: realTests,
    payments: realPayments
  };
});

// Helper function to login
async function login(page: any, email: string, password: string) {
  await page.goto('http://localhost:5000/auth');
  await page.fill('input[type="email"]', email);
  await page.fill('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
}

// Helper function to check if element is mobile-optimized
async function checkMobileOptimization(page: any) {
  // Set mobile viewport
  await page.setViewportSize({ width: 375, height: 812 });
  
  // Check for responsive classes
  const hasResponsiveClasses = await page.evaluate(() => {
    const elements = document.querySelectorAll('[class*="sm:"], [class*="md:"], [class*="lg:"]');
    return elements.length > 0;
  });
  
  // Check for mobile navigation
  const hasMobileNav = await page.evaluate(() => {
    const bottomNav = document.querySelector('[class*="fixed bottom-0"]');
    const hamburger = document.querySelector('[class*="md:hidden"]');
    return bottomNav !== null || hamburger !== null;
  });
  
  return hasResponsiveClasses && hasMobileNav;
}

// 1. ADMIN ROLE TESTS
test.describe('Admin Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.admin) {
      await login(page, testUsers.admin.email, 'password123');
    }
  });

  test('Admin Dashboard - All Components Load', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/dashboard');
    
    // Check all key metrics are loaded from real data
    await expect(page.locator('[data-testid="total-students"]')).toBeVisible();
    await expect(page.locator('[data-testid="active-teachers"]')).toBeVisible();
    await expect(page.locator('[data-testid="revenue-chart"]')).toBeVisible();
    await expect(page.locator('[data-testid="enrollment-stats"]')).toBeVisible();
    
    // Check mobile optimization
    const isMobileOptimized = await checkMobileOptimization(page);
    expect(isMobileOptimized).toBe(true);
  });

  test('Admin - Student Management CRUD', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/students');
    
    // Test search with real student data
    const realStudent = await db.select().from(students).limit(1);
    if (realStudent[0]) {
      await page.fill('input[placeholder*="Search"]', realStudent[0].firstName);
      await page.waitForTimeout(500);
      await expect(page.locator(`text="${realStudent[0].firstName}"`)).toBeVisible();
    }
    
    // Test add student button
    await page.click('button:has-text("Add Student")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Test edit functionality
    await page.click('button[aria-label="Edit"]:first');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Test delete with confirmation
    await page.click('button[aria-label="Delete"]:first');
    await expect(page.locator('text="Are you sure"')).toBeVisible();
  });

  test('Admin - Course Management', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/courses');
    
    // Check real courses are displayed
    if (testData.courses.length > 0) {
      await expect(page.locator(`text="${testData.courses[0].title}"`)).toBeVisible();
    }
    
    // Test create course
    await page.click('button:has-text("Create Course")');
    await page.fill('input[name="title"]', 'Test Course from Real Admin');
    await page.fill('textarea[name="description"]', 'This is a real test course');
    await page.fill('input[name="price"]', '500000');
    await page.selectOption('select[name="level"]', 'intermediate');
    await page.click('button:has-text("Save")');
    
    // Verify course was created
    await expect(page.locator('text="Course created successfully"')).toBeVisible();
  });

  test('Admin - Financial Reports', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/financial');
    
    // Check real payment data is displayed
    await expect(page.locator('[data-testid="revenue-summary"]')).toBeVisible();
    await expect(page.locator('[data-testid="payment-history"]')).toBeVisible();
    
    // Test export functionality
    await page.click('button:has-text("Export")');
    await expect(page.locator('text="Report exported"')).toBeVisible();
  });

  test('Admin - Iranian Compliance Settings', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/iranian-compliance-settings');
    
    // Test all tabs
    const tabs = ['VoIP', 'Shetab', 'SMS', 'General', 'AI Services'];
    for (const tab of tabs) {
      await page.click(`button:has-text("${tab}")`);
      await page.waitForTimeout(200);
    }
    
    // Test Ollama connection
    await page.click('button:has-text("AI Services")');
    await page.click('button:has-text("Test Connection")');
    await page.waitForTimeout(1000);
  });
});

// 2. TEACHER ROLE TESTS  
test.describe('Teacher Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.teacher) {
      await login(page, testUsers.teacher.email, 'password123');
    }
  });

  test('Teacher Dashboard - Professional Indicators', async ({ page }) => {
    await page.goto('http://localhost:5000/teacher/dashboard');
    
    // Check professional indicators
    await expect(page.locator('[data-testid="teaching-hours"]')).toBeVisible();
    await expect(page.locator('[data-testid="student-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-classes"]')).toBeVisible();
    await expect(page.locator('[data-testid="earnings-summary"]')).toBeVisible();
    
    // Check mobile optimization
    const isMobileOptimized = await checkMobileOptimization(page);
    expect(isMobileOptimized).toBe(true);
  });

  test('Teacher - Class Management', async ({ page }) => {
    await page.goto('http://localhost:5000/teacher/classes');
    
    // Check real classes assigned to teacher
    const teacherClasses = await db.select().from(classes)
      .where(eq(classes.teacherId, testUsers.teacher.id))
      .limit(5);
    
    if (teacherClasses.length > 0) {
      await expect(page.locator(`text="${teacherClasses[0].name}"`)).toBeVisible();
    }
    
    // Test attendance marking
    await page.click('button:has-text("Mark Attendance")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('Teacher - Callern Service', async ({ page }) => {
    await page.goto('http://localhost:5000/teacher/callern');
    
    // Check availability toggle
    await expect(page.locator('[data-testid="availability-toggle"]')).toBeVisible();
    
    // Check call history
    await expect(page.locator('[data-testid="call-history"]')).toBeVisible();
    
    // Test set availability
    await page.click('button:has-text("Set Schedule")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
  });

  test('Teacher - Test Creation', async ({ page }) => {
    await page.goto('http://localhost:5000/teacher/tests');
    
    // Create test with 8 question types
    await page.click('button:has-text("Create Test")');
    
    const questionTypes = [
      'Multiple Choice',
      'True/False', 
      'Fill in Blank',
      'Matching',
      'Short Answer',
      'Essay',
      'Listening',
      'Speaking'
    ];
    
    for (const type of questionTypes) {
      await page.click(`button:has-text("Add ${type}")`);
      await page.waitForTimeout(200);
    }
  });
});

// 3. STUDENT ROLE TESTS
test.describe('Student Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.student) {
      await login(page, testUsers.student.email, 'password123');
    }
  });

  test('Student Dashboard - Enhanced Indicators', async ({ page }) => {
    await page.goto('http://localhost:5000/student/dashboard');
    
    // Check enhanced professional indicators
    await expect(page.locator('[data-testid="learning-streak"]')).toBeVisible();
    await expect(page.locator('[data-testid="xp-progress"]')).toBeVisible();
    await expect(page.locator('[data-testid="level-badge"]')).toBeVisible();
    await expect(page.locator('[data-testid="upcoming-sessions"]')).toBeVisible();
    await expect(page.locator('[data-testid="achievements-preview"]')).toBeVisible();
    await expect(page.locator('[data-testid="course-progress"]')).toBeVisible();
    
    // Check mobile optimization
    const isMobileOptimized = await checkMobileOptimization(page);
    expect(isMobileOptimized).toBe(true);
  });

  test('Student - Course Enrollment', async ({ page }) => {
    await page.goto('http://localhost:5000/student/courses');
    
    // Check available courses
    const availableCourses = await db.select().from(courses).limit(5);
    if (availableCourses.length > 0) {
      await expect(page.locator(`text="${availableCourses[0].title}"`)).toBeVisible();
      
      // Test enrollment
      await page.click(`button:has-text("Enroll")`);
      await expect(page.locator('text="Enrollment successful"')).toBeVisible();
    }
  });

  test('Student - Callern Session Booking', async ({ page }) => {
    await page.goto('http://localhost:5000/student/tutors');
    
    // Check available teachers
    await expect(page.locator('[data-testid="teacher-card"]')).toBeVisible();
    
    // Test booking
    await page.click('button:has-text("Book Session")');
    await expect(page.locator('[role="dialog"]')).toBeVisible();
    
    // Select time slot
    await page.click('[data-testid="time-slot"]:first');
    await page.click('button:has-text("Confirm Booking")');
  });

  test('Student - Gamification Features', async ({ page }) => {
    await page.goto('http://localhost:5000/student/achievements');
    
    // Check achievements
    await expect(page.locator('[data-testid="achievement-card"]')).toBeVisible();
    
    // Check leaderboard
    await expect(page.locator('[data-testid="leaderboard"]')).toBeVisible();
    
    // Check daily challenges
    await expect(page.locator('[data-testid="daily-challenges"]')).toBeVisible();
  });

  test('Student - Wallet Management', async ({ page }) => {
    await page.goto('http://localhost:5000/student/payment');
    
    // Check wallet balance
    const wallet = await db.select().from(wallets)
      .where(eq(wallets.userId, testUsers.student.id))
      .limit(1);
    
    if (wallet[0]) {
      await expect(page.locator(`text="${wallet[0].balance}"`)).toBeVisible();
    }
    
    // Test top-up
    await page.click('button:has-text("Top Up")');
    await page.fill('input[name="amount"]', '100000');
    await page.click('button:has-text("Pay with Shetab")');
  });
});

// 4. MENTOR ROLE TESTS
test.describe('Mentor Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.mentor) {
      await login(page, testUsers.mentor.email, 'password123');
    }
  });

  test('Mentor Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5000/mentor/dashboard');
    
    // Check assigned students
    await expect(page.locator('[data-testid="assigned-students"]')).toBeVisible();
    
    // Check progress tracking
    await expect(page.locator('[data-testid="student-progress-chart"]')).toBeVisible();
    
    // Check mobile optimization
    const isMobileOptimized = await checkMobileOptimization(page);
    expect(isMobileOptimized).toBe(true);
  });

  test('Mentor - Student Progress Monitoring', async ({ page }) => {
    await page.goto('http://localhost:5000/mentor/students');
    
    // Check student list with real data
    await expect(page.locator('[data-testid="student-list"]')).toBeVisible();
    
    // View student details
    await page.click('[data-testid="student-card"]:first');
    await expect(page.locator('[data-testid="student-details"]')).toBeVisible();
    
    // Add progress note
    await page.click('button:has-text("Add Note")');
    await page.fill('textarea[name="note"]', 'Student showing excellent progress');
    await page.click('button:has-text("Save")');
  });
});

// 5. SUPERVISOR ROLE TESTS
test.describe('Supervisor Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.supervisor) {
      await login(page, testUsers.supervisor.email, 'password123');
    }
  });

  test('Supervisor - Teacher Supervision Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5000/supervisor/teacher-supervision-dashboard');
    
    // Check teacher performance metrics
    await expect(page.locator('[data-testid="teacher-performance"]')).toBeVisible();
    
    // Check QA scores
    await expect(page.locator('[data-testid="qa-scores"]')).toBeVisible();
    
    // Check call monitoring
    await expect(page.locator('[data-testid="call-monitoring"]')).toBeVisible();
  });

  test('Supervisor - Live Call Monitoring', async ({ page }) => {
    await page.goto('http://localhost:5000/supervisor/dashboard');
    
    // Check active calls
    await expect(page.locator('[data-testid="active-calls"]')).toBeVisible();
    
    // Test join call for supervision
    const activeCalls = await page.locator('[data-testid="active-call-card"]').count();
    if (activeCalls > 0) {
      await page.click('button:has-text("Monitor")');
      await expect(page.locator('[data-testid="call-monitor-view"]')).toBeVisible();
    }
  });
});

// 6. CALL CENTER AGENT ROLE TESTS
test.describe('Call Center Agent Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.callcenter) {
      await login(page, testUsers.callcenter.email, 'password123');
    }
  });

  test('Call Center - VoIP Center', async ({ page }) => {
    await page.goto('http://localhost:5000/callcenter/voip-center');
    
    // Check dialer
    await expect(page.locator('[data-testid="phone-dialer"]')).toBeVisible();
    
    // Check call queue
    await expect(page.locator('[data-testid="call-queue"]')).toBeVisible();
    
    // Test make call
    await page.fill('input[name="phone-number"]', '09123456789');
    await page.click('button:has-text("Call")');
    
    // Check call controls appear
    await expect(page.locator('[data-testid="call-controls"]')).toBeVisible();
  });

  test('Call Center - Lead Management', async ({ page }) => {
    await page.goto('http://localhost:5000/callcenter/leads');
    
    // Check lead list with real data
    await expect(page.locator('[data-testid="lead-list"]')).toBeVisible();
    
    // Test add lead
    await page.click('button:has-text("Add Lead")');
    await page.fill('input[name="name"]', 'Test Lead');
    await page.fill('input[name="phone"]', '09123456789');
    await page.selectOption('select[name="status"]', 'new');
    await page.click('button:has-text("Save")');
  });

  test('Call Center - Campaign Management', async ({ page }) => {
    await page.goto('http://localhost:5000/callcenter/campaigns');
    
    // Check active campaigns
    await expect(page.locator('[data-testid="campaign-list"]')).toBeVisible();
    
    // Test campaign actions
    await page.click('button:has-text("Start Campaign")');
    await expect(page.locator('[data-testid="campaign-dialer"]')).toBeVisible();
  });
});

// 7. ACCOUNTANT ROLE TESTS
test.describe('Accountant Role - Complete Functionality', () => {
  test.beforeEach(async ({ page }) => {
    if (testUsers.accountant) {
      await login(page, testUsers.accountant.email, 'password123');
    }
  });

  test('Accountant Dashboard', async ({ page }) => {
    await page.goto('http://localhost:5000/accountant/dashboard');
    
    // Check financial overview
    await expect(page.locator('[data-testid="revenue-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="expense-overview"]')).toBeVisible();
    await expect(page.locator('[data-testid="profit-margin"]')).toBeVisible();
    
    // Check pending payments
    await expect(page.locator('[data-testid="pending-payments"]')).toBeVisible();
  });

  test('Accountant - Teacher Payment Processing', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/teacher-payments');
    
    // Check payment list
    await expect(page.locator('[data-testid="payment-list"]')).toBeVisible();
    
    // Process payment
    await page.click('button:has-text("Process Payment")');
    await page.fill('input[name="amount"]', '5000000');
    await page.click('button:has-text("Confirm")');
    
    // Verify payment processed
    await expect(page.locator('text="Payment processed"')).toBeVisible();
  });

  test('Accountant - Financial Reports', async ({ page }) => {
    await page.goto('http://localhost:5000/admin/reports');
    
    // Generate monthly report
    await page.selectOption('select[name="report-type"]', 'monthly');
    await page.click('button:has-text("Generate Report")');
    
    // Check report generated
    await expect(page.locator('[data-testid="report-view"]')).toBeVisible();
    
    // Export report
    await page.click('button:has-text("Export PDF")');
    await expect(page.locator('text="Report exported"')).toBeVisible();
  });
});

// BUTTON FUNCTIONALITY TESTS FOR ALL PAGES
test.describe('Button Functionality - All Pages', () => {
  test('Test all navigation buttons', async ({ page }) => {
    await page.goto('http://localhost:5000');
    
    // Get all buttons on the page
    const buttons = await page.locator('button').all();
    
    for (const button of buttons) {
      const text = await button.textContent();
      const isDisabled = await button.isDisabled();
      
      if (!isDisabled && text) {
        // Test button click
        await button.click();
        await page.waitForTimeout(200);
        
        // Check if any action occurred (modal, navigation, etc.)
        const hasModal = await page.locator('[role="dialog"]').count();
        const urlChanged = page.url() !== 'http://localhost:5000';
        
        console.log(`Button "${text}" - Modal: ${hasModal > 0}, Navigation: ${urlChanged}`);
        
        // Go back if navigated
        if (urlChanged) {
          await page.goBack();
        }
        
        // Close modal if opened
        if (hasModal > 0) {
          await page.keyboard.press('Escape');
        }
      }
    }
  });
});

// RESPONSIVE DESIGN TESTS
test.describe('Mobile-First Responsive Design', () => {
  const viewports = [
    { name: 'Mobile', width: 375, height: 812 },
    { name: 'Tablet', width: 768, height: 1024 },
    { name: 'Desktop', width: 1920, height: 1080 }
  ];
  
  for (const viewport of viewports) {
    test(`Test responsive layout - ${viewport.name}`, async ({ page }) => {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      
      const pages = [
        '/student/dashboard',
        '/teacher/dashboard',
        '/admin/dashboard'
      ];
      
      for (const pagePath of pages) {
        await page.goto(`http://localhost:5000${pagePath}`);
        
        // Check if layout adapts
        const hasOverflow = await page.evaluate(() => {
          return document.body.scrollWidth > document.body.clientWidth;
        });
        
        expect(hasOverflow).toBe(false);
        
        // Check if mobile navigation is visible on mobile
        if (viewport.name === 'Mobile') {
          const hasMobileNav = await page.locator('[class*="md:hidden"]').count();
          expect(hasMobileNav).toBeGreaterThan(0);
        }
      }
    });
  }
});

// ACCESSIBILITY TESTS
test.describe('Accessibility', () => {
  test('Check ARIA labels and keyboard navigation', async ({ page }) => {
    await page.goto('http://localhost:5000');
    
    // Check for ARIA labels
    const buttonsWithoutAriaLabel = await page.evaluate(() => {
      const buttons = document.querySelectorAll('button:not([aria-label])');
      return buttons.length;
    });
    
    expect(buttonsWithoutAriaLabel).toBe(0);
    
    // Test keyboard navigation
    await page.keyboard.press('Tab');
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
    expect(focusedElement).toBeTruthy();
  });
});