import React, { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from 'simple-peer';
import { useSocket } from '@/hooks/useSocket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Monitor, MonitorOff, MessageSquare, HelpCircle,
  Volume2, VolumeX, Maximize2, Minimize2
} from 'lucide-react';
import { webrtcConfig } from '../../../../shared/webrtc-config';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  roomId: string;
  userId: number;
  role: 'student' | 'teacher';
  onCallEnd: () => void;
  onMinutesUpdate?: (minutes: number) => void;
}

export function VideoCall({ roomId, userId, role, onCallEnd, onMinutesUpdate }: VideoCallProps) {
  const { t } = useTranslation(['callern']);
  const socket = useSocket();
  
  // Video refs
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerRef = useRef<SimplePeer.Instance | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  
  // State management
  const [isConnecting, setIsConnecting] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(null);
  const [showChat, setShowChat] = useState(false);
  const [showWordHelper, setShowWordHelper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  
  // Timer for call duration
  useEffect(() => {
    if (isConnected) {
      const timer = setInterval(() => {
        setCallDuration(prev => {
          const newDuration = prev + 1;
          if (onMinutesUpdate && newDuration % 60 === 0) {
            onMinutesUpdate(Math.floor(newDuration / 60));
          }
          return newDuration;
        });
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [isConnected, onMinutesUpdate]);
  
  // Initialize media stream
  const initializeMedia = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: true
      });
      
      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
      
      return stream;
    } catch (error) {
      console.error('Error accessing media devices:', error);
      alert(t('callern:errors.mediaAccess'));
      return null;
    }
  }, [t]);
  
  // Create peer connection
  const createPeer = useCallback((initiator: boolean, stream: MediaStream, targetSocketId: string) => {
    const peer = new SimplePeer({
      initiator,
      stream,
      config: webrtcConfig,
      trickle: true
    });
    
    peer.on('signal', (signal) => {
      if (signal.type === 'offer') {
        socket?.emit('offer', {
          roomId,
          offer: signal,
          to: targetSocketId
        });
      } else if (signal.type === 'answer') {
        socket?.emit('answer', {
          roomId,
          answer: signal,
          to: targetSocketId
        });
      } else {
        // ICE candidate
        socket?.emit('ice-candidate', {
          roomId,
          candidate: signal,
          to: targetSocketId
        });
      }
    });
    
    peer.on('stream', (remoteStream) => {
      console.log('Received remote stream');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = remoteStream;
      }
      setIsConnected(true);
      setIsConnecting(false);
    });
    
    peer.on('connect', () => {
      console.log('Peer connected');
      setIsConnected(true);
      setIsConnecting(false);
    });
    
    peer.on('error', (err) => {
      console.error('Peer error:', err);
      setIsConnecting(false);
    });
    
    peer.on('close', () => {
      console.log('Peer connection closed');
      handleCallEnd();
    });
    
    return peer;
  }, [socket, roomId]);
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleUserJoined = async ({ userId: joinedUserId, socketId }: any) => {
      console.log('User joined:', joinedUserId, socketId);
      if (joinedUserId !== userId) {
        setRemoteSocketId(socketId);
        
        // If we're the teacher, initiate the call
        if (role === 'teacher') {
          const stream = await initializeMedia();
          if (stream) {
            peerRef.current = createPeer(true, stream, socketId);
          }
        }
      }
    };
    
    const handleOffer = async ({ offer, from }: any) => {
      console.log('Received offer from:', from);
      setRemoteSocketId(from);
      
      const stream = await initializeMedia();
      if (stream) {
        const peer = createPeer(false, stream, from);
        peer.signal(offer);
        peerRef.current = peer;
      }
    };
    
    const handleAnswer = ({ answer }: any) => {
      console.log('Received answer');
      if (peerRef.current) {
        peerRef.current.signal(answer);
      }
    };
    
    const handleIceCandidate = ({ candidate }: any) => {
      console.log('Received ICE candidate');
      if (peerRef.current) {
        peerRef.current.signal(candidate);
      }
    };
    
    const handlePeerVideoToggle = ({ enabled }: any) => {
      // Handle remote video toggle
      console.log('Peer video toggled:', enabled);
    };
    
    const handlePeerAudioToggle = ({ enabled }: any) => {
      // Handle remote audio toggle
      console.log('Peer audio toggled:', enabled);
    };
    
    // Register event listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('peer-video-toggle', handlePeerVideoToggle);
    socket.on('peer-audio-toggle', handlePeerAudioToggle);
    
    // Join the room
    socket.emit('join-room', { roomId, userId, role });
    
    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('peer-video-toggle', handlePeerVideoToggle);
      socket.off('peer-audio-toggle', handlePeerAudioToggle);
    };
  }, [socket, roomId, userId, role, createPeer, initializeMedia]);
  
  // Initialize media on mount (for student waiting for teacher)
  useEffect(() => {
    if (role === 'student') {
      initializeMedia();
    }
    
    return () => {
      // Cleanup on unmount
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach(track => track.stop());
      }
      if (peerRef.current) {
        peerRef.current.destroy();
      }
    };
  }, [role, initializeMedia]);
  
  // Control functions
  const toggleMute = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
        socket?.emit('toggle-audio', { roomId, enabled: audioTrack.enabled });
      }
    }
  };
  
  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
        socket?.emit('toggle-video', { roomId, enabled: videoTrack.enabled });
      }
    }
  };
  
  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: false
        });
        
        const videoTrack = screenStream.getVideoTracks()[0];
        
        // Replace the video track in the peer stream
        if (peerRef.current && localStreamRef.current) {
          peerRef.current.replaceTrack(
            localStreamRef.current.getVideoTracks()[0],
            videoTrack,
            localStreamRef.current
          );
        }
        
        videoTrack.onended = () => {
          toggleScreenShare();
        };
        
        setIsScreenSharing(true);
        socket?.emit('share-screen', { roomId, enabled: true });
      } catch (error) {
        console.error('Error sharing screen:', error);
      }
    } else {
      // Stop screen share and switch back to camera
      if (localStreamRef.current && peerRef.current) {
        const videoTrack = localStreamRef.current.getVideoTracks()[0];
        const currentTrack = localStreamRef.current.getVideoTracks().find(t => t.enabled === false) || 
                            localStreamRef.current.getVideoTracks()[0];
        
        if (videoTrack) {
          peerRef.current.replaceTrack(
            currentTrack,
            videoTrack,
            localStreamRef.current
          );
        }
      }
      
      setIsScreenSharing(false);
      socket?.emit('share-screen', { roomId, enabled: false });
    }
  };
  
  const handleCallEnd = () => {
    // Stop all tracks
    if (localStreamRef.current) {
      localStreamRef.current.getTracks().forEach(track => track.stop());
    }
    
    // Destroy peer connection
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    
    // Leave room
    socket?.emit('leave-room', { roomId });
    
    // Callback to parent
    onCallEnd();
  };
  
  const formatTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };
  
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };
  
  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className={cn(
              "w-3 h-3 rounded-full",
              isConnected ? "bg-green-500 animate-pulse" : "bg-yellow-500"
            )} />
            <span className="text-white text-sm">
              {isConnected ? t('callern:connected') : t('callern:connecting')}
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
            onClick={() => setShowWordHelper(!showWordHelper)}
            className="text-white hover:bg-gray-700"
          >
            <HelpCircle className="h-4 w-4 mr-2" />
            {t('callern:wordHelper')}
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
            onClick={toggleFullscreen}
            className="text-white hover:bg-gray-700"
          >
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>
        </div>
      </div>
      
      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-cover"
        />
        
        {/* Local Video (PiP) */}
        <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-800 rounded-lg overflow-hidden shadow-lg">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="h-8 w-8 text-gray-400" />
            </div>
          )}
        </div>
        
        {/* Connecting Overlay */}
        {isConnecting && (
          <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50">
            <div className="text-white text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4" />
              <p>{t('callern:waitingForConnection')}</p>
            </div>
          </div>
        )}
        
        {/* Word Helper Panel */}
        {showWordHelper && (
          <div className="absolute top-4 left-4 w-80 bg-white rounded-lg shadow-lg p-4">
            <h3 className="font-semibold mb-2">{t('callern:wordHelper')}</h3>
            <input
              type="text"
              placeholder={t('callern:typeWordForHelp')}
              className="w-full px-3 py-2 border rounded-md mb-2"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  // TODO: Call AI service for translation
                  console.log('Getting help for:', e.currentTarget.value);
                }
              }}
            />
            <div className="text-sm text-gray-600">
              {t('callern:pressEnterForTranslation')}
            </div>
          </div>
        )}
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
            {isMuted ? <MicOff className="h-6 w-6" /> : <Mic className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isVideoOff ? "destructive" : "secondary"}
            onClick={toggleVideo}
            className="rounded-full w-14 h-14"
          >
            {isVideoOff ? <VideoOff className="h-6 w-6" /> : <Video className="h-6 w-6" />}
          </Button>
          
          <Button
            size="lg"
            variant={isScreenSharing ? "default" : "secondary"}
            onClick={toggleScreenShare}
            className="rounded-full w-14 h-14"
            disabled={!isConnected}
          >
            {isScreenSharing ? <MonitorOff className="h-6 w-6" /> : <Monitor className="h-6 w-6" />}
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
  );
}