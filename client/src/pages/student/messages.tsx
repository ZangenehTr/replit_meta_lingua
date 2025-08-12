import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  MessageCircle,
  Search,
  Send,
  Paperclip,
  Image,
  Smile,
  MoreVertical,
  Phone,
  Video,
  Info,
  ChevronLeft,
  Circle,
  Check,
  CheckCheck,
  Clock,
  Star,
  Archive,
  Trash,
  Bell,
  BellOff
} from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: number;
  conversationId: number;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  senderRole: string;
  content: string;
  timestamp: string;
  isRead: boolean;
  attachments?: string[];
}

interface Conversation {
  id: number;
  participantName: string;
  participantRole: string;
  participantAvatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  isOnline: boolean;
  isPinned: boolean;
  isMuted: boolean;
}

export default function StudentMessages() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversations
  const { data: conversations = [], isLoading: conversationsLoading } = useQuery<Conversation[]>({
    queryKey: ['/api/student/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/student/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: messagesLoading } = useQuery<Message[]>({
    queryKey: selectedConversation ? [`/api/student/conversations/${selectedConversation.id}/messages`] : [],
    queryFn: async () => {
      if (!selectedConversation) return [];
      const response = await fetch(`/api/student/conversations/${selectedConversation.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!selectedConversation
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async ({ conversationId, content }: { conversationId: number; content: string }) => {
      const response = await fetch(`/api/student/conversations/${conversationId}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ content })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ 
        queryKey: [`/api/student/conversations/${selectedConversation?.id}/messages`] 
      });
      queryClient.invalidateQueries({ queryKey: ['/api/student/conversations'] });
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: t('common:error', 'Error'),
        description: t('student:sendError', 'Failed to send message'),
        variant: 'destructive'
      });
    }
  });

  // Scroll to bottom of messages
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Filter conversations
  const filteredConversations = conversations.filter(conv =>
    conv.participantName.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Sort conversations (pinned first, then by last message time)
  const sortedConversations = [...filteredConversations].sort((a, b) => {
    if (a.isPinned && !b.isPinned) return -1;
    if (!a.isPinned && b.isPinned) return 1;
    return new Date(b.lastMessageTime).getTime() - new Date(a.lastMessageTime).getTime();
  });

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('student:yesterday', 'Yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const handleSendMessage = () => {
    if (messageText.trim() && selectedConversation) {
      sendMessageMutation.mutate({
        conversationId: selectedConversation.id,
        content: messageText.trim()
      });
    }
  };

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 h-screen flex flex-col">
        {!selectedConversation ? (
          // Conversations List View
          <>
            {/* Mobile Header */}
            <motion.header 
              className="mobile-header"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5 }}
            >
              <div className="flex items-center justify-between mb-4">
                <h1 className="text-white font-bold text-xl">{t('student:messages', 'Messages')}</h1>
                <Badge className="bg-white/20 text-white border-white/30">
                  {conversations.reduce((sum, conv) => sum + conv.unreadCount, 0)} {t('student:unread', 'unread')}
                </Badge>
              </div>

              {/* Search Bar */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-white/50" />
                <input
                  type="text"
                  placeholder={t('student:searchMessages', 'Search messages...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-white/10 backdrop-blur rounded-xl text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
              </div>
            </motion.header>

            {/* Conversations List */}
            <div className="mobile-content flex-1 overflow-y-auto pb-20">
              {conversationsLoading ? (
                // Loading Skeleton
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((i) => (
                    <div key={i} className="glass-card p-4">
                      <div className="flex items-center gap-3">
                        <div className="skeleton w-12 h-12 rounded-full" />
                        <div className="flex-1">
                          <div className="skeleton h-4 w-24 mb-2 rounded" />
                          <div className="skeleton h-3 w-32 rounded" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : sortedConversations.length === 0 ? (
                <motion.div 
                  className="glass-card p-8 text-center"
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.3 }}
                >
                  <MessageCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
                  <p className="text-white/70">{t('student:noMessages', 'No messages yet')}</p>
                </motion.div>
              ) : (
                <div className="space-y-3">
                  {sortedConversations.map((conversation, index) => (
                    <motion.div
                      key={conversation.id}
                      className="glass-card p-4 cursor-pointer"
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.3, delay: index * 0.05 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={() => setSelectedConversation(conversation)}
                    >
                      <div className="flex items-center gap-3">
                        <div className="relative">
                          <Avatar className="w-12 h-12 border-2 border-white/20">
                            <AvatarImage src={conversation.participantAvatar} />
                            <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                              {conversation.participantName[0]}
                            </AvatarFallback>
                          </Avatar>
                          {conversation.isOnline && (
                            <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-400 rounded-full border-2 border-white" />
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between mb-1">
                            <h3 className="text-white font-semibold truncate">
                              {conversation.participantName}
                            </h3>
                            <span className="text-white/50 text-xs">
                              {formatTime(conversation.lastMessageTime)}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <p className="text-white/70 text-sm truncate flex-1">
                              {conversation.lastMessage}
                            </p>
                            {conversation.unreadCount > 0 && (
                              <Badge className="bg-purple-500 text-white text-xs px-1.5 py-0.5 min-w-[20px] text-center">
                                {conversation.unreadCount}
                              </Badge>
                            )}
                          </div>
                        </div>

                        {conversation.isPinned && (
                          <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          </>
        ) : (
          // Chat View
          <>
            {/* Chat Header */}
            <motion.header 
              className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-4 py-3"
              initial={{ y: -100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.3 }}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConversation(null)}
                    className="p-2 rounded-full hover:bg-white/10"
                  >
                    <ChevronLeft className="w-5 h-5 text-white" />
                  </button>
                  
                  <Avatar className="w-10 h-10 border-2 border-white/20">
                    <AvatarImage src={selectedConversation.participantAvatar} />
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                      {selectedConversation.participantName[0]}
                    </AvatarFallback>
                  </Avatar>
                  
                  <div>
                    <h2 className="text-white font-semibold">
                      {selectedConversation.participantName}
                    </h2>
                    <p className="text-white/60 text-xs">
                      {selectedConversation.isOnline ? t('student:online', 'Online') : t('student:offline', 'Offline')}
                    </p>
                  </div>
                </div>
                
                <div className="flex gap-2">
                  <button className="p-2 rounded-full hover:bg-white/10">
                    <Phone className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-white/10">
                    <Video className="w-5 h-5 text-white" />
                  </button>
                  <button className="p-2 rounded-full hover:bg-white/10">
                    <MoreVertical className="w-5 h-5 text-white" />
                  </button>
                </div>
              </div>
            </motion.header>

            {/* Messages Area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center py-8">
                  <div className="skeleton w-8 h-8 rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((message, index) => {
                  const isOwnMessage = message.senderId === user?.id;
                  return (
                    <motion.div
                      key={message.id}
                      className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'}`}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                    >
                      <div className={`max-w-[70%] ${isOwnMessage ? 'order-2' : 'order-1'}`}>
                        <div
                          className={`p-3 rounded-2xl ${
                            isOwnMessage
                              ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white'
                              : 'bg-white/90 text-gray-800'
                          }`}
                        >
                          <p className="text-sm">{message.content}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${
                          isOwnMessage ? 'justify-end' : 'justify-start'
                        }`}>
                          <span className="text-white/50 text-xs">
                            {formatTime(message.timestamp)}
                          </span>
                          {isOwnMessage && (
                            message.isRead ? (
                              <CheckCheck className="w-3 h-3 text-blue-300" />
                            ) : (
                              <Check className="w-3 h-3 text-white/50" />
                            )
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Message Input */}
            <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
              <div className="flex items-center gap-2">
                <button className="p-2 rounded-full hover:bg-white/10">
                  <Paperclip className="w-5 h-5 text-white/70" />
                </button>
                <button className="p-2 rounded-full hover:bg-white/10">
                  <Image className="w-5 h-5 text-white/70" />
                </button>
                
                <input
                  type="text"
                  placeholder={t('student:typeMessage', 'Type a message...')}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                  className="flex-1 px-4 py-2 bg-white/10 backdrop-blur rounded-full text-white placeholder-white/50 border border-white/20 focus:outline-none focus:border-white/40"
                />
                
                <motion.button
                  className="p-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-600 text-white"
                  whileTap={{ scale: 0.95 }}
                  onClick={handleSendMessage}
                  disabled={!messageText.trim() || sendMessageMutation.isPending}
                >
                  <Send className="w-5 h-5" />
                </motion.button>
              </div>
            </div>
          </>
        )}

        {/* Mobile Bottom Navigation (only show when not in chat) */}
        {!selectedConversation && <MobileBottomNav />}
      </div>
    </div>
  );
}