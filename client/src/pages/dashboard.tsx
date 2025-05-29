import { useState } from "react";
import { Navigation } from "@/components/layout/navigation";
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
import { DailyChallenges } from "@/components/daily-challenges";
import { Leaderboard } from "@/components/leaderboard";
import { AchievementNotifications } from "@/components/achievement-notifications";
import { MobileGamificationWidget } from "@/components/mobile-gamification-widget";
import AICompanion from "@/components/ai-companion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp, Trophy, Star, Target, Users, Zap, Menu } from "lucide-react";
import { Link } from "wouter";
import { useLanguage } from "@/hooks/use-language";

export default function Dashboard() {
  const [companionVisible, setCompanionVisible] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { currentLanguage, isRTL } = useLanguage();

  return (
    <div className={`min-h-screen bg-background ${isRTL ? 'rtl' : 'ltr'}`}>
      <Navigation />
      
      {/* Mobile Progress Button - Fixed positioning */}
      <div className="fixed top-20 right-4 z-40 md:hidden">
        <Link href="/progress">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-xs px-3 py-2"
          >
            <Trophy className="h-4 w-4 mr-1" />
            <span>{currentLanguage === 'fa' ? 'پیشرفت' : 'Progress'}</span>
          </Button>
        </Link>
      </div>
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-3 sm:p-4 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <WelcomeSection />
            
            {/* Mobile Gamification Widget */}
            <div className="md:hidden mb-4">
              <MobileGamificationWidget />
            </div>
            
            {/* Enhanced Gamification Section */}
            <div className="mb-4 md:mb-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-3 md:mb-4 h-9 sm:h-10">
                  <TabsTrigger value="overview" className="text-xs sm:text-sm px-2">
                    <Star className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{currentLanguage === 'fa' ? 'نمای کلی' : 'Overview'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="text-xs sm:text-sm px-2">
                    <Target className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{currentLanguage === 'fa' ? 'چالش‌ها' : 'Challenges'}</span>
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs sm:text-sm px-2">
                    <Users className="h-3 w-3 sm:h-4 sm:w-4 mr-1" />
                    <span className="truncate">{currentLanguage === 'fa' ? 'رتبه‌بندی' : 'Leaderboard'}</span>
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-3 md:space-y-4">
                  <StatsCards />
                </TabsContent>
                
                <TabsContent value="challenges">
                  <DailyChallenges />
                </TabsContent>
                
                <TabsContent value="leaderboard">
                  <Leaderboard />
                </TabsContent>
              </Tabs>
            </div>

            {/* Mobile-Optimized Content Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4 md:gap-6 w-full">
              {/* Main Content Area */}
              <div className="lg:col-span-1 xl:col-span-2 space-y-3 sm:space-y-4 md:space-y-6">
                <LiveClassroom />
                <CourseProgress />
                <AIAssistant />
                <TutorMarketplace />
              </div>

              {/* Sidebar Content */}
              <div className="space-y-3 sm:space-y-4 md:space-y-6">
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
