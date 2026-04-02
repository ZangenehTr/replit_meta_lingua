import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export interface SmsTemplatePayload {
  name: string;
  content: string;
  categoryId: number;
  tags: string[];
  status: "active" | "inactive" | "draft";
  variables?: string[];
}

export interface TemplateFormValues {
  name: string;
  content: string;
  categoryId: number;
  tags: string[];
  status: "active" | "inactive" | "draft";
}

export interface UpdateTemplatePayload {
  id: number;
  data: SmsTemplatePayload;
}

export interface SmsTemplateRecord {
  id: number;
  name: string;
  content: string;
  categoryId?: number;
  tags?: string[];
  status?: string;
  variables?: string[];
  [key: string]: unknown;
}

export interface SmsCategory {
  id: number;
  name: string;
  [key: string]: unknown;
}

export interface SmsAnalytics {
  totalSent?: number;
  totalTemplates?: number;
  [key: string]: unknown;
}

export function useSmsTemplatesData(searchQuery: string, selectedCategory: string, selectedStatus: string) {
  const { data: templates = [], isLoading: templatesLoading, refetch: refetchTemplates } = useQuery<SmsTemplateRecord[]>({
    queryKey: ["/api/sms-templates", { search: searchQuery, categoryId: selectedCategory !== "all" ? selectedCategory : undefined, status: selectedStatus !== "all" ? selectedStatus : undefined }],
    queryFn: () => {
      const p = new URLSearchParams();
      if (searchQuery) p.append("search", searchQuery);
      if (selectedCategory !== "all") p.append("categoryId", selectedCategory);
      if (selectedStatus !== "all") p.append("status", selectedStatus);
      return apiRequest(`/api/sms-templates?${p.toString()}`) as Promise<SmsTemplateRecord[]>;
    },
  });
  const { data: categories = [] } = useQuery<SmsCategory[]>({ queryKey: ["/api/sms-templates/categories"], queryFn: () => apiRequest("/api/sms-templates/categories") as Promise<SmsCategory[]> });
  const { data: analytics } = useQuery<SmsAnalytics>({ queryKey: ["/api/sms-templates/analytics"], queryFn: () => apiRequest("/api/sms-templates/analytics") as Promise<SmsAnalytics> });
  return { templates, categories, analytics, templatesLoading, refetchTemplates };
}

export function useSmsTemplateMutations(
  isRTL: boolean,
  onCreateSuccess?: () => void,
  onEditSuccess?: () => void,
  onSendSuccess?: () => void,
) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createMutation = useMutation({
    mutationFn: (data: SmsTemplatePayload) => apiRequest("/api/sms-templates", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] }); onCreateSuccess?.(); toast({ title: isRTL ? "قالب ایجاد شد" : "Template Created" }); },
    onError: (e: Error) => toast({ title: isRTL ? "خطا" : "Error", description: e.message, variant: "destructive" }),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: UpdateTemplatePayload) => apiRequest(`/api/sms-templates/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] }); onEditSuccess?.(); toast({ title: isRTL ? "قالب به‌روزرسانی شد" : "Template Updated" }); },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/sms-templates/${id}`, { method: "DELETE" }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] }); toast({ title: isRTL ? "قالب حذف شد" : "Template Deleted" }); },
  });

  const sendSmsMutation = useMutation({
    mutationFn: ({ templateId, data }: { templateId: number; data: Record<string, unknown> }) => apiRequest(`/api/sms-templates/${templateId}/send`, { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (result: { sentCount?: number }) => { queryClient.invalidateQueries({ queryKey: ["/api/sms-templates"] }); onSendSuccess?.(); toast({ title: isRTL ? "پیامک ارسال شد" : `SMS sent to ${result.sentCount ?? 0} recipients` }); },
  });

  return { createMutation, updateMutation, deleteMutation, sendSmsMutation };
}
