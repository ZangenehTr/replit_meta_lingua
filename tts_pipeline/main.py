#!/usr/bin/env python3
"""
Main CLI for accent-aware TTS/ASR pipeline with Coqui XTTS-v2 and Whisper.
"""
import os
import sys
import argparse
import json
import time
from pathlib import Path
from typing import Dict, Any, List

from utils import (
    load_voices_config, ensure_directory, generate_content_hash,
    format_duration_mmss, ContentSanitizer, ProgressTracker, 
    ConfigValidator, create_srt_from_segments
)
from policy import AccentPolicy, ContentGenerator
from synthesis import VoiceCloner, ConversationSynthesizer  
from mixing import ConversationMixer, AudioMastering
from qa import AudioQualityAnalyzer, QualityReporter
from asr_vocab import TranscriptionService, VocabularyExtractor, VocabularyAudioGenerator


class TTSPipeline:
    """Complete TTS/ASR pipeline orchestrator."""
    
    def __init__(self):
        self.progress = ProgressTracker()
        self.voice_cloner = None
        self.transcription_service = None
        self.config = {}
        
    def run_pipeline(self, args: Dict[str, Any]) -> bool:
        """Run the complete TTS/ASR pipeline."""
        
        start_time = time.time()
        
        try:
            # Setup progress tracking
            self.progress.set_total_steps(10)
            
            # Step 1: Validate inputs
            self.progress.update_step(0, "Validating inputs and configuration")
            if not self._validate_inputs(args):
                return False
            
            # Step 2: Initialize services
            self.progress.update_step(1, "Initializing TTS and ASR services")
            if not self._initialize_services(args):
                return False
            
            # Step 3: Generate content
            self.progress.update_step(2, "Generating conversation content")
            script, generation_params = self._generate_content(args)
            if not script:
                return False
            
            # Step 4: Select accents
            self.progress.update_step(3, "Selecting accents based on exam type")
            accent_mapping = self._select_accents(args, script)
            
            # Step 5: Synthesize conversation
            self.progress.update_step(4, "Synthesizing conversation audio")
            listening_audio_path = self._synthesize_conversation(script, accent_mapping, args)
            if not listening_audio_path:
                return False
            
            # Step 6: Quality check listening audio
            self.progress.update_step(5, "Analyzing listening audio quality")
            listening_qa = self._analyze_audio_quality(listening_audio_path, args)
            if not listening_qa['overall_pass']:
                print("✗ Listening audio failed quality checks")
                return False
            
            # Step 7: Transcribe for vocabulary
            self.progress.update_step(6, "Transcribing audio for vocabulary extraction")
            transcription = self._transcribe_audio(listening_audio_path)
            if not transcription or 'error' in transcription:
                print("✗ Audio transcription failed")
                return False
            
            # Step 8: Extract and generate vocabulary
            self.progress.update_step(7, "Extracting vocabulary and generating audio")
            vocab_audio_path = self._generate_vocabulary_audio(transcription, args)
            if not vocab_audio_path:
                print("Warning: Vocabulary audio generation failed, continuing...")
            
            # Step 9: Generate outputs
            self.progress.update_step(8, "Creating output files and reports")
            outputs = self._create_outputs(
                listening_audio_path, vocab_audio_path, transcription,
                listening_qa, generation_params, args
            )
            
            # Step 10: Final validation
            self.progress.update_step(9, "Final validation and cleanup")
            success = self._final_validation(outputs)
            
            # Report completion
            elapsed_time = time.time() - start_time
            if success:
                print(f"\n🎉 Pipeline completed successfully in {elapsed_time:.1f}s!")
                self._print_output_summary(outputs)
            else:
                print(f"\n❌ Pipeline failed after {elapsed_time:.1f}s")
            
            return success
            
        except KeyboardInterrupt:
            print("\n⏹️ Pipeline interrupted by user")
            return False
        except Exception as e:
            print(f"\n💥 Pipeline failed with error: {e}")
            import traceback
            traceback.print_exc()
            return False
    
    def _validate_inputs(self, args: Dict[str, Any]) -> bool:
        """Validate all input parameters."""
        
        print("Validating inputs...")
        
        # Validate CLI arguments
        validator = ConfigValidator()
        cli_errors = validator.validate_cli_args(args)
        if cli_errors:
            print("❌ CLI validation errors:")
            for error in cli_errors:
                print(f"  - {error}")
            return False
        
        # Load and validate voice configuration
        try:
            self.config = load_voices_config(args['voices'])
            config_errors = validator.validate_voices_config(self.config)
            if config_errors:
                print("❌ Voice config validation errors:")
                for error in config_errors:
                    print(f"  - {error}")
                return False
        except Exception as e:
            print(f"❌ Failed to load voice config: {e}")
            return False
        
        # Sanitize content
        if not ContentSanitizer.is_safe_content(args['topic']):
            safe_topic = ContentSanitizer.suggest_safe_topic(args['topic'])
            print(f"⚠️ Topic adjusted for safety: '{args['topic']}' → '{safe_topic}'")
            args['topic'] = safe_topic
        
        print("✅ Input validation passed")
        return True
    
    def _initialize_services(self, args: Dict[str, Any]) -> bool:
        """Initialize TTS and ASR services."""
        
        print("Initializing services...")
        
        try:
            # Initialize voice cloner
            self.voice_cloner = VoiceCloner()
            if self.voice_cloner.tts_model is None:
                print("❌ Failed to initialize TTS model")
                return False
            
            # Load reference voices
            voices_loaded = 0
            for accent_code, voice_config in self.config['voices'].items():
                voice_path = voice_config['file']
                if self.voice_cloner.load_reference_voice(voice_path, accent_code):
                    voices_loaded += 1
                else:
                    print(f"⚠️ Could not load voice for {accent_code}: {voice_path}")
            
            if voices_loaded == 0:
                print("❌ No reference voices loaded successfully")
                return False
            
            print(f"✅ Loaded {voices_loaded} reference voices")
            
            # Initialize transcription service
            self.transcription_service = TranscriptionService()
            if self.transcription_service.model is None:
                print("❌ Failed to initialize Whisper model")
                return False
            
            print("✅ Services initialized successfully")
            return True
            
        except Exception as e:
            print(f"❌ Service initialization failed: {e}")
            return False
    
    def _generate_content(self, args: Dict[str, Any]) -> tuple[List[Dict[str, Any]], Dict[str, Any]]:
        """Generate conversation content."""
        
        print(f"Generating content for topic: '{args['topic']}'")
        
        try:
            # Generate conversation script
            script = ContentGenerator.generate_conversation_script(
                topic=args['topic'],
                level=args['level'],
                goal=args['goal'],
                duration_sec=args['duration_sec'],
                num_speakers=2,  # Default to 2 speakers
                seed=args.get('seed')
            )
            
            if not script:
                print("❌ Failed to generate conversation script")
                return None, {}
            
            generation_params = {
                'topic': args['topic'],
                'level': args['level'], 
                'goal': args['goal'],
                'target_duration': args['duration_sec'],
                'speakers': len(set(turn['speaker'] for turn in script)),
                'turns': len(script),
                'seed': args.get('seed'),
                'generation_timestamp': time.time()
            }
            
            print(f"✅ Generated {len(script)} conversation turns")
            return script, generation_params
            
        except Exception as e:
            print(f"❌ Content generation failed: {e}")
            return None, {}
    
    def _select_accents(self, args: Dict[str, Any], script: List[Dict[str, Any]]) -> Dict[int, str]:
        """Select accents for speakers based on exam type."""
        
        print(f"Selecting accents for {args['goal']} exam")
        
        try:
            # Get unique speakers
            speakers = list(set(turn['speaker'] for turn in script))
            
            # Select accents based on policy
            selected_accents = AccentPolicy.select_accents_for_listening(
                goal=args['goal'],
                num_speakers=len(speakers),
                seed=args.get('seed')
            )
            
            # Create mapping
            accent_mapping = {}
            for i, speaker_id in enumerate(speakers):
                accent_code = selected_accents[i] if i < len(selected_accents) else selected_accents[0]
                accent_mapping[speaker_id] = accent_code
                print(f"  Speaker {speaker_id}: {accent_code}")
            
            return accent_mapping
            
        except Exception as e:
            print(f"❌ Accent selection failed: {e}")
            return {}
    
    def _synthesize_conversation(self, script: List[Dict[str, Any]], 
                               accent_mapping: Dict[int, str],
                               args: Dict[str, Any]) -> str:
        """Synthesize the complete conversation."""
        
        print("Synthesizing conversation audio...")
        
        try:
            # Create output directory
            output_dir = Path("out")
            ensure_directory(str(output_dir))
            
            # Generate filename
            topic_safe = args['topic'].replace(' ', '_')[:20]
            timestamp = int(time.time())
            listening_filename = f"listening_{args['goal']}_{topic_safe}_{timestamp}.wav"
            listening_path = output_dir / listening_filename
            
            # Synthesize conversation
            synthesizer = ConversationSynthesizer(self.voice_cloner)
            success = synthesizer.synthesize_conversation(
                script=script,
                accent_mapping=accent_mapping,
                output_path=str(listening_path)
            )
            
            if not success:
                print("❌ Conversation synthesis failed")
                return None
            
            print(f"✅ Conversation synthesized: {listening_filename}")
            return str(listening_path)
            
        except Exception as e:
            print(f"❌ Conversation synthesis error: {e}")
            return None
    
    def _analyze_audio_quality(self, audio_path: str, args: Dict[str, Any]) -> Dict[str, Any]:
        """Analyze audio quality."""
        
        print("Analyzing audio quality...")
        
        try:
            analyzer = AudioQualityAnalyzer()
            qa_results = analyzer.analyze_audio_quality(audio_path)
            
            # Print summary
            QualityReporter.print_qa_summary(qa_results)
            
            return qa_results
            
        except Exception as e:
            print(f"❌ Quality analysis failed: {e}")
            return {'overall_pass': False, 'error': str(e)}
    
    def _transcribe_audio(self, audio_path: str) -> Dict[str, Any]:
        """Transcribe audio for vocabulary extraction."""
        
        print("Transcribing audio...")
        
        try:
            transcription = self.transcription_service.transcribe_audio(audio_path)
            
            if 'error' in transcription:
                print(f"❌ Transcription error: {transcription['error']}")
                return None
            
            word_count = len(transcription.get('text', '').split())
            print(f"✅ Transcribed {word_count} words")
            
            return transcription
            
        except Exception as e:
            print(f"❌ Transcription failed: {e}")
            return None
    
    def _generate_vocabulary_audio(self, transcription: Dict[str, Any], 
                                 args: Dict[str, Any]) -> str:
        """Extract vocabulary and generate audio."""
        
        print("Generating vocabulary audio...")
        
        try:
            # Extract vocabulary
            extractor = VocabularyExtractor()
            vocabulary_items = extractor.extract_vocabulary(
                transcription=transcription,
                target_level=args['level'],
                vocab_count=args['vocab_count']
            )
            
            if not vocabulary_items:
                print("❌ No vocabulary items extracted")
                return None
            
            # Select accent for vocabulary
            vocab_accent = AccentPolicy.select_accent_for_vocabulary(
                goal=args['goal'], 
                seed=args.get('seed')
            )
            
            # Generate vocabulary audio
            output_dir = Path("out")
            topic_safe = args['topic'].replace(' ', '_')[:20]
            timestamp = int(time.time())
            vocab_filename = f"vocab_{args['goal']}_{topic_safe}_{timestamp}.mp3"
            vocab_path = output_dir / vocab_filename
            
            generator = VocabularyAudioGenerator(self.voice_cloner)
            success = generator.generate_vocabulary_audio(
                vocabulary_items=vocabulary_items,
                accent_code=vocab_accent,
                l1_language=args.get('l1', 'other'),
                target_level=args['level'],
                output_path=str(vocab_path)
            )
            
            if success:
                print(f"✅ Vocabulary audio created: {vocab_filename}")
                return str(vocab_path)
            else:
                print("❌ Vocabulary audio generation failed")
                return None
                
        except Exception as e:
            print(f"❌ Vocabulary generation error: {e}")
            return None
    
    def _create_outputs(self, listening_path: str, vocab_path: str,
                       transcription: Dict[str, Any], qa_results: Dict[str, Any],
                       generation_params: Dict[str, Any], args: Dict[str, Any]) -> Dict[str, str]:
        """Create all output files."""
        
        print("Creating output files...")
        
        try:
            output_dir = Path("out")
            topic_safe = args['topic'].replace(' ', '_')[:20]
            timestamp = int(time.time())
            base_name = f"{args['goal']}_{topic_safe}_{timestamp}"
            
            outputs = {}
            
            # Master the listening audio to MP3
            if listening_path:
                listening_mp3 = output_dir / f"listening_{base_name}.mp3"
                mastering_result = AudioMastering.master_audio(
                    input_path=listening_path,
                    output_path=str(listening_mp3),
                    target_lufs=-18.0
                )
                
                if mastering_result.get('success', False):
                    outputs['listening_audio'] = str(listening_mp3)
                    print(f"✅ Mastered listening audio: {listening_mp3.name}")
                else:
                    outputs['listening_audio'] = listening_path
            
            # Copy vocabulary audio
            if vocab_path:
                outputs['vocabulary_audio'] = vocab_path
            
            # Create SRT transcript
            if transcription:
                srt_path = output_dir / f"transcript_{base_name}.srt"
                create_srt_from_segments(
                    transcription.get('segments', []),
                    str(srt_path)
                )
                outputs['transcript'] = str(srt_path)
                print(f"✅ Created transcript: {srt_path.name}")
            
            # Create comprehensive report
            report_path = output_dir / f"report_{base_name}.json"
            report = QualityReporter.generate_qa_report(
                analysis_results=qa_results,
                generation_params=generation_params,
                output_path=str(report_path)
            )
            outputs['report'] = str(report_path)
            
            return outputs
            
        except Exception as e:
            print(f"❌ Output creation failed: {e}")
            return {}
    
    def _final_validation(self, outputs: Dict[str, str]) -> bool:
        """Perform final validation of all outputs."""
        
        print("Performing final validation...")
        
        try:
            required_outputs = ['listening_audio', 'report']
            missing_outputs = []
            
            for output_type in required_outputs:
                if output_type not in outputs:
                    missing_outputs.append(output_type)
                else:
                    output_path = outputs[output_type]
                    if not os.path.exists(output_path):
                        missing_outputs.append(f"{output_type} (file not found)")
            
            if missing_outputs:
                print(f"❌ Missing required outputs: {missing_outputs}")
                return False
            
            print("✅ Final validation passed")
            return True
            
        except Exception as e:
            print(f"❌ Final validation error: {e}")
            return False
    
    def _print_output_summary(self, outputs: Dict[str, str]):
        """Print summary of generated outputs."""
        
        print("\n" + "="*60)
        print("🎯 GENERATED OUTPUTS")
        print("="*60)
        
        for output_type, output_path in outputs.items():
            if os.path.exists(output_path):
                file_size = os.path.getsize(output_path)
                size_mb = file_size / (1024 * 1024)
                print(f"📁 {output_type.title()}: {Path(output_path).name} ({size_mb:.1f} MB)")
            else:
                print(f"❌ {output_type.title()}: Missing")
        
        print("="*60)
        print("🚀 Ready for deployment!")


