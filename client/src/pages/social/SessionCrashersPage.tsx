import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Loader2, Users, Zap, Search, Clock, Star, CheckCircle, Radio } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function SessionCrashersPage() {
  const { t } = useTranslation("student");
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [cefrLevel, setCefrLevel] = useState("B1");
  const [language, setLanguage] = useState("english");

  const { data: availability } = useQuery<any>({
    queryKey: ["/api/crash/availability"],
    enabled: !!user,
  });

  const { data: history = [] } = useQuery<any[]>({
    queryKey: ["/api/crash/sessions/history"],
    enabled: !!user,
  });

  const toggleAvailability = useMutation({
    mutationFn: async (isActive: boolean) => {
      const res = await apiRequest("/api/crash/availability", {
        method: "POST",
        body: JSON.stringify({ isActive, cefrLevel, language }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/crash/availability"] }),
  });

  const findCrasher = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/crash/find-crasher", {
        method: "POST",
        body: JSON.stringify({ cefrLevel, language }),
      });
      return res.json();
    },
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-cyan-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-cyan-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 me-1" />
                {t("crashers.back", "Back")}
              </Button>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-xl flex items-center justify-center">
              <Zap className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-cyan-600 to-blue-600 bg-clip-text text-transparent">
                {t("crashers.title", "Session Crashers")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("crashers.subtitle", "Drop into live sessions and practice together")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Radio className="w-5 h-5 text-cyan-600" />
              {t("crashers.availability", "Your Availability")}
            </CardTitle>
            <CardDescription>
              {t("crashers.availabilityDesc", "Toggle your availability to receive crash invitations during CallerN sessions")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between mb-6">
              <div>
                <p className="font-medium">{t("crashers.availableStatus", "Available for Crashing")}</p>
                <p className="text-sm text-gray-500">
                  {availability?.isActive
                    ? t("crashers.active", "You can receive crash invitations")
                    : t("crashers.inactive", "You won't receive crash invitations")}
                </p>
              </div>
              <Switch
                checked={availability?.isActive || false}
                onCheckedChange={(checked) => toggleAvailability.mutate(checked)}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-1 block">{t("crashers.cefrLevel", "CEFR Level")}</label>
                <Select value={cefrLevel} onValueChange={setCefrLevel}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["A1", "A2", "B1", "B2", "C1", "C2"].map((level) => (
                      <SelectItem key={level} value={level}>{level}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">{t("crashers.language", "Language")}</label>
                <Select value={language} onValueChange={setLanguage}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="english">English</SelectItem>
                    <SelectItem value="persian">Persian</SelectItem>
                    <SelectItem value="arabic">Arabic</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Search className="w-5 h-5 text-blue-600" />
              {t("crashers.findCrasher", "Find a Crash Partner")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Button
              onClick={() => findCrasher.mutate()}
              disabled={findCrasher.isPending}
              className="w-full bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700"
            >
              {findCrasher.isPending ? (
                <Loader2 className="w-4 h-4 me-2 animate-spin" />
              ) : (
                <Users className="w-4 h-4 me-2" />
              )}
              {t("crashers.searchNow", "Search Now")}
            </Button>

            {findCrasher.data && (
              <div className="mt-4 p-4 rounded-lg bg-gray-50 dark:bg-gray-800">
                {findCrasher.data.found ? (
                  <div className="text-center">
                    <CheckCircle className="w-10 h-10 text-green-500 mx-auto mb-2" />
                    <p className="font-medium">{t("crashers.matchFound", "Match Found!")}</p>
                    <p className="text-gray-600">{findCrasher.data.crasher.firstName} • {findCrasher.data.crasher.cefrLevel}</p>
                  </div>
                ) : (
                  <div className="text-center">
                    <Users className="w-10 h-10 text-gray-400 mx-auto mb-2" />
                    <p className="text-gray-500">{t("crashers.noMatch", "No matching crashers available right now")}</p>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-indigo-600" />
              {t("crashers.history", "Crash History")}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {history.length === 0 ? (
              <p className="text-center text-gray-500 py-6">{t("crashers.noHistory", "No crash sessions yet")}</p>
            ) : (
              <div className="space-y-3">
                {history.map((session: any) => (
                  <div key={session.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-800">
                    <div>
                      <p className="font-medium">{t("crashers.session", "Session")} #{session.id}</p>
                      <p className="text-sm text-gray-500">
                        {session.durationSeconds ? `${Math.round(session.durationSeconds / 60)} min` : t("crashers.pending", "Pending")}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {session.xpEarned > 0 && (
                        <Badge className="bg-cyan-100 text-cyan-800">+{Math.round(session.xpEarned)} XP</Badge>
                      )}
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
