import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { API_ENDPOINTS } from '@/services/endpoints';
import { useOfflineSync } from '@/hooks/use-offline-sync';
import {
  BookOpen, Clock, Calendar, CheckCircle, AlertCircle, Upload,
  FileText, Send, ChevronRight, Star, Target, Trophy, TrendingUp,
  AlertTriangle, Filter, X, CheckSquare, Square, Paperclip,
  MessageSquare, Award, Zap, ChevronDown
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';

interface Homework {
  id: number;
  title: string;
  description: string;
  instructions?: string;
  courseTitle: string;
  className?: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in_progress' | 'submitted' | 'graded' | 'late' | 'excused';
  grade?: number;
  maxGrade: number;
  feedback?: string;
  attachments?: string[];
  submissionUrl?: string;
  submissionFiles?: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  xpReward: number;
  submittedAt?: string;
  allowLateSubmission?: boolean;
  latePenaltyPercent?: number;
}

interface HomeworkStats {
  total: number;
  pending: number;
  submitted: number;
  graded: number;
  averageGrade: number;
  totalXpEarned: number;
  upcomingDeadlines: any[];
}

export default function StudentHomeworkMobile() {
  const { t, i18n } = useTranslation();
  const isRTL = ['fa', 'ar'].includes(i18n.language);
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('all');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);
  const [submissionText, setSubmissionText] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { isOnline } = useOfflineSync();

  const { data: homework = [], isLoading } = useQuery<Homework[]>({
    queryKey: [API_ENDPOINTS.student.homework, filterStatus],
    queryFn: async () => {
      const response = await fetch(`${API_ENDPOINTS.student.homework}${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch homework');
      return response.json();
    }
  });

  const { data: stats } = useQuery<HomeworkStats>({
    queryKey: [API_ENDPOINTS.student.homeworkStats],
    queryFn: async () => {
      const response = await fetch(API_ENDPOINTS.student.homeworkStats, {
        headers: { 'Authorization': `Bearer ${localStorage.getItem('auth_token')}` }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const submitHomework = useMutation({
    mutationFn: async ({ id, file, submission }: { id: number; file?: File; submission?: string }) => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};
      if (file) {
        if (!isOnline) throw new Error('FILE_OFFLINE');
        const formData = new FormData();
        formData.append('file', file);
        if (submission) formData.append('submission', submission);
        const response = await fetch(`${API_ENDPOINTS.student.homework}/${id}/submit`, { method: 'POST', headers, body: formData });
        if (!response.ok) throw new Error('Failed to submit homework');
        return response.json();
      }
      const response = await fetch(`${API_ENDPOINTS.student.homework}/${id}/submit`, {
        method: 'POST',
        headers: { ...headers, 'Content-Type': 'application/json' },
        body: JSON.stringify({ submission }),
      });
      if (!response.ok) throw new Error('Failed to submit homework');
      return response.json();
    },
    onSuccess: (data: unknown) => {
      const xpAwarded = (data as { xpAwarded?: number })?.xpAwarded;
      toast({
        title: t('student:homeworkSubmitted', 'تکلیف ارسال شد'),
        description: xpAwarded ? `+${xpAwarded} XP دریافت کردید!` : t('student:homeworkSubmittedDesc', 'تکلیف با موفقیت ارسال شد'),
      });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.student.homework] });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.student.homeworkStats] });
      setSelectedHomework(null);
      setSubmissionText('');
    },
    onError: (error: Error) => {
      if (error.message === 'FILE_OFFLINE') {
        toast({ title: t('common:error'), description: 'ارسال فایل نیاز به اینترنت دارد.', variant: 'destructive' });
      } else {
        toast({ title: t('common:error'), description: t('student:homeworkSubmitError', 'خطا در ارسال تکلیف'), variant: 'destructive' });
      }
    }
  });

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'pending': return { color: 'amber', label: 'در انتظار', icon: AlertCircle, bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700', dot: 'bg-amber-500' };
      case 'in_progress': return { color: 'blue', label: 'در حال انجام', icon: Clock, bg: 'bg-blue-50', border: 'border-blue-200', text: 'text-blue-700', dot: 'bg-blue-500' };
      case 'submitted': return { color: 'violet', label: 'ارسال‌شده', icon: CheckCircle, bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700', dot: 'bg-violet-500' };
      case 'graded': return { color: 'emerald', label: 'نمره‌دهی شد', icon: Trophy, bg: 'bg-emerald-50', border: 'border-emerald-200', text: 'text-emerald-700', dot: 'bg-emerald-500' };
      case 'late': return { color: 'red', label: 'دیرکرد', icon: AlertTriangle, bg: 'bg-red-50', border: 'border-red-200', text: 'text-red-700', dot: 'bg-red-500' };
      case 'excused': return { color: 'gray', label: 'معاف', icon: CheckSquare, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' };
      default: return { color: 'gray', label: status, icon: Square, bg: 'bg-gray-50', border: 'border-gray-200', text: 'text-gray-600', dot: 'bg-gray-400' };
    }
  };

  const getDifficultyConfig = (d: string) => {
    switch (d) {
      case 'easy': return { label: 'آسان', stars: 1, className: 'bg-emerald-100 text-emerald-700' };
      case 'medium': return { label: 'متوسط', stars: 2, className: 'bg-amber-100 text-amber-700' };
      case 'hard': return { label: 'سخت', stars: 3, className: 'bg-red-100 text-red-700' };
      default: return { label: d, stars: 1, className: 'bg-gray-100 text-gray-600' };
    }
  };

  const getDueInfo = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.ceil((date.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) return { text: `${Math.abs(diffDays)} روز پیش گذشت`, urgent: true, overdue: true };
    if (diffDays === 0) return { text: 'امروز', urgent: true, overdue: false };
    if (diffDays === 1) return { text: 'فردا', urgent: true, overdue: false };
    if (diffDays <= 3) return { text: `${diffDays} روز دیگر`, urgent: true, overdue: false };
    return { text: `${diffDays} روز دیگر`, urgent: false, overdue: false };
  };

  const completionPercentage = stats && stats.total > 0
    ? Math.round(((stats.submitted + stats.graded) / stats.total) * 100)
    : 0;

  const filterTabs = [
    { key: 'all' as const, label: 'همه' },
    { key: 'pending' as const, label: 'در انتظار' },
    { key: 'submitted' as const, label: 'ارسال‌شده' },
    { key: 'graded' as const, label: 'نمره‌دهی' },
  ];

  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>

      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-30 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-1">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('student:homework.title', 'تکالیف')}</h1>
              <p className="text-xs text-gray-500">{homework.length} {t('student:homework.total', 'تکلیف')}</p>
            </div>
            <div className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <BookOpen className="w-5 h-5 text-indigo-600" />
            </div>
          </div>

          {/* Filter Tabs */}
          <div className="flex gap-1.5 mt-3 overflow-x-auto scrollbar-hide">
            {filterTabs.map(tab => (
              <button
                key={tab.key}
                onClick={() => setFilterStatus(tab.key)}
                className={`px-3.5 py-1.5 rounded-full text-xs font-semibold whitespace-nowrap transition-all ${
                  filterStatus === tab.key
                    ? 'bg-indigo-600 text-white shadow-sm'
                    : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="px-4 pt-4 pb-24 space-y-4">

        {/* Stats / Progress Card */}
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-semibold text-gray-700">{t('student:homework.overallProgress', 'پیشرفت کلی')}</span>
            <span className="text-xl font-bold text-indigo-600">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2 mb-4" />
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: 'در انتظار', count: stats?.pending ?? 0, color: 'text-amber-600', bg: 'bg-amber-50', icon: AlertCircle },
              { label: 'ارسال‌شده', count: stats?.submitted ?? 0, color: 'text-violet-600', bg: 'bg-violet-50', icon: CheckCircle },
              { label: 'نمره‌دهی', count: stats?.graded ?? 0, color: 'text-emerald-600', bg: 'bg-emerald-50', icon: Trophy },
            ].map(({ label, count, color, bg, icon: Icon }) => (
              <div key={label} className={`${bg} rounded-xl p-3 text-center`}>
                <Icon className={`w-4 h-4 ${color} mx-auto mb-1`} />
                <p className={`text-lg font-bold ${color}`}>{count}</p>
                <p className="text-xs text-gray-500">{label}</p>
              </div>
            ))}
          </div>
          {stats && stats.totalXpEarned > 0 && (
            <div className="mt-3 flex items-center justify-center gap-2 bg-indigo-50 rounded-xl py-2">
              <Zap className="w-4 h-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-700">{stats.totalXpEarned} XP {t('student:earned', 'کسب کرده‌اید')}</span>
            </div>
          )}
        </div>

        {/* Homework List */}
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 animate-pulse">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-xl bg-gray-200" />
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-1.5" />
                    <div className="h-3 bg-gray-200 rounded w-1/2" />
                  </div>
                </div>
                <div className="h-9 bg-gray-200 rounded-xl" />
              </div>
            ))}
          </div>
        ) : homework.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <BookOpen className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('student:noHomework', 'تکلیفی وجود ندارد')}</h3>
            <p className="text-sm text-gray-400">{t('student:noHomeworkDesc', 'هیچ تکلیفی با این فیلتر یافت نشد')}</p>
          </div>
        ) : (
          <div className="space-y-3">
            {homework.map((item, index) => {
              const statusConfig = getStatusConfig(item.status);
              const diffConfig = getDifficultyConfig(item.difficulty);
              const dueInfo = getDueInfo(item.dueDate);
              const StatusIcon = statusConfig.icon;

              return (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
                >
                  {/* Status accent line */}
                  <div className={`h-1 ${statusConfig.dot} w-full`} />

                  <div className="p-4">
                    {/* Top row */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${statusConfig.bg} flex items-center justify-center flex-shrink-0`}>
                        <StatusIcon className={`w-5 h-5 ${statusConfig.text}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-gray-900 text-sm leading-tight line-clamp-2">{item.title}</h3>
                        <p className="text-xs text-gray-500 mt-0.5">{item.courseTitle} · {item.teacherName}</p>
                      </div>
                      <span className={`text-xs font-semibold px-2 py-1 rounded-full flex-shrink-0 ${diffConfig.className}`}>
                        {diffConfig.label}
                      </span>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-xs text-gray-500 mb-3 line-clamp-2">{item.description}</p>
                    )}

                    {/* Meta info */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className={`flex items-center gap-1 text-xs ${dueInfo.overdue ? 'text-red-600 font-semibold' : dueInfo.urgent ? 'text-amber-600 font-medium' : 'text-gray-500'}`}>
                        <Calendar className="w-3.5 h-3.5" />
                        {dueInfo.text}
                      </div>
                      <div className="flex items-center gap-1 text-xs text-gray-500">
                        <Clock className="w-3.5 h-3.5" />
                        {item.estimatedTime} دقیقه
                      </div>
                      <div className="flex items-center gap-1 text-xs text-indigo-600 font-medium">
                        <Zap className="w-3.5 h-3.5" />
                        +{item.xpReward} XP
                      </div>
                    </div>

                    {/* Status-based sections */}
                    {item.status === 'graded' && item.grade !== undefined && (
                      <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-3 mb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-emerald-600" />
                            <span className="text-sm font-bold text-emerald-700">
                              {item.grade}/{item.maxGrade} نمره
                            </span>
                            <span className="text-xs text-emerald-600">
                              ({Math.round((item.grade / item.maxGrade) * 100)}%)
                            </span>
                          </div>
                          {item.feedback && (
                            <Badge className="bg-emerald-100 text-emerald-700 border-0 text-xs">
                              <MessageSquare className="w-3 h-3 me-1" />
                              بازخورد
                            </Badge>
                          )}
                        </div>
                        {item.feedback && (
                          <p className="text-xs text-emerald-700 mt-2 leading-relaxed">{item.feedback}</p>
                        )}
                      </div>
                    )}

                    {item.status === 'submitted' && (
                      <div className="bg-violet-50 border border-violet-100 rounded-xl p-3 mb-3 flex items-center gap-2">
                        <div className="flex gap-0.5">
                          {[0, 1, 2].map(i => (
                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-violet-400 animate-pulse" style={{ animationDelay: `${i * 0.2}s` }} />
                          ))}
                        </div>
                        <span className="text-xs text-violet-700 font-medium">در انتظار نمره‌دهی</span>
                      </div>
                    )}

                    {/* Action Buttons */}
                    {(item.status === 'pending' || item.status === 'in_progress') && (
                      <Button
                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-10 text-sm font-semibold"
                        onClick={() => setSelectedHomework(item)}
                      >
                        <Upload className="w-4 h-4 me-2" />
                        {item.status === 'pending' ? 'شروع و ارسال تکلیف' : 'ادامه ارسال تکلیف'}
                      </Button>
                    )}

                    {item.status === 'late' && (
                      <div className="flex gap-2">
                        <div className="flex-1 bg-red-50 border border-red-100 rounded-xl p-2 flex items-center gap-1.5">
                          <AlertTriangle className="w-4 h-4 text-red-500 flex-shrink-0" />
                          <span className="text-xs text-red-600 font-medium">دیرکرد</span>
                        </div>
                        {item.allowLateSubmission && (
                          <Button
                            size="sm"
                            className="bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs"
                            onClick={() => setSelectedHomework(item)}
                          >
                            ارسال دیر
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>

      {/* Submission Modal */}
      <AnimatePresence>
        {selectedHomework && (
          <motion.div
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHomework(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-h-[85vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 400 }}
              onClick={e => e.stopPropagation()}
            >
              <div className="flex justify-center pt-3 pb-1">
                <div className="w-12 h-1 bg-gray-200 rounded-full" />
              </div>

              <div className="px-5 py-4 border-b border-gray-100 flex items-start justify-between">
                <div>
                  <h2 className="font-bold text-gray-900 text-base">{selectedHomework.title}</h2>
                  <p className="text-xs text-indigo-600 mt-0.5">{selectedHomework.courseTitle}</p>
                </div>
                <button onClick={() => setSelectedHomework(null)} className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center">
                  <X className="w-4 h-4 text-gray-600" />
                </button>
              </div>

              <div className="p-5 space-y-4">
                {selectedHomework.instructions && (
                  <div className="bg-indigo-50 border border-indigo-100 rounded-2xl p-4">
                    <h3 className="text-sm font-semibold text-indigo-800 mb-2 flex items-center gap-1.5">
                      <FileText className="w-4 h-4" />
                      دستورالعمل
                    </h3>
                    <p className="text-sm text-indigo-700 leading-relaxed">{selectedHomework.instructions}</p>
                  </div>
                )}

                {/* Text submission */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">پاسخ متنی</label>
                  <textarea
                    className="w-full border border-gray-200 rounded-xl p-3 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-500 resize-none"
                    rows={5}
                    placeholder="پاسخ خود را اینجا بنویسید..."
                    value={submissionText}
                    onChange={e => setSubmissionText(e.target.value)}
                  />
                </div>

                {/* File upload */}
                <div>
                  <label className="text-sm font-semibold text-gray-700 mb-2 block">آپلود فایل</label>
                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full border-2 border-dashed border-gray-200 rounded-xl p-4 flex flex-col items-center gap-2 hover:border-indigo-400 hover:bg-indigo-50 transition-all"
                  >
                    <Paperclip className="w-6 h-6 text-gray-400" />
                    <span className="text-sm text-gray-500">فایل را انتخاب کنید</span>
                    {!isOnline && (
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-1 rounded-full">آپلود فایل نیاز به اینترنت دارد</span>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    className="hidden"
                    onChange={e => {
                      const file = e.target.files?.[0];
                      if (file) submitHomework.mutate({ id: selectedHomework.id, file, submission: submissionText });
                    }}
                  />
                </div>

                <Button
                  className="w-full bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl h-12 text-sm font-semibold"
                  onClick={() => submitHomework.mutate({ id: selectedHomework.id, submission: submissionText })}
                  disabled={submitHomework.isPending || !submissionText.trim()}
                >
                  {submitHomework.isPending ? (
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      در حال ارسال...
                    </div>
                  ) : (
                    <>
                      <Send className="w-4 h-4 me-2" />
                      ارسال تکلیف
                    </>
                  )}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
