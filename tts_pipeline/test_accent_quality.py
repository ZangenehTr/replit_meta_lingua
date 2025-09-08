#!/usr/bin/env python3
"""
Accent Quality and Audio Processing Tests
Tests accent policy correctness and audio quality validation
"""
import unittest
import os
import sys
from unittest.mock import Mock, patch
import tempfile
import numpy as np
from pathlib import Path

# Add current directory to path
sys.path.insert(0, os.path.dirname(__file__))

from policy import AccentPolicy, ContentGenerator
from qa import AudioQualityAnalyzer, QualityReporter  
from mixing import ConversationMixer, AudioMastering
from utils import ContentSanitizer, load_cefr_vocabulary, estimate_speech_duration


class TestAccentPolicyCorrectness(unittest.TestCase):
    """Test accent policy implementation for different exam types"""
    
    def test_ielts_accent_policy(self):
        """Test IELTS accent requirements"""
        print("🧪 Testing IELTS Accent Policy")
        
        # IELTS should prioritize British English
        config = AccentPolicy.get_accent_config('ielts')
        self.assertIn('UK', config.listening_accents)
        self.assertIn('UK_FEMALE', config.listening_accents)
        
        # Test accent selection consistency
        accents_1 = AccentPolicy.select_accents_for_listening('ielts', 2, seed=42)
        accents_2 = AccentPolicy.select_accents_for_listening('ielts', 2, seed=42)  
        self.assertEqual(accents_1, accents_2, "Same seed should give same accents")
        
        # Test that UK accents are preferred (with seed for consistency)
        uk_selections = 0
        for _ in range(10):
            accents = AccentPolicy.select_accents_for_listening('ielts', 2, seed=42)
            if any('UK' in accent for accent in accents):
                uk_selections += 1
        
        # Should select UK accents in most cases
        self.assertGreater(uk_selections, 5, "IELTS should prefer UK accents")
        
        # Vocabulary should use UK pronunciation
        vocab_accent = AccentPolicy.select_accent_for_vocabulary('ielts', seed=42)
        self.assertIn('UK', vocab_accent, "IELTS vocabulary should use UK accent")
        
        print(f"✓ IELTS accents: {accents_1}, vocab: {vocab_accent}")
    
    def test_toefl_accent_policy(self):
        """Test TOEFL accent requirements"""
        print("🧪 Testing TOEFL Accent Policy")
        
        # TOEFL should use American English
        config = AccentPolicy.get_accent_config('toefl')
        self.assertIn('US', config.listening_accents)
        self.assertEqual(config.listening_accents, ['US', 'US_FEMALE'])
        
        # Test consistent American accent selection
        accents = AccentPolicy.select_accents_for_listening('toefl', 2, seed=42)
        for accent in accents:
            self.assertIn('US', accent, f"TOEFL accent {accent} should be American")
        
        vocab_accent = AccentPolicy.select_accent_for_vocabulary('toefl', seed=42)
        self.assertIn('US', vocab_accent, "TOEFL vocabulary should use US accent")
        
        print(f"✓ TOEFL accents: {accents}, vocab: {vocab_accent}")
    
    def test_business_accent_diversity(self):
        """Test business English accent diversity"""
        print("🧪 Testing Business English Accent Diversity")
        
        config = AccentPolicy.get_accent_config('business')
        
        # Business should include diverse accents
        expected_accents = ['US', 'UK', 'IN', 'AR_L2', 'ZH_L2']
        for accent in expected_accents:
            self.assertIn(accent, config.listening_accents, 
                         f"Business English should include {accent}")
        
        # Test accent variety over multiple selections
        selected_accents = set()
        for seed in range(20):
            accents = AccentPolicy.select_accents_for_listening('business', 2, seed=seed)
            selected_accents.update(accents)
        
        # Should see variety in selections
        self.assertGreaterEqual(len(selected_accents), 3, 
                              "Business English should show accent variety")
        
        print(f"✓ Business accent variety: {selected_accents}")
    
    def test_pte_multi_accent_support(self):
        """Test PTE multi-accent requirements"""
        print("🧪 Testing PTE Multi-Accent Policy")
        
        config = AccentPolicy.get_accent_config('pte')
        
        # PTE should support multiple varieties
        expected_varieties = ['UK', 'AU', 'US', 'CA', 'IN']
        for variety in expected_varieties:
            self.assertIn(variety, config.listening_accents,
                         f"PTE should support {variety} accent")
        
        # Test that different accents are selected
        accent_distribution = {}
        for seed in range(50):
            accents = AccentPolicy.select_accents_for_listening('pte', 2, seed=seed)
            for accent in accents:
                accent_distribution[accent] = accent_distribution.get(accent, 0) + 1
        
        # Should have reasonable distribution
        unique_accents = len(accent_distribution)
        self.assertGreaterEqual(unique_accents, 3, 
                              f"PTE should use multiple accents, got: {unique_accents}")
        
        print(f"✓ PTE accent distribution: {accent_distribution}")


