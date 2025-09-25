import { useQuery } from "@tanstack/react-query";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, Video, MapPin, User, Phone } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, UpcomingSession, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";
import { ExpandableList } from "@/components/ui/expandable-list";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { formatDistanceToNow, parseISO, format } from "date-fns";

interface ProgressiveSessionsWidgetProps extends BaseWidgetProps {
  compact?: boolean;
  progressive?: boolean;
  initialVisible?: number;
}

export function ProgressiveSessionsWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh,
  compact = false,
  progressive = true,
  initialVisible = 3
}: ProgressiveSessionsWidgetProps) {
  // Fetch upcoming sessions
  const { data: sessions = [], isLoading, error: fetchError } = useQuery<UpcomingSession[]>({
    queryKey: ["/api/student/upcoming-sessions"],
    queryFn: async () => {
      const response = await fetch("/api/student/upcoming-sessions", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch upcoming sessions");
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
    return <WidgetLoading height={compact ? "h-32" : "h-40"} />;
  }

  const handleJoinSession = (session: UpcomingSession) => {
    if (session.sessionUrl) {
      window.open(session.sessionUrl, '_blank');
    }
  };

  const getSessionStatusColor = (session: UpcomingSession) => {
    if (session.status === 'in_progress') return 'bg-green-100 text-green-700';
    if (session.status === 'completed') return 'bg-gray-100 text-gray-700';
    if (session.status === 'cancelled') return 'bg-red-100 text-red-700';
    
    // Check if session is starting soon (within 15 minutes)
    if (session.scheduledAt) {
      const sessionTime = parseISO(session.scheduledAt);
      const now = new Date();
      const minutesUntil = (sessionTime.getTime() - now.getTime()) / (1000 * 60);
      if (minutesUntil <= 15 && minutesUntil > 0) {
        return 'bg-orange-100 text-orange-700';
      }
    }
    
    return 'bg-blue-100 text-blue-700';
  };

  const renderSessionItem = (session: UpcomingSession, index: number) => {
    const isStartingSoon = session.scheduledAt && 
      (parseISO(session.scheduledAt).getTime() - new Date().getTime()) / (1000 * 60) <= 15;

    return (
      <ExpandableCard
        key={session.id}
        title={session.title}
        description={session.courseTitle}
        compact={compact}
        className={cn(
          "transition-all duration-200",
          isStartingSoon && "ring-2 ring-orange-200 bg-orange-50/30"
        )}
        icon={session.type === 'online' ? Video : MapPin}
        badge={
          <div className="flex items-center gap-2">
            <Badge 
              variant={session.type === 'online' ? 'default' : 'secondary'} 
              className={cn("text-xs", getSessionStatusColor(session))}
            >
              <div className="flex items-center gap-1">
                {session.type === 'online' ? (
                  <Video className="h-3 w-3" />
                ) : (
                  <MapPin className="h-3 w-3" />
                )}
                {session.type}
              </div>
            </Badge>
            
            {session.status === 'scheduled' && (
              <Button 
                size="sm" 
                variant={session.type === 'online' ? 'default' : 'outline'}
                onClick={() => handleJoinSession(session)}
                disabled={!session.sessionUrl && session.type === 'online'}
                className="touch-target"
              >
                {session.type === 'online' ? 'Join' : 'Info'}
              </Button>
            )}
          </div>
        }
        data-testid={`session-card-${session.id}`}
        expandedContent={
          <div className="space-y-4">
            {/* Teacher Info */}
            <div className="flex items-center gap-3 p-3 bg-muted/30 rounded-lg">
              <User className="h-8 w-8 text-muted-foreground" />
              <div>
                <p className="font-medium">{session.teacher}</p>
                <p className="text-sm text-muted-foreground">Instructor</p>
              </div>
            </div>

            {/* Session Details */}
            <div className="space-y-2">
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <span>
                  {session.scheduledAt 
                    ? format(parseISO(session.scheduledAt), 'PPP p')
                    : session.time
                  }
                </span>
              </div>
              
              {session.duration && (
                <div className="flex items-center gap-2 text-sm">
                  <Clock className="h-4 w-4 text-muted-foreground" />
                  <span>{session.duration} minutes</span>
                </div>
              )}
              
              {session.type === 'online' && session.sessionUrl && (
                <div className="flex items-center gap-2 text-sm">
                  <Video className="h-4 w-4 text-muted-foreground" />
                  <span>Online session link available</span>
                </div>
              )}
            </div>

            {/* Quick Actions */}
            <div className="flex gap-2 pt-2 border-t">
              {session.type === 'online' && session.sessionUrl && (
                <Button
                  size="sm"
                  onClick={() => handleJoinSession(session)}
                  className="flex-1 touch-target"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              )}
              <Button
                size="sm"
                variant="outline"
                className="flex-1 touch-target"
              >
                <Phone className="h-4 w-4 mr-2" />
                Contact Teacher
              </Button>
            </div>
          </div>
        }
      >
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <User className={cn(
              "text-muted-foreground",
              compact ? "h-3 w-3" : "h-4 w-4"
            )} />
            <p className={cn(
              "text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}>
              {session.teacher}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Clock className={cn(
              "text-muted-foreground",
              compact ? "h-3 w-3" : "h-4 w-4"
            )} />
            <p className={cn(
              "text-muted-foreground",
              compact ? "text-xs" : "text-sm",
              isStartingSoon && "text-orange-600 font-medium"
            )}>
              {session.scheduledAt 
                ? formatDistanceToNow(parseISO(session.scheduledAt), { addSuffix: true })
                : session.time
              }
              {isStartingSoon && " (Starting Soon!)"}
            </p>
          </div>
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
        <div className="flex gap-2">
          <div className="h-6 w-16 bg-muted rounded" />
          <div className="h-6 w-12 bg-muted rounded" />
        </div>
      </div>
      <div className="h-3 w-24 bg-muted rounded" />
      <div className="h-3 w-40 bg-muted rounded" />
    </div>
  );

  if (!progressive) {
    // Fallback to original card layout
    return (
      <ExpandableCard
        title="Upcoming Sessions"
        icon={Calendar}
        compact={compact}
        className={className}
        data-testid="upcoming-sessions-widget"
      >
        <div className={cn(compact ? "space-y-2" : "space-y-3")}>
          {sessions.slice(0, initialVisible).map((session, index) => 
            renderSessionItem(session, index)
          )}
          
          {sessions.length === 0 && (
            <div className="text-center py-6">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-center text-muted-foreground text-sm">
                No upcoming sessions scheduled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Book a session to get started!
              </p>
            </div>
          )}
        </div>
      </ExpandableCard>
    );
  }

  return (
    <div className={className} data-testid="progressive-sessions-widget">
      <div className="flex items-center gap-2 mb-4">
        <Calendar className={cn(
          compact ? "h-4 w-4" : "h-5 w-5", 
          currentTheme.text
        )} />
        <h3 className={cn(
          "font-semibold",
          compact ? "text-sm" : "text-base"
        )}>
          Upcoming Sessions
        </h3>
      </div>

      {sessions.length === 0 ? (
        <div className="text-center py-8">
          <Calendar className="h-12 w-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No upcoming sessions scheduled</p>
          <p className="text-xs text-muted-foreground mt-1">
            Book a session to get started!
          </p>
        </div>
      ) : (
        <ExpandableList
          items={sessions}
          initialVisibleCount={initialVisible}
          renderItem={renderSessionItem}
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