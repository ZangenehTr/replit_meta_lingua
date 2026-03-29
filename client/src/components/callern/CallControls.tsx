import React from 'react';
import { Button } from '@/components/ui/button';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Monitor,
  MonitorOff,
  MessageSquare,
  Users,
  Settings,
  MoreVertical
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface CallControlsProps {
  isVideoEnabled: boolean;
  isAudioEnabled: boolean;
  isScreenSharing: boolean;
  showChat: boolean;
  showParticipants: boolean;
  onToggleVideo: () => void;
  onToggleAudio: () => void;
  onToggleScreenShare: () => void;
  onToggleChat: () => void;
  onToggleParticipants: () => void;
  onEndCall: () => void;
}

export function CallControls({
  isVideoEnabled,
  isAudioEnabled,
  isScreenSharing,
  showChat,
  showParticipants,
  onToggleVideo,
  onToggleAudio,
  onToggleScreenShare,
  onToggleChat,
  onToggleParticipants,
  onEndCall
}: CallControlsProps) {
  return (
    <div className="bg-gray-900 border-t border-gray-800 px-4 py-3">
      <div className="flex items-center justify-center gap-2">
        <TooltipProvider>
          {/* Audio Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isAudioEnabled ? "secondary" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={onToggleAudio}
                aria-label={isAudioEnabled ? 'بی‌صدا کردن' : 'روشن کردن میکروفون'}
                aria-pressed={!isAudioEnabled}
              >
                {isAudioEnabled ? (
                  <Mic className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <MicOff className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isAudioEnabled ? 'Mute' : 'Unmute'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Video Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isVideoEnabled ? "secondary" : "destructive"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={onToggleVideo}
                aria-label={isVideoEnabled ? 'خاموش کردن دوربین' : 'روشن کردن دوربین'}
                aria-pressed={!isVideoEnabled}
              >
                {isVideoEnabled ? (
                  <Video className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <VideoOff className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Screen Share Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={isScreenSharing ? "default" : "secondary"}
                size="icon"
                className="h-12 w-12 rounded-full"
                onClick={onToggleScreenShare}
                aria-label={isScreenSharing ? 'توقف اشتراک‌گذاری صفحه' : 'اشتراک‌گذاری صفحه'}
                aria-pressed={isScreenSharing}
              >
                {isScreenSharing ? (
                  <MonitorOff className="h-5 w-5" aria-hidden="true" />
                ) : (
                  <Monitor className="h-5 w-5" aria-hidden="true" />
                )}
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{isScreenSharing ? 'Stop sharing' : 'Share screen'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="h-8 w-px bg-gray-700 mx-2" aria-hidden="true" />

          {/* Chat Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showChat ? "default" : "secondary"}
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={onToggleChat}
                aria-label={showChat ? 'بستن چت' : 'باز کردن چت'}
                aria-pressed={showChat}
              >
                <MessageSquare className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showChat ? 'Hide chat' : 'Show chat'}</p>
            </TooltipContent>
          </Tooltip>

          {/* Participants Toggle */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant={showParticipants ? "default" : "secondary"}
                size="icon"
                className="h-10 w-10 rounded-lg"
                onClick={onToggleParticipants}
                aria-label={showParticipants ? 'پنهان کردن شرکت‌کنندگان' : 'نمایش شرکت‌کنندگان'}
                aria-pressed={showParticipants}
              >
                <Users className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>{showParticipants ? 'Hide participants' : 'Show participants'}</p>
            </TooltipContent>
          </Tooltip>

          {/* More Options */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="secondary"
                size="icon"
                className="h-10 w-10 rounded-lg"
                aria-label="گزینه‌های بیشتر"
              >
                <MoreVertical className="h-4 w-4" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>More options</p>
            </TooltipContent>
          </Tooltip>

          {/* Separator */}
          <div className="h-8 w-px bg-gray-700 mx-2" aria-hidden="true" />

          {/* End Call */}
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="destructive"
                size="icon"
                className="h-12 w-16 rounded-full"
                onClick={onEndCall}
                aria-label="پایان تماس"
              >
                <PhoneOff className="h-5 w-5" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>End call</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}