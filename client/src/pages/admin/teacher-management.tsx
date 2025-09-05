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
  Upload,
  Video,
  VideoOff
} from "lucide-react";

const teacherSchema = z.object({
  firstName: z.string().min(1, "نام الزامی است"),
  lastName: z.string().min(1, "نام خانوادگی الزامی است"),
  email: z.string().email("ایمیل معتبر الزامی است"),
  phone: z.string().optional(),
  specialization: z.string().min(1, "تخصص الزامی است"),
  qualifications: z.string().min(1, "مدارک الزامی است"),
  experience: z.string().min(1, "تجربه الزامی است"),
  languages: z.string().min(1, "زبان‌های تدریس الزامی است"),
  hourlyRate: z.number().min(1, "نرخ ساعتی باید بیشتر از 0 باشد"),
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
  
  // Fetch Callern teachers authorization status
  const { data: callernTeachers = [] } = useQuery({
    queryKey: ['/api/admin/callern-teachers'],
    retry: 3,
    staleTime: 5 * 60 * 1000,
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

  // Handler for toggling Callern authorization
  const handleCallernToggle = async (teacher: any) => {
    try {
      const isAuthorized = callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized;
      
      if (isAuthorized) {
        // Revoke authorization
        await apiRequest(`/api/admin/callern-teachers/${teacher.id}/authorize`, {
          method: "DELETE"
        });
        toast({
          title: t('admin:teacherManagement.callernAccessRevoked'),
          description: t('admin:teacherManagement.callernAccessRevokedDescription', { 
            name: `${teacher.firstName} ${teacher.lastName}` 
          }),
        });
      } else {
        // Grant authorization
        await apiRequest(`/api/admin/callern-teachers/${teacher.id}/authorize`, {
          method: "POST",
          body: JSON.stringify({
            hourlyRate: teacher.hourlyRate || 150000
          })
        });
        toast({
          title: t('admin:teacherManagement.callernAccessGranted'),
          description: t('admin:teacherManagement.callernAccessGrantedDescription', { 
            name: `${teacher.firstName} ${teacher.lastName}` 
          }),
        });
      }
      
      // Refetch both lists
      refetch();
      queryClient.invalidateQueries({ queryKey: ['/api/admin/callern-teachers'] });
    } catch (error) {
      toast({
        title: t('common:error'),
        description: t('admin:teacherManagement.callernUpdateFailed'),
        variant: "destructive"
      });
    }
  };

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
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t('admin:teacherManagement.title')}</h1>
          <p className="text-muted-foreground mt-2">{t('admin:teacherManagement.description', { defaultValue: 'مدیریت کادر آموزشی و پروفایل‌های آن‌ها' })}</p>
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
              <span className="hidden sm:inline">{t('admin:teacherManagement.viewCards', { defaultValue: 'کارت‌ها' })}</span>
            </Button>
            <Button
              variant={viewMode === "list" ? "default" : "outline"}
              size="sm"
              onClick={() => setViewMode("list")}
              className="rounded-none border-0 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700"
            >
              <Users className="h-4 w-4 mr-2" />
              <span className="hidden sm:inline">{t('admin:teacherManagement.viewList', { defaultValue: 'فهرست' })}</span>
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">{t('admin:teacherManagement.addTeacher')}</span>
                <span className="sm:hidden">{t('admin:teacherManagement.add', { defaultValue: 'افزودن' })}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t('admin:teacherManagement.addTeacher')}</DialogTitle>
                <DialogDescription>
                  {t('admin:teacherManagement.createNewInstructor', { defaultValue: 'ایجاد حساب کاربری و پروفایل جدید برای مدرس' })}
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
                          <FormLabel>{t('admin:teacherManagement.form.firstName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('admin:teacherManagement.form.firstNamePlaceholder', { defaultValue: 'احمد' })} {...field} />
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
                          <FormLabel>{t('admin:teacherManagement.form.lastName')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('admin:teacherManagement.form.lastNamePlaceholder', { defaultValue: 'احمدی' })} {...field} />
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
                          <FormLabel>{t('admin:teacherManagement.form.email')}</FormLabel>
                          <FormControl>
                            <Input type="email" placeholder={t('admin:teacherManagement.form.emailPlaceholder', { defaultValue: 'ahmad@institute.com' })} {...field} />
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
                          <FormLabel>{t('admin:teacherManagement.form.phone')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('admin:teacherManagement.form.phonePlaceholder', { defaultValue: '+98 912 345 6789' })} {...field} />
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
                          <FormLabel>{t('admin:teacherManagement.form.specialization')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin:teacherManagement.form.selectSpecialization')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Persian Language">{t('admin:teacherManagement.form.persianLanguage', { defaultValue: 'زبان فارسی' })}</SelectItem>
                              <SelectItem value="English Language">{t('admin:teacherManagement.form.englishLanguage', { defaultValue: 'زبان انگلیسی' })}</SelectItem>
                              <SelectItem value="Arabic Language">{t('admin:teacherManagement.form.arabicLanguage', { defaultValue: 'زبان عربی' })}</SelectItem>
                              <SelectItem value="French Language">{t('admin:teacherManagement.form.frenchLanguage', { defaultValue: 'زبان فرانسوی' })}</SelectItem>
                              <SelectItem value="Mathematics">{t('admin:teacherManagement.form.mathematics')}</SelectItem>
                              <SelectItem value="Literature">{t('admin:teacherManagement.form.literature')}</SelectItem>
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
                          <FormLabel>{t('admin:teacherManagement.form.experience')}</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder={t('admin:teacherManagement.form.yearsOfExperience')} />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="1-2 years">{t('admin:teacherManagement.form.experience1-2', { defaultValue: '۱-۲ سال' })}</SelectItem>
                              <SelectItem value="3-5 years">{t('admin:teacherManagement.form.experience3-5', { defaultValue: '۳-۵ سال' })}</SelectItem>
                              <SelectItem value="5-10 years">{t('admin:teacherManagement.form.experience5-10', { defaultValue: '۵-۱۰ سال' })}</SelectItem>
                              <SelectItem value="10+ years">{t('admin:teacherManagement.form.experience10plus', { defaultValue: '۱۰+ سال' })}</SelectItem>
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
                          <FormLabel>{t('admin:teacherManagement.form.languagesTaught')}</FormLabel>
                          <FormControl>
                            <Input placeholder={t('admin:teacherManagement.form.languagesTaughtPlaceholder', { defaultValue: 'مثلاً فارسی، انگلیسی' })} {...field} />
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
                          <FormLabel>{t('admin:teacherManagement.form.hourlyRate')}</FormLabel>
                          <FormControl>
                            <Input 
                              type="number" 
                              placeholder={t('admin:teacherManagement.form.hourlyRatePlaceholder', { defaultValue: '500000' })}
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
                        <FormLabel>{t('admin:teacherManagement.form.qualifications')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('admin:teacherManagement.form.qualificationsPlaceholder', { defaultValue: 'مدارک تحصیلی، گواهی‌نامه‌ها و صلاحیت‌های مرتبط...' })}
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
                        <FormLabel>{t('admin:teacherManagement.form.bio')}</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder={t('admin:teacherManagement.form.bioPlaceholder', { defaultValue: 'توضیح مختصری از روش تدریس و سابقه کاری...' })}
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
                      {t('admin:teacherManagement.form.cancel')}
                    </Button>
                    <Button 
                      type="submit" 
                      disabled={createTeacherMutation.isPending}
                    >
                      {createTeacherMutation.isPending ? t('admin:teacherManagement.form.creating', { defaultValue: 'در حال ایجاد...' }) : t('admin:teacherManagement.form.saveTeacher')}
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
            <CardTitle className="text-sm font-medium">{t('admin:teacherManagement.statsTotal', { defaultValue: 'کل مدرسان' })}</CardTitle>
            <GraduationCap className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Array.isArray(teachers) ? teachers.length : 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 {t('admin:teacherManagement.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:teacherManagement.statsActive', { defaultValue: 'مدرسان فعال' })}</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {Array.isArray(teachers) ? teachers.filter((t: any) => t.isActive !== false).length : 0}
            </div>
            <p className="text-xs text-muted-foreground">
              {t('admin:teacherManagement.activeRate', { defaultValue: '94% نرخ فعالیت' })}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:teacherManagement.avgRating')}</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">4.8</div>
            <p className="text-xs text-muted-foreground">
              +0.2 {t('admin:teacherManagement.fromLastMonth')}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">{t('admin:teacherManagement.totalHours')}</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2,847</div>
            <p className="text-xs text-muted-foreground">
              {t('admin:teacherManagement.teachingHoursThisMonth')}
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
              placeholder={t('admin:teacherManagement.searchPlaceholder')}
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
            <SelectItem value="all">{t('admin:teacherManagement.filterAll', { defaultValue: 'همه مدرسان' })}</SelectItem>
            <SelectItem value="active">{t('admin:teacherManagement.filterActive', { defaultValue: 'فقط فعال' })}</SelectItem>
            <SelectItem value="inactive">{t('admin:teacherManagement.filterInactive', { defaultValue: 'فقط غیرفعال' })}</SelectItem>
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
                  <h3 className="font-medium text-destructive">{t('admin:teacherManagement.failedToLoad')}</h3>
                  <p className="text-sm text-muted-foreground">
                    {error.message || t('admin:teacherManagement.errorLoading')}
                  </p>
                </div>
              </div>
              <Button 
                variant="outline" 
                onClick={() => refetch()}
                disabled={teachersLoading}
              >
                {teachersLoading ? t('admin:teacherManagement.retrying') : t('admin:teacherManagement.retry')}
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
                        <div className="flex gap-2">
                          <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                            {teacher.isActive !== false ? t('admin:teacherManagement.status.active') : t('admin:teacherManagement.status.inactive')}
                          </Badge>
                          {callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized && (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                              <Video className="h-3 w-3 mr-1" />
                              Callern
                            </Badge>
                          )}
                        </div>
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
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleCallernToggle(teacher)}
                        title={callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized ? "Revoke Callern Access" : "Grant Callern Access"}
                      >
                        {callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized ? (
                          <VideoOff className="h-4 w-4 text-red-600" />
                        ) : (
                          <Video className="h-4 w-4 text-green-600" />
                        )}
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
                      <span className="font-medium">{t('admin:teacherManagement.labels.specialization')}:</span>
                      <span>{teacher.specialization || t('admin:teacherManagement.notSpecified')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Calendar className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('admin:teacherManagement.labels.experience')}:</span>
                      <span>{teacher.experience || t('admin:teacherManagement.notSpecified')}</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Clock className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('admin:teacherManagement.labels.rate')}:</span>
                      <span>{new Intl.NumberFormat('fa-IR').format(teacher.hourlyRate || 500000)} تومان/ساعت</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm">
                      <Star className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{t('admin:teacherManagement.labels.rating')}:</span>
                      <span>4.8/5.0</span>
                    </div>
                  </div>
                  {teacher.qualifications && (
                    <div className="mt-3 pt-3 border-t">
                      <p className="text-sm text-muted-foreground">
                        <strong>{t('admin:teacherManagement.labels.qualifications')}:</strong> {teacher.qualifications}
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
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.name')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.email')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.specialization')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.experience')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.rate')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.status')}</th>
                    <th className="text-left p-4 font-medium">{t('admin:teacherManagement.table.actions')}</th>
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
                        <td className="p-4 text-sm">{teacher.specialization || t('admin:teacherManagement.notSpecified')}</td>
                        <td className="p-4 text-sm">{teacher.experience || t('admin:teacherManagement.notSpecified')}</td>
                        <td className="p-4 text-sm">
                          {new Intl.NumberFormat('fa-IR').format(teacher.hourlyRate || 500000)} تومان
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                              {teacher.isActive !== false ? t('admin:teacherManagement.status.active') : t('admin:teacherManagement.status.inactive')}
                            </Badge>
                            {callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized && (
                              <Badge variant="outline" className="bg-green-50 text-green-700 border-green-300">
                                <Video className="h-3 w-3 mr-1" />
                                Callern
                              </Badge>
                            )}
                          </div>
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
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleCallernToggle(teacher)}
                              title={callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized ? "Revoke Callern Access" : "Grant Callern Access"}
                            >
                              {callernTeachers.find((ct: any) => ct.id === teacher.id)?.isCallernAuthorized ? (
                                <VideoOff className="h-4 w-4 text-red-600" />
                              ) : (
                                <Video className="h-4 w-4 text-green-600" />
                              )}
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
            <DialogTitle>{t('admin:teacherManagement.dialogs.viewTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin:teacherManagement.dialogs.viewDescription', { 
                name: `${selectedTeacher?.firstName} ${selectedTeacher?.lastName}` 
              })}
            </DialogDescription>
          </DialogHeader>
          
          {selectedTeacher && (
            <div className="grid grid-cols-2 gap-6">
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.fullName', 'نام کامل')}</label>
                  <p className="text-lg font-medium">{selectedTeacher.firstName} {selectedTeacher.lastName}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.email')}</label>
                  <p>{selectedTeacher.email}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.phone')}</label>
                  <p>{selectedTeacher.phoneNumber || t('admin:teacherManagement.notSpecified')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.status')}</label>
                  <div className="mt-1">
                    <Badge variant={selectedTeacher.isActive !== false ? "default" : "secondary"}>
                      {selectedTeacher.isActive !== false ? t('admin:teacherManagement.status.active') : t('admin:teacherManagement.status.inactive')}
                    </Badge>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.specialization')}</label>
                  <p>{selectedTeacher.specialization || t('admin:teacherManagement.notSpecified')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.experience')}</label>
                  <p>{selectedTeacher.experience || t('admin:teacherManagement.notSpecified')}</p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.hourlyRate')}</label>
                  <p className="text-lg font-medium">
                    {new Intl.NumberFormat('fa-IR').format(selectedTeacher.hourlyRate || 500000)} تومان/ساعت
                  </p>
                </div>
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.languages')}</label>
                  <p>{selectedTeacher.languages || t('admin:teacherManagement.notSpecified')}</p>
                </div>
              </div>
              
              <div className="col-span-2 space-y-4">
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.qualifications')}</label>
                  <p className="mt-1 text-sm">{selectedTeacher.qualifications || t('admin:teacherManagement.notSpecified')}</p>
                </div>
                
                {selectedTeacher.bio && (
                  <div>
                    <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.biography')}</label>
                    <p className="mt-1 text-sm">{selectedTeacher.bio}</p>
                  </div>
                )}
                
                <div>
                  <label className="text-sm font-medium text-muted-foreground">{t('admin:teacherManagement.labels.memberSince')}</label>
                  <p className="text-sm">{new Date(selectedTeacher.createdAt).toLocaleDateString('fa-IR')}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="flex justify-end gap-3 mt-6">
            <Button variant="outline" onClick={() => setIsViewDialogOpen(false)}>
              {t('admin:teacherManagement.actions.close')}
            </Button>
            <Button onClick={() => {
              setIsViewDialogOpen(false);
              setIsEditDialogOpen(true);
            }}>
              <Edit3 className="h-4 w-4 mr-2" />
              {t('admin:teacherManagement.actions.editTeacher')}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit Teacher Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t('admin:teacherManagement.dialogs.editTitle')}</DialogTitle>
            <DialogDescription>
              {t('admin:teacherManagement.dialogs.editDescription', { 
                name: `${selectedTeacher?.firstName} ${selectedTeacher?.lastName}` 
              })}
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
                      <FormLabel>{t('admin:teacherManagement.form.firstName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('admin:teacherManagement.form.firstNamePlaceholder')} {...field} />
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
                      <FormLabel>{t('admin:teacherManagement.form.lastName')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('admin:teacherManagement.form.lastNamePlaceholder')} {...field} />
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
                      <FormLabel>{t('admin:teacherManagement.form.email')}</FormLabel>
                      <FormControl>
                        <Input type="email" placeholder={t('admin:teacherManagement.emailPlaceholder')} {...field} />
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
                      <FormLabel>{t('admin:teacherManagement.form.phone')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('admin:teacherManagement.phonePlaceholder')} {...field} />
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
                      <FormLabel>{t('admin:teacherManagement.form.specialization')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin:teacherManagement.form.specializationPlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Persian Language">{t('admin:teacherManagement.persianLanguage')}</SelectItem>
                          <SelectItem value="English Language">{t('admin:teacherManagement.englishLanguage')}</SelectItem>
                          <SelectItem value="Arabic Language">{t('admin:teacherManagement.arabicLanguage')}</SelectItem>
                          <SelectItem value="French Language">{t('admin:teacherManagement.frenchLanguage')}</SelectItem>
                          <SelectItem value="Mathematics">{t('admin:teacherManagement.mathematics')}</SelectItem>
                          <SelectItem value="Literature">{t('admin:teacherManagement.literature')}</SelectItem>
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
                      <FormLabel>{t('admin:teacherManagement.form.experience')}</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder={t('admin:teacherManagement.form.experiencePlaceholder')} />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="1-2 years">{t('admin:teacherManagement.experience1-2')}</SelectItem>
                          <SelectItem value="3-5 years">{t('admin:teacherManagement.experience3-5')}</SelectItem>
                          <SelectItem value="5-10 years">{t('admin:teacherManagement.experience5-10')}</SelectItem>
                          <SelectItem value="10+ years">{t('admin:teacherManagement.experience10plus')}</SelectItem>
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
                      <FormLabel>{t('admin:teacherManagement.form.languagesTaught')}</FormLabel>
                      <FormControl>
                        <Input placeholder={t('admin:teacherManagement.languagesTaughtPlaceholder')} {...field} />
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
                      <FormLabel>{t('admin:teacherManagement.form.hourlyRate')}</FormLabel>
                      <FormControl>
                        <Input 
                          type="number" 
                          placeholder={t('admin:teacherManagement.hourlyRatePlaceholder')}
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
                    <FormLabel>{t('admin:teacherManagement.form.qualifications')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('admin:teacherManagement.qualificationsPlaceholder')}
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
                    <FormLabel>{t('admin:teacherManagement.form.bio')}</FormLabel>
                    <FormControl>
                      <Textarea 
                        placeholder={t('admin:teacherManagement.bioPlaceholder')}
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
                    <FormLabel>{t('admin:teacherManagement.form.status')}</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="active">{t('admin:teacherManagement.status.active')}</SelectItem>
                        <SelectItem value="inactive">{t('admin:teacherManagement.status.inactive')}</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 mt-6">
                <Button type="button" variant="outline" onClick={() => setIsEditDialogOpen(false)}>
                  {t('admin:teacherManagement.form.cancel')}
                </Button>
                <Button type="submit" disabled={updateTeacherMutation.isPending}>
                  {updateTeacherMutation.isPending ? t('admin:teacherManagement.form.saving', { defaultValue: 'در حال ذخیره...' }) : t('admin:teacherManagement.form.saveChanges')}
                </Button>
              </div>
            </form>
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}