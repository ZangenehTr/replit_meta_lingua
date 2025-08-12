import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  Brain,
  Smile,
  Frown,
  Meh,
  Heart,
  TrendingUp,
  Calendar,
  Target,
  Award,
  Sparkles,
  BarChart,
  ChevronRight,
  Zap,
  Music,
  Palette,
  BookOpen,
  Trophy,
  Star,
  Lock,
  CheckCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";

interface MoodData {
  mood: 'happy' | 'neutral' | 'sad' | 'stressed' | 'excited' | 'tired';
  energy: number;
  focus: number;
  motivation: number;
  timestamp: string;
}

interface LearningPath {
  id: number;
  title: string;
  description: string;
  mood: string;
  duration: number;
  difficulty: 'easy' | 'medium' | 'hard';
  type: 'video' | 'quiz' | 'reading' | 'interactive' | 'game';
  xpReward: number;
  completed: boolean;
  locked: boolean;
  icon: string;
  color: string;
}

interface MoodStats {
  averageMood: number;
  totalSessions: number;
  currentStreak: number;
  bestStreak: number;
  preferredTime: string;
  topMood: string;
}

export default function StudentMoodLearning() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedMood, setSelectedMood] = useState<string>('');
  const [energyLevel, setEnergyLevel] = useState(50);
  const [focusLevel, setFocusLevel] = useState(50);
  const [motivationLevel, setMotivationLevel] = useState(50);
  const [selectedPath, setSelectedPath] = useState<LearningPath | null>(null);

  // Fetch mood stats
  const { data: moodStats } = useQuery<MoodStats>({
    queryKey: ['/api/student/mood/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/mood/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return {
          averageMood: 3,
          totalSessions: 0,
          currentStreak: 0,
          bestStreak: 0,
          preferredTime: 'morning',
          topMood: 'happy'
        };
      }
      return response.json();
    }
  });

  // Fetch learning paths
  const { data: learningPaths = [] } = useQuery<LearningPath[]>({
    queryKey: ['/api/student/mood/paths', selectedMood],
    queryFn: async () => {
      const response = await fetch(`/api/student/mood/paths?mood=${selectedMood}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedMood
  });

  // Submit mood mutation
  const submitMoodMutation = useMutation({
    mutationFn: async (moodData: MoodData) => {
      const response = await fetch('/api/student/mood/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify(moodData)
      });
      if (!response.ok) throw new Error('Failed to submit mood');
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: t('student:moodRecorded', 'Mood Recorded'),
        description: t('student:personalizedContent', 'Personalized content is ready for you'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/mood/stats'] });
      queryClient.invalidateQueries({ queryKey: ['/api/student/mood/paths'] });
    }
  });

  // Start learning path mutation
  const startPathMutation = useMutation({
    mutationFn: async (pathId: number) => {
      const response = await fetch(`/api/student/mood/paths/${pathId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to start path');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('student:pathStarted', 'Learning Path Started'),
        description: t('student:enjoyLearning', 'Enjoy your personalized learning experience'),
      });
      // Navigate to the learning content
      window.location.href = data.contentUrl;
    }
  });

  const moods = [
    { value: 'happy', emoji: '😊', label: t('student:happy', 'Happy'), color: 'from-yellow-400 to-orange-400' },
    { value: 'excited', emoji: '🤩', label: t('student:excited', 'Excited'), color: 'from-pink-400 to-purple-400' },
    { value: 'neutral', emoji: '😐', label: t('student:neutral', 'Neutral'), color: 'from-gray-400 to-blue-400' },
    { value: 'tired', emoji: '😴', label: t('student:tired', 'Tired'), color: 'from-blue-400 to-indigo-400' },
    { value: 'stressed', emoji: '😰', label: t('student:stressed', 'Stressed'), color: 'from-red-400 to-pink-400' },
    { value: 'sad', emoji: '😢', label: t('student:sad', 'Sad'), color: 'from-indigo-400 to-purple-400' }
  ];

  const getPathIcon = (type: string) => {
    switch (type) {
      case 'video': return <Video className="w-5 h-5" />;
      case 'quiz': return <Target className="w-5 h-5" />;
      case 'reading': return <BookOpen className="w-5 h-5" />;
      case 'interactive': return <Sparkles className="w-5 h-5" />;
      case 'game': return <Trophy className="w-5 h-5" />;
      default: return <Zap className="w-5 h-5" />;
    }
  };

  const handleMoodSubmit = () => {
    if (!selectedMood) {
      toast({
        title: t('student:selectMood', 'Select Your Mood'),
        description: t('student:pleaseSelectMood', 'Please select how you\'re feeling'),
        variant: 'destructive'
      });
      return;
    }

    submitMoodMutation.mutate({
      mood: selectedMood as any,
      energy: energyLevel,
      focus: focusLevel,
      motivation: motivationLevel,
      timestamp: new Date().toISOString()
    });
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
            <h1 className="text-white font-bold text-xl">{t('student:moodLearning', 'Mood Learning')}</h1>
            <Badge className="bg-white/20 text-white border-white/30">
              <Trophy className="w-3 h-3 mr-1" />
              {moodStats?.currentStreak || 0} {t('student:dayStreak', 'day streak')}
            </Badge>
          </div>

          {/* Stats Overview */}
          <motion.div 
            className="grid grid-cols-3 gap-3"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
          >
            <div className="glass-card p-3 text-center">
              <BarChart className="w-5 h-5 text-white/70 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{moodStats?.totalSessions || 0}</p>
              <p className="text-white/60 text-xs">{t('student:sessions', 'Sessions')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Award className="w-5 h-5 text-yellow-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold">{moodStats?.bestStreak || 0}</p>
              <p className="text-white/60 text-xs">{t('student:bestStreak', 'Best Streak')}</p>
            </div>
            <div className="glass-card p-3 text-center">
              <Heart className="w-5 h-5 text-red-400 mx-auto mb-1" />
              <p className="text-white text-xl font-bold capitalize">{moodStats?.topMood || 'Happy'}</p>
              <p className="text-white/60 text-xs">{t('student:topMood', 'Top Mood')}</p>
            </div>
          </motion.div>
        </motion.header>

        {/* Main Content */}
        <div className="mobile-content">
          {!selectedMood ? (
            // Mood Selection
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6"
            >
              <div className="text-center mb-6">
                <h2 className="text-white text-2xl font-bold mb-2">
                  {t('student:howFeeling', 'How are you feeling today?')}
                </h2>
                <p className="text-white/70">
                  {t('student:moodHelps', 'Your mood helps us personalize your learning')}
                </p>
              </div>

              {/* Mood Grid */}
              <div className="grid grid-cols-3 gap-4">
                {moods.map((mood, index) => (
                  <motion.button
                    key={mood.value}
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setSelectedMood(mood.value)}
                    className={`glass-card p-4 text-center ${
                      selectedMood === mood.value ? 'ring-2 ring-white' : ''
                    }`}
                  >
                    <div className={`text-4xl mb-2 bg-gradient-to-br ${mood.color} bg-clip-text`}>
                      {mood.emoji}
                    </div>
                    <p className="text-white text-sm font-medium">{mood.label}</p>
                  </motion.button>
                ))}
              </div>

              {/* Energy, Focus, Motivation Sliders */}
              <div className="space-y-4">
                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Zap className="w-5 h-5 text-yellow-400" />
                      <span className="text-white font-medium">{t('student:energy', 'Energy')}</span>
                    </div>
                    <span className="text-white/70">{energyLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={energyLevel}
                    onChange={(e) => setEnergyLevel(Number(e.target.value))}
                    className="w-full accent-yellow-400"
                  />
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <Target className="w-5 h-5 text-blue-400" />
                      <span className="text-white font-medium">{t('student:focus', 'Focus')}</span>
                    </div>
                    <span className="text-white/70">{focusLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={focusLevel}
                    onChange={(e) => setFocusLevel(Number(e.target.value))}
                    className="w-full accent-blue-400"
                  />
                </div>

                <div className="glass-card p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="w-5 h-5 text-green-400" />
                      <span className="text-white font-medium">{t('student:motivation', 'Motivation')}</span>
                    </div>
                    <span className="text-white/70">{motivationLevel}%</span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="100"
                    value={motivationLevel}
                    onChange={(e) => setMotivationLevel(Number(e.target.value))}
                    className="w-full accent-green-400"
                  />
                </div>
              </div>

              {/* Submit Button */}
              <Button
                onClick={handleMoodSubmit}
                disabled={!selectedMood || submitMoodMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-6"
              >
                <Brain className="w-5 h-5 mr-2" />
                {submitMoodMutation.isPending 
                  ? t('student:analyzing', 'Analyzing...') 
                  : t('student:getPersonalized', 'Get Personalized Learning')}
              </Button>
            </motion.div>
          ) : (
            // Learning Paths
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.5 }}
              className="space-y-6 mb-20"
            >
              <div className="text-center mb-6">
                <h2 className="text-white text-xl font-bold mb-2">
                  {t('student:perfectPaths', 'Perfect paths for your mood')}
                </h2>
                <p className="text-white/70 text-sm">
                  {t('student:tailoredContent', 'Content tailored to help you learn better')}
                </p>
              </div>

              {/* Change Mood Button */}
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setSelectedMood('')}
                className="w-full glass-card p-3 flex items-center justify-center gap-2 text-white/70"
              >
                <Meh className="w-5 h-5" />
                {t('student:changeMood', 'Change Mood')}
              </motion.button>

              {/* Learning Paths */}
              <div className="space-y-4">
                {learningPaths.map((path, index) => (
                  <motion.div
                    key={path.id}
                    className={`glass-card p-4 ${path.locked ? 'opacity-60' : 'cursor-pointer'}`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                    whileTap={!path.locked ? { scale: 0.98 } : {}}
                    onClick={() => !path.locked && setSelectedPath(path)}
                  >
                    <div className="flex items-start gap-3">
                      <div className={`p-3 rounded-lg bg-gradient-to-br ${path.color || 'from-purple-400 to-pink-400'}`}>
                        {getPathIcon(path.type)}
                      </div>
                      
                      <div className="flex-1">
                        <div className="flex items-center justify-between mb-1">
                          <h3 className="text-white font-semibold">{path.title}</h3>
                          {path.locked ? (
                            <Lock className="w-4 h-4 text-white/50" />
                          ) : path.completed ? (
                            <CheckCircle className="w-4 h-4 text-green-400" />
                          ) : (
                            <ChevronRight className="w-4 h-4 text-white/50" />
                          )}
                        </div>
                        
                        <p className="text-white/60 text-sm mb-2">{path.description}</p>
                        
                        <div className="flex items-center gap-3 text-white/50 text-xs">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            {path.duration} min
                          </span>
                          <Badge className={`text-xs ${
                            path.difficulty === 'easy' ? 'bg-green-500/20 text-green-300' :
                            path.difficulty === 'medium' ? 'bg-yellow-500/20 text-yellow-300' :
                            'bg-red-500/20 text-red-300'
                          }`}>
                            {path.difficulty}
                          </Badge>
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 text-yellow-400" />
                            +{path.xpReward} XP
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </div>
      </div>

      {/* Path Detail Modal */}
      <AnimatePresence>
        {selectedPath && (
          <motion.div
            className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-end"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setSelectedPath(null)}
          >
            <motion.div
              className="bg-white rounded-t-3xl w-full p-6"
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">{selectedPath.title}</h2>
                <button
                  onClick={() => setSelectedPath(null)}
                  className="p-2 rounded-full hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <p className="text-gray-600 mb-4">{selectedPath.description}</p>

              <div className="grid grid-cols-3 gap-3 mb-4">
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <Clock className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium">{selectedPath.duration} min</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <Target className="w-5 h-5 text-gray-600 mx-auto mb-1" />
                  <p className="text-sm font-medium capitalize">{selectedPath.difficulty}</p>
                </div>
                <div className="bg-gray-50 p-3 rounded-lg text-center">
                  <Star className="w-5 h-5 text-yellow-500 mx-auto mb-1" />
                  <p className="text-sm font-medium">+{selectedPath.xpReward} XP</p>
                </div>
              </div>

              <Button
                onClick={() => startPathMutation.mutate(selectedPath.id)}
                disabled={startPathMutation.isPending}
                className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
              >
                {startPathMutation.isPending 
                  ? t('student:starting', 'Starting...') 
                  : t('student:startLearning', 'Start Learning')}
              </Button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}