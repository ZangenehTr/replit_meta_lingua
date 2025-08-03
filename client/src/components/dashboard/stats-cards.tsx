import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp, Coins, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';

interface DashboardStats {
  streak: number;
  progress: number;
  credits: number;
  nextSession: string | null;
}

export function StatsCards() {
  const { t } = useTranslation(['student', 'common']);
  const { data: dashboardData } = useQuery<{ stats: DashboardStats }>({
    queryKey: ["/api/dashboard"],
  });

  const stats = dashboardData?.stats;

  const formatNextSession = (nextSession: string | null) => {
    if (!nextSession) return 'No upcoming sessions';
    
    const sessionTime = new Date(nextSession);
    const now = new Date();
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4 md:gap-6 mb-6 md:mb-8">
      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">Learning Streak</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.streak || 0} <span className="text-sm sm:text-base">days</span></p>
            </div>
            <div className="p-2 sm:p-3 bg-green-100 dark:bg-green-900/20 rounded-lg ml-2">
              <Flame className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">Course Progress</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.progress || 0}%</p>
            </div>
            <div className="p-2 sm:p-3 bg-primary/10 rounded-lg ml-2">
              <TrendingUp className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">Available Credits</p>
              <p className="text-lg sm:text-xl md:text-2xl font-bold">{stats?.credits || 0}</p>
            </div>
            <div className="p-2 sm:p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg ml-2">
              <Coins className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-3 sm:p-4 md:p-6">
          <div className="flex items-center justify-between">
            <div className="min-w-0 flex-1">
              <p className="text-muted-foreground text-xs sm:text-sm font-medium truncate">Next Session</p>
              <p className="text-sm sm:text-lg md:text-2xl font-bold truncate">{formatNextSession(stats?.nextSession || null)}</p>
            </div>
            <div className="p-2 sm:p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg ml-2">
              <Clock className="h-4 w-4 sm:h-5 sm:w-5 md:h-6 md:w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
