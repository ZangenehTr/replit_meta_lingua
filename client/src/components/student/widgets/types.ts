import { z } from "zod";

// Widget theme configuration for Explorer vs Learner
export type WidgetTheme = 'explorer' | 'learner';

export const themeConfig = {
  explorer: {
    primary: 'from-purple-600 to-blue-600',
    accent: 'from-purple-500 to-blue-500', 
    card: 'from-purple-50 to-blue-50',
    text: 'text-purple-700',
    badge: 'bg-purple-100 text-purple-700'
  },
  learner: {
    primary: 'from-blue-600 to-indigo-600',
    accent: 'from-blue-500 to-indigo-500',
    card: 'from-blue-50 to-indigo-50', 
    text: 'text-blue-700',
    badge: 'bg-blue-100 text-blue-700'
  }
} as const;

// Student Statistics Interface
export interface StudentStats {
  currentLevel: string;
  xp: number;
  nextLevelXp: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  weeklyGoal: number;
  weeklyProgress: number;
  streakDays?: number;
  totalCredits?: number;
  memberTier?: string;
  walletBalance?: number;
}

// Achievement Interface
export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlockedAt?: string;
  category?: 'learning' | 'streak' | 'completion' | 'social';
}

// Upcoming Session Interface
export interface UpcomingSession {
  id: string;
  title: string;
  teacher: string;
  teacherId?: number;
  time: string;
  scheduledAt: string;
  type: "online" | "in-person";
  status: 'scheduled' | 'in_progress' | 'completed' | 'cancelled';
  sessionUrl?: string;
  duration?: number;
  courseTitle?: string;
}

// Assignment Interface
export interface Assignment {
  id: string;
  title: string;
  dueDate: string;
  status: "pending" | "submitted" | "graded";
  score?: number;
  courseTitle?: string;
  description?: string;
  feedback?: string;
  priority?: 'low' | 'medium' | 'high';
}

// Learning Progress Interface
export interface LearningProgress {
  completedLessons: number;
  totalLessons: number;
  weeklyGoal: number;
  weeklyProgress: number;
  overallProgress?: number;
  currentCourse?: string;
  nextMilestone?: string;
}

// Quick Action Configuration
export interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<any>;
  action: () => void;
  color?: string;
  disabled?: boolean;
}

// Base Widget Props
export interface BaseWidgetProps {
  theme?: WidgetTheme;
  className?: string;
  loading?: boolean;
  error?: string | null;
  onRefresh?: () => void;
}

// Widget loading state
export interface WidgetLoadingProps {
  height?: string;
  animate?: boolean;
}

// Widget error state  
export interface WidgetErrorProps {
  message: string;
  onRetry?: () => void;
  compact?: boolean;
}