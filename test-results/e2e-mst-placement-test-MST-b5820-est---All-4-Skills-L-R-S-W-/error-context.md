# Test info

- Name: MST Placement Test - Complete Flow >> Complete MST Test - All 4 Skills (L-R-S-W)
- Location: /home/runner/workspace/tests/e2e/mst-placement-test.spec.ts:23:3

# Error details

```
Error: browserType.launch: 
╔══════════════════════════════════════════════════════╗
║ Host system is missing dependencies to run browsers. ║
║ Please install them with the following command:      ║
║                                                      ║
║     sudo npx playwright install-deps                 ║
║                                                      ║
║ Alternatively, use apt:                              ║
║     sudo apt-get install libglib2.0-0t64\            ║
║         libnss3\                                     ║
║         libnspr4\                                    ║
║         libdbus-1-3\                                 ║
║         libatk1.0-0t64\                              ║
║         libatk-bridge2.0-0t64\                       ║
║         libcups2t64\                                 ║
║         libxcb1\                                     ║
║         libxkbcommon0\                               ║
║         libatspi2.0-0t64\                            ║
║         libx11-6\                                    ║
║         libxcomposite1\                              ║
║         libxdamage1\                                 ║
║         libxext6\                                    ║
║         libxfixes3\                                  ║
║         libxrandr2\                                  ║
║         libgbm1\                                     ║
║         libpango-1.0-0\                              ║
║         libcairo2\                                   ║
║         libasound2t64                                ║
║                                                      ║
║ <3 Playwright Team                                   ║
╚══════════════════════════════════════════════════════╝
```

# Test source

```ts
   1 | import { test, expect, Page } from '@playwright/test';
   2 |
   3 | test.describe('MST Placement Test - Complete Flow', () => {
   4 |   let page: Page;
   5 |
   6 |   test.beforeEach(async ({ browser }) => {
   7 |     page = await browser.newPage();
   8 |     
   9 |     // Login as student
   10 |     await page.goto('/auth');
   11 |     await page.fill('[data-testid="input-email"]', 'student2@test.com');
   12 |     await page.fill('[data-testid="input-password"]', 'password123');
   13 |     await page.click('[data-testid="button-login"]');
   14 |     
   15 |     // Wait for dashboard to load
   16 |     await expect(page).toHaveURL(/.*\/dashboard/);
   17 |     
   18 |     // Navigate to MST test
   19 |     await page.goto('/mst');
   20 |     await expect(page.locator('h1')).toContainText('MST Placement Test');
   21 |   });
   22 |
>  23 |   test('Complete MST Test - All 4 Skills (L-R-S-W)', async () => {
      |   ^ Error: browserType.launch: 
   24 |     // Start the test
   25 |     await page.click('[data-testid="button-start-mst"]');
   26 |     
   27 |     // Wait for test to begin
   28 |     await expect(page.locator('text=MST Test - LISTENING')).toBeVisible();
   29 |     
   30 |     // === LISTENING SECTION ===
   31 |     console.log('Starting Listening Section...');
   32 |     
   33 |     // Wait for audio controls to appear
   34 |     await expect(page.locator('[data-testid="button-play-audio"]')).toBeVisible();
   35 |     
   36 |     // Play audio
   37 |     await page.click('[data-testid="button-play-audio"]');
   38 |     await page.waitForTimeout(2000); // Let audio play for 2 seconds
   39 |     
   40 |     // Answer the listening question
   41 |     await page.click('[data-testid="radio-q0-opt1"]'); // Select "Tuesday at 3 PM"
   42 |     
   43 |     // Wait for guard timer to complete (2 seconds)
   44 |     await page.waitForTimeout(3000);
   45 |     
   46 |     // Submit listening response
   47 |     await page.click('[data-testid="button-submit"]');
   48 |     
   49 |     // Wait for next skill or stage
   50 |     await page.waitForTimeout(2000);
   51 |     
   52 |     // === READING SECTION ===
   53 |     console.log('Starting Reading Section...');
   54 |     
   55 |     // Wait for reading section to appear
   56 |     await expect(page.locator('text=MST Test - READING')).toBeVisible({ timeout: 10000 });
   57 |     
   58 |     // Read the passage and answer questions
   59 |     await page.waitForTimeout(3000); // Time to read
   60 |     
   61 |     // Answer reading question
   62 |     await page.click('[data-testid="radio-q0-opt1"]'); // Select appropriate answer
   63 |     
   64 |     // Wait for guard timer
   65 |     await page.waitForTimeout(3000);
   66 |     
   67 |     // Submit reading response
   68 |     await page.click('[data-testid="button-submit"]');
   69 |     
   70 |     // === SPEAKING SECTION ===
   71 |     console.log('Starting Speaking Section...');
   72 |     
   73 |     // Wait for speaking section to appear
   74 |     await expect(page.locator('text=MST Test - SPEAKING')).toBeVisible({ timeout: 10000 });
   75 |     
   76 |     // Wait for preparation time
   77 |     await page.waitForTimeout(2000);
   78 |     
   79 |     // Start recording
   80 |     await page.click('[data-testid="button-record"]');
   81 |     
   82 |     // Record for a few seconds
   83 |     await page.waitForTimeout(5000);
   84 |     
   85 |     // Stop recording
   86 |     await page.click('[data-testid="button-record"]');
   87 |     
   88 |     // Wait for recording to be ready
   89 |     await expect(page.locator('[data-testid="text-recording-ready"]')).toBeVisible();
   90 |     
   91 |     // Wait for guard timer
   92 |     await page.waitForTimeout(3000);
   93 |     
   94 |     // Submit speaking response
   95 |     await page.click('[data-testid="button-submit"]');
   96 |     
   97 |     // === WRITING SECTION ===
   98 |     console.log('Starting Writing Section...');
   99 |     
  100 |     // Wait for writing section to appear
  101 |     await expect(page.locator('text=MST Test - WRITING')).toBeVisible({ timeout: 10000 });
  102 |     
  103 |     // Write response
  104 |     const writingResponse = `I believe that studying abroad offers unique advantages for language learning. 
  105 |     First, immersion in the target language environment accelerates fluency development through constant exposure. 
  106 |     Students interact with native speakers daily, improving pronunciation and cultural understanding. 
  107 |     However, studying in your home country also has benefits, including lower costs and familiar support systems. 
  108 |     Both approaches can be effective depending on individual learning styles and circumstances.`;
  109 |     
  110 |     await page.fill('[data-testid="textarea-writing"]', writingResponse);
  111 |     
  112 |     // Wait for guard timer
  113 |     await page.waitForTimeout(3000);
  114 |     
  115 |     // Submit writing response
  116 |     await page.click('[data-testid="button-submit"]');
  117 |     
  118 |     // === TEST COMPLETION ===
  119 |     console.log('Waiting for test completion...');
  120 |     
  121 |     // Wait for completion screen
  122 |     await expect(page.locator('text=Test Completed')).toBeVisible({ timeout: 15000 });
  123 |     
```