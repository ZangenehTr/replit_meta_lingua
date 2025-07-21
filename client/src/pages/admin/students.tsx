import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
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
import { useLocation } from "wouter";
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
  ChevronLeft,
  Grid3X3,
  List,
  MoreHorizontal,
  X
} from "lucide-react";

export function AdminStudents() {
  const { t, isRTL } = useLanguage();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState("cards"); // "cards" or "list"
  const [sortBy, setSortBy] = useState("newest"); // "newest", "oldest", "course", "level"
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState(null);
  const [editStudentData, setEditStudentData] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    status: 'active',
    level: 'Beginner',
    courses: [] as string[]
  });
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
    courses: [] as string[],
    selectedCourses: [],
    totalFee: 0
  });
  const queryClient = useQueryClient();

  // Handle VoIP call functionality
  const handleVoIPCall = async (student: any) => {
    // Check if student has a phone number
    if (!student.phone) {
      toast({
        title: "No Phone Number",
        description: `${student.firstName} ${student.lastName} does not have a phone number on file.`,
        variant: "destructive",
      });
      return;
    }

    try {
      // Use the VoIP API to initiate call
      const response = await fetch('/api/voip/initiate-call', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          phoneNumber: student.phone,
          contactName: `${student.firstName} ${student.lastName}`,
          callType: 'outbound',
          recordCall: true,
          studentId: student.id
        })
      });

      if (!response.ok) {
        throw new Error('Failed to initiate call');
      }

      const callData = await response.json();
      
      toast({
        title: "VoIP Call Initiated",
        description: `Connecting to ${student.firstName} ${student.lastName} at ${student.phone}...`,
      });

      // Log the call attempt
      console.log(`VoIP call initiated to ${student.firstName} ${student.lastName} at ${student.phone}`, callData);
      
    } catch (error) {
      console.error('VoIP call error:', error);
      toast({
        title: "Call Failed",
        description: "Unable to initiate VoIP call. Please try again.",
        variant: "destructive",
      });
    }
  };

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

  // Handle student contact/communication
  const handleContact = async (student: any) => {
    try {
      console.log('Starting contact with student:', student.firstName, student.lastName, 'ID:', student.id);
      
      // Navigate to communication center with student pre-selected
      const response = await fetch('/api/communication/create-conversation', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
        },
        body: JSON.stringify({
          studentId: student.id,
          studentName: `${student.firstName} ${student.lastName}`,
          subject: `Contact with ${student.firstName} ${student.lastName}`
        })
      });

      if (response.ok) {
        const conversation = await response.json();
        toast({
          title: "Communication Started",
          description: `Opening chat with ${student.firstName} ${student.lastName}`,
        });
        
        // Navigate to communication center with conversation ID
        setLocation(`/admin/communications?conversation=${conversation.conversation.id}`);
        console.log('Communication initiated:', conversation);
      } else {
        throw new Error('Failed to create conversation');
      }
    } catch (error) {
      console.error('Contact error:', error);
      toast({
        title: "Contact Failed",
        description: `Unable to start communication with ${student.firstName} ${student.lastName}. Please try again.`,
        variant: "destructive",
      });
    }
  };

  // Handle adding course to new student
  const handleAddCourse = (courseTitle: string) => {
    const course = coursesList.find((c: any) => c.title === courseTitle);
    if (course && !newStudentData.courses.includes(courseTitle)) {
      setNewStudentData(prev => ({
        ...prev,
        courses: [...prev.courses, courseTitle]
      }));
    }
  };

  // Handle removing course from new student
  const handleRemoveCourse = (courseTitle: string) => {
    setNewStudentData(prev => ({
      ...prev,
      courses: prev.courses.filter(c => c !== courseTitle)
    }));
  };

  // Handle adding new student
  const handleAddStudent = () => {
    createStudentMutation.mutate(newStudentData);
  };

  // Handle course selection for editing student
  const handleEditCourseSelection = (courseId: number, selected: boolean) => {
    setEditingStudent(prev => {
      if (!prev) return prev;
      
      const currentSelectedCourses = prev.selectedCourses || [];
      let updatedCourses;
      
      if (selected) {
        // Add course if not already selected
        if (!currentSelectedCourses.includes(courseId)) {
          updatedCourses = [...currentSelectedCourses, courseId];
        } else {
          updatedCourses = currentSelectedCourses;
        }
      } else {
        // Remove course if selected
        updatedCourses = currentSelectedCourses.filter(id => id !== courseId);
      }
      
      return {
        ...prev,
        selectedCourses: updatedCourses
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
  const availableCourses = coursesList;



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
        courses: [], // Add required courses field
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
      // Force cache invalidation and immediate refetch
      queryClient.removeQueries({ queryKey: ['/api/students/list'] });
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
    console.log('EDIT FUNCTION CALLED - Student:', student.firstName, student.lastName);
    console.log('Student courses:', student.courses);
    console.log('Available courses:', coursesList);
    
    // Fixed course mapping - only map courses that actually exist
    const selectedCourseIds = student.courses?.map((courseName: string) => {
      // First try exact match
      let course = coursesList.find((c: any) => c.title === courseName);
      
      // If no exact match, try partial matching
      if (!course) {
        course = coursesList.find((c: any) => 
          c.title.toLowerCase().includes(courseName.toLowerCase()) ||
          courseName.toLowerCase().includes(c.title.toLowerCase())
        );
      }
      
      // Special mappings for known mismatches
      if (!course && courseName === "Business Communication") {
        course = coursesList.find((c: any) => c.title === "Business English for Iranians");
      }
      
      if (course) {
        console.log(`Mapping course "${courseName}" to:`, course.title, `(ID: ${course.id})`);
        return course.id;
      } else {
        console.log(`No matching course found for: "${courseName}"`);
        return null;
      }
    }).filter(id => id !== null && id !== undefined) || [];

    console.log('Selected course IDs:', selectedCourseIds);

    console.log('Student birthday data:', student.birthday);
    
    setEditingStudent({
      ...student,
      birthday: student.birthday ? new Date(student.birthday) : null,
      nationalId: student.nationalId || '',
      guardianName: student.guardianName || '',
      guardianPhone: student.guardianPhone || '',
      notes: student.notes || '',
      selectedCourses: selectedCourseIds,
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
      console.log('Frontend birthday value before processing:', editingStudent.birthday);
      const birthdayValue = editingStudent.birthday ? editingStudent.birthday.toISOString() : null;
      console.log('Frontend birthday value after processing:', birthdayValue);
      
      const studentData = {
        firstName: editingStudent.firstName,
        lastName: editingStudent.lastName,
        email: editingStudent.email,
        phone: editingStudent.phone,
        nationalId: editingStudent.nationalId,
        birthday: birthdayValue,
        level: editingStudent.level,
        guardianName: editingStudent.guardianName,
        guardianPhone: editingStudent.guardianPhone,
        notes: editingStudent.notes,
        status: editingStudent.status,
        selectedCourses: editingStudent.selectedCourses || []
      };
      
      console.log('Complete student data being sent:', studentData);

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

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    
    try {
      const response = await apiRequest(`/api/students/${editingStudent.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(editStudentData)
      });

      if (response) {
        toast({
          title: "Success",
          description: "Student has been updated successfully.",
        });
        
        queryClient.invalidateQueries({ queryKey: ['/api/students/list'] });
        setIsEditDialogOpen(false);
        setEditingStudent(null);
      }
    } catch (error) {
      console.error('Error updating student:', error);
      toast({
        title: "Error", 
        description: "Failed to update student. Please try again.",
        variant: "destructive",
      });
    }
  };

  const studentData = students || [];

  const filteredAndSortedStudents = (Array.isArray(studentData) ? studentData : []).filter(student => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = searchTerm === "" || 
                         student.firstName.toLowerCase().includes(searchLower) ||
                         student.lastName.toLowerCase().includes(searchLower) ||
                         student.email.toLowerCase().includes(searchLower) ||
                         (student.phone && student.phone.toLowerCase().includes(searchLower)) ||
                         `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest":
        return new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
      case "newest":
        return new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime();
      case "course":
        const aCourses = (a.courses || []).join(", ");
        const bCourses = (b.courses || []).join(", ");
        return aCourses.localeCompare(bCourses);
      case "level":
        const levelOrder = { "Beginner": 1, "Intermediate": 2, "Advanced": 3 };
        return (levelOrder[a.level] || 0) - (levelOrder[b.level] || 0);
      default:
        return 0;
    }
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
    <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 space-y-6 ${isRTL ? 'rtl' : 'ltr'}`}>
      {/* Header - Mobile-first redesign */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => window.history.back()}
            className="h-8 px-3 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm"
          >
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:mr-1" />
            <span className="hidden sm:inline">Back</span>
          </Button>
          
          <div className="text-right">
            <h1 className="text-lg sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              {t('admin.students')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block">
              Student management and tracking
            </p>
          </div>
        </div>
        {/* Mobile-first controls */}
        <div className="flex flex-wrap gap-2">
          {/* Sort and View Mode - Single row on mobile */}
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 min-w-[120px] h-8 text-xs sm:text-sm border-blue-200">
              <SelectValue placeholder="Sort..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">Newest First</SelectItem>
              <SelectItem value="oldest">Oldest First</SelectItem>
              <SelectItem value="course">By Course</SelectItem>
              <SelectItem value="level">By Level</SelectItem>
            </SelectContent>
          </Select>
          
          {/* Compact View Toggle */}
          <div className="flex border rounded-md overflow-hidden border-blue-200">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="h-8 px-2 sm:px-3 rounded-none border-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs"
            >
              <Grid3X3 className="h-3 w-3" />
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="h-8 px-2 sm:px-3 rounded-none border-0 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs"
            >
              <List className="h-3 w-3" />
            </Button>
          </div>
          
          <Button variant="outline" className="h-8 px-2 sm:px-3 border-blue-200 hover:bg-blue-50 text-xs">
            <Download className="h-3 w-3" />
            <span className="hidden lg:inline lg:ml-1">Export</span>
          </Button>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="h-8 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs">
                <Plus className="h-3 w-3" />
                <span className="hidden sm:inline sm:ml-1">Add</span>
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
                          onChange={(e) => handleEditCourseSelection(course.id, e.target.checked)}
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
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="Search students by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 w-full"
          />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Students</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Students View */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {filteredAndSortedStudents.map((student) => (
          <Card key={student.id} className="hover:shadow-xl transition-all duration-200 overflow-hidden border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="pb-2 sm:pb-3 p-3 sm:p-4">
              <div className="flex items-center justify-between gap-2 sm:gap-3">
                <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
                  <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs sm:text-sm shadow-lg flex-shrink-0">
                    {student.firstName[0]}{student.lastName[0]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <CardTitle className="text-sm sm:text-base lg:text-lg leading-tight truncate font-semibold">
                      {student.firstName} {student.lastName}
                    </CardTitle>
                    <p className="text-xs text-gray-500 truncate mt-0.5">{student.email}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <Badge className={`${getStatusColor(student.status)} text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
                    <span className="hidden sm:inline">{student.status}</span>
                    <span className="sm:hidden text-xs font-bold">{student.status === 'active' ? 'A' : 'I'}</span>
                  </Badge>
                  <Badge className={`${getLevelColor(student.level)} text-xs px-1.5 py-0.5 sm:px-2 sm:py-1`}>
                    <span className="hidden sm:inline">{student.level}</span>
                    <span className="sm:hidden text-xs">{student.level[0]}</span>
                  </Badge>
                </div>
              </div>
            </CardHeader>
            <CardContent className="p-3 sm:p-4 pt-0 space-y-2 sm:space-y-3">
              {/* Progress Section - Simplified for mobile */}
              <div className="space-y-1.5">
                <div className="flex justify-between items-center text-xs text-gray-600">
                  <span>Progress</span>
                  <span className="font-semibold text-gray-800">{student.progress}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-1.5 sm:h-2">
                  <div 
                    className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 sm:h-2 rounded-full transition-all duration-500" 
                    style={{ width: `${student.progress}%` }}
                  />
                </div>
              </div>

              {/* Stats Row - Compact mobile layout */}
              <div className="flex justify-between items-center py-1">
                <div className="flex items-center gap-1">
                  <span className="text-xs text-gray-500">Attendance:</span>
                  <span className="text-xs font-bold text-green-600">{student.attendance}%</span>
                </div>
                <div className="text-xs text-gray-500">
                  {student.lastActivity}
                </div>
              </div>

              {/* Courses Section - Mobile optimized */}
              <div className="space-y-1">
                <p className="text-xs text-gray-500 font-medium">Courses:</p>
                <div className="flex flex-wrap gap-1">
                  {student.courses && student.courses.length > 0 ? (
                    <>
                      {student.courses.slice(0, 1).map((course, idx) => (
                        <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5 max-w-full border-blue-200 text-blue-700">
                          <span className="truncate max-w-[120px] sm:max-w-full">{course}</span>
                        </Badge>
                      ))}
                      {student.courses.length > 1 && (
                        <Badge variant="secondary" className="text-xs px-1.5 py-0.5 bg-gray-100 text-gray-600">
                          +{student.courses.length - 1}
                        </Badge>
                      )}
                    </>
                  ) : (
                    <span className="text-gray-400 text-xs">No courses</span>
                  )}
                </div>
              </div>

              {/* Action Buttons - Mobile-first design - STANDARDIZED 4-BUTTON LAYOUT */}
              <div className="flex gap-1 sm:gap-2 pt-2 sm:pt-3">
                {/* Call Button - Always show, with proper handling for missing phone */}
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleVoIPCall(student)}
                  disabled={!student.phone}
                  className="flex-1 h-7 sm:h-8 border-green-200 hover:bg-green-50 text-xs sm:text-sm px-2 sm:px-3 disabled:opacity-50"
                  title={!student.phone ? "No phone number available" : `Call ${student.firstName} ${student.lastName}`}
                >
                  <Phone className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline sm:ml-1">Call</span>
                </Button>
                
                {/* View Button */}
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-7 sm:h-8 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm px-2 sm:px-3"
                    >
                      <Eye className="h-3 w-3 sm:h-4 sm:w-4" />
                      <span className="hidden sm:inline sm:ml-1">View</span>
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

                {/* Edit Button */}
                <Button 
                  variant="outline" 
                  size="sm"
                  className="flex-1 h-7 sm:h-8 border-purple-200 hover:bg-purple-50 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => {
                    console.log('CARD EDIT BUTTON CLICKED - Student:', student.firstName, student.lastName);
                    console.log('Student data:', student);
                    handleEditStudent(student);
                  }}
                >
                  <Edit3 className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline sm:ml-1">Edit</span>
                </Button>
                
                {/* Contact Button - NOW FUNCTIONAL */}
                <Button 
                  variant="outline" 
                  size="sm" 
                  className="flex-1 h-7 sm:h-8 border-orange-200 hover:bg-orange-50 text-xs sm:text-sm px-2 sm:px-3"
                  onClick={() => handleContact(student)}
                >
                  <MessageCircle className="h-3 w-3 sm:h-4 sm:w-4" />
                  <span className="hidden sm:inline sm:ml-1">Contact</span>
                </Button>
              </div>
            </CardContent>
          </Card>
          ))}
        </div>
      ) : (
        // List View - Mobile-optimized
        <div className="space-y-2 sm:space-y-4">
          {/* Desktop header - hidden on mobile */}
          <div className="hidden lg:block bg-white/80 backdrop-blur-sm rounded-lg border-0 shadow-sm">
            <div className="grid grid-cols-12 gap-4 p-4 border-b font-medium text-sm text-gray-600">
              <div className="col-span-3">Student</div>
              <div className="col-span-2">Contact</div>
              <div className="col-span-1">Status</div>
              <div className="col-span-2">Courses</div>
              <div className="col-span-2">Progress</div>
              <div className="col-span-2">Actions</div>
            </div>
            {/* Mobile-first student rows */}
            {filteredAndSortedStudents.map((student) => (
              <div key={student.id} className="bg-white/80 backdrop-blur-sm rounded-lg p-3 sm:p-4 shadow-sm border-0 hover:shadow-md transition-all duration-200 lg:grid lg:grid-cols-12 lg:gap-4 lg:rounded-none lg:bg-transparent lg:shadow-none lg:border-b lg:last:border-b-0 lg:hover:bg-gray-50">
                {/* Mobile layout - stacked */}
                <div className="lg:hidden space-y-3">
                  {/* Student Info */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 via-purple-500 to-indigo-600 rounded-full flex items-center justify-center text-white font-bold text-xs shadow-lg">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <div className="font-semibold text-sm">{student.firstName} {student.lastName}</div>
                        <div className="text-xs text-gray-500">{student.email}</div>
                      </div>
                    </div>
                    <Badge className={`${getStatusColor(student.status)} text-xs px-2 py-1`}>
                      {student.status}
                    </Badge>
                  </div>
                  
                  {/* Progress & Attendance */}
                  <div className="space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-gray-600">Progress</span>
                      <span className="font-semibold">{student.progress}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-1.5">
                      <div 
                        className="bg-gradient-to-r from-blue-500 to-purple-500 h-1.5 rounded-full transition-all duration-500" 
                        style={{ width: `${student.progress}%` }}
                      />
                    </div>
                    <div className="flex justify-between text-xs">
                      <span className="text-gray-500">Attendance: {student.attendance}%</span>
                      <span className="text-gray-500">{student.lastActivity}</span>
                    </div>
                  </div>
                  
                  {/* Courses - Mobile */}
                  <div className="space-y-1">
                    <div className="text-xs text-gray-500 font-medium">Courses:</div>
                    <div className="flex flex-wrap gap-1">
                      {student.courses && student.courses.length > 0 ? (
                        <>
                          {student.courses.slice(0, 2).map((course, idx) => (
                            <Badge key={idx} variant="outline" className="text-xs px-1.5 py-0.5 border-blue-200 text-blue-700">
                              <span className="truncate max-w-[100px]">{course}</span>
                            </Badge>
                          ))}
                          {student.courses.length > 2 && (
                            <Badge variant="secondary" className="text-xs px-1.5 py-0.5">
                              +{student.courses.length - 2}
                            </Badge>
                          )}
                        </>
                      ) : (
                        <span className="text-xs text-gray-400">No courses</span>
                      )}
                    </div>
                  </div>
                  
                  {/* Mobile Actions - STANDARDIZED 4-BUTTON LAYOUT */}
                  <div className="flex gap-1 pt-1">
                    {/* Call Button - Always show */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleVoIPCall(student)}
                      disabled={!student.phone}
                      className="flex-1 h-7 border-green-200 hover:bg-green-50 text-xs px-2 disabled:opacity-50"
                      title={!student.phone ? "No phone number available" : `Call ${student.firstName} ${student.lastName}`}
                    >
                      <Phone className="h-3 w-3" />
                    </Button>
                    {/* View Button */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="flex-1 h-7 border-blue-200 hover:bg-blue-50 text-xs px-2"
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {/* Edit Button */}
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                      className="flex-1 h-7 border-purple-200 hover:bg-purple-50 text-xs px-2"
                    >
                      <Edit3 className="h-3 w-3" />
                    </Button>
                    {/* Contact Button - NOW FUNCTIONAL */}
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={() => handleContact(student)}
                      className="flex-1 h-7 border-orange-200 hover:bg-orange-50 text-xs px-2"
                    >
                      <MessageCircle className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
                
                {/* Desktop layout - grid columns (hidden for mobile-first design) */}
                <div className="hidden lg:contents">
                  <div className="col-span-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm">
                        {student.firstName[0]}{student.lastName[0]}
                      </div>
                      <div>
                        <div className="font-medium">{student.firstName} {student.lastName}</div>
                        <div className="text-sm text-gray-500">ID: {student.id}</div>
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm">
                      <div>{student.email}</div>
                      <div className="text-gray-500">{student.phone}</div>
                    </div>
                  </div>
                  <div className="col-span-1">
                    <Badge className={getStatusColor(student.status)}>
                      {student.status}
                    </Badge>
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-1">
                      {student.courses && student.courses.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {student.courses.map((course, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {course}
                            </Badge>
                          ))}
                        </div>
                      ) : (
                        <span className="text-sm text-gray-500">No active courses</span>
                      )}
                    </div>
                  </div>
                  <div className="col-span-2">
                    <div className="space-y-1">
                      <div className="flex justify-between text-sm">
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
                  </div>
                  <div className="col-span-2">
                    {/* Desktop Actions - STANDARDIZED 4-BUTTON LAYOUT */}
                    <div className="flex gap-1">
                      {/* Call Button - Always show with proper handling */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleVoIPCall(student)}
                        disabled={!student.phone}
                        className="text-green-600 hover:text-green-700 hover:bg-green-50 disabled:opacity-50"
                        title={!student.phone ? "No phone number available" : `Call ${student.firstName} ${student.lastName}`}
                      >
                        <Phone className="h-3 w-3" />
                      </Button>
                      {/* View Button */}
                      <Dialog>
                        <DialogTrigger asChild>
                          <Button 
                            variant="outline" 
                            size="sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Eye className="h-3 w-3" />
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-w-4xl">
                          <DialogHeader>
                            <DialogTitle>Student Profile: {student.firstName} {student.lastName}</DialogTitle>
                          </DialogHeader>
                          <p>Comprehensive student profile view for desktop layout</p>
                        </DialogContent>
                      </Dialog>
                      {/* Edit Button */}
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditStudent(student)}
                        className="text-purple-600 hover:text-purple-700 hover:bg-purple-50"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      {/* Contact Button - NOW FUNCTIONAL */}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        onClick={() => handleContact(student)}
                        className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                      >
                        <MessageCircle className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

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
            <div className="text-2xl font-bold">92.1%</div>
            <p className="text-xs text-blue-600">Excellent performance</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Course Completion</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.6%</div>
            <p className="text-xs text-orange-600">+5.2% from last month</p>
          </CardContent>
        </Card>
      </div>

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Student</DialogTitle>
            <DialogDescription>
              Update student information and enrollment details
            </DialogDescription>
          </DialogHeader>
          {editingStudent && (
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="editFirstName">First Name</Label>
                <Input 
                  id="editFirstName" 
                  placeholder="Enter first name"
                  value={editingStudent.firstName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, firstName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLastName">Last Name</Label>
                <Input 
                  id="editLastName" 
                  placeholder="Enter last name"
                  value={editingStudent.lastName || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, lastName: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editEmail">Email</Label>
                <Input 
                  id="editEmail" 
                  type="email" 
                  placeholder="Enter email address"
                  value={editingStudent.email || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, email: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editPhone">Phone Number</Label>
                <Input 
                  id="editPhone" 
                  type="tel" 
                  placeholder="Enter phone number"
                  value={editingStudent.phone || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, phone: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="editStatus">Status</Label>
                <Select value={editingStudent.status || 'active'} onValueChange={(value) => setEditingStudent({...editingStudent, status: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="editLevel">Level</Label>
                <Select value={editingStudent.level || 'Beginner'} onValueChange={(value) => setEditingStudent({...editingStudent, level: value})}>
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
              <div className="col-span-2 space-y-2">
                <Label htmlFor="editNotes">Notes</Label>
                <Input 
                  id="editNotes" 
                  placeholder="Additional notes about the student"
                  value={editingStudent.notes || ''}
                  onChange={(e) => setEditingStudent({...editingStudent, notes: e.target.value})}
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSaveEdit} disabled={!editingStudent}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Student</DialogTitle>
            <DialogDescription>
              Create a new student profile and enrollment
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
                placeholder="Enter email address"
                value={newStudentData.email}
                onChange={(e) => setNewStudentData({...newStudentData, email: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input 
                id="phone" 
                type="tel" 
                placeholder="Enter phone number"
                value={newStudentData.phone}
                onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="level">Level</Label>
              <Select value={newStudentData.level} onValueChange={(value) => setNewStudentData({...newStudentData, level: value})}>
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
              <Label htmlFor="courses">Course</Label>
              <Select value="" onValueChange={handleAddCourse}>
                <SelectTrigger>
                  <SelectValue placeholder="Select courses" />
                </SelectTrigger>
                <SelectContent>
                  {availableCourses.map((course) => (
                    <SelectItem key={course.id} value={course.title}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* Selected Courses */}
          {newStudentData.courses && newStudentData.courses.length > 0 && (
            <div className="space-y-2">
              <Label>Selected Courses</Label>
              <div className="flex flex-wrap gap-2">
                {newStudentData.courses.map((course, index) => (
                  <Badge key={index} variant="outline" className="flex items-center gap-1">
                    {course}
                    <button
                      onClick={() => handleRemoveCourse(course)}
                      className="ml-1 hover:text-red-600"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </Badge>
                ))}
              </div>
            </div>
          )}
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleAddStudent}>Add Student</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
