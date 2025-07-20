import { useState, useEffect, useRef } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Mic, 
  MicOff, 
  Volume2, 
  VolumeX,
  Heart,
  Star,
  Sparkles,
  Lightbulb,
  ThumbsUp,
  Smile,
  Book,
  Trophy,
  Zap
} from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { useLanguage } from "@/hooks/use-language";

// Simple language detection for Lexi - SINGLE LANGUAGE DISPLAY
const getCurrentLanguage = () => {
  const saved = localStorage.getItem('meta-lingua-language');
  return saved === 'fa' ? 'fa' : 'en';
};

interface CompanionMessage {
  id: string;
  type: 'user' | 'companion';
  content: string;
  timestamp: Date;
  emotion?: 'happy' | 'excited' | 'encouraging' | 'thinking' | 'celebrating';
  culturalTip?: string;
  pronunciation?: string;
}

interface CompanionProps {
  isVisible: boolean;
  onToggle: () => void;
  studentLevel: 'beginner' | 'intermediate' | 'advanced';
  currentLesson?: string;
}

export default function AICompanion({ isVisible, onToggle, studentLevel, currentLesson }: CompanionProps) {
  const [messages, setMessages] = useState<CompanionMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  // Fetch real companion stats from API
  const { data: companionStats } = useQuery({
    queryKey: ['/api/ai/companion-stats'],
    select: (data: any) => data || {
      conversations: 0,
      helpfulTips: 0,
      encouragements: 0
    }
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const currentLanguage = getCurrentLanguage();

  // Use comprehensive i18n system instead of hardcoded translations
  const { t } = useLanguage();

  // PRD-compliant responses - SINGLE LANGUAGE ONLY
  const getPersonalizedResponse = (message: string, currentLang: string) => {
    const lowerMessage = message.toLowerCase();
    
    // PERSIAN MODE - Only Persian responses
    if (currentLang === 'fa') {
      if (lowerMessage.includes('سلام') || lowerMessage.includes('hello')) {
        return {
          content: "سلام عزیز! من لکسی هستم، دستیار هوشمند یادگیری شما. چطور می‌تونم کمکتون کنم؟",
          emotion: 'happy' as const,
          culturalTip: "در فرهنگ ایرانی، سلام گرم و صمیمانه خیلی مهمه!",
          pronunciation: "سلام [sa-LAM]"
        };
      }
      if (lowerMessage.includes('ممنون') || lowerMessage.includes('تشکر')) {
        return {
          content: "خواهش می‌کنم! خوشحالم که تونستم کمکتون کنم.",
          emotion: 'celebrating' as const,
          culturalTip: "تشکر کردن در فرهنگ ایرانی نشان‌دهنده ادب و احترامه"
        };
      }
      if (lowerMessage.includes('فرهنگ')) {
        return {
          content: "ایران فرهنگ غنی و زیبایی داره! از شعر حافظ تا مهمان‌نوازی ایرانی.",
          emotion: 'excited' as const,
          culturalTip: "مهمان‌نوازی یکی از مهمترین ارزش‌های فرهنگ ایرانیه"
        };
      }
      if (lowerMessage.includes('کمک') || lowerMessage.includes('help')) {
        return {
          content: "البته! من اینجام تا کمکتون کنم. می‌تونم درباره فرهنگ، زبان، یا تمرین‌های یادگیری صحبت کنیم.",
          emotion: 'encouraging' as const
        };
      }
      return {
        content: "جالبه! بیشتر توضیح بدید تا بتونم بهتر کمکتون کنم.",
        emotion: 'thinking' as const
      };
    } 
    
    // ENGLISH MODE - Only English responses
    else {
      if (lowerMessage.includes('hello') || lowerMessage.includes('hi')) {
        return {
          content: "Hello! I'm Lexi, your AI learning companion. How can I help you today?",
          emotion: 'happy' as const,
          culturalTip: "In Persian culture, warm greetings are very important!",
          pronunciation: "Hello [heh-LOH]"
        };
      }
      if (lowerMessage.includes('thanks') || lowerMessage.includes('thank you')) {
        return {
          content: "You're welcome! I'm happy to help. Ready to learn more?",
          emotion: 'celebrating' as const,
          culturalTip: "Gratitude is a key value in Iranian culture"
        };
      }
      if (lowerMessage.includes('culture')) {
        return {
          content: "Iran has such a rich culture! From Hafez poetry to Iranian hospitality.",
          emotion: 'excited' as const,
          culturalTip: "Hospitality is one of the most important values in Iranian culture"
        };
      }
      if (lowerMessage.includes('help')) {
        return {
          content: "Of course! I'm here to help. We can talk about culture, language, or practice exercises.",
          emotion: 'encouraging' as const
        };
      }
      return {
        content: "That's interesting! Tell me more so I can help you better.",
        emotion: 'thinking' as const
      };
    }
  };

  // AI Companion Chat - Dynamic AI Integration
  const sendToCompanion = useMutation({
    mutationFn: async (data: { message: string; context: any }) => {
      const response = await fetch('/api/ai/companion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: data.message,
          language: currentLanguage,
          studentLevel: data.context.level,
          currentLesson: data.context.lesson
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }
      
      return await response.json();
    },
    onSuccess: (response) => {
      const companionMessage: CompanionMessage = {
        id: Date.now().toString() + '_companion',
        type: 'companion',
        content: response.content,
        timestamp: new Date(),
        emotion: response.emotion,
        culturalTip: response.culturalTip,
        pronunciation: response.pronunciation
      };
      setMessages(prev => [...prev, companionMessage]);
      setCompanionStats(prev => ({ ...prev, conversations: prev.conversations + 1 }));
    },
    onError: (error) => {
      toast({
        title: currentLanguage === 'fa' ? "خطا" : "Error",
        description: currentLanguage === 'fa' ? "مشکلی در ارسال پیام پیش آمد" : "Failed to send message",
        variant: "destructive"
      });
    }
  });

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: CompanionMessage = {
      id: Date.now().toString() + '_user',
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    
    sendToCompanion.mutate({
      message: inputMessage,
      context: { level: studentLevel, lesson: currentLesson }
    });

    setInputMessage("");
  };

  // Welcome message on first open
  useEffect(() => {
    if (isVisible && messages.length === 0) {
      const welcomeMessage: CompanionMessage = {
        id: 'welcome',
        type: 'companion',
        content: currentLanguage === 'fa' 
          ? "سلام! من لکسی هستم، دستیار یادگیری شما. آماده‌اید برای یادگیری جالب؟" 
          : "Hi! I'm Lexi, your learning companion. Ready for some fun learning?",
        timestamp: new Date(),
        emotion: 'happy'
      };
      setMessages([welcomeMessage]);
    }
  }, [isVisible, currentLanguage]);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const getEmotionIcon = (emotion?: string) => {
    switch (emotion) {
      case 'happy': return <Smile className="w-4 h-4 text-yellow-500" />;
      case 'excited': return <Zap className="w-4 h-4 text-orange-500" />;
      case 'encouraging': return <ThumbsUp className="w-4 h-4 text-green-500" />;
      case 'thinking': return <Lightbulb className="w-4 h-4 text-blue-500" />;
      case 'celebrating': return <Trophy className="w-4 h-4 text-purple-500" />;
      default: return <Heart className="w-4 h-4 text-pink-500" />;
    }
  };

  const quickActions = [
    { 
      key: 'help', 
      label: t('help'), 
      icon: <Lightbulb className="w-4 h-4" /> 
    },
    { 
      key: 'practice', 
      label: t('practice'), 
      icon: <Book className="w-4 h-4" /> 
    },
    { 
      key: 'culture', 
      label: t('culture'), 
      icon: <Star className="w-4 h-4" /> 
    },
    { 
      key: 'tips', 
      label: t('tips'), 
      icon: <Sparkles className="w-4 h-4" /> 
    }
  ];

  const handleQuickAction = (action: string) => {
    const actionMessages: any = {
      fa: {
        help: "کمک",
        practice: "می‌خوام تمرین کنم",
        culture: "درباره فرهنگ ایران بگو",
        tips: "نکاتی برای یادگیری بهتر بده"
      },
      en: {
        help: "help",
        practice: "I want to practice",
        culture: "tell me about Iranian culture", 
        tips: "give me learning tips"
      }
    };
    
    const message = actionMessages[currentLanguage]?.[action] || action;
    setInputMessage(message);
    handleSendMessage();
  };

  if (!isVisible) {
    return (
      <Button
        onClick={onToggle}
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 shadow-lg z-50"
      >
        <MessageCircle className="w-6 h-6 text-white" />
      </Button>
    );
  }

  return (
    <Card className="fixed bottom-6 right-6 w-80 h-96 shadow-xl z-50 bg-white dark:bg-gray-800">
      <CardContent className="p-0 h-full flex flex-col">
        {/* Header */}
        <div className="p-4 bg-gradient-to-r from-purple-500 to-pink-500 text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-full bg-white bg-opacity-20 flex items-center justify-center">
                <MessageCircle className="w-4 h-4" />
              </div>
              <div>
                <h3 className="font-semibold">Lexi</h3>
                <p className="text-xs opacity-90">
                  {currentLanguage === 'fa' ? 'دستیار یادگیری' : 'Learning Companion'}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={onToggle}
              className="text-white hover:bg-white hover:bg-opacity-20"
            >
              ×
            </Button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.type === 'user'
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200'
                }`}
              >
                {message.type === 'companion' && (
                  <div className="flex items-center gap-2 mb-1">
                    {getEmotionIcon(message.emotion)}
                    <span className="text-xs font-medium">Lexi</span>
                  </div>
                )}
                <p className="text-sm">{message.content}</p>
                
                {message.culturalTip && (
                  <div className="mt-2 p-2 bg-blue-50 dark:bg-blue-900 rounded text-xs">
                    <Star className="w-3 h-3 inline mr-1" />
                    {message.culturalTip}
                  </div>
                )}
                
                {message.pronunciation && (
                  <div className="mt-1 text-xs opacity-70">
                    🔊 {message.pronunciation}
                  </div>
                )}
              </div>
            </div>
          ))}
          
          {sendToCompanion.isPending && (
            <div className="flex justify-start">
              <div className="bg-gray-100 dark:bg-gray-700 p-3 rounded-lg">
                <div className="flex items-center gap-2">
                  <div className="animate-spin w-4 h-4 border-2 border-purple-500 border-t-transparent rounded-full"></div>
                  <span className="text-sm">{t('typing')}</span>
                </div>
              </div>
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Actions */}
        <div className="p-2 border-t">
          <div className="flex gap-1">
            {quickActions.map((action) => (
              <Button
                key={action.key}
                variant="outline"
                size="sm"
                onClick={() => handleQuickAction(action.key)}
                className="flex-1 text-xs h-8"
              >
                {action.icon}
              </Button>
            ))}
          </div>
        </div>

        {/* Input */}
        <div className="p-3 border-t">
          <div className="flex gap-2">
            <Input
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
              placeholder={t('placeholder')}
              className="flex-1"
              dir={currentLanguage === 'fa' ? 'rtl' : 'ltr'}
            />
            <Button
              onClick={handleSendMessage}
              disabled={!inputMessage.trim() || sendToCompanion.isPending}
              size="sm"
            >
              {t('send')}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}