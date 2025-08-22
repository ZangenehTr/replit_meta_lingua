import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Camera, CameraOff, Mic, MicOff, Star, AlertCircle, TrendingUp, Languages } from 'lucide-react';
import { cn } from "@/lib/utils";

interface ScoreCategory {
  name: string;
  value: number;
  delta: number;
  color: string;
}

interface ScoringOverlayProps {
  role: 'student' | 'teacher';
  isVisible: boolean;
  scores: {
    student?: {
      speakingFluency: number;
      pronunciation: number;
      vocabulary: number;
      grammar: number;
      interaction: number;
      targetLangUse: number;
      presence: number;
      total: number;
      stars: number;
    };
    teacher?: {
      facilitator: number;
      monitor: number;
      feedbackProvider: number;
      resourceModel: number;
      assessor: number;
      engagement: number;
      targetLangUse: number;
      presence: number;
      total: number;
      stars: number;
    };
  };
  presence: {
    cameraOn: boolean;
    micOn: boolean;
  };
  tlWarning?: string;
  onToggleDetail?: () => void;
}

// Star rating component
const StarRating = ({ stars }: { stars: number }) => {
  const fullStars = Math.floor(stars);
  const hasHalfStar = stars % 1 >= 0.5;
  
  return (
    <div className="flex items-center gap-0.5">
      {[...Array(5)].map((_, i) => (
        <Star
          key={i}
          className={cn(
            "w-3 h-3 transition-all",
            i < fullStars ? "fill-yellow-400 text-yellow-400" :
            i === fullStars && hasHalfStar ? "fill-yellow-400/50 text-yellow-400" :
            "text-gray-400"
          )}
        />
      ))}
    </div>
  );
};

// Score ribbon component
const ScoreRibbon = ({ category, isExpanded }: { category: ScoreCategory; isExpanded: boolean }) => {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.8 }}
      className={cn(
        "relative flex items-center gap-2 px-3 py-1 rounded-full",
        "backdrop-blur-md bg-black/20 border border-white/20",
        "transition-all duration-300",
        isExpanded ? "min-w-[120px]" : "min-w-[60px]"
      )}
    >
      <span className={cn("text-xs font-medium", category.color)}>
        {isExpanded ? category.name : category.value}
      </span>
      {category.delta !== 0 && (
        <motion.span
          initial={{ opacity: 0, y: 5 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "text-xs font-bold",
            category.delta > 0 ? "text-green-400" : "text-red-400"
          )}
        >
          {category.delta > 0 ? '+' : ''}{category.delta}
        </motion.span>
      )}
    </motion.div>
  );
};

// Presence indicator
const PresenceIndicator = ({ cameraOn, micOn }: { cameraOn: boolean; micOn: boolean }) => {
  return (
    <div className="flex items-center gap-2">
      <motion.div
        animate={{ scale: cameraOn ? 1 : 0.8, opacity: cameraOn ? 1 : 0.5 }}
        className={cn(
          "p-1.5 rounded-full backdrop-blur-md",
          cameraOn ? "bg-green-500/20 border border-green-500/40" : "bg-red-500/20 border border-red-500/40"
        )}
      >
        {cameraOn ? <Camera className="w-3 h-3 text-green-400" /> : <CameraOff className="w-3 h-3 text-red-400" />}
      </motion.div>
      <motion.div
        animate={{ scale: micOn ? 1 : 0.8, opacity: micOn ? 1 : 0.5 }}
        className={cn(
          "p-1.5 rounded-full backdrop-blur-md",
          micOn ? "bg-green-500/20 border border-green-500/40" : "bg-red-500/20 border border-red-500/40"
        )}
      >
        {micOn ? <Mic className="w-3 h-3 text-green-400" /> : <MicOff className="w-3 h-3 text-red-400" />}
      </motion.div>
    </div>
  );
};

// Target Language warning toast
const TLWarning = ({ message }: { message: string }) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      className={cn(
        "absolute top-4 left-1/2 -translate-x-1/2 z-50",
        "flex items-center gap-2 px-4 py-2 rounded-full",
        "backdrop-blur-md bg-orange-500/20 border border-orange-500/40"
      )}
    >
      <Languages className="w-4 h-4 text-orange-400" />
      <span className="text-sm font-medium text-orange-200">{message}</span>
    </motion.div>
  );
};

