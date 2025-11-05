import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Mail, Phone, Circle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: number;
  senderType: 'visitor' | 'admin' | 'system';
  senderName: string;
  message: string;
  createdAt: string;
}

interface ChatSession {
  id: number;
  sessionId: string;
  language: string;
  visitorName?: string;
  visitorEmail?: string;
  visitorPhone?: string;
}

export function VisitorChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [showContactForm, setShowContactForm] = useState(false);
  const [contactInfo, setContactInfo] = useState({
    name: '',
    email: '',
    phone: ''
  });
  const [socket, setSocket] = useState<Socket | null>(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  
  const { language } = useLanguage();
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRTL = ['fa', 'ar'].includes(language);

  // Initialize WebSocket connection
  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
      console.log('Visitor chat: Socket connected');
      // Request online admins count
      socketInstance.emit('get-online-admins');
    });

    socketInstance.on('online-admins-count', (data: { count: number }) => {
      setAdminOnline(data.count > 0);
    });

    socketInstance.on('admin-online', () => {
      setAdminOnline(true);
    });

    socketInstance.on('new-chat-message', (data: { message: Message }) => {
      setMessages(prev => [...prev, data.message]);
      scrollToBottom();
    });

    socketInstance.on('admin-typing-status', (data: { isTyping: boolean }) => {
      setAdminTyping(data.isTyping);
    });

    setSocket(socketInstance);

    return () => {
      socketInstance.disconnect();
    };
  }, []);

  // Join chat session when it's created
  useEffect(() => {
    if (socket && session) {
      socket.emit('visitor-join-chat', { sessionId: session.sessionId });
    }
  }, [socket, session]);

  // Scroll to bottom when messages change
  useEffect(() => {
    scrollToBottom();
  }, [messages, adminTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  // Initialize chat session
  useEffect(() => {
    const initSession = async () => {
      // Check if there's an existing session in localStorage
      const storedSessionId = localStorage.getItem('visitorChatSessionId');
      
      if (storedSessionId) {
        try {
          const response = await fetch(`/api/visitor-chat/sessions/${storedSessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSession(data.session);
            setMessages(data.messages || []);
            return;
          }
        } catch (error) {
          console.error('Error loading existing session:', error);
        }
      }

      // Create new session
      try {
        const response = await apiRequest(`/api/visitor-chat/sessions`, {
          method: 'POST',
          body: JSON.stringify({ language })
        });
        const newSession = await response.json();
        setSession(newSession);
        localStorage.setItem('visitorChatSessionId', newSession.sessionId);
        
        // Send welcome message
        setTimeout(() => {
          setMessages([{
            id: 0,
            senderType: 'admin',
            senderName: 'Support Team',
            message: t('common:visitorChat.welcomeMessage'),
            createdAt: new Date().toISOString()
          }]);
        }, 500);
      } catch (error) {
        console.error('Error creating chat session:', error);
      }
    };

    if (isOpen && !session) {
      initSession();
    }
  }, [isOpen, session, language, t]);

  // Handle typing indicator
  const handleTyping = () => {
    if (!socket || !session) return;
    
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('visitor-typing', {
        sessionId: session.sessionId,
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
      socket?.emit('visitor-typing', {
        sessionId: session.sessionId,
        isTyping: false
      });
    }, 1000);
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !session) return;

    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/visitor-chat/sessions/${session.sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: newMessage,
          senderType: 'visitor',
          senderName: session.visitorName || 'Visitor'
        })
      });

      const sentMessage = await response.json();
      
      // Send via WebSocket for real-time delivery
      if (socket) {
        socket.emit('visitor-send-message', {
          sessionId: session.sessionId,
          message: sentMessage
        });
      }
      
      // Add to local state
      setMessages(prev => [...prev, sentMessage]);
      setNewMessage('');

      // After sending 3 messages, suggest sharing contact info
      if (messages.filter(m => m.senderType === 'visitor').length === 2 && !session.visitorEmail) {
        setTimeout(() => {
          setMessages(prev => [...prev, {
            id: Date.now(),
            senderType: 'admin',
            senderName: 'Support Team',
            message: t('common:visitorChat.contactSuggestion'),
            createdAt: new Date().toISOString()
          }]);
          setShowContactForm(true);
        }, 1000);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveContactInfo = async () => {
    if (!session) return;

    try {
      await apiRequest(`/api/visitor-chat/sessions/${session.sessionId}/contact`, {
        method: 'PATCH',
        body: JSON.stringify({
          visitorName: contactInfo.name,
          visitorEmail: contactInfo.email,
          visitorPhone: contactInfo.phone
        })
      });

      setSession(prev => prev ? {
        ...prev,
        visitorName: contactInfo.name,
        visitorEmail: contactInfo.email,
        visitorPhone: contactInfo.phone
      } : null);

      setShowContactForm(false);
      setMessages(prev => [...prev, {
        id: Date.now(),
        senderType: 'admin',
        senderName: 'Support Team',
        message: t('common:visitorChat.thankYouForContact'),
        createdAt: new Date().toISOString()
      }]);
    } catch (error) {
      console.error('Error saving contact info:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  return (
    <>
      {/* Chat Button */}
      <Button
        onClick={() => setIsOpen(!isOpen)}
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 h-16 w-16 rounded-full shadow-2xl transition-all hover:scale-110 hover:shadow-xl ${adminOnline ? 'ring-4 ring-green-500 ring-opacity-50' : ''}`}
        size="icon"
        data-testid="button-visitor-chat-toggle"
      >
        {isOpen ? (
          <X className="h-7 w-7" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-7 w-7" />
            {adminOnline && (
              <span className="absolute -top-1 -right-1 h-4 w-4 bg-green-500 rounded-full border-2 border-white animate-pulse" />
            )}
          </div>
        )}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 ${isRTL ? 'left-6' : 'right-6'} z-50 w-[400px] max-w-[calc(100vw-3rem)] h-[600px] bg-white dark:bg-gray-800 rounded-2xl shadow-2xl flex flex-col overflow-hidden border-2 border-primary/20`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-gradient-to-r from-primary to-primary/80 text-primary-foreground p-4 flex items-center justify-between shadow-lg">
            <div className="flex items-center gap-3">
              <div className="relative">
                <MessageCircle className="h-6 w-6" />
                {adminOnline && (
                  <span className="absolute -bottom-1 -right-1 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
                )}
              </div>
              <div>
                <h3 className="font-bold text-lg">{t('common:visitorChat.title')}</h3>
                <p className="text-xs opacity-90 flex items-center gap-1">
                  <Circle className={`h-2 w-2 ${adminOnline ? 'fill-green-400' : 'fill-gray-400'}`} />
                  {adminOnline ? t('common:visitorChat.agentsOnline', 'Agents online') : t('common:visitorChat.offline', 'We\'ll respond soon')}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20 rounded-full"
              data-testid="button-close-chat"
            >
              <X className="h-5 w-5" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-950">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.senderType === 'visitor' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')} animate-in slide-in-from-bottom-2 duration-300`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl p-3 shadow-md transition-all hover:shadow-lg ${
                      msg.senderType === 'visitor'
                        ? 'bg-primary text-primary-foreground rounded-br-sm'
                        : msg.senderType === 'system'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm italic'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                    }`}
                    data-testid={`message-${msg.senderType}-${index}`}
                  >
                    {msg.senderType !== 'visitor' && msg.senderType !== 'system' && (
                      <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
                  </div>
                </div>
              ))}
              
              {/* Admin typing indicator */}
              {adminTyping && (
                <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} animate-in fade-in duration-200`}>
                  <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-2xl rounded-bl-sm p-3 shadow-md">
                    <div className="flex gap-1">
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                      <span className="h-2 w-2 bg-primary/60 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
              
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Contact Info Form */}
          {showContactForm && !session?.visitorEmail && (
            <div className="p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-950 dark:to-indigo-950 border-t border-gray-200 dark:border-gray-700 shadow-inner">
              <p className="text-sm mb-3 text-gray-700 dark:text-gray-300 font-medium">
                {t('common:visitorChat.contactFormPrompt')}
              </p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <User className="h-4 w-4 mt-2.5 text-gray-500 flex-shrink-0" />
                  <Input
                    type="text"
                    placeholder={t('common:visitorChat.namePlaceholder')}
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1 bg-white dark:bg-gray-900"
                    data-testid="input-visitor-name"
                  />
                </div>
                <div className="flex gap-2">
                  <Mail className="h-4 w-4 mt-2.5 text-gray-500 flex-shrink-0" />
                  <Input
                    type="email"
                    placeholder={t('common:visitorChat.emailPlaceholder')}
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1 bg-white dark:bg-gray-900"
                    data-testid="input-visitor-email"
                  />
                </div>
                <div className="flex gap-2">
                  <Phone className="h-4 w-4 mt-2.5 text-gray-500 flex-shrink-0" />
                  <Input
                    type="tel"
                    placeholder={t('common:visitorChat.phonePlaceholder')}
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1 bg-white dark:bg-gray-900"
                    data-testid="input-visitor-phone"
                  />
                </div>
                <div className="flex gap-2 mt-3">
                  <Button
                    onClick={saveContactInfo}
                    className="flex-1 shadow-md"
                    size="sm"
                    disabled={!contactInfo.email && !contactInfo.phone}
                    data-testid="button-save-contact"
                  >
                    {t('common:save')}
                  </Button>
                  <Button
                    onClick={() => setShowContactForm(false)}
                    variant="outline"
                    size="sm"
                    className="shadow-md"
                    data-testid="button-skip-contact"
                  >
                    {t('common:visitorChat.maybeLater')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-lg">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t('common:visitorChat.messagePlaceholder')}
                value={newMessage}
                onChange={(e) => {
                  setNewMessage(e.target.value);
                  handleTyping();
                }}
                onKeyDown={handleKeyDown}
                className="flex-1 border-2 focus:border-primary transition-colors"
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                size="icon"
                className="h-10 w-10 shadow-md transition-all hover:scale-105"
                data-testid="button-send-message"
              >
                <Send className={`h-4 w-4 ${isRTL ? 'scale-x-[-1]' : ''}`} />
              </Button>
            </div>
            <p className="text-xs text-muted-foreground mt-2 text-center">
              {t('common:visitorChat.poweredBy', 'Powered by Meta Lingua')}
            </p>
          </div>
        </div>
      )}
    </>
  );
}
