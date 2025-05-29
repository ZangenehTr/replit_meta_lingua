import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { 
  Users, 
  GraduationCap, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  MessageCircle,
  BookOpen,
  BarChart3,
  UserCheck,
  Clock,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import { Link } from "wouter";

export function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { user } = useAuth();

  // Admin Overview Stats
  const overviewStats = [
    {
      title: t('totalStudents'),
      value: "1,247",
      change: "+12%",
      trend: "up",
      icon: Users
    },
    {
      title: t('activeTeachers'),
      value: "89",
      change: "+5%",
      trend: "up",
      icon: GraduationCap
    },
    {
      title: t('monthlyRevenue'),
      value: "₹4,52,000",
      change: "+18%",
      trend: "up",
      icon: DollarSign
    },
    {
      title: t('completionRate'),
      value: "87%",
      change: "+3%",
      trend: "up",
      icon: TrendingUp
    }
  ];

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('adminDashboard')}</h1>
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
        <Link href="/admin/students">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                {t('studentInformationSystem')}
              </CardTitle>
              <CardDescription>Complete student profiles & management</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Total Students:</span>
                  <span className="font-bold">1,247</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Active This Month:</span>
                  <span className="font-bold">1,189</span>
                </div>
                <Progress value={95} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Course & Curriculum Management */}
        <Link href="/admin/courses">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BookOpen className="h-5 w-5" />
                {t('courseManagement')}
              </CardTitle>
              <CardDescription>Advanced course builder & curriculum</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Courses:</span>
                  <span className="font-bold">67</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Total Enrollments:</span>
                  <span className="font-bold">3,842</span>
                </div>
                <Progress value={78} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Class Scheduling & Management */}
        <Link href="/admin/classes">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                {t('classScheduling')}
              </CardTitle>
              <CardDescription>Group classes & automated attendance</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Today's Classes:</span>
                  <span className="font-bold">23</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Attendance Rate:</span>
                  <span className="font-bold">89%</span>
                </div>
                <Progress value={89} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Teacher & Staff Management */}
        <Link href="/admin/teachers">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <GraduationCap className="h-5 w-5" />
                {t('teacherManagement')}
              </CardTitle>
              <CardDescription>Payroll, performance & scheduling</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Active Teachers:</span>
                  <span className="font-bold">89</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Avg. Rating:</span>
                  <span className="font-bold">4.7/5</span>
                </div>
                <Progress value={94} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Financial Management */}
        <Link href="/admin/financial">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5" />
                {t('financialManagement')}
              </CardTitle>
              <CardDescription>Billing, payouts & marketplace commissions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Monthly Revenue:</span>
                  <span className="font-bold">₹4,52,000</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Pending Payments:</span>
                  <span className="font-bold">₹23,400</span>
                </div>
                <Progress value={82} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Advanced Reporting & Analytics */}
        <Link href="/admin/reports">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                {t('reportsAnalytics')}
              </CardTitle>
              <CardDescription>Complex SQL analytics & insights</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Reports Generated:</span>
                  <span className="font-bold">147</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Data Points:</span>
                  <span className="font-bold">2.3M</span>
                </div>
                <Progress value={67} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Communication Center */}
        <Link href="/admin/communications">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="h-5 w-5" />
                {t('communicationCenter')}
              </CardTitle>
              <CardDescription>SMS, email & in-app notifications</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Messages Sent:</span>
                  <span className="font-bold">5,432</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Delivery Rate:</span>
                  <span className="font-bold">97%</span>
                </div>
                <Progress value={97} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* Quality Assurance */}
        <Link href="/admin/supervision">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5" />
                {t('qualityAssurance')}
              </CardTitle>
              <CardDescription>Live session observation & monitoring</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>Sessions Monitored:</span>
                  <span className="font-bold">234</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>Quality Score:</span>
                  <span className="font-bold">4.6/5</span>
                </div>
                <Progress value={92} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

        {/* System Configuration */}
        <Link href="/admin/system">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
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
                  <span className="font-bold">12</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span>System Health:</span>
                  <span className="font-bold text-green-600">99.9%</span>
                </div>
                <Progress value={99} className="mt-2" />
              </div>
            </CardContent>
          </Card>
        </Link>

      </div>
    </div>
  );
}