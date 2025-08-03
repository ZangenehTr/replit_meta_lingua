import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';

export function WelcomeSection() {
  const { t } = useTranslation(['student', 'common']);
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="mb-4 sm:mb-6 md:mb-8 bg-gradient-to-r from-primary to-purple-600 text-white">
      <CardContent className="p-3 sm:p-4 md:p-6">
        <h2 className="text-lg sm:text-xl md:text-2xl font-bold mb-1 sm:mb-2">
          Welcome back, {user.firstName}! 🌟
        </h2>
        <p className="text-blue-100 mb-3 sm:mb-4 text-sm sm:text-base">
          Continue your Persian learning journey today
        </p>
        <div className="flex items-center justify-between sm:justify-start sm:space-x-4 md:space-x-6">
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{user.streakDays || 0}</div>
            <div className="text-xs sm:text-sm text-blue-100">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{user.totalLessons || 0}</div>
            <div className="text-xs sm:text-sm text-blue-100">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-lg sm:text-xl md:text-2xl font-bold">{user.credits || 0}</div>
            <div className="text-xs sm:text-sm text-blue-100">Credits</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
