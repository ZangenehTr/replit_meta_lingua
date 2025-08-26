// client/src/components/callern/PostSessionQuizModal.tsx
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  BookOpen, 
  Sparkles, 
  CheckCircle,
  X,
  Loader2,
  ArrowRight,
  Award
} from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SessionQuizTaker } from './SessionQuizTaker';

interface PostSessionQuizModalProps {
  isOpen: boolean;
  onClose: () => void;
  sessionId: string;
  sessionDuration: number;
  sessionData?: {
    vocabulary?: string[];
    topics?: string[];
    corrections?: string[];
    studentLevel?: string;
  };
  role: 'student' | 'teacher';
}

export function PostSessionQuizModal({
  isOpen,
  onClose,
  sessionId,
  sessionDuration,
  sessionData,
  role
}: PostSessionQuizModalProps) {
  const { toast } = useToast();
  const [step, setStep] = useState<'prompt' | 'generating' | 'ready' | 'taking'>('prompt');
  const [generatedQuiz, setGeneratedQuiz] = useState<any>(null);

  // Generate quiz mutation
  const generateQuizMutation = useMutation({
    mutationFn: async () => {
      return apiRequest(`/api/callern/sessions/${sessionId}/generate-quiz`, 'POST', {
        vocabulary: sessionData?.vocabulary || [],
        topics: sessionData?.topics || [],
        corrections: sessionData?.corrections || [],
        studentLevel: sessionData?.studentLevel || 'B1',
        grammarPoints: []
      });
    },
    onSuccess: (quiz) => {
      setGeneratedQuiz(quiz);
      setStep('ready');
      toast({
        title: "Quiz Generated!",
        description: `Created ${quiz.questions?.length || 0} questions based on your session`,
        className: "bg-green-500 text-white"
      });
    },
    onError: () => {
      toast({
        title: "Generation Failed",
        description: "Failed to generate quiz. Please try again.",
        variant: "destructive"
      });
      setStep('prompt');
    }
  });

  const handleGenerateQuiz = () => {
    setStep('generating');
    generateQuizMutation.mutate();
  };

  const handleStartQuiz = () => {
    setStep('taking');
  };

  const handleQuizComplete = (result: any) => {
    toast({
      title: "Quiz Completed!",
      description: `You scored ${result.score}/${result.totalPoints} points!`,
      className: "bg-green-500 text-white"
    });
    
    // Refresh student stats
    queryClient.invalidateQueries({ queryKey: ['/api/student/stats'] });
    
    onClose();
  };

  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    return `${mins} minutes`;
  };

  if (step === 'taking' && generatedQuiz) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <Button
              variant="ghost"
              size="icon"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </DialogHeader>
          <SessionQuizTaker 
            sessionId={sessionId}
            onComplete={handleQuizComplete}
          />
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Session Complete!
          </DialogTitle>
          <DialogDescription>
            Great job on your {formatDuration(sessionDuration)} session!
          </DialogDescription>
        </DialogHeader>

        <AnimatePresence mode="wait">
          {step === 'prompt' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              {/* Session Summary */}
              <Card className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20">
                <CardContent className="p-6">
                  <h3 className="font-semibold mb-4">Session Summary</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex items-center gap-2">
                      <BookOpen className="w-4 h-4 text-blue-500" />
                      <span className="text-sm">
                        {sessionData?.vocabulary?.length || 0} new words
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <CheckCircle className="w-4 h-4 text-green-500" />
                      <span className="text-sm">
                        {sessionData?.corrections?.length || 0} corrections
                      </span>
                    </div>
                    {sessionData?.topics && sessionData.topics.length > 0 && (
                      <div className="col-span-2">
                        <div className="flex flex-wrap gap-2 mt-2">
                          {sessionData.topics.map((topic, idx) => (
                            <Badge key={idx} variant="secondary">
                              {topic}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Quiz Generation Prompt */}
              {role === 'student' && (
                <Card className="border-2 border-purple-200 dark:border-purple-800">
                  <CardContent className="p-6 text-center">
                    <Award className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="font-semibold text-lg mb-2">
                      Test Your Knowledge!
                    </h3>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                      Generate a personalized quiz based on what you just learned.
                      Practice the vocabulary and concepts from this session.
                    </p>
                    <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400 mb-6">
                      <Sparkles className="w-4 h-4" />
                      <span>Earn XP points for correct answers!</span>
                    </div>
                    <Button 
                      onClick={handleGenerateQuiz}
                      size="lg"
                      className="w-full"
                    >
                      Generate Quiz
                      <ArrowRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* Skip Option */}
              <div className="flex justify-center">
                <Button variant="ghost" onClick={onClose}>
                  Skip for Now
                </Button>
              </div>
            </motion.div>
          )}

          {step === 'generating' && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="py-12"
            >
              <div className="text-center space-y-4">
                <div className="relative">
                  <Brain className="w-20 h-20 text-purple-500 mx-auto animate-pulse" />
                  <Loader2 className="w-8 h-8 text-purple-600 animate-spin absolute bottom-0 right-1/3" />
                </div>
                <h3 className="text-lg font-semibold">
                  Generating Your Personalized Quiz...
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Creating questions based on your session content
                </p>
                <div className="flex justify-center gap-1">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      className="w-2 h-2 bg-purple-500 rounded-full"
                      animate={{
                        scale: [1, 1.5, 1],
                        opacity: [0.5, 1, 0.5]
                      }}
                      transition={{
                        duration: 1.5,
                        repeat: Infinity,
                        delay: i * 0.2
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}

          {step === 'ready' && generatedQuiz && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="space-y-6"
            >
              <Card className="bg-gradient-to-r from-green-50 to-blue-50 dark:from-green-900/20 dark:to-blue-900/20">
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-semibold text-lg mb-2">
                        {generatedQuiz.title}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {generatedQuiz.description}
                      </p>
                    </div>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                  </div>

                  <div className="grid grid-cols-3 gap-4 mt-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {generatedQuiz.questions?.length || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Questions</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {generatedQuiz.totalPoints || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Total Points</p>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {generatedQuiz.estimatedTime || 0}
                      </div>
                      <p className="text-xs text-gray-600 dark:text-gray-400">Minutes</p>
                    </div>
                  </div>

                  {generatedQuiz.topics && generatedQuiz.topics.length > 0 && (
                    <div className="mt-4">
                      <p className="text-sm font-medium mb-2">Topics Covered:</p>
                      <div className="flex flex-wrap gap-2">
                        {generatedQuiz.topics.map((topic: string, idx: number) => (
                          <Badge key={idx} variant="outline">
                            {topic}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>

              <div className="flex gap-3">
                <Button 
                  variant="outline" 
                  onClick={onClose}
                  className="flex-1"
                >
                  Save for Later
                </Button>
                <Button 
                  onClick={handleStartQuiz}
                  className="flex-1"
                >
                  Start Quiz
                  <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}