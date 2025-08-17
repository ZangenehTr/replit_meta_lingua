import { useEffect, useState } from 'react';
import io, { Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function useSocket() {
  const [isConnected, setIsConnected] = useState(false);
  
  useEffect(() => {
    // Initialize socket connection if not already connected
    if (!socket) {
      socket = io(window.location.origin, {
        path: '/socket.io',
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 5,
        reconnectionDelay: 1000,
      });
      
      socket.on('connect', () => {
        console.log('WebSocket connected');
        setIsConnected(true);
      });
      
      socket.on('disconnect', () => {
        console.log('WebSocket disconnected');
        setIsConnected(false);
      });
      
      socket.on('error', (error) => {
        console.error('WebSocket error:', error);
      });
    }
    
    return () => {
      // Don't disconnect on unmount, keep connection alive
    };
  }, []);
  
  return socket;
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}