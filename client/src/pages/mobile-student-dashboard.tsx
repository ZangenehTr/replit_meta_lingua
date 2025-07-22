import React from "react";
import { useQuery } from "@tanstack/react-query";
import { MobileCard, MobileCardContent, MobileCardHeader, MobileCardTitle } from "@/components/ui/mobile-card";
import { MobileButton } from "@/components/ui/mobile-button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useLocation } from "wouter";
import { 
  BookOpen, 
  Trophy, 
  Target, 
  Clock, 
  Play,
  MessageSquare,
  Calendar,
  Award,
  TrendingUp,
  CheckCircle,
  AlertCircle,
  Star,
  Flame,
  Zap
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StudentStats {
  currentLevel: string;
  xp: number;
  nextLevelXp: number;
  streak: number;
  completedLessons: number;
  totalLessons: number;
  weeklyGoal: number;
  weeklyProgress: number;
  achievements: Array<{
    id: string;
    title: string;
    description: string;
    icon: string;
    unlockedAt?: string;
  }>;
  upcomingClasses: Array<{
    id: string;
    title: string;
    teacher: string;
    time: string;
    type: "online" | "in-person";
  }>;
  assignments: Array<{
    id: string;
    title: string;
    dueDate: string;
    status: "pending" | "submitted" | "graded";
    score?: number;
  }>;
}

// Gamification Widget
const GamificationWidget = ({ 
  level, 
  xp, 
  nextLevelXp, 
  streak 
}: {
  level: string;
  xp: number;
  nextLevelXp: number;
  streak: number;
}) => {
  const progress = (xp / nextLevelXp) * 100;

  return (
    <MobileCard variant="elevated" role="student" className="bg-gradient-to-br from-blue-50 to-purple-50">
      <MobileCardContent>
        <div className="space-y-4">
          {/* Level and XP */}
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-xl font-bold text-blue-700">{level}</h3>
              <p className="text-sm text-muted-foreground">{xp} / {nextLevelXp} XP</p>
            </div>
            <div className="flex items-center space-x-2">
              <Flame className="h-5 w-5 text-orange-500" />
              <span className="font-bold text-orange-600">{streak}</span>
              <span className="text-sm text-muted-foreground">streak</span>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="space-y-2">
            <Progress value={progress} className="h-2" />
            <p className="text-xs text-center text-muted-foreground">
              {nextLevelXp - xp} XP to next level
            </p>
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

// Learning Progress Card
const LearningProgressCard = ({ 
  completedLessons, 
  totalLessons, 
  weeklyGoal, 
  weeklyProgress 
}: {
  completedLessons: number;
  totalLessons: number;
  weeklyGoal: number;
  weeklyProgress: number;
}) => {
  const overallProgress = (completedLessons / totalLessons) * 100;
  const weeklyProgressPercent = (weeklyProgress / weeklyGoal) * 100;

  return (
    <MobileCard variant="default">
      <MobileCardHeader>
        <MobileCardTitle className="flex items-center gap-2">
          <TrendingUp className="h-5 w-5 text-green-500" />
          Learning Progress
        </MobileCardTitle>
      </MobileCardHeader>
      <MobileCardContent>
        <div className="space-y-4">
          {/* Overall Progress */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Course Progress</span>
              <span>{completedLessons}/{totalLessons} lessons</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Weekly Goal */}
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span>Weekly Goal</span>
              <span>{weeklyProgress}/{weeklyGoal} lessons</span>
            </div>
            <Progress value={weeklyProgressPercent} className="h-2" />
            {weeklyProgressPercent >= 100 && (
              <div className="flex items-center mt-2 text-green-600">
                <CheckCircle className="h-4 w-4 mr-1" />
                <span className="text-xs font-medium">Goal achieved!</span>
              </div>
            )}
          </div>
        </div>
      </MobileCardContent>
    </MobileCard>
  );
};

// Upcoming Classes Card
const UpcomingClassCard = ({ 
  classes 
}: {
  classes: StudentStats['upcomingClasses']
}) => (
  <MobileCard variant="default">
    <MobileCardHeader>
      <MobileCardTitle className="flex items-center gap-2">
        <Calendar className="h-5 w-5 text-blue-500" />
        Upcoming Classes
      </MobileCardTitle>
    </MobileCardHeader>
    <MobileCardContent>
      <div className="space-y-3">
        {classes.slice(0, 3).map((classItem) => (
          <div key={classItem.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{classItem.title}</h4>
              <p className="text-xs text-muted-foreground">{classItem.teacher}</p>
              <p className="text-xs text-muted-foreground">{classItem.time}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge variant={classItem.type === 'online' ? 'default' : 'secondary'} className="text-xs">
                {classItem.type}
              </Badge>
              <MobileButton size="xs" variant="outline">
                Join
              </MobileButton>
            </div>
          </div>
        ))}
        {classes.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No upcoming classes scheduled
          </p>
        )}
      </div>
    </MobileCardContent>
  </MobileCard>
);

// Assignments Card
const AssignmentsCard = ({ 
  assignments 
}: {
  assignments: StudentStats['assignments']
}) => (
  <MobileCard variant="default">
    <MobileCardHeader>
      <MobileCardTitle className="flex items-center gap-2">
        <Target className="h-5 w-5 text-purple-500" />
        Recent Assignments
      </MobileCardTitle>
    </MobileCardHeader>
    <MobileCardContent>
      <div className="space-y-3">
        {assignments.slice(0, 3).map((assignment) => (
          <div key={assignment.id} className="flex items-center justify-between p-3 border rounded-lg">
            <div className="flex-1 min-w-0">
              <h4 className="font-medium text-sm truncate">{assignment.title}</h4>
              <p className="text-xs text-muted-foreground">Due: {assignment.dueDate}</p>
            </div>
            <div className="flex items-center gap-2">
              <Badge 
                variant={
                  assignment.status === 'graded' ? 'default' :
                  assignment.status === 'submitted' ? 'secondary' : 'outline'
                }
                className="text-xs"
              >
                {assignment.status}
              </Badge>
              {assignment.status === 'graded' && assignment.score && (
                <span className="text-xs font-medium text-green-600">
                  {assignment.score}%
                </span>
              )}
            </div>
          </div>
        ))}
        {assignments.length === 0 && (
          <p className="text-center text-muted-foreground text-sm py-4">
            No recent assignments
          </p>
        )}
      </div>
    </MobileCardContent>
  </MobileCard>
);

export function MobileStudentDashboard() {
  const [, setLocation] = useLocation();

  // Fetch student statistics
  const { data: stats, isLoading } = useQuery<StudentStats>({
    queryKey: ["/api/student/dashboard-stats"],
    queryFn: async () => {
      const response = await fetch("/api/student/dashboard-stats", {
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`
        }
      });
      if (!response.ok) throw new Error("Failed to fetch student stats");
      return response.json();
    }
  });

  if (isLoading) {
    return (
      <div className="space-y-4 p-4">
        {[...Array(4)].map((_, i) => (
          <div key={i} className="h-32 bg-muted animate-pulse rounded-lg" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4 pb-6">
      {/* Welcome Header */}
      <div className="text-center space-y-2">
        <h1 className="text-2xl font-bold">Welcome back!</h1>
        <p className="text-muted-foreground">Ready to continue your learning journey?</p>
      </div>

      {/* Gamification Widget */}
      {stats && (
        <GamificationWidget 
          level={stats.currentLevel}
          xp={stats.xp}
          nextLevelXp={stats.nextLevelXp}
          streak={stats.streak}
        />
      )}

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-4">Quick Actions</h2>
        <div className="grid grid-cols-2 gap-3">
          <MobileButton
            variant="student"
            size="lg"
            leftIcon={<Play className="h-5 w-5" />}
            onClick={() => setLocation("/courses")}
            className="h-16"
          >
            Continue Learning
          </MobileButton>
          <MobileButton
            variant="outline"
            size="lg"
            leftIcon={<MessageSquare className="h-5 w-5" />}
            onClick={() => setLocation("/ai-practice")}
            className="h-16"
          >
            AI Practice
          </MobileButton>
        </div>
      </div>

      {/* Learning Progress */}
      {stats && (
        <LearningProgressCard 
          completedLessons={stats.completedLessons}
          totalLessons={stats.totalLessons}
          weeklyGoal={stats.weeklyGoal}
          weeklyProgress={stats.weeklyProgress}
        />
      )}

      {/* Upcoming Classes */}
      {stats && (
        <UpcomingClassCard classes={stats.upcomingClasses} />
      )}

      {/* Assignments */}
      {stats && (
        <AssignmentsCard assignments={stats.assignments} />
      )}

      {/* Achievement Showcase */}
      {stats?.achievements && stats.achievements.length > 0 && (
        <MobileCard variant="default">
          <MobileCardHeader>
            <MobileCardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </MobileCardTitle>
          </MobileCardHeader>
          <MobileCardContent>
            <div className="flex space-x-3 overflow-x-auto pb-2">
              {stats.achievements.slice(0, 5).map((achievement) => (
                <div 
                  key={achievement.id}
                  className="flex-shrink-0 text-center p-3 border rounded-lg min-w-[80px]"
                >
                  <div className="w-10 h-10 bg-yellow-100 rounded-full flex items-center justify-center mx-auto mb-2">
                    <Award className="h-5 w-5 text-yellow-600" />
                  </div>
                  <p className="text-xs font-medium truncate">{achievement.title}</p>
                </div>
              ))}
            </div>
          </MobileCardContent>
        </MobileCard>
      )}
    </div>
  );
}

export default MobileStudentDashboard;