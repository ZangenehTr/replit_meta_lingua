import React, { useState, useRef, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AppLayout } from '@/components/layout/app-layout';
import { apiRequest } from '@/lib/queryClient';
import { Mic, MicOff, Volume2, VolumeX, MessageSquare, Bot, User, Play, Pause, RotateCcw, Settings, Target, Zap } from 'lucide-react';
import { useAuth } from '@/hooks/use-auth';
import { useToast } from '@/hooks/use-toast';
import { useTranslation } from 'react-i18next';

interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  audioUrl?: string;
}

interface AIConversationSettings {
  language: 'english' | 'persian';
  level: 'beginner' | 'intermediate' | 'advanced';
  topic: 'general' | 'business' | 'academic' | 'casual';
  voiceEnabled: boolean;
  autoPlay: boolean;
}

export default function AIPracticePage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const { t } = useTranslation('common');
  const queryClient = useQueryClient();
  
  // State management
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentMessage, setCurrentMessage] = useState('');
  const [conversation, setConversation] = useState<ConversationMessage[]>([]);
  const [settings, setSettings] = useState<AIConversationSettings>({
    language: 'english',
    level: 'intermediate',
    topic: 'general',
    voiceEnabled: true,
    autoPlay: true
  });
  
  // Refs for audio handling
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Fetch user's AI conversation history
  const { data: conversationHistory, isLoading: isLoadingHistory } = useQuery({
    queryKey: ['/api/student/ai-conversations'],
    enabled: !!user
  });

  // Fetch user's language level for personalization
  const { data: userProfile } = useQuery({
    queryKey: ['/api/users/me/profile'],
    enabled: !!user
  });

  // Mutation for sending AI conversation request
  const sendMessageMutation = useMutation({
    mutationFn: async ({ message, audioBlob }: { message: string; audioBlob?: Blob }) => {
      const formData = new FormData();
      formData.append('message', message);
      formData.append('language', settings.language);
      formData.append('level', settings.level);
      formData.append('topic', settings.topic);
      
      if (audioBlob) {
        formData.append('audio', audioBlob, 'recording.wav');
      }

      const response = await fetch('/api/student/ai-conversation', {
        method: 'POST',
        body: formData,
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Add AI response to conversation
      const aiMessage: ConversationMessage = {
        id: Date.now().toString() + '_ai',
        role: 'assistant',
        content: data.response,
        timestamp: new Date(),
        audioUrl: data.audioUrl
      };
      
      setConversation(prev => [...prev, aiMessage]);
      
      // Auto-play AI response if enabled
      if (settings.autoPlay && settings.voiceEnabled && data.audioUrl) {
        playAudio(data.audioUrl);
      }
      
      toast({
        title: "AI Response Received",
        description: "Your AI conversation partner has responded!"
      });
    },
    onError: (error) => {
      console.error('AI conversation error:', error);
      toast({
        title: t('toast.error'),
        description: t('toast.aiResponseFailed'),
        variant: "destructive"
      });
    }
  });

  // Start recording function
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
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/wav' });
        handleSendMessage(currentMessage, audioBlob);
        
        // Clean up stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      mediaRecorder.start();
      setIsRecording(true);
      
      toast({
        title: "Recording Started",
        description: "Speak now! Click stop when finished."
      });
    } catch (error) {
      console.error('Recording error:', error);
      toast({
        title: "Recording Error",
        description: "Could not access microphone. Please check permissions.",
        variant: "destructive"
      });
    }
  };

  // Stop recording function
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // Play audio function
  const playAudio = (audioUrl: string) => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.src = audioUrl;
      audioPlayerRef.current.play();
      setIsPlaying(true);
    }
  };

  // Handle sending message
  const handleSendMessage = (message: string, audioBlob?: Blob) => {
    if (!message.trim() && !audioBlob) return;
    
    // Add user message to conversation
    const userMessage: ConversationMessage = {
      id: Date.now().toString() + '_user',
      role: 'user',
      content: message,
      timestamp: new Date()
    };
    
    setConversation(prev => [...prev, userMessage]);
    setCurrentMessage('');
    
    // Send to AI
    sendMessageMutation.mutate({ message, audioBlob });
  };

  // Clear conversation
  const clearConversation = () => {
    setConversation([]);
    toast({
      title: t('toast.success'),
      description: t('toast.conversationCleared')
    });
  };

  // Audio event handlers
  useEffect(() => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.onended = () => setIsPlaying(false);
    }
  }, []);

  return (
    <AppLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">AI Conversation Practice</h1>
            <p className="text-gray-600 mt-1">
              Practice your English conversation skills with our AI assistant
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="flex items-center gap-1">
              <Target className="h-3 w-3" />
              Level: {settings.level}
            </Badge>
            <Badge variant="outline" className="flex items-center gap-1">
              <MessageSquare className="h-3 w-3" />
              Topic: {settings.topic}
            </Badge>
          </div>
        </div>

        <Tabs defaultValue="chat" className="space-y-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="chat">AI Chat</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="chat" className="space-y-4">
            {/* Conversation Area */}
            <Card className="h-96">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <Bot className="h-5 w-5" />
                    AI Conversation
                  </CardTitle>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={clearConversation}
                      disabled={conversation.length === 0}
                    >
                      <RotateCcw className="h-4 w-4" />
                      Clear
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 h-64 overflow-y-auto">
                  {conversation.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      <Bot className="h-8 w-8 mx-auto mb-2 text-gray-400" />
                      <p>Start your conversation by typing a message or recording audio</p>
                    </div>
                  ) : (
                    conversation.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`flex gap-2 max-w-[70%] ${
                            msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'
                          }`}
                        >
                          <div className="flex-shrink-0">
                            {msg.role === 'user' ? (
                              <User className="h-6 w-6 text-blue-600" />
                            ) : (
                              <Bot className="h-6 w-6 text-green-600" />
                            )}
                          </div>
                          <div
                            className={`px-4 py-2 rounded-lg ${
                              msg.role === 'user'
                                ? 'bg-blue-600 text-white'
                                : 'bg-gray-100 text-gray-900'
                            }`}
                          >
                            <p>{msg.content}</p>
                            {msg.audioUrl && (
                              <Button
                                variant="ghost"
                                size="sm"
                                className="mt-2 p-1 h-auto"
                                onClick={() => playAudio(msg.audioUrl!)}
                              >
                                <Volume2 className="h-4 w-4" />
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Message Input Area */}
            <Card>
              <CardContent className="pt-6">
                <div className="flex gap-2">
                  <div className="flex-1">
                    <Textarea
                      placeholder="Type your message here..."
                      value={currentMessage}
                      onChange={(e) => setCurrentMessage(e.target.value)}
                      className="min-h-[80px]"
                      onKeyPress={(e) => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                          e.preventDefault();
                          handleSendMessage(currentMessage);
                        }
                      }}
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <Button
                      onClick={() => handleSendMessage(currentMessage)}
                      disabled={!currentMessage.trim() || sendMessageMutation.isPending}
                    >
                      <MessageSquare className="h-4 w-4" />
                    </Button>
                    {settings.voiceEnabled && (
                      <Button
                        variant={isRecording ? "destructive" : "outline"}
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={sendMessageMutation.isPending}
                      >
                        {isRecording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Settings className="h-5 w-5" />
                  AI Practice Settings
                </CardTitle>
                <CardDescription>
                  Customize your AI conversation experience
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Language</label>
                    <Select
                      value={settings.language}
                      onValueChange={(value: 'english' | 'persian') =>
                        setSettings({ ...settings, language: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="english">English</SelectItem>
                        <SelectItem value="persian">Persian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Level</label>
                    <Select
                      value={settings.level}
                      onValueChange={(value: 'beginner' | 'intermediate' | 'advanced') =>
                        setSettings({ ...settings, level: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="beginner">Beginner</SelectItem>
                        <SelectItem value="intermediate">Intermediate</SelectItem>
                        <SelectItem value="advanced">Advanced</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Conversation Topic</label>
                  <Select
                    value={settings.topic}
                    onValueChange={(value: 'general' | 'business' | 'academic' | 'casual') =>
                      setSettings({ ...settings, topic: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="general">General</SelectItem>
                      <SelectItem value="business">Business</SelectItem>
                      <SelectItem value="academic">Academic</SelectItem>
                      <SelectItem value="casual">Casual</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Voice Enabled</label>
                  <Button
                    variant={settings.voiceEnabled ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSettings({ ...settings, voiceEnabled: !settings.voiceEnabled })}
                  >
                    {settings.voiceEnabled ? <Volume2 className="h-4 w-4" /> : <VolumeX className="h-4 w-4" />}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Hidden audio element for playback */}
        <audio ref={audioPlayerRef} style={{ display: 'none' }} />
      </div>
    </AppLayout>
  );
}