def parse_arguments():
    """Parse command line arguments."""
    
    parser = argparse.ArgumentParser(
        description="Accent-aware TTS/ASR pipeline for language learning",
        formatter_class=argparse.RawDescriptionHelpFormatter,
        epilog="""
Examples:
  # IELTS listening practice
  python main.py --goal ielts --level B2 --l1 fa --topic "hotel booking" --duration_sec 120 --vocab_count 10
  
  # TOEFL campus conversation  
  python main.py --goal toefl --level B1 --l1 other --topic "campus library" --duration_sec 90 --vocab_count 8
  
  # Business meeting
  python main.py --goal business --level C1 --l1 ar --topic "quarterly review" --duration_sec 150 --vocab_count 12
        """
    )
    
    # Required arguments
    parser.add_argument('--goal', 
                       choices=['general', 'toefl', 'ielts', 'pte', 'business'],
                       required=True,
                       help='Target exam type or general purpose')
    
    parser.add_argument('--level',
                       choices=['A1', 'A2', 'B1', 'B2', 'C1', 'C2'], 
                       required=True,
                       help='CEFR level of the learner')
    
    parser.add_argument('--topic', 
                       type=str, required=True,
                       help='Conversation topic (e.g., "restaurant booking")')
    
    parser.add_argument('--duration_sec',
                       type=int, required=True,
                       help='Target audio duration in seconds (30-600)')
    
    # Optional arguments
    parser.add_argument('--l1',
                       choices=['fa', 'ar', 'other'],
                       default='other',
                       help='Learner\'s first language for translations')
    
    parser.add_argument('--vocab_count',
                       type=int, default=10,
                       help='Number of vocabulary items to extract (1-50)')
    
    parser.add_argument('--seed',
                       type=int, default=None,
                       help='Random seed for reproducible generation')
    
    parser.add_argument('--voices',
                       type=str, default='voices.yaml',
                       help='Path to voice configuration file')
    
    return parser.parse_args()


def main():
    """Main entry point."""
    
    print("🎤 Accent-Aware TTS/ASR Pipeline")
    print("="*50)
    
    # Parse arguments
    args = parse_arguments()
    args_dict = vars(args)
    
    # Validate Python environment
    try:
        import TTS
        import whisper
        print("✅ Required packages available")
    except ImportError as e:
        print(f"❌ Missing required packages: {e}")
        print("Please install with: pip install -r requirements.txt")
        sys.exit(1)
    
    # Run pipeline
    pipeline = TTSPipeline()
    success = pipeline.run_pipeline(args_dict)
    
    # Exit with appropriate code
    sys.exit(0 if success else 1)


if __name__ == "__main__":
    main()