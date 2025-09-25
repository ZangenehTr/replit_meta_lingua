import { useState, useCallback } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useTranslation } from "react-i18next";
import { motion } from "framer-motion";
import { 
  BookOpen, 
  Calendar, 
  Target, 
  Trophy,
  Settings,
  Bell,
  User,
  ChevronRight,
  Play,
  CheckCircle2,
  Clock,
  AlertCircle,
  Video,
  Phone,
  Mail,
  MessageCircle,
  Bookmark
} from "lucide-react";

import { useLanguage } from "@/hooks/useLanguage";
import useScrollRestoration from "@/hooks/useScrollRestoration";
import { useHapticFeedback } from "@/components/ui/haptic-feedback";

// Progressive disclosure components
import { CollapsibleSection } from "@/components/ui/collapsible-section";
import { ExpandableCard } from "@/components/ui/expandable-card";
import { ExpandableList } from "@/components/ui/expandable-list";
import { BottomSheet } from "@/components/ui/bottom-sheet";
import { PullToRefresh } from "@/components/ui/pull-to-refresh";
import { EnhancedSkeleton, SkeletonCard, SkeletonList, SkeletonWidget } from "@/components/ui/enhanced-skeleton";

// Existing components
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Widgets with progressive disclosure
import { 
  ProgressiveAssignmentsWidget,
  ProgressiveSessionsWidget,
  GamificationWidget,
  LearningProgressWidget,
  AchievementWidget
} from "@/components/student/widgets";

// API schemas for validation
import { 
  notificationsResponseSchema, 
  notificationCountSchema,
  type Notification,
  type NotificationCount
} from "@/types/api-schemas";

interface Props {
  user: any;
  compact?: boolean;
}

