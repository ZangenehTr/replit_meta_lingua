import { useState } from "react";
import { Link } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, Globe, Star, Clock, Play, Lock, CheckCircle, Loader2, Sparkles, Box } from "lucide-react";
import { LanguageSwitcher } from "@/components/language-switcher";

const CEFR_COLORS: Record<string, string> = {
  A0: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
  A1: "bg-green-200 text-green-900 dark:bg-green-800 dark:text-green-100",
  A2: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  B1: "bg-blue-200 text-blue-900 dark:bg-blue-800 dark:text-blue-100",
  B2: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200",
  C1: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200",
  C2: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200",
};

const SCENE_ICONS: Record<string, string> = {
  cafe: "☕",
  market: "🛒",
  airport: "✈️",
  hospital: "🏥",
  office: "💼",
  classroom: "📚",
  restaurant: "🍽️",
  hotel: "🏨",
  library: "📖",
  park: "🌳",
};

export function SceneListPage() {
  const { t, i18n } = useTranslation("linguaquest");
  const lang = i18n.language;
  const [selectedLevel, setSelectedLevel] = useState<string>("all");
  const [isLoggedIn] = useState(() => !!localStorage.getItem("auth_token"));

  const { data: scenes = [], isLoading } = useQuery<any[]>({
    queryKey: ["/api/scenes", selectedLevel],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (selectedLevel !== "all") params.set("cefrLevel", selectedLevel);
      const res = await fetch(`/api/scenes?${params}`);
      if (!res.ok) throw new Error("Failed to load scenes");
      return res.json();
    },
  });

  const getSceneTitle = (scene: any) =>
    lang === "fa" ? scene.titleFa || scene.title : lang === "ar" ? scene.titleAr || scene.title : scene.title;

  const getSceneDescription = (scene: any) =>
    lang === "fa" ? scene.descriptionFa || scene.description : lang === "ar" ? scene.descriptionAr || scene.description : scene.description;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <Link href="/linguaquest">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="w-4 h-4 mr-1" />
                  {t("navigation.back", "Back")}
                </Button>
              </Link>
              <div className="w-10 h-10 bg-gradient-to-br from-emerald-500 to-teal-600 rounded-xl flex items-center justify-center">
                <Box className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  {t("scenes.title", "3D Interactive Scenes")}
                </h1>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t("scenes.subtitle", "Explore real-world environments and learn vocabulary")}
                </p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              {isLoggedIn && (
                <Link href="/admin/dashboard">
                  <Button variant="ghost" size="sm" className="text-emerald-700 dark:text-emerald-400">
                    <ArrowLeft className="w-4 h-4 mr-1" />
                    {t("navigation.backToPlatform", "Back to Platform")}
                  </Button>
                </Link>
              )}
              <LanguageSwitcher />
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("scenes.explore", "Explore Scenes")}
            </h2>
            <p className="text-gray-600 dark:text-gray-300">
              {t("scenes.exploreDesc", "Click on objects, answer questions, and build vocabulary in immersive 3D environments")}
            </p>
          </div>
          <Select value={selectedLevel} onValueChange={setSelectedLevel}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder={t("scenes.allLevels", "All Levels")} />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t("scenes.allLevels", "All Levels")}</SelectItem>
              <SelectItem value="A1">A1 - {t("scenes.beginner", "Beginner")}</SelectItem>
              <SelectItem value="A2">A2 - {t("scenes.elementary", "Elementary")}</SelectItem>
              <SelectItem value="B1">B1 - {t("scenes.intermediate", "Intermediate")}</SelectItem>
              <SelectItem value="B2">B2 - {t("scenes.upperIntermediate", "Upper Intermediate")}</SelectItem>
              <SelectItem value="C1">C1 - {t("scenes.advanced", "Advanced")}</SelectItem>
              <SelectItem value="C2">C2 - {t("scenes.mastery", "Mastery")}</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="animate-spin h-10 w-10 text-emerald-600" />
          </div>
        ) : scenes.length === 0 ? (
          <div className="text-center py-20">
            <Globe className="w-16 h-16 text-emerald-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-700 dark:text-gray-300">
              {t("scenes.noScenes", "No scenes available for this level yet")}
            </h3>
            <p className="text-gray-500 dark:text-gray-400">
              {t("scenes.checkBack", "Check back soon for new content!")}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {scenes.map((scene: any) => (
              <Card
                key={scene.id}
                className="overflow-hidden hover:shadow-xl transition-all duration-300 group cursor-pointer border-emerald-100 dark:border-gray-700"
              >
                <div className="h-40 bg-gradient-to-br from-emerald-400 to-teal-500 dark:from-emerald-700 dark:to-teal-800 relative flex items-center justify-center">
                  <span className="text-6xl opacity-80">{SCENE_ICONS[scene.sceneType] || "🌍"}</span>
                  <div className="absolute top-3 right-3 flex gap-1">
                    <Badge className={CEFR_COLORS[scene.cefrLevel] || "bg-gray-100 text-gray-800"}>
                      {scene.cefrLevel}
                    </Badge>
                  </div>
                  <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/30 to-transparent p-3">
                    <Sparkles className="w-5 h-5 text-white/80" />
                  </div>
                </div>
                <CardHeader className="pb-2">
                  <CardTitle className="text-lg">{getSceneTitle(scene)}</CardTitle>
                  <CardDescription className="line-clamp-2">{getSceneDescription(scene)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3 text-sm text-gray-500">
                      <span className="flex items-center">
                        <Star className="w-4 h-4 mr-1 text-amber-500" />
                        {scene.xpReward} XP
                      </span>
                      <span className="flex items-center">
                        <Clock className="w-4 h-4 mr-1 text-blue-500" />
                        {scene.estimatedDurationMinutes} min
                      </span>
                    </div>
                  </div>
                  <Link href={`/linguaquest/scene/${scene.id}`}>
                    <Button className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white">
                      <Play className="w-4 h-4 mr-2" />
                      {t("scenes.startScene", "Start Scene")}
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
}
