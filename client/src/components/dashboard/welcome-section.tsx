import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/use-auth";

export function WelcomeSection() {
  const { user } = useAuth();

  if (!user) return null;

  return (
    <Card className="mb-8 bg-gradient-to-r from-primary to-purple-600 text-white">
      <CardContent className="p-6">
        <h2 className="text-2xl font-bold mb-2">
          Welcome back, {user.firstName}! 🌟
        </h2>
        <p className="text-blue-100 mb-4">
          Ready to continue your language learning journey?
        </p>
        <div className="flex items-center space-x-6">
          <div className="text-center">
            <div className="text-2xl font-bold">{user.streakDays}</div>
            <div className="text-sm text-blue-100">Day Streak</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.totalLessons}</div>
            <div className="text-sm text-blue-100">Lessons</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold">{user.credits}</div>
            <div className="text-sm text-blue-100">Credits</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
