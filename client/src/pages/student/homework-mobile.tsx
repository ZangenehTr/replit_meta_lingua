import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen, 
  Clock, 
  Calendar,
  CheckCircle, 
  AlertCircle,
  Upload,
  FileText,
  Download,
  Send,
  ChevronRight,
  Star,
  Target,
  Trophy,
  TrendingUp,
  AlertTriangle,
  Filter,
  X,
  CheckSquare,
  Square,
  Paperclip,
  MessageSquare,
  Award,
  Zap,
  Menu,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { Card } from '@/components/ui/card';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import '@/styles/mobile-app.css';

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
  const [showFilters, setShowFilters] = useState(false);
  const [selectedDifficulty, setSelectedDifficulty] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Fetch homework
  const { data: homework = [], isLoading } = useQuery<Homework[]>({
    queryKey: ['/api/student/homework', filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/student/homework${filterStatus !== 'all' ? `?status=${filterStatus}` : ''}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch homework');
      return response.json();
    }
  });

  // Fetch homework stats
  const { data: stats } = useQuery<HomeworkStats>({
    queryKey: ['/api/student/homework/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/homework/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  // Submit homework mutation
  const submitHomework = useMutation({
    mutationFn: async ({ id, file, submission }: { id: number; file?: File; submission?: string }) => {
      const formData = new FormData();
      if (file) formData.append('file', file);
      if (submission) formData.append('submission', submission);
      
      const response = await fetch(`/api/student/homework/${id}/submit`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: formData
      });
      
      if (!response.ok) throw new Error('Failed to submit homework');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('student:homeworkSubmitted'),
        description: data.xpAwarded ? t('student:xpEarned', { xp: data.xpAwarded }) : t('student:homeworkSubmittedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/homework'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/homework/stats'] });
      setSelectedHomework(null);
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:homeworkSubmitError'),
        variant: 'destructive'
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-500';
      case 'in_progress': return 'bg-blue-500';
      case 'submitted': return 'bg-purple-500';
      case 'graded': return 'bg-green-500';
      case 'late': return 'bg-red-500';
      case 'excused': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'pending': return 'bg-orange-100 text-orange-700 border-0';
      case 'in_progress': return 'bg-blue-100 text-blue-700 border-0';
      case 'submitted': return 'bg-purple-100 text-purple-700 border-0';
      case 'graded': return 'bg-green-100 text-green-700 border-0';
      case 'late': return 'bg-red-100 text-red-700 border-0';
      case 'excused': return 'bg-gray-100 text-gray-700 border-0';
      default: return 'bg-gray-100 text-gray-700 border-0';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending': return <AlertCircle className="w-4 h-4" />;
      case 'in_progress': return <Clock className="w-4 h-4" />;
      case 'submitted': return <CheckCircle className="w-4 h-4" />;
      case 'graded': return <Trophy className="w-4 h-4" />;
      case 'late': return <AlertTriangle className="w-4 h-4" />;
      case 'excused': return <CheckSquare className="w-4 h-4" />;
      default: return <Square className="w-4 h-4" />;
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-100 text-green-700 border-0';
      case 'medium': return 'bg-yellow-100 text-yellow-700 border-0';
      case 'hard': return 'bg-red-100 text-red-700 border-0';
      default: return 'bg-gray-100 text-gray-700 border-0';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffTime = date.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) return { text: t('student:dueToday'), urgent: true };
    if (diffDays === 1) return { text: t('student:dueTomorrow'), urgent: true };
    if (diffDays > 0 && diffDays <= 3) return { text: t('student:dueInDays', { days: diffDays }), urgent: true };
    if (diffDays > 0) return { text: t('student:dueInDays', { days: diffDays }), urgent: false };
    return { text: t('student:overdue'), urgent: true, overdue: true };
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, homeworkId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      submitHomework.mutate({ id: homeworkId, file });
    }
  };

  // Filter homework based on selected filters
  const filteredHomework = homework.filter(hw => {
    if (selectedDifficulty && hw.difficulty !== selectedDifficulty) return false;
    return true;
  });

  // Calculate completion percentage
  const completionPercentage = stats ? Math.round(((stats.submitted + stats.graded) / stats.total) * 100) : 0;

  return (
    <div className={cn("min-h-screen bg-gradient-to-br from-teal-400 via-cyan-400 to-blue-500", isRTL && "rtl")}>
      {/* Modern Clean Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/10 backdrop-blur-xl"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="icon" className="text-white" data-testid="button-menu">
                <Menu className="h-6 w-6" />
              </Button>
              <div className="flex items-center gap-2">
                <h1 className="text-white font-bold text-xl">{t('student:homework')}</h1>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="icon" className="text-white" data-testid="button-calendar">
                <Calendar className="h-5 w-5" />
              </Button>
              <Button variant="ghost" size="icon" className="relative text-white" data-testid="button-notifications">
                <Bell className="h-5 w-5" />
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full" />
              </Button>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Main Content - Clean White Cards */}
      <div className="px-4 py-6 pb-24 space-y-6">
        {/* Enhanced Progress Card */}
        <motion.div
          className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-xl border border-white/50 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-gray-900 text-lg font-bold">{t('student:homework.overallProgress')}</h3>
            <div className="relative w-16 h-16">
              {/* Circular Progress */}
              <svg className="w-16 h-16 transform -rotate-90" viewBox="0 0 64 64">
                <circle cx="32" cy="32" r="28" stroke="#e5e7eb" strokeWidth="4" fill="none" />
                <circle 
                  cx="32" 
                  cy="32" 
                  r="28" 
                  stroke="url(#progressGradient)" 
                  strokeWidth="4" 
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 28}`}
                  strokeDashoffset={`${2 * Math.PI * 28 * (1 - completionPercentage / 100)}`}
                  className="transition-all duration-1000 ease-out"
                  strokeLinecap="round"
                />
                <defs>
                  <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="100%">
                    <stop offset="0%" stopColor="#06b6d4" />
                    <stop offset="100%" stopColor="#3b82f6" />
                  </linearGradient>
                </defs>
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-lg font-bold text-gray-900">{completionPercentage}%</span>
              </div>
            </div>
          </div>
          
          {/* Enhanced Progress Bar */}
          <div className="relative mb-6">
            <div className="h-3 bg-gray-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full shadow-sm"
                initial={{ width: 0 }}
                animate={{ width: `${completionPercentage}%` }}
                transition={{ duration: 1.5, ease: "easeOut", delay: 0.3 }}
              />
            </div>
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>100%</span>
            </div>
          </div>
          
          {/* Enhanced Stats Grid */}
          <div className="grid grid-cols-3 gap-4">
            <motion.div 
              className="text-center p-3 bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl border border-green-200/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
              <p className="text-green-700 text-lg font-bold">{stats?.submitted || 0}</p>
              <p className="text-green-600 text-xs font-medium">{t('student:homework.submitted')}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-3 bg-gradient-to-br from-blue-50 to-cyan-50 rounded-xl border border-blue-200/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Trophy className="w-4 h-4 text-white" />
              </div>
              <p className="text-blue-700 text-lg font-bold">{stats?.graded || 0}</p>
              <p className="text-blue-600 text-xs font-medium">{t('student:homework.graded')}</p>
            </motion.div>
            
            <motion.div 
              className="text-center p-3 bg-gradient-to-br from-orange-50 to-amber-50 rounded-xl border border-orange-200/50"
              whileHover={{ scale: 1.05 }}
              transition={{ duration: 0.2 }}
            >
              <div className="w-8 h-8 bg-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg">
                <Clock className="w-4 h-4 text-white" />
              </div>
              <p className="text-orange-700 text-lg font-bold">{stats?.pending || 0}</p>
              <p className="text-orange-600 text-xs font-medium">{t('student:homework.pending')}</p>
            </motion.div>
          </div>
        </motion.div>

        {/* Enhanced Stats Grid */}
        <motion.div
          className="grid grid-cols-3 gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          {/* XP Card */}
          <motion.div 
            className="bg-gradient-to-br from-yellow-50 to-amber-50 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-yellow-200/50 text-center group"
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-yellow-400 to-amber-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                <Zap className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              {stats?.totalXpEarned && stats.totalXpEarned > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full flex items-center justify-center">
                  <span className="text-xs text-white font-bold">+</span>
                </div>
              )}
            </div>
            <motion.p 
              className="text-yellow-700 text-xl font-bold mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.4, type: "spring" }}
            >
              {stats?.totalXpEarned || 0}
            </motion.p>
            <p className="text-yellow-600 text-xs font-medium">{t('student:homework.xpEarned')}</p>
            {/* XP Progress Animation */}
            <div className="mt-2 h-1 bg-yellow-200 rounded-full overflow-hidden">
              <motion.div 
                className="h-full bg-gradient-to-r from-yellow-400 to-amber-500 rounded-full"
                initial={{ width: 0 }}
                animate={{ width: "75%" }}
                transition={{ duration: 1, delay: 0.6 }}
              />
            </div>
          </motion.div>

          {/* Grade Card */}
          <motion.div 
            className="bg-gradient-to-br from-green-50 to-emerald-50 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-green-200/50 text-center group"
            whileHover={{ scale: 1.05, rotateY: -5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-green-400 to-emerald-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                <TrendingUp className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              {/* Achievement Badge */}
              {stats?.averageGrade && stats.averageGrade >= 80 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold-500 rounded-full flex items-center justify-center">
                  <Star className="w-2 h-2 text-white fill-current" />
                </div>
              )}
            </div>
            <motion.p 
              className="text-green-700 text-xl font-bold mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.5, type: "spring" }}
            >
              {stats?.averageGrade ? Math.round(stats.averageGrade) : 0}%
            </motion.p>
            <p className="text-green-600 text-xs font-medium">{t('student:homework.avgGrade')}</p>
            {/* Grade Progress Circle */}
            <div className="mt-2 relative w-8 h-8 mx-auto">
              <svg className="w-8 h-8 transform -rotate-90" viewBox="0 0 32 32">
                <circle cx="16" cy="16" r="12" stroke="#dcfce7" strokeWidth="2" fill="none" />
                <circle 
                  cx="16" 
                  cy="16" 
                  r="12" 
                  stroke="#22c55e" 
                  strokeWidth="2" 
                  fill="none"
                  strokeDasharray={`${2 * Math.PI * 12}`}
                  strokeDashoffset={`${2 * Math.PI * 12 * (1 - (stats?.averageGrade || 0) / 100)}`}
                  className="transition-all duration-1000"
                />
              </svg>
            </div>
          </motion.div>

          {/* Upcoming Card */}
          <motion.div 
            className="bg-gradient-to-br from-orange-50 to-red-50 backdrop-blur-sm rounded-2xl p-4 shadow-xl border border-orange-200/50 text-center group"
            whileHover={{ scale: 1.05, rotateY: 5 }}
            transition={{ duration: 0.3 }}
          >
            <div className="relative mb-3">
              <div className="w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-full flex items-center justify-center mx-auto shadow-lg group-hover:shadow-xl transition-shadow">
                <AlertCircle className="w-6 h-6 text-white group-hover:scale-110 transition-transform" />
              </div>
              {/* Urgent Indicator */}
              {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
                <div className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full animate-pulse" />
              )}
            </div>
            <motion.p 
              className="text-orange-700 text-xl font-bold mb-1"
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ delay: 0.6, type: "spring" }}
            >
              {stats?.upcomingDeadlines?.length || 0}
            </motion.p>
            <p className="text-orange-600 text-xs font-medium">{t('student:upcoming')}</p>
            {/* Urgency Indicator */}
            {stats?.upcomingDeadlines && stats.upcomingDeadlines.length > 0 && (
              <div className="mt-2 flex justify-center space-x-1">
                {Array.from({ length: Math.min(3, stats.upcomingDeadlines.length) }, (_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 bg-orange-400 rounded-full animate-pulse"
                    style={{ animationDelay: `${i * 0.2}s` }}
                  />
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>

        {/* Filter Section */}
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {t('student:homework.title')}
            </h3>
            <Badge className="bg-blue-500 text-white px-3 py-1">
              {filteredHomework.length} {t('student:homework.total')}
            </Badge>
          </div>
          
          {/* Status Tabs */}
          <div className="flex gap-2 mb-4">
            {['all', 'pending', 'submitted', 'graded'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status as any)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  filterStatus === status 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                data-testid={`filter-${status}`}
              >
                {t(`student:homework.${status}`)}
              </button>
            ))}
          </div>

          {/* Additional Filters */}
          <div className="flex gap-2">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-lg text-gray-600 text-sm hover:bg-gray-200"
              data-testid="button-show-filters"
            >
              <Filter className="w-4 h-4" />
              {t('common:filters')}
            </button>
            {selectedDifficulty && (
              <button
                onClick={() => setSelectedDifficulty(null)}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-100 rounded-lg text-blue-600 text-sm"
                data-testid="button-clear-difficulty-filter"
              >
                {t(`student:difficulty.${selectedDifficulty}`)}
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
        </motion.div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg space-y-3">
                <p className="text-gray-600 text-sm mb-2">{t('student:filterByDifficulty')}</p>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        setSelectedDifficulty(diff);
                        setShowFilters(false);
                      }}
                      className={cn(
                        "flex-1 py-2 px-3 rounded-lg text-sm font-medium transition-colors",
                        getDifficultyColor(diff)
                      )}
                      data-testid={`filter-difficulty-${diff}`}
                    >
                      {t(`student:difficulty.${diff}`)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Homework List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 bg-gray-200 rounded-xl"></div>
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-gray-200 rounded w-1/2 mb-2"></div>
                  <div className="h-2 bg-gray-200 rounded w-full"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredHomework.length === 0 ? (
        <motion.div 
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-lg text-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600 mb-2">{t('student:homework.noHomework')}</p>
          <p className="text-gray-500 text-sm">{t('student:homework.checkBackLater')}</p>
        </motion.div>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map((item, index) => {
            const dueInfo = formatDate(item.dueDate);
            const isOverdue = dueInfo.overdue;
            const isUrgent = dueInfo.urgent;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.4 + index * 0.1 }}
              >
                <div 
                  className={cn(
                    "bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg relative overflow-hidden cursor-pointer transition-all duration-300 hover:shadow-2xl hover:scale-[1.02] hover:bg-white/98 transform-gpu",
                    isOverdue && 'border-2 border-red-500/50 shadow-red-100',
                    isUrgent && !isOverdue && 'border-2 border-orange-400/50 shadow-orange-100'
                  )}
                  onClick={() => setSelectedHomework(item)}
                  data-testid={`homework-card-${item.id}`}
                >
                  {/* Enhanced Status Bar with Gradient */}
                  <div className={`absolute top-0 left-0 w-1.5 h-full ${getStatusColor(item.status)} shadow-lg`} />
                  {/* Background Gradient Overlay */}
                  <div className={`absolute inset-0 opacity-5 ${getStatusColor(item.status)} rounded-2xl`} />
                  
                  <div className="pl-4">
                    {/* Header with Icon */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={cn(
                        "w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg transform transition-transform hover:scale-110",
                        getStatusColor(item.status),
                        "bg-gradient-to-br from-white/20 to-transparent backdrop-blur-sm"
                      )}>
                        <div className="relative">
                          {getStatusIcon(item.status)}
                          {/* Pulsing effect for pending items */}
                          {item.status === 'pending' && (
                            <div className="absolute inset-0 rounded-full bg-white/30 animate-ping" />
                          )}
                        </div>
                      </div>
                      <div className="flex-1">
                        <h3 className="text-gray-900 font-bold text-lg line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-gray-600 text-sm">
                          {item.courseTitle} • {item.teacherName}
                        </p>
                      </div>
                      <Badge className={cn(
                        getDifficultyColor(item.difficulty),
                        "shadow-md border-0 font-semibold transition-transform hover:scale-105",
                        "flex items-center gap-1"
                      )}>
                        {/* Difficulty Stars */}
                        <div className="flex items-center gap-0.5">
                          {Array.from({ length: 3 }, (_, i) => (
                            <Star 
                              key={i} 
                              className={cn(
                                "w-3 h-3",
                                i < (item.difficulty === 'easy' ? 1 : item.difficulty === 'medium' ? 2 : 3)
                                  ? "fill-current"
                                  : "opacity-30"
                              )} 
                            />
                          ))}
                        </div>
                        {t(`student:difficulty.${item.difficulty}`)}
                      </Badge>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-3 mb-4">
                      <div className="flex items-center gap-2">
                        <Clock className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 text-sm">
                          {item.estimatedTime} {t('common:minutes')}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-gray-500" />
                        <span className="text-gray-600 text-sm">
                          {item.xpReward} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="w-4 h-4 text-gray-500" />
                        <span className={cn(
                          "text-sm",
                          isUrgent ? 'text-orange-600 font-medium' : 'text-gray-600'
                        )}>
                          {dueInfo.text}
                        </span>
                      </div>
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center gap-2">
                          <Paperclip className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {item.attachments.length} {t('student:files')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Enhanced Status-based Actions */}
                    {item.status === 'graded' && (
                      <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-4 border border-green-200/50 shadow-sm">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center shadow-lg">
                              <Trophy className="w-5 h-5 text-white" />
                            </div>
                            <div>
                              <span className="text-green-700 text-sm font-semibold block">
                                {t('student:grade')}: {item.grade}/{item.maxGrade}
                              </span>
                              {/* Grade Percentage Circle */}
                              <div className="flex items-center gap-2 mt-1">
                                <div className="w-6 h-6 relative">
                                  <svg className="w-6 h-6 transform -rotate-90" viewBox="0 0 24 24">
                                    <circle cx="12" cy="12" r="10" stroke="#e5e7eb" strokeWidth="2" fill="none" />
                                    <circle 
                                      cx="12" 
                                      cy="12" 
                                      r="10" 
                                      stroke="#10b981" 
                                      strokeWidth="2" 
                                      fill="none"
                                      strokeDasharray={`${2 * Math.PI * 10}`}
                                      strokeDashoffset={`${2 * Math.PI * 10 * (1 - (item.grade / item.maxGrade))}`}
                                      className="transition-all duration-500"
                                    />
                                  </svg>
                                  <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-green-600">
                                    {Math.round((item.grade / item.maxGrade) * 100)}%
                                  </span>
                                </div>
                                <span className="text-green-600 text-xs font-medium">
                                  {Math.round((item.grade / item.maxGrade) * 100)}% Score
                                </span>
                              </div>
                            </div>
                          </div>
                          {item.feedback && (
                            <Badge className="bg-green-100 text-green-700 border-0 shadow-sm hover:shadow-md transition-shadow">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {t('student:feedbackAvailable')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {item.status === 'pending' && (
                      <Button
                        className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHomework(item);
                        }}
                        data-testid={`button-start-homework-${item.id}`}
                      >
                        <Upload className="w-4 h-4 mr-2 group-hover:rotate-12 transition-transform" />
                        {t('student:startHomework')}
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}

                    {item.status === 'in_progress' && (
                      <Button
                        className="w-full bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 text-white font-bold py-3 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-[1.02] transition-all duration-200 group"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHomework(item);
                        }}
                        data-testid={`button-continue-homework-${item.id}`}
                      >
                        <Send className="w-4 h-4 mr-2 group-hover:translate-x-1 transition-transform" />
                        {t('student:continueHomework')}
                        <ChevronRight className="w-4 h-4 ml-2 group-hover:translate-x-1 transition-transform" />
                      </Button>
                    )}

                    {item.status === 'submitted' && (
                      <div className="text-center py-4 bg-gradient-to-r from-purple-50 to-violet-50 rounded-xl border border-purple-200/50 shadow-sm">
                        <div className="flex items-center justify-center gap-2 mb-2">
                          <div className="w-8 h-8 bg-purple-500 rounded-full flex items-center justify-center shadow-lg">
                            <CheckCircle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-purple-700 text-sm font-semibold">
                            {t('student:awaitingGrade')}
                          </span>
                        </div>
                        <div className="flex justify-center">
                          <div className="flex space-x-1">
                            {Array.from({ length: 3 }, (_, i) => (
                              <div
                                key={i}
                                className="w-2 h-2 bg-purple-400 rounded-full animate-pulse"
                                style={{ animationDelay: `${i * 0.2}s` }}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}

                    {item.status === 'late' && (
                      <div className="text-center py-4 bg-gradient-to-r from-red-50 to-rose-50 rounded-xl border border-red-200/50 shadow-sm">
                        <div className="flex items-center justify-center gap-2">
                          <div className="w-8 h-8 bg-red-500 rounded-full flex items-center justify-center shadow-lg animate-pulse">
                            <AlertTriangle className="w-4 h-4 text-white" />
                          </div>
                          <span className="text-red-700 text-sm font-semibold">
                            {t('student:lateSubmission')}
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Homework Detail Modal */}
      <AnimatePresence>
        {selectedHomework && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedHomework(null)}
          >
            <motion.div
              className="w-full bg-white/95 backdrop-blur-sm rounded-t-3xl max-h-[90vh] overflow-hidden shadow-2xl"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-gray-200">
                <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-4" />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-gray-900 text-xl font-bold mb-1">
                      {selectedHomework.title}
                    </h2>
                    <p className="text-gray-600 text-sm">
                      {selectedHomework.courseTitle} • {selectedHomework.teacherName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHomework(null)}
                    className="p-2 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors"
                    data-testid="button-close-homework-modal"
                  >
                    <X className="w-4 h-4 text-gray-600" />
                  </button>
                </div>

                {/* Status and Difficulty */}
                <div className="flex gap-2">
                  <Badge className={cn(getStatusBadgeStyle(selectedHomework.status))}>
                    {getStatusIcon(selectedHomework.status)}
                    <span className="ml-1">{t(`student:status.${selectedHomework.status}`)}</span>
                  </Badge>
                  <Badge className={cn(getDifficultyColor(selectedHomework.difficulty))}>
                    {t(`student:difficulty.${selectedHomework.difficulty}`)}
                  </Badge>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-gray-900 font-bold mb-3">{t('student:description')}</h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {selectedHomework.description}
                  </p>
                </div>

                {/* Instructions */}
                {selectedHomework.instructions && (
                  <div className="mb-6">
                    <h3 className="text-gray-900 font-bold mb-3">{t('student:instructions')}</h3>
                    <p className="text-gray-600 text-sm whitespace-pre-wrap leading-relaxed">
                      {selectedHomework.instructions}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 mb-6">
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{t('student:estimatedTime')}</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {selectedHomework.estimatedTime} {t('common:minutes')}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Award className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{t('student:xpReward')}</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {selectedHomework.xpReward} XP
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{t('student:dueDate')}</span>
                    </div>
                    <p className="text-gray-900 font-bold text-sm">
                      {new Date(selectedHomework.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="bg-gray-50 rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Target className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">{t('student:maxGrade')}</span>
                    </div>
                    <p className="text-gray-900 font-bold">
                      {selectedHomework.maxGrade} {t('student:points')}
                    </p>
                  </div>
                </div>

                {/* Grade and Feedback (if graded) */}
                {selectedHomework.status === 'graded' && (
                  <div className="mb-6">
                    <div className="bg-green-50 rounded-xl p-4 mb-4">
                      <div className="flex items-center justify-between mb-3">
                        <span className="text-green-700 text-sm font-medium">{t('student:yourGrade')}</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-500" />
                          <span className="text-green-800 text-xl font-bold">
                            {selectedHomework.grade}/{selectedHomework.maxGrade}
                          </span>
                        </div>
                      </div>
                      <Progress 
                        value={(selectedHomework.grade! / selectedHomework.maxGrade) * 100} 
                        className="h-2"
                      />
                    </div>
                    
                    {selectedHomework.feedback && (
                      <div className="bg-blue-50 rounded-xl p-4">
                        <h3 className="text-blue-800 font-bold mb-3 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {t('student:teacherFeedback')}
                        </h3>
                        <p className="text-blue-700 text-sm leading-relaxed">
                          {selectedHomework.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-gray-900 font-bold mb-3">{t('student:attachments')}</h3>
                    <div className="space-y-3">
                      {selectedHomework.attachments.map((file, idx) => (
                        <button
                          key={idx}
                          className="w-full bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-4 flex items-center gap-3"
                          onClick={() => {
                            // Download file
                            window.open(`/api/homework/${selectedHomework.id}/attachment/${file}`, '_blank');
                          }}
                          data-testid={`button-download-attachment-${idx}`}
                        >
                          <FileText className="w-5 h-5 text-gray-600" />
                          <span className="text-gray-700 text-sm flex-1 text-left font-medium">
                            {file}
                          </span>
                          <Download className="w-4 h-4 text-gray-500" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Section (if pending or in_progress) */}
                {(selectedHomework.status === 'pending' || selectedHomework.status === 'in_progress') && (
                  <div className="space-y-4">
                    <h3 className="text-gray-900 font-bold">{t('student:submitYourWork')}</h3>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full bg-gray-50 hover:bg-gray-100 transition-colors rounded-xl p-6 border-2 border-dashed border-gray-300 flex flex-col items-center gap-3"
                      data-testid="button-upload-file"
                    >
                      <Upload className="w-8 h-8 text-gray-500" />
                      <span className="text-gray-700 text-sm font-medium">{t('student:uploadFile')}</span>
                      <span className="text-gray-500 text-xs">
                        PDF, DOC, DOCX, TXT, JPG, PNG
                      </span>
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          submitHomework.mutate({ 
                            id: selectedHomework.id, 
                            file 
                          });
                        }
                      }}
                    />

                    <Button
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl"
                      onClick={() => {
                        submitHomework.mutate({ 
                          id: selectedHomework.id,
                          submission: 'Text submission'
                        });
                      }}
                      disabled={submitHomework.isPending}
                      data-testid="button-submit-homework"
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitHomework.isPending ? t('student:submitting') : t('student:submitHomework')}
                    </Button>
                  </div>
                )}

                {/* Submitted Files */}
                {selectedHomework.submissionFiles && selectedHomework.submissionFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-gray-900 font-bold mb-3">{t('student:submittedFiles')}</h3>
                    <div className="space-y-3">
                      {selectedHomework.submissionFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="bg-green-50 rounded-xl p-4 flex items-center gap-3"
                          data-testid={`submitted-file-${idx}`}
                        >
                          <CheckCircle className="w-5 h-5 text-green-600" />
                          <span className="text-green-700 text-sm flex-1 font-medium">
                            {file}
                          </span>
                        </div>
                      ))}
                    </div>
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