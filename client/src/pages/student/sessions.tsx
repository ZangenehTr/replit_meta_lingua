import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Video, Calendar, Clock, User, MapPin, ExternalLink, Phone, MessageSquare } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";

interface Session {
  id: number;
  title: string;
  description: string;
  scheduledAt: Date;
  duration: number;
  status: string;
  sessionUrl: string;
  tutorId: number;
  courseId: number;
  notes: string;
  tutor: {
    firstName: string;
    lastName: string;
    email: string;
    profileImage?: string;
  };
  course: {
    title: string;
    level: string;
  };
}

export default function SessionsPage() {
  const { t } = useTranslation(['student', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("upcoming");

  const { data: sessions, isLoading, error } = useQuery({
    queryKey: ['/api/students/sessions'],
    enabled: !!user
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        }
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/sessions'] });
    }
  });

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading sessions...</p>
        </div>
      </div>
    );
  }

  if (error || !sessions) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <p className="text-red-600 mb-4">Error loading sessions</p>
          <Button onClick={() => window.location.reload()}>Try Again</Button>
        </div>
      </div>
    );
  }

  const now = new Date();
  const upcomingSessions = sessions.filter((session: Session) => 
    new Date(session.scheduledAt) > now && session.status !== 'cancelled'
  );
  const pastSessions = sessions.filter((session: Session) => 
    new Date(session.scheduledAt) <= now || session.status === 'completed'
  );
  const todaySessions = upcomingSessions.filter((session: Session) => {
    const sessionDate = new Date(session.scheduledAt);
    return sessionDate.toDateString() === now.toDateString();
  });

  const handleJoinSession = (session: Session) => {
    if (session.sessionUrl) {
      window.open(session.sessionUrl, '_blank');
    } else {
      joinSessionMutation.mutate(session.id);
    }
  };

  const getSessionStatus = (session: Session) => {
    const sessionTime = new Date(session.scheduledAt);
    const sessionEnd = new Date(sessionTime.getTime() + session.duration * 60000);
    
    if (now >= sessionTime && now <= sessionEnd) {
      return { status: 'live', variant: 'destructive' as const };
    } else if (now < sessionTime) {
      const timeDiff = sessionTime.getTime() - now.getTime();
      const minutesUntil = Math.floor(timeDiff / (1000 * 60));
      if (minutesUntil <= 15) {
        return { status: 'starting-soon', variant: 'default' as const };
      }
      return { status: 'upcoming', variant: 'secondary' as const };
    } else {
      return { status: session.status, variant: 'outline' as const };
    }
  };

  const SessionCard = ({ session }: { session: Session }) => {
    const statusInfo = getSessionStatus(session);
    
    return (
      <Card className="hover:shadow-md transition-shadow">
        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={session.tutor.profileImage} />
                <AvatarFallback>
                  {session.tutor.firstName[0]}{session.tutor.lastName[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h3 className="font-semibold text-lg">{session.title}</h3>
                <p className="text-gray-600 dark:text-gray-300 text-sm">
                  with {session.tutor.firstName} {session.tutor.lastName}
                </p>
                <p className="text-gray-500 text-sm">{session.course.title} • {session.course.level}</p>
              </div>
            </div>
            <Badge variant={statusInfo.variant}>
              {statusInfo.status === 'live' ? 'Live Now' : 
               statusInfo.status === 'starting-soon' ? 'Starting Soon' :
               statusInfo.status}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Calendar className="h-4 w-4" />
              <span>{format(new Date(session.scheduledAt), 'EEEE, MMMM d, yyyy')}</span>
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
              <Clock className="h-4 w-4" />
              <span>{format(new Date(session.scheduledAt), 'h:mm a')} ({session.duration} minutes)</span>
            </div>
            
            {session.description && (
              <p className="text-sm text-gray-600 dark:text-gray-300 line-clamp-2">
                {session.description}
              </p>
            )}

            <div className="flex gap-2 pt-2">
              {(statusInfo.status === 'live' || statusInfo.status === 'starting-soon') && (
                <Button 
                  onClick={() => handleJoinSession(session)}
                  disabled={joinSessionMutation.isPending}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  {statusInfo.status === 'live' ? 'Join Now' : 'Join Session'}
                </Button>
              )}
              
              {statusInfo.status === 'upcoming' && (
                <Button 
                  variant="outline" 
                  onClick={() => handleJoinSession(session)}
                  disabled={joinSessionMutation.isPending}
                  className="flex-1"
                >
                  <Video className="h-4 w-4 mr-2" />
                  Join Session
                </Button>
              )}

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm">
                    <ExternalLink className="h-4 w-4" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Session Details</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <h4 className="font-medium mb-2">Session Information</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300">{session.description}</p>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Tutor</h4>
                      <div className="flex items-center gap-2">
                        <Avatar className="w-8 h-8">
                          <AvatarImage src={session.tutor.profileImage} />
                          <AvatarFallback>
                            {session.tutor.firstName[0]}{session.tutor.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <span className="text-sm">{session.tutor.firstName} {session.tutor.lastName}</span>
                      </div>
                    </div>
                    {session.notes && (
                      <div>
                        <h4 className="font-medium mb-2">Notes</h4>
                        <p className="text-sm text-gray-600 dark:text-gray-300">{session.notes}</p>
                      </div>
                    )}
                    <div className="flex gap-2">
                      <Button 
                        onClick={() => handleJoinSession(session)}
                        disabled={joinSessionMutation.isPending}
                        className="flex-1"
                      >
                        <Video className="h-4 w-4 mr-2" />
                        Join Session
                      </Button>
                      <Button variant="outline" size="sm">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('student:sessions.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('student:sessions.subtitle')}
          </p>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Today's Sessions
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{todaySessions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                This Week
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingSessions.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-gray-600 dark:text-gray-300">
                Completed
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{pastSessions.length}</div>
            </CardContent>
          </Card>
        </div>

        {/* Sessions Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="today">Today ({todaySessions.length})</TabsTrigger>
            <TabsTrigger value="upcoming">Upcoming ({upcomingSessions.length})</TabsTrigger>
            <TabsTrigger value="past">Past ({pastSessions.length})</TabsTrigger>
          </TabsList>

          <TabsContent value="today" className="mt-6">
            <div className="space-y-4">
              {todaySessions.length > 0 ? (
                todaySessions.map((session: Session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Video className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No sessions scheduled for today</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/tutors'}>
                    Book a Session
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="upcoming" className="mt-6">
            <div className="space-y-4">
              {upcomingSessions.length > 0 ? (
                upcomingSessions.map((session: Session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No upcoming sessions</p>
                  <Button className="mt-4" onClick={() => window.location.href = '/tutors'}>
                    Book a Session
                  </Button>
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="past" className="mt-6">
            <div className="space-y-4">
              {pastSessions.length > 0 ? (
                pastSessions.map((session: Session) => (
                  <SessionCard key={session.id} session={session} />
                ))
              ) : (
                <div className="text-center py-12">
                  <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No past sessions</p>
                </div>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}