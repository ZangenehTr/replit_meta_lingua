// client/src/components/callern/SessionQuizTaker.tsx
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  BookOpen, 
  CheckCircle, 
  XCircle, 
  Clock, 
  ArrowRight, 
  ArrowLeft,
  Award,
  Brain,
  Target,
  Sparkles,
  TrendingUp,
  GraduationCap
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';

interface Quiz {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalPoints: number;
  estimatedTime: number;
  targetLevel: string;
  topics: string[];
}

interface QuizQuestion {
  id: string;
  type: 'multiple_choice' | 'true_false' | 'fill_blank' | 'short_answer' | 'matching' | 'ordering';
  difficulty: 'easy' | 'medium' | 'hard';
  question: string;
  options?: string[];
  correctAnswer?: string | string[];
  explanation?: string;
  points: number;
  tags: string[];
  cefrLevel?: string;
}

interface QuizAnswer {
  questionId: string;
  answer: string | string[];
  timeSpent: number;
}

interface SessionQuizTakerProps {
  sessionId: string;
  onComplete?: (result: any) => void;
}

export function SessionQuizTaker({ sessionId, onComplete }: SessionQuizTakerProps) {
  const { toast } = useToast();
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Map<string, QuizAnswer>>(new Map());
  const [currentAnswer, setCurrentAnswer] = useState<string | string[]>('');
  const [timeStarted, setTimeStarted] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isReviewing, setIsReviewing] = useState(false);
  const [quizResult, setQuizResult] = useState<any>(null);
  const [elapsedTime, setElapsedTime] = useState(0);

  // Fetch quiz for session
  const { data: quiz, isLoading } = useQuery({
    queryKey: [`/api/callern/sessions/${sessionId}/quiz`],
    queryFn: async () => {
      const response = await apiRequest(`/api/callern/sessions/${sessionId}/quiz`, 'GET');
      setTimeStarted(Date.now());
      setQuestionStartTime(Date.now());
      return response;
    },
    enabled: !!sessionId
  });

  // Timer effect
  useEffect(() => {
    if (!quiz || isReviewing) return;
    
    const timer = setInterval(() => {
      setElapsedTime(Math.floor((Date.now() - timeStarted) / 1000));
    }, 1000);

    return () => clearInterval(timer);
  }, [quiz, timeStarted, isReviewing]);

  // Submit quiz mutation
  const submitMutation = useMutation({
    mutationFn: async (finalAnswers: QuizAnswer[]) => {
      return apiRequest(`/api/callern/quiz/${quiz.id}/submit`, 'POST', {
        answers: finalAnswers
      });
    },
    onSuccess: (result) => {
      setQuizResult(result);
      setIsReviewing(true);
      
      // Update student XP
      queryClient.invalidateQueries({ queryKey: ['/api/student/stats'] });
      
      toast({
        title: "Quiz Completed!",
        description: `You scored ${result.score}/${result.totalPoints} points and earned ${result.xpGained} XP!`,
        className: "bg-green-500 text-white"
      });

      if (onComplete) {
        onComplete(result);
      }
    },
    onError: () => {
      toast({
        title: "Submission Error",
        description: "Failed to submit quiz. Please try again.",
        variant: "destructive"
      });
    }
  });

  if (isLoading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <Brain className="w-16 h-16 text-purple-500 animate-pulse mx-auto" />
            <p className="text-lg">Generating quiz from session content...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!quiz || quiz.questions.length === 0) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="flex items-center justify-center h-96">
          <div className="text-center space-y-4">
            <BookOpen className="w-16 h-16 text-gray-400 mx-auto" />
            <p className="text-lg text-gray-600">No quiz available for this session yet</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const currentQuestion = quiz.questions[currentQuestionIndex];
  const isLastQuestion = currentQuestionIndex === quiz.questions.length - 1;
  const progress = ((currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleNext = () => {
    // Save current answer with time spent
    if (currentAnswer) {
      const timeSpent = Math.floor((Date.now() - questionStartTime) / 1000);
      answers.set(currentQuestion.id, {
        questionId: currentQuestion.id,
        answer: currentAnswer,
        timeSpent
      });
    }

    if (isLastQuestion) {
      // Submit quiz
      const finalAnswers = Array.from(answers.values());
      submitMutation.mutate(finalAnswers);
    } else {
      // Move to next question
      setCurrentQuestionIndex(prev => prev + 1);
      setCurrentAnswer('');
      setQuestionStartTime(Date.now());
    }
  };

  const handlePrevious = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex(prev => prev - 1);
      const prevAnswer = answers.get(quiz.questions[currentQuestionIndex - 1].id);
      setCurrentAnswer(prevAnswer?.answer || '');
      setQuestionStartTime(Date.now());
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'easy': return 'bg-green-500';
      case 'medium': return 'bg-yellow-500';
      case 'hard': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  // Render quiz results
  if (isReviewing && quizResult) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Quiz Results
            </span>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {quizResult.score}/{quizResult.totalPoints} Points
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Score Summary */}
          <div className="grid grid-cols-3 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">
                {Math.round((quizResult.score / quizResult.totalPoints) * 100)}%
              </div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
            </div>
            <div className="text-center p-4 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <TrendingUp className="w-8 h-8 text-green-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">+{quizResult.xpGained}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">XP Earned</p>
            </div>
            <div className="text-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
              <Clock className="w-8 h-8 text-purple-500 mx-auto mb-2" />
              <div className="text-2xl font-bold">{formatTime(elapsedTime)}</div>
              <p className="text-sm text-gray-600 dark:text-gray-400">Time Taken</p>
            </div>
          </div>

          {/* Question Review */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Question Review</h3>
            {quiz.questions.map((question, idx) => {
              const userAnswer = quizResult.answers.find((a: any) => a.questionId === question.id);
              const isCorrect = userAnswer?.isCorrect;
              
              return (
                <motion.div
                  key={question.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.1 }}
                  className={cn(
                    "p-4 rounded-lg border",
                    isCorrect ? "bg-green-50 border-green-200 dark:bg-green-900/20" : "bg-red-50 border-red-200 dark:bg-red-900/20"
                  )}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        {isCorrect ? (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-red-500" />
                        )}
                        <span className="font-medium">Question {idx + 1}</span>
                        <Badge className={cn("ml-2", getDifficultyColor(question.difficulty))}>
                          {question.difficulty}
                        </Badge>
                      </div>
                      <p className="mb-2">{question.question}</p>
                      <div className="space-y-1 text-sm">
                        <p>
                          <span className="font-medium">Your answer:</span> {userAnswer?.answer || 'Not answered'}
                        </p>
                        {!isCorrect && (
                          <p>
                            <span className="font-medium">Correct answer:</span> {question.correctAnswer}
                          </p>
                        )}
                        {question.explanation && (
                          <p className="mt-2 text-gray-600 dark:text-gray-400 italic">
                            {question.explanation}
                          </p>
                        )}
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge variant="outline">
                        {isCorrect ? question.points : 0}/{question.points} pts
                      </Badge>
                    </div>
                  </div>
                </motion.div>
              );
            })}
          </div>

          {/* Action Buttons */}
          <div className="flex justify-center gap-4">
            <Button variant="outline" onClick={() => window.location.reload()}>
              Try Another Quiz
            </Button>
            <Button onClick={() => onComplete?.(quizResult)}>
              Continue Learning
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Render current question
  return (
    <Card className="w-full max-w-4xl mx-auto">
      <CardHeader>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="w-5 h-5" />
              {quiz.title}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline" className="flex items-center gap-1">
                <Clock className="w-3 h-3" />
                {formatTime(elapsedTime)}
              </Badge>
              <Badge className={cn(getDifficultyColor(currentQuestion.difficulty))}>
                {currentQuestion.difficulty}
              </Badge>
            </div>
          </div>
          <Progress value={progress} className="h-2" />
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
            <span>Question {currentQuestionIndex + 1} of {quiz.questions.length}</span>
            <span>{currentQuestion.points} points</span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Question */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium">{currentQuestion.question}</h3>
          
          {/* Render based on question type */}
          {currentQuestion.questionType === 'multiple_choice' && currentQuestion.options && (
            <RadioGroup value={currentAnswer as string} onValueChange={setCurrentAnswer}>
              <div className="space-y-3">
                {currentQuestion.options.map((option, idx) => (
                  <motion.div
                    key={idx}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: idx * 0.1 }}
                    className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                  >
                    <RadioGroupItem value={option} id={`option-${idx}`} />
                    <Label htmlFor={`option-${idx}`} className="cursor-pointer flex-1">
                      {option}
                    </Label>
                  </motion.div>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion.questionType === 'true_false' && (
            <RadioGroup value={currentAnswer as string} onValueChange={setCurrentAnswer}>
              <div className="space-y-3">
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <RadioGroupItem value="true" id="true" />
                  <Label htmlFor="true" className="cursor-pointer flex-1">True</Label>
                </motion.div>
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.1 }}
                  className="flex items-center space-x-2 p-3 rounded-lg border hover:bg-gray-50 dark:hover:bg-gray-800"
                >
                  <RadioGroupItem value="false" id="false" />
                  <Label htmlFor="false" className="cursor-pointer flex-1">False</Label>
                </motion.div>
              </div>
            </RadioGroup>
          )}

          {currentQuestion.questionType === 'fill_blank' && (
            <Input
              value={currentAnswer as string}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full"
            />
          )}

          {currentQuestion.questionType === 'short_answer' && (
            <Textarea
              value={currentAnswer as string}
              onChange={(e) => setCurrentAnswer(e.target.value)}
              placeholder="Type your answer here..."
              className="w-full min-h-[100px]"
            />
          )}

          {/* CEFR Level indicator */}
          {currentQuestion.cefrLevel && (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <GraduationCap className="w-4 h-4" />
              <span>Level: {currentQuestion.cefrLevel}</span>
            </div>
          )}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={currentQuestionIndex === 0}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Previous
          </Button>
          <Button
            onClick={handleNext}
            disabled={!currentAnswer || submitMutation.isPending}
          >
            {isLastQuestion ? (
              <>
                Submit Quiz
                <Sparkles className="w-4 h-4 ml-2" />
              </>
            ) : (
              <>
                Next
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}