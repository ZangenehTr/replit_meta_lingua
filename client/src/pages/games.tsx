import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import { AppLayout } from "@/components/layout/app-layout";
import { 
  Gamepad2, 
  Trophy, 
  Star, 
  Target, 
  Flame, 
  BookOpen, 
  Clock, 
  Award, 
  Medal, 
  Crown, 
  Zap, 
  Calendar, 
  TrendingUp,
  Play,
  Users,
  ChevronRight
} from "lucide-react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

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
  isActive: boolean;
  thumbnailUrl?: string;
}

interface UserGameProgress {
  id: number;
  gameId: number;
  currentLevel: number;
  xpEarned: number;
  bestScore: number;
  timesPlayed: number;
  completionRate: number;
  lastPlayedAt: string;
  game: Game;
}

interface Achievement {
  id: number;
  title: string;
  description: string;
  badgeIcon: string;
  xpReward: number;
  category: string;
  isUnlocked: boolean;
  unlockedAt?: string;
}

interface GameSession {
  id: number;
  gameId: number;
  score: number;
  xpEarned: number;
  duration: number;
  completedAt: string;
  game: Game;
}

interface LeaderboardEntry {
  rank: number;
  studentName: string;
  score: number;
  xpTotal: number;
  level: number;
  gamesCompleted: number;
}

