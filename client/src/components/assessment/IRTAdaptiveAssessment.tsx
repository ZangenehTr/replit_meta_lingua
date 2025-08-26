import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, Target, TrendingUp, TrendingDown, BarChart3, 
  CheckCircle2, XCircle, Clock, Award, AlertCircle 
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface Question {
  id: string;
  text: string;
  type: 'multiple_choice' | 'true_false' | 'short_answer' | 'fill_blank';
  options?: string[];
  difficulty: number; // -3 to +3 (IRT difficulty parameter)
  discrimination: number; // 0.5 to 2.5 (IRT discrimination parameter)
  category: string;
  cefrLevel: string;
  timeLimit?: number; // seconds
}

interface TestSession {
  id: string;
  studentId: number;
  currentQuestionIndex: number;
  questions: Question[];
  responses: Response[];
  ability: number; // Current estimated ability (-3 to +3)
  standardError: number;
  startTime: Date;
  endTime?: Date;
  status: 'in_progress' | 'completed' | 'abandoned';
}

interface Response {
  questionId: string;
  answer: string;
  correct: boolean;
  responseTime: number;
  difficulty: number;
}

export function IRTAdaptiveAssessment({ 
  studentId, 
  testType = 'placement',
  onComplete 
}: { 
  studentId: number; 
  testType?: 'placement' | 'progress' | 'diagnostic';
  onComplete?: (result: any) => void;
}) {
  const { toast } = useToast();
  const [session, setSession] = useState<TestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<Question | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [questionStartTime, setQuestionStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);

  // Start test session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('/api/assessment/irt/start', {
        method: 'POST',
        body: JSON.stringify({ studentId, testType }),
      });
    },
    onSuccess: (data) => {
      setSession(data);
      if (data.questions?.length > 0) {
        setCurrentQuestion(data.questions[0]);
        setQuestionStartTime(Date.now());
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to start assessment. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Submit answer and get next question
  const submitAnswerMutation = useMutation({
    mutationFn: async (answer: string) => {
      const responseTime = (Date.now() - questionStartTime) / 1000;
      
      return apiRequest('/api/assessment/irt/submit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId: session?.id,
          questionId: currentQuestion?.id,
          answer,
          responseTime,
        }),
      });
    },
    onSuccess: (data) => {
      setIsCorrect(data.correct);
      setShowFeedback(true);
      
      // Update session with new ability estimate
      if (session) {
        setSession({
          ...session,
          ability: data.newAbility,
          standardError: data.standardError,
          responses: [...session.responses, data.response],
        });
      }

      // Move to next question after feedback
      setTimeout(() => {
        if (data.nextQuestion) {
          setCurrentQuestion(data.nextQuestion);
          setSelectedAnswer("");
          setShowFeedback(false);
          setIsCorrect(null);
          setQuestionStartTime(Date.now());
        } else {
          // Test complete
          completeTest();
        }
      }, 2000);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit answer. Please try again.",
        variant: "destructive",
      });
    },
  });

  // Complete test and get results
  const completeTest = async () => {
    try {
      const result = await apiRequest('/api/assessment/irt/complete', {
        method: 'POST',
        body: JSON.stringify({ sessionId: session?.id }),
      });

      toast({
        title: "Assessment Complete!",
        description: `Your estimated level: ${result.cefrLevel}`,
      });

      if (onComplete) {
        onComplete(result);
      }
    } catch (error) {
      console.error('Error completing test:', error);
    }
  };

  // Timer for time-limited questions
  useEffect(() => {
    if (!currentQuestion?.timeLimit) return;

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          // Auto-submit when time runs out
          handleSubmit();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentQuestion]);

  // Reset timer when question changes
  useEffect(() => {
    if (currentQuestion?.timeLimit) {
      setTimeRemaining(currentQuestion.timeLimit);
    }
  }, [currentQuestion]);

  const handleSubmit = () => {
    if (!selectedAnswer && currentQuestion?.type !== 'short_answer') {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }

    submitAnswerMutation.mutate(selectedAnswer);
  };

  const getAbilityDescription = (ability: number): string => {
    if (ability < -2) return "Beginner (A1)";
    if (ability < -1) return "Elementary (A2)";
    if (ability < 0) return "Pre-Intermediate (B1)";
    if (ability < 1) return "Intermediate (B2)";
    if (ability < 2) return "Upper-Intermediate (C1)";
    return "Advanced (C2)";
  };

  const getDifficultyBadge = (difficulty: number) => {
    const variants: Record<string, any> = {
      easy: { color: "bg-green-100 text-green-800", icon: TrendingDown },
      medium: { color: "bg-yellow-100 text-yellow-800", icon: BarChart3 },
      hard: { color: "bg-red-100 text-red-800", icon: TrendingUp },
    };

    const level = difficulty < -1 ? 'easy' : difficulty > 1 ? 'hard' : 'medium';
    const { color, icon: Icon } = variants[level];

    return (
      <Badge className={color}>
        <Icon className="h-3 w-3 mr-1" />
        {level.charAt(0).toUpperCase() + level.slice(1)}
      </Badge>
    );
  };

  if (!session && !startSessionMutation.isPending) {
    return (
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            IRT Adaptive Assessment
          </CardTitle>
          <CardDescription>
            This adaptive test adjusts question difficulty based on your performance to accurately determine your level.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              The test will take approximately 20-30 minutes. Questions will become easier or harder based on your answers.
            </AlertDescription>
          </Alert>
          
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="h-5 w-5 text-green-600" />
              <span>Personalized difficulty adjustment</span>
            </div>
            <div className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-600" />
              <span>Accurate level assessment</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-5 w-5 text-orange-600" />
              <span>Time-tracked responses</span>
            </div>
          </div>

          <Button 
            onClick={() => startSessionMutation.mutate()} 
            className="w-full"
            disabled={startSessionMutation.isPending}
          >
            {startSessionMutation.isPending ? "Starting..." : "Start Assessment"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  if (!currentQuestion) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  const questionNumber = (session?.currentQuestionIndex || 0) + 1;
  const totalQuestions = session?.questions?.length || 20;
  const progress = (questionNumber / totalQuestions) * 100;

  return (
    <Card className="max-w-3xl mx-auto">
      <CardHeader>
        <div className="flex justify-between items-center mb-4">
          <CardTitle className="flex items-center gap-2">
            <Brain className="h-6 w-6" />
            Question {questionNumber} of {totalQuestions}
          </CardTitle>
          <div className="flex items-center gap-3">
            {getDifficultyBadge(currentQuestion.difficulty)}
            {currentQuestion.timeLimit && (
              <Badge variant={timeRemaining < 10 ? "destructive" : "secondary"}>
                <Clock className="h-3 w-3 mr-1" />
                {timeRemaining}s
              </Badge>
            )}
          </div>
        </div>
        
        <Progress value={progress} className="h-2" />
        
        {session && (
          <div className="mt-3 flex justify-between text-sm text-muted-foreground">
            <span>Current Level: {getAbilityDescription(session.ability)}</span>
            <span>Accuracy: {Math.round((session.ability + 3) * 16.67)}%</span>
          </div>
        )}
      </CardHeader>
      
      <CardContent className="space-y-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentQuestion.id}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-4"
          >
            <div className="text-lg font-medium">
              {currentQuestion.text}
            </div>

            {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showFeedback}
              >
                {currentQuestion.options.map((option, index) => (
                  <div 
                    key={index} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      showFeedback && option === selectedAnswer
                        ? isCorrect 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  >
                    <RadioGroupItem value={option} id={`option-${index}`} />
                    <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                    {showFeedback && option === selectedAnswer && (
                      isCorrect ? 
                        <CheckCircle2 className="h-5 w-5 text-green-600" /> :
                        <XCircle className="h-5 w-5 text-red-600" />
                    )}
                  </div>
                ))}
              </RadioGroup>
            )}

            {currentQuestion.type === 'true_false' && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showFeedback}
              >
                {['True', 'False'].map((option) => (
                  <div 
                    key={option} 
                    className={`flex items-center space-x-2 p-3 rounded-lg border ${
                      showFeedback && option === selectedAnswer
                        ? isCorrect 
                          ? 'border-green-500 bg-green-50' 
                          : 'border-red-500 bg-red-50'
                        : ''
                    }`}
                  >
                    <RadioGroupItem value={option} id={option} />
                    <Label htmlFor={option} className="flex-1 cursor-pointer">
                      {option}
                    </Label>
                  </div>
                ))}
              </RadioGroup>
            )}

            {(currentQuestion.type === 'short_answer' || currentQuestion.type === 'fill_blank') && (
              <Textarea
                value={selectedAnswer}
                onChange={(e) => setSelectedAnswer(e.target.value)}
                placeholder="Type your answer here..."
                disabled={showFeedback}
                className="min-h-[100px]"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {showFeedback && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`p-4 rounded-lg ${
              isCorrect ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'
            }`}
          >
            <div className="flex items-center gap-2">
              {isCorrect ? (
                <>
                  <CheckCircle2 className="h-5 w-5" />
                  <span className="font-medium">Correct!</span>
                </>
              ) : (
                <>
                  <XCircle className="h-5 w-5" />
                  <span className="font-medium">Incorrect</span>
                </>
              )}
            </div>
            <p className="text-sm mt-1">
              {isCorrect 
                ? "Great job! Moving to the next question..." 
                : "Don't worry, let's try another question."}
            </p>
          </motion.div>
        )}

        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={() => {
              if (confirm("Are you sure you want to abandon this test?")) {
                completeTest();
              }
            }}
          >
            End Test
          </Button>
          
          <Button 
            onClick={handleSubmit}
            disabled={showFeedback || submitAnswerMutation.isPending || (!selectedAnswer && currentQuestion.type !== 'short_answer')}
          >
            {submitAnswerMutation.isPending ? "Submitting..." : "Submit Answer"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}