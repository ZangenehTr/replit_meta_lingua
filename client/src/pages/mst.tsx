import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { useMutation, useQuery } from '@tanstack/react-query';
import { Clock, Mic, MicOff, Play, Pause, Volume2 } from 'lucide-react';

// Force LTR styles for MST component
const mstStyle = {
  direction: 'ltr' as const,
  textAlign: 'left' as const,
};

type MSTSkill = 'listening' | 'reading' | 'speaking' | 'writing';
type MSTStage = 'S1' | 'S2';

interface MSTSession {
  sessionId: string;
  skillOrder: MSTSkill[];
  perSkillSeconds: number;
  totalSeconds: number;
  status: 'active' | 'completed' | 'expired';
}

interface MSTItem {
  id: string;
  skill: MSTSkill;
  stage: MSTStage;
  cefr: string;
  timing: {
    maxAnswerSec: number;
    audioSec?: number;
    prepSec?: number;
    recordSec?: number;
  };
  content: any;
  metadata: {
    domain?: string;
    accent?: string;
  };
}

interface MSTStatus {
  session: {
    id: string;
    status: string;
    currentSkill: MSTSkill;
    currentStage: MSTStage;
    skillOrder: MSTSkill[];
  };
  timing: {
    totalElapsedSec: number;
    totalRemainingSec: number;
    skillElapsedSec: number;
    skillRemainingSec: number;
  };
  progress: {
    completedSkills: number;
    totalSkills: number;
    shouldAutoAdvance: boolean;
  };
}