class TestContentQuality(unittest.TestCase):
    """Test conversation content generation quality"""
    
    def test_ielts_section1_authenticity(self):
        """Test IELTS Section 1 conversation authenticity"""
        print("🧪 Testing IELTS Section 1 Content Quality")
        
        script = ContentGenerator._generate_ielts_booking_conversation(
            "fitness class booking", "B2", 240
        )
        
        # Should have reasonable length for 4 minutes
        self.assertGreaterEqual(len(script), 15, "IELTS conversation should have sufficient turns")
        
        # Check for booking-specific elements
        booking_keywords = ['book', 'reservation', 'appointment', 'confirm', 'details']
        text_content = ' '.join(turn['text'].lower() for turn in script)
        
        found_keywords = sum(1 for keyword in booking_keywords if keyword in text_content)
        self.assertGreaterEqual(found_keywords, 3, 
                              f"Should contain booking keywords, found: {found_keywords}")
        
        # Check for personal details collection
        detail_keywords = ['name', 'address', 'phone', 'email', 'number']
        found_details = sum(1 for keyword in detail_keywords if keyword in text_content)
        self.assertGreaterEqual(found_details, 2, 
                              "Should ask for personal details")
        
        # Check speaker alternation
        speakers = [turn['speaker'] for turn in script]
        speaker_changes = sum(1 for i in range(1, len(speakers)) 
                            if speakers[i] != speakers[i-1])
        self.assertGreater(speaker_changes, len(script) * 0.7, 
                          "Should have good speaker alternation")
        
        print(f"✓ Generated {len(script)} turns with {found_keywords} booking elements")
    
    def test_content_safety(self):
        """Test content safety and appropriateness"""
        print("🧪 Testing Content Safety")
        
        # Test safe topics
        safe_topics = [
            "restaurant booking",
            "hotel reservation", 
            "job interview",
            "shopping for clothes",
            "university application"
        ]
        
        for topic in safe_topics:
            self.assertTrue(ContentSanitizer.is_safe_content(topic),
                          f"'{topic}' should be marked as safe")
        
        # Test inappropriate topic suggestions
        unsafe_topic = "violent confrontation"
        safe_alternative = ContentSanitizer.suggest_safe_topic(unsafe_topic)
        self.assertNotEqual(unsafe_topic, safe_alternative)
        self.assertTrue(ContentSanitizer.is_safe_content(safe_alternative))
        
        print("✓ Content safety validation working")
    
    def test_cefr_vocabulary_appropriateness(self):
        """Test CEFR-appropriate vocabulary selection"""
        print("🧪 Testing CEFR Vocabulary Appropriateness")
        
        # Test vocabulary for different levels
        levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        
        for level in levels:
            vocab = load_cefr_vocabulary(level)
            self.assertIsInstance(vocab, list)
            self.assertGreater(len(vocab), 0, f"Level {level} should have vocabulary")
            
            # Check vocabulary complexity increases with level
            if level == 'A1':
                # A1 should have simple words
                self.assertIn('hello', vocab)
                avg_length = sum(len(word) for word in vocab) / len(vocab)
                self.assertLess(avg_length, 6, "A1 vocabulary should be shorter")
            
            elif level == 'C2': 
                # C2 should have complex words
                avg_length = sum(len(word) for word in vocab) / len(vocab)
                self.assertGreater(avg_length, 8, "C2 vocabulary should be longer")
        
        print("✓ CEFR vocabulary appropriateness validated")
    
    def test_speech_timing_estimates(self):
        """Test speech duration estimation accuracy"""
        print("🧪 Testing Speech Timing Estimates")
        
        # Test different text lengths
        test_cases = [
            ("Hello, how are you?", 150, 2.4),      # 5 words, ~2.4 seconds
            ("Good morning, welcome to our hotel. How can I help you today?", 150, 8.0),  # 12 words
            ("I would like to make a reservation for this weekend please.", 150, 7.2)    # 11 words
        ]
        
        for text, wpm, expected_duration in test_cases:
            estimated = estimate_speech_duration(text, wpm)
            
            # Should be within 20% of expected
            tolerance = expected_duration * 0.2
            self.assertLess(abs(estimated - expected_duration), tolerance,
                          f"Duration estimate for '{text}': expected ~{expected_duration}s, got {estimated}s")
        
        print("✓ Speech timing estimates validated")


