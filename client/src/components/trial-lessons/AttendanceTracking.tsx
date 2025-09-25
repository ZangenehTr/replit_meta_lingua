import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { format } from "date-fns";
import { 
  Clock, 
  CheckCircle, 
  XCircle, 
  AlertTriangle, 
  User, 
  GraduationCap, 
  Target,
  FileText,
  Phone,
  Mail,
  Calendar,
  Star,
  MessageSquare
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

interface TrialLesson {
  id: number;
  studentName: string;
  studentPhone: string;
  studentEmail: string;
  scheduledDate: string;
  scheduledStartTime: string;
  scheduledEndTime: string;
  lessonType: 'in_person' | 'online' | 'phone';
  targetLanguage: string;
  bookingStatus: 'pending' | 'confirmed' | 'completed' | 'cancelled' | 'no_show';
  attendanceStatus?: 'pending' | 'attended' | 'no_show' | 'late' | 'early_departure';
  assignedTeacherId?: number;
  assignedTeacherName?: string;
  notes?: string;
  checkedInAt?: string;
  checkedInBy?: number;
  actualStartTime?: string;
  actualEndTime?: string;
  outcome?: TrialLessonOutcome;
}

interface TrialLessonOutcome {
  id: number;
  trialLessonId: number;
  teacherId: number;
  studentLevel: string;
  studentStrengths: string;
  studentWeaknesses: string;
  lessonSummary: string;
  teacherFeedback: string;
  studentEngagement: number;
  recommendedCourse?: string;
  recommendedLevel?: string;
  nextSteps: string;
  convertedToEnrollment: boolean;
  studentSatisfaction?: number;
  followUpRequired: boolean;
  followUpNotes?: string;
}

// Form schemas
const checkInSchema = z.object({
  notes: z.string().optional(),
  actualStartTime: z.string().optional()
});

const outcomeSchema = z.object({
  studentLevel: z.enum(['beginner', 'elementary', 'pre_intermediate', 'intermediate', 'upper_intermediate', 'advanced']),
  studentStrengths: z.string().min(10, "Please provide detailed strengths"),
  studentWeaknesses: z.string().min(10, "Please provide areas for improvement"),
  lessonSummary: z.string().min(20, "Please provide a detailed lesson summary"),
  teacherFeedback: z.string().min(20, "Please provide detailed feedback"),
  studentEngagement: z.number().min(1).max(10),
  recommendedCourse: z.string().optional(),
  recommendedLevel: z.string().optional(),
  nextSteps: z.string().min(10, "Please provide next steps"),
  convertedToEnrollment: z.boolean(),
  studentSatisfaction: z.number().min(1).max(10).optional(),
  followUpRequired: z.boolean(),
  followUpNotes: z.string().optional()
});

type CheckInForm = z.infer<typeof checkInSchema>;
type OutcomeForm = z.infer<typeof outcomeSchema>;

interface AttendanceTrackingProps {
  className?: string;
}

export function AttendanceTracking({ className }: AttendanceTrackingProps) {
  const [selectedLesson, setSelectedLesson] = useState<TrialLesson | null>(null);
  const [checkInDialogOpen, setCheckInDialogOpen] = useState(false);
  const [outcomeDialogOpen, setOutcomeDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("pending");

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch trial lessons for attendance tracking
  const { data: lessons = [], isLoading } = useQuery<TrialLesson[]>({
    queryKey: ['/api/trial-lessons', 'attendance'],
    queryFn: async () => {
      const today = new Date().toISOString().split('T')[0];
      const response = await fetch(`/api/trial-lessons?dateFrom=${today}&dateTo=${today}&status=confirmed`);
      const data = await response.json();
      return data.lessons || [];
    },
    refetchInterval: 30000 // Refresh every 30 seconds
  });

  // Check-in form
  const checkInForm = useForm<CheckInForm>({
    resolver: zodResolver(checkInSchema),
    defaultValues: {
      notes: "",
      actualStartTime: new Date().toTimeString().slice(0, 5)
    }
  });

  // Outcome form
  const outcomeForm = useForm<OutcomeForm>({
    resolver: zodResolver(outcomeSchema),
    defaultValues: {
      studentLevel: "beginner",
      studentStrengths: "",
      studentWeaknesses: "",
      lessonSummary: "",
      teacherFeedback: "",
      studentEngagement: 8,
      recommendedCourse: "",
      recommendedLevel: "",
      nextSteps: "",
      convertedToEnrollment: false,
      studentSatisfaction: 8,
      followUpRequired: false,
      followUpNotes: ""
    }
  });

  // Check-in mutation
  const checkInMutation = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: number; data: CheckInForm }) => {
      return apiRequest(`/api/trial-lessons/${lessonId}/checkin`, {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      toast({
        title: "Student checked in successfully",
        description: "Trial lesson has been marked as attended.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      setCheckInDialogOpen(false);
      setSelectedLesson(null);
      checkInForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Check-in failed",
        description: error.message || "Failed to check in student.",
        variant: "destructive"
      });
    }
  });

  // Complete lesson mutation
  const completeLessonMutation = useMutation({
    mutationFn: async ({ lessonId, data }: { lessonId: number; data: OutcomeForm }) => {
      return apiRequest(`/api/trial-lessons/${lessonId}/complete`, {
        method: 'POST',
        body: JSON.stringify({ outcomeData: data })
      });
    },
    onSuccess: () => {
      toast({
        title: "Trial lesson completed",
        description: "Outcome has been recorded successfully.",
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
      setOutcomeDialogOpen(false);
      setSelectedLesson(null);
      outcomeForm.reset();
    },
    onError: (error: any) => {
      toast({
        title: "Failed to complete lesson",
        description: error.message || "Failed to record lesson outcome.",
        variant: "destructive"
      });
    }
  });

  // Mark no-show mutation
  const markNoShowMutation = useMutation({
    mutationFn: async (lessonId: number) => {
      return apiRequest(`/api/trial-lessons/${lessonId}`, {
        method: 'PUT',
        body: JSON.stringify({ 
          attendanceStatus: 'no_show',
          bookingStatus: 'cancelled' 
        })
      });
    },
    onSuccess: () => {
      toast({
        title: "Marked as no-show",
        description: "Student has been marked as no-show.",
        variant: "destructive"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/trial-lessons'] });
    }
  });

  // Filter lessons by status
  const pendingLessons = lessons.filter(l => l.attendanceStatus === 'pending' || !l.attendanceStatus);
  const attendedLessons = lessons.filter(l => l.attendanceStatus === 'attended');
  const noShowLessons = lessons.filter(l => l.attendanceStatus === 'no_show');
  const completedLessons = lessons.filter(l => l.bookingStatus === 'completed');

  // Get status color
  const getStatusColor = (status: string) => {
    switch (status) {
      case 'attended': return 'bg-green-100 text-green-800';
      case 'no_show': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const handleCheckIn = (lesson: TrialLesson) => {
    setSelectedLesson(lesson);
    setCheckInDialogOpen(true);
  };

  const handleRecordOutcome = (lesson: TrialLesson) => {
    setSelectedLesson(lesson);
    setOutcomeDialogOpen(true);
  };

  const handleMarkNoShow = (lessonId: number) => {
    if (confirm('Are you sure you want to mark this student as no-show?')) {
      markNoShowMutation.mutate(lessonId);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-4" data-testid="attendance-loading">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-100 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-16 bg-gray-100 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6" data-testid="attendance-tracking">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold">Attendance Tracking</h2>
        <p className="text-muted-foreground">
          Track student attendance and record trial lesson outcomes
        </p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600" data-testid="stat-pending">
              {pendingLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">Awaiting check-in</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Attended</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600" data-testid="stat-attended">
              {attendedLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">Checked in today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">No Shows</CardTitle>
            <XCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600" data-testid="stat-no-shows">
              {noShowLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">Did not attend</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Completed</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600" data-testid="stat-completed">
              {completedLessons.length}
            </div>
            <p className="text-xs text-muted-foreground">With outcomes recorded</p>
          </CardContent>
        </Card>
      </div>

      {/* Attendance Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="pending" data-testid="tab-pending">
            Pending ({pendingLessons.length})
          </TabsTrigger>
          <TabsTrigger value="attended" data-testid="tab-attended">
            Attended ({attendedLessons.length})
          </TabsTrigger>
          <TabsTrigger value="no-shows" data-testid="tab-no-shows">
            No Shows ({noShowLessons.length})
          </TabsTrigger>
          <TabsTrigger value="completed" data-testid="tab-completed">
            Completed ({completedLessons.length})
          </TabsTrigger>
        </TabsList>

        {/* Pending Lessons */}
        <TabsContent value="pending" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Pending Check-ins</CardTitle>
              <CardDescription>Students expected to attend trial lessons today</CardDescription>
            </CardHeader>
            <CardContent>
              {pendingLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No pending check-ins for today
                </div>
              ) : (
                <div className="space-y-3">
                  {pendingLessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-4 border rounded-lg"
                      data-testid={`pending-lesson-${lesson.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{lesson.studentName}</h3>
                          <Badge className="capitalize">
                            {lesson.targetLanguage}
                          </Badge>
                          <Badge variant="outline" className={getStatusColor(lesson.attendanceStatus || 'pending')}>
                            Pending
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center space-x-4">
                            <div className="flex items-center space-x-1">
                              <Clock className="h-3 w-3" />
                              <span>{lesson.scheduledStartTime} - {lesson.scheduledEndTime}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <User className="h-3 w-3" />
                              <span>{lesson.assignedTeacherName}</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <Phone className="h-3 w-3" />
                              <span>{lesson.studentPhone}</span>
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          onClick={() => handleCheckIn(lesson)}
                          className="bg-green-600 hover:bg-green-700"
                          data-testid={`btn-checkin-${lesson.id}`}
                        >
                          <CheckCircle className="h-4 w-4 mr-1" />
                          Check In
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          onClick={() => handleMarkNoShow(lesson.id)}
                          data-testid={`btn-noshow-${lesson.id}`}
                        >
                          <XCircle className="h-4 w-4 mr-1" />
                          No Show
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Attended Lessons */}
        <TabsContent value="attended" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Attended Lessons</CardTitle>
              <CardDescription>Students who have checked in and need outcome recording</CardDescription>
            </CardHeader>
            <CardContent>
              {attendedLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No attended lessons today
                </div>
              ) : (
                <div className="space-y-3">
                  {attendedLessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-green-50"
                      data-testid={`attended-lesson-${lesson.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{lesson.studentName}</h3>
                          <Badge className="capitalize">
                            {lesson.targetLanguage}
                          </Badge>
                          <Badge className={getStatusColor('attended')}>
                            Attended
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>Checked in at: {lesson.checkedInAt ? format(new Date(lesson.checkedInAt), 'HH:mm') : 'N/A'}</p>
                          <p>Teacher: {lesson.assignedTeacherName}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        {lesson.bookingStatus !== 'completed' && (
                          <Button
                            size="sm"
                            onClick={() => handleRecordOutcome(lesson)}
                            className="bg-blue-600 hover:bg-blue-700"
                            data-testid={`btn-outcome-${lesson.id}`}
                          >
                            <FileText className="h-4 w-4 mr-1" />
                            Record Outcome
                          </Button>
                        )}
                        {lesson.bookingStatus === 'completed' && (
                          <Badge className="bg-blue-500 text-white">
                            Outcome Recorded
                          </Badge>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* No Shows */}
        <TabsContent value="no-shows" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="text-red-600">No Shows</CardTitle>
              <CardDescription>Students who did not attend their scheduled trial lessons</CardDescription>
            </CardHeader>
            <CardContent>
              {noShowLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No no-shows today
                </div>
              ) : (
                <div className="space-y-3">
                  {noShowLessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-4 border border-red-200 rounded-lg bg-red-50"
                      data-testid={`noshow-lesson-${lesson.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold text-red-800">{lesson.studentName}</h3>
                          <Badge className="capitalize">
                            {lesson.targetLanguage}
                          </Badge>
                          <Badge className={getStatusColor('no_show')}>
                            No Show
                          </Badge>
                        </div>
                        <div className="mt-1 text-sm text-red-700">
                          <p>Scheduled: {lesson.scheduledStartTime} - {lesson.scheduledEndTime}</p>
                          <p>Teacher: {lesson.assignedTeacherName}</p>
                          <p>Contact: {lesson.studentPhone}</p>
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="border-red-300 text-red-700"
                          data-testid={`btn-reschedule-${lesson.id}`}
                        >
                          <Calendar className="h-4 w-4 mr-1" />
                          Reschedule
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Completed Lessons */}
        <TabsContent value="completed" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Completed Lessons</CardTitle>
              <CardDescription>Lessons with recorded outcomes</CardDescription>
            </CardHeader>
            <CardContent>
              {completedLessons.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No completed lessons today
                </div>
              ) : (
                <div className="space-y-3">
                  {completedLessons.map((lesson) => (
                    <div 
                      key={lesson.id} 
                      className="flex items-center justify-between p-4 border rounded-lg bg-blue-50"
                      data-testid={`completed-lesson-${lesson.id}`}
                    >
                      <div className="flex-1">
                        <div className="flex items-center space-x-3">
                          <h3 className="font-semibold">{lesson.studentName}</h3>
                          <Badge className="capitalize">
                            {lesson.targetLanguage}
                          </Badge>
                          <Badge className={getStatusColor('completed')}>
                            Completed
                          </Badge>
                          {lesson.outcome?.convertedToEnrollment && (
                            <Badge className="bg-green-500 text-white">
                              <Target className="h-3 w-3 mr-1" />
                              Converted
                            </Badge>
                          )}
                        </div>
                        <div className="mt-1 text-sm text-gray-600">
                          <p>Teacher: {lesson.assignedTeacherName}</p>
                          {lesson.outcome && (
                            <p>Level: {lesson.outcome.studentLevel} | Engagement: {lesson.outcome.studentEngagement}/10</p>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          data-testid={`btn-view-outcome-${lesson.id}`}
                        >
                          <FileText className="h-4 w-4 mr-1" />
                          View Outcome
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Check-in Dialog */}
      <Dialog open={checkInDialogOpen} onOpenChange={setCheckInDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Check In Student</DialogTitle>
            <DialogDescription>
              Mark {selectedLesson?.studentName} as present for their trial lesson
            </DialogDescription>
          </DialogHeader>
          
          <Form {...checkInForm}>
            <form onSubmit={checkInForm.handleSubmit((data) => selectedLesson && checkInMutation.mutate({ lessonId: selectedLesson.id, data }))}>
              <div className="space-y-4">
                <FormField
                  control={checkInForm.control}
                  name="actualStartTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Actual Start Time</FormLabel>
                      <FormControl>
                        <Input {...field} type="time" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={checkInForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Check-in Notes</FormLabel>
                      <FormControl>
                        <Textarea
                          {...field}
                          placeholder="Any notes about the student's arrival..."
                          rows={3}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setCheckInDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={checkInMutation.isPending}>
                  {checkInMutation.isPending ? "Checking In..." : "Check In"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Outcome Recording Dialog */}
      <Dialog open={outcomeDialogOpen} onOpenChange={setOutcomeDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Record Trial Lesson Outcome</DialogTitle>
            <DialogDescription>
              Record the outcome and assessment for {selectedLesson?.studentName}'s trial lesson
            </DialogDescription>
          </DialogHeader>
          
          <Form {...outcomeForm}>
            <form onSubmit={outcomeForm.handleSubmit((data) => selectedLesson && completeLessonMutation.mutate({ lessonId: selectedLesson.id, data }))}>
              <div className="space-y-6">
                {/* Student Assessment */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Student Assessment</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={outcomeForm.control}
                      name="studentLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Assessed Level *</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select level" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="beginner">Beginner</SelectItem>
                              <SelectItem value="elementary">Elementary</SelectItem>
                              <SelectItem value="pre_intermediate">Pre-Intermediate</SelectItem>
                              <SelectItem value="intermediate">Intermediate</SelectItem>
                              <SelectItem value="upper_intermediate">Upper-Intermediate</SelectItem>
                              <SelectItem value="advanced">Advanced</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={outcomeForm.control}
                      name="studentEngagement"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student Engagement (1-10)</FormLabel>
                          <FormControl>
                            <Input 
                              {...field} 
                              type="number" 
                              min="1" 
                              max="10"
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={outcomeForm.control}
                    name="studentStrengths"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Strengths *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What did the student do well? What are their strengths?"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outcomeForm.control}
                    name="studentWeaknesses"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Areas for Improvement *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What areas need improvement? What should the student work on?"
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Lesson Summary */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Lesson Summary</h3>
                  
                  <FormField
                    control={outcomeForm.control}
                    name="lessonSummary"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lesson Summary *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Summarize what was covered in the lesson..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outcomeForm.control}
                    name="teacherFeedback"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Teacher Feedback *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Overall feedback about the student and lesson..."
                            rows={4}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Recommendations */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Recommendations</h3>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={outcomeForm.control}
                      name="recommendedCourse"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommended Course</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Course recommendation..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={outcomeForm.control}
                      name="recommendedLevel"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Recommended Level</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Level recommendation..."
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={outcomeForm.control}
                    name="nextSteps"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Next Steps *</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="What should happen next? Follow-up actions..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <Separator />

                {/* Conversion and Follow-up */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold">Conversion & Follow-up</h3>
                  
                  <FormField
                    control={outcomeForm.control}
                    name="convertedToEnrollment"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-2"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Student enrolled after trial lesson
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outcomeForm.control}
                    name="studentSatisfaction"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Student Satisfaction (1-10)</FormLabel>
                        <FormControl>
                          <Input 
                            {...field} 
                            type="number" 
                            min="1" 
                            max="10"
                            onChange={(e) => field.onChange(Number(e.target.value))}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outcomeForm.control}
                    name="followUpRequired"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <input
                            type="checkbox"
                            checked={field.value}
                            onChange={field.onChange}
                            className="mt-2"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel>
                            Follow-up required
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={outcomeForm.control}
                    name="followUpNotes"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Follow-up Notes</FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Follow-up notes and action items..."
                            rows={3}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-2 mt-6">
                <Button type="button" variant="outline" onClick={() => setOutcomeDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={completeLessonMutation.isPending}>
                  {completeLessonMutation.isPending ? "Recording..." : "Record Outcome"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}