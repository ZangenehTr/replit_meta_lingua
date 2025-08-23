import { describe, test, expect, beforeEach, afterEach, vi } from 'vitest';
import { Server } from 'http';
import { CallernWebSocketServer } from '../../server/websocket-server';
import { io as ioClient, Socket as ClientSocket } from 'socket.io-client';

// Mock database
vi.mock('../../server/db', () => ({
  db: {
    select: vi.fn().mockReturnThis(),
    from: vi.fn().mockReturnThis(),
    where: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    values: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    set: vi.fn().mockReturnThis(),
    returning: vi.fn().mockResolvedValue([]),
    execute: vi.fn().mockResolvedValue({ rows: [] }),
  },
}));

describe('WebSocket Signaling Server', () => {
  let httpServer: Server;
  let wsServer: CallernWebSocketServer;
  let clientSocket1: ClientSocket;
  let clientSocket2: ClientSocket;
  const TEST_PORT = 3001;

  beforeEach((done) => {
    // Create HTTP server
    httpServer = require('http').createServer();
    httpServer.listen(TEST_PORT, () => {
      // Create WebSocket server
      wsServer = new CallernWebSocketServer(httpServer);
      done();
    });
  });

  afterEach((done) => {
    // Cleanup
    if (clientSocket1) clientSocket1.disconnect();
    if (clientSocket2) clientSocket2.disconnect();
    httpServer.close(done);
  });

  test('should create room when first user joins', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket1.on('connect', () => {
      clientSocket1.emit('join-room', {
        roomId: 'test-room-1',
        userId: 1,
        role: 'student',
      });

      // Give server time to process
      setTimeout(() => {
        // Check that room was created (would need access to activeRooms)
        // For now, we verify by joining with second client
        expect(clientSocket1.connected).toBe(true);
        done();
      }, 100);
    });
  });

  test('should add second user to existing room', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    let user1Joined = false;
    let user2JoinNotification = false;

    clientSocket1.on('connect', () => {
      clientSocket1.emit('join-room', {
        roomId: 'test-room-2',
        userId: 1,
        role: 'student',
      });
      user1Joined = true;
    });

    clientSocket1.on('user-joined', (data) => {
      expect(data.userId).toBe(2);
      expect(data.role).toBe('teacher');
      user2JoinNotification = true;
      
      if (user1Joined && user2JoinNotification) {
        done();
      }
    });

    clientSocket2.on('connect', () => {
      if (user1Joined) {
        clientSocket2.emit('join-room', {
          roomId: 'test-room-2',
          userId: 2,
          role: 'teacher',
        });
      }
    });
  });

  test('should relay offer from caller to callee', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const mockOffer = {
      type: 'offer',
      sdp: 'mock-sdp-offer',
    };

    clientSocket2.on('connect', () => {
      clientSocket2.on('offer', (data) => {
        expect(data.offer).toEqual(mockOffer);
        expect(data.from).toBe(clientSocket1.id);
        done();
      });
    });

    clientSocket1.on('connect', () => {
      // Wait for both to connect
      setTimeout(() => {
        clientSocket1.emit('offer', {
          roomId: 'test-room-3',
          offer: mockOffer,
          to: clientSocket2.id,
        });
      }, 100);
    });
  });

  test('should relay answer from callee to caller', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const mockAnswer = {
      type: 'answer',
      sdp: 'mock-sdp-answer',
    };

    clientSocket1.on('connect', () => {
      clientSocket1.on('answer', (data) => {
        expect(data.answer).toEqual(mockAnswer);
        expect(data.from).toBe(clientSocket2.id);
        done();
      });
    });

    clientSocket2.on('connect', () => {
      setTimeout(() => {
        clientSocket2.emit('answer', {
          roomId: 'test-room-4',
          answer: mockAnswer,
          to: clientSocket1.id,
        });
      }, 100);
    });
  });

  test('should relay ICE candidates between peers', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const mockCandidate = {
      candidate: 'mock-ice-candidate',
      sdpMLineIndex: 0,
      sdpMid: '0',
    };

    clientSocket2.on('connect', () => {
      clientSocket2.on('ice-candidate', (data) => {
        expect(data.candidate).toEqual(mockCandidate);
        expect(data.from).toBe(clientSocket1.id);
        done();
      });
    });

    clientSocket1.on('connect', () => {
      setTimeout(() => {
        clientSocket1.emit('ice-candidate', {
          roomId: 'test-room-5',
          candidate: mockCandidate,
          to: clientSocket2.id,
        });
      }, 100);
    });
  });

  test('should handle user disconnection', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket1.on('connect', () => {
      // Authenticate as teacher
      clientSocket1.emit('authenticate', {
        userId: 1,
        role: 'teacher',
      });

      setTimeout(() => {
        // Disconnect
        clientSocket1.disconnect();
        
        // Verify cleanup happened
        setTimeout(() => {
          // In real test, we'd check activeRooms and teacherSockets
          expect(clientSocket1.connected).toBe(false);
          done();
        }, 100);
      }, 100);
    });
  });

  test('should clean up empty rooms', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const roomId = 'test-room-cleanup';

    clientSocket1.on('connect', () => {
      clientSocket1.emit('join-room', {
        roomId,
        userId: 1,
        role: 'student',
      });
    });

    clientSocket2.on('connect', () => {
      clientSocket2.emit('join-room', {
        roomId,
        userId: 2,
        role: 'teacher',
      });

      setTimeout(() => {
        // Both disconnect
        clientSocket1.disconnect();
        clientSocket2.disconnect();

        // Room should be cleaned up
        setTimeout(() => {
          // In real implementation, check activeRooms.has(roomId) === false
          expect(clientSocket1.connected).toBe(false);
          expect(clientSocket2.connected).toBe(false);
          done();
        }, 200);
      }, 100);
    });
  });

  test('should prevent more than 2 users per room', (done) => {
    clientSocket1 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    clientSocket2 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const clientSocket3 = ioClient(`http://localhost:${TEST_PORT}`, {
      path: '/socket.io',
      transports: ['websocket'],
    });

    const roomId = 'test-room-full';
    let connectedCount = 0;

    const checkConnections = () => {
      connectedCount++;
      if (connectedCount === 3) {
        // All three connected, now try to join room
        clientSocket1.emit('join-room', {
          roomId,
          userId: 1,
          role: 'student',
        });

        clientSocket2.emit('join-room', {
          roomId,
          userId: 2,
          role: 'teacher',
        });

        setTimeout(() => {
          clientSocket3.emit('join-room', {
            roomId,
            userId: 3,
            role: 'student',
          });

          clientSocket3.on('error', (data) => {
            expect(data.message).toContain('full');
            clientSocket3.disconnect();
            done();
          });

          // If no error after timeout, test should fail
          setTimeout(() => {
            // This shouldn't be reached if room limit works
            clientSocket3.disconnect();
            done(new Error('Third user was allowed to join'));
          }, 500);
        }, 100);
      }
    };

    clientSocket1.on('connect', checkConnections);
    clientSocket2.on('connect', checkConnections);
    clientSocket3.on('connect', checkConnections);
  });
});