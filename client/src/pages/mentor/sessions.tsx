import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { useAuth } from "@/hooks/use-auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, Users, CheckCircle, Video, MessageSquare } from "lucide-react";
import { useState } from "react";

type Session = {
  id: number;
  studentName?: string;
  studentId?: number;
  date?: string;
  scheduledAt?: string;
  duration?: number;
  status?: string;
  topic?: string;
  notes?: string;
};

export default function MentorSessionsPage() {
  const { t } = useTranslation(['mentor', 'common']);
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const [filter, setFilter] = useState<'all' | 'upcoming' | 'completed'>('all');

  const { data: sessions = [], isLoading } = useQuery<Session[]>({
    queryKey: ['/api/mentor/sessions'],
    enabled: !!user?.id,
  });

  const filtered = sessions.filter((s) => {
    if (filter === 'upcoming') return s.status === 'scheduled' || s.status === 'upcoming';
    if (filter === 'completed') return s.status === 'completed';
    return true;
  });

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('mentor:sessions.completed', 'تکمیل‌شده')}</Badge>;
      case 'scheduled':
      case 'upcoming': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('mentor:sessions.upcoming', 'برنامه‌ریزی‌شده')}</Badge>;
      case 'cancelled': return <Badge variant="destructive">{t('mentor:sessions.cancelled', 'لغوشده')}</Badge>;
      default: return <Badge variant="secondary">{status ?? '—'}</Badge>;
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    try {
      return new Date(dateStr).toLocaleDateString('fa-IR');
    } catch {
      return dateStr;
    }
  };

  const summaryStats = [
    { label: t('mentor:sessions.total', 'کل جلسات'), value: sessions.length, icon: Calendar, color: 'text-blue-500' },
    { label: t('mentor:sessions.completedCount', 'تکمیل‌شده'), value: sessions.filter(s => s.status === 'completed').length, icon: CheckCircle, color: 'text-green-500' },
    { label: t('mentor:sessions.upcomingCount', 'برنامه‌ریزی‌شده'), value: sessions.filter(s => s.status === 'scheduled' || s.status === 'upcoming').length, icon: Clock, color: 'text-purple-500' },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('mentor:sessions.title', 'جلسات منتورینگ')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('mentor:sessions.subtitle', 'مدیریت و مشاهده جلسات شما')}
        </p>
      </div>

      <div className="grid grid-cols-3 gap-4">
        {summaryStats.map((stat) => (
          <Card key={stat.label}>
            <CardContent className="pt-4 pb-4 flex items-center gap-3">
              <stat.icon className={`h-8 w-8 ${stat.color}`} />
              <div>
                {isLoading ? <Skeleton className="h-6 w-10 mb-1" /> : (
                  <p className="text-xl font-bold text-gray-900 dark:text-white">{stat.value}</p>
                )}
                <p className="text-xs text-gray-500">{stat.label}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <CardTitle className="text-base flex items-center gap-2">
              <Video className="h-5 w-5 text-blue-500" />
              {t('mentor:sessions.list', 'لیست جلسات')}
            </CardTitle>
            <div className="flex gap-2">
              {(['all', 'upcoming', 'completed'] as const).map((f) => (
                <Button
                  key={f}
                  size="sm"
                  variant={filter === f ? 'default' : 'outline'}
                  onClick={() => setFilter(f)}
                >
                  {f === 'all' ? t('common:all', 'همه') : f === 'upcoming' ? t('mentor:sessions.upcoming', 'برنامه‌ریزی‌شده') : t('mentor:sessions.completed', 'تکمیل‌شده')}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Calendar className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('mentor:sessions.noSessions', 'جلسه‌ای یافت نشد')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((session) => (
                <div key={session.id} className="py-3 flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <Users className="h-4 w-4 text-gray-400 shrink-0" />
                      <span className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {session.studentName ?? `دانش‌آموز #${session.studentId}`}
                      </span>
                    </div>
                    {session.topic && (
                      <p className="text-xs text-gray-500 truncate mb-1">{session.topic}</p>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {formatDate(session.scheduledAt || session.date)}
                      </span>
                      {session.duration && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {session.duration} {t('common:minutes', 'دقیقه')}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="shrink-0">
                    {getStatusBadge(session.status)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
