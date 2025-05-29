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
      
      {/* Mobile Progress Button - Repositioned for mobile */}
      <div className="fixed top-4 right-4 z-50 md:top-6 md:right-6">
        <Link href="/progress">
          <Button 
            size="sm" 
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg text-xs md:text-sm px-2 py-1 md:px-4 md:py-2"
          >
            <Trophy className="h-4 w-4 md:h-5 md:w-5 mr-1 md:mr-2" />
            <span className="hidden sm:inline">
              {currentLanguage === 'fa' ? 'پیشرفت من' : 'My Progress'}
            </span>
            <span className="sm:hidden">
              {currentLanguage === 'fa' ? 'پیشرفت' : 'Progress'}
            </span>
          </Button>
        </Link>
      </div>
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-2 md:p-6 lg:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <WelcomeSection />
            
            {/* Mobile Gamification Widget */}
            <div className="md:hidden">
              <MobileGamificationWidget />
            </div>
            
            {/* Enhanced Gamification Section */}
            <div className="mb-6">
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-3 mb-4">
                  <TabsTrigger value="overview" className="text-xs md:text-sm">
                    <Star className="h-4 w-4 mr-1" />
                    {currentLanguage === 'fa' ? 'نمای کلی' : 'Overview'}
                  </TabsTrigger>
                  <TabsTrigger value="challenges" className="text-xs md:text-sm">
                    <Target className="h-4 w-4 mr-1" />
                    {currentLanguage === 'fa' ? 'چالش‌ها' : 'Challenges'}
                  </TabsTrigger>
                  <TabsTrigger value="leaderboard" className="text-xs md:text-sm">
                    <Users className="h-4 w-4 mr-1" />
                    {currentLanguage === 'fa' ? 'رتبه‌بندی' : 'Leaderboard'}
                  </TabsTrigger>
                </TabsList>
                
                <TabsContent value="overview" className="space-y-4">
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-3 md:gap-6 w-full">
              {/* Main Content Area */}
              <div className="lg:col-span-1 xl:col-span-2 space-y-3 md:space-y-6">
                <LiveClassroom />
                <CourseProgress />
                <AIAssistant />
                <TutorMarketplace />
              </div>

              {/* Sidebar Content */}
              <div className="space-y-3 md:space-y-6">
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
