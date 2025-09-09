"""
IELTS Section 2 Generator - Authentic monologue format
Single continuous file generation for real test authenticity comparison
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Any, List
import sys
import os

# Add the tts_system to path
sys.path.append(os.path.join(os.path.dirname(__file__), '.'))

from tts_system.tts_interface import TTSManager, TTSEngine

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class IELTSSection2Generator:
    """Generator for IELTS Section 2 monologue audio"""
    
    def __init__(self):
        self.tts_manager = TTSManager()
        
    def get_section2_content(self) -> Dict[str, Any]:
        """Get authentic IELTS Section 2 content - Environmental topic"""
        return {
            "section": "Section 2",
            "format": "Monologue",
            "topic": "Environmental Initiatives at University",
            "speaker": "University Sustainability Officer",
            "duration_target": "2-3 minutes",
            "introduction": "You will hear a talk by the University Sustainability Officer about new environmental initiatives on campus.",
            
            "full_text": """
            Good morning, students. I'm Sarah Martinez, the University Sustainability Officer, and I'm here today to tell you about some exciting new environmental initiatives that we're launching this semester at Greenfield University.

            First of all, I want to talk about our new campus-wide recycling program. Starting next Monday, you'll notice new recycling bins throughout the campus. These aren't just your ordinary bins - they're smart bins equipped with sensors that can sort different types of materials automatically. You'll find separate compartments for paper, plastic, glass, and organic waste. The bins are strategically placed in all academic buildings, dormitories, and common areas, including the library, student center, and dining halls.

            The second initiative I'd like to highlight is our bike-sharing program. We've partnered with EcoRide to provide 200 bicycles available for student use completely free of charge. You can find bike stations at five key locations around campus: the main entrance, the sports complex, the library, the science building, and the student accommodation area. To use a bike, simply download the EcoRide app, scan the QR code on any available bicycle, and you're ready to go. Each bike can be used for up to two hours at a time, and you can return it to any of the five stations.

            Our third major project focuses on energy conservation in student accommodation. We're installing solar panels on all dormitory rooftops, which will generate approximately 40% of the electricity needed for these buildings. Additionally, we're upgrading all windows to double-glazed energy-efficient ones and installing smart heating systems that automatically adjust temperature based on occupancy and weather conditions.

            Now, let me tell you about our green spaces initiative. We're creating three new community gardens where students can grow their own vegetables and herbs. The gardens will be located behind the library, next to the sports complex, and in the central courtyard area. Each student can reserve a small plot for the academic year at no cost. We'll provide all the basic tools, seeds, and guidance you need to get started. This is a fantastic opportunity to learn about sustainable agriculture while enjoying fresh, organic produce.

            Finally, I want to mention our new Environmental Club, which meets every Thursday at 6 PM in room 205 of the student center. The club organizes various activities throughout the year, including tree-planting events, campus clean-up days, and educational workshops on topics like composting and energy conservation. Membership is open to all students, and no previous experience with environmental issues is required.

            To support all these initiatives, we've also launched a points-based reward system called Green Points. You earn points for participating in environmental activities - using the bike-sharing program, properly sorting your recyclables, joining club events, or maintaining a community garden plot. These points can be redeemed for various rewards, including discounts at the campus bookstore, free meals at the cafeteria, and even priority registration for popular courses.

            If you have any questions about these programs or would like to get involved, please don't hesitate to contact me. My office is located on the second floor of the administration building, room 214, and my office hours are Monday through Friday from 9 AM to 4 PM. You can also email me at s.martinez@greenfield.edu.

            Thank you for your attention, and I look forward to seeing your participation in making our campus more environmentally friendly.
            """.strip(),
            
            "metadata": {
                "word_count": 518,
                "estimated_duration_minutes": 2.8,
                "complexity_level": "IELTS Band 6-7",
                "topic_category": "Environment and Education",
                "speaker_profile": "Professional, informative, encouraging",
                "key_vocabulary": [
                    "sustainability", "initiatives", "recycling", "sensors", "compartments",
                    "strategically", "accommodation", "conservation", "solar panels",
                    "double-glazed", "occupancy", "organic", "composting", "priority"
                ],
                "listening_skills_tested": [
                    "Following a structured presentation",
                    "Understanding specific details and numbers",
                    "Identifying location and time information",
                    "Comprehending program benefits and requirements"
                ]
            }
        }
    
    async def generate_section2_audio(self, engine: TTSEngine, output_dir: str = "ielts_section2_audio") -> Dict[str, Any]:
        """
        Generate IELTS Section 2 as single continuous audio file
        
        Args:
            engine: TTS engine to use
            output_dir: Directory to save audio files
            
        Returns:
            Dict with generation results
        """
        try:
            # Create output directory
            Path(output_dir).mkdir(exist_ok=True)
            
            # Get section content
            content = self.get_section2_content()
            
            # Engine-specific configuration
            engine_configs = {
                TTSEngine.EDGE_TTS: {
                    "voice": "en-GB-SoniaNeural",
                    "speaker_type": "professional_female",
                    "suffix": "edge_tts"
                },
                TTSEngine.BARK: {
                    "voice": "en_speaker_5",  # Professional female
                    "speaker_type": "professional_female",
                    "suffix": "bark"
                },
                TTSEngine.PYTTSX3: {
                    "voice": "female",
                    "speaker_type": "professional_female", 
                    "suffix": "pyttsx3"
                }
            }
            
            config = engine_configs.get(engine, engine_configs[TTSEngine.PYTTSX3])
            
            # Output file
            output_file = Path(output_dir) / f"ielts_section2_environmental_initiatives_{config['suffix']}.wav"
            
            logger.info(f"🎤 Generating IELTS Section 2 with {engine.value}...")
            logger.info(f"📝 Text length: {len(content['full_text'])} characters")
            logger.info(f"🎯 Target duration: {content['metadata']['estimated_duration_minutes']} minutes")
            
            # Generate single continuous audio file
            result = await self.tts_manager.synthesize(
                text=content['full_text'],
                output_file=output_file,
                engine=engine,
                voice=config['voice'],
                speaker_type=config['speaker_type']
            )
            
            if result['success']:
                # Create metadata file
                metadata = {
                    **content,
                    "audio_generation": {
                        "engine": engine.value,
                        "voice_used": result.get('voice_used', config['voice']),
                        "file_path": str(output_file),
                        "duration_seconds": result.get('duration', 0),
                        "quality": result.get('quality', 'unknown'),
                        "sample_rate": result.get('sample_rate', 'unknown'),
                        "generation_time": result.get('generation_time', 'unknown'),
                        "is_offline": result.get('is_offline', False)
                    }
                }
                
                metadata_file = Path(output_dir) / f"ielts_section2_metadata_{config['suffix']}.json"
                with open(metadata_file, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                
                logger.info(f"✅ Section 2 generated successfully!")
                logger.info(f"📁 Audio: {output_file}")
                logger.info(f"📊 Metadata: {metadata_file}")
                logger.info(f"⏱️ Duration: {result.get('duration', 'unknown')} seconds")
                
                return {
                    "success": True,
                    "audio_file": str(output_file),
                    "metadata_file": str(metadata_file),
                    "engine": engine.value,
                    "duration": result.get('duration', 0),
                    "quality": result.get('quality', 'unknown')
                }
            else:
                logger.error(f"❌ Failed to generate audio: {result.get('error', 'Unknown error')}")
                return {"success": False, "error": result.get('error', 'Unknown error')}
                
        except Exception as e:
            logger.error(f"❌ Generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def generate_comparison_set(self) -> Dict[str, Any]:
        """Generate Section 2 with multiple engines for comparison"""
        logger.info("🎯 Generating IELTS Section 2 comparison set...")
        
        engines_to_test = [TTSEngine.EDGE_TTS, TTSEngine.PYTTSX3]
        
        # Add Bark if available (handle potential import issues)
        try:
            engines_to_test.insert(1, TTSEngine.BARK)  # Insert Bark between Edge and pyttsx3
        except:
            logger.warning("⚠️ Bark engine not available, skipping")
        
        results = {}
        
        for engine in engines_to_test:
            if engine in self.tts_manager.providers:
                logger.info(f"🔄 Generating with {engine.value}...")
                result = await self.generate_section2_audio(engine)
                results[engine.value] = result
            else:
                logger.warning(f"⚠️ {engine.value} not available")
                results[engine.value] = {"success": False, "error": "Engine not available"}
        
        # Summary
        successful_engines = [engine for engine, result in results.items() if result['success']]
        
        logger.info(f"\n📊 Generation Summary:")
        logger.info(f"✅ Successful engines: {len(successful_engines)}")
        logger.info(f"📁 Audio files created: {successful_engines}")
        
        return {
            "engines_tested": list(results.keys()),
            "successful_engines": successful_engines,
            "results": results,
            "comparison_ready": len(successful_engines) >= 2
        }


async def main():
    """Main execution function"""
    print("🎧 IELTS Section 2 Generator")
    print("===========================")
    print("Creating authentic monologue audio for test comparison")
    print()
    
    generator = IELTSSection2Generator()
    
    # Generate comparison set
    results = await generator.generate_comparison_set()
    
    if results['comparison_ready']:
        print("\n🎉 IELTS Section 2 audio files generated successfully!")
        print("📁 Files ready for authenticity comparison")
        
        for engine in results['successful_engines']:
            engine_result = results['results'][engine]
            duration_min = engine_result.get('duration', 0) / 60 if engine_result.get('duration') else 0
            print(f"   • {engine}: {duration_min:.1f} minutes, {engine_result.get('quality', 'N/A')} quality")
    else:
        print("\n❌ Generation incomplete - check logs for details")


if __name__ == "__main__":
    asyncio.run(main())