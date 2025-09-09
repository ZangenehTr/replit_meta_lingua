"""
System TTS Provider - Uses system native TTS (espeak, festival, etc.)
Fully offline but very basic quality
"""
from pathlib import Path
from typing import Dict, Any, List, Optional
import logging
import asyncio
import subprocess
import shutil

from .tts_interface import TTSProvider, TTSEngine, TTSQuality

logger = logging.getLogger(__name__)


class SystemTTSProvider(TTSProvider):
    """System TTS provider using espeak or other system tools"""
    
    def __init__(self):
        self.available_tools = []
        super().__init__(TTSEngine.SYSTEM_TTS)
        
    def _check_availability(self):
        """Check if system TTS tools are available"""
        tools_to_check = ['espeak', 'espeak-ng', 'festival', 'flite']
        
        for tool in tools_to_check:
            if shutil.which(tool):
                self.available_tools.append(tool)
                logger.info(f"✅ Found system TTS: {tool}")
                
        if self.available_tools:
            self.is_available = True
            logger.info(f"✅ System TTS available with tools: {self.available_tools}")
        else:
            logger.warning("❌ No system TTS tools found")
            self.is_available = False
            
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize using system TTS"""
        if not self.is_available:
            raise RuntimeError("System TTS not available")
            
        # Run synthesis in thread pool
        loop = asyncio.get_event_loop()
        return await loop.run_in_executor(None, self._synthesize_sync, text, output_file, voice, kwargs)
        
    def _synthesize_sync(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any]):
        """Synchronous synthesis for system TTS"""
        try:
            # Create output directory
            output_file.parent.mkdir(parents=True, exist_ok=True)
            
            # Choose best available tool
            tool = self.available_tools[0]
            
            if tool in ['espeak', 'espeak-ng']:
                return self._synthesize_espeak(text, output_file, voice, kwargs, tool)
            elif tool == 'festival':
                return self._synthesize_festival(text, output_file, voice, kwargs)
            elif tool == 'flite':
                return self._synthesize_flite(text, output_file, voice, kwargs)
            else:
                raise RuntimeError(f"Unknown system TTS tool: {tool}")
                
        except Exception as e:
            logger.error(f"❌ System TTS synthesis failed: {e}")
            raise e
            
    def _synthesize_espeak(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any], tool: str):
        """Synthesize using espeak"""
        cmd = [tool, '-w', str(output_file)]
        
        # Try to use British accent
        cmd.extend(['-v', 'en-gb'])
        
        # Adjust speed based on speaker type
        speaker_type = kwargs.get('speaker_type', '')
        if 'receptionist' in speaker_type.lower():
            cmd.extend(['-s', '160'])  # Faster for professional
        else:
            cmd.extend(['-s', '140'])  # Slower for customer
            
        # Add text
        result = subprocess.run(cmd, input=text, text=True, capture_output=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Espeak failed: {result.stderr}")
            
        return {
            'success': True,
            'output_file': str(output_file),
            'voice_used': 'en-gb',
            'quality': TTSQuality.BASIC.value,
            'engine': f'system_{tool}',
            'note': 'Fully offline - suitable for Iranian production'
        }
        
    def _synthesize_festival(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any]):
        """Synthesize using festival"""
        cmd = ['festival', '--tts', '--output', str(output_file)]
        
        result = subprocess.run(cmd, input=text, text=True, capture_output=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Festival failed: {result.stderr}")
            
        return {
            'success': True,
            'output_file': str(output_file),
            'voice_used': 'default',
            'quality': TTSQuality.BASIC.value,
            'engine': 'system_festival',
            'note': 'Fully offline - suitable for Iranian production'
        }
        
    def _synthesize_flite(self, text: str, output_file: Path, voice: Optional[str], kwargs: Dict[str, Any]):
        """Synthesize using flite"""
        cmd = ['flite', '-o', str(output_file)]
        
        if voice:
            cmd.extend(['-voice', voice])
            
        result = subprocess.run(cmd, input=text, text=True, capture_output=True)
        
        if result.returncode != 0:
            raise RuntimeError(f"Flite failed: {result.stderr}")
            
        return {
            'success': True,
            'output_file': str(output_file),
            'voice_used': voice or 'default',
            'quality': TTSQuality.BASIC.value,
            'engine': 'system_flite',
            'note': 'Fully offline - suitable for Iranian production'
        }
        
    def get_available_voices(self) -> List[str]:
        """Get available system voices"""
        if not self.is_available:
            return []
            
        voices = []
        
        if 'espeak' in self.available_tools or 'espeak-ng' in self.available_tools:
            voices.extend(['en-gb', 'en-us', 'en-au'])
            
        if 'festival' in self.available_tools:
            voices.extend(['kal_diphone', 'ked_diphone'])
            
        if 'flite' in self.available_tools:
            voices.extend(['cmu_us_kal', 'cmu_us_awb'])
            
        return voices or ['default']
        
    def get_quality_level(self) -> TTSQuality:
        return TTSQuality.BASIC
        
    @property
    def is_offline(self) -> bool:
        return True
        
    @property
    def supports_british_english(self) -> bool:
        return 'espeak' in self.available_tools or 'espeak-ng' in self.available_tools