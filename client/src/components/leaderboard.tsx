import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Crown, Star, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';

interface LeaderboardUser {
  id: number;
  name: string;
  avatar: string;
  xp: number;
  level: number;
  streakDays: number;
  country: string;
  rank: number;
}

const getRankIcon = (rank: number) => {
  switch (rank) {
    case 1: return <Crown className="h-5 w-5 text-yellow-500" />;
    case 2: return <Trophy className="h-5 w-5 text-gray-400" />;
    case 3: return <Medal className="h-5 w-5 text-amber-600" />;
    default: return <span className="text-sm font-bold text-muted-foreground">#{rank}</span>;
  }
};

const getRankBadgeColor = (rank: number) => {
  switch (rank) {
    case 1: return 'bg-gradient-to-r from-yellow-400 to-yellow-600 text-white';
    case 2: return 'bg-gradient-to-r from-gray-300 to-gray-500 text-white';
    case 3: return 'bg-gradient-to-r from-amber-400 to-amber-600 text-white';
    default: return 'bg-muted text-muted-foreground';
  }
};

export function Leaderboard() {
  const { currentLanguage, isRTL } = useLanguage();

  const leaderboardData: LeaderboardUser[] = [
    {
      id: 1,
      name: currentLanguage === 'fa' ? 'احمد رضایی' : 'Ahmad Rezaei',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face',
      xp: 2450,
      level: 12,
      streakDays: 15,
      country: 'IR',
      rank: 4
    },
    {
      id: 2,
      name: currentLanguage === 'fa' ? 'سارا حسینی' : 'Sara Hosseini',
      avatar: 'https://images.unsplash.com/photo-1494790108755-2616b612b786?w=150&h=150&fit=crop&crop=face',
      xp: 3200,
      level: 15,
      streakDays: 28,
      country: 'IR',
      rank: 1
    },
    {
      id: 3,
      name: currentLanguage === 'fa' ? 'علی محمدی' : 'Ali Mohammadi',
      avatar: 'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=150&h=150&fit=crop&crop=face',
      xp: 2980,
      level: 14,
      streakDays: 22,
      country: 'IR',
      rank: 2
    },
    {
      id: 4,
      name: currentLanguage === 'fa' ? 'مریم کریمی' : 'Maryam Karimi',
      avatar: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150&h=150&fit=crop&crop=face',
      xp: 2750,
      level: 13,
      streakDays: 19,
      country: 'IR',
      rank: 3
    },
    {
      id: 5,
      name: currentLanguage === 'fa' ? 'رضا احمدی' : 'Reza Ahmadi',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150&h=150&fit=crop&crop=face',
      xp: 2200,
      level: 11,
      streakDays: 12,
      country: 'IR',
      rank: 5
    }
  ];

  const currentUser = leaderboardData.find(user => user.name.includes('احمد') || user.name.includes('Ahmad'));

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {currentLanguage === 'fa' ? 'جدول امتیازات' : 'Leaderboard'}
        </CardTitle>
      </CardHeader>

      <div className="space-y-2">
        {leaderboardData.sort((a, b) => a.rank - b.rank).map((user, index) => (
          <Card 
            key={user.id} 
            className={`transition-all duration-200 ${
              user.id === currentUser?.id 
                ? 'ring-2 ring-primary bg-primary/5' 
                : 'hover:shadow-md'
            }`}
          >
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0">
                    {getRankIcon(user.rank)}
                  </div>
                  
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={user.avatar} alt={user.name} />
                    <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                  </Avatar>
                  
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium truncate">{user.name}</p>
                      {user.id === currentUser?.id && (
                        <Badge variant="secondary" className="text-xs">
                          {currentLanguage === 'fa' ? 'شما' : 'You'}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {currentLanguage === 'fa' ? `سطح ${user.level}` : `Level ${user.level}`}
                      </span>
                      <span className="flex items-center gap-1">
                        <Zap className="h-3 w-3" />
                        {user.xp.toLocaleString()} XP
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <div className="text-right">
                    <div className="text-xs text-muted-foreground">
                      {currentLanguage === 'fa' ? 'روزهای پیاپی' : 'Streak'}
                    </div>
                    <div className="text-sm font-semibold text-orange-600">
                      {user.streakDays} {currentLanguage === 'fa' ? 'روز' : 'days'}
                    </div>
                  </div>
                  
                  <Badge className={`${getRankBadgeColor(user.rank)} min-w-0`}>
                    #{user.rank}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}