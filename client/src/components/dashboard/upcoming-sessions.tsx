import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

interface Session {
  id: number;
  title: string;
  scheduledAt: string;
  tutorName: string;
  tutorAvatar: string;
}

export function UpcomingSessions() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  const { data: sessions, isLoading } = useQuery<Session[]>({
    queryKey: ["/api/sessions/upcoming"],
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await apiRequest("POST", `/api/sessions/${sessionId}/join`, {});
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: "Session Starting",
        description: "Connecting to your live session...",
      });
      // In a real implementation, this would open the LiveKit session
      console.log("LiveKit token:", data.token);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to join session. Please try again.",
        variant: "destructive",
      });
    },
  });

  const formatSessionTime = (scheduledAt: string) => {
    const date = new Date(scheduledAt);
    const now = new Date();
    const isToday = date.toDateString() === now.toDateString();
    
    if (isToday) {
      return `Today, ${date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}`;
    }
    
    return date.toLocaleDateString([], { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t('upcomingSessions')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg animate-pulse">
                <div className="w-12 h-12 bg-muted rounded-full" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-muted rounded w-3/4" />
                  <div className="h-3 bg-muted rounded w-1/2" />
                </div>
                <div className="h-8 w-16 bg-muted rounded" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t('upcomingSessions')}</CardTitle>
      </CardHeader>
      <CardContent>
        {!sessions || sessions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <p>{t('noUpcomingSessions')}</p>
          </div>
        ) : (
          <div className="space-y-4">
            {sessions.map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between p-4 bg-muted/50 rounded-lg"
              >
                <div className="flex items-center space-x-4">
                  <Avatar>
                    <AvatarImage src={session.tutorAvatar} alt={session.tutorName} />
                    <AvatarFallback>
                      {session.tutorName.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4 className="font-medium">{session.title}</h4>
                    <p className="text-sm text-muted-foreground">with {session.tutorName}</p>
                    <p className="text-sm text-orange-600">
                      {formatSessionTime(session.scheduledAt)}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button variant="outline" size="sm">
                    Reschedule
                  </Button>
                  <Button 
                    size="sm"
                    onClick={() => joinSessionMutation.mutate(session.id)}
                    disabled={joinSessionMutation.isPending}
                  >
                    {joinSessionMutation.isPending ? "Joining..." : t('joinNow')}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
