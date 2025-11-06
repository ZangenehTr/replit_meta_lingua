import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useLocation } from "wouter";
import { useTranslation } from 'react-i18next';
import { motion } from 'framer-motion';
import { useAuth } from '@/hooks/use-auth';
import { useLanguage } from "@/hooks/useLanguage";
import DynamicForm from "@/components/forms/DynamicForm";
import { formatCurrency } from "@/lib/utils";
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  TrendingUp, 
  UserCheck, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BookOpen,
  Star,
  DollarSign,
  MessageSquare,
  Phone,
  Eye,
  UserMinus,
  AlertCircle
} from "lucide-react";


interface SupervisorStats {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  completionRate: number;
  qualityScore: number;
  pendingObservations: number;
  teacherRating: number;
  studentRetention: number;
}

interface BusinessIntelligence {
  monthlyRevenue: number;
  revenueGrowth: number;
  studentEngagementRate: number;
  activeStudents: number;
  sessionCompletionRate: number;
  teacherQualityScore: number;
  observationsCompleted: number;
  qualityTrend: string;
  avgRevenuePerStudent: number;
  weeklyActiveStudents: number;
  monthlyCompletedSessions: number;
  totalStudents: number;
  totalRevenue: number;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  role: string;
  firstName?: string;
  lastName?: string;
}

interface TeacherNeedingAttention {
  id: number;
  name: string;
  reason: string;
  lastObservation?: string;
  rating?: number;
}

interface StudentNeedingAttention {
  id: number;
  name: string;
  issue: string;
  course: string;
  consecutiveAbsences: number;
  missedHomeworks: number;
  teacher: string;
}

interface UpcomingSession {
  id: number;
  teacherId: number;
  scheduledAt: string;
  deliveryMode: string;
  title?: string;
  student?: string;
}

interface PendingObservation {
  id: number;
  teacherId: number;
  sessionId: number;
  scheduledDate: string;
  type: string;
}

interface RecentObservation {
  id: number;
  teacherId: number;
  observationDate: string;
  overallScore: number;
  notes?: string;
}

interface FormDefinition {
  id: number;
  title: string;
  fields: any[];
  [key: string]: any;
}

interface TeacherPerformance {
  teacherId: number;
  name: string;
  overallScore: number;
  observationCount: number;
}

interface DailyIncome {
  amount: number;
  date: string;
  currency: string;
  categories?: string[];
  totalRevenue?: number;
}

interface ChartData {
  categories: any;
  data?: number[];
  totalRevenue?: number;
  onlineGroup?: number[];
  onlineOneOnOne?: number[];
  inPersonGroup?: number[];
  inPersonOneOnOne?: number[];
  callern?: number[];
}

interface LiveSession {
  id: number;
  teacherId: number;
  title: string;
  scheduledAt: string;
  deliveryMode: string;
}

// Enhanced observation schema with session auto-population and duplication prevention
const observationSchema = z.object({
  sessionId: z.number().min(1, "Please select a session"),
  teacherId: z.number().min(1, "Please select a teacher"),
  observationType: z.enum(['live_online', 'live_in_person']), // Will be validated against API data
  scheduledDate: z.string().min(1, "Scheduled date is required"),
  scheduledTime: z.string().min(1, "Scheduled time is required"),
  teachingMethodology: z.number().min(1).max(5),
  classroomManagement: z.number().min(1).max(5),
  studentEngagement: z.number().min(1).max(5),
  contentDelivery: z.number().min(1).max(5),
  languageSkills: z.number().min(1).max(5),
  timeManagement: z.number().min(1).max(5),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
});

// Target setting schema removed - now using dynamic form (Form ID: 6)

