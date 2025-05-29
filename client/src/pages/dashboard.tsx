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
import AICompanion from "@/components/ai-companion";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, Trophy, Star, Target } from "lucide-react";
import { Link } from "wouter";

export default function Dashboard() {
  const [companionVisible, setCompanionVisible] = useState(false);

  return (
    <div className="min-h-screen bg-background">
      <Navigation />
      
      {/* Prominent Progress Button - Always Visible */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/progress">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            <Trophy className="h-5 w-5 mr-2" />
            My Progress
          </Button>
        </Link>
      </div>
      
      <div className="flex">
        <Sidebar />
        
        <main className="flex-1 ml-0 md:ml-64 p-4 md:p-8 overflow-x-hidden">
          <div className="max-w-7xl mx-auto w-full">
            <WelcomeSection />
            
            {/* Quick Access to Progress */}
            <Card className="mb-6 border-2 border-blue-500/20 bg-gradient-to-br from-blue-50/50 to-purple-50/50 dark:from-blue-950/30 dark:to-purple-950/30">
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  Your Learning Progress
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <Star className="h-4 w-4 text-blue-500" />
                      <span className="text-sm font-medium">Level 12</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Target className="h-4 w-4 text-green-500" />
                      <span className="text-sm font-medium">7 day streak</span>
                    </div>
                  </div>
                  <Link href="/progress">
                    <Button className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700">
                      <TrendingUp className="h-4 w-4 mr-2" />
                      View All Achievements
                    </Button>
                  </Link>
                </div>
              </CardContent>
            </Card>

            <StatsCards />

            <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 md:gap-8 w-full">
              {/* Main Content Area */}
              <div className="xl:col-span-2 space-y-4 md:space-y-8">
                <LiveClassroom />
                <CourseProgress />
                <AIAssistant />
                <TutorMarketplace />
              </div>

              {/* Sidebar Content */}
              <div className="space-y-4 md:space-y-8">
                <UpcomingSessions />
                <RecentMessages />
                <HomeworkTasks />
                <PaymentCredits />
              </div>
            </div>
          </div>
        </main>
      </div>
      
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
