import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  Trophy, 
  Wallet, 
  BookOpen, 
  Video, 
  FileText, 
  TrendingUp,
  Clock,
  Star,
  ChevronRight,
  Download,
  Upload,
  MessageSquare,
  Target,
  Award,
  Activity,
  Package,
  CreditCard,
  PlayCircle,
  CheckCircle2,
  Bell,
  BarChart3,
  ClipboardList
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";

interface Assignment {
  id: number;
  title: string;
  courseTitle: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded';
  grade?: number;
  feedback?: string;
}

interface LearningMaterial {
  id: number;
  title: string;
  type: 'pdf' | 'video' | 'audio' | 'document';
  courseTitle: string;
  size: string;
  downloadUrl: string;
}

interface UpcomingSession {
  id: number;
  courseTitle: string;
  teacherName: string;
  startTime: string;
  duration: number;
  type: 'group' | 'individual';
  joinUrl?: string;
  location?: string;
}

interface Props {
  enrollmentStatus: EnrollmentStatus;
  user: any;
}

export function EnrolledStudentDashboard({ enrollmentStatus, user }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const [activeSection, setActiveSection] = useState<'overview' | 'schedule' | 'progress' | 'materials' | 'assignments' | 'payments' | 'test-results'>('overview');

  // Fetch upcoming sessions
  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ['/api/student/upcoming-sessions'],
    staleTime: 5 * 60 * 1000,
  });

  // Fetch assignments
  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ['/api/student/assignments'],
    staleTime: 10 * 60 * 1000,
  });

  // Fetch learning materials
  const { data: materials = [] } = useQuery<LearningMaterial[]>({
    queryKey: ['/api/student/materials'],
    staleTime: 15 * 60 * 1000,
  });

  // Sample progress data
  const progressData = [
    { week: 'Week 1', speaking: 65, listening: 70, reading: 60, writing: 55 },
    { week: 'Week 2', speaking: 68, listening: 75, reading: 65, writing: 60 },
    { week: 'Week 3', speaking: 72, listening: 78, reading: 70, writing: 65 },
    { week: 'Week 4', speaking: 75, listening: 82, reading: 75, writing: 70 },
  ];

  const studyTimeData = [
    { day: 'Mon', minutes: 45 },
    { day: 'Tue', minutes: 60 },
    { day: 'Wed', minutes: 30 },
    { day: 'Thu', minutes: 75 },
    { day: 'Fri', minutes: 50 },
    { day: 'Sat', minutes: 90 },
    { day: 'Sun', minutes: 40 },
  ];

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl border-b border-white/20"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold text-xl">{t('student:brand')}</h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-purple-500 text-white text-xs">
                    {enrollmentStatus.membershipTier} {t('student:dashboard.member')}
                  </Badge>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-gray-700" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
              <div className="flex items-center gap-2 bg-white/20 rounded-lg px-3 py-2">
                <Wallet className="h-4 w-4 text-gray-700" />
                <span className="text-sm font-medium text-gray-900">
                  {enrollmentStatus.walletBalance.toLocaleString()} {t('common:currency')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="px-4 py-3 bg-white/20 backdrop-blur-sm">
        <div className="flex gap-2 overflow-x-auto pb-2">
          {[
            { id: 'overview', label: t('student:overview'), icon: BarChart3 },
            { id: 'schedule', label: t('student:schedule'), icon: Calendar },
            { id: 'progress', label: t('student:progress'), icon: TrendingUp },
            { id: 'test-results', label: t('student:dashboard.testResults'), icon: ClipboardList, link: '/student/test-results' },
            { id: 'materials', label: t('student:dashboard.materials'), icon: BookOpen },
            { id: 'assignments', label: t('student:assignments'), icon: FileText },
            { id: 'payments', label: t('student:dashboard.payments'), icon: CreditCard },
          ].map((tab) => 
            tab.link ? (
              <Link href={tab.link} key={tab.id}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="flex items-center gap-2 whitespace-nowrap text-gray-700 hover:bg-white/50"
                  data-testid={`nav-${tab.id}`}
                >
                  <tab.icon className="h-4 w-4" />
                  {tab.label}
                </Button>
              </Link>
            ) : (
              <Button
                key={tab.id}
                variant={activeSection === tab.id ? 'default' : 'ghost'}
                size="sm"
                onClick={() => setActiveSection(tab.id as any)}
                className={`flex items-center gap-2 whitespace-nowrap ${
                  activeSection === tab.id
                    ? 'bg-white text-blue-600 shadow-md'
                    : 'text-gray-700 hover:bg-white/50'
                }`}
                data-testid={`tab-${tab.id}`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </Button>
            )
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="px-4 py-6 space-y-6">
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Welcome Section */}
            <Card className="bg-gradient-to-r from-blue-600 to-purple-600 text-white border-0">
              <CardContent className="p-6">
                <div className="flex items-center gap-4 mb-4">
                  <Avatar className="w-16 h-16 border-3 border-white">
                    <AvatarImage src={user?.avatar} />
                    <AvatarFallback className="bg-white/20 text-white font-bold text-lg">
                      {user?.firstName?.[0]}{user?.lastName?.[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h2 className="text-2xl font-bold">
                      {t('student:dashboard.welcomeBack', { firstName: user?.firstName })}
                    </h2>
                    <p className="text-white/90">
                      {t('student:dashboard.readyToContinue')}
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6">
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enrollmentStatus.activeCourses.length}</div>
                    <div className="text-sm text-white/80">{t('student:dashboard.activeCourses')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user?.streakDays || 0}</div>
                    <div className="text-sm text-white/80">{t('student:dashboard.dayStreak')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{user?.totalLessons || 0}</div>
                    <div className="text-sm text-white/80">{t('student:dashboard.completedLessons')}</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold">{enrollmentStatus.totalCredits}</div>
                    <div className="text-sm text-white/80">{t('student:dashboard.totalCredits')}</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('student:dashboard.nextSession')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {upcomingSessions[0]?.startTime || t('student:dashboard.noUpcomingSessions')}
                      </p>
                    </div>
                    <Calendar className="h-8 w-8 text-blue-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('student:dashboard.pendingAssignments')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {assignments.filter(a => a.status === 'pending').length}
                      </p>
                    </div>
                    <FileText className="h-8 w-8 text-orange-600" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600">{t('student:stats.walletBalance')}</p>
                      <p className="text-lg font-semibold text-gray-900">
                        {enrollmentStatus.walletBalance.toLocaleString()} {t('common:currency')}
                      </p>
                    </div>
                    <Wallet className="h-8 w-8 text-green-600" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  {t('student:dashboard.recentActivity')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { action: t('student:assignments.completedLesson'), course: t('student:sampleCourse1'), time: t('student:hoursAgo', { count: 2 }) },
                    { action: t('student:assignments.submittedAssignment'), course: t('student:sampleCourse2'), time: t('student:daysAgo', { count: 1 }) },
                    { action: t('student:assignments.watchedVideo'), course: t('student:sampleCourse3'), time: t('student:daysAgo', { count: 2 }) },
                  ].map((item, index) => (
                    <div key={index} className="flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50">
                      <CheckCircle2 className="h-4 w-4 text-green-600" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-gray-900">{item.action}</p>
                        <p className="text-xs text-gray-600">{item.course}</p>
                      </div>
                      <span className="text-xs text-gray-500">{item.time}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Other sections would be implemented here based on activeSection */}
        {activeSection === 'schedule' && (
          <Card>
            <CardHeader>
              <CardTitle>{t('student:upcomingSessions')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {upcomingSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div>
                      <h4 className="font-medium">{session.courseTitle}</h4>
                      <p className="text-sm text-gray-600">{t('student:withTeacher', { teacher: session.teacherName })}</p>
                      <p className="text-xs text-gray-500">{session.startTime} • {session.duration} min</p>
                    </div>
                    <Button size="sm" data-testid={`button-join-session-${session.id}`}>
                      {session.joinUrl ? t('student:joinOnline') : t('student:viewDetails')}
                    </Button>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Progress section with charts */}
        {activeSection === 'progress' && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('student:skillProgress')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={progressData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="week" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="speaking" stroke="#8884d8" strokeWidth={2} />
                    <Line type="monotone" dataKey="listening" stroke="#82ca9d" strokeWidth={2} />
                    <Line type="monotone" dataKey="reading" stroke="#ffc658" strokeWidth={2} />
                    <Line type="monotone" dataKey="writing" stroke="#ff7300" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t('student:weeklyStudyTime')}</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={200}>
                  <AreaChart data={studyTimeData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="day" />
                    <YAxis />
                    <Tooltip />
                    <Area type="monotone" dataKey="minutes" stroke="#8884d8" fill="#8884d8" fillOpacity={0.3} />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Other sections for materials, assignments, payments would be implemented similarly */}
      </div>
    </div>
  );
}