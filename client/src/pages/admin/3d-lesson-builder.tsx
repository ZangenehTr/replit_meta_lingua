import { useState, useEffect, useMemo } from "react";
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
  Box, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Trash2,
  Play,
  Pause,
  Upload,
  Layers,
  Palette,
  Zap,
  Settings,
  BookOpen,
  Globe,
  Shield,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Copy,
  Archive,
  RefreshCw,
  Users,
  TrendingUp,
  BarChart,
  CheckCircle,
  XCircle,
  Sparkles,
  Boxes,
  Target,
  Clock,
  Award
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
import { Three3DLesson } from "@/components/3d-lessons/Three3DLesson";

// Schema for 3D lesson creation
const threeDLessonSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  courseId: z.coerce.number().min(1, "Course is required"),
  language: z.string().min(1, "Language is required"),
  level: z.string().min(1, "Level is required"),
  skillFocus: z.string().optional(),
  vocabularyWords: z.string().optional(),
  grammarTopics: z.string().optional(),
  learningObjectives: z.string().optional(),
  estimatedDurationMinutes: z.coerce.number().min(5, "Duration must be at least 5 minutes"),
  xpReward: z.coerce.number().min(10, "XP reward must be at least 10"),
  passingScore: z.coerce.number().min(50, "Passing score must be at least 50"),
  templateType: z.string().min(1, "Template type is required"),
  orderIndex: z.coerce.number().min(0, "Order must be non-negative"),
  isFree: z.boolean().default(false),
  isPublished: z.boolean().default(false),
  videoUrl: z.string().url("Must be a valid video URL").optional(),
  threeDContent: z.object({
    sceneConfig: z.object({
      camera: z.object({
        position: z.array(z.number()).length(3)
      }),
      lighting: z.object({
        ambient: z.number().min(0).max(1)
      })
    }),
    models: z.array(z.any()).default([]),
    materials: z.array(z.any()).default([]),
    hotspots: z.array(z.any()).default([]),
    animations: z.array(z.any()).default([]),
    particleEffects: z.array(z.any()).default([])
  }).optional()
});

// 3D Lesson Template Library
const LESSON_TEMPLATES = [
  {
    id: 'vocabulary_scene',
    name: 'Vocabulary Scene',
    description: 'Interactive vocabulary learning with 3D objects',
    icon: Box,
    skillFocus: 'vocabulary',
    estimatedDuration: 15,
    defaultConfig: {
      sceneConfig: {
        camera: { position: [0, 5, 10] },
        lighting: { ambient: 0.4 }
      },
      models: [],
      hotspots: [],
      animations: []
    }
  },
  {
    id: 'grammar_world',
    name: 'Grammar World',
    description: 'Grammar concepts in 3D space',
    icon: BookOpen,
    skillFocus: 'grammar',
    estimatedDuration: 20,
    defaultConfig: {
      sceneConfig: {
        camera: { position: [0, 8, 12] },
        lighting: { ambient: 0.5 }
      },
      models: [],
      hotspots: [],
      animations: []
    }
  },
  {
    id: 'conversation_space',
    name: 'Conversation Space',
    description: 'Interactive conversation practice',
    icon: Users,
    skillFocus: 'speaking',
    estimatedDuration: 25,
    defaultConfig: {
      sceneConfig: {
        camera: { position: [0, 6, 8] },
        lighting: { ambient: 0.6 }
      },
      models: [],
      hotspots: [],
      animations: []
    }
  }
];

