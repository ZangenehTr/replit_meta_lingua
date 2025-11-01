/**
 * Default Public Features Configuration
 * All features are enabled by default - admins must explicitly opt-out
 */

export const DEFAULT_PUBLIC_FEATURES = {
  courseCatalog: true,
  placementTest: true,
  teacherDirectory: true,
  liveClasses: true,
  progressTracking: true,
  linguaquestGames: true,
  certificates: true,
  oneOnOneSessions: true,
  blogPosts: true,
  videoCourses: true
} as const;
