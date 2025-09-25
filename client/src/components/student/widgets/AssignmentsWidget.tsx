import { useQuery } from "@tanstack/react-query";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { Badge } from "@/components/ui/badge";
import { Target, Calendar, CheckCircle2, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, Assignment, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";
import { formatDistanceToNow, parseISO, isPast } from "date-fns";

export function AssignmentsWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh 
}: BaseWidgetProps) {
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
      />
    );
  }

  if (isLoadingState) {
    return <WidgetLoading height="h-40" />;
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

  return (
    <MobileCard 
      variant="default"
      className={className}
      data-testid="assignments-widget"
    >
      <MobileCardHeader>
        <MobileCardTitle className="flex items-center gap-2">
          <Target className={cn("h-5 w-5", currentTheme.text)} />
          Recent Assignments
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent>
        <div className="space-y-3">
          {sortedAssignments.slice(0, 3).map((assignment) => {
            const IconComponent = getAssignmentIcon(assignment);
            const dueDateColor = getDueDateColor(assignment.dueDate, assignment.status);
            const isOverdue = assignment.status === 'pending' && isPast(parseISO(assignment.dueDate));
            
            return (
              <div 
                key={assignment.id} 
                className={cn(
                  "flex items-center justify-between p-3 border rounded-lg transition-colors",
                  isOverdue && "border-red-200 bg-red-50/50",
                  !isOverdue && "hover:bg-muted/50"
                )}
                data-testid={`assignment-card-${assignment.id}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <IconComponent className={cn(
                      "h-4 w-4",
                      assignment.status === 'graded' ? "text-green-600" :
                      assignment.status === 'submitted' ? "text-blue-600" :
                      isOverdue ? "text-red-600" : "text-orange-600"
                    )} />
                    <h4 className="font-medium text-sm truncate" data-testid={`assignment-title-${assignment.id}`}>
                      {assignment.title}
                    </h4>
                  </div>
                  
                  {assignment.courseTitle && (
                    <p className="text-xs text-muted-foreground mb-1 truncate">
                      {assignment.courseTitle}
                    </p>
                  )}
                  
                  <div className="flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-muted-foreground" />
                    <p className={cn("text-xs", dueDateColor)} data-testid={`assignment-due-${assignment.id}`}>
                      Due {formatDistanceToNow(parseISO(assignment.dueDate), { addSuffix: true })}
                    </p>
                    {isOverdue && (
                      <span className="text-xs text-red-600 font-medium ml-1">
                        (Overdue)
                      </span>
                    )}
                  </div>
                </div>
                
                <div className="flex items-center gap-2">
                  <Badge 
                    variant={getStatusVariant(assignment.status)}
                    className={cn(
                      "text-xs",
                      assignment.status === 'graded' && "bg-green-100 text-green-700",
                      assignment.status === 'submitted' && "bg-blue-100 text-blue-700",
                      assignment.status === 'pending' && isOverdue && "bg-red-100 text-red-700"
                    )}
                    data-testid={`assignment-status-${assignment.id}`}
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
                      data-testid={`assignment-score-${assignment.id}`}
                    >
                      {assignment.score}%
                    </span>
                  )}
                </div>
              </div>
            );
          })}
          
          {assignments.length === 0 && (
            <div className="text-center py-6" data-testid="no-assignments-message">
              <Target className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-center text-muted-foreground text-sm">
                No recent assignments
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                New assignments will appear here
              </p>
            </div>
          )}
          
          {assignments.length > 3 && (
            <div className="text-center pt-2 border-t border-border">
              <p className="text-xs text-muted-foreground">
                Showing 3 of {assignments.length} assignments
              </p>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}