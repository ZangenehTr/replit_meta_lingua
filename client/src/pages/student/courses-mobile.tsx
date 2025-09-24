import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
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
  AlertCircle,
  Menu,
  Bell
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { cn } from '@/lib/utils';
import { LevelBasedCourseDiscovery } from '@/components/dashboard/level-based-course-discovery';
import { StudentLevelBanner } from '@/components/dashboard/StudentLevelBanner';

interface Course {
  id: number;
  title: string;
  description: string;
  instructor: string;
  instructorPhoto?: string;
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

interface CurriculumLevel {
  id: number;
  code: string;
  name: string;
  orderIndex: number;
  cefrBand?: string;
  curriculum: {
    id: number;
    name: string;
    key: string;
  };
}

interface StudentCurriculumProgress {
  currentLevel: CurriculumLevel;
  progressPercentage: number;
  status: string;
}

export default function StudentCoursesMobile() {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [levelFilter, setLevelFilter] = useState<string>('all'); // 'all' or 'currentLevel'

  // Fetch student's curriculum level and progress  
  const { data: curriculumProgress, error: curriculumError, isLoading: curriculumLoading } = useQuery<StudentCurriculumProgress>({
    queryKey: ['/api/curriculum/student-level'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      console.log('Courses page: Fetching curriculum level with token:', token?.substring(0, 10) + '...');
      
      const response = await fetch('/api/curriculum/student-level', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Courses page: Curriculum API response status:', response.status);
      
      if (!response.ok) {
        const errorText = await response.text();
        console.error('Courses page: Curriculum API failed:', errorText);
        throw new Error(`Failed to fetch curriculum level: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Courses page: Curriculum progress data:', data);
      return data;
    },
    enabled: true,
    retry: 1
  });

  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/student/courses', filterStatus, levelFilter],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterStatus !== 'all') params.append('status', filterStatus);
      if (levelFilter !== 'all') params.append('levelFilter', levelFilter);
      
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
                <h1 className="text-white font-bold text-xl">{t('student:courses')}</h1>
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
        {/* Stats Overview */}
        <motion.div
          className="grid grid-cols-3 gap-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
        >
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg text-center">
            <BookOpen className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <p className="text-gray-900 text-xl font-bold">
              {activeCourses.length}
            </p>
            <p className="text-gray-600 text-xs">{t('student:active')}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg text-center">
            <CheckCircle className="w-8 h-8 text-green-500 mx-auto mb-2" />
            <p className="text-gray-900 text-xl font-bold">
              {completedCourses.length}
            </p>
            <p className="text-gray-600 text-xs">{t('student:completed')}</p>
          </div>
          <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg text-center">
            <TrendingUp className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <p className="text-gray-900 text-xl font-bold">
              {Math.round(
                courses.reduce((acc, c) => acc + c.progress, 0) / Math.max(courses.length, 1)
              )}%
            </p>
            <p className="text-gray-600 text-xs">{t('student:avgProgress')}</p>
          </div>
        </motion.div>

        {/* Student Level Banner */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          <StudentLevelBanner
            currentLevel={curriculumProgress?.currentLevel}
            progressPercentage={curriculumProgress?.progressPercentage || 0}
            nextLevel={curriculumProgress?.nextLevel}
            status={curriculumProgress?.status || 'unassigned'}
            variant="default"
            className="mb-6"
            data-testid="student-level-banner-courses"
          />
        </motion.div>

        {/* Level Filter Toggle */}
        {curriculumProgress?.currentLevel && (
          <motion.div
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-4 shadow-lg"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.18 }}
          >
            <div className="flex items-center justify-center">
              <div className="flex bg-gray-100 rounded-full p-1 w-full max-w-md">
                <button
                  onClick={() => setLevelFilter('currentLevel')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-full transition-all duration-200 text-sm font-medium flex items-center justify-center gap-2",
                    levelFilter === 'currentLevel'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  )}
                  data-testid="button-current-level-filter"
                >
                  <Target className="w-4 h-4" />
                  <span>دوره‌های سطح شما</span>
                </button>
                
                <button
                  onClick={() => setLevelFilter('all')}
                  className={cn(
                    "flex-1 py-2 px-4 rounded-full transition-all duration-200 text-sm font-medium",
                    levelFilter === 'all'
                      ? 'bg-blue-500 text-white shadow-md'
                      : 'text-gray-600 hover:bg-gray-200'
                  )}
                  data-testid="button-all-courses-filter"
                >
                  نمایش همه دوره‌ها
                </button>
              </div>
            </div>
            
            {levelFilter === 'currentLevel' && (
              <motion.p 
                className="text-center text-gray-600 text-xs mt-2"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                data-testid="text-level-filter-description"
              >
                نمایش دوره‌های مناسب برای {curriculumProgress.currentLevel.name}
              </motion.p>
            )}
          </motion.div>
        )}

        {/* Filter Tabs */}
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xl font-bold text-gray-900">
              {t('student:myCourses')}
            </h3>
            <Badge className="bg-blue-500 text-white px-3 py-1">
              {courses.length} {t('student:total')}
            </Badge>
          </div>
          
          <div className="flex gap-2">
            {['all', 'active', 'upcoming', 'completed'].map((status) => (
              <button
                key={status}
                onClick={() => setFilterStatus(status)}
                className={cn(
                  "flex-1 py-2 px-3 rounded-xl transition-all duration-200 text-sm font-medium",
                  filterStatus === status 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                )}
                data-testid={`filter-${status}`}
              >
                {t(`student:courses.${status}`)}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Courses List */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2 mb-4"></div>
                <div className="h-2 bg-gray-200 rounded w-full"></div>
              </div>
            ))}
          </div>
        ) : courses.length === 0 ? (
          <motion.div 
            className="bg-white/95 backdrop-blur-sm rounded-2xl p-12 shadow-lg text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">{t('student:noCourses')}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {courses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: 0.3 + index * 0.1 }}
              >
                <div className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg relative overflow-hidden">
                  {/* Status Indicator */}
                  <div className={cn(
                    "absolute top-0 left-0 w-1 h-full",
                    course.status === 'active' && "bg-green-500",
                    course.status === 'upcoming' && "bg-blue-500", 
                    course.status === 'completed' && "bg-gray-500",
                    course.status === 'paused' && "bg-yellow-500"
                  )} />
                  
                  <div className="pl-4">
                  {/* Header */}
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex items-center gap-3 flex-1">
                      {/* Teacher Avatar */}
                      <Avatar className="h-14 w-14 border-3 border-white shadow-lg" data-testid={`avatar-teacher-${course.id}`}>
                        <AvatarImage 
                          src={course.instructorPhoto} 
                          alt={course.instructor}
                          className="object-cover"
                        />
                        <AvatarFallback className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white font-bold text-lg">
                          {course.instructor ? course.instructor.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase() : 'TC'}
                        </AvatarFallback>
                      </Avatar>
                      
                      {/* Course Info */}
                      <div className="flex-1 min-w-0">
                        <h3 className="text-gray-900 font-bold text-lg truncate">
                          {course.title}
                        </h3>
                        <p className="text-gray-600 text-sm truncate">
                          {course.instructor}
                        </p>
                      </div>
                    </div>
                    
                    <Badge className={cn(
                      "border-0 shrink-0",
                      course.level === 'beginner' && "bg-green-100 text-green-700",
                      course.level === 'intermediate' && "bg-yellow-100 text-yellow-700", 
                      course.level === 'advanced' && "bg-red-100 text-red-700"
                    )}>
                      {t(`student:level.${course.level}`)}
                    </Badge>
                  </div>

                  {/* Course Info */}
                  <div className="flex flex-wrap gap-4 mb-4">
                    <div className="flex items-center gap-1">
                      {course.type === 'group' ? (
                        <>
                          <Users className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {course.enrolledStudents}/{course.maxStudents}
                          </span>
                        </>
                      ) : (
                        <>
                          <User className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {t('student:individual')}
                          </span>
                        </>
                      )}
                    </div>
                    <div className="flex items-center gap-1">
                      <Clock className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">
                        {course.duration} {t('student:weeks')}
                      </span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Calendar className="w-4 h-4 text-gray-500" />
                      <span className="text-gray-600 text-sm">
                        {course.sessionsPerWeek}x/{t('student:week')}
                      </span>
                    </div>
                    {course.rating && (
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="text-gray-600 text-sm">
                          {course.rating.toFixed(1)}
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Progress */}
                  {course.status === 'active' && (
                    <div className="mb-4">
                      <div className="flex justify-between text-sm mb-2">
                        <span className="text-gray-600">
                          {t('student:progress')}
                        </span>
                        <span className="text-gray-900 font-medium">
                          {course.completedSessions}/{course.totalSessions} {t('student:sessions')}
                        </span>
                      </div>
                      <Progress value={course.progress} className="h-3" />
                    </div>
                  )}

                  {/* Next Session */}
                  {course.nextSession && course.status === 'active' && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-600 text-xs mb-1">
                        {t('student:nextSession')}
                      </p>
                      <p className="text-gray-900 font-medium text-sm mb-2">
                        {course.nextSession.topic}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {formatDate(course.nextSession.date)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1">
                          <Clock className="w-4 h-4 text-gray-500" />
                          <span className="text-gray-600 text-sm">
                            {course.nextSession.time}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Action Button */}
                  {course.status === 'active' && (
                    <Button 
                      className="w-full bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 text-white font-bold py-3 rounded-xl"
                      onClick={() => continueCourse.mutate(course.id)}
                      data-testid={`button-continue-course-${course.id}`}
                    >
                      <Play className="w-4 h-4 mr-2" />
                      {t('student:continueLearning')}
                      <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  )}

                  {course.status === 'upcoming' && (
                    <div className="text-center py-3 bg-blue-50 rounded-xl">
                      <span className="text-blue-600 text-sm font-medium">
                        {t('student:startsOn')} {formatDate(course.startDate)}
                      </span>
                    </div>
                  )}

                  {course.status === 'completed' && (
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                      <div className="flex items-center gap-2">
                        <Award className="w-5 h-5 text-green-600" />
                        <span className="text-green-700 text-sm font-medium">
                          {t('student:courseCompleted')}
                        </span>
                      </div>
                      <Button size="sm" variant="outline" className="text-green-600 border-green-200 hover:bg-green-100">
                        {t('student:viewCertificate')}
                      </Button>
                    </div>
                  )}

                  {course.status === 'paused' && (
                    <div className="flex items-center justify-center py-3 bg-yellow-50 rounded-xl">
                      <AlertCircle className="w-5 h-5 text-yellow-600 mr-2" />
                      <span className="text-yellow-700 text-sm font-medium">
                        {t('student:coursePaused')}
                      </span>
                    </div>
                  )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        )}

        {/* Explore More Button */}
        <motion.div
          className="bg-white/95 backdrop-blur-sm rounded-2xl p-6 shadow-lg mt-6 mb-24"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.4 }}
        >
          <Button 
            className="w-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-3"
            data-testid="button-explore-more-courses"
          >
            <Target className="w-6 h-6" />
            <span className="text-lg">{t('student:exploreMoreCourses')}</span>
            <ChevronRight className="w-6 h-6" />
          </Button>
        </motion.div>
      </div>
    </div>
  );
}