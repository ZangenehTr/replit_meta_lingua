import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Calendar, 
  CalendarIcon,
  Clock, 
  Users, 
  BookOpen, 
  MessageSquare,
  Bell,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Phone,
  Mail,
  MapPin,
  Video,
  Star,
  GraduationCap,
  Target,
  TrendingUp,
  Activity,
  Settings,
  Search,
  Filter,
  Plus,
  Eye,
  Edit,
  Trash2,
  Send,
  PhoneCall,
  User,
  Languages,
  RefreshCw,
  Download,
  Upload,
  Grid3X3,
  List,
  BarChart3,
  ArrowRight,
  ArrowLeft,
  Home,
  ChevronRight
} from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { useToast } from "@/hooks/use-toast";
import { TrialLessonCalendar } from "@/components/trial-lessons/TrialLessonCalendar";
import { TrialLessonBookingForm } from "@/components/trial-lessons/TrialLessonBookingForm";
import { NotificationSystem } from "@/components/trial-lessons/NotificationSystem";
import { TeacherAssignmentSystem } from "@/components/trial-lessons/TeacherAssignmentSystem";
import { AttendanceTracking } from "@/components/trial-lessons/AttendanceTracking";
import { TrialLessonAnalytics } from "@/components/trial-lessons/TrialLessonAnalytics";
import { apiRequest } from "@/lib/queryClient";
import { format, parseISO, addDays, isToday, isTomorrow, startOfDay, endOfDay, formatDistanceToNow } from "date-fns";
import { cn } from "@/lib/utils";

// Types for trial lesson management
interface TrialLesson {
  id: number;
  studentFirstName: string;
  studentLastName: string;
  studentName?: string;
  studentPhone: string;
  studentEmail: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  lessonType: 'in_person' | 'online' | 'phone';
  targetLanguage: string;
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  attendanceStatus?: 'pending' | 'attended' | 'no_show' | 'late' | 'early_departure';
  assignedTeacherId?: number;
  assignedTeacherName?: string;
  notes?: string;
  room?: string;
  currentProficiencyLevel?: string;
  preferredDuration?: string;
  createdAt: string;
  updatedAt?: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  specializations: string[];
  languageExpertise: string[];
  isAvailable: boolean;
  profilePhoto?: string;
  rating?: number;
  experience?: number;
  totalStudents?: number;
}

interface DashboardStats {
  todayTrials: number;
  confirmedTrials: number;
  pendingTrials: number;
  completedTrials: number;
  noShowTrials: number;
  totalTeachers: number;
  availableTeachers: number;
  averageResponseTime: number;
  conversionRate: number;
  todayRevenue: number;
  weeklyTrials: number;
  monthlyTrials: number;
}

interface FrontDeskMetrics {
  totalBookings: number;
  confirmationRate: number;
  attendanceRate: number;
  satisfactionScore: number;
  averageBookingTime: number;
  peakHours: string[];
  popularLanguages: { language: string; count: number }[];
  teacherUtilization: { teacherId: number; teacherName: string; utilization: number }[];
}

