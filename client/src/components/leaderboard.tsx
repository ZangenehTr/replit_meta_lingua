import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Trophy, Medal, Crown, Star, Zap } from 'lucide-react';
import { useLanguage } from '@/hooks/use-language';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/hooks/use-auth';

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
  const { language, isRTL, t } = useLanguage();
  const { user } = useAuth();

  // Fetch leaderboard data from API
  const { data: leaderboardData = [], isLoading } = useQuery<LeaderboardUser[]>({
    queryKey: ['/api/gamification/leaderboard'],
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const currentUser = user ? leaderboardData.find(u => u.id === user.id) : null;

  if (isLoading) {
    return (
      <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
        <CardHeader className="pb-2">
          <CardTitle className="text-lg flex items-center gap-2">
            <Trophy className="h-5 w-5 text-yellow-500" />
            {t('leaderboard')}
          </CardTitle>
        </CardHeader>
        <div className="space-y-2">
          {[...Array(5)].map((_, i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="p-3">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 bg-muted rounded" />
                  <div className="w-10 h-10 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="w-24 h-4 bg-muted rounded" />
                    <div className="w-16 h-3 bg-muted rounded" />
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`space-y-4 ${isRTL ? 'rtl' : 'ltr'}`}>
      <CardHeader className="pb-2">
        <CardTitle className="text-lg flex items-center gap-2">
          <Trophy className="h-5 w-5 text-yellow-500" />
          {t('leaderboard')}
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
                          {t('you')}
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Star className="h-3 w-3" />
                        {t('level')} {user.level}
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
                      {t('streak')}
                    </div>
                    <div className="text-sm font-semibold text-orange-600">
                      {user.streakDays} {t('days')}
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