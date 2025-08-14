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
        title: t('common:toast.success'),
        description: t('common:toast.gameCreated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `${t('common:toast.gameCreateFailed')}: ${error.message}`,
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
        description: t('common:toast.gameUpdated'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
      setIsEditDialogOpen(false);
      setSelectedGame(null);
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `${t('common:toast.gameCreateFailed')}: ${error.message}`,
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
        description: t('common:toast.gameDeleted'),
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/games'] });
    },
    onError: (error) => {
      toast({
        title: t('common:toast.error'),
        description: `${t('common:toast.gameDeleteFailed')}: ${error.message}`,
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
    if (confirm(t('admin:games.confirmDelete'))) {
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
                <FormLabel>{t('admin:games.gameName')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('admin:games.gameNamePlaceholder')} {...field} />
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
                <FormLabel>{t('admin:games.gameCode')}</FormLabel>
                <FormControl>
                  <Input placeholder={t('admin:games.gameCodePlaceholder')} {...field} />
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
              <FormLabel>{t('admin:games.description')}</FormLabel>
              <FormControl>
                <Textarea placeholder={t('admin:games.descriptionPlaceholder')} {...field} />
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
                <FormLabel>{t('admin:games.gameType')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:games.selectGameType')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="vocabulary">{t('admin:games.vocabulary')}</SelectItem>
                    <SelectItem value="grammar">{t('admin:games.grammar')}</SelectItem>
                    <SelectItem value="listening">{t('admin:games.listening')}</SelectItem>
                    <SelectItem value="speaking">{t('admin:games.speaking')}</SelectItem>
                    <SelectItem value="reading">{t('admin:games.reading')}</SelectItem>
                    <SelectItem value="writing">{t('admin:games.writing')}</SelectItem>
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
                <FormLabel>{t('admin:games.ageGroup')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:games.selectAgeGroup')} />
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
                <FormLabel>{t('admin:games.language')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:games.selectLanguage')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="en">{t('admin:games.english')}</SelectItem>
                    <SelectItem value="fa">{t('admin:games.persian')}</SelectItem>
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
                <FormLabel>{t('admin:games.minLevel')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:games.selectMinLevel')} />
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
                <FormLabel>{t('admin:games.maxLevel')}</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:games.selectMaxLevel')} />
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
                <FormLabel>{t('admin:games.duration')}</FormLabel>
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
                <FormLabel>{t('admin:games.pointsPerCorrect')}</FormLabel>
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
                <FormLabel>{t('admin:games.totalLevels')}</FormLabel>
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
              <FormLabel>{t('admin:games.thumbnailUrl')}</FormLabel>
              <FormControl>
                <Input placeholder={t('admin:games.thumbnailUrlPlaceholder')} {...field} />
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
            {t('admin:games.cancel')}
          </Button>
          <Button type="submit" disabled={createGameMutation.isPending || updateGameMutation.isPending}>
            {createGameMutation.isPending || updateGameMutation.isPending ? t('admin:games.saving') : selectedGame ? t('admin:games.updateGame') : t('admin:games.createGame')}
          </Button>
        </div>
        </form>
      </Form>
    );
  }, [form, createGameMutation.isPending, updateGameMutation.isPending, selectedGame]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-4 sm:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header - Mobile First */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 sm:mb-6">
          <div>
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold text-gray-900 dark:text-white">{t('admin:games.title')}</h1>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-300">{t('admin:games.subtitle')}</p>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 text-xs sm:text-sm">
                <Plus className="h-3 w-3 sm:h-4 sm:w-4 mr-1 sm:mr-2" />
                {t('admin:games.createGame')}
              </Button>
            </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>{t('admin:games.addGame')}</DialogTitle>
              <DialogDescription>
                {t('admin:games.description')}
              </DialogDescription>
            </DialogHeader>
            {GameFormComponent}
          </DialogContent>
        </Dialog>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="mt-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="games" className="text-xs sm:text-sm">{t('admin:games.title')}</TabsTrigger>
            <TabsTrigger value="configuration" className="text-xs sm:text-sm">{t('admin:games.configuration')}</TabsTrigger>
            <TabsTrigger value="analytics" className="text-xs sm:text-sm">{t('admin:games.analytics')}</TabsTrigger>
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
                          {game.isActive ? t('admin:games.active') : t('admin:games.inactive')}
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
                        {t('admin:games.edit')}
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDelete(game.id)}
                        className="flex-1"
                      >
                        <Trash2 className="w-4 h-4 mr-1" />
                        {t('admin:games.delete')}
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
              <CardTitle>{t('admin:games.gameConfiguration')}</CardTitle>
              <CardDescription>{t('admin:games.configureSettings')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('admin:games.configurationComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:games.gameAnalytics')}</CardTitle>
              <CardDescription>{t('admin:games.viewPerformance')}</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">{t('admin:games.analyticsComingSoon')}</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:games.editGame')}</DialogTitle>
            <DialogDescription>
              {t('admin:games.updateGameInfo')}
            </DialogDescription>
          </DialogHeader>
          {GameFormComponent}
        </DialogContent>
      </Dialog>
      </div>
    </div>
  );
}