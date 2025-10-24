import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
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
  Users,
  Calendar,
  Clock,
  DollarSign,
  BookOpen,
  TrendingUp,
  Award,
  Video,
  MessageCircle,
  CheckCircle,
  AlertCircle,
  ChevronRight,
  Plus,
  Star,
  BarChart,
  FileText,
  Settings,
  Map
} from "lucide-react";
import { Link, useLocation } from "wouter";

interface TeacherStats {
  totalStudents: number;
  totalClasses: number;
  todayClasses: number;
  upcomingClasses: number;
  completedLessons: number;
  pendingAssignments: number;
  monthlyEarnings: number;
  averageRating: number;
  totalReviews: number;
  weeklyHours: number;
}

export default function TeacherDashboardMobile() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const [, setLocation] = useLocation();
  const [selectedTab, setSelectedTab] = useState('overview');
  const [greeting, setGreeting] = useState('');

  // Get appropriate greeting based on time
  useEffect(() => {
    const hour = new Date().getHours();
    if (hour < 12) setGreeting(t('teacher:goodMorning'));
    else if (hour < 18) setGreeting(t('teacher:goodAfternoon'));
    else setGreeting(t('teacher:goodEvening'));
  }, [t]);

  // Fetch teacher stats
  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: [API_ENDPOINTS.teacher.stats],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.teacher.stats, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Fetch today's classes
  const { data: todayClasses = [] } = useQuery({
    queryKey: [API_ENDPOINTS.teacher.classesToday],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.teacher.classesToday, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch classes');
      return response.json();
    }
  });

  // Fetch pending assignments
  const { data: pendingAssignments = [] } = useQuery({
    queryKey: [API_ENDPOINTS.teacher.assignmentsPending],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.teacher.assignmentsPending, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch assignments');
      return response.json();
    }
  });

  // Tab items for navigation
  const tabItems = [
    { id: 'overview', label: t('teacher:overview'), icon: <BarChart className="w-4 h-4" /> },
    { id: 'classes', label: t('teacher:classes'), icon: <BookOpen className="w-4 h-4" /> },
    { id: 'students', label: t('teacher:students'), icon: <Users className="w-4 h-4" /> }
  ];

  return (
    <div dir={isRTL ? 'rtl' : 'ltr'}>
      <GlossyFantasyLayout 
        title={`${greeting}, ${user?.firstName}!`}
        showSearch={true}
        showNotifications={true}
      >
      {/* Quick Stats Grid */}
      <div className="grid grid-cols-2 gap-4 mb-6">
        <StatCard
          icon={<Users className="w-6 h-6 text-white" />}
          label={t('teacher:totalStudents')}
          value={stats?.totalStudents || 0}
          subValue={t('teacher:active')}
          color="blue"
        />
        
        <StatCard
          icon={<Calendar className="w-6 h-6 text-white" />}
          label={t('teacher:todayClasses')}
          value={stats?.todayClasses || 0}
          subValue={`${stats?.upcomingClasses || 0} upcoming`}
          color="purple"
        />
        
        <StatCard
          icon={<DollarSign className="w-6 h-6 text-white" />}
          label={t('teacher:monthlyEarnings')}
          value={`$${stats?.monthlyEarnings || 0}`}
          subValue={t('teacher:thisMonth')}
          color="green"
        />
        
        <StatCard
          icon={<Star className="w-6 h-6 text-white" />}
          label={t('teacher:rating')}
          value={stats?.averageRating?.toFixed(1) || '5.0'}
          subValue={`${stats?.totalReviews || 0} reviews`}
          color="orange"
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
            {/* Today's Schedule */}
            <GlossyCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  {t('teacher:todaySchedule')}
                </h3>
                <Badge variant="info" size="sm">
                  {todayClasses.length} {t('teacher:classes')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {todayClasses.slice(0, 3).map((class_: any, index: number) => (
                  <Link key={index} href="/teacher/classes">
                    <ListItem
                      title={class_.name}
                      subtitle={`${class_.time} • ${class_.students} students`}
                      leftIcon={
                        class_.type === 'video' ? 
                        <Video className="w-5 h-5" /> : 
                        <Users className="w-5 h-5" />
                      }
                      rightContent={
                        <Badge variant={class_.status === 'upcoming' ? 'warning' : 'success'} size="sm">
                          {class_.status}
                        </Badge>
                      }
                      onClick={() => {}}
                    />
                  </Link>
                ))}
              </div>
              
              {todayClasses.length > 3 && (
                <GlossyButton 
                  variant="secondary" 
                  size="sm" 
                  fullWidth 
                  className="mt-3"
                >
                  <Link href="/teacher/schedule" className="flex items-center justify-center gap-2">
                    {t('teacher:viewFullSchedule')}
                  </Link>
                </GlossyButton>
              )}
            </GlossyCard>

            {/* Pending Assignments */}
            <GlossyCard>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-bold flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  {t('teacher:pendingAssignments')}
                </h3>
                <Badge variant="warning" size="sm">
                  {pendingAssignments.length} {t('teacher:pending')}
                </Badge>
              </div>
              
              <div className="space-y-2">
                {pendingAssignments.slice(0, 3).map((assignment: any, index: number) => (
                  <Link key={index} href="/teacher/assignments">
                    <ListItem
                      title={assignment.studentName}
                      subtitle={assignment.assignmentTitle}
                      leftIcon={<AlertCircle className="w-5 h-5 text-yellow-500" />}
                      rightContent={<ChevronRight className="w-5 h-5" />}
                      onClick={() => {}}
                    />
                  </Link>
                ))}
              </div>

              {pendingAssignments.length > 0 && (
                <GlossyButton 
                  variant="warning" 
                  size="sm" 
                  fullWidth 
                  className="mt-3"
                >
                  <Link href="/teacher/assignments" className="flex items-center justify-center gap-2">
                    {t('teacher:reviewAssignments')}
                  </Link>
                </GlossyButton>
              )}
            </GlossyCard>

            {/* Weekly Performance */}
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                {t('teacher:weeklyPerformance')}
              </h3>
              
              <div className="space-y-4">
                <GlossyProgress
                  value={(stats?.completedLessons || 0) / (stats?.totalClasses || 1) * 100}
                  label={t('teacher:lessonsCompleted')}
                  showPercentage={true}
                />
                
                <GlossyProgress
                  value={(stats?.weeklyHours || 0) / 40 * 100}
                  label={t('teacher:teachingHours')}
                  showPercentage={false}
                />
                
                <div className="flex justify-between text-sm">
                  <span className="text-white/70">{t('teacher:studentSatisfaction')}</span>
                  <div className="flex items-center gap-1">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star 
                        key={star} 
                        className={`w-4 h-4 ${star <= Math.floor(stats?.averageRating || 5) ? 'text-yellow-500 fill-yellow-500' : 'text-white/30'}`}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </GlossyCard>

            {/* Quick Actions - Core Features */}
            <div className="grid grid-cols-2 gap-3">
              <GlossyCard interactive className="p-4">
                <Link href="/callern">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center mb-2">
                      <Video className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">Start Callern</span>
                    <span className="text-white/60 text-xs mt-1">Video Tutoring</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/admin/roadmap-designer">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mb-2">
                      <Map className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">Roadmaps</span>
                    <span className="text-white/60 text-xs mt-1">Design Paths</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/teacher/classes">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center mb-2">
                      <BookOpen className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">My Classes</span>
                    <span className="text-white/60 text-xs mt-1">Manage Schedule</span>
                  </div>
                </Link>
              </GlossyCard>
              
              <GlossyCard interactive className="p-4">
                <Link href="/teacher/students">
                  <div className="flex flex-col items-center">
                    <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-2">
                      <Users className="w-6 h-6 text-white" />
                    </div>
                    <span className="text-white/90 text-sm font-medium">Students</span>
                    <span className="text-white/60 text-xs mt-1">Track Progress</span>
                  </div>
                </Link>
              </GlossyCard>
            </div>
          </motion.div>
        )}

        {selectedTab === 'classes' && (
          <motion.div
            key="classes"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Upcoming Classes */}
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5" />
                {t('teacher:upcomingClasses')}
              </h3>
              
              <div className="space-y-3">
                {todayClasses.map((class_: any, index: number) => (
                  <GlossyCard key={index} interactive>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="text-white font-bold">{class_.name}</h4>
                        <p className="text-white/60 text-sm mt-1">{class_.description}</p>
                        <div className="flex items-center gap-3 mt-3">
                          <Badge variant="primary" size="sm">
                            {class_.level}
                          </Badge>
                          <span className="text-white/50 text-sm flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {class_.time}
                          </span>
                          <span className="text-white/50 text-sm flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            {class_.students}
                          </span>
                        </div>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/40" />
                    </div>
                  </GlossyCard>
                ))}
              </div>
            </GlossyCard>
          </motion.div>
        )}

        {selectedTab === 'students' && (
          <motion.div
            key="students"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-4"
          >
            {/* Recent Students */}
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Users className="w-5 h-5" />
                {t('teacher:recentStudents')}
              </h3>
              
              <div className="space-y-3">
                {[1, 2, 3].map((student) => (
                  <ListItem
                    key={student}
                    title={`Student ${student}`}
                    subtitle="Level B2 • Active"
                    leftIcon={
                      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-white font-bold">
                        S{student}
                      </div>
                    }
                    rightContent={
                      <div className="flex items-center gap-2">
                        <MessageCircle className="w-5 h-5 text-white/60" />
                        <ChevronRight className="w-5 h-5 text-white/40" />
                      </div>
                    }
                  />
                ))}
              </div>
              
              <GlossyButton 
                variant="secondary" 
                size="sm" 
                fullWidth 
                className="mt-3"
              >
                <Link href="/teacher/students" className="flex items-center justify-center gap-2">
                  {t('teacher:viewAllStudents')}
                </Link>
              </GlossyButton>
            </GlossyCard>

            {/* Student Performance */}
            <GlossyCard>
              <h3 className="text-white font-bold mb-4 flex items-center gap-2">
                <Award className="w-5 h-5" />
                {t('teacher:topPerformers')}
              </h3>
              
              <div className="space-y-3">
                {[1, 2, 3].map((rank) => (
                  <ListItem
                    key={rank}
                    title={`Top Student ${rank}`}
                    subtitle={`${100 - rank * 10}% attendance • A+ average`}
                    leftIcon={
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
                        rank === 1 ? 'bg-yellow-500' : rank === 2 ? 'bg-gray-400' : 'bg-orange-600'
                      }`}>
                        {rank}
                      </div>
                    }
                    rightContent={<CheckCircle className="w-5 h-5 text-green-500" />}
                  />
                ))}
              </div>
            </GlossyCard>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <FAB
        icon={<Plus className="w-6 h-6 text-white" />}
        onClick={() => setLocation('/teacher/classes')}
      />
    </GlossyFantasyLayout>
    </div>
  );
}