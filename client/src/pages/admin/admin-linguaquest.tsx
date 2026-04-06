import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Gamepad2, Search, Plus, Eye, Edit, Users, Star, Clock, BarChart3, MessageSquare, TrendingUp, TrendingDown, Trash2, CheckCircle, XCircle, Loader2, Volume2, PlayCircle, FileAudio, RefreshCw } from "lucide-react";
import { LessonForm } from "@/components/admin/LessonForm";

interface LessonFormData { title: string; description: string; difficulty: string; lessonType: string; language: string; isPublished: boolean; }
interface LessonRecord { id: number; title: string; description?: string; difficulty: string; lessonType: string; language: string; isPublished: boolean; [key: string]: unknown; }
interface FeedbackRecord { id: number; lessonId: number; starRating: number; difficultyRating?: string; textFeedback?: string; scorePercentage?: number; completionTimeSeconds?: number; createdAt: string; }
interface AudioJob { id: number; status: string; totalItems: number; processedItems: number; generatedItems?: number; cachedItems?: number; failedItems?: number; durationMs?: number; createdAt: string; }
interface AudioJobsResponse { jobs: AudioJob[]; }
interface AnalyticsData { totalLessons: number; publishedLessons: number; draftLessons: number; totalGuests: number; totalFeedback: number; averageRating: number; lessons?: LessonRecord[]; difficultyDistribution?: Record<string, number>; lessonTypeDistribution?: Record<string, number>; feedbackDifficultyDistribution?: Record<string, number>; }

const DEFAULT_FORM: LessonFormData = { title: "", description: "", difficulty: "beginner", lessonType: "interactive", language: "fa", isPublished: false };

