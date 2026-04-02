import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { API_ENDPOINTS } from "@/services/endpoints";
import type { Editor } from "@tiptap/react";

interface ClassRecord {
  studentId?: number;
  studentName?: string;
  courseId?: number;
  course?: string;
}

interface StudentOption {
  id: number;
  name: string;
}

interface CourseOption {
  id: number;
  title: string;
}

export interface AssignmentRecord {
  id: number;
  title: string;
  description: string;
  assignmentType: string;
  status: string;
  studentName?: string;
  courseName?: string;
  dueDate: string;
  submittedAt?: string | null;
  maxScore?: number;
  score?: number;
  feedback?: string;
  submission?: string;
  audioFeedbackUrl?: string;
  audioSubmissionUrl?: string;
}

export interface AssignmentPayload {
  title: string;
  description: string;
  assignmentType: string;
  studentId: number;
  courseId: number;
  dueDate: Date | string;
  maxScore: number;
  instructions?: string;
}

export interface AssignmentFormValues {
  title: string;
  description: string;
  assignmentType: "writing" | "speaking" | "reading" | "listening" | "general";
  studentId: number;
  courseId: number;
  dueDate: Date;
  maxScore: number;
  instructions?: string;
}

export function useAssignmentsData() {
  const { data: assignments = [], isLoading } = useQuery<AssignmentRecord[]>({ queryKey: [API_ENDPOINTS.teacher.assignments] });
  const { data: classes = [] } = useQuery<ClassRecord[]>({ queryKey: [API_ENDPOINTS.teacher.classes] });

  const students = (classes as ClassRecord[]).reduce((acc: StudentOption[], c: ClassRecord) => {
    if (c.studentId && !acc.find((s) => s.id === c.studentId)) acc.push({ id: c.studentId, name: c.studentName ?? "" });
    return acc;
  }, []);

  const courses = (classes as ClassRecord[]).reduce((acc: CourseOption[], c: ClassRecord) => {
    if (c.courseId && !acc.find((x) => x.id === c.courseId)) acc.push({ id: c.courseId, title: c.course ?? "" });
    return acc;
  }, []);

  return { assignments, isLoading, students, courses };
}

export function useAssignmentMutations(
  assignmentType: string,
  audioFiles: File[],
  feedbackAudioFiles: File[],
  editor: Editor | null | undefined,
  onCreateSuccess: () => void,
  onFeedbackSuccess: () => void,
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createAssignmentMutation = useMutation({
    mutationFn: async (data: AssignmentPayload) => {
      if (assignmentType === "speaking" && audioFiles.length > 0) {
        const fd = new FormData();
        Object.entries(data).forEach(([k, v]) => fd.append(k, v instanceof Date ? v.toISOString() : String(v)));
        audioFiles.forEach((f) => fd.append("audioFiles", f));
        return apiRequest(API_ENDPOINTS.teacher.assignments, { method: "POST", body: fd });
      }
      return apiRequest(API_ENDPOINTS.teacher.assignments, { method: "POST", body: JSON.stringify(data) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.teacher.assignments] });
      toast({ title: "Success", description: "Assignment created successfully" });
      onCreateSuccess();
      editor?.commands.setContent("");
    },
    onError: () => toast({ title: "Error", description: "Failed to create assignment", variant: "destructive" }),
  });

  const submitFeedbackMutation = useMutation({
    mutationFn: async ({ assignmentId, feedback, score }: { assignmentId: number; feedback: string; score: number }) => {
      if (feedbackAudioFiles.length > 0) {
        const fd = new FormData();
        fd.append("feedback", feedback);
        fd.append("score", score.toString());
        feedbackAudioFiles.forEach((f) => fd.append("audioFeedback", f));
        return apiRequest(`${API_ENDPOINTS.teacher.assignments}/${assignmentId}/feedback`, { method: "POST", body: fd });
      }
      return apiRequest(`${API_ENDPOINTS.teacher.assignments}/${assignmentId}/feedback`, { method: "POST", body: JSON.stringify({ feedback, score }) });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [API_ENDPOINTS.teacher.assignments] });
      toast({ title: "Success", description: "Feedback submitted successfully" });
      onFeedbackSuccess();
    },
    onError: () => toast({ title: "Error", description: "Failed to submit feedback", variant: "destructive" }),
  });

  return { createAssignmentMutation, submitFeedbackMutation };
}
