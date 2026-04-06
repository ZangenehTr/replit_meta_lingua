import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3, Users, TrendingUp, DollarSign, BookOpen,
  GraduationCap, RefreshCw, Calendar, CheckCircle, Clock, AlertCircle
} from "lucide-react";

interface AdminStats {
  totalStudents?: number;
  totalTeachers?: number;
  totalCourses?: number;
  activeSessions?: number;
  monthlyRevenue?: number;
  totalRevenue?: number;
  newLeads?: number;
  conversionRate?: number;
  activeEnrollments?: number;
}

export default function AdminReportsPage() {
  const { t } = useTranslation(['admin', 'common']);
  const [dateRange, setDateRange] = useState("30days");
  const [reportType, setReportType] = useState("trial-balance");
  const today = new Date();
  const endDate = today.toISOString().split('T')[0];
  const startDate = (() => {
    const d = new Date(today);
    if (dateRange === "7days") { d.setDate(d.getDate() - 7); }
    else if (dateRange === "30days") { d.setDate(d.getDate() - 30); }
    else if (dateRange === "90days") { d.setDate(d.getDate() - 90); }
    else if (dateRange === "1year") { d.setFullYear(d.getFullYear() - 1); }
    else { d.setDate(d.getDate() - 30); }
    return d.toISOString().split('T')[0];
  })();

  const { data: stats, isLoading: statsLoading } = useQuery<AdminStats>({
    queryKey: ['/api/admin/stats'],
  });

  const { data: financialReport, isLoading: reportLoading, refetch: refetchReport } = useQuery({
    queryKey: ['/api/admin/reports', reportType, startDate, endDate],
    queryFn: () => {
      const endpoint = reportType === 'trial-balance'
        ? `/api/admin/reports/trial-balance?startDate=${startDate}&endDate=${endDate}`
        : reportType === 'balance-sheet'
        ? `/api/admin/reports/balance-sheet?startDate=${startDate}&endDate=${endDate}`
        : `/api/admin/reports/profit-loss?startDate=${startDate}&endDate=${endDate}`;
      return apiRequest(endpoint);
    },
    retry: false,
  });

  const { data: overviewStats = [] } = useQuery<Array<{ title?: string; label?: string; value: string | number }>>({
    queryKey: ['/api/admin/financial/overview-stats', { range: dateRange }],
  });

  const statCards = [
    { label: t('admin:reports.totalStudents', 'کل دانش‌آموزان'), value: stats?.totalStudents, icon: GraduationCap, color: 'text-blue-600', bg: 'bg-blue-50 dark:bg-blue-900/20' },
    { label: t('admin:reports.totalTeachers', 'کل معلمان'), value: stats?.totalTeachers, icon: Users, color: 'text-purple-600', bg: 'bg-purple-50 dark:bg-purple-900/20' },
    { label: t('admin:reports.totalCourses', 'دوره‌ها'), value: stats?.totalCourses, icon: BookOpen, color: 'text-green-600', bg: 'bg-green-50 dark:bg-green-900/20' },
    { label: t('admin:reports.activeSessions', 'جلسات فعال'), value: stats?.activeSessions, icon: Clock, color: 'text-yellow-600', bg: 'bg-yellow-50 dark:bg-yellow-900/20' },
    { label: t('admin:reports.newLeads', 'سرنخ‌های جدید'), value: stats?.newLeads, icon: TrendingUp, color: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-900/20' },
    { label: t('admin:reports.enrollments', 'ثبت‌نام‌ها'), value: stats?.activeEnrollments, icon: CheckCircle, color: 'text-teal-600', bg: 'bg-teal-50 dark:bg-teal-900/20' },
  ];

  const reportTypes = [
    { value: 'trial-balance', label: t('admin:reports.trialBalance', 'تراز آزمایشی') },
    { value: 'balance-sheet', label: t('admin:reports.balanceSheet', 'ترازنامه') },
    { value: 'profit-loss', label: t('admin:reports.profitLoss', 'سود و زیان') },
  ];

  const renderReportContent = (data: unknown) => {
    if (!data) {
      return (
        <div className="text-center py-10 text-gray-400">
          <AlertCircle className="h-10 w-10 mx-auto mb-2 opacity-40" />
          <p>{t('admin:reports.noData', 'داده‌ای در دسترس نیست')}</p>
        </div>
      );
    }
    if (Array.isArray(data)) {
      return (
        <div className="divide-y divide-gray-100 dark:divide-gray-700">
          {(data as Array<Record<string, unknown>>).map((item, idx) => (
            <div key={idx} className="flex items-center justify-between py-2">
              <span className="text-sm text-gray-700 dark:text-gray-300">
                {String(item.account ?? item.name ?? item.label ?? `آیتم ${idx + 1}`)}
              </span>
              <span className={`text-sm font-medium ${Number(item.amount ?? item.value ?? 0) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {typeof (item.amount ?? item.value) === 'number'
                  ? Number(item.amount ?? item.value).toLocaleString('fa-IR')
                  : String(item.amount ?? item.value ?? '—')}
              </span>
            </div>
          ))}
        </div>
      );
    }
    if (typeof data === 'object') {
      return (
        <div className="grid grid-cols-2 gap-4">
          {Object.entries(data as Record<string, unknown>).map(([key, val]) => (
            <div key={key} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <p className="text-xs text-gray-500 mb-1 capitalize">{key.replace(/_/g, ' ')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-white">
                {typeof val === 'number' ? val.toLocaleString('fa-IR') : String(val)}
              </p>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('admin:reports.title', 'گزارش‌های مدیریتی')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('admin:reports.subtitle', 'آمار و تحلیل عملکرد پلتفرم')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-36">
              <Calendar className="h-4 w-4 me-2 text-gray-400" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7days">{t('common:last7Days', '۷ روز گذشته')}</SelectItem>
              <SelectItem value="30days">{t('common:last30Days', '۳۰ روز گذشته')}</SelectItem>
              <SelectItem value="90days">{t('common:last90Days', '۳ ماه گذشته')}</SelectItem>
              <SelectItem value="1year">{t('common:lastYear', 'یک سال گذشته')}</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card) => (
          <Card key={card.label}>
            <CardContent className="pt-4 pb-4">
              <div className={`inline-flex p-2 rounded-lg ${card.bg} mb-2`}>
                <card.icon className={`h-4 w-4 ${card.color}`} />
              </div>
              {statsLoading ? (
                <Skeleton className="h-6 w-12 mb-1" />
              ) : (
                <p className="text-xl font-bold text-gray-900 dark:text-white">{card.value ?? '—'}</p>
              )}
              <p className="text-xs text-gray-500 leading-tight">{card.label}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Tabs defaultValue="financial">
        <TabsList className="mb-4">
          <TabsTrigger value="financial">
            <DollarSign className="h-4 w-4 me-1" />
            {t('admin:reports.financial', 'مالی')}
          </TabsTrigger>
          <TabsTrigger value="overview">
            <BarChart3 className="h-4 w-4 me-1" />
            {t('admin:reports.overview', 'نمای کلی')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="financial" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between flex-wrap gap-2">
                <CardTitle className="text-base flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-green-500" />
                  {t('admin:reports.financialReport', 'گزارش مالی')}
                </CardTitle>
                <div className="flex items-center gap-2">
                  <Select value={reportType} onValueChange={setReportType}>
                    <SelectTrigger className="w-44">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {reportTypes.map((r) => (
                        <SelectItem key={r.value} value={r.value}>{r.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button size="sm" variant="outline" onClick={() => refetchReport()}>
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {reportLoading ? (
                <div className="space-y-3">
                  {[...Array(4)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
                </div>
              ) : renderReportContent(financialReport)}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-base flex items-center gap-2">
                <BarChart3 className="h-5 w-5 text-blue-500" />
                {t('admin:reports.overviewStats', 'آمار کلی')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {overviewStats.length > 0 ? (
                <div className="divide-y divide-gray-100 dark:divide-gray-700">
                  {overviewStats.map((stat, idx) => (
                    <div key={idx} className="flex items-center justify-between py-3">
                      <span className="text-sm text-gray-700 dark:text-gray-300">{stat.title ?? stat.label}</span>
                      <Badge variant="secondary">{stat.value}</Badge>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {statsLoading ? (
                    [...Array(6)].map((_, i) => <Skeleton key={i} className="h-20 w-full" />)
                  ) : ([
                    { label: t('admin:reports.totalStudents', 'دانش‌آموزان'), value: stats?.totalStudents },
                    { label: t('admin:reports.totalTeachers', 'معلمان'), value: stats?.totalTeachers },
                    { label: t('admin:reports.totalCourses', 'دوره‌ها'), value: stats?.totalCourses },
                    { label: t('admin:reports.newLeads', 'سرنخ‌ها'), value: stats?.newLeads },
                    { label: t('admin:reports.enrollments', 'ثبت‌نام‌ها'), value: stats?.activeEnrollments },
                    {
                      label: t('admin:reports.conversionRate', 'نرخ تبدیل'),
                      value: stats?.conversionRate != null ? `${stats.conversionRate}%` : undefined,
                    },
                  ].map((item) => (
                    <div key={item.label} className="p-4 bg-gray-50 dark:bg-gray-800 rounded-lg text-center">
                      <p className="text-2xl font-bold text-gray-900 dark:text-white mb-1">{item.value ?? '—'}</p>
                      <p className="text-xs text-gray-500">{item.label}</p>
                    </div>
                  )))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
