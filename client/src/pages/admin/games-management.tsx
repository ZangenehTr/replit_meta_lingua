import React, { useState } from 'react';
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
import { Plus, Edit, Trash2, Eye, Settings, GamepadIcon, BookOpen, Clock, Star, Users } from 'lucide-react';

// Form schema for game creation/editing
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

export default function GamesManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
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
        title: "Success",
        description: "Game created successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: "Error",
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
        title: "Success",
        description: "Game updated successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsEditDialogOpen(false);
      setSelectedGame(null);
    },
    onError: (error) => {
      toast({
        title: "Error",
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
        title: "Success",
        description: "Game deleted successfully",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
    },
    onError: (error) => {
      toast({
        title: "Error",
        description: `Failed to delete game: ${error.message}`,
        variant: "destructive",
      });
    }
  });

  // Form setup
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

  const onSubmit = (data: GameFormData) => {
    if (selectedGame) {
      updateGameMutation.mutate({ id: selectedGame.id, data });
    } else {
      createGameMutation.mutate(data);
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

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this game?')) {
      deleteGameMutation.mutate(id);
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

  const GameFormComponent = React.useMemo(() => {
    return (
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="gameName"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Name</FormLabel>
                <FormControl>
                  <Input placeholder="Enter game name" {...field} />
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
                  <Input placeholder="Enter game code" {...field} />
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
                <Textarea placeholder="Enter game description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="gameType"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Game Type</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select game type" />
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
          <FormField
            control={form.control}
            name="ageGroup"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Age Group</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select age group" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="5-10">5-10</SelectItem>
                    <SelectItem value="11-14">11-14</SelectItem>
                    <SelectItem value="15-20">15-20</SelectItem>
                    <SelectItem value="21+">21+</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Language</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select language" />
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

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="minLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Min Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select min level" />
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
            control={form.control}
            name="maxLevel"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Max Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select max level" />
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (minutes)</FormLabel>
                <FormControl>
                  <Input type="number" min={5} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="pointsPerCorrect"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Points per Correct</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="totalLevels"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Total Levels</FormLabel>
                <FormControl>
                  <Input type="number" min={1} {...field} onChange={(e) => field.onChange(Number(e.target.value))} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="thumbnailUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Thumbnail URL (optional)</FormLabel>
              <FormControl>
                <Input placeholder="Enter thumbnail URL" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="flex justify-end space-x-2">
          <Button type="button" variant="outline" onClick={() => {
            setIsCreateDialogOpen(false);
            setIsEditDialogOpen(false);
            setSelectedGame(null);
          }}>
            Cancel
          </Button>
          <Button type="submit" disabled={createGameMutation.isPending || updateGameMutation.isPending}>
            {createGameMutation.isPending || updateGameMutation.isPending ? 'Saving...' : selectedGame ? 'Update Game' : 'Create Game'}
          </Button>
        </div>
        </form>
      </Form>
    );
  }, [form, createGameMutation.isPending, updateGameMutation.isPending, selectedGame]);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:games.title')}</h1>
          <p className="text-gray-600">{t('admin:games.subtitle')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
{t('admin:games.createGame')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Game</DialogTitle>
              <DialogDescription>
                Add a new educational game to the platform
              </DialogDescription>
            </DialogHeader>
            {GameFormComponent}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="games">{t('admin:games.title')}</TabsTrigger>
          <TabsTrigger value="configuration">{t('admin:games.configuration')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:games.analytics')}</TabsTrigger>
        </TabsList>

        <TabsContent value="games" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader>
                    <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                    <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-20 bg-gray-200 rounded"></div>
                  </CardContent>
                </Card>
              ))
            ) : (
              games.map((game) => (
                <Card key={game.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {gameTypeIcons[game.gameType] || <GamepadIcon className="w-4 h-4" />}
                        <CardTitle className="text-lg">{game.gameName}</CardTitle>
                      </div>
                      <div className="flex gap-2">
                        <Badge className={`${ageGroupColors[game.ageGroup]} text-white`}>
                          {game.ageGroup}
                        </Badge>
                        <Badge variant={game.isActive ? "default" : "secondary"}>
                          {game.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <CardDescription className="line-clamp-2">{game.description}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex items-center justify-between text-sm text-gray-600">
                      <div className="flex items-center gap-1">
                        <Clock className="w-4 h-4" />
                        <span>{game.duration} min</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Star className="w-4 h-4 text-yellow-500" />
                        <span>{game.pointsPerCorrect} XP</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-between text-sm">
                      <span>Code: {game.gameCode}</span>
                      <span>Levels: {game.totalLevels}</span>
                    </div>
                    
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(game)}
                        className="flex-1"
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        Edit
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(game.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        Delete
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="configuration" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Configuration</CardTitle>
              <CardDescription>Configure game settings and parameters</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Game configuration options coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Game Analytics</CardTitle>
              <CardDescription>View game performance and user engagement metrics</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Analytics dashboard coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Game</DialogTitle>
            <DialogDescription>
              Update game information and settings
            </DialogDescription>
          </DialogHeader>
          {GameFormComponent}
        </DialogContent>
      </Dialog>
    </div>
  );
}