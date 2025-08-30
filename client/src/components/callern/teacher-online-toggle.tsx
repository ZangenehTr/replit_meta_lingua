import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Wifi, WifiOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

export function TeacherOnlineToggle() {
  const [isOnline, setIsOnline] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const { toast } = useToast();
  const { t } = useTranslation();

  useEffect(() => {
    // Only enable going online if socket is connected
    if (isConnected && socket && user && (user.role === 'Teacher' || user.role === 'Teacher/Tutor')) {
      console.log('Teacher socket ready for Callern availability');
    }
  }, [isConnected, socket, user]);

  const handleToggleOnline = async () => {
    if (!socket || !isConnected) {
      toast({
        title: t('error'),
        description: t('connectionRequired'),
        variant: 'destructive'
      });
      return;
    }

    setIsConnecting(true);

    if (!isOnline) {
      // Going online - enable Callern availability
      socket.emit('teacher-online', {
        teacherId: user?.id
      });

      // Wait for confirmation
      socket.once('teacher-online-success', (data) => {
        console.log('Teacher online for Callern:', data);
        setIsOnline(true);
        setIsConnecting(false);
        toast({
          title: t('success'),
          description: t('nowOnlineForCallern'),
        });
      });

      // Handle error
      socket.once('error', (error) => {
        console.error('Online toggle error:', error);
        setIsConnecting(false);
        toast({
          title: t('error'),
          description: t('failedToGoOnline'),
          variant: 'destructive'
        });
      });
    } else {
      // Going offline
      socket.emit('teacher-offline', {
        teacherId: user?.id
      });

      // Wait for confirmation
      socket.once('teacher-offline-success', (data) => {
        console.log('Teacher offline for Callern:', data);
        setIsOnline(false);
        setIsConnecting(false);
        toast({
          title: t('success'),
          description: t('nowOfflineForCallern'),
        });
      });
    }
  };

  // Only show for teachers
  if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor')) {
    return null;
  }

  return (
    <Card className="p-4 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {isOnline ? (
            <Wifi className="w-6 h-6 text-green-300 animate-pulse" />
          ) : (
            <WifiOff className="w-6 h-6 text-gray-300" />
          )}
          <div>
            <Label htmlFor="callern-toggle" className="text-white font-semibold">
              Callern Availability
            </Label>
            <p className="text-xs text-gray-200">
              {isOnline ? 'Available for video calls' : 'Not accepting calls'}
            </p>
          </div>
        </div>
        <div className="flex items-center space-x-3">
          <Switch
            id="callern-toggle"
            checked={isOnline}
            onCheckedChange={handleToggleOnline}
            disabled={isConnecting || !isConnected}
            className="data-[state=checked]:bg-green-500"
          />
          {isConnecting && (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          )}
        </div>
      </div>
      {!isConnected && (
        <p className="text-xs text-yellow-200 mt-2">
          ⚠️ WebSocket not connected. Please refresh the page.
        </p>
      )}
    </Card>
  );
}