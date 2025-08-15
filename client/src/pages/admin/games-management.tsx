import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { 
  Plus, Edit, Trash2, Eye, Settings, GamepadIcon, BookOpen, Clock, Star, Users,
  Play, BarChart3, Database, Trophy, Target, TrendingUp, Award, ListOrdered,
  CheckCircle, XCircle, Timer
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';

// Question form schema
const questionFormSchema = z.object({
  questionType: z.enum(['multiple_choice', 'fill_blank', 'matching', 'ordering']),
  skillFocus: z.enum(['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing']),
  question: z.string().min(5, 'Question must be at least 5 characters'),
  correctAnswer: z.string().min(1, 'Correct answer is required'),
  options: z.string().optional(),
  hint: z.string().optional(),
  explanation: z.string().optional(),
  basePoints: z.number().min(1, 'Points must be at least 1'),
  difficulty: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['en', 'fa'])
});

type QuestionFormData = z.infer<typeof questionFormSchema>;

// Game form schema
const gameFormSchema = z.object({
  gameName: z.string().min(2, 'Game name must be at least 2 characters'),
  gameCode: z.string().min(3, 'Game code must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  gameType: z.enum(['vocabulary', 'grammar', 'listening', 'speaking', 'reading', 'writing']),
  ageGroup: z.enum(['5-10', '11-14', '15-20', '21+']),
  minLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  maxLevel: z.enum(['A1', 'A2', 'B1', 'B2', 'C1', 'C2']),
  language: z.enum(['en', 'fa']),
  gameMode: z.enum(['single_player', 'multiplayer', 'co-op']),
  duration: z.number().min(5, 'Duration must be at least 5 minutes'),
  pointsPerCorrect: z.number().min(1, 'Points per correct must be at least 1'),
  thumbnailUrl: z.string().optional(),
  totalLevels: z.number().min(1, 'Total levels must be at least 1'),
  isActive: z.boolean().default(true)
});

type GameFormData = z.infer<typeof gameFormSchema>;

interface Game {
  id: number;
  gameName: string;
  gameCode: string;
  description: string;
  gameType: string;
  ageGroup: string;
  minLevel: string;
  maxLevel: string;
  language: string;
  gameMode: string;
  duration: number;
  pointsPerCorrect: number;
  thumbnailUrl?: string;
  totalLevels: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Question {
  id: number;
  gameId: number;
  questionType: string;
  skillFocus: string;
  question: string;
  correctAnswer: string;
  options?: string;
  hint?: string;
  explanation?: string;
  basePoints: number;
  difficulty: string;
  language: string;
  createdAt: string;
}

interface GameStats {
  totalPlays: number;
  averageScore: number;
  completionRate: number;
  topPlayers: Array<{
    name: string;
    score: number;
    avatar?: string;
  }>;
  questionStats: Array<{
    questionId: number;
    correctRate: number;
    averageTime: number;
  }>;
  dailyPlays: Array<{
    date: string;
    plays: number;
  }>;
}

export default function EnhancedGamesManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isQuestionsDialogOpen, setIsQuestionsDialogOpen] = useState(false);
  const [isAnalyticsDialogOpen, setIsAnalyticsDialogOpen] = useState(false);
  const [isQuestionFormOpen, setIsQuestionFormOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [activeTab, setActiveTab] = useState('games');
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch games
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/admin/games'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/games');
      return response as Game[];
    }
  });

  // Fetch questions for selected game
  const { data: questions = [], isLoading: questionsLoading } = useQuery({
    queryKey: ['/api/admin/games', selectedGame?.id, 'questions'],
    queryFn: async () => {
      if (!selectedGame) return [];
      const response = await apiRequest(`/api/admin/games/${selectedGame.id}/questions`);
      return response as Question[];
    },
    enabled: !!selectedGame && isQuestionsDialogOpen
  });

  // Fetch analytics for selected game
  const { data: gameStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/admin/games', selectedGame?.id, 'analytics'],
    queryFn: async () => {
      if (!selectedGame) return null;
      const response = await apiRequest(`/api/admin/games/${selectedGame.id}/analytics`);
      return response as GameStats;
    },
    enabled: !!selectedGame && isAnalyticsDialogOpen
  });

  // Create game mutation
  const createGameMutation = useMutation({
    mutationFn: async (gameData: GameFormData) => {
      const response = await apiRequest('/api/admin/games', {
        method: 'POST',
        body: JSON.stringify(gameData)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Game created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to create game: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update game mutation
  const updateGameMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<GameFormData> }) => {
      const response = await apiRequest(`/api/admin/games/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Game updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsEditDialogOpen(false);
      setSelectedGame(null);
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to update game: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete game mutation
  const deleteGameMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/games/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Game deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to delete game: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Create question mutation
  const createQuestionMutation = useMutation({
    mutationFn: async (questionData: QuestionFormData) => {
      const response = await apiRequest(`/api/admin/games/${selectedGame?.id}/questions`, {
        method: 'POST',
        body: JSON.stringify(questionData)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Question created successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame?.id, 'questions'] });
      setIsQuestionFormOpen(false);
      questionForm.reset();
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to create question: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Update question mutation
  const updateQuestionMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: Partial<QuestionFormData> }) => {
      const response = await apiRequest(`/api/admin/games/${selectedGame?.id}/questions/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Question updated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame?.id, 'questions'] });
      setIsQuestionFormOpen(false);
      setSelectedQuestion(null);
      questionForm.reset();
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to update question: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Delete question mutation
  const deleteQuestionMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await apiRequest(`/api/admin/games/${selectedGame?.id}/questions/${id}`, {
        method: 'DELETE'
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Question deleted successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame?.id, 'questions'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to delete question: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Generate questions mutation
  const generateQuestionsMutation = useMutation({
    mutationFn: async ({ gameId, count }: { gameId: number; count: number }) => {
      const response = await apiRequest(`/api/admin/games/${gameId}/generate-questions`, {
        method: 'POST',
        body: JSON.stringify({ count })
      });
      return response;
    },
    onSuccess: () => {
      toast({
        title: t('common:toast.success'),
        description: 'Questions generated successfully',
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games', selectedGame?.id, 'questions'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `Failed to generate questions: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Form setup for games
  const form = useForm<GameFormData>({
    resolver: zodResolver(gameFormSchema),
    defaultValues: {
      gameName: '',
      gameCode: '',
      description: '',
      gameType: 'vocabulary',
      ageGroup: '5-10',
      minLevel: 'A1',
      maxLevel: 'A2',
      language: 'en',
      gameMode: 'single_player',
      duration: 30,
      pointsPerCorrect: 10,
      thumbnailUrl: '',
      totalLevels: 10,
      isActive: true
    }
  });

  // Form setup for questions
  const questionForm = useForm<QuestionFormData>({
    resolver: zodResolver(questionFormSchema),
    defaultValues: {
      questionType: 'multiple_choice',
      skillFocus: 'vocabulary',
      question: '',
      correctAnswer: '',
      options: '',
      hint: '',
      explanation: '',
      basePoints: 10,
      difficulty: 'A1',
      language: 'en'
    }
  });

  const onSubmit = (data: GameFormData) => {
    if (selectedGame) {
      updateGameMutation.mutate({ id: selectedGame.id, data });
    } else {
      createGameMutation.mutate(data);
    }
  };

  const onQuestionSubmit = (data: QuestionFormData) => {
    if (selectedQuestion) {
      updateQuestionMutation.mutate({ id: selectedQuestion.id, data });
    } else {
      createQuestionMutation.mutate(data);
    }
  };

  const handleEdit = (game: Game) => {
    setSelectedGame(game);
    form.reset({
      gameName: game.gameName,
      gameCode: game.gameCode,
      description: game.description,
      gameType: game.gameType as any,
      ageGroup: game.ageGroup as any,
      minLevel: game.minLevel as any,
      maxLevel: game.maxLevel as any,
      language: game.language as any,
      gameMode: game.gameMode as any,
      duration: game.duration,
      pointsPerCorrect: game.pointsPerCorrect,
      thumbnailUrl: game.thumbnailUrl || '',
      totalLevels: game.totalLevels,
      isActive: game.isActive
    });
    setIsEditDialogOpen(true);
  };

  const handleEditQuestion = (question: Question) => {
    setSelectedQuestion(question);
    questionForm.reset({
      questionType: question.questionType as any,
      skillFocus: question.skillFocus as any,
      question: question.question,
      correctAnswer: question.correctAnswer,
      options: question.options || '',
      hint: question.hint || '',
      explanation: question.explanation || '',
      basePoints: question.basePoints,
      difficulty: question.difficulty as any,
      language: question.language as any
    });
    setIsQuestionFormOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGameMutation.mutate(id);
    }
  };

  const handleDeleteQuestion = (id: number) => {
    if (confirm('Are you sure you want to delete this question?')) {
      deleteQuestionMutation.mutate(id);
    }
  };

  const handleViewQuestions = (game: Game) => {
    setSelectedGame(game);
    setIsQuestionsDialogOpen(true);
  };

  const handleViewAnalytics = (game: Game) => {
    setSelectedGame(game);
    setIsAnalyticsDialogOpen(true);
  };

  const handlePlayGame = (game: Game) => {
    // Open game in new window or redirect to game player
    window.open(`/game-player/${game.id}`, '_blank');
  };

  const handleGenerateQuestions = () => {
    if (selectedGame) {
      const count = prompt('How many questions would you like to generate?', '10');
      if (count && !isNaN(Number(count))) {
        generateQuestionsMutation.mutate({ gameId: selectedGame.id, count: Number(count) });
      }
    }
  };

  const ageGroupColors = {
    '5-10': 'bg-green-500',
    '11-14': 'bg-blue-500',
    '15-20': 'bg-purple-500',
    '21+': 'bg-orange-500'
  };

  const gameTypeIcons = {
    vocabulary: <BookOpen className="w-4 h-4" />,
    grammar: <Settings className="w-4 h-4" />,
    listening: <Users className="w-4 h-4" />,
    speaking: <GamepadIcon className="w-4 h-4" />,
    reading: <BookOpen className="w-4 h-4" />,
    writing: <Edit className="w-4 h-4" />
  };

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Games Management</h1>
          <p className="text-muted-foreground mt-1">Manage educational games and track performance</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Create Game
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">Games</TabsTrigger>
          <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          <TabsTrigger value="dailyChallenges">Daily Challenges</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-4">
          {gamesLoading ? (
            <div className="text-center py-8">Loading games...</div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex items-center gap-2">
                        {gameTypeIcons[game.gameType as keyof typeof gameTypeIcons]}
                        <CardTitle className="text-lg">{game.gameName}</CardTitle>
                      </div>
                      <Badge className={ageGroupColors[game.ageGroup as keyof typeof ageGroupColors]}>
                        {game.ageGroup}
                      </Badge>
                    </div>
                    <CardDescription>{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 mb-4">
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Type:</span>
                        <span className="font-medium">{game.gameType}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Level:</span>
                        <span className="font-medium">{game.minLevel} - {game.maxLevel}</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Duration:</span>
                        <span className="font-medium">{game.duration} mins</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Points:</span>
                        <span className="font-medium">{game.pointsPerCorrect} per correct</span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Status:</span>
                        <Badge variant={game.isActive ? "default" : "secondary"}>
                          {game.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      <Button size="sm" variant="outline" onClick={() => handlePlayGame(game)}>
                        <Play className="mr-1 h-3 w-3" />
                        Play
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewQuestions(game)}>
                        <Database className="mr-1 h-3 w-3" />
                        Questions
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleViewAnalytics(game)}>
                        <BarChart3 className="mr-1 h-3 w-3" />
                        Analytics
                      </Button>
                      <Button size="sm" variant="outline" onClick={() => handleEdit(game)}>
                        <Edit className="mr-1 h-3 w-3" />
                        Edit
                      </Button>
                      <Button size="sm" variant="destructive" onClick={() => handleDelete(game.id)}>
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="leaderboard">
          <Card>
            <CardHeader>
              <CardTitle>Global Leaderboard</CardTitle>
              <CardDescription>Top players across all games</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Leaderboard feature coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dailyChallenges">
          <Card>
            <CardHeader>
              <CardTitle>Daily Challenges</CardTitle>
              <CardDescription>Manage daily challenge configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-8 text-muted-foreground">
                Daily challenges feature coming soon...
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Questions Dialog */}
      <Dialog open={isQuestionsDialogOpen} onOpenChange={setIsQuestionsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Questions for {selectedGame?.gameName}
            </DialogTitle>
            <DialogDescription>
              Manage game questions and content
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <div className="text-sm text-muted-foreground">
                Total Questions: {questions.length}
              </div>
              <div className="flex gap-2">
                <Button size="sm" onClick={handleGenerateQuestions}>
                  <Settings className="mr-1 h-3 w-3" />
                  Generate Questions
                </Button>
                <Button size="sm" onClick={() => {
                  setSelectedQuestion(null);
                  questionForm.reset();
                  setIsQuestionFormOpen(true);
                }}>
                  <Plus className="mr-1 h-3 w-3" />
                  Add Question
                </Button>
              </div>
            </div>
            
            <ScrollArea className="h-[400px] pr-4">
              {questionsLoading ? (
                <div className="text-center py-8">Loading questions...</div>
              ) : questions.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No questions yet. Create or generate some questions to get started.
                </div>
              ) : (
                <div className="space-y-3">
                  {questions.map((question, index) => (
                    <Card key={question.id}>
                      <CardContent className="p-4">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline">{index + 1}</Badge>
                              <Badge>{question.questionType}</Badge>
                              <Badge variant="secondary">{question.difficulty}</Badge>
                              <Badge variant="outline">{question.basePoints} pts</Badge>
                            </div>
                            <p className="font-medium mb-1">{question.question}</p>
                            <p className="text-sm text-muted-foreground">
                              Answer: {question.correctAnswer}
                            </p>
                            {question.hint && (
                              <p className="text-sm text-muted-foreground mt-1">
                                Hint: {question.hint}
                              </p>
                            )}
                          </div>
                          <div className="flex gap-1">
                            <Button size="sm" variant="ghost" onClick={() => handleEditQuestion(question)}>
                              <Edit className="h-3 w-3" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => handleDeleteQuestion(question.id)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </ScrollArea>
          </div>
        </DialogContent>
      </Dialog>

      {/* Question Form Dialog */}
      <Dialog open={isQuestionFormOpen} onOpenChange={setIsQuestionFormOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedQuestion ? 'Edit Question' : 'Add Question'}
            </DialogTitle>
            <DialogDescription>
              Create or edit a game question
            </DialogDescription>
          </DialogHeader>
          <Form {...questionForm}>
            <form onSubmit={questionForm.handleSubmit(onQuestionSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="questionType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Question Type</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="multiple_choice">Multiple Choice</SelectItem>
                          <SelectItem value="fill_blank">Fill in the Blank</SelectItem>
                          <SelectItem value="matching">Matching</SelectItem>
                          <SelectItem value="ordering">Ordering</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="skillFocus"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill Focus</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="vocabulary">Vocabulary</SelectItem>
                          <SelectItem value="grammar">Grammar</SelectItem>
                          <SelectItem value="listening">Listening</SelectItem>
                          <SelectItem value="speaking">Speaking</SelectItem>
                          <SelectItem value="reading">Reading</SelectItem>
                          <SelectItem value="writing">Writing</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={questionForm.control}
                name="question"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Question</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Enter the question text..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="correctAnswer"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Correct Answer</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter the correct answer..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={questionForm.control}
                name="options"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Options (for multiple choice, comma-separated)</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Option 1, Option 2, Option 3, Option 4" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={questionForm.control}
                  name="hint"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hint (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Provide a helpful hint..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="explanation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Explanation (optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="Explain the answer..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={questionForm.control}
                  name="basePoints"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Points</FormLabel>
                      <FormControl>
                        <Input type="number" {...field} onChange={e => field.onChange(Number(e.target.value))} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="difficulty"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Difficulty</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="A1">A1</SelectItem>
                          <SelectItem value="A2">A2</SelectItem>
                          <SelectItem value="B1">B1</SelectItem>
                          <SelectItem value="B2">B2</SelectItem>
                          <SelectItem value="C1">C1</SelectItem>
                          <SelectItem value="C2">C2</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={questionForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="fa">Persian</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsQuestionFormOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedQuestion ? 'Update' : 'Create'} Question
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Analytics Dialog */}
      <Dialog open={isAnalyticsDialogOpen} onOpenChange={setIsAnalyticsDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Analytics for {selectedGame?.gameName}
            </DialogTitle>
            <DialogDescription>
              Game performance and player statistics
            </DialogDescription>
          </DialogHeader>
          {statsLoading ? (
            <div className="text-center py-8">Loading analytics...</div>
          ) : gameStats ? (
            <div className="space-y-6">
              {/* Overview Stats */}
              <div className="grid grid-cols-3 gap-4">
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Total Plays</p>
                        <p className="text-2xl font-bold">{gameStats.totalPlays}</p>
                      </div>
                      <Trophy className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Avg Score</p>
                        <p className="text-2xl font-bold">{gameStats.averageScore.toFixed(0)}</p>
                      </div>
                      <Target className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Completion Rate</p>
                        <p className="text-2xl font-bold">{gameStats.completionRate}%</p>
                      </div>
                      <CheckCircle className="h-8 w-8 text-muted-foreground" />
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Top Players */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Top Players</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameStats.topPlayers.length === 0 ? (
                    <p className="text-muted-foreground">No players yet</p>
                  ) : (
                    <div className="space-y-2">
                      {gameStats.topPlayers.map((player, index) => (
                        <div key={index} className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <Badge variant={index === 0 ? "default" : "outline"}>
                              #{index + 1}
                            </Badge>
                            <span className="font-medium">{player.name}</span>
                          </div>
                          <span className="font-bold">{player.score} pts</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Question Performance */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Question Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  {gameStats.questionStats.length === 0 ? (
                    <p className="text-muted-foreground">No data available</p>
                  ) : (
                    <div className="space-y-3">
                      {gameStats.questionStats.slice(0, 5).map((stat) => (
                        <div key={stat.questionId} className="space-y-1">
                          <div className="flex justify-between text-sm">
                            <span>Question #{stat.questionId}</span>
                            <span>{stat.correctRate}% correct</span>
                          </div>
                          <Progress value={stat.correctRate} className="h-2" />
                          <p className="text-xs text-muted-foreground">
                            Avg time: {stat.averageTime}s
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              No analytics data available yet. Play some games to see statistics!
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Create/Edit Game Dialog */}
      <Dialog open={isCreateDialogOpen || isEditDialogOpen} onOpenChange={(open) => {
        if (!open) {
          setIsCreateDialogOpen(false);
          setIsEditDialogOpen(false);
          setSelectedGame(null);
          form.reset();
        }
      }}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {selectedGame ? 'Edit Game' : 'Create New Game'}
            </DialogTitle>
            <DialogDescription>
              Fill in the details to {selectedGame ? 'update' : 'create'} a game
            </DialogDescription>
          </DialogHeader>
          
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              {/* Game form fields - same as original but simplified */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="gameName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter game name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="gameCode"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Game Code</FormLabel>
                      <FormControl>
                        <Input placeholder="GAME-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Description</FormLabel>
                    <FormControl>
                      <Textarea placeholder="Describe the game..." {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => {
                  setIsCreateDialogOpen(false);
                  setIsEditDialogOpen(false);
                  setSelectedGame(null);
                  form.reset();
                }}>
                  Cancel
                </Button>
                <Button type="submit">
                  {selectedGame ? 'Update' : 'Create'} Game
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}