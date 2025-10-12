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
   * Scrape competitor pricing for a specific course query
   */
  async scrapeCompetitorPricing(
    competitorKey: string,
    searchQuery: string,
    jobId?: number
  ): Promise<ScrapeResult> {
    const { COMPETITOR_CONFIGS } = await import('./competitor-configs');
    const config = COMPETITOR_CONFIGS[competitorKey];
    
    if (!config) {
      return {
        success: false,
        error: `Competitor config not found: ${competitorKey}`,
        scrapedAt: new Date()
      };
    }

    try {
      // Build search URL
      const url = config.searchUrl.replace('{query}', encodeURIComponent(searchQuery));
      
      console.log(`🔍 Scraping competitor pricing: ${config.name} - ${searchQuery}`);
      
      // Apply rate limiting
      await this.applyRateLimit();

      // Get browser and create new page
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Setup page with stealth measures
      await this.setupPage(page);

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content to load
      await page.waitForTimeout(3000);

      // Use custom logic if provided, otherwise use selectors
      let courses: any[] = [];
      
      if (config.customLogic) {
        courses = await config.customLogic(page);
      } else {
        courses = await this.extractCompetitorPricing(page, config);
      }

      // Close page
      await page.close();

      // Store results in database
      const savedPrices = [];
      for (const course of courses) {
        const [saved] = await db.insert(competitorPrices).values({
          scrapeJobId: jobId,
          competitorName: config.name,
          competitorUrl: config.website,
          productName: course.name,
          productUrl: course.url || url,
          currency: course.currency || 'IRR',
          currentPrice: course.price,
          originalPrice: course.originalPrice,
          discountPercent: course.originalPrice && course.price 
            ? Math.round(((course.originalPrice - course.price) / course.originalPrice) * 100) 
            : null,
          description: course.description,
          category: searchQuery,
          availability: course.availability || 'available',
          metadata: {
            duration: course.duration,
            level: course.level,
            instructor: course.instructor
          }
        }).returning();
        
        savedPrices.push(saved);
      }

      console.log(`✅ Scraped ${savedPrices.length} courses from ${config.name}`);

      return {
        success: true,
        data: { courses: savedPrices, count: savedPrices.length },
        scrapedAt: new Date()
      };

    } catch (error: any) {
      console.error(`❌ Failed to scrape ${config.name}:`, error.message);
      return {
        success: false,
        error: error.message,
        scrapedAt: new Date()
      };
    }
  }

  /**
   * Extract competitor pricing data from page using selectors
   */
  async extractCompetitorPricing(page: Page, config: any): Promise<any[]> {
    const { extractPrice, extractLevel, normalizeCourseNames } = await import('./competitor-configs');
    
    const courses = await page.evaluate((cfg) => {
      const results: any[] = [];
      const cards = document.querySelectorAll(cfg.selectors.courseCard);
      
      cards.forEach((card: Element) => {
        const nameElement = cfg.selectors.courseName 
          ? card.querySelector(cfg.selectors.courseName) 
          : card;
        const priceElement = cfg.selectors.coursePrice 
          ? card.querySelector(cfg.selectors.coursePrice) 
          : null;
        const descElement = cfg.selectors.description 
          ? card.querySelector(cfg.selectors.description) 
          : null;
        const durationElement = cfg.selectors.duration 
          ? card.querySelector(cfg.selectors.duration) 
          : null;
        const levelElement = cfg.selectors.level 
          ? card.querySelector(cfg.selectors.level) 
          : null;
        const instructorElement = cfg.selectors.instructor 
          ? card.querySelector(cfg.selectors.instructor) 
          : null;
        const originalPriceElement = cfg.selectors.originalPrice 
          ? card.querySelector(cfg.selectors.originalPrice) 
          : null;
        
        if (nameElement && priceElement) {
          results.push({
            name: nameElement.textContent?.trim() || '',
            priceText: priceElement.textContent?.trim() || '',
            originalPriceText: originalPriceElement?.textContent?.trim() || '',
            description: descElement?.textContent?.trim() || '',
            duration: durationElement?.textContent?.trim() || '',
            level: levelElement?.textContent?.trim() || '',
            instructor: instructorElement?.textContent?.trim() || '',
            url: (card as HTMLElement).querySelector('a')?.href || ''
          });
        }
      });
      
      return results;
    }, config);

    // Process extracted data
    return courses.map(course => ({
      name: course.name,
      price: extractPrice(course.priceText),
      originalPrice: extractPrice(course.originalPriceText),
      description: course.description,
      duration: course.duration,
      level: extractLevel(course.level),
      instructor: course.instructor,
      url: course.url,
      currency: 'IRR',
      availability: 'available'
    })).filter(course => course.price !== null);
  }

  /**
   * Scrape leads from social media or business directories
   */
  async scrapeLeads(
    platformKey: string,
    searchQuery: string,
    jobId?: number
  ): Promise<ScrapeResult> {
    const { LEAD_SCRAPER_CONFIGS } = await import('./lead-scraper-configs');
    const config = LEAD_SCRAPER_CONFIGS[platformKey];
    
    if (!config) {
      return {
        success: false,
        error: `Lead scraper config not found: ${platformKey}`,
        scrapedAt: new Date()
      };
    }

    try {
      console.log(`🔍 Scraping leads from: ${config.name} - ${searchQuery}`);
      
      // Apply rate limiting
      await this.applyRateLimit();

      // Get browser and create new page
      const browser = await this.getBrowser();
      const page = await browser.newPage();

      // Setup page with stealth measures
      await this.setupPage(page);

      // Build URL
      const url = config.searchUrl 
        ? config.searchUrl.replace('{query}', encodeURIComponent(searchQuery))
        : `${config.baseUrl}/${searchQuery}`;

      // Navigate to URL
      await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout: 30000
      });

      // Wait for content
      await page.waitForTimeout(3000);

      // Use custom logic if provided, otherwise use selectors
      let leads: any[] = [];
      
      if (config.customLogic) {
        leads = await config.customLogic(page, searchQuery);
      } else {
        leads = await this.extractLeads(page, config, searchQuery);
      }

      // Close page
      await page.close();

      // Store results in database
      const savedLeads = [];
      for (const lead of leads) {
        const [saved] = await db.insert(scrapedLeads).values({
          scrapeJobId: jobId,
          source: config.platform,
          sourceUrl: lead.profileUrl || url,
          name: lead.name || lead.username,
          email: lead.email,
          phone: lead.phone,
          company: lead.company,
          position: lead.position,
          location: lead.location,
          industry: lead.category || lead.industry,
          interests: lead.interests || [searchQuery],
          socialProfiles: lead.socialProfiles || { [config.platform]: lead.profileUrl },
          qualificationScore: this.calculateLeadQualificationScore(lead),
          status: 'new',
          rawData: lead
        }).returning();
        
        savedLeads.push(saved);
      }

      console.log(`✅ Scraped ${savedLeads.length} leads from ${config.name}`);

      return {
        success: true,
        data: { leads: savedLeads, count: savedLeads.length },
        scrapedAt: new Date()
      };

    } catch (error: any) {
      console.error(`❌ Failed to scrape leads from ${config.name}:`, error.message);
      return {
        success: false,
        error: error.message,
        scrapedAt: new Date()
      };
    }
  }

  /**
   * Extract lead information from page using selectors
   */
  async extractLeads(page: Page, config: any, query: string): Promise<any[]> {
    const { extractEmail, extractPhone } = await import('./lead-scraper-configs');
    
    const leads = await page.evaluate((cfg) => {
      const results: any[] = [];
      const cards = document.querySelectorAll(cfg.selectors.profileCard || 'div');
      
      cards.forEach((card: Element) => {
        const nameElement = cfg.selectors.name ? card.querySelector(cfg.selectors.name) : null;
        const phoneElement = cfg.selectors.phone ? card.querySelector(cfg.selectors.phone) : null;
        const emailElement = cfg.selectors.email ? card.querySelector(cfg.selectors.email) : null;
        const websiteElement = cfg.selectors.website ? card.querySelector(cfg.selectors.website) : null;
        const locationElement = cfg.selectors.location ? card.querySelector(cfg.selectors.location) : null;
        const categoryElement = cfg.selectors.category ? card.querySelector(cfg.selectors.category) : null;
        
        const cardText = card.textContent || '';
        
        results.push({
          name: nameElement?.textContent?.trim() || '',
          phoneText: phoneElement?.textContent?.trim() || cardText,
          emailText: emailElement?.textContent?.trim() || cardText,
          website: (websiteElement as HTMLAnchorElement)?.href || '',
          location: locationElement?.textContent?.trim() || '',
          category: categoryElement?.textContent?.trim() || '',
          profileUrl: (card.querySelector('a') as HTMLAnchorElement)?.href || ''
        });
      });
      
      return results.slice(0, 50); // Limit to 50 leads per scrape
    }, config);

    // Process extracted data
    return leads
      .map(lead => ({
        name: lead.name,
        phone: extractPhone(lead.phoneText),
        email: extractEmail(lead.emailText),
        website: lead.website,
        location: lead.location,
        category: lead.category,
        profileUrl: lead.profileUrl,
        interests: [query]
      }))
      .filter(lead => lead.name || lead.phone || lead.email);
  }

  /**
   * Calculate lead qualification score
   */
  private calculateLeadQualificationScore(lead: any): number {
    const { calculateQualificationScore } = require('./lead-scraper-configs');
    return calculateQualificationScore(lead);
  }

  /**
   * Scrape and analyze market trends using Ollama AI
   */
  async scrapeMarketTrends(
    category: string,
    sources: string[],
    jobId?: number
  ): Promise<ScrapeResult> {
    try {
      console.log(`🔍 Scraping market trends for category: ${category}`);
      
      const allTrends: any[] = [];
      
      // Scrape each source
      for (const sourceUrl of sources) {
        try {
          // Apply rate limiting
          await this.applyRateLimit();

          // Get browser and create new page
          const browser = await this.getBrowser();
          const page = await browser.newPage();

          // Setup page with stealth measures
          await this.setupPage(page);

          // Navigate to URL
          await page.goto(sourceUrl, {
            waitUntil: 'networkidle2',
            timeout: 30000
          });

          // Wait for content
          await page.waitForTimeout(3000);

          // Extract main content
          const content = await page.evaluate(() => {
            // Remove scripts, styles, and navigation
            const elementsToRemove = document.querySelectorAll('script, style, nav, header, footer, aside');
            elementsToRemove.forEach(el => el.remove());
            
            // Get main content
            const main = document.querySelector('main, article, .content, .main-content');
            const text = main ? main.textContent : document.body.textContent;
            
            // Get title
            const title = document.title;
            
            // Get headings for structure
            const headings = Array.from(document.querySelectorAll('h1, h2, h3')).map(h => h.textContent?.trim()).filter(Boolean);
            
            return {
              title,
              text: text?.trim().replace(/\s+/g, ' ').slice(0, 5000), // Limit to 5000 chars
              headings: headings.slice(0, 10)
            };
          });

          // Close page
          await page.close();

          // Analyze content with Ollama AI
          const trends = await this.extractMarketTrends(content, sourceUrl, category);
          allTrends.push(...trends);

        } catch (error: any) {
          console.error(`❌ Failed to scrape ${sourceUrl}:`, error.message);
        }
      }

      // Store results in database
      const savedTrends = [];
      for (const trend of allTrends) {
        const [saved] = await db.insert(marketTrends).values({
          scrapeJobId: jobId,
          category: category,
          trendName: trend.name,
          description: trend.description,
          source: trend.source,
          sourceUrl: trend.sourceUrl,
          keywords: trend.keywords,
          sentiment: trend.sentiment,
          impactScore: trend.impactScore,
          confidence: trend.confidence,
          aiInsights: trend.aiInsights,
          recommendations: trend.recommendations,
          relatedTopics: trend.relatedTopics,
          rawData: trend.rawData
        }).returning();
        
        savedTrends.push(saved);
      }

      console.log(`✅ Analyzed ${savedTrends.length} market trends`);

      return {
        success: true,
        data: { trends: savedTrends, count: savedTrends.length },
        scrapedAt: new Date()
      };

    } catch (error: any) {
      console.error(`❌ Failed to analyze market trends:`, error.message);
      return {
        success: false,
        error: error.message,
        scrapedAt: new Date()
      };
    }
  }

  /**
   * Extract market trends from content using AI analysis
   */
  async extractMarketTrends(content: any, sourceUrl: string, category: string): Promise<any[]> {
    const { OllamaService } = await import('./ollama-service');
    const ollama = new OllamaService();

    try {
      // Check if Ollama is available
      const isAvailable = await ollama.isServiceAvailable();
      
      if (!isAvailable) {
        // Fallback: Extract basic trends without AI
        return this.extractBasicTrends(content, sourceUrl, category);
      }

      // Create analysis prompt
      const prompt = `Analyze the following content about ${category} and extract market trends.

Title: ${content.title}
Headings: ${content.headings.join(', ')}
Content: ${content.text}

Extract and provide:
1. Main trends (3-5 key trends)
2. Keywords for each trend
3. Sentiment (positive/neutral/negative)
4. Impact score (0-100)
5. AI insights and recommendations
6. Related topics

Respond in JSON format with array of trends.`;

      const response = await ollama.chat(prompt, {
        temperature: 0.3,
        max_tokens: 2000
      });

      // Parse AI response
      try {
        const trendsData = JSON.parse(response.response);
        return this.formatTrends(trendsData, sourceUrl, category);
      } catch (parseError) {
        // If JSON parsing fails, extract basic trends
        return this.extractBasicTrends(content, sourceUrl, category);
      }

    } catch (error: any) {
      console.error('AI trend analysis error:', error.message);
      return this.extractBasicTrends(content, sourceUrl, category);
    }
  }

  /**
   * Extract basic trends without AI (fallback)
   */
  private extractBasicTrends(content: any, sourceUrl: string, category: string): any[] {
    const trends: any[] = [];
    
    // Extract trends from headings
    content.headings.forEach((heading: string, index: number) => {
      if (heading.length > 10) {
        trends.push({
          name: heading,
          description: `Trend extracted from: ${heading}`,
          source: content.title || 'Web Content',
          sourceUrl,
          keywords: this.extractKeywords(heading),
          sentiment: 'neutral',
          impactScore: 50,
          confidence: '0.60',
          aiInsights: 'Extracted without AI analysis',
          recommendations: ['Monitor this trend', 'Gather more data'],
          relatedTopics: content.headings.filter((h: string) => h !== heading).slice(0, 3),
          rawData: { heading, index }
        });
      }
    });

    return trends.slice(0, 5); // Limit to 5 trends
  }

  /**
   * Format AI trends response
   */
  private formatTrends(trendsData: any, sourceUrl: string, category: string): any[] {
    if (!Array.isArray(trendsData)) {
      trendsData = [trendsData];
    }

    return trendsData.map((trend: any) => ({
      name: trend.name || trend.title || 'Unnamed Trend',
      description: trend.description || trend.summary || '',
      source: trend.source || 'AI Analysis',
      sourceUrl,
      keywords: Array.isArray(trend.keywords) ? trend.keywords : this.extractKeywords(trend.name || ''),
      sentiment: trend.sentiment || 'neutral',
      impactScore: trend.impactScore || trend.impact || 50,
      confidence: trend.confidence ? trend.confidence.toString() : '0.70',
      aiInsights: trend.insights || trend.analysis || '',
      recommendations: Array.isArray(trend.recommendations) ? trend.recommendations : [],
      relatedTopics: Array.isArray(trend.relatedTopics) ? trend.relatedTopics : [],
      rawData: trend
    }));
  }

  /**
   * Extract keywords from text
   */
  private extractKeywords(text: string): string[] {
    // Simple keyword extraction (can be improved with NLP)
    const words = text.toLowerCase()
      .replace(/[^\w\s۰-۹آ-ی]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 3);
    
    // Get unique words, limit to 10
    return [...new Set(words)].slice(0, 10);
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
