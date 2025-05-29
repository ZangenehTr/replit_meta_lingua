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

  // Mock data for demonstration - replace with real API calls
  const userStats: UserStats = {
    totalXp: 2850,
    level: 12,
    currentStreak: 7,
    longestStreak: 15,
    lessonsCompleted: 45,
    coursesCompleted: 3,
    minutesStudied: 1260,
    perfectQuizzes: 12
  };

  const achievements: Achievement[] = [
    {
      id: 1,
      name: currentLanguage === 'fa' ? 'شروع سفر' : 'Journey Begins',
      description: currentLanguage === 'fa' ? 'اولین درس را تمام کنید' : 'Complete your first lesson',
      icon: 'Star',
      type: 'milestone',
      requirement: 1,
      points: 50,
      rarity: 'common',
      isUnlocked: true,
      unlockedAt: '2024-01-15',
      progress: 100
    },
    {
      id: 2,
      name: currentLanguage === 'fa' ? 'آتش پیاپی' : 'Fire Streak',
      description: currentLanguage === 'fa' ? '۷ روز متوالی درس بخوانید' : 'Study for 7 consecutive days',
      icon: 'Flame',
      type: 'streak',
      requirement: 7,
      points: 100,
      rarity: 'rare',
      isUnlocked: true,
      unlockedAt: '2024-01-22',
      progress: 100
    },
    {
      id: 3,
      name: currentLanguage === 'fa' ? 'استاد کوئیز' : 'Quiz Master',
      description: currentLanguage === 'fa' ? '۱۰ کوئیز با نمره کامل' : 'Get perfect score on 10 quizzes',
      icon: 'Trophy',
      type: 'skill',
      requirement: 10,
      points: 200,
      rarity: 'epic',
      isUnlocked: false,
      progress: 80
    },
    {
      id: 4,
      name: currentLanguage === 'fa' ? 'شاه زبان' : 'Language King',
      description: currentLanguage === 'fa' ? '۵ دوره کامل کنید' : 'Complete 5 full courses',
      icon: 'Crown',
      type: 'milestone',
      requirement: 5,
      points: 500,
      rarity: 'legendary',
      isUnlocked: false,
      progress: 60
    },
    {
      id: 5,
      name: currentLanguage === 'fa' ? 'دانش‌آموز سخت‌کوش' : 'Dedicated Scholar',
      description: currentLanguage === 'fa' ? '۱۰۰ ساعت مطالعه' : 'Study for 100 hours total',
      icon: 'BookOpen',
      type: 'progress',
      requirement: 6000, // minutes
      points: 300,
      rarity: 'epic',
      isUnlocked: false,
      progress: 21 // 1260/6000 * 100
    }
  ];

  const dailyGoals: DailyGoal[] = [
    {
      id: 1,
      goalType: 'lessons',
      targetValue: 3,
      currentValue: 2,
      isCompleted: false
    },
    {
      id: 2,
      goalType: 'minutes',
      targetValue: 30,
      currentValue: 25,
      isCompleted: false
    },
    {
      id: 3,
      goalType: 'xp',
      targetValue: 200,
      currentValue: 150,
      isCompleted: false
    }
  ];

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
    <div className={`min-h-screen p-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Navigation Bar */}
      <div className="mb-6">
        <div className="flex items-center justify-between">
          <Link href="/demo">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="h-4 w-4" />
              {currentLanguage === 'fa' ? 'بازگشت به داشبورد' : 'Back to Dashboard'}
            </Button>
          </Link>
          <Link href="/demo">
            <Button variant="ghost" size="sm">
              <Home className="h-4 w-4 mr-2" />
              {currentLanguage === 'fa' ? 'خانه' : 'Home'}
            </Button>
          </Link>
        </div>
      </div>

      <div className="max-w-6xl mx-auto space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold mb-2">
            {currentLanguage === 'fa' ? 'پیشرفت و دستاوردها' : 'Progress & Achievements'}
          </h1>
          <p className="text-muted-foreground">
            {currentLanguage === 'fa' 
              ? 'مسیر یادگیری خود را دنبال کنید و جوایز کسب کنید'
              : 'Track your learning journey and earn rewards'
            }
          </p>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Star className="h-8 w-8 text-yellow-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.level}</div>
              <div className="text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'سطح' : 'Level'}
              </div>
              <Progress value={levelProgress} className="mt-2" />
              <div className="text-xs text-muted-foreground mt-1">
                {userStats.totalXp} / {nextLevelXp} XP
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Flame className="h-8 w-8 text-orange-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.currentStreak}</div>
              <div className="text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'روز متوالی' : 'Day Streak'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <BookOpen className="h-8 w-8 text-blue-500" />
              </div>
              <div className="text-2xl font-bold">{userStats.lessonsCompleted}</div>
              <div className="text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'درس تمام شده' : 'Lessons Completed'}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4 text-center">
              <div className="flex items-center justify-center mb-2">
                <Clock className="h-8 w-8 text-green-500" />
              </div>
              <div className="text-2xl font-bold">{Math.floor(userStats.minutesStudied / 60)}</div>
              <div className="text-sm text-muted-foreground">
                {currentLanguage === 'fa' ? 'ساعت مطالعه' : 'Hours Studied'}
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