import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useLocation } from 'wouter';
import { 
  BookOpen,
  Clock,
  Calendar,
  Users,
  Globe,
  MapPin,
  ChevronRight,
  Filter,
  Star,
  Search,
  TrendingUp,
  Award,
  Sparkles
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import '@/styles/mobile-app.css';

interface Course {
  id: number;
  title: string;
  description: string;
  instructorName: string;
  language: string;
  level: 'beginner' | 'intermediate' | 'advanced';
  duration: string;
  deliveryMode: 'online' | 'in_person' | 'self_paced';
  price: number;
  thumbnail?: string;
  rating?: number;
  currentStudents?: number;
  maxStudents?: number;
  weekdays?: string[];
  startTime?: string;
  endTime?: string;
  location?: string;
  startDate?: string;
  category?: string;
}

export default function CoursesCatalogMobile() {
  const { t } = useTranslation();
  const [, navigate] = useLocation();
  const [searchQuery, setSearchQuery] = useState('');
  const [deliveryMode, setDeliveryMode] = useState<'all' | 'online' | 'in_person'>('all');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch courses
  const { data: rawCourses = [], isLoading } = useQuery({
    queryKey: ['/api/courses'],
    queryFn: async () => {
      const response = await fetch('/api/courses');
      if (!response.ok) throw new Error('Failed to fetch courses');
      return response.json();
    }
  });

  // Transform API data to match our interface
  const courses: Course[] = rawCourses.map((course: any) => ({
    id: course.id,
    title: course.title || '',
    description: course.description || '',
    instructorName: course.instructorName || 'Instructor',
    language: course.language || course.targetLanguage || 'English',
    level: (course.level || course.difficulty || 'intermediate').toLowerCase() as any,
    duration: course.sessionDuration ? `${course.sessionDuration} min` : '90 min',
    deliveryMode: course.deliveryMode || 'online',
    price: course.price || 0,
    thumbnail: course.thumbnail,
    rating: typeof course.rating === 'string' ? parseFloat(course.rating) : course.rating,
    currentStudents: course.currentStudents || 0,
    maxStudents: course.maxStudents,
    weekdays: course.weekdays,
    startTime: course.startTime,
    endTime: course.endTime,
    location: course.location,
    startDate: course.startDate || course.firstSessionDate,
    category: course.category || 'General'
  }));

  const categories = [
    { id: 'all', label: t('common:all'), icon: Sparkles },
    { id: 'business', label: t('courses:business'), icon: TrendingUp },
    { id: 'conversation', label: t('courses:conversation'), icon: Users },
    { id: 'academic', label: t('courses:academic'), icon: Award },
    { id: 'kids', label: t('courses:kids'), icon: Star }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesDelivery = deliveryMode === 'all' || course.deliveryMode === deliveryMode;
    const matchesCategory = selectedCategory === 'all' || 
                           course.category?.toLowerCase() === selectedCategory.toLowerCase();
    return matchesSearch && matchesDelivery && matchesCategory;
  });

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'bg-green-500/20 text-green-300';
      case 'intermediate': return 'bg-yellow-500/20 text-yellow-300';
      case 'advanced': return 'bg-red-500/20 text-red-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const getDeliveryIcon = (mode: string) => {
    switch (mode) {
      case 'online': return Globe;
      case 'in_person': return MapPin;
      case 'self_paced': return BookOpen;
      case 'callern': return Globe;
      default: return BookOpen;
    }
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
      title={t('courses:catalog')}
      showBack={true}
      gradient="ocean"
    >
      {/* Hero Section */}
      <motion.div
        className="glass-card p-6 mb-6 text-center"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <h2 className="text-white text-2xl font-bold mb-2">
          {t('courses:exploreOurCourses')}
        </h2>
        <p className="text-white/70">
          {t('courses:discoverLanguageOptions')}
        </p>
      </motion.div>

      {/* Search Bar */}
      <motion.div 
        className="mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-3 flex items-center gap-3">
          <Search className="w-5 h-5 text-white/50" />
          <input
            type="text"
            placeholder={t('courses:searchCourses')}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </motion.div>

      {/* Delivery Mode Tabs */}
      <motion.div 
        className="flex gap-2 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {[
          { id: 'all', label: t('common:all'), icon: Sparkles },
          { id: 'in_person', label: t('courses:inPerson'), icon: MapPin },
          { id: 'online', label: t('courses:online'), icon: Globe }
        ].map((mode) => {
          const Icon = mode.icon;
          return (
            <button
              key={mode.id}
              onClick={() => setDeliveryMode(mode.id as any)}
              className={`
                flex-1 py-2 px-3 rounded-xl transition-all duration-200 flex items-center justify-center gap-2
                ${deliveryMode === mode.id 
                  ? 'bg-white/30 text-white font-medium' 
                  : 'bg-white/10 text-white/70'}
                tap-scale
              `}
            >
              <Icon className="w-4 h-4" />
              <span className="text-sm">{mode.label}</span>
            </button>
          );
        })}
      </motion.div>

      {/* Category Filter */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.2 }}
      >
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-4 py-2 rounded-xl whitespace-nowrap transition-all flex items-center gap-2
                ${selectedCategory === category.id 
                  ? 'bg-purple-500/30 text-purple-300' 
                  : 'bg-white/10 text-white/70'}
                tap-scale
              `}
            >
              <Icon className="w-4 h-4" />
              {category.label}
            </button>
          );
        })}
      </motion.div>

      {/* Courses Grid */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-32 bg-white/20 rounded-lg mb-3"></div>
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <MobileCard className="text-center py-12">
          <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('courses:noCoursesFound')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {filteredCourses.map((course, index) => {
            const DeliveryIcon = getDeliveryIcon(course.deliveryMode);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
                onClick={() => navigate(`/course/${course.id}`)}
              >
                <MobileCard className="relative overflow-hidden">
                  {/* Thumbnail or Gradient */}
                  <div className="h-32 mb-4 rounded-lg overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                    {course.thumbnail ? (
                      <img 
                        src={course.thumbnail} 
                        alt={course.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <BookOpen className="w-12 h-12 text-white/50" />
                      </div>
                    )}
                  </div>

                  {/* Course Info */}
                  <div>
                    {/* Title and Level */}
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="text-white font-semibold text-lg flex-1">
                        {course.title}
                      </h3>
                      <Badge className={`${getLevelColor(course.level)} border-0`}>
                        {t(`courses:level.${course.level}`)}
                      </Badge>
                    </div>

                    {/* Description */}
                    <p className="text-white/60 text-sm mb-3 line-clamp-2">
                      {course.description}
                    </p>

                    {/* Meta Info */}
                    <div className="flex flex-wrap gap-3 mb-3">
                      <div className="flex items-center gap-1">
                        <DeliveryIcon className="w-4 h-4 text-white/50" />
                        <span className="text-white/60 text-xs">
                          {t(`courses:${course.deliveryMode}`)}
                        </span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span className="text-white/60 text-xs">
                          {course.duration}
                        </span>
                      </div>
                      {course.maxStudents && (
                        <div className="flex items-center gap-1">
                          <Users className="w-4 h-4 text-white/50" />
                          <span className="text-white/60 text-xs">
                            {course.currentStudents || 0}/{course.maxStudents}
                          </span>
                        </div>
                      )}
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                          <span className="text-white/60 text-xs">
                            {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating}
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Schedule for In-Person */}
                    {course.deliveryMode === 'in_person' && course.weekdays && (
                      <div className="glass-card p-2 mb-3">
                        <div className="flex items-center gap-2">
                          <Calendar className="w-3 h-3 text-white/50" />
                          <span className="text-white/70 text-xs">
                            {course.weekdays.join(', ')} • {course.startTime} - {course.endTime}
                          </span>
                        </div>
                        {course.location && (
                          <div className="flex items-center gap-2 mt-1">
                            <MapPin className="w-3 h-3 text-white/50" />
                            <span className="text-white/70 text-xs">{course.location}</span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-xs">{t('courses:instructor')}</p>
                        <p className="text-white text-sm font-medium">
                          {course.instructorName}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="text-white font-bold text-lg">
                          {formatPrice(course.price)}
                        </p>
                        <ChevronRight className="w-5 h-5 text-white/30 ml-auto" />
                      </div>
                    </div>
                  </div>
                </MobileCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Bottom Spacing */}
      <div className="h-20" />
    </MobileLayout>
  );
}