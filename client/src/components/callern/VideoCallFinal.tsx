// client/src/components/VideoCallFinal.tsx
import React, { useEffect, useRef, useState } from "react";
import type { Socket } from "socket.io-client";
import { useSocket } from "@/hooks/use-socket";
import {
  installWebRTCErrorHandler,
  wrapPeerConnection,
} from "@/lib/webrtc-error-handler";
import { AIOverlay } from "./AIOverlay";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import {
  PhoneOff,
  Mic,
  MicOff,
  Video,
  VideoOff,
  Monitor,
  MonitorOff,
  Brain,
  Clock,
  Circle,
  Wifi,
  WifiOff,
  BookOpen,
  AlertCircle,
  User,
  Sparkles,
  Activity,
  TrendingUp,
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Install WebRTC error handler
installWebRTCErrorHandler();

interface VideoCallProps {
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
}: VideoCallProps) {
  const { t } = useTranslation(["callern", "common"]);
  const { socket } = useSocket(); // shared socket from context

  // Single-init guard per room (prevents StrictMode double mount and accidental re-inits)
  const initializedRef = useRef<string | null>(null);

  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const screenShareVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  // SDP/ICE race guards
  const madeOfferRef = useRef(false);
  const gotAnswerRef = useRef(false);
  const isSettingRemoteRef = useRef(false);
  const remoteSocketIdRef = useRef<string | null>(null);

  // Keep a local pointer to the socket we attached handlers to
  const socketRef = useRef<Socket | null>(null);

  // Call state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [remoteScreenSharing, setRemoteScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const [callDuration, setCallDuration] = useState(0);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const callStartTimeRef = useRef<number>(Date.now());
  const callTimerRef = useRef<number | null>(null);

  // AI / UI
  const [showAIOverlay, setShowAIOverlay] = useState(true);
  const [isAIListening, setIsAIListening] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const [liveScore, setLiveScore] = useState({ student: 85, teacher: 92 });
  const [engagementLevel, setEngagementLevel] = useState(100);
  const [tttRatio, setTttRatio] = useState({ teacher: 40, student: 60 });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([
    "Try asking about their day",
    "Practice present tense verbs",
    "Review vocabulary from last session",
  ]);
  const [showTeacherBriefing, setShowTeacherBriefing] = useState(
    role === "teacher",
  );

  // Speech detection
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const speechActivityRef = useRef({ student: 0, teacher: 0 });

  // Interval refs to avoid leaks
  const aiMonitorIntervalRef = useRef<number | null>(null);
  const scoreIntervalRef = useRef<number | null>(null);
  const engagementIntervalRef = useRef<number | null>(null);
  const tttIntervalRef = useRef<number | null>(null);
  const suggestionsIntervalRef = useRef<number | null>(null);

  // Teacher briefing (mocked)
  const { data: briefing } = useQuery({
    queryKey: [`/api/callern/teacher-briefing/${roomId}`],
    enabled: role === "teacher" && showTeacherBriefing,
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
        "Focus on business vocabulary today",
      ],
    }),
  });

  // Call timer
  const startCallTimer = () => {
    callStartTimeRef.current = Date.now();
    callTimerRef.current = window.setInterval(() => {
      const elapsed = Math.floor(
        (Date.now() - callStartTimeRef.current) / 1000,
      );
      setCallDuration(elapsed);
      const currentMinutesUsed = Math.ceil(elapsed / 60);
      setMinutesUsed(currentMinutesUsed);

      const remainingMinutes = packageMinutesRemaining - currentMinutesUsed;
      if (remainingMinutes === 5)
        showWarning("⚠️ Only 5 minutes remaining in your package!");
      if (remainingMinutes === 1)
        showWarning("⚠️ 1 minute left! Call will end soon.");
      if (remainingMinutes <= 0) handleEndCall("Package minutes exhausted");
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
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      aiMonitorIntervalRef.current = window.setInterval(() => {
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
            level: average,
          });
        }
      }, 500);
    } catch (err) {
      console.error("Failed to initialize AI monitoring:", err);
    }
  };

  // Simulate AI updates (demo-only)
  const simulateAIUpdates = () => {
    scoreIntervalRef.current = window.setInterval(() => {
      setLiveScore({
        student: Math.floor(80 + Math.random() * 20),
        teacher: Math.floor(85 + Math.random() * 15),
      });
    }, 5000);

    engagementIntervalRef.current = window.setInterval(() => {
      setEngagementLevel(Math.floor(70 + Math.random() * 30));
    }, 3000);

    tttIntervalRef.current = window.setInterval(() => {
      const teacherTalk = 30 + Math.random() * 40;
      setTttRatio({
        teacher: Math.round(teacherTalk),
        student: Math.round(100 - teacherTalk),
      });
    }, 4000);

    suggestionsIntervalRef.current = window.setInterval(() => {
      const suggestions = [
        ["Ask about their hobbies", "Practice past tense", "Review idioms"],
        [
          "Discuss current events",
          "Work on pronunciation",
          "Practice conditionals",
        ],
        [
          "Role-play scenarios",
          "Review phrasal verbs",
          "Practice listening skills",
        ],
      ];
      setAiSuggestions(
        suggestions[Math.floor(Math.random() * suggestions.length)],
      );
    }, 10000);
    // NOTE: All cleared in cleanupCall()
  };

  // Main effect
  useEffect(() => {
    if (!socket) return; // wait for shared socket to be ready
    // Guard: only initialize once per room id
    if (initializedRef.current === roomId) return;
    
    // For students, wait a moment for teacher to fully join
    const initDelay = role === "student" ? 1000 : 0;
    
    const initTimer = setTimeout(() => {
      initializedRef.current = roomId;
    }, initDelay);

    let mounted = true;

    const initCall = async () => {
      try {
        console.log("🚀 [INIT] Start", { userId, role, roomId });

        // 1) Media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: "user",
          },
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        });
        if (!mounted) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          localVideoRef.current.onloadedmetadata = () =>
            console.log("[LOCAL] metadata loaded");
          localVideoRef.current.onplay = () => console.log("[LOCAL] playing");
        }

        // 2) RTCPeerConnection
        const pc = wrapPeerConnection(
          new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
              // TODO: add TURN for production
            ],
          }),
        );
        stream.getTracks().forEach((track) => pc.addTrack(track, stream));

        pc.ontrack = (e) => {
          if (remoteVideoRef.current && e.streams[0]) {
            remoteVideoRef.current.srcObject = e.streams[0];
            remoteVideoRef.current.onloadedmetadata = () =>
              console.log("[REMOTE] metadata loaded");
            remoteVideoRef.current.onplay = () =>
              console.log("[REMOTE] playing");
            setConnectionStatus("connected");
            if (!callTimerRef.current) startCallTimer();
          }
        };

        pc.onicecandidate = (event) => {
          if (event.candidate && socketRef.current) {
            socketRef.current.emit("ice-candidate", {
              roomId,
              candidate: event.candidate,
            });
          }
        };

        pc.onconnectionstatechange = () => {
          const state = pc.connectionState;
          if (state === "connected") setConnectionStatus("connected");
          else if (state === "disconnected" || state === "failed")
            setConnectionStatus("disconnected");
        };

        pcRef.current = pc;

        // 3) Shared socket setup
        socketRef.current = socket;
        socket.emit("join-room", { roomId, userId, role });

        // --- stable handlers (so we can .off them precisely) ---
        const onUserJoined = async ({
          socketId,
          userId: joinedUserId,
        }: {
          socketId: string;
          userId: number;
        }) => {
          if (role !== "student") return;
          if (joinedUserId === userId) return;
          const pc = pcRef.current;
          if (!pc) return;
          if (pc.signalingState !== "stable") return;
          if (madeOfferRef.current) return;

          try {
            madeOfferRef.current = true;
            const offer = await pc.createOffer({
              offerToReceiveAudio: true,
              offerToReceiveVideo: true,
            });
            await pc.setLocalDescription(offer);
            remoteSocketIdRef.current = socketId;
            socket.emit("offer", { roomId, offer, to: socketId });
          } catch (err) {
            madeOfferRef.current = false; // allow retry
            console.error("[OFFER] failed", err);
          }
        };

        const onOffer = async ({
          offer,
          from,
        }: {
          offer: RTCSessionDescriptionInit;
          from: string;
        }) => {
          const pc = pcRef.current;
          if (!pc) return;
          if (isSettingRemoteRef.current) return;
          if (pc.signalingState !== "stable") return;

          isSettingRemoteRef.current = true;
          try {
            await pc.setRemoteDescription(offer);
            remoteSocketIdRef.current = from ?? remoteSocketIdRef.current;
            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer, to: from });
          } catch (err) {
            console.error("[OFFER] handle error", err);
          } finally {
            isSettingRemoteRef.current = false;
          }
        };

        const onAnswer = async ({
          answer,
          from,
        }: {
          answer: RTCSessionDescriptionInit;
          from?: string;
        }) => {
          const pc = pcRef.current;
          if (!pc) return;
          if (gotAnswerRef.current) return;
          if (pc.signalingState !== "have-local-offer") return;

          try {
            await pc.setRemoteDescription(answer);
            gotAnswerRef.current = true;
            if (!remoteSocketIdRef.current && from)
              remoteSocketIdRef.current = from;
          } catch (err) {
            console.error("[ANSWER] handle error", err);
          }
        };

        const onIce = async ({
          candidate,
          from,
        }: {
          candidate: RTCIceCandidateInit;
          from?: string;
        }) => {
          const pc = pcRef.current;
          if (!pc || !candidate) return;

          // If server provides "from", ignore unrelated peers
          if (
            remoteSocketIdRef.current &&
            from &&
            from !== remoteSocketIdRef.current
          ) {
            return;
          }

          try {
            if (pc.remoteDescription) {
              await pc.addIceCandidate(candidate);
            }
          } catch (err) {
            console.error("[ICE] add error", err);
          }
        };

        const onScreenShareStart = ({
          userId: sharingUserId,
        }: {
          userId: number;
        }) => {
          if (sharingUserId !== userId) setRemoteScreenSharing(true);
        };
        const onScreenShareStop = ({
          userId: stoppingUserId,
        }: {
          userId: number;
        }) => {
          if (stoppingUserId !== userId) setRemoteScreenSharing(false);
        };

        const onAiSuggestion = (suggestions: string[]) =>
          setAiSuggestions(suggestions);
        const onLiveScore = (score: any) => setLiveScore(score);
        const onEngagement = (level: number) => setEngagementLevel(level);
        const onTtt = (ratio: any) => setTttRatio(ratio);

        socket.on("user-joined", onUserJoined);
        socket.on("offer", onOffer);
        socket.on("answer", onAnswer);
        socket.on("ice-candidate", onIce);
        socket.on("screen-share-started", onScreenShareStart);
        socket.on("screen-share-stopped", onScreenShareStop);
        socket.on("ai-suggestion", onAiSuggestion);
        socket.on("live-score-update", onLiveScore);
        socket.on("engagement-update", onEngagement);
        socket.on("ttt-update", onTtt);

        // 4) AI monitor + demo updates
        initializeAIMonitoring(stream);
        simulateAIUpdates();

        console.log("✅ [INIT] Done");
      } catch (error: any) {
        console.error("❌ [INIT] Failure:", error);
        setConnectionStatus("disconnected");
      }
    };

    initCall();

    return () => {
      mounted = false;
      clearTimeout(initTimer); // Clear the initialization timer
      initializedRef.current = null; // allow re-init after unmount
      stopCallTimer();
      cleanupCall();

      // Detach only the handlers we attached (do NOT disconnect shared socket)
      if (socketRef.current) {
        socketRef.current.off("user-joined");
        socketRef.current.off("offer");
        socketRef.current.off("answer");
        socketRef.current.off("ice-candidate");
        socketRef.current.off("screen-share-started");
        socketRef.current.off("screen-share-stopped");
        socketRef.current.off("ai-suggestion");
        socketRef.current.off("live-score-update");
        socketRef.current.off("engagement-update");
        socketRef.current.off("ttt-update");
      }
    };
  }, [roomId, userId, role, socket]); // include socket

  // Screen share via replaceTrack on the same PC
  const toggleScreenShare = async () => {
    if (!pcRef.current) return;

    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        screenStreamRef.current = screenStream;

        // Local preview of what we're sharing (optional)
        if (screenShareVideoRef.current) {
          screenShareVideoRef.current.srcObject = screenStream;
        }

        const screenTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current
          .getSenders()
          .find((s) => s.track?.kind === "video");
        if (sender) {
          await sender.replaceTrack(screenTrack);
        }

        socketRef.current?.emit("screen-share-started", { roomId, userId });
        setIsScreenSharing(true);

        screenTrack.onended = () => stopScreenShare();
      } catch (err) {
        console.error("Screen share failed:", err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = () => {
    const camTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current
      ?.getSenders()
      .find((s) => s.track?.kind === "video");
    if (sender && camTrack) {
      sender.replaceTrack(camTrack).catch(() => {});
    }

    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
    }
    socketRef.current?.emit("screen-share-stopped", { roomId, userId });
    setIsScreenSharing(false);
  };

  // Toggle controls
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
  };

  const toggleRecording = () => {
    const newState = !isRecording;
    setIsRecording(newState);
    socketRef.current?.emit("toggle-recording", {
      roomId,
      recording: newState,
    });
  };

  // Utils
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0)
      return `${hours}:${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const showWarning = (message: string) => {
    console.warn("[WARN]", message);
  };

  const handleEndCall = (reason?: string) => {
    stopCallTimer();
    cleanupCall();

    if (socketRef.current) {
      socketRef.current.emit("end-call", {
        roomId,
        duration: callDuration,
        reason: reason || "User ended call",
      });
    }

    onCallEnd();
  };

  const cleanupCall = () => {
    // Intervals
    if (aiMonitorIntervalRef.current)
      clearInterval(aiMonitorIntervalRef.current);
    if (scoreIntervalRef.current) clearInterval(scoreIntervalRef.current);
    if (engagementIntervalRef.current)
      clearInterval(engagementIntervalRef.current);
    if (tttIntervalRef.current) clearInterval(tttIntervalRef.current);
    if (suggestionsIntervalRef.current)
      clearInterval(suggestionsIntervalRef.current);

    // Audio context
    audioContextRef.current?.close();
    audioContextRef.current = null;
    analyserRef.current = null;

    // Media
    localStreamRef.current?.getTracks().forEach((t) => t.stop());
    screenStreamRef.current?.getTracks().forEach((t) => t.stop());
    localStreamRef.current = null;
    screenStreamRef.current = null;

    // PC
    try {
      pcRef.current?.close();
    } catch {}
    pcRef.current = null;

    // DO NOT disconnect the shared socket here
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-900 via-blue-900 to-indigo-900 relative">
      {/* AI Overlay */}
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
        {/* Header */}
        <div className="bg-black/30 backdrop-blur-lg border-b border-white/10 p-4">
          <div className="max-w-7xl mx-auto flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Roadmap Title */}
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
                variant={
                  connectionStatus === "connected" ? "default" : "secondary"
                }
                className={cn(
                  "flex items-center gap-1",
                  connectionStatus === "connected" &&
                    "bg-green-500/20 text-green-400 border-green-500/30",
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
                <span className="font-mono text-lg">
                  {formatDuration(callDuration)}
                </span>
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

            {/* Status Indicators */}
            <div className="flex items-center gap-3">
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

              {isRecording && (
                <motion.div
                  animate={{ opacity: [1, 0.5, 1] }}
                  transition={{ repeat: Infinity, duration: 1.5 }}
                  className="flex items-center gap-2 px-3 py-1 bg-red-500/20 rounded-full border-red-500/30"
                >
                  <Circle className="w-3 h-3 text-red-400 fill-red-400" />
                  <span className="text-xs text-red-300">Recording</span>
                </motion.div>
              )}

              {/* Live Scores */}
              <div className="flex items-center gap-4 px-4 py-2 bg-black/20 rounded-lg border border-white/10">
                <div className="text-center">
                  <p className="text-xs text-white/60">Student</p>
                  <div className="flex items-center gap-1">
                    <TrendingUp className="w-3 h-3 text-green-400" />
                    <p className="text-lg font-bold text-white">
                      {liveScore.student}
                    </p>
                  </div>
                </div>
                <div className="w-px h-8 bg-white/20" />
                <div className="text-center">
                  <p className="text-xs text-white/60">Teacher</p>
                  <div className="flex items-center gap-1">
                    <Activity className="w-3 h-3 text-blue-400" />
                    <p className="text-lg font-bold text-white">
                      {liveScore.teacher}
                    </p>
                  </div>
                </div>
              </div>

              {/* TTT Ratio */}
              <div className="px-3 py-2 bg-black/20 rounded-lg border border-white/10">
                <p className="text-xs text-white/60 mb-1">Talk Time</p>
                <div className="flex items-center gap-2">
                  <div className="text-xs text-blue-300">
                    T: {tttRatio.teacher}%
                  </div>
                  <div className="text-xs text-green-300">
                    S: {tttRatio.student}%
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Video Grid */}
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
                      {role === "student"
                        ? teacherName || "Teacher"
                        : studentName || "Student"}
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

            {/* Local Video / Screen Preview */}
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
                    <span className="text-xs text-white/60">
                      Engagement Level
                    </span>
                    <span className="text-xs text-white font-semibold">
                      {engagementLevel}%
                    </span>
                  </div>
                  <Progress value={engagementLevel} className="h-2" />
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
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isAudioEnabled ? (
                <Mic className="w-6 h-6" />
              ) : (
                <MicOff className="w-6 h-6" />
              )}
            </Button>

            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? (
                <Video className="w-6 h-6" />
              ) : (
                <VideoOff className="w-6 h-6" />
              )}
            </Button>

            <Button
              onClick={toggleScreenShare}
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isScreenSharing ? (
                <MonitorOff className="w-6 h-6" />
              ) : (
                <Monitor className="w-6 h-6" />
              )}
            </Button>

            <Button
              onClick={() => setShowAIOverlay(!showAIOverlay)}
              variant={showAIOverlay ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <Brain className="w-6 h-6" />
            </Button>

            <Button
              onClick={toggleRecording}
              variant={isRecording ? "destructive" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <Circle
                className={cn(
                  "w-6 h-6",
                  isRecording && "fill-current animate-pulse",
                )}
              />
            </Button>

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

      {/* Teacher Briefing Modal */}
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
                    <p>
                      <strong>Name:</strong> {briefing.studentName}
                    </p>
                    <p>
                      <strong>Level:</strong> {briefing.level}
                    </p>
                    <p>
                      <strong>Goals:</strong> {briefing.goals}
                    </p>
                  </div>
                </div>

                <div>
                  <h3 className="font-semibold mb-2">Current Session</h3>
                  <div className="bg-blue-50 rounded-lg p-3">
                    <p>
                      <strong>Roadmap:</strong> {briefing.roadmapTitle}
                    </p>
                    <p>
                      <strong>Progress:</strong> {briefing.progress}%
                    </p>
                    <p>
                      <strong>Current Step:</strong> {briefing.currentStep}
                    </p>
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
                onClick={() => setShowTeacherBriefing(false)}
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
