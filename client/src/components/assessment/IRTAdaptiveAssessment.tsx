// IRT Adaptive Assessment Component with Real-time Ability Estimation
import { useState, useEffect, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown,
  Activity,
  Target,
  Award,
  Timer,
  ChevronRight,
  AlertCircle,
  CheckCircle,
  BarChart3,
  Zap,
  BookOpen,
  Gauge,
  Shield,
  Info,
  Clock,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  LineChart, 
  Line, 
  Area, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  ErrorBar,
  ReferenceLine,
  ReferenceArea
} from 'recharts';

interface IRTItem {
  id: string;
  type: string;
  question: string;
  options?: string[];
  difficulty: number;
  discrimination: number;
  content?: any;
}

interface StudentAbility {
  theta: number;
  standardError: number;
  totalResponses: number;
  confidenceInterval: [number, number];
  level: 'beginner' | 'intermediate' | 'advanced';
}

interface AssessmentSession {
  id: string;
  studentId: number;
  startTime: Date;
  responses: Array<{
    itemId: string;
    correct: boolean;
    responseTime: number;
    theta: number;
    standardError: number;
  }>;
  currentAbility: StudentAbility;
  status: 'in-progress' | 'completed' | 'paused';
}

export function IRTAdaptiveAssessment({ studentId, onComplete }: { studentId: number; onComplete?: (ability: StudentAbility) => void }) {
  const { toast } = useToast();
  const [session, setSession] = useState<AssessmentSession | null>(null);
  const [currentItem, setCurrentItem] = useState<IRTItem | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [itemStartTime, setItemStartTime] = useState<number>(Date.now());
  const [showFeedback, setShowFeedback] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [assessmentPhase, setAssessmentPhase] = useState<'intro' | 'testing' | 'results'>('intro');
  const [abilityHistory, setAbilityHistory] = useState<Array<{ item: number; theta: number; se: number }>>([]);
  const responseTimeRef = useRef<NodeJS.Timeout>();

  // Initialize assessment session
  const initSession = useMutation({
    mutationFn: () => apiRequest('/api/assessment/irt/start', 'POST', { studentId }),
    onSuccess: (data) => {
      setSession(data);
      setAssessmentPhase('testing');
      getNextItem(data.currentAbility.theta, []);
    }
  });

  // Get next adaptive item
  const getNextItem = async (theta: number, excludeItems: string[]) => {
    try {
      const response = await apiRequest('/api/assessment/irt/next-item', 'POST', {
        theta,
        excludeItems,
        sessionId: session?.id
      });
      
      if (response.item) {
        setCurrentItem(response.item);
        setItemStartTime(Date.now());
        setSelectedAnswer('');
        setShowFeedback(false);
      } else {
        // No more items, complete assessment
        completeAssessment();
      }
    } catch (error) {
      console.error('Failed to get next item:', error);
      toast({
        title: "Error",
        description: "Failed to load next question",
        variant: "destructive"
      });
    }
  };

  // Submit answer and update ability
  const submitAnswer = async () => {
    if (!selectedAnswer || !currentItem || !session) return;

    const responseTime = Date.now() - itemStartTime;
    const correct = checkAnswer(selectedAnswer, currentItem);
    setIsCorrect(correct);
    setShowFeedback(true);

    // Update ability estimate
    try {
      const updatedAbility = await apiRequest('/api/assessment/irt/update-ability', 'POST', {
        sessionId: session.id,
        itemId: currentItem.id,
        correct,
        responseTime,
        currentTheta: session.currentAbility.theta,
        currentSE: session.currentAbility.standardError
      });

      // Update session with new ability
      const newResponse = {
        itemId: currentItem.id,
        correct,
        responseTime,
        theta: updatedAbility.theta,
        standardError: updatedAbility.standardError
      };

      setSession({
        ...session,
        responses: [...session.responses, newResponse],
        currentAbility: updatedAbility
      });

      setAbilityHistory(prev => [...prev, {
        item: prev.length + 1,
        theta: updatedAbility.theta,
        se: updatedAbility.standardError
      }]);

      // Get next item after delay
      setTimeout(() => {
        if (session.responses.length >= 9) { // 10 items total (0-indexed)
          completeAssessment();
        } else {
          getNextItem(
            updatedAbility.theta,
            [...session.responses.map(r => r.itemId), currentItem.id]
          );
        }
      }, 2000);
    } catch (error) {
      console.error('Failed to update ability:', error);
    }
  };

  // Check if answer is correct
  const checkAnswer = (answer: string, item: IRTItem): boolean => {
    // Simplified check - in production would validate against database
    return answer === item.options?.[0]; // Assume first option is correct
  };

  // Complete assessment
  const completeAssessment = () => {
    setAssessmentPhase('results');
    if (onComplete && session) {
      onComplete(session.currentAbility);
    }
    
    toast({
      title: "Assessment Complete!",
      description: `Your ability level: ${session?.currentAbility.level}`,
      className: "bg-green-500 text-white"
    });
  };

  // Convert theta to percentage for display
  const thetaToPercentage = (theta: number) => {
    // Map theta (-3 to 3) to percentage (0 to 100)
    return Math.round(((theta + 3) / 6) * 100);
  };

  // Get ability level color
  const getAbilityColor = (level: string) => {
    switch (level) {
      case 'beginner': return 'text-blue-500';
      case 'intermediate': return 'text-yellow-500';
      case 'advanced': return 'text-green-500';
      default: return 'text-gray-500';
    }
  };

  // Render intro screen
  const renderIntro = () => (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-6 h-6 text-purple-500" />
            Adaptive Language Assessment
          </CardTitle>
          <CardDescription>
            Personalized assessment that adapts to your ability level
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <Zap className="w-5 h-5 text-yellow-500 mt-0.5" />
              <div>
                <h4 className="font-semibold">Adaptive Difficulty</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Questions automatically adjust to your skill level
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Target className="w-5 h-5 text-blue-500 mt-0.5" />
              <div>
                <h4 className="font-semibold">Precise Measurement</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Uses Item Response Theory for accurate ability estimation
                </p>
              </div>
            </div>
            
            <div className="flex items-start gap-3">
              <Timer className="w-5 h-5 text-green-500 mt-0.5" />
              <div>
                <h4 className="font-semibold">10-15 Minutes</h4>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Complete assessment with 10 adaptive questions
                </p>
              </div>
            </div>
          </div>

          <Alert>
            <Info className="w-4 h-4" />
            <AlertDescription>
              Answer each question to the best of your ability. There's no time limit per question, but try to answer promptly.
            </AlertDescription>
          </Alert>

          <Button 
            size="lg" 
            className="w-full"
            onClick={() => initSession.mutate()}
            disabled={initSession.isPending}
          >
            {initSession.isPending ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white mr-2"></div>
                Starting Assessment...
              </>
            ) : (
              <>
                Start Assessment
                <ChevronRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );

  // Render testing phase
  const renderTesting = () => {
    if (!currentItem || !session) return null;

    const questionNumber = session.responses.length + 1;
    const progress = (session.responses.length / 10) * 100;

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Progress Bar */}
        <Card>
          <CardContent className="pt-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Question {questionNumber} of 10</span>
                <span>{Math.round(progress)}% Complete</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
          </CardContent>
        </Card>

        {/* Real-time Ability Display */}
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Gauge className="w-5 h-5 text-purple-500" />
                <span className="text-sm font-medium">Current Ability Estimate</span>
              </div>
              <div className="flex items-center gap-3">
                <Badge className={getAbilityColor(session.currentAbility.level)}>
                  {session.currentAbility.level}
                </Badge>
                <div className="text-right">
                  <div className="text-lg font-bold">
                    {thetaToPercentage(session.currentAbility.theta)}%
                  </div>
                  <div className="text-xs text-gray-600 dark:text-gray-400">
                    ±{Math.round(session.currentAbility.standardError * 100) / 100}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Confidence Interval Bar */}
            <div className="mt-4 relative h-2 bg-gray-200 dark:bg-gray-700 rounded">
              <motion.div
                className="absolute h-full bg-gradient-to-r from-blue-400 to-purple-600 rounded"
                initial={{ width: 0 }}
                animate={{ 
                  left: `${thetaToPercentage(session.currentAbility.theta - session.currentAbility.standardError)}%`,
                  width: `${thetaToPercentage(session.currentAbility.standardError * 2)}%`
                }}
                transition={{ duration: 0.5 }}
              />
              <motion.div
                className="absolute w-1 h-4 bg-purple-600 rounded -top-1"
                animate={{ left: `${thetaToPercentage(session.currentAbility.theta)}%` }}
                transition={{ duration: 0.5 }}
              />
            </div>
          </CardContent>
        </Card>

        {/* Question Card */}
        <Card>
          <CardHeader>
            <div className="flex justify-between items-center">
              <CardTitle className="text-lg">
                {currentItem.type === 'vocabulary' && <BookOpen className="inline w-5 h-5 mr-2" />}
                {currentItem.type} Question
              </CardTitle>
              <div className="flex items-center gap-2">
                <Badge variant="outline">
                  Difficulty: {currentItem.difficulty.toFixed(2)}
                </Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-lg">{currentItem.question}</div>
            
            {currentItem.options && (
              <RadioGroup 
                value={selectedAnswer} 
                onValueChange={setSelectedAnswer}
                disabled={showFeedback}
              >
                <div className="space-y-3">
                  {currentItem.options.map((option, idx) => (
                    <motion.div
                      key={idx}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                    >
                      <Label
                        htmlFor={`option-${idx}`}
                        className={`flex items-center space-x-3 p-3 rounded-lg border cursor-pointer transition-all ${
                          showFeedback && option === currentItem.options![0]
                            ? 'border-green-500 bg-green-50 dark:bg-green-900/20'
                            : showFeedback && selectedAnswer === option && !isCorrect
                            ? 'border-red-500 bg-red-50 dark:bg-red-900/20'
                            : selectedAnswer === option
                            ? 'border-primary bg-primary/10'
                            : 'border-gray-200 dark:border-gray-700 hover:border-primary'
                        }`}
                      >
                        <RadioGroupItem value={option} id={`option-${idx}`} />
                        <span className="flex-1">{option}</span>
                        {showFeedback && option === currentItem.options![0] && (
                          <CheckCircle className="w-5 h-5 text-green-500" />
                        )}
                      </Label>
                    </motion.div>
                  ))}
                </div>
              </RadioGroup>
            )}

            {showFeedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
              >
                <Alert className={isCorrect ? 'border-green-500' : 'border-red-500'}>
                  {isCorrect ? (
                    <CheckCircle className="w-4 h-4 text-green-500" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-500" />
                  )}
                  <AlertDescription>
                    {isCorrect ? 'Correct! Well done.' : 'Not quite right. The correct answer has been highlighted.'}
                  </AlertDescription>
                </Alert>
              </motion.div>
            )}

            {!showFeedback && (
              <Button 
                onClick={submitAnswer} 
                disabled={!selectedAnswer}
                className="w-full"
              >
                Submit Answer
                <ChevronRight className="w-4 h-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>
      </motion.div>
    );
  };

  // Render results phase
  const renderResults = () => {
    if (!session) return null;

    const finalAbility = session.currentAbility;
    const percentile = thetaToPercentage(finalAbility.theta);

    // Prepare chart data
    const chartData = abilityHistory.map((item, idx) => ({
      question: idx + 1,
      ability: item.theta,
      upperBound: item.theta + item.se,
      lowerBound: item.theta - item.se,
      error: [item.theta - item.se, item.theta + item.se]
    }));

    return (
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="space-y-6"
      >
        {/* Final Score Card */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="w-6 h-6 text-yellow-500" />
              Assessment Complete!
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <div>
                <div className="text-4xl font-bold text-primary">
                  {percentile}th Percentile
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                  You performed better than {percentile}% of learners
                </p>
              </div>
              
              <div className="flex justify-center">
                <Badge className={`text-lg py-2 px-4 ${getAbilityColor(finalAbility.level)}`}>
                  {finalAbility.level.toUpperCase()} LEVEL
                </Badge>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <p className="text-2xl font-bold">{session.responses.length}</p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Questions</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {session.responses.filter(r => r.correct).length}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Correct</p>
              </div>
              <div>
                <p className="text-2xl font-bold">
                  {Math.round((session.responses.filter(r => r.correct).length / session.responses.length) * 100)}%
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-400">Accuracy</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Ability Progression Chart */}
        <Card>
          <CardHeader>
            <CardTitle>Ability Estimation Progress</CardTitle>
            <CardDescription>
              How your ability estimate evolved during the assessment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={chartData} margin={{ top: 5, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="question" label={{ value: 'Question Number', position: 'insideBottom', offset: -5 }} />
                <YAxis label={{ value: 'Ability (θ)', angle: -90, position: 'insideLeft' }} domain={[-3, 3]} />
                <Tooltip />
                
                {/* Reference areas for difficulty levels */}
                <ReferenceArea y1={-3} y2={-0.5} fill="#3b82f6" fillOpacity={0.1} />
                <ReferenceArea y1={-0.5} y2={0.5} fill="#eab308" fillOpacity={0.1} />
                <ReferenceArea y1={0.5} y2={3} fill="#22c55e" fillOpacity={0.1} />
                
                <ReferenceLine y={0} stroke="#666" strokeDasharray="3 3" />
                
                {/* Confidence interval area */}
                <Area
                  type="monotone"
                  dataKey="upperBound"
                  stroke="none"
                  fill="#8b5cf6"
                  fillOpacity={0.2}
                />
                <Area
                  type="monotone"
                  dataKey="lowerBound"
                  stroke="none"
                  fill="#fff"
                  fillOpacity={1}
                />
                
                {/* Main ability line */}
                <Line
                  type="monotone"
                  dataKey="ability"
                  stroke="#8b5cf6"
                  strokeWidth={2}
                  dot={{ fill: '#8b5cf6', r: 4 }}
                  activeDot={{ r: 6 }}
                />
                
                {/* Error bars */}
                <ErrorBar
                  dataKey="error"
                  width={4}
                  stroke="#8b5cf6"
                  strokeWidth={1}
                  opacity={0.5}
                />
              </LineChart>
            </ResponsiveContainer>
            
            <div className="flex justify-between mt-4 text-sm">
              <Badge variant="outline" className="bg-blue-50 dark:bg-blue-900/20">Beginner</Badge>
              <Badge variant="outline" className="bg-yellow-50 dark:bg-yellow-900/20">Intermediate</Badge>
              <Badge variant="outline" className="bg-green-50 dark:bg-green-900/20">Advanced</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5" />
              Personalized Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <Alert>
              <Activity className="w-4 h-4" />
              <AlertDescription>
                Based on your assessment, we recommend focusing on {finalAbility.level} level content
                with occasional {finalAbility.level === 'beginner' ? 'intermediate' : 
                finalAbility.level === 'advanced' ? 'intermediate' : 'advanced'} challenges.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <p className="text-sm font-medium">Recommended next steps:</p>
              <ul className="space-y-1 text-sm text-gray-600 dark:text-gray-400">
                <li>• Start with {finalAbility.level} level courses</li>
                <li>• Practice daily for 15-20 minutes</li>
                <li>• Focus on areas where response times were longest</li>
                <li>• Retake assessment in 4-6 weeks to track progress</li>
              </ul>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="flex gap-3">
          <Button variant="outline" className="flex-1" onClick={() => window.location.reload()}>
            Retake Assessment
          </Button>
          <Button className="flex-1" onClick={() => window.location.href = '/dashboard'}>
            Go to Dashboard
            <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </motion.div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <AnimatePresence mode="wait">
        {assessmentPhase === 'intro' && renderIntro()}
        {assessmentPhase === 'testing' && renderTesting()}
        {assessmentPhase === 'results' && renderResults()}
      </AnimatePresence>
    </div>
  );
}