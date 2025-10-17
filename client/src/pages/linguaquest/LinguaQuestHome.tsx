import { useState, useEffect } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { 
  Play, 
  Trophy, 
  Target, 
  Users, 
  BookOpen, 
  Mic,
  Star,
  ArrowRight,
  Globe,
  Sparkles,
  Crown,
  Zap
} from "lucide-react";
import { guestProgress, type GuestProgressData } from "@/lib/guest-progress";
import { LanguageSwitcher } from "@/components/language-switcher";

interface LessonPreview {
  id: number;
  title: string;
  description: string;
  difficulty: string;
  lessonType: string;
  estimatedDurationMinutes: number;
  xpReward: number;
  isCompleted: boolean;
  isLocked: boolean;
}

/**
 * LinguaQuest Home Page - Free Learning Platform
 * Distinct branding from Meta Lingua with gamified interface
 */
export function LinguaQuestHome() {
  const { t } = useTranslation('linguaquest');
  const [progress, setProgress] = useState<GuestProgressData | null>(null);
  const [recommendedLessons, setRecommendedLessons] = useState<LessonPreview[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showUpgradePrompt, setShowUpgradePrompt] = useState(false);

  useEffect(() => {
    initializeLinguaQuest();
  }, []);

  const initializeLinguaQuest = async () => {
    try {
      // Initialize guest session
      await guestProgress.initializeSession();
      
      // Get progress data
      const progressData = guestProgress.getProgress();
      setProgress(progressData);

      // Get recommended lessons
      const lessons = await guestProgress.getRecommendedLessons();
      setRecommendedLessons(lessons.map((lesson, index) => ({
        ...lesson,
        isCompleted: progressData?.completedLessons.includes(lesson.id) || false,
        isLocked: index > (progressData?.currentLevel || 1) + 2 // Lock lessons beyond current level
      })));

      // Check if should show upgrade prompt
      if (progressData && progressData.completedLessons.length >= 3) {
        setShowUpgradePrompt(true);
      }

      // Track discovery event
      await guestProgress.trackEvent('discovery', 'home_visited');
    } catch (error) {
      console.error('Error initializing LinguaQuest:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpgradeClick = () => {
    guestProgress.recordUpgradePrompt('hero_banner', 'home_page');
    guestProgress.trackEvent('consideration', 'upgrade_clicked', { source: 'hero_banner' });
    // Navigate to Meta Lingua signup with progress transfer
    window.location.href = '/signup?source=linguaquest&transfer=true';
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600 mx-auto mb-4"></div>
          <p className="text-emerald-700 dark:text-emerald-300">{t('branding.loadingMessage')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* LinguaQuest Header */}
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* LinguaQuest Branding */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Globe className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t('branding.title')}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">{t('branding.tagline')}</p>
              </div>
            </div>

            {/* User Progress & Upgrade */}
            <div className="flex items-center space-x-4">
              {progress && (
                <>
                  <div className="hidden sm:flex items-center space-x-3">
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        {t('userProgress.level', { level: progress.currentLevel })}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {progress.totalXp} XP
                      </p>
                    </div>
                    <Avatar className="h-8 w-8 border-2 border-emerald-500">
                      <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                        L{progress.currentLevel}
                      </AvatarFallback>
                    </Avatar>
                  </div>
                  <Link href="/linguaquest/dashboard">
                    <Button 
                      variant="outline"
                      size="sm"
                      className="hidden lg:flex border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-900/20"
                      data-testid="button-view-dashboard"
                    >
                      <Trophy className="w-4 h-4 mr-2" />
                      {t('navigation.dashboard')}
                    </Button>
                  </Link>
                </>
              )}
              
              <LanguageSwitcher />
              
              <Button 
                onClick={handleUpgradeClick}
                className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                data-testid="button-upgrade-hero"
              >
                <Crown className="w-4 h-4 mr-2" />
                {t('upgrade.buttonText')}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Upgrade Prompt Banner */}
      {showUpgradePrompt && (
        <div className="bg-gradient-to-r from-amber-500 to-orange-500 text-white py-3">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Sparkles className="w-5 h-5" />
                <span className="font-medium">
                  {t('upgrade.bannerMessage')}
                </span>
              </div>
              <Button 
                variant="secondary" 
                size="sm"
                onClick={handleUpgradeClick}
                className="bg-white text-orange-600 hover:bg-gray-100"
                data-testid="button-upgrade-banner"
              >
                {t('upgrade.learnMore')}
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 dark:text-white mb-6">
            {t('home.heroTitle')}{" "}
            <span className="bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              {t('home.heroHighlight')}
            </span>
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 mb-8 max-w-3xl mx-auto">
            {t('home.heroDescription')}
          </p>
          
          {progress && (
            <div className="inline-flex items-center space-x-6 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                <div className="text-2xl font-bold text-emerald-600">{progress.completedLessons.length}</div>
                <div className="text-sm text-gray-500">{t('home.stats.lessons')}</div>
              </div>
              <div className="h-12 w-px bg-gray-200 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-teal-600">{progress.currentStreak}</div>
                <div className="text-sm text-gray-500">{t('home.stats.dayStreak')}</div>
              </div>
              <div className="h-12 w-px bg-gray-200 dark:bg-gray-600"></div>
              <div className="text-center">
                <div className="text-2xl font-bold text-cyan-600">{progress.totalXp}</div>
                <div className="text-sm text-gray-500">{t('home.stats.totalXP')}</div>
              </div>
            </div>
          )}
        </div>

        {/* Featured Lessons */}
        <section className="mb-12">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white">
              {t('lessons.recommendedForYou')}
            </h2>
            <Badge variant="secondary" className="bg-emerald-100 text-emerald-800">
              {t('lessons.personalized')}
            </Badge>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recommendedLessons.slice(0, 6).map((lesson) => (
              <Card 
                key={lesson.id} 
                className={`group hover:shadow-xl transition-all duration-300 ${
                  lesson.isLocked 
                    ? 'opacity-60 cursor-not-allowed' 
                    : 'hover:scale-105 cursor-pointer'
                }`}
              >
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <Badge 
                      variant={lesson.difficulty === 'beginner' ? 'default' : 'secondary'}
                      className={`${
                        lesson.difficulty === 'beginner' 
                          ? 'bg-green-100 text-green-800' 
                          : lesson.difficulty === 'intermediate'
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}
                    >
                      {t(`lessons.difficulty.${lesson.difficulty}`)}
                    </Badge>
                    {lesson.isCompleted && (
                      <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
                        <Star className="w-4 h-4 text-white" />
                      </div>
                    )}
                    {lesson.isLocked && (
                      <div className="w-6 h-6 bg-gray-400 rounded-full flex items-center justify-center">
                        <Crown className="w-4 h-4 text-white" />
                      </div>
                    )}
                  </div>
                  <CardTitle className="text-xl group-hover:text-emerald-600 transition-colors">
                    {lesson.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                    {lesson.description}
                  </p>
                  
                  <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400 mb-4">
                    <div className="flex items-center space-x-1">
                      <BookOpen className="w-4 h-4" />
                      <span>{lesson.lessonType}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Zap className="w-4 h-4" />
                      <span>{lesson.xpReward} XP</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      {lesson.estimatedDurationMinutes} min
                    </span>
                    
                    {!lesson.isLocked ? (
                      <Link href={`/linguaquest/lesson/${lesson.id}`}>
                        <Button 
                          size="sm" 
                          className="bg-emerald-600 hover:bg-emerald-700"
                          data-testid={`button-start-lesson-${lesson.id}`}
                        >
                          <Play className="w-4 h-4 mr-1" />
                          {lesson.isCompleted ? t('lessons.replay') : t('lessons.start')}
                        </Button>
                      </Link>
                    ) : (
                      <Button 
                        size="sm" 
                        variant="outline" 
                        disabled
                        data-testid={`button-locked-lesson-${lesson.id}`}
                      >
                        {t('lessons.locked')}
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>

        {/* Features Section */}
        <section className="mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-8 text-center">
            {t('home.whyChoose')}
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-emerald-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Globe className="w-6 h-6 text-emerald-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('home.features.interactive3D')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('home.features.interactive3DDesc')}
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-teal-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Mic className="w-6 h-6 text-teal-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('home.features.voicePractice')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('home.features.voicePracticeDesc')}
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-cyan-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Trophy className="w-6 h-6 text-cyan-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('home.features.achievements')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('home.features.achievementsDesc')}
              </p>
            </Card>

            <Card className="text-center p-6 hover:shadow-lg transition-shadow">
              <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Users className="w-6 h-6 text-purple-600" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">{t('home.features.noRegistration')}</h3>
              <p className="text-gray-600 dark:text-gray-300 text-sm">
                {t('home.features.noRegistrationDesc')}
              </p>
            </Card>
          </div>
        </section>

        {/* Progress Upgrade CTA */}
        {progress && progress.completedLessons.length >= 2 && (
          <section className="mb-12">
            <Card className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 border-amber-200">
              <CardContent className="p-8">
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                      Ready for Advanced Learning?
                    </h3>
                    <p className="text-gray-600 dark:text-gray-300 mb-4">
                      You've completed {progress.completedLessons.length} lessons! 
                      Unlock personalized tutoring, advanced grammar, and certification with Meta Lingua Pro.
                    </p>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-800">
                        ✨ Transfer your progress
                      </Badge>
                      <Badge className="bg-blue-100 text-blue-800">
                        🎯 Personalized curriculum
                      </Badge>
                      <Badge className="bg-purple-100 text-purple-800">
                        🏆 Official certificates
                      </Badge>
                    </div>
                  </div>
                  <div className="ml-8">
                    <Button 
                      size="lg"
                      onClick={handleUpgradeClick}
                      className="bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white shadow-lg"
                      data-testid="button-upgrade-cta"
                    >
                      <Crown className="w-5 h-5 mr-2" />
                      {t('upgrade.upgradeNow')}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </section>
        )}

        {/* Quick Stats */}
        {progress && (
          <section className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-4">
              Your Learning Journey
            </h3>
            <div className="inline-flex items-center space-x-8 bg-white dark:bg-gray-800 rounded-2xl p-6 shadow-lg">
              <div className="text-center">
                <div className="text-lg font-bold text-emerald-600">Level {progress.currentLevel}</div>
                <div className="text-sm text-gray-500">Current Level</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-teal-600">{progress.totalStudyTimeMinutes} min</div>
                <div className="text-sm text-gray-500">Study Time</div>
              </div>
              <div className="text-center">
                <div className="text-lg font-bold text-cyan-600">{progress.achievements.filter(a => a.isUnlocked).length}</div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
            </div>
          </section>
        )}
      </main>
    </div>
  );
}