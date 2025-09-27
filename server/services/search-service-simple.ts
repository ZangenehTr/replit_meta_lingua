import { eq, sql, desc, and, or, like, ilike } from "drizzle-orm";
import { db } from "../db";
import { users, courses, books, games, sessions } from "@shared/schema";

export interface SearchResultItem {
  id: string;
  title: string;
  description?: string;
  type: 'user' | 'course' | 'book' | 'game' | 'session';
  score: number;
  metadata?: any;
}

export interface SearchResponse {
  results: SearchResultItem[];
  total: number;
  page: number;
  limit: number;
  facets?: any;
  query: string;
  searchTime: number;
}

export class SimpleSearchService {
  /**
   * Main search function that works with existing tables
   */
  async search(
    query: string,
    options: {
      page?: number;
      limit?: number;
      sortBy?: 'relevance' | 'date' | 'alphabetical';
    } = {}
  ): Promise<SearchResponse> {
    const startTime = Date.now();
    const { page = 1, limit = 20, sortBy = 'relevance' } = options;
    const offset = (page - 1) * limit;
    const normalizedQuery = `%${query.toLowerCase()}%`;

    try {
      const allResults: SearchResultItem[] = [];

      // Search users (teachers, students)
      try {
        const userResults = await db
          .select({
            id: users.id,
            firstName: users.firstName,
            lastName: users.lastName,
            email: users.email,
            role: users.role
          })
          .from(users)
          .where(
            or(
              ilike(users.firstName, normalizedQuery),
              ilike(users.lastName, normalizedQuery),
              ilike(users.email, normalizedQuery)
            )
          )
          .limit(limit);

        userResults.forEach(user => {
          allResults.push({
            id: user.id.toString(),
            title: `${user.firstName} ${user.lastName}`,
            description: `${user.role} - ${user.email}`,
            type: 'user',
            score: 0.8,
            metadata: { role: user.role, email: user.email }
          });
        });
      } catch (error) {
        console.error('User search error:', error);
      }

      // Search courses
      try {
        const courseResults = await db
          .select({
            id: courses.id,
            title: courses.title,
            description: courses.description,
            language: courses.targetLanguage,
            level: courses.level
          })
          .from(courses)
          .where(
            or(
              ilike(courses.title, normalizedQuery),
              ilike(courses.description, normalizedQuery)
            )
          )
          .limit(limit);

        courseResults.forEach(course => {
          allResults.push({
            id: course.id.toString(),
            title: course.title,
            description: course.description || '',
            type: 'course',
            score: 0.9,
            metadata: { language: course.language, level: course.level }
          });
        });
      } catch (error) {
        console.error('Course search error:', error);
      }

      // Search books
      try {
        const bookResults = await db
          .select({
            id: books.id,
            title: books.title,
            author: books.author,
            description: books.description,
            isbn: books.isbn
          })
          .from(books)
          .where(
            or(
              ilike(books.title, normalizedQuery),
              ilike(books.author, normalizedQuery),
              ilike(books.description, normalizedQuery)
            )
          )
          .limit(limit);

        bookResults.forEach(book => {
          allResults.push({
            id: book.id.toString(),
            title: book.title,
            description: `by ${book.author} - ${book.description || ''}`,
            type: 'book',
            score: 0.7,
            metadata: { author: book.author, isbn: book.isbn }
          });
        });
      } catch (error) {
        console.error('Book search error:', error);
      }

      // Search games
      try {
        const gameResults = await db
          .select({
            id: games.id,
            title: games.title,
            description: games.description,
            category: games.category,
            difficulty: games.difficulty
          })
          .from(games)
          .where(
            or(
              ilike(games.title, normalizedQuery),
              ilike(games.description, normalizedQuery)
            )
          )
          .limit(limit);

        gameResults.forEach(game => {
          allResults.push({
            id: game.id.toString(),
            title: game.title,
            description: game.description || '',
            type: 'game',
            score: 0.6,
            metadata: { category: game.category, difficulty: game.difficulty }
          });
        });
      } catch (error) {
        console.error('Game search error:', error);
      }

      // Sort by score (relevance) or alphabetically
      let sortedResults = allResults;
      if (sortBy === 'alphabetical') {
        sortedResults = allResults.sort((a, b) => a.title.localeCompare(b.title));
      } else {
        sortedResults = allResults.sort((a, b) => b.score - a.score);
      }

      const paginatedResults = sortedResults.slice(offset, offset + limit);
      const searchTime = Date.now() - startTime;

      return {
        results: paginatedResults,
        total: allResults.length,
        page,
        limit,
        query,
        searchTime,
        facets: this.calculateFacets(allResults)
      };
    } catch (error) {
      console.error('Search service error:', error);
      throw new Error('Search failed. Please try again.');
    }
  }

  /**
   * Get search suggestions
   */
  async getSuggestions(query: string, limit: number = 10): Promise<string[]> {
    try {
      // Simple suggestion system using existing data
      const normalizedQuery = `%${query.toLowerCase()}%`;
      const suggestions: string[] = [];

      // Get course titles as suggestions
      const courseResults = await db
        .select({ title: courses.title })
        .from(courses)
        .where(ilike(courses.title, normalizedQuery))
        .limit(limit / 2);

      courseResults.forEach(course => suggestions.push(course.title));

      // Get book titles as suggestions  
      const bookResults = await db
        .select({ title: books.title })
        .from(books)
        .where(ilike(books.title, normalizedQuery))
        .limit(limit / 2);

      bookResults.forEach(book => suggestions.push(book.title));

      return [...new Set(suggestions)].slice(0, limit); // Remove duplicates and limit
    } catch (error) {
      console.error('Suggestions error:', error);
      return [];
    }
  }

  /**
   * Check service health
   */
  async healthCheck(): Promise<{ status: 'healthy' | 'unhealthy'; details?: string }> {
    try {
      // Simple health check - try to query users table
      await db.select({ count: sql`count(*)` }).from(users).limit(1);
      return { status: 'healthy' };
    } catch (error) {
      console.error('Search health check failed:', error);
      return { status: 'unhealthy', details: (error as Error).message };
    }
  }

  private calculateFacets(results: SearchResultItem[]) {
    const facets: any = {
      types: {},
      languages: {},
      roles: {}
    };

    results.forEach(result => {
      // Count by type
      facets.types[result.type] = (facets.types[result.type] || 0) + 1;

      // Count by language (for courses)
      if (result.metadata?.language) {
        facets.languages[result.metadata.language] = (facets.languages[result.metadata.language] || 0) + 1;
      }

      // Count by role (for users)
      if (result.metadata?.role) {
        facets.roles[result.metadata.role] = (facets.roles[result.metadata.role] || 0) + 1;
      }
    });

    return facets;
  }
}

export const simpleSearchService = new SimpleSearchService();