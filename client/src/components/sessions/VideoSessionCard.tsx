import { useState } from "react";
import { motion } from "framer-motion";
import {
  Play,
  Video,
  Clock,
  User,
  Users,
  PlayCircle,
  Download,
  Bookmark,
  Eye,
  Calendar
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useTranslation } from 'react-i18next';
import { HolidayIndicator } from "@/components/ui/holiday-indicator";
import { ExamTypeIndicator } from "@/components/ui/exam-type-indicator";
import { Link } from "wouter";

interface VideoSessionCardProps {
  session: {
    id: number;
    title: string;
    courseName: string;
    tutorFirstName: string;
    tutorLastName: string;
    sessionDate: string;
    startTime: string;
    endTime: string;
    duration: number;
    type: 'group' | 'individual';
    status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
    language: string;
    level: string;
    examType?: 'midterm' | 'final' | null;
    canJoin: boolean;
    hasRecording?: boolean;
    recordingUrl?: string;
    recordingDuration?: number;
    thumbnailUrl?: string;
    recordingQuality?: 'HD' | 'SD' | 'FHD';
    recordingStatus?: 'none' | 'processing' | 'ready' | 'error';
    recordingMetadata?: {
      duration: number;
      fileSize: string;
      uploadDate: string;
      quality: 'HD' | 'SD' | 'FHD';
      thumbnailUrl: string;
      videoUrl: string;
      viewingProgress?: number;
    };
    viewingHistory?: {
      lastWatched: string;
      completionPercentage: number;
      bookmarks: Array<{ timestamp: number; title: string }>;
      notes: Array<{ timestamp: number; content: string }>;
    };
    holidays?: Array<{
      id: number;
      name: string;
      namePersian: string;
      color: string;
    }>;
  };
  onSessionClick: (session: any) => void;
  onVideoPlay?: (sessionId: number) => void;
  onJoinSession?: (sessionId: number) => void;
  compact?: boolean;
}

