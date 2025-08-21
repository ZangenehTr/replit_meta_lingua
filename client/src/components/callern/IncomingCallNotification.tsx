import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { PhoneIncoming, Phone, PhoneOff } from 'lucide-react';
import { useWebRTC } from '@/contexts/WebRTCContext';

interface IncomingCallNotificationProps {
  roomId: string;
  studentId: number;
  studentInfo: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    profileImageUrl?: string | null;
  };
  packageId: number;
  language?: string;
  onAccept: () => void;
  onReject: () => void;
}

export function IncomingCallNotification({
  roomId,
  studentId,
  studentInfo,
  packageId,
  language,
  onAccept,
  onReject
}: IncomingCallNotificationProps) {
  const [isRinging, setIsRinging] = useState(true);
  const { socket, userId } = useWebRTC();

  useEffect(() => {
    // Play ringtone (optional)
    const audio = new Audio('/sounds/ringtone.mp3');
    audio.loop = true;
    audio.play().catch(() => {
      // Audio might be blocked by browser
    });

    return () => {
      audio.pause();
      audio.src = '';
    };
  }, []);

  const handleAccept = () => {
    setIsRinging(false);
    
    // Emit accept-call event to server
    socket?.emit('accept-call', {
      roomId,
      teacherId: userId,
      studentId
    });
    
    onAccept();
  };

  const handleReject = () => {
    setIsRinging(false);
    
    // Emit reject-call event to server
    socket?.emit('reject-call', {
      roomId,
      reason: 'Teacher declined'
    });
    
    onReject();
  };

  const studentName = `${studentInfo.firstName} ${studentInfo.lastName}`.trim() || 'Student';
  const initials = studentName.split(' ').map(n => n[0]).join('').toUpperCase();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <Card className={`w-full max-w-md ${isRinging ? 'animate-pulse' : ''}`}>
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <PhoneIncoming className="h-12 w-12 text-green-500 animate-bounce" />
          </div>
          <CardTitle>Incoming CallerN Call</CardTitle>
          <CardDescription>
            {language && `Language: ${language}`}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Student Info */}
          <div className="flex items-center space-x-4">
            <Avatar className="h-16 w-16">
              {studentInfo.profileImageUrl ? (
                <AvatarImage src={studentInfo.profileImageUrl} alt={studentName} />
              ) : (
                <AvatarFallback>{initials}</AvatarFallback>
              )}
            </Avatar>
            <div>
              <p className="text-lg font-semibold">{studentName}</p>
              <p className="text-sm text-muted-foreground">{studentInfo.email}</p>
            </div>
          </div>

          {/* Call Actions */}
          <div className="flex space-x-4">
            <Button
              onClick={handleReject}
              variant="destructive"
              size="lg"
              className="flex-1"
            >
              <PhoneOff className="mr-2 h-5 w-5" />
              Decline
            </Button>
            <Button
              onClick={handleAccept}
              variant="default"
              size="lg"
              className="flex-1 bg-green-600 hover:bg-green-700"
            >
              <Phone className="mr-2 h-5 w-5" />
              Accept
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}