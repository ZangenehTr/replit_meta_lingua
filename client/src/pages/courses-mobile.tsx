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
      gradient="cool"
    >
      {/* Search Bar — compact, right under header */}
      <div className="mb-3 mt-1">
        <div className="glass-card px-3 py-2 flex items-center gap-2">
          <Search className="w-4 h-4 text-white/50 shrink-0" />
          <input
            type="text"
            placeholder={t('courses:searchCourses')}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none text-sm"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Delivery Mode Tabs — compact pill row */}
      <div className="flex gap-2 mb-3">
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
                flex-1 py-1.5 px-2 rounded-xl transition-all duration-200 flex items-center justify-center gap-1.5
                ${deliveryMode === mode.id 
                  ? 'bg-white/30 text-white font-medium' 
                  : 'bg-white/10 text-white/70'}
                tap-scale
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              <span className="text-xs">{mode.label}</span>
            </button>
          );
        })}
      </div>

      {/* Category Filter — horizontal scroll */}
      <div className="flex gap-2 mb-3 overflow-x-auto pb-1 no-scrollbar">
        {categories.map((category) => {
          const Icon = category.icon;
          return (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`
                px-3 py-1.5 rounded-xl whitespace-nowrap transition-all flex items-center gap-1.5 text-xs shrink-0
                ${selectedCategory === category.id 
                  ? 'bg-purple-500/40 text-white font-medium' 
                  : 'bg-white/10 text-white/70'}
                tap-scale
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {category.label}
            </button>
          );
        })}
      </div>

      {/* Results count */}
      {!isLoading && (
        <p className="text-white/50 text-xs mb-2 px-1">
          {filteredCourses.length} {t('courses:coursesFound', 'courses')}
        </p>
      )}

      {/* Courses List */}
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-3 animate-pulse">
              <div className="h-24 bg-white/20 rounded-lg mb-2" />
              <div className="h-3 bg-white/20 rounded w-3/4 mb-1.5" />
              <div className="h-2.5 bg-white/20 rounded w-1/2" />
            </div>
          ))}
        </div>
      ) : filteredCourses.length === 0 ? (
        <MobileCard className="text-center py-10">
          <BookOpen className="w-12 h-12 text-white/50 mx-auto mb-3" />
          <p className="text-white/70 text-sm">{t('courses:noCoursesFound')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-3">
          {filteredCourses.map((course, index) => {
            const DeliveryIcon = getDeliveryIcon(course.deliveryMode);
            return (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.25, delay: Math.min(index * 0.05, 0.3) }}
                onClick={() => navigate(`/courses/${course.id}`)}
              >
                <MobileCard className="relative overflow-hidden p-3">
                  <div className="flex gap-3">
                    {/* Thumbnail */}
                    <div className="h-20 w-20 shrink-0 rounded-xl overflow-hidden bg-gradient-to-br from-purple-500 to-pink-500">
                      {course.thumbnail ? (
                        <img
                          src={course.thumbnail}
                          alt={course.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <BookOpen className="w-8 h-8 text-white/50" />
                        </div>
                      )}
                    </div>

                    {/* Course Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start gap-1 mb-1">
                        <h3 className="text-white font-semibold text-sm leading-tight line-clamp-2 flex-1">
                          {course.title}
                        </h3>
                        <Badge className={`${getLevelColor(course.level)} border-0 text-xs shrink-0`}>
                          {t(`courses:level.${course.level}`)}
                        </Badge>
                      </div>
                      <p className="text-white/55 text-xs mb-2 line-clamp-1">
                        {course.instructorName}
                      </p>
                      <div className="flex flex-wrap gap-x-3 gap-y-1">
                        <span className="flex items-center gap-1 text-white/55 text-xs">
                          <DeliveryIcon className="w-3 h-3" />
                          {t(`courses:${course.deliveryMode}`)}
                        </span>
                        <span className="flex items-center gap-1 text-white/55 text-xs">
                          <Clock className="w-3 h-3" />
                          {course.duration}
                        </span>
                        {course.rating && (
                          <span className="flex items-center gap-1 text-white/55 text-xs">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            {typeof course.rating === 'number' ? course.rating.toFixed(1) : course.rating}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Schedule strip for In-Person */}
                  {course.deliveryMode === 'in_person' && course.weekdays && (
                    <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                      <Calendar className="w-3 h-3 text-white/40 shrink-0" />
                      <span className="text-white/60 text-xs truncate">
                        {course.weekdays.join(', ')} · {course.startTime}–{course.endTime}
                        {course.location ? ` · ${course.location}` : ''}
                      </span>
                    </div>
                  )}

                  {/* Price row */}
                  <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/10">
                    <p className="text-white font-bold text-sm">{formatPrice(course.price)}</p>
                    <ChevronRight className="w-4 h-4 text-white/30" />
                  </div>
                </MobileCard>
              </motion.div>
            );
          })}
        </div>
      )}

      <div className="h-6" />
    </MobileLayout>
  );
}