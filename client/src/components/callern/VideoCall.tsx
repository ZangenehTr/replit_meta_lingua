import React, { useEffect, useRef, useState, useCallback } from "react";
import SafePeer from "@/lib/safe-peer";
import { useSocket } from "@/hooks/use-socket";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Mic,
  MicOff,
  Video,
  VideoOff,
  PhoneOff,
  Monitor,
  MonitorOff,
  MessageSquare,
  Maximize2,
  Minimize2,
  User,
  Target,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle,
  Circle,
  Square,
  Sparkles,
} from "lucide-react";
import { getSimplePeerConfig } from "../../../../shared/webrtc-config";
import { useTranslation } from "react-i18next";
import { cn } from "@/lib/utils";
import { useQuery } from "@tanstack/react-query";
import { ScoringOverlay } from "./ScoringOverlay";
import { VideoCallLayout } from "./VideoCallLayout";
import { AIHelper } from "./AIHelper";

interface VideoCallProps {
  roomId: string;
  userId: number;
  role: "student" | "teacher";
  studentId?: number;
  remoteSocketId?: string;
  onCallEnd: () => void;
  onMinutesUpdate?: (minutes: number) => void;
}

interface StudentBriefing {
  profile: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
    avatar?: string;
    targetLanguage?: string;
    currentLevel?: string;
    learningGoals?: string;
    preferredLearningStyle?: string;
  };
  currentPackage?: {
    id: number;
    packageName: string;
    packageType?: string;
    totalHours: number;
    usedMinutes: number;
    remainingMinutes: number;
    roadmapId?: number;
    roadmapName?: string;
  };
  roadmapProgress: Array<{
    id: number;
    stepNumber: number;
    stepTitle: string;
    status: string;
    teacherName?: string;
  }>;
  pastLessons: Array<{
    id: number;
    teacherName: string;
    startTime: string;
    durationMinutes: number;
    notes?: string;
    aiSummary?: any;
  }>;
  assignedTasks: Array<{
    id: number;
    title: string;
    description: string;
    dueDate: string;
    status: string;
    teacherName: string;
  }>;
  recentPerformance: {
    totalMinutesLast30Days: number;
    sessionsLast30Days: number;
    averageSessionLength: number;
  };
}

