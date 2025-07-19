import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  GraduationCap, 
  ClipboardCheck, 
  TrendingUp, 
  UserCheck, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Target,
  BookOpen,
  Star
} from "lucide-react";
import ScheduleObservationReview from "@/components/supervision/ScheduleObservationReview";

interface SupervisorStats {
  totalTeachers: number;
  totalStudents: number;
  activeClasses: number;
  completionRate: number;
  qualityScore: number;
  pendingObservations: number;
  teacherRating: number;
  studentRetention: number;
}

// Schema for observation form (aligned with database structure)
const observationSchema = z.object({
  sessionId: z.number().min(1, "Please select a session"),
  teacherId: z.number().min(1, "Please select a teacher"),
  observationType: z.enum(['live_online', 'live_in_person', 'recorded']),
  teachingMethodology: z.number().min(1).max(5),
  classroomManagement: z.number().min(1).max(5),
  studentEngagement: z.number().min(1).max(5),
  contentDelivery: z.number().min(1).max(5),
  languageSkills: z.number().min(1).max(5),
  timeManagement: z.number().min(1).max(5),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  notes: z.string().optional(),
  followUpRequired: z.boolean().default(false),
});

export default function SupervisorDashboard() {
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [scheduleReviewDialogOpen, setScheduleReviewDialogOpen] = useState(false);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const { data: stats, isLoading } = useQuery<SupervisorStats>({
    queryKey: ["/api/supervisor/dashboard-stats"],
  });

  const { data: recentObservations } = useQuery({
    queryKey: ["/api/supervision/recent-observations"],
  });

  const { data: teacherPerformance } = useQuery({
    queryKey: ["/api/supervision/teacher-performance"],
  });

  // Fetch live sessions for observation form
  const { data: liveSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions'],
  });

  // Fetch recorded sessions for observation form
  const { data: recordedSessions } = useQuery({
    queryKey: ['/api/supervision/live-sessions', 'completed'],
  });

  // Fetch all teachers for the form with proper error handling
  const { data: allTeachers, isLoading: teachersLoading, error: teachersError } = useQuery({
    queryKey: ['/api/teachers/list'],
    select: (data: any[]) => {
      console.log('Raw teachers data:', data);
      const filtered = data?.filter(user => user.role === 'Teacher/Tutor') || [];
      console.log('Filtered teachers:', filtered);
      return filtered;
    },
  });

  // Observation form
  const observationForm = useForm({
    resolver: zodResolver(observationSchema),
    defaultValues: {
      sessionId: 0,
      teacherId: 0,
      observationType: 'live_online' as const,
      teachingMethodology: 1,
      classroomManagement: 1,
      studentEngagement: 1,
      contentDelivery: 1,
      languageSkills: 1,
      timeManagement: 1,
      strengths: '',
      areasForImprovement: '',
      notes: '',
      followUpRequired: false,
    },
  });

  // Create observation mutation
  const createObservationMutation = useMutation({
    mutationFn: async (data: any) => {
      try {
        const result = await apiRequest('/api/supervision/observations', 'POST', data);
        console.log('Observation creation result:', result);
        return result;
      } catch (error) {
        console.error('Observation creation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/recent-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervisor/dashboard-stats'] });
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: "Success", description: "Observation created successfully" });
    },
    onError: (error: any) => {
      console.error('Mutation error:', error);
      const errorMessage = error?.message || "Failed to create observation";
      toast({ 
        title: "Error", 
        description: errorMessage, 
        variant: "destructive" 
      });
    },
  });

  const onObservationSubmit = (data: any) => {
    // Calculate overall score from individual scores
    const scoreFields = ['teachingMethodology', 'classroomManagement', 'studentEngagement', 'contentDelivery', 'languageSkills', 'timeManagement'];
    const totalScore = scoreFields.reduce((sum, field) => sum + data[field], 0);
    const overallScore = (totalScore / scoreFields.length).toFixed(2);
    
    // Transform data to match database schema
    const observationData = {
      teacherId: data.teacherId,
      supervisorId: 46, // Current supervisor
      sessionId: data.sessionId,
      observationType: data.observationType,
      overallScore: parseFloat(overallScore),
      strengths: data.strengths || '',
      areasForImprovement: data.areasForImprovement || '',
      notes: data.notes || '',
      followUpRequired: data.followUpRequired || false,
    };
    
    createObservationMutation.mutate(observationData);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="animate-pulse space-y-6">
            <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Supervision Dashboard</h1>
            <p className="text-gray-600 mt-2">Quality assurance and teacher performance monitoring</p>
          </div>
          <div className="flex space-x-3">
            <Button 
              className="bg-gradient-to-r from-purple-500 to-purple-600 hover:from-purple-600 hover:to-purple-700"
              onClick={() => setObservationDialogOpen(true)}
            >
              <ClipboardCheck className="h-4 w-4 mr-2" />
              New Observation
            </Button>
            <Button 
              variant="outline"
              onClick={() => setScheduleReviewDialogOpen(true)}
            >
              <Calendar className="h-4 w-4 mr-2" />
              Schedule Review
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-100">Total Teachers</p>
                  <p className="text-3xl font-bold">{stats?.totalTeachers || 15}</p>
                </div>
                <Users className="h-8 w-8 text-blue-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-100">Total Students</p>
                  <p className="text-3xl font-bold">{stats?.totalStudents || 142}</p>
                </div>
                <GraduationCap className="h-8 w-8 text-green-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-100">Quality Score</p>
                  <p className="text-3xl font-bold">{stats?.qualityScore || 98.5}%</p>
                </div>
                <Star className="h-8 w-8 text-orange-200" />
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-purple-100">Pending Reviews</p>
                  <p className="text-3xl font-bold">{stats?.pendingObservations || 3}</p>
                </div>
                <ClipboardCheck className="h-8 w-8 text-purple-200" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
            <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
            <TabsTrigger value="schedule">Schedule Review</TabsTrigger>
            <TabsTrigger value="management">Management Tools</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Performance Metrics */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="h-5 w-5 mr-2 text-green-600" />
                    Performance Metrics
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Teacher Rating</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.teacherRating || 4.7}/5.0</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">Excellent</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Student Retention</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.studentRetention || 92.1}%</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">High</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-gray-600">Completion Rate</span>
                    <div className="flex items-center">
                      <span className="font-semibold mr-2">{stats?.completionRate || 87.3}%</span>
                      <Badge variant="secondary" className="bg-purple-100 text-purple-800">Good</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recent Activities */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Clock className="h-5 w-5 mr-2 text-blue-600" />
                    Recent Activities
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center space-x-3">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Completed observation: Sarah Johnson (Persian A2)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <AlertTriangle className="h-4 w-4 text-yellow-500" />
                    <span className="text-sm">Pending review: Ali Rezaei (Persian B1)</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <UserCheck className="h-4 w-4 text-blue-500" />
                    <span className="text-sm">New teacher evaluation scheduled</span>
                  </div>
                  <div className="flex items-center space-x-3">
                    <BookOpen className="h-4 w-4 text-purple-500" />
                    <span className="text-sm">Curriculum review meeting tomorrow</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="teachers" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Teacher Performance Overview</CardTitle>
                <CardDescription>Monitor and evaluate teacher effectiveness</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center text-white font-semibold">
                        SJ
                      </div>
                      <div>
                        <p className="font-semibold">Sarah Johnson</p>
                        <p className="text-sm text-gray-600">Persian Language Teacher</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-green-100 text-green-800">4.9/5.0</Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center text-white font-semibold">
                        AR
                      </div>
                      <div>
                        <p className="font-semibold">Ali Rezaei</p>
                        <p className="text-sm text-gray-600">Persian Conversation Specialist</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <Badge className="bg-yellow-100 text-yellow-800">4.6/5.0</Badge>
                      <Button size="sm" variant="outline">View Details</Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="quality" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Class Observations</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <Button className="w-full" variant="outline">
                      <ClipboardCheck className="h-4 w-4 mr-2" />
                      Schedule New Observation
                    </Button>
                    <Button className="w-full" variant="outline">
                      <Calendar className="h-4 w-4 mr-2" />
                      View Observation Calendar
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Quality Metrics</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between">
                    <span>Teaching Standards Compliance</span>
                    <Badge className="bg-green-100 text-green-800">98.5%</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Student Satisfaction</span>
                    <Badge className="bg-blue-100 text-blue-800">4.8/5.0</Badge>
                  </div>
                  <div className="flex justify-between">
                    <span>Lesson Plan Quality</span>
                    <Badge className="bg-purple-100 text-purple-800">92.1%</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="management" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Users className="h-12 w-12 text-blue-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Teacher-Student Matching</h3>
                  <p className="text-sm text-gray-600 mb-4">Assign teachers to students based on compatibility</p>
                  <Button className="w-full">Access System</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <Calendar className="h-12 w-12 text-green-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Class Management</h3>
                  <p className="text-sm text-gray-600 mb-4">Schedule and manage class sessions</p>
                  <Button className="w-full">Manage Classes</Button>
                </CardContent>
              </Card>

              <Card className="cursor-pointer hover:shadow-lg transition-shadow">
                <CardContent className="p-6 text-center">
                  <ClipboardCheck className="h-12 w-12 text-purple-500 mx-auto mb-4" />
                  <h3 className="font-semibold mb-2">Quality Assurance</h3>
                  <p className="text-sm text-gray-600 mb-4">Monitor teaching quality and compliance</p>
                  <Button className="w-full">View Reports</Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="schedule" className="space-y-6">
            <ScheduleObservationReview />
          </TabsContent>
        </Tabs>
      </div>

      {/* New Observation Dialog */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Teacher Observation</DialogTitle>
          </DialogHeader>
          <Form {...observationForm}>
            <form onSubmit={observationForm.handleSubmit(onObservationSubmit)} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField
                  control={observationForm.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session *</FormLabel>
                      <Select onValueChange={value => field.onChange(+value)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachersLoading ? (
                            <SelectItem value="loading" disabled>Loading teachers...</SelectItem>
                          ) : allTeachers && allTeachers.length > 0 ? (
                            allTeachers.map((teacher: any) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName} - Session {teacher.id}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="observationType"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Observation Type *</FormLabel>
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="live_in_person">Live In-person</SelectItem>
                          <SelectItem value="live_online">Live Online</SelectItem>
                          <SelectItem value="recorded">Recorded Review</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              
              <div className="space-y-3">
                <FormField
                  control={observationForm.control}
                  name="teacherId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teacher *</FormLabel>
                      <Select onValueChange={value => field.onChange(+value)} value={field.value?.toString()}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select teacher" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {teachersLoading ? (
                            <SelectItem value="loading" disabled>Loading teachers...</SelectItem>
                          ) : allTeachers && allTeachers.length > 0 ? (
                            allTeachers.map((teacher: any) => (
                              <SelectItem key={teacher.id} value={teacher.id.toString()}>
                                {teacher.firstName} {teacher.lastName}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="no-teachers" disabled>No teachers available</SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-sm">Evaluation Scores (1-5)</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  <FormField
                    control={observationForm.control}
                    name="teachingMethodology"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Teaching Methodology</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="classroomManagement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Classroom Management</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="studentEngagement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Student Engagement</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="contentDelivery"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Content Delivery</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="languageSkills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Language Skills</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={observationForm.control}
                    name="timeManagement"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-xs">Time Management</FormLabel>
                        <FormControl>
                          <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
              </div>

              <div className="space-y-3">
                <FormField
                  control={observationForm.control}
                  name="strengths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strengths</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2}
                          placeholder="Note the teacher's strengths and positive observations..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="areasForImprovement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Areas for Improvement</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2}
                          placeholder="Identify areas where the teacher can improve..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="notes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Additional Notes</FormLabel>
                      <FormControl>
                        <Textarea 
                          rows={2}
                          placeholder="Additional observations and notes..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="followUpRequired"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <input
                          type="checkbox"
                          checked={field.value}
                          onChange={field.onChange}
                          className="mt-1"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Follow-up Required</FormLabel>
                        <p className="text-xs text-muted-foreground">
                          Check if this observation requires follow-up actions
                        </p>
                      </div>
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <Button type="button" variant="outline" onClick={() => setObservationDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={createObservationMutation.isPending}>
                  {createObservationMutation.isPending ? "Creating..." : "Create Observation"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>

      {/* Schedule Review Dialog */}
      <Dialog open={scheduleReviewDialogOpen} onOpenChange={setScheduleReviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Teacher Schedule Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-6">
            {/* Teacher Selection */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Select Teacher</label>
                <Select>
                  <SelectTrigger>
                    <SelectValue placeholder="Choose teacher to review" />
                  </SelectTrigger>
                  <SelectContent>
                    {allTeachers?.map((teacher: any) => (
                      <SelectItem key={teacher.id} value={teacher.id.toString()}>
                        {teacher.firstName} {teacher.lastName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Review Period</label>
                <Select defaultValue="this_week">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="this_week">This Week</SelectItem>
                    <SelectItem value="next_week">Next Week</SelectItem>
                    <SelectItem value="this_month">This Month</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Schedule Overview */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Weekly Schedule */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Calendar className="h-5 w-5 mr-2" />
                    Weekly Schedule
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {teacherPerformance && teacherPerformance.length > 0 ? (
                      ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'].map((day, index) => {
                        const hasClasses = index < 5; // Weekdays have classes
                        return (
                          <div key={day} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                            <span className="font-medium">{day}</span>
                            <div className="text-sm text-gray-600">
                              {hasClasses ? (
                                <>
                                  <Badge variant="outline" className="mr-2">09:00 - 11:00</Badge>
                                  <Badge variant="outline">14:00 - 16:00</Badge>
                                </>
                              ) : (
                                <Badge variant="secondary">No classes</Badge>
                              )}
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div className="text-center py-4 text-gray-500">
                        Select a teacher to view their schedule
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>

              {/* Schedule Analysis */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center">
                    <Target className="h-5 w-5 mr-2" />
                    Schedule Analysis
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {teacherPerformance && teacherPerformance.length > 0 ? (
                    <>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Total Teaching Hours</span>
                        <Badge variant="secondary">{teacherPerformance[0]?.completedLessons || 0} hours/week</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Peak Teaching Time</span>
                        <Badge variant="secondary">14:00 - 16:00</Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Schedule Utilization</span>
                        <Badge variant="secondary" className="bg-green-100 text-green-800">
                          {Math.round((teacherPerformance[0]?.rating || 0) * 20)}%
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-gray-600">Performance Rating</span>
                        <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                          {teacherPerformance[0]?.rating || 0}/5.0
                        </Badge>
                      </div>
                    </>
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      Select a teacher to view analysis
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Schedule Issues */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <AlertTriangle className="h-5 w-5 mr-2 text-orange-500" />
                  Schedule Analysis
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {recentObservations && recentObservations.length > 0 ? (
                    recentObservations.slice(0, 3).map((obs: any, index: number) => (
                      <div key={obs.id} className={`flex items-start space-x-3 p-3 rounded-lg border ${
                        index === 0 ? 'bg-green-50 border-green-200' :
                        index === 1 ? 'bg-yellow-50 border-yellow-200' :
                        'bg-blue-50 border-blue-200'
                      }`}>
                        {index === 0 ? <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" /> :
                         index === 1 ? <Clock className="h-5 w-5 text-yellow-500 mt-0.5" /> :
                         <Target className="h-5 w-5 text-blue-500 mt-0.5" />}
                        <div>
                          <h4 className={`font-medium ${
                            index === 0 ? 'text-green-800' :
                            index === 1 ? 'text-yellow-800' :
                            'text-blue-800'
                          }`}>
                            {index === 0 ? 'Recent Observation' :
                             index === 1 ? 'Schedule Recommendation' :
                             'Performance Insight'}
                          </h4>
                          <p className={`text-sm ${
                            index === 0 ? 'text-green-600' :
                            index === 1 ? 'text-yellow-600' :
                            'text-blue-600'
                          }`}>
                            {index === 0 ? `${obs.teacherName}: Overall score ${obs.overallScore}/5.0` :
                             index === 1 ? `${obs.teacherName}: Consider adjusting teaching methodology` :
                             `${obs.teacherName}: Strengths in ${obs.strengths?.split(',')[0] || 'teaching'}`}
                          </p>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-center py-4 text-gray-500">
                      No schedule analysis available. Create teacher observations to see insights.
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Action Buttons */}
            <div className="flex justify-end gap-3">
              <Button variant="outline" onClick={() => setScheduleReviewDialogOpen(false)}>
                Close Review
              </Button>
              <Button variant="outline">
                Export Report
              </Button>
              <Button className="bg-purple-600 hover:bg-purple-700">
                Approve Schedule
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}