import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useSocket } from '@/hooks/use-socket';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import {
  AlertTriangle,
  Brain,
  CheckCircle,
  Clock,
  HelpCircle,
  Info,
  Lightbulb,
  MessageSquare,
  TrendingUp,
  Users,
  Volume2,
  VolumeX,
  X,
  Zap,
  Target,
  Award,
  BookOpen,
  Heart,
  BarChart,
  Activity
} from 'lucide-react';

interface CoachingReminder {
  id: string;
  type: 'ttt' | 'engagement' | 'questioning' | 'feedback' | 'pacing' | 'encouragement';
  severity: 'info' | 'warning' | 'critical';
  title: string;
  message: string;
  suggestion: string;
  timestamp: Date;
  metrics?: {
    tttPercentage?: number;
    studentEngagement?: number;
    silencePercentage?: number;
    openEndedQuestionRatio?: number;
    errorCorrectionCount?: number;
    praiseCount?: number;
    interruptionCount?: number;
  };
  actionable: boolean;
  priority: number;
}

interface TeachingMetrics {
  tttPercentage: number;
  studentEngagement: number;
  silencePercentage: number;
  questionCount: number;
  openEndedQuestionRatio: number;
  averageStudentResponseLength: number;
  sessionDuration: number;
  errorCorrectionCount: number;
  praiseCount: number;
  interruptionCount: number;
}

interface TeacherReminderPanelProps {
  sessionId: string;
  teacherId: number;
  studentId: number;
  isMinimized?: boolean;
  onMinimize?: (minimized: boolean) => void;
  position?: 'top-right' | 'bottom-right' | 'top-left' | 'bottom-left';
}

