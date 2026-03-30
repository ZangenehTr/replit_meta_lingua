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
import { Link, useLocation } from "wouter";
import { StudentLevelBanner } from "@/components/dashboard/StudentLevelBanner";

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
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [greeting, setGreeting] = useState('');

  console.log('StudentDashboardMobile rendering:', { user: user?.role, isRTL: t('dir') === 'rtl' });

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

  // Fetch student's curriculum level and progress
  const { data: curriculumProgress, error: curriculumError, isLoading: curriculumLoading } = useQuery({
    queryKey: ['/api/curriculum/student-level'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      console.log('Fetching curriculum level with token:', token?.substring(0, 10) + '...');
      
      const response = await fetch('/api/curriculum/student-level', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Curriculum API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Curriculum API failed:', errorText);
        throw new Error(`Failed to fetch curriculum level: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Curriculum progress data:', data);
      return data;
    },
    enabled: true,
    retry: 1
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
          subValue={t('student:levelLabel', { level: stats?.currentLevel || 1 })}
          color="purple"
        />
        
        <StatCard
          icon={<Trophy className="w-6 h-6 text-white" />}
          label={t('student:completed')}
          value={stats?.completedLessons || 0}
          subValue={t('student:ofTotalLessons', { completed: stats?.completedLessons || 0, total: stats?.totalLessons || 0 })}
          color="green"
        />
        
        <StatCard
          icon={<Clock className="w-6 h-6 text-white" />}
          label={t('student:studyTime')}
          value={`${stats?.studyTimeThisWeek || 0}h`}
          subValue={t('student:weeklyGoalHours', { goal: stats?.weeklyGoalHours || 10 })}
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
                  <h3 className="text-white font-bold text-xl mb-2">
                    {t('student:levelAssessment')}
                  </h3>
                  <p className="text-white/80 text-sm mb-2">
                    {t('student:smartLearningPath')}
                  </p>
                  <p className="text-white/80 text-sm mb-3">
                    {t('student:placementTestDescription')}
                  </p>
                  <div className="flex items-center justify-center gap-4 text-white/70 text-xs mb-4">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      <span>{t('student:tenMinutes')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-3 h-3" />
                      <span>{t('student:sevenQuestions')}</span>
                    </div>
                  </div>
                  <Link href="/mst" data-testid="link-start-placement-test">
                    <GlossyButton 
                      variant="warning" 
                      fullWidth 
                      asChild
                      className="bg-gradient-to-r from-yellow-400 to-orange-500 hover:from-yellow-500 hover:to-orange-600 flex items-center justify-center gap-2"
                    >
                      <span className="flex items-center justify-center gap-2">
                        <Zap className="w-5 h-5" />
                        {t('student:startPlacementTest')}
                      </span>
                    </GlossyButton>
                  </Link>
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

            {/* Student Level Banner - Show curriculum progress */}
            {curriculumError && (
              <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-4 text-white">
                <p>Error loading curriculum: {curriculumError.message}</p>
              </div>
            )}
            
            {curriculumLoading && (
              <div className="bg-blue-500/20 border border-blue-500/30 rounded-xl p-4 text-white">
                <p>Loading curriculum level...</p>
              </div>
            )}
            
            {curriculumProgress ? (
              <StudentLevelBanner
                currentLevel={curriculumProgress.currentLevel}
                progressPercentage={curriculumProgress.progressPercentage}
                nextLevel={curriculumProgress.nextLevel}
                status={curriculumProgress.status}
                variant="detailed"
                data-testid="student-level-banner"
              />
            ) : (
              !curriculumLoading && !curriculumError && (
                <div className="bg-orange-500/20 border border-orange-500/30 rounded-xl p-4 text-white">
                  <p>No curriculum level assigned. Contact admin.</p>
                </div>
              )
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
                  <Link key={index} href="/student/sessions-mobile">
                    <ListItem
                      title={session.courseName}
                      subtitle={`${session.date} at ${session.time}`}
                      leftIcon={<Video className="w-5 h-5" />}
                      rightContent={<ChevronRight className="w-5 h-5" />}
                    />
                  </Link>
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
            <div className="grid grid-cols-3 gap-3">
              <Link href="/student/courses-mobile" data-testid="link-browse-courses">
                <GlossyButton variant="primary" fullWidth asChild className="flex items-center gap-2">
                  <span className="flex items-center gap-2">
                    <BookOpen className="w-5 h-5" />
                    {t('student:browseCourses')}
                  </span>
                </GlossyButton>
              </Link>
              
              <Link href="/callern-mobile" data-testid="link-start-callern">
                <GlossyButton variant="success" fullWidth asChild className="flex items-center gap-2">
                  <span className="flex items-center gap-2">
                    <Video className="w-5 h-5" />
                    {t('student:startCallern')}
                  </span>
                </GlossyButton>
              </Link>
              
              <Link href="/student/roadmap" data-testid="link-my-roadmap">
                <GlossyButton variant="secondary" fullWidth asChild className="flex items-center gap-2">
                  <span className="flex items-center gap-2">
                    <Map className="w-5 h-5" />
                    {t('student:myRoadmap')}
                  </span>
                </GlossyButton>
              </Link>
            </div>

            {/* Invite a Friend Card */}
            <GlossyCard>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-pink-500 to-purple-600 flex items-center justify-center">
                    <Users className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <h4 className="text-white font-bold text-sm">{t('student:inviteAFriend', 'دوستت رو دعوت کن')}</h4>
                    <p className="text-white/60 text-xs mt-0.5">{t('student:inviteDescription', 'کمیسیون نقدی از هر ثبت‌نام دریافت کن')}</p>
                  </div>
                </div>
                <Link href="/student/referral">
                  <GlossyButton variant="primary" size="sm" className="flex items-center gap-1 text-xs">
                    <ChevronRight className="w-3 h-3" />
                    {t('student:myReferralCode', 'کد معرفی')}
                  </GlossyButton>
                </Link>
              </div>
            </GlossyCard>
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
            {/* Header with navigation link */}
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-white font-bold text-lg">{t('student:myClasses')}</h3>
              <Link href="/student/sessions" data-testid="link-view-full-class-history-mobile">
                <GlossyButton size="sm" variant="secondary" className="flex items-center gap-2">
                  <ChevronRight className="w-4 h-4" />
                  {t('student:viewFullClassHistory')}
                </GlossyButton>
              </Link>
            </div>

            {/* Online Class Example */}
            <GlossyCard>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{t('student:generalEnglishA2')}</h4>
                    <p className="text-white/60 text-sm mt-1">{t('student:nextSession')}: Today 14:00</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-500/20 text-green-300 text-xs">
                        {t('student:online')}
                      </Badge>
                      <Badge variant="success" size="sm">A2</Badge>
                    </div>
                  </div>
                </div>
                
                <GlossyProgress value={75} showPercentage={true} />
                
                <div className="grid grid-cols-3 gap-2">
                  <GlossyButton size="sm" variant="primary" data-testid="button-join-online-class-mobile">
                    {t('student:joinClassButton')}
                  </GlossyButton>
                  <GlossyButton size="sm" variant="secondary" data-testid="button-view-online-homework-mobile">
                    {t('student:viewHomeworkButton')}
                  </GlossyButton>
                  <GlossyButton size="sm" variant="secondary" data-testid="button-previous-session-videos-mobile">
                    {t('student:previousSessionVideos')}
                  </GlossyButton>
                </div>
              </div>
            </GlossyCard>

            {/* In-Person Class Example */}
            <GlossyCard>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{t('student:conversationClass')}</h4>
                    <p className="text-white/60 text-sm mt-1">{t('student:nextSession')}: Tomorrow 16:30</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-blue-500/20 text-blue-300 text-xs">
                        {t('student:inPerson')}
                      </Badge>
                      <Badge variant="success" size="sm">B1</Badge>
                    </div>
                  </div>
                </div>
                
                <GlossyProgress value={60} showPercentage={true} />
                
                {/* Conditional Logic: In-Person Class Actions */}
                <div className="grid grid-cols-2 gap-2">
                  <GlossyButton size="sm" variant="primary" data-testid="button-practice-inperson-mobile">
                    {t('student:practice')}
                  </GlossyButton>
                  <GlossyButton size="sm" variant="secondary" data-testid="button-homework-inperson-mobile">
                    {t('student:homework')}
                  </GlossyButton>
                </div>
              </div>
            </GlossyCard>

            {/* Additional Course */}
            <GlossyCard>
              <div className="space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h4 className="text-white font-bold">{t('student:ieltsPreparation')}</h4>
                    <p className="text-white/60 text-sm mt-1">8/12 {t('student:sessions')} completed</p>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge className="bg-green-500/20 text-green-300 text-xs">
                        {t('student:online')}
                      </Badge>
                      <Badge variant="success" size="sm">B2</Badge>
                    </div>
                  </div>
                </div>
                
                <GlossyProgress value={67} showPercentage={true} />
                
                <div className="grid grid-cols-3 gap-2">
                  <GlossyButton size="sm" variant="primary" data-testid="button-join-additional-class-mobile">
                    {t('student:joinClassButton')}
                  </GlossyButton>
                  <GlossyButton size="sm" variant="secondary" data-testid="button-view-additional-homework-mobile">
                    {t('student:viewHomeworkButton')}
                  </GlossyButton>
                  <GlossyButton size="sm" variant="secondary" data-testid="button-additional-session-videos-mobile">
                    {t('student:previousSessionVideos')}
                  </GlossyButton>
                </div>
              </div>
            </GlossyCard>
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
        onClick={() => setLocation('/student/courses-mobile')}
      />
    </GlossyFantasyLayout>
  );
}