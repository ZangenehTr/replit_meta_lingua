import React, { useState, useEffect } from 'react';
import { useWebRTC } from '@/hooks/useWebRTC';
import { CallControls } from './CallControls';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor,
  MessageSquare,
  Users,
  Clock,
  Wifi,
  WifiOff
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface VideoCallProps {
  roomId: string;
  studentId: number;
  teacherId: number;
  packageId: number;
  language: string;
  teacherName?: string;
  studentName?: string;
  onCallEnd?: () => void;
}

export function VideoCall({
  roomId,
  studentId,
  teacherId,
  packageId,
  language,
  teacherName,
  studentName,
  onCallEnd
}: VideoCallProps) {
  const [showChat, setShowChat] = useState(false);
  const [showParticipants, setShowParticipants] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [chatMessages, setChatMessages] = useState<Array<{
    id: number;
    sender: string;
    message: string;
    timestamp: Date;
  }>>([]);
  const [newMessage, setNewMessage] = useState('');

  const {
    localVideoRef,
    remoteVideoRef,
    connectionState,
    formattedDuration,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    initializeCall,
    toggleVideo,
    toggleAudio,
    shareScreen,
    stopScreenShare,
    endCall
  } = useWebRTC({
    onCallEnded: (reason) => {
      console.log('Call ended:', reason);
      onCallEnd?.();
    }
  });

  useEffect(() => {
    // Initialize the call when component mounts
    initializeCall({
      studentId,
      teacherId,
      packageId,
      language,
      roomId
    });
  }, []);

  const handleSendMessage = () => {
    if (!newMessage.trim()) return;

    const message = {
      id: Date.now(),
      sender: 'You',
      message: newMessage,
      timestamp: new Date()
    };

    setChatMessages([...chatMessages, message]);
    setNewMessage('');
    
    // TODO: Send message through WebSocket
  };

  const getConnectionStatusColor = () => {
    switch (connectionState) {
      case 'connected':
        return 'text-green-500';
      case 'connecting':
        return 'text-yellow-500';
      case 'disconnected':
      case 'failed':
        return 'text-red-500';
      default:
        return 'text-gray-500';
    }
  };

  const getConnectionStatusIcon = () => {
    if (connectionState === 'connected') {
      return <Wifi className="h-4 w-4" />;
    }
    return <WifiOff className="h-4 w-4" />;
  };

  return (
    <div className="fixed inset-0 bg-black flex flex-col">
      {/* Header */}
      <div className="bg-gray-900 text-white p-4 flex items-center justify-between z-10">
        <div className="flex items-center gap-4">
          <h1 className="text-lg font-bold">Callern Video Session</h1>
          <Badge variant="secondary">{language}</Badge>
          <div className={cn("flex items-center gap-2", getConnectionStatusColor())}>
            {getConnectionStatusIcon()}
            <span className="text-sm capitalize">{connectionState}</span>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span className="font-mono">{formattedDuration}</span>
          </div>
          <Button 
            variant="destructive" 
            size="sm" 
            onClick={() => endCall('User ended call')}
          >
            <PhoneOff className="h-4 w-4 mr-2" />
            End Call
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 flex relative">
        {/* Video Area */}
        <div className="flex-1 relative bg-gray-800">
          {/* Remote Video (Teacher/Student) */}
          <video
            ref={remoteVideoRef}
            autoPlay
            playsInline
            className="w-full h-full object-cover"
          />

          {/* Connection State Overlay */}
          {connectionState === 'connecting' && (
            <div className="absolute inset-0 flex items-center justify-center bg-black/50">
              <div className="text-white text-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-white mx-auto mb-4"></div>
                <p>Connecting to {teacherName || 'teacher'}...</p>
              </div>
            </div>
          )}

          {/* Local Video (Picture-in-Picture) */}
          <div className="absolute bottom-4 right-4 w-48 h-36 bg-gray-700 rounded-lg overflow-hidden shadow-lg">
            <video
              ref={localVideoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isVideoEnabled && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-800">
                <VideoOff className="h-8 w-8 text-gray-400" />
              </div>
            )}
          </div>

          {/* Call Info Overlay */}
          <div className="absolute top-4 left-4">
            <Card className="bg-black/50 text-white border-0 p-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>
                    {teacherName ? teacherName[0].toUpperCase() : 'T'}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="font-semibold">{teacherName || 'Teacher'}</p>
                  <p className="text-sm text-gray-300">{language} Instructor</p>
                </div>
              </div>
            </Card>
          </div>
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="w-80 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                Chat
              </h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg) => (
                <div key={msg.id} className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-sm">{msg.sender}</span>
                    <span className="text-xs text-gray-500">
                      {msg.timestamp.toLocaleTimeString()}
                    </span>
                  </div>
                  <p className="text-sm bg-gray-100 dark:bg-gray-800 rounded-lg p-2">
                    {msg.message}
                  </p>
                </div>
              ))}
            </div>

            <div className="p-4 border-t border-gray-200 dark:border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <Button onClick={handleSendMessage} size="sm">
                  Send
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* Participants Sidebar */}
        {showParticipants && (
          <div className="w-64 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h3 className="font-semibold flex items-center gap-2">
                <Users className="h-4 w-4" />
                Participants (2)
              </h3>
            </div>
            
            <div className="p-4 space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>T</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{teacherName || 'Teacher'}</p>
                  <p className="text-xs text-gray-500">Instructor</p>
                </div>
                <div className="flex gap-1">
                  <Mic className="h-4 w-4 text-green-500" />
                  <Video className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Avatar className="h-8 w-8">
                  <AvatarFallback>S</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">{studentName || 'You'}</p>
                  <p className="text-xs text-gray-500">Student</p>
                </div>
                <div className="flex gap-1">
                  {isAudioEnabled ? (
                    <Mic className="h-4 w-4 text-green-500" />
                  ) : (
                    <MicOff className="h-4 w-4 text-red-500" />
                  )}
                  {isVideoEnabled ? (
                    <Video className="h-4 w-4 text-green-500" />
                  ) : (
                    <VideoOff className="h-4 w-4 text-red-500" />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls Bar */}
      <CallControls
        isVideoEnabled={isVideoEnabled}
        isAudioEnabled={isAudioEnabled}
        isScreenSharing={isScreenSharing}
        showChat={showChat}
        showParticipants={showParticipants}
        onToggleVideo={toggleVideo}
        onToggleAudio={toggleAudio}
        onToggleScreenShare={() => {
          if (isScreenSharing) {
            stopScreenShare();
          } else {
            shareScreen();
          }
        }}
        onToggleChat={() => setShowChat(!showChat)}
        onToggleParticipants={() => setShowParticipants(!showParticipants)}
        onEndCall={() => endCall('User ended call')}
      />
    </div>
  );
}