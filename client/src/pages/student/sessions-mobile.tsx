import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Video, Users, MapPin, Play, ChevronRight, Filter, CalendarDays, X, PlayCircle, Download, Bookmark, Eye } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { HolidayIndicator } from '@/components/ui/holiday-indicator';
import { ExamTypeIndicator } from '@/components/ui/exam-type-indicator';
import { EnhancedDateDisplay } from '@/components/ui/enhanced-date-display';
import { SessionCalendarSidebar } from '@/components/ui/session-calendar-sidebar';
import '@/styles/mobile-app.css';

interface Holiday {
  id: number;
  name: string;
  type: string;
  color?: string;
  icon?: string;
}

interface CulturalEvent {
  id: number;
  name: string;
  significance?: string;
}

interface CalendarContext {
  persianDate: string;
  gregorianDate: string;
  culturalSignificance?: string;
}

interface Session {
  id: number;
  title: string;
  courseTitle: string;
  teacherName: string;
  date: string;
  time: string;
  duration: number;
  type: 'group' | 'individual';
  location?: string;
  meetingUrl?: string;
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  participants?: number;
  maxParticipants?: number;
  // Enhanced calendar fields
  holidays?: Holiday[];
  culturalEvents?: CulturalEvent[];
  examType?: 'midterm' | 'final' | null;
  calendarContext?: CalendarContext;
  sessionDate: string;
  startTime: string;
  endTime: string;
  // Video recording fields
  hasRecording?: boolean;
  recordingUrl?: string;
  recordingDuration?: number;
  thumbnailUrl?: string;
  recordingFileSize?: number;
  recordingQuality?: 'HD' | 'SD' | 'FHD';
  recordingUploadDate?: string;
  recordingStatus?: 'none' | 'processing' | 'ready' | 'error';
  recordingMetadata?: {
    duration: number;
    fileSize: string;
    uploadDate: string;
    quality: 'HD' | 'SD' | 'FHD';
    thumbnailUrl: string;
    videoUrl: string;
    viewingProgress?: number; // 0-100%
  };
  viewingHistory?: {
    lastWatched: string;
    completionPercentage: number;
    bookmarks: Array<{ timestamp: number; title: string }>;
    notes: Array<{ timestamp: number; content: string }>;
  };
}

