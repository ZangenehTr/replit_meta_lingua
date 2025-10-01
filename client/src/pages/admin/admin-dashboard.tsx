import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { 
  Dialog, 
  DialogContent, 
  DialogDescription, 
  DialogHeader, 
  DialogTitle,
  DialogTrigger 
} from "@/components/ui/dialog";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { cn } from "@/lib/utils";
import { 
  Users,
  GraduationCap,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart3,
  PieChart as PieChartIcon,
  Calendar,
  Bell,
  Settings,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
  Clock,
  Building,
  Globe,
  Shield,
  Database,
  Cpu,
  Wifi,
  Package,
  CreditCard,
  Phone,
  MessageSquare,
  Brain,
  Video,
  Award,
  Box,
  Target,
  ArrowUpRight,
  ArrowDownRight,
  Server,
  Circle,
  BookOpen,
  FileText,
  Star
} from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, Area, AreaChart } from 'recharts';

interface AdminStats {
  totalStudents: number;
  activeStudents: number;
  totalTeachers: number;
  activeTeachers: number;
  totalCourses: number;
  activeCourses: number;
  monthlyRevenue: number;
  yearlyRevenue: number;
  revenueGrowth: number;
  studentGrowth: number;
  teacherUtilization: number;
  courseCompletionRate: number;
  systemHealth: {
    database: 'healthy' | 'warning' | 'critical';
    server: 'healthy' | 'warning' | 'critical';
    ai: 'healthy' | 'warning' | 'critical';
    voip: 'healthy' | 'warning' | 'critical';
  };
  revenueData: { month: string; revenue: number; students: number; sessions: number }[];
  courseDistribution: { name: string; value: number; color: string }[];
  teacherPerformance: { name: string; rating: number; students: number; hours: number }[];
  recentActivities: { id: number; type: string; message: string; time: string; status: string }[];
  platformMetrics: {
    callernMinutes: number;
    totalTests: number;
    walletTransactions: number;
    smssSent: number;
    aiRequests: number;
  };
}

// Notifications content component
const NotificationsContent = () => {
  const { t } = useTranslation();
  
  const { data: notifications, isLoading, error } = useQuery<any[]>({
    queryKey: [API_ENDPOINTS.common.notifications],
  });

  if (isLoading) {
    return <div className="p-4 text-center">{t('common:loading', 'بارگذاری...')}</div>;
  }

  if (error) {
    return (
      <div className="p-4 text-center text-red-500">
        <AlertCircle className="h-8 w-8 mx-auto mb-2" />
        <p>{t('admin:notificationsError', 'خطا در بارگذاری اعلان‌ها')}</p>
      </div>
    );
  }

  if (!notifications || notifications.length === 0) {
    return (
      <div className="p-4 text-center text-muted-foreground">
        {t('admin:noNotifications', 'اعلان جدیدی وجود ندارد')}
      </div>
    );
  }

  return (
    <div className="space-y-2 max-h-96 overflow-y-auto">
      {notifications.map((notif: any, idx: number) => (
        <div key={idx} className="p-3 border rounded-lg hover:bg-gray-50">
          <p className="font-medium">{notif.title}</p>
          <p className="text-sm text-muted-foreground">{notif.message}</p>
          <p className="text-xs text-gray-400 mt-1">{notif.time}</p>
        </div>
      ))}
    </div>
  );
};

