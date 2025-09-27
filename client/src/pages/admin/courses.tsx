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

// Schema for course creation and editing - matches new architecture (no teacher/schedule)
const courseSchema = z.object({
  courseCode: z.string().min(1, "Course code is required"),
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  language: z.string().min(1, "Language is required"),
  level: z.string().min(1, "Level is required"),
  targetLanguage: z.string().min(1, "Target language is required"),
  targetLevel: z.array(z.string()).min(1, "At least one target level required"),
  totalSessions: z.coerce.number().min(1, "Total sessions must be at least 1"),
  sessionDuration: z.coerce.number().min(30, "Session duration must be at least 30 minutes"),
  deliveryMode: z.string().min(1, "Delivery mode is required"),
  classFormat: z.string().min(1, "Class format is required"),
  category: z.string().min(1, "Category is required"),
  price: z.coerce.number().min(0, "Price must be non-negative"),
  maxStudents: z.coerce.number().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
  // Callern-specific fields
  accessPeriodMonths: z.coerce.number().optional(), // For Callern courses: access period in months
  callernAvailable24h: z.boolean().optional(), // For Callern courses: 24/7 availability
  callernRoadmapId: z.coerce.number().optional() // For Callern courses: assigned roadmap
}).refine((data) => {
  // For Callern courses, require access period
  if (data.deliveryMode === 'callern') {
    return data.accessPeriodMonths && data.accessPeriodMonths > 0;
  }
  return true;
}, {
  message: "Callern courses require access period.",
  path: ['accessPeriodMonths']
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
      courseCode: "",
      title: "",
      description: "",
      language: "English",
      level: "",
      targetLanguage: "",
      targetLevel: ["Beginner"],
      totalSessions: 12,
      sessionDuration: 90,
      deliveryMode: "online",
      classFormat: "group",
      category: "",
      price: 0,
      maxStudents: 30,
      isActive: true,
      isFeatured: false,
      accessPeriodMonths: 2,
      callernAvailable24h: true,
      callernRoadmapId: undefined
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
        <Button className="flex items-center gap-2">
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
            {/* Basic Information */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="courseCode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.courseCode')}</FormLabel>
                    <FormControl>
                      <Input placeholder={t('admin:courses.courseCodePlaceholder')} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
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
                        <SelectItem value="Language Learning">Language Learning</SelectItem>
                        <SelectItem value="Persian Language">Persian Language</SelectItem>
                        <SelectItem value="English Language">English Language</SelectItem>
                        <SelectItem value="Arabic Language">Arabic Language</SelectItem>
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
                        <SelectTrigger>
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
                name="targetLanguage"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.targetLanguage')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectTargetLanguage')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="persian">{t('admin:courses.persian')}</SelectItem>
                        <SelectItem value="english">{t('admin:courses.english')}</SelectItem>
                        <SelectItem value="arabic">{t('admin:courses.arabic')}</SelectItem>
                        <SelectItem value="french">{t('admin:courses.french')}</SelectItem>
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
                        <SelectItem value="beginner">{t('admin:courses.beginner')}</SelectItem>
                        <SelectItem value="intermediate">{t('admin:courses.intermediate')}</SelectItem>
                        <SelectItem value="advanced">{t('admin:courses.advanced')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Course Structure */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="totalSessions"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.totalSessions')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="12" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="sessionDuration"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.sessionDuration')}</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectDuration')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="60">{t('admin:courses.minutes60')}</SelectItem>
                        <SelectItem value="90">{t('admin:courses.minutes90')}</SelectItem>
                        <SelectItem value="120">{t('admin:courses.minutes120')}</SelectItem>
                        <SelectItem value="180">{t('admin:courses.minutes180')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="price"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.price')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="0" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Delivery and Format */}
            <div className="grid grid-cols-3 gap-4">
              <FormField
                control={form.control}
                name="deliveryMode"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.deliveryMode')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectDeliveryMode')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="online">{t('admin:courses.online')}</SelectItem>
                        <SelectItem value="in_person">{t('admin:courses.inPerson')}</SelectItem>
                        <SelectItem value="self_paced">{t('admin:courses.selfPaced')}</SelectItem>
                        <SelectItem value="callern">{t('admin:courses.callern')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="classFormat"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.classFormat')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder={t('admin:courses.selectClassFormat')} />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="group">{t('admin:courses.groupClass')}</SelectItem>
                        <SelectItem value="one_on_one">{t('admin:courses.oneOnOne')}</SelectItem>
                        <SelectItem value="callern_package">Callern Package</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="maxStudents"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>{t('admin:courses.maxStudents')}</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="30" {...field} />
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
                  <FormLabel>{t('admin:courses.courseDescription')}</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder={t('admin:courses.courseDescriptionPlaceholder')} 
                      rows={4} 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            {/* Course Settings */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="isActive"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('admin:courses.active')}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t('admin:courses.makeAvailableForEnrollment')}
                      </p>
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
              
              <FormField
                control={form.control}
                name="isFeatured"
                render={({ field }) => (
                  <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                    <div className="space-y-0.5">
                      <FormLabel className="text-base">
                        {t('admin:courses.featured')}
                      </FormLabel>
                      <p className="text-sm text-muted-foreground">
                        {t('admin:courses.highlightInFeaturedSection')}
                      </p>
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
            </div>

            {/* Note: Scheduling is now handled in Classes, not Courses */}

            {/* Callern Access Period Settings */}
            {form.watch('deliveryMode') === 'callern' && (
              <div className="space-y-4 border-t pt-6">
                <h3 className="text-lg font-semibold">Callern Access Settings</h3>
                <p className="text-sm text-muted-foreground">
                  Configure 24/7 access period for this Callern course
                </p>
                
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="accessPeriodMonths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Access Period (Months)</FormLabel>
                        <Select onValueChange={(value) => field.onChange(parseInt(value))} defaultValue={field.value?.toString()}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select access period" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="1">1 Month</SelectItem>
                            <SelectItem value="2">2 Months</SelectItem>
                            <SelectItem value="3">3 Months</SelectItem>
                            <SelectItem value="6">6 Months</SelectItem>
                            <SelectItem value="12">12 Months</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  
                  <FormField
                    control={form.control}
                    name="callernAvailable24h"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-center justify-between rounded-lg border p-4">
                        <div className="space-y-0.5">
                          <FormLabel className="text-base">
                            24/7 Availability
                          </FormLabel>
                          <p className="text-sm text-muted-foreground">
                            Students can access this course anytime
                          </p>
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
                </div>
              </div>
            )}
            
            <div className="flex justify-end gap-2">
              <Button type="button" variant="outline" onClick={() => setIsOpen(false)}>
                {t('admin:courses.cancel')}
              </Button>
              <Button type="submit" disabled={createCourseMutation.isPending}>
                {createCourseMutation.isPending ? "Creating..." : t('admin:courses.save')}
              </Button>
            </div>
          </form>
        </Form>
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
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
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
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial flex items-center justify-center gap-1">
                    <Eye className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:view')}</span>
                  </Button>
                  <Button variant="outline" size="sm" className="flex-1 sm:flex-initial flex items-center justify-center gap-1">
                    <Edit3 className="h-4 w-4" />
                    <span className="hidden sm:inline">{t('common:edit')}</span>
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

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