class TestAudioQualityStandards(unittest.TestCase):
    """Test audio quality analysis and standards"""
    
    def setUp(self):
        """Set up test audio quality analyzer"""
        self.analyzer = AudioQualityAnalyzer()
    
    def test_quality_standards_validation(self):
        """Test quality standards validation logic"""
        print("🧪 Testing Audio Quality Standards")
        
        # Test perfect audio metrics
        perfect_audio = {
            'duration': 120.0,
            'silence_ratio': 0.10,
            'max_pause_duration': 0.8,
            'peak_db': -2.0,
            'estimated_lufs': -18.0,
            'rms_db': -15.0
        }
        
        result = self.analyzer._validate_quality_standards(perfect_audio)
        self.assertTrue(result['overall_pass'], "Perfect audio should pass")
        
        # Test problematic audio
        problematic_cases = [
            # Too short
            {**perfect_audio, 'duration': 15.0},
            # Too much silence  
            {**perfect_audio, 'silence_ratio': 0.35},
            # Too long pause
            {**perfect_audio, 'max_pause_duration': 2.0},
            # Clipping
            {**perfect_audio, 'peak_db': 1.0},
            # Too loud
            {**perfect_audio, 'estimated_lufs': -10.0},
            # Too quiet
            {**perfect_audio, 'rms_db': -45.0}
        ]
        
        for i, audio_params in enumerate(problematic_cases):
            result = self.analyzer._validate_quality_standards(audio_params)
            self.assertFalse(result['overall_pass'], 
                           f"Problematic case {i+1} should fail quality check")
        
        print(f"✓ Validated {len(problematic_cases)} failure cases")
    
    def test_lufs_estimation_logic(self):
        """Test LUFS loudness estimation logic"""
        print("🧪 Testing LUFS Estimation Logic")
        
        # Create test audio signals
        sample_rate = 22050
        duration = 5.0
        samples = int(duration * sample_rate)
        
        # Test different signal levels
        test_signals = [
            np.full(samples, 0.1),   # Quiet signal
            np.full(samples, 0.5),   # Medium signal  
            np.full(samples, 0.9),   # Loud signal
            np.zeros(samples)        # Silent signal
        ]
        
        expected_ranges = [
            (-30, -20),  # Quiet
            (-20, -10),  # Medium
            (-10, -5),   # Loud
            (-50, -40)   # Silent
        ]
        
        for i, (signal, (min_lufs, max_lufs)) in enumerate(zip(test_signals, expected_ranges)):
            result = self.analyzer._analyze_loudness(signal, sample_rate)
            lufs = result['estimated_lufs']
            
            if lufs > -50:  # Not silent
                self.assertGreaterEqual(lufs, min_lufs, 
                                      f"Signal {i+1} LUFS too low: {lufs}")
                self.assertLessEqual(lufs, max_lufs,
                                   f"Signal {i+1} LUFS too high: {lufs}")
            
            print(f"    Signal {i+1}: {lufs:.1f} LUFS ({'✓' if min_lufs <= lufs <= max_lufs else '❌'})")
        
        print("✓ LUFS estimation logic validated")
    
    def test_silence_detection_accuracy(self):
        """Test silence detection accuracy"""
        print("🧪 Testing Silence Detection")
        
        # Create test signal with known silence patterns
        sample_rate = 22050
        
        # 1 second speech + 2 seconds silence + 1 second speech
        speech_samples = int(1.0 * sample_rate)
        silence_samples = int(2.0 * sample_rate)
        
        signal = np.concatenate([
            np.random.normal(0, 0.1, speech_samples),  # Speech
            np.zeros(silence_samples),                  # Silence
            np.random.normal(0, 0.1, speech_samples)   # Speech
        ])
        
        result = self.analyzer._analyze_silence(signal, sample_rate)
        
        # Should detect approximately 50% silence (2 out of 4 seconds)
        expected_ratio = 0.5
        detected_ratio = result['silence_ratio']
        
        tolerance = 0.1  # 10% tolerance
        self.assertLess(abs(detected_ratio - expected_ratio), tolerance,
                       f"Silence ratio: expected ~{expected_ratio:.2f}, got {detected_ratio:.2f}")
        
        # Should detect pauses
        self.assertGreater(len(result.get('pause_durations', [])), 0, 
                          "Should detect pause durations")
        
        print(f"✓ Detected {detected_ratio:.2%} silence (expected ~{expected_ratio:.2%})")
    
    def test_qa_report_generation(self):
        """Test QA report generation and recommendations"""
        print("🧪 Testing QA Report Generation")
        
        with tempfile.NamedTemporaryFile(suffix='.json', delete=False) as tmp:
            tmp_path = tmp.name
        
        try:
            # Test with good quality audio
            good_analysis = {
                'duration': 120.0,
                'silence_ratio': 0.12,
                'max_pause_duration': 0.9,
                'peak_db': -1.5,
                'estimated_lufs': -18.2,
                'overall_pass': True,
                'quality_check': {'overall_pass': True}
            }
            
            report = QualityReporter.generate_qa_report(
                analysis_results=good_analysis,
                generation_params={'goal': 'ielts', 'level': 'B2'},
                output_path=tmp_path
            )
            
            # Check report structure
            self.assertIn('summary', report)
            self.assertIn('recommendations', report)
            self.assertIn('metadata', report)
            
            recommendations = report['recommendations']
            self.assertIsInstance(recommendations, list)
            
            # Good audio should have positive recommendations
            if len(recommendations) > 0:
                last_rec = recommendations[-1].lower()
                self.assertIn('good', last_rec, 
                             f"Good audio should get positive feedback: {recommendations}")
            
            # Test with problematic audio
            bad_analysis = {
                'duration': 20.0,  # Too short
                'silence_ratio': 0.4,  # Too much silence
                'max_pause_duration': 3.0,  # Too long pause
                'overall_pass': False,
                'quality_check': {'overall_pass': False}
            }
            
            bad_report = QualityReporter.generate_qa_report(
                analysis_results=bad_analysis,
                generation_params={'goal': 'ielts', 'level': 'B2'}, 
                output_path=tmp_path
            )
            
            bad_recommendations = bad_report['recommendations']
            self.assertGreater(len(bad_recommendations), 1, 
                             "Bad audio should have multiple recommendations")
            
            print(f"✓ Generated reports with {len(recommendations)} good and {len(bad_recommendations)} improvement recommendations")
            
        finally:
            # Cleanup
            if os.path.exists(tmp_path):
                os.unlink(tmp_path)


