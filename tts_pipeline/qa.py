"""
Audio quality assurance and validation system.
"""
import numpy as np
import librosa
from typing import Dict, Any, List, Tuple
import json
from pathlib import Path


class AudioQualityAnalyzer:
    """Analyzes audio quality and validates against standards."""
    
    def __init__(self):
        self.quality_standards = {
            'min_duration': 30,      # seconds
            'max_duration': 600,     # seconds  
            'max_silence_ratio': 0.20,  # 20%
            'max_pause_duration': 1.2,  # seconds
            'min_lufs': -23,         # LUFS
            'max_lufs': -14,         # LUFS
            'max_peak_db': -1.0,     # dBFS
            'min_rms_db': -40,       # dBFS
        }
    
    def analyze_audio_quality(self, audio_path: str) -> Dict[str, Any]:
        """Comprehensive audio quality analysis."""
        
        print(f"Analyzing audio quality: {audio_path}")
        
        try:
            # Load audio for analysis
            audio_data, sr = librosa.load(audio_path, sr=None)
            duration = len(audio_data) / sr
            
            # Run all quality checks
            results = {
                'file_path': audio_path,
                'duration': duration,
                'sample_rate': sr,
                'timestamp': self._get_timestamp()
            }
            
            # Basic audio metrics
            results.update(self._analyze_basic_metrics(audio_data, sr))
            
            # Silence analysis
            results.update(self._analyze_silence(audio_data, sr))
            
            # Dynamic range analysis
            results.update(self._analyze_dynamics(audio_data, sr))
            
            # Loudness analysis  
            results.update(self._analyze_loudness(audio_data, sr))
            
            # Quality validation
            results['quality_check'] = self._validate_quality_standards(results)
            
            # Overall pass/fail
            results['overall_pass'] = results['quality_check']['overall_pass']
            
            return results
            
        except Exception as e:
            return {
                'file_path': audio_path,
                'error': str(e),
                'overall_pass': False,
                'quality_check': {'error': True}
            }
    
    def _analyze_basic_metrics(self, audio_data: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze basic audio metrics."""
        
        # Peak level
        peak_level = np.max(np.abs(audio_data))
        peak_db = 20 * np.log10(peak_level) if peak_level > 0 else -np.inf
        
        # RMS level
        rms_level = np.sqrt(np.mean(audio_data ** 2))
        rms_db = 20 * np.log10(rms_level) if rms_level > 0 else -np.inf
        
        # Dynamic range (simplified)
        dynamic_range = peak_db - rms_db
        
        return {
            'peak_level': float(peak_level),
            'peak_db': float(peak_db),
            'rms_level': float(rms_level), 
            'rms_db': float(rms_db),
            'dynamic_range_db': float(dynamic_range)
        }
    
    def _analyze_silence(self, audio_data: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze silence patterns and ratios."""
        
        # Detect silence using energy threshold
        frame_length = int(sr * 0.025)  # 25ms frames
        hop_length = int(sr * 0.010)    # 10ms hop
        
        # Calculate frame energy
        frames = librosa.util.frame(audio_data, frame_length=frame_length, 
                                  hop_length=hop_length, axis=0)
        frame_energy = np.sum(frames ** 2, axis=0)
        
        # Silence threshold (adaptive)
        median_energy = np.median(frame_energy)
        silence_threshold = median_energy * 0.01  # 1% of median energy
        
        # Identify silent frames
        silent_frames = frame_energy < silence_threshold
        
        # Calculate silence statistics
        total_frames = len(frame_energy)
        silent_frame_count = np.sum(silent_frames)
        silence_ratio = silent_frame_count / total_frames if total_frames > 0 else 0
        
        # Find pause durations
        pause_durations = self._find_pause_durations(silent_frames, hop_length / sr)
        max_pause = np.max(pause_durations) if len(pause_durations) > 0 else 0
        
        return {
            'silence_ratio': float(silence_ratio),
            'total_silent_frames': int(silent_frame_count),
            'pause_count': len(pause_durations),
            'max_pause_duration': float(max_pause),
            'avg_pause_duration': float(np.mean(pause_durations)) if len(pause_durations) > 0 else 0,
            'pause_durations': [float(p) for p in pause_durations[:10]]  # First 10 pauses
        }
    
    def _find_pause_durations(self, silent_frames: np.ndarray, frame_duration: float) -> List[float]:
        """Find individual pause durations from silent frame sequence."""
        
        pause_durations = []
        current_pause_length = 0
        
        for is_silent in silent_frames:
            if is_silent:
                current_pause_length += 1
            else:
                if current_pause_length > 0:
                    pause_duration = current_pause_length * frame_duration
                    if pause_duration > 0.1:  # Only count pauses > 100ms
                        pause_durations.append(pause_duration)
                    current_pause_length = 0
        
        # Handle pause at end
        if current_pause_length > 0:
            pause_duration = current_pause_length * frame_duration
            if pause_duration > 0.1:
                pause_durations.append(pause_duration)
        
        return pause_durations
    
    def _analyze_dynamics(self, audio_data: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze audio dynamics and compression."""
        
        # Calculate short-term and long-term loudness
        frame_length = int(sr * 0.4)  # 400ms frames for dynamics
        hop_length = int(sr * 0.1)    # 100ms hop
        
        # Frame-wise RMS
        frames = librosa.util.frame(audio_data, frame_length=frame_length,
                                  hop_length=hop_length, axis=0)
        frame_rms = np.sqrt(np.mean(frames ** 2, axis=0))
        frame_rms_db = 20 * np.log10(frame_rms + 1e-10)  # Add small value to avoid log(0)
        
        # Dynamic range metrics
        if len(frame_rms_db) > 0:
            loudness_range = np.max(frame_rms_db) - np.min(frame_rms_db)
            loudness_std = np.std(frame_rms_db)
        else:
            loudness_range = 0
            loudness_std = 0
        
        return {
            'loudness_range_db': float(loudness_range),
            'loudness_std_db': float(loudness_std),
            'dynamics_quality': 'good' if loudness_range > 6 else 'compressed'
        }
    
    def _analyze_loudness(self, audio_data: np.ndarray, sr: int) -> Dict[str, Any]:
        """Analyze loudness characteristics (simplified LUFS estimation)."""
        
        # This is a simplified LUFS estimation
        # Real LUFS measurement requires proper K-weighting and gating
        
        # Apply simplified pre-filter (rough approximation of K-weighting)
        # High-frequency pre-emphasis
        b_high = [1.53512485958697, -2.69169618940638, 1.19839281085285]
        a_high = [1.0, -1.69065929318241, 0.73248077421585]
        
        try:
            from scipy import signal
            filtered_audio = signal.lfilter(b_high, a_high, audio_data)
        except ImportError:
            # Fallback without filtering if scipy not available
            filtered_audio = audio_data
        
        # Calculate mean square with gating (simplified)
        frame_size = int(sr * 0.4)  # 400ms blocks
        hop_size = int(sr * 0.1)    # 100ms hop
        
        frame_powers = []
        for i in range(0, len(filtered_audio) - frame_size, hop_size):
            frame = filtered_audio[i:i + frame_size]
            power = np.mean(frame ** 2)
            if power > 0:
                frame_powers.append(power)
        
        if len(frame_powers) > 0:
            # Apply relative gate at -70 LUFS (simplified)
            mean_power = np.mean(frame_powers)
            gate_power = mean_power * 0.0001  # -40dB relative gate (simplified)
            
            gated_powers = [p for p in frame_powers if p >= gate_power]
            
            if len(gated_powers) > 0:
                final_power = np.mean(gated_powers)
                estimated_lufs = -0.691 + 10 * np.log10(final_power)  # Rough calibration
            else:
                estimated_lufs = -np.inf
        else:
            estimated_lufs = -np.inf
        
        return {
            'estimated_lufs': float(estimated_lufs) if estimated_lufs != -np.inf else -50.0,
            'lufs_quality': 'good' if -23 <= estimated_lufs <= -14 else 'needs_adjustment'
        }
    
    def _validate_quality_standards(self, results: Dict[str, Any]) -> Dict[str, Any]:
        """Validate audio against quality standards."""
        
        checks = {}
        standards = self.quality_standards
        
        # Duration check
        duration = results.get('duration', 0)
        checks['duration_ok'] = standards['min_duration'] <= duration <= standards['max_duration']
        checks['duration_message'] = f"Duration: {duration:.1f}s (target: {standards['min_duration']}-{standards['max_duration']}s)"
        
        # Silence ratio check
        silence_ratio = results.get('silence_ratio', 1.0)
        checks['silence_ok'] = silence_ratio <= standards['max_silence_ratio']
        checks['silence_message'] = f"Silence ratio: {silence_ratio:.2%} (max: {standards['max_silence_ratio']:.0%})"
        
        # Max pause check
        max_pause = results.get('max_pause_duration', 0)
        checks['pause_ok'] = max_pause <= standards['max_pause_duration']
        checks['pause_message'] = f"Max pause: {max_pause:.2f}s (max: {standards['max_pause_duration']}s)"
        
        # Peak level check
        peak_db = results.get('peak_db', 0)
        checks['peak_ok'] = peak_db <= standards['max_peak_db']
        checks['peak_message'] = f"Peak: {peak_db:.1f}dBFS (max: {standards['max_peak_db']}dBFS)"
        
        # LUFS check
        lufs = results.get('estimated_lufs', -50)
        checks['lufs_ok'] = standards['min_lufs'] <= lufs <= standards['max_lufs']
        checks['lufs_message'] = f"LUFS: {lufs:.1f} (target: {standards['min_lufs']} to {standards['max_lufs']})"
        
        # RMS check
        rms_db = results.get('rms_db', -np.inf)
        checks['rms_ok'] = rms_db >= standards['min_rms_db']
        checks['rms_message'] = f"RMS: {rms_db:.1f}dBFS (min: {standards['min_rms_db']}dBFS)"
        
        # Overall pass/fail
        critical_checks = ['duration_ok', 'silence_ok', 'pause_ok', 'peak_ok']
        checks['overall_pass'] = all(checks.get(check, False) for check in critical_checks)
        
        # Generate summary
        failed_checks = [key for key in critical_checks if not checks.get(key, False)]
        if failed_checks:
            checks['failure_reasons'] = failed_checks
            checks['summary'] = f"FAILED: {', '.join(failed_checks)}"
        else:
            checks['summary'] = "PASSED: All quality checks"
        
        return checks
    
    def _get_timestamp(self) -> str:
        """Get current timestamp."""
        from datetime import datetime
        return datetime.now().isoformat()


class QualityReporter:
    """Generates quality assurance reports."""
    
    @staticmethod
    def generate_qa_report(analysis_results: Dict[str, Any], 
                          generation_params: Dict[str, Any],
                          output_path: str) -> Dict[str, Any]:
        """Generate comprehensive QA report."""
        
        report = {
            'metadata': {
                'timestamp': analysis_results.get('timestamp'),
                'audio_file': analysis_results.get('file_path'),
                'generation_params': generation_params
            },
            'quality_analysis': analysis_results,
            'summary': {
                'overall_pass': analysis_results.get('overall_pass', False),
                'duration': analysis_results.get('duration', 0),
                'silence_ratio': analysis_results.get('silence_ratio', 0),
                'max_pause': analysis_results.get('max_pause_duration', 0),
                'estimated_lufs': analysis_results.get('estimated_lufs', 0),
                'peak_db': analysis_results.get('peak_db', 0)
            },
            'recommendations': QualityReporter._generate_recommendations(analysis_results)
        }
        
        # Save report to file
        try:
            with open(output_path, 'w', encoding='utf-8') as f:
                json.dump(report, f, indent=2, ensure_ascii=False)
            
            print(f"✓ QA report saved: {output_path}")
            return report
            
        except Exception as e:
            print(f"✗ Failed to save QA report: {e}")
            return report
    
    @staticmethod
    def _generate_recommendations(analysis: Dict[str, Any]) -> List[str]:
        """Generate improvement recommendations based on analysis."""
        
        recommendations = []
        quality_check = analysis.get('quality_check', {})
        
        # Duration recommendations
        if not quality_check.get('duration_ok', True):
            duration = analysis.get('duration', 0)
            if duration < 30:
                recommendations.append("Increase content length - audio too short for effective practice")
            elif duration > 600:
                recommendations.append("Reduce content length - audio too long may lose learner attention")
        
        # Silence recommendations
        if not quality_check.get('silence_ok', True):
            silence_ratio = analysis.get('silence_ratio', 0)
            if silence_ratio > 0.3:
                recommendations.append("Reduce silence - too many long pauses break conversation flow")
            elif silence_ratio > 0.2:
                recommendations.append("Consider shortening some pauses for better pacing")
        
        # Pause recommendations
        if not quality_check.get('pause_ok', True):
            max_pause = analysis.get('max_pause_duration', 0)
            if max_pause > 2.0:
                recommendations.append("Reduce maximum pause duration - overly long pauses are unnatural")
            elif max_pause > 1.5:
                recommendations.append("Consider shortening longest pauses for better conversation flow")
        
        # Audio level recommendations
        if not quality_check.get('peak_ok', True):
            peak_db = analysis.get('peak_db', 0)
            if peak_db > -1:
                recommendations.append("Reduce audio levels to prevent distortion - peak too high")
        
        if not quality_check.get('lufs_ok', True):
            lufs = analysis.get('estimated_lufs', 0)
            if lufs > -14:
                recommendations.append("Reduce overall loudness - audio may be too loud")
            elif lufs < -23:
                recommendations.append("Increase overall loudness - audio may be too quiet")
        
        # Dynamics recommendations
        dynamics_quality = analysis.get('dynamics_quality', '')
        if dynamics_quality == 'compressed':
            recommendations.append("Improve dynamic range - audio sounds over-compressed")
        
        # General recommendations
        if len(recommendations) == 0:
            recommendations.append("Audio quality meets all standards - good for deployment")
        
        return recommendations
    
    @staticmethod
    def print_qa_summary(analysis: Dict[str, Any]):
        """Print a concise QA summary to console."""
        
        print("\n" + "="*60)
        print("AUDIO QUALITY ANALYSIS SUMMARY")
        print("="*60)
        
        # Overall result
        overall_pass = analysis.get('overall_pass', False)
        status = "✓ PASS" if overall_pass else "✗ FAIL"
        print(f"Overall Status: {status}")
        
        # Key metrics
        print(f"\nKey Metrics:")
        print(f"  Duration: {analysis.get('duration', 0):.1f}s")
        print(f"  Silence Ratio: {analysis.get('silence_ratio', 0):.1%}")
        print(f"  Max Pause: {analysis.get('max_pause_duration', 0):.2f}s")
        print(f"  Peak Level: {analysis.get('peak_db', 0):.1f}dBFS")
        print(f"  Estimated LUFS: {analysis.get('estimated_lufs', 0):.1f}")
        
        # Quality checks
        quality_check = analysis.get('quality_check', {})
        print(f"\nQuality Checks:")
        
        checks = [
            ('Duration', quality_check.get('duration_ok', False)),
            ('Silence', quality_check.get('silence_ok', False)),
            ('Pauses', quality_check.get('pause_ok', False)),
            ('Peak Level', quality_check.get('peak_ok', False)),
            ('Loudness', quality_check.get('lufs_ok', False))
        ]
        
        for check_name, passed in checks:
            status_icon = "✓" if passed else "✗"
            print(f"  {status_icon} {check_name}")
        
        print("="*60)