export default function MSTPage() {
  const { toast } = useToast();
  const [currentSession, setCurrentSession] = useState<MSTSession | null>(null);
  const [currentItem, setCurrentItem] = useState<MSTItem | null>(null);
  const [currentResponse, setCurrentResponse] = useState<any>('');
  const [isRecording, setIsRecording] = useState(false);
  const [recordingBlob, setRecordingBlob] = useState<Blob | null>(null);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [testPhase, setTestPhase] = useState<'intro' | 'testing' | 'completed'>('intro');
  const [currentSkillIndex, setCurrentSkillIndex] = useState(0);
  const [currentStage, setCurrentStage] = useState<MSTStage>('S1');
  const [guardTimer, setGuardTimer] = useState(0);
  const [itemTimer, setItemTimer] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);

  // Start MST session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/mst/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          targetLanguage: 'english'
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to start MST session');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      setCurrentSession(data);
      setTestPhase('testing');
      fetchFirstItem(data.sessionId);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: 'Failed to start MST test. Please try again.',
        variant: 'destructive'
      });
    }
  });

  // Get MST status
  const { data: status, refetch: refetchStatus } = useQuery({
    queryKey: ['mst-status', currentSession?.sessionId],
    queryFn: async () => {
      if (!currentSession?.sessionId) return null;
      
      const response = await fetch(`/api/mst/status?sessionId=${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (!response.ok) {
        throw new Error('Failed to get status');
      }
      
      const data = await response.json();
      return data.success ? data : null;
    },
    enabled: !!currentSession?.sessionId && testPhase === 'testing',
    refetchInterval: 1000 // Update every second
  });

  // Submit response
  const submitResponseMutation = useMutation({
    mutationFn: async (data: {
      sessionId: string;
      skill: MSTSkill;
      stage: MSTStage;
      itemId: string;
      responseData?: any;
      audioBlob?: Blob;
      timeSpentMs: number;
    }) => {
      const formData = new FormData();
      formData.append('sessionId', data.sessionId);
      formData.append('skill', data.skill);
      formData.append('stage', data.stage);
      formData.append('itemId', data.itemId);
      formData.append('timeSpentMs', data.timeSpentMs.toString());
      
      if (data.audioBlob) {
        formData.append('audio', data.audioBlob, 'recording.webm');
      } else {
        formData.append('responseData', JSON.stringify(data.responseData));
      }
      
      const response = await fetch('/api/mst/response', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        },
        body: formData
      });
      
      if (!response.ok) {
        throw new Error('Failed to submit response');
      }
      
      return response.json();
    },
    onSuccess: (data) => {
      // Handle routing decision and fetch next item
      if (data.success) {
        if (currentStage === 'S1') {
          // Determine S2 stage based on routing
          const nextStage: MSTStage = 'S2';
          setCurrentStage(nextStage);
          fetchNextItem();
        } else {
          // Complete skill, advance to next
          advanceToNextSkill();
        }
      }
      
      // Reset form and audio
      setCurrentResponse('');
      setRecordingBlob(null);
      
      // Reset audio element for new item
      if (audioElement) {
        setAudioElement(null);
        setIsAudioPlaying(false);
        setAudioProgress(0);
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

  // Fetch first item for session
  const fetchFirstItem = async (sessionId: string) => {
    try {
      const response = await fetch(`/api/mst/item?skill=listening&stage=core&sessionId=${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        startItemTimer(data.item.timing.maxAnswerSec);
      }
    } catch (error) {
      console.error('Error fetching first item:', error);
    }
  };

  // Fetch next item
  const fetchNextItem = async () => {
    if (!currentSession || !status) return;
    
    try {
      const currentSkill = status.session.skillOrder[currentSkillIndex];
      const stage = currentStage; // Use actual stage
      
      const response = await fetch(`/api/mst/item?skill=${currentSkill}&stage=${stage}&sessionId=${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        startItemTimer(data.item.timing.maxAnswerSec);
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
    }
  };

  // Advance to next skill
  const advanceToNextSkill = () => {
    if (!currentSession || !status) return;
    
    const nextSkillIndex = currentSkillIndex + 1;
    
    if (nextSkillIndex >= status.session.skillOrder.length) {
      // Test completed
      setTestPhase('completed');
      finalizeTest();
    } else {
      setCurrentSkillIndex(nextSkillIndex);
      setCurrentStage('S1');
      fetchNextItem();
    }
  };

  // Finalize test
  const finalizeTest = async () => {
    if (!currentSession) return;
    
    try {
      await fetch('/api/mst/finalize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId
        })
      });
    } catch (error) {
      console.error('Error finalizing test:', error);
    }
  };

  // Timer management
  const startItemTimer = (maxSeconds: number) => {
    setItemTimer(maxSeconds);
    setGuardTimer(Math.min(2, maxSeconds)); // 2 second minimum guard
  };

  // Timer effects
  useEffect(() => {
    if (testPhase === 'testing' && itemTimer > 0) {
      const timer = setInterval(() => {
        setItemTimer(prev => {
          if (prev <= 1) {
            handleAutoSubmit();
            return 0;
          }
          return prev - 1;
        });
        
        setGuardTimer(prev => Math.max(0, prev - 1));
      }, 1000);
      
      return () => clearInterval(timer);
    }
  }, [testPhase, itemTimer]);

  // Auto-submit when time expires
  const handleAutoSubmit = () => {
    if (!currentSession || !currentItem) return;
    
    const timeSpentMs = (currentItem.timing.maxAnswerSec - itemTimer + 1) * 1000;
    
    submitResponseMutation.mutate({
      sessionId: currentSession.sessionId,
      skill: currentItem.skill,
      stage: currentStage,
      itemId: currentItem.id,
      responseData: currentResponse || 'Time expired',
      audioBlob: recordingBlob,
      timeSpentMs
    });
  };

  // Audio recording functions
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          setRecordingBlob(event.data);
        }
      };
      
      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to access microphone',
        variant: 'destructive'
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
    }
  };

  // Audio playback for listening items
  const playAudio = async () => {
    if (!currentItem?.content?.assets?.audio) {
      toast({
        title: 'Error',
        description: 'No audio file available for this item',
        variant: 'destructive'
      });
      return;
    }
    
    try {
      if (!audioElement) {
        // Create new audio element
        const audio = new Audio();
        
        // Set up event listeners
        audio.addEventListener('loadedmetadata', () => {
          console.log('Audio loaded:', audio.duration, 'seconds');
        });
        
        audio.addEventListener('timeupdate', () => {
          if (audio.duration) {
            setAudioProgress((audio.currentTime / audio.duration) * 100);
          }
        });
        
        audio.addEventListener('ended', () => {
          setIsAudioPlaying(false);
          setAudioProgress(0);
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          toast({
            title: 'Audio Error',
            description: 'Failed to load audio file',
            variant: 'destructive'
          });
        });
        
        // Use the generated audio file
        const audioUrl = currentItem.content.assets.audio || '/assets/audio/default.mp3';
        audio.src = audioUrl;
        
        setAudioElement(audio);
        
        // Auto-play after loading
        await audio.play();
        setIsAudioPlaying(true);
      } else {
        if (isAudioPlaying) {
          audioElement.pause();
          setIsAudioPlaying(false);
        } else {
          await audioElement.play();
          setIsAudioPlaying(true);
        }
      }
    } catch (error) {
      console.error('Error playing audio:', error);
      toast({
        title: 'Playback Error',
        description: 'Failed to play audio. Please try again.',
        variant: 'destructive'
      });
    }
  };

  // Handle submit
  const handleSubmit = () => {
    if (!currentSession || !currentItem || guardTimer > 0) return;
    
    const timeSpentMs = (currentItem.timing.maxAnswerSec - itemTimer) * 1000;
    
    submitResponseMutation.mutate({
      sessionId: currentSession.sessionId,
      skill: currentItem.skill,
      stage: currentStage,
      itemId: currentItem.id,
      responseData: currentResponse,
      audioBlob: recordingBlob,
      timeSpentMs
    });
  };

  // Check if response is valid for submission
  const isValidResponse = () => {
    if (!currentItem || !currentResponse) return false;
    
    if (currentItem.skill === 'listening' || currentItem.skill === 'reading') {
      // For MCQ, check if all questions are answered
      if (Array.isArray(currentResponse)) {
        const questionCount = currentItem.content?.questions?.length || 0;
        return currentResponse.length >= questionCount && currentResponse.every(r => r !== null && r !== undefined && r !== '');
      }
    } else {
      // For speaking/writing, check if response exists
      return typeof currentResponse === 'string' && currentResponse.trim().length > 0;
    }
    
    return false;
  };

  // Format time display
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Render different test phases
  if (testPhase === 'intro') {
    return (
      <div className="container mx-auto p-6 max-w-4xl mst-container" style={mstStyle}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">MST Placement Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Multi-Stage Test Instructions</h3>
              <div className="grid md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold">Test Structure</h4>
                  <ul className="space-y-1 text-left">
                    <li>• 4 skills: Listening, Reading, Speaking, Writing</li>
                    <li>• 2.5 minutes per skill (10 minutes total)</li>
                    <li>• 2 stages per skill (S1 → S2 based on performance)</li>
                    <li>• Auto-advance when time expires</li>
                  </ul>
                </div>
                <div className="space-y-2">
                  <h4 className="font-semibold">Important Notes</h4>
                  <ul className="space-y-1 text-left">
                    <li>• Test cannot be paused or restarted</li>
                    <li>• Minimum 2 seconds before submitting</li>
                    <li>• Audio recording is automatic for speaking</li>
                    <li>• Results provided immediately after completion</li>
                  </ul>
                </div>
              </div>
            </div>
            
            <div className="text-center">
              <Button 
                onClick={() => startSessionMutation.mutate()}
                disabled={startSessionMutation.isPending}
                size="lg"
                data-testid="button-start-mst"
              >
                {startSessionMutation.isPending ? 'Starting...' : 'Start MST Test'}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (testPhase === 'completed') {
    return (
      <div className="container mx-auto p-6 max-w-4xl mst-container" style={mstStyle}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">Test Completed</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p>Your MST placement test has been completed successfully.</p>
            <p>Results will be available shortly in your profile.</p>
            <Button onClick={() => window.location.href = '/dashboard'}>
              Return to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main testing interface
  return (
    <div className="container mx-auto p-6 max-w-4xl mst-container" style={mstStyle}>
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <CardTitle className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              MST Test - {currentItem?.skill?.toUpperCase()}
            </CardTitle>
            <div className="flex items-center gap-4">
              <Badge variant="outline">{currentStage}</Badge>
              <Badge variant="secondary">{currentItem?.cefr}</Badge>
            </div>
          </div>
          
          {/* Timers */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Total Time: {formatTime(status?.timing.totalRemainingSec || 0)}</span>
              <span>Skill Time: {formatTime(status?.timing.skillRemainingSec || 0)}</span>
              <span>Item Time: {formatTime(itemTimer)}</span>
            </div>
            <Progress 
              value={status ? ((status.timing.totalElapsedSec / 600) * 100) : 0} 
              className="h-2"
            />
          </div>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {currentItem && (
            <>
              {/* Listening Items */}
              {currentItem.skill === 'listening' && (
                <div className="space-y-4">
                  <div className="flex items-center gap-4">
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="sm"
                      data-testid="button-play-audio"
                      disabled={!currentItem?.content?.assets?.transcript}
                    >
                      {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isAudioPlaying ? 'Pause' : 'Play'} Audio
                    </Button>
                    <div className="flex-1">
                      <Progress value={audioProgress} className="h-2" />
                    </div>
                    <span className="text-xs text-gray-500">
                      {audioProgress > 0 && `${Math.round(audioProgress)}%`}
                    </span>
                  </div>
                  
                  {/* Transcript hidden during actual test */}
                  
                  {currentItem.content.questions?.map((question: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-medium">{question.stem}</h3>
                      <RadioGroup 
                        value={currentResponse[idx]?.toString() || ''} 
                        onValueChange={(value) => {
                          console.log('Radio selection changed:', idx, value);
                          const newResponse = Array.isArray(currentResponse) ? [...currentResponse] : new Array(currentItem.content.questions.length).fill(null);
                          newResponse[idx] = parseInt(value);
                          setCurrentResponse(newResponse);
                        }}
                      >
                        {question.options?.map((option: string, optIdx: number) => (
                          <div key={optIdx} className="flex items-center space-x-2">
                            <RadioGroupItem 
                              value={optIdx.toString()} 
                              id={`q${idx}-opt${optIdx}`}
                              data-testid={`radio-q${idx}-opt${optIdx}`}
                            />
                            <Label htmlFor={`q${idx}-opt${optIdx}`}>{option}</Label>
                          </div>
                        ))}
                      </RadioGroup>
                    </div>
                  ))}
                </div>
              )}

              {/* Reading Items */}
              {currentItem.skill === 'reading' && (
                <div className="space-y-4">
                  <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-lg">
                    <p className="text-sm leading-relaxed">
                      {currentItem.content.assets?.passage}
                    </p>
                  </div>
                  
                  {currentItem.content.questions?.map((question: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-medium">{question.stem}</h3>
                      {question.type === 'mcq_single' && (
                        <RadioGroup 
                          value={currentResponse[idx]?.toString() || ''} 
                          onValueChange={(value) => {
                            console.log('Radio selection changed:', idx, value);
                            const newResponse = Array.isArray(currentResponse) ? [...currentResponse] : new Array(currentItem.content.questions.length).fill(null);
                            newResponse[idx] = parseInt(value);
                            setCurrentResponse(newResponse);
                          }}
                        >
                          {question.options?.map((option: string, optIdx: number) => (
                            <div key={optIdx} className="flex items-center space-x-2">
                              <RadioGroupItem 
                                value={optIdx.toString()} 
                                id={`q${idx}-opt${optIdx}`}
                                data-testid={`radio-q${idx}-opt${optIdx}`}
                              />
                              <Label htmlFor={`q${idx}-opt${optIdx}`}>{option}</Label>
                            </div>
                          ))}
                        </RadioGroup>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Speaking Items */}
              {currentItem.skill === 'speaking' && (
                <div className="space-y-4">
                  <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Speaking Task</h3>
                    <p className="text-sm">{currentItem.content.assets?.prompt}</p>
                    {currentItem.content.assets?.keywords && (
                      <div className="mt-2">
                        <span className="text-xs text-gray-600">Keywords: </span>
                        <span className="text-xs">{currentItem.content.assets.keywords.join(', ')}</span>
                      </div>
                    )}
                  </div>
                  
                  <div className="text-center space-y-4">
                    <div className="flex justify-center items-center gap-4">
                      <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        variant={isRecording ? 'destructive' : 'default'}
                        size="lg"
                        data-testid="button-record"
                      >
                        {isRecording ? <MicOff className="w-5 h-5 mr-2" /> : <Mic className="w-5 h-5 mr-2" />}
                        {isRecording ? 'Stop Recording' : 'Start Recording'}
                      </Button>
                    </div>
                    
                    {recordingBlob && (
                      <p className="text-sm text-green-600" data-testid="text-recording-ready">
                        Recording ready for submission
                      </p>
                    )}
                  </div>
                </div>
              )}

              {/* Writing Items */}
              {currentItem.skill === 'writing' && (
                <div className="space-y-4">
                  <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg">
                    <h3 className="font-medium mb-2">Writing Task</h3>
                    <p className="text-sm">{currentItem.content.assets?.prompt}</p>
                    <div className="mt-2 text-xs text-gray-600">
                      Word limit: {currentItem.content.assets?.minWords} - {currentItem.content.assets?.maxWords} words
                    </div>
                  </div>
                  
                  <div>
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Type your response here..."
                      className="min-h-[200px]"
                      data-testid="textarea-writing"
                    />
                    <div className="mt-2 text-xs text-gray-600">
                      Words: {currentResponse?.split(' ').filter(Boolean).length || 0}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="flex justify-between items-center">
                <div className="text-sm text-gray-500">
                  {guardTimer > 0 && (
                    <span data-testid="text-guard-timer">
                      Please wait {guardTimer} seconds before submitting
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={guardTimer > 0 || submitResponseMutation.isPending || !isValidResponse()}
                  data-testid="button-submit"
                >
                  {submitResponseMutation.isPending ? 'Submitting...' : 'Submit Response'}
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}