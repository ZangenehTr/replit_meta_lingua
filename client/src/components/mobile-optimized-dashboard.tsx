import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Video, BookOpen, Users, Bot, MessageSquare, ClipboardList, CreditCard } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

export function MobileOptimizedDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  const [selectedSession, setSelectedSession] = useState<number | null>(null);

  const { data: courses } = useQuery({
    queryKey: ["/api/courses"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/courses", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      return response.json();
    }
  });

  const { data: liveSessions } = useQuery({
    queryKey: ["/api/sessions/live"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sessions/live", {
        headers: { "Authorization": `Bearer ${token}` }
      });
      return response.json();
    }
  });

  const enrollMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/courses/my"] });
      setSelectedCourse(null);
    }
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      return response.json();
    },
    onSuccess: () => {
      setSelectedSession(null);
    }
  });

  const getAIRecommendations = async () => {
    try {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      const data = await response.json();
      alert(`AI Recommendations for ${user?.firstName}:\n${data.recommendations.join('\n')}`);
    } catch (error) {
      alert("AI recommendations are being updated. Please try again in a moment.");
    }
  };

  return (
    <div className="p-4 space-y-6 max-w-full overflow-x-hidden">
      {/* Welcome Section */}
      <Card>
        <CardContent className="pt-6">
          <h1 className="text-2xl font-bold mb-2">
            {user?.preferences?.language === 'fa' ? 'خوش آمدید' : 'Welcome'}, {user?.firstName}!
          </h1>
          <p className="text-muted-foreground">
            {user?.preferences?.language === 'fa' 
              ? 'به پلتفرم یادگیری زبان متالینگوا خوش آمدید'
              : 'Continue your language learning journey'}
          </p>
        </CardContent>
      </Card>

      {/* Live Sessions */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Video className="h-5 w-5" />
            {user?.preferences?.language === 'fa' ? 'کلاس‌های زنده' : 'Live Classes'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {liveSessions?.map((session: any) => (
            <div key={session.id} className="border rounded-lg p-4">
              <h4 className="font-medium">{session.title}</h4>
              <p className="text-sm text-muted-foreground">with {session.tutorName}</p>
              <div className="flex gap-2 mt-2">
                <Badge variant="outline">{session.language}</Badge>
                {session.status === "live" && (
                  <Badge variant="destructive">🔴 LIVE</Badge>
                )}
              </div>
              <Button
                className="w-full mt-3"
                size="sm"
                onClick={() => {
                  setSelectedSession(session.id);
                  joinSessionMutation.mutate(session.id);
                }}
                disabled={joinSessionMutation.isPending && selectedSession === session.id}
              >
                {joinSessionMutation.isPending && selectedSession === session.id 
                  ? "Joining..." 
                  : session.status === "live" 
                    ? (user?.preferences?.language === 'fa' ? 'پیوستن به کلاس' : 'Join Live Class')
                    : 'Join Later'
                }
              </Button>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* Available Courses */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <BookOpen className="h-5 w-5" />
            {user?.preferences?.language === 'fa' ? 'دوره‌های موجود' : 'Available Courses'}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {courses?.map((course: any) => (
            <div key={course.id} className="border rounded-lg p-4">
              <div className="space-y-3">
                <img
                  src={course.thumbnail}
                  alt={course.title}
                  className="w-full h-32 rounded-lg object-cover"
                />
                <div>
                  <h4 className="font-medium">{course.title}</h4>
                  <p className="text-sm text-muted-foreground">{course.description}</p>
                  <div className="flex gap-2 mt-2">
                    <Badge variant="outline">{course.language}</Badge>
                    <Badge variant="secondary">{course.level}</Badge>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="sm"
                  onClick={() => {
                    setSelectedCourse(course.id);
                    enrollMutation.mutate(course.id);
                  }}
                  disabled={enrollMutation.isPending && selectedCourse === course.id}
                >
                  {enrollMutation.isPending && selectedCourse === course.id 
                    ? (user?.preferences?.language === 'fa' ? 'در حال ثبت نام...' : 'Enrolling...')
                    : (user?.preferences?.language === 'fa' ? 'ثبت نام در دوره' : 'Enroll Now')
                  }
                </Button>
              </div>
            </div>
          ))}
        </CardContent>
      </Card>

      {/* AI Assistant */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bot className="h-5 w-5" />
            {user?.preferences?.language === 'fa' ? 'دستیار هوشمند' : 'AI Study Assistant'}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Button 
            className="w-full" 
            onClick={getAIRecommendations}
          >
            {user?.preferences?.language === 'fa' 
              ? 'دریافت توصیه‌های مطالعه' 
              : 'Get Study Recommendations'
            }
          </Button>
        </CardContent>
      </Card>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 gap-4">
        <Card>
          <CardContent className="pt-6 text-center">
            <MessageSquare className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{user?.credits || 0}</p>
            <p className="text-sm text-muted-foreground">
              {user?.preferences?.language === 'fa' ? 'اعتبار' : 'Credits'}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6 text-center">
            <ClipboardList className="h-8 w-8 mx-auto mb-2 text-primary" />
            <p className="text-2xl font-bold">{user?.streakDays || 0}</p>
            <p className="text-sm text-muted-foreground">
              {user?.preferences?.language === 'fa' ? 'روز متوالی' : 'Day Streak'}
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}