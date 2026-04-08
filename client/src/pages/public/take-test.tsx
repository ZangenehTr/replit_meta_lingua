import { useState, useEffect, FormEvent, useRef } from 'react';
import { useMutation } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, Mic, PenTool, Headphones, BookOpen, ArrowRight, CheckCircle2, Square, Play, Trash2, Sparkles, ShieldCheck, Timer, BarChart3, Trophy, Zap } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useLocation } from 'wouter';

interface PlacementTestSession {
  id: number;
  status: 'in_progress' | 'completed';
  currentSkill: 'speaking' | 'listening' | 'reading' | 'writing';
  startedAt: string;
  maxDurationMinutes: number;
}

interface PlacementTestQuestion {
  id: number;
  skill: string;
  cefrLevel: string;
  questionType: string;
  title: string;
  prompt: string;
  content: any;
  responseType: 'audio' | 'text' | 'multiple_choice';
  expectedDurationSeconds: number;
}

interface PlacementTestResults {
  overallLevel: string;
  skillLevels: {
    speaking: string;
    listening: string;
    reading: string;
    writing: string;
  };
  scores: {
    overall: number;
    speaking: number;
    listening: number;
    reading: number;
    writing: number;
  };
  strengths: string[];
  recommendations: string[];
  confidence: number;
}

const skillIcons = {
  speaking: Mic,
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool
};

