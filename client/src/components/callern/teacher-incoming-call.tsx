import { useState, useEffect } from 'react';
import { Phone, PhoneOff, Video, User, VolumeX, Volume2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useAuth } from '@/hooks/use-auth';
import { useSocket } from '@/hooks/use-socket';
import { VideoCall } from './VideoCallFinal';
import { ringtoneService } from '@/services/ringtone-service';
import { getTeacherRingtonePreferences } from './teacher-ringtone-settings';
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
  const [audioEnabled, setAudioEnabled] = useState(false);
  const { user } = useAuth();
  const { socket } = useSocket(); // Use the existing socket from context
  const { t } = useTranslation(['teacher', 'common', 'callern']);

  useEffect(() => {
    if (!user || (user.role !== 'Teacher' && user.role !== 'Teacher/Tutor') || !socket) {
      console.log('❌ [TEACHER-INCOMING] Component not mounted - missing requirements:', {
        hasUser: !!user,
        userRole: user?.role,
        hasSocket: !!socket,
        socketConnected: socket?.connected
      });
      return;
    }

    console.log('✅ [TEACHER-INCOMING] Component mounted for user:', user.id, user.role, 'Socket connected:', socket.connected);
    console.log('🔌 [TEACHER-INCOMING] Socket ID for incoming calls:', socket.id);

    // Listen for incoming calls - matching server event name
    const handleIncomingCall = async (data: IncomingCallData) => {
      console.log('🔔 [TEACHER-INCOMING] INCOMING CALL RECEIVED from student:', data);
      console.log('🔌 [TEACHER-INCOMING] Received on socket ID:', socket.id);
      console.log('🔔 [TEACHER-INCOMING] Setting incoming call state and starting ringtone');
      
      setIncomingCall(data);
      setIsRinging(true);
      setIsSilenced(false); // Reset silence state for new call
      console.log('🔔 [TEACHER-INCOMING] Ringing state set to true, UI should show');

      // Get teacher's ringtone preferences and try to play
      if (user?.id) {
        try {
          console.log('🔔 [TEACHER-INCOMING] Initializing ringtone service...');
          const preferences = getTeacherRingtonePreferences(user.id);
          console.log('🔔 [TEACHER-INCOMING] Ringtone preferences:', preferences);
          
          // Initialize audio context first (important for browser autoplay policies)
          await ringtoneService.enableAudioWithUserGesture();
          
          // Set volume and play the selected ringtone
          ringtoneService.setVolume(preferences.volume);
          await ringtoneService.playRingtone(preferences.selectedRingtone, true);
          
          console.log(`🔔 [TEACHER-INCOMING] Playing ringtone: ${preferences.selectedRingtone} at volume ${preferences.volume}`);
        } catch (error) {
          console.error('🔔 [TEACHER-INCOMING] Failed to play ringtone:', error);
          
          // Always try a fallback approach - use HTML Audio as backup
          try {
            console.log('🔔 [TEACHER-INCOMING] Trying fallback HTML audio ringtone...');
            const audio = new Audio();
            audio.volume = 0.7;
            
            // Create a simple tone using data URL
            const audioUrl = 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmAaBDuR2/Pc';
            audio.src = audioUrl;
            
            // Play in a loop for incoming call effect
            audio.loop = true;
            await audio.play();
            
            console.log('🔔 [TEACHER-INCOMING] Fallback audio playing');
          } catch (fallbackError) {
            console.error('🔔 [TEACHER-INCOMING] All ringtone attempts failed:', fallbackError);
            console.log('🔔 [TEACHER-INCOMING] Visual notification only - no sound available');
          }
        }
      }
    };

    // Debug socket connection
    console.log('🔌 [TEACHER-INCOMING] Socket connection details:', {
      connected: socket.connected,
      id: socket.id,
      userId: user.id,
      role: user.role
    });

    // Test socket communication
    socket.emit('test-teacher-socket', { 
      teacherId: user.id, 
      message: 'Testing teacher socket connection' 
    });

    // Listen for the correct event name that server emits
    socket.on('incoming-call', handleIncomingCall);
    console.log('✅ [TEACHER-INCOMING] Registered listener for incoming-call event');
    
    // Also listen for call-request for backwards compatibility
    socket.on('call-request', handleIncomingCall);
    console.log('✅ [TEACHER-INCOMING] Registered listener for call-request event (backwards compat)');

    // Add socket event debugging
    socket.onAny((eventName, ...args) => {
      console.log(`📡 [TEACHER-INCOMING] Socket event received: ${eventName}`, args);
    });

    // Add specific test for incoming-call events
    socket.on('connect', () => {
      console.log('🔌 [TEACHER-INCOMING] Socket connected, re-registering events');
    });

    // Test event to verify server communication
    socket.on('connection-test', (data) => {
      console.log('✅ [TEACHER-INCOMING] Connection test received from server:', data);
    });

    socket.on('teacher-socket-test-response', (data) => {
      console.log('✅ [TEACHER-INCOMING] Socket test response received:', data);
    });

    return () => {
      socket.off('incoming-call', handleIncomingCall);
      socket.off('call-request', handleIncomingCall);
      socket.off('connect');
      socket.offAny();
      // Stop ringtone if component unmounts
      ringtoneService.stopRingtone();
    };
  }, [user, socket]);

  const handleAccept = async () => {
    console.log('🔍 [TEACHER] handleAccept called - Checking prerequisites...');
    console.log('🔍 [TEACHER] incomingCall:', !!incomingCall, incomingCall);
    console.log('🔍 [TEACHER] socket:', !!socket, socket?.connected);
    console.log('🔍 [TEACHER] user:', !!user, user?.id);
    
    if (!incomingCall || !socket) {
      console.log('❌ [TEACHER] Cannot accept - missing call data or socket', { incomingCall: !!incomingCall, socket: !!socket });
      return;
    }

    if (!user?.id) {
      console.log('❌ [TEACHER] Cannot accept - missing user ID', { user });
      return;
    }

    console.log('✅ [TEACHER] Accept button clicked for call from student:', incomingCall.studentId);

    // Enable audio with user gesture if not already enabled (non-blocking)
    if (!audioEnabled) {
      console.log('🎵 [TEACHER] Attempting to enable audio...');
      try {
        // Add timeout to prevent hanging
        const audioPromise = ringtoneService.enableAudioWithUserGesture();
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Audio enable timeout')), 2000)
        );
        
        await Promise.race([audioPromise, timeoutPromise]);
        setAudioEnabled(true);
        console.log('🎵 [TEACHER] Audio enabled successfully');
      } catch (error) {
        console.error('🎵 [TEACHER] Failed to enable audio (proceeding anyway):', error);
        // Continue with call acceptance even if audio fails
      }
    } else {
      console.log('🎵 [TEACHER] Audio already enabled');
    }

    // Stop ringtone
    console.log('🔇 [TEACHER] Stopping ringtone...');
    try {
      ringtoneService.stopRingtone();
      console.log('🔇 [TEACHER] Ringtone stopped');
    } catch (error) {
      console.error('🔇 [TEACHER] Error stopping ringtone:', error);
    }

    console.log('🎯 [TEACHER] Accepting call and joining room:', incomingCall.roomId);
    
    // First, join the room with proper parameters
    socket.emit('join-room', {
      roomId: incomingCall.roomId,
      userId: user?.id,
      role: 'teacher'
    });
    console.log('🏠 [TEACHER] Joining room:', incomingCall.roomId, 'as user:', user?.id);

    // Then emit accept-call event to notify the student
    socket.emit('accept-call', {
      roomId: incomingCall.roomId,
      teacherId: user?.id,
      studentId: incomingCall.studentId
    });
    console.log('✅ [TEACHER] Emitted accept-call event');

    // Set up the call configuration
    setActiveCallConfig({
      roomId: incomingCall.roomId,
      userId: user?.id || 0,
      role: 'teacher' as const,
      studentId: incomingCall.studentId,
      onCallEnd: handleEndCall
    });
    
    console.log('🎯 [TEACHER] Call config set, switching to video call mode');
    setIsRinging(false);
    setIsInCall(true);
    console.log('✅ [TEACHER] Accept function completed successfully!');
  };

  const handleReject = async () => {
    if (!incomingCall || !socket) {
      console.log('❌ [TEACHER] Cannot reject - missing call data or socket');
      return;
    }

    console.log('❌ [TEACHER] Rejecting call from student:', incomingCall.studentId);

    // Enable audio with user gesture if not already enabled (for future calls)
    if (!audioEnabled) {
      try {
        await ringtoneService.enableAudioWithUserGesture();
        setAudioEnabled(true);
        console.log('🎵 Audio enabled after reject button click');
      } catch (error) {
        console.error('🎵 Failed to enable audio:', error);
      }
    }

    // Stop ringtone
    ringtoneService.stopRingtone();

    // Notify student that call was rejected
    socket.emit('call-rejected', {
      roomId: incomingCall.roomId,
      studentId: incomingCall.studentId,
      reason: 'Teacher rejected the call'
    });
    console.log('❌ [TEACHER] Emitted call-rejected event');

    setIsRinging(false);
    setIncomingCall(null);
  };

  const handleEndCall = () => {
    setIsInCall(false);
    setActiveCallConfig(null);
    setIncomingCall(null);
  };

  // Handle silence button
  const handleSilence = async () => {
    console.log(`🔇 Silence button clicked, currently silenced: ${isSilenced}`);
    
    // Enable audio with user gesture if not already enabled
    if (!audioEnabled) {
      try {
        await ringtoneService.enableAudioWithUserGesture();
        setAudioEnabled(true);
        console.log('🎵 Audio enabled after silence button click');
      } catch (error) {
        console.error('🎵 Failed to enable audio:', error);
      }
    }
    
    if (isSilenced) {
      // Unsilence - resume ringtone
      if (user?.id && incomingCall && audioEnabled) {
        try {
          const preferences = getTeacherRingtonePreferences(user.id);
          ringtoneService.setVolume(preferences.volume);
          await ringtoneService.playRingtone(preferences.selectedRingtone, true);
          console.log('🔔 Ringtone resumed after unsilencing');
        } catch (error) {
          console.error('🔔 Failed to resume ringtone:', error);
        }
      }
      setIsSilenced(false);
    } else {
      // Silence the ringtone
      console.log('🔇 Silencing ringtone...');
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
        <DialogHeader>
          <DialogTitle className="text-center text-xl font-bold">
            {t('teacher:incomingCall', 'Incoming Call')}
          </DialogTitle>
        </DialogHeader>
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