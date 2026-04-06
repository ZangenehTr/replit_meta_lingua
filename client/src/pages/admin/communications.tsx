import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useQueryClient } from "@tanstack/react-query";
import { useLanguage } from "@/hooks/useLanguage";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { HeadphonesIcon, MessageSquare, Bell, Plus, Globe, Zap } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from "react-i18next";
import { useCommunicationsData, useCommunicationsMutations, type ConversationData, type TicketRecord, type ConversationRecord, type NotificationRecord, type MessageRecord } from "@/hooks/useCommunications";

import { TicketsTab } from "@/components/admin/TicketsTab";
import { ChatTab, type SearchedUser } from "@/components/admin/ChatTab";
import { NotificationsTab } from "@/components/admin/NotificationsTab";
import { AnalyticsTab } from "@/components/admin/AnalyticsTab";

export default function AdminCommunicationsPage() {
  const { t } = useTranslation(["admin", "common"]);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [activeTab, setActiveTab] = useState("tickets");
  const [newTicketDialog, setNewTicketDialog] = useState(false);
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<TicketRecord | null>(null);
  const [selectedConversation, setSelectedConversation] = useState<ConversationRecord | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [chatInput, setChatInput] = useState("");
  const [sendNotification, setSendNotification] = useState(false);
  const [customNotificationText, setCustomNotificationText] = useState("New message from admin");
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [ticketForm, setTicketForm] = useState({ title: "", description: "", priority: "medium", category: "general_inquiry", studentId: 33, studentName: "Admin User" });
  const [notificationForm, setNotificationForm] = useState({
    title: "", message: "", type: "info" as "info" | "warning" | "success" | "error",
    targetAudience: "all_users", channels: ["push", "email"] as string[],
    status: "sent" as "draft" | "scheduled" | "sent", testPhoneNumber: "",
  });
  const { user } = useAuth();

  const { tickets, conversations, notifications, messages, searchedUsers, ticketsLoading, conversationsLoading, notificationsLoading, messagesLoading, refetchMessages } = useCommunicationsData(selectedConversation?.id, userSearchQuery);

  const ticketsData: TicketRecord[] = tickets || [];
  const conversationsData: ConversationRecord[] = conversations || [];
  const notificationsData: NotificationRecord[] = notifications || [];
  const searchedUsersData: SearchedUser[] = (searchedUsers as SearchedUser[]) || [];

  const messagesData: MessageRecord[] = ((messages as MessageRecord[]) || []).map((msg: MessageRecord) => ({
    ...msg,
    isOwnMessage: user && msg.senderId && msg.senderId === user.id,
  }));

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const convId = params.get("conversation");
    if (convId && conversationsData.length > 0) {
      const conv = conversationsData.find((c: ConversationRecord) => c.id === parseInt(convId));
      if (conv) {
        setSelectedConversation(conv);
        setActiveTab("chat");
        window.history.replaceState({}, "", window.location.pathname);
      }
    }
  }, [conversationsData]);

  useEffect(() => {
    if (selectedConversation?.id) {
      qc.invalidateQueries({ queryKey: ["/api/chat/conversations", selectedConversation.id, "messages"] });
      refetchMessages();
    }
  }, [selectedConversation?.id]);

  const { createTicketMutation, sendMessageMutation, sendNotificationMutation, sendTicketReplyMutation, createConversationMutation } = useCommunicationsMutations(
    selectedConversation?.id,
    refetchMessages,
    () => setNewTicketDialog(false),
    () => setNotificationDialog(false),
    (conv) => { setSelectedConversation(conv); setUserSearchQuery(""); },
    () => { setChatInput(""); setSendNotification(false); setCustomNotificationText("New message from admin"); },
    () => setTicketReply(""),
  );

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="w-full px-3 md:px-4 py-4 md:py-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1">{t("admin:communications.title")}</h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">{t("admin:communications.subtitle")}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setNewTicketDialog(true)} size="sm">
              <Plus className="h-4 w-4 me-2" />{t("admin:communications.newTicket")}
            </Button>
            <Button variant="outline" onClick={() => setNotificationDialog(true)} size="sm">
              <Bell className="h-4 w-4 me-2" />{t("admin:communications.sendNotification")}
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 mb-6">
          {[
            { label: t("admin:communications.openTickets"), value: ticketsData.filter((t: TicketRecord) => t.status === "open").length, icon: HeadphonesIcon, color: "text-orange-500" },
            { label: t("admin:communications.activeChats"), value: conversationsData.filter((c: ConversationRecord) => (c.unreadCount ?? 0) > 0).length, icon: MessageSquare, color: "text-blue-500" },
            { label: t("admin:communications.todaysNotifications"), value: notificationsData.filter((n: NotificationRecord) => n.sentAt && new Date(n.sentAt as string).toDateString() === new Date().toDateString()).length, icon: Bell, color: "text-green-500" },
            { label: t("admin:communications.responseRate"), value: "94.2%", icon: Zap, color: "text-purple-500" },
          ].map(({ label, value, icon: Icon, color }) => (
            <Card key={label}>
              <CardContent className="p-3 md:p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">{label}</p>
                    <p className="text-lg md:text-2xl font-bold text-gray-900 dark:text-white">{value}</p>
                  </div>
                  <Icon className={`h-6 w-6 md:h-8 md:w-8 ${color}`} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
            {[
              { value: "tickets", icon: HeadphonesIcon, label: t("admin:communications.supportTickets"), short: "Support" },
              { value: "chat", icon: MessageSquare, label: t("admin:communications.liveChat"), short: "Chat" },
              { value: "notifications", icon: Bell, label: t("admin:communications.pushNotifications"), short: "Notify" },
              { value: "analytics", icon: Globe, label: t("admin:communications.analytics"), short: "Data" },
            ].map(({ value, icon: Icon, label, short }) => (
              <TabsTrigger key={value} value={value} className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">
                <Icon className="h-3 w-3 md:h-4 md:w-4" />
                <span className="hidden sm:inline">{label}</span>
                <span className="sm:hidden">{short}</span>
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="tickets">
            <TicketsTab
              tickets={ticketsData}
              isLoading={ticketsLoading}
              selectedTicket={selectedTicket}
              onSelectTicket={setSelectedTicket}
              ticketReply={ticketReply}
              onReplyChange={setTicketReply}
              onSendReply={() => { if (selectedTicket && ticketReply.trim()) sendTicketReplyMutation.mutate({ ticketId: selectedTicket.id, message: ticketReply }); }}
              isSending={sendTicketReplyMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="chat">
            <ChatTab
              conversations={conversationsData}
              conversationsLoading={conversationsLoading}
              messages={messagesData}
              messagesLoading={messagesLoading}
              selectedConversation={selectedConversation}
              onSelectConversation={setSelectedConversation}
              chatInput={chatInput}
              onChatInputChange={setChatInput}
              sendNotification={sendNotification}
              onSendNotificationChange={setSendNotification}
              customNotificationText={customNotificationText}
              onCustomNotificationTextChange={setCustomNotificationText}
              userSearchQuery={userSearchQuery}
              onUserSearchQueryChange={setUserSearchQuery}
              searchedUsers={searchedUsersData}
              onCreateConversation={(userId) => createConversationMutation.mutate(userId)}
              onSendMessage={() => {
                if (chatInput.trim() && selectedConversation) {
                  sendMessageMutation.mutate({ conversationId: selectedConversation.id, message: chatInput, withNotification: sendNotification, notificationText: customNotificationText });
                }
              }}
              isSending={sendMessageMutation.isPending}
              currentUserId={user?.id}
            />
          </TabsContent>

          <TabsContent value="notifications">
            <NotificationsTab
              notifications={notificationsData}
              isLoading={notificationsLoading}
              form={notificationForm}
              onFormChange={setNotificationForm}
              onSend={() => { if (notificationForm.title && notificationForm.message) sendNotificationMutation.mutate(notificationForm); }}
              isSending={sendNotificationMutation.isPending}
            />
          </TabsContent>

          <TabsContent value="analytics">
            <AnalyticsTab />
          </TabsContent>
        </Tabs>

        {/* New Ticket Dialog */}
        <Dialog open={newTicketDialog} onOpenChange={setNewTicketDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
              <DialogDescription>Submit a new support request</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Title</Label>
                <Input placeholder="Brief description" value={ticketForm.title} onChange={(e) => setTicketForm({ ...ticketForm, title: e.target.value })} />
              </div>
              <div>
                <Label>Description</Label>
                <Textarea placeholder="Detailed information" rows={4} value={ticketForm.description} onChange={(e) => setTicketForm({ ...ticketForm, description: e.target.value })} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select value={ticketForm.priority} onValueChange={(v) => setTicketForm({ ...ticketForm, priority: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {["low", "medium", "high", "urgent"].map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select value={ticketForm.category} onValueChange={(v) => setTicketForm({ ...ticketForm, category: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {[["general_inquiry", "General Inquiry"], ["technical_issue", "Technical Issue"], ["billing", "Billing"], ["course_help", "Course Help"], ["other", "Other"]].map(([val, lbl]) => (
                        <SelectItem key={val} value={val}>{lbl}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setNewTicketDialog(false)}>Cancel</Button>
                <Button onClick={() => { if (ticketForm.title && ticketForm.description) createTicketMutation.mutate(ticketForm); }} disabled={!ticketForm.title || !ticketForm.description || createTicketMutation.isPending}>
                  {createTicketMutation.isPending ? "Creating..." : "Create Ticket"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        {/* Notification Dialog */}
        <Dialog open={notificationDialog} onOpenChange={setNotificationDialog}>
          <DialogContent className="max-w-xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Send Push Notification</DialogTitle>
              <DialogDescription>Create and send notifications to users</DialogDescription>
            </DialogHeader>
            <NotificationsTab
              notifications={[]}
              isLoading={false}
              form={notificationForm}
              onFormChange={setNotificationForm}
              onSend={() => { if (notificationForm.title && notificationForm.message) sendNotificationMutation.mutate(notificationForm); }}
              isSending={sendNotificationMutation.isPending}
            />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
