import { useState } from "react";
import { WelcomeSection } from "@/components/dashboard/welcome-section";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { UpcomingSessions } from "@/components/dashboard/upcoming-sessions";
import { CourseProgress } from "@/components/dashboard/course-progress";
import { AIAssistant } from "@/components/dashboard/ai-assistant";
import { TutorMarketplace } from "@/components/dashboard/tutor-marketplace";
import { RecentMessages } from "@/components/dashboard/recent-messages";
import { HomeworkTasks } from "@/components/dashboard/homework-tasks";
import { PaymentCredits } from "@/components/dashboard/payment-credits";
import { Sidebar } from "@/components/layout/sidebar";
import { Navigation } from "@/components/layout/navigation";
import { useTheme } from "@/hooks/use-theme";
import AICompanion from "@/components/ai-companion";
import { Button } from "@/components/ui/button";
import { Trophy } from "lucide-react";
import { Link } from "wouter";

export default function DemoDashboard() {
  const { theme } = useTheme();
  const [companionVisible, setCompanionVisible] = useState(false);

  // Mock user data for demo
  const mockUser = {
    id: 1,
    email: "ahmad.rezaei@example.com",
    firstName: "Ahmad",
    lastName: "Rezaei",
    role: "student",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&h=150&fit=crop&crop=face",
    credits: 12,
    streakDays: 15,
    totalLessons: 45,
    preferences: { theme: "light", language: "en", notifications: true }
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'dark' : ''}`}>
      {/* Progress Button - Fixed Position */}
      <div className="fixed top-4 right-4 z-50">
        <Link href="/progress">
          <Button size="lg" className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white shadow-lg">
            <Trophy className="h-5 w-5 mr-2" />
            My Progress
          </Button>
        </Link>
      </div>
      
      <div className="flex min-h-screen bg-gray-50 dark:bg-gray-900">
        <Sidebar user={mockUser} />
        
        <div className="flex-1 flex flex-col">
          <Navigation user={mockUser} />
          
          <main className="flex-1 p-6 overflow-auto">
            <div className="max-w-7xl mx-auto space-y-6">
              <WelcomeSection user={mockUser} />
              <StatsCards />
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2 space-y-6">
                  <UpcomingSessions />
                  <CourseProgress />
                  <HomeworkTasks />
                </div>
                
                <div className="space-y-6">
                  <AIAssistant />
                  <TutorMarketplace />
                  <RecentMessages />
                  <PaymentCredits />
                </div>
              </div>
            </div>
          </main>
        </div>
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