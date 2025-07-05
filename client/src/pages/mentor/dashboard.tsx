import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  Calendar, 
  TrendingUp, 
  Clock, 
  Target,
  Award,
  MessageSquare,
  Video,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Heart,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface Mentee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  goals: string[];
  progress: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
  totalSessions: number;
  motivationLevel: number;
  challenges: string[];
}

interface MentorSession {
  id: number;
  menteeId: number;
  menteeName: string;
  type: string;
  scheduledTime: string;
  duration: number;
  status: string;
  notes?: string;
  goals: string[];
}

interface ProgressMilestone {
  id: number;
  menteeId: number;
  menteeName: string;
  milestone: string;
  achievedDate: string;
  category: string;
}

interface MentorStats {
  totalMentees: number;
  activeMentees: number;
  completedSessions: number;
  upcomingSessions: number;
  averageProgress: number;
}

export default function MentorDashboard() {
  const { user } = useAuth();

  // Mentor theme colors
  const themeColors = {
    primary: "bg-orange-600",
    primaryHover: "hover:bg-orange-700",
    light: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    accent: "bg-orange-100 text-orange-800"
  };

  const { data: mentees = [] } = useQuery<Mentee[]>({
    queryKey: ["/api/mentor/mentees"],
  });

  const { data: sessions = [] } = useQuery<MentorSession[]>({
    queryKey: ["/api/mentor/sessions"],
  });

  const { data: milestones = [] } = useQuery<ProgressMilestone[]>({
    queryKey: ["/api/mentor/milestones"],
  });

  const { data: stats } = useQuery<MentorStats>({
    queryKey: ["/api/mentor/stats"],
  });

  // Calculate derived metrics from real data
  const activeMentees = mentees.filter(m => m.lastSessionDate && 
    new Date(m.lastSessionDate) > new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
  ).length;
  
  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
  ).length;
  
  const averageProgress = mentees.length > 0 ? 
    mentees.reduce((sum, m) => sum + m.progress, 0) / mentees.length : 0;

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

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-orange-100 rounded-full">
              <Heart className="h-6 w-6 text-orange-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-orange-800">Mentor Dashboard</h1>
              <p className="text-orange-600">
                Welcome back, {user?.firstName}! Guide your mentees to success.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/mentor/sessions/schedule">
              <Button className="bg-orange-600 hover:bg-orange-700">
                <Calendar className="h-4 w-4 mr-2" />
                Schedule Session
              </Button>
            </Link>
            <Button variant="outline" className="border-orange-200 text-orange-700 hover:bg-orange-50">
              <Target className="h-4 w-4 mr-2" />
              Set Goals
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Mentees</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mentees.length}</div>
              <p className="text-xs text-muted-foreground">
                Students under guidance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Mentees</CardTitle>
              <Heart className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{activeMentees}</div>
              <p className="text-xs text-muted-foreground">
                Recently engaged mentees
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Upcoming Sessions</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{upcomingSessions}</div>
              <p className="text-xs text-muted-foreground">
                Scheduled mentoring sessions
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{averageProgress.toFixed(1)}%</div>
              <p className="text-xs text-muted-foreground">
                Overall mentee progress
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="mentees" className="space-y-4">
          <TabsList>
            <TabsTrigger value="mentees">My Mentees</TabsTrigger>
            <TabsTrigger value="sessions">Sessions</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="insights">Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="mentees" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Mentees</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor mentee progress and provide guidance
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {mentees.map((mentee) => (
                    <Card key={mentee.id} className="border-l-4 border-l-purple-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">
                            {mentee.firstName} {mentee.lastName}
                          </CardTitle>
                          <Badge className={getLevelColor(mentee.level)}>
                            {mentee.level}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex items-center justify-between text-sm">
                            <span>Learning Progress</span>
                            <span className={getProgressColor(mentee.progress)}>
                              {mentee.progress}%
                            </span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${mentee.progress}%` }}
                            ></div>
                          </div>
                          
                          <div className="flex items-center justify-between text-sm">
                            <span>Motivation Level</span>
                            <span className={getMotivationColor(mentee.motivationLevel)}>
                              {mentee.motivationLevel}/10
                            </span>
                          </div>
                          <div className="flex">
                            {[...Array(10)].map((_, i) => (
                              <Star 
                                key={i} 
                                className={`h-3 w-3 ${
                                  i < mentee.motivationLevel 
                                    ? 'text-yellow-400 fill-current' 
                                    : 'text-gray-300'
                                }`} 
                              />
                            ))}
                          </div>

                          <div className="text-xs text-muted-foreground">
                            <p>Sessions: {mentee.totalSessions}</p>
                            {mentee.lastSessionDate && (
                              <p>Last session: {new Date(mentee.lastSessionDate).toLocaleDateString()}</p>
                            )}
                            {mentee.nextSessionDate && (
                              <p>Next session: {new Date(mentee.nextSessionDate).toLocaleDateString()}</p>
                            )}
                          </div>

                          {mentee.goals.length > 0 && (
                            <div>
                              <p className="text-xs font-medium mb-1">Current Goals:</p>
                              <div className="flex flex-wrap gap-1">
                                {mentee.goals.slice(0, 2).map((goal, index) => (
                                  <Badge key={index} variant="outline" className="text-xs">
                                    {goal}
                                  </Badge>
                                ))}
                                {mentee.goals.length > 2 && (
                                  <Badge variant="outline" className="text-xs">
                                    +{mentee.goals.length - 2} more
                                  </Badge>
                                )}
                              </div>
                            </div>
                          )}

                          <div className="flex gap-2 pt-2">
                            <Link href={`/mentor/mentees/${mentee.id}`}>
                              <Button size="sm" className="flex-1">View Details</Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline">
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {mentees.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No mentees assigned yet. Contact admin to get mentees assigned.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sessions" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mentoring Sessions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your scheduled and completed mentoring sessions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {sessions.slice(0, 10).map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-full">
                          {session.status === 'completed' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : session.status === 'scheduled' ? (
                            <Clock className="h-5 w-5 text-blue-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="font-medium">{session.menteeName}</p>
                          <p className="text-sm text-muted-foreground">
                            {session.type} • {session.duration} minutes
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(session.scheduledTime).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <Badge className={session.status === 'completed' ? 'bg-green-100 text-green-800' : 
                                        session.status === 'scheduled' ? 'bg-blue-100 text-blue-800' : 
                                        'bg-gray-100 text-gray-800'}>
                          {session.status}
                        </Badge>
                        <div className="flex gap-2 mt-2">
                          {session.status === 'scheduled' && (
                            <Button size="sm">
                              <Video className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                          <Button size="sm" variant="outline">View</Button>
                        </div>
                      </div>
                    </div>
                  ))}
                  {sessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No sessions scheduled yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="milestones" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Recent Milestones</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Celebrate mentee achievements and progress
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {milestones.map((milestone) => (
                    <div key={milestone.id} className="flex items-center gap-3 p-3 border rounded-lg">
                      <div className="flex items-center justify-center w-10 h-10 bg-yellow-100 rounded-full">
                        <Award className="h-5 w-5 text-yellow-600" />
                      </div>
                      <div className="flex-1">
                        <p className="font-medium">{milestone.menteeName}</p>
                        <p className="text-sm text-muted-foreground">
                          {milestone.milestone}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {milestone.category} • {new Date(milestone.achievedDate).toLocaleDateString()}
                        </p>
                      </div>
                      <Badge className="bg-yellow-100 text-yellow-800">
                        Achievement
                      </Badge>
                    </div>
                  ))}
                  {milestones.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No recent milestones to display.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Mentoring Insights</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Data-driven insights to improve your mentoring effectiveness
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <TrendingUp className="h-5 w-5 text-green-600" />
                      <h3 className="font-medium">Progress Trends</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Average mentee progress has improved by 15% this month
                    </p>
                    <Button size="sm" variant="outline">View Details</Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <h3 className="font-medium">Goal Achievement</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      85% of set goals have been achieved this quarter
                    </p>
                    <Button size="sm" variant="outline">View Goals</Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <Heart className="h-5 w-5 text-red-600" />
                      <h3 className="font-medium">Engagement Levels</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      High engagement across all mentees with 95% session attendance
                    </p>
                    <Button size="sm" variant="outline">View Report</Button>
                  </div>
                  
                  <div className="p-4 border rounded-lg">
                    <div className="flex items-center gap-2 mb-2">
                      <BookOpen className="h-5 w-5 text-purple-600" />
                      <h3 className="font-medium">Learning Patterns</h3>
                    </div>
                    <p className="text-sm text-muted-foreground mb-2">
                      Most effective sessions are 45-60 minutes with structured goals
                    </p>
                    <Button size="sm" variant="outline">Learn More</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}