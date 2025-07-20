import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Trophy, Zap, Target, Star, ChevronRight } from 'lucide-react';
import { Link } from 'wouter';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';

export function MobileGamificationWidget() {
  const { language: currentLanguage, isRTL } = useLanguage();

  // Fetch real user statistics (replacing hardcoded gamification data)
  const { data: userStatsData, isLoading } = useQuery({
    queryKey: ['/api/student/stats'],
  });

  const userStats = userStatsData ? {
    level: userStatsData.level || 1,
    xp: userStatsData.totalXp || 0,
    nextLevelXp: (userStatsData.level || 1) * 500,
    streakDays: userStatsData.currentStreak || 0,
    completedChallenges: userStatsData.completedChallenges || 0,
    totalChallenges: userStatsData.totalChallenges || 15,
    rank: userStatsData.leaderboardRank || 0
  } : {
    level: 1,
    xp: 0,
    nextLevelXp: 500,
    streakDays: 0,
    completedChallenges: 0,
    totalChallenges: 0,
    rank: 0
  };

  if (isLoading) {
    return <div className="mb-4 p-4 bg-gray-100 rounded-lg animate-pulse">Loading stats...</div>;
  }

  const progressToNextLevel = (userStats.xp / userStats.nextLevelXp) * 100;

  return (
    <Card className="mb-4 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/30 dark:to-purple-950/30 border-blue-200 dark:border-blue-800">
      <CardContent className="p-4">
        <div className={`space-y-3 ${isRTL ? 'rtl' : 'ltr'}`}>
          {/* Header with Level and XP */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <Star className="h-5 w-5 text-white" />
              </div>
              <div>
                <div className="text-sm font-semibold">
                  {currentLanguage === 'fa' ? `سطح ${userStats.level}` : `Level ${userStats.level}`}
                </div>
                <div className="text-xs text-muted-foreground">
                  {userStats.xp.toLocaleString()} / {userStats.nextLevelXp.toLocaleString()} XP
                </div>
              </div>
            </div>
            <Link href="/progress">
              <Button size="sm" variant="outline" className="h-8">
                <Trophy className="h-4 w-4 mr-1" />
                <span className="hidden sm:inline">
                  {currentLanguage === 'fa' ? 'مشاهده' : 'View'}
                </span>
                <ChevronRight className="h-4 w-4 sm:hidden" />
              </Button>
            </Link>
          </div>

          {/* Progress Bar */}
          <div className="space-y-1">
            <Progress value={progressToNextLevel} className="h-2" />
            <div className="text-xs text-muted-foreground text-center">
              {Math.round((userStats.nextLevelXp - userStats.xp) / 10) * 10} XP {currentLanguage === 'fa' ? 'تا سطح بعد' : 'to next level'}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-2">
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Zap className="h-3 w-3 text-orange-500" />
                <span className="text-xs font-medium">{userStats.streakDays}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentLanguage === 'fa' ? 'روز پیاپی' : 'Day Streak'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Target className="h-3 w-3 text-green-500" />
                <span className="text-xs font-medium">{userStats.completedChallenges}/{userStats.totalChallenges}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentLanguage === 'fa' ? 'چالش‌ها' : 'Challenges'}
              </div>
            </div>
            
            <div className="text-center p-2 bg-white/50 dark:bg-gray-800/50 rounded-lg">
              <div className="flex items-center justify-center gap-1 mb-1">
                <Trophy className="h-3 w-3 text-yellow-500" />
                <span className="text-xs font-medium">#{userStats.rank}</span>
              </div>
              <div className="text-xs text-muted-foreground">
                {currentLanguage === 'fa' ? 'رتبه' : 'Rank'}
              </div>
            </div>
          </div>

          {/* Next Challenge Preview */}
          <div className="bg-white/70 dark:bg-gray-800/70 rounded-lg p-3">
            <div className="flex items-center justify-between">
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium mb-1">
                  {currentLanguage === 'fa' ? 'چالش بعدی' : 'Next Challenge'}
                </div>
                <div className="text-xs text-muted-foreground truncate">
                  {currentLanguage === 'fa' ? 'تمرین مکالمه - ۱۵ دقیقه' : 'Conversation Practice - 15 min'}
                </div>
              </div>
              <Badge variant="secondary" className="ml-2">
                <Zap className="h-3 w-3 mr-1" />
                +100 XP
              </Badge>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}