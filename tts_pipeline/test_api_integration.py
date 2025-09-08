#!/usr/bin/env python3
"""
API Integration Tests for TTS Pipeline
Tests the Node.js API endpoints that connect to the Python pipeline
"""
import requests
import json
import time
import tempfile
import os
from pathlib import Path


class TTSPipelineAPITester:
    """Test the TTS Pipeline API endpoints"""
    
    def __init__(self, base_url="http://localhost:5000"):
        self.base_url = base_url
        self.session = requests.Session()
        self.test_results = []
    
    def log_test(self, test_name, passed, details=""):
        """Log test result"""
        status = "✅ PASS" if passed else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"    {details}")
        self.test_results.append({
            'test': test_name,
            'passed': passed,
            'details': details
        })
    
    def test_pipeline_status(self):
        """Test 1: Pipeline Status Endpoint"""
        print("\n🧪 Test 1: Pipeline Status Check")
        
        try:
            response = self.session.get(f"{self.base_url}/api/tts-pipeline/status")
            
            if response.status_code == 200:
                data = response.json()
                
                # Check required fields
                has_available = 'available' in data
                has_components = 'components' in data
                has_features = 'features' in data
                
                if has_available and has_components and has_features:
                    self.log_test("Pipeline Status Endpoint", True, 
                                f"Status: {'Online' if data.get('available') else 'Fallback'}")
                    
                    # Log component status
                    components = data.get('components', {})
                    for component, status in components.items():
                        status_text = "✅" if status else "❌"
                        print(f"    {component}: {status_text}")
                    
                    return data.get('available', False)
                else:
                    self.log_test("Pipeline Status Endpoint", False, "Missing required fields")
                    return False
            else:
                self.log_test("Pipeline Status Endpoint", False, 
                            f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Pipeline Status Endpoint", False, f"Connection error: {e}")
            return False
    
    def test_voices_endpoint(self):
        """Test 2: Voices Configuration Endpoint"""
        print("\n🧪 Test 2: Voices Configuration")
        
        try:
            response = self.session.get(f"{self.base_url}/api/tts-pipeline/voices")
            
            if response.status_code == 200:
                data = response.json()
                
                has_voices = 'voices' in data or 'accent_policies' in data
                
                if has_voices:
                    voices_count = len(data.get('voices', {}))
                    policies_count = len(data.get('accent_policies', {}))
                    
                    self.log_test("Voices Configuration Endpoint", True, 
                                f"{voices_count} voices, {policies_count} accent policies")
                    
                    # Show accent policies
                    for policy, description in data.get('accent_policies', {}).items():
                        print(f"    {policy.upper()}: {description}")
                    
                    return True
                else:
                    self.log_test("Voices Configuration Endpoint", False, 
                                "No voice data returned")
                    return False
            else:
                self.log_test("Voices Configuration Endpoint", False, 
                            f"HTTP {response.status_code}")
                return False
                
        except Exception as e:
            self.log_test("Voices Configuration Endpoint", False, f"Error: {e}")
            return False
    
    def test_audio_generation(self, use_advanced=True):
        """Test 3: Audio Generation (with timeout for actual generation)"""
        test_name = "Advanced Audio Generation" if use_advanced else "Fallback Generation"
        print(f"\n🧪 Test 3: {test_name}")
        
        # Test payload
        payload = {
            "goal": "ielts",
            "level": "B2", 
            "topic": "hotel booking conversation",
            "duration_sec": 60,  # Short for testing
            "l1": "fa",
            "vocab_count": 5,
            "seed": 42
        }
        
        try:
            print("    Sending generation request...")
            start_time = time.time()
            
            response = self.session.post(
                f"{self.base_url}/api/tts-pipeline/advanced/generate",
                json=payload,
                timeout=300  # 5 minute timeout
            )
            
            elapsed = time.time() - start_time
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    outputs = data.get('outputs', {})
                    output_count = len([k for k, v in outputs.items() if v])
                    
                    self.log_test(test_name, True, 
                                f"Generated {output_count} outputs in {elapsed:.1f}s")
                    
                    # List generated outputs
                    for output_type, output_path in outputs.items():
                        if output_path:
                            print(f"    📁 {output_type}: {Path(output_path).name}")
                    
                    return True
                else:
                    error_msg = data.get('error', 'Unknown error')
                    if data.get('fallback_suggested'):
                        self.log_test(test_name, False, f"Pipeline unavailable: {error_msg}")
                        print("    💡 Suggestion: Advanced pipeline not ready, using fallback")
                    else:
                        self.log_test(test_name, False, f"Generation failed: {error_msg}")
                    return False
                    
            elif response.status_code == 503:
                # Service unavailable - expected if advanced pipeline not ready
                self.log_test(test_name, False, "Advanced pipeline not available")
                print("    ℹ️ This is expected if Coqui XTTS-v2 is not installed")
                return False
            else:
                self.log_test(test_name, False, f"HTTP {response.status_code}")
                return False
                
        except requests.exceptions.Timeout:
            self.log_test(test_name, False, "Request timeout (>5 minutes)")
            return False
        except Exception as e:
            self.log_test(test_name, False, f"Error: {e}")
            return False
    
    def test_input_validation(self):
        """Test 4: Input Validation and Error Handling"""
        print("\n🧪 Test 4: Input Validation")
        
        # Test invalid payload
        invalid_payloads = [
            {
                "goal": "invalid_goal",
                "level": "B2",
                "topic": "test",
                "duration_sec": 60
            },
            {
                "goal": "ielts", 
                "level": "X1",  # Invalid level
                "topic": "test",
                "duration_sec": 60
            },
            {
                "goal": "ielts",
                "level": "B2",
                "topic": "",  # Empty topic
                "duration_sec": 60
            },
            {
                "goal": "ielts",
                "level": "B2", 
                "topic": "test",
                "duration_sec": 1000  # Too long
            }
        ]
        
        validation_tests_passed = 0
        total_validation_tests = len(invalid_payloads)
        
        for i, payload in enumerate(invalid_payloads, 1):
            try:
                response = self.session.post(
                    f"{self.base_url}/api/tts-pipeline/advanced/generate",
                    json=payload,
                    timeout=10
                )
                
                # Should return 400 for invalid input
                if response.status_code == 400:
                    data = response.json()
                    if not data.get('success') and 'error' in data:
                        validation_tests_passed += 1
                        print(f"    ✅ Validation {i}: Correctly rejected invalid input")
                    else:
                        print(f"    ❌ Validation {i}: Wrong error format")
                else:
                    print(f"    ❌ Validation {i}: Expected 400, got {response.status_code}")
                    
            except Exception as e:
                print(f"    ❌ Validation {i}: Exception {e}")
        
        success_rate = (validation_tests_passed / total_validation_tests) * 100
        passed = validation_tests_passed == total_validation_tests
        
        self.log_test("Input Validation", passed, 
                    f"{validation_tests_passed}/{total_validation_tests} validation tests passed ({success_rate:.0f}%)")
        
        return passed
    
    def run_all_tests(self):
        """Run all API integration tests"""
        print("🎤 TTS Pipeline API Integration Tests")
        print("=" * 50)
        
        # Test 1: Check pipeline status
        pipeline_available = self.test_pipeline_status()
        
        # Test 2: Check voices configuration  
        self.test_voices_endpoint()
        
        # Test 3: Validate inputs
        self.test_input_validation()
        
        # Test 4: Try audio generation (only if pipeline available)
        if pipeline_available:
            print("    🎯 Advanced pipeline detected - testing audio generation")
            self.test_audio_generation(use_advanced=True)
        else:
            print("    ⚠️ Advanced pipeline not available - skipping audio generation test")
            print("    💡 This is normal if Coqui XTTS-v2 is not installed")
        
        # Print summary
        self.print_summary()
    
    def print_summary(self):
        """Print test results summary"""
        print("\n" + "=" * 50)
        print("🎯 API INTEGRATION TEST SUMMARY")
        print("=" * 50)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['passed'])
        failed_tests = total_tests - passed_tests
        
        print(f"Tests run: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        
        if failed_tests > 0:
            print(f"\n❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['passed']:
                    print(f"- {result['test']}: {result['details']}")
        
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n✅ Success Rate: {success_rate:.1f}%")
        
        if success_rate >= 75:
            print("🎉 API integration tests mostly successful!")
            if success_rate < 100:
                print("💡 Some advanced features may not be available yet")
        else:
            print("⚠️ Multiple API integration issues detected")
        
        return success_rate >= 75


def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TTS Pipeline API Integration Tests")
    parser.add_argument('--url', default='http://localhost:5000', 
                       help='Base URL for the API server')
    
    args = parser.parse_args()
    
    # Check if server is running
    try:
        response = requests.get(f"{args.url}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ Server not healthy at {args.url}")
            return False
    except:
        print(f"❌ Cannot connect to server at {args.url}")
        print("💡 Make sure the server is running with 'npm run dev'")
        return False
    
    print(f"✅ Connected to server at {args.url}")
    
    # Run tests
    tester = TTSPipelineAPITester(args.url)
    success = tester.run_all_tests()
    
    return success


if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)