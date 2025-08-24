import { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import io, { Socket } from 'socket.io-client';
import { useAuth } from './use-auth';

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

// Create socket instance outside component to persist across renders
let globalSocket: Socket | null = null;

export const SocketProvider = ({ children }: { children: ReactNode }) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) {
      // Clean up socket if user logs out
      if (globalSocket) {
        globalSocket.disconnect();
        globalSocket = null;
        setSocket(null);
        setIsConnected(false);
      }
      return;
    }

    // Use existing global socket if available and connected
    if (globalSocket && globalSocket.connected) {
      setSocket(globalSocket);
      setIsConnected(true);
      return;
    }

    // Create socket only if it doesn't exist
    if (!globalSocket) {
      globalSocket = io({
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
        autoConnect: true,
      });

      // Authenticate the socket with user credentials
      globalSocket.on('connect', () => {
        console.log('Socket connected:', globalSocket!.id);
        setIsConnected(true);

        // Authenticate based on user role
        globalSocket!.emit('authenticate', {
          userId: user.id,
          role: user.role
        });
      });

      globalSocket.on('disconnect', () => {
        console.log('Socket disconnected');
        setIsConnected(false);
      });

      globalSocket.on('reconnect', () => {
        console.log('Socket reconnected');
        // Re-authenticate on reconnection
        globalSocket!.emit('authenticate', {
          userId: user.id,
          role: user.role
        });
      });

      globalSocket.on('error', (error) => {
        console.error('Socket error:', error);
      });
    }

    setSocket(globalSocket);

    // Cleanup only on user logout
    return () => {
      // Don't disconnect socket on navigation
    };
  }, [user?.id]); // Only recreate socket when user ID changes

  return (
    <SocketContext.Provider value={{ socket, isConnected }}>
      {children}
    </SocketContext.Provider>
  );
};