def run_accent_quality_tests():
    """Run all accent and quality tests"""
    print("🎤 TTS Pipeline Accent & Quality Tests")
    print("=" * 50)
    
    # Create test suite
    loader = unittest.TestLoader()
    suite = unittest.TestSuite()
    
    # Add test classes
    suite.addTests(loader.loadTestsFromTestCase(TestAccentPolicyCorrectness))
    suite.addTests(loader.loadTestsFromTestCase(TestContentQuality))
    suite.addTests(loader.loadTestsFromTestCase(TestAudioQualityStandards))
    
    # Run tests
    runner = unittest.TextTestRunner(verbosity=2)
    result = runner.run(suite)
    
    # Print summary
    print("\n" + "=" * 50)
    print("🎯 ACCENT & QUALITY TEST SUMMARY")
    print("=" * 50)
    print(f"Tests run: {result.testsRun}")
    print(f"Failures: {len(result.failures)}")
    print(f"Errors: {len(result.errors)}")
    
    if result.failures:
        print(f"\n❌ FAILURES:")
        for test, traceback in result.failures:
            print(f"- {test}")
    
    if result.errors:
        print(f"\n💥 ERRORS:")
        for test, traceback in result.errors:
            print(f"- {test}")
    
    success_rate = ((result.testsRun - len(result.failures) - len(result.errors)) / result.testsRun) * 100
    print(f"\n✅ Success Rate: {success_rate:.1f}%")
    
    if result.wasSuccessful():
        print("🎉 All accent and quality tests passed!")
    else:
        print("⚠️ Some quality issues detected")
    
    return result.wasSuccessful()


if __name__ == "__main__":
    success = run_accent_quality_tests()
    sys.exit(0 if success else 1)