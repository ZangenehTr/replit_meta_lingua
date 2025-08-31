// client/src/components/TeacherIncomingCall.tsx
import { useState, useEffect, useRef, useCallback } from "react";
import { Phone, PhoneOff, Video, User, VolumeX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useAuth } from "@/hooks/use-auth";
import { useSocket } from "@/hooks/use-socket";
import { VideoCall } from "./VideoCallFinal";
import { ringtoneService } from "@/services/ringtone-service";
import { getTeacherRingtonePreferences } from "./teacher-ringtone-settings";
import { useTranslation } from "react-i18next";

interface IncomingCallData {
  roomId: string;
  studentId: number;
  packageId: number;
  language: string;
  studentInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function TeacherIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(
    null,
  );
  const [isRinging, setIsRinging] = useState(false);
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallConfig, setActiveCallConfig] = useState<any>(null);
  const [isSilenced, setIsSilenced] = useState(false);
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket(); // shared socket
  const { t } = useTranslation(["teacher", "common", "callern"]);

  // Keep handler refs so we can detach precisely
  const onIncomingCallRef = useRef<(data: IncomingCallData) => void>();
  const onCallRequestRef = useRef<(data: IncomingCallData) => void>();
  const onAnyRef = useRef<((event: string, ...args: any[]) => void) | null>(
    null,
  );
  const onConnectRef = useRef<(() => void) | null>(null);
  const onConnTestRef = useRef<((data: any) => void) | null>(null);
  const onSocketTestRef = useRef<((data: any) => void) | null>(null);

  // Utility to detach all listeners we installed
  const detachListeners = useCallback(() => {
    if (!socket) return;
    if (onIncomingCallRef.current)
      socket.off("incoming-call", onIncomingCallRef.current);
    if (onCallRequestRef.current)
      socket.off("call-request", onCallRequestRef.current);
    if (onConnectRef.current) socket.off("connect", onConnectRef.current);
    if (onConnTestRef.current)
      socket.off("connection-test", onConnTestRef.current);
    if (onSocketTestRef.current)
      socket.off("teacher-socket-test-response", onSocketTestRef.current);
    if (onAnyRef.current) socket.offAny(onAnyRef.current);
  }, [socket]);

  // Install listeners while idle (not in active call)
  useEffect(() => {
    console.log("🔧 [TEACHER-INCOMING] useEffect triggered:", {
      hasUser: !!user,
      userRole: user?.role,
      hasSocket: !!socket,
      socketId: socket?.id,
      socketConnected: socket?.connected,
      isInCall
    });
    
    if (
      !user ||
      (user.role !== "Teacher" && user.role !== "Teacher/Tutor") ||
      !socket
    ) {
      console.log("❌ [TEACHER-INCOMING] Not registering listeners - missing requirements");
      return;
    }
    
    // Don't skip if in call - we still need to receive new calls
    if (isInCall) {
      console.log("⚠️ [TEACHER-INCOMING] Already in call but still registering listeners");
    }

    const handleIncomingCall = async (data: IncomingCallData) => {
      console.log("🔔 [TEACHER-INCOMING] INCOMING CALL RECEIVED:", data);
      console.log("🔔 [TEACHER-INCOMING] Current socket ID:", socket.id);
      setIncomingCall(data);
      setIsRinging(true);
      setIsSilenced(false);

      try {
        await ringtoneService.enableAudioWithUserGesture();
        const prefs = getTeacherRingtonePreferences(user.id);
        ringtoneService.setVolume(prefs.volume);
        await ringtoneService.playRingtone(prefs.selectedRingtone, true);
      } catch (err) {
        console.error("🔔 Ringtone failed:", err);
      }
    };

    const handleCallRequest = (data: IncomingCallData) => {
      // Backward compatible alias of incoming-call
      handleIncomingCall(data);
    };

    const onAny = (eventName: string, ...args: any[]) => {
      console.log(`📡 [TEACHER-INCOMING] Socket event: ${eventName}`, args);
    };

    const onConnect = () => {
      console.log("🔌 [TEACHER-INCOMING] Socket connected.");
      socket.emit("test-teacher-socket", {
        teacherId: user.id,
        message: "Testing teacher socket connection",
      });
    };

    const onConnTest = (data: any) => {
      console.log("✅ [TEACHER-INCOMING] connection-test:", data);
    };

    const onSocketTest = (data: any) => {
      console.log("✅ [TEACHER-INCOMING] teacher-socket-test-response:", data);
    };

    // Save refs for precise cleanup
    onIncomingCallRef.current = handleIncomingCall;
    onCallRequestRef.current = handleCallRequest;
    onAnyRef.current = onAny;
    onConnectRef.current = onConnect;
    onConnTestRef.current = onConnTest;
    onSocketTestRef.current = onSocketTest;

    // Register listeners
    console.log("📝 [TEACHER-INCOMING] Registering event listeners on socket:", socket.id);
    socket.on("incoming-call", handleIncomingCall);
    socket.on("call-request", handleCallRequest);
    socket.onAny(onAny);
    socket.on("connect", onConnect);
    socket.on("connection-test", onConnTest);
    socket.on("teacher-socket-test-response", onSocketTest);
    
    console.log("✅ [TEACHER-INCOMING] Event listeners registered successfully");

    // Initial probe
    console.log("🧪 [TEACHER-INCOMING] Sending test probe to server");
    socket.emit("test-teacher-socket", {
      teacherId: user.id,
      message: "Testing teacher socket connection",
    });

    return () => {
      // Detach only our listeners
      detachListeners();
      ringtoneService.stopRingtone();
    };
  }, [user?.id, user?.role, socket, detachListeners]); // Remove isInCall from dependencies to prevent re-registration

  const handleAccept = async () => {
    console.log("✅ [TEACHER-INCOMING] Accept button clicked");
    if (!incomingCall || !socket || !user?.id) {
      console.error("❌ [TEACHER-INCOMING] Cannot accept - missing requirements");
      return;
    }

    // Stop ringtone FIRST
    console.log("🔇 [TEACHER-INCOMING] Stopping ringtone");
    ringtoneService.stopRingtone();
    
    // Enable audio (non-blocking, with timeout)
    try {
      console.log("🎵 [TEACHER-INCOMING] Enabling audio");
      const audioPromise = ringtoneService.enableAudioWithUserGesture();
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Audio timeout')), 1000)
      );
      await Promise.race([audioPromise, timeoutPromise]);
      setAudioEnabled(true);
      console.log("🎵 [TEACHER-INCOMING] Audio enabled");
    } catch (error) {
      console.warn("🎵 [TEACHER-INCOMING] Audio enable failed (continuing):", error);
    }

    // Join & notify
    socket.emit("join-room", {
      roomId: incomingCall.roomId,
      userId: user.id,
      role: "teacher",
    });
    socket.emit("accept-call", {
      roomId: incomingCall.roomId,
      teacherId: user.id,
      studentId: incomingCall.studentId,
    });

    // Very important: stop listening to incoming-call while the call UI is mounted
    detachListeners();

    // Swap UI to the actual call
    setActiveCallConfig({
      roomId: incomingCall.roomId,
      userId: user.id,
      role: "teacher" as const,
      studentId: incomingCall.studentId,
      onCallEnd: handleEndCall,
    });
    setIsRinging(false);
    setIsInCall(true);
  };

  const handleReject = async () => {
    if (!incomingCall || !socket) return;

    ringtoneService.stopRingtone();

    socket.emit("call-rejected", {
      roomId: incomingCall.roomId,
      studentId: incomingCall.studentId,
      reason: "Teacher rejected the call",
    });

    setIsRinging(false);
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setActiveCallConfig(null);
    setIncomingCall(null);
    // Listeners will be re-attached by the effect when isInCall becomes false
  };

  const handleSilence = async () => {
    if (isSilenced) {
      // resume
      if (user?.id && incomingCall) {
        try {
          await ringtoneService.enableAudioWithUserGesture();
          const prefs = getTeacherRingtonePreferences(user.id);
          ringtoneService.setVolume(prefs.volume);
          await ringtoneService.playRingtone(prefs.selectedRingtone, true);
        } catch (err) {
          console.error("Failed to resume ringtone:", err);
        }
      }
      setIsSilenced(false);
    } else {
      ringtoneService.stopRingtone();
      setIsSilenced(true);
    }
  };

  // If in a call, show the VideoCall component
  if (isInCall && activeCallConfig) {
    return <VideoCall {...activeCallConfig} />;
  }

  // If not ringing, render nothing
  if (!isRinging || !incomingCall) return null;

  // Incoming call dialog
  return (
    <Dialog
      open={isRinging}
      onOpenChange={(open) => {
        if (!open) handleReject();
      }}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {t("teacher:incomingCall", "Incoming Call")}
          </DialogTitle>
        </DialogHeader>
        <Card className="border-0 shadow-none">
          <div className="p-6 text-center">
            <div className="mb-4">
              <div className="relative inline-block">
                <div className="animate-pulse">
                  <Video className="h-16 w-16 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">
              {t("teacher:incomingCallFrom", "Incoming call from")}
              {isSilenced && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({t("common:callActions.silenced", "Silenced")})
                </span>
              )}
            </h3>

            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {incomingCall.studentInfo?.firstName || "Student"}{" "}
                  {incomingCall.studentInfo?.lastName || ""}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Language: {incomingCall.language}
              </div>
            </div>

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleReject}
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                title={t("common:callActions.reject", "Reject")}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>

              <Button
                onClick={handleSilence}
                variant="outline"
                size="lg"
                className={`rounded-full h-14 w-14 ${
                  isSilenced
                    ? "bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-600"
                    : "hover:bg-gray-100"
                }`}
                title={
                  isSilenced
                    ? t("common:callActions.unsilence", "Unsilence")
                    : t("common:callActions.silence", "Silence")
                }
              >
                <VolumeX
                  className={`h-6 w-6 ${isSilenced ? "text-orange-600" : ""}`}
                />
              </Button>

              <Button
                onClick={handleAccept}
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                title={t("common:callActions.answer", "Answer")}
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}
