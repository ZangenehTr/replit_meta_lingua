import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Calendar,
  Clock,
  Video,
  Users,
  User,
  Play,
  ChevronRight,
  Filter,
  Search,
  MapPin,
  Globe,
  Headphones,
  BookOpen,
  X,
  Info,
  CheckCircle,
  AlertCircle,
  Sidebar,
  CalendarDays,
  Eye,
  EyeOff
} from "lucide-react";
import { Link } from "wouter";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { HolidayIndicator } from "@/components/ui/holiday-indicator";
import { ExamTypeIndicator } from "@/components/ui/exam-type-indicator";
import { EnhancedDateDisplay } from "@/components/ui/enhanced-date-display";
import { SessionCalendarSidebar } from "@/components/ui/session-calendar-sidebar";
import { VideoSessionCard } from "@/components/sessions/VideoSessionCard";

interface Holiday {
  id: number;
  name: string;
  namePersian: string;
  nameArabic?: string;
  type: string;
  description: string;
  descriptionPersian?: string;
  isOfficialHoliday: boolean;
  color: string;
}

interface CulturalEvent {
  id: number;
  eventName: string;
  eventNamePersian: string;
  eventType: string;
  description: string;
  importance: string;
  color: string;
}

interface CalendarContext {
  persianDate: string;
  gregorianDate: string;
  culturalSignificance?: string;
}

