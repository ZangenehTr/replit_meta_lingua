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
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { 
  Search, 
  Filter, 
  Users, 
  Star, 
  Clock,
  Languages,
  Target,
  BookOpen,
  Award,
  MessageSquare,
  Link2,
  CheckCircle,
  AlertCircle,
  UserPlus
} from "lucide-react";

interface Student {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  level: string;
  language: string;
  learningGoals?: string[];
  currentMentorId?: number;
  enrollmentDate: string;
}

interface Mentor {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  specializations: string[];
  languages: string[];
  rating: number;
  activeStudents: number;
  maxStudents: number;
  availability: string;
  bio?: string;
}

interface MentorAssignment {
  id?: number;
  mentorId: number;
  studentId: number;
  status: 'active' | 'pending' | 'completed';
  goals?: string;
  notes?: string;
}

export default function MentorMatchingPage() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterLevel, setFilterLevel] = useState("all");
  const [filterLanguage, setFilterLanguage] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [matchDialogOpen, setMatchDialogOpen] = useState(false);
  const [matchFormData, setMatchFormData] = useState({
    goals: "",
    notes: ""
  });

  // Fetch students without mentors
  const { data: students = [], isLoading: studentsLoading } = useQuery({
    queryKey: ['/api/admin/students/unassigned'],
  });

  // Fetch available mentors
  const { data: mentors = [], isLoading: mentorsLoading } = useQuery({
    queryKey: ['/api/admin/mentors/available'],
  });

  // Fetch existing assignments
  const { data: assignments = [] } = useQuery({
    queryKey: ['/api/admin/mentor-assignments'],
  });

  // Create mentor assignment mutation
  const createAssignmentMutation = useMutation({
    mutationFn: async (assignment: MentorAssignment) => {
      return await apiRequest('/api/admin/mentor-assignments', {
        method: 'POST',
        body: JSON.stringify(assignment)
      });
    },
    onSuccess: () => {
      toast({
        title: "Success",
        description: "Mentor successfully matched with student"
      });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/students/unassigned'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mentors/available'] });
      queryClient.invalidateQueries({ queryKey: ['/api/admin/mentor-assignments'] });
      setMatchDialogOpen(false);
      setSelectedStudent(null);
      setSelectedMentor(null);
      setMatchFormData({ goals: "", notes: "" });
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to create mentor assignment",
        variant: "destructive"
      });
    }
  });

  // Filter students
  const filteredStudents = students.filter((student: Student) => {
    const matchesSearch = student.firstName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.lastName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesLevel = filterLevel === "all" || student.level === filterLevel;
    const matchesLanguage = filterLanguage === "all" || student.language === filterLanguage;
    return matchesSearch && matchesLevel && matchesLanguage;
  });

  // Get compatible mentors for selected student
  const getCompatibleMentors = (student: Student) => {
    return mentors.filter((mentor: Mentor) => {
      const hasCapacity = mentor.activeStudents < mentor.maxStudents;
      const speaksLanguage = mentor.languages && student.language && mentor.languages.includes(student.language);
      return hasCapacity && speaksLanguage;
    });
  };

  const handleMatchSubmit = () => {
    if (!selectedStudent || !selectedMentor) return;

    const assignment: MentorAssignment = {
      mentorId: selectedMentor.id,
      studentId: selectedStudent.id,
      status: 'active',
      goals: matchFormData.goals,
      notes: matchFormData.notes
    };

    createAssignmentMutation.mutate(assignment);
  };

  const getMatchScore = (student: Student, mentor: Mentor) => {
    let score = 0;
    
    // Language match
    if (mentor.languages.includes(student.language)) score += 40;
    
    // Capacity available
    const capacityRatio = (mentor.maxStudents - mentor.activeStudents) / mentor.maxStudents;
    score += capacityRatio * 20;
    
    // Rating
    score += (mentor.rating / 5) * 20;
    
    // Specialization match (if student has learning goals)
    if (student.learningGoals && student.learningGoals.length > 0) {
      const matchingGoals = student.learningGoals.filter(goal => 
        mentor.specializations.some(spec => 
          spec.toLowerCase().includes(goal.toLowerCase()) || 
          goal.toLowerCase().includes(spec.toLowerCase())
        )
      );
      score += (matchingGoals.length / student.learningGoals.length) * 20;
    }
    
    return Math.round(score);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Mentor Matching System
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            Match students with compatible mentors based on language, level, and learning goals
          </p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned Students</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{students.length}</div>
              <p className="text-xs text-muted-foreground">Need mentors</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Available Mentors</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{mentors.length}</div>
              <p className="text-xs text-muted-foreground">Have capacity</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Matches</CardTitle>
              <Link2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{assignments.filter((a: any) => a.status === 'active').length}</div>
              <p className="text-xs text-muted-foreground">Ongoing mentorships</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Avg Match Score</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {assignments.length > 0 
                  ? `${Math.round((assignments.filter((a: any) => a.status === 'active').length / assignments.length) * 100)}%`
                  : 'N/A'}
              </div>
              <p className="text-xs text-muted-foreground">Success rate</p>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Find Students</CardTitle>
            <CardDescription>Search and filter students who need mentors</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input
                  placeholder="Search students..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
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
                  <SelectItem value="Persian">Persian</SelectItem>
                  <SelectItem value="English">English</SelectItem>
                  <SelectItem value="Arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>

              <Button variant="outline">
                <Filter className="h-4 w-4 mr-2" />
                More Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Students List */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Students Needing Mentors</h2>
            {studentsLoading ? (
              <div className="text-center py-8">Loading students...</div>
            ) : filteredStudents.length === 0 ? (
              <Card>
                <CardContent className="text-center py-8">
                  <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No unassigned students found</p>
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
                            <div className="flex items-center gap-4 mt-2">
                              {student.level && (
                                <Badge variant="secondary">
                                  <BookOpen className="h-3 w-3 mr-1" />
                                  {student.level}
                                </Badge>
                              )}
                              {student.language && (
                                <Badge variant="outline">
                                  <Languages className="h-3 w-3 mr-1" />
                                  {student.language}
                                </Badge>
                              )}
                              <span className="text-xs text-gray-500">
                                <Clock className="h-3 w-3 inline mr-1" />
                                Enrolled {new Date(student.enrollmentDate).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                      {student.learningGoals && student.learningGoals.length > 0 && (
                        <div className="mt-3">
                          <p className="text-sm font-medium mb-1">Learning Goals:</p>
                          <div className="flex flex-wrap gap-1">
                            {student.learningGoals.map((goal, idx) => (
                              <Badge key={idx} variant="secondary" className="text-xs">
                                {goal}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          {/* Compatible Mentors */}
          <div>
            <h2 className="text-xl font-semibold mb-4">
              {selectedStudent ? 'Compatible Mentors' : 'Select a Student'}
            </h2>
            {!selectedStudent ? (
              <Card>
                <CardContent className="text-center py-16">
                  <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">Select a student to see compatible mentors</p>
                </CardContent>
              </Card>
            ) : mentorsLoading ? (
              <div className="text-center py-8">Loading mentors...</div>
            ) : (
              <div className="space-y-4">
                {getCompatibleMentors(selectedStudent)
                  .sort((a, b) => getMatchScore(selectedStudent, b) - getMatchScore(selectedStudent, a))
                  .map((mentor: Mentor) => {
                    const matchScore = getMatchScore(selectedStudent, mentor);
                    return (
                      <Card 
                        key={mentor.id}
                        className={`cursor-pointer transition-all ${
                          selectedMentor?.id === mentor.id ? 'ring-2 ring-primary' : 'hover:shadow-md'
                        }`}
                        onClick={() => setSelectedMentor(mentor)}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex items-center space-x-3">
                              <Avatar>
                                <AvatarFallback>
                                  {mentor.firstName[0]}{mentor.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-medium">
                                    {mentor.firstName} {mentor.lastName}
                                  </h3>
                                  <Badge variant={matchScore >= 80 ? "default" : matchScore >= 60 ? "secondary" : "outline"}>
                                    {matchScore}% Match
                                  </Badge>
                                </div>
                                <p className="text-sm text-gray-600">{mentor.email}</p>
                                <div className="flex items-center gap-4 mt-2">
                                  <div className="flex items-center">
                                    <Star className="h-3 w-3 fill-yellow-400 text-yellow-400 mr-1" />
                                    <span className="text-sm">{mentor.rating}</span>
                                  </div>
                                  <span className="text-sm">
                                    <Users className="h-3 w-3 inline mr-1" />
                                    {mentor.activeStudents}/{mentor.maxStudents} students
                                  </span>
                                  <Badge variant="outline" className="text-xs">
                                    {mentor.availability}
                                  </Badge>
                                </div>
                              </div>
                            </div>
                          </div>
                          <div className="mt-3">
                            <p className="text-sm font-medium mb-1">Specializations:</p>
                            <div className="flex flex-wrap gap-1">
                              {mentor.specializations.map((spec, idx) => (
                                <Badge key={idx} variant="secondary" className="text-xs">
                                  {spec}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          <div className="mt-2">
                            <p className="text-sm font-medium mb-1">Languages:</p>
                            <div className="flex flex-wrap gap-1">
                              {mentor.languages.map((lang, idx) => (
                                <Badge 
                                  key={idx} 
                                  variant={lang === selectedStudent.language ? "default" : "outline"} 
                                  className="text-xs"
                                >
                                  {lang}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          {mentor.bio && (
                            <p className="text-sm text-gray-600 mt-2">{mentor.bio}</p>
                          )}
                        </CardContent>
                      </Card>
                    );
                  })}
              </div>
            )}
          </div>
        </div>

        {/* Match Button */}
        {selectedStudent && selectedMentor && (
          <div className="fixed bottom-8 right-8 z-50">
            <Dialog open={matchDialogOpen} onOpenChange={setMatchDialogOpen}>
              <DialogTrigger asChild>
                <Button size="lg" className="shadow-lg">
                  <UserPlus className="h-5 w-5 mr-2" />
                  Match {selectedStudent.firstName} with {selectedMentor.firstName}
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Confirm Mentor-Student Match</DialogTitle>
                  <DialogDescription>
                    Create a mentorship relationship between the selected student and mentor
                  </DialogDescription>
                </DialogHeader>
                
                <div className="space-y-6">
                  {/* Match Summary */}
                  <div className="grid grid-cols-2 gap-4">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Student</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {selectedStudent.firstName[0]}{selectedStudent.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedStudent.firstName} {selectedStudent.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {selectedStudent.level} • {selectedStudent.language}
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-base">Mentor</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-center space-x-3">
                          <Avatar>
                            <AvatarFallback>
                              {selectedMentor.firstName[0]}{selectedMentor.lastName[0]}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">
                              {selectedMentor.firstName} {selectedMentor.lastName}
                            </p>
                            <p className="text-sm text-gray-600">
                              Rating: {selectedMentor.rating} • {selectedMentor.activeStudents}/{selectedMentor.maxStudents} students
                            </p>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {/* Match Score */}
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                    <p className="text-sm text-gray-600 mb-2">Compatibility Score</p>
                    <div className="text-3xl font-bold text-primary">
                      {getMatchScore(selectedStudent, selectedMentor)}%
                    </div>
                  </div>

                  {/* Goals and Notes */}
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="goals">Learning Goals (Optional)</Label>
                      <Textarea
                        id="goals"
                        placeholder="Specific goals for this mentorship..."
                        value={matchFormData.goals}
                        onChange={(e) => setMatchFormData({ ...matchFormData, goals: e.target.value })}
                        rows={3}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="notes">Additional Notes (Optional)</Label>
                      <Textarea
                        id="notes"
                        placeholder="Any special considerations or notes..."
                        value={matchFormData.notes}
                        onChange={(e) => setMatchFormData({ ...matchFormData, notes: e.target.value })}
                        rows={2}
                      />
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 mt-6">
                  <Button variant="outline" onClick={() => setMatchDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button 
                    onClick={handleMatchSubmit}
                    disabled={createAssignmentMutation.isPending}
                  >
                    {createAssignmentMutation.isPending ? (
                      <>Creating Match...</>
                    ) : (
                      <>
                        <CheckCircle className="h-4 w-4 mr-2" />
                        Confirm Match
                      </>
                    )}
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>
    </div>
  );
}