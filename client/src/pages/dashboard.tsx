import { useState, useEffect } from "react";

import { Sidebar } from "@/components/layout/sidebar";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions";
import { CourseProgress } from "@/components/dashboard/course-progress";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { TutorMarketplace } from "@/components/dashboard/tutor-marketplace";
import { RecentMessages } from "@/components/dashboard/recent-messages";
import { HomeworkTasks } from "@/components/dashboard/homework-tasks";
import { PaymentCredits } from "@/components/dashboard/payment-credits";
import { LiveClassroom } from "@/components/dashboard/live-classroom";
import { AvailableCourses } from "@/components/dashboard/available-courses";
import { RecommendedCourses } from "@/components/dashboard/RecommendedCourses";
import { DailyChallenges } from "@/components/daily-challenges";
import { Leaderboard } from "@/components/leaderboard";
import { AchievementNotifications } from "@/components/achievement-notifications";
import { MobileGamificationWidget } from "@/components/mobile-gamification-widget";
import { LanguageProficiencyVisualization } from "@/components/dashboard/language-proficiency-visualization";
import AICompanion from "@/components/ai-companion";
import AIConversation from "@/pages/student/AIConversation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy, Star, Target, Users, Zap, Menu, Mic, BarChart3 } from "lucide-react";
import { Link, useLocation, Redirect } from "wouter";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/use-language";
import { useAuth } from "@/hooks/use-auth";
import { AdminDashboard as EnhancedAdminDashboard } from "@/pages/admin/admin-dashboard";

export default function Dashboard() {
  const { user } = useAuth();
  
  // DEPRECATED: This component is being replaced by UnifiedDashboard
  // This exists only for backward compatibility
  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }
  
  // This should not happen since we're using UnifiedDashboard now
  // Fallback to student dashboard for safety
  console.warn("Old dashboard.tsx accessed - should be using UnifiedDashboard");
  const [companionVisible, setCompanionVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { t } = useTranslation(['student', 'common']);
  const { language, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Mobile Progress Button - Fixed positioning */}
      <div className="fixed top-20 right-4 z-40 md:hidden">
        <Link href="/progress">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-xs px-3 py-2"
          >
            <Trophy className="h-4 w-4 mr-1" />
            <span>{t('common:navigation.progress')}</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex">
        <Sidebar />
        
        <main className={`flex-1 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden ${isRTL ? 'ml-0 md:mr-64' : 'ml-0 md:ml-64'}`}>
          <div className="max-w-7xl mx-auto w-full">
            <WelcomeSection />
            
            {/* Mobile Gamification Widget */}
            <div className="md:hidden mb-4">
              <MobileGamificationWidget />
            </div>
            
            {/* Level Assessment CTA */}
            <div className="mb-4 md:mb-6">
              <Card className="bg-gradient-to-r from-purple-500 to-blue-600 text-white border-0">
                <CardContent className="p-4 md:p-6">
                  <div className="flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="text-center md:text-left">
                      <h3 className="text-lg md:text-xl font-bold mb-2">
                        {t('student:dashboard.discoverLevel')}
                      </h3>
                      <p className="text-sm md:text-base opacity-90">
                        {t('student:dashboard.assessmentDescription')}
                      </p>
                    </div>
                    <Link href="/level-assessment">
                      <Button 
                        size="lg" 
                        className="bg-white text-purple-600 hover:bg-gray-50 font-semibold px-6 py-3"
                      >
                        <Target className="h-5 w-5 mr-2" />
                        {t('student:dashboard.whatIsMyLevel')}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Enhanced Gamification Section */}
            <div className="mb-4 md:mb-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-5 mb-3 md:mb-4 h-9 sm:h-10">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{t('student:dashboard.overview')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="proficiency" className="text-xs sm:text-sm px-2">
                    <BarChart3 className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{t('student:dashboard.skills')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="ai-practice" className="text-xs sm:text-sm px-2">
                    <Mic className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{t('student:dashboard.aiPractice')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="text-xs sm:text-sm px-2">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{t('common:gamification.challenges')}</span>
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs sm:text-sm px-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{t('common:gamification.leaderboard')}</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-3 md:space-y-4">
                  <StatsCards />
                </TabsContent>
                
                <TabsContent value="proficiency">
                  <LanguageProficiencyVisualization />
                </TabsContent>
                
                <TabsContent value="ai-practice">
                  <AIConversation />
                </TabsContent>
                
                <TabsContent value="challenges">
                  <DailyChallenges />
                </TabsContent>
                
                <TabsContent value="leaderboard">
                  <Leaderboard />
                </TabsContent>
              </Tabs>
            </div>

            {/* Responsive Content Grid for All Devices */}
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 lg:grid-cols-2 xl:grid-cols-3 gap-2 xs:gap-3 sm:gap-4 md:gap-5 lg:gap-6 w-full max-w-none">
              {/* Main Content Area - Responsive Column Spans */}
              <div className="col-span-1 md:col-span-1 lg:col-span-1 xl:col-span-2 space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                <RecommendedCourses />
                <AvailableCourses />
                <LiveClassroom />
                <CourseProgress />
                <AIAssistant />
                <TutorMarketplace />
              </div>

              {/* Sidebar Content - Mobile-First Design */}
              <div className="col-span-1 space-y-2 xs:space-y-3 sm:space-y-4 md:space-y-5 lg:space-y-6">
                <UpcomingSessions />
                <RecentMessages />
                <HomeworkTasks />
                <PaymentCredits />
              </div>
            </div>
          </div>
        </main>
      </div>
      
      {/* Achievement Notifications */}
      <AchievementNotifications />
      
      {/* AI Learning Companion - Lexi */}
      <AICompanion 
        isVisible={companionVisible}
        onToggle={() => setCompanionVisible(!companionVisible)}
        studentLevel="intermediate"
        currentLesson="Persian Conversation Basics"
      />
    </div>
  );
}
