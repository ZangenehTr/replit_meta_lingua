import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface TeacherRecord {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role?: string;
  status?: string;
  hourlyRate?: number;
  bio?: string;
  profileImage?: string;
  isCallernAuthorized?: boolean;
  isActive?: boolean;
  phoneNumber?: string;
  specialization?: string;
  experience?: string;
  qualifications?: string;
  languages?: string;
  createdAt?: string;
}

export interface TeacherCreatePayload {
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  hourlyRate: number;
  bio?: string;
  status?: "active" | "inactive";
}

export interface TeacherUpdatePayload {
  id: number;
  formData: Omit<TeacherCreatePayload, "email">;
}

export function useTeachersData() {
  const { data: teachers = [], isLoading: teachersLoading, error, refetch } = useQuery<TeacherRecord[]>({
    queryKey: ["/api/teachers/list"],
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
  const { data: callernTeachers = [] } = useQuery<TeacherRecord[]>({
    queryKey: ["/api/admin/callern-teachers"],
    retry: 3,
    staleTime: 5 * 60 * 1000,
  });
  return { teachers, callernTeachers, teachersLoading, error, refetch };
}

export function useTeacherMutations(
  onCreateSuccess?: () => void,
  onUpdateSuccess?: () => void,
) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createTeacherMutation = useMutation({
    mutationFn: async (data: TeacherCreatePayload) =>
      apiRequest("/api/teachers/create", { method: "POST", body: JSON.stringify({ ...data, role: "instructor", password: "teacher123" }) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers/list"] });
      onCreateSuccess?.();
      toast({ title: t("common:success"), description: t("admin:teachers.createdSuccessfully") });
    },
    onError: (error: Error) => toast({ title: t("common:error"), description: error.message || t("admin:teachers.failedToCreate"), variant: "destructive" }),
  });

  const updateTeacherMutation = useMutation({
    mutationFn: async (data: TeacherUpdatePayload) =>
      apiRequest(`/api/teachers/${data.id}`, { method: "PUT", body: JSON.stringify(data.formData) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/teachers/list"] });
      onUpdateSuccess?.();
      toast({ title: t("common:toast.success"), description: t("common:toast.teacherUpdated") });
    },
    onError: (error: Error) => toast({ title: t("common:toast.error"), description: error.message || t("common:toast.teacherCreateFailed"), variant: "destructive" }),
  });

  return { createTeacherMutation, updateTeacherMutation };
}
