import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { cn } from "@/lib/utils";
import { 
  Users,
  Calendar,
  Clock,
  DollarSign,
  TrendingUp,
  Award,
  BookOpen,
  Video,
  Star,
  ChevronRight,
  Bell,
  BarChart3,
  Activity,
  Target,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Sparkles,
  Timer,
  MessageSquare,
  FileText,
  Mic,
  Eye,
  ThumbsUp,
  Coffee
} from "lucide-react";
import { Link } from "wouter";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

interface TeacherStats {
  totalStudents: number;
  activeClasses: number;
  weeklyHours: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  completionRate: number;
  studentSatisfaction: number;
  callernMinutes: number;
  upcomingClasses: { id: number; title: string; time: string; students: number; type: string }[];
  performanceData: { month: string; earnings: number; hours: number; satisfaction: number }[];
  classDistribution: { name: string; value: number; color: string }[];
  recentFeedback: { id: number; student: string; rating: number; comment: string; date: string }[];
  weeklySchedule: { day: string; classes: number; hours: number }[];
}

export default function TeacherDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const [greeting, setGreeting] = useState('');

  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('teacher:goodMorning', 'صبح بخیر'));
    else if (hour < 18) setGreeting(t('teacher:goodAfternoon', 'عصر بخیر'));
    else setGreeting(t('teacher:goodEvening', 'شب بخیر'));
  }, [t]);

  const { data: stats } = useQuery<TeacherStats>({
    queryKey: ['/api/teacher/stats'],
    queryFn: async () => {
      const response = await fetch('/api/teacher/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return {
          totalStudents: 48,
          activeClasses: 12,
          weeklyHours: 32,
          monthlyEarnings: 8500000,
          averageRating: 4.8,
          totalReviews: 127,
          completionRate: 94,
          studentSatisfaction: 96,
          callernMinutes: 1250,
          upcomingClasses: [
            { id: 1, title: 'Business English B2', time: '10:00', students: 8, type: 'group' },
            { id: 2, title: 'IELTS Preparation', time: '14:00', students: 1, type: 'private' },
            { id: 3, title: 'Conversation Practice', time: '16:30', students: 6, type: 'group' }
          ],
          performanceData: [
            { month: 'Jan', earnings: 7200000, hours: 28, satisfaction: 92 },
            { month: 'Feb', earnings: 7800000, hours: 30, satisfaction: 94 },
            { month: 'Mar', earnings: 8500000, hours: 32, satisfaction: 96 }
          ],
          classDistribution: [
            { name: 'Group Classes', value: 65, color: '#8B5CF6' },
            { name: 'Private Sessions', value: 20, color: '#10B981' },
            { name: 'Callern', value: 15, color: '#F59E0B' }
          ],
          recentFeedback: [
            { id: 1, student: 'Ali Rezaei', rating: 5, comment: 'Excellent teaching method!', date: '2024-01-25' },
            { id: 2, student: 'Sara Ahmadi', rating: 5, comment: 'Very patient and helpful', date: '2024-01-24' }
          ],
          weeklySchedule: [
            { day: 'Sat', classes: 4, hours: 6 },
            { day: 'Sun', classes: 5, hours: 7 },
            { day: 'Mon', classes: 3, hours: 5 },
            { day: 'Tue', classes: 4, hours: 6 },
            { day: 'Wed', classes: 3, hours: 5 },
            { day: 'Thu', classes: 2, hours: 3 },
            { day: 'Fri', classes: 0, hours: 0 }
          ]
        };
      }
      return response.json();
    }
  });

  const earningsGrowth = stats?.performanceData ? 
    ((stats.performanceData[2].earnings - stats.performanceData[0].earnings) / stats.performanceData[0].earnings * 100).toFixed(1) : 0;

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50", isRTL && "rtl")}>
      {/* Professional Mobile Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/90 backdrop-blur-xl border-b border-blue-100 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
      >
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="relative">
                <Avatar className="w-12 h-12 border-2 border-blue-400 shadow-lg">
                  <AvatarImage src={user?.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-blue-500 to-green-500 text-white font-bold">
                    {user?.firstName?.[0]}{user?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                <div className="absolute -bottom-1 -right-1 bg-green-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center shadow-lg">
                  <CheckCircle2 className="h-4 w-4" />
                </div>
              </div>
              <div>
                <p className="text-gray-600 text-xs font-medium">{greeting}</p>
                <h1 className="text-gray-900 font-bold text-base">{user?.firstName} {user?.lastName}</h1>
                <div className="flex items-center gap-2 mt-1">
                  <div className="flex items-center">
                    {[...Array(5)].map((_, i) => (
                      <Star key={i} className={cn("h-3 w-3", i < Math.floor(stats?.averageRating || 0) ? "text-yellow-400 fill-current" : "text-gray-300")} />
                    ))}
                  </div>
                  <span className="text-xs text-gray-600">{stats?.averageRating} ({stats?.totalReviews} {t('teacher:reviews', 'نظر')})</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="relative">
                <Bell className="h-5 w-5" />
                <span className="absolute top-0 right-0 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
              <div className="text-right">
                <p className="text-xs text-gray-500">{t('teacher:monthlyEarnings', 'درآمد ماهانه')}</p>
                <p className="text-sm font-bold text-green-600">
                  {new Intl.NumberFormat(isRTL ? 'fa-IR' : 'en-US').format(stats?.monthlyEarnings || 0)}
                  <span className="text-xs mr-1">{t('common:currency', 'تومان')}</span>
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-4 pb-20 space-y-4">
        {/* Key Performance Metrics */}
        <motion.div 
          className="grid grid-cols-2 md:grid-cols-4 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Users className="h-8 w-8 text-blue-500" />
                <span className="text-2xl font-bold text-blue-700">{stats?.totalStudents || 0}</span>
              </div>
              <p className="text-xs text-gray-600">{t('teacher:activeStudents', 'دانش‌آموز فعال')}</p>
              <div className="flex items-center gap-1 mt-2">
                <TrendingUp className="h-3 w-3 text-green-500" />
                <span className="text-xs text-green-600">+12% {t('common:thisMonth', 'این ماه')}</span>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Clock className="h-8 w-8 text-green-500" />
                <span className="text-2xl font-bold text-green-700">{stats?.weeklyHours || 0}h</span>
              </div>
              <p className="text-xs text-gray-600">{t('teacher:weeklyHours', 'ساعت هفتگی')}</p>
              <Progress value={(stats?.weeklyHours || 0) / 40 * 100} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-yellow-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Target className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-orange-700">{stats?.completionRate || 0}%</span>
              </div>
              <p className="text-xs text-gray-600">{t('teacher:completionRate', 'نرخ تکمیل')}</p>
              <Badge variant="secondary" className="mt-2 text-xs">
                <ThumbsUp className="h-3 w-3 ml-1" />
                {t('teacher:excellent', 'عالی')}
              </Badge>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Video className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-700">{Math.floor((stats?.callernMinutes || 0) / 60)}h</span>
              </div>
              <p className="text-xs text-gray-600">{t('teacher:callernHours', 'ساعات کالرن')}</p>
              <div className="flex items-center gap-1 mt-2">
                <Sparkles className="h-3 w-3 text-purple-500" />
                <span className="text-xs text-purple-600">Top 10%</span>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Today's Schedule */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-blue-500" />
                  {t('teacher:todaySchedule', 'برنامه امروز')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {stats?.upcomingClasses?.length || 0} {t('teacher:classes', 'کلاس')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(stats?.upcomingClasses || []).map((cls) => (
                  <motion.div 
                    key={cls.id}
                    className="flex items-center gap-3 p-3 bg-blue-50 rounded-lg border border-blue-200"
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                      {cls.type === 'private' ? <Mic className="h-5 w-5 text-blue-600" /> : <Users className="h-5 w-5 text-blue-600" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{cls.title}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Clock className="h-3 w-3" /> {cls.time}
                        </span>
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                          <Users className="h-3 w-3" /> {cls.students} {t('teacher:students', 'دانش‌آموز')}
                        </span>
                      </div>
                    </div>
                    <Button size="sm" variant="outline">
                      {t('teacher:view', 'مشاهده')}
                    </Button>
                  </motion.div>
                ))}
              </div>
              <Link href="/teacher/schedule">
                <Button variant="ghost" className="w-full mt-3" size="sm">
                  {t('teacher:viewFullSchedule', 'مشاهده برنامه کامل')}
                  <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Performance Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <BarChart3 className="h-4 w-4 text-green-500" />
                  {t('teacher:performanceTrend', 'روند عملکرد')}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  <TrendingUp className="h-3 w-3 ml-1" />
                  +{earningsGrowth}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={150}>
                <LineChart data={stats?.performanceData || []}>
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
                  />
                  <Line type="monotone" dataKey="satisfaction" stroke="#10B981" strokeWidth={2} dot={{ fill: '#10B981', r: 4 }} />
                  <Line type="monotone" dataKey="hours" stroke="#8B5CF6" strokeWidth={2} dot={{ fill: '#8B5CF6', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </motion.div>

        {/* Class Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <BookOpen className="h-4 w-4 text-purple-500" />
                {t('teacher:classDistribution', 'توزیع کلاس‌ها')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <ResponsiveContainer width="50%" height={120}>
                  <PieChart>
                    <Pie
                      data={stats?.classDistribution || []}
                      cx="50%"
                      cy="50%"
                      innerRadius={30}
                      outerRadius={50}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {stats?.classDistribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="space-y-2">
                  {stats?.classDistribution?.map((item) => (
                    <div key={item.name} className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <span className="text-xs text-gray-600">{item.name}</span>
                      <span className="text-xs font-bold">{item.value}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-indigo-50 to-blue-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('teacher:quickActions', 'دسترسی سریع')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-4 gap-3">
                <Link href="/teacher/callern">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video className="h-6 w-6 text-purple-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('teacher:callern', 'کالرن')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/teacher/tests">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <FileText className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('teacher:tests', 'آزمون‌ها')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/teacher/reports">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BarChart3 className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('teacher:reports', 'گزارش‌ها')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/teacher/resources">
                  <motion.div 
                    className="flex flex-col items-center p-3 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BookOpen className="h-6 w-6 text-orange-500 mb-1" />
                    <span className="text-xs text-gray-600">{t('teacher:resources', 'منابع')}</span>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Student Feedback */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <MessageSquare className="h-4 w-4 text-yellow-500" />
                  {t('teacher:recentFeedback', 'بازخوردهای اخیر')}
                </CardTitle>
                <Link href="/teacher/reviews">
                  <Button variant="ghost" size="sm" className="text-xs">
                    {t('common:viewAll', 'مشاهده همه')}
                    <ChevronRight className="h-3 w-3 ml-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.recentFeedback?.map((feedback) => (
                  <div key={feedback.id} className="p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm font-medium text-gray-800">{feedback.student}</span>
                      <div className="flex items-center">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className={cn("h-3 w-3", i < feedback.rating ? "text-yellow-400 fill-current" : "text-gray-300")} />
                        ))}
                      </div>
                    </div>
                    <p className="text-xs text-gray-600">{feedback.comment}</p>
                    <p className="text-xs text-gray-400 mt-1">{new Date(feedback.date).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Motivational Quote */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-indigo-500 to-purple-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <Coffee className="h-6 w-6 mb-2 text-white/80" />
                  <p className="text-sm italic text-white/90">
                    {t('teacher:quote', '"Teaching is the profession that teaches all other professions."')}
                  </p>
                  <p className="text-xs text-white/70 mt-1">- Unknown</p>
                </div>
                <Award className="h-12 w-12 text-white/20" />
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