import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Phone, PhoneIncoming, PhoneOutgoing, PhoneMissed, Clock, Search, User } from "lucide-react";
import { useState, useMemo } from "react";

type CallLog = {
  id: number;
  leadName?: string;
  phoneNumber?: string;
  direction?: string;
  duration?: number;
  status?: string;
  notes?: string;
  createdAt?: string;
  agentName?: string;
};

type CallStats = {
  totalCalls?: number;
  todayCalls?: number;
  missedCalls?: number;
};

export default function CallLogsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState('');

  const { data: callLogs = [], isLoading } = useQuery<CallLog[]>({
    queryKey: ['/api/call-logs'],
  });

  const { data: stats } = useQuery<CallStats>({
    queryKey: ['/api/callcenter/stats'],
  });

  const filtered = useMemo(() => {
    if (!search.trim()) return callLogs;
    const q = search.toLowerCase();
    return callLogs.filter((c) =>
      (c.leadName ?? '').toLowerCase().includes(q) ||
      (c.phoneNumber ?? '').toLowerCase().includes(q)
    );
  }, [callLogs, search]);

  const getDirectionIcon = (direction?: string) => {
    if (direction === 'inbound') return <PhoneIncoming className="h-4 w-4 text-green-500" />;
    if (direction === 'outbound') return <PhoneOutgoing className="h-4 w-4 text-blue-500" />;
    return <PhoneMissed className="h-4 w-4 text-red-500" />;
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'completed': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('callcenter:calls.completed', 'تکمیل')}</Badge>;
      case 'missed': return <Badge variant="destructive">{t('callcenter:calls.missed', 'ازدست‌رفته')}</Badge>;
      case 'busy': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('callcenter:calls.busy', 'مشغول')}</Badge>;
      default: return <Badge variant="secondary">{status ?? '—'}</Badge>;
    }
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return '—';
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${String(s).padStart(2, '0')}`;
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
    { label: t('callcenter:calls.total', 'کل تماس‌ها'), value: stats?.totalCalls ?? callLogs.length, icon: Phone, color: 'text-blue-500' },
    { label: t('callcenter:calls.todayCalls', 'تماس‌های امروز'), value: stats?.todayCalls ?? '—', icon: PhoneOutgoing, color: 'text-green-500' },
    { label: t('callcenter:calls.missed', 'ازدست‌رفته'), value: stats?.missedCalls ?? callLogs.filter(c => c.status === 'missed').length, icon: PhoneMissed, color: 'text-red-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('callcenter:calls.title', 'گزارش تماس‌ها')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('callcenter:calls.subtitle', 'تاریخچه و وضعیت تماس‌ها')}
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
          <CardTitle className="text-base flex items-center gap-2">
            <Phone className="h-5 w-5 text-blue-500" />
            {t('callcenter:calls.log', 'گزارش تماس')}
          </CardTitle>
          <div className="relative mt-2">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('callcenter:calls.search', 'جستجوی تماس...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(6)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Phone className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('callcenter:calls.noCalls', 'تماسی یافت نشد')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((call) => (
                <div key={call.id} className="py-3 flex items-center gap-3">
                  <div className="shrink-0">
                    {getDirectionIcon(call.direction)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <div className="flex items-center gap-2">
                        <User className="h-3.5 w-3.5 text-gray-400 shrink-0" />
                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                          {call.leadName ?? call.phoneNumber ?? `تماس #${call.id}`}
                        </p>
                      </div>
                      {getStatusBadge(call.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {call.phoneNumber && <span>{call.phoneNumber}</span>}
                      <span className="flex items-center gap-1">
                        <Clock className="h-3 w-3" />
                        {formatDuration(call.duration)}
                      </span>
                      <span>{formatDate(call.createdAt)}</span>
                    </div>
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
