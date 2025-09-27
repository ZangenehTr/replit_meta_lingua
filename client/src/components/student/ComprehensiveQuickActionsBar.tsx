import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { API_ENDPOINTS } from "@/services/endpoints";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { 
  Video,
  Brain,
  MessageSquare,
  Calendar,
  BookOpen,
  TrendingUp,
  Mic,
  HelpCircle,
  ChevronUp,
  ChevronDown,
  X,
  Loader2,
  Phone,
  User,
  Zap,
  AlertCircle,
  LogIn,
  RotateCcw
} from "lucide-react";
import { Link } from "wouter";
import { cn } from "@/lib/utils";
import { useIsMediumScreen } from "@/hooks/useMediaQuery";
import { useAuth } from "@/hooks/use-auth";

interface QuickAction {
  id: string;
  label: string;
  shortLabel?: string;
  icon: React.ComponentType<{ className?: string }>;
  path: string;
  color: string;
  priority: 'high' | 'medium' | 'low';
  badge?: number | string;
  loading?: boolean;
  requiresData?: boolean;
  error?: boolean;
  errorMessage?: string;
}

interface ComprehensiveQuickActionsBarProps extends React.HTMLAttributes<HTMLDivElement> {
  position?: 'bottom-right' | 'bottom-left' | 'right' | 'left';
  collapsed?: boolean;
  onToggle?: (collapsed: boolean) => void;
  disabled?: boolean;
}

