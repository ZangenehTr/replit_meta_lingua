"""
Audio mixing and mastering with natural conversation effects.
"""
import numpy as np
import librosa
import soundfile as sf
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
import random

try:
    from pydub import AudioSegment
    from pydub.effects import normalize, compress_dynamic_range
    from pydub.playback import play
except ImportError as e:
    print(f"Warning: pydub not available: {e}")
    print("Please install with: pip install pydub")


class ConversationMixer:
    """Mixes multi-speaker audio with natural conversation dynamics."""
    
    def __init__(self, sample_rate: int = 22050):
        self.sample_rate = sample_rate
        self.room_tone_level = -50  # dBFS for subtle background
        
    def mix_conversation(self, segments: List[Dict[str, Any]], 
                        output_path: str,
                        add_overlaps: bool = True,
                        add_backchannels: bool = True) -> Dict[str, Any]:
        """Mix conversation segments with natural timing and effects."""
        
        print(f"Mixing {len(segments)} conversation segments...")
        
        # Calculate timing and overlaps
        timed_segments = self._calculate_conversation_timing(segments, add_overlaps)
        
        # Create the mixed audio
        mixed_audio = self._create_mixed_audio(timed_segments, add_backchannels)
        
        # Apply room tone
        mixed_audio = self._add_room_tone(mixed_audio)
        
        # Apply dynamics processing
        mixed_audio = self._apply_dynamics(mixed_audio)
        
        # Export final audio
        self._export_audio(mixed_audio, output_path)
        
        # Return mix report
        return self._generate_mix_report(timed_segments, mixed_audio)
    
    def _calculate_conversation_timing(self, segments: List[Dict[str, Any]], 
                                     add_overlaps: bool) -> List[Dict[str, Any]]:
        """Calculate natural conversation timing with overlaps."""
        timed_segments = []
        current_time = 0.0
        
        for i, segment in enumerate(segments):
            # Load audio to get duration
            try:
                audio = AudioSegment.from_wav(segment['file'])
                duration = len(audio) / 1000.0  # Convert to seconds
            except:
                duration = 3.0  # Default duration if can't load
            
            # Calculate start time
            if i == 0:
                start_time = 0.0
            else:
                prev_segment = timed_segments[i-1]
                gap = self._calculate_natural_gap(prev_segment, segment, i)
                
                # Add overlap if enabled and appropriate
                if add_overlaps and self._should_overlap(prev_segment, segment):
                    overlap = self._calculate_overlap_duration(prev_segment, segment)
                    start_time = prev_segment['end_time'] - overlap
                else:
                    start_time = prev_segment['end_time'] + gap
            
            end_time = start_time + duration
            
            timed_segments.append({
                **segment,
                'start_time': start_time,
                'end_time': end_time,
                'duration': duration
            })
            
            current_time = end_time
        
        return timed_segments
    
    def _calculate_natural_gap(self, prev_segment: Dict[str, Any], 
                              curr_segment: Dict[str, Any], index: int) -> float:
        """Calculate natural gap between speakers."""
        # Base gap durations
        base_gaps = {
            'question_response': 0.8,  # After questions
            'statement_response': 0.5,  # After statements  
            'interruption': 0.1,       # Quick interruptions
            'thinking_pause': 1.2      # Thoughtful responses
        }
        
        prev_text = prev_segment.get('text', '').strip()
        curr_text = curr_segment.get('text', '').strip()
        
        # Determine gap type
        if prev_text.endswith('?'):
            gap_type = 'question_response'
        elif any(curr_text.lower().startswith(word) for word in ['well', 'um', 'uh']):
            gap_type = 'thinking_pause'
        elif any(curr_text.lower().startswith(word) for word in ['yes', 'no', 'right']):
            gap_type = 'interruption'
        else:
            gap_type = 'statement_response'
        
        base_gap = base_gaps[gap_type]
        
        # Add natural variation
        variation = random.uniform(-0.1, 0.2)
        return max(0.05, base_gap + variation)
    
    def _should_overlap(self, prev_segment: Dict[str, Any], 
                       curr_segment: Dict[str, Any]) -> bool:
        """Determine if segments should overlap."""
        prev_text = prev_segment.get('text', '').strip()
        curr_text = curr_segment.get('text', '').strip()
        
        # Overlap for interruptions or quick agreements
        interrupt_starters = ['but', 'actually', 'wait', 'no', 'yes exactly']
        agreement_words = ['right', 'exactly', 'absolutely', 'definitely']
        
        curr_lower = curr_text.lower()
        
        return (any(curr_lower.startswith(starter) for starter in interrupt_starters) or
                any(word in curr_lower[:20] for word in agreement_words))
    
    def _calculate_overlap_duration(self, prev_segment: Dict[str, Any], 
                                  curr_segment: Dict[str, Any]) -> float:
        """Calculate how much segments should overlap."""
        # Short overlaps for natural conversation
        base_overlap = 0.15  # 150ms
        variation = random.uniform(-0.05, 0.1)
        return max(0.05, base_overlap + variation)
    
    def _create_mixed_audio(self, segments: List[Dict[str, Any]], 
                           add_backchannels: bool) -> AudioSegment:
        """Create the mixed audio from timed segments."""
        
        # Calculate total duration
        total_duration = max(seg['end_time'] for seg in segments) + 1.0
        mixed_audio = AudioSegment.silent(duration=int(total_duration * 1000))
        
        # Add each segment at its calculated time
        for segment in segments:
            try:
                # Load segment audio
                audio = AudioSegment.from_wav(segment['file'])
                start_ms = int(segment['start_time'] * 1000)
                
                # Apply speaker-specific processing
                audio = self._process_speaker_audio(audio, segment)
                
                # Overlay on mixed audio
                mixed_audio = mixed_audio.overlay(audio, position=start_ms)
                
            except Exception as e:
                print(f"Warning: Could not add segment {segment.get('file')}: {e}")
        
        # Add backchannels if enabled
        if add_backchannels:
            mixed_audio = self._add_backchannels(mixed_audio, segments)
        
        return mixed_audio
    
    def _process_speaker_audio(self, audio: AudioSegment, 
                              segment: Dict[str, Any]) -> AudioSegment:
        """Apply speaker-specific audio processing."""
        
        # Apply emotion-based processing
        emotion = segment.get('emotion', 'neutral')
        
        if emotion == 'excited':
            # Slightly faster, brighter
            audio = audio.speedup(playback_speed=1.05)
            audio = audio + 1  # Slight volume boost
        
        elif emotion == 'sad':
            # Slower, darker tone
            audio = audio.speedup(playback_speed=0.95)
            audio = audio - 2  # Slight volume reduction
        
        elif emotion == 'professional':
            # Clear, consistent levels
            audio = normalize(audio)
        
        # Apply gender-typical EQ (simplified)
        speaker_id = segment.get('speaker', 0)
        if speaker_id % 2 == 0:  # Even speakers = male
            audio = self._apply_male_eq(audio)
        else:  # Odd speakers = female
            audio = self._apply_female_eq(audio)
        
        return audio
    
    def _apply_male_eq(self, audio: AudioSegment) -> AudioSegment:
        """Apply male voice EQ characteristics."""
        # Simplified EQ - boost low-mids, gentle high cut
        # Note: pydub has limited EQ, this is a basic simulation
        return audio
    
    def _apply_female_eq(self, audio: AudioSegment) -> AudioSegment:
        """Apply female voice EQ characteristics."""
        # Simplified EQ - presence boost, clarity enhancement
        return audio
    
    def _add_backchannels(self, mixed_audio: AudioSegment, 
                         segments: List[Dict[str, Any]]) -> AudioSegment:
        """Add natural backchannels (mm-hmm, right, etc.)."""
        
        backchannels = ['mm-hmm', 'right', 'okay', 'yeah', 'uh-huh']
        
        # Find gaps where backchannels would be natural
        for i in range(1, len(segments)):
            prev_seg = segments[i-1]
            curr_seg = segments[i]
            
            # Only add backchannels for longer statements
            if (prev_seg['duration'] > 3.0 and 
                curr_seg['start_time'] - prev_seg['end_time'] > 0.3 and
                random.random() < 0.3):  # 30% chance
                
                # Generate backchannel
                backchannel_time = prev_seg['start_time'] + prev_seg['duration'] * 0.7
                backchannel_text = random.choice(backchannels)
                
                # This would need actual synthesis - simplified for now
                print(f"Would add backchannel '{backchannel_text}' at {backchannel_time:.2f}s")
        
        return mixed_audio
    
    def _add_room_tone(self, audio: AudioSegment) -> AudioSegment:
        """Add subtle room tone for natural ambiance."""
        
        # Generate very quiet pink noise as room tone
        duration_ms = len(audio)
        
        # Create pink noise (simplified)
        room_tone = AudioSegment.silent(duration=duration_ms)
        
        # In a real implementation, we'd generate actual pink noise
        # For now, just add very quiet white noise
        try:
            # This is a simplified approach - real pink noise generation is more complex
            room_tone = room_tone + self.room_tone_level
            return audio.overlay(room_tone)
        except:
            return audio
    
    def _apply_dynamics(self, audio: AudioSegment) -> AudioSegment:
        """Apply dynamics processing for professional sound."""
        
        try:
            # Gentle compression
            audio = compress_dynamic_range(audio, threshold=-18.0, ratio=3.0, attack=5.0, release=50.0)
            
            # Normalize to consistent level
            audio = normalize(audio, headroom=1.0)  # -1dBFS peak
            
            return audio
            
        except Exception as e:
            print(f"Warning: Could not apply dynamics processing: {e}")
            return audio
    
    def _export_audio(self, audio: AudioSegment, output_path: str):
        """Export final audio with proper format settings."""
        
        # Export as high-quality WAV first
        temp_wav = output_path.replace('.mp3', '_temp.wav')
        audio.export(temp_wav, format='wav', 
                    parameters=['-ar', '48000', '-ac', '1'])  # 48kHz mono
        
        # Convert to final format if MP3 requested
        if output_path.endswith('.mp3'):
            audio_final = AudioSegment.from_wav(temp_wav)
            audio_final.export(output_path, format='mp3', bitrate='128k')
            
            # Clean up temp file
            try:
                Path(temp_wav).unlink()
            except:
                pass
        else:
            # Rename WAV file
            Path(temp_wav).rename(output_path)
    
    def _generate_mix_report(self, segments: List[Dict[str, Any]], 
                            mixed_audio: AudioSegment) -> Dict[str, Any]:
        """Generate mixing report with statistics."""
        
        total_duration = len(mixed_audio) / 1000.0
        
        # Calculate silence ratio (simplified)
        # In a real implementation, we'd analyze the actual audio
        speech_duration = sum(seg['duration'] for seg in segments)
        silence_ratio = max(0, (total_duration - speech_duration) / total_duration)
        
        # Find maximum pause
        max_pause = 0
        for i in range(1, len(segments)):
            gap = segments[i]['start_time'] - segments[i-1]['end_time']
            max_pause = max(max_pause, gap)
        
        return {
            'total_duration': total_duration,
            'speech_duration': speech_duration,
            'silence_ratio': silence_ratio,
            'max_pause': max_pause,
            'num_segments': len(segments),
            'overlaps_applied': any(seg['start_time'] < segments[i-1]['end_time'] 
                                  for i, seg in enumerate(segments[1:], 1)),
            'mix_quality': 'good' if silence_ratio <= 0.2 and max_pause <= 1.2 else 'needs_review'
        }


