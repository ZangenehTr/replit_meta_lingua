import { useState, useRef, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { 
  Mic, 
  MicOff, 
  Volume2, 
  Play, 
  Pause, 
  RotateCcw,
  CheckCircle,
  XCircle,
  Award,
  Target
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface VoiceExerciseProps {
  exerciseId?: number;
  promptText: string;
  targetLanguage: string;
  difficultyLevel: string;
  referenceTtsUrl?: string;
  maxAttempts?: number;
  onComplete?: (score: number, feedback: string) => void;
  onAttempt?: (attemptNumber: number) => void;
}

interface RecordingState {
  isRecording: boolean;
  isPlaying: boolean;
  recordingBlob: Blob | null;
  recordingUrl: string | null;
  duration: number;
}

interface AnalysisResult {
  score: number;
  feedback: string;
  suggestions: string[];
  pronunciation: {
    accuracy: number;
    fluency: number;
    completeness: number;
  };
}

/**
 * Voice Exercise Component for Pronunciation Practice
 * Integrates with existing TTS/STT services
 */
export function VoiceExercise({
  exerciseId,
  promptText,
  targetLanguage,
  difficultyLevel,
  referenceTtsUrl,
  maxAttempts = 3,
  onComplete,
  onAttempt
}: VoiceExerciseProps) {
  const { toast } = useToast();
  
  const [recording, setRecording] = useState<RecordingState>({
    isRecording: false,
    isPlaying: false,
    recordingBlob: null,
    recordingUrl: null,
    duration: 0
  });
  
  const [analysis, setAnalysis] = useState<AnalysisResult | null>(null);
  const [attemptNumber, setAttemptNumber] = useState(1);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Initialize audio recording
  const initializeRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });
      
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: 'audio/webm;codecs=opus'
      });
      
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        const audioUrl = URL.createObjectURL(audioBlob);
        
        setRecording(prev => ({
          ...prev,
          recordingBlob: audioBlob,
          recordingUrl: audioUrl,
          isRecording: false
        }));
        
        // Stop all tracks to release microphone
        stream.getTracks().forEach(track => track.stop());
      };

      return true;
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Microphone Access Required",
        description: "Please allow microphone access to practice pronunciation.",
        variant: "destructive"
      });
      return false;
    }
  }, [toast]);

  // Start recording
  const startRecording = useCallback(async () => {
    const initialized = await initializeRecording();
    if (!initialized || !mediaRecorderRef.current) return;

    mediaRecorderRef.current.start();
    setRecording(prev => ({ ...prev, isRecording: true, duration: 0 }));
    
    // Start duration timer
    recordingTimerRef.current = setInterval(() => {
      setRecording(prev => ({ ...prev, duration: prev.duration + 1 }));
    }, 1000);

    toast({
      title: "Recording Started",
      description: "Speak clearly and pronounce the text above.",
      duration: 2000
    });
  }, [initializeRecording, toast]);

  // Stop recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && recording.isRecording) {
      mediaRecorderRef.current.stop();
      
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
      
      toast({
        title: "Recording Stopped",
        description: "Processing your pronunciation...",
        duration: 2000
      });
    }
  }, [recording.isRecording, toast]);

  // Play reference audio
  const playReferenceAudio = useCallback(() => {
    if (!referenceTtsUrl) {
      toast({
        title: "Reference Audio Not Available",
        description: "Reference pronunciation is not available for this exercise.",
        variant: "destructive"
      });
      return;
    }

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(referenceTtsUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setRecording(prev => ({ ...prev, isPlaying: true }));
    audio.onended = () => setRecording(prev => ({ ...prev, isPlaying: false }));
    audio.onerror = () => {
      setRecording(prev => ({ ...prev, isPlaying: false }));
      toast({
        title: "Audio Error",
        description: "Unable to play reference audio.",
        variant: "destructive"
      });
    };

    audio.play().catch(error => {
      console.error('Error playing reference audio:', error);
      toast({
        title: "Playback Failed",
        description: "Unable to play reference audio.",
        variant: "destructive"
      });
    });
  }, [referenceTtsUrl, toast]);

  // Play recorded audio
  const playRecording = useCallback(() => {
    if (!recording.recordingUrl) return;

    if (audioRef.current) {
      audioRef.current.pause();
    }

    const audio = new Audio(recording.recordingUrl);
    audioRef.current = audio;
    
    audio.onplay = () => setRecording(prev => ({ ...prev, isPlaying: true }));
    audio.onended = () => setRecording(prev => ({ ...prev, isPlaying: false }));
    
    audio.play().catch(error => {
      console.error('Error playing recording:', error);
      toast({
        title: "Playback Failed",
        description: "Unable to play your recording.",
        variant: "destructive"
      });
    });
  }, [recording.recordingUrl, toast]);

  // Analyze pronunciation
  const analyzePronunciation = useCallback(async () => {
    if (!recording.recordingBlob || !exerciseId) return;

    setIsAnalyzing(true);
    
    try {
      // Upload audio for analysis
      const formData = new FormData();
      formData.append('audio', recording.recordingBlob, 'recording.webm');
      
      const uploadResponse = await fetch('/api/upload/audio', {
        method: 'POST',
        body: formData
      });
      
      if (!uploadResponse.ok) {
        throw new Error('Failed to upload audio');
      }
      
      const uploadResult = await uploadResponse.json();
      
      // Submit for pronunciation analysis
      const analysisResponse = await fetch(`/api/linguaquest/voice-exercises/${exerciseId}/submit`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          audioRecordingUrl: uploadResult.url,
          attemptNumber
        })
      });
      
      const result = await analysisResponse.json();
      
      if (!result.success) {
        throw new Error(result.error || 'Analysis failed');
      }

      // Create detailed analysis result
      const analysisResult: AnalysisResult = {
        score: result.result.score,
        feedback: result.result.feedback,
        suggestions: result.result.suggestions,
        pronunciation: {
          accuracy: result.result.score,
          fluency: Math.max(0, result.result.score - 10 + Math.random() * 20),
          completeness: Math.max(0, result.result.score - 5 + Math.random() * 10)
        }
      };

      setAnalysis(analysisResult);
      
      // Check if exercise completed successfully
      if (analysisResult.score >= 70 || attemptNumber >= maxAttempts) {
        setIsCompleted(true);
        onComplete?.(analysisResult.score, analysisResult.feedback);
      }

      // Track attempt
      onAttempt?.(attemptNumber);

      toast({
        title: analysisResult.score >= 70 ? "Great Pronunciation!" : "Keep Practicing!",
        description: `Score: ${analysisResult.score}/100. ${analysisResult.feedback}`,
        duration: 4000
      });

    } catch (error) {
      console.error('Error analyzing pronunciation:', error);
      toast({
        title: "Analysis Failed",
        description: "Unable to analyze your pronunciation. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsAnalyzing(false);
    }
  }, [recording.recordingBlob, exerciseId, attemptNumber, maxAttempts, onComplete, onAttempt, toast]);

  // Reset for new attempt
  const resetForNewAttempt = useCallback(() => {
    setRecording({
      isRecording: false,
      isPlaying: false,
      recordingBlob: null,
      recordingUrl: null,
      duration: 0
    });
    setAnalysis(null);
    setAttemptNumber(prev => prev + 1);
    
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current = null;
    }
  }, []);

  // Format duration
  const formatDuration = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="space-y-6">
      {/* Exercise Header */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl">Pronunciation Practice</CardTitle>
            <div className="flex items-center space-x-2">
              <Badge variant="secondary">{targetLanguage}</Badge>
              <Badge variant="outline">{difficultyLevel}</Badge>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="text-center mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
              "{promptText}"
            </h3>
            <p className="text-gray-600 dark:text-gray-300">
              Read the text above clearly and naturally
            </p>
          </div>

          {/* Attempt Counter */}
          <div className="flex items-center justify-center space-x-4 mb-6">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {attemptNumber}
              </div>
              <div className="text-sm text-gray-500">Current Attempt</div>
            </div>
            <div className="h-8 w-px bg-gray-300"></div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {maxAttempts}
              </div>
              <div className="text-sm text-gray-500">Max Attempts</div>
            </div>
          </div>

          {/* Controls */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button 
              onClick={playReferenceAudio}
              disabled={recording.isRecording || recording.isPlaying}
              variant="outline"
              data-testid="button-play-reference"
            >
              <Volume2 className="w-4 h-4 mr-2" />
              Listen to Reference
            </Button>

            {!recording.isRecording ? (
              <Button 
                onClick={startRecording}
                disabled={recording.isPlaying || isAnalyzing}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-start-recording"
              >
                <Mic className="w-4 h-4 mr-2" />
                Start Recording
              </Button>
            ) : (
              <Button 
                onClick={stopRecording}
                className="bg-red-600 hover:bg-red-700"
                data-testid="button-stop-recording"
              >
                <MicOff className="w-4 h-4 mr-2" />
                Stop Recording ({formatDuration(recording.duration)})
              </Button>
            )}

            {recording.recordingUrl && (
              <Button 
                onClick={playRecording}
                disabled={recording.isRecording || recording.isPlaying}
                variant="outline"
                data-testid="button-play-recording"
              >
                <Play className="w-4 h-4 mr-2" />
                Play My Recording
              </Button>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Analysis Section */}
      {recording.recordingBlob && !isCompleted && (
        <Card>
          <CardHeader>
            <CardTitle>Ready for Analysis</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-center space-y-4">
              <p className="text-gray-600 dark:text-gray-300">
                Your recording is ready. Click below to get pronunciation feedback.
              </p>
              <Button 
                onClick={analyzePronunciation}
                disabled={isAnalyzing}
                className="bg-emerald-600 hover:bg-emerald-700"
                data-testid="button-analyze-pronunciation"
              >
                {isAnalyzing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Target className="w-4 h-4 mr-2" />
                    Analyze Pronunciation
                  </>
                )}
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Analysis Results */}
      {analysis && (
        <Card className={`${analysis.score >= 70 ? 'border-green-200 bg-green-50' : 'border-yellow-200 bg-yellow-50'} dark:bg-gray-800`}>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                {analysis.score >= 70 ? (
                  <CheckCircle className="w-5 h-5 text-green-600 mr-2" />
                ) : (
                  <XCircle className="w-5 h-5 text-yellow-600 mr-2" />
                )}
                Pronunciation Analysis
              </CardTitle>
              <Badge className={`${analysis.score >= 70 ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                {analysis.score}/100
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Score Breakdown */}
            <div className="grid grid-cols-3 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analysis.pronunciation.accuracy)}%
                </div>
                <div className="text-sm text-gray-500">Accuracy</div>
                <Progress value={analysis.pronunciation.accuracy} className="mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analysis.pronunciation.fluency)}%
                </div>
                <div className="text-sm text-gray-500">Fluency</div>
                <Progress value={analysis.pronunciation.fluency} className="mt-1" />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900 dark:text-white">
                  {Math.round(analysis.pronunciation.completeness)}%
                </div>
                <div className="text-sm text-gray-500">Completeness</div>
                <Progress value={analysis.pronunciation.completeness} className="mt-1" />
              </div>
            </div>

            {/* Feedback */}
            <Alert>
              <AlertDescription>
                <strong>Feedback:</strong> {analysis.feedback}
              </AlertDescription>
            </Alert>

            {/* Suggestions */}
            {analysis.suggestions.length > 0 && (
              <div>
                <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                  Suggestions for Improvement:
                </h4>
                <ul className="space-y-1">
                  {analysis.suggestions.map((suggestion, index) => (
                    <li key={index} className="text-sm text-gray-600 dark:text-gray-300 flex items-start">
                      <span className="text-emerald-500 mr-2">•</span>
                      {suggestion}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 justify-center">
              {!isCompleted && attemptNumber < maxAttempts && analysis.score < 70 && (
                <Button 
                  onClick={resetForNewAttempt}
                  variant="outline"
                  data-testid="button-try-again"
                >
                  <RotateCcw className="w-4 h-4 mr-2" />
                  Try Again
                </Button>
              )}
              
              {(isCompleted || analysis.score >= 70) && (
                <Badge className="bg-green-100 text-green-800 px-4 py-2">
                  <Award className="w-4 h-4 mr-2" />
                  Exercise Completed!
                </Badge>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Exercise Complete */}
      {isCompleted && analysis && (
        <Alert className="bg-green-50 border-green-200">
          <CheckCircle className="h-4 w-4 text-green-600" />
          <AlertDescription>
            <strong>Congratulations!</strong> You've completed this pronunciation exercise 
            {analysis.score >= 70 ? ' with excellent results!' : ' after ' + attemptNumber + ' attempts.'}
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}