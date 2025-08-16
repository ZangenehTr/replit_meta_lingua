import { useState, useRef, useMemo } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
  Shield,
  ChevronRight,
  ChevronDown,
  List,
  Grid,
  GripVertical,
  MoreVertical,
  Settings,
  Copy,
  Archive,
  RefreshCw
} from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

// Schema for video course creation
const videoCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  instructorId: z.coerce.number().min(1, "Instructor is required"),
  language: z.string().min(1, "Language is required"),
  level: z.string().min(1, "Level is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  thumbnailUrl: z.string().optional(),
  tags: z.string().optional(),
  prerequisites: z.string().optional(),
  learningObjectives: z.string().optional(),
  accessPeriodMonths: z.coerce.number().optional(),
  isPublished: z.boolean().default(false)
});

// Schema for video lesson within a course
const videoLessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  videoUrl: z.string().min(1, "Video URL is required"),
  duration: z.coerce.number().min(0, "Duration must be non-negative"),
  orderIndex: z.coerce.number().min(0, "Order must be non-negative"),
  isFree: z.boolean().default(false)
});

// Course Card Component with Expandable Lessons
function VideoCourseCard({ course, onEdit, onDelete, onTogglePublish, onManageLessons }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const [isExpanded, setIsExpanded] = useState(false);
  
  // Simulate lessons data - in real app, this would come from API
  const lessons = course.lessons || [];
  const totalDuration = lessons.reduce((sum: number, lesson: any) => sum + (lesson.duration || 0), 0);
  
  const formatDuration = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    if (hours > 0) {
      return t('admin:videoCourses.hoursMinutes', { hours, minutes });
    }
    return t('admin:videoCourses.minutes', { minutes });
  };

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              {course.title}
              <Badge variant={course.isPublished ? "default" : "secondary"}>
                {course.isPublished ? t('admin:videoCourses.published') : t('admin:videoCourses.draft')}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {course.description}
            </CardDescription>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="icon">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>{t('common:actions')}</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onManageLessons(course)}>
                <List className="mr-2 h-4 w-4" />
                {t('admin:videoCourses.manageLessons')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(course)}>
                <Edit3 className="mr-2 h-4 w-4" />
                {t('common:edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePublish(course)}>
                {course.isPublished ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    {t('admin:videoCourses.unpublish')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('admin:videoCourses.publish')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(course)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common:delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Course Metadata */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            <span>{course.instructor?.name || t('admin:videoCourses.noInstructor')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>{course.language}</span>
          </div>
          <div className="flex items-center gap-1">
            <BookOpen className="h-4 w-4" />
            <span>{lessons.length} {t('admin:videoCourses.lessons')}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{formatDuration(totalDuration)}</span>
          </div>
        </div>
      </CardHeader>

      {/* Expandable Lessons Section */}
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        <CollapsibleTrigger asChild>
          <Button 
            variant="ghost" 
            className="w-full rounded-none border-t justify-between px-6 py-3 hover:bg-muted/50"
          >
            <span className="text-sm font-medium">
              {isExpanded ? t('admin:videoCourses.hideLessons') : t('admin:videoCourses.showLessons')}
            </span>
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <CardContent className="pt-0">
            {lessons.length > 0 ? (
              <div className="space-y-2 mt-3">
                {lessons.map((lesson: any, index: number) => (
                  <div 
                    key={lesson.id} 
                    className="flex items-center gap-3 p-2 rounded-lg hover:bg-muted/50"
                  >
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <GripVertical className="h-4 w-4" />
                      <span className="text-sm font-medium w-6">{index + 1}</span>
                    </div>
                    <FileVideo className="h-4 w-4 text-muted-foreground" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{lesson.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {Math.floor(lesson.duration / 60)} min
                        {lesson.isFree && (
                          <Badge variant="outline" className="ml-2 text-xs">
                            {t('admin:videoCourses.freePreview')}
                          </Badge>
                        )}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <FileVideo className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">{t('admin:videoCourses.noLessonsYet')}</p>
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="mt-2"
                  onClick={() => onManageLessons(course)}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('admin:videoCourses.addFirstLesson')}
                </Button>
              </div>
            )}
          </CardContent>
        </CollapsibleContent>
      </Collapsible>
    </Card>
  );
}

// Lesson Management Dialog
function LessonManagementDialog({ course, open, onClose }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const queryClient = useQueryClient();
  const [isAddingLesson, setIsAddingLesson] = useState(false);
  const [editingLesson, setEditingLesson] = useState<any>(null);
  
  const form = useForm({
    resolver: zodResolver(videoLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      videoUrl: "",
      duration: 0,
      orderIndex: 0,
      isFree: false
    }
  });

  // Fetch lessons for this course
  const { data: lessons = [], refetch: refetchLessons } = useQuery({
    queryKey: [`/api/admin/courses/${course?.id}/lessons`],
    queryFn: async () => {
      if (!course?.id) return [];
      try {
        const response = await apiRequest(`/api/admin/courses/${course.id}/lessons`);
        return response;
      } catch (error) {
        // If endpoint doesn't exist yet, return empty array
        return [];
      }
    },
    enabled: !!course?.id
  });

  // Mutation for adding a lesson
  const addLessonMutation = useMutation({
    mutationFn: async (data: any) => {
      // Get current user for teacher ID
      const userResponse = await apiRequest('/api/users/me');
      const teacherId = userResponse.id || 35; // Default to teacher ID 35 if not found
      
      return apiRequest('/api/admin/video-lessons', {
        method: 'POST',
        body: JSON.stringify({
          ...data,
          courseId: course.id,
          teacherId,
          language: course.language || 'fa',
          level: course.level || 'intermediate',
          viewCount: 0,
          completionRate: 0
        }),
      });
    },
    onSuccess: () => {
      toast({
        title: t('admin:videoCourses.lessonAdded'),
        description: t('admin:videoCourses.lessonAddedDesc')
      });
      form.reset();
      setIsAddingLesson(false);
      // Refresh both courses and lessons
      refetchLessons();
      // Invalidate all video courses queries (including those with query params)
      queryClient.invalidateQueries({ 
        predicate: (query) => {
          const key = query.queryKey[0] as string;
          return key && key.includes('/api/admin/video-courses');
        }
      });
      queryClient.invalidateQueries({ queryKey: [`/api/admin/courses/${course.id}/lessons`] });
      queryClient.invalidateQueries({ queryKey: ['/api/courses'] });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:videoCourses.lessonAddFailed'),
        variant: "destructive"
      });
    }
  });

  const handleAddLesson = (data: any) => {
    addLessonMutation.mutate(data);
  };

  const handleDeleteLesson = (lessonId: number) => {
    // In real app, this would be an API call
    console.log("Deleting lesson:", lessonId);
    toast({
      title: t('admin:videoCourses.lessonDeleted'),
      description: t('admin:videoCourses.lessonDeletedDesc')
    });
    queryClient.invalidateQueries({ queryKey: ['/api/admin/video-courses'] });
  };

  const handleReorderLesson = (lessonId: number, newIndex: number) => {
    // In real app, this would be an API call to update order
    console.log("Reordering lesson:", lessonId, "to index:", newIndex);
  };

  if (!course) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader>
          <DialogTitle>{t('admin:videoCourses.manageLessonsFor', { title: course.title })}</DialogTitle>
          <DialogDescription>
            {t('admin:videoCourses.manageLessonsDesc')}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden">
          <ScrollArea className="h-[500px] pr-4">
            {/* Add Lesson Form */}
            {isAddingLesson && (
              <Card className="mb-4">
                <CardHeader>
                  <CardTitle className="text-base">{t('admin:videoCourses.addNewLesson')}</CardTitle>
                </CardHeader>
                <CardContent>
                  <Form {...form}>
                    <form onSubmit={form.handleSubmit(handleAddLesson)} className="space-y-4">
                      <FormField
                        control={form.control}
                        name="title"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin:videoCourses.lessonTitle')}</FormLabel>
                            <FormControl>
                              <Input {...field} placeholder={t('admin:videoCourses.enterLessonTitle')} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="videoUrl"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>{t('admin:videoCourses.videoUrl')}</FormLabel>
                            <FormControl>
                              <div className="space-y-2">
                                <Input 
                                  {...field} 
                                  placeholder="/uploads/videos/lesson.mp4 or https://..." 
                                  onChange={(e) => {
                                    field.onChange(e);
                                    // If it's a video URL, try to calculate duration
                                    if (e.target.value && (e.target.value.includes('.mp4') || e.target.value.includes('.webm'))) {
                                      const video = document.createElement('video');
                                      video.src = e.target.value;
                                      video.onloadedmetadata = () => {
                                        form.setValue('duration', Math.floor(video.duration));
                                        toast({
                                          title: t('admin:videoCourses.durationDetected'),
                                          description: `${Math.floor(video.duration / 60)} ${t('admin:videoCourses.minutes')} ${Math.floor(video.duration % 60)} ${t('admin:videoCourses.seconds')}`
                                        });
                                      };
                                      video.onerror = () => {
                                        console.log("Could not load video to detect duration");
                                      };
                                    }
                                  }}
                                />
                                <div className="text-xs text-muted-foreground">
                                  {t('admin:videoCourses.videoUrlHelp', 'Enter video path or URL. Duration will be detected automatically.')}
                                </div>
                              </div>
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="duration"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>
                                {t('admin:videoCourses.duration')} 
                                <span className="text-xs text-muted-foreground ml-1">
                                  ({t('admin:videoCourses.inSeconds', 'in seconds')})
                                </span>
                              </FormLabel>
                              <FormControl>
                                <div className="space-y-1">
                                  <Input 
                                    {...field} 
                                    type="number" 
                                    placeholder="60" 
                                  />
                                  {field.value > 0 && (
                                    <div className="text-xs text-muted-foreground">
                                      {Math.floor(field.value / 60)} {t('admin:videoCourses.minutes')} {field.value % 60} {t('admin:videoCourses.seconds')}
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="orderIndex"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>{t('admin:videoCourses.lessonOrder')}</FormLabel>
                              <FormControl>
                                <Input {...field} type="number" placeholder="1" />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

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

                      <FormField
                        control={form.control}
                        name="isFree"
                        render={({ field }) => (
                          <FormItem className="flex items-center justify-between rounded-lg border p-3">
                            <div className="space-y-0.5">
                              <FormLabel>{t('admin:videoCourses.freePreview')}</FormLabel>
                              <div className="text-sm text-muted-foreground">
                                {t('admin:videoCourses.freePreviewDesc')}
                              </div>
                            </div>
                            <FormControl>
                              <Switch
                                checked={field.value}
                                onCheckedChange={field.onChange}
                              />
                            </FormControl>
                          </FormItem>
                        )}
                      />

                      <div className="flex gap-2">
                        <Button type="submit">
                          <Plus className="h-4 w-4 mr-1" />
                          {t('admin:videoCourses.addLesson')}
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline"
                          onClick={() => {
                            setIsAddingLesson(false);
                            form.reset();
                          }}
                        >
                          {t('common:cancel')}
                        </Button>
                      </div>
                    </form>
                  </Form>
                </CardContent>
              </Card>
            )}

            {/* Lessons List */}
            <div className="space-y-2">
              {!isAddingLesson && (
                <Button 
                  onClick={() => setIsAddingLesson(true)}
                  className="w-full mb-4"
                  variant="outline"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  {t('admin:videoCourses.addNewLesson')}
                </Button>
              )}

              {lessons.length > 0 ? (
                lessons.map((lesson: any, index: number) => (
                  <Card key={lesson.id} className="p-4">
                    <div className="flex items-center gap-3">
                      <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                      <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm font-semibold">
                        {index + 1}
                      </div>
                      <FileVideo className="h-5 w-5 text-muted-foreground" />
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h4 className="font-medium">{lesson.title}</h4>
                          {lesson.isFree && (
                            <Badge variant="outline" className="text-xs">
                              {t('admin:videoCourses.freePreview')}
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {Math.floor(lesson.duration / 60)} {t('admin:videoCourses.minutes')}
                          {lesson.description && ` • ${lesson.description}`}
                        </p>
                      </div>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => setEditingLesson(lesson)}>
                            <Edit3 className="mr-2 h-4 w-4" />
                            {t('common:edit')}
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => {}}>
                            <Copy className="mr-2 h-4 w-4" />
                            {t('admin:videoCourses.duplicate')}
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem 
                            onClick={() => handleDeleteLesson(lesson.id)}
                            className="text-destructive"
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            {t('common:delete')}
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </Card>
                ))
              ) : (
                !isAddingLesson && (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileVideo className="h-12 w-12 mx-auto mb-3 opacity-50" />
                    <p className="text-sm mb-1">{t('admin:videoCourses.noLessonsInCourse')}</p>
                    <p className="text-xs">{t('admin:videoCourses.addLessonsToGetStarted')}</p>
                  </div>
                )
              )}
            </div>
          </ScrollArea>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            {t('common:close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// Main Component
export default function AdminVideoCourses() {
  const { t } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [selectedCourse, setSelectedCourse] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isLessonDialogOpen, setIsLessonDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<any>(null);

  // Form for course creation/editing
  const courseForm = useForm({
    resolver: zodResolver(videoCourseSchema),
    defaultValues: {
      title: "",
      description: "",
      instructorId: user?.role === 'Teacher/Tutor' ? user?.id : 0,
      language: "fa",
      level: "beginner",
      category: "language",
      price: 0,
      thumbnailUrl: "",
      tags: "",
      prerequisites: "",
      learningObjectives: "",
      accessPeriodMonths: 12,
      isPublished: false
    }
  });

  // Fetch instructors first
  const { data: instructors = [] } = useQuery({
    queryKey: ['/api/teachers/list']
  });

  // Build query string for courses
  const queryParams = useMemo(() => {
    const params = new URLSearchParams();
    if (searchTerm) params.append('search', searchTerm);
    if (filterLevel !== 'all') params.append('level', filterLevel);
    return params.toString();
  }, [searchTerm, filterLevel]);
  
  // Fetch courses - includes lessons from the API
  const queryUrl = queryParams ? `/api/admin/video-courses?${queryParams}` : '/api/admin/video-courses';
  const { data: coursesData = [], isLoading: coursesLoading } = useQuery({
    queryKey: [queryUrl]
  });
  
  // Map instructor data to courses
  const courses = useMemo(() => {
    return coursesData.map((course: any) => ({
      ...course,
      instructor: instructors?.find((i: any) => i.id === course.instructorId) || null
    }));
  }, [coursesData, instructors]);

  // Create course mutation
  const createCourseMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('/api/admin/video-courses', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: t('admin:videoCourses.courseCreated'),
        description: t('admin:videoCourses.courseCreatedDesc')
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/video-courses'] });
      setIsCreateDialogOpen(false);
      courseForm.reset();
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('admin:videoCourses.failedToCreateCourse'),
        variant: "destructive"
      });
    }
  });

  // Statistics
  const totalCourses = courses.length;
  const publishedCourses = courses.filter((c: any) => c.isPublished).length;
  const totalLessons = courses.reduce((sum: number, c: any) => sum + (c.lessons?.length || 0), 0);

  const handleCreateCourse = (data: any) => {
    // For teachers, always use their own ID as instructor
    const courseData = user?.role === 'Teacher/Tutor' 
      ? { ...data, instructorId: user.id }
      : data;
    createCourseMutation.mutate(courseData);
  };

  const handleEditCourse = (course: any) => {
    setEditingCourse(course);
    courseForm.reset({
      title: course.title,
      description: course.description,
      instructorId: course.instructor?.id || 0,
      language: course.language,
      level: course.level,
      category: course.category,
      price: course.price,
      isPublished: course.isPublished
    });
    setIsEditDialogOpen(true);
  };

  const handleManageLessons = (course: any) => {
    setSelectedCourse(course);
    setIsLessonDialogOpen(true);
  };

  const filteredCourses = courses.filter((course: any) => {
    if (searchTerm && !course.title.toLowerCase().includes(searchTerm.toLowerCase())) {
      return false;
    }
    if (filterLevel !== "all" && course.level !== filterLevel) {
      return false;
    }
    if (filterStatus === "published" && !course.isPublished) {
      return false;
    }
    if (filterStatus === "draft" && course.isPublished) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold">{t('admin:videoCourses.title')}</h1>
          <p className="text-muted-foreground">{t('admin:videoCourses.description')}</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          {t('admin:videoCourses.createCourse')}
        </Button>
      </div>

      {/* Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin:videoCourses.totalCourses')}</p>
                <p className="text-2xl font-bold">{totalCourses}</p>
              </div>
              <BookOpen className="h-8 w-8 text-primary opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin:videoCourses.publishedCourses')}</p>
                <p className="text-2xl font-bold">{publishedCourses}</p>
              </div>
              <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">{t('admin:videoCourses.totalLessons')}</p>
                <p className="text-2xl font-bold">{totalLessons}</p>
              </div>
              <Video className="h-8 w-8 text-blue-500 opacity-50" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin:videoCourses.searchCourses')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <Select value={filterLevel} onValueChange={setFilterLevel}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin:videoCourses.allLevels')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:videoCourses.allLevels')}</SelectItem>
                <SelectItem value="beginner">{t('common:levels.beginner')}</SelectItem>
                <SelectItem value="intermediate">{t('common:levels.intermediate')}</SelectItem>
                <SelectItem value="advanced">{t('common:levels.advanced')}</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder={t('admin:videoCourses.allStatus')} />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">{t('admin:videoCourses.allStatus')}</SelectItem>
                <SelectItem value="published">{t('admin:videoCourses.published')}</SelectItem>
                <SelectItem value="draft">{t('admin:videoCourses.draft')}</SelectItem>
              </SelectContent>
            </Select>
            <div className="flex gap-2">
              <Button
                variant={viewMode === "grid" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("grid")}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "outline"}
                size="icon"
                onClick={() => setViewMode("list")}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Courses Grid/List */}
      {coursesLoading ? (
        <div className="text-center py-12">
          <RefreshCw className="h-8 w-8 animate-spin mx-auto mb-2" />
          <p className="text-muted-foreground">{t('common:loading')}</p>
        </div>
      ) : filteredCourses.length > 0 ? (
        <div className={cn(
          "grid gap-4",
          viewMode === "grid" ? "grid-cols-1 lg:grid-cols-2" : "grid-cols-1"
        )}>
          {filteredCourses.map((course: any) => (
            <VideoCourseCard
              key={course.id}
              course={course}
              onEdit={handleEditCourse}
              onDelete={(course: any) => {
                // Handle delete
                console.log("Delete course:", course.id);
              }}
              onTogglePublish={(course: any) => {
                // Handle publish/unpublish
                console.log("Toggle publish:", course.id);
              }}
              onManageLessons={handleManageLessons}
            />
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="text-center py-12">
            <FileVideo className="h-12 w-12 mx-auto mb-3 text-muted-foreground opacity-50" />
            <p className="text-lg font-medium mb-1">{t('admin:videoCourses.noCourses')}</p>
            <p className="text-sm text-muted-foreground mb-4">
              {t('admin:videoCourses.noCoursesDesc')}
            </p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="h-4 w-4 mr-2" />
              {t('admin:videoCourses.createFirstCourse')}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Course Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{t('admin:videoCourses.createNewCourse')}</DialogTitle>
            <DialogDescription>
              {t('admin:videoCourses.createCourseDesc')}
            </DialogDescription>
          </DialogHeader>
          <Form {...courseForm}>
            <form onSubmit={courseForm.handleSubmit(handleCreateCourse)} className="space-y-4">
              <FormField
                control={courseForm.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:videoCourses.courseTitle')}</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder={t('admin:videoCourses.enterCourseTitle')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseForm.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:videoCourses.courseDescription')}</FormLabel>
                    <FormControl>
                      <Textarea {...field} placeholder={t('admin:videoCourses.enterCourseDescription')} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="instructorId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:videoCourses.instructor')}</FormLabel>
                      {user?.role === 'Teacher/Tutor' ? (
                        <FormControl>
                          <div className="flex items-center gap-2 px-3 py-2 border rounded-md bg-muted">
                            <span className="text-sm">
                              {user.firstName} {user.lastName}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              ({t('admin:videoCourses.autoAssigned', 'Auto-assigned')})
                            </span>
                          </div>
                        </FormControl>
                      ) : (
                        <Select onValueChange={field.onChange} value={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin:videoCourses.selectInstructor')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {instructors.map((instructor: any) => (
                              <SelectItem key={instructor.id} value={instructor.id.toString()}>
                                {instructor.firstName} {instructor.lastName}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      )}
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:videoCourses.language')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin:videoCourses.selectLanguage')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="fa">فارسی</SelectItem>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="ar">العربية</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={courseForm.control}
                  name="level"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:videoCourses.level')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin:videoCourses.selectLevel')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="beginner">{t('common:levels.beginner')}</SelectItem>
                          <SelectItem value="intermediate">{t('common:levels.intermediate')}</SelectItem>
                          <SelectItem value="advanced">{t('common:levels.advanced')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={courseForm.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:videoCourses.category')}</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin:videoCourses.selectCategory')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="language">{t('admin:videoCourses.categoryLanguage')}</SelectItem>
                          <SelectItem value="business">{t('admin:videoCourses.categoryBusiness')}</SelectItem>
                          <SelectItem value="exam">{t('admin:videoCourses.categoryExam')}</SelectItem>
                          <SelectItem value="conversation">{t('admin:videoCourses.categoryConversation')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={courseForm.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:videoCourses.price')} (IRR)</FormLabel>
                    <FormControl>
                      <Input {...field} type="number" placeholder="1500000" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={courseForm.control}
                name="isPublished"
                render={({ field }) => (
                  <FormItem className="flex items-center justify-between rounded-lg border p-3">
                    <div className="space-y-0.5">
                      <FormLabel>{t('admin:videoCourses.publishCourse')}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {t('admin:videoCourses.publishCourseDesc')}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                      />
                    </FormControl>
                  </FormItem>
                )}
              />

              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
                  {t('common:cancel')}
                </Button>
                <Button type="submit">
                  {t('admin:videoCourses.createCourse')}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Lesson Management Dialog */}
      <LessonManagementDialog
        course={selectedCourse}
        open={isLessonDialogOpen}
        onClose={() => {
          setIsLessonDialogOpen(false);
          setSelectedCourse(null);
        }}
      />
    </div>
  );
}