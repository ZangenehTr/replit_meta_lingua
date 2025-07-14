import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  Users, 
  Calendar, 
  BookOpen, 
  ClipboardCheck, 
  GraduationCap, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Video,
  MessageSquare,
  Award,
  DollarSign,
  Phone,
  FileText,
  BarChart3,
  Settings,
  Star,
  Target,
  PlayCircle,
  PauseCircle,
  Plus
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useState } from "react";

interface TeacherStats {
  totalClasses: number;
  totalStudents: number;
  completedLessons: number;
  pendingAssignments: number;
  averageRating: number;
  monthlyEarnings: number;
  attendanceRate: number;
  nextPaymentDate: string;
}

interface TeacherClass {
  id: number;
  name: string;
  studentCount: number;
  level: string;
  language: string;
  nextSession?: {
    date: string;
    time: string;
  };
  progress: number;
  status: 'active' | 'completed' | 'scheduled';
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  progress: number;
  lastSessionDate?: string;
  attendanceRate: number;
  status: 'active' | 'inactive' | 'completed';
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  className: string;
  submittedCount: number;
  totalStudents: number;
  status: 'pending' | 'graded' | 'overdue';
}

interface UpcomingSession {
  id: number;
  title: string;
  time: string;
  duration: number;
  studentCount: number;
  type: 'group' | 'individual';
  status: 'scheduled' | 'ongoing' | 'completed';
}