export function AdminLinguaQuest() {
  const { t } = useTranslation(["admin", "common", "linguaquest"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("lessons");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<LessonRecord | null>(null);
  const [formData, setFormData] = useState<LessonFormData>(DEFAULT_FORM);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery<{ analytics: AnalyticsData }>({ queryKey: ["/api/linguaquest/admin/analytics"] });
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery<{ lessons: LessonRecord[] }>({ queryKey: ["/api/linguaquest/lessons"] });
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery<{ feedback: FeedbackRecord[] }>({ queryKey: ["/api/linguaquest/admin/feedback"] });
  const { data: audioStatsData, isLoading: audioStatsLoading } = useQuery<{ stats: Record<string, number> }>({ queryKey: ["/api/linguaquest/audio/stats"] });
  const { data: audioJobsData, isLoading: audioJobsLoading, refetch: refetchJobs } = useQuery<AudioJobsResponse>({
    queryKey: ["/api/linguaquest/audio/jobs"],
    refetchInterval: (q) => { const d = q.state.data; return d?.jobs?.some((j) => j.status === "running" || j.status === "pending") ? 2000 : false; },
  });

  const onSuccess = (queryKeys: string[], message: string, cb?: () => void) => {
    queryKeys.forEach((k) => queryClient.invalidateQueries({ queryKey: [k] }));
    toast({ title: t("common:success"), description: message });
    cb?.();
  };
  const onError = (e: unknown, msg: string) => toast({ title: t("common:error"), description: e instanceof Error ? e.message : msg, variant: "destructive" });

  const createMutation = useMutation({
    mutationFn: (d: LessonFormData) => apiRequest("/api/linguaquest/admin/lessons", { method: "POST", body: JSON.stringify(d) }),
    onSuccess: () => onSuccess(["/api/linguaquest/lessons", "/api/linguaquest/admin/analytics"], "Lesson created successfully", () => { setCreateDialogOpen(false); setFormData(DEFAULT_FORM); }),
    onError: (e) => onError(e, "Failed to create lesson"),
  });
  const updateMutation = useMutation({
    mutationFn: ({ lessonId, data }: { lessonId: number; data: Partial<LessonFormData> }) => apiRequest(`/api/linguaquest/admin/lessons/${lessonId}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => onSuccess(["/api/linguaquest/lessons", "/api/linguaquest/admin/analytics"], "Lesson updated successfully", () => { setEditDialogOpen(false); setEditingLesson(null); }),
    onError: (e) => onError(e, "Failed to update lesson"),
  });
  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/linguaquest/admin/lessons/${id}`, { method: "DELETE" }),
    onSuccess: () => onSuccess(["/api/linguaquest/lessons", "/api/linguaquest/admin/analytics"], "Lesson deleted successfully"),
    onError: (e) => onError(e, "Failed to delete lesson"),
  });
  const togglePublishMutation = useMutation({
    mutationFn: ({ lessonId, isPublished }: { lessonId: number; isPublished: boolean }) => apiRequest(`/api/linguaquest/admin/lessons/${lessonId}`, { method: "PUT", body: JSON.stringify({ isPublished }) }),
    onSuccess: () => onSuccess(["/api/linguaquest/lessons", "/api/linguaquest/admin/analytics"], "Publish status updated"),
    onError: (e) => onError(e, "Failed to update status"),
  });
  const triggerAudioMutation = useMutation({
    mutationFn: ({ contentIds, regenerateAll }: { contentIds?: number[]; regenerateAll?: boolean }) => apiRequest("/api/linguaquest/audio/batch", { method: "POST", body: JSON.stringify({ contentIds, regenerateAll }) }),
    onSuccess: (data: { jobId?: number }) => { queryClient.invalidateQueries({ queryKey: ["/api/linguaquest/audio/jobs"] }); queryClient.invalidateQueries({ queryKey: ["/api/linguaquest/audio/stats"] }); refetchJobs(); toast({ title: t("common:success"), description: `Audio job started (ID: ${data.jobId})` }); },
    onError: (e) => onError(e, "Failed to start audio generation"),
  });

  const analytics = analyticsData?.analytics || { totalLessons: 0, publishedLessons: 0, totalGuests: 0, totalFeedback: 0, averageRating: 0, draftLessons: 0, lessons: [], difficultyDistribution: {}, lessonTypeDistribution: {}, feedbackDifficultyDistribution: {} };
  const lessons = lessonsData?.lessons || [];
  const feedback = feedbackData?.feedback || [];
  const filteredLessons = lessons.filter((l) => l.title?.toLowerCase().includes(searchTerm.toLowerCase()) || l.description?.toLowerCase().includes(searchTerm.toLowerCase()));

  const STATS = [
    { label: "Total Lessons", value: analytics.totalLessons, note: `${analytics.publishedLessons} published`, icon: Gamepad2, testId: "text-total-lessons" },
    { label: "Total Users", value: analytics.totalGuests, note: "Guest sessions", icon: Users, testId: "text-total-users" },
    { label: "Total Feedback", value: analytics.totalFeedback, note: "User ratings", icon: MessageSquare, testId: "text-total-feedback" },
    { label: "Avg Rating", value: analytics.averageRating.toFixed(1), note: "Out of 5.0", icon: Star, testId: "text-avg-rating" },
    { label: "Draft Lessons", value: analytics.draftLessons || 0, note: "Unpublished", icon: Edit, testId: "text-draft-lessons" },
  ];

  return (
    <div className="p-4 sm:p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      <div className="flex justify-between items-center">
        <div><h1 className="text-3xl font-bold">{t("admin:navigation.linguaQuest")}</h1><p className="text-muted-foreground mt-2">Manage free learning platform content, analytics, and feedback</p></div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild><Button data-testid="button-create-lesson"><Plus className="h-4 w-4 me-2" />Create Lesson</Button></DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Create New Lesson</DialogTitle><DialogDescription>Create a new LinguaQuest lesson for the free learning platform</DialogDescription></DialogHeader>
            <LessonForm data={formData} onChange={setFormData} onSave={() => createMutation.mutate(formData)} onCancel={() => setCreateDialogOpen(false)} isLoading={createMutation.isPending} mode="create" />
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        {STATS.map(({ label, value, note, icon: Icon, testId }) => (
          <Card key={label}><CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">{label}</CardTitle><Icon className="h-4 w-4 text-muted-foreground" /></CardHeader>
            <CardContent><div className="text-2xl font-bold" data-testid={testId}>{analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value}</div><p className="text-xs text-muted-foreground">{note}</p></CardContent>
          </Card>
        ))}
      </div>

      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList><TabsTrigger value="lessons">Lessons</TabsTrigger><TabsTrigger value="feedback">Feedback</TabsTrigger><TabsTrigger value="analytics">Analytics</TabsTrigger><TabsTrigger value="audio">Audio Generation</TabsTrigger></TabsList>

        <TabsContent value="lessons" className="space-y-4">
          <div className="flex gap-4"><div className="flex-1 relative"><Search className="absolute start-3 top-3 h-4 w-4 text-muted-foreground" /><Input placeholder="Search lessons..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10" data-testid="input-search-lessons" /></div></div>
          {lessonsLoading ? <div className="flex justify-center py-12"><Loader2 className="h-8 w-8 animate-spin" /></div> : filteredLessons.length === 0 ? (
            <Card><CardContent className="py-12 text-center text-muted-foreground">No lessons found</CardContent></Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">{filteredLessons.map((lesson) => (
              <Card key={lesson.id} className="hover:shadow-lg transition-shadow"><CardHeader>
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <CardTitle className="text-lg" data-testid={`text-lesson-title-${lesson.id}`}>{lesson.title}</CardTitle>
                      {lesson.isPublished ? <Badge variant="default" className="gap-1"><CheckCircle className="h-3 w-3" />Published</Badge> : <Badge variant="secondary" className="gap-1"><XCircle className="h-3 w-3" />Draft</Badge>}
                    </div>
                    <div className="flex gap-2 mt-2">{["difficulty","lessonType","language"].map((k) => <Badge key={k} variant="outline">{lesson[k] || k}</Badge>)}</div>
                  </div>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" data-testid={`button-view-${lesson.id}`} onClick={() => window.open(`/linguaquest/lesson/${lesson.id}`, "_blank")}><Eye className="h-4 w-4 me-1" />View</Button>
                    <Button size="sm" variant="outline" data-testid={`button-edit-${lesson.id}`} onClick={() => { setEditingLesson(lesson); setFormData({ title: lesson.title || "", description: lesson.description || "", difficulty: lesson.difficulty || "beginner", lessonType: lesson.lessonType || "interactive", language: lesson.language || "fa", isPublished: lesson.isPublished || false }); setEditDialogOpen(true); }}><Edit className="h-4 w-4 me-1" />Edit</Button>
                    <Button size="sm" variant={lesson.isPublished ? "default" : "secondary"} data-testid={`button-publish-${lesson.id}`} onClick={() => togglePublishMutation.mutate({ lessonId: lesson.id, isPublished: lesson.isPublished })} disabled={togglePublishMutation.isPending}>{lesson.isPublished ? <><XCircle className="h-4 w-4 me-1" />Unpublish</> : <><CheckCircle className="h-4 w-4 me-1" />Publish</>}</Button>
                    <Button size="sm" variant="outline" data-testid={`button-delete-${lesson.id}`} onClick={() => { if (confirm(`Delete "${lesson.title}"?`)) deleteMutation.mutate(lesson.id); }} disabled={deleteMutation.isPending}><Trash2 className="h-4 w-4 me-1" />Delete</Button>
                  </div>
                </div>
                {lesson.description && <CardDescription className="mt-2">{lesson.description}</CardDescription>}
              </CardHeader></Card>
            ))}</div>
          )}
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card><CardHeader><CardTitle>Recent Feedback</CardTitle><CardDescription>User ratings and comments from lessons</CardDescription></CardHeader>
            <CardContent>
              {feedbackLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : feedback.length === 0 ? <div className="text-center py-8 text-muted-foreground">No feedback received yet</div> : (
                <div className="overflow-x-auto"><Table className="min-w-[800px]">
                  <TableHeader><TableRow><TableHead>Lesson ID</TableHead><TableHead>Rating</TableHead><TableHead>Difficulty</TableHead><TableHead>Feedback</TableHead><TableHead>Score</TableHead><TableHead>Time</TableHead><TableHead>Date</TableHead></TableRow></TableHeader>
                  <TableBody>{feedback.slice(0, 50).map((fb) => (
                    <TableRow key={fb.id}>
                      <TableCell data-testid={`text-feedback-lesson-${fb.id}`}>#{fb.lessonId}</TableCell>
                      <TableCell><div className="flex items-center gap-1"><Star className="h-4 w-4 fill-yellow-400 text-yellow-400" /><span data-testid={`text-feedback-rating-${fb.id}`}>{fb.starRating}</span></div></TableCell>
                      <TableCell><Badge variant={fb.difficultyRating === "too_hard" ? "destructive" : fb.difficultyRating === "too_easy" ? "secondary" : "default"} data-testid={`badge-difficulty-${fb.id}`}>{fb.difficultyRating || "N/A"}</Badge></TableCell>
                      <TableCell className="max-w-xs truncate" data-testid={`text-feedback-text-${fb.id}`}>{fb.textFeedback || "-"}</TableCell>
                      <TableCell data-testid={`text-feedback-score-${fb.id}`}>{fb.scorePercentage ? `${fb.scorePercentage}%` : "-"}</TableCell>
                      <TableCell data-testid={`text-feedback-time-${fb.id}`}>{fb.completionTimeSeconds ? `${Math.round(fb.completionTimeSeconds / 60)}m` : "-"}</TableCell>
                      <TableCell data-testid={`text-feedback-date-${fb.id}`}>{new Date(fb.createdAt).toLocaleDateString()}</TableCell>
                    </TableRow>
                  ))}</TableBody>
                </Table></div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {[["Difficulty Distribution", analytics.difficultyDistribution, "bg-blue-600", "text-diff-count"], ["Lesson Type Distribution", analytics.lessonTypeDistribution, "bg-green-600", "text-type-count"], ["User Feedback - Difficulty", analytics.feedbackDifficultyDistribution, "bg-purple-600", "text-feedback-diff"]].map(([title, dist, color, prefix]) => (
              <Card key={title as string}><CardHeader><CardTitle>{title as string}</CardTitle></CardHeader>
                <CardContent>
                  {analyticsLoading ? <div className="flex justify-center py-8"><Loader2 className="h-8 w-8 animate-spin" /></div> : (
                    <div className="space-y-3">{Object.entries(dist as object || {}).map(([key, count]) => (
                      <div key={key} className="flex items-center justify-between">
                        <Badge variant="outline">{key}</Badge>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" data-testid={`${prefix}-${key}`}>{count as number}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2"><div className={`${color} h-2 rounded-full`} style={{ width: `${((count as number) / Math.max(analytics.totalLessons, 1)) * 100}%` }} /></div>
                        </div>
                      </div>
                    ))}</div>
                  )}
                </CardContent>
              </Card>
            ))}
            <Card><CardHeader><CardTitle>Platform Stats</CardTitle></CardHeader>
              <CardContent><div className="space-y-4">
                {[["Total Lessons", analytics.totalLessons, "", "text-stats-total-lessons"], ["Published Lessons", analytics.publishedLessons, "text-green-600", "text-stats-published"], ["Draft Lessons", analytics.draftLessons, "text-yellow-600", "text-stats-drafts"], ["Total Guest Users", analytics.totalGuests, "", "text-stats-guests"], ["Total Feedback", analytics.totalFeedback, "", "text-stats-feedback"]].map(([label, value, cls, testId]) => (
                  <div key={label as string} className="flex justify-between items-center"><span className="text-sm text-muted-foreground">{label as string}</span><span className={`text-lg font-bold ${cls}`} data-testid={testId as string}>{value as number}</span></div>
                ))}
                <div className="flex justify-between items-center pt-4 border-t"><span className="text-sm text-muted-foreground">Average Rating</span><div className="flex items-center gap-2"><Star className="h-5 w-5 fill-yellow-400 text-yellow-400" /><span className="text-xl font-bold" data-testid="text-stats-avg-rating">{analytics.averageRating.toFixed(1)}</span></div></div>
              </div></CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="audio" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            {[["Content with Audio", audioStatsData?.stats?.withAudio || 0, `/ ${audioStatsData?.stats?.totalContent || 0} total`, FileAudio, "text-audio-with-audio", ""], ["Audio Assets", audioStatsData?.stats?.audioAssets || 0, `${audioStatsData?.stats?.totalFileSizeMB || 0} MB total`, Volume2, "text-audio-assets", ""], ["Total Duration", audioStatsData?.stats?.totalDurationMinutes || 0, "minutes of audio", Clock, "text-audio-duration", ""], ["Missing Audio", audioStatsData?.stats?.withoutAudio || 0, "items need generation", TrendingDown, "text-audio-missing", "text-orange-600"]].map(([label, value, note, Icon, testId, cls]) => (
              <Card key={label as string}><CardHeader className="pb-3"><CardTitle className="text-sm font-medium flex items-center gap-2"><Icon className="h-4 w-4" />{label as string}</CardTitle></CardHeader>
                <CardContent><div className={`text-2xl font-bold ${cls}`} data-testid={testId as string}>{audioStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : value as number}</div><p className="text-xs text-muted-foreground mt-1">{note as string}</p></CardContent>
              </Card>
            ))}
          </div>
          <Card><CardHeader><CardTitle>Batch Audio Generation</CardTitle><CardDescription>Generate TTS audio for content bank items. Uses content hashing to avoid duplicates.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button onClick={() => triggerAudioMutation.mutate({})} disabled={triggerAudioMutation.isPending || (audioStatsData?.stats?.withoutAudio || 0) === 0} data-testid="button-generate-missing">{triggerAudioMutation.isPending ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />Starting...</> : <><PlayCircle className="h-4 w-4 me-2" />Generate Missing Audio</>}</Button>
                <Button variant="outline" onClick={() => triggerAudioMutation.mutate({ regenerateAll: true })} disabled={triggerAudioMutation.isPending} data-testid="button-regenerate-all">{triggerAudioMutation.isPending ? <><Loader2 className="h-4 w-4 me-2 animate-spin" />Starting...</> : <><RefreshCw className="h-4 w-4 me-2" />Regenerate All</>}</Button>
              </div>
              <div className="text-sm text-muted-foreground"><p>• Generate Missing: Only creates audio for items without audio hash</p><p>• Regenerate All: Processes all active content items (uses cache when possible)</p></div>
            </CardContent>
          </Card>
          <Card><CardHeader><CardTitle>Generation Jobs</CardTitle><CardDescription>Recent and active audio generation jobs</CardDescription></CardHeader>
            <CardContent>
              {audioJobsLoading ? <div className="flex items-center justify-center py-8"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div> : !audioJobsData?.jobs?.length ? <div className="text-center py-8 text-muted-foreground">No generation jobs yet. Click "Generate Missing Audio" to start.</div> : (
                <Table><TableHeader><TableRow><TableHead>Job ID</TableHead><TableHead>Status</TableHead><TableHead>Progress</TableHead><TableHead>Generated</TableHead><TableHead>Cached</TableHead><TableHead>Failed</TableHead><TableHead>Duration</TableHead><TableHead>Created</TableHead></TableRow></TableHeader>
                  <TableBody>{audioJobsData.jobs.slice().reverse().map((job) => { const pct = job.totalItems > 0 ? Math.round((job.processedItems / job.totalItems) * 100) : 0; return (
                    <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                      <TableCell className="font-medium">#{job.id}</TableCell>
                      <TableCell><Badge variant={job.status === "completed" ? "default" : job.status === "running" ? "secondary" : job.status === "failed" ? "destructive" : "outline"} data-testid={`badge-status-${job.id}`}>{job.status === "running" && <Loader2 className="h-3 w-3 me-1 animate-spin" />}{job.status}</Badge></TableCell>
                      <TableCell><div className="flex items-center gap-2"><div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden"><div className={`h-full ${job.status === "completed" ? "bg-green-500" : job.status === "failed" ? "bg-red-500" : "bg-blue-500"}`} style={{ width: `${pct}%` }} /></div><span className="text-sm text-muted-foreground min-w-[3rem]">{pct}%</span></div></TableCell>
                      <TableCell><span className="text-green-600 font-medium">{job.generatedItems || 0}</span></TableCell>
                      <TableCell><span className="text-blue-600 font-medium">{job.cachedItems || 0}</span></TableCell>
                      <TableCell><span className="text-red-600 font-medium">{job.failedItems || 0}</span></TableCell>
                      <TableCell className="text-muted-foreground">{job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : "-"}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(job.createdAt).toLocaleTimeString()}</TableCell>
                    </TableRow>
                  ); })}</TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto"><DialogHeader><DialogTitle>Edit Lesson</DialogTitle><DialogDescription>Modify lesson details and settings</DialogDescription></DialogHeader>
          <LessonForm data={formData} onChange={setFormData} onSave={() => { if (editingLesson) updateMutation.mutate({ lessonId: editingLesson.id, data: formData }); }} onCancel={() => setEditDialogOpen(false)} isLoading={updateMutation.isPending} mode="edit" />
        </DialogContent>
      </Dialog>
    </div>
  );
}
