"""
IELTS Section 2 Generator - Simplified version without Bark dependency
Generate single continuous monologue files for authenticity comparison
"""

import asyncio
import json
import logging
from pathlib import Path
from typing import Dict, Any
import sys
import os

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

# Import existing working generators
from tts_system.ielts_generator import IELTSAudioGenerator

class IELTSSection2Generator:
    """Simplified Section 2 generator using existing infrastructure"""
    
    def __init__(self):
        self.generator = IELTSAudioGenerator()
        
    def get_section2_content(self) -> Dict[str, Any]:
        """Get authentic IELTS Section 2 content - Environmental topic"""
        return {
            "section": "Section 2",
            "format": "Monologue",
            "topic": "Environmental Initiatives at University",
            "speaker": "University Sustainability Officer (Sarah Martinez)",
            "duration_target": "2-3 minutes",
            "introduction": "You will hear a talk by the University Sustainability Officer about new environmental initiatives on campus.",
            
            "full_monologue": """Good morning, students. I'm Sarah Martinez, the University Sustainability Officer, and I'm here today to tell you about some exciting new environmental initiatives that we're launching this semester at Greenfield University.

First of all, I want to talk about our new campus-wide recycling program. Starting next Monday, you'll notice new recycling bins throughout the campus. These aren't just your ordinary bins - they're smart bins equipped with sensors that can sort different types of materials automatically. You'll find separate compartments for paper, plastic, glass, and organic waste. The bins are strategically placed in all academic buildings, dormitories, and common areas, including the library, student center, and dining halls.

The second initiative I'd like to highlight is our bike-sharing program. We've partnered with EcoRide to provide 200 bicycles available for student use completely free of charge. You can find bike stations at five key locations around campus: the main entrance, the sports complex, the library, the science building, and the student accommodation area. To use a bike, simply download the EcoRide app, scan the QR code on any available bicycle, and you're ready to go. Each bike can be used for up to two hours at a time, and you can return it to any of the five stations.

Our third major project focuses on energy conservation in student accommodation. We're installing solar panels on all dormitory rooftops, which will generate approximately 40% of the electricity needed for these buildings. Additionally, we're upgrading all windows to double-glazed energy-efficient ones and installing smart heating systems that automatically adjust temperature based on occupancy and weather conditions.

Now, let me tell you about our green spaces initiative. We're creating three new community gardens where students can grow their own vegetables and herbs. The gardens will be located behind the library, next to the sports complex, and in the central courtyard area. Each student can reserve a small plot for the academic year at no cost. We'll provide all the basic tools, seeds, and guidance you need to get started. This is a fantastic opportunity to learn about sustainable agriculture while enjoying fresh, organic produce.

Finally, I want to mention our new Environmental Club, which meets every Thursday at 6 PM in room 205 of the student center. The club organizes various activities throughout the year, including tree-planting events, campus clean-up days, and educational workshops on topics like composting and energy conservation. Membership is open to all students, and no previous experience with environmental issues is required.

To support all these initiatives, we've also launched a points-based reward system called Green Points. You earn points for participating in environmental activities - using the bike-sharing program, properly sorting your recyclables, joining club events, or maintaining a community garden plot. These points can be redeemed for various rewards, including discounts at the campus bookstore, free meals at the cafeteria, and even priority registration for popular courses.

If you have any questions about these programs or would like to get involved, please don't hesitate to contact me. My office is located on the second floor of the administration building, room 214, and my office hours are Monday through Friday from 9 AM to 4 PM. You can also email me at s.martinez@greenfield.edu.

Thank you for your attention, and I look forward to seeing your participation in making our campus more environmentally friendly.""",
            
            "metadata": {
                "word_count": 518,
                "estimated_duration_minutes": 2.8,
                "complexity_level": "IELTS Band 6-7",
                "topic_category": "Environment and Education",
                "speaker_profile": "Professional female, informative, encouraging",
                "key_numbers": ["200 bicycles", "5 stations", "2 hours", "40%", "3 gardens", "Thursday 6 PM", "room 205", "room 214", "9 AM to 4 PM"],
                "listening_skills_tested": [
                    "Following a structured presentation",
                    "Understanding specific details and numbers", 
                    "Identifying location and time information",
                    "Comprehending program benefits and requirements"
                ]
            }
        }
    
    async def generate_single_file(self, engine_mode: str = "online") -> Dict[str, Any]:
        """Generate Section 2 as single continuous file"""
        try:
            content = self.get_section2_content()
            
            # Create output directory
            output_dir = f"ielts_section2_{engine_mode}"
            Path(output_dir).mkdir(exist_ok=True)
            
            # Configure for continuous generation
            if engine_mode == "online":
                voice_config = {
                    "voice": "en-GB-SoniaNeural",
                    "engine": "edge_tts",
                    "quality": "professional"
                }
                output_file = Path(output_dir) / "ielts_section2_environmental_initiatives_edge.wav"
            else:  # offline
                voice_config = {
                    "voice": "female",
                    "engine": "pyttsx3", 
                    "quality": "standard"
                }
                output_file = Path(output_dir) / "ielts_section2_environmental_initiatives_offline.wav"
            
            logger.info(f"🎤 Generating IELTS Section 2 - {engine_mode} mode")
            logger.info(f"📝 Monologue length: {len(content['full_monologue'])} characters")
            logger.info(f"🎯 Target duration: {content['metadata']['estimated_duration_minutes']} minutes")
            
            # Generate single continuous audio using TTS manager directly
            from tts_system.tts_interface import TTSManager, TTSEngine
            tts_manager = TTSManager()
            
            target_engine = TTSEngine.EDGE_TTS if engine_mode == "online" else TTSEngine.PYTTSX3
            
            result = await tts_manager.synthesize(
                text=content['full_monologue'],
                output_file=output_file,
                engine=target_engine,
                voice=voice_config['voice']
            )
            
            if result['success']:
                # Create metadata file
                metadata = {
                    **content,
                    "audio_generation": {
                        "engine": voice_config['engine'],
                        "voice_used": voice_config['voice'],
                        "file_path": str(output_file),
                        "quality": voice_config['quality'],
                        "mode": engine_mode,
                        "iranian_compliant": engine_mode == "offline",
                        "continuous_format": True,
                        "authentic_timing": True
                    }
                }
                
                metadata_file = Path(output_dir) / f"section2_metadata_{engine_mode}.json"
                with open(metadata_file, 'w', encoding='utf-8') as f:
                    json.dump(metadata, f, indent=2, ensure_ascii=False)
                
                logger.info(f"✅ Section 2 generated successfully!")
                logger.info(f"📁 Audio: {output_file}")
                logger.info(f"📊 Metadata: {metadata_file}")
                
                return {
                    "success": True,
                    "audio_file": str(output_file),
                    "metadata_file": str(metadata_file),
                    "engine": voice_config['engine'],
                    "mode": engine_mode
                }
            else:
                logger.error(f"❌ Generation failed: {result.get('error', 'Unknown error')}")
                return {"success": False, "error": result.get('error', 'Unknown error')}
                
        except Exception as e:
            logger.error(f"❌ Section 2 generation failed: {e}")
            return {"success": False, "error": str(e)}
    
    async def generate_comparison_set(self) -> Dict[str, Any]:
        """Generate both online and offline versions for comparison"""
        logger.info("🎯 Generating IELTS Section 2 comparison set...")
        
        results = {}
        
        # Generate online version (Edge TTS)
        logger.info("🔄 Generating online version (Edge TTS)...")
        online_result = await self.generate_single_file("online")
        results["online"] = online_result
        
        # Generate offline version (pyttsx3)
        logger.info("🔄 Generating offline version (pyttsx3)...")
        offline_result = await self.generate_single_file("offline")
        results["offline"] = offline_result
        
        # Summary
        successful = [mode for mode, result in results.items() if result['success']]
        
        logger.info(f"\n📊 Generation Summary:")
        logger.info(f"✅ Successful generations: {len(successful)}")
        logger.info(f"📁 Audio files created: {successful}")
        
        return {
            "modes_tested": list(results.keys()),
            "successful_modes": successful,
            "results": results,
            "comparison_ready": len(successful) >= 2
        }