export default function TrialLessonScheduling() {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { toast } = useToast();
  const { t, i18n } = useTranslation(['common', 'frontdesk', 'trial-lessons']);
  const queryClient = useQueryClient();

  // State management
  const [activeTab, setActiveTab] = useState<'calendar' | 'bookings' | 'teachers' | 'notifications' | 'analytics' | 'attendance'>('calendar');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [viewMode, setViewMode] = useState<'calendar' | 'list'>('calendar');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'pending' | 'confirmed' | 'completed' | 'cancelled'>('all');
  const [languageFilter, setLanguageFilter] = useState<'all' | 'english' | 'persian' | 'arabic' | 'french' | 'german' | 'spanish'>('all');
  const [teacherFilter, setTeacherFilter] = useState<'all' | 'assigned' | 'unassigned'>('all');
  const [showBookingDialog, setShowBookingDialog] = useState(false);
  const [showTeacherAssignment, setShowTeacherAssignment] = useState(false);
  const [selectedTrialLesson, setSelectedTrialLesson] = useState<TrialLesson | null>(null);
  const [quickBookingMode, setQuickBookingMode] = useState(false);
  const [showNotificationPanel, setShowNotificationPanel] = useState(false);
  const [refreshInterval, setRefreshInterval] = useState(30000); // 30 seconds
  const [isRTL, setIsRTL] = useState(i18n.language === 'fa' || i18n.language === 'ar');

  // Update RTL when language changes
  useEffect(() => {
    setIsRTL(i18n.language === 'fa' || i18n.language === 'ar');
  }, [i18n.language]);

  // Auto-refresh data
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/available-slots'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/metrics'] });
    }, refreshInterval);

    return () => clearInterval(interval);
  }, [queryClient, refreshInterval]);

  // Real-time WebSocket updates
  useEffect(() => {
    if (!socket) return;

    const handleTrialLessonUpdate = (data: any) => {
      console.log('Front Desk: Trial lesson update received:', data);
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/metrics'] });
      
      // Show notification for real-time updates
      toast({
        title: isRTL ? "به‌روزرسانی درس آزمایشی" : "Trial Lesson Update",
        description: isRTL ? 
          `درس آزمایشی ${data.studentFirstName || ''} ${data.studentLastName || ''} به‌روزرسانی شد` :
          `Trial lesson for ${data.studentFirstName || ''} ${data.studentLastName || ''} has been updated`,
      });
    };

    const handleTrialLessonCreated = (data: any) => {
      console.log('Front Desk: New trial lesson created:', data);
      handleTrialLessonUpdate(data);
      toast({
        title: isRTL ? "درس آزمایشی جدید" : "New Trial Lesson",
        description: isRTL ? 
          `درس آزمایشی جدید برای ${data.studentFirstName || ''} ${data.studentLastName || ''} ایجاد شد` :
          `New trial lesson created for ${data.studentFirstName || ''} ${data.studentLastName || ''}`,
      });
    };

    const handleTeacherAssigned = (data: any) => {
      console.log('Front Desk: Teacher assigned:', data);
      handleTrialLessonUpdate(data);
      toast({
        title: isRTL ? "معلم تعیین شد" : "Teacher Assigned",
        description: isRTL ? 
          `معلم ${data.teacherName || 'جدید'} برای درس آزمایشی تعیین شد` :
          `Teacher ${data.teacherName || 'assigned'} to trial lesson`,
      });
    };

    // Subscribe to WebSocket events
    socket.on('trial-lesson-created', handleTrialLessonCreated);
    socket.on('trial-lesson-updated', handleTrialLessonUpdate);
    socket.on('trial-lesson-assigned', handleTeacherAssigned);
    socket.on('trial-lesson-cancelled', handleTrialLessonUpdate);
    socket.on('trial-lesson-completed', handleTrialLessonUpdate);
    socket.on('trial-lesson-checkin', handleTrialLessonUpdate);

    return () => {
      socket.off('trial-lesson-created', handleTrialLessonCreated);
      socket.off('trial-lesson-updated', handleTrialLessonUpdate);
      socket.off('trial-lesson-assigned', handleTeacherAssigned);
      socket.off('trial-lesson-cancelled', handleTrialLessonUpdate);
      socket.off('trial-lesson-completed', handleTrialLessonUpdate);
      socket.off('trial-lesson-checkin', handleTrialLessonUpdate);
    };
  }, [socket, queryClient, toast, isRTL]);

  // Fetch trial lessons with filtering
  const { data: trialLessons = [], isLoading: trialLessonsLoading, error: trialLessonsError } = useQuery<TrialLesson[]>({
    queryKey: ['/api/trial-lessons', statusFilter, languageFilter, teacherFilter, searchQuery],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (statusFilter !== 'all') params.append('status', statusFilter);
      if (languageFilter !== 'all') params.append('language', languageFilter);
      if (teacherFilter === 'assigned') params.append('hasTeacher', 'true');
      if (teacherFilter === 'unassigned') params.append('hasTeacher', 'false');
      if (searchQuery) params.append('search', searchQuery);

      const response = await fetch(`/api/trial-lessons?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch trial lessons');
      }
      const data = await response.json();
      
      // Ensure we handle both array and object responses
      return Array.isArray(data) ? data : data.lessons || [];
    }
  });

  // Fetch available teachers
  const { data: availableTeachers = [], isLoading: teachersLoading } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/available-slots', selectedDate.toISOString().split('T')[0]],
    queryFn: async () => {
      const response = await fetch(`/api/teachers/available-slots?date=${selectedDate.toISOString().split('T')[0]}`);
      if (!response.ok) {
        if (response.status === 404) return [];
        throw new Error('Failed to fetch available teachers');
      }
      return response.json();
    }
  });

  // Fetch dashboard metrics
  const { data: dashboardStats, isLoading: statsLoading } = useQuery<DashboardStats>({
    queryKey: ['/api/front-desk/trial-metrics'],
    queryFn: async () => {
      const response = await fetch('/api/front-desk/trial-metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch dashboard stats');
      }
      return response.json();
    }
  });

  // Fetch Front Desk specific metrics
  const { data: frontDeskMetrics, isLoading: metricsLoading } = useQuery<FrontDeskMetrics>({
    queryKey: ['/api/front-desk/metrics'],
    queryFn: async () => {
      const response = await fetch('/api/front-desk/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch front desk metrics');
      }
      return response.json();
    }
  });

  // Cancel trial lesson mutation
  const cancelTrialLesson = useMutation({
    mutationFn: async ({ trialId, reason }: { trialId: number; reason: string }) => {
      return apiRequest(`/api/trial-lessons/${trialId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          bookingStatus: 'cancelled',
          notes: reason 
        })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/metrics'] });
      toast({
        title: isRTL ? "درس آزمایشی لغو شد" : "Trial Lesson Cancelled",
        description: isRTL ? "درس آزمایشی با موفقیت لغو شد" : "Trial lesson has been cancelled successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: isRTL ? "خطا در لغو درس" : "Cancellation Failed",
        description: error.message || (isRTL ? "خطا در لغو درس آزمایشی" : "Failed to cancel trial lesson"),
        variant: "destructive"
      });
    }
  });

  // Confirm trial lesson mutation
  const confirmTrialLesson = useMutation({
    mutationFn: async (trialId: number) => {
      return apiRequest(`/api/trial-lessons/${trialId}`, {
        method: 'PUT',
        body: JSON.stringify({ bookingStatus: 'confirmed' })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/metrics'] });
      toast({
        title: isRTL ? "درس آزمایشی تایید شد" : "Trial Lesson Confirmed",
        description: isRTL ? "درس آزمایشی تایید و پیامک ارسال شد" : "Trial lesson confirmed and SMS sent",
      });
    },
    onError: (error: any) => {
      toast({
        title: isRTL ? "خطا در تایید درس" : "Confirmation Failed",
        description: error.message || (isRTL ? "خطا در تایید درس آزمایشی" : "Failed to confirm trial lesson"),
        variant: "destructive"
      });
    }
  });

  // Filter trial lessons based on current filters
  const filteredTrialLessons = trialLessons.filter(lesson => {
    // Add computed studentName if not present
    const lessonWithName = {
      ...lesson,
      studentName: lesson.studentName || `${lesson.studentFirstName} ${lesson.studentLastName}`.trim()
    };

    if (searchQuery) {
      const searchLower = searchQuery.toLowerCase();
      const matchesSearch = 
        lessonWithName.studentName.toLowerCase().includes(searchLower) ||
        lessonWithName.studentPhone.includes(searchQuery) ||
        lessonWithName.studentEmail.toLowerCase().includes(searchLower) ||
        lessonWithName.assignedTeacherName?.toLowerCase().includes(searchLower);
      if (!matchesSearch) return false;
    }

    return true;
  });

  // Get today's trials
  const todayTrials = filteredTrialLessons.filter(lesson => 
    isToday(parseISO(lesson.scheduledDate))
  );

  // Get upcoming trials (next 7 days)
  const upcomingTrials = filteredTrialLessons.filter(lesson => {
    const lessonDate = parseISO(lesson.scheduledDate);
    const today = new Date();
    const weekFromNow = addDays(today, 7);
    return lessonDate >= today && lessonDate <= weekFromNow;
  });

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'pending': return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'completed': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'cancelled': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'no_show': return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  // Get lesson type icon
  const getLessonTypeIcon = (type: string) => {
    switch (type) {
      case 'online': return <Video className="h-4 w-4" />;
      case 'phone': return <Phone className="h-4 w-4" />;
      case 'in_person': return <MapPin className="h-4 w-4" />;
      default: return <User className="h-4 w-4" />;
    }
  };

  // Format time for display
  const formatTime = (time: string) => {
    return time;
  };

  // Format date for display
  const formatDate = (date: string) => {
    const d = parseISO(date);
    return isRTL ? 
      d.toLocaleDateString('fa-IR') : 
      format(d, 'MMM dd, yyyy');
  };

  // Handle booking success
  const handleBookingSuccess = () => {
    setShowBookingDialog(false);
    queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
    queryClient.invalidateQueries({ queryKey: ['/api/front-desk/metrics'] });
    toast({
      title: isRTL ? "درس آزمایشی رزرو شد" : "Trial Lesson Booked",
      description: isRTL ? "درس آزمایشی با موفقیت رزرو شد و پیامک تایید ارسال شد" : "Trial lesson booked successfully and confirmation SMS sent",
    });
  };

  // Handle teacher assignment success
  const handleTeacherAssignmentSuccess = () => {
    setShowTeacherAssignment(false);
    setSelectedTrialLesson(null);
    queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
    toast({
      title: isRTL ? "معلم تعیین شد" : "Teacher Assigned",
      description: isRTL ? "معلم با موفقیت به درس آزمایشی تعیین شد" : "Teacher has been assigned to the trial lesson",
    });
  };

  if (trialLessonsError) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center p-6" dir={isRTL ? 'rtl' : 'ltr'}>
        <Card className="max-w-md w-full shadow-xl">
          <CardContent className="p-8 text-center">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 rounded-full bg-red-100 dark:bg-red-900/20 flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isRTL ? "خطا در بارگذاری اطلاعات" : "Error Loading Data"}
            </h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
              {isRTL 
                ? "متأسفانه نمی‌توانیم اطلاعات درس‌های آزمایشی را بارگذاری کنیم. لطفاً دوباره تلاش کنید."
                : "We couldn't load the trial lessons. Please try again."}
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <Button 
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] })}
                className="w-full sm:w-auto"
                data-testid="button-retry-loading"
              >
                {isRTL ? "تلاش مجدد" : "Retry"}
              </Button>
              <Link href="/frontdesk/dashboard">
                <Button 
                  variant="outline"
                  className="w-full sm:w-auto"
                  data-testid="button-back-dashboard"
                >
                  {isRTL ? "بازگشت به داشبورد" : "Back to Dashboard"}
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div 
      className={cn(
        "min-h-screen bg-gray-50 dark:bg-gray-900 p-6",
        isRTL && "rtl"
      )} 
      dir={isRTL ? 'rtl' : 'ltr'}
      data-testid="trial-lesson-scheduling"
    >
      {/* Header Section */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
        <div className="mb-4 lg:mb-0">
          <div className="flex items-center space-x-2 mb-2">
            <Home className="h-5 w-5 text-gray-500" />
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-sm text-gray-500">{isRTL ? "پذیرش" : "Front Desk"}</span>
            <ChevronRight className="h-4 w-4 text-gray-400" />
            <span className="text-sm font-medium">{isRTL ? "برنامه‌ریزی درس آزمایشی" : "Trial Scheduling"}</span>
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            {isRTL ? "مدیریت دروس آزمایشی" : "Trial Lesson Management"}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {isRTL ? 
              "برنامه‌ریزی، تایید و مدیریت دروس آزمایشی زبان" : 
              "Schedule, confirm, and manage language trial lessons"
            }
          </p>
        </div>
        
        <div className="flex items-center space-x-3">
          <Button
            onClick={() => setShowBookingDialog(true)}
            className="bg-blue-600 hover:bg-blue-700"
            data-testid="new-trial-booking"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? "درس آزمایشی جدید" : "New Trial Lesson"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setQuickBookingMode(!quickBookingMode)}
            data-testid="quick-booking-toggle"
          >
            <Clock className="h-4 w-4 mr-2" />
            {isRTL ? "رزرو سریع" : "Quick Booking"}
          </Button>
          
          <Button
            variant="outline"
            onClick={() => setShowNotificationPanel(true)}
            data-testid="notification-panel"
          >
            <Bell className="h-4 w-4 mr-2" />
            {isRTL ? "اعلان‌ها" : "Notifications"}
          </Button>

          <Button
            variant="outline"
            onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] })}
            disabled={trialLessonsLoading}
            data-testid="refresh-data"
          >
            <RefreshCw className={cn("h-4 w-4", trialLessonsLoading && "animate-spin")} />
          </Button>
        </div>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "امروز" : "Today's Trials"}
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-today-trials">
              {statsLoading ? "..." : (dashboardStats?.todayTrials || todayTrials.length)}
            </div>
            <p className="text-xs text-muted-foreground">
              {todayTrials.filter(t => t.bookingStatus === 'confirmed').length} {isRTL ? "تایید شده" : "confirmed"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "در انتظار تایید" : "Pending Confirmation"}
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending-trials">
              {filteredTrialLessons.filter(t => t.bookingStatus === 'pending').length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? "نیاز به بررسی" : "Need review"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "معلمان آماده" : "Available Teachers"}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-available-teachers">
              {teachersLoading ? "..." : availableTeachers.length}
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? "برای امروز" : "for today"}
            </p>
          </CardContent>
        </Card>

        <Card className="hover:shadow-md transition-shadow">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {isRTL ? "نرخ تبدیل" : "Conversion Rate"}
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600" data-testid="stat-conversion-rate">
              {statsLoading ? "..." : (dashboardStats?.conversionRate || 0).toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {isRTL ? "به دانشجو" : "to enrollment"}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Search className="h-5 w-5" />
            <span>{isRTL ? "جستجو و فیلترها" : "Search & Filters"}</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label htmlFor="search">{isRTL ? "جستجو" : "Search"}</Label>
              <Input
                id="search"
                placeholder={isRTL ? "نام، تلفن، ایمیل..." : "Name, phone, email..."}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                data-testid="search-input"
              />
            </div>
            
            <div className="space-y-2">
              <Label>{isRTL ? "وضعیت" : "Status"}</Label>
              <Select value={statusFilter} onValueChange={(value: any) => setStatusFilter(value)}>
                <SelectTrigger data-testid="status-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "همه" : "All Status"}</SelectItem>
                  <SelectItem value="pending">{isRTL ? "در انتظار" : "Pending"}</SelectItem>
                  <SelectItem value="confirmed">{isRTL ? "تایید شده" : "Confirmed"}</SelectItem>
                  <SelectItem value="completed">{isRTL ? "تکمیل شده" : "Completed"}</SelectItem>
                  <SelectItem value="cancelled">{isRTL ? "لغو شده" : "Cancelled"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{isRTL ? "زبان" : "Language"}</Label>
              <Select value={languageFilter} onValueChange={(value: any) => setLanguageFilter(value)}>
                <SelectTrigger data-testid="language-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "همه زبان‌ها" : "All Languages"}</SelectItem>
                  <SelectItem value="english">{isRTL ? "انگلیسی" : "English"}</SelectItem>
                  <SelectItem value="persian">{isRTL ? "فارسی" : "Persian"}</SelectItem>
                  <SelectItem value="arabic">{isRTL ? "عربی" : "Arabic"}</SelectItem>
                  <SelectItem value="french">{isRTL ? "فرانسوی" : "French"}</SelectItem>
                  <SelectItem value="german">{isRTL ? "آلمانی" : "German"}</SelectItem>
                  <SelectItem value="spanish">{isRTL ? "اسپانیایی" : "Spanish"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="space-y-2">
              <Label>{isRTL ? "معلم" : "Teacher"}</Label>
              <Select value={teacherFilter} onValueChange={(value: any) => setTeacherFilter(value)}>
                <SelectTrigger data-testid="teacher-filter">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{isRTL ? "همه" : "All"}</SelectItem>
                  <SelectItem value="assigned">{isRTL ? "تعیین شده" : "Assigned"}</SelectItem>
                  <SelectItem value="unassigned">{isRTL ? "تعیین نشده" : "Unassigned"}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={(value: any) => setActiveTab(value)} className="space-y-6">
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="calendar" data-testid="tab-calendar">
            <Calendar className="h-4 w-4 mr-2" />
            {isRTL ? "تقویم" : "Calendar"}
          </TabsTrigger>
          <TabsTrigger value="bookings" data-testid="tab-bookings">
            <BookOpen className="h-4 w-4 mr-2" />
            {isRTL ? "رزروها" : "Bookings"}
          </TabsTrigger>
          <TabsTrigger value="teachers" data-testid="tab-teachers">
            <Users className="h-4 w-4 mr-2" />
            {isRTL ? "معلمان" : "Teachers"}
          </TabsTrigger>
          <TabsTrigger value="notifications" data-testid="tab-notifications">
            <MessageSquare className="h-4 w-4 mr-2" />
            {isRTL ? "اعلان‌ها" : "Notifications"}
          </TabsTrigger>
          <TabsTrigger value="attendance" data-testid="tab-attendance">
            <CheckCircle className="h-4 w-4 mr-2" />
            {isRTL ? "حضور و غیاب" : "Attendance"}
          </TabsTrigger>
          <TabsTrigger value="analytics" data-testid="tab-analytics">
            <BarChart3 className="h-4 w-4 mr-2" />
            {isRTL ? "آمار" : "Analytics"}
          </TabsTrigger>
        </TabsList>

        {/* Calendar Tab */}
        <TabsContent value="calendar" className="space-y-6">
          <TrialLessonCalendar className="w-full" />
        </TabsContent>

        {/* Bookings Tab */}
        <TabsContent value="bookings" className="space-y-6">
          {/* View Mode Toggle */}
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">
              {isRTL ? "مدیریت رزروها" : "Booking Management"}
            </h3>
            <div className="flex items-center space-x-2">
              <Button
                variant={viewMode === 'calendar' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('calendar')}
                data-testid="view-mode-calendar"
              >
                <Grid3X3 className="h-4 w-4 mr-1" />
                {isRTL ? "تقویم" : "Calendar"}
              </Button>
              <Button
                variant={viewMode === 'list' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setViewMode('list')}
                data-testid="view-mode-list"
              >
                <List className="h-4 w-4 mr-1" />
                {isRTL ? "لیست" : "List"}
              </Button>
            </div>
          </div>

          {/* Bookings List */}
          <div className="grid gap-4">
            {trialLessonsLoading ? (
              <div className="grid gap-4">
                {[1, 2, 3].map(i => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-6 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded w-2/3"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : filteredTrialLessons.length === 0 ? (
              <Card>
                <CardContent className="py-8">
                  <div className="text-center">
                    <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-500">
                      {isRTL ? "درس آزمایشی‌ای یافت نشد" : "No trial lessons found"}
                    </p>
                    <Button 
                      className="mt-2"
                      onClick={() => setShowBookingDialog(true)}
                    >
                      {isRTL ? "ایجاد درس آزمایشی" : "Create Trial Lesson"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              filteredTrialLessons.map((lesson) => (
                <Card key={lesson.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-3">
                          <h4 className="text-lg font-semibold">
                            {lesson.studentName || `${lesson.studentFirstName} ${lesson.studentLastName}`.trim()}
                          </h4>
                          <Badge className={getStatusColor(lesson.bookingStatus)}>
                            {lesson.bookingStatus}
                          </Badge>
                          <div className="flex items-center space-x-1 text-sm text-gray-500">
                            {getLessonTypeIcon(lesson.lessonType)}
                            <span>{lesson.lessonType}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                          <div className="flex items-center space-x-2">
                            <CalendarIcon className="h-4 w-4 text-gray-400" />
                            <span>{formatDate(lesson.scheduledDate)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Clock className="h-4 w-4 text-gray-400" />
                            <span>{formatTime(lesson.scheduledStartTime)} - {formatTime(lesson.scheduledEndTime)}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Languages className="h-4 w-4 text-gray-400" />
                            <span>{lesson.targetLanguage}</span>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-3 text-sm">
                          <div className="flex items-center space-x-2">
                            <Phone className="h-4 w-4 text-gray-400" />
                            <span>{lesson.studentPhone}</span>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span>{lesson.studentEmail}</span>
                          </div>
                        </div>
                        
                        {lesson.assignedTeacherName && (
                          <div className="flex items-center space-x-2 mt-3 text-sm">
                            <GraduationCap className="h-4 w-4 text-gray-400" />
                            <span>{isRTL ? "معلم:" : "Teacher:"} {lesson.assignedTeacherName}</span>
                          </div>
                        )}
                        
                        {lesson.notes && (
                          <div className="mt-3 text-sm text-gray-600">
                            <p className="line-clamp-2">{lesson.notes}</p>
                          </div>
                        )}
                      </div>
                      
                      <div className="flex flex-col space-y-2 ml-4">
                        {lesson.bookingStatus === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => confirmTrialLesson.mutate(lesson.id)}
                            disabled={confirmTrialLesson.isPending}
                            data-testid={`confirm-lesson-${lesson.id}`}
                          >
                            <CheckCircle className="h-4 w-4 mr-1" />
                            {isRTL ? "تایید" : "Confirm"}
                          </Button>
                        )}
                        
                        {!lesson.assignedTeacherId && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              setSelectedTrialLesson(lesson);
                              setShowTeacherAssignment(true);
                            }}
                            data-testid={`assign-teacher-${lesson.id}`}
                          >
                            <Users className="h-4 w-4 mr-1" />
                            {isRTL ? "تعیین معلم" : "Assign Teacher"}
                          </Button>
                        )}
                        
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`view-lesson-${lesson.id}`}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          {isRTL ? "جزئیات" : "Details"}
                        </Button>
                        
                        {lesson.bookingStatus !== 'cancelled' && lesson.bookingStatus !== 'completed' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => {
                              if (confirm(isRTL ? "آیا از لغو این درس آزمایشی اطمینان دارید؟" : "Are you sure you want to cancel this trial lesson?")) {
                                cancelTrialLesson.mutate({ 
                                  trialId: lesson.id, 
                                  reason: "Cancelled by front desk"
                                });
                              }
                            }}
                            disabled={cancelTrialLesson.isPending}
                            data-testid={`cancel-lesson-${lesson.id}`}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            {isRTL ? "لغو" : "Cancel"}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        {/* Teachers Tab */}
        <TabsContent value="teachers" className="space-y-6">
          <TeacherAssignmentSystem />
        </TabsContent>

        {/* Notifications Tab */}
        <TabsContent value="notifications" className="space-y-6">
          <NotificationSystem />
        </TabsContent>

        {/* Attendance Tab */}
        <TabsContent value="attendance" className="space-y-6">
          <AttendanceTracking />
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-6">
          <TrialLessonAnalytics />
        </TabsContent>
      </Tabs>

      {/* Booking Dialog */}
      <Dialog open={showBookingDialog} onOpenChange={setShowBookingDialog}>
        <DialogContent className="max-w-[95vw] sm:max-w-3xl md:max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? "رزرو درس آزمایشی جدید" : "New Trial Lesson Booking"}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? 
                "اطلاعات دانشجو و جزئیات درس آزمایشی را وارد کنید" : 
                "Enter student information and trial lesson details"
              }
            </DialogDescription>
          </DialogHeader>
          
          <TrialLessonBookingForm
            selectedDate={selectedDate}
            selectedTime="09:00"
            onSuccess={handleBookingSuccess}
            onCancel={() => setShowBookingDialog(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Teacher Assignment Dialog */}
      <Dialog open={showTeacherAssignment} onOpenChange={setShowTeacherAssignment}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {isRTL ? "تعیین معلم" : "Assign Teacher"}
            </DialogTitle>
            <DialogDescription>
              {isRTL ? 
                "معلم مناسب برای این درس آزمایشی را انتخاب کنید" : 
                "Select an appropriate teacher for this trial lesson"
              }
            </DialogDescription>
          </DialogHeader>
          
          {selectedTrialLesson && (
            <TeacherAssignmentSystem
              trialLessonId={selectedTrialLesson.id}
              onSuccess={handleTeacherAssignmentSuccess}
              onCancel={() => {
                setShowTeacherAssignment(false);
                setSelectedTrialLesson(null);
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}