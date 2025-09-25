import React from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  TrendingUp, 
  TrendingDown, 
  Users, 
  Phone, 
  Mail, 
  MessageSquare,
  Target,
  Award,
  BarChart3,
  PieChart,
  Activity,
  Clock,
  DollarSign
} from 'lucide-react';
import { format, parseISO } from 'date-fns';

interface AnalyticsData {
  totalInteractions: number;
  conversionRate: number;
  averageResponseTime: number;
  topPerformers: Array<{ name: string; interactions: number; conversions: number }>;
  conversionFunnel: Array<{ stage: string; count: number; rate: number }>;
  interactionTrends: Array<{ date: string; calls: number; walkIns: number; conversions: number }>;
  sourceAttribution: Array<{ source: string; count: number; revenue: number }>;
  channelPerformance: Array<{ 
    channel: string; 
    interactions: number; 
    conversions: number; 
    conversionRate: number;
    averageValue: number;
  }>;
  timeDistribution: Array<{ hour: number; interactions: number }>;
  outcomeBreakdown: Array<{ outcome: string; count: number; percentage: number }>;
}

interface CustomerInteraction {
  id: number;
  type: 'phone_call' | 'walk_in' | 'email' | 'sms' | 'task';
  customerName: string;
  interactionTime: string;
  status: string;
  outcome: string;
  urgencyLevel: string;
  convertedToLead?: boolean;
  convertedToStudent?: boolean;
}

interface AnalyticsViewProps {
  analytics: AnalyticsData | undefined;
  interactions: CustomerInteraction[];
  loading: boolean;
  dateRange: { from?: Date; to?: Date };
}

