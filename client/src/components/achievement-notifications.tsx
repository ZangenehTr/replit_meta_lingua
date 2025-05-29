import { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Trophy, Star, Zap, X } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

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
  const { currentLanguage, isRTL } = useLanguage();
  const [notifications, setNotifications] = useState<Achievement[]>([]);

  useEffect(() => {
    // Check localStorage for dismissed notifications
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedAchievements') || '[]');
    
    // Simulate new achievements - only show if not previously dismissed
    const newAchievements: Achievement[] = [
      {
        id: 1,
        title: currentLanguage === 'fa' ? 'هفت روز پیاپی!' : '7 Day Streak!',
        description: currentLanguage === 'fa' ? 'شما ۷ روز پیاپی درس خوانده‌اید' : 'You studied for 7 consecutive days',
        type: 'streak',
        xpReward: 100,
        icon: '🔥',
        isNew: true
      },
      {
        id: 2,
        title: currentLanguage === 'fa' ? 'استاد واژگان' : 'Vocabulary Master',
        description: currentLanguage === 'fa' ? '۱۰۰ کلمه جدید یاد گرفتید' : 'Learned 100 new words',
        type: 'skill',
        xpReward: 150,
        icon: '📚',
        isNew: true
      }
    ].filter(achievement => !dismissedNotifications.includes(achievement.id));

    setNotifications(newAchievements);
  }, [currentLanguage]);

  const dismissNotification = (id: number) => {
    // Remove from current notifications
    setNotifications(prev => prev.filter(notif => notif.id !== id));
    
    // Save to localStorage so it doesn't appear again
    const dismissedNotifications = JSON.parse(localStorage.getItem('dismissedAchievements') || '[]');
    const updatedDismissed = [...dismissedNotifications, id];
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