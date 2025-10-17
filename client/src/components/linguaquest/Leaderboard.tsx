import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Trophy, Medal, Award, Star, TrendingUp, Users } from "lucide-react";

interface LeaderboardEntry {
  rank: number;
  sessionToken: string;
  totalXp: number;
  level: number;
  streak: number;
  lessonsCompleted: number;
  lastActive?: string;
}

interface LeaderboardProps {
  sessionToken?: string;
}

export function LinguaQuestLeaderboard({ sessionToken }: LeaderboardProps) {
  // Fetch global leaderboard with polling every 30 seconds for real-time updates
  const { data: globalData } = useQuery<{ success: boolean; leaderboard: LeaderboardEntry[] }>({
    queryKey: ['/api/linguaquest/leaderboard/global'],
    refetchInterval: 30000 // Real-time polling
  });

  // Fetch user rank if session token provided
  const { data: rankData } = useQuery<{ success: boolean; rank: any }>({
    queryKey: ['/api/linguaquest/leaderboard/rank', sessionToken],
    enabled: !!sessionToken,
    refetchInterval: 30000
  });

  // Fetch level-specific leaderboards
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" data-testid="rank-1-icon" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" data-testid="rank-2-icon" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" data-testid="rank-3-icon" />;
    return <span className="text-sm font-bold text-gray-500" data-testid={`rank-${rank}-number`}>{rank}</span>;
  };

  return (
    <div className="space-y-6" data-testid="linguaquest-leaderboard">
      {sessionToken && rankData?.rank && (
        <Card data-testid="user-rank-card">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Star className="w-5 h-5 text-yellow-500" />
              Your Rank
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4" data-testid="user-stats">
              <div>
                <div className="text-2xl font-bold" data-testid="user-rank">{rankData.rank.rank}</div>
                <div className="text-sm text-gray-500">Global Rank</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="user-percentile">{rankData.rank.percentile}%</div>
                <div className="text-sm text-gray-500">Top Percentile</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="user-xp">{rankData.rank.userXp}</div>
                <div className="text-sm text-gray-500">XP</div>
              </div>
              <div>
                <div className="text-2xl font-bold" data-testid="user-streak">{rankData.rank.userStreak} 🔥</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="global" className="w-full" data-testid="leaderboard-tabs">
        <TabsList className="grid grid-cols-7 w-full">
          <TabsTrigger value="global" data-testid="tab-global">
            <Users className="w-4 h-4 mr-2" />
            Global
          </TabsTrigger>
          {levels.map(level => (
            <TabsTrigger key={level} value={level} data-testid={`tab-${level}`}>
              {level}
            </TabsTrigger>
          ))}
        </TabsList>

        <TabsContent value="global" data-testid="global-leaderboard">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <TrendingUp className="w-5 h-5" />
                Global Leaderboard
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {globalData?.leaderboard?.map((entry) => (
                  <div
                    key={entry.sessionToken}
                    className={`flex items-center justify-between p-3 rounded-lg border ${
                      entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' : 'bg-gray-50'
                    }`}
                    data-testid={`leaderboard-entry-${entry.rank}`}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-10 flex items-center justify-center">
                        {getRankIcon(entry.rank)}
                      </div>
                      <div>
                        <div className="font-semibold" data-testid={`entry-${entry.rank}-level`}>
                          Level {entry.level}
                        </div>
                        <div className="text-sm text-gray-500">
                          {entry.lessonsCompleted} lessons • {entry.streak} day streak
                        </div>
                      </div>
                    </div>
                    <Badge variant="secondary" data-testid={`entry-${entry.rank}-xp`}>
                      {entry.totalXp.toLocaleString()} XP
                    </Badge>
                  </div>
                ))}
                {(!globalData?.leaderboard || globalData.leaderboard.length === 0) && (
                  <div className="text-center py-8 text-gray-500" data-testid="empty-leaderboard">
                    No leaderboard data yet. Be the first to play!
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {levels.map(level => (
          <TabsContent key={level} value={level} data-testid={`${level}-leaderboard`}>
            <LevelLeaderboard level={level} />
          </TabsContent>
        ))}
      </Tabs>
    </div>
  );
}

function LevelLeaderboard({ level }: { level: string }) {
  const { data, isLoading } = useQuery<{ success: boolean; leaderboard: LeaderboardEntry[]; level: string }>({
    queryKey: ['/api/linguaquest/leaderboard/level', level],
    refetchInterval: 30000
  });

  const getRankIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Award className="w-6 h-6 text-amber-600" />;
    return <span className="text-sm font-bold text-gray-500">{rank}</span>;
  };

  if (isLoading) {
    return <div className="text-center py-8" data-testid="loading">Loading...</div>;
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{level} Level Leaderboard</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          {data?.leaderboard?.map((entry) => (
            <div
              key={entry.sessionToken}
              className={`flex items-center justify-between p-3 rounded-lg border ${
                entry.rank <= 3 ? 'bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300' : 'bg-gray-50'
              }`}
              data-testid={`level-entry-${entry.rank}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 flex items-center justify-center">
                  {getRankIcon(entry.rank)}
                </div>
                <div>
                  <div className="font-semibold">Level {entry.level}</div>
                  <div className="text-sm text-gray-500">
                    {entry.lessonsCompleted} lessons • {entry.streak} day streak
                  </div>
                </div>
              </div>
              <Badge variant="secondary">{entry.totalXp.toLocaleString()} XP</Badge>
            </div>
          ))}
          {(!data?.leaderboard || data.leaderboard.length === 0) && (
            <div className="text-center py-8 text-gray-500" data-testid="empty-level-leaderboard">
              No learners at this level yet. Be the first!
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
