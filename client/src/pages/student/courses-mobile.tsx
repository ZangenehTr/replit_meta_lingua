import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  BookOpen,
  Clock,
  Calendar,
  Users,
  User,
  ChevronRight,
  Filter,
  Star,
  TrendingUp,
  Target,
  Award,
  Play,
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // weeks
  sessionsPerWeek: number;
  totalSessions: number;
  completedSessions: number;
  progress: number;
  startDate: string;
  endDate: string;
  nextSession?: {
    date: string;
    time: string;
    topic: string;
  };
  status: 'active' | 'upcoming' | 'completed' | 'paused';
  enrolledStudents: number;
  maxStudents: number;
  rating?: number;
  type: 'group' | 'individual';
  schedule: string;
}

export default function StudentCoursesMobile() {
  const { t } = useTranslation();
  const [filterStatus, setFilterStatus] = useState<string>('all');

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/student/courses', filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      
      const response = await fetch(`/api/student/courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Continue course mutation
  const continueCourse = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/student/courses/${courseId}/continue`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to continue course');
      return response.json();
    },
    onSuccess: (data) => {
      if (data.sessionUrl) {
        window.location.href = data.sessionUrl;
      }
      toast({
        title: t('student:continueSuccess'),
        description: t('student:continueSuccessDesc'),
      });
    }
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-500';
      case 'upcoming': return 'bg-blue-500';
      case 'completed': return 'bg-gray-500';
      case 'paused': return 'bg-yellow-500';
      default: return 'bg-gray-500';
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('fa-IR', { 
      month: 'short', 
      day: 'numeric'
    });
  };

  const activeCourses = courses.filter(c => c.status === 'active');
  const completedCourses = courses.filter(c => c.status === 'completed');

  return (
    <MobileLayout
      title={t('student:courses')}
      showBack={false}
      gradient="warm"
    >
      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-3 text-center">
          <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {activeCourses.length}
          </p>
          <p className="text-white/60 text-xs">{t('student:active')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {completedCourses.length}
          </p>
          <p className="text-white/60 text-xs">{t('student:completed')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {Math.round(
              courses.reduce((acc, c) => acc + c.progress, 0) / Math.max(courses.length, 1)
            )}%
          </p>
          <p className="text-white/60 text-xs">{t('student:avgProgress')}</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div 
        className="flex gap-2 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {['all', 'active', 'upcoming', 'completed'].map((status) => (
          <button
            key={status}
            onClick={() => setFilterStatus(status)}
            className={`
              flex-1 py-2 px-3 rounded-xl transition-all duration-200
              ${filterStatus === status 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:courses.${status}`)}
          </button>
        ))}
      </motion.div>

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <MobileCard className="text-center py-12">
          <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noCourses')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {courses.map((course, index) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MobileCard className="relative overflow-hidden">
                {/* Status Indicator */}
                <div className={`absolute top-0 left-0 w-1 h-full ${getStatusColor(course.status)}`} />
                
                <div className="pl-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        {course.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {course.instructor}
                      </p>
                    </div>
                    <Badge className={`${getLevelColor(course.level)} border-0`}>
                      {t(`student:level.${course.level}`)}
                    </Badge>
                  </div>

                  {/* Course Info */}
                  <div className="flex flex-wrap gap-3 mb-3">
                    <div className="flex items-center gap-1">
                      {course.type === 'group' ? (
                        <>
                          <Users className="w-4 h-4 text-white/50" />
                          <span className="text-white/60 text-xs">
                            {course.enrolledStudents}/{course.maxStudents}
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-white/50" />
                          <span className="text-white/60 text-xs">
                            {t('student:individual')}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">
                        {course.duration} {t('student:weeks')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-white/50" />
                      <span className="text-white/60 text-xs">
                        {course.sessionsPerWeek}x/{t('student:week')}
                      </span>
                    </div>
                    {course.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        <span className="text-white/60 text-xs">
                          {course.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {course.status === 'active' && (
                    <div className="mb-3">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-white/60">
                          {t('student:progress')}
                        </span>
                        <span className="text-white/80">
                          {course.completedSessions}/{course.totalSessions} {t('student:sessions')}
                        </span>
                      </div>
                      <Progress value={course.progress} className="h-2" />
                    </div>
                  )}

                  {/* Next Session */}
                  {course.nextSession && course.status === 'active' && (
                    <div className="glass-card p-3 mb-3">
                      <p className="text-white/60 text-xs mb-1">
                        {t('student:nextSession')}
                      </p>
                      <p className="text-white font-medium text-sm mb-1">
                        {course.nextSession.topic}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-white/50" />
                          <span className="text-white/70 text-xs">
                            {formatDate(course.nextSession.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-3 h-3 text-white/50" />
                          <span className="text-white/70 text-xs">
                            {course.nextSession.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {course.status === 'active' && (
                    <motion.button
                      className="w-full py-2 bg-white/20 rounded-lg text-white font-medium flex items-center justify-center gap-2"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => continueCourse.mutate(course.id)}
                    >
                      <Play className="w-4 h-4" />
                      {t('student:continueLearning')}
                      <ChevronRight className="w-4 h-4" />
                    </motion.button>
                  )}

                  {course.status === 'upcoming' && (
                    <div className="text-center py-2 bg-blue-500/20 rounded-lg">
                      <span className="text-blue-300 text-sm">
                        {t('student:startsOn')} {formatDate(course.startDate)}
                      </span>
                    </div>
                  )}

                  {course.status === 'completed' && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Award className="w-4 h-4 text-yellow-400" />
                        <span className="text-white/70 text-sm">
                          {t('student:courseCompleted')}
                        </span>
                      </div>
                      <Button size="sm" variant="outline">
                        {t('student:viewCertificate')}
                      </Button>
                    </div>
                  )}

                  {course.status === 'paused' && (
                    <div className="flex items-center justify-center py-2 bg-yellow-500/20 rounded-lg">
                      <AlertCircle className="w-4 h-4 text-yellow-300 mr-2" />
                      <span className="text-yellow-300 text-sm">
                        {t('student:coursePaused')}
                      </span>
                    </div>
                  )}
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Explore More Button */}
      <motion.button
        className="w-full glass-card p-4 mt-6 mb-20 flex items-center justify-between"
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <Target className="w-6 h-6 text-purple-400" />
          <span className="text-white font-medium">{t('student:exploreMoreCourses')}</span>
        </div>
        <ChevronRight className="w-5 h-5 text-white/50" />
      </motion.button>
    </MobileLayout>
  );
}