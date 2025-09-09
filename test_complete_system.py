#!/usr/bin/env python3
"""
Complete System Testing Script
Tests all TTS functionality and verifies deployment readiness
"""
import asyncio
import requests
import json
from pathlib import Path
import logging
import sys
import tempfile
import subprocess

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Add tts_system to path
sys.path.append(str(Path(__file__).parent))

from tts_system.tts_interface import TTSManager, TTSEngine
from tts_system.ielts_generator import IELTSAudioGenerator


class SystemTester:
    """Complete system tester"""
    
    def __init__(self):
        self.passed_tests = 0
        self.failed_tests = 0
        self.warnings = []
        
    def log_test(self, test_name: str, passed: bool, message: str = ""):
        """Log test result"""
        if passed:
            print(f"✅ {test_name}")
            self.passed_tests += 1
        else:
            print(f"❌ {test_name}: {message}")
            self.failed_tests += 1
            
    def log_warning(self, message: str):
        """Log warning"""
        print(f"⚠️  {message}")
        self.warnings.append(message)
        
    async def test_tts_engines(self):
        """Test all TTS engines"""
        print("\n🎤 Testing TTS Engines...")
        
        tts_manager = TTSManager()
        engine_info = tts_manager.get_engine_info()
        
        # Test engine availability
        available_engines = [e['name'] for e in engine_info['available_engines']]
        self.log_test("TTS Manager initialized", len(available_engines) > 0)
        
        # Test offline engines (critical for Iranian deployment)
        offline_engines = engine_info['offline_engines']
        self.log_test("Offline engines available", len(offline_engines) > 0, 
                     f"Found: {offline_engines}")
        
        if 'pyttsx3' in offline_engines:
            self.log_test("pyttsx3 (offline) available", True)
        else:
            self.log_test("pyttsx3 (offline) available", False, "Critical for Iranian deployment")
            
        # Test online engines (for development)
        if 'edge_tts' in available_engines:
            self.log_test("edge_tts (online) available", True)
        else:
            self.log_warning("edge_tts not available - development quality will be limited")
            
        return tts_manager
        
    async def test_audio_synthesis(self, tts_manager):
        """Test audio synthesis"""
        print("\n🔊 Testing Audio Synthesis...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            test_text = "This is a test of the TTS system."
            
            # Test offline synthesis (critical for Iran)
            if TTSEngine.PYTTSX3 in tts_manager.providers:
                try:
                    output_file = Path(temp_dir) / "test_offline.wav"
                    result = await tts_manager.synthesize(
                        text=test_text,
                        output_file=output_file,
                        engine=TTSEngine.PYTTSX3
                    )
                    
                    success = output_file.exists() and output_file.stat().st_size > 0
                    self.log_test("Offline synthesis (pyttsx3)", success)
                    
                except Exception as e:
                    self.log_test("Offline synthesis (pyttsx3)", False, str(e))
                    
            # Test online synthesis (for development quality)
            if TTSEngine.EDGE_TTS in tts_manager.providers:
                try:
                    output_file = Path(temp_dir) / "test_online.wav"
                    result = await tts_manager.synthesize(
                        text=test_text,
                        output_file=output_file,
                        engine=TTSEngine.EDGE_TTS
                    )
                    
                    success = output_file.exists() and output_file.stat().st_size > 0
                    self.log_test("Online synthesis (edge_tts)", success)
                    
                except Exception as e:
                    self.log_test("Online synthesis (edge_tts)", False, str(e))
                    
    async def test_ielts_generation(self):
        """Test IELTS audio generation"""
        print("\n🎧 Testing IELTS Generation...")
        
        with tempfile.TemporaryDirectory() as temp_dir:
            generator = IELTSAudioGenerator(output_dir=temp_dir)
            
            try:
                # Test offline generation (Iranian production)
                metadata = await generator.generate_section1_conversation(
                    use_offline_only=True
                )
                
                success = (
                    metadata['total_segments'] > 0 and
                    metadata['successful_segments'] > 0 and
                    metadata['is_offline_compatible']
                )
                self.log_test("IELTS offline generation", success, 
                             f"Generated {metadata['successful_segments']}/{metadata['total_segments']} segments")
                
                # Check HTML player was created
                html_file = Path(metadata['html_player'])
                self.log_test("HTML player created", html_file.exists())
                
                # Check audio files exist
                audio_files = list(Path(temp_dir).glob("*.wav"))
                self.log_test(f"Audio files generated", len(audio_files) > 0,
                             f"Found {len(audio_files)} files")
                
            except Exception as e:
                self.log_test("IELTS offline generation", False, str(e))
                
    def test_file_existence(self):
        """Test that generated files exist"""
        print("\n📁 Testing Generated Files...")
        
        files_to_check = [
            "ielts_swimming_lesson_offline.html",
            "ielts_swimming_lesson_online.html", 
            "ielts_audio_final/metadata.json",
            "ielts_audio_online/metadata.json"
        ]
        
        for file_path in files_to_check:
            path = Path(file_path)
            self.log_test(f"File exists: {file_path}", path.exists())
            
        # Check audio files
        offline_audio = list(Path("ielts_audio_final").glob("*.wav"))
        online_audio = list(Path("ielts_audio_online").glob("*.wav"))
        
        self.log_test("Offline audio files", len(offline_audio) > 0,
                     f"Found {len(offline_audio)} files")
        self.log_test("Online audio files", len(online_audio) > 0, 
                     f"Found {len(online_audio)} files")
                     
    def test_server_routes(self):
        """Test server routes and external access"""
        print("\n🌐 Testing Server Routes...")
        
        base_url = "http://localhost:5000"
        
        routes_to_test = [
            "/ielts_swimming_lesson_offline.html",
            "/ielts_swimming_lesson_online.html",
            "/ielts_audio_final/metadata.json",
            "/ielts_audio_online/metadata.json"
        ]
        
        for route in routes_to_test:
            try:
                response = requests.get(f"{base_url}{route}", timeout=10)
                success = response.status_code == 200
                self.log_test(f"Route accessible: {route}", success,
                             f"Status: {response.status_code}")
            except Exception as e:
                self.log_test(f"Route accessible: {route}", False, str(e))
                
    def test_iranian_deployment_readiness(self):
        """Test Iranian deployment readiness"""
        print("\n🇮🇷 Testing Iranian Deployment Readiness...")
        
        # Check offline capability
        offline_metadata_file = Path("ielts_audio_final/metadata.json")
        if offline_metadata_file.exists():
            with open(offline_metadata_file) as f:
                metadata = json.load(f)
                
            is_offline = metadata.get('is_offline_compatible', False)
            engine_used = metadata.get('engine_used', '')
            
            self.log_test("Offline compatible", is_offline)
            self.log_test("Uses offline engine", engine_used in ['pyttsx3', 'system'])
            
        else:
            self.log_test("Offline metadata exists", False)
            
        # Check HTML contains Iranian indicators
        offline_html = Path("ielts_swimming_lesson_offline.html")
        if offline_html.exists():
            content = offline_html.read_text(encoding='utf-8')
            has_iranian_indicators = (
                'Iranian Production Ready' in content and
                'Fully Offline' in content
            )
            self.log_test("HTML shows Iranian readiness", has_iranian_indicators)
        else:
            self.log_test("Offline HTML exists", False)
            
    def test_audio_quality(self):
        """Test audio quality"""
        print("\n🔉 Testing Audio Quality...")
        
        # Check file sizes (basic quality indicator)
        offline_files = list(Path("ielts_audio_final").glob("*.wav"))
        online_files = list(Path("ielts_audio_online").glob("*.wav"))
        
        if offline_files:
            avg_size_offline = sum(f.stat().st_size for f in offline_files) / len(offline_files)
            self.log_test("Offline audio files have reasonable size", avg_size_offline > 50000,
                         f"Average size: {avg_size_offline:,.0f} bytes")
        
        if online_files:
            avg_size_online = sum(f.stat().st_size for f in online_files) / len(online_files)
            self.log_test("Online audio files have reasonable size", avg_size_online > 50000,
                         f"Average size: {avg_size_online:,.0f} bytes")
            
        # Online should generally be higher quality (larger files)
        if offline_files and online_files:
            avg_offline = sum(f.stat().st_size for f in offline_files) / len(offline_files)
            avg_online = sum(f.stat().st_size for f in online_files) / len(online_files)
            
            if avg_online > avg_offline:
                self.log_test("Online quality higher than offline", True,
                             f"Online: {avg_online:,.0f}B vs Offline: {avg_offline:,.0f}B")
            else:
                self.log_warning("Online files not significantly larger than offline")
                
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🧪 SYSTEM TEST SUMMARY")
        print("=" * 60)
        
        total_tests = self.passed_tests + self.failed_tests
        pass_rate = (self.passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"📊 Tests Run: {total_tests}")
        print(f"✅ Passed: {self.passed_tests}")
        print(f"❌ Failed: {self.failed_tests}")
        print(f"📈 Pass Rate: {pass_rate:.1f}%")
        
        if self.warnings:
            print(f"\n⚠️  Warnings ({len(self.warnings)}):")
            for warning in self.warnings:
                print(f"   • {warning}")
                
        print("\n🇮🇷 Iranian Deployment Status:")
        if self.failed_tests == 0:
            print("   ✅ All tests passed - System ready for deployment")
        elif 'offline' in ' '.join(self.warnings).lower():
            print("   ⚠️  Some offline functionality issues - Check deployment readiness")
        else:
            print("   ❌ Critical issues found - Not ready for deployment")
            
        print("\n🌐 External Access:")
        print("   🔗 Offline IELTS: /ielts_swimming_lesson_offline.html")
        print("   🔗 Online IELTS: /ielts_swimming_lesson_online.html")
        
        return self.failed_tests == 0


async def main():
    """Main test function"""
    print("🧪 Complete System Testing")
    print("=" * 60)
    
    tester = SystemTester()
    
    # Run all tests
    tts_manager = await tester.test_tts_engines()
    await tester.test_audio_synthesis(tts_manager)
    await tester.test_ielts_generation()
    tester.test_file_existence()
    tester.test_server_routes()
    tester.test_iranian_deployment_readiness()
    tester.test_audio_quality()
    
    # Print summary
    success = tester.print_summary()
    
    return 0 if success else 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Testing interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Testing failed: {e}")
        sys.exit(1)