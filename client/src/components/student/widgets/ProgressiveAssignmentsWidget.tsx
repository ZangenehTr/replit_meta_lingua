import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, Assignment, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";
import { ExpandableList } from "@/components/ui/expandable-list";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { formatDistanceToNow, parseISO, isPast } from "date-fns";

interface ProgressiveAssignmentsWidgetProps extends BaseWidgetProps {
  compact?: boolean;
  progressive?: boolean;
  initialVisible?: number;
}

export function ProgressiveAssignmentsWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh,
  compact = false,
  progressive = true,
  initialVisible = 3
}: ProgressiveAssignmentsWidgetProps) {
  // Fetch assignments data
  const { data: assignments = [], isLoading, error: fetchError } = useQuery<Assignment[]>({
    queryKey: ["/api/student/assignments"],
    queryFn: async () => {
      const response = await fetch("/api/student/assignments", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch assignments");
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
        compact={compact}
      />
    );
  }

  if (isLoadingState) {
    return <WidgetLoading height={compact ? "h-32" : "h-40"} />;
  }

  const getAssignmentIcon = (assignment: Assignment) => {
    if (assignment.status === 'graded') return CheckCircle2;
    if (assignment.status === 'submitted') return Clock;
    if (isPast(parseISO(assignment.dueDate))) return AlertTriangle;
    return Target;
  };

  const getStatusVariant = (status: Assignment['status']) => {
    switch (status) {
      case 'graded':
        return 'default';
      case 'submitted': 
        return 'secondary';
      default:
        return 'outline';
    }
  };

  const getDueDateColor = (dueDate: string, status: Assignment['status']) => {
    if (status === 'graded' || status === 'submitted') return 'text-muted-foreground';
    
    const due = parseISO(dueDate);
    const now = new Date();
    const hoursUntilDue = (due.getTime() - now.getTime()) / (1000 * 60 * 60);
    
    if (isPast(due)) return 'text-red-600';
    if (hoursUntilDue < 24) return 'text-orange-600';
    if (hoursUntilDue < 72) return 'text-yellow-600';
    return 'text-muted-foreground';
  };

  // Sort assignments by priority: pending overdue, pending soon due, submitted, graded
  const sortedAssignments = [...assignments].sort((a, b) => {
    const statusOrder = { pending: 0, submitted: 1, graded: 2 };
    const aIsPastDue = a.status === 'pending' && isPast(parseISO(a.dueDate));
    const bIsPastDue = b.status === 'pending' && isPast(parseISO(b.dueDate));
    
    if (aIsPastDue && !bIsPastDue) return -1;
    if (bIsPastDue && !aIsPastDue) return 1;
    if (a.status !== b.status) return statusOrder[a.status] - statusOrder[b.status];
    return new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime();
  });

  const renderAssignmentItem = (assignment: Assignment, index: number) => {
    const IconComponent = getAssignmentIcon(assignment);
    const dueDateColor = getDueDateColor(assignment.dueDate, assignment.status);
    const isOverdue = assignment.status === 'pending' && isPast(parseISO(assignment.dueDate));
    
    return (
      <ExpandableCard
        key={assignment.id}
        title={assignment.title}
        description={assignment.courseTitle}
        compact={compact}
        className={cn(
          isOverdue && "border-red-200 bg-red-50/50",
          !isOverdue && "hover:bg-muted/50"
        )}
        icon={IconComponent}
        badge={
          <div className="flex items-center gap-2">
            <Badge 
              variant={getStatusVariant(assignment.status)}
              className={cn(
                "text-xs",
                assignment.status === 'graded' && "bg-green-100 text-green-700",
                assignment.status === 'submitted' && "bg-blue-100 text-blue-700",
                assignment.status === 'pending' && isOverdue && "bg-red-100 text-red-700"
              )}
            >
              {assignment.status}
            </Badge>
            
            {assignment.status === 'graded' && assignment.score !== undefined && (
              <span 
                className={cn(
                  "text-xs font-medium",
                  assignment.score >= 80 ? "text-green-600" :
                  assignment.score >= 60 ? "text-yellow-600" : "text-red-600"
                )}
              >
                {assignment.score}%
              </span>
            )}
          </div>
        }
        data-testid={`assignment-card-${assignment.id}`}
        expandedContent={
          <div className="space-y-3">
            {assignment.description && (
              <div>
                <h4 className="text-sm font-medium mb-1">Description</h4>
                <p className="text-sm text-muted-foreground">{assignment.description}</p>
              </div>
            )}
            {assignment.feedback && assignment.status === 'graded' && (
              <div>
                <h4 className="text-sm font-medium mb-1">Feedback</h4>
                <p className="text-sm text-muted-foreground">{assignment.feedback}</p>
              </div>
            )}
            <div className="flex justify-between items-center text-xs text-muted-foreground">
              <span>Priority: {assignment.priority || 'medium'}</span>
              <span>Course: {assignment.courseTitle}</span>
            </div>
          </div>
        }
      >
        <div className="flex items-center gap-2">
          <Calendar className={cn(
            compact ? "h-3 w-3" : "h-4 w-4",
            "text-muted-foreground"
          )} />
          <p className={cn("text-sm", dueDateColor)}>
            Due {formatDistanceToNow(parseISO(assignment.dueDate), { addSuffix: true })}
            {isOverdue && (
              <span className="text-red-600 font-medium ml-1">
                (Overdue)
              </span>
            )}
          </p>
        </div>
      </ExpandableCard>
    );
  };

  const renderSkeletonItem = () => (
    <div className="border rounded-lg p-4 space-y-3 animate-pulse">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="h-4 w-4 bg-muted rounded" />
          <div className="h-4 w-32 bg-muted rounded" />
        </div>
        <div className="h-6 w-16 bg-muted rounded" />
      </div>
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-3 w-40 bg-muted rounded" />
    </div>
  );

  if (!progressive) {
    // Fallback to original card layout
    return (
      <ExpandableCard
        title="Recent Assignments"
        icon={Target}
        compact={compact}
        className={className}
        data-testid="assignments-widget"
      >
        <div className={cn(compact ? "space-y-2" : "space-y-3")}>
          {sortedAssignments.slice(0, initialVisible).map((assignment, index) => 
            renderAssignmentItem(assignment, index)
          )}
          
          {assignments.length === 0 && (
            <div className="text-center py-6">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-center text-muted-foreground text-sm">
                No recent assignments
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New assignments will appear here
              </p>
            </div>
          )}
        </div>
      </ExpandableCard>
    );
  }

  return (
    <div className={className} data-testid="progressive-assignments-widget">
      <div className="flex items-center gap-2 mb-4">
        <Target className={cn(
          compact ? "h-4 w-4" : "h-5 w-5", 
          currentTheme.text
        )} />
        <h3 className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-base"
        )}>
          Recent Assignments
        </h3>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-8">
          <Target className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No recent assignments</p>
          <p className="text-xs text-muted-foreground mt-1">
            New assignments will appear here
          </p>
        </div>
      ) : (
        <ExpandableList
          items={sortedAssignments}
          initialVisibleCount={initialVisible}
          renderItem={renderAssignmentItem}
          renderSkeleton={renderSkeletonItem}
          variant="default"
          compact={compact}
          showCounter={true}
          animationDuration={300}
          animationStagger={100}
          loading={isLoadingState}
          loadingItems={initialVisible}
        />
      )}
    </div>
  );
}