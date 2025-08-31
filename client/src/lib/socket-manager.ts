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
    if (this.socket && this.currentUserId === userId) {
      console.log('🔌 [SOCKET-MANAGER] Using existing socket:', this.socket.id, 'for user:', userId);
      // If socket exists but is disconnected, reconnect it
      if (!this.socket.connected) {
        console.log('🔌 [SOCKET-MANAGER] Reconnecting existing socket...');
        this.socket.connect();
      }
      return this.socket;
    }

    // Disconnect old socket if user changed
    if (this.socket && this.currentUserId !== userId) {
      console.log('User changed, disconnecting old socket');
      this.socket.disconnect();
      this.socket = null;
    }

    // Create new socket
    console.log('🔌 [SOCKET-MANAGER] Creating NEW socket connection for user:', userId, 'role:', role);
    this.socket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 10,
      reconnectionDelay: 1000,
      reconnectionDelayMax: 5000,
      timeout: 20000,
      autoConnect: true,
    });

    this.currentUserId = userId;

    // Set up authentication on connect
    this.socket.on('connect', () => {
      console.log('🔌 [SOCKET-MANAGER] Socket connected:', this.socket!.id, 'for user:', userId, 'role:', role);
      this.socket!.emit('authenticate', {
        userId,
        role
      });
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected - will attempt reconnection');
    });

    this.socket.on('reconnect', () => {
      console.log('🔌 [SOCKET-MANAGER] Socket reconnected:', this.socket!.id, 'for user:', userId, 'role:', role);
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