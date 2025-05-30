import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { SimpleDateInput } from "@/components/ui/simple-date-input";
import { PhoneInput } from "@/components/ui/phone-input";
import { VoIPContactButton } from "@/components/voip-contact-button";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
import { useToast } from "@/hooks/use-toast";
import { 
  Users, 
  Search, 
  Filter, 
  Plus, 
  Eye, 
  Edit3, 
  MessageCircle,
  Phone,
  Mail,
  Calendar as CalendarIcon,
  BookOpen,
  TrendingUp,
  AlertCircle,
  Clock,
  CheckCircle,
  FileText,
  Download,
  Upload,
  CreditCard,
  GraduationCap,
  History,
  ChevronLeft
} from "lucide-react";

export function AdminStudents() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [newStudentData, setNewStudentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    birthday: null,
    level: "",
    status: "active",
    guardianName: "",
    guardianPhone: "",
    profileImage: null,
    notes: "",
    selectedCourses: [],
    totalFee: 0
  });
  const queryClient = useQueryClient();

  // Handle course selection and fee calculation
  const handleCourseSelection = (courseId: number, selected: boolean) => {
    setNewStudentData(prev => {
      let updatedCourses;
      if (selected) {
        updatedCourses = [...prev.selectedCourses, courseId];
      } else {
        updatedCourses = prev.selectedCourses.filter(id => id !== courseId);
      }
      
      // Calculate total fee
      const totalFee = updatedCourses.reduce((sum, id) => {
        const course = coursesList.find((c: any) => c.id === id);
        return sum + (course?.price || 0);
      }, 0);

      return {
        ...prev,
        selectedCourses: updatedCourses,
        totalFee
      };
    });
  };

  // Fetch students data
  const { data: students, isLoading } = useQuery({
    queryKey: ['/api/students/list', { search: searchTerm, status: filterStatus }],
  });

  // Fetch available courses
  const { data: courses } = useQuery({
    queryKey: ['/api/courses'],
  });

  // Ensure courses is an array to prevent errors
  const coursesList = Array.isArray(courses) ? courses : [];

  console.log('AdminStudents component rendered');
  console.log('Students data:', students);
  console.log('Is loading:', isLoading);

  // Create student mutation
  const createStudentMutation = useMutation({
    mutationFn: (studentData: any) => apiRequest('/api/admin/students', {
      method: 'POST',
      body: JSON.stringify(studentData)
    }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/list'] });
      queryClient.refetchQueries({ queryKey: ['/api/students/list'] });
      setIsCreateDialogOpen(false);
      setNewStudentData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        nationalId: "",
        birthday: null,
        level: "",
        status: "active",
        guardianName: "",
        guardianPhone: "",
        profileImage: null,
        notes: "",
        selectedCourses: [],
        totalFee: 0
      });
    }
  });

  // Edit student mutation
  const editStudentMutation = useMutation({
    mutationFn: ({ id, studentData }: { id: number; studentData: any }) => 
      apiRequest(`/api/admin/students/${id}`, {
        method: 'PUT',
        body: JSON.stringify(studentData)
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/list'] });
      queryClient.refetchQueries({ queryKey: ['/api/students/list'] });
      setIsEditDialogOpen(false);
      setEditingStudent(null);
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    },
    onError: (error: any) => {
      console.error('Edit mutation error:', error);
      let errorMessage = 'Failed to update student. Please try again.';
      
      if (error?.message) {
        const message = error.message;
        if (message.includes('Email already exists')) {
          errorMessage = 'This email address is already registered. Please use a different email address.';
        } else if (message.includes('400:')) {
          const match = message.match(/400:\s*({.*})/);
          if (match) {
            try {
              const errorData = JSON.parse(match[1]);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              errorMessage = message.replace('400:', '').trim();
            }
          }
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  });

  const handleCreateStudent = async () => {
    // Validate required fields
    if (!newStudentData.firstName || !newStudentData.lastName || !newStudentData.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      // Format the data properly
      const studentData = {
        firstName: newStudentData.firstName,
        lastName: newStudentData.lastName,
        email: newStudentData.email,
        phone: newStudentData.phone,
        nationalId: newStudentData.nationalId,
        birthday: newStudentData.birthday ? newStudentData.birthday.toISOString() : null,
        level: newStudentData.level,
        guardianName: newStudentData.guardianName,
        guardianPhone: newStudentData.guardianPhone,
        notes: newStudentData.notes,
        selectedCourses: newStudentData.selectedCourses,
        totalFee: newStudentData.totalFee
      };

      await createStudentMutation.mutateAsync(studentData);
      // Success handled in onSuccess callback
      toast({
        title: "Success",
        description: "Student created successfully",
      });
    } catch (error: any) {
      console.error('Error creating student:', error);
      
      // Parse the error message to show user-friendly text
      let errorMessage = 'Failed to create student. Please try again.';
      
      if (error?.message) {
        const message = error.message;
        if (message.includes('Email already exists')) {
          errorMessage = 'This email address is already registered. Please use a different email address.';
        } else if (message.includes('400:')) {
          // Extract the actual error message from the API response
          const match = message.match(/400:\s*({.*})/);
          if (match) {
            try {
              const errorData = JSON.parse(match[1]);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              // If parsing fails, use the original message
              errorMessage = message.replace('400:', '').trim();
            }
          }
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewStudentData({ ...newStudentData, profileImage: file });
    }
  };

  const handleEditStudent = (student: any) => {
    setEditingStudent({
      ...student,
      birthday: student.birthday ? new Date(student.birthday) : null,
      nationalId: student.nationalId || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      notes: student.notes || '',
      selectedCourses: student.courses?.map((c: any) => c.id) || [],
      status: student.status || 'active'
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent || !editingStudent.firstName || !editingStudent.lastName || !editingStudent.email) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const studentData = {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email,
        phone: editingStudent.phone,
        nationalId: editingStudent.nationalId,
        birthday: editingStudent.birthday ? editingStudent.birthday.toISOString() : null,
        level: editingStudent.level,
        guardianName: editingStudent.guardianName,
        guardianPhone: editingStudent.guardianPhone,
        notes: editingStudent.notes,
        status: editingStudent.status,
        selectedCourses: editingStudent.selectedCourses || []
      };

      await editStudentMutation.mutateAsync({ id: editingStudent.id, studentData });
      toast({
        title: "Success",
        description: "Student updated successfully",
      });
    } catch (error: any) {
      console.error('Error updating student:', error);
      
      let errorMessage = 'Failed to update student. Please try again.';
      
      if (error?.message) {
        const message = error.message;
        if (message.includes('Email already exists')) {
          errorMessage = 'This email address is already registered. Please use a different email address.';
        } else if (message.includes('400:')) {
          const match = message.match(/400:\s*({.*})/);
          if (match) {
            try {
              const errorData = JSON.parse(match[1]);
              errorMessage = errorData.message || errorMessage;
            } catch (e) {
              errorMessage = message.replace('400:', '').trim();
            }
          }
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  const studentData = students || [
    {
      id: 1,
      firstName: "Sarah",
      lastName: "Johnson",
      email: "sarah.j@email.com",
      phone: "+1234567890",
      level: "Intermediate",
      status: "active",
      enrollmentDate: "2024-01-15",
      lastActivity: "2024-01-25",
      courses: ["Persian Basics", "Grammar Mastery"],
      attendance: 85,
      progress: 67,
      guardian: "Mark Johnson",
      guardianPhone: "+1234567891",
      notes: "Excellent progress in speaking skills",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: 2,
      firstName: "Ahmad",
      lastName: "Rahman",
      email: "ahmad.r@email.com",
      phone: "+9876543210",
      level: "Beginner",
      status: "active",
      enrollmentDate: "2024-02-01",
      lastActivity: "2024-01-24",
      courses: ["English Fundamentals"],
      attendance: 92,
      progress: 45,
      guardian: "Fatima Rahman",
      guardianPhone: "+9876543211",
      notes: "Very dedicated student",
      avatar: "/api/placeholder/32/32"
    },
    {
      id: 3,
      firstName: "Maria",
      lastName: "Garcia",
      email: "maria.g@email.com",
      phone: "+5555555555",
      level: "Advanced",
      status: "inactive",
      enrollmentDate: "2023-11-10",
      lastActivity: "2024-01-10",
      courses: ["Business English", "Academic Writing"],
      attendance: 78,
      progress: 89,
      guardian: "Carlos Garcia",
      guardianPhone: "+5555555556",
      notes: "Taking a break for personal reasons",
      avatar: "/api/placeholder/32/32"
    }
  ];

  const filteredStudents = (Array.isArray(studentData) ? studentData : []).filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
                         student.firstName.toLowerCase().includes(searchLower) ||
                         student.lastName.toLowerCase().includes(searchLower) ||
                         student.email.toLowerCase().includes(searchLower) ||
                         (student.phone && student.phone.toLowerCase().includes(searchLower)) ||
                         `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (status) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'inactive': return 'bg-red-100 text-red-800';
      case 'pending': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getLevelColor = (level) => {
    switch (level) {
      case 'Beginner': return 'bg-blue-100 text-blue-800';
      case 'Intermediate': return 'bg-yellow-100 text-yellow-800';
      case 'Advanced': return 'bg-purple-100 text-purple-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className={`p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-4">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
            className="flex items-center gap-2"
          >
            <ChevronLeft className="h-4 w-4" />
            Back
          </Button>
          <div>
            <h1 className="text-3xl font-bold">{t('studentInformationSystem')}</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Complete student profiles, progress tracking, and parent communication
            </p>
          </div>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Button variant="outline" className="w-full sm:w-auto">
            <Download className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Export Data</span>
            <span className="sm:hidden">Export</span>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="w-full sm:w-auto">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Student</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Student</DialogTitle>
                <DialogDescription>
                  Create a comprehensive student profile with all required information
                </DialogDescription>
              </DialogHeader>
              <div className="grid grid-cols-2 gap-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">First Name</Label>
                  <Input 
                    id="firstName" 
                    placeholder="Enter first name"
                    value={newStudentData.firstName}
                    onChange={(e) => setNewStudentData({...newStudentData, firstName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Last Name</Label>
                  <Input 
                    id="lastName" 
                    placeholder="Enter last name"
                    value={newStudentData.lastName}
                    onChange={(e) => setNewStudentData({...newStudentData, lastName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input 
                    id="email" 
                    type="email" 
                    placeholder="student@example.com"
                    value={newStudentData.email}
                    onChange={(e) => setNewStudentData({...newStudentData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <PhoneInput
                    value={newStudentData.phone}
                    onChange={(value) => setNewStudentData({...newStudentData, phone: value})}
                    placeholder="Enter phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID Number</Label>
                  <Input 
                    id="nationalId" 
                    placeholder="Enter national ID number"
                    value={newStudentData.nationalId}
                    onChange={(e) => {
                      const value = e.target.value.replace(/[^\d]/g, ''); // Only allow numbers
                      setNewStudentData({...newStudentData, nationalId: value});
                    }}
                    inputMode="numeric"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <SimpleDateInput
                    value={newStudentData.birthday}
                    onChange={(date) => setNewStudentData({...newStudentData, birthday: date})}
                    placeholder="Select birthday"
                    className="w-full"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Proficiency Level</Label>
                  <Select value={newStudentData.level} onValueChange={(value) => setNewStudentData({...newStudentData, level: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="beginner">Beginner</SelectItem>
                      <SelectItem value="intermediate">Intermediate</SelectItem>
                      <SelectItem value="advanced">Advanced</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="status">Student Status</Label>
                  <Select value={newStudentData.status} onValueChange={(value) => setNewStudentData({...newStudentData, status: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                      <SelectItem value="pending">Pending</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardian">Guardian Name</Label>
                  <Input 
                    id="guardian" 
                    placeholder="Parent/Guardian name"
                    value={newStudentData.guardianName}
                    onChange={(e) => setNewStudentData({...newStudentData, guardianName: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="guardianPhone">Guardian Phone</Label>
                  <PhoneInput
                    value={newStudentData.guardianPhone}
                    onChange={(value) => setNewStudentData({...newStudentData, guardianPhone: value})}
                    placeholder="Enter guardian phone number"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="profileImage">Profile Image</Label>
                  <div className="flex items-center gap-2">
                    <Input 
                      id="profileImage" 
                      type="file" 
                      accept="image/*"
                      onChange={handleImageUpload}
                      className="file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    />
                    <Upload className="h-4 w-4 text-gray-400" />
                  </div>
                </div>
                <div className="col-span-2 space-y-4">
                  <div>
                    <Label>Course Registration</Label>
                    <p className="text-sm text-gray-600 mb-3">Select courses for the student</p>
                    <div className="grid grid-cols-1 gap-3 max-h-40 overflow-y-auto border rounded-md p-3">
                      {coursesList && coursesList.length > 0 ? coursesList.map((course: any) => (
                        <div key={course.id} className="flex items-center justify-between space-x-3 p-2 border rounded-md hover:bg-gray-50">
                          <div className="flex items-center space-x-3">
                            <input
                              type="checkbox"
                              id={`course-${course.id}`}
                              checked={newStudentData.selectedCourses.includes(course.id)}
                              onChange={(e) => handleCourseSelection(course.id, e.target.checked)}
                              className="rounded border-gray-300"
                            />
                            <label htmlFor={`course-${course.id}`} className="flex-1 cursor-pointer">
                              <div className="font-medium">{course.title}</div>
                              <div className="text-sm text-gray-600">{course.level} • {course.language}</div>
                            </label>
                          </div>
                          <div className="text-sm font-medium">
                            {course.price ? `${course.price.toLocaleString()} IRR` : 'Free'}
                          </div>
                        </div>
                      )) : (
                        <div className="text-center text-gray-500 py-4">
                          No courses available. Create courses first.
                        </div>
                      )}
                    </div>
                    {newStudentData.selectedCourses.length > 0 && (
                      <div className="mt-3 p-3 bg-blue-50 rounded-md">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Total Fee:</span>
                          <span className="text-lg font-bold text-blue-600">
                            {newStudentData.totalFee.toLocaleString()} IRR
                          </span>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
                <div className="col-span-2 space-y-2">
                  <Label htmlFor="notes">Initial Notes</Label>
                  <Textarea 
                    id="notes" 
                    placeholder="Any special notes or requirements..."
                    value={newStudentData.notes}
                    onChange={(e) => setNewStudentData({...newStudentData, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3">
                <Button 
                  variant="outline" 
                  onClick={() => setIsCreateDialogOpen(false)}
                  disabled={createStudentMutation.isPending}
                >
                  Cancel
                </Button>
                <Button 
                  onClick={handleCreateStudent}
                  disabled={createStudentMutation.isPending}
                >
                  {createStudentMutation.isPending ? "Creating..." : "Create Student Profile"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Edit Student Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student Profile</DialogTitle>
            <DialogDescription>
              Update student information and profile details
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input 
                  id="editFirstName" 
                  placeholder="Enter first name"
                  value={editingStudent.firstName}
                  onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input 
                  id="editLastName" 
                  placeholder="Enter last name"
                  value={editingStudent.lastName}
                  onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input 
                  id="editEmail" 
                  type="email" 
                  placeholder="student@example.com"
                  value={editingStudent.email}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone</Label>
                <PhoneInput
                  value={editingStudent.phone}
                  onChange={(value) => setEditingStudent({...editingStudent, phone: value})}
                  placeholder="Enter phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editNationalId">National ID</Label>
                <Input 
                  id="editNationalId" 
                  placeholder="National ID number"
                  value={editingStudent.nationalId || ''}
                  onChange={(e) => {
                    const value = e.target.value.replace(/[^\d]/g, ''); // Only allow numbers
                    setEditingStudent({...editingStudent, nationalId: value});
                  }}
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLevel">Level</Label>
                <Select 
                  value={editingStudent.level} 
                  onValueChange={(value) => setEditingStudent({...editingStudent, level: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select level" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Beginner">Beginner</SelectItem>
                    <SelectItem value="Intermediate">Intermediate</SelectItem>
                    <SelectItem value="Advanced">Advanced</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGuardianName">Guardian Name</Label>
                <Input 
                  id="editGuardianName" 
                  placeholder="Guardian's full name"
                  value={editingStudent.guardianName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, guardianName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editGuardianPhone">Guardian Phone</Label>
                <PhoneInput
                  value={editingStudent.guardianPhone || ''}
                  onChange={(value) => setEditingStudent({...editingStudent, guardianPhone: value})}
                  placeholder="Enter guardian phone number"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select 
                  value={editingStudent.status || 'active'} 
                  onValueChange={(value) => setEditingStudent({...editingStudent, status: value})}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="editBirthday">Birthday</Label>
                <SimpleDateInput
                  value={editingStudent.birthday}
                  onChange={(date) => setEditingStudent({...editingStudent, birthday: date})}
                />
              </div>
              <div className="col-span-2 space-y-2">
                <Label>Course Enrollments</Label>
                <div className="border rounded-lg p-4 max-h-32 overflow-y-auto">
                  {coursesList.map((course: any) => (
                    <div key={course.id} className="flex items-center justify-between py-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`edit-course-${course.id}`}
                          checked={editingStudent.selectedCourses?.includes(course.id) || false}
                          onChange={(e) => {
                            const updatedCourses = e.target.checked 
                              ? [...(editingStudent.selectedCourses || []), course.id]
                              : (editingStudent.selectedCourses || []).filter(id => id !== course.id);
                            setEditingStudent({...editingStudent, selectedCourses: updatedCourses});
                          }}
                          className="rounded border-gray-300"
                        />
                        <label htmlFor={`edit-course-${course.id}`} className="text-sm font-medium">
                          {course.title}
                        </label>
                      </div>
                      <span className="text-sm text-gray-500">
                        {course.price?.toLocaleString()} IRR
                      </span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="col-span-2 space-y-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Textarea 
                  id="editNotes" 
                  placeholder="Additional notes about the student"
                  value={editingStudent.notes || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, notes: e.target.value})}
                  rows={3}
                />
              </div>
            </div>
          )}
          <div className="flex justify-end gap-2 pt-4">
            <Button 
              variant="outline" 
              onClick={() => setIsEditDialogOpen(false)}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateStudent}
              disabled={editStudentMutation.isPending}
            >
              {editStudentMutation.isPending ? "Updating..." : "Update Student"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Search and Filters */}
      <div className="flex gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-lg transition-shadow">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div>
                    <CardTitle className="text-lg">{student.firstName} {student.lastName}</CardTitle>
                    <p className="text-sm text-gray-600">{student.email}</p>
                  </div>
                </div>
                <Badge className={getStatusColor(student.status)}>
                  {student.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-600">Level:</span>
                  <Badge className={`ml-2 ${getLevelColor(student.level)}`}>
                    {student.level}
                  </Badge>
                </div>
                <div>
                  <span className="text-gray-600">Attendance:</span>
                  <span className="ml-2 font-bold">{student.attendance}%</span>
                </div>
              </div>

              <div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Progress</span>
                  <span>{student.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full" 
                    style={{ width: `${student.progress}%` }}
                  ></div>
                </div>
              </div>

              <div className="text-sm">
                <p className="text-gray-600">Courses:</p>
                <div className="flex flex-wrap gap-1 mt-1">
                  {student.courses.map((course, idx) => (
                    <Badge key={idx} variant="outline" className="text-xs">
                      {course}
                    </Badge>
                  ))}
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                {student.phone && (
                  <VoIPContactButton 
                    phoneNumber={student.phone}
                    contactName={`${student.firstName} ${student.lastName}`}
                    className="flex-1"
                  />
                )}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button variant="outline" size="sm" className="flex-1">
                      <Eye className="h-4 w-4 mr-1" />
                      View
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-4xl">
                    <DialogHeader>
                      <DialogTitle>Student Profile: {student.firstName} {student.lastName}</DialogTitle>
                    </DialogHeader>
                    
                    <Tabs defaultValue="overview" className="w-full">
                      <TabsList className="grid w-full grid-cols-4">
                        <TabsTrigger value="overview">Overview</TabsTrigger>
                        <TabsTrigger value="academic">Academic</TabsTrigger>
                        <TabsTrigger value="communication">Communication</TabsTrigger>
                        <TabsTrigger value="reports">Reports</TabsTrigger>
                      </TabsList>
                      
                      <TabsContent value="overview" className="space-y-4">
                        <div className="grid grid-cols-2 gap-6">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Personal Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Mail className="h-4 w-4 text-gray-500" />
                                <span>{student.email}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{student.phone}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <CalendarIcon className="h-4 w-4 text-gray-500" />
                                <span>Enrolled: {student.enrollmentDate}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Clock className="h-4 w-4 text-gray-500" />
                                <span>Last Active: {student.lastActivity}</span>
                              </div>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Guardian Information</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-3">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-gray-500" />
                                <span>{student.guardian}</span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Phone className="h-4 w-4 text-gray-500" />
                                <span>{student.guardianPhone}</span>
                              </div>
                              <Button variant="outline" size="sm" className="w-full">
                                <MessageCircle className="h-4 w-4 mr-2" />
                                Contact Guardian
                              </Button>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="academic" className="space-y-4">
                        <div className="grid grid-cols-3 gap-4">
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Current Level</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <Badge className={`${getLevelColor(student.level)} text-lg p-2`}>
                                {student.level}
                              </Badge>
                            </CardContent>
                          </Card>
                          
                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Attendance Rate</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{student.attendance}%</div>
                              <p className="text-sm text-gray-600">Last 30 days</p>
                            </CardContent>
                          </Card>

                          <Card>
                            <CardHeader>
                              <CardTitle className="text-lg">Overall Progress</CardTitle>
                            </CardHeader>
                            <CardContent>
                              <div className="text-2xl font-bold">{student.progress}%</div>
                              <p className="text-sm text-gray-600">Course completion</p>
                            </CardContent>
                          </Card>
                        </div>
                      </TabsContent>

                      <TabsContent value="communication" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Communication Log</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="border-l-4 border-blue-500 pl-4">
                                <p className="font-medium">Progress meeting scheduled</p>
                                <p className="text-sm text-gray-600">Jan 20, 2024 - Called guardian to discuss progress</p>
                              </div>
                              <div className="border-l-4 border-green-500 pl-4">
                                <p className="font-medium">Assignment reminder sent</p>
                                <p className="text-sm text-gray-600">Jan 18, 2024 - SMS reminder about homework</p>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>

                      <TabsContent value="reports" className="space-y-4">
                        <Card>
                          <CardHeader>
                            <CardTitle>Progress Reports</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <div className="space-y-3">
                              <div className="flex items-center justify-between p-3 border rounded">
                                <div>
                                  <p className="font-medium">Monthly Progress Report - January 2024</p>
                                  <p className="text-sm text-gray-600">Generated on Jan 25, 2024</p>
                                </div>
                                <Button variant="outline" size="sm">
                                  <Download className="h-4 w-4 mr-2" />
                                  Download
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      </TabsContent>
                    </Tabs>
                  </DialogContent>
                </Dialog>

                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleEditStudent(student)}
                >
                  <Edit3 className="h-4 w-4 mr-1" />
                  Edit
                </Button>
                <Button variant="outline" size="sm">
                  <MessageCircle className="h-4 w-4 mr-1" />
                  Contact
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Statistics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mt-8">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Total Students</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,247</div>
            <p className="text-xs text-green-600">+12% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Active This Month</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">1,189</div>
            <p className="text-xs text-green-600">95.3% activity rate</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Average Attendance</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">87%</div>
            <p className="text-xs text-yellow-600">+2% from last month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">73%</div>
            <p className="text-xs text-green-600">+5% from last month</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}