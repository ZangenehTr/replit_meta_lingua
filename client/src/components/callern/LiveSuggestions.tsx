import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Lightbulb, Plus, Volume2, BookOpen } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';

interface Suggestion {
  id: number;
  term: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  definition?: string;
  example?: string;
  suggestedBy: 'teacher' | 'ai';
  timestamp?: number;
}

interface LiveSuggestionsProps {
  callId: number;
  isLive?: boolean;
  onAddToGlossary?: (term: Suggestion) => void;
}

export function LiveSuggestions({ callId, isLive = true, onAddToGlossary }: LiveSuggestionsProps) {
  const [selectedSuggestion, setSelectedSuggestion] = useState<Suggestion | null>(null);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch suggestions for the call
  const { data: suggestions = [], refetch } = useQuery({
    queryKey: [`/api/callern/${callId}/suggestions`],
    queryFn: async () => apiRequest(`/api/callern/${callId}/suggestions`, 'GET'),
    refetchInterval: isLive ? 5000 : false, // Poll every 5 seconds if live
  });

  // Add to glossary mutation
  const addToGlossaryMutation = useMutation({
    mutationFn: async (items: any[]) => {
      return apiRequest('/api/glossary/bulk', 'POST', { items });
    },
    onSuccess: () => {
      toast({
        title: "Added to Glossary",
        description: "The term has been added to your personal glossary.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/glossary'] });
    },
  });

  const handleAddToGlossary = (suggestion: Suggestion) => {
    const glossaryItem = {
      term: suggestion.term,
      definition: suggestion.definition || 'No definition provided',
      partOfSpeech: suggestion.partOfSpeech,
      cefrLevel: suggestion.cefrLevel,
      example: suggestion.example,
      sourceCallId: callId,
    };
    
    addToGlossaryMutation.mutate([glossaryItem]);
    if (onAddToGlossary) {
      onAddToGlossary(suggestion);
    }
  };

  const pronounce = (text: string) => {
    // Use browser's speech synthesis
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const getCEFRColor = (level?: string) => {
    switch (level) {
      case 'A1':
      case 'A2':
        return 'bg-green-100 text-green-800';
      case 'B1':
      case 'B2':
        return 'bg-blue-100 text-blue-800';
      case 'C1':
      case 'C2':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <Card className="h-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lightbulb className="h-5 w-5 text-yellow-500" />
            <CardTitle className="text-lg">Live Vocabulary</CardTitle>
          </div>
          {isLive && (
            <Badge variant="outline" className="animate-pulse">
              <span className="mr-1 h-2 w-2 rounded-full bg-red-500"></span>
              Live
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
        {suggestions.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">
            <BookOpen className="h-12 w-12 mx-auto mb-2 opacity-50" />
            <p className="text-sm">No suggestions yet</p>
            <p className="text-xs mt-1">New vocabulary will appear here during the call</p>
          </div>
        ) : (
          suggestions.map((suggestion: Suggestion) => (
            <div
              key={suggestion.id}
              className={`p-3 rounded-lg border transition-all cursor-pointer hover:shadow-md ${
                selectedSuggestion?.id === suggestion.id
                  ? 'border-primary bg-primary/5'
                  : 'border-border'
              }`}
              onClick={() => setSelectedSuggestion(suggestion)}
            >
              <div className="flex items-start justify-between mb-2">
                <div className="flex items-center gap-2">
                  <h4 className="font-semibold text-base">{suggestion.term}</h4>
                  <Button
                    size="sm"
                    variant="ghost"
                    className="h-6 w-6 p-0"
                    onClick={(e) => {
                      e.stopPropagation();
                      pronounce(suggestion.term);
                    }}
                  >
                    <Volume2 className="h-3 w-3" />
                  </Button>
                </div>
                <div className="flex items-center gap-1">
                  {suggestion.partOfSpeech && (
                    <Badge variant="secondary" className="text-xs">
                      {suggestion.partOfSpeech}
                    </Badge>
                  )}
                  {suggestion.cefrLevel && (
                    <Badge className={`text-xs ${getCEFRColor(suggestion.cefrLevel)}`}>
                      {suggestion.cefrLevel}
                    </Badge>
                  )}
                  <Badge
                    variant={suggestion.suggestedBy === 'teacher' ? 'default' : 'outline'}
                    className="text-xs"
                  >
                    {suggestion.suggestedBy === 'teacher' ? '👨‍🏫' : '🤖'} {suggestion.suggestedBy}
                  </Badge>
                </div>
              </div>
              
              {suggestion.definition && (
                <p className="text-sm text-muted-foreground mb-2">{suggestion.definition}</p>
              )}
              
              {suggestion.example && (
                <div className="bg-muted/50 p-2 rounded text-xs italic">
                  "{suggestion.example}"
                </div>
              )}
              
              {selectedSuggestion?.id === suggestion.id && (
                <Button
                  size="sm"
                  className="mt-2 w-full"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleAddToGlossary(suggestion);
                  }}
                  disabled={addToGlossaryMutation.isPending}
                >
                  <Plus className="h-3 w-3 mr-1" />
                  Add to My Glossary
                </Button>
              )}
            </div>
          ))
        )}
      </CardContent>
    </Card>
  );
}