export default function SupervisorDashboard() {
  const { t } = useTranslation(['supervisor', 'common']);
  const { user } = useAuth();
  const { isRTL } = useLanguage();
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [targetDialogOpen, setTargetDialogOpen] = useState(false);
  const [teachersAttentionDialogOpen, setTeachersAttentionDialogOpen] = useState(false);
  const [studentsAttentionDialogOpen, setStudentsAttentionDialogOpen] = useState(false);
  const [selectedTeacherId, setSelectedTeacherId] = useState<number | null>(null);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();

  const { data: stats, isLoading } = useQuery<SupervisorStats>({
    queryKey: ["/api/supervisor/dashboard-stats"],
  });

  const { data: recentObservations } = useQuery<RecentObservation[]>({
    queryKey: ["/api/supervision/recent-observations"],
  });

  const { data: teacherPerformance } = useQuery<TeacherPerformance[]>({
    queryKey: ["/api/supervision/teacher-performance"],
  });

  // Fetch live sessions for observation form
  const { data: liveSessions } = useQuery<LiveSession[]>({
    queryKey: ['/api/supervision/live-sessions'],
  });

  // Fetch recorded sessions for observation form
  const { data: recordedSessions } = useQuery<LiveSession[]>({
    queryKey: ['/api/supervision/live-sessions', 'completed'],
  });

  // Fetch all teachers for the form with proper error handling
  const { data: allTeachers, isLoading: teachersLoading, error: teachersError } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/list'],
    select: (data: Teacher[]) => {
      console.log('Raw teachers data:', data);
      const filtered = data?.filter(user => user.role === 'Teacher/Tutor') || [];
      console.log('Filtered teachers:', filtered);
      return filtered;
    },
  });

  // Fetch pending observations for to-do list with real-time updates
  const { data: pendingObservations = [] } = useQuery<PendingObservation[]>({
    queryKey: ['/api/supervision/pending-observations'],
    refetchInterval: 10000, // Refetch every 10 seconds for real-time updates
    staleTime: 5000, // Consider data stale after 5 seconds
    refetchOnWindowFocus: true, // Refetch when window gets focus
    refetchOnMount: true // Always refetch on component mount
  });

  // Enhanced supervisor dashboard queries
  const { data: dailyIncome } = useQuery<ChartData>({
    queryKey: ['/api/supervisor/daily-income'],
  });

  const { data: teachersNeedingAttention = [] } = useQuery<TeacherNeedingAttention[]>({
    queryKey: ['/api/supervisor/teachers-needing-attention'],
  });

  const { data: studentsNeedingAttention = [] } = useQuery<StudentNeedingAttention[]>({
    queryKey: ['/api/supervisor/students-needing-attention'],
  });

  const { data: upcomingSessionsForObservation = [] } = useQuery<UpcomingSession[]>({
    queryKey: ['/api/supervisor/upcoming-sessions-for-observation'],
  });

  // Fetch enhanced business intelligence data
  const { data: businessIntelligence } = useQuery<BusinessIntelligence>({
    queryKey: ['/api/supervisor/business-intelligence'],
  });

  // Fetch Target Setting form definition (Form ID: 6)
  const { data: targetFormDefinition, isLoading: targetFormLoading } = useQuery<FormDefinition>({
    queryKey: ['/api/forms', 6],
    enabled: targetDialogOpen,
  });

  // Fetch dialog teacher classes when teacher is selected in dialog


  // SMS Alert mutations
  const sendTeacherAlert = useMutation({
    mutationFn: async ({ teacherId, issue, reason }: { teacherId: number; issue: string; reason?: string }) => {
      return apiRequest(`/api/supervisor/send-teacher-alert`, {
        method: 'POST',
        body: JSON.stringify({ teacherId, issue }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert Sent",
        description: "SMS alert sent to teacher successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Alert",
        description: error.message || "Failed to send SMS alert",
        variant: "destructive",
      });
    },
  });

  const sendStudentAlert = useMutation({
    mutationFn: async ({ studentId, issue, teacherName }: { studentId: number; issue: string; teacherName: string }) => {
      return apiRequest(`/api/supervisor/send-student-alert`, {
        method: 'POST',
        body: JSON.stringify({ studentId, issue, teacherName }),
      });
    },
    onSuccess: () => {
      toast({
        title: "Alert Sent",
        description: "SMS alert sent to student successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Failed to Send Alert", 
        description: error.message || "Failed to send SMS alert",
        variant: "destructive",
      });
    },
  });

  // Enhanced observation form with session auto-population and duplication prevention
  const observationForm = useForm({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      sessionId: 0,
      teacherId: 0,
      observationType: 'live_online' as 'live_online' | 'live_in_person',
      scheduledDate: '',
      scheduledTime: '',
      teachingMethodology: 1,
      classroomManagement: 1,
      studentEngagement: 1,
      contentDelivery: 1,
      languageSkills: 1,
      timeManagement: 1,
      strengths: '',
      areasForImprovement: '',
      notes: '',
      followUpRequired: false,
    },
  });

  // targetForm removed - now using DynamicForm with Form ID: 6

  // Check-First Protocol: Auto-populate session details when session is selected
  const handleSessionSelection = (sessionId: string) => {
    const session = upcomingSessionsForObservation.find(s => s.id.toString() === sessionId);
    if (session) {
      const sessionDate = new Date(session.scheduledAt);
      const dateStr = sessionDate.toISOString().split('T')[0];
      const timeStr = sessionDate.toTimeString().slice(0, 5);
      
      // Auto-populate teacher and observation type based on session
      observationForm.setValue('teacherId', session.teacherId);
      observationForm.setValue('scheduledDate', dateStr);
      observationForm.setValue('scheduledTime', timeStr);
      
      // Set observation type based on delivery mode
      const observationType: 'live_online' | 'live_in_person' = session.deliveryMode === 'online' ? 'live_online' : 'live_in_person';
      observationForm.setValue('observationType', observationType);
      
      console.log('Session selected:', sessionId, 'Auto-populated:', { teacherId: session.teacherId, date: dateStr, time: timeStr, type: observationType });
    }
  };

  // Create observation mutation
  const createObservationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const result = await apiRequest('/api/supervision/observations', { method: 'POST', body: data });
        console.log('Observation creation result:', result);
        return result;
      } catch (error) {
        console.error('Observation creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      // Invalidate all observation-related queries for real-time updates
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/recent-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/pending-observations'] }); // Fixed: Add pending observations
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard-stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/upcoming-sessions-for-observation'] });
      
      // Immediate refetch for pending observations to ensure real-time update
      queryClient.refetchQueries({ queryKey: ['/api/supervision/pending-observations'] });
      
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: t('common:toast.success'), description: t('common:toast.observationCreated') });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      const errorMessage = error?.message || "Failed to create observation";
      toast({ 
        title: t('common:toast.error'), 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  // Target setting mutation
  const setTargetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/supervisor/targets', { method: 'POST', body: data });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/targets'] });
      setTargetDialogOpen(false);
      toast({ 
        title: "Target Set", 
        description: "Monthly/seasonal target has been configured successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: t('common:toast.error'), 
        description: error?.message || t('common:toast.targetFailed'),
        variant: "destructive" 
      });
    },
  });





  // Check-First Protocol: Prevent duplicate observations
  const checkForDuplicateObservation = async (sessionId: number, teacherId: number): Promise<boolean> => {
    try {
      const existingObservations = await apiRequest(`/api/supervision/observations?sessionId=${sessionId}&teacherId=${teacherId}`);
      return existingObservations && existingObservations.length > 0;
    } catch (error) {
      console.error('Error checking for duplicates:', error);
      return false;
    }
  };

  const onObservationSubmit = async (data: any) => {
    // Check-First Protocol: Prevent duplication
    const isDuplicate = await checkForDuplicateObservation(data.sessionId, data.teacherId);
    if (isDuplicate) {
      toast({
        title: "Duplicate Observation",
        description: "An observation for this session and teacher already exists",
        variant: "destructive",
      });
      return;
    }

    // Combine scheduled date and time for observation date
    const combinedDateTime = new Date(`${data.scheduledDate}T${data.scheduledTime}`);
    
    // Calculate overall score from individual scores
    const scoreFields = ['teachingMethodology', 'classroomManagement', 'studentEngagement', 'contentDelivery', 'languageSkills', 'timeManagement'];
    const totalScore = scoreFields.reduce((sum, field) => sum + data[field], 0);
    const overallScore = (totalScore / scoreFields.length).toFixed(2);
    
    // Transform data to match database schema
    const observationData = {
      teacherId: data.teacherId,
      supervisorId: 46, // Current supervisor
      sessionId: data.sessionId,
      observationType: data.observationType,
      observationDate: combinedDateTime.toISOString(),
      overallScore: parseFloat(overallScore),
      strengths: data.strengths || '',
      areasForImprovement: data.areasForImprovement || '',
      notes: data.notes || '',
      followUpRequired: data.followUpRequired || false,
    };
    
    createObservationMutation.mutate(observationData);
  };

  // Target submission handler
  const handleTargetSubmit = async (data: any) => {
    const targetData = {
      ...data,
      supervisorId: 46, // Current supervisor
      createdDate: new Date().toISOString(),
      status: 'active',
    };
    
    return setTargetMutation.mutateAsync(targetData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Welcome Banner */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600 rounded-xl p-6 md:p-8 text-white shadow-xl"
        >
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="text-center md:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('supervisor:welcome', 'Welcome')}, {user?.firstName || t('supervisor:supervisor', 'Supervisor')}! 🔍
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {t('supervisor:welcomeMessage', 'Monitor excellence, guide success, and ensure quality education!')}
              </p>
            </div>
            <div className="flex gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('supervisor:totalTeachers', 'Total Teachers')}</p>
                <p className="text-xl font-bold">👩‍🏫 {stats?.totalTeachers || 0}</p>
              </div>
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2 text-center">
                <p className="text-xs opacity-90">{t('supervisor:qualityScore', 'Quality Score')}</p>
                <p className="text-xl font-bold">📊 {stats?.qualityScore || 95}%</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{t('supervisor:dashboard.title')}</h1>
            <p className="text-gray-600 mt-2">{t('supervisor:dashboard.welcomeMessage')}</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={() => setObservationDialogOpen(true)}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              {t('common:supervisor.scheduleObservation')}
            </Button>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">{t('common:supervisor.teachers')}</p>
                  <p className="text-3xl font-bold">{stats?.totalTeachers || 0}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">مجموع دانش‌آموزان</p>
                  <p className="text-3xl font-bold">{stats?.totalStudents || 0}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-red-500 to-red-600 text-white cursor-pointer hover:from-red-600 hover:to-red-700 transition-all"
            onClick={() => setTeachersAttentionDialogOpen(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-100">{t('common:supervisor.improvementNeeded')}</p>
                  <p className="text-3xl font-bold">{teachersNeedingAttention?.length || 0}</p>
                </div>
                <UserMinus className="h-8 w-8 text-red-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">{t('common:supervisor.pendingReviews')}</p>
                  <p className="text-3xl font-bold">{pendingObservations.length || 0}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>

          <Card 
            className="bg-gradient-to-br from-amber-500 to-amber-600 text-white cursor-pointer hover:from-amber-600 hover:to-amber-700 transition-all"
            onClick={() => setStudentsAttentionDialogOpen(true)}
          >
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-amber-100">{t('common:supervisor.studentsNeedingAttention')}</p>
                  <p className="text-3xl font-bold">{studentsNeedingAttention?.length || 0}</p>
                </div>
                <AlertCircle className="h-8 w-8 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="overview">{t('dashboard.overview', { ns: 'common' })}</TabsTrigger>
            <TabsTrigger value="teachers">{t('supervisor:evaluations.performance')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Business Intelligence Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-blue-600" />
                    Business Intelligence
                  </CardTitle>
                  <CardDescription>Key performance indicators from real data</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center p-3 rounded-lg bg-green-50">
                      {businessIntelligence?.monthlyRevenue > 0 ? (
                        <>
                          <div className="text-2xl font-bold text-green-700">
                            {businessIntelligence.monthlyRevenue.toLocaleString()}
                          </div>
                          <div className="text-xs text-green-600">Monthly Revenue</div>
                          {businessIntelligence.revenueGrowth > 0 && (
                            <div className="text-xs text-green-500">
                              +{businessIntelligence.revenueGrowth}% from last month
                            </div>
                          )}
                        </>
                      ) : (
                        <>
                          <div className="text-2xl font-bold text-gray-400">No Data</div>
                          <div className="text-xs text-gray-500">IRR Monthly Revenue</div>
                          <div className="text-xs text-orange-500">No payments recorded</div>
                        </>
                      )}
                    </div>
                    
                    <div className="text-center p-3 rounded-lg bg-blue-50">
                      <div className="text-2xl font-bold text-blue-700">
                        {businessIntelligence?.studentEngagementRate || 0}%
                      </div>
                      <div className="text-xs text-blue-600">Student Engagement</div>
                      <div className="text-xs text-blue-500">
                        {businessIntelligence?.activeStudents || 0} active students
                      </div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg bg-purple-50">
                      <div className="text-2xl font-bold text-purple-700">
                        {businessIntelligence?.sessionCompletionRate || 0}%
                      </div>
                      <div className="text-xs text-purple-600">Session Completion</div>
                      <div className="text-xs text-purple-500">Academic Performance</div>
                    </div>
                    
                    <div className="text-center p-3 rounded-lg bg-orange-50">
                      <div className="text-2xl font-bold text-orange-700">
                        {businessIntelligence?.teacherQualityScore || 0}/5.0
                      </div>
                      <div className="text-xs text-orange-600">Teaching Quality</div>
                      <div className="text-xs text-orange-500">
                        {businessIntelligence?.observationsCompleted || 0} observations
                      </div>
                    </div>
                  </div>
                  
                  {/* Quality Trend Badge */}
                  <div className="flex justify-center pt-2">
                    <Badge 
                      variant={businessIntelligence?.qualityTrend === 'improving' ? 'default' : 'secondary'}
                      className={
                        businessIntelligence?.qualityTrend === 'improving' 
                          ? 'bg-green-100 text-green-800' 
                          : 'bg-amber-100 text-amber-800'
                      }
                    >
                      Quality Trend: {businessIntelligence?.qualityTrend?.replace('_', ' ') || 'stable'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Iranian Market Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-indigo-600" />
                    {t('supervisor:dashboard.iranianMarketKPIs')}
                  </CardTitle>
                  <CardDescription>{t('supervisor:dashboard.localMarketIndicators')}</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue per Student</span>
                      <span className={`font-semibold ${businessIntelligence?.avgRevenuePerStudent > 0 ? 'text-gray-900' : 'text-gray-400'}`}>
                        {businessIntelligence?.avgRevenuePerStudent > 0 
                          ? formatCurrency(businessIntelligence.avgRevenuePerStudent, 'IRR')
                          : 'No payments'}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Weekly Active Students</span>
                      <span className="font-semibold text-blue-600">
                        {businessIntelligence?.weeklyActiveStudents || 0} students
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Monthly Sessions</span>
                      <span className="font-semibold text-green-600">
                        {businessIntelligence?.monthlyCompletedSessions || 0} completed
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Total Enrolled</span>
                      <span className="font-semibold text-purple-600">
                        {businessIntelligence?.totalStudents || 0} students
                      </span>
                    </div>
                  </div>
                  
                  {/* Performance Progress Bars */}
                  <div className="pt-2 space-y-2">
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Student Engagement</span>
                        <span>{businessIntelligence?.studentEngagementRate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, businessIntelligence?.studentEngagementRate || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                    
                    <div>
                      <div className="flex justify-between text-xs mb-1">
                        <span>Session Success Rate</span>
                        <span>{businessIntelligence?.sessionCompletionRate || 0}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full" 
                          style={{ width: `${Math.min(100, businessIntelligence?.sessionCompletionRate || 0)}%` }}
                        ></div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Pending Observations To-Do */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <ClipboardCheck className="h-5 w-5 mr-2 text-orange-600" />
                    {t('supervisor:observations.title')}
                  </CardTitle>
                  <CardDescription>
                    {t('supervisor:observations.approvedClasses')}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingObservations.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">{t('supervisor:observations.noPending')}</p>
                      <p className="text-xs text-gray-400">{t('supervisor:observations.approveFromSchedule')}</p>
                    </div>
                  ) : (
                    pendingObservations.slice(0, 4).map((observation: any) => (
                      <div key={observation.id} className="flex items-center space-x-3 p-2 rounded hover:bg-gray-50">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium text-gray-900 truncate">
                            {observation.teacherName} - {observation.className}
                          </div>
                          <div className="text-xs text-gray-500">
                            {new Date(observation.scheduledDate).toLocaleDateString()} • {observation.observationType}
                          </div>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          {observation.priority}
                        </Badge>
                      </div>
                    ))
                  )}
                  {pendingObservations.length > 4 && (
                    <div className="text-center pt-2">
                      <Button variant="link" className="text-xs h-auto p-0">
                        {t('supervisor:observations.viewAll')} {pendingObservations.length - 4} {t('supervisor:observations.more')}
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Daily Income Tracking */}
            {dailyIncome && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <DollarSign className="h-5 w-5 mr-2 text-green-600" />
                    {t('supervisor:dashboard.dailyIncomeByCategory')}
                  </CardTitle>
                  <CardDescription>
                    {t('supervisor:dashboard.revenueBreakdown')} - {new Date().toLocaleDateString()}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                    <div className="text-center p-4 bg-blue-50 rounded-lg border">
                      <div className="text-sm text-blue-600 font-medium">Online Group</div>
                      <div className="text-2xl font-bold text-blue-800">
                        {dailyIncome.categories?.onlineGroup?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {formatCurrency(dailyIncome.categories?.onlineGroup?.revenue || 0, 'IRR')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border">
                      <div className="text-sm text-purple-600 font-medium">Online 1-on-1</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {dailyIncome.categories?.onlineOneOnOne?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {formatCurrency(dailyIncome.categories?.onlineOneOnOne?.revenue || 0, 'IRR')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border">
                      <div className="text-sm text-orange-600 font-medium">In-Person Group</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {dailyIncome.categories?.inPersonGroup?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {formatCurrency(dailyIncome.categories?.inPersonGroup?.revenue || 0, 'IRR')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border">
                      <div className="text-sm text-red-600 font-medium">In-Person 1-on-1</div>
                      <div className="text-2xl font-bold text-red-800">
                        {dailyIncome.categories?.inPersonOneOnOne?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {formatCurrency(dailyIncome.categories?.inPersonOneOnOne?.revenue || 0, 'IRR')}
                      </div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-lg border">
                      <div className="text-sm text-teal-600 font-medium">Callern</div>
                      <div className="text-2xl font-bold text-teal-800">
                        {dailyIncome.categories?.callern?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {formatCurrency(dailyIncome.categories?.callern?.revenue || 0, 'IRR')}
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Daily Revenue:</span>
                      <span className="text-2xl font-bold text-green-700">
                        {formatCurrency(dailyIncome.totalRevenue || 0, 'IRR')}
                      </span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            {/* Teacher Performance Analytics Only */}
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {teacherPerformance?.length > 0 ? (
                teacherPerformance.map((teacher: any) => (
                  <Card key={teacher.teacherId} className="hover:shadow-lg transition-shadow">
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium">{teacher.teacherName}</CardTitle>
                      <CardDescription className="text-xs">
                        Performance Overview
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Rating</span>
                        <div className="flex items-center space-x-1">
                          <Star className="h-3 w-3 text-yellow-400 fill-current" />
                          <span className="text-sm font-semibold">{(teacher.averageRating || 0).toFixed(1)}</span>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Sessions</span>
                        <span className="text-sm font-semibold">{teacher.totalSessions}</span>
                      </div>
                      <div className="flex justify-between items-center">
                        <span className="text-xs text-gray-600">Last Observation</span>
                        <span className="text-xs">{teacher.lastObservation || 'Never'}</span>
                      </div>
                      <div className="pt-2 border-t">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="w-full text-xs"
                          onClick={() => {
                            observationForm.setValue('teacherId', teacher.teacherId);
                            setObservationDialogOpen(true);
                          }}
                        >
                          Schedule Observation
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <div className="col-span-full text-center py-8">
                  <GraduationCap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No teacher performance data available</p>
                </div>
              )}
            </div>
          </TabsContent>


        </Tabs>

        {/* Observation Creation Dialog */}
        <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Create Observation</DialogTitle>
            </DialogHeader>
            <Form {...observationForm}>
              <form onSubmit={observationForm.handleSubmit(onObservationSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Session Selection with Auto-Population */}
                  <FormField
                    control={observationForm.control}
                    name="sessionId"
                    render={({ field }) => (
                      <FormItem className="md:col-span-2">
                        <FormLabel>Upcoming Session *</FormLabel>
                        <Select onValueChange={(value) => {
                          field.onChange(parseInt(value));
                          handleSessionSelection(value);
                        }} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select an upcoming session to observe" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {upcomingSessionsForObservation.length === 0 ? (
                              <SelectItem value="no-sessions" disabled>No upcoming sessions available</SelectItem>
                            ) : (
                              upcomingSessionsForObservation.map((session: any) => (
                                <SelectItem key={session.id} value={session.id.toString()}>
                                  {session.teacherName} - {session.courseName} | {new Date(session.scheduledAt).toLocaleDateString()} at {new Date(session.scheduledAt).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})} | {session.deliveryMode} {session.classFormat}
                                </SelectItem>
                              ))
                            )}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={observationForm.control}
                    name="teacherId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher (Auto-populated)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Will auto-populate when session selected" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {(allTeachers || []).map((teacher) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={observationForm.control}
                    name="observationType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Observation Type (Auto-populated)</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger className="bg-gray-50">
                              <SelectValue placeholder="Will auto-populate when session selected" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="live_online">Live Online</SelectItem>
                            <SelectItem value="live_in_person">Live In-Person</SelectItem>
                            <SelectItem value="recorded">Recorded Session</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Date and Time Fields (Auto-populated) */}
                  <FormField
                    control={observationForm.control}
                    name="scheduledDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Date (Auto-populated)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                            className="bg-gray-50"
                            placeholder="Will auto-populate when session selected"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={observationForm.control}
                    name="scheduledTime"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Scheduled Time (Auto-populated)</FormLabel>
                        <FormControl>
                          <Input
                            type="time"
                            {...field}
                            className="bg-gray-50"
                            placeholder="Will auto-populate when session selected"
                            readOnly
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Check-First Protocol Notice */}
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <AlertCircle className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-blue-900">Check-First Protocol Active</h4>
                      <p className="text-sm text-blue-800 mt-1">
                        This system automatically prevents duplicate observations for the same session and teacher. 
                        Session details are auto-populated from your selected upcoming session to ensure accuracy.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Scoring sections */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[
                    { name: 'teachingMethodology', label: 'Teaching Methodology' },
                    { name: 'classroomManagement', label: 'Classroom Management' },
                    { name: 'studentEngagement', label: 'Student Engagement' },
                    { name: 'contentDelivery', label: 'Content Delivery' },
                    { name: 'languageSkills', label: 'Language Skills' },
                    { name: 'timeManagement', label: 'Time Management' }
                  ].map((field) => (
                    <FormField
                      key={field.name}
                      control={observationForm.control}
                      name={field.name as any}
                      render={({ field: formField }) => (
                        <FormItem>
                          <FormLabel>{field.label}</FormLabel>
                          <Select onValueChange={(value) => formField.onChange(parseInt(value))} value={formField.value?.toString()}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Score 1-5" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1">1 - Poor</SelectItem>
                              <SelectItem value="2">2 - Below Average</SelectItem>
                              <SelectItem value="3">3 - Average</SelectItem>
                              <SelectItem value="4">4 - Good</SelectItem>
                              <SelectItem value="5">5 - Excellent</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  ))}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={observationForm.control}
                    name="strengths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Strengths</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What did the teacher do well?" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={observationForm.control}
                    name="areasForImprovement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Areas for Improvement</FormLabel>
                        <FormControl>
                          <Textarea {...field} placeholder="What can be improved?" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={observationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Any additional observations or comments" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setObservationDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={createObservationMutation.isPending}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {createObservationMutation.isPending ? 'Creating...' : 'Create Observation'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Target Setting Dialog */}
        <Dialog open={targetDialogOpen} onOpenChange={setTargetDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Set Monthly/Seasonal Targets</DialogTitle>
            </DialogHeader>
            {targetFormLoading ? (
              <div className="py-8 text-center">Loading form...</div>
            ) : targetFormDefinition ? (
              <>
                <DynamicForm
                  formDefinition={targetFormDefinition}
                  onSubmit={handleTargetSubmit}
                  disabled={setTargetMutation.isPending}
                  showTitle={false}
                />
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mt-4">
                  <div className="flex items-start space-x-3">
                    <Target className="h-5 w-5 text-green-600 mt-0.5" />
                    <div>
                      <h4 className="font-medium text-green-900">Automatic Target Setting</h4>
                      <p className="text-sm text-green-800 mt-1">
                        These targets will be automatically tracked and you'll receive notifications when they're met or need attention.
                        Standard supervisor features include progress tracking, automated reports, and performance alerts.
                      </p>
                    </div>
                  </div>
                </div>
              </>
            ) : (
              <div className="py-8 text-center text-red-600">Failed to load form definition</div>
            )}
          </DialogContent>
        </Dialog>

        {/* Teachers Attention Dialog */}
        <Dialog open={teachersAttentionDialogOpen} onOpenChange={setTeachersAttentionDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <UserMinus className="h-5 w-5 mr-2 text-red-600" />
                Teachers Needing Attention ({teachersNeedingAttention?.length || 0})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {teachersNeedingAttention?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <UserCheck className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">All teachers are up to date!</p>
                  <p className="text-sm">No teachers currently need attention</p>
                </div>
              ) : (
                teachersNeedingAttention?.map((teacher: any) => (
                  <Card key={teacher.id} className="border-red-200 bg-red-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <UserMinus className="h-5 w-5 text-red-500" />
                          <div>
                            <div className="font-medium text-gray-900">{teacher.name}</div>
                            <div className="text-sm text-gray-600">
                              {teacher.reason} • Last observed: {teacher.lastObservation || 'Never'}
                            </div>
                            {teacher.rating && (
                              <div className="text-xs text-orange-600">
                                Current rating: {teacher.rating}/5.0
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setTeachersAttentionDialogOpen(false);
                              // Navigate to existing Schedule Class Observation form with teacher pre-selected
                              window.location.href = `/supervisor/schedule-review?teacher=${teacher.id}`;
                            }}
                          >
                            <Calendar className="h-4 w-4 mr-1" />
                            Schedule Review
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendTeacherAlert.mutate({ 
                              teacherId: teacher.id, 
                              issue: teacher.reason,
                              reason: teacher.reason 
                            })}
                            disabled={sendTeacherAlert.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            SMS Alert
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>

        {/* Students Attention Dialog */}
        <Dialog open={studentsAttentionDialogOpen} onOpenChange={setStudentsAttentionDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center">
                <AlertCircle className="h-5 w-5 mr-2 text-amber-600" />
                Students Needing Attention ({studentsNeedingAttention?.length || 0})
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              {studentsNeedingAttention?.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <CheckCircle className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p className="text-lg font-medium">All students are doing well!</p>
                  <p className="text-sm">No students currently need attention</p>
                </div>
              ) : (
                studentsNeedingAttention?.map((student: any) => (
                  <Card key={student.id} className="border-amber-200 bg-amber-50">
                    <CardContent className="p-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-3">
                          <AlertCircle className="h-5 w-5 text-amber-500" />
                          <div>
                            <div className="font-medium text-gray-900">{student.name}</div>
                            <div className="text-sm text-gray-600 capitalize">
                              {student.issue} issue • {student.course}
                            </div>
                            {student.consecutiveAbsences > 0 && (
                              <div className="text-xs text-red-600">
                                {student.consecutiveAbsences} consecutive absences
                              </div>
                            )}
                            {student.missedHomeworks > 0 && (
                              <div className="text-xs text-orange-600">
                                {student.missedHomeworks} missed homeworks
                              </div>
                            )}
                          </div>
                        </div>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              // Navigate to admin students page 
                              setStudentsAttentionDialogOpen(false);
                              setLocation("/admin/students");
                            }}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View Profile
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => sendStudentAlert.mutate({ 
                              studentId: student.id, 
                              issue: `${student.issue} concerns`,
                              teacherName: student.teacher 
                            })}
                            disabled={sendStudentAlert.isPending}
                          >
                            <MessageSquare className="h-4 w-4 mr-1" />
                            SMS Alert
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
