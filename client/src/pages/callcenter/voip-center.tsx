import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { 
  Phone, 
  PhoneCall, 
  PhoneIncoming, 
  PhoneOutgoing,
  PhoneOff,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Users,
  Clock,
  Download,
  Play,
  Pause,
  RotateCcw,
  Search,
  Filter,
  Calendar,
  User,
  FileText,
  Headphones,
  Settings,
  Circle,
  CheckCircle2,
  AlertTriangle
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  status: string;
  level: string;
  courses: string[];
  lastActivity: string;
  avatar?: string;
}

interface CallLog {
  id: number;
  studentId?: number;
  studentName: string;
  phoneNumber: string;
  direction: 'inbound' | 'outbound';
  duration: number;
  status: 'completed' | 'missed' | 'busy' | 'no-answer';
  recordingUrl?: string;
  notes?: string;
  timestamp: string;
  agentName: string;
}

interface ActiveCall {
  callId: string;
  phoneNumber: string;
  contactName: string;
  status: 'dialing' | 'ringing' | 'connected' | 'on-hold';
  duration: number;
  isRecording: boolean;
  isMuted: boolean;
}

export default function VoIPCenter() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isHeadsetConnected, setIsHeadsetConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);

  // Check headset connection
  useEffect(() => {
    const checkAudioDevices = async () => {
      try {
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        setIsHeadsetConnected(audioInputs.length > 1 || audioOutputs.length > 1);
      } catch (error) {
        console.log('Audio device detection failed:', error);
      }
    };
    checkAudioDevices();
  }, []);

  // Data queries
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students/list"],
  });

  const { data: callLogs = [] } = useQuery<CallLog[]>({
    queryKey: ["/api/callcenter/call-logs"],
  });

  const { data: voipStatus } = useQuery({
    queryKey: ["/api/voip/status"],
    refetchInterval: 5000, // Check status every 5 seconds
  });

  // Call initiation mutation
  const initiateMutation = useMutation({
    mutationFn: async ({ phoneNumber, contactName }: { phoneNumber: string; contactName: string }) => {
      return apiRequest("/api/voip/initiate-call", {
        method: "POST",
        body: {
          phoneNumber,
          contactName,
          recordCall: true, // Always record for call center
          source: 'call_center'
        }
      });
    },
    onSuccess: (response) => {
      if (response.success) {
        setActiveCall({
          callId: response.callId,
          phoneNumber: response.phoneNumber,
          contactName: response.contactName,
          status: 'dialing',
          duration: 0,
          isRecording: true,
          isMuted: false
        });
        startCallTimer();
        toast({
          title: "Call Initiated",
          description: `Calling ${response.contactName} at ${response.phoneNumber}`,
        });
      }
    },
    onError: (error) => {
      toast({
        title: "Call Failed", 
        description: error.message || "Unable to initiate call",
        variant: "destructive",
      });
    }
  });

  // End call mutation
  const endCallMutation = useMutation({
    mutationFn: async (callId: string) => {
      return apiRequest("/api/voip/end-call", {
        method: "POST",
        body: { callId }
      });
    },
    onSuccess: () => {
      endActiveCall();
      queryClient.invalidateQueries({ queryKey: ["/api/callcenter/call-logs"] });
    }
  });

  // Start call timer
  const startCallTimer = () => {
    if (callTimerRef.current) clearInterval(callTimerRef.current);
    callTimerRef.current = setInterval(() => {
      setCallDuration(prev => prev + 1);
    }, 1000);
  };

  // End active call
  const endActiveCall = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
    setActiveCall(null);
    setCallDuration(0);
    toast({
      title: "Call Ended",
      description: "Call recording saved to student history",
    });
  };

  // Handle call initiation
  const handleCall = (phone: string, name: string) => {
    if (!isHeadsetConnected) {
      toast({
        title: "Headset Required",
        description: "Please connect a headset before making calls",
        variant: "destructive",
      });
      return;
    }

    initiateMutation.mutate({ phoneNumber: phone, contactName: name });
  };

  // Handle student call
  const handleStudentCall = (student: Student) => {
    setSelectedStudent(student);
    handleCall(student.phone, `${student.firstName} ${student.lastName}`);
  };

  // Toggle mute
  const toggleMute = () => {
    if (activeCall) {
      setActiveCall(prev => prev ? { ...prev, isMuted: !prev.isMuted } : null);
      toast({
        title: activeCall.isMuted ? "Unmuted" : "Muted",
        description: `Microphone ${activeCall.isMuted ? 'enabled' : 'disabled'}`,
      });
    }
  };

  // Format call duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Filter students based on search
  const filteredStudents = students.filter(student =>
    student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.phone.includes(searchTerm)
  );

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">VoIP Call Center</h1>
            <p className="text-muted-foreground">
              Make and receive calls using Isabel VoIP Line (+9848325)
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isHeadsetConnected ? "default" : "destructive"} className="flex items-center space-x-2">
              <Headphones className="h-3 w-3" />
              <span>{isHeadsetConnected ? "Headset Connected" : "No Headset"}</span>
            </Badge>
            <Badge variant={voipStatus?.connected ? "default" : "secondary"} className="flex items-center space-x-2">
              <Circle className={`h-3 w-3 ${voipStatus?.connected ? 'fill-green-500' : 'fill-gray-400'}`} />
              <span>VoIP {voipStatus?.connected ? 'Connected' : 'Offline'}</span>
            </Badge>
          </div>
        </div>

        {/* Active Call Widget */}
        {activeCall && (
          <Alert className="border-green-200 bg-green-50">
            <PhoneCall className="h-4 w-4" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div>
                    <div className="font-semibold">{activeCall.contactName}</div>
                    <div className="text-sm text-gray-600">{activeCall.phoneNumber}</div>
                  </div>
                  <Badge variant="outline" className="capitalize">{activeCall.status}</Badge>
                  <div className="text-lg font-mono">{formatDuration(callDuration)}</div>
                </div>
                <div className="flex items-center space-x-2">
                  <Button
                    size="sm"
                    variant={activeCall.isMuted ? "destructive" : "outline"}
                    onClick={toggleMute}
                  >
                    {activeCall.isMuted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                  </Button>
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => endCallMutation.mutate(activeCall.callId)}
                  >
                    <PhoneOff className="h-4 w-4" />
                    End Call
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="dialer" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dialer">Phone Dialer</TabsTrigger>
            <TabsTrigger value="students">Student Directory</TabsTrigger>
            <TabsTrigger value="history">Call History</TabsTrigger>
            <TabsTrigger value="recordings">Recordings</TabsTrigger>
          </TabsList>

          {/* Phone Dialer Tab */}
          <TabsContent value="dialer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>Manual Dialer</span>
                </CardTitle>
                <CardDescription>
                  Dial any number using Isabel VoIP Line
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder="Enter phone number (e.g., +989123456789)"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleCall(phoneNumber, "Manual Call")}
                    disabled={!phoneNumber || !!activeCall || !isHeadsetConnected}
                    className="flex items-center space-x-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>Call</span>
                  </Button>
                </div>
                {!isHeadsetConnected && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Headset required for VoIP calling. Please connect your headset to laptop.
                    </AlertDescription>
                  </Alert>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Student Directory Tab */}
          <TabsContent value="students" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Student Directory</CardTitle>
                <CardDescription>
                  Call students directly and archive all conversations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex space-x-2 mb-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search students by name or phone..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                </div>
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {filteredStudents.map(student => (
                    <div key={student.id} className="flex items-center justify-between p-3 border rounded-lg hover:bg-gray-50">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src={student.avatar} />
                          <AvatarFallback>{student.firstName[0]}{student.lastName[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{student.firstName} {student.lastName}</div>
                          <div className="text-sm text-gray-600">{student.phone}</div>
                          <div className="text-xs text-gray-500">Level: {student.level} • {student.courses.join(', ')}</div>
                        </div>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => handleStudentCall(student)}
                        disabled={!!activeCall || !isHeadsetConnected}
                        className="flex items-center space-x-1"
                      >
                        <Phone className="h-3 w-3" />
                        <span>Call</span>
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Call History Tab */}
          <TabsContent value="history" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call History</CardTitle>
                <CardDescription>
                  All calls are automatically archived per student
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {callLogs.map(log => (
                    <div key={log.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className={`p-2 rounded-full ${log.direction === 'outbound' ? 'bg-blue-100' : 'bg-green-100'}`}>
                          {log.direction === 'outbound' ? 
                            <PhoneOutgoing className="h-4 w-4 text-blue-600" /> : 
                            <PhoneIncoming className="h-4 w-4 text-green-600" />
                          }
                        </div>
                        <div>
                          <div className="font-medium">{log.studentName}</div>
                          <div className="text-sm text-gray-600">{log.phoneNumber}</div>
                          <div className="text-xs text-gray-500">
                            {new Date(log.timestamp).toLocaleString()} • {formatDuration(log.duration)} • {log.agentName}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge variant={log.status === 'completed' ? 'default' : 'secondary'}>
                          {log.status}
                        </Badge>
                        {log.recordingUrl && (
                          <Button size="sm" variant="outline">
                            <Play className="h-3 w-3 mr-1" />
                            Play
                          </Button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Recordings Tab */}
          <TabsContent value="recordings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Call Recordings</CardTitle>
                <CardDescription>
                  Student-specific call archives for future reference
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  <FileText className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>Call recordings will appear here after calls are completed</p>
                  <p className="text-sm">All calls are automatically recorded and archived per student</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}