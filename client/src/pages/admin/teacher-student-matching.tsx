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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Teacher-Student Matching System
          </h1>
          <p className="text-lg text-gray-600 max-w-3xl mx-auto">
            Match students with teachers based on schedule availability, language, level, and preferences
          </p>
        </div>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-blue-100">Students Needing Teachers</CardTitle>
              <Users className="h-5 w-5 text-blue-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{students.length}</div>
              <p className="text-xs text-blue-100">Awaiting assignment</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-green-100">Available Teachers</CardTitle>
              <UserPlus className="h-5 w-5 text-green-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{teachers.length}</div>
              <p className="text-xs text-green-100">Have capacity</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-purple-100">Private Classes</CardTitle>
              <Target className="h-5 w-5 text-purple-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {students.filter((s: Student) => s.preferredClassType === 'private' || s.preferredClassType === 'both').length}
              </div>
              <p className="text-xs text-purple-100">Students prefer 1-on-1</p>
            </CardContent>
          </Card>
          <Card className="bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium text-indigo-100">Online Classes</CardTitle>
              <Video className="h-5 w-5 text-indigo-200" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">
                {students.filter((s: Student) => s.preferredMode === 'online' || s.preferredMode === 'both').length}
              </div>
              <p className="text-xs text-indigo-100">Prefer virtual</p>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="mb-8 shadow-lg border-0 bg-white/80 backdrop-blur-sm">
          <CardHeader className="bg-gradient-to-r from-gray-50 to-gray-100 rounded-t-lg">
            <CardTitle className="flex items-center text-gray-800">
              <Filter className="h-5 w-5 mr-2 text-blue-600" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 h-11 border-gray-200 focus:border-blue-500 focus:ring-blue-500"
                />
              </div>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Languages</SelectItem>
                  <SelectItem value="persian">Persian</SelectItem>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterClassType} onValueChange={setFilterClassType}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="private">Private Only</SelectItem>
                  <SelectItem value="group">Group Only</SelectItem>
                </SelectContent>
              </Select>
              <Select value={filterMode} onValueChange={setFilterMode}>
                <SelectTrigger className="h-11 border-gray-200 focus:border-blue-500">
                  <SelectValue placeholder="Select Mode" />
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
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-8">
          {/* Students List */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Students Needing Teachers</h2>
              <Badge variant="secondary" className="text-sm">
                {filteredStudents.length} students
              </Badge>
            </div>
            {studentsLoading ? (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Loading students...</p>
                </CardContent>
              </Card>
            ) : filteredStudents.length === 0 ? (
              <Card className="shadow-lg border-dashed border-2 border-gray-300">
                <CardContent className="text-center py-12">
                  <AlertCircle className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">No students found</h3>
                  <p className="text-gray-500">Try adjusting your search filters to find more students</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {filteredStudents.map((student: Student) => (
                  <Card 
                    key={student.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                      selectedStudent?.id === student.id 
                        ? 'ring-2 ring-blue-500 shadow-lg bg-blue-50/50' 
                        : 'hover:shadow-md border-gray-200'
                    }`}
                    onClick={() => setSelectedStudent(student)}
                  >
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center space-x-4">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-gradient-to-br from-blue-400 to-blue-600 text-white font-semibold">
                              {student.firstName[0]}{student.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-semibold text-lg text-gray-900">
                              {student.firstName} {student.lastName}
                            </h3>
                            <p className="text-sm text-gray-600 mb-3">{student.email}</p>
                            <div className="flex flex-wrap gap-2">
                              <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                                <BookOpen className="h-3 w-3 mr-1" />
                                {student.level}
                              </Badge>
                              <Badge variant="outline" className="border-green-200 text-green-700">
                                {student.language}
                              </Badge>
                              <Badge variant={student.preferredClassType === 'private' ? 'default' : 'secondary'}>
                                {student.preferredClassType}
                              </Badge>
                              <Badge variant="outline" className="border-purple-200 text-purple-700">
                                {student.preferredMode === 'online' ? <Video className="h-3 w-3 mr-1" /> : <Home className="h-3 w-3 mr-1" />}
                                {student.preferredMode}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        {selectedStudent?.id === student.id && (
                          <CheckCircle className="h-6 w-6 text-blue-500" />
                        )}
                      </div>
                      {student.timeSlots && student.timeSlots.length > 0 && (
                        <div className="mt-4 p-3 bg-gray-50 rounded-lg">
                          <p className="text-sm font-medium text-gray-700 mb-1">Available Times:</p>
                          <p className="text-xs text-gray-600">
                            {student.timeSlots.length} time slots available across the week
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
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">
                {selectedStudent ? 'Select a Teacher' : 'Select a Student'}
              </h2>
              {selectedStudent && (
                <Button 
                  className="bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                  disabled={!selectedTeacher}
                  onClick={() => setMatchDialogOpen(true)}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  Match Selected
                </Button>
              )}
            </div>
            {!selectedStudent ? (
              <Card className="shadow-lg border-dashed border-2 border-gray-300">
                <CardContent className="text-center py-16">
                  <Users className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-700 mb-2">Choose a student first</h3>
                  <p className="text-gray-500">Select a student from the left to see compatible teachers</p>
                </CardContent>
              </Card>
            ) : teachersLoading ? (
              <Card className="shadow-lg">
                <CardContent className="text-center py-12">
                  <div className="animate-spin w-8 h-8 border-4 border-green-500 border-t-transparent rounded-full mx-auto mb-4"></div>
                  <p className="text-gray-600">Finding compatible teachers...</p>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4 max-h-[600px] overflow-y-auto pr-2">
                {getCompatibleTeachers(selectedStudent)
                  .sort((a, b) => getMatchPercentage(selectedStudent, b) - getMatchPercentage(selectedStudent, a))
                  .map((teacher: Teacher) => {
                    const matchPercentage = getMatchPercentage(selectedStudent, teacher);
                    const matchingSlots = getMatchingSlots(selectedStudent, teacher);
                    return (
                      <Card 
                        key={teacher.id}
                        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                          selectedTeacher?.id === teacher.id 
                            ? 'ring-2 ring-green-500 shadow-lg bg-green-50/50' 
                            : 'hover:shadow-md border-gray-200'
                        }`}
                        onClick={() => setSelectedTeacher(teacher)}
                      >
                        <CardContent className="p-6">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-4">
                              <Avatar className="h-12 w-12">
                                <AvatarFallback className="bg-gradient-to-br from-green-400 to-green-600 text-white font-semibold">
                                  {teacher.firstName[0]}{teacher.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1">
                                  <h3 className="font-semibold text-lg text-gray-900">
                                    {teacher.firstName} {teacher.lastName}
                                  </h3>
                                  <Badge 
                                    variant={matchPercentage >= 80 ? "default" : matchPercentage >= 50 ? "secondary" : "outline"}
                                    className={`${
                                      matchPercentage >= 80 ? 'bg-green-500 text-white' : 
                                      matchPercentage >= 50 ? 'bg-yellow-500 text-white' : 
                                      'bg-gray-200 text-gray-700'
                                    }`}
                                  >
                                    {matchPercentage}% Match
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600 mb-3">{teacher.email}</p>
                                <div className="flex items-center gap-4">
                                  <span className="text-sm text-gray-700">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {teacher.currentStudents}/{teacher.maxStudents} students
                                  </span>
                                  <span className="text-sm text-gray-600">
                                    ${teacher.hourlyRate}/hour
                                  </span>
                                </div>
                              </div>
                            </div>
                            {selectedTeacher?.id === teacher.id && (
                              <CheckCircle className="h-6 w-6 text-green-500" />
                            )}
                          </div>
                          <div className="mt-4">
                            <div className="flex flex-wrap gap-2 mb-3">
                              {teacher.languages?.map((lang, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={lang === selectedStudent.language ? "default" : "outline"} 
                                  className={`text-xs ${
                                    lang === selectedStudent.language ? 'bg-blue-500 text-white' : 'border-gray-300'
                                  }`}
                                >
                                  {lang}
                                </Badge>
                              ))}
                              {teacher.classTypes?.map((type, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs bg-purple-100 text-purple-700">
                                  {type}
                                </Badge>
                              ))}
                            </div>
                            {matchingSlots.length > 0 && (
                              <div className="p-2 bg-green-50 rounded-lg">
                                <p className="text-xs text-green-700 font-medium">
                                  <Clock className="h-3 w-3 inline mr-1" />
                                  {matchingSlots.length} matching time slots available
                                </p>
                              </div>
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
                  <Label className="mb-2">Schedule & Availability</Label>
                  <div className="grid grid-cols-2 gap-4">
                    {/* Student Availability - Left Column */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-gray-700">Student's Available Times</h4>
                      <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
                        {selectedStudent.timeSlots && selectedStudent.timeSlots.length > 0 ? (
                          <div className="space-y-1">
                            {selectedStudent.timeSlots.map((slot, idx) => (
                              <div key={idx} className="text-sm py-1">
                                <span className="font-medium">{slot.day}:</span>{' '}
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No availability set</p>
                        )}
                      </div>
                    </div>

                    {/* Teacher Availability - Right Column */}
                    <div>
                      <h4 className="text-sm font-medium mb-2 text-gray-700">Teacher's Available Times</h4>
                      <div className="border rounded-lg p-3 bg-gray-50 dark:bg-gray-800 max-h-48 overflow-y-auto">
                        {selectedTeacher.timeSlots && selectedTeacher.timeSlots.length > 0 ? (
                          <div className="space-y-1">
                            {selectedTeacher.timeSlots.map((slot, idx) => (
                              <div key={idx} className="text-sm py-1">
                                <span className="font-medium">{slot.day}:</span>{' '}
                                {slot.startTime} - {slot.endTime}
                              </div>
                            ))}
                          </div>
                        ) : (
                          <p className="text-sm text-gray-500">No availability set</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Matching Slots Selection */}
                  <div className="mt-4">
                    <h4 className="text-sm font-medium mb-2">Select Matching Time Slots</h4>
                    <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-2">
                      {getMatchingSlots(selectedStudent, selectedTeacher).length > 0 ? (
                        getMatchingSlots(selectedStudent, selectedTeacher).map((slot, idx) => (
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
                        ))
                      ) : (
                        <p className="text-sm text-gray-500 text-center py-4">
                          No overlapping time slots found between student and teacher
                        </p>
                      )}
                    </div>
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