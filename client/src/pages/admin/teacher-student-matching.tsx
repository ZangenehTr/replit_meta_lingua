import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Checkbox } from "@/components/ui/checkbox";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Users, 
  Clock,
  Calendar,
  Video,
  Home,
  BookOpen,
  Target,
  AlertCircle,
  UserPlus,
  CheckCircle
} from "lucide-react";

interface TimeSlot {
  day: string;
  startTime: string;
  endTime: string;
}

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  language: string;
  preferredClassType: 'private' | 'group' | 'both';
  preferredMode: 'online' | 'in-person' | 'both';
  timeSlots: TimeSlot[];
  enrollmentDate: string;
}

interface Teacher {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  languages: string[];
  levels: string[];
  classTypes: ('private' | 'group')[];
  modes: ('online' | 'in-person')[];
  timeSlots: TimeSlot[];
  maxStudents: number;
  currentStudents: number;
  hourlyRate: number;
}

interface TeacherAssignment {
  teacherId: number;
  studentId: number;
  classType: 'private' | 'group';
  mode: 'online' | 'in-person';
  scheduledSlots: TimeSlot[];
  notes?: string;
}

const DAYS_OF_WEEK = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];

export default function TeacherStudentMatchingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [filterClassType, setFilterClassType] = useState<string>("all");
  const [filterMode, setFilterMode] = useState<string>("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedTeacher, setSelectedTeacher] = useState<Teacher | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [selectedSlots, setSelectedSlots] = useState<TimeSlot[]>([]);
  const [matchFormData, setMatchFormData] = useState({
    classType: 'private' as 'private' | 'group',
    mode: 'online' as 'online' | 'in-person',
    notes: ""
  });

  // Fetch students without teachers
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/admin/students/unassigned-teacher'],
  });

  // Fetch available teachers
  const { data: teachers = [], isLoading: teachersLoading } = useQuery({
    queryKey: ['/api/admin/teachers/available'],
  });

  // Create teacher assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: TeacherAssignment) => {
      return await apiRequest('/api/admin/teacher-assignments', {
        method: 'POST',
        body: JSON.stringify(assignment)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Teacher successfully matched with student"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students/unassigned-teacher'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/teachers/available'] });
      setMatchDialogOpen(false);
      setSelectedStudent(null);
      setSelectedTeacher(null);
      setSelectedSlots([]);
      setMatchFormData({ classType: 'private', mode: 'online', notes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create teacher assignment",
        variant: "destructive"
      });
    }
  });

  // Calculate time slot match percentage
  const getMatchPercentage = (student: Student, teacher: Teacher): number => {
    if (!student.timeSlots || !teacher.timeSlots || 
        student.timeSlots.length === 0 || teacher.timeSlots.length === 0) {
      return 0;
    }

    const matchingSlots = student.timeSlots.filter(studentSlot => 
      teacher.timeSlots.some(teacherSlot => 
        teacherSlot.day === studentSlot.day &&
        isTimeOverlap(studentSlot, teacherSlot)
      )
    );

    return Math.round((matchingSlots.length / student.timeSlots.length) * 100);
  };

  // Check if two time slots overlap
  const isTimeOverlap = (slot1: TimeSlot, slot2: TimeSlot): boolean => {
    const start1 = convertToMinutes(slot1.startTime);
    const end1 = convertToMinutes(slot1.endTime);
    const start2 = convertToMinutes(slot2.startTime);
    const end2 = convertToMinutes(slot2.endTime);

    return start1 < end2 && start2 < end1;
  };

  // Convert time string to minutes
  const convertToMinutes = (time: string): number => {
    const [hours, minutes] = time.split(':').map(Number);
    return hours * 60 + minutes;
  };

  // Get matching time slots between student and teacher
  const getMatchingSlots = (student: Student, teacher: Teacher): TimeSlot[] => {
    if (!student.timeSlots || !teacher.timeSlots) return [];

    return student.timeSlots.filter(studentSlot => 
      teacher.timeSlots.some(teacherSlot => 
        teacherSlot.day === studentSlot.day &&
        isTimeOverlap(studentSlot, teacherSlot)
      )
    );
  };

  // Filter students
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || student.level === filterLevel;
    const matchesLanguage = filterLanguage === "all" || student.language === filterLanguage;
    const matchesClassType = filterClassType === "all" || student.preferredClassType === filterClassType || student.preferredClassType === 'both';
    const matchesMode = filterMode === "all" || student.preferredMode === filterMode || student.preferredMode === 'both';
    return matchesSearch && matchesLevel && matchesLanguage && matchesClassType && matchesMode;
  });

  // Get compatible teachers for selected student
  const getCompatibleTeachers = (student: Student) => {
    return teachers.filter((teacher: Teacher) => {
      const hasCapacity = teacher.currentStudents < teacher.maxStudents;
      const speaksLanguage = teacher.languages && teacher.languages.includes(student.language);
      const teachesLevel = teacher.levels && teacher.levels.includes(student.level);
      const supportsClassType = student.preferredClassType === 'both' || 
                               teacher.classTypes.includes(student.preferredClassType);
      const supportsMode = student.preferredMode === 'both' || 
                          teacher.modes.includes(student.preferredMode);
      
      return hasCapacity && speaksLanguage && teachesLevel && supportsClassType && supportsMode;
    });
  };

  const handleMatchSubmit = () => {
    if (!selectedStudent || !selectedTeacher || selectedSlots.length === 0) return;

    const assignment: TeacherAssignment = {
      teacherId: selectedTeacher.id,
      studentId: selectedStudent.id,
      classType: matchFormData.classType,
      mode: matchFormData.mode,
      scheduledSlots: selectedSlots,
      notes: matchFormData.notes
    };

    createAssignmentMutation.mutate(assignment);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Teacher-Student Matching System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Match students with teachers based on schedule availability, language, level, and preferences
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Students Needing Teachers</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Awaiting assignment</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Teachers</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{teachers.length}</div>
              <p className="text-xs text-muted-foreground">Have capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Private Classes</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s: Student) => s.preferredClassType === 'private').length}
              </div>
              <p className="text-xs text-muted-foreground">Students prefer 1-on-1</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Online Classes</CardTitle>
              <Video className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {students.filter((s: Student) => s.preferredMode === 'online').length}
              </div>
              <p className="text-xs text-muted-foreground">Prefer virtual</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-9"
                />
              </div>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger>
                  <SelectValue placeholder="All Levels" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger>
                  <SelectValue placeholder="All Languages" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="persian">Persian</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClassType} onValueChange={setFilterClassType}>
                <SelectTrigger>
                  <SelectValue placeholder="Class Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                  <SelectItem value="group">Group Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Modes</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                  <SelectItem value="in-person">In-Person</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Students List */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Students Needing Teachers</h2>
            {studentsLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No students found matching criteria</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {filteredStudents.map((student: Student) => (
                  <Card 
                    key={student.id}
                    className={`cursor-pointer transition-all ${
                      selectedStudent?.id === student.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-gray-600">{student.email}</p>
                            <div className="flex items-center gap-2 mt-2">
                              <Badge variant="secondary">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {student.level}
                              </Badge>
                              <Badge variant="outline">
                                {student.language}
                              </Badge>
                              <Badge variant={student.preferredClassType === 'private' ? 'default' : 'secondary'}>
                                {student.preferredClassType}
                              </Badge>
                              <Badge variant="outline">
                                {student.preferredMode === 'online' ? <Video className="h-3 w-3" /> : <Home className="h-3 w-3" />}
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>
                      {student.timeSlots && student.timeSlots.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Available Times:</p>
                          <p className="text-xs text-gray-600">
                            {student.timeSlots.length} time slots across week
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Compatible Teachers */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedStudent ? 'Compatible Teachers' : 'Select a Student'}
            </h2>
            {!selectedStudent ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a student to see compatible teachers</p>
                </CardContent>
              </Card>
            ) : teachersLoading ? (
              <div className="text-center py-8">Loading teachers...</div>
            ) : (
              <div className="space-y-4">
                {getCompatibleTeachers(selectedStudent)
                  .sort((a, b) => getMatchPercentage(selectedStudent, b) - getMatchPercentage(selectedStudent, a))
                  .map((teacher: Teacher) => {
                    const matchPercentage = getMatchPercentage(selectedStudent, teacher);
                    const matchingSlots = getMatchingSlots(selectedStudent, teacher);
                    return (
                      <Card 
                        key={teacher.id}
                        className={`cursor-pointer transition-all ${
                          selectedTeacher?.id === teacher.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedTeacher(teacher)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {teacher.firstName[0]}{teacher.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">
                                    {teacher.firstName} {teacher.lastName}
                                  </h3>
                                  <Badge 
                                    variant={matchPercentage >= 80 ? "default" : matchPercentage >= 50 ? "secondary" : "outline"}
                                  >
                                    {matchPercentage}% Schedule Match
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{teacher.email}</p>
                                <div className="flex items-center gap-2 mt-2">
                                  <span className="text-sm">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {teacher.currentStudents}/{teacher.maxStudents} students
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ¥{teacher.hourlyRate}/hour
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <div className="flex flex-wrap gap-1 mb-2">
                              {teacher.languages.map((lang, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={lang === selectedStudent.language ? "default" : "outline"} 
                                  className="text-xs"
                                >
                                  {lang}
                                </Badge>
                              ))}
                              {teacher.classTypes.map((type, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            {matchingSlots.length > 0 && (
                              <p className="text-xs text-green-600">
                                <Clock className="h-3 w-3 inline mr-1" />
                                {matchingSlots.length} matching time slots
                              </p>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Match Dialog */}
        <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
          <DialogTrigger asChild>
            <Button 
              className="fixed bottom-8 right-8"
              size="lg"
              disabled={!selectedStudent || !selectedTeacher}
            >
              <UserPlus className="h-5 w-5 mr-2" />
              Match Selected
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Confirm Teacher-Student Match</DialogTitle>
              <DialogDescription>
                Review and confirm the assignment details
              </DialogDescription>
            </DialogHeader>
            
            {selectedStudent && selectedTeacher && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Student</Label>
                    <p className="font-medium">{selectedStudent.firstName} {selectedStudent.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedStudent.email}</p>
                  </div>
                  <div>
                    <Label>Teacher</Label>
                    <p className="font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                    <p className="text-sm text-gray-600">{selectedTeacher.email}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Class Type</Label>
                    <Select 
                      value={matchFormData.classType} 
                      onValueChange={(value) => setMatchFormData({...matchFormData, classType: value as 'private' | 'group'})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="private">Private (1-on-1)</SelectItem>
                        <SelectItem value="group">Group Class</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Mode</Label>
                    <Select 
                      value={matchFormData.mode} 
                      onValueChange={(value) => setMatchFormData({...matchFormData, mode: value as 'online' | 'in-person'})}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="online">Online</SelectItem>
                        <SelectItem value="in-person">In-Person</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Select Time Slots</Label>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                    {getMatchingSlots(selectedStudent, selectedTeacher).map((slot, idx) => (
                      <div key={idx} className="flex items-center space-x-2">
                        <Checkbox 
                          checked={selectedSlots.some(s => 
                            s.day === slot.day && s.startTime === slot.startTime
                          )}
                          onCheckedChange={(checked) => {
                            if (checked) {
                              setSelectedSlots([...selectedSlots, slot]);
                            } else {
                              setSelectedSlots(selectedSlots.filter(s => 
                                !(s.day === slot.day && s.startTime === slot.startTime)
                              ));
                            }
                          }}
                        />
                        <span className="text-sm">
                          {slot.day} {slot.startTime} - {slot.endTime}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <Label>Additional Notes</Label>
                  <Textarea
                    placeholder="Any special requirements or notes..."
                    value={matchFormData.notes}
                    onChange={(e) => setMatchFormData({...matchFormData, notes: e.target.value})}
                    rows={3}
                  />
                </div>

                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleMatchSubmit}
                    disabled={selectedSlots.length === 0}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Confirm Match
                  </Button>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}