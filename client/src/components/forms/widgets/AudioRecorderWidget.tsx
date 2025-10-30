/**
 * Audio Recorder Widget for DynamicForm
 * 
 * Supports:
 * - Browser-based audio recording
 * - Playback before submit
 * - Re-recording
 * - Duration limits
 * - Waveform visualization (optional)
 */

import { useState, useRef, useEffect } from 'react';
import { Mic, Square, Play, Pause, Trash2, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils';
import { WidgetProps } from './WidgetRegistry';
import { apiRequest } from '@/lib/queryClient';

export function AudioRecorderWidget({ field, value, onChange, error, disabled, language }: WidgetProps) {
  const [recording, setRecording] = useState(false);
  const [playing, setPlaying] = useState(false);
  const [duration, setDuration] = useState(0);
  const [uploading, setUploading] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  const config = field.audioConfig || {};
  const maxDuration = config.maxDuration || 300; // 5 minutes default
  const minDuration = config.minDuration || 1;
  const allowReRecord = config.allowReRecord !== false;
  const allowPlayback = config.allowPlayback !== false;

  // Get localized text
  const getLabel = (key: string): string => {
    if (language === 'fa' && field[`${key}Fa`]) return field[`${key}Fa`];
    if (language === 'ar' && field[`${key}Ar`]) return field[`${key}Ar`];
    return field[`${key}En`] || field[key] || '';
  };

  useEffect(() => {
    // If value exists (e.g., from server), set the audio URL
    if (value && typeof value === 'object' && value.url) {
      setAudioUrl(value.url);
    }
  }, [value]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: config.format || 'audio/webm',
      });

      audioChunksRef.current = [];
      mediaRecorderRef.current = mediaRecorder;

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: config.format || 'audio/webm' });
        setAudioBlob(audioBlob);

        // Create local URL for playback
        const url = URL.createObjectURL(audioBlob);
        setAudioUrl(url);

        // Stop all tracks
        stream.getTracks().forEach(track => track.stop());

        // Upload the audio
        await uploadAudio(audioBlob);
      };

      mediaRecorder.start();
      setRecording(true);
      setDuration(0);

      // Start timer
      timerRef.current = setInterval(() => {
        setDuration(prev => {
          const newDuration = prev + 1;
          if (newDuration >= maxDuration) {
            stopRecording();
          }
          return newDuration;
        });
      }, 1000);
    } catch (error) {
      console.error('Error starting recording:', error);
      alert('Failed to access microphone. Please grant permission.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && recording) {
      mediaRecorderRef.current.stop();
      setRecording(false);

      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const uploadAudio = async (blob: Blob) => {
    if (duration < minDuration) {
      alert(`Recording must be at least ${minDuration} seconds long`);
      return;
    }

    setUploading(true);

    try {
      const formData = new FormData();
      const filename = `audio-${Date.now()}.webm`;
      formData.append('file', blob, filename);
      formData.append('subfolder', config.uploadPath || field.id);
      formData.append('allowedTypes', JSON.stringify(['audio/*']));

      const result = await apiRequest<any>('/api/form-files/upload', {
        method: 'POST',
        body: formData,
      });

      onChange(result.file);
    } catch (error: any) {
      console.error('Audio upload error:', error);
      alert(`Upload failed: ${error.message}`);
    } finally {
      setUploading(false);
    }
  };

  const playAudio = () => {
    if (!audioUrl) return;

    if (!audioPlayerRef.current) {
      audioPlayerRef.current = new Audio(audioUrl);
      audioPlayerRef.current.onended = () => setPlaying(false);
    }

    if (playing) {
      audioPlayerRef.current.pause();
      setPlaying(false);
    } else {
      audioPlayerRef.current.play();
      setPlaying(true);
    }
  };

  const deleteRecording = () => {
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }

    if (audioUrl && audioUrl.startsWith('blob:')) {
      URL.revokeObjectURL(audioUrl);
    }

    setAudioBlob(null);
    setAudioUrl(null);
    setDuration(0);
    setPlaying(false);
    onChange(null);
  };

  const formatDuration = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const hasRecording = audioUrl || value;

  return (
    <div className="space-y-3" data-testid={`audio-recorder-${field.id}`}>
      {/* Recording controls */}
      {!hasRecording && (
        <div className="border-2 border-dashed rounded-lg p-6">
          <div className="flex flex-col items-center gap-4">
            {recording ? (
              <>
                <div className="relative">
                  <Mic className="w-12 h-12 text-red-500 animate-pulse" />
                  <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full animate-pulse" />
                </div>
                <p className="text-lg font-medium">{formatDuration(duration)}</p>
                <p className="text-sm text-gray-500">
                  Max: {formatDuration(maxDuration)}
                </p>
                <Progress value={(duration / maxDuration) * 100} className="w-full" />
                <Button
                  type="button"
                  onClick={stopRecording}
                  variant="destructive"
                  size="lg"
                >
                  <Square className="w-5 h-5 mr-2" />
                  Stop Recording
                </Button>
              </>
            ) : (
              <>
                <Mic className="w-12 h-12 text-gray-400" />
                <Button
                  type="button"
                  onClick={startRecording}
                  disabled={disabled || uploading}
                  size="lg"
                >
                  <Mic className="w-5 h-5 mr-2" />
                  Start Recording
                </Button>
                <p className="text-xs text-gray-500">
                  {minDuration > 0 && `Min: ${formatDuration(minDuration)} • `}
                  Max: {formatDuration(maxDuration)}
                </p>
              </>
            )}
          </div>
        </div>
      )}

      {/* Playback and re-record */}
      {hasRecording && !recording && (
        <div className="border rounded-lg p-4">
          {uploading ? (
            <div className="flex items-center justify-center gap-3 py-4">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
              <span>Uploading audio...</span>
            </div>
          ) : (
            <div className="flex items-center gap-3">
              {allowPlayback && (
                <Button
                  type="button"
                  onClick={playAudio}
                  variant="outline"
                  size="sm"
                  disabled={disabled}
                >
                  {playing ? (
                    <Pause className="w-4 h-4 mr-2" />
                  ) : (
                    <Play className="w-4 h-4 mr-2" />
                  )}
                  {playing ? 'Pause' : 'Play'}
                </Button>
              )}

              <div className="flex-1">
                <p className="text-sm font-medium">Audio recorded</p>
                <p className="text-xs text-gray-500">
                  Duration: {formatDuration(duration)}
                </p>
              </div>

              {allowReRecord && !disabled && (
                <Button
                  type="button"
                  onClick={deleteRecording}
                  variant="ghost"
                  size="sm"
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
}
