import SimplePeer from '@/lib/simple-peer-wrapper';
import { io, Socket } from 'socket.io-client';
import RecordRTC from 'recordrtc';

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

interface QualityMetrics {
  bitrate: number;
  packetsLost: number;
  roundTripTime: number;
  jitter: number;
  connectionState: string;
  bandwidth: number;
  frameRate: number;
  resolution: { width: number; height: number };
  timestamp: number;
}

interface AdaptiveBitrateConfig {
  enabled: boolean;
  minBitrate: number;
  maxBitrate: number;
  targetBitrate: number;
  adaptationInterval: number;
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
  
  // Attendance tracking properties
  private callStartTime: Date | null = null;
  private attendanceTracked = false;
  private sessionId: number | null = null;
  
  // Recording properties
  private recorder: RecordRTC | null = null;
  private isRecording = false;
  private recordedChunks: Blob[] = [];
  
  // Quality monitoring properties
  private qualityMetrics: QualityMetrics | null = null;
  private qualityMonitoringInterval: NodeJS.Timeout | null = null;
  private previousStats: Map<string, any> = new Map(); // Store previous stats for delta calculation
  private adaptiveBitrateConfig: AdaptiveBitrateConfig = {
    enabled: true,
    minBitrate: 250000, // 250kbps
    maxBitrate: 2500000, // 2.5Mbps
    targetBitrate: 1000000, // 1Mbps
    adaptationInterval: 2000 // 2 seconds
  };
  private lastBitrateAdjustment = 0;
  private bitrateStable = 0; // Counter for stable conditions before increasing
  
  // Event callbacks
  public onLocalStream: ((stream: MediaStream) => void) | null = null;
  public onRemoteStream: ((stream: MediaStream) => void) | null = null;
  public onCallEnded: ((reason: string) => void) | null = null;
  public onConnectionStateChange: ((state: string) => void) | null = null;
  public onDurationUpdate: ((seconds: number) => void) | null = null;
  public onError: ((error: Error) => void) | null = null;
  public onRecordingStatusChange: ((isRecording: boolean) => void) | null = null;
  public onQualityUpdate: ((metrics: QualityMetrics) => void) | null = null;
  public onBitrateAdjustment: ((newBitrate: number, reason: string) => void) | null = null;
  public onAttendanceUpdate: ((data: { joinTime: Date; status: 'joined' | 'left' }) => void) | null = null;

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

    this.socket.on('call-accepted', async (data: any) => {
      console.log('Call accepted:', data);
      // Only create peer if not already created
      if (!this.peer) {
        await this.createPeerConnection(true, data.roomId);
      }
    });

    this.socket.on('call-rejected', (data: any) => {
      console.log('Call rejected:', data);
      this.endCall('Call rejected by teacher');
    });

