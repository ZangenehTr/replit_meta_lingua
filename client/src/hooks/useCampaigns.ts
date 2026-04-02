import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface CampaignUpdatePayload {
  id: number;
  updates: {
    name?: string;
    type?: string;
    targetAudience?: string;
    budget?: number;
    channels?: string[];
    startDate?: string;
    endDate?: string;
  };
}

export interface CampaignCreatePayload {
  name: string;
  type: string;
  targetAudience: string;
  budget: number;
  channels: string[];
  startDate: string;
  endDate: string;
  description: string;
}

export interface SendEmailPayload {
  recipients: string[];
  subject: string;
  content: string;
}

export interface TelegramPayload {
  channelId: string;
  message: string;
  autoReply: boolean;
}

export interface CampaignRecord {
  id: number;
  name: string;
  type: string;
  status?: string;
  targetAudience?: string;
  budget?: number;
  channels?: string[];
  startDate?: string;
  endDate?: string;
  description?: string;
  [key: string]: unknown;
}

export function useCampaigns() {
  const { data: campaigns = [], isLoading } = useQuery<CampaignRecord[]>({ queryKey: ["/api/admin/campaigns"] });
  return { campaigns, isLoading };
}

export function useCampaignMutations(onCreateSuccess?: () => void) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const updateCampaignMutation = useMutation({
    mutationFn: ({ id, updates }: CampaignUpdatePayload) =>
      apiRequest(`/api/admin/campaigns/${id}`, { method: "PATCH", body: JSON.stringify(updates) }),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] }); toast({ title: t("common:toast.campaignUpdated") }); },
    onError: () => toast({ title: t("common:toast.failedToUpdateCampaign"), variant: "destructive" }),
  });

  const createCampaignMutation = useMutation({
    mutationFn: (data: CampaignCreatePayload) => apiRequest("/api/admin/campaigns", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/admin/campaigns"] });
      onCreateSuccess?.();
      toast({ title: t("common:toast.newCampaignCreated") });
    },
    onError: () => toast({ title: t("common:toast.failedToCreateCampaign"), variant: "destructive" }),
  });

  const socialMediaMutation = useMutation({
    mutationFn: ({ platform, action }: { platform: string; action: string }) => apiRequest(`/api/admin/social-media/${platform}/${action}`, { method: "POST" }),
    onSuccess: (_, v) => toast({ title: `${v.action} ${v.platform} successfully` }),
    onError: (_, v) => toast({ title: `Failed to ${v.action} ${v.platform}`, variant: "destructive" }),
  });

  const crossplatformMutation = useMutation({
    mutationFn: (tool: string) => apiRequest(`/api/admin/crossplatform-tools/${tool}`, { method: "POST" }),
    onSuccess: (_, v) => toast({ title: `${v} tool configured successfully` }),
    onError: (_, v) => toast({ title: `Failed to configure ${v} tool`, variant: "destructive" }),
  });

  const marketingToolMutation = useMutation({
    mutationFn: ({ toolName, action, config }: { toolName: string; action: string; config?: Record<string, unknown> }) => apiRequest(`/api/admin/marketing-tools/${encodeURIComponent(toolName)}/${action}`, { method: "POST", body: config ? JSON.stringify(config) : undefined }),
    onSuccess: (_, v) => toast({ title: `${v.action} completed for ${v.toolName}` }),
    onError: (_, v) => toast({ title: `Failed to ${v.action} ${v.toolName}`, variant: "destructive" }),
  });

  return { updateCampaignMutation, createCampaignMutation, socialMediaMutation, crossplatformMutation, marketingToolMutation };
}

export function useCampaignHeaderMutations(
  onEmailSuccess: () => void,
  onTelegramSuccess: () => void,
  onAISuccess: (response: string) => void,
) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();

  const sendEmailMutation = useMutation({
    mutationFn: (data: SendEmailPayload) => apiRequest("/api/admin/send-email", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: t("common:toast.emailSentSuccessfully") }); onEmailSuccess(); },
    onError: () => toast({ title: "Failed to send email", variant: "destructive" }),
  });

  const telegramMutation = useMutation({
    mutationFn: (data: TelegramPayload) => apiRequest("/api/admin/telegram-automation", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => { toast({ title: "Telegram message sent" }); onTelegramSuccess(); },
    onError: () => toast({ title: "Failed to configure Telegram", variant: "destructive" }),
  });

  const aiAssistantMutation = useMutation({
    mutationFn: (query: string) => apiRequest("/api/admin/ai-assistant", { method: "POST", body: JSON.stringify({ query }) }),
    onSuccess: (data: { response?: string }) => { onAISuccess(data.response ?? ""); toast({ title: "AI assistant responded successfully" }); },
    onError: () => toast({ title: "Failed to get AI response", variant: "destructive" }),
  });

  return { sendEmailMutation, telegramMutation, aiAssistantMutation };
}
