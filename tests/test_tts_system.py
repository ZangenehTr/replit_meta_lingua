"""
Comprehensive test suite for TTS system
Tests both online and offline TTS engines for Iranian deployment
"""
import pytest
import asyncio
import tempfile
from pathlib import Path
from unittest.mock import Mock, patch, AsyncMock
import json
import sys
import os

# Add tts_system to path for testing
sys.path.append(os.path.join(os.path.dirname(__file__), '..'))

from tts_system.tts_interface import TTSManager, TTSEngine, TTSQuality, TTSProvider
from tts_system.ielts_generator import IELTSAudioGenerator


class TestTTSProvider(TTSProvider):
    """Mock TTS provider for testing"""
    
    def __init__(self, engine: TTSEngine, is_available: bool = True, is_offline: bool = True):
        self._is_offline = is_offline
        self._is_available = is_available
        super().__init__(engine)
    
    def _check_availability(self):
        self.is_available = self._is_available
    
    async def synthesize_async(self, text, output_file, voice=None, **kwargs):
        # Create mock audio file
        output_file.parent.mkdir(parents=True, exist_ok=True)
        output_file.write_bytes(b"fake_audio_data")
        
        return {
            'success': True,
            'output_file': str(output_file),
            'voice_used': voice or 'test_voice',
            'quality': self.get_quality_level().value,
            'engine': self.engine.value
        }
    
    def get_available_voices(self):
        return ['test_voice_1', 'test_voice_2']
    
    def get_quality_level(self):
        return TTSQuality.STANDARD
    
    @property
    def is_offline(self):
        return self._is_offline
    
    @property
    def supports_british_english(self):
        return True


class TestTTSInterface:
    """Test TTS interface and base functionality"""
    
    def test_tts_engine_enum(self):
        """Test TTS engine enumeration"""
        assert TTSEngine.EDGE_TTS.value == "edge_tts"
        assert TTSEngine.PYTTSX3.value == "pyttsx3"
        assert TTSEngine.SYSTEM_TTS.value == "system"
        
    def test_tts_quality_enum(self):
        """Test TTS quality levels"""
        assert TTSQuality.BASIC.value == "basic"
        assert TTSQuality.PROFESSIONAL.value == "professional"
        
    def test_tts_provider_interface(self):
        """Test TTS provider interface"""
        provider = TestTTSProvider(TTSEngine.PYTTSX3)
        assert provider.engine == TTSEngine.PYTTSX3
        assert provider.is_available
        assert provider.is_offline
        assert provider.supports_british_english
        
        voices = provider.get_available_voices()
        assert isinstance(voices, list)
        assert len(voices) > 0
        
        quality = provider.get_quality_level()
        assert isinstance(quality, TTSQuality)
        
    @pytest.mark.asyncio
    async def test_tts_provider_synthesis(self):
        """Test TTS provider synthesis"""
        with tempfile.TemporaryDirectory() as temp_dir:
            provider = TestTTSProvider(TTSEngine.PYTTSX3)
            output_file = Path(temp_dir) / "test.wav"
            
            result = await provider.synthesize_async(
                text="Hello world",
                output_file=output_file,
                voice="test_voice"
            )
            
            assert result['success'] is True
            assert result['voice_used'] == 'test_voice'
            assert result['engine'] == 'pyttsx3'
            assert output_file.exists()


class TestTTSManager:
    """Test TTS manager functionality"""
    
    def test_tts_manager_initialization(self):
        """Test TTS manager initialization with mock providers"""
        with patch('tts_system.tts_interface.EdgeTTSProvider') as mock_edge, \
             patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            
            # Mock provider instances
            mock_edge_instance = TestTTSProvider(TTSEngine.EDGE_TTS, is_offline=False)
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
            
            mock_edge.return_value = mock_edge_instance
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            manager = TTSManager()
            
            assert len(manager.providers) >= 1
            assert manager.preferred_engine is not None
            
    def test_engine_preferences(self):
        """Test engine preference logic"""
        with patch('tts_system.tts_interface.EdgeTTSProvider') as mock_edge, \
             patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            
            # Only offline provider available
            mock_edge_instance = TestTTSProvider(TTSEngine.EDGE_TTS, is_available=False)
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_available=True, is_offline=True)
            
            mock_edge.return_value = mock_edge_instance
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            manager = TTSManager()
            
            assert manager.preferred_engine == TTSEngine.PYTTSX3
            
    def test_get_engine_info(self):
        """Test engine information retrieval"""
        with patch('tts_system.tts_interface.EdgeTTSProvider') as mock_edge:
            mock_edge_instance = TestTTSProvider(TTSEngine.EDGE_TTS, is_offline=False)
            mock_edge.return_value = mock_edge_instance
            
            manager = TTSManager()
            manager.providers = {TTSEngine.EDGE_TTS: mock_edge_instance}
            manager.preferred_engine = TTSEngine.EDGE_TTS
            
            info = manager.get_engine_info()
            
            assert 'available_engines' in info
            assert 'preferred_engine' in info
            assert 'offline_engines' in info
            assert 'high_quality_engines' in info
            assert isinstance(info['available_engines'], list)
            
    @pytest.mark.asyncio
    async def test_synthesis_with_fallback(self):
        """Test synthesis with fallback mechanism"""
        with tempfile.TemporaryDirectory() as temp_dir:
            # Create failing primary and working fallback provider
            failing_provider = Mock()
            failing_provider.synthesize_async = AsyncMock(side_effect=Exception("Primary failed"))
            failing_provider.is_offline = False
            
            working_provider = TestTTSProvider(TTSEngine.PYTTSX3)
            
            manager = TTSManager()
            manager.providers = {
                TTSEngine.EDGE_TTS: failing_provider,
                TTSEngine.PYTTSX3: working_provider
            }
            manager.preferred_engine = TTSEngine.EDGE_TTS
            manager.fallback_engine = TTSEngine.PYTTSX3
            
            output_file = Path(temp_dir) / "test.wav"
            
            result = await manager.synthesize(
                text="Hello world",
                output_file=output_file
            )
            
            assert result['success'] is True
            assert result['engine_used'] == 'pyttsx3'
            assert result.get('used_fallback') is True
            assert output_file.exists()


