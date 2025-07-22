import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart,
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Video,
  MessageSquare,
  Award,
  Star,
  Brain,
  Lightbulb,
  BookOpen,
  Phone,
  Mail,
  ChevronUp,
  ChevronDown,
  Plus,
  Settings,
  BarChart3,
  Compass,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState } from "react";

interface MentorStats {
  totalMentees: number;
  activeMentees: number;
  totalSessions: number;
  averageRating: number;
  goalsAchieved: number;
  monthlyEarnings: number;
  responseRate: number;
  completionRate: number;
}

interface Mentee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  progress: number;
  motivationLevel: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
  currentGoals: string[];
  strengths: string[];
  weaknesses: string[];
  culturalBackground: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'completed';
  joinedDate: string;
}

interface MentorSession {
  id: number;
  menteeId: number;
  menteeName: string;
  title: string;
  scheduledTime: string;
  duration: number;
  type: 'guidance' | 'goal_setting' | 'progress_review' | 'motivation';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  sessionUrl?: string;
}

interface ProgressMilestone {
  id: number;
  menteeId: number;
  menteeName: string;
  title: string;
  description: string;
  targetDate: string;
  achievedDate?: string;
  progress: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LearningGoal {
  id: number;
  menteeId: number;
  title: string;
  description: string;
  category: 'speaking' | 'listening' | 'reading' | 'writing' | 'grammar' | 'vocabulary';
  targetDate: string;
  progress: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

function MentorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['mentor', 'common']);
  const { isRTL } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  // Mentor theme colors
  const themeColors = {
    primary: "bg-orange-600",
    primaryHover: "hover:bg-orange-700",
    light: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    accent: "bg-orange-100 text-orange-800"
  };

  // Data queries
  const { data: mentorStats } = useQuery<MentorStats>({
    queryKey: ["/api/mentor/stats"],
  });

  const { data: mentees = [] } = useQuery<Mentee[]>({
    queryKey: ["/api/mentor/mentees"],
  });

  const { data: sessions = [] } = useQuery<MentorSession[]>({
    queryKey: ["/api/mentor/sessions"],
  });

