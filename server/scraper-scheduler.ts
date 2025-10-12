/**
 * Automated Scraper Scheduler
 * Manages recurring scraping jobs with configurable schedules
 */

import { db } from './db';
import { scrapeJobs } from '@shared/schema';
import { eq } from 'drizzle-orm';
import { getScraperService } from './scraper-service';

export interface ScheduleConfig {
  id?: number;
  name: string;
  type: 'competitor_pricing' | 'lead_generation' | 'market_trends';
  frequency: 'daily' | 'weekly' | 'monthly' | 'custom';
  intervalMinutes?: number; // For custom frequency
  config: {
    competitorKey?: string;
    platformKey?: string;
    searchQuery?: string;
    category?: string;
    sources?: string[];
  };
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
}

export class ScraperScheduler {
  private schedules: Map<number, NodeJS.Timeout> = new Map();
  private isRunning: boolean = false;

  constructor() {}

  /**
   * Start the scheduler
   */
  async start(): Promise<void> {
    if (this.isRunning) {
      console.log('⚠️ Scraper scheduler already running');
      return;
    }

    console.log('🔄 Starting scraper scheduler...');
    this.isRunning = true;

    // Load schedules from database or config
    await this.loadSchedules();

    console.log('✅ Scraper scheduler started');
  }

  /**
   * Stop the scheduler
   */
  stop(): void {
    console.log('🛑 Stopping scraper scheduler...');
    
    // Clear all scheduled jobs
    this.schedules.forEach((timeout, id) => {
      clearInterval(timeout);
    });
    
    this.schedules.clear();
    this.isRunning = false;
    
    console.log('✅ Scraper scheduler stopped');
  }

  /**
   * Load schedules from configuration
   */
  private async loadSchedules(): Promise<void> {
    // Example schedules - these could be loaded from database
    const defaultSchedules: ScheduleConfig[] = [
      {
        name: 'Daily Competitor Pricing Scrape',
        type: 'competitor_pricing',
        frequency: 'daily',
        config: {
          competitorKey: 'generic_institute_1',
          searchQuery: 'آموزش زبان انگلیسی'
        },
        enabled: true
      },
      {
        name: 'Weekly Lead Generation',
        type: 'lead_generation',
        frequency: 'weekly',
        config: {
          platformKey: 'instagram',
          searchQuery: 'زبان_انگلیسی'
        },
        enabled: true
      },
      {
        name: 'Daily Market Trends Analysis',
        type: 'market_trends',
        frequency: 'daily',
        config: {
          category: 'Language Education',
          sources: [
            'https://example-news.com',
            'https://example-blog.com'
          ]
        },
        enabled: true
      }
    ];

    // Schedule each job
    defaultSchedules.forEach((schedule, index) => {
      if (schedule.enabled) {
        this.scheduleJob(index, schedule);
      }
    });
  }

  /**
   * Schedule a scraping job
   */
  scheduleJob(id: number, schedule: ScheduleConfig): void {
    const intervalMs = this.getIntervalMs(schedule.frequency, schedule.intervalMinutes);
    
    console.log(`📅 Scheduling job: ${schedule.name} (every ${this.formatInterval(intervalMs)})`);

    // Create interval
    const timeout = setInterval(async () => {
      await this.executeJob(schedule);
    }, intervalMs);

    this.schedules.set(id, timeout);

    // Execute immediately on first load (optional)
    // this.executeJob(schedule);
  }

  /**
   * Execute a scheduled job
   */
  private async executeJob(schedule: ScheduleConfig): Promise<void> {
    const scraper = getScraperService();
    
    try {
      console.log(`🚀 Executing scheduled job: ${schedule.name}`);

      switch (schedule.type) {
        case 'competitor_pricing':
          if (schedule.config.competitorKey && schedule.config.searchQuery) {
            // Create job
            const jobId = await scraper.createScrapeJob({
              url: `scheduled:${schedule.config.competitorKey}`,
              jobType: 'competitor_pricing'
            });

            // Execute scraping
            const result = await scraper.scrapeCompetitorPricing(
              schedule.config.competitorKey,
              schedule.config.searchQuery,
              jobId
            );

            console.log(`✅ Scheduled competitor pricing scrape completed:`, result.success ? 'SUCCESS' : 'FAILED');
          }
          break;

        case 'lead_generation':
          if (schedule.config.platformKey && schedule.config.searchQuery) {
            // Create job
            const jobId = await scraper.createScrapeJob({
              url: `scheduled:${schedule.config.platformKey}`,
              jobType: 'lead_generation'
            });

            // Execute scraping
            const result = await scraper.scrapeLeads(
              schedule.config.platformKey,
              schedule.config.searchQuery,
              jobId
            );

            console.log(`✅ Scheduled lead scraping completed:`, result.success ? 'SUCCESS' : 'FAILED');
          }
          break;

        case 'market_trends':
          if (schedule.config.category && schedule.config.sources) {
            // Create job
            const jobId = await scraper.createScrapeJob({
              url: schedule.config.sources[0],
              jobType: 'market_trends'
            });

            // Execute analysis
            const result = await scraper.scrapeMarketTrends(
              schedule.config.category,
              schedule.config.sources,
              jobId
            );

            console.log(`✅ Scheduled market trends analysis completed:`, result.success ? 'SUCCESS' : 'FAILED');
          }
          break;
      }

    } catch (error: any) {
      console.error(`❌ Scheduled job failed: ${schedule.name}`, error.message);
    }
  }

  /**
   * Get interval in milliseconds based on frequency
   */
  private getIntervalMs(frequency: string, customMinutes?: number): number {
    switch (frequency) {
      case 'daily':
        return 24 * 60 * 60 * 1000; // 24 hours
      case 'weekly':
        return 7 * 24 * 60 * 60 * 1000; // 7 days
      case 'monthly':
        return 30 * 24 * 60 * 60 * 1000; // 30 days
      case 'custom':
        return (customMinutes || 60) * 60 * 1000; // Custom minutes
      default:
        return 24 * 60 * 60 * 1000; // Default to daily
    }
  }

  /**
   * Format interval for display
   */
  private formatInterval(ms: number): string {
    const hours = ms / (60 * 60 * 1000);
    const days = hours / 24;

    if (days >= 1) {
      return `${Math.round(days)} day(s)`;
    } else if (hours >= 1) {
      return `${Math.round(hours)} hour(s)`;
    } else {
      return `${Math.round(ms / (60 * 1000))} minute(s)`;
    }
  }

  /**
   * Add new schedule
   */
  addSchedule(schedule: ScheduleConfig): void {
    const id = this.schedules.size;
    if (schedule.enabled) {
      this.scheduleJob(id, schedule);
      console.log(`✅ Schedule added: ${schedule.name}`);
    }
  }

  /**
   * Remove schedule
   */
  removeSchedule(id: number): void {
    const timeout = this.schedules.get(id);
    if (timeout) {
      clearInterval(timeout);
      this.schedules.delete(id);
      console.log(`✅ Schedule removed: ${id}`);
    }
  }

  /**
   * Get all active schedules
   */
  getActiveSchedules(): number[] {
    return Array.from(this.schedules.keys());
  }
}

// Singleton instance
let schedulerInstance: ScraperScheduler | null = null;

export function getScraperScheduler(): ScraperScheduler {
  if (!schedulerInstance) {
    schedulerInstance = new ScraperScheduler();
  }
  return schedulerInstance;
}

// Auto-start scheduler (optional - can be controlled via API)
export async function initializeScraperScheduler(): Promise<void> {
  const scheduler = getScraperScheduler();
  await scheduler.start();
}
