import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Swords, Trophy, Target, Clock, CheckCircle, XCircle, ArrowLeft, Loader2, Crown, Star, Zap } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function ChallengeDuelsPage() {
  const { t } = useTranslation("student");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedTab, setSelectedTab] = useState("active");

  const { data: myDuels = [], isLoading: duelsLoading } = useQuery<any[]>({
    queryKey: ["/api/duels/my"],
    enabled: !!user,
  });

  const { data: stats } = useQuery<any>({
    queryKey: ["/api/duels/stats"],
    enabled: !!user,
  });

  const { data: leaderboard = [] } = useQuery<any[]>({
    queryKey: ["/api/duels/leaderboard"],
  });

  const acceptMutation = useMutation({
    mutationFn: async (duelId: number) => {
      const res = await apiRequest(`/api/duels/${duelId}/accept`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/duels/my"] }),
  });

  const declineMutation = useMutation({
    mutationFn: async (duelId: number) => {
      const res = await apiRequest(`/api/duels/${duelId}/decline`, { method: "POST" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/duels/my"] }),
  });

  const pendingDuels = myDuels.filter((d: any) => d.status === "pending" && !d.isChallenger);
  const activeDuels = myDuels.filter((d: any) => d.status === "active");
  const completedDuels = myDuels.filter((d: any) => d.status === "completed");

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-purple-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 me-1" />
                {t("duels.back", "Back")}
              </Button>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-xl flex items-center justify-center">
              <Swords className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-purple-600 to-pink-600 bg-clip-text text-transparent">
                {t("duels.title", "Challenge Your Crush")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("duels.subtitle", "Compete in language duels with friends")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <Card className="text-center">
              <CardContent className="p-4">
                <Trophy className="w-8 h-8 text-amber-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-amber-600">{stats.wins}</div>
                <div className="text-sm text-gray-500">{t("duels.wins", "Wins")}</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <XCircle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-red-600">{stats.losses}</div>
                <div className="text-sm text-gray-500">{t("duels.losses", "Losses")}</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Target className="w-8 h-8 text-blue-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-blue-600">{stats.total}</div>
                <div className="text-sm text-gray-500">{t("duels.totalDuels", "Total")}</div>
              </CardContent>
            </Card>
            <Card className="text-center">
              <CardContent className="p-4">
                <Zap className="w-8 h-8 text-purple-500 mx-auto mb-2" />
                <div className="text-2xl font-bold text-purple-600">{stats.winRate}%</div>
                <div className="text-sm text-gray-500">{t("duels.winRate", "Win Rate")}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {pendingDuels.length > 0 && (
          <Card className="mb-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Swords className="w-5 h-5 text-amber-600" />
                {t("duels.pendingChallenges", "Pending Challenges")} ({pendingDuels.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingDuels.map((duel: any) => (
                <div key={duel.id} className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium">{duel.opponent?.firstName || "???"} {t("duels.challengesYou", "challenges you!")}</p>
                    <p className="text-sm text-gray-500">{duel.challengeType} • {duel.cefrLevel}</p>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" onClick={() => acceptMutation.mutate(duel.id)} className="bg-green-600 hover:bg-green-700">
                      <CheckCircle className="w-4 h-4 me-1" />
                      {t("duels.accept", "Accept")}
                    </Button>
                    <Button size="sm" variant="outline" onClick={() => declineMutation.mutate(duel.id)}>
                      <XCircle className="w-4 h-4 me-1" />
                      {t("duels.decline", "Decline")}
                    </Button>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}

        <Tabs value={selectedTab} onValueChange={setSelectedTab}>
          <TabsList className="mb-6">
            <TabsTrigger value="active">{t("duels.active", "Active")} ({activeDuels.length})</TabsTrigger>
            <TabsTrigger value="completed">{t("duels.completed", "Completed")} ({completedDuels.length})</TabsTrigger>
            <TabsTrigger value="leaderboard">{t("duels.leaderboard", "Leaderboard")}</TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            {duelsLoading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
              </div>
            ) : activeDuels.length === 0 ? (
              <Card className="text-center py-10">
                <CardContent>
                  <Swords className="w-16 h-16 text-purple-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("duels.noDuels", "No active duels")}</h3>
                  <p className="text-gray-500">{t("duels.challengeSomeone", "Challenge a friend to start a duel!")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid gap-4">
                {activeDuels.map((duel: any) => (
                  <Card key={duel.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t("duels.vs", "vs")} {duel.opponent?.firstName || "???"}</p>
                        <p className="text-sm text-gray-500">{duel.challengeType} • {duel.cefrLevel}</p>
                      </div>
                      <Badge className="bg-purple-100 text-purple-800">{t("duels.inProgress", "In Progress")}</Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="completed">
            <div className="grid gap-4">
              {completedDuels.map((duel: any) => (
                <Card key={duel.id}>
                  <CardContent className="p-4 flex items-center justify-between">
                    <div>
                      <p className="font-medium">{t("duels.vs", "vs")} {duel.opponent?.firstName || "???"}</p>
                      <p className="text-sm text-gray-500">
                        {duel.isChallenger ? duel.challengerScore : duel.challengedScore} - {duel.isChallenger ? duel.challengedScore : duel.challengerScore}
                      </p>
                    </div>
                    <Badge className={duel.winnerId === user?.id ? "bg-green-100 text-green-800" : duel.winnerId ? "bg-red-100 text-red-800" : "bg-gray-100 text-gray-800"}>
                      {duel.winnerId === user?.id ? t("duels.won", "Won") : duel.winnerId ? t("duels.lost", "Lost") : t("duels.draw", "Draw")}
                    </Badge>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="leaderboard">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Crown className="w-5 h-5 text-amber-500" />
                  {t("duels.topPlayers", "Top Players")}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {leaderboard.length === 0 ? (
                  <p className="text-center text-gray-500 py-6">{t("duels.noLeaderboard", "No leaderboard data yet")}</p>
                ) : (
                  <div className="space-y-3">
                    {leaderboard.map((player: any, index: number) => (
                      <div key={player.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                        <div className="flex items-center gap-3">
                          <span className={`text-lg font-bold ${index < 3 ? "text-amber-500" : "text-gray-400"}`}>#{index + 1}</span>
                          <div>
                            <p className="font-medium">{player.first_name} {player.last_name}</p>
                            <p className="text-sm text-gray-500">{player.total_duels} {t("duels.duels", "duels")}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="font-bold text-purple-600">{player.wins} {t("duels.wins", "wins")}</p>
                          <p className="text-sm text-gray-500">{player.win_rate}% {t("duels.winRate", "win rate")}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
