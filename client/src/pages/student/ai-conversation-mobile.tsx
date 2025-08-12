import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { MobileCard } from '@/components/mobile/MobileCard';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { 
  Bot,
  Send,
  Mic,
  Volume2,
  VolumeX,
  RefreshCw,
  Languages,
  Sparkles,
  MessageCircle,
  Brain,
  Zap,
  Target,
  ChevronDown
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
  translation?: string;
}

interface Conversation {
  id: number;
  topic: string;
  language: string;
  level: string;
  messages: Message[];
  createdAt: string;
}

interface AISettings {
  language: string;
  level: string;
  topic: string;
  speakingSpeed: 'slow' | 'normal' | 'fast';
  autoSpeak: boolean;
  showTranslation: boolean;
}

export default function StudentAIConversationMobile() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<AISettings>({
    language: 'english',
    level: 'intermediate',
    topic: 'general',
    speakingSpeed: 'normal',
    autoSpeak: true,
    showTranslation: false
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Fetch conversation history
  const { data: conversations } = useQuery<Conversation[]>({
    queryKey: ['/api/student/ai-conversations'],
    queryFn: async () => {
      const response = await fetch('/api/student/ai-conversations', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) throw new Error('Failed to fetch conversations');
      return response.json();
    }
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/student/ai-conversation/send', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ 
          message: text,
          language: settings.language,
          level: settings.level,
          topic: settings.topic
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onSuccess: (data) => {
      const aiMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        audioUrl: data.audioUrl,
        translation: data.translation
      };
      setMessages(prev => [...prev, aiMessage]);
      
      if (settings.autoSpeak && data.audioUrl) {
        playAudio(data.audioUrl);
      }
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:aiError'),
        variant: 'destructive'
      });
    }
  });

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(inputText);
    setInputText('');
  };

  const playAudio = (url: string) => {
    setIsSpeaking(true);
    const audio = new Audio(url);
    audio.onended = () => setIsSpeaking(false);
    audio.play();
  };

  const startNewConversation = () => {
    setMessages([]);
    toast({
      title: t('student:newConversation'),
      description: t('student:newConversationDesc'),
    });
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    if (!isRecording) {
      // Start recording logic
      toast({
        title: t('student:recording'),
        description: t('student:speakNow'),
      });
    } else {
      // Stop recording and send
      toast({
        title: t('student:processingAudio'),
        description: t('student:pleaseWait'),
      });
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const topics = [
    { id: 'general', label: t('student:topics.general'), icon: MessageCircle },
    { id: 'business', label: t('student:topics.business'), icon: Target },
    { id: 'travel', label: t('student:topics.travel'), icon: Languages },
    { id: 'technology', label: t('student:topics.technology'), icon: Zap }
  ];

  return (
    <MobileLayout
      title={t('student:aiConversation')}
      showBack={false}
      gradient="ai"
      headerAction={
        <button 
          className="p-2 rounded-full glass-button"
          onClick={() => setShowSettings(!showSettings)}
        >
          <Brain className="w-5 h-5 text-white" />
        </button>
      }
    >
      {/* Settings Panel */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            className="glass-card p-4 mb-4"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
          >
            <h3 className="text-white font-semibold mb-3">
              {t('student:aiSettings')}
            </h3>

            {/* Language Selection */}
            <div className="mb-3">
              <p className="text-white/70 text-sm mb-2">{t('student:practiceLanguage')}</p>
              <div className="flex gap-2 flex-wrap">
                {['english', 'spanish', 'french', 'german'].map((lang) => (
                  <button
                    key={lang}
                    onClick={() => setSettings({...settings, language: lang})}
                    className={`
                      px-3 py-1 rounded-lg text-sm transition-all
                      ${settings.language === lang 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 text-white/70'}
                    `}
                  >
                    {t(`languages.${lang}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Level Selection */}
            <div className="mb-3">
              <p className="text-white/70 text-sm mb-2">{t('student:level')}</p>
              <div className="flex gap-2">
                {['beginner', 'intermediate', 'advanced'].map((level) => (
                  <button
                    key={level}
                    onClick={() => setSettings({...settings, level})}
                    className={`
                      px-3 py-1 rounded-lg text-sm transition-all flex-1
                      ${settings.level === level 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 text-white/70'}
                    `}
                  >
                    {t(`student:level.${level}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Topic Selection */}
            <div className="mb-3">
              <p className="text-white/70 text-sm mb-2">{t('student:topic')}</p>
              <div className="grid grid-cols-2 gap-2">
                {topics.map((topic) => {
                  const Icon = topic.icon;
                  return (
                    <button
                      key={topic.id}
                      onClick={() => setSettings({...settings, topic: topic.id})}
                      className={`
                        p-2 rounded-lg text-sm transition-all flex items-center gap-2
                        ${settings.topic === topic.id 
                          ? 'bg-purple-500 text-white' 
                          : 'bg-white/10 text-white/70'}
                      `}
                    >
                      <Icon className="w-4 h-4" />
                      {topic.label}
                    </button>
                  );
                })}
              </div>
            </div>

            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setShowSettings(false);
                startNewConversation();
              }}
            >
              {t('student:startNewTopic')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Stats Bar */}
      <motion.div
        className="flex gap-3 mb-4"
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="glass-card p-2 flex-1 text-center">
          <p className="text-white/60 text-xs">{t('student:messages')}</p>
          <p className="text-white font-semibold">{messages.length}</p>
        </div>
        <div className="glass-card p-2 flex-1 text-center">
          <p className="text-white/60 text-xs">{t('student:language')}</p>
          <p className="text-white font-semibold capitalize">{settings.language}</p>
        </div>
        <div className="glass-card p-2 flex-1 text-center">
          <p className="text-white/60 text-xs">{t('student:level')}</p>
          <p className="text-white font-semibold capitalize">{settings.level}</p>
        </div>
      </motion.div>

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[400px]">
        {messages.length === 0 ? (
          <motion.div
            className="glass-card p-8 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              {t('student:aiWelcome')}
            </h3>
            <p className="text-white/70 text-sm mb-4">
              {t('student:aiWelcomeDesc')}
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {['Hello! How are you?', 'What is your name?', 'Nice to meet you!'].map((suggestion) => (
                <button
                  key={suggestion}
                  className="px-3 py-1 bg-white/10 rounded-full text-white/80 text-sm"
                  onClick={() => {
                    setInputText(suggestion);
                    handleSend();
                  }}
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </motion.div>
        ) : (
          messages.map((message, index) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.2, delay: index * 0.02 }}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div className={`max-w-[80%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex gap-2`}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div>
                  <div className={`
                    px-4 py-2 rounded-2xl
                    ${message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white' 
                      : 'glass-card text-white'}
                  `}>
                    <p className="text-sm">{message.content}</p>
                  </div>
                  
                  {message.translation && settings.showTranslation && (
                    <p className="text-white/50 text-xs mt-1 px-2">
                      {message.translation}
                    </p>
                  )}
                  
                  {message.audioUrl && (
                    <button
                      className="mt-2 p-1 rounded-full bg-white/10"
                      onClick={() => playAudio(message.audioUrl!)}
                    >
                      {isSpeaking ? (
                        <VolumeX className="w-4 h-4 text-white/70" />
                      ) : (
                        <Volume2 className="w-4 h-4 text-white/70" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-card p-3 flex items-center gap-3">
        <button
          className={`p-2 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-white/10'
          }`}
          onClick={toggleRecording}
        >
          <Mic className="w-5 h-5 text-white" />
        </button>
        
        <input
          type="text"
          placeholder={t('student:typeMessage')}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && inputText.trim()) {
              handleSend();
            }
          }}
        />
        
        {inputText.trim() ? (
          <motion.button
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500"
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        ) : (
          <button
            className="p-2 rounded-full bg-white/10"
            onClick={startNewConversation}
          >
            <RefreshCw className="w-5 h-5 text-white/70" />
          </button>
        )}
      </div>
    </MobileLayout>
  );
}