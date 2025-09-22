import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, User, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { VideoCall } from './VideoCallFinal';
import { ringtoneService } from '@/services/ringtone-service';
import { getTeacherRingtonePreferences } from '@/utils/ringtone-preferences';
import { useTranslation } from 'react-i18next';

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
  const [isSilenced, setIsSilenced] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket(); // Use the existing socket from context
  const { t } = useTranslation(['teacher', 'common', 'callern']);

  useEffect(() => {
    if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor') || !socket) return;

    console.log('TeacherIncomingCall component mounted for user:', user.id, user.role);

    // Listen for incoming calls - matching server event name
    const handleIncomingCall = async (data: IncomingCallData) => {
      console.log('🔔 INCOMING CALL RECEIVED from student:', data);
      console.log('Setting incoming call state:', data);
      setIncomingCall(data);
      setIsRinging(true);
      setIsSilenced(false); // Reset silence state for new call
      console.log('Ringing state set to true');

      // Get teacher's ringtone preferences
      if (user?.id) {
        try {
          const preferences = getTeacherRingtonePreferences(user.id);
          
          // Set volume and play the selected ringtone
          ringtoneService.setVolume(preferences.volume);
          await ringtoneService.playRingtone(preferences.selectedRingtone, true);
          
          console.log(`Playing ringtone: ${preferences.selectedRingtone} at volume ${preferences.volume}`);
        } catch (error) {
          console.error('Failed to play ringtone:', error);
          
          // Fallback to classic ringtone
          try {
            await ringtoneService.playRingtone('classic', true);
          } catch (fallbackError) {
            console.error('Failed to play fallback ringtone:', fallbackError);
          }
        }
      }
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
      ringtoneService.stopRingtone();
    };
  }, [user, socket]);

  const handleAccept = () => {
    if (!incomingCall || !socket) return;

    // Stop ringtone
    ringtoneService.stopRingtone();

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
    ringtoneService.stopRingtone();

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

  // Handle silence button
  const handleSilence = () => {
    if (isSilenced) {
      // Unsilence - resume ringtone
      if (user?.id && incomingCall) {
        const preferences = getTeacherRingtonePreferences(user.id);
        ringtoneService.setVolume(preferences.volume);
        ringtoneService.playRingtone(preferences.selectedRingtone, true);
      }
      setIsSilenced(false);
    } else {
      // Silence the ringtone
      ringtoneService.stopRingtone();
      setIsSilenced(true);
    }
  };

  // If in a call, show the VideoCall component
  if (isInCall && activeCallConfig) {
    return (
      <VideoCall
        {...activeCallConfig}
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

            <h3 className="text-lg font-semibold mb-2">
              {t('teacher:incomingCallFrom', 'Incoming call from')}
              {isSilenced && (
                <span className="ml-2 text-sm text-muted-foreground">
                  ({t('common:callActions.silenced', 'Silenced')})
                </span>
              )}
            </h3>
            
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

            <div className="flex gap-3 justify-center">
              <Button
                onClick={handleReject}
                variant="destructive"
                size="lg"
                className="rounded-full h-14 w-14"
                title={t('common:callActions.reject', 'Reject')}
              >
                <PhoneOff className="h-6 w-6" />
              </Button>
              
              <Button
                onClick={handleSilence}
                variant="outline"
                size="lg"
                className={`rounded-full h-14 w-14 ${
                  isSilenced 
                    ? 'bg-orange-100 hover:bg-orange-200 border-orange-300 text-orange-600' 
                    : 'hover:bg-gray-100'
                }`}
                title={isSilenced ? t('common:callActions.unsilence', 'Unsilence') : t('common:callActions.silence', 'Silence')}
              >
                <VolumeX className={`h-6 w-6 ${isSilenced ? 'text-orange-600' : ''}`} />
              </Button>
              
              <Button
                onClick={handleAccept}
                variant="default"
                size="lg"
                className="rounded-full h-14 w-14 bg-green-600 hover:bg-green-700"
                title={t('common:callActions.answer', 'Answer')}
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