import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  CheckCircle, 
  X, 
  Clock, 
  Users, 
  Target,
  Gamepad2,
  Trophy,
  Zap
} from 'lucide-react';
import { useSocket } from '@/hooks/use-socket';

interface LiveActivityGameProps {
  roomId: string;
  role: 'teacher' | 'student';
  isVisible: boolean;
  onClose: () => void;
}

interface GameActivity {
  type: 'poll' | 'gap-fill' | 'matching' | 'word-selection' | 'vocabulary-game';
  content: any;
  context: string;
  timeLimit?: number;
}

export function LiveActivityGame({ roomId, role, isVisible, onClose }: LiveActivityGameProps) {
  const { socket } = useSocket();
  const [currentActivity, setCurrentActivity] = useState<GameActivity | null>(null);
  const [userAnswer, setUserAnswer] = useState<any>(null);
  const [timeLeft, setTimeLeft] = useState(0);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [results, setResults] = useState<any>(null);

  useEffect(() => {
    if (!socket) return;

    // Create named handlers to prevent conflicts
    const handleLiveActivitySuggestion = (activity: GameActivity) => {
      if (role === 'teacher') {
        setCurrentActivity({ ...activity, timeLimit: 60 });
        console.log('🎯 New live activity generated:', activity.type);
      }
    };

    const handleActivityStarted = (activity: GameActivity) => {
      setCurrentActivity(activity);
      setTimeLeft(activity.timeLimit || 60);
      setIsSubmitted(false);
      setUserAnswer(null);
      setResults(null);
    };

    const handleActivityResults = (activityResults: any) => {
      setResults(activityResults);
      setIsSubmitted(true);
    };

    // Register listeners
    socket.on('live-activity-suggestion', handleLiveActivitySuggestion);
    socket.on('activity-started', handleActivityStarted);
    socket.on('activity-results', handleActivityResults);

    return () => {
      // Clean up with specific handlers
      socket.off('live-activity-suggestion', handleLiveActivitySuggestion);
      socket.off('activity-started', handleActivityStarted);  
      socket.off('activity-results', handleActivityResults);
    };
  }, [socket, role]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && currentActivity && !isSubmitted) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && currentActivity && !isSubmitted && role === 'student') {
      handleSubmit();
    }
  }, [timeLeft, currentActivity, isSubmitted, role]);

  const startActivity = () => {
    if (currentActivity && role === 'teacher') {
      socket?.emit('start-activity', {
        roomId,
        activity: currentActivity
      });
    }
  };

  const handleSubmit = () => {
    if (userAnswer !== null && currentActivity) {
      socket?.emit('submit-activity-answer', {
        roomId,
        activityType: currentActivity.type,
        answer: userAnswer
      });
      setIsSubmitted(true);
    }
  };

  const handleAnswerSelect = (answer: any) => {
    if (!isSubmitted) {
      setUserAnswer(answer);
    }
  };

  const renderActivity = () => {
    if (!currentActivity) return null;

    switch (currentActivity.type) {
      case 'poll':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">{currentActivity.content.question}</h3>
            <div className="space-y-2">
              {currentActivity.content.options.map((option: string, index: number) => (
                <Button
                  key={index}
                  variant={userAnswer === index ? "secondary" : "outline"}
                  className="w-full text-left justify-start"
                  onClick={() => handleAnswerSelect(index)}
                  disabled={isSubmitted}
                >
                  {option}
                </Button>
              ))}
            </div>
          </div>
        );

      case 'gap-fill':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">{currentActivity.content.title}</h3>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-white text-lg mb-4">{currentActivity.content.sentence}</p>
              <div className="grid grid-cols-2 gap-2">
                {currentActivity.content.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "secondary" : "outline"}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isSubmitted}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'word-selection':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">{currentActivity.content.title}</h3>
            <div className="bg-white/10 p-4 rounded-lg">
              <p className="text-white text-lg mb-4">{currentActivity.content.sentence}</p>
              <div className="flex gap-2 flex-wrap">
                {currentActivity.content.options.map((option: string, index: number) => (
                  <Button
                    key={index}
                    variant={userAnswer === option ? "secondary" : "outline"}
                    onClick={() => handleAnswerSelect(option)}
                    disabled={isSubmitted}
                  >
                    {option}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        );

      case 'matching':
        return (
          <div className="space-y-4">
            <h3 className="text-xl font-semibold text-white">{currentActivity.content.title}</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {currentActivity.content.items.map((item: any, index: number) => (
                <Card key={index} className="bg-white/10 border-white/20">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <span className="text-white font-medium">{item.word}</span>
                      <Badge variant="secondary">{item.match}</Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  const renderResults = () => {
    if (!results) return null;

    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="text-center">
          <div className="flex items-center justify-center mb-2">
            {results.correct ? (
              <CheckCircle className="w-8 h-8 text-green-400" />
            ) : (
              <X className="w-8 h-8 text-red-400" />
            )}
          </div>
          <h3 className="text-xl font-semibold text-white">
            {results.correct ? '🎉 Correct!' : '❌ Try Again!'}
          </h3>
          {results.explanation && (
            <p className="text-white/80 mt-2">{results.explanation}</p>
          )}
        </div>
      </motion.div>
    );
  };

  if (!isVisible || !currentActivity) return null;

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        className="bg-gradient-to-br from-purple-600 to-blue-600 rounded-2xl p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto"
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <Gamepad2 className="w-6 h-6 text-white" />
            <div>
              <h2 className="text-xl font-bold text-white">Live Activity</h2>
              <p className="text-white/60 text-sm">
                {currentActivity.context}
              </p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {role === 'teacher' && !isSubmitted && (
              <Button 
                onClick={startActivity}
                variant="secondary"
                size="sm"
              >
                <Zap className="w-4 h-4 mr-2" />
                Start Activity
              </Button>
            )}
            
            {timeLeft > 0 && (
              <div className="flex items-center gap-2 text-white">
                <Clock className="w-4 h-4" />
                <span className="font-mono">{timeLeft}s</span>
              </div>
            )}
            
            <Button
              onClick={onClose}
              variant="ghost"
              size="sm"
              className="text-white hover:text-white"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Timer Progress */}
        {timeLeft > 0 && currentActivity.timeLimit && (
          <Progress 
            value={(timeLeft / currentActivity.timeLimit) * 100} 
            className="mb-6"
          />
        )}

        {/* Activity Content */}
        {isSubmitted && results ? renderResults() : renderActivity()}

        {/* Submit Button */}
        {role === 'student' && !isSubmitted && userAnswer !== null && (
          <div className="mt-6 text-center">
            <Button 
              onClick={handleSubmit}
              size="lg"
              className="bg-white text-purple-600 hover:bg-white/90"
            >
              <Trophy className="w-4 h-4 mr-2" />
              Submit Answer
            </Button>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}