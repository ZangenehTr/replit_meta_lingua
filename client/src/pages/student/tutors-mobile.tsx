import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Users,
  User,
  Star,
  Globe,
  Clock,
  Calendar,
  Video,
  MessageCircle,
  Heart,
  ChevronRight,
  Filter,
  Search,
  Languages,
  Award,
  Verified
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Tutor {
  id: number;
  firstName: string;
  lastName: string;
  avatar?: string;
  rating: number;
  totalReviews: number;
  languages: string[];
  specialties: string[];
  experience: number; // years
  hourlyRate: number;
  availability: string;
  bio: string;
  isOnline: boolean;
  isFavorite: boolean;
  verified: boolean;
  completedSessions: number;
  responseTime: string;
}

export default function StudentTutorsMobile() {
  const { t } = useTranslation();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLanguage, setFilterLanguage] = useState<string>('all');
  const [selectedTutor, setSelectedTutor] = useState<Tutor | null>(null);
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);

  // Fetch tutors
  const { data: tutors = [], isLoading } = useQuery<Tutor[]>({
    queryKey: ['/api/student/tutors', filterLanguage, showFavoritesOnly],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterLanguage !== 'all') params.append('language', filterLanguage);
      if (showFavoritesOnly) params.append('favorites', 'true');
      
      const response = await fetch(`/api/student/tutors?${params}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tutors');
      return response.json();
    }
  });

  // Toggle favorite mutation
  const toggleFavorite = useMutation({
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
      toast({
        title: t('student:favoriteUpdated'),
        description: t('student:favoriteUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/tutors'] });
    }
  });

  // Book session mutation
  const bookSession = useMutation({
    mutationFn: async (tutorId: number) => {
      const response = await fetch(`/api/student/tutors/${tutorId}/book`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to book session');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:sessionBooked'),
        description: t('student:sessionBookedDesc'),
      });
      setSelectedTutor(null);
    }
  });

  const filteredTutors = tutors.filter(tutor =>
    tutor.firstName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.lastName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    tutor.specialties.some(s => s.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fa-IR', {
      style: 'currency',
      currency: 'IRR',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <MobileLayout
      title={t('student:tutors')}
      showBack={false}
      gradient="cool"
    >
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
            placeholder={t('student:searchTutors')}
            className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
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
          onClick={() => setShowFavoritesOnly(!showFavoritesOnly)}
          className={`
            px-4 py-2 rounded-xl whitespace-nowrap transition-all
            ${showFavoritesOnly 
              ? 'bg-pink-500/30 text-pink-300' 
              : 'bg-white/10 text-white/70'}
            tap-scale
          `}
        >
          <Heart className="w-4 h-4 inline mr-1" />
          {t('student:favorites')}
        </button>
        {['all', 'english', 'spanish', 'french', 'german'].map((lang) => (
          <button
            key={lang}
            onClick={() => setFilterLanguage(lang)}
            className={`
              px-4 py-2 rounded-xl whitespace-nowrap transition-all
              ${filterLanguage === lang 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`languages.${lang}`)}
          </button>
        ))}
      </motion.div>

      {/* Tutors List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="flex gap-3">
                <div className="w-16 h-16 rounded-full bg-white/20" />
                <div className="flex-1">
                  <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                  <div className="h-3 bg-white/20 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : filteredTutors.length === 0 ? (
        <MobileCard className="text-center py-12">
          <Users className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noTutors')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {filteredTutors.map((tutor, index) => (
            <motion.div
              key={tutor.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MobileCard 
                className="relative"
                onClick={() => setSelectedTutor(tutor)}
              >
                {/* Online Indicator */}
                {tutor.isOnline && (
                  <div className="absolute top-3 right-3 flex items-center gap-1 bg-green-500/20 px-2 py-1 rounded-full">
                    <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse" />
                    <span className="text-green-400 text-xs">{t('common:online')}</span>
                  </div>
                )}

                <div className="flex gap-4">
                  {/* Avatar */}
                  <div className="relative">
                    <Avatar className="w-16 h-16 border-2 border-white/20">
                      <AvatarImage src={tutor.avatar} />
                      <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-lg">
                        {tutor.firstName[0]}{tutor.lastName[0]}
                      </AvatarFallback>
                    </Avatar>
                    {tutor.verified && (
                      <div className="absolute -bottom-1 -right-1 p-1 bg-blue-500 rounded-full">
                        <Verified className="w-3 h-3 text-white" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1">
                    <div className="flex items-start justify-between mb-1">
                      <div>
                        <h3 className="text-white font-semibold">
                          {tutor.firstName} {tutor.lastName}
                        </h3>
                        <div className="flex items-center gap-2 mt-1">
                          <div className="flex items-center gap-1">
                            <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                            <span className="text-white/80 text-sm">
                              {tutor.rating.toFixed(1)}
                            </span>
                            <span className="text-white/50 text-xs">
                              ({tutor.totalReviews})
                            </span>
                          </div>
                          <span className="text-white/30">•</span>
                          <span className="text-white/60 text-sm">
                            {tutor.completedSessions} {t('student:sessions')}
                          </span>
                        </div>
                      </div>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleFavorite.mutate(tutor.id);
                        }}
                        className="p-2"
                      >
                        <Heart className={`w-5 h-5 ${
                          tutor.isFavorite 
                            ? 'text-pink-400 fill-pink-400' 
                            : 'text-white/30'
                        }`} />
                      </button>
                    </div>

                    {/* Languages */}
                    <div className="flex flex-wrap gap-1 mb-2">
                      {tutor.languages.slice(0, 3).map((lang) => (
                        <Badge 
                          key={lang}
                          className="bg-purple-500/20 text-purple-300 border-purple-500/30 text-xs"
                        >
                          {lang}
                        </Badge>
                      ))}
                      {tutor.languages.length > 3 && (
                        <Badge className="bg-white/10 text-white/50 border-white/20 text-xs">
                          +{tutor.languages.length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Bio */}
                    <p className="text-white/60 text-sm line-clamp-2 mb-2">
                      {tutor.bio}
                    </p>

                    {/* Footer */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-white font-semibold">
                          {formatCurrency(tutor.hourlyRate)}/hr
                        </span>
                        <span className="text-white/50 text-xs">
                          {tutor.experience} {t('student:yearsExp')}
                        </span>
                      </div>
                      <ChevronRight className="w-5 h-5 text-white/30" />
                    </div>
                  </div>
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      )}

      {/* Tutor Detail Modal */}
      <AnimatePresence>
        {selectedTutor && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedTutor(null)}
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
              
              {/* Header */}
              <div className="flex items-center gap-4 mb-4">
                <Avatar className="w-20 h-20 border-2 border-white/20">
                  <AvatarImage src={selectedTutor.avatar} />
                  <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white text-xl">
                    {selectedTutor.firstName[0]}{selectedTutor.lastName[0]}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-white text-xl font-bold">
                    {selectedTutor.firstName} {selectedTutor.lastName}
                  </h2>
                  <div className="flex items-center gap-2 mt-1">
                    <Star className="w-5 h-5 text-yellow-400 fill-yellow-400" />
                    <span className="text-white">
                      {selectedTutor.rating.toFixed(1)} ({selectedTutor.totalReviews} {t('student:reviews')})
                    </span>
                  </div>
                </div>
              </div>

              {/* Bio */}
              <p className="text-white/80 mb-4">
                {selectedTutor.bio}
              </p>

              {/* Details */}
              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-3">
                  <Languages className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">{t('student:languages')}:</span>
                  <span className="text-white">{selectedTutor.languages.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Award className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">{t('student:specialties')}:</span>
                  <span className="text-white">{selectedTutor.specialties.join(', ')}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Clock className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">{t('student:responseTime')}:</span>
                  <span className="text-white">{selectedTutor.responseTime}</span>
                </div>
                <div className="flex items-center gap-3">
                  <Calendar className="w-5 h-5 text-white/50" />
                  <span className="text-white/70">{t('student:availability')}:</span>
                  <span className="text-white">{selectedTutor.availability}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  {t('student:message')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => bookSession.mutate(selectedTutor.id)}
                >
                  <Video className="w-4 h-4 mr-2" />
                  {t('student:bookSession')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}