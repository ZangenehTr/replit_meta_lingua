// Widget Components
export { GamificationWidget } from './GamificationWidget';
export { LearningProgressWidget } from './LearningProgressWidget';
export { UpcomingSessionsWidget } from './UpcomingSessionsWidget';
export { AssignmentsWidget } from './AssignmentsWidget';
export { AchievementWidget } from './AchievementWidget';
export { QuickActionsWidget } from './QuickActionsWidget';

// Progressive Disclosure Widgets
export { ProgressiveAssignmentsWidget } from './ProgressiveAssignmentsWidget';
export { ProgressiveSessionsWidget } from './ProgressiveSessionsWidget';

// Utility Components
export { WidgetError } from './WidgetError';
export { WidgetLoading } from './WidgetLoading';

// Types and Interfaces
export type {
  BaseWidgetProps,
  WidgetTheme,
  StudentStats,
  Achievement,
  UpcomingSession,
  Assignment,
  LearningProgress,
  QuickAction,
  WidgetLoadingProps,
  WidgetErrorProps
} from './types';

export { themeConfig } from './types';