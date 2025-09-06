import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Brain, 
  AlertTriangle, 
  TrendingUp, 
  MessageSquare, 
  Mic, 
  Eye,
  Award,
  Clock,
  Activity,
  BookOpen,
  Target,
  Zap,
  Volume2,
  ChevronRight,
  X
} from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';
import { cn } from '@/lib/utils';

interface AIOverlayProps {
  roomId: string;
  role: 'student' | 'teacher';
  isVisible: boolean;
  onClose?: () => void;
}

interface WordSuggestion {
  word: string;
  translation: string;
  usage: string;
}

interface TeacherTip {
  icon: React.ReactNode;
  tip: string;
  priority: 'high' | 'medium' | 'low';
}

interface LiveScore {
  student: number;
  teacher: number;
  trend: 'up' | 'down' | 'stable';
}

interface AIWarning {
  type: string;
  message: string;
  severity: 'high' | 'medium' | 'low';
  data?: any;
}

export function AIOverlay({ roomId, role, isVisible, onClose }: AIOverlayProps) {
  const { socket } = useSocket();
  const [wordSuggestions, setWordSuggestions] = useState<WordSuggestion[]>([]);
  const [teacherTips, setTeacherTips] = useState<TeacherTip[]>([]);
  const [liveScore, setLiveScore] = useState<LiveScore>({ student: 0, teacher: 0, trend: 'stable' });
  const [tttRatio, setTttRatio] = useState({ teacher: 50, student: 50 });
  const [warnings, setWarnings] = useState<AIWarning[]>([]);
  const [engagementLevel, setEngagementLevel] = useState(100);
  const [attentionScore, setAttentionScore] = useState(100);
  const [activeFeatures, setActiveFeatures] = useState({
    wordHelper: true,
    liveScoring: true,
    tttMonitor: true,
    moodAnalysis: true,
    grammarCheck: true,
    pronunciation: true
  });
  const [selectedWord, setSelectedWord] = useState<string | null>(null);
  const [grammarCorrection, setGrammarCorrection] = useState<{ text: string; correction: string } | null>(null);
  const [pronunciationGuide, setPronunciationGuide] = useState<{ word: string; phonetic: string; tips: string[] } | null>(null);

  useEffect(() => {
    if (!socket || !isVisible) return;

    // Initialize AI features immediately when overlay becomes visible
    console.log('🤖 AI Assistant initializing for room:', roomId);
    
    // Request initial word suggestions to show AI is active
    socket.emit('request-word-help', { 
      roomId,
      context: 'conversation starting',
      targetLanguage: 'English' 
    });

    // Show immediate AI status
    setActiveFeatures({
      wordHelper: true,
      liveScoring: true,
      tttMonitor: true,
      moodAnalysis: true,
      grammarCheck: true,
      pronunciation: true
    });

    // Listen for AI events
    socket.on('word-suggestions', (suggestions: WordSuggestion[]) => {
      console.log('🔤 Received word suggestions:', suggestions);
      setWordSuggestions(suggestions);
    });

    socket.on('teacher-tips', (tips: TeacherTip[]) => {
      setTeacherTips(tips);
    });

    socket.on('live-score-update', (score: LiveScore) => {
      setLiveScore(score);
    });

    socket.on('metrics-update', (metrics: any) => {
      setTttRatio({
        teacher: Math.round(metrics.tttRatio * 100),
        student: Math.round((1 - metrics.tttRatio) * 100)
      });
      setEngagementLevel(Math.round(metrics.engagementLevel * 100));
      setAttentionScore(Math.round(metrics.attentionScore * 100));
    });

    socket.on('ai-warning', (warning: AIWarning) => {
      setWarnings(prev => [...prev.slice(-2), warning]);
      setTimeout(() => {
        setWarnings(prev => prev.filter(w => w !== warning));
      }, 5000);
    });

    socket.on('grammar-correction', (data: any) => {
      setGrammarCorrection(data);
      setTimeout(() => setGrammarCorrection(null), 8000);
    });

    socket.on('pronunciation-guide', (data: any) => {
      setPronunciationGuide(data);
    });

    return () => {
      socket.off('word-suggestions');
      socket.off('teacher-tips');
      socket.off('live-score-update');
      socket.off('metrics-update');
      socket.off('ai-warning');
      socket.off('grammar-correction');
      socket.off('pronunciation-guide');
    };
  }, [socket, isVisible]);

  const requestWordHelp = () => {
    socket?.emit('request-word-help', { roomId });
  };

  const checkPronunciation = (word: string) => {
    socket?.emit('check-pronunciation', { roomId, word });
    setSelectedWord(word);
  };

  const dismissWarning = (warning: AIWarning) => {
    setWarnings(prev => prev.filter(w => w !== warning));
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-50">
      {/* Top Bar - Metrics and Scores */}
      <motion.div
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute top-4 left-4 right-4 pointer-events-auto"
      >
        <div className="flex gap-4">
          {/* Live Scoring */}
          {activeFeatures.liveScoring && (
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                <Award className="w-5 h-5 text-yellow-400" />
                <div className="flex gap-6">
                  <div>
                    <p className="text-xs text-white/60">Student</p>
                    <p className="text-2xl font-bold text-white">{liveScore.student}</p>
                  </div>
                  <div>
                    <p className="text-xs text-white/60">Teacher</p>
                    <p className="text-2xl font-bold text-white">{liveScore.teacher}</p>
                  </div>
                </div>
                {liveScore.trend === 'up' && <TrendingUp className="w-4 h-4 text-green-400" />}
              </div>
            </div>
          )}

          {/* TTT Monitor */}
          {activeFeatures.tttMonitor && (
            <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
              <div className="flex items-center gap-3">
                <Clock className="w-5 h-5 text-blue-400" />
                <div className="flex flex-col">
                  <p className="text-xs text-white/60 mb-1">Talk Time Balance</p>
                  <div className="flex gap-2 items-center">
                    <div className="w-32 h-2 bg-white/20 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-gradient-to-r from-blue-400 to-purple-400 transition-all duration-500"
                        style={{ width: `${tttRatio.teacher}%` }}
                      />
                    </div>
                    <span className="text-xs text-white">{tttRatio.teacher}% / {tttRatio.student}%</span>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Engagement & Attention */}
          <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl">
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-green-400" />
                <div>
                  <p className="text-xs text-white/60">Engagement</p>
                  <p className="text-lg font-semibold text-white">{engagementLevel}%</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Eye className="w-4 h-4 text-purple-400" />
                <div>
                  <p className="text-xs text-white/60">Attention</p>
                  <p className="text-lg font-semibold text-white">{attentionScore}%</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Warnings */}
      <AnimatePresence>
        {warnings.map((warning, index) => (
          <motion.div
            key={`${warning.type}-${index}`}
            initial={{ x: 100, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 100, opacity: 0 }}
            className="absolute top-24 right-4 pointer-events-auto"
            style={{ top: `${96 + index * 72}px` }}
          >
            <div className={cn(
              "bg-black/30 backdrop-blur-lg rounded-xl p-3 border shadow-2xl flex items-center gap-3 min-w-[300px]",
              warning.severity === 'high' && "border-red-500/50 bg-red-900/20",
              warning.severity === 'medium' && "border-yellow-500/50 bg-yellow-900/20",
              warning.severity === 'low' && "border-blue-500/50 bg-blue-900/20"
            )}>
              <AlertTriangle className={cn(
                "w-5 h-5",
                warning.severity === 'high' && "text-red-400",
                warning.severity === 'medium' && "text-yellow-400",
                warning.severity === 'low' && "text-blue-400"
              )} />
              <div className="flex-1">
                <p className="text-sm text-white">{warning.message}</p>
                {warning.data && (
                  <p className="text-xs text-white/60 mt-1">
                    {Object.entries(warning.data).map(([key, value]) => `${key}: ${value}`).join(', ')}
                  </p>
                )}
              </div>
              <button
                onClick={() => dismissWarning(warning)}
                className="text-white/40 hover:text-white/60"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        ))}
      </AnimatePresence>

      {/* Student Word Helper */}
      {role === 'student' && activeFeatures.wordHelper && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute left-4 top-1/2 -translate-y-1/2 pointer-events-auto"
        >
          <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl max-w-xs">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Brain className="w-5 h-5 text-purple-400" />
                <h3 className="text-sm font-semibold text-white">AI Assistant</h3>
              </div>
              <button
                onClick={requestWordHelp}
                className="text-xs bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 px-2 py-1 rounded-lg transition-colors"
              >
                Help me
              </button>
            </div>
            
            {wordSuggestions.length > 0 ? (
              <div className="space-y-2">
                {wordSuggestions.map((suggestion, index) => (
                  <motion.div
                    key={index}
                    initial={{ x: -20, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/5 rounded-lg p-2 cursor-pointer hover:bg-white/10 transition-colors"
                    onClick={() => checkPronunciation(suggestion.word)}
                  >
                    <p className="text-white font-medium">{suggestion.word}</p>
                    <p className="text-xs text-white/60">{suggestion.translation}</p>
                    <p className="text-xs text-purple-300 mt-1">{suggestion.usage}</p>
                  </motion.div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-white/40 italic">Click "Help me" when you need word suggestions</p>
            )}
          </div>
        </motion.div>
      )}

      {/* Teacher Tips */}
      {role === 'teacher' && (
        <motion.div
          initial={{ x: -100, opacity: 0 }}
          animate={{ x: 0, opacity: 1 }}
          className="absolute left-4 bottom-24 pointer-events-auto"
        >
          <div className="bg-black/20 backdrop-blur-lg rounded-2xl p-4 border border-white/10 shadow-2xl max-w-xs">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-5 h-5 text-blue-400" />
              <h3 className="text-sm font-semibold text-white">Teaching Tips</h3>
            </div>
            
            <div className="space-y-2">
              {teacherTips.map((tip, index) => (
                <motion.div
                  key={index}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: index * 0.1 }}
                  className={cn(
                    "flex items-start gap-2 p-2 rounded-lg",
                    tip.priority === 'high' && "bg-red-500/10",
                    tip.priority === 'medium' && "bg-yellow-500/10",
                    tip.priority === 'low' && "bg-blue-500/10"
                  )}
                >
                  {tip.icon}
                  <p className="text-xs text-white">{tip.tip}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      )}

      {/* Grammar Correction Popup */}
      <AnimatePresence>
        {grammarCorrection && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute bottom-32 right-4 pointer-events-auto"
          >
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-green-500/30 shadow-2xl max-w-sm">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-4 h-4 text-green-400" />
                <h4 className="text-sm font-semibold text-white">Grammar Fix</h4>
              </div>
              <p className="text-xs text-red-300 line-through">{grammarCorrection.text}</p>
              <p className="text-sm text-green-300 mt-1">{grammarCorrection.correction}</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Pronunciation Guide */}
      <AnimatePresence>
        {pronunciationGuide && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            className="absolute bottom-48 left-1/2 -translate-x-1/2 pointer-events-auto"
          >
            <div className="bg-black/30 backdrop-blur-lg rounded-xl p-4 border border-purple-500/30 shadow-2xl">
              <div className="flex items-center gap-2 mb-2">
                <Volume2 className="w-4 h-4 text-purple-400" />
                <h4 className="text-sm font-semibold text-white">Pronunciation</h4>
              </div>
              <p className="text-lg text-white font-medium">{pronunciationGuide.word}</p>
              <p className="text-sm text-purple-300 mt-1">[{pronunciationGuide.phonetic}]</p>
              <div className="mt-2 space-y-1">
                {pronunciationGuide.tips.map((tip, index) => (
                  <p key={index} className="text-xs text-white/70 flex items-start gap-1">
                    <ChevronRight className="w-3 h-3 mt-0.5 text-purple-400" />
                    {tip}
                  </p>
                ))}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Feature Toggle Button */}
      <motion.div
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        className="absolute bottom-4 right-4 pointer-events-auto"
      >
        <button
          onClick={onClose}
          className="bg-black/30 backdrop-blur-lg rounded-full p-3 border border-white/10 shadow-2xl hover:bg-black/40 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>
      </motion.div>
    </div>
  );
}