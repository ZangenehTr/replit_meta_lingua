import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, Globe, Users, Star, Calendar, MessageCircle, Award, Loader2, MapPin, Heart } from "lucide-react";
import { Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import { apiRequest } from "@/lib/queryClient";

export function DiasporaBridgePage() {
  const { t } = useTranslation("student");
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: profile } = useQuery<any>({
    queryKey: ["/api/diaspora/profile"],
    enabled: !!user,
  });

  const { data: matches = [] } = useQuery<any[]>({
    queryKey: ["/api/diaspora/matches"],
    enabled: !!user && !!profile,
  });

  const { data: sessions = [] } = useQuery<any[]>({
    queryKey: ["/api/diaspora/sessions"],
    enabled: !!user,
  });

  const [profileForm, setProfileForm] = useState({
    isDiaspora: false,
    countryOfResidence: "",
    heritageLanguage: "persian",
    targetLanguage: "english",
    proficiencyLevel: "B1",
    bio: "",
    bioFa: "",
    timezone: "Asia/Tehran",
  });

  const saveProfile = useMutation({
    mutationFn: async (data: any) => {
      const res = await apiRequest("/api/diaspora/profile", {
        method: "POST",
        body: JSON.stringify(data),
      });
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/diaspora/profile"] });
      queryClient.invalidateQueries({ queryKey: ["/api/diaspora/matches"] });
    },
  });

  const createSession = useMutation({
    mutationFn: async (partnerId: number) => {
      const res = await apiRequest("/api/diaspora/sessions", {
        method: "POST",
        body: JSON.stringify({
          partnerId,
          language: profile?.targetLanguage || "english",
          cefrLevel: profile?.proficiencyLevel || "B1",
          sessionType: "exchange",
        }),
      });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/diaspora/sessions"] }),
  });

  const applyAmbassador = useMutation({
    mutationFn: async () => {
      const res = await apiRequest("/api/diaspora/ambassador/apply", { method: "POST" });
      return res.json();
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["/api/diaspora/profile"] }),
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-rose-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-700">
      <header className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-amber-200 dark:border-gray-700 p-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <Link href="/admin/dashboard">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="w-4 h-4 mr-1" />
                {t("diaspora.back", "Back")}
              </Button>
            </Link>
            <div className="w-10 h-10 bg-gradient-to-br from-amber-500 to-orange-600 rounded-xl flex items-center justify-center">
              <Globe className="w-6 h-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                {t("diaspora.title", "Diaspora Bridge")}
              </h1>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {t("diaspora.subtitle", "Connect homeland & abroad for language exchange")}
              </p>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <Tabs defaultValue={profile ? "matches" : "profile"}>
          <TabsList className="mb-6">
            <TabsTrigger value="profile">{t("diaspora.profile", "My Profile")}</TabsTrigger>
            <TabsTrigger value="matches">{t("diaspora.matches", "Find Partners")}</TabsTrigger>
            <TabsTrigger value="sessions">{t("diaspora.sessions", "My Sessions")}</TabsTrigger>
          </TabsList>

          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle>{t("diaspora.setupProfile", "Set Up Your Diaspora Profile")}</CardTitle>
                <CardDescription>
                  {t("diaspora.profileDesc", "Tell us about your background so we can match you with the best language exchange partners")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">{t("diaspora.isDiaspora", "I live abroad")}</p>
                    <p className="text-sm text-gray-500">{t("diaspora.isDiasporaDesc", "Toggle if you're an Iranian living outside Iran")}</p>
                  </div>
                  <Switch
                    checked={profile?.isDiaspora || profileForm.isDiaspora}
                    onCheckedChange={(v) => setProfileForm({ ...profileForm, isDiaspora: v })}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("diaspora.country", "Country of Residence")}</label>
                    <Input
                      value={profile?.countryOfResidence || profileForm.countryOfResidence}
                      onChange={(e) => setProfileForm({ ...profileForm, countryOfResidence: e.target.value })}
                      placeholder={t("diaspora.countryPlaceholder", "e.g., Germany, Canada...")}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1 block">{t("diaspora.level", "Proficiency Level")}</label>
                    <Select
                      value={profile?.proficiencyLevel || profileForm.proficiencyLevel}
                      onValueChange={(v) => setProfileForm({ ...profileForm, proficiencyLevel: v })}
                    >
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        {["A1", "A2", "B1", "B2", "C1", "C2"].map((l) => (
                          <SelectItem key={l} value={l}>{l}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium mb-1 block">{t("diaspora.bio", "About You")}</label>
                  <Textarea
                    value={profile?.bio || profileForm.bio}
                    onChange={(e) => setProfileForm({ ...profileForm, bio: e.target.value })}
                    placeholder={t("diaspora.bioPlaceholder", "Share your interests, what you'd like to practice...")}
                    rows={3}
                  />
                </div>

                <Button
                  onClick={() => saveProfile.mutate({
                    ...profileForm,
                    isDiaspora: profile?.isDiaspora ?? profileForm.isDiaspora,
                  })}
                  disabled={saveProfile.isPending}
                  className="bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700"
                >
                  {saveProfile.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {t("diaspora.saveProfile", "Save Profile")}
                </Button>

                {profile?.isDiaspora && !profile?.isCulturalAmbassador && (
                  <Card className="mt-6 border-amber-200 bg-amber-50 dark:bg-amber-900/20">
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium flex items-center gap-2">
                          <Award className="w-5 h-5 text-amber-600" />
                          {t("diaspora.ambassador", "Become a Cultural Ambassador")}
                        </p>
                        <p className="text-sm text-gray-600">{t("diaspora.ambassadorDesc", "Help others learn about your culture while practicing language")}</p>
                      </div>
                      <Button
                        size="sm"
                        onClick={() => applyAmbassador.mutate()}
                        disabled={applyAmbassador.isPending}
                        className="bg-amber-600 hover:bg-amber-700"
                      >
                        {t("diaspora.apply", "Apply")}
                      </Button>
                    </CardContent>
                  </Card>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="matches">
            {!profile ? (
              <Card className="text-center py-10">
                <CardContent>
                  <Globe className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("diaspora.noProfile", "Set up your profile first")}</h3>
                  <p className="text-gray-500">{t("diaspora.noProfileDesc", "We need your profile to find the best matches")}</p>
                </CardContent>
              </Card>
            ) : matches.length === 0 ? (
              <Card className="text-center py-10">
                <CardContent>
                  <Users className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("diaspora.noMatches", "No matches yet")}</h3>
                  <p className="text-gray-500">{t("diaspora.noMatchesDesc", "New partners are joining every day!")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {matches.map((match: any) => (
                  <Card key={match.profile.id} className="hover:shadow-lg transition-shadow">
                    <CardContent className="p-5">
                      <div className="flex items-start justify-between mb-3">
                        <div>
                          <p className="text-lg font-medium">{match.user.firstName} {match.user.lastName}</p>
                          <div className="flex items-center gap-2 text-sm text-gray-500">
                            <MapPin className="w-3 h-3" />
                            {match.profile.countryOfResidence || t("diaspora.local", "Local")}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Badge>{match.profile.proficiencyLevel}</Badge>
                          {match.profile.isCulturalAmbassador && (
                            <Badge className="bg-amber-100 text-amber-800">
                              <Award className="w-3 h-3 mr-1" />
                              {t("diaspora.ambassadorBadge", "Ambassador")}
                            </Badge>
                          )}
                        </div>
                      </div>

                      {match.profile.bio && (
                        <p className="text-sm text-gray-600 dark:text-gray-300 mb-3 line-clamp-2">{match.profile.bio}</p>
                      )}

                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1 text-sm">
                          <Star className="w-4 h-4 text-amber-500" />
                          <span>{match.profile.averageRating || "-"}</span>
                          <span className="text-gray-400">({match.profile.totalExchangeSessions || 0})</span>
                        </div>
                        <Button
                          size="sm"
                          onClick={() => createSession.mutate(match.user.id)}
                          disabled={createSession.isPending}
                          className="bg-amber-600 hover:bg-amber-700"
                        >
                          <MessageCircle className="w-4 h-4 mr-1" />
                          {t("diaspora.connect", "Connect")}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="sessions">
            {sessions.length === 0 ? (
              <Card className="text-center py-10">
                <CardContent>
                  <Calendar className="w-16 h-16 text-amber-300 mx-auto mb-4" />
                  <h3 className="text-lg font-medium mb-2">{t("diaspora.noSessions", "No sessions yet")}</h3>
                  <p className="text-gray-500">{t("diaspora.noSessionsDesc", "Find a partner to start your first exchange session")}</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {sessions.map((session: any) => (
                  <Card key={session.id}>
                    <CardContent className="p-4 flex items-center justify-between">
                      <div>
                        <p className="font-medium">{t("diaspora.exchangeSession", "Exchange Session")} #{session.id}</p>
                        <p className="text-sm text-gray-500">
                          {session.language} • {session.cefrLevel} • {session.sessionType}
                        </p>
                      </div>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
