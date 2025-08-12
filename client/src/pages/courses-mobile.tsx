import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  Search,
  Filter,
  BookOpen,
  Clock,
  Users,
  Star,
  Globe,
  MapPin,
  Video,
  ChevronRight,
  X,
  DollarSign,
  GraduationCap,
  Calendar,
  Languages,
  Award,
  ArrowLeft
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { Link } from "wouter";

interface Course {
  id: number;
  title: string;
  description: string;
  thumbnail?: string;
  deliveryMode: string;
  classFormat: string;
  targetLanguage: string;
  targetLevel: string[];
  maxStudents?: number;
  currentStudents?: number;
  price: number;
  weekdays?: string[];
  startTime?: string;
  endTime?: string;
  instructorName: string;
  duration: string;
  isActive: boolean;
  progress?: number;
  rating?: number;
}

export default function CoursesMobile() {
  const { user } = useAuth();
  const { t, i18n } = useTranslation();
  const { toast } = useToast();
  const isRTL = ['fa', 'ar'].includes(i18n.language);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [showFilters, setShowFilters] = useState(false);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  
  // Fetch courses
  const { data: courses = [], isLoading } = useQuery<Course[]>({
    queryKey: ['/api/courses']
  });

  const handleEnroll = async (courseId: number) => {
    try {
      const response = await fetch(`/api/courses/${courseId}/enroll`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        toast({
          title: t('courses.enrollmentSuccess'),
          description: t('courses.enrollmentSuccessDesc'),
        });
        setSelectedCourse(null);
      } else {
        throw new Error('Enrollment failed');
      }
    } catch (error) {
      toast({
        title: t('courses.enrollmentFailed'),
        description: t('courses.enrollmentFailedDesc'),
        variant: "destructive",
      });
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat(isRTL ? 'fa-IR' : 'en-US', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
  };

  const categories = [
    { id: 'all', label: t('common.all'), icon: BookOpen },
    { id: 'online', label: t('courses.online'), icon: Globe },
    { id: 'in_person', label: t('courses.inPerson'), icon: MapPin },
    { id: 'self_paced', label: t('courses.selfPaced'), icon: Video }
  ];

  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'all' || course.deliveryMode === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const levelColors = {
    'A1': 'from-green-400 to-green-600',
    'A2': 'from-blue-400 to-blue-600',
    'B1': 'from-yellow-400 to-yellow-600',
    'B2': 'from-orange-400 to-orange-600',
    'C1': 'from-red-400 to-red-600',
    'C2': 'from-purple-400 to-purple-600'
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-600 via-blue-600 to-cyan-600">
      {/* Mobile Header */}
      <div className="sticky top-0 z-40 bg-black/20 backdrop-blur-lg border-b border-white/10">
        <div className="flex items-center justify-between p-4">
          <Link href="/dashboard">
            <Button variant="ghost" size="icon" className="text-white">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <h1 className="text-white font-bold text-lg">{t('courses.exploreCourses')}</h1>
          <Button
            variant="ghost"
            size="icon"
            className="text-white"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-5 h-5" />
          </Button>
        </div>

        {/* Search Bar */}
        <div className="px-4 pb-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-white/70 w-4 h-4" />
            <input
              type="text"
              placeholder={t('courses.searchPlaceholder')}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur-md rounded-xl text-white placeholder-white/50 border border-white/20 focus:border-white/40 focus:outline-none"
            />
          </div>
        </div>

        {/* Category Tabs */}
        <div className="px-4 pb-2">
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {categories.map(category => {
              const Icon = category.icon;
              return (
                <motion.button
                  key={category.id}
                  whileTap={{ scale: 0.95 }}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-full whitespace-nowrap transition-all ${
                    selectedCategory === category.id
                      ? 'bg-white text-purple-600'
                      : 'bg-white/10 text-white'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  <span className="text-sm font-medium">{category.label}</span>
                </motion.button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 pb-24">
        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="w-12 h-12 border-4 border-white border-t-transparent rounded-full animate-spin" />
          </div>
        ) : filteredCourses.length === 0 ? (
          <motion.div 
            className="text-center py-12"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <BookOpen className="w-16 h-16 text-white/50 mx-auto mb-4" />
            <p className="text-white/70">{t('courses.noCourses')}</p>
          </motion.div>
        ) : (
          <div className="space-y-4">
            {filteredCourses.map((course, index) => (
              <motion.div
                key={course.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="glass-card p-4"
                onClick={() => setSelectedCourse(course)}
              >
                <div className="flex gap-4">
                  {/* Course Thumbnail */}
                  <div className={`w-24 h-24 rounded-xl bg-gradient-to-br ${
                    levelColors[course.targetLevel[0] as keyof typeof levelColors] || 'from-gray-400 to-gray-600'
                  } flex items-center justify-center flex-shrink-0`}>
                    {course.deliveryMode === 'online' ? (
                      <Globe className="w-10 h-10 text-white" />
                    ) : course.deliveryMode === 'in_person' ? (
                      <MapPin className="w-10 h-10 text-white" />
                    ) : (
                      <Video className="w-10 h-10 text-white" />
                    )}
                  </div>

                  {/* Course Info */}
                  <div className="flex-1">
                    <h3 className="font-semibold text-white text-base mb-1 line-clamp-1">
                      {course.title}
                    </h3>
                    <p className="text-white/70 text-xs line-clamp-2 mb-2">
                      {course.description}
                    </p>
                    
                    <div className="flex flex-wrap gap-1 mb-2">
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {course.targetLanguage}
                      </Badge>
                      <Badge className="bg-white/20 text-white border-white/30 text-xs">
                        {course.targetLevel.join(', ')}
                      </Badge>
                      {course.classFormat === 'group' && (
                        <Badge className="bg-white/20 text-white border-white/30 text-xs">
                          <Users className="w-3 h-3 mr-1" />
                          {course.currentStudents}/{course.maxStudents}
                        </Badge>
                      )}
                    </div>

                    <div className="flex items-center justify-between">
                      <span className="text-white font-bold text-sm">
                        {formatPrice(course.price)}
                      </span>
                      {course.rating && (
                        <div className="flex items-center gap-1">
                          <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                          <span className="text-white/70 text-xs">{course.rating}</span>
                        </div>
                      )}
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/50 self-center" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Course Details Modal */}
      <AnimatePresence>
        {selectedCourse && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={() => setSelectedCourse(null)}
          >
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25 }}
              className="absolute bottom-0 left-0 right-0 bg-white dark:bg-gray-900 rounded-t-3xl max-h-[80vh] overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <h2 className="text-xl font-bold text-gray-900 dark:text-white">
                    {selectedCourse.title}
                  </h2>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setSelectedCourse(null)}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                <div className="space-y-4">
                  <p className="text-gray-600 dark:text-gray-300">
                    {selectedCourse.description}
                  </p>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="glass-card p-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <GraduationCap className="w-4 h-4" />
                        <span className="text-xs">{t('courses.instructor')}</span>
                      </div>
                      <p className="font-semibold text-sm">{selectedCourse.instructorName}</p>
                    </div>

                    <div className="glass-card p-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <Clock className="w-4 h-4" />
                        <span className="text-xs">{t('courses.duration')}</span>
                      </div>
                      <p className="font-semibold text-sm">{selectedCourse.duration}</p>
                    </div>

                    <div className="glass-card p-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <Languages className="w-4 h-4" />
                        <span className="text-xs">{t('courses.language')}</span>
                      </div>
                      <p className="font-semibold text-sm">{selectedCourse.targetLanguage}</p>
                    </div>

                    <div className="glass-card p-3">
                      <div className="flex items-center gap-2 text-gray-600 dark:text-gray-300 mb-1">
                        <Award className="w-4 h-4" />
                        <span className="text-xs">{t('courses.level')}</span>
                      </div>
                      <p className="font-semibold text-sm">{selectedCourse.targetLevel.join(', ')}</p>
                    </div>
                  </div>

                  {selectedCourse.weekdays && selectedCourse.weekdays.length > 0 && (
                    <div className="glass-card p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Calendar className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                        <span className="text-sm font-medium">{t('courses.schedule')}</span>
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {selectedCourse.weekdays.join(', ')}
                      </p>
                      {selectedCourse.startTime && selectedCourse.endTime && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">
                          {selectedCourse.startTime} - {selectedCourse.endTime}
                        </p>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-4 border-t">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        {t('courses.price')}
                      </p>
                      <p className="text-2xl font-bold text-primary">
                        {formatPrice(selectedCourse.price)}
                      </p>
                    </div>
                    <Button
                      size="lg"
                      className="bg-gradient-to-r from-purple-600 to-blue-600 text-white"
                      onClick={() => handleEnroll(selectedCourse.id)}
                    >
                      {t('courses.enrollNow')}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}