// 3D Lesson Card Component
function ThreeDLessonCard({ lesson, onEdit, onDelete, onTogglePublish, onPreview }: any) {
  const { t } = useTranslation(['admin', 'common']);
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg flex items-center gap-2">
              <Box className="h-5 w-5 text-blue-500" />
              {lesson.title}
              <Badge variant={lesson.isPublished ? "default" : "secondary"}>
                {lesson.isPublished ? t('admin:threeDLessons.published') : t('admin:threeDLessons.draft')}
              </Badge>
            </CardTitle>
            <CardDescription className="mt-1">
              {lesson.description}
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
              <DropdownMenuItem onClick={() => onPreview(lesson)}>
                <Eye className="mr-2 h-4 w-4" />
                {t('admin:threeDLessons.preview')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onEdit(lesson)}>
                <Edit3 className="mr-2 h-4 w-4" />
                {t('common:edit')}
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onTogglePublish(lesson)}>
                {lesson.isPublished ? (
                  <>
                    <Archive className="mr-2 h-4 w-4" />
                    {t('admin:threeDLessons.unpublish')}
                  </>
                ) : (
                  <>
                    <CheckCircle className="mr-2 h-4 w-4" />
                    {t('admin:threeDLessons.publish')}
                  </>
                )}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => onDelete(lesson)}
                className="text-destructive"
              >
                <Trash2 className="mr-2 h-4 w-4" />
                {t('common:delete')}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        {/* Lesson Metadata */}
        <div className="flex flex-wrap gap-4 mt-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-1">
            <Globe className="h-4 w-4" />
            <span>{lesson.language}</span>
          </div>
          <div className="flex items-center gap-1">
            <Target className="h-4 w-4" />
            <span>{lesson.level}</span>
          </div>
          <div className="flex items-center gap-1">
            <Clock className="h-4 w-4" />
            <span>{lesson.estimatedDurationMinutes}m</span>
          </div>
          <div className="flex items-center gap-1">
            <Award className="h-4 w-4" />
            <span>{lesson.xpReward} XP</span>
          </div>
        </div>

        {/* Template and Stats */}
        <div className="flex items-center justify-between mt-3 pt-3 border-t">
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="text-xs">
              {lesson.templateType?.replace('_', ' ').toUpperCase()}
            </Badge>
            <Badge variant="outline" className="text-xs">
              {lesson.skillFocus?.toUpperCase()}
            </Badge>
          </div>
          <div className="flex items-center gap-4 text-xs text-muted-foreground">
            <span>{lesson.viewCount || 0} views</span>
            <span>{lesson.completionRate || 0}% completion</span>
          </div>
        </div>
      </CardHeader>
    </Card>
  );
}

