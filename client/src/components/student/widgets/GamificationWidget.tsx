import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { MobileCard, MobileCardContent } from "@/components/ui/mobile-card";
import { Flame, Zap, Trophy, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, StudentStats, WidgetTheme, themeConfig } from "./types";
import { WidgetError, WidgetLoading } from "./";

interface GamificationWidgetProps extends BaseWidgetProps {
  compact?: boolean;
}

export function GamificationWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh,
  compact = false 
}: GamificationWidgetProps) {
  // Fetch student gamification stats
  const { data: stats, isLoading, error: fetchError } = useQuery<StudentStats>({
    queryKey: ["/api/student/gamification-stats"],
    queryFn: async () => {
      const response = await fetch("/api/student/gamification-stats", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch gamification stats");
      return response.json();
    },
    staleTime: 2 * 60 * 1000, // 2 minutes
    enabled: !loading && !error,
  });

  const currentTheme = themeConfig[theme];
  const isLoadingState = loading || isLoading;
  const errorState = error || fetchError?.message;

  if (errorState) {
    return (
      <WidgetError 
        message={errorState}
        onRetry={onRefresh}
        compact={compact}
      />
    );
  }

  if (isLoadingState) {
    return <WidgetLoading height={compact ? "h-24" : "h-32"} />;
  }

  const level = stats?.currentLevel || "Level 1";
  const xp = stats?.xp || 0;
  const nextLevelXp = stats?.nextLevelXp || 1000;
  const streak = stats?.streakDays || stats?.streak || 0;
  const progress = nextLevelXp > 0 ? (xp / nextLevelXp) * 100 : 0;

  return (
    <MobileCard 
      variant="elevated" 
      role="student" 
      className={cn(
        `bg-gradient-to-br ${currentTheme.card}`,
        compact && "p-3",
        className
      )}
      data-testid="gamification-widget"
    >
      <MobileCardContent className={compact ? "space-y-2" : "space-y-4"}>
        <div className="space-y-3">
          {/* Level and XP */}
          <div className="flex items-center justify-between">
            <div className="flex-1">
              <h3 className={cn(
                "font-bold",
                compact ? "text-lg" : "text-xl",
                currentTheme.text
              )} data-testid="text-current-level">
                {level}
              </h3>
              <p className="text-sm text-muted-foreground" data-testid="text-xp-progress">
                {xp.toLocaleString()} / {nextLevelXp.toLocaleString()} XP
              </p>
            </div>
            
            {/* Streak Display */}
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <div className="text-center">
                <span className="font-bold text-orange-600" data-testid="text-streak-count">
                  {streak}
                </span>
                <p className="text-xs text-muted-foreground">
                  {streak === 1 ? 'day' : 'days'}
                </p>
              </div>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress 
              value={progress} 
              className="h-2"
              data-testid="progress-xp"
            />
            <div className="flex justify-between items-center">
              <p className="text-xs text-center text-muted-foreground">
                {Math.max(0, nextLevelXp - xp).toLocaleString()} XP to next level
              </p>
              {progress >= 80 && (
                <div className="flex items-center text-xs text-yellow-600">
                  <Star className="h-3 w-3 mr-1" />
                  <span>Almost there!</span>
                </div>
              )}
            </div>
          </div>

          {/* Achievements Preview - only in non-compact mode */}
          {!compact && (
            <div className="flex items-center justify-between pt-2 border-t border-white/20">
              <div className="flex items-center gap-2">
                <Trophy className="h-4 w-4 text-yellow-500" />
                <span className="text-sm text-muted-foreground">
                  {stats?.totalCredits || 0} total credits
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-blue-500" />
                <span className="text-sm text-muted-foreground">
                  {stats?.memberTier || 'bronze'} member
                </span>
              </div>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}