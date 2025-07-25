import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { format } from 'date-fns';
import { CalendarIcon, Plus, Edit, Eye, FileText, Clock, User, ArrowLeft } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { useLocation } from 'wouter';
import { useTranslation } from 'react-i18next';

const assignmentSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  studentId: z.number().min(1, 'Student is required'),
  courseId: z.number().min(1, 'Course is required'),
  dueDate: z.coerce.date().refine(
    (date) => date > new Date(),
    "Due date must be in the future"
  ),
  maxScore: z.number().min(1, 'Max score must be positive'),
  instructions: z.string().optional()
});

type AssignmentFormData = z.infer<typeof assignmentSchema>;

export default function TeacherAssignmentsPage() {
  const { t } = useTranslation(['teacher', 'common']);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [feedbackDialogOpen, setFeedbackDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<any>(null);
  const [feedback, setFeedback] = useState('');
  const [score, setScore] = useState<number>(0);
  const [viewAssignmentId, setViewAssignmentId] = useState<number | null>(null);
  
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location, setLocation] = useLocation();

  // Handle URL parameters for viewing specific assignment
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const viewParam = urlParams.get('view');
    if (viewParam && !isNaN(parseInt(viewParam))) {
      setViewAssignmentId(parseInt(viewParam));
    } else {
      setViewAssignmentId(null); // Clear when no view parameter
    }
    
    // Debug logging for button visibility (development only)
    if (process.env.NODE_ENV === 'development') {

    }
  }, [location]);

  const form = useForm<AssignmentFormData>({
    resolver: zodResolver(assignmentSchema),
    defaultValues: {
      title: '',
      description: '',
      studentId: 0,
      courseId: 0,
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default to 1 week from now
      maxScore: 100,
      instructions: ''
    }
  });

  // Fetch assignments
  const { data: assignments = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/teacher/assignments']
  });

  // Fetch teacher's classes for student/course selection
  const { data: classes = [] } = useQuery<any[]>({
    queryKey: ['/api/teacher/classes']
  });

  // Create assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentFormData) => {
      return apiRequest('/api/teacher/assignments', {
        method: 'POST',
        body: JSON.stringify(data)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/assignments'] });
      toast({
        title: 'Success',
        description: 'Assignment created successfully'
      });
      setCreateDialogOpen(false);
      form.reset();
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to create assignment',
        variant: 'destructive'
      });
    }
  });

  // Submit feedback mutation
  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ assignmentId, feedback, score }: { assignmentId: number; feedback: string; score: number }) => {
      return apiRequest(`/api/teacher/assignments/${assignmentId}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback, score })
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teacher/assignments'] });
      toast({
        title: 'Success',
        description: 'Feedback submitted successfully'
      });
      setFeedbackDialogOpen(false);
      setSelectedAssignment(null);
      setFeedback('');
      setScore(0);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit feedback',
        variant: 'destructive'
      });
    }
  });

  const onCreateAssignment = (data: AssignmentFormData) => {
    createAssignmentMutation.mutate(data);
  };

  const handleBackToList = () => {
    setViewAssignmentId(null);
    // Clear URL parameters properly
    window.history.replaceState({}, '', '/teacher/assignments');
    setLocation('/teacher/assignments');
  };

  const handleFeedbackSubmit = () => {
    if (selectedAssignment && feedback) {
      submitFeedbackMutation.mutate({
        assignmentId: selectedAssignment.id,
        feedback,
        score
      });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800';
      case 'graded':
        return 'bg-green-100 text-green-800';
      case 'overdue':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  // Get unique students from classes
  const students = classes.reduce((acc: any[], classItem: any) => {
    if (classItem.studentId && !acc.find(s => s.id === classItem.studentId)) {
      acc.push({
        id: classItem.studentId,
        name: classItem.studentName
      });
    }
    return acc;
  }, []);

  // Get unique courses from classes
  const courses = classes.reduce((acc: any[], classItem: any) => {
    if (classItem.courseId && !acc.find(c => c.id === classItem.courseId)) {
      acc.push({
        id: classItem.courseId,
        title: classItem.course
      });
    }
    return acc;
  }, []);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }



  // Show individual assignment view
  if (viewAssignmentId) {
    const assignment = assignments.find((a: any) => a.id === viewAssignmentId);
    if (!assignment) {
      return (
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            <Card>
              <CardContent className="p-8 text-center">
                <p className="text-red-600">Assignment not found</p>
                <Button onClick={handleBackToList} className="mt-4">
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Back to Assignments
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      );
    }

    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Assignment Detail Header */}
          <div className="flex items-center justify-between mb-6">
            <Button variant="outline" onClick={handleBackToList}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Assignments
            </Button>
            <Badge variant={
              assignment.status === 'submitted' ? 'default' :
              assignment.status === 'graded' ? 'secondary' : 'outline'
            }>
              {assignment.status}
            </Badge>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">{assignment.title}</CardTitle>
              <div className="flex items-center space-x-4 text-sm text-gray-600">
                <span>Student: {assignment.studentName}</span>
                <span>Course: {assignment.courseName}</span>
                <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
              </div>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-gray-700">{assignment.description}</p>
              </div>

              {assignment.submission && (
                <div>
                  <h3 className="font-semibold mb-2">Student Submission</h3>
                  <div className="bg-gray-50 p-4 rounded-lg">
                    <p className="text-gray-700">{assignment.submission}</p>
                  </div>
                </div>
              )}

              {assignment.feedback && (
                <div>
                  <h3 className="font-semibold mb-2">Feedback</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700">{assignment.feedback}</p>
                    {assignment.score && (
                      <div className="mt-2">
                        <Badge variant="secondary">Score: {assignment.score}/{assignment.maxScore || 100}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {!assignment.feedback && assignment.status === 'submitted' && (
                <div className="flex space-x-2">
                  <Button 
                    onClick={() => {
                      setSelectedAssignment(assignment);
                      setFeedbackDialogOpen(true);
                    }}
                  >
                    <Edit className="w-4 h-4 mr-2" />
                    Provide Feedback
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Info - Hidden in production */}
        
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{t('teacher:assignments.title')}</h1>
            <p className="text-gray-600">{t('teacher:assignments.subtitle')}</p>
          </div>
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="mt-4 lg:mt-0">
                <Plus className="w-4 h-4 mr-2" />
                Create Assignment
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create New Assignment</DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onCreateAssignment)} className="space-y-6">
                  <FormField
                    control={form.control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Assignment Title</FormLabel>
                        <FormControl>
                          <Input placeholder="Enter assignment title" {...field} />
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
                          <Textarea 
                            placeholder="Describe the assignment requirements" 
                            className="min-h-24"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="studentId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Student</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select student" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {students.map((student: any) => (
                                <SelectItem key={student.id} value={student.id.toString()}>
                                  {student.name}
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
                      name="courseId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Course</FormLabel>
                          <Select onValueChange={(value) => field.onChange(parseInt(value))}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select course" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              {courses.map((course: any) => (
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

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="dueDate"
                      render={({ field }) => (
                        <FormItem className="flex flex-col">
                          <FormLabel>Due Date</FormLabel>
                          <Popover>
                            <PopoverTrigger asChild>
                              <FormControl>
                                <Button
                                  type="button"
                                  variant="outline"
                                  className={`w-full pl-3 text-left font-normal ${!field.value && "text-muted-foreground"}`}
                                >
                                  {field.value ? (
                                    format(field.value, "PPP")
                                  ) : (
                                    <span>Pick a date</span>
                                  )}
                                  <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                </Button>
                              </FormControl>
                            </PopoverTrigger>
                            <PopoverContent className="w-auto p-0" align="start">
                              <Calendar
                                mode="single"
                                selected={field.value}
                                onSelect={(date) => {
                                  if (date) {
                                    field.onChange(date);
                                  }
                                }}
                                disabled={(date) => {
                                  const today = new Date();
                                  today.setHours(0, 0, 0, 0);
                                  return date < today;
                                }}
                                initialFocus
                              />
                            </PopoverContent>
                          </Popover>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="maxScore"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Max Score</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="100" 
                              {...field}
                              onChange={(e) => field.onChange(parseInt(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="instructions"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Additional Instructions (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Any additional instructions for the student"
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end space-x-4">
                    <Button type="button" variant="outline" onClick={() => setCreateDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button type="submit" disabled={createAssignmentMutation.isPending}>
                      {createAssignmentMutation.isPending ? 'Creating...' : 'Create Assignment'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        {/* Assignments List */}
        <div className="space-y-6">
          {assignments.length === 0 ? (
            <Card>
              <CardContent className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold mb-2">No assignments yet</h3>
                <p className="text-gray-600 mb-4">Create your first assignment to get started</p>
                <Button onClick={() => setCreateDialogOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Assignment
                </Button>
              </CardContent>
            </Card>
          ) : (
            assignments.map((assignment: any) => (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between">
                    <div className="flex-1">
                      <div className="flex items-start justify-between mb-3">
                        <h3 className="text-xl font-semibold">{assignment.title}</h3>
                        <Badge className={getStatusColor(assignment.status)}>
                          {assignment.status}
                        </Badge>
                      </div>
                      
                      <p className="text-gray-600 mb-4">{assignment.description}</p>
                      
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                        <div className="flex items-center">
                          <User className="w-4 h-4 mr-2" />
                          <span>Student: {assignment.studentName}</span>
                        </div>
                        <div className="flex items-center">
                          <FileText className="w-4 h-4 mr-2" />
                          <span>Course: {assignment.courseName}</span>
                        </div>
                        <div className="flex items-center">
                          <Clock className="w-4 h-4 mr-2" />
                          <span>Due: {new Date(assignment.dueDate).toLocaleDateString()}</span>
                        </div>
                      </div>

                      {assignment.submittedAt && (
                        <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-800">
                            Submitted on {new Date(assignment.submittedAt).toLocaleString()}
                          </p>
                          {assignment.score && (
                            <p className="text-sm text-blue-800">
                              Score: {assignment.score}/{assignment.maxScore}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    <div className="flex space-x-2 mt-4 lg:mt-0 lg:ml-6">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={() => {
                          setViewAssignmentId(assignment.id);
                          const newUrl = new URL(window.location.href);
                          newUrl.searchParams.set('view', assignment.id.toString());
                          window.history.pushState({}, '', newUrl.toString());
                          setLocation(`/teacher/assignments?view=${assignment.id}`);
                        }}
                      >
                        <Eye className="w-3 h-3 mr-1" />
                        View
                      </Button>
                      {(assignment.status === 'submitted' || assignment.status === 'assigned') && !assignment.feedback && (
                        <Button 
                          size="sm"
                          onClick={() => {
                            setSelectedAssignment(assignment);
                            setFeedbackDialogOpen(true);
                          }}
                        >
                          <Edit className="w-3 h-3 mr-1" />
                          {assignment.status === 'submitted' ? 'Grade' : 'Provide Feedback'}
                        </Button>
                      )}

                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Feedback Dialog */}
        <Dialog open={feedbackDialogOpen} onOpenChange={setFeedbackDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Grade Assignment</DialogTitle>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Score</Label>
                <Input
                  type="number"
                  placeholder="Enter score"
                  value={score}
                  onChange={(e) => setScore(parseInt(e.target.value))}
                  max={selectedAssignment?.maxScore}
                />
                <p className="text-sm text-gray-500 mt-1">
                  Max score: {selectedAssignment?.maxScore}
                </p>
              </div>
              <div>
                <Label>Feedback</Label>
                <Textarea
                  placeholder="Provide feedback to the student"
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  className="min-h-24"
                />
              </div>
              <div className="flex justify-end space-x-4">
                <Button variant="outline" onClick={() => setFeedbackDialogOpen(false)}>
                  Cancel
                </Button>
                <Button 
                  onClick={handleFeedbackSubmit}
                  disabled={!feedback || score === 0 || submitFeedbackMutation.isPending}
                >
                  {submitFeedbackMutation.isPending ? 'Submitting...' : 'Submit Grade'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}