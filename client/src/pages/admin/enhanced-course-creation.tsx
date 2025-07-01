import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Checkbox } from "@/components/ui/checkbox";
import { CalendarDays, Timer, MapPin, Plus, Trash2, Calculator, Clock, BookOpen, Users } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { calculateSessionDates, formatDuration, validateWeeklySchedule, formatDateByCalendar, type WeeklySchedule } from "@/lib/calendar";

const enhancedCourseSchema = z.object({
  // Basic Information
  courseCode: z.string().min(2, "Course code is required"),
  title: z.string().min(2, "Title must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  shortDescription: z.string().min(5, "Short description must be at least 5 characters"),
  instructorId: z.string().min(1, "Instructor is required"),
  price: z.number().min(0, "Price must be positive"),
  currency: z.string().default("IRR"),
  
  // Duration and Sessions
  totalHours: z.number().min(1, "Total hours must be at least 1"),
  sessionDurationMinutes: z.number().min(30, "Session duration must be at least 30 minutes"),
  
  // Course Format
  deliveryMode: z.enum(["online", "in_person", "self_paced"]),
  classFormat: z.enum(["group", "one_on_one"]),
  maxStudents: z.number().optional(),
  
  // Scheduling (for online and in-person courses)
  firstSessionDate: z.string().optional(),
  weeklySchedule: z.array(z.object({
    day: z.string(),
    startTime: z.string(),
    endTime: z.string()
  })).optional(),
  timeZone: z.string().default("Asia/Tehran"),
  calendarType: z.enum(["gregorian", "persian"]).default("gregorian"),
  
  // Course Details
  category: z.string().min(1, "Category is required"),
  targetLanguage: z.string().min(1, "Target language is required"),
  targetLevel: z.array(z.string()).min(1, "At least one target level is required"),
  difficulty: z.enum(["beginner", "intermediate", "advanced"]),
  tags: z.array(z.string()).optional(),
  prerequisites: z.array(z.string()).optional(),
  learningObjectives: z.array(z.string()).optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
});

type EnhancedCourseFormData = z.infer<typeof enhancedCourseSchema>;

const WEEKDAYS = [
  { value: "monday", label: "Monday", labelFa: "دوشنبه" },
  { value: "tuesday", label: "Tuesday", labelFa: "سه‌شنبه" },
  { value: "wednesday", label: "Wednesday", labelFa: "چهارشنبه" },
  { value: "thursday", label: "Thursday", labelFa: "پنج‌شنبه" },
  { value: "friday", label: "Friday", labelFa: "جمعه" },
  { value: "saturday", label: "Saturday", labelFa: "شنبه" },
  { value: "sunday", label: "Sunday", labelFa: "یکشنبه" }
];

const COMMON_SESSION_DURATIONS = [
  { minutes: 60, label: "1 hour" },
  { minutes: 90, label: "1.5 hours" },
  { minutes: 120, label: "2 hours" },
  { minutes: 150, label: "2.5 hours" },
  { minutes: 180, label: "3 hours" }
];

export function EnhancedCourseCreation() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [weeklySchedule, setWeeklySchedule] = useState<WeeklySchedule[]>([]);
  const [sessionCalculations, setSessionCalculations] = useState<any>(null);
  const [scheduleErrors, setScheduleErrors] = useState<string[]>([]);

  // Fetch instructors for dropdown
  const { data: instructors = [] } = useQuery({
    queryKey: ['/api/teachers/list'],
    select: (data: any) => data || []
  });

  const form = useForm<EnhancedCourseFormData>({
    resolver: zodResolver(enhancedCourseSchema),
    defaultValues: {
      courseCode: "",
      title: "",
      description: "",
      shortDescription: "",
      instructorId: "",
      price: 0,
      currency: "IRR",
      totalHours: 1,
      sessionDurationMinutes: 90,
      deliveryMode: "online",
      classFormat: "group",
      timeZone: "Asia/Tehran",
      calendarType: "gregorian",
      category: "",
      targetLanguage: "persian",
      targetLevel: [],
      difficulty: "beginner",
      tags: [],
      prerequisites: [],
      learningObjectives: [],
      isActive: true,
      isFeatured: false,
    }
  });

  const createCourseMutation = useMutation({
    mutationFn: async (data: EnhancedCourseFormData) => {
      const courseData = {
        ...data,
        instructorId: parseInt(data.instructorId),
        weeklySchedule: data.deliveryMode !== "self_paced" ? weeklySchedule : undefined,
        sessionCalculations: sessionCalculations
      };
      return apiRequest("/api/admin/courses", {
        method: "POST",
        body: JSON.stringify(courseData),
      });
    },
    onSuccess: () => {
      toast({
        title: "Course Created",
        description: "The course has been successfully created with scheduling.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/courses'] });
      form.reset();
      setWeeklySchedule([]);
      setSessionCalculations(null);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    },
  });

  const totalHours = form.watch("totalHours");
  const sessionDurationMinutes = form.watch("sessionDurationMinutes");
  const firstSessionDate = form.watch("firstSessionDate");
  const deliveryMode = form.watch("deliveryMode");

  // Calculate sessions when relevant fields change
  useEffect(() => {
    if (deliveryMode !== "self_paced" && totalHours && sessionDurationMinutes && firstSessionDate && weeklySchedule.length > 0) {
      const errors = validateWeeklySchedule(weeklySchedule);
      setScheduleErrors(errors);
      
      if (errors.length === 0) {
        const calculations = calculateSessionDates(
          totalHours,
          sessionDurationMinutes,
          new Date(firstSessionDate),
          weeklySchedule
        );
        setSessionCalculations(calculations);
      } else {
        setSessionCalculations(null);
      }
    } else {
      setSessionCalculations(null);
    }
  }, [totalHours, sessionDurationMinutes, firstSessionDate, deliveryMode, weeklySchedule]);

  const addWeeklySession = () => {
    setWeeklySchedule([...weeklySchedule, { day: "", startTime: "", endTime: "" }]);
  };

  const removeWeeklySession = (index: number) => {
    setWeeklySchedule(weeklySchedule.filter((_, i) => i !== index));
  };

  const updateWeeklySession = (index: number, field: keyof WeeklySchedule, value: string) => {
    const updated = [...weeklySchedule];
    updated[index] = { ...updated[index], [field]: value };
    
    // Auto-calculate end time when start time is set
    if (field === 'startTime' && value && sessionDurationMinutes) {
      const [hours, minutes] = value.split(':').map(Number);
      const startMinutes = hours * 60 + minutes;
      const endMinutes = startMinutes + sessionDurationMinutes;
      
      const endHours = Math.floor(endMinutes / 60);
      const endMins = endMinutes % 60;
      
      // Format as HH:MM
      const endTime = `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
      updated[index].endTime = endTime;
    }
    
    setWeeklySchedule(updated);
  };

  const onSubmit = (data: EnhancedCourseFormData) => {
    createCourseMutation.mutate(data);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Course</h1>
          <p className="text-muted-foreground">Create a comprehensive language course with automatic session scheduling</p>
        </div>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <Tabs defaultValue="basic" className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="scheduling">Scheduling</TabsTrigger>
              <TabsTrigger value="details">Course Details</TabsTrigger>
              <TabsTrigger value="review">Review</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Basic Course Information
                  </CardTitle>
                  <CardDescription>
                    Set up the fundamental details of your course
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="courseCode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course Code</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., PER101" {...field} />
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
                          <FormLabel>Category</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Language Learning">Language Learning</SelectItem>
                              <SelectItem value="Persian Language">Persian Language</SelectItem>
                              <SelectItem value="Conversation">Conversation</SelectItem>
                              <SelectItem value="Grammar">Grammar</SelectItem>
                              <SelectItem value="Writing">Writing</SelectItem>
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
                        <FormLabel>Course Title</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., Persian Language Fundamentals" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="shortDescription"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Short Description</FormLabel>
                        <FormControl>
                          <Input placeholder="Brief summary for course listings" {...field} />
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
                        <FormLabel>Full Description</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Detailed course description..."
                            className="min-h-[100px]"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="instructorId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Instructor</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select instructor" />
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
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="price"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Price (IRR)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="0"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <Separator />

                  <div className="space-y-4">
                    <h4 className="font-medium flex items-center gap-2">
                      <Timer className="h-4 w-4" />
                      Duration & Sessions
                    </h4>
                    
                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="totalHours"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Total Course Hours</FormLabel>
                            <FormControl>
                              <Input 
                                type="number" 
                                placeholder="60"
                                {...field}
                                onChange={(e) => field.onChange(Number(e.target.value))}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="sessionDurationMinutes"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Session Duration</FormLabel>
                            <Select onValueChange={(value) => field.onChange(Number(value))} defaultValue={field.value?.toString()}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select duration" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                {COMMON_SESSION_DURATIONS.map((duration) => (
                                  <SelectItem key={duration.minutes} value={duration.minutes.toString()}>
                                    {duration.label} ({duration.minutes} min)
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    {totalHours && sessionDurationMinutes && (
                      <Alert>
                        <Calculator className="h-4 w-4" />
                        <AlertDescription>
                          <strong>Calculated Sessions:</strong> {Math.ceil((totalHours * 60) / sessionDurationMinutes)} sessions 
                          ({formatDuration(sessionDurationMinutes)} each)
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>

                  <Separator />

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="deliveryMode"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Delivery Mode</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select delivery mode" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="online">Online</SelectItem>
                              <SelectItem value="in_person">In-Person</SelectItem>
                              <SelectItem value="self_paced">Self-Paced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {deliveryMode !== "self_paced" && (
                      <FormField
                        control={form.control}
                        name="classFormat"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Class Format</FormLabel>
                            <Select onValueChange={field.onChange} defaultValue={field.value}>
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Select format" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="group">Group Class</SelectItem>
                                <SelectItem value="one_on_one">One-on-One</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}
                  </div>

                  {form.watch("classFormat") === "group" && (
                    <FormField
                      control={form.control}
                      name="maxStudents"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Maximum Students</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="10"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value) || undefined)}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="scheduling" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <CalendarDays className="h-5 w-5" />
                    Course Scheduling
                  </CardTitle>
                  <CardDescription>
                    {deliveryMode === "self_paced" 
                      ? "Self-paced courses don't require scheduling" 
                      : "Set up your course schedule and session times"
                    }
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  {deliveryMode === "self_paced" ? (
                    <Alert>
                      <Clock className="h-4 w-4" />
                      <AlertDescription>
                        Self-paced courses allow students to progress at their own speed. No scheduling is required.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <>
                      <div className="grid grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="firstSessionDate"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>First Session Date</FormLabel>
                              <FormControl>
                                <Input type="date" {...field} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="calendarType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Calendar Type</FormLabel>
                              <Select onValueChange={field.onChange} defaultValue={field.value}>
                                <FormControl>
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select calendar" />
                                  </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                  <SelectItem value="gregorian">Gregorian Calendar</SelectItem>
                                  <SelectItem value="persian">Persian Calendar</SelectItem>
                                </SelectContent>
                              </Select>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>

                      <Separator />

                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium">Weekly Schedule</h4>
                          <Button type="button" onClick={addWeeklySession} size="sm">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Session Time
                          </Button>
                        </div>
                        
                        <Alert>
                          <Clock className="h-4 w-4" />
                          <AlertDescription>
                            Just select the day and start time - end times are automatically calculated based on your {formatDuration(sessionDurationMinutes || 90)} session duration.
                          </AlertDescription>
                        </Alert>

                        {weeklySchedule.map((session, index) => (
                          <Card key={index} className="p-4">
                            <div className="grid grid-cols-4 gap-4 items-end">
                              <div>
                                <Label>Day of Week</Label>
                                <Select 
                                  value={session.day} 
                                  onValueChange={(value) => updateWeeklySession(index, 'day', value)}
                                >
                                  <SelectTrigger>
                                    <SelectValue placeholder="Select day" />
                                  </SelectTrigger>
                                  <SelectContent>
                                    {WEEKDAYS.map((day) => (
                                      <SelectItem key={day.value} value={day.value}>
                                        {day.label}
                                      </SelectItem>
                                    ))}
                                  </SelectContent>
                                </Select>
                              </div>

                              <div>
                                <Label>Start Time</Label>
                                <Input 
                                  type="time" 
                                  value={session.startTime}
                                  onChange={(e) => updateWeeklySession(index, 'startTime', e.target.value)}
                                />
                              </div>

                              <div>
                                <Label className="flex items-center gap-1">
                                  End Time 
                                  <span className="text-xs text-muted-foreground">(auto)</span>
                                </Label>
                                <Input 
                                  type="time" 
                                  value={session.endTime}
                                  readOnly
                                  disabled
                                  className="bg-gray-50 text-gray-600"
                                  title={`Auto-calculated based on ${formatDuration(sessionDurationMinutes || 90)} session duration`}
                                />
                              </div>

                              <Button 
                                type="button" 
                                variant="outline" 
                                size="sm"
                                onClick={() => removeWeeklySession(index)}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </Card>
                        ))}

                        {scheduleErrors.length > 0 && (
                          <Alert variant="destructive">
                            <AlertDescription>
                              <ul className="list-disc list-inside">
                                {scheduleErrors.map((error, index) => (
                                  <li key={index}>{error}</li>
                                ))}
                              </ul>
                            </AlertDescription>
                          </Alert>
                        )}

                        {sessionCalculations && (
                          <Alert>
                            <CalendarDays className="h-4 w-4" />
                            <AlertDescription>
                              <div className="space-y-2">
                                <p><strong>Course Schedule Summary:</strong></p>
                                <p>• Total Sessions: {sessionCalculations.totalSessions}</p>
                                <p>• Course End Date: {formatDateByCalendar(sessionCalculations.calculatedEndDate)}</p>
                                <p>• Duration: {formatDuration((form.watch("totalHours") || 0) * 60)} over {sessionCalculations.sessionDates.length} sessions</p>
                              </div>
                            </AlertDescription>
                          </Alert>
                        )}
                      </div>
                    </>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="details" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Course Details</CardTitle>
                  <CardDescription>Language, difficulty, and additional course information</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="targetLanguage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Target Language</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select language" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="persian">Persian (فارسی)</SelectItem>
                              <SelectItem value="english">English</SelectItem>
                              <SelectItem value="arabic">Arabic</SelectItem>
                              <SelectItem value="turkish">Turkish</SelectItem>
                              <SelectItem value="french">French</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="difficulty"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Difficulty Level</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select difficulty" />
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
                            <SelectItem value="general">General Language</SelectItem>
                            <SelectItem value="business">Business Language</SelectItem>
                            <SelectItem value="academic">Academic Language</SelectItem>
                            <SelectItem value="conversation">Conversation Practice</SelectItem>
                            <SelectItem value="grammar">Grammar Focus</SelectItem>
                            <SelectItem value="writing">Writing Skills</SelectItem>
                            <SelectItem value="speaking">Speaking Skills</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex items-center space-x-4">
                    <FormField
                      control={form.control}
                      name="isActive"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Active Course
                          </FormLabel>
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="isFeatured"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-center space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <FormLabel className="font-normal">
                            Featured Course
                          </FormLabel>
                        </FormItem>
                      )}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="review" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Review & Submit</CardTitle>
                  <CardDescription>Review your course details before submitting</CardDescription>
                </CardHeader>
                <CardContent>
                  {sessionCalculations && (
                    <div className="space-y-4">
                      <Alert>
                        <CalendarDays className="h-4 w-4" />
                        <AlertDescription>
                          <div className="space-y-2">
                            <p><strong>Course Schedule Preview:</strong></p>
                            <div className="grid grid-cols-2 gap-4 text-sm">
                              <div>
                                <p>• Total Hours: {form.watch("totalHours")}</p>
                                <p>• Session Duration: {formatDuration(form.watch("sessionDurationMinutes") || 60)}</p>
                                <p>• Total Sessions: {sessionCalculations.totalSessions}</p>
                              </div>
                              <div>
                                <p>• Start Date: {form.watch("firstSessionDate")}</p>
                                <p>• End Date: {formatDateByCalendar(sessionCalculations.calculatedEndDate)}</p>
                                <p>• Weekly Sessions: {weeklySchedule.length}</p>
                              </div>
                            </div>
                          </div>
                        </AlertDescription>
                      </Alert>
                    </div>
                  )}

                  <Separator className="my-6" />

                  <Button type="submit" className="w-full" disabled={createCourseMutation.isPending}>
                    {createCourseMutation.isPending && <Timer className="mr-2 h-4 w-4 animate-spin" />}
                    Create Course with Schedule
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </form>
      </Form>
    </div>
  );
}