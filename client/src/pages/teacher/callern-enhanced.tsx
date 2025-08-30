import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VideoCall } from "@/components/callern/VideoCall";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";
import { TeacherIncomingCall } from "@/components/callern/teacher-incoming-call";
import { TeacherOnlineToggle } from "@/components/callern/teacher-online-toggle";
import { TeacherRingtoneSettings } from "@/components/callern/teacher-ringtone-settings";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Video,
  Clock,
  Calendar,
  User,
  Star,
  CheckCircle,
  XCircle,
  History,
  Wifi,
  WifiOff,
  AlertCircle,
  Phone,
  PhoneOff,
  Headphones,
  Users,
  BookOpen,
  TrendingUp,
  Sun,
  Sunset,
  Moon,
  Sunrise,
  DollarSign,
  FileVideo,
  FileText,
  Package,
  Trophy,
  ShieldAlert,
  MessageCircle,
  Mic,
  MicOff,
  Signal,
  SignalHigh,
  SignalLow,
  SignalZero,
  Award,
  Download,
  Eye,
  EyeOff,
  LifeBuoy,
  Volume2
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallHistory {
  id: number;
  studentId: number;
  duration: number;
  callType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  studentName?: string;
  recordingUrl?: string;
  transcriptUrl?: string;
  contentBundleUrl?: string;
  studentRating?: number;
  supervisorRating?: number;
  teacherConnectionQuality?: string;
  studentConnectionQuality?: string;
  feedback?: string;
}

interface CurrentStudent {
  id: number;
  firstName?: string;
  lastName?: string;
  level: string;
  packageName: string;
  remainingMinutes: number;
  totalSessions: number;
}

interface TeacherStats {
  dailyCalls: number;
  weeklyCalls: number;
  monthlyCalls: number;
  dailyMinutes: number;
  weeklyMinutes: number;
  monthlyMinutes: number;
  averageRating: number;
  totalRatings: number;
  missedShifts: number;
  missedCalls: number;
  hourlyRate: number;
  monthlyEarnings: number;
  leaderboardRank?: number;
  totalTeachers?: number;
}

interface LeaderboardEntry {
  teacherId: number;
  teacherName: string;
  averageRating: number;
  totalCalls: number;
  totalMinutes: number;
  rank: number;
  profileImage?: string;
}

// Connection quality helper
const getConnectionIcon = (strength?: string) => {
  switch(strength) {
    case 'excellent':
      return <SignalHigh className="h-4 w-4 text-green-500" />;
    case 'good':
      return <Signal className="h-4 w-4 text-green-500" />;
    case 'fair':
      return <SignalLow className="h-4 w-4 text-yellow-500" />;
    case 'poor':
      return <SignalZero className="h-4 w-4 text-red-500" />;
    default:
      return <Signal className="h-4 w-4 text-gray-400" />;
  }
};

const getConnectionLabel = (strength?: string, t?: any) => {
  const labels = {
    excellent: t?.('callern:connectionExcellent', 'Excellent'),
    good: t?.('callern:connectionGood', 'Good'),
    fair: t?.('callern:connectionFair', 'Fair'),
    poor: t?.('callern:connectionPoor', 'Poor')
  };
  return labels[strength as keyof typeof labels] || t?.('callern:connectionUnknown', 'Unknown');
};

