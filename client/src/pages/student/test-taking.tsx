import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/hooks/use-auth";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Clock,
  BookOpen,
  CheckCircle,
  XCircle,
  AlertCircle,
  FileText,
  Play,
  Send,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";

interface Test {
  id: number;
  title: string;
  description: string;
  courseId: number;
  totalQuestions: number;
  duration: number;
  maxAttempts: number;
  passingScore: number;
  isActive: boolean;
  courseName?: string;
}

interface TestAttempt {
  id: number;
  testId: number;
  studentId: number;
  startedAt: Date;
  completedAt?: Date;
  score?: number;
  maxScore?: number;
  percentage?: number;
  passed?: boolean;
  status: string;
}

interface TestQuestion {
  id: number;
  testId: number;
  questionType: string;
  questionText: string;
  points: number;
  order: number;
  options?: any;
  mediaUrl?: string;
}

export default function StudentTestTaking() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [, navigate] = useLocation();
  const [selectedTest, setSelectedTest] = useState<Test | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<TestAttempt | null>(null);
  const [testQuestions, setTestQuestions] = useState<TestQuestion[]>([]);
  const [answers, setAnswers] = useState<Record<number, any>>({});
  const [timeRemaining, setTimeRemaining] = useState<number | null>(null);

  // Fetch available tests
  const { data: availableTests = [], isLoading } = useQuery({
    queryKey: ["/api/student/tests/available"],
  });

  // Fetch previous attempts
  const { data: previousAttempts = [] } = useQuery({
    queryKey: selectedTest ? [`/api/student/tests/${selectedTest.id}/attempts`] : null,
    enabled: !!selectedTest,
  });

  // Start test attempt mutation
  const startTestMutation = useMutation({
    mutationFn: async (testId: number) => {
      return await apiRequest(`/api/student/tests/${testId}/attempt`, {
        method: "POST",
      });
    },
    onSuccess: (data) => {
      setCurrentAttempt(data.attempt);
      setTestQuestions(data.questions);
      toast({
        title: "Test Started",
        description: "Good luck! Your timer has begun.",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start test",
        variant: "destructive",
      });
    },
  });

  // Submit test mutation
  const submitTestMutation = useMutation({
    mutationFn: async (attemptId: number) => {
      return await apiRequest(`/api/student/tests/attempts/${attemptId}/submit`, {
        method: "POST",
        body: JSON.stringify({ answers: Object.entries(answers).map(([questionId, answerValue]) => ({
          questionId: parseInt(questionId),
          answerValue,
        })) }),
      });
    },
    onSuccess: (data) => {
      setCurrentAttempt(null);
      setTestQuestions([]);
      setAnswers({});
      
      toast({
        title: data.results.passed ? "Test Passed!" : "Test Completed",
        description: `Your score: ${data.results.score}/${data.results.maxScore} (${data.results.percentage.toFixed(1)}%)`,
        variant: data.results.passed ? "default" : "destructive",
      });
      
      // Refresh attempts
      queryClient.invalidateQueries({ queryKey: [`/api/student/tests/${selectedTest?.id}/attempts`] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to submit test",
        variant: "destructive",
      });
    },
  });

  // Timer effect
  useEffect(() => {
    if (currentAttempt && selectedTest) {
      const interval = setInterval(() => {
        const elapsed = Date.now() - new Date(currentAttempt.startedAt).getTime();
        const remaining = (selectedTest.duration * 60 * 1000) - elapsed;
        
        if (remaining <= 0) {
          // Auto-submit when time runs out
          submitTestMutation.mutate(currentAttempt.id);
          clearInterval(interval);
        } else {
          setTimeRemaining(Math.floor(remaining / 1000));
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [currentAttempt, selectedTest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleAnswerChange = (questionId: number, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const renderQuestion = (question: TestQuestion) => {
    const answer = answers[question.id];

    switch (question.questionType) {
      case 'multiple_choice':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value)}
          >
            {Object.entries(question.options || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2 mb-2">
                <RadioGroupItem value={key} id={`${question.id}-${key}`} />
                <Label htmlFor={`${question.id}-${key}`} className="cursor-pointer">
                  {value}
                </Label>
              </div>
            ))}
          </RadioGroup>
        );

      case 'true_false':
        return (
          <RadioGroup
            value={answer || ''}
            onValueChange={(value) => handleAnswerChange(question.id, value === 'true')}
          >
            <div className="flex items-center space-x-2 mb-2">
              <RadioGroupItem value="true" id={`${question.id}-true`} />
              <Label htmlFor={`${question.id}-true`} className="cursor-pointer">True</Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="false" id={`${question.id}-false`} />
              <Label htmlFor={`${question.id}-false`} className="cursor-pointer">False</Label>
            </div>
          </RadioGroup>
        );

      case 'multiple_select':
        const selectedOptions = answer || [];
        return (
          <div className="space-y-2">
            {Object.entries(question.options || {}).map(([key, value]) => (
              <div key={key} className="flex items-center space-x-2">
                <Checkbox
                  id={`${question.id}-${key}`}
                  checked={selectedOptions.includes(key)}
                  onCheckedChange={(checked) => {
                    const newValue = checked
                      ? [...selectedOptions, key]
                      : selectedOptions.filter((opt: string) => opt !== key);
                    handleAnswerChange(question.id, newValue);
                  }}
                />
                <Label htmlFor={`${question.id}-${key}`} className="cursor-pointer">
                  {value}
                </Label>
              </div>
            ))}
          </div>
        );

      case 'short_answer':
        return (
          <Input
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Type your answer here..."
          />
        );

      case 'essay':
        return (
          <Textarea
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Write your essay here..."
            rows={6}
          />
        );

      case 'fill_blank':
        return (
          <Input
            value={answer || ''}
            onChange={(e) => handleAnswerChange(question.id, e.target.value)}
            placeholder="Fill in the blank..."
          />
        );

      case 'matching':
        // Simplified matching implementation
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Match the items (not fully implemented)</p>
          </div>
        );

      case 'ordering':
        // Simplified ordering implementation
        return (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">Order the items (not fully implemented)</p>
          </div>
        );

      default:
        return <p>Unsupported question type</p>;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading tests...</p>
        </div>
      </div>
    );
  }

  if (currentAttempt) {
    // Test taking interface
    const answeredCount = Object.keys(answers).length;
    const progress = (answeredCount / testQuestions.length) * 100;

    return (
      <div className="container mx-auto p-6">
        <Card className="mb-4">
          <CardHeader>
            <div className="flex justify-between items-center">
              <div>
                <CardTitle>{selectedTest?.title}</CardTitle>
                <CardDescription>{selectedTest?.description}</CardDescription>
              </div>
              <div className="text-right">
                <div className="flex items-center gap-2 text-lg font-semibold">
                  <Clock className="h-5 w-5" />
                  {timeRemaining !== null && formatTime(timeRemaining)}
                </div>
                <p className="text-sm text-muted-foreground">
                  {answeredCount} of {testQuestions.length} answered
                </p>
              </div>
            </div>
            <Progress value={progress} className="mt-4" />
          </CardHeader>
        </Card>

        <div className="space-y-4">
          {testQuestions.map((question, index) => (
            <Card key={question.id}>
              <CardHeader>
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <p className="text-sm font-medium">Question {index + 1}</p>
                    <p className="text-lg">{question.questionText}</p>
                  </div>
                  <Badge variant="secondary">{question.points} points</Badge>
                </div>
              </CardHeader>
              <CardContent>
                {renderQuestion(question)}
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <Button
            onClick={() => submitTestMutation.mutate(currentAttempt.id)}
            disabled={submitTestMutation.isPending}
            size="lg"
          >
            <Send className="mr-2 h-4 w-4" />
            Submit Test
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">My Tests</h1>

      <Tabs defaultValue="available">
        <TabsList className="mb-6">
          <TabsTrigger value="available">Available Tests</TabsTrigger>
          <TabsTrigger value="completed">Completed Tests</TabsTrigger>
        </TabsList>

        <TabsContent value="available">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableTests.map((test: Test) => {
              const attempts = previousAttempts.filter((a: TestAttempt) => a.testId === test.id);
              const canTakeTest = attempts.length < test.maxAttempts;

              return (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle>{test.title}</CardTitle>
                    <CardDescription>{test.courseName}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span>Questions:</span>
                        <span className="font-medium">{test.totalQuestions}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Duration:</span>
                        <span className="font-medium">{test.duration} minutes</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Passing Score:</span>
                        <span className="font-medium">{test.passingScore}%</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span>Attempts:</span>
                        <span className="font-medium">{attempts.length}/{test.maxAttempts}</span>
                      </div>
                    </div>

                    {attempts.length > 0 && (
                      <div className="mb-4 p-3 bg-muted rounded-lg">
                        <p className="text-sm font-medium mb-1">Last Attempt:</p>
                        <div className="flex items-center gap-2">
                          {attempts[attempts.length - 1].passed ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-500" />
                          )}
                          <span className="text-sm">
                            {attempts[attempts.length - 1].percentage?.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                    )}

                    <Button
                      onClick={() => {
                        setSelectedTest(test);
                        startTestMutation.mutate(test.id);
                      }}
                      disabled={!canTakeTest || startTestMutation.isPending}
                      className="w-full"
                    >
                      <Play className="mr-2 h-4 w-4" />
                      {canTakeTest ? 'Start Test' : 'No Attempts Left'}
                    </Button>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>

        <TabsContent value="completed">
          <div className="space-y-4">
            {availableTests.map((test: Test) => {
              const attempts = previousAttempts.filter((a: TestAttempt) => a.testId === test.id && a.status === 'completed');
              
              if (attempts.length === 0) return null;

              return (
                <Card key={test.id}>
                  <CardHeader>
                    <CardTitle>{test.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {attempts.map((attempt: TestAttempt) => (
                        <div key={attempt.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            {attempt.passed ? (
                              <CheckCircle className="h-5 w-5 text-green-500" />
                            ) : (
                              <XCircle className="h-5 w-5 text-red-500" />
                            )}
                            <div>
                              <p className="font-medium">
                                Score: {attempt.score}/{attempt.maxScore} ({attempt.percentage?.toFixed(1)}%)
                              </p>
                              <p className="text-sm text-muted-foreground">
                                Completed {formatDistanceToNow(new Date(attempt.completedAt!), { addSuffix: true })}
                              </p>
                            </div>
                          </div>
                          <Badge variant={attempt.passed ? "success" : "destructive"}>
                            {attempt.passed ? 'Passed' : 'Failed'}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}