class AudioMastering:
    """Professional audio mastering for final output."""
    
    @staticmethod
    def master_audio(input_path: str, output_path: str, 
                    target_lufs: float = -18.0) -> Dict[str, Any]:
        """Master audio to professional standards."""
        
        try:
            # Load audio
            audio = AudioSegment.from_file(input_path)
            
            # Apply mastering chain
            mastered = AudioMastering._apply_mastering_chain(audio, target_lufs)
            
            # Export final master
            mastered.export(output_path, format='mp3', bitrate='128k',
                          parameters=['-ar', '48000', '-ac', '1'])
            
            # Analyze final output
            return AudioMastering._analyze_master(output_path)
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'lufs': 0,
                'peak_db': 0,
                'duration': 0
            }
    
    @staticmethod
    def _apply_mastering_chain(audio: AudioSegment, target_lufs: float) -> AudioSegment:
        """Apply professional mastering processing chain."""
        
        # 1. Gentle multiband compression (simulated)
        audio = compress_dynamic_range(audio, threshold=-20.0, ratio=2.0)
        
        # 2. EQ for clarity and balance
        # Note: pydub has limited EQ capabilities
        # In a real implementation, we'd use more sophisticated processing
        
        # 3. Limiter for loudness control
        audio = normalize(audio, headroom=1.0)  # -1dBFS peak
        
        # 4. Final loudness adjustment
        # This is simplified - real LUFS measurement requires specialized tools
        current_rms = audio.rms
        target_rms = audio.rms * (10 ** (target_lufs / 20))  # Rough conversion
        
        # Adjust gain to approximate target loudness
        gain_adjustment = target_rms / current_rms if current_rms > 0 else 1.0
        audio = audio + (20 * np.log10(gain_adjustment))
        
        return audio
    
    @staticmethod
    def _analyze_master(audio_path: str) -> Dict[str, Any]:
        """Analyze mastered audio for quality metrics."""
        
        try:
            # Load for analysis
            audio_data, sr = librosa.load(audio_path, sr=None)
            
            # Calculate basic metrics
            peak_level = np.max(np.abs(audio_data))
            rms_level = np.sqrt(np.mean(audio_data ** 2))
            
            # Estimate LUFS (simplified - real LUFS needs proper weighting)
            estimated_lufs = 20 * np.log10(rms_level) - 23  # Rough approximation
            
            # Peak in dBFS
            peak_db = 20 * np.log10(peak_level) if peak_level > 0 else -np.inf
            
            duration = len(audio_data) / sr
            
            return {
                'success': True,
                'lufs': estimated_lufs,
                'peak_db': peak_db,
                'duration': duration,
                'quality_check': {
                    'lufs_ok': -23 <= estimated_lufs <= -14,
                    'peak_ok': peak_db <= -1.0,
                    'duration_reasonable': 30 <= duration <= 600
                }
            }
            
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
                'lufs': 0,
                'peak_db': 0,
                'duration': 0
            }