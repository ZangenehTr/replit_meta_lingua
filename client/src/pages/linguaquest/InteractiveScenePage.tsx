import { useState, useEffect, lazy, Suspense } from "react";
import { useParams, Link, useLocation } from "wouter";
import { useTranslation } from "react-i18next";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Globe, Loader2, Star, Clock, Trophy, Lock } from "lucide-react";
import { guestProgress } from "@/lib/guest-progress";

const InteractiveScene3D = lazy(() =>
  import("@/components/3d-lessons/InteractiveScene3D").then((m) => ({
    default: m.InteractiveScene3D,
  }))
);

export function InteractiveScenePage() {
  const { sceneId } = useParams<{ sceneId: string }>();
  const { t, i18n } = useTranslation("linguaquest");
  const lang = i18n.language;
  const [, navigate] = useLocation();
  const [isLoggedIn] = useState(() => !!localStorage.getItem("auth_token"));

  const { data: scene, isLoading, error } = useQuery({
    queryKey: [`/api/scenes/${sceneId}`],
    queryFn: async () => {
      const res = await fetch(`/api/scenes/${sceneId}`);
      if (!res.ok) throw new Error("Failed to load scene");
      return res.json();
    },
    enabled: !!sceneId,
  });

  const handleComplete = async (score: number) => {
    try {
      await guestProgress.trackEvent("lesson_complete", `scene_${sceneId}`, { score });
      navigate("/linguaquest/scenes");
    } catch (err) {
      console.error("Failed to track completion:", err);
    }
  };

  const handleProgress = async (progress: number) => {
    try {
      await guestProgress.trackEvent("progress", `scene_${sceneId}`, { progress });
    } catch (err) {
      console.error("Failed to track progress:", err);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="animate-spin h-12 w-12 text-emerald-600 mx-auto mb-4" />
          <p className="text-emerald-700 dark:text-emerald-300">{t("scenes.loading", "Loading scene...")}</p>
        </div>
      </div>
    );
  }

  if (error || !scene) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700 flex items-center justify-center">
        <Card className="max-w-md mx-auto">
          <CardContent className="p-6 text-center">
            <p className="text-red-500 mb-4">{t("scenes.loadError", "Failed to load scene")}</p>
            <Link href="/linguaquest/scenes">
              <Button>{t("scenes.backToScenes", "Back to Scenes")}</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isMobile = window.innerWidth < 768;

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-teal-50 to-cyan-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-emerald-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/linguaquest/scenes">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 me-1" />
                {t("navigation.back", "Back")}
              </Button>
            </Link>
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-white">
                {lang === "fa" ? scene.titleFa || scene.title : lang === "ar" ? scene.titleAr || scene.title : scene.title}
              </h1>
              <div className="flex items-center gap-2">
                <Badge variant="secondary">{scene.cefrLevel}</Badge>
                <Badge variant="outline" className="text-emerald-600">
                  <Star className="w-3 h-3 me-1" />
                  {scene.xpReward} XP
                </Badge>
                <Badge variant="outline" className="text-blue-600">
                  <Clock className="w-3 h-3 me-1" />
                  {scene.estimatedDurationMinutes} min
                </Badge>
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="flex-1">
        <Suspense
          fallback={
            <div className="flex items-center justify-center h-[calc(100vh-80px)]">
              <Loader2 className="animate-spin h-12 w-12 text-emerald-600" />
            </div>
          }
        >
          <InteractiveScene3D scene={scene} onComplete={handleComplete} onProgress={handleProgress} isMobile={isMobile} />
        </Suspense>
      </div>
    </div>
  );
}
