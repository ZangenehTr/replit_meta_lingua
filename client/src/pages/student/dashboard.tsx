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
  BookOpen, 
  Trophy, 
  Target, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MessageSquare, 
  Mic, 
  Headphones,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Award,
  CreditCard,
  Phone,
  User,
  Brain,
  Globe,
  Heart,
  Flame,
  ClipboardCheck
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useState } from "react";

interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: string;
  nextLevelXP: number;
  walletBalance: number;
  memberTier: string;
  studyTimeThisWeek: number;
  weeklyGoalHours: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  progress: number;
  instructor: string;
  nextSession?: {
    date: string;
    time: string;
  };
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
}

interface Assignment {
  id: number;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  feedback?: string;
}

interface UpcomingSession {
  id: number;
  title: string;
  instructor: string;
  time: string;
  duration: number;
  type: 'group' | 'individual';
  sessionUrl?: string;
  canJoin: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

interface LearningGoal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  isCompleted: boolean;
}

function StudentDashboard() {
  const { user } = useAuth();
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  // Student theme colors
  const themeColors = {
    primary: "bg-blue-600",
    primaryHover: "hover:bg-blue-700",
    light: "bg-blue-50",
    border: "border-blue-200",
    text: "text-blue-800",
    accent: "bg-blue-100 text-blue-800"
  };

  // Data queries
  const { data: studentStats } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/student/courses"],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/student/assignments"],
  });

  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ["/api/student/sessions/upcoming"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/student/achievements"],
  });

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/student/goals"],
  });

  // Mutation for joining sessions
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/student/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.open(data.sessionUrl, '_blank');
      }
      queryClient.invalidateQueries({ queryKey: ["/api/student/sessions/upcoming"] });
    }
  });

  // Helper functions
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-purple-100 text-purple-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
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

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const weeklyProgress = studentStats ? (studentStats.studyTimeThisWeek / studentStats.weeklyGoalHours) * 100 : 0;

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Professional Header with Gamification */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-500 to-blue-700 rounded-xl shadow-lg relative">
              <Brain className="h-8 w-8 text-white" />
              {studentStats?.currentStreak && studentStats.currentStreak > 0 && (
                <div className="absolute -top-2 -right-2 bg-orange-500 text-white text-xs font-bold rounded-full w-6 h-6 flex items-center justify-center">
                  {studentStats.currentStreak}
                </div>
              )}
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Learning Dashboard</h1>
              <div className="flex items-center gap-4 mt-1">
                <p className="text-gray-600">
                  Level {studentStats?.currentLevel || 'Beginner'} • {studentStats?.totalXP || 0} XP
                </p>
                <Badge className={getMemberTierColor(studentStats?.memberTier || 'bronze')}>
                  {studentStats?.memberTier?.toUpperCase() || 'BRONZE'} Member
                </Badge>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/ai-practice">
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 shadow-md">
                <Mic className="h-4 w-4 mr-2" />
                AI Practice
              </Button>
            </Link>
            <Link href="/level-assessment">
              <Button variant="outline" className="border-blue-200 text-blue-700 hover:bg-blue-50">
                <Target className="h-4 w-4 mr-2" />
                Test Level
              </Button>
            </Link>
          </div>
        </div>

        {/* Gamification & Progress Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
              <Flame className="h-4 w-4 text-orange-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats?.currentStreak || 0} days</div>
              <p className="text-xs text-muted-foreground">
                Keep it up! 🔥
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Trophy className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{studentStats?.totalXP || 0} XP</div>
              <p className="text-xs text-muted-foreground">
                {studentStats?.nextLevelXP ? `${studentStats.nextLevelXP - studentStats.totalXP} XP to next level` : 'Keep learning!'}
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Weekly Goal</CardTitle>
              <Target className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{Math.round(weeklyProgress)}%</div>
              <Progress value={weeklyProgress} className="h-2 mt-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {studentStats?.studyTimeThisWeek || 0}h / {studentStats?.weeklyGoalHours || 5}h this week
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-emerald-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Wallet Balance</CardTitle>
              <CreditCard className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(studentStats?.walletBalance || 0)}
              </div>
              <Link href="/wallet">
                <Button size="sm" variant="outline" className="mt-2">
                  Top Up
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="courses">My Courses</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="goals">Goals</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Today's Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Video className="h-5 w-5" />
                    Today's Sessions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {upcomingSessions.length > 0 ? (
                    upcomingSessions.slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{session.title}</h4>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            {session.instructor}
                            <Clock className="h-4 w-4 ml-2" />
                            {session.time} • {session.duration} min
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.type === 'group' ? 'default' : 'secondary'}>
                            {session.type}
                          </Badge>
                          {session.canJoin && (
                            <Button
                              size="sm"
                              onClick={() => joinSessionMutation.mutate(session.id)}
                              disabled={joinSessionMutation.isPending}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <Play className="h-4 w-4 mr-1" />
                              Join
                            </Button>
                          )}
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No sessions scheduled for today
                    </p>
                  )}
                </CardContent>
              </Card>

              {/* Pending Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Pending Assignments
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {pendingAssignments.length > 0 ? (
                    pendingAssignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {assignment.courseName} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                          <Link href={`/assignments/${assignment.id}`}>
                            <Button size="sm" variant="outline">
                              View
                            </Button>
                          </Link>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4">
                      <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                      <p className="text-muted-foreground">All caught up! 🎉</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Recent Achievements */}
            {achievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {achievements.slice(0, 3).map((achievement) => (
                      <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                        <div className="text-2xl">{achievement.icon}</div>
                        <div className="flex-1">
                          <h4 className="font-medium text-sm">{achievement.title}</h4>
                          <p className="text-xs text-muted-foreground">{achievement.description}</p>
                          <div className="flex items-center gap-1 mt-1">
                            <Zap className="h-3 w-3 text-yellow-600" />
                            <span className="text-xs font-medium text-yellow-700">
                              +{achievement.xpReward} XP
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Motivational Alerts */}
            {studentStats?.currentStreak === 0 && (
              <Alert className="border-orange-200 bg-orange-50">
                <Flame className="h-4 w-4 text-orange-600" />
                <AlertDescription>
                  Start your learning streak today! Complete a lesson to begin building your streak.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="courses" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardDescription>
                      {course.language} • {course.instructor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {course.completedLessons}/{course.totalLessons} lessons completed
                    </div>

                    {course.nextSession && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {course.nextSession.date} at {course.nextSession.time}
                        </div>
                      </div>
                    )}

                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Management</CardTitle>
                <CardDescription>
                  Track your homework and submit assignments
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.courseName} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                        {assignment.score && (
                          <p className="text-sm font-medium text-green-600 mt-1">
                            Score: {assignment.score}%
                          </p>
                        )}
                      </div>
                      <div className="flex items-center gap-4">
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Link href={`/assignments/${assignment.id}`}>
                          <Button size="sm" variant="outline">
                            {assignment.status === 'pending' ? 'Submit' : 'View'}
                          </Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>My Schedule</CardTitle>
                <CardDescription>
                  Upcoming sessions and events
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Video className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.instructor} • {session.time} • {session.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={session.type === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                          {session.type}
                        </Badge>
                        {session.canJoin && (
                          <Button
                            size="sm"
                            onClick={() => joinSessionMutation.mutate(session.id)}
                            disabled={joinSessionMutation.isPending}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Achievement Gallery</CardTitle>
                <CardDescription>
                  Your learning milestones and rewards
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 border rounded-lg text-center">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
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
                      Track your language learning objectives
                    </CardDescription>
                  </div>
                  <Link href="/goals/new">
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
                        {goal.isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
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

export default StudentDashboard;