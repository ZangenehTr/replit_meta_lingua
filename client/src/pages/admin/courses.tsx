import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from 'react-i18next';
import { useAuth } from "@/hooks/use-auth";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { API_ENDPOINTS } from "@/services/endpoints";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Users,
  Star,
  Upload
} from "lucide-react";

// Schema for course creation - aligned with database schema
const courseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().optional(),
  category: z.string().default("Language Learning"),
  language: z.string().default("English"),
  level: z.string().default("Beginner"),
  isActive: z.boolean().default(true)
});

// Create Course Dialog Component
function CreateCourseDialog({ queryClient }: { queryClient: any }) {
  const { t } = useTranslation(['admin', 'common']);
  const [isOpen, setIsOpen] = useState(false);
  
  // Fetch available roadmaps for Callern courses
  const { data: availableRoadmaps = [] } = useQuery({
    queryKey: [API_ENDPOINTS.admin.courseRoadmaps],
    enabled: isOpen // Only fetch when dialog is open
  });
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: "",
      description: "",
      category: "Language Learning",
      language: "English",
      level: "Beginner",
      isActive: true
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema>) => {
      return await apiRequest(API_ENDPOINTS.admin.courses, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:courses.createdSuccessfully') });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.courses] });
      setIsOpen(false);
      form.reset();
    },
    onError: (error: any) => {
      console.error('Error creating course:', error);
      toast({ 
        title: t('admin:courses.failedToCreate'), 
        description: error.message || t('common:errors.unknownError'),
        variant: "destructive" 
      });
    }
  });

  const onSubmit = (data: z.infer<typeof courseSchema>) => {
    createCourseMutation.mutate(data);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button className="flex items-center gap-2" data-testid="button-create-course">
          <Plus className="h-4 w-4" />
          {t('admin:courses.createCourse')}
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{t('admin:courses.createNewCourse')}</DialogTitle>
          <DialogDescription>
            {t('admin:courses.createCourseDescription')}
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Course Information - aligned with database schema */}
            <div className="grid grid-cols-1 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.courseTitle')}</FormLabel>
                    <FormControl>
                      <Input 
                        placeholder={t('admin:courses.courseTitlePlaceholder')} 
                        data-testid="course-title-input" 
                        {...field} 
                      />
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
                    <FormLabel>{t('admin:courses.description')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('admin:courses.descriptionPlaceholder')} 
                        data-testid="course-description-input"
                        {...field} 
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:courses.category')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="category-select-trigger">
                            <SelectValue placeholder={t('admin:courses.selectCategory')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent data-testid="category-select-content">
                          <SelectItem value="Language Learning" data-testid="category-option-language-learning">Language Learning</SelectItem>
                          <SelectItem value="Persian Language" data-testid="category-option-persian">Persian Language</SelectItem>
                          <SelectItem value="English Language" data-testid="category-option-english">English Language</SelectItem>
                          <SelectItem value="Arabic Language" data-testid="category-option-arabic">Arabic Language</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={form.control}
                  name="language"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>{t('admin:courses.courseLanguage')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="language-select-trigger">
                            <SelectValue placeholder={t('admin:courses.selectLanguage')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="English">{t('admin:courses.english')}</SelectItem>
                          <SelectItem value="Persian">{t('admin:courses.persian')}</SelectItem>
                          <SelectItem value="Arabic">{t('admin:courses.arabic')}</SelectItem>
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
                      <FormLabel>{t('admin:courses.level')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger data-testid="level-select-trigger">
                            <SelectValue placeholder={t('admin:courses.selectLevel')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Beginner">{t('admin:courses.beginner')}</SelectItem>
                          <SelectItem value="Intermediate">{t('admin:courses.intermediate')}</SelectItem>
                          <SelectItem value="Advanced">{t('admin:courses.advanced')}</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">{t('admin:courses.activeCourse')}</FormLabel>
                      <div className="text-sm text-muted-foreground">
                        {t('admin:courses.activeCourseDescription')}
                      </div>
                    </div>
                    <FormControl>
                      <Switch
                        checked={field.value}
                        onCheckedChange={field.onChange}
                        data-testid="is-active-switch"
                      />
                    </FormControl>
                  </FormItem>
                )}
              />
            </div>

            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t('admin:courses.cancel')}
              </Button>
              <Button type="submit" disabled={createCourseMutation.isPending} data-testid="submit-course-button">
                {createCourseMutation.isPending ? "Creating..." : t('admin:courses.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Edit Course Dialog Component
function EditCourseDialog({ course, onClose, queryClient }: { course: any, onClose: () => void, queryClient: any }) {
  const { t } = useTranslation(['admin', 'common']);
  
  const form = useForm<z.infer<typeof courseSchema>>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: course.title || "",
      description: course.description || "",
      category: course.category || "Language Learning",
      language: course.language || "English", 
      level: course.level || "Beginner",
      isActive: course.isActive !== undefined ? course.isActive : true
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: z.infer<typeof courseSchema>) => {
      return await apiRequest(`${API_ENDPOINTS.admin.courses}/${course.id}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({ title: t('admin:courses.updatedSuccessfully') });
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.admin.courses] });
      onClose();
    },
    onError: (error: any) => {
      toast({ 
        title: t('admin:courses.updateFailed'), 
        description: error?.message || t('admin:courses.updateError'),
        variant: 'destructive' 
      });
    }
  });

  const onSubmit = (data: z.infer<typeof courseSchema>) => {
    updateCourseMutation.mutate(data);
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" role="dialog">
        <DialogHeader>
          <DialogTitle>{t('admin:courses.editCourse')}</DialogTitle>
          <DialogDescription>{t('admin:courses.editCourseDescription')}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.courseTitle')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin:courses.courseTitlePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.category')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectCategory')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Language Learning">{t('admin:courses.languageLearning')}</SelectItem>
                        <SelectItem value="Business">{t('admin:courses.business')}</SelectItem>
                        <SelectItem value="Academic">{t('admin:courses.academic')}</SelectItem>
                        <SelectItem value="Test Preparation">{t('admin:courses.testPreparation')}</SelectItem>
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
                name="language"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.language')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectLanguage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="English">{t('admin:courses.english')}</SelectItem>
                        <SelectItem value="Persian">{t('admin:courses.persian')}</SelectItem>
                        <SelectItem value="Arabic">{t('admin:courses.arabic')}</SelectItem>
                        <SelectItem value="French">{t('admin:courses.french')}</SelectItem>
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
                    <FormLabel>{t('admin:courses.level')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectLevel')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="Beginner">{t('admin:courses.beginner')}</SelectItem>
                        <SelectItem value="Intermediate">{t('admin:courses.intermediate')}</SelectItem>
                        <SelectItem value="Advanced">{t('admin:courses.advanced')}</SelectItem>
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
                  <FormLabel>{t('admin:courses.courseDescription')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('admin:courses.courseDescriptionPlaceholder')} 
                      rows={3} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="isActive"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                  <div className="space-y-0.5">
                    <FormLabel className="text-base">{t('admin:courses.activeCourse')}</FormLabel>
                    <div className="text-sm text-muted-foreground">
                      {t('admin:courses.activeCourseDescription')}
                    </div>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                      data-testid="is-active-switch"
                    />
                  </FormControl>
                </FormItem>
              )}
            />
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={onClose}>
                {t('admin:courses.cancel')}
              </Button>
              <Button type="submit" disabled={updateCourseMutation.isPending} data-testid="save-course-button">
                {updateCourseMutation.isPending ? "Saving..." : t('admin:courses.save')}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// View Course Dialog Component  
function ViewCourseDialog({ course, onClose }: { course: any, onClose: () => void }) {
  const { t } = useTranslation(['admin', 'common']);

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" role="dialog">
        <DialogHeader>
          <DialogTitle>{course.title}</DialogTitle>
          <DialogDescription>{t('admin:courses.courseDetails')}</DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.category')}</label>
              <p className="text-sm text-gray-900">{course.category}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.language')}</label>
              <p className="text-sm text-gray-900">{course.language}</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.level')}</label>
              <p className="text-sm text-gray-900">{course.level}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.status')}</label>
              <Badge className={course.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                {course.isActive ? t('admin:courses.active') : t('admin:courses.inactive')}
              </Badge>
            </div>
          </div>
          
          {course.description && (
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.description')}</label>
              <p className="text-sm text-gray-900 mt-1">{course.description}</p>
            </div>
          )}
          
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.createdAt')}</label>
              <p className="text-sm text-gray-900">{new Date(course.createdAt).toLocaleDateString()}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">{t('admin:courses.updatedAt')}</label>
              <p className="text-sm text-gray-900">{new Date(course.updatedAt).toLocaleDateString()}</p>
            </div>
          </div>
        </div>
        
        <div className="flex justify-end">
          <Button onClick={onClose}>
            {t('common:close')}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export function AdminCourses() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [editingCourse, setEditingCourse] = useState<any>(null);
  const [viewingCourse, setViewingCourse] = useState<any>(null);

  // Fetch courses data - simplified query without parameters
  const { data: courses, isLoading, isError, error } = useQuery({
    queryKey: [API_ENDPOINTS.admin.courses],
    enabled: !!user && ['admin', 'Admin', 'supervisor', 'Supervisor'].some(role => role.toLowerCase() === user?.role?.toLowerCase()),
    retry: (failureCount, error: any) => {
      if (error?.status === 401 || error?.status === 403) {
        console.error('Authentication error, not retrying:', error?.status);
        return false;
      }
      return failureCount < 3;
    }
  });
  
  const courseData = Array.isArray(courses) ? courses : [];

  const filteredCourses = courseData.filter((course: any) => {
    const matchesSearch = !searchTerm || 
                         course.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLanguage = filterLanguage === "all" || course.language === filterLanguage;
    return matchesSearch && matchesLanguage;
  });



  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'draft': return 'bg-yellow-100 text-yellow-800';
      case 'archived': return 'bg-gray-100 text-gray-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading courses...</p>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <p className="text-red-600">Error loading courses: {error?.message || 'Unknown error'}</p>
          <Button onClick={() => window.location.reload()} className="mt-4">
            Reload Page
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('admin:courses.title')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            {t('admin:courses.subtitle')}
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Import Course
          </Button>
          <CreateCourseDialog queryClient={queryClient} />
        </div>
      </div>

      {/* Search and Filters - Mobile First */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 rtl:right-3 rtl:left-auto top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder={t('admin:courses.searchPlaceholder')}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 rtl:pl-3 rtl:pr-10 w-full"
          />
        </div>
        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 ml-2 rtl:mr-2 rtl:ml-0" />
            <SelectValue placeholder={t('admin:courses.allLanguages')} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('admin:courses.allLanguages')}</SelectItem>
            <SelectItem value="Persian">{t('admin:courses.persian')}</SelectItem>
            <SelectItem value="English">{t('admin:courses.english')}</SelectItem>
            <SelectItem value="Arabic">{t('admin:courses.arabic')}</SelectItem>
            <SelectItem value="French">{t('admin:courses.french')}</SelectItem>
            <SelectItem value="Spanish">{t('admin:courses.spanish')}</SelectItem>
            <SelectItem value="German">{t('admin:courses.german')}</SelectItem>
            <SelectItem value="Chinese">{t('admin:courses.chinese')}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid - Mobile First */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
        {filteredCourses.map((course: any) => (
          <Card key={course.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg line-clamp-2">{course.title}</CardTitle>
                  <p className="text-sm text-gray-600 mt-1">{course.instructor}</p>
                </div>
                <Badge className={getStatusColor(course.status)}>
                  {course.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-sm text-gray-600 line-clamp-2">{course.description}</p>
              
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">{t('admin:courses.level')}:</span>
                  <Badge className={`ms-2 ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.duration')}:</span>
                  <span className="ms-2 font-medium">{course.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.students')}:</span>
                  <span className="ms-2 font-bold">{course.enrolledStudents || 0}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('admin:courses.rating')}:</span>
                  <span className="ms-2 font-bold flex items-center gap-1">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                    {course.rating || 'N/A'}
                  </span>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pt-2 gap-2">
                <div className="text-lg font-bold">
                  {(course.price || 0).toLocaleString('fa-IR')} IRR
                </div>
                <div className="flex gap-2 w-full sm:w-auto">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1"
                    onClick={() => setViewingCourse(course)}
                    data-testid={`view-course-${course.id}`}
                  >
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:view')}</span>
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="flex-1 sm:flex-initial flex items-center justify-center gap-1"
                    onClick={() => setEditingCourse(course)}
                    data-testid={`edit-course-${course.id}`}
                  >
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:edit')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Edit Course Dialog */}
      {editingCourse && (
        <EditCourseDialog 
          course={editingCourse} 
          onClose={() => setEditingCourse(null)} 
          queryClient={queryClient} 
        />
      )}

      {/* View Course Dialog */}
      {viewingCourse && (
        <ViewCourseDialog 
          course={viewingCourse} 
          onClose={() => setViewingCourse(null)} 
        />
      )}

      {/* Statistics Summary - Mobile First */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 sm:gap-4 mt-6 sm:mt-8">
        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.totalCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">{Array.isArray(courseData) ? courseData.length : 0}</div>
            <p className="text-xs text-muted-foreground mt-1">{t('admin:courses.totalDesc')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.activeCourses')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Array.isArray(courseData) ? courseData.filter((c: any) => c.status === 'active').length : 0}
            </div>
            <p className="text-xs text-green-600">{t('admin:courses.currentlyAvailable')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.categories')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Array.isArray(courseData) ? new Set(courseData.map((c: any) => c.category)).size : 0}
            </div>
            <p className="text-xs text-blue-600">{t('admin:courses.uniqueCategories')}</p>
          </CardContent>
        </Card>

        <Card className="shadow-sm">
          <CardHeader className="pb-2 px-3 sm:px-6">
            <CardTitle className="text-xs sm:text-sm font-medium">{t('admin:courses.courseRevenue')}</CardTitle>
          </CardHeader>
          <CardContent className="px-3 sm:px-6">
            <div className="text-xl sm:text-2xl font-bold">
              {Array.isArray(courseData) ? courseData.reduce((sum: number, course: any) => sum + (course.price || 0), 0).toLocaleString('fa-IR') : 0} IRR
            </div>
            <p className="text-xs text-green-600">{t('admin:courses.totalPotential')}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}