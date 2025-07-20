import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  BookOpen, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  Users,
  Clock,
  Star,
  TrendingUp,
  Video,
  FileText,
  Download,
  Upload,
  Settings,
  Play,
  Pause
} from "lucide-react";

// Schema for course editing
const editCourseSchema = z.object({
  title: z.string().min(1, "Title is required"),
  description: z.string().min(1, "Description is required"),
  category: z.string().min(1, "Category is required"),
  level: z.string().min(1, "Level is required"),
  duration: z.number().min(1, "Duration must be at least 1 week"),
  price: z.number().min(0, "Price must be non-negative"),
  isActive: z.boolean(),
  deliveryMode: z.string().optional(),
  callernConfig: z.object({
    packageName: z.string(),
    totalHours: z.number(),
    price: z.number(),
    minCallDuration: z.number(),
    description: z.string(),
    standbyTeachers: z.array(z.number()),
    overnightCoverage: z.boolean()
  }).optional()
});

type EditCourseFormData = z.infer<typeof editCourseSchema>;

interface EditCourseFormProps {
  course: any;
  onSuccess: () => void;
}

function EditCourseForm({ course, onSuccess }: EditCourseFormProps) {
  const queryClient = useQueryClient();
  
  const form = useForm<EditCourseFormData>({
    resolver: zodResolver(editCourseSchema),
    defaultValues: {
      title: course.title || "",
      description: course.description || "",
      category: course.category || "",
      level: course.level || "",
      duration: course.duration || 1,
      price: course.price || 0,
      isActive: course.isActive ?? true
    }
  });

  const updateCourseMutation = useMutation({
    mutationFn: async (data: EditCourseFormData) => {
      const response = await fetch(`/api/admin/courses/${course.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error('Failed to update course');
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Course updated successfully"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      onSuccess();
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update course",
        variant: "destructive"
      });
    }
  });

  const onSubmit = (data: EditCourseFormData) => {
    updateCourseMutation.mutate(data);
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Course Title</FormLabel>
              <FormControl>
                <Input {...field} />
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
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea {...field} rows={3} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="category"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Category</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="Persian">Persian</SelectItem>
                    <SelectItem value="English">English</SelectItem>
                    <SelectItem value="Arabic">Arabic</SelectItem>
                    <SelectItem value="French">French</SelectItem>
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
                <FormLabel>Level</FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="beginner">Beginner</SelectItem>
                    <SelectItem value="intermediate">Intermediate</SelectItem>
                    <SelectItem value="advanced">Advanced</SelectItem>
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
            name="duration"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Duration (weeks)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (USD)</FormLabel>
                <FormControl>
                  <Input 
                    type="number" 
                    {...field} 
                    onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="isActive"
          render={({ field }) => (
            <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
              <div className="space-y-0.5">
                <FormLabel>Active Status</FormLabel>
                <div className="text-sm text-muted-foreground">
                  Enable or disable this course
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

        <div className="flex justify-end gap-3 pt-4">
          <Button 
            type="button" 
            variant="outline"
            onClick={() => onSuccess()}
          >
            Cancel
          </Button>
          <Button 
            type="submit"
            disabled={updateCourseMutation.isPending}
          >
            {updateCourseMutation.isPending ? "Updating..." : "Update Course"}
          </Button>
        </div>
      </form>
    </Form>
  );
}

export function AdminCourses() {
  const { t, isRTL } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterCategory, setFilterCategory] = useState("all");
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [editingCourse, setEditingCourse] = useState(null);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch courses data
  const { data: courses, isLoading } = useQuery({
    queryKey: ['/api/admin/courses', { search: searchTerm, category: filterCategory }],
  });

  const courseData = courses || [];

  const filteredCourses = (courseData || []).filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = filterCategory === "all" || course.category === filterCategory;
    return matchesSearch && matchesCategory;
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

  const handleEditCourse = (course) => {
    setEditingCourse(course);
    setIsEditDialogOpen(true);
  };

  const handleEditSuccess = () => {
    setIsEditDialogOpen(false);
    setEditingCourse(null);
  };

  // Course module and lesson management handlers using proper API integration
  const addModuleMutation = useMutation({
    mutationFn: async ({ courseId, moduleData }: { courseId: number; moduleData: any }) => {
      return await apiRequest(`/api/admin/courses/${courseId}/modules`, {
        method: 'POST',
        body: moduleData
      });
    },
    onSuccess: () => {
      toast({ title: "Module added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: (error) => {
      console.error('Error adding module:', error);
      toast({ title: "Failed to add module", variant: "destructive" });
    }
  });

  const addLessonMutation = useMutation({
    mutationFn: async ({ courseId, moduleId, lessonData }: { courseId: number; moduleId: number; lessonData: any }) => {
      return await apiRequest(`/api/admin/courses/${courseId}/modules/${moduleId}/lessons`, {
        method: 'POST',
        body: lessonData
      });
    },
    onSuccess: () => {
      toast({ title: "Lesson added successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: (error) => {
      console.error('Error adding lesson:', error);
      toast({ title: "Failed to add lesson", variant: "destructive" });
    }
  });

  const publishCourseMutation = useMutation({
    mutationFn: async (courseId: number) => {
      return await apiRequest(`/api/admin/courses/${courseId}/publish`, {
        method: 'PUT'
      });
    },
    onSuccess: () => {
      toast({ title: "Course published successfully" });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
    },
    onError: (error) => {
      console.error('Error publishing course:', error);
      toast({ title: "Failed to publish course", variant: "destructive" });
    }
  });

  const handleAddModule = async () => {
    const courseId = selectedCourse?.id || 1;
    const moduleData = {
      name: "New Module",
      description: "Module description",
      duration: "1 week",
      order: 1
    };
    
    addModuleMutation.mutate({ courseId, moduleData });
  };

  const handleAddLesson = async (moduleId: number) => {
    const courseId = selectedCourse?.id || 1;
    const lessonData = {
      teacherId: 1,
      title: "New Lesson",
      description: "Lesson description",
      videoUrl: "",
      duration: 30,
      orderIndex: 1,
      language: "Persian",
      level: "Beginner",
      skillFocus: "Grammar",
      isPublished: false
    };
    
    addLessonMutation.mutate({ courseId, moduleId, lessonData });
  };

  const handleSaveAsDraft = () => {
    toast({ title: "Course saved as draft" });
  };

  const handlePublishCourse = async () => {
    const courseId = selectedCourse?.id || 1;
    publishCourseMutation.mutate(courseId);
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">{t('courseManagement')}</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Define curriculum, content, and learning objectives
          </p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline">
            <Upload className="h-4 w-4 mr-2" />
            Import Course
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                {t('createCourse')}
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Create New Course</DialogTitle>
                <DialogDescription>
                  Build a comprehensive course with modules, lessons, and assessments
                </DialogDescription>
              </DialogHeader>
              <div className="flex-1 overflow-y-auto pr-2">
                <Tabs defaultValue="basic" className="w-full">
                  <TabsList className="grid w-full grid-cols-6 sticky top-0 bg-background z-10">
                    <TabsTrigger value="basic">Basic Info</TabsTrigger>
                    <TabsTrigger value="content">Content Structure</TabsTrigger>
                    <TabsTrigger value="modules">Modules & Lessons</TabsTrigger>
                    <TabsTrigger value="assessments">Assessments</TabsTrigger>
                    <TabsTrigger value="pricing">Pricing & Access</TabsTrigger>
                    <TabsTrigger value="settings">Advanced Settings</TabsTrigger>
                  </TabsList>
                
                <TabsContent value="basic" className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="courseTitle">Course Title</Label>
                      <Input id="courseTitle" placeholder="Enter course title" />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseCategory">Category</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="persian">Persian</SelectItem>
                          <SelectItem value="english">English</SelectItem>
                          <SelectItem value="arabic">Arabic</SelectItem>
                          <SelectItem value="french">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseLevel">Difficulty Level</Label>
                      <Select>
                        <SelectTrigger>
                          <SelectValue placeholder="Select level" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="beginner">Beginner</SelectItem>
                          <SelectItem value="intermediate">Intermediate</SelectItem>
                          <SelectItem value="advanced">Advanced</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="courseDuration">Duration (weeks)</Label>
                      <Input id="courseDuration" type="number" placeholder="12" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="courseDescription">Course Description</Label>
                    <Textarea id="courseDescription" placeholder="Detailed course description..." rows={4} />
                  </div>
                </TabsContent>

                <TabsContent value="content" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Course Structure Type</Label>
                      <Select defaultValue="modular">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="modular">Modular Course (Modules + Lessons)</SelectItem>
                          <SelectItem value="sequential">Sequential Course (Lesson by Lesson)</SelectItem>
                          <SelectItem value="self_paced">Self-Paced Learning Path</SelectItem>
                          <SelectItem value="live_sessions">Live Session Based</SelectItem>
                          <SelectItem value="callern">Callern On-Demand Video Calls</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {/* Callern-specific configuration */}
                    <div className="space-y-4 p-4 border border-orange-200 bg-orange-50/50 rounded-lg">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 bg-orange-500 rounded-full"></div>
                        <Label className="text-lg font-semibold text-orange-800">Callern Configuration</Label>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>Package Name</Label>
                          <Input placeholder="Basic Conversation Package" />
                        </div>
                        <div className="space-y-2">
                          <Label>Total Hours</Label>
                          <Input type="number" placeholder="10" />
                        </div>
                        <div className="space-y-2">
                          <Label>Package Price (IRR)</Label>
                          <Input type="number" placeholder="500000" />
                        </div>
                        <div className="space-y-2">
                          <Label>Minimum Call Duration (min)</Label>
                          <Input type="number" defaultValue="15" />
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Package Description</Label>
                        <Textarea placeholder="On-demand video calls with native Persian speakers. Practice conversation skills anytime teachers are available." rows={2} />
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Standby Teachers</Label>
                        <div className="text-sm text-gray-600 mb-2">Select teachers who will be available for on-demand Callern calls</div>
                        <div className="flex flex-wrap gap-2">
                          <Badge variant="outline" className="cursor-pointer hover:bg-orange-100">
                            Ahmad Rahimi
                          </Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-orange-100">
                            Sara Hosseini
                          </Badge>
                          <Badge variant="outline" className="cursor-pointer hover:bg-orange-100">
                            + Add Teacher
                          </Badge>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Overnight Coverage</Label>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="overnight_coverage" />
                          <Label htmlFor="overnight_coverage" className="text-sm">Enable 24/7 teacher availability for this package</Label>
                        </div>
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Content Delivery Method</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="video_content" defaultChecked />
                          <Label htmlFor="video_content">Video Lessons</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="text_content" />
                          <Label htmlFor="text_content">Text Content</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="audio_content" />
                          <Label htmlFor="audio_content">Audio Content</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="interactive_content" />
                          <Label htmlFor="interactive_content">Interactive Exercises</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="live_sessions_check" />
                          <Label htmlFor="live_sessions_check">Live Sessions</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <input type="checkbox" id="assignments_check" />
                          <Label htmlFor="assignments_check">Assignments</Label>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Learning Progression</Label>
                      <Select defaultValue="linear">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="linear">Linear (Sequential unlock)</SelectItem>
                          <SelectItem value="flexible">Flexible (Jump to any lesson)</SelectItem>
                          <SelectItem value="prerequisite">Prerequisite-based</SelectItem>
                          <SelectItem value="adaptive">Adaptive (AI-driven)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label>Estimated Course Hours</Label>
                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <Label className="text-sm">Video Content</Label>
                          <Input type="number" placeholder="10" />
                        </div>
                        <div>
                          <Label className="text-sm">Reading/Text</Label>
                          <Input type="number" placeholder="5" />
                        </div>
                        <div>
                          <Label className="text-sm">Exercises</Label>
                          <Input type="number" placeholder="8" />
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="modules" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Course Modules & Lessons</Label>
                      <Button size="sm" onClick={() => handleAddModule()}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </Button>
                    </div>
                    
                    {/* Module Builder Interface */}
                    <div className="border rounded-lg p-4 space-y-4">
                      <div className="flex items-center justify-between">
                        <h4 className="font-medium">Module 1: Introduction to Persian Language</h4>
                        <div className="flex gap-2">
                          <Button variant="outline" size="sm">Edit</Button>
                          <Button variant="outline" size="sm">Delete</Button>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Module Duration</Label>
                          <Input placeholder="2 weeks" />
                        </div>
                        <div>
                          <Label className="text-sm">Lesson Count</Label>
                          <Input type="number" placeholder="8" />
                        </div>
                      </div>
                      
                      <div>
                        <Label className="text-sm">Module Description</Label>
                        <Textarea placeholder="Comprehensive introduction to Persian script and basic grammar..." rows={2} />
                      </div>
                      
                      {/* Lesson Builder */}
                      <div className="border-t pt-4">
                        <div className="flex justify-between items-center mb-3">
                          <Label className="font-medium">Lessons in this Module</Label>
                          <Button variant="outline" size="sm" onClick={() => handleAddLesson(1)}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Lesson
                          </Button>
                        </div>
                        
                        <div className="space-y-2">
                          {[1, 2, 3].map((lesson) => (
                            <div key={lesson} className="flex items-center justify-between p-3 bg-gray-50 rounded">
                              <div className="flex items-center gap-3">
                                <div className="w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                                  {lesson}
                                </div>
                                <div>
                                  <div className="font-medium">Lesson {lesson}: Persian Alphabet Basics</div>
                                  <div className="text-sm text-gray-600">Duration: 25 min • Type: Video + Exercise</div>
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <Button variant="ghost" size="sm">
                                  <Eye className="h-4 w-4" />
                                </Button>
                                <Button variant="ghost" size="sm">
                                  <Edit3 className="h-4 w-4" />
                                </Button>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="assessments" className="space-y-4">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <Label className="text-lg font-semibold">Assessments & Evaluations</Label>
                      <Button size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Create Assessment
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Assessment Types</Label>
                        <div className="space-y-2">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="quizzes" defaultChecked />
                            <Label htmlFor="quizzes">Module Quizzes</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="assignments" />
                            <Label htmlFor="assignments">Written Assignments</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="projects" />
                            <Label htmlFor="projects">Final Projects</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="peer_review" />
                            <Label htmlFor="peer_review">Peer Reviews</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="oral_exams" />
                            <Label htmlFor="oral_exams">Oral Examinations</Label>
                          </div>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <Label>Grading Configuration</Label>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Passing Grade (%)</Label>
                            <Input type="number" defaultValue="70" />
                          </div>
                          <div>
                            <Label className="text-sm">Maximum Attempts</Label>
                            <Select defaultValue="3">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="1">1 Attempt</SelectItem>
                                <SelectItem value="2">2 Attempts</SelectItem>
                                <SelectItem value="3">3 Attempts</SelectItem>
                                <SelectItem value="unlimited">Unlimited</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="timed_assessments" />
                            <Label htmlFor="timed_assessments">Timed Assessments</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="auto_grading" />
                            <Label htmlFor="auto_grading">Automatic Grading</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    {/* Assessment Builder Preview */}
                    <div className="border rounded-lg p-4">
                      <h4 className="font-medium mb-3">Sample Assessment: Module 1 Quiz</h4>
                      <div className="space-y-3">
                        <div className="flex justify-between text-sm">
                          <span>Questions: 15</span>
                          <span>Time Limit: 20 minutes</span>
                          <span>Passing Score: 70%</span>
                        </div>
                        <div className="text-sm text-gray-600">
                          Question Types: Multiple Choice (8), Fill-in-blank (4), True/False (3)
                        </div>
                        <Button variant="outline" size="sm">Edit Assessment</Button>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="pricing" className="space-y-4">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Pricing Model</Label>
                      <Select defaultValue="one_time">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="free">Free Course</SelectItem>
                          <SelectItem value="one_time">One-time Payment</SelectItem>
                          <SelectItem value="subscription">Subscription Based</SelectItem>
                          <SelectItem value="installments">Payment Installments</SelectItem>
                          <SelectItem value="tiered">Tiered Pricing</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor="coursePrice">Course Price</Label>
                        <Input id="coursePrice" type="number" placeholder="299" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="courseCurrency">Currency</Label>
                        <Select defaultValue="irr">
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="irr">IRR (Iranian Rial)</SelectItem>
                            <SelectItem value="usd">USD</SelectItem>
                            <SelectItem value="eur">EUR</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Access Control & Enrollment</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="freePreview" />
                            <Label htmlFor="freePreview">Free Preview (First 2 lessons)</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="autoEnrollment" />
                            <Label htmlFor="autoEnrollment">Auto-enrollment after payment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="bulkDiscount" />
                            <Label htmlFor="bulkDiscount">Bulk enrollment discounts</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="earlyBird" />
                            <Label htmlFor="earlyBird">Early bird pricing</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="scholarships" />
                            <Label htmlFor="scholarships">Scholarship programs</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="referralDiscount" />
                            <Label htmlFor="referralDiscount">Referral discounts</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="groupPricing" />
                            <Label htmlFor="groupPricing">Group pricing tiers</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <input type="checkbox" id="seasonalPricing" />
                            <Label htmlFor="seasonalPricing">Seasonal pricing</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label>Iranian Payment Integration</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label className="text-sm">Shetab Payment Gateway</Label>
                          <Select defaultValue="enabled">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="enabled">Enabled</SelectItem>
                              <SelectItem value="disabled">Disabled</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div>
                          <Label className="text-sm">Payment Terms</Label>
                          <Select defaultValue="immediate">
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="immediate">Immediate Access</SelectItem>
                              <SelectItem value="approval">Manual Approval</SelectItem>
                              <SelectItem value="installment">Installment Plan</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                    </div>

                    <div className="border rounded-lg p-4 bg-gray-50">
                      <h4 className="font-medium mb-3">Pricing Summary</h4>
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Base Price:</span>
                          <span className="font-medium">299,000 IRR</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Early Bird Discount:</span>
                          <span className="text-green-600">-20%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Platform Fee:</span>
                          <span>5%</span>
                        </div>
                        <div className="flex justify-between font-medium border-t pt-2">
                          <span>Final Price:</span>
                          <span>250,390 IRR</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-6">
                    {/* Course Delivery Settings */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Course Delivery & Access</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="autoEnroll" defaultChecked />
                            <Label htmlFor="autoEnroll">Auto-enrollment after payment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="mobileAccess" defaultChecked />
                            <Label htmlFor="mobileAccess">Mobile app access</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="offlineDownload" />
                            <Label htmlFor="offlineDownload">Offline content download</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="progressTracking" defaultChecked />
                            <Label htmlFor="progressTracking">Detailed progress tracking</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="speedControl" defaultChecked />
                            <Label htmlFor="speedControl">Video playback speed control</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="subtitles" defaultChecked />
                            <Label htmlFor="subtitles">Persian/English subtitles</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="bookmarks" />
                            <Label htmlFor="bookmarks">Lesson bookmarking</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="notes" defaultChecked />
                            <Label htmlFor="notes">Student note-taking</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Student Interaction Features */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Student Interaction & Community</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="discussions" defaultChecked />
                            <Label htmlFor="discussions">Course discussions</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="qa_sessions" />
                            <Label htmlFor="qa_sessions">Live Q&A sessions</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="peer_review" />
                            <Label htmlFor="peer_review">Peer assignment reviews</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="study_groups" />
                            <Label htmlFor="study_groups">Study group formation</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="mentor_matching" />
                            <Label htmlFor="mentor_matching">Mentor matching</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="cultural_exchange" defaultChecked />
                            <Label htmlFor="cultural_exchange">Persian cultural exchange</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="language_practice" defaultChecked />
                            <Label htmlFor="language_practice">Language practice partners</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="achievement_sharing" />
                            <Label htmlFor="achievement_sharing">Achievement sharing</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Certification & Completion */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Certification & Completion</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="certificates" defaultChecked />
                            <Label htmlFor="certificates">Digital completion certificates</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="badges" />
                            <Label htmlFor="badges">Skill-based badges</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="transcript" />
                            <Label htmlFor="transcript">Academic transcript</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div>
                            <Label className="text-sm">Completion Requirement</Label>
                            <Select defaultValue="80">
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="70">70% completion</SelectItem>
                                <SelectItem value="80">80% completion</SelectItem>
                                <SelectItem value="90">90% completion</SelectItem>
                                <SelectItem value="100">100% completion</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* AI & Personalization */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">AI & Personalization Features</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="ai_recommendations" defaultChecked />
                            <Label htmlFor="ai_recommendations">AI learning recommendations</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="adaptive_learning" />
                            <Label htmlFor="adaptive_learning">Adaptive learning paths</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="mood_tracking" defaultChecked />
                            <Label htmlFor="mood_tracking">Mood-based learning (Persian Cultural)</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="ai_tutoring" />
                            <Label htmlFor="ai_tutoring">AI tutoring assistance</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="pronunciation_ai" defaultChecked />
                            <Label htmlFor="pronunciation_ai">Persian pronunciation AI</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="cultural_insights" defaultChecked />
                            <Label htmlFor="cultural_insights">Cultural insights AI</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Iranian Compliance & Localization */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Third Party Settings & Localization</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="persian_ui" defaultChecked />
                            <Label htmlFor="persian_ui">Persian UI localization</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="rtl_support" defaultChecked />
                            <Label htmlFor="rtl_support">Right-to-left text support</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="iranian_calendar" />
                            <Label htmlFor="iranian_calendar">Iranian calendar integration</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="local_servers" defaultChecked />
                            <Label htmlFor="local_servers">Local server deployment</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="offline_first" defaultChecked />
                            <Label htmlFor="offline_first">Offline-first architecture</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="iranian_content" defaultChecked />
                            <Label htmlFor="iranian_content">Iranian cultural content</Label>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Advanced Course Analytics */}
                    <div className="space-y-3">
                      <Label className="text-lg font-semibold">Analytics & Reporting</Label>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="detailed_analytics" defaultChecked />
                            <Label htmlFor="detailed_analytics">Detailed learning analytics</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="engagement_tracking" defaultChecked />
                            <Label htmlFor="engagement_tracking">Engagement tracking</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="completion_insights" />
                            <Label htmlFor="completion_insights">Completion rate insights</Label>
                          </div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex items-center space-x-2">
                            <Switch id="performance_reports" />
                            <Label htmlFor="performance_reports">Performance reports</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="instructor_dashboard" defaultChecked />
                            <Label htmlFor="instructor_dashboard">Instructor analytics dashboard</Label>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Switch id="export_data" />
                            <Label htmlFor="export_data">Data export capabilities</Label>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </TabsContent>
                </Tabs>
              </div>
              <div className="flex justify-end gap-3 mt-4 pt-4 border-t">
                <Button variant="outline" onClick={() => handleSaveAsDraft()}>Save as Draft</Button>
                <Button onClick={() => handlePublishCourse()}>Publish Course</Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search courses by title or description..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Categories</SelectItem>
            <SelectItem value="Persian">Persian</SelectItem>
            <SelectItem value="English">English</SelectItem>
            <SelectItem value="Arabic">Arabic</SelectItem>
            <SelectItem value="French">French</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredCourses.map((course) => (
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
                  <span className="text-gray-600">Level:</span>
                  <Badge className={`ml-2 ${getLevelColor(course.level)}`}>
                    {course.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Duration:</span>
                  <span className="ml-2 font-medium">{course.duration}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('students')}:</span>
                  <span className="ml-2 font-bold">{course.enrolledStudents}</span>
                </div>
                <div>
                  <span className="text-gray-600">{t('rating')}:</span>
                  <span className="ml-2 font-bold flex items-center">
                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                    {course.rating}
                  </span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Completion Rate</span>
                  <span>{course.completionRate}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-600 h-2 rounded-full" 
                    style={{ width: `${course.completionRate}%` }}
                  ></div>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <div className="text-lg font-bold">
                  ${course.price} {course.currency}
                </div>
                <div className="flex gap-2">
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-5xl">
                      <DialogHeader>
                        <DialogTitle>Course Details: {course.title}</DialogTitle>
                      </DialogHeader>
                      
                      <Tabs defaultValue="overview" className="w-full">
                        <TabsList className="grid w-full grid-cols-4">
                          <TabsTrigger value="overview">Overview</TabsTrigger>
                          <TabsTrigger value="content">Content</TabsTrigger>
                          <TabsTrigger value="students">Students</TabsTrigger>
                          <TabsTrigger value="analytics">Analytics</TabsTrigger>
                        </TabsList>
                        
                        <TabsContent value="overview" className="space-y-4">
                          <div className="grid grid-cols-2 gap-6">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Course Information</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                  <span>Instructor:</span>
                                  <span className="font-medium">{course.instructor}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Category:</span>
                                  <Badge>{course.category}</Badge>
                                </div>
                                <div className="flex justify-between">
                                  <span>Total Lessons:</span>
                                  <span className="font-medium">{course.lessonsCount}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Last Updated:</span>
                                  <span className="font-medium">{course.lastUpdated}</span>
                                </div>
                              </CardContent>
                            </Card>

                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Performance Metrics</CardTitle>
                              </CardHeader>
                              <CardContent className="space-y-3">
                                <div className="flex justify-between">
                                  <span>{t('enrolledStudents')}:</span>
                                  <span className="font-bold">{course.enrolledStudents}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{t('completionRate')}:</span>
                                  <span className="font-bold">{course.completionRate}%</span>
                                </div>
                                <div className="flex justify-between">
                                  <span>{t('averageRating')}:</span>
                                  <span className="font-bold flex items-center">
                                    <Star className="h-4 w-4 fill-yellow-400 text-yellow-400 mr-1" />
                                    {course.rating}/5.0
                                  </span>
                                </div>
                                <div className="flex justify-between">
                                  <span>Revenue:</span>
                                  <span className="font-bold">${(course.price * course.enrolledStudents).toLocaleString()}</span>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>

                        <TabsContent value="content" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Course Modules</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="space-y-3">
                                {(course.modules || []).map((module, idx) => (
                                  <div key={module.id} className="border rounded-lg p-4">
                                    <div className="flex items-center justify-between">
                                      <div>
                                        <h4 className="font-medium">{module.title}</h4>
                                        <p className="text-sm text-gray-600">
                                          {module.lessons} lessons • {module.duration}
                                        </p>
                                      </div>
                                      <div className="flex gap-2">
                                        <Button variant="outline" size="sm">
                                          <Edit3 className="h-4 w-4" />
                                        </Button>
                                        <Button variant="outline" size="sm">
                                          <Play className="h-4 w-4" />
                                        </Button>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="students" className="space-y-4">
                          <Card>
                            <CardHeader>
                              <CardTitle>Enrolled Students</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-center py-8">
                                <Users className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                                <p className="text-gray-600">Student management interface would be implemented here</p>
                                <p className="text-sm text-gray-500 mt-2">
                                  {course.enrolledStudents} students currently enrolled
                                </p>
                              </div>
                            </CardContent>
                          </Card>
                        </TabsContent>

                        <TabsContent value="analytics" className="space-y-4">
                          <div className="grid grid-cols-3 gap-4">
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Engagement Rate</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">78%</div>
                                <p className="text-sm text-gray-600">Average lesson completion</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Drop-off Rate</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">22%</div>
                                <p className="text-sm text-gray-600">Students who discontinue</p>
                              </CardContent>
                            </Card>
                            <Card>
                              <CardHeader>
                                <CardTitle className="text-lg">Time Spent</CardTitle>
                              </CardHeader>
                              <CardContent>
                                <div className="text-2xl font-bold">4.2h</div>
                                <p className="text-sm text-gray-600">Average per week</p>
                              </CardContent>
                            </Card>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </DialogContent>
                  </Dialog>

                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Edit3 className="h-4 w-4 mr-1" />
                        Edit
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Edit Course: {course.title}</DialogTitle>
                        <DialogDescription>
                          Update course information and settings
                        </DialogDescription>
                      </DialogHeader>
                      <EditCourseForm course={course} onSuccess={() => {
                        // Refresh courses list
                        window.location.reload();
                      }} />
                    </DialogContent>
                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">67</div>
            <p className="text-xs text-green-600">+8 new this month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3,842</div>
            <p className="text-xs text-green-600">+234 this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Avg. Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78%</div>
            <p className="text-xs text-yellow-600">-2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Course Revenue</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">$127k</div>
            <p className="text-xs text-green-600">+15% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}