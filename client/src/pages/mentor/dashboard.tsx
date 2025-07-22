import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Heart,
  Users, 
  Calendar, 
  Target, 
  TrendingUp, 
  Clock, 
  CheckCircle, 
  AlertCircle,
  Video,
  MessageSquare,
  Award,
  Star,
  Brain,
  Lightbulb,
  BookOpen,
  Phone,
  Mail,
  ChevronUp,
  ChevronDown,
  Plus,
  Settings,
  BarChart3,
  Compass,
  Smile,
  Frown,
  Meh
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState } from "react";

interface MentorStats {
  totalMentees: number;
  activeMentees: number;
  totalSessions: number;
  averageRating: number;
  goalsAchieved: number;
  monthlyEarnings: number;
  responseRate: number;
  completionRate: number;
}

interface Mentee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  progress: number;
  motivationLevel: number;
  lastSessionDate?: string;
  nextSessionDate?: string;
  currentGoals: string[];
  strengths: string[];
  weaknesses: string[];
  culturalBackground: string;
  avatar?: string;
  status: 'active' | 'inactive' | 'completed';
  joinedDate: string;
}

interface MentorSession {
  id: number;
  menteeId: number;
  menteeName: string;
  title: string;
  scheduledTime: string;
  duration: number;
  type: 'guidance' | 'goal_setting' | 'progress_review' | 'motivation';
  status: 'scheduled' | 'completed' | 'cancelled';
  notes?: string;
  sessionUrl?: string;
}

interface ProgressMilestone {
  id: number;
  menteeId: number;
  menteeName: string;
  title: string;
  description: string;
  targetDate: string;
  achievedDate?: string;
  progress: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

interface LearningGoal {
  id: number;
  menteeId: number;
  title: string;
  description: string;
  category: 'speaking' | 'listening' | 'reading' | 'writing' | 'grammar' | 'vocabulary';
  targetDate: string;
  progress: number;
  isCompleted: boolean;
  priority: 'high' | 'medium' | 'low';
}

function MentorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['mentor', 'common']);
  const { isRTL } = useLanguage();
  const [selectedTab, setSelectedTab] = useState("overview");
  const queryClient = useQueryClient();

  // Mentor theme colors
  const themeColors = {
    primary: "bg-orange-600",
    primaryHover: "hover:bg-orange-700",
    light: "bg-orange-50",
    border: "border-orange-200",
    text: "text-orange-800",
    accent: "bg-orange-100 text-orange-800"
  };

  // Data queries
  const { data: mentorStats } = useQuery<MentorStats>({
    queryKey: ["/api/mentor/stats"],
  });

  const { data: mentees = [] } = useQuery<Mentee[]>({
    queryKey: ["/api/mentor/mentees"],
  });

  const { data: sessions = [] } = useQuery<MentorSession[]>({
    queryKey: ["/api/mentor/sessions"],
  });

  const { data: milestones = [] } = useQuery<ProgressMilestone[]>({
    queryKey: ["/api/mentor/milestones"],
  });

  const { data: learningGoals = [] } = useQuery<LearningGoal[]>({
    queryKey: ["/api/mentor/goals"],
  });

  // Mutation for scheduling sessions
  const scheduleSessionMutation = useMutation({
    mutationFn: async (sessionData: { menteeId: number; type: string; scheduledTime: string }) => {
      const response = await fetch('/api/mentor/sessions', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(sessionData)
      });
      if (!response.ok) throw new Error('Failed to schedule session');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/sessions"] });
    }
  });

  // Mutation for updating goals
  const updateGoalMutation = useMutation({
    mutationFn: async ({ goalId, progress }: { goalId: number; progress: number }) => {
      const response = await fetch(`/api/mentor/goals/${goalId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ progress })
      });
      if (!response.ok) throw new Error('Failed to update goal');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/mentor/goals"] });
    }
  });

  // Helper functions
  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationColor = (level: number) => {
    if (level >= 8) return 'text-green-600';
    if (level >= 6) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getMotivationIcon = (level: number) => {
    if (level >= 8) return <Smile className="h-4 w-4 text-green-600" />;
    if (level >= 6) return <Meh className="h-4 w-4 text-yellow-600" />;
    return <Frown className="h-4 w-4 text-red-600" />;
  };

  const getLevelColor = (level: string) => {
    switch (level.toLowerCase()) {
      case 'beginner': return 'bg-blue-100 text-blue-800';
      case 'intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'advanced': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'bg-red-100 text-red-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      case 'scheduled': return 'bg-yellow-100 text-yellow-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const upcomingSessions = sessions.filter(s => 
    s.status === 'scheduled' && new Date(s.scheduledTime) > new Date()
  );

  const activeMentees = mentees.filter(m => m.status === 'active');
  const pendingGoals = learningGoals.filter(g => !g.isCompleted);

  return (
    <AppLayout>
      <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">{t('mentor:dashboard.title')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              {t('mentor:dashboard.welcomeMessage')}
            </p>
          </div>
        </div>

        {/* Overview Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">{t('mentor:dashboard.totalMentees')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.totalMentees || 0}</p>
                </div>
                <Users className="w-12 h-12 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">{t('mentor:dashboard.activeMentees')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.activeMentees || 0}</p>
                </div>
                <Heart className="w-12 h-12 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('mentor:dashboard.sessionsCompleted')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.totalSessions || 0}</p>
                </div>
                <Calendar className="w-12 h-12 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">{t('mentor:dashboard.averageRating')}</p>
                  <p className="text-3xl font-bold">{mentorStats?.averageRating?.toFixed(1) || '0.0'}</p>
                </div>
                <Star className="w-12 h-12 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('mentor:overview')}</TabsTrigger>
            <TabsTrigger value="students">{t('mentor:students')}</TabsTrigger>
            <TabsTrigger value="messages">{t('mentor:messages')}</TabsTrigger>
            <TabsTrigger value="progress">{t('mentor:progress')}</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>
    </AppLayout>
  );
}
                            {mentee.firstName[0]}{mentee.lastName[0]}
                          </AvatarFallback>
                        </Avatar>
