import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { VideoCallFinal } from './VideoCallFinal';

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
  const [isInCall, setIsInCall] = useState(false);
  const [activeCallConfig, setActiveCallConfig] = useState<any>(null);
  const { user } = useAuth();
  const { socket } = useSocket(); // Use the existing socket from context

  useEffect(() => {
    if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor') || !socket) return;

    console.log('TeacherIncomingCall component mounted for user:', user.id, user.role);

    // Listen for incoming calls - matching server event name
    const handleIncomingCall = (data: IncomingCallData) => {
      console.log('🔔 INCOMING CALL RECEIVED from student:', data);
      console.log('Setting incoming call state:', data);
      setIncomingCall(data);
      setIsRinging(true);
      console.log('Ringing state set to true');

      // Play ringtone (you can add an audio element for this)
      const audio = new Audio('/sounds/ringtone.mp3');
      audio.loop = true;
      audio.play().catch(e => console.log('Could not play ringtone:', e));

      // Store audio reference to stop it later
      (window as any).ringtoneAudio = audio;
    };

    // Listen for the correct event name that server emits
    socket.on('incoming-call', handleIncomingCall);
    console.log('✅ Registered listener for incoming-call event');
    
    // Also listen for call-request for backwards compatibility
    socket.on('call-request', handleIncomingCall);
    console.log('✅ Registered listener for call-request event (backwards compat)');

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-request', handleIncomingCall);
      // Stop ringtone if component unmounts
      if ((window as any).ringtoneAudio) {
        (window as any).ringtoneAudio.pause();
        (window as any).ringtoneAudio = null;
      }
    };
  }, [user, socket]);

  const handleAccept = () => {
    if (!incomingCall || !socket) return;

    // Stop ringtone
    if ((window as any).ringtoneAudio) {
      (window as any).ringtoneAudio.pause();
      (window as any).ringtoneAudio = null;
    }

    // First, join the room
    socket.emit('join-room', incomingCall.roomId);
    console.log('Teacher joining room:', incomingCall.roomId);

    // Then emit accept-call event to notify the student
    socket.emit('accept-call', {
      roomId: incomingCall.roomId,
      teacherId: user?.id,
      studentId: incomingCall.studentId
    });

    // Set up the call configuration
    setActiveCallConfig({
      roomId: incomingCall.roomId,
      userId: user?.id || 0,
      role: 'teacher' as const,
      studentId: incomingCall.studentId,
      onCallEnd: handleEndCall
    });
    
    setIsRinging(false);
    setIsInCall(true);
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

  const handleEndCall = () => {
    setIsInCall(false);
    setActiveCallConfig(null);
    setIncomingCall(null);
  };

  // If in a call, show the VideoCall component
  if (isInCall && activeCallConfig) {
    return (
      <VideoCallFinal
        roomId={activeCallConfig.roomId}
        userId={activeCallConfig.userId || 0}
        role={activeCallConfig.role || 'teacher'}
        studentName="Student"
        teacherName="Teacher"
        roadmapTitle="General Conversation"
        sessionStep="Free Talk Session"
        packageMinutesRemaining={600}
        onCallEnd={activeCallConfig.onCallEnd}
      />
    );
  }

  // If not ringing, don't show anything
  if (!isRinging || !incomingCall) return null;

  // Show the incoming call dialog
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