export function VideoSessionCard({ 
  session, 
  onSessionClick, 
  onVideoPlay, 
  onJoinSession,
  compact = false 
}: VideoSessionCardProps) {
  const { t } = useTranslation();
  const [isHovered, setIsHovered] = useState(false);
  const [thumbnailLoaded, setThumbnailLoaded] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-400';
      case 'ongoing': return 'bg-green-400';
      case 'completed': return 'bg-gray-400';
      case 'cancelled': return 'bg-red-400';
      default: return 'bg-gray-400';
    }
  };

  const formatTime = (time: string) => {
    return new Date(`2000-01-01T${time}`).toLocaleTimeString([], { 
      hour: '2-digit', 
      minute: '2-digit' 
    });
  };

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getQualityBadgeColor = (quality?: string) => {
    switch (quality) {
      case 'FHD': return 'bg-green-500';
      case 'HD': return 'bg-blue-500';
      case 'SD': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const handleVideoPlay = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (session.hasRecording && onVideoPlay) {
      onVideoPlay(session.id);
    }
  };

  const handleJoinSession = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (onJoinSession) {
      onJoinSession(session.id);
    }
  };

  const viewingProgress = session.viewingHistory?.completionPercentage || 
                         session.recordingMetadata?.viewingProgress || 0;

  return (
    <motion.div
      className="glass-card p-4 cursor-pointer relative overflow-hidden"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3 }}
      whileTap={{ scale: 0.98 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSessionClick(session)}
      data-testid={`video-session-card-${session.id}`}
    >
      {/* Video Thumbnail Background */}
      {session.hasRecording && session.thumbnailUrl && (
        <div className="absolute inset-0 z-0 opacity-20">
          <img
            src={session.thumbnailUrl}
            alt={`${session.title} thumbnail`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${
              thumbnailLoaded ? 'opacity-100' : 'opacity-0'
            }`}
            onLoad={() => setThumbnailLoaded(true)}
            onError={() => setThumbnailLoaded(false)}
          />
          <div className="absolute inset-0 bg-gradient-to-r from-purple-900/80 to-blue-900/60" />
        </div>
      )}

      {/* Content */}
      <div className="relative z-10">
        {/* Header with Video Indicator */}
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <div className={`w-2 h-2 rounded-full ${getStatusColor(session.status)}`} />
              <h3 className="text-white font-semibold text-lg">{session.title}</h3>
              
              {/* Recording Indicator */}
              {session.hasRecording && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="flex items-center gap-1"
                >
                  {session.recordingStatus === 'ready' ? (
                    <Video className="w-4 h-4 text-green-400" />
                  ) : session.recordingStatus === 'processing' ? (
                    <motion.div
                      animate={{ rotate: 360 }}
                      transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
                    >
                      <Video className="w-4 h-4 text-yellow-400" />
                    </motion.div>
                  ) : (
                    <Video className="w-4 h-4 text-gray-400" />
                  )}
                  
                  {session.recordingQuality && (
                    <Badge className={`${getQualityBadgeColor(session.recordingQuality)} text-white text-xs px-1 py-0`}>
                      {session.recordingQuality}
                    </Badge>
                  )}
                </motion.div>
              )}
              
              {/* Exam Type Indicator */}
              {session.examType && (
                <ExamTypeIndicator examType={session.examType} compact={true} />
              )}
            </div>
            <p className="text-white/60 text-sm">{session.courseName}</p>
            
            {/* Holiday Indicator */}
            {session.holidays && session.holidays.length > 0 && (
              <div className="mt-2">
                <HolidayIndicator 
                  holidays={session.holidays} 
                  compact={true} 
                />
              </div>
            )}
          </div>
          
          <div className="flex flex-col gap-2 items-end">
            {session.type === 'group' ? (
              <Badge className="bg-white/20 text-white border-white/30">
                <Users className="w-3 h-3 mr-1" />
                {t('student:group', 'Group')}
              </Badge>
            ) : (
              <Badge className="bg-white/20 text-white border-white/30">
                <User className="w-3 h-3 mr-1" />
                {t('student:individual', '1-on-1')}
              </Badge>
            )}
          </div>
        </div>

        {/* Session Details */}
        <div className="flex items-center gap-3 text-white/70 text-sm mb-3">
          <div className="flex items-center gap-1">
            <User className="w-4 h-4" />
            <span>{session.tutorFirstName} {session.tutorLastName}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="w-4 h-4" />
            <span>{formatTime(session.startTime)} - {formatTime(session.endTime)}</span>
          </div>
        </div>

        {/* Video Progress Bar */}
        {session.hasRecording && viewingProgress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/60 text-xs">
                {t('student:watchProgress', 'Watch Progress')}
              </span>
              <span className="text-white/60 text-xs">{Math.round(viewingProgress)}%</span>
            </div>
            <Progress 
              value={viewingProgress} 
              className="h-1 bg-white/20"
            />
          </div>
        )}

        {/* Video Metadata */}
        {session.hasRecording && session.recordingMetadata && (
          <div className="mb-3 text-white/60 text-xs flex items-center gap-3">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{formatDuration(session.recordingMetadata.duration)}</span>
            </div>
            <div className="flex items-center gap-1">
              <Download className="w-3 h-3" />
              <span>{session.recordingMetadata.fileSize}</span>
            </div>
            {session.viewingHistory && session.viewingHistory.bookmarks.length > 0 && (
              <div className="flex items-center gap-1">
                <Bookmark className="w-3 h-3" />
                <span>{session.viewingHistory.bookmarks.length}</span>
              </div>
            )}
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
              {session.language}
            </Badge>
            <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
              {session.level}
            </Badge>
          </div>
          
          <div className="flex items-center gap-2">
            {/* Video Play Button */}
            {session.hasRecording && session.recordingStatus === 'ready' && (
              <motion.button
                className="px-3 py-1 bg-purple-500/80 backdrop-blur rounded-lg text-white text-sm font-medium flex items-center gap-1"
                whileTap={{ scale: 0.95 }}
                whileHover={{ scale: 1.05 }}
                onClick={handleVideoPlay}
                data-testid={`play-video-${session.id}`}
              >
                <PlayCircle className="w-3 h-3" />
                {viewingProgress > 0 ? t('student:continue', 'Continue') : t('student:watch', 'Watch')}
              </motion.button>
            )}
            
            {/* Join Session Button */}
            {session.status === 'ongoing' && session.canJoin && (
              <motion.button
                className="px-3 py-1 bg-green-500/80 backdrop-blur rounded-lg text-white text-sm font-medium flex items-center gap-1"
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinSession}
                data-testid={`join-session-${session.id}`}
              >
                <Play className="w-3 h-3" />
                {t('student:joinNow', 'Join Now')}
              </motion.button>
            )}
            
            {/* No Recording State */}
            {!session.hasRecording && session.status === 'completed' && (
              <span className="text-white/40 text-xs italic">
                {t('student:noRecording', 'No recording available')}
              </span>
            )}
            
            {/* Upcoming Session Info */}
            {session.status === 'upcoming' && (
              <span className="text-white/50 text-xs">
                {t('student:startsIn', 'Starts in')} {session.duration} {t('student:minutes', 'min')}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Hover Video Preview Overlay */}
      {session.hasRecording && isHovered && session.thumbnailUrl && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/50 backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            className="w-16 h-16 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVideoPlay}
          >
            <Play className="w-8 h-8 text-white fill-white" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}