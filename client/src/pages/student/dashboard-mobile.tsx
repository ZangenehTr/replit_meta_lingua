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
  PlayCircle,
  CheckCircle2
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

interface PlacementTestStatus {
  hasCompletedPlacementTest: boolean;
  placementResults?: {
    overallLevel: string;
    speakingLevel: string;
    listeningLevel: string;
    readingLevel: string;
    writingLevel: string;
    completedAt: string;
  };
  message: string;
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
            {/* HIGHEST PRIORITY: Placement Test for New Learners */}
            {placementStatus && !placementStatus.hasCompletedPlacementTest && (
              <GlossyCard className="border-2 border-red-500/50 bg-gradient-to-r from-red-500/20 to-orange-500/20">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
                    <Target className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-white font-bold text-lg mb-2">
                    {t('student:placementTestRequired', 'Complete Your Placement Test')}
                  </h3>
                  <p className="text-white/80 text-sm mb-4">
                    {t('student:placementTestDescription', 'Take our 6-minute placement test to create your personalized learning path and find your perfect starting level.')}
                  </p>
                  <GlossyButton 
                    variant="warning" 
                    fullWidth 
                    className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600"
                  >
                    <Link href="/mst" className="flex items-center justify-center gap-2 w-full">
                      <Zap className="w-5 h-5" />
                      {t('student:startPlacementTest', 'Start Placement Test (6 min)')}
                    </Link>
                  </GlossyButton>
                </div>
              </GlossyCard>
            )}

            {/* Show placement results if completed */}
            {placementStatus && placementStatus.hasCompletedPlacementTest && placementStatus.placementResults && (
              <GlossyCard className="border-2 border-green-500/50 bg-gradient-to-r from-green-500/20 to-emerald-500/20">
                <div className="text-center">
                  <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <h4 className="text-white font-bold mb-2">
                    {t('student:placementCompleted', 'Placement Test Complete')}
                  </h4>
                  <p className="text-white/80 text-sm mb-2">
                    {t('student:yourLevel', 'Your Level')}: <span className="font-bold text-white">{placementStatus.placementResults.overallLevel}</span>
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs">
                    <div>
                      <div className="text-white/60">Speaking</div>
                      <div className="text-white font-bold">{placementStatus.placementResults.speakingLevel}</div>
                    </div>
                    <div>
                      <div className="text-white/60">Listening</div>
                      <div className="text-white font-bold">{placementStatus.placementResults.listeningLevel}</div>
                    </div>
                    <div>
                      <div className="text-white/60">Reading</div>
                      <div className="text-white font-bold">{placementStatus.placementResults.readingLevel}</div>
                    </div>
                    <div>
                      <div className="text-white/60">Writing</div>
                      <div className="text-white font-bold">{placementStatus.placementResults.writingLevel}</div>
                    </div>
                  </div>
                </div>
              </GlossyCard>
            )}
            
            {/* Peer Socializer System - Iranian Gender-Based Matching */}
            <GlossyCard className="border-2 border-purple-500/50 bg-gradient-to-r from-purple-500/20 to-pink-500/20">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('student:peerSocializer', 'همکلاسی‌های ایرانی')}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {t('student:peerSocializerDesc', 'با همکلاسی‌های ایرانی خود تمرین کنید. سیستم هوشمند ما بهترین هم‌تمرین را برای شما پیدا می‌کند.')}
              </p>
              <div className="grid grid-cols-2 gap-3">
                <GlossyButton variant="primary" className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700">
                  <Users className="w-4 h-4 mr-2" />
                  {t('student:findPeers', 'پیدا کردن همکلاس')}
                </GlossyButton>
                <GlossyButton variant="secondary" className="bg-gradient-to-r from-pink-500 to-pink-600 hover:from-pink-600 hover:to-pink-700">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('student:joinGroup', 'پیوستن به گروه')}
                </GlossyButton>
              </div>
              <div className="mt-3 text-center">
                <Badge variant="info" className="text-xs bg-white/20 text-white">
                  {t('student:smartMatching', '🧠 تطبیق هوشمند بر اساس سن و جنسیت')}
                </Badge>
              </div>
            </GlossyCard>

            {/* Special Classes - Admin Featured */}
            <GlossyCard className="border-2 border-emerald-500/50 bg-gradient-to-r from-emerald-500/20 to-green-500/20">
              <h3 className="text-white font-bold mb-3 flex items-center gap-2">
                <Star className="w-5 h-5" />
                {t('student:specialClasses', 'کلاس‌های ویژه')}
              </h3>
              <p className="text-white/80 text-sm mb-4">
                {t('student:specialClassesDesc', 'کلاس‌های منتخب و پیشنهادی مدیران آموزشی با تخفیف ویژه')}
              </p>
              <div className="space-y-3">
                <div className="bg-white/10 rounded-lg p-3 border border-white/20">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="success" className="text-xs">
                        {t('student:featured', 'پیشنهاد ویژه')}
                      </Badge>
                      <Badge variant="warning" className="text-xs">
                        25% {t('common:discount', 'تخفیف')}
                      </Badge>
                    </div>
                    <span className="text-white/60 text-xs">4 {t('student:spotsLeft', 'جا باقی')}</span>
                  </div>
                  <h4 className="text-white font-bold text-sm mb-1">
                    {t('student:businessEnglish', 'انگلیسی تجاری پیشرفته')}
                  </h4>
                  <p className="text-white/60 text-xs mb-2">
                    {t('student:nativeSpeaker', 'با استاد بومی • 8 جلسه')}
                  </p>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-white font-bold text-sm">750,000</span>
                      <span className="text-white/40 text-xs line-through">1,000,000</span>
                      <span className="text-white/60 text-xs">{t('common:currency', 'تومان')}</span>
                    </div>
                    <GlossyButton variant="success" className="text-xs px-3 py-1">
                      {t('student:enroll', 'ثبت نام')}
                    </GlossyButton>
                  </div>
                </div>
                <GlossyButton variant="primary" className="w-full">
                  <Award className="w-4 h-4 mr-2" />
                  {t('student:viewAllSpecial', 'مشاهده همه کلاس‌های ویژه')}
                </GlossyButton>
              </div>
            </GlossyCard>

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