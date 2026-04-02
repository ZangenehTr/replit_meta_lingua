export { normalizePhoneNumber } from './storage/storage-types';
export type { IStorage } from './storage/storage-types';

export { MemStorage } from './storage/mem-storage';

import { DatabaseStorage } from './database-storage';
import { UnifiedTestingMemStorage } from './storage/unified-testing-impl';

export const storage = new DatabaseStorage();
export const unifiedTestingStorage = new UnifiedTestingMemStorage();

export {
  createCallSession,
  updateCallSession,
  getCallSession,
  updateTeacherStatus,
  getWebRTCConfig,
  generatePreSessionContent,
  generateSessionSummary,
  generateNextMicroSession,
  prepareSrsSeeds,
  storePreSessionData,
  createCallPostReport,
  updateCallPostReport,
  getCallPostReport,
  getSessionReport,
  generateSrsCardsFromTaughtItems,
  updateRoadmapProgressFromSession,
  updateOverallRatings,
  createActivityEvidence,
  updateActivityInstanceStatus,
  scoreActivityInstance,
  getStudentLearningGoal,
  getStudentFocusAreas,
  getRoadmapInstanceByCourse,
  getActiveRoadmapInstanceForStudent,
  getUpcomingActivities,
  getRecentSessions,
  getRoadmapPosition
} from './storage/callern-storage';
