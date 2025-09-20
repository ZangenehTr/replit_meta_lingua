import { DashboardHeader } from "./components/DashboardHeader";
import { PlacementTestCard } from "./components/PlacementTestCard";
import { MyClasses } from "./components/MyClasses";
import { SocialLearning } from "./components/SocialLearning";
import { SpecialCourses } from "./components/SpecialCourses";
import { OnlineTeachers } from "./components/OnlineTeachers";
import { RecentAchievements } from "./components/RecentAchievements";
import { SkillProgress } from "./components/SkillProgress";
import { QuickShortcuts } from "./components/QuickShortcuts";
import { CallerNStatus } from "./components/CallerNStatus";
import { DailyChallenge } from "./components/DailyChallenge";
import { MainNavigation } from "./components/MainNavigation";

export default function App() {
  return (
    <div className="min-h-screen pb-40">
      <DashboardHeader />
      
      <main className="px-4 space-y-6 max-w-md mx-auto">
        {/* Placement Test Section */}
        <PlacementTestCard />

        {/* My Classes Section */}
        <MyClasses />

        {/* Social Learning Section */}
        <SocialLearning />

        {/* Special Courses Section */}
        <SpecialCourses />

        {/* Online Teachers Section */}
        <OnlineTeachers />

        {/* Recent Achievements Section */}
        <RecentAchievements />

        {/* Skill Progress Section */}
        <SkillProgress />

        {/* Quick Shortcuts Section */}
        <QuickShortcuts />

        {/* CallerN Status Section */}
        <CallerNStatus />

        {/* Daily Challenge Section */}
        <DailyChallenge />

        {/* Extra Bottom Padding for Lower Navigation */}
        <div className="h-16"></div>
      </main>
      
      <MainNavigation />
    </div>
  );
}