import { useState, useEffect } from "react";
import { useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { 
  ArrowLeft, 
  Trophy, 
  Star, 
  Crown,
  CheckCircle,
  XCircle,
  Mic,
  Volume2,
  RotateCcw,
  Sparkles,
  ChevronLeft,
  ChevronRight
} from "lucide-react";
import { Three3DLesson } from "@/components/3d-lessons/Three3DLesson";
import { GameStepRenderer } from "@/components/linguaquest/GameStepRenderer";
import { guestProgress, type GuestProgressData } from "@/lib/guest-progress";
import { LanguageSwitcher } from "@/components/language-switcher";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { motion, AnimatePresence, useMotionValue, useTransform } from "framer-motion";

interface LessonData {
  id: number;
  title: string;
  description: string;
  language: string;
  difficulty: string;
  lessonType: 'vocabulary' | 'grammar' | 'conversation' | 'listening' | 'pronunciation';
  sceneType: string;
  vocabularyWords?: string[];
  grammarTopics?: string[];
  exampleSentences?: string[];
  estimatedDurationMinutes: number;
  xpReward: number;
  threeDContent?: any;
}

/**
 * LinguaQuest Lesson Page - 3D Interactive Learning Experience
 */
export function LinguaQuestLesson() {
  const { lessonId } = useParams();
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [lesson, setLesson] = useState<LessonData | null>(null);
  const [progress, setProgress] = useState<GuestProgressData | null>(null);
  const [lessonProgress, setLessonProgress] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleted, setIsCompleted] = useState(false);
  const [completionData, setCompletionData] = useState<any>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [gameSteps, setGameSteps] = useState<any[]>([]);
  const [stepScores, setStepScores] = useState<Record<number, number>>({});
  const [totalScore, setTotalScore] = useState(0);
  const [stepKey, setStepKey] = useState(0); // Force re-render for retry

  useEffect(() => {
    loadLesson();
    checkMobileDevice();
  }, [lessonId]);

  const checkMobileDevice = () => {
    const isMobileDevice = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
    setIsMobile(isMobileDevice);
  };

  const loadLesson = async () => {
    try {
      if (!lessonId) {
        setLocation("/linguaquest");
        return;
      }

      // Load lesson data
      const response = await fetch(`/api/linguaquest/lessons/${lessonId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to load lesson');
      }

      setLesson(result.lesson);

      // Extract game steps from interaction_config
      if (result.lesson.interactionConfig?.gameSteps) {
        setGameSteps(result.lesson.interactionConfig.gameSteps);
      }

      // Load guest progress
      const progressData = guestProgress.getProgress();
      setProgress(progressData);

      // Check if lesson already completed
      if (progressData?.completedLessons.includes(parseInt(lessonId))) {
        setIsCompleted(true);
      }

      // Track lesson start event
      await guestProgress.trackEvent('engagement', 'lesson_started', { 
        lessonId: parseInt(lessonId),
        lessonType: result.lesson.lessonType 
      });

    } catch (error) {
      console.error('Error loading lesson:', error);
      toast({
        title: "Error",
        description: "Failed to load lesson. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonProgress = (progress: number) => {
    setLessonProgress(progress);
    
    // Track milestone events
    if (progress === 50) {
      guestProgress.trackEvent('engagement', 'lesson_half_complete', { 
        lessonId: parseInt(lessonId!) 
      });
    }
  };

  const handleLessonComplete = async (timeSpent: number) => {
    try {
      if (!lesson) return;

      // Complete lesson through guest progress
      const result = await guestProgress.completeLesson(
        lesson.id, 
        timeSpent, 
        lesson.xpReward
      );

      setCompletionData(result);
      setIsCompleted(true);
      setLessonProgress(100);

      // Show completion toast
      toast({
        title: "🎉 Lesson Completed!",
        description: `You earned ${lesson.xpReward} XP! ${result.levelUp ? 'Level up!' : ''}`,
        duration: 5000
      });

      // Track completion event
      await guestProgress.trackEvent('engagement', 'lesson_completed', { 
        lessonId: lesson.id,
        timeSpent,
        xpEarned: lesson.xpReward,
        levelUp: result.levelUp
      });

      // Show upgrade prompt if applicable
      if (result.shouldShowUpgradePrompt) {
        setTimeout(() => {
          showUpgradePrompt();
        }, 2000);
      }

    } catch (error) {
      console.error('Error completing lesson:', error);
      toast({
        title: "Error",
        description: "Failed to save lesson progress. Please try again.",
        variant: "destructive"
      });
    }
  };

  const handleInteraction = (pointId: string) => {
    // Track interaction with lesson elements
    guestProgress.trackEvent('engagement', 'lesson_interaction', { 
      lessonId: parseInt(lessonId!),
      interactionId: pointId 
    });
  };

  const showUpgradePrompt = () => {
    // Record upgrade prompt shown
    guestProgress.recordUpgradePrompt('completion_modal', 'lesson_end');
    
    toast({
      title: "🚀 Ready for More?",
      description: "Unlock advanced lessons and personalized tutoring with Meta Lingua Pro!",
      duration: 8000,
      action: (
        <Button 
          size="sm" 
          onClick={() => window.location.href = '/signup?source=linguaquest&lesson_completed=true'}
          className="bg-amber-500 hover:bg-amber-600"
        >
          Upgrade Now
        </Button>
      )
    });
  };

  const handleReturnHome = () => {
    setLocation("/linguaquest");
  };

  const handleRetryLesson = () => {
    // Reset ALL state for clean retry
    setIsCompleted(false);
    setLessonProgress(0);
    setCompletionData(null);
    setCurrentStepIndex(0);
    setStepScores({});
    setTotalScore(0);
    setStepKey(prev => prev + 1); // Force GameStepRenderer re-mount
    
    // Track retry event
    guestProgress.trackEvent('engagement', 'lesson_retried', { 
      lessonId: parseInt(lessonId!) 
    });
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
        {/* Header Skeleton */}
        <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex items-center justify-between h-16">
              <div className="flex items-center space-x-4">
                <Skeleton className="h-9 w-32" />
                <Skeleton className="hidden sm:block h-10 w-48" />
              </div>
              <Skeleton className="h-8 w-24" />
            </div>
          </div>
        </div>
        
        {/* Content Skeleton */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <Card className="p-6">
            <div className="space-y-6">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-full" />
              <Skeleton className="h-6 w-5/6" />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Skeleton className="h-40 w-full" />
                <Skeleton className="h-40 w-full" />
              </div>
              <Skeleton className="h-12 w-full" />
            </div>
          </Card>
        </div>
      </div>
    );
  }

  if (!lesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <XCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Lesson Not Found
            </h2>
            <p className="text-gray-600 dark:text-gray-300 mb-4">
              The requested lesson could not be loaded.
            </p>
            <Button onClick={handleReturnHome} data-testid="button-return-home">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Return to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      {/* Header */}
      <header className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-4">
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={handleReturnHome}
                data-testid="button-back-home"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                LinguaQuest
              </Button>
              
              <div className="hidden sm:block h-6 w-px bg-gray-300 dark:bg-gray-600"></div>
              
              <div className="hidden sm:block">
                <h1 className="text-lg font-semibold text-gray-900 dark:text-white">
                  {lesson.title}
                </h1>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Badge variant="secondary" className="text-xs">
                    {lesson.difficulty}
                  </Badge>
                  <span>•</span>
                  <span>{lesson.lessonType}</span>
                  <span>•</span>
                  <span>{lesson.estimatedDurationMinutes} min</span>
                </div>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Progress indicator */}
              <div className="hidden sm:flex items-center space-x-3">
                <div className="text-right text-sm">
                  <div className="text-gray-900 dark:text-white font-medium">
                    {Math.round(lessonProgress)}%
                  </div>
                  <div className="text-gray-500 text-xs">Progress</div>
                </div>
                <div className="w-20">
                  <Progress value={lessonProgress} className="h-2" />
                </div>
              </div>
              
              <LanguageSwitcher />

              {progress && (
                <div className="flex items-center space-x-2">
                  <Avatar className="h-8 w-8 border-2 border-emerald-500">
                    <AvatarFallback className="bg-emerald-100 text-emerald-700 text-sm">
                      L{progress.currentLevel}
                    </AvatarFallback>
                  </Avatar>
                  <div className="hidden sm:block text-sm">
                    <div className="text-gray-900 dark:text-white font-medium">
                      {progress.totalXp} XP
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="h-[calc(100vh-4rem)] overflow-hidden">
        {!isCompleted ? (
          <div className="h-full flex flex-col lg:flex-row">
            {/* 3D Scene - Always render to maintain immersive context */}
            {lesson.sceneData && (
              <div className={cn(
                "bg-gradient-to-br from-gray-900 to-gray-800",
                gameSteps.length > 0 ? "h-1/3 lg:h-full lg:w-1/2" : "h-full w-full"
              )}>
                <Three3DLesson
                  lesson={lesson}
                  onComplete={gameSteps.length > 0 ? () => {
                    // If game steps exist, 3D scene only reports readiness, not completion
                    // Actual completion is gated by step controller
                  } : handleLessonComplete}
                  onProgress={handleLessonProgress}
                  onInteraction={handleInteraction}
                  isMobile={isMobile}
                />
              </div>
            )}
            
            {/* Game Steps Overlay - Interactive activities */}
            {gameSteps.length > 0 && (
              <div className="h-2/3 lg:h-full lg:w-1/2 overflow-hidden p-4 lg:p-8 pb-20 bg-white dark:bg-gray-900 relative">
                {/* Step Navigation Buttons - Desktop */}
                {gameSteps.length > 1 && (
                  <>
                    {currentStepIndex > 0 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        className="hidden lg:flex absolute left-2 top-1/2 -translate-y-1/2 z-10 bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm hover:bg-white dark:hover:bg-gray-800"
                        onClick={() => {
                          if (currentStepIndex > 0) {
                            setCurrentStepIndex(prev => prev - 1);
                            setStepKey(prev => prev + 1);
                          }
                        }}
                        data-testid="button-previous-step"
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </Button>
                    )}
                    <div className="hidden lg:block absolute right-2 top-4 text-sm text-gray-500 dark:text-gray-400">
                      Step {currentStepIndex + 1} of {gameSteps.length}
                    </div>
                  </>
                )}

                {/* Swipeable Game Step Container */}
                <AnimatePresence mode="wait" initial={false}>
                  <motion.div
                    key={`motion-step-${currentStepIndex}-${stepKey}`}
                    initial={{ opacity: 0, x: 50 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -50 }}
                    transition={{ 
                      type: "spring", 
                      stiffness: 300, 
                      damping: 30,
                      opacity: { duration: 0.2 }
                    }}
                    drag={isMobile ? "x" : false}
                    dragConstraints={{ left: 0, right: 0 }}
                    dragElastic={0.2}
                    onDragEnd={(e, { offset, velocity }) => {
                      const swipeThreshold = 50;
                      if (Math.abs(offset.x) > swipeThreshold) {
                        if (offset.x > 0 && currentStepIndex > 0) {
                          // Swipe right - go to previous step
                          setCurrentStepIndex(prev => prev - 1);
                          setStepKey(prev => prev + 1);
                        }
                      }
                    }}
                    className="h-full overflow-y-auto"
                  >
                    <GameStepRenderer
                      key={`step-${currentStepIndex}-${stepKey}`}
                      step={gameSteps[currentStepIndex]}
                      onComplete={(stepScore) => {
                    const completionReqs = lesson.interactionConfig?.completionRequirements;
                    const requiredSteps = completionReqs?.requiredSteps || [];
                    const optionalSteps = completionReqs?.optionalSteps || [];
                    const currentStepId = gameSteps[currentStepIndex]?.stepId;
                    const isRequired = requiredSteps.includes(currentStepId);
                    const isOptional = optionalSteps.includes(currentStepId);
                    const minimumScore = completionReqs?.minimumScore || 70;
                    
                    // Validate required step score BEFORE recording
                    if (isRequired && stepScore < minimumScore) {
                      // Do NOT record failing score - show retry option
                      toast({
                        title: "Try Again!",
                        description: `You need at least ${minimumScore}% to pass this required step. You scored ${Math.round(stepScore)}%. Click Retry to try again.`,
                        variant: "destructive",
                        duration: 10000,
                        action: (
                          <Button 
                            size="sm" 
                            onClick={() => {
                              // Force re-render by incrementing key
                              setStepKey(prev => prev + 1);
                            }}
                          >
                            Retry
                          </Button>
                        )
                      });
                      return; // Block progression - do not record score
                    }
                    
                    // Record step score ONLY after validation passes
                    const newStepScores = { ...stepScores, [currentStepIndex]: stepScore };
                    setStepScores(newStepScores);
                    
                    // Calculate score from REQUIRED steps only (exclude optional from average)
                    const requiredScores = Object.entries(newStepScores)
                      .filter(([idx]) => requiredSteps.includes(gameSteps[parseInt(idx)]?.stepId))
                      .map(([_, score]) => score);
                    
                    const avgRequiredScore = requiredScores.length > 0 
                      ? requiredScores.reduce((a, b) => a + b, 0) / requiredScores.length 
                      : 0;
                    
                    setTotalScore(avgRequiredScore);
                    
                    // Move to next step or complete lesson
                    if (currentStepIndex < gameSteps.length - 1) {
                      setCurrentStepIndex(prev => prev + 1);
                      const newProgress = ((currentStepIndex + 1) / gameSteps.length) * 100;
                      setLessonProgress(newProgress);
                      handleLessonProgress(newProgress);
                    } else {
                      // All steps completed - validate overall completion
                      
                      // Handle optional-only lessons (no required steps)
                      if (requiredSteps.length === 0) {
                        // No required steps - lesson is complete
                        handleLessonComplete(lesson.estimatedDurationMinutes || 15);
                        return;
                      }
                      
                      // Validate required steps completion
                      const allRequiredCompleted = requiredSteps.every(stepId => 
                        Object.keys(newStepScores).some(idx => 
                          gameSteps[parseInt(idx)]?.stepId === stepId
                        )
                      );
                      
                      if (allRequiredCompleted && avgRequiredScore >= minimumScore) {
                        handleLessonComplete(lesson.estimatedDurationMinutes || 15);
                      } else {
                        toast({
                          title: "Lesson Not Completed",
                          description: `You need ${minimumScore}% on required steps to complete this lesson. Current: ${Math.round(avgRequiredScore)}%`,
                          variant: "destructive"
                        });
                      }
                    }
                  }}
                  onProgress={handleLessonProgress}
                />
                
                {/* Score Indicator */}
                {Object.keys(stepScores).length > 0 && (
                  <div className="mt-4 p-4 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Current Score:</span>
                      <span className="text-lg font-bold text-emerald-600">
                        {Math.round(totalScore)}%
                      </span>
                    </div>
                  </div>
                )}
                  </motion.div>
                </AnimatePresence>
                
                {/* Mobile Swipe Indicator */}
                {isMobile && currentStepIndex > 0 && (
                  <div className="absolute bottom-24 left-0 right-0 flex justify-center pointer-events-none">
                    <div className="bg-gray-900/50 text-white text-xs px-3 py-1 rounded-full backdrop-blur-sm">
                      Swipe right to go back
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full flex items-center justify-center p-4">
            <Card className="max-w-2xl w-full">
              <CardHeader className="text-center pb-4">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle className="w-8 h-8 text-green-600" />
                </div>
                <CardTitle className="text-2xl text-gray-900 dark:text-white">
                  🎉 Lesson Completed!
                </CardTitle>
              </CardHeader>
              
              <CardContent className="space-y-6">
                {/* Completion Stats */}
                <div className="grid grid-cols-3 gap-4 text-center">
                  <div className="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-emerald-600">{lesson.xpReward}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">XP Earned</div>
                  </div>
                  <div className="bg-teal-50 dark:bg-teal-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-teal-600">{lesson.estimatedDurationMinutes}</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Minutes</div>
                  </div>
                  <div className="bg-cyan-50 dark:bg-cyan-900/20 rounded-lg p-4">
                    <div className="text-2xl font-bold text-cyan-600">100%</div>
                    <div className="text-sm text-gray-600 dark:text-gray-300">Complete</div>
                  </div>
                </div>

                {/* Level Up Message */}
                {completionData?.levelUp && (
                  <Alert className="bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200">
                    <Crown className="h-4 w-4 text-amber-600" />
                    <AlertDescription className="text-amber-800">
                      <strong>Level Up!</strong> You reached Level {completionData.newLevel}! 
                      Keep learning to unlock more advanced lessons.
                    </AlertDescription>
                  </Alert>
                )}

                {/* New Achievements */}
                {completionData?.newAchievements && completionData.newAchievements.length > 0 && (
                  <div className="space-y-2">
                    <h4 className="font-semibold text-gray-900 dark:text-white flex items-center">
                      <Trophy className="w-4 h-4 mr-2 text-yellow-500" />
                      New Achievements Unlocked!
                    </h4>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {completionData.newAchievements.map((achievement: any) => (
                        <div 
                          key={achievement.id}
                          className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200"
                        >
                          <div className="flex items-center space-x-2">
                            <Star className="w-4 h-4 text-yellow-500" />
                            <div>
                              <div className="font-medium text-sm text-gray-900 dark:text-white">
                                {achievement.achievementTitle}
                              </div>
                              <div className="text-xs text-gray-600 dark:text-gray-300">
                                +{achievement.xpReward} XP
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upgrade Prompt */}
                {completionData?.shouldShowUpgradePrompt && (
                  <Alert className="bg-gradient-to-r from-purple-50 to-indigo-50 border-purple-200">
                    <Sparkles className="h-4 w-4 text-purple-600" />
                    <AlertDescription>
                      <div className="flex items-center justify-between">
                        <div>
                          <strong className="text-purple-800">Ready for Advanced Learning?</strong>
                          <p className="text-purple-700 text-sm mt-1">
                            Upgrade to Meta Lingua Pro for personalized lessons and expert tutoring.
                          </p>
                        </div>
                        <Button 
                          size="sm"
                          onClick={() => window.location.href = '/signup?source=linguaquest&lesson_completed=true'}
                          className="bg-purple-600 hover:bg-purple-700"
                          data-testid="button-upgrade-completion"
                        >
                          Upgrade
                        </Button>
                      </div>
                    </AlertDescription>
                  </Alert>
                )}

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Button 
                    onClick={handleReturnHome} 
                    className="flex-1 bg-emerald-600 hover:bg-emerald-700"
                    data-testid="button-continue-learning"
                  >
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Continue Learning
                  </Button>
                  <Button 
                    variant="outline" 
                    onClick={handleRetryLesson}
                    data-testid="button-retry-lesson"
                  >
                    <RotateCcw className="w-4 h-4 mr-2" />
                    Retry Lesson
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </main>

      {/* Mobile Progress Bar */}
      {isMobile && !isCompleted && (
        <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {lesson.title}
            </span>
            <span className="text-sm text-gray-500">
              {Math.round(lessonProgress)}%
            </span>
          </div>
          <Progress value={lessonProgress} className="w-full" />
        </div>
      )}
    </div>
  );
}