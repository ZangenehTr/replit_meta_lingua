import { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { useLanguage } from '@/hooks/use-language';
import { useSocket } from '@/hooks/use-socket';
import { useAuth } from '@/hooks/use-auth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageSquare,
  User,
  Mail,
  Phone,
  Clock,
  Filter,
  Search,
  Send,
  CheckCircle2,
  XCircle,
  Loader2,
  Zap,
  Bell,
  Volume2,
  VolumeX,
} from 'lucide-react';
import type { VisitorChatSession, VisitorChatMessage } from '@shared/schema';
import { format } from 'date-fns';

// Canned responses
const cannedResponses = {
  greeting: [
    { key: '/hello', message: 'سلام! چطور می‌تونم کمکتون کنم؟' },
    { key: '/welcome', message: 'به Meta Lingua خوش آمدید! چگونه می‌تونم بهتون کمک کنم؟' },
    { key: '/hi', message: 'درود! چه سوالی دارید؟' },
  ],
  faq: [
    { key: '/courses', message: 'ما دوره‌های متنوعی در زبان‌های انگلیسی، فارسی و عربی ارائه می‌دهیم. برای اطلاعات بیشتر به صفحه دوره‌ها مراجعه کنید.' },
    { key: '/pricing', message: 'قیمت دوره‌ها بسته به نوع و مدت دوره متفاوت است. برای مشاوره رایگان با ما تماس بگیرید.' },
    { key: '/placement', message: 'می‌توانید تست سطح‌یابی رایگان ما را از صفحه اصلی تکمیل کنید تا سطح زبان شما مشخص شود.' },
    { key: '/schedule', message: 'زمان‌های کلاس‌ها بسته به دوره متفاوت است. بعد از ثبت‌نام، می‌توانید زمان مناسب خود را انتخاب کنید.' },
  ],
  general: [
    { key: '/wait', message: 'لطفاً چند لحظه صبر کنید، در حال بررسی اطلاعات هستم...' },
    { key: '/thanks', message: 'از شما سپاسگزاریم! اگر سوال دیگری داشتید، در خدمتیم.' },
    { key: '/contact', message: 'برای تماس مستقیم می‌توانید با شماره 021-12345678 تماس بگیرید یا به info@metalingua.ir ایمیل بزنید.' },
  ],
};

