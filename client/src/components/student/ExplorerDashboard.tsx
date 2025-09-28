import { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { 
  GraduationCap, 
  Target, 
  Users, 
  Clock, 
  Star, 
  Search, 
  Filter,
  ChevronRight,
  Calendar,
  Phone,
  Mail,
  MessageCircle,
  BookOpen,
  Award,
  Video,
  UserCheck,
  Languages,
  Globe2,
  Brain,
  Trophy,
  Sparkles,
  TrendingUp,
  CheckCircle,
  Play,
  Zap,
  Heart,
  ShieldCheck,
  MapPin,
  DollarSign
} from "lucide-react";
import { Link, useLocation } from "wouter";
import { useLanguage } from "@/hooks/useLanguage";
import apiClient from "@/lib/apiClient";
import type { EnrollmentStatus } from "@/hooks/use-enrollment-status";

interface BrandingData {
  id: number;
  name: string;
  tagline: string;
  logo: string;
  description: string;
  stats: {
    totalStudents: number;
    expertTeachers: number;
    coursesOffered: number;
    successRate: number;
    averageRating: number;
    hoursLearned: number;
    certificatesIssued: number;
    studentsActive: number;
  };
  achievements: string[];
  contact: {
    phone: string;
    email: string;
    address: string;
    website: string;
  };
  features: {
    title: string;
    description: string;
    icon: string;
  }[];
  offers: {
    title: string;
    description: string;
    cta: string;
  }[];
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  profileImage?: string;
  specializations: string[];
  experience: number;
  rating: number;
  totalStudents: number;
  languages: string[];
  bio: string;
  availability: string[];
  achievements?: string[];
  teachingStyle?: string;
  hourlyRate?: number;
  responseTime?: string;
  videoIntroUrl?: string;
  nextAvailableSlot?: string;
  studentReviews?: any[];
  isOnline?: boolean;
  isPopular?: boolean;
  hasTrialLesson?: boolean;
}

interface Course {
  id: number;
  title: string;
  description: string;
  language: string;
  level: string;
  thumbnail?: string;
  price: number;
  totalSessions: number;
  sessionDuration: number;
  deliveryMode: string;
  instructorName?: string;
  rating?: number;
  enrolledStudents?: number;
  category: string;
  tags?: string[];
  learningObjectives?: string[];
}

interface Props {
  enrollmentStatus: EnrollmentStatus | undefined;
  user: any;
}

export function ExplorerDashboard({ enrollmentStatus, user }: Props) {
  const { t } = useTranslation(['student', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [, setLocation] = useLocation();
  const [activeSection, setActiveSection] = useState<'overview' | 'teachers' | 'courses' | 'linguaquest' | 'trial' | 'contact'>('overview');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedFilters, setSelectedFilters] = useState({
    level: '',
    mode: '',
    language: '',
    priceRange: ''
  });

  // Fetch branding data
  const { data: branding, isLoading: brandingLoading } = useQuery<BrandingData>({
    queryKey: ['/api/branding'],
    staleTime: 30 * 60 * 1000, // Cache for 30 minutes
  });

  // Fetch teachers directory
  const { data: teachers = [], isLoading: teachersLoading, error: teachersError } = useQuery<Teacher[]>({
    queryKey: ['/api/teachers/directory'],
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });

  // Fetch course catalog
  const { data: courses = [], isLoading: coursesLoading, error: coursesError } = useQuery<Course[]>({
    queryKey: ['/api/courses/catalog'],
    staleTime: 15 * 60 * 1000, // Cache for 15 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });

  // Fetch LinguaQuest lessons
  const { data: linguaquestLessons = [], isLoading: linguaquestLoading, error: linguaquestError } = useQuery({
    queryKey: ['/api/linguaquest/lessons'],
    staleTime: 20 * 60 * 1000, // Cache for 20 minutes
    refetchOnWindowFocus: false,
    retry: 3
  });

  // Trial booking mutation
  const bookTrialMutation = useMutation({
    mutationFn: async (bookingData: any) => {
      const response = await apiClient.post('/student/book-trial', bookingData);
      return response.data;
    },
    onSuccess: () => {
      toast({
        title: t('student:trialBooked'),
        description: t('student:trialBookedDescription'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/trial-bookings'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.response?.data?.message || t('student:bookingFailed'),
        variant: 'destructive',
      });
    },
  });

  const filteredCourses = courses.filter(course => {
    const matchesSearch = 
      course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (course.description || '').toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLevel = !selectedFilters.level || course.level === selectedFilters.level;
    const matchesMode = !selectedFilters.mode || course.deliveryMode === selectedFilters.mode;
    const matchesLanguage = !selectedFilters.language || course.language === selectedFilters.language;
    
    let matchesPrice = true;
    if (selectedFilters.priceRange) {
      const price = course.price;
      switch (selectedFilters.priceRange) {
        case 'free':
          matchesPrice = price === 0;
          break;
        case 'low':
          matchesPrice = price > 0 && price <= 1000000;
          break;
        case 'mid':
          matchesPrice = price > 1000000 && price <= 3000000;
          break;
        case 'high':
          matchesPrice = price > 3000000;
          break;
      }
    }

    return matchesSearch && matchesLevel && matchesMode && matchesLanguage && matchesPrice;
  });

  const handleQuickAction = (action: string) => {
    switch (action) {
      case 'assessment':
        setLocation('/placement-test');
        break;
      case 'trial':
        setActiveSection('trial');
        break;
      case 'linguaquest':
        setActiveSection('linguaquest');
        break;
      case 'courses':
        setActiveSection('courses');
        break;
      default:
        break;
    }
  };

  // Skeleton Components
  const TeacherSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="flex items-center gap-4 mb-4">
        <div className="w-16 h-16 bg-gray-300 rounded-full"></div>
        <div className="flex-1">
          <div className="h-4 bg-gray-300 rounded mb-2 w-32"></div>
          <div className="h-3 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-3/4"></div>
      </div>
    </div>
  );

  const CourseSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 overflow-hidden animate-pulse">
      <div className="h-48 bg-gray-300"></div>
      <div className="p-6">
        <div className="h-4 bg-gray-300 rounded mb-2 w-3/4"></div>
        <div className="h-3 bg-gray-300 rounded w-full mb-4"></div>
        <div className="flex justify-between items-center">
          <div className="h-6 bg-gray-300 rounded w-20"></div>
          <div className="h-8 bg-gray-300 rounded w-24"></div>
        </div>
      </div>
    </div>
  );

  const LinguaQuestSkeleton = () => (
    <div className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
      <div className="h-12 bg-gray-300 rounded mb-4"></div>
      <div className="space-y-2">
        <div className="h-3 bg-gray-300 rounded w-full"></div>
        <div className="h-3 bg-gray-300 rounded w-2/3"></div>
        <div className="h-3 bg-gray-300 rounded w-1/2"></div>
      </div>
    </div>
  );

  if (brandingLoading) {
    return (
      <div className="min-h-screen hero-gradient flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin w-12 h-12 border-4 border-purple-600 border-t-transparent rounded-full mx-auto mb-4" data-testid="loading-spinner"></div>
          <p className="text-gray-600" data-testid="loading-text">{t('common:loading')}...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen hero-gradient ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <motion.header 
        className="sticky top-0 z-40 bg-white/95 backdrop-blur-xl border-b border-purple-100 shadow-sm"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.6 }}
      >
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-3">
                <motion.div 
                  className="w-12 h-12 conversion-gradient-bg rounded-xl flex items-center justify-center shadow-lg"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  <GraduationCap className="h-7 w-7 text-white" />
                </motion.div>
                <div>
                  <h1 className="text-gray-900 font-bold text-xl lg:text-2xl">
                    {branding?.name || 'Meta Lingua Academy'}
                  </h1>
                  <p className="text-purple-600 text-sm font-medium">
                    {branding?.tagline || 'Master Languages, Master Life'}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Badge variant="outline" className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700 hidden sm:flex">
                {t('student:freeExplorer')}
              </Badge>
              <Link href="/auth">
                <Button className="conversion-cta-button" data-testid="button-get-started">
                  {t('student:getStarted')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </motion.header>

      {/* Navigation Tabs */}
      <div className="container mx-auto px-4 py-4">
        <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
          {[
            { id: 'overview', label: t('student:overview'), icon: Globe2 },
            { id: 'courses', label: t('student:courses'), icon: BookOpen },
            { id: 'teachers', label: t('student:teachers'), icon: Users },
            { id: 'linguaquest', label: 'LinguaQuest', icon: Brain },
            { id: 'trial', label: t('student:trialLesson'), icon: Video },
            { id: 'contact', label: t('student:contact'), icon: MessageCircle },
          ].map((tab) => (
            <Button
              key={tab.id}
              variant={activeSection === tab.id ? 'default' : 'ghost'}
              size="sm"
              onClick={() => setActiveSection(tab.id as any)}
              className={`flex items-center gap-2 whitespace-nowrap transition-all ${
                activeSection === tab.id
                  ? 'conversion-gradient-bg text-white shadow-lg'
                  : 'text-gray-700 hover:bg-purple-50 hover:text-purple-600'
              }`}
              data-testid={`tab-${tab.id}`}
            >
              <tab.icon className="h-4 w-4" />
              {tab.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 pb-8">
        {activeSection === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section */}
            <Card className="conversion-gradient-bg text-white border-0 shadow-2xl overflow-hidden">
              <CardContent className="p-8 lg:p-12 relative">
                <div className="absolute inset-0 bg-gradient-to-br from-black/10 via-transparent to-black/20 pointer-events-none" />
                <div className="relative z-10">
                  <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="max-w-4xl"
                  >
                    <h2 className="text-3xl lg:text-5xl font-bold mb-6 leading-tight">
                      {t('student:heroTitle', { 
                        institute: branding?.name || 'Meta Lingua Academy' 
                      })}
                    </h2>
                    <p className="text-white/90 text-lg lg:text-xl mb-8 leading-relaxed">
                      {branding?.description || t('student:heroDescription')}
                    </p>
                    
                    {/* CTA Buttons */}
                    <div className="flex flex-wrap gap-4">
                      <Button
                        size="lg"
                        onClick={() => handleQuickAction('trial')}
                        className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:scale-105"
                        data-testid="button-book-trial"
                      >
                        <Video className="mr-2 h-5 w-5" />
                        {t('student:bookFreeTrial')}
                      </Button>
                      <Button
                        variant="outline"
                        size="lg"
                        onClick={() => handleQuickAction('assessment')}
                        className="bg-white/10 backdrop-blur-sm border-white/30 text-white hover:bg-white/20 px-8 py-4 text-lg font-semibold shadow-xl hover:shadow-2xl transition-all duration-300"
                        data-testid="button-take-assessment"
                      >
                        <Target className="mr-2 h-5 w-5" />
                        {t('student:takeAssessment')}
                      </Button>
                    </div>
                  </motion.div>
                </div>
                
                {/* Floating Achievement Badges */}
                <div className="absolute top-8 right-8 hidden lg:flex flex-col gap-3">
                  {branding?.achievements?.slice(0, 3).map((achievement, index) => (
                    <motion.div
                      key={index}
                      initial={{ opacity: 0, x: 50 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.5 + index * 0.1 }}
                      className="bg-white/15 backdrop-blur-sm rounded-full px-4 py-2 text-sm font-medium text-white border border-white/20"
                    >
                      {achievement}
                    </motion.div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Statistics Section */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[
                { 
                  label: t('student:totalStudents'), 
                  value: branding?.stats?.totalStudents || 1250, 
                  icon: Users,
                  color: 'text-blue-600'
                },
                { 
                  label: t('student:expertTeachers'), 
                  value: branding?.stats?.expertTeachers || 45, 
                  icon: Award,
                  color: 'text-purple-600'
                },
                { 
                  label: t('student:successRate'), 
                  value: `${branding?.stats?.successRate || 94}%`, 
                  icon: TrendingUp,
                  color: 'text-green-600'
                },
                { 
                  label: t('student:avgRating'), 
                  value: branding?.stats?.averageRating || 4.8, 
                  icon: Star,
                  color: 'text-yellow-600'
                }
              ].map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="stats-card card-hover-effect group"
                  data-testid={`stat-${stat.label.toLowerCase().replace(/\s+/g, '-')}`}
                >
                  <div className="feature-icon-bg mb-4 mx-auto w-fit">
                    <stat.icon className={`h-8 w-8 ${stat.color}`} />
                  </div>
                  <div className="text-3xl font-bold text-gray-900 mb-2">
                    {typeof stat.value === 'number' ? stat.value.toLocaleString() : stat.value}
                  </div>
                  <div className="text-sm text-gray-600 font-medium">
                    {stat.label}
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Features Grid */}
            <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
              {branding?.features?.map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.1 * index }}
                  className="card-gradient rounded-2xl p-6 card-hover-effect group"
                >
                  <div className="feature-icon-bg mb-4 w-fit">
                    {/* Dynamic icon rendering based on feature.icon */}
                    {feature.icon === 'users' && <Users className="h-6 w-6 text-purple-600" />}
                    {feature.icon === 'clock' && <Clock className="h-6 w-6 text-blue-600" />}
                    {feature.icon === 'target' && <Target className="h-6 w-6 text-green-600" />}
                    {feature.icon === 'globe' && <Globe2 className="h-6 w-6 text-indigo-600" />}
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2 group-hover:text-purple-600 transition-colors">
                    {feature.title}
                  </h3>
                  <p className="text-gray-600 text-sm leading-relaxed">
                    {feature.description}
                  </p>
                </motion.div>
              ))}
            </div>

            {/* Special Offers */}
            <div className="grid md:grid-cols-2 gap-6">
              {branding?.offers?.map((offer, index) => (
                <motion.div
                  key={offer.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 * index }}
                  className="card-gradient rounded-2xl p-8 card-hover-effect border-2 border-purple-100 hover:border-purple-200"
                >
                  <div className="feature-icon-bg mb-4 w-fit">
                    {index === 0 ? (
                      <Video className="h-6 w-6 text-purple-600" />
                    ) : (
                      <Target className="h-6 w-6 text-blue-600" />
                    )}
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-3">
                    {offer.title}
                  </h3>
                  <p className="text-gray-600 mb-6 leading-relaxed">
                    {offer.description}
                  </p>
                  <Button
                    onClick={() => handleQuickAction(index === 0 ? 'trial' : 'assessment')}
                    className="conversion-cta-button w-full"
                    data-testid={`button-${offer.title.toLowerCase().replace(/\s+/g, '-')}`}
                  >
                    {offer.cta}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </motion.div>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center conversion-gradient-text">
                  {t('student:quickActions')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                  {[
                    { 
                      action: 'courses', 
                      label: t('student:exploreCourses'), 
                      icon: BookOpen, 
                      color: 'from-blue-500 to-blue-600' 
                    },
                    { 
                      action: 'teachers', 
                      label: t('student:meetTeachers'), 
                      icon: Users, 
                      color: 'from-purple-500 to-purple-600' 
                    },
                    { 
                      action: 'linguaquest', 
                      label: t('student:freeLessons'), 
                      icon: Brain, 
                      color: 'from-green-500 to-green-600' 
                    },
                    { 
                      action: 'trial', 
                      label: t('student:bookTrial'), 
                      icon: Video, 
                      color: 'from-orange-500 to-orange-600' 
                    }
                  ].map((item) => (
                    <Button
                      key={item.action}
                      variant="outline"
                      size="lg"
                      onClick={() => handleQuickAction(item.action)}
                      className={`h-20 flex-col gap-2 bg-gradient-to-r ${item.color} hover:opacity-90 text-white border-0 shadow-lg hover:shadow-xl transition-all duration-300 transform hover:scale-105`}
                      data-testid={`quick-action-${item.action}`}
                    >
                      <item.icon className="h-6 w-6" />
                      <span className="text-sm font-medium">{item.label}</span>
                    </Button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Testimonials Preview */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center conversion-gradient-text">
                  {t('student:whatStudentsSay')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-3 gap-6">
                  {[
                    {
                      name: 'Sarah M.',
                      course: 'English Conversation',
                      rating: 5,
                      comment: 'Amazing teachers and great learning environment! I improved my English significantly.',
                      avatar: null
                    },
                    {
                      name: 'Ahmad K.',
                      course: 'Business English',
                      rating: 5,
                      comment: 'Professional and effective. The trial lesson convinced me to enroll immediately.',
                      avatar: null
                    },
                    {
                      name: 'Maryam R.',
                      course: 'IELTS Preparation',
                      rating: 5,
                      comment: 'Passed IELTS with 7.5 band score thanks to their excellent preparation course.',
                      avatar: null
                    }
                  ].map((testimonial, index) => (
                    <motion.div
                      key={testimonial.name}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.1 * index }}
                      className="testimonial-card rounded-xl p-6"
                    >
                      <div className="flex items-center mb-4">
                        <Avatar className="w-12 h-12 border-2 border-purple-200">
                          <AvatarImage src={testimonial.avatar} />
                          <AvatarFallback className="bg-purple-100 text-purple-700 font-semibold">
                            {testimonial.name.split(' ').map(n => n[0]).join('')}
                          </AvatarFallback>
                        </Avatar>
                        <div className="ml-3">
                          <p className="font-semibold text-gray-900">{testimonial.name}</p>
                          <p className="text-sm text-gray-600">{testimonial.course}</p>
                        </div>
                      </div>
                      <div className="flex mb-3">
                        {Array.from({ length: testimonial.rating }).map((_, i) => (
                          <Star key={i} className="h-4 w-4 text-yellow-500 fill-current" />
                        ))}
                      </div>
                      <p className="text-gray-700 text-sm leading-relaxed italic">
                        "{testimonial.comment}"
                      </p>
                    </motion.div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Button
                    variant="outline"
                    onClick={() => handleQuickAction('trial')}
                    className="conversion-cta-secondary"
                    data-testid="button-read-more-reviews"
                  >
                    {t('student:readMoreReviews')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Course Discovery Section */}
        {activeSection === 'courses' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Search and Filters */}
            <Card className="card-gradient">
              <CardContent className="p-6">
                <div className="flex flex-col lg:flex-row gap-4">
                  <div className="flex-1">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                      <Input
                        placeholder={t('student:searchCourses')}
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10 py-3 rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                        data-testid="input-course-search"
                      />
                    </div>
                  </div>
                  <div className="flex gap-3 flex-wrap">
                    <select
                      value={selectedFilters.level}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, level: e.target.value }))}
                      className="px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200"
                      data-testid="filter-level"
                    >
                      <option value="">{t('student:allLevels')}</option>
                      <option value="Beginner">{t('student:beginner')}</option>
                      <option value="Intermediate">{t('student:intermediate')}</option>
                      <option value="Advanced">{t('student:advanced')}</option>
                    </select>
                    <select
                      value={selectedFilters.mode}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, mode: e.target.value }))}
                      className="px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200"
                      data-testid="filter-mode"
                    >
                      <option value="">{t('student:allModes')}</option>
                      <option value="Online">{t('student:online')}</option>
                      <option value="In-person">{t('student:inPerson')}</option>
                      <option value="Hybrid">{t('student:hybrid')}</option>
                    </select>
                    <select
                      value={selectedFilters.priceRange}
                      onChange={(e) => setSelectedFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                      className="px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200"
                      data-testid="filter-price"
                    >
                      <option value="">{t('student:allPrices')}</option>
                      <option value="free">{t('student:free')}</option>
                      <option value="low">&lt; 1M IRR</option>
                      <option value="mid">1M - 3M IRR</option>
                      <option value="high">&gt; 3M IRR</option>
                    </select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Course Grid */}
            {coursesLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardContent className="p-6">
                      <div className="h-4 bg-gray-200 rounded mb-4"></div>
                      <div className="h-20 bg-gray-200 rounded mb-4"></div>
                      <div className="h-4 bg-gray-200 rounded mb-2"></div>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredCourses.map((course) => (
                  <motion.div
                    key={course.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <Card className="card-gradient card-hover-effect h-full">
                      <CardContent className="p-6 h-full flex flex-col">
                        <div className="flex items-start justify-between mb-4">
                          <Badge 
                            variant="outline" 
                            className="bg-gradient-to-r from-purple-50 to-blue-50 border-purple-200 text-purple-700"
                          >
                            {course.level}
                          </Badge>
                          <div className="text-right">
                            <div className="text-xl font-bold conversion-gradient-text">
                              {course.price === 0 ? t('student:free') : `${(course.price / 1000000).toFixed(1)}M`}
                            </div>
                            {course.price > 0 && (
                              <div className="text-sm text-gray-500">IRR/{t('student:month')}</div>
                            )}
                          </div>
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-3 group-hover:text-purple-600 transition-colors" data-testid={`course-title-${course.id}`}>
                          {course.title}
                        </h3>
                        
                        <p className="text-gray-600 mb-4 flex-grow leading-relaxed">
                          {course.description}
                        </p>

                        <div className="space-y-3 mb-6">
                          <div className="flex items-center justify-between text-sm">
                            <span className="flex items-center gap-2 text-gray-600">
                              <Clock className="h-4 w-4" />
                              {course.totalSessions} {t('student:sessions')}
                            </span>
                            <span className="flex items-center gap-2 text-gray-600">
                              <Languages className="h-4 w-4" />
                              {course.language}
                            </span>
                          </div>
                          
                          {course.instructorName && (
                            <div className="flex items-center gap-2 text-sm text-gray-600">
                              <UserCheck className="h-4 w-4" />
                              {t('student:instructor')}: {course.instructorName}
                            </div>
                          )}

                          {course.rating && (
                            <div className="flex items-center gap-2">
                              <div className="flex">
                                {Array.from({ length: 5 }).map((_, i) => (
                                  <Star
                                    key={i}
                                    className={`h-4 w-4 ${
                                      i < Math.floor(course.rating || 0)
                                        ? 'text-yellow-500 fill-current'
                                        : 'text-gray-300'
                                    }`}
                                  />
                                ))}
                              </div>
                              <span className="text-sm font-medium text-gray-700">
                                {course.rating?.toFixed(1)} ({course.enrolledStudents || 0} {t('student:students')})
                              </span>
                            </div>
                          )}
                        </div>

                        <div className="mt-auto space-y-3">
                          <Button 
                            className="conversion-cta-button w-full"
                            data-testid={`course-enroll-${course.id}`}
                          >
                            {course.price === 0 ? t('student:startLearning') : t('student:enrollNow')}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                          <Button 
                            variant="outline"
                            className="conversion-cta-secondary w-full"
                            data-testid={`course-details-${course.id}`}
                          >
                            {t('student:viewDetails')}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}

            {/* View All Courses Button */}
            {!coursesLoading && (
              <div className="text-center mt-8">
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => setLocation('/courses')}
                  className="conversion-cta-secondary px-8 py-4"
                  data-testid="button-view-all-courses"
                >
                  <BookOpen className="mr-2 h-5 w-5" />
                  {t('student:courses.viewAllCourses')}
                  <ChevronRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            )}

            {filteredCourses.length === 0 && !coursesLoading && (
              <div className="text-center py-12">
                <BookOpen className="h-16 w-16 text-gray-300 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                  {t('student:noCoursesFound')}
                </h3>
                <p className="text-gray-500 mb-6">
                  {t('student:tryDifferentFilters')}
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedFilters({ level: '', mode: '', language: '', priceRange: '' })}
                  className="conversion-cta-secondary"
                >
                  {t('student:clearFilters')}
                </Button>
              </div>
            )}
          </motion.div>
        )}

        {/* Teacher Showcase */}
        {activeSection === 'teachers' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {teachersLoading ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <TeacherSkeleton key={i} />
                ))}
              </div>
            ) : teachersError ? (
              <Card className="border-red-200 bg-red-50">
                <CardContent className="p-8 text-center">
                  <div className="text-red-600 mb-4">
                    <Users className="h-12 w-12 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold">{t('common:errorLoadingData')}</h3>
                    <p className="text-sm mt-2">{t('common:teachersLoadError')}</p>
                  </div>
                  <Button
                    variant="outline"
                    onClick={() => window.location.reload()}
                    className="mt-4 border-red-300 text-red-700 hover:bg-red-100"
                    data-testid="button-retry-teachers"
                  >
                    {t('common:retry')}
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {teachers.map((teacher) => (
                  <motion.div
                    key={teacher.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    whileHover={{ y: -8 }}
                    className="group"
                  >
                    <Card className="card-gradient card-hover-effect h-full">
                      <CardContent className="p-6 text-center h-full flex flex-col">
                        <div className="relative mb-6">
                          <Avatar className="w-24 h-24 mx-auto border-4 border-purple-100 shadow-lg">
                            <AvatarImage src={teacher.profileImage} alt={`${teacher.firstName} ${teacher.lastName}`} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-blue-600 text-white text-xl font-bold">
                              {teacher.firstName[0]}{teacher.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {teacher.isOnline && (
                            <div className="absolute -top-1 -right-1 w-6 h-6 bg-green-500 border-2 border-white rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-white rounded-full"></div>
                            </div>
                          )}
                          {teacher.isPopular && (
                            <Badge className="absolute -top-2 left-1/2 transform -translate-x-1/2 bg-gradient-to-r from-yellow-400 to-orange-500 text-white text-xs">
                              ⭐ {t('student:popular')}
                            </Badge>
                          )}
                        </div>

                        <h3 className="text-xl font-bold text-gray-900 mb-2">
                          {teacher.firstName} {teacher.lastName}
                        </h3>

                        <div className="flex items-center justify-center gap-2 mb-4">
                          <div className="flex">
                            {Array.from({ length: 5 }).map((_, i) => (
                              <Star
                                key={i}
                                className={`h-4 w-4 ${
                                  i < Math.floor(teacher.rating)
                                    ? 'text-yellow-500 fill-current'
                                    : 'text-gray-300'
                                }`}
                              />
                            ))}
                          </div>
                          <span className="text-sm font-semibold text-gray-700">
                            {teacher.rating.toFixed(1)}
                          </span>
                        </div>

                        <div className="space-y-3 mb-6 flex-grow">
                          <div className="flex justify-center gap-2 flex-wrap">
                            {teacher.specializations.slice(0, 3).map((spec, index) => (
                              <Badge 
                                key={index}
                                variant="outline"
                                className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 text-blue-700 text-xs"
                              >
                                {spec}
                              </Badge>
                            ))}
                          </div>

                          <p className="text-gray-600 text-sm leading-relaxed">
                            {teacher.bio}
                          </p>

                          <div className="grid grid-cols-2 gap-4 text-sm">
                            <div className="text-center">
                              <div className="font-bold text-purple-600">{teacher.experience}</div>
                              <div className="text-gray-600">{t('student:yearsExp')}</div>
                            </div>
                            <div className="text-center">
                              <div className="font-bold text-blue-600">{teacher.totalStudents}+</div>
                              <div className="text-gray-600">{t('student:students')}</div>
                            </div>
                          </div>

                          {teacher.achievements && teacher.achievements.length > 0 && (
                            <div className="text-center">
                              <div className="text-xs text-gray-500 mb-1">{t('student:achievements')}</div>
                              <div className="space-y-1">
                                {teacher.achievements.slice(0, 2).map((achievement, index) => (
                                  <div key={index} className="text-xs text-purple-600 font-medium">
                                    {achievement}
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>

                        <div className="space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">{t('student:response')}</span>
                            <span className="font-semibold text-green-600">{teacher.responseTime}</span>
                          </div>
                          
                          {teacher.hasTrialLesson && (
                            <Button 
                              className="conversion-cta-button w-full"
                              onClick={() => {
                                setActiveSection('trial');
                                // Auto-select this teacher for trial booking
                              }}
                              data-testid={`teacher-trial-${teacher.id}`}
                            >
                              <Video className="mr-2 h-4 w-4" />
                              {t('student:bookTrialLesson')}
                            </Button>
                          )}
                          
                          <Button 
                            variant="outline"
                            className="conversion-cta-secondary w-full"
                            data-testid={`teacher-profile-${teacher.id}`}
                          >
                            {t('student:viewProfile')}
                            <ChevronRight className="ml-2 h-4 w-4" />
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        )}

        {/* LinguaQuest Free Learning */}
        {activeSection === 'linguaquest' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            {/* Hero Section for LinguaQuest */}
            <Card className="conversion-gradient-bg text-white border-0 shadow-2xl">
              <CardContent className="p-8 lg:p-12 text-center">
                <Brain className="h-20 w-20 mx-auto mb-6 text-white/90" />
                <h2 className="text-4xl font-bold mb-4">{t('student:linguaquestTitle')}</h2>
                <p className="text-white/90 text-xl mb-8 max-w-2xl mx-auto">
                  {t('student:linguaquestDescription')}
                </p>
                <div className="flex justify-center gap-4">
                  <Button
                    size="lg"
                    className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white px-8 py-4"
                    data-testid="button-start-linguaquest"
                    onClick={() => setLocation('/linguaquest')}
                  >
                    <Play className="mr-2 h-5 w-5" />
                    {t('student:startFreeLearning')}
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Free Learning Features */}
            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  title: t('student:interactiveLessons'),
                  description: t('student:interactiveLessonsDesc'),
                  icon: BookOpen,
                  color: 'from-blue-500 to-blue-600',
                  count: '25+'
                },
                {
                  title: t('student:voiceExercises'),
                  description: t('student:voiceExercisesDesc'),
                  icon: MessageCircle,
                  color: 'from-purple-500 to-purple-600',
                  count: '50+'
                },
                {
                  title: t('student:aiPersonalization'),
                  description: t('student:aiPersonalizationDesc'),
                  icon: Brain,
                  color: 'from-green-500 to-green-600',
                  count: '∞'
                }
              ].map((feature, index) => (
                <motion.div
                  key={feature.title}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                >
                  <Card className="card-gradient card-hover-effect h-full text-center">
                    <CardContent className="p-6">
                      <div className={`w-16 h-16 mx-auto mb-4 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center`}>
                        <feature.icon className="h-8 w-8 text-white" />
                      </div>
                      <div className="text-2xl font-bold text-purple-600 mb-2">{feature.count}</div>
                      <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                      <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            {/* Sample Lessons Preview */}
            <Card className="card-gradient">
              <CardHeader>
                <CardTitle className="text-2xl font-bold text-center conversion-gradient-text">
                  {t('student:sampleLessons')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-6">
                  {[
                    {
                      title: 'Basic Greetings & Introductions',
                      level: 'Beginner',
                      duration: '15 min',
                      type: 'Interactive Lesson'
                    },
                    {
                      title: 'Pronunciation Practice',
                      level: 'All Levels',
                      duration: '20 min',
                      type: 'Voice Exercise'
                    },
                    {
                      title: 'Conversation Starter',
                      level: 'Intermediate',
                      duration: '25 min',
                      type: 'AI Chat'
                    },
                    {
                      title: 'Grammar Fundamentals',
                      level: 'Beginner',
                      duration: '18 min',
                      type: 'Interactive Quiz'
                    }
                  ].map((lesson, index) => (
                    <div key={lesson.title} className="testimonial-card rounded-xl p-4 hover:shadow-lg transition-shadow">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="bg-purple-50 text-purple-700 border-purple-200">
                          {lesson.level}
                        </Badge>
                        <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                          {lesson.type}
                        </Badge>
                      </div>
                      <h4 className="font-semibold text-gray-900 mb-2">{lesson.title}</h4>
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600 flex items-center gap-1">
                          <Clock className="h-4 w-4" />
                          {lesson.duration}
                        </span>
                        <Button size="sm" variant="outline" className="text-purple-600 border-purple-200 hover:bg-purple-50">
                          <Play className="h-3 w-3 mr-1" />
                          {t('student:tryNow')}
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-8">
                  <Button className="conversion-cta-button">
                    {t('student:exploreAllLessons')}
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}

        {/* Trial Booking Interface */}
        {activeSection === 'trial' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold conversion-gradient-text mb-4">
                {t('student:bookYourFreeTrial')}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {t('student:trialBookingDescription')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Booking Form */}
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Calendar className="h-6 w-6 text-purple-600" />
                    {t('student:scheduleYourTrial')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:preferredTeacher')}
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200">
                        <option value="">{t('student:anyAvailableTeacher')}</option>
                        {teachers.slice(0, 5).map((teacher) => (
                          <option key={teacher.id} value={teacher.id}>
                            {teacher.firstName} {teacher.lastName} ({teacher.rating.toFixed(1)}⭐)
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:preferredLanguage')}
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200">
                        <option value="English">English</option>
                        <option value="Persian">Persian</option>
                        <option value="Arabic">Arabic</option>
                        <option value="French">French</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:currentLevel')}
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200">
                        <option value="Beginner">{t('student:beginner')}</option>
                        <option value="Intermediate">{t('student:intermediate')}</option>
                        <option value="Advanced">{t('student:advanced')}</option>
                        <option value="Not sure">{t('student:notSure')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:preferredTime')}
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <input
                          type="date"
                          min={new Date().toISOString().split('T')[0]}
                          className="px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200"
                        />
                        <input
                          type="time"
                          className="px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200"
                        />
                      </div>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:fullName')}
                      </label>
                      <Input
                        placeholder={t('student:enterFullName')}
                        className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:phoneNumber')}
                      </label>
                      <Input
                        placeholder={t('student:enterPhoneNumber')}
                        className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:email')}
                      </label>
                      <Input
                        type="email"
                        placeholder={t('student:enterEmail')}
                        className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>
                  </div>

                  <Button 
                    className="conversion-cta-button w-full"
                    disabled={bookTrialMutation.isPending}
                    data-testid="button-confirm-trial-booking"
                  >
                    {bookTrialMutation.isPending ? (
                      <>
                        <div className="animate-spin w-4 h-4 border-2 border-white border-t-transparent rounded-full mr-2"></div>
                        {t('student:booking')}...
                      </>
                    ) : (
                      <>
                        <Calendar className="mr-2 h-5 w-5" />
                        {t('student:confirmBooking')}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>

              {/* Benefits & FAQ */}
              <div className="space-y-6">
                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <CheckCircle className="h-6 w-6 text-green-600" />
                      {t('student:whatsIncluded')}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        t('student:thirtyMinuteSession'),
                        t('student:personalizedAssessment'),
                        t('student:customLearningPlan'),
                        t('student:noCommitmentRequired'),
                        t('student:expertTeacherMatch')
                      ].map((benefit, index) => (
                        <div key={index} className="flex items-start gap-3">
                          <CheckCircle className="h-5 w-5 text-green-600 mt-0.5 flex-shrink-0" />
                          <span className="text-gray-700">{benefit}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>{t('student:frequentQuestions')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {[
                        {
                          q: t('student:isTrialReallyFree'),
                          a: t('student:yesCompletelyFree')
                        },
                        {
                          q: t('student:howLongIsSession'),
                          a: t('student:thirtyMinutesLong')
                        },
                        {
                          q: t('student:canIChooseTeacher'),
                          a: t('student:yesChooseOrMatch')
                        }
                      ].map((faq, index) => (
                        <div key={index} className="border-b border-gray-100 pb-4 last:border-b-0">
                          <h4 className="font-semibold text-gray-900 mb-2">{faq.q}</h4>
                          <p className="text-gray-600 text-sm">{faq.a}</p>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}

        {/* Contact Section */}
        {activeSection === 'contact' && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-8"
          >
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold conversion-gradient-text mb-4">
                {t('student:getInTouch')}
              </h2>
              <p className="text-gray-600 text-lg max-w-2xl mx-auto">
                {t('student:contactDescription')}
              </p>
            </div>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Contact Form */}
              <Card className="card-gradient">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MessageCircle className="h-6 w-6 text-purple-600" />
                    {t('student:sendMessage')}
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:fullName')}
                      </label>
                      <Input
                        placeholder={t('student:enterFullName')}
                        className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:email')}
                      </label>
                      <Input
                        type="email"
                        placeholder={t('student:enterEmail')}
                        className="rounded-xl border-purple-200 focus:border-purple-400 focus:ring-purple-200"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:subject')}
                      </label>
                      <select className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200">
                        <option value="general">{t('student:generalInquiry')}</option>
                        <option value="courses">{t('student:coursesQuestion')}</option>
                        <option value="pricing">{t('student:pricingQuestion')}</option>
                        <option value="technical">{t('student:technicalSupport')}</option>
                        <option value="partnership">{t('student:partnership')}</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        {t('student:message')}
                      </label>
                      <textarea
                        rows={5}
                        placeholder={t('student:enterMessage')}
                        className="w-full px-4 py-3 rounded-xl border border-purple-200 bg-white focus:border-purple-400 focus:ring-purple-200 resize-none"
                      ></textarea>
                    </div>
                  </div>

                  <Button className="conversion-cta-button w-full">
                    <MessageCircle className="mr-2 h-5 w-5" />
                    {t('student:sendMessage')}
                  </Button>
                </CardContent>
              </Card>

              {/* Contact Information */}
              <div className="space-y-6">
                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>{t('student:contactInformation')}</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      {
                        icon: Phone,
                        label: t('student:phone'),
                        value: branding?.contact?.phone || '+98 21 1234 5678',
                        color: 'text-green-600'
                      },
                      {
                        icon: Mail,
                        label: t('student:email'),
                        value: branding?.contact?.email || 'info@metalingua.com',
                        color: 'text-blue-600'
                      },
                      {
                        icon: MapPin,
                        label: t('student:address'),
                        value: branding?.contact?.address || 'Tehran, Iran',
                        color: 'text-purple-600'
                      }
                    ].map((contact, index) => (
                      <div key={index} className="flex items-start gap-4">
                        <div className="feature-icon-bg">
                          <contact.icon className={`h-5 w-5 ${contact.color}`} />
                        </div>
                        <div>
                          <div className="font-semibold text-gray-900">{contact.label}</div>
                          <div className="text-gray-600">{contact.value}</div>
                        </div>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="card-gradient">
                  <CardHeader>
                    <CardTitle>{t('student:businessHours')}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {[
                        { days: t('student:mondayFriday'), hours: '8:00 AM - 8:00 PM' },
                        { days: t('student:saturday'), hours: '9:00 AM - 6:00 PM' },
                        { days: t('student:sunday'), hours: t('student:closed') }
                      ].map((schedule, index) => (
                        <div key={index} className="flex justify-between">
                          <span className="font-medium text-gray-900">{schedule.days}</span>
                          <span className="text-gray-600">{schedule.hours}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card className="conversion-gradient-bg text-white">
                  <CardContent className="p-6 text-center">
                    <Phone className="h-12 w-12 mx-auto mb-4 text-white/90" />
                    <h3 className="text-xl font-bold mb-2">{t('student:needImmediateHelp')}</h3>
                    <p className="text-white/90 mb-4">{t('student:callUsDirectly')}</p>
                    <Button
                      variant="secondary"
                      className="bg-white/20 backdrop-blur-sm hover:bg-white/30 border border-white/30 text-white"
                    >
                      <Phone className="mr-2 h-4 w-4" />
                      {branding?.contact?.phone || '+98 21 1234 5678'}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            </div>
          </motion.div>
        )}
      </div>

      {/* Floating CTA */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 1, duration: 0.6 }}
        className="fixed bottom-6 right-6 z-50"
      >
        <Button
          size="lg"
          onClick={() => handleQuickAction('trial')}
          className="conversion-cta-button rounded-full shadow-2xl"
          data-testid="floating-cta-trial"
        >
          <Video className="mr-2 h-5 w-5" />
          {t('student:startLearning')}
        </Button>
      </motion.div>
    </div>
  );
}

export default ExplorerDashboard;