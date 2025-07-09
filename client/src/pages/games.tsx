import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { apiRequest } from '@/lib/queryClient';
import { Trophy, Star, Clock, Target, Zap, Award, PlayCircle, Users, BookOpen, Headphones } from 'lucide-react';

interface Game {
  id: number;
  title: string;
  description: string;
  gameType: string;
  ageGroup: string;
  difficultyLevel: string;
  skillFocus: string;
  estimatedDuration: number;
  xpReward: number;
  thumbnailUrl: string;
  isActive: boolean;
}

interface GameProgress {
  id: number;
  gameId: number;
  currentLevel: number;
  maxLevelReached: number;
  totalXpEarned: number;
  totalCoinsEarned: number;
  bestScore: number;
  timesPlayed: number;
  completionRate: number;
  lastPlayedAt: string;
  title: string;
  description: string;
  gameType: string;
  ageGroup: string;
  difficultyLevel: string;
  skillFocus: string;
  estimatedDuration: number;
  xpReward: number;
  thumbnailUrl: string;
  isActive: boolean;
}

interface GameSession {
  id: number;
  gameId: number;
  startedAt: string;
  endedAt: string;
  duration: number;
  score: number;
  correctAnswers: number;
  wrongAnswers: number;
  accuracy: number;
  starsEarned: number;
  xpEarned: number;
  coinsEarned: number;
  isCompleted: boolean;
  game: Game;
}

interface LeaderboardEntry {
  id: number;
  userId: number;
  score: number;
  rank: number;
  studentName: string;
  xpTotal: number;
  level: number;
  gamesCompleted: number;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  badgeIcon: string;
  xpReward: number;
  category: string;
  isUnlocked: boolean;
  unlockedAt: string;
}

