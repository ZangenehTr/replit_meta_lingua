"""
Edge TTS Provider - High quality Microsoft voices for production use
Primary TTS engine for Iranian language institute deployment
"""
import asyncio
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class EdgeTTSProvider(TTSProvider):
    """Microsoft Edge TTS provider - high quality but requires internet"""
    
    def __init__(self):
        self.edge_tts = None
        super().__init__(TTSEngine.EDGE_TTS)
        
    def _check_availability(self):
        """Check if Edge TTS is available"""
        try:
            import edge_tts
            self.edge_tts = edge_tts
            self.is_available = True
            logger.info("✅ Edge TTS available - Production ready")
        except ImportError:
            logger.warning("❌ Edge TTS not available")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        rate: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using Edge TTS"""
        if not self.is_available:
            raise RuntimeError("Edge TTS not available")
            
        # Default to British voices
        if not voice:
            voice = "en-GB-SoniaNeural"  # Professional British female
            
        # Add SSML for better prosody if not present
        if not text.strip().startswith('<speak'):
            # Set default rate for IELTS listening (slower than normal)
            default_rate = rate or "-10%"  # Slower for IELTS listening comprehension
            
            if 'receptionist' in kwargs.get('speaker_type', '').lower():
                # Professional tone
                text = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
                    <prosody rate="{default_rate}" pitch="+2st">
                        <emphasis level="moderate">{text}</emphasis>
                    </prosody>
                </speak>'''
            elif 'customer' in kwargs.get('speaker_type', '').lower():
                # More casual tone  
                text = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
                    <prosody rate="{default_rate}" pitch="-1st">
                        {text}
                    </prosody>
                </speak>'''
            else:
                # Default IELTS monologue format - measured, clear pace
                text = f'''<speak version="1.0" xmlns="http://www.w3.org/2001/10/synthesis" xml:lang="en-GB">
                    <prosody rate="{default_rate}" pitch="+0st">
                        {text}
                    </prosody>
                </speak>'''
                
        communicate = self.edge_tts.Communicate(text, voice)
        await communicate.save(str(output_file))
        
        return {
            'success': True,
            'output_file': str(output_file),
            'voice_used': voice,
            'quality': TTSQuality.PROFESSIONAL.value,
            'engine': 'edge_tts',
            'deployment': 'Production ready for Iranian institutes'
        }
        
    def get_available_voices(self) -> List[str]:
        """Get British English voices"""
        return [
            "en-GB-SoniaNeural",     # Professional female
            "en-GB-RyanNeural",      # Male customer
            "en-GB-LibbyNeural",     # Alternative female
            "en-GB-MaisieNeural",    # Young female
            "en-GB-ThomasNeural"     # Alternative male
        ]
        
    def get_quality_level(self) -> TTSQuality:
        return TTSQuality.PROFESSIONAL
        
    @property
    def is_offline(self) -> bool:
        return False
        
    @property  
    def supports_british_english(self) -> bool:
        return True