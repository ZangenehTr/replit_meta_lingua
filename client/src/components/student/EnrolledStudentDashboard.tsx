import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion, AnimatePresence } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  BarChart3,
  BookOpen, 
  Video, 
  ClipboardCheck,
  MessageSquare,
  Users,
  Gamepad2,
  Wallet,
  User,
  Calendar, 
  Trophy, 
  TrendingUp,
  Clock,
  Star,
  Zap,
  Award,
  PlayCircle,
  CheckCircle2,
  Bell,
  Settings,
  Menu,
  X,
  ChevronRight,
  Home,
  Brain,
  Target,
  Headphones,
  PenTool,
  MessageCircle,
  CreditCard,
  Download,
  Upload,
  FileText,
  Activity,
  Package,
  Plus,
  Play,
  Pause,
  Volume2,
  Mic,
  Phone,
  VideoIcon,
  Shield,
  Globe,
  Smartphone,
  Monitor,
  Coffee,
  Flame,
  Gift,
  Share2,
  Edit3,
  Camera,
  Mail,
  MapPin,
  Link as LinkIcon,
  ExternalLink,
  Bookmark,
  Heart,
  ThumbsUp,
  MessageSquareIcon,
  Search,
  Filter,
  MoreHorizontal,
  ChevronDown,
  ChevronUp,
  Info,
  AlertCircle,
  CheckCircle,
  XCircle,
  Loader2,
  RotateCcw
} from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import { apiRequest } from "@/lib/queryClient";
import { cn } from "@/lib/utils";
import { useIsMediumScreen } from "@/hooks/useMediaQuery";
import { Skeleton } from "@/components/ui/skeleton";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";

// Import existing widgets
import {
  GamificationWidget,
  LearningProgressWidget,
  UpcomingSessionsWidget,
  AssignmentsWidget,
  AchievementWidget,
  QuickActionsWidget
} from "@/components/student/widgets";

// Hub definitions for the 9-hub architecture
export type HubType = 
  | 'overview' 
  | 'learn' 
  | 'live' 
  | 'assessment' 
  | 'ai' 
  | 'social' 
  | 'games' 
  | 'commerce' 
  | 'profile';

interface Hub {
  id: HubType;
  name: string;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  description: string;
  badge?: number;
  isActive?: boolean;
}

interface Props {
  enrollmentStatus: EnrollmentStatus;
  user: any;
}

// Sample data interfaces to complement API data
interface CourseProgress {
  id: string;
  title: string;
  progress: number;
  nextLesson: string;
  totalLessons: number;
  completedLessons: number;
}

interface LiveSession {
  id: string;
  title: string;
  teacher: string;
  startTime: string;
  duration: number;
  status: 'scheduled' | 'live' | 'ended';
  joinUrl?: string;
  recordingUrl?: string;
}

interface AIFeature {
  id: string;
  title: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  available: boolean;
  usageCount: number;
}

