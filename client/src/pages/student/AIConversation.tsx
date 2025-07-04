import { useState, useRef, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { 
  Mic, 
  MicOff, 
  Volume2,
  Send,
  Bot,
  User,
  Loader2
} from "lucide-react";

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

export default function AIConversation() {
  const { toast } = useToast();
  const [messages, setMessages] = useState<Message[]>([]);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState<'english' | 'farsi'>('english');
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  // Check if AI service is available
  const { data: serviceStatus } = useQuery<{ isAvailable: boolean }>({
    queryKey: ['/api/student/ai/status'],
    refetchInterval: 10000
  });

  // Send audio message mutation
  const sendAudioMessage = useMutation({
    mutationFn: async (audioBlob: Blob) => {
      // For now, send simple JSON with language
      // In production, you would convert audio to base64 or use proper audio processing
      return apiRequest({
        url: '/api/student/ai/voice-message',
        options: {
          method: 'POST',
          body: JSON.stringify({ 
            language: selectedLanguage 
          })
        }
      });
    },
    onSuccess: (response) => {
      // Add user message
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: response.transcript || 'Audio message',
        timestamp: new Date()
      };
      
      // Add AI response
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response,
        timestamp: new Date(),
        audioUrl: response.audioUrl
      };
      
      setMessages(prev => [...prev, userMessage, aiMessage]);
      
      // Auto-play AI response if audio URL provided
      if (response.audioUrl) {
        playAudio(response.audioUrl);
      }
    },
    onError: () => {
      toast({
        title: "Failed to send message",
        description: "Please try again",
        variant: "destructive"
      });
    },
    onSettled: () => {
      setIsProcessing(false);
    }
  });

  // Start recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream);
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];
      
      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };
      
      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setIsProcessing(true);
        sendAudioMessage.mutate(audioBlob);
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone access denied",
        description: "Please allow microphone access to use voice chat",
        variant: "destructive"
      });
    }
  };

  // Stop recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play audio
  const playAudio = (url: string) => {
    const audio = new Audio(url);
    audio.play().catch(error => {
      console.error('Error playing audio:', error);
    });
  };

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    if (scrollAreaRef.current) {
      scrollAreaRef.current.scrollTop = scrollAreaRef.current.scrollHeight;
    }
  }, [messages]);

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Language Practice</h1>
        <p className="text-muted-foreground">
          Practice conversations with AI in English or Farsi. Hold the microphone button to speak.
        </p>
      </div>

      {/* Language Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Select Language</CardTitle>
          <CardDescription>Choose the language you want to practice</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex gap-2">
            <Button
              variant={selectedLanguage === 'english' ? 'default' : 'outline'}
              onClick={() => setSelectedLanguage('english')}
            >
              English
            </Button>
            <Button
              variant={selectedLanguage === 'farsi' ? 'default' : 'outline'}
              onClick={() => setSelectedLanguage('farsi')}
            >
              فارسی (Farsi)
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Conversation Area */}
      <Card className="h-[500px] flex flex-col">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Conversation</CardTitle>
            {serviceStatus?.isAvailable ? (
              <Badge variant="outline" className="bg-green-50">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse" />
                AI Ready
              </Badge>
            ) : (
              <Badge variant="outline" className="bg-red-50">
                <div className="w-2 h-2 bg-red-500 rounded-full mr-2" />
                AI Offline
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-0">
          <ScrollArea className="flex-1 p-6" ref={scrollAreaRef}>
            {messages.length === 0 ? (
              <div className="text-center text-muted-foreground py-12">
                <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>Start a conversation by holding the microphone button and speaking</p>
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                  >
                    <div
                      className={`max-w-[70%] ${
                        message.role === 'user'
                          ? 'bg-primary text-primary-foreground'
                          : 'bg-muted'
                      } rounded-lg p-4`}
                    >
                      <div className="flex items-start gap-2">
                        {message.role === 'assistant' && (
                          <Bot className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                        {message.role === 'user' && (
                          <User className="w-5 h-5 mt-0.5 flex-shrink-0" />
                        )}
                        <div className="flex-1">
                          <p className="text-sm">{message.content}</p>
                          {message.audioUrl && (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="mt-2 h-8"
                              onClick={() => playAudio(message.audioUrl!)}
                            >
                              <Volume2 className="w-4 h-4 mr-1" />
                              Play Audio
                            </Button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>

          {/* Recording Controls */}
          <div className="p-6 border-t">
            <div className="flex items-center justify-center gap-4">
              <Button
                size="lg"
                variant={isRecording ? "destructive" : "default"}
                className="rounded-full w-20 h-20"
                onMouseDown={startRecording}
                onMouseUp={stopRecording}
                onMouseLeave={stopRecording}
                onTouchStart={startRecording}
                onTouchEnd={stopRecording}
                disabled={!serviceStatus?.isAvailable || isProcessing}
              >
                {isProcessing ? (
                  <Loader2 className="w-8 h-8 animate-spin" />
                ) : isRecording ? (
                  <MicOff className="w-8 h-8" />
                ) : (
                  <Mic className="w-8 h-8" />
                )}
              </Button>
            </div>
            <p className="text-center text-sm text-muted-foreground mt-4">
              {isRecording 
                ? "Release to send your message" 
                : isProcessing 
                ? "Processing your message..." 
                : "Hold to record your message"}
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}