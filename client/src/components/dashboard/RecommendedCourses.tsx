import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Brain, Clock, Star, Lightbulb } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";

interface PersonalizedRecommendation {
  type: 'course' | 'lesson' | 'practice' | 'cultural_insight';
  title: string;
  description: string;
  reason: string;
  priority: 'high' | 'medium' | 'low';
  estimatedTime: number;
  difficulty: string;
  culturalContext?: string;
}

interface RecommendationsResponse {
  success: boolean;
  recommendations: PersonalizedRecommendation[];
  profile: {
    targetLanguage: string;
    proficiencyLevel: string;
    culturalBackground: string;
  };
}

const priorityColors = {
  high: "bg-red-500",
  medium: "bg-yellow-500", 
  low: "bg-green-500"
};

const typeIcons = {
  course: Star,
  lesson: Brain,
  practice: Clock,
  cultural_insight: Lightbulb
};

export function RecommendedCourses() {
  const { user } = useAuth();

  const { data: recommendations, isLoading, error } = useQuery<RecommendationsResponse>({
    queryKey: ["/api/ai/course-recommendations"],
    queryFn: () => apiRequest("/ai/course-recommendations", {
      method: "POST"
    }),
    enabled: !!user,
    staleTime: 10 * 60 * 1000, // 10 minutes
    refetchOnWindowFocus: false
  });

  if (!user) return null;

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Personalized suggestions based on your learning profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="animate-pulse">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error || !recommendations?.success) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Brain className="w-5 h-5" />
            AI Recommendations
          </CardTitle>
          <CardDescription>Personalized suggestions based on your learning profile</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center py-6">
            <p className="text-muted-foreground">
              Unable to load recommendations. Please check your profile settings and try again.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const { recommendations: recs, profile } = recommendations;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-5 h-5" />
          Recommended For You
        </CardTitle>
        <CardDescription>
          AI-powered suggestions for {profile.targetLanguage} learning 
          ({profile.proficiencyLevel} level)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recs.map((rec, index) => {
            const IconComponent = typeIcons[rec.type];
            return (
              <div key={index} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-start justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <IconComponent className="w-4 h-4 text-primary" />
                    <h4 className="font-medium">{rec.title}</h4>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="secondary"
                      className={`text-white ${priorityColors[rec.priority]}`}
                    >
                      {rec.priority}
                    </Badge>
                    <Badge variant="outline">
                      {rec.estimatedTime}min
                    </Badge>
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground mb-2">
                  {rec.description}
                </p>
                
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>Difficulty: {rec.difficulty}</span>
                    {rec.culturalContext && (
                      <>
                        <span>•</span>
                        <span>{rec.culturalContext}</span>
                      </>
                    )}
                  </div>
                  
                  {rec.type === 'course' && (
                    <Button size="sm" variant="outline">
                      View Course
                    </Button>
                  )}
                </div>
                
                <div className="mt-2 p-2 bg-blue-50 rounded text-xs text-blue-700">
                  <strong>Why recommended:</strong> {rec.reason}
                </div>
              </div>
            );
          })}
        </div>
        
        {recs.length === 0 && (
          <div className="text-center py-6">
            <Brain className="w-12 h-12 text-muted-foreground mx-auto mb-2" />
            <p className="text-muted-foreground">
              Complete your profile to get personalized recommendations
            </p>
            <Button variant="outline" size="sm" className="mt-2">
              Update Profile
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}