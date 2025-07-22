import { useState, useEffect } from "react";
import { queryClient } from "@/lib/queryClient";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { useLocation } from "wouter";
import { 
  HeadphonesIcon,
  MessageSquare, 
  Bell,
  Send,
  Search,
  Plus,
  Filter,
  Clock,
  CheckCircle2,
  AlertTriangle,
  XCircle,
  Users,
  Smartphone,
  Globe,
  Zap,
  Eye,
  Paperclip,
  Star,
  MoreVertical
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/use-auth";

interface SupportTicket {
  id: number;
  title: string;
  description: string;
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  category: string;
  studentId: number;
  studentName: string;
  assignedTo?: string;
  createdAt: string;
  updatedAt: string;
  attachments?: string[];
  messages: TicketMessage[];
}

interface TicketMessage {
  id: number;
  ticketId: number;
  message: string;
  senderType: 'student' | 'staff';
  senderName: string;
  sentAt: string;
  isInternal?: boolean;
}

interface ChatConversation {
  id: number;
  participants: string[];
  lastMessage: string;
  lastMessageAt: string;
  unreadCount: number;
  type: 'direct' | 'group';
  title?: string;
  isOnline?: boolean;
}

interface PushNotification {
  id: number;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'success' | 'error';
  targetAudience: string;
  channels: string[];
  status: 'draft' | 'scheduled' | 'sent';
  scheduledAt?: string;
  sentAt?: string;
  deliveryStats?: {
    sent: number;
    delivered: number;
    clicked: number;
  };
}

export default function AdminCommunicationsPage() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [location] = useLocation();
  const [activeTab, setActiveTab] = useState("tickets");
  const [newTicketDialog, setNewTicketDialog] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<SupportTicket | null>(null);
  const [chatInput, setChatInput] = useState("");
  const [notificationDialog, setNotificationDialog] = useState(false);
  const [selectedConversation, setSelectedConversation] = useState<ChatConversation | null>(null);
  const [ticketReply, setTicketReply] = useState("");
  const [sendNotification, setSendNotification] = useState(false);
  const [customNotificationText, setCustomNotificationText] = useState("New message from admin");
  
  // New ticket form state
  const [ticketForm, setTicketForm] = useState({
    title: "",
    description: "",
    priority: "medium",
    category: "general_inquiry",
    studentId: 33, // Default to current user
    studentName: "Admin User"
  });
  
  // Notification form state
  const [notificationForm, setNotificationForm] = useState({
    title: "",
    message: "",
    type: "info" as 'info' | 'warning' | 'success' | 'error',
    targetAudience: "all_users",
    channels: ["push", "email"] as string[],
    status: "sent" as 'draft' | 'scheduled' | 'sent',
    testPhoneNumber: ""
  });

  // Real API calls for support tickets
  const { data: tickets, isLoading: ticketsLoading } = useQuery({
    queryKey: ['/api/support-tickets'],
  });

  // Real API calls for chat conversations
  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/chat/conversations'],
  });

  // Real API calls for notifications
  const { data: notifications, isLoading: notificationsLoading } = useQuery({
    queryKey: ['/api/push-notifications'],
  });

  // Real API calls for conversation messages - FIXED query key
  const { data: messages, isLoading: messagesLoading, refetch: refetchMessages } = useQuery({
    queryKey: selectedConversation ? [`/api/chat/conversations/${selectedConversation.id}/messages`] : ['no-conversation'],
    enabled: !!selectedConversation,
    refetchInterval: 1000, // Refresh every second
    staleTime: 0, // Always treat data as stale
    gcTime: 0, // No caching at all
    refetchOnWindowFocus: true,
    refetchOnMount: 'always' as const,
    structuralSharing: false, // Disable structural sharing to force complete data refresh
  });

  const ticketsData = (tickets as SupportTicket[]) || [];
  const conversationsData = (conversations as ChatConversation[]) || [];
  const notificationsData = (notifications as PushNotification[]) || [];
  // Get current user for message ownership detection with debug logging
  const { user } = useAuth();
  
  // Debug current user state
  console.log('Communications: Current user from useAuth:', { 
    id: user?.id, 
    email: user?.email,
    role: user?.role 
  });
  
  // Process messages with proper ownership detection - add debug
  console.log('Raw messages data from query:', messages);
  
  // Force refresh on conversation change
  useEffect(() => {
    if (selectedConversation) {
      queryClient.invalidateQueries({ queryKey: [`/api/chat/conversations/${selectedConversation.id}/messages`] });
      refetchMessages();
    }
  }, [selectedConversation?.id]);
  
  const messagesData = ((messages as Array<{
    id: number;
    conversationId: number; 
    message: string;
    senderName: string;
    senderId: number;
    sentAt: string;
    isOwnMessage?: boolean;
  }>) || []).map(msg => {
    const isOwn = user && msg.senderId && msg.senderId === user.id;
    if (selectedConversation) {
      console.log(`Message ${msg.id}: senderId=${msg.senderId}, currentUserId=${user?.id}, isOwn=${isOwn}`);
    }
    return {
      ...msg,
      isOwnMessage: isOwn
    };
  });

  // Parse URL parameters and auto-select conversation
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const conversationId = searchParams.get('conversation');
    
    if (conversationId && conversationsData.length > 0) {
      const conversation = conversationsData.find(c => c.id === parseInt(conversationId));
      if (conversation) {
        setSelectedConversation(conversation);
        setActiveTab("chat"); // Auto-switch to chat tab
        console.log('Auto-selected conversation:', conversation.id);
        
        // Clear URL parameters after auto-selection for clean URL
        if (window.history.replaceState) {
          window.history.replaceState({}, '', window.location.pathname);
        }
      }
    }
  }, [conversationsData]);

  // Ticket operations
  const createTicketMutation = useMutation({
    mutationFn: async (ticketData: any) => {
      return apiRequest('/api/support-tickets', { 
        method: 'POST', 
        body: JSON.stringify(ticketData) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      toast({ title: "Support ticket created successfully" });
      setNewTicketDialog(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to create ticket", description: error.message, variant: "destructive" });
    }
  });

  // Send chat message with optional notification
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, message, withNotification, notificationText }: { 
      conversationId: number; 
      message: string;
      withNotification?: boolean;
      notificationText?: string;
    }) => {
      const response = await apiRequest(`/api/chat/conversations/${conversationId}/messages`, { 
        method: 'POST', 
        body: JSON.stringify({ message }) 
      });

      // Send notification if requested
      if (withNotification && notificationText) {
        await apiRequest('/api/push-notifications', {
          method: 'POST',
          body: JSON.stringify({
            title: "New Message",
            message: notificationText,
            type: "info",
            targetAudience: "student",
            channels: ["push", "sms"],
            status: "sent"
          })
        });
      }

      return response;
    },
    onSuccess: async (response) => {
      console.log('Message sent successfully:', response);
      console.log('Current user ID:', user?.id);
      console.log('User email:', user?.email);
      
      // Clear form first
      setChatInput("");
      setSendNotification(false);
      setCustomNotificationText("New message from admin");
      
      // Aggressive cache invalidation
      queryClient.removeQueries({ queryKey: ['/api/chat/conversations'] });
      queryClient.removeQueries({ queryKey: ['/api/chat/conversations', selectedConversation?.id, 'messages'] });
      
      // Force multiple refetches with delays
      setTimeout(() => {
        console.log('Refetching messages after 100ms');
        refetchMessages();
      }, 100);
      setTimeout(() => {
        console.log('Refetching messages after 500ms');
        refetchMessages();
      }, 500);
      setTimeout(() => {
        console.log('Refetching messages after 1000ms');
        refetchMessages();
      }, 1000);
      
      // Success feedback
      toast({ title: "Message sent successfully" });
    },
    onError: (error: any) => {
      toast({ title: "Failed to send message", description: error.message, variant: "destructive" });
    }
  });

  // Send push notification
  const sendNotificationMutation = useMutation({
    mutationFn: async (notificationData: any) => {
      return apiRequest('/api/push-notifications', { 
        method: 'POST', 
        body: JSON.stringify(notificationData) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/push-notifications'] });
      toast({ title: "Notification sent successfully" });
      setNotificationDialog(false);
      // Clear custom notification text after successful send
      setCustomNotificationText("New message from admin");
      setSendNotification(false);
    },
    onError: (error: any) => {
      toast({ title: "Failed to send notification", description: error.message, variant: "destructive" });
    }
  });

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800 border-red-200';
      case 'high': return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'medium': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low': return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open': return <AlertTriangle className="h-4 w-4 text-orange-500" />;
      case 'in_progress': return <Clock className="h-4 w-4 text-blue-500" />;
      case 'resolved': return <CheckCircle2 className="h-4 w-4 text-green-500" />;
      case 'closed': return <XCircle className="h-4 w-4 text-gray-500" />;
      default: return <AlertTriangle className="h-4 w-4 text-gray-500" />;
    }
  };
  
  // Send ticket reply mutation
  const sendTicketReplyMutation = useMutation({
    mutationFn: async ({ ticketId, message }: { ticketId: number; message: string }) => {
      return apiRequest(`/api/support-tickets/${ticketId}/messages`, { 
        method: 'POST', 
        body: JSON.stringify({ message }) 
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/support-tickets'] });
      toast({ title: "Reply sent successfully" });
      setTicketReply("");
    },
    onError: (error: any) => {
      toast({ title: "Failed to send reply", description: error.message, variant: "destructive" });
    }
  });

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-3 md:px-4 py-4 md:py-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4 md:mb-6">
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white mb-1 md:mb-2">
              Communication Hub
            </h1>
            <p className="text-sm md:text-base text-gray-600 dark:text-gray-300">
              Modern ticketing, real-time chat, and push notifications
            </p>
          </div>
          <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
            <Button onClick={() => setNewTicketDialog(true)} size="sm" className="w-full sm:w-auto">
              <Plus className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">New Ticket</span>
            </Button>
            <Button variant="outline" onClick={() => setNotificationDialog(true)} size="sm" className="w-full sm:w-auto">
              <Bell className="h-3 w-3 md:h-4 md:w-4 mr-1 md:mr-2" />
              <span className="text-xs md:text-sm">Send Notification</span>
            </Button>
          </div>
        </div>

        {/* Mobile-First Statistics Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 lg:gap-6 mb-4 md:mb-6 lg:mb-8">
          <Card>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Open Tickets</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {ticketsData.filter(t => t.status === 'open').length}
                  </p>
                </div>
                <HeadphonesIcon className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-3 md:p-4 lg:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs md:text-sm font-medium text-gray-600 dark:text-gray-400">Active Chats</p>
                  <p className="text-lg md:text-xl lg:text-2xl font-bold text-gray-900 dark:text-white">
                    {conversationsData.filter(c => c.unreadCount > 0).length}
                  </p>
                </div>
                <MessageSquare className="h-6 w-6 md:h-7 md:w-7 lg:h-8 lg:w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Today's Notifications</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {notificationsData.filter(n => n.sentAt && new Date(n.sentAt).toDateString() === new Date().toDateString()).length}
                  </p>
                </div>
                <Bell className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Response Rate</p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">94.2%</p>
                </div>
                <Zap className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Mobile-First Content Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4 md:space-y-6">
          <TabsList className="grid w-full grid-cols-2 md:grid-cols-4 gap-1 md:gap-0 bg-white dark:bg-gray-800 p-1 rounded-lg shadow-sm">
            <TabsTrigger value="tickets" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">
              <HeadphonesIcon className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Support Tickets</span>
              <span className="sm:hidden">Support</span>
            </TabsTrigger>
            <TabsTrigger value="chat" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">
              <MessageSquare className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Live Chat</span>
              <span className="sm:hidden">Chat</span>
            </TabsTrigger>
            <TabsTrigger value="notifications" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">
              <Bell className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Push Notifications</span>
              <span className="sm:hidden">Notify</span>
            </TabsTrigger>
            <TabsTrigger value="analytics" className="flex items-center gap-1 md:gap-2 text-xs md:text-sm p-2 md:p-3 data-[state=active]:bg-blue-500 data-[state=active]:text-white rounded-md transition-all">
              <Globe className="h-3 w-3 md:h-4 md:w-4" />
              <span className="hidden sm:inline">Analytics</span>
              <span className="sm:hidden">Data</span>
            </TabsTrigger>
          </TabsList>

          {/* Support Tickets Tab */}
          <TabsContent value="tickets" className="space-y-6">
            <div className="flex gap-4 items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <Input placeholder="Search tickets..." className="pl-10" />
              </div>
              <Select defaultValue="all">
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Filter status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tickets</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {/* Tickets List */}
              <Card>
                <CardHeader>
                  <CardTitle>Support Tickets</CardTitle>
                  <CardDescription>Manage student support requests</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {ticketsLoading ? (
                        <div className="text-center py-8">Loading tickets...</div>
                      ) : ticketsData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No support tickets yet
                        </div>
                      ) : (
                        ticketsData.map((ticket) => (
                          <div
                            key={ticket.id}
                            className={`p-4 border rounded-lg cursor-pointer transition-colors hover:bg-gray-50 dark:hover:bg-gray-800 ${
                              selectedTicket?.id === ticket.id ? 'bg-blue-50 dark:bg-blue-900/20 border-blue-200' : ''
                            }`}
                            onClick={() => setSelectedTicket(ticket)}
                          >
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                {getStatusIcon(ticket.status)}
                                <h4 className="font-medium">{ticket.title}</h4>
                              </div>
                              <Badge className={`${getPriorityColor(ticket.priority)}`}>
                                {ticket.priority}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                              {ticket.description.substring(0, 80)}...
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>by {ticket.studentName}</span>
                              <span>
                                {ticket.createdAt ? new Date(ticket.createdAt).toLocaleDateString() : 'Unknown'}
                              </span>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Ticket Details */}
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Details</CardTitle>
                  <CardDescription>
                    {selectedTicket ? `Ticket #${selectedTicket.id}` : 'Select a ticket to view details'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {selectedTicket ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(selectedTicket.status)}
                          <span className="font-medium">{selectedTicket.status.replace('_', ' ')}</span>
                        </div>
                        <Badge className={`${getPriorityColor(selectedTicket.priority)}`}>
                          {selectedTicket.priority} priority
                        </Badge>
                      </div>
                      
                      <div>
                        <h3 className="font-medium mb-2">{selectedTicket.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          {selectedTicket.description}
                        </p>
                      </div>

                      <div className="border-t pt-4">
                        <h4 className="font-medium mb-3">Messages</h4>
                        <ScrollArea className="h-[200px]">
                          <div className="space-y-3">
                            {selectedTicket.messages.map((message) => (
                              <div key={message.id} className={`p-3 rounded-lg ${
                                message.senderType === 'staff' 
                                  ? 'bg-blue-50 dark:bg-blue-900/20 ml-4' 
                                  : 'bg-gray-50 dark:bg-gray-800 mr-4'
                              }`}>
                                <div className="flex items-center justify-between mb-1">
                                  <span className="text-sm font-medium">{message.senderName}</span>
                                  <span className="text-xs text-gray-500">
                                    {message.sentAt ? new Date(message.sentAt).toLocaleString() : 'Just now'}
                                  </span>
                                </div>
                                <p className="text-sm">{message.message}</p>
                              </div>
                            ))}
                          </div>
                        </ScrollArea>
                      </div>

                      <div className="border-t pt-4">
                        <Textarea 
                          placeholder="Type your response..." 
                          className="mb-2"
                          value={ticketReply}
                          onChange={(e) => setTicketReply(e.target.value)}
                        />
                        <div className="flex justify-between">
                          <Button variant="outline" size="sm">
                            <Paperclip className="h-4 w-4 mr-2" />
                            Attach File
                          </Button>
                          <Button 
                            size="sm"
                            onClick={() => {
                              if (ticketReply.trim()) {
                                sendTicketReplyMutation.mutate({
                                  ticketId: selectedTicket.id,
                                  message: ticketReply
                                });
                              }
                            }}
                            disabled={!ticketReply.trim() || sendTicketReplyMutation.isPending}
                          >
                            <Send className="h-4 w-4 mr-2" />
                            {sendTicketReplyMutation.isPending ? 'Sending...' : 'Send Reply'}
                          </Button>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-12 text-gray-500">
                      Select a ticket to view details and respond
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Internal Chat Tab */}
          <TabsContent value="chat" className="space-y-4">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
              {/* Conversations List */}
              <Card className="lg:col-span-1">
                <CardHeader>
                  <CardTitle>Conversations</CardTitle>
                  <CardDescription>Staff internal messaging</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[400px] lg:h-[500px]">
                    <div className="space-y-2 pr-4">
                      {conversationsLoading ? (
                        <div className="text-center py-8">Loading conversations...</div>
                      ) : conversationsData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No conversations yet
                        </div>
                      ) : (
                        conversationsData.map((conversation) => (
                          <div
                            key={conversation.id}
                            className={`p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer transition-colors ${
                              selectedConversation?.id === conversation.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                            }`}
                            onClick={() => setSelectedConversation(conversation)}
                          >
                            <div className="flex items-center gap-3">
                              <div className="relative">
                                <Avatar className="h-10 w-10">
                                  <AvatarFallback>
                                    {conversation.type === 'group' ? (
                                      <Users className="h-5 w-5" />
                                    ) : (
                                      conversation.participants[0]?.charAt(0) || 'U'
                                    )}
                                  </AvatarFallback>
                                </Avatar>
                                {conversation.isOnline && (
                                  <div className="absolute bottom-0 right-0 h-3 w-3 bg-green-500 rounded-full border-2 border-white dark:border-gray-900"></div>
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center justify-between">
                                  <p className="text-sm font-medium truncate">
                                    {conversation.title || conversation.participants.join(', ')}
                                  </p>
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                </div>
                                <p className="text-sm text-gray-500 truncate">
                                  {conversation.lastMessage}
                                </p>
                                <p className="text-xs text-gray-400">
                                  {conversation.lastMessageAt ? new Date(conversation.lastMessageAt).toLocaleTimeString() : 'No messages'}
                                </p>
                              </div>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Chat Interface */}
              <Card className="lg:col-span-2">
                <CardHeader className="border-b">
                  <CardTitle className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5" />
                    {selectedConversation ? (
                      <span className="truncate">
                        {selectedConversation.title || selectedConversation.participants.join(', ')}
                      </span>
                    ) : (
                      "Select Conversation"
                    )}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {selectedConversation ? "Real-time messaging" : "Choose a conversation to start messaging"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="p-0">
                  <div className="flex flex-col h-[500px]">
                    <ScrollArea className="flex-1">
                      <div className="space-y-3 p-4">
                        {selectedConversation ? (
                          messagesLoading ? (
                            <div className="text-center py-8 text-gray-500">Loading messages...</div>
                          ) : messagesData.length === 0 ? (
                            <div className="text-center py-8 text-gray-500">
                              No messages yet. Start the conversation!
                            </div>
                          ) : (
                            messagesData
                              .filter(message => message.message && message.message.trim().length > 0) // Fix 2: Filter empty messages
                              .map((message) => (
                              <div 
                                key={message.id}
                                className={`flex items-start gap-3 ${user && message.senderId === user.id ? 'justify-end' : ''}`}
                              >
                                {!(user && message.senderId === user.id) && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>
                                      {message.senderName?.split(' ').map(n => n[0]).join('') || 'U'}
                                    </AvatarFallback>
                                  </Avatar>
                                )}
                                <div className={`rounded-lg p-3 max-w-[70%] ${
                                  (user && message.senderId === user.id)
                                    ? 'bg-blue-500 text-white' 
                                    : 'bg-gray-100 dark:bg-gray-800'
                                }`}>
                                  <p className="text-sm">{message.message}</p>
                                  <p className={`text-xs mt-1 ${
                                    (user && message.senderId === user.id) ? 'text-blue-100' : 'text-gray-500'
                                  }`}>
                                    {message.sentAt ? new Date(message.sentAt).toLocaleTimeString() : 'Just now'}
                                  </p>
                                </div>
                                {(user && message.senderId === user.id) && (
                                  <Avatar className="h-8 w-8">
                                    <AvatarFallback>ME</AvatarFallback>
                                  </Avatar>
                                )}
                              </div>
                            ))
                          )
                        ) : (
                          <div className="text-center py-12 text-gray-500">
                            Select a conversation to view messages
                          </div>
                        )}
                      </div>
                    </ScrollArea>
                    
                    {/* Message Input Area */}
                    <div className="border-t p-4 space-y-3">
                      {/* Enhanced Notification Options */}
                      <div className="flex flex-col gap-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <Bell className="h-4 w-4 text-blue-500" />
                            <Label htmlFor="sendNotif" className="text-sm font-semibold text-blue-900 dark:text-blue-100">
                              Send Custom Notification
                            </Label>
                          </div>
                          <Checkbox 
                            id="sendNotif"
                            checked={sendNotification}
                            onCheckedChange={(checked) => setSendNotification(checked as boolean)}
                            className="data-[state=checked]:bg-blue-500 border-blue-400"
                          />
                        </div>
                        <div className="space-y-2">
                          <Input
                            placeholder={sendNotification ? "Enter your custom notification message..." : "Check the box above to send a notification with your message"}
                            value={customNotificationText}
                            onChange={(e) => setCustomNotificationText(e.target.value)}
                            className="w-full text-sm bg-white dark:bg-gray-800 border-blue-300 dark:border-blue-600 focus:border-blue-500"
                            disabled={!sendNotification}
                          />
                          {sendNotification && (
                            <div className="space-y-3">
                              <p className="text-xs text-blue-600 dark:text-blue-400 flex items-center gap-1">
                                <MessageSquare className="h-3 w-3" />
                                This notification will be sent via SMS and push notification
                              </p>
                              <Button 
                                onClick={() => {
                                  if (customNotificationText.trim()) {
                                    sendNotificationMutation.mutate({
                                      title: "Custom Notification",
                                      message: customNotificationText,
                                      type: "info",
                                      targetAudience: "student",
                                      channels: ["push", "sms"],
                                      status: "sent"
                                    });
                                  }
                                }}
                                disabled={!customNotificationText.trim() || sendNotificationMutation.isPending}
                                size="sm"
                                className="w-full bg-blue-500 hover:bg-blue-600 text-white"
                              >
                                {sendNotificationMutation.isPending ? (
                                  <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                                ) : (
                                  <Bell className="h-4 w-4 mr-2" />
                                )}
                                Send Notification Now
                              </Button>
                            </div>
                          )}
                        </div>
                      </div>

                      {/* Message Input & Send Button */}
                      <div className="flex items-center gap-2">
                        <Input
                          placeholder="Type your message here..."
                          value={chatInput}
                          onChange={(e) => setChatInput(e.target.value)}
                          className="flex-1" 
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && chatInput.trim() && selectedConversation) {
                              sendMessageMutation.mutate({
                                conversationId: selectedConversation.id,
                                message: chatInput,
                                withNotification: sendNotification,
                                notificationText: customNotificationText
                              });
                            }
                          }}
                        />
                        <Button 
                          onClick={() => {
                            if (chatInput.trim() && selectedConversation) {
                              sendMessageMutation.mutate({
                                conversationId: selectedConversation.id,
                                message: chatInput,
                                withNotification: sendNotification,
                                notificationText: customNotificationText
                              });
                            }
                          }}
                          disabled={!chatInput.trim() || !selectedConversation || sendMessageMutation.isPending}
                        >
                          {sendMessageMutation.isPending ? (
                            <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                          ) : (
                            <Send className="h-4 w-4" />
                          )}
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Push Notifications Tab */}
          <TabsContent value="notifications" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Notifications List */}
              <Card>
                <CardHeader>
                  <CardTitle>Recent Notifications</CardTitle>
                  <CardDescription>Push notifications sent to users</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[500px]">
                    <div className="space-y-4">
                      {notificationsLoading ? (
                        <div className="text-center py-8">Loading notifications...</div>
                      ) : notificationsData.length === 0 ? (
                        <div className="text-center py-8 text-gray-500">
                          No notifications sent yet
                        </div>
                      ) : (
                        notificationsData.map((notification) => (
                          <div key={notification.id} className="border rounded-lg p-4">
                            <div className="flex items-start justify-between mb-2">
                              <h4 className="font-medium">{notification.title}</h4>
                              <Badge variant={notification.status === 'sent' ? 'default' : 'secondary'}>
                                {notification.status}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                              {notification.message}
                            </p>
                            <div className="flex items-center justify-between text-xs text-gray-500">
                              <span>to {notification.targetAudience}</span>
                              <span>
                                {notification.sentAt 
                                  ? new Date(notification.sentAt).toLocaleString()
                                  : 'Not sent'
                                }
                              </span>
                            </div>
                            {notification.deliveryStats && (
                              <div className="mt-2 pt-2 border-t">
                                <div className="flex justify-between text-xs">
                                  {notification.deliveryStats.sent && (
                                    <span>SMS Sent: {notification.deliveryStats.sent}</span>
                                  )}
                                  {notification.deliveryStats.delivered && (
                                    <span>Recipients: {notification.deliveryStats.delivered}</span>
                                  )}
                                  {notification.deliveryStats.sent && (
                                    <span>Sent: {notification.deliveryStats.sent}</span>
                                  )}
                                  {notification.deliveryStats.delivered && (
                                    <span>Delivered: {notification.deliveryStats.delivered}</span>
                                  )}
                                </div>
                              </div>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </ScrollArea>
                </CardContent>
              </Card>

              {/* Notification Composer */}
              <Card>
                <CardHeader>
                  <CardTitle>Send Notification</CardTitle>
                  <CardDescription>Create and send push notifications</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Title</label>
                    <Input 
                      placeholder="Notification title..." 
                      value={notificationForm.title}
                      onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                    />
                  </div>
                  
                  <div>
                    <label className="text-sm font-medium mb-2 block">Message</label>
                    <Textarea 
                      placeholder="Notification message..." 
                      value={notificationForm.message}
                      onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium mb-2 block">Target Audience</label>
                      <Select 
                        defaultValue="all" 
                        onValueChange={(value) => setNotificationForm({...notificationForm, targetAudience: value})}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Users</SelectItem>
                          <SelectItem value="students">Students Only</SelectItem>
                          <SelectItem value="teachers">Teachers Only</SelectItem>
                          <SelectItem value="staff">Staff Only</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <label className="text-sm font-medium mb-2 block">Priority</label>
                      <Select defaultValue="medium">
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="low">Low</SelectItem>
                          <SelectItem value="medium">Medium</SelectItem>
                          <SelectItem value="high">High</SelectItem>
                          <SelectItem value="urgent">Urgent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">Delivery Channels</label>
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="web-push" defaultChecked />
                        <label htmlFor="web-push" className="text-sm">Web Push Notification</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="in-app" defaultChecked />
                        <label htmlFor="in-app" className="text-sm">In-App Notification</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="sms" />
                        <label htmlFor="sms" className="text-sm">SMS (via Kavenegar)</label>
                      </div>
                      <div className="flex items-center gap-2">
                        <input type="checkbox" id="email" />
                        <label htmlFor="email" className="text-sm">Email</label>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button 
                      className="flex-1"
                      onClick={() => {
                        if (notificationForm.title && notificationForm.message) {
                          sendNotificationMutation.mutate(notificationForm);
                        }
                      }}
                      disabled={!notificationForm.title || !notificationForm.message || sendNotificationMutation.isPending}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {sendNotificationMutation.isPending ? 'Sending...' : 'Send Now'}
                    </Button>
                    <Button variant="outline">
                      <Clock className="h-4 w-4 mr-2" />
                      Schedule
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Analytics Tab */}
          <TabsContent value="analytics" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Ticket Resolution</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Average Response Time</span>
                      <span className="font-medium">2.4 hours</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Resolution Rate</span>
                      <span className="font-medium">94.2%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Customer Satisfaction</span>
                      <div className="flex items-center gap-1">
                        <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                        <span className="font-medium">4.7/5</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Communication Volume</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Daily Messages</span>
                      <span className="font-medium">156</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Active Conversations</span>
                      <span className="font-medium">23</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Response Rate</span>
                      <span className="font-medium">98.1%</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Notification Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Delivery Rate</span>
                      <span className="font-medium">97.8%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Click Rate</span>
                      <span className="font-medium">23.4%</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm">Engagement Score</span>
                      <span className="font-medium">8.2/10</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Communication Trends</CardTitle>
                <CardDescription>Performance metrics over time</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500">
                  Communication analytics chart would go here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
        
        {/* New Ticket Dialog */}
        <Dialog open={newTicketDialog} onOpenChange={setNewTicketDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Create New Support Ticket</DialogTitle>
              <DialogDescription>
                Submit a new support request
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="ticket-title">Title</Label>
                <Input
                  id="ticket-title"
                  placeholder="Brief description of the issue"
                  value={ticketForm.title}
                  onChange={(e) => setTicketForm({...ticketForm, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="ticket-description">Description</Label>
                <Textarea
                  id="ticket-description"
                  placeholder="Provide detailed information about your request"
                  rows={4}
                  value={ticketForm.description}
                  onChange={(e) => setTicketForm({...ticketForm, description: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Priority</Label>
                  <Select
                    value={ticketForm.priority}
                    onValueChange={(value) => setTicketForm({...ticketForm, priority: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Category</Label>
                  <Select
                    value={ticketForm.category}
                    onValueChange={(value) => setTicketForm({...ticketForm, category: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general_inquiry">General Inquiry</SelectItem>
                      <SelectItem value="technical_issue">Technical Issue</SelectItem>
                      <SelectItem value="billing">Billing</SelectItem>
                      <SelectItem value="course_help">Course Help</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNewTicketDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (ticketForm.title && ticketForm.description) {
                      createTicketMutation.mutate(ticketForm);
                    }
                  }}
                  disabled={!ticketForm.title || !ticketForm.description || createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? 'Creating...' : 'Create Ticket'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
        
        {/* Notification Dialog */}
        <Dialog open={notificationDialog} onOpenChange={setNotificationDialog}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Send Push Notification</DialogTitle>
              <DialogDescription>
                Create and send notifications to users
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="notification-title">Title</Label>
                <Input
                  id="notification-title"
                  placeholder="Notification title"
                  value={notificationForm.title}
                  onChange={(e) => setNotificationForm({...notificationForm, title: e.target.value})}
                />
              </div>
              <div>
                <Label htmlFor="notification-message">Message</Label>
                <Textarea
                  id="notification-message"
                  placeholder="Notification message"
                  rows={3}
                  value={notificationForm.message}
                  onChange={(e) => setNotificationForm({...notificationForm, message: e.target.value})}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>Target Audience</Label>
                  <Select
                    value={notificationForm.targetAudience}
                    onValueChange={(value) => setNotificationForm({...notificationForm, targetAudience: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all_users">All Users</SelectItem>
                      <SelectItem value="students">Students Only</SelectItem>
                      <SelectItem value="teachers">Teachers Only</SelectItem>
                      <SelectItem value="staff">Staff Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label>Type</Label>
                  <Select
                    value={notificationForm.type}
                    onValueChange={(value: 'info' | 'warning' | 'success' | 'error') => setNotificationForm({...notificationForm, type: value})}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="info">Info</SelectItem>
                      <SelectItem value="success">Success</SelectItem>
                      <SelectItem value="warning">Warning</SelectItem>
                      <SelectItem value="error">Error</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label>Delivery Channels</Label>
                <div className="space-y-2 mt-2">
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel-push"
                      checked={notificationForm.channels.includes('push')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...notificationForm.channels, 'push']
                          : notificationForm.channels.filter(c => c !== 'push');
                        setNotificationForm({...notificationForm, channels});
                      }}
                    />
                    <label htmlFor="channel-push" className="text-sm">Push Notification</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel-email"
                      checked={notificationForm.channels.includes('email')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...notificationForm.channels, 'email']
                          : notificationForm.channels.filter(c => c !== 'email');
                        setNotificationForm({...notificationForm, channels});
                      }}
                    />
                    <label htmlFor="channel-email" className="text-sm">Email</label>
                  </div>
                  <div className="flex items-center gap-2">
                    <Checkbox
                      id="channel-sms"
                      checked={notificationForm.channels.includes('sms')}
                      onCheckedChange={(checked) => {
                        const channels = checked 
                          ? [...notificationForm.channels, 'sms']
                          : notificationForm.channels.filter(c => c !== 'sms');
                        setNotificationForm({...notificationForm, channels});
                      }}
                    />
                    <label htmlFor="channel-sms" className="text-sm">SMS (via Kavenegar)</label>
                  </div>
                </div>
              </div>
              {notificationForm.channels.includes('sms') && (
                <div>
                  <Label htmlFor="test-phone">Test Phone Number (for SMS)</Label>
                  <Input
                    id="test-phone"
                    placeholder="+98912345678"
                    value={notificationForm.testPhoneNumber}
                    onChange={(e) => setNotificationForm({...notificationForm, testPhoneNumber: e.target.value})}
                  />
                  <p className="text-sm text-gray-500 mt-1">Enter a phone number to test SMS delivery</p>
                </div>
              )}
              <div className="flex justify-end gap-2">
                <Button
                  variant="outline"
                  onClick={() => setNotificationDialog(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={() => {
                    if (notificationForm.title && notificationForm.message) {
                      sendNotificationMutation.mutate(notificationForm);
                    }
                  }}
                  disabled={!notificationForm.title || !notificationForm.message || sendNotificationMutation.isPending}
                >
                  {sendNotificationMutation.isPending ? 'Sending...' : 'Send Notification'}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}