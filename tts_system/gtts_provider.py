"""
Google TTS Provider - Good quality but requires internet (not suitable for Iran)
"""
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
import asyncio

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class GTTSProvider(TTSProvider):
    """Google TTS provider - online only"""
    
    def __init__(self):
        self.gtts = None
        super().__init__(TTSEngine.GTTS)
        
    def _check_availability(self):
        """Check if gTTS is available"""
        try:
            from gtts import gTTS
            self.gtts = gTTS
            self.is_available = True
            logger.info("✅ gTTS available (WARNING: Online only)")
        except ImportError:
            logger.warning("❌ gTTS not available")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using gTTS"""
        if not self.is_available:
            raise RuntimeError("gTTS not available")
            
        # Run synthesis in thread pool since gTTS is synchronous
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._synthesize_sync, text, output_file, voice, kwargs)
        
    def _synthesize_sync(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any]):
        """Synchronous synthesis for gTTS"""
        try:
            # Use British English
            lang = 'en'
            tld = 'co.uk'  # British English
            
            tts = self.gtts(text=text, lang=lang, tld=tld, slow=False)
            
            # Create output directory
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Save audio
            tts.save(str(output_file))
            
            return {
                'success': True,
                'output_file': str(output_file),
                'voice_used': f'{lang}-{tld}',
                'quality': TTSQuality.STANDARD.value,
                'engine': 'gtts',
                'warning': 'Online only - not suitable for Iranian production'
            }
            
        except Exception as e:
            logger.error(f"❌ gTTS synthesis failed: {e}")
            raise e
            
    def get_available_voices(self) -> List[str]:
        """Get available gTTS language options"""
        return [
            'en-co.uk',    # British English
            'en-com.au',   # Australian English
            'en-com',      # Default English
        ]
        
    def get_quality_level(self) -> TTSQuality:
        return TTSQuality.STANDARD
        
    @property
    def is_offline(self) -> bool:
        return False
        
    @property
    def supports_british_english(self) -> bool:
        return True