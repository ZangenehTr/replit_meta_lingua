/**
 * Lead Scraper Configurations
 * 
 * These are TEMPLATE configurations for social media lead scraping.
 * They require customization based on your deployment environment and
 * should be tested before production use.
 * 
 * IMPORTANT NOTES:
 * 1. Social media platforms actively block automated scraping
 * 2. Consider using official APIs where available (see API alternatives below)
 * 3. Always respect rate limits and terms of service
 * 4. These templates may need updates as platforms change their structure
 * 
 * API-BASED ALTERNATIVES (Recommended for Production):
 * - Instagram: Instagram Graph API (requires Facebook Developer account)
 * - LinkedIn: LinkedIn Marketing API (requires partnership)
 * - Twitter/X: Twitter API v2 (paid tiers available)
 * - YouTube: YouTube Data API (free quota available)
 * - Telegram: Bot API for channel info
 * 
 * ENVIRONMENT VARIABLES:
 * - IRANIAN_DIRECTORY_URL: Custom Iranian business directory URL
 * - LANGUAGE_DIRECTORY_URL: Custom language institute directory URL
 */

export interface LeadScraperConfig {
  name: string;
  platform: 'instagram' | 'telegram' | 'linkedin' | 'directory' | 'website' | 'whatsapp' | 'pinterest' | 'twitter' | 'youtube';
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
    position?: string;
    description?: string;
  };
  requiresLogin?: boolean;
  apiAlternative?: {
    name: string;
    documentation: string;
    recommended: boolean;
  };
  customLogic?: (page: any, query: string) => Promise<any[]>;
}

/**
 * Instagram Configuration (Template)
 * 
 * NOTE: Instagram heavily restricts scraping. For production use,
 * consider the Instagram Graph API instead.
 */
