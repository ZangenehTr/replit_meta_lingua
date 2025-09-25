import { useState, useCallback } from "react";
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
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadingDemo, setLoadingDemo] = useState(false);

  // Demo data for showcasing progressive disclosure
  const demoNotifications = [
    {
      id: 1,
      title: "New Assignment: Essay Writing",
      message: "Complete your essay on Environmental Issues by Friday",
      type: "assignment",
      time: "2 hours ago",
      read: false
    },
    {
      id: 2,
      title: "Session Reminder",
      message: "Live conversation practice with Sarah starts in 30 minutes",
      type: "session",
      time: "30 minutes ago",
      read: false
    },
    {
      id: 3,
      title: "Achievement Unlocked!",
      message: "You've completed 10 consecutive days of practice",
      type: "achievement",
      time: "1 day ago",
      read: true
    },
    {
      id: 4,
      title: "Course Progress Update",
      message: "You're now 75% through Intermediate English",
      type: "progress",
      time: "2 days ago",
      read: true
    },
    {
      id: 5,
      title: "Payment Successful",
      message: "Your monthly subscription has been renewed",
      type: "payment",
      time: "3 days ago",
      read: true
    }
  ];

  const demoQuickActions = [
    {
      id: 'practice',
      title: 'Quick Practice',
      description: 'Start a 5-minute vocabulary drill',
      icon: Play,
      color: 'from-blue-500 to-blue-600'
    },
    {
      id: 'book-session',
      title: 'Book Session',
      description: 'Schedule your next live lesson',
      icon: Calendar,
      color: 'from-green-500 to-green-600'
    },
    {
      id: 'review',
      title: 'Review Progress',
      description: 'Check your weekly performance',
      icon: Trophy,
      color: 'from-purple-500 to-purple-600'
    },
    {
      id: 'contact',
      title: 'Get Help',
      description: 'Contact your instructor',
      icon: MessageCircle,
      color: 'from-orange-500 to-orange-600'
    }
  ];

  const handleRefresh = useCallback(async () => {
    setIsRefreshing(true);
    triggerHaptic('light');
    
    // Simulate API refresh
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setIsRefreshing(false);
    triggerHaptic('success');
  }, [triggerHaptic]);

  const handleQuickAction = useCallback((actionId: string) => {
    triggerHaptic('medium');
    
    switch (actionId) {
      case 'practice':
        console.log('Starting quick practice...');
        break;
      case 'book-session':
        setShowBottomSheet(true);
        break;
      case 'review':
        console.log('Opening progress review...');
        break;
      case 'contact':
        console.log('Opening contact options...');
        break;
    }
  }, [triggerHaptic]);

  const renderNotificationItem = (notification: any, index: number) => (
    <div 
      key={notification.id}
      className={`flex items-center gap-3 p-3 border rounded-lg transition-all duration-200 hover:bg-muted/50 touch-target ${
        !notification.read ? 'bg-blue-50/50 border-blue-200' : 'bg-background'
      }`}
      onClick={() => triggerHaptic('light')}
    >
      <div className={`w-2 h-2 rounded-full ${
        !notification.read ? 'bg-blue-500' : 'bg-muted'
      }`} />
      
      <div className="flex-1 min-w-0">
        <p className={`font-medium text-sm truncate ${
          !notification.read ? 'text-foreground' : 'text-muted-foreground'
        }`}>
          {notification.title}
        </p>
        <p className="text-xs text-muted-foreground line-clamp-2 mt-1">
          {notification.message}
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          {notification.time}
        </p>
      </div>
      
      <Badge variant={notification.read ? 'secondary' : 'default'} className="text-xs">
        {notification.type}
      </Badge>
    </div>
  );

  const renderQuickActionCard = (action: any, index: number) => (
    <Card 
      key={action.id}
      className="touch-target cursor-pointer transition-all duration-200 hover:shadow-md hover:scale-105 active:scale-95"
      onClick={() => handleQuickAction(action.id)}
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

  if (loadingDemo) {
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
            {demoQuickActions.map((action, index) => 
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
              {demoNotifications.filter(n => !n.read).length} new
            </Badge>
          }
          compact={compact}
          className="bg-white"
        >
          <ExpandableList
            items={demoNotifications}
            initialVisibleCount={3}
            renderItem={renderNotificationItem}
            variant="default"
            compact={compact}
            showCounter={true}
            animationDuration={300}
            animationStagger={50}
          />
        </CollapsibleSection>

        {/* Demo Controls */}
        <Card className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200">
          <CardHeader>
            <CardTitle className="text-center">
              Progressive Disclosure Demo
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2 justify-center">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => setLoadingDemo(true)}
                className="touch-target"
              >
                Test Loading States
              </Button>
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => triggerHaptic('medium')}
                className="touch-target"
              >
                Test Haptic Feedback
              </Button>
            </div>
          </CardContent>
        </Card>
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
          {demoNotifications.map((notification, index) => 
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