export function TeacherReminderPanel({
  sessionId,
  teacherId,
  studentId,
  isMinimized = false,
  onMinimize,
  position = 'top-right'
}: TeacherReminderPanelProps) {
  const { socket } = useSocket();
  const { toast } = useToast();
  const [currentReminder, setCurrentReminder] = useState<CoachingReminder | null>(null);
  const [reminderHistory, setReminderHistory] = useState<CoachingReminder[]>([]);
  const [metrics, setMetrics] = useState<TeachingMetrics>({
    tttPercentage: 0,
    studentEngagement: 100,
    silencePercentage: 0,
    questionCount: 0,
    openEndedQuestionRatio: 0,
    averageStudentResponseLength: 0,
    sessionDuration: 0,
    errorCorrectionCount: 0,
    praiseCount: 0,
    interruptionCount: 0,
  });
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [autoDismiss, setAutoDismiss] = useState(true);
  const [activeTab, setActiveTab] = useState('current');
  const audioRef = useRef<HTMLAudioElement>();
  const dismissTimerRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    // Create audio element for notification sounds
    audioRef.current = new Audio('data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBi+BzvLZijYIG2m98OScTgwOUari5blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWRwwMT6rn5bllFQU3k9r0yHkpBChyw/DeiTEIHGu+8OaVRwwLTqzm5blnFwU3k9n0yHkpBChyw/DeiTEIHGu+8+aVRwwLTqzm5blnFwU3k9n0yHkpBChyw/DeiTEIHGu+8+OWRwwMT6rn5blmFgU3k9r0yHkpBChyw/DeiTEIHGu+8+OWRwwMT6rn5blmFgU3k9r0yHkpBChyw/DeiTEIHWq+8+OWRwwMT6rn5blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWRwwMT6rn5blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWRwwMT6rn5blmFgU7k9n1unEiBC13yO/eizEIHWq+8+OWRwwMT6rn5bllFQU3k9r0yHkpBChyw/DeiTEIHGu+8+aVRwwLTqzm5blnFwU3k9n0yHkpBChyw/DeiTEIHGu+8+aVRwwLTqzm5blnFwU3k9n0yHkpBChyw/DeiTEIHGu+8+aVRwwLTqzm5blnFwU3k9n0yHkpBChyw/DeiTEIHGu+8+aVRwwLTqzm5blnFwU3k9n0yHkpBCh5wO/egDEIHGu+8+aVRwwLTqzm5blmFQU5lNjzx3glBChyw/DeiTEIHGu+8+aVRwwLTqzm5blmFQU5lNjzx3glBChyw/DeiTEIHGu+8+aVRwwLTqzm5blmFQU5lNjzx3glBChyw/DeiTEIHGu+8+aVRwwLTqzm5bllFQU3k9r0yHkpBChyw/DeiTEIHGu+8+aVRw==');
    audioRef.current.volume = 0.3;
  }, []);

  useEffect(() => {
    if (!socket) return;

    // Listen for coaching reminders
    const handleCoachingReminder = (data: any) => {
      if (data.sessionId !== sessionId) return;
      
      const reminder: CoachingReminder = {
        ...data.reminder,
        timestamp: new Date(data.reminder.timestamp)
      };
      
      setCurrentReminder(reminder);
      setReminderHistory(prev => [...prev, reminder]);
      
      // Play sound if enabled
      if (soundEnabled && audioRef.current) {
        audioRef.current.play().catch(console.error);
      }
      
      // Show toast for critical reminders
      if (reminder.severity === 'critical') {
        toast({
          title: reminder.title,
          description: reminder.message,
          variant: 'destructive',
        });
      }
      
      // Auto-dismiss after delay
      if (autoDismiss) {
        clearTimeout(dismissTimerRef.current);
        dismissTimerRef.current = setTimeout(() => {
          setCurrentReminder(null);
        }, reminder.severity === 'critical' ? 10000 : 7000);
      }
    };

    // Listen for metrics updates
    const handleMetricsUpdate = (data: any) => {
      if (data.sessionId !== sessionId) return;
      setMetrics(data.metrics);
    };

    socket.on('coaching-reminder', handleCoachingReminder);
    socket.on('teaching-metrics-update', handleMetricsUpdate);

    // Start coaching session
    socket.emit('start-coaching-session', {
      sessionId,
      teacherId,
      studentId
    });

    return () => {
      socket.off('coaching-reminder', handleCoachingReminder);
      socket.off('teaching-metrics-update', handleMetricsUpdate);
      
      // End coaching session
      socket.emit('end-coaching-session', { sessionId });
      
      clearTimeout(dismissTimerRef.current);
    };
  }, [socket, sessionId, teacherId, studentId, soundEnabled, autoDismiss, toast]);

  const dismissReminder = () => {
    clearTimeout(dismissTimerRef.current);
    setCurrentReminder(null);
  };

  const applyReminder = (reminder: CoachingReminder) => {
    // Emit event to apply the suggestion
    socket?.emit('apply-coaching-suggestion', {
      sessionId,
      reminderId: reminder.id,
      suggestion: reminder.suggestion
    });
    
    toast({
      title: 'Suggestion Applied',
      description: 'The coaching suggestion has been noted.',
    });
    
    dismissReminder();
  };

  const getIcon = (type: CoachingReminder['type']) => {
    switch (type) {
      case 'ttt': return <Users className="h-4 w-4" />;
      case 'engagement': return <Activity className="h-4 w-4" />;
      case 'questioning': return <MessageSquare className="h-4 w-4" />;
      case 'feedback': return <Target className="h-4 w-4" />;
      case 'pacing': return <Clock className="h-4 w-4" />;
      case 'encouragement': return <Heart className="h-4 w-4" />;
      default: return <Lightbulb className="h-4 w-4" />;
    }
  };

  const getSeverityColor = (severity: CoachingReminder['severity']) => {
    switch (severity) {
      case 'critical': return 'text-red-500 bg-red-100 dark:bg-red-900/20';
      case 'warning': return 'text-orange-500 bg-orange-100 dark:bg-orange-900/20';
      case 'info': return 'text-blue-500 bg-blue-100 dark:bg-blue-900/20';
      default: return 'text-gray-500 bg-gray-100 dark:bg-gray-900/20';
    }
  };

  const positionClasses = {
    'top-right': 'top-4 right-4',
    'bottom-right': 'bottom-4 right-4',
    'top-left': 'top-4 left-4',
    'bottom-left': 'bottom-4 left-4',
  };

  if (isMinimized) {
    return (
      <div className={cn('fixed z-50', positionClasses[position])}>
        <Button
          onClick={() => onMinimize?.(false)}
          size="icon"
          variant="outline"
          className="bg-white/10 backdrop-blur-lg border-white/20 shadow-lg"
        >
          <Brain className="h-4 w-4" />
        </Button>
      </div>
    );
  }

  return (
    <div className={cn('fixed z-50 w-96', positionClasses[position])}>
      <Card className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-lg border-white/20 shadow-2xl">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-sm flex items-center gap-2">
              <Brain className="h-4 w-4 text-blue-500" />
              AI Teaching Coach
            </CardTitle>
            <div className="flex items-center gap-1">
              <Button
                onClick={() => setSoundEnabled(!soundEnabled)}
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              >
                {soundEnabled ? <Volume2 className="h-3 w-3" /> : <VolumeX className="h-3 w-3" />}
              </Button>
              <Button
                onClick={() => onMinimize?.(true)}
                size="icon"
                variant="ghost"
                className="h-7 w-7"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="current">Current</TabsTrigger>
              <TabsTrigger value="metrics">Metrics</TabsTrigger>
              <TabsTrigger value="history">History</TabsTrigger>
            </TabsList>
            
            <TabsContent value="current" className="mt-4">
              {currentReminder ? (
                <AnimatePresence mode="wait">
                  <motion.div
                    key={currentReminder.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -20 }}
                  >
                    <Alert className={cn('border-2', getSeverityColor(currentReminder.severity))}>
                      <div className="flex items-start gap-2">
                        {getIcon(currentReminder.type)}
                        <div className="flex-1">
                          <AlertDescription>
                            <div className="font-semibold mb-1">{currentReminder.title}</div>
                            <div className="text-sm mb-2">{currentReminder.message}</div>
                            {currentReminder.suggestion && (
                              <div className="bg-white/50 dark:bg-black/20 rounded-lg p-2 mt-2">
                                <div className="text-xs font-medium mb-1 flex items-center gap-1">
                                  <Zap className="h-3 w-3" />
                                  Try This:
                                </div>
                                <div className="text-xs italic">{currentReminder.suggestion}</div>
                              </div>
                            )}
                            {currentReminder.metrics && (
                              <div className="mt-2 space-y-1">
                                {Object.entries(currentReminder.metrics).map(([key, value]) => (
                                  <div key={key} className="flex justify-between text-xs">
                                    <span className="text-muted-foreground">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </span>
                                    <span className="font-medium">{
                                      typeof value === 'number' && key.includes('Percentage') 
                                        ? `${value.toFixed(0)}%`
                                        : value
                                    }</span>
                                  </div>
                                ))}
                              </div>
                            )}
                          </AlertDescription>
                        </div>
                      </div>
                      {currentReminder.actionable && (
                        <div className="flex gap-2 mt-3">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => applyReminder(currentReminder)}
                            className="text-xs"
                          >
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Apply
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={dismissReminder}
                            className="text-xs"
                          >
                            Dismiss
                          </Button>
                        </div>
                      )}
                    </Alert>
                  </motion.div>
                </AnimatePresence>
              ) : (
                <div className="text-center py-8 text-sm text-muted-foreground">
                  <Brain className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p>Monitoring your teaching...</p>
                  <p className="text-xs mt-1">Reminders will appear here</p>
                </div>
              )}
            </TabsContent>
            
            <TabsContent value="metrics" className="mt-4 space-y-3">
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">TTT</div>
                  <div className="text-lg font-semibold">{metrics.tttPercentage.toFixed(0)}%</div>
                  <Progress value={metrics.tttPercentage} className="h-1 mt-1" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Engagement</div>
                  <div className="text-lg font-semibold">{metrics.studentEngagement}%</div>
                  <Progress value={metrics.studentEngagement} className="h-1 mt-1" />
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Questions</div>
                  <div className="text-lg font-semibold">{metrics.questionCount}</div>
                  <div className="text-xs">
                    {(metrics.openEndedQuestionRatio * 100).toFixed(0)}% open
                  </div>
                </div>
                <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                  <div className="text-xs text-muted-foreground">Feedback</div>
                  <div className="text-lg font-semibold">
                    {metrics.praiseCount}/{metrics.errorCorrectionCount}
                  </div>
                  <div className="text-xs">praise/corrections</div>
                </div>
              </div>
              
              <div className="bg-blue-100 dark:bg-blue-900/20 rounded-lg p-3">
                <div className="text-xs font-medium mb-1 flex items-center gap-1">
                  <BarChart className="h-3 w-3" />
                  Session Duration
                </div>
                <div className="text-sm">{Math.floor(metrics.sessionDuration / 60)} minutes</div>
              </div>
            </TabsContent>
            
            <TabsContent value="history" className="mt-4">
              <ScrollArea className="h-60">
                <div className="space-y-2">
                  {reminderHistory.length === 0 ? (
                    <div className="text-center py-8 text-sm text-muted-foreground">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p>No coaching history yet</p>
                    </div>
                  ) : (
                    reminderHistory.slice().reverse().map((reminder) => (
                      <div
                        key={reminder.id}
                        className={cn(
                          'rounded-lg p-2 text-xs',
                          getSeverityColor(reminder.severity)
                        )}
                      >
                        <div className="flex items-start gap-2">
                          {getIcon(reminder.type)}
                          <div className="flex-1">
                            <div className="font-medium">{reminder.title}</div>
                            <div className="text-xs opacity-75 mt-1">
                              {new Date(reminder.timestamp).toLocaleTimeString()}
                            </div>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            P{reminder.priority}
                          </Badge>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </ScrollArea>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}