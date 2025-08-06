import { useState, useEffect, useCallback, useRef } from 'react';
import { webRTCService } from '@/services/webrtc-service';
import { useToast } from '@/hooks/use-toast';

interface UseWebRTCOptions {
  onCallEnded?: (reason: string) => void;
  onConnectionStateChange?: (state: string) => void;
}

export function useWebRTC(options: UseWebRTCOptions = {}) {
  const { toast } = useToast();
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [connectionState, setConnectionState] = useState<string>('disconnected');
  const [callDuration, setCallDuration] = useState<number>(0);
  const [isVideoEnabled, setIsVideoEnabled] = useState<boolean>(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState<boolean>(true);
  const [isScreenSharing, setIsScreenSharing] = useState<boolean>(false);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    // Set up WebRTC event handlers
    webRTCService.onLocalStream = (stream) => {
      setLocalStream(stream);
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    };

    webRTCService.onRemoteStream = (stream) => {
      setRemoteStream(stream);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = stream;
      }
    };

    webRTCService.onCallEnded = (reason) => {
      setLocalStream(null);
      setRemoteStream(null);
      setConnectionState('ended');
      setCallDuration(0);
      options.onCallEnded?.(reason);
      
      toast({
        title: "Call Ended",
        description: reason,
      });
    };

    webRTCService.onConnectionStateChange = (state) => {
      setConnectionState(state);
      options.onConnectionStateChange?.(state);
    };

    webRTCService.onDurationUpdate = (seconds) => {
      setCallDuration(seconds);
    };

    webRTCService.onError = (error) => {
      console.error('WebRTC Error:', error);
      toast({
        title: "Connection Error",
        description: error.message,
        variant: "destructive",
      });
    };

    return () => {
      // Cleanup on unmount
      if (connectionState === 'connected' || connectionState === 'connecting') {
        webRTCService.endCall('Component unmounted');
      }
    };
  }, []);

  const initializeCall = useCallback(async (config: {
    studentId: number;
    teacherId: number;
    packageId: number;
    language: string;
    roomId: string;
  }) => {
    try {
      await webRTCService.initializeCall(config);
    } catch (error) {
      console.error('Failed to initialize call:', error);
      toast({
        title: "Call Failed",
        description: "Failed to start the call. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const acceptCall = useCallback(async (callData: any) => {
    try {
      await webRTCService.acceptCall(callData);
    } catch (error) {
      console.error('Failed to accept call:', error);
      toast({
        title: "Call Failed",
        description: "Failed to accept the call. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const rejectCall = useCallback((callData: any) => {
    webRTCService.rejectCall(callData);
  }, []);

  const toggleVideo = useCallback(() => {
    const enabled = webRTCService.toggleVideo();
    setIsVideoEnabled(enabled);
    return enabled;
  }, []);

  const toggleAudio = useCallback(() => {
    const enabled = webRTCService.toggleAudio();
    setIsAudioEnabled(enabled);
    return enabled;
  }, []);

  const shareScreen = useCallback(async () => {
    try {
      await webRTCService.shareScreen();
      setIsScreenSharing(true);
    } catch (error) {
      console.error('Failed to share screen:', error);
      toast({
        title: "Screen Share Failed",
        description: "Failed to share screen. Please try again.",
        variant: "destructive",
      });
    }
  }, [toast]);

  const stopScreenShare = useCallback(() => {
    webRTCService.stopScreenShare();
    setIsScreenSharing(false);
  }, []);

  const endCall = useCallback((reason?: string) => {
    webRTCService.endCall(reason || 'User ended call');
  }, []);

  const formatDuration = useCallback((seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  }, []);

  return {
    // Streams
    localStream,
    remoteStream,
    localVideoRef,
    remoteVideoRef,
    
    // State
    connectionState,
    callDuration,
    formattedDuration: formatDuration(callDuration),
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    
    // Actions
    initializeCall,
    acceptCall,
    rejectCall,
    toggleVideo,
    toggleAudio,
    shareScreen,
    stopScreenShare,
    endCall,
  };
}