export const INSTAGRAM_CONFIG: LeadScraperConfig = {
  name: 'Instagram',
  platform: 'instagram',
  baseUrl: 'https://www.instagram.com',
  searchUrl: 'https://www.instagram.com/explore/tags/{query}/',
  selectors: {
    profileCard: 'article',
    name: 'h2',
    username: 'header a',
    bio: 'div.-vDIg span',
    followers: 'span.g47SY'
  },
  apiAlternative: {
    name: 'Instagram Graph API',
    documentation: 'https://developers.facebook.com/docs/instagram-api',
    recommended: true
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    const seenUsernames = new Set<string>();
    
    try {
      await page.waitForSelector('article', { timeout: 10000 });
      
      const postUrls = await page.$$eval('article a[href*="/p/"]', (elements: Element[]) => {
        return elements.slice(0, 10).map((el: Element) => (el as HTMLAnchorElement).href);
      });
      
      for (const postUrl of postUrls.slice(0, 5)) {
        try {
          const newPage = await page.browser().newPage();
          await newPage.goto(postUrl, { waitUntil: 'domcontentloaded', timeout: 15000 });
          
          const authorData = await newPage.evaluate(() => {
            const authorLink = document.querySelector('header a[href^="/"][role="link"]');
            if (authorLink) {
              const href = (authorLink as HTMLAnchorElement).href;
              const username = href.split('/').filter(Boolean).pop();
              const displayName = authorLink.textContent?.trim();
              return { username, displayName };
            }
            return null;
          });
          
          await newPage.close();
          
          if (authorData?.username && !seenUsernames.has(authorData.username)) {
            seenUsernames.add(authorData.username);
            leads.push({
              username: authorData.username,
              name: authorData.displayName || authorData.username,
              profileUrl: `https://www.instagram.com/${authorData.username}/`,
              source: 'instagram',
              platform: 'instagram',
              interests: [query]
            });
          }
        } catch (error) {
          console.log(`Instagram: Failed to process ${postUrl}`);
        }
      }
    } catch (error) {
      console.error('Instagram scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Telegram Configuration
 * 
 * Uses Telegram's public web preview for channels.
 * Works well for public channels but not for private groups.
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
  apiAlternative: {
    name: 'Telegram Bot API',
    documentation: 'https://core.telegram.org/bots/api',
    recommended: false
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      await page.waitForSelector('.tgme_channel_info', { timeout: 10000 });
      
      const channelInfo = await page.evaluate(() => {
        const name = document.querySelector('.tgme_channel_info_header_title')?.textContent?.trim();
        const bio = document.querySelector('.tgme_channel_info_description')?.textContent?.trim();
        const counters = document.querySelectorAll('.tgme_channel_info_counter');
        const followers = counters[0]?.textContent?.trim();
        
        return { name, bio, followers };
      });
      
      if (channelInfo.name) {
        leads.push({
          name: channelInfo.name,
          bio: channelInfo.bio,
          followers: channelInfo.followers,
          profileUrl: `https://t.me/${query}`,
          source: 'telegram',
          platform: 'telegram',
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
 * LinkedIn Configuration (Template)
 * 
 * IMPORTANT: LinkedIn actively blocks scraping.
 * For production use, LinkedIn Sales Navigator or Marketing API is required.
 */
export const LINKEDIN_CONFIG: LeadScraperConfig = {
  name: 'LinkedIn',
  platform: 'linkedin',
  baseUrl: 'https://www.linkedin.com',
  searchUrl: 'https://www.linkedin.com/search/results/people/?keywords={query}',
  selectors: {
    profileCard: '.reusable-search__result-container',
    name: '.entity-result__title-text a span',
    position: '.entity-result__primary-subtitle',
    location: '.entity-result__secondary-subtitle'
  },
  requiresLogin: true,
  apiAlternative: {
    name: 'LinkedIn Marketing API',
    documentation: 'https://docs.microsoft.com/en-us/linkedin/marketing/',
    recommended: true
  }
};

/**
 * Twitter/X Configuration (Template)
 * 
 * NOTE: Twitter has limited scraping. Twitter API v2 is recommended.
 */
export const TWITTER_CONFIG: LeadScraperConfig = {
  name: 'Twitter/X',
  platform: 'twitter',
  baseUrl: 'https://x.com',
  searchUrl: 'https://x.com/search?q={query}&f=user',
  selectors: {
    profileCard: '[data-testid="cellInnerDiv"]',
    name: '[data-testid="UserName"]',
    username: '[data-testid="UserName"] span',
    bio: '[data-testid="UserDescription"]'
  },
  requiresLogin: true,
  apiAlternative: {
    name: 'Twitter API v2',
    documentation: 'https://developer.twitter.com/en/docs/twitter-api',
    recommended: true
  }
};

/**
 * YouTube Configuration (Template)
 * 
 * YouTube Data API is recommended for reliable access.
 */
export const YOUTUBE_CONFIG: LeadScraperConfig = {
  name: 'YouTube',
  platform: 'youtube',
  baseUrl: 'https://www.youtube.com',
  searchUrl: 'https://www.youtube.com/results?search_query={query}&sp=EgIQAg%253D%253D',
  selectors: {
    profileCard: 'ytd-channel-renderer',
    name: '#channel-title',
    username: '#subscriber-count',
    bio: '#description'
  },
  apiAlternative: {
    name: 'YouTube Data API',
    documentation: 'https://developers.google.com/youtube/v3',
    recommended: true
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      await page.waitForSelector('ytd-channel-renderer', { timeout: 10000 });
      
      const channels = await page.$$eval('ytd-channel-renderer', (elements: Element[]) => {
        return elements.slice(0, 10).map((el: Element) => ({
          name: el.querySelector('#channel-title')?.textContent?.trim(),
          subscribers: el.querySelector('#subscribers')?.textContent?.trim(),
          url: (el.querySelector('a#main-link') as HTMLAnchorElement)?.href
        }));
      });
      
      for (const channel of channels) {
        if (channel.name && channel.url) {
          leads.push({
            name: channel.name,
            followers: channel.subscribers,
            profileUrl: channel.url,
            source: 'youtube',
            platform: 'youtube',
            interests: [query]
          });
        }
      }
    } catch (error) {
      console.error('YouTube scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * WhatsApp Business Configuration (Template)
 * 
 * Uses Google search to find WhatsApp Business profiles.
 */
export const WHATSAPP_BUSINESS_CONFIG: LeadScraperConfig = {
  name: 'WhatsApp Business',
  platform: 'whatsapp',
  baseUrl: 'https://wa.me',
  searchUrl: 'https://www.google.com/search?q=site:wa.me+{query}',
  selectors: {
    name: 'h1',
    phone: 'a[href^="tel:"]',
    bio: 'p.description'
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      await page.waitForSelector('div.g', { timeout: 10000 });
      
      const results = await page.evaluate(() => {
        const items: any[] = [];
        document.querySelectorAll('div.g').forEach((el: Element) => {
          const link = el.querySelector('a') as HTMLAnchorElement;
          if (link?.href?.includes('wa.me')) {
            const phone = link.href.split('wa.me/')[1]?.split('?')[0];
            items.push({ url: link.href, phone });
          }
        });
        return items.slice(0, 10);
      });
      
      for (const result of results) {
        if (result.phone) {
          leads.push({
            phone: result.phone,
            profileUrl: result.url,
            source: 'whatsapp',
            platform: 'whatsapp_business',
            interests: [query],
            contactMethod: 'whatsapp'
          });
        }
      }
    } catch (error) {
      console.error('WhatsApp Business scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Pinterest Configuration (Template)
 */
export const PINTEREST_CONFIG: LeadScraperConfig = {
  name: 'Pinterest',
  platform: 'pinterest',
  baseUrl: 'https://www.pinterest.com',
  searchUrl: 'https://www.pinterest.com/search/pins/?q={query}',
  selectors: {
    profileCard: '[data-test-id="pin"]',
    name: '[data-test-id="pinner-name"]',
    username: '[data-test-id="pinner-username"]',
    bio: '[data-test-id="pinner-bio"]'
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    const seenUsernames = new Set<string>();
    
    try {
      await page.waitForSelector('[data-test-id="pin"]', { timeout: 10000 });
      
      const pinners = await page.$$eval('[data-test-id="pinrep"]', (elements: Element[]) => {
        return elements.slice(0, 20).map((el: Element) => ({
          name: el.querySelector('[data-test-id="pinner-name"]')?.textContent?.trim(),
          username: el.querySelector('a')?.href?.split('/').filter(Boolean).pop()
        }));
      });
      
      for (const pinner of pinners) {
        if (pinner.username && !seenUsernames.has(pinner.username)) {
          seenUsernames.add(pinner.username);
          leads.push({
            name: pinner.name || pinner.username,
            username: pinner.username,
            profileUrl: `https://www.pinterest.com/${pinner.username}/`,
            source: 'pinterest',
            platform: 'pinterest',
            interests: [query]
          });
        }
      }
    } catch (error) {
      console.error('Pinterest scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Iranian Business Directory Configuration
 * 
 * Uses Google site search to find Iranian businesses.
 * For a specific directory, set IRANIAN_DIRECTORY_URL environment variable.
 */
export const IRANIAN_DIRECTORY_CONFIG: LeadScraperConfig = {
  name: 'Iranian Business Directory',
  platform: 'directory',
  baseUrl: process.env.IRANIAN_DIRECTORY_URL || 'https://www.google.com',
  searchUrl: 'https://www.google.com/search?q=site:*.ir+{query}+تماس+آدرس',
  selectors: {
    profileCard: 'div.g',
    name: 'h3',
    website: 'cite',
    location: 'span'
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      await page.waitForSelector('div.g', { timeout: 10000 });
      
      const results = await page.evaluate(() => {
        const items: any[] = [];
        document.querySelectorAll('div.g').forEach((el: Element) => {
          const title = el.querySelector('h3')?.textContent?.trim();
          const link = el.querySelector('a') as HTMLAnchorElement;
          const snippet = el.querySelector('.VwiC3b')?.textContent?.trim() || '';
          
          const phoneMatch = snippet.match(/(\+98|۰۲۱|021|۰۹\d{9}|09\d{9})/);
          
          if (link?.href?.includes('.ir')) {
            items.push({
              title,
              url: link.href,
              snippet,
              phone: phoneMatch ? phoneMatch[0] : null
            });
          }
        });
        return items.slice(0, 15);
      });
      
      for (const result of results) {
        leads.push({
          name: result.title,
          website: result.url,
          phone: result.phone,
          bio: result.snippet,
          source: 'iranian_directory',
          platform: 'directory',
          interests: [query],
          country: 'Iran'
        });
      }
    } catch (error) {
      console.error('Iranian Directory scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * Language Institute Directory Configuration
 * 
 * Searches for language learning institutes in Iran.
 * For a specific directory, set LANGUAGE_DIRECTORY_URL environment variable.
 */
export const LANGUAGE_INSTITUTE_DIRECTORY: LeadScraperConfig = {
  name: 'Language Institute Directory',
  platform: 'directory',
  baseUrl: process.env.LANGUAGE_DIRECTORY_URL || 'https://www.google.com',
  searchUrl: 'https://www.google.com/search?q=site:*.ir+آموزشگاه+زبان+{query}',
  selectors: {
    profileCard: 'div.g',
    name: 'h3',
    website: 'cite',
    location: 'span'
  },
  customLogic: async (page, query) => {
    const leads: any[] = [];
    
    try {
      await page.waitForSelector('div.g', { timeout: 10000 });
      
      const results = await page.evaluate(() => {
        const items: any[] = [];
        document.querySelectorAll('div.g').forEach((el: Element) => {
          const title = el.querySelector('h3')?.textContent?.trim();
          const link = el.querySelector('a') as HTMLAnchorElement;
          const snippet = el.querySelector('.VwiC3b')?.textContent?.trim() || '';
          
          const phoneMatch = snippet.match(/(\+98|۰۲۱|021|۰۹\d{9}|09\d{9})/);
          
          if (link?.href?.includes('.ir')) {
            items.push({
              title,
              url: link.href,
              snippet,
              phone: phoneMatch ? phoneMatch[0] : null
            });
          }
        });
        return items.slice(0, 15);
      });
      
      for (const result of results) {
        leads.push({
          name: result.title,
          website: result.url,
          phone: result.phone,
          bio: result.snippet,
          source: 'language_institute_directory',
          platform: 'directory',
          category: 'language_education',
          interests: [query, 'language_learning'],
          country: 'Iran'
        });
      }
    } catch (error) {
      console.error('Language Institute Directory scraping error:', error);
    }
    
    return leads;
  }
};

/**
 * All available scraper configurations
 */
export const ALL_SCRAPER_CONFIGS: LeadScraperConfig[] = [
  INSTAGRAM_CONFIG,
  TELEGRAM_CONFIG,
  LINKEDIN_CONFIG,
  TWITTER_CONFIG,
  YOUTUBE_CONFIG,
  WHATSAPP_BUSINESS_CONFIG,
  PINTEREST_CONFIG,
  IRANIAN_DIRECTORY_CONFIG,
  LANGUAGE_INSTITUTE_DIRECTORY
];

/**
 * Get configuration by platform name
 */
export function getConfigByPlatform(platform: string): LeadScraperConfig | undefined {
  return ALL_SCRAPER_CONFIGS.find(config => 
    config.platform === platform || 
    config.name.toLowerCase().includes(platform.toLowerCase())
  );
}

/**
 * Get all platforms that recommend API usage
 */
export function getApiRecommendedPlatforms(): LeadScraperConfig[] {
  return ALL_SCRAPER_CONFIGS.filter(config => config.apiAlternative?.recommended);
}

/**
 * Get platforms that require login
 */
export function getLoginRequiredPlatforms(): LeadScraperConfig[] {
  return ALL_SCRAPER_CONFIGS.filter(config => config.requiresLogin);
}
