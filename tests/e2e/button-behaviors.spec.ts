import { test, expect } from '@playwright/test';

test.describe('UI Button Behaviors and Permissions', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:5000');
  });

  test.describe('Admin Role', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:5000/login');
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should show admin-only buttons', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/teachers');
      
      // Check for admin-specific buttons
      await expect(page.locator('button:has-text("Create Teacher")')).toBeVisible();
      await expect(page.locator('button:has-text("Import Teachers")')).toBeVisible();
    });

    test('should handle teacher creation with immediate list update', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/teachers');
      
      // Click create button
      await page.click('button:has-text("Create Teacher")');
      
      // Fill in the form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Teacher');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      await page.fill('input[name="phone"]', '+989123456789');
      
      // Submit form
      await page.click('button:has-text("Create")');
      
      // Wait for success toast
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // Check that the new teacher appears in the list immediately
      await expect(page.locator('text=Test Teacher')).toBeVisible({ timeout: 5000 });
    });

    test('should handle student creation with immediate list update', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/students');
      
      // Click create button
      await page.click('button:has-text("Add Student")');
      
      // Fill in the form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Student');
      await page.fill('input[name="email"]', `student${Date.now()}@example.com`);
      await page.fill('input[name="phone"]', '+989123456789');
      
      // Submit form
      await page.click('button:has-text("Create")');
      
      // Check that the new student appears in the list immediately
      await expect(page.locator('text=Test Student')).toBeVisible({ timeout: 5000 });
    });

    test('should handle course creation with immediate list update', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/courses');
      
      // Click create button
      await page.click('button:has-text("Create Course")');
      
      // Fill in the form
      await page.fill('input[name="title"]', `Test Course ${Date.now()}`);
      await page.fill('textarea[name="description"]', 'Test course description');
      await page.selectOption('select[name="language"]', 'English');
      await page.selectOption('select[name="level"]', 'B1');
      
      // Submit form
      await page.click('button:has-text("Create")');
      
      // Check that the new course appears in the list immediately
      await expect(page.locator('text=Test Course')).toBeVisible({ timeout: 5000 });
    });

    test('should handle roadmap creation with immediate list update', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/roadmap-designer');
      
      // Click create button
      await page.click('button:has-text("Create New")');
      
      // Fill in the form
      const roadmapTitle = `Test Roadmap ${Date.now()}`;
      await page.fill('input[placeholder*="Business English"]', roadmapTitle);
      await page.fill('textarea[placeholder*="learning journey"]', 'Test roadmap description');
      await page.selectOption('select:near(label:has-text("Target Language"))', 'English');
      await page.selectOption('select:near(label:has-text("Target Level"))', 'C1');
      await page.fill('input[type="number"]:near(label:has-text("Estimated Weeks"))', '12');
      await page.fill('input[type="number"]:near(label:has-text("Weekly Hours"))', '5');
      
      // Submit form
      await page.click('button:has-text("Create Roadmap")');
      
      // Check that the new roadmap appears in the list immediately
      await expect(page.locator(`text=${roadmapTitle}`)).toBeVisible({ timeout: 5000 });
    });

    test('should handle filter changes with correct API calls', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/students');
      
      // Change filter to active students
      await page.selectOption('select[name="status"]', 'active');
      
      // Wait for filtered results
      await page.waitForResponse(response => 
        response.url().includes('/api/students') && 
        response.url().includes('status=active')
      );
      
      // Change filter to inactive students
      await page.selectOption('select[name="status"]', 'inactive');
      
      // Wait for filtered results
      await page.waitForResponse(response => 
        response.url().includes('/api/students') && 
        response.url().includes('status=inactive')
      );
    });
  });

  test.describe('Teacher Role', () => {
    test.beforeEach(async ({ page }) => {
      // Login as teacher
      await page.goto('http://localhost:5000/login');
      await page.fill('input[name="email"]', 'teacher@test.com');
      await page.fill('input[name="password"]', 'teacher123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should not show admin-only buttons', async ({ page }) => {
      await page.goto('http://localhost:5000/dashboard');
      
      // Admin-only buttons should not be visible
      await expect(page.locator('button:has-text("Create User")')).not.toBeVisible();
      await expect(page.locator('button:has-text("System Settings")')).not.toBeVisible();
    });

    test('should show teacher-specific actions', async ({ page }) => {
      await page.goto('http://localhost:5000/teacher/sessions');
      
      // Teacher-specific buttons should be visible
      await expect(page.locator('button:has-text("Schedule Session")')).toBeVisible();
      await expect(page.locator('button:has-text("Create Assignment")')).toBeVisible();
    });
  });

  test.describe('Student Role', () => {
    test.beforeEach(async ({ page }) => {
      // Login as student
      await page.goto('http://localhost:5000/login');
      await page.fill('input[name="email"]', 'student@test.com');
      await page.fill('input[name="password"]', 'student123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should only show student-allowed actions', async ({ page }) => {
      await page.goto('http://localhost:5000/dashboard');
      
      // Student-specific buttons should be visible
      await expect(page.locator('button:has-text("Enroll in Course")')).toBeVisible();
      await expect(page.locator('button:has-text("View Progress")')).toBeVisible();
      
      // Teacher/Admin buttons should not be visible
      await expect(page.locator('button:has-text("Create Course")')).not.toBeVisible();
      await expect(page.locator('button:has-text("Manage Students")')).not.toBeVisible();
    });

    test('should handle course enrollment with immediate update', async ({ page }) => {
      await page.goto('http://localhost:5000/courses/available');
      
      // Click enroll button on first available course
      await page.click('button:has-text("Enroll"):first');
      
      // Wait for success message
      await expect(page.locator('.toast-success')).toBeVisible();
      
      // Navigate to my courses
      await page.goto('http://localhost:5000/courses/my');
      
      // The enrolled course should appear immediately
      await expect(page.locator('.course-card')).toHaveCount({ minimum: 1 });
    });
  });

  test.describe('Button State Management', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin for full access
      await page.goto('http://localhost:5000/login');
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should disable buttons during async operations', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/teachers');
      
      // Click create button
      await page.click('button:has-text("Create Teacher")');
      
      // Fill form
      await page.fill('input[name="firstName"]', 'Test');
      await page.fill('input[name="lastName"]', 'Teacher');
      await page.fill('input[name="email"]', `test${Date.now()}@example.com`);
      
      // Get submit button
      const submitButton = page.locator('button:has-text("Create"):last');
      
      // Click submit
      await submitButton.click();
      
      // Button should be disabled during submission
      await expect(submitButton).toBeDisabled();
      
      // Wait for operation to complete
      await page.waitForResponse(response => 
        response.url().includes('/api/teachers') && response.status() === 200
      );
      
      // Button should be enabled again (dialog closed)
      await expect(page.locator('button:has-text("Create Teacher")')).toBeEnabled();
    });

    test('should show loading states correctly', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/students');
      
      // Trigger a refresh
      await page.reload();
      
      // Should show loading indicator
      await expect(page.locator('.loading-spinner, .skeleton')).toBeVisible();
      
      // Should hide loading indicator after data loads
      await expect(page.locator('.loading-spinner, .skeleton')).not.toBeVisible({ timeout: 5000 });
    });
  });

  test.describe('Query Invalidation', () => {
    test.beforeEach(async ({ page }) => {
      // Login as admin
      await page.goto('http://localhost:5000/login');
      await page.fill('input[name="email"]', 'admin@test.com');
      await page.fill('input[name="password"]', 'admin123');
      await page.click('button[type="submit"]');
      await page.waitForURL('**/dashboard');
    });

    test('should refresh related data after mutations', async ({ page }) => {
      await page.goto('http://localhost:5000/admin/teacher-student-matching');
      
      // Count initial unassigned students
      const initialCount = await page.locator('.unassigned-student-card').count();
      
      // Assign a student to a teacher
      if (initialCount > 0) {
        await page.click('.unassigned-student-card:first button:has-text("Assign")');
        
        // Select teacher
        await page.selectOption('select[name="teacher"]', { index: 1 });
        
        // Submit assignment
        await page.click('button:has-text("Confirm Assignment")');
        
        // Wait for success
        await expect(page.locator('.toast-success')).toBeVisible();
        
        // The unassigned students list should update
        const newCount = await page.locator('.unassigned-student-card').count();
        expect(newCount).toBe(initialCount - 1);
      }
    });

    test('should update dashboard stats after changes', async ({ page }) => {
      await page.goto('http://localhost:5000/dashboard');
      
      // Get initial student count
      const studentCountElement = page.locator('[data-testid="total-students"]');
      const initialCount = await studentCountElement.textContent();
      
      // Navigate to students page and create new student
      await page.goto('http://localhost:5000/admin/students');
      await page.click('button:has-text("Add Student")');
      
      // Fill form
      await page.fill('input[name="firstName"]', 'Dashboard');
      await page.fill('input[name="lastName"]', 'Test');
      await page.fill('input[name="email"]', `dashboard${Date.now()}@example.com`);
      
      // Submit
      await page.click('button:has-text("Create")');
      
      // Go back to dashboard
      await page.goto('http://localhost:5000/dashboard');
      
      // Student count should be updated
      const newCount = await studentCountElement.textContent();
      expect(parseInt(newCount || '0')).toBeGreaterThan(parseInt(initialCount || '0'));
    });
  });
});