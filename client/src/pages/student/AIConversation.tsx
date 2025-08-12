import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/hooks/use-auth";
import { useTranslation } from 'react-i18next';
import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { MobileBottomNav } from "@/components/mobile/MobileBottomNav";
import { 
  Bot,
  Send,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  RefreshCw,
  Settings,
  Languages,
  Brain,
  Sparkles,
  MessageSquare,
  ChevronDown,
  Info,
  Copy,
  ThumbsUp,
  ThumbsDown,
  Loader,
  User,
  X
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  feedback?: 'positive' | 'negative';
  audioUrl?: string;
  isTyping?: boolean;
}

interface ConversationSettings {
  language: string;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  topic: string;
  voice: 'male' | 'female';
  speed: number;
  autoSpeak: boolean;
}

interface ConversationStats {
  totalMessages: number;
  totalSessions: number;
  averageAccuracy: number;
  vocabularyLearned: number;
  streak: number;
}

export default function StudentAIConversation() {
  const { user } = useAuth();
  const { t } = useTranslation();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<ConversationSettings>({
    language: 'English',
    difficulty: 'intermediate',
    topic: 'general',
    voice: 'female',
    speed: 1,
    autoSpeak: true
  });

  // Fetch conversation stats
  const { data: stats } = useQuery<ConversationStats>({
    queryKey: ['/api/student/ai/stats'],
    queryFn: async () => {
      const response = await fetch('/api/student/ai/stats', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) {
        return {
          totalMessages: 0,
          totalSessions: 0,
          averageAccuracy: 0,
          vocabularyLearned: 0,
          streak: 0
        };
      }
      return response.json();
    }
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (message: string) => {
      const response = await fetch('/api/student/ai/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          message,
          settings
        })
      });
      if (!response.ok) throw new Error('Failed to send message');
      return response.json();
    },
    onMutate: (message) => {
      // Add user message immediately
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: message,
        timestamp: new Date().toISOString()
      };
      setMessages(prev => [...prev, userMessage]);
      
      // Add typing indicator
      const typingMessage: Message = {
        id: 'typing',
        role: 'assistant',
        content: '',
        timestamp: new Date().toISOString(),
        isTyping: true
      };
      setMessages(prev => [...prev, typingMessage]);
    },
    onSuccess: (data) => {
      // Remove typing indicator and add AI response
      setMessages(prev => {
        const filtered = prev.filter(m => m.id !== 'typing');
        const aiMessage: Message = {
          id: Date.now().toString(),
          role: 'assistant',
          content: data.response,
          timestamp: new Date().toISOString(),
          audioUrl: data.audioUrl
        };
        return [...filtered, aiMessage];
      });
      
      // Auto-speak if enabled
      if (settings.autoSpeak && data.audioUrl) {
        playAudio(data.audioUrl);
      }
      
      queryClient.invalidateQueries({ queryKey: ['/api/student/ai/stats'] });
    },
    onError: () => {
      // Remove typing indicator
      setMessages(prev => prev.filter(m => m.id !== 'typing'));
      toast({
        title: t('common:error', 'Error'),
        description: t('student:messageFailed', 'Failed to send message'),
        variant: 'destructive'
      });
    }
  });

  // Provide feedback mutation
  const provideFeedbackMutation = useMutation({
    mutationFn: async ({ messageId, feedback }: { messageId: string; feedback: 'positive' | 'negative' }) => {
      const response = await fetch(`/api/student/ai/feedback`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({ messageId, feedback })
      });
      if (!response.ok) throw new Error('Failed to provide feedback');
      return response.json();
    },
    onSuccess: (_, variables) => {
      setMessages(prev => 
        prev.map(m => 
          m.id === variables.messageId 
            ? { ...m, feedback: variables.feedback } 
            : m
        )
      );
      toast({
        title: t('student:feedbackReceived', 'Feedback Received'),
        description: t('student:thanksFeedback', 'Thanks for your feedback!'),
      });
    }
  });

  // Scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;
    
    sendMessageMutation.mutate(inputMessage);
    setInputMessage('');
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: t('student:copied', 'Copied'),
      description: t('student:textCopied', 'Text copied to clipboard'),
    });
  };

  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.playbackRate = settings.speed;
    audio.play();
    setIsSpeaking(true);
    audio.onended = () => setIsSpeaking(false);
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Voice recording logic would go here
    toast({
      title: isRecording ? t('student:recordingStopped', 'Recording Stopped') : t('student:recordingStarted', 'Recording Started'),
      description: isRecording ? t('student:processingAudio', 'Processing audio...') : t('student:speakNow', 'Speak now...'),
    });
  };

  const startNewConversation = () => {
    setMessages([]);
    toast({
      title: t('student:newConversation', 'New Conversation'),
      description: t('student:conversationReset', 'Conversation has been reset'),
    });
  };

  const topics = [
    { value: 'general', label: t('student:general', 'General Conversation') },
    { value: 'travel', label: t('student:travel', 'Travel') },
    { value: 'business', label: t('student:business', 'Business') },
    { value: 'culture', label: t('student:culture', 'Culture') },
    { value: 'technology', label: t('student:technology', 'Technology') },
    { value: 'food', label: t('student:food', 'Food & Dining') }
  ];

  return (
    <div className="mobile-app-container min-h-screen">
      {/* Animated Gradient Background */}
      <div className="absolute inset-0 animated-gradient-bg opacity-50" />
      
      {/* Content */}
      <div className="relative z-10 flex flex-col h-screen">
        {/* Mobile Header */}
        <motion.header 
          className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-4 py-3"
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <div className="p-2 rounded-full bg-gradient-to-br from-purple-500 to-pink-500">
                <Bot className="w-5 h-5 text-white" />
              </div>
              <div>
                <h1 className="text-white font-bold text-lg">{t('student:aiTutor', 'AI Tutor')}</h1>
                <p className="text-white/60 text-xs">{settings.language} • {settings.difficulty}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={startNewConversation}
                className="p-2 rounded-full bg-white/10 backdrop-blur"
              >
                <RefreshCw className="w-4 h-4 text-white" />
              </motion.button>
              <motion.button
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 rounded-full bg-white/10 backdrop-blur"
              >
                <Settings className="w-4 h-4 text-white" />
              </motion.button>
            </div>
          </div>

          {/* Stats Bar */}
          <div className="flex items-center gap-3 text-white/60 text-xs">
            <span className="flex items-center gap-1">
              <MessageSquare className="w-3 h-3" />
              {stats?.totalMessages || 0} messages
            </span>
            <span className="flex items-center gap-1">
              <Brain className="w-3 h-3" />
              {stats?.vocabularyLearned || 0} words
            </span>
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3" />
              {stats?.streak || 0} day streak
            </span>
          </div>
        </motion.header>

        {/* Settings Panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              transition={{ duration: 0.3 }}
              className="bg-white/10 backdrop-blur-lg border-b border-white/20 px-4 py-3 overflow-hidden"
            >
              <div className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">{t('student:language', 'Language')}</label>
                    <select
                      value={settings.language}
                      onChange={(e) => setSettings({ ...settings, language: e.target.value })}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="English">English</option>
                      <option value="Spanish">Spanish</option>
                      <option value="French">French</option>
                      <option value="German">German</option>
                      <option value="Chinese">Chinese</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-white/60 text-xs mb-1 block">{t('student:difficulty', 'Difficulty')}</label>
                    <select
                      value={settings.difficulty}
                      onChange={(e) => setSettings({ ...settings, difficulty: e.target.value as any })}
                      className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                    >
                      <option value="beginner">{t('student:beginner', 'Beginner')}</option>
                      <option value="intermediate">{t('student:intermediate', 'Intermediate')}</option>
                      <option value="advanced">{t('student:advanced', 'Advanced')}</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="text-white/60 text-xs mb-1 block">{t('student:topic', 'Topic')}</label>
                  <select
                    value={settings.topic}
                    onChange={(e) => setSettings({ ...settings, topic: e.target.value })}
                    className="w-full px-2 py-1 bg-white/10 border border-white/20 rounded text-white text-sm"
                  >
                    {topics.map(topic => (
                      <option key={topic.value} value={topic.value}>{topic.label}</option>
                    ))}
                  </select>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-white/60 text-sm">{t('student:autoSpeak', 'Auto Speak')}</span>
                  <button
                    onClick={() => setSettings({ ...settings, autoSpeak: !settings.autoSpeak })}
                    className={`w-12 h-6 rounded-full transition-colors ${
                      settings.autoSpeak ? 'bg-purple-500' : 'bg-white/20'
                    }`}
                  >
                    <div className={`w-5 h-5 rounded-full bg-white transition-transform ${
                      settings.autoSpeak ? 'translate-x-6' : 'translate-x-0.5'
                    }`} />
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto px-4 py-4">
          {messages.length === 0 ? (
            <motion.div 
              className="text-center py-12"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-10 h-10 text-white" />
              </div>
              <h2 className="text-white text-xl font-semibold mb-2">
                {t('student:startConversation', 'Start a Conversation')}
              </h2>
              <p className="text-white/60 text-sm mb-6">
                {t('student:practiceLanguage', 'Practice your language skills with AI')}
              </p>
              <div className="flex flex-wrap gap-2 justify-center">
                {[
                  t('student:greeting', 'Hello, how are you?'),
                  t('student:askQuestion', 'Can you help me learn?'),
                  t('student:practice', "Let's practice conversation")
                ].map((suggestion, index) => (
                  <motion.button
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => setInputMessage(suggestion)}
                    className="px-3 py-1.5 bg-white/10 backdrop-blur rounded-full text-white/80 text-sm hover:bg-white/20"
                  >
                    {suggestion}
                  </motion.button>
                ))}
              </div>
            </motion.div>
          ) : (
            <div className="space-y-4">
              {messages.map((message, index) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: index * 0.05 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.role === 'user' ? 'order-2' : 'order-1'}`}>
                    <div className={`rounded-2xl px-4 py-2 ${
                      message.role === 'user' 
                        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                        : 'glass-card text-white'
                    }`}>
                      {message.isTyping ? (
                        <div className="flex items-center gap-2">
                          <Loader className="w-4 h-4 animate-spin" />
                          <span className="text-sm">{t('student:typing', 'Typing...')}</span>
                        </div>
                      ) : (
                        <>
                          <p className="text-sm">{message.content}</p>
                          {message.role === 'assistant' && (
                            <div className="flex items-center gap-2 mt-2 pt-2 border-t border-white/10">
                              {message.audioUrl && (
                                <button
                                  onClick={() => playAudio(message.audioUrl!)}
                                  className="p-1 hover:bg-white/10 rounded"
                                >
                                  {isSpeaking ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                                </button>
                              )}
                              <button
                                onClick={() => copyToClipboard(message.content)}
                                className="p-1 hover:bg-white/10 rounded"
                              >
                                <Copy className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => provideFeedbackMutation.mutate({ 
                                  messageId: message.id, 
                                  feedback: 'positive' 
                                })}
                                className={`p-1 hover:bg-white/10 rounded ${
                                  message.feedback === 'positive' ? 'text-green-400' : ''
                                }`}
                              >
                                <ThumbsUp className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => provideFeedbackMutation.mutate({ 
                                  messageId: message.id, 
                                  feedback: 'negative' 
                                })}
                                className={`p-1 hover:bg-white/10 rounded ${
                                  message.feedback === 'negative' ? 'text-red-400' : ''
                                }`}
                              >
                                <ThumbsDown className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                    <p className={`text-white/40 text-xs mt-1 ${
                      message.role === 'user' ? 'text-right' : 'text-left'
                    }`}>
                      {new Date(message.timestamp).toLocaleTimeString([], { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          )}
        </div>

        {/* Input Area */}
        <div className="bg-white/10 backdrop-blur-lg border-t border-white/20 p-4">
          <div className="flex gap-2">
            <button
              onClick={toggleRecording}
              className={`p-3 rounded-full transition-colors ${
                isRecording 
                  ? 'bg-red-500 text-white animate-pulse' 
                  : 'bg-white/10 text-white hover:bg-white/20'
              }`}
            >
              {isRecording ? <MicOff className="w-5 h-5" /> : <Mic className="w-5 h-5" />}
            </button>
            
            <div className="flex-1 relative">
              <Textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder={t('student:typeMessage', 'Type your message...')}
                className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/50 resize-none min-h-[48px] max-h-[120px]"
                rows={1}
              />
            </div>
            
            <button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendMessageMutation.isPending}
              className={`p-3 rounded-full transition-colors ${
                inputMessage.trim() && !sendMessageMutation.isPending
                  ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                  : 'bg-white/10 text-white/50'
              }`}
            >
              {sendMessageMutation.isPending ? (
                <Loader className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile Bottom Navigation */}
      <MobileBottomNav />
    </div>
  );
}