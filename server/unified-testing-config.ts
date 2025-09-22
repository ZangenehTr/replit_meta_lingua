// ============================================================================
// UNIFIED TESTING SYSTEM CONFIGURATION
// ============================================================================
// Configuration for controlling unified testing system behavior and legacy system migration

export interface UnifiedTestingConfig {
  // Storage configuration
  useMapBasedStorage: boolean;
  useDatabaseStorage: boolean;
  
  // Legacy system control
  enableLegacyMSTRoutes: boolean;
  enableLegacyPlacementTestRoutes: boolean;
  enableLegacyGeneralTestRoutes: boolean;
  enableLegacyGameTestRoutes: boolean;
  
  // Migration settings
  redirectLegacyToUnified: boolean;
  showDeprecationWarnings: boolean;
  
  // Feature flags
  enableUnifiedTestingRoutes: boolean;
  enableAIGeneration: boolean;
  enableAdaptiveTesting: boolean;
  
  // Development settings
  allowUnsafeOperations: boolean;
  debugMode: boolean;
}

// Default configuration prioritizing the unified system with Map-based storage
export const DEFAULT_UNIFIED_TESTING_CONFIG: UnifiedTestingConfig = {
  // Storage: Use Map-based by default, database as fallback
  useMapBasedStorage: true,
  useDatabaseStorage: false,
  
  // Legacy systems: DISABLED by default (consolidation complete)
  enableLegacyMSTRoutes: false,
  enableLegacyPlacementTestRoutes: false,
  enableLegacyGeneralTestRoutes: false,
  enableLegacyGameTestRoutes: false,
  
  // Migration: Redirect legacy calls to unified system
  redirectLegacyToUnified: true,
  showDeprecationWarnings: true,
  
  // Unified system: ENABLED
  enableUnifiedTestingRoutes: true,
  enableAIGeneration: true,
  enableAdaptiveTesting: true,
  
  // Development
  allowUnsafeOperations: false,
  debugMode: process.env.NODE_ENV === 'development'
};

// Environment-based configuration override
export function loadUnifiedTestingConfig(): UnifiedTestingConfig {
  const config = { ...DEFAULT_UNIFIED_TESTING_CONFIG };
  
  // Override from environment variables
  if (process.env.ENABLE_LEGACY_MST === 'true') {
    config.enableLegacyMSTRoutes = true;
    console.warn('⚠️  Legacy MST routes are enabled. Consider migrating to unified system.');
  }
  
  if (process.env.ENABLE_LEGACY_PLACEMENT_TESTS === 'true') {
    config.enableLegacyPlacementTestRoutes = true;
    console.warn('⚠️  Legacy placement test routes are enabled. Consider migrating to unified system.');
  }
  
  if (process.env.ENABLE_LEGACY_GENERAL_TESTS === 'true') {
    config.enableLegacyGeneralTestRoutes = true;
    console.warn('⚠️  Legacy general test routes are enabled. Consider migrating to unified system.');
  }
  
  if (process.env.FORCE_DATABASE_STORAGE === 'true') {
    config.useMapBasedStorage = false;
    config.useDatabaseStorage = true;
    console.warn('⚠️  Forced to use database storage instead of preferred Map-based storage.');
  }
  
  if (process.env.DISABLE_UNIFIED_TESTING === 'true') {
    config.enableUnifiedTestingRoutes = false;
    console.error('❌ Unified testing routes are disabled. This is not recommended.');
  }
  
  if (process.env.UNIFIED_TESTING_DEBUG === 'true') {
    config.debugMode = true;
  }
  
  return config;
}

// Create global config instance
export const unifiedTestingConfig = loadUnifiedTestingConfig();

// Logging current configuration
export function logUnifiedTestingConfig() {
  console.log('🔧 Unified Testing System Configuration:');
  console.log('   Storage:', unifiedTestingConfig.useMapBasedStorage ? 'Map-based (in-memory)' : 'Database');
  console.log('   Legacy MST routes:', unifiedTestingConfig.enableLegacyMSTRoutes ? 'ENABLED' : 'DISABLED');
  console.log('   Legacy placement routes:', unifiedTestingConfig.enableLegacyPlacementTestRoutes ? 'ENABLED' : 'DISABLED');
  console.log('   Legacy general test routes:', unifiedTestingConfig.enableLegacyGeneralTestRoutes ? 'ENABLED' : 'DISABLED');
  console.log('   Unified routes:', unifiedTestingConfig.enableUnifiedTestingRoutes ? 'ENABLED' : 'DISABLED');
  console.log('   Redirect legacy to unified:', unifiedTestingConfig.redirectLegacyToUnified ? 'YES' : 'NO');
}

// Helper function to check if legacy systems should be disabled
export function shouldDisableLegacySystem(systemName: string): boolean {
  switch (systemName) {
    case 'mst':
      return !unifiedTestingConfig.enableLegacyMSTRoutes;
    case 'placement':
      return !unifiedTestingConfig.enableLegacyPlacementTestRoutes;
    case 'general':
      return !unifiedTestingConfig.enableLegacyGeneralTestRoutes;
    case 'game':
      return !unifiedTestingConfig.enableLegacyGameTestRoutes;
    default:
      return true; // Default to disabling unknown legacy systems
  }
}

// Deprecation warning middleware for legacy routes
export function createDeprecationWarningMiddleware(systemName: string, replacementEndpoint: string) {
  return (req: any, res: any, next: any) => {
    if (unifiedTestingConfig.showDeprecationWarnings) {
      console.warn(`⚠️  DEPRECATION WARNING: ${systemName} endpoint ${req.path} is deprecated.`);
      console.warn(`    Please migrate to unified testing endpoint: ${replacementEndpoint}`);
      
      // Add deprecation header
      res.set('X-Deprecated-Endpoint', 'true');
      res.set('X-Replacement-Endpoint', replacementEndpoint);
    }
    
    if (shouldDisableLegacySystem(systemName)) {
      return res.status(410).json({
        error: 'Legacy System Disabled',
        message: `${systemName} testing system has been disabled and consolidated into the unified testing system.`,
        migration: {
          replacementEndpoint,
          documentationUrl: '/api/unified-testing/docs',
          migrationGuide: '/docs/unified-testing-migration'
        }
      });
    }
    
    next();
  };
}

// Legacy route redirect middleware
export function createLegacyRedirectMiddleware(unifiedEndpoint: string) {
  return (req: any, res: any, next: any) => {
    if (unifiedTestingConfig.redirectLegacyToUnified) {
      console.log(`🔄 Redirecting legacy route ${req.path} to unified endpoint ${unifiedEndpoint}`);
      return res.redirect(307, unifiedEndpoint); // 307 preserves HTTP method
    }
    next();
  };
}