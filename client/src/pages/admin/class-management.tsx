import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Checkbox } from '@/components/ui/checkbox';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { apiRequest, queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';
import { format } from 'date-fns';
import { 
  Calendar,
  Clock, 
  Users, 
  BookOpen, 
  Plus, 
  Edit, 
  Trash2, 
  Search,
  UserPlus,
  UserMinus,
  CheckCircle,
  XCircle,
  Info,
  DollarSign,
  GraduationCap,
  Building,
  Globe,
  CalendarDays,
  ChevronRight
} from 'lucide-react';

interface Course {
  id: number;
  name: string;
  description: string;
  fee: number;
  level: string;
  language: string;
  duration: number;
  totalSessions: number;
  isFeatured: boolean;
  isActive: boolean;
}

interface Class {
  id: number;
  courseId: number;
  courseName?: string;
  teacherId: number;
  teacherName?: string;
  startDate: string;
  endDate?: string;
  weekdays: string[];
  startTime: string;
  endTime: string;
  maxStudents: number;
  currentStudents?: number;
  deliveryMode: string;
  isRecurring: boolean;
  recurringPattern?: string;
  totalSessions?: number;
  notes?: string;
}

interface ClassEnrollment {
  id: number;
  classId: number;
  studentId: number;
  studentName?: string;
  studentEmail?: string;
  enrollmentType: string;
  enrollmentDate: string;
  paymentStatus: string;
  attendanceRate?: number;
  notes?: string;
}

interface Student {
  id: number;
  name: string;
  email: string;
  phoneNumber?: string;
  enrolledCourseId?: number;
  enrolledCourseName?: string;
  currentProficiency?: string;
}

interface Teacher {
  id: number;
  name: string;
  email: string;
  specializations?: string[];
}

export default function ClassManagementPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const [selectedClass, setSelectedClass] = useState<Class | null>(null);
  const [enrollmentDialogOpen, setEnrollmentDialogOpen] = useState(false);
  const [createClassDialogOpen, setCreateClassDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedStudents, setSelectedStudents] = useState<number[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<number | null>(null);
  
  // State for new class form
  const [newClass, setNewClass] = useState({
    courseId: '',
    teacherId: '',
    startDate: '',
    weekdays: [] as string[],
    startTime: '',
    endTime: '',
    maxStudents: '20',
    deliveryMode: 'online',
    isRecurring: true,
    recurringPattern: 'weekly',
    totalSessions: '12',
    notes: ''
  });

  // Fetch all courses
  const { data: courses = [] } = useQuery<Course[]>({
    queryKey: ['/api/admin/courses'],
  });

  // Fetch all teachers
  const { data: teachers = [] } = useQuery<Teacher[]>({
    queryKey: ['/api/admin/teachers'],
  });

  // Fetch all classes
  const { data: classes = [], isLoading: classesLoading } = useQuery<Class[]>({
    queryKey: ['/api/admin/classes'],
  });

  // Fetch enrollments for selected class
  const { data: enrollments = [] } = useQuery<ClassEnrollment[]>({
    queryKey: selectedClass ? [`/api/admin/classes/${selectedClass.id}/enrollments`] : null,
    enabled: !!selectedClass,
  });

  // Search students for enrollment
  const { data: searchResults = [] } = useQuery<Student[]>({
    queryKey: ['/api/admin/enrollments/search-students', searchQuery, selectedCourse],
    enabled: searchQuery.length > 0 || !!selectedCourse,
  });

  // Create new class
  const createClass = useMutation({
    mutationFn: (data: any) => apiRequest('/api/admin/classes', {
      method: 'POST',
      body: JSON.stringify(data),
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      toast({ title: 'Success', description: 'Class created successfully' });
      setCreateClassDialogOpen(false);
      setNewClass({
        courseId: '',
        teacherId: '',
        startDate: '',
        weekdays: [],
        startTime: '',
        endTime: '',
        maxStudents: '20',
        deliveryMode: 'online',
        isRecurring: true,
        recurringPattern: 'weekly',
        totalSessions: '12',
        notes: ''
      });
    },
    onError: (error: any) => {
      toast({ 
        title: 'Error', 
        description: error.message || 'Failed to create class',
        variant: 'destructive' 
      });
    }
  });

  // Delete class
  const deleteClass = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/admin/classes/${id}`, {
      method: 'DELETE',
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/admin/classes'] });
      toast({ title: 'Success', description: 'Class deleted successfully' });
      setSelectedClass(null);
    }
  });

  // Enroll students
  const enrollStudents = useMutation({
    mutationFn: (data: { classId: number; studentIds: number[] }) => 
      apiRequest('/api/admin/enrollments/bulk', {
        method: 'POST',
        body: JSON.stringify({
          action: 'enroll',
          classId: data.classId,
          studentIds: data.studentIds
        }),
      }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/classes/${selectedClass?.id}/enrollments`] });
      toast({ 
        title: 'Success', 
        description: `${data.enrolledCount} students enrolled successfully` 
      });
      setSelectedStudents([]);
      setEnrollmentDialogOpen(false);
    }
  });

  // Unenroll student
  const unenrollStudent = useMutation({
    mutationFn: (enrollmentId: number) => 
      apiRequest(`/api/admin/enrollments/${enrollmentId}`, {
        method: 'DELETE',
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/admin/classes/${selectedClass?.id}/enrollments`] });
      toast({ title: 'Success', description: 'Student unenrolled successfully' });
    }
  });

  const weekdayOptions = [
    { value: 'monday', label: 'Monday' },
    { value: 'tuesday', label: 'Tuesday' },
    { value: 'wednesday', label: 'Wednesday' },
    { value: 'thursday', label: 'Thursday' },
    { value: 'friday', label: 'Friday' },
    { value: 'saturday', label: 'Saturday' },
    { value: 'sunday', label: 'Sunday' }
  ];

  const handleWeekdayToggle = (weekday: string) => {
    setNewClass(prev => ({
      ...prev,
      weekdays: prev.weekdays.includes(weekday)
        ? prev.weekdays.filter(w => w !== weekday)
        : [...prev.weekdays, weekday]
    }));
  };

  const handleCreateClass = () => {
    if (!newClass.courseId || !newClass.teacherId || !newClass.startDate || 
        newClass.weekdays.length === 0 || !newClass.startTime || !newClass.endTime) {
      toast({ 
        title: 'Error', 
        description: 'Please fill in all required fields',
        variant: 'destructive' 
      });
      return;
    }

    createClass.mutate({
      ...newClass,
      courseId: parseInt(newClass.courseId),
      teacherId: parseInt(newClass.teacherId),
      maxStudents: parseInt(newClass.maxStudents),
      totalSessions: parseInt(newClass.totalSessions)
    });
  };

  const handleEnrollStudents = () => {
    if (selectedStudents.length === 0) {
      toast({ 
        title: 'Error', 
        description: 'Please select at least one student',
        variant: 'destructive' 
      });
      return;
    }

    if (selectedClass) {
      enrollStudents.mutate({
        classId: selectedClass.id,
        studentIds: selectedStudents
      });
    }
  };

  return (
    <div className="container mx-auto px-4 py-6 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Class & Enrollment Management</h1>
        <p className="text-muted-foreground mt-2">
          Manage classes with weekly schedules and student enrollments
        </p>
      </div>

      <Tabs defaultValue="classes" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2 max-w-md">
          <TabsTrigger value="classes">Classes</TabsTrigger>
          <TabsTrigger value="enrollments">Enrollments</TabsTrigger>
        </TabsList>

        <TabsContent value="classes" className="space-y-4">
          {/* Create Class Button */}
          <div className="flex justify-between items-center">
            <h2 className="text-xl font-semibold">Active Classes</h2>
            <Dialog open={createClassDialogOpen} onOpenChange={setCreateClassDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Create New Class
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Class with Weekly Schedule</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  {/* Course Selection */}
                  <div>
                    <Label htmlFor="course">Course *</Label>
                    <Select value={newClass.courseId} onValueChange={(v) => setNewClass({...newClass, courseId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a course" />
                      </SelectTrigger>
                      <SelectContent>
                        {courses.map((course: Course) => (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {course.name} ({course.level} - {course.language})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Teacher Selection */}
                  <div>
                    <Label htmlFor="teacher">Teacher *</Label>
                    <Select value={newClass.teacherId} onValueChange={(v) => setNewClass({...newClass, teacherId: v})}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a teacher" />
                      </SelectTrigger>
                      <SelectContent>
                        {teachers.map((teacher: Teacher) => (
                          <SelectItem key={teacher.id} value={teacher.id.toString()}>
                            {teacher.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Start Date */}
                  <div>
                    <Label htmlFor="startDate">Start Date *</Label>
                    <Input
                      type="date"
                      value={newClass.startDate}
                      onChange={(e) => setNewClass({...newClass, startDate: e.target.value})}
                    />
                  </div>

                  {/* Weekdays Selection */}
                  <div>
                    <Label>Class Days (Weekly Schedule) *</Label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mt-2">
                      {weekdayOptions.map((day) => (
                        <div key={day.value} className="flex items-center space-x-2">
                          <Checkbox
                            id={day.value}
                            checked={newClass.weekdays.includes(day.value)}
                            onCheckedChange={() => handleWeekdayToggle(day.value)}
                          />
                          <Label
                            htmlFor={day.value}
                            className="text-sm font-normal cursor-pointer"
                          >
                            {day.label}
                          </Label>
                        </div>
                      ))}
                    </div>
                    {newClass.weekdays.length > 0 && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Classes will be held every: {newClass.weekdays.join(', ')}
                      </p>
                    )}
                  </div>

                  {/* Time Selection */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label htmlFor="startTime">Start Time *</Label>
                      <Input
                        type="time"
                        value={newClass.startTime}
                        onChange={(e) => setNewClass({...newClass, startTime: e.target.value})}
                      />
                    </div>
                    <div>
                      <Label htmlFor="endTime">End Time *</Label>
                      <Input
                        type="time"
                        value={newClass.endTime}
                        onChange={(e) => setNewClass({...newClass, endTime: e.target.value})}
                      />
                    </div>
                  </div>

                  {/* Total Sessions */}
                  <div>
                    <Label htmlFor="totalSessions">Total Sessions</Label>
                    <Input
                      type="number"
                      value={newClass.totalSessions}
                      onChange={(e) => setNewClass({...newClass, totalSessions: e.target.value})}
                    />
                    <p className="text-sm text-muted-foreground mt-1">
                      End date will be calculated automatically considering holidays
                    </p>
                  </div>

                  {/* Max Students */}
                  <div>
                    <Label htmlFor="maxStudents">Maximum Students</Label>
                    <Input
                      type="number"
                      value={newClass.maxStudents}
                      onChange={(e) => setNewClass({...newClass, maxStudents: e.target.value})}
                    />
                  </div>

                  {/* Delivery Mode */}
                  <div>
                    <Label htmlFor="deliveryMode">Delivery Mode</Label>
                    <Select value={newClass.deliveryMode} onValueChange={(v) => setNewClass({...newClass, deliveryMode: v})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                        <SelectItem value="hybrid">Hybrid</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Notes */}
                  <div>
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea
                      value={newClass.notes}
                      onChange={(e) => setNewClass({...newClass, notes: e.target.value})}
                      placeholder="Additional notes about the class..."
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setCreateClassDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleCreateClass} disabled={createClass.isPending}>
                    {createClass.isPending ? 'Creating...' : 'Create Class'}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>

          {/* Classes List */}
          {classesLoading ? (
            <Card>
              <CardContent className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-muted-foreground">Loading classes...</p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {classes.map((cls: Class) => (
                <Card key={cls.id} className="cursor-pointer hover:shadow-lg transition-shadow"
                      onClick={() => setSelectedClass(cls)}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">{cls.courseName || `Class #${cls.id}`}</CardTitle>
                        <CardDescription>{cls.teacherName || 'No teacher assigned'}</CardDescription>
                      </div>
                      <Badge variant={cls.deliveryMode === 'online' ? 'default' : 'secondary'}>
                        {cls.deliveryMode}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2 text-sm">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4 text-muted-foreground" />
                        <span>Starts: {format(new Date(cls.startDate), 'MMM dd, yyyy')}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CalendarDays className="h-4 w-4 text-muted-foreground" />
                        <span>Days: {cls.weekdays?.join(', ') || 'Not set'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span>{cls.startTime} - {cls.endTime}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Users className="h-4 w-4 text-muted-foreground" />
                        <span>{cls.currentStudents || 0} / {cls.maxStudents} students</span>
                      </div>
                    </div>
                    <div className="mt-4 flex gap-2">
                      <Button 
                        size="sm" 
                        variant="outline"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedClass(cls);
                          setEnrollmentDialogOpen(true);
                        }}
                      >
                        <UserPlus className="h-4 w-4 mr-1" />
                        Enroll
                      </Button>
                      <Button 
                        size="sm" 
                        variant="destructive"
                        onClick={(e) => {
                          e.stopPropagation();
                          if (confirm('Are you sure you want to delete this class?')) {
                            deleteClass.mutate(cls.id);
                          }
                        }}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="enrollments" className="space-y-4">
          {selectedClass ? (
            <>
              <Card>
                <CardHeader>
                  <div className="flex justify-between items-center">
                    <div>
                      <CardTitle>Class Enrollments</CardTitle>
                      <CardDescription>
                        {selectedClass.courseName} - {selectedClass.teacherName}
                      </CardDescription>
                    </div>
                    <Button 
                      onClick={() => setEnrollmentDialogOpen(true)}
                      size="sm"
                    >
                      <UserPlus className="h-4 w-4 mr-2" />
                      Add Students
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {enrollments.length === 0 ? (
                    <Alert>
                      <Info className="h-4 w-4" />
                      <AlertDescription>
                        No students enrolled in this class yet. Click "Add Students" to enroll students.
                      </AlertDescription>
                    </Alert>
                  ) : (
                    <div className="space-y-2">
                      {enrollments.map((enrollment: ClassEnrollment) => (
                        <div key={enrollment.id} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                              <GraduationCap className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">{enrollment.studentName}</p>
                              <p className="text-sm text-muted-foreground">{enrollment.studentEmail}</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant={enrollment.paymentStatus === 'paid' ? 'default' : 'secondary'}>
                              {enrollment.paymentStatus}
                            </Badge>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => unenrollStudent.mutate(enrollment.id)}
                            >
                              <UserMinus className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </>
          ) : (
            <Alert>
              <Info className="h-4 w-4" />
              <AlertDescription>
                Select a class from the Classes tab to view and manage enrollments.
              </AlertDescription>
            </Alert>
          )}
        </TabsContent>
      </Tabs>

      {/* Enrollment Dialog */}
      <Dialog open={enrollmentDialogOpen} onOpenChange={setEnrollmentDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Enroll Students in Class</DialogTitle>
            <DialogDescription>
              Search and select students to enroll in {selectedClass?.courseName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            {/* Search Input */}
            <div className="flex gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search by student name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-8"
                />
              </div>
              <Select value={selectedCourse?.toString() || ''} onValueChange={(v) => setSelectedCourse(v ? parseInt(v) : null)}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Filter by course" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">All courses</SelectItem>
                  {courses.map((course: Course) => (
                    <SelectItem key={course.id} value={course.id.toString()}>
                      {course.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Student List */}
            <ScrollArea className="h-[300px] border rounded-lg p-4">
              {searchResults.length === 0 ? (
                <div className="text-center text-muted-foreground py-8">
                  {searchQuery || selectedCourse ? 'No students found' : 'Enter a search term or select a course'}
                </div>
              ) : (
                <div className="space-y-2">
                  {searchResults.map((student: Student) => (
                    <div key={student.id} className="flex items-center justify-between p-2 hover:bg-muted rounded">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          checked={selectedStudents.includes(student.id)}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedStudents([...selectedStudents, student.id]);
                            } else {
                              setSelectedStudents(selectedStudents.filter(id => id !== student.id));
                            }
                          }}
                        />
                        <div>
                          <p className="font-medium">{student.name}</p>
                          <p className="text-sm text-muted-foreground">{student.email}</p>
                        </div>
                      </div>
                      {student.enrolledCourseName && (
                        <Badge variant="outline">{student.enrolledCourseName}</Badge>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </ScrollArea>

            {selectedStudents.length > 0 && (
              <Alert>
                <CheckCircle className="h-4 w-4" />
                <AlertDescription>
                  {selectedStudents.length} student(s) selected for enrollment
                </AlertDescription>
              </Alert>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => {
              setEnrollmentDialogOpen(false);
              setSelectedStudents([]);
              setSearchQuery('');
            }}>
              Cancel
            </Button>
            <Button onClick={handleEnrollStudents} disabled={enrollStudents.isPending}>
              {enrollStudents.isPending ? 'Enrolling...' : `Enroll ${selectedStudents.length} Students`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}