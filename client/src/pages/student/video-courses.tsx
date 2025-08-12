import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { useLocation } from "wouter";
import { 
  PlayCircle,
  Clock,
  BookOpen,
  Trophy,
  Star,
  Lock,
  CheckCircle,
  TrendingUp,
  Users,
  ChevronRight,
  Filter,
  Search,
  Heart,
  BarChart,
  Award,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface VideoCourse {
  id: number;
  title: string;
  description: string;
  instructor: string;
  instructorImage?: string;
  thumbnail: string;
  duration: string; // e.g., "2h 30m"
  totalLessons: number;
  completedLessons: number;
  progress: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  rating: number;
  totalRatings: number;
  language: string;
  tags: string[];
  price: number;
  isPurchased: boolean;
  isFavorite: boolean;
  lastWatched?: string;
  category: string;
}

export default function StudentVideoCourses() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [showFilters, setShowFilters] = useState(false);

  // Fetch video courses
  const { data: courses = [], isLoading } = useQuery<VideoCourse[]>({
    queryKey: ['/api/student/video-courses'],
    queryFn: async () => {
      const response = await fetch('/api/student/video-courses', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (courseId: number) => {
      const response = await fetch(`/api/student/video-courses/${courseId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/video-courses'] });
    }
  });

  // Filter courses
  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.instructor.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.category === selectedCategory;
    const matchesDifficulty = selectedDifficulty === 'all' || course.difficulty === selectedDifficulty;
    
    return matchesSearch && matchesCategory && matchesDifficulty;
  });

  // Group courses by status
  const myCourses = filteredCourses.filter(c => c.isPurchased);
  const inProgressCourses = myCourses.filter(c => c.progress > 0 && c.progress < 100);
  const completedCourses = myCourses.filter(c => c.progress === 100);
  const availableCourses = filteredCourses.filter(c => !c.isPurchased);

  // Get unique categories
  const categories = ['all', ...new Set(courses.map(c => c.category))];

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10">
        {/* Mobile Header */}
        <motion.header 
          className="mobile-header"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-white font-bold text-xl">{t('student:videoCourses', 'Video Courses')}</h1>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                className="p-2 rounded-full bg-white/10 backdrop-blur"
                onClick={() => setShowFilters(!showFilters)}
              >
                <Filter className="w-5 h-5 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
            <input
              type="text"
              placeholder={t('student:searchCourses', 'Search courses...')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
            />
          </div>

          {/* Filters */}
          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.3 }}
                className="overflow-hidden"
              >
                <div className="flex gap-2 mt-3 overflow-x-auto pb-2">
                  <select
                    value={selectedCategory}
                    onChange={(e) => setSelectedCategory(e.target.value)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-sm border border-white/20 focus:outline-none"
                  >
                    {categories.map(cat => (
                      <option key={cat} value={cat}>
                        {cat === 'all' ? t('student:allCategories', 'All Categories') : cat}
                      </option>
                    ))}
                  </select>

                  <select
                    value={selectedDifficulty}
                    onChange={(e) => setSelectedDifficulty(e.target.value)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-sm border border-white/20 focus:outline-none"
                  >
                    <option value="all">{t('student:allLevels', 'All Levels')}</option>
                    <option value="beginner">{t('student:beginner', 'Beginner')}</option>
                    <option value="intermediate">{t('student:intermediate', 'Intermediate')}</option>
                    <option value="advanced">{t('student:advanced', 'Advanced')}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="glass-card p-3 text-center">
              <BookOpen className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{myCourses.length}</p>
              <p className="text-white/60 text-xs">{t('student:myCourses', 'My Courses')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Trophy className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{completedCourses.length}</p>
              <p className="text-white/60 text-xs">{t('student:completed', 'Completed')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <TrendingUp className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{inProgressCourses.length}</p>
              <p className="text-white/60 text-xs">{t('student:inProgress', 'In Progress')}</p>
            </div>
          </div>
        </motion.header>

        {/* Main Content */}
        <div className="mobile-content">
          {isLoading ? (
            // Loading Skeleton
            <div className="space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4">
                  <div className="flex gap-3">
                    <div className="skeleton w-24 h-16 rounded" />
                    <div className="flex-1">
                      <div className="skeleton h-5 w-3/4 mb-2 rounded" />
                      <div className="skeleton h-4 w-1/2 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredCourses.length === 0 ? (
            <motion.div 
              className="glass-card p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">{t('student:noCoursesFound', 'No courses found')}</p>
            </motion.div>
          ) : (
            <div className="space-y-6 mb-20">
              {/* Continue Learning */}
              {inProgressCourses.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:continueLearning', 'Continue Learning')}
                  </h2>
                  <div className="space-y-3">
                    {inProgressCourses.slice(0, 3).map((course, index) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        index={index}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        onNavigate={(id) => setLocation(`/student/video-courses/${id}`)}
                        getDifficultyColor={getDifficultyColor}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* My Courses */}
              {myCourses.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:myCourses', 'My Courses')}
                  </h2>
                  <div className="space-y-3">
                    {myCourses.map((course, index) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        index={index}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        onNavigate={(id) => setLocation(`/student/video-courses/${id}`)}
                        getDifficultyColor={getDifficultyColor}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Available Courses */}
              {availableCourses.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:availableCourses', 'Available Courses')}
                  </h2>
                  <div className="space-y-3">
                    {availableCourses.map((course, index) => (
                      <CourseCard 
                        key={course.id} 
                        course={course} 
                        index={index}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        onNavigate={(id) => setLocation(`/student/video-courses/${id}`)}
                        getDifficultyColor={getDifficultyColor}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}

// Course Card Component
function CourseCard({ 
  course, 
  index, 
  onToggleFavorite, 
  onNavigate,
  getDifficultyColor,
  t 
}: {
  course: VideoCourse;
  index: number;
  onToggleFavorite: (id: number) => void;
  onNavigate: (id: number) => void;
  getDifficultyColor: (difficulty: string) => string;
  t: any;
}) {
  return (
    <motion.div
      className="glass-card p-4 cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onNavigate(course.id)}
    >
      <div className="flex gap-3">
        {/* Thumbnail */}
        <div className="relative w-24 h-16 bg-white/10 rounded-lg overflow-hidden flex-shrink-0">
          {course.thumbnail ? (
            <img 
              src={course.thumbnail} 
              alt={course.title}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <PlayCircle className="w-8 h-8 text-white/30" />
            </div>
          )}
          {course.isPurchased && course.progress > 0 && (
            <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/50">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
                style={{ width: `${course.progress}%` }}
              />
            </div>
          )}
        </div>

        {/* Content */}
        <div className="flex-1">
          <div className="flex items-start justify-between mb-1">
            <h3 className="text-white font-semibold text-sm line-clamp-1">{course.title}</h3>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(course.id);
              }}
              className="p-1"
            >
              <Heart className={`w-4 h-4 ${course.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/50'}`} />
            </motion.button>
          </div>

          <p className="text-white/60 text-xs mb-2">{course.instructor}</p>

          <div className="flex items-center gap-2 text-white/50 text-xs">
            <div className="flex items-center gap-1">
              <Clock className="w-3 h-3" />
              <span>{course.duration}</span>
            </div>
            <Badge className={`${getDifficultyColor(course.difficulty)} text-xs`}>
              {course.difficulty}
            </Badge>
            {course.isPurchased ? (
              <div className="flex items-center gap-1">
                {course.progress === 100 ? (
                  <CheckCircle className="w-3 h-3 text-green-400" />
                ) : (
                  <>
                    <BookOpen className="w-3 h-3" />
                    <span>{course.completedLessons}/{course.totalLessons}</span>
                  </>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1">
                <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                <span>{course.rating}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}