export default function TakeTestPage() {
  const [currentSession, setCurrentSession] = useState<PlacementTestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PlacementTestQuestion | null>(null);
  const [userResponse, setUserResponse] = useState<any>('');
  const [testResults, setTestResults] = useState<PlacementTestResults | null>(null);
  const [testStep, setTestStep] = useState<'intro' | 'testing' | 'contact' | 'roadmap' | 'results'>('intro');
  const [showContactModal, setShowContactModal] = useState(false);
  const [contactForm, setContactForm] = useState({ name: '', email: '', phone: '' });
  const [personalizedRoadmap, setPersonalizedRoadmap] = useState<any | null>(null);
  const [isGeneratingRoadmap, setIsGeneratingRoadmap] = useState(false);
  
  // Audio recording state
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioURL, setAudioURL] = useState<string | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number>(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);

  // Listening TTS state
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [isSpeechComplete, setIsSpeechComplete] = useState(false);
  
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { t } = useTranslation();

  // Load session from localStorage on mount
  useEffect(() => {
    const savedSessionId = localStorage.getItem('guest_placement_session_id');
    if (savedSessionId && testStep === 'intro') {
      const sessionId = parseInt(savedSessionId);
      
      // Check if session is still in progress
      fetch(`/api/placement-test/guest/sessions/${savedSessionId}/next-question`)
        .then(res => res.json())
        .then(data => {
          if (data.success && !data.testCompleted) {
            // Resume in-progress session
            setCurrentSession({
              id: sessionId,
              status: 'in_progress',
              currentSkill: 'speaking',
              startedAt: new Date().toISOString(),
              maxDurationMinutes: 10
            });
            setTestStep('testing');
            setCurrentQuestion(data.question);
          } else {
            // Session is completed or invalid - clear it and start fresh
            localStorage.removeItem('guest_placement_session_id');
            // Stay on intro screen so user can start a new test
          }
        })
        .catch(err => {
          console.error('Failed to resume session:', err);
          localStorage.removeItem('guest_placement_session_id');
        });
    }
  }, [testStep]);

  // Start placement test mutation
  const startTestMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/placement-test/guest/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetLanguage: 'english',
          learningGoal: 'general'
        })
      });
      if (!response.ok) throw new Error('Failed to start test');
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      localStorage.setItem('guest_placement_session_id', data.session.id.toString());
      setTestStep('testing');
      fetchNextQuestion(data.session.id);
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to start placement test. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const fetchNextQuestion = async (sessionId: number) => {
    try {
      const response = await fetch(`/api/placement-test/guest/sessions/${sessionId}/next-question`);
      const data = await response.json();
      
      if (data.testCompleted) {
        setTestResults(data.results);
        setShowContactModal(true);
        setTestStep('contact');
      } else if (data.success && data.question) {
        // Clear recording timer to prevent it from firing on next question
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        
        setCurrentQuestion(data.question);
        setUserResponse('');
        // Reset audio state for new question
        setAudioBlob(null);
        setAudioURL(null);
        setIsRecording(false);
        setRecordingTimeLeft(0);
        // Reset listening TTS state
        window.speechSynthesis?.cancel();
        setIsPlayingAudio(false);
        setIsSpeechComplete(false);
      }
    } catch (error) {
      console.error('Failed to fetch next question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load next question',
        variant: 'destructive'
      });
    }
  };

  // Audio recording functions
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
        setAudioBlob(audioBlob);
        const url = URL.createObjectURL(audioBlob);
        setAudioURL(url);
        
        // Store lightweight object for submission (not base64 to avoid 413 errors)
        setUserResponse({
          audioReceived: true,
          duration: currentQuestion?.expectedDurationSeconds || 60
        });
        
        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorder.start();
      setIsRecording(true);
      
      // Set recording timer with auto-countdown
      const duration = currentQuestion?.expectedDurationSeconds || 120;
      setRecordingTimeLeft(duration);
      
      const timer = setInterval(() => {
        setRecordingTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Auto-stop when time reaches 0
            clearInterval(timer);
            setTimeout(() => stopRecording(), 100);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      setRecordingTimer(timer);
      
    } catch (error) {
      console.error('Failed to start recording:', error);
      toast({
        title: 'Error',
        description: 'Failed to access microphone. Please check your browser permissions.',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
    setRecordingTimeLeft(0);
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  const deleteRecording = () => {
    if (audioURL) {
      URL.revokeObjectURL(audioURL);
    }
    setAudioBlob(null);
    setAudioURL(null);
    setUserResponse('');
  };

  // Cleanup timer on component unmount
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
    };
  }, [recordingTimer]);

  const submitResponseMutation = useMutation({
    mutationFn: async ({ sessionId, questionId, response }: any) => {
      const res = await fetch(`/api/placement-test/guest/sessions/${sessionId}/responses`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId, userResponse: response })
      });
      if (!res.ok) throw new Error('Failed to submit response');
      return res.json();
    },
    onSuccess: () => {
      if (currentSession) {
        fetchNextQuestion(currentSession.id);
      }
    },
    onError: () => {
      toast({
        title: 'Submission failed',
        description: 'Could not submit your answer. Please try again.',
        variant: 'destructive'
      });
    }
  });

  const submitContactMutation = useMutation({
    mutationFn: async (contactData: any) => {
      // Use the secure guest placement submission endpoint
      const response = await fetch('/api/prospect-lifecycle/guest-placement-submission', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: contactData.name,
          email: contactData.email,
          phone: contactData.phone,
          placementSessionId: currentSession?.id,
          testResults: testResults
        })
      });
      if (!response.ok) throw new Error('Failed to save contact');
      return response.json();
    },
    onSuccess: async (data, variables) => {
      localStorage.removeItem('guest_placement_session_id');
      setShowContactModal(false);
      
      // Generate AI-powered personalized roadmap
      setTestStep('roadmap');
      setIsGeneratingRoadmap(true);
      
      try {
        const roadmapResponse = await fetch('/api/roadmaps/generate-from-placement', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            testResults: testResults,
            contactInfo: variables
          })
        });
        
        if (roadmapResponse.ok) {
          const roadmapData = await roadmapResponse.json();
          
          // Validate roadmap has actual content
          if (roadmapData.success && roadmapData.roadmap && 
              roadmapData.roadmap.milestones && roadmapData.roadmap.milestones.length > 0) {
            setPersonalizedRoadmap(roadmapData.roadmap);
            toast({
              title: 'Roadmap Generated!',
              description: 'Your personalized learning path is ready based on your test results.'
            });
          } else {
            console.error('Roadmap data is invalid:', roadmapData);
            throw new Error('Invalid roadmap data');
          }
        } else {
          throw new Error('Failed to generate roadmap');
        }
      } catch (error) {
        console.error('Roadmap generation error:', error);
        toast({
          title: 'Note',
          description: 'Your results are ready. Personalized roadmap will be available soon.',
          variant: 'default'
        });
      } finally {
        setIsGeneratingRoadmap(false);
        setTestStep('results');
      }
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to save your contact information',
        variant: 'destructive'
      });
    }
  });

  const handleSubmitResponse = () => {
    if (!currentQuestion || !currentSession || !userResponse) return;

    let response = userResponse;
    // Guard: for audio questions, if response is somehow a long base64 string, replace with lightweight form
    if (currentQuestion.responseType === 'audio' && typeof response === 'string' && response.length > 500) {
      response = {
        audioReceived: true,
        duration: currentQuestion?.expectedDurationSeconds || 60
      };
    }

    submitResponseMutation.mutate({
      sessionId: currentSession.id,
      questionId: currentQuestion.id,
      response
    });
  };

  const handleSubmitContact = (e: FormEvent) => {
    e.preventDefault();
    if (!contactForm.name || !contactForm.email) {
      toast({
        title: 'Missing information',
        description: 'Please provide your name and email',
        variant: 'destructive'
      });
      return;
    }
    submitContactMutation.mutate(contactForm);
  };

  const handleSkipContact = () => {
    localStorage.removeItem('guest_placement_session_id');
    setShowContactModal(false);
    setTestStep('results');
  };

  // Intro Screen
  if (testStep === 'intro') {
    const skillDetails = [
      { skill: 'speaking', icon: Mic, color: 'from-blue-500 to-blue-600', bg: 'bg-blue-50 dark:bg-blue-950', border: 'border-blue-200 dark:border-blue-800', label: 'Speaking' },
      { skill: 'listening', icon: Headphones, color: 'from-cyan-500 to-cyan-600', bg: 'bg-cyan-50 dark:bg-cyan-950', border: 'border-cyan-200 dark:border-cyan-800', label: 'Listening' },
      { skill: 'reading', icon: BookOpen, color: 'from-indigo-500 to-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950', border: 'border-indigo-200 dark:border-indigo-800', label: 'Reading' },
      { skill: 'writing', icon: PenTool, color: 'from-violet-500 to-violet-600', bg: 'bg-violet-50 dark:bg-violet-950', border: 'border-violet-200 dark:border-violet-800', label: 'Writing' },
    ];
    const benefits = [
      { icon: BarChart3, text: 'CEFR level (A1–C2) with per-skill breakdown', color: 'text-blue-600' },
      { icon: Sparkles, text: 'AI-powered analysis & personalized roadmap', color: 'text-cyan-600' },
      { icon: Trophy, text: 'Course recommendations matched to your level', color: 'text-indigo-600' },
      { icon: ShieldCheck, text: 'No registration required to start', color: 'text-green-600' },
    ];
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 flex items-center justify-center px-4 py-12 relative overflow-hidden">
        {/* Background decorative blobs */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute -top-32 -left-32 w-96 h-96 bg-blue-600/20 rounded-full blur-3xl" />
          <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-cyan-500/20 rounded-full blur-3xl" />
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/10 rounded-full blur-3xl" />
        </div>

        <div className="relative z-10 w-full max-w-2xl">
          {/* Header badge */}
          <div className="flex justify-center mb-6">
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600/20 border border-blue-500/30 text-blue-300 text-sm font-medium backdrop-blur-sm">
              <Zap className="h-4 w-4 text-yellow-400" />
              AI-Powered Adaptive Assessment
            </span>
          </div>

          {/* Main card */}
          <div className="bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl overflow-hidden shadow-2xl">
            {/* Gradient top banner */}
            <div className="bg-gradient-to-r from-blue-600 to-cyan-500 p-8 text-white text-center">
              <div className="flex justify-center mb-4">
                <div className="p-4 bg-white/20 rounded-2xl backdrop-blur-sm">
                  <Brain className="h-12 w-12 text-white" />
                </div>
              </div>
              <h1 className="text-3xl font-extrabold tracking-tight">Free English Placement</h1>
              <p className="mt-2 text-blue-100 text-base">
                The shortest and the most intelligent way to know your English level
              </p>
              <div className="flex items-center justify-center gap-2 mt-4 text-sm text-white/80">
                <Timer className="h-4 w-4" />
                <span>10-minute adaptive test · Instant CEFR results</span>
              </div>
            </div>

            <div className="p-8 space-y-8">
              {/* Skill cards */}
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Skills tested</p>
                <div className="grid grid-cols-4 gap-3">
                  {skillDetails.map(({ skill, icon: Icon, color, label }) => (
                    <div key={skill} className="flex flex-col items-center gap-2 p-3 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
                      <div className={`p-2 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <span className="text-white/80 text-xs font-medium">{label}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Benefits */}
              <div>
                <p className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">What you'll get</p>
                <div className="space-y-2.5">
                  {benefits.map(({ icon: Icon, text, color }, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 border border-white/5">
                      <div className="flex-shrink-0 p-1.5 rounded-lg bg-white/10">
                        <Icon className={`h-4 w-4 ${color}`} />
                      </div>
                      <span className="text-white/80 text-sm">{text}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* How it works */}
              <div className="flex items-center justify-between">
                {[
                  { step: '1', label: 'Answer questions', sub: '~10 min' },
                  { step: '→', label: '', sub: '' },
                  { step: '2', label: 'Get CEFR level', sub: 'Instant' },
                  { step: '→', label: '', sub: '' },
                  { step: '3', label: 'See your roadmap', sub: 'AI-generated' },
                ].map((item, i) =>
                  item.label ? (
                    <div key={i} className="flex flex-col items-center gap-1 flex-1">
                      <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow-lg">
                        {item.step}
                      </div>
                      <span className="text-white/70 text-xs font-medium text-center">{item.label}</span>
                      <span className="text-white/40 text-xs">{item.sub}</span>
                    </div>
                  ) : (
                    <div key={i} className="text-white/30 text-lg font-bold flex-shrink-0">→</div>
                  )
                )}
              </div>

              {/* Start button */}
              <Button
                size="lg"
                className="w-full h-14 text-lg font-bold bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 border-0 rounded-2xl shadow-lg shadow-blue-500/30 transition-all duration-200 hover:shadow-xl hover:shadow-blue-500/40 hover:scale-[1.02]"
                onClick={() => startTestMutation.mutate()}
                disabled={startTestMutation.isPending}
                data-testid="button-start-test"
              >
                {startTestMutation.isPending ? (
                  <span className="flex items-center gap-2">
                    <div className="h-5 w-5 border-2 border-white/50 border-t-white rounded-full animate-spin" />
                    Starting your test…
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    Start Free Test
                    <ArrowRight className="h-5 w-5" />
                  </span>
                )}
              </Button>

              <p className="text-xs text-center text-white/40">
                By starting this test, you agree to share your contact information at the end to receive your results.
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Testing Screen
  if (testStep === 'testing' && currentQuestion) {
    const SkillIcon = skillIcons[currentQuestion.skill as keyof typeof skillIcons] || Brain;
    
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-8 px-4">
        <div className="max-w-3xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <SkillIcon className="h-6 w-6 text-primary" />
                  <div>
                    <CardTitle className="text-xl capitalize">{currentQuestion.skill}</CardTitle>
                    <CardDescription>CEFR Level: {currentQuestion.cefrLevel}</CardDescription>
                  </div>
                </div>
                <Badge variant="outline">{currentQuestion.questionType}</Badge>
              </div>
            </CardHeader>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{currentQuestion.title}</CardTitle>
              <CardDescription className="whitespace-pre-wrap">{currentQuestion.prompt}</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Listening comprehension audio player */}
              {currentQuestion.questionType === 'listening_comprehension' && (
                <div className="space-y-4">
                  <div className="bg-cyan-50 dark:bg-cyan-950 border border-cyan-200 dark:border-cyan-800 rounded-xl p-5 text-center space-y-3">
                    <Headphones className="h-10 w-10 mx-auto text-cyan-600 dark:text-cyan-400" />
                    <p className="text-sm text-cyan-800 dark:text-cyan-200 font-medium">
                      Press Play to listen to the passage, then answer the question.
                    </p>
                    <div className="flex justify-center gap-3 flex-wrap">
                      {!isPlayingAudio ? (
                        <Button
                          size="lg"
                          className="bg-cyan-600 hover:bg-cyan-700 text-white"
                          onClick={() => {
                            const text = currentQuestion.content?.passageText;
                            if (!text || !window.speechSynthesis) return;
                            const utterance = new SpeechSynthesisUtterance(text);
                            utterance.lang = 'en-US';
                            utterance.rate = 0.9;
                            utterance.onstart = () => setIsPlayingAudio(true);
                            utterance.onend = () => { setIsPlayingAudio(false); setIsSpeechComplete(true); };
                            utterance.onerror = () => { setIsPlayingAudio(false); setIsSpeechComplete(true); };
                            window.speechSynthesis.cancel();
                            window.speechSynthesis.speak(utterance);
                          }}
                        >
                          <Play className="me-2 h-5 w-5" />
                          {isSpeechComplete ? 'Play Again' : 'Play Passage'}
                        </Button>
                      ) : (
                        <Button
                          size="lg"
                          variant="outline"
                          className="border-cyan-400 text-cyan-700 dark:text-cyan-300"
                          onClick={() => { window.speechSynthesis?.cancel(); setIsPlayingAudio(false); setIsSpeechComplete(true); }}
                        >
                          <Square className="me-2 h-4 w-4" />
                          Stop
                        </Button>
                      )}
                    </div>
                    {isPlayingAudio && (
                      <div className="flex items-center justify-center gap-1.5">
                        {[0, 1, 2, 3, 4].map((i) => (
                          <div
                            key={i}
                            className="w-1 bg-cyan-500 rounded-full animate-pulse"
                            style={{ height: `${8 + i * 4}px`, animationDelay: `${i * 0.1}s` }}
                          />
                        ))}
                        <span className="text-xs text-cyan-600 dark:text-cyan-400 ms-2">Playing…</span>
                      </div>
                    )}
                  </div>
                  {/* Show question after audio starts/completes */}
                  {(isSpeechComplete || isPlayingAudio) && currentQuestion.content?.question && (
                    <div className="bg-muted/50 rounded-lg p-4 border">
                      <p className="font-medium text-sm">{currentQuestion.content.question}</p>
                    </div>
                  )}
                </div>
              )}

              {currentQuestion.responseType === 'text' && (
                <Textarea
                  placeholder="Type your answer here..."
                  value={userResponse}
                  onChange={(e) => setUserResponse(e.target.value)}
                  rows={6}
                  data-testid="input-answer-text"
                />
              )}

              {currentQuestion.responseType === 'multiple_choice' && currentQuestion.content?.options && (
                <RadioGroup value={userResponse} onValueChange={setUserResponse}>
                  {currentQuestion.content.options.map((option: string, index: number) => (
                    <div key={index} className="flex items-center space-x-2">
                      <RadioGroupItem value={option} id={`option-${index}`} />
                      <Label htmlFor={`option-${index}`} className="cursor-pointer">
                        {option}
                      </Label>
                    </div>
                  ))}
                </RadioGroup>
              )}

              {currentQuestion.responseType === 'audio' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-950 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                    <p className="text-sm text-blue-800 dark:text-blue-200 mb-2">
                      <strong>Instructions:</strong> Click the microphone button and speak your answer clearly. 
                      You have up to {currentQuestion.expectedDurationSeconds} seconds.
                    </p>
                  </div>

                  <div className="text-center space-y-4 p-6 border-2 border-dashed border-primary/30 rounded-lg">
                    {!audioBlob && !isRecording && (
                      <>
                        <Mic className="h-12 w-12 mx-auto text-primary" />
                        <div>
                          <p className="font-medium mb-2">Record your answer</p>
                          <p className="text-sm text-muted-foreground mb-4">
                            Click the button below to start recording your response
                          </p>
                        </div>
                        <Button
                          onClick={startRecording}
                          size="lg"
                          className="w-full sm:w-auto"
                          data-testid="button-start-recording"
                        >
                          <Mic className="me-2 h-5 w-5" />
                          Start Recording
                        </Button>
                      </>
                    )}

                    {isRecording && (
                      <div className="space-y-4">
                        <Mic className="h-12 w-12 mx-auto text-red-500 animate-pulse" />
                        <div className="flex items-center justify-center gap-3">
                          <Badge variant="destructive" className="animate-pulse">
                            Recording...
                          </Badge>
                          <span className="text-lg font-mono text-red-600 dark:text-red-400 font-bold">
                            {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          Recording will auto-stop when timer reaches 0:00
                        </p>
                        <Button
                          onClick={stopRecording}
                          size="lg"
                          variant="outline"
                          className="w-full sm:w-auto"
                          data-testid="button-stop-recording"
                        >
                          <Square className="me-2 h-4 w-4" />
                          Stop Early
                        </Button>
                      </div>
                    )}

                    {audioBlob && !isRecording && (
                      <div className="space-y-4">
                        <div className="flex items-center justify-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-green-500" />
                          <span className="font-medium">Recording complete</span>
                        </div>
                        {audioURL && (
                          <div className="flex items-center justify-center">
                            <audio src={audioURL} controls className="max-w-full" />
                          </div>
                        )}
                        <Button
                          onClick={deleteRecording}
                          size="sm"
                          variant="outline"
                          data-testid="button-delete-recording"
                        >
                          <Trash2 className="h-4 w-4 me-2" />
                          Delete & Re-record
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              )}

              <Button
                className="w-full"
                onClick={handleSubmitResponse}
                disabled={!userResponse || submitResponseMutation.isPending}
                data-testid="button-submit-answer"
              >
                {submitResponseMutation.isPending ? 'Submitting...' : 'Submit Answer'}
                <ArrowRight className="ms-2 h-4 w-4" />
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  // Contact Modal
  if (showContactModal && testResults) {
    return (
      <Dialog open={showContactModal} onOpenChange={setShowContactModal}>
        <DialogContent className="max-w-[95vw] sm:max-w-md max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Great job! You've completed the test</DialogTitle>
            <DialogDescription>
              Please provide your contact information to view your detailed results and receive personalized recommendations.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={handleSubmitContact} className="space-y-4">
            <div>
              <Label htmlFor="name">Full Name *</Label>
              <Input
                id="name"
                value={contactForm.name}
                onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                required
                data-testid="input-contact-name"
              />
            </div>
            <div>
              <Label htmlFor="email">Email *</Label>
              <Input
                id="email"
                type="email"
                value={contactForm.email}
                onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                required
                data-testid="input-contact-email"
              />
            </div>
            <div>
              <Label htmlFor="phone">Phone (Optional)</Label>
              <Input
                id="phone"
                type="tel"
                value={contactForm.phone}
                onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                data-testid="input-contact-phone"
              />
            </div>
            <div className="flex gap-2">
              <Button type="submit" className="flex-1" disabled={submitContactMutation.isPending} data-testid="button-submit-contact">
                {submitContactMutation.isPending ? 'Saving...' : 'View Results'}
              </Button>
              <Button type="button" variant="outline" onClick={handleSkipContact} data-testid="button-skip-contact">
                Skip
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    );
  }

  // Roadmap Generation Loading Screen
  if (testStep === 'roadmap' && isGeneratingRoadmap) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center px-4">
        <Card className="w-full max-w-md text-center p-8">
          <Brain className="h-16 w-16 mx-auto mb-4 text-primary animate-pulse" />
          <CardTitle className="text-2xl mb-2">Generating Your Personalized Roadmap</CardTitle>
          <CardDescription className="mb-6">
            Our AI is creating a customized learning path based on your test results...
          </CardDescription>
          <Progress value={66} className="w-full" />
        </Card>
      </div>
    );
  }

  // Results Screen
  if (testStep === 'results' && testResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 py-12 px-4">
        <div className="max-w-5xl mx-auto space-y-6">
          <Card className="shadow-xl">
            <CardHeader className="text-center">
              <div className="flex justify-center mb-4">
                <CheckCircle2 className="h-16 w-16 text-green-500" />
              </div>
              <CardTitle className="text-3xl">Your English Level</CardTitle>
              <div className="text-5xl font-bold text-primary mt-4">{testResults.overallLevel}</div>
              <CardDescription className="text-lg mt-2">
                Overall Score: {testResults.scores.overall?.toFixed(1)}%
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {Object.entries(testResults.skillLevels).map(([skill, level]) => {
                  const Icon = skillIcons[skill as keyof typeof skillIcons];
                  const score = testResults.scores[skill as keyof typeof testResults.scores];
                  return (
                    <Card key={skill} className="text-center p-4">
                      <Icon className="h-8 w-8 mx-auto mb-2 text-primary" />
                      <p className="text-sm font-medium capitalize mb-1">{skill}</p>
                      <p className="text-2xl font-bold">{level}</p>
                      <p className="text-xs text-muted-foreground">{score?.toFixed(0)}%</p>
                    </Card>
                  );
                })}
              </div>

              {testResults.strengths && testResults.strengths.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Your Strengths</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {testResults.strengths.map((strength, i) => (
                      <li key={i} className="text-sm">{strength}</li>
                    ))}
                  </ul>
                </div>
              )}

              {testResults.recommendations && testResults.recommendations.length > 0 && (
                <div>
                  <h3 className="font-semibold mb-2">Recommendations</h3>
                  <ul className="list-disc list-inside space-y-1">
                    {testResults.recommendations.map((rec, i) => (
                      <li key={i} className="text-sm">{rec}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>

          {/* AI-Generated Personalized Roadmap */}
          {personalizedRoadmap && personalizedRoadmap.milestones && (
            <Card className="shadow-xl border-2 border-primary/20">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <Brain className="h-8 w-8 text-primary" />
                  <div>
                    <CardTitle className="text-2xl">Your Personalized Learning Roadmap</CardTitle>
                    <CardDescription className="text-base mt-1">
                      {personalizedRoadmap.description}
                    </CardDescription>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit mt-2">
                  {personalizedRoadmap.estimatedWeeks} weeks • AI-Generated
                </Badge>
              </CardHeader>
              <CardContent className="space-y-6">
                {personalizedRoadmap.milestones.map((milestone: any, index: number) => (
                  <Card key={milestone.id} className="border-l-4 border-l-primary">
                    <CardHeader>
                      <div className="flex items-start gap-3">
                        <Badge className="mt-1">Week {(index * 3) + 1}-{(index + 1) * 3}</Badge>
                        <div className="flex-1">
                          <CardTitle className="text-lg">{milestone.title}</CardTitle>
                          <CardDescription>{milestone.description}</CardDescription>
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {milestone.steps && milestone.steps.map((step: any) => (
                          <div key={step.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/50">
                            <CheckCircle2 className="h-5 w-5 text-primary mt-0.5 flex-shrink-0" />
                            <div className="flex-1">
                              <p className="font-medium text-sm">{step.title}</p>
                              <p className="text-xs text-muted-foreground mt-1">{step.description}</p>
                              <div className="flex items-center gap-4 mt-2 text-xs">
                                <Badge variant="outline" className="text-xs">
                                  <Clock className="h-3 w-3 me-1" />
                                  {step.estimatedHours}h
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {step.resourceType}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </CardContent>
            </Card>
          )}

          <div className="pt-4 space-y-3">
            <Button className="w-full" size="lg" onClick={() => navigate('/curriculum')} data-testid="button-explore-courses">
              Explore Our Courses
              <ArrowRight className="ms-2 h-5 w-5" />
            </Button>
            <Button variant="outline" className="w-full" onClick={() => navigate('/auth?tab=register')} data-testid="button-register">
              Create Account to Start Learning
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
