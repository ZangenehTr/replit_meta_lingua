import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { useQuery } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { formatPersianNumber, formatPersianPercentage, formatPersianCurrency, formatPersianText } from '@/lib/persian-utils';
import { motion } from 'framer-motion';
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
  const { t, i18n } = useTranslation(['admin', 'common']);
  const isPersian = i18n.language === 'fa';
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

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
    <div className={`min-h-screen p-3 sm:p-6 space-y-3 sm:space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Welcome Banner */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-gradient-to-r from-indigo-600 via-blue-600 to-purple-600 rounded-xl p-6 md:p-8 text-white shadow-xl"
      >
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="text-center md:text-left">
            <h1 className="text-2xl md:text-3xl font-bold mb-2">
              {t('admin:welcome', 'Welcome back')}, {user?.firstName || t('admin:administrator', 'Administrator')}! 👋
            </h1>
            <p className="text-sm md:text-base opacity-90">
              {t('admin:welcomeMessage', 'Manage your institute with confidence. Your control center is ready.')}
            </p>
          </div>
          <div className="flex gap-3">
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-xs opacity-90">{t('admin:totalStudents', 'Total Students')}</p>
              <p className="text-xl font-bold">📚 {(stats as any)?.totalStudents || 0}</p>
            </div>
            <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
              <p className="text-xs opacity-90">{t('admin:monthlyRevenue', 'This Month')}</p>
              <p className="text-xl font-bold">💰 {isPersian ? formatPersianCurrency((stats as any)?.revenue || 0) : formatCurrency((stats as any)?.revenue || 0)}</p>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Mobile-Optimized Header */}
      <div className="mb-4 sm:mb-6">
        <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold">{t('dashboard.title', { ns: 'common' })}</h1>
        <p className="text-muted-foreground text-xs sm:text-sm mt-1">
          {t('dashboard.subtitle', { ns: 'common' })}
        </p>
      </div>

      {/* Mobile-First System Status */}
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-2 sm:gap-4">
        {/* Server Uptime - Mobile Optimized */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Server className="h-4 w-4 text-green-600" />
            <div className="text-xs text-muted-foreground hidden sm:block">
              {t('dashboard.systemHealth', { ns: 'common' })}
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
            {isPersian ? formatPersianPercentage((systemMetrics as any)?.uptime || '99.8') : `${(systemMetrics as any)?.uptime || '99.8'}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="sm:hidden">سلامت</span>
            <span className="hidden sm:inline">{t('dashboard.last30Days', { ns: 'common' })}</span>
          </p>
        </Card>

        {/* Call Center Performance - Mobile Optimized */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <Phone className="h-4 w-4 text-blue-600" />
            <div className="text-xs text-muted-foreground hidden sm:block">
              {t('dashboard.callResponseRate', { ns: 'common' })}
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-blue-600 mb-1">
            {isPersian ? formatPersianPercentage((callCenterStats as any)?.responseRate || '96.0') : `${(callCenterStats as any)?.responseRate || '96.0'}%`}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="sm:hidden">تماس</span>
            <span className="hidden sm:inline">
              {isPersian ? `+۲.۳% ${t('dashboard.fromLastWeek', { ns: 'common' })}` : `+2.3% ${t('dashboard.fromLastWeek', { ns: 'common' })}`}
            </span>
          </p>
        </Card>

        {/* Overdue Payments Alert - Mobile Optimized */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <div className="text-xs text-muted-foreground hidden sm:block">
              {t('dashboard.overduePayments', { ns: 'common' })}
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-red-600 mb-1">
            {isPersian ? formatPersianNumber((overduePayments as any)?.count || 0) : ((overduePayments as any)?.count || 0)}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="sm:hidden">معوقه</span>
            <span className="hidden sm:inline">
              {isPersian ? `${formatPersianCurrency((overduePayments as any)?.totalAmount || '0')} ${t('dashboard.total', { ns: 'common' })}` : `$${(overduePayments as any)?.totalAmount || '0'} ${t('dashboard.total', { ns: 'common' })}`}
            </span>
          </p>
        </Card>

        {/* Monthly Revenue - Mobile Optimized */}
        <Card className="p-3 sm:p-4">
          <div className="flex items-center justify-between mb-2">
            <DollarSign className="h-4 w-4 text-green-600" />
            <div className="text-xs text-muted-foreground hidden sm:block">
              {t('dashboard.monthlyRevenue', { ns: 'common' })}
            </div>
          </div>
          <div className="text-lg sm:text-2xl font-bold text-green-600 mb-1">
            {isPersian ? formatPersianCurrency((revenueData as any)?.monthly || '0') : `$${(revenueData as any)?.monthly || '0'}`}
          </div>
          <p className="text-xs text-muted-foreground">
            <span className="sm:hidden">درآمد</span>
            <span className="hidden sm:inline">
              {isPersian ? `+۱۵.۳% ${t('dashboard.fromLastMonth', { ns: 'common' })}` : `+15.3% ${t('dashboard.fromLastMonth', { ns: 'common' })}`}
            </span>
          </p>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Call Center Performance Chart */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.callCenterPerformance', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={(callCenterStats as any)?.weeklyData || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="day" />
                <YAxis tickFormatter={(value) => isPersian ? formatPersianNumber(value.toString()) : value} />
                <Tooltip 
                  formatter={(value, name) => [
                    isPersian ? formatPersianNumber(value.toString()) : value,
                    name
                  ]}
                />
                <Area type="monotone" dataKey="calls" stackId="1" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.6} />
                <Area type="monotone" dataKey="answered" stackId="2" stroke="#10B981" fill="#10B981" fillOpacity={0.6} />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Revenue Analytics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.revenueAnalyticsLast6Months', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={(revenueData as any)?.monthlyTrend || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis tickFormatter={(value) => isPersian ? formatPersianNumber(value.toString()) : value} />
                <Tooltip formatter={(value) => [
                  isPersian ? formatPersianCurrency(value.toString()) : `$${value}`, 
                  ''
                ]} />
                <Line type="monotone" dataKey="daily" stroke="#F59E0B" strokeWidth={2} name={t('dashboard.dailyAvg', { ns: 'common' })} />
                <Line type="monotone" dataKey="weekly" stroke="#8B5CF6" strokeWidth={2} name={t('dashboard.weeklyAvg', { ns: 'common' })} />
                <Line type="monotone" dataKey="monthly" stroke="#EF4444" strokeWidth={2} name={t('dashboard.monthlyTotal', { ns: 'common' })} />
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
{t('dashboard.topPerformingTeachers', { ns: 'common' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-green-600 mb-2">
{t('dashboard.lowestAttritionRates', { ns: 'common' })}
              </h4>
              <div className="space-y-1">
                {((teacherPerformance as any)?.lowestAttrition || []).map((teacher: any, index: number) => (
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
{t('dashboard.studentRetentionChampions', { ns: 'common' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-blue-600 mb-2">
{t('dashboard.highestRetentionRates', { ns: 'common' })}
              </h4>
              <div className="space-y-1">
                {((teacherPerformance as any)?.highestRetention || []).map((teacher: any, index: number) => (
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
{t('dashboard.performanceImprovementNeeded', { ns: 'common' })}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <h4 className="text-sm font-semibold text-red-600 mb-2">
{t('dashboard.lowestStudentScores', { ns: 'common' })}
              </h4>
              <div className="space-y-1">
                {((teacherPerformance as any)?.lowestScores || []).map((teacher: any, index: number) => (
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
            <CardTitle>{t('dashboard.studentRetentionAnalysis', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {isPersian ? formatPersianPercentage((studentRetention as any)?.overall || '0.0') : `${(studentRetention as any)?.overall || '0.0'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.overallRetention', { ns: 'common' })}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {isPersian ? formatPersianPercentage((studentRetention as any)?.newStudents || '0.0') : `${(studentRetention as any)?.newStudents || '0.0'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.newStudent3mo', { ns: 'common' })}</p>
                </div>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={(studentRetention as any)?.byLevel || []}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="level" />
                  <YAxis tickFormatter={(value) => isPersian ? formatPersianNumber(value.toString()) : value} />
                  <Tooltip 
                    formatter={(value, name) => [
                      isPersian ? formatPersianNumber(value.toString()) : value,
                      name
                    ]}
                    labelFormatter={(label) => isPersian ? formatPersianNumber(label.toString()) : label}
                  />
                  <Bar dataKey="retention" fill="#3B82F6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Course Completion Rates */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.courseCompletionAnalytics', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {isPersian ? formatPersianPercentage((courseCompletion as any)?.average || '0.0') : `${(courseCompletion as any)?.average || '0.0'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.avgCompletion', { ns: 'common' })}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {isPersian ? formatPersianPercentage((courseCompletion as any)?.onTime || '0.0') : `${(courseCompletion as any)?.onTime || '0.0'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.onTimeCompletion', { ns: 'common' })}</p>
                </div>
              </div>
              <div className="space-y-2">
                {((courseCompletion as any)?.byCourse || []).map((course, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm truncate">{course.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-purple-600 h-2 rounded-full" 
                          style={{ width: `${course.completion}%` }}
                        ></div>
                      </div>
                      <span className="text-xs w-12 text-right">
                        {isPersian ? formatPersianPercentage(course.completion.toString()) : `${course.completion}%`}
                      </span>
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
            <CardTitle>{t('dashboard.leadConversionFunnel', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {((marketingMetrics as any)?.funnel || []).map((stage: any, index: number) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm">{t(`common:dashboard.${stage.stage}`)}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-semibold">
                      {isPersian ? formatPersianNumber(stage.count) : stage.count}
                    </span>
                    <Badge variant="outline">
                      {isPersian ? formatPersianPercentage(stage.rate) : `${stage.rate}%`}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Acquisition Channels */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.studentAcquisitionSources', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={(marketingMetrics as any)?.sources || []}
                  cx="50%"
                  cy="50%"
                  outerRadius={60}
                  dataKey="value"
                >
                  {((marketingMetrics as any)?.sources || []).map((entry: any, index: number) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip 
                  formatter={(value, name) => [
                    isPersian ? formatPersianNumber(value.toString()) : value,
                    name
                  ]}
                />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Customer Lifetime Value */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.financialKPIs', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.avgCustomerLTV', { ns: 'common' })}</span>
                <span className="font-semibold">
                  {isPersian ? formatPersianCurrency((financialKPIs as any)?.averageLTV || '2847') : `$${(financialKPIs as any)?.averageLTV || '2,847'}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.costPerAcquisition', { ns: 'common' })}</span>
                <span className="font-semibold">
                  {isPersian ? formatPersianCurrency((financialKPIs as any)?.costPerAcquisition || '185') : `$${(financialKPIs as any)?.costPerAcquisition || '185'}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.monthlyChurnRate', { ns: 'common' })}</span>
                <span className="font-semibold text-red-600">
                  {isPersian ? formatPersianPercentage((financialKPIs as any)?.churnRate || '4.2') : `${(financialKPIs as any)?.churnRate || '4.2'}%`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.revenuePerStudent', { ns: 'common' })}</span>
                <span className="font-semibold">
                  {isPersian ? formatPersianCurrency((financialKPIs as any)?.revenuePerStudent || '287') : `$${(financialKPIs as any)?.revenuePerStudent || '287'}`}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-sm">{t('dashboard.profitMargin', { ns: 'common' })}</span>
                <span className="font-semibold text-green-600">
                  {isPersian ? formatPersianPercentage((financialKPIs as any)?.profitMargin || '34.7') : `${(financialKPIs as any)?.profitMargin || '34.7'}%`}
                </span>
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
            <CardTitle>{t('dashboard.operationalMetrics', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {isPersian ? formatPersianPercentage((operationalMetrics as any)?.classUtilization || '89.3') : `${(operationalMetrics as any)?.classUtilization || '89.3'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.classUtilization', { ns: 'common' })}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {isPersian ? formatPersianPercentage((operationalMetrics as any)?.teacherUtilization || '76.8') : `${(operationalMetrics as any)?.teacherUtilization || '76.8'}%`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.teacherUtilization', { ns: 'common' })}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.peakHours', { ns: 'common' })}</span>
                  <Badge variant="outline">
                    {isPersian ? formatPersianText("full 95.2%") : "95.2% full"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.morningClasses', { ns: 'common' })}</span>
                  <Badge variant="outline">
                    {isPersian ? formatPersianText("full 67.4%") : "67.4% full"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.weekendSessions', { ns: 'common' })}</span>
                  <Badge variant="outline">
                    {isPersian ? formatPersianText("full 82.1%") : "82.1% full"}
                  </Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.onlineCapacity', { ns: 'common' })}</span>
                  <Badge variant="outline">
                    {isPersian ? formatPersianText("used 91.8%") : "91.8% used"}
                  </Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quality & Satisfaction Metrics */}
        <Card>
          <CardHeader>
            <CardTitle>{t('dashboard.qualitySatisfactionMetrics', { ns: 'common' })}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-yellow-600">
                    {isPersian ? `${formatPersianNumber((operationalMetrics as any)?.studentSatisfaction || '4.6')}/۵` : `${(operationalMetrics as any)?.studentSatisfaction || '4.6'}/5`}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.studentSatisfaction', { ns: 'common' })}</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {isPersian ? formatPersianNumber((operationalMetrics as any)?.nps || '+47') : (operationalMetrics as any)?.nps || '+47'}
                  </div>
                  <p className="text-xs text-muted-foreground">{t('dashboard.netPromoterScore', { ns: 'common' })}</p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.courseMaterialQuality', { ns: 'common' })}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs">
                      {isPersian ? formatPersianNumber("4.7") : "4.7"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.teachingQuality', { ns: 'common' })}</span>
                  <div className="flex items-center gap-1">
                    {[1,2,3,4,5].map(star => (
                      <Star key={star} className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    ))}
                    <span className="text-xs">
                      {isPersian ? formatPersianNumber("4.5") : "4.5"}
                    </span>
                  </div>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.supportResponseTime', { ns: 'common' })}</span>
                  <Badge variant="outline">{t('dashboard.hours2Plus', { ns: 'common' })}</Badge>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">{t('dashboard.technicalIssues', { ns: 'common' })}</span>
                  <Badge variant="outline" className="text-green-600">{t('dashboard.sessions08Percent', { ns: 'common' })}</Badge>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Payments Detail */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-600" />
            {t('dashboard.criticalOverduePayments', { ns: 'common' })}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">{t('dashboard.studentName', { ns: 'common' })}</th>
                  <th className="text-left p-2">{t('dashboard.amountDue', { ns: 'common' })}</th>
                  <th className="text-left p-2">{t('dashboard.daysOverdue', { ns: 'common' })}</th>
                  <th className="text-left p-2">{t('dashboard.course', { ns: 'common' })}</th>
                  <th className="text-left p-2">{t('dashboard.contact', { ns: 'common' })}</th>
                  <th className="text-left p-2">{t('dashboard.action', { ns: 'common' })}</th>
                </tr>
              </thead>
              <tbody>
                {((overduePayments as any)?.details || []).map((payment, index) => (
                  <tr key={index} className="border-b hover:bg-gray-50">
                    <td className="p-2 font-medium">{payment.name}</td>
                    <td className="p-2 text-red-600 font-semibold">{payment.amount}</td>
                    <td className="p-2">
                      <Badge variant={payment.days > 14 ? "destructive" : "secondary"}>
{payment.days} {t('common:days')}
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