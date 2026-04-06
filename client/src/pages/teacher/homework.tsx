import { useQuery } from "@tanstack/react-query";
import { useTranslation } from 'react-i18next';
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { FileText, Search, Clock, CheckCircle, AlertCircle, User, Plus, Filter } from "lucide-react";
import { useState, useMemo } from "react";
import { useLocation } from "wouter";

type Assignment = {
  id: number;
  title?: string;
  studentName?: string;
  studentId?: number;
  status?: string;
  dueDate?: string;
  submittedAt?: string;
  score?: number;
  maxScore?: number;
  assignmentType?: string;
  courseName?: string;
};

export default function TeacherHomeworkPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const { isRTL } = useLanguage();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [, setLocation] = useLocation();

  const { data: assignments = [], isLoading } = useQuery<Assignment[]>({
    queryKey: ['/api/teacher/assignments'],
  });

  const filtered = useMemo(() => {
    return assignments.filter((a) => {
      const matchesSearch = !search.trim() ||
        (a.title ?? '').toLowerCase().includes(search.toLowerCase()) ||
        (a.studentName ?? '').toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || a.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [assignments, search, statusFilter]);

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'submitted': return <Badge className="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">{t('teacher:assignments.submitted', 'ارسال‌شده')}</Badge>;
      case 'graded': return <Badge className="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">{t('teacher:assignments.graded', 'نمره‌داده')}</Badge>;
      case 'overdue': return <Badge variant="destructive">{t('teacher:assignments.overdue', 'تاخیر')}</Badge>;
      case 'pending': return <Badge variant="secondary">{t('teacher:assignments.pending', 'در انتظار')}</Badge>;
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

  const statuses = ['all', 'submitted', 'graded', 'pending', 'overdue'];

  const summaryStats = [
    { label: t('teacher:assignments.total', 'کل تکالیف'), value: assignments.length, icon: FileText, color: 'text-blue-500' },
    { label: t('teacher:assignments.pending', 'در انتظار بررسی'), value: assignments.filter(a => a.status === 'submitted').length, icon: Clock, color: 'text-yellow-500' },
    { label: t('teacher:assignments.graded', 'نمره‌داده‌شده'), value: assignments.filter(a => a.status === 'graded').length, icon: CheckCircle, color: 'text-green-500' },
    { label: t('teacher:assignments.overdue', 'تاخیردار'), value: assignments.filter(a => a.status === 'overdue').length, icon: AlertCircle, color: 'text-red-500' },
  ];

  return (
    <div className="w-full px-4 py-6 space-y-6">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
            {t('teacher:assignments.title', 'مدیریت تکالیف')}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            {t('teacher:assignments.subtitle', 'بررسی و ارزیابی تکالیف دانش‌آموزان')}
          </p>
        </div>
        <Button onClick={() => setLocation('/teacher/assignments')} className="shrink-0">
          <Plus className="h-4 w-4 me-2" />
          {t('teacher:assignments.create', 'تکلیف جدید')}
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
            <FileText className="h-5 w-5 text-blue-500" />
            {t('teacher:assignments.list', 'لیست تکالیف')}
          </CardTitle>
          <div className="flex gap-2 flex-wrap mt-2">
            <div className="relative flex-1 min-w-[160px]">
              <Search className={`absolute top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 ${isRTL ? 'right-3' : 'left-3'}`} />
              <Input
                placeholder={t('teacher:assignments.search', 'جستجو...')}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className={isRTL ? 'pr-9' : 'pl-9'}
              />
            </div>
            <div className="flex gap-1 flex-wrap">
              {statuses.map((s) => (
                <Button
                  key={s}
                  size="sm"
                  variant={statusFilter === s ? 'default' : 'outline'}
                  onClick={() => setStatusFilter(s)}
                  className="text-xs"
                >
                  {s === 'all' ? t('common:all', 'همه') :
                   s === 'submitted' ? t('teacher:assignments.submitted', 'ارسال') :
                   s === 'graded' ? t('teacher:assignments.graded', 'نمره') :
                   s === 'pending' ? t('teacher:assignments.pending', 'انتظار') :
                   t('teacher:assignments.overdue', 'تاخیر')}
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
              <FileText className="h-10 w-10 mx-auto mb-2 opacity-40" />
              <p>{t('teacher:assignments.noAssignments', 'تکلیفی یافت نشد')}</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
              {filtered.map((assignment) => (
                <div key={assignment.id} className="py-3 flex items-start gap-3">
                  <FileText className="h-5 w-5 text-gray-400 mt-0.5 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2 mb-0.5">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {assignment.title ?? `تکلیف #${assignment.id}`}
                      </p>
                      {getStatusBadge(assignment.status)}
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-400 flex-wrap">
                      {assignment.studentName && (
                        <span className="flex items-center gap-1">
                          <User className="h-3 w-3" />
                          {assignment.studentName}
                        </span>
                      )}
                      {assignment.dueDate && (
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(assignment.dueDate)}
                        </span>
                      )}
                      {assignment.score != null && assignment.maxScore != null && (
                        <span>{assignment.score}/{assignment.maxScore}</span>
                      )}
                      {assignment.courseName && <span>{assignment.courseName}</span>}
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
