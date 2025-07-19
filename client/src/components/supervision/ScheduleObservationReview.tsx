import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Users, 
  Calendar,
  AlertTriangle,
  CheckCircle,
  Clock,
  Eye,
  BookOpen,
  MapPin,
  Video
} from "lucide-react";

// Schema for scheduled observation
const scheduledObservationSchema = z.object({
  teacherId: z.number().min(1, "Please select a teacher"),
  sessionId: z.number().optional(),
  classId: z.number().optional(),
  observationType: z.enum(['live_in_person', 'live_online', 'recorded']),
  scheduledDate: z.string().min(1, "Please select a date and time"),
  priority: z.enum(['low', 'normal', 'high', 'urgent']).default('normal'),
  notes: z.string().optional(),
});

interface TeacherClass {
  id: number;
  title: string;
  courseName: string;
  studentName: string;
  scheduledAt: string;
  duration: number;
  status: string;
  roomName: string;
  deliveryMode: string;
  isObservable: boolean;
}

interface ScheduledObservation {
  id: number;
  teacherId: number;
  supervisorId: number;
  sessionId?: number;
  classId?: number;
  observationType: string;
  scheduledDate: string;
  status: string;
  priority: string;
  notes?: string;
  teacherNotified: boolean;
  notificationSentAt?: string;
  createdAt: string;
}