export default function AdminVisitorChatPage() {
  const { t } = useTranslation(['admin', 'common']);
  const { isRTL } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const { socket, isConnected } = useSocket();
  const queryClient = useQueryClient();
  
  const [selectedSession, setSelectedSession] = useState<VisitorChatSession | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'with_contact' | 'no_contact'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [newMessage, setNewMessage] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [visitorTyping, setVisitorTyping] = useState(false);
  const [isSoundEnabled, setIsSoundEnabled] = useState(true);
  const [showCannedResponses, setShowCannedResponses] = useState(false);
  const [unreadSessions, setUnreadSessions] = useState<Set<number>>(new Set());
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const messageInputRef = useRef<HTMLTextAreaElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize notification sound
  useEffect(() => {
    audioRef.current = new Audio('/notification.mp3');
  }, []);

  // Fetch all visitor chat sessions
  const { data: sessions = [], isLoading } = useQuery<VisitorChatSession[]>({
    queryKey: ['/api/visitor-chat/sessions/all'],
  });

  // Fetch messages for selected session
  const { data: messagesData, refetch: refetchMessages } = useQuery<{ session: VisitorChatSession, messages: VisitorChatMessage[] }>({
    queryKey: ['/api/visitor-chat/sessions', selectedSession?.sessionId, 'messages'],
    enabled: !!selectedSession,
    refetchInterval: false, // Don't poll - we'll use WebSocket for real-time updates
  });

  const messages = messagesData?.messages || [];

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest(`/api/visitor-chat/sessions/${selectedSession!.sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: messageText,
          senderType: 'admin',
          senderName: user?.fullName || user?.email || 'Support',
          senderId: user?.id
        })
      });
      return response.json();
    },
    onSuccess: (newMsg) => {
      setNewMessage('');
      
      // Send via WebSocket for real-time delivery
      if (socket && selectedSession) {
        socket.emit('admin-send-message', {
          sessionId: selectedSession.sessionId,
          message: newMsg
        });
      }
      
      // Update local state
      queryClient.setQueryData(
        ['/api/visitor-chat/sessions', selectedSession?.sessionId, 'messages'],
        (old: any) => old ? { ...old, messages: [...old.messages, newMsg] } : old
      );
      
      scrollToBottom();
    },
    onError: (error) => {
      toast({
        title: t('common:error'),
        description: t('visitorChat.sendError', 'Failed to send message'),
        variant: 'destructive',
      });
    }
  });

  // WebSocket event handlers
  useEffect(() => {
    if (!socket || !isConnected) return;

    const handleNewMessage = (data: { sessionId: string, message: VisitorChatMessage }) => {
      const { sessionId, message } = data;
      
      // Update messages if this is the current session
      if (selectedSession?.sessionId === sessionId) {
        queryClient.setQueryData(
          ['/api/visitor-chat/sessions', sessionId, 'messages'],
          (old: any) => old ? { ...old, messages: [...old.messages, message] } : old
        );
        scrollToBottom();
      }
      
      // Play sound for visitor messages
      if (message.senderType === 'visitor' && isSoundEnabled && audioRef.current) {
        audioRef.current.play().catch(e => console.log('Audio play failed:', e));
      }
      
      // Mark session as unread
      if (message.senderType === 'visitor') {
        setUnreadSessions(prev => new Set([...prev, parseInt(sessionId)]));
      }
    };

    const handleVisitorTyping = (data: { sessionId: string, isTyping: boolean }) => {
      if (selectedSession?.sessionId === data.sessionId) {
        setVisitorTyping(data.isTyping);
      }
    };

    const handleVisitorChatActive = (data: { sessionId: string }) => {
      // Refresh sessions list when a visitor becomes active
      queryClient.invalidateQueries({ queryKey: ['/api/visitor-chat/sessions/all'] });
    };

    const handleVisitorChatNotification = (data: { sessionId: string, messagePreview: string }) => {
      if (selectedSession?.sessionId !== data.sessionId) {
        toast({
          title: t('visitorChat.newMessage', 'New Visitor Message'),
          description: data.messagePreview,
        });
      }
    };

    socket.on('new-chat-message', handleNewMessage);
    socket.on('visitor-typing-status', handleVisitorTyping);
    socket.on('visitor-chat-active', handleVisitorChatActive);
    socket.on('visitor-chat-notification', handleVisitorChatNotification);

    return () => {
      socket.off('new-chat-message', handleNewMessage);
      socket.off('visitor-typing-status', handleVisitorTyping);
      socket.off('visitor-chat-active', handleVisitorChatActive);
      socket.off('visitor-chat-notification', handleVisitorChatNotification);
    };
  }, [socket, isConnected, selectedSession, isSoundEnabled]);

  // Join admin chat session when selected
  useEffect(() => {
    if (socket && selectedSession && user) {
      socket.emit('admin-join-chat', {
        sessionId: selectedSession.sessionId,
        adminId: user.id
      });
      
      // Mark as read
      setUnreadSessions(prev => {
        const newSet = new Set(prev);
        newSet.delete(selectedSession.id);
        return newSet;
      });
    }
  }, [socket, selectedSession, user]);

  // Auto-scroll to bottom
  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !selectedSession) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('admin-typing', {
        sessionId: selectedSession.sessionId,
        adminName: user?.fullName || 'Support',
        isTyping: true
      });
    }
    
    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }
    
    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('admin-typing', {
        sessionId: selectedSession.sessionId,
        adminName: user?.fullName || 'Support',
        isTyping: false
      });
    }, 1000);
  };

  // Send message
  const sendMessage = () => {
    if (!newMessage.trim() || !selectedSession) return;
    sendMessageMutation.mutate(newMessage.trim());
  };

  // Insert canned response
  const insertCannedResponse = (response: string) => {
    setNewMessage(prev => prev + (prev ? ' ' : '') + response);
    setShowCannedResponses(false);
    messageInputRef.current?.focus();
  };

  // Filter sessions
  const filteredSessions = sessions.filter(session => {
    if (filterStatus === 'with_contact' && !session.visitorName && !session.visitorEmail && !session.visitorPhone) {
      return false;
    }
    if (filterStatus === 'no_contact' && (session.visitorName || session.visitorEmail || session.visitorPhone)) {
      return false;
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const nameMatch = session.visitorName?.toLowerCase().includes(query);
      const emailMatch = session.visitorEmail?.toLowerCase().includes(query);
      const phoneMatch = session.visitorPhone?.toLowerCase().includes(query);
      return nameMatch || emailMatch || phoneMatch;
    }

    return true;
  });

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'PPp');
    } catch {
      return dateString;
    }
  };

  return (
    <div className="p-6 max-w-full mx-auto space-y-6 h-[calc(100vh-100px)]" dir={isRTL ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <MessageSquare className="h-8 w-8 text-primary" />
            {t('visitorChat.title', 'Visitor Chat Support')}
          </h1>
          <p className="text-muted-foreground mt-1">
            {t('visitorChat.subtitle', 'Manage and respond to visitor inquiries in real-time')}
          </p>
        </div>
        <div className="flex gap-3">
          <Badge variant="outline" className="text-lg px-4 py-2">
            <Bell className="h-5 w-5 mr-2" />
            {unreadSessions.size} {t('visitorChat.unread', 'Unread')}
          </Badge>
          <Badge variant={isConnected ? 'default' : 'destructive'} className="text-lg px-4 py-2">
            <span className={`h-2 w-2 rounded-full mr-2 ${isConnected ? 'bg-green-500' : 'bg-red-500'} animate-pulse`} />
            {isConnected ? 'Online' : 'Offline'}
          </Badge>
          <Button
            variant={isSoundEnabled ? 'default' : 'outline'}
            size="icon"
            onClick={() => setIsSoundEnabled(!isSoundEnabled)}
            data-testid="button-toggle-sound"
          >
            {isSoundEnabled ? <Volume2 className="h-5 w-5" /> : <VolumeX className="h-5 w-5" />}
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Filter className="h-5 w-5" />
            {t('visitorChat.filters', 'Filters')}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label>{t('visitorChat.searchLabel', 'Search by name, email, or phone')}</Label>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  data-testid="input-search-sessions"
                  placeholder={t('visitorChat.searchPlaceholder', 'Search...')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div>
              <Label>{t('visitorChat.statusFilter', 'Status Filter')}</Label>
              <Select value={filterStatus} onValueChange={(v) => setFilterStatus(v as any)}>
                <SelectTrigger data-testid="select-filter-status">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">{t('visitorChat.filterAll', 'All Sessions')}</SelectItem>
                  <SelectItem value="with_contact">{t('visitorChat.filterWithContact', 'With Contact Info')}</SelectItem>
                  <SelectItem value="no_contact">{t('visitorChat.filterNoContact', 'Anonymous')}</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Main Chat Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[calc(100%-200px)]">
        {/* Sessions List */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <span>{t('visitorChat.sessionsList', 'Chat Sessions')}</span>
              <Badge variant="secondary">{filteredSessions.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <ScrollArea className="h-[600px]">
              <div className="space-y-2 p-4">
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Loader2 className="h-8 w-8 animate-spin mx-auto mb-2" />
                    {t('common.loading', 'Loading...')}
                  </div>
                ) : filteredSessions.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    {t('visitorChat.noSessions', 'No sessions found')}
                  </div>
                ) : (
                  filteredSessions.map((session) => {
                    const hasContact = !!(session.visitorName || session.visitorEmail || session.visitorPhone);
                    const isUnread = unreadSessions.has(session.id);

                    return (
                      <Card
                        key={session.id}
                        className={`cursor-pointer transition-all hover:shadow-md ${
                          selectedSession?.id === session.id ? 'ring-2 ring-primary shadow-lg' : ''
                        } ${isUnread ? 'bg-blue-50 dark:bg-blue-950' : ''}`}
                        onClick={() => setSelectedSession(session)}
                        data-testid={`card-session-${session.id}`}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between gap-3">
                            <div className="flex-1 space-y-2">
                              <div className="flex items-center gap-2">
                                {isUnread && (
                                  <span className="h-3 w-3 rounded-full bg-blue-600 animate-pulse" />
                                )}
                                {hasContact ? (
                                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                                ) : (
                                  <XCircle className="h-4 w-4 text-orange-600" />
                                )}
                                <span className="font-semibold">
                                  {session.visitorName || t('visitorChat.anonymous', 'Anonymous Visitor')}
                                </span>
                              </div>
                              
                              {session.visitorEmail && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Mail className="h-3 w-3" />
                                  {session.visitorEmail}
                                </div>
                              )}
                              
                              {session.visitorPhone && (
                                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                  <Phone className="h-3 w-3" />
                                  {session.visitorPhone}
                                </div>
                              )}
                              
                              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                <Clock className="h-3 w-3" />
                                {formatDate(session.createdAt)}
                              </div>
                            </div>
                            
                            <Badge variant={hasContact ? 'default' : 'secondary'}>
                              {hasContact ? 'Contact' : 'Anon'}
                            </Badge>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })
                )}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>

        {/* Chat Area */}
        <Card className="lg:col-span-2 flex flex-col">
          <CardHeader>
            <CardTitle className="flex items-center justify-between">
              <div>
                {selectedSession
                  ? selectedSession.visitorName || t('visitorChat.anonymous', 'Anonymous Visitor')
                  : t('visitorChat.selectSession', 'Select a session')}
              </div>
              {selectedSession && (
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowCannedResponses(!showCannedResponses)}
                    data-testid="button-toggle-canned-responses"
                  >
                    <Zap className="h-4 w-4 mr-1" />
                    {t('visitorChat.quickReplies', 'Quick Replies')}
                  </Button>
                </div>
              )}
            </CardTitle>
            {selectedSession && selectedSession.visitorEmail && (
              <CardDescription className="flex items-center gap-4">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {selectedSession.visitorEmail}
                </span>
                {selectedSession.visitorPhone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {selectedSession.visitorPhone}
                  </span>
                )}
              </CardDescription>
            )}
          </CardHeader>
          
          <Separator />
          
          <CardContent className="flex-1 flex flex-col p-0">
            {!selectedSession ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                <div className="text-center space-y-2">
                  <MessageSquare className="h-16 w-16 mx-auto opacity-30" />
                  <p className="text-lg">{t('visitorChat.selectSessionPrompt', 'Select a chat session to start messaging')}</p>
                </div>
              </div>
            ) : (
              <>
                {/* Canned Responses */}
                {showCannedResponses && (
                  <div className="p-4 bg-muted/50 border-b">
                    <div className="space-y-3">
                      {Object.entries(cannedResponses).map(([category, responses]) => (
                        <div key={category}>
                          <h4 className="text-sm font-semibold mb-2 capitalize">{t(`visitorChat.${category}`, category)}</h4>
                          <div className="flex flex-wrap gap-2">
                            {responses.map((response) => (
                              <Button
                                key={response.key}
                                variant="outline"
                                size="sm"
                                onClick={() => insertCannedResponse(response.message)}
                                data-testid={`button-canned-${response.key}`}
                              >
                                {response.key}
                              </Button>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Messages */}
                <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className="text-center py-8 text-muted-foreground">
                        {t('visitorChat.noMessages', 'No messages yet. Start the conversation!')}
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={message.id}
                          className={`flex ${message.senderType === 'admin' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                          data-testid={`message-${message.senderType}-${index}`}
                        >
                          <div
                            className={`max-w-[70%] rounded-lg p-3 shadow-sm ${
                              message.senderType === 'admin'
                                ? 'bg-primary text-primary-foreground'
                                : message.senderType === 'system'
                                ? 'bg-muted text-muted-foreground text-sm italic'
                                : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                            }`}
                          >
                            {message.senderType !== 'visitor' && message.senderType !== 'system' && (
                              <p className="text-xs font-semibold mb-1 opacity-80">
                                {message.senderName}
                              </p>
                            )}
                            <p className="text-sm whitespace-pre-wrap">{message.message}</p>
                            <p className={`text-xs mt-1 opacity-60`}>
                              {formatDate(message.createdAt)}
                            </p>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {/* Typing indicator */}
                    {visitorTyping && (
                      <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'}`}>
                        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-3 shadow-sm">
                          <div className="flex gap-1">
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="h-2 w-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                          </div>
                        </div>
                      </div>
                    )}
                    
                    <div ref={messagesEndRef} />
                  </div>
                </ScrollArea>

                {/* Message Input */}
                <div className="p-4 border-t bg-white dark:bg-gray-800">
                  <div className="flex gap-2">
                    <Textarea
                      ref={messageInputRef}
                      placeholder={t('visitorChat.messagePlaceholder', 'Type your message...')}
                      value={newMessage}
                      onChange={(e) => {
                        setNewMessage(e.target.value);
                        handleTyping();
                      }}
                      onKeyDown={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          sendMessage();
                        }
                      }}
                      className="flex-1 min-h-[60px] max-h-[120px]"
                      disabled={sendMessageMutation.isPending}
                      data-testid="textarea-admin-message"
                    />
                    <Button
                      onClick={sendMessage}
                      disabled={!newMessage.trim() || sendMessageMutation.isPending}
                      size="icon"
                      className="h-[60px] w-[60px]"
                      data-testid="button-send-admin-message"
                    >
                      {sendMessageMutation.isPending ? (
                        <Loader2 className="h-5 w-5 animate-spin" />
                      ) : (
                        <Send className={`h-5 w-5 ${isRTL ? 'scale-x-[-1]' : ''}`} />
                      )}
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    {t('visitorChat.enterToSend', 'Press Enter to send, Shift+Enter for new line')}
                  </p>
                </div>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
