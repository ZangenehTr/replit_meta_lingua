import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Megaphone, Target, Users, CheckCircle, Clock, TrendingUp } from "lucide-react";

type Campaign = {
  id: number;
  name?: string;
  title?: string;
  status?: string;
  targetCount?: number;
  reachedCount?: number;
  convertedCount?: number;
  startDate?: string;
  endDate?: string;
  type?: string;
  description?: string;
};

export default function CampaignsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();

  const { data: campaigns = [], isLoading } = useQuery<Campaign[]>({
    queryKey: ['/api/admin/campaigns'],
  });

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'active': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('callcenter:campaigns.active', 'فعال')}</Badge>;
      case 'completed': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('callcenter:campaigns.completed', 'تکمیل')}</Badge>;
      case 'paused': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('callcenter:campaigns.paused', 'متوقف')}</Badge>;
      case 'draft': return <Badge variant="secondary">{t('callcenter:campaigns.draft', 'پیش‌نویس')}</Badge>;
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

  const totalTargets = campaigns.reduce((sum, c) => sum + (c.targetCount ?? 0), 0);
  const totalReached = campaigns.reduce((sum, c) => sum + (c.reachedCount ?? 0), 0);
  const totalConverted = campaigns.reduce((sum, c) => sum + (c.convertedCount ?? 0), 0);

  const summaryStats = [
    { label: t('callcenter:campaigns.total', 'کل کمپین‌ها'), value: campaigns.length, icon: Megaphone, color: 'text-blue-500' },
    { label: t('callcenter:campaigns.active', 'فعال'), value: campaigns.filter(c => c.status === 'active').length, icon: TrendingUp, color: 'text-green-500' },
    { label: t('callcenter:campaigns.totalReached', 'دسترسی'), value: totalReached, icon: Users, color: 'text-purple-500' },
    { label: t('callcenter:campaigns.totalConverted', 'تبدیل‌شده'), value: totalConverted, icon: CheckCircle, color: 'text-yellow-500' },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          {t('callcenter:campaigns.title', 'کمپین‌های بازاریابی')}
        </h1>
        <p className="text-gray-500 dark:text-gray-400 mt-1">
          {t('callcenter:campaigns.subtitle', 'مدیریت و پایش کمپین‌ها')}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
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
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2">
            <Megaphone className="h-5 w-5 text-blue-500" />
            {t('callcenter:campaigns.list', 'لیست کمپین‌ها')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-4">
              {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)}
            </div>
          ) : campaigns.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Megaphone className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('callcenter:campaigns.noCampaigns', 'کمپینی یافت نشد')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {campaigns.map((campaign) => {
                const reachRate = campaign.targetCount
                  ? Math.round(((campaign.reachedCount ?? 0) / campaign.targetCount) * 100)
                  : 0;
                return (
                  <div key={campaign.id} className="py-4 space-y-2">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                          {campaign.name ?? campaign.title ?? `کمپین #${campaign.id}`}
                        </p>
                        {campaign.description && (
                          <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{campaign.description}</p>
                        )}
                      </div>
                      {getStatusBadge(campaign.status)}
                    </div>
                    {campaign.targetCount != null && (
                      <div>
                        <div className="flex items-center justify-between text-xs text-gray-500 mb-1">
                          <span className="flex items-center gap-1">
                            <Target className="h-3 w-3" />
                            {campaign.reachedCount ?? 0} / {campaign.targetCount}
                          </span>
                          <span>{reachRate}%</span>
                        </div>
                        <Progress value={reachRate} className="h-1.5" />
                      </div>
                    )}
                    <div className="flex items-center gap-3 text-xs text-gray-400">
                      {campaign.startDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(campaign.startDate)}
                        </span>
                      )}
                      {campaign.type && (
                        <Badge variant="outline" className="text-xs">{campaign.type}</Badge>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
