import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Socket } from 'socket.io-client';
import { useAuth } from './use-auth';
import socketManager from '@/lib/socket-manager';

interface SocketContextType {
  socket: Socket | null;
  isConnected: boolean;
}

const SocketContext = createContext<SocketContextType>({ 
  socket: null, 
  isConnected: false 
});

export const useSocket = () => {
  const context = useContext(SocketContext);
  if (!context) {
    throw new Error('useSocket must be used within SocketProvider');
  }
  return context;
};

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      socketManager.disconnect();
      setSocket(null);
      setIsConnected(false);
      return;
    }

    // Get or create socket connection using the singleton manager
    const managedSocket = socketManager.connect(user.id, user.role);
    setSocket(managedSocket);

    // Listen to connection events
    const handleConnect = () => {
      console.log('Socket provider: connected');
      setIsConnected(true);
    };

    const handleDisconnect = () => {
      console.log('Socket provider: disconnected');
      setIsConnected(false);
    };

    const handleReconnect = () => {
      console.log('Socket provider: reconnected');
      setIsConnected(true);
      // Re-authenticate after reconnection
      managedSocket.emit('authenticate', {
        userId: user.id,
        role: user.role
      });
    };

    const handleError = (error: any) => {
      console.error('Socket provider error:', error);
      setIsConnected(false);
    };

    managedSocket.on('connect', handleConnect);
    managedSocket.on('disconnect', handleDisconnect);
    managedSocket.on('reconnect', handleReconnect);
    managedSocket.on('connect_error', handleError);

    // Check initial connection state
    if (managedSocket.connected) {
      console.log('Socket already connected on mount');
      setIsConnected(true);
    } else {
      console.log('Socket not connected on mount, waiting for connection...');
    }

    // Cleanup listeners on unmount
    return () => {
      managedSocket.off('connect', handleConnect);
      managedSocket.off('disconnect', handleDisconnect);
      managedSocket.off('reconnect', handleReconnect);
      managedSocket.off('connect_error', handleError);
      // Don't disconnect the socket here - let it persist
    };
  }, [user?.id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};