export default function StudentSessionsMobile() {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [videoFilter, setVideoFilter] = useState<string>('all'); // 'all', 'with-recording', 'without-recording', 'completed-with-recording'
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [filteredSessionIds, setFilteredSessionIds] = useState<number[]>([]);

  // Fetch sessions with calendar and video data
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/student/sessions', filterType, videoFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        includeCalendar: 'true',
        includeVideo: 'true',
        ...(videoFilter !== 'all' && { filter: videoFilter })
      });
      const response = await fetch(`/api/student/sessions?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
  });

  // Calendar handlers
  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
    setShowCalendarModal(false);
  };

  const handleCalendarSessionFilter = (sessionIds: number[]) => {
    setFilteredSessionIds(sessionIds);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filteredSessionIds.length > 0) {
      return filteredSessionIds.includes(session.id);
    }
    return true;
  });

  // Join session mutation
  const joinSession = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/student/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.meetingUrl) {
        window.open(data.meetingUrl, '_blank');
      }
      toast({
        title: t('student:sessionJoined'),
        description: t('student:sessionJoinedDesc'),
      });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:sessionJoinError'),
        variant: 'destructive'
      });
    }
  });

  // Video playback handler for mobile
  const handleVideoPlay = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.hasRecording && session.recordingUrl) {
      // Navigate to video player page optimized for mobile
      window.open(`/student/video-player?sessionId=${sessionId}&mobile=true`, '_blank');
      
      toast({
        title: t('student:openingVideo', 'Opening Video'),
        description: t('student:videoStarting', 'The session video is opening'),
      });
    }
  };

  // Format duration for mobile display
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'upcoming': return 'bg-blue-500';
      case 'ongoing': return 'bg-green-500';
      case 'completed': return 'bg-gray-500';
      case 'cancelled': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const formatTime = (time: string) => {
    return new Date(`1970-01-01T${time}`).toLocaleTimeString([], {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <MobileLayout
      title={t('student:sessions')}
      showBack={false}
      gradient="cool"
    >
      {/* Header Controls */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-white font-bold text-xl">{t('student:sessions', 'Sessions')}</h1>
        <motion.button
          whileTap={{ scale: 0.95 }}
          className="p-2 rounded-full bg-white/10 backdrop-blur"
          onClick={() => setShowCalendarModal(true)}
          data-testid="toggle-calendar-modal"
        >
          <CalendarDays className="w-5 h-5 text-white" />
        </motion.button>
      </div>

      {/* Status Filter Tabs */}
      <motion.div 
        className="flex gap-2 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {['all', 'upcoming', 'completed'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`
              flex-1 py-2 px-4 rounded-xl transition-all duration-200
              ${filterType === type 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:sessions.${type}`)}
          </button>
        ))}
      </motion.div>

      {/* Video Filter Pills for Mobile */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {[
          { key: 'all', label: 'All', icon: Calendar },
          { key: 'with-recording', label: 'Video', icon: Video },
          { key: 'without-recording', label: 'No Video', icon: X },
          { key: 'completed-with-recording', label: 'Recorded', icon: PlayCircle }
        ].map(({ key, label, icon: Icon }) => (
          <motion.button
            key={key}
            whileTap={{ scale: 0.95 }}
            onClick={() => setVideoFilter(key)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1 ${
              videoFilter === key 
                ? 'bg-purple-500 text-white' 
                : 'bg-white/10 text-white/60 backdrop-blur'
            }`}
          >
            <Icon className="w-3 h-3" />
            {label}
          </motion.button>
        ))}
      </motion.div>

      {/* Sessions List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : sessions.length === 0 ? (
        <MobileCard className="text-center py-12">
          <Calendar className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noSessions')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {sessions.map((session, index) => (
            <motion.div
              key={session.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MobileCard 
                className="relative overflow-hidden"
                onClick={() => session.status === 'upcoming' && joinSession.mutate(session.id)}
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(session.status)}`} />
                
                <div className="pl-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        {session.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {session.courseTitle}
                      </p>
                    </div>
                    {session.type === 'group' && (
                      <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
                        <Users className="w-3 h-3 mr-1" />
                        {session.participants}/{session.maxParticipants}
                      </Badge>
                    )}
                  </div>

                  {/* Teacher Info */}
                  <div className="flex items-center gap-2 mb-3">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-400 to-pink-400 flex items-center justify-center text-white text-xs font-bold">
                      {session.teacherName[0]}
                    </div>
                    <span className="text-white/80 text-sm">
                      {session.teacherName}
                    </span>
                  </div>

                  {/* Enhanced Date Display */}
                  <div className="mb-3">
                    <EnhancedDateDisplay
                      date={session.sessionDate || session.date}
                      time={session.startTime || session.time}
                      showBoth={true}
                      compact={true}
                      primary="auto"
                      calendarContext={session.calendarContext}
                      className="text-white/70 text-sm"
                    />
                  </div>

                  {/* Holiday and Exam Indicators */}
                  <div className="flex gap-2 flex-wrap mb-3">
                    {session.holidays && session.holidays.length > 0 && (
                      <HolidayIndicator 
                        holidays={session.holidays} 
                        compact={true}
                      />
                    )}
                    
                    {session.examType && (
                      <ExamTypeIndicator 
                        examType={session.examType} 
                        compact={true}
                      />
                    )}
                  </div>

                  {/* Additional Session Details */}
                  {session.location && (
                    <div className="flex items-center gap-2 mb-3">
                      <MapPin className="w-4 h-4 text-white/50" />
                      <span className="text-white/70 text-sm">
                        {session.location}
                      </span>
                    </div>
                  )}

                  {/* Action Button */}
                  {session.status === 'upcoming' && (
                    <motion.button
                      className="w-full py-2 bg-white/20 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                    >
                      {session.meetingUrl ? (
                        <>
                          <Video className="w-4 h-4" />
                          {t('student:joinSession')}
                        </>
                      ) : (
                        <>
                          <MapPin className="w-4 h-4" />
                          {t('student:viewDetails')}
                        </>
                      )}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {session.status === 'ongoing' && (
                    <div className="flex items-center justify-center py-2 bg-green-500/20 rounded-lg">
                      <div className="flex items-center gap-2 text-green-300">
                        <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                        <span className="text-sm font-medium">
                          {t('student:sessionOngoing')}
                        </span>
                      </div>
                    </div>
                  )}

                  {session.status === 'completed' && (
                    <div className="text-center py-2 text-white/50 text-sm">
                      {t('student:sessionCompleted')}
                    </div>
                  )}
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Calendar Modal */}
      <AnimatePresence>
        {showCalendarModal && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowCalendarModal(false)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-h-[80vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold text-gray-800">
                  {t('student:calendar', 'Calendar')}
                </h2>
                <button
                  onClick={() => setShowCalendarModal(false)}
                  className="p-2 rounded-full hover:bg-gray-100"
                  data-testid="close-calendar-modal"
                >
                  <X className="w-5 h-5 text-gray-600" />
                </button>
              </div>

              {/* Calendar Content */}
              <div className="p-4">
                <SessionCalendarSidebar
                  sessions={sessions}
                  selectedDate={selectedDate}
                  onDateSelect={handleCalendarDateSelect}
                  onSessionFilter={handleCalendarSessionFilter}
                  compact={false}
                  className="bg-transparent border-0 shadow-none"
                />
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}