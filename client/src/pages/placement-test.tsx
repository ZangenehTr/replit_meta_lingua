import React, { useState, useEffect, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Clock, Brain, CheckCircle, AlertCircle, Mic, PenTool, Headphones, BookOpen } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Textarea } from '@/components/ui/textarea';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';

interface PlacementTestSession {
  id: number;
  status: 'in_progress' | 'completed' | 'abandoned';
  currentSkill: 'speaking' | 'listening' | 'reading' | 'writing';
  currentQuestionIndex?: number;
  startedAt: string;
  maxDurationMinutes: number;
}

interface PlacementTestQuestion {
  id: number;
  skill: string;
  level: string;
  type: string;
  title: string;
  prompt: string;
  content: any;
  responseType: 'audio' | 'text' | 'multiple_choice';
  expectedDurationSeconds: number;
  estimatedMinutes: number;
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
  analysis?: {
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    confidenceScore: number;
  };
}

const skillIcons = {
  speaking: Mic,
  listening: Headphones,
  reading: BookOpen,
  writing: PenTool
};

const skillColors = {
  speaking: 'bg-blue-500',
  listening: 'bg-green-500',
  reading: 'bg-purple-500',
  writing: 'bg-orange-500'
};

export default function PlacementTestPage() {
  const [currentSession, setCurrentSession] = useState<PlacementTestSession | null>(null);
  const [currentQuestion, setCurrentQuestion] = useState<PlacementTestQuestion | null>(null);
  const [userResponse, setUserResponse] = useState<any>('');
  const [timeRemaining, setTimeRemaining] = useState<number>(600); // 10 minutes
  const [isRecording, setIsRecording] = useState(false);
  const [testResults, setTestResults] = useState<PlacementTestResults | null>(null);
  const [testStep, setTestStep] = useState<'intro' | 'testing' | 'completed'>('intro');
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [recordingTimeLeft, setRecordingTimeLeft] = useState<number>(0);
  const [recordingTimer, setRecordingTimer] = useState<NodeJS.Timeout | null>(null);
  const autoSubmitAfterRecording = useRef(false);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Start placement test mutation
  const startTestMutation = useMutation({
    mutationFn: async (data: { targetLanguage: string; learningGoal?: string }) => {
      const response = await fetch('/api/placement-test/start', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: JSON.stringify(data)
      });
      
      if (!response.ok) {
        throw new Error('Failed to start placement test');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data.session);
      setTestStep('testing');
      fetchNextQuestion(data.session.id);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to start placement test. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Submit response mutation
  const submitResponseMutation = useMutation({
    mutationFn: async (data: { sessionId: number; questionId: number; userResponse: any; audioBlob?: Blob }) => {
      let response;
      
      if (data.audioBlob) {
        // Handle audio submission with FormData
        const formData = new FormData();
        formData.append('questionId', data.questionId.toString());
        formData.append('audio', data.audioBlob, 'recording.webm');
        
        response = await fetch(`/api/placement-test/sessions/${data.sessionId}/responses`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: formData
        });
      } else {
        // Handle text/multiple choice submission with JSON
        response = await fetch(`/api/placement-test/sessions/${data.sessionId}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${localStorage.getItem('token')}`
          },
          body: JSON.stringify({
            questionId: data.questionId,
            userResponse: data.userResponse
          })
        });
      }
      
      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      console.log('Response submitted successfully:', data);
      
      // After successful submission, fetch the next question
      if (currentSession) {
        fetchNextQuestion(currentSession.id);
      }
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to submit response. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Fetch next question
  const fetchNextQuestion = async (sessionId: number) => {
    try {
      console.log('[DEBUG] Fetching next question for session:', sessionId);
      const response = await fetch(`/api/placement-test/sessions/${sessionId}/next-question`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch next question');
      }
      
      const data = await response.json();
      console.log('[DEBUG] Next question response:', data);
      
      if (data.testCompleted) {
        console.log('[DEBUG] Test completed, showing results');
        setTestStep('completed');
        setTestResults(data.results);
      } else if (data.question) {
        console.log('[DEBUG] Setting new question:', data.question);
        setCurrentQuestion(data.question);
        // Reset audio state for new question
        setUserResponse('');
        setAudioBlob(null);
        setIsRecording(false);
        setRecordingTimeLeft(0);
        if (recordingTimer) {
          clearInterval(recordingTimer);
          setRecordingTimer(null);
        }
        console.log('[DEBUG] Question state updated, new question ID:', data.question.id);
      } else {
        console.log('[DEBUG] No question in response:', data);
      }
    } catch (error) {
      console.error('Error fetching next question:', error);
      toast({
        title: 'Error',
        description: 'Failed to load next question',
        variant: 'destructive'
      });
    }
  };

  // Fetch test results
  const fetchTestResults = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch(`/api/placement-test/sessions/${currentSession.id}/results`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setTestResults(data.results);
      }
    } catch (error) {
      console.error('Error fetching results:', error);
    }
  };

  // Timer effect
  useEffect(() => {
    if (testStep === 'testing' && timeRemaining > 0) {
      const timer = setInterval(() => {
        setTimeRemaining(prev => {
          if (prev <= 1) {
            // Time's up - auto-submit test
            if (currentSession && currentQuestion) {
              console.log('Test time expired, auto-submitting...');
              submitResponseMutation.mutate({
                sessionId: currentSession.id,
                questionId: currentQuestion.id,
                userResponse: userResponse || 'Time expired',
                audioBlob: audioBlob
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);

      return () => clearInterval(timer);
    }
  }, [testStep, timeRemaining, currentSession, currentQuestion, userResponse, audioBlob, submitResponseMutation]);

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const handleStartTest = () => {
    startTestMutation.mutate({
      targetLanguage: 'english',
      learningGoal: 'general'
    });
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: Blob[] = [];

      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };

      recorder.onstop = () => {
        console.log('Recording stopped, chunks:', chunks.length);
        const blob = new Blob(chunks, { type: 'audio/webm' });
        console.log('Audio blob created, size:', blob.size);
        setAudioBlob(blob);
        
        // Create audio URL for the response
        const audioUrl = URL.createObjectURL(blob);
        const responseData = { 
          audioUrl, 
          audioBlob: blob, 
          duration: currentQuestion?.expectedDurationSeconds || 60 
        };
        console.log('Setting user response:', responseData);
        setUserResponse(responseData);
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
        
        // Check if we need to auto-submit due to recording time expiry
        if (autoSubmitAfterRecording.current) {
          console.log('Auto-submitting due to recording time expiry...');
          autoSubmitAfterRecording.current = false;
          
          // Reset recording timer state to prevent multiple auto-submissions
          if (recordingTimer) {
            clearInterval(recordingTimer);
            setRecordingTimer(null);
          }
          
          // Auto-submit after a short delay to ensure state is updated
          setTimeout(() => {
            if (currentSession && currentQuestion) {
              submitResponseMutation.mutate({
                sessionId: currentSession.id,
                questionId: currentQuestion.id,
                userResponse: responseData,
                audioBlob: blob
              });
            }
          }, 200);
        } else {
          toast({
            title: 'Recording Complete',
            description: `Recorded ${blob.size} bytes of audio. You can now submit your answer.`,
            variant: 'default'
          });
        }
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Set recording timer
      const duration = currentQuestion?.expectedDurationSeconds || 60;
      setRecordingTimeLeft(duration);
      
      const timer = setInterval(() => {
        setRecordingTimeLeft(prev => {
          const newTime = prev - 1;
          if (newTime <= 0) {
            // Auto-stop when time reaches 0
            console.log('Recording time expired, auto-stopping...');
            autoSubmitAfterRecording.current = true;
            clearInterval(timer); // Clear the timer immediately
            setTimeout(() => stopRecording(), 100);
            return 0;
          }
          return newTime;
        });
      }, 1000);
      
      setRecordingTimer(timer);
      
    } catch (error) {
      console.error('Error starting recording:', error);
      
      // For test environments or when microphone is not available,
      // create a mock audio blob to allow testing to continue
      if (error instanceof DOMException && error.name === 'NotFoundError') {
        console.log('Microphone not available, creating mock audio for testing...');
        
        // Create a minimal mock audio blob
        const mockAudioBlob = new Blob(['mock-audio-data'], { type: 'audio/webm' });
        setAudioBlob(mockAudioBlob);
        
        // Create mock response data
        const mockResponseData = {
          audioUrl: 'mock-audio-url',
          audioBlob: mockAudioBlob,
          duration: currentQuestion?.expectedDurationSeconds || 60
        };
        
        setUserResponse(mockResponseData);
        setIsRecording(false);
        
        toast({
          title: 'Test Mode',
          description: 'Microphone not available - using test mode audio. You can now submit your response.',
          variant: 'default'
        });
      } else {
        toast({
          title: 'Recording Error',
          description: 'Failed to start recording. Please check your microphone permissions or continue in test mode.',
          variant: 'destructive'
        });
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
    setIsRecording(false);
    setRecordingTimeLeft(0);
    if (recordingTimer) {
      clearInterval(recordingTimer);
      setRecordingTimer(null);
    }
  };

  const handleRecordingToggle = () => {
    if (isRecording) {
      stopRecording();
    } else {
      startRecording();
    }
  };

  // Cleanup function
  useEffect(() => {
    return () => {
      if (recordingTimer) {
        clearInterval(recordingTimer);
      }
      if (mediaRecorder) {
        mediaRecorder.stop();
      }
    };
  }, [recordingTimer, mediaRecorder]);

  const handleSubmitResponse = () => {
    if (!currentSession || !currentQuestion) return;

    let responseData = userResponse;
    let audioBlob = null;

    // Format response based on question type
    if (currentQuestion.responseType === 'multiple_choice') {
      responseData = { selectedOption: userResponse };
    } else if (currentQuestion.responseType === 'audio') {
      audioBlob = userResponse?.audioBlob || null;
      responseData = { 
        audioUrl: userResponse?.audioUrl || '', 
        transcript: '',
        duration: userResponse?.duration || 0
      };
    } else {
      responseData = { text: userResponse };
    }

    submitResponseMutation.mutate({
      sessionId: currentSession.id,
      questionId: currentQuestion.id,
      userResponse: responseData,
      audioBlob: audioBlob
    });
  };

  const renderIntroScreen = () => (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto pt-8">
        <Card className="border-0 shadow-xl">
          <CardHeader className="text-center pb-8">
            <div className="mx-auto mb-4 p-4 bg-indigo-100 rounded-full w-fit">
              <Brain className="h-12 w-12 text-indigo-600" />
            </div>
            <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
              AI-Powered Placement Test
            </CardTitle>
            <CardDescription className="text-lg text-gray-600 max-w-2xl mx-auto">
              Take our intelligent 10-minute assessment to discover your current English level
              and get a personalized learning roadmap instantly generated by AI.
            </CardDescription>
          </CardHeader>
          
          <CardContent className="space-y-8">
            <div className="grid md:grid-cols-2 gap-6">
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-green-600" />
                  What You'll Get
                </h3>
                <ul className="space-y-3 text-gray-600">
                  <li className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">CEFR</Badge>
                    <span>Accurate CEFR level assessment (A1-C2)</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">AI</Badge>
                    <span>Instant personalized learning roadmap</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">Skills</Badge>
                    <span>Speaking, Listening, Reading & Writing evaluation</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Badge variant="secondary" className="mt-0.5">Smart</Badge>
                    <span>Adaptive difficulty based on your responses</span>
                  </li>
                </ul>
              </div>
              
              <div className="space-y-4">
                <h3 className="text-xl font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="h-5 w-5 text-blue-600" />
                  How It Works
                </h3>
                <div className="space-y-4">
                  {[
                    { skill: 'speaking', step: '1. Speaking Assessment', desc: 'Starts with speaking questions that adapt to your level' },
                    { skill: 'listening', step: '2. Listening & Reading', desc: 'Listening and reading questions based on your speaking level' },
                    { skill: 'writing', step: '3. Writing Tasks', desc: 'Short writing exercises to complete the assessment' },
                    { skill: 'reading', step: '4. Instant Results', desc: 'Get your CEFR levels and AI-generated learning roadmap' }
                  ].map((item, index) => {
                    const Icon = skillIcons[item.skill as keyof typeof skillIcons] || Brain;
                    return (
                      <div key={index} className="flex items-start gap-3">
                        <div className={`p-2 rounded-lg ${skillColors[item.skill as keyof typeof skillColors]} bg-opacity-20`}>
                          <Icon className="h-4 w-4 text-gray-700" />
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{item.step}</div>
                          <div className="text-sm text-gray-600">{item.desc}</div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <AlertCircle className="h-4 w-4 text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Important:</strong> This test has a 10-minute time limit and uses adaptive questioning. 
                Your first speaking responses will determine the difficulty level of subsequent questions.
                Make sure you're in a quiet environment for the speaking portions.
              </AlertDescription>
            </Alert>

            <div className="flex justify-center pt-4">
              <Button 
                onClick={handleStartTest}
                disabled={startTestMutation.isPending}
                size="lg"
                className="px-8 py-3 text-lg"
              >
                {startTestMutation.isPending ? (
                  'Starting Assessment...'
                ) : (
                  'Start Placement Test'
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );

  const renderTestInterface = () => {
    if (!currentQuestion) return null;

    const Icon = skillIcons[currentQuestion.skill as keyof typeof skillIcons] || Brain;
    const skillColor = skillColors[currentQuestion.skill as keyof typeof skillColors] || 'bg-gray-500';

    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="max-w-4xl mx-auto">
          {/* Header with timer and progress */}
          <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`p-2 rounded-lg ${skillColor} bg-opacity-20`}>
                  <Icon className="h-5 w-5 text-gray-700" />
                </div>
                <div>
                  <h2 className="text-lg font-semibold capitalize">{currentQuestion.skill} Assessment</h2>
                  <p className="text-sm text-gray-600">Level: {currentQuestion.level} • {currentQuestion.type}</p>
                </div>
              </div>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm text-gray-500">Time Remaining</div>
                  <div className={`text-lg font-mono font-bold ${timeRemaining < 120 ? 'text-red-600' : 'text-green-600'}`}>
                    {formatTime(timeRemaining)}
                  </div>
                </div>
                <Badge variant={timeRemaining < 120 ? 'destructive' : 'secondary'}>
                  {timeRemaining < 120 ? 'Hurry!' : 'On Track'}
                </Badge>
              </div>
            </div>
            
            <div className="mt-4">
              <Progress value={currentSession ? Math.min(100, (currentSession.currentQuestionIndex || 0) * 25) : 0} className="h-2" />
            </div>
          </div>

          {/* Question Card */}
          <Card className="shadow-sm">
            <CardHeader>
              <CardTitle className="text-xl">{currentQuestion.title}</CardTitle>
              <CardDescription className="text-base leading-relaxed">
                {currentQuestion.prompt}
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Question Content */}
              {currentQuestion.content && (
                <div className="bg-gray-50 p-4 rounded-lg">
                  {currentQuestion.content.passage && (
                    <div className="prose max-w-none">
                      <p>{currentQuestion.content.passage}</p>
                    </div>
                  )}
                  {currentQuestion.content.audioUrl && (
                    <div className="flex items-center gap-3">
                      <Headphones className="h-5 w-5 text-gray-600" />
                      <audio controls src={currentQuestion.content.audioUrl} className="flex-1" />
                    </div>
                  )}
                </div>
              )}

              {/* Response Interface */}
              <div className="space-y-4">
                {currentQuestion.responseType === 'audio' && (
                  <div className="space-y-4">
                    <div className="flex items-center gap-3">
                      <Button
                        onClick={handleRecordingToggle}
                        variant={isRecording ? 'destructive' : 'default'}
                        className="flex items-center gap-2"
                        disabled={submitResponseMutation.isPending}
                      >
                        <Mic className="h-4 w-4" />
                        {isRecording ? 'Stop Recording' : (audioBlob ? 'Record Again' : 'Start Recording')}
                      </Button>
                      {isRecording && (
                        <div className="flex items-center gap-2">
                          <Badge variant="destructive" className="animate-pulse">Recording...</Badge>
                          <span className="text-sm font-mono text-red-600">
                            {Math.floor(recordingTimeLeft / 60)}:{(recordingTimeLeft % 60).toString().padStart(2, '0')}
                          </span>
                        </div>
                      )}
                      {audioBlob && !isRecording && (
                        <Badge variant="secondary" className="text-green-700">✓ Recording Complete</Badge>
                      )}
                    </div>
                    
                    {/* Show instructions and additional content */}
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <p className="text-sm text-blue-800 mb-2">
                        <strong>Instructions:</strong> Click the microphone button and speak your answer clearly. 
                        You have up to {currentQuestion.expectedDurationSeconds} seconds.
                      </p>
                      {currentQuestion.content?.instructions && (
                        <p className="text-sm text-blue-700">
                          <strong>Tips:</strong> {currentQuestion.content.instructions}
                        </p>
                      )}
                      {currentQuestion.content?.keywords && (
                        <div className="mt-2">
                          <p className="text-xs text-blue-600 font-medium">Key topics to include:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {currentQuestion.content.keywords.map((keyword: string, index: number) => (
                              <Badge key={index} variant="outline" className="text-xs border-blue-300 text-blue-600">
                                {keyword}
                              </Badge>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Test mode fallback option */}
                    {!audioBlob && !isRecording && (
                      <div className="bg-yellow-50 p-3 rounded-lg border border-yellow-200">
                        <p className="text-sm text-yellow-800 mb-2">
                          <strong>Having trouble with recording?</strong> You can continue in test mode:
                        </p>
                        <Button 
                          onClick={() => {
                            // Create mock audio for test mode
                            const mockAudioBlob = new Blob(['test-mode-audio'], { type: 'audio/webm' });
                            setAudioBlob(mockAudioBlob);
                            const mockResponseData = {
                              audioUrl: 'test-mode-url',
                              audioBlob: mockAudioBlob,
                              duration: currentQuestion?.expectedDurationSeconds || 60
                            };
                            setUserResponse(mockResponseData);
                            toast({
                              title: 'Test Mode Enabled',
                              description: 'You can now submit your response and continue with the test.',
                              variant: 'default'
                            });
                          }}
                          variant="outline"
                          size="sm"
                          className="text-yellow-700 border-yellow-300 hover:bg-yellow-100"
                        >
                          Continue in Test Mode
                        </Button>
                      </div>
                    )}

                    {/* Audio playback if recording exists */}
                    {audioBlob && !isRecording && (
                      <div className="bg-green-50 p-3 rounded-lg border border-green-200">
                        <p className="text-sm text-green-800 mb-2">Your recording:</p>
                        <audio 
                          controls 
                          src={userResponse?.audioUrl} 
                          className="w-full"
                        />
                      </div>
                    )}
                  </div>
                )}

                {currentQuestion.responseType === 'text' && (
                  <div className="space-y-2">
                    <Label htmlFor="response">Your Answer</Label>
                    <Textarea
                      id="response"
                      placeholder="Type your answer here..."
                      value={userResponse}
                      onChange={(e) => setUserResponse(e.target.value)}
                      className="min-h-32"
                    />
                  </div>
                )}

                {currentQuestion.responseType === 'multiple_choice' && currentQuestion.content.options && (
                  <div className="space-y-3">
                    <Label>Select your answer:</Label>
                    <RadioGroup value={userResponse} onValueChange={setUserResponse}>
                      {currentQuestion.content.options.map((option: string, index: number) => (
                        <div key={index} className="flex items-center space-x-2">
                          <RadioGroupItem value={option} id={`option-${index}`} />
                          <Label htmlFor={`option-${index}`} className="flex-1 cursor-pointer">
                            {option}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}
              </div>

              <div className="flex justify-between pt-4">
                <div className="text-sm text-gray-500">
                  Estimated time: {currentQuestion.estimatedMinutes} minutes
                </div>
                
                <Button 
                  onClick={handleSubmitResponse}
                  disabled={
                    (currentQuestion.responseType === 'audio' ? !audioBlob : !userResponse) || 
                    submitResponseMutation.isPending ||
                    isRecording
                  }
                  className="px-6"
                >
                  {submitResponseMutation.isPending ? 'Submitting...' : (
                    currentQuestion.responseType === 'audio' && !audioBlob ? 
                    'Record your answer first' : 'Submit Answer'
                  )}
                </Button>
                
                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs text-gray-500 mt-2">
                    Debug: audioBlob={audioBlob ? 'exists' : 'null'}, 
                    userResponse={userResponse ? 'exists' : 'empty'}, 
                    isRecording={isRecording ? 'true' : 'false'},
                    responseType={currentQuestion.responseType}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  const renderResults = () => {
    if (!testResults) return null;

    return (
      <div className="min-h-screen bg-gradient-to-br from-green-50 to-emerald-100 p-4">
        <div className="max-w-4xl mx-auto pt-8">
          <Card className="border-0 shadow-xl">
            <CardHeader className="text-center pb-8">
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-fit">
                <CheckCircle className="h-12 w-12 text-green-600" />
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 mb-2">
                Assessment Complete!
              </CardTitle>
              <CardDescription className="text-lg text-gray-600">
                Your English proficiency has been evaluated using CEFR standards
              </CardDescription>
            </CardHeader>

            <CardContent className="space-y-8">
              {/* Overall Level */}
              <div className="text-center">
                <div className="inline-flex items-center gap-3 bg-indigo-100 px-6 py-3 rounded-full">
                  <span className="text-lg font-medium text-indigo-800">Overall Level:</span>
                  <Badge className="text-2xl py-2 px-4 bg-indigo-600 text-white font-bold">
                    {testResults.overallLevel}
                  </Badge>
                </div>
                <p className="text-gray-600 mt-2">Score: {Math.round(testResults.scores.overall)}%</p>
              </div>

              {/* Skill Breakdown */}
              <div className="grid md:grid-cols-2 gap-6">
                {Object.entries(testResults.skillLevels).map(([skill, level]) => {
                  const Icon = skillIcons[skill as keyof typeof skillIcons];
                  const score = testResults.scores[skill as keyof typeof testResults.scores];
                  const skillColor = skillColors[skill as keyof typeof skillColors];
                  
                  return (
                    <div key={skill} className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="flex items-center gap-3 mb-3">
                        <div className={`p-2 rounded-lg ${skillColor} bg-opacity-20`}>
                          <Icon className="h-5 w-5 text-gray-700" />
                        </div>
                        <div>
                          <h3 className="font-semibold capitalize text-gray-900">{skill}</h3>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="font-bold">{level}</Badge>
                            <span className="text-sm text-gray-600">{Math.round(score)}%</span>
                          </div>
                        </div>
                      </div>
                      <Progress value={score} className="h-2" />
                    </div>
                  );
                })}
              </div>

              {/* Strengths and Recommendations */}
              <div className="grid md:grid-cols-2 gap-6">
                {testResults.analysis && Array.isArray(testResults.analysis.strengths) && testResults.analysis.strengths.length > 0 && (
                  <div className="bg-green-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-green-800 mb-3 flex items-center gap-2">
                      <CheckCircle className="h-5 w-5" />
                      Your Strengths
                    </h3>
                    <ul className="space-y-2">
                      {testResults.analysis.strengths.map((strength, index) => (
                        <li key={index} className="text-green-700 text-sm">• {strength}</li>
                      ))}
                    </ul>
                  </div>
                )}

                {testResults.analysis && Array.isArray(testResults.analysis.recommendations) && testResults.analysis.recommendations.length > 0 && (
                  <div className="bg-blue-50 p-6 rounded-lg">
                    <h3 className="font-semibold text-blue-800 mb-3 flex items-center gap-2">
                      <Brain className="h-5 w-5" />
                      Recommendations
                    </h3>
                    <ul className="space-y-2">
                      {testResults.analysis.recommendations.map((rec, index) => (
                        <li key={index} className="text-blue-700 text-sm">• {rec}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              <div className="text-center pt-6">
                <Button size="lg" onClick={() => window.location.href = '/dashboard'}>
                  Generate My Learning Roadmap
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  };

  // Render based on current step
  if (testStep === 'intro') {
    return renderIntroScreen();
  } else if (testStep === 'testing') {
    return renderTestInterface();
  } else {
    return renderResults();
  }
}