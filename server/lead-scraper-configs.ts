/**
 * Lead scraper configurations for social media and business directories
 */

export interface LeadScraperConfig {
  name: string;
  platform: 'instagram' | 'telegram' | 'linkedin' | 'directory' | 'website';
  baseUrl: string;
  searchUrl?: string;
  selectors: {
    profileCard?: string;
    name?: string;
    username?: string;
    bio?: string;
    email?: string;
    phone?: string;
    website?: string;
    location?: string;
    followers?: string;
    posts?: string;
    category?: string;
    contactButton?: string;
  };
  requiresLogin?: boolean;
  customLogic?: (page: any, query: string) => Promise<any[]>;
}

/**
 * Instagram lead scraper config (public profiles only)
 */
export const INSTAGRAM_CONFIG: LeadScraperConfig = {
  name: 'Instagram',
  platform: 'instagram',
  baseUrl: 'https://www.instagram.com',
  searchUrl: 'https://www.instagram.com/explore/tags/{query}/',
  selectors: {
    profileCard: 'article',
    name: 'h2',
    username: 'a[href*="/"]',
    bio: 'div.-vDIg span',
    followers: 'a[href*="/followers/"] span'
  },
  customLogic: async (page, query) => {
    // Instagram specific scraping logic
    // Note: Instagram heavily restricts scraping, this is a simplified example
    const leads: any[] = [];
    
    try {
      // Wait for posts to load
      await page.waitForSelector('article', { timeout: 10000 });
      
      // Extract post data
      const posts = await page.$$eval('article a', (elements: Element[]) => {
        return elements.slice(0, 20).map((el: Element) => ({
          url: (el as HTMLAnchorElement).href,
          username: (el as HTMLAnchorElement).href.split('/').filter(Boolean)[3]
        }));
      });
      
      // Visit each profile to extract details (limit to prevent rate limiting)
      for (const post of posts.slice(0, 5)) {
        if (post.url && post.url.includes('/p/')) {
          leads.push({
            username: post.username,
            profileUrl: `https://www.instagram.com/${post.username}/`,
            source: 'instagram',
            interests: [query]
          });
        }
      }
    } catch (error) {
      console.error('Instagram scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Telegram channel/group scraper config
 */
export const TELEGRAM_CONFIG: LeadScraperConfig = {
  name: 'Telegram',
  platform: 'telegram',
  baseUrl: 'https://t.me',
  searchUrl: 'https://t.me/s/{query}',
  selectors: {
    name: '.tgme_channel_info_header_title',
    bio: '.tgme_channel_info_description',
    followers: '.tgme_channel_info_counter'
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      // Extract channel info
      const channelInfo = await page.evaluate(() => {
        const name = document.querySelector('.tgme_channel_info_header_title')?.textContent?.trim();
        const bio = document.querySelector('.tgme_channel_info_description')?.textContent?.trim();
        const followers = document.querySelector('.tgme_channel_info_counter')?.textContent?.trim();
        
        return { name, bio, followers };
      });
      
      if (channelInfo.name) {
        leads.push({
          name: channelInfo.name,
          bio: channelInfo.bio,
          followers: channelInfo.followers,
          profileUrl: `https://t.me/${query}`,
          source: 'telegram',
          interests: [query]
        });
      }
    } catch (error) {
      console.error('Telegram scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Iranian business directory scraper config
 */
export const IRANIAN_DIRECTORY_CONFIG: LeadScraperConfig = {
  name: 'Iranian Business Directory',
  platform: 'directory',
  baseUrl: 'https://example-iran-directory.ir',
  searchUrl: 'https://example-iran-directory.ir/search?q={query}',
  selectors: {
    profileCard: '.business-card',
    name: '.business-name',
    phone: '.business-phone',
    email: '.business-email',
    website: '.business-website',
    location: '.business-address',
    category: '.business-category'
  }
};

/**
 * Language institute directory scraper
 */
export const LANGUAGE_INSTITUTE_DIRECTORY: LeadScraperConfig = {
  name: 'Language Institute Directory',
  platform: 'directory',
  baseUrl: 'https://example-language-directory.ir',
  searchUrl: 'https://example-language-directory.ir/institutes?city={query}',
  selectors: {
    profileCard: 'div.institute-item',
    name: 'h3.institute-name',
    phone: 'span.phone',
    email: 'a.email',
    website: 'a.website',
    location: 'p.address'
  }
};

/**
 * Extract email from text using regex
 */
export function extractEmail(text: string): string | null {
  if (!text) return null;
  
  const emailRegex = /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/;
  const match = text.match(emailRegex);
  return match ? match[0] : null;
}

/**
 * Extract phone number from text (supports Iranian phone formats)
 */
export function extractPhone(text: string): string | null {
  if (!text) return null;
  
  // Convert Persian digits to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let normalized = text;
  persianDigits.forEach((digit, index) => {
    normalized = normalized.replace(new RegExp(digit, 'g'), index.toString());
  });
  
  // Iranian phone patterns: +98, 0098, 09, etc.
  const phonePatterns = [
    /(\+98|0098|0)?9\d{9}/,  // Mobile: +989123456789, 09123456789
    /(\+98|0098|0)?\d{10}/,  // Landline: 02112345678
    /\d{3}-\d{7,8}/,         // Formatted: 021-1234567
    /\d{11}/                 // Simple 11 digits
  ];
  
  for (const pattern of phonePatterns) {
    const match = normalized.match(pattern);
    if (match) return match[0];
  }
  
  return null;
}

/**
 * Calculate qualification score based on lead data
 */
export function calculateQualificationScore(lead: any): number {
  let score = 0;
  
  // Has contact info
  if (lead.email) score += 30;
  if (lead.phone) score += 30;
  
  // Has social presence
  if (lead.website) score += 10;
  if (lead.socialProfiles) score += 10;
  
  // Has relevant info
  if (lead.company) score += 10;
  if (lead.position) score += 10;
  
  // Location match (Iranian cities)
  if (lead.location && /تهران|اصفهان|مشهد|شیراز|کرج/.test(lead.location)) {
    score += 10;
  }
  
  return Math.min(score, 100);
}

/**
 * All lead scraper configurations
 */
export const LEAD_SCRAPER_CONFIGS: Record<string, LeadScraperConfig> = {
  instagram: INSTAGRAM_CONFIG,
  telegram: TELEGRAM_CONFIG,
  iranian_directory: IRANIAN_DIRECTORY_CONFIG,
  language_directory: LANGUAGE_INSTITUTE_DIRECTORY
};

/**
 * Lead search queries for different targets
 */
export const LEAD_SEARCH_QUERIES = {
  language_learners: 'زبان_انگلیسی',
  ielts_candidates: 'IELTS',
  university_students: 'دانشجو',
  professionals: 'کسب_و_کار',
  language_institutes: 'موسسه_زبان'
};
