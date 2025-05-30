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
import { RotatingDatePicker } from "@/components/ui/rotating-date-picker";
import { useLanguage } from "@/hooks/use-language";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { format } from "date-fns";
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
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [newStudentData, setNewStudentData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    nationalId: "",
    birthday: null,
    level: "",
    guardianName: "",
    guardianPhone: "",
    profileImage: null,
    notes: ""
  });
  const queryClient = useQueryClient();

  // Fetch students data
  const { data: students, isLoading } = useQuery({
    queryKey: ['/api/students/list', { search: searchTerm, status: filterStatus }],
  });

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
        guardianName: "",
        guardianPhone: "",
        profileImage: null,
        notes: ""
      });
    }
  });

  const handleCreateStudent = async () => {
    // Validate required fields
    if (!newStudentData.firstName || !newStudentData.lastName || !newStudentData.email) {
      alert('Please fill in all required fields');
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
        notes: newStudentData.notes
      };

      await createStudentMutation.mutateAsync(studentData);
      // Success handled in onSuccess callback
    } catch (error: any) {
      console.error('Error creating student:', error);
      const errorMessage = error?.message || 'Failed to create student. Please check all fields and try again.';
      alert(errorMessage);
    }
  };

  const handleImageUpload = (event) => {
    const file = event.target.files[0];
    if (file) {
      setNewStudentData({ ...newStudentData, profileImage: file });
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
                  <Input 
                    id="phone" 
                    placeholder="+1234567890"
                    value={newStudentData.phone}
                    onChange={(e) => setNewStudentData({...newStudentData, phone: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="nationalId">National ID Number</Label>
                  <Input 
                    id="nationalId" 
                    placeholder="Enter national ID number"
                    value={newStudentData.nationalId}
                    onChange={(e) => setNewStudentData({...newStudentData, nationalId: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="birthday">Birthday</Label>
                  <RotatingDatePicker
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
                  <Input 
                    id="guardianPhone" 
                    placeholder="Guardian phone number"
                    value={newStudentData.guardianPhone}
                    onChange={(e) => setNewStudentData({...newStudentData, guardianPhone: e.target.value})}
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

                <Button variant="outline" size="sm">
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