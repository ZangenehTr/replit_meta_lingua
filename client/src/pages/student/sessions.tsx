import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Calendar, Clock, Video, Users, User, Play, ChevronRight, Search,
  MapPin, Globe, Headphones, BookOpen, X, CheckCircle, AlertCircle,
  CalendarDays, Eye, EyeOff, Filter, Wifi, WifiOff
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
  holidays?: Array<{ id: number; name: string; namePersian: string; nameArabic?: string; type: string; description: string; descriptionPersian?: string; isOfficialHoliday: boolean; color: string }>;
  culturalEvents?: Array<{ id: number; eventName: string; eventNamePersian: string; eventType: string; description: string; importance: string; color: string }>;
  calendarContext?: { persianDate: string; gregorianDate: string; culturalSignificance?: string };
  hasRecording?: boolean;
  recordingUrl?: string;
  recordingDuration?: number;
  thumbnailUrl?: string;
  recordingQuality?: 'HD' | 'SD' | 'FHD';
  recordingStatus?: 'none' | 'processing' | 'ready' | 'error';
  recordingMetadata?: { duration: number; fileSize: string; uploadDate: string; quality: 'HD' | 'SD' | 'FHD'; thumbnailUrl: string; videoUrl: string; viewingProgress?: number };
  viewingHistory?: { lastWatched: string; completionPercentage: number; bookmarks: Array<{ timestamp: number; title: string }>; notes: Array<{ timestamp: number; content: string }> };
}

