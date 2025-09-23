// ============================================================================
// LEXI AI TEACHING ASSISTANT - MAIN COMPONENT
// ============================================================================
// Floating chat interface with voice support and contextual learning assistance

import { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import {
  MessageCircle,
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  Send,
  Minimize2,
  Maximize2,
  BookOpen,
  Brain,
  Languages,
  Lightbulb,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Sparkles
} from 'lucide-react';

// Types for Lexi interactions
interface LexiMessage {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    vocabulary?: VocabularyItem[];
    suggestions?: string[];
    audioUrl?: string;
  };
}

interface VocabularyItem {
  word: string;
  definition: string;
  examples: string[];
}

interface LexiAssistantProps {
  // Video context (optional)
  videoId?: number;
  videoTimestamp?: number;
  courseId?: number;
  
  // Session configuration
  sessionType?: 'video_learning' | 'general_chat' | 'vocabulary' | 'grammar' | 'pronunciation';
  language?: string;
  userLevel?: string;
  
  // UI configuration
  initiallyMinimized?: boolean;
  position?: 'bottom-right' | 'bottom-left' | 'side-right' | 'side-left';
  theme?: 'light' | 'dark' | 'auto';
  
  // Callbacks
  onNewMessage?: (message: LexiMessage) => void;
  onVocabularyClick?: (word: string) => void;
  onSuggestionClick?: (suggestion: string) => void;
}