export function VideoCall({
  roomId,
  userId,
  role,
  studentId,
  remoteSocketId: propsRemoteSocketId,
  onCallEnd,
  onMinutesUpdate,
}: VideoCallProps) {
  const { t } = useTranslation(["callern"]);
  const { socket } = useSocket();

  // Room join bookkeeping (students may already be joined by parent)
  const [hasJoinedRoom, setHasJoinedRoom] = useState(role === "student");

  // Media / peer refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SafePeer | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);

  // Outgoing/incoming ICE queues
  const outgoingQueueRef = useRef<any[]>([]); // signals to send when target socket id becomes known
  const pendingIncomingCandidatesRef = useRef<any[]>([]); // ICE from remote before remoteDescription is set

  // State
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(
    propsRemoteSocketId || null,
  );
  const [showChat, setShowChat] = useState(false);
  const [showAIHelper, setShowAIHelper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(role === "teacher");

  // Scoring
  const [showScoring, setShowScoring] = useState(true);
  const [scoringData, setScoringData] = useState({
    student: {
      speakingFluency: 0,
      pronunciation: 0,
      vocabulary: 0,
      grammar: 0,
      interaction: 0,
      targetLangUse: 0,
      presence: 0,
      total: 0,
      stars: 0,
    },
    teacher: {
      facilitator: 0,
      monitor: 0,
      feedbackProvider: 0,
      resourceModel: 0,
      assessor: 0,
      engagement: 0,
      targetLangUse: 0,
      presence: 0,
      total: 0,
      stars: 0,
    },
  });
  const [tlWarning, setTlWarning] = useState<string | undefined>();
  const [presenceData, setPresenceData] = useState({
    cameraOn: !isVideoOff,
    micOn: !isMuted,
  });

  // Student briefing
  const { data: briefing, isLoading: briefingLoading } =
    useQuery<StudentBriefing>({
      queryKey: ["/api/callern/student-briefing", studentId],
      enabled: role === "teacher" && !!studentId,
      queryFn: async () => {
        const res = await fetch(
          `/api/callern/student-briefing?studentId=${studentId}`,
        );
        if (!res.ok) throw new Error("Failed to fetch student briefing");
        return res.json() as Promise<StudentBriefing>;
      },
    });

  // Call duration & minute callback
  useEffect(() => {
    if (!isConnected) return;
    const timer = setInterval(() => {
      setCallDuration((prev) => {
        const next = prev + 1;
        if (onMinutesUpdate && next % 60 === 0)
          onMinutesUpdate(Math.floor(next / 60));
        return next;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [isConnected, onMinutesUpdate]);

  // Initialize local media once
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true,
      });
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
        // helps autoplay policies
        // eslint-disable-next-line @typescript-eslint/no-floating-promises
        localVideoRef.current.play().catch(() => {});
      }
      // reflect track state
      const audioTrack = stream.getAudioTracks()[0];
      const videoTrack = stream.getVideoTracks()[0];
      setIsMuted(audioTrack ? !audioTrack.enabled : false);
      setIsVideoOff(videoTrack ? !videoTrack.enabled : false);
      setPresenceData({
        cameraOn: videoTrack?.enabled ?? true,
        micOn: audioTrack?.enabled ?? true,
      });
      return stream;
    } catch (err) {
      console.error("getUserMedia error:", err);
      alert(t("callern:errors.mediaAccess"));
      return null;
    }
  }, [t]);

  const ensureLocalStream = useCallback(async () => {
    if (localStreamRef.current) return localStreamRef.current;
    return await initializeMedia();
  }, [initializeMedia]);

  // Create peer
  const createPeer = useCallback(
    async (initiator: boolean, stream: MediaStream, targetSocketId: string) => {
      const peerConfig = await getSimplePeerConfig(initiator);
      const peer = new SafePeer({
        ...peerConfig,
        stream,
        trickle: true,
      });

      // Manage target socket id; flush any queued outgoing signals once known
      let peerTargetSocketId = targetSocketId || remoteSocketId || null;
      (peer as any).updateTargetSocketId = (nextId: string) => {
        peerTargetSocketId = nextId;
        setRemoteSocketId(nextId);
        // Flush queued signals (offer/answer/candidates)
        if (outgoingQueueRef.current.length) {
          const queued = [...outgoingQueueRef.current];
          outgoingQueueRef.current = [];
          queued.forEach((sig) => {
            socket?.emit(sig.event, {
              roomId,
              [sig.payloadKey]: sig.payload,
              to: nextId,
            });
          });
        }
      };

      peer.on("signal", (signal: any) => {
        const targetId = peerTargetSocketId;
        // Offers/answers
        if (signal?.type === "offer") {
          if (!targetId) {
            outgoingQueueRef.current.push({
              event: "offer",
              payloadKey: "offer",
              payload: signal,
            });
            return;
          }
          socket?.emit("offer", { roomId, offer: signal, to: targetId });
        } else if (signal?.type === "answer") {
          if (!targetId) {
            outgoingQueueRef.current.push({
              event: "answer",
              payloadKey: "answer",
              payload: signal,
            });
            return;
          }
          socket?.emit("answer", { roomId, answer: signal, to: targetId });
        }
        // ICE candidates
        else if (signal?.candidate) {
          const candidateData = {
            candidate: signal.candidate,
            sdpMLineIndex: signal.sdpMLineIndex ?? 0,
            sdpMid: signal.sdpMid ?? "0",
            type: "candidate" as const,
          };
          if (!targetId) {
            outgoingQueueRef.current.push({
              event: "ice-candidate",
              payloadKey: "candidate",
              payload: candidateData,
            });
            return;
          }
          socket?.emit("ice-candidate", {
            roomId,
            candidate: candidateData,
            to: targetId,
          });
        }
      });

      peer.on("stream", (remoteStream: MediaStream) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = remoteStream;
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          remoteVideoRef.current.play().catch(() => {});
        }
        setIsConnected(true);
        setIsConnecting(false);
      });

      peer.on("connect", () => {
        setIsConnected(true);
        setIsConnecting(false);
      });

      peer.on("error", (err: any) => {
        console.error("Peer error:", err);
        setIsConnecting(false);
      });

      peer.on("close", () => {
        handleCallEnd();
      });

      return peer;
    },
    [roomId, socket, remoteVideoRef, remoteSocketId],
  );

  // Handle unhandled WebRTC promise rejections quietly
  useEffect(() => {
    const handler = (event: PromiseRejectionEvent) => {
      const msg = event?.reason?.message as string | undefined;
      if (
        msg &&
        (msg.includes("addIceCandidate") ||
          msg.includes("setRemoteDescription") ||
          msg.includes("RTCPeerConnection"))
      ) {
        event.preventDefault();
        console.warn("Handled WebRTC rejection:", msg);
      }
    };
    window.addEventListener("unhandledrejection", handler);
    return () => window.removeEventListener("unhandledrejection", handler);
  }, []);

  // Socket wiring
  useEffect(() => {
    if (!socket) return;

    const handleUserJoined = async ({
      userId: joinedUserId,
      socketId,
      role: joinedRole,
    }: any) => {
      if (joinedUserId === userId) return;
      setRemoteSocketId(socketId);

      const myRole = role.toLowerCase();
      const otherRole = (joinedRole || "").toLowerCase();

      if (myRole === "teacher" && otherRole === "student") {
        // Teacher waits for offer; just ensure media ready
        await ensureLocalStream();
      } else if (myRole === "student" && otherRole === "teacher") {
        // Student initiates
        if (!socketId) return;
        const stream = await ensureLocalStream();
        if (stream && !peerRef.current) {
          peerRef.current = await createPeer(true, stream, socketId);
        }
      }
    };

    const handleOffer = async ({ offer, from }: any) => {
      setRemoteSocketId(from);
      if (peerRef.current && !(peerRef.current as any).destroyed) {
        // If needed, support renegotiation here. For now, ignore dup offers when stable.
        const pc = (peerRef.current as any)._pc;
        if (pc?.signalingState === "stable") {
          console.log("Ignoring duplicate offer in stable state");
        }
        return;
      }
      const stream = await ensureLocalStream();
      if (!stream) return;

      const peer = await createPeer(false, stream, from);
      peerRef.current = peer;

      try {
        peer.signal(offer);
        // After remote desc set, try to drain queued incoming candidates
        setTimeout(() => processPendingIncomingCandidates(), 100);
      } catch (err) {
        console.error("Error signaling offer:", err);
        peerRef.current?.destroy();
        peerRef.current = null;
      }
    };

    const handleAnswer = ({ answer, from }: any) => {
      if (!peerRef.current || (peerRef.current as any).destroyed) return;
      if (from && (peerRef.current as any).updateTargetSocketId) {
        (peerRef.current as any).updateTargetSocketId(from);
      }
      try {
        const pc = (peerRef.current as any)._pc;
        if (!pc) return;
        if (pc.signalingState === "have-local-offer") {
          peerRef.current.signal(answer);
          setTimeout(() => processPendingIncomingCandidates(), 100);
        } else if (pc.signalingState === "stable") {
          console.log("Answer received in stable state; ignoring (duplicate).");
        } else {
          console.log("Unexpected state on answer:", pc.signalingState);
        }
      } catch (err) {
        console.error("Error handling answer:", err);
      }
    };

    const handleIceCandidate = ({ candidate }: any) => {
      if (!candidate) return;

      // If no peer or remoteDescription not set yet, queue
      const pc = (peerRef.current as any)?.["_pc"];
      const hasRemoteDesc = !!pc?.remoteDescription;
      const state = pc?.signalingState;

      if (
        !peerRef.current ||
        !pc ||
        !hasRemoteDesc ||
        (state !== "stable" && state !== "have-remote-offer")
      ) {
        pendingIncomingCandidatesRef.current.push(candidate);
        return;
      }

      try {
        const formatted = {
          candidate: candidate.candidate || candidate,
          sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
          sdpMid: candidate.sdpMid ?? "0",
          type: "candidate" as const,
        };
        if (
          typeof formatted.candidate === "string" &&
          formatted.candidate.length > 0
        ) {
          peerRef.current.signal(formatted);
        }
      } catch (err) {
        console.error("Error adding ICE candidate; queuing again:", err);
        pendingIncomingCandidatesRef.current.push(candidate);
      }
    };

    const processPendingIncomingCandidates = () => {
      const pc = (peerRef.current as any)?.["_pc"];
      if (!peerRef.current || !pc) return;

      const hasRemoteDesc = !!pc.remoteDescription;
      const state = pc.signalingState;
      if (
        !hasRemoteDesc ||
        (state !== "stable" && state !== "have-remote-offer")
      )
        return;

      if (!pendingIncomingCandidatesRef.current.length) return;

      const batch = [...pendingIncomingCandidatesRef.current];
      pendingIncomingCandidatesRef.current = [];
      for (const c of batch) {
        try {
          const formatted = {
            candidate: c.candidate || c,
            sdpMLineIndex: c.sdpMLineIndex ?? 0,
            sdpMid: c.sdpMid ?? "0",
            type: "candidate" as const,
          };
          if (
            typeof formatted.candidate === "string" &&
            formatted.candidate.length > 0
          ) {
            const curState = (peerRef.current as any)?._pc?.signalingState;
            if (curState === "stable" || curState === "have-remote-offer") {
              peerRef.current?.signal(formatted);
            } else {
              pendingIncomingCandidatesRef.current.push(c);
            }
          }
        } catch (err) {
          console.error("Error draining candidate:", err);
          pendingIncomingCandidatesRef.current.push(c);
        }
      }
      if (pendingIncomingCandidatesRef.current.length) {
        setTimeout(processPendingIncomingCandidates, 400);
      }
    };

    const handlePeerVideoToggle = ({ enabled }: any) => {
      console.log("Peer video toggled:", enabled);
    };
    const handlePeerAudioToggle = ({ enabled }: any) => {
      console.log("Peer audio toggled:", enabled);
    };

    const handleScoringUpdate = (data: any) => {
      if (data.role === "student" && data.scores) {
        setScoringData((prev) => ({ ...prev, student: data.scores }));
      } else if (data.role === "teacher" && data.scores) {
        setScoringData((prev) => ({ ...prev, teacher: data.scores }));
      }
    };

    const handleTLWarning = (data: any) => {
      setTlWarning(data.message);
      setTimeout(() => setTlWarning(undefined), 3000);
    };

    // Register
    socket.on("user-joined", handleUserJoined);
    socket.on("offer", handleOffer);
    socket.on("answer", handleAnswer);
    socket.on("ice-candidate", handleIceCandidate);
    socket.on("peer-video-toggle", handlePeerVideoToggle);
    socket.on("peer-audio-toggle", handlePeerAudioToggle);
    socket.on("scoring:update", handleScoringUpdate);
    socket.on("scoring:tl-warning", handleTLWarning);

    // Ensure we are in the room exactly once
    if (!hasJoinedRoom) {
      socket.emit("join-room", { roomId, userId, role });
      setHasJoinedRoom(true);
    }

    return () => {
      socket.off("user-joined", handleUserJoined);
      socket.off("offer", handleOffer);
      socket.off("answer", handleAnswer);
      socket.off("ice-candidate", handleIceCandidate);
      socket.off("peer-video-toggle", handlePeerVideoToggle);
      socket.off("peer-audio-toggle", handlePeerAudioToggle);
      socket.off("scoring:update", handleScoringUpdate);
      socket.off("scoring:tl-warning", handleTLWarning);
    };
  }, [
    socket,
    roomId,
    userId,
    role,
    hasJoinedRoom,
    ensureLocalStream,
    createPeer,
  ]);

  // Initialize media on mount
  useEffect(() => {
    (async () => {
      await ensureLocalStream();
    })();
    return () => {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.destroy();
    };
  }, [ensureLocalStream]);

  // Student autostart if we already know teacher's socket
  useEffect(() => {
    if (
      role !== "student" ||
      !propsRemoteSocketId ||
      peerRef.current ||
      !socket
    )
      return;
    setRemoteSocketId(propsRemoteSocketId);
    const timer = setTimeout(async () => {
      if (!peerRef.current) {
        const stream = await ensureLocalStream();
        if (stream) {
          peerRef.current = await createPeer(true, stream, propsRemoteSocketId);
        }
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [role, propsRemoteSocketId, socket, ensureLocalStream, createPeer]);

  // Controls
  const toggleMute = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsMuted(!track.enabled);
    setPresenceData((p) => ({ ...p, micOn: track.enabled }));
    socket?.emit("toggle-audio", { roomId, enabled: track.enabled });
    socket?.emit("scoring:presence", {
      roomId,
      userId,
      cameraOn: !isVideoOff,
      micOn: track.enabled,
    });
  };

  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoOff(!track.enabled);
    setPresenceData((p) => ({ ...p, cameraOn: track.enabled }));
    if (localVideoRef.current && localStreamRef.current) {
      localVideoRef.current.srcObject = localStreamRef.current;
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      localVideoRef.current.play().catch(() => {});
    }
    socket?.emit("toggle-video", { roomId, enabled: track.enabled });
    socket?.emit("scoring:presence", {
      roomId,
      userId,
      cameraOn: track.enabled,
      micOn: !isMuted,
    });
  };

  const toggleScreenShare = async () => {
    if (!peerRef.current) return;
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false,
        });
        const screenTrack = screenStream.getVideoTracks()[0];
        const camTrack = localStreamRef.current?.getVideoTracks()[0];
        if (!screenTrack || !camTrack) return;

        // Replace camera with screen in sender
        (peerRef.current as any).replaceTrack?.(
          camTrack,
          screenTrack,
          localStreamRef.current,
        );

        screenTrack.onended = () => {
          (peerRef.current as any).replaceTrack?.(
            screenTrack,
            camTrack,
            localStreamRef.current,
          );
          setIsScreenSharing(false);
          socket?.emit("share-screen", { roomId, enabled: false });
        };

        setIsScreenSharing(true);
        socket?.emit("share-screen", { roomId, enabled: true });
      } catch (err) {
        console.error("Screen share error:", err);
      }
    } else {
      // Try to restore camera track explicitly
      const camTrack = localStreamRef.current?.getVideoTracks()[0];
      const senders: RTCRtpSender[] =
        (peerRef.current as any)?._pc?.getSenders() || [];
      const videoSender = senders.find((s) => s.track?.kind === "video");
      if (videoSender && camTrack) {
        await videoSender.replaceTrack(camTrack);
      }
      setIsScreenSharing(false);
      socket?.emit("share-screen", { roomId, enabled: false });
    }
  };

  const handleCallEnd = () => {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      peerRef.current?.destroy();
      socket?.emit("leave-room", { roomId });
    } finally {
      onCallEnd();
    }
  };

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;
    return h > 0
      ? `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`
      : `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  };

  const toggleFullscreen = () => {
    // Fullscreen only the main call container (better UX)
    const el =
      (document.querySelector(".call-root") as HTMLElement) ||
      document.documentElement;
    if (!document.fullscreenElement) {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      el.requestFullscreen?.();
      setIsFullscreen(true);
    } else {
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      document.exitFullscreen?.();
      setIsFullscreen(false);
    }
  };

  const toggleRecording = async () => {
    try {
      const { webRTCService } = await import("../../services/webrtc-service");
      if (!isRecording) {
        await webRTCService.startRecording();
        setIsRecording(true);
      } else {
        await webRTCService.downloadRecording();
        setIsRecording(false);
      }
    } catch (err) {
      console.error("Recording error:", err);
    }
  };

  return (
    <div className="call-root flex h-screen bg-gray-900">
      {/* Teacher briefing panel */}
      {role === "teacher" && showBriefing && (
        <div className="w-96 bg-white border-r overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t("callern:studentBriefing")}</h3>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowBriefing(false)}
            >
              ✕
            </Button>
          </div>

          {briefingLoading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
            </div>
          ) : briefing ? (
            <ScrollArea className="flex-1">
              <div className="p-4 space-y-6">
                {/* Profile */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t("callern:studentProfile")}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="font-medium">
                      {briefing.profile?.firstName} {briefing.profile?.lastName}
                    </p>
                    <p className="text-sm text-gray-600">
                      {briefing.profile?.email}
                    </p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">
                        {briefing.profile?.currentLevel || "A1"}
                      </Badge>
                      <Badge variant="outline">
                        {briefing.profile?.targetLanguage || "English"}
                      </Badge>
                    </div>
                    {briefing.profile?.learningGoals && (
                      <p className="text-sm mt-2">
                        {briefing.profile.learningGoals}
                      </p>
                    )}
                  </div>
                </div>

                {/* Package */}
                {briefing.currentPackage && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {t("callern:currentPackage")}
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium">
                        {briefing.currentPackage.packageName}
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        {briefing.currentPackage.roadmapName ||
                          "No roadmap assigned"}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t("callern:timeUsed")}</span>
                          <span>
                            {Math.round(
                              briefing.currentPackage.usedMinutes / 60,
                            )}
                            h / {briefing.currentPackage.totalHours}h
                          </span>
                        </div>
                        <Progress
                          value={
                            (briefing.currentPackage.usedMinutes /
                              (briefing.currentPackage.totalHours * 60)) *
                            100
                          }
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Roadmap */}
                {briefing.roadmapProgress?.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t("callern:roadmapProgress")}
                    </h4>
                    <div className="space-y-2">
                      {briefing.roadmapProgress.slice(0, 5).map((step: any) => (
                        <div
                          key={step.id}
                          className="flex items-center gap-2 p-2 bg-gray-50 rounded"
                        >
                          {step.status === "completed" ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">
                              Step {step.stepNumber}: {step.stepTitle}
                            </p>
                            {step.teacherName && (
                              <p className="text-xs text-gray-500">
                                by {step.teacherName}
                              </p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance */}
                {briefing.recentPerformance && (
                  <div>
                    <h4 className="font-medium mb-2">
                      {t("callern:recentPerformance")}
                    </h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">
                          {t("callern:last30Days")}
                        </p>
                        <p className="text-lg font-medium">
                          {briefing.recentPerformance.sessionsLast30Days}{" "}
                          sessions
                        </p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">
                          {t("callern:avgSessionLength")}
                        </p>
                        <p className="text-lg font-medium">
                          {briefing.recentPerformance.averageSessionLength} min
                        </p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      )}

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {role === "teacher" && !showBriefing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBriefing(true)}
                className="text-white hover:bg-gray-700"
              >
                <User className="h-4 w-4 mr-2" />
                {t("callern:showBriefing")}
              </Button>
            )}
            <div className="flex items-center gap-2">
              <div
                className={cn(
                  "w-3 h-3 rounded-full",
                  isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500",
                )}
              />
              <span className="text-white text-sm">
                {isConnected ? t("callern:connected") : t("callern:connecting")}
              </span>
            </div>
            {isConnected && (
              <div className="text-white text-sm font-mono">
                {formatTime(callDuration)}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowAIHelper(!showAIHelper)}
              className="text-white hover:bg-gray-700"
            >
              <Sparkles className="h-4 w-4 mr-2" />
              {t("callern:aiAssistant")}
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowChat(!showChat)}
              className="text-white hover:bg-gray-700"
            >
              <MessageSquare className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => socket?.emit("scoring:request-update", { roomId })}
              className="text-white hover:bg-gray-700"
            >
              <Target className="h-4 w-4" />
            </Button>
            <Button
              size="sm"
              variant="ghost"
              onClick={toggleFullscreen}
              className="text-white hover:bg-gray-700"
            >
              {isFullscreen ? (
                <Minimize2 className="h-4 w-4" />
              ) : (
                <Maximize2 className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>

        {/* Video area */}
        <div className="flex-1 relative overflow-hidden bg-gray-900">
          <VideoCallLayout
            localVideoRef={localVideoRef}
            remoteVideoRef={remoteVideoRef}
            isVideoOff={isVideoOff}
            isConnected={isConnected}
            role={role}
            userName={role === "teacher" ? "Teacher" : "Student"}
            remoteName={role === "teacher" ? "Student" : "Teacher"}
          />

          {/* Connecting overlay */}
          {isConnecting && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
                <p>{t("callern:waitingForConnection")}</p>
              </div>
            </div>
          )}

          {/* AI helper side panel */}
          <AIHelper
            isOpen={showAIHelper}
            onClose={() => setShowAIHelper(false)}
            targetLanguage={role === "teacher" ? "fa" : "en"}
            studentLevel="B1"
          />

          {/* Scoring overlay (interactive) */}
          <div className="absolute inset-0" style={{ zIndex: 50 }}>
            <ScoringOverlay
              role={role}
              isVisible={showScoring}
              scores={scoringData}
              presence={presenceData}
              tlWarning={tlWarning}
              onToggleDetail={() => setShowScoring(!showScoring)}
            />
          </div>
        </div>

        {/* Controls */}
        <div className="p-4 bg-gray-800 border-t border-gray-700">
          <div className="flex items-center justify-center gap-4">
            <Button
              size="lg"
              variant={isMuted ? "destructive" : "secondary"}
              onClick={toggleMute}
              className="rounded-full w-14 h-14"
            >
              {isMuted ? (
                <MicOff className="h-6 w-6" />
              ) : (
                <Mic className="h-6 w-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant={isVideoOff ? "destructive" : "secondary"}
              onClick={toggleVideo}
              className="rounded-full w-14 h-14"
            >
              {isVideoOff ? (
                <VideoOff className="h-6 w-6" />
              ) : (
                <Video className="h-6 w-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant={isScreenSharing ? "default" : "secondary"}
              onClick={toggleScreenShare}
              className="rounded-full w-14 h-14"
              disabled={!isConnected}
            >
              {isScreenSharing ? (
                <MonitorOff className="h-6 w-6" />
              ) : (
                <Monitor className="h-6 w-6" />
              )}
            </Button>

            <Button
              size="lg"
              variant={isRecording ? "destructive" : "secondary"}
              onClick={toggleRecording}
              className="rounded-full w-14 h-14"
              disabled={!isConnected}
              title={isRecording ? "Stop Recording" : "Start Recording"}
            >
              {isRecording ? (
                <Square className="h-6 w-6" />
              ) : (
                <Circle className="h-6 w-6 text-red-500" />
              )}
            </Button>

            <Button
              size="lg"
              variant="destructive"
              onClick={handleCallEnd}
              className="rounded-full w-14 h-14"
            >
              <PhoneOff className="h-6 w-6" />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
