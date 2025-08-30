import React from 'react';
import { useRoute, useLocation } from 'wouter';
import { useAuth } from '@/hooks/use-auth';
import { VideoCall } from '@/components/callern/VideoCallFinal';

export default function CallernVideoCall() {
  const [, params] = useRoute('/callern/video/:callId');
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  
  const callId = params?.callId;
  
  if (!callId || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Invalid Call</h2>
          <p className="text-gray-600">Call ID not found or user not authenticated.</p>
        </div>
      </div>
    );
  }
  
  const handleCallEnd = () => {
    setLocation('/dashboard');
  };
  
  return (
    <VideoCall
      roomId={callId}
      userId={user.id}
      role={user.role === 'Teacher' || user.role === 'Teacher/Tutor' ? 'teacher' : 'student'}
      onCallEnd={handleCallEnd}
      teacherName={user.role === 'Teacher' ? `${user.firstName} ${user.lastName}` : undefined}
      studentName={user.role === 'Student' ? `${user.firstName} ${user.lastName}` : undefined}
    />
  );
}