  const { data: milestones = [] } = useQuery<ProgressMilestone[]>({
    queryKey: ["/api/mentor/milestones"],
  });

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/mentor/goals"],
  });

  // Mutation for scheduling sessions
  const scheduleSessionMutation = useMutation({
    mutationFn: async (sessionData: { menteeId: number; type: string; scheduledTime: string }) => {
      const response = await fetch('/api/mentor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to schedule session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/sessions"] });
    }
  });

  // Mutation for updating goals
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: number; progress: number }) => {
      const response = await fetch(`/api/mentor/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      });
      if (!response.ok) throw new Error('Failed to update goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/goals"] });
    }
  });

  // Helper functions
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationColor = (level: number) => {
    if (level >= 8) return 'text-green-600';
    if (level >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationIcon = (level: number) => {
    if (level >= 8) return <Smile className="h-4 w-4 text-green-600" />;
    if (level >= 6) return <Meh className="h-4 w-4 text-yellow-600" />;
    return <Frown className="h-4 w-4 text-red-600" />;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
  );

  const activeMentees = mentees.filter(m => m.status === 'active');
  const pendingGoals = learningGoals.filter(g => !g.isCompleted);

  return (
    <AppLayout>
      <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('mentor:dashboard.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('mentor:dashboard.welcomeMessage')}
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">{t('mentor:dashboard.totalMentees')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.totalMentees || 0}</p>
                </div>
                <Users className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">{t('mentor:dashboard.activeMentees')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.activeMentees || 0}</p>
                </div>
                <Heart className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('mentor:dashboard.sessionsCompleted')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.totalSessions || 0}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">{t('mentor:dashboard.averageRating')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.averageRating?.toFixed(1) || '0.0'}</p>
                </div>
                <Star className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('mentor:overview')}</TabsTrigger>
            <TabsTrigger value="students">{t('mentor:students')}</TabsTrigger>
            <TabsTrigger value="messages">{t('mentor:messages')}</TabsTrigger>
            <TabsTrigger value="progress">{t('mentor:progress')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </AppLayout>
  );
}
                    Mentee Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {mentees.filter(m => m.motivationLevel < 6 || m.progress < 50).slice(0, 3).map((mentee) => (
                    <div key={mentee.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback>
                            {mentee.firstName[0]}{mentee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium text-sm">{mentee.firstName} {mentee.lastName}</h4>
                          <div className="flex items-center gap-2 text-xs text-muted-foreground">
                            {getMotivationIcon(mentee.motivationLevel)}
                            <span>Motivation: {mentee.motivationLevel}/10</span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {mentee.progress < 50 && (
                          <Badge variant="outline" className="text-red-700 border-red-200">
                            Low Progress
                          </Badge>
                        )}
                        {mentee.motivationLevel < 6 && (
                          <Badge variant="outline" className="text-yellow-700 border-yellow-200">
                            Needs Support
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>
            </div>

            {/* Goal Progress Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Recent Goal Achievements
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {learningGoals.filter(g => g.isCompleted).slice(0, 3).map((goal) => (
                    <div key={goal.id} className="p-3 bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg border border-green-200">
                      <div className="flex items-center gap-2 mb-2">
                        <CheckCircle className="h-4 w-4 text-green-600" />
                        <h4 className="font-medium text-sm">{goal.title}</h4>
                      </div>
                      <p className="text-xs text-muted-foreground mb-2">{goal.description}</p>
                      <Badge className="text-xs" variant="outline">
                        {goal.category}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="mentees" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {mentees.map((mentee) => (
                <Card key={mentee.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarFallback>
                          {mentee.firstName[0]}{mentee.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <CardTitle className="text-lg">{mentee.firstName} {mentee.lastName}</CardTitle>
                        <div className="flex items-center gap-2">
                          <Badge className={getLevelColor(mentee.level)}>
                            {mentee.level}
                          </Badge>
                          <Badge className={getStatusColor(mentee.status)}>
                            {mentee.status}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Learning Progress</span>
                        <span className={getProgressColor(mentee.progress)}>{mentee.progress}%</span>
                      </div>
                      <Progress value={mentee.progress} className="h-2" />
                    </div>

                    <div>
                      <div className="flex justify-between items-center text-sm mb-1">
                        <span>Motivation Level</span>
                        <div className="flex items-center gap-1">
                          {getMotivationIcon(mentee.motivationLevel)}
                          <span className={getMotivationColor(mentee.motivationLevel)}>
                            {mentee.motivationLevel}/10
                          </span>
                        </div>
                      </div>
                      <Progress value={mentee.motivationLevel * 10} className="h-2" />
                    </div>

                    <div className="text-sm">
                      <div className="font-medium mb-1">Cultural Background</div>
                      <p className="text-muted-foreground">{mentee.culturalBackground}</p>
                    </div>

                    <div className="text-sm">
                      <div className="font-medium mb-1">Current Goals</div>
                      <div className="flex flex-wrap gap-1">
                        {mentee.currentGoals.slice(0, 2).map((goal, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {goal}
                          </Badge>
                        ))}
                        {mentee.currentGoals.length > 2 && (
                          <Badge variant="outline" className="text-xs">
                            +{mentee.currentGoals.length - 2} more
                          </Badge>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      <Link href={`/mentor/mentees/${mentee.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Brain className="h-4 w-4 mr-1" />
                          View Profile
                        </Button>
                      </Link>
                      <Button 
                        size="sm" 
                        onClick={() => scheduleSessionMutation.mutate({
                          menteeId: mentee.id,
                          type: 'guidance',
                          scheduledTime: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
                        })}
                        disabled={scheduleSessionMutation.isPending}
                      >
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Session Management</CardTitle>
                    <CardDescription>
                      Schedule and manage mentoring sessions
                    </CardDescription>
                  </div>
                  <Link href="/mentor/sessions/schedule">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      Schedule Session
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {sessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-orange-100 rounded-lg">
                          <Video className="h-5 w-5 text-orange-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.menteeName} • {new Date(session.scheduledTime).toLocaleString()} • {session.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={`${session.type === 'goal_setting' ? 'bg-orange-100 text-orange-800' : 'bg-blue-100 text-blue-800'}`}>
                          {session.type.replace('_', ' ')}
                        </Badge>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
                        {session.status === 'scheduled' && (
                          <Link href={`/mentor/sessions/${session.id}`}>
                            <Button size="sm">Join</Button>
                          </Link>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="goals" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Learning Goals</CardTitle>
                    <CardDescription>
                      Track and manage mentee learning objectives
                    </CardDescription>
                  </div>
                  <Link href="/mentor/goals/create">
                    <Button>
                      <Target className="h-4 w-4 mr-2" />
                      New Goal
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningGoals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        <div className="flex items-center gap-2">
                          <Badge className={getPriorityColor(goal.priority)}>
                            {goal.priority}
                          </Badge>
                          {goal.isCompleted && (
                            <Badge className="bg-green-100 text-green-800">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm">Progress</span>
                        <span className="text-sm font-medium">{goal.progress}%</span>
                      </div>
                      <Progress value={goal.progress} className="h-2 mb-3" />
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline" className="text-xs">
                            {goal.category}
                          </Badge>
                          <span className="text-xs text-muted-foreground">
                            Due: {new Date(goal.targetDate).toLocaleDateString()}
                          </span>
                        </div>
                        {!goal.isCompleted && (
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => updateGoalMutation.mutate({ 
                              goalId: goal.id, 
                              progress: Math.min(goal.progress + 10, 100) 
                            })}
                            disabled={updateGoalMutation.isPending}
                          >
                            Update Progress
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Progress Analytics</CardTitle>
                <CardDescription>
                  Comprehensive view of mentee development
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{milestone.title}</h4>
                        <Badge className={getPriorityColor(milestone.priority)}>
                          {milestone.priority}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground mb-2">
                        {milestone.menteeName}
                      </p>
                      <p className="text-sm mb-3">{milestone.description}</p>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{milestone.progress}%</span>
                      </div>
                      <Progress value={milestone.progress} className="h-2 mb-2" />
                      <div className="text-xs text-muted-foreground">
                        {milestone.isCompleted 
                          ? `Achieved: ${milestone.achievedDate ? new Date(milestone.achievedDate).toLocaleDateString() : 'Recently'}`
                          : `Target: ${new Date(milestone.targetDate).toLocaleDateString()}`
                        }
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}

export default MentorDashboard;