"""
Text-to-speech synthesis using Coqui XTTS-v2 with accent cloning.
"""
import os
import torch
import numpy as np
from typing import Dict, List, Any, Optional, Tuple
import librosa
import soundfile as sf
from pathlib import Path

try:
    from TTS.api import TTS
    from TTS.tts.configs.xtts_config import XttsConfig
    from TTS.tts.models.xtts import Xtts
except ImportError as e:
    print(f"Warning: TTS library not available: {e}")
    print("Please install with: pip install TTS==0.22.0")


class VoiceCloner:
    """Handles voice cloning and accent-specific synthesis."""
    
    def __init__(self, model_name: str = "tts_models/multilingual/multi-dataset/xtts_v2", device: str = None):
        self.model_name = model_name
        self.device = device or ("cuda" if torch.cuda.is_available() else "cpu")
        self.tts_model = None
        self.voice_cache = {}  # Cache loaded reference voices
        
        print(f"Initializing TTS on device: {self.device}")
        self._load_model()
    
    def _load_model(self):
        """Load the XTTS-v2 model."""
        try:
            self.tts_model = TTS(self.model_name).to(self.device)
            print(f"✓ Loaded TTS model: {self.model_name}")
        except Exception as e:
            print(f"✗ Failed to load TTS model: {e}")
            print("Falling back to CPU mode...")
            try:
                self.device = "cpu"
                self.tts_model = TTS(self.model_name).to(self.device)
                print("✓ Loaded TTS model on CPU")
            except Exception as e2:
                print(f"✗ Failed to load TTS model on CPU: {e2}")
                self.tts_model = None
    
    def load_reference_voice(self, voice_path: str, accent_code: str) -> bool:
        """Load and cache a reference voice file."""
        if not os.path.exists(voice_path):
            print(f"Warning: Voice file not found: {voice_path}")
            return False
        
        try:
            # Load audio file
            audio, sr = librosa.load(voice_path, sr=22050)
            
            # Ensure audio is between 10-30 seconds
            if len(audio) < 10 * sr:
                print(f"Warning: Voice sample too short ({len(audio)/sr:.1f}s): {voice_path}")
                return False
            elif len(audio) > 30 * sr:
                audio = audio[:30 * sr]  # Truncate to 30 seconds
            
            self.voice_cache[accent_code] = {
                'audio': audio,
                'sample_rate': sr,
                'path': voice_path
            }
            
            print(f"✓ Loaded reference voice for {accent_code}: {voice_path}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to load voice {accent_code}: {e}")
            return False
    
    def synthesize_with_accent(self, text: str, accent_code: str, output_path: str, 
                             emotion: str = "neutral", speed: float = 1.0) -> bool:
        """Synthesize speech with specific accent."""
        if self.tts_model is None:
            print("✗ TTS model not available")
            return False
        
        if accent_code not in self.voice_cache:
            print(f"✗ Reference voice for {accent_code} not loaded")
            return False
        
        try:
            # Get reference voice
            ref_voice = self.voice_cache[accent_code]
            
            # Adjust text for natural speech
            processed_text = self._preprocess_text(text, emotion, speed)
            
            # Generate speech using XTTS voice cloning
            if hasattr(self.tts_model, 'tts_with_vc'):
                # Use voice conversion method
                wav = self.tts_model.tts_with_vc(
                    text=processed_text,
                    speaker_wav=ref_voice['path'],
                    language="en"
                )
            else:
                # Use standard TTS with speaker reference  
                wav = self.tts_model.tts(
                    text=processed_text,
                    speaker_wav=ref_voice['path'],
                    language="en",
                    file_path=None  # Return audio array
                )
            
            # Apply speed adjustment if needed
            if speed != 1.0:
                wav = self._adjust_speech_rate(wav, speed)
            
            # Save to file
            sf.write(output_path, wav, 22050)
            print(f"✓ Synthesized audio with {accent_code} accent: {output_path}")
            return True
            
        except Exception as e:
            print(f"✗ Failed to synthesize with {accent_code}: {e}")
            return False
    
    def _preprocess_text(self, text: str, emotion: str, speed: float) -> str:
        """Preprocess text for more natural synthesis."""
        # Add emotional markers based on emotion
        if emotion == "excited":
            text = f"*excited* {text}"
        elif emotion == "sad":
            text = f"*sad* {text}"
        elif emotion == "professional":
            # Keep formal tone - no markers needed
            pass
        
        # Handle common abbreviations and numbers
        text = text.replace("Mr.", "Mister")
        text = text.replace("Mrs.", "Misses")
        text = text.replace("Dr.", "Doctor")
        text = text.replace("&", "and")
        
        # Handle phone numbers - spell them out naturally
        import re
        phone_pattern = r'\b\d{11}\b|\b\d{3}-\d{3}-\d{4}\b'
        phones = re.findall(phone_pattern, text)
        for phone in phones:
            # Convert phone number to spoken form
            digits = re.sub(r'[^\d]', '', phone)
            spoken_phone = ' '.join(digits)
            text = text.replace(phone, spoken_phone)
        
        return text
    
    def _adjust_speech_rate(self, audio: np.ndarray, speed: float) -> np.ndarray:
        """Adjust speech rate using time-stretching."""
        try:
            # Use librosa for time stretching
            stretched = librosa.effects.time_stretch(audio, rate=speed)
            return stretched
        except:
            # Fallback: simple resampling (less quality but works)
            from scipy import signal
            return signal.resample(audio, int(len(audio) / speed))
    
    def create_silence(self, duration_sec: float, sample_rate: int = 22050) -> np.ndarray:
        """Create silence audio array."""
        return np.zeros(int(duration_sec * sample_rate))
    
    def validate_synthesis_quality(self, audio_path: str) -> Dict[str, Any]:
        """Validate synthesized audio quality."""
        try:
            audio, sr = librosa.load(audio_path)
            
            # Check duration
            duration = len(audio) / sr
            
            # Check RMS energy (loudness)
            rms = librosa.feature.rms(y=audio)[0]
            avg_rms = np.mean(rms)
            
            # Check for silence (very low RMS values)
            silence_threshold = 0.01
            silence_frames = np.sum(rms < silence_threshold)
            silence_ratio = silence_frames / len(rms)
            
            # Check peak levels
            peak_level = np.max(np.abs(audio))
            
            return {
                'duration': duration,
                'avg_rms': float(avg_rms),
                'silence_ratio': float(silence_ratio),
                'peak_level': float(peak_level),
                'is_valid': duration > 1.0 and avg_rms > 0.005 and peak_level < 0.99
            }
            
        except Exception as e:
            return {
                'duration': 0,
                'avg_rms': 0,
                'silence_ratio': 1.0,
                'peak_level': 0,
                'is_valid': False,
                'error': str(e)
            }


