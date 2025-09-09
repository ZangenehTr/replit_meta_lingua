"""
TTS Interface - Abstraction layer for different TTS engines
Supports both online (Edge TTS) and offline (pyttsx3) engines for Iranian deployment
"""
from abc import ABC, abstractmethod
from typing import List, Dict, Any, Optional
from enum import Enum
from pathlib import Path
import asyncio
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


class TTSEngine(Enum):
    """Available TTS engines"""
    EDGE_TTS = "edge_tts"          # High quality, online only
    BARK = "bark"                  # High quality neural, offline
    PYTTSX3 = "pyttsx3"            # Basic quality, fully offline  
    GTTS = "gtts"                  # Google TTS, online only
    SYSTEM_TTS = "system"          # System native TTS


class TTSQuality(Enum):
    """Audio quality levels"""
    BASIC = "basic"
    STANDARD = "standard" 
    HIGH = "high"
    PROFESSIONAL = "professional"


class TTSProvider(ABC):
    """Abstract base class for TTS providers"""
    
    def __init__(self, engine: TTSEngine):
        self.engine = engine
        self.is_available = False
        self._check_availability()
        
    @abstractmethod
    def _check_availability(self):
        """Check if this TTS engine is available"""
        pass
        
    @abstractmethod
    async def synthesize_async(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize text to audio asynchronously"""
        pass
    
    def synthesize(
        self, 
        text: str, 
        output_file: Path,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synchronous wrapper for synthesis"""
        return asyncio.run(self.synthesize_async(text, output_file, voice, **kwargs))
        
    @abstractmethod
    def get_available_voices(self) -> List[str]:
        """Get list of available voices"""
        pass
        
    @abstractmethod
    def get_quality_level(self) -> TTSQuality:
        """Get quality level of this engine"""
        pass
        
    @property
    @abstractmethod
    def is_offline(self) -> bool:
        """Whether this engine works offline"""
        pass
        
    @property
    @abstractmethod
    def supports_british_english(self) -> bool:
        """Whether this engine has British English voices"""
        pass


class TTSManager:
    """Main TTS manager that handles engine selection and fallbacks"""
    
    def __init__(self):
        self.providers: Dict[TTSEngine, TTSProvider] = {}
        self.preferred_engine = None
        self.fallback_engine = None
        self._initialize_providers()
        
    def _initialize_providers(self):
        """Initialize all available TTS providers"""
        logger.info("🎤 Initializing TTS Manager...")
        
        # Try to initialize all providers
        provider_classes = [
            EdgeTTSProvider,
            BarkTTSProvider,
            Pyttsx3Provider, 
            GTTSProvider,
            SystemTTSProvider
        ]
        
        for provider_class in provider_classes:
            try:
                provider = provider_class()
                if provider.is_available:
                    self.providers[provider.engine] = provider
                    logger.info(f"✅ {provider.engine.value} initialized")
                else:
                    logger.warning(f"⚠️ {provider.engine.value} not available")
            except Exception as e:
                logger.warning(f"❌ Failed to initialize {provider_class.__name__}: {e}")
        
        # Set preferred engines based on availability
        self._set_engine_preferences()
        
    def _set_engine_preferences(self):
        """Set preferred and fallback engines based on availability"""
        # New strategy: Edge TTS primary (Iranian accessible), Bark fallback
        
        if TTSEngine.EDGE_TTS in self.providers:
            self.preferred_engine = TTSEngine.EDGE_TTS
            logger.info("🎯 Preferred engine: Edge TTS (Iranian accessible, high quality)")
        elif TTSEngine.BARK in self.providers:
            self.preferred_engine = TTSEngine.BARK
            logger.info("🎯 Preferred engine: Bark (neural synthesis, offline)")
        elif TTSEngine.PYTTSX3 in self.providers:
            self.preferred_engine = TTSEngine.PYTTSX3
            logger.info("🎯 Preferred engine: pyttsx3 (basic offline)")
        else:
            self.preferred_engine = None
            logger.warning("❌ No preferred engine available")
            
        # Set fallback: Bark preferred, then pyttsx3
        for engine in [TTSEngine.BARK, TTSEngine.PYTTSX3, TTSEngine.GTTS, TTSEngine.SYSTEM_TTS]:
            if engine in self.providers and engine != self.preferred_engine:
                self.fallback_engine = engine
                logger.info(f"🔄 Fallback engine: {engine.value}")
                break
                
    async def synthesize(
        self,
        text: str,
        output_file: Path,
        engine: Optional[TTSEngine] = None,
        voice: Optional[str] = None,
        **kwargs
    ) -> Dict[str, Any]:
        """Synthesize text using specified or preferred engine"""
        
        # Determine which engine to use
        target_engine = engine or self.preferred_engine
        
        if not target_engine or target_engine not in self.providers:
            if self.fallback_engine:
                logger.warning(f"⚠️ Using fallback engine: {self.fallback_engine.value}")
                target_engine = self.fallback_engine
            else:
                raise RuntimeError("No TTS engines available")
                
        provider = self.providers[target_engine]
        
        try:
            result = await provider.synthesize_async(text, output_file, voice, **kwargs)
            result['engine_used'] = target_engine.value
            result['is_offline'] = provider.is_offline
            return result
            
        except Exception as e:
            logger.error(f"❌ Synthesis failed with {target_engine.value}: {e}")
            
            # Try fallback if available
            if self.fallback_engine and target_engine != self.fallback_engine:
                logger.info(f"🔄 Trying fallback: {self.fallback_engine.value}")
                fallback_provider = self.providers[self.fallback_engine]
                result = await fallback_provider.synthesize_async(text, output_file, voice, **kwargs)
                result['engine_used'] = self.fallback_engine.value
                result['is_offline'] = fallback_provider.is_offline
                result['used_fallback'] = True
                return result
            else:
                raise e
                
    def get_engine_info(self) -> Dict[str, Any]:
        """Get information about available engines"""
        info = {
            'available_engines': [],
            'preferred_engine': self.preferred_engine.value if self.preferred_engine else None,
            'fallback_engine': self.fallback_engine.value if self.fallback_engine else None,
            'offline_engines': [],
            'high_quality_engines': []
        }
        
        for engine, provider in self.providers.items():
            engine_info = {
                'name': engine.value,
                'quality': provider.get_quality_level().value,
                'is_offline': provider.is_offline,
                'supports_british': provider.supports_british_english,
                'voices': len(provider.get_available_voices())
            }
            info['available_engines'].append(engine_info)
            
            if provider.is_offline:
                info['offline_engines'].append(engine.value)
            if provider.get_quality_level() in [TTSQuality.HIGH, TTSQuality.PROFESSIONAL]:
                info['high_quality_engines'].append(engine.value)
                
        return info


# Import providers
from .edge_tts_provider import EdgeTTSProvider
from .bark_tts_provider import BarkTTSProvider
from .pyttsx3_provider import Pyttsx3Provider  
from .gtts_provider import GTTSProvider
from .system_tts_provider import SystemTTSProvider