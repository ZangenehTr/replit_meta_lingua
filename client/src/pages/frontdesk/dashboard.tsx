import React, { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ActionButton } from '@/components/ui/action-button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { 
  Users, 
  Phone, 
  ClipboardList, 
  UserPlus, 
  PhoneCall,
  Calendar,
  CheckCircle,
  AlertCircle,
  Clock,
  Plus,
  Eye,
  Edit,
  Trash2,
  BookOpen,
  GraduationCap,
  Bell,
  BellRing,
  Search,
  Settings,
  Filter,
  Download,
  Upload,
  RefreshCw,
  BarChart3,
  PieChart,
  TrendingUp,
  TrendingDown,
  Star,
  Target,
  Zap,
  Activity,
  MessageSquare,
  Mail,
  Send,
  UserCheck,
  UserX,
  PhoneIncoming,
  PhoneOutgoing,
  PhoneMissed,
  DollarSign,
  CreditCard,
  MapPin,
  Globe,
  Calendar as CalendarIcon,
  ChevronRight,
  ChevronDown,
  MoreHorizontal,
  ExternalLink,
  Copy,
  Share2,
  FileText,
  Printer,
  Languages,
  Moon,
  Sun,
  Maximize2,
  Minimize2,
  Grid3X3,
  List,
  Filter as FilterIcon,
  SortAsc,
  SortDesc,
  ChevronLeft,
  Home,
  Briefcase,
  UserCircle,
  LogOut,
  HelpCircle,
  Archive,
  Flag,
  Bookmark,
  Heart,
  ThumbsUp,
  ThumbsDown,
  Award,
  Shield,
  Database,
  Cloud
} from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { TrialLessonCalendar } from '@/components/trial-lessons/TrialLessonCalendar';
import { AnalyticsView } from '@/components/frontdesk/AnalyticsView';
import { CustomerDetailSidebar } from '@/components/frontdesk/CustomerDetailSidebar';
import { apiRequest } from '@/lib/queryClient';
import { format, parseISO, formatDistanceToNow, isToday, isYesterday, addDays, startOfDay, endOfDay } from 'date-fns';
import { cn } from '@/lib/utils';

// Enhanced interfaces for comprehensive dashboard
interface FrontDeskOperation {
  id: number;
  visitorName: string;
  visitorPhone?: string;
  visitorEmail?: string;
  visitType: string;
  purpose: string;
  status: string;
  priority: string;
  visitedAt: string;
  handledBy: number;
  handlerName?: string;
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
  completedAt?: string;
  followUpRequired?: boolean;
  followUpDate?: string;
  tags: string[];
  interestedLanguage?: string;
  currentLevel?: string;
  budget?: number;
  leadScore?: number;
  conversionProbability?: number;
  notes?: string;
  intakeFormData?: Record<string, any>;
}

interface PhoneCallLog {
  id: number;
  callerName: string;
  callerPhone: string;
  callerEmail?: string;
  callType: 'incoming' | 'outgoing' | 'missed';
  callPurpose: string;
  callResult: string;
  callTime: string;
  callStartTime?: string;
  callEndTime?: string;
  callDuration?: number;
  callNotes?: string;
  actionItems?: string;
  nextSteps?: string;
  customerSatisfaction?: number;
  urgencyLevel: 'low' | 'medium' | 'high' | 'urgent';
  needsFollowUp: boolean;
  followUpDate?: string;
  followUpMethod?: string;
  studentId?: number;
  handledBy: number;
  handlerName?: string;
  tags: string[];
  leadScore?: number;
  conversionStatus?: string;
}

interface FrontDeskTask {
  id: number;
  title: string;
  description: string;
  taskType: 'follow_up_call' | 'sms_campaign' | 'trial_lesson' | 'administrative' | 'payment_reminder' | 'customer_service';
  status: 'pending' | 'in_progress' | 'completed' | 'overdue' | 'cancelled';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  dueDate: string;
  assignedTo: number;
  assignedToName?: string;
  createdBy: number;
  createdByName?: string;
  contactName?: string;
  contactPhone?: string;
  contactEmail?: string;
  relatedOperationId?: number;
  relatedCallId?: number;
  estimatedDuration?: number;
  actualDuration?: number;
  completedAt?: string;
  notes?: string;
  tags: string[];
  reminderSent?: boolean;
  attachments?: string[];
}

interface Notification {
  id: number;
  type: 'info' | 'warning' | 'error' | 'success';
  title: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
  category: 'task' | 'call' | 'walk_in' | 'trial' | 'system' | 'sms';
  priority: 'low' | 'medium' | 'high';
  expiresAt?: string;
}

interface PerformanceMetrics {
  today: {
    operationsProcessed: number;
    callsHandled: number;
    tasksCompleted: number;
    conversionRate: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  };
  week: {
    operationsProcessed: number;
    callsHandled: number;
    tasksCompleted: number;
    conversionRate: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  };
  month: {
    operationsProcessed: number;
    callsHandled: number;
    tasksCompleted: number;
    conversionRate: number;
    averageResponseTime: number;
    customerSatisfaction: number;
  };
  targets: {
    dailyOperations: number;
    dailyCalls: number;
    dailyTasks: number;
    conversionRate: number;
    responseTime: number;
    satisfaction: number;
  };
}

