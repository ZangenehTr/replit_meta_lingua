import { motion } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { Trophy, TrendingUp, Target, Sparkles, ChevronLeft, ArrowLeft } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';

interface CurriculumLevel {
  id: number;
  code: string;
  name: string;
  orderIndex: number;
  cefrBand?: string;
  curriculum: {
    id: number;
    name: string;
    key: string;
    language: string;
  };
}

interface NextLevel {
  id: number;
  code: string;
  name: string;
  orderIndex: number;
  cefrBand?: string;
}

interface StudentLevelBannerProps {
  currentLevel: CurriculumLevel | null;
  progressPercentage: number;
  nextLevel?: NextLevel | null;
  status: string;
  className?: string;
  showProgress?: boolean;
  variant?: 'default' | 'compact' | 'detailed';
}

export function StudentLevelBanner({
  currentLevel,
  progressPercentage = 0,
  nextLevel,
  status,
  className,
  showProgress = true,
  variant = 'default'
}: StudentLevelBannerProps) {
  const { t, i18n } = useTranslation();
  const isRTL = i18n.language === 'fa';

  // If no current level assigned
  if (!currentLevel || status === 'unassigned') {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={cn(
          "relative overflow-hidden rounded-2xl p-6",
          "bg-gradient-to-r from-orange-500/20 to-red-500/20",
          "border border-orange-500/30 backdrop-blur-sm",
          isRTL && "rtl",
          className
        )}
        data-testid="student-level-banner-unassigned"
      >
        {/* Background Pattern */}
        <div className="absolute inset-0 bg-gradient-to-br from-orange-500/10 to-red-500/5" />
        <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-yellow-400/20 to-orange-500/20 blur-xl" />
        
        <div className="relative z-10 text-center">
          <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center">
            <Target className="w-8 h-8 text-white" />
          </div>
          
          <h3 className="text-white font-bold text-lg mb-2">
            {t('student:levelAssessmentNeeded', 'تعیین سطح نیاز است')}
          </h3>
          
          <p className="text-white/80 text-sm">
            {t('student:contactAdminForLevelAssignment', 'برای تعیین سطح با مدیر ارتباط برقرار کنید')}
          </p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "relative overflow-hidden rounded-2xl",
        "bg-gradient-to-r from-blue-500/20 to-purple-500/20",
        "border border-blue-500/30 backdrop-blur-sm",
        variant === 'compact' ? 'p-4' : 'p-6',
        isRTL && "rtl",
        className
      )}
      data-testid="student-level-banner"
    >
      {/* Background Pattern */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/5" />
      <div className="absolute top-0 right-0 w-32 h-32 rounded-full bg-gradient-to-br from-blue-400/20 to-purple-500/20 blur-xl" />
      
      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Trophy className="w-6 h-6 text-white" />
            </div>
            
            <div>
              <h3 className="text-white font-bold text-base mb-1">
                {t('student:yourLevel', 'سطح شما')}
              </h3>
              
              <div className="flex items-center gap-2">
                <span className="text-white text-lg font-bold" data-testid="text-current-level">
                  {currentLevel.name}
                </span>
                
                {currentLevel.cefrBand && (
                  <Badge 
                    variant="secondary" 
                    className="bg-white/20 text-white border-white/30 text-xs"
                    data-testid="badge-cefr-band"
                  >
                    {currentLevel.cefrBand}
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Sparkles Animation */}
          <motion.div
            animate={{ rotate: 360 }}
            transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
          >
            <Sparkles className="w-6 h-6 text-yellow-400" />
          </motion.div>
        </div>

        {/* Curriculum Track */}
        <div className="mb-4">
          <p className="text-white/70 text-sm mb-1">
            {t('student:curriculumTrack', 'مسیر آموزشی')}
          </p>
          <p className="text-white font-medium text-sm" data-testid="text-curriculum-name">
            {currentLevel.curriculum.name}
          </p>
        </div>

        {/* Progress Section */}
        {showProgress && variant !== 'compact' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-white/70 text-sm">
                {t('student:progress', 'پیشرفت')}
              </span>
              <span className="text-white font-bold text-sm" data-testid="text-progress-percentage">
                {progressPercentage}% {t('student:complete', 'مکمل')}
              </span>
            </div>
            
            <Progress 
              value={progressPercentage} 
              className="h-2 bg-white/20" 
              data-testid="progress-bar"
            />

            {/* Next Level Info */}
            {nextLevel && (
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2 text-white/80 text-sm">
                  <TrendingUp className="w-4 h-4" />
                  <span>{t('student:nextLevel', 'سطح بعدی')}</span>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-white/90 text-sm font-medium" data-testid="text-next-level">
                    {nextLevel.name}
                  </span>
                  {isRTL ? (
                    <ArrowLeft className="w-4 h-4 text-white/60" />
                  ) : (
                    <ChevronLeft className="w-4 h-4 text-white/60 rotate-180" />
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Compact Progress */}
        {showProgress && variant === 'compact' && (
          <div className="mt-3">
            <div className="flex items-center justify-between mb-1">
              <span className="text-white/70 text-xs">
                {t('student:progress', 'پیشرفت')}
              </span>
              <span className="text-white text-xs font-bold">
                {progressPercentage}%
              </span>
            </div>
            <Progress value={progressPercentage} className="h-1.5 bg-white/20" />
          </div>
        )}

        {/* Detailed Variant Additional Info */}
        {variant === 'detailed' && (
          <div className="mt-4 pt-4 border-t border-white/20">
            <div className="grid grid-cols-2 gap-4 text-center">
              <div>
                <p className="text-white/70 text-xs mb-1">
                  {t('student:levelCode', 'کد سطح')}
                </p>
                <p className="text-white font-bold text-sm" data-testid="text-level-code">
                  {currentLevel.code}
                </p>
              </div>
              
              <div>
                <p className="text-white/70 text-xs mb-1">
                  {t('student:orderInTrack', 'ترتیب در مسیر')}
                </p>
                <p className="text-white font-bold text-sm">
                  {currentLevel.orderIndex}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </motion.div>
  );
}