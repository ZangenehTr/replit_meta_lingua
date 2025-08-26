// client/src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import {
  installWebRTCErrorHandler,
  wrapPeerConnection,
} from "@/lib/webrtc-error-handler";
import { AIOverlay } from "./AIOverlay";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from "react-i18next";
import { useAudioStream } from "@/hooks/use-audio-stream";
import { useToast } from "@/hooks/use-toast";
import RecordRTC from "recordrtc";
import { 
  Phone, PhoneOff, Mic, MicOff, Video, VideoOff,
  Monitor, MonitorOff, Brain, Clock, Circle,
  Wifi, WifiOff, BookOpen, User,
  Sparkles, Activity, TrendingUp
} from "lucide-react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

// Install global WebRTC error handler once
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
  const { t } = useTranslation(['callern', 'common']);
  const { toast } = useToast();
  // Video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC + Socket
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // Signaling safety / state
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false);
  const madeOfferRef = useRef(false);
  const gotAnswerRef = useRef(false);
  const isSettingRemoteRef = useRef(false);
  const mountedRef = useRef(false);
  const remoteSocketIdRef = useRef<string | null>(null); // who we talk to

  // UI
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [status, setStatus] = useState("Connecting…");
  const [callSeconds, setCallSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [showAIOverlay, setShowAIOverlay] = useState(true);
  const [isRecording, setIsRecording] = useState(false);
  const recorderRef = useRef<RecordRTC | null>(null);
  const recordedBlobsRef = useRef<Blob[]>([]);
  const [liveScore, setLiveScore] = useState({ student: 0, teacher: 0 });
  const [engagementLevel, setEngagementLevel] = useState(0);
  const [tttRatio, setTttRatio] = useState({ teacher: 0, student: 0 });
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [minutesUsed, setMinutesUsed] = useState(0);
  const [attentionScore, setAttentionScore] = useState(0);
  const [supervisorReady, setSupervisorReady] = useState(false);
  const sessionId = useRef(`${roomId}-${Date.now()}`).current;
  
  // AI Audio Stream Hook
  const { startStreaming, stopStreaming } = useAudioStream(sessionId, role);
  
  // AI Monitoring
  const speechDetectionIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const lastSpeechTimeRef = useRef({ student: 0, teacher: 0 });
  const speechDurationRef = useRef({ student: 0, teacher: 0 });
  const attentionScoreRef = useRef(100);
  const lastActivityRef = useRef(Date.now());

  // Timer
  useEffect(() => {
    const t = setInterval(() => {
      setCallSeconds((s) => {
        const newSeconds = s + 1;
        const currentMinutesUsed = Math.ceil(newSeconds / 60);
        setMinutesUsed(currentMinutesUsed);
        
        // Check package minutes
        const remainingMinutes = packageMinutesRemaining - currentMinutesUsed;
        if (remainingMinutes === 5) {
          console.log("⚠️ Only 5 minutes remaining in your package!");
        } else if (remainingMinutes === 1) {
          console.log("⚠️ 1 minute left! Call will end soon.");
        } else if (remainingMinutes <= 0) {
          endCall();
        }
        
        return newSeconds;
      });
    }, 1000);
    return () => clearInterval(t);
  }, [packageMinutesRemaining]);
  
  // Real-time TTT calculation
  useEffect(() => {
    const tttInterval = setInterval(() => {
      const totalSpeech = speechDurationRef.current.student + speechDurationRef.current.teacher;
      if (totalSpeech > 0) {
        const studentPercent = Math.round((speechDurationRef.current.student / totalSpeech) * 100);
        const teacherPercent = Math.round((speechDurationRef.current.teacher / totalSpeech) * 100);
        setTttRatio({ teacher: teacherPercent, student: studentPercent });
      }
    }, 1000);
    
    return () => clearInterval(tttInterval);
  }, []);
  
  // Initialize AI monitoring
  const initializeAIMonitoring = (localStream: MediaStream, socket: Socket) => {
    try {
      // Create audio context for speech detection
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      
      const source = audioContextRef.current.createMediaStreamSource(localStream);
      source.connect(analyserRef.current);
      analyserRef.current.fftSize = 256;

      // Start monitoring speech every second
      speechDetectionIntervalRef.current = setInterval(() => {
        if (!analyserRef.current || !socket) return;

        const bufferLength = analyserRef.current.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        analyserRef.current.getByteFrequencyData(dataArray);

        // Calculate average volume
        const average = dataArray.reduce((a, b) => a + b, 0) / bufferLength;
        const isSpeaking = average > 30; // Threshold for speech detection
        const speaker = role === "student" ? "student" : "teacher";

        if (isSpeaking) {
          const now = Date.now();
          
          // Calculate speech duration
          if (now - lastSpeechTimeRef.current[speaker] < 2000) {
            speechDurationRef.current[speaker] += 1;
          } else {
            speechDurationRef.current[speaker] = 1;
          }
          
          lastSpeechTimeRef.current[speaker] = now;
          lastActivityRef.current = now;

          // Emit speech detection event
          socket.emit("speech-detected", {
            roomId,
            speaker,
            duration: speechDurationRef.current[speaker],
            volumeLevel: average
          });
          
          // Calculate performance scores based on speech activity
          const baseScore = 70;
          const volumeBonus = Math.min(20, average / 10);
          const consistencyBonus = speechDurationRef.current[speaker] > 5 ? 10 : 0;
          const score = Math.round(baseScore + volumeBonus + consistencyBonus);
          
          setLiveScore(prev => ({
            ...prev,
            [speaker]: score
          }));
        }

        // Update attention score based on activity
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity > 10000) {
          attentionScoreRef.current = Math.max(0, attentionScoreRef.current - 5);
        } else {
          attentionScoreRef.current = Math.min(100, attentionScoreRef.current + 2);
        }
        
        // Update UI with real attention score
        setAttentionScore(attentionScoreRef.current);
        setEngagementLevel(attentionScoreRef.current);

        // Emit attention update
        socket.emit("attention-update", {
          roomId,
          score: attentionScoreRef.current
        });

      }, 1000);

      // Request initial word suggestions after 5 seconds
      setTimeout(() => {
        socket.emit("request-word-help", { roomId });
      }, 5000);

      // Periodically request word suggestions
      setInterval(() => {
        if (Math.random() > 0.7) { // 30% chance every 10 seconds
          socket.emit("request-word-help", { roomId });
        }
      }, 10000);

    } catch (error) {
      console.error("Failed to initialize AI monitoring:", error);
    }
  };

  // Initialize AI Supervisor
  const initializeSupervisor = (socket: Socket) => {
    // Initialize supervisor session
    socket.emit('supervisor-init', {
      sessionId,
      studentId: role === 'student' ? userId : undefined,
      teacherId: role === 'teacher' ? userId : undefined,
      lessonTitle: roadmapTitle || 'Conversation Practice',
      objectives: ['Practice speaking', 'Improve vocabulary', 'Build confidence'],
      studentLevel: 'B1'
    });
    
    // Start audio streaming
    startStreaming().catch(console.error);
  };
  
  // Setup supervisor WebSocket handlers
  const setupSupervisorHandlers = (socket: Socket) => {
    // Supervisor ready
    socket.on('supervisor-ready', (data) => {
      console.log('AI Supervisor ready:', data);
      setSupervisorReady(true);
    });
    
    // Transcripts
    socket.on('transcript', (data) => {
      console.log('Transcript:', data.text, `(${data.speaker})`);
    });
    
    // Teacher tips
    socket.on('teacher-tip', (data) => {
      console.log('Teacher tip:', data.text);
      if (role === 'teacher') {
        setAiSuggestions(prev => [...prev, data.text].slice(-5));
      }
    });
    
    // Student tips
    socket.on('student-tip', (data) => {
      console.log('Student tip:', data.text);
      if (role === 'student') {
        setAiSuggestions(prev => [...prev, data.text].slice(-5));
      }
    });
    
    // Word suggestions
    socket.on('word-suggestions', (data) => {
      if (data.suggestions && data.suggestions.length > 0) {
        const suggestions = data.suggestions.map((s: any) => 
          `${s.word}: ${s.translation || s.usage || ''}`
        );
        setAiSuggestions(suggestions.slice(0, 5));
      }
    });
    
    // Metrics update
    socket.on('metrics-update', (data) => {
      // Update TTT ratio with real data
      setTttRatio({ 
        teacher: data.ttt || 50, 
        student: data.stt || 50 
      });
    });
    
    // Pronunciation guide
    socket.on('pronunciation-guide', (data) => {
      console.log('Pronunciation:', data);
    });
    
    // Grammar correction
    socket.on('grammar-correction', (data) => {
      console.log('Grammar:', data);
    });
  };
  
  // Handle help request
  const handleHelpRequest = () => {
    if (!socketRef.current || !supervisorReady) return;
    
    socketRef.current.emit('request-word-suggestions', {
      sessionId,
      context: 'User requested help during conversation',
      targetLanguage: 'English'
    });
  };

  useEffect(() => {
    // Prevent double init in React 18 StrictMode / Vite HMR
    if (mountedRef.current) return;
    mountedRef.current = true;

    // Hard cleanup in case of hot reload
    safeCleanup();

    (async () => {
      try {
        // 1) Get media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          localVideoRef.current.play().catch(() => {});
        }

        // 2) RTCPeerConnection
        pcRef.current = wrapPeerConnection(
          new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              // TODO: add your Metered TURN here, e.g.
              // { urls: "turn:global.turn.metered.ca:80", username: "...", credential: "..." },
            ],
          }),
        );

        // 3) Add local tracks
        stream
          .getTracks()
          .forEach((track) => pcRef.current!.addTrack(track, stream));

        // 4) Remote track
        pcRef.current.ontrack = (e) => {
          if (!e.streams || !e.streams[0]) return;
          if (remoteVideoRef.current) {
            remoteVideoRef.current.srcObject = e.streams[0];
            // eslint-disable-next-line @typescript-eslint/no-floating-promises
            remoteVideoRef.current.play().catch(() => {});
          }
          setConnected(true);
          setStatus("Connected");
          // Start automatic recording when connected
          startAutomaticRecording();
        };

        // 5) Outgoing ICE
        pcRef.current.onicecandidate = (e) => {
          if (!e.candidate) return;
          const to = remoteSocketIdRef.current || undefined;
          socketRef.current?.emit("ice-candidate", {
            roomId,
            candidate: e.candidate,
            to,
          });
        };

        // 6) State updates
        pcRef.current.onconnectionstatechange = () => {
          const st = pcRef.current?.connectionState;
          if (st) setStatus(st);
        };

        // 7) Socket.IO
        socketRef.current = io({
          path: "/socket.io", // your server uses "/socket.io"
          transports: ["websocket", "polling"],
        });

        // make sure no duplicate handlers
        socketRef.current.removeAllListeners?.();

        // 8) Join room
        socketRef.current.emit("join-room", { roomId, userId, role });
        
        // Start AI monitoring and supervisor after joining room
        if (stream && socketRef.current) {
          initializeAIMonitoring(stream, socketRef.current);
          initializeSupervisor(socketRef.current);
        }

        // Setup supervisor handlers
        setupSupervisorHandlers(socketRef.current);
        
        // --- Socket handlers ---

        // Someone else joined (student initiates exactly once)
        socketRef.current.on(
          "user-joined",
          async ({ socketId, role: joinedRole }) => {
            // remember the peer
            if (!remoteSocketIdRef.current)
              remoteSocketIdRef.current = socketId;

            if (role !== "student") return; // teacher never initiates
            if (!pcRef.current) return;
            if (madeOfferRef.current) return; // already offered
            if (pcRef.current.signalingState !== "stable") return;

            try {
              madeOfferRef.current = true;
              setStatus("Creating offer…");
              const offer = await pcRef.current.createOffer();
              await pcRef.current.setLocalDescription(offer);
              socketRef.current?.emit("offer", {
                roomId,
                offer,
                to: remoteSocketIdRef.current ?? socketId,
              });
            } catch (err) {
              madeOfferRef.current = false; // allow retry on failure
              console.error("Offer flow failed:", err);
            }
          },
        );

        // Offer received (typically teacher side)
        socketRef.current.on("offer", async ({ offer, from }) => {
          if (!pcRef.current) return;
          // pin target
          remoteSocketIdRef.current = from;

          // avoid re-entrant/duplicate processing
          if (isSettingRemoteRef.current) return;
          isSettingRemoteRef.current = true;

          try {
            setStatus("Received offer. Answering…");
            await pcRef.current.setRemoteDescription(offer);
            remoteDescSetRef.current = true;

            // Drain queued ICE
            for (const c of pendingCandidatesRef.current) {
              try {
                await pcRef.current.addIceCandidate(c);
              } catch (e) {
                console.warn("Queued ICE add failed", e);
              }
            }
            pendingCandidatesRef.current = [];

            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketRef.current?.emit("answer", { roomId, answer, to: from });
          } catch (err) {
            console.error("Error handling offer:", err);
          } finally {
            isSettingRemoteRef.current = false;
          }
        });

        // Answer received (student side)
        const processedAnswers = new Set<string>();
        socketRef.current.on("answer", async ({ answer, from }) => {
          const pc = pcRef.current;
          if (!pc) return;

          // Create unique key for this answer
          const answerKey = `${from}-${Date.now()}`;
          
          // Check if we already processed an answer from this peer
          if (gotAnswerRef.current) {
            console.log("Already have an answer, ignoring duplicate from:", from);
            return;
          }

          // Check signaling state
          if (pc.signalingState === "stable") {
            console.log("Already in stable state, ignoring late answer from:", from);
            return;
          }
          
          if (pc.signalingState !== "have-local-offer") {
            console.log(`Wrong state (${pc.signalingState}) for answer, ignoring from:`, from);
            return;
          }

          // Check if this specific answer was already processed
          if (processedAnswers.has(from)) {
            console.log("Already processing answer from this peer:", from);
            return;
          }

          // remember who we're talking to
          if (!remoteSocketIdRef.current) remoteSocketIdRef.current = from;

          try {
            // Mark as processing immediately to prevent race conditions
            processedAnswers.add(from);
            gotAnswerRef.current = true;
            
            await pc.setRemoteDescription(answer);
            remoteDescSetRef.current = true;
            setStatus("Connected");
            setConnected(true);

            // Process pending ICE candidates
            for (const c of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(c);
              } catch (e) {
                console.warn("Queued ICE add failed", e);
              }
            }
            pendingCandidatesRef.current = [];
          } catch (err) {
            // Only reset if it's not a "stable state" error
            const errorMsg = err?.toString() || "";
            if (!errorMsg.includes("stable")) {
              gotAnswerRef.current = false;
              processedAnswers.delete(from);
              console.error("Failed to set answer:", err);
            } else {
              // This is a duplicate answer after we're already stable - safe to ignore
              console.log("Duplicate answer received (already stable), ignoring");
            }
          }
        });

        // Incoming ICE
        socketRef.current.on("ice-candidate", async ({ candidate, from }) => {
          const pc = pcRef.current;
          if (!pc || !candidate) return;

          // ignore candidates from anyone except our pinned peer
          if (
            remoteSocketIdRef.current &&
            from &&
            from !== remoteSocketIdRef.current
          )
            return;
          if (!remoteSocketIdRef.current && from)
            remoteSocketIdRef.current = from;

          const cand: RTCIceCandidateInit = {
            candidate: candidate.candidate || candidate,
            sdpMid: candidate.sdpMid ?? "0",
            sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
          };

          if (!remoteDescSetRef.current || !pc.remoteDescription) {
            pendingCandidatesRef.current.push(cand);
            return;
          }
          try {
            await pc.addIceCandidate(cand);
          } catch (err) {
            // timing race: keep it for later retry
            pendingCandidatesRef.current.push(cand);
          }
        });

        // AI event handlers for real data from server
        socketRef.current.on("ai-suggestion", (suggestions: string[]) => {
          if (suggestions && suggestions.length > 0) {
            setAiSuggestions(suggestions);
          }
        });
        
        socketRef.current.on("live-score-update", (score: any) => {
          if (score) {
            setLiveScore(score);
          }
        });
        
        socketRef.current.on("engagement-update", (level: number) => {
          if (typeof level === 'number') {
            setEngagementLevel(level);
          }
        });
        
        socketRef.current.on("ttt-update", (ratio: any) => {
          if (ratio) {
            setTttRatio(ratio);
          }
        });

        socketRef.current.on("call-ended", ({ reason }) => {
          console.log("Call ended by peer:", reason);
          endCall();
        });

        socketRef.current.on("user-left", ({ socketId }) => {
          if (remoteSocketIdRef.current === socketId) {
            endCall();
          }
        });

        setStatus("Waiting for peer…");
      } catch (err) {
        console.error("Init error:", err);
        setStatus("Could not access camera/mic");
      }
    })();

    return () => {
      safeCleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, role]);

  // Controls
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
    const to = remoteSocketIdRef.current || undefined;
    socketRef.current?.emit("toggle-video", {
      roomId,
      enabled: track.enabled,
      to,
    });
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
    const to = remoteSocketIdRef.current || undefined;
    socketRef.current?.emit("toggle-audio", {
      roomId,
      enabled: track.enabled,
      to,
    });
  };
  
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        const sender = pcRef.current?.getSenders().find(
          s => s.track?.kind === 'video'
        );
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
        
        setIsScreenSharing(true);
        
        videoTrack.onended = () => {
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
    const videoTrack = localStreamRef.current?.getVideoTracks()[0];
    const sender = pcRef.current?.getSenders().find(
      s => s.track?.kind === 'video'
    );
    
    if (sender && videoTrack) {
      sender.replaceTrack(videoTrack);
    }
    
    setIsScreenSharing(false);
  };
  
  // Start automatic recording when call connects
  const startAutomaticRecording = () => {
    if (!localStreamRef.current || recorderRef.current) return;
    
    const recorder = new RecordRTC(localStreamRef.current, {
      type: 'video',
      mimeType: 'video/webm',
      bitsPerSecond: 256000, // Low bitrate for smaller files
      frameInterval: 20 // Lower frame rate for smaller files
    });
    
    recorder.startRecording();
    recorderRef.current = recorder;
    setIsRecording(true);
    console.log('Recording started automatically');
  };
  
  // Stop recording and save to server
  const stopAndSaveRecording = async () => {
    if (!recorderRef.current) return;
    
    return new Promise<void>((resolve) => {
      recorderRef.current!.stopRecording(async () => {
        const blob = recorderRef.current!.getBlob();
        
        // Create FormData to upload
        const formData = new FormData();
        formData.append('recording', blob, `call-${roomId}-${Date.now()}.webm`);
        formData.append('roomId', roomId);
        formData.append('duration', String(callSeconds));
        formData.append('studentId', String(userId));
        formData.append('teacherId', String(role === 'student' ? '1' : userId));
        
        try {
          // Upload recording to server
          const response = await fetch('/api/callern/upload-recording', {
            method: 'POST',
            headers: {
              'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
            },
            body: formData
          });
          
          if (response.ok) {
            console.log('Recording saved successfully');
            toast({
              title: t('callern.recordingSaved', 'Recording Saved'),
              description: t('callern.recordingSavedDesc', 'Your call has been saved to history'),
            });
          } else {
            console.error('Failed to save recording');
            toast({
              title: t('callern.recordingError', 'Recording Error'),
              description: t('callern.recordingErrorDesc', 'Failed to save recording'),
              variant: 'destructive'
            });
          }
        } catch (error) {
          console.error('Error uploading recording:', error);
        }
        
        recorderRef.current = null;
        setIsRecording(false);
        resolve();
      });
    });
  };

  const endCall = async () => {
    // Stop recording and save
    await stopAndSaveRecording();
    
    // Stop audio streaming
    stopStreaming();
    
    // Notify supervisor of session end
    if (socketRef.current) {
      socketRef.current.emit('supervisor-cleanup', { sessionId });
      socketRef.current.emit("end-call", { roomId, duration: callSeconds });
    }
    
    safeCleanup();
    onCallEnd();
  };

  function safeCleanup() {
    // Stop AI monitoring
    if (speechDetectionIntervalRef.current) {
      clearInterval(speechDetectionIntervalRef.current);
      speechDetectionIntervalRef.current = null;
    }
    
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
    } catch {}
    try {
      if (pcRef.current) {
        pcRef.current.onicecandidate = null;
        pcRef.current.ontrack = null;
        pcRef.current.close();
      }
    } catch {}
    pcRef.current = null;

    try {
      socketRef.current?.off();
      socketRef.current?.disconnect();
    } catch {}
    socketRef.current = null;

    // reset guards
    remoteDescSetRef.current = false;
    madeOfferRef.current = false;
    gotAnswerRef.current = false;
    isSettingRemoteRef.current = false;
    remoteSocketIdRef.current = null;
    pendingCandidatesRef.current = [];
    setConnected(false);
  }

  // UI helpers
  const fmt = (s: number) => {
    const hours = Math.floor(s / 3600);
    const mins = Math.floor((s % 3600) / 60);
    const secs = s % 60;
    if (hours > 0) {
      return `${hours}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render
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
                variant={connected ? "default" : "secondary"}
                className={cn(
                  "flex items-center gap-1",
                  connected && "bg-green-500/20 text-green-400 border-green-500/30"
                )}
              >
                {connected ? (
                  <>
                    <Wifi className="w-3 h-3" />
                    Connected
                  </>
                ) : status === "Connecting…" ? (
                  <>
                    <Circle className="w-3 h-3 animate-pulse" />
                    Connecting...
                  </>
                ) : (
                  <>
                    <WifiOff className="w-3 h-3" />
                    {status}
                  </>
                )}
              </Badge>
              
              {/* Call Duration */}
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono text-lg">{fmt(callSeconds)}</span>
              </div>
              
              {/* Package Minutes */}
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
              {/* AI Active */}
              <motion.div
                animate={{ scale: [1, 1.1, 1] }}
                transition={{ repeat: Infinity, duration: 2 }}
                className="flex items-center gap-2 px-3 py-1 bg-purple-500/20 rounded-full border border-purple-500/30"
              >
                <Brain className="w-4 h-4 text-purple-400" />
                <span className="text-xs text-purple-300">AI Active</span>
                <Sparkles className="w-3 h-3 text-purple-300 animate-pulse" />
              </motion.div>
              
              {/* Recording */}
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
              
              {/* Live Scores */}
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
              
              {/* TTT Ratio */}
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
        
        {/* Video Grid */}
        <div className="flex-1 p-4">
          <div className="h-full grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Remote Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur">
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
              {!connected && (
                <div className="absolute inset-0 flex items-center justify-center bg-black/50">
                  <div className="text-white text-center">
                    <Circle className="w-12 h-12 mx-auto mb-2 animate-pulse" />
                    <p>Waiting for {role === "student" ? "teacher" : "student"}...</p>
                  </div>
                </div>
              )}
            </div>
            
            {/* Local Video */}
            <div className="relative rounded-2xl overflow-hidden bg-black/30 backdrop-blur">
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
            <Button
              onClick={toggleAudio}
              variant={isAudioEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={toggleVideo}
              variant={isVideoEnabled ? "secondary" : "destructive"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={toggleScreenShare}
              variant={isScreenSharing ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              {isScreenSharing ? <MonitorOff className="w-6 h-6" /> : <Monitor className="w-6 h-6" />}
            </Button>
            
            <Button
              onClick={() => setShowAIOverlay(!showAIOverlay)}
              variant={showAIOverlay ? "default" : "secondary"}
              size="lg"
              className="rounded-full h-14 w-14"
            >
              <Brain className="w-6 h-6" />
            </Button>
            
            {/* Auto Recording Indicator */}
            {isRecording && (
              <div className="flex items-center gap-2 px-4 py-3 bg-red-500/20 rounded-full">
                <Circle className="w-4 h-4 fill-red-500 animate-pulse" />
                <span className="text-sm text-red-400">{t('callern.recording', 'Recording')}</span>
              </div>
            )}
            
            <Button
              onClick={endCall}
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
    </div>
  );
}

export default VideoCall;