export function LexiAssistant({
  videoId,
  videoTimestamp,
  courseId,
  sessionType = 'general_chat',
  language = 'en',
  userLevel = 'intermediate',
  initiallyMinimized = false,
  position = 'bottom-right',
  theme = 'auto',
  onNewMessage,
  onVocabularyClick,
  onSuggestionClick
}: LexiAssistantProps) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  // UI State
  const [isMinimized, setIsMinimized] = useState(initiallyMinimized);
  const [isVisible, setIsVisible] = useState(true);
  const [currentMessage, setCurrentMessage] = useState('');
  const [messages, setMessages] = useState<LexiMessage[]>([]);
  const [conversationId, setConversationId] = useState<number | null>(null);
  
  // Voice State
  const [isListening, setIsListening] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  
  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  
  // Web Speech API support
  const [recognition, setRecognition] = useState<SpeechRecognition | null>(null);
  const [speechSynthesis, setSpeechSynthesis] = useState<SpeechSynthesis | null>(null);

  // Initialize speech APIs
  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Speech Recognition
      const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.lang = language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US';
        
        recognition.onresult = (event) => {
          const transcript = event.results[0][0].transcript;
          setCurrentMessage(transcript);
          setIsListening(false);
        };
        
        recognition.onerror = () => {
          setIsListening(false);
          toast({
            title: "Speech Recognition Error",
            description: "Could not recognize speech. Please try again.",
            variant: "destructive"
          });
        };
        
        setRecognition(recognition);
      }
      
      // Speech Synthesis
      if (window.speechSynthesis) {
        setSpeechSynthesis(window.speechSynthesis);
      }
    }
  }, [language, toast]);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (messageText: string) => {
      const response = await apiRequest('/api/lexi/chat', {
        method: 'POST',
        body: {
          message: messageText,
          conversationId,
          courseId,
          videoLessonId: videoId,
          videoTimestamp,
          sessionType,
          language,
          userLevel,
          contextData: {
            timestamp: new Date().toISOString(),
            userAgent: navigator.userAgent
          }
        }
      });
      return response;
    },
    onSuccess: (response) => {
      // Add user message
      const userMessage: LexiMessage = {
        id: `user-${Date.now()}`,
        role: 'user',
        content: currentMessage,
        timestamp: new Date()
      };
      
      // Add AI response
      const aiMessage: LexiMessage = {
        id: response.data.messageId,
        role: 'assistant',
        content: response.data.response,
        timestamp: new Date(),
        metadata: {
          suggestions: response.data.suggestions,
          audioUrl: response.data.audioUrl
        }
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      setConversationId(response.data.conversationId);
      setCurrentMessage('');
      
      // Play audio if available and enabled
      if (response.data.audioUrl && voiceEnabled && !isPlaying) {
        playAudio(response.data.audioUrl);
      }
      
      // Trigger callback
      onNewMessage?.(aiMessage);
    },
    onError: (error) => {
      toast({
        title: "Message Failed",
        description: "Could not send message. Please try again.",
        variant: "destructive"
      });
    }
  });

  // Send message handler
  const handleSendMessage = () => {
    if (!currentMessage.trim()) return;
    sendMessageMutation.mutate(currentMessage);
  };

  // Voice recording handler
  const handleVoiceToggle = () => {
    if (!recognition) {
      toast({
        title: "Voice Not Supported",
        description: "Speech recognition is not supported in your browser.",
        variant: "destructive"
      });
      return;
    }

    if (isListening) {
      recognition.stop();
      setIsListening(false);
    } else {
      recognition.start();
      setIsListening(true);
    }
  };

  // Audio playback handler
  const playAudio = (audioUrl: string) => {
    if (audioRef.current) {
      audioRef.current.src = audioUrl;
      audioRef.current.play()
        .then(() => setIsPlaying(true))
        .catch(() => {
          toast({
            title: "Audio Playback Failed",
            description: "Could not play audio response.",
            variant: "destructive"
          });
        });
    }
  };

  // Text-to-speech handler
  const speakText = (text: string) => {
    if (!speechSynthesis || !voiceEnabled) return;
    
    speechSynthesis.cancel(); // Stop any current speech
    
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'fa' ? 'fa-IR' : language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 0.9;
    utterance.pitch = 1;
    
    utterance.onstart = () => setIsPlaying(true);
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    speechSynthesis.speak(utterance);
  };

  // Keyboard handler
  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Suggestion click handler
  const handleSuggestionClick = (suggestion: string) => {
    setCurrentMessage(suggestion);
    onSuggestionClick?.(suggestion);
  };

  // Vocabulary click handler
  const handleVocabularyClick = (word: string) => {
    setCurrentMessage(`What does "${word}" mean?`);
    onVocabularyClick?.(word);
  };

  // Position classes
  const getPositionClasses = () => {
    switch (position) {
      case 'bottom-left':
        return 'bottom-4 left-4';
      case 'side-right':
        return 'top-1/2 right-4 -translate-y-1/2';
      case 'side-left':
        return 'top-1/2 left-4 -translate-y-1/2';
      default:
        return 'bottom-4 right-4';
    }
  };

  // RTL support
  const isRTL = language === 'fa' || language === 'ar';

  if (!isVisible) return null;

  return (
    <>
      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={() => setIsPlaying(false)}
        onError={() => setIsPlaying(false)}
      />

      {/* Main Lexi Assistant Interface */}
      <div 
        className={`fixed z-50 ${getPositionClasses()}`}
        style={{ maxWidth: isMinimized ? '60px' : '400px', maxHeight: isMinimized ? '60px' : '600px' }}
      >
        <Card className={`w-full h-full shadow-2xl border-2 ${isRTL ? 'rtl' : 'ltr'} ${
          theme === 'dark' ? 'bg-gray-900 border-gray-700' : 'bg-white border-purple-200'
        }`}>
          {/* Header */}
          <CardHeader className={`pb-3 ${theme === 'dark' ? 'bg-gray-800' : 'bg-gradient-to-r from-purple-500 to-blue-500'} text-white rounded-t-lg`}>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="relative">
                  <Brain className="w-5 h-5" />
                  <div className="absolute -top-1 -right-1 w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                </div>
                {!isMinimized && (
                  <div>
                    <CardTitle className="text-sm font-semibold">Lexi AI</CardTitle>
                    <p className="text-xs opacity-90">Your Learning Assistant</p>
                  </div>
                )}
              </div>
              
              <div className="flex items-center gap-1">
                {!isMinimized && (
                  <>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setVoiceEnabled(!voiceEnabled)}
                      className="text-white hover:bg-white/20 p-1"
                      data-testid="button-voice-toggle"
                    >
                      {voiceEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => window.location.reload()}
                      className="text-white hover:bg-white/20 p-1"
                      data-testid="button-refresh"
                    >
                      <RefreshCw className="w-4 h-4" />
                    </Button>
                  </>
                )}
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsMinimized(!isMinimized)}
                  className="text-white hover:bg-white/20 p-1"
                  data-testid="button-minimize"
                >
                  {isMinimized ? <Maximize2 className="w-4 h-4" /> : <Minimize2 className="w-4 h-4" />}
                </Button>
                
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setIsVisible(false)}
                  className="text-white hover:bg-white/20 p-1"
                  data-testid="button-close"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
            </div>
          </CardHeader>

          {/* Main Content - Only show when not minimized */}
          {!isMinimized && (
            <CardContent className="p-0 flex flex-col h-96">
              {/* Session Info */}
              <div className="p-3 border-b bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    <Languages className="w-3 h-3 mr-1" />
                    {sessionType}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {language.toUpperCase()}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {userLevel}
                  </Badge>
                  {videoId && (
                    <Badge variant="outline" className="text-xs">
                      <BookOpen className="w-3 h-3 mr-1" />
                      Video {videoId}
                    </Badge>
                  )}
                </div>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-3">
                <div className="space-y-3">
                  {messages.length === 0 && (
                    <div className="text-center py-8 text-gray-500">
                      <Sparkles className="w-8 h-8 mx-auto mb-2 text-purple-400" />
                      <p className="text-sm">Hi! I'm Lexi, your AI learning assistant.</p>
                      <p className="text-xs mt-1">Ask me anything about your learning!</p>
                    </div>
                  )}
                  
                  {messages.map((message) => (
                    <div
                      key={message.id}
                      className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      data-testid={`message-${message.role}-${message.id}`}
                    >
                      <div
                        className={`max-w-[85%] rounded-lg p-3 ${
                          message.role === 'user'
                            ? 'bg-purple-500 text-white'
                            : 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                        
                        {/* Audio playback button */}
                        {message.metadata?.audioUrl && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => playAudio(message.metadata!.audioUrl!)}
                            className="mt-2 p-1 h-auto"
                            disabled={isPlaying}
                            data-testid="button-play-audio"
                          >
                            <Volume2 className="w-3 h-3 mr-1" />
                            Play
                          </Button>
                        )}
                        
                        {/* Suggestions */}
                        {message.metadata?.suggestions && message.metadata.suggestions.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.suggestions.map((suggestion, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleSuggestionClick(suggestion)}
                                className="text-xs mr-1 mb-1 h-auto py-1"
                                data-testid={`button-suggestion-${idx}`}
                              >
                                <Lightbulb className="w-3 h-3 mr-1" />
                                {suggestion}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        {/* Vocabulary items */}
                        {message.metadata?.vocabulary && message.metadata.vocabulary.length > 0 && (
                          <div className="mt-2 space-y-1">
                            {message.metadata.vocabulary.map((vocab, idx) => (
                              <Button
                                key={idx}
                                variant="outline"
                                size="sm"
                                onClick={() => handleVocabularyClick(vocab.word)}
                                className="text-xs mr-1 mb-1 h-auto py-1"
                                data-testid={`button-vocabulary-${idx}`}
                              >
                                📖 {vocab.word}
                              </Button>
                            ))}
                          </div>
                        )}
                        
                        <p className="text-xs opacity-60 mt-1">
                          {message.timestamp.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                  ))}
                  
                  {/* Loading indicator */}
                  {sendMessageMutation.isPending && (
                    <div className="flex justify-start">
                      <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-3">
                        <div className="flex items-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-purple-500"></div>
                          <span className="text-sm text-gray-600 dark:text-gray-300">Thinking...</span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div ref={messagesEndRef} />
              </ScrollArea>

              <Separator />

              {/* Input Area */}
              <div className="p-3">
                <div className="flex items-center gap-2">
                  <div className="flex-1 relative">
                    <Input
                      ref={inputRef}
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={`Ask Lexi anything in ${language}...`}
                      disabled={sendMessageMutation.isPending}
                      className={`pr-12 ${isRTL ? 'text-right' : 'text-left'}`}
                      dir={isRTL ? 'rtl' : 'ltr'}
                      data-testid="input-message"
                    />
                    
                    {/* Voice input button */}
                    {recognition && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={handleVoiceToggle}
                        className={`absolute ${isRTL ? 'left-1' : 'right-1'} top-1/2 -translate-y-1/2 p-1`}
                        disabled={sendMessageMutation.isPending}
                        data-testid="button-voice-input"
                      >
                        {isListening ? (
                          <MicOff className="w-4 h-4 text-red-500 animate-pulse" />
                        ) : (
                          <Mic className="w-4 h-4 text-gray-500" />
                        )}
                      </Button>
                    )}
                  </div>
                  
                  <Button
                    onClick={handleSendMessage}
                    disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                    size="sm"
                    data-testid="button-send"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </CardContent>
          )}
        </Card>
      </div>
    </>
  );
}

// Helper function to show Lexi globally
export function showLexiAssistant(props?: Partial<LexiAssistantProps>) {
  // This would be used to programmatically show Lexi
  // Implementation depends on your app's state management
  console.log('Showing Lexi Assistant', props);
}