export function MobileOptimizedDashboard({ user, compact = false }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const triggerHaptic = useHapticFeedback();
  const { containerRef } = useScrollRestoration('mobile-dashboard');

  const [showBottomSheet, setShowBottomSheet] = useState(false);
  const queryClient = useQueryClient();

  // Real API data fetching with React Query
  const { data: notifications = [], isLoading: notificationsLoading, error: notificationsError, refetch: refetchNotifications } = useQuery({
    queryKey: ['/api/notifications'],
    staleTime: 30000, // 30 seconds
    select: (data) => {
      try {
        return notificationsResponseSchema.parse(data);
      } catch (error) {
        console.error('Notification data validation failed:', error);
        return [];
      }
    }
  });

  const { data: notificationCount, isLoading: countLoading } = useQuery<NotificationCount>({
    queryKey: ['/api/notifications/count'],
    staleTime: 30000,
    select: (data) => {
      try {
        return notificationCountSchema.parse(data);
      } catch (error) {
        console.error('Notification count validation failed:', error);
        return { total: 0, unread: 0, unreadByCategory: {} };
      }
    }
  });

  // Real quick actions based on available functionality
  const quickActions = [
    {
      id: 'sessions',
      title: 'My Sessions',
      description: 'View upcoming and past sessions',
      icon: Calendar,
      color: 'from-green-500 to-green-600',
      path: '/student/sessions'
    },
    {
      id: 'courses',
      title: 'My Courses',
      description: 'Access your enrolled courses',
      icon: BookOpen,
      color: 'from-blue-500 to-blue-600',
      path: '/student/courses'
    },
    {
      id: 'progress',
      title: 'Progress Review',
      description: 'Check your learning progress',
      icon: Trophy,
      color: 'from-purple-500 to-purple-600',
      path: '/student/progress'
    },
    {
      id: 'support',
      title: 'Get Support',
      description: 'Contact support team',
      icon: MessageCircle,
      color: 'from-orange-500 to-orange-600',
      action: () => setShowBottomSheet(true)
    }
  ];

  // Real refresh functionality
  const refreshMutation = useMutation({
    mutationFn: async () => {
      // Refresh all relevant data
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['/api/notifications'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/notifications/count'] }),
        queryClient.invalidateQueries({ queryKey: ['/api/dashboard'] })
      ]);
      return { success: true, timestamp: new Date().toISOString() };
    },
    onSuccess: () => {
      triggerHaptic('success');
    },
    onError: (error) => {
      console.error('Refresh failed:', error);
      triggerHaptic('error');
    }
  });

  const handleRefresh = useCallback(async () => {
    triggerHaptic('light');
    await refreshMutation.mutateAsync();
  }, [triggerHaptic, refreshMutation]);

  const handleQuickAction = useCallback((action: any) => {
    triggerHaptic('medium');
    
    if (action.path) {
      // Navigate to the specified path
      window.location.href = action.path;
    } else if (action.action) {
      // Execute the action function
      action.action();
    }
  }, [triggerHaptic]);

  const formatTimeAgo = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);
    
    if (diffInSeconds < 60) return 'Just now';
    if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)} minutes ago`;
    if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)} hours ago`;
    return `${Math.floor(diffInSeconds / 86400)} days ago`;
  };

  const renderNotificationItem = (notification: Notification, index: number) => (
    <div 
      key={notification.id}
      className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 hover:bg-muted/50 touch-target ${
        !notification.isRead ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
      }`}
      onClick={() => triggerHaptic('light')}
    >
      <div className={`w-2 h-2 rounded-full ${
        !notification.isRead ? 'bg-blue-500' : 'bg-muted'
      }`} />
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${
          !notification.isRead ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {formatTimeAgo(notification.createdAt)}
        </p>
      </div>
      
      <Badge variant={notification.isRead ? 'secondary' : 'default'} className="text-xs">
        {notification.category}
      </Badge>
    </div>
  );

  const renderQuickActionCard = (action: any, index: number) => (
    <Card 
      key={action.id}
      className="touch-target cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
      onClick={() => handleQuickAction(action)}
    >
      <CardContent className={compact ? "p-3" : "p-4"}>
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 rounded-lg bg-gradient-to-r ${action.color} flex items-center justify-center`}>
            <action.icon className="h-5 w-5 text-white" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className={`font-medium ${compact ? 'text-sm' : 'text-base'} truncate`}>
              {action.title}
            </h4>
            <p className={`text-muted-foreground ${compact ? 'text-xs' : 'text-sm'} line-clamp-2`}>
              {action.description}
            </p>
          </div>
          <ChevronRight className="h-4 w-4 text-muted-foreground" />
        </div>
      </CardContent>
    </Card>
  );

  if (notificationsLoading) {
    return (
      <div ref={containerRef} className="space-y-6 p-4">
        <SkeletonWidget compact={compact} />
        <SkeletonList items={3} compact={compact} />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <SkeletonCard compact={compact} />
          <SkeletonCard compact={compact} />
        </div>
        <SkeletonWidget compact={compact} />
      </div>
    );
  }

  return (
    <PullToRefresh
      onRefresh={handleRefresh}
      className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
    >
      <div 
        ref={containerRef}
        className={`${isRTL ? 'rtl' : 'ltr'} space-y-6 p-4`}
      >
        {/* Header with User Info */}
        <motion.div
          initial={{ y: -20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          className="bg-white rounded-xl shadow-sm border p-4"
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Avatar className="w-12 h-12">
                <AvatarImage src={user?.avatar} />
                <AvatarFallback className="bg-gradient-to-r from-blue-500 to-indigo-500 text-white">
                  {user?.firstName?.[0]}{user?.lastName?.[0]}
                </AvatarFallback>
              </Avatar>
              <div>
                <h2 className="font-semibold text-lg">
                  Welcome back, {user?.firstName}!
                </h2>
                <p className="text-sm text-muted-foreground">
                  Ready for today's learning session?
                </p>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Button 
                variant="ghost" 
                size="icon"
                className="touch-target"
                onClick={() => setShowBottomSheet(true)}
              >
                <Bell className="h-5 w-5" />
              </Button>
              <Button 
                variant="ghost" 
                size="icon"
                className="touch-target"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Quick Actions Grid */}
        <CollapsibleSection
          title="Quick Actions"
          icon={Target}
          compact={compact}
          defaultOpen={true}
          className="bg-white"
        >
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {quickActions.map((action, index) => 
              renderQuickActionCard(action, index)
            )}
          </div>
        </CollapsibleSection>

        {/* Progressive Widgets */}
        <div className="space-y-4">
          <ProgressiveAssignmentsWidget
            compact={compact}
            progressive={true}
            initialVisible={2}
          />
          
          <ProgressiveSessionsWidget
            compact={compact}
            progressive={true}
            initialVisible={2}
          />
        </div>

        {/* Traditional Widgets with Compact Support */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          <GamificationWidget compact={compact} />
          <LearningProgressWidget compact={compact} />
        </div>

        {/* Expandable Achievements Section */}
        <ExpandableCard
          title="Recent Achievements"
          description="Your latest learning milestones"
          icon={Trophy}
          compact={compact}
          className="bg-white"
          expandedContent={
            <div className="space-y-3">
              <AchievementWidget compact={compact} maxDisplay={6} />
              <div className="text-center pt-2">
                <Button variant="outline" size="sm" className="touch-target">
                  View All Achievements
                </Button>
              </div>
            </div>
          }
        >
          <AchievementWidget compact={compact} maxDisplay={3} />
        </ExpandableCard>

        {/* Notifications with Progressive Disclosure */}
        <CollapsibleSection
          title="Recent Notifications"
          icon={Bell}
          badge={
            <Badge variant="secondary" className="ml-2">
              {notificationCount?.unread || 0} new
            </Badge>
          }
          compact={compact}
          className="bg-white"
        >
          {notificationsError ? (
            <div className="text-center p-4 text-muted-foreground">
              <AlertCircle className="mx-auto h-8 w-8 mb-2" />
              <p>Failed to load notifications</p>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchNotifications()}
                className="mt-2"
              >
                Retry
              </Button>
            </div>
          ) : (
            <ExpandableList
              items={notifications}
              initialVisibleCount={3}
              renderItem={renderNotificationItem}
              variant="default"
              compact={compact}
              showCounter={true}
              animationDuration={300}
              animationStagger={50}
            />
          )}
        </CollapsibleSection>

      </div>

      {/* Bottom Sheet for Notifications */}
      <BottomSheet
        open={showBottomSheet}
        onOpenChange={setShowBottomSheet}
        title="Notifications"
        description="Stay updated with your learning progress"
        snapPoints={[0.5, 0.9]}
        defaultSnapPoint={0.5}
      >
        <div className="p-4 space-y-3">
          {notifications.map((notification, index) => 
            renderNotificationItem(notification, index)
          )}
          
          <div className="flex gap-2 pt-4 border-t">
            <Button 
              variant="outline" 
              className="flex-1 touch-target"
              onClick={() => setShowBottomSheet(false)}
            >
              Mark All Read
            </Button>
            <Button 
              className="flex-1 touch-target"
              onClick={() => setShowBottomSheet(false)}
            >
              Close
            </Button>
          </div>
        </div>
      </BottomSheet>
    </PullToRefresh>
  );
}