import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/hooks/use-auth';
import {
  MessageCircle, Send, Search, Plus, Paperclip, Mic, MoreVertical,
  Check, CheckCheck, Clock, Users, User, Hash, Bell, BellOff,
  Video, Phone, X, ArrowRight, ArrowLeft, ChevronRight
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/hooks/use-toast';

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
  courseId?: number;
}

export default function StudentMessagesMobile() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  const isRTL = ['fa', 'ar'].includes(i18n.language);
  const [selectedConversation, setSelectedConversation] = useState<Conversation | null>(null);
  const [messageText, setMessageText] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch class groups / conversations - tries student endpoint first, falls back to general messages
  const { data: conversations = [], isLoading: loadingConversations } = useQuery<Conversation[]>({
    queryKey: ['/api/student/class-groups'],
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // Try the class groups endpoint first
      const res = await fetch('/api/student/class-groups', { headers });
      if (res.ok) return res.json();

      // Fallback: fetch conversations from general endpoint
      const fallback = await fetch('/api/messages', { headers });
      if (fallback.ok) {
        const msgs = await fallback.json();
        // Deduplicate by partner/sender
        const map = new Map<number, Conversation>();
        for (const msg of msgs) {
          const otherId = msg.senderId === user?.id ? msg.recipientId : msg.senderId;
          if (!map.has(otherId)) {
            map.set(otherId, {
              id: otherId,
              name: msg.senderId === user?.id ? (msg.recipientName || 'کاربر') : (msg.senderName || 'کاربر'),
              lastMessage: msg.content || msg.text || '',
              lastMessageTime: msg.createdAt || msg.timestamp || '',
              unreadCount: msg.read ? 0 : 1,
              type: 'individual',
              online: false,
            });
          }
        }
        return Array.from(map.values());
      }
      return [];
    }
  });

  // Fetch messages for selected conversation
  const { data: messages = [], isLoading: loadingMessages } = useQuery<Message[]>({
    queryKey: ['/api/student/messages', selectedConversation?.id],
    enabled: !!selectedConversation,
    queryFn: async () => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = token ? { Authorization: `Bearer ${token}` } : {};

      // Try class group messages first
      const res = await fetch(`/api/student/conversations/${selectedConversation?.id}/messages`, { headers });
      if (res.ok) return res.json();

      // Fallback: fetch from general messages
      const fallback = await fetch(`/api/messages?partnerId=${selectedConversation?.id}`, { headers });
      if (fallback.ok) return fallback.json();
      return [];
    }
  });

  // Send message
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const token = localStorage.getItem('auth_token');
      const headers: Record<string, string> = {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {})
      };

      // Try class group message endpoint first
      const res = await fetch(`/api/student/conversations/${selectedConversation?.id}/messages`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ text })
      });
      if (res.ok) return res.json();

      // Fallback: post to general messages
      const fallback = await fetch('/api/messages', {
        method: 'POST',
        headers,
        body: JSON.stringify({ recipientId: selectedConversation?.id, content: text })
      });
      if (!fallback.ok) throw new Error('Failed to send message');
      return fallback.json();
    },
    onSuccess: () => {
      setMessageText('');
      queryClient.invalidateQueries({ queryKey: ['/api/student/messages', selectedConversation?.id] });
      scrollToBottom();
    },
    onError: () => {
      toast({ title: t('common:error'), description: t('student:messageSendError', 'خطا در ارسال پیام'), variant: 'destructive' });
    }
  });

  const scrollToBottom = () => {
    setTimeout(() => messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
  };

  useEffect(() => { scrollToBottom(); }, [messages]);

  const filteredConversations = conversations.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const formatTime = (dateStr: string) => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    if (diff < 60 * 60 * 1000) return `${Math.floor(diff / 60000)} دقیقه پیش`;
    if (diff < 24 * 60 * 60 * 1000) return date.toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
    return date.toLocaleDateString('fa-IR', { month: 'short', day: 'numeric' });
  };

  const formatMessageTime = (dateStr: string) => {
    if (!dateStr) return '';
    return new Date(dateStr).toLocaleTimeString('fa-IR', { hour: '2-digit', minute: '2-digit' });
  };

  // ─── Chat View ─────────────────────────────────────────────────────────────
  if (selectedConversation) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col" dir={isRTL ? 'rtl' : 'ltr'}>
        {/* Chat Header */}
        <div className="bg-white border-b border-gray-100 shadow-sm sticky top-0 z-20 px-4 py-3 flex items-center gap-3">
          <button
            onClick={() => setSelectedConversation(null)}
            className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0"
          >
            {isRTL ? <ChevronRight className="w-5 h-5 text-gray-600" /> : <ArrowLeft className="w-5 h-5 text-gray-600" />}
          </button>
          <div className="relative flex-shrink-0">
            <Avatar className="w-10 h-10">
              {selectedConversation.avatar && <AvatarImage src={selectedConversation.avatar} />}
              <AvatarFallback className="bg-indigo-100 text-indigo-700 font-bold text-sm">
                {selectedConversation.name[0]}
              </AvatarFallback>
            </Avatar>
            {selectedConversation.online && (
              <div className="absolute bottom-0 end-0 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-gray-900 text-sm truncate">{selectedConversation.name}</p>
            <p className="text-xs text-gray-500">
              {selectedConversation.online ? 'آنلاین' : selectedConversation.type === 'group' ? `${selectedConversation.participants} عضو` : 'آفلاین'}
            </p>
          </div>
          <div className="flex gap-1">
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Phone className="w-4 h-4 text-gray-600" />
            </button>
            <button className="w-9 h-9 rounded-full bg-gray-100 flex items-center justify-center">
              <Video className="w-4 h-4 text-gray-600" />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {loadingMessages ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className={`flex ${i % 2 === 0 ? 'justify-end' : 'justify-start'}`}>
                  <div className={`h-10 rounded-2xl animate-pulse bg-gray-200 ${i % 2 === 0 ? 'w-48' : 'w-40'}`} />
                </div>
              ))}
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 rounded-full bg-indigo-50 flex items-center justify-center mb-3">
                <MessageCircle className="w-8 h-8 text-indigo-300" />
              </div>
              <p className="text-sm text-gray-500">هنوز پیامی ارسال نشده</p>
            </div>
          ) : (
            messages.map((msg, index) => {
              const isOwn = msg.senderId === user?.id;
              return (
                <motion.div
                  key={msg.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.15, delay: index * 0.02 }}
                  className={`flex ${isOwn ? 'justify-end' : 'justify-start'} items-end gap-2`}
                >
                  {!isOwn && (
                    <Avatar className="w-7 h-7 flex-shrink-0">
                      <AvatarFallback className="bg-gray-100 text-gray-600 text-xs">{msg.senderName?.[0]}</AvatarFallback>
                    </Avatar>
                  )}
                  <div className={`max-w-[72%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col gap-0.5`}>
                    {!isOwn && (
                      <span className="text-xs text-gray-500 px-1">{msg.senderName}</span>
                    )}
                    <div className={`px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                      isOwn
                        ? 'bg-indigo-600 text-white rounded-br-md'
                        : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                    }`}>
                      {msg.text}
                    </div>
                    <div className={`flex items-center gap-1 px-1 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                      <span className="text-xs text-gray-400">{formatMessageTime(msg.timestamp)}</span>
                      {isOwn && (
                        msg.read
                          ? <CheckCheck className="w-3.5 h-3.5 text-indigo-500" />
                          : <Check className="w-3.5 h-3.5 text-gray-400" />
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="bg-white border-t border-gray-100 px-4 py-3 sticky bottom-0">
          <div className="flex items-end gap-2">
            <div className="flex-1 bg-gray-100 rounded-2xl flex items-end px-4 py-2.5 gap-2 min-h-[44px]">
              <textarea
                className="flex-1 bg-transparent text-sm text-gray-800 placeholder-gray-400 resize-none focus:outline-none max-h-32"
                placeholder="پیام بنویسید..."
                rows={1}
                value={messageText}
                onChange={e => setMessageText(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (messageText.trim()) sendMessage.mutate(messageText.trim());
                  }
                }}
              />
              <button className="flex-shrink-0">
                <Paperclip className="w-5 h-5 text-gray-400 hover:text-gray-600" />
              </button>
            </div>
            <button
              onClick={() => { if (messageText.trim()) sendMessage.mutate(messageText.trim()); }}
              disabled={!messageText.trim() || sendMessage.isPending}
              className={`w-11 h-11 rounded-full flex items-center justify-center flex-shrink-0 transition-all ${
                messageText.trim()
                  ? 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200'
                  : 'bg-gray-200 text-gray-400'
              }`}
            >
              {sendMessage.isPending
                ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                : <Send className={`w-4 h-4 ${isRTL ? 'scale-x-[-1]' : ''}`} />
              }
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── Conversations List ─────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="bg-white border-b border-gray-100 sticky top-0 z-20 shadow-sm">
        <div className="px-4 pt-4 pb-3">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h1 className="text-xl font-bold text-gray-900">{t('student:messages.title', 'پیام‌ها')}</h1>
              {conversations.length > 0 && (
                <p className="text-xs text-gray-500">{conversations.filter(c => c.unreadCount > 0).length} خوانده‌نشده</p>
              )}
            </div>
            <button className="w-10 h-10 rounded-xl bg-indigo-50 flex items-center justify-center">
              <Plus className="w-5 h-5 text-indigo-600" />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className={`absolute ${isRTL ? 'right-3' : 'left-3'} top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400`} />
            <input
              type="text"
              placeholder={t('student:messages.search', 'جستجو در پیام‌ها...')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className={`w-full ${isRTL ? 'pr-10 pl-4' : 'pl-10 pr-4'} py-2.5 bg-gray-100 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500/30 transition-all`}
            />
          </div>
        </div>
      </div>

      <div className="pb-24">
        {loadingConversations ? (
          <div className="space-y-px">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white px-4 py-4 flex items-center gap-3 animate-pulse">
                <div className="w-12 h-12 rounded-full bg-gray-200 flex-shrink-0" />
                <div className="flex-1">
                  <div className="h-4 bg-gray-200 rounded w-1/3 mb-1.5" />
                  <div className="h-3 bg-gray-200 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : filteredConversations.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-center px-8">
            <div className="w-20 h-20 rounded-full bg-indigo-50 flex items-center justify-center mb-4">
              <MessageCircle className="w-10 h-10 text-indigo-300" />
            </div>
            <h3 className="text-lg font-semibold text-gray-700 mb-1">{t('student:messages.empty', 'پیامی وجود ندارد')}</h3>
            <p className="text-sm text-gray-400">
              {searchQuery ? 'نتیجه‌ای یافت نشد' : 'وقتی کلاسی ثبت‌نام کنید، گروه‌های درسی اینجا نشان داده می‌شوند'}
            </p>
          </div>
        ) : (
          <div>
            {filteredConversations.map((conv, index) => (
              <motion.button
                key={conv.id}
                initial={{ opacity: 0, x: isRTL ? 16 : -16 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.2, delay: index * 0.04 }}
                className="w-full bg-white border-b border-gray-50 px-4 py-4 flex items-center gap-3 hover:bg-gray-50 active:bg-gray-100 transition-colors text-start"
                onClick={() => setSelectedConversation(conv)}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <Avatar className="w-12 h-12">
                    {conv.avatar && <AvatarImage src={conv.avatar} />}
                    <AvatarFallback className={`font-bold text-sm ${
                      conv.type === 'group'
                        ? 'bg-violet-100 text-violet-700'
                        : conv.type === 'announcement'
                        ? 'bg-amber-100 text-amber-700'
                        : 'bg-indigo-100 text-indigo-700'
                    }`}>
                      {conv.type === 'group' ? <Users className="w-5 h-5" /> : conv.name[0]}
                    </AvatarFallback>
                  </Avatar>
                  {conv.online && (
                    <div className="absolute bottom-0 end-0 w-3.5 h-3.5 bg-emerald-500 rounded-full border-2 border-white" />
                  )}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between gap-2 mb-0.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span className={`font-semibold text-sm truncate ${conv.unreadCount > 0 ? 'text-gray-900' : 'text-gray-700'}`}>
                        {conv.name}
                      </span>
                      {conv.type === 'announcement' && (
                        <span className="text-xs bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-full flex-shrink-0">اطلاعیه</span>
                      )}
                    </div>
                    <span className={`text-xs flex-shrink-0 ${conv.unreadCount > 0 ? 'text-indigo-600 font-medium' : 'text-gray-400'}`}>
                      {formatTime(conv.lastMessageTime)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between gap-2">
                    <p className={`text-xs truncate ${conv.unreadCount > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'}`}>
                      {conv.muted && <BellOff className="w-3 h-3 inline me-1 text-gray-400" />}
                      {conv.lastMessage || 'پیامی وجود ندارد'}
                    </p>
                    {conv.unreadCount > 0 && (
                      <span className="flex-shrink-0 min-w-[20px] h-5 bg-indigo-600 text-white text-xs font-bold rounded-full flex items-center justify-center px-1.5">
                        {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </motion.button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
