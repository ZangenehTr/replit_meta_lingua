import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { 
  Calendar, Clock, Download, FileText, TrendingUp, Trophy, 
  BarChart3, LineChart, Target, Award, BookOpen, User,
  Filter, Search, ChevronDown, ChevronUp
} from 'lucide-react';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, BarChart, Bar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { format } from 'date-fns';

// TypeScript interfaces for MST data
interface SkillResult {
  skill: 'listening' | 'reading' | 'speaking' | 'writing';
  band: string;
  score: number;
  confidence: number;
  timeSpentSec: number;
}

interface TestResult {
  id: number;
  sessionId: string;
  startedAt: string;
  completedAt?: string;
  status: 'completed' | 'in_progress' | 'expired';
  overallBand: string;
  overallScore: number;
  totalTimeMin: number;
  skillResults: SkillResult[];
  targetLanguage: string;
}

interface Analytics {
  totalAttempts: number;
  averageScore: number;
  highestScore: number;
  mostRecentBand: string | null;
  skillProgression: Record<string, number[]>;
  improvementRate: number;
  consistencyScore: number;
  strongestSkill: string | null;
  weakestSkill: string | null;
}

interface TestResultsData {
  history: TestResult[];
  analytics: Analytics;
}

// CEFR Band colors and configuration
const CEFR_BANDS = {
  A1: { color: 'bg-red-500', label: 'Beginner', range: '0-200', description: 'Basic understanding of familiar expressions' },
  A2: { color: 'bg-orange-500', label: 'Elementary', range: '201-400', description: 'Can communicate in simple routine tasks' },
  B1: { color: 'bg-yellow-500', label: 'Intermediate', range: '401-600', description: 'Can deal with most situations while traveling' },
  B2: { color: 'bg-green-500', label: 'Upper Intermediate', range: '601-750', description: 'Can interact with fluency and spontaneity' },
  C1: { color: 'bg-blue-500', label: 'Advanced', range: '751-900', description: 'Can use language flexibly and effectively' },
  C2: { color: 'bg-purple-500', label: 'Proficient', range: '901-1000', description: 'Can understand virtually everything heard or read' }
} as const;

// Proficiency Band Component
function ProficiencyBand({ band, size = 'md' }: { band: string; size?: 'sm' | 'md' | 'lg' }) {
  const bandInfo = CEFR_BANDS[band as keyof typeof CEFR_BANDS] || CEFR_BANDS.A1;
  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  return (
    <Badge 
      className={`${bandInfo.color} text-white font-bold ${sizeClasses[size]}`}
      data-testid={`proficiency-band-${band}`}
    >
      {band}
    </Badge>
  );
}

