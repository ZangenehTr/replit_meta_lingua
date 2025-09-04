import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion, AnimatePresence } from 'framer-motion';
import { Check, X, Clock, Lightbulb, AlertCircle, User } from 'lucide-react';
import { useTranslation } from 'react-i18next';

interface SuggestedActivity {
  activity_id: string;
  type: 'quiz' | 'matching' | 'fill_in_blank' | 'poll' | 'vocab_game' | 'dialogue_roleplay';
  title: string;
  prompt: string;
  payload: any;
  duration_min: number;
  pedagogy: {
    i_plus_1: boolean;
    scaffolding_stage: 'controlled' | 'semi_controlled' | 'free';
  };
  suggested_for: number;
  explain_fa: string;
}

interface StudentMetrics {
  ttt_ratio: number; // Teacher Talking Time ratio (should be < 30%)
  attention_score: number; // 0-100
  engagement_level: 'low' | 'medium' | 'high';
  last_response_time: number; // seconds ago
  struggling_indicators: string[];
}

interface HUDTeacherOverlayProps {
  isVisible: boolean;
  suggestedActivities?: SuggestedActivity[];
  studentMetrics?: StudentMetrics;
  onActivityApprove?: (activityId: string) => void;
  onActivityDecline?: (activityId: string) => void;
  onGenerateNewActivity?: () => void;
  className?: string;
}

