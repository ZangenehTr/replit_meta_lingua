"""
Utility functions for audio processing and file management.
"""
import os
import re
import json
import hashlib
from typing import Dict, Any, List, Optional
from pathlib import Path
import yaml


def sanitize_filename(text: str) -> str:
    """Convert text to a safe filename."""
    # Remove or replace unsafe characters
    safe = re.sub(r'[<>:"/\\|?*]', '', text)
    safe = re.sub(r'\s+', '_', safe.strip())
    safe = safe.lower()
    # Limit length
    return safe[:50] if len(safe) > 50 else safe


def load_voices_config(config_path: str) -> Dict[str, Any]:
    """Load voice configuration from YAML file."""
    try:
        with open(config_path, 'r', encoding='utf-8') as f:
            return yaml.safe_load(f)
    except Exception as e:
        raise Exception(f"Failed to load voice config from {config_path}: {e}")


def ensure_directory(path: str) -> None:
    """Ensure directory exists, create if not."""
    Path(path).mkdir(parents=True, exist_ok=True)


def generate_content_hash(content: str, seed: int = None) -> str:
    """Generate a hash for content reproducibility."""
    to_hash = content
    if seed is not None:
        to_hash += str(seed)
    return hashlib.md5(to_hash.encode()).hexdigest()[:12]


def format_duration_mmss(seconds: float) -> str:
    """Format duration in MM:SS format."""
    minutes = int(seconds // 60)
    secs = int(seconds % 60)
    return f"{minutes:02d}:{secs:02d}"


def validate_audio_file(file_path: str) -> bool:
    """Check if audio file exists and is valid."""
    if not os.path.exists(file_path):
        return False
    
    # Basic file size check (should be > 1KB)
    try:
        size = os.path.getsize(file_path)
        return size > 1024
    except:
        return False


def create_output_filename(goal: str, topic: str, content_type: str) -> str:
    """Create standardized output filename."""
    safe_topic = sanitize_filename(topic)
    timestamp = format_duration_mmss(0)  # Placeholder, will be updated
    
    return f"{content_type}_{goal}_{safe_topic}_{timestamp}"


class ContentSanitizer:
    """Sanitizes content to ensure safety and appropriateness."""
    
    BLOCKED_TERMS = {
        # Adult content
        'adult', 'sexual', 'intimate', 'erotic', 'pornographic',
        # Violence
        'violent', 'killing', 'murder', 'weapon', 'gun', 'knife',
        # Inappropriate topics
        'gambling', 'drugs', 'alcohol', 'smoking',
        # Sensitive political/religious
        'political', 'religion', 'religious', 'politics'
    }
    
    SAFE_TOPICS = {
        'education', 'food', 'travel', 'work', 'family', 'hobbies',
        'sports', 'music', 'books', 'movies', 'shopping', 'health',
        'technology', 'science', 'nature', 'weather', 'culture',
        'art', 'cooking', 'fitness', 'learning', 'career'
    }
    
    @classmethod
    def is_safe_content(cls, text: str) -> bool:
        """Check if content is safe and appropriate."""
        text_lower = text.lower()
        
        # Check for blocked terms
        for term in cls.BLOCKED_TERMS:
            if term in text_lower:
                return False
        
        return True
    
    @classmethod
    def suggest_safe_topic(cls, original_topic: str) -> str:
        """Suggest a safe alternative topic."""
        # Simple mapping of potentially unsafe to safe topics
        safe_alternatives = {
            'party': 'celebration',
            'drink': 'beverage',
            'bar': 'restaurant',
            'club': 'social_group',
            'dating': 'friendship'
        }
        
        original_lower = original_topic.lower()
        for unsafe, safe in safe_alternatives.items():
            if unsafe in original_lower:
                return original_topic.replace(unsafe, safe)
        
        # If no specific mapping, return a default safe topic
        return 'daily_activities'


class ProgressTracker:
    """Track progress of audio generation pipeline."""
    
    def __init__(self):
        self.steps = []
        self.current_step = 0
        self.total_steps = 0
    
    def set_total_steps(self, total: int):
        """Set total number of steps."""
        self.total_steps = total
        self.steps = [''] * total
    
    def update_step(self, step_num: int, description: str):
        """Update progress for a specific step."""
        if 0 <= step_num < len(self.steps):
            self.steps[step_num] = description
            self.current_step = step_num
    
    def get_progress_percentage(self) -> float:
        """Get current progress as percentage."""
        if self.total_steps == 0:
            return 0.0
        return (self.current_step + 1) / self.total_steps * 100
    
    def print_progress(self):
        """Print current progress."""
        percentage = self.get_progress_percentage()
        current_desc = self.steps[self.current_step] if self.current_step < len(self.steps) else ""
        print(f"Progress: {percentage:.1f}% - {current_desc}")


class ConfigValidator:
    """Validates configuration files and parameters."""
    
    @classmethod
    def validate_cli_args(cls, args: Dict[str, Any]) -> List[str]:
        """Validate CLI arguments and return list of errors."""
        errors = []
        
        # Check required arguments
        required = ['goal', 'level', 'topic', 'duration_sec']
        for req in required:
            if req not in args or args[req] is None:
                errors.append(f"Missing required argument: {req}")
        
        # Validate goal
        valid_goals = ['general', 'toefl', 'ielts', 'pte', 'business']
        if args.get('goal') not in valid_goals:
            errors.append(f"Invalid goal. Must be one of: {valid_goals}")
        
        # Validate level  
        valid_levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2']
        if args.get('level') not in valid_levels:
            errors.append(f"Invalid level. Must be one of: {valid_levels}")
        
        # Validate duration
        duration = args.get('duration_sec', 0)
        if not isinstance(duration, int) or duration < 30 or duration > 600:
            errors.append("Duration must be integer between 30-600 seconds")
        
        # Validate vocab count
        vocab_count = args.get('vocab_count', 0)
        if not isinstance(vocab_count, int) or vocab_count < 1 or vocab_count > 50:
            errors.append("Vocab count must be integer between 1-50")
        
        return errors
    
    @classmethod
    def validate_voices_config(cls, config: Dict[str, Any]) -> List[str]:
        """Validate voices configuration."""
        errors = []
        
        if 'voices' not in config:
            errors.append("Missing 'voices' section in config")
            return errors
        
        voices = config['voices']
        for accent_code, voice_config in voices.items():
            if 'file' not in voice_config:
                errors.append(f"Missing 'file' for accent {accent_code}")
            
            if 'gender' not in voice_config:
                errors.append(f"Missing 'gender' for accent {accent_code}")
            elif voice_config['gender'] not in ['male', 'female']:
                errors.append(f"Invalid gender for {accent_code}: must be 'male' or 'female'")
        
        # Check accent policy
        if 'accent_policy' not in config:
            errors.append("Missing 'accent_policy' section in config")
        
        return errors


def create_srt_from_segments(segments: List[Dict[str, Any]], output_path: str) -> None:
    """Create SRT subtitle file from audio segments with timestamps."""
    with open(output_path, 'w', encoding='utf-8') as f:
        for i, segment in enumerate(segments, 1):
            start_time = segment.get('start', 0)
            end_time = segment.get('end', start_time + 3)
            text = segment.get('text', '')
            
            # Format timestamps as SRT format (HH:MM:SS,mmm)
            start_srt = format_timestamp_srt(start_time)
            end_srt = format_timestamp_srt(end_time)
            
            f.write(f"{i}\n")
            f.write(f"{start_srt} --> {end_srt}\n")
            f.write(f"{text}\n\n")


def format_timestamp_srt(seconds: float) -> str:
    """Format timestamp for SRT format."""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millisecs = int((seconds % 1) * 1000)
    
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millisecs:03d}"