interface FollowUp {
  id: number;
  type: 'walk_in' | 'phone_call' | 'trial_lesson' | 'payment_reminder';
  customerName: string;
  customerPhone: string;
  customerEmail?: string;
  originalInteractionDate: string;
  dueDate: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'pending' | 'attempted' | 'completed' | 'rescheduled';
  leadScore: number;
  conversionProbability: number;
  lastContactAttempt?: string;
  contactAttempts: number;
  maxAttempts: number;
  preferredContactMethod: 'phone' | 'email' | 'sms';
  bestTimeToContact?: string;
  notes?: string;
  tags: string[];
  assignedTo: number;
  assignedToName?: string;
}

interface TrialLesson {
  id: number;
  studentName: string;
  studentPhone: string;
  studentEmail?: string;
  language: string;
  level: string;
  scheduledDate: string;
  scheduledTime: string;
  duration: number;
  teacherId: number;
  teacherName: string;
  status: 'scheduled' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  location: string;
  type: 'in_person' | 'online';
  notes?: string;
  preparationCompleted: boolean;
  reminderSent: boolean;
  followUpRequired: boolean;
  conversionStatus?: 'enrolled' | 'thinking' | 'not_interested';
}

interface CustomerInteraction {
  id: number;
  type: 'phone_call' | 'walk_in' | 'email' | 'sms' | 'task';
  customerName: string;
  customerPhone?: string;
  customerEmail?: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  handledBy: number;
  handlerName: string;
  notes?: string;
  tags: string[];
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
  followUpRequired?: boolean;
  followUpDate?: string;
  leadScore?: number;
  customerSatisfaction?: number;
}

interface DashboardWidgetConfig {
  id: string;
  type: 'metrics' | 'tasks' | 'notifications' | 'followups' | 'trials' | 'analytics';
  title: string;
  size: 'small' | 'medium' | 'large';
  position: { x: number; y: number };
  visible: boolean;
  settings?: Record<string, any>;
}

interface QuickAction {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  action: () => void;
  category: 'call' | 'sms' | 'walk_in' | 'task' | 'trial' | 'emergency';
  description: string;
  shortcut?: string;
}