class ConversationSynthesizer:
    """Synthesizes multi-speaker conversations with natural timing."""
    
    def __init__(self, voice_cloner: VoiceCloner):
        self.voice_cloner = voice_cloner
        self.temp_dir = Path("temp_audio")
        self.temp_dir.mkdir(exist_ok=True)
    
    def synthesize_conversation(self, script: List[Dict[str, Any]], 
                              accent_mapping: Dict[int, str],
                              output_path: str) -> bool:
        """Synthesize a complete conversation from script."""
        print(f"Synthesizing conversation with {len(script)} turns...")
        
        # Generate individual speaker segments
        segments = []
        for i, turn in enumerate(script):
            speaker_id = turn['speaker']
            accent = accent_mapping.get(speaker_id, 'US')
            
            # Create temporary file for this segment
            temp_file = self.temp_dir / f"segment_{i:03d}_{speaker_id}.wav"
            
            success = self.voice_cloner.synthesize_with_accent(
                text=turn['text'],
                accent_code=accent,
                output_path=str(temp_file),
                emotion=turn.get('emotion', 'neutral'),
                speed=turn.get('pace', 1.0)
            )
            
            if success:
                segments.append({
                    'file': str(temp_file),
                    'speaker': speaker_id,
                    'text': turn['text'],
                    'start_time': 0  # Will be calculated during mixing
                })
            else:
                print(f"✗ Failed to synthesize segment {i}")
                return False
        
        # Mix segments together with natural timing
        return self._mix_conversation_segments(segments, output_path)
    
    def _mix_conversation_segments(self, segments: List[Dict[str, Any]], 
                                 output_path: str) -> bool:
        """Mix conversation segments with natural pauses and overlaps."""
        try:
            from pydub import AudioSegment
            from pydub.effects import normalize
            
            # Load all segments
            audio_segments = []
            current_time = 0
            
            for i, segment in enumerate(segments):
                # Load segment audio
                audio = AudioSegment.from_wav(segment['file'])
                
                # Add natural pause before segment (except first)
                if i > 0:
                    pause_duration = self._calculate_natural_pause(
                        segments[i-1], segment
                    )
                    current_time += pause_duration
                
                # Update segment start time
                segment['start_time'] = current_time / 1000.0  # Convert to seconds
                
                # Add segment to timeline
                if i == 0:
                    mixed_audio = audio
                else:
                    # Add silence padding and append
                    silence = AudioSegment.silent(duration=int(pause_duration))
                    mixed_audio += silence + audio
                
                current_time += len(audio)
                audio_segments.append(segment)
            
            # Normalize final audio
            mixed_audio = normalize(mixed_audio)
            
            # Export final conversation
            mixed_audio.export(output_path, format="wav")
            print(f"✓ Mixed conversation saved: {output_path}")
            
            # Clean up temporary files
            self._cleanup_temp_files(segments)
            
            return True
            
        except Exception as e:
            print(f"✗ Failed to mix conversation: {e}")
            return False
    
    def _calculate_natural_pause(self, prev_segment: Dict[str, Any], 
                               curr_segment: Dict[str, Any]) -> float:
        """Calculate natural pause duration between segments."""
        # Base pause duration in milliseconds
        base_pause = 300  # 0.3 seconds
        
        # Adjust based on content
        prev_text = prev_segment.get('text', '').strip()
        curr_text = curr_segment.get('text', '').strip()
        
        # Longer pause after questions
        if prev_text.endswith('?'):
            base_pause += 200
        
        # Longer pause after statements
        elif prev_text.endswith('.') or prev_text.endswith('!'):
            base_pause += 150
        
        # Shorter pause for interruptions or quick responses
        quick_responses = ['yes', 'no', 'okay', 'right', 'sure', 'exactly']
        if any(curr_text.lower().startswith(resp) for resp in quick_responses):
            base_pause = max(100, base_pause - 100)
        
        # Add slight randomness for naturalness
        import random
        variation = random.randint(-50, 50)
        
        return max(100, base_pause + variation)  # Minimum 0.1 second pause
    
    def _cleanup_temp_files(self, segments: List[Dict[str, Any]]):
        """Clean up temporary audio files."""
        for segment in segments:
            try:
                os.remove(segment['file'])
            except:
                pass