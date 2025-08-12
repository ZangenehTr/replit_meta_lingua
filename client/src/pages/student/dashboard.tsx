import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
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
  Plus,
  Bell,
  Search,
  Filter,
  Wallet,
  Users,
  MessageCircle,
  Video,
  Mic,
  Brain,
  Heart,
  Package,
  GraduationCap,
  Play
} from "lucide-react";
import { Link } from "wouter";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

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
}

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  progress: number;
  tutorFirstName: string;
  tutorLastName: string;
  totalLessons: number;
  completedLessons: number;
}

interface UpcomingSession {
  id: number;
  title: string;
  tutorFirstName: string;
  tutorLastName: string;
  sessionDate: string;
  startTime: string;
  duration: number;
  type: 'group' | 'individual';
  sessionUrl?: string;
  canJoin: boolean;
}

export default function StudentDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [greeting, setGreeting] = useState('');

  // Get appropriate greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('student:goodMorning', 'Good Morning'));
    else if (hour < 18) setGreeting(t('student:goodAfternoon', 'Good Afternoon'));
    else setGreeting(t('student:goodEvening', 'Good Evening'));
  }, [t]);

  // Fetch student stats
  const { data: stats } = useQuery<StudentStats>({
    queryKey: ['/api/student/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        // Return default stats if API fails
        return {
          totalLessons: 0,
          completedLessons: 0,
          currentStreak: 0,
          totalXP: 0,
          currentLevel: 1,
          nextLevelXP: 1000,
          walletBalance: 0,
          memberTier: 'Bronze',
          studyTimeThisWeek: 0,
          weeklyGoalHours: 10
        };
      }
      return response.json();
    }
  });

  // Fetch courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/student/courses'],
    queryFn: async () => {
      const response = await fetch('/api/student/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({
    queryKey: ['/api/student/sessions/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/student/sessions/upcoming', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  const progressPercentage = stats ? (stats.completedLessons / Math.max(stats.totalLessons, 1)) * 100 : 0;
  const xpProgress = stats ? ((stats.totalXP % 1000) / 1000) * 100 : 0;

  return (
    <div className="mobile-gradient-primary min-h-screen">
      {/* Mobile Header with Glassmorphism */}
      <motion.header 
        className="mobile-header sticky top-0 z-40"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex items-center justify-between px-5 py-4">
          <div className="flex items-center gap-3">
            <Avatar className="w-12 h-12 border-2 border-purple-300/50">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div>
              <p className="text-gray-600 text-sm">{greeting}</p>
              <h1 className="text-gray-900 font-bold text-lg">
                {user?.firstName} {user?.lastName}
              </h1>
            </div>
          </div>
          <div className="flex gap-2">
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full glass-button"
            >
              <Search className="w-5 h-5 text-gray-700" />
            </motion.button>
            <motion.button
              whileTap={{ scale: 0.95 }}
              className="p-2 rounded-full glass-button relative"
            >
              <Bell className="w-5 h-5 text-gray-700" />
              <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
            </motion.button>
          </div>
        </div>
      </motion.header>

      {/* Main Content */}
      <div className="mobile-scroll px-5 py-4 pb-24">
        {/* Stats Overview */}
        <motion.div 
          className="grid grid-cols-2 gap-4 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
            {/* Streak Card */}
            <motion.div 
              className="glass-card p-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-orange-400 to-red-500">
                  <Flame className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">{t('student:streak', 'Streak')}</p>
                  <p className="text-white text-2xl font-bold">{stats?.currentStreak || 0}</p>
                  <p className="text-white/50 text-xs">{t('student:days', 'days')}</p>
                </div>
              </div>
            </motion.div>

            {/* XP Card */}
            <motion.div 
              className="glass-card p-4"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-purple-400 to-blue-500">
                  <Zap className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">{t('student:totalXP', 'Total XP')}</p>
                  <p className="text-white text-2xl font-bold">{stats?.totalXP || 0}</p>
                  <p className="text-white/50 text-xs">Level {stats?.currentLevel || 1}</p>
                </div>
              </div>
            </motion.div>
          </motion.div>

          {/* Progress Section */}
          <motion.div 
            className="glass-card p-5 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
          >
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-white font-semibold text-lg">{t('student:weeklyProgress', 'Weekly Progress')}</h2>
              <span className="text-white/70 text-sm">
                {stats?.studyTimeThisWeek || 0}/{stats?.weeklyGoalHours || 10} {t('student:hours', 'hours')}
              </span>
            </div>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">{t('student:lessonsCompleted', 'Lessons Completed')}</span>
                  <span className="text-white">{stats?.completedLessons || 0}/{stats?.totalLessons || 0}</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-green-400 to-blue-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${progressPercentage}%` }}
                    transition={{ duration: 1, delay: 0.5 }}
                  />
                </div>
              </div>
              
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-white/70">{t('student:xpToNextLevel', 'XP to Next Level')}</span>
                  <span className="text-white">{stats?.totalXP % 1000}/1000 XP</span>
                </div>
                <div className="h-2 bg-white/10 rounded-full overflow-hidden">
                  <motion.div 
                    className="h-full bg-gradient-to-r from-purple-400 to-pink-500"
                    initial={{ width: 0 }}
                    animate={{ width: `${xpProgress}%` }}
                    transition={{ duration: 1, delay: 0.6 }}
                  />
                </div>
              </div>
            </div>
          </motion.div>

          {/* Quick Actions */}
          <motion.div 
            className="grid grid-cols-3 gap-3 mb-6"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
          >
            <Link href="/student/sessions">
              <motion.div 
                className="glass-card p-4 text-center"
                whileTap={{ scale: 0.95 }}
              >
                <Calendar className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white/90 text-xs font-medium">{t('student:joinClass', 'Join Class')}</p>
              </motion.div>
            </Link>
            
            <Link href="/student/homework">
              <motion.div 
                className="glass-card p-4 text-center"
                whileTap={{ scale: 0.95 }}
              >
                <BookOpen className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white/90 text-xs font-medium">{t('student:homework', 'Homework')}</p>
              </motion.div>
            </Link>
            
            <Link href="/student/AIConversation">
              <motion.div 
                className="glass-card p-4 text-center"
                whileTap={{ scale: 0.95 }}
              >
                <Trophy className="w-8 h-8 text-white mx-auto mb-2" />
                <p className="text-white/90 text-xs font-medium">{t('student:practice', 'Practice')}</p>
              </motion.div>
            </Link>
          </motion.div>

          {/* Upcoming Sessions */}
          {upcomingSessions.length > 0 && (
            <motion.div 
              className="mb-6"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold text-lg">{t('student:upcomingSessions', 'Upcoming Sessions')}</h2>
                <Link href="/sessions">
                  <span className="text-white/70 text-sm flex items-center gap-1">
                    {t('common:viewAll', 'View All')} <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              
              <div className="space-y-3">
                {upcomingSessions.slice(0, 2).map((session, index) => (
                  <motion.div 
                    key={session.id}
                    className="glass-card p-4"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: 0.5 + index * 0.1 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-medium">{session.title}</h3>
                        <p className="text-white/60 text-sm mt-1">
                          {session.tutorFirstName} {session.tutorLastName}
                        </p>
                        <div className="flex items-center gap-2 mt-2">
                          <Clock className="w-4 h-4 text-white/50" />
                          <span className="text-white/70 text-sm">
                            {new Date(session.sessionDate).toLocaleDateString()} - {session.startTime}
                          </span>
                        </div>
                      </div>
                      {session.canJoin && (
                        <motion.button 
                          className="px-3 py-1 bg-white/20 rounded-lg text-white text-sm font-medium flex items-center gap-1"
                          whileTap={{ scale: 0.95 }}
                        >
                          <Play className="w-3 h-3" />
                          {t('student:join', 'Join')}
                        </motion.button>
                      )}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Active Courses */}
          {courses.length > 0 && (
            <motion.div 
              className="mb-20"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-white font-semibold text-lg">{t('student:myCourses', 'My Courses')}</h2>
                <Link href="/courses">
                  <span className="text-white/70 text-sm flex items-center gap-1">
                    {t('common:viewAll', 'View All')} <ChevronRight className="w-4 h-4" />
                  </span>
                </Link>
              </div>
              
              <div className="grid grid-cols-2 gap-3">
                {courses.slice(0, 4).map((course, index) => (
                  <motion.div 
                    key={course.id}
                    className="mobile-course-card"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: 0.6 + index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                  >
                    <div className="aspect-video bg-gradient-to-br from-purple-400 to-blue-500 rounded-lg mb-3 flex items-center justify-center">
                      <BookOpen className="w-8 h-8 text-white" />
                    </div>
                    <h3 className="font-medium text-gray-800 text-sm line-clamp-1">{course.title}</h3>
                    <p className="text-gray-500 text-xs mt-1">{course.level}</p>
                    <div className="mt-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-gray-600">{t('student:progress', 'Progress')}</span>
                        <span className="text-purple-600 font-medium">{course.progress || 0}%</span>
                      </div>
                      <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-400 to-blue-500"
                          style={{ width: `${course.progress || 0}%` }}
                        />
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Wallet Balance Card */}
          <motion.div 
            className="glass-card p-5 mb-20"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.6 }}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 rounded-full bg-gradient-to-br from-green-400 to-blue-500">
                  <Wallet className="w-6 h-6 text-white" />
                </div>
                <div>
                  <p className="text-white/70 text-sm">{t('student:walletBalance', 'Wallet Balance')}</p>
                  <p className="text-white text-2xl font-bold">
                    {new Intl.NumberFormat('fa-IR', {
                      style: 'currency',
                      currency: 'IRR',
                      minimumFractionDigits: 0,
                    }).format(stats?.walletBalance || 0)}
                  </p>
                </div>
              </div>
              <Badge className="bg-white/20 text-white border-white/30">
                {stats?.memberTier || 'Bronze'}
              </Badge>
            </div>
          </motion.div>
      </div>

      {/* Floating Action Button */}
      <motion.button
        className="fab"
        whileTap={{ scale: 0.9 }}
        initial={{ scale: 0 }}
        animate={{ scale: 1 }}
        transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.8 }}
      >
        <Plus className="w-6 h-6 text-white" />
      </motion.button>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}