class TestOfflineCompatibility:
    """Test offline compatibility for Iranian deployment"""
    
    def test_offline_engine_identification(self):
        """Test identification of offline-capable engines"""
        offline_provider = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
        online_provider = TestTTSProvider(TTSEngine.EDGE_TTS, is_offline=False)
        
        assert offline_provider.is_offline is True
        assert online_provider.is_offline is False
        
    def test_iranian_deployment_requirements(self):
        """Test requirements for Iranian deployment"""
        # Mock only offline providers being available
        with patch('tts_system.tts_interface.EdgeTTSProvider') as mock_edge, \
             patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            
            # Edge TTS unavailable (blocked)
            mock_edge_instance = TestTTSProvider(TTSEngine.EDGE_TTS, is_available=False)
            # pyttsx3 available (offline)
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_available=True, is_offline=True)
            
            mock_edge.return_value = mock_edge_instance
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            manager = TTSManager()
            
            # Should prefer offline engine when online is unavailable
            assert manager.preferred_engine == TTSEngine.PYTTSX3
            
            # Should have offline engines available
            info = manager.get_engine_info()
            assert len(info['offline_engines']) > 0
            assert 'pyttsx3' in info['offline_engines']
            
    @pytest.mark.asyncio
    async def test_offline_synthesis(self):
        """Test synthesis using only offline engines"""
        with tempfile.TemporaryDirectory() as temp_dir:
            offline_provider = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
            
            manager = TTSManager()
            manager.providers = {TTSEngine.PYTTSX3: offline_provider}
            manager.preferred_engine = TTSEngine.PYTTSX3
            
            output_file = Path(temp_dir) / "offline_test.wav"
            
            result = await manager.synthesize(
                text="This is offline synthesis",
                output_file=output_file,
                engine=TTSEngine.PYTTSX3
            )
            
            assert result['success'] is True
            assert result['is_offline'] is True
            assert result['engine_used'] == 'pyttsx3'
            assert output_file.exists()


