import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTeachersData, useTeacherMutations, type TeacherRecord } from "@/hooks/useTeachers";
import { useTranslation } from "react-i18next";
import { useLanguage } from "@/hooks/useLanguage";
import {
  Card, CardContent, CardHeader, CardTitle,
} from "@/components/ui/card";
import {
  Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog";
import { Form } from "@/components/ui/form";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Filter, Users, GraduationCap, Star, Clock } from "lucide-react";

import { TeacherCard } from "@/components/admin/TeacherCard";
import { TeacherViewDialog } from "@/components/admin/TeacherViewDialog";
import { TeacherForm } from "@/components/admin/TeacherForm";

type TeacherFormData = {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  specialization: string;
  qualifications: string;
  experience: string;
  languages: string;
  hourlyRate: number;
  bio?: string;
  status: "active" | "inactive";
};

export function AdminTeacherManagement() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const teacherSchema = z.object({
    firstName: z.string().min(1, t("firstNameRequired")),
    lastName: z.string().min(1, t("lastNameRequired")),
    email: z.string().email(t("emailInvalid")),
    phone: z.string().optional(),
    specialization: z.string().min(1, t("specializationRequired")),
    qualifications: z.string().min(1, t("qualificationsRequired")),
    experience: z.string().min(1, t("experienceRequired")),
    languages: z.string().min(1, t("languagesRequired")),
    hourlyRate: z.number().min(1, t("hourlyRateMinimum")),
    bio: z.string().optional(),
    status: z.enum(["active", "inactive"]).default("active"),
  });

  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [viewMode, setViewMode] = useState<"cards" | "list">("cards");
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherRecord | null>(null);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);

  const queryClient = useQueryClient();
  const { teachers, callernTeachers, teachersLoading, error, refetch } = useTeachersData();
  const { createTeacherMutation, updateTeacherMutation } = useTeacherMutations(
    () => { setIsCreateDialogOpen(false); form.reset(); },
    () => { setIsEditDialogOpen(false); editForm.reset(); },
  );

  const form = useForm<TeacherFormData>({
    resolver: zodResolver(teacherSchema),
    defaultValues: { firstName: "", lastName: "", email: "", phone: "", specialization: "", qualifications: "", experience: "", languages: "", hourlyRate: 500000, bio: "", status: "active" },
  });

  const editForm = useForm<TeacherFormData>({ resolver: zodResolver(teacherSchema) });

  const handleCallernToggle = async (teacher: TeacherRecord) => {
    try {
      const isAuthorized = callernTeachers.find((ct: TeacherRecord) => ct.id === teacher.id)?.isCallernAuthorized;
      if (isAuthorized) {
        await apiRequest(`/api/admin/callern-teachers/${teacher.id}/authorize`, { method: "DELETE" });
        toast({ title: t("admin:teacherManagement.callernAccessRevoked"), description: `${teacher.firstName} ${teacher.lastName}` });
      } else {
        await apiRequest(`/api/admin/callern-teachers/${teacher.id}/authorize`, { method: "POST", body: JSON.stringify({ hourlyRate: teacher.hourlyRate || 150000 }) });
        toast({ title: t("admin:teacherManagement.callernAccessGranted"), description: `${teacher.firstName} ${teacher.lastName}` });
      }
      refetch();
      queryClient.invalidateQueries({ queryKey: ["/api/admin/callern-teachers"] });
    } catch {
      toast({ title: t("common:error"), description: t("admin:teacherManagement.callernUpdateFailed"), variant: "destructive" });
    }
  };

  const handlePhotoUpload = (teacher: TeacherRecord) => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        const formData = new FormData();
        formData.append("photo", file);
        try {
          await apiRequest(`/api/admin/teachers/${teacher.id}/upload-photo`, { method: "POST", body: formData });
          toast({ title: "Photo Uploaded", description: `Photo uploaded for ${teacher.firstName} ${teacher.lastName}` });
          refetch();
        } catch {
          toast({ title: "Upload Failed", description: "Failed to upload teacher photo", variant: "destructive" });
        }
      }
    };
    input.click();
  };

  const handleEditTeacher = (teacher: TeacherRecord) => {
    setSelectedTeacher(teacher);
    editForm.reset({
      firstName: teacher.firstName || "", lastName: teacher.lastName || "", email: teacher.email || "",
      phone: teacher.phoneNumber || "", specialization: teacher.specialization || "",
      qualifications: teacher.qualifications || "", experience: teacher.experience || "",
      languages: teacher.languages || "", hourlyRate: teacher.hourlyRate || 500000,
      bio: teacher.bio || "", status: teacher.isActive !== false ? "active" : "inactive",
    });
    setIsEditDialogOpen(true);
  };

  const isCallernAuthorized = (teacherId: number) =>
    !!(callernTeachers as TeacherRecord[]).find((ct: TeacherRecord) => ct.id === teacherId)?.isCallernAuthorized;

  const filteredTeachers = (Array.isArray(teachers) ? teachers : []).filter((teacher: TeacherRecord) => {
    const matchesSearch = teacher.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      teacher.email?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "active" && teacher.isActive) ||
      (filterStatus === "inactive" && !teacher.isActive);
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50 p-4 sm:p-6 space-y-6" dir={isRTL ? "rtl" : "ltr"}>
      {/* Header */}
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-emerald-600 to-green-600 bg-clip-text text-transparent">{t("admin:teacherManagement.title")}</h1>
          <p className="text-muted-foreground mt-2">{t("admin:teacherManagement.description", { defaultValue: "مدیریت کادر آموزشی" })}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex border rounded-lg overflow-hidden border-emerald-200">
            <Button variant={viewMode === "cards" ? "default" : "outline"} size="sm" onClick={() => setViewMode("cards")} className="rounded-none border-0 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              <GraduationCap className="h-4 w-4 me-2" />
              <span className="hidden sm:inline">{t("admin:teacherManagement.viewCards", { defaultValue: "کارت‌ها" })}</span>
            </Button>
            <Button variant={viewMode === "list" ? "default" : "outline"} size="sm" onClick={() => setViewMode("list")} className="rounded-none border-0 bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
              <Users className="h-4 w-4 me-2" />
              <span className="hidden sm:inline">{t("admin:teacherManagement.viewList", { defaultValue: "فهرست" })}</span>
            </Button>
          </div>
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700">
                <Plus className="h-4 w-4 me-2" />
                <span className="hidden sm:inline">{t("admin:teacherManagement.addTeacher")}</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>{t("admin:teacherManagement.addTeacher")}</DialogTitle>
                <DialogDescription>{t("admin:teacherManagement.createNewInstructor", { defaultValue: "ایجاد پروفایل جدید برای مدرس" })}</DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <TeacherForm
                  form={form}
                  onSubmit={(data) => createTeacherMutation.mutate(data)}
                  onCancel={() => setIsCreateDialogOpen(false)}
                  isPending={createTeacherMutation.isPending}
                  submitLabel={t("admin:teacherManagement.form.saveTeacher")}
                />
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {[
          { label: t("admin:teacherManagement.statsTotal", { defaultValue: "کل مدرسان" }), value: (Array.isArray(teachers) ? teachers.length : 0).toString(), icon: GraduationCap, note: "+2 " + t("admin:teacherManagement.fromLastMonth") },
          { label: t("admin:teacherManagement.statsActive", { defaultValue: "مدرسان فعال" }), value: (Array.isArray(teachers) ? teachers.filter((tc: TeacherRecord) => tc.isActive !== false).length : 0).toString(), icon: Users, note: t("admin:teacherManagement.activeRate", { defaultValue: "94% نرخ فعالیت" }) },
          { label: t("admin:teacherManagement.avgRating"), value: "4.8", icon: Star, note: "+0.2 " + t("admin:teacherManagement.fromLastMonth") },
          { label: t("admin:teacherManagement.totalHours"), value: "2,847", icon: Clock, note: t("admin:teacherManagement.teachingHoursThisMonth") },
        ].map(({ label, value, icon: Icon, note }) => (
          <Card key={label}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{label}</CardTitle>
              <Icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{value}</div>
              <p className="text-xs text-muted-foreground">{note}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Filters */}
      <div className="flex gap-4">
        <div className="flex-1 relative">
          <Search className="absolute start-2 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input placeholder={t("admin:teacherManagement.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-8" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-[180px]">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin:teacherManagement.filterAll", { defaultValue: "همه مدرسان" })}</SelectItem>
            <SelectItem value="active">{t("admin:teacherManagement.filterActive", { defaultValue: "فقط فعال" })}</SelectItem>
            <SelectItem value="inactive">{t("admin:teacherManagement.filterInactive", { defaultValue: "فقط غیرفعال" })}</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Error */}
      {error && (
        <Card className="border-destructive">
          <CardContent className="pt-6 flex items-center justify-between">
            <p className="text-destructive font-medium">{t("admin:teacherManagement.failedToLoad")}</p>
            <Button variant="outline" onClick={() => refetch()} disabled={teachersLoading}>
              {teachersLoading ? t("admin:teacherManagement.retrying") : t("admin:teacherManagement.retry")}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Teachers Grid/List */}
      {!error && (
        viewMode === "cards" ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teachersLoading ? (
              <div className="col-span-full text-center py-8">Loading teachers...</div>
            ) : filteredTeachers.length === 0 ? (
              <div className="col-span-full text-center py-8 text-muted-foreground">No teachers found</div>
            ) : filteredTeachers.map((teacher: TeacherRecord) => (
              <TeacherCard
                key={teacher.id}
                teacher={teacher}
                callernTeachers={callernTeachers}
                onView={(t) => { setSelectedTeacher(t); setIsViewDialogOpen(true); }}
                onEdit={handleEditTeacher}
                onCallernToggle={handleCallernToggle}
                onPhotoUpload={handlePhotoUpload}
                isCallernAuthorized={isCallernAuthorized}
              />
            ))}
          </div>
        ) : (
          <Card>
            <CardContent className="p-0">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-muted/50">
                    <tr>
                      {["Name", "Email", "Specialization", "Experience", "Rate", "Status", "Actions"].map((h) => (
                        <th key={h} className="text-left p-4 font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {teachersLoading ? (
                      <tr><td colSpan={7} className="text-center py-8">Loading teachers...</td></tr>
                    ) : filteredTeachers.length === 0 ? (
                      <tr><td colSpan={7} className="text-center py-8 text-muted-foreground">No teachers found</td></tr>
                    ) : filteredTeachers.map((teacher: TeacherRecord) => (
                      <tr key={teacher.id} className="border-b hover:bg-muted/25">
                        <td className="p-4 font-medium">{teacher.firstName} {teacher.lastName}</td>
                        <td className="p-4 text-sm">{teacher.email}</td>
                        <td className="p-4 text-sm">{teacher.specialization || "—"}</td>
                        <td className="p-4 text-sm">{teacher.experience || "—"}</td>
                        <td className="p-4 text-sm">{new Intl.NumberFormat("fa-IR").format(teacher.hourlyRate || 500000)} تومان</td>
                        <td className="p-4">
                          <Badge variant={teacher.isActive !== false ? "default" : "secondary"}>
                            {teacher.isActive !== false ? t("admin:teacherManagement.status.active") : t("admin:teacherManagement.status.inactive")}
                          </Badge>
                        </td>
                        <td className="p-4">
                          <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => { setSelectedTeacher(teacher); setIsViewDialogOpen(true); }}>View</Button>
                            <Button variant="outline" size="sm" onClick={() => handleEditTeacher(teacher)}>Edit</Button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )
      )}

      {/* View Dialog */}
      <TeacherViewDialog
        open={isViewDialogOpen}
        onOpenChange={setIsViewDialogOpen}
        teacher={selectedTeacher}
        onEdit={() => { setIsViewDialogOpen(false); handleEditTeacher(selectedTeacher); }}
      />

      {/* Edit Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-[95vw] sm:max-w-xl md:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{t("admin:teacherManagement.dialogs.editTitle")}</DialogTitle>
            <DialogDescription>
              {t("admin:teacherManagement.dialogs.editDescription", { name: `${selectedTeacher?.firstName} ${selectedTeacher?.lastName}` })}
            </DialogDescription>
          </DialogHeader>
          <Form {...editForm}>
            <TeacherForm
              form={editForm}
              onSubmit={(data) => selectedTeacher && updateTeacherMutation.mutate({ id: selectedTeacher.id, formData: data })}
              onCancel={() => setIsEditDialogOpen(false)}
              isPending={updateTeacherMutation.isPending}
              submitLabel={t("admin:teacherManagement.actions.editTeacher")}
            />
          </Form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
