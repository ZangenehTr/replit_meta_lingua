import React, { useState, useEffect } from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, HelpCircle, CheckCircle, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface VocabHint {
  term: string;
  definition_en: string;
  definition_fa?: string;
  example_en: string;
  context?: string;
}

interface ActivityCard {
  id: string;
  type: 'quiz' | 'matching' | 'fill_in_blank' | 'poll' | 'vocab_game' | 'dialogue_roleplay';
  title: string;
  prompt: string;
  payload: any;
  duration_min: number;
  explain_fa?: string;
}

interface HUDStudentOverlayProps {
  isVisible: boolean;
  currentWords?: VocabHint[];
  activityCard?: ActivityCard | null;
  onWordHintRequest?: (word: string) => void;
  onActivityComplete?: (activityId: string, response: any) => void;
  onActivityDismiss?: (activityId: string) => void;
  sessionLanguage?: string;
  className?: string;
}

export const HUDStudentOverlay: React.FC<HUDStudentOverlayProps> = ({
  isVisible,
  currentWords = [],
  activityCard = null,
  onWordHintRequest,
  onActivityComplete,
  onActivityDismiss,
  sessionLanguage = 'en',
  className = ''
}) => {
  const { t, i18n } = useTranslation();
  const [showHints, setShowHints] = useState(false);
  const [selectedHint, setSelectedHint] = useState<VocabHint | null>(null);
  const [fadeTimer, setFadeTimer] = useState<NodeJS.Timeout | null>(null);
  const [activityResponse, setActivityResponse] = useState<any>(null);

  // Auto-fade hints after 7 seconds of inactivity
  useEffect(() => {
    if (showHints && !activityCard) {
      const timer = setTimeout(() => {
        setShowHints(false);
        setSelectedHint(null);
      }, 7000);
      setFadeTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [showHints, activityCard]);

  // Handle word hint requests
  const handleWordClick = (word: VocabHint) => {
    setSelectedHint(word);
    setShowHints(true);
    if (onWordHintRequest) {
      onWordHintRequest(word.term);
    }
    
    // Clear existing timer
    if (fadeTimer) clearTimeout(fadeTimer);
  };

  // Handle activity completion
  const handleActivitySubmit = () => {
    if (activityCard && onActivityComplete) {
      onActivityComplete(activityCard.id, activityResponse);
      setActivityResponse(null);
    }
  };

  // Handle activity dismissal
  const handleActivityDismiss = () => {
    if (activityCard && onActivityDismiss) {
      onActivityDismiss(activityCard.id);
      setActivityResponse(null);
    }
  };

  // Render activity content based on type
  const renderActivityContent = () => {
    if (!activityCard) return null;

    switch (activityCard.type) {
      case 'quiz':
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/90">{activityCard.prompt}</p>
            <div className="space-y-2">
              {activityCard.payload.options?.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={activityResponse === option ? "default" : "outline"}
                  className="w-full text-left justify-start bg-white/10 border-white/20 hover:bg-white/20"
                  onClick={() => setActivityResponse(option)}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/90">{activityCard.prompt}</p>
            <div className="grid grid-cols-2 gap-2">
              {activityCard.payload.pairs?.map((pair: [string, string], index: number) => (
                <div key={index} className="bg-white/10 p-2 rounded text-xs">
                  <div className="font-medium">{pair[0]}</div>
                  <div className="text-white/70">{pair[1]}</div>
                </div>
              ))}
            </div>
          </div>
        );

      case 'fill_in_blank':
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/90">{activityCard.prompt}</p>
            <div className="bg-white/10 p-3 rounded">
              <p className="text-sm">{activityCard.payload.text_with_gaps}</p>
              <input
                type="text"
                placeholder="Your answer..."
                className="mt-2 w-full p-2 bg-white/20 border border-white/30 rounded text-white placeholder-white/60"
                value={activityResponse || ''}
                onChange={(e) => setActivityResponse(e.target.value)}
              />
            </div>
          </div>
        );

      case 'poll':
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/90">{activityCard.payload.topic}</p>
            <div className="space-y-2">
              {activityCard.payload.choices?.map((choice: string, index: number) => (
                <Button
                  key={index}
                  variant={activityResponse === choice ? "default" : "outline"}
                  className="w-full text-left justify-start bg-white/10 border-white/20 hover:bg-white/20"
                  onClick={() => setActivityResponse(choice)}
                >
                  {choice}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'dialogue_roleplay':
        return (
          <div className="space-y-3">
            <p className="text-sm text-white/90">{activityCard.prompt}</p>
            <div className="max-h-32 overflow-y-auto space-y-2">
              {activityCard.payload.script?.map((line: any, index: number) => (
                <div key={index} className="bg-white/10 p-2 rounded text-xs">
                  <span className="font-medium">{line.ai ? 'AI' : 'You'}: </span>
                  <span>{line.ai || line.student}</span>
                </div>
              ))}
            </div>
          </div>
        );

      default:
        return <p className="text-sm text-white/90">{activityCard.prompt}</p>;
    }
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-50 ${className}`}>
      {/* Word Hints Overlay */}
      <AnimatePresence>
        {showHints && currentWords.length > 0 && !activityCard && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute bottom-20 left-4 right-4 pointer-events-auto"
          >
            <Card className="bg-black/60 backdrop-blur-lg border-white/20">
              <CardContent className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-white font-medium text-sm">
                    {t('callern:hud.wordHints')}
                  </h3>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white p-1"
                    onClick={() => {
                      setShowHints(false);
                      setSelectedHint(null);
                    }}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </div>
                
                {selectedHint ? (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary" className="bg-white/20 text-white">
                        {selectedHint.term}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-white/70 hover:text-white p-1"
                        onClick={() => {
                          // Text-to-speech for pronunciation
                          const utterance = new SpeechSynthesisUtterance(selectedHint.term);
                          utterance.lang = sessionLanguage === 'fa' ? 'fa-IR' : 'en-US';
                          speechSynthesis.speak(utterance);
                        }}
                      >
                        <Volume2 className="w-3 h-3" />
                      </Button>
                    </div>
                    
                    <p className="text-white/90 text-sm">
                      {i18n.language === 'fa' && selectedHint.definition_fa 
                        ? selectedHint.definition_fa 
                        : selectedHint.definition_en}
                    </p>
                    
                    <p className="text-white/70 text-xs italic">
                      {selectedHint.example_en}
                    </p>
                    
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full bg-white/10 border-white/20 text-white hover:bg-white/20"
                      onClick={() => setSelectedHint(null)}
                    >
                      {t('callern:hud.backToList')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {currentWords.slice(0, 6).map((word, index) => (
                      <Button
                        key={index}
                        variant="outline"
                        size="sm"
                        className="bg-white/10 border-white/20 text-white hover:bg-white/20 text-xs"
                        onClick={() => handleWordClick(word)}
                      >
                        {word.term}
                      </Button>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Activity Card Overlay */}
      <AnimatePresence>
        {activityCard && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ duration: 0.3 }}
            className="absolute inset-4 pointer-events-auto"
          >
            <Card className="bg-gradient-to-br from-blue-600/90 to-purple-600/90 backdrop-blur-lg border-white/20 h-full">
              <CardContent className="p-6 h-full flex flex-col">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h2 className="text-white font-bold text-lg">
                      {activityCard.title}
                    </h2>
                    <p className="text-white/80 text-sm">
                      {activityCard.duration_min} {t('callern:hud.minutes')}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="text-white/70 hover:text-white"
                    onClick={handleActivityDismiss}
                  >
                    <X className="w-5 h-5" />
                  </Button>
                </div>

                {/* Persian explanation for why this activity was suggested */}
                {activityCard.explain_fa && i18n.language === 'fa' && (
                  <div className="bg-white/10 rounded-lg p-3 mb-4">
                    <p className="text-white/90 text-sm text-right" dir="rtl">
                      <HelpCircle className="w-4 h-4 inline ml-1" />
                      {activityCard.explain_fa}
                    </p>
                  </div>
                )}

                <div className="flex-1 overflow-y-auto">
                  {renderActivityContent()}
                </div>

                <div className="mt-4 flex gap-3">
                  <Button
                    variant="outline"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-white/20"
                    onClick={handleActivityDismiss}
                  >
                    {t('callern:hud.skip')}
                  </Button>
                  <Button
                    className="flex-1 bg-white text-black hover:bg-white/90"
                    disabled={!activityResponse}
                    onClick={handleActivitySubmit}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    {t('callern:hud.complete')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating help button */}
      {!showHints && !activityCard && currentWords.length > 0 && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute bottom-6 right-6 pointer-events-auto"
        >
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-blue-600/80 backdrop-blur-sm hover:bg-blue-600/90 text-white shadow-lg"
            onClick={() => setShowHints(true)}
          >
            <HelpCircle className="w-4 h-4 mr-1" />
            {currentWords.length}
          </Button>
        </motion.div>
      )}
    </div>
  );
};