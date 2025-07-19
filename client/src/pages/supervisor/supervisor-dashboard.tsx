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

// Schema for observation form
const observationSchema = z.object({
  sessionId: z.number(),
  teacherId: z.number(),
  observationType: z.enum(['live_online', 'live_in_person', 'recorded']),
  scores: z.object({
    teachingMethodology: z.number().min(1).max(5),
    classroomManagement: z.number().min(1).max(5),
    studentEngagement: z.number().min(1).max(5),
    contentDelivery: z.number().min(1).max(5),
    languageSkills: z.number().min(1).max(5),
    timeManagement: z.number().min(1).max(5),
    technologyUse: z.number().min(1).max(5).optional(),
  }),
  strengths: z.string().optional(),
  areasForImprovement: z.string().optional(),
  actionItems: z.string().optional(),
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

  // Observation form
  const observationForm = useForm({
    resolver: zodResolver(observationSchema),
  });

  // Create observation mutation
  const createObservationMutation = useMutation({
    mutationFn: (data: any) => apiRequest('/api/supervision/observations', 'POST', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/recent-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/stats'] });
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: "Success", description: "Observation created successfully" });
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create observation", variant: "destructive" });
    },
  });

  const onObservationSubmit = (data: any) => {
    const overallScore = Object.values(data.scores).reduce((sum: number, score: any) => sum + score, 0) / Object.keys(data.scores).length;
    createObservationMutation.mutate({
      ...data,
      overallScore: Math.round(overallScore * 100) / 100,
    });
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
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="teachers">Teacher Performance</TabsTrigger>
            <TabsTrigger value="quality">Quality Assurance</TabsTrigger>
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
        </Tabs>
      </div>

      {/* New Observation Dialog */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Create Teacher Observation</DialogTitle>
          </DialogHeader>
          <Form {...observationForm}>
            <form onSubmit={observationForm.handleSubmit(onObservationSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={observationForm.control}
                  name="sessionId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Session</FormLabel>
                      <Select onValueChange={value => field.onChange(+value)}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select session" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          {recordedSessions?.map((session: any) => (
                            <SelectItem key={session.id} value={session.id.toString()}>
                              {session.classTitle}
                            </SelectItem>
                          ))}
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
                      <FormLabel>Observation Type</FormLabel>
                      <Select onValueChange={field.onChange}>
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
              
              <div className="grid grid-cols-3 gap-4">
                <FormField
                  control={observationForm.control}
                  name="scores.teachingMethodology"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Teaching Methodology</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="scores.classroomManagement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classroom Management</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="scores.studentEngagement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Student Engagement</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="scores.contentDelivery"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Content Delivery</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="scores.languageSkills"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Language Skills</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="scores.timeManagement"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time Management</FormLabel>
                      <FormControl>
                        <Input type="number" min="1" max="5" placeholder="1-5" {...field} onChange={e => field.onChange(+e.target.value)} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-1 gap-4">
                <FormField
                  control={observationForm.control}
                  name="strengths"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Strengths</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Note the teacher's strengths and positive observations..." {...field} />
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
                        <Textarea placeholder="Identify areas where the teacher can improve..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={observationForm.control}
                  name="actionItems"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Action Items</FormLabel>
                      <FormControl>
                        <Textarea placeholder="Specific action items and recommendations..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex justify-end gap-2">
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
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Review</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <p className="text-muted-foreground">
              Review scheduling functionality will be available in the next update. 
              For now, please use the observation system to evaluate teacher performance.
            </p>
            <div className="flex justify-end">
              <Button onClick={() => setScheduleReviewDialogOpen(false)}>
                Close
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}