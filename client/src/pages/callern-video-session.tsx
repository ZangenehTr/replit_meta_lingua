import { useState, useEffect, useRef, useCallback } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useParams } from "wouter";
import SimplePeer from "simple-peer";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, BookOpen, Brain, AlertCircle, 
  CheckCircle, ChevronRight, Volume2, Clock,
  Lightbulb, Target, Info, HelpCircle, Sparkles,
  Activity, TrendingUp, Award, RefreshCw
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { io, Socket } from "socket.io-client";
import { apiRequest } from "@/lib/queryClient";
import { motion, AnimatePresence } from "framer-motion";
import { useAuth } from "@/hooks/use-auth";

interface RoadmapStep {
  id: number;
  title: string;
  description: string;
  objectives: string;
  estimatedMinutes: number;
  skillFocus: string;
  materials: {
    aiTeacherGuidance?: {
      keyPoints: string[];
      suggestedQuestions: string[];
      commonMistakes: string[];
      studentHesitationHelp: string[];
    };
  };
}

interface TeacherBriefing {
  student: {
    id: string;
    profile: any;
    completedSteps: number;
    totalSteps: number;
    progressPercentage: number;
  };
  currentStep: RoadmapStep;
  previousTeacherNotes: any[];
  roadmap: {
    name: string;
    description: string;
  };
  teachingGuidance: {
    keyPoints: string[];
    suggestedQuestions: string[];
    commonMistakes: string[];
    studentHesitationHelp: string[];
  };
}

interface WordSuggestion {
  word: string;
  translation: string;
  pronunciation: string;
  example: string;
  confidence: number;
}

// Speech recognition setup
declare global {
  interface Window {
    webkitSpeechRecognition: any;
    SpeechRecognition: any;
  }
}

