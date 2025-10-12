/**
 * Competitor pricing scraper configurations
 * Each config defines how to extract pricing data from specific competitor websites
 */

export interface CompetitorConfig {
  name: string;
  website: string;
  searchUrl: string; // URL template with {query} placeholder
  selectors: {
    courseCard?: string;
    courseName?: string;
    coursePrice?: string;
    currency?: string;
    originalPrice?: string;
    description?: string;
    duration?: string;
    level?: string;
    instructor?: string;
  };
  priceExtractor?: (element: Element) => number | null;
  customLogic?: (page: any) => Promise<any[]>;
}

/**
 * Example competitor configurations
 * These can be customized for actual Iranian language institutes
 */
export const COMPETITOR_CONFIGS: Record<string, CompetitorConfig> = {
  // Example: Generic language institute
  generic_institute_1: {
    name: 'موسسه زبان آنلاین',
    website: 'https://example-language-institute.ir',
    searchUrl: 'https://example-language-institute.ir/courses?q={query}',
    selectors: {
      courseCard: '.course-item',
      courseName: '.course-title',
      coursePrice: '.price-amount',
      currency: '.price-currency',
      originalPrice: '.original-price',
      description: '.course-description',
      duration: '.course-duration',
      level: '.course-level',
      instructor: '.instructor-name'
    }
  },
  
  // Example: Another competitor
  generic_institute_2: {
    name: 'آموزشگاه زبان تهران',
    website: 'https://example-tehran-lang.ir',
    searchUrl: 'https://example-tehran-lang.ir/search?keyword={query}',
    selectors: {
      courseCard: 'div.course-box',
      courseName: 'h3.title',
      coursePrice: 'span.price-value',
      description: 'p.description'
    }
  }
};

/**
 * Search query templates for different course types
 */
export const SEARCH_QUERIES = {
  english_general: 'آموزش زبان انگلیسی',
  english_ielts: 'دوره IELTS',
  english_toefl: 'دوره TOEFL',
  english_business: 'انگلیسی تجاری',
  english_conversation: 'مکالمه انگلیسی',
  german: 'آموزش زبان آلمانی',
  french: 'آموزش زبان فرانسه',
  spanish: 'آموزش زبان اسپانیایی',
  turkish: 'آموزش زبان ترکی',
  arabic: 'آموزش زبان عربی'
};

/**
 * Extract numeric price from text (handles Persian/English digits and currency symbols)
 */
export function extractPrice(text: string): number | null {
  if (!text) return null;
  
  // Convert Persian digits to English
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
  let normalized = text;
  persianDigits.forEach((digit, index) => {
    normalized = normalized.replace(new RegExp(digit, 'g'), index.toString());
  });
  
  // Remove currency symbols and non-numeric characters except digits and decimal point
  normalized = normalized.replace(/[^0-9.]/g, '');
  
  // Parse to number
  const price = parseFloat(normalized);
  return isNaN(price) ? null : price;
}

/**
 * Extract course level from text
 */
export function extractLevel(text: string): string | null {
  if (!text) return null;
  
  const lowerText = text.toLowerCase();
  
  if (lowerText.includes('beginner') || lowerText.includes('مبتدی') || lowerText.includes('a1')) {
    return 'Beginner';
  } else if (lowerText.includes('elementary') || lowerText.includes('پایه') || lowerText.includes('a2')) {
    return 'Elementary';
  } else if (lowerText.includes('intermediate') || lowerText.includes('متوسط') || lowerText.includes('b1')) {
    return 'Intermediate';
  } else if (lowerText.includes('upper') || lowerText.includes('پیشرفته') || lowerText.includes('b2')) {
    return 'Upper Intermediate';
  } else if (lowerText.includes('advanced') || lowerText.includes('پیشرفته') || lowerText.includes('c1')) {
    return 'Advanced';
  } else if (lowerText.includes('proficiency') || lowerText.includes('c2')) {
    return 'Proficiency';
  }
  
  return text;
}

/**
 * Normalize course names for better comparison
 */
export function normalizeCourseNames(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s۰-۹آ-ی]/g, '');
}
