import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface CourseItem {
  id: number;
  title: string;
  price?: number;
  level?: string;
  language?: string;
}

export interface SubLevelItem {
  id: number;
  code: string;
  name: string;
}

export interface StudentPayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  nationalId?: string;
  birthday?: string | null;
  level?: string;
  guardianName?: string;
  guardianPhone?: string;
  notes?: string;
  selectedCourses?: number[];
  totalFee?: number;
}

export function useStudents(searchTerm: string, filterStatus: string) {
  const { data: students } = useQuery({ queryKey: ["/api/students/list", { search: searchTerm, status: filterStatus }] });
  const { data: courses } = useQuery<CourseItem[]>({ queryKey: ["/api/courses"] });
  const { data: subLevelsData = [] } = useQuery<SubLevelItem[]>({ queryKey: ["/api/curriculum-sublevels"], staleTime: 10 * 60 * 1000 });
  return {
    students,
    courses,
    coursesList: Array.isArray(courses) ? courses : [] as CourseItem[],
    subLevels: Array.isArray(subLevelsData) ? subLevelsData : [] as SubLevelItem[],
  };
}

export function useStudentMutations(
  newStudentProfileImage: File | null,
  onCreateSuccess: () => void,
  onEditSuccess: () => void,
) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createStudentMutation = useMutation({
    mutationFn: async (studentData: StudentPayload) => {
      const response = await apiRequest("/api/admin/students", { method: "POST", body: JSON.stringify(studentData) });
      if (newStudentProfileImage && (response as { id?: number }).id) {
        const formData = new FormData();
        formData.append("photo", newStudentProfileImage);
        const token = localStorage.getItem("auth_token");
        await fetch(`/api/students/${(response as { id: number }).id}/photo`, {
          method: "POST", headers: { Authorization: `Bearer ${token}` }, body: formData,
        });
      }
      return response;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/list"] });
      queryClient.refetchQueries({ queryKey: ["/api/students/list"] });
      onCreateSuccess();
      toast({ title: t("common:toast.success"), description: t("common:toast.studentCreated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common:toast.error"), description: error?.message || "Failed to create student", variant: "destructive" });
    },
  });

  const editStudentMutation = useMutation({
    mutationFn: ({ id, studentData }: { id: number; studentData: StudentPayload }) =>
      apiRequest(`/api/admin/students/${id}`, { method: "PUT", body: JSON.stringify(studentData) }),
    onSuccess: () => {
      queryClient.removeQueries({ queryKey: ["/api/students/list"] });
      queryClient.invalidateQueries({ queryKey: ["/api/students/list"] });
      onEditSuccess();
      toast({ title: t("common:toast.success"), description: t("common:toast.studentUpdated") });
    },
    onError: (error: Error) => {
      toast({ title: t("common:toast.error"), description: error?.message || "Failed to update student", variant: "destructive" });
    },
  });

  const overrideSubLevelMutation = useMutation({
    mutationFn: async ({ studentId, subLevelCode }: { studentId: number; subLevelCode: string | null }) =>
      apiRequest(`/api/admin/students/${studentId}/sublevel`, { method: "PATCH", body: JSON.stringify({ subLevelCode }) }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students/list"] });
      const msg = variables.subLevelCode ? `Sub-level set to ${variables.subLevelCode}.` : "Sub-level cleared.";
      toast({ title: t("common:toast.success"), description: msg });
    },
    onError: () => toast({ title: t("common:toast.error"), description: "Failed to update sub-level.", variant: "destructive" }),
  });

  return { createStudentMutation, editStudentMutation, overrideSubLevelMutation };
}