    this.socket.on('signal', (data: any) => {
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

  public async initializeCall(config: CallConfig, sessionId?: number): Promise<void> {
    this.callConfig = config;
    this.sessionId = sessionId || null;
    
    try {
      // Get user media
      await this.getUserMedia();
      
      // Start attendance tracking
      this.startAttendanceTracking();
      
      // Join room
      this.socket?.emit('join-room', {
        roomId: config.roomId,
        userId: config.studentId,
        role: 'student',
      });
      
      // Send call request to teacher (peer will be created after acceptance)
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

  private startAttendanceTracking(): void {
    this.callStartTime = new Date();
    this.attendanceTracked = false;
    
    // Track that user joined the call
    this.onAttendanceUpdate?.({
      joinTime: this.callStartTime,
      status: 'joined'
    });

    // Auto-mark attendance as present after 30 seconds of stable connection
    setTimeout(() => {
      if (this.peer && this.peer.connected && !this.attendanceTracked && this.sessionId) {
        this.markAutoAttendance('present');
      }
    }, 30000); // 30 seconds
  }

  private async markAutoAttendance(status: 'present' | 'late'): Promise<void> {
    if (!this.sessionId || this.attendanceTracked || !this.callConfig?.studentId) return;

    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/student/${this.callConfig.studentId}/arrival-departure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          eventType: 'arrival'
        })
      });

      if (response.ok) {
        this.attendanceTracked = true;
        console.log(`Auto-marked student arrival for session ${this.sessionId}`);
        
        this.onAttendanceUpdate?.({
          joinTime: this.callStartTime!,
          status: 'joined'
        });
      }
    } catch (error) {
      console.error('Failed to mark auto-attendance:', error);
    }
  }

  private async markDeparture(): Promise<void> {
    if (!this.sessionId || !this.attendanceTracked || !this.callConfig?.studentId) return;

    try {
      const response = await fetch(`/api/sessions/${this.sessionId}/student/${this.callConfig.studentId}/arrival-departure`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        },
        body: JSON.stringify({
          eventType: 'departure'
        })
      });

      if (response.ok) {
        console.log(`Auto-marked student departure for session ${this.sessionId}`);
        
        this.onAttendanceUpdate?.({
          joinTime: this.callStartTime!,
          status: 'left'
        });
      }
    } catch (error) {
      console.error('Failed to mark departure:', error);
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

      await this.createPeerConnection(false, callData.roomId);
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

  private async createPeerConnection(initiator: boolean, roomId: string) {
    // Fetch TURN credentials from the server
    let iceServers: RTCIceServer[] = [];
    
    try {
      const response = await fetch('/api/callern/turn-credentials', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        iceServers = data.iceServers;
        console.log('Using dynamic TURN servers:', iceServers.length);
      } else {
        console.warn('Failed to fetch TURN credentials, using fallback');
        // Fallback to basic STUN servers
        iceServers = [
          { urls: 'stun:stun.l.google.com:19302' },
          { urls: 'stun:stun1.l.google.com:19302' },
        ];
      }
    } catch (error) {
      console.error('Error fetching TURN credentials:', error);
      // Fallback to basic STUN servers
      iceServers = [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ];
    }

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
      
      // Start quality monitoring automatically
      if (!this.qualityMonitoringInterval) {
        this.startQualityMonitoring();
      }
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
      
      setTimeout(async () => {
        if (this.callConfig) {
          // Determine if we should be initiator based on role
          const wasInitiator = (this.peer as any)?.initiator || false;
          await this.createPeerConnection(wasInitiator, this.callConfig.roomId);
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

    // Mark departure if attendance was tracked
    this.markDeparture();

    // Stop timers and quality monitoring
    this.stopCallTimer();
    this.stopQualityMonitoring();

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

    // Reset quality monitoring state
    this.qualityMetrics = null;
    this.previousStats.clear();
    this.bitrateStable = 0;
    this.lastBitrateAdjustment = 0;

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

  // Recording methods
  async startRecording(): Promise<void> {
    if (this.isRecording || !this.localStream) {
      console.log('Cannot start recording: already recording or no stream');
      return;
    }

    try {
      // Create a combined stream with both local and remote audio/video
      const combinedStream = new MediaStream();
      
      // Add local stream tracks
      if (this.localStream) {
        this.localStream.getTracks().forEach(track => {
          combinedStream.addTrack(track);
        });
      }
      
      // Add remote stream tracks if available
      if (this.remoteStream) {
        this.remoteStream.getTracks().forEach(track => {
          // Only add if not already present (avoid duplicates)
          if (!combinedStream.getTracks().find(t => t.id === track.id)) {
            combinedStream.addTrack(track);
          }
        });
      }

      // Initialize RecordRTC with the combined stream
      this.recorder = new RecordRTC(combinedStream, {
        type: 'video',
        mimeType: 'video/webm',
        disableLogs: false,
        numberOfAudioChannels: 2,
        checkForInactiveTracks: false,
        recorderType: RecordRTC.MediaStreamRecorder,
        timeSlice: 1000 // Get data every second for better memory management
      });

      // Start recording
      this.recorder.startRecording();
      this.isRecording = true;
      this.recordedChunks = [];
      
      // Notify listeners
      if (this.onRecordingStatusChange) {
        this.onRecordingStatusChange(true);
      }
      
      console.log('Recording started successfully');
      
      // Emit recording status to other participant
      if (this.socket) {
        this.socket.emit('recording-status', {
          roomId: this.callConfig?.roomId,
          isRecording: true
        });
      }
    } catch (error) {
      console.error('Failed to start recording:', error);
      this.handleError(new Error('Failed to start recording'));
    }
  }

  async stopRecording(): Promise<Blob | null> {
    if (!this.isRecording || !this.recorder) {
      console.log('Not recording');
      return null;
    }

    return new Promise((resolve) => {
      if (!this.recorder) {
        resolve(null);
        return;
      }

      this.recorder.stopRecording(() => {
        const blob = this.recorder?.getBlob();
        
        // Clean up
        this.isRecording = false;
        this.recorder?.destroy();
        this.recorder = null;
        
        // Notify listeners
        if (this.onRecordingStatusChange) {
          this.onRecordingStatusChange(false);
        }
        
        console.log('Recording stopped, blob size:', blob?.size);
        
        // Emit recording status to other participant
        if (this.socket) {
          this.socket.emit('recording-status', {
            roomId: this.callConfig?.roomId,
            isRecording: false
          });
        }
        
        resolve(blob || null);
      });
    });
  }

  async downloadRecording(): Promise<void> {
    const blob = await this.stopRecording();
    if (!blob) {
      console.error('No recording to download');
      return;
    }

    // Create download link
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `callern-session-${Date.now()}.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    console.log('Recording downloaded');
  }

  async uploadRecording(): Promise<string | null> {
    const blob = await this.stopRecording();
    if (!blob) {
      console.error('No recording to upload');
      return null;
    }

    try {
      // Create form data for upload
      const formData = new FormData();
      formData.append('recording', blob, `session-${Date.now()}.webm`);
      formData.append('roomId', this.callConfig?.roomId || '');
      formData.append('studentId', String(this.callConfig?.studentId || ''));
      formData.append('teacherId', String(this.callConfig?.teacherId || ''));
      
      // Upload to server
      const response = await fetch('/api/callern/upload-recording', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to upload recording');
      }
      
      const data = await response.json();
      console.log('Recording uploaded successfully:', data.url);
      return data.url;
    } catch (error) {
      console.error('Failed to upload recording:', error);
      this.handleError(new Error('Failed to upload recording'));
      return null;
    }
  }

  getRecordingStatus(): boolean {
    return this.isRecording;
  }

  // Quality monitoring methods
  public startQualityMonitoring(): void {
    if (this.qualityMonitoringInterval) {
      clearInterval(this.qualityMonitoringInterval);
    }

    this.qualityMonitoringInterval = setInterval(() => {
      this.collectQualityMetrics();
    }, 1000); // Collect stats every second

    console.log('Quality monitoring started');
  }

  public stopQualityMonitoring(): void {
    if (this.qualityMonitoringInterval) {
      clearInterval(this.qualityMonitoringInterval);
      this.qualityMonitoringInterval = null;
    }
    console.log('Quality monitoring stopped');
  }

  private async collectQualityMetrics(): Promise<void> {
    if (!this.peer) return;

    try {
      const peerConnection = (this.peer as any)._pc as RTCPeerConnection;
      if (!peerConnection) return;

      const stats = await peerConnection.getStats();
      const metrics = this.parseWebRTCStats(stats);
      
      if (metrics) {
        this.qualityMetrics = metrics;
        this.onQualityUpdate?.(metrics);
        
        // Apply adaptive bitrate if enabled
        if (this.adaptiveBitrateConfig.enabled) {
          this.adjustBitrateBasedOnQuality(metrics);
        }
      }
    } catch (error) {
      console.error('Failed to collect quality metrics:', error);
    }
  }

  private parseWebRTCStats(stats: RTCStatsReport): QualityMetrics | null {
    let bitrate = 0;
    let packetsLostRatio = 0;
    let roundTripTime = 0;
    let jitter = 0;
    let bandwidth = 0;
    let frameRate = 0;
    let resolution = { width: 0, height: 0 };
    let connectionState = 'unknown';

    const timestamp = Date.now();

    for (const [id, report] of stats) {
      // Use outbound-rtp for our sent video data
      if (report.type === 'outbound-rtp' && report.mediaType === 'video') {
        const previousReport = this.previousStats.get(id);
        
        if (previousReport && report.timestamp && previousReport.timestamp) {
          // Calculate delta values for accurate bitrate
          const deltaTime = report.timestamp - previousReport.timestamp;
          const deltaBytes = (report.bytesSent || 0) - (previousReport.bytesSent || 0);
          
          if (deltaTime > 0) {
            bitrate = (deltaBytes * 8) / (deltaTime / 1000); // bits per second
          }
        }
        
        frameRate = report.framesPerSecond || 0;
        
        // Store current report for next calculation
        this.previousStats.set(id, {
          timestamp: report.timestamp,
          bytesSent: report.bytesSent,
          packetsSent: report.packetsSent
        });
      }
      
      // Use remote-inbound-rtp for packet loss from remote perspective
      if (report.type === 'remote-inbound-rtp' && report.mediaType === 'video') {
        packetsLostRatio = report.fractionLost || 0; // This is already a ratio (0-1)
        roundTripTime = report.roundTripTime || 0;
        jitter = report.jitter || 0;
      }
      
      // Get RTT from candidate pair as backup
      if (report.type === 'candidate-pair' && report.state === 'succeeded') {
        if (roundTripTime === 0) {
          roundTripTime = report.currentRoundTripTime || 0;
        }
        bandwidth = report.availableOutgoingBitrate || 0;
      }
      
      // Get connection state
      if (report.type === 'peer-connection') {
        connectionState = report.connectionState || 'unknown';
      }
      
      // Get video resolution from track stats
      if (report.type === 'track' && report.kind === 'video') {
        if (report.frameWidth && report.frameHeight) {
          resolution = { width: report.frameWidth, height: report.frameHeight };
        }
      }
    }

    // Convert packet loss ratio to percentage for easier understanding
    const packetsLostPercentage = packetsLostRatio * 100;

    return {
      bitrate: bitrate / 1000, // Convert to kbps for consistency
      packetsLost: packetsLostPercentage, // Now represents percentage
      roundTripTime: roundTripTime * 1000, // Convert to ms
      jitter: jitter * 1000, // Convert to ms
      connectionState,
      bandwidth,
      frameRate,
      resolution,
      timestamp
    };
  }

  private async adjustBitrateBasedOnQuality(metrics: QualityMetrics): Promise<void> {
    const now = Date.now();
    
    // Only adjust if enough time has passed since last adjustment
    if (now - this.lastBitrateAdjustment < this.adaptiveBitrateConfig.adaptationInterval) {
      return;
    }

    let newBitrate = this.adaptiveBitrateConfig.targetBitrate;
    let reason = '';

    // Adjust based on packet loss percentage (now correctly calculated)
    if (metrics.packetsLost > 5) { // > 5% packet loss
      newBitrate = Math.max(
        this.adaptiveBitrateConfig.targetBitrate * 0.7,
        this.adaptiveBitrateConfig.minBitrate
      );
      reason = `High packet loss: ${metrics.packetsLost.toFixed(1)}%`;
      this.bitrateStable = 0; // Reset stability counter
    }
    // Adjust based on round trip time
    else if (metrics.roundTripTime > 200) { // > 200ms
      newBitrate = Math.max(
        this.adaptiveBitrateConfig.targetBitrate * 0.8,
        this.adaptiveBitrateConfig.minBitrate
      );
      reason = `High latency: ${metrics.roundTripTime.toFixed(0)}ms`;
      this.bitrateStable = 0; // Reset stability counter
    }
    // Increase bitrate if connection is stable (with hysteresis)
    else if (metrics.packetsLost < 1 && metrics.roundTripTime < 100) {
      this.bitrateStable++;
      // Only increase after stable for several intervals to avoid oscillation
      if (this.bitrateStable >= 3) {
        newBitrate = Math.min(
          this.adaptiveBitrateConfig.targetBitrate * 1.1, // Smaller increase for stability
          this.adaptiveBitrateConfig.maxBitrate
        );
        reason = 'Stable connection, increasing quality';
        this.bitrateStable = 0; // Reset after adjustment
      } else {
        return; // Don't adjust yet, wait for more stability
      }
    } else {
      // Neutral conditions, reset stability counter
      this.bitrateStable = 0;
    }

    // Apply bitrate adjustment if changed significantly
    if (Math.abs(newBitrate - this.adaptiveBitrateConfig.targetBitrate) > 50000) { // 50kbps threshold
      await this.setBitrate(newBitrate);
      this.adaptiveBitrateConfig.targetBitrate = newBitrate;
      this.lastBitrateAdjustment = now;
      this.onBitrateAdjustment?.(newBitrate, reason);
      
      console.log(`Bitrate adjusted to ${(newBitrate / 1000).toFixed(0)}kbps: ${reason}`);
    }
  }

  private async setBitrate(targetBitrate: number): Promise<void> {
    if (!this.peer) return;

    try {
      const peerConnection = (this.peer as any)._pc as RTCPeerConnection;
      if (!peerConnection) return;

      const senders = peerConnection.getSenders();
      
      for (const sender of senders) {
        if (sender.track?.kind === 'video') {
          const params = sender.getParameters();
          
          // Ensure encodings array exists (required for some browsers)
          if (!params.encodings || params.encodings.length === 0) {
            params.encodings = [{}];
          }
          
          // Set bitrate limits
          params.encodings[0].maxBitrate = targetBitrate;
          
          // Also set frame rate limits for very low bitrates
          if (targetBitrate < 500000) { // < 500kbps
            params.encodings[0].maxFramerate = 15;
            params.encodings[0].scaleResolutionDownBy = 2;
          } else if (targetBitrate < 1000000) { // < 1Mbps
            params.encodings[0].maxFramerate = 24;
            params.encodings[0].scaleResolutionDownBy = 1.5;
          } else {
            // High quality settings
            params.encodings[0].maxFramerate = 30;
            params.encodings[0].scaleResolutionDownBy = 1;
          }
          
          await sender.setParameters(params);
        }
      }
    } catch (error) {
      console.warn('Failed to set bitrate, trying fallback method:', error);
      
      // Fallback: try to adjust video constraints
      if (this.localStream) {
        const videoTrack = this.localStream.getVideoTracks()[0];
        if (videoTrack) {
          try {
            const constraints: MediaTrackConstraints = {};
            
            if (targetBitrate < 500000) {
              constraints.width = { ideal: 480 };
              constraints.height = { ideal: 320 };
              constraints.frameRate = { ideal: 15 };
            } else if (targetBitrate < 1000000) {
              constraints.width = { ideal: 640 };
              constraints.height = { ideal: 480 };
              constraints.frameRate = { ideal: 24 };
            }
            
            if (Object.keys(constraints).length > 0) {
              await videoTrack.applyConstraints(constraints);
            }
          } catch (constraintError) {
            console.warn('Fallback constraint adjustment also failed:', constraintError);
          }
        }
      }
    }
  }

  // Public methods for quality management
  public setAdaptiveBitrateConfig(config: Partial<AdaptiveBitrateConfig>): void {
    this.adaptiveBitrateConfig = { ...this.adaptiveBitrateConfig, ...config };
    console.log('Adaptive bitrate config updated:', this.adaptiveBitrateConfig);
  }

  public getCurrentQualityMetrics(): QualityMetrics | null {
    return this.qualityMetrics;
  }

  public getConnectionQuality(): 'excellent' | 'good' | 'fair' | 'poor' | 'unknown' {
    if (!this.qualityMetrics) return 'unknown';
    
    const { packetsLost, roundTripTime, bitrate } = this.qualityMetrics;
    
    if (packetsLost === 0 && roundTripTime < 50 && bitrate > 500) {
      return 'excellent';
    } else if (packetsLost < 5 && roundTripTime < 100 && bitrate > 250) {
      return 'good';
    } else if (packetsLost < 15 && roundTripTime < 200 && bitrate > 100) {
      return 'fair';
    } else if (packetsLost < 30 && roundTripTime < 500) {
      return 'poor';
    } else {
      return 'poor';
    }
  }

  public async forceQualityAdjustment(quality: 'low' | 'medium' | 'high'): Promise<void> {
    const qualitySettings = {
      low: { bitrate: 250000, width: 480, height: 320 },
      medium: { bitrate: 750000, width: 720, height: 480 },
      high: { bitrate: 1500000, width: 1280, height: 720 }
    };

    const settings = qualitySettings[quality];
    await this.setBitrate(settings.bitrate);
    
    // Also adjust video resolution if possible
    if (this.localStream) {
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        try {
          await videoTrack.applyConstraints({
            width: { ideal: settings.width },
            height: { ideal: settings.height }
          });
        } catch (error) {
          console.warn('Failed to adjust video resolution:', error);
        }
      }
    }
    
    console.log(`Quality manually set to ${quality}`);
  }

  private handleError(error: Error) {
    console.error('WebRTC Error:', error);
    this.onError?.(error);
  }
}

// Export singleton instance
export const webRTCService = new WebRTCService();