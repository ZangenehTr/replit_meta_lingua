import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  PlayCircle,
  Clock,
  BookOpen,
  Award,
  CheckCircle,
  Lock,
  ChevronRight,
  Filter,
  Star,
  Users,
  TrendingUp,
  Download,
  Bookmark
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface VideoCourse {
  id: number;
  title: string;
  description: string;
  thumbnailUrl?: string;
  instructor: string;
  duration: number; // total minutes
  lessonsCount: number;
  completedLessons: number;
  progress: number;
  rating: number;
  enrolled: number;
  level: 'beginner' | 'intermediate' | 'advanced';
  language: string;
  price: number;
  isPurchased: boolean;
  isBookmarked: boolean;
  certificate: boolean;
  lastWatchedAt?: string;
}

interface Lesson {
  id: number;
  title: string;
  duration: number;
  videoUrl: string;
  completed: boolean;
  locked: boolean;
}

export default function StudentVideoCoursesMobile() {
  const { t } = useTranslation();
  const [filterLevel, setFilterLevel] = useState<string>('all');
  const [selectedCourse, setSelectedCourse] = useState<VideoCourse | null>(null);
  const [showPurchasedOnly, setShowPurchasedOnly] = useState(false);

  // Fetch video courses
  const { data: courses = [], isLoading } = useQuery<VideoCourse[]>({
    queryKey: ['/api/student/video-courses', filterLevel, showPurchasedOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterLevel !== 'all') params.append('level', filterLevel);
      if (showPurchasedOnly) params.append('purchased', 'true');
      
      const response = await fetch(`/api/student/video-courses?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Toggle bookmark mutation
  const toggleBookmark = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/student/video-courses/${courseId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to toggle bookmark');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:bookmarkUpdated'),
        description: t('student:bookmarkUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/video-courses'] });
    }
  });

  // Purchase course mutation
  const purchaseCourse = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/student/video-courses/${courseId}/purchase`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to purchase course');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:coursePurchased'),
        description: t('student:coursePurchasedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/video-courses'] });
      setSelectedCourse(null);
    }
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MobileLayout
      title={t('student:videoCourses')}
      showBack={false}
      gradient="learning"
    >
      {/* Stats Cards */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-3 text-center">
          <BookOpen className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {courses.filter(c => c.isPurchased).length}
          </p>
          <p className="text-white/60 text-xs">{t('student:enrolled')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {courses.filter(c => c.progress === 100).length}
          </p>
          <p className="text-white/60 text-xs">{t('student:completed')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <Award className="w-6 h-6 text-yellow-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {courses.filter(c => c.certificate && c.progress === 100).length}
          </p>
          <p className="text-white/60 text-xs">{t('student:certificates')}</p>
        </div>
      </motion.div>

      {/* Filter Options */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        <button
          onClick={() => setShowPurchasedOnly(!showPurchasedOnly)}
          className={`
            px-4 py-2 rounded-xl whitespace-nowrap transition-all
            ${showPurchasedOnly 
              ? 'bg-purple-500/30 text-purple-300' 
              : 'bg-white/10 text-white/70'}
            tap-scale
          `}
        >
          <Bookmark className="w-4 h-4 inline mr-1" />
          {t('student:myCourses')}
        </button>
        {['all', 'beginner', 'intermediate', 'advanced'].map((level) => (
          <button
            key={level}
            onClick={() => setFilterLevel(level)}
            className={`
              px-4 py-2 rounded-xl whitespace-nowrap transition-all
              ${filterLevel === level 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:level.${level}`)}
          </button>
        ))}
      </motion.div>

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex gap-4">
                <div className="w-24 h-16 bg-white/20 rounded-lg" />
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/20 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : courses.length === 0 ? (
        <MobileCard className="text-center py-12">
          <PlayCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
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
              <MobileCard 
                className="relative"
                onClick={() => setSelectedCourse(course)}
              >
                {/* Bookmark Icon */}
                <button
                  className="absolute top-3 right-3 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    toggleBookmark.mutate(course.id);
                  }}
                >
                  <Bookmark className={`w-5 h-5 ${
                    course.isBookmarked 
                      ? 'text-yellow-400 fill-yellow-400' 
                      : 'text-white/30'
                  }`} />
                </button>

                <div className="flex gap-4">
                  {/* Thumbnail */}
                  <div className="relative w-24 h-16 bg-gradient-to-br from-purple-500 to-pink-500 rounded-lg overflow-hidden flex-shrink-0">
                    {course.thumbnailUrl ? (
                      <img 
                        src={course.thumbnailUrl} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <PlayCircle className="w-8 h-8 text-white/50" />
                      </div>
                    )}
                    {!course.isPurchased && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <Lock className="w-6 h-6 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1">
                    <h3 className="text-white font-semibold line-clamp-1 mb-1">
                      {course.title}
                    </h3>
                    
                    <div className="flex items-center gap-2 mb-2">
                      <Badge className={`${getLevelColor(course.level)} border-0 text-xs`}>
                        {t(`student:level.${course.level}`)}
                      </Badge>
                      <div className="flex items-center gap-1">
                        <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                        <span className="text-white/60 text-xs">
                          {course.rating.toFixed(1)}
                        </span>
                      </div>
                      <span className="text-white/30">•</span>
                      <span className="text-white/60 text-xs">
                        {course.enrolled} {t('student:students')}
                      </span>
                    </div>

                    <p className="text-white/60 text-xs mb-2 line-clamp-1">
                      {course.instructor}
                    </p>

                    {course.isPurchased ? (
                      <div>
                        <Progress 
                          value={course.progress} 
                          className="h-1.5 mb-1"
                        />
                        <div className="flex justify-between items-center">
                          <span className="text-white/50 text-xs">
                            {course.completedLessons}/{course.lessonsCount} {t('student:lessons')}
                          </span>
                          <span className="text-white/70 text-xs font-medium">
                            {course.progress}%
                          </span>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Clock className="w-3 h-3 text-white/50" />
                          <span className="text-white/60 text-xs">
                            {formatDuration(course.duration)}
                          </span>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60 text-xs">
                            {course.lessonsCount} {t('student:lessons')}
                          </span>
                        </div>
                        <span className="text-white font-semibold text-sm">
                          {formatPrice(course.price)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Course Detail Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedCourse(null)}
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
                {selectedCourse.title}
              </h2>

              <p className="text-white/80 mb-4">
                {selectedCourse.description}
              </p>

              {/* Course Info */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="glass-card p-3">
                  <p className="text-white/60 text-xs mb-1">{t('student:instructor')}</p>
                  <p className="text-white font-medium">{selectedCourse.instructor}</p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-white/60 text-xs mb-1">{t('student:duration')}</p>
                  <p className="text-white font-medium">
                    {formatDuration(selectedCourse.duration)}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-white/60 text-xs mb-1">{t('student:lessons')}</p>
                  <p className="text-white font-medium">
                    {selectedCourse.lessonsCount} {t('student:videos')}
                  </p>
                </div>
                <div className="glass-card p-3">
                  <p className="text-white/60 text-xs mb-1">{t('student:level')}</p>
                  <p className="text-white font-medium capitalize">
                    {selectedCourse.level}
                  </p>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-2 mb-6">
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-green-400" />
                  <span className="text-white/80 text-sm">
                    {t('student:lifetimeAccess')}
                  </span>
                </div>
                {selectedCourse.certificate && (
                  <div className="flex items-center gap-2">
                    <Award className="w-4 h-4 text-yellow-400" />
                    <span className="text-white/80 text-sm">
                      {t('student:certificateIncluded')}
                    </span>
                  </div>
                )}
                <div className="flex items-center gap-2">
                  <Download className="w-4 h-4 text-blue-400" />
                  <span className="text-white/80 text-sm">
                    {t('student:downloadableResources')}
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              {selectedCourse.isPurchased ? (
                <Button className="w-full">
                  <PlayCircle className="w-4 h-4 mr-2" />
                  {t('student:continueLearning')}
                </Button>
              ) : (
                <div className="space-y-3">
                  <div className="text-center">
                    <span className="text-white text-2xl font-bold">
                      {formatPrice(selectedCourse.price)}
                    </span>
                  </div>
                  <Button
                    className="w-full"
                    onClick={() => purchaseCourse.mutate(selectedCourse.id)}
                  >
                    {t('student:purchaseCourse')}
                  </Button>
                </div>
              )}
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}