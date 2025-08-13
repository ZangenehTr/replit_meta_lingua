import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  MessageCircle,
  Send,
  Search,
  Plus,
  Paperclip,
  Image,
  Mic,
  MoreVertical,
  Check,
  CheckCheck,
  Clock,
  Users,
  User,
  Hash,
  Bell,
  BellOff
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Message {
  id: number;
  text: string;
  senderId: number;
  senderName: string;
  senderAvatar?: string;
  timestamp: string;
  read: boolean;
  type: 'text' | 'image' | 'file' | 'voice';
  attachmentUrl?: string;
}

interface Conversation {
  id: number;
  name: string;
  avatar?: string;
  lastMessage: string;
  lastMessageTime: string;
  unreadCount: number;
  type: 'individual' | 'group' | 'announcement';
  participants?: number;
  muted?: boolean;
  online?: boolean;
}

export default function StudentMessagesMobile() {
  const { t } = useTranslation();
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);
  const [showNewConversation, setShowNewConversation] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  
  // Get current user
  const { data: currentUser } = useQuery({
    queryKey: ['/api/users/me'],
    enabled: false // We'll use cached data
  });

  // Fetch conversations
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/student/conversations'],
    queryFn: async () => {
      const response = await fetch('/api/student/conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/student/messages', selectedConversation?.id],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const response = await fetch(`/api/student/conversations/${selectedConversation?.id}/messages`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch messages');
      return response.json();
    }
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch(`/api/student/conversations/${selectedConversation?.id}/messages`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ text })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['/api/student/messages', selectedConversation?.id] });
      scrollToBottom();
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:messageSendError'),
        variant: 'destructive'
      });
    }
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return t('common:yesterday');
    } else if (diffDays < 7) {
      return date.toLocaleDateString('fa-IR', { weekday: 'short' });
    } else {
      return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
    }
  };

  const getConversationIcon = (type: string) => {
    switch (type) {
      case 'group': return <Users className="w-4 h-4" />;
      case 'announcement': return <Hash className="w-4 h-4" />;
      default: return <User className="w-4 h-4" />;
    }
  };

  const filteredConversations = conversations.filter(conv =>
    conv.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    conv.lastMessage.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <MobileLayout
      title={selectedConversation ? selectedConversation.name : t('student:messages')}
      showBack={!!selectedConversation}
      gradient="primary"
      headerAction={selectedConversation && (
        <button className="p-2 rounded-full glass-button">
          <MoreVertical className="w-5 h-5 text-white" />
        </button>
      )}
    >
      {!selectedConversation ? (
        <>
          {/* Search Bar */}
          <motion.div 
            className="mb-4"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
          >
            <div className="glass-card p-3 flex items-center gap-3">
              <Search className="w-5 h-5 text-white/50" />
              <input
                type="text"
                placeholder={t('student:searchMessages')}
                className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </motion.div>

          {/* Conversations List */}
          {loadingConversations ? (
            <div className="space-y-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="glass-card p-4 animate-pulse">
                  <div className="flex gap-3">
                    <div className="w-12 h-12 rounded-full bg-white/20" />
                    <div className="flex-1">
                      <div className="h-4 bg-white/20 rounded w-3/4 mb-2" />
                      <div className="h-3 bg-white/20 rounded w-1/2" />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : filteredConversations.length === 0 ? (
            <MobileCard className="text-center py-12">
              <MessageCircle className="w-16 h-16 text-white/50 mx-auto mb-4" />
              <p className="text-white/70">{t('student:noMessages')}</p>
            </MobileCard>
          ) : (
            <div className="space-y-3">
              {filteredConversations.map((conversation, index) => (
                <motion.div
                  key={conversation.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  onClick={() => setSelectedConversation(conversation)}
                >
                  <MobileCard className="flex items-center gap-3 relative">
                    {/* Avatar */}
                    <div className="relative">
                      <Avatar className="w-12 h-12 border-2 border-white/20">
                        <AvatarImage src={conversation.avatar} />
                        <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 text-white">
                          {conversation.name[0]}
                        </AvatarFallback>
                      </Avatar>
                      {conversation.online && (
                        <div className="absolute bottom-0 right-0 w-3 h-3 bg-green-500 border-2 border-white rounded-full" />
                      )}
                      {conversation.type !== 'individual' && (
                        <div className="absolute -bottom-1 -right-1 p-1 bg-white/20 rounded-full">
                          {getConversationIcon(conversation.type)}
                        </div>
                      )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between items-start mb-1">
                        <h3 className="text-white font-semibold truncate">
                          {conversation.name}
                        </h3>
                        <span className="text-white/50 text-xs">
                          {formatTime(conversation.lastMessageTime)}
                        </span>
                      </div>
                      <p className="text-white/70 text-sm truncate">
                        {conversation.lastMessage}
                      </p>
                    </div>

                    {/* Badges */}
                    <div className="flex flex-col gap-1 items-end">
                      {conversation.unreadCount > 0 && (
                        <Badge className="bg-purple-500 text-white border-0 px-2 py-0.5 text-xs">
                          {conversation.unreadCount}
                        </Badge>
                      )}
                      {conversation.muted && (
                        <BellOff className="w-4 h-4 text-white/30" />
                      )}
                    </div>
                  </MobileCard>
                </motion.div>
              ))}
            </div>
          )}

          {/* Floating Action Button */}
          <motion.button
            className="fixed bottom-24 right-6 w-14 h-14 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full shadow-lg flex items-center justify-center"
            whileTap={{ scale: 0.9 }}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: "spring", stiffness: 260, damping: 20, delay: 0.3 }}
            onClick={() => setShowNewConversation(true)}
          >
            <Plus className="w-6 h-6 text-white" />
          </motion.button>
          
          {/* New Conversation Dialog */}
          {showNewConversation && (
            <motion.div
              className="fixed inset-0 bg-black/50 flex items-end justify-center z-50"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              onClick={() => setShowNewConversation(false)}
            >
              <motion.div
                className="bg-white dark:bg-gray-800 rounded-t-3xl w-full max-w-lg p-6"
                initial={{ y: 100 }}
                animate={{ y: 0 }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="text-xl font-bold mb-4">{t('student:newConversation')}</h3>
                <div className="space-y-4">
                  <button 
                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-left flex items-center gap-3"
                    onClick={() => {
                      // Mock: Create conversation with teacher
                      toast({
                        title: t('student:conversationStarted'),
                        description: t('student:teacherWillRespond')
                      });
                      setShowNewConversation(false);
                    }}
                  >
                    <User className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">{t('student:contactTeacher')}</p>
                      <p className="text-sm text-gray-500">{t('student:askQuestions')}</p>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-left flex items-center gap-3"
                    onClick={() => {
                      toast({
                        title: t('student:groupCreated'),
                        description: t('student:inviteClassmates')
                      });
                      setShowNewConversation(false);
                    }}
                  >
                    <Users className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">{t('student:createGroup')}</p>
                      <p className="text-sm text-gray-500">{t('student:studyTogether')}</p>
                    </div>
                  </button>
                  
                  <button 
                    className="w-full p-4 rounded-xl bg-gray-100 dark:bg-gray-700 text-left flex items-center gap-3"
                    onClick={() => {
                      toast({
                        title: t('student:supportContacted'),
                        description: t('student:supportWillRespond')
                      });
                      setShowNewConversation(false);
                    }}
                  >
                    <MessageCircle className="w-5 h-5" />
                    <div>
                      <p className="font-semibold">{t('student:contactSupport')}</p>
                      <p className="text-sm text-gray-500">{t('student:getHelp')}</p>
                    </div>
                  </button>
                </div>
                
                <button 
                  className="mt-6 w-full p-3 rounded-xl bg-gray-200 dark:bg-gray-600"
                  onClick={() => setShowNewConversation(false)}
                >
                  {t('common:cancel')}
                </button>
              </motion.div>
            </motion.div>
          )}
        </>
      ) : (
        /* Messages View */
        <div className="flex flex-col h-full">
          {/* Messages List */}
          <div className="flex-1 overflow-y-auto space-y-3 pb-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white" />
              </div>
            ) : (
              messages.map((message, index) => {
                const isOwn = message.senderName === "You" || message.senderId === currentUser?.id; // Check if message is from current user
                return (
                  <motion.div
                    key={message.id}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
                  >
                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                      {!isOwn && (
                        <span className="text-white/50 text-xs px-2">
                          {message.senderName}
                        </span>
                      )}
                      <div className={`
                        px-4 py-2 rounded-2xl
                        ${isOwn 
                          ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                          : 'glass-card text-white'}
                      `}>
                        <p className="text-sm">{message.text}</p>
                      </div>
                      <div className="flex items-center gap-1 px-2">
                        <span className="text-white/40 text-xs">
                          {formatTime(message.timestamp)}
                        </span>
                        {isOwn && (
                          message.read ? (
                            <CheckCheck className="w-3 h-3 text-blue-400" />
                          ) : (
                            <Check className="w-3 h-3 text-white/40" />
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
          <div className="glass-card p-3 flex items-center gap-2">
            <button className="p-2 rounded-full bg-white/10 flex-shrink-0">
              <Paperclip className="w-5 h-5 text-white/70" />
            </button>
            <input
              type="text"
              placeholder={t('student:typeMessage')}
              className="flex-1 bg-transparent text-white placeholder-white/50 outline-none min-w-0"
              value={messageText}
              onChange={(e) => setMessageText(e.target.value)}
              onKeyPress={(e) => {
                if (e.key === 'Enter' && messageText.trim()) {
                  sendMessage.mutate(messageText);
                }
              }}
            />
            <div className="flex-shrink-0">
              {messageText.trim() ? (
                <motion.button
                  className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
                  whileTap={{ scale: 0.9 }}
                  onClick={() => sendMessage.mutate(messageText)}
                >
                  <Send className="w-5 h-5 text-white" />
                </motion.button>
              ) : (
                <button className="p-2 rounded-full bg-white/10">
                  <Mic className="w-5 h-5 text-white/70" />
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </MobileLayout>
  );
}