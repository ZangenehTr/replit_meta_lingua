import SimplePeer from 'simple-peer';
import { io, Socket } from 'socket.io-client';

interface CallConfig {
  studentId: number;
  teacherId: number;
  packageId: number;
  language: string;
  roomId: string;
}

interface SignalData {
  type: string;
  data: any;
}

export class WebRTCService {
  private socket: Socket | null = null;
  private peer: SimplePeer.Instance | null = null;
  private localStream: MediaStream | null = null;
  private remoteStream: MediaStream | null = null;
  private callConfig: CallConfig | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private callDuration = 0;
  private callTimer: NodeJS.Timeout | null = null;
  
  // Event callbacks
  public onLocalStream: ((stream: MediaStream) => void) | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onCallEnded: ((reason: string) => void) | null = null;
  public onConnectionStateChange: ((state: string) => void) | null = null;
  public onDurationUpdate: ((seconds: number) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;

  constructor() {
    this.initializeSocket();
  }

  private initializeSocket() {
    // Connect to the WebSocket server
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    const wsUrl = `${protocol}//${window.location.host}`;
    
    this.socket = io(wsUrl, {
      path: '/socket.io',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: this.maxReconnectAttempts,
      reconnectionDelay: 1000,
    });

    this.setupSocketListeners();
  }

  private setupSocketListeners() {
    if (!this.socket) return;

    this.socket.on('connect', () => {
      console.log('WebSocket connected');
      this.onConnectionStateChange?.('connected');
      this.reconnectAttempts = 0;
    });

    this.socket.on('disconnect', () => {
      console.log('WebSocket disconnected');
      this.onConnectionStateChange?.('disconnected');
      this.handleDisconnection();
    });

    this.socket.on('call-request', (data: any) => {
      console.log('Incoming call request:', data);
      this.handleIncomingCall(data);
    });

    this.socket.on('call-accepted', (data: any) => {
      console.log('Call accepted:', data);
      this.createPeerConnection(true, data.roomId);
    });

    this.socket.on('call-rejected', (data: any) => {
      console.log('Call rejected:', data);
      this.endCall('Call rejected by teacher');
    });

    this.socket.on('signal', (data: SignalData) => {
      console.log('Received signal:', data.type);
      if (this.peer) {
        this.peer.signal(data);
      }
    });

    this.socket.on('call-ended', (data: any) => {
      console.log('Call ended by remote:', data);
      this.endCall(data.reason || 'Call ended by other party');
    });

    this.socket.on('error', (error: any) => {
      console.error('Socket error:', error);
      this.onError?.(new Error(error.message || 'Socket connection error'));
    });
  }

  public async initializeCall(config: CallConfig): Promise<void> {
    this.callConfig = config;
    
    try {
      // Get user media
      await this.getUserMedia();
      
      // Join room
      this.socket?.emit('join-room', {
        roomId: config.roomId,
        userId: config.studentId,
        role: 'student',
      });

      // Send call request to teacher
      this.socket?.emit('call-teacher', {
        teacherId: config.teacherId,
        studentId: config.studentId,
        packageId: config.packageId,
        language: config.language,
        roomId: config.roomId,
      });

      this.onConnectionStateChange?.('calling');
    } catch (error) {
      console.error('Failed to initialize call:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  public async acceptCall(callData: any): Promise<void> {
    this.callConfig = callData;
    
    try {
      await this.getUserMedia();
      
      this.socket?.emit('accept-call', {
        roomId: callData.roomId,
        teacherId: callData.teacherId,
        studentId: callData.studentId,
      });

      this.createPeerConnection(false, callData.roomId);
      this.startCallTimer();
    } catch (error) {
      console.error('Failed to accept call:', error);
      this.onError?.(error as Error);
      throw error;
    }
  }

  public rejectCall(callData: any) {
    this.socket?.emit('reject-call', {
      roomId: callData.roomId,
      reason: 'Teacher unavailable',
    });
  }

  private async getUserMedia(): Promise<void> {
    try {
      const constraints = {
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 },
          facingMode: 'user',
        },
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      };

      this.localStream = await navigator.mediaDevices.getUserMedia(constraints);
      this.onLocalStream?.(this.localStream);
    } catch (error) {
      console.error('Failed to get user media:', error);
      throw new Error('Camera/microphone access denied');
    }
  }

  private createPeerConnection(initiator: boolean, roomId: string) {
    const iceServers = [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' },
      {
        urls: 'turn:openrelay.metered.ca:80',
        username: 'openrelayproject',
        credential: 'openrelayproject',
      },
    ];

    this.peer = new SimplePeer({
      initiator,
      trickle: true,
      stream: this.localStream || undefined,
      config: {
        iceServers,
      },
    });

    this.peer.on('signal', (data: any) => {
      console.log('Sending signal:', data.type);
      this.socket?.emit('signal', {
        roomId,
        signal: data,
      });
    });

    this.peer.on('stream', (stream: MediaStream) => {
      console.log('Received remote stream');
      this.remoteStream = stream;
      this.onRemoteStream?.(stream);
      this.startCallTimer();
    });

    this.peer.on('connect', () => {
      console.log('Peer connected');
      this.onConnectionStateChange?.('connected');
    });

    this.peer.on('close', () => {
      console.log('Peer connection closed');
      this.handleDisconnection();
    });

    this.peer.on('error', (error: Error) => {
      console.error('Peer error:', error);
      this.onError?.(error);
      this.handlePeerError(error);
    });
  }

  private handleIncomingCall(data: any) {
    // This would be handled by the teacher's UI
    // For now, we'll just log it
    console.log('Incoming call from student:', data);
  }

  private handleDisconnection() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
      
      setTimeout(() => {
        if (this.callConfig && this.peer) {
          this.createPeerConnection(this.peer.initiator, this.callConfig.roomId);
        }
      }, 2000);
    } else {
      this.endCall('Connection lost');
    }
  }

  private handlePeerError(error: Error) {
    // Handle specific peer errors
    if (error.message.includes('Connection failed')) {
      this.handleDisconnection();
    } else {
      this.endCall('Technical error occurred');
    }
  }

  private startCallTimer() {
    if (this.callTimer) return;

    this.callTimer = setInterval(() => {
      this.callDuration++;
      this.onDurationUpdate?.(this.callDuration);
      
      // Check if we need to update the backend about duration
      if (this.callDuration % 60 === 0) {
        this.updateCallDuration();
      }
    }, 1000);
  }

  private stopCallTimer() {
    if (this.callTimer) {
      clearInterval(this.callTimer);
      this.callTimer = null;
    }
  }

  private updateCallDuration() {
    if (!this.callConfig) return;

    this.socket?.emit('update-duration', {
      roomId: this.callConfig.roomId,
      duration: this.callDuration,
    });
  }

  public toggleVideo(): boolean {
    if (!this.localStream) return false;

    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
      return videoTrack.enabled;
    }
    return false;
  }

  public toggleAudio(): boolean {
    if (!this.localStream) return false;

    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
      return audioTrack.enabled;
    }
    return false;
  }

  public async shareScreen(): Promise<void> {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({
        video: true,
        audio: false,
      });

      const videoTrack = screenStream.getVideoTracks()[0];
      
      if (this.peer && this.localStream) {
        const sender = (this.peer as any)._pc
          .getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }

        videoTrack.onended = () => {
          this.stopScreenShare();
        };
      }
    } catch (error) {
      console.error('Failed to share screen:', error);
      this.onError?.(error as Error);
    }
  }

  public stopScreenShare() {
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      
      if (this.peer && videoTrack) {
        const sender = (this.peer as any)._pc
          .getSenders()
          .find((s: RTCRtpSender) => s.track?.kind === 'video');
        
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }
    }
  }

  public endCall(reason: string = 'User ended call') {
    console.log('Ending call:', reason);

    // Stop timers
    this.stopCallTimer();

    // Update backend with final duration
    if (this.callConfig && this.callDuration > 0) {
      this.socket?.emit('end-call', {
        roomId: this.callConfig.roomId,
        duration: this.callDuration,
        reason,
      });
    }

    // Clean up streams
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
      this.localStream = null;
    }

    if (this.remoteStream) {
      this.remoteStream.getTracks().forEach(track => track.stop());
      this.remoteStream = null;
    }

    // Clean up peer connection
    if (this.peer) {
      this.peer.destroy();
      this.peer = null;
    }

    // Reset state
    this.callConfig = null;
    this.callDuration = 0;
    this.reconnectAttempts = 0;

    // Notify UI
    this.onCallEnded?.(reason);
    this.onConnectionStateChange?.('ended');
  }

  public getCallDuration(): number {
    return this.callDuration;
  }

  public getConnectionState(): string {
    if (!this.peer) return 'disconnected';
    return (this.peer as any).connected ? 'connected' : 'connecting';
  }

  public disconnect() {
    this.endCall('Service disconnected');
    
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();