import { useQuery } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  Award
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";

interface TeacherClass {
  id: number;
  name: string;
  studentCount: number;
  level: string;
  nextSession?: {
    date: string;
    time: string;
  };
  progress: number;
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
}

interface Assignment {
  id: number;
  title: string;
  dueDate: string;
  submissionCount: number;
  totalStudents: number;
  status: string;
}

interface UpcomingSession {
  id: number;
  title: string;
  startTime: string;
  duration: number;
  studentCount: number;
  type: string;
}

export default function TeacherDashboard() {
  const { user } = useAuth();

  // Teacher theme colors
  const themeColors = {
    primary: "bg-purple-600",
    primaryHover: "hover:bg-purple-700",
    light: "bg-purple-50",
    border: "border-purple-200",
    text: "text-purple-800",
    accent: "bg-purple-100 text-purple-800"
  };

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

  const { data: teacherStats } = useQuery({
    queryKey: ["/api/teacher/stats"],
  });

  // Calculate dashboard stats from real data
  const totalClasses = classes.length;
  const totalStudents = students.length;
  const pendingAssignments = assignments.filter(a => a.status === 'pending').length;
  const avgAttendanceRate = students.length > 0 ? 
    (students.reduce((sum, s) => sum + s.attendanceRate, 0) / students.length).toFixed(1) : 0;

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

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Welcome Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-12 h-12 bg-purple-100 rounded-full">
              <GraduationCap className="h-6 w-6 text-purple-600" />
            </div>
            <div>
              <h1 className="text-3xl font-bold text-purple-800">Teacher Dashboard</h1>
              <p className="text-purple-600">
                Welcome back, {user?.firstName}! Monitor your classes and students.
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <Link href="/teacher/classes/new">
              <Button className="bg-purple-600 hover:bg-purple-700">
                <BookOpen className="h-4 w-4 mr-2" />
                New Class
              </Button>
            </Link>
            <Link href="/teacher/assignments/new">
              <Button variant="outline" className="border-purple-200 text-purple-700 hover:bg-purple-50">
                <ClipboardCheck className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </Link>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Classes</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalClasses}</div>
              <p className="text-xs text-muted-foreground">
                Active teaching classes
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Students</CardTitle>
              <GraduationCap className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalStudents}</div>
              <p className="text-xs text-muted-foreground">
                Students under guidance
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pending Reviews</CardTitle>
              <ClipboardCheck className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-orange-600">{pendingAssignments}</div>
              <p className="text-xs text-muted-foreground">
                Assignments to review
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Attendance</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">{avgAttendanceRate}%</div>
              <p className="text-xs text-muted-foreground">
                Class attendance rate
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="classes" className="space-y-4">
          <TabsList>
            <TabsTrigger value="classes">My Classes</TabsTrigger>
            <TabsTrigger value="students">Students</TabsTrigger>
            <TabsTrigger value="assignments">Assignments</TabsTrigger>
            <TabsTrigger value="schedule">Schedule</TabsTrigger>
          </TabsList>

          <TabsContent value="classes" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Classes</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Overview of your teaching classes
                </p>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {classes.map((cls) => (
                    <Card key={cls.id} className="border-l-4 border-l-blue-500">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-lg">{cls.name}</CardTitle>
                          <Badge className={getLevelColor(cls.level)}>
                            {cls.level}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <Users className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{cls.studentCount} students</span>
                          </div>
                          {cls.nextSession && (
                            <div className="flex items-center gap-2">
                              <Calendar className="h-4 w-4 text-muted-foreground" />
                              <span className="text-sm">
                                Next: {new Date(cls.nextSession.date).toLocaleDateString()} at {cls.nextSession.time}
                              </span>
                            </div>
                          )}
                          <div className="space-y-1">
                            <div className="flex justify-between text-sm">
                              <span>Progress</span>
                              <span className={getProgressColor(cls.progress)}>{cls.progress}%</span>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${cls.progress}%` }}
                              ></div>
                            </div>
                          </div>
                          <div className="flex gap-2 pt-2">
                            <Link href={`/teacher/classes/${cls.id}`}>
                              <Button size="sm" className="flex-1">View Details</Button>
                            </Link>
                            <Button size="sm" variant="outline">
                              <Video className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  {classes.length === 0 && (
                    <div className="col-span-full text-center py-8 text-muted-foreground">
                      No classes assigned yet. Contact admin to get classes assigned.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Your Students</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Monitor student progress and performance
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {students.slice(0, 10).map((student) => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">
                            {student.firstName} {student.lastName}
                          </span>
                          <Badge className={getLevelColor(student.level)}>
                            {student.level}
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {student.email}
                        </p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground mt-1">
                          <span>Progress: <span className={getProgressColor(student.progress)}>{student.progress}%</span></span>
                          <span>Attendance: <span className={getProgressColor(student.attendanceRate)}>{student.attendanceRate}%</span></span>
                          {student.lastSessionDate && (
                            <span>Last Session: {new Date(student.lastSessionDate).toLocaleDateString()}</span>
                          )}
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-4 w-4 mr-1" />
                          Message
                        </Button>
                        <Link href={`/teacher/students/${student.id}`}>
                          <Button size="sm">View</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {students.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No students assigned yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="assignments" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Assignment Overview</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Track assignment submissions and progress
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {assignments.map((assignment) => (
                    <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium">{assignment.title}</span>
                          {assignment.status === 'pending' && (
                            <Badge className="bg-orange-100 text-orange-800">
                              Needs Review
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Due: {new Date(assignment.dueDate).toLocaleDateString()}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Submitted: {assignment.submissionCount}/{assignment.totalStudents} students
                        </p>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="text-center">
                          <div className="text-sm font-medium">
                            {Math.round((assignment.submissionCount / assignment.totalStudents) * 100)}%
                          </div>
                          <div className="text-xs text-muted-foreground">Complete</div>
                        </div>
                        <Link href={`/teacher/assignments/${assignment.id}`}>
                          <Button size="sm">Review</Button>
                        </Link>
                      </div>
                    </div>
                  ))}
                  {assignments.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No assignments created yet.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Upcoming Sessions</CardTitle>
                <p className="text-sm text-muted-foreground">
                  Your scheduled teaching sessions
                </p>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-full">
                          <Calendar className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <p className="font-medium">{session.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(session.startTime).toLocaleString()}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {session.duration} min • {session.studentCount} students • {session.type}
                          </p>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button size="sm" variant="outline">
                          <Video className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                        <Button size="sm">Details</Button>
                      </div>
                    </div>
                  ))}
                  {upcomingSessions.length === 0 && (
                    <div className="text-center py-8 text-muted-foreground">
                      No upcoming sessions scheduled.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}