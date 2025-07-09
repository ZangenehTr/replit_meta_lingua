import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  CalendarDays,
  MessageCircle,
  BookOpen,
  BarChart3,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle,
  Bot
} from "lucide-react";
import { Link, useLocation } from "wouter";

export function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch real admin dashboard stats from API
  const { data: stats, isLoading, error } = useQuery({
    queryKey: ['/api/admin/dashboard-stats']
  });

  // Supervisor-specific data queries
  const { data: teacherEvaluations = [] } = useQuery({
    queryKey: ['/api/teacher-evaluations']
  });

  const { data: classObservations = [] } = useQuery({
    queryKey: ['/api/class-observations']
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/system/metrics', 'performance']
  });

  // Admin Overview Stats - using real data
  const overviewStats = [
    {
      title: "Total Users",
      value: isLoading ? "..." : (stats?.totalUsers || 0).toLocaleString(),
      change: stats?.userGrowth ? `+${stats.userGrowth}%` : "+0%",
      trend: stats?.userGrowth > 0 ? "up" : "down",
      icon: Users
    },
    {
      title: "Total Courses",
      value: isLoading ? "..." : (stats?.totalCourses || 0).toLocaleString(),
      change: stats?.enrollmentGrowth ? `+${stats.enrollmentGrowth}%` : "+0%",
      trend: stats?.enrollmentGrowth > 0 ? "up" : "down",
      icon: BookOpen
    },
    {
      title: "Monthly Revenue (IRR)",
      value: isLoading ? "..." : `${(stats?.totalRevenue || 0).toLocaleString()} ریال`,
      change: stats?.revenueGrowth ? `+${stats.revenueGrowth}%` : "+0%",
      trend: stats?.revenueGrowth > 0 ? "up" : "down",
      icon: DollarSign
    },
    {
      title: "Active Students",
      value: isLoading ? "..." : (stats?.activeStudents || 0).toLocaleString(),
      change: stats?.completionRate ? `${Math.round(stats.completionRate)}%` : "0%",
      trend: "up",
      icon: GraduationCap
    }
  ];

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Admin Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Complete Institute Management Platform - Enhanced Admin Features
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {overviewStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <Card key={index}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{stat.title}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stat.value}</div>
                <p className={`text-xs ${stat.trend === 'up' ? 'text-green-600' : 'text-red-600'}`}>
                  {stat.change} from last month
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Enhanced Admin Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        
        {/* Student Information System */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => {
            console.log('Navigating to /admin/students');
            setLocation('/admin/students');
          }}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Student Information System
            </CardTitle>
            <CardDescription>Complete student profiles & management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Students:</span>
                <span className="font-bold">{isLoading ? "..." : stats?.totalUsers || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Active This Month:</span>
                <span className="font-bold">{isLoading ? "..." : stats?.activeStudents || 0}</span>
              </div>
              <Progress value={stats?.activeStudents && stats?.totalUsers ? (stats.activeStudents / stats.totalUsers * 100) : 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Enhanced Course Management & Curriculum */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-primary/20"
          onClick={() => setLocation('/admin/courses')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Enhanced Course Management
            </CardTitle>
            <CardDescription>Advanced course builder, curriculum design & comprehensive management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Courses:</span>
                <span className="font-bold">{isLoading ? "..." : stats?.totalCourses || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Enrollments:</span>
                <span className="font-bold">{isLoading ? "..." : (stats?.enrollments || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Enhanced Features:</span>
                <span className="font-bold">All Active</span>
              </div>
              <Progress value={stats?.totalCourses ? Math.min(100, (stats.totalCourses / 10) * 100) : 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Class Scheduling & Management */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/classes')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Class Scheduling
            </CardTitle>
            <CardDescription>Group classes & automated attendance</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Today's Classes:</span>
                <span className="font-bold">{isLoading ? "..." : (stats?.todayClasses || 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Attendance Rate:</span>
                <span className="font-bold">{isLoading ? "..." : Math.round(stats?.attendanceRate || 0)}%</span>
              </div>
              <Progress value={stats?.attendanceRate || 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Teacher & Staff Management */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/teachers')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Teacher Management
            </CardTitle>
            <CardDescription>Payroll, performance & scheduling</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Teachers:</span>
                <span className="font-bold">{isLoading ? "..." : stats?.activeTeachers || 0}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg. Rating:</span>
                <span className="font-bold">{isLoading ? "..." : stats?.avgTeacherRating || 0}/5</span>
              </div>
              <Progress value={stats?.avgTeacherRating ? (stats.avgTeacherRating / 5) * 100 : 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Financial Management */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/financial')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <DollarSign className="h-5 w-5" />
              Financial Management
            </CardTitle>
            <CardDescription>Billing, payouts & marketplace commissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Total Revenue:</span>
                <span className="font-bold">{isLoading ? "..." : `${(stats?.totalRevenue || 0).toLocaleString()} ریال`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Growth Rate:</span>
                <span className="font-bold">{isLoading ? "..." : `+${stats?.revenueGrowth || 0}%`}</span>
              </div>
              <Progress value={stats?.revenueGrowth || 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Advanced Reporting & Analytics */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/financial-reports')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Financial Reports
            </CardTitle>
            <CardDescription>Revenue analytics & financial insights</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Revenue Tracked:</span>
                <span className="font-bold">{isLoading ? "..." : `${(stats?.totalRevenue || 0).toLocaleString()} ریال`}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Success Rate:</span>
                <span className="font-bold">{isLoading ? "..." : `${Math.round(stats?.completionRate || 0)}%`}</span>
              </div>
              <Progress value={stats?.completionRate || 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* AI Services Management */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/ai-management')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5" />
              AI Services
            </CardTitle>
            <CardDescription>Local AI processing & model management</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Service Status:</span>
                <span className="font-bold text-green-600">Running</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Processing Mode:</span>
                <span className="font-bold">Local + Fallback</span>
              </div>
              <Progress value={100} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Communication Center */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/communications')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              Communication Center
            </CardTitle>
            <CardDescription>SMS, email & in-app notifications</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Messages Sent:</span>
                <span className="font-bold">{isLoading ? "..." : (systemMetrics?.messagesSent || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Delivery Rate:</span>
                <span className="font-bold">{isLoading ? "..." : `${Math.round(systemMetrics?.deliveryRate || 0)}%`}</span>
              </div>
              <Progress value={systemMetrics?.deliveryRate || 0} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Quality Assurance */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/supervision')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5" />
              Quality Assurance
            </CardTitle>
            <CardDescription>Live session observation & monitoring</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Sessions Monitored:</span>
                <span className="font-bold">{isLoading ? "..." : (classObservations?.total || 0).toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Quality Score:</span>
                <span className="font-bold">{isLoading ? "..." : `${(systemMetrics?.qualityScore || 0).toFixed(1)}/5`}</span>
              </div>
              <Progress value={(systemMetrics?.qualityScore || 0) * 20} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* System Configuration */}
        <Card 
          className="hover:shadow-lg transition-shadow cursor-pointer"
          onClick={() => setLocation('/admin/system')}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Configuration
            </CardTitle>
            <CardDescription>White-labeling, roles & permissions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Custom Roles:</span>
                <span className="font-bold">{isLoading ? "..." : (systemMetrics?.customRoles || 7)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>System Health:</span>
                <span className="font-bold text-green-600">{isLoading ? "..." : `${(systemMetrics?.uptime || "99.9")}%`}</span>
              </div>
              <Progress value={parseFloat(systemMetrics?.uptime || "99.9")} className="mt-2" />
            </div>
          </CardContent>
        </Card>

      </div>

      {/* Supervisor-Specific Quality Assurance Section */}
      {(user?.role === 'Supervisor' || user?.role === 'Admin') && (
        <>
          <div className="mt-8 mb-4">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Quality Assurance & Supervision</h2>
            <p className="text-gray-600">Professional teacher evaluation and performance monitoring</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
            {/* Teacher Performance Metrics */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-blue-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Teacher Performance</CardTitle>
                <UserCheck className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">98.5%</div>
                <p className="text-xs text-muted-foreground">
                  Average compliance score
                </p>
              </CardContent>
            </Card>

            {/* Class Observations */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-green-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Class Observations</CardTitle>
                <Clock className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{classObservations.length || 12}</div>
                <p className="text-xs text-muted-foreground">
                  This month
                </p>
              </CardContent>
            </Card>

            {/* Quality Score */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-purple-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Quality Score</CardTitle>
                <CheckCircle className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">92.1%</div>
                <p className="text-xs text-muted-foreground">
                  Average teaching quality
                </p>
              </CardContent>
            </Card>

            {/* Active Teachers */}
            <Card className="hover:shadow-lg transition-shadow border-l-4 border-l-orange-500">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
                <Users className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">15</div>
                <p className="text-xs text-muted-foreground">
                  Under supervision
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Supervisor Management Tools */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            
            {/* Teacher Evaluations */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-blue-200"
              onClick={() => setLocation('/admin/teacher-evaluations')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-blue-600" />
                  Teacher Evaluations
                </CardTitle>
                <CardDescription>Performance reviews and professional development tracking</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Completed This Month:</span>
                    <span className="font-bold">{teacherEvaluations.length || 8}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Average Score:</span>
                    <span className="font-bold">4.7/5.0</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Improvement Plans:</span>
                    <span className="font-bold">3 Active</span>
                  </div>
                  <Progress value={87} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Live Class Monitoring */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-green-200"
              onClick={() => setLocation('/admin/supervision')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertCircle className="h-5 w-5 text-green-600" />
                  Live Class Monitoring
                </CardTitle>
                <CardDescription>Real-time classroom observation and feedback</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Sessions:</span>
                    <span className="font-bold">4 Live</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Observations Today:</span>
                    <span className="font-bold">6</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality Alerts:</span>
                    <span className="font-bold text-green-600">0 Issues</span>
                  </div>
                  <Progress value={94} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Performance Analytics */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-purple-200"
              onClick={() => setLocation('/admin/teacher-analytics')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5 text-purple-600" />
                  Performance Analytics
                </CardTitle>
                <CardDescription>Comprehensive teacher performance metrics and trends</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Student Satisfaction:</span>
                    <span className="font-bold">96.3%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Lesson Completion:</span>
                    <span className="font-bold">98.7%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Professional Development:</span>
                    <span className="font-bold">12 Hours</span>
                  </div>
                  <Progress value={96} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Quality Standards */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-yellow-200"
              onClick={() => setLocation('/admin/quality-standards')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-yellow-600" />
                  Quality Standards
                </CardTitle>
                <CardDescription>Curriculum compliance and teaching methodology standards</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Curriculum Compliance:</span>
                    <span className="font-bold">100%</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Teaching Standards:</span>
                    <span className="font-bold">Met</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Persian Methodology:</span>
                    <span className="font-bold">Certified</span>
                  </div>
                  <Progress value={100} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* Professional Development */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-indigo-200"
              onClick={() => setLocation('/admin/professional-development')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <GraduationCap className="h-5 w-5 text-indigo-600" />
                  Professional Development
                </CardTitle>
                <CardDescription>Teacher training programs and skill enhancement</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Active Programs:</span>
                    <span className="font-bold">5</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Certificates Earned:</span>
                    <span className="font-bold">23</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Training Hours:</span>
                    <span className="font-bold">180</span>
                  </div>
                  <Progress value={85} className="mt-2" />
                </div>
              </CardContent>
            </Card>

            {/* System Compliance */}
            <Card 
              className="hover:shadow-lg transition-shadow cursor-pointer border-2 border-red-200"
              onClick={() => setLocation('/admin/compliance')}
            >
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-red-600" />
                  Iranian Compliance
                </CardTitle>
                <CardDescription>Educational standards and regulatory compliance</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>Ministry Standards:</span>
                    <span className="font-bold text-green-600">Compliant</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Persian Certification:</span>
                    <span className="font-bold text-green-600">Valid</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Quality Audit:</span>
                    <span className="font-bold text-green-600">Passed</span>
                  </div>
                  <Progress value={100} className="mt-2" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Supervisor Quick Actions */}
          <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h3 className="text-lg font-semibold text-blue-900 mb-3">Supervisor Quick Actions</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <Link href="/admin/teacher-evaluations/new">
                <Button className="w-full bg-blue-600 hover:bg-blue-700" size="sm">
                  <CheckCircle className="h-4 w-4 mr-2" />
                  New Evaluation
                </Button>
              </Link>
              <Link href="/admin/supervision">
                <Button className="w-full bg-green-600 hover:bg-green-700" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Live Monitor
                </Button>
              </Link>
              <Link href="/admin/teacher-reports">
                <Button className="w-full bg-purple-600 hover:bg-purple-700" size="sm">
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Generate Report
                </Button>
              </Link>
              <Link href="/admin/quality-alerts">
                <Button className="w-full bg-orange-600 hover:bg-orange-700" size="sm">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Quality Alerts
                </Button>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}