// Create 3D Lesson Dialog Component
function Create3DLessonDialog({ queryClient }: { queryClient: any }) {
  const { t } = useTranslation(['admin', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [currentStep, setCurrentStep] = useState(1);
  
  // Fetch available courses
  const { data: availableCourses = [] } = useQuery({
    queryKey: ['/api/admin/video-courses'],
    enabled: isOpen
  });

  const form = useForm<z.infer<typeof threeDLessonSchema>>({
    resolver: zodResolver(threeDLessonSchema),
    defaultValues: {
      title: "",
      description: "",
      courseId: 0,
      language: "English",
      level: "intermediate",
      skillFocus: "",
      vocabularyWords: "",
      grammarTopics: "",
      learningObjectives: "",
      estimatedDurationMinutes: 15,
      xpReward: 100,
      passingScore: 80,
      templateType: "",
      orderIndex: 0,
      isFree: false,
      isPublished: false,
      threeDContent: {
        sceneConfig: {
          camera: { position: [0, 5, 10] },
          lighting: { ambient: 0.4 }
        },
        models: [],
        materials: [],
        hotspots: [],
        animations: [],
        particleEffects: []
      }
    }
  });

  const create3DLessonMutation = useMutation({
    mutationFn: async (data: z.infer<typeof threeDLessonSchema>) => {
      return await apiRequest('/api/admin/3d-lessons', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:threeDLessons.createdSuccessfully') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/3d-lessons'] });
      setIsOpen(false);
      setCurrentStep(1);
      form.reset();
      setSelectedTemplate(null);
    },
    onError: (error: any) => {
      console.error('Error creating 3D lesson:', error);
      toast({ 
        title: t('admin:threeDLessons.failedToCreate'), 
        description: error.message || t('common:errors.unknownError'),
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: z.infer<typeof threeDLessonSchema>) => {
    // Parse comma-separated strings into arrays
    const processedData = {
      ...data,
      vocabularyWords: data.vocabularyWords ? data.vocabularyWords.split(',').map(w => w.trim()) : [],
      grammarTopics: data.grammarTopics ? data.grammarTopics.split(',').map(t => t.trim()) : [],
      learningObjectives: data.learningObjectives ? data.learningObjectives.split(',').map(o => o.trim()) : [],
      threeDContent: selectedTemplate?.defaultConfig || data.threeDContent
    };
    
    create3DLessonMutation.mutate(processedData);
  };

  const handleTemplateSelect = (template: any) => {
    setSelectedTemplate(template);
    form.setValue('templateType', template.id);
    form.setValue('skillFocus', template.skillFocus);
    form.setValue('estimatedDurationMinutes', template.estimatedDuration);
    setCurrentStep(2);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <Button 
        onClick={() => setIsOpen(true)}
        className="flex items-center gap-2"
        data-testid="button-create-3d-lesson"
      >
        <Plus className="h-4 w-4" />
        {t('admin:threeDLessons.create3DLesson')}
      </Button>
      
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin:threeDLessons.createNew3DLesson')}</DialogTitle>
          <DialogDescription>
            {t('admin:threeDLessons.create3DLessonDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Tabs value={`step${currentStep}`} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="step1">{t('admin:threeDLessons.selectTemplate')}</TabsTrigger>
            <TabsTrigger value="step2" disabled={!selectedTemplate}>{t('admin:threeDLessons.lessonDetails')}</TabsTrigger>
            <TabsTrigger value="step3" disabled={currentStep < 3}>{t('admin:threeDLessons.sceneConfig')}</TabsTrigger>
          </TabsList>
          
          <TabsContent value="step1" className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {LESSON_TEMPLATES.map((template) => {
                const IconComponent = template.icon;
                return (
                  <Card 
                    key={template.id}
                    className={cn(
                      "cursor-pointer transition-all hover:shadow-lg",
                      selectedTemplate?.id === template.id && "ring-2 ring-primary"
                    )}
                    onClick={() => handleTemplateSelect(template)}
                    data-testid={`template-${template.id}`}
                  >
                    <CardHeader className="text-center">
                      <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mb-2">
                        <IconComponent className="h-6 w-6 text-primary" />
                      </div>
                      <CardTitle className="text-lg">{template.name}</CardTitle>
                      <CardDescription>{template.description}</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between text-sm text-muted-foreground">
                        <span>{template.skillFocus}</span>
                        <span>{template.estimatedDuration}m</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </TabsContent>
          
          <TabsContent value="step2" className="space-y-4">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Basic Information */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.lessonTitle')}</FormLabel>
                        <FormControl>
                          <Input placeholder={t('admin:threeDLessons.lessonTitlePlaceholder')} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="courseId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.attachToCourse')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder={t('admin:threeDLessons.selectCourse')} />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {availableCourses.map((course: any) => (
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
                </div>

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:threeDLessons.description')}</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder={t('admin:threeDLessons.descriptionPlaceholder')} 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Learning Configuration */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="language"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.language')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="English">English</SelectItem>
                            <SelectItem value="Persian">Persian</SelectItem>
                            <SelectItem value="Arabic">Arabic</SelectItem>
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
                        <FormLabel>{t('admin:threeDLessons.level')}</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="beginner">A1 - Beginner</SelectItem>
                            <SelectItem value="elementary">A2 - Elementary</SelectItem>
                            <SelectItem value="intermediate">B1 - Intermediate</SelectItem>
                            <SelectItem value="upper_intermediate">B2 - Upper Intermediate</SelectItem>
                            <SelectItem value="advanced">C1 - Advanced</SelectItem>
                            <SelectItem value="proficient">C2 - Proficient</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="orderIndex"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.orderIndex')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="0" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Learning Content */}
                <div className="space-y-4">
                  <FormField
                    control={form.control}
                    name="vocabularyWords"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.vocabularyWords')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('admin:threeDLessons.vocabularyWordsPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="learningObjectives"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.learningObjectives')}</FormLabel>
                        <FormControl>
                          <Input 
                            placeholder={t('admin:threeDLessons.learningObjectivesPlaceholder')} 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Assessment Settings */}
                <div className="grid grid-cols-3 gap-4">
                  <FormField
                    control={form.control}
                    name="estimatedDurationMinutes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.estimatedDuration')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="5" max="60" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="xpReward"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.xpReward')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="10" max="500" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="passingScore"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>{t('admin:threeDLessons.passingScore')}</FormLabel>
                        <FormControl>
                          <Input type="number" min="50" max="100" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Publishing Options */}
                <div className="flex items-center space-x-4">
                  <FormField
                    control={form.control}
                    name="isFree"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>{t('admin:threeDLessons.makeFree')}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="isPublished"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center space-x-2 space-y-0">
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                        <FormLabel>{t('admin:threeDLessons.publishImmediately')}</FormLabel>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <DialogFooter>
                  <Button 
                    type="button" 
                    variant="outline" 
                    onClick={() => {
                      setCurrentStep(1);
                      setSelectedTemplate(null);
                    }}
                  >
                    {t('common:back')}
                  </Button>
                  <Button 
                    type="submit" 
                    disabled={create3DLessonMutation.isPending}
                    data-testid="button-create-lesson"
                  >
                    {create3DLessonMutation.isPending ? t('common:creating') : t('admin:threeDLessons.createLesson')}
                  </Button>
                </DialogFooter>
              </form>
            </Form>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

// Main 3D Lesson Builder Component
export default function ThreeDLessonBuilder() {
  const { t } = useTranslation(['admin', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState({
    courseId: "",
    language: "",
    level: "",
    templateType: "",
    isPublished: ""
  });
  const [previewLesson, setPreviewLesson] = useState<any>(null);

  // Fetch 3D lessons
  const { data: threeDLessons = [], isLoading } = useQuery({
    queryKey: ['/api/admin/3d-lessons', filters],
    queryFn: async () => {
      const params = new URLSearchParams();
      if (filters.courseId) params.append('courseId', filters.courseId);
      if (filters.language) params.append('language', filters.language);
      if (filters.level) params.append('level', filters.level);
      if (filters.templateType) params.append('templateType', filters.templateType);
      if (searchTerm) params.append('search', searchTerm);
      
      const response = await fetch(`/api/admin/3d-lessons?${params}`);
      if (!response.ok) throw new Error('Failed to fetch 3D lessons');
      return response.json();
    }
  });

  // Fetch available courses for filtering
  const { data: availableCourses = [] } = useQuery({
    queryKey: ['/api/admin/video-courses']
  });

  // Delete 3D lesson mutation
  const delete3DLessonMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return await apiRequest(`/api/admin/3d-lessons/${lessonId}`, {
        method: 'DELETE'
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:threeDLessons.deletedSuccessfully') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/3d-lessons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:threeDLessons.failedToDelete'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Toggle publish mutation
  const togglePublishMutation = useMutation({
    mutationFn: async ({ lessonId, isPublished }: { lessonId: number; isPublished: boolean }) => {
      return await apiRequest(`/api/admin/3d-lessons/${lessonId}/publish`, {
        method: 'POST',
        body: JSON.stringify({ isPublished })
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:threeDLessons.publishStatusUpdated') });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/3d-lessons'] });
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:threeDLessons.failedToUpdateStatus'), 
        description: error.message,
        variant: "destructive" 
      });
    }
  });

  // Filter lessons based on search term
  const filteredLessons = useMemo(() => {
    if (!searchTerm) return threeDLessons;
    
    return threeDLessons.filter((lesson: any) =>
      lesson.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      lesson.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [threeDLessons, searchTerm]);

  const handleEdit = (lesson: any) => {
    // TODO: Implement edit functionality
    console.log('Edit lesson:', lesson);
  };

  const handleDelete = (lesson: any) => {
    if (confirm(t('admin:threeDLessons.confirmDelete'))) {
      delete3DLessonMutation.mutate(lesson.id);
    }
  };

  const handleTogglePublish = (lesson: any) => {
    togglePublishMutation.mutate({ 
      lessonId: lesson.id, 
      isPublished: !lesson.isPublished 
    });
  };

  const handlePreview = (lesson: any) => {
    setPreviewLesson(lesson);
  };

  if (user?.role !== 'Admin' && user?.role !== 'Teacher/Tutor') {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <Shield className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-lg font-semibold">{t('common:accessDenied')}</h3>
          <p className="text-muted-foreground">{t('admin:threeDLessons.adminAccessRequired')}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-3">
            <Cube className="h-8 w-8 text-blue-500" />
            {t('admin:threeDLessons.threeDLessonBuilder')}
          </h1>
          <p className="text-muted-foreground mt-2">
            {t('admin:threeDLessons.builderDescription')}
          </p>
        </div>
        <Create3DLessonDialog queryClient={queryClient} />
      </div>

      {/* Filters and Search */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('admin:threeDLessons.filtersAndSearch')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
            <div className="lg:col-span-2">
              <Label>{t('common:search')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder={t('admin:threeDLessons.searchPlaceholder')}
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                  data-testid="input-search-lessons"
                />
              </div>
            </div>
            
            <div>
              <Label>{t('admin:threeDLessons.course')}</Label>
              <Select value={filters.courseId} onValueChange={(value) => setFilters(prev => ({ ...prev, courseId: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:threeDLessons.allCourses')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin:threeDLessons.allCourses')}</SelectItem>
                  {availableCourses.map((course: any) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('admin:threeDLessons.language')}</Label>
              <Select value={filters.language} onValueChange={(value) => setFilters(prev => ({ ...prev, language: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:threeDLessons.allLanguages')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin:threeDLessons.allLanguages')}</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Persian">Persian</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('admin:threeDLessons.level')}</Label>
              <Select value={filters.level} onValueChange={(value) => setFilters(prev => ({ ...prev, level: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:threeDLessons.allLevels')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin:threeDLessons.allLevels')}</SelectItem>
                  <SelectItem value="beginner">A1 - Beginner</SelectItem>
                  <SelectItem value="elementary">A2 - Elementary</SelectItem>
                  <SelectItem value="intermediate">B1 - Intermediate</SelectItem>
                  <SelectItem value="upper_intermediate">B2 - Upper Intermediate</SelectItem>
                  <SelectItem value="advanced">C1 - Advanced</SelectItem>
                  <SelectItem value="proficient">C2 - Proficient</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label>{t('admin:threeDLessons.template')}</Label>
              <Select value={filters.templateType} onValueChange={(value) => setFilters(prev => ({ ...prev, templateType: value }))}>
                <SelectTrigger>
                  <SelectValue placeholder={t('admin:threeDLessons.allTemplates')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">{t('admin:threeDLessons.allTemplates')}</SelectItem>
                  {LESSON_TEMPLATES.map((template) => (
                    <SelectItem key={template.id} value={template.id}>
                      {template.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:threeDLessons.totalLessons')}</CardTitle>
            <Boxes className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{threeDLessons.length}</div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:threeDLessons.publishedLessons')}</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threeDLessons.filter((lesson: any) => lesson.isPublished).length}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:threeDLessons.avgCompletionRate')}</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threeDLessons.length > 0 
                ? Math.round(threeDLessons.reduce((sum: number, lesson: any) => sum + (lesson.completionRate || 0), 0) / threeDLessons.length)
                : 0}%
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:threeDLessons.totalViews')}</CardTitle>
            <BarChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {threeDLessons.reduce((sum: number, lesson: any) => sum + (lesson.viewCount || 0), 0)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 3D Lessons Grid */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold">
            {t('admin:threeDLessons.lessonsLibrary')} ({filteredLessons.length})
          </h2>
        </div>
        
        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="h-20 bg-muted rounded"></div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : filteredLessons.length === 0 ? (
          <Card>
            <CardContent className="flex flex-col items-center justify-center py-16">
              <Cube className="h-12 w-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('admin:threeDLessons.noLessonsFound')}</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || Object.values(filters).some(v => v) 
                  ? t('admin:threeDLessons.adjustFilters')
                  : t('admin:threeDLessons.createFirstLesson')
                }
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredLessons.map((lesson: any) => (
              <ThreeDLessonCard
                key={lesson.id}
                lesson={lesson}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onTogglePublish={handleTogglePublish}
                onPreview={handlePreview}
              />
            ))}
          </div>
        )}
      </div>

      {/* Preview Dialog */}
      {previewLesson && (
        <Dialog open={!!previewLesson} onOpenChange={() => setPreviewLesson(null)}>
          <DialogContent className="max-w-6xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                {t('admin:threeDLessons.previewLesson')}: {previewLesson.title}
              </DialogTitle>
            </DialogHeader>
            <div className="h-[600px]">
              <Three3DLesson
                lesson={{
                  id: previewLesson.id,
                  title: previewLesson.title,
                  description: previewLesson.description,
                  language: previewLesson.language,
                  difficulty: previewLesson.level,
                  lessonType: previewLesson.skillFocus,
                  sceneType: previewLesson.templateType,
                  vocabularyWords: previewLesson.vocabularyWords || [],
                  estimatedDurationMinutes: previewLesson.estimatedDurationMinutes,
                  xpReward: previewLesson.xpReward
                }}
                onComplete={() => {}}
                onProgress={() => {}}
                onInteraction={() => {}}
                isMobile={false}
              />
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}