import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Target, Search, Phone, TrendingUp, Users, Star, Filter, ArrowRight
} from "lucide-react";
import { useLocation } from "wouter";
import type { Lead } from "@shared/schema";

const PROSPECT_STATUSES = ['qualified', 'contacted'];

export default function ProspectsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [, setLocation] = useLocation();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/callcenter/prospects'],
  });

  const prospects = useMemo(() =>
    leads.filter((lead) => PROSPECT_STATUSES.includes(lead.status ?? '')),
    [leads]
  );

  const filtered = useMemo(() => {
    if (!search.trim()) return prospects;
    const q = search.toLowerCase();
    return prospects.filter((lead) =>
      `${lead.firstName ?? ''} ${lead.lastName ?? ''} ${lead.phone ?? ''} ${lead.email ?? ''}`.toLowerCase().includes(q)
    );
  }, [prospects, search]);

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'qualified': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">{t('callcenter:prospects.qualified', 'واجد شرایط')}</Badge>;
      case 'contacted': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('callcenter:prospects.contacted', 'تماس‌گرفته')}</Badge>;
      default: return <Badge variant="secondary">{status ?? '—'}</Badge>;
    }
  };

  const conversionRate = leads.length > 0
    ? Math.round((leads.filter(l => l.status === 'converted').length / leads.length) * 100)
    : 0;

  const summaryStats = [
    { label: t('callcenter:prospects.total', 'کل مشتریان بالقوه'), value: prospects.length, icon: Target, color: 'text-purple-500' },
    { label: t('callcenter:prospects.qualified', 'واجد شرایط'), value: prospects.filter(l => l.status === 'qualified').length, icon: Star, color: 'text-yellow-500' },
    { label: t('callcenter:prospects.contacted', 'تماس‌گرفته'), value: prospects.filter(l => l.status === 'contacted').length, icon: Phone, color: 'text-blue-500' },
    { label: t('callcenter:prospects.conversionRate', 'نرخ تبدیل'), value: `${conversionRate}%`, icon: TrendingUp, color: 'text-green-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('callcenter:prospects.title', 'مشتریان بالقوه')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('callcenter:prospects.subtitle', 'سرنخ‌های واجد شرایط برای تبدیل')}
          </p>
        </div>
        <Button onClick={() => setLocation('/callcenter/unified-workflow')} className="shrink-0">
          <ArrowRight className="h-4 w-4 me-2" />
          {t('callcenter:prospects.workflow', 'جریان یکپارچه')}
        </Button>
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
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Target className="h-5 w-5 text-purple-500" />
            {t('callcenter:prospects.conversionFunnel', 'قیف تبدیل')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {[
              { label: t('callcenter:leads.new', 'سرنخ‌های جدید'), count: leads.filter(l => l.status === 'new').length, total: leads.length, color: 'bg-blue-500' },
              { label: t('callcenter:leads.contacted', 'تماس‌گرفته'), count: leads.filter(l => l.status === 'contacted').length, total: leads.length, color: 'bg-yellow-500' },
              { label: t('callcenter:prospects.qualified', 'واجد شرایط'), count: leads.filter(l => l.status === 'qualified').length, total: leads.length, color: 'bg-purple-500' },
              { label: t('callcenter:leads.converted', 'تبدیل‌شده'), count: leads.filter(l => l.status === 'converted').length, total: leads.length, color: 'bg-green-500' },
            ].map((stage) => (
              <div key={stage.label} className="flex items-center gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400 w-28 shrink-0">{stage.label}</p>
                <div className="flex-1">
                  <Progress value={stage.total > 0 ? (stage.count / stage.total) * 100 : 0} className="h-2" />
                </div>
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 w-8 text-end shrink-0">{stage.count}</span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Users className="h-5 w-5 text-purple-500" />
            {t('callcenter:prospects.list', 'لیست مشتریان بالقوه')}
          </CardTitle>
          <div className="relative mt-2">
            <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
            <Input
              placeholder={t('callcenter:prospects.search', 'جستجو...')}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className={isRTL ? 'pr-9' : 'pl-9'}
            />
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <Target className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('callcenter:prospects.noProspects', 'مشتری بالقوه‌ای یافت نشد')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('callcenter:prospects.name', 'نام')}</TableHead>
                    <TableHead>{t('callcenter:prospects.phone', 'تلفن')}</TableHead>
                    <TableHead>{t('callcenter:prospects.status', 'وضعیت')}</TableHead>
                    <TableHead>{t('callcenter:prospects.source', 'منبع')}</TableHead>
                    <TableHead>{t('callcenter:prospects.date', 'تاریخ')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {`${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || `مشتری #${lead.id}`}
                      </TableCell>
                      <TableCell>
                        {lead.phone ? (
                          <a href={`tel:${lead.phone}`} className="flex items-center gap-1 text-blue-600 hover:underline text-sm">
                            <Phone className="h-3 w-3" />
                            {lead.phone}
                          </a>
                        ) : '—'}
                      </TableCell>
                      <TableCell>{getStatusBadge(lead.status)}</TableCell>
                      <TableCell className="text-sm text-gray-500">{lead.source ?? '—'}</TableCell>
                      <TableCell className="text-sm text-gray-500">
                        {lead.createdAt ? new Date(lead.createdAt).toLocaleDateString('fa-IR') : '—'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
