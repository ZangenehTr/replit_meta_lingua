import { Router } from 'express';
import { z } from 'zod';
import { searchService } from '../services/search-service';
import type { SearchFilters } from '@shared/schema';

const router = Router();

// Validation schemas
const searchQuerySchema = z.object({
  q: z.string().min(1).max(500),
  page: z.coerce.number().min(1).default(1),
  limit: z.coerce.number().min(1).max(100).default(20),
  sortBy: z.enum(['relevance', 'date', 'rating', 'alphabetical']).default('relevance'),
  categories: z.string().optional(),
  languages: z.string().optional(),
  levels: z.string().optional(),
  contentTypes: z.string().optional(),
  priceMin: z.coerce.number().optional(),
  priceMax: z.coerce.number().optional(),
  dateStart: z.string().optional(),
  dateEnd: z.string().optional(),
  ratings: z.string().optional(),
  instructors: z.string().optional()
});

const suggestionsQuerySchema = z.object({
  q: z.string().min(1).max(100),
  limit: z.coerce.number().min(1).max(20).default(10),
  language: z.string().default('en')
});

const historyQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(20),
  days: z.coerce.number().min(1).max(365).default(30)
});

const trendingQuerySchema = z.object({
  limit: z.coerce.number().min(1).max(50).default(10),
  timeframe: z.enum(['hour', 'day', 'week', 'month']).default('week'),
  language: z.string().default('en'),
  category: z.string().default('general')
});

const analyticsLogSchema = z.object({
  query: z.string().min(1).max(500),
  resultId: z.string().optional(),
  resultType: z.string().optional(),
  sessionId: z.string().optional(),
  action: z.enum(['click', 'view', 'bookmark']).optional()
});

// Helper function to parse comma-separated strings into arrays
function parseArray(value?: string): string[] | undefined {
  return value ? value.split(',').map(item => item.trim()).filter(Boolean) : undefined;
}

// Helper function to build search filters from query parameters
function buildFilters(query: any): SearchFilters {
  const filters: SearchFilters = {};
  
  if (query.categories) filters.categories = parseArray(query.categories);
  if (query.languages) filters.languages = parseArray(query.languages);
  if (query.levels) filters.levels = parseArray(query.levels);
  if (query.contentTypes) filters.contentTypes = parseArray(query.contentTypes);
  if (query.instructors) filters.instructors = parseArray(query.instructors);
  
  if (query.priceMin !== undefined || query.priceMax !== undefined) {
    filters.priceRange = {
      min: query.priceMin || 0,
      max: query.priceMax || Number.MAX_SAFE_INTEGER
    };
  }
  
  if (query.dateStart || query.dateEnd) {
    filters.dateRange = {
      start: query.dateStart || '1900-01-01',
      end: query.dateEnd || new Date().toISOString().split('T')[0]
    };
  }
  
  if (query.ratings) {
    filters.ratings = parseArray(query.ratings)?.map(r => parseInt(r, 10)).filter(r => !isNaN(r));
  }
  
  return filters;
}

/**
 * Main search endpoint
 * GET /api/search?q=query&page=1&limit=20&sortBy=relevance&categories=books,courses
 */
router.get('/', async (req, res) => {
  try {
    const validation = searchQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid search parameters', 
        details: validation.error.errors 
      });
    }

    const { q, page, limit, sortBy, ...filterParams } = validation.data;
    const filters = buildFilters(filterParams);
    
    // Get user info from request (if authenticated)
    const userId = (req as any).user?.id;
    const sessionId = req.sessionID || req.headers['x-session-id'] as string;

    const results = await searchService.search(q, filters, {
      page,
      limit,
      sortBy,
      userId,
      sessionId,
      includeAnalytics: true
    });

    res.json(results);
  } catch (error) {
    console.error('Search API error:', error);
    res.status(500).json({ 
      error: 'Search failed. Please try again.',
      query: req.query.q,
      timestamp: new Date().toISOString()
    });
  }
});

/**
 * Search suggestions and autocomplete
 * GET /api/search/suggestions?q=partial_query&limit=10&language=en
 */
