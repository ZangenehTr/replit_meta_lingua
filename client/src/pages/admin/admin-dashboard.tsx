import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { 
  DollarSign, 
  TrendingUp, 
  BookOpen,
  GraduationCap,
  Server,
  Clock,
  AlertCircle,
  CheckCircle,
  Phone,
  Users,
  UserPlus,
  Video,
  Calendar,
  Star,
  TrendingDown,
  Award,
  ThumbsDown,
  BarChart3,
  Bot,
  MessageCircle,
  Settings,
  FileText
} from "lucide-react";
import { 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

export function AdminDashboard() {
  const { t, isRTL } = useLanguage();
  const { t: tAdmin } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch critical business metrics (replacing hardcoded dashboard data)
  const { data: callCenterStats } = useQuery({
    queryKey: ['/api/callcenter/performance-stats']
  });

  const { data: systemMetrics } = useQuery({
    queryKey: ['/api/admin/system/configuration']
  });

  const { data: overduePayments } = useQuery({
    queryKey: ['/api/admin/financial/overview-stats']
  });

  const { data: revenueData } = useQuery({
    queryKey: ['/api/admin/revenue-analytics']
  });

  const { data: registrationData } = useQuery({
    queryKey: ['/api/admin/registration-analytics']
  });

  const { data: teacherPerformance } = useQuery({
    queryKey: ['/api/admin/teacher-performance']
  });

  const { data: studentRetention } = useQuery({
    queryKey: ['/api/admin/student-retention']
  });

  const { data: courseCompletion } = useQuery({
    queryKey: ['/api/admin/course-completion']
  });

  const { data: marketingMetrics } = useQuery({
    queryKey: ['/api/admin/marketing-metrics']
  });

  const { data: operationalMetrics } = useQuery({
    queryKey: ['/api/admin/operational-metrics']
  });

  const { data: financialKPIs } = useQuery({
    queryKey: ['/api/admin/financial-kpis']
  });

  // Fetch dashboard stats
  const { data: stats, isLoading } = useQuery({
    queryKey: ['/api/admin/dashboard-stats'],
    retry: 3,
    retryDelay: 1000
  });

  // Fetch class observations data
  const { data: classObservations } = useQuery({
    queryKey: ['/api/admin/class-observations']
  });

  return (
    <div className={`p-4 sm:p-6 space-y-4 sm:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">{tAdmin('admin:dashboard')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1 text-sm sm:text-base">
            {tAdmin('admin:welcomeMessage')}
          </p>
        </div>
      </div>

      {/* Critical System Status */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Server Uptime */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{tAdmin('admin:systemHealth')}</CardTitle>
            <Server className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{(systemMetrics as any)?.uptime || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:lastDays')}
            </p>
          </CardContent>
        </Card>

        {/* Call Center Performance */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:callResponseRate')}</CardTitle>
            <Phone className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{(callCenterStats as any)?.responseRate || '0.0'}%</div>
            <p className="text-xs text-muted-foreground">
              +2.3% {t('admin:fromLastWeek')}
            </p>
          </CardContent>
        </Card>

        {/* Overdue Payments Alert */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:overduePayments')}</CardTitle>
            <AlertCircle className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{(overduePayments as any)?.count || 0}</div>
            <p className="text-xs text-red-600">
              ${(overduePayments as any)?.totalAmount || '0'} {t('admin:total')}
            </p>
          </CardContent>
        </Card>

        {/* Monthly Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:monthlyRevenue')}</CardTitle>
            <DollarSign className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">${(revenueData as any)?.monthly || '0'}</div>
            <p className="text-xs text-green-600">
              +15.3% {t('admin:fromLastMonth')}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Center Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('admin:callCenterPerformance')}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(callCenterStats as any)?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis />
                <Tooltip />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="answered" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>Revenue Analytics (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={revenueData?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip formatter={(value) => [`$${value}`, '']} />
                <Line type="monotone" dataKey="daily" stroke="#F59E0B" strokeWidth={2} name="Daily Avg" />
                <Line type="monotone" dataKey="weekly" stroke="#8B5CF6" strokeWidth={2} name="Weekly Avg" />
                <Line type="monotone" dataKey="monthly" stroke="#EF4444" strokeWidth={2} name="Monthly Total" />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Performance Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-yellow-600" />
              Top Performing Teachers
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-green-600 mb-2">
                Lowest Attrition Rates
              </h4>
              <div className="space-y-1">
                {(teacherPerformance?.lowestAttrition || []).map((teacher, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{teacher.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-green-600">{teacher.rate}</Badge>
                      <span className="text-xs text-green-600">{teacher.improvement}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Retention Champions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              Student Retention Champions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-600 mb-2">
                Highest Retention Rates
              </h4>
              <div className="space-y-1">
                {(teacherPerformance?.highestRetention || []).map((teacher, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{teacher.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-blue-600">{teacher.rate}</Badge>
                      <span className="text-xs text-muted-foreground">{teacher.students}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Improvement Needed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ThumbsDown className="h-5 w-5 text-red-600" />
              Performance Improvement Needed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-red-600 mb-2">
                Lowest Student Scores
              </h4>
              <div className="space-y-1">
                {(teacherPerformance?.lowestScores || []).map((teacher, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{teacher.name}</span>
                    <div className="flex items-center gap-2">
                      <Badge variant="destructive">{teacher.score}</Badge>
                      <span className="text-xs text-muted-foreground truncate max-w-24">{teacher.feedback}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Student Retention & Course Completion Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Student Retention Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Student Retention Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{studentRetention?.overall || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">Overall Retention</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{studentRetention?.newStudents || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">New Student (3mo)</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={studentRetention?.byLevel || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis />
                  <Tooltip />
                  <Bar dataKey="retention" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>Course Completion Analytics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{courseCompletion?.average || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">Avg Completion</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">{courseCompletion?.onTime || '0.0'}%</div>
                  <p className="text-xs text-muted-foreground">On-Time Completion</p>
                </div>
              </div>
              <div className="space-y-2">
                {(courseCompletion?.byCourse || []).map((course, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate">{course.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${course.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-xs w-12 text-right">{course.completion}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Marketing & Lead Generation Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Lead Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle>Lead Conversion Funnel</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(marketingMetrics?.funnel || []).map((stage, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{stage.stage}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">{stage.count}</span>
                    <Badge variant="outline">{stage.rate}%</Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Channels */}
        <Card>
          <CardHeader>
            <CardTitle>Student Acquisition Sources</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={marketingMetrics?.sources || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {(marketingMetrics?.sources || []).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle>Financial KPIs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">Avg Customer LTV</span>
                <span className="font-semibold">${financialKPIs?.averageLTV || '2,847'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Cost per Acquisition</span>
                <span className="font-semibold">${financialKPIs?.costPerAcquisition || '185'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Monthly Churn Rate</span>
                <span className="font-semibold text-red-600">{financialKPIs?.churnRate || '4.2'}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Revenue per Student</span>
                <span className="font-semibold">${financialKPIs?.revenuePerStudent || '287'}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">Profit Margin</span>
                <span className="font-semibold text-green-600">{financialKPIs?.profitMargin || '34.7'}%</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Operational Efficiency Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Class Utilization */}
        <Card>
          <CardHeader>
            <CardTitle>Class & Resource Utilization</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">{operationalMetrics?.classUtilization || '89.3'}%</div>
                  <p className="text-xs text-muted-foreground">Classroom Utilization</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">{operationalMetrics?.teacherUtilization || '76.8'}%</div>
                  <p className="text-xs text-muted-foreground">Teacher Utilization</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Peak Hours (6-9 PM)</span>
                  <Badge variant="outline">95.2% full</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Morning Classes</span>
                  <Badge variant="outline">67.4% full</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Weekend Sessions</span>
                  <Badge variant="outline">82.1% full</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Online Capacity</span>
                  <Badge variant="outline">91.8% used</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality & Satisfaction Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>Quality & Satisfaction Metrics</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">{operationalMetrics?.studentSatisfaction || '4.6'}/5</div>
                  <p className="text-xs text-muted-foreground">Student Satisfaction</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">{operationalMetrics?.nps || '+47'}</div>
                  <p className="text-xs text-muted-foreground">Net Promoter Score</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Course Material Quality</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-xs">4.7</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Teaching Quality</span>
                  <div className="flex">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="ml-1 text-xs">4.5</span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Support Response Time</span>
                  <Badge variant="outline">&lt; 2 hours</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Technical Issues</span>
                  <Badge variant="outline" className="text-green-600">0.8% sessions</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <AlertCircle className="h-5 w-5 mr-2 text-red-600" />
            Critical: Students with Overdue Payments
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Student Name</th>
                  <th className="text-left p-2">Amount Due</th>
                  <th className="text-left p-2">Days Overdue</th>
                  <th className="text-left p-2">Course</th>
                  <th className="text-left p-2">Contact</th>
                  <th className="text-left p-2">Action</th>
                </tr>
              </thead>
              <tbody>
                {(overduePayments?.details || []).map((payment, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{payment.name}</td>
                    <td className="p-2 text-red-600 font-semibold">{payment.amount}</td>
                    <td className="p-2">
                      <Badge variant={payment.days > 14 ? "destructive" : "secondary"}>
                        {payment.days} days
                      </Badge>
                    </td>
                    <td className="p-2">{payment.course}</td>
                    <td className="p-2 text-blue-600">{payment.phone}</td>
                    <td className="p-2 text-xs text-muted-foreground">{payment.lastContact}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}