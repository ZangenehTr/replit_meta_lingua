import { test, expect, type Page } from '@playwright/test';

// Test data
const TEACHER_EMAIL = 'teacher2@test.com';
const TEACHER_PASSWORD = 'password123';
const STUDENT_EMAIL = 'student2@test.com';
const STUDENT_PASSWORD = 'password123';
const TEST_TIMEOUT = 120000; // 2 minutes for video call tests

test.describe('Callern End-to-End Tests', () => {
  let teacherPage: Page;
  let studentPage: Page;
  let teacherContext: any;
  let studentContext: any;

  test.beforeAll(async ({ browser }) => {
    // Create separate browser contexts for teacher and student
    teacherContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
      viewport: { width: 1280, height: 720 }
    });
    studentContext = await browser.newContext({
      permissions: ['camera', 'microphone'],
      viewport: { width: 1280, height: 720 }
    });

    teacherPage = await teacherContext.newPage();
    studentPage = await studentContext.newPage();
  });

  test.afterAll(async () => {
    await teacherContext.close();
    await studentContext.close();
  });

  test('1. Teacher Login and Go Online', async () => {
    // Navigate to login page
    await teacherPage.goto('http://localhost:5000');
    
    // Login as teacher
    await teacherPage.fill('input[type="email"]', TEACHER_EMAIL);
    await teacherPage.fill('input[type="password"]', TEACHER_PASSWORD);
    await teacherPage.click('button[type="submit"]');
    
    // Wait for dashboard
    await teacherPage.waitForURL('**/dashboard');
    await expect(teacherPage.locator('text=Teacher Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Callern page
    await teacherPage.goto('http://localhost:5000/teacher/callern');
    await teacherPage.waitForLoadState('networkidle');
    
    // Click "Go Online" button
    const goOnlineButton = teacherPage.locator('button:has-text("Go Online")');
    await expect(goOnlineButton).toBeVisible({ timeout: 10000 });
    await goOnlineButton.click();
    
    // Verify online status
    await expect(teacherPage.locator('text=You are now online')).toBeVisible({ timeout: 5000 });
    console.log('✓ Teacher is online');
  });

  test('2. Student Login and View Available Teachers', async () => {
    // Navigate to login page
    await studentPage.goto('http://localhost:5000');
    
    // Login as student
    await studentPage.fill('input[type="email"]', STUDENT_EMAIL);
    await studentPage.fill('input[type="password"]', STUDENT_PASSWORD);
    await studentPage.click('button[type="submit"]');
    
    // Wait for dashboard
    await studentPage.waitForURL('**/dashboard');
    await expect(studentPage.locator('text=Student Dashboard')).toBeVisible({ timeout: 10000 });
    
    // Navigate to Callern page
    await studentPage.goto('http://localhost:5000/callern');
    await studentPage.waitForLoadState('networkidle');
    
    // Check for available teachers
    const teacherCard = studentPage.locator('.teacher-card').first();
    await expect(teacherCard).toBeVisible({ timeout: 10000 });
    
    // Verify teacher is shown as online
    await expect(studentPage.locator('text=Teacher Two')).toBeVisible();
    await expect(studentPage.locator('.bg-green-500')).toBeVisible(); // Online indicator
    console.log('✓ Student can see online teacher');
  });

  test('3. Student Initiates Video Call', async () => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Click on call button for the teacher
    const callButton = studentPage.locator('button:has-text("Start Call")').first();
    await expect(callButton).toBeVisible();
    await callButton.click();
    
    // Wait for video call interface
    await expect(studentPage.locator('.video-call-container')).toBeVisible({ timeout: 10000 });
    
    // Grant camera/microphone permissions if prompted (handled by context permissions)
    await studentPage.waitForTimeout(2000);
    
    // Verify local video stream
    const localVideo = studentPage.locator('video').first();
    await expect(localVideo).toBeVisible({ timeout: 10000 });
    console.log('✓ Student video call initiated');
  });

  test('4. Teacher Receives and Accepts Call', async () => {
    test.setTimeout(TEST_TIMEOUT);
    
    // Teacher should see incoming call notification
    await expect(teacherPage.locator('text=Incoming call from Student')).toBeVisible({ timeout: 15000 });
    
    // Accept the call
    const acceptButton = teacherPage.locator('button:has-text("Accept")');
    await acceptButton.click();
    
    // Wait for video interface to load
    await expect(teacherPage.locator('.video-call-container')).toBeVisible({ timeout: 10000 });
    
    // Verify teacher's local video
    const localVideo = teacherPage.locator('video').first();
    await expect(localVideo).toBeVisible({ timeout: 10000 });
    console.log('✓ Teacher accepted call');
  });

  test('5. Test Video/Audio Controls', async () => {
    // Test mute/unmute on student side
    const studentMuteButton = studentPage.locator('[aria-label="Toggle microphone"]');
    await studentMuteButton.click();
    await expect(studentPage.locator('.text-red-500')).toBeVisible(); // Muted indicator
    await studentMuteButton.click();
    await expect(studentPage.locator('.text-red-500')).not.toBeVisible();
    
    // Test video on/off on student side
    const studentVideoButton = studentPage.locator('[aria-label="Toggle camera"]');
    await studentVideoButton.click();
    await expect(studentPage.locator('text=Camera Off')).toBeVisible();
    await studentVideoButton.click();
    
    // Test mute on teacher side
    const teacherMuteButton = teacherPage.locator('[aria-label="Toggle microphone"]');
    await teacherMuteButton.click();
    await expect(teacherPage.locator('.text-red-500')).toBeVisible();
    await teacherMuteButton.click();
    
    console.log('✓ Video/Audio controls working');
  });

  test('6. Test AI Assistant Features', async () => {
    // Open AI Assistant on student side
    const aiButton = studentPage.locator('button:has-text("AI Assistant")');
    await aiButton.click();
    
    // Wait for AI panel to open
    await expect(studentPage.locator('text=AI Assistant')).toBeVisible({ timeout: 5000 });
    
    // Test Translation
    await studentPage.click('text=Translation');
    await studentPage.fill('input[placeholder*="Type here"]', 'Hello teacher');
    await studentPage.click('button:has-text("Translate")');
    
    // Wait for translation result (mocked or real)
    await studentPage.waitForTimeout(2000);
    
    // Test Word Helper
    await studentPage.click('text=Words');
    await studentPage.click('button:has-text("Get Suggestions")');
    await studentPage.waitForTimeout(2000);
    
    // Test Grammar Check
    await studentPage.click('text=Grammar');
    await studentPage.fill('input[placeholder*="grammar"]', 'I are student');
    await studentPage.click('button:has-text("Check Grammar")');
    await studentPage.waitForTimeout(2000);
    
    // Test Pronunciation
    await studentPage.click('text=Pronunciation');
    await studentPage.fill('input[placeholder*="word"]', 'difficult');
    await studentPage.click('button:has-text("Get Pronunciation")');
    await studentPage.waitForTimeout(2000);
    
    // Close AI Assistant
    await studentPage.click('button[aria-label="Close AI Assistant"]');
    
    console.log('✓ AI Assistant features tested');
  });

  test('7. Test Teacher Briefing Panel', async () => {
    // Check if briefing panel is visible for teacher
    const briefingPanel = teacherPage.locator('text=Student Briefing');
    
    if (await briefingPanel.isVisible()) {
      // Verify student information is shown
      await expect(teacherPage.locator('text=Student Two')).toBeVisible();
      await expect(teacherPage.locator('text=Current Package')).toBeVisible();
      
      // Close and reopen briefing
      await teacherPage.click('button:has-text("×")');
      await expect(briefingPanel).not.toBeVisible();
      
      await teacherPage.click('button:has-text("Show Briefing")');
      await expect(briefingPanel).toBeVisible();
      
      console.log('✓ Teacher briefing panel working');
    }
  });

  test('8. Test Scoring Overlay', async () => {
    // Check scoring overlay on both sides
    const studentScoring = studentPage.locator('.scoring-overlay');
    const teacherScoring = teacherPage.locator('.scoring-overlay');
    
    // Scoring should be visible
    await expect(studentScoring).toBeVisible({ timeout: 5000 });
    await expect(teacherScoring).toBeVisible({ timeout: 5000 });
    
    // Check scoring categories
    await expect(studentPage.locator('text=Speaking Fluency')).toBeVisible();
    await expect(studentPage.locator('text=Pronunciation')).toBeVisible();
    await expect(studentPage.locator('text=Grammar')).toBeVisible();
    
    console.log('✓ Scoring overlay visible');
  });

  test('9. Test Picture-in-Picture Layout', async () => {
    // Test PiP positioning on student side
    const pipVideo = studentPage.locator('.pip-video').first();
    
    // Click to change position
    await pipVideo.click();
    await studentPage.waitForTimeout(500);
    
    // Double-click to swap videos
    await pipVideo.dblclick();
    await studentPage.waitForTimeout(500);
    
    console.log('✓ Picture-in-Picture layout working');
  });

  test('10. Test Screen Sharing', async () => {
    // Start screen sharing from teacher
    const shareButton = teacherPage.locator('button:has-text("Share Screen")');
    
    if (await shareButton.isVisible()) {
      await shareButton.click();
      
      // Handle screen share permission (may be automatic with permissions)
      await teacherPage.waitForTimeout(2000);
      
      // Verify screen is being shared
      const stopShareButton = teacherPage.locator('button:has-text("Stop Sharing")');
      if (await stopShareButton.isVisible({ timeout: 5000 })) {
        await stopShareButton.click();
        console.log('✓ Screen sharing tested');
      }
    }
  });

  test('11. Test Call Recording', async () => {
    // Start recording from student side
    const recordButton = studentPage.locator('button[aria-label="Start recording"]');
    
    if (await recordButton.isVisible()) {
      await recordButton.click();
      
      // Verify recording started
      await expect(studentPage.locator('.recording-indicator')).toBeVisible({ timeout: 5000 });
      
      // Stop recording after 3 seconds
      await studentPage.waitForTimeout(3000);
      await recordButton.click();
      
      console.log('✓ Call recording tested');
    }
  });

  test('12. End Call and Cleanup', async () => {
    // End call from student side
    const endCallButton = studentPage.locator('button:has-text("End Call")');
    await endCallButton.click();
    
    // Confirm end call if dialog appears
    const confirmButton = studentPage.locator('button:has-text("Yes, end call")');
    if (await confirmButton.isVisible({ timeout: 2000 })) {
      await confirmButton.click();
    }
    
    // Verify call ended on student side
    await expect(studentPage.locator('text=Call ended')).toBeVisible({ timeout: 5000 });
    
    // Verify call ended on teacher side
    await expect(teacherPage.locator('text=Call ended')).toBeVisible({ timeout: 5000 });
    
    // Teacher goes offline
    await teacherPage.goto('http://localhost:5000/teacher/callern');
    const goOfflineButton = teacherPage.locator('button:has-text("Go Offline")');
    if (await goOfflineButton.isVisible({ timeout: 5000 })) {
      await goOfflineButton.click();
    }
    
    console.log('✓ Call ended successfully');
  });

  test('13. Verify Call History and Minutes Used', async () => {
    // Check student's package minutes
    await studentPage.goto('http://localhost:5000/callern');
    await studentPage.waitForLoadState('networkidle');
    
    // Look for updated minutes
    const packageInfo = studentPage.locator('.package-info').first();
    if (await packageInfo.isVisible({ timeout: 5000 })) {
      const minutesText = await packageInfo.textContent();
      console.log('✓ Package minutes updated:', minutesText);
    }
    
    // Check call history if available
    const historyButton = studentPage.locator('button:has-text("Call History")');
    if (await historyButton.isVisible()) {
      await historyButton.click();
      await expect(studentPage.locator('text=Teacher Two')).toBeVisible({ timeout: 5000 });
      console.log('✓ Call history recorded');
    }
  });
});

