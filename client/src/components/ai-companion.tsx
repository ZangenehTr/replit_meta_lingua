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
  const [companionEmotion, setCompanionEmotion] = useState<'happy' | 'excited' | 'encouraging' | 'thinking' | 'celebrating'>('happy');
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [companionStats, setCompanionStats] = useState({
    conversationsToday: 12,
    helpfulTips: 34,
    encouragements: 8
  });

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  // AI Companion Chat
  const sendToCompanion = useMutation({
    mutationFn: async (data: { message: string; context: any }) => {
      return apiRequest('/api/ai/companion-chat', {
        method: 'POST',
        body: JSON.stringify(data),
      });
    },
    onSuccess: (response) => {
      const companionMessage: CompanionMessage = {
        id: Date.now().toString(),
        type: 'companion',
        content: response.response,
        timestamp: new Date(),
        emotion: response.emotion || 'happy',
        culturalTip: response.culturalTip,
        pronunciation: response.pronunciation
      };
      
      setMessages(prev => [...prev, companionMessage]);
      setCompanionEmotion(response.emotion || 'happy');
      
      // Text-to-speech for companion responses
      if (response.response) {
        speakText(response.response);
      }
    },
  });

  const speakText = (text: string) => {
    if ('speechSynthesis' in window) {
      setIsSpeaking(true);
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'fa-IR'; // Persian language
      utterance.rate = 0.8;
      utterance.pitch = 1.2; // Slightly higher pitch for friendly character
      
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      
      speechSynthesis.speak(utterance);
    }
  };

  const handleSendMessage = () => {
    if (!inputMessage.trim()) return;

    const userMessage: CompanionMessage = {
      id: Date.now().toString(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setCompanionEmotion('thinking');

    sendToCompanion.mutate({
      message: inputMessage,
      context: {
        level: studentLevel,
        currentLesson,
        previousMessages: messages.slice(-5)
      }
    });

    setInputMessage("");
  };

  const startVoiceRecognition = () => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SpeechRecognition = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      const recognition = new SpeechRecognition();
      
      recognition.lang = 'fa-IR';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      
      recognition.onresult = (event: any) => {
        const transcript = event.results[0][0].transcript;
        setInputMessage(transcript);
      };

      recognition.onerror = () => {
        setIsListening(false);
        toast({
          title: "خطا در ضبط صدا / Voice Recognition Error",
          description: "لطفاً دوباره تلاش کنید / Please try again",
          variant: "destructive",
        });
      };

      recognition.start();
    }
  };

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    // Welcome message when companion first appears
    if (isVisible && messages.length === 0) {
      const welcomeMessage: CompanionMessage = {
        id: 'welcome',
        type: 'companion',
        content: `سلام! من پارسا هستم، دستیار یادگیری شما! 🌟\nHello! I'm Parsa, your learning companion! Ready to practice Persian together?`,
        timestamp: new Date(),
        emotion: 'excited'
      };
      setMessages([welcomeMessage]);
      setCompanionEmotion('excited');
    }
  }, [isVisible]);

  const getCompanionAvatar = () => {
    const baseClasses = "w-16 h-16 rounded-full flex items-center justify-center text-2xl transition-all duration-300";
    
    switch (companionEmotion) {
      case 'excited':
        return `${baseClasses} bg-gradient-to-br from-yellow-400 to-orange-500 animate-bounce`;
      case 'encouraging':
        return `${baseClasses} bg-gradient-to-br from-green-400 to-blue-500 animate-pulse`;
      case 'thinking':
        return `${baseClasses} bg-gradient-to-br from-purple-400 to-pink-500 animate-spin`;
      case 'celebrating':
        return `${baseClasses} bg-gradient-to-br from-pink-400 to-red-500 animate-ping`;
      default:
        return `${baseClasses} bg-gradient-to-br from-blue-400 to-purple-500`;
    }
  };

  const getCompanionEmoji = () => {
    switch (companionEmotion) {
      case 'excited': return '🤩';
      case 'encouraging': return '💪';
      case 'thinking': return '🤔';
      case 'celebrating': return '🎉';
      default: return '😊';
    }
  };

  const getRandomEncouragement = () => {
    const encouragements = [
      "عالی! / Excellent!",
      "آفرین! / Well done!",
      "تو داری خیلی خوب پیش میری! / You're doing great!",
      "ادامه بده! / Keep going!",
      "فوق‌العاده! / Amazing!"
    ];
    return encouragements[Math.floor(Math.random() * encouragements.length)];
  };

  if (!isVisible) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={onToggle}
          className="rounded-full w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="text-2xl">🤖</div>
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-96 max-h-[600px] flex flex-col">
      <Card className="flex-1 shadow-2xl border-2 border-blue-200 dark:border-blue-800 overflow-hidden">
        {/* Companion Header */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className={getCompanionAvatar()}>
                <span>{getCompanionEmoji()}</span>
              </div>
              <div>
                <h3 className="font-bold text-lg">پارسا / Parsa</h3>
                <p className="text-xs opacity-90">دستیار یادگیری هوشمند / AI Learning Companion</p>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsSpeaking(!isSpeaking)}
                className="text-white hover:bg-white/20"
              >
                {isSpeaking ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={onToggle}
                className="text-white hover:bg-white/20"
              >
                ✕
              </Button>
            </div>
          </div>
          
          {/* Companion Stats */}
          <div className="flex justify-between mt-3 text-xs">
            <div className="flex items-center">
              <MessageCircle className="h-3 w-3 mr-1" />
              {companionStats.conversationsToday} گفتگو امروز
            </div>
            <div className="flex items-center">
              <Lightbulb className="h-3 w-3 mr-1" />
              {companionStats.helpfulTips} نکته مفید
            </div>
            <div className="flex items-center">
              <Heart className="h-3 w-3 mr-1" />
              {companionStats.encouragements} تشویق
            </div>
          </div>
        </div>

        {/* Messages Area */}
        <CardContent className="p-0 flex-1 overflow-hidden">
          <div className="h-80 overflow-y-auto p-4 bg-gradient-to-b from-blue-50/30 to-purple-50/30 dark:from-blue-900/10 dark:to-purple-900/10">
            <div className="space-y-4">
              {messages.map((message) => (
                <div
                  key={message.id}
                  className={`flex ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div className={`max-w-[80%] ${message.type === 'user' ? 'order-2' : 'order-1'}`}>
                    <div
                      className={`p-3 rounded-2xl ${
                        message.type === 'user'
                          ? 'bg-blue-600 text-white rounded-br-sm'
                          : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-bl-sm'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                      {message.pronunciation && (
                        <div className="mt-2 p-2 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
                          <p className="text-xs text-yellow-800 dark:text-yellow-200">
                            <strong>تلفظ / Pronunciation:</strong> {message.pronunciation}
                          </p>
                        </div>
                      )}
                      {message.culturalTip && (
                        <div className="mt-2 p-2 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                          <p className="text-xs text-purple-800 dark:text-purple-200">
                            <strong>نکته فرهنگی / Cultural Tip:</strong> {message.culturalTip}
                          </p>
                        </div>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-1 px-2">
                      {message.timestamp.toLocaleTimeString('fa-IR', { 
                        hour: '2-digit', 
                        minute: '2-digit' 
                      })}
                    </p>
                  </div>
                  
                  {message.type === 'companion' && (
                    <div className="order-2 ml-2">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-400 to-purple-500 flex items-center justify-center text-sm">
                        {getCompanionEmoji()}
                      </div>
                    </div>
                  )}
                </div>
              ))}
              
              {sendToCompanion.isPending && (
                <div className="flex justify-start">
                  <div className="bg-white dark:bg-gray-800 border rounded-2xl rounded-bl-sm p-3 max-w-[80%]">
                    <div className="flex items-center space-x-2">
                      <div className="animate-bounce">🤔</div>
                      <div className="flex space-x-1">
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                        <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <div ref={messagesEndRef} />
          </div>
        </CardContent>

        {/* Input Area */}
        <div className="p-4 border-t bg-white dark:bg-gray-900">
          <div className="flex space-x-2">
            <div className="flex-1 relative">
              <Input
                placeholder="سؤال خود را بپرسید... / Ask your question..."
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                className="pr-12"
              />
              <Button
                variant="ghost"
                size="sm"
                onClick={startVoiceRecognition}
                disabled={isListening}
                className="absolute right-2 top-1/2 transform -translate-y-1/2"
              >
                {isListening ? (
                  <div className="flex items-center">
                    <MicOff className="h-4 w-4 text-red-500 animate-pulse" />
                  </div>
                ) : (
                  <Mic className="h-4 w-4" />
                )}
              </Button>
            </div>
            <Button 
              onClick={handleSendMessage} 
              disabled={!inputMessage.trim() || sendToCompanion.isPending}
              className="bg-gradient-to-r from-blue-500 to-purple-600"
            >
              <MessageCircle className="h-4 w-4" />
            </Button>
          </div>
          
          {/* Quick Actions */}
          <div className="flex flex-wrap gap-2 mt-3">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage("راهنمایی در مورد این درس / Help with this lesson")}
              className="text-xs"
            >
              <Book className="h-3 w-3 mr-1" />
              راهنمای درس
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                toast({
                  title: getRandomEncouragement(),
                  description: "به کارت ادامه بده! / Keep up the great work!",
                });
                setCompanionEmotion('encouraging');
              }}
              className="text-xs"
            >
              <Trophy className="h-3 w-3 mr-1" />
              تشویق
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setInputMessage("نکته فرهنگی بده / Give me a cultural tip")}
              className="text-xs"
            >
              <Sparkles className="h-3 w-3 mr-1" />
              نکته فرهنگی
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}