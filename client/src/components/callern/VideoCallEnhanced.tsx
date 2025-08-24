// Enhanced VideoCall with real AI integration
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import {
  installWebRTCErrorHandler,
  wrapPeerConnection,
} from "@/lib/webrtc-error-handler";
import { AIOverlay } from "./AIOverlay";
import { Brain } from "lucide-react";

// Install global WebRTC error handler once
installWebRTCErrorHandler();

interface VideoCallProps {
  roomId: string;
  userId: number;
  role: "student" | "teacher";
  teacherName?: string;
  onCallEnd: () => void;
}

export function VideoCall({
  roomId,
  userId,
  role,
  teacherName,
  onCallEnd,
}: VideoCallProps) {
  // Video elements
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // WebRTC + Socket
  const pcRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);

  // State guards for WebRTC signaling
  const remoteDescSetRef = useRef(false);
  const madeOfferRef = useRef(false);
  const gotAnswerRef = useRef(false);
  const isSettingRemoteRef = useRef(false);
  const remoteSocketIdRef = useRef<string | null>(null);
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const signalingStateRef = useRef<RTCSignalingState>("stable");

  // UI
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [status, setStatus] = useState("Connecting…");
  const [callSeconds, setCallSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [showAIOverlay, setShowAIOverlay] = useState(true);

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
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
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

        if (isSpeaking) {
          const now = Date.now();
          const speaker = role === "student" ? "student" : "teacher";
          
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
        }

        // Update attention score based on activity
        const timeSinceActivity = Date.now() - lastActivityRef.current;
        if (timeSinceActivity > 10000) {
          attentionScoreRef.current = Math.max(0, attentionScoreRef.current - 5);
        } else {
          attentionScoreRef.current = Math.min(100, attentionScoreRef.current + 2);
        }

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

  // Setup effect
  useEffect(() => {
    let cleanup = false;

    const safeCleanup = () => {
      if (cleanup) return;
      cleanup = true;

      // Stop AI monitoring
      if (speechDetectionIntervalRef.current) {
        clearInterval(speechDetectionIntervalRef.current);
        speechDetectionIntervalRef.current = null;
      }
      
      if (audioContextRef.current) {
        audioContextRef.current.close();
        audioContextRef.current = null;
      }

      // Stop local stream
      try {
        localStreamRef.current?.getTracks().forEach((t) => t.stop());
      } catch {}
      localStreamRef.current = null;

      // Close peer connection
      try {
        pcRef.current?.close();
      } catch {}
      pcRef.current = null;

      // Cleanup socket
      try {
        if (socketRef.current?.connected) {
          socketRef.current.emit("leave-room", { roomId });
        }
        socketRef.current?.off();
        socketRef.current?.disconnect();
      } catch {}
      socketRef.current = null;

      // Reset guards
      remoteDescSetRef.current = false;
      madeOfferRef.current = false;
      gotAnswerRef.current = false;
      isSettingRemoteRef.current = false;
      remoteSocketIdRef.current = null;
      pendingCandidatesRef.current = [];
      signalingStateRef.current = "stable";
      setConnected(false);
    };

    (async () => {
      try {
        // Get user media
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Setup socket
        const socket = io({
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        socketRef.current = socket;

        socket.on("connect", () => {
          console.log("Socket connected:", socket.id);
          setStatus("Joining room…");
          socket.emit("join-room", { roomId, userId, role });
          
          // Initialize AI monitoring after connection
          initializeAIMonitoring(stream, socket);
        });

        socket.on("disconnect", () => {
          console.log("Socket disconnected");
          setStatus("Disconnected - reconnecting…");
          setConnected(false);
        });

        socket.on("room-users", ({ users }) => {
          console.log("Room users:", users);
          if (users.length > 1) {
            setStatus("Peer joined. Starting call…");
          }
        });

        // Setup peer connection
        const pc = wrapPeerConnection(
          new RTCPeerConnection({
            iceServers: [
              { urls: "stun:stun.l.google.com:19302" },
              { urls: "stun:stun1.l.google.com:19302" },
            ],
          })
        );
        pcRef.current = pc;

        // Monitor signaling state
        pc.onsignalingstatechange = () => {
          console.log("Signaling state:", pc.signalingState);
          signalingStateRef.current = pc.signalingState;
        };

        // Add local tracks
        stream.getTracks().forEach((track) => {
          pc.addTrack(track, stream);
        });

        // Handle remote stream
        pc.ontrack = ({ streams }) => {
          console.log("Got remote track");
          if (remoteVideoRef.current && streams[0]) {
            remoteVideoRef.current.srcObject = streams[0];
            setConnected(true);
            setStatus("Connected");
          }
        };

        // Handle ICE candidates
        pc.onicecandidate = ({ candidate }) => {
          if (candidate) {
            socket.emit("ice-candidate", { roomId, candidate });
          }
        };

        pc.onconnectionstatechange = () => {
          console.log("Connection state:", pc.connectionState);
          if (pc.connectionState === "connected") {
            setConnected(true);
            setStatus("Connected");
          } else if (pc.connectionState === "failed") {
            setStatus("Connection failed");
            endCall();
          }
        };

        // Socket event handlers
        socket.on("room-ready", async ({ roomId, socketId }) => {
          if (role === "student") {
            console.log("Student initiating call");
            try {
              // Check signaling state before creating offer
              if (signalingStateRef.current !== "stable") {
                console.log("Skipping offer - not in stable state");
                return;
              }
              
              if (!madeOfferRef.current) {
                madeOfferRef.current = true;
                setStatus("Creating offer…");
                const offer = await pc.createOffer();
                await pc.setLocalDescription(offer);
                socket.emit("offer", {
                  roomId,
                  offer,
                  to: socketId,
                });
              }
            } catch (err) {
              madeOfferRef.current = false;
              console.error("Offer creation failed:", err);
            }
          }
        });

        // Handle offer (teacher side)
        socket.on("offer", async ({ offer, from }) => {
          if (!pc) return;
          
          // Check if we're already processing
          if (isSettingRemoteRef.current) {
            console.log("Already processing an offer, ignoring duplicate");
            return;
          }
          
          // Check signaling state
          if (signalingStateRef.current !== "stable") {
            console.log("Cannot process offer - not in stable state");
            return;
          }
          
          remoteSocketIdRef.current = from;
          isSettingRemoteRef.current = true;

          try {
            setStatus("Received offer. Answering…");
            await pc.setRemoteDescription(offer);
            remoteDescSetRef.current = true;

            // Process pending ICE candidates
            for (const c of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(c);
              } catch (e) {
                console.warn("Failed to add queued ICE:", e);
              }
            }
            pendingCandidatesRef.current = [];

            const answer = await pc.createAnswer();
            await pc.setLocalDescription(answer);
            socket.emit("answer", { roomId, answer, to: from });
          } catch (err) {
            console.error("Error handling offer:", err);
          } finally {
            isSettingRemoteRef.current = false;
          }
        });

        // Handle answer (student side)
        socket.on("answer", async ({ answer, from }) => {
          if (!pc) return;

          // Remember peer
          if (!remoteSocketIdRef.current) remoteSocketIdRef.current = from;

          // Check if we already got an answer
          if (gotAnswerRef.current) {
            console.log("Already got answer, ignoring duplicate");
            return;
          }

          // Verify we're in the right state
          if (signalingStateRef.current !== "have-local-offer") {
            console.log(`Cannot set answer in state: ${signalingStateRef.current}`);
            return;
          }

          try {
            await pc.setRemoteDescription(answer);
            gotAnswerRef.current = true;
            remoteDescSetRef.current = true;

            // Process pending ICE
            for (const c of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(c);
              } catch (e) {
                console.warn("Failed to add queued ICE:", e);
              }
            }
            pendingCandidatesRef.current = [];
          } catch (err) {
            console.error("Error setting remote answer:", err);
          }
        });

        // Handle ICE candidates
        socket.on("ice-candidate", async ({ candidate, from }) => {
          if (!pc || !candidate) return;

          // Only accept from our peer
          if (remoteSocketIdRef.current && from !== remoteSocketIdRef.current) {
            return;
          }
          if (!remoteSocketIdRef.current) remoteSocketIdRef.current = from;

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
            console.warn("Failed to add ICE candidate:", err);
            pendingCandidatesRef.current.push(cand);
          }
        });

        socket.on("call-ended", ({ reason }) => {
          console.log("Call ended by peer:", reason);
          endCall();
        });

        socket.on("user-left", ({ socketId }) => {
          if (remoteSocketIdRef.current === socketId) {
            setStatus("Peer disconnected");
            endCall();
          }
        });

        setStatus("Waiting for peer…");
      } catch (err) {
        console.error("Setup error:", err);
        setStatus("Could not access camera/mic");
      }
    })();

    return () => {
      safeCleanup();
    };
  }, [roomId, userId, role]);

  // Control functions
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

  const endCall = () => {
    try {
      if (socketRef.current?.connected) {
        socketRef.current.emit("end-call", {
          roomId,
          duration: callSeconds,
        });
      }
    } catch (err) {
      console.error("Error ending call:", err);
    }
    onCallEnd();
  };

  // Format time
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* AI Overlay with real data */}
      <AIOverlay 
        roomId={roomId} 
        role={role} 
        isVisible={showAIOverlay}
        onClose={() => setShowAIOverlay(false)}
      />
      
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-semibold">
              {role === "student" ? teacherName || "Teacher" : "Student"}
            </h2>
            <p className="text-sm opacity-80">{status}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono">{fmt(callSeconds)}</p>
            <p className="text-sm opacity-80">Room: {roomId.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Videos */}
      <div className="flex-1 relative">
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 bg-black/40">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-center gap-4">
          <button
            onClick={toggleAudio}
            className={`rounded-full w-14 h-14 text-white ${isAudioEnabled ? "bg-white/20" : "bg-red-600"}`}
            title={isAudioEnabled ? "Mute" : "Unmute"}
          >
            {isAudioEnabled ? "🎤" : "🔇"}
          </button>

          <button
            onClick={toggleVideo}
            className={`rounded-full w-14 h-14 text-white ${isVideoEnabled ? "bg-white/20" : "bg-red-600"}`}
            title={isVideoEnabled ? "Turn camera off" : "Turn camera on"}
          >
            {isVideoEnabled ? "📷" : "🚫"}
          </button>

          <button
            onClick={endCall}
            className="rounded-full w-14 h-14 text-white bg-red-700"
            title="End call"
          >
            ⛔
          </button>

          <button
            onClick={() => setShowAIOverlay(!showAIOverlay)}
            className={`rounded-full w-14 h-14 text-white ${showAIOverlay ? "bg-purple-600" : "bg-white/20"}`}
            title="Toggle AI Assistant"
          >
            <Brain className="w-6 h-6 mx-auto" />
          </button>
        </div>
      </div>
    </div>
  );
}

export default VideoCall;