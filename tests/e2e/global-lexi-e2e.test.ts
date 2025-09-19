import { describe, it, expect, beforeAll, afterAll, beforeEach, afterEach } from 'vitest';
import { test as baseTest } from '@playwright/test';
import type { Page } from '@playwright/test';

const test = baseTest.extend<{ page: Page }>({});

describe('Global Lexi E2E - Complete Activity Tracking & Insights', () => {
  let page: Page;

  beforeAll(async ({ browser }) => {
    page = await browser.newPage();
  });

  afterAll(async () => {
    await page?.close();
  });

  beforeEach(async () => {
    // Login as student to access the system
    await page.goto('/login');
    await page.fill('input[data-testid="input-email"]', 'student2@test.com');
    await page.fill('input[data-testid="input-password"]', 'password123');
    await page.click('button[data-testid="button-submit"]');
    
    // Wait for dashboard to load
    await page.waitForURL('/dashboard');
    await page.waitForSelector('[data-testid="text-welcome"]');
  });

  describe('Activity Tracking Flow', () => {
    it('should track homework activities and reflect in insights', async () => {
      // Navigate to homework section
      await page.click('a[href="/homework"]');
      await page.waitForURL('/homework');
      
      // Simulate starting homework activity
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'homework',
            activityType: 'assignment_start',
            metadata: {
              assignmentId: 'grammar-unit-4',
              difficulty: 'intermediate'
            }
          }
        }));
      });

      // Wait a moment for the activity to be tracked
      await page.waitForTimeout(1000);

      // Open Lexi from bottom navigation
      await page.click('[data-testid="nav-lexi"]');
      
      // Wait for Lexi to load and show activity-aware content
      await page.waitForSelector('[data-testid="lexi-companion"]');
      
      // Check that Lexi is aware of homework activity
      const lexiMessage = await page.textContent('[data-testid="lexi-message"]');
      expect(lexiMessage).toMatch(/homework|assignment|grammar/i);
    });

    it('should track flashcard study and provide relevant insights', async () => {
      // Navigate to flashcards
      await page.click('a[href="/flashcards"]');
      await page.waitForURL('/flashcards');
      
      // Simulate multiple flashcard interactions
      for (let i = 0; i < 5; i++) {
        await page.evaluate((cardNum) => {
          window.dispatchEvent(new CustomEvent('lexi-track-activity', {
            detail: {
              module: 'flashcards',
              activityType: 'card_study',
              metadata: {
                cardId: `vocab-card-${cardNum}`,
                correct: Math.random() > 0.3, // 70% success rate
                timeSpent: Math.floor(Math.random() * 60) + 10
              }
            }
          }));
        }, i);
        
        await page.waitForTimeout(200);
      }

      // Open Lexi to check insights
      await page.click('[data-testid="nav-lexi"]');
      await page.waitForSelector('[data-testid="lexi-insights"]');
      
      // Check that Lexi provides flashcard-specific insights
      const insights = await page.textContent('[data-testid="lexi-insights"]');
      expect(insights).toMatch(/vocabulary|flashcard|memory|practice/i);
    });

    it('should track CallerN sessions and provide speaking encouragement', async () => {
      // Navigate to CallerN
      await page.click('a[href="/callern"]');
      await page.waitForURL('/callern');
      
      // Simulate video session activity
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'callern',
            activityType: 'video_session_start',
            metadata: {
              sessionId: 'call-session-test-123',
              tutor: 'teacher-test',
              topic: 'conversation-practice'
            }
          }
        }));
      });

      await page.waitForTimeout(1000);

      // Open Lexi and ask about speaking
      await page.click('[data-testid="nav-lexi"]');
      await page.waitForSelector('[data-testid="lexi-input"]');
      
      await page.fill('[data-testid="lexi-input"]', 'I am nervous about speaking in English');
      await page.click('[data-testid="lexi-send"]');
      
      // Wait for Lexi's response
      await page.waitForSelector('[data-testid="lexi-response"]');
      
      const response = await page.textContent('[data-testid="lexi-response"]');
      expect(response).toMatch(/nervous|speaking|practice|confidence/i);
      expect(response).toMatch(/video|call/i); // Should be aware of CallerN context
    });
  });

  describe('Learning Analytics Integration', () => {
    it('should accumulate activities and provide comprehensive insights', async () => {
      // Simulate a diverse learning session
      const activities = [
        {
          module: 'homework',
          activityType: 'assignment_complete',
          metadata: { score: 85, timeSpent: 45 }
        },
        {
          module: 'flashcards', 
          activityType: 'vocabulary_review',
          metadata: { cardsStudied: 20, accuracy: 78 }
        },
        {
          module: 'callern',
          activityType: 'video_session_complete',
          metadata: { duration: 30, rating: 4 }
        }
      ];

      for (const activity of activities) {
        await page.evaluate((act) => {
          window.dispatchEvent(new CustomEvent('lexi-track-activity', {
            detail: act
          }));
        }, activity);
        
        await page.waitForTimeout(500);
      }

      // Navigate to dashboard to check learning analytics
      await page.goto('/dashboard');
      await page.waitForSelector('[data-testid="student-stats"]');

      // Open Lexi to get comprehensive insights
      await page.click('[data-testid="nav-lexi"]');
      await page.waitForSelector('[data-testid="lexi-analytics"]');

      const analytics = await page.textContent('[data-testid="lexi-analytics"]');
      
      // Should mention multiple activity types
      expect(analytics).toMatch(/homework.*flashcard.*video|video.*homework.*flashcard/i);
      
      // Should provide specific metrics
      expect(analytics).toMatch(/\d+.*minute|hour/i); // Study time
      expect(analytics).toMatch(/\d+.*percent|%/i); // Completion rates
    });

    it('should provide personalized recommendations based on activity patterns', async () => {
      // Simulate low homework completion pattern
      await page.evaluate(() => {
        for (let i = 0; i < 3; i++) {
          window.dispatchEvent(new CustomEvent('lexi-track-activity', {
            detail: {
              module: 'homework',
              activityType: 'assignment_start',
              metadata: { completed: false, timeSpent: 10 }
            }
          }));
        }
      });

      await page.waitForTimeout(1000);

      // Open Lexi and ask for help
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'I need help with my studies');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-recommendations"]');
      
      const recommendations = await page.textContent('[data-testid="lexi-recommendations"]');
      
      // Should provide homework-specific recommendations
      expect(recommendations).toMatch(/homework|assignment|complete/i);
      expect(recommendations).toMatch(/break.*down|smaller.*step|easier/i);
    });
  });

  describe('Cross-Module Intelligence', () => {
    it('should provide context-aware help across different learning modules', async () => {
      // Test homework context
      await page.goto('/homework');
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'This is difficult');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-response"]');
      const homeworkResponse = await page.textContent('[data-testid="lexi-response"]');
      
      // Clear chat
      await page.click('[data-testid="lexi-clear"]');

      // Test flashcard context  
      await page.goto('/flashcards');
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'This is difficult');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-response"]');
      const flashcardResponse = await page.textContent('[data-testid="lexi-response"]');

      // Clear chat
      await page.click('[data-testid="lexi-clear"]');

      // Test CallerN context
      await page.goto('/callern');
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'This is difficult');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-response"]');
      const callerNResponse = await page.textContent('[data-testid="lexi-response"]');

      // Responses should be different and context-appropriate
      expect(homeworkResponse).not.toBe(flashcardResponse);
      expect(flashcardResponse).not.toBe(callerNResponse);
      expect(homeworkResponse).not.toBe(callerNResponse);

      // Each should contain context-specific keywords
      expect(homeworkResponse).toMatch(/assignment|homework|step/i);
      expect(flashcardResponse).toMatch(/memory|word|association/i);  
      expect(callerNResponse).toMatch(/speaking|practice|nervous|confidence/i);
    });
  });

  describe('Real-time Activity Awareness', () => {
    it('should immediately adapt to current user activity', async () => {
      // Start in general context
      await page.goto('/dashboard');
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'Hi Lexi');
      await page.click('[data-testid="lexi-send"]');
      
      const generalResponse = await page.textContent('[data-testid="lexi-response"]');
      
      // Clear and move to specific context
      await page.click('[data-testid="lexi-clear"]');
      await page.goto('/callern');
      
      // Simulate starting a video call
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'callern',
            activityType: 'video_call_start',
            metadata: { nervousness: true }
          }
        }));
      });

      await page.waitForTimeout(500);

      // Same greeting should get different response
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'Hi Lexi');
      await page.click('[data-testid="lexi-send"]');
      
      const callerNResponse = await page.textContent('[data-testid="lexi-response"]');
      
      // Should be different and mention video/speaking context
      expect(callerNResponse).not.toBe(generalResponse);
      expect(callerNResponse).toMatch(/video|call|speaking|ready/i);
    });

    it('should track study time accurately across sessions', async () => {
      // Record study start time
      const startTime = Date.now();
      
      // Simulate extended study session
      await page.goto('/homework');
      
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'homework',
            activityType: 'study_session_start',
            metadata: { timestamp: Date.now() }
          }
        }));
      });

      // Simulate some study time
      await page.waitForTimeout(3000); // 3 seconds simulating study

      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'homework',
            activityType: 'study_session_end',
            metadata: { 
              timestamp: Date.now(),
              durationMinutes: 5 // Simulate 5 minutes of study
            }
          }
        }));
      });

      // Check study time reflection in Lexi
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'How much have I studied today?');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-response"]');
      const response = await page.textContent('[data-testid="lexi-response"]');
      
      // Should mention study time
      expect(response).toMatch(/\d+.*minute|hour|study.*time/i);
    });
  });

  describe('Persistent Learning History', () => {
    it('should remember activities across page refreshes', async () => {
      // Track some activities
      await page.goto('/homework');
      await page.evaluate(() => {
        window.dispatchEvent(new CustomEvent('lexi-track-activity', {
          detail: {
            module: 'homework',
            activityType: 'assignment_complete',
            metadata: { 
              assignmentId: 'persistent-test-assignment',
              score: 92
            }
          }
        }));
      });

      await page.waitForTimeout(1000);

      // Refresh the page
      await page.reload();
      await page.waitForSelector('[data-testid="text-welcome"]');

      // Check if activity is still remembered
      await page.click('[data-testid="nav-lexi"]');
      await page.fill('[data-testid="lexi-input"]', 'What did I accomplish recently?');
      await page.click('[data-testid="lexi-send"]');
      
      await page.waitForSelector('[data-testid="lexi-response"]');
      const response = await page.textContent('[data-testid="lexi-response"]');
      
      // Should reference the completed assignment
      expect(response).toMatch(/assignment|homework|complete|accomplish/i);
      expect(response).toMatch(/92|excellent|great/i); // Should mention the good score
    });
  });
});