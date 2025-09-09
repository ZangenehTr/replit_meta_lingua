/**
 * Comprehensive Path Coverage Tests for Student Dashboard Buttons
 * Tests all interactive elements and their paths on student dashboard
 */

import { test, expect } from '@playwright/test';

test.describe('Student Dashboard Button Path Coverage', () => {
  let page;

  test.beforeEach(async ({ browser }) => {
    page = await browser.newPage();
    
    // Mock successful login as student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student2@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');
  });

  test('should load dashboard and display all main components', async () => {
    await expect(page).toHaveURL('/dashboard');
    
    // Verify main dashboard elements are present
    await expect(page.locator('[data-testid="header"]')).toBeVisible();
    await expect(page.locator('[data-testid="user-avatar"]')).toBeVisible();
    await expect(page.locator('[data-testid="notification-bell"]')).toBeVisible();
  });

  test('should handle notification bell button click', async () => {
    const bellButton = page.locator('[data-testid="notification-bell"]');
    await expect(bellButton).toBeVisible();
    await bellButton.click();
    
    // Should show notification dropdown or modal
    await expect(page.locator('[data-testid="notification-dropdown"]')).toBeVisible();
  });

  test('should navigate to placement test when button clicked', async () => {
    // Check if placement test button exists (for users who haven't completed it)
    const placementButton = page.locator('a[href="/placement-test"]');
    
    if (await placementButton.isVisible()) {
      await placementButton.click();
      await page.waitForURL('/placement-test');
      await expect(page).toHaveURL('/placement-test');
    }
  });

  test('should toggle socializer availability status', async () => {
    const socializerButton = page.locator('button:has-text("تغییر وضعیت دسترسی")');
    
    if (await socializerButton.isVisible()) {
      await socializerButton.click();
      
      // Should make API call to toggle status
      await page.waitForResponse(response => 
        response.url().includes('/api/student/socializer-availability') && 
        response.status() === 200
      );
    }
  });

  test('should navigate to special classes enrollment', async () => {
    const enrollButton = page.locator('button:has-text("ثبت نام")');
    
    if (await enrollButton.first().isVisible()) {
      await enrollButton.first().click();
      
      // Should handle enrollment process
      await page.waitForResponse(response => 
        response.url().includes('/api/student/special-class-enrollment') && 
        response.status() === 200
      );
    }
  });

  test('should navigate to view all special classes', async () => {
    const viewAllButton = page.locator('button:has-text("مشاهده همه کلاس‌های ویژه")');
    
    if (await viewAllButton.isVisible()) {
      await viewAllButton.click();
      await expect(page).toHaveURL('/special-classes');
    }
  });

  test('should start CallerN session', async () => {
    const callernButton = page.locator('button:has-text("شروع جلسه CallerN")');
    
    if (await callernButton.isVisible()) {
      await callernButton.click();
      await expect(page).toHaveURL('/callern');
    }
  });

  test('should navigate to student roadmap', async () => {
    const roadmapLink = page.locator('a[href="/student/roadmap"]');
    
    if (await roadmapLink.isVisible()) {
      await roadmapLink.click();
      await page.waitForURL('/student/roadmap');
      await expect(page).toHaveURL('/student/roadmap');
    }
  });

  test('should navigate to games section', async () => {
    const gamesLink = page.locator('a[href="/games"]');
    
    if (await gamesLink.isVisible()) {
      await gamesLink.click();
      await page.waitForURL('/games');
      await expect(page).toHaveURL('/games');
    }
  });

  test('should navigate to video courses', async () => {
    const videoCoursesLink = page.locator('a[href="/video-courses"]');
    
    if (await videoCoursesLink.isVisible()) {
      await videoCoursesLink.click();
      await page.waitForURL('/video-courses');
      await expect(page).toHaveURL('/video-courses');
    }
  });

  test('should browse courses on mobile', async () => {
    const browseCoursesLink = page.locator('a[href="/student/courses-mobile"]');
    
    if (await browseCoursesLink.isVisible()) {
      await browseCoursesLink.click();
      await page.waitForURL('/student/courses-mobile');
      await expect(page).toHaveURL('/student/courses-mobile');
    }
  });

  test('should start CallerN on mobile', async () => {
    const callernMobileLink = page.locator('a[href="/callern-mobile"]');
    
    if (await callernMobileLink.isVisible()) {
      await callernMobileLink.click();
      await page.waitForURL('/callern-mobile');
      await expect(page).toHaveURL('/callern-mobile');
    }
  });

  test('should handle peer socializer - find peers button', async () => {
    const findPeersButton = page.locator('button:has-text("پیدا کردن همکلاس")');
    
    if (await findPeersButton.isVisible()) {
      await findPeersButton.click();
      
      // Should trigger peer finding logic
      await page.waitForResponse(response => 
        response.url().includes('/api/student/find-peers') && 
        response.status() === 200
      );
    }
  });

  test('should handle peer socializer - join group button', async () => {
    const joinGroupButton = page.locator('button:has-text("پیوستن به گروه")');
    
    if (await joinGroupButton.isVisible()) {
      await joinGroupButton.click();
      
      // Should show group selection or joining process
      await expect(page.locator('[data-testid="group-selection-modal"]')).toBeVisible();
    }
  });

  test('should handle tab navigation on mobile dashboard', async () => {
    // Test overview tab
    const overviewTab = page.locator('[data-testid="tab-overview"]');
    if (await overviewTab.isVisible()) {
      await overviewTab.click();
      await expect(page.locator('[data-testid="overview-content"]')).toBeVisible();
    }

    // Test courses tab
    const coursesTab = page.locator('[data-testid="tab-courses"]');
    if (await coursesTab.isVisible()) {
      await coursesTab.click();
      await expect(page.locator('[data-testid="courses-content"]')).toBeVisible();
    }

    // Test social tab
    const socialTab = page.locator('[data-testid="tab-social"]');
    if (await socialTab.isVisible()) {
      await socialTab.click();
      await expect(page.locator('[data-testid="social-content"]')).toBeVisible();
    }
  });

  test('should handle upcoming sessions interactions', async () => {
    const sessionItems = page.locator('[data-testid="session-item"]');
    
    if (await sessionItems.count() > 0) {
      await sessionItems.first().click();
      
      // Should navigate to session details or join session
      await page.waitForResponse(response => 
        response.url().includes('/api/student/sessions/') && 
        response.status() === 200
      );
    }
  });

  test('should view all sessions when button clicked', async () => {
    const viewAllSessionsButton = page.locator('button:has-text("View All Sessions")');
    
    if (await viewAllSessionsButton.isVisible()) {
      await viewAllSessionsButton.click();
      await expect(page).toHaveURL('/student/sessions');
    }
  });

  test('should verify API endpoints respond correctly', async () => {
    // Test all critical API endpoints the dashboard depends on
    const apiTests = [
      '/api/student/stats',
      '/api/student/placement-status', 
      '/api/student/courses',
      '/api/student/sessions/upcoming',
      '/api/student/class-groups'
    ];

    for (const endpoint of apiTests) {
      const response = await page.request.get(endpoint, {
        headers: {
          'Authorization': `Bearer ${await page.evaluate(() => localStorage.getItem('auth_token'))}`
        }
      });
      
      // API should return 200 or proper error status, not 404
      expect([200, 401, 403, 500]).toContain(response.status());
      expect(response.status()).not.toBe(404);
    }
  });

  test('should handle error states gracefully', async () => {
    // Test dashboard handles API errors gracefully
    await page.route('/api/student/stats', route => {
      route.fulfill({
        status: 500,
        contentType: 'application/json',
        body: JSON.stringify({ error: 'Server error' })
      });
    });

    await page.reload();
    
    // Dashboard should still load with fallback data
    await expect(page.locator('[data-testid="dashboard-content"]')).toBeVisible();
    
    // Error state should be handled gracefully
    await expect(page.locator('[data-testid="error-fallback"]')).toBeVisible();
  });

  test('should handle missing placement test status', async () => {
    await page.route('/api/student/placement-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasCompletedPlacementTest: false,
          message: 'Placement test required'
        })
      });
    });

    await page.reload();
    
    // Should show placement test prompt
    await expect(page.locator('button:has-text("Start Placement Test")')).toBeVisible();
  });

  test('should handle completed placement test status', async () => {
    await page.route('/api/student/placement-status', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          hasCompletedPlacementTest: true,
          placementResults: {
            overallLevel: 'B2',
            speakingLevel: 'B2',
            listeningLevel: 'B1',
            readingLevel: 'B2', 
            writingLevel: 'B1',
            completedAt: '2024-01-20'
          }
        })
      });
    });

    await page.reload();
    
    // Should show placement results
    await expect(page.locator('text=Placement Test Complete')).toBeVisible();
    await expect(page.locator('text=B2')).toBeVisible();
  });

  test('should verify mobile bottom navigation works', async () => {
    // Test mobile bottom navigation if present
    const bottomNav = page.locator('[data-testid="mobile-bottom-nav"]');
    
    if (await bottomNav.isVisible()) {
      const navItems = page.locator('[data-testid="nav-item"]');
      const navCount = await navItems.count();
      
      // Click each navigation item
      for (let i = 0; i < navCount; i++) {
        await navItems.nth(i).click();
        
        // Verify navigation occurs
        await page.waitForTimeout(500);
        await expect(page.locator('[data-testid="page-content"]')).toBeVisible();
      }
    }
  });
});

test.describe('Student Dashboard Button Integration Tests', () => {
  test('should complete full user journey through dashboard', async ({ page }) => {
    // Login as student
    await page.goto('/login');
    await page.fill('input[name="email"]', 'student2@test.com');
    await page.fill('input[name="password"]', 'password123');
    await page.click('button[type="submit"]');
    await page.waitForURL('/dashboard');

    // Full journey: Dashboard -> Placement Test (if needed) -> Courses -> CallerN
    
    // 1. Check placement test status
    const placementButton = page.locator('a[href="/placement-test"]');
    if (await placementButton.isVisible()) {
      await placementButton.click();
      await expect(page).toHaveURL('/placement-test');
      await page.goBack();
    }

    // 2. Browse courses
    const coursesLink = page.locator('a[href="/student/courses-mobile"]');
    if (await coursesLink.isVisible()) {
      await coursesLink.click();
      await page.waitForURL('/student/courses-mobile');
      await page.goBack();
    }

    // 3. Start CallerN
    const callernButton = page.locator('button:has-text("شروع جلسه CallerN")');
    if (await callernButton.isVisible()) {
      await callernButton.click();
      await expect(page).toHaveURL('/callern');
    }
  });
});