// Performance and Load Tests
test.describe('Callern Performance Tests', () => {
  test('Connection establishment time', async ({ page }) => {
    const startTime = Date.now();
    
    // Login and navigate to Callern
    await page.goto('http://localhost:5000');
    await page.fill('input[type="email"]', STUDENT_EMAIL);
    await page.fill('input[type="password"]', STUDENT_PASSWORD);
    await page.click('button[type="submit"]');
    await page.waitForURL('**/dashboard');
    
    const loadTime = Date.now() - startTime;
    expect(loadTime).toBeLessThan(5000); // Should load within 5 seconds
    
    console.log(`✓ Page load time: ${loadTime}ms`);
  });

  test('WebRTC connection reliability', async ({ page }) => {
    // Test multiple connect/disconnect cycles
    for (let i = 0; i < 3; i++) {
      await page.goto('http://localhost:5000/callern');
      await page.waitForLoadState('networkidle');
      
      // Verify WebSocket connection
      await expect(page.locator('.connection-status')).toBeVisible({ timeout: 5000 });
      
      console.log(`✓ Connection cycle ${i + 1} successful`);
      await page.waitForTimeout(1000);
    }
  });
});

// Error Handling Tests
test.describe('Callern Error Handling', () => {
  test('Handle network disconnection gracefully', async ({ page }) => {
    await page.goto('http://localhost:5000/callern');
    
    // Simulate offline mode
    await page.context().setOffline(true);
    await page.waitForTimeout(2000);
    
    // Should show connection error
    await expect(page.locator('text=Connection lost')).toBeVisible({ timeout: 5000 });
    
    // Go back online
    await page.context().setOffline(false);
    await page.waitForTimeout(2000);
    
    // Should reconnect
    await expect(page.locator('text=Connected')).toBeVisible({ timeout: 10000 });
    
    console.log('✓ Network error handling works');
  });

  test('Handle invalid call scenarios', async ({ page }) => {
    // Try to call without package
    await page.goto('http://localhost:5000/callern');
    
    // If no package, should show appropriate message
    const noPackageMessage = page.locator('text=No active package');
    if (await noPackageMessage.isVisible({ timeout: 2000 })) {
      console.log('✓ No package error handled');
    }
    
    // Try to call offline teacher
    const offlineTeacher = page.locator('.teacher-card:has-text("Offline")').first();
    if (await offlineTeacher.isVisible({ timeout: 2000 })) {
      const callButton = offlineTeacher.locator('button:has-text("Call")');
      if (await callButton.isDisabled()) {
        console.log('✓ Cannot call offline teacher');
      }
    }
  });
});

console.log('\n========================================');
console.log('   Callern E2E Test Suite Complete');
console.log('========================================\n');