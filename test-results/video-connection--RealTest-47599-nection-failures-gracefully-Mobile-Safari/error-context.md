# Test info

- Name: +++RealTest: Video Connection Flow >> should handle WebRTC connection failures gracefully
- Location: /home/runner/workspace/tests/e2e/video-connection.spec.ts:96:3

# Error details

```
Error: browserType.launch: Executable doesn't exist at /home/runner/workspace/.cache/ms-playwright/webkit-2158/pw_run.sh
╔═════════════════════════════════════════════════════════════════════════╗
║ Looks like Playwright Test or Playwright was just installed or updated. ║
║ Please run the following command to download new browsers:              ║
║                                                                         ║
║     npx playwright install                                              ║
║                                                                         ║
║ <3 Playwright Team                                                      ║
╚═════════════════════════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect, Page } from '@playwright/test';
   2 |
   3 | // Real E2E test for video connection establishment
   4 | test.describe('+++RealTest: Video Connection Flow', () => {
   5 |   let teacherPage: Page;
   6 |   let studentPage: Page;
   7 |
   8 |   test.beforeEach(async ({ browser }) => {
   9 |     // Create teacher and student pages
   10 |     teacherPage = await browser.newPage();
   11 |     studentPage = await browser.newPage();
   12 |
   13 |     // Grant media permissions
   14 |     await teacherPage.context().grantPermissions(['camera', 'microphone']);
   15 |     await studentPage.context().grantPermissions(['camera', 'microphone']);
   16 |   });
   17 |
   18 |   test('should establish WebRTC connection between teacher and student', async () => {
   19 |     // Login as teacher
   20 |     await teacherPage.goto('/auth');
   21 |     await teacherPage.fill('input[type="email"]', 'teacher1@test.com');
   22 |     await teacherPage.fill('input[type="password"]', 'password123');
   23 |     await teacherPage.click('button[type="submit"]');
   24 |     await teacherPage.waitForURL('/dashboard');
   25 |
   26 |     // Login as student
   27 |     await studentPage.goto('/auth');
   28 |     await studentPage.fill('input[type="email"]', 'student2@test.com');
   29 |     await studentPage.fill('input[type="password"]', 'password123');
   30 |     await studentPage.click('button[type="submit"]');
   31 |     await studentPage.waitForURL('/dashboard');
   32 |
   33 |     // Teacher goes online
   34 |     await teacherPage.goto('/teacher/callern');
   35 |     await teacherPage.waitForSelector('[data-testid="teacher-online-toggle"]');
   36 |     await teacherPage.click('[data-testid="teacher-online-toggle"]');
   37 |     
   38 |     // Wait for online status
   39 |     await expect(teacherPage.locator('[data-testid="online-status"]')).toContainText('Online');
   40 |
   41 |     // Student initiates call
   42 |     await studentPage.goto('/student/tutors');
   43 |     await studentPage.waitForSelector('[data-testid="available-teacher"]');
   44 |     await studentPage.click('[data-testid="call-teacher-btn"]');
   45 |
   46 |     // Teacher accepts call
   47 |     await expect(teacherPage.locator('[data-testid="incoming-call"]')).toBeVisible();
   48 |     await teacherPage.click('[data-testid="accept-call-btn"]');
   49 |
   50 |     // Wait for video call interface
   51 |     await Promise.all([
   52 |       teacherPage.waitForSelector('[data-testid="video-call-interface"]'),
   53 |       studentPage.waitForSelector('[data-testid="video-call-interface"]')
   54 |     ]);
   55 |
   56 |     // Check WebRTC connection status
   57 |     const teacherConnectionStatus = await teacherPage.locator('[data-testid="connection-status"]').textContent();
   58 |     const studentConnectionStatus = await studentPage.locator('[data-testid="connection-status"]').textContent();
   59 |     
   60 |     expect(teacherConnectionStatus).toBe('connected');
   61 |     expect(studentConnectionStatus).toBe('connected');
   62 |
   63 |     // Verify video elements are present and have media streams
   64 |     const teacherLocalVideo = teacherPage.locator('[data-testid="local-video"]');
   65 |     const teacherRemoteVideo = teacherPage.locator('[data-testid="remote-video"]');
   66 |     const studentLocalVideo = studentPage.locator('[data-testid="local-video"]');
   67 |     const studentRemoteVideo = studentPage.locator('[data-testid="remote-video"]');
   68 |
   69 |     await expect(teacherLocalVideo).toBeVisible();
   70 |     await expect(teacherRemoteVideo).toBeVisible();
   71 |     await expect(studentLocalVideo).toBeVisible();
   72 |     await expect(studentRemoteVideo).toBeVisible();
   73 |
   74 |     // Test media controls
   75 |     await teacherPage.click('[data-testid="toggle-video-btn"]');
   76 |     await expect(teacherPage.locator('[data-testid="video-disabled-indicator"]')).toBeVisible();
   77 |
   78 |     await teacherPage.click('[data-testid="toggle-audio-btn"]');
   79 |     await expect(teacherPage.locator('[data-testid="audio-disabled-indicator"]')).toBeVisible();
   80 |
   81 |     // Test call duration tracking
   82 |     await teacherPage.waitForTimeout(3000); // Wait 3 seconds
   83 |     const duration = await teacherPage.locator('[data-testid="call-duration"]').textContent();
   84 |     expect(duration).toMatch(/00:0[0-9]/); // Should show some duration
   85 |
   86 |     // End call
   87 |     await teacherPage.click('[data-testid="end-call-btn"]');
   88 |     
   89 |     // Verify both sides return to dashboard
   90 |     await Promise.all([
   91 |       teacherPage.waitForURL('/dashboard'),
   92 |       studentPage.waitForURL('/dashboard')
   93 |     ]);
   94 |   });
   95 |
>  96 |   test('should handle WebRTC connection failures gracefully', async () => {
      |   ^ Error: browserType.launch: Executable doesn't exist at /home/runner/workspace/.cache/ms-playwright/webkit-2158/pw_run.sh
   97 |     // Mock network failure scenarios
   98 |     await teacherPage.route('**/*', route => {
   99 |       if (route.request().url().includes('stun:')) {
  100 |         route.abort();
  101 |       } else {
  102 |         route.continue();
  103 |       }
  104 |     });
  105 |
  106 |     // Try to establish connection with STUN servers blocked
  107 |     await teacherPage.goto('/callern/video/test-room-123');
  108 |     
  109 |     // Should show connection error
  110 |     await expect(teacherPage.locator('[data-testid="connection-error"]')).toBeVisible();
  111 |     await expect(teacherPage.locator('[data-testid="connection-status"]')).toContainText('disconnected');
  112 |
  113 |     // Should offer retry option
  114 |     await expect(teacherPage.locator('[data-testid="retry-connection-btn"]')).toBeVisible();
  115 |   });
  116 |
  117 |   test('should maintain stable connection during extended call', async () => {
  118 |     // Login both users and establish connection (abbreviated)
  119 |     await teacherPage.goto('/callern/video/stability-test');
  120 |     await studentPage.goto('/callern/video/stability-test');
  121 |
  122 |     // Wait for connection establishment
  123 |     await Promise.all([
  124 |       teacherPage.waitForSelector('[data-testid="connection-status"]:has-text("connected")'),
  125 |       studentPage.waitForSelector('[data-testid="connection-status"]:has-text("connected")')
  126 |     ]);
  127 |
  128 |     // Monitor connection for 30 seconds
  129 |     for (let i = 0; i < 6; i++) {
  130 |       await teacherPage.waitForTimeout(5000);
  131 |       
  132 |       const teacherStatus = await teacherPage.locator('[data-testid="connection-status"]').textContent();
  133 |       const studentStatus = await studentPage.locator('[data-testid="connection-status"]').textContent();
  134 |       
  135 |       expect(teacherStatus).toBe('connected');
  136 |       expect(studentStatus).toBe('connected');
  137 |       
  138 |       // Check if video streams are still active
  139 |       const teacherVideoActive = await teacherPage.locator('[data-testid="local-video"]').isVisible();
  140 |       const studentVideoActive = await studentPage.locator('[data-testid="local-video"]').isVisible();
  141 |       
  142 |       expect(teacherVideoActive).toBe(true);
  143 |       expect(studentVideoActive).toBe(true);
  144 |     }
  145 |   });
  146 |
  147 |   test.afterEach(async () => {
  148 |     await teacherPage.close();
  149 |     await studentPage.close();
  150 |   });
  151 | });
```