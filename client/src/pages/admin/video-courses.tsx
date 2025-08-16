import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Video, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2,
  Play,
  Pause,
  Upload,
  FileVideo,
  Clock,
  Users,
  TrendingUp,
  BarChart,
  CheckCircle,
  XCircle,
  BookOpen,
  Globe,
  Shield
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";

// Schema for video lesson creation and editing
const videoLessonSchema = z.object({
  courseId: z.coerce.number().min(1, "Course is required"),
  teacherId: z.coerce.number().min(1, "Teacher is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL is required"),
  thumbnailUrl: z.string().optional(),
  duration: z.coerce.number().min(1, "Duration is required"),
  moduleId: z.coerce.number().optional(),
  orderIndex: z.coerce.number().min(0, "Order index must be non-negative"),
  language: z.string().min(1, "Language is required"),
  level: z.string().min(1, "Level is required"),
  skillFocus: z.string().optional(),
  transcriptUrl: z.string().optional(),
  subtitlesUrl: z.string().optional(),
  materialsUrl: z.string().optional(),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(true)
});

// Video Lesson Card Component
function VideoLessonCard({ lesson, onEdit, onDelete, onTogglePublish }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const [isPlaying, setIsPlaying] = useState(false);

  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardContent className="p-4">
        <div className="flex gap-4">
          {/* Thumbnail */}
          <div className="relative w-40 h-24 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
            {lesson.thumbnailUrl ? (
              <img 
                src={lesson.thumbnailUrl} 
                alt={lesson.title}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <FileVideo className="h-8 w-8 text-gray-400" />
              </div>
            )}
            <div className="absolute bottom-1 right-1 bg-black/70 text-white text-xs px-1 rounded">
              {formatDuration(lesson.duration)}
            </div>
            {lesson.isFree && (
              <div className="absolute top-1 left-1">
                <Badge variant="secondary" className="text-xs">
                  {t('admin:videoCourses.free')}
                </Badge>
              </div>
            )}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between mb-2">
              <div>
                <h3 className="font-semibold text-sm truncate">{lesson.title}</h3>
                <p className="text-xs text-muted-foreground truncate">
                  {lesson.course?.title} • {t(`common:levels.${lesson.level}`)}
                </p>
              </div>
              <Badge variant={lesson.isPublished ? "success" : "secondary"}>
                {lesson.isPublished ? t('admin:videoCourses.published') : t('admin:videoCourses.draft')}
              </Badge>
            </div>

            {lesson.description && (
              <p className="text-xs text-muted-foreground line-clamp-2 mb-2">
                {lesson.description}
              </p>
            )}

            {/* Stats */}
            <div className="flex items-center gap-4 text-xs text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {lesson.viewCount || 0}
              </span>
              <span className="flex items-center gap-1">
                <TrendingUp className="h-3 w-3" />
                {lesson.completionRate || 0}%
              </span>
              <span className="flex items-center gap-1">
                <Globe className="h-3 w-3" />
                {lesson.language}
              </span>
              {lesson.skillFocus && (
                <Badge variant="outline" className="text-xs">
                  {lesson.skillFocus}
                </Badge>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setIsPlaying(!isPlaying)}
              >
                {isPlaying ? <Pause className="h-3 w-3" /> : <Play className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onEdit(lesson)}
              >
                <Edit3 className="h-3 w-3" />
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onTogglePublish(lesson)}
              >
                {lesson.isPublished ? <XCircle className="h-3 w-3" /> : <CheckCircle className="h-3 w-3" />}
              </Button>
              <Button
                size="sm"
                variant="outline"
                onClick={() => onDelete(lesson)}
                className="text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Video Lesson Form Component
function VideoLessonForm({ lesson, courses, teachers, onSubmit, isLoading }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const form = useForm<z.infer<typeof videoLessonSchema>>({
    resolver: zodResolver(videoLessonSchema),
    defaultValues: lesson ? {
      courseId: lesson.courseId,
      teacherId: lesson.teacherId,
      title: lesson.title,
      description: lesson.description || '',
      videoUrl: lesson.videoUrl,
      thumbnailUrl: lesson.thumbnailUrl || '',
      duration: lesson.duration,
      moduleId: lesson.moduleId || undefined,
      orderIndex: lesson.orderIndex,
      language: lesson.language,
      level: lesson.level,
      skillFocus: lesson.skillFocus || '',
      transcriptUrl: lesson.transcriptUrl || '',
      subtitlesUrl: lesson.subtitlesUrl || '',
      materialsUrl: lesson.materialsUrl || '',
      isFree: lesson.isFree,
      isPublished: lesson.isPublished
    } : {
      courseId: 0,
      teacherId: 0,
      title: '',
      description: '',
      videoUrl: '',
      thumbnailUrl: '',
      duration: 0,
      orderIndex: 0,
      language: 'English',
      level: 'A1',
      skillFocus: '',
      transcriptUrl: '',
      subtitlesUrl: '',
      materialsUrl: '',
      isFree: false,
      isPublished: true
    }
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="courseId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.course')}</FormLabel>
                <Select 
                  value={field.value?.toString()} 
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:videoCourses.selectCourse')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {courses?.map((course: any) => (
                      <SelectItem key={course.id} value={course.id.toString()}>
                        {course.title}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="teacherId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.teacher')}</FormLabel>
                <Select 
                  value={field.value?.toString()} 
                  onValueChange={(value) => field.onChange(Number(value))}
                >
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:videoCourses.selectTeacher')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    {teachers?.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin:videoCourses.title')}</FormLabel>
              <FormControl>
                <Input {...field} placeholder={t('admin:videoCourses.enterTitle')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>{t('admin:videoCourses.description')}</FormLabel>
              <FormControl>
                <Textarea {...field} placeholder={t('admin:videoCourses.enterDescription')} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="videoUrl"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.videoUrl')}</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="/uploads/videos/..." />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.duration')} (seconds)</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="300" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-3 gap-4">
          <FormField
            control={form.control}
            name="language"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.language')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Farsi">فارسی</SelectItem>
                    <SelectItem value="Arabic">العربية</SelectItem>
                    <SelectItem value="French">Français</SelectItem>
                    <SelectItem value="Spanish">Español</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="level"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.level')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="A1">A1 - Beginner</SelectItem>
                    <SelectItem value="A2">A2 - Elementary</SelectItem>
                    <SelectItem value="B1">B1 - Intermediate</SelectItem>
                    <SelectItem value="B2">B2 - Upper Intermediate</SelectItem>
                    <SelectItem value="C1">C1 - Advanced</SelectItem>
                    <SelectItem value="C2">C2 - Proficient</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="skillFocus"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.skillFocus')}</FormLabel>
                <Select value={field.value} onValueChange={field.onChange}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder={t('admin:videoCourses.selectSkill')} />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="speaking">Speaking</SelectItem>
                    <SelectItem value="listening">Listening</SelectItem>
                    <SelectItem value="grammar">Grammar</SelectItem>
                    <SelectItem value="vocabulary">Vocabulary</SelectItem>
                    <SelectItem value="reading">Reading</SelectItem>
                    <SelectItem value="writing">Writing</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="orderIndex"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.orderIndex')}</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="0" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="moduleId"
            render={({ field }) => (
              <FormItem>
                <FormLabel>{t('admin:videoCourses.moduleId')}</FormLabel>
                <FormControl>
                  <Input {...field} type="number" placeholder="Optional" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <div className="flex items-center gap-4">
          <FormField
            control={form.control}
            name="isFree"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{t('admin:videoCourses.freeAccess')}</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="isPublished"
            render={({ field }) => (
              <FormItem className="flex items-center gap-2">
                <FormControl>
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                  />
                </FormControl>
                <FormLabel>{t('admin:videoCourses.published')}</FormLabel>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <Button type="submit" className="w-full" disabled={isLoading}>
          {isLoading ? t('common:saving') : (lesson ? t('common:update') : t('common:create'))}
        </Button>
      </form>
    </Form>
  );
}

export default function AdminVideoCourses() {
  const { t } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCourse, setFilterCourse] = useState("all");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedLesson, setSelectedLesson] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch video lessons
  const { data: videoLessons = [], isLoading: lessonsLoading } = useQuery({
    queryKey: ['/api/admin/video-lessons', filterCourse, filterLevel, filterStatus],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filterCourse) params.append('courseId', filterCourse);
      if (filterLevel) params.append('level', filterLevel);
      if (filterStatus) params.append('isPublished', filterStatus);
      
      const response = await apiRequest(`/api/admin/video-lessons?${params.toString()}`);
      return response as any[];
    }
  });

  // Fetch courses for dropdown
  const { data: courses = [] } = useQuery({
    queryKey: ['/api/admin/courses'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/courses');
      return response as any[];
    }
  });

  // Fetch teachers for dropdown
  const { data: teachers = [] } = useQuery({
    queryKey: ['/api/users', 'teachers'],
    queryFn: async () => {
      const response = await apiRequest('/api/users?role=Teacher');
      return response as any[];
    }
  });

  // Fetch statistics
  const { data: stats } = useQuery({
    queryKey: ['/api/admin/video-lessons/stats'],
    queryFn: async () => {
      const response = await apiRequest('/api/admin/video-lessons/stats');
      return response as any;
    }
  });

  // Create video lesson mutation
  const createLessonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof videoLessonSchema>) => {
      return await apiRequest('/api/admin/video-lessons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:videoCourses.lessonCreated') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons/stats'] });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:videoCourses.failedToCreateLesson'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Update video lesson mutation
  const updateLessonMutation = useMutation({
    mutationFn: async ({ id, data }: { id: number; data: z.infer<typeof videoLessonSchema> }) => {
      return await apiRequest(`/api/admin/video-lessons/${id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:videoCourses.lessonUpdated') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons'] });
      setIsEditDialogOpen(false);
      setSelectedLesson(null);
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:videoCourses.failedToUpdateLesson'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Delete video lesson mutation
  const deleteLessonMutation = useMutation({
    mutationFn: async (id: number) => {
      return await apiRequest(`/api/admin/video-lessons/${id}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:videoCourses.lessonDeleted') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons/stats'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:videoCourses.failedToDeleteLesson'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Toggle publish status mutation
  const togglePublishMutation = useMutation({
    mutationFn: async (lesson: any) => {
      return await apiRequest(`/api/admin/video-lessons/${lesson.id}/publish`, {
        method: 'PATCH',
        body: JSON.stringify({ isPublished: !lesson.isPublished })
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:videoCourses.statusUpdated') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-lessons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:videoCourses.failedToUpdateStatus'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter lessons
  const filteredLessons = videoLessons.filter(lesson => {
    const matchesSearch = !searchTerm || 
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    return matchesSearch;
  });

  const handleEdit = (lesson: any) => {
    setSelectedLesson(lesson);
    setIsEditDialogOpen(true);
  };

  const handleDelete = (lesson: any) => {
    if (confirm(t('admin:videoCourses.confirmDelete'))) {
      deleteLessonMutation.mutate(lesson.id);
    }
  };

  const handleTogglePublish = (lesson: any) => {
    togglePublishMutation.mutate(lesson);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:videoCourses.title')}</h1>
          <p className="text-muted-foreground">{t('admin:videoCourses.description')}</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              {t('admin:videoCourses.addLesson')}
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{t('admin:videoCourses.createLesson')}</DialogTitle>
              <DialogDescription>{t('admin:videoCourses.createLessonDesc')}</DialogDescription>
            </DialogHeader>
            <VideoLessonForm
              courses={courses}
              teachers={teachers}
              onSubmit={(data: any) => createLessonMutation.mutate(data)}
              isLoading={createLessonMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:videoCourses.totalLessons')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalLessons || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:videoCourses.totalViews')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalViews || 0}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:videoCourses.avgCompletion')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.avgCompletionRate || 0}%</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:videoCourses.publishedLessons')}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.publishedLessons || 0}</div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle>{t('admin:videoCourses.filters')}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4">
            <div className="flex-1">
              <Input
                placeholder={t('admin:videoCourses.searchPlaceholder')}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </div>
            <Select value={filterCourse} onValueChange={setFilterCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue placeholder={t('admin:videoCourses.allCourses')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Courses</SelectItem>
                {courses.map((course: any) => (
                  <SelectItem key={course.id} value={course.id.toString()}>
                    {course.title}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('admin:videoCourses.allLevels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Levels</SelectItem>
                <SelectItem value="A1">A1</SelectItem>
                <SelectItem value="A2">A2</SelectItem>
                <SelectItem value="B1">B1</SelectItem>
                <SelectItem value="B2">B2</SelectItem>
                <SelectItem value="C1">C1</SelectItem>
                <SelectItem value="C2">C2</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder={t('admin:videoCourses.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="true">Published</SelectItem>
                <SelectItem value="false">Draft</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Video Lessons List */}
      <div className="space-y-4">
        {lessonsLoading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          </div>
        ) : filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="text-center py-8">
              <FileVideo className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-muted-foreground">{t('admin:videoCourses.noLessons')}</p>
            </CardContent>
          </Card>
        ) : (
          <ScrollArea className="h-[600px]">
            <div className="space-y-4 pr-4">
              {filteredLessons.map((lesson: any) => (
                <VideoLessonCard
                  key={lesson.id}
                  lesson={lesson}
                  onEdit={handleEdit}
                  onDelete={handleDelete}
                  onTogglePublish={handleTogglePublish}
                />
              ))}
            </div>
          </ScrollArea>
        )}
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin:videoCourses.editLesson')}</DialogTitle>
            <DialogDescription>{t('admin:videoCourses.editLessonDesc')}</DialogDescription>
          </DialogHeader>
          {selectedLesson && (
            <VideoLessonForm
              lesson={selectedLesson}
              courses={courses}
              teachers={teachers}
              onSubmit={(data: any) => updateLessonMutation.mutate({ id: selectedLesson.id, data })}
              isLoading={updateLessonMutation.isPending}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}