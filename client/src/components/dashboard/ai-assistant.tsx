import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Bot, Lightbulb } from "lucide-react";
import { useState } from "react";

interface AIRecommendation {
  recommendations: string[];
}

export function AIAssistant() {
  const { toast } = useToast();
  const [recommendations, setRecommendations] = useState<string[]>([
    "Practice pronunciation for the next few sessions",
    "Review irregular verbs in your target language",
    "Focus on listening comprehension exercises"
  ]);

  const getRecommendationsMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch("/api/ai/recommendations", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${localStorage.getItem("auth_token")}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      if (!response.ok) throw new Error("Failed to get recommendations");
      return response.json() as Promise<AIRecommendation>;
    },
    onSuccess: (data) => {
      setRecommendations(data.recommendations);
      toast({
        title: "AI Recommendations Updated",
        description: "Your personalized study plan has been generated!",
      });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to generate recommendations. Please try again.",
        variant: "destructive",
      });
    },
  });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <Bot className="mr-2 h-5 w-5 text-primary" />
          AI Study Assistant
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="bg-gradient-to-r from-primary/10 to-purple-100 dark:from-primary/20 dark:to-purple-900/20 rounded-lg p-4 mb-4">
          <div className="flex items-start space-x-3">
            <Lightbulb className="h-5 w-5 text-primary mt-0.5" />
            <div>
              <p className="text-sm mb-3">
                Based on your recent performance, here are personalized recommendations for your learning journey:
              </p>
              <Button 
                size="sm"
                onClick={() => getRecommendationsMutation.mutate()}
                disabled={getRecommendationsMutation.isPending}
              >
                {getRecommendationsMutation.isPending ? "Generating..." : "Get Personalized Study Plan"}
              </Button>
            </div>
          </div>
        </div>
        
        <div className="space-y-3">
          {recommendations.map((recommendation, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-muted/50 rounded-lg"
            >
              <div className="flex items-center space-x-3">
                <Badge variant="outline">{index + 1}</Badge>
                <span className="text-sm">{recommendation}</span>
              </div>
              <Button variant="ghost" size="sm">
                Start
              </Button>
            </div>
          ))}
        </div>

        <div className="mt-4 p-3 border-t">
          <p className="text-xs text-muted-foreground text-center">
            💡 Powered by Ollama AI - Recommendations update based on your progress
          </p>
        </div>
      </CardContent>
    </Card>
  );
}