function TeacherDashboard() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  // Teacher theme colors
  const themeColors = {
    primary: "bg-purple-600",
    primaryHover: "hover:bg-purple-700",
    light: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    accent: "bg-purple-100 text-purple-800"
  };

  // Data queries
  const { data: teacherStats } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/stats"],
  });

  const { data: classes = [] } = useQuery<TeacherClass[]>({
    queryKey: ["/api/teacher/classes"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/teacher/students"],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/teacher/assignments"],
  });

  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ["/api/teacher/sessions/upcoming"],
  });

  // Mutation for starting sessions
  const startSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/teacher/sessions/${sessionId}/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to start session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teacher/sessions/upcoming"] });
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
      case 'active': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'overdue': return 'bg-red-100 text-red-800';
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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Professional Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-16 h-16 bg-gradient-to-br from-purple-500 to-purple-700 rounded-xl shadow-lg">
              <GraduationCap className="h-8 w-8 text-white" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-gray-900">{t('teacher.dashboard')}</h1>
              <p className="text-gray-600 mt-1">
                Welcome back, {user?.firstName}! Ready to inspire learning today?
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <Link href="/teacher/classes/new">
              <Button className="bg-purple-600 hover:bg-purple-700 shadow-md">
                <Plus className="h-4 w-4 mr-2" />
                New Class
              </Button>
            </Link>
            <Link href="/teacher/assignments/create">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </Link>
          </div>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('teacher.totalClasses')}</CardTitle>
              <BookOpen className="h-4 w-4 text-purple-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.totalClasses || classes.length}</div>
              <p className="text-xs text-muted-foreground">
                {students.length} total students
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('teacher.completedLessons')}</CardTitle>
              <CheckCircle className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.completedLessons || 45}</div>
              <p className="text-xs text-muted-foreground">
                This month
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('teacher.averageRating')}</CardTitle>
              <Star className="h-4 w-4 text-yellow-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teacherStats?.averageRating || 4.8}</div>
              <p className="text-xs text-muted-foreground">
                Student feedback average
              </p>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{t('teacher.monthlyEarnings')}</CardTitle>
              <DollarSign className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {formatCurrency(teacherStats?.monthlyEarnings || 28500000)}
              </div>
              <p className="text-xs text-muted-foreground">
                Next payment: {teacherStats?.nextPaymentDate || 'January 15th'}
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">{t('dashboard.overview')}</TabsTrigger>
            <TabsTrigger value="classes">{t('teacher.classes')}</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Upcoming Sessions */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-5 w-5" />
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
                            <Clock className="h-4 w-4" />
                            {session.time} • {session.duration} min
                            <Users className="h-4 w-4 ml-2" />
                            {session.studentCount} students
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={session.status === 'scheduled' ? 'default' : 'secondary'}>
                            {session.status}
                          </Badge>
                          {session.status === 'scheduled' && (
                            <Button
                              size="sm"
                              onClick={() => startSessionMutation.mutate(session.id)}
                              disabled={startSessionMutation.isPending}
                            >
                              <PlayCircle className="h-4 w-4 mr-1" />
                              Start
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

              {/* Recent Assignments */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ClipboardCheck className="h-5 w-5" />
                    Assignment Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {assignments.length > 0 ? (
                    assignments.slice(0, 3).map((assignment) => (
                      <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium">{assignment.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {assignment.className} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm">
                            {assignment.submittedCount}/{assignment.totalStudents}
                          </span>
                          <Badge className={getStatusColor(assignment.status)}>
                            {assignment.status}
                          </Badge>
                        </div>
                      </div>
                    ))
                  ) : (
                    <p className="text-muted-foreground text-center py-4">
                      No assignments pending
                    </p>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Performance Alerts */}
            {teacherStats?.attendanceRate && teacherStats.attendanceRate < 80 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Class attendance is below 80%. Consider engaging students with interactive activities.
                </AlertDescription>
              </Alert>
            )}
          </TabsContent>

          <TabsContent value="classes" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {classes.map((classItem) => (
                <Card key={classItem.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{classItem.name}</CardTitle>
                      <Badge className={getLevelColor(classItem.level)}>
                        {classItem.level}
                      </Badge>
                    </div>
                    <CardDescription>
                      {classItem.studentCount} students • {classItem.language}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Course Progress</span>
                        <span>{classItem.progress}%</span>
                      </div>
                      <Progress value={classItem.progress} className="h-2" />
                    </div>
                    
                    {classItem.nextSession && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {classItem.nextSession.date} at {classItem.nextSession.time}
                        </div>
                      </div>
                    )}

                    <div className="flex gap-2">
                      <Link href={`/teacher/classes/${classItem.id}`}>
                        <Button size="sm" variant="outline" className="flex-1">
                          <Video className="h-4 w-4 mr-1" />
                          Enter Class
                        </Button>
                      </Link>
                      <Button size="sm" variant="outline">
                        <MessageSquare className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Management</CardTitle>
                <CardDescription>
                  Monitor student progress and engagement across all your classes
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {students.map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <Avatar>
                          <AvatarFallback>
                            {student.firstName[0]}{student.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">
                            {student.firstName} {student.lastName}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {student.email} • {student.level}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">{student.progress}%</div>
                          <div className="text-xs text-muted-foreground">Progress</div>
                        </div>
                        <div className="text-center">
                          <div className="text-sm font-medium">{student.attendanceRate}%</div>
                          <div className="text-xs text-muted-foreground">Attendance</div>
                        </div>
                        <Badge className={getStatusColor(student.status)}>
                          {student.status}
                        </Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Assignment Management</CardTitle>
                    <CardDescription>
                      Create, track, and grade student assignments
                    </CardDescription>
                  </div>
                  <Link href="/teacher/assignments/create">
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      New Assignment
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div>
                        <h4 className="font-medium">{assignment.title}</h4>
                        <p className="text-sm text-muted-foreground">
                          {assignment.className} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div className="flex items-center gap-4">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {assignment.submittedCount}/{assignment.totalStudents}
                          </div>
                          <div className="text-xs text-muted-foreground">Submitted</div>
                        </div>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <FileText className="h-4 w-4 mr-1" />
                          Review
                        </Button>
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
                <CardTitle>Weekly Schedule</CardTitle>
                <CardDescription>
                  Your teaching schedule and upcoming sessions
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-purple-100 rounded-lg">
                          <Video className="h-5 w-5 text-purple-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.time} • {session.duration} minutes • {session.studentCount} students
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={session.type === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                          {session.type}
                        </Badge>
                        <Badge className={getStatusColor(session.status)}>
                          {session.status}
                        </Badge>
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

export default TeacherDashboard;