"""
Bark TTS Provider - High quality neural voice synthesis (offline)
Suitable for Iranian production deployment with local AI processing
"""
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
import numpy as np
from scipy.io.wavfile import write as write_wav

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class BarkTTSProvider(TTSProvider):
    """Bark TTS provider - high quality neural synthesis, fully offline"""
    
    def __init__(self):
        self.bark = None
        self.sample_rate = None
        super().__init__(TTSEngine.BARK)
        
    def _check_availability(self):
        """Check if Bark TTS is available"""
        try:
            from bark import SAMPLE_RATE, generate_audio, preload_models
            self.bark = generate_audio
            self.sample_rate = SAMPLE_RATE
            
            # Preload models for faster generation
            preload_models()
            
            self.is_available = True
            logger.info("✅ Bark TTS available (Offline neural synthesis)")
        except ImportError:
            logger.warning("❌ Bark TTS not available - install with: pip install bark")
            self.is_available = False
        except Exception as e:
            logger.warning(f"❌ Bark TTS initialization failed: {e}")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using Bark TTS"""
        if not self.is_available:
            raise RuntimeError("Bark TTS not available")
            
        # Voice presets for different characters
        voice_presets = {
            'receptionist': 'v2/en_speaker_5',    # Professional female
            'customer': 'v2/en_speaker_4',        # Professional male  
            'narrator': 'v2/en_speaker_0',        # Neutral narrator
            'female': 'v2/en_speaker_1',          # Female voice
            'male': 'v2/en_speaker_2',            # Male voice
        }
        
        # Default to professional female voice
        if not voice:
            voice_preset = 'v2/en_speaker_1'
        else:
            voice_preset = voice_presets.get(voice, voice if voice.startswith('v2/') else 'v2/en_speaker_1')
            
        # Process text for better synthesis
        processed_text = self._preprocess_text(text, kwargs.get('speaker_type', ''))
        
        try:
            logger.info(f"Generating audio with Bark - Voice: {voice_preset}")
            
            # Generate audio with Bark (run in thread to avoid blocking)
            audio_array = await asyncio.to_thread(
                self.bark, 
                processed_text, 
                history_prompt=voice_preset
            )
            
            # Ensure audio is in correct format
            if audio_array.dtype != np.float32:
                audio_array = audio_array.astype(np.float32)
            
            # Normalize audio to prevent clipping
            audio_array = audio_array / np.max(np.abs(audio_array)) * 0.95
            
            # Convert to 16-bit for WAV file
            audio_int16 = (audio_array * 32767).astype(np.int16)
            
            # Save as WAV file
            write_wav(str(output_file), self.sample_rate, audio_int16)
            
            return {
                'success': True,
                'output_file': str(output_file),
                'voice_used': voice_preset,
                'quality': TTSQuality.HIGH.value,
                'engine': 'bark',
                'duration': len(audio_array) / (self.sample_rate or 24000),
                'sample_rate': self.sample_rate,
                'iranian_compliant': True,
                'offline': True
            }
            
        except Exception as e:
            logger.error(f"❌ Bark TTS synthesis failed: {e}")
            raise RuntimeError(f"Bark synthesis failed: {e}")
    
    def _preprocess_text(self, text: str, speaker_type: str = '') -> str:
        """Preprocess text for better Bark synthesis"""
        processed = text.strip()
        
        # Add pauses after punctuation for better flow
        processed = processed.replace('. ', '. [pause] ')
        processed = processed.replace('? ', '? [pause] ')
        processed = processed.replace('! ', '! [pause] ')
        
        # Handle different character styles
        if 'receptionist' in speaker_type.lower():
            # Professional, helpful tone
            if processed.startswith('Good'):
                processed = f"[professional] {processed} [/professional]"
        elif 'customer' in speaker_type.lower():
            # More casual, inquiring tone
            processed = f"[conversational] {processed} [/conversational]"
        
        return processed
        
    def get_available_voices(self) -> List[str]:
        """Get British English and neutral voices"""
        return [
            "receptionist",      # Professional female
            "customer",          # Professional male
            "narrator",          # Neutral narrator
            "female",            # Female voice
            "male",              # Male voice
            "v2/en_speaker_0",   # Neutral
            "v2/en_speaker_1",   # Female
            "v2/en_speaker_2",   # Male deep
            "v2/en_speaker_3",   # Female high
            "v2/en_speaker_4",   # Male professional
            "v2/en_speaker_5",   # Female professional
        ]
        
    def get_quality_level(self) -> TTSQuality:
        return TTSQuality.HIGH
        
    @property
    def is_offline(self) -> bool:
        return True
        
    @property  
    def supports_british_english(self) -> bool:
        return True  # Through neural voice modeling