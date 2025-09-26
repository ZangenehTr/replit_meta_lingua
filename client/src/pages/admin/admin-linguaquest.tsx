import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery } from "@tanstack/react-query";
import { 
  Gamepad2, 
  Search, 
  Plus, 
  Eye, 
  Edit,
  Users,
  Trophy,
  Star,
  Clock,
  Play,
  Settings,
  BarChart3,
  Target,
  Zap
} from "lucide-react";

export function AdminLinguaQuest() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");

  // Fetch LinguaQuest data
  const { data: quests = [], isLoading } = useQuery({
    queryKey: ['/api/admin/linguaquest', { search: searchTerm, level: filterLevel }],
  });

  // Mock LinguaQuest data for development
  const mockQuests = [
    {
      id: 1,
      title: "Persian Alphabet Adventure",
      description: "Learn Persian letters through interactive gameplay",
      level: "beginner",
      category: "alphabet",
      difficulty: 2,
      estimatedTime: "15 mins",
      players: 245,
      completionRate: 87,
      averageScore: 82,
      status: "published",
      xpReward: 50,
      badges: ["First Steps", "Letter Master"]
    },
    {
      id: 2,
      title: "Grammar Galaxy",
      description: "Navigate through Persian grammar rules in space",
      level: "intermediate",
      category: "grammar",
      difficulty: 4,
      estimatedTime: "25 mins",
      players: 156,
      completionRate: 73,
      averageScore: 76,
      status: "published",
      xpReward: 100,
      badges: ["Grammar Hero", "Space Explorer"]
    },
    {
      id: 3,
      title: "Vocabulary Village",
      description: "Build your vocabulary by helping villagers",
      level: "beginner",
      category: "vocabulary",
      difficulty: 3,
      estimatedTime: "20 mins",
      players: 198,
      completionRate: 91,
      averageScore: 85,
      status: "published",
      xpReward: 75,
      badges: ["Word Collector", "Village Helper"]
    }
  ];

  const displayQuests = isLoading ? mockQuests : (Array.isArray(quests) && quests.length > 0 ? quests : mockQuests);

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.linguaQuest')}</h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:linguaQuest.description')}
          </p>
        </div>
        <Dialog>
          <DialogTrigger asChild>
            <Button data-testid="button-create-quest">
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:linguaQuest.createQuest')}
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{t('admin:linguaQuest.createQuest')}</DialogTitle>
              <DialogDescription>
                {t('admin:linguaQuest.createDescription')}
              </DialogDescription>
            </DialogHeader>
            {/* Quest creation form would go here */}
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:linguaQuest.totalQuests')}
            </CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-quests">
              {displayQuests.length}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:linguaQuest.totalPlayers')}
            </CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-players">
              {displayQuests.reduce((sum, q) => sum + q.players, 0)}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:linguaQuest.avgCompletion')}
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-completion">
              {Math.round(displayQuests.reduce((sum, q) => sum + q.completionRate, 0) / displayQuests.length)}%
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              {t('admin:linguaQuest.avgScore')}
            </CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-score">
              {Math.round(displayQuests.reduce((sum, q) => sum + q.averageScore, 0) / displayQuests.length)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quest Management */}
      <Tabs defaultValue="quests" className="w-full">
        <TabsList>
          <TabsTrigger value="quests">{t('admin:linguaQuest.quests')}</TabsTrigger>
          <TabsTrigger value="analytics">{t('admin:linguaQuest.analytics')}</TabsTrigger>
          <TabsTrigger value="rewards">{t('admin:linguaQuest.rewards')}</TabsTrigger>
        </TabsList>

        <TabsContent value="quests" className="space-y-4">
          {/* Search and Filters */}
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder={t('admin:linguaQuest.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-quests"
              />
            </div>
          </div>

          {/* Quests Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {displayQuests.map((quest) => (
              <Card key={quest.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-lg" data-testid={`text-quest-title-${quest.id}`}>
                        {quest.title}
                      </CardTitle>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="secondary">
                          {quest.level}
                        </Badge>
                        <Badge variant="outline">
                          {quest.category}
                        </Badge>
                      </div>
                    </div>
                    <Badge 
                      variant={quest.status === 'published' ? 'default' : 'secondary'}
                      data-testid={`badge-status-${quest.id}`}
                    >
                      {quest.status}
                    </Badge>
                  </div>
                  <CardDescription>{quest.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div className="flex items-center gap-2">
                        <Target className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-difficulty-${quest.id}`}>
                          {t('admin:linguaQuest.difficulty')} {quest.difficulty}/5
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-time-${quest.id}`}>
                          {quest.estimatedTime}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-players-${quest.id}`}>
                          {quest.players} players
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Zap className="h-4 w-4 text-muted-foreground" />
                        <span data-testid={`text-xp-${quest.id}`}>
                          {quest.xpReward} XP
                        </span>
                      </div>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="flex justify-between text-sm mb-1">
                        <span>{t('admin:linguaQuest.completion')}</span>
                        <span className="font-medium" data-testid={`text-completion-${quest.id}`}>
                          {quest.completionRate}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-600 h-2 rounded-full" 
                          style={{ width: `${quest.completionRate}%` }}
                        ></div>
                      </div>
                    </div>

                    <div className="flex justify-between text-sm">
                      <span>{t('admin:linguaQuest.avgScore')}</span>
                      <span className="font-medium" data-testid={`text-score-${quest.id}`}>
                        {quest.averageScore}/100
                      </span>
                    </div>

                    <div className="pt-2 border-t">
                      <div className="text-sm text-muted-foreground mb-1">
                        {t('admin:linguaQuest.badges')}
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {quest.badges.map((badge, index) => (
                          <Badge key={index} variant="outline" className="text-xs">
                            {badge}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2 mt-4">
                    <Button size="sm" variant="outline" data-testid={`button-play-${quest.id}`}>
                      <Play className="h-4 w-4 mr-1" />
                      {t('admin:linguaQuest.play')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${quest.id}`}>
                      <Edit className="h-4 w-4 mr-1" />
                      {t('common:edit')}
                    </Button>
                    <Button size="sm" variant="outline" data-testid={`button-settings-${quest.id}`}>
                      <Settings className="h-4 w-4 mr-1" />
                      {t('common:settings')}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:linguaQuest.gameAnalytics')}</CardTitle>
              <CardDescription>
                {t('admin:linguaQuest.analyticsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <BarChart3 className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:linguaQuest.analyticsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rewards" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t('admin:linguaQuest.rewardSystem')}</CardTitle>
              <CardDescription>
                {t('admin:linguaQuest.rewardsDescription')}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12 text-muted-foreground">
                <Trophy className="h-12 w-12 mx-auto mb-4" />
                <p>{t('admin:linguaQuest.rewardsPlaceholder')}</p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}