export function AnalyticsView({ analytics, interactions, loading, dateRange }: AnalyticsViewProps) {
  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(6)].map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardHeader>
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4"></div>
              <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </CardHeader>
            <CardContent>
              <div className="h-32 bg-gray-200 dark:bg-gray-700 rounded"></div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  // Calculate basic metrics from interactions if analytics is not available
  const calculatedMetrics = React.useMemo(() => {
    if (analytics) return analytics;

    const totalInteractions = interactions.length;
    const conversions = interactions.filter(i => i.convertedToLead || i.convertedToStudent).length;
    const conversionRate = totalInteractions > 0 ? (conversions / totalInteractions) * 100 : 0;

    // Group by interaction type
    const typeGroups = interactions.reduce((acc, interaction) => {
      if (!acc[interaction.type]) {
        acc[interaction.type] = { total: 0, conversions: 0 };
      }
      acc[interaction.type].total++;
      if (interaction.convertedToLead || interaction.convertedToStudent) {
        acc[interaction.type].conversions++;
      }
      return acc;
    }, {} as Record<string, { total: number; conversions: number }>);

    const channelPerformance = Object.entries(typeGroups).map(([channel, data]) => ({
      channel,
      interactions: data.total,
      conversions: data.conversions,
      conversionRate: data.total > 0 ? (data.conversions / data.total) * 100 : 0,
      averageValue: 0 // Would need revenue data
    }));

    // Group by outcome
    const outcomeGroups = interactions.reduce((acc, interaction) => {
      const outcome = interaction.outcome || 'unknown';
      acc[outcome] = (acc[outcome] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);

    const outcomeBreakdown = Object.entries(outcomeGroups).map(([outcome, count]) => ({
      outcome,
      count,
      percentage: (count / totalInteractions) * 100
    }));

    return {
      totalInteractions,
      conversionRate,
      averageResponseTime: 0, // Would need timing data
      topPerformers: [],
      conversionFunnel: [],
      interactionTrends: [],
      sourceAttribution: [],
      channelPerformance,
      timeDistribution: [],
      outcomeBreakdown
    };
  }, [analytics, interactions]);

  const getChannelIcon = (channel: string) => {
    switch (channel) {
      case 'phone_call': return <Phone className="h-4 w-4" />;
      case 'walk_in': return <Users className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'sms': return <MessageSquare className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const getTrendIcon = (value: number, comparison?: number) => {
    if (!comparison) return null;
    return value > comparison ? 
      <TrendingUp className="h-4 w-4 text-green-500" /> : 
      <TrendingDown className="h-4 w-4 text-red-500" />;
  };

  return (
    <div className="space-y-6" data-testid="analytics-view">
      {/* Key Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Interactions</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-total-interactions">
              {calculatedMetrics.totalInteractions.toLocaleString()}
            </div>
            <p className="text-xs text-muted-foreground">
              {dateRange.from && dateRange.to && (
                `${format(dateRange.from, 'MMM dd')} - ${format(dateRange.to, 'MMM dd')}`
              )}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-conversion-rate">
              {calculatedMetrics.conversionRate.toFixed(1)}%
            </div>
            <div className="mt-2">
              <Progress value={calculatedMetrics.conversionRate} className="h-2" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Response Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-response-time">
              {calculatedMetrics.averageResponseTime || 0}min
            </div>
            <p className="text-xs text-muted-foreground">
              Average time to first response
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue Attribution</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="metric-revenue">
              $0
            </div>
            <p className="text-xs text-muted-foreground">
              Total attributed revenue
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Channel Performance */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="h-5 w-5 mr-2" />
            Channel Performance
          </CardTitle>
          <CardDescription>
            Interaction volume and conversion rates by communication channel
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {calculatedMetrics.channelPerformance.map((channel, index) => (
              <div key={index} className="flex items-center justify-between p-3 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center space-x-3">
                  {getChannelIcon(channel.channel)}
                  <div>
                    <div className="font-medium capitalize" data-testid={`channel-name-${channel.channel}`}>
                      {channel.channel.replace('_', ' ')}
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.interactions} interactions
                    </div>
                  </div>
                </div>
                
                <div className="flex items-center space-x-4">
                  <div className="text-right">
                    <div className="font-medium" data-testid={`channel-conversions-${channel.channel}`}>
                      {channel.conversions} conversions
                    </div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {channel.conversionRate.toFixed(1)}% rate
                    </div>
                  </div>
                  
                  <div className="w-20">
                    <Progress value={channel.conversionRate} className="h-2" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Outcome Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="h-5 w-5 mr-2" />
              Interaction Outcomes
            </CardTitle>
            <CardDescription>
              Distribution of interaction results
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {calculatedMetrics.outcomeBreakdown
                .sort((a, b) => b.count - a.count)
                .slice(0, 6)
                .map((outcome, index) => (
                  <div key={index} className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <div 
                        className={`w-3 h-3 rounded-full`}
                        style={{ 
                          backgroundColor: `hsl(${(index * 60) % 360}, 70%, 50%)` 
                        }}
                      />
                      <span className="capitalize text-sm" data-testid={`outcome-${outcome.outcome}`}>
                        {outcome.outcome.replace('_', ' ')}
                      </span>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {outcome.count}
                      </span>
                      <Badge variant="secondary" className="text-xs">
                        {outcome.percentage.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Award className="h-5 w-5 mr-2" />
              Top Performers
            </CardTitle>
            <CardDescription>
              Staff members with highest conversion rates
            </CardDescription>
          </CardHeader>
          <CardContent>
            {calculatedMetrics.topPerformers && calculatedMetrics.topPerformers.length > 0 ? (
              <div className="space-y-3">
                {calculatedMetrics.topPerformers.slice(0, 5).map((performer, index) => (
                  <div key={index} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 rounded-full bg-blue-500 text-white flex items-center justify-center text-sm font-medium">
                        {performer.name.charAt(0)}
                      </div>
                      <div>
                        <div className="font-medium" data-testid={`performer-name-${index}`}>
                          {performer.name}
                        </div>
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          {performer.interactions} interactions
                        </div>
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <div className="font-medium text-green-600 dark:text-green-400">
                        {performer.conversions} conversions
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {performer.interactions > 0 ? ((performer.conversions / performer.interactions) * 100).toFixed(1) : 0}%
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                <Award className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>No performance data available</p>
                <p className="text-sm">Data will appear as staff handle more interactions</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Conversion Funnel */}
      {calculatedMetrics.conversionFunnel && calculatedMetrics.conversionFunnel.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <TrendingUp className="h-5 w-5 mr-2" />
              Conversion Funnel
            </CardTitle>
            <CardDescription>
              Customer journey from first contact to enrollment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {calculatedMetrics.conversionFunnel.map((stage, index) => (
                <div key={index}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium" data-testid={`funnel-stage-${index}`}>
                      {stage.stage}
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {stage.count} customers
                      </span>
                      <Badge variant="outline">
                        {stage.rate.toFixed(1)}%
                      </Badge>
                    </div>
                  </div>
                  <Progress value={stage.rate} className="h-3" />
                  {index < calculatedMetrics.conversionFunnel.length - 1 && (
                    <Separator className="my-4" />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Interaction Trends */}
      {calculatedMetrics.interactionTrends && calculatedMetrics.interactionTrends.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Activity className="h-5 w-5 mr-2" />
              Interaction Trends
            </CardTitle>
            <CardDescription>
              Daily interaction volume and conversion trends
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
              <div className="text-center">
                <BarChart3 className="h-12 w-12 mx-auto mb-3 opacity-50" />
                <p>Interactive charts will be implemented here</p>
                <p className="text-sm">Using Chart.js or Recharts for visualization</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary Stats */}
      <Card>
        <CardHeader>
          <CardTitle>Summary Statistics</CardTitle>
          <CardDescription>
            Overall performance metrics for the selected period
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-blue-600 dark:text-blue-400">
                {interactions.filter(i => i.type === 'phone_call').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Phone Calls</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-green-600 dark:text-green-400">
                {interactions.filter(i => i.type === 'walk_in').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Walk-ins</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {interactions.filter(i => i.type === 'email').length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Emails</div>
            </div>
            
            <div className="text-center p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {interactions.filter(i => i.convertedToLead || i.convertedToStudent).length}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">Conversions</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export default AnalyticsView;