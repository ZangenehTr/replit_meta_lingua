import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { AppLayout } from "@/components/layout/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Users, 
  TrendingUp, 
  AlertTriangle,
  Target,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Star,
  Brain,
  Lightbulb,
  BarChart3,
  Sparkles,
  Activity,
  Shield,
  Zap,
  Award,
  MessageSquare,
  Settings,
  Search,
  Filter,
  RefreshCw,
  Download,
  Plus,
  Eye,
  ChevronRight,
  TrendingDown,
  Minus
} from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  Legend,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  ScatterChart,
  Scatter
} from 'recharts';
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

// ============================================================================
// INTERFACES & TYPES
// ============================================================================

interface StudentMetrics {
  studentId: number;
  overallProgress: number;
  skillScores: {
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  learningVelocity: number;
  consistencyScore: number;
  engagementLevel: number;
  riskLevel: 'minimal' | 'low' | 'moderate' | 'high' | 'critical';
}

interface CohortAnalytics {
  totalStudents: number;
  activeStudents: number;
  averageProgress: number;
  studentGrowth: number;
  progressTrend: 'improving' | 'stable' | 'declining';
  performanceDistribution: {
    excellent: number;
    good: number;
    satisfactory: number;
    needsImprovement: number;
    critical: number;
  };
  topPerformers: Array<{
    studentId: number;
    name: string;
    progress: number;
  }>;
  atRiskStudents: Array<{
    studentId: number;
    name: string;
    riskLevel: string;
    primaryConcerns: string[];
  }>;
}

interface RiskAssessment {
  highRiskCount: number;
  moderateRiskCount: number;
  lowRiskCount: number;
  riskTrend: number;
  radarData: Array<{
    factor: string;
    risk: number;
  }>;
  factors: Array<{
    name: string;
    level: 'high' | 'medium' | 'low';
    description: string;
  }>;
}

interface ProgressTrends {
  dateRange: string;
  data: Array<{
    date: string;
    averageProgress: number;
    completionRate: number;
    engagementLevel: number;
    newEnrollments: number;
  }>;
}

interface AIInsight {
  summary: string;
  strengths: string[];
  improvementAreas: string[];
  recommendations: Array<{
    priority: 'high' | 'medium' | 'low';
    action: string;
    rationale: string;
    expectedOutcome: string;
    timeframe: string;
  }>;
  culturalContext: string;
  motivationalMessage: string;
}

interface InterventionData {
  activeCount: number;
  effectivenessTrend: number;
  successRate: number;
  recentInterventions: Array<{
    id: number;
    studentId: number;
    studentName: string;
    type: string;
    status: string;
    effectiveness: number;
  }>;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

function MentorDashboard() {
  const { user } = useAuth();
  const { t } = useTranslation(['mentor', 'common']);
  const { isRTL, language: currentLanguage } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // State management
  const [selectedStudent, setSelectedStudent] = useState<number | null>(null);
  const [timeRange, setTimeRange] = useState('month');
  const [searchTerm, setSearchTerm] = useState('');
  const [activeTab, setActiveTab] = useState('overview');

  const mentorId = user?.id;

  // ============================================================================
  // REACT QUERY HOOKS - 17 API ENDPOINTS
  // ============================================================================

  // Analytics Endpoints (11)
  const { data: studentMetrics, isLoading: studentMetricsLoading } = useQuery<StudentMetrics>({
    queryKey: ['/api/enhanced-mentoring/analytics/metrics', selectedStudent],
    enabled: !!selectedStudent,
    staleTime: 5 * 60 * 1000,
    retry: (failureCount, error: any) => {
      if (error?.status === 403) return false;
      return failureCount < 3;
    }
  });

  const { data: cohortAnalytics, isLoading: cohortLoading, error: cohortError, refetch: refetchCohort } = useQuery<CohortAnalytics>({
    queryKey: ['/api/enhanced-mentoring/analytics/mentor', mentorId, 'cohort'],
    enabled: !!mentorId,
    staleTime: 5 * 60 * 1000,
    gcTime: 10 * 60 * 1000
  });

  const { data: velocityDistribution, isLoading: velocityLoading } = useQuery({
    queryKey: ['/api/enhanced-mentoring/analytics/mentor', mentorId, 'velocity-distribution'],
    enabled: !!mentorId,
    staleTime: 5 * 60 * 1000
  });

  const { data: progressTrends, isLoading: trendsLoading } = useQuery<ProgressTrends>({
    queryKey: ['/api/enhanced-mentoring/analytics/trends', selectedStudent, { 
      dateFrom: getDateRange(timeRange).from, 
      dateTo: getDateRange(timeRange).to 
    }],
    enabled: !!selectedStudent,
    staleTime: 3 * 60 * 1000
  });

  const { data: riskAssessment, isLoading: riskLoading } = useQuery<RiskAssessment>({
    queryKey: ['/api/enhanced-mentoring/analytics/risk', selectedStudent],
    enabled: !!selectedStudent,
    staleTime: 5 * 60 * 1000
  });

  const { data: predictions, isLoading: predictionsLoading } = useQuery({
    queryKey: ['/api/enhanced-mentoring/analytics/predict', selectedStudent],
    enabled: !!selectedStudent,
    staleTime: 10 * 60 * 1000
  });

  const { data: interventionEffectiveness, isLoading: interventionsLoading } = useQuery<InterventionData>({
    queryKey: ['/api/enhanced-mentoring/analytics/intervention-effectiveness', mentorId],
    enabled: !!mentorId,
    staleTime: 5 * 60 * 1000
  });

  // AI Insights Endpoints (6)
  const { data: studentInsights, isLoading: studentInsightsLoading } = useQuery<AIInsight>({
    queryKey: ['/api/enhanced-mentoring/insights/student', selectedStudent, { language: currentLanguage }],
    enabled: !!selectedStudent,
    staleTime: 10 * 60 * 1000
  });

  const { data: progressInsights, isLoading: progressInsightsLoading } = useQuery<AIInsight>({
    queryKey: ['/api/enhanced-mentoring/insights/progress', selectedStudent, { language: currentLanguage }],
    enabled: !!selectedStudent,
    staleTime: 10 * 60 * 1000
  });

  const { data: riskInsights, isLoading: riskInsightsLoading } = useQuery({
    queryKey: ['/api/enhanced-mentoring/insights/risk', selectedStudent, { language: currentLanguage }],
    enabled: !!selectedStudent,
    staleTime: 10 * 60 * 1000
  });

  const { data: cohortInsights, isLoading: cohortInsightsLoading } = useQuery<AIInsight>({
    queryKey: ['/api/enhanced-mentoring/insights/mentor', mentorId, 'cohort', { language: currentLanguage }],
    enabled: !!mentorId,
    staleTime: 15 * 60 * 1000
  });

  const { data: interventionInsights, isLoading: interventionInsightsLoading } = useQuery({
    queryKey: ['/api/enhanced-mentoring/insights/mentor', mentorId, 'interventions', { language: currentLanguage }],
    enabled: !!mentorId,
    staleTime: 15 * 60 * 1000
  });

  const { data: comparativeInsights, isLoading: comparativeInsightsLoading } = useQuery({
    queryKey: ['/api/enhanced-mentoring/insights/comparative', mentorId, { language: currentLanguage }],
    enabled: !!mentorId,
    staleTime: 20 * 60 * 1000
  });

  // ============================================================================
  // MUTATIONS
  // ============================================================================

  const createInterventionMutation = useMutation({
    mutationFn: async (intervention: { studentId: number; type: string; description: string; priority: string }) => {
      return apiRequest(`/api/enhanced-mentoring/analytics/intervention/${intervention.studentId}`, {
        method: 'POST',
        body: intervention
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-mentoring/insights/mentor'] });
      queryClient.invalidateQueries({ queryKey: ['/api/enhanced-mentoring/analytics/intervention-effectiveness'] });
      toast({ title: t('dashboard.interventionCreated'), variant: 'default' });
    },
    onError: (error) => {
      toast({ title: t('dashboard.interventionError'), variant: 'destructive' });
    }
  });

  // ============================================================================
  // HELPER FUNCTIONS
  // ============================================================================

  function getDateRange(range: string) {
    const now = new Date();
    const from = new Date();
    
    switch (range) {
      case 'week':
        from.setDate(now.getDate() - 7);
        break;
      case 'month':
        from.setMonth(now.getMonth() - 1);
        break;
      case 'quarter':
        from.setMonth(now.getMonth() - 3);
        break;
      default:
        from.setMonth(now.getMonth() - 1);
    }
    
    return {
      from: from.toISOString().split('T')[0],
      to: now.toISOString().split('T')[0]
    };
  }

  const getProgressColor = (progress: number) => {
    if (progress >= 80) return 'text-green-600';
    if (progress >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'critical': return 'text-red-700 bg-red-50 border-red-200';
      case 'high': return 'text-red-600 bg-red-50 border-red-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-blue-600 bg-blue-50 border-blue-200';
      default: return 'text-green-600 bg-green-50 border-green-200';
    }
  };

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-500" />;
  };

  // ============================================================================
  // ERROR & LOADING STATES
  // ============================================================================

  if (cohortError) {
    return (
      <AppLayout>
        <div className="p-6">
          <Alert variant="destructive" data-testid="dashboard-error">
            <AlertTriangle className="h-4 w-4" />
            <AlertTitle>{t('dashboard.error.title')}</AlertTitle>
            <AlertDescription>
              {t('dashboard.error.message')}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => refetchCohort()}
                className="ml-2"
                data-testid="button-retry"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                {t('dashboard.retry')}
              </Button>
            </AlertDescription>
          </Alert>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className={`mentor-dashboard-container mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 py-6 space-y-6 ${isRTL ? 'rtl-layout' : 'ltr-layout'}`} dir={isRTL ? 'rtl' : 'ltr'}>
        
        {/* ============================================================================ */}
        {/* HEADER & WELCOME SECTION */}
        {/* ============================================================================ */}
        
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-gradient-to-r from-teal-600 via-cyan-600 to-blue-600 rounded-xl p-6 md:p-8 text-white shadow-xl"
          data-testid="dashboard-header"
        >
          <div className="flex flex-col lg:flex-row items-center justify-between gap-6">
            <div className="text-center lg:text-left">
              <h1 className="text-2xl md:text-3xl font-bold mb-2">
                {t('dashboard.welcome')}, {user?.firstName || t('dashboard.mentor')}! 🌟
              </h1>
              <p className="text-sm md:text-base opacity-90">
                {t('dashboard.welcomeMessage')}
              </p>
            </div>
            
            <div className="flex flex-wrap gap-3">
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[100px]">
                <p className="text-xs opacity-90 mb-1">{t('dashboard.totalStudents')}</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1">
                  <Users className="h-5 w-5" />
                  {cohortLoading ? '...' : cohortAnalytics?.totalStudents || 0}
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[100px]">
                <p className="text-xs opacity-90 mb-1">{t('dashboard.averageProgress')}</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1">
                  <TrendingUp className="h-5 w-5" />
                  {cohortLoading ? '...' : `${cohortAnalytics?.averageProgress?.toFixed(1) || 0}%`}
                </p>
              </div>
              
              <div className="bg-white/20 backdrop-blur-sm rounded-lg px-4 py-3 text-center min-w-[100px]">
                <p className="text-xs opacity-90 mb-1">{t('dashboard.atRiskStudents')}</p>
                <p className="text-xl font-bold flex items-center justify-center gap-1">
                  <AlertTriangle className="h-5 w-5" />
                  {riskLoading ? '...' : cohortAnalytics?.atRiskStudents?.length || riskAssessment?.highRiskCount || 0}
                </p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* ============================================================================ */}
        {/* STUDENT OVERVIEW CARDS */}
        {/* ============================================================================ */}
        
        <Card className="mentor-dashboard-overview" data-testid="dashboard-overview">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
            <CardTitle className="text-xl font-semibold">{t('dashboard.studentOverview')}</CardTitle>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" data-testid="button-refresh-overview">
                <RefreshCw className="h-4 w-4" />
              </Button>
              <Button variant="outline" size="sm" data-testid="button-export-data">
                <Download className="h-4 w-4" />
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
              
              {/* Total Students Card */}
              <Card className="touch-target border-l-4 border-l-teal-500" data-testid="stat-total-students">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.totalStudents')}</p>
                      <p className="text-2xl font-bold">
                        {cohortLoading ? <Skeleton className="h-8 w-12" /> : cohortAnalytics?.totalStudents || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(cohortAnalytics?.studentGrowth || 0)}
                        <span className="text-xs text-muted-foreground">
                          {cohortAnalytics?.studentGrowth ? `${cohortAnalytics.studentGrowth > 0 ? '+' : ''}${cohortAnalytics.studentGrowth}%` : '0%'} {t('dashboard.thisMonth')}
                        </span>
                      </div>
                    </div>
                    <Users className="h-8 w-8 text-teal-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Average Progress Card */}
              <Card className="touch-target border-l-4 border-l-green-500" data-testid="stat-average-progress">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.averageProgress')}</p>
                      <p className="text-2xl font-bold">
                        {cohortLoading ? <Skeleton className="h-8 w-16" /> : `${cohortAnalytics?.averageProgress?.toFixed(1) || 0}%`}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {cohortAnalytics?.progressTrend === 'improving' ? (
                          <TrendingUp className="h-4 w-4 text-green-500" />
                        ) : cohortAnalytics?.progressTrend === 'declining' ? (
                          <TrendingDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <Minus className="h-4 w-4 text-gray-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          {t(`dashboard.trend.${cohortAnalytics?.progressTrend || 'stable'}`)}
                        </span>
                      </div>
                    </div>
                    <TrendingUp className="h-8 w-8 text-green-500" />
                  </div>
                </CardContent>
              </Card>

              {/* At-Risk Students Card */}
              <Card className="touch-target border-l-4 border-l-red-500" data-testid="stat-at-risk-students">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.atRiskStudents')}</p>
                      <p className="text-2xl font-bold text-red-600">
                        {riskLoading ? <Skeleton className="h-8 w-8" /> : cohortAnalytics?.atRiskStudents?.length || riskAssessment?.highRiskCount || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(riskAssessment?.riskTrend || 0)}
                        <span className="text-xs text-muted-foreground">
                          {riskAssessment?.riskTrend ? `${riskAssessment.riskTrend > 0 ? '+' : ''}${riskAssessment.riskTrend}%` : '0%'} {t('dashboard.thisWeek')}
                        </span>
                      </div>
                    </div>
                    <AlertTriangle className="h-8 w-8 text-red-500" />
                  </div>
                </CardContent>
              </Card>

              {/* Active Interventions Card */}
              <Card className="touch-target border-l-4 border-l-blue-500" data-testid="stat-active-interventions">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">{t('dashboard.interventionsActive')}</p>
                      <p className="text-2xl font-bold">
                        {interventionsLoading ? <Skeleton className="h-8 w-8" /> : interventionEffectiveness?.activeCount || 0}
                      </p>
                      <div className="flex items-center gap-1 mt-1">
                        {getTrendIcon(interventionEffectiveness?.effectivenessTrend || 0)}
                        <span className="text-xs text-muted-foreground">
                          {interventionEffectiveness?.successRate ? `${interventionEffectiveness.successRate}%` : '0%'} {t('dashboard.successRate')}
                        </span>
                      </div>
                    </div>
                    <Target className="h-8 w-8 text-blue-500" />
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Student Search and Selection */}
            <div className="flex flex-col sm:flex-row gap-4 items-center">
              <div className="flex-1 w-full">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder={t('dashboard.searchStudents')}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10 touch-target"
                    data-testid="input-student-search"
                  />
                </div>
              </div>
              
              <Select value={selectedStudent?.toString() || ""} onValueChange={(value) => setSelectedStudent(Number(value))}>
                <SelectTrigger className="w-full sm:w-64 touch-target" data-testid="select-student">
                  <SelectValue placeholder={t('dashboard.selectStudent')} />
                </SelectTrigger>
                <SelectContent>
                  {cohortAnalytics?.atRiskStudents?.map((student) => (
                    <SelectItem key={student.studentId} value={student.studentId.toString()}>
                      {student.name} {student.riskLevel !== 'minimal' && (
                        <Badge variant="destructive" className="ml-2 text-xs">
                          {t(`dashboard.riskLevel.${student.riskLevel}`)}
                        </Badge>
                      )}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* ============================================================================ */}
        {/* MAIN DASHBOARD GRID */}
        {/* ============================================================================ */}
        
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          
          {/* LEFT COLUMN - MAIN ANALYTICS */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Progress Trends Chart */}
            <Card className="mentor-dashboard-trends" data-testid="dashboard-progress-trends">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
                <CardTitle className="text-lg font-semibold">{t('dashboard.progressTrends')}</CardTitle>
                <div className="flex gap-2">
                  <Button 
                    variant={timeRange === 'week' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('week')}
                    data-testid="button-timerange-week"
                  >
                    {t('dashboard.thisWeek')}
                  </Button>
                  <Button 
                    variant={timeRange === 'month' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('month')}
                    data-testid="button-timerange-month"
                  >
                    {t('dashboard.thisMonth')}
                  </Button>
                  <Button 
                    variant={timeRange === 'quarter' ? 'default' : 'outline'} 
                    size="sm" 
                    onClick={() => setTimeRange('quarter')}
                    data-testid="button-timerange-quarter"
                  >
                    {t('dashboard.thisQuarter')}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {trendsLoading || !selectedStudent ? (
                  <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                      <BarChart3 className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">
                        {!selectedStudent ? t('dashboard.selectStudentForTrends') : t('dashboard.loadingTrends')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <ResponsiveContainer width="100%" height={300} data-testid="chart-progress-trends">
                    <LineChart data={progressTrends?.data || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="date" 
                        tick={{ fontSize: 12 }}
                        tickFormatter={(value) => new Date(value).toLocaleDateString(currentLanguage === 'fa' ? 'fa-IR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US')}
                      />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip 
                        contentStyle={{ 
                          background: 'rgba(255, 255, 255, 0.95)', 
                          border: '1px solid #e2e8f0',
                          borderRadius: '8px'
                        }}
                      />
                      <Legend />
                      <Line 
                        type="monotone" 
                        dataKey="averageProgress" 
                        stroke="#0891b2"
                        strokeWidth={3}
                        name={t('dashboard.averageProgress')}
                        dot={{ fill: '#0891b2', strokeWidth: 2, r: 4 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="completionRate" 
                        stroke="#059669"
                        strokeWidth={2}
                        name={t('dashboard.completionRate')}
                        dot={{ fill: '#059669', strokeWidth: 2, r: 3 }}
                      />
                      <Line 
                        type="monotone" 
                        dataKey="engagementLevel" 
                        stroke="#7c3aed"
                        strokeWidth={2}
                        name={t('dashboard.engagementLevel')}
                        dot={{ fill: '#7c3aed', strokeWidth: 2, r: 3 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>

            {/* Velocity Distribution Chart */}
            <Card className="mentor-dashboard-velocity" data-testid="dashboard-velocity-distribution">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Zap className="h-5 w-5 text-yellow-500" />
                  {t('dashboard.velocityDistribution')}
                </CardTitle>
                <CardDescription>
                  {t('dashboard.velocityDescription')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                {velocityLoading ? (
                  <Skeleton className="h-64 w-full" />
                ) : (
                  <ResponsiveContainer width="100%" height={250} data-testid="chart-velocity-distribution">
                    <BarChart data={velocityDistribution || []}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis dataKey="range" tick={{ fontSize: 12 }} />
                      <YAxis tick={{ fontSize: 12 }} />
                      <Tooltip />
                      <Bar dataKey="students" fill="#0891b2" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                )}
              </CardContent>
            </Card>
          </div>

          {/* RIGHT COLUMN - INSIGHTS & ACTIONS */}
          <div className="lg:col-span-4 space-y-6">
            
            {/* Risk Assessment Radar */}
            <Card className="mentor-dashboard-risk" data-testid="dashboard-risk-assessment">
              <CardHeader>
                <CardTitle className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="h-5 w-5 text-red-500" />
                  {t('dashboard.riskAssessment')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {riskLoading || !selectedStudent ? (
                  <div className="flex items-center justify-center h-48">
                    <div className="text-center">
                      <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {!selectedStudent ? t('dashboard.selectStudentForRisk') : t('dashboard.loadingRisk')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <ResponsiveContainer width="100%" height={200} data-testid="chart-risk-radar">
                      <RadarChart data={riskAssessment?.radarData || []}>
                        <PolarGrid />
                        <PolarAngleAxis 
                          dataKey="factor" 
                          tick={{ fontSize: 10 }}
                        />
                        <PolarRadiusAxis domain={[0, 100]} tick={false} />
                        <Radar 
                          name={t('dashboard.riskLevel')}
                          dataKey="risk" 
                          stroke="#ef4444" 
                          fill="#ef4444" 
                          fillOpacity={0.3}
                          strokeWidth={2}
                        />
                      </RadarChart>
                    </ResponsiveContainer>
                    
                    <div className="space-y-2">
                      <h4 className="font-semibold text-sm">{t('dashboard.riskFactors')}</h4>
                      {riskAssessment?.factors?.map((factor, index) => (
                        <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                          <span className="text-sm">{t(`dashboard.riskFactor.${factor.name}`)}</span>
                          <Badge 
                            variant={factor.level === 'high' ? 'destructive' : factor.level === 'medium' ? 'default' : 'secondary'}
                            data-testid={`badge-risk-${factor.name}`}
                          >
                            {t(`dashboard.riskLevel.${factor.level}`)}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card data-testid="dashboard-quick-actions">
              <CardHeader>
                <CardTitle className="text-lg font-semibold">{t('dashboard.quickActions')}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  disabled={!selectedStudent}
                  data-testid="button-schedule-session"
                >
                  <Calendar className="h-4 w-4 mr-2" />
                  {t('dashboard.scheduleSession')}
                </Button>
                
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  disabled={!selectedStudent}
                  data-testid="button-create-intervention"
                  onClick={() => {
                    if (selectedStudent) {
                      createInterventionMutation.mutate({
                        studentId: selectedStudent,
                        type: 'academic_support',
                        description: 'Quick intervention created from dashboard',
                        priority: 'medium'
                      });
                    }
                  }}
                >
                  <Target className="h-4 w-4 mr-2" />
                  {t('dashboard.createIntervention')}
                </Button>
                
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  disabled={!selectedStudent}
                  data-testid="button-send-message"
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  {t('dashboard.sendMessage')}
                </Button>
                
                <Button 
                  className="w-full justify-start touch-target" 
                  variant="outline"
                  data-testid="button-view-reports"
                >
                  <BarChart3 className="h-4 w-4 mr-2" />
                  {t('dashboard.viewReports')}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* ============================================================================ */}
        {/* AI INSIGHTS SECTION */}
        {/* ============================================================================ */}
        
        <Card className="mentor-dashboard-insights" data-testid="dashboard-ai-insights">
          <CardHeader>
            <CardTitle className="text-xl font-semibold flex items-center gap-2">
              <Sparkles className="h-6 w-6 text-yellow-500" />
              {t('dashboard.aiInsights')}
            </CardTitle>
            <CardDescription>
              {t('dashboard.aiInsightsDescription')}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
              <TabsList className="grid w-full grid-cols-3 lg:grid-cols-3">
                <TabsTrigger value="student" data-testid="tab-student-insights">{t('dashboard.studentInsights')}</TabsTrigger>
                <TabsTrigger value="cohort" data-testid="tab-cohort-insights">{t('dashboard.cohortInsights')}</TabsTrigger>
                <TabsTrigger value="interventions" data-testid="tab-intervention-insights">{t('dashboard.interventionInsights')}</TabsTrigger>
              </TabsList>
              
              {/* Student Insights Tab */}
              <TabsContent value="student" className="space-y-4" data-testid="content-student-insights">
                {studentInsightsLoading || !selectedStudent ? (
                  <div className="flex items-center justify-center h-32">
                    <div className="text-center">
                      <Brain className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-sm text-muted-foreground">
                        {!selectedStudent ? t('dashboard.selectStudentForInsights') : t('dashboard.loadingInsights')}
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <Alert data-testid="alert-student-summary">
                      <Brain className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {studentInsights?.summary || t('dashboard.noInsightsAvailable')}
                      </AlertDescription>
                    </Alert>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Strengths */}
                      <div>
                        <h5 className="font-semibold text-sm mb-3 text-green-600 flex items-center gap-2">
                          <CheckCircle className="h-4 w-4" />
                          {t('dashboard.strengths')}
                        </h5>
                        <ul className="space-y-2">
                          {studentInsights?.strengths?.map((strength, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`strength-${index}`}>
                              <CheckCircle className="h-4 w-4 text-green-500 mt-0.5 flex-shrink-0" />
                              <span>{strength}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                      
                      {/* Improvement Areas */}
                      <div>
                        <h5 className="font-semibold text-sm mb-3 text-orange-600 flex items-center gap-2">
                          <AlertCircle className="h-4 w-4" />
                          {t('dashboard.improvementAreas')}
                        </h5>
                        <ul className="space-y-2">
                          {studentInsights?.improvementAreas?.map((area, index) => (
                            <li key={index} className="text-sm text-muted-foreground flex items-start gap-2" data-testid={`improvement-${index}`}>
                              <AlertCircle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                              <span>{area}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                    
                    {/* Recommendations */}
                    <div>
                      <h5 className="font-semibold text-sm mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-blue-500" />
                        {t('dashboard.recommendations')}
                      </h5>
                      <div className="space-y-3">
                        {studentInsights?.recommendations?.map((rec, index) => (
                          <Card key={index} className="p-4 border-l-4 border-l-blue-500" data-testid={`recommendation-${index}`}>
                            <div className="space-y-2">
                              <div className="flex items-start justify-between gap-2">
                                <Badge 
                                  variant={rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'}
                                  className="text-xs"
                                >
                                  {t(`dashboard.priority.${rec.priority}`)}
                                </Badge>
                                <Badge variant="outline" className="text-xs">
                                  {rec.timeframe}
                                </Badge>
                              </div>
                              <p className="text-sm font-medium">{rec.action}</p>
                              <p className="text-xs text-muted-foreground">{rec.rationale}</p>
                              <p className="text-xs text-blue-600">
                                <strong>{t('dashboard.expectedOutcome')}:</strong> {rec.expectedOutcome}
                              </p>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Cohort Insights Tab */}
              <TabsContent value="cohort" className="space-y-4" data-testid="content-cohort-insights">
                {cohortInsightsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-4">
                    <Alert data-testid="alert-cohort-summary">
                      <Users className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {cohortInsights?.summary || t('dashboard.noCohortInsightsAvailable')}
                      </AlertDescription>
                    </Alert>
                    
                    {/* Performance Distribution */}
                    <div>
                      <h5 className="font-semibold text-sm mb-3">{t('dashboard.performanceDistribution')}</h5>
                      <div className="grid grid-cols-2 lg:grid-cols-5 gap-2">
                        {cohortAnalytics?.performanceDistribution && Object.entries(cohortAnalytics.performanceDistribution).map(([level, count]) => (
                          <div key={level} className="text-center p-3 rounded-lg bg-muted/50" data-testid={`performance-${level}`}>
                            <p className="text-lg font-bold">{count}</p>
                            <p className="text-xs text-muted-foreground">{t(`dashboard.performance.${level}`)}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
              
              {/* Intervention Insights Tab */}
              <TabsContent value="interventions" className="space-y-4" data-testid="content-intervention-insights">
                {interventionInsightsLoading ? (
                  <Skeleton className="h-48 w-full" />
                ) : (
                  <div className="space-y-4">
                    <Alert data-testid="alert-intervention-summary">
                      <Target className="h-4 w-4" />
                      <AlertDescription className="text-sm">
                        {t('dashboard.interventionSummary')}
                      </AlertDescription>
                    </Alert>
                    
                    {/* Recent Interventions */}
                    <div>
                      <h5 className="font-semibold text-sm mb-3">{t('dashboard.recentInterventions')}</h5>
                      <div className="space-y-2">
                        {interventionEffectiveness?.recentInterventions?.map((intervention, index) => (
                          <Card key={intervention.id} className="p-3" data-testid={`intervention-${intervention.id}`}>
                            <div className="flex items-center justify-between">
                              <div className="flex-1">
                                <p className="text-sm font-medium">{intervention.studentName}</p>
                                <p className="text-xs text-muted-foreground">{intervention.type}</p>
                              </div>
                              <div className="text-right">
                                <Badge variant={intervention.status === 'active' ? 'default' : 'secondary'}>
                                  {intervention.status}
                                </Badge>
                                <p className="text-xs text-muted-foreground mt-1">
                                  {intervention.effectiveness}% {t('dashboard.effective')}
                                </p>
                              </div>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>

        {/* ============================================================================ */}
        {/* FOOTER ACTIONS */}
        {/* ============================================================================ */}
        
        <div className="flex flex-col sm:flex-row gap-4 justify-between items-center pt-6 border-t">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t('dashboard.lastUpdated')}: {new Date().toLocaleString(currentLanguage === 'fa' ? 'fa-IR' : currentLanguage === 'ar' ? 'ar-SA' : 'en-US')}
          </div>
          
          <div className="flex gap-2">
            <Button variant="outline" size="sm" data-testid="button-settings">
              <Settings className="h-4 w-4 mr-2" />
              {t('dashboard.settings')}
            </Button>
            
            <Button variant="outline" size="sm" data-testid="button-help">
              <Lightbulb className="h-4 w-4 mr-2" />
              {t('dashboard.help')}
            </Button>
          </div>
        </div>
      </div>
    </AppLayout>
  );
}

export default MentorDashboard;