export function EnrolledStudentDashboard({ enrollmentStatus, user }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const [location, setLocation] = useLocation();
  const [activeHub, setActiveHub] = useState<HubType>(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    return (params.get('hub') as HubType) || 'overview';
  });
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const isMediumScreen = useIsMediumScreen();
  const queryClient = useQueryClient();

  // Define the 9 hubs with their configurations using learner theme (blue-to-indigo)
  const hubs: Hub[] = [
    {
      id: 'overview',
      name: 'Overview',
      icon: BarChart3,
      color: 'from-blue-600 to-indigo-600',
      description: 'Dashboard & Progress Overview',
      isActive: true
    },
    {
      id: 'learn',
      name: 'Learn',
      icon: BookOpen,
      color: 'from-blue-500 to-indigo-500',
      description: 'Courses & Learning Materials'
    },
    {
      id: 'live',
      name: 'Live',
      icon: Video,
      color: 'from-indigo-500 to-blue-500',
      description: 'Live Sessions & Video Calls',
      badge: 2 // Example: 2 upcoming sessions
    },
    {
      id: 'assessment',
      name: 'Assessment',
      icon: ClipboardCheck,
      color: 'from-blue-600 to-cyan-500',
      description: 'Tests & Evaluations'
    },
    {
      id: 'ai',
      name: 'AI',
      icon: Brain,
      color: 'from-indigo-600 to-purple-500',
      description: 'AI Tutoring & Practice'
    },
    {
      id: 'social',
      name: 'Social',
      icon: Users,
      color: 'from-blue-500 to-teal-500',
      description: 'Community & Peer Learning',
      badge: 3 // Example: 3 new community posts
    },
    {
      id: 'games',
      name: 'Games',
      icon: Gamepad2,
      color: 'from-indigo-500 to-purple-600',
      description: 'Learning Games & Challenges'
    },
    {
      id: 'commerce',
      name: 'Wallet',
      icon: Wallet,
      color: 'from-blue-600 to-indigo-500',
      description: 'Payments & Transactions'
    },
    {
      id: 'profile',
      name: 'Profile',
      icon: User,
      color: 'from-indigo-600 to-blue-600',
      description: 'Settings & Achievements'
    }
  ];

  // Comprehensive API data fetching with React Query
  const { data: dashboardStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/student/dashboard-stats'],
    queryFn: () => apiRequest('/api/student/dashboard-stats'),
    staleTime: 2 * 60 * 1000,
  });

  const { data: gamificationStats } = useQuery({
    queryKey: ['/api/student/gamification-stats'],
    queryFn: () => apiRequest('/api/student/gamification-stats'),
    staleTime: 2 * 60 * 1000,
  });

  const { data: learningProgress } = useQuery({
    queryKey: ['/api/student/learning-progress'],
    queryFn: () => apiRequest('/api/student/learning-progress'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: upcomingSessions = [] } = useQuery({
    queryKey: ['/api/student/upcoming-sessions'],
    queryFn: () => apiRequest('/api/student/upcoming-sessions'),
    staleTime: 2 * 60 * 1000,
  });

  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/student/assignments'],
    queryFn: () => apiRequest('/api/student/assignments'),
    staleTime: 5 * 60 * 1000,
  });

  const { data: achievements = [] } = useQuery({
    queryKey: ['/api/student/achievements'],
    queryFn: () => apiRequest('/api/student/achievements'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: courses = [] } = useQuery({
    queryKey: ['/api/student/courses'],
    queryFn: () => apiRequest('/api/student/courses'),
    staleTime: 15 * 60 * 1000,
  });

  const { data: games = [] } = useQuery({
    queryKey: ['/api/student/games/accessible'],
    queryFn: () => apiRequest('/api/student/games/accessible'),
    staleTime: 10 * 60 * 1000,
  });

  const { data: wallet } = useQuery({
    queryKey: ['/api/student/wallet'],
    queryFn: () => apiRequest('/api/student/wallet'),
    staleTime: 5 * 60 * 1000,
  });

  // Update URL when hub changes
  useEffect(() => {
    const baseUrl = location.split('?')[0];
    const newUrl = `${baseUrl}?hub=${activeHub}`;
    if (location !== newUrl) {
      setLocation(newUrl);
    }
    setSidebarOpen(false);
  }, [activeHub, location, setLocation]);

  // Update activeHub when URL changes
  useEffect(() => {
    const params = new URLSearchParams(location.split('?')[1] || '');
    const hubFromUrl = params.get('hub') as HubType;
    if (hubFromUrl && hubFromUrl !== activeHub && hubs.some(h => h.id === hubFromUrl)) {
      setActiveHub(hubFromUrl);
    }
  }, [location, activeHub, hubs]);

  const currentHub = hubs.find(hub => hub.id === activeHub);

  return (
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-blue-100 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Mobile menu button */}
              <Button
                variant="ghost"
                size="icon"
                className="md:hidden text-blue-700 hover:bg-blue-50"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                data-testid="button-mobile-menu"
              >
                {sidebarOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
              </Button>

              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-lg">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-gray-900 font-bold text-xl">MetaLingua</h1>
                  <Badge className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-xs font-medium">
                    {enrollmentStatus.membershipTier || 'Silver'} Member
                  </Badge>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <Button variant="ghost" size="icon" className="text-gray-700 relative hover:bg-blue-50" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute -top-1 -right-1 h-3 w-3 bg-red-500 rounded-full text-xs" />
              </Button>
              
              <div className="hidden md:flex items-center gap-2 bg-gradient-to-r from-blue-100 to-indigo-100 rounded-lg px-3 py-2">
                <Wallet className="h-4 w-4 text-blue-700" />
                <span className="text-sm font-medium text-blue-900">
                  {enrollmentStatus.walletBalance?.toLocaleString() || '0'} Credits
                </span>
              </div>

              <Avatar className="w-8 h-8 border-2 border-blue-200">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white text-sm font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
            </div>
          </div>
        </div>
      </motion.header>

      <div className="flex min-h-screen">
        {/* Sidebar */}
        <AnimatePresence>
          {(sidebarOpen || isMediumScreen) && (
            <motion.aside
              initial={{ x: isRTL ? 300 : -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: isRTL ? 300 : -300, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className={cn(
                "fixed inset-y-0 z-40 w-72 bg-white/95 backdrop-blur-xl border-r border-blue-100 overflow-y-auto shadow-xl",
                "md:sticky md:top-16 md:h-[calc(100vh-4rem)]",
                isRTL ? "right-0" : "left-0"
              )}
            >
              <div className="p-4">
                {/* User Summary */}
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                  <div className="flex items-center gap-3">
                    <Avatar className="w-12 h-12 border-2 border-blue-200">
                      <AvatarImage src={user?.avatar} />
                      <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                        {user?.firstName?.[0]}{user?.lastName?.[0]}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-900 text-sm">{user?.firstName} {user?.lastName}</h3>
                      <div className="flex items-center gap-1 text-xs text-blue-700">
                        <Flame className="h-3 w-3 text-orange-500" />
                        <span>{user?.streakDays || 0} day streak</span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between text-xs text-gray-600">
                    <span>Level {user?.level || 1}</span>
                    <span>{gamificationStats?.xp || 0} XP</span>
                  </div>
                </div>

                {/* Hub Navigation */}
                <nav className="space-y-1">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Learning Hubs</h3>
                  {hubs.map((hub) => {
                    const Icon = hub.icon;
                    const isActive = activeHub === hub.id;
                    
                    return (
                      <Button
                        key={hub.id}
                        variant="ghost"
                        className={cn(
                          "w-full justify-start h-14 relative group transition-all duration-200",
                          isActive && `bg-gradient-to-r ${hub.color} text-white shadow-lg hover:shadow-xl`,
                          !isActive && "hover:bg-blue-50 text-gray-700 hover:text-blue-700"
                        )}
                        onClick={() => setActiveHub(hub.id)}
                        data-testid={`hub-${hub.id}`}
                      >
                        <div className={cn(
                          "w-10 h-10 rounded-lg flex items-center justify-center mr-3 transition-all",
                          isActive ? "bg-white/20" : "bg-blue-100 group-hover:bg-blue-200"
                        )}>
                          <Icon className="h-5 w-5" />
                        </div>
                        <div className="flex-1 text-left">
                          <div className="font-medium text-sm">{hub.name}</div>
                          <div className={cn(
                            "text-xs opacity-75 truncate",
                            isActive ? "text-white/80" : "text-gray-500"
                          )}>
                            {hub.description}
                          </div>
                        </div>
                        {hub.badge && (
                          <Badge className={cn(
                            "ml-auto text-xs font-medium",
                            isActive ? "bg-white/20 text-white" : "bg-blue-500 text-white"
                          )}>
                            {hub.badge}
                          </Badge>
                        )}
                        {isActive && (
                          <div className={cn(
                            "absolute top-2 bottom-2 w-1 bg-white/40 rounded-full",
                            isRTL ? "left-1" : "right-1"
                          )} />
                        )}
                      </Button>
                    );
                  })}
                </nav>

                {/* Quick Stats */}
                <div className="mt-6 pt-6 border-t border-blue-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Stats</h3>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="text-center p-3 bg-blue-50 rounded-lg">
                      <Calendar className="h-4 w-4 text-blue-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-blue-900">{upcomingSessions.length}</div>
                      <div className="text-xs text-blue-700">Sessions</div>
                    </div>
                    <div className="text-center p-3 bg-indigo-50 rounded-lg">
                      <Target className="h-4 w-4 text-indigo-600 mx-auto mb-1" />
                      <div className="text-lg font-bold text-indigo-900">{assignments.filter(a => a.status === 'pending').length}</div>
                      <div className="text-xs text-indigo-700">Tasks</div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="mt-6 pt-6 border-t border-blue-100">
                  <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <Button size="sm" variant="outline" className="h-12 flex-col gap-1 hover:bg-blue-50 border-blue-200" data-testid="quick-continue">
                      <PlayCircle className="h-4 w-4 text-blue-600" />
                      <span className="text-xs">Continue</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-12 flex-col gap-1 hover:bg-indigo-50 border-indigo-200" data-testid="quick-practice">
                      <Brain className="h-4 w-4 text-indigo-600" />
                      <span className="text-xs">AI Practice</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-12 flex-col gap-1 hover:bg-purple-50 border-purple-200" data-testid="quick-games">
                      <Gamepad2 className="h-4 w-4 text-purple-600" />
                      <span className="text-xs">Games</span>
                    </Button>
                    <Button size="sm" variant="outline" className="h-12 flex-col gap-1 hover:bg-teal-50 border-teal-200" data-testid="quick-community">
                      <Users className="h-4 w-4 text-teal-600" />
                      <span className="text-xs">Community</span>
                    </Button>
                  </div>
                </div>
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <main className="flex-1 p-4 md:p-6 overflow-x-hidden">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeHub}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.3 }}
              className="max-w-7xl mx-auto"
            >
              {/* Hub Header */}
              <div className="mb-6">
                <div className="flex items-center gap-4 mb-4">
                  {currentHub && (
                    <>
                      <div className={cn(
                        "w-16 h-16 rounded-2xl flex items-center justify-center bg-gradient-to-r shadow-lg",
                        currentHub.color
                      )}>
                        <currentHub.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="flex-1">
                        <h2 className="text-3xl font-bold text-gray-900 mb-1">{currentHub.name} Hub</h2>
                        <p className="text-gray-600 text-lg">{currentHub.description}</p>
                        {currentHub.badge && (
                          <Badge className="mt-2 bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                            {currentHub.badge} new items
                          </Badge>
                        )}
                      </div>
                    </>
                  )}
                </div>
              </div>

              {/* Hub Content */}
              {renderHubContent(activeHub, {
                enrollmentStatus,
                user,
                dashboardStats,
                gamificationStats,
                learningProgress,
                upcomingSessions,
                assignments,
                achievements,
                courses,
                games,
                wallet,
                isLoading: statsLoading
              })}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/20 z-30 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}
    </div>
  );
}

// Hub content rendering function
function renderHubContent(
  hubId: HubType, 
  data: {
    enrollmentStatus: EnrollmentStatus;
    user: any;
    dashboardStats: any;
    gamificationStats: any;
    learningProgress: any;
    upcomingSessions: any[];
    assignments: any[];
    achievements: any[];
    courses: any[];
    games: any[];
    wallet: any;
    isLoading: boolean;
    hasError: boolean;
    retry: () => void;
  }
) {
  // Show loading state for all hubs
  if (data.isLoading) {
    return <HubLoadingSkeleton hubId={hubId} />;
  }

  // Show error state for all hubs
  if (data.hasError) {
    return <HubErrorState hubId={hubId} onRetry={data.retry} />;
  }
  switch (hubId) {
    case 'overview':
      return <OverviewHub {...data} />;
    case 'learn':
      return <LearnHub {...data} />;
    case 'live':
      return <LiveHub {...data} />;
    case 'assessment':
      return <AssessmentHub {...data} />;
    case 'ai':
      return <AIHub {...data} />;
    case 'social':
      return <SocialHub {...data} />;
    case 'games':
      return <GamesHub {...data} />;
    case 'commerce':
      return <CommerceHub {...data} />;
    case 'profile':
      return <ProfileHub {...data} />;
    default:
      return <OverviewHub {...data} />;
  }
}

// Hub Component Implementations

function OverviewHub({ enrollmentStatus, user, dashboardStats, gamificationStats, upcomingSessions, assignments, isLoading }: any) {
  return (
    <div className="space-y-6">
      {/* Welcome Hero Card */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 overflow-hidden relative">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <Avatar className="w-20 h-20 border-4 border-white/30 shadow-xl">
              <AvatarImage src={user?.avatar} />
              <AvatarFallback className="bg-white/20 text-white font-bold text-2xl">
                {user?.firstName?.[0]}{user?.lastName?.[0]}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-2">
                Welcome back, {user?.firstName}! 🎉
              </h3>
              <p className="text-blue-100 mb-4 text-lg">
                Ready to continue your learning journey?
              </p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Flame className="h-5 w-5 text-orange-300" />
                  <span className="font-medium">{user?.streakDays || 0} day streak</span>
                </div>
                <div className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">Level {user?.level || 1}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-300" />
                  <span className="font-medium">{gamificationStats?.xp || 0} XP</span>
                </div>
              </div>
            </div>
          </div>
          <div className="absolute top-0 right-0 opacity-10">
            <Trophy className="h-32 w-32" />
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6" data-testid="overview-metrics-grid">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-blue-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <BookOpen className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-blue-900 mb-1" data-testid="metric-active-courses">{enrollmentStatus.activeCourses?.length || 0}</div>
            <div className="text-sm text-blue-700 font-medium">Active Courses</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-indigo-50 to-indigo-100 border-indigo-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-indigo-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-indigo-900 mb-1" data-testid="metric-upcoming-sessions">{upcomingSessions?.length || 0}</div>
            <div className="text-sm text-indigo-700 font-medium">Upcoming Sessions</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-purple-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Target className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-purple-900 mb-1" data-testid="metric-pending-tasks">{assignments?.filter(a => a.status === 'pending')?.length || 0}</div>
            <div className="text-sm text-purple-700 font-medium">Pending Tasks</div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-cyan-50 to-cyan-100 border-cyan-200 hover:shadow-lg transition-all duration-300">
          <CardContent className="p-6 text-center">
            <div className="w-12 h-12 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-xl flex items-center justify-center mx-auto mb-4">
              <Wallet className="h-6 w-6 text-white" />
            </div>
            <div className="text-3xl font-bold text-cyan-900 mb-1" data-testid="metric-wallet-balance">
              {enrollmentStatus.walletBalance?.toLocaleString() || '0'}
            </div>
            <div className="text-sm text-cyan-700 font-medium">Credits Available</div>
          </CardContent>
        </Card>
      </div>

      {/* Main Widgets Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="space-y-6">
          <GamificationWidget theme="learner" data-testid="gamification-widget" />
          <LearningProgressWidget theme="learner" data-testid="learning-progress-widget" />
        </div>
        <div className="space-y-6">
          <UpcomingSessionsWidget theme="learner" data-testid="upcoming-sessions-widget" />
          <AssignmentsWidget theme="learner" data-testid="assignments-widget" />
        </div>
      </div>

      {/* Quick Actions Bar */}
      <QuickActionsWidget theme="learner" columns={4} data-testid="quick-actions-widget" />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-blue-600" />
            Recent Activity
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {isLoading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : (
              [
                { action: 'Completed Advanced Grammar lesson', course: 'Business English', time: '2 hours ago', icon: CheckCircle2, color: 'text-green-600' },
                { action: 'Submitted writing assignment', course: 'IELTS Preparation', time: '1 day ago', icon: Upload, color: 'text-blue-600' },
                { action: 'Watched speaking practice video', course: 'Conversation Club', time: '2 days ago', icon: Play, color: 'text-purple-600' },
              ].map((item, index) => (
                <div key={index} className="flex items-center gap-4 p-3 rounded-lg hover:bg-blue-50 transition-colors">
                  <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center bg-gray-100", item.color)}>
                    <item.icon className="h-5 w-5" />
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{item.action}</p>
                    <p className="text-xs text-gray-600">{item.course}</p>
                  </div>
                  <span className="text-xs text-gray-500">{item.time}</span>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LearnHub({ courses, assignments, learningProgress }: any) {
  return (
    <div className="space-y-6">
      {/* Learning Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-blue-600" />
              My Learning Path
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses?.length > 0 ? (
                courses.slice(0, 3).map((course: any, index: number) => (
                  <div key={course.id || index} className="flex items-center gap-4 p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all">
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{course.title || 'Course Title'}</h4>
                      <p className="text-sm text-gray-600">Progress: {course.progress || 0}%</p>
                      <Progress value={course.progress || 0} className="mt-2 h-2" />
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500">
                      Continue
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No courses available yet</p>
                  <Button className="bg-gradient-to-r from-blue-500 to-indigo-500">
                    Browse Courses
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          <LearningProgressWidget theme="learner" />
          <AssignmentsWidget theme="learner" />
        </div>
      </div>

      {/* Course Materials & Resources */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-indigo-600" />
            Learning Materials
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              { title: 'Grammar Exercises PDF', type: 'PDF', size: '2.1 MB', icon: FileText },
              { title: 'Pronunciation Guide', type: 'Audio', size: '5.3 MB', icon: Headphones },
              { title: 'Speaking Practice Video', type: 'Video', size: '45.2 MB', icon: Play },
            ].map((material, index) => (
              <div key={index} className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                  <material.icon className="h-5 w-5 text-blue-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-sm text-gray-900 truncate">{material.title}</h4>
                  <p className="text-xs text-gray-500">{material.type} • {material.size}</p>
                </div>
                <Button size="sm" variant="ghost">
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function LiveHub({ upcomingSessions }: any) {
  return (
    <div className="space-y-6">
      {/* Live Session Status */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Callern Video Tutoring</h3>
              <p className="text-indigo-100">Connect with expert tutors for personalized learning</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              Start Session
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Upcoming Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-indigo-600" />
              Scheduled Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <UpcomingSessionsWidget theme="learner" />
          </CardContent>
        </Card>
        
        {/* Quick Join */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start h-12 bg-gradient-to-r from-indigo-500 to-purple-500">
                <VideoIcon className="h-5 w-5 mr-3" />
                Join Practice Room
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Calendar className="h-5 w-5 mr-3" />
                Schedule New Session
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Clock className="h-5 w-5 mr-3" />
                View Session History
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[
              { title: 'Grammar Focus Session', teacher: 'Sarah Johnson', date: '2 days ago', duration: '45 min', status: 'completed' },
              { title: 'Speaking Practice', teacher: 'Mark Wilson', date: '1 week ago', duration: '30 min', status: 'completed' },
              { title: 'IELTS Preparation', teacher: 'Emma Davis', date: '2 weeks ago', duration: '60 min', status: 'completed' },
            ].map((session, index) => (
              <div key={index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">{session.title}</h4>
                  <p className="text-sm text-gray-600">with {session.teacher} • {session.duration}</p>
                  <p className="text-xs text-gray-500">{session.date}</p>
                </div>
                <Button size="sm" variant="outline">
                  View Recording
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function AssessmentHub(props: any) {
  return (
    <div className="space-y-6">
      {/* Assessment Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <ClipboardCheck className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Assessment Center</h3>
              <p className="text-blue-100">Track your progress with comprehensive evaluations</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Tests */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              Available Assessments
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {[
                { title: 'Placement Test', description: 'Determine your current level', duration: '45 min', available: true },
                { title: 'Progress Evaluation', description: 'Monthly progress check', duration: '30 min', available: true },
                { title: 'IELTS Practice Test', description: 'Full practice exam', duration: '120 min', available: false },
              ].map((test, index) => (
                <div key={index} className={cn(
                  "flex items-center justify-between p-4 border rounded-lg transition-all",
                  test.available ? "hover:bg-blue-50 border-blue-200" : "bg-gray-50 border-gray-200"
                )}>
                  <div className="flex-1">
                    <h4 className={cn("font-medium", test.available ? "text-gray-900" : "text-gray-500")}>
                      {test.title}
                    </h4>
                    <p className="text-sm text-gray-600">{test.description}</p>
                    <p className="text-xs text-gray-500">{test.duration}</p>
                  </div>
                  <Button 
                    size="sm" 
                    disabled={!test.available}
                    className={test.available ? "bg-gradient-to-r from-blue-500 to-cyan-500" : ""}
                  >
                    {test.available ? 'Start Test' : 'Locked'}
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Recent Results */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-green-600" />
              Recent Results
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { test: 'Grammar Assessment', score: 85, date: '1 week ago', grade: 'B+' },
                { test: 'Vocabulary Quiz', score: 92, date: '2 weeks ago', grade: 'A-' },
                { test: 'Listening Test', score: 78, date: '3 weeks ago', grade: 'B' },
              ].map((result, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{result.test}</h4>
                    <p className="text-sm text-gray-600">{result.date}</p>
                  </div>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900">{result.score}%</div>
                    <Badge className={cn(
                      "text-xs",
                      result.score >= 90 ? "bg-green-100 text-green-700" :
                      result.score >= 80 ? "bg-blue-100 text-blue-700" :
                      "bg-yellow-100 text-yellow-700"
                    )}>
                      {result.grade}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Link href="/student/test-results">View All Results</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function AIHub(props: any) {
  return (
    <div className="space-y-6">
      {/* AI Features Overview */}
      <Card className="bg-gradient-to-r from-indigo-600 to-purple-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Brain className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">AI Learning Assistant</h3>
              <p className="text-indigo-100">Personalized AI tutoring and practice tools</p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* AI Tools Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[
          {
            title: 'AI Conversation',
            description: 'Practice speaking with AI tutor',
            icon: MessageCircle,
            color: 'from-blue-500 to-indigo-500',
            available: true,
            usageCount: 15
          },
          {
            title: 'Homework Helper',
            description: 'Get AI assistance with assignments',
            icon: PenTool,
            color: 'from-indigo-500 to-purple-500',
            available: true,
            usageCount: 8
          },
          {
            title: 'Grammar Checker',
            description: 'AI-powered writing assistance',
            icon: CheckCircle,
            color: 'from-purple-500 to-pink-500',
            available: true,
            usageCount: 22
          },
          {
            title: 'Pronunciation Coach',
            description: 'Perfect your pronunciation',
            icon: Mic,
            color: 'from-green-500 to-teal-500',
            available: true,
            usageCount: 6
          },
          {
            title: 'Reading Comprehension',
            description: 'AI-guided reading practice',
            icon: BookOpen,
            color: 'from-orange-500 to-red-500',
            available: false,
            usageCount: 0
          },
          {
            title: 'Study Planner',
            description: 'AI-optimized learning schedule',
            icon: Calendar,
            color: 'from-cyan-500 to-blue-500',
            available: false,
            usageCount: 0
          }
        ].map((tool, index) => (
          <Card key={index} className={cn(
            "transition-all duration-300 hover:shadow-lg",
            tool.available ? "hover:scale-105" : "opacity-60"
          )}>
            <CardContent className="p-6">
              <div className={cn(
                "w-12 h-12 rounded-xl flex items-center justify-center mb-4 bg-gradient-to-r",
                tool.color
              )}>
                <tool.icon className="h-6 w-6 text-white" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-2">{tool.title}</h3>
              <p className="text-sm text-gray-600 mb-4">{tool.description}</p>
              <div className="flex items-center justify-between">
                <div className="text-xs text-gray-500">
                  Used {tool.usageCount} times
                </div>
                <Button 
                  size="sm" 
                  disabled={!tool.available}
                  className={tool.available ? `bg-gradient-to-r ${tool.color}` : ""}
                >
                  {tool.available ? 'Try Now' : 'Coming Soon'}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* AI Usage Stats */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BarChart3 className="h-5 w-5 text-indigo-600" />
            AI Usage Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="text-3xl font-bold text-indigo-600 mb-2">51</div>
              <div className="text-sm text-gray-600">Total AI Sessions</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-purple-600 mb-2">4.8</div>
              <div className="text-sm text-gray-600">Average Rating</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600 mb-2">12.5h</div>
              <div className="text-sm text-gray-600">Total AI Time</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function SocialHub(props: any) {
  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <Card className="bg-gradient-to-r from-blue-500 to-teal-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Learning Community</h3>
              <p className="text-blue-100">Connect with fellow learners and practice together</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Groups */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Study Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { name: 'IELTS Warriors', members: 24, activity: 'High', topic: 'IELTS Preparation' },
                { name: 'Business English Pro', members: 18, activity: 'Medium', topic: 'Business Communication' },
                { name: 'Grammar Masters', members: 31, activity: 'High', topic: 'Grammar Practice' },
              ].map((group, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-teal-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-teal-100 rounded-lg flex items-center justify-center">
                      <Users className="h-5 w-5 text-teal-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{group.name}</h4>
                      <p className="text-sm text-gray-600">{group.topic}</p>
                      <p className="text-xs text-gray-500">{group.members} members • {group.activity} activity</p>
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    Join
                  </Button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Community Feed */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Community Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { user: 'Sarah M.', content: 'Just completed my first IELTS practice test! Feeling confident 💪', time: '2 hours ago', likes: 12 },
                { user: 'Ahmed K.', content: 'Looking for a speaking practice partner for tomorrow evening. Anyone interested?', time: '4 hours ago', likes: 5 },
                { user: 'Emma L.', content: 'Great grammar lesson today! The conditional sentences finally make sense 🎉', time: '1 day ago', likes: 18 },
              ].map((post, index) => (
                <div key={index} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-start gap-3">
                    <Avatar className="w-8 h-8">
                      <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                        {post.user.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-medium text-sm text-gray-900">{post.user}</span>
                        <span className="text-xs text-gray-500">{post.time}</span>
                      </div>
                      <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                      <div className="flex items-center gap-4 text-xs text-gray-500">
                        <button className="flex items-center gap-1 hover:text-red-500">
                          <Heart className="h-3 w-3" />
                          {post.likes}
                        </button>
                        <button className="hover:text-blue-500">Reply</button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peer Matching */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Find Study Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { name: 'Alex Chen', level: 'Intermediate', interests: ['Speaking', 'IELTS'], location: 'Online', compatibility: 92 },
              { name: 'Maria Santos', level: 'Advanced', interests: ['Business English', 'Grammar'], location: 'EST Timezone', compatibility: 88 },
              { name: 'Raj Patel', level: 'Intermediate', interests: ['Conversation', 'Pronunciation'], location: 'Online', compatibility: 85 },
            ].map((partner, index) => (
              <div key={index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-12 h-12">
                    <AvatarFallback className="bg-purple-100 text-purple-600">
                      {partner.name.split(' ').map(n => n[0]).join('')}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{partner.name}</h4>
                    <p className="text-sm text-gray-600">{partner.level} • {partner.location}</p>
                  </div>
                </div>
                <div className="space-y-2 mb-3">
                  <div className="flex flex-wrap gap-1">
                    {partner.interests.map((interest, i) => (
                      <Badge key={i} variant="secondary" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-xs text-gray-500">Compatibility:</span>
                    <span className="text-xs font-medium text-green-600">{partner.compatibility}%</span>
                  </div>
                </div>
                <Button size="sm" className="w-full bg-gradient-to-r from-purple-500 to-pink-500">
                  Connect
                </Button>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GamesHub({ games, achievements }: any) {
  return (
    <div className="space-y-6">
      {/* Games Overview */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Gamepad2 className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Learning Games</h3>
              <p className="text-indigo-100">Make learning fun with interactive games and challenges</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Available Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PlayCircle className="h-5 w-5 text-purple-600" />
              Featured Games
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Word Builder', description: 'Build words from letters', difficulty: 'Easy', xp: 50, players: 1243 },
                { title: 'Grammar Quest', description: 'Adventure through grammar rules', difficulty: 'Medium', xp: 100, players: 856 },
                { title: 'Pronunciation Challenge', description: 'Perfect your speaking skills', difficulty: 'Hard', xp: 150, players: 432 },
              ].map((game, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-purple-50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-500 to-pink-500 rounded-lg flex items-center justify-center">
                      <Gamepad2 className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{game.title}</h4>
                      <p className="text-sm text-gray-600">{game.description}</p>
                      <div className="flex items-center gap-2 text-xs text-gray-500 mt-1">
                        <Badge variant="outline" className="text-xs">
                          {game.difficulty}
                        </Badge>
                        <span>+{game.xp} XP</span>
                        <span>•</span>
                        <span>{game.players} players</span>
                      </div>
                    </div>
                  </div>
                  <Button size="sm" className="bg-gradient-to-r from-purple-500 to-pink-500">
                    Play
                  </Button>
                </div>
              ))}
            </div>
            <Button variant="outline" className="w-full mt-4">
              <Link href="/games">View All Games</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Achievements & Leaderboard */}
        <div className="space-y-6">
          <AchievementWidget theme="learner" />
          
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-yellow-600" />
                Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[
                  { rank: 1, name: 'Sarah Johnson', xp: 2450, badge: '🥇' },
                  { rank: 2, name: 'You', xp: 1890, badge: '🥈' },
                  { rank: 3, name: 'Alex Chen', xp: 1720, badge: '🥉' },
                  { rank: 4, name: 'Maria Santos', xp: 1650, badge: '' },
                  { rank: 5, name: 'Ahmed Ali', xp: 1580, badge: '' },
                ].map((entry, index) => (
                  <div key={index} className={cn(
                    "flex items-center justify-between p-3 rounded-lg",
                    entry.name === 'You' ? "bg-blue-50 border border-blue-200" : "hover:bg-gray-50"
                  )}>
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-sm font-bold">
                        {entry.badge || entry.rank}
                      </div>
                      <span className={cn(
                        "font-medium",
                        entry.name === 'You' ? "text-blue-900" : "text-gray-900"
                      )}>
                        {entry.name}
                      </span>
                    </div>
                    <span className="text-sm font-medium text-gray-600">{entry.xp} XP</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Daily Challenges */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-orange-600" />
            Daily Challenges
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {[
              { title: 'Complete 3 lessons', progress: 2, total: 3, xp: 100, status: 'active' },
              { title: 'Win 2 vocabulary games', progress: 1, total: 2, xp: 75, status: 'active' },
              { title: 'Study for 30 minutes', progress: 30, total: 30, xp: 50, status: 'completed' },
            ].map((challenge, index) => (
              <div key={index} className={cn(
                "p-4 border rounded-lg",
                challenge.status === 'completed' ? "bg-green-50 border-green-200" : "border-gray-200"
              )}>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-medium text-sm text-gray-900">{challenge.title}</h4>
                  {challenge.status === 'completed' && (
                    <CheckCircle className="h-5 w-5 text-green-600" />
                  )}
                </div>
                <Progress 
                  value={(challenge.progress / challenge.total) * 100} 
                  className="h-2 mb-2" 
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>{challenge.progress}/{challenge.total}</span>
                  <span>+{challenge.xp} XP</span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function CommerceHub({ enrollmentStatus, wallet }: any) {
  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">My Wallet</h3>
              <div className="text-4xl font-bold mb-2">
                {enrollmentStatus.walletBalance?.toLocaleString() || '0'} Credits
              </div>
              <p className="text-blue-100">Available for courses and sessions</p>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              Top Up
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CreditCard className="h-5 w-5 text-green-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-emerald-500">
                <Plus className="h-5 w-5 mr-3" />
                Add Credits
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Package className="h-5 w-5 mr-3" />
                Buy Course Package
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <Video className="h-5 w-5 mr-3" />
                Book Private Session
              </Button>
              <Button variant="outline" className="w-full justify-start h-12">
                <FileText className="h-5 w-5 mr-3" />
                Transaction History
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Transactions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { type: 'purchase', description: 'IELTS Preparation Course', amount: -500, date: '2 days ago', status: 'completed' },
                { type: 'topup', description: 'Credit Top-up', amount: +1000, date: '1 week ago', status: 'completed' },
                { type: 'purchase', description: 'Grammar Masterclass', amount: -200, date: '2 weeks ago', status: 'completed' },
              ].map((transaction, index) => (
                <div key={index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className={cn(
                      "w-10 h-10 rounded-lg flex items-center justify-center",
                      transaction.type === 'topup' ? "bg-green-100" : "bg-blue-100"
                    )}>
                      {transaction.type === 'topup' ? (
                        <Plus className="h-5 w-5 text-green-600" />
                      ) : (
                        <CreditCard className="h-5 w-5 text-blue-600" />
                      )}
                    </div>
                    <div>
                      <h4 className="font-medium text-sm text-gray-900">{transaction.description}</h4>
                      <p className="text-xs text-gray-500">{transaction.date}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className={cn(
                      "font-bold",
                      transaction.amount > 0 ? "text-green-600" : "text-gray-900"
                    )}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount} credits
                    </div>
                    <Badge variant="outline" className="text-xs">
                      {transaction.status}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Available Packages */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Available Packages
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {[
              { 
                title: 'Starter Pack', 
                price: 500, 
                description: 'Perfect for beginners',
                features: ['5 Group Sessions', '10 AI Practices', 'Basic Support'],
                popular: false 
              },
              { 
                title: 'Pro Pack', 
                price: 1000, 
                description: 'Most popular choice',
                features: ['15 Group Sessions', '25 AI Practices', 'Priority Support', '2 Private Sessions'],
                popular: true 
              },
              { 
                title: 'Premium Pack', 
                price: 2000, 
                description: 'Complete learning experience',
                features: ['Unlimited Sessions', 'Unlimited AI', 'VIP Support', '10 Private Sessions', 'Certification'],
                popular: false 
              }
            ].map((pkg, index) => (
              <Card key={index} className={cn(
                "relative",
                pkg.popular && "border-2 border-purple-500 shadow-lg"
              )}>
                {pkg.popular && (
                  <div className="absolute -top-3 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-purple-500 text-white">Most Popular</Badge>
                  </div>
                )}
                <CardContent className="p-6">
                  <h3 className="font-bold text-lg text-gray-900 mb-2">{pkg.title}</h3>
                  <p className="text-gray-600 text-sm mb-4">{pkg.description}</p>
                  <div className="text-3xl font-bold text-purple-600 mb-4">
                    {pkg.price} <span className="text-sm font-normal text-gray-500">credits</span>
                  </div>
                  <ul className="space-y-2 mb-6">
                    {pkg.features.map((feature, i) => (
                      <li key={i} className="flex items-center gap-2 text-sm text-gray-600">
                        <CheckCircle className="h-4 w-4 text-green-500" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button 
                    className={cn(
                      "w-full",
                      pkg.popular ? "bg-gradient-to-r from-purple-500 to-pink-500" : ""
                    )}
                    variant={pkg.popular ? "default" : "outline"}
                  >
                    Choose Plan
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function ProfileHub({ user, achievements, enrollmentStatus }: any) {
  return (
    <div className="space-y-6">
      {/* Profile Header */}
      <Card className="bg-gradient-to-r from-indigo-600 to-blue-600 text-white">
        <CardContent className="p-8">
          <div className="flex items-center gap-6">
            <div className="relative">
              <Avatar className="w-24 h-24 border-4 border-white/30">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-white/20 text-white text-3xl font-bold">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <Button 
                size="icon" 
                className="absolute -bottom-2 -right-2 w-8 h-8 bg-white/20 hover:bg-white/30 text-white border-white/30"
              >
                <Camera className="h-4 w-4" />
              </Button>
            </div>
            <div className="flex-1">
              <h3 className="text-3xl font-bold mb-2">
                {user?.firstName} {user?.lastName}
              </h3>
              <p className="text-indigo-100 mb-4">{user?.email}</p>
              <div className="flex items-center gap-4 text-sm">
                <Badge className="bg-white/20 text-white border-white/30">
                  {enrollmentStatus.membershipTier || 'Silver'} Member
                </Badge>
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  <span>{user?.location || 'Not specified'}</span>
                </div>
                <div className="flex items-center gap-1">
                  <Calendar className="h-4 w-4" />
                  <span>Joined {user?.joinDate || 'Recently'}</span>
                </div>
              </div>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30">
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Profile
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Details */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-indigo-600" />
              Profile Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">First Name</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.firstName || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Last Name</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.lastName || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Email</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.email || 'Not specified'}
                  </div>
                </div>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">Phone</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.phone || 'Not specified'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Language Level</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.level || 'Intermediate'}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">Learning Goals</label>
                  <div className="mt-1 p-3 border border-gray-200 rounded-lg">
                    {user?.goals || 'General English Improvement'}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Quick Stats */}
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-purple-600" />
                Learning Stats
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Current Level</span>
                  <Badge className="bg-purple-100 text-purple-700">
                    Level {user?.level || 1}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Total XP</span>
                  <span className="font-semibold">{user?.totalXP || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Streak Days</span>
                  <span className="font-semibold">{user?.streakDays || 0}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Lessons Completed</span>
                  <span className="font-semibold">{user?.completedLessons || 0}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Settings className="h-5 w-5 text-gray-600" />
                Account Settings
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <Button variant="outline" className="w-full justify-start">
                  <Bell className="h-4 w-4 mr-2" />
                  Notifications
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Shield className="h-4 w-4 mr-2" />
                  Privacy & Security
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <Globe className="h-4 w-4 mr-2" />
                  Language & Region
                </Button>
                <Button variant="outline" className="w-full justify-start">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Billing & Payment
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Achievements & Certificates */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-600" />
              Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              {[
                { title: 'First Lesson', description: 'Complete your first lesson', earned: true, icon: Star },
                { title: '7-Day Streak', description: 'Study for 7 days in a row', earned: true, icon: Flame },
                { title: 'Grammar Master', description: 'Complete grammar course', earned: false, icon: BookOpen },
                { title: 'Social Learner', description: 'Join your first study group', earned: true, icon: Users },
              ].map((achievement, index) => (
                <div key={index} className={cn(
                  "p-4 border rounded-lg text-center",
                  achievement.earned ? "bg-yellow-50 border-yellow-200" : "bg-gray-50 border-gray-200"
                )}>
                  <div className={cn(
                    "w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-2",
                    achievement.earned ? "bg-yellow-500" : "bg-gray-300"
                  )}>
                    <achievement.icon className="h-6 w-6 text-white" />
                  </div>
                  <h4 className="font-medium text-sm text-gray-900">{achievement.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{achievement.description}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5 text-blue-600" />
              Certificates
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {[
                { title: 'Basic English Certificate', issueDate: '2024-01-15', level: 'A2', verified: true },
                { title: 'Grammar Fundamentals', issueDate: '2024-02-20', level: 'B1', verified: true },
              ].map((cert, index) => (
                <div key={index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                      <Award className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900">{cert.title}</h4>
                      <p className="text-sm text-gray-600">Level {cert.level} • {cert.issueDate}</p>
                      {cert.verified && (
                        <Badge className="bg-green-100 text-green-700 text-xs mt-1">
                          Verified
                        </Badge>
                      )}
                    </div>
                  </div>
                  <Button size="sm" variant="outline">
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </div>
              ))}
              <div className="text-center py-4">
                <Button variant="outline">
                  View All Certificates
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}