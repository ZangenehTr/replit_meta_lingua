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
      
      {/* AI Learning Companion - Parsa */}
      <AICompanion 
        isVisible={companionVisible}
        onToggle={() => setCompanionVisible(!companionVisible)}
        studentLevel="intermediate"
        currentLesson="Persian Conversation Basics"
      />
    </div>
  );
}