async def main():
    """Main execution function"""
    print("🎧 IELTS Section 2 Generator")
    print("============================")
    print("Creating authentic monologue audio for test comparison")
    print("📝 Topic: Environmental Initiatives at University")
    print("👩‍💼 Speaker: University Sustainability Officer")
    print("⏱️ Duration: ~2-3 minutes continuous")
    print()
    
    generator = IELTSSection2Generator()
    
    # Generate comparison set
    results = await generator.generate_comparison_set()
    
    if results['comparison_ready']:
        print("\n🎉 IELTS Section 2 audio files generated successfully!")
        print("📁 Ready for authenticity comparison with real IELTS tests")
        print()
        
        for mode in results['successful_modes']:
            mode_result = results['results'][mode]
            engine = mode_result.get('engine', 'unknown')
            print(f"   • {mode.title()} ({engine}): Single continuous file")
            
        print("\n🔗 Access files:")
        if "online" in results['successful_modes']:
            print("   📱 Online version: ielts_section2_online/ielts_section2_environmental_initiatives_edge.wav")
        if "offline" in results['successful_modes']:
            print("   🇮🇷 Offline version: ielts_section2_offline/ielts_section2_environmental_initiatives_offline.wav")
    else:
        print("\n❌ Generation incomplete - check logs for details")


if __name__ == "__main__":
    asyncio.run(main())