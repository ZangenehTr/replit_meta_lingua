import io, { Socket } from 'socket.io-client';

class SocketManager {
  private static instance: SocketManager;
  private socket: Socket | null = null;
  private currentUserId: number | null = null;

  private constructor() {}

  static getInstance(): SocketManager {
    if (!SocketManager.instance) {
      SocketManager.instance = new SocketManager();
    }
    return SocketManager.instance;
  }

  connect(userId: number, role: string): Socket {
    // Don't recreate if we already have a socket for this user
    if (this.socket && this.socket.connected && this.currentUserId === userId) {
      console.log('Using existing socket connection:', this.socket.id);
      return this.socket;
    }

    // Disconnect old socket if user changed
    if (this.socket && this.currentUserId !== userId) {
      console.log('User changed, disconnecting old socket');
      this.socket.disconnect();
      this.socket = null;
    }

    // Create new socket
    console.log('Creating new socket connection for user:', userId);
    this.socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
      autoConnect: true,
    });

    this.currentUserId = userId;

    // Set up authentication on connect
    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket!.id);
      this.socket!.emit('authenticate', {
        userId,
        role
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected - will attempt reconnection');
    });

    this.socket.on('reconnect', () => {
      console.log('Socket reconnected');
      this.socket!.emit('authenticate', {
        userId,
        role
      });
    });

    return this.socket;
  }

  getSocket(): Socket | null {
    return this.socket;
  }

  disconnect(): void {
    if (this.socket) {
      console.log('Manually disconnecting socket');
      this.socket.disconnect();
      this.socket = null;
      this.currentUserId = null;
    }
  }
}

export default SocketManager.getInstance();