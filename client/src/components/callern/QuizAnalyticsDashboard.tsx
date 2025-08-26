// client/src/components/callern/QuizAnalyticsDashboard.tsx
import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart
} from 'recharts';
import { 
  Brain, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  CheckCircle, 
  XCircle,
  Clock,
  Award,
  Target,
  AlertCircle,
  BookOpen,
  ChevronRight,
  Download,
  Filter
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { cn } from '@/lib/utils';

interface QuizAnalytics {
  quizId: string;
  title: string;
  totalAttempts: number;
  averageScore: number;
  completionRate: number;
  averageTimeSpent: number;
  questionStats: {
    questionId: string;
    questionText: string;
    correctRate: number;
    averageTimeSpent: number;
    difficulty: string;
  }[];
  studentPerformance: {
    studentId: number;
    studentName: string;
    score: number;
    timeSpent: number;
    completedAt: Date;
  }[];
  topicPerformance: {
    topic: string;
    averageScore: number;
    attemptCount: number;
  }[];
}

interface QuizAnalyticsDashboardProps {
  sessionId?: string;
  teacherId?: number;
}

export function QuizAnalyticsDashboard({ sessionId, teacherId }: QuizAnalyticsDashboardProps) {
  const [selectedQuizId, setSelectedQuizId] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState('week');
  const [difficultyFilter, setDifficultyFilter] = useState('all');

  // Fetch quiz list
  const { data: quizzes, isLoading: quizzesLoading } = useQuery({
    queryKey: [`/api/teacher/quizzes`, sessionId, teacherId],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (sessionId) params.append('sessionId', sessionId);
      if (teacherId) params.append('teacherId', String(teacherId));
      
      return apiRequest(`/api/teacher/quizzes?${params}`, 'GET');
    }
  });

  // Fetch analytics for selected quiz
  const { data: analytics, isLoading: analyticsLoading } = useQuery({
    queryKey: [`/api/teacher/quiz/${selectedQuizId}/analytics`],
    enabled: !!selectedQuizId,
    queryFn: async () => {
      return apiRequest(`/api/teacher/quiz/${selectedQuizId}/analytics`, 'GET');
    }
  });

  // Fetch overall statistics
  const { data: overallStats } = useQuery({
    queryKey: [`/api/teacher/quiz-stats`, timeRange],
    queryFn: async () => {
      return apiRequest(`/api/teacher/quiz-stats?range=${timeRange}`, 'GET');
    }
  });

  // Format time duration
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Get difficulty color
  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty.toLowerCase()) {
      case 'easy': return '#10b981';
      case 'medium': return '#f59e0b';
      case 'hard': return '#ef4444';
      default: return '#6b7280';
    }
  };

  // Calculate performance trends
  const calculateTrend = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  // Colors for charts
  const CHART_COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899'];

  if (quizzesLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center space-y-4">
          <Brain className="w-16 h-16 text-purple-500 animate-pulse mx-auto" />
          <p>Loading quiz analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Quiz Analytics Dashboard</h2>
          <p className="text-gray-600 dark:text-gray-400">
            Track student performance and quiz effectiveness
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="day">Today</SelectItem>
              <SelectItem value="week">This Week</SelectItem>
              <SelectItem value="month">This Month</SelectItem>
              <SelectItem value="all">All Time</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
        </div>
      </div>

      {/* Overview Cards */}
      {overallStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Total Quizzes</p>
                  <p className="text-2xl font-bold">{overallStats.totalQuizzes || 0}</p>
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{overallStats.quizGrowth || 0}% from last period
                  </p>
                </div>
                <BookOpen className="w-8 h-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Avg Score</p>
                  <p className="text-2xl font-bold">{overallStats.averageScore || 0}%</p>
                  <p className="text-sm text-green-500 flex items-center mt-1">
                    <TrendingUp className="w-3 h-3 mr-1" />
                    +{overallStats.scoreImprovement || 0}% improvement
                  </p>
                </div>
                <Target className="w-8 h-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Completion Rate</p>
                  <p className="text-2xl font-bold">{overallStats.completionRate || 0}%</p>
                  <p className="text-sm text-yellow-500 flex items-center mt-1">
                    <TrendingDown className="w-3 h-3 mr-1" />
                    -{overallStats.completionDrop || 0}% drop
                  </p>
                </div>
                <CheckCircle className="w-8 h-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Active Students</p>
                  <p className="text-2xl font-bold">{overallStats.activeStudents || 0}</p>
                  <p className="text-sm text-blue-500 flex items-center mt-1">
                    <Users className="w-3 h-3 mr-1" />
                    {overallStats.newStudents || 0} new this week
                  </p>
                </div>
                <Users className="w-8 h-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Quiz Selection and Analytics */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Quiz List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Recent Quizzes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-96 overflow-y-auto">
              {quizzes?.map((quiz: any) => (
                <motion.div
                  key={quiz.id}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={cn(
                    "p-3 rounded-lg border cursor-pointer transition-colors",
                    selectedQuizId === quiz.id
                      ? "bg-blue-50 border-blue-200 dark:bg-blue-900/20"
                      : "hover:bg-gray-50 dark:hover:bg-gray-800"
                  )}
                  onClick={() => setSelectedQuizId(quiz.id)}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-sm">{quiz.title}</h4>
                      <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {quiz.questionCount} questions
                      </p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs">
                          {quiz.attempts} attempts
                        </Badge>
                        <Badge 
                          variant={quiz.averageScore > 70 ? "default" : "destructive"}
                          className="text-xs"
                        >
                          {quiz.averageScore}% avg
                        </Badge>
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Analytics Tabs */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle>
              {selectedQuizId ? analytics?.title : 'Select a Quiz'}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {selectedQuizId && analytics ? (
              <Tabs defaultValue="overview" className="w-full">
                <TabsList className="grid w-full grid-cols-4">
                  <TabsTrigger value="overview">Overview</TabsTrigger>
                  <TabsTrigger value="questions">Questions</TabsTrigger>
                  <TabsTrigger value="students">Students</TabsTrigger>
                  <TabsTrigger value="trends">Trends</TabsTrigger>
                </TabsList>

                <TabsContent value="overview" className="space-y-4">
                  {/* Performance Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Average Score</span>
                        <span className="font-bold">{analytics.averageScore}%</span>
                      </div>
                      <Progress value={analytics.averageScore} className="h-2" />
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Completion Rate</span>
                        <span className="font-bold">{analytics.completionRate}%</span>
                      </div>
                      <Progress value={analytics.completionRate} className="h-2" />
                    </div>
                  </div>

                  {/* Topic Performance Chart */}
                  <div className="mt-6">
                    <h4 className="text-sm font-semibold mb-3">Topic Performance</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <BarChart data={analytics.topicPerformance}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="topic" />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="averageScore" fill="#3b82f6" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>

                <TabsContent value="questions" className="space-y-4">
                  {/* Question Analysis */}
                  <div className="space-y-3">
                    {analytics.questionStats?.map((question: any, idx: number) => (
                      <div key={question.questionId} className="p-3 border rounded-lg">
                        <div className="flex justify-between items-start mb-2">
                          <p className="text-sm font-medium">Q{idx + 1}: {question.questionText}</p>
                          <Badge 
                            style={{ backgroundColor: getDifficultyColor(question.difficulty) }}
                            className="text-white"
                          >
                            {question.difficulty}
                          </Badge>
                        </div>
                        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400">
                          <span>Success Rate: {question.correctRate}%</span>
                          <span>Avg Time: {formatTime(question.averageTimeSpent)}</span>
                        </div>
                        <Progress value={question.correctRate} className="h-2 mt-2" />
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="students" className="space-y-4">
                  {/* Student Performance Table */}
                  <div className="space-y-2">
                    {analytics.studentPerformance?.map((student: any) => (
                      <div key={student.studentId} className="flex justify-between items-center p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{student.studentName}</p>
                          <p className="text-sm text-gray-600 dark:text-gray-400">
                            Completed: {new Date(student.completedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="flex items-center gap-4">
                          <Badge 
                            variant={student.score >= 70 ? "default" : "destructive"}
                          >
                            {student.score}%
                          </Badge>
                          <span className="text-sm text-gray-600 dark:text-gray-400">
                            {formatTime(student.timeSpent)}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                </TabsContent>

                <TabsContent value="trends" className="space-y-4">
                  {/* Performance Trends */}
                  <div>
                    <h4 className="text-sm font-semibold mb-3">Score Trends</h4>
                    <ResponsiveContainer width="100%" height={200}>
                      <LineChart data={analytics.scoreTrends || []}>
                        <CartesianGrid strokeDasharray="3 3" />
                        <XAxis dataKey="date" />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="averageScore" stroke="#3b82f6" />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center h-64 text-gray-500">
                <Brain className="w-12 h-12 mb-4" />
                <p>Select a quiz to view analytics</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Insights and Recommendations */}
      {selectedQuizId && analytics && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="w-5 h-5 text-yellow-500" />
              Insights & Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.averageScore < 60 && (
                <div className="flex items-start gap-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg">
                  <XCircle className="w-5 h-5 text-red-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Low Average Score</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Consider reviewing the difficulty level or providing additional study materials for challenging topics.
                    </p>
                  </div>
                </div>
              )}

              {analytics.completionRate < 70 && (
                <div className="flex items-start gap-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
                  <AlertCircle className="w-5 h-5 text-yellow-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Low Completion Rate</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      The quiz may be too long or difficult. Consider breaking it into smaller sections.
                    </p>
                  </div>
                </div>
              )}

              {analytics.averageScore > 85 && (
                <div className="flex items-start gap-3 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <CheckCircle className="w-5 h-5 text-green-500 mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">Excellent Performance</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                      Students are mastering this content. Consider introducing more advanced topics.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}