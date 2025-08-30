// Ringtone Service for Teachers
// Creates 5 different programmatic ringtones using Web Audio API

export interface Ringtone {
  id: string;
  name: string;
  description: string;
  preview: () => Promise<void>;
  create: () => Promise<AudioBuffer>;
}

class RingtoneService {
  private audioContext: AudioContext | null = null;
  private currentRingtone: AudioBufferSourceNode | null = null;
  private currentGainNode: GainNode | null = null;

  private getAudioContext(): AudioContext {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return this.audioContext;
  }

  // Generate a single tone at given frequency and duration
  private createTone(frequency: number, duration: number, type: OscillatorType = 'sine'): AudioBuffer {
    const context = this.getAudioContext();
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const buffer = context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      let sample = 0;
      
      switch (type) {
        case 'sine':
          sample = Math.sin(2 * Math.PI * frequency * t);
          break;
        case 'square':
          sample = Math.sign(Math.sin(2 * Math.PI * frequency * t));
          break;
        case 'sawtooth':
          sample = 2 * (t * frequency - Math.floor(t * frequency + 0.5));
          break;
        case 'triangle':
          sample = 2 * Math.abs(2 * (t * frequency - Math.floor(t * frequency + 0.5))) - 1;
          break;
      }
      
      // Apply envelope (fade in/out to prevent clicks)
      const fadeTime = 0.01;
      const fadeSamples = sampleRate * fadeTime;
      if (i < fadeSamples) {
        sample *= i / fadeSamples;
      } else if (i > length - fadeSamples) {
        sample *= (length - i) / fadeSamples;
      }
      
      channelData[i] = sample * 0.3; // Keep volume moderate
    }