export function ScoringOverlay({ 
  role, 
  isVisible, 
  scores, 
  presence, 
  tlWarning, 
  onToggleDetail 
}: ScoringOverlayProps) {
  const [isExpanded, setIsExpanded] = useState(false);
  const [scoreDeltas, setScoreDeltas] = useState<Record<string, number>>({});
  const [showTLWarning, setShowTLWarning] = useState(false);

  // Auto-hide TL warning after 3 seconds
  useEffect(() => {
    if (tlWarning) {
      setShowTLWarning(true);
      const timer = setTimeout(() => setShowTLWarning(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [tlWarning]);

  // Auto-hide expanded view after 5 seconds of no activity
  useEffect(() => {
    if (isExpanded) {
      const timer = setTimeout(() => setIsExpanded(false), 5000);
      return () => clearTimeout(timer);
    }
  }, [isExpanded]);

  const currentScores = role === 'student' ? scores.student : scores.teacher;
  if (!currentScores) return null;

  // Prepare score categories for display
  const categories: ScoreCategory[] = [];
  
  if (role === 'student' && scores.student) {
    categories.push(
      { name: 'Fluency', value: scores.student.speakingFluency || 0, delta: scoreDeltas.speakingFluency || 0, color: 'text-blue-400' },
      { name: 'Pronunciation', value: scores.student.pronunciation || 0, delta: scoreDeltas.pronunciation || 0, color: 'text-green-400' },
      { name: 'Vocabulary', value: scores.student.vocabulary || 0, delta: scoreDeltas.vocabulary || 0, color: 'text-purple-400' },
      { name: 'Grammar', value: scores.student.grammar || 0, delta: scoreDeltas.grammar || 0, color: 'text-yellow-400' }
    );
  } else if (role === 'teacher' && scores.teacher) {
    categories.push(
      { name: 'Facilitator', value: scores.teacher.facilitator || 0, delta: scoreDeltas.facilitator || 0, color: 'text-blue-400' },
      { name: 'Monitor', value: scores.teacher.monitor || 0, delta: scoreDeltas.monitor || 0, color: 'text-green-400' },
      { name: 'Feedback', value: scores.teacher.feedbackProvider || 0, delta: scoreDeltas.feedbackProvider || 0, color: 'text-purple-400' },
      { name: 'Engagement', value: scores.teacher.engagement || 0, delta: scoreDeltas.engagement || 0, color: 'text-yellow-400' }
    );
  }

  return (
    <AnimatePresence>
      {isVisible && (
        <>
          {/* TL Warning Toast */}
          {showTLWarning && tlWarning && <TLWarning message={tlWarning} />}

          {/* Top Score Ribbon */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className={cn(
              "absolute top-2 left-2 right-2 z-40",
              "flex items-center justify-between gap-2 p-3",
              "backdrop-blur-md bg-black/30 rounded-lg border border-white/30 shadow-lg",
              "pointer-events-auto"
            )}
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {/* Score categories */}
            <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide">
              {categories.map((cat, idx) => (
                <ScoreRibbon key={idx} category={cat} isExpanded={isExpanded} />
              ))}
            </div>

            {/* Total score and stars */}
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-1">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-sm font-bold text-white">{Math.round(currentScores.total || 0)}</span>
              </div>
              <StarRating stars={currentScores.stars || 0} />
            </div>
          </motion.div>

          {/* Bottom-left Presence Indicator */}
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="absolute bottom-4 left-4 z-40 pointer-events-auto"
          >
            <PresenceIndicator cameraOn={presence.cameraOn} micOn={presence.micOn} />
          </motion.div>

          {/* Presence Warning */}
          {(!presence.cameraOn || !presence.micOn) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className={cn(
                "absolute bottom-4 right-4 z-40",
                "flex items-center gap-2 px-3 py-2 rounded-full",
                "backdrop-blur-md bg-red-500/20 border border-red-500/40",
                "pointer-events-auto"
              )}
            >
              <AlertCircle className="w-4 h-4 text-red-400" />
              <span className="text-xs font-medium text-red-200">
                {!presence.cameraOn && !presence.micOn ? 'Camera & Mic required' :
                 !presence.cameraOn ? 'Camera required' : 'Mic required'}
              </span>
            </motion.div>
          )}

          {/* Expanded Detail View (optional) */}
          {isExpanded && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className={cn(
                "absolute top-16 left-4 z-40",
                "p-4 rounded-lg backdrop-blur-md bg-black/30 border border-white/20",
                "pointer-events-auto max-w-xs"
              )}
            >
              <h4 className="text-sm font-semibold text-white mb-2">
                {role === 'student' ? 'Learning Progress' : 'Teaching Performance'}
              </h4>
              <div className="space-y-2">
                {categories.map((cat, idx) => (
                  <div key={idx} className="flex items-center justify-between">
                    <span className="text-xs text-gray-300">{cat.name}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-24 h-1.5 bg-gray-700 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${cat.value}%` }}
                          className={cn("h-full rounded-full", 
                            cat.value > 70 ? "bg-green-500" :
                            cat.value > 40 ? "bg-yellow-500" : "bg-red-500"
                          )}
                        />
                      </div>
                      <span className="text-xs font-medium text-white min-w-[30px] text-right">
                        {Math.round(cat.value)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}
        </>
      )}
    </AnimatePresence>
  );
}