export default function ScheduleObservationReview() {
  const [selectedTeacher, setSelectedTeacher] = useState<number | null>(null);
  const [observationDialogOpen, setObservationDialogOpen] = useState(false);
  const [selectedClass, setSelectedClass] = useState<TeacherClass | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch all teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/teachers/list'],
    select: (data: any[]) => data?.filter(user => user.role === 'Teacher/Tutor') || [],
  });

  // Fetch teacher classes when teacher is selected
  const { data: teacherClasses = [], isLoading: classesLoading } = useQuery({
    queryKey: [`/api/supervision/teacher-classes/${selectedTeacher}`],
    enabled: !!selectedTeacher,
  });

  // Fetch scheduled observations
  const { data: scheduledObservations = [] } = useQuery<ScheduledObservation[]>({
    queryKey: ['/api/supervision/scheduled-observations'],
  });

  // Fetch pending observations for to-do list
  const { data: pendingObservations = [] } = useQuery<ScheduledObservation[]>({
    queryKey: ['/api/supervision/pending-observations'],
  });

  // Fetch overdue observations
  const { data: overdueObservations = [] } = useQuery<ScheduledObservation[]>({
    queryKey: ['/api/supervision/overdue-observations'],
  });

  // Form for scheduling observation
  const observationForm = useForm({
    resolver: zodResolver(scheduledObservationSchema),
    defaultValues: {
      teacherId: 0,
      observationType: 'live_online' as const,
      scheduledDate: '',
      priority: 'normal' as const,
      notes: '',
    },
  });

  // Create scheduled observation mutation
  const createScheduledObservationMutation = useMutation({
    mutationFn: async (data: any) => {
      return await apiRequest('/api/supervision/scheduled-observations', 'POST', data);
    },
    onSuccess: () => {
      toast({
        title: "Observation Scheduled",
        description: "The teacher has been notified via SMS.",
      });
      setObservationDialogOpen(false);
      observationForm.reset();
      setSelectedClass(null);
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/scheduled-observations'] });
      queryClient.invalidateQueries({ queryKey: ['/api/supervision/pending-observations'] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to schedule observation",
        variant: "destructive",
      });
    },
  });

  // Handle teacher selection
  const handleTeacherSelect = (teacherId: number) => {
    setSelectedTeacher(teacherId);
    setSelectedClass(null);
  };

  // Handle class selection for observation
  const handleClassSelect = (classItem: TeacherClass) => {
    setSelectedClass(classItem);
    // Pre-fill form with class details
    observationForm.setValue('teacherId', selectedTeacher!);
    observationForm.setValue('sessionId', classItem.id);
    observationForm.setValue('classId', classItem.id);
    observationForm.setValue('observationType', classItem.deliveryMode === 'online' ? 'live_online' : 'live_in_person');
    
    // Set default scheduled date to class time
    const classDate = new Date(classItem.scheduledAt);
    observationForm.setValue('scheduledDate', classDate.toISOString().slice(0, 16)); // YYYY-MM-DDTHH:MM format
    
    setObservationDialogOpen(true);
  };

  // Submit observation
  const onSubmitObservation = (data: any) => {
    const observationData = {
      ...data,
      scheduledDate: new Date(data.scheduledDate).toISOString(),
    };
    createScheduledObservationMutation.mutate(observationData);
  };

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending Observations</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingObservations.length}</div>
            <p className="text-xs text-muted-foreground">Scheduled for this week</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Overdue</CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{overdueObservations.length}</div>
            <p className="text-xs text-muted-foreground">Need immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Teachers Available</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{teachers.length}</div>
            <p className="text-xs text-muted-foreground">Active teachers</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Scheduled</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{scheduledObservations.length}</div>
            <p className="text-xs text-muted-foreground">All observations</p>
          </CardContent>
        </Card>
      </div>

      {/* Teacher Selection and Class Review */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Teacher Selection */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Select Teacher
            </CardTitle>
            <CardDescription>
              Choose a teacher to review their classes and schedule observations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {teachersLoading ? (
              <div className="text-center py-4">Loading teachers...</div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto">
                {teachers.map((teacher: any) => (
                  <div
                    key={teacher.id}
                    className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                      selectedTeacher === teacher.id 
                        ? 'border-blue-500 bg-blue-50' 
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleTeacherSelect(teacher.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{teacher.firstName} {teacher.lastName}</p>
                        <p className="text-sm text-gray-600">{teacher.email}</p>
                        {teacher.specialization && (
                          <p className="text-xs text-gray-500">{teacher.specialization}</p>
                        )}
                      </div>
                      <Badge variant={teacher.isActive ? "default" : "secondary"}>
                        {teacher.isActive ? "Active" : "Inactive"}
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Teacher Classes */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BookOpen className="h-5 w-5" />
              Teacher Classes
            </CardTitle>
            <CardDescription>
              {selectedTeacher 
                ? "Select a class to schedule an observation" 
                : "Select a teacher to view their classes"
              }
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!selectedTeacher ? (
              <div className="text-center py-8 text-gray-500">
                <BookOpen className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>Select a teacher to view their classes</p>
              </div>
            ) : classesLoading ? (
              <div className="text-center py-4">Loading classes...</div>
            ) : teacherClasses.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                <p>No classes found for this teacher</p>
              </div>
            ) : (
              <div className="space-y-3 max-h-96 overflow-y-auto">
                {teacherClasses.map((classItem: TeacherClass) => (
                  <div
                    key={classItem.id}
                    className="p-3 rounded-lg border border-gray-200 hover:border-gray-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-medium text-sm">{classItem.title}</h4>
                        <p className="text-xs text-gray-600 mb-2">{classItem.courseName}</p>
                        
                        <div className="flex items-center gap-4 text-xs text-gray-500 mb-2">
                          <span className="flex items-center gap-1">
                            <Users className="h-3 w-3" />
                            {classItem.studentName}
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {classItem.duration}min
                          </span>
                          <span className="flex items-center gap-1">
                            {classItem.deliveryMode === 'online' ? (
                              <Video className="h-3 w-3" />
                            ) : (
                              <MapPin className="h-3 w-3" />
                            )}
                            {classItem.roomName}
                          </span>
                        </div>

                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {new Date(classItem.scheduledAt).toLocaleString()}
                          </span>
                          <div className="flex gap-2">
                            <Badge variant={classItem.status === 'scheduled' ? 'default' : 'secondary'}>
                              {classItem.status}
                            </Badge>
                            {classItem.isObservable && (
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => handleClassSelect(classItem)}
                                className="text-xs"
                              >
                                <Eye className="h-3 w-3 mr-1" />
                                Schedule
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Scheduled Observations List */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5" />
            Scheduled Observations
          </CardTitle>
          <CardDescription>
            All upcoming and recent observations
          </CardDescription>
        </CardHeader>
        <CardContent>
          {scheduledObservations.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <Calendar className="h-12 w-12 mx-auto mb-4 text-gray-300" />
              <p>No observations scheduled</p>
            </div>
          ) : (
            <div className="space-y-3">
              {scheduledObservations.map((observation) => (
                <div
                  key={observation.id}
                  className="p-4 rounded-lg border border-gray-200"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={observation.status === 'scheduled' ? 'default' : 'secondary'}>
                          {observation.status}
                        </Badge>
                        <Badge variant={
                          observation.priority === 'urgent' ? 'destructive' : 
                          observation.priority === 'high' ? 'default' : 'secondary'
                        }>
                          {observation.priority}
                        </Badge>
                        {observation.teacherNotified && (
                          <Badge variant="outline" className="text-green-600">
                            <CheckCircle className="h-3 w-3 mr-1" />
                            Notified
                          </Badge>
                        )}
                      </div>
                      
                      <p className="font-medium">Teacher ID: {observation.teacherId}</p>
                      <p className="text-sm text-gray-600">Type: {observation.observationType}</p>
                      <p className="text-sm text-gray-600">
                        Scheduled: {new Date(observation.scheduledDate).toLocaleString()}
                      </p>
                      
                      {observation.notes && (
                        <p className="text-sm text-gray-500 mt-1">{observation.notes}</p>
                      )}
                    </div>
                    
                    <div className="text-right text-xs text-gray-500">
                      <p>Created: {new Date(observation.createdAt).toLocaleDateString()}</p>
                      {observation.notificationSentAt && (
                        <p>SMS sent: {new Date(observation.notificationSentAt).toLocaleDateString()}</p>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Schedule Observation Dialog */}
      <Dialog open={observationDialogOpen} onOpenChange={setObservationDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Schedule Class Observation</DialogTitle>
          </DialogHeader>
          
          <Form {...observationForm}>
            <form onSubmit={observationForm.handleSubmit(onSubmitObservation)} className="space-y-4">
              {selectedClass && (
                <div className="p-3 bg-gray-50 rounded-lg">
                  <h4 className="font-medium text-sm mb-1">{selectedClass.title}</h4>
                  <p className="text-xs text-gray-600">{selectedClass.courseName}</p>
                  <p className="text-xs text-gray-500">
                    Student: {selectedClass.studentName} • {selectedClass.roomName}
                  </p>
                </div>
              )}

              <FormField
                control={observationForm.control}
                name="observationType"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Observation Type</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="live_in_person">Live In-Person</SelectItem>
                        <SelectItem value="live_online">Live Online</SelectItem>
                        <SelectItem value="recorded">Recorded Review</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={observationForm.control}
                name="scheduledDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Scheduled Date & Time</FormLabel>
                    <FormControl>
                      <Input 
                        type="datetime-local"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={observationForm.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="normal">Normal</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="urgent">Urgent</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={observationForm.control}
                name="notes"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Notes (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Add any specific observation notes or instructions..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-2">
                <Button 
                  type="button" 
                  variant="outline" 
                  onClick={() => setObservationDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button 
                  type="submit" 
                  disabled={createScheduledObservationMutation.isPending}
                >
                  {createScheduledObservationMutation.isPending ? "Scheduling..." : "Schedule & Notify"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}