import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
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
  Calendar
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

  // Fetch teachers
  const { data: teachers = [], isLoading: teachersLoading, error } = useQuery({
    queryKey: ['/api/teachers/list']
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
        title: "Success",
        description: "Teacher created successfully",
      });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to create teacher",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: TeacherFormData) => {
    createTeacherMutation.mutate(data);
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
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Teacher Management</h1>
          <p className="text-muted-foreground">Manage instructors and teaching staff</p>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <Button
              variant={viewMode === "cards" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("cards")}
            >
              Cards
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
            >
              List
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Teacher
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

      {/* Teachers List */}
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
                <div className="flex justify-between items-start">
                  <div className="space-y-1">
                    <CardTitle className="text-lg">
                      {teacher.firstName} {teacher.lastName}
                    </CardTitle>
                    <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                      {teacher.isActive !== false ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      <span>{teacher.email}</span>
                    </div>
                    {teacher.phoneNumber && (
                      <div className="flex items-center gap-1">
                        <Phone className="h-4 w-4" />
                        <span>{teacher.phoneNumber}</span>
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "View Teacher",
                          description: `Viewing details for ${teacher.firstName} ${teacher.lastName}`,
                        });
                      }}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      View
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        toast({
                          title: "Edit Teacher",
                          description: `Edit functionality for ${teacher.firstName} ${teacher.lastName} will be implemented`,
                        });
                      }}
                    >
                      <Edit3 className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <BookOpen className="h-4 w-4" />
                    <span>{teacher.specialization || 'Not specified'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Star className="h-4 w-4" />
                    <span>4.8 rating</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span>{teacher.experience || '5 years'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Clock className="h-4 w-4" />
                    <span>{new Intl.NumberFormat('fa-IR').format(teacher.hourlyRate || 500000)} تومان/ساعت</span>
                  </div>
                </div>
                {teacher.qualifications && (
                  <p className="text-sm text-muted-foreground mb-2">
                    <strong>Qualifications:</strong> {teacher.qualifications}
                  </p>
                )}
                {teacher.bio && (
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {teacher.bio}
                  </p>
                )}
              </CardContent>
            </Card>
          ))
        )}
      </div>
    </div>
  );
}