export default function GamesPage() {
  const [selectedAge, setSelectedAge] = useState<string>('all');
  const [selectedSkill, setSelectedSkill] = useState<string>('all');
  const [selectedLevel, setSelectedLevel] = useState<string>('all');
  const [selectedGame, setSelectedGame] = useState<Game | null>(null);
  const [activeTab, setActiveTab] = useState('browse');
  const queryClient = useQueryClient();

  // Fetch available games
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ['/api/student/games', selectedAge, selectedSkill, selectedLevel],
    queryFn: async () => {
      const response = await apiRequest(`/api/student/games?ageGroup=${selectedAge}&skillFocus=${selectedSkill}&level=${selectedLevel}`);
      return response as Game[];
    }
  });

  // Fetch user progress
  const { data: progress = [], isLoading: progressLoading } = useQuery({
    queryKey: ['/api/student/game-progress'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/game-progress');
      return response as GameProgress[];
    }
  });

  // Fetch game sessions
  const { data: sessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ['/api/student/game-sessions'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/game-sessions');
      return response as GameSession[];
    }
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ['/api/student/leaderboard'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/leaderboard');
      return response as LeaderboardEntry[];
    }
  });

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ['/api/student/achievements'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/achievements');
      return response as Achievement[];
    }
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/student/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/student/stats');
      return response;
    }
  });

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: async (gameId: number) => {
      const response = await apiRequest(`/api/student/games/${gameId}/start`, {
        method: 'POST'
      });
      return response;
    },
    onSuccess: (data) => {
      // Redirect to game interface or show game modal
      console.log('Game started:', data);
    },
    onError: (error) => {
      console.error('Error starting game:', error);
    }
  });

  const skillIcons = {
    vocabulary: <BookOpen className="w-5 h-5" />,
    grammar: <Target className="w-5 h-5" />,
    listening: <Headphones className="w-5 h-5" />,
    speaking: <PlayCircle className="w-5 h-5" />,
    reading: <BookOpen className="w-5 h-5" />,
    writing: <Target className="w-5 h-5" />
  };

  const ageGroupColors = {
    '5-10': 'bg-green-500',
    '11-14': 'bg-blue-500',
    '15-20': 'bg-purple-500',
    '21+': 'bg-orange-500'
  };

  const difficultyColors = {
    'A1': 'bg-green-100 text-green-800',
    'A2': 'bg-blue-100 text-blue-800',
    'B1': 'bg-yellow-100 text-yellow-800',
    'B2': 'bg-orange-100 text-orange-800',
    'C1': 'bg-red-100 text-red-800',
    'C2': 'bg-purple-100 text-purple-800'
  };

  const renderGameCard = (game: Game) => {
    const gameProgress = progress.find(p => p.gameId === game.id);
    const completionRate = gameProgress?.completionRate || 0;
    const timesPlayed = gameProgress?.timesPlayed || 0;
    const bestScore = gameProgress?.bestScore || 0;

    return (
      <Card key={game.id} className="h-full hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {skillIcons[game.skillFocus] || <Target className="w-5 h-5" />}
              <CardTitle className="text-lg">{game.title}</CardTitle>
            </div>
            <div className="flex gap-2">
              <Badge className={`${ageGroupColors[game.ageGroup]} text-white`}>
                {game.ageGroup}
              </Badge>
              <Badge className={difficultyColors[game.difficultyLevel]}>
                {game.difficultyLevel}
              </Badge>
            </div>
          </div>
          <CardDescription className="line-clamp-2">{game.description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between text-sm text-gray-600">
            <div className="flex items-center gap-1">
              <Clock className="w-4 h-4" />
              <span>{game.estimatedDuration} دقیقه</span>
            </div>
            <div className="flex items-center gap-1">
              <Star className="w-4 h-4 text-yellow-500" />
              <span>{game.xpReward} XP</span>
            </div>
          </div>
          
          {gameProgress && (
            <div className="space-y-3">
              <div className="flex items-center justify-between text-sm">
                <span>پیشرفت</span>
                <span>{completionRate}%</span>
              </div>
              <Progress value={completionRate} className="h-2" />
              <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
                <div className="text-center">
                  <div className="font-semibold">{timesPlayed}</div>
                  <div>بازی شده</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{bestScore}</div>
                  <div>بهترین امتیاز</div>
                </div>
                <div className="text-center">
                  <div className="font-semibold">{gameProgress.currentLevel}</div>
                  <div>سطح فعلی</div>
                </div>
              </div>
            </div>
          )}
          
          <Button 
            onClick={() => startGameMutation.mutate(game.id)}
            disabled={startGameMutation.isPending}
            className="w-full"
          >
            {startGameMutation.isPending ? 'در حال بارگذاری...' : 'شروع بازی'}
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderProgressCard = (gameProgress: GameProgress) => {
    return (
      <Card key={gameProgress.id} className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {skillIcons[gameProgress.skillFocus] || <Target className="w-5 h-5" />}
              <CardTitle className="text-lg">{gameProgress.title}</CardTitle>
            </div>
            <Badge className={difficultyColors[gameProgress.difficultyLevel]}>
              {gameProgress.difficultyLevel}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>میزان تکمیل</span>
                <span>{gameProgress.completionRate}%</span>
              </div>
              <Progress value={gameProgress.completionRate} className="h-2" />
            </div>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>سطح فعلی</span>
                <span>{gameProgress.currentLevel} / {gameProgress.maxLevelReached}</span>
              </div>
              <Progress value={(gameProgress.currentLevel / gameProgress.maxLevelReached) * 100} className="h-2" />
            </div>
          </div>
          
          <div className="grid grid-cols-4 gap-2 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-semibold">{gameProgress.timesPlayed}</div>
              <div>بازی شده</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{gameProgress.bestScore}</div>
              <div>بهترین امتیاز</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{gameProgress.totalXpEarned}</div>
              <div>XP کسب شده</div>
            </div>
            <div className="text-center">
              <div className="font-semibold">{gameProgress.totalCoinsEarned}</div>
              <div>سکه</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>آخرین بازی:</span>
            <span>
              {gameProgress.lastPlayedAt 
                ? new Date(gameProgress.lastPlayedAt).toLocaleDateString('fa-IR')
                : 'هرگز'
              }
            </span>
          </div>
          
          <Button 
            onClick={() => startGameMutation.mutate(gameProgress.gameId)}
            disabled={startGameMutation.isPending}
            className="w-full"
            variant="outline"
          >
            ادامه بازی
          </Button>
        </CardContent>
      </Card>
    );
  };

  const renderSessionCard = (session: GameSession) => {
    return (
      <Card key={session.id} className="hover:shadow-lg transition-shadow duration-200">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {skillIcons[session.game.skillFocus] || <Target className="w-5 h-5" />}
              <CardTitle className="text-lg">{session.game.title}</CardTitle>
            </div>
            <div className="flex items-center gap-1">
              {[...Array(session.starsEarned)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-500 fill-current" />
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="text-sm text-gray-600">امتیاز</div>
              <div className="text-2xl font-bold">{session.score}</div>
            </div>
            <div className="space-y-2">
              <div className="text-sm text-gray-600">دقت</div>
              <div className="text-2xl font-bold">{session.accuracy}%</div>
            </div>
          </div>
          
          <div className="grid grid-cols-3 gap-2 text-xs text-gray-600">
            <div className="text-center">
              <div className="font-semibold text-green-600">{session.correctAnswers}</div>
              <div>پاسخ صحیح</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-red-600">{session.wrongAnswers}</div>
              <div>پاسخ غلط</div>
            </div>
            <div className="text-center">
              <div className="font-semibold text-blue-600">{session.xpEarned}</div>
              <div>XP کسب شده</div>
            </div>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>تاریخ:</span>
            <span>{new Date(session.startedAt).toLocaleDateString('fa-IR')}</span>
          </div>
          
          <div className="flex items-center justify-between text-sm text-gray-600">
            <span>مدت زمان:</span>
            <span>{Math.round(session.duration / 60)} دقیقه</span>
          </div>
        </CardContent>
      </Card>
    );
  };

  const renderLeaderboardEntry = (entry: LeaderboardEntry, index: number) => {
    return (
      <div key={entry.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
        <div className="flex items-center gap-3">
          <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full">
            <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
          </div>
          <Avatar className="w-8 h-8">
            <AvatarFallback>{entry.studentName.charAt(0)}</AvatarFallback>
          </Avatar>
          <div>
            <div className="font-semibold">{entry.studentName}</div>
            <div className="text-xs text-gray-600">سطح {entry.level}</div>
          </div>
        </div>
        <div className="text-right">
          <div className="font-semibold">{entry.score}</div>
          <div className="text-xs text-gray-600">{entry.gamesCompleted} بازی</div>
        </div>
      </div>
    );
  };

  const renderAchievementCard = (achievement: Achievement) => {
    return (
      <Card key={achievement.id} className={`${achievement.isUnlocked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'}`}>
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <div className={`w-12 h-12 rounded-full flex items-center justify-center ${achievement.isUnlocked ? 'bg-green-100' : 'bg-gray-100'}`}>
              <Award className={`w-6 h-6 ${achievement.isUnlocked ? 'text-green-600' : 'text-gray-400'}`} />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold">{achievement.title}</h3>
              <p className="text-sm text-gray-600">{achievement.description}</p>
              <div className="flex items-center gap-2 mt-2">
                <Badge variant={achievement.isUnlocked ? 'default' : 'secondary'}>
                  {achievement.category}
                </Badge>
                <span className="text-xs text-gray-500">
                  {achievement.xpReward} XP
                </span>
              </div>
              {achievement.isUnlocked && achievement.unlockedAt && (
                <div className="text-xs text-green-600 mt-1">
                  باز شده در {new Date(achievement.unlockedAt).toLocaleDateString('fa-IR')}
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">بازی‌های آموزشی</h1>
        <p className="text-gray-600">
          با بازی‌های تعاملی مهارت‌های زبانی خود را تقویت کنید
        </p>
      </div>

      {/* User Stats Summary */}
      {userStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Zap className="w-5 h-5 text-yellow-500" />
                <div>
                  <div className="text-2xl font-bold">{userStats.totalXp}</div>
                  <div className="text-sm text-gray-600">مجموع XP</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Trophy className="w-5 h-5 text-blue-500" />
                <div>
                  <div className="text-2xl font-bold">{userStats.currentLevel}</div>
                  <div className="text-sm text-gray-600">سطح فعلی</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Target className="w-5 h-5 text-green-500" />
                <div>
                  <div className="text-2xl font-bold">{userStats.streakDays}</div>
                  <div className="text-sm text-gray-600">روزهای متوالی</div>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-2">
                <Users className="w-5 h-5 text-purple-500" />
                <div>
                  <div className="text-2xl font-bold">{userStats.gamesPlayed || 0}</div>
                  <div className="text-sm text-gray-600">بازی‌های انجام شده</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-5">
          <TabsTrigger value="browse">مرور بازی‌ها</TabsTrigger>
          <TabsTrigger value="progress">پیشرفت</TabsTrigger>
          <TabsTrigger value="history">تاریخچه</TabsTrigger>
          <TabsTrigger value="leaderboard">جدول امتیازات</TabsTrigger>
          <TabsTrigger value="achievements">دستاوردها</TabsTrigger>
        </TabsList>

        <TabsContent value="browse" className="space-y-6">
          <div className="flex flex-wrap gap-4">
            <Select value={selectedAge} onValueChange={setSelectedAge}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="گروه سنی" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه گروه‌های سنی</SelectItem>
                <SelectItem value="5-10">5-10 سال</SelectItem>
                <SelectItem value="11-14">11-14 سال</SelectItem>
                <SelectItem value="15-20">15-20 سال</SelectItem>
                <SelectItem value="21+">21 سال به بالا</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedSkill} onValueChange={setSelectedSkill}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="مهارت" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه مهارت‌ها</SelectItem>
                <SelectItem value="vocabulary">واژگان</SelectItem>
                <SelectItem value="grammar">دستور زبان</SelectItem>
                <SelectItem value="listening">شنیداری</SelectItem>
                <SelectItem value="speaking">گفتاری</SelectItem>
                <SelectItem value="reading">خواندن</SelectItem>
                <SelectItem value="writing">نوشتن</SelectItem>
              </SelectContent>
            </Select>

            <Select value={selectedLevel} onValueChange={setSelectedLevel}>
              <SelectTrigger className="w-48">
                <SelectValue placeholder="سطح" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">همه سطوح</SelectItem>
                <SelectItem value="A1">A1 - مبتدی</SelectItem>
                <SelectItem value="A2">A2 - مقدماتی</SelectItem>
                <SelectItem value="B1">B1 - متوسط</SelectItem>
                <SelectItem value="B2">B2 - متوسط به بالا</SelectItem>
                <SelectItem value="C1">C1 - پیشرفته</SelectItem>
                <SelectItem value="C2">C2 - تسلط کامل</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {gamesLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-96 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              games.map(renderGameCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="progress" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {progressLoading ? (
              Array.from({ length: 4 }).map((_, i) => (
                <Card key={i} className="h-64 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              progress.map(renderProgressCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="history" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {sessionsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-72 animate-pulse">
                  <CardContent className="p-6">
                    <div className="space-y-3">
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-full"></div>
                      <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              sessions.map(renderSessionCard)
            )}
          </div>
        </TabsContent>

        <TabsContent value="leaderboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>جدول امتیازات</CardTitle>
              <CardDescription>
                بهترین بازیکنان هفته
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {leaderboardLoading ? (
                  Array.from({ length: 10 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg animate-pulse">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-gray-200 rounded-full"></div>
                        <div className="space-y-1">
                          <div className="h-4 bg-gray-200 rounded w-32"></div>
                          <div className="h-3 bg-gray-200 rounded w-16"></div>
                        </div>
                      </div>
                      <div className="space-y-1">
                        <div className="h-4 bg-gray-200 rounded w-16"></div>
                        <div className="h-3 bg-gray-200 rounded w-12"></div>
                      </div>
                    </div>
                  ))
                ) : (
                  leaderboard.map(renderLeaderboardEntry)
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="achievements" className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {achievementsLoading ? (
              Array.from({ length: 6 }).map((_, i) => (
                <Card key={i} className="h-32 animate-pulse">
                  <CardContent className="p-4">
                    <div className="flex items-start gap-3">
                      <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                      <div className="flex-1 space-y-2">
                        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                        <div className="h-3 bg-gray-200 rounded w-full"></div>
                        <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            ) : (
              achievements.map(renderAchievementCard)
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}