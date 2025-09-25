import { useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3, 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Phone, 
  Target, 
  DollarSign,
  Award,
  Calendar,
  Activity,
  Zap
} from 'lucide-react';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Area,
  AreaChart,
  FunnelChart,
  Funnel,
  LabelList
} from 'recharts';

interface AnalyticsData {
  totalInteractions: number;
  conversionRate: number;
  averageResponseTime: number;
  topPerformers: Array<{ name: string; interactions: number; conversions: number }>;
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
  interactionTrends: Array<{ date: string; calls: number; walkIns: number; conversions: number }>;
  sourceAttribution: Array<{ source: string; count: number; revenue: number }>;
}

interface CustomerInteraction {
  id: number;
  type: 'phone_call' | 'walk_in' | 'email' | 'sms' | 'task';
  customerName: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  handlerName: string;
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
  revenueAttribution?: number;
}

interface AnalyticsChartsProps {
  analytics?: AnalyticsData;
  interactions: CustomerInteraction[];
  loading?: boolean;
  dateRange?: { from?: Date; to?: Date };
}

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82CA9D'];

export function AnalyticsCharts({ analytics, interactions, loading, dateRange }: AnalyticsChartsProps) {
  // Calculate analytics from interactions if not provided
  const calculatedAnalytics = useMemo(() => {
    if (analytics) return analytics;

    const totalInteractions = interactions.length;
    const conversions = interactions.filter(i => i.convertedToLead || i.convertedToStudent).length;
    const conversionRate = totalInteractions > 0 ? (conversions / totalInteractions) * 100 : 0;

    // Group by handler for top performers
    const handlerStats = interactions.reduce((acc, interaction) => {
      const handler = interaction.handlerName;
      if (!acc[handler]) {
        acc[handler] = { name: handler, interactions: 0, conversions: 0 };
      }
      acc[handler].interactions++;
      if (interaction.convertedToLead || interaction.convertedToStudent) {
        acc[handler].conversions++;
      }
      return acc;
    }, {} as Record<string, { name: string; interactions: number; conversions: number }>);

    const topPerformers = Object.values(handlerStats)
      .sort((a, b) => b.conversions - a.conversions)
      .slice(0, 5);

    // Create funnel data
    const contacted = totalInteractions;
    const qualified = interactions.filter(i => 
      i.outcome && !['no_response', 'not_interested', 'failed'].includes(i.outcome.toLowerCase())
    ).length;
    const leads = interactions.filter(i => i.convertedToLead).length;
    const students = interactions.filter(i => i.convertedToStudent).length;

    const conversionFunnel = [
      { stage: 'Contacted', count: contacted, rate: 100 },
      { stage: 'Qualified', count: qualified, rate: contacted > 0 ? (qualified / contacted) * 100 : 0 },
      { stage: 'Converted to Lead', count: leads, rate: contacted > 0 ? (leads / contacted) * 100 : 0 },
      { stage: 'Enrolled as Student', count: students, rate: contacted > 0 ? (students / contacted) * 100 : 0 }
    ];

    // Trends by date
    const trendsByDate = interactions.reduce((acc, interaction) => {
      const date = interaction.interactionTime.split('T')[0];
      if (!acc[date]) {
        acc[date] = { date, calls: 0, walkIns: 0, conversions: 0 };
      }
      if (interaction.type === 'phone_call') acc[date].calls++;
      if (interaction.type === 'walk_in') acc[date].walkIns++;
      if (interaction.convertedToLead || interaction.convertedToStudent) acc[date].conversions++;
      return acc;
    }, {} as Record<string, any>);

    const interactionTrends = Object.values(trendsByDate)
      .sort((a: any, b: any) => a.date.localeCompare(b.date))
      .slice(-30); // Last 30 days

    return {
      totalInteractions,
      conversionRate,
      averageResponseTime: 45, // Mock value
      topPerformers,
      conversionFunnel,
      interactionTrends,
      sourceAttribution: [
        { source: 'Website', count: Math.floor(totalInteractions * 0.4), revenue: 25000 },
        { source: 'Phone', count: Math.floor(totalInteractions * 0.3), revenue: 18000 },
        { source: 'Walk-in', count: Math.floor(totalInteractions * 0.2), revenue: 12000 },
        { source: 'Referral', count: Math.floor(totalInteractions * 0.1), revenue: 8000 }
      ]
    };
  }, [analytics, interactions]);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedAnalytics.totalInteractions}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedAnalytics.conversionRate.toFixed(1)}%</div>
            <p className="text-xs text-muted-foreground">
              +2.1% from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Zap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{calculatedAnalytics.averageResponseTime}min</div>
            <p className="text-xs text-muted-foreground">
              -5min from last period
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Attribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${calculatedAnalytics.sourceAttribution.reduce((sum, s) => sum + s.revenue, 0).toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              +18% from last period
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Conversion Funnel */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>
              Track prospects through the conversion pipeline
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={calculatedAnalytics.conversionFunnel}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="stage" />
                <YAxis />
                <Tooltip 
                  formatter={(value, name) => [
                    name === 'count' ? `${value} contacts` : `${value}%`,
                    name === 'count' ? 'Count' : 'Rate'
                  ]}
                />
                <Bar dataKey="count" fill="#0088FE" />
                <Bar dataKey="rate" fill="#00C49F" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Source Attribution */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Source Attribution
            </CardTitle>
            <CardDescription>
              Revenue and interaction volume by source
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={calculatedAnalytics.sourceAttribution}
                  cx="50%"
                  cy="50%"
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="revenue"
                  label={({ source, revenue }) => `${source}: $${revenue.toLocaleString()}`}
                >
                  {calculatedAnalytics.sourceAttribution.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value) => [`$${value.toLocaleString()}`, 'Revenue']} />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Interaction Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              Interaction Trends
            </CardTitle>
            <CardDescription>
              Daily interaction volume and conversion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={calculatedAnalytics.interactionTrends}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Area 
                  type="monotone" 
                  dataKey="calls" 
                  stackId="1" 
                  stroke="#0088FE" 
                  fill="#0088FE" 
                  fillOpacity={0.6}
                />
                <Area 
                  type="monotone" 
                  dataKey="walkIns" 
                  stackId="1" 
                  stroke="#00C49F" 
                  fill="#00C49F" 
                  fillOpacity={0.6}
                />
                <Line 
                  type="monotone" 
                  dataKey="conversions" 
                  stroke="#FF8042" 
                  strokeWidth={3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top Performers */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Award className="h-5 w-5" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Staff performance by conversion rate
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculatedAnalytics.topPerformers.map((performer, index) => {
                const conversionRate = performer.interactions > 0 
                  ? (performer.conversions / performer.interactions) * 100 
                  : 0;
                
                return (
                  <div key={performer.name} className="flex items-center space-x-4">
                    <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                      <span className="text-sm font-semibold">{index + 1}</span>
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-medium">{performer.name}</span>
                        <div className="flex items-center gap-2">
                          <Badge variant="secondary" className="text-xs">
                            {performer.conversions}/{performer.interactions}
                          </Badge>
                          <span className="text-sm font-semibold">
                            {conversionRate.toFixed(1)}%
                          </span>
                        </div>
                      </div>
                      <Progress value={conversionRate} className="h-2" />
                    </div>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Performance Metrics
          </CardTitle>
          <CardDescription>
            Detailed performance breakdown across channels and time periods
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Channel Performance */}
            <div>
              <h4 className="font-semibold mb-3">Channel Performance</h4>
              <div className="space-y-2">
                {[
                  { channel: 'Phone Calls', rate: 28.5, trend: 'up' },
                  { channel: 'Walk-ins', rate: 31.2, trend: 'up' },
                  { channel: 'Email', rate: 15.8, trend: 'down' },
                  { channel: 'SMS', rate: 22.1, trend: 'stable' }
                ].map((item) => (
                  <div key={item.channel} className="flex items-center justify-between">
                    <span className="text-sm">{item.channel}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{item.rate}%</span>
                      {item.trend === 'up' && <TrendingUp className="h-3 w-3 text-green-600" />}
                      {item.trend === 'down' && <TrendingDown className="h-3 w-3 text-red-600" />}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Time-based Analysis */}
            <div>
              <h4 className="font-semibold mb-3">Peak Hours</h4>
              <div className="space-y-2">
                {[
                  { time: '9-11 AM', volume: 85, conversion: 32.1 },
                  { time: '2-4 PM', volume: 92, conversion: 28.7 },
                  { time: '4-6 PM', volume: 78, conversion: 24.3 },
                  { time: '6-8 PM', volume: 45, conversion: 31.8 }
                ].map((item) => (
                  <div key={item.time} className="space-y-1">
                    <div className="flex justify-between text-sm">
                      <span>{item.time}</span>
                      <span>{item.conversion}% conversion</span>
                    </div>
                    <Progress value={(item.volume / 100) * 100} className="h-1" />
                  </div>
                ))}
              </div>
            </div>

            {/* ROI Analysis */}
            <div>
              <h4 className="font-semibold mb-3">ROI Analysis</h4>
              <div className="space-y-3">
                <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-lg">
                  <div className="text-lg font-bold text-green-700 dark:text-green-400">
                    $4.20
                  </div>
                  <div className="text-sm text-green-600 dark:text-green-500">
                    Revenue per interaction
                  </div>
                </div>
                <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                  <div className="text-lg font-bold text-blue-700 dark:text-blue-400">
                    287%
                  </div>
                  <div className="text-sm text-blue-600 dark:text-blue-500">
                    ROI on staff investment
                  </div>
                </div>
                <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-lg">
                  <div className="text-lg font-bold text-purple-700 dark:text-purple-400">
                    $185
                  </div>
                  <div className="text-sm text-purple-600 dark:text-purple-500">
                    Customer acquisition cost
                  </div>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}