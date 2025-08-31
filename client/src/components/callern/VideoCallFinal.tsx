import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { 
  installWebRTCErrorHandler, 
  wrapPeerConnection 
} from "@/lib/webrtc-error-handler";
import { AIOverlay } from "./AIOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, Brain, Clock, Circle,
  Wifi, WifiOff, BookOpen, AlertCircle, User,
  Sparkles, Activity, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Install WebRTC error handler
installWebRTCErrorHandler();

interface VideoCallFinalProps {
  roomId: string;
  userId: number;
  role: "student" | "teacher";
  teacherName?: string;
  studentName?: string;
  roadmapTitle?: string;
  sessionStep?: string;
  packageMinutesRemaining?: number;
  onCallEnd: () => void;
}

export function VideoCall({
  roomId,
  userId,
  role,
  teacherName,
  studentName,
  roadmapTitle,
  sessionStep,
  packageMinutesRemaining = 600,
  onCallEnd,
}: VideoCallFinalProps) {
  const { t } = useTranslation(['callern', 'common']);
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);
  
  // WebRTC + Socket
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const screenPcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  
  // Call state - NO TIME LIMIT
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<"connecting" | "connected" | "disconnected">("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const callStartTimeRef = useRef<number>(Date.now());
  const callTimerRef = useRef<NodeJS.Timeout | null>(null);
  
  // AI Features - ALWAYS VISIBLE
  const [showAIOverlay, setShowAIOverlay] = useState(true);
  const [isAIListening, setIsAIListening] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [liveScore, setLiveScore] = useState({ student: 85, teacher: 92 });
  const [engagementLevel, setEngagementLevel] = useState(100);
  const [tttRatio, setTttRatio] = useState({ teacher: 40, student: 60 });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Try asking about their day",
    "Practice present tense verbs",
    "Review vocabulary from last session"
  ]);
  const [showTeacherBriefing, setShowTeacherBriefing] = useState(role === "teacher");
  const [isCallReady, setIsCallReady] = useState(role === "student"); // Students are ready immediately, teachers after briefing
  
  // Speech detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechActivityRef = useRef({ student: 0, teacher: 0 });
  const speechMonitorIntervalRef = useRef<NodeJS.Timeout | null>(null);
  
  // Fetch teacher briefing (for teachers)
  const { data: briefing } = useQuery({
    queryKey: [`/api/callern/teacher-briefing/${roomId}`],
    enabled: role === "teacher" && showTeacherBriefing,
    // Use mock data for now
    queryFn: async () => ({
      studentName: studentName || "John Doe",
      level: "B1 - Intermediate",
      goals: "Improve conversation skills and pronunciation",
      roadmapTitle: roadmapTitle || "Business English Conversations",
      progress: 65,
      currentStep: sessionStep || "Lesson 5: Making Presentations",
      tips: [
        "Student struggles with pronunciation of 'th' sounds",
        "Prefers visual learning - use screen share when possible",
        "Responds well to positive reinforcement",
        "Focus on business vocabulary today"
      ]
    })
  });

  // Initialize call with NO TIME LIMIT
  useEffect(() => {
    if (!isCallReady) {
      console.log('Call not ready yet, waiting...');
      return;
    }
    
    let mounted = true;
    
    const initCall = async () => {
      console.log(`Initializing call for ${role}...`);
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        if (!mounted) {
          stream.getTracks().forEach(track => track.stop());
          return;
        }
        
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }
        
        // Initialize peer connection with STUN and TURN servers
        const pc = wrapPeerConnection(new RTCPeerConnection({
          iceServers: [
            { urls: "stun:stun.l.google.com:19302" },
            { urls: "stun:stun1.l.google.com:19302" },
            // Public TURN servers for fallback
            {
              urls: "turn:openrelay.metered.ca:80",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443",
              username: "openrelayproject",
              credential: "openrelayproject"
            },
            {
              urls: "turn:openrelay.metered.ca:443?transport=tcp",
              username: "openrelayproject",
              credential: "openrelayproject"
            }
          ],
          iceCandidatePoolSize: 10,
          bundlePolicy: "max-bundle",
          rtcpMuxPolicy: "require"
        }));
        
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });
        
        pc.ontrack = (event) => {
          if (remoteVideoRef.current && event.streams[0]) {
            remoteVideoRef.current.srcObject = event.streams[0];
            setConnectionStatus("connected");
            startCallTimer(); // Start timer when connected
            playCallStartSound();
          }
        };
        
        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            console.log('Sending ICE candidate');
            socketRef.current.emit("ice-candidate", {
              roomId,
              candidate: event.candidate
            });
          }
        };
        
        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          console.log('Connection state changed:', state);
          console.log('ICE connection state:', pc.iceConnectionState);
          console.log('ICE gathering state:', pc.iceGatheringState);
          
          if (state === "connected") {
            setConnectionStatus("connected");
            console.log('WebRTC connection established!');
          } else if (state === "failed") {
            setConnectionStatus("disconnected");
            console.log('WebRTC connection failed - likely firewall/NAT issue');
            // Optionally retry with different configuration
          } else if (state === "disconnected") {
            setConnectionStatus("disconnected");
            console.log('WebRTC connection disconnected');
          } else if (state === "connecting") {
            setConnectionStatus("connecting");
          }
        };
        
        // Also monitor ICE connection state for better debugging
        pc.oniceconnectionstatechange = () => {
          console.log('ICE connection state:', pc.iceConnectionState);
          if (pc.iceConnectionState === 'failed') {
            console.log('ICE connection failed - checking candidates...');
          }
        };
        
        pcRef.current = pc;
        
        // Initialize Socket.IO
        const socket = io({
          path: "/socket.io",
          transports: ["websocket", "polling"]
        });
        
        socket.on("connect", () => {
          console.log('Socket connected, joining room...');
          socket.emit("join-room", { roomId, userId, role });
        });
        
        // WebRTC signaling
        socket.on("user-joined", async ({ socketId, role: peerRole }) => {
          console.log(`User joined: ${socketId}, peer role: ${peerRole}, my role: ${role}`);
          // Only create offer if I'm the student (initiator)
          if (role === "student" && peerRole === "teacher") {
            try {
              console.log('Creating offer as student...');
              const offer = await pc.createOffer();
              await pc.setLocalDescription(offer);
              socket.emit("offer", { roomId, offer, to: socketId });
              console.log('Offer sent to teacher');
            } catch (error) {
              console.error('Error creating offer:', error);
            }
          }
        });
        
        socket.on("offer", async ({ offer, from }) => {
          console.log(`Received offer from ${from}`);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(offer));
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer, to: from });
            console.log('Answer sent back');
            
            // Add any queued ICE candidates
            if (pendingCandidatesRef.current.length > 0) {
              console.log(`Adding ${pendingCandidatesRef.current.length} queued ICE candidates`);
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidatesRef.current = [];
            }
          } catch (error) {
            console.error('Error handling offer:', error);
          }
        });
        
        socket.on("answer", async ({ answer, from }) => {
          console.log(`Received answer from ${from}`);
          try {
            await pc.setRemoteDescription(new RTCSessionDescription(answer));
            console.log('Answer set successfully');
            
            // Add any queued ICE candidates
            if (pendingCandidatesRef.current.length > 0) {
              console.log(`Adding ${pendingCandidatesRef.current.length} queued ICE candidates`);
              for (const candidate of pendingCandidatesRef.current) {
                await pc.addIceCandidate(new RTCIceCandidate(candidate));
              }
              pendingCandidatesRef.current = [];
            }
          } catch (error) {
            console.error('Error handling answer:', error);
          }
        });
        
        socket.on("ice-candidate", async ({ candidate, from }) => {
          console.log(`Received ICE candidate from ${from}`);
          try {
            if (candidate && pc.remoteDescription) {
              await pc.addIceCandidate(new RTCIceCandidate(candidate));
              console.log('ICE candidate added');
            } else if (candidate && !pc.remoteDescription) {
              console.log('Queueing ICE candidate - no remote description yet');
              // Queue the candidate to add later
              pendingCandidatesRef.current.push(candidate);
            }
          } catch (error) {
            console.error('Error adding ICE candidate:', error);
          }
        });
        
        // Screen sharing events
        socket.on("screen-share-started", ({ userId: sharingUserId }) => {
          if (sharingUserId !== userId) {
            setRemoteScreenSharing(true);
          }
        });
        
        socket.on("screen-share-stopped", ({ userId: stoppingUserId }) => {
          if (stoppingUserId !== userId) {
            setRemoteScreenSharing(false);
          }
        });
        
        // AI events - simulate real data
        socket.on("ai-suggestion", (suggestions: string[]) => {
          setAiSuggestions(suggestions);
        });
        
        socket.on("live-score-update", (score: any) => {
          setLiveScore(score);
        });
        
        socket.on("engagement-update", (level: number) => {
          setEngagementLevel(level);
        });
        
        socket.on("ttt-update", (ratio: any) => {
          setTttRatio(ratio);
        });
        
        socketRef.current = socket;
        
        // Initialize AI monitoring
        initializeAIMonitoring(stream);
        
        // Simulate AI updates
        simulateAIUpdates();
        
      } catch (error) {
        console.error("Failed to initialize call:", error);
        setConnectionStatus("disconnected");
      }
    };
    
    initCall();
    
    return () => {
      mounted = false;
      stopCallTimer();
      cleanupCall();
    };
  }, [roomId, userId, role, isCallReady]); // Added isCallReady dependency
  
  // Call timer - NO 2 MINUTE LIMIT, runs until package exhausted
  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = setInterval(() => {
      const elapsed = Math.floor((Date.now() - callStartTimeRef.current) / 1000);
      setCallDuration(elapsed);
      const currentMinutesUsed = Math.ceil(elapsed / 60);
      setMinutesUsed(currentMinutesUsed);
      
      // Only check package minutes, NO arbitrary time limit
      const remainingMinutes = packageMinutesRemaining - currentMinutesUsed;
      if (remainingMinutes === 5) {
        showWarning("⚠️ Only 5 minutes remaining in your package!");
      } else if (remainingMinutes === 1) {
        showWarning("⚠️ 1 minute left! Call will end soon.");
      } else if (remainingMinutes <= 0) {
        // Only end if package truly exhausted
        handleEndCall("Package minutes exhausted");
      }
    }, 1000);
  };
  
  const stopCallTimer = () => {
    if (callTimerRef.current) {
      clearInterval(callTimerRef.current);
      callTimerRef.current = null;
    }
  };
  
  // AI Monitoring
  const initializeAIMonitoring = (stream: MediaStream) => {
    try {
      // Prevent double initialization
      if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
        console.log('AudioContext already initialized, skipping');
        return;
      }
      
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;
      
      // Monitor speech activity
      speechMonitorIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !socketRef.current) return;
        
        const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
        analyserRef.current.getByteFrequencyData(dataArray);
        const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
        
        if (average > 30) {
          const speaker = role === "student" ? "student" : "teacher";
          speechActivityRef.current[speaker]++;
          
          socketRef.current.emit("speech-activity", {
            roomId,
            speaker,
            level: average
          });
        }
      }, 500);
    } catch (error) {
      console.error("Failed to initialize AI monitoring:", error);
    }
  };
  
  // Simulate AI updates for demo
  const simulateAIUpdates = () => {
    // Update scores
    setInterval(() => {
      setLiveScore({
        student: Math.floor(80 + Math.random() * 20),
        teacher: Math.floor(85 + Math.random() * 15)
      });
    }, 5000);
    
    // Update engagement
    setInterval(() => {
      setEngagementLevel(Math.floor(70 + Math.random() * 30));
    }, 3000);
    
    // Update TTT ratio
    setInterval(() => {
      const teacherTalk = 30 + Math.random() * 40;
      setTttRatio({
        teacher: Math.round(teacherTalk),
        student: Math.round(100 - teacherTalk)
      });
    }, 4000);
    
    // Update suggestions
    setInterval(() => {
      const suggestions = [
        ["Ask about their hobbies", "Practice past tense", "Review idioms"],
        ["Discuss current events", "Work on pronunciation", "Practice conditionals"],
        ["Role-play scenarios", "Review phrasal verbs", "Practice listening skills"]
      ];
      setAiSuggestions(suggestions[Math.floor(Math.random() * suggestions.length)]);
    }, 10000);
  };
  
  // Screen sharing with proper implementation
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        screenStreamRef.current = screenStream;
        
        // Create screen share peer connection
        const screenPc = new RTCPeerConnection({
          iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
        });
        
        screenStream.getTracks().forEach(track => {
          screenPc.addTrack(track, screenStream);
        });
        
        screenPcRef.current = screenPc;
        
        // Show screen share locally
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screenStream;
        }
        
        // Notify others
        socketRef.current?.emit("screen-share-started", { roomId, userId });
        
        setIsScreenSharing(true);
        
        // Handle screen share ending
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };
      } catch (error) {
        console.error("Failed to share screen:", error);
      }
    } else {
      stopScreenShare();
    }
  };
  
  const stopScreenShare = () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
      screenStreamRef.current = null;
    }
    if (screenPcRef.current) {
      screenPcRef.current.close();
      screenPcRef.current = null;
    }
    socketRef.current?.emit("screen-share-stopped", { roomId, userId });
    setIsScreenSharing(false);
  };
  
  // Toggle controls
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };
  
  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };
  
  const toggleRecording = () => {
    setIsRecording(!isRecording);
    socketRef.current?.emit("toggle-recording", { roomId, recording: !isRecording });
  };
  
  // Utility functions
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };
  
  const playCallStartSound = () => {
    const audio = new Audio('/sounds/call-start.mp3');
    audio.play().catch(() => {});
  };
  
  const showWarning = (message: string) => {
    // Show warning notification - could use toast
    console.log("Warning:", message);
  };
  
  const handleEndCall = (reason?: string) => {
    stopCallTimer();
    cleanupCall();
    
    // Save call history
    if (socketRef.current) {
      socketRef.current.emit("end-call", {
        roomId,
        duration: callDuration,
        reason: reason || "User ended call"
      });
    }
    
    onCallEnd();
  };
  
  const cleanupCall = () => {
    // Clear speech monitoring interval
    if (speechMonitorIntervalRef.current) {
      clearInterval(speechMonitorIntervalRef.current);
      speechMonitorIntervalRef.current = null;
    }
    
    // Stop media tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connections
    if (pcRef.current) {
      pcRef.current.close();
    }
    if (screenPcRef.current) {
      screenPcRef.current.close();
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
    
    // Close AudioContext safely
    if (audioContextRef.current && audioContextRef.current.state !== 'closed') {
      try {
        audioContextRef.current.close().catch((err) => {
          console.warn('AudioContext close error (safe to ignore):', err);
        });
      } catch (err) {
        console.warn('AudioContext already closed (safe to ignore):', err);
      }
    }
  };
  
  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      {/* AI Overlay - ALWAYS VISIBLE */}
      {showAIOverlay && (
        <AIOverlay
          roomId={roomId}
          role={role}
          isVisible={true}
          onClose={() => setShowAIOverlay(false)}
        />
      )}
      
      {/* Main Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {/* Header with all indicators */}
        <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Roadmap Title - ALWAYS VISIBLE */}
              <div className="flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-purple-400" />
                <div>
                  <h2 className="text-white font-semibold">
                    {roadmapTitle || "General Conversation"}
                  </h2>
                  {sessionStep && (
                    <p className="text-xs text-white/70">{sessionStep}</p>
                  )}
                </div>
              </div>
              
              {/* Connection Status */}
              <Badge 
                variant={connectionStatus === "connected" ? "default" : "secondary"}
                className={cn(
                  "flex items-center gap-1",
                  connectionStatus === "connected" && "bg-green-500/20 text-green-400 border-green-500/30"
                )}
              >
                {connectionStatus === "connected" ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    Connected
                  </>
                ) : connectionStatus === "connecting" ? (
                  <>
                    <Circle className="w-3 h-3 animate-pulse" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    Disconnected
                  </>
                )}
              </Badge>
              
              {/* Call Duration */}
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{formatDuration(callDuration)}</span>
              </div>
              
              {/* Minutes Remaining */}
              <div className="flex items-center gap-2">
                <div className="flex flex-col">
                  <span className="text-xs text-white/70">Package Minutes</span>
                  <div className="flex items-center gap-2">
                    <Progress 
                      value={(minutesUsed / packageMinutesRemaining) * 100} 
                      className="w-24 h-2"
                    />
                    <span className="text-sm text-white font-semibold">
                      {Math.max(0, packageMinutesRemaining - minutesUsed)} min
                    </span>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Status Indicators - ALWAYS VISIBLE */}
            <div className="flex items-center gap-3">
              {/* AI Listening Indicator */}
              {isAIListening && (
                <motion.div
                  animate={{ scale: [1, 1.1, 1] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                  className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30"
                >
                  <Brain className="w-4 h-4 text-purple-400" />
                  <span className="text-xs text-purple-300">AI Active</span>
                  <Sparkles className="w-3 h-3 text-purple-300 animate-pulse" />
                </motion.div>
              )}
              
              {/* Recording Indicator */}
              {isRecording && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border border-red-500/30"
                >
                  <Circle className="w-3 h-3 text-red-400 fill-red-400" />
                  <span className="text-xs text-red-300">Recording</span>
                </motion.div>
              )}
              
              {/* Live Scores Display */}
              <div className="flex items-center gap-4 px-4 py-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/60">Student</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <p className="text-lg font-bold text-white">{liveScore.student}</p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-xs text-white/60">Teacher</p>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <p className="text-lg font-bold text-white">{liveScore.teacher}</p>
                  </div>
                </div>
              </div>
              
              {/* TTT Ratio Display */}
              <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/10">
                <p className="text-xs text-white/60 mb-1">Talk Time</p>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-blue-300">T: {tttRatio.teacher}%</div>
                  <div className="text-xs text-green-300">S: {tttRatio.student}%</div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Video Grid with Screen Share Support */}
        <div className="flex-1 p-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Remote Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur">
              {!remoteScreenSharing ? (
                <>
                  <video
                    ref={remoteVideoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded-full">
                    <p className="text-white text-sm flex items-center gap-2">
                      <User className="w-4 h-4" />
                      {role === "student" ? teacherName || "Teacher" : studentName || "Student"}
                    </p>
                  </div>
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-black">
                  <div className="text-white text-center">
                    <Monitor className="w-12 h-12 mx-auto mb-2" />
                    <p>Screen Share Active</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Local Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur">
              {!isScreenSharing ? (
                <>
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-black/50 rounded-full">
                    <p className="text-white text-sm">You</p>
                  </div>
                </>
              ) : (
                <>
                  <video
                    ref={screenShareVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-contain bg-black"
                  />
                  <div className="absolute top-4 left-4 px-3 py-1 bg-green-500/50 rounded-full">
                    <p className="text-white text-sm flex items-center gap-2">
                      <Monitor className="w-4 h-4" />
                      Sharing Screen
                    </p>
                  </div>
                </>
              )}
              
              {/* Engagement Meter */}
              <div className="absolute bottom-4 left-4 right-4">
                <div className="bg-black/50 backdrop-blur rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-white/60">Engagement Level</span>
                    <span className="text-xs text-white font-semibold">{engagementLevel}%</span>
                  </div>
                  <Progress 
                    value={engagementLevel} 
                    className="h-2"
                    style={{
                      background: `linear-gradient(to right, 
                        ${engagementLevel > 70 ? '#10b981' : engagementLevel > 40 ? '#f59e0b' : '#ef4444'} 0%, 
                        transparent 100%)`
                    }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* AI Suggestions Bar */}
        <div className="bg-black/20 backdrop-blur border-t border-white/10 px-4 py-2">
          <div className="flex items-center gap-3">
            <Brain className="w-4 h-4 text-purple-400" />
            <div className="flex gap-2 overflow-x-auto">
              {aiSuggestions.map((suggestion, i) => (
                <Badge 
                  key={i} 
                  variant="secondary" 
                  className="bg-purple-500/20 text-purple-300 border-purple-500/30 whitespace-nowrap"
                >
                  {suggestion}
                </Badge>
              ))}
            </div>
          </div>
        </div>
        
        {/* Control Bar */}
        <div className="bg-black/30 backdrop-blur-lg border-t border-white/10 p-4">
          <div className="max-w-4xl mx-auto flex items-center justify-center gap-4">
            {/* Audio Control */}
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            
            {/* Video Control */}
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            {/* Screen Share - FULLY FUNCTIONAL */}
            <Button
              onClick={toggleScreenShare}
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>
            
            {/* AI Toggle */}
            <Button
              onClick={() => setShowAIOverlay(!showAIOverlay)}
              variant={showAIOverlay ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <Brain className="w-6 h-6" />
            </Button>
            
            {/* Recording Toggle */}
            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <Circle className={cn("w-6 h-6", isRecording && "fill-current animate-pulse")} />
            </Button>
            
            {/* End Call */}
            <Button
              onClick={() => handleEndCall()}
              variant="destructive"
              size="lg"
              className="rounded-full h-14 w-20 ml-8"
            >
              <PhoneOff className="w-6 h-6 mr-2" />
              End
            </Button>
          </div>
        </div>
      </div>
      
      {/* Teacher Briefing Modal (shown at start for teachers) */}
      {role === "teacher" && showTeacherBriefing && briefing && (
        <div className="absolute inset-0 bg-black/80 backdrop-blur flex items-center justify-center z-50">
          <Card className="max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <CardContent className="p-6">
              <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
                <User className="w-6 h-6" />
                Student Briefing
              </h2>
              
              <div className="space-y-4">
                <div>
                  <h3 className="font-semibold mb-2">Student Profile</h3>
                  <div className="bg-gray-50 rounded-lg p-3">
                    <p><strong>Name:</strong> {briefing.studentName}</p>
                    <p><strong>Level:</strong> {briefing.level}</p>
                    <p><strong>Goals:</strong> {briefing.goals}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Current Session</h3>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p><strong>Roadmap:</strong> {briefing.roadmapTitle}</p>
                    <p><strong>Progress:</strong> {briefing.progress}%</p>
                    <p><strong>Current Step:</strong> {briefing.currentStep}</p>
                  </div>
                </div>
                
                <div>
                  <h3 className="font-semibold mb-2">Teaching Tips</h3>
                  <ul className="space-y-2">
                    {briefing.tips?.map((tip: string, i: number) => (
                      <li key={i} className="flex items-start gap-2">
                        <AlertCircle className="w-4 h-4 text-blue-500 mt-0.5" />
                        <span className="text-sm text-gray-600">{tip}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
              
              <Button 
                onClick={() => {
                  setShowTeacherBriefing(false);
                  setIsCallReady(true); // Now ready to initialize WebRTC
                  console.log('Teacher ready, starting WebRTC initialization...');
                }}
                className="w-full mt-6"
              >
                Start Session
              </Button>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

export default VideoCall;