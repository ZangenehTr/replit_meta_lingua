import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import MoodTracker from '@/components/mood/MoodTracker';
import MoodRecommendations from '@/components/mood/MoodRecommendations';
import { 
  Brain, 
  TrendingUp, 
  Calendar, 
  BarChart3, 
  Clock, 
  Target,
  Heart,
  Lightbulb,
  RefreshCw,
  Globe
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';
import { useTranslation } from 'react-i18next';

export default function MoodLearningPage() {
  const { t } = useTranslation(['student', 'common']);
  const [currentMoodData, setCurrentMoodData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<string>('tracker');

  // Fetch mood history
  const { data: moodHistory, isLoading: historyLoading } = useQuery({
    queryKey: ['/api/mood/history'],
    queryFn: () => apiRequest('/api/mood/history?days=30&includeRecommendations=true')
  });

  // Fetch learning adaptations
  const { data: adaptations, isLoading: adaptationsLoading } = useQuery({
    queryKey: ['/api/mood/adaptations'],
    queryFn: () => apiRequest('/api/mood/adaptations')
  });

  const handleMoodSubmitted = (moodData: any) => {
    setCurrentMoodData(moodData);
    setActiveTab('recommendations');
  };

  const formatTime = (timeString: string) => {
    return new Date(timeString).toLocaleString('fa-IR', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="container mx-auto py-6 space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <h1 className="text-3xl font-bold">{t('student:moodLearning.title')}</h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          {t('student:moodLearning.subtitle')}
        </p>
        <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
          <Globe className="h-4 w-4" />
          Optimized for Iranian deployment • No external dependencies
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="tracker" className="flex items-center gap-2">
            <Heart className="h-4 w-4" />
            Mood Check
          </TabsTrigger>
          <TabsTrigger value="recommendations" className="flex items-center gap-2">
            <Lightbulb className="h-4 w-4" />
            Recommendations
          </TabsTrigger>
          <TabsTrigger value="history" className="flex items-center gap-2">
            <Calendar className="h-4 w-4" />
            History
          </TabsTrigger>
          <TabsTrigger value="insights" className="flex items-center gap-2">
            <BarChart3 className="h-4 w-4" />
            Insights
          </TabsTrigger>
        </TabsList>

        {/* Mood Tracker Tab */}
        <TabsContent value="tracker" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Quick Check */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Quick Mood Check</h3>
              <MoodTracker quickMode={true} onMoodSubmitted={handleMoodSubmitted} />
            </div>

            {/* Full Tracker */}
            <div>
              <h3 className="text-lg font-semibold mb-4">Detailed Mood Analysis</h3>
              <MoodTracker onMoodSubmitted={handleMoodSubmitted} />
            </div>
          </div>

          {/* Recent Insights */}
          {moodHistory?.insights && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-500" />
                  Your Persian Learning Patterns
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-blue-600">
                      {Math.round(moodHistory.insights.averageMoodScore || 5)}/10
                    </div>
                    <div className="text-sm text-gray-600">Avg Mood</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-green-600">
                      {Math.round(moodHistory.insights.averageEnergyLevel || 5)}/10
                    </div>
                    <div className="text-sm text-gray-600">Avg Energy</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-purple-600">
                      {moodHistory.history?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Mood Entries</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-orange-600">
                      {moodHistory.recommendations?.length || 0}
                    </div>
                    <div className="text-sm text-gray-600">Recommendations</div>
                  </div>
                </div>

                <div className="p-3 bg-blue-50 rounded-lg">
                  <div className="text-sm font-medium text-blue-800 mb-1">
                    {moodHistory.insights.culturalContext}
                  </div>
                  <div className="text-xs text-blue-600">
                    Personalized for Persian language learning with Iranian cultural context
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Recommendations Tab */}
        <TabsContent value="recommendations" className="space-y-6">
          <MoodRecommendations
            moodData={currentMoodData?.mood}
            recommendations={currentMoodData?.recommendations || []}
            analysis={currentMoodData?.analysis}
            contextualFactors={currentMoodData?.contextualFactors}
          />

          {/* Recent Recommendations */}
          {moodHistory?.recommendations && moodHistory.recommendations.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <RefreshCw className="h-5 w-5 text-gray-500" />
                  Recent Recommendations
                </CardTitle>
                <CardDescription>
                  Your recent Persian learning recommendations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {moodHistory.recommendations.slice(0, 5).map((rec: any, index: number) => (
                    <div key={rec.id || index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="font-medium text-sm">{rec.title}</div>
                        <div className="text-xs text-gray-600 mt-1">{rec.description}</div>
                        <div className="flex items-center gap-2 mt-2">
                          {rec.difficulty && (
                            <Badge variant="secondary" className="text-xs">
                              {rec.difficulty}
                            </Badge>
                          )}
                          {rec.duration && (
                            <div className="flex items-center gap-1 text-xs text-gray-500">
                              <Clock className="h-3 w-3" />
                              {rec.duration}m
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-xs text-gray-500">
                        {formatTime(rec.createdAt)}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* History Tab */}
        <TabsContent value="history" className="space-y-6">
          {historyLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
                <p>Loading mood history...</p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-purple-500" />
                  Mood History (Last 30 Days)
                </CardTitle>
              </CardHeader>
              <CardContent>
                {moodHistory?.history && moodHistory.history.length > 0 ? (
                  <div className="space-y-4">
                    {moodHistory.history.map((entry: any) => (
                      <div key={entry.id} className="border rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-3">
                            <Badge variant="outline" className="capitalize">
                              {entry.moodCategory}
                            </Badge>
                            <div className="text-sm text-gray-600">
                              Score: {entry.moodScore}/10
                            </div>
                          </div>
                          <div className="text-xs text-gray-500">
                            {formatTime(entry.createdAt)}
                          </div>
                        </div>

                        <div className="grid grid-cols-4 gap-4 mb-3">
                          <div>
                            <div className="text-xs text-gray-500">Energy</div>
                            <Progress value={entry.energyLevel * 10} className="h-1" />
                            <div className="text-xs mt-1">{entry.energyLevel}/10</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Motivation</div>
                            <Progress value={entry.motivationLevel * 10} className="h-1" />
                            <div className="text-xs mt-1">{entry.motivationLevel}/10</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Stress</div>
                            <Progress value={entry.stressLevel * 10} className="h-1" />
                            <div className="text-xs mt-1">{entry.stressLevel}/10</div>
                          </div>
                          <div>
                            <div className="text-xs text-gray-500">Focus</div>
                            <Progress value={entry.focusLevel * 10} className="h-1" />
                            <div className="text-xs mt-1">{entry.focusLevel}/10</div>
                          </div>
                        </div>

                        {entry.context && (
                          <div className="text-sm text-gray-700 bg-gray-50 p-2 rounded">
                            <strong>Context:</strong> {entry.context}
                          </div>
                        )}

                        {entry.notes && (
                          <div className="text-sm text-gray-700 mt-2">
                            <strong>Notes:</strong> {entry.notes}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                    <h3 className="text-lg font-medium mb-2">No mood history yet</h3>
                    <p className="text-gray-600 mb-4">
                      Start tracking your mood to see patterns and get personalized recommendations
                    </p>
                    <Button onClick={() => setActiveTab('tracker')}>
                      Track Your Mood
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {adaptationsLoading ? (
            <Card>
              <CardContent className="p-8 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-blue-500 border-t-transparent mx-auto mb-4" />
                <p>Loading learning insights...</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Learning Optimization */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5 text-green-500" />
                    Learning Optimization
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adaptations?.suggestions ? (
                    <>
                      <div>
                        <h4 className="font-medium mb-2">Best Study Time</h4>
                        <div className="flex flex-wrap gap-2">
                          {Object.entries(adaptations.suggestions.bestTimeToStudy || {}).map(([time, count]) => (
                            <Badge key={time} variant="secondary">
                              {time} ({count} sessions)
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Optimal Duration</h4>
                        <div className="text-2xl font-bold text-blue-600">
                          {adaptations.suggestions.optimalDuration} minutes
                        </div>
                      </div>

                      <div>
                        <h4 className="font-medium mb-2">Preferred Content</h4>
                        <div className="flex flex-wrap gap-2">
                          {adaptations.suggestions.preferredContent?.map((content: string, index: number) => (
                            <Badge key={index} variant="outline">
                              {content}
                            </Badge>
                          ))}
                        </div>
                      </div>

                      <div className="p-3 bg-purple-50 rounded-lg">
                        <div className="text-sm font-medium text-purple-800">
                          Cultural Optimization
                        </div>
                        <div className="text-xs text-purple-600 mt-1">
                          {adaptations.suggestions.culturalOptimization}
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <TrendingUp className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Complete more mood-based learning sessions to see optimization insights
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Success Patterns */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5 text-blue-500" />
                    Success Patterns
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {adaptations?.insights ? (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="text-center">
                          <div className="text-2xl font-bold text-green-600">
                            {adaptations.insights.totalPatterns}
                          </div>
                          <div className="text-sm text-gray-600">Learning Patterns</div>
                        </div>
                        <div className="text-center">
                          <div className="text-2xl font-bold text-blue-600">
                            {Math.round(adaptations.insights.averageSuccessRate || 0)}%
                          </div>
                          <div className="text-sm text-gray-600">Success Rate</div>
                        </div>
                      </div>

                      <div className="p-3 bg-green-50 rounded-lg">
                        <div className="text-sm font-medium text-green-800 mb-1">
                          Persian Learning Optimized
                        </div>
                        <div className="text-xs text-green-600">
                          Your learning patterns are optimized for Persian language acquisition with cultural context
                        </div>
                      </div>

                      {adaptations.adaptations && adaptations.adaptations.length > 0 && (
                        <div>
                          <h4 className="font-medium mb-2">Recent Adaptations</h4>
                          <div className="space-y-2">
                            {adaptations.adaptations.slice(0, 3).map((adaptation: any, index: number) => (
                              <div key={adaptation.id || index} className="text-sm p-2 bg-gray-50 rounded">
                                <div className="font-medium">{adaptation.moodPattern} pattern</div>
                                <div className="text-gray-600 text-xs mt-1">
                                  {adaptation.adaptationStrategy}
                                </div>
                                <div className="text-xs text-blue-600 mt-1">
                                  Success rate: {adaptation.successRate}%
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-4">
                      <BarChart3 className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p className="text-sm text-gray-600">
                        Success patterns will appear as you use mood-based recommendations
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}