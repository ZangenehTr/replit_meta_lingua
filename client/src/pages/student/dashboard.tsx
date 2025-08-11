import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { SessionPackages } from "@/components/session-packages";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Calendar, 
  Clock, 
  Users, 
  Video, 
  MessageSquare, 
  Mic, 
  Headphones,
  Star,
  Play,
  CheckCircle,
  AlertCircle,
  TrendingUp,
  Zap,
  Award,
  CreditCard,
  Phone,
  User,
  Brain,
  Globe,
  Heart,
  Flame,
  ClipboardCheck,
  MoreVertical,
  Menu,
  ChevronRight,
  GraduationCap,
  BarChart3,
  Package
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: string;
  nextLevelXP: number;
  walletBalance: number;
  memberTier: string;
  studyTimeThisWeek: number;
  weeklyGoalHours: number;
}

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  progress: number;
  instructor: string;
  nextSession?: {
    date: string;
    time: string;
  };
  thumbnail: string;
  totalLessons: number;
  completedLessons: number;
}

interface Assignment {
  id: number;
  title: string;
  courseName: string;
  dueDate: string;
  status: 'pending' | 'submitted' | 'graded' | 'overdue';
  score?: number;
  feedback?: string;
}

interface UpcomingSession {
  id: number;
  title: string;
  instructor: string;
  time: string;
  duration: number;
  type: 'group' | 'individual';
  sessionUrl?: string;
  canJoin: boolean;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  icon: string;
  unlockedAt: string;
  xpReward: number;
}

interface LearningGoal {
  id: number;
  title: string;
  description: string;
  targetDate: string;
  progress: number;
  isCompleted: boolean;
}

