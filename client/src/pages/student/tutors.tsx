import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  Users,
  Search,
  Filter,
  Star,
  MapPin,
  Clock,
  Globe,
  Video,
  MessageCircle,
  Calendar,
  ChevronRight,
  Heart,
  Award,
  BookOpen,
  Languages,
  X,
  DollarSign,
  CheckCircle
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface Tutor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specialization: string;
  experience: number;
  hourlyRate: number;
  rating: number;
  totalSessions: number;
  languages: string[];
  availability: string;
  profileImage?: string;
  bio: string;
  isOnline: boolean;
  isFavorite?: boolean;
}

export default function StudentTutors() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');
  const [selectedRating, setSelectedRating] = useState('all');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  // Fetch tutors
  const { data: tutors = [], isLoading } = useQuery<Tutor[]>({
    queryKey: ['/api/student/tutors'],
    queryFn: async () => {
      const response = await fetch('/api/student/tutors', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Book tutor mutation
  const bookTutorMutation = useMutation({
    mutationFn: async (tutorId: number) => {
      const response = await fetch(`/api/student/tutors/${tutorId}/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to book tutor');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:bookingSuccess', 'Booking Successful'),
        description: t('student:tutorBooked', 'Your tutor has been booked'),
      });
      setSelectedTutor(null);
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:bookingError', 'Failed to book tutor'),
        variant: 'destructive'
      });
    }
  });

  // Toggle favorite mutation
  const toggleFavoriteMutation = useMutation({
    mutationFn: async (tutorId: number) => {
      const response = await fetch(`/api/student/tutors/${tutorId}/favorite`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to toggle favorite');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/student/tutors'] });
    }
  });

  // Filter tutors
  const filteredTutors = tutors.filter(tutor => {
    const matchesSearch = `${tutor.firstName} ${tutor.lastName}`.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         tutor.specialization.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLanguage = selectedLanguage === 'all' || tutor.languages.includes(selectedLanguage);
    const matchesPrice = selectedPrice === 'all' || 
                        (selectedPrice === 'budget' && tutor.hourlyRate < 50000) ||
                        (selectedPrice === 'mid' && tutor.hourlyRate >= 50000 && tutor.hourlyRate < 100000) ||
                        (selectedPrice === 'premium' && tutor.hourlyRate >= 100000);
    const matchesRating = selectedRating === 'all' || 
                         (selectedRating === '4+' && tutor.rating >= 4) ||
                         (selectedRating === '4.5+' && tutor.rating >= 4.5);
    
    return matchesSearch && matchesLanguage && matchesPrice && matchesRating;
  });

  // Group tutors by favorites and availability
  const favoriteTutors = filteredTutors.filter(t => t.isFavorite);
  const onlineTutors = filteredTutors.filter(t => t.isOnline && !t.isFavorite);
  const offlineTutors = filteredTutors.filter(t => !t.isOnline && !t.isFavorite);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(price);
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
            <h1 className="text-white font-bold text-xl">{t('student:tutors', 'Tutors')}</h1>
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
              placeholder={t('student:searchTutors', 'Search tutors...')}
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
                    value={selectedLanguage}
                    onChange={(e) => setSelectedLanguage(e.target.value)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-sm border border-white/20 focus:outline-none"
                  >
                    <option value="all">{t('student:allLanguages', 'All Languages')}</option>
                    <option value="English">English</option>
                    <option value="Persian">Persian</option>
                    <option value="Arabic">Arabic</option>
                    <option value="Spanish">Spanish</option>
                    <option value="French">French</option>
                  </select>

                  <select
                    value={selectedPrice}
                    onChange={(e) => setSelectedPrice(e.target.value)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-sm border border-white/20 focus:outline-none"
                  >
                    <option value="all">{t('student:allPrices', 'All Prices')}</option>
                    <option value="budget">{t('student:budget', 'Budget')} (&lt;50k)</option>
                    <option value="mid">{t('student:mid', 'Mid')} (50k-100k)</option>
                    <option value="premium">{t('student:premium', 'Premium')} (&gt;100k)</option>
                  </select>

                  <select
                    value={selectedRating}
                    onChange={(e) => setSelectedRating(e.target.value)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-lg text-white text-sm border border-white/20 focus:outline-none"
                  >
                    <option value="all">{t('student:allRatings', 'All Ratings')}</option>
                    <option value="4+">4+ {t('student:stars', 'Stars')}</option>
                    <option value="4.5+">4.5+ {t('student:stars', 'Stars')}</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-3 mt-4">
            <div className="glass-card p-3 text-center">
              <Users className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{tutors.length}</p>
              <p className="text-white/60 text-xs">{t('student:available', 'Available')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Star className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{favoriteTutors.length}</p>
              <p className="text-white/60 text-xs">{t('student:favorites', 'Favorites')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Circle className="w-5 h-5 text-green-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{onlineTutors.length}</p>
              <p className="text-white/60 text-xs">{t('student:online', 'Online')}</p>
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
                  <div className="flex items-center gap-3">
                    <div className="skeleton w-16 h-16 rounded-full" />
                    <div className="flex-1">
                      <div className="skeleton h-5 w-32 mb-2 rounded" />
                      <div className="skeleton h-4 w-24 rounded" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTutors.length === 0 ? (
            <motion.div 
              className="glass-card p-8 text-center"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3 }}
            >
              <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">{t('student:noTutorsFound', 'No tutors found')}</p>
            </motion.div>
          ) : (
            <div className="space-y-6 mb-20">
              {/* Favorite Tutors */}
              {favoriteTutors.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:favoriteTutors', 'Favorite Tutors')}
                  </h2>
                  <div className="space-y-3">
                    {favoriteTutors.map((tutor, index) => (
                      <TutorCard 
                        key={tutor.id} 
                        tutor={tutor} 
                        index={index}
                        onSelect={setSelectedTutor}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        formatPrice={formatPrice}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Online Tutors */}
              {onlineTutors.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:onlineNow', 'Online Now')}
                  </h2>
                  <div className="space-y-3">
                    {onlineTutors.map((tutor, index) => (
                      <TutorCard 
                        key={tutor.id} 
                        tutor={tutor} 
                        index={index}
                        onSelect={setSelectedTutor}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        formatPrice={formatPrice}
                        t={t}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Offline Tutors */}
              {offlineTutors.length > 0 && (
                <div>
                  <h2 className="text-white/90 font-semibold text-sm mb-3 px-2">
                    {t('student:allTutors', 'All Tutors')}
                  </h2>
                  <div className="space-y-3">
                    {offlineTutors.map((tutor, index) => (
                      <TutorCard 
                        key={tutor.id} 
                        tutor={tutor} 
                        index={index}
                        onSelect={setSelectedTutor}
                        onToggleFavorite={(id) => toggleFavoriteMutation.mutate(id)}
                        formatPrice={formatPrice}
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

      {/* Tutor Detail Modal */}
      <AnimatePresence>
        {selectedTutor && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTutor(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full max-h-[90vh] overflow-y-auto"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Modal Header */}
              <div className="sticky top-0 bg-white border-b p-4 flex items-center justify-between">
                <h2 className="text-lg font-semibold">{t('student:tutorProfile', 'Tutor Profile')}</h2>
                <button
                  onClick={() => setSelectedTutor(null)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Modal Content */}
              <div className="p-4 space-y-4">
                {/* Tutor Info */}
                <div className="flex items-start gap-4">
                  <Avatar className="w-20 h-20 border-2 border-purple-200">
                    <AvatarImage src={selectedTutor.profileImage} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                      {selectedTutor.firstName[0]}{selectedTutor.lastName[0]}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold">
                      {selectedTutor.firstName} {selectedTutor.lastName}
                    </h3>
                    <p className="text-gray-600">{selectedTutor.specialization}</p>
                    <div className="flex items-center gap-3 mt-2">
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500 fill-yellow-500" />
                        <span className="font-medium">{selectedTutor.rating}</span>
                      </div>
                      <span className="text-gray-500 text-sm">
                        {selectedTutor.totalSessions} {t('student:sessions', 'sessions')}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Bio */}
                <div>
                  <h4 className="font-medium mb-2">{t('student:about', 'About')}</h4>
                  <p className="text-gray-600 text-sm">{selectedTutor.bio}</p>
                </div>

                {/* Languages */}
                <div>
                  <h4 className="font-medium mb-2">{t('student:languages', 'Languages')}</h4>
                  <div className="flex flex-wrap gap-2">
                    {selectedTutor.languages.map((lang) => (
                      <Badge key={lang} variant="secondary">
                        {lang}
                      </Badge>
                    ))}
                  </div>
                </div>

                {/* Experience & Rate */}
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t('student:experience', 'Experience')}</p>
                    <p className="font-medium">{selectedTutor.experience} {t('student:years', 'years')}</p>
                  </div>
                  <div className="bg-gray-50 p-3 rounded-lg">
                    <p className="text-sm text-gray-600 mb-1">{t('student:hourlyRate', 'Hourly Rate')}</p>
                    <p className="font-medium text-purple-600">{formatPrice(selectedTutor.hourlyRate)}</p>
                  </div>
                </div>

                {/* Availability */}
                <div>
                  <h4 className="font-medium mb-2">{t('student:availability', 'Availability')}</h4>
                  <p className="text-gray-600 text-sm">{selectedTutor.availability}</p>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3">
                  <Button
                    onClick={() => bookTutorMutation.mutate(selectedTutor.id)}
                    disabled={bookTutorMutation.isPending}
                    className="flex-1 bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  >
                    <Calendar className="w-4 h-4 mr-2" />
                    {bookTutorMutation.isPending 
                      ? t('student:booking', 'Booking...') 
                      : t('student:bookSession', 'Book Session')}
                  </Button>
                  <Button variant="outline" className="flex-1">
                    <MessageCircle className="w-4 h-4 mr-2" />
                    {t('student:sendMessage', 'Message')}
                  </Button>
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

// Tutor Card Component
function TutorCard({ 
  tutor, 
  index, 
  onSelect, 
  onToggleFavorite, 
  formatPrice, 
  t 
}: {
  tutor: Tutor;
  index: number;
  onSelect: (tutor: Tutor) => void;
  onToggleFavorite: (id: number) => void;
  formatPrice: (price: number) => string;
  t: any;
}) {
  return (
    <motion.div
      className="glass-card p-4 cursor-pointer"
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.3, delay: index * 0.05 }}
      whileTap={{ scale: 0.98 }}
      onClick={() => onSelect(tutor)}
    >
      <div className="flex items-start gap-3">
        <div className="relative">
          <Avatar className="w-14 h-14 border-2 border-white/20">
            <AvatarImage src={tutor.profileImage} />
            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
              {tutor.firstName[0]}{tutor.lastName[0]}
            </AvatarFallback>
          </Avatar>
          {tutor.isOnline && (
            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="text-white font-semibold">
                {tutor.firstName} {tutor.lastName}
              </h3>
              <p className="text-white/60 text-sm">{tutor.specialization}</p>
            </div>
            <motion.button
              whileTap={{ scale: 0.8 }}
              onClick={(e) => {
                e.stopPropagation();
                onToggleFavorite(tutor.id);
              }}
              className="p-1"
            >
              <Heart className={`w-5 h-5 ${tutor.isFavorite ? 'text-red-400 fill-red-400' : 'text-white/50'}`} />
            </motion.button>
          </div>
          
          <div className="flex items-center gap-3 mt-2 text-white/70 text-sm">
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
              <span>{tutor.rating}</span>
            </div>
            <span>•</span>
            <span>{tutor.totalSessions} {t('student:sessions', 'sessions')}</span>
            <span>•</span>
            <span className="text-white/90 font-medium">{formatPrice(tutor.hourlyRate)}/hr</span>
          </div>
          
          <div className="flex gap-2 mt-2">
            {tutor.languages.slice(0, 3).map((lang) => (
              <Badge key={lang} className="bg-white/10 text-white/70 border-white/20 text-xs">
                {lang}
              </Badge>
            ))}
            {tutor.languages.length > 3 && (
              <Badge className="bg-white/10 text-white/70 border-white/20 text-xs">
                +{tutor.languages.length - 3}
              </Badge>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}