def load_cefr_vocabulary(level: str) -> List[str]:
    """Load CEFR vocabulary list for the given level."""
    # This is a simplified vocabulary list
    # In a real implementation, this would load from comprehensive CEFR word lists
    vocab_lists = {
        'A1': ['hello', 'goodbye', 'please', 'thank', 'family', 'house', 'food', 'time', 'day', 'work'],
        'A2': ['friend', 'school', 'money', 'weather', 'travel', 'shopping', 'restaurant', 'hotel', 'train', 'bus'],
        'B1': ['experience', 'opinion', 'decision', 'situation', 'opportunity', 'environment', 'culture', 'society', 'government', 'education'],
        'B2': ['achievement', 'accommodation', 'administration', 'characteristic', 'concentration', 'consequences', 'establishment', 'investigation', 'relationship', 'responsibility'],
        'C1': ['anticipated', 'comprehensive', 'controversial', 'fundamental', 'implementation', 'methodology', 'phenomenon', 'predominantly', 'sophisticated', 'tremendous'],
        'C2': ['connotation', 'deteriorate', 'discrepancy', 'exemplified', 'inconsequential', 'meticulously', 'permeate', 'substantiate', 'ubiquitous', 'unprecedented']
    }
    
    return vocab_lists.get(level, vocab_lists['B1'])


def estimate_speech_duration(text: str, words_per_minute: int = 160) -> float:
    """Estimate speech duration based on word count."""
    word_count = len(text.split())
    return (word_count / words_per_minute) * 60