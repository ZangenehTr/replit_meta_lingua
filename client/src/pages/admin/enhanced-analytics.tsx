import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { 
  BarChart3, 
  TrendingUp, 
  Users, 
  BookOpen,
  Clock,
  Target,
  Download,
  Filter,
  Calendar,
  PieChart as PieChartIcon,
  LineChart as LineChartIcon,
  Activity
} from "lucide-react";
import { BackButton } from "@/components/ui/back-button";
import { useLanguage } from "@/hooks/useLanguage";

export default function EnhancedAnalytics() {
  const { t } = useTranslation();
  const { language } = useLanguage();
  const isRTL = language === 'fa';

  const [selectedTab, setSelectedTab] = useState("overview");
  const [timeRange, setTimeRange] = useState("30d");

  return (
    <div className="container mx-auto p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      <div className="flex items-center justify-between">
        <div>
          <BackButton />
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mt-4" data-testid="page-title-enhanced-analytics">
            {t('admin:enhancedAnalytics', 'Enhanced Analytics')}
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1" data-testid="page-description-enhanced-analytics">
            {t('admin:enhancedAnalyticsDescription', 'Advanced analytics and insights for learning platform performance')}
          </p>
        </div>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32" data-testid="select-time-range">
              <Calendar className="h-4 w-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">{t('admin:last7Days', 'Last 7 days')}</SelectItem>
              <SelectItem value="30d">{t('admin:last30Days', 'Last 30 days')}</SelectItem>
              <SelectItem value="90d">{t('admin:last90Days', 'Last 90 days')}</SelectItem>
              <SelectItem value="1y">{t('admin:lastYear', 'Last year')}</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" data-testid="button-export-report">
            <Download className="h-4 w-4 mr-2" />
            {t('admin:exportReport', 'Export Report')}
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-active-learners-label">
                  {t('admin:activeLearners', 'Active Learners')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-active-learners-value">2,847</p>
                <p className="text-xs text-green-600" data-testid="metric-active-learners-change">+12% vs last month</p>
              </div>
              <Users className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-completion-rate-label">
                  {t('admin:completionRate', 'Completion Rate')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-completion-rate-value">78.4%</p>
                <p className="text-xs text-green-600" data-testid="metric-completion-rate-change">+3.2% vs last month</p>
              </div>
              <Target className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-avg-study-time-label">
                  {t('admin:avgStudyTime', 'Avg Study Time')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-avg-study-time-value">45m</p>
                <p className="text-xs text-red-600" data-testid="metric-avg-study-time-change">-2m vs last month</p>
              </div>
              <Clock className="h-8 w-8 text-orange-500" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600 dark:text-gray-400" data-testid="metric-engagement-score-label">
                  {t('admin:engagementScore', 'Engagement Score')}
                </p>
                <p className="text-2xl font-bold" data-testid="metric-engagement-score-value">8.3/10</p>
                <p className="text-xs text-green-600" data-testid="metric-engagement-score-change">+0.4 vs last month</p>
              </div>
              <Activity className="h-8 w-8 text-purple-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="overview" data-testid="tab-analytics-overview">
            <BarChart3 className="h-4 w-4 mr-2" />
            {t('admin:overview', 'Overview')}
          </TabsTrigger>
          <TabsTrigger value="learning" data-testid="tab-learning-analytics">
            <BookOpen className="h-4 w-4 mr-2" />
            {t('admin:learning', 'Learning')}
          </TabsTrigger>
          <TabsTrigger value="engagement" data-testid="tab-engagement-analytics">
            <Activity className="h-4 w-4 mr-2" />
            {t('admin:engagement', 'Engagement')}
          </TabsTrigger>
          <TabsTrigger value="performance" data-testid="tab-performance-analytics">
            <TrendingUp className="h-4 w-4 mr-2" />
            {t('admin:performance', 'Performance')}
          </TabsTrigger>
          <TabsTrigger value="predictive" data-testid="tab-predictive-analytics">
            <Target className="h-4 w-4 mr-2" />
            {t('admin:predictive', 'Predictive')}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-user-activity-trends">
                  <LineChartIcon className="h-5 w-5 mr-2 inline" />
                  {t('admin:userActivityTrends', 'User Activity Trends')}
                </CardTitle>
                <CardDescription>
                  {t('admin:userActivityDescription', 'Daily active users and session patterns')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center text-gray-500 py-8" data-testid="chart-user-activity">
                  <LineChartIcon className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:loadingChart', 'Loading activity chart...')}</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle data-testid="card-title-course-popularity">
                  <PieChartIcon className="h-5 w-5 mr-2 inline" />
                  {t('admin:coursePopularity', 'Course Popularity')}
                </CardTitle>
                <CardDescription>
                  {t('admin:coursePopularityDescription', 'Most popular courses and learning paths')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {[
                    { course: 'General English A1.1', students: 342, percentage: 28 },
                    { course: 'Business English B1', students: 287, percentage: 24 },
                    { course: 'IELTS Preparation', students: 201, percentage: 17 },
                    { course: 'Conversation Skills', students: 178, percentage: 15 },
                    { course: 'Grammar Essentials', students: 142, percentage: 12 }
                  ].map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex-1">
                        <p className="text-sm font-medium" data-testid={`course-name-${index}`}>
                          {item.course}
                        </p>
                        <div className="w-full bg-gray-200 rounded-full h-2 mt-1">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{width: `${item.percentage}%`}}
                            data-testid={`course-progress-bar-${index}`}
                          ></div>
                        </div>
                      </div>
                      <div className="ml-4 text-right">
                        <p className="text-sm font-semibold" data-testid={`course-students-${index}`}>
                          {item.students}
                        </p>
                        <p className="text-xs text-gray-500" data-testid={`course-percentage-${index}`}>
                          {item.percentage}%
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="learning" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-learning-analytics">
                {t('admin:learningAnalytics', 'Learning Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:learningAnalyticsDescription', 'Detailed insights into learning patterns and outcomes')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600" data-testid="metric-avg-lesson-completion">
                    23 min
                  </div>
                  <p className="text-sm text-gray-600">{t('admin:avgLessonTime', 'Avg Lesson Time')}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-green-600" data-testid="metric-skill-improvement">
                    +18%
                  </div>
                  <p className="text-sm text-gray-600">{t('admin:skillImprovement', 'Skill Improvement')}</p>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-600" data-testid="metric-retention-rate">
                    84%
                  </div>
                  <p className="text-sm text-gray-600">{t('admin:retentionRate', 'Retention Rate')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="engagement" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-engagement-metrics">
                {t('admin:engagementMetrics', 'Engagement Metrics')}
              </CardTitle>
              <CardDescription>
                {t('admin:engagementMetricsDescription', 'Student interaction and platform usage patterns')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center text-gray-500 py-8" data-testid="status-engagement-loading">
                <Activity className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>{t('admin:loadingEngagementData', 'Loading engagement data...')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="performance" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-performance-metrics">
                {t('admin:performanceMetrics', 'Performance Metrics')}
              </CardTitle>
              <CardDescription>
                {t('admin:performanceMetricsDescription', 'System performance and technical analytics')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-green-50 p-4 rounded-lg border border-green-200">
                  <div className="text-2xl font-bold text-green-700" data-testid="metric-uptime">
                    99.9%
                  </div>
                  <p className="text-sm text-green-600">{t('admin:systemUptime', 'System Uptime')}</p>
                </div>
                <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                  <div className="text-2xl font-bold text-blue-700" data-testid="metric-response-time">
                    1.2s
                  </div>
                  <p className="text-sm text-blue-600">{t('admin:avgResponseTime', 'Avg Response Time')}</p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
                  <div className="text-2xl font-bold text-yellow-700" data-testid="metric-error-rate">
                    0.03%
                  </div>
                  <p className="text-sm text-yellow-600">{t('admin:errorRate', 'Error Rate')}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
                  <div className="text-2xl font-bold text-purple-700" data-testid="metric-bandwidth-usage">
                    2.1TB
                  </div>
                  <p className="text-sm text-purple-600">{t('admin:bandwidthUsage', 'Bandwidth Usage')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="predictive" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle data-testid="card-title-predictive-analytics">
                {t('admin:predictiveAnalytics', 'Predictive Analytics')}
              </CardTitle>
              <CardDescription>
                {t('admin:predictiveAnalyticsDescription', 'AI-powered predictions and recommendations')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  <Card className="bg-yellow-50 border-yellow-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-yellow-800" data-testid="prediction-at-risk-students">
                        {t('admin:atRiskStudents', 'At-Risk Students')}
                      </h3>
                      <p className="text-2xl font-bold text-yellow-700">23</p>
                      <p className="text-sm text-yellow-600">
                        {t('admin:atRiskDescription', 'Students likely to drop out')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-green-50 border-green-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-green-800" data-testid="prediction-high-performers">
                        {t('admin:highPerformers', 'High Performers')}
                      </h3>
                      <p className="text-2xl font-bold text-green-700">156</p>
                      <p className="text-sm text-green-600">
                        {t('admin:highPerformersDescription', 'Students ready for advancement')}
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="bg-blue-50 border-blue-200">
                    <CardContent className="p-4">
                      <h3 className="font-semibold text-blue-800" data-testid="prediction-course-demand">
                        {t('admin:courseDemand', 'Course Demand')}
                      </h3>
                      <p className="text-lg font-bold text-blue-700">+15%</p>
                      <p className="text-sm text-blue-600">
                        {t('admin:courseDemandDescription', 'Predicted growth next month')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <div className="text-center text-gray-500 py-8" data-testid="status-predictive-loading">
                  <Target className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                  <p>{t('admin:loadingPredictiveData', 'Loading predictive analytics...')}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}