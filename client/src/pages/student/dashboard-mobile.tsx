import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  GlossyFantasyLayout,
  GlossyCard,
  GlossyButton,
  GlossyProgress,
  StatCard,
  ListItem,
  GlossyTabs,
  Badge,
  FAB
} from "@/components/mobile/GlossyFantasyLayout";
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
  Sparkles,
  Users,
  Video,
  MessageCircle,
  Map,
  Gamepad2,
  PlayCircle
} from "lucide-react";
import { Link } from "wouter";

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

export default function StudentDashboardMobile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [greeting, setGreeting] = useState('');

  // Get appropriate greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('student:goodMorning'));
    else if (hour < 18) setGreeting(t('student:goodAfternoon'));
    else setGreeting(t('student:goodEvening'));
  }, [t]);

  // Fetch student stats
  const { data: stats, isLoading: statsLoading } = useQuery<StudentStats>({
    queryKey: ['/api/student/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Fetch courses
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/student/courses'],
    queryFn: async () => {
      const response = await fetch('/api/student/courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Fetch upcoming sessions
  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['/api/student/sessions/upcoming'],
    queryFn: async () => {
      const response = await fetch('/api/student/sessions/upcoming', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });

  const progressPercentage = stats ? (stats.completedLessons / stats.totalLessons) * 100 : 0;
  const xpProgress = stats ? ((stats.totalXP % 1000) / 1000) * 100 : 0;

  // Tab items for navigation
  const tabItems = [
    { id: 'overview', label: t('student:overview'), icon: <Sparkles className="w-4 h-4" /> },
    { id: 'courses', label: t('student:courses'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'social', label: t('student:social'), icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <GlossyFantasyLayout 
      title={`${greeting}, ${user?.firstName}!`}
      showSearch={true}
      showNotifications={true}
    >
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Flame className="w-6 h-6 text-white" />}
          label={t('student:streak')}
          value={stats?.currentStreak || 0}
          subValue={t('student:days')}
          color="orange"
        />
        
        <StatCard
          icon={<Zap className="w-6 h-6 text-white" />}
          label={t('student:totalXP')}
          value={stats?.totalXP || 0}
          subValue={`Level ${stats?.currentLevel || 1}`}
          color="purple"
        />
        
        <StatCard
          icon={<Trophy className="w-6 h-6 text-white" />}
          label={t('student:completed')}
          value={stats?.completedLessons || 0}
          subValue={`of ${stats?.totalLessons || 0} lessons`}
          color="green"
        />
        
        <StatCard
          icon={<Clock className="w-6 h-6 text-white" />}
          label={t('student:studyTime')}
          value={`${stats?.studyTimeThisWeek || 0}h`}
          subValue={`Goal: ${stats?.weeklyGoalHours || 10}h`}
          color="blue"
        />
      </div>

      {/* Navigation Tabs */}
      <GlossyTabs
        items={tabItems}
        activeTab={selectedTab}
        onTabChange={setSelectedTab}
      />

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {selectedTab === 'overview' && (
          <motion.div
            key="overview"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Progress Section */}
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Target className="w-5 h-5" />
                {t('student:yourProgress')}
              </h3>
              
              <div className="space-y-4">
                <GlossyProgress
                  value={progressPercentage}
                  label={t('student:courseProgress')}
                  showPercentage={true}
                />
                
                <GlossyProgress
                  value={xpProgress}
                  label={t('student:levelProgress')}
                  showPercentage={true}
                />
                
                <GlossyProgress
                  value={(stats?.studyTimeThisWeek || 0) / (stats?.weeklyGoalHours || 10) * 100}
                  label={t('student:weeklyGoal')}
                  showPercentage={true}
                />
              </div>
            </GlossyCard>

            {/* Quick Actions - Core Features */}
            <div className="grid grid-cols-2 gap-4">
              <GlossyCard interactive className="p-4">
                <Link href="/student/roadmap">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2">
                      <Map className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{t('student:myRoadmap')}</span>
                    <span className="text-white/60 text-xs mt-1">{t('student:learningPath')}</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/callern">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-2">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">Callern</span>
                    <span className="text-white/60 text-xs mt-1">{t('student:instantTutoring')}</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/games">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                      <Gamepad2 className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{t('student:games')}</span>
                    <span className="text-white/60 text-xs mt-1">{t('student:playAndLearn')}</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/video-courses">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center mb-2">
                      <PlayCircle className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">{t('student:videoCourses')}</span>
                    <span className="text-white/60 text-xs mt-1">{t('student:watchAndLearn')}</span>
                  </div>
                </Link>
              </GlossyCard>
            </div>

            {/* Upcoming Sessions */}
            <GlossyCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('student:upcomingSessions')}
                </h3>
                <Badge variant="info" size="sm">
                  {upcomingSessions.length} {t('student:scheduled')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {upcomingSessions.slice(0, 3).map((session: any, index: number) => (
                  <ListItem
                    key={index}
                    title={session.courseName}
                    subtitle={`${session.date} at ${session.time}`}
                    leftIcon={<Video className="w-5 h-5" />}
                    rightContent={<ChevronRight className="w-5 h-5" />}
                    onClick={() => console.log('Session clicked')}
                  />
                ))}
              </div>
              
              {upcomingSessions.length > 3 && (
                <GlossyButton 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="mt-3"
                >
                  {t('student:viewAllSessions')}
                </GlossyButton>
              )}
            </GlossyCard>

            {/* Quick Actions */}
            <div className="grid grid-cols-2 gap-3">
              <GlossyButton variant="primary" fullWidth>
                <Link href="/student/courses-mobile" className="flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  {t('student:browseCourses')}
                </Link>
              </GlossyButton>
              
              <GlossyButton variant="success" fullWidth>
                <Link href="/callern-mobile" className="flex items-center gap-2">
                  <Video className="w-5 h-5" />
                  {t('student:startCallern')}
                </Link>
              </GlossyButton>
            </div>
          </motion.div>
        )}

        {selectedTab === 'courses' && (
          <motion.div
            key="courses"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {courses.map((course: any, index: number) => (
              <GlossyCard key={index} interactive>
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{course.name}</h4>
                    <p className="text-white/60 text-sm mt-1">{course.description}</p>
                    <div className="flex items-center gap-3 mt-3">
                      <Badge variant="success" size="sm">
                        {course.level}
                      </Badge>
                      <span className="text-white/50 text-sm">
                        {course.completedLessons}/{course.totalLessons} lessons
                      </span>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/40" />
                </div>
                <div className="mt-3">
                  <GlossyProgress
                    value={(course.completedLessons / course.totalLessons) * 100}
                    showPercentage={true}
                  />
                </div>
              </GlossyCard>
            ))}
          </motion.div>
        )}

        {selectedTab === 'social' && (
          <motion.div
            key="social"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('student:leaderboard')}
              </h3>
              
              <div className="space-y-3">
                {[1, 2, 3].map((rank) => (
                  <ListItem
                    key={rank}
                    title={`Student ${rank}`}
                    subtitle={`${1000 - rank * 100} XP this week`}
                    leftIcon={
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {rank}
                      </div>
                    }
                    rightContent={<Trophy className="w-5 h-5 text-yellow-500" />}
                  />
                ))}
              </div>
            </GlossyCard>

            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                {t('student:studyGroups')}
              </h3>
              
              <div className="space-y-2">
                <ListItem
                  title="English Conversation Club"
                  subtitle="23 members • Active now"
                  leftIcon={<Users className="w-5 h-5" />}
                  rightContent={<Badge variant="success" size="sm">Join</Badge>}
                />
                <ListItem
                  title="Grammar Warriors"
                  subtitle="15 members • 2 new messages"
                  leftIcon={<Users className="w-5 h-5" />}
                  rightContent={<Badge variant="warning" size="sm">2</Badge>}
                />
              </div>
            </GlossyCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus className="w-6 h-6 text-white" />}
        onClick={() => console.log('FAB clicked')}
      />
    </GlossyFantasyLayout>
  );
}