router.get('/suggestions', async (req, res) => {
  try {
    const validation = suggestionsQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid suggestion parameters', 
        details: validation.error.errors 
      });
    }

    const { q, limit, language } = validation.data;
    const userId = (req as any).user?.id;

    const suggestions = await searchService.getSuggestions(q, {
      limit,
      language,
      userId
    });

    res.json({
      query: q,
      suggestions,
      language,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search suggestions API error:', error);
    res.status(500).json({ 
      error: 'Failed to get suggestions. Please try again.',
      query: req.query.q
    });
  }
});

/**
 * User search history
 * GET /api/search/history?limit=20&days=30
 */
router.get('/history', async (req, res) => {
  try {
    const userId = (req as any).user?.id;
    
    if (!userId) {
      return res.status(401).json({ 
        error: 'Authentication required to access search history' 
      });
    }

    const validation = historyQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid history parameters', 
        details: validation.error.errors 
      });
    }

    const { limit, days } = validation.data;

    const history = await searchService.getSearchHistory(userId, { limit, days });

    res.json({
      history,
      userId,
      limit,
      days,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search history API error:', error);
    res.status(500).json({ 
      error: 'Failed to get search history. Please try again.' 
    });
  }
});

/**
 * Trending searches
 * GET /api/search/trending?limit=10&timeframe=week&language=en&category=general
 */
router.get('/trending', async (req, res) => {
  try {
    const validation = trendingQuerySchema.safeParse(req.query);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid trending parameters', 
        details: validation.error.errors 
      });
    }

    const { limit, timeframe, language, category } = validation.data;

    const trending = await searchService.getTrendingSearches({
      limit,
      timeframe,
      language,
      category
    });

    res.json({
      trending,
      timeframe,
      language,
      category,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Trending searches API error:', error);
    res.status(500).json({ 
      error: 'Failed to get trending searches. Please try again.' 
    });
  }
});

/**
 * Log search analytics
 * POST /api/search/log
 */
router.post('/log', async (req, res) => {
  try {
    const validation = analyticsLogSchema.safeParse(req.body);
    
    if (!validation.success) {
      return res.status(400).json({ 
        error: 'Invalid analytics data', 
        details: validation.error.errors 
      });
    }

    const { query, resultId, resultType, sessionId, action } = validation.data;
    const userId = (req as any).user?.id;

    // For now, just acknowledge the log - more detailed analytics tracking
    // would be implemented in the search service
    console.log('Search analytics log:', {
      query,
      resultId,
      resultType,
      sessionId,
      action,
      userId,
      timestamp: new Date().toISOString()
    });

    res.json({ 
      success: true, 
      message: 'Analytics logged successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search analytics log error:', error);
    res.status(500).json({ 
      error: 'Failed to log search analytics. Please try again.' 
    });
  }
});

/**
 * Get search facets/filters for a specific query
 * GET /api/search/facets?q=query
 */
router.get('/facets', async (req, res) => {
  try {
    const query = req.query.q as string;
    
    if (!query || query.length < 1) {
      return res.status(400).json({ 
        error: 'Query parameter is required for facets' 
      });
    }

    // Perform a search to get facets
    const searchResults = await searchService.search(query, {}, {
      page: 1,
      limit: 100, // Get more results for better facet calculation
      includeAnalytics: false
    });

    res.json({
      query,
      facets: searchResults.facets,
      totalResults: searchResults.totalResults,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Search facets API error:', error);
    res.status(500).json({ 
      error: 'Failed to get search facets. Please try again.' 
    });
  }
});

/**
 * Health check for search service
 * GET /api/search/health
 */
router.get('/health', async (req, res) => {
  try {
    // Perform a simple search to test the service
    const testResults = await searchService.search('test', {}, {
      page: 1,
      limit: 1,
      includeAnalytics: false
    });

    res.json({
      status: 'healthy',
      searchService: 'operational',
      timestamp: new Date().toISOString(),
      testQuery: 'test',
      responseTime: testResults.responseTime
    });
  } catch (error) {
    console.error('Search health check error:', error);
    res.status(503).json({
      status: 'unhealthy',
      searchService: 'error',
      error: error instanceof Error ? error.message : 'Unknown error',
      timestamp: new Date().toISOString()
    });
  }
});

export default router;