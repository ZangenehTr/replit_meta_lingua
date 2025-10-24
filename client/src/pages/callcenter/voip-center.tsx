import React, { useState, useEffect, useRef } from 'react';
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
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
  const { t } = useTranslation();
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [activeCall, setActiveCall] = useState<ActiveCall | null>(null);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [callDuration, setCallDuration] = useState(0);
  const [isHeadsetConnected, setIsHeadsetConnected] = useState(false);
  const [audioLevel, setAudioLevel] = useState(0);
  const [audioDevices, setAudioDevices] = useState<{ inputs: MediaDeviceInfo[], outputs: MediaDeviceInfo[] }>({ inputs: [], outputs: [] });
  const [selectedAudioInput, setSelectedAudioInput] = useState<string>('');
  const [selectedAudioOutput, setSelectedAudioOutput] = useState<string>('');
  const [micPermissionGranted, setMicPermissionGranted] = useState(false);
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const mediaStreamRef = useRef<MediaStream | null>(null);

  // Enhanced audio device detection and management
  useEffect(() => {
    const requestMicrophonePermission = async () => {
      try {
        // Request microphone permission first
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        setMicPermissionGranted(true);
        mediaStreamRef.current = stream;
        
        // Now enumerate devices (this will show device labels)
        const devices = await navigator.mediaDevices.enumerateDevices();
        const audioInputs = devices.filter(device => device.kind === 'audioinput');
        const audioOutputs = devices.filter(device => device.kind === 'audiooutput');
        
        setAudioDevices({ inputs: audioInputs, outputs: audioOutputs });
        
        // Check for Bluetooth or external audio devices
        const hasBluetoothInput = audioInputs.some(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('airpods') ||
          device.label.toLowerCase().includes('headset') ||
          device.label.toLowerCase().includes('headphones') ||
          device.deviceId !== 'default'
        );
        
        const hasBluetoothOutput = audioOutputs.some(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('airpods') ||
          device.label.toLowerCase().includes('headset') ||
          device.label.toLowerCase().includes('headphones') ||
          device.deviceId !== 'default'
        );
        
        setIsHeadsetConnected(hasBluetoothInput || hasBluetoothOutput || audioInputs.length > 1);
        
        // Auto-select first non-default Bluetooth device
        const bluetoothInput = audioInputs.find(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('airpods') ||
          device.label.toLowerCase().includes('headset')
        );
        const bluetoothOutput = audioOutputs.find(device => 
          device.label.toLowerCase().includes('bluetooth') ||
          device.label.toLowerCase().includes('airpods') ||
          device.label.toLowerCase().includes('headset')
        );
        
        if (bluetoothInput) setSelectedAudioInput(bluetoothInput.deviceId);
        if (bluetoothOutput) setSelectedAudioOutput(bluetoothOutput.deviceId);
        
      } catch (error) {
        console.log('Microphone permission denied or audio device detection failed:', error);
        setMicPermissionGranted(false);
        setIsHeadsetConnected(false);
      }
    };
    
    requestMicrophonePermission();
    
    // Listen for device changes (when Bluetooth devices connect/disconnect)
    const handleDeviceChange = () => {
      requestMicrophonePermission();
    };
    
    navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
    
    return () => {
      navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      if (mediaStreamRef.current) {
        mediaStreamRef.current.getTracks().forEach(track => track.stop());
      }
    };
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
          title: t('messages.callInitiated'),
          description: t('messages.callingContact', { name: response.contactName, phone: response.phoneNumber }),
        });
      }
    },
    onError: (error) => {
      toast({
        title: t('messages.callFailed'), 
        description: error.message || t('messages.unableToInitiateCall'),
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
      title: t('messages.callEnded'),
      description: t('messages.callRecordingSaved'),
    });
  };

  // Handle call initiation with enhanced audio setup
  const handleCall = async (phone: string, name: string) => {
    if (!micPermissionGranted) {
      toast({
        title: t('messages.microphonePermissionRequired'),
        description: t('messages.allowMicrophoneAccess'),
        variant: "destructive",
      });
      return;
    }
    
    if (!isHeadsetConnected && audioDevices.inputs.length <= 1) {
      toast({
        title: t('messages.audioDeviceRecommended'),
        description: t('messages.connectBluetoothHeadset'),
        variant: "destructive",
      });
      return;
    }

    // Configure audio for the call if specific devices are selected
    try {
      if (selectedAudioInput) {
        const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: { exact: selectedAudioInput } }
        });
        mediaStreamRef.current = stream;
      }
    } catch (error) {
      console.warn('Failed to use selected audio input:', error);
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
      <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">{t('voip.voipCenter')}</h1>
            <p className="text-muted-foreground">
              {t('voip.makeReceiveCalls')}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <Badge variant={isHeadsetConnected ? "default" : micPermissionGranted ? "secondary" : "destructive"} className="flex items-center space-x-2">
              <Headphones className="h-3 w-3" />
              <span>
                {isHeadsetConnected ? t('voip.audioReady') : 
                 micPermissionGranted ? t('voip.builtInAudio') : t('voip.noAudioAccess')}
              </span>
            </Badge>
            <Badge variant={voipStatus?.connected ? "default" : "secondary"} className="flex items-center space-x-2">
              <Circle className={`h-3 w-3 ${voipStatus?.connected ? 'fill-green-500' : 'fill-gray-400'}`} />
              <span>{voipStatus?.connected ? t('voip.voipConnected') : t('voip.voipOffline')}</span>
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
                    {t('actions.endCall')}
                  </Button>
                </div>
              </div>
            </AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="dialer" className="space-y-4">
          <TabsList>
            <TabsTrigger value="dialer">{t('voip.phoneDialer')}</TabsTrigger>
            <TabsTrigger value="students">{t('voip.studentDirectory')}</TabsTrigger>
            <TabsTrigger value="history">{t('voip.callHistory')}</TabsTrigger>
            <TabsTrigger value="recordings">{t('voip.recordings')}</TabsTrigger>
          </TabsList>

          {/* Phone Dialer Tab */}
          <TabsContent value="dialer" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Phone className="h-5 w-5" />
                  <span>{t('voip.manualDialer')}</span>
                </CardTitle>
                <CardDescription>
                  {t('voip.dialAnyNumber')}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    placeholder={t('placeholders.enterPhoneNumber')}
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="flex-1"
                  />
                  <Button 
                    onClick={() => handleCall(phoneNumber, "Manual Call")}
                    disabled={!phoneNumber || !!activeCall || !micPermissionGranted}
                    className="flex items-center space-x-2"
                  >
                    <PhoneCall className="h-4 w-4" />
                    <span>{t('actions.call')}</span>
                  </Button>
                </div>
                {!micPermissionGranted && (
                  <Alert variant="destructive">
                    <AlertTriangle className="h-4 w-4" />
                    <AlertDescription>
                      Microphone access required for VoIP calling. Please allow microphone permission in your browser.
                    </AlertDescription>
                  </Alert>
                )}
                
                {micPermissionGranted && audioDevices.inputs.length > 0 && (
                  <div className="space-y-3">
                    <div className="text-sm font-medium text-gray-700">{t('voip.audioConfiguration')}</div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t('voip.microphoneInput')}</label>
                        <select 
                          value={selectedAudioInput} 
                          onChange={(e) => setSelectedAudioInput(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('voip.default')}</option>
                          {audioDevices.inputs.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || 'Unknown Device'}
                            </option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="text-xs text-gray-500 mb-1 block">{t('voip.audioOutput')}</label>
                        <select 
                          value={selectedAudioOutput} 
                          onChange={(e) => setSelectedAudioOutput(e.target.value)}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        >
                          <option value="">{t('voip.default')}</option>
                          {audioDevices.outputs.map(device => (
                            <option key={device.deviceId} value={device.deviceId}>
                              {device.label || 'Unknown Device'}
                            </option>
                          ))}
                        </select>
                      </div>
                    </div>
                    <div className="flex items-center text-xs text-gray-600">
                      <Circle className={`h-2 w-2 mr-2 ${isHeadsetConnected ? 'fill-green-500' : 'fill-yellow-500'}`} />
                      <span>
                        {isHeadsetConnected ? 
                          'External audio device detected - optimal call quality' : 
                          'Using built-in audio - consider using Bluetooth headset for better quality'
                        }
                      </span>
                    </div>
                  </div>
                )}
                
                {/* Audio Device Test Section */}
                {micPermissionGranted && (
                  <div className="mt-4 p-4 border border-gray-200 rounded-lg bg-gray-50">
                    <div className="flex items-center justify-between mb-3">
                      <div className="text-sm font-medium text-gray-700">Audio Device Test</div>
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={async () => {
                          try {
                            const stream = await navigator.mediaDevices.getUserMedia({
                              audio: selectedAudioInput ? { deviceId: { exact: selectedAudioInput } } : true
                            });
                            toast({
                              title: t('messages.audioTestSuccessful'),
                              description: `Microphone ${selectedAudioInput ? 'device' : '(default)'} is working properly`,
                            });
                            stream.getTracks().forEach(track => track.stop());
                          } catch (error) {
                            toast({
                              title: "Audio Test Failed",
                              description: "Selected microphone device is not accessible",
                              variant: "destructive",
                            });
                          }
                        }}
                      >
                        <Settings className="h-3 w-3 mr-1" />
                        Test Audio
                      </Button>
                    </div>
                    <div className="text-xs text-gray-600">
                      Click "Test Audio" to verify your selected microphone is working before making calls.
                      {selectedAudioInput && (
                        <div className="mt-1 font-medium">
                          Selected: {audioDevices.inputs.find(d => d.deviceId === selectedAudioInput)?.label || 'Unknown Device'}
                        </div>
                      )}
                    </div>
                  </div>
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
                        <span>{t('actions.call')}</span>
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