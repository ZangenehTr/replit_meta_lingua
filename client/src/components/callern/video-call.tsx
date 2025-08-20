import React, { useEffect, useRef, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  Phone, 
  PhoneOff,
  Monitor,
  MonitorOff
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import io, { Socket } from 'socket.io-client';

interface VideoCallProps {
  roomId: string;
  userId: number;
  role: 'student' | 'teacher';
  teacherName?: string;
  onCallEnd: () => void;
}

export function VideoCall({ roomId, userId, role, teacherName, onCallEnd }: VideoCallProps) {
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const socketRef = useRef<Socket | null>(null);
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<string>('Connecting...');
  const [callDuration, setCallDuration] = useState(0);
  
  const { toast } = useToast();
  const callStartTime = useRef<number>(Date.now());

  useEffect(() => {
    // Update call duration every second
    const timer = setInterval(() => {
      setCallDuration(Math.floor((Date.now() - callStartTime.current) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    initializeCall();
    
    return () => {
      cleanup();
    };
  }, [roomId]);

  const initializeCall = async () => {
    try {
      console.log('Initializing video call for room:', roomId);
      
      // Get user media
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      // Initialize WebSocket connection
      const socket = io({
        path: '/socket.io/',
        transports: ['websocket', 'polling']
      });
      
      socketRef.current = socket;
      
      // Join room
      socket.emit('join-room', {
        roomId,
        userId,
        role
      });
      
      // Set up peer connection
      setupPeerConnection();
      
      // Socket event handlers
      socket.on('user-joined', async (data) => {
        console.log('User joined:', data);
        setConnectionStatus('User joined, creating offer...');
        
        // Create and send offer
        if (peerConnectionRef.current && role === 'student') {
          const offer = await peerConnectionRef.current.createOffer();
          await peerConnectionRef.current.setLocalDescription(offer);
          
          socket.emit('offer', {
            roomId,
            offer,
            to: data.socketId
          });
        }
      });
      
      socket.on('offer', async (data) => {
        console.log('Received offer from:', data.from);
        setConnectionStatus('Received offer, creating answer...');
        
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.offer);
          const answer = await peerConnectionRef.current.createAnswer();
          await peerConnectionRef.current.setLocalDescription(answer);
          
          socket.emit('answer', {
            roomId,
            answer,
            to: data.from
          });
        }
      });
      
      socket.on('answer', async (data) => {
        console.log('Received answer from:', data.from);
        setConnectionStatus('Connected');
        
        if (peerConnectionRef.current) {
          await peerConnectionRef.current.setRemoteDescription(data.answer);
        }
      });
      
      socket.on('ice-candidate', async (data) => {
        console.log('Received ICE candidate from:', data.from);
        
        if (peerConnectionRef.current && data.candidate) {
          await peerConnectionRef.current.addIceCandidate(data.candidate);
        }
      });
      
      socket.on('call-ended', (data) => {
        console.log('Call ended:', data.reason);
        toast({
          title: 'Call Ended',
          description: data.reason || 'The call has ended',
        });
        onCallEnd();
      });
      
    } catch (error) {
      console.error('Error initializing call:', error);
      toast({
        title: 'Connection Error',
        description: 'Failed to initialize video call. Please check your camera and microphone permissions.',
        variant: 'destructive'
      });
    }
  };

  const setupPeerConnection = () => {
    const configuration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' }
      ]
    };
    
    const pc = new RTCPeerConnection(configuration);
    peerConnectionRef.current = pc;
    
    // Add local stream tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => {
        pc.addTrack(track, localStreamRef.current!);
      });
    }
    
    // Handle remote stream
    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current && event.streams[0]) {
        remoteVideoRef.current.srcObject = event.streams[0];
        setConnectionStatus('Connected');
      }
    };
    
    // Handle ICE candidates
    pc.onicecandidate = (event) => {
      if (event.candidate && socketRef.current) {
        // Get all socket IDs in the room except ours
        socketRef.current.emit('ice-candidate', {
          roomId,
          candidate: event.candidate,
          to: null // Will be handled server-side
        });
      }
    };
    
    // Monitor connection state
    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      setConnectionStatus(pc.connectionState);
    };
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
        
        socketRef.current?.emit('toggle-video', {
          roomId,
          enabled: videoTrack.enabled
        });
      }
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
        
        socketRef.current?.emit('toggle-audio', {
          roomId,
          enabled: audioTrack.enabled
        });
      }
    }
  };

  const endCall = () => {
    socketRef.current?.emit('end-call', {
      roomId,
      duration: callDuration
    });
    cleanup();
    onCallEnd();
  };

  const cleanup = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Close peer connection
    if (peerConnectionRef.current) {
      peerConnectionRef.current.close();
    }
    
    // Disconnect socket
    if (socketRef.current) {
      socketRef.current.disconnect();
    }
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-black z-50 flex flex-col">
      {/* Header */}
      <div className="absolute top-0 left-0 right-0 p-4 bg-gradient-to-b from-black/70 to-transparent z-10">
        <div className="flex justify-between items-center text-white">
          <div>
            <h2 className="text-lg font-semibold">
              {role === 'student' ? teacherName || 'Teacher' : 'Student'}
            </h2>
            <p className="text-sm opacity-80">{connectionStatus}</p>
          </div>
          <div className="text-right">
            <p className="text-2xl font-mono">{formatDuration(callDuration)}</p>
            <p className="text-sm opacity-80">Room: {roomId.slice(-8)}</p>
          </div>
        </div>
      </div>

      {/* Video Container */}
      <div className="flex-1 relative">
        {/* Remote Video (Full Screen) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (Picture-in-Picture) */}
        <div className="absolute bottom-24 right-4 w-32 h-48 md:w-48 md:h-64 rounded-lg overflow-hidden shadow-2xl border-2 border-white/20">
          <video
            ref={localVideoRef}
            autoPlay
            muted
            playsInline
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 bg-gray-900 flex items-center justify-center">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
      </div>

      {/* Controls */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/70 to-transparent">
        <div className="flex justify-center gap-4">
          <Button
            variant={isAudioEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={toggleAudio}
          >
            {isAudioEnabled ? <Mic className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
          </Button>
          
          <Button
            variant={isVideoEnabled ? "secondary" : "destructive"}
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={toggleVideo}
          >
            {isVideoEnabled ? <Video className="h-6 w-6" /> : <VideoOff className="h-6 w-6" />}
          </Button>
          
          <Button
            variant="destructive"
            size="lg"
            className="rounded-full w-14 h-14"
            onClick={endCall}
          >
            <PhoneOff className="h-6 w-6" />
          </Button>
        </div>
      </div>
    </div>
  );
}