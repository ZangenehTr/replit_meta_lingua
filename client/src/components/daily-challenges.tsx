import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, Zap, BookOpen, Users, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface DailyChallenge {
  id: number;
  title: string;
  description: string;
  type: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'writing' | 'social';
  target: number;
  current: number;
  reward: {
    xp: number;
    credits: number;
  };
  timeLeft: string;
  difficulty: 'easy' | 'medium' | 'hard';
  isCompleted: boolean;
}

const getChallengeIcon = (type: string) => {
  switch (type) {
    case 'vocabulary': return BookOpen;
    case 'grammar': return Target;
    case 'conversation': return MessageCircle;
    case 'listening': return Zap;
    case 'writing': return BookOpen;
    case 'social': return Users;
    default: return Target;
  }
};

const getDifficultyColor = (difficulty: string) => {
  switch (difficulty) {
    case 'easy': return 'bg-green-500';
    case 'medium': return 'bg-yellow-500';
    case 'hard': return 'bg-red-500';
    default: return 'bg-gray-500';
  }
};

export function DailyChallenges() {
  const { currentLanguage, isRTL } = useLanguage();

  const challenges: DailyChallenge[] = [
    {
      id: 1,
      title: currentLanguage === 'fa' ? 'مرور واژگان روزانه' : 'Daily Vocabulary Review',
      description: currentLanguage === 'fa' ? '۲۰ کلمه جدید یاد بگیرید' : 'Learn 20 new words',
      type: 'vocabulary',
      target: 20,
      current: 12,
      reward: { xp: 50, credits: 2 },
      timeLeft: currentLanguage === 'fa' ? '۶ ساعت باقی مانده' : '6 hours left',
      difficulty: 'easy',
      isCompleted: false
    },
    {
      id: 2,
      title: currentLanguage === 'fa' ? 'تمرین مکالمه' : 'Conversation Practice',
      description: currentLanguage === 'fa' ? '۱۵ دقیقه با یک توتور صحبت کنید' : 'Speak with a tutor for 15 minutes',
      type: 'conversation',
      target: 15,
      current: 8,
      reward: { xp: 100, credits: 5 },
      timeLeft: currentLanguage === 'fa' ? '۴ ساعت باقی مانده' : '4 hours left',
      difficulty: 'medium',
      isCompleted: false
    },
    {
      id: 3,
      title: currentLanguage === 'fa' ? 'تمرین گرامر' : 'Grammar Exercise',
      description: currentLanguage === 'fa' ? '۳ تمرین گرامر را تکمیل کنید' : 'Complete 3 grammar exercises',
      type: 'grammar',
      target: 3,
      current: 3,
      reward: { xp: 75, credits: 3 },
      timeLeft: currentLanguage === 'fa' ? 'تکمیل شده' : 'Completed',
      difficulty: 'medium',
      isCompleted: true
    }
  ];

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="text-center">
        <h3 className="text-lg font-bold mb-1">
          {currentLanguage === 'fa' ? 'چالش‌های روزانه' : 'Daily Challenges'}
        </h3>
        <p className="text-sm text-muted-foreground">
          {currentLanguage === 'fa' 
            ? 'چالش‌ها را تکمیل کنید و جوایز کسب کنید'
            : 'Complete challenges to earn rewards'
          }
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-2 sm:gap-3">
        {challenges.map((challenge) => {
          const Icon = getChallengeIcon(challenge.type);
          const progress = (challenge.current / challenge.target) * 100;
          
          return (
            <Card key={challenge.id} className={`relative ${challenge.isCompleted ? 'bg-green-50 dark:bg-green-900/20' : ''}`}>
              <CardHeader className="pb-2 p-3 sm:p-4">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-1 sm:gap-2 min-w-0 flex-1">
                    <Icon className="h-3 w-3 sm:h-4 sm:w-4 text-primary flex-shrink-0" />
                    <Badge 
                      className={`${getDifficultyColor(challenge.difficulty)} text-white text-xs flex-shrink-0`}
                    >
                      {currentLanguage === 'fa' ? 
                        (challenge.difficulty === 'easy' ? 'آسان' : 
                         challenge.difficulty === 'medium' ? 'متوسط' : 'سخت') :
                        challenge.difficulty
                      }
                    </Badge>
                  </div>
                  <div className="flex items-center gap-1 text-xs text-muted-foreground flex-shrink-0">
                    <Clock className="h-3 w-3" />
                    <span className="hidden sm:inline">{challenge.timeLeft}</span>
                  </div>
                </div>
                <CardTitle className="text-sm leading-tight truncate">{challenge.title}</CardTitle>
                <CardDescription className="text-xs line-clamp-2">{challenge.description}</CardDescription>
              </CardHeader>
              
              <CardContent className="space-y-3 pt-0 p-3 sm:p-4">
                <div className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>
                      {currentLanguage === 'fa' ? 'پیشرفت' : 'Progress'}
                    </span>
                    <span className="font-medium">
                      {challenge.current}/{challenge.target}
                    </span>
                  </div>
                  <Progress value={progress} className="h-1.5" />
                </div>

                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2 sm:gap-3 text-xs min-w-0 flex-1">
                    <div className="flex items-center gap-1">
                      <Zap className="h-3 w-3 text-yellow-500" />
                      <span>+{challenge.reward.xp}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="h-3 w-3 rounded-full bg-blue-500" />
                      <span>+{challenge.reward.credits}</span>
                    </div>
                  </div>
                  
                  {challenge.isCompleted ? (
                    <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 text-xs flex-shrink-0">
                      {currentLanguage === 'fa' ? 'تکمیل' : 'Done'}
                    </Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 px-2 text-xs flex-shrink-0">
                      {currentLanguage === 'fa' ? 'شروع' : 'Start'}
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}