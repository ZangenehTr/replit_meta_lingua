import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useLocation } from 'wouter';
import io, { Socket } from 'socket.io-client';

interface IncomingCallData {
  roomId: string;
  studentId: number;
  packageId: number;
  language: string;
  studentInfo: {
    firstName: string;
    lastName: string;
    email: string;
  };
}

export function TeacherIncomingCall() {
  const [incomingCall, setIncomingCall] = useState<IncomingCallData | null>(null);
  const [isRinging, setIsRinging] = useState(false);
  const [socket, setSocket] = useState<Socket | null>(null);
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  useEffect(() => {
    if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor')) return;

    console.log('TeacherIncomingCall component mounted for user:', user.id, user.role);

    // Initialize socket connection
    const newSocket = io({
      path: '/socket.io/',
      transports: ['websocket', 'polling']
    });

    setSocket(newSocket);

    // Wait for connection before authenticating
    newSocket.on('connect', () => {
      console.log('Teacher WebSocket connected, authenticating with ID:', user.id);
      // Authenticate with WebSocket as teacher
      newSocket.emit('authenticate', {
        userId: user.id,
        role: 'teacher'
      });
    });
    
    // Listen for authentication confirmation
    newSocket.on('authenticated', (data) => {
      console.log('Teacher authentication confirmed:', data);
    });

    // Listen for incoming calls
    const handleCallRequest = (data: IncomingCallData) => {
      console.log('Incoming call from student:', data);
      setIncomingCall(data);
      setIsRinging(true);

      // Play ringtone (you can add an audio element for this)
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(e => console.log('Could not play ringtone:', e));

      // Store audio reference to stop it later
      (window as any).ringtoneAudio = audio;
    };

    newSocket.on('call-request', handleCallRequest);

    return () => {
      newSocket.off('call-request', handleCallRequest);
      newSocket.disconnect();
      // Stop ringtone if component unmounts
      if ((window as any).ringtoneAudio) {
        (window as any).ringtoneAudio.pause();
        (window as any).ringtoneAudio = null;
      }
    };
  }, [user]);

  const handleAccept = () => {
    if (!incomingCall) return;

    // Stop ringtone
    if ((window as any).ringtoneAudio) {
      (window as any).ringtoneAudio.pause();
      (window as any).ringtoneAudio = null;
    }

    // Navigate to video call page with room info
    setLocation(`/callern/video/${incomingCall.roomId}?role=teacher&studentId=${incomingCall.studentId}`);
    
    setIsRinging(false);
    setIncomingCall(null);
  };

  const handleReject = () => {
    if (!incomingCall || !socket) return;

    // Stop ringtone
    if ((window as any).ringtoneAudio) {
      (window as any).ringtoneAudio.pause();
      (window as any).ringtoneAudio = null;
    }

    // Notify student that call was rejected
    socket.emit('call-rejected', {
      roomId: incomingCall.roomId,
      studentId: incomingCall.studentId,
      reason: 'Teacher rejected the call'
    });

    setIsRinging(false);
    setIncomingCall(null);
  };

  if (!isRinging || !incomingCall) return null;

  return (
    <Dialog open={isRinging} onOpenChange={(open) => {
      if (!open) handleReject();
    }}>
      <DialogContent className="sm:max-w-md">
        <Card className="border-0 shadow-none">
          <div className="p-6 text-center">
            <div className="mb-4">
              <div className="relative inline-block">
                <div className="animate-pulse">
                  <Video className="h-16 w-16 text-primary" />
                </div>
                <div className="absolute -top-1 -right-1">
                  <span className="flex h-3 w-3">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500"></span>
                  </span>
                </div>
              </div>
            </div>

            <h3 className="text-lg font-semibold mb-2">Incoming Callern Call</h3>
            
            <div className="mb-4 space-y-2">
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                <User className="h-4 w-4" />
                <span>
                  {incomingCall.studentInfo?.firstName || 'Student'} {incomingCall.studentInfo?.lastName || ''}
                </span>
              </div>
              <div className="text-sm text-muted-foreground">
                Language: {incomingCall.language}
              </div>
            </div>

            <div className="flex gap-4 justify-center">
              <Button
                onClick={handleReject}
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={handleAccept}
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
              >
                <Phone className="h-6 w-6" />
              </Button>
            </div>
          </div>
        </Card>
      </DialogContent>
    </Dialog>
  );
}