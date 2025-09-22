// ============================================================================
// UNIFIED TESTING STORAGE FACTORY
// ============================================================================
// Factory for creating storage instances with proper configuration

import { IUnifiedTestingStorage } from './unified-testing-storage';
import { TrueMapBasedUnifiedStorage } from './unified-testing-mem-storage';
import { unifiedTestingConfig, logUnifiedTestingConfig } from './unified-testing-config';

// Storage factory that creates the appropriate storage implementation
export class UnifiedTestingStorageFactory {
  private static instance: IUnifiedTestingStorage | null = null;
  
  /**
   * Get the configured storage instance (singleton)
   */
  static getInstance(): IUnifiedTestingStorage {
    if (!this.instance) {
      this.instance = this.createStorage();
      this.logStorageCreation();
    }
    return this.instance;
  }
  
  /**
   * Create storage instance based on configuration
   */
  private static createStorage(): IUnifiedTestingStorage {
    if (unifiedTestingConfig.useMapBasedStorage) {
      console.log('✅ Creating Map-based in-memory storage (NO database dependencies)');
      return new TrueMapBasedUnifiedStorage();
    } else if (unifiedTestingConfig.useDatabaseStorage) {
      console.log('⚠️  Creating database-backed storage (requires database connection)');
      // Import database storage only when needed to avoid dependencies
      try {
        const { UnifiedTestingStorage } = require('./unified-testing-storage');
        const { db } = require('./db');
        return new UnifiedTestingStorage(db);
      } catch (error) {
        console.error('❌ Failed to create database storage, falling back to Map-based storage');
        console.error('   Error:', error);
        return new TrueMapBasedUnifiedStorage();
      }
    } else {
      console.log('⚠️  No storage configuration specified, defaulting to Map-based storage');
      return new TrueMapBasedUnifiedStorage();
    }
  }
  
  /**
   * Reset the singleton instance (useful for testing)
   */
  static resetInstance(): void {
    this.instance = null;
  }
  
  /**
   * Log storage creation details
   */
  private static logStorageCreation(): void {
    const storageType = unifiedTestingConfig.useMapBasedStorage ? 'Map-based (in-memory)' : 'Database-backed';
    console.log('🏪 Unified Testing Storage Factory:');
    console.log(`   Storage type: ${storageType}`);
    console.log(`   Database dependencies: ${unifiedTestingConfig.useDatabaseStorage ? 'YES' : 'NO'}`);
    console.log(`   Memory footprint: ${unifiedTestingConfig.useMapBasedStorage ? 'Low (Maps only)' : 'Higher (DB connections)'}`);
    
    // Log configuration
    logUnifiedTestingConfig();
  }
  
  /**
   * Test storage connectivity and functionality
   */
  static async testStorageConnectivity(): Promise<{
    success: boolean;
    storageType: string;
    features: {
      canCreateQuestions: boolean;
      canCreateTemplates: boolean;
      canCreateSessions: boolean;
      canPerformAnalytics: boolean;
    };
    errors: string[];
  }> {
    const storage = this.getInstance();
    const storageType = unifiedTestingConfig.useMapBasedStorage ? 'Map-based' : 'Database';
    const errors: string[] = [];
    
    try {
      // Test basic question creation
      const testQuestion = await storage.createQuestion({
        questionType: 'multiple_choice',
        skill: 'reading',
        cefrLevel: 'B1',
        language: 'english',
        title: 'Test Question',
        instructions: 'Select the correct answer',
        content: {
          text: 'What is 2+2?',
          options: [
            { id: 'a', text: '3' },
            { id: 'b', text: '4' },
            { id: 'c', text: '5' }
          ],
          correctAnswers: ['b']
        },
        responseType: 'multiple_choice',
        scoringMethod: 'exact_match',
        createdBy: 1
      });
      
      // Test question retrieval
      const retrieved = await storage.getQuestion(testQuestion.id);
      const canCreateQuestions = retrieved !== undefined;
      
      // Test template creation
      let canCreateTemplates = false;
      try {
        const testTemplate = await storage.createTestTemplate({
          name: 'Test Template',
          testType: 'quiz',
          targetLanguage: 'english',
          sections: [],
          createdBy: 1
        });
        canCreateTemplates = testTemplate !== undefined;
      } catch (error) {
        errors.push(`Template creation failed: ${error}`);
      }
      
      // Test session creation
      let canCreateSessions = false;
      try {
        const testSession = await storage.createTestSession({
          userId: 1,
          templateId: 1,
          sessionType: 'quiz',
          assembledTest: {
            sections: [],
            totalQuestions: 0,
            estimatedDuration: 10
          }
        });
        canCreateSessions = testSession !== undefined;
      } catch (error) {
        errors.push(`Session creation failed: ${error}`);
      }
      
      // Test analytics
      let canPerformAnalytics = false;
      try {
        const analytics = await storage.getSystemAnalytics();
        canPerformAnalytics = analytics !== undefined;
      } catch (error) {
        errors.push(`Analytics failed: ${error}`);
      }
      
      // Clean up test question
      try {
        await storage.deleteQuestion(testQuestion.id);
      } catch (error) {
        // Ignore cleanup errors
      }
      
      return {
        success: canCreateQuestions && canCreateTemplates && canCreateSessions && canPerformAnalytics,
        storageType,
        features: {
          canCreateQuestions,
          canCreateTemplates,
          canCreateSessions,
          canPerformAnalytics
        },
        errors
      };
      
    } catch (error) {
      errors.push(`Storage test failed: ${error}`);
      return {
        success: false,
        storageType,
        features: {
          canCreateQuestions: false,
          canCreateTemplates: false,
          canCreateSessions: false,
          canPerformAnalytics: false
        },
        errors
      };
    }
  }
}

// Export the singleton instance getter for easy access
export const getUnifiedTestingStorage = () => UnifiedTestingStorageFactory.getInstance();

// Export test function for diagnostics
export const testUnifiedTestingStorage = () => UnifiedTestingStorageFactory.testStorageConnectivity();