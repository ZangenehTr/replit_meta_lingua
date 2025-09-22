import { eq, sql, desc, and, or, like, ilike, inArray, gte, lte } from "drizzle-orm";
import { db } from "../db";
import { 
  users, courses, books, homework, sessions, messages, notifications,
  callernRoadmaps, callernRoadmapSteps, glossaryItems, mstSessions,
  placementTests, learningTracks, searchHistory, searchAnalytics,
  trendingSearches, searchSuggestions, searchIndex,
  type SearchResultItem, type SearchFilters, type SearchResponse,
  type SearchHistoryInsert, type SearchAnalyticsInsert, type TrendingSearchesInsert
} from "@shared/schema";

export class SearchService {
  /**
   * Main universal search function
   */
  async search(
    query: string,
    filters: SearchFilters = {},
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'relevance' | 'date' | 'rating' | 'alphabetical';
      userId?: number;
      sessionId?: string;
      includeAnalytics?: boolean;
    } = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      page = 1,
      limit = 20,
      sortBy = 'relevance',
      userId,
      sessionId,
      includeAnalytics = true
    } = options;

    const offset = (page - 1) * limit;
    const normalizedQuery = this.normalizeQuery(query);

    try {
      // Execute searches across different content types
      const searchPromises = await Promise.allSettled([
        this.searchBooks(normalizedQuery, filters, { limit, offset }),
        this.searchCourses(normalizedQuery, filters, { limit, offset }),
        this.searchUsers(normalizedQuery, filters, { limit, offset }),
        this.searchTests(normalizedQuery, filters, { limit, offset }),
        this.searchHomework(normalizedQuery, filters, { limit, offset }),
        this.searchSessions(normalizedQuery, filters, { limit, offset }),
        this.searchRoadmaps(normalizedQuery, filters, { limit, offset }),
        this.searchDictionary(normalizedQuery, filters, { limit, offset }),
      ]);

      // Combine and process results
      const allResults: SearchResultItem[] = [];
      let totalCount = 0;

      searchPromises.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allResults.push(...result.value.results);
          totalCount += result.value.total;
        } else {
          console.error(`Search failed for type ${index}:`, result.reason);
        }
      });

      // Sort results by relevance score
      const sortedResults = this.sortResults(allResults, sortBy);
      const paginatedResults = sortedResults.slice(0, limit);

      // Calculate facets for filtering
      const facets = this.calculateFacets(allResults);

      // Get suggestions if query has no results or few results
      const suggestions = allResults.length < 3 ? 
        await this.getSuggestions(query) : [];

      const responseTime = Date.now() - startTime;

      // Log search analytics
      if (includeAnalytics) {
        await this.logSearch({
          query,
          userId,
          sessionId,
          resultsCount: totalCount,
          responseTime,
          filters
        });
      }

      return {
        query,
        results: paginatedResults,
        totalResults: totalCount,
        facets,
        suggestions,
        responseTime,
        page,
        limit,
        hasMore: totalCount > page * limit
      };

    } catch (error) {
      console.error('Search service error:', error);
      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Search books in the e-commerce system
   */
  private async searchBooks(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [];

    // Text search conditions
    if (query) {
      whereConditions.push(
        or(
          ilike(books.title, `%${query}%`),
          ilike(books.author, `%${query}%`),
          ilike(books.description, `%${query}%`),
          ilike(books.isbn, `%${query}%`)
        )
      );
    }

    // Apply filters
    if (filters.categories?.length) {
      whereConditions.push(inArray(books.category, filters.categories));
    }

    if (filters.languages?.length) {
      whereConditions.push(inArray(books.language, filters.languages));
    }

    if (filters.priceRange) {
      whereConditions.push(
        and(
          gte(books.price, filters.priceRange.min),
          lte(books.price, filters.priceRange.max)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db
      .select()
      .from(books)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(books)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(book => ({
        id: `book-${book.id}`,
        type: 'book' as const,
        title: book.title,
        description: book.description || undefined,
        url: `/books/${book.id}`,
        imageUrl: book.imageUrl || undefined,
        metadata: {
          author: book.author,
          category: book.category,
          language: book.language,
          price: book.price,
          isbn: book.isbn,
          rating: book.rating ? parseFloat(book.rating.toString()) : undefined,
          tags: book.tags || []
        },
        relevanceScore: this.calculateRelevanceScore(query, book.title, book.description),
        highlights: this.generateHighlights(query, book.title, book.description)
      })),
      total
    };
  }

  /**
   * Search courses and classes
   */
  private async searchCourses(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [];

    // Text search conditions
    if (query) {
      whereConditions.push(
        or(
          ilike(courses.title, `%${query}%`),
          ilike(courses.description, `%${query}%`),
          ilike(courses.category, `%${query}%`)
        )
      );
    }

    // Apply filters
    if (filters.languages?.length) {
      whereConditions.push(inArray(courses.language, filters.languages));
    }

    if (filters.levels?.length) {
      whereConditions.push(inArray(courses.level, filters.levels));
    }

    if (filters.categories?.length) {
      whereConditions.push(inArray(courses.category, filters.categories));
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db
      .select({
        course: courses,
        instructor: {
          firstName: users.firstName,
          lastName: users.lastName,
          profileImage: users.profileImage
        }
      })
      .from(courses)
      .leftJoin(users, eq(courses.instructorId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(courses)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(({ course, instructor }) => ({
        id: `course-${course.id}`,
        type: 'course' as const,
        title: course.title,
        description: course.description || undefined,
        url: `/courses/${course.id}`,
        imageUrl: course.thumbnail || undefined,
        metadata: {
          instructor: instructor ? `${instructor.firstName} ${instructor.lastName}` : undefined,
          language: course.language,
          level: course.level,
          category: course.category,
          price: course.price,
          rating: course.rating ? parseFloat(course.rating.toString()) : undefined,
          tags: course.tags || [],
          deliveryMode: course.deliveryMode,
          totalSessions: course.totalSessions
        },
        relevanceScore: this.calculateRelevanceScore(query, course.title, course.description),
        highlights: this.generateHighlights(query, course.title, course.description)
      })),
      total
    };
  }

  /**
   * Search users (students, teachers, mentors)
   */
  private async searchUsers(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [eq(users.isActive, true)];

    // Text search conditions
    if (query) {
      whereConditions.push(
        or(
          ilike(users.firstName, `%${query}%`),
          ilike(users.lastName, `%${query}%`),
          ilike(users.email, `%${query}%`)
        )
      );
    }

    // Filter by roles if specified
    if (filters.contentTypes?.length) {
      const roleMap: Record<string, string> = {
        'teachers': 'Teacher',
        'students': 'Student', 
        'mentors': 'Mentor',
        'tutors': 'Tutor'
      };
      
      const roles = filters.contentTypes
        .map(type => roleMap[type])
        .filter(Boolean);
        
      if (roles.length > 0) {
        whereConditions.push(inArray(users.role, roles));
      }
    }

    const whereClause = and(...whereConditions);

    const results = await db
      .select()
      .from(users)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(user => ({
        id: `user-${user.id}`,
        type: 'user' as const,
        title: `${user.firstName} ${user.lastName}`,
        description: user.notes || undefined,
        url: `/profile/${user.id}`,
        imageUrl: user.profileImage || user.avatar || undefined,
        metadata: {
          role: user.role,
          level: user.level,
          email: user.email,
          memberTier: user.memberTier
        },
        relevanceScore: this.calculateRelevanceScore(query, `${user.firstName} ${user.lastName}`, user.notes),
        highlights: this.generateHighlights(query, `${user.firstName} ${user.lastName}`, user.notes)
      })),
      total
    };
  }

  /**
   * Search tests and assessments
   */
  private async searchTests(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;
    const results: SearchResultItem[] = [];

    // Search MST sessions
    if (query.toLowerCase().includes('mst') || query.toLowerCase().includes('placement')) {
      const mstResults = await db
        .select({
          session: mstSessions,
          user: {
            firstName: users.firstName,
            lastName: users.lastName
          }
        })
        .from(mstSessions)
        .leftJoin(users, eq(mstSessions.userId, users.id))
        .where(ilike(mstSessions.targetLanguage, `%${query}%`))
        .limit(limit)
        .offset(offset);

      results.push(...mstResults.map(({ session, user }) => ({
        id: `mst-${session.id}`,
        type: 'test' as const,
        title: `MST ${session.targetLanguage} Test`,
        description: `Multi-Stage Test for ${session.targetLanguage}`,
        url: `/tests/mst/${session.id}`,
        metadata: {
          language: session.targetLanguage,
          status: session.status,
          student: user ? `${user.firstName} ${user.lastName}` : undefined,
          type: 'placement'
        },
        relevanceScore: this.calculateRelevanceScore(query, `MST ${session.targetLanguage}`, '')
      })));
    }

    // Search placement tests
    const placementResults = await db
      .select()
      .from(placementTests)
      .where(
        or(
          ilike(placementTests.title, `%${query}%`),
          ilike(placementTests.description, `%${query}%`)
        )
      )
      .limit(limit)
      .offset(offset);

    results.push(...placementResults.map(test => ({
      id: `placement-${test.id}`,
      type: 'test' as const,
      title: test.title,
      description: test.description || undefined,
      url: `/tests/placement/${test.id}`,
      metadata: {
        language: test.language,
        level: test.targetLevel,
        duration: test.durationMinutes,
        type: 'placement'
      },
      relevanceScore: this.calculateRelevanceScore(query, test.title, test.description)
    })));

    return {
      results: results.slice(0, limit),
      total: results.length
    };
  }

  /**
   * Search homework and assignments
   */
  private async searchHomework(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [eq(homework.isVisible, true)];

    if (query) {
      whereConditions.push(
        or(
          ilike(homework.title, `%${query}%`),
          ilike(homework.description, `%${query}%`),
          ilike(homework.instructions, `%${query}%`)
        )
      );
    }

    const whereClause = and(...whereConditions);

    const results = await db
      .select({
        homework: homework,
        teacher: {
          firstName: users.firstName,
          lastName: users.lastName
        },
        course: {
          title: courses.title
        }
      })
      .from(homework)
      .leftJoin(users, eq(homework.teacherId, users.id))
      .leftJoin(courses, eq(homework.courseId, courses.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(homework)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(({ homework: hw, teacher, course }) => ({
        id: `homework-${hw.id}`,
        type: 'homework' as const,
        title: hw.title,
        description: hw.description || undefined,
        url: `/homework/${hw.id}`,
        metadata: {
          teacher: teacher ? `${teacher.firstName} ${teacher.lastName}` : undefined,
          course: course?.title,
          difficulty: hw.difficulty,
          status: hw.status,
          dueDate: hw.dueDate?.toISOString(),
          estimatedTime: hw.estimatedTime,
          xpReward: hw.xpReward,
          tags: hw.tags || []
        },
        relevanceScore: this.calculateRelevanceScore(query, hw.title, hw.description),
        highlights: this.generateHighlights(query, hw.title, hw.description)
      })),
      total
    };
  }

  /**
   * Search sessions and lessons
   */
  private async searchSessions(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [];

    if (query) {
      whereConditions.push(
        or(
          ilike(sessions.title, `%${query}%`),
          ilike(sessions.description, `%${query}%`)
        )
      );
    }

    const whereClause = whereConditions.length > 0 ? and(...whereConditions) : undefined;

    const results = await db
      .select({
        session: sessions,
        tutor: {
          firstName: users.firstName,
          lastName: users.lastName
        },
        student: {
          firstName: users.firstName,
          lastName: users.lastName
        }
      })
      .from(sessions)
      .leftJoin(users, eq(sessions.tutorId, users.id))
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(sessions)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(({ session, tutor }) => ({
        id: `session-${session.id}`,
        type: 'session' as const,
        title: session.title,
        description: session.description || undefined,
        url: `/sessions/${session.id}`,
        metadata: {
          tutor: tutor ? `${tutor.firstName} ${tutor.lastName}` : undefined,
          status: session.status,
          duration: session.duration,
          scheduledAt: session.scheduledAt.toISOString()
        },
        relevanceScore: this.calculateRelevanceScore(query, session.title, session.description),
        highlights: this.generateHighlights(query, session.title, session.description)
      })),
      total
    };
  }

  /**
   * Search roadmaps and learning paths
   */
  private async searchRoadmaps(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [eq(callernRoadmaps.isActive, true)];

    if (query) {
      whereConditions.push(
        or(
          ilike(callernRoadmaps.roadmapName, `%${query}%`),
          ilike(callernRoadmaps.description, `%${query}%`)
        )
      );
    }

    const whereClause = and(...whereConditions);

    const results = await db
      .select()
      .from(callernRoadmaps)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(callernRoadmaps)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(roadmap => ({
        id: `roadmap-${roadmap.id}`,
        type: 'roadmap' as const,
        title: roadmap.roadmapName,
        description: roadmap.description || undefined,
        url: `/roadmaps/${roadmap.id}`,
        metadata: {
          totalSteps: roadmap.totalSteps,
          estimatedHours: roadmap.estimatedHours
        },
        relevanceScore: this.calculateRelevanceScore(query, roadmap.roadmapName, roadmap.description),
        highlights: this.generateHighlights(query, roadmap.roadmapName, roadmap.description)
      })),
      total
    };
  }

  /**
   * Search dictionary and glossary items
   */
  private async searchDictionary(
    query: string,
    filters: SearchFilters,
    options: { limit: number; offset: number }
  ): Promise<{ results: SearchResultItem[]; total: number }> {
    const { limit, offset } = options;

    let whereConditions = [eq(glossaryItems.isActive, true)];

    if (query) {
      whereConditions.push(
        or(
          ilike(glossaryItems.term, `%${query}%`),
          ilike(glossaryItems.definition, `%${query}%`),
          ilike(glossaryItems.etymology, `%${query}%`)
        )
      );
    }

    if (filters.languages?.length) {
      whereConditions.push(inArray(glossaryItems.language, filters.languages));
    }

    const whereClause = and(...whereConditions);

    const results = await db
      .select()
      .from(glossaryItems)
      .where(whereClause)
      .limit(limit)
      .offset(offset);

    const total = await db
      .select({ count: sql<number>`count(*)` })
      .from(glossaryItems)
      .where(whereClause)
      .then(result => result[0]?.count || 0);

    return {
      results: results.map(item => ({
        id: `dictionary-${item.id}`,
        type: 'dictionary' as const,
        title: item.term,
        description: item.definition,
        url: `/dictionary/${item.id}`,
        metadata: {
          language: item.language,
          category: item.category,
          difficulty: item.difficultyLevel,
          pronunciation: item.pronunciation,
          etymology: item.etymology,
          tags: item.tags || []
        },
        relevanceScore: this.calculateRelevanceScore(query, item.term, item.definition),
        highlights: this.generateHighlights(query, item.term, item.definition)
      })),
      total
    };
  }

  /**
   * Get search suggestions and autocomplete
   */
  async getSuggestions(
    query: string,
    options: {
      limit?: number;
      language?: string;
      userId?: number;
    } = {}
  ): Promise<string[]> {
    const { limit = 10, language = 'en' } = options;
    
    if (!query || query.length < 2) {
      // Return trending searches for empty queries
      const trending = await db
        .select({ query: trendingSearches.query })
        .from(trendingSearches)
        .where(eq(trendingSearches.language, language))
        .orderBy(desc(trendingSearches.trendScore))
        .limit(limit);
      
      return trending.map(t => t.query);
    }

    // Get suggestions from search suggestions table
    const suggestions = await db
      .select({ suggestion: searchSuggestions.suggestion })
      .from(searchSuggestions)
      .where(
        and(
          ilike(searchSuggestions.query, `%${query}%`),
          eq(searchSuggestions.language, language),
          eq(searchSuggestions.isActive, true)
        )
      )
      .orderBy(desc(searchSuggestions.usage_count))
      .limit(limit);

    return suggestions.map(s => s.suggestion);
  }

  /**
   * Get user's search history
   */
  async getSearchHistory(
    userId: number,
    options: { limit?: number; days?: number } = {}
  ): Promise<Array<{ query: string; timestamp: Date; resultsCount: number }>> {
    const { limit = 20, days = 30 } = options;
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const history = await db
      .select({
        query: searchHistory.query,
        timestamp: searchHistory.createdAt,
        resultsCount: searchHistory.resultsCount
      })
      .from(searchHistory)
      .where(
        and(
          eq(searchHistory.userId, userId),
          gte(searchHistory.createdAt, cutoffDate)
        )
      )
      .orderBy(desc(searchHistory.createdAt))
      .limit(limit);

    return history.map(h => ({
      query: h.query,
      timestamp: h.timestamp || new Date(),
      resultsCount: h.resultsCount || 0
    }));
  }

  /**
   * Get trending searches
   */
  async getTrendingSearches(
    options: {
      limit?: number;
      timeframe?: 'hour' | 'day' | 'week' | 'month';
      language?: string;
      category?: string;
    } = {}
  ): Promise<Array<{ query: string; volume: number; growthRate: number }>> {
    const { 
      limit = 10, 
      timeframe = 'week', 
      language = 'en',
      category = 'general'
    } = options;

    const trending = await db
      .select({
        query: trendingSearches.query,
        volume: trendingSearches.searchVolume,
        growthRate: trendingSearches.growthRate
      })
      .from(trendingSearches)
      .where(
        and(
          eq(trendingSearches.language, language),
          eq(trendingSearches.category, category),
          eq(trendingSearches.timeframe, timeframe)
        )
      )
      .orderBy(desc(trendingSearches.trendScore))
      .limit(limit);

    return trending.map(t => ({
      query: t.query,
      volume: t.volume || 0,
      growthRate: parseFloat(t.growthRate?.toString() || '0')
    }));
  }

  /**
   * Log search for analytics
   */
  private async logSearch(params: {
    query: string;
    userId?: number;
    sessionId?: string;
    resultsCount: number;
    responseTime: number;
    filters: SearchFilters;
  }): Promise<void> {
    const { query, userId, sessionId, resultsCount, responseTime, filters } = params;

    // Log to search history if user is logged in
    if (userId) {
      const historyData: SearchHistoryInsert = {
        userId,
        query,
        resultsCount,
        sessionId,
        filters
      };

      await db.insert(searchHistory).values(historyData).execute();
    }

    // Update search analytics
    const normalizedQuery = this.normalizeQuery(query);
    
    const existing = await db
      .select()
      .from(searchAnalytics)
      .where(eq(searchAnalytics.normalizedQuery, normalizedQuery))
      .limit(1);

    if (existing.length > 0) {
      const current = existing[0];
      const newSearchCount = (current.searchCount || 0) + 1;
      const newAvgResults = ((current.totalResults || 0) + resultsCount) / newSearchCount;
      const newAvgResponseTime = ((current.avgResponseTime || 0) + responseTime) / newSearchCount;

      await db
        .update(searchAnalytics)
        .set({
          searchCount: newSearchCount,
          totalResults: (current.totalResults || 0) + resultsCount,
          avgResultsCount: newAvgResults.toString(),
          avgResponseTime: Math.round(newAvgResponseTime),
          lastSearched: new Date(),
          updatedAt: new Date()
        })
        .where(eq(searchAnalytics.id, current.id))
        .execute();
    } else {
      const analyticsData: SearchAnalyticsInsert = {
        query,
        normalizedQuery,
        searchCount: 1,
        totalResults: resultsCount,
        avgResultsCount: resultsCount.toString(),
        avgResponseTime: responseTime
      };

      await db.insert(searchAnalytics).values(analyticsData).execute();
    }
  }

  /**
   * Calculate relevance score for search results
   */
  private calculateRelevanceScore(query: string, title?: string | null, description?: string | null): number {
    if (!title && !description) return 0;
    
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const titleText = (title || '').toLowerCase();
    const descText = (description || '').toLowerCase();
    
    let score = 0;
    
    // Exact matches get highest score
    if (titleText.includes(query.toLowerCase())) score += 100;
    if (descText.includes(query.toLowerCase())) score += 50;
    
    // Word matches
    queryWords.forEach(word => {
      if (titleText.includes(word)) score += 20;
      if (descText.includes(word)) score += 10;
      
      // Partial matches
      if (titleText.includes(word.substring(0, Math.max(3, word.length - 1)))) score += 5;
    });
    
    return Math.min(score, 100);
  }

  /**
   * Generate search result highlights
   */
  private generateHighlights(
    query: string,
    title?: string | null,
    description?: string | null
  ): { title?: string; description?: string } {
    const highlights: { title?: string; description?: string } = {};
    
    if (!query) return highlights;
    
    const queryRegex = new RegExp(`(${query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')})`, 'gi');
    
    if (title && title.toLowerCase().includes(query.toLowerCase())) {
      highlights.title = title.replace(queryRegex, '<mark>$1</mark>');
    }
    
    if (description && description.toLowerCase().includes(query.toLowerCase())) {
      highlights.description = description.replace(queryRegex, '<mark>$1</mark>');
    }
    
    return highlights;
  }

  /**
   * Sort search results
   */
  private sortResults(results: SearchResultItem[], sortBy: string): SearchResultItem[] {
    switch (sortBy) {
      case 'relevance':
        return results.sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
      case 'alphabetical':
        return results.sort((a, b) => a.title.localeCompare(b.title));
      case 'rating':
        return results.sort((a, b) => (b.metadata.rating || 0) - (a.metadata.rating || 0));
      default:
        return results;
    }
  }

  /**
   * Calculate facets for filtering
   */
  private calculateFacets(results: SearchResultItem[]) {
    const facets = {
      categories: new Map<string, number>(),
      languages: new Map<string, number>(),
      levels: new Map<string, number>(),
      contentTypes: new Map<string, number>()
    };

    results.forEach(result => {
      // Content types
      facets.contentTypes.set(result.type, (facets.contentTypes.get(result.type) || 0) + 1);
      
      // Categories
      if (result.metadata.category) {
        facets.categories.set(
          result.metadata.category, 
          (facets.categories.get(result.metadata.category) || 0) + 1
        );
      }
      
      // Languages
      if (result.metadata.language) {
        facets.languages.set(
          result.metadata.language, 
          (facets.languages.get(result.metadata.language) || 0) + 1
        );
      }
      
      // Levels
      if (result.metadata.level) {
        facets.levels.set(
          result.metadata.level, 
          (facets.levels.get(result.metadata.level) || 0) + 1
        );
      }
    });

    return {
      categories: Array.from(facets.categories.entries()).map(([name, count]) => ({ name, count })),
      languages: Array.from(facets.languages.entries()).map(([name, count]) => ({ name, count })),
      levels: Array.from(facets.levels.entries()).map(([name, count]) => ({ name, count })),
      contentTypes: Array.from(facets.contentTypes.entries()).map(([name, count]) => ({ name, count }))
    };
  }

  /**
   * Normalize query for consistent processing
   */
  private normalizeQuery(query: string): string {
    return query.toLowerCase().trim().replace(/\s+/g, ' ');
  }
}

export const searchService = new SearchService();