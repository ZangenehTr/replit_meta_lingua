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

  const statusBadge = {
    upcoming: { label: t('student:upcoming', 'پیش رو'), cls: 'bg-blue-50 text-blue-700 border-blue-200' },
    ongoing:  { label: t('student:ongoing',  'در جریان'), cls: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
    completed:{ label: t('student:completed','انجام‌شده'), cls: 'bg-gray-100 text-gray-600 border-gray-200' },
    cancelled:{ label: t('student:cancelled','لغو شده'),  cls: 'bg-red-50 text-red-600 border-red-200' },
  }[session.status] ?? { label: session.status, cls: 'bg-gray-100 text-gray-500 border-gray-200' };

  return (
    <motion.div
      className="bg-white rounded-2xl border border-gray-100 shadow-sm cursor-pointer relative overflow-hidden hover:shadow-md transition-shadow"
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25 }}
      whileTap={{ scale: 0.99 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
      onClick={() => onSessionClick(session)}
      data-testid={`video-session-card-${session.id}`}
    >
      {/* Status stripe */}
      <div className={`absolute top-0 start-0 w-1 h-full rounded-s-2xl ${getStatusColor(session.status)}`} />

      <div className="p-4 ps-5">
        {/* Header row */}
        <div className="flex items-start justify-between gap-3 mb-3">
          {/* Left: title + course */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap mb-0.5">
              <h3 className="font-semibold text-gray-900 text-base leading-snug truncate">
                {session.title}
              </h3>
              {session.hasRecording && (
                <span className="inline-flex items-center gap-1">
                  {session.recordingStatus === 'ready' ? (
                    <Video className="w-3.5 h-3.5 text-violet-500" />
                  ) : session.recordingStatus === 'processing' ? (
                    <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}>
                      <Video className="w-3.5 h-3.5 text-amber-500" />
                    </motion.div>
                  ) : null}
                  {session.recordingQuality && (
                    <Badge className={`${getQualityBadgeColor(session.recordingQuality)} text-white text-[10px] px-1 py-0 h-4`}>
                      {session.recordingQuality}
                    </Badge>
                  )}
                </span>
              )}
              {session.examType && <ExamTypeIndicator examType={session.examType} compact />}
            </div>
            <p className="text-indigo-600 text-xs font-medium truncate">{session.courseName}</p>
          </div>

          {/* Right: status + type badges */}
          <div className="flex flex-col items-end gap-1.5 flex-shrink-0">
            <Badge className={`text-[11px] border ${statusBadge.cls}`}>{statusBadge.label}</Badge>
            <Badge className="bg-gray-50 text-gray-500 border-gray-200 text-[11px]">
              {session.type === 'group' ? (
                <><Users className="w-3 h-3 me-1" />{t('student:group', 'گروهی')}</>
              ) : (
                <><User className="w-3 h-3 me-1" />{t('student:individual', 'خصوصی')}</>
              )}
            </Badge>
          </div>
        </div>

        {/* Tutor + time row */}
        <div className="flex items-center gap-4 text-gray-500 text-xs mb-3">
          <span className="flex items-center gap-1.5">
            <div className="w-5 h-5 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-[9px] flex-shrink-0">
              {session.tutorFirstName?.[0]}{session.tutorLastName?.[0]}
            </div>
            <span className="text-gray-700 font-medium">{session.tutorFirstName} {session.tutorLastName}</span>
          </span>
          <span className="flex items-center gap-1">
            <Clock className="w-3.5 h-3.5" />
            {formatTime(session.startTime)} – {formatTime(session.endTime)}
          </span>
          {session.duration && (
            <span className="flex items-center gap-1">
              <Calendar className="w-3.5 h-3.5" />
              {session.duration} {t('student:minutes', 'دقیقه')}
            </span>
          )}
        </div>

        {/* Holiday + language/level */}
        {session.holidays && session.holidays.length > 0 && (
          <div className="mb-3">
            <HolidayIndicator holidays={session.holidays} compact />
          </div>
        )}

        {/* Viewing progress */}
        {session.hasRecording && viewingProgress > 0 && (
          <div className="mb-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-gray-500 text-xs">{t('student:watchProgress', 'پیشرفت تماشا')}</span>
              <span className="text-gray-500 text-xs">{Math.round(viewingProgress)}%</span>
            </div>
            <Progress value={viewingProgress} className="h-1.5 bg-gray-100" />
          </div>
        )}

        {/* Recording metadata */}
        {session.hasRecording && session.recordingMetadata && (
          <div className="mb-3 text-gray-400 text-xs flex items-center gap-3">
            <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDuration(session.recordingMetadata.duration)}</span>
            <span className="flex items-center gap-1"><Download className="w-3 h-3" />{session.recordingMetadata.fileSize}</span>
            {session.viewingHistory && session.viewingHistory.bookmarks.length > 0 && (
              <span className="flex items-center gap-1"><Bookmark className="w-3 h-3" />{session.viewingHistory.bookmarks.length}</span>
            )}
          </div>
        )}

        {/* Action footer */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-50">
          <div className="flex items-center gap-1.5">
            <Badge className="bg-gray-50 text-gray-400 border-gray-200 text-[11px]">{session.language}</Badge>
            <Badge className="bg-gray-50 text-gray-400 border-gray-200 text-[11px]">{session.level}</Badge>
          </div>
          <div className="flex items-center gap-2">
            {session.hasRecording && session.recordingStatus === 'ready' && (
              <motion.button
                className="px-3 py-1.5 bg-violet-600 hover:bg-violet-700 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={handleVideoPlay}
                data-testid={`play-video-${session.id}`}
              >
                <PlayCircle className="w-3.5 h-3.5" />
                {viewingProgress > 0 ? t('student:continue', 'ادامه') : t('student:watch', 'تماشا')}
              </motion.button>
            )}
            {session.status === 'ongoing' && session.canJoin && (
              <motion.button
                className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-xl text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
                whileTap={{ scale: 0.95 }}
                onClick={handleJoinSession}
                data-testid={`join-session-${session.id}`}
              >
                <Play className="w-3.5 h-3.5" />
                {t('student:joinNow', 'پیوستن')}
              </motion.button>
            )}
            {session.status === 'upcoming' && (
              <Button
                variant="outline"
                size="sm"
                className="h-7 text-xs rounded-xl border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                onClick={e => { e.stopPropagation(); onSessionClick(session); }}
              >
                {t('student:viewDetails', 'جزئیات')}
              </Button>
            )}
            {!session.hasRecording && session.status === 'completed' && (
              <Eye className="w-4 h-4 text-gray-300" />
            )}
          </div>
        </div>
      </div>

      {/* Hover overlay for videos */}
      {session.hasRecording && isHovered && session.thumbnailUrl && (
        <motion.div
          className="absolute inset-0 z-20 flex items-center justify-center bg-black/30 backdrop-blur-sm rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <motion.button
            className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg"
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleVideoPlay}
          >
            <Play className="w-6 h-6 text-violet-600 fill-violet-600" />
          </motion.button>
        </motion.div>
      )}
    </motion.div>
  );
}