export default function CallernVideoSession() {
  const { toast } = useToast();
  const params = useParams() as { packageId: string; studentId: string; teacherId: string };
  const { user } = useAuth();
  
  // Determine if the current user is the teacher
  const isTeacher = user?.role === "Teacher/Tutor" && user?.id === parseInt(params.teacherId);
  const studentId = params.studentId;
  const teacherId = params.teacherId;
  const packageId = params.packageId;
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [peer, setPeer] = useState<SimplePeer.Instance | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  
  // AI Assistant States
  const [isListening, setIsListening] = useState(false);
  const [currentTranscript, setCurrentTranscript] = useState("");
  const [hesitationDetected, setHesitationDetected] = useState(false);
  const [wordSuggestions, setWordSuggestions] = useState<WordSuggestion[]>([]);
  const [showAIHelp, setShowAIHelp] = useState(false);
  const [silenceTimer, setSilenceTimer] = useState<NodeJS.Timeout | null>(null);
  const [lastSpokenTime, setLastSpokenTime] = useState(Date.now());
  const [aiResponseLoading, setAiResponseLoading] = useState(false);
  
  // Teacher Guidance States
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [showTeacherGuidance, setShowTeacherGuidance] = useState(isTeacher);
  const [stepProgress, setStepProgress] = useState(0);
  const [sessionDuration, setSessionDuration] = useState(0);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const recognitionRef = useRef<any>(null);
  const sessionStartTime = useRef(Date.now());

  // Fetch teacher briefing
  const { data: briefing, isLoading: briefingLoading } = useQuery<TeacherBriefing>({
    queryKey: [`/api/callern/teacher-briefing/${studentId}/${packageId}`],
    enabled: isTeacher
  });

  // Initialize WebRTC and Socket.io
  useEffect(() => {
    const initializeCall = async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        setLocalStream(stream);
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Initialize Socket.io connection
        const newSocket = io("/", {
          transports: ["websocket"],
          query: {
            userId: isTeacher ? teacherId : studentId,
            role: isTeacher ? "teacher" : "student",
            packageId
          }
        });

        newSocket.on("connect", () => {
          console.log("Connected to signaling server");
          setConnectionStatus("connecting");
        });

        newSocket.on("signal", (data: any) => {
          if (peer) {
            peer.signal(data);
          }
        });

        setSocket(newSocket);

        // Initialize SimplePeer
        const newPeer = new SimplePeer({
          initiator: isTeacher,
          trickle: false,
          stream: stream
        });

        newPeer.on("signal", (data) => {
          newSocket.emit("signal", data);
        });

        newPeer.on("stream", (remoteStreamData) => {
          setRemoteStream(remoteStreamData);
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = remoteStreamData;
          }
          setConnectionStatus("connected");
        });

        newPeer.on("connect", () => {
          setConnectionStatus("connected");
          toast({
            title: "Connected",
            description: "Video call connected successfully"
          });
        });

        newPeer.on("error", (err) => {
          console.error("Peer error:", err);
          setConnectionStatus("disconnected");
        });

        setPeer(newPeer);

      } catch (error) {
        console.error("Error initializing call:", error);
        toast({
          title: "Error",
          description: "Failed to initialize video call",
          variant: "destructive"
        });
      }
    };

    initializeCall();

    // Initialize speech recognition
    initializeSpeechRecognition();

    // Start session timer
    const timer = setInterval(() => {
      setSessionDuration(Math.floor((Date.now() - sessionStartTime.current) / 1000));
    }, 1000);

    return () => {
      clearInterval(timer);
      if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
      }
      if (socket) {
        socket.disconnect();
      }
      if (peer) {
        peer.destroy();
      }
      if (recognitionRef.current) {
        recognitionRef.current.stop();
      }
    };
  }, []);

  // Initialize Speech Recognition
  const initializeSpeechRecognition = () => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US'; // Can be changed based on target language

      recognition.onresult = (event: any) => {
        const current = event.resultIndex;
        const transcript = event.results[current][0].transcript;
        setCurrentTranscript(transcript);
        setLastSpokenTime(Date.now());
        setHesitationDetected(false);

        // Clear silence timer
        if (silenceTimer) {
          clearTimeout(silenceTimer);
        }

        // Detect hesitation patterns
        detectHesitation(transcript);
      };

      recognition.onerror = (event: any) => {
        console.error("Speech recognition error:", event.error);
      };

      recognition.onend = () => {
        // Restart if still listening
        if (isListening) {
          recognition.start();
        }
      };

      recognitionRef.current = recognition;
    }
  };

  // Detect hesitation in speech
  const detectHesitation = (transcript: string) => {
    const hesitationPatterns = [
      /um+/gi,
      /uh+/gi,
      /er+/gi,
      /\.\.\./g,
      /hmm+/gi,
      /well+\s+um/gi,
      /you know/gi,
      /like\s+um/gi
    ];

    const hasHesitation = hesitationPatterns.some(pattern => pattern.test(transcript));
    
    // Also detect long pauses (3+ seconds of no new words)
    const newSilenceTimer = setTimeout(() => {
      const timeSinceLastWord = Date.now() - lastSpokenTime;
      if (timeSinceLastWord > 3000) {
        setHesitationDetected(true);
        fetchAISuggestions(transcript);
      }
    }, 3000);

    setSilenceTimer(newSilenceTimer);

    if (hasHesitation) {
      setHesitationDetected(true);
      fetchAISuggestions(transcript);
    }
  };

  // Fetch AI suggestions when hesitation is detected
  const fetchAISuggestions = async (context: string) => {
    if (aiResponseLoading) return;
    
    setAiResponseLoading(true);
    try {
      const response = await apiRequest('/api/callern/ai/word-suggestions', {
        method: 'POST',
        body: JSON.stringify({
          context,
          level: briefing?.student?.profile?.languageLevel || 'intermediate',
          topic: briefing?.currentStep?.title || 'general conversation'
        })
      });

      if (response.suggestions) {
        setWordSuggestions(response.suggestions);
        setShowAIHelp(true);
      }
    } catch (error) {
      console.error("Error fetching AI suggestions:", error);
    } finally {
      setAiResponseLoading(false);
    }
  };

  // Toggle speech recognition
  const toggleListening = () => {
    if (!recognitionRef.current) return;

    if (isListening) {
      recognitionRef.current.stop();
      setIsListening(false);
    } else {
      recognitionRef.current.start();
      setIsListening(true);
      toast({
        title: "AI Assistant Active",
        description: "I'm listening and ready to help when you need it"
      });
    }
  };

  // Toggle audio/video
  const toggleAudio = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  // End call
  const endCall = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
    }
    if (socket) {
      socket.disconnect();
    }
    if (peer) {
      peer.destroy();
    }
    setConnectionStatus("disconnected");
  };

  // Format time
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Move to next roadmap step
  const moveToNextStep = () => {
    if (briefing && currentStepIndex < briefing.student.totalSteps - 1) {
      setCurrentStepIndex(prev => prev + 1);
      setStepProgress(0);
      toast({
        title: "Moving to next step",
        description: "Let's continue with the next part of the lesson"
      });
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold">Callern Session</h1>
            <Badge variant={connectionStatus === "connected" ? "default" : "secondary"}>
              {connectionStatus === "connected" ? "Connected" : connectionStatus === "connecting" ? "Connecting..." : "Disconnected"}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              {formatTime(sessionDuration)}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {!isTeacher && (
              <Button
                variant={isListening ? "default" : "outline"}
                size="sm"
                onClick={toggleListening}
                className="flex items-center gap-2"
              >
                <Brain className="w-4 h-4" />
                {isListening ? "AI Listening" : "Enable AI Assistant"}
              </Button>
            )}
            <Button
              variant="destructive"
              size="sm"
              onClick={endCall}
            >
              <PhoneOff className="w-4 h-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Main Video Area */}
          <div className="lg:col-span-2 space-y-4">
            {/* Remote Video */}
            <Card className="relative overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-[400px] object-cover bg-gray-900"
              />
              
              {/* Local Video PiP */}
              <div className="absolute bottom-4 right-4 w-32 h-24 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
                <video
                  ref={localVideoRef}
                  autoPlay
                  playsInline
                  muted
                  className="w-full h-full object-cover"
                />
              </div>

              {/* Video Controls */}
              <div className="absolute bottom-4 left-4 flex gap-2">
                <Button
                  size="sm"
                  variant={isAudioEnabled ? "default" : "destructive"}
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-4 h-4" /> : <MicOff className="w-4 h-4" />}
                </Button>
                <Button
                  size="sm"
                  variant={isVideoEnabled ? "default" : "destructive"}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-4 h-4" /> : <VideoOff className="w-4 h-4" />}
                </Button>
              </div>

              {/* AI Suggestion Overlay (for students) */}
              {!isTeacher && showAIHelp && (
                <AnimatePresence>
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    className="absolute top-4 left-4 right-4"
                  >
                    <Card className="bg-white/95 backdrop-blur">
                      <CardHeader className="pb-2">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-4 h-4 text-yellow-500" />
                            <span className="font-semibold">AI Assistant</span>
                          </div>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => setShowAIHelp(false)}
                          >
                            ×
                          </Button>
                        </div>
                      </CardHeader>
                      <CardContent className="pt-2">
                        {hesitationDetected && (
                          <div className="mb-3">
                            <p className="text-sm text-muted-foreground mb-2">
                              I noticed you might need help. Here are some suggestions:
                            </p>
                          </div>
                        )}
                        
                        <div className="grid grid-cols-2 gap-2">
                          {wordSuggestions.map((suggestion, index) => (
                            <motion.div
                              key={index}
                              initial={{ opacity: 0, x: -10 }}
                              animate={{ opacity: 1, x: 0 }}
                              transition={{ delay: index * 0.1 }}
                              className="p-2 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100 transition-colors"
                              onClick={() => {
                                // Speak the word
                                const utterance = new SpeechSynthesisUtterance(suggestion.word);
                                speechSynthesis.speak(utterance);
                              }}
                            >
                              <div className="font-medium text-sm">{suggestion.word}</div>
                              <div className="text-xs text-muted-foreground">{suggestion.translation}</div>
                              <div className="text-xs text-blue-600 mt-1">"{suggestion.example}"</div>
                            </motion.div>
                          ))}
                        </div>

                        {currentTranscript && (
                          <div className="mt-3 p-2 bg-gray-50 rounded">
                            <p className="text-xs text-muted-foreground">What you said:</p>
                            <p className="text-sm">{currentTranscript}</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  </motion.div>
                </AnimatePresence>
              )}
            </Card>

            {/* Teacher Roadmap Progress (visible to teacher) */}
            {isTeacher && briefing && (
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold">Current Step Progress</h3>
                    <Badge>{briefing.currentStep.skillFocus}</Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{briefing.currentStep.title}</span>
                        <span className="text-sm text-muted-foreground">
                          {briefing.currentStep.estimatedMinutes} min
                        </span>
                      </div>
                      <Progress value={stepProgress} className="h-2" />
                    </div>
                    
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">
                        Step {currentStepIndex + 1} of {briefing.student.totalSteps}
                      </span>
                      <Button size="sm" onClick={moveToNextStep}>
                        Next Step <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar */}
          <div className="space-y-4">
            {/* Teacher Guidance Panel (visible to teacher) */}
            {isTeacher && briefing && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4" />
                    <h3 className="font-semibold">Teaching Guidance</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px]">
                    <div className="space-y-4">
                      {/* Student Info */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2">Student Progress</h4>
                        <div className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Overall Progress</span>
                            <span>{briefing.student.progressPercentage}%</span>
                          </div>
                          <Progress value={briefing.student.progressPercentage} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            {briefing.student.completedSteps} of {briefing.student.totalSteps} steps completed
                          </p>
                        </div>
                      </div>

                      <Separator />

                      {/* Current Step Objectives */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Target className="w-3 h-3" />
                          Learning Objectives
                        </h4>
                        <div className="space-y-1">
                          {briefing.currentStep.objectives.split('\n').map((obj, i) => (
                            <div key={i} className="flex items-start gap-2">
                              <CheckCircle className="w-3 h-3 text-green-500 mt-0.5" />
                              <p className="text-xs">{obj}</p>
                            </div>
                          ))}
                        </div>
                      </div>

                      <Separator />

                      {/* Key Points */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Info className="w-3 h-3" />
                          Key Points to Cover
                        </h4>
                        <div className="space-y-1">
                          {briefing.teachingGuidance.keyPoints.map((point, i) => (
                            <div key={i} className="p-2 bg-blue-50 rounded text-xs">
                              {point}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Suggested Questions */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <HelpCircle className="w-3 h-3" />
                          Suggested Questions
                        </h4>
                        <div className="space-y-1">
                          {briefing.teachingGuidance.suggestedQuestions.map((q, i) => (
                            <div key={i} className="p-2 bg-green-50 rounded text-xs">
                              {q}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Student Hesitation Help */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <Lightbulb className="w-3 h-3" />
                          If Student Hesitates
                        </h4>
                        <div className="space-y-1">
                          {briefing.teachingGuidance.studentHesitationHelp.map((help, i) => (
                            <div key={i} className="p-2 bg-yellow-50 rounded text-xs">
                              {help}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Common Mistakes */}
                      <div>
                        <h4 className="text-sm font-semibold mb-2 flex items-center gap-1">
                          <AlertCircle className="w-3 h-3" />
                          Common Mistakes to Watch
                        </h4>
                        <div className="space-y-1">
                          {briefing.teachingGuidance.commonMistakes.map((mistake, i) => (
                            <div key={i} className="p-2 bg-red-50 rounded text-xs">
                              {mistake}
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>
            )}

            {/* Student Progress Panel (visible to student) */}
            {!isTeacher && (
              <Card>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4" />
                    <h3 className="font-semibold">Session Progress</h3>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">Speaking Time</span>
                        <span className="text-sm font-medium">{formatTime(sessionDuration)}</span>
                      </div>
                      <Progress value={(sessionDuration / 1800) * 100} className="h-2" />
                    </div>

                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm">AI Assistance Used</span>
                        <span className="text-sm font-medium">{wordSuggestions.length} times</span>
                      </div>
                    </div>

                    <Separator />

                    <div>
                      <h4 className="text-sm font-semibold mb-2">Session Stats</h4>
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div className="flex items-center gap-1">
                          <TrendingUp className="w-3 h-3 text-green-500" />
                          <span>Fluency: Good</span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Award className="w-3 h-3 text-yellow-500" />
                          <span>Confidence: Building</span>
                        </div>
                      </div>
                    </div>

                    {hesitationDetected && (
                      <div className="p-2 bg-yellow-50 rounded">
                        <p className="text-xs text-yellow-800">
                          Take your time! The AI assistant is here to help when you need it.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}