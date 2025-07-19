import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
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
  AlertCircle,
  BarChart
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

// Enhanced observation schema with session auto-population and duplication prevention
const observationSchema = z.object({
  sessionId: z.number().min(1, "Please select a session"),
  teacherId: z.number().min(1, "Please select a teacher"),
  observationType: z.enum(['live_online', 'live_in_person', 'recorded']),
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

// Target setting schema for monthly/seasonal goals
const targetSchema = z.object({
  period: z.enum(['monthly', 'quarterly', 'seasonal']),
  targetType: z.enum(['observations', 'quality_score', 'teacher_retention', 'student_satisfaction']),
  targetValue: z.number().min(1),
  description: z.string().optional(),
});

export default function SupervisorDashboard() {
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

  const { data: recentObservations } = useQuery({
    queryKey: ["/api/supervision/recent-observations"],
  });

  const { data: teacherPerformance } = useQuery({
    queryKey: ["/api/supervision/teacher-performance"],
  });

  // Fetch live sessions for observation form
  const { data: liveSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions'],
  });

  // Fetch recorded sessions for observation form
  const { data: recordedSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions', 'completed'],
  });

  // Fetch all teachers for the form with proper error handling
  const { data: allTeachers, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['/api/teachers/list'],
    select: (data: any[]) => {
      console.log('Raw teachers data:', data);
      const filtered = data?.filter(user => user.role === 'Teacher/Tutor') || [];
      console.log('Filtered teachers:', filtered);
      return filtered;
    },
  });

  // Fetch pending observations for to-do list
  const { data: pendingObservations = [] } = useQuery({
    queryKey: ['/api/supervision/pending-observations']
  });

  // Enhanced supervisor dashboard queries
  const { data: dailyIncome } = useQuery({
    queryKey: ['/api/supervisor/daily-income'],
  });

  const { data: teachersNeedingAttention = [] } = useQuery({
    queryKey: ['/api/supervisor/teachers-needing-attention'],
  });

  const { data: studentsNeedingAttention = [] } = useQuery({
    queryKey: ['/api/supervisor/students-needing-attention'],
  });

  const { data: upcomingSessionsForObservation = [] } = useQuery({
    queryKey: ['/api/supervisor/upcoming-sessions-for-observation'],
  });

  // Fetch enhanced business intelligence data
  const { data: businessIntelligence } = useQuery({
    queryKey: ['/api/supervisor/business-intelligence'],
  });

  // Fetch dialog teacher classes when teacher is selected in dialog


  // SMS Alert mutations
  const sendTeacherAlert = useMutation({
    mutationFn: async ({ teacherId, issue }: { teacherId: number; issue: string }) => {
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
      observationType: 'live_online' as const,
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

  const targetForm = useForm({
    resolver: zodResolver(targetSchema),
    defaultValues: {
      period: 'monthly' as const,
      targetType: 'observations' as const,
      targetValue: 10,
    },
  });

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
      const observationType = session.deliveryMode === 'online' ? 'live_online' : 'live_in_person';
      observationForm.setValue('observationType', observationType);
      
      console.log('Session selected:', sessionId, 'Auto-populated:', { teacherId: session.teacherId, date: dateStr, time: timeStr, type: observationType });
    }
  };

  // Create observation mutation
  const createObservationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const result = await apiRequest('/api/supervision/observations', 'POST', data);
        console.log('Observation creation result:', result);
        return result;
      } catch (error) {
        console.error('Observation creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/recent-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard-stats'] });
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: "Success", description: "Observation created successfully" });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      const errorMessage = error?.message || "Failed to create observation";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  // Target setting mutation
  const setTargetMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/supervisor/targets', 'POST', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/targets'] });
      setTargetDialogOpen(false);
      targetForm.reset();
      toast({ 
        title: "Target Set", 
        description: "Monthly/seasonal target has been configured successfully" 
      });
    },
    onError: (error: any) => {
      toast({ 
        title: "Error", 
        description: error?.message || "Failed to set target",
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
  const onTargetSubmit = (data: any) => {
    const targetData = {
      ...data,
      supervisorId: 46, // Current supervisor
      createdDate: new Date().toISOString(),
      status: 'active',
    };
    
    setTargetMutation.mutate(targetData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
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
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervision Dashboard</h1>
            <p className="text-gray-600 mt-2">Quality assurance and teacher performance monitoring</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={() => setObservationDialogOpen(true)}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              New Observation
            </Button>

          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Teachers</p>
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
                  <p className="text-green-100">Total Students</p>
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
                  <p className="text-red-100">Teachers Needing Attention</p>
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
                  <p className="text-purple-100">Pending Reviews</p>
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
                  <p className="text-amber-100">Students Needing Attention</p>
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
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
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
                      <div className="text-2xl font-bold text-green-700">
                        {businessIntelligence?.monthlyRevenue?.toLocaleString() || '0'}
                      </div>
                      <div className="text-xs text-green-600">IRR Monthly Revenue</div>
                      {businessIntelligence?.revenueGrowth > 0 && (
                        <div className="text-xs text-green-500">
                          +{businessIntelligence.revenueGrowth}% from last month
                        </div>
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
                      <div className="text-xs text-purple-500">Academic performance</div>
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
                      Quality Trend: {businessIntelligence?.qualityTrend?.replace('_', ' ') || 'Stable'}
                    </Badge>
                  </div>
                </CardContent>
              </Card>

              {/* Iranian Market Intelligence */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart className="h-5 w-5 mr-2 text-indigo-600" />
                    Iranian Market KPIs
                  </CardTitle>
                  <CardDescription>Local market performance indicators</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Revenue per Student</span>
                      <span className="font-semibold">
                        {businessIntelligence?.avgRevenuePerStudent?.toLocaleString() || '0'} IRR
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
                    To-Do Observations
                  </CardTitle>
                  <CardDescription>
                    Approved classes scheduled for observation
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  {pendingObservations.length === 0 ? (
                    <div className="text-center py-4 text-gray-500">
                      <Calendar className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                      <p className="text-sm">No pending observations</p>
                      <p className="text-xs text-gray-400">Approve classes from Schedule Review to see them here</p>
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
                        View All {pendingObservations.length - 4} More
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
                    Daily Income by Student Category
                  </CardTitle>
                  <CardDescription>
                    Revenue breakdown by course delivery and format - {new Date().toLocaleDateString()}
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
                        {(dailyIncome.categories?.onlineGroup?.revenue || 0).toLocaleString()} IRR
                      </div>
                    </div>
                    <div className="text-center p-4 bg-purple-50 rounded-lg border">
                      <div className="text-sm text-purple-600 font-medium">Online 1-on-1</div>
                      <div className="text-2xl font-bold text-purple-800">
                        {dailyIncome.categories?.onlineOneOnOne?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {(dailyIncome.categories?.onlineOneOnOne?.revenue || 0).toLocaleString()} IRR
                      </div>
                    </div>
                    <div className="text-center p-4 bg-orange-50 rounded-lg border">
                      <div className="text-sm text-orange-600 font-medium">In-Person Group</div>
                      <div className="text-2xl font-bold text-orange-800">
                        {dailyIncome.categories?.inPersonGroup?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {(dailyIncome.categories?.inPersonGroup?.revenue || 0).toLocaleString()} IRR
                      </div>
                    </div>
                    <div className="text-center p-4 bg-red-50 rounded-lg border">
                      <div className="text-sm text-red-600 font-medium">In-Person 1-on-1</div>
                      <div className="text-2xl font-bold text-red-800">
                        {dailyIncome.categories?.inPersonOneOnOne?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {(dailyIncome.categories?.inPersonOneOnOne?.revenue || 0).toLocaleString()} IRR
                      </div>
                    </div>
                    <div className="text-center p-4 bg-teal-50 rounded-lg border">
                      <div className="text-sm text-teal-600 font-medium">Callern</div>
                      <div className="text-2xl font-bold text-teal-800">
                        {dailyIncome.categories?.callern?.students || 0}
                      </div>
                      <div className="text-xs text-gray-500">students</div>
                      <div className="text-sm font-semibold text-green-600 mt-1">
                        {(dailyIncome.categories?.callern?.revenue || 0).toLocaleString()} IRR
                      </div>
                    </div>
                  </div>
                  <div className="mt-4 pt-4 border-t">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600 font-medium">Total Daily Revenue:</span>
                      <span className="text-2xl font-bold text-green-700">
                        {(dailyIncome.totalRevenue || 0).toLocaleString()} IRR
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Set Monthly/Seasonal Targets</DialogTitle>
            </DialogHeader>
            <Form {...targetForm}>
              <form onSubmit={targetForm.handleSubmit(onTargetSubmit)} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <FormField
                    control={targetForm.control}
                    name="period"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Period</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="monthly">Monthly</SelectItem>
                            <SelectItem value="quarterly">Quarterly</SelectItem>
                            <SelectItem value="seasonal">Seasonal</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={targetForm.control}
                    name="targetType"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Type</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select target type" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="observations">Number of Observations</SelectItem>
                            <SelectItem value="quality_score">Average Quality Score</SelectItem>
                            <SelectItem value="teacher_retention">Teacher Retention Rate</SelectItem>
                            <SelectItem value="student_satisfaction">Student Satisfaction Score</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={targetForm.control}
                    name="targetValue"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Target Value</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value))}
                            placeholder="Enter target value"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={targetForm.control}
                    name="description"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Description (Optional)</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Target description" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
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

                <div className="flex justify-end space-x-4">
                  <Button type="button" variant="outline" onClick={() => setTargetDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={setTargetMutation.isPending}
                    className="bg-green-600 hover:bg-green-700"
                  >
                    {setTargetMutation.isPending ? 'Setting...' : 'Set Target'}
                  </Button>
                </div>
              </form>
            </Form>
          </DialogContent>
        </Dialog>

        {/* Teachers Attention Dialog */}
        <Dialog open={teachersAttentionDialogOpen} onOpenChange={setTeachersAttentionDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
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
