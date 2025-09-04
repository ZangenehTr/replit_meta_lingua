import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Clock, 
  Volume2, 
  BookOpen, 
  Target, 
  Play, 
  Sparkles,
  ChevronRight,
  Brain,
  Lightbulb
} from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VocabItem {
  term: string;
  definition_en: string;
  definition_fa?: string;
  example_en: string;
}

interface RoadmapContext {
  template_title?: string;
  current_unit?: string;
  current_lesson?: string;
  progress_percentage?: number;
}

interface PreSessionReviewData {
  countdown_sec: number;
  grammar_explained_fa?: string;
  grammar_explained_en?: string;
  vocab: VocabItem[];
  srs_seed: VocabItem[];
  session_focus: string;
  learning_objectives: string[];
  next_button_label_after_countdown: string;
  roadmap_context: RoadmapContext;
}

interface PreSessionReviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  onStartSession: () => void;
  reviewData: PreSessionReviewData | null;
  targetLanguage?: string;
  isLoading?: boolean;
}

export const PreSessionReviewModal: React.FC<PreSessionReviewModalProps> = ({
  isOpen,
  onClose,
  onStartSession,
  reviewData,
  targetLanguage = 'en',
  isLoading = false
}) => {
  const { t, i18n } = useTranslation();
  const [countdown, setCountdown] = useState(180); // 3 minutes
  const [isCountdownComplete, setIsCountdownComplete] = useState(false);
  const [currentVocabIndex, setCurrentVocabIndex] = useState(0);
  const [showGrammar, setShowGrammar] = useState(true);

  // Initialize countdown when modal opens
  useEffect(() => {
    if (isOpen && reviewData) {
      setCountdown(reviewData.countdown_sec);
      setIsCountdownComplete(false);
      setCurrentVocabIndex(0);
      setShowGrammar(true);
    }
  }, [isOpen, reviewData]);

  // Countdown timer
  useEffect(() => {
    if (!isOpen || countdown <= 0 || isCountdownComplete) return;

    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          setIsCountdownComplete(true);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, countdown, isCountdownComplete]);

  // Auto-cycle through vocabulary items
  useEffect(() => {
    if (!reviewData?.vocab.length || showGrammar) return;

    const timer = setInterval(() => {
      setCurrentVocabIndex(prev => 
        prev < reviewData.vocab.length - 1 ? prev + 1 : 0
      );
    }, 3000); // Change every 3 seconds

    return () => clearInterval(timer);
  }, [reviewData?.vocab, showGrammar]);

  // Format countdown display
  const formatCountdown = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Handle text-to-speech
  const handleSpeak = (text: string, lang?: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || (targetLanguage === 'fa' ? 'fa-IR' : 'en-US');
    speechSynthesis.speak(utterance);
  };

  // Progress percentage based on countdown
  const progressPercentage = reviewData ? 
    ((reviewData.countdown_sec - countdown) / reviewData.countdown_sec) * 100 : 0;

  if (!reviewData && !isLoading) return null;

  return (
    <Dialog open={isOpen} onOpenChange={() => {}}>
      <DialogContent className="max-w-md mx-auto max-h-[90vh] overflow-hidden p-0 bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-blue-900">
        <div className="relative h-full">
          {/* Loading State */}
          {isLoading && (
            <div className="flex items-center justify-center h-96">
              <div className="text-center space-y-4">
                <div className="animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent mx-auto"></div>
                <p className="text-gray-600 dark:text-gray-300">
                  {t('callern:review.generating')}
                </p>
              </div>
            </div>
          )}

          {/* Review Content */}
          {reviewData && (
            <>
              {/* Header */}
              <DialogHeader className="p-6 pb-4 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex items-center justify-between">
                  <DialogTitle className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
                    <Brain className="w-6 h-6 text-blue-600" />
                    {t('callern:review.title')}
                  </DialogTitle>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className={`font-mono text-lg font-bold ${
                      countdown <= 30 ? 'text-red-500' : 'text-blue-600'
                    }`}>
                      {formatCountdown(countdown)}
                    </span>
                  </div>
                </div>
                
                <Progress value={progressPercentage} className="h-2 mt-2" />
                
                {/* Roadmap Context */}
                {reviewData.roadmap_context.template_title && (
                  <div className="mt-3 p-3 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
                    <div className="flex items-center gap-2 text-sm text-blue-800 dark:text-blue-200">
                      <Target className="w-4 h-4" />
                      <span className="font-medium">{reviewData.roadmap_context.template_title}</span>
                      <ChevronRight className="w-3 h-3" />
                      <span>{reviewData.roadmap_context.current_unit}</span>
                    </div>
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-300">
                      {reviewData.roadmap_context.progress_percentage}% {t('callern:review.complete')}
                    </div>
                  </div>
                )}
              </DialogHeader>

              {/* Content Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-6">
                {/* Session Focus */}
                <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <Sparkles className="w-5 h-5 text-yellow-500 mt-0.5" />
                      <div>
                        <h3 className="font-semibold text-gray-800 dark:text-white mb-1">
                          {t('callern:review.sessionFocus')}
                        </h3>
                        <p className="text-gray-600 dark:text-gray-300 text-sm">
                          {reviewData.session_focus}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Grammar and Vocabulary Tabs */}
                <div className="space-y-4">
                  <div className="flex gap-2">
                    <Button
                      variant={showGrammar ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGrammar(true)}
                      className="flex-1"
                    >
                      <BookOpen className="w-4 h-4 mr-2" />
                      {t('callern:review.grammar')}
                    </Button>
                    <Button
                      variant={!showGrammar ? "default" : "outline"}
                      size="sm"
                      onClick={() => setShowGrammar(false)}
                      className="flex-1"
                    >
                      <Lightbulb className="w-4 h-4 mr-2" />
                      {t('callern:review.vocabulary')} ({reviewData.vocab.length})
                    </Button>
                  </div>

                  <AnimatePresence mode="wait">
                    {showGrammar ? (
                      <motion.div
                        key="grammar"
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 20 }}
                        transition={{ duration: 0.3 }}
                      >
                        <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                          <CardContent className="p-4">
                            <div className="space-y-3">
                              <div className="flex items-center justify-between">
                                <h3 className="font-semibold text-gray-800 dark:text-white">
                                  {t('callern:review.grammarExplanation')}
                                </h3>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleSpeak(
                                    reviewData.grammar_explained_fa || reviewData.grammar_explained_en || '',
                                    reviewData.grammar_explained_fa ? 'fa-IR' : 'en-US'
                                  )}
                                >
                                  <Volume2 className="w-4 h-4" />
                                </Button>
                              </div>
                              <p className="text-gray-700 dark:text-gray-300" dir={i18n.language === 'fa' ? 'rtl' : 'ltr'}>
                                {i18n.language === 'fa' && reviewData.grammar_explained_fa 
                                  ? reviewData.grammar_explained_fa
                                  : reviewData.grammar_explained_en}
                              </p>
                            </div>
                          </CardContent>
                        </Card>
                      </motion.div>
                    ) : (
                      <motion.div
                        key="vocabulary"
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: -20 }}
                        transition={{ duration: 0.3 }}
                      >
                        {reviewData.vocab.length > 0 && (
                          <Card className="bg-white/70 dark:bg-gray-800/70 backdrop-blur-sm">
                            <CardContent className="p-4">
                              <AnimatePresence mode="wait">
                                <motion.div
                                  key={currentVocabIndex}
                                  initial={{ opacity: 0, scale: 0.9 }}
                                  animate={{ opacity: 1, scale: 1 }}
                                  exit={{ opacity: 0, scale: 0.9 }}
                                  transition={{ duration: 0.5 }}
                                  className="space-y-3"
                                >
                                  {(() => {
                                    const vocab = reviewData.vocab[currentVocabIndex];
                                    return (
                                      <>
                                        <div className="flex items-center justify-between">
                                          <div className="flex items-center gap-2">
                                            <Badge variant="secondary" className="font-mono">
                                              {vocab.term}
                                            </Badge>
                                            <Button
                                              variant="ghost"
                                              size="sm"
                                              onClick={() => handleSpeak(vocab.term)}
                                            >
                                              <Volume2 className="w-4 h-4" />
                                            </Button>
                                          </div>
                                          <span className="text-xs text-gray-500">
                                            {currentVocabIndex + 1} / {reviewData.vocab.length}
                                          </span>
                                        </div>
                                        <p className="text-gray-700 dark:text-gray-300">
                                          {i18n.language === 'fa' && vocab.definition_fa 
                                            ? vocab.definition_fa 
                                            : vocab.definition_en}
                                        </p>
                                        <p className="text-sm text-gray-600 dark:text-gray-400 italic">
                                          "{vocab.example_en}"
                                        </p>
                                      </>
                                    );
                                  })()}
                                </motion.div>
                              </AnimatePresence>
                            </CardContent>
                          </Card>
                        )}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                {/* Learning Objectives */}
                {reviewData.learning_objectives.length > 0 && (
                  <Card className="bg-green-50/70 dark:bg-green-900/20 backdrop-blur-sm">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-green-800 dark:text-green-200 mb-2 flex items-center gap-2">
                        <Target className="w-4 h-4" />
                        {t('callern:review.objectives')}
                      </h3>
                      <ul className="space-y-1">
                        {reviewData.learning_objectives.map((objective, index) => (
                          <li key={index} className="text-sm text-green-700 dark:text-green-300 flex items-start gap-2">
                            <span className="w-1.5 h-1.5 bg-green-500 rounded-full mt-2 flex-shrink-0"></span>
                            {objective}
                          </li>
                        ))}
                      </ul>
                    </CardContent>
                  </Card>
                )}
              </div>

              {/* Footer */}
              <div className="p-6 bg-white/50 dark:bg-gray-800/50 backdrop-blur-sm">
                <div className="flex gap-3">
                  <Button
                    variant="outline"
                    onClick={onClose}
                    className="flex-1"
                    disabled={countdown > 0 && !isCountdownComplete}
                  >
                    {t('callern:review.cancel')}
                  </Button>
                  <Button
                    onClick={onStartSession}
                    disabled={countdown > 0 && !isCountdownComplete}
                    className={`flex-1 ${
                      isCountdownComplete 
                        ? 'bg-green-600 hover:bg-green-700 text-white' 
                        : 'bg-gray-400 cursor-not-allowed'
                    }`}
                  >
                    <Play className="w-4 h-4 mr-2" />
                    {isCountdownComplete 
                      ? reviewData.next_button_label_after_countdown 
                      : t('callern:review.wait')}
                  </Button>
                </div>
                
                {!isCountdownComplete && (
                  <p className="text-xs text-center text-gray-500 mt-2">
                    {t('callern:review.countdownMessage')}
                  </p>
                )}
              </div>
            </>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
};