export default function GamificationSystem() {
  const { toast } = useToast();
  const [selectedAgeGroup, setSelectedAgeGroup] = useState<string>("all");
  const [selectedSkill, setSelectedSkill] = useState<string>("all");

  // Fetch available games
  const { data: games = [], isLoading: gamesLoading } = useQuery({
    queryKey: ["/api/student/games", selectedAgeGroup, selectedSkill],
  });

  // Fetch user game progress
  const { data: userProgress = [], isLoading: progressLoading } = useQuery({
    queryKey: ["/api/student/game-progress"],
  });

  // Fetch achievements
  const { data: achievements = [], isLoading: achievementsLoading } = useQuery({
    queryKey: ["/api/student/achievements"],
  });

  // Fetch game sessions
  const { data: gameSessions = [], isLoading: sessionsLoading } = useQuery({
    queryKey: ["/api/student/game-sessions"],
  });

  // Fetch leaderboard
  const { data: leaderboard = [], isLoading: leaderboardLoading } = useQuery({
    queryKey: ["/api/student/leaderboard"],
  });

  // Fetch user stats
  const { data: userStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/student/stats"],
  });

  // Start game mutation
  const startGameMutation = useMutation({
    mutationFn: (gameId: number) =>
      apiRequest("/api/student/start-game", {
        method: "POST",
        body: JSON.stringify({ gameId }),
      }),
    onSuccess: (data) => {
      // Redirect to game interface
      window.open(`/game-player/${data.sessionId}`, '_blank');
      queryClient.invalidateQueries({ queryKey: ["/api/student/game-progress"] });
    },
    onError: (error) => {
      toast({
        title: "Game Start Failed",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleStartGame = (gameId: number) => {
    startGameMutation.mutate(gameId);
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getAgeGroups = () => [
    { value: "all", label: "All Ages" },
    { value: "5-10", label: "Kids (5-10)" },
    { value: "11-14", label: "Teens (11-14)" },
    { value: "15-20", label: "Young Adults (15-20)" },
    { value: "21+", label: "Adults (21+)" }
  ];

  const getSkillFocus = () => [
    { value: "all", label: "All Skills" },
    { value: "vocabulary", label: "Vocabulary" },
    { value: "grammar", label: "Grammar" },
    { value: "pronunciation", label: "Pronunciation" },
    { value: "listening", label: "Listening" },
    { value: "speaking", label: "Speaking" },
    { value: "reading", label: "Reading" }
  ];

  const getIconComponent = (iconName: string) => {
    const iconMap: { [key: string]: any } = {
      Trophy, Star, Target, Flame, BookOpen, Clock, 
      Award, Medal, Crown, Zap, Calendar, TrendingUp
    };
    const IconComponent = iconMap[iconName] || Star;
    return <IconComponent className="h-6 w-6" />;
  };

  return (
    <AppLayout>
      <div className="container mx-auto py-6 space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold">Gamification & Learning Games</h1>
            <p className="text-muted-foreground mt-2">
              Level up your language skills through interactive games and challenges
            </p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Level</span>
            <Badge variant="default" className="text-lg px-3 py-1">
              {userStats?.level || 1}
            </Badge>
          </div>
        </div>

        {/* User Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total XP</CardTitle>
              <Star className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.totalXp || 0}</div>
              <div className="text-xs text-muted-foreground">
                +{Math.floor((userStats?.totalXp || 0) * 0.1)} this week
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Current Streak</CardTitle>
              <Flame className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{userStats?.currentStreak || 0}</div>
              <div className="text-xs text-muted-foreground">
                Best: {userStats?.longestStreak || 0} days
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Games Completed</CardTitle>
              <Gamepad2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{gameSessions.length}</div>
              <div className="text-xs text-muted-foreground">
                This month: {gameSessions.filter((session: GameSession) => {
                  const sessionDate = new Date(session.completedAt);
                  const thisMonth = new Date();
                  return sessionDate.getMonth() === thisMonth.getMonth() && 
                         sessionDate.getFullYear() === thisMonth.getFullYear();
                }).length}
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Achievements</CardTitle>
              <Trophy className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {achievements.filter((achievement: Achievement) => achievement.isUnlocked).length}
              </div>
              <div className="text-xs text-muted-foreground">
                of {achievements.length} unlocked
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="games" className="space-y-4">
          <TabsList>
            <TabsTrigger value="games">Available Games</TabsTrigger>
            <TabsTrigger value="progress">My Progress</TabsTrigger>
            <TabsTrigger value="achievements">Achievements</TabsTrigger>
            <TabsTrigger value="leaderboard">Leaderboard</TabsTrigger>
          </TabsList>

          <TabsContent value="games" className="space-y-4">
            {/* Filters */}
            <div className="flex gap-4">
              <Select value={selectedAgeGroup} onValueChange={setSelectedAgeGroup}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Age Group" />
                </SelectTrigger>
                <SelectContent>
                  {getAgeGroups().map(age => (
                    <SelectItem key={age.value} value={age.value}>
                      {age.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <Select value={selectedSkill} onValueChange={setSelectedSkill}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Skill Focus" />
                </SelectTrigger>
                <SelectContent>
                  {getSkillFocus().map(skill => (
                    <SelectItem key={skill.value} value={skill.value}>
                      {skill.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Games Grid */}
            {gamesLoading ? (
              <div className="text-center py-8">Loading games...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {games.map((game: Game) => (
                  <Card key={game.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{game.title}</CardTitle>
                        <Badge variant="outline">{game.difficultyLevel}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{game.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Age Group:</span>
                          <span>{game.ageGroup}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Skill Focus:</span>
                          <span>{game.skillFocus}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Duration:</span>
                          <span>{formatDuration(game.estimatedDuration)}</span>
                        </div>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">XP Reward:</span>
                          <span className="font-medium">+{game.xpReward} XP</span>
                        </div>
                        <Button 
                          className="w-full" 
                          onClick={() => handleStartGame(game.id)}
                          disabled={startGameMutation.isPending}
                        >
                          <Play className="mr-2 h-4 w-4" />
                          Start Game
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="progress" className="space-y-4">
            {progressLoading ? (
              <div className="text-center py-8">Loading progress...</div>
            ) : userProgress.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                No games played yet. Start a game to track your progress!
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {userProgress.map((progress: UserGameProgress) => (
                  <Card key={progress.id}>
                    <CardHeader>
                      <CardTitle className="flex items-center justify-between">
                        {progress.game.title}
                        <Badge variant="outline">Level {progress.currentLevel}</Badge>
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-4">
                        <div>
                          <div className="flex justify-between text-sm mb-1">
                            <span>Progress</span>
                            <span>{progress.completionRate}%</span>
                          </div>
                          <Progress value={progress.completionRate} className="h-2" />
                        </div>
                        
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">XP Earned:</span>
                            <div className="font-medium">{progress.xpEarned}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Best Score:</span>
                            <div className="font-medium">{progress.bestScore}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Times Played:</span>
                            <div className="font-medium">{progress.timesPlayed}</div>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Last Played:</span>
                            <div className="font-medium">
                              {new Date(progress.lastPlayedAt).toLocaleDateString()}
                            </div>
                          </div>
                        </div>
                        
                        <Button 
                          className="w-full" 
                          variant="outline"
                          onClick={() => handleStartGame(progress.gameId)}
                        >
                          Continue Playing
                          <ChevronRight className="ml-2 h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="achievements" className="space-y-4">
            {achievementsLoading ? (
              <div className="text-center py-8">Loading achievements...</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {achievements.map((achievement: Achievement) => (
                  <Card 
                    key={achievement.id} 
                    className={achievement.isUnlocked ? "border-primary" : "opacity-60"}
                  >
                    <CardHeader>
                      <div className="flex items-center gap-3">
                        <div className={`p-2 rounded-lg ${achievement.isUnlocked ? 'bg-primary' : 'bg-muted'}`}>
                          {getIconComponent(achievement.badgeIcon)}
                        </div>
                        <div>
                          <CardTitle className="text-lg">{achievement.title}</CardTitle>
                          <Badge variant={achievement.isUnlocked ? "default" : "secondary"}>
                            {achievement.isUnlocked ? "Unlocked" : "Locked"}
                          </Badge>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-3">
                        {achievement.description}
                      </p>
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium">+{achievement.xpReward} XP</span>
                        {achievement.isUnlocked && achievement.unlockedAt && (
                          <span className="text-xs text-muted-foreground">
                            Unlocked {new Date(achievement.unlockedAt).toLocaleDateString()}
                          </span>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="leaderboard" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Trophy className="h-5 w-5" />
                  Global Leaderboard
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboardLoading ? (
                  <div className="text-center py-4">Loading leaderboard...</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Rank</TableHead>
                        <TableHead>Student</TableHead>
                        <TableHead>Level</TableHead>
                        <TableHead>Total XP</TableHead>
                        <TableHead>Games Completed</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {leaderboard.map((entry: LeaderboardEntry) => (
                        <TableRow key={entry.rank}>
                          <TableCell className="font-medium">
                            <div className="flex items-center gap-2">
                              {entry.rank <= 3 && (
                                <Medal className={`h-4 w-4 ${
                                  entry.rank === 1 ? 'text-yellow-500' :
                                  entry.rank === 2 ? 'text-gray-400' :
                                  'text-orange-500'
                                }`} />
                              )}
                              #{entry.rank}
                            </div>
                          </TableCell>
                          <TableCell>{entry.studentName}</TableCell>
                          <TableCell>
                            <Badge variant="outline">Level {entry.level}</Badge>
                          </TableCell>
                          <TableCell className="font-medium">{entry.xpTotal.toLocaleString()}</TableCell>
                          <TableCell>{entry.gamesCompleted}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}