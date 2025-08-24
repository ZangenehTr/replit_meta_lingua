// client/src/components/VideoCall.tsx
import React, { useEffect, useRef, useState } from "react";
import io, { Socket } from "socket.io-client";
import { installWebRTCErrorHandler, wrapPeerConnection } from "@/lib/webrtc-error-handler";

// Install the global WebRTC error handler once
installWebRTCErrorHandler();

// ---- Props ----
interface VideoCallProps {
  roomId: string;
  userId: number;
  role: "student" | "teacher";
  teacherName?: string;
  onCallEnd: () => void;
}

// ---- Component ----
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

  // Signaling safety
  const pendingCandidatesRef = useRef<RTCIceCandidateInit[]>([]);
  const remoteDescSetRef = useRef(false); // true after we call setRemoteDescription successfully

  // UI state
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [status, setStatus] = useState("Connecting…");
  const [callSeconds, setCallSeconds] = useState(0);
  const [connected, setConnected] = useState(false);

  // Timer
  useEffect(() => {
    const t = setInterval(() => setCallSeconds((s) => s + 1), 1000);
    return () => clearInterval(t);
  }, []);

  // Mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 1) Get camera + mic
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        if (!mounted) return;
        localStreamRef.current = stream;

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
          // ignore autoplay promise
          // eslint-disable-next-line @typescript-eslint/no-floating-promises
          localVideoRef.current.play().catch(() => {});
        }

        // 2) Make RTCPeerConnection with error handling wrapper
        pcRef.current = wrapPeerConnection(new RTCPeerConnection({
          iceServers: [
            // Your STUN + TURN. Metered.com TURN will go here if you have creds.
            { urls: "stun:stun.l.google.com:19302" },
          ],
        }));

        // 3) Add local tracks
        stream
          .getTracks()
          .forEach((track) => pcRef.current!.addTrack(track, stream));

        // 4) When we get remote tracks, show them
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

        // 5) Send ICE to peer (but only via server to the correct socket)
        pcRef.current.onicecandidate = (e) => {
          if (!e.candidate) return;
          socketRef.current?.emit("ice-candidate", {
            roomId,
            candidate: e.candidate, // server forwards to the other peer (target decided client-side)
            // we let server-side "to" stay null if you manage routing per room
            // but your server supports "to", so we keep it null and let server broadcast to room,
            // or you can pass a specific 'to' if you have it.
          });
        };

        // 6) Connection state info (nice to have)
        pcRef.current.onconnectionstatechange = () => {
          const st = pcRef.current?.connectionState;
          if (st) setStatus(st);
        };

        // 7) Connect Socket.IO
        socketRef.current = io({
          path: "/socket.io", // your server uses "/socket.io"
          transports: ["websocket", "polling"],
        });

        // 8) Join room
        socketRef.current.emit("join-room", { roomId, userId, role });

        // --- Socket listeners ---

        // Someone else joined the room (we are student → we SHOULD create offer)
        socketRef.current.on(
          "user-joined",
          async ({ socketId, role: joinedRole }) => {
            // Only the student creates the first offer
            if (role !== "student") return;
            if (!pcRef.current) return;

            // Prevent double offers if already in a non-stable state
            if (pcRef.current.signalingState !== "stable") return;

            try {
              setStatus("Creating offer…");
              const offer = await pcRef.current.createOffer();
              await pcRef.current.setLocalDescription(offer);
              socketRef.current?.emit("offer", { roomId, offer, to: socketId });
            } catch (err) {
              console.error("Offer flow failed:", err);
            }
          },
        );

        // We received an offer (we are teacher → we ANSWER)
        socketRef.current.on("offer", async ({ offer, from }) => {
          if (!pcRef.current) return;
          try {
            setStatus("Received offer. Answering…");

            // 1) Set remote description
            await pcRef.current.setRemoteDescription(offer);
            remoteDescSetRef.current = true;

            // 2) Drain any early ICE we queued
            for (const c of pendingCandidatesRef.current) {
              try {
                await pcRef.current.addIceCandidate(c);
              } catch (e) {
                console.warn("Queued ICE add failed", e);
              }
            }
            pendingCandidatesRef.current = [];

            // 3) Create + send answer
            const answer = await pcRef.current.createAnswer();
            await pcRef.current.setLocalDescription(answer);
            socketRef.current?.emit("answer", { roomId, answer, to: from });
          } catch (err) {
            console.error("Error handling offer:", err);
          }
        });

        // We received an answer (we are student → we SET it)
        socketRef.current.on("answer", async ({ answer }) => {
          const pc = pcRef.current;
          if (!pc) return;

          // Only set the answer if we’re expecting one
          if (pc.signalingState !== "have-local-offer") {
            // Already stable? Ignore duplicate/late answer
            if (pc.signalingState === "stable") {
              console.log(
                "Answer received in stable state; ignoring duplicate.",
              );
            } else {
              console.log("Unexpected state for answer:", pc.signalingState);
            }
            return;
          }

          try {
            await pc.setRemoteDescription(answer);
            remoteDescSetRef.current = true;

            // Drain queued ICE now that remote description exists
            for (const c of pendingCandidatesRef.current) {
              try {
                await pc.addIceCandidate(c);
              } catch (e) {
                console.warn("Queued ICE add failed (handled):", e);
              }
            }
            pendingCandidatesRef.current = [];
          } catch (err) {
            console.warn("Error setting remote answer (handled):", err);
            // Don't throw - this is usually a timing issue
          }
        });

        // We received an ICE candidate from the other peer
        socketRef.current.on("ice-candidate", async ({ candidate }) => {
          const pc = pcRef.current;
          if (!pc || !candidate) return;

          // Normalize candidate shape (some libs send plain strings)
          const cand: RTCIceCandidateInit = {
            candidate: candidate.candidate || candidate,
            sdpMid: candidate.sdpMid ?? "0",
            sdpMLineIndex: candidate.sdpMLineIndex ?? 0,
          };

          // If remoteDescription is not set yet, queue it
          if (!remoteDescSetRef.current || !pc.remoteDescription) {
            pendingCandidatesRef.current.push(cand);
            return;
          }

          try {
            await pc.addIceCandidate(cand);
          } catch (err) {
            console.warn("addIceCandidate failed (handled); queueing", err);
            pendingCandidatesRef.current.push(cand);
          }
        });

        // If the other side ends the call
        socketRef.current.on("call-ended", ({ reason }) => {
          console.log("Call ended by peer:", reason);
          endCall();
        });

        setStatus("Waiting for peer…");
      } catch (err) {
        console.error("Init error:", err);
        setStatus("Could not access camera/mic");
      }
    })();

    return () => {
      mounted = false;
      cleanup();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [roomId, userId, role]);

  // --- Controls ---
  const toggleVideo = () => {
    const track = localStreamRef.current?.getVideoTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsVideoEnabled(track.enabled);
    socketRef.current?.emit("toggle-video", { roomId, enabled: track.enabled });
  };

  const toggleAudio = () => {
    const track = localStreamRef.current?.getAudioTracks()[0];
    if (!track) return;
    track.enabled = !track.enabled;
    setIsAudioEnabled(track.enabled);
    socketRef.current?.emit("toggle-audio", { roomId, enabled: track.enabled });
  };

  const endCall = () => {
    socketRef.current?.emit("end-call", { roomId, duration: callSeconds });
    cleanup();
    onCallEnd();
  };

  function cleanup() {
    try {
      localStreamRef.current?.getTracks().forEach((t) => t.stop());
      pcRef.current?.close();
      pcRef.current = null;
      socketRef.current?.disconnect();
      socketRef.current = null;
      remoteDescSetRef.current = false;
      pendingCandidatesRef.current = [];
      setConnected(false);
    } catch {}
  }

  // --- UI helpers ---
  const fmt = (s: number) => {
    const m = Math.floor(s / 60);
    const r = s % 60;
    return `${String(m).padStart(2, "0")}:${String(r).padStart(2, "0")}`;
  };

  // --- Render ---
  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
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
        </div>
      </div>
    </div>
  );
}

export default VideoCall;