export default function FrontDeskDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  // Dashboard state management
  const [selectedView, setSelectedView] = useState<'overview' | 'tasks' | 'followups' | 'trials' | 'analytics'>('overview');
  const [layoutMode, setLayoutMode] = useState<'grid' | 'list'>('grid');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [selectedCustomer, setSelectedCustomer] = useState<string | null>(null);
  const [customerInteractions, setCustomerInteractions] = useState<CustomerInteraction[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentTime, setCurrentTime] = useState(new Date());
  const [isRTL, setIsRTL] = useState(false);
  const [notificationSettings, setNotificationSettings] = useState({
    sound: true,
    desktop: true,
    email: false,
    sms: false,
  });
  
  // Filters and sorting
  const [taskFilter, setTaskFilter] = useState<'all' | 'pending' | 'overdue' | 'completed'>('all');
  const [followUpFilter, setFollowUpFilter] = useState<'all' | 'urgent' | 'today' | 'this_week'>('all');
  const [priorityFilter, setPriorityFilter] = useState<'all' | 'high' | 'medium' | 'low'>('all');

  // Real-time clock update
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey || event.metaKey) {
        switch (event.key) {
          case 'n':
            event.preventDefault();
            setLocation('/frontdesk/walk-in-intake');
            break;
          case 'c':
            event.preventDefault();
            setLocation('/frontdesk/call-logging');
            break;
          case 't':
            event.preventDefault();
            setSelectedView('tasks');
            break;
          case 'f':
            event.preventDefault();
            setSelectedView('followups');
            break;
          case '/':
            event.preventDefault();
            document.getElementById('search-input')?.focus();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [setLocation]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk'] });
    }, 30000);
    return () => clearInterval(interval);
  }, [queryClient]);

  // Enhanced data fetching with comprehensive dashboard features
  const { data: operations = [], isLoading: operationsLoading, refetch: refetchOperations } = useQuery({
    queryKey: ['/api/front-desk/operations'],
    queryFn: () => fetch('/api/front-desk/operations', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: calls = [], isLoading: callsLoading, refetch: refetchCalls } = useQuery({
    queryKey: ['/api/front-desk/calls'],
    queryFn: () => fetch('/api/front-desk/calls', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: todayTasks = [], isLoading: tasksLoading, refetch: refetchTasks } = useQuery({
    queryKey: ['/api/front-desk/tasks/today'],
    queryFn: () => fetch('/api/front-desk/tasks/today', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: overdueTasks = [], refetch: refetchOverdue } = useQuery({
    queryKey: ['/api/front-desk/tasks/overdue'],
    queryFn: () => fetch('/api/front-desk/tasks/overdue', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: followUps = [], isLoading: followUpsLoading } = useQuery({
    queryKey: ['/api/front-desk/followups'],
    queryFn: () => fetch('/api/front-desk/followups', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: todayTrials = [], isLoading: trialsLoading } = useQuery({
    queryKey: ['/api/front-desk/trials/today'],
    queryFn: () => fetch('/api/front-desk/trials/today', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: notifications = [], isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/front-desk/notifications'],
    queryFn: () => fetch('/api/front-desk/notifications', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  const { data: performanceMetrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['/api/front-desk/metrics'],
    queryFn: () => fetch('/api/front-desk/metrics', {
      headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
    }).then(res => res.json())
  });

  // Enhanced stats calculations with comprehensive metrics
  const dashboardStats = useMemo(() => {
    const today = new Date();
    const todayStr = today.toDateString();

    const pendingOperations = operations.filter((op: FrontDeskOperation) => 
      op.status === 'pending' || op.status === 'in_progress'
    ).length;

    const completedToday = operations.filter((op: FrontDeskOperation) => 
      op.status === 'completed' && 
      new Date(op.completedAt || '').toDateString() === todayStr
    ).length;

    const callsToday = calls.filter((call: PhoneCallLog) => 
      new Date(call.callTime).toDateString() === todayStr
    ).length;

    const urgentFollowUps = followUps.filter((followUp: FollowUp) => 
      followUp.priority === 'urgent' && followUp.status === 'pending'
    ).length;

    const todayTrialsCount = todayTrials.length;
    const confirmedTrials = todayTrials.filter((trial: TrialLesson) => 
      trial.status === 'confirmed'
    ).length;

    const conversionRate = operations.length > 0 ? 
      (operations.filter((op: FrontDeskOperation) => op.convertedToLead || op.convertedToStudent).length / operations.length) * 100 : 0;

    const averageResponseTime = calls.length > 0 ? 
      calls.reduce((sum: number, call: PhoneCallLog) => sum + (call.callDuration || 0), 0) / calls.length : 0;

    const unreadNotifications = notifications.filter((notif: Notification) => !notif.isRead).length;
    const priorityNotifications = notifications.filter((notif: Notification) => 
      !notif.isRead && notif.priority === 'high'
    ).length;

    return {
      pendingOperations,
      completedToday,
      callsToday,
      urgentFollowUps,
      todayTrialsCount,
      confirmedTrials,
      conversionRate,
      averageResponseTime,
      unreadNotifications,
      priorityNotifications,
      overdueTasks: overdueTasks.length,
      totalTasks: todayTasks.length + overdueTasks.length
    };
  }, [operations, calls, followUps, todayTrials, notifications, overdueTasks, todayTasks]);

  // Quick actions configuration
  const quickActions: QuickAction[] = useMemo(() => [
    {
      id: 'new-walk-in',
      label: isRTL ? 'ورودی جدید' : 'New Walk-in',
      icon: UserPlus,
      action: () => setLocation('/frontdesk/walk-in-intake'),
      category: 'walk_in',
      description: isRTL ? 'ثبت مراجع جدید' : 'Register new walk-in visitor',
      shortcut: 'Ctrl+N'
    },
    {
      id: 'log-call',
      label: isRTL ? 'ثبت تماس' : 'Log Call',
      icon: PhoneCall,
      action: () => setLocation('/frontdesk/call-logging'),
      category: 'call',
      description: isRTL ? 'ثبت تماس تلفنی' : 'Log phone call interaction',
      shortcut: 'Ctrl+C'
    },
    {
      id: 'sms-templates',
      label: isRTL ? 'قالب‌های پیامک' : 'SMS Templates',
      icon: MessageSquare,
      action: () => setLocation('/frontdesk/sms-templates'),
      category: 'sms',
      description: isRTL ? 'مدیریت قالب‌های پیامک' : 'Manage SMS templates'
    },
    {
      id: 'schedule-trial',
      label: isRTL ? 'کلاس آزمایشی' : 'Schedule Trial',
      icon: Calendar,
      action: () => setLocation('/frontdesk/trial-scheduling'),
      category: 'trial',
      description: isRTL ? 'برنامه‌ریزی کلاس آزمایشی' : 'Schedule trial lesson'
    },
    {
      id: 'create-task',
      label: isRTL ? 'وظیفه جدید' : 'New Task',
      icon: Plus,
      action: () => setShowQuickActions(true),
      category: 'task',
      description: isRTL ? 'ایجاد وظیفه جدید' : 'Create new task'
    },
    {
      id: 'emergency',
      label: isRTL ? 'اضطراری' : 'Emergency',
      icon: AlertCircle,
      action: () => toast({
        title: isRTL ? 'ارتباط اضطراری' : 'Emergency Contact',
        description: isRTL ? 'مدیر اطلاع داده شد' : 'Supervisor has been notified',
        variant: 'destructive'
      }),
      category: 'emergency',
      description: isRTL ? 'ارتباط اضطراری با مدیر' : 'Emergency supervisor contact'
    }
  ], [isRTL, setLocation, toast]);

  // Helper functions for styling and formatting
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'overdue':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'high':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200';
    }
  };

  const formatTime = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleTimeString(isRTL ? 'fa-IR' : 'en-US', {
      hour: '2-digit',
      minute: '2-digit',
      hour12: !isRTL
    });
  };

  const formatDate = (date: Date | string) => {
    const d = typeof date === 'string' ? new Date(date) : date;
    return d.toLocaleDateString(isRTL ? 'fa-IR' : 'en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Notification management
  const markNotificationRead = useMutation({
    mutationFn: (notificationId: number) => 
      apiRequest(`/api/front-desk/notifications/${notificationId}/read`, { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/notifications'] });
    }
  });

  const markAllNotificationsRead = useMutation({
    mutationFn: () => 
      apiRequest('/api/front-desk/notifications/mark-all-read', { method: 'POST' }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/notifications'] });
    }
  });

  // Task management mutations
  const updateTaskStatus = useMutation({
    mutationFn: ({ taskId, status }: { taskId: number; status: string }) =>
      apiRequest(`/api/front-desk/tasks/${taskId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ status })
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/front-desk/tasks'] });
      toast({
        title: isRTL ? 'وضعیت وظیفه به‌روزرسانی شد' : 'Task Status Updated',
        description: isRTL ? 'وضعیت وظیفه با موفقیت تغییر یافت' : 'Task status has been updated successfully',
      });
    }
  });

  // Main dashboard UI starts here
  return (
    <div className={cn(
      "min-h-screen bg-gray-50 dark:bg-gray-900",
      isRTL && "rtl"
    )} data-testid="front-desk-dashboard">
      {/* Header Section */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
        <div className="px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Left side - Title and breadcrumb */}
            <div className="flex items-center space-x-4">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {isRTL ? 'مرکز فرمان پذیرش' : 'Front Desk Command Center'}
                </h1>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {isRTL ? 
                    `${formatTime(currentTime)} - ${user?.firstName} ${user?.lastName}` :
                    `${formatTime(currentTime)} - ${user?.firstName} ${user?.lastName}`
                  }
                </p>
              </div>
            </div>

            {/* Center - Search */}
            <div className="hidden md:block flex-1 max-w-lg mx-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  id="search-input"
                  type="text"
                  placeholder={isRTL ? 'جستجو در سیستم...' : 'Search across systems...'}
                  className="pl-10 bg-gray-100 dark:bg-gray-700 border-0"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            {/* Right side - Actions and notifications */}
            <div className="flex items-center space-x-3">
              {/* Language toggle */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsRTL(!isRTL)}
                className="hidden sm:flex"
              >
                <Languages className="h-4 w-4" />
                <span className="ml-2">{isRTL ? 'EN' : 'فا'}</span>
              </Button>

              {/* Quick actions */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <Zap className="h-4 w-4" />
                    <span className="hidden sm:inline ml-2">
                      {isRTL ? 'اقدامات سریع' : 'Quick Actions'}
                    </span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-64">
                  <DropdownMenuLabel>
                    {isRTL ? 'اقدامات سریع' : 'Quick Actions'}
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  {quickActions.slice(0, 4).map((action) => {
                    const Icon = action.icon;
                    return (
                      <DropdownMenuItem
                        key={action.id}
                        onClick={action.action}
                        className="flex items-center space-x-2"
                      >
                        <Icon className="h-4 w-4" />
                        <div className="flex-1">
                          <div className="font-medium">{action.label}</div>
                          <div className="text-xs text-gray-500">{action.description}</div>
                        </div>
                        {action.shortcut && (
                          <kbd className="text-xs bg-gray-100 px-1 rounded">
                            {action.shortcut}
                          </kbd>
                        )}
                      </DropdownMenuItem>
                    );
                  })}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Notifications */}
              <Sheet open={showNotifications} onOpenChange={setShowNotifications}>
                <SheetTrigger asChild>
                  <Button variant="ghost" size="sm" className="relative">
                    <Bell className="h-4 w-4" />
                    {dashboardStats.unreadNotifications > 0 && (
                      <Badge className="absolute -top-1 -right-1 h-5 w-5 p-0 text-xs bg-red-500">
                        {dashboardStats.unreadNotifications > 99 ? '99+' : dashboardStats.unreadNotifications}
                      </Badge>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent className="w-96">
                  <SheetHeader>
                    <div className="flex items-center justify-between">
                      <SheetTitle>{isRTL ? 'اعلان‌ها' : 'Notifications'}</SheetTitle>
                      {dashboardStats.unreadNotifications > 0 && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => markAllNotificationsRead.mutate()}
                        >
                          {isRTL ? 'همه را خوانده علامت‌گذاری کن' : 'Mark all read'}
                        </Button>
                      )}
                    </div>
                  </SheetHeader>
                  <ScrollArea className="h-[calc(100vh-120px)] mt-4">
                    <div className="space-y-3">
                      {notifications.map((notification: Notification) => (
                        <Card
                          key={notification.id}
                          className={cn(
                            "p-3 cursor-pointer transition-colors",
                            !notification.isRead && "bg-blue-50 dark:bg-blue-950 border-blue-200"
                          )}
                          onClick={() => markNotificationRead.mutate(notification.id)}
                        >
                          <div className="flex items-start space-x-3">
                            <div className={cn(
                              "w-2 h-2 rounded-full mt-2",
                              notification.type === 'error' && "bg-red-500",
                              notification.type === 'warning' && "bg-yellow-500", 
                              notification.type === 'success' && "bg-green-500",
                              notification.type === 'info' && "bg-blue-500"
                            )} />
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h4 className="font-medium text-sm">{notification.title}</h4>
                                <span className="text-xs text-gray-500">
                                  {formatDistanceToNow(parseISO(notification.timestamp), { addSuffix: true })}
                                </span>
                              </div>
                              <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                {notification.message}
                              </p>
                              {notification.actionLabel && notification.actionUrl && (
                                <Button
                                  variant="link"
                                  size="sm"
                                  className="p-0 h-auto text-blue-600"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    setLocation(notification.actionUrl!);
                                  }}
                                >
                                  {notification.actionLabel}
                                </Button>
                              )}
                            </div>
                          </div>
                        </Card>
                      ))}
                      {notifications.length === 0 && (
                        <div className="text-center py-8 text-gray-500">
                          <Bell className="h-12 w-12 mx-auto mb-3 opacity-50" />
                          <p>{isRTL ? 'اعلانی موجود نیست' : 'No notifications'}</p>
                        </div>
                      )}
                    </div>
                  </ScrollArea>
                </SheetContent>
              </Sheet>

              {/* Settings */}
              <Button variant="ghost" size="sm">
                <Settings className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Dashboard Content */}
      <div className="flex-1 overflow-hidden">
        <div className="h-full flex">
          {/* Sidebar Navigation */}
          <div className="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 hidden lg:block">
            <nav className="mt-4 px-4">
              <div className="space-y-1">
                {[
                  { id: 'overview', label: isRTL ? 'نمای کلی' : 'Overview', icon: Home },
                  { id: 'tasks', label: isRTL ? 'وظایف' : 'Tasks', icon: ClipboardList },
                  { id: 'followups', label: isRTL ? 'پیگیری‌ها' : 'Follow-ups', icon: Phone },
                  { id: 'trials', label: isRTL ? 'کلاس‌های آزمایشی' : 'Trial Lessons', icon: Calendar },
                  { id: 'analytics', label: isRTL ? 'تحلیل‌ها' : 'Analytics', icon: BarChart3 }
                ].map((item) => {
                  const Icon = item.icon;
                  return (
                    <button
                      key={item.id}
                      onClick={() => setSelectedView(item.id as any)}
                      className={cn(
                        "w-full flex items-center px-3 py-2 text-sm font-medium rounded-md",
                        selectedView === item.id
                          ? "bg-blue-100 text-blue-900 dark:bg-blue-900 dark:text-blue-100"
                          : "text-gray-600 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-700"
                      )}
                    >
                      <Icon className="mr-3 h-5 w-5" />
                      {item.label}
                    </button>
                  );
                })}
              </div>
            </nav>
          </div>

          {/* Main Content Area */}
          <div className="flex-1 overflow-y-auto">
            <div className="p-6">{renderSelectedView()}</div>
          </div>
        </div>
      </div>

      {/* Customer Detail Sidebar */}
      {selectedCustomer && (
        <CustomerDetailSidebar
          customerKey={selectedCustomer}
          interactions={customerInteractions}
          onClose={() => setSelectedCustomer(null)}
          onInteractionSelect={(interaction) => {
            // Handle interaction selection
            console.log('Selected interaction:', interaction);
          }}
        />
      )}
    </div>
  );

  // Render functions for different views
  function renderSelectedView() {
    switch (selectedView) {
      case 'overview':
        return renderOverviewDashboard();
      case 'tasks':
        return renderTaskManagement();
      case 'followups':
        return renderFollowUpTracking();
      case 'trials':
        return renderTrialSchedule();
      case 'analytics':
        return renderAnalytics();
      default:
        return renderOverviewDashboard();
    }
  }

  function renderOverviewDashboard() {
    return (
      <div className="space-y-6">
        {/* Key Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'عملیات در انتظار' : 'Pending Operations'}
              </CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600" data-testid="stat-pending-operations">
                {dashboardStats.pendingOperations}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'مراجعان نیازمند توجه' : 'Walk-ins needing attention'}
              </p>
              <div className="mt-2">
                <Progress value={(dashboardStats.pendingOperations / 10) * 100} className="h-2" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'تماس‌های امروز' : "Today's Calls"}
              </CardTitle>
              <Phone className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600" data-testid="stat-calls-today">
                {dashboardStats.callsToday}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'تماس‌های انجام شده' : 'Phone calls handled'}
              </p>
              <div className="flex items-center mt-2">
                {dashboardStats.callsToday > 20 ? (
                  <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500 mr-1" />
                )}
                <span className="text-xs text-gray-500">
                  {isRTL ? 'نسبت به دیروز' : 'vs yesterday'}
                </span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'پیگیری‌های فوری' : 'Urgent Follow-ups'}
              </CardTitle>
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600" data-testid="stat-urgent-followups">
                {dashboardStats.urgentFollowUps}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'نیازمند اقدام فوری' : 'Require immediate action'}
              </p>
              {dashboardStats.urgentFollowUps > 0 && (
                <Button size="sm" className="mt-2 w-full" onClick={() => setSelectedView('followups')}>
                  {isRTL ? 'مشاهده همه' : 'View All'}
                </Button>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                {isRTL ? 'کلاس‌های آزمایشی امروز' : "Today's Trials"}
              </CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600" data-testid="stat-today-trials">
                {dashboardStats.confirmedTrials}/{dashboardStats.todayTrialsCount}
              </div>
              <p className="text-xs text-muted-foreground">
                {isRTL ? 'تأیید شده از کل' : 'Confirmed of total'}
              </p>
              <div className="mt-2">
                <Progress 
                  value={dashboardStats.todayTrialsCount > 0 ? (dashboardStats.confirmedTrials / dashboardStats.todayTrialsCount) * 100 : 0} 
                  className="h-2"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activity and Quick Stats */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Recent Operations */}
          <Card className="lg:col-span-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>{isRTL ? 'عملیات اخیر' : 'Recent Operations'}</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setLocation('/frontdesk/walk-in-intake')}>
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isRTL ? 'ورودی جدید' : 'New Walk-in'}
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {operations.slice(0, 5).map((operation: FrontDeskOperation) => (
                  <div
                    key={operation.id}
                    className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => {
                      setSelectedCustomer(operation.visitorName);
                      // Set customer interactions
                    }}
                  >
                    <div className="flex-1">
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-blue-500 text-white text-sm">
                            {operation.visitorName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h4 className="font-medium">{operation.visitorName}</h4>
                          <p className="text-sm text-gray-500">
                            {operation.interestedLanguage} • {formatTime(operation.visitedAt)}
                          </p>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge className={getStatusColor(operation.status)}>
                        {operation.status.replace('_', ' ')}
                      </Badge>
                      {operation.priority === 'high' && (
                        <Badge variant="destructive" className="text-xs">
                          {isRTL ? 'فوری' : 'Urgent'}
                        </Badge>
                      )}
                      <ChevronRight className="h-4 w-4 text-gray-400" />
                    </div>
                  </div>
                ))}
                {operations.length === 0 && (
                  <div className="text-center py-8 text-gray-500">
                    <Users className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p>{isRTL ? 'هنوز عملیاتی ثبت نشده' : 'No operations recorded yet'}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Today's Performance */}
          <Card>
            <CardHeader>
              <CardTitle>{isRTL ? 'عملکرد امروز' : "Today's Performance"}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{isRTL ? 'نرخ تبدیل' : 'Conversion Rate'}</span>
                  <span className="font-medium">{dashboardStats.conversionRate.toFixed(1)}%</span>
                </div>
                <Progress value={dashboardStats.conversionRate} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{isRTL ? 'پاسخ‌گویی متوسط' : 'Avg Response'}</span>
                  <span className="font-medium">{Math.round(dashboardStats.averageResponseTime)} {isRTL ? 'ثانیه' : 'sec'}</span>
                </div>
                <Progress value={Math.min((dashboardStats.averageResponseTime / 300) * 100, 100)} className="h-2" />
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{isRTL ? 'تکمیل وظایف' : 'Task Completion'}</span>
                  <span className="font-medium">
                    {dashboardStats.totalTasks > 0 ? 
                      Math.round(((dashboardStats.totalTasks - dashboardStats.overdueTasks) / dashboardStats.totalTasks) * 100) : 100
                    }%
                  </span>
                </div>
                <Progress 
                  value={dashboardStats.totalTasks > 0 ? 
                    ((dashboardStats.totalTasks - dashboardStats.overdueTasks) / dashboardStats.totalTasks) * 100 : 100
                  } 
                  className="h-2" 
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <h4 className="font-medium text-sm">{isRTL ? 'اهداف روزانه' : 'Daily Goals'}</h4>
                {performanceMetrics?.targets && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-xs">
                      <span>{isRTL ? 'عملیات' : 'Operations'}</span>
                      <span>{dashboardStats.completedToday}/{performanceMetrics.targets.dailyOperations}</span>
                    </div>
                    <Progress 
                      value={(dashboardStats.completedToday / performanceMetrics.targets.dailyOperations) * 100} 
                      className="h-1" 
                    />
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  function renderTaskManagement() {
    const filteredTasks = todayTasks.filter((task: FrontDeskTask) => {
      if (taskFilter === 'all') return true;
      if (taskFilter === 'overdue') return overdueTasks.includes(task);
      return task.status === taskFilter;
    });

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <h2 className="text-2xl font-bold">{isRTL ? 'مدیریت وظایف' : 'Task Management'}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'مدیریت و پیگیری وظایف روزانه' : 'Manage and track daily tasks'}
            </p>
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={taskFilter} onValueChange={(value: any) => setTaskFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'همه' : 'All'}</SelectItem>
                <SelectItem value="pending">{isRTL ? 'در انتظار' : 'Pending'}</SelectItem>
                <SelectItem value="overdue">{isRTL ? 'عقب‌افتاده' : 'Overdue'}</SelectItem>
                <SelectItem value="completed">{isRTL ? 'تکمیل شده' : 'Completed'}</SelectItem>
              </SelectContent>
            </Select>
            
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              {isRTL ? 'وظیفه جدید' : 'New Task'}
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Task List */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'وظایف امروز' : "Today's Tasks"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {filteredTasks.map((task: FrontDeskTask) => (
                    <div
                      key={task.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      <div className="flex items-center space-x-3">
                        <input
                          type="checkbox"
                          checked={task.status === 'completed'}
                          onChange={() => updateTaskStatus.mutate({
                            taskId: task.id,
                            status: task.status === 'completed' ? 'pending' : 'completed'
                          })}
                          className="w-4 h-4 text-blue-600 rounded"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <h4 className={cn(
                              "font-medium",
                              task.status === 'completed' && "line-through text-gray-500"
                            )}>
                              {task.title}
                            </h4>
                            <Badge className={getPriorityColor(task.priority)} variant="secondary">
                              {task.priority}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600 mt-1">{task.description}</p>
                          {task.contactName && (
                            <p className="text-xs text-gray-500 mt-1">
                              {isRTL ? 'تماس:' : 'Contact:'} {task.contactName}
                            </p>
                          )}
                          <p className="text-xs text-gray-500 mt-1">
                            {isRTL ? 'مهلت:' : 'Due:'} {formatDate(task.dueDate)}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Button variant="ghost" size="sm">
                          <Edit className="h-4 w-4" />
                        </Button>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent>
                            <DropdownMenuItem>
                              {isRTL ? 'ویرایش' : 'Edit'}
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                              {isRTL ? 'تخصیص مجدد' : 'Reassign'}
                            </DropdownMenuItem>
                            <DropdownMenuItem className="text-red-600">
                              {isRTL ? 'حذف' : 'Delete'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  ))}
                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <ClipboardList className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{isRTL ? 'وظیفه‌ای موجود نیست' : 'No tasks found'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Task Summary */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'خلاصه وظایف' : 'Task Summary'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm">{isRTL ? 'کل وظایف' : 'Total Tasks'}</span>
                  <span className="font-bold text-lg">{dashboardStats.totalTasks}</span>
                </div>
                <Separator />
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span>{isRTL ? 'تکمیل شده' : 'Completed'}</span>
                    <span className="text-green-600 font-medium">
                      {dashboardStats.totalTasks - dashboardStats.overdueTasks}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>{isRTL ? 'عقب‌افتاده' : 'Overdue'}</span>
                    <span className="text-red-600 font-medium">{dashboardStats.overdueTasks}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Task Actions */}
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'اقدامات سریع' : 'Quick Actions'}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {quickActions.filter(action => action.category === 'task').map((action) => {
                  const Icon = action.icon;
                  return (
                    <Button
                      key={action.id}
                      variant="outline"
                      className="w-full justify-start"
                      onClick={action.action}
                    >
                      <Icon className="h-4 w-4 mr-2" />
                      {action.label}
                    </Button>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderFollowUpTracking() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isRTL ? 'پیگیری مشتریان' : 'Follow-up Tracking'}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'مدیریت و پیگیری مشتریان بالقوه' : 'Manage and track potential customers'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Select value={followUpFilter} onValueChange={(value: any) => setFollowUpFilter(value)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{isRTL ? 'همه' : 'All'}</SelectItem>
                <SelectItem value="urgent">{isRTL ? 'فوری' : 'Urgent'}</SelectItem>
                <SelectItem value="today">{isRTL ? 'امروز' : 'Today'}</SelectItem>
                <SelectItem value="this_week">{isRTL ? 'این هفته' : 'This Week'}</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRTL ? 'پیگیری‌های فوری' : 'Urgent Follow-ups'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">{dashboardStats.urgentFollowUps}</div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRTL ? 'پیگیری‌های امروز' : "Today's Follow-ups"}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">
                {followUps.filter((f: FollowUp) => isToday(new Date(f.dueDate))).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRTL ? 'نرخ موفقیت' : 'Success Rate'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                {followUps.length > 0 ? 
                  Math.round((followUps.filter((f: FollowUp) => f.status === 'completed').length / followUps.length) * 100) : 0
                }%
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">{isRTL ? 'میانگین امتیاز' : 'Avg Lead Score'}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {followUps.length > 0 ? 
                  Math.round(followUps.reduce((sum: number, f: FollowUp) => sum + f.leadScore, 0) / followUps.length) : 0
                }
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isRTL ? 'لیست پیگیری‌ها' : 'Follow-up List'}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {followUps.map((followUp: FollowUp) => (
                <div
                  key={followUp.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-blue-500 text-white">
                        {followUp.customerName.charAt(0)}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <h4 className="font-medium">{followUp.customerName}</h4>
                      <p className="text-sm text-gray-500">{followUp.customerPhone}</p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge className={getPriorityColor(followUp.priority)} variant="secondary">
                          {followUp.priority}
                        </Badge>
                        <span className="text-xs text-gray-500">
                          {isRTL ? 'امتیاز:' : 'Score:'} {followUp.leadScore}/100
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="text-sm font-medium">
                        {formatDate(followUp.dueDate)}
                      </p>
                      <p className="text-xs text-gray-500">
                        {isRTL ? 'تلاش:' : 'Attempts:'} {followUp.contactAttempts}/{followUp.maxAttempts}
                      </p>
                    </div>
                    <Button size="sm" variant="outline">
                      <Phone className="h-4 w-4" />
                    </Button>
                    <Button size="sm" variant="outline">
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {followUps.length === 0 && (
                <div className="text-center py-8 text-gray-500">
                  <Target className="h-12 w-12 mx-auto mb-3 opacity-50" />
                  <p>{isRTL ? 'پیگیری‌ای موجود نیست' : 'No follow-ups available'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  function renderTrialSchedule() {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isRTL ? 'کلاس‌های آزمایشی' : 'Trial Lessons'}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'مدیریت برنامه کلاس‌های آزمایشی' : 'Manage trial lesson schedule'}
            </p>
          </div>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            {isRTL ? 'کلاس آزمایشی جدید' : 'New Trial Lesson'}
          </Button>
        </div>

        {/* Today's Trials Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'کل امروز' : 'Total Today'}</p>
                  <p className="text-2xl font-bold">{dashboardStats.todayTrialsCount}</p>
                </div>
                <Calendar className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'تأیید شده' : 'Confirmed'}</p>
                  <p className="text-2xl font-bold text-green-600">{dashboardStats.confirmedTrials}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'در انتظار' : 'Pending'}</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {todayTrials.filter((t: TrialLesson) => t.status === 'scheduled').length}
                  </p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">{isRTL ? 'نرخ حضور' : 'Attendance Rate'}</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {todayTrials.length > 0 ? 
                      Math.round((todayTrials.filter((t: TrialLesson) => t.status === 'completed').length / todayTrials.length) * 100) : 0
                    }%
                  </p>
                </div>
                <Award className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Trial Lessons Calendar/List */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <TrialLessonCalendar />
          </div>
          
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{isRTL ? 'کلاس‌های امروز' : "Today's Lessons"}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todayTrials.map((trial: TrialLesson) => (
                    <div key={trial.id} className="p-3 border rounded-lg">
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="font-medium">{trial.studentName}</h4>
                        <Badge className={getStatusColor(trial.status)}>
                          {trial.status}
                        </Badge>
                      </div>
                      <div className="text-sm text-gray-600 space-y-1">
                        <p>{trial.language} • {trial.level}</p>
                        <p>{trial.teacherName}</p>
                        <p>{formatTime(trial.scheduledTime)}</p>
                      </div>
                      <div className="flex items-center gap-2 mt-2">
                        <Button size="sm" variant="outline">
                          <Phone className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <MessageSquare className="h-3 w-3" />
                        </Button>
                        <Button size="sm" variant="outline">
                          <Edit className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                  {todayTrials.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Calendar className="h-12 w-12 mx-auto mb-3 opacity-50" />
                      <p>{isRTL ? 'کلاس آزمایشی امروز نداریم' : 'No trials scheduled for today'}</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  function renderAnalytics() {
    const analyticsData = {
      totalInteractions: operations.length + calls.length,
      conversionRate: dashboardStats.conversionRate,
      averageResponseTime: dashboardStats.averageResponseTime,
      topPerformers: [],
      conversionFunnel: [],
      interactionTrends: [],
      sourceAttribution: [],
      channelPerformance: [],
      timeDistribution: [],
      outcomeBreakdown: []
    };

    const interactions = [
      ...operations.map(op => ({
        id: op.id,
        type: 'walk_in' as const,
        customerName: op.visitorName,
        interactionTime: op.visitedAt,
        status: op.status,
        outcome: op.status,
        urgencyLevel: op.priority || 'medium',
        convertedToLead: op.convertedToLead,
        convertedToStudent: op.convertedToStudent
      })),
      ...calls.map(call => ({
        id: call.id,
        type: 'phone_call' as const,
        customerName: call.callerName,
        interactionTime: call.callTime,
        status: call.callResult,
        outcome: call.callResult,
        urgencyLevel: call.urgencyLevel,
        convertedToLead: false,
        convertedToStudent: false
      }))
    ];

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{isRTL ? 'تحلیل‌ها و گزارش‌ها' : 'Analytics & Reports'}</h2>
            <p className="text-gray-600 dark:text-gray-400">
              {isRTL ? 'تحلیل عملکرد و آمار دقیق' : 'Performance analysis and detailed metrics'}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline">
              <Download className="h-4 w-4 mr-2" />
              {isRTL ? 'دانلود گزارش' : 'Export Report'}
            </Button>
            <Button variant="outline">
              <Printer className="h-4 w-4 mr-2" />
              {isRTL ? 'چاپ' : 'Print'}
            </Button>
          </div>
        </div>

        <AnalyticsView
          analytics={analyticsData}
          interactions={interactions}
          loading={operationsLoading || callsLoading}
          dateRange={{ from: startOfDay(new Date()), to: endOfDay(new Date()) }}
        />
      </div>
    );
  }
}