import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { 
  Users, 
  TrendingUp, 
  DollarSign, 
  Calendar,
  Phone,
  Mail,
  UserCheck,
  BookOpen,
  Target,
  Award,
  Search,
  Plus,
  Edit,
  Eye,
  AlertTriangle,
  CheckCircle,
  Clock
} from "lucide-react";

interface ManagerStats {
  totalStudents: number;
  activeStudents: number;
  newEnrollments: number;
  monthlyRevenue: number;
  conversionRate: number;
  activeTeachers: number;
  averageClassSize: number;
  studentSatisfaction: number;
}

interface TeacherPerformance {
  id: number;
  name: string;
  studentsAssigned: number;
  classesThisMonth: number;
  averageRating: number;
  totalRevenue: number;
  retentionRate: number;
  status: string;
}

interface CourseAnalytics {
  id: number;
  title: string;
  language: string;
  enrollments: number;
  completionRate: number;
  revenue: number;
  averageRating: number;
  instructor: string;
  status: string;
}

export default function ManagerDashboard() {
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: stats } = useQuery<ManagerStats>({
    queryKey: ['/api/manager/stats'],
  });

  const { data: teachers } = useQuery<TeacherPerformance[]>({
    queryKey: ['/api/manager/teachers'],
  });

  const { data: courses } = useQuery<CourseAnalytics[]>({
    queryKey: ['/api/manager/courses'],
  });

  const filteredTeachers = teachers?.filter(teacher =>
    teacher.name.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const filteredCourses = courses?.filter(course =>
    course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
    course.language.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const getPerformanceColor = (rating: number) => {
    if (rating >= 4.5) return 'text-green-600 dark:text-green-400';
    if (rating >= 4.0) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'excellent': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'good': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'needs_improvement': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'active': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'inactive': return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  };

  return (
    <div className="min-h-screen bg-background p-4 md:p-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Manager Dashboard
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">
            Institute performance overview and team management
          </p>
        </div>

        {/* Key Performance Indicators */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Students
                  </p>
                  <p className="text-2xl font-bold">{stats?.activeStudents || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    +{stats?.newEnrollments || 0} this month
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
                    Monthly Revenue
                  </p>
                  <p className="text-2xl font-bold">₼{stats?.monthlyRevenue || 0}</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {stats?.conversionRate || 0}% conversion rate
                  </p>
                </div>
                <DollarSign className="h-8 w-8 text-green-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Active Teachers
                  </p>
                  <p className="text-2xl font-bold">{stats?.activeTeachers || 0}</p>
                  <p className="text-xs text-blue-600 dark:text-blue-400">
                    Avg class: {stats?.averageClassSize || 0} students
                  </p>
                </div>
                <UserCheck className="h-8 w-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Satisfaction Score
                  </p>
                  <p className="text-2xl font-bold">{stats?.studentSatisfaction || 0}★</p>
                  <p className="text-xs text-green-600 dark:text-green-400">
                    Student feedback avg
                  </p>
                </div>
                <Award className="h-8 w-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Management Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-6">
          <TabsList className="grid w-full lg:w-auto grid-cols-3">
            <TabsTrigger value="overview">Performance Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Management</TabsTrigger>
            <TabsTrigger value="courses">Course Analytics</TabsTrigger>
          </TabsList>

          {/* Performance Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Institute Performance Metrics</CardTitle>
                  <CardDescription>Key indicators for this month</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Target className="h-5 w-5 text-blue-600" />
                        <span className="font-medium">Enrollment Target</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stats?.newEnrollments || 0}/50</div>
                        <div className="text-sm text-gray-600">{((stats?.newEnrollments || 0) / 50 * 100).toFixed(0)}% achieved</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <DollarSign className="h-5 w-5 text-green-600" />
                        <span className="font-medium">Revenue Target</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">₼{stats?.monthlyRevenue || 0}/₼15,000</div>
                        <div className="text-sm text-gray-600">{((stats?.monthlyRevenue || 0) / 15000 * 100).toFixed(0)}% achieved</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <Award className="h-5 w-5 text-yellow-600" />
                        <span className="font-medium">Quality Score</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stats?.studentSatisfaction || 0}/5.0</div>
                        <div className="text-sm text-gray-600">Student satisfaction</div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <TrendingUp className="h-5 w-5 text-purple-600" />
                        <span className="font-medium">Conversion Rate</span>
                      </div>
                      <div className="text-right">
                        <div className="font-bold">{stats?.conversionRate || 0}%</div>
                        <div className="text-sm text-gray-600">Lead to enrollment</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Institute Alerts & Notifications</CardTitle>
                  <CardDescription>Important updates requiring attention</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                      <AlertTriangle className="h-5 w-5 text-yellow-600" />
                      <div>
                        <div className="font-medium text-yellow-800 dark:text-yellow-200">
                          3 Teachers need performance review
                        </div>
                        <div className="text-sm text-yellow-600 dark:text-yellow-400">
                          Monthly evaluations due this week
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                      <CheckCircle className="h-5 w-5 text-green-600" />
                      <div>
                        <div className="font-medium text-green-800 dark:text-green-200">
                          Persian Advanced course fully booked
                        </div>
                        <div className="text-sm text-green-600 dark:text-green-400">
                          Consider opening additional sections
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <Clock className="h-5 w-5 text-blue-600" />
                      <div>
                        <div className="font-medium text-blue-800 dark:text-blue-200">
                          12 new student applications pending
                        </div>
                        <div className="text-sm text-blue-600 dark:text-blue-400">
                          Review and process applications
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Teacher Management Tab */}
          <TabsContent value="teachers" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search teachers..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Teacher</TableHead>
                      <TableHead>Students</TableHead>
                      <TableHead>Classes/Month</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Retention</TableHead>
                      <TableHead>Performance</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTeachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>
                          <div className="font-medium">{teacher.name}</div>
                        </TableCell>
                        <TableCell>{teacher.studentsAssigned}</TableCell>
                        <TableCell>{teacher.classesThisMonth}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${getPerformanceColor(teacher.averageRating)}`}>
                            {teacher.averageRating}★
                          </div>
                        </TableCell>
                        <TableCell>₼{teacher.totalRevenue}</TableCell>
                        <TableCell>{teacher.retentionRate}%</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(teacher.status)}>
                            {teacher.status.replace('_', ' ')}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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

          {/* Course Analytics Tab */}
          <TabsContent value="courses" className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search courses..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9 w-64"
                  />
                </div>
              </div>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create Course
              </Button>
            </div>

            <Card>
              <CardContent className="p-0">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Course</TableHead>
                      <TableHead>Language</TableHead>
                      <TableHead>Enrollments</TableHead>
                      <TableHead>Completion</TableHead>
                      <TableHead>Revenue</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Instructor</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredCourses.map((course) => (
                      <TableRow key={course.id}>
                        <TableCell>
                          <div className="font-medium">{course.title}</div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{course.language}</Badge>
                        </TableCell>
                        <TableCell>{course.enrollments}</TableCell>
                        <TableCell>{course.completionRate}%</TableCell>
                        <TableCell>₼{course.revenue}</TableCell>
                        <TableCell>
                          <div className={`font-medium ${getPerformanceColor(course.averageRating)}`}>
                            {course.averageRating}★
                          </div>
                        </TableCell>
                        <TableCell>{course.instructor}</TableCell>
                        <TableCell>
                          <Badge className={getStatusColor(course.status)}>
                            {course.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <Button variant="ghost" size="sm">
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button variant="ghost" size="sm">
                              <Edit className="h-4 w-4" />
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
        </Tabs>
      </div>
    </div>
  );
}