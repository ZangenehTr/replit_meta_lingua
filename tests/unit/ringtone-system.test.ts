import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// Real test for ringtone system functionality
describe('Ringtone System Tests', () => {
  let mockAudioContext: any;
  let mockAudioBuffer: any;
  let mockBufferSource: any;
  let mockGainNode: any;

  beforeEach(() => {
    // Mock Web Audio API
    mockAudioBuffer = {
      length: 44100,
      getChannelData: vi.fn().mockReturnValue(new Float32Array(44100))
    };

    mockBufferSource = {
      buffer: null,
      loop: false,
      start: vi.fn(),
      stop: vi.fn(),
      connect: vi.fn(),
      onended: null
    };

    mockGainNode = {
      gain: { value: 0.7 },
      connect: vi.fn(),
      disconnect: vi.fn()
    };

    mockAudioContext = {
      state: 'suspended',
      sampleRate: 44100,
      destination: {},
      resume: vi.fn().mockResolvedValue(undefined),
      close: vi.fn().mockResolvedValue(undefined),
      createBuffer: vi.fn().mockReturnValue(mockAudioBuffer),
      createBufferSource: vi.fn().mockReturnValue(mockBufferSource),
      createGain: vi.fn().mockReturnValue(mockGainNode),
      onstatechange: null
    };

    // Mock global AudioContext
    global.AudioContext = vi.fn().mockImplementation(() => mockAudioContext);
    (global as any).webkitAudioContext = AudioContext;

    // Mock console methods to reduce noise
    vi.spyOn(console, 'log').mockImplementation(() => {});
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  it('should create ringtone service successfully', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    expect(ringtoneService).toBeDefined();
  });

  it('should initialize audio context when playing ringtone', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    // Set context to running state for successful playback
    mockAudioContext.state = 'running';
    
    await ringtoneService.playRingtone('classic', false);
    
    expect(global.AudioContext).toHaveBeenCalled();
    expect(mockAudioContext.createBuffer).toHaveBeenCalled();
    expect(mockAudioContext.createBufferSource).toHaveBeenCalled();
    expect(mockAudioContext.createGain).toHaveBeenCalled();
    expect(mockBufferSource.start).toHaveBeenCalled();
  });

  it('should handle suspended AudioContext by resuming', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    // Start suspended, then change to running after resume
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockImplementation(() => {
      mockAudioContext.state = 'running';
      return Promise.resolve();
    });
    
    await ringtoneService.playRingtone('modern', false);
    
    expect(mockAudioContext.resume).toHaveBeenCalled();
    expect(mockBufferSource.start).toHaveBeenCalled();
  });

  it('should throw error when AudioContext cannot be resumed', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockRejectedValue(new Error('Resume failed'));
    
    await expect(ringtoneService.playRingtone('gentle', false))
      .rejects.toThrow('Could not initialize audio');
  });

  it('should stop ringtone correctly', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'running';
    
    // Play then stop
    await ringtoneService.playRingtone('alert', true);
    expect(ringtoneService.isPlaying()).toBe(true);
    
    ringtoneService.stopRingtone();
    
    expect(mockBufferSource.stop).toHaveBeenCalled();
    expect(mockGainNode.disconnect).toHaveBeenCalled();
    expect(ringtoneService.isPlaying()).toBe(false);
  });

  it('should set volume correctly', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    ringtoneService.setVolume(0.5);
    expect(ringtoneService.getVolume()).toBe(0.5);
    
    // Test volume bounds
    ringtoneService.setVolume(1.5); // Should clamp to 1.0
    expect(ringtoneService.getVolume()).toBe(1.0);
    
    ringtoneService.setVolume(-0.5); // Should clamp to 0.0
    expect(ringtoneService.getVolume()).toBe(0.0);
  });

  it('should handle multiple stop calls without error', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'running';
    
    await ringtoneService.playRingtone('soft', false);
    
    // Stop multiple times - should not throw
    ringtoneService.stopRingtone();
    ringtoneService.stopRingtone();
    ringtoneService.stopRingtone();
    
    expect(ringtoneService.isPlaying()).toBe(false);
  });

  it('should dispose audio context properly', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'running';
    
    await ringtoneService.playRingtone('classic', false);
    ringtoneService.dispose();
    
    expect(mockBufferSource.stop).toHaveBeenCalled();
    expect(mockAudioContext.close).toHaveBeenCalled();
  });

  it('should not close already closed AudioContext', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'closed';
    
    ringtoneService.dispose();
    
    // close() should not be called if already closed
    expect(mockAudioContext.close).not.toHaveBeenCalled();
  });

  it('should enable audio with user gesture', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    mockAudioContext.state = 'suspended';
    mockAudioContext.resume.mockImplementation(() => {
      mockAudioContext.state = 'running';
      return Promise.resolve();
    });
    
    await ringtoneService.enableAudioWithUserGesture();
    
    expect(mockAudioContext.resume).toHaveBeenCalled();
  });

  it('should provide all ringtone types', async () => {
    const { ringtoneService } = await import('@/services/ringtone-service');
    
    const ringtones = ringtoneService.getRingtones();
    
    expect(ringtones).toHaveLength(5);
    expect(ringtones.map(r => r.id)).toEqual(['classic', 'modern', 'gentle', 'alert', 'soft']);
    
    // Each ringtone should have required properties
    ringtones.forEach(ringtone => {
      expect(ringtone).toHaveProperty('id');
      expect(ringtone).toHaveProperty('name');
      expect(ringtone).toHaveProperty('description');
      expect(ringtone).toHaveProperty('preview');
      expect(ringtone).toHaveProperty('create');
    });
  });
});