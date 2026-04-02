import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

export interface TicketPayload {
  subject: string;
  message: string;
  priority?: string;
  category?: string;
}

export interface SendMessagePayload {
  conversationId: number;
  message: string;
  withNotification?: boolean;
  notificationText?: string;
}

export interface NotificationPayload {
  title: string;
  message: string;
  type: string;
  targetAudience: string;
  channels: string[];
  status: string;
}

export interface ConversationData {
  id: number;
  participantIds?: number[];
  type?: string;
}

export interface TicketRecord {
  id: number;
  subject: string;
  message?: string;
  status: string;
  priority?: string;
  category?: string;
  createdAt?: string;
  unreadCount?: number;
  [key: string]: unknown;
}

export interface ConversationRecord {
  id: number;
  type?: string;
  unreadCount?: number;
  participantIds?: number[];
  [key: string]: unknown;
}

export interface NotificationRecord {
  id: number;
  title: string;
  message?: string;
  sentAt?: string;
  type?: string;
  [key: string]: unknown;
}

export interface MessageRecord {
  id: number;
  senderId?: number;
  message?: string;
  createdAt?: string;
  isOwnMessage?: boolean;
  [key: string]: unknown;
}

export function useCommunicationsData(selectedConversationId?: number, userSearchQuery?: string) {
  const { data: tickets, isLoading: ticketsLoading } = useQuery<TicketRecord[]>({ queryKey: ["/api/support-tickets"] });
  const { data: conversations, isLoading: conversationsLoading } = useQuery<ConversationRecord[]>({ queryKey: ["/api/chat/conversations"] });
  const { data: notifications, isLoading: notificationsLoading } = useQuery<NotificationRecord[]>({ queryKey: ["/api/push-notifications"] });
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: ["/api/chat/conversations", selectedConversationId, "messages"],
    enabled: !!selectedConversationId,
    refetchInterval: 3000,
    staleTime: 5000,
    refetchOnMount: "always" as const,
  });
  const { data: searchedUsers } = useQuery({
    queryKey: ["/api/users/search", { query: userSearchQuery }],
    enabled: (userSearchQuery?.length ?? 0) > 0,
  });

  return {
    tickets,
    conversations,
    notifications,
    messages,
    searchedUsers,
    ticketsLoading,
    conversationsLoading,
    notificationsLoading,
    messagesLoading,
    refetchMessages,
  };
}

export function useCommunicationsMutations(
  selectedConversationId: number | undefined,
  refetchMessages: () => void,
  onTicketCreated?: () => void,
  onNotificationSent?: () => void,
  onConversationCreated?: (conv: ConversationData) => void,
  onMessageSent?: () => void,
  onTicketReplySent?: () => void,
) {
  const { t } = useTranslation(["admin", "common"]);
  const { toast } = useToast();
  const qc = useQueryClient();

  const createTicketMutation = useMutation({
    mutationFn: (data: TicketPayload) => apiRequest("/api/support-tickets", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/support-tickets"] });
      toast({ title: t("common:toast.supportTicketCreated") });
      onTicketCreated?.();
    },
    onError: (error: Error) => toast({ title: t("common:toast.failedToCreateTicket"), description: error.message, variant: "destructive" }),
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message, withNotification, notificationText }: SendMessagePayload) => {
      const response = await apiRequest(`/api/chat/conversations/${conversationId}/messages`, { method: "POST", body: JSON.stringify({ message }) });
      if (withNotification && notificationText) {
        await apiRequest("/api/push-notifications", { method: "POST", body: JSON.stringify({ title: t("common:toast.newMessage"), message: notificationText, type: "info", targetAudience: "student", channels: ["push", "sms"], status: "sent" }) });
      }
      return response;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      qc.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversationId, "messages"] });
      setTimeout(() => refetchMessages(), 100);
      setTimeout(() => refetchMessages(), 500);
      onMessageSent?.();
      toast({ title: "Message sent successfully" });
    },
    onError: (error: Error) => toast({ title: "Failed to send message", description: error.message, variant: "destructive" }),
  });

  const sendNotificationMutation = useMutation({
    mutationFn: (data: NotificationPayload) => apiRequest("/api/push-notifications", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["/api/push-notifications"] });
      toast({ title: "Notification sent successfully" });
      onNotificationSent?.();
    },
    onError: (error: Error) => toast({ title: "Failed to send notification", description: error.message, variant: "destructive" }),
  });

  const sendTicketReplyMutation = useMutation({
    mutationFn: ({ ticketId, message }: { ticketId: number; message: string }) =>
      apiRequest(`/api/support-tickets/${ticketId}/messages`, { method: "POST", body: JSON.stringify({ message }) }),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ["/api/support-tickets"] }); toast({ title: "Reply sent successfully" }); onTicketReplySent?.(); },
    onError: (error: Error) => toast({ title: "Failed to send reply", description: error.message, variant: "destructive" }),
  });

  const createConversationMutation = useMutation({
    mutationFn: (userId: number) => apiRequest("/api/chat/conversations", { method: "POST", body: JSON.stringify({ participantIds: [userId], type: "direct" }) }),
    onSuccess: (conv: ConversationData) => {
      qc.invalidateQueries({ queryKey: ["/api/chat/conversations"] });
      onConversationCreated?.(conv);
      toast({ title: "Conversation started" });
    },
    onError: (error: Error) => toast({ title: "Failed to start conversation", description: error.message, variant: "destructive" }),
  });

  return { createTicketMutation, sendMessageMutation, sendNotificationMutation, sendTicketReplyMutation, createConversationMutation };
}
