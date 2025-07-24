import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { MessageSquare, Send, Search, Plus, Phone, Video, MoreVertical, Paperclip, Smile } from "lucide-react";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { format } from "date-fns";

interface Message {
  id: number;
  content: string;
  senderId: number;
  receiverId: number;
  conversationId: number;
  sentAt: Date;
  isRead: boolean;
  messageType: 'text' | 'file' | 'audio' | 'video';
  attachments?: string[];
  sender: {
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
  };
}

interface Conversation {
  id: number;
  participants: Array<{
    id: number;
    firstName: string;
    lastName: string;
    profileImage?: string;
    role: string;
    isOnline: boolean;
  }>;
  lastMessage: Message;
  unreadCount: number;
  updatedAt: Date;
}

export default function MessagesPage() {
  const { t } = useTranslation(['student', 'common']);
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [selectedConversation, setSelectedConversation] = useState<number | null>(null);
  const [newMessage, setNewMessage] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { data: conversations, isLoading: conversationsLoading } = useQuery({
    queryKey: ['/api/students/conversations'],
    enabled: !!user
  });

  const { data: messages, isLoading: messagesLoading } = useQuery({
    queryKey: ['/api/conversations', selectedConversation, 'messages'],
    enabled: !!selectedConversation
  });

  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await fetch(`/api/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ content, messageType: 'text' })
      });
      
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/conversations', selectedConversation, 'messages'] });
      queryClient.invalidateQueries({ queryKey: ['/api/students/conversations'] });
      setNewMessage("");
    }
  });

  const markAsReadMutation = useMutation({
    mutationFn: async (conversationId: number) => {
      const response = await fetch(`/api/conversations/${conversationId}/mark-read`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('accessToken')}`
        }
      });
      
      if (!response.ok) throw new Error('Failed to mark as read');
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/students/conversations'] });
    }
  });

  useEffect(() => {
    if (selectedConversation) {
      markAsReadMutation.mutate(selectedConversation);
    }
  }, [selectedConversation]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSendMessage = () => {
    if (!newMessage.trim() || !selectedConversation) return;
    
    sendMessageMutation.mutate({
      conversationId: selectedConversation,
      content: newMessage
    });
  };

  const filteredConversations = conversations?.filter((conv: Conversation) => {
    const otherParticipant = conv.participants.find(p => p.id !== user?.id);
    if (!otherParticipant) return false;
    
    const name = `${otherParticipant.firstName} ${otherParticipant.lastName}`.toLowerCase();
    return name.includes(searchTerm.toLowerCase()) || 
           conv.lastMessage.content.toLowerCase().includes(searchTerm.toLowerCase());
  }) || [];

  const selectedConversationData = conversations?.find((conv: Conversation) => conv.id === selectedConversation);
  const otherParticipant = selectedConversationData?.participants.find(p => p.id !== user?.id);

  if (conversationsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p>Loading messages...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            {t('student:messages.title')}
          </h1>
          <p className="text-gray-600 dark:text-gray-300">
            {t('student:messages.subtitle')}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100vh-200px)]">
          {/* Conversations List */}
          <Card className="lg:col-span-1 flex flex-col">
            <CardHeader className="pb-4">
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <MessageSquare className="h-5 w-5" />
                  Conversations
                </CardTitle>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button size="sm">
                      <Plus className="h-4 w-4" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Start New Conversation</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-sm text-gray-600 dark:text-gray-300">
                        To start a new conversation, book a session with a tutor or contact your course instructor directly.
                      </p>
                      <div className="flex gap-2">
                        <Button onClick={() => window.location.href = '/tutors'} className="flex-1">
                          Find Tutors
                        </Button>
                        <Button variant="outline" onClick={() => window.location.href = '/courses'} className="flex-1">
                          My Courses
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search conversations..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </CardHeader>
            <CardContent className="flex-1 p-0">
              <ScrollArea className="h-full">
                <div className="space-y-1 p-4">
                  {filteredConversations.length > 0 ? (
                    filteredConversations.map((conversation: Conversation) => {
                      const participant = conversation.participants.find(p => p.id !== user?.id);
                      if (!participant) return null;

                      return (
                        <div
                          key={conversation.id}
                          className={`p-3 rounded-lg cursor-pointer transition-colors ${
                            selectedConversation === conversation.id
                              ? 'bg-primary/10 border border-primary/20'
                              : 'hover:bg-gray-100 dark:hover:bg-gray-800'
                          }`}
                          onClick={() => setSelectedConversation(conversation.id)}
                        >
                          <div className="flex items-start gap-3">
                            <div className="relative">
                              <Avatar className="w-12 h-12">
                                <AvatarImage src={participant.profileImage} />
                                <AvatarFallback>
                                  {participant.firstName[0]}{participant.lastName[0]}
                                </AvatarFallback>
                              </Avatar>
                              {participant.isOnline && (
                                <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-green-500 border-2 border-white rounded-full"></div>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between">
                                <h3 className="font-medium text-sm truncate">
                                  {participant.firstName} {participant.lastName}
                                </h3>
                                <div className="flex items-center gap-1">
                                  {conversation.unreadCount > 0 && (
                                    <Badge variant="destructive" className="text-xs px-1.5 py-0.5">
                                      {conversation.unreadCount}
                                    </Badge>
                                  )}
                                  <span className="text-xs text-gray-500">
                                    {format(new Date(conversation.updatedAt), 'MMM d')}
                                  </span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 dark:text-gray-300 mb-1">
                                {participant.role}
                              </p>
                              <p className="text-sm text-gray-600 dark:text-gray-300 truncate">
                                {conversation.lastMessage.content}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500 text-sm">No conversations found</p>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>

          {/* Chat Area */}
          <Card className="lg:col-span-2 flex flex-col">
            {selectedConversation && otherParticipant ? (
              <>
                {/* Chat Header */}
                <CardHeader className="pb-4 border-b">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Avatar className="w-10 h-10">
                        <AvatarImage src={otherParticipant.profileImage} />
                        <AvatarFallback>
                          {otherParticipant.firstName[0]}{otherParticipant.lastName[0]}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <h3 className="font-medium">
                          {otherParticipant.firstName} {otherParticipant.lastName}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-300">
                          {otherParticipant.role} • {otherParticipant.isOnline ? 'Online' : 'Offline'}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" variant="outline">
                        <Phone className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <Video className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="outline">
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>

                {/* Messages */}
                <CardContent className="flex-1 p-0 flex flex-col">
                  <ScrollArea className="flex-1 p-4">
                    <div className="space-y-4">
                      {messagesLoading ? (
                        <div className="flex justify-center py-4">
                          <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                        </div>
                      ) : messages?.length > 0 ? (
                        messages.map((message: Message) => {
                          const isOwn = message.senderId === user?.id;
                          return (
                            <div
                              key={message.id}
                              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                            >
                              <div className={`max-w-[70%] ${isOwn ? 'order-1' : 'order-2'}`}>
                                <div
                                  className={`p-3 rounded-lg ${
                                    isOwn
                                      ? 'bg-primary text-primary-foreground'
                                      : 'bg-gray-100 dark:bg-gray-800'
                                  }`}
                                >
                                  <p className="text-sm">{message.content}</p>
                                  {message.attachments && message.attachments.length > 0 && (
                                    <div className="mt-2 space-y-1">
                                      {message.attachments.map((attachment, index) => (
                                        <div key={index} className="flex items-center gap-2 text-xs">
                                          <Paperclip className="h-3 w-3" />
                                          <span className="truncate">{attachment}</span>
                                        </div>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <p className={`text-xs text-gray-500 mt-1 ${isOwn ? 'text-right' : 'text-left'}`}>
                                  {format(new Date(message.sentAt), 'h:mm a')}
                                </p>
                              </div>
                              {!isOwn && (
                                <Avatar className="w-8 h-8 order-1 mr-2">
                                  <AvatarImage src={message.sender.profileImage} />
                                  <AvatarFallback className="text-xs">
                                    {message.sender.firstName[0]}{message.sender.lastName[0]}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                            </div>
                          );
                        })
                      ) : (
                        <div className="text-center py-8">
                          <p className="text-gray-500">No messages yet. Start the conversation!</p>
                        </div>
                      )}
                      <div ref={messagesEndRef} />
                    </div>
                  </ScrollArea>

                  {/* Message Input */}
                  <div className="border-t p-4">
                    <div className="flex items-end gap-2">
                      <Button size="sm" variant="outline">
                        <Paperclip className="h-4 w-4" />
                      </Button>
                      <div className="flex-1">
                        <Textarea
                          placeholder="Type your message..."
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          onKeyPress={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage();
                            }
                          }}
                          rows={1}
                          className="resize-none"
                        />
                      </div>
                      <Button size="sm" variant="outline">
                        <Smile className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={handleSendMessage}
                        disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      >
                        <Send className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </>
            ) : (
              <CardContent className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                    Select a conversation
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300">
                    Choose a conversation from the sidebar to start messaging
                  </p>
                </div>
              </CardContent>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}