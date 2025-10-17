import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Settings,
  BarChart3,
  MessageSquare,
  TrendingUp,
  TrendingDown,
  Trash2,
  CheckCircle,
  XCircle,
  Loader2,
  Save,
  Volume2,
  PlayCircle,
  FileAudio,
  RefreshCw
} from "lucide-react";

interface LessonFormData {
  title: string;
  description: string;
  difficulty: string;
  lessonType: string;
  language: string;
  isPublished: boolean;
}

export function AdminLinguaQuest() {
  const { t } = useTranslation(['admin', 'common', 'linguaquest']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTab, setSelectedTab] = useState("lessons");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  
  const [formData, setFormData] = useState<LessonFormData>({
    title: "",
    description: "",
    difficulty: "beginner",
    lessonType: "interactive",
    language: "fa",
    isPublished: false
  });

  // Fetch analytics
  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['/api/linguaquest/admin/analytics'],
  });

  // Fetch lessons
  const { data: lessonsData, isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/linguaquest/lessons'],
  });

  // Fetch all feedback
  const { data: feedbackData, isLoading: feedbackLoading } = useQuery({
    queryKey: ['/api/linguaquest/admin/feedback'],
  });

  // Fetch audio generation stats
  const { data: audioStatsData, isLoading: audioStatsLoading } = useQuery({
    queryKey: ['/api/linguaquest/audio/stats'],
  });

  // Fetch audio generation jobs
  const { data: audioJobsData, isLoading: audioJobsLoading, refetch: refetchJobs } = useQuery({
    queryKey: ['/api/linguaquest/audio/jobs'],
    refetchInterval: (data) => {
      // Poll every 2 seconds if there are running jobs
      const hasRunningJobs = data?.jobs?.some((j: any) => j.status === 'running' || j.status === 'pending');
      return hasRunningJobs ? 2000 : false;
    }
  });

  // Create lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: LessonFormData) => {
      return apiRequest('/api/linguaquest/admin/lessons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/admin/analytics'] });
      setCreateDialogOpen(false);
      setFormData({
        title: "",
        description: "",
        difficulty: "beginner",
        lessonType: "interactive",
        language: "fa",
        isPublished: false
      });
      toast({
        title: t('common:success'),
        description: 'Lesson created successfully',
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error instanceof Error ? error.message : 'Failed to create lesson',
        variant: 'destructive',
      });
    }
  });

  // Update lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: number; data: Partial<LessonFormData> }) => {
      return apiRequest(`/api/linguaquest/admin/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/admin/analytics'] });
      setEditDialogOpen(false);
      setEditingLesson(null);
      toast({
        title: t('common:success'),
        description: 'Lesson updated successfully',
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error instanceof Error ? error.message : 'Failed to update lesson',
        variant: 'destructive',
      });
    }
  });

  // Delete lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest(`/api/linguaquest/admin/lessons/${lessonId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/admin/analytics'] });
      toast({
        title: t('common:success'),
        description: 'Lesson deleted successfully',
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error instanceof Error ? error.message : 'Failed to delete lesson',
        variant: 'destructive',
      });
    }
  });

  // Toggle publish status
  const togglePublishMutation = useMutation({
    mutationFn: async ({ lessonId, isPublished }: { lessonId: number; isPublished: boolean }) => {
      return apiRequest(`/api/linguaquest/admin/lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ isPublished })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/admin/analytics'] });
      toast({
        title: t('common:success'),
        description: 'Publish status updated',
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error instanceof Error ? error.message : 'Failed to update status',
        variant: 'destructive',
      });
    }
  });

  // Trigger batch audio generation
  const triggerAudioGenerationMutation = useMutation({
    mutationFn: async ({ contentIds, regenerateAll }: { contentIds?: number[]; regenerateAll?: boolean }) => {
      return apiRequest('/api/linguaquest/audio/batch', {
        method: 'POST',
        body: JSON.stringify({ contentIds, regenerateAll })
      });
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/audio/jobs'] });
      queryClient.invalidateQueries({ queryKey: ['/api/linguaquest/audio/stats'] });
      refetchJobs(); // Start polling immediately
      toast({
        title: t('common:success'),
        description: `Audio generation job started (Job ID: ${data.jobId})`,
      });
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: error instanceof Error ? error.message : 'Failed to start audio generation',
        variant: 'destructive',
      });
    }
  });

  const analytics = analyticsData?.analytics || {
    totalLessons: 0,
    publishedLessons: 0,
    totalGuests: 0,
    totalFeedback: 0,
    averageRating: 0,
    lessons: []
  };

  const lessons = lessonsData?.lessons || [];
  const feedback = feedbackData?.feedback || [];

  // Filter lessons based on search
  const filteredLessons = lessons.filter((lesson: any) => 
    lesson.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDeleteLesson = (lessonId: number, lessonTitle: string) => {
    if (confirm(`Are you sure you want to delete "${lessonTitle}"? This cannot be undone.`)) {
      deleteLessonMutation.mutate(lessonId);
    }
  };

  const handleCreateLesson = () => {
    createLessonMutation.mutate(formData);
  };

  const handleEditLesson = (lesson: any) => {
    setEditingLesson(lesson);
    setFormData({
      title: lesson.title || "",
      description: lesson.description || "",
      difficulty: lesson.difficulty || "beginner",
      lessonType: lesson.lessonType || "interactive",
      language: lesson.language || "fa",
      isPublished: lesson.isPublished || false
    });
    setEditDialogOpen(true);
  };

  const handleUpdateLesson = () => {
    if (editingLesson) {
      updateLessonMutation.mutate({
        lessonId: editingLesson.id,
        data: formData
      });
    }
  };

  const handleTogglePublish = (lessonId: number, currentStatus: boolean) => {
    togglePublishMutation.mutate({
      lessonId,
      isPublished: !currentStatus
    });
  };

  return (
    <div className="space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:navigation.linguaQuest')}</h1>
          <p className="text-muted-foreground mt-2">
            Manage free learning platform content, analytics, and feedback
          </p>
        </div>
        <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-lesson">
              <Plus className="h-4 w-4 mr-2" />
              Create Lesson
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Lesson</DialogTitle>
              <DialogDescription>
                Create a new LinguaQuest lesson for the free learning platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Enter lesson title"
                  data-testid="input-lesson-title"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Enter lesson description"
                  rows={3}
                  data-testid="input-lesson-description"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="difficulty">Difficulty</Label>
                  <Select
                    value={formData.difficulty}
                    onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                  >
                    <SelectTrigger data-testid="select-difficulty">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="elementary">Elementary</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="upper_intermediate">Upper Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lessonType">Lesson Type</Label>
                  <Select
                    value={formData.lessonType}
                    onValueChange={(value) => setFormData({ ...formData, lessonType: value })}
                  >
                    <SelectTrigger data-testid="select-lesson-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="interactive">Interactive</SelectItem>
                      <SelectItem value="vocabulary">Vocabulary</SelectItem>
                      <SelectItem value="grammar">Grammar</SelectItem>
                      <SelectItem value="reading">Reading</SelectItem>
                      <SelectItem value="listening">Listening</SelectItem>
                      <SelectItem value="speaking">Speaking</SelectItem>
                      <SelectItem value="writing">Writing</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="language">Language</Label>
                <Select
                  value={formData.language}
                  onValueChange={(value) => setFormData({ ...formData, language: value })}
                >
                  <SelectTrigger data-testid="select-language">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="fa">Persian (فارسی)</SelectItem>
                    <SelectItem value="en">English</SelectItem>
                    <SelectItem value="ar">Arabic (العربية)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center space-x-2">
                <Switch
                  id="isPublished"
                  checked={formData.isPublished}
                  onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                  data-testid="switch-published"
                />
                <Label htmlFor="isPublished">Publish immediately</Label>
              </div>
            </div>
            <div className="flex justify-end gap-3">
              <Button
                variant="outline"
                onClick={() => setCreateDialogOpen(false)}
                data-testid="button-cancel-create"
              >
                Cancel
              </Button>
              <Button
                onClick={handleCreateLesson}
                disabled={!formData.title || createLessonMutation.isPending}
                data-testid="button-save-create"
              >
                {createLessonMutation.isPending ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Create Lesson
                  </>
                )}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Lessons</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-lessons">
              {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics.totalLessons}
            </div>
            <p className="text-xs text-muted-foreground">
              {analytics.publishedLessons} published
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-users">
              {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics.totalGuests}
            </div>
            <p className="text-xs text-muted-foreground">Guest sessions</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Feedback</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-total-feedback">
              {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics.totalFeedback}
            </div>
            <p className="text-xs text-muted-foreground">User ratings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-avg-rating">
              {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics.averageRating.toFixed(1)}
            </div>
            <p className="text-xs text-muted-foreground">Out of 5.0</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Draft Lessons</CardTitle>
            <Edit className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold" data-testid="text-draft-lessons">
              {analyticsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : analytics.draftLessons || 0}
            </div>
            <p className="text-xs text-muted-foreground">Unpublished</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={selectedTab} onValueChange={setSelectedTab} className="w-full">
        <TabsList>
          <TabsTrigger value="lessons">Lessons</TabsTrigger>
          <TabsTrigger value="feedback">Feedback</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
          <TabsTrigger value="audio">Audio Generation</TabsTrigger>
        </TabsList>

        {/* Lessons Tab */}
        <TabsContent value="lessons" className="space-y-4">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search lessons..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
                data-testid="input-search-lessons"
              />
            </div>
          </div>

          {lessonsLoading ? (
            <div className="flex justify-center items-center py-12">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : filteredLessons.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center text-muted-foreground">
                No lessons found
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-4">
              {filteredLessons.map((lesson: any) => (
                <Card key={lesson.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="flex items-center gap-3">
                          <CardTitle className="text-lg" data-testid={`text-lesson-title-${lesson.id}`}>
                            {lesson.title}
                          </CardTitle>
                          {lesson.isPublished ? (
                            <Badge variant="default" className="gap-1">
                              <CheckCircle className="h-3 w-3" />
                              Published
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Draft
                            </Badge>
                          )}
                        </div>
                        <div className="flex gap-2 mt-2">
                          <Badge variant="outline">{lesson.difficulty || 'beginner'}</Badge>
                          <Badge variant="outline">{lesson.lessonType || 'interactive'}</Badge>
                          <Badge variant="outline">{lesson.language || 'fa'}</Badge>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-view-${lesson.id}`}
                          onClick={() => window.open(`/linguaquest/lesson/${lesson.id}`, '_blank')}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-edit-${lesson.id}`}
                          onClick={() => handleEditLesson(lesson)}
                        >
                          <Edit className="h-4 w-4 mr-1" />
                          Edit
                        </Button>
                        <Button 
                          size="sm" 
                          variant={lesson.isPublished ? "default" : "secondary"}
                          data-testid={`button-publish-${lesson.id}`}
                          onClick={() => handleTogglePublish(lesson.id, lesson.isPublished)}
                          disabled={togglePublishMutation.isPending}
                        >
                          {lesson.isPublished ? (
                            <>
                              <XCircle className="h-4 w-4 mr-1" />
                              Unpublish
                            </>
                          ) : (
                            <>
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Publish
                            </>
                          )}
                        </Button>
                        <Button 
                          size="sm" 
                          variant="outline"
                          data-testid={`button-delete-${lesson.id}`}
                          onClick={() => handleDeleteLesson(lesson.id, lesson.title)}
                          disabled={deleteLessonMutation.isPending}
                        >
                          <Trash2 className="h-4 w-4 mr-1" />
                          Delete
                        </Button>
                      </div>
                    </div>
                    {lesson.description && (
                      <CardDescription className="mt-2">{lesson.description}</CardDescription>
                    )}
                  </CardHeader>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Feedback Tab */}
        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Feedback</CardTitle>
              <CardDescription>User ratings and comments from lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {feedbackLoading ? (
                <div className="flex justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin" />
                </div>
              ) : feedback.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No feedback received yet
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Lesson ID</TableHead>
                      <TableHead>Rating</TableHead>
                      <TableHead>Difficulty</TableHead>
                      <TableHead>Feedback</TableHead>
                      <TableHead>Score</TableHead>
                      <TableHead>Time</TableHead>
                      <TableHead>Date</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {feedback.slice(0, 50).map((fb: any) => (
                      <TableRow key={fb.id}>
                        <TableCell data-testid={`text-feedback-lesson-${fb.id}`}>#{fb.lessonId}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                            <span data-testid={`text-feedback-rating-${fb.id}`}>{fb.starRating}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={fb.difficultyRating === 'too_hard' ? 'destructive' : fb.difficultyRating === 'too_easy' ? 'secondary' : 'default'}
                            data-testid={`badge-difficulty-${fb.id}`}
                          >
                            {fb.difficultyRating || 'N/A'}
                          </Badge>
                        </TableCell>
                        <TableCell className="max-w-xs truncate" data-testid={`text-feedback-text-${fb.id}`}>
                          {fb.textFeedback || '-'}
                        </TableCell>
                        <TableCell data-testid={`text-feedback-score-${fb.id}`}>
                          {fb.scorePercentage ? `${fb.scorePercentage}%` : '-'}
                        </TableCell>
                        <TableCell data-testid={`text-feedback-time-${fb.id}`}>
                          {fb.completionTimeSeconds ? `${Math.round(fb.completionTimeSeconds / 60)}m` : '-'}
                        </TableCell>
                        <TableCell data-testid={`text-feedback-date-${fb.id}`}>
                          {new Date(fb.createdAt).toLocaleDateString()}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Analytics Tab */}
        <TabsContent value="analytics" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Difficulty Distribution</CardTitle>
                <CardDescription>Lessons by difficulty level</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.difficultyDistribution || {}).map(([difficulty, count]) => (
                      <div key={difficulty} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{difficulty}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" data-testid={`text-diff-count-${difficulty}`}>{count as number}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${((count as number) / analytics.totalLessons) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Lesson Type Distribution</CardTitle>
                <CardDescription>Lessons by type</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.lessonTypeDistribution || {}).map(([type, count]) => (
                      <div key={type} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{type}</Badge>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" data-testid={`text-type-count-${type}`}>{count as number}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-green-600 h-2 rounded-full" 
                              style={{ width: `${((count as number) / analytics.totalLessons) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>User Feedback - Difficulty</CardTitle>
                <CardDescription>How users rate lesson difficulty</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex justify-center py-8">
                    <Loader2 className="h-8 w-8 animate-spin" />
                  </div>
                ) : (
                  <div className="space-y-3">
                    {Object.entries(analytics.feedbackDifficultyDistribution || {}).map(([rating, count]) => (
                      <div key={rating} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {rating === 'too_hard' && <TrendingUp className="h-4 w-4 text-red-500" />}
                          {rating === 'too_easy' && <TrendingDown className="h-4 w-4 text-blue-500" />}
                          {rating === 'just_right' && <CheckCircle className="h-4 w-4 text-green-500" />}
                          <span className="text-sm capitalize">{rating.replace('_', ' ')}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-medium" data-testid={`text-feedback-diff-${rating}`}>{count as number}</span>
                          <div className="w-24 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-purple-600 h-2 rounded-full" 
                              style={{ width: `${((count as number) / analytics.totalFeedback) * 100}%` }}
                            ></div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Platform Stats</CardTitle>
                <CardDescription>Overall platform metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Lessons</span>
                    <span className="text-lg font-bold" data-testid="text-stats-total-lessons">{analytics.totalLessons}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Published Lessons</span>
                    <span className="text-lg font-bold text-green-600" data-testid="text-stats-published">{analytics.publishedLessons}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Draft Lessons</span>
                    <span className="text-lg font-bold text-yellow-600" data-testid="text-stats-drafts">{analytics.draftLessons}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Guest Users</span>
                    <span className="text-lg font-bold" data-testid="text-stats-guests">{analytics.totalGuests}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Total Feedback</span>
                    <span className="text-lg font-bold" data-testid="text-stats-feedback">{analytics.totalFeedback}</span>
                  </div>
                  <div className="flex justify-between items-center pt-4 border-t">
                    <span className="text-sm text-muted-foreground">Average Rating</span>
                    <div className="flex items-center gap-2">
                      <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
                      <span className="text-xl font-bold" data-testid="text-stats-avg-rating">{analytics.averageRating.toFixed(1)}</span>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Audio Generation Tab */}
        <TabsContent value="audio" className="space-y-4">
          {/* Audio Generation Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <FileAudio className="h-4 w-4" />
                  Content with Audio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-audio-with-audio">
                  {audioStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : audioStatsData?.stats?.withAudio || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  / {audioStatsData?.stats?.totalContent || 0} total items
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Volume2 className="h-4 w-4" />
                  Audio Assets
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-audio-assets">
                  {audioStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : audioStatsData?.stats?.audioAssets || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  {audioStatsData?.stats?.totalFileSizeMB || 0} MB total
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  Total Duration
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold" data-testid="text-audio-duration">
                  {audioStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : audioStatsData?.stats?.totalDurationMinutes || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">minutes of audio</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium flex items-center gap-2">
                  <TrendingDown className="h-4 w-4" />
                  Missing Audio
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-orange-600" data-testid="text-audio-missing">
                  {audioStatsLoading ? <Loader2 className="h-6 w-6 animate-spin" /> : audioStatsData?.stats?.withoutAudio || 0}
                </div>
                <p className="text-xs text-muted-foreground mt-1">items need generation</p>
              </CardContent>
            </Card>
          </div>

          {/* Batch Generation Controls */}
          <Card>
            <CardHeader>
              <CardTitle>Batch Audio Generation</CardTitle>
              <CardDescription>
                Generate TTS audio for content bank items. The system uses content hashing to avoid duplicate generation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-3">
                <Button
                  onClick={() => triggerAudioGenerationMutation.mutate({})}
                  disabled={triggerAudioGenerationMutation.isPending || (audioStatsData?.stats?.withoutAudio || 0) === 0}
                  data-testid="button-generate-missing"
                >
                  {triggerAudioGenerationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <PlayCircle className="h-4 w-4 mr-2" />
                      Generate Missing Audio
                    </>
                  )}
                </Button>
                <Button
                  variant="outline"
                  onClick={() => triggerAudioGenerationMutation.mutate({ regenerateAll: true })}
                  disabled={triggerAudioGenerationMutation.isPending}
                  data-testid="button-regenerate-all"
                >
                  {triggerAudioGenerationMutation.isPending ? (
                    <>
                      <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                      Starting...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Regenerate All
                    </>
                  )}
                </Button>
              </div>
              <div className="text-sm text-muted-foreground">
                <p>• Generate Missing: Only creates audio for items without audio hash</p>
                <p>• Regenerate All: Processes all active content items (uses cache when possible)</p>
                <p>• Jobs run in background - monitor progress below</p>
              </div>
            </CardContent>
          </Card>

          {/* Job List */}
          <Card>
            <CardHeader>
              <CardTitle>Generation Jobs</CardTitle>
              <CardDescription>
                Recent and active audio generation jobs
              </CardDescription>
            </CardHeader>
            <CardContent>
              {audioJobsLoading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : !audioJobsData?.jobs || audioJobsData.jobs.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No generation jobs yet. Click "Generate Missing Audio" to start.
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Job ID</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Progress</TableHead>
                      <TableHead>Generated</TableHead>
                      <TableHead>Cached</TableHead>
                      <TableHead>Failed</TableHead>
                      <TableHead>Duration</TableHead>
                      <TableHead>Created</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {audioJobsData.jobs.slice().reverse().map((job: any) => {
                      const progress = job.totalItems > 0 ? Math.round((job.processedItems / job.totalItems) * 100) : 0;
                      const duration = job.durationMs ? `${(job.durationMs / 1000).toFixed(1)}s` : '-';
                      
                      return (
                        <TableRow key={job.id} data-testid={`row-job-${job.id}`}>
                          <TableCell className="font-medium">#{job.id}</TableCell>
                          <TableCell>
                            <Badge 
                              variant={
                                job.status === 'completed' ? 'default' :
                                job.status === 'running' ? 'secondary' :
                                job.status === 'failed' ? 'destructive' :
                                'outline'
                              }
                              data-testid={`badge-status-${job.id}`}
                            >
                              {job.status === 'running' && <Loader2 className="h-3 w-3 mr-1 animate-spin" />}
                              {job.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <div className="flex-1 bg-secondary h-2 rounded-full overflow-hidden">
                                <div 
                                  className={`h-full transition-all ${
                                    job.status === 'completed' ? 'bg-green-500' :
                                    job.status === 'failed' ? 'bg-red-500' :
                                    'bg-blue-500'
                                  }`}
                                  style={{ width: `${progress}%` }}
                                />
                              </div>
                              <span className="text-sm text-muted-foreground min-w-[3rem]">
                                {progress}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <span className="text-green-600 font-medium">{job.generatedItems || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-blue-600 font-medium">{job.cachedItems || 0}</span>
                          </TableCell>
                          <TableCell>
                            <span className="text-red-600 font-medium">{job.failedItems || 0}</span>
                          </TableCell>
                          <TableCell className="text-muted-foreground">{duration}</TableCell>
                          <TableCell className="text-muted-foreground">
                            {new Date(job.createdAt).toLocaleTimeString()}
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Edit Lesson Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Lesson</DialogTitle>
            <DialogDescription>
              Modify lesson details and settings
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="edit-title">Title *</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Enter lesson title"
                data-testid="input-edit-lesson-title"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Enter lesson description"
                rows={3}
                data-testid="input-edit-lesson-description"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="edit-difficulty">Difficulty</Label>
                <Select
                  value={formData.difficulty}
                  onValueChange={(value) => setFormData({ ...formData, difficulty: value })}
                >
                  <SelectTrigger data-testid="select-edit-difficulty">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="elementary">Elementary</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="upper_intermediate">Upper Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-lessonType">Lesson Type</Label>
                <Select
                  value={formData.lessonType}
                  onValueChange={(value) => setFormData({ ...formData, lessonType: value })}
                >
                  <SelectTrigger data-testid="select-edit-lesson-type">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="interactive">Interactive</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="speaking">Speaking</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="edit-language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) => setFormData({ ...formData, language: value })}
              >
                <SelectTrigger data-testid="select-edit-language">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="fa">Persian (فارسی)</SelectItem>
                  <SelectItem value="en">English</SelectItem>
                  <SelectItem value="ar">Arabic (العربية)</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit-isPublished"
                checked={formData.isPublished}
                onCheckedChange={(checked) => setFormData({ ...formData, isPublished: checked })}
                data-testid="switch-edit-published"
              />
              <Label htmlFor="edit-isPublished">Published</Label>
            </div>
          </div>
          <div className="flex justify-end gap-3">
            <Button
              variant="outline"
              onClick={() => setEditDialogOpen(false)}
              data-testid="button-cancel-edit"
            >
              Cancel
            </Button>
            <Button
              onClick={handleUpdateLesson}
              disabled={!formData.title || updateLessonMutation.isPending}
              data-testid="button-save-edit"
            >
              {updateLessonMutation.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Updating...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Update Lesson
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