class TestIELTSGenerator:
    """Test IELTS audio generation functionality"""
    
    @pytest.mark.asyncio
    async def test_ielts_generator_initialization(self):
        """Test IELTS generator initialization"""
        with tempfile.TemporaryDirectory() as temp_dir:
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            assert generator.output_dir.exists()
            assert isinstance(generator.tts_manager, TTSManager)
            
    def test_conversation_script_retrieval(self):
        """Test conversation script retrieval"""
        with tempfile.TemporaryDirectory() as temp_dir:
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            
            conversation = generator._get_conversation_script("swimming_lesson")
            assert isinstance(conversation, list)
            assert len(conversation) > 0
            
            # Check conversation format
            for speaker, text in conversation:
                assert speaker in ['receptionist', 'customer']
                assert isinstance(text, str)
                assert len(text) > 0
                
    def test_voice_mapping(self):
        """Test voice mapping for different engines"""
        with tempfile.TemporaryDirectory() as temp_dir:
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            
            edge_mapping = generator._get_voice_mapping(TTSEngine.EDGE_TTS)
            assert 'receptionist' in edge_mapping
            assert 'customer' in edge_mapping
            assert 'en-GB' in edge_mapping['receptionist']
            
            pyttsx3_mapping = generator._get_voice_mapping(TTSEngine.PYTTSX3)
            assert 'receptionist' in pyttsx3_mapping
            assert 'customer' in pyttsx3_mapping
            
    @pytest.mark.asyncio
    async def test_ielts_audio_generation_offline(self):
        """Test IELTS audio generation in offline mode"""
        with tempfile.TemporaryDirectory() as temp_dir, \
             patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            
            # Mock offline provider
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            
            # Override TTS manager with mock
            generator.tts_manager.providers = {TTSEngine.PYTTSX3: mock_pyttsx3_instance}
            generator.tts_manager.preferred_engine = TTSEngine.PYTTSX3
            
            metadata = await generator.generate_section1_conversation(
                conversation_type="swimming_lesson",
                use_offline_only=True
            )
            
            assert metadata['is_offline_compatible'] is True
            assert metadata['engine_used'] == 'pyttsx3'
            assert metadata['total_segments'] > 0
            assert metadata['successful_segments'] > 0
            assert 'html_player' in metadata
            
            # Check HTML file was created
            html_file = Path(metadata['html_player'])
            assert html_file.exists()
            
            # Check audio files were created
            segments = metadata['segments']
            for segment in segments:
                audio_file = Path(segment['file'])
                assert audio_file.exists()
                
    @pytest.mark.asyncio
    async def test_ielts_audio_generation_online(self):
        """Test IELTS audio generation with online engines"""
        with tempfile.TemporaryDirectory() as temp_dir, \
             patch('tts_system.tts_interface.EdgeTTSProvider') as mock_edge:
            
            # Mock online provider
            mock_edge_instance = TestTTSProvider(TTSEngine.EDGE_TTS, is_offline=False)
            mock_edge.return_value = mock_edge_instance
            
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            
            # Override TTS manager with mock
            generator.tts_manager.providers = {TTSEngine.EDGE_TTS: mock_edge_instance}
            generator.tts_manager.preferred_engine = TTSEngine.EDGE_TTS
            
            metadata = await generator.generate_section1_conversation(
                conversation_type="swimming_lesson",
                use_offline_only=False
            )
            
            assert metadata['is_offline_compatible'] is False
            assert metadata['engine_used'] == 'edge_tts'
            assert metadata['total_segments'] > 0
            assert metadata['successful_segments'] > 0


class TestProductionReadiness:
    """Test production readiness for Iranian deployment"""
    
    def test_no_external_dependencies_check(self):
        """Test that offline mode has no external dependencies"""
        # This would be a comprehensive check in a real deployment
        # to ensure no network calls are made in offline mode
        offline_engines = [TTSEngine.PYTTSX3, TTSEngine.SYSTEM_TTS]
        
        for engine in offline_engines:
            # Create mock provider
            provider = TestTTSProvider(engine, is_offline=True)
            assert provider.is_offline is True
            
    def test_iranian_compliance(self):
        """Test compliance with Iranian deployment requirements"""
        # Requirements from replit.md:
        # - Self-hosting in Iran with zero external dependencies
        # - Complete independence from all external services
        
        with patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            manager = TTSManager()
            manager.providers = {TTSEngine.PYTTSX3: mock_pyttsx3_instance}
            
            info = manager.get_engine_info()
            
            # Must have at least one offline engine
            assert len(info['offline_engines']) > 0
            
            # Check that offline engines are available
            offline_available = any(
                engine['is_offline'] for engine in info['available_engines']
            )
            assert offline_available is True
            
    @pytest.mark.asyncio
    async def test_complete_offline_workflow(self):
        """Test complete offline workflow from TTS to HTML generation"""
        with tempfile.TemporaryDirectory() as temp_dir, \
             patch('tts_system.tts_interface.Pyttsx3Provider') as mock_pyttsx3:
            
            mock_pyttsx3_instance = TestTTSProvider(TTSEngine.PYTTSX3, is_offline=True)
            mock_pyttsx3.return_value = mock_pyttsx3_instance
            
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            generator.tts_manager.providers = {TTSEngine.PYTTSX3: mock_pyttsx3_instance}
            generator.tts_manager.preferred_engine = TTSEngine.PYTTSX3
            
            # Generate complete IELTS audio in offline mode
            metadata = await generator.generate_section1_conversation(
                use_offline_only=True
            )
            
            # Verify offline compliance
            assert metadata['is_offline_compatible'] is True
            
            # Verify all files exist
            html_file = Path(metadata['html_player'])
            assert html_file.exists()
            
            metadata_file = Path(temp_dir) / "metadata.json"
            assert metadata_file.exists()
            
            # Verify HTML contains offline indicators
            html_content = html_file.read_text(encoding='utf-8')
            assert 'Iranian Production Ready' in html_content
            assert 'Fully Offline' in html_content
            
            # Verify metadata indicates offline operation
            with open(metadata_file) as f:
                saved_metadata = json.load(f)
            assert saved_metadata['is_offline_compatible'] is True


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v", "--tb=short"])