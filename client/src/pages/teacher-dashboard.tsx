import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  Clock, 
  BookOpen, 
  CheckCircle,
  AlertCircle,
  Calendar,
  MessageSquare,
  FileText,
  Star,
  TrendingUp,
  UserCheck,
  Video,
  Plus,
  Edit,
  Eye,
  Send,
  Award,
  Target
} from "lucide-react";

interface TeacherStats {
  totalStudents: number;
  activeClasses: number;
  completedSessions: number;
  averageRating: number;
  pendingHomework: number;
  upcomingSessions: number;
  monthlyEarnings: number;
  attendanceRate: number;
}

interface StudentProgress {
  id: number;
  name: string;
  course: string;
  level: string;
  progress: number;
  lastSession: string;
  attendanceRate: number;
  homeworkStatus: string;
  nextLesson: string;
  strengths: string[];
  improvements: string[];
}

interface TeacherSession {
  id: number;
  title: string;
  course: string;
  students: number;
  scheduledAt: string;
  duration: number;
  status: string;
  roomId: string;
  materials: string[];
  objectives: string[];
}

interface HomeworkAssignment {
  id: number;
  title: string;
  course: string;
  studentName: string;
  submittedAt: string;
  status: string;
  grade?: number;
  feedback?: string;
  dueDate: string;
}