function StudentDashboard() {
  const { user } = useAuth();
  const { direction, isRTL } = useLanguage();
  const { t } = useTranslation(['student', 'common']);
  const [selectedTab, setSelectedTab] = useState("overview");
  const [isMobile, setIsMobile] = useState(false);
  const queryClient = useQueryClient();

  // Check for mobile view
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Data queries
  const { data: studentStats } = useQuery<StudentStats>({
    queryKey: ["/api/student/stats"],
  });

  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ["/api/student/courses"],
  });

  const { data: assignments = [] } = useQuery<Assignment[]>({
    queryKey: ["/api/student/assignments"],
  });

  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ["/api/student/sessions/upcoming"],
  });

  const { data: achievements = [] } = useQuery<Achievement[]>({
    queryKey: ["/api/student/achievements"],
  });

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/student/goals"],
  });

  // Mutation for joining sessions
  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/student/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.open(data.sessionUrl, '_blank');
      }
      queryClient.invalidateQueries({ queryKey: ["/api/student/sessions/upcoming"] });
    }
  });

  // Helper functions
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed': return 'bg-green-100 text-green-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'submitted': return 'bg-blue-100 text-blue-800';
      case 'graded': return 'bg-purple-100 text-purple-800';
      case 'overdue': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getMemberTierColor = (tier: string) => {
    switch (tier.toLowerCase()) {
      case 'bronze': return 'bg-orange-100 text-orange-800';
      case 'silver': return 'bg-gray-100 text-gray-800';
      case 'gold': return 'bg-yellow-100 text-yellow-800';
      case 'diamond': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const pendingAssignments = assignments.filter(a => a.status === 'pending' || a.status === 'overdue');
  const weeklyProgress = studentStats ? (studentStats.studyTimeThisWeek / studentStats.weeklyGoalHours) * 100 : 0;

  // Mobile-friendly tab options
  const tabOptions = [
    { value: 'overview', label: t('dashboard.overview', { ns: 'common' }), icon: BarChart3 },
    { value: 'courses', label: t('student.courses'), icon: BookOpen },
    { value: 'assignments', label: t('student.assignments'), icon: ClipboardCheck },
    { value: 'schedule', label: t('student.schedule'), icon: Calendar },
    { value: 'packages', label: 'Packages', icon: Package },
    { value: 'achievements', label: 'Achievements', icon: Trophy },
    { value: 'goals', label: 'Goals', icon: Target }
  ];

  return (
    <AppLayout>
      <div className="p-4 sm:p-6 space-y-4 sm:space-y-6">
        {/* Mobile-First Welcome Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-br from-blue-500 via-indigo-500 to-purple-600 rounded-2xl p-4 sm:p-6 text-white shadow-xl"
        >
          <div className="space-y-4">
            {/* User Info */}
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold mb-1">
                  {t('student:welcome', 'Welcome')}, {user?.firstName || t('student:student', 'Student')}!
                </h1>
                <p className="text-sm sm:text-base opacity-90">
                  {t('student:welcomeMessage', 'Ready to continue your learning journey?')}
                </p>
              </div>
              {/* Mobile Menu for Quick Actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild className="sm:hidden">
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <MoreVertical className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem asChild>
                    <Link href="/ai-practice">
                      <Mic className="h-4 w-4 mr-2" />
                      {t('practice')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/video-courses">
                      <Video className="h-4 w-4 mr-2" />
                      {t('dashboard.liveVideoClasses', { ns: 'common' })}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/games">
                      <Trophy className="h-4 w-4 mr-2" />
                      {t('practiceTests')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/level-assessment">
                      <Target className="h-4 w-4 mr-2" />
                      {t('dashboard.whatsMyLevel', { ns: 'common' })}
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Stats Grid - Mobile Optimized */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <Flame className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs opacity-90">{t('student:currentStreak', 'Streak')}</p>
                <p className="text-lg sm:text-xl font-bold">{studentStats?.currentStreak || 0} {t('common:days', 'days')}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <Star className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs opacity-90">{t('student:totalXP', 'Total XP')}</p>
                <p className="text-lg sm:text-xl font-bold">{studentStats?.totalXP || 0}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <GraduationCap className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs opacity-90">{t('student:currentLevel', 'Level')}</p>
                <p className="text-lg sm:text-xl font-bold">{studentStats?.currentLevel || 'Beginner'}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-xl p-3 text-center">
                <CreditCard className="h-5 w-5 mx-auto mb-1 text-yellow-300" />
                <p className="text-xs opacity-90">{t('student:walletBalance', 'Balance')}</p>
                <p className="text-lg sm:text-xl font-bold">{formatCurrency(studentStats?.walletBalance || 0)}</p>
              </div>
            </div>

            {/* Desktop Quick Actions */}
            <div className="hidden sm:flex flex-wrap gap-2">
              <Link href="/ai-practice">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30">
                  <Mic className="h-4 w-4 mr-2" />
                  {t('practice')}
                </Button>
              </Link>
              <Link href="/video-courses">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30">
                  <Video className="h-4 w-4 mr-2" />
                  {t('dashboard.liveVideoClasses', { ns: 'common' })}
                </Button>
              </Link>
              <Link href="/games">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30">
                  <Trophy className="h-4 w-4 mr-2" />
                  {t('practiceTests')}
                </Button>
              </Link>
              <Link href="/level-assessment">
                <Button size="sm" className="bg-white/20 hover:bg-white/30 backdrop-blur-sm border border-white/30">
                  <Target className="h-4 w-4 mr-2" />
                  {t('dashboard.whatsMyLevel', { ns: 'common' })}
                </Button>
              </Link>
            </div>
          </div>
        </motion.div>

        {/* Weekly Progress Card - Mobile First */}
        <Card className="bg-white shadow-sm border-0">
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base sm:text-lg flex items-center gap-2">
                <Target className="h-5 w-5 text-purple-600" />
                {t('student.weeklyGoalHours', 'Weekly Goal')}
              </CardTitle>
              <Badge variant="outline" className={getMemberTierColor(studentStats?.memberTier || 'bronze')}>
                {studentStats?.memberTier?.toUpperCase() || 'BRONZE'}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <div className="flex justify-between text-sm mb-2">
                <span className="text-muted-foreground">{t('student.progress', 'Progress')}</span>
                <span className="font-medium">{Math.round(weeklyProgress)}%</span>
              </div>
              <Progress value={weeklyProgress} className="h-2" />
              <p className="text-xs text-muted-foreground mt-1">
                {studentStats?.studyTimeThisWeek || 0}h / {studentStats?.weeklyGoalHours || 5}h {t('common:thisWeek', 'this week')}
              </p>
            </div>
          </CardContent>
        </Card>

        {/* Mobile-Optimized Navigation */}
        <div className="space-y-4">
          {/* Mobile Tab Selector */}
          <div className="sm:hidden">
            <Select value={selectedTab} onValueChange={setSelectedTab}>
              <SelectTrigger className="w-full bg-white shadow-sm">
                <div className="flex items-center gap-2">
                  {tabOptions.find(tab => tab.value === selectedTab)?.icon && 
                    (() => {
                      const Icon = tabOptions.find(tab => tab.value === selectedTab)?.icon;
                      return Icon ? <Icon className="h-4 w-4" /> : null;
                    })()
                  }
                  <SelectValue>
                    {tabOptions.find(tab => tab.value === selectedTab)?.label}
                  </SelectValue>
                </div>
              </SelectTrigger>
              <SelectContent>
                {tabOptions.map((tab) => (
                  <SelectItem key={tab.value} value={tab.value}>
                    <div className="flex items-center gap-2">
                      <tab.icon className="h-4 w-4" />
                      {tab.label}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {/* Mobile Content Rendering */}
            <div className="space-y-4">
              {selectedTab === 'overview' && (
                <>
                  {/* Mobile Overview Content */}
                  <div className="grid grid-cols-1 gap-4">
                    {/* Today's Sessions - Mobile */}
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Video className="h-5 w-5 text-blue-600" />
                          {t('dashboard.upcomingTasks', { ns: 'common' })}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {upcomingSessions.length > 0 ? (
                          upcomingSessions.slice(0, 3).map((session) => (
                            <div key={session.id} className="flex flex-col p-3 bg-gray-50 rounded-lg gap-2">
                              <div className="flex-1 space-y-1">
                                <h4 className="font-medium text-sm">{session.title}</h4>
                                <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                                  <span className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    {session.instructor}
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />
                                    {session.time} • {session.duration}min
                                  </span>
                                </div>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge variant={session.type === 'group' ? 'default' : 'secondary'} className="text-xs">
                                  {session.type}
                                </Badge>
                                {session.canJoin && (
                                  <Button
                                    size="sm"
                                    onClick={() => joinSessionMutation.mutate(session.id)}
                                    disabled={joinSessionMutation.isPending}
                                    className="bg-green-600 hover:bg-green-700 text-xs h-7"
                                  >
                                    <Play className="h-3 w-3 mr-1" />
                                    Join Now
                                  </Button>
                                )}
                              </div>
                            </div>
                          ))
                        ) : (
                          <p className="text-muted-foreground text-center py-4 text-sm">
                            {t('student:noSessionsToday', 'No sessions scheduled for today')}
                          </p>
                        )}
                      </CardContent>
                    </Card>

                    {/* Pending Assignments - Mobile */}
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <ClipboardCheck className="h-5 w-5 text-orange-600" />
                          {t('student:pendingAssignments', 'Pending Assignments')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        {pendingAssignments.length > 0 ? (
                          pendingAssignments.slice(0, 3).map((assignment) => (
                            <div key={assignment.id} className="flex flex-col p-3 bg-gray-50 rounded-lg gap-2">
                              <div className="flex-1 space-y-1">
                                <h4 className="font-medium text-sm">{assignment.title}</h4>
                                <p className="text-xs text-muted-foreground">
                                  {assignment.courseName} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                                </p>
                              </div>
                              <div className="flex items-center justify-between">
                                <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                                  {assignment.status}
                                </Badge>
                                <Link href={`/assignments/${assignment.id}`}>
                                  <Button size="sm" variant="outline" className="text-xs h-7">
                                    View
                                  </Button>
                                </Link>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6">
                            <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                            <p className="text-muted-foreground text-sm">{t('student:allCaughtUp', 'All caught up!')}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </div>

                  {/* Recent Achievements - Mobile */}
                  {achievements.length > 0 && (
                    <Card className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <CardTitle className="flex items-center gap-2 text-base">
                          <Award className="h-5 w-5 text-yellow-600" />
                          {t('student:recentAchievements', 'Recent Achievements')}
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          {achievements.slice(0, 3).map((achievement) => (
                            <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                              <div className="text-xl flex-shrink-0">{achievement.icon}</div>
                              <div className="flex-1 min-w-0">
                                <h4 className="font-medium text-xs truncate">{achievement.title}</h4>
                                <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                                <div className="flex items-center gap-1 mt-1">
                                  <Zap className="h-3 w-3 text-yellow-600" />
                                  <span className="text-xs font-medium text-yellow-700">
                                    +{achievement.xpReward} XP
                                  </span>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}

                  {/* Motivational Alert - Mobile */}
                  {studentStats?.currentStreak === 0 && (
                    <Alert className="border-orange-200 bg-orange-50">
                      <Flame className="h-4 w-4 text-orange-600" />
                      <AlertDescription className="text-xs">
                        {t('student:startStreak', 'Start your learning streak today! Complete a lesson to begin building your streak.')}
                      </AlertDescription>
                    </Alert>
                  )}
                </>
              )}

              {selectedTab === 'courses' && (
                <div className="grid grid-cols-1 gap-4">
                  {courses.map((course) => (
                    <Card key={course.id} className="shadow-sm border-0">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="text-base">{course.title}</CardTitle>
                          <Badge className={`${getLevelColor(course.level)} text-xs`}>
                            {course.level}
                          </Badge>
                        </div>
                        <CardDescription className="text-xs">
                          {course.language} • {course.instructor}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <div>
                          <div className="flex justify-between text-xs mb-1">
                            <span>Progress</span>
                            <span>{course.progress}%</span>
                          </div>
                          <Progress value={course.progress} className="h-2" />
                        </div>
                        
                        <div className="text-xs text-muted-foreground">
                          {course.completedLessons}/{course.totalLessons} lessons completed
                        </div>

                        {course.nextSession && (
                          <div className="text-xs text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              Next: {course.nextSession.date} at {course.nextSession.time}
                            </div>
                          </div>
                        )}

                        <Link href={`/courses/${course.id}`}>
                          <Button className="w-full h-8 text-xs">
                            <BookOpen className="h-3 w-3 mr-2" />
                            Continue Learning
                          </Button>
                        </Link>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}

              {selectedTab === 'packages' && (
                <SessionPackages />
              )}

              {/* Add other mobile tab content here */}
            </div>
          </div>

          {/* Desktop Tabs - Scrollable on smaller screens */}
          <div className="hidden sm:block">
            <Tabs value={selectedTab} onValueChange={setSelectedTab} className="space-y-4">
              <TabsList className="w-full justify-start overflow-x-auto flex-nowrap">
                {tabOptions.map((tab) => (
                  <TabsTrigger 
                    key={tab.value} 
                    value={tab.value}
                    className="flex items-center gap-2 whitespace-nowrap"
                  >
                    <tab.icon className="h-4 w-4" />
                    <span className="hidden lg:inline">{tab.label}</span>
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Tab Contents */}
              <TabsContent value="overview" className="space-y-4">
                {/* Mobile-first grid layout */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Today's Sessions - Mobile optimized */}
                  <Card className="shadow-sm border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Video className="h-5 w-5 text-blue-600" />
                        {t('dashboard.upcomingTasks', { ns: 'common' })}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {upcomingSessions.length > 0 ? (
                        upcomingSessions.slice(0, 3).map((session) => (
                          <div key={session.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium text-sm sm:text-base">{session.title}</h4>
                              <div className="flex flex-wrap items-center gap-2 text-xs sm:text-sm text-muted-foreground">
                                <span className="flex items-center gap-1">
                                  <User className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {session.instructor}
                                </span>
                                <span className="flex items-center gap-1">
                                  <Clock className="h-3 w-3 sm:h-4 sm:w-4" />
                                  {session.time} • {session.duration}min
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge variant={session.type === 'group' ? 'default' : 'secondary'} className="text-xs">
                                {session.type}
                              </Badge>
                              {session.canJoin && (
                                <Button
                                  size="sm"
                                  onClick={() => joinSessionMutation.mutate(session.id)}
                                  disabled={joinSessionMutation.isPending}
                                  className="bg-green-600 hover:bg-green-700 text-xs sm:text-sm"
                                >
                                  <Play className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                                  Join
                                </Button>
                              )}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-muted-foreground text-center py-4 text-sm">
                          {t('student:noSessionsToday', 'No sessions scheduled for today')}
                        </p>
                      )}
                    </CardContent>
                  </Card>

                  {/* Pending Assignments - Mobile optimized */}
                  <Card className="shadow-sm border-0">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <ClipboardCheck className="h-5 w-5 text-orange-600" />
                        {t('student:pendingAssignments', 'Pending Assignments')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {pendingAssignments.length > 0 ? (
                        pendingAssignments.slice(0, 3).map((assignment) => (
                          <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 bg-gray-50 rounded-lg gap-3">
                            <div className="flex-1 space-y-1">
                              <h4 className="font-medium text-sm sm:text-base">{assignment.title}</h4>
                              <p className="text-xs sm:text-sm text-muted-foreground">
                                {assignment.courseName} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                                {assignment.status}
                              </Badge>
                              <Link href={`/assignments/${assignment.id}`}>
                                <Button size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">
                                  View
                                </Button>
                              </Link>
                            </div>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-6">
                          <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-2" />
                          <p className="text-muted-foreground text-sm">{t('student:allCaughtUp', 'All caught up!')}</p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
            </div>

                {/* Recent Achievements - Mobile optimized */}
                {achievements.length > 0 && (
                  <Card className="shadow-sm border-0 mt-4">
                    <CardHeader className="pb-3">
                      <CardTitle className="flex items-center gap-2 text-base sm:text-lg">
                        <Award className="h-5 w-5 text-yellow-600" />
                        {t('student:recentAchievements', 'Recent Achievements')}
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                        {achievements.slice(0, 3).map((achievement) => (
                          <div key={achievement.id} className="flex items-center gap-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 rounded-lg border border-yellow-200">
                            <div className="text-xl sm:text-2xl flex-shrink-0">{achievement.icon}</div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-xs sm:text-sm truncate">{achievement.title}</h4>
                              <p className="text-xs text-muted-foreground line-clamp-2">{achievement.description}</p>
                              <div className="flex items-center gap-1 mt-1">
                                <Zap className="h-3 w-3 text-yellow-600" />
                                <span className="text-xs font-medium text-yellow-700">
                                  +{achievement.xpReward} XP
                                </span>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {/* Motivational Alerts - Mobile optimized */}
                {studentStats?.currentStreak === 0 && (
                  <Alert className="border-orange-200 bg-orange-50 mt-4">
                    <Flame className="h-4 w-4 text-orange-600" />
                    <AlertDescription className="text-xs sm:text-sm">
                      {t('student:startStreak', 'Start your learning streak today! Complete a lesson to begin building your streak.')}
                    </AlertDescription>
                  </Alert>
                )}
              </TabsContent>

              <TabsContent value="courses" className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {courses.map((course) => (
                <Card key={course.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{course.title}</CardTitle>
                      <Badge className={getLevelColor(course.level)}>
                        {course.level}
                      </Badge>
                    </div>
                    <CardDescription>
                      {course.language} • {course.instructor}
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <div className="flex justify-between text-sm mb-1">
                        <span>Progress</span>
                        <span>{course.progress}%</span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                    
                    <div className="text-sm text-muted-foreground">
                      {course.completedLessons}/{course.totalLessons} lessons completed
                    </div>

                    {course.nextSession && (
                      <div className="text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-4 w-4" />
                          Next: {course.nextSession.date} at {course.nextSession.time}
                        </div>
                      </div>
                    )}

                    <Link href={`/courses/${course.id}`}>
                      <Button className="w-full">
                        <BookOpen className="h-4 w-4 mr-2" />
                        Continue Learning
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ))}
                </div>
              </TabsContent>

              <TabsContent value="assignments" className="space-y-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Assignment Management</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Track your homework and submit assignments
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {assignments.map((assignment) => (
                        <div key={assignment.id} className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-3 sm:p-4 bg-gray-50 rounded-lg gap-3">
                          <div className="flex-1 space-y-1">
                            <h4 className="font-medium text-sm sm:text-base">{assignment.title}</h4>
                            <p className="text-xs sm:text-sm text-muted-foreground">
                              {assignment.courseName} • Due: {new Date(assignment.dueDate).toLocaleDateString()}
                            </p>
                            {assignment.score && (
                              <p className="text-xs sm:text-sm font-medium text-green-600">
                                Score: {assignment.score}%
                              </p>
                            )}
                          </div>
                          <div className="flex items-center gap-2 sm:gap-4">
                            <Badge className={`${getStatusColor(assignment.status)} text-xs`}>
                              {assignment.status}
                            </Badge>
                            <Link href={`/assignments/${assignment.id}`}>
                              <Button size="sm" variant="outline" className="text-xs sm:text-sm h-7 sm:h-8">
                                {assignment.status === 'pending' ? 'Submit' : 'View'}
                              </Button>
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="schedule" className="space-y-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">My Schedule</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Upcoming sessions and events
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                  {upcomingSessions.map((session) => (
                    <div key={session.id} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center justify-center w-10 h-10 bg-blue-100 rounded-lg">
                          <Video className="h-5 w-5 text-blue-600" />
                        </div>
                        <div>
                          <h4 className="font-medium">{session.title}</h4>
                          <p className="text-sm text-muted-foreground">
                            {session.instructor} • {session.time} • {session.duration} minutes
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Badge className={session.type === 'group' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'}>
                          {session.type}
                        </Badge>
                        {session.canJoin && (
                          <Button
                            size="sm"
                            onClick={() => joinSessionMutation.mutate(session.id)}
                            disabled={joinSessionMutation.isPending}
                          >
                            Join
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

              <TabsContent value="packages" className="space-y-4">
                <SessionPackages />
              </TabsContent>

              <TabsContent value="achievements" className="space-y-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base sm:text-lg">Achievement Gallery</CardTitle>
                    <CardDescription className="text-xs sm:text-sm">
                      Your learning milestones and rewards
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {achievements.map((achievement) => (
                    <div key={achievement.id} className="p-4 border rounded-lg text-center">
                      <div className="text-4xl mb-2">{achievement.icon}</div>
                      <h4 className="font-medium">{achievement.title}</h4>
                      <p className="text-sm text-muted-foreground mb-2">{achievement.description}</p>
                      <div className="flex items-center justify-center gap-1">
                        <Zap className="h-4 w-4 text-yellow-600" />
                        <span className="text-sm font-medium text-yellow-700">
                          +{achievement.xpReward} XP
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <Card className="shadow-sm border-0">
                  <CardHeader className="pb-3">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <CardTitle>Learning Goals</CardTitle>
                    <CardDescription>
                      Track your language learning objectives
                    </CardDescription>
                  </div>
                  <Link href="/goals/new">
                    <Button>
                      <Target className="h-4 w-4 mr-2" />
                      New Goal
                    </Button>
                  </Link>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {learningGoals.map((goal) => (
                    <div key={goal.id} className="p-4 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{goal.title}</h4>
                        {goal.isCompleted && (
                          <Badge className="bg-green-100 text-green-800">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Completed
                          </Badge>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground mb-3">{goal.description}</p>
                      <div>
                        <div className="flex justify-between text-sm mb-1">
                          <span>Progress</span>
                          <span>{goal.progress}%</span>
                        </div>
                        <Progress value={goal.progress} className="h-2" />
                      </div>
                      <p className="text-xs text-muted-foreground mt-2">
                        Target Date: {new Date(goal.targetDate).toLocaleDateString()}
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default StudentDashboard;