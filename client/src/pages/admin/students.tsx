import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ActionButton } from "@/components/ui/action-button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useLanguage } from "@/hooks/useLanguage";
import { useTranslation } from "react-i18next";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { useStudents, useStudentMutations, type StudentPayload, type CourseItem } from "@/hooks/useStudents";
import {
  Users, Search, Filter, Plus, Download,
  ChevronLeft, Grid3X3, List,
} from "lucide-react";

import { StudentCard } from "@/components/admin/StudentCard";
import { StudentListRow, type StudentRow } from "@/components/admin/StudentListRow";
import { StudentCreateDialog } from "@/components/admin/StudentCreateDialog";
import { StudentEditDialog } from "@/components/admin/StudentEditDialog";

type EditableStudent = StudentRow & { selectedCourses?: number[]; subLevelCode?: string; birthday?: Date | string | null };

export function AdminStudents() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const [location, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [viewMode, setViewMode] = useState("cards");
  const [sortBy, setSortBy] = useState("newest");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<EditableStudent | null>(null);
  const [pendingEditId, setPendingEditId] = useState<number | null>(null);
  const [newStudentData, setNewStudentData] = useState({
    firstName: "", lastName: "", email: "", phone: "",
    nationalId: "", birthday: null as Date | null, level: "", status: "active",
    guardianName: "", guardianPhone: "", profileImage: null as File | null,
    notes: "", courses: [] as string[], selectedCourses: [] as number[], totalFee: 0,
  });

  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const url = new URL(window.location.href);
    if (urlParams.get("action") === "create") {
      setIsCreateDialogOpen(true);
      url.searchParams.delete("action");
      window.history.replaceState({}, "", url.toString());
    }
    const editId = urlParams.get("edit");
    if (editId) {
      setPendingEditId(Number(editId));
      url.searchParams.delete("edit");
      window.history.replaceState({}, "", url.toString());
    }
  }, []);
  const { students, coursesList, subLevels } = useStudents(searchTerm, filterStatus);

  const studentList = Array.isArray(students) ? students : [];

  useEffect(() => {
    if (pendingEditId && studentList.length > 0) {
      const student = studentList.find((s) => s.id === pendingEditId);
      if (student) {
        const selectedCourseIds = student.courses?.map((courseName: string) => {
          const course = coursesList.find((c: any) =>
            c.title === courseName || c.title.toLowerCase().includes(courseName.toLowerCase()));
          return course?.id ?? null;
        }).filter((id: number | null): id is number => id !== null) ?? [];
        setEditingStudent({
          ...student,
          birthday: student.birthday ? new Date(student.birthday) : null,
          nationalId: student.nationalId || "",
          guardianName: student.guardianName || "",
          guardianPhone: student.guardianPhone || "",
          notes: student.notes || "",
          selectedCourses: selectedCourseIds,
          status: student.status || "active",
        });
        setIsEditDialogOpen(true);
        setPendingEditId(null);
      }
    }
  }, [pendingEditId, studentList, coursesList]);

  const { createStudentMutation, editStudentMutation, overrideSubLevelMutation } = useStudentMutations(
    newStudentData.profileImage,
    () => { setIsCreateDialogOpen(false); setNewStudentData({ firstName: "", lastName: "", email: "", phone: "", nationalId: "", birthday: null, level: "", status: "active", guardianName: "", guardianPhone: "", profileImage: null, notes: "", courses: [], selectedCourses: [], totalFee: 0 }); },
    () => { setIsEditDialogOpen(false); setEditingStudent(null); },
  );

  const handleCourseSelection = (courseId: number, selected: boolean) => {
    setNewStudentData((prev) => {
      const updatedCourses = selected
        ? [...prev.selectedCourses, courseId]
        : prev.selectedCourses.filter((id) => id !== courseId);
      const totalFee = updatedCourses.reduce((sum, id) => {
        const course = coursesList.find((c: CourseItem) => c.id === id);
        return sum + (course?.price || 0);
      }, 0);
      return { ...prev, selectedCourses: updatedCourses, totalFee };
    });
  };

  const handleEditCourseSelection = (courseId: number, selected: boolean) => {
    setEditingStudent((prev: EditableStudent | null) => {
      if (!prev) return prev;
      const currentCourses = prev.selectedCourses || [];
      const updatedCourses = selected
        ? currentCourses.includes(courseId) ? currentCourses : [...currentCourses, courseId]
        : currentCourses.filter((id: number) => id !== courseId);
      return { ...prev, selectedCourses: updatedCourses };
    });
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setNewStudentData({ ...newStudentData, profileImage: file });
  };

  const handleCreateStudent = async () => {
    if (!newStudentData.firstName || !newStudentData.lastName || !newStudentData.email) {
      toast({ title: t("common:toast.validationError"), description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const studentData = {
      firstName: newStudentData.firstName, lastName: newStudentData.lastName, email: newStudentData.email,
      phone: newStudentData.phone, nationalId: newStudentData.nationalId,
      birthday: newStudentData.birthday ? newStudentData.birthday.toISOString() : null,
      level: newStudentData.level, guardianName: newStudentData.guardianName,
      guardianPhone: newStudentData.guardianPhone, notes: newStudentData.notes,
      selectedCourses: newStudentData.selectedCourses, totalFee: newStudentData.totalFee,
    };
    createStudentMutation.mutate(studentData);
  };

  const handleEditStudent = (student: StudentRow) => {
    const selectedCourseIds = student.courses?.map((courseName: string) => {
      const course = coursesList.find((c: CourseItem) =>
        c.title === courseName || c.title.toLowerCase().includes(courseName.toLowerCase()));
      return course?.id ?? null;
    }).filter((id): id is number => id !== null) ?? [];

    setEditingStudent({
      ...student,
      birthday: student.birthday ? new Date(student.birthday) : null,
      nationalId: student.nationalId || "",
      guardianName: student.guardianName || "",
      guardianPhone: student.guardianPhone || "",
      notes: student.notes || "",
      selectedCourses: selectedCourseIds,
      status: student.status || "active",
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateStudent = async () => {
    if (!editingStudent?.firstName || !editingStudent?.lastName || !editingStudent?.email) {
      toast({ title: t("common:toast.validationError"), description: "Please fill in all required fields", variant: "destructive" });
      return;
    }
    const studentData = {
      firstName: editingStudent.firstName, lastName: editingStudent.lastName, email: editingStudent.email,
      phone: editingStudent.phone, nationalId: editingStudent.nationalId,
      birthday: editingStudent.birthday ? editingStudent.birthday.toISOString() : null,
      level: editingStudent.level, guardianName: editingStudent.guardianName,
      guardianPhone: editingStudent.guardianPhone, notes: editingStudent.notes,
      status: editingStudent.status, selectedCourses: editingStudent.selectedCourses || [],
    };
    editStudentMutation.mutate({ id: editingStudent.id, studentData });
  };

  const handleVoIPCall = async (student: StudentRow) => {
    if (!student.phone) {
      toast({ title: t("common:toast.noPhoneNumber"), description: `${student.firstName} ${student.lastName} has no phone number.`, variant: "destructive" });
      return;
    }
    try {
      await fetch("/api/voip/initiate-call", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ phoneNumber: student.phone, contactName: `${student.firstName} ${student.lastName}`, callType: "outbound", recordCall: true, studentId: student.id }),
      });
      toast({ title: t("common:toast.voipCallInitiated"), description: `Connecting to ${student.firstName} ${student.lastName}...` });
    } catch {
      toast({ title: t("common:toast.callFailed"), description: "Unable to initiate VoIP call.", variant: "destructive" });
    }
  };

  const handleContact = async (student: StudentRow) => {
    try {
      const response = await fetch("/api/communication/create-conversation", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${localStorage.getItem("auth_token")}` },
        body: JSON.stringify({ studentId: student.id, studentName: `${student.firstName} ${student.lastName}`, subject: `Contact with ${student.firstName} ${student.lastName}` }),
      });
      if (response.ok) {
        const conversation = await response.json();
        setLocation(`/admin/communications?conversation=${conversation.conversation.id}`);
      }
    } catch {
      toast({ title: t("errors.contactFailed"), description: "Unable to start communication.", variant: "destructive" });
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active": return "bg-green-100 text-green-800";
      case "inactive": return "bg-red-100 text-red-800";
      case "pending": return "bg-yellow-100 text-yellow-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "Beginner": return "bg-blue-100 text-blue-800";
      case "Intermediate": return "bg-yellow-100 text-yellow-800";
      case "Advanced": return "bg-purple-100 text-purple-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const filteredAndSortedStudents = studentList.filter((student) => {
    const searchLower = searchTerm.toLowerCase();
    const matchesSearch = !searchTerm ||
      student.firstName?.toLowerCase().includes(searchLower) ||
      student.lastName?.toLowerCase().includes(searchLower) ||
      student.email?.toLowerCase().includes(searchLower) ||
      `${student.firstName} ${student.lastName}`.toLowerCase().includes(searchLower);
    const matchesStatus = filterStatus === "all" || student.status === filterStatus;
    return matchesSearch && matchesStatus;
  }).sort((a, b) => {
    switch (sortBy) {
      case "oldest": return new Date(a.enrollmentDate).getTime() - new Date(b.enrollmentDate).getTime();
      case "newest": return new Date(b.enrollmentDate).getTime() - new Date(a.enrollmentDate).getTime();
      case "course": return (a.courses || []).join(",").localeCompare((b.courses || []).join(","));
      case "level": return ({ Beginner: 1, Intermediate: 2, Advanced: 3 }[a.level] || 0) - ({ Beginner: 1, Intermediate: 2, Advanced: 3 }[b.level] || 0);
      default: return 0;
    }
  });

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 p-4 sm:p-6 space-y-6">
      {/* Header */}
      <div className="space-y-3 sm:space-y-4">
        <div className="flex items-center justify-between">
          <ActionButton variant="outline" size="sm" actionType="common.refreshData" onClick={() => window.history.back()} className="h-8 px-3 border-blue-200 hover:bg-blue-50 text-xs sm:text-sm" data-testid="btn-back-admin-students">
            <ChevronLeft className="h-3 w-3 sm:h-4 sm:w-4 sm:me-1" />
            <span className="hidden sm:inline">{t("admin:students.back")}</span>
          </ActionButton>
          <div className="text-right">
            <h1 className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">{t("admin:students.title")}</h1>
            <p className="text-xs sm:text-sm text-muted-foreground hidden sm:block mt-1">{t("admin:students.subtitle")}</p>
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={sortBy} onValueChange={setSortBy}>
            <SelectTrigger className="flex-1 min-w-[120px] h-8 text-xs sm:text-sm border-blue-200">
              <SelectValue placeholder="Sort..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="newest">{t("admin:students.newestFirst")}</SelectItem>
              <SelectItem value="oldest">{t("admin:students.oldestFirst")}</SelectItem>
              <SelectItem value="course">بر اساس دوره</SelectItem>
              <SelectItem value="level">بر اساس سطح</SelectItem>
            </SelectContent>
          </Select>
          <div className="flex border rounded-md overflow-hidden border-blue-200">
            <ActionButton variant="ghost" size="sm" actionType="common.refreshData" onClick={() => setViewMode("cards")}
              className={`h-8 px-2 sm:px-3 rounded-none border-0 text-xs ${viewMode === "cards" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`} data-testid="btn-view-cards">
              <Grid3X3 className="h-3 w-3" />
            </ActionButton>
            <ActionButton variant="ghost" size="sm" actionType="common.refreshData" onClick={() => setViewMode("list")}
              className={`h-8 px-2 sm:px-3 rounded-none border-0 text-xs ${viewMode === "list" ? "bg-gradient-to-r from-blue-600 to-indigo-600 text-white" : "bg-white text-gray-700 hover:bg-gray-100"}`} data-testid="btn-view-list">
              <List className="h-3 w-3" />
            </ActionButton>
          </div>
          <ActionButton variant="outline" className="h-8 px-2 sm:px-3 border-blue-200 hover:bg-blue-50 text-xs" actionType="common.exportData" payload={{ format: "csv", entity: "students" }} data-testid="btn-export-students">
            <Download className="h-3 w-3" />
            <span className="hidden lg:inline lg:ms-1">Export</span>
          </ActionButton>
          <ActionButton className="h-8 px-2 sm:px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-xs" actionType="admin.createUser" onClick={() => setIsCreateDialogOpen(true)} data-testid="btn-add-student">
            <Plus className="h-3 w-3" />
            <span className="hidden sm:inline sm:ms-1">{t("admin:students.add")}</span>
          </ActionButton>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-stretch sm:items-center">
        <div className="relative flex-1">
          <Search className="absolute start-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input placeholder={t("admin:students.searchPlaceholder")} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="ps-10 w-full" />
        </div>
        <Select value={filterStatus} onValueChange={setFilterStatus}>
          <SelectTrigger className="w-full sm:w-48">
            <Filter className="h-4 w-4 me-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t("admin:students.allStudents")}</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Student List */}
      {viewMode === "cards" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 2xl:grid-cols-3 gap-3 md:gap-4 lg:gap-6">
          {filteredAndSortedStudents.map((student) => (
            <StudentCard key={student.id} student={student} onVoIPCall={handleVoIPCall} onEdit={handleEditStudent} onContact={handleContact} getStatusColor={getStatusColor} getLevelColor={getLevelColor} />
          ))}
        </div>
      ) : (
        <div className="space-y-2 sm:space-y-4">
          <div className="hidden lg:grid lg:grid-cols-12 lg:gap-4 p-4 bg-white/80 rounded-lg border-0 shadow-sm font-medium text-sm text-gray-600">
            <div className="col-span-3">Student</div>
            <div className="col-span-2">Contact</div>
            <div className="col-span-1">Status</div>
            <div className="col-span-2">Courses</div>
            <div className="col-span-2">Progress</div>
            <div className="col-span-2">Actions</div>
          </div>
          {filteredAndSortedStudents.map((student) => (
            <StudentListRow key={student.id} student={student} onVoIPCall={handleVoIPCall} onEdit={handleEditStudent} onContact={handleContact} getStatusColor={getStatusColor} />
          ))}
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
        {[
          { title: "Total Students", value: filteredAndSortedStudents.length.toString(), note: "Filtered view" },
          { title: "Active", value: filteredAndSortedStudents.filter((s: StudentRow) => s.status === "active").length.toString(), note: "Currently active" },
          { title: "Avg Attendance", value: "92.1%", note: "Excellent performance" },
          { title: "Course Completion", value: "78.6%", note: "+5.2% from last month" },
        ].map(({ title, value, note }) => (
          <Card key={title}>
            <CardHeader className="pb-2"><CardTitle className="text-sm font-medium">{title}</CardTitle></CardHeader>
            <CardContent><div className="text-2xl font-bold">{value}</div><p className="text-xs text-muted-foreground">{note}</p></CardContent>
          </Card>
        ))}
      </div>

      {/* Dialogs */}
      <StudentCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        newStudentData={newStudentData}
        setNewStudentData={setNewStudentData}
        coursesList={coursesList}
        isRTL={isRTL}
        onCourseSelection={handleCourseSelection}
        onImageUpload={handleImageUpload}
        onCreateStudent={handleCreateStudent}
        isPending={createStudentMutation.isPending}
      />

      <StudentEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        editingStudent={editingStudent}
        setEditingStudent={setEditingStudent}
        coursesList={coursesList}
        subLevels={subLevels}
        isRTL={isRTL}
        onCourseSelection={handleEditCourseSelection}
        onUpdate={handleUpdateStudent}
        onOverrideSubLevel={(args) => overrideSubLevelMutation.mutate(args)}
        isUpdating={editStudentMutation.isPending}
        isOverridingSubLevel={overrideSubLevelMutation.isPending}
      />
    </div>
  );
}
