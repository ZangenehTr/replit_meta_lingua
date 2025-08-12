import React, { useState } from 'react';
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
  Target
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Homework {
  id: number;
  title: string;
  description: string;
  courseTitle: string;
  teacherName: string;
  assignedDate: string;
  dueDate: string;
  status: 'pending' | 'in-progress' | 'submitted' | 'graded';
  grade?: number;
  maxGrade: number;
  feedback?: string;
  attachments?: string[];
  submissionUrl?: string;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number; // in minutes
  xpReward: number;
}

export default function StudentHomeworkMobile() {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'submitted' | 'graded'>('pending');
  const [selectedHomework, setSelectedHomework] = useState<Homework | null>(null);

  // Fetch homework
  const { data: homework = [], isLoading } = useQuery<Homework[]>({
    queryKey: ['/api/student/homework', filterStatus],
    queryFn: async () => {
      const response = await fetch(`/api/student/homework?status=${filterStatus}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch homework');
      return response.json();
    }
  });

  // Submit homework mutation
  const submitHomework = useMutation({
    mutationFn: async ({ id, file }: { id: number; file: File }) => {
      const formData = new FormData();
      formData.append('file', file);
      
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
    onSuccess: () => {
      toast({
        title: t('student:homeworkSubmitted'),
        description: t('student:homeworkSubmittedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/homework'] });
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
      case 'in-progress': return 'bg-blue-500';
      case 'submitted': return 'bg-purple-500';
      case 'graded': return 'bg-green-500';
      default: return 'bg-gray-500';
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
    
    if (diffDays === 0) return t('student:dueToday');
    if (diffDays === 1) return t('student:dueTomorrow');
    if (diffDays > 0) return t('student:dueInDays', { days: diffDays });
    return t('student:overdue');
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>, homeworkId: number) => {
    const file = e.target.files?.[0];
    if (file) {
      submitHomework.mutate({ id: homeworkId, file });
    }
  };

  return (
    <MobileLayout
      title={t('student:homework')}
      showBack={false}
      gradient="warm"
    >
      {/* Stats Cards */}
      <motion.div 
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-3 text-center">
          <AlertCircle className="w-6 h-6 text-orange-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {homework.filter(h => h.status === 'pending').length}
          </p>
          <p className="text-white/60 text-xs">{t('student:pending')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {homework.filter(h => h.status === 'submitted').length}
          </p>
          <p className="text-white/60 text-xs">{t('student:submitted')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Star className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {homework.filter(h => h.status === 'graded').reduce((acc, h) => acc + (h.grade || 0), 0)}
          </p>
          <p className="text-white/60 text-xs">{t('student:totalPoints')}</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div 
        className="flex gap-2 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {['all', 'pending', 'submitted', 'graded'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status as any)}
            className={`
              flex-1 py-2 px-3 rounded-xl transition-all duration-200
              ${filterStatus === status 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:homework.${status}`)}
          </button>
        ))}
      </motion.div>

      {/* Homework List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : homework.length === 0 ? (
        <MobileCard className="text-center py-12">
          <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noHomework')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {homework.map((item, index) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MobileCard 
                className="relative overflow-hidden"
                onClick={() => setSelectedHomework(item)}
              >
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(item.status)}`} />
                
                <div className="pl-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg line-clamp-1">
                        {item.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {item.courseTitle}
                      </p>
                    </div>
                    <Badge className={`${getDifficultyColor(item.difficulty)} border-0`}>
                      {t(`student:difficulty.${item.difficulty}`)}
                    </Badge>
                  </div>

                  {/* Description */}
                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {item.description}
                  </p>

                  {/* Metadata */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">
                        {item.estimatedTime} {t('common:minutes')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">
                        {item.xpReward} XP
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className={`text-xs ${
                        item.status === 'pending' && new Date(item.dueDate) < new Date() 
                          ? 'text-red-400' 
                          : 'text-white/60'
                      }`}>
                        {formatDate(item.dueDate)}
                      </span>
                    </div>
                  </div>

                  {/* Grade or Action */}
                  {item.status === 'graded' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Star className="w-4 h-4 text-yellow-400" />
                        <span className="text-white font-semibold">
                          {item.grade}/{item.maxGrade}
                        </span>
                      </div>
                      {item.feedback && (
                        <span className="text-white/60 text-xs">
                          {t('student:feedbackAvailable')}
                        </span>
                      )}
                    </div>
                  )}

                  {item.status === 'pending' && (
                    <motion.button
                      className="w-full py-2 bg-white/20 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                      onClick={(e) => {
                        e.stopPropagation();
                        document.getElementById(`file-upload-${item.id}`)?.click();
                      }}
                    >
                      <Upload className="w-4 h-4" />
                      {t('student:submitHomework')}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {item.status === 'submitted' && (
                    <div className="text-center py-2 bg-purple-500/20 rounded-lg">
                      <span className="text-purple-300 text-sm font-medium">
                        {t('student:awaitingGrade')}
                      </span>
                    </div>
                  )}

                  {/* Hidden file input */}
                  <input
                    id={`file-upload-${item.id}`}
                    type="file"
                    className="hidden"
                    accept=".pdf,.doc,.docx,.txt,.jpg,.png"
                    onChange={(e) => handleFileUpload(e, item.id)}
                  />
                </div>
              </MobileCard>
            </motion.div>
          ))}
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
              className="w-full bg-gradient-to-b from-purple-900/90 to-pink-900/90 rounded-t-3xl p-6 max-h-[80vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
              
              <h2 className="text-white text-xl font-bold mb-2">
                {selectedHomework.title}
              </h2>
              
              <p className="text-white/70 mb-4">
                {selectedHomework.description}
              </p>

              {selectedHomework.feedback && (
                <div className="glass-card p-4 mb-4">
                  <h3 className="text-white font-semibold mb-2">
                    {t('student:teacherFeedback')}
                  </h3>
                  <p className="text-white/70 text-sm">
                    {selectedHomework.feedback}
                  </p>
                </div>
              )}

              {selectedHomework.attachments && selectedHomework.attachments.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-white font-semibold mb-2">
                    {t('student:attachments')}
                  </h3>
                  <div className="space-y-2">
                    {selectedHomework.attachments.map((file, idx) => (
                      <button
                        key={idx}
                        className="w-full glass-card p-3 flex items-center gap-3"
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

              <Button
                className="w-full"
                onClick={() => setSelectedHomework(null)}
              >
                {t('common:close')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}