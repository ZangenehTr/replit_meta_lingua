import React, { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Checkbox } from '@/components/ui/checkbox';
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
type MSTStage = 'core' | 'upper' | 'lower';

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
  const [currentStage, setCurrentStage] = useState<MSTStage>('core');
  const [guardTimer, setGuardTimer] = useState(0);
  const [itemTimer, setItemTimer] = useState(0);
  const [audioElement, setAudioElement] = useState<HTMLAudioElement | null>(null);
  const [testResults, setTestResults] = useState<any>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);
  const [audioProgress, setAudioProgress] = useState(0);
  
  // TOEFL Speaking Flow States
  const [speakingPhase, setSpeakingPhase] = useState<'narration' | 'preparation' | 'recording' | 'completed'>('narration');
  const [prepTimer, setPrepTimer] = useState(0);
  const [prepTimeDisplay, setPrepTimeDisplay] = useState('00:15');
  const [isGeneratingTTS, setIsGeneratingTTS] = useState(false);
  
  // Score tracking for proper skill completion
  const [skillScores, setSkillScores] = useState<{[skill: string]: {stage1Score?: number, stage2Score?: number, route?: string}}>({});
  
  // Prevent duplicate skill completions
  const [completedSkills, setCompletedSkills] = useState<Set<string>>(new Set());
  
  // Prevent duplicate TTS generation for speaking items
  const [processedSpeakingItems, setProcessedSpeakingItems] = useState<Set<string>>(new Set());

  // Start MST session
  const startSessionMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/mst/start', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
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
      if (data.success && currentItem) {
        // CRITICAL: Store score for this stage
        const skillKey = currentItem.skill;
        const currentScores = skillScores[skillKey] || {};
        
        if (currentStage === 'core') {
          currentScores.stage1Score = Math.round(data.p * 100);
          currentScores.route = data.route;
        } else {
          currentScores.stage2Score = Math.round(data.p * 100);
        }
        
        setSkillScores(prev => ({...prev, [skillKey]: currentScores}));
        console.log(`📊 Stored score for ${skillKey} ${currentStage}:`, currentScores);
        
        // CRITICAL: Writing skill should always advance to next skill after first response
        if (currentItem.skill === 'writing') {
          const skillKey = `${currentItem.skill}-${currentStage}`;
          if (!completedSkills.has(skillKey)) {
            console.log('🎯 Writing completed - advancing to next skill (writing uses only ONE question)');
            setCompletedSkills(prev => new Set(prev).add(skillKey));
            advanceToNextSkill();
          } else {
            console.log('⚠️ Writing already completed, skipping duplicate advancement');
          }
        } else if (currentStage === 'core') {
          // Check if we're at A1 level and trying to route down
          const isA1Level = currentItem?.cefr === 'A1';
          const routingDown = data.route === 'down';
          
          if (isA1Level && routingDown) {
            // Can't go below A1, so complete skill immediately with A0/pre-A1 classification
            console.log('⚠️ At A1 level routing down - completing skill with A0/pre-A1 classification');
            advanceToNextSkill();
          } else {
            // Normal routing logic
            const nextStage: MSTStage = data.route === 'up' ? 'upper' 
              : data.route === 'stay' ? 'upper' 
              : 'lower';
            setCurrentStage(nextStage);
            fetchNextItemWithStage(nextStage);
          }
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        // NOTE: Skill-specific setup now handled in useEffect to prevent race conditions
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
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        // NOTE: Skill-specific setup now handled in useEffect to prevent race conditions
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
    }
  };

  // Fetch next item with specific stage (to avoid race conditions)
  const fetchNextItemWithStage = async (stage: MSTStage) => {
    if (!currentSession || !status) return;
    
    try {
      const currentSkill = status.session.skillOrder[currentSkillIndex];
      
      const response = await fetch(`/api/mst/item?skill=${currentSkill}&stage=${stage}&sessionId=${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        // NOTE: Skill-specific setup now handled in useEffect to prevent race conditions
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
    }
  };

  // Fetch next item with specific skill and stage (to avoid race conditions)
  const fetchNextItemWithSkillAndStage = async (skillIndex: number, stage: MSTStage) => {
    if (!currentSession || !status) return;
    
    try {
      const skill = status.session.skillOrder[skillIndex];
      console.log(`📝 Fetching item for skill: ${skill}, stage: ${stage}, skillIndex: ${skillIndex}`);
      
      const response = await fetch(`/api/mst/item?skill=${skill}&stage=${stage}&sessionId=${currentSession.sessionId}`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentItem(data.item);
        // NOTE: Skill-specific setup now handled in useEffect to prevent race conditions
      }
    } catch (error) {
      console.error('Error fetching next item:', error);
    }
  };

  // Advance to next skill
  const advanceToNextSkill = async () => {
    if (!currentSession || !status) return;
    
    // CRITICAL: Complete current skill and store results before advancing
    try {
      const currentSkill = status.session.skillOrder[currentSkillIndex];
      
      // Send skill completion with REAL scores from responses
      const scores = skillScores[currentSkill] || {};
      console.log(`🎯 Completing skill ${currentSkill} with real scores:`, scores);
      
      const skillCompleteResponse = await fetch('/api/mst/skill-complete', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId,
          skill: currentSkill,
          stage1Score: scores.stage1Score || 50, // Use real score or fallback
          stage2Score: scores.stage2Score || scores.stage1Score || 50, // Use stage2 or stage1 as fallback
          route: scores.route || 'stay', // Use real routing decision
          timeSpentSec: 60
        })
      });
      
      if (skillCompleteResponse.ok) {
        const skillData = await skillCompleteResponse.json();
        console.log(`✅ Skill ${currentSkill} completed successfully:`, skillData);
      } else {
        console.error('❌ Failed to complete skill:', currentSkill);
      }
    } catch (error) {
      console.error('❌ Error completing skill:', error);
    }
    
    const nextSkillIndex = currentSkillIndex + 1;
    
    if (nextSkillIndex >= status.session.skillOrder.length) {
      // Test completed
      setTestPhase('completed');
      finalizeTest();
    } else {
      console.log(`🎯 Advancing from skill ${currentSkillIndex} (${status.session.skillOrder[currentSkillIndex]}) to skill ${nextSkillIndex} (${status.session.skillOrder[nextSkillIndex]})`);
      setCurrentSkillIndex(nextSkillIndex);
      setCurrentStage('core');
      // Fetch next item with the new skill index directly to avoid race condition
      fetchNextItemWithSkillAndStage(nextSkillIndex, 'core');
    }
  };

  // Finalize test
  const finalizeTest = async () => {
    if (!currentSession) return;
    
    try {
      const response = await fetch('/api/mst/finalize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          sessionId: currentSession.sessionId
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTestResults(data.result);
        }
      }
    } catch (error) {
      console.error('Error finalizing test:', error);
    }
  };

  // Timer management
  const startItemTimer = (maxSeconds: number) => {
    setItemTimer(maxSeconds);
    setGuardTimer(Math.min(2, maxSeconds)); // 2 second minimum guard
  };

  // Effect to handle skill-specific logic when currentItem changes
  useEffect(() => {
    if (!currentItem) return;
    
    console.log(`🔄 Item changed: ${currentItem.skill}/${currentStage}, validating state sync`);
    
    // CRITICAL: Only process skill-specific logic if we're in the right state
    if (testPhase !== 'testing') return;
    
    // Cleanup any previous audio to prevent conflicts
    if (audioElement && !audioElement.paused) {
      console.log('🛑 Stopping previous audio on item change');
      audioElement.pause();
      audioElement.currentTime = 0;
      setIsAudioPlaying(false);
      setAudioProgress(0);
    }
    
    // Handle skill-specific setup with proper state validation
    if (currentItem.skill === 'listening') {
      console.log('🎧 Setting up listening item - waiting for audio');
      // Timer will start when audio ends
    } else if (currentItem.skill === 'speaking') {
      console.log('🎙️ Setting up speaking item - starting narration phase');
      setSpeakingPhase('narration');
      
      // CRITICAL: Check if we've already processed this speaking item
      const itemKey = `${currentItem.id}-${currentStage}`;
      if (!processedSpeakingItems.has(itemKey)) {
        setProcessedSpeakingItems(prev => new Set(prev).add(itemKey));
        
        // Generate TTS for speaking prompt with validation
        const prompt = currentItem.content.assets?.prompt;
        if (prompt && currentItem.skill === 'speaking') { // Double-check we're still in speaking
          console.log('🎵 Generating TTS for speaking prompt after state validation');
          generateSpeakingTTS(prompt).then(audioUrl => {
            // Triple-check state is still consistent before playing TTS
            if (audioUrl && currentItem?.skill === 'speaking') {
              autoPlayNarration(audioUrl);
            } else if (currentItem?.skill !== 'speaking') {
              console.warn('⚠️ State changed during TTS generation, aborting speaking setup');
            } else {
              console.warn('⚠️ TTS generation failed for speaking prompt');
              setTimeout(() => startPreparationPhase(), 3000);
            }
          });
        } else {
          console.warn('⚠️ No prompt found for speaking item or state inconsistency');
          setTimeout(() => startPreparationPhase(), 2000);
        }
      } else {
        console.log('🔄 Speaking item already processed, skipping TTS generation');
        // If already processed, try to play existing audio or go to preparation
        if (currentItem.content.assets?.audio) {
          autoPlayNarration(currentItem.content.assets.audio);
        } else {
          setTimeout(() => startPreparationPhase(), 1000);
        }
      }
    } else if (currentItem.skill === 'writing') {
      console.log('✍️ Setting up writing item - starting 5 minute timer');
      startItemTimer(300); // 5 minutes for writing
    } else if (currentItem.skill === 'reading') {
      console.log('📖 Setting up reading item - starting timer immediately');
      startItemTimer(currentItem.timing.maxAnswerSec);
    } else {
      console.log('⏱️ Starting timer immediately for:', currentItem.skill);
      startItemTimer(currentItem.timing.maxAnswerSec);
    }
  }, [currentItem, currentStage, testPhase]);
  
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

  // TOEFL Speaking Flow Functions
  const startPreparationTimer = () => {
    setPrepTimer(15);
    setPrepTimeDisplay('00:15');
    
    const interval = setInterval(() => {
      setPrepTimer(prev => {
        const newTime = prev - 1;
        setPrepTimeDisplay(`00:${newTime.toString().padStart(2, '0')}`);
        
        if (newTime <= 0) {
          clearInterval(interval);
          // Play beep and start recording
          playBeepAndStartRecording();
          return 0;
        }
        return newTime;
      });
    }, 1000);
  };

  const playBeepAndStartRecording = async () => {
    setSpeakingPhase('recording');
    
    // Play beep sound
    try {
      const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioContext.createOscillator();
      const gainNode = audioContext.createGain();
      
      oscillator.connect(gainNode);
      gainNode.connect(audioContext.destination);
      
      oscillator.frequency.value = 800; // 800Hz beep
      gainNode.gain.value = 0.3;
      
      oscillator.start();
      oscillator.stop(audioContext.currentTime + 0.2); // 200ms beep
      
      // Start recording after beep
      setTimeout(() => {
        startRecording();
        
        // Auto-stop recording after proper time limit from item timing
        const recordingTime = (currentItem?.timing?.recordSec || 60) * 1000;
        console.log('🎙️ Recording for', currentItem?.timing?.recordSec || 60, 'seconds');
        
        setTimeout(() => {
          if (isRecording) {
            console.log('⏹️ Auto-stopping recording after time limit');
            stopRecording();
            setSpeakingPhase('completed');
          }
        }, recordingTime);
      }, 300);
      
    } catch (error) {
      console.error('Beep sound failed:', error);
      // Start recording anyway with proper timing
      startRecording();
      
      const recordingTime = (currentItem?.timing?.recordSec || 60) * 1000;
      console.log('🎙️ Recording for', currentItem?.timing?.recordSec || 60, 'seconds (fallback)');
      
      setTimeout(() => {
        if (isRecording) {
          console.log('⏹️ Auto-stopping recording after time limit (fallback)');
          stopRecording();
          setSpeakingPhase('completed');
        }
      }, recordingTime);
    }
  };

  // Audio playback for listening items and speaking narration
  const playAudio = async () => {
    // Check for audio source (either original or generated TTS)
    const audioSource = currentItem?.content?.assets?.audio;
    if (!audioSource) {
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
          // CRITICAL: Start response timer ONLY when audio finishes for listening questions
          if (currentItem?.skill === 'listening') {
            console.log('Audio ended - starting listening timer:', currentItem.timing.maxAnswerSec);
            startItemTimer(currentItem.timing.maxAnswerSec);
          } else if (currentItem?.skill === 'speaking') {
            console.log('🎙️ Speaking narration ended - starting preparation phase');
            startPreparationPhase();
          }
        });
        
        audio.addEventListener('error', (e) => {
          console.error('Audio error:', e);
          toast({
            title: 'Audio Error',
            description: 'Failed to load audio file',
            variant: 'destructive'
          });
        });
        
        // Use the audio source (either original or generated TTS)
        audio.src = audioSource;
        
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
    
    // CRITICAL: Stop and cleanup audio if it's still playing
    if (audioElement && !audioElement.paused) {
      console.log('Stopping audio on submit');
      audioElement.pause();
      audioElement.currentTime = 0;
    }
    
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
    if (!currentItem) return false;
    
    if (currentItem.skill === 'listening' || currentItem.skill === 'reading') {
      // For MCQ, check if all questions are answered
      if (!currentResponse) return false;
      if (Array.isArray(currentResponse)) {
        const questionCount = currentItem.content?.questions?.length || 0;
        return currentResponse.length >= questionCount && currentResponse.every(r => r !== null && r !== undefined && r !== '');
      }
    } else if (currentItem.skill === 'speaking') {
      // For speaking, check if audio recording exists
      return !!recordingBlob;
    } else if (currentItem.skill === 'writing') {
      // For writing, check if text response exists and meets 80-word minimum
      if (typeof currentResponse !== 'string' || currentResponse.trim().length === 0) {
        return false;
      }
      const wordCount = currentResponse.trim().split(/\s+/).filter(Boolean).length;
      return wordCount >= 80;
    }
    
    return false;
  };

  // Generate TTS for speaking prompt
  const generateSpeakingTTS = async (prompt: string) => {
    if (!prompt || isGeneratingTTS) return null;
    
    setIsGeneratingTTS(true);
    console.log('🎵 Generating TTS for speaking prompt:', prompt);
    
    try {
      const response = await fetch('/api/tts/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('auth_token')}`
        },
        body: JSON.stringify({
          text: prompt,
          language: 'english',
          speed: 1.0
        })
      });
      
      if (!response.ok) {
        throw new Error('Failed to generate TTS');
      }
      
      const data = await response.json();
      
      if (data.success && data.audioUrl) {
        console.log('✅ TTS generated successfully:', data.audioUrl);
        // CRITICAL: Set audio URL directly on currentItem for proper playback
        if (currentItem) {
          if (!currentItem.content.assets) {
            currentItem.content.assets = {};
          }
          currentItem.content.assets.audio = data.audioUrl;
          setCurrentItem({ ...currentItem }); // Trigger re-render
        }
        return data.audioUrl;
      } else {
        throw new Error(data.error || 'TTS generation failed');
      }
    } catch (error) {
      console.error('❌ TTS generation error:', error);
      toast({
        title: 'Audio Generation Error',
        description: 'Failed to generate speech. Continuing with visual prompt only.',
        variant: 'destructive'
      });
      return null;
    } finally {
      setIsGeneratingTTS(false);
    }
  };

  // Auto-play narration audio for speaking questions
  const autoPlayNarration = async (audioUrl: string) => {
    try {
      console.log('🎧 Auto-playing narration audio:', audioUrl);
      const audio = new Audio(audioUrl);
      
      // Handle audio events
      audio.addEventListener('ended', () => {
        console.log('🎵 Narration ended - starting preparation phase');
        setIsAudioPlaying(false);
        startPreparationPhase();
      });
      
      audio.addEventListener('error', (e) => {
        console.error('❌ Audio playback error:', e);
        setIsAudioPlaying(false);
        // Continue to preparation phase even if audio fails
        startPreparationPhase();
      });
      
      setAudioElement(audio);
      await audio.play();
      setIsAudioPlaying(true);
      
    } catch (error) {
      console.error('❌ Auto-play error:', error);
      // Continue to preparation phase if auto-play fails
      startPreparationPhase();
    }
  };

  // Start preparation phase with proper timing
  const startPreparationPhase = () => {
    if (!currentItem) return;
    
    // Guard against multiple calls - only start if not already in preparation or recording
    if (speakingPhase === 'preparation' || speakingPhase === 'recording' || speakingPhase === 'completed') {
      console.log('⚠️ Preparation phase already started or in progress, skipping duplicate call');
      return;
    }
    
    console.log('⏰ Starting preparation phase');
    setSpeakingPhase('preparation');
    
    // Use actual preparation time from item timing
    const prepTimeSeconds = currentItem.timing.prepSec || 15;
    setPrepTimer(prepTimeSeconds);
    setPrepTimeDisplay(formatTime(prepTimeSeconds));
    
    // Start preparation countdown
    const prepInterval = setInterval(() => {
      setPrepTimer(prev => {
        const newTime = prev - 1;
        setPrepTimeDisplay(formatTime(newTime));
        
        if (newTime <= 0) {
          clearInterval(prepInterval);
          startRecordingPhase();
        }
        
        return newTime;
      });
    }, 1000);
  };

  // Start recording phase with proper timing
  const startRecordingPhase = async () => {
    if (!currentItem) return;
    
    console.log('🎙️ Starting recording phase');
    setSpeakingPhase('recording');
    
    try {
      // Start recording
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const chunks: BlobPart[] = [];
      
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          chunks.push(event.data);
        }
      };
      
      recorder.onstop = () => {
        const blob = new Blob(chunks, { type: 'audio/webm' });
        setRecordingBlob(blob);
        setSpeakingPhase('completed');
        
        // Stop the stream
        stream.getTracks().forEach(track => track.stop());
      };
      
      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
      
      // Auto-stop recording after the specified time
      const recordTimeSeconds = currentItem.timing.recordSec || 60;
      console.log(`🎙️ Recording for ${recordTimeSeconds} seconds`);
      
      setTimeout(() => {
        if (recorder.state === 'recording') {
          console.log('⏹️ Auto-stopping recording after time limit');
          recorder.stop();
          setIsRecording(false);
        }
      }, recordTimeSeconds * 1000);
      
    } catch (error) {
      console.error('❌ Recording error:', error);
      toast({
        title: 'Recording Error',
        description: 'Failed to start recording. Please check microphone permissions.',
        variant: 'destructive'
      });
    }
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
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl mst-container" style={mstStyle}>
        <Card>
          <CardHeader>
            <CardTitle className="text-2xl text-center">MST Placement Test</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="text-center space-y-4">
              <h3 className="text-lg font-semibold">Multi-Stage Test Instructions</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <h4 className="font-semibold">Test Structure</h4>
                  <ul className="space-y-1 text-left">
                    <li>• 4 skills: Listening, Reading, Speaking, Writing</li>
                    <li>• Level-based timing (A1/A2: 90s, B1: 60s, B2: 45s, C1/C2: 30s)</li>
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
    if (!testResults) {
      return (
        <div className="container mx-auto p-4 sm:p-6 max-w-4xl mst-container" style={mstStyle}>
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl text-center">Processing Results...</CardTitle>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
              <p>Calculating your English proficiency level...</p>
            </CardContent>
          </Card>
        </div>
      );
    }

    const skillEmojis = {
      listening: '👂',
      reading: '📖', 
      speaking: '🗣️',
      writing: '✍️'
    };

    const getBandColor = (band: string) => {
      if (band.startsWith('C')) return 'text-purple-600 bg-purple-100 dark:bg-purple-900/20';
      if (band.startsWith('B')) return 'text-blue-600 bg-blue-100 dark:bg-blue-900/20'; 
      if (band.startsWith('A')) return 'text-green-600 bg-green-100 dark:bg-green-900/20';
      return 'text-gray-600 bg-gray-100 dark:bg-gray-900/20';
    };

    const getInspiringMessage = (overallBand: string) => {
      const band = overallBand.charAt(0);
      switch (band) {
        case 'C': return "🎉 Exceptional! You have mastery-level English skills.";
        case 'B': return "🌟 Great progress! You're developing strong English proficiency.";
        case 'A': return "🚀 Good foundation! You're building solid English skills.";
        default: return "💪 Every expert was once a beginner. Keep practicing!";
      }
    };

    return (
      <div className="container mx-auto p-4 sm:p-6 max-w-4xl mst-container" style={mstStyle}>
        <Card className="overflow-hidden">
          {/* Celebratory Header */}
          <CardHeader className="bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500 text-white text-center py-8">
            <div className="animate-bounce mb-4 text-6xl">🎊</div>
            <CardTitle className="text-3xl font-bold mb-2">Congratulations!</CardTitle>
            <p className="text-xl opacity-90">Your MST Placement Test Results</p>
          </CardHeader>

          <CardContent className="p-8 space-y-8">
            {/* Overall Level */}
            <div className="text-center space-y-4">
              <h2 className="text-2xl font-semibold text-gray-800 dark:text-gray-100">Your Overall Level</h2>
              <div className={`inline-flex items-center px-8 py-4 rounded-full text-4xl font-bold ${getBandColor(testResults.overallBand)}`}>
                {testResults.overallBand}
              </div>
              <p className="text-lg text-gray-600 dark:text-gray-300 max-w-md mx-auto">
                {getInspiringMessage(testResults.overallBand)}
              </p>
            </div>

            {/* Individual Skills */}
            <div className="space-y-4">
              <h3 className="text-xl font-semibold text-center text-gray-800 dark:text-gray-100">Individual Skill Levels</h3>
              <div className="grid grid-cols-2 gap-4">
                {testResults.skills.map((skill: any) => (
                  <Card key={skill.skill} className="p-4 hover:shadow-lg transition-shadow">
                    <div className="text-center space-y-2">
                      <div className="text-3xl">{skillEmojis[skill.skill as keyof typeof skillEmojis]}</div>
                      <h4 className="font-semibold capitalize text-gray-700 dark:text-gray-200">{skill.skill}</h4>
                      <div className={`inline-flex px-3 py-1 rounded-full text-xl font-bold ${getBandColor(skill.band)}`}>
                        {skill.band}
                      </div>
                      <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          className="bg-blue-500 h-2 rounded-full transition-all duration-1000"
                          style={{ width: `${Math.round(skill.confidence * 100)}%` }}
                        ></div>
                      </div>
                      <p className="text-xs text-gray-500">{Math.round(skill.confidence * 100)}% confidence</p>
                    </div>
                  </Card>
                ))}
              </div>
            </div>

            {/* Recommendations */}
            {testResults.recommendations && testResults.recommendations.length > 0 && (
              <div className="bg-blue-50 dark:bg-blue-900/20 p-6 rounded-lg space-y-3">
                <h3 className="text-lg font-semibold text-blue-800 dark:text-blue-200">📈 Recommendations</h3>
                <ul className="space-y-2">
                  {testResults.recommendations.map((rec: string, idx: number) => (
                    <li key={idx} className="flex items-start gap-2 text-blue-700 dark:text-blue-300">
                      <span className="text-blue-500 mt-1">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex flex-col sm:flex-row gap-4 pt-6">
              <Button 
                size="lg" 
                className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700"
                onClick={() => {
                  // Store results for roadmap generation
                  localStorage.setItem('placementResults', JSON.stringify(testResults));
                  window.location.href = '/roadmap';
                }}
              >
                🎯 Create Learning Roadmap
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="flex-1"
                onClick={() => window.location.href = '/dashboard'}
              >
                📊 Return to Dashboard
              </Button>
            </div>

            {/* Test Stats */}
            <div className="text-center text-sm text-gray-500 pt-4 border-t">
              <p>Test completed in {Math.round(testResults.totalTimeMin)} minutes</p>
              <p className="mt-1">Assessment confidence: {Math.round(testResults.confidence * 100)}%</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Main testing interface
  return (
    <div className="container mx-auto p-4 sm:p-6 max-w-4xl mst-container" style={mstStyle}>
      <Card>
        <CardHeader>
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2">
            <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
              <Clock className="w-4 h-4 sm:w-5 sm:h-5" />
              <span className="truncate">MST Test - {currentItem?.skill?.toUpperCase()}</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">{currentStage}</Badge>
              <Badge variant="secondary" className="text-xs">{currentItem?.cefr}</Badge>
            </div>
          </div>
          
          {/* Timers */}
          <div className="space-y-2">
            <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-2 sm:gap-4">
              {/* Prominent per-question countdown with warning */}
              <div className="text-center sm:text-left">
                <div className={`text-lg sm:text-xl font-bold transition-all duration-300 ${
                  itemTimer > 0 && itemTimer <= 3 
                    ? 'text-red-600 animate-bounce' 
                    : itemTimer <= 10 && itemTimer > 0 
                      ? 'text-red-500 animate-pulse' 
                      : 'text-gray-900 dark:text-gray-100'
                }`}>
                  {formatTime(itemTimer)}
                </div>
                <div className="text-xs text-gray-500">Question Time</div>
              </div>
              
              {/* Secondary timers - smaller */}
              <div className="flex gap-4 text-xs text-gray-600 dark:text-gray-400">
                <span>Skill: {formatTime(status?.timing.skillRemainingSec || 0)}</span>
              </div>
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
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                    <Button
                      onClick={playAudio}
                      variant="outline"
                      size="default"
                      className="w-full sm:w-auto min-h-[48px] touch-target font-medium"
                      data-testid="button-play-audio"
                      disabled={!currentItem?.content?.assets?.transcript}
                    >
                      {isAudioPlaying ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                      {isAudioPlaying ? 'Pause' : 'Play'} Audio
                    </Button>
                    <div className="flex-1 flex items-center gap-2">
                      <Progress value={audioProgress} className="h-3 flex-1" />
                      <span className="text-xs text-gray-500 min-w-[3rem] text-right">
                        {audioProgress > 0 && `${Math.round(audioProgress)}%`}
                      </span>
                    </div>
                  </div>
                  
                  {/* Transcript hidden during actual test */}
                  
                  {currentItem.content.questions?.map((question: any, idx: number) => (
                    <div key={idx} className="space-y-3">
                      <h3 className="font-medium">{question.stem}</h3>
                      <RadioGroup 
                        value={currentResponse[idx]?.toString() || ''} 
                        onValueChange={(value) => {
                          console.log('Radio selection changed:', idx, value);
                          const newResponse = Array.isArray(currentResponse) ? [...currentResponse] : new Array(currentItem.content.questions.length).fill('');
                          newResponse[idx] = value;
                          setCurrentResponse(newResponse);
                        }}
                        data-testid={`radiogroup-q-${idx}`}
                      >
                        {question.options?.map((option: string, optIdx: number) => {
                          const id = `q${idx}-opt${optIdx}`;
                          return (
                            <div key={optIdx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[48px] touch-target">
                              <RadioGroupItem 
                                value={optIdx.toString()} 
                                id={id}
                                data-testid={`radio-q-${idx}-opt-${optIdx}`}
                                className="mt-0"
                              />
                              <Label htmlFor={id} className="cursor-pointer flex-1 leading-relaxed text-sm sm:text-base">{option}</Label>
                            </div>
                          );
                        })}
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
                            const newResponse = Array.isArray(currentResponse) ? [...currentResponse] : new Array(currentItem.content.questions.length).fill('');
                            newResponse[idx] = value;
                            setCurrentResponse(newResponse);
                          }}
                          data-testid={`radiogroup-q-${idx}`}
                        >
                          {question.options?.map((option: string, optIdx: number) => {
                            const id = `q${idx}-opt${optIdx}`;
                            return (
                              <div key={optIdx} className="flex items-center space-x-2">
                                <RadioGroupItem 
                                  value={optIdx.toString()} 
                                  id={id}
                                  data-testid={`radio-q-${idx}-opt-${optIdx}`}
                                />
                                <Label htmlFor={id} className="cursor-pointer">{option}</Label>
                              </div>
                            );
                          })}
                        </RadioGroup>
                      )}
                      {question.type === 'mcq_multi' && (
                        <div className="space-y-2" data-testid={`checkboxgroup-q-${idx}`}>
                          <p className="text-sm text-gray-600 mb-3">Select all that apply:</p>
                          {question.options?.map((option: string, optIdx: number) => {
                            const id = `q${idx}-opt${optIdx}`;
                            const isChecked = currentResponse[idx] && Array.isArray(currentResponse[idx]) && currentResponse[idx].includes(optIdx);
                            return (
                              <div key={optIdx} className="flex items-center space-x-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 min-h-[48px] touch-target">
                                <Checkbox
                                  id={id}
                                  checked={isChecked}
                                  onCheckedChange={(checked) => {
                                    console.log('Checkbox selection changed:', idx, optIdx, checked);
                                    const newResponse = Array.isArray(currentResponse) ? [...currentResponse] : new Array(currentItem.content.questions.length).fill([]);
                                    let currentAnswers = Array.isArray(newResponse[idx]) ? [...newResponse[idx]] : [];
                                    
                                    if (checked) {
                                      if (!currentAnswers.includes(optIdx)) {
                                        currentAnswers.push(optIdx);
                                      }
                                    } else {
                                      currentAnswers = currentAnswers.filter(a => a !== optIdx);
                                    }
                                    
                                    newResponse[idx] = currentAnswers;
                                    setCurrentResponse(newResponse);
                                  }}
                                  data-testid={`checkbox-q-${idx}-opt-${optIdx}`}
                                />
                                <Label htmlFor={id} className="cursor-pointer flex-1 leading-relaxed text-sm sm:text-base">{option}</Label>
                              </div>
                            );
                          })}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Speaking Items - TOEFL Style */}
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
                    {/* TOEFL Speaking Phase Display */}
                    {speakingPhase === 'narration' && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-blue-600">🎧 Listen to the question</div>
                        <p className="text-sm text-gray-600">The question is being read to you...</p>
                        {currentItem.content.assets?.audio && (
                          <Button
                            onClick={playAudio}
                            disabled={isAudioPlaying || isGeneratingTTS}
                            size="lg"
                            className="w-full sm:w-auto min-h-[52px] text-base font-medium touch-target"
                            data-testid="button-play-narration"
                          >
                            {isGeneratingTTS ? (
                              <>
                                <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
                                Generating Audio...
                              </>
                            ) : isAudioPlaying ? (
                              <>
                                <Volume2 className="w-5 h-5 mr-2" />
                                Playing Question...
                              </>
                            ) : (
                              <>
                                <Play className="w-5 h-5 mr-2" />
                                Play Question
                              </>
                            )}
                          </Button>
                        )}
                        {isGeneratingTTS && (
                          <p className="text-sm text-blue-600">🎵 Generating narration audio...</p>
                        )}
                      </div>
                    )}
                    
                    {speakingPhase === 'preparation' && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-orange-600">⏰ Preparation Time</div>
                        <div className="text-4xl font-mono font-bold text-orange-600">{prepTimeDisplay}</div>
                        <p className="text-sm text-gray-600">Think about your response. Recording will start automatically.</p>
                      </div>
                    )}
                    
                    {speakingPhase === 'recording' && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-red-600">🎙️ Recording ({currentItem.timing.recordSec || 60} seconds)</div>
                        <div className="flex justify-center">
                          <div className="animate-pulse bg-red-500 rounded-full w-6 h-6"></div>
                        </div>
                        <p className="text-sm text-gray-600">Speak clearly. Recording will stop automatically after {currentItem.timing.recordSec || 60} seconds.</p>
                        <Button
                          onClick={stopRecording}
                          variant="destructive"
                          size="lg"
                          className="w-full sm:w-auto min-h-[52px] text-base font-medium touch-target"
                          data-testid="button-stop-recording"
                        >
                          <MicOff className="w-5 h-5 mr-2" />
                          Stop Recording Early
                        </Button>
                      </div>
                    )}
                    
                    {speakingPhase === 'completed' && recordingBlob && (
                      <div className="space-y-3">
                        <div className="text-lg font-semibold text-green-600">✅ Recording Complete</div>
                        <p className="text-sm text-green-600" data-testid="text-recording-ready">
                          Recording ready for submission
                        </p>
                      </div>
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
                      Word limit: minimum 80 words
                    </div>
                  </div>
                  
                  <div>
                    <Textarea
                      value={currentResponse}
                      onChange={(e) => setCurrentResponse(e.target.value)}
                      placeholder="Type your response here..."
                      className="min-h-[150px] sm:min-h-[200px] text-base touch-target"
                      data-testid="textarea-writing"
                    />
                    <div className="mt-2 text-xs">
                      <span className={`${(currentResponse?.trim().split(/\s+/).filter(Boolean).length || 0) >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                        Words: {currentResponse?.trim().split(/\s+/).filter(Boolean).length || 0} / 80 minimum
                      </span>
                      {/* Word count guidance is sufficient - removed red error text for better UX */}
                    </div>
                  </div>
                </div>
              )}

              {/* Submit button */}
              <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
                <div className="text-xs sm:text-sm text-gray-500 text-center sm:text-left">
                  {guardTimer > 0 && (
                    <span data-testid="text-guard-timer">
                      Please wait {guardTimer} seconds before submitting
                    </span>
                  )}
                </div>
                
                <Button
                  onClick={handleSubmit}
                  disabled={guardTimer > 0 || submitResponseMutation.isPending || !isValidResponse()}
                  size="lg"
                  className="w-full sm:w-auto min-h-[52px] text-base font-medium touch-target"
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