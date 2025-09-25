import { useQuery } from "@tanstack/react-query";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { Trophy, Award, Star, Medal, Crown, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, Achievement, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";

interface AchievementWidgetProps extends BaseWidgetProps {
  compact?: boolean;
  maxDisplay?: number;
}

export function AchievementWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh,
  compact = false,
  maxDisplay = 5
}: AchievementWidgetProps) {
  // Fetch achievements data
  const { data: achievements = [], isLoading, error: fetchError } = useQuery<Achievement[]>({
    queryKey: ["/api/student/achievements"],
    queryFn: async () => {
      const response = await fetch("/api/student/achievements", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch achievements");
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
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

  const getAchievementIcon = (achievement: Achievement) => {
    switch (achievement.category) {
      case 'streak':
        return Star;
      case 'completion':
        return Target;
      case 'social':
        return Crown;
      default:
        return Award;
    }
  };

  const getAchievementColor = (achievement: Achievement) => {
    switch (achievement.category) {
      case 'streak':
        return 'text-orange-500';
      case 'completion':
        return 'text-green-500';
      case 'social':
        return 'text-purple-500';
      default:
        return 'text-yellow-500';
    }
  };

  return (
    <MobileCard 
      variant="default"
      className={className}
      data-testid="achievement-widget"
    >
      {!compact && (
        <MobileCardHeader>
          <MobileCardTitle className="flex items-center gap-2">
            <Trophy className={cn("h-5 w-5", currentTheme.text)} />
            Recent Achievements
          </MobileCardTitle>
        </MobileCardHeader>
      )}
      <MobileCardContent className={compact ? "p-3" : undefined}>
        {achievements.length > 0 ? (
          <div className={cn(
            "flex gap-3 overflow-x-auto pb-2",
            compact && "gap-2"
          )}>
            {achievements.slice(0, maxDisplay).map((achievement) => {
              const IconComponent = getAchievementIcon(achievement);
              const iconColor = getAchievementColor(achievement);
              
              return (
                <div 
                  key={achievement.id}
                  className={cn(
                    "flex-shrink-0 text-center p-3 border rounded-lg hover:bg-muted/50 transition-colors cursor-pointer",
                    compact ? "min-w-[70px] p-2" : "min-w-[80px]"
                  )}
                  title={achievement.description}
                  data-testid={`achievement-${achievement.id}`}
                >
                  <div className={cn(
                    "bg-muted rounded-full flex items-center justify-center mx-auto mb-2",
                    compact ? "w-8 h-8" : "w-10 h-10"
                  )}>
                    <IconComponent className={cn(
                      iconColor,
                      compact ? "h-4 w-4" : "h-5 w-5"
                    )} />
                  </div>
                  <p className={cn(
                    "font-medium truncate",
                    compact ? "text-xs" : "text-xs"
                  )} data-testid={`achievement-title-${achievement.id}`}>
                    {achievement.title}
                  </p>
                  {!compact && achievement.unlockedAt && (
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(achievement.unlockedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6" data-testid="no-achievements-message">
            <Trophy className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
            <p className="text-center text-muted-foreground text-sm">
              No achievements yet
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              Keep learning to unlock achievements!
            </p>
          </div>
        )}
        
        {achievements.length > maxDisplay && !compact && (
          <div className="text-center pt-2 border-t border-border">
            <p className="text-xs text-muted-foreground">
              Showing {maxDisplay} of {achievements.length} achievements
            </p>
          </div>
        )}
      </MobileCardContent>
    </MobileCard>
  );
}