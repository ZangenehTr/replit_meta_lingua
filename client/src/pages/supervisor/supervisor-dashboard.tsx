import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  TrendingUp, 
  UserCheck, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BookOpen,
  Star
} from "lucide-react";

interface SupervisorStats {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  completionRate: number;
  qualityScore: number;
  pendingObservations: number;
  teacherRating: number;
  studentRetention: number;
}

export default function SupervisorDashboard() {
  const { data: stats, isLoading } = useQuery<SupervisorStats>({
    queryKey: ["/api/supervisor/dashboard-stats"],
  });

  const { data: recentObservations } = useQuery({
    queryKey: ["/api/supervision/recent-observations"],
  });

  const { data: teacherPerformance } = useQuery({
    queryKey: ["/api/supervision/teacher-performance"],
  });

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervision Dashboard</h1>
            <p className="text-gray-600 mt-2">Quality assurance and teacher performance monitoring</p>
          </div>
          <div className="flex space-x-3">
            <Button className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
              <ClipboardCheck className="h-4 w-4 mr-2" />
              New Observation
            </Button>
            <Button variant="outline">
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Review
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Teachers</p>
                  <p className="text-3xl font-bold">{stats?.totalTeachers || 15}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Students</p>
                  <p className="text-3xl font-bold">{stats?.totalStudents || 142}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Quality Score</p>
                  <p className="text-3xl font-bold">{stats?.qualityScore || 98.5}%</p>
                </div>
                <Star className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Pending Reviews</p>
                  <p className="text-3xl font-bold">{stats?.pendingObservations || 3}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
            <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
            <TabsTrigger value="management">Management Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Teacher Rating</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.teacherRating || 4.7}/5.0</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Student Retention</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.studentRetention || 92.1}%</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">High</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.completionRate || 87.3}%</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completed observation: Sarah Johnson (Persian A2)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending review: Ali Rezaei (Persian B1)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">New teacher evaluation scheduled</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Curriculum review meeting tomorrow</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance Overview</CardTitle>
                <CardDescription>Monitor and evaluate teacher effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        SJ
                      </div>
                      <div>
                        <p className="font-semibold">Sarah Johnson</p>
                        <p className="text-sm text-gray-600">Persian Language Teacher</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-800">4.9/5.0</Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        AR
                      </div>
                      <div>
                        <p className="font-semibold">Ali Rezaei</p>
                        <p className="text-sm text-gray-600">Persian Conversation Specialist</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-yellow-100 text-yellow-800">4.6/5.0</Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Schedule New Observation
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Observation Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Teaching Standards Compliance</span>
                    <Badge className="bg-green-100 text-green-800">98.5%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Student Satisfaction</span>
                    <Badge className="bg-blue-100 text-blue-800">4.8/5.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Lesson Plan Quality</span>
                    <Badge className="bg-purple-100 text-purple-800">92.1%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Teacher-Student Matching</h3>
                  <p className="text-sm text-gray-600 mb-4">Assign teachers to students based on compatibility</p>
                  <Button className="w-full">Access System</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Class Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Schedule and manage class sessions</p>
                  <Button className="w-full">Manage Classes</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <ClipboardCheck className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quality Assurance</h3>
                  <p className="text-sm text-gray-600 mb-4">Monitor teaching quality and compliance</p>
                  <Button className="w-full">View Reports</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}