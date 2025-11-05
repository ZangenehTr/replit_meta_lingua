import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { useSocket } from "@/hooks/use-socket";
import { motion, AnimatePresence } from "framer-motion";
import { useLanguage } from "@/hooks/useLanguage";
import { 
  Users, 
  Clock, 
  AlertTriangle, 
  CheckCircle,
  Mic,
  MicOff,
  Video,
  VideoOff,
  MessageSquare,
  TrendingUp,
  Activity,
  Timer,
  Bell,
  AlertCircle,
  Eye,
  Zap,
  Target,
  BarChart,
  Send,
  RefreshCw
} from "lucide-react";

interface ActiveSession {
  id: number;
  teacherId: number;
  teacherName: string;
  studentId: number;
  studentName: string;
  courseTitle: string;
  sessionType: string;
  startTime: string;
  duration: number;
  status: 'active' | 'warning' | 'critical';
  metrics: {
    tttRatio: number; // Teacher Talk Time ratio
    engagement: number;
    cameraOn: boolean;
    micOn: boolean;
    speakingTime: number;
    silenceTime: number;
    interruptions: number;
  };
}

interface TeacherMetrics {
  teacherId: number;
  name: string;
  averageTTT: number;
  averageEngagement: number;
  sessionsToday: number;
  totalSessionTime: number;
  warnings: number;
  alerts: number;
  performance: 'excellent' | 'good' | 'needs_improvement' | 'critical';
}

interface SupervisionAlert {
  id: number;
  sessionId: number;
  teacherId: number;
  type: 'ttt_high' | 'low_engagement' | 'technical_issue' | 'long_silence' | 'no_camera';
  message: string;
  severity: 'warning' | 'critical';
  timestamp: string;
  resolved: boolean;
}

const REMINDER_TEMPLATES = {
  engagement: [
    "Remember to ask open-ended questions to encourage student participation",
    "Try using more interactive activities to boost engagement",
    "Consider checking student understanding with concept checks"
  ],
  ttt: [
    "Give the student more speaking opportunities",
    "Try to reduce your talking time and encourage student production",
    "Remember the 30/70 rule - students should speak 70% of the time"
  ],
  technical: [
    "Please turn on your camera for better engagement",
    "Check your microphone settings - audio quality is important",
    "Consider improving your lighting for better visibility"
  ],
  pacing: [
    "The lesson seems to be moving too fast - consider slowing down",
    "Check if the student is following along with the material",
    "Take a moment to review and consolidate what's been covered"
  ],
  motivation: [
    "Great job engaging the student! Keep it up!",
    "Excellent use of correction techniques",
    "Your enthusiasm is really helping the student's confidence"
  ]
};

