#!/usr/bin/env python3
"""
Professional IELTS Audio Generator - Main Script
Supports both development (online) and production (offline) modes
"""
import asyncio
import logging
import argparse
import sys
from pathlib import Path

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Add tts_system to path
sys.path.append(str(Path(__file__).parent))

from tts_system.ielts_generator import IELTSAudioGenerator
from tts_system.tts_interface import TTSManager


async def main():
    """Main function to generate IELTS audio"""
    
    parser = argparse.ArgumentParser(description="Generate professional IELTS Section 1 audio")
    parser.add_argument(
        '--mode', 
        choices=['dev', 'production', 'auto'], 
        default='auto',
        help='Generation mode: dev (online), production (offline only), auto (best available)'
    )
    parser.add_argument(
        '--conversation', 
        choices=['swimming_lesson'], 
        default='swimming_lesson',
        help='Conversation type to generate'
    )
    parser.add_argument(
        '--output-dir',
        default='ielts_audio_final',
        help='Output directory for generated audio'
    )
    parser.add_argument(
        '--test',
        action='store_true',
        help='Run system tests before generation'
    )
    
    args = parser.parse_args()
    
    print("🎧 Professional IELTS Audio Generator")
    print("=" * 50)
    
    # Run tests if requested
    if args.test:
        print("🧪 Running system tests...")
        import subprocess
        try:
            # Run tests
            result = subprocess.run([
                sys.executable, '-m', 'pytest', 
                'tests/test_tts_system.py', 
                '-v', '--tb=short'
            ], capture_output=True, text=True)
            
            print("📊 Test Results:")
            print(result.stdout)
            if result.stderr:
                print("⚠️ Test Warnings:")
                print(result.stderr)
                
            if result.returncode != 0:
                print("❌ Tests failed! Continuing anyway...")
            else:
                print("✅ All tests passed!")
                
        except Exception as e:
            print(f"⚠️ Could not run tests: {e}")
    
    print(f"\n🎯 Mode: {args.mode}")
    print(f"📝 Conversation: {args.conversation}")
    print(f"📁 Output: {args.output_dir}")
    
    # Initialize TTS system
    print("\n🎤 Initializing TTS system...")
    tts_manager = TTSManager()
    
    # Show available engines
    engine_info = tts_manager.get_engine_info()
    print(f"\n📊 TTS Engine Status:")
    print(f"   Preferred: {engine_info.get('preferred_engine', 'None')}")
    print(f"   Fallback: {engine_info.get('fallback_engine', 'None')}")
    print(f"   Offline engines: {', '.join(engine_info['offline_engines'])}")
    print(f"   High quality: {', '.join(engine_info['high_quality_engines'])}")
    
    # Determine generation mode
    use_offline_only = False
    if args.mode == 'production':
        use_offline_only = True
        print("\n🇮🇷 Production mode: Using offline engines only")
    elif args.mode == 'dev':
        use_offline_only = False
        print("\n🔗 Development mode: Using best available engines")
    else:  # auto mode
        # Auto-detect based on available engines
        has_online = any(not e['is_offline'] for e in engine_info['available_engines'])
        has_offline = len(engine_info['offline_engines']) > 0
        
        if has_online and not has_offline:
            use_offline_only = False
            print("\n🔗 Auto mode: Using online engines (offline not available)")
        elif has_offline:
            use_offline_only = True
            print("\n🇮🇷 Auto mode: Using offline engines (Iranian production ready)")
        else:
            print("\n❌ No suitable TTS engines available!")
            return 1
    
    # Generate IELTS audio
    print(f"\n🎵 Generating IELTS Section 1 audio...")
    
    try:
        generator = IELTSAudioGenerator(output_dir=args.output_dir)
        
        metadata = await generator.generate_section1_conversation(
            conversation_type=args.conversation,
            use_offline_only=use_offline_only
        )
        
        print(f"\n✅ Generation completed successfully!")
        print(f"📊 Statistics:")
        print(f"   Total segments: {metadata['total_segments']}")
        print(f"   Successful: {metadata['successful_segments']}")
        print(f"   Engine used: {metadata['engine_used']}")
        print(f"   Offline compatible: {'✅ Yes' if metadata['is_offline_compatible'] else '❌ No'}")
        
        print(f"\n🎯 Output files:")
        print(f"   📁 Audio directory: {args.output_dir}/")
        print(f"   🌐 HTML player: {metadata['html_player']}")
        print(f"   📄 Metadata: {args.output_dir}/metadata.json")
        
        if metadata['is_offline_compatible']:
            print(f"\n🇮🇷 Iranian Production Status:")
            print(f"   ✅ Fully offline - no external dependencies")
            print(f"   ✅ Self-hosted audio generation")
            print(f"   ✅ Ready for Iranian deployment")
        else:
            print(f"\n🔗 Development Status:")
            print(f"   ⚠️  Online dependencies required")
            print(f"   ⚠️  Not suitable for Iranian production")
            print(f"   💡 Run with --mode production for offline version")
        
        return 0
        
    except Exception as e:
        logger.error(f"❌ Generation failed: {e}")
        print(f"\n❌ Error: {e}")
        return 1


if __name__ == "__main__":
    try:
        exit_code = asyncio.run(main())
        sys.exit(exit_code)
    except KeyboardInterrupt:
        print("\n⏹️  Generation interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {e}")
        sys.exit(1)