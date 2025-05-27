import { Card, CardContent } from "@/components/ui/card";
import { Flame, TrendingUp, Coins, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface DashboardStats {
  streak: number;
  progress: number;
  credits: number;
  nextSession: string | null;
}

export function StatsCards() {
  const { data: dashboardData } = useQuery<{ stats: DashboardStats }>({
    queryKey: ["/api/dashboard"],
  });

  const stats = dashboardData?.stats;

  const formatNextSession = (nextSession: string | null) => {
    if (!nextSession) return "No sessions";
    
    const sessionTime = new Date(nextSession);
    const now = new Date();
    const diffMs = sessionTime.getTime() - now.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    
    return `${diffHours}h ${diffMinutes}m`;
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Learning Streak</p>
              <p className="text-2xl font-bold">{stats?.streak || 0} days</p>
            </div>
            <div className="p-3 bg-green-100 dark:bg-green-900/20 rounded-lg">
              <Flame className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Course Progress</p>
              <p className="text-2xl font-bold">{stats?.progress || 0}%</p>
            </div>
            <div className="p-3 bg-primary/10 rounded-lg">
              <TrendingUp className="h-6 w-6 text-primary" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Available Credits</p>
              <p className="text-2xl font-bold">{stats?.credits || 0}</p>
            </div>
            <div className="p-3 bg-yellow-100 dark:bg-yellow-900/20 rounded-lg">
              <Coins className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-muted-foreground text-sm font-medium">Next Session</p>
              <p className="text-2xl font-bold">{formatNextSession(stats?.nextSession || null)}</p>
            </div>
            <div className="p-3 bg-purple-100 dark:bg-purple-900/20 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
