import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { SpeechRecognitionService } from '@/services/speech-recognition-service';
import { 
  Bot,
  Send,
  Mic,
  Volume2,
  VolumeX,
  RefreshCw,
  Settings,
  Sparkles,
  MessageCircle,
  Brain,
  Target,
  BookOpen,
  ChevronDown,
  User,
  GraduationCap,
  Clock
} from 'lucide-react';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { toast } from '@/hooks/use-toast';
import '@/styles/mobile-app.css';

interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  context?: string;
}

interface StudyPartnerSettings {
  personality: string;
  focusArea: string;
  difficultyLevel: string;
  learningGoals: string[];
  studyMode: 'casual' | 'focused' | 'exam-prep';
}

interface RoadmapProgress {
  currentLevel: string;
  targetLevel: string;
  completedSessions: number;
  upcomingSession?: string;
  weakAreas: string[];
  strongAreas: string[];
}

export default function StudentAIStudyPartnerMobile() {
  const { t } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [settings, setSettings] = useState<StudyPartnerSettings>({
    personality: 'encouraging',
    focusArea: 'general',
    difficultyLevel: 'adaptive',
    learningGoals: [],
    studyMode: 'focused'
  });
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const speechRecognition = useRef<SpeechRecognitionService>(new SpeechRecognitionService());
  const currentAudio = useRef<HTMLAudioElement | null>(null);

  // Fetch current roadmap progress for context
  const { data: roadmapProgress } = useQuery<RoadmapProgress>({
    queryKey: ['/api/student/roadmap-progress'],
    queryFn: async () => {
      const response = await fetch('/api/student/roadmap-progress', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch AI study partner and conversation history
  const { data: studyPartner } = useQuery({
    queryKey: ['/api/ai-study-partner'],
    queryFn: async () => {
      const response = await fetch('/api/ai-study-partner/profile', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return null;
      return response.json();
    }
  });

  // Fetch conversation history
  const { data: conversationHistory } = useQuery<ChatMessage[]>({
    queryKey: ['/api/ai-study-partner/messages'],
    queryFn: async () => {
      const response = await fetch('/api/ai-study-partner/messages', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      if (!response.ok) return [];
      const data = await response.json();
      return data.map((msg: any) => ({
        id: msg.id.toString(),
        role: msg.sender === 'ai' ? 'assistant' : 'user',
        content: msg.content,
        timestamp: new Date(msg.sentAt),
        context: msg.context
      }));
    }
  });

  // Send message mutation
  const sendMessage = useMutation({
    mutationFn: async (text: string) => {
      return apiRequest('/api/ai-study-partner/chat', {
        method: 'POST',
        body: JSON.stringify({ 
          message: text,
          context: {
            currentLevel: roadmapProgress?.currentLevel,
            focusArea: settings.focusArea,
            studyMode: settings.studyMode,
            weakAreas: roadmapProgress?.weakAreas
          }
        })
      });
    },
    onSuccess: (data) => {
      const aiMessage: ChatMessage = {
        id: Date.now().toString(),
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        context: data.context
      };
      setMessages(prev => [...prev, aiMessage]);
      
      // Auto-speak AI responses in focused/exam-prep mode
      if (settings.studyMode === 'focused' || settings.studyMode === 'exam-prep') {
        speakText(data.response);
      }
      
      // Invalidate and refetch conversation history
      queryClient.invalidateQueries({ queryKey: ['/api/ai-study-partner/messages'] });
    },
    onError: () => {
      toast({
        title: t('common:error'),
        description: t('student:aiStudyPartnerError'),
        variant: 'destructive'
      });
    }
  });

  // Initialize study partner
  const initializeStudyPartner = useMutation({
    mutationFn: async (preferences: Partial<StudyPartnerSettings>) => {
      return apiRequest('/api/ai-study-partner/setup', {
        method: 'POST',
        body: JSON.stringify(preferences)
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/ai-study-partner'] });
      toast({
        title: t('student:studyPartnerSetup'),
        description: t('student:studyPartnerReady'),
      });
    }
  });

  // Load conversation history on mount
  useEffect(() => {
    if (conversationHistory) {
      setMessages(conversationHistory);
    }
  }, [conversationHistory]);

  const handleSend = () => {
    if (!inputText.trim()) return;

    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: inputText,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    sendMessage.mutate(inputText);
    setInputText('');
  };

  const handleQuickStart = (prompt: string) => {
    setInputText(prompt);
    setTimeout(() => handleSend(), 100);
  };

  // Text-to-Speech for AI responses
  const speakText = async (text: string, language: string = 'en') => {
    try {
      setIsSpeaking(true);
      
      // Stop any current audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }

      const response = await apiRequest('/api/ai-study-partner/tts', {
        method: 'POST',
        body: JSON.stringify({ text, language })
      });

      if (response.success && response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        currentAudio.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
        };

        await audio.play();
      } else {
        setIsSpeaking(false);
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      toast({
        title: t('common:error'),
        description: t('student:ttsError'),
        variant: 'destructive'
      });
    }
  };

  // Voice Recognition
  const toggleRecording = () => {
    if (!isRecording) {
      startRecording();
    } else {
      stopRecording();
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setInputText('');
    
    try {
      await speechRecognition.current.startListening(
        `study-session-${Date.now()}`,
        'en-US',
        (result) => {
          if (result.isFinal) {
            setInputText(result.text);
            setIsRecording(false);
            toast({
              title: t('student:speechCaptured'),
              description: result.text,
            });
          } else {
            // Show interim results
            setInputText(result.text);
          }
        },
        (analysis) => {
          // Handle speech analysis if needed
          console.log('Speech analysis:', analysis);
        }
      );
    } catch (error) {
      setIsRecording(false);
      toast({
        title: t('common:error'),
        description: t('student:speechRecognitionError'),
        variant: 'destructive'
      });
    }

    toast({
      title: t('student:recording'),
      description: t('student:speakNow'),
    });
  };

  const stopRecording = () => {
    setIsRecording(false);
    speechRecognition.current.stopListening();
    
    toast({
      title: t('student:processingAudio'),
      description: t('student:pleaseWait'),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const quickStartPrompts = [
    "Help me prepare for my next IELTS speaking session",
    "What grammar should I focus on this week?",
    "Can you suggest some vocabulary for business English?",
    "How can I improve my pronunciation?",
    "Let's practice conversation about travel"
  ];

  const studyModes = [
    { id: 'casual', label: t('student:studyMode.casual'), icon: MessageCircle, color: 'bg-blue-500' },
    { id: 'focused', label: t('student:studyMode.focused'), icon: Target, color: 'bg-purple-500' },
    { id: 'exam-prep', label: t('student:studyMode.examPrep'), icon: GraduationCap, color: 'bg-red-500' }
  ];

  return (
    <MobileLayout
      title={t('student:aiStudyPartner')}
      showBack={false}
      gradient="primary"
      headerAction={
        <button 
          className="p-2 rounded-full glass-button"
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5 text-white" />
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
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <Brain className="w-5 h-5" />
              {t('student:studyPartnerSettings')}
            </h3>

            {/* Study Mode Selection */}
            <div className="mb-4">
              <p className="text-white/70 text-sm mb-2">{t('student:studyMode.title')}</p>
              <div className="space-y-2">
                {studyModes.map((mode) => {
                  const Icon = mode.icon;
                  return (
                    <button
                      key={mode.id}
                      onClick={() => setSettings({...settings, studyMode: mode.id as any})}
                      className={`
                        w-full p-3 rounded-lg text-sm transition-all flex items-center gap-3
                        ${settings.studyMode === mode.id 
                          ? `${mode.color} text-white shadow-lg` 
                          : 'bg-white/10 text-white/70'}
                      `}
                      data-testid={`button-study-mode-${mode.id}`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="font-medium">{mode.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Personality Selection */}
            <div className="mb-4">
              <p className="text-white/70 text-sm mb-2">{t('student:aiPersonality')}</p>
              <div className="grid grid-cols-2 gap-2">
                {['encouraging', 'professional', 'friendly', 'challenging'].map((personality) => (
                  <button
                    key={personality}
                    onClick={() => setSettings({...settings, personality})}
                    className={`
                      p-2 rounded-lg text-sm transition-all
                      ${settings.personality === personality 
                        ? 'bg-purple-500 text-white' 
                        : 'bg-white/10 text-white/70'}
                    `}
                    data-testid={`button-personality-${personality}`}
                  >
                    {t(`student:personality.${personality}`)}
                  </button>
                ))}
              </div>
            </div>

            {/* Save Settings */}
            <Button
              size="sm"
              className="w-full"
              onClick={() => {
                setShowSettings(false);
                initializeStudyPartner.mutate(settings);
              }}
              data-testid="button-save-settings"
            >
              {t('student:saveSettings')}
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Progress Overview */}
      {roadmapProgress && (
        <motion.div
          className="glass-card p-4 mb-4"
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
        >
          <h4 className="text-white font-medium mb-3 flex items-center gap-2">
            <BookOpen className="w-4 h-4" />
            {t('student:learningProgress')}
          </h4>
          <div className="flex items-center justify-between text-sm">
            <div className="text-white/80">
              <p className="font-medium">{roadmapProgress.currentLevel} → {roadmapProgress.targetLevel}</p>
              <p className="text-white/60">{roadmapProgress.completedSessions} sessions completed</p>
            </div>
            {roadmapProgress.upcomingSession && (
              <Badge variant="outline" className="text-white border-white/30">
                <Clock className="w-3 h-3 mr-1" />
                {roadmapProgress.upcomingSession}
              </Badge>
            )}
          </div>
        </motion.div>
      )}

      {/* Messages Container */}
      <div className="flex-1 overflow-y-auto space-y-3 mb-4 min-h-[400px]">
        {messages.length === 0 ? (
          <motion.div
            className="glass-card p-6 text-center"
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5 }}
          >
            <Sparkles className="w-16 h-16 text-purple-400 mx-auto mb-4" />
            <h3 className="text-white text-lg font-semibold mb-2">
              {t('student:studyPartnerWelcome')}
            </h3>
            <p className="text-white/70 text-sm mb-4">
              {t('student:studyPartnerWelcomeDesc')}
            </p>
            
            {/* Quick Start Prompts */}
            <div className="space-y-2">
              {quickStartPrompts.slice(0, 3).map((prompt, index) => (
                <button
                  key={index}
                  className="w-full px-4 py-2 bg-white/10 rounded-lg text-white/80 text-sm hover:bg-white/20 transition-colors"
                  onClick={() => handleQuickStart(prompt)}
                  data-testid={`button-quick-start-${index}`}
                >
                  {prompt}
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
              <div className={`max-w-[85%] ${message.role === 'user' ? 'items-end' : 'items-start'} flex gap-2`}>
                {message.role === 'assistant' && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                      <Bot className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
                
                <div className="space-y-1">
                  <div className={`
                    px-4 py-3 rounded-2xl
                    ${message.role === 'user' 
                      ? 'bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-br-md' 
                      : 'glass-card text-white rounded-bl-md'}
                  `}>
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>
                  
                  {/* Voice controls for AI messages */}
                  {message.role === 'assistant' && (
                    <div className="flex items-center gap-2 mt-2">
                      <button
                        onClick={() => speakText(message.content)}
                        disabled={isSpeaking}
                        className="p-1 rounded-full bg-white/10 hover:bg-white/20 transition-colors disabled:opacity-50"
                        data-testid={`button-speak-${message.id}`}
                      >
                        {isSpeaking ? (
                          <VolumeX className="w-4 h-4 text-white/70" />
                        ) : (
                          <Volume2 className="w-4 h-4 text-white/70" />
                        )}
                      </button>
                    </div>
                  )}
                  
                  {message.context && (
                    <p className="text-white/40 text-xs px-2 mt-1">
                      {message.context}
                    </p>
                  )}
                  
                  <p className="text-white/30 text-xs px-2 mt-1">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>

                {message.role === 'user' && (
                  <Avatar className="w-8 h-8 flex-shrink-0 mt-1">
                    <AvatarFallback className="bg-gradient-to-br from-blue-500 to-cyan-500">
                      <User className="w-5 h-5 text-white" />
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            </motion.div>
          ))
        )}
        {sendMessage.isPending && (
          <motion.div
            className="flex justify-start"
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-start gap-2">
              <Avatar className="w-8 h-8 flex-shrink-0">
                <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500">
                  <Bot className="w-5 h-5 text-white" />
                </AvatarFallback>
              </Avatar>
              <div className="glass-card px-4 py-3 rounded-2xl rounded-bl-md">
                <div className="flex space-x-1">
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }} />
                  <div className="w-2 h-2 bg-white/50 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }} />
                </div>
              </div>
            </div>
          </motion.div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <div className="glass-card p-3 flex items-center gap-3">
        <button
          className={`p-2 rounded-full transition-all ${
            isRecording 
              ? 'bg-red-500 animate-pulse' 
              : 'bg-white/10 hover:bg-white/20'
          }`}
          onClick={toggleRecording}
          data-testid="button-voice-input"
        >
          <Mic className="w-5 h-5 text-white" />
        </button>
        
        <input
          type="text"
          placeholder={t('student:askStudyPartner')}
          className="flex-1 bg-transparent text-white placeholder-white/50 outline-none"
          value={inputText}
          onChange={(e) => setInputText(e.target.value)}
          onKeyPress={(e) => {
            if (e.key === 'Enter' && inputText.trim()) {
              handleSend();
            }
          }}
          data-testid="input-message"
        />
        
        {inputText.trim() ? (
          <motion.button
            className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 disabled:opacity-50"
            whileTap={{ scale: 0.9 }}
            onClick={handleSend}
            disabled={sendMessage.isPending}
            data-testid="button-send"
          >
            <Send className="w-5 h-5 text-white" />
          </motion.button>
        ) : (
          <button
            className="p-2 rounded-full bg-white/10 hover:bg-white/20"
            onClick={() => setMessages([])}
            data-testid="button-clear-chat"
          >
            <RefreshCw className="w-5 h-5 text-white/70" />
          </button>
        )}
      </div>
    </MobileLayout>
  );
}