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

    managedSocket.on('connect', handleConnect);
    managedSocket.on('disconnect', handleDisconnect);

    // Check initial connection state
    if (managedSocket.connected) {
      setIsConnected(true);
    }

    // Cleanup listeners on unmount
    return () => {
      managedSocket.off('connect', handleConnect);
      managedSocket.off('disconnect', handleDisconnect);
      // Don't disconnect the socket here - let it persist
    };
  }, [user?.id, user?.role]);

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};