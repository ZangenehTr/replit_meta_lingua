// client/src/components/VideoCall.tsx
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
  const [status, setStatus] = useState("Connecting…");
  const [callSeconds, setCallSeconds] = useState(0);
  const [connected, setConnected] = useState(false);
  const [showAIOverlay, setShowAIOverlay] = useState(true);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

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
        socketRef.current.on("answer", async ({ answer, from }) => {
          const pc = pcRef.current;
          if (!pc) return;

          // remember who we're talking to
          if (!remoteSocketIdRef.current) remoteSocketIdRef.current = from;

          // ignore duplicates/late answers
          if (gotAnswerRef.current) return;
          if (pc.signalingState !== "have-local-offer") {
            // already stable or unexpected state → ignore
            return;
          }

          try {
            await pc.setRemoteDescription(answer);
            gotAnswerRef.current = true;
            remoteDescSetRef.current = true;

            for (const c of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(c);
              } catch (e) {
                console.warn("Queued ICE add failed", e);
              }
            }
            pendingCandidatesRef.current = [];
          } catch (err) {
            // If you see "called in wrong state: stable", it was a duplicate – safe to ignore.
            console.warn("Error setting remote answer (handled):", err);
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

  const endCall = () => {
    socketRef.current?.emit("end-call", { roomId, duration: callSeconds });
    safeCleanup();
    onCallEnd();
  };

  function safeCleanup() {
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
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  // Render
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* AI Overlay */}
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
        {/* Remote full-screen */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        {/* Local PiP */}
        <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20 bg-black/40">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none">
                <path d="M10 8l6 4-6 4V8z" stroke="white" strokeWidth="2" />
              </svg>
            </div>
          )}
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
