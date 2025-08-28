import React, { useState, useRef } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
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
  Zap
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
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
  const { t } = useTranslation();
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
      case 'easy': return 'text-green-400 bg-green-500/20';
      case 'medium': return 'text-yellow-400 bg-yellow-500/20';
      case 'hard': return 'text-red-400 bg-red-500/20';
      default: return 'text-gray-400 bg-gray-500/20';
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
    <MobileLayout
      title={t('student:homework')}
      showBack={false}
      gradient="warm"
    >
      {/* Header Stats with Progress */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        {/* Progress Card */}
        <MobileCard className="mb-4">
          <div className="flex justify-between items-center mb-2">
            <h3 className="text-white/80 text-sm font-medium">{t('student:overallProgress')}</h3>
            <span className="text-white text-lg font-bold">{completionPercentage}%</span>
          </div>
          <Progress value={completionPercentage} className="h-2 mb-3" />
          <div className="flex justify-between text-xs text-white/60">
            <span>{stats?.submitted || 0} {t('student:submitted')}</span>
            <span>{stats?.graded || 0} {t('student:graded')}</span>
            <span>{stats?.pending || 0} {t('student:pending')}</span>
          </div>
        </MobileCard>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
          <motion.div 
            className="glass-card p-3 text-center relative overflow-hidden"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-yellow-500/10 rounded-full -mr-10 -mt-10" />
            <Zap className="w-5 h-5 text-yellow-400 mx-auto mb-1 relative z-10" />
            <p className="text-white text-lg font-bold relative z-10">
              {stats?.totalXpEarned || 0}
            </p>
            <p className="text-white/60 text-xs relative z-10">{t('student:xpEarned')}</p>
          </motion.div>

          <motion.div 
            className="glass-card p-3 text-center relative overflow-hidden"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-green-500/10 rounded-full -mr-10 -mt-10" />
            <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1 relative z-10" />
            <p className="text-white text-lg font-bold relative z-10">
              {stats?.averageGrade ? Math.round(stats.averageGrade) : 0}%
            </p>
            <p className="text-white/60 text-xs relative z-10">{t('student:avgGrade')}</p>
          </motion.div>

          <motion.div 
            className="glass-card p-3 text-center relative overflow-hidden"
            whileTap={{ scale: 0.98 }}
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-orange-500/10 rounded-full -mr-10 -mt-10" />
            <AlertCircle className="w-5 h-5 text-orange-400 mx-auto mb-1 relative z-10" />
            <p className="text-white text-lg font-bold relative z-10">
              {stats?.upcomingDeadlines?.length || 0}
            </p>
            <p className="text-white/60 text-xs relative z-10">{t('student:upcoming')}</p>
          </motion.div>
        </div>
      </motion.div>

      {/* Filter Section */}
      <motion.div 
        className="mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {/* Status Tabs */}
        <div className="flex gap-2 mb-3">
          {['all', 'pending', 'submitted', 'graded'].map((status) => (
            <button
              key={status}
              onClick={() => setFilterStatus(status as any)}
              className={`
                flex-1 py-2 px-3 rounded-xl transition-all duration-200
                ${filterStatus === status 
                  ? 'bg-white/30 text-white font-medium shadow-lg' 
                  : 'bg-white/10 text-white/70 hover:bg-white/15'}
                tap-scale
              `}
            >
              {t(`student:homework.${status}`)}
            </button>
          ))}
        </div>

        {/* Additional Filters */}
        <div className="flex gap-2">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="flex items-center gap-2 px-3 py-1.5 bg-white/10 rounded-lg text-white/70 text-sm"
          >
            <Filter className="w-4 h-4" />
            {t('common:filters')}
          </button>
          {selectedDifficulty && (
            <button
              onClick={() => setSelectedDifficulty(null)}
              className="flex items-center gap-1 px-3 py-1.5 bg-white/20 rounded-lg text-white text-sm"
            >
              {t(`student:difficulty.${selectedDifficulty}`)}
              <X className="w-3 h-3" />
            </button>
          )}
        </div>

        {/* Filter Dropdown */}
        <AnimatePresence>
          {showFilters && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="mt-3 p-3 glass-card space-y-2">
                <p className="text-white/60 text-xs mb-2">{t('student:filterByDifficulty')}</p>
                <div className="flex gap-2">
                  {['easy', 'medium', 'hard'].map((diff) => (
                    <button
                      key={diff}
                      onClick={() => {
                        setSelectedDifficulty(diff);
                        setShowFilters(false);
                      }}
                      className={`
                        flex-1 py-1.5 px-3 rounded-lg text-sm
                        ${getDifficultyColor(diff)}
                      `}
                    >
                      {t(`student:difficulty.${diff}`)}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>

      {/* Homework List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-lg"></div>
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                  <div className="h-3 bg-white/20 rounded w-1/2"></div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredHomework.length === 0 ? (
        <MobileCard className="text-center py-12">
          <BookOpen className="w-16 h-16 text-white/30 mx-auto mb-4" />
          <p className="text-white/70 mb-2">{t('student:noHomework')}</p>
          <p className="text-white/50 text-sm">{t('student:checkBackLater')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {filteredHomework.map((item, index) => {
            const dueInfo = formatDate(item.dueDate);
            const isOverdue = dueInfo.overdue;
            const isUrgent = dueInfo.urgent;

            return (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MobileCard 
                  className={`relative overflow-hidden ${isOverdue ? 'border border-red-500/30' : ''}`}
                  onClick={() => setSelectedHomework(item)}
                >
                  {/* Status Bar */}
                  <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(item.status)}`} />
                  
                  <div className="pl-4">
                    {/* Header with Icon */}
                    <div className="flex items-start gap-3 mb-3">
                      <div className={`
                        w-10 h-10 rounded-lg flex items-center justify-center
                        ${getStatusColor(item.status)} bg-opacity-20
                      `}>
                        {getStatusIcon(item.status)}
                      </div>
                      <div className="flex-1">
                        <h3 className="text-white font-semibold text-base line-clamp-2 mb-1">
                          {item.title}
                        </h3>
                        <p className="text-white/50 text-xs">
                          {item.courseTitle} • {item.teacherName}
                        </p>
                      </div>
                      <Badge className={`${getDifficultyColor(item.difficulty)} border-0`}>
                        {t(`student:difficulty.${item.difficulty}`)}
                      </Badge>
                    </div>

                    {/* Description */}
                    {item.description && (
                      <p className="text-white/60 text-sm mb-3 line-clamp-2">
                        {item.description}
                      </p>
                    )}

                    {/* Info Grid */}
                    <div className="grid grid-cols-2 gap-2 mb-3">
                      <div className="flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/60 text-xs">
                          {item.estimatedTime} {t('common:minutes')}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Award className="w-3.5 h-3.5 text-white/40" />
                        <span className="text-white/60 text-xs">
                          {item.xpReward} XP
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="w-3.5 h-3.5 text-white/40" />
                        <span className={`text-xs ${isUrgent ? 'text-orange-400 font-medium' : 'text-white/60'}`}>
                          {dueInfo.text}
                        </span>
                      </div>
                      {item.attachments && item.attachments.length > 0 && (
                        <div className="flex items-center gap-1.5">
                          <Paperclip className="w-3.5 h-3.5 text-white/40" />
                          <span className="text-white/60 text-xs">
                            {item.attachments.length} {t('student:files')}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Status-based Actions */}
                    {item.status === 'graded' && (
                      <div className="bg-green-500/10 rounded-lg p-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Trophy className="w-4 h-4 text-green-400" />
                            <span className="text-white text-sm font-semibold">
                              {t('student:grade')}: {item.grade}/{item.maxGrade}
                            </span>
                          </div>
                          {item.feedback && (
                            <Badge className="bg-green-500/20 text-green-300 border-0">
                              <MessageSquare className="w-3 h-3 mr-1" />
                              {t('student:feedbackAvailable')}
                            </Badge>
                          )}
                        </div>
                      </div>
                    )}

                    {item.status === 'pending' && (
                      <motion.button
                        className="w-full py-2.5 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg text-white font-medium flex items-center justify-center gap-2 hover:from-purple-500/30 hover:to-pink-500/30 transition-all"
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHomework(item);
                        }}
                      >
                        <Upload className="w-4 h-4" />
                        {t('student:startHomework')}
                        <ChevronRight className="w-4 h-4" />
                      </motion.button>
                    )}

                    {item.status === 'in_progress' && (
                      <motion.button
                        className="w-full py-2.5 bg-blue-500/20 rounded-lg text-blue-300 font-medium flex items-center justify-center gap-2"
                        whileTap={{ scale: 0.98 }}
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedHomework(item);
                        }}
                      >
                        <Send className="w-4 h-4" />
                        {t('student:continueHomework')}
                      </motion.button>
                    )}

                    {item.status === 'submitted' && (
                      <div className="text-center py-2.5 bg-purple-500/20 rounded-lg">
                        <span className="text-purple-300 text-sm font-medium flex items-center justify-center gap-2">
                          <CheckCircle className="w-4 h-4" />
                          {t('student:awaitingGrade')}
                        </span>
                      </div>
                    )}

                    {item.status === 'late' && (
                      <div className="text-center py-2.5 bg-red-500/20 rounded-lg">
                        <span className="text-red-300 text-sm font-medium flex items-center justify-center gap-2">
                          <AlertTriangle className="w-4 h-4" />
                          {t('student:lateSubmission')}
                        </span>
                      </div>
                    )}
                  </div>
                </MobileCard>
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
              className="w-full bg-gradient-to-b from-purple-900/95 to-pink-900/95 rounded-t-3xl max-h-[90vh] overflow-hidden"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="p-6 pb-4 border-b border-white/10">
                <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
                
                <div className="flex items-start justify-between mb-3">
                  <div className="flex-1">
                    <h2 className="text-white text-xl font-bold mb-1">
                      {selectedHomework.title}
                    </h2>
                    <p className="text-white/60 text-sm">
                      {selectedHomework.courseTitle} • {selectedHomework.teacherName}
                    </p>
                  </div>
                  <button
                    onClick={() => setSelectedHomework(null)}
                    className="p-2 bg-white/10 rounded-lg"
                  >
                    <X className="w-4 h-4 text-white/70" />
                  </button>
                </div>

                {/* Status and Difficulty */}
                <div className="flex gap-2">
                  <Badge className={`${getStatusColor(selectedHomework.status)} text-white border-0`}>
                    {getStatusIcon(selectedHomework.status)}
                    <span className="ml-1">{t(`student:status.${selectedHomework.status}`)}</span>
                  </Badge>
                  <Badge className={`${getDifficultyColor(selectedHomework.difficulty)} border-0`}>
                    {t(`student:difficulty.${selectedHomework.difficulty}`)}
                  </Badge>
                </div>
              </div>

              {/* Modal Content */}
              <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
                {/* Description */}
                <div className="mb-6">
                  <h3 className="text-white font-semibold mb-2">{t('student:description')}</h3>
                  <p className="text-white/70 text-sm">
                    {selectedHomework.description}
                  </p>
                </div>

                {/* Instructions */}
                {selectedHomework.instructions && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">{t('student:instructions')}</h3>
                    <p className="text-white/70 text-sm whitespace-pre-wrap">
                      {selectedHomework.instructions}
                    </p>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-3 mb-6">
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">{t('student:estimatedTime')}</span>
                    </div>
                    <p className="text-white font-medium">
                      {selectedHomework.estimatedTime} {t('common:minutes')}
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Award className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">{t('student:xpReward')}</span>
                    </div>
                    <p className="text-white font-medium">
                      {selectedHomework.xpReward} XP
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">{t('student:dueDate')}</span>
                    </div>
                    <p className="text-white font-medium text-sm">
                      {new Date(selectedHomework.dueDate).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="glass-card p-3">
                    <div className="flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">{t('student:maxGrade')}</span>
                    </div>
                    <p className="text-white font-medium">
                      {selectedHomework.maxGrade} {t('student:points')}
                    </p>
                  </div>
                </div>

                {/* Grade and Feedback (if graded) */}
                {selectedHomework.status === 'graded' && (
                  <div className="mb-6">
                    <div className="bg-green-500/10 rounded-lg p-4 mb-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-white/70 text-sm">{t('student:yourGrade')}</span>
                        <div className="flex items-center gap-2">
                          <Trophy className="w-5 h-5 text-yellow-400" />
                          <span className="text-white text-xl font-bold">
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
                      <div className="glass-card p-4">
                        <h3 className="text-white font-semibold mb-2 flex items-center gap-2">
                          <MessageSquare className="w-4 h-4" />
                          {t('student:teacherFeedback')}
                        </h3>
                        <p className="text-white/70 text-sm">
                          {selectedHomework.feedback}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Attachments */}
                {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                  <div className="mb-6">
                    <h3 className="text-white font-semibold mb-2">{t('student:attachments')}</h3>
                    <div className="space-y-2">
                      {selectedHomework.attachments.map((file, idx) => (
                        <button
                          key={idx}
                          className="w-full glass-card p-3 flex items-center gap-3 hover:bg-white/10 transition-colors"
                          onClick={() => {
                            // Download file
                            window.open(`/api/homework/${selectedHomework.id}/attachment/${file}`, '_blank');
                          }}
                        >
                          <FileText className="w-5 h-5 text-white/70" />
                          <span className="text-white/80 text-sm flex-1 text-left">
                            {file}
                          </span>
                          <Download className="w-4 h-4 text-white/50" />
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Submission Section (if pending or in_progress) */}
                {(selectedHomework.status === 'pending' || selectedHomework.status === 'in_progress') && (
                  <div className="space-y-3">
                    <h3 className="text-white font-semibold">{t('student:submitYourWork')}</h3>
                    
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="w-full glass-card p-4 border-2 border-dashed border-white/30 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
                    >
                      <Upload className="w-8 h-8 text-white/50" />
                      <span className="text-white/70 text-sm">{t('student:uploadFile')}</span>
                      <span className="text-white/50 text-xs">
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
                      className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600"
                      onClick={() => {
                        submitHomework.mutate({ 
                          id: selectedHomework.id,
                          submission: 'Text submission'
                        });
                      }}
                      disabled={submitHomework.isPending}
                    >
                      <Send className="w-4 h-4 mr-2" />
                      {submitHomework.isPending ? t('student:submitting') : t('student:submitHomework')}
                    </Button>
                  </div>
                )}

                {/* Submitted Files */}
                {selectedHomework.submissionFiles && selectedHomework.submissionFiles.length > 0 && (
                  <div className="mt-6">
                    <h3 className="text-white font-semibold mb-2">{t('student:submittedFiles')}</h3>
                    <div className="space-y-2">
                      {selectedHomework.submissionFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="glass-card p-3 flex items-center gap-3"
                        >
                          <CheckCircle className="w-5 h-5 text-green-400" />
                          <span className="text-white/80 text-sm flex-1">
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
    </MobileLayout>
  );
}