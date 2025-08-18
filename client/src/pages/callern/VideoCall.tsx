import React, { useState, useEffect, useRef } from 'react';
import { useRoute, useLocation } from 'wouter';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useWebRTC } from '@/hooks/useWebRTC';
import { TTTMonitor } from '@/components/callern/TTTMonitor';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { apiRequest, queryClient } from '@/lib/queryClient';
import {
  Video,
  VideoOff,
  Mic,
  MicOff,
  PhoneOff,
  Monitor,
  MessageSquare,
  BookOpen,
  Languages,
  CheckCircle,
  HelpCircle,
  Users,
  Clock,
  AlertTriangle,
  Sparkles
} from 'lucide-react';

interface CallData {
  callId: string;
  studentId: number;
  teacherId: number;
  packageId?: number;
  roadmapStepId?: number;
  roadmapStepData?: {
    title: string;
    learningObjective: string;
    teacherAiTips: string;
  };
}

export default function CallernVideoCall() {
  const [, params] = useRoute('/callern/video/:callId');
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  const callId = params?.callId;

  // WebRTC Hook
  const {
    localVideoRef,
    remoteVideoRef,
    connectionState,
    callDuration,
    formattedDuration,
    isVideoEnabled,
    isAudioEnabled,
    isScreenSharing,
    toggleVideo,
    toggleAudio,
    shareScreen,
    stopScreenShare,
    endCall
  } = useWebRTC({
    onCallEnded: (reason) => {
      toast({
        title: "Call Ended",
        description: reason
      });
      setLocation('/admin/callern-management');
    }
  });

  // State
  const [callData, setCallData] = useState<CallData | null>(null);
  const [aiSuggestions, setAiSuggestions] = useState<string[]>([]);
  const [showAIPanel, setShowAIPanel] = useState(false);
  const [selectedText, setSelectedText] = useState('');
  const [isCallActive, setIsCallActive] = useState(false);

  // Fetch call data
  const { data: call } = useQuery({
    queryKey: ['/api/callern/calls', callId],
    queryFn: async () => {
      if (!callId) return null;
      return apiRequest(`/api/callern/calls/${callId}`);
    },
    enabled: !!callId
  });

  // AI Feature Mutations
  const wordHelperMutation = useMutation({
    mutationFn: async (context: string) => {
      const response = await fetch('/api/callern/ai/test/word-helper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ context, level: 'B1' })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.words) {
        const suggestions = data.words.map((w: any) => 
          `${w.word}: ${w.definition}`
        );
        setAiSuggestions(suggestions);
      }
    }
  });

  const grammarCheckMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/callern/ai/test/grammar-check', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.corrected) {
        setAiSuggestions([
          `Corrected: ${data.corrected}`,
          `Explanation: ${data.explanation}`
        ]);
      }
    }
  });

  const translateMutation = useMutation({
    mutationFn: async (text: string) => {
      const response = await fetch('/api/callern/ai/test/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text, targetLanguage: 'fa' })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.translation) {
        setAiSuggestions([
          `Translation: ${data.translation}`,
          `Pronunciation: ${data.pronunciation || ''}`
        ]);
      }
    }
  });

  const pronunciationMutation = useMutation({
    mutationFn: async (word: string) => {
      const response = await fetch('/api/callern/ai/test/pronunciation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ word })
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.pronunciation) {
        setAiSuggestions([
          `IPA: ${data.pronunciation}`,
          `Syllables: ${data.syllables}`,
          `Tips: ${data.tips}`
        ]);
      }
    }
  });

  // Handle text selection for AI features
  useEffect(() => {
    const handleSelection = () => {
      const selection = window.getSelection();
      if (selection && selection.toString().trim()) {
        setSelectedText(selection.toString().trim());
      }
    };

    document.addEventListener('mouseup', handleSelection);
    return () => document.removeEventListener('mouseup', handleSelection);
  }, []);

  // Update call status when connected
  useEffect(() => {
    if (connectionState === 'connected') {
      setIsCallActive(true);
    } else if (connectionState === 'ended' || connectionState === 'error') {
      setIsCallActive(false);
    }
  }, [connectionState]);

  // Get roadmap context for AI
  const getRoadmapContext = () => {
    if (call?.roadmapStepData) {
      return `Topic: ${call.roadmapStepData.title}. Objective: ${call.roadmapStepData.learningObjective}`;
    }
    return "General conversation practice";
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-purple-900 to-blue-900 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <h1 className="text-2xl font-bold text-white">Callern Video Session</h1>
            {connectionState === 'connected' && (
              <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
                Connected
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-4">
            <Clock className="w-5 h-5 text-white/60" />
            <span className="text-white font-mono">{formattedDuration}</span>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
          {/* Main Video Area */}
          <div className="lg:col-span-3 space-y-4">
            {/* Remote Video */}
            <Card className="bg-black/30 backdrop-blur-md border-white/10">
              <CardContent className="p-0 relative aspect-video">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full rounded-lg"
                />
                {connectionState !== 'connected' && (
                  <div className="absolute inset-0 flex items-center justify-center bg-gray-900/80 rounded-lg">
                    <p className="text-white/60">Waiting for connection...</p>
                  </div>
                )}
                
                {/* Local Video PiP */}
                <div className="absolute bottom-4 right-4 w-48 h-36">
                  <video
                    ref={localVideoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full rounded-lg bg-gray-800 shadow-lg"
                  />
                </div>

                {/* Roadmap Context Overlay */}
                {call?.roadmapStepData && (
                  <div className="absolute top-4 left-4 bg-black/60 backdrop-blur-sm rounded-lg p-3 max-w-md">
                    <h3 className="text-white font-semibold mb-1">
                      {call.roadmapStepData.title}
                    </h3>
                    <p className="text-white/80 text-sm">
                      {call.roadmapStepData.learningObjective}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Control Bar */}
            <Card className="bg-white/10 backdrop-blur-md border-white/20">
              <CardContent className="p-4">
                <div className="flex justify-center items-center gap-4">
                  <Button
                    onClick={toggleAudio}
                    variant={isAudioEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-14 h-14"
                  >
                    {isAudioEnabled ? <Mic className="w-6 h-6" /> : <MicOff className="w-6 h-6" />}
                  </Button>

                  <Button
                    onClick={toggleVideo}
                    variant={isVideoEnabled ? "default" : "destructive"}
                    size="lg"
                    className="rounded-full w-14 h-14"
                  >
                    {isVideoEnabled ? <Video className="w-6 h-6" /> : <VideoOff className="w-6 h-6" />}
                  </Button>

                  <Button
                    onClick={isScreenSharing ? stopScreenShare : shareScreen}
                    variant={isScreenSharing ? "secondary" : "outline"}
                    size="lg"
                    className="rounded-full w-14 h-14"
                  >
                    <Monitor className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={() => setShowAIPanel(!showAIPanel)}
                    variant={showAIPanel ? "secondary" : "outline"}
                    size="lg"
                    className="rounded-full w-14 h-14 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <Sparkles className="w-6 h-6" />
                  </Button>

                  <Button
                    onClick={() => endCall('User ended call')}
                    variant="destructive"
                    size="lg"
                    className="rounded-full w-14 h-14 ml-8"
                  >
                    <PhoneOff className="w-6 h-6" />
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* AI Panel */}
            {showAIPanel && (
              <Card className="bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white flex items-center gap-2">
                    <Sparkles className="w-5 h-5" />
                    AI Assistant
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <Tabs defaultValue="words" className="w-full">
                    <TabsList className="grid w-full grid-cols-4 bg-white/10">
                      <TabsTrigger value="words">Words</TabsTrigger>
                      <TabsTrigger value="grammar">Grammar</TabsTrigger>
                      <TabsTrigger value="translate">Translate</TabsTrigger>
                      <TabsTrigger value="pronunciation">Pronunciation</TabsTrigger>
                    </TabsList>

                    <TabsContent value="words" className="space-y-4">
                      <Button
                        onClick={() => wordHelperMutation.mutate(getRoadmapContext())}
                        className="w-full"
                        disabled={wordHelperMutation.isPending}
                      >
                        <BookOpen className="w-4 h-4 mr-2" />
                        Get Vocabulary Suggestions
                      </Button>
                    </TabsContent>

                    <TabsContent value="grammar" className="space-y-4">
                      {selectedText && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-sm mb-2">Selected text:</p>
                          <p className="text-white">{selectedText}</p>
                        </div>
                      )}
                      <Button
                        onClick={() => grammarCheckMutation.mutate(selectedText || "I have went to store")}
                        className="w-full"
                        disabled={grammarCheckMutation.isPending || !selectedText}
                      >
                        <CheckCircle className="w-4 h-4 mr-2" />
                        Check Grammar
                      </Button>
                    </TabsContent>

                    <TabsContent value="translate" className="space-y-4">
                      {selectedText && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-sm mb-2">Selected text:</p>
                          <p className="text-white">{selectedText}</p>
                        </div>
                      )}
                      <Button
                        onClick={() => translateMutation.mutate(selectedText || "Hello")}
                        className="w-full"
                        disabled={translateMutation.isPending}
                      >
                        <Languages className="w-4 h-4 mr-2" />
                        Translate to Persian
                      </Button>
                    </TabsContent>

                    <TabsContent value="pronunciation" className="space-y-4">
                      {selectedText && (
                        <div className="bg-white/5 rounded-lg p-3">
                          <p className="text-white/60 text-sm mb-2">Selected word:</p>
                          <p className="text-white">{selectedText}</p>
                        </div>
                      )}
                      <Button
                        onClick={() => pronunciationMutation.mutate(selectedText || "entrepreneur")}
                        className="w-full"
                        disabled={pronunciationMutation.isPending}
                      >
                        <HelpCircle className="w-4 h-4 mr-2" />
                        Get Pronunciation Guide
                      </Button>
                    </TabsContent>
                  </Tabs>

                  {/* AI Suggestions Display */}
                  {aiSuggestions.length > 0 && (
                    <div className="mt-4 bg-gradient-to-r from-purple-500/10 to-blue-500/10 rounded-lg p-4 border border-purple-500/30">
                      <h4 className="text-white font-semibold mb-2">AI Suggestions:</h4>
                      <ScrollArea className="h-32">
                        <ul className="space-y-2">
                          {aiSuggestions.map((suggestion, idx) => (
                            <li key={idx} className="text-white/90 text-sm">
                              • {suggestion}
                            </li>
                          ))}
                        </ul>
                      </ScrollArea>
                    </div>
                  )}
                </CardContent>
              </Card>
            )}
          </div>

          {/* Right Sidebar - TTT Monitor */}
          <div className="lg:col-span-1">
            <TTTMonitor
              isCallActive={isCallActive}
              teacherId={call?.teacherId || 0}
              studentId={call?.studentId || 0}
              callId={callId}
            />

            {/* Teacher AI Tips */}
            {call?.roadmapStepData?.teacherAiTips && (
              <Card className="mt-4 bg-white/10 backdrop-blur-md border-white/20">
                <CardHeader>
                  <CardTitle className="text-white text-sm">Teacher Tips</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-white/80 text-sm">
                    {call.roadmapStepData.teacherAiTips}
                  </p>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}