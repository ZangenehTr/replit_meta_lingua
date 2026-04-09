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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  UserPlus, Search, Phone, Mail, Target, Clock, CheckCircle,
  XCircle, AlertCircle, Users, TrendingUp, Filter
} from "lucide-react";
import { useLocation } from "wouter";
import type { Lead } from "@shared/schema";

const STATUS_OPTIONS = ['all', 'new', 'contacted', 'qualified', 'converted', 'lost'];

export default function LeadsPage() {
  const { t } = useTranslation(['callcenter', 'common']);
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [, setLocation] = useLocation();

  const { data: leads = [], isLoading } = useQuery<Lead[]>({
    queryKey: ['/api/leads'],
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/callcenter/stats'],
  }) as { data: Record<string, number> | undefined };

  const filtered = useMemo(() => {
    return leads.filter((lead) => {
      const matchesSearch = !search.trim() ||
        `${lead.firstName ?? ''} ${lead.lastName ?? ''} ${lead.phone ?? ''} ${lead.email ?? ''}`.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || lead.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [leads, search, statusFilter]);

  const getStatusBadge = (status?: string | null) => {
    switch (status) {
      case 'new': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('callcenter:leads.new', 'جدید')}</Badge>;
      case 'contacted': return <Badge className="bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300">{t('callcenter:leads.contacted', 'تماس‌گرفته')}</Badge>;
      case 'qualified': return <Badge className="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">{t('callcenter:leads.qualified', 'واجد شرایط')}</Badge>;
      case 'converted': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('callcenter:leads.converted', 'تبدیل‌شده')}</Badge>;
      case 'lost': return <Badge variant="destructive">{t('callcenter:leads.lost', 'ازدست‌رفته')}</Badge>;
      default: return <Badge variant="secondary">{status ?? '—'}</Badge>;
    }
  };

  const summaryStats = [
    { label: t('callcenter:leads.total', 'کل سرنخ‌ها'), value: leads.length, icon: Users, color: 'text-blue-500' },
    { label: t('callcenter:leads.new', 'جدید'), value: leads.filter(l => l.status === 'new').length, icon: UserPlus, color: 'text-green-500' },
    { label: t('callcenter:leads.converted', 'تبدیل‌شده'), value: leads.filter(l => l.status === 'converted').length, icon: CheckCircle, color: 'text-purple-500' },
    { label: t('callcenter:leads.qualified', 'واجد شرایط'), value: leads.filter(l => l.status === 'qualified').length, icon: Target, color: 'text-yellow-500' },
  ];

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('callcenter:leads.title', 'مدیریت سرنخ‌ها')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('callcenter:leads.subtitle', 'پیگیری و مدیریت سرنخ‌های فروش')}
          </p>
        </div>
        <Button onClick={() => setLocation('/callcenter/unified-workflow')} className="shrink-0">
          <UserPlus className="h-4 w-4 me-2" />
          {t('callcenter:leads.workflow', 'جریان یکپارچه')}
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
            <UserPlus className="h-5 w-5 text-blue-500" />
            {t('callcenter:leads.list', 'لیست سرنخ‌ها')}
          </CardTitle>
          <div className="flex gap-2 flex-wrap mt-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('callcenter:leads.search', 'جستجو...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={isRTL ? 'pr-9' : 'pl-9'}
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-40">
                <Filter className="h-4 w-4 me-2 text-gray-400" />
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s === 'all' ? t('common:all', 'همه') :
                     s === 'new' ? t('callcenter:leads.new', 'جدید') :
                     s === 'contacted' ? t('callcenter:leads.contacted', 'تماس‌گرفته') :
                     s === 'qualified' ? t('callcenter:leads.qualified', 'واجد شرایط') :
                     s === 'converted' ? t('callcenter:leads.converted', 'تبدیل‌شده') :
                     t('callcenter:leads.lost', 'ازدست‌رفته')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-12 w-full" />)}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <UserPlus className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('callcenter:leads.noLeads', 'سرنخی یافت نشد')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t('callcenter:leads.name', 'نام')}</TableHead>
                    <TableHead>{t('callcenter:leads.phone', 'تلفن')}</TableHead>
                    <TableHead>{t('callcenter:leads.status', 'وضعیت')}</TableHead>
                    <TableHead>{t('callcenter:leads.source', 'منبع')}</TableHead>
                    <TableHead>{t('callcenter:leads.date', 'تاریخ')}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((lead) => (
                    <TableRow key={lead.id}>
                      <TableCell className="font-medium">
                        {`${lead.firstName ?? ''} ${lead.lastName ?? ''}`.trim() || `سرنخ #${lead.id}`}
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