interface Session {
  id: number;
  title: string;
  courseName: string;
  tutorFirstName: string;
  tutorLastName: string;
  tutorAvatar?: string;
  sessionDate: string;
  startTime: string;
  endTime: string;
  duration: number;
  type: 'group' | 'individual';
  status: 'upcoming' | 'ongoing' | 'completed' | 'cancelled';
  location?: string;
  sessionUrl?: string;
  canJoin: boolean;
  participants?: number;
  maxParticipants?: number;
  description?: string;
  language: string;
  level: string;
  examType?: 'midterm' | 'final' | null;
  holidays?: Holiday[];
  culturalEvents?: CulturalEvent[];
  calendarContext?: CalendarContext;
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

export default function StudentSessions() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<string>('upcoming');
  const [videoFilter, setVideoFilter] = useState<string>('all'); // 'all', 'with-recording', 'without-recording', 'completed-with-recording'
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarSidebar, setShowCalendarSidebar] = useState(false);
  const [filteredSessionIds, setFilteredSessionIds] = useState<number[]>([]);

  // Fetch sessions with calendar and video data
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/student/sessions', { includeCalendar: true, includeVideo: true, filter: videoFilter }],
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
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Join session mutation
  const joinSessionMutation = useMutation({
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
      if (data.sessionUrl) {
        window.open(data.sessionUrl, '_blank');
      }
      toast({
        title: t('student:joiningSession', 'Joining Session'),
        description: t('student:sessionStarting', 'The session is starting in a new window'),
      });
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:joinError', 'Failed to join session'),
        variant: 'destructive'
      });
    }
  });

  // Video progress tracking mutation
  const videoProgressMutation = useMutation({
    mutationFn: async ({ sessionId, progressSeconds, totalDuration, completed }: {
      sessionId: number;
      progressSeconds: number;
      totalDuration: number;
      completed: boolean;
    }) => {
      const response = await fetch(`/api/sessions/${sessionId}/video/progress`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ progressSeconds, totalDuration, completed })
      });
      if (!response.ok) throw new Error('Failed to update video progress');
      return response.json();
    },
    onSuccess: () => {
      // Invalidate sessions cache to update progress
      queryClient.invalidateQueries({ queryKey: ['/api/student/sessions'] });
    }
  });

  // Video playback handler
  const handleVideoPlay = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.hasRecording && session.recordingUrl) {
      // Navigate to video player page with session context
      window.open(`/student/video-player?sessionId=${sessionId}`, '_blank');
      
      toast({
        title: t('student:openingVideo', 'Opening Video'),
        description: t('student:videoStarting', 'The session video is opening'),
      });
    }
  };

  // Session join handler
  const handleJoinSession = (sessionId: number) => {
    joinSessionMutation.mutate(sessionId);
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         session.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         `${session.tutorFirstName} ${session.tutorLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesType = filterType === 'all' || session.type === filterType;
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesCalendarFilter = filteredSessionIds.length === 0 || filteredSessionIds.includes(session.id);
    return matchesSearch && matchesType && matchesStatus && matchesCalendarFilter;
  });

  // Handle calendar date selection
  const handleCalendarDateSelect = (date: Date) => {
    setSelectedDate(date);
  };

  // Handle calendar session filtering
  const handleCalendarSessionFilter = (sessionIds: number[]) => {
    setFilteredSessionIds(sessionIds);
  };

  // Group sessions by date
  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = new Date(session.sessionDate).toDateString();
    if (!groups[date]) {
      groups[date] = [];
    }
    groups[date].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  // Get session counts
  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const ongoingSessions = sessions.filter(s => s.status === 'ongoing');
  const completedSessions = sessions.filter(s => s.status === 'completed');

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

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Header */}
        <motion.header 
          className="mobile-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-bold text-xl">{t('student:sessions', 'Sessions')}</h1>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className={`p-2 rounded-full backdrop-blur transition-all ${
                  showCalendarSidebar ? 'bg-white text-purple-600' : 'bg-white/10 text-white'
                }`}
                onClick={() => setShowCalendarSidebar(!showCalendarSidebar)}
                data-testid="toggle-calendar-sidebar"
              >
                {showCalendarSidebar ? <EyeOff className="w-5 h-5" /> : <CalendarDays className="w-5 h-5" />}
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white/10 backdrop-blur"
                onClick={() => setFilterStatus(filterStatus === 'all' ? 'upcoming' : 'all')}
              >
                <Filter className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder={t('student:searchSessions', 'Search sessions...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
            {['all', 'upcoming', 'ongoing', 'completed'].map((status) => (
              <motion.button
                key={status}
                whileTap={{ scale: 0.95 }}
                onClick={() => setFilterStatus(status)}
                className={`px-4 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  filterStatus === status 
                    ? 'bg-white text-purple-600' 
                    : 'bg-white/10 text-white/70 backdrop-blur'
                }`}
              >
                {t(`student:status.${status}`, status.charAt(0).toUpperCase() + status.slice(1))}
              </motion.button>
            ))}
          </div>

          {/* Video Filter Pills */}
          <div className="flex gap-2 mt-2 overflow-x-auto pb-2">
            {[
              { key: 'all', label: 'All Sessions', icon: Calendar },
              { key: 'with-recording', label: 'With Video', icon: Video },
              { key: 'without-recording', label: 'No Video', icon: X },
              { key: 'completed-with-recording', label: 'Recorded', icon: Play }
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
                {t(`student:videoFilter.${key}`, label)}
              </motion.button>
            ))}
          </div>
        </motion.header>

        {/* Calendar Sidebar */}
        <AnimatePresence>
          {showCalendarSidebar && (
            <motion.div
              initial={{ x: -300, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -300, opacity: 0 }}
              transition={{ duration: 0.3, type: "spring", stiffness: 300, damping: 30 }}
              className="fixed left-4 top-20 z-40 max-h-[calc(100vh-6rem)] overflow-y-auto"
            >
              <SessionCalendarSidebar
                sessions={sessions}
                selectedDate={selectedDate}
                onDateSelect={handleCalendarDateSelect}
                onSessionFilter={handleCalendarSessionFilter}
                compact={true}
                className="shadow-xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Main Content */}
        <div className={`mobile-content transition-all duration-300 ${
          showCalendarSidebar ? 'ml-96' : 'ml-0'
        }`}>
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4">
                  <div className="skeleton h-6 w-3/4 mb-2 rounded" />
                  <div className="skeleton h-4 w-1/2 mb-3 rounded" />
                  <div className="skeleton h-10 w-full rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              {/* Stats Overview */}
              <motion.div 
                className="grid grid-cols-3 gap-3 mb-6"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
              >
                <div className="glass-card p-3 text-center">
                  <Clock className="w-6 h-6 text-blue-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{upcomingSessions.length}</p>
                  <p className="text-white/70 text-xs">{t('student:upcoming', 'Upcoming')}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <Play className="w-6 h-6 text-green-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{ongoingSessions.length}</p>
                  <p className="text-white/70 text-xs">{t('student:ongoing', 'Ongoing')}</p>
                </div>
                <div className="glass-card p-3 text-center">
                  <CheckCircle className="w-6 h-6 text-gray-300 mx-auto mb-1" />
                  <p className="text-white text-2xl font-bold">{completedSessions.length}</p>
                  <p className="text-white/70 text-xs">{t('student:completed', 'Completed')}</p>
                </div>
              </motion.div>

              {/* Sessions List Grouped by Date */}
              <div className="space-y-6 mb-20">
                {Object.keys(groupedSessions).length === 0 ? (
                  <motion.div 
                    className="glass-card p-8 text-center"
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3 }}
                  >
                    <Calendar className="w-16 h-16 text-white/50 mx-auto mb-4" />
                    <p className="text-white/70">{t('student:noSessions', 'No sessions found')}</p>
                  </motion.div>
                ) : (
                  Object.entries(groupedSessions).map(([date, dateSessions], groupIndex) => (
                    <motion.div
                      key={date}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.3, delay: groupIndex * 0.1 }}
                    >
                      <div className="mb-3 px-2">
                        <EnhancedDateDisplay
                          date={date}
                          showBoth={true}
                          compact={false}
                          primary="auto"
                          className="text-white/90"
                          calendarContext={{
                            persianDate: dateSessions[0]?.calendarContext?.persianDate || '',
                            gregorianDate: dateSessions[0]?.calendarContext?.gregorianDate || '',
                            culturalSignificance: dateSessions[0]?.calendarContext?.culturalSignificance
                          }}
                        />
                      </div>
                      
                      <div className="space-y-3">
                        {dateSessions.map((session, index) => (
                          <VideoSessionCard
                            key={session.id}
                            session={session}
                            onSessionClick={setSelectedSession}
                            onVideoPlay={handleVideoPlay}
                            onJoinSession={handleJoinSession}
                          />
                        ))}
                      </div>
                    </motion.div>
                  ))
                )}
              </div>
            </>
          )}
        </div>
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedSession(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{selectedSession.title}</h2>
                <button
                  onClick={() => setSelectedSession(null)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-purple-400 to-blue-500 flex items-center justify-center text-white font-bold">
                    {selectedSession.tutorFirstName[0]}{selectedSession.tutorLastName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{selectedSession.tutorFirstName} {selectedSession.tutorLastName}</p>
                    <p className="text-sm text-gray-600">{t('student:instructor', 'Instructor')}</p>
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="mb-3">
                    <p className="text-sm text-gray-600 mb-2">{t('student:sessionDateTime', 'Date & Time')}</p>
                    <EnhancedDateDisplay
                      date={selectedSession.sessionDate}
                      time={selectedSession.startTime}
                      showBoth={true}
                      compact={false}
                      primary="auto"
                      calendarContext={selectedSession.calendarContext}
                    />
                  </div>
                  
                  {/* Holiday and Exam Indicators in Modal */}
                  <div className="flex gap-2 flex-wrap">
                    {selectedSession.holidays && selectedSession.holidays.length > 0 && (
                      <HolidayIndicator 
                        holidays={selectedSession.holidays} 
                        compact={false}
                      />
                    )}
                    
                    {selectedSession.examType && (
                      <ExamTypeIndicator 
                        examType={selectedSession.examType} 
                        compact={false}
                      />
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t('student:type', 'Type')}</p>
                    <p className="font-medium capitalize">{selectedSession.type}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t('student:duration', 'Duration')}</p>
                    <p className="font-medium">{selectedSession.duration} {t('student:minutes', 'minutes')}</p>
                  </div>
                </div>

                {selectedSession.description && (
                  <div>
                    <p className="text-sm text-gray-600 mb-1">{t('student:description', 'Description')}</p>
                    <p className="text-gray-800">{selectedSession.description}</p>
                  </div>
                )}

                {selectedSession.location && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                    <MapPin className="w-5 h-5 text-gray-600" />
                    <div>
                      <p className="text-sm text-gray-600">{t('student:location', 'Location')}</p>
                      <p className="font-medium">{selectedSession.location}</p>
                    </div>
                  </div>
                )}

                {selectedSession.type === 'group' && (
                  <div className="flex items-center gap-2 p-3 bg-blue-50 rounded-lg">
                    <Users className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="text-sm text-blue-600">{t('student:participants', 'Participants')}</p>
                      <p className="font-medium text-blue-700">
                        {selectedSession.participants || 0} / {selectedSession.maxParticipants || 10}
                      </p>
                    </div>
                  </div>
                )}

                {selectedSession.canJoin && selectedSession.status === 'ongoing' && (
                  <Button
                    onClick={() => {
                      joinSessionMutation.mutate(selectedSession.id);
                      setSelectedSession(null);
                    }}
                    disabled={joinSessionMutation.isPending}
                    className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    <Video className="w-4 h-4 mr-2" />
                    {joinSessionMutation.isPending 
                      ? t('student:joining', 'Joining...') 
                      : t('student:joinSession', 'Join Session')}
                  </Button>
                )}

                {selectedSession.status === 'upcoming' && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-blue-800">
                      <Info className="w-5 h-5" />
                      <p className="font-medium">{t('student:sessionNotStarted', 'Session Not Started')}</p>
                    </div>
                    <p className="text-blue-700 text-sm mt-1">
                      {t('student:sessionWillStart', 'This session will start at')} {formatTime(selectedSession.startTime)}
                    </p>
                  </div>
                )}

                {selectedSession.status === 'completed' && (
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center gap-2 text-gray-700">
                      <CheckCircle className="w-5 h-5" />
                      <p className="font-medium">{t('student:sessionCompleted', 'Session Completed')}</p>
                    </div>
                    <p className="text-gray-600 text-sm mt-1">
                      {t('student:sessionEndedAt', 'This session ended at')} {formatTime(selectedSession.endTime)}
                    </p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}