export function ComprehensiveQuickActionsBar({
  className,
  position = 'bottom-right',
  collapsed: controlledCollapsed,
  onToggle,
  disabled = false,
  ...rest
}: ComprehensiveQuickActionsBarProps) {
  const { t } = useTranslation(['student', 'common']);
  const [, setLocation] = useLocation();
  const [internalCollapsed, setInternalCollapsed] = useState(true);
  const isMediumScreen = useIsMediumScreen();
  const { isAuthenticated, user } = useAuth();
  
  const collapsed = controlledCollapsed !== undefined ? controlledCollapsed : internalCollapsed;
  const isControlled = controlledCollapsed !== undefined;

  // Real-time data fetching with React Query for dynamic badges - auth-aware
  const { data: upcomingSessions = [], isLoading: sessionsLoading, error: sessionsError, refetch: refetchSessions } = useQuery({
    queryKey: [API_ENDPOINTS.student.upcomingSessions],
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 2 * 60 * 1000, // 2 minutes
    refetchInterval: isAuthenticated ? 5 * 60 * 1000 : false, // Only refetch when authenticated
  });

  const { data: assignments = [], isLoading: assignmentsLoading, error: assignmentsError, refetch: refetchAssignments } = useQuery({
    queryKey: [API_ENDPOINTS.student.assignments], // Fixed endpoint mismatch
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    refetchInterval: isAuthenticated ? 10 * 60 * 1000 : false, // Only refetch when authenticated
  });

  const { data: conversations = [], isLoading: conversationsLoading, error: conversationsError, refetch: refetchConversations } = useQuery({
    queryKey: [API_ENDPOINTS.student.conversations],
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 1 * 60 * 1000, // 1 minute
    refetchInterval: isAuthenticated ? 2 * 60 * 1000 : false, // Only refetch when authenticated
  });

  const { data: studentStats, isLoading: statsLoading, error: statsError, refetch: refetchStats } = useQuery({
    queryKey: [API_ENDPOINTS.student.dashboardStats],
    enabled: isAuthenticated, // Only fetch when authenticated
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchInterval: isAuthenticated ? 15 * 60 * 1000 : false, // Only refetch when authenticated
  });

  // Calculate badge counts with error handling
  const pendingAssignments = isAuthenticated && !assignmentsError && Array.isArray(assignments) ? assignments.filter((a: any) => a.status === 'pending').length : 0;
  const todaysSessions = isAuthenticated && !sessionsError && Array.isArray(upcomingSessions) ? upcomingSessions.filter((s: any) => {
    const sessionDate = new Date(s.scheduledAt);
    const today = new Date();
    return sessionDate.toDateString() === today.toDateString();
  }).length : 0;
  const unreadMessages = isAuthenticated && !conversationsError && Array.isArray(conversations) ? conversations.filter((c: any) => c.unreadCount > 0).reduce((total: number, c: any) => total + c.unreadCount, 0) : 0;

  // Define all 8 required quick actions with real functionality and error handling
  const quickActions: QuickAction[] = [
    {
      id: 'callern-session',
      label: 'Quick Callern Session',
      shortLabel: 'Video Call',
      icon: Video,
      path: '/callern',
      color: 'from-red-500 to-pink-500',
      priority: 'high',
      badge: !isAuthenticated ? undefined : todaysSessions > 0 ? `${todaysSessions} today` : undefined,
      loading: isAuthenticated && sessionsLoading,
      requiresData: true,
      error: isAuthenticated && !!sessionsError,
      errorMessage: sessionsError ? 'Failed to load sessions' : undefined
    },
    {
      id: 'ai-conversation',
      label: 'AI Conversation',
      shortLabel: 'AI Practice',
      icon: Brain,
      path: '/student/AIConversation',
      color: 'from-purple-500 to-indigo-500',
      priority: 'high'
    },
    {
      id: 'messages',
      label: 'Messages',
      shortLabel: 'Messages',
      icon: MessageSquare,
      path: '/student/messages',
      color: 'from-blue-500 to-cyan-500',
      priority: 'high',
      badge: !isAuthenticated ? undefined : unreadMessages > 0 ? unreadMessages : undefined,
      loading: isAuthenticated && conversationsLoading,
      requiresData: true,
      error: isAuthenticated && !!conversationsError,
      errorMessage: conversationsError ? 'Failed to load messages' : undefined
    },
    {
      id: 'upcoming-sessions',
      label: 'Upcoming Sessions',
      shortLabel: 'Sessions',
      icon: Calendar,
      path: '/student/sessions',
      color: 'from-green-500 to-teal-500',
      priority: 'medium',
      badge: !isAuthenticated ? undefined : Array.isArray(upcomingSessions) && upcomingSessions.length > 0 ? upcomingSessions.length : undefined,
      loading: isAuthenticated && sessionsLoading,
      requiresData: true,
      error: isAuthenticated && !!sessionsError,
      errorMessage: sessionsError ? 'Failed to load sessions' : undefined
    },
    {
      id: 'homework-hub',
      label: 'Homework Hub',
      shortLabel: 'Homework',
      icon: BookOpen,
      path: '/student/homework',
      color: 'from-orange-500 to-yellow-500',
      priority: 'medium',
      badge: !isAuthenticated ? undefined : pendingAssignments > 0 ? pendingAssignments : undefined,
      loading: isAuthenticated && assignmentsLoading,
      requiresData: true,
      error: isAuthenticated && !!assignmentsError,
      errorMessage: assignmentsError ? 'Failed to load assignments' : undefined
    },
    {
      id: 'progress-check',
      label: 'Progress Check',
      shortLabel: 'Progress',
      icon: TrendingUp,
      path: '/student/progress',
      color: 'from-indigo-500 to-blue-500',
      priority: 'medium',
      loading: isAuthenticated && statsLoading,
      error: isAuthenticated && !!statsError,
      errorMessage: statsError ? 'Failed to load progress' : undefined
    },
    {
      id: 'pronunciation-practice',
      label: 'Pronunciation Practice',
      shortLabel: 'Speaking',
      icon: Mic,
      path: '/pronunciation-practice',
      color: 'from-teal-500 to-green-500',
      priority: 'low'
    },
    {
      id: 'emergency-help',
      label: 'Emergency Help',
      shortLabel: 'Help',
      icon: HelpCircle,
      path: '/student/help',
      color: 'from-red-600 to-red-500',
      priority: 'low'
    }
  ];

  const handleToggleCollapse = () => {
    const newCollapsed = !collapsed;
    if (isControlled) {
      onToggle?.(newCollapsed);
    } else {
      setInternalCollapsed(newCollapsed);
    }
  };

  const handleActionClick = (action: QuickAction) => {
    if (!isAuthenticated) {
      // Redirect to login for unauthenticated users
      setLocation('/auth');
      return;
    }
    
    if (action.error) {
      // Retry failed queries
      handleRetry(action.id);
      return;
    }
    
    setLocation(action.path);
    // Auto-collapse on mobile after action
    if (!isMediumScreen && !isControlled) {
      setInternalCollapsed(true);
    }
  };

  const handleRetry = (actionId: string) => {
    switch (actionId) {
      case 'callern-session':
      case 'upcoming-sessions':
        refetchSessions();
        break;
      case 'messages':
        refetchConversations();
        break;
      case 'homework-hub':
        refetchAssignments();
        break;
      case 'progress-check':
        refetchStats();
        break;
    }
  };

  // Position calculations
  const getPositionClasses = () => {
    const base = "fixed z-50";
    const positions = {
      'bottom-right': "bottom-4 right-4",
      'bottom-left': "bottom-4 left-4", 
      'right': "right-4 top-1/2 -translate-y-1/2",
      'left': "left-4 top-1/2 -translate-y-1/2"
    };
    return `${base} ${positions[position]}`;
  };

  const isVertical = position === 'right' || position === 'left';
  const maxVisibleActions = isMediumScreen ? 8 : 4;
  const displayedActions = quickActions.slice(0, maxVisibleActions);
  const hiddenActionsCount = Math.max(0, quickActions.length - maxVisibleActions);

  if (disabled) {
    return null;
  }

  return (
    <div className={cn(getPositionClasses(), className)} {...rest}>
      <AnimatePresence>
        {!collapsed && (
          <motion.div
            initial={{ 
              opacity: 0, 
              scale: 0.8,
              x: position.includes('right') ? 50 : position.includes('left') ? -50 : 0,
              y: position.includes('bottom') ? 50 : position.includes('top') ? -50 : 0
            }}
            animate={{ opacity: 1, scale: 1, x: 0, y: 0 }}
            exit={{ 
              opacity: 0, 
              scale: 0.8,
              x: position.includes('right') ? 50 : position.includes('left') ? -50 : 0,
              y: position.includes('bottom') ? 50 : position.includes('top') ? -50 : 0
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
            className="mb-4"
          >
            <Card className="bg-white/95 backdrop-blur-xl border border-blue-100 shadow-2xl">
              <CardContent className="p-3">
                <div className={cn(
                  "grid gap-2",
                  isVertical 
                    ? "grid-cols-1 max-w-[200px]" 
                    : isMediumScreen 
                      ? "grid-cols-4 max-w-[400px]" 
                      : "grid-cols-2 max-w-[200px]"
                )}>
                  {displayedActions.map((action) => {
                    const Icon = action.icon;
                    const hasNotification = !!action.badge;
                    const isLoading = action.loading && action.requiresData;
                    const hasError = action.error;
                    const requiresAuth = action.requiresData && !isAuthenticated;
                    
                    return (
                      <Button
                        key={action.id}
                        variant="ghost"
                        size="sm"
                        className={cn(
                          "relative h-16 flex-col gap-1 hover:scale-105 active:scale-95 transition-all duration-200",
                          "bg-gradient-to-r hover:shadow-lg",
                          hasError ? "from-red-500 to-red-600" : requiresAuth ? "from-gray-400 to-gray-500" : action.color,
                          "text-white hover:text-white border-0",
                          isLoading && "cursor-wait",
                          hasError && "cursor-pointer",
                          requiresAuth && "opacity-75"
                        )}
                        onClick={() => !isLoading && handleActionClick(action)}
                        disabled={isLoading}
                        data-testid={`quick-action-${action.id}`}
                        aria-label={`${action.label}${hasNotification ? ` (${action.badge} notifications)` : ''}${hasError ? ' (Click to retry)' : ''}${requiresAuth ? ' (Sign in required)' : ''}`}
                        title={hasError ? `${action.errorMessage} - Click to retry` : requiresAuth ? 'Sign in required' : undefined}
                      >
                        <div className="relative">
                          {isLoading ? (
                            <Loader2 className="h-5 w-5 animate-spin" />
                          ) : hasError ? (
                            <AlertCircle className="h-5 w-5" />
                          ) : requiresAuth ? (
                            <LogIn className="h-5 w-5" />
                          ) : (
                            <Icon className="h-5 w-5" />
                          )}
                          
                          {hasNotification && !isLoading && !hasError && !requiresAuth && (
                            <Badge 
                              className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center bg-red-500 text-white text-xs font-bold animate-pulse"
                              data-testid={`badge-${action.id}`}
                            >
                              {action.badge}
                            </Badge>
                          )}
                          
                          {hasError && (
                            <Badge 
                              className="absolute -top-2 -right-2 h-4 w-4 flex items-center justify-center bg-red-600 text-white text-xs font-bold"
                              data-testid={`error-badge-${action.id}`}
                            >
                              !
                            </Badge>
                          )}
                        </div>
                        
                        <span className="text-xs font-medium text-center leading-tight">
                          {hasError ? 'Retry' : requiresAuth ? 'Sign In' : isMediumScreen ? action.label : (action.shortLabel || action.label)}
                        </span>
                      </Button>
                    );
                  })}
                  
                  {hiddenActionsCount > 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-16 flex-col gap-1 bg-gradient-to-r from-gray-400 to-gray-500 text-white hover:text-white hover:from-gray-500 hover:to-gray-600 transition-all duration-200"
                      onClick={() => {
                        // Could expand to show more actions or navigate to a full actions page
                        setLocation('/student/actions');
                      }}
                      data-testid="quick-action-more"
                    >
                      <div className="relative">
                        <User className="h-5 w-5" />
                        <Badge className="absolute -top-2 -right-2 h-5 min-w-5 flex items-center justify-center bg-blue-500 text-white text-xs font-bold">
                          +{hiddenActionsCount}
                        </Badge>
                      </div>
                      <span className="text-xs font-medium">More</span>
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Main toggle button */}
      <motion.div
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.9 }}
        transition={{ duration: 0.1 }}
      >
        <Button
          size="lg"
          className={cn(
            "relative h-16 w-16 rounded-full shadow-2xl border-0",
            "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700",
            "text-white transition-all duration-300",
            collapsed && "hover:scale-110"
          )}
          onClick={handleToggleCollapse}
          data-testid="quick-actions-toggle"
          aria-label={collapsed ? "Open quick actions" : "Close quick actions"}
          aria-expanded={!collapsed}
        >
          <AnimatePresence mode="wait">
            {collapsed ? (
              <motion.div
                key="collapsed"
                initial={{ opacity: 0, rotate: -180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 180 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <Zap className="h-7 w-7" />
              </motion.div>
            ) : (
              <motion.div
                key="expanded"
                initial={{ opacity: 0, rotate: 180 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: -180 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center"
              >
                <X className="h-6 w-6" />
              </motion.div>
            )}
          </AnimatePresence>
          
          {/* Global notification indicator - only show when authenticated */}
          {isAuthenticated && (unreadMessages > 0 || pendingAssignments > 0 || todaysSessions > 0) && collapsed && (
            <motion.div
              animate={{ scale: [1, 1.2, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="absolute -top-1 -right-1 h-4 w-4 bg-red-500 rounded-full border-2 border-white"
              data-testid="global-notification-indicator"
            />
          )}
          
          {/* Authentication indicator */}
          {!isAuthenticated && collapsed && (
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 1.5, repeat: Infinity }}
              className="absolute -top-1 -right-1 h-4 w-4 bg-gray-500 rounded-full border-2 border-white flex items-center justify-center"
              data-testid="auth-required-indicator"
            >
              <LogIn className="h-2 w-2 text-white" />
            </motion.div>
          )}
        </Button>
      </motion.div>

      {/* Accessibility: Screen reader announcements for dynamic content */}
      <div className="sr-only" aria-live="polite" data-testid="accessibility-announcements">
        {!isAuthenticated && "Sign in required to access quick actions"}
        {isAuthenticated && unreadMessages > 0 && `${unreadMessages} unread messages`}
        {isAuthenticated && pendingAssignments > 0 && `${pendingAssignments} pending assignments`}
        {isAuthenticated && todaysSessions > 0 && `${todaysSessions} sessions today`}
        {(sessionsError || conversationsError || assignmentsError || statsError) && "Some data failed to load. Click to retry."}
      </div>
    </div>
  );
}