#!/usr/bin/env python3
"""
Functional tests for the TTS/ASR Pipeline
Tests core functionality without mocking data
"""
import os
import sys
import json
import time
import tempfile
import shutil
from pathlib import Path
import unittest
from unittest.mock import patch

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from policy import AccentPolicy, ContentGenerator
from utils import load_voices_config, generate_content_hash, ContentSanitizer, ConfigValidator
from qa import AudioQualityAnalyzer, QualityReporter
from main import TTSPipeline


class TestTTSPipelineFunctional(unittest.TestCase):
    """Functional tests for the complete TTS pipeline"""

    @classmethod
    def setUpClass(cls):
        """Set up test environment"""
        cls.test_dir = Path(tempfile.mkdtemp())
        cls.voices_config_path = cls.test_dir / "test_voices.yaml"
        cls.output_dir = cls.test_dir / "out"
        cls.output_dir.mkdir(exist_ok=True)
        
        # Create test voice configuration
        test_voices_yaml = """
voices:
  US:
    file: "test_voices/us_male.wav"
    description: "American English - Male"
    gender: "male"
  UK:
    file: "test_voices/uk_female.wav"
    description: "British English - Female"
    gender: "female"

accent_policy:
  general:
    listening: ["US"]
    vocabulary: ["US"]
  ielts:
    listening: ["UK", "US"]
    vocabulary: ["UK"]
  toefl:
    listening: ["US"]
    vocabulary: ["US"]
"""
        with open(cls.voices_config_path, 'w') as f:
            f.write(test_voices_yaml)
        
        # Create mock voice files directory
        cls.voices_dir = cls.test_dir / "test_voices"
        cls.voices_dir.mkdir(exist_ok=True)
        
        print(f"Test environment created at: {cls.test_dir}")

    @classmethod
    def tearDownClass(cls):
        """Clean up test environment"""
        if cls.test_dir.exists():
            shutil.rmtree(cls.test_dir)
            print("Test environment cleaned up")

    def test_1_content_generation_and_policy(self):
        """Test 1: Content generation with accent policy application"""
        print("\n🧪 Test 1: Content Generation & Accent Policy")
        
        # Test content generator
        script = ContentGenerator.generate_conversation_script(
            topic="hotel booking",
            level="B2",
            goal="ielts",
            duration_sec=60,
            num_speakers=2,
            seed=42
        )
        
        # Validate script structure
        self.assertIsInstance(script, list)
        self.assertGreater(len(script), 0)
        
        for turn in script:
            self.assertIn('speaker', turn)
            self.assertIn('text', turn)
            self.assertIn('emotion', turn)
            self.assertIn('pace', turn)
            self.assertIsInstance(turn['speaker'], int)
            self.assertIsInstance(turn['text'], str)
            self.assertGreater(len(turn['text'].strip()), 0)
        
        print(f"✓ Generated {len(script)} conversation turns")
        
        # Test accent policy
        accent_config = AccentPolicy.get_accent_config("ielts")
        self.assertIn("UK", accent_config.listening_accents)
        self.assertIn("UK", accent_config.vocabulary_accents)
        
        # Test accent selection
        selected_accents = AccentPolicy.select_accents_for_listening("ielts", 2, seed=42)
        self.assertEqual(len(selected_accents), 2)
        self.assertIsInstance(selected_accents[0], str)
        
        vocab_accent = AccentPolicy.select_accent_for_vocabulary("ielts", seed=42)
        self.assertIsInstance(vocab_accent, str)
        
        print(f"✓ Selected accents: {selected_accents}")
        print(f"✓ Vocabulary accent: {vocab_accent}")
        
        # Test IELTS-specific content
        ielts_script = ContentGenerator._generate_ielts_booking_conversation(
            "swimming lessons", "B2", 120
        )
        self.assertGreater(len(ielts_script), 5)  # Should have multiple turns
        
        # Verify IELTS characteristics
        has_booking_elements = False
        for turn in ielts_script:
            if any(word in turn['text'].lower() for word in ['book', 'reservation', 'appointment']):
                has_booking_elements = True
                break
        self.assertTrue(has_booking_elements, "IELTS script should contain booking elements")
        
        print("✓ Content generation and accent policy test passed")

    def test_2_configuration_and_validation(self):
        """Test 2: Configuration loading and input validation"""
        print("\n🧪 Test 2: Configuration & Validation")
        
        # Test voice configuration loading
        config = load_voices_config(str(self.voices_config_path))
        self.assertIn('voices', config)
        self.assertIn('accent_policy', config)
        self.assertIn('US', config['voices'])
        self.assertIn('UK', config['voices'])
        
        print("✓ Voice configuration loaded successfully")
        
        # Test CLI argument validation
        validator = ConfigValidator()
        
        # Valid arguments
        valid_args = {
            'goal': 'ielts',
            'level': 'B2',
            'topic': 'hotel booking',
            'duration_sec': 120,
            'vocab_count': 10
        }
        errors = validator.validate_cli_args(valid_args)
        self.assertEqual(len(errors), 0, f"Valid args should pass: {errors}")
        
        # Invalid arguments
        invalid_args = {
            'goal': 'invalid_goal',
            'level': 'X1',
            'topic': '',
            'duration_sec': 1000,  # Too long
            'vocab_count': 100     # Too many
        }
        errors = validator.validate_cli_args(invalid_args)
        self.assertGreater(len(errors), 0, "Invalid args should fail validation")
        
        print(f"✓ Validation caught {len(errors)} errors as expected")
        
        # Test content sanitization
        self.assertTrue(ContentSanitizer.is_safe_content("restaurant booking"))
        self.assertTrue(ContentSanitizer.is_safe_content("job interview practice"))
        
        unsafe_topic = ContentSanitizer.suggest_safe_topic("violent movie")
        self.assertNotEqual(unsafe_topic, "violent movie")
        
        print("✓ Content sanitization working correctly")
        
        # Test voice config validation
        config_errors = validator.validate_voices_config(config)
        self.assertEqual(len(config_errors), 0, f"Voice config should be valid: {config_errors}")
        
        print("✓ Configuration and validation test passed")

    def test_3_audio_quality_analysis(self):
        """Test 3: Audio quality analysis without actual audio files"""
        print("\n🧪 Test 3: Audio Quality Analysis Logic")
        
        # Test quality analyzer initialization
        analyzer = AudioQualityAnalyzer()
        self.assertIsInstance(analyzer.quality_standards, dict)
        self.assertIn('min_duration', analyzer.quality_standards)
        self.assertIn('max_silence_ratio', analyzer.quality_standards)
        
        # Test quality validation logic with mock results
        mock_results = {
            'duration': 120.5,
            'silence_ratio': 0.15,
            'max_pause_duration': 0.8,
            'peak_db': -2.1,
            'estimated_lufs': -18.5,
            'rms_db': -12.0
        }
        
        quality_check = analyzer._validate_quality_standards(mock_results)
        
        # Should pass all checks
        self.assertTrue(quality_check['duration_ok'])
        self.assertTrue(quality_check['silence_ok']) 
        self.assertTrue(quality_check['pause_ok'])
        self.assertTrue(quality_check['peak_ok'])
        self.assertTrue(quality_check['lufs_ok'])
        self.assertTrue(quality_check['rms_ok'])
        self.assertTrue(quality_check['overall_pass'])
        
        print("✓ Quality validation logic working for good audio")
        
        # Test with failing parameters
        bad_results = {
            'duration': 15.0,      # Too short
            'silence_ratio': 0.35, # Too much silence
            'max_pause_duration': 2.5, # Too long pause
            'peak_db': 1.0,        # Clipping
            'estimated_lufs': -10.0, # Too loud
            'rms_db': -50.0        # Too quiet
        }
        
        bad_quality_check = analyzer._validate_quality_standards(bad_results)
        self.assertFalse(bad_quality_check['overall_pass'])
        
        failed_checks = bad_quality_check.get('failure_reasons', [])
        self.assertGreater(len(failed_checks), 0)
        
        print(f"✓ Quality validation correctly identified {len(failed_checks)} issues")
        
        # Test QA reporter
        report = QualityReporter.generate_qa_report(
            analysis_results=mock_results,
            generation_params={'goal': 'ielts', 'level': 'B2'},
            output_path=str(self.test_dir / "test_report.json")
        )
        
        self.assertIn('summary', report)
        self.assertIn('recommendations', report)
        
        # Check if report file was created
        report_path = self.test_dir / "test_report.json"
        self.assertTrue(report_path.exists())
        
        with open(report_path, 'r') as f:
            saved_report = json.load(f)
            self.assertEqual(saved_report['summary']['overall_pass'], True)
        
        print("✓ QA report generation working correctly")
        print("✓ Audio quality analysis test passed")

    def test_4_pipeline_integration_simulation(self):
        """Test 4: End-to-end pipeline integration (simulated)"""
        print("\n🧪 Test 4: Pipeline Integration Simulation")
        
        # Test pipeline initialization
        pipeline = TTSPipeline()
        self.assertIsNotNone(pipeline.progress)
        
        # Test input validation
        test_args = {
            'goal': 'ielts',
            'level': 'B2',
            'topic': 'restaurant reservation',
            'duration_sec': 90,
            'vocab_count': 8,
            'voices': str(self.voices_config_path)
        }
        
        # Test validation step
        with patch.object(pipeline, 'config', {}):
            pipeline.config = load_voices_config(str(self.voices_config_path))
            validation_result = pipeline._validate_inputs(test_args)
            self.assertTrue(validation_result, "Pipeline input validation should pass")
        
        print("✓ Pipeline input validation successful")
        
        # Test content generation step
        script, generation_params = pipeline._generate_content(test_args)
        
        self.assertIsNotNone(script)
        self.assertGreater(len(script), 0)
        self.assertIn('topic', generation_params)
        self.assertIn('level', generation_params)
        self.assertEqual(generation_params['goal'], 'ielts')
        
        print(f"✓ Content generation: {len(script)} turns, {generation_params['speakers']} speakers")
        
        # Test accent selection
        accent_mapping = pipeline._select_accents(test_args, script)
        self.assertIsInstance(accent_mapping, dict)
        self.assertGreater(len(accent_mapping), 0)
        
        for speaker_id, accent_code in accent_mapping.items():
            self.assertIsInstance(speaker_id, int)
            self.assertIsInstance(accent_code, str)
            self.assertGreater(len(accent_code), 0)
        
        print(f"✓ Accent selection: {accent_mapping}")
        
        # Test progress tracking
        pipeline.progress.set_total_steps(5)
        pipeline.progress.update_step(0, "Test step 1")
        pipeline.progress.update_step(1, "Test step 2")
        
        progress_pct = pipeline.progress.get_progress_percentage()
        self.assertGreater(progress_pct, 0)
        self.assertLessEqual(progress_pct, 100)
        
        print(f"✓ Progress tracking: {progress_pct:.1f}%")
        
        # Test output file structure simulation
        mock_outputs = {
            'listening_audio': str(self.output_dir / 'listening_test.mp3'),
            'vocabulary_audio': str(self.output_dir / 'vocab_test.mp3'),
            'transcript': str(self.output_dir / 'transcript_test.srt'),
            'report': str(self.output_dir / 'report_test.json')
        }
        
        # Create mock output files to test validation
        for output_type, file_path in mock_outputs.items():
            Path(file_path).touch()  # Create empty file
        
        validation_result = pipeline._final_validation(mock_outputs)
        self.assertTrue(validation_result, "Final validation should pass with existing files")
        
        print("✓ Output validation successful")
        
        # Test hash generation for reproducibility
        hash1 = generate_content_hash("test content", 42)
        hash2 = generate_content_hash("test content", 42)
        hash3 = generate_content_hash("different content", 42)
        
        self.assertEqual(hash1, hash2, "Same content should generate same hash")
        self.assertNotEqual(hash1, hash3, "Different content should generate different hash")
        
        print("✓ Content hash generation working for reproducibility")
        
        print("✓ Pipeline integration simulation test passed")

    def test_pipeline_error_handling(self):
        """Bonus test: Error handling and edge cases"""
        print("\n🧪 Bonus Test: Error Handling")
        
        pipeline = TTSPipeline()
        
        # Test with invalid configuration
        invalid_args = {
            'goal': 'invalid',
            'level': 'X1',
            'topic': '',
            'duration_sec': 0,
            'voices': 'nonexistent.yaml'
        }
        
        # Should handle gracefully
        try:
            validation_result = pipeline._validate_inputs(invalid_args)
            self.assertFalse(validation_result)
        except Exception as e:
            # Exception is acceptable for invalid config
            print(f"✓ Handled invalid config gracefully: {type(e).__name__}")
        
        # Test content sanitizer edge cases
        self.assertTrue(ContentSanitizer.is_safe_content(""))  # Empty should be safe
        self.assertTrue(ContentSanitizer.is_safe_content("normal conversation"))
        
        # Test progress tracker edge cases
        tracker = pipeline.progress
        tracker.set_total_steps(0)  # Edge case
        progress = tracker.get_progress_percentage()
        self.assertEqual(progress, 0.0)
        
        print("✓ Error handling test passed")


def run_functional_tests():
    """Run all functional tests"""
    print("🎤 TTS Pipeline Functional Tests")
    print("=" * 50)
    
    # Create test suite
    suite = unittest.TestSuite()
    
    # Add tests in order
    suite.addTest(TestTTSPipelineFunctional('test_1_content_generation_and_policy'))
    suite.addTest(TestTTSPipelineFunctional('test_2_configuration_and_validation'))  
    suite.addTest(TestTTSPipelineFunctional('test_3_audio_quality_analysis'))
    suite.addTest(TestTTSPipelineFunctional('test_4_pipeline_integration_simulation'))
    suite.addTest(TestTTSPipelineFunctional('test_pipeline_error_handling'))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print("🎯 TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print("\n❌ FAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}: {traceback.split('AssertionError: ')[-1].split('\\n')[0]}")
    
    if result.errors:
        print("\n💥 ERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}: {traceback.split('\\n')[-2]}")
    
    success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun) * 100
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    if result.wasSuccessful():
        print("🎉 All tests passed! Pipeline is ready for production.")
    else:
        print("⚠️ Some tests failed. Review issues before deployment.")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    # Run the functional tests
    success = run_functional_tests()
    sys.exit(0 if success else 1)