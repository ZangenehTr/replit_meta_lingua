import React, { useState, useEffect, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Progress } from '@/components/ui/progress';
import { AlertTriangle, TrendingUp, TrendingDown, Users, Mic, MicOff } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TTTMonitorProps {
  isCallActive: boolean;
  teacherId: number;
  studentId: number;
  callId?: string;
}

interface SpeakingMetrics {
  teacherTime: number; // seconds
  studentTime: number; // seconds
  silenceTime: number; // seconds
  totalTime: number; // seconds
  teacherPercentage: number;
  studentPercentage: number;
  silencePercentage: number;
}

interface Alert {
  type: 'teacher_high' | 'student_low';
  message: string;
  timestamp: Date;
}

export function TTTMonitor({ isCallActive, teacherId, studentId, callId }: TTTMonitorProps) {
  const [metrics, setMetrics] = useState<SpeakingMetrics>({
    teacherTime: 0,
    studentTime: 0,
    silenceTime: 0,
    totalTime: 0,
    teacherPercentage: 0,
    studentPercentage: 0,
    silencePercentage: 0
  });

  const [currentSpeaker, setCurrentSpeaker] = useState<'teacher' | 'student' | 'silence'>('silence');
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [minuteByMinuteData, setMinuteByMinuteData] = useState<any[]>([]);
  
  const intervalRef = useRef<NodeJS.Timeout>();
  const lastUpdateRef = useRef<Date>(new Date());
  const alertCheckIntervalRef = useRef<NodeJS.Timeout>();
  const currentMinuteDataRef = useRef({ teacherTime: 0, studentTime: 0, silenceTime: 0 });

  // Threshold constants
  const TEACHER_THRESHOLD = 40; // Teacher should not exceed 40%
  const STUDENT_THRESHOLD = 60; // Student should speak at least 60%

  // Update metrics every second when call is active
  useEffect(() => {
    if (isCallActive) {
      lastUpdateRef.current = new Date();
      
      intervalRef.current = setInterval(() => {
        const now = new Date();
        const timeDiff = (now.getTime() - lastUpdateRef.current.getTime()) / 1000; // seconds
        lastUpdateRef.current = now;

        setMetrics(prev => {
          const newMetrics = { ...prev };
          newMetrics.totalTime += timeDiff;

          // Update time based on current speaker
          switch (currentSpeaker) {
            case 'teacher':
              newMetrics.teacherTime += timeDiff;
              currentMinuteDataRef.current.teacherTime += timeDiff;
              break;
            case 'student':
              newMetrics.studentTime += timeDiff;
              currentMinuteDataRef.current.studentTime += timeDiff;
              break;
            default:
              newMetrics.silenceTime += timeDiff;
              currentMinuteDataRef.current.silenceTime += timeDiff;
          }

          // Calculate percentages
          if (newMetrics.totalTime > 0) {
            newMetrics.teacherPercentage = (newMetrics.teacherTime / newMetrics.totalTime) * 100;
            newMetrics.studentPercentage = (newMetrics.studentTime / newMetrics.totalTime) * 100;
            newMetrics.silencePercentage = (newMetrics.silenceTime / newMetrics.totalTime) * 100;
          }

          return newMetrics;
        });
      }, 1000);

      // Check thresholds every 30 seconds
      alertCheckIntervalRef.current = setInterval(() => {
        checkThresholds();
      }, 30000);

      // Save minute-by-minute data
      const minuteInterval = setInterval(() => {
        const minuteData = {
          minute: Math.floor(metrics.totalTime / 60) + 1,
          ...currentMinuteDataRef.current,
          timestamp: new Date()
        };
        setMinuteByMinuteData(prev => [...prev, minuteData]);
        currentMinuteDataRef.current = { teacherTime: 0, studentTime: 0, silenceTime: 0 };
      }, 60000);

      return () => {
        clearInterval(intervalRef.current);
        clearInterval(alertCheckIntervalRef.current);
        clearInterval(minuteInterval);
      };
    }
  }, [isCallActive, currentSpeaker]);

  const checkThresholds = () => {
    const newAlerts: Alert[] = [];

    // Check teacher threshold
    if (metrics.teacherPercentage > TEACHER_THRESHOLD && metrics.totalTime > 60) {
      newAlerts.push({
        type: 'teacher_high',
        message: `Teacher talk time is ${metrics.teacherPercentage.toFixed(1)}% (should be under ${TEACHER_THRESHOLD}%)`,
        timestamp: new Date()
      });
    }

    // Check student threshold
    if (metrics.studentPercentage < STUDENT_THRESHOLD && metrics.totalTime > 60) {
      newAlerts.push({
        type: 'student_low',
        message: `Student talk time is ${metrics.studentPercentage.toFixed(1)}% (should be at least ${STUDENT_THRESHOLD}%)`,
        timestamp: new Date()
      });
    }

    if (newAlerts.length > 0) {
      setAlerts(prev => [...prev, ...newAlerts].slice(-5)); // Keep last 5 alerts
      
      // Send to backend for tracking
      if (callId) {
        saveMetricsToBackend();
      }
    }
  };

  const saveMetricsToBackend = async () => {
    try {
      await fetch('/api/callern/ttt/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          callId,
          metrics,
          alerts: alerts.length,
          minuteByMinuteData
        })
      });
    } catch (error) {
      console.error('Failed to save TTT metrics:', error);
    }
  };

  // Simulate speaker detection (in production, this would be connected to WebRTC audio analysis)
  const detectSpeaker = (audioLevel: number, source: 'teacher' | 'student') => {
    if (audioLevel > 0.1) { // Threshold for speech detection
      setCurrentSpeaker(source);
    } else if (audioLevel < 0.05) {
      setCurrentSpeaker('silence');
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const getProgressColor = (percentage: number, type: 'teacher' | 'student'): string => {
    if (type === 'teacher') {
      return percentage > TEACHER_THRESHOLD ? 'bg-red-500' : 'bg-green-500';
    } else {
      return percentage < STUDENT_THRESHOLD ? 'bg-orange-500' : 'bg-blue-500';
    }
  };

  return (
    <div className="space-y-4">
      {/* Main TTT Monitor Card */}
      <Card className="bg-white/10 backdrop-blur-md border-white/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="w-5 h-5" />
            TTT Monitor
            {isCallActive && (
              <span className="ml-auto text-sm font-normal text-gray-400">
                Total: {formatTime(metrics.totalTime)}
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Teacher Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                Teacher
                {currentSpeaker === 'teacher' && <Mic className="w-4 h-4 text-green-500 animate-pulse" />}
              </span>
              <span className={cn(
                "text-sm font-bold",
                metrics.teacherPercentage > TEACHER_THRESHOLD ? "text-red-500" : "text-green-500"
              )}>
                {metrics.teacherPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.teacherPercentage} 
              className="h-3"
              style={{
                background: `linear-gradient(to right, ${getProgressColor(metrics.teacherPercentage, 'teacher')} ${metrics.teacherPercentage}%, #374151 ${metrics.teacherPercentage}%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(metrics.teacherTime)}</span>
              <span>Target: &lt;{TEACHER_THRESHOLD}%</span>
            </div>
          </div>

          {/* Student Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                Student
                {currentSpeaker === 'student' && <Mic className="w-4 h-4 text-blue-500 animate-pulse" />}
              </span>
              <span className={cn(
                "text-sm font-bold",
                metrics.studentPercentage < STUDENT_THRESHOLD ? "text-orange-500" : "text-blue-500"
              )}>
                {metrics.studentPercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.studentPercentage} 
              className="h-3"
              style={{
                background: `linear-gradient(to right, ${getProgressColor(metrics.studentPercentage, 'student')} ${metrics.studentPercentage}%, #374151 ${metrics.studentPercentage}%)`
              }}
            />
            <div className="flex justify-between text-xs text-gray-400">
              <span>{formatTime(metrics.studentTime)}</span>
              <span>Target: &gt;{STUDENT_THRESHOLD}%</span>
            </div>
          </div>

          {/* Silence Metrics */}
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium flex items-center gap-2">
                Silence
                {currentSpeaker === 'silence' && <MicOff className="w-4 h-4 text-gray-500" />}
              </span>
              <span className="text-sm text-gray-400">
                {metrics.silencePercentage.toFixed(1)}%
              </span>
            </div>
            <Progress 
              value={metrics.silencePercentage} 
              className="h-2 bg-gray-700"
            />
            <div className="text-xs text-gray-400">
              {formatTime(metrics.silenceTime)}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="space-y-2">
          {alerts.slice(-2).map((alert, index) => (
            <Alert 
              key={index}
              className={cn(
                "backdrop-blur-md border",
                alert.type === 'teacher_high' 
                  ? "bg-red-500/10 border-red-500/50" 
                  : "bg-orange-500/10 border-orange-500/50"
              )}
            >
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="flex items-center justify-between">
                <span>{alert.message}</span>
                <span className="text-xs text-gray-400">
                  {alert.timestamp.toLocaleTimeString()}
                </span>
              </AlertDescription>
            </Alert>
          ))}
        </div>
      )}

      {/* Quick Stats */}
      {isCallActive && metrics.totalTime > 30 && (
        <div className="grid grid-cols-2 gap-2">
          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Balance</span>
                {Math.abs(metrics.teacherPercentage - metrics.studentPercentage) < 10 ? (
                  <TrendingUp className="w-4 h-4 text-green-500" />
                ) : (
                  <TrendingDown className="w-4 h-4 text-red-500" />
                )}
              </div>
              <p className="text-sm font-bold mt-1">
                {Math.abs(metrics.teacherPercentage - metrics.studentPercentage).toFixed(1)}% diff
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 backdrop-blur-sm border-white/10">
            <CardContent className="p-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-400">Alerts</span>
                <AlertTriangle className="w-4 h-4 text-yellow-500" />
              </div>
              <p className="text-sm font-bold mt-1">
                {alerts.length} total
              </p>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}