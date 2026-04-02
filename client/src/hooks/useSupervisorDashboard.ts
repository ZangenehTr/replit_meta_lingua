import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";
import type { UseFormReturn } from "react-hook-form";

export interface ObservationPayload {
  teacherId: number;
  supervisorId: number;
  sessionId: number;
  observationType: string;
  observationDate: string;
  overallScore: number;
  strengths: string;
  areasForImprovement: string;
  notes: string;
  followUpRequired: boolean;
}

export interface ObservationFormValues {
  sessionId: number;
  teacherId: number;
  observationType: "live_online" | "live_in_person";
  scheduledDate: string;
  scheduledTime: string;
  teachingMethodology: number;
  classroomManagement: number;
  studentEngagement: number;
  contentDelivery: number;
  languageSkills: number;
  timeManagement: number;
  strengths?: string;
  areasForImprovement?: string;
  notes?: string;
  followUpRequired: boolean;
}

export interface UpcomingSession {
  id: number;
  teacherId: number;
  scheduledAt: string;
  deliveryMode?: string;
  teacherName?: string;
  courseName?: string;
}

export interface TeacherListItem {
  id: number;
  firstName: string;
  lastName: string;
  role: string;
}

export interface TeacherPerformanceItem {
  teacherId: number;
  teacherName?: string;
  averageRating?: number;
  totalSessions?: number;
  lastObservation?: string;
}

export interface PendingObservation {
  id: number;
  teacherId: number;
  teacherName?: string;
  className?: string;
  scheduledDate: string;
  observationType?: string;
  priority?: string;
}

export interface TeacherAttentionItem {
  id: number;
  name: string;
  reason: string;
  lastObservation?: string;
  rating?: number;
}

export interface StudentAttentionItem {
  id: number;
  name: string;
  issue: string;
  course: string;
  consecutiveAbsences: number;
  missedHomeworks: number;
  teacher: string;
}

export interface DashboardStats {
  totalTeachers?: number;
  totalStudents?: number;
  totalSessions?: number;
  monthlyRevenue?: number;
  [key: string]: unknown;
}

export interface TargetPayload {
  supervisorId: number;
  createdDate: string;
  status: string;
  [key: string]: unknown;
}

export function useSupervisorDashboardData(targetDialogOpen: boolean) {
  const { data: stats, isLoading } = useQuery<DashboardStats>({ queryKey: ["/api/supervisor/dashboard-stats"] });
  const { data: teacherPerformance } = useQuery<TeacherPerformanceItem[]>({ queryKey: ["/api/supervision/teacher-performance"] });
  const { data: allTeachers } = useQuery<TeacherListItem[]>({
    queryKey: ["/api/teachers/list"],
    select: (d) => d?.filter((u) => u.role === "Teacher/Tutor") || [],
  });
  const { data: pendingObservations = [] } = useQuery<PendingObservation[]>({ queryKey: ["/api/supervision/pending-observations"], refetchInterval: 10000, refetchOnWindowFocus: true });
  const { data: dailyIncome } = useQuery<Record<string, unknown>>({ queryKey: ["/api/supervisor/daily-income"] });
  const { data: teachersNeedingAttention = [] } = useQuery<TeacherAttentionItem[]>({ queryKey: ["/api/supervisor/teachers-needing-attention"] });
  const { data: studentsNeedingAttention = [] } = useQuery<StudentAttentionItem[]>({ queryKey: ["/api/supervisor/students-needing-attention"] });
  const { data: upcomingSessions = [] } = useQuery<UpcomingSession[]>({ queryKey: ["/api/supervisor/upcoming-sessions-for-observation"] });
  const { data: businessIntelligence } = useQuery<Record<string, unknown>>({ queryKey: ["/api/supervisor/business-intelligence"] });
  const { data: targetFormDefinition, isLoading: targetFormLoading } = useQuery<Record<string, unknown>>({ queryKey: ["/api/forms", 6], enabled: targetDialogOpen });
  return {
    stats, teacherPerformance, allTeachers, pendingObservations, dailyIncome,
    teachersNeedingAttention, studentsNeedingAttention, upcomingSessions,
    businessIntelligence, targetFormDefinition, targetFormLoading, isLoading,
  };
}

export function useSupervisorMutations(
  observationForm: UseFormReturn,
  setObservationDialogOpen: (v: boolean) => void,
  setTargetDialogOpen: (v: boolean) => void,
) {
  const { t } = useTranslation(["supervisor", "common"]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const createObservationMutation = useMutation({
    mutationFn: (data: ObservationPayload) => apiRequest("/api/supervision/observations", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/supervision/observations"] });
      qc.invalidateQueries({ queryKey: ["/api/supervision/recent-observations"] });
      qc.invalidateQueries({ queryKey: ["/api/supervision/pending-observations"] });
      qc.invalidateQueries({ queryKey: ["/api/supervisor/dashboard-stats"] });
      qc.invalidateQueries({ queryKey: ["/api/supervisor/upcoming-sessions-for-observation"] });
      setObservationDialogOpen(false);
      observationForm.reset();
      toast({ title: t("common:toast.success"), description: t("common:toast.observationCreated") });
    },
    onError: (error: Error) => toast({ title: t("common:toast.error"), description: error?.message || "Failed", variant: "destructive" }),
  });

  const setTargetMutation = useMutation({
    mutationFn: (data: TargetPayload) => apiRequest("/api/supervisor/targets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/supervisor/targets"] }); setTargetDialogOpen(false); toast({ title: "Target Set", description: "Monthly target configured successfully" }); },
    onError: (error: Error) => toast({ title: t("common:toast.error"), description: error?.message, variant: "destructive" }),
  });

  const sendTeacherAlert = useMutation({
    mutationFn: ({ teacherId, issue }: { teacherId: number; issue: string }) => apiRequest("/api/supervisor/send-teacher-alert", { method: "POST", body: JSON.stringify({ teacherId, issue }) }),
    onSuccess: () => toast({ title: "Alert Sent", description: "SMS alert sent to teacher successfully" }),
    onError: (e: Error) => toast({ title: "Failed to Send Alert", description: e.message, variant: "destructive" }),
  });

  const sendStudentAlert = useMutation({
    mutationFn: ({ studentId, issue, teacherName }: { studentId: number; issue: string; teacherName: string }) => apiRequest("/api/supervisor/send-student-alert", { method: "POST", body: JSON.stringify({ studentId, issue, teacherName }) }),
    onSuccess: () => toast({ title: "Alert Sent", description: "SMS alert sent to student successfully" }),
    onError: (e: Error) => toast({ title: "Failed to Send Alert", description: e.message, variant: "destructive" }),
  });

  return { createObservationMutation, setTargetMutation, sendTeacherAlert, sendStudentAlert };
}
