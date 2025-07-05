import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { 
  BookOpen, 
  Clock, 
  Target, 
  Brain, 
  Heart, 
  CheckCircle, 
  Star,
  PlayCircle,
  Pause,
  RotateCcw,
  TrendingUp,
  MessageCircle,
  Lightbulb
} from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface MoodRecommendationsProps {
  moodData?: any;
  recommendations?: any[];
  analysis?: any;
  contextualFactors?: any;
}

const RECOMMENDATION_ICONS = {
  content: BookOpen,
  activity: PlayCircle,
  break: Pause,
  challenge: Target,
  review: RotateCcw,
  meditation: Heart,
  social: MessageCircle,
  gamification: Star
};

const DIFFICULTY_COLORS = {
  easy: 'bg-green-100 text-green-800',
  medium: 'bg-yellow-100 text-yellow-800',
  hard: 'bg-red-100 text-red-800'
};

export default function MoodRecommendations({
  moodData,
  recommendations = [],
  analysis,
  contextualFactors
}: MoodRecommendationsProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [acceptedRecommendations, setAcceptedRecommendations] = useState<Set<number>>(new Set());
  const [completedRecommendations, setCompletedRecommendations] = useState<Set<number>>(new Set());

  const updateRecommendationMutation = useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: any }) => 
      apiRequest(`/api/mood/recommendation/${id}`, { method: 'PATCH', body: updates }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/mood/history'] });
    }
  });

  const handleAcceptRecommendation = (recommendation: any) => {
    setAcceptedRecommendations(prev => new Set([...prev, recommendation.id]));
    updateRecommendationMutation.mutate({
      id: recommendation.id,
      updates: { isAccepted: true }
    });
  };

  const handleCompleteRecommendation = (recommendation: any, effectivenessRating: number) => {
    setCompletedRecommendations(prev => new Set([...prev, recommendation.id]));
    updateRecommendationMutation.mutate({
      id: recommendation.id,
      updates: {
        completedAt: new Date().toISOString(),
        effectivenessRating,
        sessionOutcome: {
          completionRate: 100,
          accuracyScore: effectivenessRating * 20, // Convert 1-5 to percentage
          timeSpent: recommendation.duration || 20,
          userFeedback: `Effectiveness rating: ${effectivenessRating}/5`
        }
      }
    });

    toast({
      title: 'Recommendation completed',
      description: 'Your feedback helps improve future recommendations'
    });
  };

  if (!moodData && recommendations.length === 0) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-8 text-center">
          <Brain className="h-12 w-12 mx-auto mb-4 text-gray-400" />
          <h3 className="text-lg font-medium mb-2">Track Your Mood First</h3>
          <p className="text-gray-600">
            Complete a mood check to receive personalized Persian learning recommendations
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Mood Analysis Summary */}
      {analysis && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Mood Analysis Summary
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">{analysis.energy_level}/10</div>
                <div className="text-sm text-gray-600">Energy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">{analysis.motivation_level}/10</div>
                <div className="text-sm text-gray-600">Motivation</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-orange-600">{analysis.stress_level}/10</div>
                <div className="text-sm text-gray-600">Stress</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">{analysis.focus_level}/10</div>
                <div className="text-sm text-gray-600">Focus</div>
              </div>
            </div>

            {analysis.cultural_factors && analysis.cultural_factors.length > 0 && (
              <div>
                <h4 className="text-sm font-medium mb-2">Persian Learning Context</h4>
                <div className="flex flex-wrap gap-2">
                  {analysis.cultural_factors.map((factor: string, index: number) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {factor}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Contextual Factors */}
      {contextualFactors && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Lightbulb className="h-5 w-5 text-yellow-500" />
              Learning Context
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {contextualFactors.positive_influences && contextualFactors.positive_influences.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-green-700 mb-2">Positive Influences</h4>
                <ul className="text-sm space-y-1">
                  {contextualFactors.positive_influences.map((influence: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <CheckCircle className="h-3 w-3 text-green-500" />
                      {influence}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {contextualFactors.learning_challenges && contextualFactors.learning_challenges.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-orange-700 mb-2">Learning Considerations</h4>
                <ul className="text-sm space-y-1">
                  {contextualFactors.learning_challenges.map((challenge: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Target className="h-3 w-3 text-orange-500" />
                      {challenge}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {contextualFactors.cultural_considerations && contextualFactors.cultural_considerations.length > 0 && (
              <div>
                <h4 className="text-sm font-medium text-purple-700 mb-2">Cultural Context</h4>
                <ul className="text-sm space-y-1">
                  {contextualFactors.cultural_considerations.map((consideration: string, index: number) => (
                    <li key={index} className="flex items-center gap-2">
                      <Heart className="h-3 w-3 text-purple-500" />
                      {consideration}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Personalized Recommendations */}
      {recommendations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-blue-500" />
              Personalized Persian Learning Recommendations
            </CardTitle>
            <CardDescription>
              Based on your current mood and Persian learning goals
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recommendations
                .sort((a, b) => (b.priority || 0) - (a.priority || 0))
                .map((recommendation, index) => {
                  const IconComponent = RECOMMENDATION_ICONS[recommendation.recommendationType as keyof typeof RECOMMENDATION_ICONS] || BookOpen;
                  const isAccepted = acceptedRecommendations.has(recommendation.id);
                  const isCompleted = completedRecommendations.has(recommendation.id);
                  
                  return (
                    <div
                      key={recommendation.id || index}
                      className={`border rounded-lg p-4 transition-all ${
                        isCompleted ? 'bg-green-50 border-green-200' :
                        isAccepted ? 'bg-blue-50 border-blue-200' : 
                        'hover:bg-gray-50'
                      }`}
                    >
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <div className={`p-2 rounded-lg ${
                            isCompleted ? 'bg-green-100' :
                            isAccepted ? 'bg-blue-100' : 'bg-gray-100'
                          }`}>
                            <IconComponent className={`h-5 w-5 ${
                              isCompleted ? 'text-green-600' :
                              isAccepted ? 'text-blue-600' : 'text-gray-600'
                            }`} />
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <h4 className="font-medium">{recommendation.title}</h4>
                              {recommendation.difficulty && (
                                <Badge 
                                  variant="secondary" 
                                  className={DIFFICULTY_COLORS[recommendation.difficulty as keyof typeof DIFFICULTY_COLORS]}
                                >
                                  {recommendation.difficulty}
                                </Badge>
                              )}
                              {recommendation.priority && recommendation.priority > 7 && (
                                <Badge variant="default" className="bg-orange-100 text-orange-800">
                                  High Priority
                                </Badge>
                              )}
                            </div>
                            
                            <p className="text-gray-600 text-sm mb-2">
                              {recommendation.description}
                            </p>
                            
                            <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                              {recommendation.duration && (
                                <div className="flex items-center gap-1">
                                  <Clock className="h-3 w-3" />
                                  {recommendation.duration} min
                                </div>
                              )}
                              <div className="flex items-center gap-1">
                                <Target className="h-3 w-3" />
                                Priority {recommendation.priority || 5}/10
                              </div>
                            </div>
                            
                            {recommendation.reasoning && (
                              <div className="bg-gray-50 p-2 rounded text-xs">
                                <strong>Why this helps:</strong> {recommendation.reasoning}
                              </div>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex flex-col gap-2 ml-4">
                          {!isAccepted && !isCompleted && (
                            <Button
                              size="sm"
                              onClick={() => handleAcceptRecommendation(recommendation)}
                              disabled={updateRecommendationMutation.isPending}
                            >
                              Try This
                            </Button>
                          )}
                          
                          {isAccepted && !isCompleted && (
                            <div className="space-y-2">
                              <div className="text-xs text-gray-600 mb-1">Rate effectiveness:</div>
                              <div className="flex gap-1">
                                {[1, 2, 3, 4, 5].map((rating) => (
                                  <Button
                                    key={rating}
                                    size="sm"
                                    variant="outline"
                                    className="w-8 h-8 p-0"
                                    onClick={() => handleCompleteRecommendation(recommendation, rating)}
                                  >
                                    <Star className={`h-3 w-3 ${rating <= 3 ? 'text-yellow-500' : 'text-green-500'}`} />
                                  </Button>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {isCompleted && (
                            <div className="flex items-center gap-1 text-green-600 text-sm">
                              <CheckCircle className="h-4 w-4" />
                              Completed
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </CardContent>
        </Card>
      )}

      {moodData && (
        <div className="text-center text-sm text-gray-600">
          Your mood data helps us create better Persian learning experiences for Iranian students
        </div>
      )}
    </div>
  );
}