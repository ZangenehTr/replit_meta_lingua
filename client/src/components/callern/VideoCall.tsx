import React, { useEffect, useRef, useState, useCallback } from 'react';
import SimplePeer from '@/lib/simple-peer-wrapper';
import { useSocket } from '@/hooks/use-socket';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  Monitor, MonitorOff, MessageSquare, HelpCircle,
  Volume2, VolumeX, Maximize2, Minimize2,
  User, Target, Clock, BookOpen, CheckCircle, AlertCircle,
  Circle, Square
} from 'lucide-react';
import { getSimplePeerConfig } from '../../../../shared/webrtc-config';
import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import { useQuery } from '@tanstack/react-query';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { ScoringOverlay } from './ScoringOverlay';

interface VideoCallProps {
  roomId: string;
  userId: number;
  role: 'student' | 'teacher';
  studentId?: number; // For teachers to know which student they're calling
  remoteSocketId?: string; // The remote peer's socket ID (for students, this is the teacher's socket ID)
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

export function VideoCall({ roomId, userId, role, studentId, remoteSocketId: propsRemoteSocketId, onCallEnd, onMinutesUpdate }: VideoCallProps) {
  const { t } = useTranslation(['callern']);
  const { socket } = useSocket();
  // Students already joined room in parent component, teachers need to join
  const [hasJoinedRoom, setHasJoinedRoom] = useState(role === 'student');
  
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
  const [isRecording, setIsRecording] = useState(false);
  const [callDuration, setCallDuration] = useState(0);
  const [remoteSocketId, setRemoteSocketId] = useState<string | null>(propsRemoteSocketId || null);
  const [showChat, setShowChat] = useState(false);
  const [showWordHelper, setShowWordHelper] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(role === 'teacher');
  
  // Scoring state - always show for educational purposes
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
    }
  });
  const [tlWarning, setTlWarning] = useState<string | undefined>();
  const [presenceData, setPresenceData] = useState({
    cameraOn: !isVideoOff,
    micOn: !isMuted
  });
  
  // Fetch student briefing for teachers
  const { data: briefing, isLoading: briefingLoading } = useQuery<StudentBriefing>({
    queryKey: ['/api/callern/student-briefing', studentId],
    enabled: role === 'teacher' && !!studentId,
  });
  
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
  const createPeer = useCallback(async (initiator: boolean, stream: MediaStream, targetSocketId: string) => {
    const peerConfig = await getSimplePeerConfig(initiator);
    
    const peer = new SimplePeer({
      ...peerConfig,
      stream,
      trickle: true, // Enable trickle ICE for faster connection
      reconnectTimer: 3000, // Attempt reconnection after 3 seconds
    });
    
    // Store target socket ID in closure to ensure it's available for all signals
    let peerTargetSocketId = targetSocketId;
    
    // Update target socket ID when needed
    (peer as any).updateTargetSocketId = (newSocketId: string) => {
      peerTargetSocketId = newSocketId;
      // Send any queued ICE candidates when target is updated
      if ((peer as any).queuedCandidates && (peer as any).queuedCandidates.length > 0) {
        const queued = (peer as any).queuedCandidates;
        (peer as any).queuedCandidates = [];
        queued.forEach((candidate: any) => {
          console.log('Sending queued ICE candidate to:', newSocketId);
          socket?.emit('ice-candidate', {
            roomId,
            candidate,
            to: newSocketId
          });
        });
      }
    };
    
    peer.on('signal', (signal) => {
      // Always use the stored target socket ID
      const targetId = peerTargetSocketId || remoteSocketId;
      
      if (!targetId || targetId === 'null' || targetId === null) {
        console.error('No valid target socket ID available for signal:', signal.type, 'targetId:', targetId);
        // Queue ICE candidates until we have a target
        if (signal.type !== 'offer' && signal.type !== 'answer') {
          // Store ICE candidates for later
          if (!(peer as any).queuedCandidates) {
            (peer as any).queuedCandidates = [];
          }
          (peer as any).queuedCandidates.push(signal);
          console.log('Queued ICE candidate for later delivery');
        }
        return;
      }
      
      // Send any queued ICE candidates first
      if ((peer as any).queuedCandidates && (peer as any).queuedCandidates.length > 0) {
        const queued = (peer as any).queuedCandidates;
        (peer as any).queuedCandidates = [];
        queued.forEach((candidate: any) => {
          console.log('Sending queued ICE candidate to:', targetId);
          socket?.emit('ice-candidate', {
            roomId,
            candidate,
            to: targetId
          });
        });
      }
      
      if (signal.type === 'offer') {
        console.log('Sending offer to:', targetId);
        socket?.emit('offer', {
          roomId,
          offer: signal,
          to: targetId
        });
      } else if (signal.type === 'answer') {
        console.log('Sending answer to:', targetId);
        socket?.emit('answer', {
          roomId,
          answer: signal,
          to: targetId
        });
      } else if (signal.candidate) {
        // ICE candidate
        console.log('Sending ICE candidate to:', targetId);
        socket?.emit('ice-candidate', {
          roomId,
          candidate: signal,
          to: targetId
        });
      } else {
        console.warn('Unknown signal type:', signal);
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
  }, [socket, roomId, remoteSocketId]);
  
  // Socket event handlers
  useEffect(() => {
    if (!socket) return;
    
    const handleUserJoined = async ({ userId: joinedUserId, socketId, role: joinedRole }: any) => {
      console.log('User joined:', { userId: joinedUserId, socketId, role: joinedRole });
      
      // Only connect if it's a different user
      if (joinedUserId !== userId) {
        setRemoteSocketId(socketId);
        
        // If we already have a peer that's waiting for a target, update it
        if (peerRef.current && (peerRef.current as any).updateTargetSocketId) {
          console.log('Updating existing peer target socket ID to:', socketId);
          (peerRef.current as any).updateTargetSocketId(socketId);
        }
        
        // Normalize roles for comparison
        const normalizedJoinedRole = joinedRole?.toLowerCase();
        const normalizedMyRole = role?.toLowerCase();
        
        // Teacher waits for student, student initiates for teacher
        if (normalizedMyRole === 'teacher' && normalizedJoinedRole === 'student') {
          console.log('Teacher: Student joined, waiting for offer');
          // Initialize media but don't create peer yet - wait for offer
          const stream = await initializeMedia();
          if (!stream) {
            console.error('Failed to initialize media for teacher');
          }
        } else if (normalizedMyRole === 'student' && normalizedJoinedRole === 'teacher') {
          console.log('Student: Teacher joined, initiating call with socket:', socketId);
          // Make sure we have a valid socket ID before creating peer
          if (!socketId || socketId === 'null') {
            console.error('Invalid teacher socket ID:', socketId);
            return;
          }
          const stream = await initializeMedia();
          if (stream && !peerRef.current) {
            // Small delay to ensure socket is ready
            setTimeout(async () => {
              if (!peerRef.current) {
                peerRef.current = await createPeer(true, stream, socketId);
              }
            }, 500); // Increased delay for stability
          }
        }
      }
    };
    
    const handleOffer = async ({ offer, from }: any) => {
      console.log('Received offer from:', from);
      setRemoteSocketId(from);
      
      // Don't create duplicate peer connections
      if (peerRef.current && !(peerRef.current as any).destroyed) {
        console.log('Peer already exists, ignoring duplicate offer');
        return;
      }
      
      const stream = await initializeMedia();
      if (stream) {
        const peer = await createPeer(false, stream, from);
        peer.signal(offer);
        peerRef.current = peer;
      }
    };
    
    const handleAnswer = ({ answer, from }: any) => {
      console.log('Received answer from:', from);
      if (!peerRef.current || peerRef.current.destroyed) {
        console.log('No peer or peer destroyed, ignoring answer');
        return;
      }
      
      // Ensure we have the correct remote socket ID
      if (from) {
        setRemoteSocketId(from);
        // Update peer's target socket ID
        if ((peerRef.current as any).updateTargetSocketId) {
          (peerRef.current as any).updateTargetSocketId(from);
        }
      }
      
      try {
        const pc = (peerRef.current as any)._pc;
        if (!pc) {
          console.log('No peer connection, ignoring answer');
          return;
        }
        
        const signalingState = pc.signalingState;
        console.log('Current signaling state:', signalingState);
        
        // Only process answer if we're expecting one
        if (signalingState === 'have-local-offer') {
          peerRef.current.signal(answer);
        } else if (signalingState === 'stable') {
          console.log('Peer already in stable state, ignoring duplicate answer');
        } else {
          console.log(`Unexpected signaling state: ${signalingState}, ignoring answer`);
        }
      } catch (error) {
        console.error('Error setting answer:', error);
      }
    };
    
    const handleIceCandidate = ({ candidate, from }: any) => {
      console.log('Received ICE candidate from:', from);
      if (peerRef.current && candidate) {
        try {
          // Check if the candidate has the required fields
          if (candidate.candidate || candidate.type === 'candidate') {
            peerRef.current.signal(candidate);
          } else {
            console.warn('Invalid ICE candidate format:', candidate);
          }
        } catch (error) {
          console.error('Error adding ICE candidate:', error);
        }
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
    
    // Scoring event handlers
    const handleScoringUpdate = (data: any) => {
      console.log('Scoring update:', data);
      if (data.role === 'student' && data.scores) {
        setScoringData(prev => ({ ...prev, student: data.scores }));
      } else if (data.role === 'teacher' && data.scores) {
        setScoringData(prev => ({ ...prev, teacher: data.scores }));
      }
    };
    
    const handleTLWarning = (data: any) => {
      console.log('TL warning:', data);
      setTlWarning(data.message);
      setTimeout(() => setTlWarning(undefined), 3000);
    };
    
    // Register event listeners
    socket.on('user-joined', handleUserJoined);
    socket.on('offer', handleOffer);
    socket.on('answer', handleAnswer);
    socket.on('ice-candidate', handleIceCandidate);
    socket.on('peer-video-toggle', handlePeerVideoToggle);
    socket.on('peer-audio-toggle', handlePeerAudioToggle);
    socket.on('scoring:update', handleScoringUpdate);
    socket.on('scoring:tl-warning', handleTLWarning);
    
    // For students, check if we're already in the room (joined from parent component)
    // For teachers, always join the room
    if (role === 'teacher' || !hasJoinedRoom) {
      console.log(`${role} joining room:`, roomId);
      socket.emit('join-room', { roomId, userId, role });
      setHasJoinedRoom(true);
    }
    
    return () => {
      socket.off('user-joined', handleUserJoined);
      socket.off('offer', handleOffer);
      socket.off('answer', handleAnswer);
      socket.off('ice-candidate', handleIceCandidate);
      socket.off('peer-video-toggle', handlePeerVideoToggle);
      socket.off('peer-audio-toggle', handlePeerAudioToggle);
      socket.off('scoring:update', handleScoringUpdate);
      socket.off('scoring:tl-warning', handleTLWarning);
    };
  }, [socket, roomId, userId, role, createPeer, initializeMedia, hasJoinedRoom]);
  
  // Initialize media on mount for both roles
  useEffect(() => {
    // Initialize media for both teacher and student
    // Teachers need media ready to respond to offers quickly
    initializeMedia().then((stream) => {
      if (stream) {
        console.log(`${role} media initialized successfully`);
      }
    });
    
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
  
  // For students who already have the teacher's socket ID from props
  useEffect(() => {
    if (role === 'student' && propsRemoteSocketId && !peerRef.current && socket) {
      console.log('Student: Have teacher socket ID from props, initiating call with:', propsRemoteSocketId);
      
      // Small delay to ensure socket is ready
      const timer = setTimeout(async () => {
        if (!peerRef.current) {
          const stream = await initializeMedia();
          if (stream) {
            peerRef.current = await createPeer(true, stream, propsRemoteSocketId);
          }
        }
      }, 500);
      
      return () => clearTimeout(timer);
    }
  }, [role, propsRemoteSocketId, socket, createPeer, initializeMedia]);
  
  // Control functions
  const toggleMute = async () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        // If track is currently disabled and we're enabling it
        if (!audioTrack.enabled) {
          // First check if we still have permission
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ audio: true });
            const newAudioTrack = newStream.getAudioTracks()[0];
            
            // Replace the old track with the new one
            localStreamRef.current.removeTrack(audioTrack);
            localStreamRef.current.addTrack(newAudioTrack);
            
            // Replace in peer connection if it exists
            if (peerRef.current && (peerRef.current as any)._pc) {
              const senders = (peerRef.current as any)._pc.getSenders();
              const audioSender = senders.find((s: any) => s.track?.kind === 'audio');
              if (audioSender) {
                audioSender.replaceTrack(newAudioTrack);
              }
            }
            
            setIsMuted(false);
            setPresenceData(prev => ({ ...prev, micOn: true }));
            socket?.emit('toggle-audio', { roomId, enabled: true });
            socket?.emit('scoring:presence', { roomId, userId, cameraOn: !isVideoOff, micOn: true });
          } catch (error) {
            console.error('Failed to re-enable microphone:', error);
            alert(t('callern:errors.microphoneAccess'));
          }
        } else {
          // Simply disable the track
          audioTrack.enabled = false;
          setIsMuted(true);
          setPresenceData(prev => ({ ...prev, micOn: false }));
          socket?.emit('toggle-audio', { roomId, enabled: false });
          socket?.emit('scoring:presence', { roomId, userId, cameraOn: !isVideoOff, micOn: false });
        }
      }
    }
  };
  
  const toggleVideo = async () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        // If track is currently disabled and we're enabling it
        if (!videoTrack.enabled) {
          // First check if we still have permission
          try {
            const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
            const newVideoTrack = newStream.getVideoTracks()[0];
            
            // Replace the old track with the new one
            localStreamRef.current.removeTrack(videoTrack);
            localStreamRef.current.addTrack(newVideoTrack);
            
            // Update local video element
            if (localVideoRef.current) {
              localVideoRef.current.srcObject = localStreamRef.current;
            }
            
            // Replace in peer connection if it exists
            if (peerRef.current && (peerRef.current as any)._pc) {
              const senders = (peerRef.current as any)._pc.getSenders();
              const videoSender = senders.find((s: any) => s.track?.kind === 'video');
              if (videoSender) {
                videoSender.replaceTrack(newVideoTrack);
              }
            }
            
            setIsVideoOff(false);
            setPresenceData(prev => ({ ...prev, cameraOn: true }));
            socket?.emit('toggle-video', { roomId, enabled: true });
            socket?.emit('scoring:presence', { roomId, userId, cameraOn: true, micOn: !isMuted });
          } catch (error) {
            console.error('Failed to re-enable camera:', error);
            alert(t('callern:errors.cameraAccess'));
          }
        } else {
          // Simply disable the track
          videoTrack.enabled = false;
          setIsVideoOff(true);
          setPresenceData(prev => ({ ...prev, cameraOn: false }));
          socket?.emit('toggle-video', { roomId, enabled: false });
          socket?.emit('scoring:presence', { roomId, userId, cameraOn: false, micOn: !isMuted });
        }
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

  const toggleRecording = async () => {
    try {
      // Import webRTCService dynamically to access recording methods
      const { webRTCService } = await import('../../services/webrtc-service');
      
      if (!isRecording) {
        // Start recording
        await webRTCService.startRecording();
        setIsRecording(true);
        console.log('Recording started');
      } else {
        // Stop and download recording
        await webRTCService.downloadRecording();
        setIsRecording(false);
        console.log('Recording stopped and downloaded');
      }
    } catch (error) {
      console.error('Recording error:', error);
    }
  };
  
  return (
    <div className="flex h-screen bg-gray-900">
      {/* Student Briefing Panel for Teachers */}
      {role === 'teacher' && showBriefing && (
        <div className="w-96 bg-white border-r overflow-hidden flex flex-col">
          <div className="p-4 border-b flex items-center justify-between">
            <h3 className="font-semibold">{t('callern:studentBriefing')}</h3>
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
                {/* Student Profile */}
                <div>
                  <h4 className="font-medium mb-2 flex items-center gap-2">
                    <User className="h-4 w-4" />
                    {t('callern:studentProfile')}
                  </h4>
                  <div className="bg-gray-50 rounded-lg p-3 space-y-2">
                    <p className="font-medium">{briefing.profile?.firstName} {briefing.profile?.lastName}</p>
                    <p className="text-sm text-gray-600">{briefing.profile?.email}</p>
                    <div className="flex gap-2 mt-2">
                      <Badge variant="secondary">{briefing.profile?.currentLevel || 'A1'}</Badge>
                      <Badge variant="outline">{briefing.profile?.targetLanguage || 'English'}</Badge>
                    </div>
                    {briefing.profile?.learningGoals && (
                      <p className="text-sm mt-2">{briefing.profile.learningGoals}</p>
                    )}
                  </div>
                </div>

                {/* Current Package & Roadmap */}
                {briefing.currentPackage && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Target className="h-4 w-4" />
                      {t('callern:currentPackage')}
                    </h4>
                    <div className="bg-blue-50 rounded-lg p-3">
                      <p className="font-medium">{briefing.currentPackage.packageName}</p>
                      <p className="text-sm text-gray-600 mt-1">
                        {briefing.currentPackage.roadmapName || 'No roadmap assigned'}
                      </p>
                      <div className="mt-2">
                        <div className="flex justify-between text-sm mb-1">
                          <span>{t('callern:timeUsed')}</span>
                          <span>{Math.round(briefing.currentPackage.usedMinutes / 60)}h / {briefing.currentPackage.totalHours}h</span>
                        </div>
                        <Progress 
                          value={(briefing.currentPackage.usedMinutes / (briefing.currentPackage.totalHours * 60)) * 100} 
                        />
                      </div>
                    </div>
                  </div>
                )}

                {/* Roadmap Progress */}
                {briefing.roadmapProgress && briefing.roadmapProgress.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <BookOpen className="h-4 w-4" />
                      {t('callern:roadmapProgress')}
                    </h4>
                    <div className="space-y-2">
                      {briefing.roadmapProgress.slice(0, 5).map((step: any) => (
                        <div key={step.id} className="flex items-center gap-2 p-2 bg-gray-50 rounded">
                          {step.status === 'completed' ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <AlertCircle className="h-4 w-4 text-yellow-600" />
                          )}
                          <div className="flex-1">
                            <p className="text-sm font-medium">Step {step.stepNumber}: {step.stepTitle}</p>
                            {step.teacherName && (
                              <p className="text-xs text-gray-500">by {step.teacherName}</p>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Past Lessons */}
                {briefing.pastLessons && briefing.pastLessons.length > 0 && (
                  <div>
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      {t('callern:recentLessons')}
                    </h4>
                    <div className="space-y-2">
                      {briefing.pastLessons.map((lesson: any) => (
                        <div key={lesson.id} className="bg-gray-50 rounded p-2">
                          <div className="flex justify-between items-start">
                            <div>
                              <p className="text-sm font-medium">{lesson.teacherName}</p>
                              <p className="text-xs text-gray-500">
                                {new Date(lesson.startTime).toLocaleDateString()} - {lesson.durationMinutes} min
                              </p>
                            </div>
                          </div>
                          {lesson.notes && (
                            <p className="text-sm mt-1 text-gray-600">{lesson.notes}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Performance Metrics */}
                {briefing.recentPerformance && (
                  <div>
                    <h4 className="font-medium mb-2">{t('callern:recentPerformance')}</h4>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">{t('callern:last30Days')}</p>
                        <p className="text-lg font-medium">{briefing.recentPerformance.sessionsLast30Days} sessions</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-xs text-gray-500">{t('callern:avgSessionLength')}</p>
                        <p className="text-lg font-medium">{briefing.recentPerformance.averageSessionLength} min</p>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>
          ) : null}
        </div>
      )}

      {/* Main Video Call Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 bg-gray-800 border-b border-gray-700">
          <div className="flex items-center gap-4">
            {role === 'teacher' && !showBriefing && (
              <Button
                size="sm"
                variant="ghost"
                onClick={() => setShowBriefing(true)}
                className="text-white hover:bg-gray-700"
              >
                <User className="h-4 w-4 mr-2" />
                {t('callern:showBriefing')}
              </Button>
            )}
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
            {/* Test Scoring Button */}
            <Button
              size="sm"
              variant="ghost"
              onClick={() => {
                // Request scoring update from server
                socket?.emit('scoring:request-update', { roomId });
              }}
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
              {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      
      {/* Video Area */}
      <div className="flex-1 relative overflow-hidden bg-gray-900">
        {/* Remote Video (Main) - Better sizing for education */}
        <div className="w-full h-full flex items-center justify-center">
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-contain"
            style={{ maxHeight: 'calc(100vh - 200px)' }}
          />
        </div>
        
        {/* Local Video (PiP) - Larger for educational purposes */}
        <div className="absolute bottom-4 right-4 w-80 h-60 bg-gray-800 rounded-lg overflow-hidden shadow-2xl border-2 border-gray-600 transition-all hover:scale-105">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover"
          />
          {isVideoOff && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
              <VideoOff className="h-12 w-12 text-gray-400" />
            </div>
          )}
          {/* Label for local video */}
          <div className="absolute top-2 left-2 px-2 py-1 bg-black/50 rounded text-xs text-white font-medium">
            {role === 'teacher' ? 'You (Teacher)' : 'You (Student)'}
          </div>
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
        
        {/* Scoring Overlay - Enhanced visibility */}
        <div className="absolute inset-0 pointer-events-none" style={{ zIndex: 50 }}>
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
            variant={isRecording ? "destructive" : "secondary"}
            onClick={toggleRecording}
            className="rounded-full w-14 h-14"
            disabled={!isConnected}
            title={isRecording ? "Stop Recording" : "Start Recording"}
          >
            {isRecording ? <Square className="h-6 w-6" /> : <Circle className="h-6 w-6 text-red-500" />}
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