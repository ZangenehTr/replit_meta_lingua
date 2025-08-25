import { EventEmitter } from 'events';
import { Server, Socket } from 'socket.io';

interface AudioChunk {
  sessionId: string;
  role: 'teacher' | 'student';
  audio: Buffer;
  timestamp: number;
}

interface TranscriptSegment {
  text: string;
  speaker: 'teacher' | 'student';
  timestamp: number;
  confidence: number;
}

export class AudioProcessor extends EventEmitter {
  private audioBuffers: Map<string, Buffer[]> = new Map();
  private transcripts: Map<string, TranscriptSegment[]> = new Map();
  private io: Server;
  
  // Audio processing parameters
  private readonly SAMPLE_RATE = 16000;
  private readonly CHUNK_DURATION_MS = 1000; // Process 1 second chunks
  private readonly VAD_THRESHOLD = 0.5; // Voice activity detection threshold
  
  constructor(io: Server) {
    super();
    this.io = io;
  }

  /**
   * Process incoming audio chunk from client
   */
  async processAudioChunk(chunk: AudioChunk): Promise<void> {
    const { sessionId, role, audio } = chunk;
    
    // Buffer management
    if (!this.audioBuffers.has(sessionId)) {
      this.audioBuffers.set(sessionId, []);
    }
    
    const buffers = this.audioBuffers.get(sessionId)!;
    buffers.push(audio);
    
    // Process when we have enough audio (1 second worth)
    const totalSize = buffers.reduce((sum, buf) => sum + buf.length, 0);
    const requiredSize = (this.SAMPLE_RATE * 2 * this.CHUNK_DURATION_MS) / 1000; // 16-bit audio
    
    if (totalSize >= requiredSize) {
      const combinedBuffer = Buffer.concat(buffers);
      this.audioBuffers.set(sessionId, []); // Clear buffer
      
      // Process the audio chunk
      await this.transcribeAudio(sessionId, role, combinedBuffer);
    }
  }

  /**
   * Transcribe audio using Web Speech API fallback or Whisper
   * For now, using a simplified approach that can be enhanced with Whisper later
   */
  private async transcribeAudio(
    sessionId: string, 
    role: 'teacher' | 'student', 
    audioBuffer: Buffer
  ): Promise<void> {
    try {
      // Check for voice activity first
      const hasVoice = this.detectVoiceActivity(audioBuffer);
      
      if (!hasVoice) {
        // Emit silence event
        this.io.to(sessionId).emit('silence-detected', {
          role,
          duration: this.CHUNK_DURATION_MS
        });
        return;
      }

      // For MVP, we'll use a simple transcription approach
      // This will be replaced with actual Whisper integration
      const transcript = await this.getTranscript(audioBuffer, role);
      
      if (transcript) {
        // Store transcript
        if (!this.transcripts.has(sessionId)) {
          this.transcripts.set(sessionId, []);
        }
        
        const segment: TranscriptSegment = {
          text: transcript,
          speaker: role,
          timestamp: Date.now(),
          confidence: 0.9
        };
        
        this.transcripts.get(sessionId)!.push(segment);
        
        // Emit transcript event
        this.io.to(sessionId).emit('transcript', segment);
        
        // Emit for processing
        this.emit('transcript-ready', {
          sessionId,
          segment,
          context: this.getRecentContext(sessionId)
        });
      }
    } catch (error) {
      console.error('Transcription error:', error);
    }
  }

  /**
   * Simple VAD using energy-based detection
   */
  private detectVoiceActivity(audioBuffer: Buffer): boolean {
    // Convert buffer to 16-bit PCM samples
    const samples = new Int16Array(audioBuffer.buffer, audioBuffer.byteOffset, audioBuffer.length / 2);
    
    // Calculate RMS energy
    let sum = 0;
    for (let i = 0; i < samples.length; i++) {
      sum += samples[i] * samples[i];
    }
    const rms = Math.sqrt(sum / samples.length);
    
    // Normalize to 0-1 range
    const normalizedEnergy = rms / 32768;
    
    // Voice detected if energy exceeds threshold
    return normalizedEnergy > 0.01; // Very low threshold for testing
  }

  /**
   * Get transcript - placeholder for Whisper integration
   */
  private async getTranscript(audioBuffer: Buffer, role: 'teacher' | 'student'): Promise<string | null> {
    // This is a placeholder that generates contextual responses
    // Will be replaced with actual Whisper ASR
    
    // For testing, return sample transcripts based on role
    const teacherPhrases = [
      "Can you tell me about your day?",
      "That's a good point",
      "Try to use the past tense here",
      "Excellent pronunciation",
      "Let's practice this phrase",
      "What do you think about this?"
    ];
    
    const studentPhrases = [
      "I went to the store yesterday",
      "Can you repeat that please?",
      "I don't understand",
      "Is this correct?",
      "I think the answer is",
      "How do you say this in English?"
    ];
    
    // Detect if there's actual voice activity
    if (!this.detectVoiceActivity(audioBuffer)) {
      return null;
    }
    
    // For testing, return a random phrase
    const phrases = role === 'teacher' ? teacherPhrases : studentPhrases;
    return phrases[Math.floor(Math.random() * phrases.length)];
  }

  /**
   * Get recent conversation context
   */
  private getRecentContext(sessionId: string, windowSize: number = 5): string {
    const transcripts = this.transcripts.get(sessionId) || [];
    const recent = transcripts.slice(-windowSize);
    
    return recent
      .map(t => `${t.speaker}: ${t.text}`)
      .join('\n');
  }

  /**
   * Get transcript window for analysis
   */
  getTranscriptWindow(sessionId: string, durationMs: number = 5000): TranscriptSegment[] {
    const transcripts = this.transcripts.get(sessionId) || [];
    const cutoff = Date.now() - durationMs;
    
    return transcripts.filter(t => t.timestamp > cutoff);
  }

  /**
   * Clear session data
   */
  clearSession(sessionId: string): void {
    this.audioBuffers.delete(sessionId);
    this.transcripts.delete(sessionId);
  }

  /**
   * Get full session transcript
   */
  getFullTranscript(sessionId: string): TranscriptSegment[] {
    return this.transcripts.get(sessionId) || [];
  }

  /**
   * Calculate speaking time statistics
   */
  getSpeakingStats(sessionId: string): { teacher: number; student: number } {
    const transcripts = this.transcripts.get(sessionId) || [];
    
    const stats = {
      teacher: 0,
      student: 0
    };
    
    // Estimate speaking time based on transcript length and count
    transcripts.forEach(t => {
      // Rough estimate: 150 words per minute average speaking rate
      const estimatedSeconds = (t.text.split(' ').length / 150) * 60;
      stats[t.speaker] += estimatedSeconds;
    });
    
    return stats;
  }
}