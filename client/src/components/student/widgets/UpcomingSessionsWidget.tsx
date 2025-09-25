import { useQuery } from "@tanstack/react-query";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Video, MapPin, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { BaseWidgetProps, UpcomingSession, themeConfig } from "./types";
import { WidgetError } from "./WidgetError";
import { WidgetLoading } from "./WidgetLoading";
import { formatDistanceToNow, parseISO } from "date-fns";

interface UpcomingSessionsWidgetProps extends BaseWidgetProps {
  compact?: boolean;
}

export function UpcomingSessionsWidget({ 
  theme = 'learner',
  className,
  loading,
  error,
  onRefresh,
  compact = false
}: UpcomingSessionsWidgetProps) {
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
      />
    );
  }

  if (isLoadingState) {
    return <WidgetLoading height="h-40" />;
  }

  const handleJoinSession = (session: UpcomingSession) => {
    if (session.sessionUrl) {
      window.open(session.sessionUrl, '_blank');
    }
  };

  return (
    <MobileCard 
      variant="default"
      className={cn(compact && "p-3", className)}
      data-testid="upcoming-sessions-widget"
    >
      <MobileCardHeader className={cn(compact && "pb-2")}>
        <MobileCardTitle className={cn(
          "flex items-center gap-2",
          compact ? "text-sm" : "text-base"
        )}>
          <Calendar className={cn(
            compact ? "h-4 w-4" : "h-5 w-5", 
            currentTheme.text
          )} />
          Upcoming Sessions
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent className={cn(compact && "p-3 pt-0")}>
        <div className={cn(compact ? "space-y-2" : "space-y-3")}>
          {sessions.slice(0, 3).map((session) => (
            <div 
              key={session.id} 
              className={cn(
                "flex items-center justify-between border rounded-lg hover:bg-muted/50 transition-colors touch-target",
                compact ? "p-2" : "p-3"
              )}
              data-testid={`session-card-${session.id}`}
            >
              <div className="flex-1 min-w-0">
                <h4 className={cn(
                  "font-medium truncate",
                  compact ? "text-xs" : "text-sm"
                )} data-testid={`session-title-${session.id}`}>
                  {session.title}
                </h4>
                
                <div className="flex items-center gap-2 mt-1">
                  <User className={cn(
                    "text-muted-foreground",
                    compact ? "h-2.5 w-2.5" : "h-3 w-3"
                  )} />
                  <p className="text-xs text-muted-foreground" data-testid={`session-teacher-${session.id}`}>
                    {session.teacher}
                  </p>
                </div>
                
                <div className="flex items-center gap-2 mt-1">
                  <Clock className={cn(
                    "text-muted-foreground",
                    compact ? "h-2.5 w-2.5" : "h-3 w-3"
                  )} />
                  <p className="text-xs text-muted-foreground" data-testid={`session-time-${session.id}`}>
                    {session.scheduledAt ? formatDistanceToNow(parseISO(session.scheduledAt), { addSuffix: true }) : session.time}
                  </p>
                </div>

                {session.courseTitle && (
                  <p className="text-xs text-muted-foreground mt-1 truncate">
                    {session.courseTitle}
                  </p>
                )}
              </div>
              
              <div className="flex items-center gap-2">
                <Badge 
                  variant={session.type === 'online' ? 'default' : 'secondary'} 
                  className="text-xs"
                  data-testid={`session-type-${session.id}`}
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
                  <MobileButton 
                    size="xs" 
                    variant={session.type === 'online' ? 'default' : 'outline'}
                    onClick={() => handleJoinSession(session)}
                    disabled={!session.sessionUrl && session.type === 'online'}
                    data-testid={`button-join-${session.id}`}
                  >
                    {session.type === 'online' ? 'Join' : 'Info'}
                  </MobileButton>
                )}
              </div>
            </div>
          ))}
          
          {sessions.length === 0 && (
            <div className="text-center py-6" data-testid="no-sessions-message">
              <Calendar className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
              <p className="text-center text-muted-foreground text-sm">
                No upcoming sessions scheduled
              </p>
              <p className="text-xs text-muted-foreground mt-1">
                Book a session to get started!
              </p>
            </div>
          )}
          
          {sessions.length > 3 && (
            <div className="text-center pt-2 border-t border-border">
              <MobileButton 
                variant="ghost" 
                size="sm"
                data-testid="button-view-all-sessions"
              >
                View all sessions ({sessions.length})
              </MobileButton>
            </div>
          )}
        </div>
      </MobileCardContent>
    </MobileCard>
  );
}