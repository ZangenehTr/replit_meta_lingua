import { test, expect, Page } from '@playwright/test';

// Real E2E test for video connection establishment
test.describe('+++RealTest: Video Connection Flow', () => {
  let teacherPage: Page;
  let studentPage: Page;

  test.beforeEach(async ({ browser }) => {
    // Create teacher and student pages
    teacherPage = await browser.newPage();
    studentPage = await browser.newPage();

    // Grant media permissions
    await teacherPage.context().grantPermissions(['camera', 'microphone']);
    await studentPage.context().grantPermissions(['camera', 'microphone']);
  });

  test('should establish WebRTC connection between teacher and student', async () => {
    // Login as teacher
    await teacherPage.goto('/auth');
    await teacherPage.fill('input[type="email"]', 'teacher1@test.com');
    await teacherPage.fill('input[type="password"]', 'password123');
    await teacherPage.click('button[type="submit"]');
    await teacherPage.waitForURL('/dashboard');

    // Login as student
    await studentPage.goto('/auth');
    await studentPage.fill('input[type="email"]', 'student2@test.com');
    await studentPage.fill('input[type="password"]', 'password123');
    await studentPage.click('button[type="submit"]');
    await studentPage.waitForURL('/dashboard');

    // Teacher goes online
    await teacherPage.goto('/teacher/callern');
    await teacherPage.waitForSelector('[data-testid="teacher-online-toggle"]');
    await teacherPage.click('[data-testid="teacher-online-toggle"]');
    
    // Wait for online status
    await expect(teacherPage.locator('[data-testid="online-status"]')).toContainText('Online');

    // Student initiates call
    await studentPage.goto('/student/tutors');
    await studentPage.waitForSelector('[data-testid="available-teacher"]');
    await studentPage.click('[data-testid="call-teacher-btn"]');

    // Teacher accepts call
    await expect(teacherPage.locator('[data-testid="incoming-call"]')).toBeVisible();
    await teacherPage.click('[data-testid="accept-call-btn"]');

    // Wait for video call interface
    await Promise.all([
      teacherPage.waitForSelector('[data-testid="video-call-interface"]'),
      studentPage.waitForSelector('[data-testid="video-call-interface"]')
    ]);

    // Check WebRTC connection status
    const teacherConnectionStatus = await teacherPage.locator('[data-testid="connection-status"]').textContent();
    const studentConnectionStatus = await studentPage.locator('[data-testid="connection-status"]').textContent();
    
    expect(teacherConnectionStatus).toBe('connected');
    expect(studentConnectionStatus).toBe('connected');

    // Verify video elements are present and have media streams
    const teacherLocalVideo = teacherPage.locator('[data-testid="local-video"]');
    const teacherRemoteVideo = teacherPage.locator('[data-testid="remote-video"]');
    const studentLocalVideo = studentPage.locator('[data-testid="local-video"]');
    const studentRemoteVideo = studentPage.locator('[data-testid="remote-video"]');

    await expect(teacherLocalVideo).toBeVisible();
    await expect(teacherRemoteVideo).toBeVisible();
    await expect(studentLocalVideo).toBeVisible();
    await expect(studentRemoteVideo).toBeVisible();

    // Test media controls
    await teacherPage.click('[data-testid="toggle-video-btn"]');
    await expect(teacherPage.locator('[data-testid="video-disabled-indicator"]')).toBeVisible();

    await teacherPage.click('[data-testid="toggle-audio-btn"]');
    await expect(teacherPage.locator('[data-testid="audio-disabled-indicator"]')).toBeVisible();

    // Test call duration tracking
    await teacherPage.waitForTimeout(3000); // Wait 3 seconds
    const duration = await teacherPage.locator('[data-testid="call-duration"]').textContent();
    expect(duration).toMatch(/00:0[0-9]/); // Should show some duration

    // End call
    await teacherPage.click('[data-testid="end-call-btn"]');
    
    // Verify both sides return to dashboard
    await Promise.all([
      teacherPage.waitForURL('/dashboard'),
      studentPage.waitForURL('/dashboard')
    ]);
  });

  test('should handle WebRTC connection failures gracefully', async () => {
    // Mock network failure scenarios
    await teacherPage.route('**/*', route => {
      if (route.request().url().includes('stun:')) {
        route.abort();
      } else {
        route.continue();
      }
    });

    // Try to establish connection with STUN servers blocked
    await teacherPage.goto('/callern/video/test-room-123');
    
    // Should show connection error
    await expect(teacherPage.locator('[data-testid="connection-error"]')).toBeVisible();
    await expect(teacherPage.locator('[data-testid="connection-status"]')).toContainText('disconnected');

    // Should offer retry option
    await expect(teacherPage.locator('[data-testid="retry-connection-btn"]')).toBeVisible();
  });

  test('should maintain stable connection during extended call', async () => {
    // Login both users and establish connection (abbreviated)
    await teacherPage.goto('/callern/video/stability-test');
    await studentPage.goto('/callern/video/stability-test');

    // Wait for connection establishment
    await Promise.all([
      teacherPage.waitForSelector('[data-testid="connection-status"]:has-text("connected")'),
      studentPage.waitForSelector('[data-testid="connection-status"]:has-text("connected")')
    ]);

    // Monitor connection for 30 seconds
    for (let i = 0; i < 6; i++) {
      await teacherPage.waitForTimeout(5000);
      
      const teacherStatus = await teacherPage.locator('[data-testid="connection-status"]').textContent();
      const studentStatus = await studentPage.locator('[data-testid="connection-status"]').textContent();
      
      expect(teacherStatus).toBe('connected');
      expect(studentStatus).toBe('connected');
      
      // Check if video streams are still active
      const teacherVideoActive = await teacherPage.locator('[data-testid="local-video"]').isVisible();
      const studentVideoActive = await studentPage.locator('[data-testid="local-video"]').isVisible();
      
      expect(teacherVideoActive).toBe(true);
      expect(studentVideoActive).toBe(true);
    }
  });

  test.afterEach(async () => {
    await teacherPage.close();
    await studentPage.close();
  });
});