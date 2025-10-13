import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { BookOpen, Search, Clock, Brain, TrendingUp, Volume2 } from 'lucide-react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useLanguage } from '@/hooks/useLanguage';

interface GlossaryItem {
  id: number;
  term: string;
  definition: string;
  partOfSpeech?: string;
  cefrLevel?: string;
  example?: string;
  srsStrength?: number;
  srsDueAt?: string;
  srsReviewCount?: number;
}

export function StudentGlossary() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTab, setSelectedTab] = useState('all');
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { t } = useLanguage();

  // Fetch glossary items
  const { data: glossaryItems = [], isLoading } = useQuery({
    queryKey: ['/api/glossary'],
    queryFn: async () => apiRequest('/api/glossary'),
  });

  // Fetch due items for review
  const { data: dueItems = [] } = useQuery({
    queryKey: ['/api/glossary/due'],
    queryFn: async () => apiRequest('/api/glossary/due'),
  });

  // Submit quiz result
  const quizMutation = useMutation({
    mutationFn: async ({ itemId, wasCorrect }: { itemId: number; wasCorrect: boolean }) => {
      return apiRequest(`/api/glossary/${itemId}/quiz`, {
        method: 'POST',
        body: {
          questionType: 'definition',
          wasCorrect,
          responseTime: 2000, // Mock response time
        },
      });
    },
    onSuccess: (data) => {
      toast({
        title: data.wasCorrect ? t('callern:studentGlossary.correct') : t('callern:studentGlossary.keepPracticing'),
        description: t('callern:studentGlossary.nextReviewToast', { date: new Date(data.nextDue).toLocaleDateString() }),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/glossary'] });
      queryClient.invalidateQueries({ queryKey: ['/api/glossary/due'] });
    },
  });

  const pronounce = (text: string) => {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'en-US';
    speechSynthesis.speak(utterance);
  };

  const getStrengthColor = (strength?: number) => {
    if (!strength) return 'bg-gray-200';
    if (strength <= 1) return 'bg-red-200';
    if (strength <= 3) return 'bg-yellow-200';
    return 'bg-green-200';
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

  const filteredItems = glossaryItems.filter((item: GlossaryItem) =>
    item.term.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.definition.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const itemsToShow = selectedTab === 'due' ? dueItems : filteredItems;

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              {t('callern:studentGlossary.title')}
            </CardTitle>
            <CardDescription>
              {glossaryItems.length} {t('callern:studentGlossary.termsCollected')} • {dueItems.length} {t('callern:studentGlossary.dueForReview')}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <TrendingUp className="h-3 w-3" />
              {t('callern:studentGlossary.streakLabel')}: 7 {t('callern:studentGlossary.days')}
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={t('callern:studentGlossary.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="flex-1"
          />
        </div>

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="all">
              {t('callern:studentGlossary.allTerms')} ({filteredItems.length})
            </TabsTrigger>
            <TabsTrigger value="due" className="flex items-center gap-1">
              <Clock className="h-3 w-3" />
              {t('callern:studentGlossary.due')} ({dueItems.length})
            </TabsTrigger>
            <TabsTrigger value="stats">
              <Brain className="h-3 w-3 mr-1" />
              {t('callern:studentGlossary.stats')}
            </TabsTrigger>
          </TabsList>

          <TabsContent value="all" className="space-y-3 max-h-[500px] overflow-y-auto">
            {itemsToShow.map((item: GlossaryItem) => (
              <div key={item.id} className="p-4 border rounded-lg space-y-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-semibold text-lg">{item.term}</h4>
                    <Button
                      size="sm"
                      variant="ghost"
                      className="h-6 w-6 p-0"
                      onClick={() => pronounce(item.term)}
                    >
                      <Volume2 className="h-3 w-3" />
                    </Button>
                  </div>
                  <div className="flex items-center gap-2">
                    {item.partOfSpeech && (
                      <Badge variant="secondary">{item.partOfSpeech}</Badge>
                    )}
                    {item.cefrLevel && (
                      <Badge className={getCEFRColor(item.cefrLevel)}>
                        {item.cefrLevel}
                      </Badge>
                    )}
                    <div
                      className={`h-2 w-12 rounded-full ${getStrengthColor(item.srsStrength)}`}
                      title={`${t('callern:studentGlossary.strengthLabel')}: ${item.srsStrength || 0}/5`}
                    />
                  </div>
                </div>
                
                <p className="text-sm text-muted-foreground">{item.definition}</p>
                
                {item.example && (
                  <div className="bg-muted/50 p-2 rounded text-sm italic">
                    "{item.example}"
                  </div>
                )}
                
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{t('callern:studentGlossary.reviewed')} {item.srsReviewCount || 0} {t('callern:studentGlossary.times')}</span>
                  {item.srsDueAt && (
                    <span>
                      {t('callern:studentGlossary.nextReview')} {new Date(item.srsDueAt).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
            ))}
          </TabsContent>

          <TabsContent value="due" className="space-y-3">
            {dueItems.length === 0 ? (
              <div className="text-center py-12">
                <Clock className="h-12 w-12 mx-auto mb-2 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">{t('callern:studentGlossary.noItemsDue')}</p>
                <p className="text-sm text-muted-foreground mt-1">
                  {t('callern:studentGlossary.keepLearning')}
                </p>
              </div>
            ) : (
              dueItems.map((item: GlossaryItem) => (
                <div key={item.id} className="p-4 border rounded-lg space-y-3">
                  <div className="text-center">
                    <h4 className="font-semibold text-xl mb-2">{item.term}</h4>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t('callern:studentGlossary.rememberMeaning')}
                    </p>
                  </div>
                  
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={() => quizMutation.mutate({ itemId: item.id, wasCorrect: false })}
                    >
                      {t('callern:studentGlossary.showDefinition')}
                    </Button>
                    <Button
                      className="flex-1"
                      onClick={() => quizMutation.mutate({ itemId: item.id, wasCorrect: true })}
                    >
                      {t('callern:studentGlossary.iKnowIt')}
                    </Button>
                  </div>
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="stats" className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">{glossaryItems.length}</div>
                  <p className="text-sm text-muted-foreground">{t('callern:studentGlossary.totalTerms')}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <div className="text-2xl font-bold">
                    {glossaryItems.filter((i: GlossaryItem) => (i.srsStrength || 0) >= 3).length}
                  </div>
                  <p className="text-sm text-muted-foreground">{t('callern:studentGlossary.mastered')}</p>
                </CardContent>
              </Card>
            </div>
            
            <Card>
              <CardContent className="p-4">
                <h4 className="font-semibold mb-2">{t('callern:studentGlossary.levelDistribution')}</h4>
                <div className="space-y-2">
                  {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map(level => {
                    const count = glossaryItems.filter((i: GlossaryItem) => i.cefrLevel === level).length;
                    const percentage = (count / Math.max(glossaryItems.length, 1)) * 100;
                    return (
                      <div key={level} className="flex items-center gap-2">
                        <Badge className={`${getCEFRColor(level)} w-12`}>{level}</Badge>
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div
                            className="bg-primary h-2 rounded-full transition-all"
                            style={{ width: `${percentage}%` }}
                          />
                        </div>
                        <span className="text-sm text-muted-foreground w-12 text-right">
                          {count}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
}