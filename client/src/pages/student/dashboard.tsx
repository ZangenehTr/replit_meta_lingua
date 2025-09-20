import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useProfileCompletion } from "@/hooks/use-profile-completion";
import { FirstTimeProfileModal } from "@/components/profile/FirstTimeProfileModal";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Trophy, 
  Flame, 
  Target,
  Clock,
  Star,
  TrendingUp,
  Award,
  Zap,
  BookOpen,
  Calendar,
  ChevronRight,
  Bell,
  Wallet,
  Users,
  Video,
  Brain,
  Heart,
  Package,
  GraduationCap,
  Play,
  BarChart3,
  Activity,
  DollarSign,
  Sparkles,
  Timer,
  CheckCircle2,
  Circle,
  ArrowUpRight,
  ArrowDownRight,
  Coins,
  MessageCircle,
  Mic,
  Headphones,
  PenTool,
  Menu,
  Home
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { LineChart, Line, AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface StudentStats {
  totalLessons: number;
  completedLessons: number;
  currentStreak: number;
  totalXP: number;
  currentLevel: number;
  nextLevelXP: number;
  walletBalance: number;
  memberTier: string;
  studyTimeThisWeek: number;
  weeklyGoalHours: number;
  accuracy: number;
  rank: number;
  totalStudents: number;
  badges: string[];
  weeklyProgress: { day: string; xp: number; minutes: number }[];
  skillsProgress: { skill: string; level: number; progress: number }[];
  recentAchievements: { id: number; title: string; icon: string; date: string }[];
}

interface PlacementTestStatus {
  hasCompletedPlacementTest: boolean;
  placementResults?: {
    sessionId: number;
    overallLevel: string;
    speakingLevel: string;
    listeningLevel: string;
    readingLevel: string;
    writingLevel: string;
    overallScore: number;
    speakingScore: number;
    listeningScore: number;
    readingScore: number;
    writingScore: number;
    strengths: string[];
    recommendations: string[];
    confidenceScore: number;
    completedAt: string;
  };
  weeklyLimits: {
    attemptsUsed: number;
    maxAttempts: number;
    remainingAttempts: number;
    canTakeTest: boolean;
  };
  message: string;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const [greeting, setGreeting] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [showProfileModal, setShowProfileModal] = useState(false);
  
  // Profile completion check for first-time users
  const { 
    isComplete, 
    isFirstLogin, 
    hasEverCompletedProfile,
    completionPercentage 
  } = useProfileCompletion();

  // Update time every minute
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(timer);
  }, []);

  // Get appropriate greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('student:goodMorning'));
    else if (hour < 18) setGreeting(t('student:goodAfternoon'));
    else setGreeting(t('student:goodEvening'));
  }, [t]);

  // Check for first-time users and show profile completion modal
  useEffect(() => {
    const hasSkippedModal = localStorage.getItem('profile_modal_shown') === 'true';
    if (user && user.role === 'Student' && isFirstLogin && !hasEverCompletedProfile && !hasSkippedModal) {
      // Show modal after a short delay to allow dashboard to load
      const timer = setTimeout(() => {
        setShowProfileModal(true);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [user, isFirstLogin, hasEverCompletedProfile]);

  const handleCompleteProfile = () => {
    setShowProfileModal(false);
    // Navigate to profile settings
    window.location.href = '/user-profile';
  };

  const handleSkipProfile = () => {
    setShowProfileModal(false);
    // Mark in localStorage that user has seen the modal (for this session)
    localStorage.setItem('profile_modal_shown', 'true');
  };

  // Fetch placement test status - HIGHEST PRIORITY for new learners
  const { data: placementStatus } = useQuery<PlacementTestStatus>({
    queryKey: ['/api/student/placement-status'],
    queryFn: async () => {
      const response = await fetch('/api/student/placement-status', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch placement status');
      return response.json();
    }
  });

  // Fetch comprehensive student stats with real data
  const { data: stats } = useQuery<StudentStats>({
    queryKey: ['/api/student/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return {
          totalLessons: 45,
          completedLessons: 28,
          currentStreak: 7,
          totalXP: 3250,
          currentLevel: 8,
          nextLevelXP: 4000,
          walletBalance: 2500000,
          memberTier: 'Gold',
          studyTimeThisWeek: 420,
          weeklyGoalHours: 10,
          accuracy: 87,
          rank: 12,
          totalStudents: 458,
          badges: ['fast-learner', 'streak-master', 'quiz-champion'],
          weeklyProgress: [
            { day: 'Mon', xp: 120, minutes: 45 },
            { day: 'Tue', xp: 85, minutes: 30 },
            { day: 'Wed', xp: 200, minutes: 75 },
            { day: 'Thu', xp: 150, minutes: 60 },
            { day: 'Fri', xp: 95, minutes: 40 },
            { day: 'Sat', xp: 180, minutes: 80 },
            { day: 'Sun', xp: 220, minutes: 90 }
          ],
          skillsProgress: [
            { skill: 'Speaking', level: 7, progress: 65 },
            { skill: 'Listening', level: 8, progress: 80 },
            { skill: 'Reading', level: 9, progress: 45 },
            { skill: 'Writing', level: 6, progress: 70 },
            { skill: 'Grammar', level: 8, progress: 55 }
          ],
          recentAchievements: [
            { id: 1, title: '7-Day Streak', icon: 'flame', date: '2024-01-20' },
            { id: 2, title: 'Quiz Master', icon: 'trophy', date: '2024-01-19' },
            { id: 3, title: 'Fast Learner', icon: 'zap', date: '2024-01-18' }
          ]
        };
      }
      return response.json();
    }
  });

  const xpProgress = stats ? ((stats.totalXP % 1000) / 1000) * 100 : 0;
  const weeklyStudyProgress = stats ? (stats.studyTimeThisWeek / (stats.weeklyGoalHours * 60)) * 100 : 0;

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500", isRTL && "rtl")}>
      {/* Modern Clean Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white">
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl">{t('student:brand')}</h1>
                <Badge className="bg-gradient-to-r from-yellow-400 to-orange-500 text-white font-bold text-xs px-2 py-1">
                  {stats?.memberTier || t('student:memberTierFallback')}
                </Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white">
                <Calendar className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative text-white">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Clean White Cards */}
      <div className="px-4 py-6 pb-24 space-y-6">
        {/* User Greeting Card */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="flex items-center gap-4">
              <Avatar className="w-14 h-14 border-3 border-white shadow-lg">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-lg">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-900">
                  {t('student:welcomeGreeting', { firstName: user?.firstName })}
                </h2>
                <p className="text-gray-600 text-sm">
                  {t('student:readyForLessons')}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* HIGHEST PRIORITY: Placement Test for New Learners */}
        {placementStatus && !placementStatus.hasCompletedPlacementTest && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-xl font-bold text-gray-900 mb-2">
                    {t('student:placementTestRequired')}
                  </h3>
                  <p className="text-gray-600 text-sm mb-4">
                    {t('student:placementTestDescription')}
                  </p>
                </div>
                <div className="w-12 h-12 rounded-full bg-gradient-to-br from-pink-500 to-purple-500 flex items-center justify-center">
                  <Target className="w-6 h-6 text-white" />
                </div>
              </div>

              <div className="bg-gray-50 rounded-xl p-4 mb-6">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold text-gray-900">{t('student:levelAssessment')}</h4>
                  <Badge className="bg-green-500 text-white text-xs font-bold px-2 py-1">
                    {t('student:free')}
                  </Badge>
                </div>
                
                <div className="flex items-center gap-4 text-sm text-gray-600 mb-4">
                  <div className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    <span>25 mins</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Users className="w-4 h-4" />
                    <span>50 questions</span>
                  </div>
                </div>

                {placementStatus.weeklyLimits?.canTakeTest ? (
                  <Button 
                    className="w-full bg-gradient-to-r from-pink-500 to-blue-500 hover:from-pink-600 hover:to-blue-600 text-white font-bold py-3 rounded-xl"
                    asChild
                  >
                    <Link href="/mst">
                      {t('student:startPlacementTest')}
                    </Link>
                  </Button>
                ) : (
                  <Button 
                    className="w-full bg-gray-400 text-white font-bold py-3 rounded-xl"
                    disabled
                  >
                    {t('student:weeklyLimitReached')}
                  </Button>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* My Classes Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg">
            <div className="mb-6">
              <h3 className="text-xl font-bold text-gray-900 mb-2">
                {t('student:myClasses')}
              </h3>
              <p className="text-gray-600 text-sm">
                {t('student:upcomingSessions')}
              </p>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{t('student:todaysClasses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-green-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center p-0">
                    2
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>

              <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span className="font-medium text-gray-900">{t('student:moreClasses')}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className="bg-red-500 text-white text-xs font-bold w-6 h-6 rounded-full flex items-center justify-center p-0">
                    3
                  </Badge>
                  <ChevronRight className="w-5 h-5 text-gray-400" />
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Socializer Availability System */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.15 }}
        >
          <Card className="bg-gradient-to-r from-purple-50 to-pink-50 border-2 border-purple-300 shadow-xl">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                    <Users className="w-6 h-6 text-white" />
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-gray-900">
                      {t('student:socializer')}
                    </h3>
                    <p className="text-gray-600 text-sm">
                      {t('student:socializerDesc')}
                    </p>
                  </div>
                </div>
                <Badge variant="outline" className="text-xs bg-purple-100 text-purple-700 border-purple-200">
                  {t('student:aiMatching')}
                </Badge>
              </div>
              <div className="grid grid-cols-1 gap-4">
                <Button 
                  className="bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white"
                  onClick={() => {
                    // Toggle socializer availability
                  }}
                >
                  <Heart className="w-4 h-4 mr-2" />
                  {t('student:toggleAvailability')}
                </Button>
              </div>
              <p className="text-xs text-gray-500 mt-3 text-center">
                {t('student:socializerNote')}
              </p>
            </CardContent>
          </Card>
        </motion.div>

        {/* Special Classes & Online Teacher Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Special Classes - Admin Featured */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.2 }}
          >
            <Card className="bg-gradient-to-r from-emerald-50 to-green-50 border-2 border-emerald-300 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center">
                      <Star className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {t('student:specialClasses', 'کلاس‌های ویژه')}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t('student:specialClassesDesc', 'پیشنهادی مدیران آموزشی')}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline" className="bg-emerald-100 text-emerald-700 border-emerald-200">
                    {t('student:featured', 'پیشنهاد ویژه')}
                  </Badge>
                </div>
                <div className="bg-white rounded-lg p-4 border border-emerald-200 mb-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge className="text-xs bg-emerald-500 text-white">
                        {t('student:featured', 'پیشنهاد ویژه')}
                      </Badge>
                      <Badge className="text-xs bg-orange-500 text-white">
                        25% {t('common:discount', 'تخفیف')}
                      </Badge>
                    </div>
                    <span className="text-gray-500 text-xs">4 {t('student:spotsLeft', 'جا باقی')}</span>
                  </div>
                  <h4 className="font-bold text-gray-900 mb-1">
                    {t('student:businessEnglish', 'انگلیسی تجاری پیشرفته')}
                  </h4>
                  <p className="text-gray-600 text-sm mb-3">
                    {t('student:nativeSpeaker', 'با استاد بومی • 8 جلسه')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-gray-900">750,000</span>
                      <span className="text-gray-400 text-sm line-through">1,000,000</span>
                      <span className="text-gray-600 text-sm">{t('common:currency', 'تومان')}</span>
                    </div>
                    <Button size="sm" className="bg-emerald-500 hover:bg-emerald-600">
                      {t('student:enroll', 'ثبت نام')}
                    </Button>
                  </div>
                </div>
                <Button variant="outline" className="w-full border-emerald-300 text-emerald-700 hover:bg-emerald-50">
                  <Award className="w-4 h-4 mr-2" />
                  {t('student:viewAllSpecial', 'مشاهده همه کلاس‌های ویژه')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>

          {/* Online Teacher Cards */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.25 }}
          >
            <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-300 shadow-xl h-full">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center">
                      <Video className="w-5 h-5 text-white" />
                    </div>
                    <div>
                      <h3 className="font-bold text-lg text-gray-900">
                        {t('student:onlineTeachers', 'استادان آنلاین')}
                      </h3>
                      <p className="text-gray-600 text-sm">
                        {t('student:onlineTeachersDesc', 'استادان در دسترس برای CallerN')}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                    <span className="text-green-600 text-xs font-medium">3 آنلاین</span>
                  </div>
                </div>
                <div className="space-y-3 mb-4">
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-orange-400 to-orange-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        S
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Sarah Johnson</p>
                        <p className="text-gray-500 text-xs">Native English • IELTS Expert</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between bg-white rounded-lg p-3 border border-blue-200">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-purple-400 to-purple-500 rounded-full flex items-center justify-center text-white text-sm font-bold">
                        M
                      </div>
                      <div>
                        <p className="font-medium text-gray-900 text-sm">Mike Chen</p>
                        <p className="text-gray-500 text-xs">Business English • 5+ years</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                      <span className="text-xs text-gray-500">Available</span>
                    </div>
                  </div>
                </div>
                <Button className="w-full bg-blue-500 hover:bg-blue-600">
                  <Video className="w-4 h-4 mr-2" />
                  {t('student:startCallerN', 'شروع جلسه CallerN')}
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Key Performance Indicators */}
        <motion.div 
          className="grid grid-cols-2 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          {/* Study Streak Card */}
          <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Flame className="h-8 w-8 text-orange-500" />
                <span className="text-2xl font-bold text-orange-700">{stats?.currentStreak || 0}</span>
              </div>
              <p className="text-xs text-gray-600">{t('student:dayStreak', 'روز متوالی')}</p>
              <Progress value={Math.min((stats?.currentStreak || 0) * 10, 100)} className="h-1.5 mt-2" />
            </CardContent>
          </Card>

          {/* XP & Level Card */}
          <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 shadow-lg">
            <CardContent className="p-4">
              <div className="flex items-center justify-between mb-2">
                <Zap className="h-8 w-8 text-purple-500" />
                <span className="text-2xl font-bold text-purple-700">{stats?.totalXP || 0}</span>
              </div>
              <p className="text-xs text-gray-600">XP - Level {stats?.currentLevel || 1}</p>
              <Progress value={xpProgress} className="h-1.5 mt-2" />
            </CardContent>
          </Card>
        </motion.div>

        {/* Weekly Study Progress Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  {t('student:weeklyProgress', 'پیشرفت هفتگی')}
                </CardTitle>
                <Badge variant="outline" className="text-xs">
                  {Math.round(weeklyStudyProgress)}% {t('student:ofGoal', 'از هدف')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="pb-3">
              <ResponsiveContainer width="100%" height={120}>
                <AreaChart data={stats?.weeklyProgress || []}>
                  <defs>
                    <linearGradient id="colorXP" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#8B5CF6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8B5CF6" stopOpacity={0.1}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis dataKey="day" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'rgba(255, 255, 255, 0.95)', 
                      border: '1px solid #e5e7eb',
                      borderRadius: '8px',
                      fontSize: '12px'
                    }} 
                  />
                  <Area type="monotone" dataKey="xp" stroke="#8B5CF6" fillOpacity={1} fill="url(#colorXP)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
              
              {/* Study Time Summary */}
              <div className="grid grid-cols-3 gap-2 mt-3">
                <div className="text-center p-2 bg-gray-50 rounded-lg">
                  <p className="text-xs text-gray-500">{t('student:today', 'امروز')}</p>
                  <p className="text-sm font-bold text-gray-900">
                    {stats?.weeklyProgress?.[6]?.minutes || 0} {t('student:min', 'دقیقه')}
                  </p>
                </div>
                <div className="text-center p-2 bg-blue-50 rounded-lg">
                  <p className="text-xs text-gray-500">{t('student:thisWeek', 'این هفته')}</p>
                  <p className="text-sm font-bold text-blue-600">
                    {Math.round((stats?.studyTimeThisWeek || 0) / 60)} {t('student:hours', 'ساعت')}
                  </p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-xs text-gray-500">{t('student:accuracy', 'دقت')}</p>
                  <p className="text-sm font-bold text-green-600">{stats?.accuracy || 0}%</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Skills Progress */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <CardTitle className="text-base flex items-center gap-2">
                <Brain className="h-4 w-4 text-indigo-500" />
                {t('student:skillsProgress', 'پیشرفت مهارت‌ها')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats?.skillsProgress?.map((skill, index) => (
                  <div key={index} className="space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-gray-700">{skill.skill}</span>
                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">Lvl {skill.level}</Badge>
                        <span className="text-xs text-gray-500">{skill.progress}%</span>
                      </div>
                    </div>
                    <Progress 
                      value={skill.progress} 
                      className="h-2"
                      style={{
                        background: `linear-gradient(to right, 
                          ${skill.progress > 70 ? '#10b981' : skill.progress > 40 ? '#f59e0b' : '#ef4444'} ${skill.progress}%, 
                          #e5e7eb ${skill.progress}%)`
                      }}
                    />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Quick Actions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-blue-50 to-indigo-50">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">{t('student:quickActions', 'دسترسی سریع')}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-5 gap-2">
                <Link href="/callern">
                  <motion.div 
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Package className="h-6 w-6 text-indigo-500 mb-1" />
                    <span className="text-xs text-gray-600 text-center">{t('student:packages', 'بسته‌ها')}</span>
                  </motion.div>
                </Link>

                <Link href="/student/sessions">
                  <motion.div 
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Video className="h-6 w-6 text-blue-500 mb-1" />
                    <span className="text-xs text-gray-600 text-center">{t('student:sessionsTitle', 'جلسات')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/student/courses">
                  <motion.div 
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <BookOpen className="h-6 w-6 text-green-500 mb-1" />
                    <span className="text-xs text-gray-600 text-center">{t('student:courses.title', 'دوره‌ها')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/student/achievements">
                  <motion.div 
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Trophy className="h-6 w-6 text-amber-500 mb-1" />
                    <span className="text-xs text-gray-600 text-center">{t('student:achievements', 'دستاوردها')}</span>
                  </motion.div>
                </Link>
                
                <Link href="/student/homework">
                  <motion.div 
                    className="flex flex-col items-center p-2 bg-white rounded-lg shadow-sm hover:shadow-md transition-all cursor-pointer relative"
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <Target className="h-6 w-6 text-purple-500 mb-1" />
                    <span className="text-xs text-gray-600 text-center">{t('student:homework', 'تکالیف')}</span>
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">3</span>
                  </motion.div>
                </Link>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Recent Achievements */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Award className="h-4 w-4 text-yellow-500" />
                  {t('student:recentAchievements', 'دستاوردهای اخیر')}
                </CardTitle>
                <Link href="/student/achievements">
                  <Button variant="ghost" size="sm" className="text-xs">
                    {t('common:viewAll', 'مشاهده همه')}
                    <ChevronRight className="h-3 w-3 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {stats?.recentAchievements?.map((achievement) => (
                  <motion.div 
                    key={achievement.id}
                    className="flex items-center gap-3 p-2 bg-yellow-50 rounded-lg"
                    whileHover={{ x: isRTL ? -5 : 5 }}
                  >
                    <div className="w-10 h-10 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center shadow">
                      {achievement.icon === 'flame' && <Flame className="h-5 w-5 text-white" />}
                      {achievement.icon === 'trophy' && <Trophy className="h-5 w-5 text-white" />}
                      {achievement.icon === 'zap' && <Zap className="h-5 w-5 text-white" />}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{achievement.title}</p>
                      <p className="text-xs text-gray-500">{new Date(achievement.date).toLocaleDateString(isRTL ? 'fa-IR' : 'en-US')}</p>
                    </div>
                    <Sparkles className="h-4 w-4 text-yellow-500" />
                  </motion.div>
                ))}
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Callern Packages */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-indigo-50 to-purple-50">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Package className="h-4 w-4 text-indigo-500" />
                  {t('student:callernPackages', 'بسته‌های کالرن')}
                </CardTitle>
                <Link href="/callern">
                  <Button variant="ghost" size="sm" className="text-xs">
                    {t('common:viewAll', 'مشاهده همه')}
                    <ChevronRight className="h-3 w-3 mr-1" />
                  </Button>
                </Link>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-3">
                <div className="bg-white p-3 rounded-lg border border-indigo-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{t('student:activePackage', 'بسته فعال')}</span>
                    <Badge variant="secondary" className="text-xs">VIP</Badge>
                  </div>
                  <p className="text-lg font-bold text-indigo-600">450 {t('student:minutes', 'دقیقه')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('student:remaining', 'باقیمانده')}</p>
                </div>
                <div className="bg-white p-3 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-gray-500">{t('student:totalUsed', 'استفاده شده')}</span>
                    <Clock className="h-4 w-4 text-purple-500" />
                  </div>
                  <p className="text-lg font-bold text-purple-600">150 {t('student:minutes', 'دقیقه')}</p>
                  <p className="text-xs text-gray-500 mt-1">{t('student:thisMonth', 'این ماه')}</p>
                </div>
              </div>
              <Link href="/callern">
                <Button variant="outline" className="w-full mt-3" size="sm">
                  <Package className="h-4 w-4 mr-2" />
                  {t('student:purchaseNewPackage', 'خرید بسته جدید')}
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>

        {/* Upcoming Sessions */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.7 }}
        >
          <Card className="shadow-xl">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-green-500" />
                  {t('student:upcomingSessions', 'جلسات آینده')}
                </CardTitle>
                <Badge variant="secondary" className="text-xs">
                  3 {t('student:thisWeek', 'این هفته')}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Sample session cards - replace with real data */}
                <div className="flex items-center gap-3 p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Video className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-800">{t('student:conversationPractice', 'تمرین مکالمه')}</p>
                    <p className="text-xs text-gray-500">
                      {t('student:tomorrow', 'فردا')} - 14:00
                    </p>
                  </div>
                  <Button size="sm" className="bg-green-500 hover:bg-green-600">
                    {t('student:join', 'ورود')}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Daily Challenge */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8 }}
        >
          <Card className="shadow-xl bg-gradient-to-r from-purple-500 to-pink-500 text-white">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-bold text-lg mb-1">{t('student:dailyChallenge', 'چالش روزانه')}</h3>
                  <p className="text-sm text-white/80">{t('student:complete5Lessons', 'تکمیل 5 درس امروز')}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <Progress value={60} className="flex-1 h-2 bg-white/30" />
                    <span className="text-xs font-bold">3/5</span>
                  </div>
                </div>
                <div className="text-center">
                  <p className="text-xs text-white/70">{t('student:reward', 'جایزه')}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Coins className="h-5 w-5" />
                    <span className="font-bold">+50 XP</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Modern Bottom Navigation */}
      <motion.div 
        className="fixed bottom-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-xl border-t border-gray-200/50"
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.5 }}
      >
        <div className="flex items-center justify-around py-3 px-4">
          <Link href="/student/dashboard">
            <div className="flex flex-col items-center gap-1 py-2 px-4 bg-gradient-to-r from-pink-500 to-purple-500 rounded-2xl">
              <Home className="w-5 h-5 text-white" />
              <span className="text-xs font-medium text-white">Home</span>
            </div>
          </Link>
          
          <Link href="/student/courses">
            <div className="flex flex-col items-center gap-1 py-2 px-3">
              <BookOpen className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500">Classes</span>
            </div>
          </Link>
          
          <Link href="/callern">
            <div className="flex flex-col items-center gap-1 py-2 px-3">
              <Video className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500">CallerN</span>
            </div>
          </Link>
          
          <Link href="/student/ai-conversation">
            <div className="flex flex-col items-center gap-1 py-2 px-3">
              <Brain className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500">Lexi</span>
            </div>
          </Link>
          
          <Link href="/student/messages">
            <div className="flex flex-col items-center gap-1 py-2 px-3">
              <MessageCircle className="w-5 h-5 text-gray-500" />
              <span className="text-xs text-gray-500">Support</span>
            </div>
          </Link>
        </div>
      </motion.div>

      {/* First-time Profile Completion Modal */}
      <FirstTimeProfileModal
        isOpen={showProfileModal}
        onComplete={handleCompleteProfile}
        onSkip={handleSkipProfile}
      />
    </div>
  );
}