export const HUDTeacherOverlay: React.FC<HUDTeacherOverlayProps> = ({
  isVisible,
  suggestedActivities = [],
  studentMetrics,
  onActivityApprove,
  onActivityDecline,
  onGenerateNewActivity,
  className = ''
}) => {
  const { t } = useTranslation();
  const [currentActivityIndex, setCurrentActivityIndex] = useState(0);
  const [showMetrics, setShowMetrics] = useState(false);
  const [autoHideTimer, setAutoHideTimer] = useState<NodeJS.Timeout | null>(null);

  const currentActivity = suggestedActivities[currentActivityIndex];

  // Auto-hide after 10 seconds of inactivity
  useEffect(() => {
    if (isVisible && !currentActivity) {
      const timer = setTimeout(() => {
        setShowMetrics(false);
      }, 10000);
      setAutoHideTimer(timer);
      return () => clearTimeout(timer);
    }
  }, [isVisible, currentActivity]);

  // Handle activity approval
  const handleApprove = () => {
    if (currentActivity && onActivityApprove) {
      onActivityApprove(currentActivity.activity_id);
      // Move to next activity or hide
      if (currentActivityIndex < suggestedActivities.length - 1) {
        setCurrentActivityIndex(currentActivityIndex + 1);
      } else {
        setCurrentActivityIndex(0);
      }
    }
  };

  // Handle activity decline
  const handleDecline = () => {
    if (currentActivity && onActivityDecline) {
      onActivityDecline(currentActivity.activity_id);
      // Move to next activity or generate new one
      if (currentActivityIndex < suggestedActivities.length - 1) {
        setCurrentActivityIndex(currentActivityIndex + 1);
      } else if (onGenerateNewActivity) {
        onGenerateNewActivity();
      }
    }
  };

  // Get TTT status color
  const getTTTStatusColor = (ratio: number) => {
    if (ratio <= 30) return 'text-green-400';
    if (ratio <= 50) return 'text-yellow-400';
    return 'text-red-400';
  };

  // Get attention status color
  const getAttentionStatusColor = (score: number) => {
    if (score >= 80) return 'text-green-400';
    if (score >= 60) return 'text-yellow-400';
    return 'text-red-400';
  };

  if (!isVisible) return null;

  return (
    <div className={`fixed inset-0 pointer-events-none z-40 ${className}`}>
      {/* Activity Suggestion Card */}
      <AnimatePresence>
        {currentActivity && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 right-4 w-80 pointer-events-auto"
          >
            <Card className="bg-black/80 backdrop-blur-lg border-white/20 shadow-2xl">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <Lightbulb className="w-4 h-4 text-yellow-400" />
                  {t('callern:hud.aiSuggestion')}
                  <Badge variant="secondary" className="ml-auto bg-blue-600/80 text-white text-xs">
                    {currentActivity.duration_min}m
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h3 className="text-white font-medium text-sm mb-1">
                    {currentActivity.title}
                  </h3>
                  <p className="text-white/80 text-xs">
                    {currentActivity.type.replace('_', ' ').toUpperCase()}
                  </p>
                </div>

                <div className="bg-white/10 rounded-lg p-3">
                  <p className="text-white/90 text-sm" dir="rtl">
                    {currentActivity.explain_fa}
                  </p>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={currentActivity.pedagogy.i_plus_1 ? "default" : "secondary"}
                      className="text-xs"
                    >
                      i+1
                    </Badge>
                    <Badge variant="outline" className="text-xs text-white border-white/30">
                      {currentActivity.pedagogy.scaffolding_stage}
                    </Badge>
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1 bg-white/10 border-white/20 text-white hover:bg-red-600/20 hover:border-red-400/50"
                    onClick={handleDecline}
                  >
                    <X className="w-4 h-4 mr-1" />
                    {t('callern:hud.decline')}
                  </Button>
                  <Button
                    size="sm"
                    className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    onClick={handleApprove}
                  >
                    <Check className="w-4 h-4 mr-1" />
                    {t('callern:hud.approve')}
                  </Button>
                </div>

                {suggestedActivities.length > 1 && (
                  <p className="text-white/60 text-xs text-center">
                    {currentActivityIndex + 1} / {suggestedActivities.length}
                  </p>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Student Metrics Panel */}
      <AnimatePresence>
        {showMetrics && studentMetrics && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            transition={{ duration: 0.3 }}
            className="absolute top-4 left-4 w-72 pointer-events-auto"
          >
            <Card className="bg-black/80 backdrop-blur-lg border-white/20">
              <CardHeader className="pb-3">
                <CardTitle className="text-white text-sm flex items-center gap-2">
                  <User className="w-4 h-4" />
                  {t('callern:hud.studentMetrics')}
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-auto text-white/70 hover:text-white p-1"
                    onClick={() => setShowMetrics(false)}
                  >
                    <X className="w-4 h-4" />
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {/* TTT Ratio */}
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">TTT Ratio:</span>
                  <span className={`font-medium ${getTTTStatusColor(studentMetrics.ttt_ratio)}`}>
                    {studentMetrics.ttt_ratio}%
                  </span>
                </div>

                {/* Attention Score */}
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Attention:</span>
                  <span className={`font-medium ${getAttentionStatusColor(studentMetrics.attention_score)}`}>
                    {studentMetrics.attention_score}%
                  </span>
                </div>

                {/* Engagement Level */}
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Engagement:</span>
                  <Badge 
                    variant={studentMetrics.engagement_level === 'high' ? 'default' : 'secondary'}
                    className="text-xs"
                  >
                    {studentMetrics.engagement_level}
                  </Badge>
                </div>

                {/* Last Response Time */}
                <div className="flex items-center justify-between">
                  <span className="text-white/80 text-sm">Last Response:</span>
                  <span className="text-white/90 text-sm flex items-center gap-1">
                    <Clock className="w-3 h-3" />
                    {studentMetrics.last_response_time}s ago
                  </span>
                </div>

                {/* Struggling Indicators */}
                {studentMetrics.struggling_indicators.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <AlertCircle className="w-4 h-4 text-yellow-400" />
                      <span className="text-white/80 text-sm">Needs Support:</span>
                    </div>
                    <div className="space-y-1">
                      {studentMetrics.struggling_indicators.map((indicator, index) => (
                        <Badge 
                          key={index} 
                          variant="outline" 
                          className="text-xs text-yellow-400 border-yellow-400/50"
                        >
                          {indicator}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Metrics Toggle */}
      {!showMetrics && studentMetrics && (
        <motion.div
          initial={{ opacity: 0, scale: 0 }}
          animate={{ opacity: 1, scale: 1 }}
          className="absolute top-6 left-6 pointer-events-auto"
        >
          <Button
            variant="default"
            size="sm"
            className="rounded-full bg-blue-600/80 backdrop-blur-sm hover:bg-blue-600/90 text-white shadow-lg"
            onClick={() => setShowMetrics(true)}
          >
            <User className="w-4 h-4 mr-1" />
            {studentMetrics.engagement_level}
          </Button>
        </motion.div>
      )}

      {/* Quick Action Bar */}
      {!currentActivity && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute bottom-6 right-6 pointer-events-auto"
        >
          <div className="flex gap-2">
            <Button
              variant="default"
              size="sm"
              className="bg-purple-600/80 backdrop-blur-sm hover:bg-purple-600/90 text-white shadow-lg"
              onClick={onGenerateNewActivity}
            >
              <Lightbulb className="w-4 h-4 mr-1" />
              {t('callern:hud.suggestActivity')}
            </Button>
          </div>
        </motion.div>
      )}
    </div>
  );
};