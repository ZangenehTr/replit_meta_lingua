import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Trophy,
  Star,
  Target,
  Award,
  Medal,
  Crown,
  Zap,
  Flame,
  Shield,
  Gift,
  Lock,
  CheckCircle,
  TrendingUp,
  Users
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import '@/styles/mobile-app.css';

interface Achievement {
  id: number;
  title: string;
  description: string;
  category: 'learning' | 'social' | 'streak' | 'completion' | 'special';
  icon: string;
  progress: number;
  maxProgress: number;
  xpReward: number;
  unlocked: boolean;
  unlockedAt?: string;
  tier: 'bronze' | 'silver' | 'gold' | 'platinum';
}

interface Stats {
  totalAchievements: number;
  unlockedAchievements: number;
  totalXP: number;
  currentRank: string;
  nextRankXP: number;
  globalRanking?: number;
}

export default function StudentAchievementsMobile() {
  const { t } = useTranslation();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  // Fetch achievements
  const { data: achievements = [], isLoading } = useQuery<Achievement[]>({
    queryKey: ['/api/student/achievements'],
    queryFn: async () => {
      const response = await fetch('/api/student/achievements', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch achievements');
      return response.json();
    }
  });

  // Fetch stats
  const { data: stats } = useQuery<Stats>({
    queryKey: ['/api/student/achievement-stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/achievement-stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch stats');
      return response.json();
    }
  });

  const getAchievementIcon = (icon: string) => {
    const icons: any = {
      trophy: Trophy,
      star: Star,
      target: Target,
      award: Award,
      medal: Medal,
      crown: Crown,
      zap: Zap,
      flame: Flame,
      shield: Shield,
      gift: Gift
    };
    const IconComponent = icons[icon] || Trophy;
    return IconComponent;
  };

  const getTierColor = (tier: string) => {
    switch (tier) {
      case 'bronze': return 'from-orange-600 to-orange-400';
      case 'silver': return 'from-gray-500 to-gray-300';
      case 'gold': return 'from-yellow-500 to-yellow-300';
      case 'platinum': return 'from-purple-600 to-purple-400';
      default: return 'from-gray-600 to-gray-400';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'learning': return 'bg-blue-500/20 text-blue-300';
      case 'social': return 'bg-green-500/20 text-green-300';
      case 'streak': return 'bg-orange-500/20 text-orange-300';
      case 'completion': return 'bg-purple-500/20 text-purple-300';
      case 'special': return 'bg-pink-500/20 text-pink-300';
      default: return 'bg-gray-500/20 text-gray-300';
    }
  };

  const categories = [
    { id: 'all', label: t('common:all') },
    { id: 'learning', label: t('student:achievements.learning') },
    { id: 'social', label: t('student:achievements.social') },
    { id: 'streak', label: t('student:achievements.streak') },
    { id: 'completion', label: t('student:achievements.completion') },
    { id: 'special', label: t('student:achievements.special') }
  ];

  const filteredAchievements = selectedCategory === 'all' 
    ? achievements 
    : achievements.filter(a => a.category === selectedCategory);

  const progressPercentage = stats 
    ? (stats.unlockedAchievements / Math.max(stats.totalAchievements, 1)) * 100 
    : 0;

  return (
    <MobileLayout
      title={t('student:achievements')}
      showBack={false}
      gradient="achievement"
    >
      {/* Stats Overview */}
      <motion.div
        className="relative overflow-hidden rounded-2xl p-6 mb-6 bg-gradient-to-br from-yellow-500 to-orange-500"
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
      >
        <div className="absolute inset-0 bg-black/10" />
        <div className="relative z-10">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-white/70 text-sm mb-1">{t('student:currentRank')}</p>
              <h2 className="text-white text-2xl font-bold">
                {stats?.currentRank || 'Beginner'}
              </h2>
            </div>
            <Trophy className="w-12 h-12 text-white/30" />
          </div>

          <div className="mb-4">
            <div className="flex justify-between text-sm mb-2">
              <span className="text-white/70">{t('student:progress')}</span>
              <span className="text-white">
                {stats?.unlockedAchievements || 0}/{stats?.totalAchievements || 0}
              </span>
            </div>
            <div className="h-2 bg-white/20 rounded-full overflow-hidden">
              <motion.div
                className="h-full bg-white"
                initial={{ width: 0 }}
                animate={{ width: `${progressPercentage}%` }}
                transition={{ duration: 1, delay: 0.5 }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="text-center">
              <p className="text-white/60 text-xs">{t('student:totalXP')}</p>
              <p className="text-white font-bold text-lg">{stats?.totalXP || 0}</p>
            </div>
            <div className="text-center">
              <p className="text-white/60 text-xs">{t('student:unlocked')}</p>
              <p className="text-white font-bold text-lg">
                {stats?.unlockedAchievements || 0}
              </p>
            </div>
            {stats?.globalRanking && (
              <div className="text-center">
                <p className="text-white/60 text-xs">{t('student:globalRank')}</p>
                <p className="text-white font-bold text-lg">#{stats.globalRanking}</p>
              </div>
            )}
          </div>
        </div>
      </motion.div>

      {/* Category Filter */}
      <motion.div 
        className="flex gap-2 mb-6 overflow-x-auto pb-2"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {categories.map((category) => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`
              px-4 py-2 rounded-xl whitespace-nowrap transition-all
              ${selectedCategory === category.id 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {category.label}
          </button>
        ))}
      </motion.div>

      {/* Achievements Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="w-12 h-12 bg-white/20 rounded-full mx-auto mb-2" />
              <div className="h-3 bg-white/20 rounded mx-auto w-3/4" />
            </div>
          ))}
        </div>
      ) : filteredAchievements.length === 0 ? (
        <MobileCard className="text-center py-12">
          <Trophy className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noAchievements')}</p>
        </MobileCard>
      ) : (
        <div className="grid grid-cols-2 gap-4">
          {filteredAchievements.map((achievement, index) => {
            const Icon = getAchievementIcon(achievement.icon);
            return (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
              >
                <MobileCard 
                  className={`
                    relative text-center p-4
                    ${!achievement.unlocked ? 'opacity-60' : ''}
                  `}
                >
                  {/* Lock Overlay */}
                  {!achievement.unlocked && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/30 rounded-xl">
                      <Lock className="w-8 h-8 text-white/50" />
                    </div>
                  )}

                  {/* Icon */}
                  <div className={`
                    w-16 h-16 mx-auto mb-3 rounded-full 
                    bg-gradient-to-br ${getTierColor(achievement.tier)}
                    flex items-center justify-center
                  `}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-white font-medium text-sm mb-1 line-clamp-1">
                    {achievement.title}
                  </h3>

                  {/* Category Badge */}
                  <Badge className={`${getCategoryColor(achievement.category)} border-0 text-xs mb-2`}>
                    {t(`student:achievements.${achievement.category}`)}
                  </Badge>

                  {/* Progress or XP */}
                  {achievement.unlocked ? (
                    <div className="flex items-center justify-center gap-1">
                      <CheckCircle className="w-4 h-4 text-green-400" />
                      <span className="text-green-400 text-xs font-medium">
                        +{achievement.xpReward} XP
                      </span>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      <Progress 
                        value={(achievement.progress / achievement.maxProgress) * 100} 
                        className="h-1"
                      />
                      <p className="text-white/50 text-xs">
                        {achievement.progress}/{achievement.maxProgress}
                      </p>
                    </div>
                  )}

                  {/* Description (on hover/tap) */}
                  <p className="text-white/60 text-xs mt-2 line-clamp-2">
                    {achievement.description}
                  </p>
                </MobileCard>
              </motion.div>
            );
          })}
        </div>
      )}

      {/* Leaderboard Button */}
      <motion.button
        className="w-full glass-card p-4 mt-6 mb-20 flex items-center justify-between"
        whileTap={{ scale: 0.98 }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.3 }}
      >
        <div className="flex items-center gap-3">
          <Users className="w-6 h-6 text-purple-400" />
          <span className="text-white font-medium">{t('student:viewLeaderboard')}</span>
        </div>
        <TrendingUp className="w-5 h-5 text-white/50" />
      </motion.button>
    </MobileLayout>
  );
}