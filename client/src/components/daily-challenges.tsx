import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Target, Zap, BookOpen, Users, MessageCircle } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation(['student', 'common']);
  const { language: currentLanguage, isRTL } = useLanguage();

  // Fetch daily challenges from API instead of hardcoding
  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['/api/gamification/daily-challenges'],
    select: (data: DailyChallenge[]) => data || []
  });

  if (challengesLoading) {
    return <div className="animate-pulse bg-gray-100 h-32 rounded-lg"></div>;
  }

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <div className="text-center">
        <h3 className="text-lg font-bold mb-1">
          {t('student:gamification.dailyChallenges')}
        </h3>
        <p className="text-sm text-muted-foreground">
          {t('student:gamification.challengeSubtitle')}
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