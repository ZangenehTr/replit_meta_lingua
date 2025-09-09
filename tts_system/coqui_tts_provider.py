"""
Coqui TTS Provider - High quality offline text-to-speech
Perfect for Iranian deployment - fully offline, professional quality
"""
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
import tempfile
import os

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class CoquiTTSProvider(TTSProvider):
    """Coqui TTS provider - high quality offline synthesis"""
    
    def __init__(self):
        self.tts = None
        super().__init__(TTSEngine.COQUI_TTS)
        
    def _check_availability(self):
        """Check if Coqui TTS is available"""
        try:
            from TTS.api import TTS
            
            # Get available models
            available_models = TTS.list_models()
            
            # Look for good English models
            english_models = [m for m in available_models if 'en' in m.lower() and 'tts' in m.lower()]
            
            if english_models:
                # Use a high-quality English model
                model_name = None
                
                # Prefer VITS models for quality
                for model in english_models:
                    if 'vits' in model.lower() and ('ljspeech' in model.lower() or 'vctk' in model.lower()):
                        model_name = model
                        break
                
                # Fallback to any available English model
                if not model_name and english_models:
                    model_name = english_models[0]
                
                if model_name:
                    self.tts = TTS(model_name=model_name)
                    self.model_name = model_name
                    self.is_available = True
                    logger.info(f"✅ Coqui TTS available with model: {model_name}")
                    logger.info("✅ Fully offline - perfect for Iranian deployment")
                else:
                    logger.warning("❌ No suitable English models found")
                    self.is_available = False
            else:
                logger.warning("❌ No English TTS models available")
                self.is_available = False
                
        except ImportError:
            logger.warning("❌ Coqui TTS not available - install with: pip install TTS")
            self.is_available = False
        except Exception as e:
            logger.warning(f"❌ Coqui TTS initialization failed: {e}")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using Coqui TTS"""
        if not self.is_available:
            raise RuntimeError("Coqui TTS not available")
            
        try:
            # Ensure output directory exists
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # For multi-speaker models, try to use a female voice
            synthesis_kwargs = {}
            
            # Check if model supports speaker selection
            if hasattr(self.tts, 'speakers') and self.tts.speakers:
                # Look for female speakers
                female_speakers = []
                if isinstance(self.tts.speakers, list):
                    female_speakers = [s for s in self.tts.speakers if any(
                        female_term in str(s).lower() 
                        for female_term in ['female', 'woman', 'lady', 'girl', 'f_', 'linda', 'mary', 'sarah', 'emma']
                    )]
                
                if female_speakers:
                    synthesis_kwargs['speaker'] = female_speakers[0]
                    logger.info(f"Using female speaker: {female_speakers[0]}")
                elif self.tts.speakers:
                    # Use first available speaker
                    synthesis_kwargs['speaker'] = self.tts.speakers[0]
                    logger.info(f"Using speaker: {self.tts.speakers[0]}")
            
            # Run synthesis in thread to avoid blocking
            def synthesize():
                return self.tts.tts(
                    text=text,
                    file_path=str(output_file),
                    **synthesis_kwargs
                )
            
            # Execute in thread pool
            loop = asyncio.get_event_loop()
            await loop.run_in_executor(None, synthesize)
            
            # Verify file was created
            if not output_file.exists():
                raise RuntimeError("Audio file was not created")
                
            file_size = output_file.stat().st_size
            if file_size == 0:
                raise RuntimeError("Generated audio file is empty")
            
            return {
                'success': True,
                'output_file': str(output_file),
                'voice_used': synthesis_kwargs.get('speaker', 'default'),
                'quality': TTSQuality.PROFESSIONAL.value,
                'engine': 'coqui_tts',
                'model': self.model_name,
                'file_size': file_size,
                'note': 'High-quality offline synthesis - perfect for Iranian deployment',
                'is_offline': True
            }
            
        except Exception as e:
            logger.error(f"Coqui TTS synthesis failed: {e}")
            return {
                'success': False,
                'error': f"Coqui TTS synthesis failed: {e}",
                'engine': 'coqui_tts'
            }
    
    def get_voices(self) -> List[str]:
        """Get available voices"""
        if not self.is_available or not self.tts:
            return []
            
        if hasattr(self.tts, 'speakers') and self.tts.speakers:
            return list(self.tts.speakers)
        return ['default']
    
    def get_info(self) -> Dict[str, Any]:
        """Get provider information"""
        info = super().get_info()
        
        if self.is_available:
            info.update({
                'model': getattr(self, 'model_name', 'unknown'),
                'voices': self.get_voices(),
                'offline_capable': True,
                'iranian_compliant': True,
                'quality_level': 'Professional',
                'recommended_use': 'Production deployment in Iran'
            })
        
        return info