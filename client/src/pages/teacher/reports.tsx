import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, Legend
} from 'recharts';
import { 
  TrendingUp, Users, Clock, Award, Star, Calendar, 
  Download, Filter, BarChart3, PieChart as PieChartIcon,
  Target, BookOpen, MessageSquare, Phone
} from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/use-language";

interface TeachingStats {
  totalStudents: number;
  activeClasses: number;
  completedLessons: number;
  averageRating: number;
  totalHours: number;
  attendanceRate: number;
  studentProgress: number;
  monthlyHours: Array<{ month: string; hours: number; lessons: number }>;
  subjectDistribution: Array<{ subject: string; hours: number; percentage: number }>;
  studentRatings: Array<{ rating: number; count: number }>;
  performanceMetrics: {
    preparation: number;
    delivery: number;
    engagement: number;
    feedback: number;
  };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

export default function TeacherReportsPage() {
  const { t } = useLanguage();
  const [dateRange, setDateRange] = useState("last3months");
  const [reportType, setReportType] = useState("overview");

  const { data: stats, isLoading } = useQuery<TeachingStats>({
    queryKey: ["/api/teacher/reports", dateRange],
  });

  const { data: detailedReports = [], isLoading: reportsLoading } = useQuery({
    queryKey: ["/api/teacher/detailed-reports", dateRange],
  });

  if (isLoading || reportsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-64 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {t('teachingReports')}
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              {t('viewAnalyticsReports')}
            </p>
          </div>
          <div className="flex gap-2">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="last30days">{t('last30Days')}</SelectItem>
                <SelectItem value="last3months">{t('last3Months')}</SelectItem>
                <SelectItem value="last6months">{t('last6Months')}</SelectItem>
                <SelectItem value="lastyear">{t('lastYear')}</SelectItem>
              </SelectContent>
            </Select>
            <Button>
              <Download className="w-4 h-4 mr-2" />
              {t('exportReport')}
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalStudents')}</p>
                  <p className="text-2xl font-bold">{stats?.totalStudents || 0}</p>
                  <p className="text-xs text-green-600">+12% {t('fromLastMonth')}</p>
                </div>
                <Users className="w-8 h-8 text-blue-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('completedLessons')}</p>
                  <p className="text-2xl font-bold">{stats?.completedLessons || 0}</p>
                  <p className="text-xs text-green-600">+8% {t('fromLastMonth')}</p>
                </div>
                <BookOpen className="w-8 h-8 text-green-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('averageRating')}</p>
                  <p className="text-2xl font-bold">{stats?.averageRating?.toFixed(1) || '0.0'}</p>
                  <p className="text-xs text-green-600">+0.2 {t('fromLastMonth')}</p>
                </div>
                <Star className="w-8 h-8 text-yellow-600" />
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{t('totalHours')}</p>
                  <p className="text-2xl font-bold">{stats?.totalHours || 0}</p>
                  <p className="text-xs text-green-600">+15% {t('fromLastMonth')}</p>
                </div>
                <Clock className="w-8 h-8 text-purple-600" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">{t('overview')}</TabsTrigger>
            <TabsTrigger value="performance">{t('performance')}</TabsTrigger>
            <TabsTrigger value="students">{t('students')}</TabsTrigger>
            <TabsTrigger value="detailed">{t('detailed')}</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Monthly Teaching Hours */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="w-5 h-5" />
                    {t('monthlyTeachingHours')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.monthlyHours || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#3B82F6" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Subject Distribution */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChartIcon className="w-5 h-5" />
                    {t('subjectDistribution')}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <PieChart>
                      <Pie
                        data={stats?.subjectDistribution || []}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ subject, percentage }) => `${subject} (${percentage}%)`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="hours"
                      >
                        {(stats?.subjectDistribution || []).map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Performance Overview */}
            <Card>
              <CardHeader>
                <CardTitle>{t('performanceOverview')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  <div className="text-center">
                    <div className="text-3xl font-bold text-blue-600 mb-2">
                      {stats?.attendanceRate || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('attendanceRate')}
                    </div>
                    <Progress value={stats?.attendanceRate || 0} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-green-600 mb-2">
                      {stats?.studentProgress || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('avgStudentProgress')}
                    </div>
                    <Progress value={stats?.studentProgress || 0} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-purple-600 mb-2">
                      {stats?.performanceMetrics?.engagement || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('engagementScore')}
                    </div>
                    <Progress value={stats?.performanceMetrics?.engagement || 0} className="mt-2" />
                  </div>
                  
                  <div className="text-center">
                    <div className="text-3xl font-bold text-orange-600 mb-2">
                      {stats?.performanceMetrics?.feedback || 0}%
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t('feedbackScore')}
                    </div>
                    <Progress value={stats?.performanceMetrics?.feedback || 0} className="mt-2" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="performance" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('performanceMetrics')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>{t('preparation')}</span>
                        <span className="font-medium">{stats?.performanceMetrics?.preparation || 0}%</span>
                      </div>
                      <Progress value={stats?.performanceMetrics?.preparation || 0} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>{t('delivery')}</span>
                        <span className="font-medium">{stats?.performanceMetrics?.delivery || 0}%</span>
                      </div>
                      <Progress value={stats?.performanceMetrics?.delivery || 0} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>{t('engagement')}</span>
                        <span className="font-medium">{stats?.performanceMetrics?.engagement || 0}%</span>
                      </div>
                      <Progress value={stats?.performanceMetrics?.engagement || 0} />
                    </div>
                    
                    <div>
                      <div className="flex justify-between mb-2">
                        <span>{t('feedback')}</span>
                        <span className="font-medium">{stats?.performanceMetrics?.feedback || 0}%</span>
                      </div>
                      <Progress value={stats?.performanceMetrics?.feedback || 0} />
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Student Ratings */}
              <Card>
                <CardHeader>
                  <CardTitle>{t('studentRatings')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={300}>
                    <BarChart data={stats?.studentRatings || []}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="rating" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="count" fill="#F59E0B" />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="students" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('studentAnalytics')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('studentAnalyticsComingSoon')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('detailedStudentAnalyticsWillBeAvailable')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>{t('detailedReports')}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    {t('detailedReportsComingSoon')}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('comprehensiveReportsWillBeAvailable')}
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}