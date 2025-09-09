"""
Pyttsx3 Provider - Offline TTS for Iranian production deployment
Basic quality but completely self-hosted
"""
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
import asyncio
import tempfile

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class Pyttsx3Provider(TTSProvider):
    """Pyttsx3 provider - fully offline TTS"""
    
    def __init__(self):
        self.engine = None
        super().__init__(TTSEngine.PYTTSX3)
        
    def _check_availability(self):
        """Check if pyttsx3 is available"""
        try:
            import pyttsx3
            self.pyttsx3_engine = pyttsx3.init()
            self.is_available = True
            logger.info("✅ Pyttsx3 available (Fully offline)")
            
            # Configure engine properties
            self.pyttsx3_engine.setProperty('rate', 150)  # Speaking rate
            self.pyttsx3_engine.setProperty('volume', 0.8)  # Volume level
            
        except Exception as e:
            logger.warning(f"❌ Pyttsx3 not available: {e}")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using pyttsx3"""
        if not self.is_available:
            raise RuntimeError("Pyttsx3 not available")
            
        # Run synthesis in thread pool since pyttsx3 is synchronous
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._synthesize_sync, text, output_file, voice, kwargs)
        
    def _synthesize_sync(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any]):
        """Synchronous synthesis for pyttsx3"""
        try:
            # Set voice if specified
            if voice:
                voices = self.pyttsx3_engine.getProperty('voices')
                for v in voices:
                    if voice.lower() in v.id.lower():
                        self.pyttsx3_engine.setProperty('voice', v.id)
                        break
            else:
                # Try to set a British or female voice if available
                voices = self.pyttsx3_engine.getProperty('voices')
                british_voice = None
                female_voice = None
                
                for v in voices:
                    voice_id = v.id.lower()
                    if 'british' in voice_id or 'en-gb' in voice_id:
                        british_voice = v.id
                        break
                    elif 'female' in voice_id or 'woman' in voice_id:
                        female_voice = v.id
                        
                if british_voice:
                    self.pyttsx3_engine.setProperty('voice', british_voice)
                elif female_voice:
                    self.pyttsx3_engine.setProperty('voice', female_voice)
                    
            # Adjust speech rate based on speaker type
            speaker_type = kwargs.get('speaker_type', '')
            if 'receptionist' in speaker_type.lower():
                self.pyttsx3_engine.setProperty('rate', 160)  # Slightly faster, professional
            elif 'customer' in speaker_type.lower():
                self.pyttsx3_engine.setProperty('rate', 140)  # Slower, more hesitant
                
            # Create output directory
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Save to file
            self.pyttsx3_engine.save_to_file(text, str(output_file))
            self.pyttsx3_engine.runAndWait()
            
            return {
                'success': True,
                'output_file': str(output_file),
                'voice_used': voice or 'default',
                'quality': TTSQuality.BASIC.value,
                'engine': 'pyttsx3',
                'note': 'Fully offline - suitable for Iranian production'
            }
            
        except Exception as e:
            logger.error(f"❌ Pyttsx3 synthesis failed: {e}")
            raise e
            
    def get_available_voices(self) -> List[str]:
        """Get available system voices"""
        if not self.is_available:
            return []
            
        try:
            voices = self.pyttsx3_engine.getProperty('voices')
            return [v.id for v in voices] if voices else ['default']
        except:
            return ['default']
            
    def get_quality_level(self) -> TTSQuality:
        return TTSQuality.BASIC
        
    @property
    def is_offline(self) -> bool:
        return True
        
    @property
    def supports_british_english(self) -> bool:
        # Check if any British voices are available
        if not self.is_available:
            return False
            
        try:
            voices = self.pyttsx3_engine.getProperty('voices')
            if not voices:
                return False
                
            for voice in voices:
                voice_id = voice.id.lower()
                if 'british' in voice_id or 'en-gb' in voice_id or 'uk' in voice_id:
                    return True
            return False
        except:
            return False