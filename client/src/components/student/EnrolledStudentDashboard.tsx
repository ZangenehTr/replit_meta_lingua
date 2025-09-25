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

// Hub Loading and Error State Components
function HubLoadingSkeleton({ hubId }: { hubId: HubType }) {
  return (
    <div className="space-y-6" data-testid={`loading-${hubId}-hub`}>
      <Card>
        <CardHeader>
          <Skeleton className="h-6 w-48" />
          <Skeleton className="h-4 w-72" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-8 w-3/4" />
                <Skeleton className="h-4 w-1/2" />
              </div>
            ))}
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-10 w-24" />
            <Skeleton className="h-10 w-32" />
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i}>
            <CardHeader>
              <Skeleton className="h-6 w-32" />
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {[...Array(3)].map((_, j) => (
                  <Skeleton key={j} className="h-4 w-full" />
                ))}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function HubErrorState({ hubId, onRetry }: { hubId: HubType; onRetry: () => void }) {
  const queryClient = useQueryClient();
  return (
    <div className="flex flex-col items-center justify-center py-12 space-y-4" data-testid={`error-${hubId}-hub`}>
      <div className="text-center space-y-2">
        <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
        <h3 className="text-lg font-semibold text-gray-900">Failed to load {hubId} hub</h3>
        <p className="text-gray-600 max-w-md">
          Something went wrong while loading your {hubId} data. Please try again.
        </p>
      </div>
      <div className="flex gap-3">
        <Button 
          variant="outline" 
          onClick={onRetry}
          data-testid={`button-retry-${hubId}`}
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Try Again
        </Button>
        <Button 
          variant="outline" 
          onClick={() => {
            // Force a complete refresh of all queries
            queryClient.invalidateQueries();
            onRetry();
          }}
          data-testid={`button-refresh-${hubId}`}
        >
          <Loader2 className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>
    </div>
  );
}

// Import existing widgets
import {
  GamificationWidget,
  LearningProgressWidget,
  UpcomingSessionsWidget,
  AssignmentsWidget,
  AchievementWidget
} from "@/components/student/widgets";

