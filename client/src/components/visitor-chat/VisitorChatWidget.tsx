import { useState, useEffect, useRef } from 'react';
import { MessageCircle, X, Send, User, Mail, Phone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useLanguage } from '@/hooks/use-language';
import { useTranslation } from 'react-i18next';
import { apiRequest } from '@/lib/queryClient';

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
  
  const { language } = useLanguage();
  const { t } = useTranslation();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const isRTL = ['fa', 'ar'].includes(language);

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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

  const handleKeyPress = (e: React.KeyboardEvent) => {
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
        className={`fixed bottom-6 ${isRTL ? 'left-6' : 'right-6'} z-50 h-14 w-14 rounded-full shadow-lg transition-transform hover:scale-110`}
        size="icon"
        data-testid="button-visitor-chat-toggle"
      >
        {isOpen ? <X className="h-6 w-6" /> : <MessageCircle className="h-6 w-6" />}
      </Button>

      {/* Chat Window */}
      {isOpen && (
        <div
          className={`fixed bottom-24 ${isRTL ? 'left-6' : 'right-6'} z-50 w-96 max-w-[calc(100vw-3rem)] h-[500px] bg-white dark:bg-gray-800 rounded-lg shadow-2xl flex flex-col overflow-hidden border border-gray-200 dark:border-gray-700`}
          dir={isRTL ? 'rtl' : 'ltr'}
        >
          {/* Header */}
          <div className="bg-primary text-primary-foreground p-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-5 w-5" />
              <h3 className="font-semibold">{t('common:visitorChat.title')}</h3>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 text-primary-foreground hover:bg-primary-foreground/20"
              data-testid="button-close-chat"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-gray-50 dark:bg-gray-900">
            <div className="space-y-4">
              {messages.map((msg, index) => (
                <div
                  key={msg.id || index}
                  className={`flex ${msg.senderType === 'visitor' ? (isRTL ? 'justify-start' : 'justify-end') : (isRTL ? 'justify-end' : 'justify-start')}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-3 ${
                      msg.senderType === 'visitor'
                        ? 'bg-primary text-primary-foreground'
                        : msg.senderType === 'system'
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 text-sm italic'
                        : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'
                    }`}
                    data-testid={`message-${msg.senderType}-${index}`}
                  >
                    {msg.senderType !== 'visitor' && msg.senderType !== 'system' && (
                      <p className="text-xs font-semibold mb-1 text-gray-600 dark:text-gray-400">
                        {msg.senderName}
                      </p>
                    )}
                    <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
                  </div>
                </div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </ScrollArea>

          {/* Contact Info Form */}
          {showContactForm && !session?.visitorEmail && (
            <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border-t border-gray-200 dark:border-gray-700">
              <p className="text-sm mb-3 text-gray-700 dark:text-gray-300">
                {t('common:visitorChat.contactFormPrompt')}
              </p>
              <div className="space-y-2">
                <div className="flex gap-2">
                  <User className="h-4 w-4 mt-2 text-gray-500" />
                  <Input
                    type="text"
                    placeholder={t('common:visitorChat.namePlaceholder')}
                    value={contactInfo.name}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, name: e.target.value }))}
                    className="flex-1"
                    data-testid="input-visitor-name"
                  />
                </div>
                <div className="flex gap-2">
                  <Mail className="h-4 w-4 mt-2 text-gray-500" />
                  <Input
                    type="email"
                    placeholder={t('common:visitorChat.emailPlaceholder')}
                    value={contactInfo.email}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, email: e.target.value }))}
                    className="flex-1"
                    data-testid="input-visitor-email"
                  />
                </div>
                <div className="flex gap-2">
                  <Phone className="h-4 w-4 mt-2 text-gray-500" />
                  <Input
                    type="tel"
                    placeholder={t('common:visitorChat.phonePlaceholder')}
                    value={contactInfo.phone}
                    onChange={(e) => setContactInfo(prev => ({ ...prev, phone: e.target.value }))}
                    className="flex-1"
                    data-testid="input-visitor-phone"
                  />
                </div>
                <div className="flex gap-2 mt-2">
                  <Button
                    onClick={saveContactInfo}
                    className="flex-1"
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
                    data-testid="button-skip-contact"
                  >
                    {t('common:visitorChat.maybeLater')}
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* Message Input */}
          <div className="p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
            <div className="flex gap-2">
              <Input
                type="text"
                placeholder={t('common:visitorChat.messagePlaceholder')}
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                className="flex-1"
                disabled={isLoading}
                data-testid="input-chat-message"
              />
              <Button
                onClick={sendMessage}
                disabled={!newMessage.trim() || isLoading}
                size="icon"
                data-testid="button-send-message"
              >
                <Send className={`h-4 w-4 ${isRTL ? 'scale-x-[-1]' : ''}`} />
              </Button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
