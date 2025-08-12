import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Calendar, Clock, Video, Users, MapPin, Play, ChevronRight, Filter } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

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
}

export default function StudentSessionsMobile() {
  const { t } = useTranslation();
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed'>('upcoming');

  // Fetch sessions
  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/student/sessions', filterType],
    queryFn: async () => {
      const response = await fetch(`/api/student/sessions?filter=${filterType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch sessions');
      return response.json();
    }
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

  return (
    <MobileLayout
      title={t('student:sessions')}
      showBack={false}
      gradient="cool"
    >
      {/* Filter Tabs */}
      <motion.div 
        className="flex gap-2 mb-6"
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

                  {/* Session Details */}
                  <div className="flex flex-wrap gap-4 mb-3">
                    <div className="flex items-center gap-2">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-white/70 text-sm">
                        {formatDate(session.date)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-white/70 text-sm">
                        {session.time} ({session.duration} {t('common:minutes')})
                      </span>
                    </div>
                    {session.location && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4 text-white/50" />
                        <span className="text-white/70 text-sm">
                          {session.location}
                        </span>
                      </div>
                    )}
                  </div>

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
    </MobileLayout>
  );
}