export default function EnhancedTeacherCallernSystem() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t } = useTranslation(['callern', 'teacher', 'common']);
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallConfig, setActiveCallConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'dashboard' | 'history' | 'analytics' | 'leaderboard'>('dashboard');
  const [currentStudent, setCurrentStudent] = useState<CurrentStudent | null>(null);
  const [showPrivateInfo, setShowPrivateInfo] = useState(false);
  const [connectionStrength, setConnectionStrength] = useState<'excellent' | 'good' | 'fair' | 'poor'>('good');
  const [studentConnectionStrength, setStudentConnectionStrength] = useState<string | null>(null);
  
  // Redirect non-teachers to appropriate page (keep only in useEffect)
  useEffect(() => {
    if (user && user.role !== 'Teacher' && user.role !== 'Teacher/Tutor') {
      if (user.role === 'Student') {
        window.location.replace('/callern'); // Force redirect students to student Callern page
      } else {
        window.location.replace('/dashboard'); // Force redirect others to dashboard
      }
    }
  }, [user]);
  
  // Time slot states
  const [morningSlot, setMorningSlot] = useState(false);
  const [afternoonSlot, setAfternoonSlot] = useState(false);
  const [eveningSlot, setEveningSlot] = useState(false);
  const [nightSlot, setNightSlot] = useState(false);
  
  // Fetch teacher authorization status
  const { data: authorizationStatus, isLoading: authLoading } = useQuery<{isAuthorized: boolean}>({
    queryKey: ["/api/teacher/callern/authorization"],
    enabled: user?.role === 'Teacher'
  });

  // Fetch teacher's availability settings
  const { data: availability, isLoading: availabilityLoading } = useQuery<{
    morningSlot?: boolean;
    afternoonSlot?: boolean;
    eveningSlot?: boolean;
    nightSlot?: boolean;
  }>({
    queryKey: ["/api/teacher/callern/availability"],
    enabled: user?.role === 'Teacher' && authorizationStatus?.isAuthorized
  });

  // Fetch teacher's call history
  const { data: callHistory = [], isLoading: historyLoading } = useQuery<CallHistory[]>({
    queryKey: ["/api/teacher/callern/history"],
    enabled: user?.role === 'Teacher' && authorizationStatus?.isAuthorized
  });

  // Fetch teacher's Callern stats
  const { data: stats, isLoading: statsLoading } = useQuery<TeacherStats>({
    queryKey: ["/api/teacher/callern/stats"],
    enabled: user?.role === 'Teacher' && authorizationStatus?.isAuthorized
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery<LeaderboardEntry[]>({
    queryKey: ["/api/teacher/callern/leaderboard"],
    enabled: activeTab === 'leaderboard' && authorizationStatus?.isAuthorized
  });

  // Initialize availability from fetched data
  useEffect(() => {
    if (availability) {
      setMorningSlot(availability.morningSlot || false);
      setAfternoonSlot(availability.afternoonSlot || false);
      setEveningSlot(availability.eveningSlot || false);
      setNightSlot(availability.nightSlot || false);
    }
  }, [availability]);

  // REMOVED: Teachers can no longer update their own availability
  // This functionality is now controlled exclusively by administrators and supervisors

  // REMOVED: handleAvailabilityChange function is no longer needed
  // Teachers can only view their availability settings (read-only)

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('Teacher: Incoming call from student:', data);
      setCurrentStudent({
        id: data.studentId,
        firstName: data.studentFirstName,
        lastName: data.studentLastName,
        level: data.level || 'B1',
        packageName: data.packageName || 'Standard',
        remainingMinutes: data.remainingMinutes || 0,
        totalSessions: data.totalSessions || 0
      });
    };

    const handleCallAccepted = (data: any) => {
      console.log('Call accepted, starting video call:', data);
      setIsInCall(true);
      setActiveCallConfig({
        roomId: data.roomId,
        studentId: data.studentId,
        remoteSocketId: data.studentSocketId
      });
    };

    const handleCallEnded = () => {
      console.log('Call ended');
      setIsInCall(false);
      setActiveCallConfig(null);
      setCurrentStudent(null);
      setStudentConnectionStrength(null);
      
      toast({
        title: t('callern:callEnded'),
        description: t('callern:callEndedDescription'),
      });
    };

    const handleStudentConnectionUpdate = (data: { studentId: number; strength: string }) => {
      if (currentStudent?.id === data.studentId) {
        setStudentConnectionStrength(data.strength);
      }
    };

    socket.on('student-call-request', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-ended', handleCallEnded);
    socket.on('student-connection-update', handleStudentConnectionUpdate);

    return () => {
      socket.off('student-call-request', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-ended', handleCallEnded);
      socket.off('student-connection-update', handleStudentConnectionUpdate);
    };
  }, [socket, t, toast, currentStudent]);

  // Monitor connection quality
  useEffect(() => {
    const checkConnection = () => {
      if ((navigator as any).connection) {
        const conn = (navigator as any).connection;
        const mbps = conn.downlink || 10;
        if (mbps >= 10) setConnectionStrength('excellent');
        else if (mbps >= 5) setConnectionStrength('good');
        else if (mbps >= 2) setConnectionStrength('fair');
        else setConnectionStrength('poor');
      }
    };

    checkConnection();
    const interval = setInterval(checkConnection, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleEndCall = () => {
    if (socket && activeCallConfig) {
      socket.emit('end-call', { roomId: activeCallConfig.roomId });
    }
    setIsInCall(false);
    setActiveCallConfig(null);
    setCurrentStudent(null);
  };


  // Check authorization for teachers
  if (!authLoading && authorizationStatus?.isAuthorized === false) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
        <div className="max-w-4xl mx-auto">
          <Alert className="bg-yellow-50 border-yellow-200">
            <ShieldAlert className="h-5 w-5 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              <h3 className="font-bold mb-2">{t('teacher:callernNotAuthorized')}</h3>
              <p>{t('teacher:callernNotAuthorizedDesc')}</p>
            </AlertDescription>
          </Alert>
        </div>
      </div>
    );
  }

  if (isInCall && activeCallConfig) {
    return (
      <VideoCall
        roomId={activeCallConfig.roomId}
        userId={user!.id}
        role="teacher"
        teacherName={`${user?.firstName} ${user?.lastName}`}
        studentName={activeCallConfig.studentName || "Student"}
        roadmapTitle="General Conversation"
        sessionStep="Free Talk Session"
        packageMinutesRemaining={600}
        onCallEnd={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      {/* Incoming Call Handler */}
      <TeacherIncomingCall />
      
      {/* Support Button - Fixed Position */}
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              className="fixed bottom-6 right-6 rounded-full shadow-lg z-50"
              size="lg"
              onClick={() => {
                // Open support dialog or redirect to support
                window.location.href = '/support';
              }}
            >
              <LifeBuoy className="h-5 w-5" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>
            <p>{t('common:getSupport')}</p>
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">
                {t('teacher:callernDashboard', 'Callern Dashboard')}
              </h1>
              <p className="text-gray-600">
                {t('teacher:manageVideoCallsAndStudents', 'Manage your video calls and student sessions')}
              </p>
            </div>
            <div className="flex items-center gap-4">
              {/* Connection Status */}
              <div className="flex items-center gap-2">
                {getConnectionIcon(connectionStrength)}
                <span className="text-sm">{getConnectionLabel(connectionStrength, t)}</span>
              </div>
              
              {/* Online Toggle */}
              <TeacherOnlineToggle />
            </div>
          </div>

          {/* Hourly Rate Display */}
          {stats?.hourlyRate && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3 flex items-center gap-2">
              <DollarSign className="h-5 w-5 text-green-600" />
              <span className="text-green-800">
                {t('teacher:hourlyRate')}: {new Intl.NumberFormat('fa-IR', {
                  style: 'currency',
                  currency: 'IRR',
                  minimumFractionDigits: 0
                }).format(stats.hourlyRate)}
              </span>
            </div>
          )}

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">{t('teacher:todaysCalls', "Today's Calls")}</p>
                    <p className="text-2xl font-bold">{stats?.dailyCalls || 0}</p>
                    <p className="text-xs text-blue-200">{stats?.dailyMinutes || 0} {t('common:minutes')}</p>
                  </div>
                  <Phone className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">{t('teacher:weeklyStats', 'This Week')}</p>
                    <p className="text-2xl font-bold">{stats?.weeklyCalls || 0}</p>
                    <p className="text-xs text-green-200">{stats?.weeklyMinutes || 0} {t('common:minutes')}</p>
                  </div>
                  <Calendar className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">{t('teacher:avgRating', 'Avg Rating')}</p>
                    <div className="flex items-center gap-1">
                      <p className="text-2xl font-bold">
                        {(stats?.averageRating || 0).toFixed(1)}
                      </p>
                      <Star className="h-5 w-5 text-yellow-300 fill-yellow-300" />
                    </div>
                    <p className="text-xs text-purple-200">
                      {stats?.totalRatings || 0} {t('teacher:ratings')}
                    </p>
                  </div>
                  <Award className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">{t('teacher:monthlyEarnings', 'Monthly')}</p>
                    <p className="text-lg font-bold">
                      {new Intl.NumberFormat('fa-IR', {
                        style: 'currency',
                        currency: 'IRR',
                        minimumFractionDigits: 0,
                        notation: 'compact',
                        maximumFractionDigits: 1
                      }).format(stats?.monthlyEarnings || 0)}
                    </p>
                  </div>
                  <DollarSign className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Missed Shifts/Calls Alert */}
          {(stats?.missedShifts || stats?.missedCalls) ? (
            <Alert className="mt-4 bg-red-50 border-red-200">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">
                {stats.missedShifts > 0 && (
                  <span className="mr-4">
                    {t('teacher:missedShifts')}: <strong>{stats.missedShifts}</strong>
                  </span>
                )}
                {stats.missedCalls > 0 && (
                  <span>
                    {t('teacher:missedCalls')}: <strong>{stats.missedCalls}</strong>
                  </span>
                )}
              </AlertDescription>
            </Alert>
          ) : null}
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="dashboard" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              {t('teacher:dashboard', 'Dashboard')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('teacher:sessions', 'Sessions')}
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('teacher:analytics', 'Analytics')}
            </TabsTrigger>
            <TabsTrigger value="leaderboard" className="flex items-center gap-2">
              <Trophy className="h-4 w-4" />
              {t('teacher:leaderboard', 'Leaderboard')}
            </TabsTrigger>
            <TabsTrigger value="settings" className="flex items-center gap-2">
              <Volume2 className="h-4 w-4" />
              {t('teacher:settings', 'Settings')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-4">
            {/* Availability Settings */}
            <Card>
              <CardHeader>
                <CardTitle>{t('teacher:availabilitySettings', 'Availability Settings')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="h-5 w-5 text-blue-600" />
                      <div>
                        <p className="text-sm font-medium text-blue-800">
                          {t('teacher:dutyTimesViewOnly', 'Duty Times (View Only)')}
                        </p>
                        <p className="text-xs text-blue-700">
                          {t('teacher:dutyTimesSetByAdmin', 'These time slots are managed by administrators and supervisors')}
                        </p>
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="flex items-center space-x-2 opacity-75">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${morningSlot ? 'bg-orange-500 border-orange-500' : 'bg-gray-200 border-gray-300'}`}>
                        {morningSlot && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sunrise className="h-4 w-4 text-orange-500" />
                        <div>
                          <p className="font-medium">{t('teacher:morning', 'Morning')}</p>
                          <p className="text-xs text-gray-500">6:00 - 12:00</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-75">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${afternoonSlot ? 'bg-yellow-500 border-yellow-500' : 'bg-gray-200 border-gray-300'}`}>
                        {afternoonSlot && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sun className="h-4 w-4 text-yellow-500" />
                        <div>
                          <p className="font-medium">{t('teacher:afternoon', 'Afternoon')}</p>
                          <p className="text-xs text-gray-500">12:00 - 18:00</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-75">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${eveningSlot ? 'bg-purple-500 border-purple-500' : 'bg-gray-200 border-gray-300'}`}>
                        {eveningSlot && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Sunset className="h-4 w-4 text-purple-500" />
                        <div>
                          <p className="font-medium">{t('teacher:evening', 'Evening')}</p>
                          <p className="text-xs text-gray-500">18:00 - 22:00</p>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center space-x-2 opacity-75">
                      <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${nightSlot ? 'bg-indigo-500 border-indigo-500' : 'bg-gray-200 border-gray-300'}`}>
                        {nightSlot && <CheckCircle className="h-3 w-3 text-white" />}
                      </div>
                      <div className="flex items-center gap-2">
                        <Moon className="h-4 w-4 text-indigo-500" />
                        <div>
                          <p className="font-medium">{t('teacher:night', 'Night')}</p>
                          <p className="text-xs text-gray-500">22:00 - 6:00</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Current Status */}
            <Card>
              <CardHeader>
                <CardTitle>{t('teacher:currentStatus', 'Current Status')}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentStudent ? (
                  <div className="space-y-4">
                    <Alert>
                      <Phone className="h-4 w-4 animate-pulse" />
                      <AlertDescription>
                        {t('teacher:incomingCallFrom', 'Incoming call from')} 
                        {showPrivateInfo ? (
                          ` ${currentStudent.firstName} ${currentStudent.lastName}`
                        ) : (
                          ` Student #${currentStudent.id}`
                        )}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <p className="text-sm text-gray-600">{t('teacher:studentLevel', 'Student Level')}</p>
                        <p className="font-semibold">{currentStudent.level}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('teacher:package', 'Package')}</p>
                        <p className="font-semibold">{currentStudent.packageName}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('teacher:remainingMinutes', 'Remaining Minutes')}</p>
                        <p className="font-semibold">{currentStudent.remainingMinutes}</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">{t('teacher:connectionQuality', 'Student Connection')}</p>
                        <div className="flex items-center gap-2">
                          {getConnectionIcon(studentConnectionStrength || undefined)}
                          <span className="font-semibold">
                            {getConnectionLabel(studentConnectionStrength || undefined, t)}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Privacy Toggle */}
                    <div className="flex items-center space-x-2 pt-2 border-t">
                      <Switch
                        id="privacy"
                        checked={showPrivateInfo}
                        onCheckedChange={setShowPrivateInfo}
                      />
                      <Label htmlFor="privacy" className="flex items-center gap-2 cursor-pointer">
                        {showPrivateInfo ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
                        {t('teacher:showPersonalInfo', 'Show personal information')}
                      </Label>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Headphones className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-2">
                      {t('teacher:noActiveCall', 'No active call at the moment')}
                    </p>
                    <p className="text-sm text-gray-500">
                      {t('teacher:waitingForStudents', 'Waiting for students to connect...')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacher:sessionHistory', 'Session History')}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : callHistory.length > 0 ? (
                  <div className="overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>{t('teacher:student', 'Student')}</TableHead>
                          <TableHead>{t('teacher:date', 'Date')}</TableHead>
                          <TableHead>{t('teacher:duration', 'Duration')}</TableHead>
                          <TableHead>{t('teacher:ratings', 'Ratings')}</TableHead>
                          <TableHead>{t('teacher:connection', 'Connection')}</TableHead>
                          <TableHead>{t('teacher:resources', 'Resources')}</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {callHistory.slice(0, 20).map((call) => (
                          <TableRow key={call.id}>
                            <TableCell>
                              {showPrivateInfo && call.studentName ? (
                                call.studentName
                              ) : (
                                `Student #${call.studentId}`
                              )}
                            </TableCell>
                            <TableCell>
                              {new Date(call.startedAt).toLocaleDateString()}
                            </TableCell>
                            <TableCell>{call.duration} min</TableCell>
                            <TableCell>
                              <div className="flex flex-col gap-1">
                                {call.studentRating && (
                                  <div className="flex items-center gap-1">
                                    <User className="h-3 w-3" />
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm">{call.studentRating}</span>
                                  </div>
                                )}
                                {call.supervisorRating && (
                                  <div className="flex items-center gap-1">
                                    <ShieldAlert className="h-3 w-3" />
                                    <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                                    <span className="text-sm">{call.supervisorRating}</span>
                                  </div>
                                )}
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                {getConnectionIcon(call.teacherConnectionQuality)}
                                <span className="text-xs">{t('teacher:youLabel')}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                {getConnectionIcon(call.studentConnectionQuality)}
                                <span className="text-xs">{t('teacher:studentLabel')}</span>
                              </div>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                {call.recordingUrl && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(call.recordingUrl, '_blank')}
                                        >
                                          <FileVideo className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{t('teacher:viewRecording', 'View Recording')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {call.transcriptUrl && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(call.transcriptUrl, '_blank')}
                                        >
                                          <FileText className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{t('teacher:viewTranscript', 'View Transcript')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                                {call.contentBundleUrl && (
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Button
                                          size="sm"
                                          variant="outline"
                                          onClick={() => window.open(call.contentBundleUrl, '_blank')}
                                        >
                                          <Package className="h-4 w-4" />
                                        </Button>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{t('teacher:viewContentBundle', 'Learning Materials')}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )}
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <p className="text-gray-600">
                      {t('teacher:noCallHistory', 'No call history available')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('teacher:monthlyOverview', 'Monthly Overview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:totalCalls', 'Total Calls')}</span>
                      <span className="font-semibold">{stats?.monthlyCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:totalMinutes', 'Total Minutes')}</span>
                      <span className="font-semibold">{stats?.monthlyMinutes || 0}</span>
                    </div>
                    <Separator />
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:missedShifts', 'Missed Shifts')}</span>
                      <Badge variant={stats?.missedShifts ? "destructive" : "secondary"}>
                        {stats?.missedShifts || 0}
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:missedCalls', 'Missed Calls')}</span>
                      <Badge variant={stats?.missedCalls ? "destructive" : "secondary"}>
                        {stats?.missedCalls || 0}
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('teacher:performanceMetrics', 'Performance Metrics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{t('teacher:studentRating', 'Student Rating')}</span>
                        <span className="text-sm font-semibold">{(stats?.averageRating || 0).toFixed(1)}/5.0</span>
                      </div>
                      <Progress value={(stats?.averageRating || 0) * 20} className="h-2" />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-1">
                        <span className="text-sm text-gray-600">{t('teacher:leaderboardRank', 'Leaderboard Rank')}</span>
                        <span className="text-sm font-semibold">
                          #{stats?.leaderboardRank || '-'} / {stats?.totalTeachers || '-'}
                        </span>
                      </div>
                      <Progress 
                        value={stats?.leaderboardRank && stats?.totalTeachers 
                          ? ((stats.totalTeachers - stats.leaderboardRank + 1) / stats.totalTeachers) * 100 
                          : 0} 
                        className="h-2" 
                      />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Earnings Breakdown */}
            <Card>
              <CardHeader>
                <CardTitle>{t('teacher:earningsBreakdown', 'Earnings Breakdown')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('teacher:hourlyRate', 'Hourly Rate')}</span>
                    <span className="font-semibold">
                      {new Intl.NumberFormat('fa-IR', {
                        style: 'currency',
                        currency: 'IRR',
                        minimumFractionDigits: 0
                      }).format(stats?.hourlyRate || 0)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600">{t('teacher:totalHours', 'Total Hours')}</span>
                    <span className="font-semibold">
                      {Math.round((stats?.monthlyMinutes || 0) / 60)} hrs
                    </span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-gray-800 font-semibold">{t('teacher:monthlyTotal', 'Monthly Total')}</span>
                    <span className="font-bold text-lg text-green-600">
                      {new Intl.NumberFormat('fa-IR', {
                        style: 'currency',
                        currency: 'IRR',
                        minimumFractionDigits: 0
                      }).format(stats?.monthlyEarnings || 0)}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5 text-yellow-500" />
                  {t('teacher:topPerformers', 'Top Performers')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : leaderboard.length > 0 ? (
                  <div className="space-y-3">
                    {leaderboard.map((entry, index) => (
                      <div
                        key={entry.teacherId}
                        className={`flex items-center justify-between p-4 rounded-lg ${
                          entry.teacherId === user?.id 
                            ? 'bg-blue-50 border-2 border-blue-300' 
                            : 'bg-gray-50'
                        }`}
                      >
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-10 h-10 rounded-full bg-white shadow">
                            {index === 0 && <span className="text-2xl">🥇</span>}
                            {index === 1 && <span className="text-2xl">🥈</span>}
                            {index === 2 && <span className="text-2xl">🥉</span>}
                            {index > 2 && <span className="font-bold text-gray-600">#{entry.rank}</span>}
                          </div>
                          <div>
                            <p className="font-semibold">
                              {entry.teacherId === user?.id ? t('teacher:you', 'You') : entry.teacherName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {entry.totalCalls} {t('teacher:calls')}, {entry.totalMinutes} {t('common:minutes')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-1">
                          <Star className="h-5 w-5 text-yellow-500 fill-yellow-500" />
                          <span className="font-bold">{entry.averageRating.toFixed(1)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Trophy className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">
                      {t('teacher:noLeaderboardData', 'No leaderboard data available yet')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <div className="grid gap-6">
              {/* Ringtone Settings */}
              <TeacherRingtoneSettings />
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}