export default function StudentSessions() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const isRTL = ['fa', 'ar'].includes(i18n.language);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('upcoming');
  const [videoFilter, setVideoFilter] = useState<string>('all');
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [showCalendarSidebar, setShowCalendarSidebar] = useState(false);
  const [filteredSessionIds, setFilteredSessionIds] = useState<number[]>([]);

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/student/sessions', { includeCalendar: showCalendarSidebar, includeVideo: true, filter: videoFilter }],
    queryFn: async () => {
      const params = new URLSearchParams({
        includeCalendar: showCalendarSidebar ? 'true' : 'false',
        includeVideo: 'true',
        ...(videoFilter !== 'all' && { filter: videoFilter })
      });
      const response = await fetch(`/api/student/sessions?${params}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) return [];
      return response.json();
    },
    refetchOnWindowFocus: false,
  });

  const joinSessionMutation = useMutation({
    mutationFn: async (sessionId: number) => {
      const response = await fetch(`/api/student/sessions/${sessionId}/join`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to join session');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionUrl) window.open(data.sessionUrl, '_blank');
      toast({ title: t('student:joiningSession', 'در حال پیوستن...'), description: t('student:sessionStarting', 'جلسه در یک پنجره جدید باز می‌شود') });
    },
    onError: () => {
      toast({ title: t('common:error', 'خطا'), description: t('student:joinError', 'امکان پیوستن وجود ندارد'), variant: 'destructive' });
    }
  });

  const videoProgressMutation = useMutation({
    mutationFn: async ({ sessionId, progressSeconds, totalDuration, completed }: { sessionId: number; progressSeconds: number; totalDuration: number; completed: boolean }) => {
      const response = await fetch(`/api/sessions/${sessionId}/video/progress`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` },
        body: JSON.stringify({ progressSeconds, totalDuration, completed })
      });
      if (!response.ok) throw new Error('Failed to update video progress');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/sessions'] });
    }
  });

  const handleVideoPlay = (sessionId: number) => {
    const session = sessions.find(s => s.id === sessionId);
    if (session?.hasRecording && session.recordingUrl) {
      window.open(`/student/video-player?sessionId=${sessionId}`, '_blank');
      toast({ title: t('student:openingVideo', 'باز کردن ویدیو'), description: t('student:videoStarting', 'ویدیو در حال باز شدن است') });
    }
  };

  const handleJoinSession = (sessionId: number) => joinSessionMutation.mutate(sessionId);

  const handleCalendarDateSelect = (date: Date) => setSelectedDate(date);
  const handleCalendarSessionFilter = (sessionIds: number[]) => setFilteredSessionIds(sessionIds);

  const filteredSessions = sessions.filter(session => {
    const matchesSearch = session.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      session.courseName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${session.tutorFirstName} ${session.tutorLastName}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === 'all' || session.status === filterStatus;
    const matchesCalendarFilter = filteredSessionIds.length === 0 || filteredSessionIds.includes(session.id);
    return matchesSearch && matchesStatus && matchesCalendarFilter;
  });

  const groupedSessions = filteredSessions.reduce((groups, session) => {
    const date = new Date(session.sessionDate).toDateString();
    if (!groups[date]) groups[date] = [];
    groups[date].push(session);
    return groups;
  }, {} as Record<string, Session[]>);

  const upcomingSessions = sessions.filter(s => s.status === 'upcoming');
  const ongoingSessions = sessions.filter(s => s.status === 'ongoing');
  const completedSessions = sessions.filter(s => s.status === 'completed');

  const formatTime = (time: string) => new Date(`2000-01-01T${time}`).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  const statusFilters = [
    { key: 'all', label: 'همه', icon: CalendarDays },
    { key: 'upcoming', label: 'پیش رو', icon: Clock },
    { key: 'ongoing', label: 'در جریان', icon: Wifi },
    { key: 'completed', label: 'انجام‌شده', icon: CheckCircle },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Top Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('student:sessions', 'جلسات')}</h1>
              <p className="text-xs text-gray-500 mt-0.5">{sessions.length} {t('student:totalSessions', 'جلسه ثبت‌شده')}</p>
            </div>
            <div className="flex gap-2">
              <button
                onClick={() => setShowCalendarSidebar(!showCalendarSidebar)}
                className={`p-2.5 rounded-xl transition-all ${showCalendarSidebar ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <CalendarDays className="w-5 h-5" />
              </button>
              <button
                onClick={() => setVideoFilter(videoFilter === 'all' ? 'with-recording' : 'all')}
                className={`p-2.5 rounded-xl transition-all ${videoFilter !== 'all' ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
              >
                <Video className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('student:searchSessions', 'جستجو در جلسات...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:bg-white transition-all`}
            />
          </div>

          {/* Status Filter Pills */}
          <div className="flex gap-2 mt-3 overflow-x-auto pb-1 scrollbar-hide">
            {statusFilters.map(({ key, label, icon: Icon }) => (
              <button
                key={key}
                onClick={() => setFilterStatus(key)}
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                {label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stats Row */}
      <div className="px-4 pt-4 pb-2 grid grid-cols-3 gap-3">
        {[
          { label: 'پیش رو', count: upcomingSessions.length, color: 'indigo', icon: Clock },
          { label: 'در جریان', count: ongoingSessions.length, color: 'emerald', icon: Wifi },
          { label: 'انجام‌شده', count: completedSessions.length, color: 'gray', icon: CheckCircle },
        ].map(({ label, count, color, icon: Icon }) => (
          <div key={label} className="bg-white rounded-2xl p-3 shadow-sm border border-gray-100">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center mb-2 ${
              color === 'indigo' ? 'bg-indigo-50' : color === 'emerald' ? 'bg-emerald-50' : 'bg-gray-100'
            }`}>
              <Icon className={`w-4 h-4 ${
                color === 'indigo' ? 'text-indigo-600' : color === 'emerald' ? 'text-emerald-600' : 'text-gray-500'
              }`} />
            </div>
            <p className="text-2xl font-bold text-gray-900">{count}</p>
            <p className="text-xs text-gray-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Main Content */}
      <div className="px-4 pb-24">
        {/* Calendar Sidebar Overlay */}
        <AnimatePresence>
          {showCalendarSidebar && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-4"
            >
              <SessionCalendarSidebar
                sessions={sessions}
                selectedDate={selectedDate}
                onDateSelect={handleCalendarDateSelect}
                onSessionFilter={handleCalendarSessionFilter}
                compact={true}
                className="shadow-lg rounded-2xl"
              />
            </motion.div>
          )}
        </AnimatePresence>

        {isLoading ? (
          <div className="space-y-3 mt-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-3 bg-gray-200 rounded w-full mb-2" />
                <div className="h-9 bg-gray-200 rounded-xl w-full" />
              </div>
            ))}
          </div>
        ) : Object.keys(groupedSessions).length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mt-8 flex flex-col items-center justify-center text-center py-16"
          >
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <Calendar className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('student:noSessions', 'جلسه‌ای یافت نشد')}</h3>
            <p className="text-sm text-gray-400 max-w-xs">{t('student:noSessionsDesc', 'هیچ جلسه‌ای با این فیلتر وجود ندارد')}</p>
          </motion.div>
        ) : (
          <div className="space-y-6 mt-4">
            {Object.entries(groupedSessions).map(([date, dateSessions], groupIndex) => (
              <motion.div
                key={date}
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: groupIndex * 0.08 }}
              >
                <div className="flex items-center gap-2 mb-3 px-1">
                  <div className="w-1.5 h-5 bg-indigo-500 rounded-full" />
                  <EnhancedDateDisplay
                    date={date}
                    showBoth={true}
                    compact={false}
                    primary="auto"
                    className="text-gray-700 font-semibold text-sm"
                    calendarContext={{
                      persianDate: dateSessions[0]?.calendarContext?.persianDate || '',
                      gregorianDate: dateSessions[0]?.calendarContext?.gregorianDate || '',
                      culturalSignificance: dateSessions[0]?.calendarContext?.culturalSignificance
                    }}
                  />
                </div>
                <div className="space-y-3">
                  {dateSessions.map(session => (
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
            ))}
          </div>
        )}
      </div>

      {/* Session Detail Modal */}
      <AnimatePresence>
        {selectedSession && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end"
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
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={e => e.stopPropagation()}
            >
              {/* Pull Handle */}
              <div className="flex justify-center pt-3 pb-2">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>

              {/* Modal Header */}
              <div className="px-5 pb-4 flex items-start justify-between border-b border-gray-100">
                <div className="flex-1 pe-4">
                  <h2 className="text-lg font-bold text-gray-900">{selectedSession.title}</h2>
                  <p className="text-sm text-indigo-600 font-medium mt-0.5">{selectedSession.courseName}</p>
                </div>
                <button onClick={() => setSelectedSession(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {/* Tutor */}
                <div className="flex items-center gap-3 bg-indigo-50 p-3 rounded-2xl">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-400 to-violet-500 flex items-center justify-center text-white font-bold text-sm flex-shrink-0">
                    {selectedSession.tutorFirstName?.[0]}{selectedSession.tutorLastName?.[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">{selectedSession.tutorFirstName} {selectedSession.tutorLastName}</p>
                    <p className="text-xs text-indigo-600">{t('student:instructor', 'مدرس')}</p>
                  </div>
                </div>

                {/* Date & Time */}
                <div className="bg-gray-50 p-4 rounded-2xl space-y-2">
                  <EnhancedDateDisplay
                    date={selectedSession.sessionDate}
                    time={selectedSession.startTime}
                    showBoth={true}
                    compact={false}
                    primary="auto"
                    calendarContext={selectedSession.calendarContext}
                  />
                  <div className="flex gap-2 flex-wrap pt-1">
                    {selectedSession.holidays && selectedSession.holidays.length > 0 && (
                      <HolidayIndicator holidays={selectedSession.holidays} compact={false} />
                    )}
                    {selectedSession.examType && (
                      <ExamTypeIndicator examType={selectedSession.examType} compact={false} />
                    )}
                  </div>
                </div>

                {/* Info Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('student:type', 'نوع')}</p>
                    <p className="font-semibold text-gray-800 text-sm capitalize">
                      {selectedSession.type === 'group' ? 'گروهی' : 'خصوصی'}
                    </p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-xl">
                    <p className="text-xs text-gray-500 mb-1">{t('student:duration', 'مدت')}</p>
                    <p className="font-semibold text-gray-800 text-sm">{selectedSession.duration} {t('student:minutes', 'دقیقه')}</p>
                  </div>
                </div>

                {selectedSession.description && (
                  <div className="bg-gray-50 p-4 rounded-2xl">
                    <p className="text-xs text-gray-500 mb-1">{t('student:description', 'توضیحات')}</p>
                    <p className="text-sm text-gray-800">{selectedSession.description}</p>
                  </div>
                )}

                {selectedSession.location && (
                  <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-xl">
                    <MapPin className="w-4 h-4 text-gray-500" />
                    <p className="text-sm text-gray-700">{selectedSession.location}</p>
                  </div>
                )}

                {/* Status Actions */}
                {selectedSession.canJoin && selectedSession.status === 'ongoing' && (
                  <Button
                    onClick={() => { joinSessionMutation.mutate(selectedSession.id); setSelectedSession(null); }}
                    disabled={joinSessionMutation.isPending}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl py-3 h-auto font-semibold"
                  >
                    <Video className="w-4 h-4 me-2" />
                    {joinSessionMutation.isPending ? t('student:joining', 'در حال پیوستن...') : t('student:joinSession', 'پیوستن به جلسه')}
                  </Button>
                )}

                {selectedSession.status === 'upcoming' && (
                  <div className="bg-blue-50 border border-blue-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-blue-800 mb-1">
                      <Clock className="w-4 h-4" />
                      <p className="font-semibold text-sm">{t('student:sessionNotStarted', 'جلسه هنوز شروع نشده')}</p>
                    </div>
                    <p className="text-blue-600 text-xs">{t('student:sessionWillStart', 'جلسه ساعت')} {formatTime(selectedSession.startTime)} {t('student:willStart', 'شروع می‌شود')}</p>
                  </div>
                )}

                {selectedSession.status === 'completed' && (
                  <div className="bg-emerald-50 border border-emerald-100 p-4 rounded-2xl">
                    <div className="flex items-center gap-2 text-emerald-700 mb-1">
                      <CheckCircle className="w-4 h-4" />
                      <p className="font-semibold text-sm">{t('student:sessionCompleted', 'جلسه انجام شد')}</p>
                    </div>
                    <p className="text-emerald-600 text-xs">{t('student:sessionEndedAt', 'جلسه ساعت')} {formatTime(selectedSession.endTime)} {t('student:ended', 'پایان یافت')}</p>
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
