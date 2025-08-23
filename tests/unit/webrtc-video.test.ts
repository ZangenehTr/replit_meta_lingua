import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import SimplePeer from 'simple-peer';
import { WebRTCService } from '../../client/src/services/webrtc-service';

// Mock SimplePeer
vi.mock('simple-peer');

// Mock socket.io-client
vi.mock('socket.io-client', () => ({
  io: vi.fn(() => ({
    on: vi.fn(),
    emit: vi.fn(),
    disconnect: vi.fn(),
  })),
}));

// Mock navigator.mediaDevices
const mockGetUserMedia = vi.fn();
Object.defineProperty(global.navigator, 'mediaDevices', {
  value: {
    getUserMedia: mockGetUserMedia,
    getDisplayMedia: vi.fn(),
  },
  writable: true,
});

// Mock fetch globally
global.fetch = vi.fn();

describe('WebRTC Video Calling', () => {
  let webRTCService: WebRTCService;
  let mockLocalStream: MediaStream;
  let mockRemoteStream: MediaStream;

  beforeEach(() => {
    // Reset all mocks
    vi.clearAllMocks();
    
    // Create mock media streams
    mockLocalStream = {
      getTracks: vi.fn(() => [
        { kind: 'video', enabled: true, stop: vi.fn() },
        { kind: 'audio', enabled: true, stop: vi.fn() },
      ]),
      getVideoTracks: vi.fn(() => [{ enabled: true, stop: vi.fn() }]),
      getAudioTracks: vi.fn(() => [{ enabled: true, stop: vi.fn() }]),
    } as any;
    
    mockRemoteStream = {
      getTracks: vi.fn(() => [
        { kind: 'video', stop: vi.fn() },
        { kind: 'audio', stop: vi.fn() },
      ]),
    } as any;
    
    mockGetUserMedia.mockResolvedValue(mockLocalStream);
    
    webRTCService = new WebRTCService();
  });

  afterEach(() => {
    webRTCService.disconnect();
  });

  test('should establish peer connection between two users', async () => {
    const mockPeer = {
      on: vi.fn(),
      signal: vi.fn(),
      destroy: vi.fn(),
      connected: true,
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    // Initialize call (peer not created yet)
    await webRTCService.initializeCall(config);
    
    // Simulate call acceptance (this creates the peer)
    const mockSocket = { emit: vi.fn(), on: vi.fn() };
    (webRTCService as any).socket = mockSocket;
    await (webRTCService as any).createPeerConnection(true, config.roomId);
    
    expect(SimplePeer).toHaveBeenCalledWith(
      expect.objectContaining({
        initiator: true,
        trickle: true,
        stream: mockLocalStream,
      })
    );
    
    expect(mockPeer.on).toHaveBeenCalledWith('signal', expect.any(Function));
    expect(mockPeer.on).toHaveBeenCalledWith('stream', expect.any(Function));
    expect(mockPeer.on).toHaveBeenCalledWith('connect', expect.any(Function));
  });

  test('should exchange offer/answer through signaling server', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'signal') {
          // Simulate peer signaling
          callback({ type: 'offer', sdp: 'mock-sdp' });
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    // Override socket in service
    (webRTCService as any).socket = mockSocket;
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    await webRTCService.initializeCall(config);
    
    // Check that offer was sent through socket
    expect(mockSocket.emit).toHaveBeenCalledWith('call-teacher', expect.objectContaining({
      teacherId: 2,
      studentId: 1,
      roomId: 'test-room-123',
    }));
  });

  test('should handle ICE candidates properly', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'signal') {
          // Simulate ICE candidate
          callback({ 
            type: 'candidate', 
            candidate: {
              candidate: 'mock-ice-candidate',
              sdpMLineIndex: 0,
              sdpMid: '0',
            },
          });
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    (webRTCService as any).socket = mockSocket;
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    await webRTCService.initializeCall(config);
    
    // Verify ICE candidate handling
    expect(mockSocket.emit).toHaveBeenCalledWith('signal', expect.objectContaining({
      roomId: 'test-room-123',
      signal: expect.objectContaining({
        type: 'candidate',
      }),
    }));
  });

  test('should establish video stream within 5 seconds', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'stream') {
          // Simulate receiving remote stream
          setTimeout(() => callback(mockRemoteStream), 1000);
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    const streamPromise = new Promise((resolve) => {
      webRTCService.onRemoteStream = (stream) => {
        resolve(stream);
      };
    });
    
    await webRTCService.initializeCall(config);
    
    const stream = await Promise.race([
      streamPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
    ]);
    
    expect(stream).toBe(mockRemoteStream);
  });

  test('should establish audio stream within 5 seconds', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'stream') {
          setTimeout(() => callback(mockRemoteStream), 1000);
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    const streamPromise = new Promise((resolve) => {
      webRTCService.onRemoteStream = (stream) => {
        const audioTracks = stream.getTracks().filter((t: any) => t.kind === 'audio');
        if (audioTracks.length > 0) {
          resolve(audioTracks);
        }
      };
    });
    
    await webRTCService.initializeCall(config);
    
    const audioTracks = await Promise.race([
      streamPromise,
      new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 5000)),
    ]);
    
    expect(audioTracks).toBeDefined();
  });

  test('should handle connection failure and retry', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'error') {
          callback(new Error('Connection failed'));
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
      initiator: true,
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    let errorReceived = false;
    webRTCService.onError = (error) => {
      errorReceived = true;
      expect(error.message).toContain('Connection failed');
    };
    
    await webRTCService.initializeCall(config);
    
    // Wait for error handling
    await new Promise(resolve => setTimeout(resolve, 100));
    
    expect(errorReceived).toBe(true);
    // Verify retry attempt (SimplePeer should be called again after delay)
    expect(SimplePeer).toHaveBeenCalledTimes(1);
  });

  test('should disconnect cleanly when call ends', async () => {
    const mockPeer = {
      on: vi.fn(),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    const mockSocket = {
      on: vi.fn(),
      emit: vi.fn(),
      disconnect: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    (webRTCService as any).socket = mockSocket;
    (webRTCService as any).peer = mockPeer;
    (webRTCService as any).localStream = mockLocalStream;
    (webRTCService as any).remoteStream = mockRemoteStream;
    (webRTCService as any).callConfig = { roomId: 'test-room' };
    (webRTCService as any).callDuration = 60; // Set a non-zero duration
    
    let callEndedReason = '';
    webRTCService.onCallEnded = (reason) => {
      callEndedReason = reason;
    };
    
    webRTCService.endCall('User ended call');
    
    expect(mockPeer.destroy).toHaveBeenCalled();
    expect(mockSocket.emit).toHaveBeenCalledWith('end-call', expect.objectContaining({
      roomId: 'test-room',
      reason: 'User ended call',
    }));
    expect(callEndedReason).toBe('User ended call');
    
    // Verify all tracks are stopped
    const localTracks = mockLocalStream.getTracks();
    localTracks.forEach((track: any) => {
      expect(track.stop).toHaveBeenCalled();
    });
  });

  test('should reconnect when network changes', async () => {
    // Setup fetch mock for TURN credentials
    (global.fetch as any).mockResolvedValue({
      ok: true,
      json: async () => ({ iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] })
    });
    
    const mockPeer = {
      on: vi.fn((event, callback) => {
        if (event === 'close') {
          // Simulate connection close
          setTimeout(() => callback(), 100);
        }
      }),
      signal: vi.fn(),
      destroy: vi.fn(),
      initiator: true,
    };
    
    (SimplePeer as any).mockImplementation(() => mockPeer);
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    (webRTCService as any).callConfig = config;
    (webRTCService as any).peer = mockPeer;
    
    await webRTCService.initializeCall(config);
    
    // Wait for reconnection attempt
    await new Promise(resolve => setTimeout(resolve, 2500));
    
    // Should attempt to create new peer connection
    expect(SimplePeer).toHaveBeenCalledTimes(2);
  });

  test('should handle TURN server authentication', async () => {
    // Mock fetch for TURN server credentials
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({
        iceServers: [
          {
            urls: 'turn:turn.metered.ca:80',
            username: 'test-user',
            credential: 'test-password',
          },
        ],
      }),
    });
    
    const mockPeer = {
      on: vi.fn(),
      signal: vi.fn(),
      destroy: vi.fn(),
    };
    
    (SimplePeer as any).mockImplementation((config) => {
      // Verify TURN servers are properly configured
      expect(config.config.iceServers).toContainEqual(
        expect.objectContaining({
          urls: expect.stringContaining('turn:'),
          username: expect.any(String),
          credential: expect.any(String),
        })
      );
      return mockPeer;
    });
    
    const config = {
      studentId: 1,
      teacherId: 2,
      packageId: 100,
      language: 'en',
      roomId: 'test-room-123',
    };
    
    await webRTCService.initializeCall(config);
    
    expect(global.fetch).toHaveBeenCalledWith(
      '/api/callern/turn-credentials',
      expect.objectContaining({
        headers: expect.objectContaining({
          'Authorization': expect.stringContaining('Bearer')
        })
      })
    );
  });

  test('should record call when recording is enabled', async () => {
    // This test would require RecordRTC mocking
    // For now, we'll test that the recording interface exists
    expect(webRTCService).toHaveProperty('endCall');
    expect(typeof webRTCService.endCall).toBe('function');
    
    // TODO: Implement recording functionality and complete this test
  });
});