import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy, Star, Target, Flame, BookOpen, Clock, 
  Award, Medal, Crown, Zap, Calendar, TrendingUp, ArrowLeft, Home 
} from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { Link } from 'wouter';

interface Achievement {
  id: number;
  name: string;
  description: string;
  icon: string;
  type: 'progress' | 'streak' | 'milestone' | 'social' | 'skill';
  requirement: number;
  points: number;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
  isUnlocked: boolean;
  unlockedAt?: string;
  progress: number;
}

interface UserStats {
  totalXp: number;
  level: number;
  currentStreak: number;
  longestStreak: number;
  lessonsCompleted: number;
  coursesCompleted: number;
  minutesStudied: number;
  perfectQuizzes: number;
}

interface DailyGoal {
  id: number;
  goalType: 'lessons' | 'minutes' | 'xp';
  targetValue: number;
  currentValue: number;
  isCompleted: boolean;
}

const iconMap = {
  Trophy, Star, Target, Flame, BookOpen, Clock, 
  Award, Medal, Crown, Zap, Calendar, TrendingUp
};

export default function GamificationProgress() {
  const { t, currentLanguage, isRTL } = useLanguage();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch real user statistics
  const { data: userStatsData, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/student/stats'],
  });

  const userStats: UserStats = userStatsData || {
    totalXp: 0,
    level: 1,
    currentStreak: 0,
    longestStreak: 0,
    lessonsCompleted: 0,
    coursesCompleted: 0,
    minutesStudied: 0,
    perfectQuizzes: 0
  };

  // Fetch achievements data from API (replacing hardcoded achievements array)
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery<Achievement[]>({
    queryKey: ["/api/gamification/recent-achievements"],
  });

  // Fetch daily goals from API (replacing hardcoded dailyGoals array)
  const { data: dailyGoals = [], isLoading: goalsLoading } = useQuery<DailyGoal[]>({
    queryKey: ["/api/gamification/daily-goals"],
  });

  const getRarityColor = (rarity: string) => {
    switch (rarity) {
      case 'common': return 'bg-gray-500';
      case 'rare': return 'bg-blue-500';
      case 'epic': return 'bg-purple-500';
      case 'legendary': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getXpForLevel = (level: number) => level * 250;
  const currentLevelXp = getXpForLevel(userStats.level);
  const nextLevelXp = getXpForLevel(userStats.level + 1);
  const levelProgress = ((userStats.totalXp - currentLevelXp) / (nextLevelXp - currentLevelXp)) * 100;

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.type === selectedCategory);

  return (
    <div className={`min-h-screen p-2 sm:p-4 md:p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Navigation Bar - Mobile Optimized */}
      <div className="mb-4 md:mb-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Link href="/dashboard">
              <Button variant="outline" size="sm" className="flex items-center gap-1 sm:gap-2">
                <ArrowLeft className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{currentLanguage === 'fa' ? 'بازگشت' : 'Back'}</span>
              </Button>
            </Link>
            <Link href="/dashboard">
              <Button variant="ghost" size="sm" className="flex items-center gap-1 sm:gap-2">
                <Home className="h-3 w-3 sm:h-4 sm:w-4" />
                <span className="text-xs sm:text-sm">{currentLanguage === 'fa' ? 'خانه' : 'Home'}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-3 md:space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-xl sm:text-2xl md:text-3xl font-bold mb-2">
            {currentLanguage === 'fa' ? 'پیشرفت و دستاوردها' : 'Progress & Achievements'}
          </h1>
          <p className="text-muted-foreground">
            {currentLanguage === 'fa' 
              ? 'مسیر یادگیری خود را دنبال کنید و جوایز کسب کنید'
              : 'Track your learning journey and earn rewards'
            }
          </p>
        </div>

        {/* Stats Overview - Mobile Optimized */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-3 md:gap-4">
          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Star className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-yellow-500" />
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.level}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'سطح' : 'Level'}
              </div>
              <Progress value={levelProgress} className="mt-1 sm:mt-2 h-1 sm:h-2" />
              <div className="text-xs text-muted-foreground mt-1 hidden sm:block">
                {userStats.totalXp} / {nextLevelXp} XP
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Flame className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-orange-500" />
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.currentStreak}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'روز متوالی' : 'Day Streak'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-blue-500" />
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{userStats.lessonsCompleted}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'درس‌ها' : 'Lessons'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 sm:p-4 text-center">
              <div className="flex items-center justify-center mb-1 sm:mb-2">
                <Clock className="h-5 w-5 sm:h-6 sm:w-6 md:h-8 md:w-8 text-green-500" />
              </div>
              <div className="text-lg sm:text-xl md:text-2xl font-bold">{Math.floor(userStats.minutesStudied / 60)}</div>
              <div className="text-xs sm:text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'ساعت‌ها' : 'Hours'}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Daily Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              {currentLanguage === 'fa' ? 'اهداف روزانه' : 'Daily Goals'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {dailyGoals.map((goal) => (
                <div key={goal.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium mb-1">
                      {goal.goalType === 'lessons' && (currentLanguage === 'fa' ? 'درس‌ها' : 'Lessons')}
                      {goal.goalType === 'minutes' && (currentLanguage === 'fa' ? 'دقیقه مطالعه' : 'Study Minutes')}
                      {goal.goalType === 'xp' && 'XP'}
                    </div>
                    <Progress value={(goal.currentValue / goal.targetValue) * 100} className="h-2" />
                  </div>
                  <div className="ml-4 text-sm font-medium">
                    {goal.currentValue} / {goal.targetValue}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5" />
              {currentLanguage === 'fa' ? 'دستاوردها' : 'Achievements'}
            </CardTitle>
            <CardDescription>
              {currentLanguage === 'fa' 
                ? 'جوایز و مدال‌های کسب شده'
                : 'Earned badges and medals'
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
              <TabsList className="grid w-full grid-cols-6">
                <TabsTrigger value="all">
                  {currentLanguage === 'fa' ? 'همه' : 'All'}
                </TabsTrigger>
                <TabsTrigger value="milestone">
                  {currentLanguage === 'fa' ? 'نقاط عطف' : 'Milestones'}
                </TabsTrigger>
                <TabsTrigger value="streak">
                  {currentLanguage === 'fa' ? 'تداوم' : 'Streaks'}
                </TabsTrigger>
                <TabsTrigger value="skill">
                  {currentLanguage === 'fa' ? 'مهارت' : 'Skills'}
                </TabsTrigger>
                <TabsTrigger value="progress">
                  {currentLanguage === 'fa' ? 'پیشرفت' : 'Progress'}
                </TabsTrigger>
                <TabsTrigger value="social">
                  {currentLanguage === 'fa' ? 'اجتماعی' : 'Social'}
                </TabsTrigger>
              </TabsList>

              <TabsContent value={selectedCategory} className="mt-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredAchievements.map((achievement) => {
                    const IconComponent = iconMap[achievement.icon as keyof typeof iconMap];
                    return (
                      <Card 
                        key={achievement.id} 
                        className={`relative ${achievement.isUnlocked ? 'border-primary' : 'opacity-60'}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start gap-3">
                            <div className={`p-2 rounded-full ${getRarityColor(achievement.rarity)}`}>
                              <IconComponent className="h-6 w-6 text-white" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-1">
                                <h3 className="font-semibold">{achievement.name}</h3>
                                <Badge variant={achievement.rarity as any} className="text-xs">
                                  {achievement.rarity}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mb-2">
                                {achievement.description}
                              </p>
                              
                              {achievement.isUnlocked ? (
                                <div className="text-xs text-green-600 font-medium">
                                  ✓ {currentLanguage === 'fa' ? 'کسب شده' : 'Unlocked'}
                                  {achievement.unlockedAt && (
                                    <span className="ml-2 text-muted-foreground">
                                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                                    </span>
                                  )}
                                </div>
                              ) : (
                                <div>
                                  <Progress value={achievement.progress} className="h-2 mb-1" />
                                  <div className="text-xs text-muted-foreground">
                                    {achievement.progress}% {currentLanguage === 'fa' ? 'تمام' : 'Complete'}
                                  </div>
                                </div>
                              )}
                              
                              <div className="text-xs text-primary font-medium mt-2">
                                +{achievement.points} XP
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}