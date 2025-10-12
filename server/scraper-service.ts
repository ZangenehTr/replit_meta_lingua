import puppeteer, { Browser, Page, PuppeteerLaunchOptions } from 'puppeteer';
import { db } from './db';
import { scrapeJobs, competitorPrices, scrapedLeads, marketTrends } from '@shared/schema';
import { eq } from 'drizzle-orm';

// User agent rotation for anti-detection
const USER_AGENTS = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:121.0) Gecko/20100101 Firefox/121.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 14.1; rv:121.0) Gecko/20100101 Firefox/121.0'
];

// Rate limiting configuration
interface RateLimitConfig {
  requestsPerMinute: number;
  delayBetweenRequests: number; // milliseconds
}

const DEFAULT_RATE_LIMIT: RateLimitConfig = {
  requestsPerMinute: 10,
  delayBetweenRequests: 2000 // 2 seconds
};

export interface ScrapeConfig {
  url: string;
  jobType: 'competitor_pricing' | 'lead_generation' | 'market_trends';
  maxRetries?: number;
  timeout?: number;
  rateLimit?: RateLimitConfig;
  customHeaders?: Record<string, string>;
}

export interface ScrapeResult {
  success: boolean;
  data?: any;
  error?: string;
  scrapedAt: Date;
}

export class ScraperService {
  private browser: Browser | null = null;
  private lastRequestTime: number = 0;
  private requestCount: number = 0;
  private requestTimes: number[] = [];

  constructor() {}

  /**
   * Initialize browser with stealth mode and anti-detection measures
   */
  private async getBrowser(): Promise<Browser> {
    if (this.browser && this.browser.isConnected()) {
      return this.browser;
    }

    const launchOptions: PuppeteerLaunchOptions = {
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu',
        '--window-size=1920,1080',
        '--disable-blink-features=AutomationControlled',
        '--user-agent=' + this.getRandomUserAgent()
      ]
    };

    this.browser = await puppeteer.launch(launchOptions);
    return this.browser;
  }

  /**
   * Get random user agent for anti-detection
   */
  private getRandomUserAgent(): string {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
  }

  /**
   * Apply rate limiting
   */
  private async applyRateLimit(config: RateLimitConfig = DEFAULT_RATE_LIMIT): Promise<void> {
    const now = Date.now();
    
    // Clean up request times older than 1 minute
    this.requestTimes = this.requestTimes.filter(time => now - time < 60000);
    
    // Check if we've exceeded rate limit
    if (this.requestTimes.length >= config.requestsPerMinute) {
      const oldestRequest = this.requestTimes[0];
      const waitTime = 60000 - (now - oldestRequest);
      if (waitTime > 0) {
        console.log(`⏳ Rate limit reached, waiting ${waitTime}ms`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }

    // Apply delay between requests
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < config.delayBetweenRequests) {
      const delay = config.delayBetweenRequests - timeSinceLastRequest;
      await new Promise(resolve => setTimeout(resolve, delay));
    }

    this.lastRequestTime = Date.now();
    this.requestTimes.push(this.lastRequestTime);
  }

  /**
   * Create new scrape job in database
   */
  async createScrapeJob(config: ScrapeConfig): Promise<number> {
    const [job] = await db.insert(scrapeJobs).values({
      jobType: config.jobType,
      targetUrl: config.url,
      status: 'pending',
      config: config as any,
      attempts: 0,
      maxRetries: config.maxRetries || 3
    }).returning();

    return job.id;
  }

  /**
   * Update scrape job status
   */
  async updateScrapeJob(jobId: number, updates: {
    status?: string;
    result?: any;
    error?: string;
    attempts?: number;
    completedAt?: Date;
  }): Promise<void> {
    await db.update(scrapeJobs)
      .set(updates)
      .where(eq(scrapeJobs.id, jobId));
  }

  /**
   * Setup page with stealth measures
   */
  private async setupPage(page: Page, customHeaders?: Record<string, string>): Promise<void> {
    // Set random user agent
    await page.setUserAgent(this.getRandomUserAgent());

    // Set viewport
    await page.setViewport({ width: 1920, height: 1080 });

    // Override webdriver detection
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'webdriver', {
        get: () => false,
      });
    });

    // Override plugins to appear more human
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'plugins', {
        get: () => [1, 2, 3, 4, 5],
      });
    });

    // Override languages
    await page.evaluateOnNewDocument(() => {
      Object.defineProperty(navigator, 'languages', {
        get: () => ['en-US', 'en', 'fa-IR', 'fa'],
      });
    });

    // Set custom headers if provided
    if (customHeaders) {
      await page.setExtraHTTPHeaders(customHeaders);
    }
  }

  /**
   * Generic scrape method with retry logic
   */
  async scrape(config: ScrapeConfig): Promise<ScrapeResult> {
    const jobId = await this.createScrapeJob(config);
    const maxRetries = config.maxRetries || 3;
    let lastError: string = '';

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔍 Scraping attempt ${attempt}/${maxRetries} for ${config.url}`);
        
        // Apply rate limiting
        await this.applyRateLimit(config.rateLimit);

        // Get browser and create new page
        const browser = await this.getBrowser();
        const page = await browser.newPage();

        // Setup page with stealth measures
        await this.setupPage(page, config.customHeaders);

        // Navigate to URL with timeout
        await page.goto(config.url, {
          waitUntil: 'networkidle2',
          timeout: config.timeout || 30000
        });

        // Wait for content to load
        await page.waitForTimeout(2000);

        // Get page content
        const html = await page.content();
        const title = await page.title();

        // Close page
        await page.close();

        // Update job status
        await this.updateScrapeJob(jobId, {
          status: 'completed',
          result: { html, title, url: config.url },
          completedAt: new Date(),
          attempts: attempt
        });

        console.log(`✅ Scraping successful for ${config.url}`);
        
        return {
          success: true,
          data: { html, title, url: config.url },
          scrapedAt: new Date()
        };

      } catch (error: any) {
        lastError = error.message || 'Unknown error';
        console.error(`❌ Scraping attempt ${attempt} failed:`, lastError);
        
        await this.updateScrapeJob(jobId, {
          status: attempt < maxRetries ? 'retrying' : 'failed',
          error: lastError,
          attempts: attempt
        });

        // Wait before retrying (exponential backoff)
        if (attempt < maxRetries) {
          const waitTime = Math.pow(2, attempt) * 1000;
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    // All retries failed
    await this.updateScrapeJob(jobId, {
      status: 'failed',
      completedAt: new Date()
    });

    return {
      success: false,
      error: lastError,
      scrapedAt: new Date()
    };
  }

  /**
   * Extract competitor pricing data from HTML
   */
  async extractCompetitorPricing(html: string, config: any): Promise<any[]> {
    // This will be implemented with specific selectors per competitor
    // For now, return empty array
    return [];
  }

  /**
   * Extract lead information from HTML
   */
  async extractLeads(html: string, source: string): Promise<any[]> {
    // This will be implemented with specific selectors per source
    // For now, return empty array
    return [];
  }

  /**
   * Extract market trends from HTML
   */
  async extractMarketTrends(html: string): Promise<any[]> {
    // This will be implemented with AI analysis
    // For now, return empty array
    return [];
  }

  /**
   * Close browser and cleanup
   */
  async cleanup(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }
}

// Singleton instance
let scraperInstance: ScraperService | null = null;

export function getScraperService(): ScraperService {
  if (!scraperInstance) {
    scraperInstance = new ScraperService();
  }
  return scraperInstance;
}
