import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Monitor, 
  MessageSquare, 
  Users,
  Phone,
  PhoneOff,
  Camera,
  Settings
} from "lucide-react";

interface LiveSession {
  id: number;
  title: string;
  tutorName: string;
  tutorAvatar: string;
  scheduledAt: string;
  duration: number;
  language: string;
  level: string;
  participants: number;
  maxParticipants: number;
  status: "scheduled" | "live" | "ended";
  roomId?: string;
}

interface VideoCallState {
  isConnected: boolean;
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  participants: number;
}

export function LiveClassroom() {
  const queryClient = useQueryClient();
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  
  const [videoState, setVideoState] = useState<VideoCallState>({
    isConnected: false,
    isVideoEnabled: true,
    isAudioEnabled: true,
    isScreenSharing: false,
    participants: 0
  });

  const { data: liveSessions, isLoading: isLoadingSessions } = useQuery<LiveSession[]>({
    queryKey: ["/api/sessions/live"],
    queryFn: async () => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch("/api/sessions/live", {
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to fetch sessions");
      return response.json();
    }
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const token = localStorage.getItem("auth_token");
      const response = await fetch(`/api/sessions/${sessionId}/join`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (!response.ok) throw new Error("Failed to join session");
      return response.json();
    },
    onSuccess: (data) => {
      initializeWebRTC(data.roomId);
    }
  });

  const initializeWebRTC = async (roomId: string) => {
    try {
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }

      // Create peer connection
      const peerConnection = new RTCPeerConnection({
        iceServers: [
          { urls: "stun:stun.l.google.com:19302" },
          { urls: "stun:stun1.l.google.com:19302" }
        ]
      });

      peerConnectionRef.current = peerConnection;
      
      // Add local stream to peer connection
      stream.getTracks().forEach(track => {
        peerConnection.addTrack(track, stream);
      });

      // Handle remote stream
      peerConnection.ontrack = (event) => {
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
      };

      setVideoState(prev => ({ 
        ...prev, 
        isConnected: true, 
        participants: prev.participants + 1 
      }));

    } catch (error) {
      console.error("Failed to initialize WebRTC:", error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setVideoState(prev => ({ ...prev, isVideoEnabled: videoTrack.enabled }));
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setVideoState(prev => ({ ...prev, isAudioEnabled: audioTrack.enabled }));
      }
    }
  };

  const toggleScreenShare = async () => {
    try {
      if (!videoState.isScreenSharing) {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true
        });
        
        if (peerConnectionRef.current && localStreamRef.current) {
          const videoTrack = screenStream.getVideoTracks()[0];
          const sender = peerConnectionRef.current.getSenders().find(s => 
            s.track && s.track.kind === "video"
          );
          if (sender) {
            await sender.replaceTrack(videoTrack);
          }
        }
        
        setVideoState(prev => ({ ...prev, isScreenSharing: true }));
      }
    } catch (error) {
      console.error("Screen sharing failed:", error);
    }
  };

  const endCall = () => {
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    setVideoState({
      isConnected: false,
      isVideoEnabled: true,
      isAudioEnabled: true,
      isScreenSharing: false,
      participants: 0
    });
  };

  useEffect(() => {
    return () => {
      endCall();
    };
  }, []);

  if (videoState.isConnected) {
    return (
      <Card className="h-full">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Video className="h-5 w-5" />
              Live Persian Lesson
            </span>
            <Badge variant="destructive" className="animate-pulse">
              🔴 LIVE
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Video Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-64">
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={localVideoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                You
              </div>
              {!videoState.isVideoEnabled && (
                <div className="absolute inset-0 bg-gray-800 flex items-center justify-center">
                  <Camera className="h-8 w-8 text-gray-400" />
                </div>
              )}
            </div>
            
            <div className="relative bg-gray-900 rounded-lg overflow-hidden">
              <video
                ref={remoteVideoRef}
                autoPlay
                playsInline
                className="w-full h-full object-cover"
              />
              <div className="absolute bottom-2 left-2 bg-black/50 text-white px-2 py-1 rounded text-xs">
                Dr. Sara Hosseini (Tutor)
              </div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-2">
            <Button
              variant={videoState.isAudioEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleAudio}
            >
              {videoState.isAudioEnabled ? (
                <Mic className="h-4 w-4" />
              ) : (
                <MicOff className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant={videoState.isVideoEnabled ? "default" : "destructive"}
              size="sm"
              onClick={toggleVideo}
            >
              {videoState.isVideoEnabled ? (
                <Video className="h-4 w-4" />
              ) : (
                <VideoOff className="h-4 w-4" />
              )}
            </Button>
            
            <Button
              variant={videoState.isScreenSharing ? "secondary" : "outline"}
              size="sm"
              onClick={toggleScreenShare}
            >
              <Monitor className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <MessageSquare className="h-4 w-4" />
            </Button>
            
            <Button variant="outline" size="sm">
              <Users className="h-4 w-4" />
              <span className="ml-1">{videoState.participants}</span>
            </Button>
            
            <Button variant="destructive" size="sm" onClick={endCall}>
              <PhoneOff className="h-4 w-4" />
            </Button>
          </div>

          {/* Session Info */}
          <div className="bg-muted p-3 rounded-lg">
            <div className="flex items-center justify-between text-sm">
              <span>Persian Grammar Fundamentals</span>
              <span>35 minutes remaining</span>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Next topic: Past tense conjugation
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Video className="h-5 w-5" />
          Live Virtual Classroom
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {isLoadingSessions ? (
            <div className="animate-pulse space-y-4">
              <div className="border rounded-lg p-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 bg-muted rounded-full" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 bg-muted rounded w-3/4" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                  </div>
                </div>
              </div>
            </div>
          ) : liveSessions && liveSessions.length > 0 ? (
            liveSessions.map((session) => (
              <div key={session.id} className="border rounded-lg p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <img
                      src={session.tutorAvatar}
                      alt={session.tutorName}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                    <div>
                      <h4 className="font-medium">{session.title}</h4>
                      <p className="text-sm text-muted-foreground">
                        with {session.tutorName}
                      </p>
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="outline">{session.language}</Badge>
                        <Badge variant="secondary">{session.level}</Badge>
                        {session.status === "live" && (
                          <Badge variant="destructive" className="animate-pulse">
                            🔴 LIVE
                          </Badge>
                        )}
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">
                      {session.participants}/{session.maxParticipants} students
                    </p>
                    <Button
                      size="sm"
                      className="mt-2"
                      onClick={() => joinSessionMutation.mutate(session.id)}
                      disabled={joinSessionMutation.isPending}
                    >
                      {session.status === "live" ? (
                        <>
                          <Video className="h-4 w-4 mr-1" />
                          Join Live Session
                        </>
                      ) : (
                        <>
                          <Phone className="h-4 w-4 mr-1" />
                          Join at {new Date(session.scheduledAt).toLocaleTimeString()}
                        </>
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            ))
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <Video className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No live sessions available</p>
              <p className="text-xs mt-1">Check back later or schedule a session with a tutor</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}