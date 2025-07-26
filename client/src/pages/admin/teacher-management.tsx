import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from 'react-i18next';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Plus,
  Search,
  Filter,
  Users,
  GraduationCap,
  Star,
  Clock,
  Eye,
  Edit3,
  Mail,
  Phone,
  BookOpen,
  Calendar,
  User,
  Camera,
  Upload
} from "lucide-react";

const teacherSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  specialization: z.string().min(1, "Specialization is required"),
  qualifications: z.string().min(1, "Qualifications are required"),
  experience: z.string().min(1, "Experience is required"),
  languages: z.string().min(1, "Languages taught are required"),
  hourlyRate: z.number().min(1, "Hourly rate must be greater than 0"),
  bio: z.string().optional(),
  status: z.enum(["active", "inactive"]).default("active"),
});

type TeacherFormData = z.infer<typeof teacherSchema>;

export function AdminTeacherManagement() {
  const { t } = useTranslation(['admin', 'common']);
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedTeacher, setSelectedTeacher] = useState<any>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading, error, refetch } = useQuery({
    queryKey: ['/api/teachers/list'],
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      specialization: "",
      qualifications: "",
      experience: "",
      languages: "",
      hourlyRate: 500000,
      bio: "",
      status: "active",
    },
  });

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherFormData) => {
      const teacherData = {
        ...data,
        role: "instructor",
        password: "teacher123", // Default password - should be changed on first login
      };
      return apiRequest("/api/teachers/create", {
        method: "POST",
        body: JSON.stringify(teacherData),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/list'] });
      setIsCreateDialogOpen(false);
      form.reset();
      toast({
        title: t('common:success'),
        description: t('admin:teachers.createdSuccessfully'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:error'),
        description: error.message || t('admin:teachers.failedToCreate'),
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
  };

  // Edit form
  const editForm = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: { id: number; formData: TeacherFormData }) => {
      return apiRequest(`/api/teachers/${data.id}`, {
        method: "PUT",
        body: JSON.stringify({
          firstName: data.formData.firstName,
          lastName: data.formData.lastName,
          email: data.formData.email,
          phone: data.formData.phone,
          specialization: data.formData.specialization,
          qualifications: data.formData.qualifications,
          experience: data.formData.experience,
          languages: data.formData.languages,
          hourlyRate: data.formData.hourlyRate,
          bio: data.formData.bio,
          status: data.formData.status,
        }),
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/teachers/list'] });
      setIsEditDialogOpen(false);
      editForm.reset();
      toast({
        title: t('common:toast.success'),
        description: t('common:toast.teacherUpdated'),
      });
    },
    onError: (error: any) => {
      toast({
        title: t('common:toast.error'),
        description: error.message || t('common:toast.teacherCreateFailed'),
        variant: "destructive",
      });
    },
  });

  const onEditSubmit = (data: TeacherFormData) => {
    if (selectedTeacher) {
      updateTeacherMutation.mutate({ id: selectedTeacher.id, formData: data });
    }
  };

  // Set form values when teacher is selected for editing
  const handleEditTeacher = (teacher: any) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      firstName: teacher.firstName || "",
      lastName: teacher.lastName || "",
      email: teacher.email || "",
      phone: teacher.phoneNumber || "",
      specialization: teacher.specialization || "",
      qualifications: teacher.qualifications || "",
      experience: teacher.experience || "",
      languages: teacher.languages || "",
      hourlyRate: teacher.hourlyRate || 500000,
      bio: teacher.bio || "",
      status: teacher.isActive !== false ? "active" : "inactive",
    });
    setIsEditDialogOpen(true);
  };

  const filteredTeachers = Array.isArray(teachers) ? teachers.filter((teacher: any) => {
    const matchesSearch = teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || 
                         (filterStatus === "active" && teacher.isActive) ||
                         (filterStatus === "inactive" && !teacher.isActive);
    return matchesSearch && matchesStatus;
  }) : [];

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('admin:teachers.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin:teachers.subtitle')}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden border-emerald-200">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
              className="rounded-none border-0 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <GraduationCap className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">Cards</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none border-0 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">List</span>
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Teacher</span>
                <span className="sm:hidden">Add</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Add New Teacher</DialogTitle>
                <DialogDescription>
                  Create a new instructor account and profile
                </DialogDescription>
              </DialogHeader>
              
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="firstName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>First Name</FormLabel>
                          <FormControl>
                            <Input placeholder="John" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="lastName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Last Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Doe" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="email"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Email</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder="teacher@institute.com" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    
                    <FormField
                      control={form.control}
                      name="phone"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Phone (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="+98 912 345 6789" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="specialization"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Specialization</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select specialization" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Persian Language">Persian Language</SelectItem>
                              <SelectItem value="English Language">English Language</SelectItem>
                              <SelectItem value="Arabic Language">Arabic Language</SelectItem>
                              <SelectItem value="French Language">French Language</SelectItem>
                              <SelectItem value="Mathematics">Mathematics</SelectItem>
                              <SelectItem value="Literature">Literature</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="experience"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Experience</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Years of experience" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-2 years">1-2 years</SelectItem>
                              <SelectItem value="3-5 years">3-5 years</SelectItem>
                              <SelectItem value="5-10 years">5-10 years</SelectItem>
                              <SelectItem value="10+ years">10+ years</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="languages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Languages Taught</FormLabel>
                          <FormControl>
                            <Input placeholder="e.g., Persian, English" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="hourlyRate"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Hourly Rate (Toman)</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder="500000"
                              {...field}
                              onChange={(e) => field.onChange(Number(e.target.value))}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  <FormField
                    control={form.control}
                    name="qualifications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qualifications</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Degree, certifications, and relevant qualifications..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Bio (Optional)</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Brief description of teaching approach and background..."
                            {...field}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <div className="flex justify-end gap-3">
                    <Button 
                      type="button" 
                      variant="outline" 
                      onClick={() => setIsCreateDialogOpen(false)}
                    >
                      Cancel
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTeacherMutation.isPending}
                    >
                      {createTeacherMutation.isPending ? "Creating..." : "Create Teacher"}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Teachers</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(teachers) ? teachers.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Teachers</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(teachers) ? teachers.filter((t: any) => t.isActive !== false).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              94% active rate
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Rating</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              +0.2 from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Hours</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              Teaching hours this month
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search teachers..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-8"
            />
          </div>
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Teachers</SelectItem>
            <SelectItem value="active">Active Only</SelectItem>
            <SelectItem value="inactive">Inactive Only</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-destructive/10 rounded-full flex items-center justify-center">
                  <svg className="w-5 h-5 text-destructive" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="font-medium text-destructive">Failed to load teachers</h3>
                  <p className="text-sm text-muted-foreground">
                    {error.message || 'An error occurred while fetching teacher data'}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={teachersLoading}
              >
                {teachersLoading ? "Retrying..." : "Retry"}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Teachers List */}
      {!error && (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachersLoading ? (
              <div className="col-span-full text-center py-8">Loading teachers...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">
                No teachers found matching your criteria
              </div>
            ) : (
              filteredTeachers.map((teacher: any) => (
              <Card key={teacher.id} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex justify-between items-start mb-2">
                    <div className="flex items-center space-x-3">
                      <div className="relative">
                        <div className="w-16 h-16 rounded-full overflow-hidden bg-gray-200 flex items-center justify-center">
                          <img 
                            src={`/uploads/teacher-photos/${teacher.id}.jpg`}
                            alt={`${teacher.firstName} ${teacher.lastName}`}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              e.currentTarget.style.display = 'none';
                              (e.currentTarget.nextElementSibling as HTMLElement).style.display = 'flex';
                            }}
                          />
                          <div className="w-full h-full flex items-center justify-center text-gray-400 hidden">
                            <User className="h-8 w-8" />
                          </div>
                        </div>
                        <Button
                          size="sm"
                          className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full p-0"
                          onClick={() => {
                            const input = document.createElement('input');
                            input.type = 'file';
                            input.accept = 'image/*';
                            input.onchange = async (e) => {
                              const file = (e.target as HTMLInputElement).files?.[0];
                              if (file) {
                                const formData = new FormData();
                                formData.append('photo', file);
                                try {
                                  await apiRequest(`/api/admin/teachers/${teacher.id}/upload-photo`, {
                                    method: 'POST',
                                    body: formData
                                  });
                                  toast({
                                    title: "Photo Uploaded",
                                    description: `Photo uploaded for ${teacher.firstName} ${teacher.lastName}`,
                                  });
                                  refetch(); // Refresh teacher list
                                } catch (error) {
                                  toast({
                                    title: "Upload Failed",
                                    description: "Failed to upload teacher photo",
                                    variant: "destructive"
                                  });
                                }
                              }
                            };
                            input.click();
                          }}
                        >
                          <Camera className="h-3 w-3" />
                        </Button>
                      </div>
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          {teacher.firstName} {teacher.lastName}
                        </CardTitle>
                        <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                          {teacher.isActive !== false ? "Active" : "Inactive"}
                        </Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => {
                          setSelectedTeacher(teacher);
                          setIsViewDialogOpen(true);
                        }}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditTeacher(teacher)}
                      >
                        <Edit3 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Mail className="h-4 w-4" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.phoneNumber && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Phone className="h-4 w-4" />
                        <span>{teacher.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm">
                      <BookOpen className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Specialization:</span>
                      <span>{teacher.specialization || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Experience:</span>
                      <span>{teacher.experience || 'Not specified'}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Rate:</span>
                      <span>{new Intl.NumberFormat('fa-IR').format(teacher.hourlyRate || 500000)} تومان/ساعت</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">Rating:</span>
                      <span>4.8/5.0</span>
                    </div>
                  </div>
                  {teacher.qualifications && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>Qualifications:</strong> {teacher.qualifications}
                      </p>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))
          )}
        </div>
      ) : (
        <Card>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-muted/50">
                  <tr>
                    <th className="text-left p-4 font-medium">Name</th>
                    <th className="text-left p-4 font-medium">Email</th>
                    <th className="text-left p-4 font-medium">Specialization</th>
                    <th className="text-left p-4 font-medium">Experience</th>
                    <th className="text-left p-4 font-medium">Rate</th>
                    <th className="text-left p-4 font-medium">Status</th>
                    <th className="text-left p-4 font-medium">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachersLoading ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8">Loading teachers...</td>
                    </tr>
                  ) : filteredTeachers.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-8 text-muted-foreground">
                        No teachers found matching your criteria
                      </td>
                    </tr>
                  ) : (
                    filteredTeachers.map((teacher: any) => (
                      <tr key={teacher.id} className="border-b hover:bg-muted/25">
                        <td className="p-4">
                          <div>
                            <div className="font-medium">{teacher.firstName} {teacher.lastName}</div>
                            {teacher.phoneNumber && (
                              <div className="text-sm text-muted-foreground">{teacher.phoneNumber}</div>
                            )}
                          </div>
                        </td>
                        <td className="p-4 text-sm">{teacher.email}</td>
                        <td className="p-4 text-sm">{teacher.specialization || 'Not specified'}</td>
                        <td className="p-4 text-sm">{teacher.experience || 'Not specified'}</td>
                        <td className="p-4 text-sm">
                          {new Intl.NumberFormat('fa-IR').format(teacher.hourlyRate || 500000)} تومان
                        </td>
                        <td className="p-4">
                          <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                            {teacher.isActive !== false ? "Active" : "Inactive"}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => {
                                setSelectedTeacher(teacher);
                                setIsViewDialogOpen(true);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              onClick={() => handleEditTeacher(teacher)}
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
        )
      )}

      {/* View Teacher Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Teacher Details</DialogTitle>
            <DialogDescription>
              View complete information for {selectedTeacher?.firstName} {selectedTeacher?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Full Name</label>
                  <p className="text-lg font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Email</label>
                  <p>{selectedTeacher.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Phone</label>
                  <p>{selectedTeacher.phoneNumber || 'Not provided'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Status</label>
                  <div className="mt-1">
                    <Badge variant={selectedTeacher.isActive !== false ? "default" : "secondary"}>
                      {selectedTeacher.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Specialization</label>
                  <p>{selectedTeacher.specialization || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Experience</label>
                  <p>{selectedTeacher.experience || 'Not specified'}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Hourly Rate</label>
                  <p className="text-lg font-medium">
                    {new Intl.NumberFormat('fa-IR').format(selectedTeacher.hourlyRate || 500000)} تومان/ساعت
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Languages</label>
                  <p>{selectedTeacher.languages || 'Not specified'}</p>
                </div>
              </div>
              
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Qualifications</label>
                  <p className="mt-1 text-sm">{selectedTeacher.qualifications || 'Not specified'}</p>
                </div>
                
                {selectedTeacher.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">Biography</label>
                    <p className="mt-1 text-sm">{selectedTeacher.bio}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">Member Since</label>
                  <p className="text-sm">{new Date(selectedTeacher.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              Close
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}>
              <Edit3 className="h-4 w-4 mr-2" />
              Edit Teacher
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Teacher</DialogTitle>
            <DialogDescription>
              Update information for {selectedTeacher?.firstName} {selectedTeacher?.lastName}
            </DialogDescription>
          </DialogHeader>
          
          <Form {...editForm}>
            <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="firstName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>First Name</FormLabel>
                      <FormControl>
                        <Input placeholder="John" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="lastName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Last Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Doe" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder="teacher@institute.com" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={editForm.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone (Optional)</FormLabel>
                      <FormControl>
                        <Input placeholder="+98 912 345 6789" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="specialization"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Specialization</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select specialization" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Persian Language">Persian Language</SelectItem>
                          <SelectItem value="English Language">English Language</SelectItem>
                          <SelectItem value="Arabic Language">Arabic Language</SelectItem>
                          <SelectItem value="French Language">French Language</SelectItem>
                          <SelectItem value="Mathematics">Mathematics</SelectItem>
                          <SelectItem value="Literature">Literature</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="experience"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Years of experience" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-2 years">1-2 years</SelectItem>
                          <SelectItem value="3-5 years">3-5 years</SelectItem>
                          <SelectItem value="5-10 years">5-10 years</SelectItem>
                          <SelectItem value="10+ years">10+ years</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={editForm.control}
                  name="languages"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Languages Taught</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Persian, English" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={editForm.control}
                  name="hourlyRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Hourly Rate (Toman)</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder="500000"
                          {...field}
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={editForm.control}
                name="qualifications"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Qualifications</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Degree, certifications, and relevant qualifications..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Bio (Optional)</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder="Brief description of teaching approach and background..."
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={editForm.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">Active</SelectItem>
                        <SelectItem value="inactive">Inactive</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit" disabled={updateTeacherMutation.isPending}>
                  {updateTeacherMutation.isPending ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}