export default function TeacherDashboard() {
  const [selectedTab, setSelectedTab] = useState("overview");
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [feedbackText, setFeedbackText] = useState("");

  const { data: stats } = useQuery<TeacherStats>({
    queryKey: ['/api/teacher/stats'],
  });

  const { data: students } = useQuery<StudentProgress[]>({
    queryKey: ['/api/teacher/students'],
  });

  const { data: sessions } = useQuery<TeacherSession[]>({
    queryKey: ['/api/teacher/sessions'],
  });

  const { data: homework } = useQuery<HomeworkAssignment[]>({
    queryKey: ['/api/teacher/homework'],
  });

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600 dark:text-green-400';
    if (progress >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'graded': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'scheduled': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'completed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  const submitFeedback = (studentId: number) => {
    console.log(`Submitting feedback for student ${studentId}: ${feedbackText}`);
    setFeedbackText("");
    setSelectedStudent(null);
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Teacher Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Manage your classes, track student progress, and enhance learning outcomes
          </p>
        </div>

        {/* Performance Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    My Students
                  </p>
                  <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    {stats?.activeClasses || 0} active classes
                  </p>
                </div>
                <Users className="h-8 w-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Teaching Rating
                  </p>
                  <p className="text-2xl font-bold">{stats?.averageRating || 0}★</p>
                  <p className="text-xs text-yellow-600 dark:text-yellow-400">
                    Student feedback avg
                  </p>
                </div>
                <Star className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Sessions Completed
                  </p>
                  <p className="text-2xl font-bold">{stats?.completedSessions || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stats?.upcomingSessions || 0} upcoming
                  </p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Pending Reviews
                  </p>
                  <p className="text-2xl font-bold">{stats?.pendingHomework || 0}</p>
                  <p className="text-xs text-orange-600 dark:text-orange-400">
                    Homework to grade
                  </p>
                </div>
                <FileText className="h-8 w-8 text-orange-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Teaching Tools */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-4">
            <TabsTrigger value="overview">Teaching Overview</TabsTrigger>
            <TabsTrigger value="students">Student Progress</TabsTrigger>
            <TabsTrigger value="sessions">My Classes</TabsTrigger>
            <TabsTrigger value="homework">Homework Review</TabsTrigger>
          </TabsList>

          {/* Teaching Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Today's Schedule</CardTitle>
                  <CardDescription>Your upcoming teaching sessions</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {sessions?.filter(s => s.status === 'scheduled').slice(0, 3).map((session) => (
                      <div key={session.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                        <div>
                          <div className="font-medium">{session.title}</div>
                          <div className="text-sm text-gray-600 dark:text-gray-400">
                            {session.course} • {session.students} students • {session.duration}min
                          </div>
                          <div className="text-sm text-blue-600 dark:text-blue-400">
                            {session.scheduledAt}
                          </div>
                        </div>
                        <Button size="sm">
                          <Video className="h-4 w-4 mr-1" />
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Student Achievements</CardTitle>
                  <CardDescription>Recent student milestones and progress</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <Award className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200">
                          Ahmad completed Persian Grammar Level 2
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Achieved 92% overall score
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Target className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">
                          Maryam reached 30-day streak
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Consistent daily practice
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                      <TrendingUp className="h-5 w-5 text-purple-600" />
                      <div>
                        <div className="font-medium text-purple-800 dark:text-purple-200">
                          Class average improved by 15%
                        </div>
                        <div className="text-sm text-purple-600 dark:text-purple-400">
                          Advanced Persian Literature
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Teaching Actions</CardTitle>
                <CardDescription>Common tasks and tools for effective teaching</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button className="h-20 flex-col space-y-2">
                    <Plus className="h-6 w-6" />
                    <span>Create Assignment</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <Calendar className="h-6 w-6" />
                    <span>Schedule Session</span>
                  </Button>
                  <Button variant="outline" className="h-20 flex-col space-y-2">
                    <MessageSquare className="h-6 w-6" />
                    <span>Send Announcement</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Progress Tab */}
          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Student Progress Tracking</CardTitle>
                <CardDescription>Monitor individual student development and performance</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Student</TableHead>
                      <TableHead>Course & Level</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Attendance</TableHead>
                      <TableHead>Last Session</TableHead>
                      <TableHead>Next Focus</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {students?.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell>
                          <div className="font-medium">{student.name}</div>
                        </TableCell>
                        <TableCell>
                          <div>{student.course}</div>
                          <Badge variant="outline" className="mt-1">{student.level}</Badge>
                        </TableCell>
                        <TableCell>
                          <div className={`font-medium ${getProgressColor(student.progress)}`}>
                            {student.progress}%
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-blue-600 h-1.5 rounded-full" 
                              style={{ width: `${student.progress}%` }}
                            ></div>
                          </div>
                        </TableCell>
                        <TableCell>{student.attendanceRate}%</TableCell>
                        <TableCell>{student.lastSession}</TableCell>
                        <TableCell>
                          <div className="text-sm">{student.nextLesson}</div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="ghost" 
                              size="sm"
                              onClick={() => setSelectedStudent(student.id)}
                            >
                              <MessageSquare className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>

            {/* Student Feedback Modal */}
            {selectedStudent && (
              <Card className="border-blue-200 dark:border-blue-800">
                <CardHeader>
                  <CardTitle>Send Student Feedback</CardTitle>
                  <CardDescription>
                    Provide personalized feedback to help student improve
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <Textarea
                      placeholder="Write your feedback here..."
                      value={feedbackText}
                      onChange={(e) => setFeedbackText(e.target.value)}
                      rows={4}
                    />
                    <div className="flex space-x-2">
                      <Button onClick={() => submitFeedback(selectedStudent)}>
                        <Send className="h-4 w-4 mr-2" />
                        Send Feedback
                      </Button>
                      <Button variant="outline" onClick={() => setSelectedStudent(null)}>
                        Cancel
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Teaching Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">My Teaching Sessions</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Schedule New Session
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Session</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Schedule</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions?.map((session) => (
                      <TableRow key={session.id}>
                        <TableCell>
                          <div className="font-medium">{session.title}</div>
                        </TableCell>
                        <TableCell>{session.course}</TableCell>
                        <TableCell>{session.students} students</TableCell>
                        <TableCell>{session.scheduledAt}</TableCell>
                        <TableCell>{session.duration} min</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(session.status)}>
                            {session.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            {session.status === 'scheduled' && (
                              <Button variant="ghost" size="sm">
                                <Video className="h-4 w-4" />
                              </Button>
                            )}
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Homework Review Tab */}
          <TabsContent value="homework" className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Homework Review & Grading</h3>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Assignment
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Assignment</TableHead>
                      <TableHead>Student</TableHead>
                      <TableHead>Course</TableHead>
                      <TableHead>Submitted</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Grade</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {homework?.map((hw) => (
                      <TableRow key={hw.id}>
                        <TableCell>
                          <div className="font-medium">{hw.title}</div>
                        </TableCell>
                        <TableCell>{hw.studentName}</TableCell>
                        <TableCell>{hw.course}</TableCell>
                        <TableCell>{hw.submittedAt}</TableCell>
                        <TableCell>{hw.dueDate}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(hw.status)}>
                            {hw.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          {hw.grade ? (
                            <span className="font-medium">{hw.grade}/100</span>
                          ) : (
                            <span className="text-gray-400">Not graded</span>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            {hw.status === 'submitted' && (
                              <Button variant="ghost" size="sm">
                                <Edit className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}