import React, { useState, useRef, useEffect, useCallback } from 'react';
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
  const [continuousMode, setContinuousMode] = useState(true); // Enable continuous conversation by default
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Finite State Machine for conversation control
  type ConversationState = 'IDLE' | 'LISTENING' | 'THINKING' | 'SPEAKING' | 'COOLDOWN';
  const [conversationState, setConversationState] = useState<ConversationState>('IDLE');
  
  // STT Session Controller - prevent concurrent sessions
  const [sttSessionId, setSttSessionId] = useState<string | null>(null);
  
  // Echo filter and deduplication
  const [lastAssistantText, setLastAssistantText] = useState('');
  const [recentMessages, setRecentMessages] = useState<Set<string>>(new Set());
  const cooldownTimeoutRef = useRef<NodeJS.Timeout | null>(null);
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
      
      // Set last assistant text for echo filter (strip emojis)
      setLastAssistantText(data.response.replace(/[\u{1f300}-\u{1ffc0}]/gu, '').trim());
      
      // Auto-speak AI responses in focused/exam-prep mode
      if (settings.studyMode === 'focused' || settings.studyMode === 'exam-prep') {
        speakText(data.response);
      } else {
        // No TTS - return to IDLE or start listening in continuous mode
        if (continuousMode) {
          startCooldownToListening();
        } else {
          setConversationState('IDLE');
        }
      }
      
      // Invalidate and refetch conversation history
      queryClient.invalidateQueries({ queryKey: ['/api/ai-study-partner/messages'] })
    },
    onError: () => {
      // Reset state on error
      setConversationState('IDLE');
      
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

  // Auto-send when speech is detected - with finite state machine control
  const handleAutoSend = useCallback((text: string) => {
    if (!text.trim() || !continuousMode) return;
    
    // State machine guard - only send if we're LISTENING
    if (conversationState !== 'LISTENING') {
      console.log('Auto-send blocked - not in LISTENING state:', conversationState);
      return;
    }
    
    // Echo filter - don't respond to our own TTS
    const normalizedText = text.trim().toLowerCase();
    const normalizedLastAssistant = lastAssistantText.toLowerCase();
    
    // Check for similarity to last assistant message
    if (normalizedLastAssistant && normalizedText.includes(normalizedLastAssistant.substring(0, 20))) {
      console.log('Echo filter: Blocking similar text to last assistant message');
      return;
    }
    
    // Deduplication filter
    if (recentMessages.has(normalizedText)) {
      console.log('Deduplication filter: Blocking duplicate message');
      return;
    }
    
    // Add to recent messages with TTL
    const newRecentMessages = new Set(recentMessages);
    newRecentMessages.add(normalizedText);
    setRecentMessages(newRecentMessages);
    
    // Clear from recent messages after 10 seconds
    setTimeout(() => {
      setRecentMessages(prev => {
        const updated = new Set(prev);
        updated.delete(normalizedText);
        return updated;
      });
    }, 10000);
    
    // Add user message immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text.trim(),
      timestamp: new Date()
    };
    setMessages(prev => [...prev, userMessage]);
    
    // Transition to THINKING state
    setConversationState('THINKING');
    
    // Send message
    sendMessage.mutate(text.trim());
  }, [continuousMode, sendMessage, conversationState, lastAssistantText, recentMessages]);

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
    
    // CRITICAL FIX: Set THINKING state before mutate
    setConversationState('THINKING');
    
    sendMessage.mutate(inputText);
    setInputText('');
  };

  const handleQuickStart = (prompt: string) => {
    setInputText(prompt);
    setTimeout(() => handleSend(), 100);
  };

  // Clear cooldown timeout helper
  const clearCooldownTimeout = useCallback(() => {
    if (cooldownTimeoutRef.current) {
      clearTimeout(cooldownTimeoutRef.current);
      cooldownTimeoutRef.current = null;
    }
  }, []);

  // Start cooldown to LISTENING transition
  const startCooldownToListening = useCallback(async () => {
    clearCooldownTimeout();
    
    cooldownTimeoutRef.current = setTimeout(async () => {
      try {
        // CRITICAL FIX: Reuse existing session ID in continuous mode for seamless restart
        let sessionId = sttSessionId;
        if (!sessionId) {
          sessionId = `continuous-session-${Date.now()}`;
          setSttSessionId(sessionId);
        }
        
        // FSM: Transition to LISTENING state before starting STT
        setConversationState('LISTENING');
        setIsRecording(true);
        
        await speechRecognitionService.startListening(
          sessionId,
          'en-US',
          handleSpeechResult,
          (analysis) => console.log('Speech analysis:', analysis)
        );
        console.log('FSM: COOLDOWN → LISTENING. Continuous mode restarted with session:', sessionId);
      } catch (error) {
        console.error('Failed to restart continuous mode:', error);
        setIsRecording(false);
        setConversationState('IDLE');
        setSttSessionId(null);
      }
    }, 500); // Brief cooldown period
  }, [clearCooldownTimeout, sttSessionId]);

  // Text-to-Speech for AI responses
  const speakText = async (text: string, language: string = 'en') => {
    try {
      setIsSpeaking(true);
      
      // CRITICAL FIX: Set COOLDOWN at TTS start (align with architect's design)
      setConversationState('COOLDOWN');
      
      // Clear any pending cooldown transitions
      clearCooldownTimeout();
      
      // CRITICAL: Pause speech recognition to prevent feedback loop!
      if (isRecording) {
        speechRecognitionService.pauseForTTS();
        setIsRecording(false);
        // CRITICAL FIX: In continuous mode, preserve session ID for seamless restart
        if (!continuousMode) {
          setSttSessionId(null); // Only clear session ID in manual mode
        }
      }
      
      // Stop any current audio
      if (currentAudio.current) {
        currentAudio.current.pause();
        currentAudio.current = null;
      }

      // Strip emojis from TTS to prevent feedback loop
      const cleanText = text.replace(/[\u{1F600}-\u{1F64F}]|[\u{1F300}-\u{1F5FF}]|[\u{1F680}-\u{1F6FF}]|[\u{1F1E0}-\u{1F1FF}]|[\u{2600}-\u{26FF}]|[\u{2700}-\u{27BF}]/gu, '').trim();
      
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
          
          speechRecognitionService.resumeAfterTTS();
          if (continuousMode) {
            // COOLDOWN→LISTENING transition after TTS ends + cooldown
            startCooldownToListening();
          } else {
            // Return to IDLE if not in continuous mode
            setConversationState('IDLE');
          }
        };
        
        audio.onerror = () => {
          setIsSpeaking(false);
          currentAudio.current = null;
          speechRecognitionService.resumeAfterTTS();
          
          // CRITICAL FIX: On TTS error in continuous mode, run same COOLDOWN→LISTENING restart path
          if (continuousMode) {
            startCooldownToListening();
          } else {
            setConversationState('IDLE');
          }
        };

        await audio.play();
      } else {
        setIsSpeaking(false);
        speechRecognitionService.resumeAfterTTS();
        
        // Handle TTS failure - same restart logic
        if (continuousMode) {
          startCooldownToListening();
        } else {
          setConversationState('IDLE');
        }
      }
    } catch (error) {
      console.error('TTS error:', error);
      setIsSpeaking(false);
      speechRecognitionService.resumeAfterTTS();
      
      // Handle TTS exception - same restart logic
      if (continuousMode) {
        startCooldownToListening();
      } else {
        setConversationState('IDLE');
      }
      
      toast({
        title: t('common:error'),
        description: t('student:ttsError'),
        variant: 'destructive'
      });
    }
  };

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
      
      // CRITICAL FIX: In continuous mode, ensure we're in LISTENING state for auto-send
      if (continuousMode) {
        // Keep conversation state as LISTENING for continuous flow
        setConversationState('LISTENING');
        // Don't set isRecording to false yet - keep listening
        console.log('Continuous mode: Speech captured, staying in LISTENING state');
      } else {
        // Manual mode - stop recording and listening
        setIsRecording(false);
        speechRecognitionService.stopListening();
      }
      
      toast({
        title: t('student:speechCaptured'),
        description: result.text,
      });
      
      // Auto-send in continuous mode - IMMEDIATE for ChatGPT-like flow
      if (continuousMode && result.text.trim()) {
        // Immediately process - no timeout needed since we're already in LISTENING
        handleAutoSend(result.text.trim());
        // Don't clear input immediately - let user see what they said!
        // Input will be cleared when the next speech starts or manually cleared
      }
    } else {
      // Show interim results during recording
      setInputText(result.text);
    }
  };

  const startRecording = async () => {
    // CRITICAL FIX: Block startRecording unless state is IDLE/COOLDOWN and !isRecording
    if (isRecording || (conversationState !== 'IDLE' && conversationState !== 'COOLDOWN')) {
      console.log('STT blocked - invalid state:', { isRecording, conversationState });
      return;
    }
    
    // Clear any pending cooldown transitions to prevent conflicts
    clearCooldownTimeout();
    
    setIsRecording(true);
    setInputText('');
    
    // Generate new session ID
    const newSessionId = `study-session-${Date.now()}`;
    setSttSessionId(newSessionId);
    
    // FSM: Transition to LISTENING state when STT starts
    setConversationState('LISTENING');
    
    try {
      await speechRecognitionService.startListening(
        newSessionId,
        'en-US',
        handleSpeechResult,
        (analysis) => {
          console.log('Speech analysis:', analysis);
        }
      );
      console.log('FSM: IDLE/COOLDOWN → LISTENING. Speech recognition started.');
    } catch (error) {
      setIsRecording(false);
      setConversationState('IDLE'); // Reset to IDLE on error
      setSttSessionId(null);
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
    setSttSessionId(null); // Clear session ID
    clearCooldownTimeout(); // Clear any pending transitions
    
    toast({
      title: t('student:processingAudio'),
      description: t('student:pleaseWait'),
    });
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Automatic greeting on first entry - level-appropriate
  useEffect(() => {
    const shouldShowGreeting = conversationHistory && 
                              conversationHistory.length === 0 && 
                              messages.length === 0 && 
                              !sendMessage.isPending;
    
    if (shouldShowGreeting) {
      // Delay greeting slightly to ensure component is fully loaded
      const timer = setTimeout(() => {
        console.log('🎯 FIRST ENTRY - Sending automatic level-appropriate greeting');
        sendMessage.mutate('__first_entry__');
      }, 1000);
      
      return () => clearTimeout(timer);
    }
  }, [conversationHistory, messages.length, sendMessage]);

  // Cleanup on unmount - prevent memory leaks
  useEffect(() => {
    return () => {
      clearCooldownTimeout();
      if (isRecording) {
        speechRecognitionService.stopListening();
      }
    };
  }, [clearCooldownTimeout, isRecording]);

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
      showSettings={false}
    >
      {/* Settings Button */}
      <div className="flex justify-end mb-4">
        <button 
          className="p-2 rounded-full glass-button"
          onClick={() => setShowSettings(!showSettings)}
          data-testid="button-settings"
        >
          <Settings className="w-5 h-5 text-white" />
        </button>
      </div>

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

            {/* Continuous Conversation Mode Toggle */}
            <div className="mb-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-white/70 text-sm mb-1">Continuous Conversation</p>
                  <p className="text-white/50 text-xs">Auto-conversation like ChatGPT (no clicking send)</p>
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

      {/* ChatGPT-Style Input Area */}
      <div className="relative">
        {/* Continuous mode status indicator */}
        {continuousMode && (
          <div className="absolute -top-8 left-0 text-xs text-green-300 flex items-center gap-1">
            <div className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
            Auto-conversation mode
          </div>
        )}
        
        <div className="relative bg-white/10 backdrop-blur-md rounded-full border border-white/20 p-3 flex items-center gap-3">
          {/* Plus icon */}
          <div className="flex-shrink-0">
            <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center">
              <span className="text-white/80 text-lg font-light">+</span>
            </div>
          </div>
          
          {/* Input field */}
          <input
            type="text"
            placeholder="Ask anything"
            className="flex-1 bg-transparent text-white placeholder-white/60 outline-none text-base"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyPress={(e) => {
              if (e.key === 'Enter' && inputText.trim()) {
                handleSend();
              }
            }}
            data-testid="input-message"
          />
          
          {/* Right side buttons - ChatGPT style */}
          <div className="flex items-center gap-2 flex-shrink-0">
            {/* Voice chat button - always continuous mode */}
            <button
              className={`relative w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                isRecording 
                  ? 'bg-red-500/20 border border-red-400' 
                  : 'bg-green-500/20 border border-green-400 hover:bg-green-500/30'
              }`}
              onClick={toggleRecording}
              data-testid="button-voice-chat"
              title="Voice Chat (Continuous Conversation)"
            >
              <Mic className={`w-5 h-5 ${
                isRecording ? 'text-red-400' : 'text-green-400'
              }`} />
              
              {/* Recording indicator */}
              {isRecording && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-red-400 rounded-full animate-pulse" />
              )}
              
              {/* Continuous mode always active indicator */}
              {!isRecording && (
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-400 rounded-full" />
              )}
            </button>
            
            {/* Text chat button - Send button for text */}
            <motion.button
              className={`w-10 h-10 rounded-full transition-all flex items-center justify-center ${
                inputText.trim() 
                  ? 'bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600' 
                  : 'bg-white/10 hover:bg-white/20'
              }`}
              whileTap={{ scale: 0.9 }}
              onClick={handleSend}
              disabled={sendMessage.isPending || !inputText.trim()}
              data-testid="button-text-chat"
              title="Send Text Message"
            >
              <Send className={`w-5 h-5 ${
                inputText.trim() ? 'text-white' : 'text-white/60'
              }`} />
            </motion.button>
          </div>
        </div>
      </div>
    </MobileLayout>
  );
}