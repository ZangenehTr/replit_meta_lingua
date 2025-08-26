import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation, useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, Sparkles, Target, TrendingUp, BookOpen, 
  MessageSquare, HelpCircle, CheckCircle2, XCircle,
  Clock, Lightbulb, RefreshCw, ChevronRight
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface AdaptiveContentProps {
  sessionId: string;
  studentId: number;
  teacherId: number;
  studentLevel: string;
  onContentGenerated?: (content: any) => void;
  onExerciseComplete?: (result: any) => void;
}

interface GeneratedContent {
  type: 'exercise' | 'question' | 'explanation' | 'challenge';
  difficulty: number;
  content: {
    text: string;
    options?: string[];
    correctAnswer?: string;
    hints?: string[];
    explanation?: string;
    visualAid?: string;
  };
  targetSkill: string;
  estimatedTime: number;
  adaptationReason: string;
}

interface SessionMetrics {
  correctAnswers: number;
  totalQuestions: number;
  averageResponseTime: number;
  engagementLevel: number;
  confidenceScore: number;
  recentTopics: string[];
}

export function AdaptiveContentPanel({
  sessionId,
  studentId,
  teacherId,
  studentLevel,
  onContentGenerated,
  onExerciseComplete
}: AdaptiveContentProps) {
  const { toast } = useToast();
  const [currentContent, setCurrentContent] = useState<GeneratedContent | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>("");
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [sessionMetrics, setSessionMetrics] = useState<SessionMetrics>({
    correctAnswers: 0,
    totalQuestions: 0,
    averageResponseTime: 0,
    engagementLevel: 75,
    confidenceScore: 0.6,
    recentTopics: []
  });
  const [responseStartTime, setResponseStartTime] = useState<number>(Date.now());
  const [timeRemaining, setTimeRemaining] = useState<number>(60);
  const [autoGenerate, setAutoGenerate] = useState(true);
  const [contentHistory, setContentHistory] = useState<GeneratedContent[]>([]);

  // Generate adaptive content
  const generateContentMutation = useMutation({
    mutationFn: async (contentType: string) => {
      return apiRequest('/api/callern/adaptive-content/generate', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          studentId,
          contentType,
          sessionMetrics,
          currentLevel: studentLevel
        }),
      });
    },
    onSuccess: (data) => {
      setCurrentContent(data);
      setContentHistory(prev => [...prev, data]);
      setResponseStartTime(Date.now());
      setTimeRemaining(data.estimatedTime || 60);
      setSelectedAnswer("");
      setShowFeedback(false);
      setIsCorrect(null);
      
      if (onContentGenerated) {
        onContentGenerated(data);
      }

      toast({
        title: "New Content Generated",
        description: data.adaptationReason,
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate adaptive content",
        variant: "destructive",
      });
    },
  });

  // Submit answer
  const submitAnswerMutation = useMutation({
    mutationFn: async () => {
      const responseTime = (Date.now() - responseStartTime) / 1000;
      
      return apiRequest('/api/callern/adaptive-content/submit', {
        method: 'POST',
        body: JSON.stringify({
          sessionId,
          studentId,
          contentId: currentContent?.targetSkill,
          answer: selectedAnswer,
          responseTime,
          isCorrect: selectedAnswer === currentContent?.content.correctAnswer
        }),
      });
    },
    onSuccess: (data) => {
      const correct = data.isCorrect || selectedAnswer === currentContent?.content.correctAnswer;
      setIsCorrect(correct);
      setShowFeedback(true);

      // Update metrics
      setSessionMetrics(prev => ({
        ...prev,
        correctAnswers: prev.correctAnswers + (correct ? 1 : 0),
        totalQuestions: prev.totalQuestions + 1,
        averageResponseTime: 
          (prev.averageResponseTime * prev.totalQuestions + (Date.now() - responseStartTime) / 1000) / 
          (prev.totalQuestions + 1),
        confidenceScore: data.newConfidence || prev.confidenceScore
      }));

      if (onExerciseComplete) {
        onExerciseComplete({
          correct,
          responseTime: (Date.now() - responseStartTime) / 1000,
          content: currentContent
        });
      }

      // Auto-generate next content after feedback
      if (autoGenerate) {
        setTimeout(() => {
          generateContentMutation.mutate('exercise');
        }, 3000);
      }
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to submit answer",
        variant: "destructive",
      });
    },
  });

  // Timer for time-limited content
  useEffect(() => {
    if (!currentContent || showFeedback) return;

    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1) {
          if (currentContent.type === 'exercise' && !showFeedback) {
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentContent, showFeedback]);

  // Get student performance data
  const { data: performanceData } = useQuery({
    queryKey: [`/api/students/${studentId}/performance`],
    refetchInterval: 30000, // Refresh every 30 seconds
    onSuccess: (data) => {
      if (data?.engagementLevel !== undefined) {
        setSessionMetrics(prev => ({
          ...prev,
          engagementLevel: data.engagementLevel
        }));
      }
    }
  });

  const handleSubmit = () => {
    if (!selectedAnswer && currentContent?.content.options) {
      toast({
        title: "Please select an answer",
        variant: "destructive",
      });
      return;
    }

    submitAnswerMutation.mutate();
  };

  const getDifficultyBadge = (difficulty: number) => {
    const level = difficulty < -1 ? 'Easy' : difficulty < 1 ? 'Medium' : 'Hard';
    const color = difficulty < -1 ? 'bg-green-100 text-green-800' : 
                  difficulty < 1 ? 'bg-yellow-100 text-yellow-800' : 
                  'bg-red-100 text-red-800';
    
    return <Badge className={color}>{level}</Badge>;
  };

  const getSkillIcon = (skill: string) => {
    if (skill.includes('vocabulary')) return <BookOpen className="h-4 w-4" />;
    if (skill.includes('grammar')) return <Target className="h-4 w-4" />;
    if (skill.includes('conversation')) return <MessageSquare className="h-4 w-4" />;
    return <Brain className="h-4 w-4" />;
  };

  return (
    <div className="space-y-4">
      {/* Performance Overview */}
      <Card className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950 dark:to-purple-950">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Adaptive Learning Active
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-3 gap-4 text-sm">
            <div>
              <div className="text-muted-foreground">Accuracy</div>
              <div className="font-semibold">
                {sessionMetrics.totalQuestions > 0 
                  ? Math.round((sessionMetrics.correctAnswers / sessionMetrics.totalQuestions) * 100)
                  : 0}%
              </div>
            </div>
            <div>
              <div className="text-muted-foreground">Engagement</div>
              <div className="font-semibold">{sessionMetrics.engagementLevel}%</div>
            </div>
            <div>
              <div className="text-muted-foreground">Level</div>
              <div className="font-semibold">{studentLevel}</div>
            </div>
          </div>
          
          <Progress 
            value={sessionMetrics.confidenceScore * 100} 
            className="mt-3 h-2"
          />
          <div className="text-xs text-muted-foreground mt-1">
            Confidence Score: {Math.round(sessionMetrics.confidenceScore * 100)}%
          </div>
        </CardContent>
      </Card>

      {/* Content Generation Controls */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-sm flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Generate Content
            </span>
            <div className="flex items-center gap-2">
              <Label htmlFor="auto-generate" className="text-xs">Auto</Label>
              <input
                id="auto-generate"
                type="checkbox"
                checked={autoGenerate}
                onChange={(e) => setAutoGenerate(e.target.checked)}
                className="h-4 w-4"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-4 gap-2">
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateContentMutation.mutate('exercise')}
              disabled={generateContentMutation.isPending}
            >
              <Target className="h-3 w-3 mr-1" />
              Exercise
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateContentMutation.mutate('question')}
              disabled={generateContentMutation.isPending}
            >
              <MessageSquare className="h-3 w-3 mr-1" />
              Question
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateContentMutation.mutate('explanation')}
              disabled={generateContentMutation.isPending}
            >
              <HelpCircle className="h-3 w-3 mr-1" />
              Explain
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => generateContentMutation.mutate('challenge')}
              disabled={generateContentMutation.isPending}
            >
              <TrendingUp className="h-3 w-3 mr-1" />
              Challenge
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Current Content */}
      {currentContent && (
        <Card>
          <CardHeader>
            <div className="flex justify-between items-start">
              <CardTitle className="text-base flex items-center gap-2">
                {getSkillIcon(currentContent.targetSkill)}
                {currentContent.targetSkill.replace('-', ' ').replace(/_/g, ' ')}
              </CardTitle>
              <div className="flex items-center gap-2">
                {getDifficultyBadge(currentContent.difficulty)}
                {timeRemaining > 0 && !showFeedback && (
                  <Badge variant="outline">
                    <Clock className="h-3 w-3 mr-1" />
                    {timeRemaining}s
                  </Badge>
                )}
              </div>
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              {currentContent.adaptationReason}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <AnimatePresence mode="wait">
              <motion.div
                key={currentContent.content.text}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
              >
                <div className="text-sm font-medium mb-4">
                  {currentContent.content.text}
                </div>

                {/* Multiple choice options */}
                {currentContent.content.options && currentContent.content.options.length > 0 && (
                  <RadioGroup 
                    value={selectedAnswer} 
                    onValueChange={setSelectedAnswer}
                    disabled={showFeedback}
                  >
                    {currentContent.content.options.map((option, index) => (
                      <div 
                        key={index}
                        className={`flex items-center space-x-2 p-3 rounded-lg border ${
                          showFeedback && option === selectedAnswer
                            ? isCorrect 
                              ? 'border-green-500 bg-green-50 dark:bg-green-950' 
                              : 'border-red-500 bg-red-50 dark:bg-red-950'
                            : showFeedback && option === currentContent.content.correctAnswer
                            ? 'border-green-500 bg-green-50 dark:bg-green-950'
                            : ''
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${index}`} />
                        <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer text-sm">
                          {option}
                        </Label>
                        {showFeedback && option === currentContent.content.correctAnswer && (
                          <CheckCircle2 className="h-4 w-4 text-green-600" />
                        )}
                        {showFeedback && option === selectedAnswer && !isCorrect && (
                          <XCircle className="h-4 w-4 text-red-600" />
                        )}
                      </div>
                    ))}
                  </RadioGroup>
                )}

                {/* Text input for open questions */}
                {!currentContent.content.options && currentContent.type === 'question' && (
                  <Textarea
                    value={selectedAnswer}
                    onChange={(e) => setSelectedAnswer(e.target.value)}
                    placeholder="Type your answer here..."
                    disabled={showFeedback}
                    className="min-h-[80px]"
                  />
                )}

                {/* Hints */}
                {currentContent.content.hints && currentContent.content.hints.length > 0 && !showFeedback && (
                  <Alert className="bg-blue-50 dark:bg-blue-950 border-blue-200">
                    <Lightbulb className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      <strong>Hint:</strong> {currentContent.content.hints[0]}
                    </AlertDescription>
                  </Alert>
                )}

                {/* Feedback */}
                {showFeedback && (
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                  >
                    <Alert className={isCorrect 
                      ? "bg-green-50 dark:bg-green-950 border-green-200" 
                      : "bg-red-50 dark:bg-red-950 border-red-200"
                    }>
                      {isCorrect ? (
                        <CheckCircle2 className="h-4 w-4" />
                      ) : (
                        <XCircle className="h-4 w-4" />
                      )}
                      <AlertDescription>
                        <div className="font-medium">
                          {isCorrect ? "Excellent!" : "Not quite right"}
                        </div>
                        {currentContent.content.explanation && (
                          <div className="mt-2 text-sm">
                            {currentContent.content.explanation}
                          </div>
                        )}
                      </AlertDescription>
                    </Alert>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>

            {/* Action buttons */}
            <div className="flex justify-between mt-4">
              <Button
                variant="outline"
                size="sm"
                onClick={() => generateContentMutation.mutate(currentContent.type)}
                disabled={generateContentMutation.isPending}
              >
                <RefreshCw className="h-3 w-3 mr-1" />
                New {currentContent.type}
              </Button>

              {currentContent.type === 'exercise' && !showFeedback && (
                <Button
                  size="sm"
                  onClick={handleSubmit}
                  disabled={submitAnswerMutation.isPending || !selectedAnswer}
                >
                  Submit
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}

              {showFeedback && (
                <Button
                  size="sm"
                  onClick={() => generateContentMutation.mutate('exercise')}
                  disabled={generateContentMutation.isPending}
                >
                  Next Exercise
                  <ChevronRight className="h-3 w-3 ml-1" />
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Content History */}
      {contentHistory.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Session History</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {contentHistory.slice(-5).reverse().map((item, index) => (
                <div key={index} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    {getSkillIcon(item.targetSkill)}
                    <span className="text-muted-foreground">{item.type}</span>
                  </div>
                  {getDifficultyBadge(item.difficulty)}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Generate initial content */}
      {!currentContent && (
        <Card>
          <CardContent className="text-center py-8">
            <Brain className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-sm text-muted-foreground mb-4">
              Ready to generate adaptive content for this session
            </p>
            <Button
              onClick={() => generateContentMutation.mutate('exercise')}
              disabled={generateContentMutation.isPending}
            >
              <Sparkles className="h-4 w-4 mr-2" />
              Start Adaptive Learning
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}