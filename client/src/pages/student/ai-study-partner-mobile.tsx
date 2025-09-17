import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { queryClient, apiRequest } from '@/lib/queryClient';
import { MobileLayout } from '@/components/mobile/MobileLayout';
import { motion, AnimatePresence } from 'framer-motion';
import { useTranslation } from 'react-i18next';
import { speechRecognitionService } from '@/services/speech-recognition-service';
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
  Clock,
  X
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
  const [continuousMode, setContinuousMode] = useState(true); // Enable continuous conversation by default
  const [dynamicMode, setDynamicMode] = useState(false); // ChatGPT-style dynamic interface
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
  // Temporarily disable speech recognition to fix infinite loop issue
  // const speechRecognition = useRef<SpeechRecognitionService>(new SpeechRecognitionService());
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

  // Text-to-Speech for AI responses - FIXED TTS FEEDBACK LOOP
  const speakText = async (text: string, language: string = 'en') => {
    try {
      setIsSpeaking(true);
      setIsRecording(false);
      
      // Stop any current audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }

      // Strip emojis from TTS to prevent feedback loop (safe regex)
      const cleanText = text.replace(/\p{Extended_Pictographic}/gu, '').trim();
      
      // CRITICAL: Begin TTS guard BEFORE any audio operations
      speechRecognitionService.beginTTSGuard(cleanText);
      
      const response = await apiRequest('/api/ai-study-partner/tts', {
        method: 'POST',
        body: JSON.stringify({ text: cleanText, language })
      });

      if (response.success && response.audioUrl) {
        const audio = new Audio(response.audioUrl);
        currentAudio.current = audio;
        
        audio.onended = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
          
          // CRITICAL: End TTS guard AFTER audio finishes
          speechRecognitionService.endTTSGuard();
          
          // CONTINUOUS MODE: Auto-restart speech recognition after delay
          if (continuousMode) {
            setTimeout(async () => {
              try {
                setIsRecording(true);
                await speechRecognitionService.startListening(
                  `continuous-session-${Date.now()}`,
                  'en-US',
                  handleSpeechResult,
                  (analysis) => console.log('Speech analysis:', analysis)
                );
                console.log('🔄 Continuous mode: Listening for your next message...');
              } catch (error) {
                console.error('Failed to restart continuous mode:', error);
                setIsRecording(false);
              }
            }, 800); // Longer delay to prevent feedback
          }
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
          // CRITICAL: End TTS guard even on error
          speechRecognitionService.endTTSGuard();
        };

        await audio.play();
      } else {
        setIsSpeaking(false);
        // CRITICAL: End TTS guard if TTS failed
        speechRecognitionService.endTTSGuard();
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      // CRITICAL: End TTS guard even on error
      speechRecognitionService.endTTSGuard();
      toast({
        title: t('common:error'),
        description: t('student:ttsError'),
        variant: 'destructive'
      });
    }
  }

  // Voice Recognition
  const toggleRecording = async () => {
    if (!isRecording) {
      await startRecording();
    } else {
      stopRecording();
    }
  };

  // Shared speech result handler for both manual and continuous modes
  const handleSpeechResult = (result: any) => {
    if (result.isFinal) {
      setInputText(result.text);
      setIsRecording(false);
      // In continuous mode, don't stop - let it continue listening
      if (!continuousMode) {
        speechRecognitionService.stopListening();
      }
      toast({
        title: t('student:speechCaptured'),
        description: result.text,
      });
      
      // Auto-send in continuous mode for seamless conversation
      if (continuousMode && result.text.trim()) {
        setTimeout(() => {
          const userMessage = {
            id: Date.now().toString(),
            role: 'user' as const,
            content: result.text,
            timestamp: new Date()
          };
          setMessages(prev => [...prev, userMessage]);
          sendMessage.mutate(result.text);
          setInputText('');
        }, 500);
      }
    } else {
      // Only show interim results if we're still actively recording
      if (isRecording) {
        setInputText(result.text);
      }
    }
  };

  const startRecording = async () => {
    setIsRecording(true);
    setInputText('');
    
    try {
      await speechRecognitionService.startListening(
        `study-session-${Date.now()}`,
        'en-US',
        handleSpeechResult,
        (analysis) => {
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
    speechRecognitionService.stopListening();
    
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
      title="Lexi - Turn minutes into progress"
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
      {/* ChatGPT-Style Dynamic Voice Interface */}
      <AnimatePresence>
        {dynamicMode && (
          <motion.div 
            className="fixed inset-0 z-50 bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900 flex flex-col items-center justify-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            {/* Dynamic Circle - Changes size when AI speaks */}
            <div className="relative flex items-center justify-center">
              <motion.div
                className={`
                  rounded-full bg-gradient-to-r from-blue-400 via-purple-500 to-blue-600 
                  ${isSpeaking ? 'shadow-2xl shadow-purple-500/50' : 'shadow-lg shadow-blue-500/30'}
                `}
                animate={{
                  scale: isSpeaking ? [1, 1.3, 1.1, 1.4, 1.2] : [1, 1.05, 1],
                  rotate: isSpeaking ? [0, 5, -5, 10, -10, 0] : [0, 2, -2, 0],
                }}
                transition={{
                  scale: {
                    duration: isSpeaking ? 2 : 3,
                    repeat: Infinity,
                    ease: "easeInOut"
                  },
                  rotate: {
                    duration: isSpeaking ? 1.5 : 4,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }
                }}
                style={{
                  width: isSpeaking ? '200px' : '150px',
                  height: isSpeaking ? '200px' : '150px',
                }}
              >
                {/* Inner pulsing circle */}
                <motion.div
                  className="absolute inset-2 rounded-full bg-white/20 backdrop-blur-sm"
                  animate={{
                    opacity: isSpeaking ? [0.2, 0.8, 0.2] : [0.1, 0.3, 0.1],
                    scale: isSpeaking ? [0.8, 1.1, 0.8] : [0.9, 1, 0.9],
                  }}
                  transition={{
                    duration: isSpeaking ? 1 : 2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
                
                {/* Center logo/icon */}
                <div className="absolute inset-0 flex items-center justify-center">
                  <motion.div
                    animate={{ scale: isSpeaking ? [1, 0.9, 1] : 1 }}
                    transition={{ duration: 0.5, repeat: Infinity }}
                  >
                    <Bot className="w-12 h-12 text-white" />
                  </motion.div>
                </div>
              </motion.div>
              
              {/* Sound waves animation when speaking */}
              {isSpeaking && (
                <>
                  {[...Array(3)].map((_, i) => (
                    <motion.div
                      key={i}
                      className="absolute rounded-full border-2 border-white/30"
                      initial={{ scale: 1, opacity: 0.7 }}
                      animate={{ 
                        scale: [1, 2, 3], 
                        opacity: [0.7, 0.3, 0] 
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        delay: i * 0.4,
                        ease: "easeOut"
                      }}
                      style={{
                        width: '150px',
                        height: '150px',
                        left: '25px',
                        top: '25px'
                      }}
                    />
                  ))}
                </>
              )}
            </div>
            
            {/* Status Text */}
            <motion.div 
              className="mt-8 text-center"
              animate={{ opacity: [0.7, 1, 0.7] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <h2 className="text-white text-xl font-medium mb-2">
                {isSpeaking ? 'Lexi is speaking...' : isRecording ? 'Listening...' : 'Tap to speak'}
              </h2>
              <p className="text-white/60 text-sm">
                Turn minutes into progress
              </p>
            </motion.div>
            
            {/* Bottom Controls */}
            <div className="absolute bottom-8 flex items-center justify-center gap-6">
              {/* Mic Button */}
              <motion.button
                className={`
                  p-4 rounded-full transition-all shadow-lg
                  ${
                    isRecording 
                      ? 'bg-red-500 animate-pulse' 
                      : 'bg-white/20 backdrop-blur-sm hover:bg-white/30'
                  }
                `}
                whileTap={{ scale: 0.9 }}
                onClick={toggleRecording}
                data-testid="dynamic-mic-button"
              >
                <Mic className="w-6 h-6 text-white" />
              </motion.button>
              
              {/* Close Button */}
              <motion.button
                className="p-4 rounded-full bg-white/20 backdrop-blur-sm hover:bg-white/30 transition-all shadow-lg"
                whileTap={{ scale: 0.9 }}
                onClick={() => {
                  setDynamicMode(false);
                  speechRecognitionService.stopListening();
                  setIsRecording(false);
                }}
                data-testid="dynamic-close-button"
              >
                <X className="w-6 h-6 text-white" />
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
      
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

            {/* Dynamic Voice Mode Button (ChatGPT Style) */}
            <div className="mb-4">
              <button
                onClick={() => {
                  setDynamicMode(true);
                  setContinuousMode(true);
                  setShowSettings(false);
                  // Auto-start recording in dynamic mode
                  setTimeout(() => {
                    startRecording();
                  }, 500);
                }}
                className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4 rounded-xl font-medium transition-all hover:shadow-lg hover:scale-105"
                data-testid="button-dynamic-mode"
              >
                🎤 Start Voice Conversation
                <p className="text-xs text-white/80 mt-1">ChatGPT-style continuous conversation</p>
              </button>
            </div>
            
            {/* Continuous Conversation Mode Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Continuous Conversation</p>
                  <p className="text-white/50 text-xs">Auto-listen after Lexi responds</p>
                </div>
                <button
                  onClick={() => setContinuousMode(!continuousMode)}
                  className={`
                    relative w-12 h-6 rounded-full transition-colors
                    ${continuousMode ? 'bg-purple-500' : 'bg-white/20'}
                  `}
                  data-testid="toggle-continuous-mode"
                >
                  <div className={`
                    absolute w-5 h-5 bg-white rounded-full transition-transform top-0.5
                    ${continuousMode ? 'translate-x-6' : 'translate-x-0.5'}
                  `} />
                </button>
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
              Hi! I'm Lexi 👋
            </h3>
            <p className="text-white/70 text-sm mb-4">
              Your AI language learning partner. Let's turn minutes into progress together!
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
                    <AvatarFallback className="bg-gradient-to-br from-purple-500 to-pink-500 font-bold text-white">
                      L
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
        {/* Continuous mode status */}
        {continuousMode && (
          <div className="text-xs text-green-300 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Auto-listen
          </div>
        )}
        
        <div className="relative">
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
          
          {/* Continuous mode indicator on mic */}
          {continuousMode && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full border border-white" />
          )}
        </div>
        
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