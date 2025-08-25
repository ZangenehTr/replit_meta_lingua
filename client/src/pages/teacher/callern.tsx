import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { VideoCall } from "@/components/callern/VideoCall";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { useTranslation } from "react-i18next";
import { TeacherIncomingCall } from "@/components/callern/teacher-incoming-call";
import { TeacherOnlineToggle } from "@/components/callern/teacher-online-toggle";
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
  TrendingUp
} from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface CallHistory {
  id: number;
  studentId: number;
  duration: number;
  callType: string;
  status: string;
  startedAt: string;
  endedAt?: string;
  studentName: string;
  recordingUrl?: string;
  rating?: number;
  feedback?: string;
}

interface CurrentStudent {
  id: number;
  firstName: string;
  lastName: string;
  level: string;
  packageName: string;
  remainingMinutes: number;
  totalSessions: number;
}

export default function TeacherCallernSystem() {
  const { toast } = useToast();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { t } = useTranslation(['callern', 'teacher', 'common']);
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallConfig, setActiveCallConfig] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<'active' | 'history' | 'stats'>('active');
  const [currentStudent, setCurrentStudent] = useState<CurrentStudent | null>(null);

  // Fetch teacher's call history
  const { data: callHistory = [], isLoading: historyLoading } = useQuery<CallHistory[]>({
    queryKey: ["/api/teacher/callern/history"],
    enabled: user?.role === 'Teacher'
  });

  // Fetch teacher's Callern stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/teacher/callern/stats"],
    enabled: user?.role === 'Teacher'
  });

  // Listen for incoming calls
  useEffect(() => {
    if (!socket) return;

    const handleIncomingCall = (data: any) => {
      console.log('Teacher: Incoming call from student:', data);
      setCurrentStudent({
        id: data.studentId,
        firstName: data.studentFirstName || 'Student',
        lastName: data.studentLastName || '',
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
      
      toast({
        title: t('callern:callEnded'),
        description: t('callern:callEndedDescription'),
      });
    };

    socket.on('student-call-request', handleIncomingCall);
    socket.on('call-accepted', handleCallAccepted);
    socket.on('call-ended', handleCallEnded);

    return () => {
      socket.off('student-call-request', handleIncomingCall);
      socket.off('call-accepted', handleCallAccepted);
      socket.off('call-ended', handleCallEnded);
    };
  }, [socket, t, toast]);

  const handleEndCall = () => {
    if (socket && activeCallConfig) {
      socket.emit('end-call', { roomId: activeCallConfig.roomId });
    }
    setIsInCall(false);
    setActiveCallConfig(null);
    setCurrentStudent(null);
  };

  const handleMinutesUpdate = (minutes: number) => {
    console.log('Call duration updated:', minutes, 'minutes');
  };

  // Calculate statistics
  const totalCallsToday = callHistory.filter(call => {
    const callDate = new Date(call.startedAt);
    const today = new Date();
    return callDate.toDateString() === today.toDateString();
  }).length;

  const totalMinutesToday = callHistory
    .filter(call => {
      const callDate = new Date(call.startedAt);
      const today = new Date();
      return callDate.toDateString() === today.toDateString();
    })
    .reduce((acc, call) => acc + (call.duration || 0), 0);

  const averageRating = callHistory
    .filter(call => call.rating)
    .reduce((acc, call, _, arr) => acc + (call.rating || 0) / arr.length, 0);

  if (isInCall && activeCallConfig) {
    return (
      <VideoCall
        roomId={activeCallConfig.roomId}
        userId={user!.id}
        role="teacher"
        teacherName={`${user?.firstName} ${user?.lastName}`}
        onCallEnd={handleEndCall}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-4">
      {/* Incoming Call Handler */}
      <TeacherIncomingCall />
      
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
                {isConnected ? (
                  <>
                    <Wifi className="h-5 w-5 text-green-500" />
                    <span className="text-sm text-green-600">{t('common:connected')}</span>
                  </>
                ) : (
                  <>
                    <WifiOff className="h-5 w-5 text-red-500" />
                    <span className="text-sm text-red-600">{t('common:disconnected')}</span>
                  </>
                )}
              </div>
              
              {/* Online Toggle */}
              <TeacherOnlineToggle />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
            <Card className="bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm">{t('teacher:todaysCalls', "Today's Calls")}</p>
                    <p className="text-2xl font-bold">{totalCallsToday}</p>
                  </div>
                  <Phone className="h-8 w-8 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-green-500 to-green-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm">{t('teacher:minutesToday', 'Minutes Today')}</p>
                    <p className="text-2xl font-bold">{totalMinutesToday}</p>
                  </div>
                  <Clock className="h-8 w-8 text-green-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm">{t('teacher:activeStudents', 'Active Students')}</p>
                    <p className="text-2xl font-bold">{stats?.activeStudents || 0}</p>
                  </div>
                  <Users className="h-8 w-8 text-purple-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm">{t('teacher:avgRating', 'Avg Rating')}</p>
                    <p className="text-2xl font-bold">
                      {averageRating.toFixed(1)} ⭐
                    </p>
                  </div>
                  <Star className="h-8 w-8 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Main Content */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="active" className="flex items-center gap-2">
              <Headphones className="h-4 w-4" />
              {t('teacher:activeCall', 'Active Call')}
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2">
              <History className="h-4 w-4" />
              {t('teacher:callHistory', 'Call History')}
            </TabsTrigger>
            <TabsTrigger value="stats" className="flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              {t('teacher:statistics', 'Statistics')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>{t('teacher:currentStatus', 'Current Status')}</CardTitle>
              </CardHeader>
              <CardContent>
                {currentStudent ? (
                  <div className="space-y-4">
                    <Alert>
                      <AlertCircle className="h-4 w-4" />
                      <AlertDescription>
                        {t('teacher:incomingCallFrom', 'Incoming call from')} {currentStudent.firstName} {currentStudent.lastName}
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
                        <p className="text-sm text-gray-600">{t('teacher:totalSessions', 'Total Sessions')}</p>
                        <p className="font-semibold">{currentStudent.totalSessions}</p>
                      </div>
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
                <CardTitle>{t('teacher:recentCalls', 'Recent Calls')}</CardTitle>
              </CardHeader>
              <CardContent>
                {historyLoading ? (
                  <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  </div>
                ) : callHistory.length > 0 ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t('teacher:student', 'Student')}</TableHead>
                        <TableHead>{t('teacher:date', 'Date')}</TableHead>
                        <TableHead>{t('teacher:duration', 'Duration')}</TableHead>
                        <TableHead>{t('teacher:status', 'Status')}</TableHead>
                        <TableHead>{t('teacher:rating', 'Rating')}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {callHistory.slice(0, 10).map((call) => (
                        <TableRow key={call.id}>
                          <TableCell>{call.studentName}</TableCell>
                          <TableCell>
                            {new Date(call.startedAt).toLocaleDateString()}
                          </TableCell>
                          <TableCell>{call.duration} min</TableCell>
                          <TableCell>
                            <Badge
                              variant={call.status === 'completed' ? 'default' : 'secondary'}
                            >
                              {call.status === 'completed' ? (
                                <CheckCircle className="h-3 w-3 mr-1" />
                              ) : (
                                <XCircle className="h-3 w-3 mr-1" />
                              )}
                              {call.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {call.rating ? (
                              <div className="flex items-center gap-1">
                                <Star className="h-4 w-4 text-yellow-500 fill-yellow-500" />
                                <span>{call.rating}</span>
                              </div>
                            ) : (
                              <span className="text-gray-400">-</span>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
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

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card>
                <CardHeader>
                  <CardTitle>{t('teacher:weeklyOverview', 'Weekly Overview')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:totalCalls', 'Total Calls')}</span>
                      <span className="font-semibold">{stats?.weeklyStats?.totalCalls || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:totalMinutes', 'Total Minutes')}</span>
                      <span className="font-semibold">{stats?.weeklyStats?.totalMinutes || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:uniqueStudents', 'Unique Students')}</span>
                      <span className="font-semibold">{stats?.weeklyStats?.uniqueStudents || 0}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:completionRate', 'Completion Rate')}</span>
                      <span className="font-semibold">{stats?.weeklyStats?.completionRate || 0}%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{t('teacher:monthlyEarnings', 'Monthly Earnings')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:basePay', 'Base Pay')}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('fa-IR', {
                          style: 'currency',
                          currency: 'IRR',
                          minimumFractionDigits: 0
                        }).format(stats?.monthlyEarnings?.basePay || 0)}
                      </span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">{t('teacher:bonuses', 'Bonuses')}</span>
                      <span className="font-semibold">
                        {new Intl.NumberFormat('fa-IR', {
                          style: 'currency',
                          currency: 'IRR',
                          minimumFractionDigits: 0
                        }).format(stats?.monthlyEarnings?.bonuses || 0)}
                      </span>
                    </div>
                    <div className="border-t pt-2 mt-2">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-800 font-semibold">{t('teacher:total', 'Total')}</span>
                        <span className="font-bold text-lg text-green-600">
                          {new Intl.NumberFormat('fa-IR', {
                            style: 'currency',
                            currency: 'IRR',
                            minimumFractionDigits: 0
                          }).format(stats?.monthlyEarnings?.total || 0)}
                        </span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}