import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  Trophy, 
  Award, 
  Clock, 
  Zap, 
  TrendingUp, 
  Star,
  ChevronRight,
  Flame,
  Target,
  BookOpen
} from "lucide-react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";

interface LessonProgress {
  lessonId: number;
  completedAt?: Date;
  score?: number;
  timeSpentMinutes: number;
  attempts: number;
}

interface GuestProgressData {
  id: number;
  sessionToken: string;
  completedLessons: number[];
  currentStreak: number;
  totalXp: number;
  currentLevel: number;
  strongSkills: string[];
  weakSkills: string[];
  preferredDifficulty: string;
  totalStudyTimeMinutes: number;
  lastActiveAt: string;
}

interface Achievement {
  id: number;
  achievementType: string;
  achievementTitle: string;
  achievementDescription: string;
  achievementIcon: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface GuestSession {
  sessionToken: string;
  progress: GuestProgressData;
  achievements: Achievement[];
  completedLessons: LessonProgress[];
}

export function LinguaQuestDashboard() {
  const { t, i18n } = useTranslation('linguaquest');
  const isRTL = i18n.dir() === 'rtl';
  const [sessionToken, setSessionToken] = useState<string | null>(null);

  useEffect(() => {
    const token = localStorage.getItem('linguaquest_session_token');
    setSessionToken(token);
  }, []);

  const { data: sessionData, isLoading } = useQuery<{ success: boolean; session: GuestSession }>({
    queryKey: ['/api/linguaquest/session', sessionToken],
    enabled: !!sessionToken,
  });

  // Show loading skeleton only while fetching data
  if (isLoading && sessionToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <Skeleton className="h-12 w-64" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {[1, 2, 3, 4].map(i => (
              <Skeleton key={i} className="h-32" />
            ))}
          </div>
          <Skeleton className="h-96" />
        </div>
      </div>
    );
  }