// Import the comprehensive Quick Actions Bar
import { ComprehensiveQuickActionsBar } from "./ComprehensiveQuickActionsBar";

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

  // Comprehensive API data fetching with React Query with proper error handling
  const { data: dashboardStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: ['/api/student/dashboard-stats'],
    queryFn: () => apiRequest('/api/student/dashboard-stats'),
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  const { data: gamificationStats, isLoading: gamificationLoading, error: gamificationError, refetch: refetchGamification } = useQuery({
    queryKey: ['/api/student/gamification-stats'],
    queryFn: () => apiRequest('/api/student/gamification-stats'),
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  const { data: learningProgress, isLoading: progressLoading, error: progressError, refetch: refetchProgress } = useQuery({
    queryKey: ['/api/student/learning-progress'],
    queryFn: () => apiRequest('/api/student/learning-progress'),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const { data: upcomingSessions = [], isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: ['/api/student/upcoming-sessions'],
    queryFn: () => apiRequest('/api/student/upcoming-sessions'),
    staleTime: 2 * 60 * 1000,
    retry: 3,
  });

  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useQuery({
    queryKey: ['/api/student/assignments'],
    queryFn: () => apiRequest('/api/student/assignments'),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  const { data: achievements = [], isLoading: achievementsLoading, error: achievementsError, refetch: refetchAchievements } = useQuery({
    queryKey: ['/api/student/achievements'],
    queryFn: () => apiRequest('/api/student/achievements'),
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

  const { data: courses = [], isLoading: coursesLoading, error: coursesError, refetch: refetchCourses } = useQuery({
    queryKey: ['/api/student/courses'],
    queryFn: () => apiRequest('/api/student/courses'),
    staleTime: 15 * 60 * 1000,
    retry: 3,
  });

  const { data: games = [], isLoading: gamesLoading, error: gamesError, refetch: refetchGames } = useQuery({
    queryKey: ['/api/student/games/accessible'],
    queryFn: () => apiRequest('/api/student/games/accessible'),
    staleTime: 10 * 60 * 1000,
    retry: 3,
  });

  const { data: wallet, isLoading: walletLoading, error: walletError, refetch: refetchWallet } = useQuery({
    queryKey: ['/api/student/wallet'],
    queryFn: () => apiRequest('/api/student/wallet'),
    staleTime: 5 * 60 * 1000,
    retry: 3,
  });

  // Hub-specific loading and error state management
  const getHubLoadingState = (hubId: HubType): boolean => {
    switch (hubId) {
      case 'overview':
        return statsLoading || gamificationLoading;
      case 'learn':
        return coursesLoading || progressLoading;
      case 'live':
        return sessionsLoading;
      case 'assessment':
        return assignmentsLoading;
      case 'ai':
        return false; // AI hub doesn't have specific data loading
      case 'social':
        return false; // Social hub doesn't have specific data loading
      case 'games':
        return gamesLoading || achievementsLoading;
      case 'commerce':
        return walletLoading;
      case 'profile':
        return achievementsLoading;
      default:
        return false;
    }
  };

  const getHubErrorState = (hubId: HubType): boolean => {
    switch (hubId) {
      case 'overview':
        return !!(statsError || gamificationError);
      case 'learn':
        return !!(coursesError || progressError);
      case 'live':
        return !!sessionsError;
      case 'assessment':
        return !!assignmentsError;
      case 'ai':
        return false;
      case 'social':
        return false;
      case 'games':
        return !!(gamesError || achievementsError);
      case 'commerce':
        return !!walletError;
      case 'profile':
        return !!achievementsError;
      default:
        return false;
    }
  };

  const getHubRetryFunction = (hubId: HubType) => {
    return () => {
      switch (hubId) {
        case 'overview':
          refetchStats();
          refetchGamification();
          break;
        case 'learn':
          refetchCourses();
          refetchProgress();
          break;
        case 'live':
          refetchSessions();
          break;
        case 'assessment':
          refetchAssignments();
          break;
        case 'games':
          refetchGames();
          refetchAchievements();
          break;
        case 'commerce':
          refetchWallet();
          break;
        case 'profile':
          refetchAchievements();
          break;
      }
    };
  };

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
              {renderHubContent(
                activeHub, 
                {
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
                  wallet
                },
                getHubLoadingState(activeHub),
                getHubErrorState(activeHub),
                getHubRetryFunction(activeHub)
              )}
            </motion.div>
          </AnimatePresence>
        </main>
      </div>

      {/* Comprehensive Quick Actions Bar - Floating across all hubs */}
      <ComprehensiveQuickActionsBar 
        position={isMediumScreen ? "bottom-right" : "bottom-right"}
        className="transition-all duration-300"
        data-testid="comprehensive-quick-actions-bar"
      />

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
  },
  isLoading: boolean,
  hasError: boolean,
  retry: () => void
) {
  // Show loading state for all hubs
  if (isLoading) {
    return <HubLoadingSkeleton hubId={hubId} />;
  }

  // Show error state for all hubs
  if (hasError) {
    return <HubErrorState hubId={hubId} onRetry={retry} />;
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

      {/* Quick Actions Bar - Now handled by ComprehensiveQuickActionsBar at bottom of page */}

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
  const queryClient = useQueryClient();
  
  // Fetch LinguaQuest progress data
  const { data: linguaQuestProgress, isLoading: linguaQuestLoading } = useQuery({
    queryKey: ['/api/student/linguaquest-progress'],
    queryFn: () => apiRequest('/api/student/linguaquest-progress'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch learning recommendations
  const { data: recommendations, isLoading: recommendationsLoading } = useQuery({
    queryKey: ['/api/student/learning-recommendations'],
    queryFn: () => apiRequest('/api/student/learning-recommendations'),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });

  return (
    <div className="space-y-6">
      {/* Learning Hub Header */}
      <Card className="bg-gradient-to-r from-blue-500 to-indigo-600 text-white" data-testid="learn-hub-header">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <BookOpen className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Learning Center</h3>
              <p className="text-blue-100 mb-4">Continue your learning journey with paid courses and free content</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <Trophy className="h-4 w-4 text-yellow-300" />
                  <span>{learningProgress?.totalXP || 0} XP earned</span>
                </div>
                <div className="flex items-center gap-2">
                  <Target className="h-4 w-4 text-green-300" />
                  <span>{learningProgress?.completedLessons || 0} lessons completed</span>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Learning Progress Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Card className="lg:col-span-2" data-testid="paid-courses-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Crown className="h-5 w-5 text-yellow-600" />
              My Premium Courses
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {courses?.length > 0 ? (
                courses.slice(0, 3).map((course: any, index: number) => (
                  <div key={course.id || index} className="flex items-center gap-4 p-4 border border-blue-100 rounded-lg hover:bg-blue-50 transition-all" data-testid={`course-${course.id}`}>
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-white" />
                    </div>
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-900">{course.title || 'Course Title'}</h4>
                      <p className="text-sm text-gray-600">Progress: {course.progress || 0}%</p>
                      <Progress value={course.progress || 0} className="mt-2 h-2" />
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">{course.level || 'Intermediate'}</Badge>
                        <span className="text-xs text-gray-500">{course.lessonsRemaining || 0} lessons left</span>
                      </div>
                    </div>
                    <Button size="sm" className="bg-gradient-to-r from-blue-500 to-indigo-500" data-testid={`button-continue-course-${course.id}`}>
                      Continue
                    </Button>
                  </div>
                ))
              ) : (
                <div className="text-center py-12">
                  <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">No premium courses available yet</p>
                  <Link href="/student/course-catalog">
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500" data-testid="button-browse-courses">
                      Browse Premium Courses
                    </Button>
                  </Link>
                </div>
              )}
            </div>
            {courses?.length > 3 && (
              <div className="mt-4 pt-4 border-t border-gray-200">
                <Link href="/student/my-courses">
                  <Button variant="outline" className="w-full" data-testid="button-view-all-courses">
                    View All My Courses ({courses.length})
                  </Button>
                </Link>
              </div>
            )}
          </CardContent>
        </Card>
        
        <div className="space-y-4">
          {/* LinguaQuest Integration */}
          <Card data-testid="linguaquest-card">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-purple-600" />
                LinguaQuest Free
              </CardTitle>
            </CardHeader>
            <CardContent>
              {linguaQuestLoading ? (
                <div className="space-y-3">
                  <Skeleton className="h-4 w-full" />
                  <Skeleton className="h-4 w-3/4" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 mb-1">Free Learning Progress</p>
                      <div className="flex items-center gap-2">
                        <Progress value={linguaQuestProgress?.overallProgress || 0} className="w-20 h-2" />
                        <span className="text-sm font-medium">{linguaQuestProgress?.overallProgress || 0}%</span>
                      </div>
                    </div>
                    <Badge className="bg-gradient-to-r from-purple-500 to-pink-500 text-white">
                      Level {linguaQuestProgress?.level || 1}
                    </Badge>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-yellow-500" />
                      <span>{linguaQuestProgress?.freeXP || 0} XP</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Trophy className="h-4 w-4 text-orange-500" />
                      <span>{linguaQuestProgress?.achievements || 0} achievements</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span>{linguaQuestProgress?.freeLessonsCompleted || 0} free lessons</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-red-500" />
                      <span>{linguaQuestProgress?.freeStreak || 0} day streak</span>
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Link href="/linguaquest">
                      <Button className="w-full bg-gradient-to-r from-purple-500 to-pink-500" data-testid="button-continue-linguaquest">
                        <Play className="h-4 w-4 mr-2" />
                        Continue Free Lessons
                      </Button>
                    </Link>
                    {linguaQuestProgress?.canUpgrade && (
                      <Button variant="outline" className="w-full text-xs" data-testid="button-upgrade-linguaquest">
                        <Crown className="h-3 w-3 mr-2" />
                        Upgrade Progress to Premium
                      </Button>
                    )}
                  </div>
                  
                  <div className="text-xs text-gray-500 bg-purple-50 p-3 rounded-lg">
                    🎆 <strong>Tip:</strong> Your LinguaQuest progress complements your premium courses. Use free lessons to practice between paid sessions!
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
          
          <LearningProgressWidget theme="learner" data-testid="learning-progress-widget" />
          <AssignmentsWidget theme="learner" data-testid="assignments-widget" />
        </div>
      </div>

      {/* Learning Recommendations & Resources */}
      <Card data-testid="learning-recommendations-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-indigo-600" />
            Personalized Learning Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent>
          {recommendationsLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg">
                  <Skeleton className="h-6 w-6 mb-3" />
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-3 w-3/4 mb-3" />
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(recommendations?.suggestions || [
                { id: '1', type: 'linguaquest', title: 'Practice Grammar Basics', description: 'Free interactive exercises', icon: 'Sparkles', difficulty: 'Easy' },
                { id: '2', type: 'premium', title: 'Business English Course', description: 'Advanced communication skills', icon: 'Crown', difficulty: 'Advanced' },
                { id: '3', type: 'mixed', title: 'Speaking Practice Session', description: 'Combine free & premium content', icon: 'Mic', difficulty: 'Medium' },
              ]).map((rec: any, index: number) => {
                const iconMap: any = {
                  Sparkles: Sparkles,
                  Crown: Crown,
                  Mic: Mic,
                  BookOpen: BookOpen,
                };
                const IconComponent = iconMap[rec.icon] || BookOpen;
                
                return (
                  <div key={rec.id || index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all" data-testid={`recommendation-${rec.id}`}>
                    <div className={cn(
                      "w-8 h-8 rounded-lg flex items-center justify-center mb-3",
                      rec.type === 'linguaquest' ? "bg-purple-100" :
                      rec.type === 'premium' ? "bg-yellow-100" : "bg-blue-100"
                    )}>
                      <IconComponent className={cn(
                        "h-4 w-4",
                        rec.type === 'linguaquest' ? "text-purple-600" :
                        rec.type === 'premium' ? "text-yellow-600" : "text-blue-600"
                      )} />
                    </div>
                    <h4 className="font-medium text-gray-900 mb-1">{rec.title}</h4>
                    <p className="text-sm text-gray-600 mb-3">{rec.description}</p>
                    <div className="flex items-center justify-between">
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          rec.difficulty === 'Easy' ? "border-green-200 text-green-700" :
                          rec.difficulty === 'Medium' ? "border-yellow-200 text-yellow-700" :
                          "border-red-200 text-red-700"
                        )}
                      >
                        {rec.difficulty}
                      </Badge>
                      <Button size="sm" variant="outline" data-testid={`button-try-${rec.id}`}>
                        Try Now
                      </Button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 pt-4 border-t border-gray-200">
            <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full flex items-center justify-center">
                  <Globe className="h-5 w-5 text-white" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900">Cross-Platform Learning</h4>
                  <p className="text-sm text-gray-600">Mix free LinguaQuest lessons with your premium courses for optimal learning</p>
                </div>
                <Link href="/student/learning-path">
                  <Button data-testid="button-create-path">
                    <ArrowRight className="h-4 w-4 mr-2" />
                    Create Path
                  </Button>
                </Link>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Course Materials & Resources */}
      <Card data-testid="course-materials-card">
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
  const queryClient = useQueryClient();
  const [showQuickJoinDialog, setShowQuickJoinDialog] = useState(false);
  
  // Fetch Callern data
  const { data: callernData, isLoading: callernLoading } = useQuery({
    queryKey: ['/api/student/callern-status'],
    queryFn: () => apiRequest('/api/student/callern-status'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: teacherAvailability, isLoading: availabilityLoading } = useQuery({
    queryKey: ['/api/student/teacher-availability'],
    queryFn: () => apiRequest('/api/student/teacher-availability'),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const { data: sessionHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/student/session-history', 'recent'],
    queryFn: () => apiRequest('/api/student/session-history?limit=3'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Start quick session mutation
  const startQuickSessionMutation = useMutation({
    mutationFn: () => apiRequest('/api/student/callern/quick-session', { method: 'POST' }),
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.open(data.sessionUrl, '_blank');
      }
    },
  });

  const availableTeachers = teacherAvailability?.available || 0;
  const hasActivePackage = callernData?.hasActivePackage || false;
  const remainingMinutes = callernData?.remainingMinutes || 0;

  return (
    <div className="space-y-6">
      {/* Callern Video Tutoring Status */}
      <Card className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white" data-testid="live-hub-header">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Video className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Callern Video Tutoring</h3>
              <p className="text-indigo-100 mb-3">Connect with expert tutors for personalized learning</p>
              <div className="flex items-center gap-6 text-sm">
                <div className="flex items-center gap-2">
                  <div className={cn(
                    "w-2 h-2 rounded-full",
                    availableTeachers > 0 ? "bg-green-300" : "bg-red-300"
                  )} />
                  <span>{availableTeachers} teachers available</span>
                </div>
                {hasActivePackage && (
                  <div className="flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    <span>{remainingMinutes} minutes remaining</span>
                  </div>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <Link href="/callern">
                <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" data-testid="button-callern-dashboard">
                  <VideoIcon className="h-4 w-4 mr-2" />
                  Callern Dashboard
                </Button>
              </Link>
              {hasActivePackage && availableTeachers > 0 && (
                <Button 
                  className="bg-white/20 hover:bg-white/30 text-white border-white/30 w-full"
                  onClick={() => setShowQuickJoinDialog(true)}
                  data-testid="button-quick-session"
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Quick Session
                </Button>
              )}
            </div>
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
        
        {/* Quick Actions */}
        <Card data-testid="live-actions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-purple-600" />
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {hasActivePackage ? (
                availableTeachers > 0 ? (
                  <Button 
                    className="w-full justify-start h-12 bg-gradient-to-r from-indigo-500 to-purple-500"
                    onClick={() => setShowQuickJoinDialog(true)}
                    data-testid="button-join-practice-room"
                  >
                    <VideoIcon className="h-5 w-5 mr-3" />
                    Start Instant Session ({availableTeachers} available)
                  </Button>
                ) : (
                  <Button 
                    disabled
                    className="w-full justify-start h-12" 
                    data-testid="button-no-teachers"
                  >
                    <VideoIcon className="h-5 w-5 mr-3" />
                    No Teachers Available
                  </Button>
                )
              ) : (
                <Link href="/callern">
                  <Button className="w-full justify-start h-12 bg-gradient-to-r from-green-500 to-teal-500" data-testid="button-buy-package">
                    <Package className="h-5 w-5 mr-3" />
                    Buy Callern Package
                  </Button>
                </Link>
              )}
              <Link href="/student/tutors">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-schedule-session">
                  <Calendar className="h-5 w-5 mr-3" />
                  Schedule with Specific Tutor
                </Button>
              </Link>
              <Link href="/student/sessions">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-session-history">
                  <Clock className="h-5 w-5 mr-3" />
                  View Session History
                </Button>
              </Link>
              <Link href="/callern">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-callern-full">
                  <Settings className="h-5 w-5 mr-3" />
                  Full Callern Dashboard
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Session History */}
      <Card data-testid="session-history-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Clock className="h-5 w-5 text-blue-600" />
            Recent Sessions
          </CardTitle>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg">
                  <Skeleton className="w-10 h-10 rounded-lg" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-48" />
                    <Skeleton className="h-3 w-36" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          ) : (
            <div className="space-y-4">
              {(sessionHistory?.sessions || [
                { id: '1', title: 'Grammar Focus Session', teacher: 'Sarah Johnson', date: '2 days ago', duration: 45, status: 'completed', recordingUrl: '/recording/1' },
                { id: '2', title: 'Speaking Practice', teacher: 'Mark Wilson', date: '1 week ago', duration: 30, status: 'completed', recordingUrl: '/recording/2' },
                { id: '3', title: 'IELTS Preparation', teacher: 'Emma Davis', date: '2 weeks ago', duration: 60, status: 'completed', recordingUrl: null },
              ]).map((session: any, index: number) => (
                <div key={session.id || index} className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-testid={`session-${session.id}`}>
                  <div className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    session.status === 'completed' ? "bg-green-100" : 
                    session.status === 'scheduled' ? "bg-blue-100" : "bg-gray-100"
                  )}>
                    {session.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : session.status === 'scheduled' ? (
                      <Calendar className="h-5 w-5 text-blue-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-gray-600" />
                    )}
                  </div>
                  <div className="flex-1">
                    <h4 className="font-medium text-gray-900">{session.title}</h4>
                    <p className="text-sm text-gray-600">with {session.teacher} • {session.duration} min</p>
                    <p className="text-xs text-gray-500">{session.date}</p>
                  </div>
                  <div className="flex gap-2">
                    {session.recordingUrl && (
                      <Button size="sm" variant="outline" data-testid={`button-recording-${session.id}`}>
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Recording
                      </Button>
                    )}
                    <Button size="sm" variant="ghost" data-testid={`button-details-${session.id}`}>
                      Details
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-gray-200">
            <Link href="/student/sessions">
              <Button variant="outline" className="w-full" data-testid="button-view-all-sessions">
                View Complete Session History
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>

      {/* Quick Session Dialog */}
      <Dialog open={showQuickJoinDialog} onOpenChange={setShowQuickJoinDialog}>
        <DialogContent data-testid="quick-session-dialog">
          <DialogHeader>
            <DialogTitle>Start Quick Session</DialogTitle>
            <DialogDescription>
              Connect with an available teacher instantly for a practice session.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <Users className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-blue-900">{availableTeachers} Teachers Available</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-blue-600" />
                <span className="text-sm text-blue-700">Average wait time: 2-5 minutes</span>
              </div>
            </div>
            {remainingMinutes > 0 && (
              <div className="p-4 bg-green-50 rounded-lg">
                <div className="flex items-center gap-2">
                  <Package className="h-4 w-4 text-green-600" />
                  <span className="font-medium text-green-900">{remainingMinutes} minutes remaining in your package</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowQuickJoinDialog(false)} data-testid="button-cancel-session">
              Cancel
            </Button>
            <Button 
              onClick={() => {
                startQuickSessionMutation.mutate();
                setShowQuickJoinDialog(false);
              }}
              disabled={startQuickSessionMutation.isPending}
              data-testid="button-start-quick-session"
            >
              {startQuickSessionMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Video className="h-4 w-4 mr-2" />
              )}
              Start Session
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
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
            id: 'ai-conversation',
            title: 'AI Conversation',
            description: 'Practice speaking with AI tutor',
            icon: MessageCircle,
            color: 'from-blue-500 to-indigo-500',
            available: true,
            usageCount: 15,
            href: '/student/AIConversation'
          },
          {
            id: 'homework-helper',
            title: 'Homework Helper',
            description: 'Get AI assistance with assignments',
            icon: PenTool,
            color: 'from-indigo-500 to-purple-500',
            available: true,
            usageCount: 8,
            href: '/student/ai-study-partner-mobile'
          },
          {
            id: 'grammar-checker',
            title: 'Grammar Checker',
            description: 'AI-powered writing assistance',
            icon: CheckCircle,
            color: 'from-purple-500 to-pink-500',
            available: true,
            usageCount: 22,
            onClick: () => {
              // TODO: Implement grammar checker modal/component
              console.log('Opening Grammar Checker...');
            }
          },
          {
            id: 'pronunciation-coach',
            title: 'Pronunciation Coach',
            description: 'Perfect your pronunciation',
            icon: Mic,
            color: 'from-green-500 to-teal-500',
            available: true,
            usageCount: 6,
            href: '/pronunciation-practice'
          },
          {
            id: 'reading-comprehension',
            title: 'Reading Comprehension',
            description: 'AI-guided reading practice',
            icon: BookOpen,
            color: 'from-orange-500 to-red-500',
            available: false,
            usageCount: 0
          },
          {
            id: 'study-planner',
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
            tool.available ? "hover:scale-105 cursor-pointer" : "opacity-60"
          )}
          data-testid={`ai-tool-${tool.id}`}
          >
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
                {tool.available && tool.href ? (
                  <Link href={tool.href}>
                    <Button 
                      size="sm" 
                      className={`bg-gradient-to-r ${tool.color} hover:opacity-90`}
                      data-testid={`button-${tool.id}`}
                    >
                      Try Now
                    </Button>
                  </Link>
                ) : tool.available && tool.onClick ? (
                  <Button 
                    size="sm" 
                    className={`bg-gradient-to-r ${tool.color} hover:opacity-90`}
                    onClick={tool.onClick}
                    data-testid={`button-${tool.id}`}
                  >
                    Try Now
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    disabled
                    data-testid={`button-${tool.id}`}
                  >
                    Coming Soon
                  </Button>
                )}
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
  const queryClient = useQueryClient();
  
  // Fetch social data with React Query
  const { data: socialStats, isLoading: socialLoading } = useQuery({
    queryKey: ['/api/student/social-stats'],
    queryFn: () => apiRequest('/api/student/social-stats'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const { data: studyGroups, isLoading: groupsLoading } = useQuery({
    queryKey: ['/api/student/study-groups'],
    queryFn: () => apiRequest('/api/student/study-groups'),
    staleTime: 2 * 60 * 1000, // 2 minutes
  });

  const { data: communityFeed, isLoading: feedLoading } = useQuery({
    queryKey: ['/api/student/community-feed'],
    queryFn: () => apiRequest('/api/student/community-feed'),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  const { data: studyPartners, isLoading: partnersLoading } = useQuery({
    queryKey: ['/api/student/study-partners'],
    queryFn: () => apiRequest('/api/student/study-partners'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Join study group mutation
  const joinGroupMutation = useMutation({
    mutationFn: (groupId: string) => 
      apiRequest(`/api/student/study-groups/${groupId}/join`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/study-groups'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/social-stats'] });
    },
  });

  // Connect with study partner mutation
  const connectPartnerMutation = useMutation({
    mutationFn: (partnerId: string) => 
      apiRequest(`/api/student/study-partners/${partnerId}/connect`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/study-partners'] });
    },
  });

  return (
    <div className="space-y-6">
      {/* Community Overview */}
      <Card className="bg-gradient-to-r from-blue-500 to-teal-500 text-white" data-testid="social-hub-header">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Users className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">Learning Community</h3>
              <p className="text-blue-100">Connect with fellow learners and practice together</p>
              <div className="flex items-center gap-4 mt-4">
                <Link href="/student/messages">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" data-testid="button-messages">
                    <MessageSquare className="h-4 w-4 mr-2" />
                    Messages
                  </Button>
                </Link>
                <div className="text-sm text-blue-100">
                  {socialStats?.activeConnections || 0} active connections • {socialStats?.unreadMessages || 0} unread messages
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Study Groups */}
        <Card data-testid="study-groups-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Study Groups
            </CardTitle>
          </CardHeader>
          <CardContent>
            {groupsLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-48" />
                        <Skeleton className="h-3 w-24" />
                      </div>
                    </div>
                    <Skeleton className="h-8 w-16" />
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(studyGroups?.groups || [
                  { id: '1', name: 'IELTS Warriors', members: 24, activity: 'High', topic: 'IELTS Preparation', joined: false },
                  { id: '2', name: 'Business English Pro', members: 18, activity: 'Medium', topic: 'Business Communication', joined: false },
                  { id: '3', name: 'Grammar Masters', members: 31, activity: 'High', topic: 'Grammar Practice', joined: true },
                ]).map((group: any, index: number) => (
                  <div key={group.id || index} className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-teal-50 transition-colors" data-testid={`study-group-${group.id}`}>
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
                    {group.joined ? (
                      <Badge className="bg-teal-100 text-teal-700" data-testid={`badge-joined-${group.id}`}>
                        Joined
                      </Badge>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => joinGroupMutation.mutate(group.id)}
                        disabled={joinGroupMutation.isPending}
                        data-testid={`button-join-group-${group.id}`}
                      >
                        {joinGroupMutation.isPending ? (
                          <Loader2 className="h-4 w-4 animate-spin mr-1" />
                        ) : null}
                        Join
                      </Button>
                    )}
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/student/study-groups">
                <Button variant="outline" className="w-full" data-testid="button-view-all-groups">
                  View All Study Groups
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Community Feed */}
        <Card data-testid="community-feed-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5 text-blue-600" />
              Community Feed
            </CardTitle>
          </CardHeader>
          <CardContent>
            {feedLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="p-4 border border-gray-200 rounded-lg">
                    <div className="flex items-start gap-3">
                      <Skeleton className="w-8 h-8 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center gap-2">
                          <Skeleton className="h-4 w-20" />
                          <Skeleton className="h-3 w-16" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                        <Skeleton className="h-4 w-3/4" />
                        <div className="flex items-center gap-4">
                          <Skeleton className="h-3 w-8" />
                          <Skeleton className="h-3 w-12" />
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(communityFeed?.posts || [
                  { id: '1', user: 'Sarah M.', content: 'Just completed my first IELTS practice test! Feeling confident 💪', time: '2 hours ago', likes: 12 },
                  { id: '2', user: 'Ahmed K.', content: 'Looking for a speaking practice partner for tomorrow evening. Anyone interested?', time: '4 hours ago', likes: 5 },
                  { id: '3', user: 'Emma L.', content: 'Great grammar lesson today! The conditional sentences finally make sense 🎉', time: '1 day ago', likes: 18 },
                ]).map((post: any, index: number) => (
                  <div key={post.id || index} className="p-4 border border-gray-200 rounded-lg" data-testid={`community-post-${post.id}`}>
                    <div className="flex items-start gap-3">
                      <Avatar className="w-8 h-8">
                        <AvatarFallback className="bg-blue-100 text-blue-600 text-xs">
                          {post.user.split(' ').map((n: string) => n[0]).join('')}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-sm text-gray-900">{post.user}</span>
                          <span className="text-xs text-gray-500">{post.time}</span>
                        </div>
                        <p className="text-sm text-gray-700 mb-2">{post.content}</p>
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          <button 
                            className="flex items-center gap-1 hover:text-red-500 transition-colors"
                            data-testid={`button-like-${post.id}`}
                          >
                            <Heart className="h-3 w-3" />
                            {post.likes}
                          </button>
                          <button className="hover:text-blue-500 transition-colors" data-testid={`button-reply-${post.id}`}>Reply</button>
                          <button className="hover:text-green-500 transition-colors" data-testid={`button-share-${post.id}`}>Share</button>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/student/community">
                <Button variant="outline" className="w-full" data-testid="button-view-full-feed">
                  View Full Community Feed
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Peer Matching */}
      <Card data-testid="peer-matching-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-600" />
            Find Study Partners
          </CardTitle>
        </CardHeader>
        <CardContent>
          {partnersLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[...Array(3)].map((_, i) => (
                <div key={i} className="p-4 border border-gray-200 rounded-lg">
                  <div className="flex items-center gap-3 mb-3">
                    <Skeleton className="w-12 h-12 rounded-full" />
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-24" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex gap-1">
                      <Skeleton className="h-5 w-16" />
                      <Skeleton className="h-5 w-12" />
                    </div>
                    <Skeleton className="h-3 w-20" />
                  </div>
                  <Skeleton className="h-8 w-full" />
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {(studyPartners?.partners || [
                { id: '1', name: 'Alex Chen', level: 'Intermediate', interests: ['Speaking', 'IELTS'], location: 'Online', compatibility: 92, connected: false },
                { id: '2', name: 'Maria Santos', level: 'Advanced', interests: ['Business English', 'Grammar'], location: 'EST Timezone', compatibility: 88, connected: false },
                { id: '3', name: 'Raj Patel', level: 'Intermediate', interests: ['Conversation', 'Pronunciation'], location: 'Online', compatibility: 85, connected: true },
              ]).map((partner: any, index: number) => (
                <div key={partner.id || index} className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all" data-testid={`study-partner-${partner.id}`}>
                  <div className="flex items-center gap-3 mb-3">
                    <Avatar className="w-12 h-12">
                      <AvatarFallback className="bg-purple-100 text-purple-600">
                        {partner.name.split(' ').map((n: string) => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h4 className="font-medium text-gray-900">{partner.name}</h4>
                      <p className="text-sm text-gray-600">{partner.level} • {partner.location}</p>
                    </div>
                  </div>
                  <div className="space-y-2 mb-3">
                    <div className="flex flex-wrap gap-1">
                      {partner.interests.map((interest: string, i: number) => (
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
                  {partner.connected ? (
                    <Link href="/student/messages">
                      <Button size="sm" variant="outline" className="w-full" data-testid={`button-message-${partner.id}`}>
                        <MessageSquare className="h-4 w-4 mr-1" />
                        Message
                      </Button>
                    </Link>
                  ) : (
                    <Button 
                      size="sm" 
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:opacity-90"
                      onClick={() => connectPartnerMutation.mutate(partner.id)}
                      disabled={connectPartnerMutation.isPending}
                      data-testid={`button-connect-${partner.id}`}
                    >
                      {connectPartnerMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin mr-1" />
                      ) : null}
                      Connect
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
          <div className="mt-6 pt-4 border-t border-gray-200">
            <Link href="/student/peer-socializer">
              <Button variant="outline" className="w-full" data-testid="button-browse-partners">
                <Search className="h-4 w-4 mr-2" />
                Browse All Study Partners
              </Button>
            </Link>
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
  const queryClient = useQueryClient();
  
  // Fetch cart data
  const { data: cartData, isLoading: cartLoading } = useQuery({
    queryKey: ['/api/student/cart'],
    queryFn: () => apiRequest('/api/student/cart'),
    staleTime: 1 * 60 * 1000, // 1 minute
  });

  // Fetch recent orders
  const { data: recentOrders, isLoading: ordersLoading } = useQuery({
    queryKey: ['/api/student/orders', 'recent'],
    queryFn: () => apiRequest('/api/student/orders?limit=3'),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  return (
    <div className="space-y-6">
      {/* Wallet Overview */}
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-500 text-white" data-testid="commerce-hub-header">
        <CardContent className="p-6">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 bg-white/20 rounded-xl flex items-center justify-center">
              <Wallet className="h-8 w-8 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-2xl font-bold mb-2">My Wallet</h3>
              <div className="text-4xl font-bold mb-2" data-testid="wallet-balance">
                {enrollmentStatus.walletBalance?.toLocaleString() || '0'} Credits
              </div>
              <p className="text-blue-100">Available for courses and sessions</p>
              <div className="flex items-center gap-4 mt-4">
                <Link href="/student/virtual-mall">
                  <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" data-testid="button-virtual-mall">
                    <Package className="h-4 w-4 mr-2" />
                    Visit Virtual Mall
                  </Button>
                </Link>
                <div className="text-sm text-blue-100">
                  {cartData?.itemCount || 0} items in cart
                </div>
              </div>
            </div>
            <Button className="bg-white/20 hover:bg-white/30 text-white border-white/30" data-testid="button-top-up">
              <Plus className="h-4 w-4 mr-2" />
              Top Up
            </Button>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Shopping Actions */}
        <Card data-testid="quick-actions-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShoppingCart className="h-5 w-5 text-green-600" />
              Quick Shopping
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Link href="/student/book-catalog">
                <Button className="w-full justify-start h-12 bg-gradient-to-r from-blue-500 to-indigo-500" data-testid="button-book-catalog">
                  <BookOpen className="h-5 w-5 mr-3" />
                  Browse Book Catalog
                </Button>
              </Link>
              <Link href="/student/cart">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-shopping-cart">
                  <ShoppingCart className="h-5 w-5 mr-3" />
                  Shopping Cart ({cartData?.itemCount || 0})
                </Button>
              </Link>
              <Link href="/student/virtual-mall">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-virtual-mall-explore">
                  <Package className="h-5 w-5 mr-3" />
                  Explore Virtual Mall
                </Button>
              </Link>
              <Link href="/student/order-history">
                <Button variant="outline" className="w-full justify-start h-12" data-testid="button-order-history">
                  <FileText className="h-5 w-5 mr-3" />
                  Order History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>

        {/* Recent Orders */}
        <Card data-testid="recent-orders-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Recent Orders
            </CardTitle>
          </CardHeader>
          <CardContent>
            {ordersLoading ? (
              <div className="space-y-4">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
                    <div className="flex items-center gap-3">
                      <Skeleton className="w-10 h-10 rounded-lg" />
                      <div className="space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-20" />
                      </div>
                    </div>
                    <div className="text-right space-y-1">
                      <Skeleton className="h-4 w-16" />
                      <Skeleton className="h-4 w-12" />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {(recentOrders?.orders || [
                  { id: '1', type: 'book', description: 'English Grammar Guide', amount: -25, date: '2 days ago', status: 'delivered' },
                  { id: '2', type: 'course', description: 'IELTS Preparation Course', amount: -500, date: '1 week ago', status: 'active' },
                  { id: '3', type: 'book', description: 'Business English Vocabulary', amount: -35, date: '2 weeks ago', status: 'delivered' },
                ]).map((order: any, index: number) => (
                  <div key={order.id || index} className="flex items-center justify-between p-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors" data-testid={`order-${order.id}`}>
                    <div className="flex items-center gap-3">
                      <div className={cn(
                        "w-10 h-10 rounded-lg flex items-center justify-center",
                        order.type === 'book' ? "bg-blue-100" : "bg-purple-100"
                      )}>
                        {order.type === 'book' ? (
                          <BookOpen className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Package className="h-5 w-5 text-purple-600" />
                        )}
                      </div>
                      <div>
                        <h4 className="font-medium text-sm text-gray-900">{order.description}</h4>
                        <p className="text-xs text-gray-500">{order.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-bold text-gray-900">
                        {Math.abs(order.amount)} credits
                      </div>
                      <Badge 
                        variant="outline" 
                        className={cn(
                          "text-xs",
                          order.status === 'delivered' ? "text-green-600 border-green-200" :
                          order.status === 'active' ? "text-blue-600 border-blue-200" :
                          "text-gray-600"
                        )}
                      >
                        {order.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t border-gray-200">
              <Link href="/student/order-history">
                <Button variant="outline" className="w-full" data-testid="button-view-all-orders">
                  View Complete Order History
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Shopping Categories */}
      <Card data-testid="shopping-categories-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-purple-600" />
            Shopping Categories
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {[
              { 
                id: 'books',
                title: 'Books & Materials', 
                icon: BookOpen,
                color: 'from-blue-500 to-indigo-500',
                href: '/student/book-catalog',
                count: '200+ items'
              },
              { 
                id: 'courses',
                title: 'Video Courses', 
                icon: Video,
                color: 'from-purple-500 to-pink-500',
                href: '/student/video-courses',
                count: '50+ courses'
              },
              { 
                id: 'sessions',
                title: 'Private Sessions', 
                icon: Users,
                color: 'from-green-500 to-teal-500',
                href: '/student/tutors',
                count: 'Book now'
              },
              { 
                id: 'packages',
                title: 'Learning Packages', 
                icon: Package,
                color: 'from-orange-500 to-red-500',
                href: '/student/virtual-mall',
                count: 'Special offers'
              }
            ].map((category) => (
              <Link key={category.id} href={category.href}>
                <div 
                  className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-all cursor-pointer group"
                  data-testid={`category-${category.id}`}
                >
                  <div className={cn(
                    "w-12 h-12 rounded-lg flex items-center justify-center mb-3 bg-gradient-to-r group-hover:scale-105 transition-transform",
                    category.color
                  )}>
                    <category.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-medium text-sm text-gray-900 mb-1">{category.title}</h3>
                  <p className="text-xs text-gray-500">{category.count}</p>
                </div>
              </Link>
            ))}
          </div>
          
          {/* Quick Checkout */}
          {cartData && cartData.itemCount > 0 && (
            <div className="border-t border-gray-200 pt-4">
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h4 className="font-medium text-gray-900">Ready to Checkout?</h4>
                    <p className="text-sm text-gray-600">{cartData.itemCount} items in your cart</p>
                  </div>
                  <Link href="/student/checkout">
                    <Button className="bg-gradient-to-r from-blue-500 to-indigo-500" data-testid="button-quick-checkout">
                      <CreditCard className="h-4 w-4 mr-2" />
                      Checkout Now
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          )}
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