    return buffer;
  }

  // Combine multiple tones into a sequence
  private combineSequence(tones: AudioBuffer[]): AudioBuffer {
    const context = this.getAudioContext();
    const totalLength = tones.reduce((sum, tone) => sum + tone.length, 0);
    const buffer = context.createBuffer(1, totalLength, context.sampleRate);
    const channelData = buffer.getChannelData(0);

    let offset = 0;
    for (const tone of tones) {
      const toneData = tone.getChannelData(0);
      for (let i = 0; i < toneData.length; i++) {
        channelData[offset + i] = toneData[i];
      }
      offset += tone.length;
    }

    return buffer;
  }

  // Create Classic Phone Ring (double ring pattern)
  private createClassicRing(): AudioBuffer {
    const ring1 = this.createTone(440, 0.4, 'sine'); // A4
    const ring2 = this.createTone(480, 0.4, 'sine'); // A#4
    const silence = this.createTone(0, 0.2, 'sine');
    const longSilence = this.createTone(0, 1.0, 'sine');

    return this.combineSequence([ring1, silence, ring2, longSilence]);
  }

  // Create Modern Chime (ascending notes)
  private createModernChime(): AudioBuffer {
    const note1 = this.createTone(523, 0.3, 'sine'); // C5
    const note2 = this.createTone(659, 0.3, 'sine'); // E5
    const note3 = this.createTone(784, 0.5, 'sine'); // G5
    const silence = this.createTone(0, 1.2, 'sine');

    return this.combineSequence([note1, note2, note3, silence]);
  }

  // Create Gentle Bell (soft harmonics)
  private createGentleBell(): AudioBuffer {
    const context = this.getAudioContext();
    const duration = 1.0;
    const sampleRate = context.sampleRate;
    const length = sampleRate * duration;
    const buffer = context.createBuffer(1, length, sampleRate);
    const channelData = buffer.getChannelData(0);

    for (let i = 0; i < length; i++) {
      const t = i / sampleRate;
      // Bell-like harmonic series
      const fundamental = 440;
      const sample = 
        0.5 * Math.sin(2 * Math.PI * fundamental * t) +
        0.3 * Math.sin(2 * Math.PI * fundamental * 2 * t) +
        0.2 * Math.sin(2 * Math.PI * fundamental * 3 * t) +
        0.1 * Math.sin(2 * Math.PI * fundamental * 4 * t);
      
      // Decay envelope
      const decay = Math.exp(-3 * t);
      channelData[i] = sample * decay * 0.2;
    }

    const silence = this.createTone(0, 1.5, 'sine');
    return this.combineSequence([buffer, silence]);
  }

  // Create Alert Tone (urgent beeping)
  private createAlertTone(): AudioBuffer {
    const beep = this.createTone(800, 0.1, 'square');
    const pause = this.createTone(0, 0.1, 'sine');
    const longPause = this.createTone(0, 0.8, 'sine');

    return this.combineSequence([beep, pause, beep, pause, beep, longPause]);
  }

  // Create Soft Melody (peaceful tune)
  private createSoftMelody(): AudioBuffer {
    // Simple melody: C-E-G-E-C
    const notes = [
      this.createTone(523, 0.3, 'sine'), // C5
      this.createTone(659, 0.3, 'sine'), // E5
      this.createTone(784, 0.3, 'sine'), // G5
      this.createTone(659, 0.3, 'sine'), // E5
      this.createTone(523, 0.4, 'sine'), // C5
    ];
    
    const pause = this.createTone(0, 0.1, 'sine');
    const endPause = this.createTone(0, 1.0, 'sine');
    
    const sequence = [];
    for (let i = 0; i < notes.length; i++) {
      sequence.push(notes[i]);
      if (i < notes.length - 1) sequence.push(pause);
    }
    sequence.push(endPause);

    return this.combineSequence(sequence);
  }

  public getRingtones(): Ringtone[] {
    return [
      {
        id: 'classic',
        name: 'Classic Ring',
        description: 'Traditional double-ring telephone sound',
        preview: async () => this.playRingtone('classic', false),
        create: () => Promise.resolve(this.createClassicRing())
      },
      {
        id: 'modern',
        name: 'Modern Chime',
        description: 'Clean ascending chime tones',
        preview: async () => this.playRingtone('modern', false),
        create: () => Promise.resolve(this.createModernChime())
      },
      {
        id: 'gentle',
        name: 'Gentle Bell',
        description: 'Soft bell with natural decay',
        preview: async () => this.playRingtone('gentle', false),
        create: () => Promise.resolve(this.createGentleBell())
      },
      {
        id: 'alert',
        name: 'Alert Tone',
        description: 'Urgent beeping for high priority',
        preview: async () => this.playRingtone('alert', false),
        create: () => Promise.resolve(this.createAlertTone())
      },
      {
        id: 'soft',
        name: 'Soft Melody',
        description: 'Peaceful melody for calm environment',
        preview: async () => this.playRingtone('soft', false),
        create: () => Promise.resolve(this.createSoftMelody())
      }
    ];
  }

  // Play selected ringtone
  public async playRingtone(ringtoneId: string, loop: boolean = true): Promise<void> {
    this.stopRingtone(); // Stop any currently playing ringtone

    const context = this.getAudioContext();
    
    // Resume context if suspended (required by browser policies)
    if (context.state === 'suspended') {
      await context.resume();
    }

    let buffer: AudioBuffer;
    
    switch (ringtoneId) {
      case 'classic':
        buffer = this.createClassicRing();
        break;
      case 'modern':
        buffer = this.createModernChime();
        break;
      case 'gentle':
        buffer = this.createGentleBell();
        break;
      case 'alert':
        buffer = this.createAlertTone();
        break;
      case 'soft':
        buffer = this.createSoftMelody();
        break;
      default:
        buffer = this.createClassicRing();
    }

    // Create gain node for volume control
    this.currentGainNode = context.createGain();
    this.currentGainNode.gain.value = 0.5; // 50% volume
    this.currentGainNode.connect(context.destination);

    // Create and start the source
    this.currentRingtone = context.createBufferSource();
    this.currentRingtone.buffer = buffer;
    this.currentRingtone.loop = loop;
    this.currentRingtone.connect(this.currentGainNode);
    this.currentRingtone.start(0);

    // Handle ended event
    this.currentRingtone.onended = () => {
      this.currentRingtone = null;
      this.currentGainNode = null;
    };
  }

  // Stop currently playing ringtone
  public stopRingtone(): void {
    if (this.currentRingtone) {
      try {
        this.currentRingtone.stop();
      } catch (e) {
        // Ignore if already stopped
      }
      this.currentRingtone = null;
    }
    
    if (this.currentGainNode) {
      this.currentGainNode.disconnect();
      this.currentGainNode = null;
    }
  }

  // Check if ringtone is currently playing
  public isPlaying(): boolean {
    return this.currentRingtone !== null;
  }

  // Set volume (0.0 to 1.0)
  public setVolume(volume: number): void {
    if (this.currentGainNode) {
      this.currentGainNode.gain.value = Math.max(0, Math.min(1, volume));
    }
  }

  // Dispose of audio context
  public dispose(): void {
    this.stopRingtone();
    if (this.audioContext) {
      this.audioContext.close();
      this.audioContext = null;
    }
  }
}

export const ringtoneService = new RingtoneService();