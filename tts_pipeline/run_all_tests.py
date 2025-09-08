#!/usr/bin/env python3
"""
Complete Test Suite Runner for TTS Pipeline
Runs all functional tests and generates comprehensive report
"""
import sys
import os
import time
import subprocess
from pathlib import Path
import json


class TTSTestSuite:
    """Complete test suite for TTS Pipeline"""
    
    def __init__(self):
        self.test_results = {}
        self.start_time = time.time()
        self.test_dir = Path(__file__).parent
        
    def run_python_test(self, test_name, test_file):
        """Run a Python test file and capture results"""
        print(f"\n{'='*60}")
        print(f"🧪 Running {test_name}")
        print(f"{'='*60}")
        
        try:
            # Run the test
            result = subprocess.run(
                [sys.executable, str(self.test_dir / test_file)],
                cwd=str(self.test_dir),
                capture_output=True,
                text=True,
                timeout=300  # 5 minute timeout per test
            )
            
            success = result.returncode == 0
            
            # Show output
            if result.stdout:
                print(result.stdout)
            if result.stderr and not success:
                print("STDERR:", result.stderr)
            
            self.test_results[test_name] = {
                'success': success,
                'returncode': result.returncode,
                'stdout': result.stdout,
                'stderr': result.stderr,
                'duration': time.time() - self.start_time
            }
            
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"\n{status} {test_name}")
            
            return success
            
        except subprocess.TimeoutExpired:
            print(f"❌ TIMEOUT {test_name} (>5 minutes)")
            self.test_results[test_name] = {
                'success': False,
                'timeout': True,
                'duration': 300
            }
            return False
            
        except Exception as e:
            print(f"❌ ERROR {test_name}: {e}")
            self.test_results[test_name] = {
                'success': False,
                'error': str(e),
                'duration': time.time() - self.start_time
            }
            return False
    
    def run_api_test(self):
        """Run API integration test (requires server)"""
        print(f"\n{'='*60}")
        print("🧪 Running API Integration Test")
        print("{'='*60}")
        
        # Check if server is accessible
        try:
            import requests
            response = requests.get('http://localhost:5000/health', timeout=5)
            server_available = response.status_code == 200
        except:
            server_available = False
        
        if not server_available:
            print("⚠️ Server not available at http://localhost:5000")
            print("💡 Start server with 'npm run dev' to run API tests")
            self.test_results['API Integration'] = {
                'success': False,
                'skipped': True,
                'reason': 'Server not available'
            }
            return False
        
        return self.run_python_test('API Integration', 'test_api_integration.py')
    
    def check_dependencies(self):
        """Check if all dependencies are available"""
        print("🔍 Checking Dependencies")
        print("-" * 30)
        
        dependencies = {
            'Python 3.11+': sys.version_info >= (3, 11),
            'NumPy': self._check_import('numpy'),
            'Librosa': self._check_import('librosa'),
            'PyDub': self._check_import('pydub'),
            'SoundFile': self._check_import('soundfile'),
            'YAML': self._check_import('yaml'),
            'Requests': self._check_import('requests')
        }
        
        # Optional advanced dependencies
        advanced_deps = {
            'TTS (Coqui)': self._check_import('TTS'),
            'Faster-Whisper': self._check_import('faster_whisper'),
            'PyTorch': self._check_import('torch')
        }
        
        # Report core dependencies
        missing_core = []
        for dep, available in dependencies.items():
            status = "✅" if available else "❌"
            print(f"{status} {dep}")
            if not available:
                missing_core.append(dep)
        
        # Report advanced dependencies
        print("\nAdvanced Dependencies (optional):")
        missing_advanced = []
        for dep, available in advanced_deps.items():
            status = "✅" if available else "⚠️"
            print(f"{status} {dep}")
            if not available:
                missing_advanced.append(dep)
        
        if missing_core:
            print(f"\n❌ Missing core dependencies: {', '.join(missing_core)}")
            print("Install with: pip install pydub librosa soundfile numpy scipy python-dotenv PyYAML")
            return False
        
        if missing_advanced:
            print(f"\n⚠️ Missing advanced features: {', '.join(missing_advanced)}")
            print("Some features may use fallback implementations")
        
        return True
    
    def _check_import(self, module_name):
        """Check if a module can be imported"""
        try:
            __import__(module_name)
            return True
        except ImportError:
            return False
    
    def run_all_tests(self):
        """Run the complete test suite"""
        print("🎤 TTS Pipeline Complete Test Suite")
        print("=" * 60)
        print(f"Started at: {time.ctime()}")
        print(f"Python: {sys.version}")
        print(f"Working Directory: {self.test_dir}")
        
        # Check dependencies first
        if not self.check_dependencies():
            print("\n❌ Dependency check failed. Please install missing packages.")
            return False
        
        print("\n✅ All core dependencies available")
        
        # Define tests to run
        tests = [
            ('Core Pipeline Functionality', 'test_pipeline.py'),
            ('Accent & Quality Standards', 'test_accent_quality.py'),
        ]
        
        # Run Python tests
        results = []
        for test_name, test_file in tests:
            success = self.run_python_test(test_name, test_file)
            results.append(success)
        
        # Run API test if server available
        api_success = self.run_api_test()
        results.append(api_success)
        
        # Generate final report
        self.generate_final_report()
        
        # Return overall success
        return all(results)
    
    def generate_final_report(self):
        """Generate comprehensive test report"""
        total_time = time.time() - self.start_time
        
        print(f"\n{'='*80}")
        print("🎯 COMPLETE TEST SUITE RESULTS")
        print(f"{'='*80}")
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results.values() if result.get('success', False))
        failed_tests = total_tests - passed_tests
        skipped_tests = sum(1 for result in self.test_results.values() if result.get('skipped', False))
        
        print(f"Total Test Categories: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Skipped: {skipped_tests}")
        print(f"Total Runtime: {total_time:.1f} seconds")
        
        # Detailed results
        print(f"\nDetailed Results:")
        print("-" * 40)
        for test_name, result in self.test_results.items():
            if result.get('skipped'):
                status = f"⏭️ SKIPPED - {result.get('reason', 'Unknown')}"
            elif result.get('timeout'):
                status = "⏰ TIMEOUT"
            elif result.get('success'):
                status = "✅ PASSED"
            else:
                status = "❌ FAILED"
            
            duration = result.get('duration', 0)
            print(f"{status:<20} {test_name} ({duration:.1f}s)")
        
        # Success rate
        success_rate = (passed_tests / total_tests) * 100 if total_tests > 0 else 0
        print(f"\n✅ Overall Success Rate: {success_rate:.1f}%")
        
        # Recommendations
        print(f"\n📋 Recommendations:")
        if success_rate >= 90:
            print("🎉 Excellent! Pipeline is ready for production deployment.")
        elif success_rate >= 75:
            print("✅ Good! Pipeline core functionality is working.")
            if failed_tests > 0:
                print("💡 Some advanced features may need attention.")
        elif success_rate >= 50:
            print("⚠️ Moderate issues detected. Review failed tests before deployment.")
        else:
            print("❌ Major issues detected. Significant fixes needed.")
        
        if skipped_tests > 0:
            print("ℹ️ Some tests were skipped. Run them separately if needed.")
        
        # Save detailed report
        self._save_report_json(success_rate, total_time)
    
    def _save_report_json(self, success_rate, total_time):
        """Save detailed JSON report"""
        report = {
            'timestamp': time.time(),
            'date': time.ctime(),
            'python_version': sys.version,
            'working_directory': str(self.test_dir),
            'total_runtime_seconds': total_time,
            'success_rate_percent': success_rate,
            'test_results': self.test_results,
            'summary': {
                'total_categories': len(self.test_results),
                'passed': sum(1 for r in self.test_results.values() if r.get('success')),
                'failed': sum(1 for r in self.test_results.values() if not r.get('success') and not r.get('skipped')),
                'skipped': sum(1 for r in self.test_results.values() if r.get('skipped'))
            }
        }
        
        report_file = self.test_dir / 'test_results.json'
        try:
            with open(report_file, 'w') as f:
                json.dump(report, f, indent=2)
            print(f"\n📄 Detailed report saved: {report_file}")
        except Exception as e:
            print(f"\n⚠️ Could not save report: {e}")


def main():
    """Main test runner"""
    import argparse
    
    parser = argparse.ArgumentParser(description="TTS Pipeline Complete Test Suite")
    parser.add_argument('--skip-api', action='store_true', 
                       help='Skip API integration tests')
    
    args = parser.parse_args()
    
    # Run test suite
    suite = TTSTestSuite()
    
    if args.skip_api:
        # Remove API test by modifying the run method
        original_run_api = suite.run_api_test
        suite.run_api_test = lambda: True  # Mock success
        print("⚠️ Skipping API tests as requested")
    
    success = suite.run_all_tests()
    
    # Exit with appropriate code
    return 0 if success else 1


if __name__ == "__main__":
    exit_code = main()
    sys.exit(exit_code)