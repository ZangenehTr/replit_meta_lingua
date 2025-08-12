import React, { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Send,
  Flag,
  Award,
  Timer,
  BookOpen,
  Target,
  TrendingUp,
  BarChart
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Test {
  id: number;
  title: string;
  description: string;
  courseTitle: string;
  duration: number; // in minutes
  totalQuestions: number;
  passingScore: number;
  attempts: number;
  maxAttempts: number;
  status: 'not-started' | 'in-progress' | 'completed' | 'expired';
  bestScore?: number;
  lastAttemptDate?: string;
  deadline?: string;
  type: 'quiz' | 'exam' | 'practice';
}

interface Question {
  id: number;
  text: string;
  type: 'multiple-choice' | 'true-false' | 'short-answer' | 'essay';
  options?: string[];
  points: number;
  timeLimit?: number;
  mediaUrl?: string;
}

interface TestSession {
  testId: number;
  questions: Question[];
  currentQuestionIndex: number;
  answers: { [key: number]: any };
  startTime: Date;
  timeRemaining: number;
}

export default function StudentTestTakingMobile() {
  const { t } = useTranslation();
  const [activeTest, setActiveTest] = useState<TestSession | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [filterType, setFilterType] = useState<'all' | 'upcoming' | 'completed'>('upcoming');
  const [timeRemaining, setTimeRemaining] = useState<number>(0);

  // Fetch available tests
  const { data: tests = [], isLoading } = useQuery<Test[]>({
    queryKey: ['/api/student/tests', filterType],
    queryFn: async () => {
      const response = await fetch(`/api/student/tests?filter=${filterType}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch tests');
      return response.json();
    }
  });

  // Start test mutation
  const startTest = useMutation({
    mutationFn: async (testId: number) => {
      const response = await fetch(`/api/student/tests/${testId}/start`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to start test');
      return response.json();
    },
    onSuccess: (data) => {
      setActiveTest({
        testId: data.testId,
        questions: data.questions,
        currentQuestionIndex: 0,
        answers: {},
        startTime: new Date(),
        timeRemaining: data.duration * 60
      });
      setTimeRemaining(data.duration * 60);
    }
  });

  // Submit answer mutation
  const submitAnswer = useMutation({
    mutationFn: async ({ testId, questionId, answer }: any) => {
      const response = await fetch(`/api/student/tests/${testId}/answer`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ questionId, answer })
      });
      if (!response.ok) throw new Error('Failed to submit answer');
      return response.json();
    },
    onSuccess: () => {
      if (activeTest) {
        const newAnswers = { ...activeTest.answers };
        newAnswers[activeTest.questions[activeTest.currentQuestionIndex].id] = selectedAnswer;
        
        if (activeTest.currentQuestionIndex < activeTest.questions.length - 1) {
          setActiveTest({
            ...activeTest,
            answers: newAnswers,
            currentQuestionIndex: activeTest.currentQuestionIndex + 1
          });
          setSelectedAnswer('');
        } else {
          // Test completed
          finishTest.mutate(activeTest.testId);
        }
      }
    }
  });

  // Finish test mutation
  const finishTest = useMutation({
    mutationFn: async (testId: number) => {
      const response = await fetch(`/api/student/tests/${testId}/finish`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to finish test');
      return response.json();
    },
    onSuccess: (data) => {
      toast({
        title: t('student:testCompleted'),
        description: `${t('student:yourScore')}: ${data.score}/${data.totalPoints}`,
      });
      setActiveTest(null);
      queryClient.invalidateQueries({ queryKey: ['/api/student/tests'] });
    }
  });

  // Timer effect
  useEffect(() => {
    if (activeTest && timeRemaining > 0) {
      const timer = setTimeout(() => {
        setTimeRemaining(timeRemaining - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (activeTest && timeRemaining === 0) {
      // Auto-submit when time runs out
      finishTest.mutate(activeTest.testId);
    }
  }, [timeRemaining, activeTest]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const getTestTypeColor = (type: string) => {
    switch (type) {
      case 'quiz': return 'bg-blue-500';
      case 'exam': return 'bg-red-500';
      case 'practice': return 'bg-green-500';
      default: return 'bg-gray-500';
    }
  };

  const currentQuestion = activeTest?.questions[activeTest.currentQuestionIndex];
  const progress = activeTest 
    ? ((activeTest.currentQuestionIndex + 1) / activeTest.questions.length) * 100
    : 0;

  if (activeTest) {
    // Test-taking interface
    return (
      <MobileLayout
        title={t('student:test')}
        showBack={true}
        onBack={() => {
          if (confirm(t('student:confirmExitTest'))) {
            setActiveTest(null);
          }
        }}
        gradient="focus"
      >
        {/* Timer and Progress */}
        <motion.div
          className="glass-card p-4 mb-6"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <div className="flex justify-between items-center mb-3">
            <div className="flex items-center gap-2">
              <Timer className={`w-5 h-5 ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`} />
              <span className={`font-mono text-lg ${timeRemaining < 60 ? 'text-red-400' : 'text-white'}`}>
                {formatTime(timeRemaining)}
              </span>
            </div>
            <Badge className="bg-white/20 text-white border-white/30">
              {t('student:question')} {activeTest.currentQuestionIndex + 1}/{activeTest.questions.length}
            </Badge>
          </div>
          
          <div className="h-2 bg-white/10 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-purple-500 to-pink-500"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </motion.div>

        {/* Question */}
        <motion.div
          key={currentQuestion?.id}
          className="glass-card p-6 mb-6"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.3 }}
        >
          <div className="flex justify-between items-start mb-4">
            <h3 className="text-white text-lg font-semibold flex-1">
              {currentQuestion?.text}
            </h3>
            <Badge className="bg-purple-500/20 text-purple-300 border-purple-500/30">
              {currentQuestion?.points} {t('student:points')}
            </Badge>
          </div>

          {/* Answer Options */}
          {currentQuestion?.type === 'multiple-choice' && (
            <RadioGroup value={selectedAnswer} onValueChange={setSelectedAnswer}>
              <div className="space-y-3">
                {currentQuestion.options?.map((option, index) => (
                  <motion.label
                    key={index}
                    className={`
                      flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all
                      ${selectedAnswer === option 
                        ? 'bg-white/20 ring-2 ring-purple-400' 
                        : 'bg-white/10 hover:bg-white/15'}
                    `}
                    whileTap={{ scale: 0.98 }}
                  >
                    <RadioGroupItem value={option} className="text-white" />
                    <span className="text-white">{option}</span>
                  </motion.label>
                ))}
              </div>
            </RadioGroup>
          )}

          {currentQuestion?.type === 'true-false' && (
            <div className="grid grid-cols-2 gap-4">
              {['true', 'false'].map((value) => (
                <motion.button
                  key={value}
                  className={`
                    p-4 rounded-xl font-semibold transition-all
                    ${selectedAnswer === value 
                      ? 'bg-white/20 ring-2 ring-purple-400 text-white' 
                      : 'bg-white/10 text-white/70 hover:bg-white/15'}
                  `}
                  whileTap={{ scale: 0.98 }}
                  onClick={() => setSelectedAnswer(value)}
                >
                  {t(`common:${value}`)}
                </motion.button>
              ))}
            </div>
          )}

          {currentQuestion?.type === 'short-answer' && (
            <textarea
              className="w-full p-4 bg-white/10 rounded-xl text-white placeholder-white/50 outline-none resize-none"
              rows={4}
              placeholder={t('student:typeYourAnswer')}
              value={selectedAnswer}
              onChange={(e) => setSelectedAnswer(e.target.value)}
            />
          )}
        </motion.div>

        {/* Navigation */}
        <div className="flex gap-3">
          {activeTest.currentQuestionIndex > 0 && (
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => {
                setActiveTest({
                  ...activeTest,
                  currentQuestionIndex: activeTest.currentQuestionIndex - 1
                });
                setSelectedAnswer(activeTest.answers[activeTest.questions[activeTest.currentQuestionIndex - 1].id] || '');
              }}
            >
              <ChevronLeft className="w-4 h-4 mr-1" />
              {t('common:previous')}
            </Button>
          )}

          <Button
            className="flex-1"
            onClick={() => {
              if (currentQuestion) {
                submitAnswer.mutate({
                  testId: activeTest.testId,
                  questionId: currentQuestion.id,
                  answer: selectedAnswer
                });
              }
            }}
            disabled={!selectedAnswer}
          >
            {activeTest.currentQuestionIndex === activeTest.questions.length - 1 
              ? t('student:finishTest')
              : t('common:next')}
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>

        {/* Flag Question */}
        <button className="mt-4 text-center w-full">
          <span className="text-white/50 text-sm flex items-center justify-center gap-2">
            <Flag className="w-4 h-4" />
            {t('student:flagQuestion')}
          </span>
        </button>
      </MobileLayout>
    );
  }

  // Test list interface
  return (
    <MobileLayout
      title={t('student:tests')}
      showBack={false}
      gradient="study"
    >
      {/* Stats Overview */}
      <motion.div
        className="grid grid-cols-3 gap-3 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-3 text-center">
          <FileText className="w-6 h-6 text-blue-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {tests.filter(t => t.status === 'not-started').length}
          </p>
          <p className="text-white/60 text-xs">{t('student:pending')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <CheckCircle className="w-6 h-6 text-green-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {tests.filter(t => t.status === 'completed').length}
          </p>
          <p className="text-white/60 text-xs">{t('student:completed')}</p>
        </div>
        <div className="glass-card p-3 text-center">
          <TrendingUp className="w-6 h-6 text-purple-400 mx-auto mb-1" />
          <p className="text-white text-xl font-bold">
            {Math.round(
              tests.filter(t => t.bestScore).reduce((acc, t) => acc + (t.bestScore || 0), 0) / 
              Math.max(tests.filter(t => t.bestScore).length, 1)
            )}%
          </p>
          <p className="text-white/60 text-xs">{t('student:avgScore')}</p>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div
        className="flex gap-2 mb-6"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3, delay: 0.1 }}
      >
        {['all', 'upcoming', 'completed'].map((type) => (
          <button
            key={type}
            onClick={() => setFilterType(type as any)}
            className={`
              flex-1 py-2 px-4 rounded-xl transition-all duration-200
              ${filterType === type 
                ? 'bg-white/30 text-white font-medium' 
                : 'bg-white/10 text-white/70'}
              tap-scale
            `}
          >
            {t(`student:tests.${type}`)}
          </button>
        ))}
      </motion.div>

      {/* Tests List */}
      {isLoading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="glass-card p-4 animate-pulse">
              <div className="h-4 bg-white/20 rounded w-3/4 mb-2"></div>
              <div className="h-3 bg-white/20 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : tests.length === 0 ? (
        <MobileCard className="text-center py-12">
          <FileText className="w-16 h-16 text-white/50 mx-auto mb-4" />
          <p className="text-white/70">{t('student:noTests')}</p>
        </MobileCard>
      ) : (
        <div className="space-y-4">
          {tests.map((test, index) => (
            <motion.div
              key={test.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3, delay: index * 0.1 }}
            >
              <MobileCard className="relative overflow-hidden">
                <div className={`absolute top-0 left-0 w-1 h-full ${getTestTypeColor(test.type)}`} />
                
                <div className="pl-4">
                  <div className="flex justify-between items-start mb-3">
                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-lg">
                        {test.title}
                      </h3>
                      <p className="text-white/60 text-sm">
                        {test.courseTitle}
                      </p>
                    </div>
                    <Badge className={`${getTestTypeColor(test.type)} text-white border-0`}>
                      {t(`student:testType.${test.type}`)}
                    </Badge>
                  </div>

                  <p className="text-white/70 text-sm mb-3 line-clamp-2">
                    {test.description}
                  </p>

                  <div className="grid grid-cols-3 gap-3 mb-3">
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-4 h-4 text-white/50" />
                        <span className="text-white/80 text-sm font-medium">
                          {test.duration}m
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">{t('student:duration')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Target className="w-4 h-4 text-white/50" />
                        <span className="text-white/80 text-sm font-medium">
                          {test.totalQuestions}
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">{t('student:questions')}</p>
                    </div>
                    <div className="text-center">
                      <div className="flex items-center justify-center gap-1">
                        <Award className="w-4 h-4 text-white/50" />
                        <span className="text-white/80 text-sm font-medium">
                          {test.passingScore}%
                        </span>
                      </div>
                      <p className="text-white/50 text-xs">{t('student:passing')}</p>
                    </div>
                  </div>

                  {test.status === 'not-started' && (
                    <motion.button
                      className="w-full py-2 bg-white/20 rounded-lg text-white font-medium"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => startTest.mutate(test.id)}
                    >
                      {t('student:startTest')}
                      <ChevronRight className="w-4 h-4 inline ml-1" />
                    </motion.button>
                  )}

                  {test.status === 'completed' && (
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-white/60 text-xs">{t('student:bestScore')}</p>
                        <p className="text-white font-semibold">
                          {test.bestScore}%
                        </p>
                      </div>
                      {test.attempts < test.maxAttempts && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => startTest.mutate(test.id)}
                        >
                          {t('student:retake')} ({test.attempts}/{test.maxAttempts})
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </MobileCard>
            </motion.div>
          ))}
        </div>
      )}
    </MobileLayout>
  );
}