  // Show empty state if no session token exists
  if (!sessionToken) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">{t('dashboard.noProgress', 'No Progress Found')}</CardTitle>
            <CardDescription className="text-center">
              {t('dashboard.startLearningPrompt', 'Start learning to track your progress')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/linguaquest">
              <Button className="w-full" data-testid="button-start-learning">
                {t('dashboard.startLearning', 'Start Learning')}
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!sessionData?.success || !sessionData?.session) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8 flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardHeader>
            <CardTitle className="text-center">No Progress Found</CardTitle>
            <CardDescription className="text-center">
              Start learning to track your progress
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Link href="/linguaquest">
              <Button className="w-full" data-testid="button-start-learning">
                Start Learning
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const { progress, achievements, completedLessons } = sessionData.session;
  const xpToNextLevel = (progress.currentLevel * 100);
  const xpProgress = (progress.totalXp % 100) / 100 * 100;
  const unlockedAchievements = achievements.filter(a => a.isUnlocked);
  const totalHours = Math.floor(progress.totalStudyTimeMinutes / 60);
  const totalMinutes = progress.totalStudyTimeMinutes % 60;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 p-4 lg:p-8">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 dark:text-white mb-2">
              {t('dashboard.title', 'Your Learning Journey')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('dashboard.subtitle', 'Track your progress and achievements')}
            </p>
          </div>
          <Link href="/linguaquest">
            <Button variant="outline" size="lg" data-testid="button-back-to-lessons">
              <BookOpen className={`w-5 h-5 ${isRTL ? 'ml-2' : 'mr-2'}`} />
              {t('dashboard.backToLessons', 'Back to Lessons')}
            </Button>
          </Link>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
          >
            <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Zap className="w-4 h-4" />
                  {t('dashboard.totalXP', 'Total XP')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-total-xp">{progress.totalXp}</div>
                <p className="text-xs text-emerald-100 mt-1">
                  Level {progress.currentLevel}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-br from-amber-500 to-orange-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Flame className="w-4 h-4" />
                  {t('dashboard.currentStreak', 'Current Streak')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-current-streak">
                  {progress.currentStreak} {t('dashboard.days', 'days')}
                </div>
                <p className="text-xs text-amber-100 mt-1">
                  {t('dashboard.keepItGoing', 'Keep it going!')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <Card className="bg-gradient-to-br from-blue-500 to-cyan-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Trophy className="w-4 h-4" />
                  {t('dashboard.lessonsCompleted', 'Lessons Completed')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-lessons-completed">
                  {progress.completedLessons?.length || 0}
                </div>
                <p className="text-xs text-blue-100 mt-1">
                  {t('dashboard.greatProgress', 'Great progress!')}
                </p>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <Card className="bg-gradient-to-br from-purple-500 to-pink-600 text-white border-0">
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="w-4 h-4" />
                  {t('dashboard.timeSpent', 'Time Spent')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold" data-testid="text-time-spent">
                  {totalHours}h {totalMinutes}m
                </div>
                <p className="text-xs text-purple-100 mt-1">
                  {t('dashboard.learningTime', 'Learning time')}
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Level Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-emerald-600" />
              {t('dashboard.levelProgress', 'Level Progress')}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-300">
                  Level {progress.currentLevel}
                </span>
                <span className="text-sm text-gray-500 dark:text-gray-400">
                  {progress.totalXp % 100} / {xpToNextLevel} XP
                </span>
              </div>
              <Progress value={xpProgress} className="h-3" />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {100 - (progress.totalXp % 100)} XP to Level {progress.currentLevel + 1}
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="w-5 h-5 text-amber-600" />
                {t('dashboard.achievements', 'Achievements')}
              </CardTitle>
              <CardDescription>
                {unlockedAchievements.length} of {achievements.length} unlocked
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {unlockedAchievements.length > 0 ? (
                  unlockedAchievements.map((achievement, idx) => (
                    <motion.div
                      key={achievement.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-start gap-3 p-3 bg-amber-50 dark:bg-amber-900/20 rounded-lg"
                      data-testid={`achievement-${achievement.achievementType}`}
                    >
                      <div className="text-2xl">{achievement.achievementIcon || '🏆'}</div>
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          {achievement.achievementTitle}
                        </h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {achievement.achievementDescription}
                        </p>
                        {achievement.unlockedAt && (
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </p>
                        )}
                      </div>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <Trophy className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('dashboard.noAchievements', 'Complete lessons to unlock achievements!')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Recent Lessons */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="w-5 h-5 text-blue-600" />
                {t('dashboard.recentLessons', 'Recent Lessons')}
              </CardTitle>
              <CardDescription>
                Your latest completed lessons
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {completedLessons.length > 0 ? (
                  completedLessons.slice(0, 5).map((lesson, idx) => (
                    <motion.div
                      key={`${lesson.lessonId}-${idx}`}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg"
                      data-testid={`recent-lesson-${lesson.lessonId}`}
                    >
                      <div className="flex-1">
                        <h4 className="font-medium text-gray-900 dark:text-white">
                          Lesson #{lesson.lessonId}
                        </h4>
                        <div className="flex items-center gap-3 mt-1">
                          {lesson.score && (
                            <span className="text-xs text-gray-600 dark:text-gray-300 flex items-center gap-1">
                              <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                              {Math.round(lesson.score)}%
                            </span>
                          )}
                          <span className="text-xs text-gray-600 dark:text-gray-300">
                            {lesson.timeSpentMinutes}min
                          </span>
                          <span className="text-xs text-gray-500 dark:text-gray-400">
                            {lesson.attempts} {lesson.attempts === 1 ? 'attempt' : 'attempts'}
                          </span>
                        </div>
                      </div>
                      <Link href={`/linguaquest/lesson/${lesson.lessonId}`}>
                        <Button variant="ghost" size="sm" data-testid={`button-replay-lesson-${lesson.lessonId}`}>
                          <ChevronRight className="w-4 h-4" />
                        </Button>
                      </Link>
                    </motion.div>
                  ))
                ) : (
                  <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                    <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-50" />
                    <p>{t('dashboard.noRecentLessons', 'No lessons completed yet. Start your first lesson!')}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skills Overview */}
        {(progress.strongSkills?.length > 0 || progress.weakSkills?.length > 0) && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progress.strongSkills?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                    <TrendingUp className="w-5 h-5" />
                    {t('dashboard.strongSkills', 'Strong Skills')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {progress.strongSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 rounded-full text-sm font-medium"
                        data-testid={`strong-skill-${idx}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {progress.weakSkills?.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-amber-600 dark:text-amber-400">
                    <Target className="w-5 h-5" />
                    {t('dashboard.areasToImprove', 'Areas to Improve')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex flex-wrap gap-2">
                    {progress.weakSkills.map((skill, idx) => (
                      <span
                        key={idx}
                        className="px-3 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full text-sm font-medium"
                        data-testid={`weak-skill-${idx}`}
                      >
                        {skill}
                      </span>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
