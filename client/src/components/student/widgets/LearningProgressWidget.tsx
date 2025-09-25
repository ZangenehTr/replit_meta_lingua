import { useQuery } from "@tanstack/react-query";
import { Progress } from "@/components/ui/progress";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { TrendingUp, CheckCircle, Target } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, LearningProgress, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";

export function LearningProgressWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh 
}: BaseWidgetProps) {
  // Fetch learning progress data
  const { data: progress, isLoading, error: fetchError } = useQuery<LearningProgress>({
    queryKey: ["/api/student/learning-progress"],
    queryFn: async () => {
      const response = await fetch("/api/student/learning-progress", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch learning progress");
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
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
      />
    );
  }

  if (isLoadingState) {
    return <WidgetLoading height="h-36" />;
  }

  const completedLessons = progress?.completedLessons || 0;
  const totalLessons = progress?.totalLessons || 0;
  const weeklyGoal = progress?.weeklyGoal || 0;
  const weeklyProgress = progress?.weeklyProgress || 0;
  
  const overallProgress = totalLessons > 0 ? (completedLessons / totalLessons) * 100 : 0;
  const weeklyProgressPercent = weeklyGoal > 0 ? (weeklyProgress / weeklyGoal) * 100 : 0;

  return (
    <MobileCard 
      variant="default"
      className={className}
      data-testid="learning-progress-widget"
    >
      <MobileCardHeader>
        <MobileCardTitle className="flex items-center gap-2">
          <TrendingUp className={cn("h-5 w-5", currentTheme.text)} />
          Learning Progress
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Course Progress</span>
              <span data-testid="text-course-progress">
                {completedLessons}/{totalLessons} lessons
              </span>
            </div>
            <Progress 
              value={overallProgress} 
              className="h-2"
              data-testid="progress-course"
            />
            {progress?.currentCourse && (
              <p className="text-xs text-muted-foreground mt-1">
                Current: {progress.currentCourse}
              </p>
            )}
          </div>

          {/* Weekly Goal */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <div className="flex items-center gap-1">
                <Target className="h-3 w-3" />
                <span>Weekly Goal</span>
              </div>
              <span data-testid="text-weekly-progress">
                {weeklyProgress}/{weeklyGoal} lessons
              </span>
            </div>
            <Progress 
              value={weeklyProgressPercent} 
              className="h-2"
              data-testid="progress-weekly"
            />
            {weeklyProgressPercent >= 100 && (
              <div className="flex items-center mt-2 text-green-600" data-testid="weekly-goal-achieved">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Goal achieved!</span>
              </div>
            )}
            {progress?.nextMilestone && (
              <p className="text-xs text-muted-foreground mt-1">
                Next milestone: {progress.nextMilestone}
              </p>
            )}
          </div>

          {/* Progress Summary */}
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Completed</p>
              <p className="text-sm font-medium" data-testid="text-completion-rate">
                {Math.round(overallProgress)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">This Week</p>
              <p className="text-sm font-medium" data-testid="text-weekly-rate">
                {Math.round(weeklyProgressPercent)}%
              </p>
            </div>
            <div className="text-center">
              <p className="text-xs text-muted-foreground">Remaining</p>
              <p className="text-sm font-medium" data-testid="text-lessons-remaining">
                {Math.max(0, totalLessons - completedLessons)}
              </p>
            </div>
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}