export default function TeacherSupervisionDashboard() {
  const { isRTL } = useLanguage();
  const [selectedSession, setSelectedSession] = useState<ActiveSession | null>(null);
  const [reminderDialogOpen, setReminderDialogOpen] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [autoMonitoring, setAutoMonitoring] = useState(true);
  const [selectedReminderType, setSelectedReminderType] = useState<keyof typeof REMINDER_TEMPLATES>('engagement');
  const [customMessage, setCustomMessage] = useState("");

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const { socket, isConnected } = useSocket();

  // Fetch active sessions with real-time updates
  const { data: activeSessions = [], refetch: refetchSessions } = useQuery<ActiveSession[]>({
    queryKey: ['/api/supervision/active-sessions'],
    refetchInterval: 5000, // Refresh every 5 seconds
    enabled: true
  });

  // Fetch teacher metrics
  const { data: teacherMetrics = [] } = useQuery<TeacherMetrics[]>({
    queryKey: ['/api/supervision/teacher-metrics'],
    refetchInterval: 10000
  });

  // Fetch supervision alerts
  const { data: alerts = [] } = useQuery<SupervisionAlert[]>({
    queryKey: ['/api/supervision/alerts'],
    refetchInterval: 3000
  });

  // Send reminder mutation
  const sendReminderMutation = useMutation({
    mutationFn: async (data: { 
      teacherId: number; 
      sessionId: number; 
      reminderType: string; 
      message: string 
    }) => {
      return apiRequest('/api/supervision/send-reminder', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Reminder Sent",
        description: "The teacher has been notified",
        duration: 3000
      });
      setReminderDialogOpen(false);
      setCustomMessage("");
    },
    onError: () => {
      toast({
        title: "Failed to Send Reminder",
        description: "Please try again",
        variant: "destructive"
      });
    }
  });

  // WebSocket listeners for real-time updates
  useEffect(() => {
    if (!socket) return;

    // Listen for session updates
    socket.on('session-update', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/active-sessions'] });
    });

    // Listen for new alerts
    socket.on('supervision-alert', (alert: SupervisionAlert) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/alerts'] });
      
      // Show toast for critical alerts
      if (alert.severity === 'critical') {
        toast({
          title: "Critical Alert",
          description: alert.message,
          variant: "destructive",
          duration: 10000
        });
      }
    });

    // Listen for metric updates
    socket.on('metrics-update', (data: any) => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/teacher-metrics'] });
    });

    return () => {
      socket.off('session-update');
      socket.off('supervision-alert');
      socket.off('metrics-update');
    };
  }, [socket, queryClient, toast]);

  // Auto-monitoring logic
  useEffect(() => {
    if (!autoMonitoring) return;

    const checkSessions = () => {
      activeSessions.forEach(session => {
        // Check TTT ratio
        if (session.metrics.tttRatio > 70) {
          sendAutomaticReminder(session.teacherId, session.id, 'ttt');
        }
        
        // Check engagement
        if (session.metrics.engagement < 30) {
          sendAutomaticReminder(session.teacherId, session.id, 'engagement');
        }
        
        // Check technical issues
        if (!session.metrics.cameraOn || !session.metrics.micOn) {
          sendAutomaticReminder(session.teacherId, session.id, 'technical');
        }
      });
    };

    const interval = setInterval(checkSessions, 30000); // Check every 30 seconds
    return () => clearInterval(interval);
  }, [autoMonitoring, activeSessions]);

  const sendAutomaticReminder = (teacherId: number, sessionId: number, type: keyof typeof REMINDER_TEMPLATES) => {
    const messages = REMINDER_TEMPLATES[type];
    const randomMessage = messages[Math.floor(Math.random() * messages.length)];
    
    sendReminderMutation.mutate({
      teacherId,
      sessionId,
      reminderType: type,
      message: randomMessage
    });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'warning': return 'bg-yellow-500';
      case 'critical': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getPerformanceColor = (performance: string) => {
    switch (performance) {
      case 'excellent': return 'text-green-600';
      case 'good': return 'text-blue-600';
      case 'needs_improvement': return 'text-yellow-600';
      case 'critical': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50 p-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-indigo-600 to-purple-600 rounded-xl p-6 text-white shadow-xl"
        >
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-3xl font-bold mb-2">Teacher Supervision Dashboard</h1>
              <p className="opacity-90">Real-time monitoring and guidance system</p>
            </div>
            <div className="flex gap-4">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  <span className="font-semibold">{activeSessions.length}</span>
                </div>
                <p className="text-xs">Active Sessions</p>
              </div>
              <Button
                variant={autoMonitoring ? "secondary" : "outline"}
                onClick={() => setAutoMonitoring(!autoMonitoring)}
                className="bg-white/20 hover:bg-white/30"
              >
                {autoMonitoring ? <Zap className="h-4 w-4 mr-2" /> : <Bell className="h-4 w-4 mr-2" />}
                {autoMonitoring ? "Auto-Monitoring ON" : "Auto-Monitoring OFF"}
              </Button>
            </div>
          </div>
        </motion.div>

        {/* Connection Status */}
        {!isConnected && (
          <Alert className="bg-yellow-50 border-yellow-200">
            <AlertCircle className="h-4 w-4 text-yellow-600" />
            <AlertDescription className="text-yellow-800">
              Real-time connection lost. Attempting to reconnect...
            </AlertDescription>
          </Alert>
        )}

        {/* Main Content */}
        <Tabs defaultValue="sessions" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="sessions">Active Sessions</TabsTrigger>
            <TabsTrigger value="metrics">Teacher Metrics</TabsTrigger>
            <TabsTrigger value="alerts">Alerts & Notifications</TabsTrigger>
          </TabsList>

          {/* Active Sessions Tab */}
          <TabsContent value="sessions" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {activeSessions.map((session) => (
                <motion.div
                  key={session.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  whileHover={{ scale: 1.02 }}
                  transition={{ duration: 0.2 }}
                >
                  <Card className="relative overflow-hidden">
                    <div className={`absolute top-0 left-0 w-full h-1 ${getStatusColor(session.status)}`} />
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">{session.teacherName}</CardTitle>
                          <CardDescription>{session.courseTitle}</CardDescription>
                        </div>
                        <Badge variant={session.status === 'active' ? 'default' : 'destructive'}>
                          {session.status}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex justify-between items-center">
                        <span className="text-sm text-gray-500">Student:</span>
                        <span className="font-medium">{session.studentName}</span>
                      </div>
                      
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>TTT Ratio</span>
                          <span className={session.metrics.tttRatio > 60 ? "text-yellow-600" : "text-green-600"}>
                            {session.metrics.tttRatio}%
                          </span>
                        </div>
                        <Progress value={session.metrics.tttRatio} className="h-2" />
                      </div>

                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span>Engagement</span>
                          <span className={session.metrics.engagement < 40 ? "text-red-600" : "text-green-600"}>
                            {session.metrics.engagement}%
                          </span>
                        </div>
                        <Progress value={session.metrics.engagement} className="h-2" />
                      </div>

                      <div className="flex justify-between">
                        <div className="flex gap-2">
                          {session.metrics.cameraOn ? (
                            <Video className="h-4 w-4 text-green-600" />
                          ) : (
                            <VideoOff className="h-4 w-4 text-red-600" />
                          )}
                          {session.metrics.micOn ? (
                            <Mic className="h-4 w-4 text-green-600" />
                          ) : (
                            <MicOff className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-sm text-gray-500">
                          <Clock className="h-3 w-3" />
                          {session.duration} min
                        </div>
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button 
                          size="sm" 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => setSelectedSession(session)}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Monitor
                        </Button>
                        <Button 
                          size="sm" 
                          className="flex-1"
                          onClick={() => {
                            setSelectedTeacher(session.teacherId);
                            setSelectedSession(session);
                            setReminderDialogOpen(true);
                          }}
                        >
                          <MessageSquare className="h-3 w-3 mr-1" />
                          Remind
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {activeSessions.length === 0 && (
              <Card className="p-12 text-center">
                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-xl font-semibold text-gray-600">No Active Sessions</p>
                <p className="text-gray-500 mt-2">Teacher sessions will appear here when they start</p>
              </Card>
            )}
          </TabsContent>

          {/* Teacher Metrics Tab */}
          <TabsContent value="metrics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacherMetrics.map((teacher) => (
                <Card key={teacher.teacherId}>
                  <CardHeader>
                    <CardTitle className="text-lg">{teacher.name}</CardTitle>
                    <CardDescription>
                      <span className={getPerformanceColor(teacher.performance)}>
                        {teacher.performance.replace('_', ' ').toUpperCase()}
                      </span>
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Avg TTT</span>
                      <span className="font-medium">{teacher.averageTTT}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Avg Engagement</span>
                      <span className="font-medium">{teacher.averageEngagement}%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Sessions Today</span>
                      <span className="font-medium">{teacher.sessionsToday}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-500">Warnings</span>
                      <Badge variant={teacher.warnings > 2 ? "destructive" : "outline"}>
                        {teacher.warnings}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          {/* Alerts Tab */}
          <TabsContent value="alerts" className="space-y-6">
            <ScrollArea className="h-[600px]">
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <Alert 
                    key={alert.id}
                    className={alert.severity === 'critical' ? 'border-red-500 bg-red-50' : 'border-yellow-500 bg-yellow-50'}
                  >
                    <AlertTriangle className={`h-4 w-4 ${alert.severity === 'critical' ? 'text-red-600' : 'text-yellow-600'}`} />
                    <div className="ml-2">
                      <AlertDescription className="font-medium">
                        {alert.message}
                      </AlertDescription>
                      <p className="text-xs text-gray-500 mt-1">
                        Session #{alert.sessionId} • {new Date(alert.timestamp).toLocaleTimeString()}
                      </p>
                    </div>
                  </Alert>
                ))}
              </div>
            </ScrollArea>
          </TabsContent>
        </Tabs>

        {/* Reminder Dialog */}
        <Dialog open={reminderDialogOpen} onOpenChange={setReminderDialogOpen}>
          <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Reminder to Teacher</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium">Reminder Type</label>
                <div className="grid grid-cols-2 gap-2 mt-2">
                  {Object.keys(REMINDER_TEMPLATES).map((type) => (
                    <Button
                      key={type}
                      variant={selectedReminderType === type ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedReminderType(type as keyof typeof REMINDER_TEMPLATES)}
                    >
                      {type.charAt(0).toUpperCase() + type.slice(1)}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Quick Messages</label>
                <div className="space-y-2 mt-2">
                  {REMINDER_TEMPLATES[selectedReminderType].map((message, idx) => (
                    <Button
                      key={idx}
                      variant="outline"
                      size="sm"
                      className="w-full text-left justify-start"
                      onClick={() => setCustomMessage(message)}
                    >
                      {message}
                    </Button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-sm font-medium">Custom Message</label>
                <textarea
                  className="w-full mt-2 p-2 border rounded-lg"
                  rows={3}
                  value={customMessage}
                  onChange={(e) => setCustomMessage(e.target.value)}
                  placeholder="Type your custom reminder..."
                />
              </div>

              <Button
                className="w-full"
                onClick={() => {
                  if (selectedSession && customMessage) {
                    sendReminderMutation.mutate({
                      teacherId: selectedSession.teacherId,
                      sessionId: selectedSession.id,
                      reminderType: selectedReminderType,
                      message: customMessage
                    });
                  }
                }}
                disabled={!customMessage}
              >
                <Send className="h-4 w-4 mr-2" />
                Send Reminder
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}