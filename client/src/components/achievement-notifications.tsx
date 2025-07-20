import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';

interface Achievement {
  id: number;
  title: string;
  description: string;
  type: 'milestone' | 'streak' | 'skill' | 'social';
  xpReward: number;
  icon: string;
  isNew: boolean;
}

export function AchievementNotifications() {
  const { language, isRTL, t } = useLanguage();
  const [dismissedNotifications, setDismissedNotifications] = useState<number[]>([]);

  // Fetch recent achievements from API
  const { data: recentAchievements = [] } = useQuery<Achievement[]>({
    queryKey: ['/api/gamification/recent-achievements'],
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  useEffect(() => {
    // Load dismissed notifications from localStorage
    const dismissed = JSON.parse(localStorage.getItem('dismissedAchievements') || '[]');
    setDismissedNotifications(dismissed);
  }, []);

  // Filter out dismissed achievements
  const notifications = recentAchievements.filter(
    achievement => achievement.isNew && !dismissedNotifications.includes(achievement.id)
  );

  const dismissNotification = (id: number) => {
    // Update dismissed notifications
    const updatedDismissed = [...dismissedNotifications, id];
    setDismissedNotifications(updatedDismissed);
    
    // Save to localStorage so it doesn't appear again
    localStorage.setItem('dismissedAchievements', JSON.stringify(updatedDismissed));
  };

  if (notifications.length === 0) return null;

  return (
    <div className={`fixed top-20 right-4 z-40 space-y-2 ${isRTL ? 'right-auto left-4' : ''}`}>
      {notifications.map((achievement) => (
        <Card key={achievement.id} className="w-80 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 border-yellow-200 dark:border-yellow-800 shadow-lg animate-in slide-in-from-right duration-500">
          <CardContent className="p-4">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-3">
                <div className="text-2xl">{achievement.icon}</div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <Trophy className="h-4 w-4 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-800 dark:text-yellow-200 text-sm">
                      {achievement.title}
                    </h4>
                  </div>
                  <p className="text-xs text-yellow-700 dark:text-yellow-300 mb-2">
                    {achievement.description}
                  </p>
                  <div className="flex items-center gap-2">
                    <Badge className="bg-yellow-200 text-yellow-800 dark:bg-yellow-800 dark:text-yellow-200 text-xs">
                      <Zap className="h-3 w-3 mr-1" />
                      +{achievement.xpReward} XP
                    </Badge>
                  </div>
                </div>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() => dismissNotification(achievement.id)}
                className="h-6 w-6 p-0 text-yellow-600 hover:text-yellow-800"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}