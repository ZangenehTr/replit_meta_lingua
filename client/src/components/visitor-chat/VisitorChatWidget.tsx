import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Phone, Star, Bot, Headphones, ChevronDown, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useLanguage } from '@/hooks/use-language';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import io, { Socket } from 'socket.io-client';

interface Message {
  id: number;
  senderType: 'visitor' | 'admin' | 'ai' | 'system';
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
  chatMode?: string;
  matchedUserId?: number;
  matchedLeadId?: number;
}

interface MatchedUser {
  id: number;
  firstName?: string;
  lastName?: string;
  phone?: string;
  email?: string;
  role?: string;
}

type ChatStep = 'contact' | 'chat' | 'rating';

export function VisitorChatWidget() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [session, setSession] = useState<ChatSession | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [contactPhone, setContactPhone] = useState('');
  const [contactName, setContactName] = useState('');
  const [chatStep, setChatStep] = useState<ChatStep>('contact');
  const [collectContactFirst, setCollectContactFirst] = useState(true);
  const [matchedUser, setMatchedUser] = useState<MatchedUser | null>(null);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [adminOnline, setAdminOnline] = useState(false);
  const [adminTyping, setAdminTyping] = useState(false);
  const [aiTyping, setAiTyping] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [rating, setRating] = useState(0);
  const [ratingComment, setRatingComment] = useState('');
  const [ratingSubmitted, setRatingSubmitted] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const [sessionLoading, setSessionLoading] = useState(false);
  const [sessionError, setSessionError] = useState(false);

  const { language } = useLanguage();
  const { t } = useTranslation('common');
  const { toast } = useToast();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const isRTL = ['fa', 'ar'].includes(language);

  useEffect(() => {
    const socketInstance = io({
      path: '/socket.io',
      transports: ['websocket', 'polling'],
    });

    socketInstance.on('connect', () => {
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
      if (!isOpen) setUnreadCount(prev => prev + 1);
      scrollToBottom();
    });

    socketInstance.on('admin-typing-status', (data: { isTyping: boolean }) => {
      setAdminTyping(data.isTyping);
    });

    setSocket(socketInstance);
    return () => { socketInstance.disconnect(); };
  }, []);

  useEffect(() => {
    if (socket && session) {
      socket.emit('visitor-join-chat', { sessionId: session.sessionId });
    }
  }, [socket, session]);

  useEffect(() => { scrollToBottom(); }, [messages, adminTyping, aiTyping]);

  const scrollToBottom = () => {
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  useEffect(() => {
    if (!isOpen || session) return;

    const initSession = async () => {
      setSessionLoading(true);
      setSessionError(false);
      const storedSessionId = localStorage.getItem('visitorChatSessionId');
      
      if (storedSessionId) {
        try {
          const response = await fetch(`/api/visitor-chat/sessions/${storedSessionId}`);
          if (response.ok) {
            const data = await response.json();
            setSession(data.session);
            setMessages(data.messages || []);
            setCollectContactFirst(data.collectContactFirst ?? true);
            if (data.matchedUser) setMatchedUser(data.matchedUser);
            if (data.session.visitorPhone || data.session.visitorName) {
              setChatStep('chat');
            }
            setSessionLoading(false);
            return;
          }
        } catch (error) {
          console.error('Error loading existing session:', error);
        }
      }

      try {
        const response = await apiRequest(`/api/visitor-chat/sessions`, {
          method: 'POST',
          body: JSON.stringify({ language })
        });
        const newSession = await response.json();
        setSession(newSession);
        setCollectContactFirst(newSession.collectContactFirst ?? true);
        localStorage.setItem('visitorChatSessionId', newSession.sessionId);
        
        if (!newSession.collectContactFirst) {
          setChatStep('chat');
          addWelcomeMessage();
        }
      } catch (error) {
        console.error('Error creating chat session:', error);
        setSessionError(true);
      } finally {
        setSessionLoading(false);
      }
    };

    initSession();
  }, [isOpen, session, language]);

  const addWelcomeMessage = () => {
    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: 0,
        senderType: 'ai',
        senderName: 'Meta Lingua AI',
        message: t('visitorChat.welcomeMessage', 'Welcome! How can I help you today?'),
        createdAt: new Date().toISOString()
      }]);
    }, 500);
  };

  const handleTyping = () => {
    if (!socket || !session) return;
    if (!isTyping) {
      setIsTyping(true);
      socket.emit('visitor-typing', { sessionId: session.sessionId, isTyping: true });
    }
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => {
      setIsTyping(false);
      socket?.emit('visitor-typing', { sessionId: session.sessionId, isTyping: false });
    }, 1000);
  };

  const submitContact = async () => {
    if (!session || (!contactPhone.trim() && !contactName.trim())) return;
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/visitor-chat/sessions/${session.sessionId}/contact`, {
        method: 'PATCH',
        body: JSON.stringify({
          visitorName: contactName || undefined,
          visitorPhone: contactPhone || undefined
        })
      });
      const data = await response.json();
      
      if (data.matchedUser) {
        setMatchedUser(data.matchedUser);
      }
      
      setSession(prev => prev ? {
        ...prev,
        visitorName: data.identifiedName || contactName,
        visitorPhone: contactPhone
      } : null);

      setChatStep('chat');
      addWelcomeMessage();
    } catch (error) {
      console.error('Error saving contact:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim()) return;
    if (!session) {
      toast({
        title: t('visitorChat.notConnected', 'Not connected'),
        description: t('visitorChat.notConnectedDesc', 'Please wait while we connect you, then try again.'),
        variant: 'destructive'
      });
      return;
    }
    setIsLoading(true);
    try {
      const response = await apiRequest(`/api/visitor-chat/sessions/${session.sessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({
          message: newMessage,
          senderType: 'visitor',
          senderName: session.visitorName || contactName || 'Visitor'
        })
      });

      const data = await response.json();
      setMessages(prev => [...prev, data.message]);
      setNewMessage('');

      if (socket) {
        socket.emit('visitor-send-message', {
          sessionId: session.sessionId,
          message: data.message
        });
      }

      if (data.aiResponse) {
        setAiTyping(true);
        setTimeout(() => {
          setAiTyping(false);
          setMessages(prev => [...prev, data.aiResponse]);
        }, 1200 + Math.random() * 800);
      }
    } catch (error) {
      console.error('Error sending message:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const submitRating = async () => {
    if (!session || rating === 0) return;
    try {
      await apiRequest(`/api/visitor-chat/sessions/${session.sessionId}/rate`, {
        method: 'PATCH',
        body: JSON.stringify({ rating, ratingComment })
      });
      setRatingSubmitted(true);
      setTimeout(() => {
        setIsOpen(false);
        setSession(null);
        setMessages([]);
        setChatStep('contact');
        setRating(0);
        setRatingComment('');
        setRatingSubmitted(false);
        localStorage.removeItem('visitorChatSessionId');
      }, 2000);
    } catch (error) {
      console.error('Error submitting rating:', error);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (chatStep === 'contact') submitContact();
      else sendMessage();
    }
  };

  const displayName = session?.visitorName || matchedUser?.firstName || contactName || t('visitorChat.visitor', 'Visitor');

  return (
    <>
      <button
        onClick={() => { setIsOpen(!isOpen); if (!isOpen) setUnreadCount(0); }}
        className={`fixed bottom-4 ${isRTL ? 'left-4' : 'right-4'} z-[60] h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all duration-300 hover:scale-110 bg-gradient-to-br from-blue-600 to-cyan-500 text-white ${adminOnline ? 'ring-2 ring-green-400 ring-offset-2' : ''}`}
        data-testid="button-visitor-chat-toggle"
        aria-label={isOpen ? t('visitorChat.close', 'Close chat') : t('visitorChat.open', 'Open chat')}
      >
        {isOpen ? (
          <X className="h-6 w-6" />
        ) : (
          <div className="relative">
            <MessageCircle className="h-6 w-6" />
            {unreadCount > 0 && (
              <span className="absolute -top-2 -right-2 h-5 w-5 bg-red-500 rounded-full text-[10px] font-bold flex items-center justify-center border-2 border-white">
                {unreadCount}
              </span>
            )}
            {adminOnline && (
              <span className="absolute -bottom-0.5 -right-0.5 h-3 w-3 bg-green-400 rounded-full border-2 border-white" />
            )}
          </div>
        )}
      </button>

      {isOpen && (
        <div
          className={`fixed z-50 flex flex-col overflow-hidden bg-white
            bottom-0 left-0 right-0 top-0 sm:bottom-20 sm:top-auto sm:${isRTL ? 'left-4 sm:right-auto' : 'right-4 sm:left-auto'} sm:w-[380px] sm:h-[560px] sm:rounded-2xl sm:shadow-2xl sm:border border-gray-200`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          <div className="bg-gradient-to-r from-blue-600 to-cyan-500 text-white px-4 py-3 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3 min-w-0">
              <div className="relative shrink-0">
                <div className="h-9 w-9 rounded-full bg-white/20 flex items-center justify-center">
                  {session?.chatMode === 'ai' || session?.chatMode === 'hybrid' ? (
                    <Bot className="h-5 w-5" />
                  ) : (
                    <Headphones className="h-5 w-5" />
                  )}
                </div>
                {adminOnline && (
                  <span className="absolute -bottom-0.5 -right-0.5 h-2.5 w-2.5 bg-green-400 rounded-full border-2 border-blue-600" />
                )}
              </div>
              <div className="min-w-0">
                <h3 className="font-semibold text-sm truncate">{t('visitorChat.title', 'Chat with us')}</h3>
                <p className="text-[11px] text-white/80 flex items-center gap-1">
                  <span className={`h-1.5 w-1.5 rounded-full ${adminOnline ? 'bg-green-400' : 'bg-gray-300'}`} />
                  {adminOnline ? t('visitorChat.agentsOnline', 'Online') : t('visitorChat.offline', "We'll respond soon")}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              {chatStep === 'chat' && (
                <button
                  onClick={() => setChatStep('rating')}
                  className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors"
                  title={t('visitorChat.endChat', 'End chat')}
                >
                  <ChevronDown className="h-4 w-4" />
                </button>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="h-8 w-8 rounded-full hover:bg-white/20 flex items-center justify-center transition-colors sm:flex"
                data-testid="button-close-chat"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>

          {matchedUser && chatStep === 'chat' && (
            <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 shrink-0">
              <div className="h-7 w-7 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                <User className="h-4 w-4 text-blue-600" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-medium text-blue-800 truncate">
                  {matchedUser.firstName} {matchedUser.lastName}
                </p>
                <p className="text-[10px] text-blue-600 truncate">
                  {matchedUser.role === 'student' ? t('visitorChat.existingStudent', 'Existing student') :
                   matchedUser.role ? t('visitorChat.existingMember', 'Existing member') :
                   t('visitorChat.identified', 'Identified')}
                </p>
              </div>
            </div>
          )}

          {chatStep === 'contact' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              <div className="h-16 w-16 rounded-full bg-gradient-to-br from-blue-100 to-cyan-100 flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-800 mb-1 text-center">
                {t('visitorChat.welcomeTitle', 'Welcome!')}
              </h3>
              <p className="text-sm text-gray-500 mb-6 text-center max-w-[260px]">
                {t('visitorChat.contactPrompt', 'Please share your phone number so we can assist you better.')}
              </p>
              <div className="w-full max-w-[280px] space-y-3">
                <div className="relative">
                  <Phone className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400`} />
                  <Input
                    type="tel"
                    placeholder={t('visitorChat.phonePlaceholder', '09123456789')}
                    value={contactPhone}
                    onChange={(e) => setContactPhone(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-10 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400`}
                    dir="ltr"
                    data-testid="input-visitor-phone"
                  />
                </div>
                <div className="relative">
                  <User className={`absolute top-2.5 ${isRTL ? 'right-3' : 'left-3'} h-4 w-4 text-gray-400`} />
                  <Input
                    type="text"
                    placeholder={t('visitorChat.namePlaceholder', 'Your name (optional)')}
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    onKeyDown={handleKeyDown}
                    className={`${isRTL ? 'pr-10' : 'pl-10'} h-10 text-sm border-gray-200 focus:border-blue-400 focus:ring-blue-400`}
                    data-testid="input-visitor-name"
                  />
                </div>
                <Button
                  onClick={submitContact}
                  disabled={!contactPhone.trim() || isLoading}
                  className="w-full h-10 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-sm font-medium"
                  data-testid="button-start-chat"
                >
                  {isLoading ? t('visitorChat.connecting', 'Connecting...') : t('visitorChat.startChat', 'Start Chat')}
                </Button>
                <button
                  onClick={() => { setChatStep('chat'); addWelcomeMessage(); }}
                  className="w-full text-xs text-gray-400 hover:text-gray-600 transition-colors"
                >
                  {t('visitorChat.skipContact', 'Skip and chat anonymously')}
                </button>
              </div>
            </div>
          )}

          {chatStep === 'chat' && (
            <>
              {sessionError && (
                <div className="bg-red-50 border-b border-red-100 px-4 py-2 flex items-center justify-between gap-2 shrink-0">
                  <p className="text-xs text-red-700 flex-1">
                    {t('visitorChat.connectionError', 'Connection failed. Please try again.')}
                  </p>
                  <button
                    onClick={() => { setSession(null); setSessionError(false); }}
                    className="text-xs text-red-600 underline shrink-0 font-medium"
                  >
                    {t('visitorChat.retry', 'Retry')}
                  </button>
                </div>
              )}
              {sessionLoading && !session && (
                <div className="bg-blue-50 border-b border-blue-100 px-4 py-2 flex items-center gap-2 shrink-0">
                  <div className="h-3 w-3 border-2 border-blue-400 border-t-transparent rounded-full animate-spin shrink-0" />
                  <p className="text-xs text-blue-700">
                    {t('visitorChat.connecting', 'Connecting...')}
                  </p>
                </div>
              )}
              <div className="flex-1 overflow-y-auto px-4 py-3 bg-gray-50 space-y-3" style={{ overscrollBehavior: 'contain' }}>
                {messages.map((msg, index) => (
                  <div
                    key={msg.id || index}
                    className={`flex ${msg.senderType === 'visitor' ? (isRTL ? 'justify-start' : 'justify-end') : msg.senderType === 'system' ? 'justify-center' : (isRTL ? 'justify-end' : 'justify-start')}`}
                  >
                    {msg.senderType === 'system' ? (
                      <p className="text-[11px] text-gray-400 bg-gray-100 rounded-full px-3 py-1">{msg.message}</p>
                    ) : (
                      <div className="flex items-end gap-1.5 max-w-[85%]">
                        {msg.senderType !== 'visitor' && (
                          <div className={`h-6 w-6 rounded-full shrink-0 flex items-center justify-center text-white text-[10px] ${msg.senderType === 'ai' ? 'bg-gradient-to-br from-blue-500 to-cyan-400' : 'bg-gray-400'}`}>
                            {msg.senderType === 'ai' ? <Bot className="h-3.5 w-3.5" /> : <Headphones className="h-3.5 w-3.5" />}
                          </div>
                        )}
                        <div
                          className={`rounded-2xl px-3.5 py-2 text-sm leading-relaxed ${
                            msg.senderType === 'visitor'
                              ? 'bg-gradient-to-br from-blue-600 to-blue-500 text-white rounded-br-sm'
                              : 'bg-white border border-gray-100 text-gray-800 shadow-sm rounded-bl-sm'
                          }`}
                        >
                          {msg.senderType !== 'visitor' && (
                            <p className="text-[10px] font-semibold text-blue-500 mb-0.5">{msg.senderName}</p>
                          )}
                          <p className="whitespace-pre-wrap">{msg.message}</p>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {(adminTyping || aiTyping) && (
                  <div className={`flex ${isRTL ? 'justify-end' : 'justify-start'} items-end gap-1.5`}>
                    <div className="h-6 w-6 rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 flex items-center justify-center shrink-0">
                      <Bot className="h-3.5 w-3.5 text-white" />
                    </div>
                    <div className="bg-white border border-gray-100 rounded-2xl rounded-bl-sm px-4 py-2.5 shadow-sm">
                      <div className="flex gap-1">
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                        <span className="h-1.5 w-1.5 bg-blue-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </div>

              <div className="px-3 py-2.5 border-t border-gray-100 bg-white shrink-0">
                <div className="flex gap-2 items-center">
                  <Input
                    type="text"
                    placeholder={sessionLoading && !session
                      ? t('visitorChat.connecting', 'Connecting...')
                      : t('visitorChat.messagePlaceholder', 'Type your message...')}
                    value={newMessage}
                    onChange={(e) => { setNewMessage(e.target.value); handleTyping(); }}
                    onKeyDown={handleKeyDown}
                    className="flex-1 h-9 text-sm border-gray-200 rounded-full px-4 focus:border-blue-400 focus:ring-blue-400"
                    disabled={isLoading || (sessionLoading && !session)}
                    data-testid="input-chat-message"
                  />
                  <Button
                    onClick={sendMessage}
                    disabled={!newMessage.trim() || isLoading || (sessionLoading && !session)}
                    size="icon"
                    className="h-9 w-9 rounded-full bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 shrink-0 disabled:opacity-50"
                    data-testid="button-send-message"
                  >
                    {isLoading
                      ? <div className="h-3.5 w-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      : <Send className={`h-4 w-4 ${isRTL ? 'scale-x-[-1]' : ''}`} />
                    }
                  </Button>
                </div>
                <p className="text-[10px] text-gray-300 mt-1 text-center">
                  Meta Lingua
                </p>
              </div>
            </>
          )}

          {chatStep === 'rating' && (
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
              {ratingSubmitted ? (
                <div className="text-center">
                  <div className="h-16 w-16 rounded-full bg-green-100 flex items-center justify-center mb-4 mx-auto">
                    <Star className="h-8 w-8 text-green-600 fill-green-600" />
                  </div>
                  <h3 className="text-lg font-bold text-gray-800 mb-2">
                    {t('visitorChat.thankYou', 'Thank you!')}
                  </h3>
                  <p className="text-sm text-gray-500">
                    {t('visitorChat.ratingThanks', 'Your feedback helps us improve.')}
                  </p>
                </div>
              ) : (
                <>
                  <h3 className="text-lg font-bold text-gray-800 mb-2 text-center">
                    {t('visitorChat.rateTitle', 'How was your experience?')}
                  </h3>
                  <p className="text-sm text-gray-500 mb-6 text-center">
                    {t('visitorChat.rateDescription', 'Your feedback helps us serve you better.')}
                  </p>
                  <div className="flex gap-2 mb-6">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <button
                        key={star}
                        onClick={() => setRating(star)}
                        className="transition-transform hover:scale-110"
                      >
                        <Star
                          className={`h-8 w-8 transition-colors ${
                            star <= rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-200'
                          }`}
                        />
                      </button>
                    ))}
                  </div>
                  <textarea
                    placeholder={t('visitorChat.ratingCommentPlaceholder', 'Any comments? (optional)')}
                    value={ratingComment}
                    onChange={(e) => setRatingComment(e.target.value)}
                    className="w-full max-w-[280px] h-20 text-sm border border-gray-200 rounded-xl px-3 py-2 resize-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400 outline-none mb-4"
                  />
                  <div className="flex gap-3 w-full max-w-[280px]">
                    <Button
                      onClick={submitRating}
                      disabled={rating === 0}
                      className="flex-1 h-10 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 text-sm"
                    >
                      {t('visitorChat.submitRating', 'Submit')}
                    </Button>
                    <Button
                      onClick={() => setChatStep('chat')}
                      variant="outline"
                      className="h-10 text-sm"
                    >
                      {t('visitorChat.back', 'Back')}
                    </Button>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      )}
    </>
  );
}
