import { useRef, useCallback, useEffect } from 'react';
import { useSocket } from './use-socket';

interface AudioStreamOptions {
  sampleRate?: number;
  channelCount?: number;
  echoCancellation?: boolean;
  noiseSuppression?: boolean;
  autoGainControl?: boolean;
}

export function useAudioStream(
  sessionId: string,
  role: 'teacher' | 'student',
  options: AudioStreamOptions = {}
) {
  const { socket } = useSocket();
  const audioContextRef = useRef<AudioContext | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const isStreamingRef = useRef(false);

  const {
    sampleRate = 16000,
    channelCount = 1,
    echoCancellation = true,
    noiseSuppression = true,
    autoGainControl = true
  } = options;

  /**
   * Convert Float32Array to 16-bit PCM
   */
  const floatTo16BitPCM = useCallback((float32Array: Float32Array): ArrayBuffer => {
    const buffer = new ArrayBuffer(float32Array.length * 2);
    const view = new DataView(buffer);
    let offset = 0;
    
    for (let i = 0; i < float32Array.length; i++, offset += 2) {
      const s = Math.max(-1, Math.min(1, float32Array[i]));
      view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true);
    }
    
    return buffer;
  }, []);

  /**
   * Start audio streaming
   */
  const startStreaming = useCallback(async () => {
    if (isStreamingRef.current) return;
    
    try {
      // Get user media with specific constraints
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: { ideal: sampleRate },
          channelCount: { ideal: channelCount },
          echoCancellation,
          noiseSuppression,
          autoGainControl
        },
        video: false
      });
      
      streamRef.current = stream;
      
      // Create audio context
      audioContextRef.current = new AudioContext({ sampleRate });
      const audioContext = audioContextRef.current;
      
      // Create source from stream
      sourceRef.current = audioContext.createMediaStreamSource(stream);
      
      // Create processor for capturing audio chunks
      // Buffer size of 4096 gives us ~256ms chunks at 16kHz
      processorRef.current = audioContext.createScriptProcessor(4096, channelCount, channelCount);
      
      processorRef.current.onaudioprocess = (e) => {
        if (!isStreamingRef.current || !socket) return;
        
        // Get audio data from input buffer
        const inputData = e.inputBuffer.getChannelData(0);
        
        // Convert to 16-bit PCM
        const pcmData = floatTo16BitPCM(inputData);
        
        // Send to server via WebSocket
        socket.emit('audio-chunk', {
          sessionId,
          role,
          audio: pcmData,
          timestamp: Date.now()
        });
      };
      
      // Connect the nodes
      sourceRef.current.connect(processorRef.current);
      processorRef.current.connect(audioContext.destination);
      
      isStreamingRef.current = true;
      console.log(`Audio streaming started for ${role}`);
      
    } catch (error) {
      console.error('Failed to start audio streaming:', error);
      throw error;
    }
  }, [sessionId, role, socket, sampleRate, channelCount, echoCancellation, noiseSuppression, autoGainControl, floatTo16BitPCM]);

  /**
   * Stop audio streaming
   */
  const stopStreaming = useCallback(() => {
    if (!isStreamingRef.current) return;
    
    // Disconnect nodes
    if (sourceRef.current && processorRef.current) {
      sourceRef.current.disconnect();
      processorRef.current.disconnect();
    }
    
    // Close audio context
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    
    // Stop media stream
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }
    
    // Clear refs
    sourceRef.current = null;
    processorRef.current = null;
    isStreamingRef.current = false;
    
    console.log('Audio streaming stopped');
  }, []);

  /**
   * Get current audio level (for visualization)
   */
  const getAudioLevel = useCallback((): number => {
    if (!processorRef.current) return 0;
    
    // This will be calculated in the processor
    // For now return a placeholder
    return 0;
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopStreaming();
    };
  }, [stopStreaming]);

  return {
    startStreaming,
    stopStreaming,
    isStreaming: isStreamingRef.current,
    getAudioLevel
  };
}