export const AdminDashboard = () => {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('admin:goodMorning', 'صبح بخیر'));
    else if (hour < 18) setGreeting(t('admin:goodAfternoon', 'عصر بخیر'));
    else setGreeting(t('admin:goodEvening', 'شب بخیر'));
  }, [t]);

  const { data: stats, isLoading: statsLoading, error: statsError } = useQuery<AdminStats>({
    queryKey: [API_ENDPOINTS.admin.stats],
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) return false;
      return failureCount < 3;
    },
  });

  const displayStats = stats;

  const studentUtilization = displayStats ? (displayStats.activeStudents / displayStats.totalStudents * 100).toFixed(1) : 0;
  const teacherUtilization = displayStats ? (displayStats.activeTeachers / displayStats.totalTeachers * 100).toFixed(1) : 0;

  const getHealthColor = (status: string) => {
    switch(status) {
      case 'healthy': return 'text-green-500';
      case 'warning': return 'text-yellow-500';
      case 'critical': return 'text-red-500';
      default: return 'text-gray-500';
    }
  };

  const getHealthIcon = (status: string) => {
    switch(status) {
      case 'healthy': return <CheckCircle2 className="h-4 w-4" />;
      case 'warning': return <AlertCircle className="h-4 w-4" />;
      case 'critical': return <AlertCircle className="h-4 w-4" />;
      default: return <Circle className="h-4 w-4" />;
    }
  };

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-slate-50 via-white to-blue-50", isRTL && "rtl")}>
      {/* Professional Admin Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-slate-200 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-indigo-400 shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  <Shield className="h-3 w-3" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-xs font-medium">{greeting}</p>
                <h1 className="text-gray-900 font-bold text-base">{user?.firstName} {user?.lastName}</h1>
                <Badge variant="secondary" className="text-xs mt-1">
                  {t('admin:systemAdmin', 'مدیر سیستم')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {/* Notifications Dialog */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative" data-testid="button-notifications">
                    <Bell className="h-5 w-5" />
                    <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>{t('admin:notifications', 'اعلان‌ها')}</DialogTitle>
                    <DialogDescription>
                      {t('admin:notificationsDescription', 'آخرین اعلان‌های سیستم')}
                    </DialogDescription>
                  </DialogHeader>
                  <NotificationsContent />
                </DialogContent>
              </Dialog>
              
              <Link href="/admin/settings">
                <Button variant="ghost" size="icon" data-testid="button-settings">
                  <Settings className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Dashboard Content */}
      <div className="container mx-auto px-4 py-4 pb-20 space-y-4">
        {/* System Health Status Bar */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="shadow-lg border-l-4 border-l-indigo-500">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium text-gray-700">{t('admin:systemHealth', 'سلامت سیستم')}</h3>
                <div className="flex items-center gap-4">
                  <div className={cn("flex items-center gap-1", getHealthColor(stats?.systemHealth?.database || 'healthy'))}>
                    <Database className="h-4 w-4" />
                    {getHealthIcon(stats?.systemHealth?.database || 'healthy')}
                  </div>
                  <div className={cn("flex items-center gap-1", getHealthColor(stats?.systemHealth?.server || 'healthy'))}>
                    <Server className="h-4 w-4" />
                    {getHealthIcon(stats?.systemHealth?.server || 'healthy')}
                  </div>
                  <div className={cn("flex items-center gap-1", getHealthColor(stats?.systemHealth?.ai || 'warning'))}>
                    <Brain className="h-4 w-4" />
                    {getHealthIcon(stats?.systemHealth?.ai || 'warning')}
                  </div>
                  <div className={cn("flex items-center gap-1", getHealthColor(stats?.systemHealth?.voip || 'healthy'))}>
                    <Phone className="h-4 w-4" />
                    {getHealthIcon(stats?.systemHealth?.voip || 'healthy')}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Key Metrics Grid */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* Total Students */}
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-500" />
                <div className="text-right">
                  <span className="text-2xl font-bold text-blue-700">{stats?.totalStudents || 0}</span>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {stats?.studentGrowth > 0 ? (
                      <>
                        <ArrowUpRight className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">+{displayStats.studentGrowth}%</span>
                      </>
                    ) : (
                      <>
                        <ArrowDownRight className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">{stats?.studentGrowth}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">{t('admin:totalStudents', 'کل دانش‌آموزان')}</p>
              <Progress value={Number(studentUtilization)} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          {/* Total Teachers */}
          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <GraduationCap className="h-8 w-8 text-green-500" />
                <div className="text-right">
                  <span className="text-2xl font-bold text-green-700">{stats?.totalTeachers || 0}</span>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {stats?.activeTeachers || 0} {t('admin:active', 'فعال')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600">{t('admin:totalTeachers', 'کل معلمان')}</p>
              <Progress value={Number(teacherUtilization)} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          {/* Monthly Revenue */}
          <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 border-emerald-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <DollarSign className="h-8 w-8 text-emerald-500" />
                <div className="text-right">
                  <span className="text-lg font-bold text-emerald-700">
                    {new Intl.NumberFormat(isRTL ? 'fa-IR' : 'en-US', { notation: 'compact' }).format(stats?.monthlyRevenue || 0)}
                  </span>
                  <div className="flex items-center justify-end gap-1 mt-1">
                    {stats?.revenueGrowth > 0 ? (
                      <>
                        <TrendingUp className="h-3 w-3 text-green-500" />
                        <span className="text-xs text-green-600">+{displayStats.revenueGrowth}%</span>
                      </>
                    ) : (
                      <>
                        <TrendingDown className="h-3 w-3 text-red-500" />
                        <span className="text-xs text-red-600">{stats?.revenueGrowth}%</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-xs text-gray-600">{t('admin:monthlyRevenue', 'درآمد ماهانه')}</p>
            </CardContent>
          </Card>

          {/* Active Courses */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <BookOpen className="h-8 w-8 text-purple-500" />
                <div className="text-right">
                  <span className="text-2xl font-bold text-purple-700">{stats?.activeCourses || 0}</span>
                  <Badge variant="secondary" className="text-xs mt-1">
                    {stats?.totalCourses || 0} {t('admin:total', 'کل')}
                  </Badge>
                </div>
              </div>
              <p className="text-xs text-gray-600">{t('admin:activeCourses', 'دوره‌های فعال')}</p>
              <Progress value={stats?.courseCompletionRate || 0} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Revenue Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-indigo-500" />
                  {t('admin:revenueAnalytics', 'تحلیل درآمد')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  Q1 2024
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={stats?.revenueData || []}>
                  <defs>
                    <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#6366F1" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#6366F1" stopOpacity={0.1}/>
                    </linearGradient>
                    <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10B981" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#10B981" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }}
                    formatter={(value: any) => {
                      if (typeof value === 'number' && value > 10000) {
                        return new Intl.NumberFormat(isRTL ? 'fa-IR' : 'en-US', { notation: 'compact' }).format(value);
                      }
                      return value;
                    }}
                  />
                  <Area type="monotone" dataKey="revenue" stroke="#6366F1" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
                  <Area type="monotone" dataKey="sessions" stroke="#10B981" fillOpacity={1} fill="url(#colorSessions)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Platform Metrics */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Activity className="h-4 w-4 text-purple-500" />
                {t('admin:platformMetrics', 'معیارهای پلتفرم')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <Video className="h-6 w-6 text-purple-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-purple-700">{Math.floor((stats?.platformMetrics?.callernMinutes || 0) / 60)}</p>
                  <p className="text-xs text-gray-600">{t('admin:callernHours', 'ساعات کالرن')}</p>
                </div>
                <div className="text-center p-3 bg-blue-50 rounded-lg">
                  <FileText className="h-6 w-6 text-blue-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-blue-700">{stats?.platformMetrics?.totalTests || 0}</p>
                  <p className="text-xs text-gray-600">{t('admin:testsCompleted', 'آزمون انجام شده')}</p>
                </div>
                <div className="text-center p-3 bg-green-50 rounded-lg">
                  <CreditCard className="h-6 w-6 text-green-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-green-700">{stats?.platformMetrics?.walletTransactions || 0}</p>
                  <p className="text-xs text-gray-600">{t('admin:transactions', 'تراکنش')}</p>
                </div>
                <div className="text-center p-3 bg-orange-50 rounded-lg">
                  <MessageSquare className="h-6 w-6 text-orange-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-orange-700">{stats?.platformMetrics?.smssSent || 0}</p>
                  <p className="text-xs text-gray-600">{t('admin:smsSent', 'پیامک ارسالی')}</p>
                </div>
                <div className="text-center p-3 bg-indigo-50 rounded-lg">
                  <Cpu className="h-6 w-6 text-indigo-500 mx-auto mb-1" />
                  <p className="text-2xl font-bold text-indigo-700">{stats?.platformMetrics?.aiRequests || 0}</p>
                  <p className="text-xs text-gray-600">{t('admin:aiRequests', 'درخواست AI')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Course Distribution & Teacher Performance */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Course Distribution */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <Card className="shadow-xl h-full">
              <CardHeader className="pb-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <PieChartIcon className="h-4 w-4 text-amber-500" />
                  {t('admin:courseDistribution', 'توزیع دوره‌ها')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <ResponsiveContainer width="50%" height={150}>
                    <PieChart>
                      <Pie
                        data={stats?.courseDistribution || []}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={60}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {stats?.courseDistribution?.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="space-y-2 text-sm">
                    {stats?.courseDistribution?.map((item) => (
                      <div key={item.name} className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                        <span className="text-xs text-gray-600">{item.name}</span>
                        <span className="text-xs font-bold ml-auto">{item.value}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Top Teachers */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
          >
            <Card className="shadow-xl h-full">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base flex items-center gap-2">
                    <Award className="h-4 w-4 text-yellow-500" />
                    {t('admin:topTeachers', 'معلمان برتر')}
                  </CardTitle>
                  <Link href="/admin/teacher-management">
                    <Button variant="ghost" size="sm" className="text-xs">
                      {t('common:viewAll', 'مشاهده همه')}
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats?.teacherPerformance?.map((teacher, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center text-white font-bold">
                        {index + 1}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-800">{teacher.name}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="h-3 w-3 text-yellow-400 fill-current" />
                            <span className="text-xs text-gray-600">{teacher.rating}</span>
                          </div>
                          <span className="text-xs text-gray-500">
                            {teacher.students} {t('admin:students', 'دانش‌آموز')}
                          </span>
                          <span className="text-xs text-gray-500">
                            {teacher.hours}h
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-slate-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('admin:quickActions', 'دسترسی سریع')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <Link href="/admin/users">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Users className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:users', 'کاربران')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/admin/courses">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BookOpen className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:courses', 'دوره‌ها')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/admin/video-courses">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video className="h-6 w-6 text-purple-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:videoCourses', 'دوره‌های ویدیویی')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/admin/3d-lesson-builder">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Box className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:threeDLessons.threeDLessonBuilder', '3D درس‌ساز')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/admin/financial">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <DollarSign className="h-6 w-6 text-emerald-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:finance', 'مالی')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/admin/iranian-compliance-settings">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Globe className="h-6 w-6 text-purple-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('admin:compliance', 'تطبیق')}</span>
                    {stats?.systemHealth?.ai === 'warning' && (
                      <span className="absolute -top-1 -right-1 h-2 w-2 bg-yellow-500 rounded-full" />
                    )}
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Activities */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  {t('admin:recentActivities', 'فعالیت‌های اخیر')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {t('admin:live', 'زنده')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recentActivities?.map((activity) => (
                  <div key={activity.id} className="flex items-center gap-3 p-2 bg-gray-50 rounded-lg">
                    <div className={cn(
                      "w-2 h-2 rounded-full",
                      activity.status === 'success' ? 'bg-green-500' : 
                      activity.status === 'warning' ? 'bg-yellow-500' : 'bg-gray-500'
                    )} />
                    <div className="flex-1">
                      <p className="text-sm text-gray-700">{activity.message}</p>
                      <p className="text-xs text-gray-500">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Enhanced Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}