// Result Card Component
function ResultCard({ result, isExpanded, onToggle }: { 
  result: TestResult; 
  isExpanded: boolean; 
  onToggle: () => void; 
}) {
  const { t } = useTranslation();
  
  return (
    <Card className="mb-4 hover:shadow-lg transition-shadow" data-testid={`result-card-${result.id}`}>
      <CardHeader className="pb-4">
        <div className="flex justify-between items-start">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <ProficiencyBand band={result.overallBand} />
              <div className="flex items-center text-sm text-gray-600">
                <Calendar className="h-4 w-4 mr-1" />
                {format(new Date(result.startedAt), 'PPP')}
              </div>
              <div className="flex items-center text-sm text-gray-600">
                <Clock className="h-4 w-4 mr-1" />
                {result.totalTimeMin} min
              </div>
            </div>
            <div className="text-2xl font-bold text-gray-900">
              Score: {result.overallScore}/100
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={onToggle}
            data-testid={`toggle-details-${result.id}`}
          >
            {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
      </CardHeader>
      
      {isExpanded && (
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
            {result.skillResults.map((skill) => (
              <div key={skill.skill} className="text-center p-3 bg-gray-50 rounded-lg" data-testid={`skill-${skill.skill}-${result.id}`}>
                <div className="font-semibold text-sm text-gray-600 mb-1 capitalize">
                  {skill.skill}
                </div>
                <ProficiencyBand band={skill.band} size="sm" />
                <div className="text-sm text-gray-500 mt-1">
                  {skill.score}/100
                </div>
              </div>
            ))}
          </div>
          
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <strong>Test ID:</strong> {result.sessionId}
            </div>
            <div>
              <strong>Status:</strong> 
              <Badge variant={result.status === 'completed' ? 'default' : 'secondary'} className="ml-2">
                {result.status}
              </Badge>
            </div>
          </div>
        </CardContent>
      )}
    </Card>
  );
}

// Analytics Dashboard Component
function AnalyticsDashboard({ analytics, history }: { analytics: Analytics; history: TestResult[] }) {
  const { t } = useTranslation();

  // Prepare chart data
  const progressData = history
    .filter(test => test.status === 'completed')
    .reverse() // Chronological order
    .map((test, index) => ({
      attempt: index + 1,
      date: format(new Date(test.startedAt), 'MMM dd'),
      overall: test.overallScore,
      listening: test.skillResults.find(s => s.skill === 'listening')?.score || 0,
      reading: test.skillResults.find(s => s.skill === 'reading')?.score || 0,
      speaking: test.skillResults.find(s => s.skill === 'speaking')?.score || 0,
      writing: test.skillResults.find(s => s.skill === 'writing')?.score || 0,
    }));

  // Radar chart data for latest test
  const latestTest = history.find(test => test.status === 'completed');
  const radarData = latestTest ? [
    {
      skill: 'Listening',
      score: latestTest.skillResults.find(s => s.skill === 'listening')?.score || 0,
      fullMark: 100
    },
    {
      skill: 'Reading', 
      score: latestTest.skillResults.find(s => s.skill === 'reading')?.score || 0,
      fullMark: 100
    },
    {
      skill: 'Speaking',
      score: latestTest.skillResults.find(s => s.skill === 'speaking')?.score || 0,
      fullMark: 100
    },
    {
      skill: 'Writing',
      score: latestTest.skillResults.find(s => s.skill === 'writing')?.score || 0,
      fullMark: 100
    }
  ] : [];

  return (
    <div className="space-y-6">
      {/* Summary Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card data-testid="stat-total-attempts">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-blue-600">{analytics.totalAttempts}</div>
            <div className="text-sm text-gray-600">Total Attempts</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-average-score">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-green-600">{analytics.averageScore.toFixed(1)}</div>
            <div className="text-sm text-gray-600">Average Score</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-highest-score">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-purple-600">{analytics.highestScore}</div>
            <div className="text-sm text-gray-600">Highest Score</div>
          </CardContent>
        </Card>
        <Card data-testid="stat-improvement">
          <CardContent className="p-4 text-center">
            <div className="text-2xl font-bold text-orange-600">
              {analytics.improvementRate > 0 ? '+' : ''}{analytics.improvementRate}
            </div>
            <div className="text-sm text-gray-600">Improvement Rate</div>
          </CardContent>
        </Card>
      </div>

      {/* Progress Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Score Progression
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RechartsLineChart data={progressData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="overall" stroke="#8884d8" strokeWidth={3} name="Overall" />
                <Line type="monotone" dataKey="listening" stroke="#82ca9d" name="Listening" />
                <Line type="monotone" dataKey="reading" stroke="#ffc658" name="Reading" />
                <Line type="monotone" dataKey="speaking" stroke="#ff7c7c" name="Speaking" />
                <Line type="monotone" dataKey="writing" stroke="#8dd1e1" name="Writing" />
              </RechartsLineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Latest Test Breakdown
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <RadarChart data={radarData}>
                <PolarGrid />
                <PolarAngleAxis dataKey="skill" />
                <PolarRadiusAxis angle={90} domain={[0, 100]} />
                <Radar name="Score" dataKey="score" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Strengths and Weaknesses */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="bg-green-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-green-700">
              <Trophy className="h-5 w-5" />
              Strongest Skill
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-800 capitalize">
              {analytics.strongestSkill || 'N/A'}
            </div>
            <div className="text-sm text-green-600">
              Keep up the excellent work!
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-orange-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-700">
              <Target className="h-5 w-5" />
              Focus Area
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-800 capitalize">
              {analytics.weakestSkill || 'N/A'}
            </div>
            <div className="text-sm text-orange-600">
              Consider additional practice
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Export Functions
function useExportFunctions() {
  const { toast } = useToast();

  const exportCSV = async () => {
    try {
      const response = await fetch('/api/student/test-results/export-csv', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'mst-test-results.csv';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'Export Successful',
        description: 'Your test results have been exported to CSV.',
      });
    } catch (error) {
      toast({
        title: 'Export Failed',
        description: 'Failed to export test results. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const exportPDF = async () => {
    try {
      toast({
        title: 'Generating PDF...',
        description: 'Creating your comprehensive test report. This may take a moment.',
      });

      const response = await fetch('/api/student/test-results/export-pdf', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        if (response.status === 404) {
          throw new Error('No test results found to export');
        }
        throw new Error('PDF export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      
      // Extract filename from response headers if available
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = 'mst-test-results.pdf';
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename[^;=\n]*=((['"]).*?\2|[^;\n]*)/);
        if (filenameMatch && filenameMatch[1]) {
          filename = filenameMatch[1].replace(/['"]/g, '');
        }
      }
      
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast({
        title: 'PDF Export Successful',
        description: 'Your comprehensive test report has been downloaded with charts and analytics.',
      });
    } catch (error) {
      console.error('PDF export error:', error);
      toast({
        title: 'PDF Export Failed',
        description: error instanceof Error ? error.message : 'Failed to generate PDF report. Please try again.',
        variant: 'destructive',
      });
    }
  };

  return { exportCSV, exportPDF };
}

// Main Test Results Page Component
export default function TestResultsPage() {
  const { t } = useTranslation();
  const { toast } = useToast();

  // SEO and accessibility
  useEffect(() => {
    document.title = 'Test Results History - MST Language Proficiency Tests';
    
    // Add meta description
    let metaDescription = document.querySelector('meta[name="description"]');
    if (!metaDescription) {
      metaDescription = document.createElement('meta');
      metaDescription.setAttribute('name', 'description');
      document.head.appendChild(metaDescription);
    }
    metaDescription.setAttribute('content', 'View your complete MST language proficiency test history with detailed analytics, score progression, and downloadable reports. Track your language learning progress over time.');

    // Add Open Graph tags
    let ogTitle = document.querySelector('meta[property="og:title"]');
    if (!ogTitle) {
      ogTitle = document.createElement('meta');
      ogTitle.setAttribute('property', 'og:title');
      document.head.appendChild(ogTitle);
    }
    ogTitle.setAttribute('content', 'MST Test Results History');

    let ogDescription = document.querySelector('meta[property="og:description"]');
    if (!ogDescription) {
      ogDescription = document.createElement('meta');
      ogDescription.setAttribute('property', 'og:description');
      document.head.appendChild(ogDescription);
    }
    ogDescription.setAttribute('content', 'Comprehensive language proficiency test analytics and progress tracking for MST assessments.');

    return () => {
      document.title = 'Meta Lingua Academy';
    };
  }, []);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [expandedCards, setExpandedCards] = useState<Set<number>>(new Set());
  const { exportCSV, exportPDF } = useExportFunctions();

  // Fetch test results data
  const { data, isLoading, error } = useQuery<TestResultsData>({
    queryKey: ['test-results'],
    queryFn: async () => {
      const response = await fetch('/api/student/test-results', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch test results');
      }
      return response.json().then(res => res.data);
    }
  });

  // Fetch retake eligibility
  const { data: retakeEligibility } = useQuery({
    queryKey: ['retake-eligibility'],
    queryFn: async () => {
      const response = await fetch('/api/student/test-retake-eligibility', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        throw new Error('Failed to fetch retake eligibility');
      }
      return response.json().then(res => res.data);
    }
  });

  // Filter and search functionality
  const filteredResults = data?.history?.filter(result => {
    const matchesSearch = result.sessionId.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         result.overallBand.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesFilter = filterStatus === 'all' || result.status === filterStatus;
    return matchesSearch && matchesFilter;
  }) || [];

  const toggleCardExpanded = (id: number) => {
    setExpandedCards(prev => {
      const newSet = new Set(prev);
      if (newSet.has(id)) {
        newSet.delete(id);
      } else {
        newSet.add(id);
      }
      return newSet;
    });
  };

  if (isLoading) {
    return (
      <div className="max-w-7xl mx-auto p-6 space-y-6">
        <Skeleton className="h-8 w-64" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Skeleton className="h-64 lg:col-span-2" />
          <Skeleton className="h-64" />
        </div>
        <div className="space-y-4">
          {[1, 2, 3].map(i => (
            <Skeleton key={i} className="h-32 w-full" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="max-w-7xl mx-auto p-6">
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6 text-center">
            <div className="text-red-600 mb-2">Error loading test results</div>
            <Button onClick={() => window.location.reload()}>Try Again</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const noResults = !data || data.history.length === 0;

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="page-title">
            Test Results History
          </h1>
          <p className="text-gray-600">
            Track your language proficiency progress over time
          </p>
        </div>
        
        {!noResults && (
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              onClick={exportCSV}
              data-testid="export-csv-button"
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
            <Button 
              variant="outline" 
              onClick={exportPDF}
              data-testid="export-pdf-button"
            >
              <FileText className="h-4 w-4 mr-2" />
              Export PDF
            </Button>
          </div>
        )}
      </div>

      {/* Retake Status */}
      {retakeEligibility && (
        <Card className={`border-l-4 ${retakeEligibility.canRetake ? 'border-l-green-500 bg-green-50' : 'border-l-orange-500 bg-orange-50'}`}>
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div>
                <div className="font-semibold">
                  {retakeEligibility.canRetake ? 'You can take a new test' : 'Test limit reached'}
                </div>
                <div className="text-sm text-gray-600">
                  {retakeEligibility.canRetake 
                    ? `${retakeEligibility.remainingAttempts} attempts remaining this period`
                    : `Next test available: ${retakeEligibility.nextAvailableDate ? format(new Date(retakeEligibility.nextAvailableDate), 'PPP') : 'N/A'}`
                  }
                </div>
              </div>
              {retakeEligibility.canRetake && (
                <Button data-testid="take-new-test-button">
                  <BookOpen className="h-4 w-4 mr-2" />
                  Take New Test
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {noResults ? (
        <Card className="text-center py-12">
          <CardContent>
            <BookOpen className="h-16 w-16 mx-auto text-gray-400 mb-4" />
            <h2 className="text-xl font-semibold text-gray-700 mb-2">No Test Results Yet</h2>
            <p className="text-gray-600 mb-6">
              Take your first MST proficiency test to see your results here.
            </p>
            <Button data-testid="take-first-test-button">
              <Award className="h-4 w-4 mr-2" />
              Take Your First Test
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Tabs defaultValue="results" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="results" data-testid="results-tab">
              Test Results
            </TabsTrigger>
            <TabsTrigger value="analytics" data-testid="analytics-tab">
              Analytics
            </TabsTrigger>
          </TabsList>

          <TabsContent value="results" className="space-y-6">
            {/* Search and Filter */}
            <Card>
              <CardContent className="p-4">
                <div className="flex flex-col md:flex-row gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search by test ID or proficiency level..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                      data-testid="search-input"
                    />
                  </div>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-full md:w-48" data-testid="filter-select">
                      <Filter className="h-4 w-4 mr-2" />
                      <SelectValue placeholder="Filter by status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tests</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="expired">Expired</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            {/* Results List */}
            <div className="space-y-4" data-testid="results-list">
              {filteredResults.map((result) => (
                <ResultCard
                  key={result.id}
                  result={result}
                  isExpanded={expandedCards.has(result.id)}
                  onToggle={() => toggleCardExpanded(result.id)}
                />
              ))}
              
              {filteredResults.length === 0 && (
                <Card className="text-center py-8">
                  <CardContent>
                    <div className="text-gray-500">No results match your search criteria.</div>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="space-y-6">
            <AnalyticsDashboard analytics={data.analytics} history={data.history} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}