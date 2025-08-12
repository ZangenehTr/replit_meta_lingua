import React, { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Brain,
  Heart,
  Smile,
  Frown,
  Meh,
  Sparkles,
  Activity,
  TrendingUp,
  Target,
  ChevronRight,
  Music,
  Gamepad2,
  BookOpen,
  Headphones,
  Coffee,
  Sun,
  Moon,
  CloudRain
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface MoodData {
  currentMood: 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited';
  moodHistory: {
    date: string;
    mood: string;
    score: number;
  }[];
  recommendations: {
    id: number;
    type: 'activity' | 'content' | 'break';
    title: string;
    description: string;
    duration: number;
    icon: string;
  }[];
  learningStyle: 'visual' | 'auditory' | 'kinesthetic' | 'reading';
  productivityScore: number;
  streakDays: number;
}

export default function StudentMoodLearningMobile() {
  const { t } = useTranslation();
  const [selectedMood, setSelectedMood] = useState<string | null>(null);
  const [showMoodSelector, setShowMoodSelector] = useState(false);

  // Fetch mood data
  const { data: moodData, isLoading } = useQuery<MoodData>({
    queryKey: ['/api/student/mood-learning'],
    queryFn: async () => {
      const response = await fetch('/api/student/mood-learning', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch mood data');
      return response.json();
    }
  });

  // Update mood mutation
  const updateMood = useMutation({
    mutationFn: async (mood: string) => {
      const response = await fetch('/api/student/mood-learning/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ mood })
      });
      if (!response.ok) throw new Error('Failed to update mood');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:moodUpdated'),
        description: t('student:moodUpdatedDesc'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/mood-learning'] });
      setShowMoodSelector(false);
      setSelectedMood(null);
    }
  });

  const moods = [
    { id: 'happy', icon: Smile, color: 'from-yellow-400 to-orange-400', label: t('student:mood.happy') },
    { id: 'excited', icon: Sparkles, color: 'from-purple-400 to-pink-400', label: t('student:mood.excited') },
    { id: 'neutral', icon: Meh, color: 'from-gray-400 to-gray-500', label: t('student:mood.neutral') },
    { id: 'stressed', icon: CloudRain, color: 'from-blue-400 to-indigo-400', label: t('student:mood.stressed') },
    { id: 'sad', icon: Frown, color: 'from-indigo-400 to-purple-400', label: t('student:mood.sad') }
  ];

  const learningStyles = {
    visual: { icon: BookOpen, color: 'text-blue-400' },
    auditory: { icon: Headphones, color: 'text-green-400' },
    kinesthetic: { icon: Activity, color: 'text-orange-400' },
    reading: { icon: BookOpen, color: 'text-purple-400' }
  };

  const getRecommendationIcon = (icon: string) => {
    const icons: any = {
      music: Music,
      game: Gamepad2,
      book: BookOpen,
      headphones: Headphones,
      coffee: Coffee,
      sun: Sun,
      moon: Moon
    };
    const IconComponent = icons[icon] || BookOpen;
    return <IconComponent className="w-5 h-5" />;
  };

  const getMoodIcon = (mood: string) => {
    const moodConfig = moods.find(m => m.id === mood);
    return moodConfig ? <moodConfig.icon className="w-6 h-6" /> : <Meh className="w-6 h-6" />;
  };

  const getMoodGradient = (mood: string) => {
    const moodConfig = moods.find(m => m.id === mood);
    return moodConfig ? moodConfig.color : 'from-gray-400 to-gray-500';
  };

  return (
    <MobileLayout
      title={t('student:moodLearning')}
      showBack={false}
      gradient="aurora"
    >
      {/* Current Mood Section */}
      <motion.div
        className={`relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br ${getMoodGradient(moodData?.currentMood || 'neutral')}`}
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        onClick={() => setShowMoodSelector(true)}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm mb-1">{t('student:howAreYouFeeling')}</p>
              <div className="flex items-center gap-3">
                {getMoodIcon(moodData?.currentMood || 'neutral')}
                <h2 className="text-white text-2xl font-bold capitalize">
                  {moodData?.currentMood || t('student:selectMood')}
                </h2>
              </div>
            </div>
            <ChevronRight className="w-6 h-6 text-white/50" />
          </div>

          <div className="grid grid-cols-2 gap-4 mt-6">
            <div>
              <p className="text-white/60 text-xs">{t('student:productivityScore')}</p>
              <div className="flex items-center gap-2">
                <TrendingUp className="w-4 h-4 text-white/70" />
                <p className="text-white font-semibold text-lg">
                  {moodData?.productivityScore || 0}%
                </p>
              </div>
            </div>
            <div>
              <p className="text-white/60 text-xs">{t('student:moodStreak')}</p>
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-white/70" />
                <p className="text-white font-semibold text-lg">
                  {moodData?.streakDays || 0} {t('common:days')}
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Learning Style Card */}
      {moodData?.learningStyle && (
        <motion.div
          className="glass-card p-5 mb-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3, delay: 0.1 }}
        >
          <h3 className="text-white font-semibold mb-3">
            {t('student:yourLearningStyle')}
          </h3>
          <div className="flex items-center gap-3">
            {React.createElement(learningStyles[moodData.learningStyle].icon, {
              className: `w-8 h-8 ${learningStyles[moodData.learningStyle].color}`
            })}
            <div>
              <p className="text-white font-medium capitalize">
                {moodData.learningStyle}
              </p>
              <p className="text-white/60 text-sm">
                {t(`student:learningStyle.${moodData.learningStyle}.desc`)}
              </p>
            </div>
          </div>
        </motion.div>
      )}

      {/* Recommendations */}
      <div className="mb-6">
        <h3 className="text-white font-semibold mb-4">
          {t('student:recommendedForYou')}
        </h3>
        
        {isLoading ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="glass-card p-4 animate-pulse">
                <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-white/20 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-3">
            {moodData?.recommendations.map((rec, index) => (
              <motion.div
                key={rec.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3, delay: index * 0.1 }}
              >
                <MobileCard className="flex items-center gap-4">
                  <div className="p-3 rounded-full bg-white/10">
                    {getRecommendationIcon(rec.icon)}
                  </div>
                  
                  <div className="flex-1">
                    <h4 className="text-white font-medium">{rec.title}</h4>
                    <p className="text-white/60 text-sm line-clamp-1">
                      {rec.description}
                    </p>
                    <div className="flex items-center gap-2 mt-1">
                      <Clock className="w-3 h-3 text-white/40" />
                      <span className="text-white/50 text-xs">
                        {rec.duration} {t('common:minutes')}
                      </span>
                    </div>
                  </div>

                  <ChevronRight className="w-5 h-5 text-white/30" />
                </MobileCard>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Mood History Chart */}
      <motion.div
        className="glass-card p-5 mb-20"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <h3 className="text-white font-semibold mb-4">
          {t('student:moodHistory')}
        </h3>
        
        <div className="flex items-end justify-between h-24 gap-1">
          {moodData?.moodHistory.slice(-7).map((day, index) => (
            <div
              key={index}
              className="flex-1 flex flex-col items-center gap-1"
            >
              <div
                className="w-full bg-gradient-to-t from-purple-500 to-pink-500 rounded-t"
                style={{ height: `${day.score}%` }}
              />
              <span className="text-white/40 text-xs">
                {new Date(day.date).getDate()}
              </span>
            </div>
          ))}
        </div>
      </motion.div>

      {/* Mood Selector Modal */}
      <AnimatePresence>
        {showMoodSelector && (
          <motion.div
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setShowMoodSelector(false)}
          >
            <motion.div
              className="w-full bg-gradient-to-b from-purple-900/90 to-pink-900/90 rounded-t-3xl p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-12 h-1 bg-white/30 rounded-full mx-auto mb-4" />
              
              <h2 className="text-white text-xl font-bold mb-4 text-center">
                {t('student:howAreYouFeeling')}
              </h2>

              <div className="grid grid-cols-3 gap-4 mb-6">
                {moods.map((mood) => (
                  <motion.button
                    key={mood.id}
                    className={`
                      p-4 rounded-xl bg-gradient-to-br ${mood.color}
                      ${selectedMood === mood.id ? 'ring-2 ring-white' : ''}
                    `}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.id)}
                  >
                    <mood.icon className="w-8 h-8 text-white mx-auto mb-2" />
                    <p className="text-white text-sm font-medium">
                      {mood.label}
                    </p>
                  </motion.button>
                ))}
              </div>

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => setShowMoodSelector(false)}
                >
                  {t('common:cancel')}
                </Button>
                <Button
                  className="flex-1"
                  onClick={() => selectedMood && updateMood.mutate(selectedMood)}
                  disabled={!selectedMood}
                >
                  {t('student:updateMood')}
                </Button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </MobileLayout>
  );
}