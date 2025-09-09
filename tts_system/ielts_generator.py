"""
Professional IELTS Audio Generator using the TTS system
Supports both development (high quality) and production (offline) modes
"""
import asyncio
import json
from pathlib import Path
from typing import List, Dict, Any, Optional
import logging
from datetime import datetime

from .tts_interface import TTSManager, TTSEngine

logger = logging.getLogger(__name__)


class IELTSAudioGenerator:
    """Professional IELTS audio generator with hybrid TTS support"""
    
    def __init__(self, output_dir: str = "ielts_audio"):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(exist_ok=True)
        self.tts_manager = TTSManager()
        
    async def generate_section1_conversation(
        self, 
        conversation_type: str = "swimming_lesson",
        use_offline_only: bool = False
    ) -> Dict[str, Any]:
        """Generate IELTS Section 1 listening conversation"""
        
        logger.info(f"🎧 Generating IELTS Section 1: {conversation_type}")
        logger.info(f"📍 Mode: {'Offline only' if use_offline_only else 'Best available quality'}")
        
        # Get conversation script
        conversation = self._get_conversation_script(conversation_type)
        
        # Determine TTS engine based on mode
        if use_offline_only:
            preferred_engines = [TTSEngine.PYTTSX3, TTSEngine.SYSTEM_TTS]
        else:
            preferred_engines = [TTSEngine.EDGE_TTS, TTSEngine.PYTTSX3]
            
        # Find best available engine
        engine_info = self.tts_manager.get_engine_info()
        selected_engine = None
        
        for engine_name in preferred_engines:
            if any(e['name'] == engine_name.value for e in engine_info['available_engines']):
                selected_engine = engine_name
                logger.info(f"🎯 Selected engine: {engine_name.value}")
                break
                
        if not selected_engine:
            raise RuntimeError("No suitable TTS engine available")
        
        # Generate audio segments
        segments = []
        voices = self._get_voice_mapping(selected_engine)
        
        for i, (speaker, text) in enumerate(conversation, 1):
            segment_file = self.output_dir / f"segment_{i:02d}_{speaker}.wav"
            voice = voices.get(speaker)
            
            logger.info(f"🔊 Generating segment {i:2d}/{len(conversation)}: {speaker}")
            logger.info(f"   Voice: {voice}")
            logger.info(f"   Text: \"{text[:60]}{'...' if len(text) > 60 else ''}\"")
            
            try:
                result = await self.tts_manager.synthesize(
                    text=text,
                    output_file=segment_file,
                    engine=selected_engine,
                    voice=voice,
                    speaker_type=speaker
                )
                
                segment_info = {
                    'segment_id': i,
                    'speaker': speaker,
                    'text': text,
                    'file': str(segment_file),
                    'voice_used': result.get('voice_used', voice),
                    'engine_used': result.get('engine_used'),
                    'is_offline': result.get('is_offline', False)
                }
                segments.append(segment_info)
                
                logger.info(f"   ✅ Generated: {segment_file.name}")
                
                # Show file size for verification
                if segment_file.exists():
                    file_size = segment_file.stat().st_size
                    logger.info(f"   📊 File size: {file_size:,} bytes")
                
            except Exception as e:
                logger.error(f"   ❌ Error generating segment {i}: {e}")
                continue
                
        # Create HTML player
        html_file = await self._create_html_player(segments, conversation_type, use_offline_only)
        
        # Save metadata
        metadata = {
            'title': f'IELTS Section 1 - {conversation_type.replace("_", " ").title()}',
            'generated_at': datetime.now().isoformat(),
            'total_segments': len(segments),
            'successful_segments': len([s for s in segments if Path(s['file']).exists()]),
            'engine_used': selected_engine.value,
            'is_offline_compatible': use_offline_only,
            'conversation_type': conversation_type,
            'html_player': str(html_file),
            'segments': segments
        }
        
        metadata_file = self.output_dir / "metadata.json"
        with open(metadata_file, "w") as f:
            json.dump(metadata, f, indent=2)
            
        logger.info(f"\n✅ IELTS audio generation completed!")
        logger.info(f"📊 Successfully created {len(segments)} segments")
        logger.info(f"🎯 Engine used: {selected_engine.value}")
        logger.info(f"🌐 HTML player: {html_file}")
        logger.info(f"📁 Files saved in: {self.output_dir}")
        
        if use_offline_only:
            logger.info(f"🇮🇷 ✅ Offline mode - suitable for Iranian deployment!")
        else:
            logger.info(f"🔗 ⚠️  Using online TTS - for development only")
            
        return metadata
        
    def _get_conversation_script(self, conversation_type: str) -> List[tuple]:
        """Get conversation script based on type"""
        
        if conversation_type == "swimming_lesson":
            return [
                ("receptionist", "Good morning, Riverside Swimming Centre. This is Sarah speaking. How can I help you?"),
                ("customer", "Oh hello. I'm calling about swimming lessons for my daughter. I saw your advertisement in the local newspaper."),
                ("receptionist", "Certainly! I'd be happy to help you with that. Could I start by taking some details? What's your daughter's name, please?"),
                ("customer", "It's Emma. That's E-M-M-A. And her surname is Johnson, J-O-H-N-S-O-N."),
                ("receptionist", "Thank you. And how old is Emma?"),
                ("customer", "She's eight years old. She'll be nine next month, but she's eight now."),
                ("receptionist", "Right, so she'll be in our junior group then. And what's your contact number in case we need to reach you?"),
                ("customer", "It's oh seven nine five six, four eight three seven two nine. That's my mobile number."),
                ("receptionist", "Let me just confirm that. Oh seven nine five six four eight three seven two nine. Perfect. And could I have your address please?"),
                ("customer", "Yes, we live at forty-five Park Avenue. That's in Millfield."),
                ("receptionist", "Park Avenue in Millfield. And what's the postcode?"),
                ("customer", "M F three, seven R Q."),
                ("receptionist", "Excellent. Now, what's Emma's current swimming level? Has she had any lessons before?"),
                ("customer", "Well, she can swim a little bit. She can do basic front crawl for about ten metres, but her technique isn't very good. I'd say she's a beginner really."),
                ("receptionist", "That sounds like our Level Two class would be perfect for her. Level One is for complete beginners who can't swim at all, and Level Two focuses on improving basic strokes."),
                ("customer", "That sounds ideal. When are the classes held?"),
                ("receptionist", "We have several options. There's a Wednesday evening class at half past six, a Saturday morning class at ten o'clock, and a Sunday afternoon class at quarter past two."),
                ("customer", "The Saturday morning sounds good. What time does it finish?"),
                ("receptionist", "The Saturday class runs from ten o'clock to eleven o'clock, so it's a one-hour session."),
                ("customer", "Perfect. And how much does it cost?"),
                ("receptionist", "The lessons are fifteen pounds per session, or you can buy a block of eight lessons for one hundred and ten pounds. That works out slightly cheaper."),
                ("customer", "I think I'll start with the block of eight lessons then. When can she start?"),
                ("receptionist", "The next course starts this Saturday, the sixteenth of March. Would that suit you?"),
                ("customer", "Yes, that's fine. What should she bring?"),
                ("receptionist", "She'll need a swimming costume, towel, and goggles. We also recommend bringing a water bottle. Oh, and parents aren't allowed in the pool area during lessons for safety reasons, but you can watch from the viewing gallery."),
                ("customer", "That's understandable. Is there parking available?"),
                ("receptionist", "Yes, we have a car park right next to the building. It's free for customers."),
                ("receptionist", "Right, let me just confirm the booking. That's Emma Johnson, aged eight, Level Two swimming lessons, Saturday mornings at ten o'clock, starting March sixteenth, block of eight lessons for one hundred and ten pounds. Is that correct?"),
                ("customer", "Yes, that's perfect."),
                ("receptionist", "Great! How would you like to pay? We accept cash, card, or bank transfer."),
                ("customer", "I'll pay by card when I come in on Saturday."),
                ("receptionist", "That's fine. Just arrive about fifteen minutes early on Saturday for Emma to get changed. The changing rooms are on the ground floor."),
                ("customer", "Wonderful. Is there anything else I need to know?"),
                ("receptionist", "Just that if Emma misses a lesson, we can arrange a makeup session, but you need to give us at least twenty-four hours notice. And if you have any questions, just give us a call."),
                ("customer", "That's great. Thank you so much for your help, Sarah."),
                ("receptionist", "You're very welcome! We look forward to seeing Emma on Saturday. Have a lovely day!"),
                ("customer", "Thank you. Goodbye!"),
                ("receptionist", "Goodbye!")
            ]
        else:
            # Can add more conversation types here
            raise ValueError(f"Unknown conversation type: {conversation_type}")
            
    def _get_voice_mapping(self, engine: TTSEngine) -> Dict[str, str]:
        """Get voice mapping for different speakers based on TTS engine"""
        
        if engine == TTSEngine.EDGE_TTS:
            return {
                'receptionist': 'en-GB-SoniaNeural',   # Professional British female
                'customer': 'en-GB-RyanNeural'         # Male customer
            }
        elif engine == TTSEngine.PYTTSX3:
            # pyttsx3 will try to find appropriate voices automatically
            return {
                'receptionist': 'female',
                'customer': 'male'
            }
        elif engine == TTSEngine.GTTS:
            return {
                'receptionist': 'en-co.uk',
                'customer': 'en-co.uk'
            }
        elif engine == TTSEngine.SYSTEM_TTS:
            return {
                'receptionist': 'en-gb',
                'customer': 'en-gb'
            }
        else:
            return {
                'receptionist': 'default',
                'customer': 'default'
            }
            
    async def _create_html_player(
        self, 
        segments: List[Dict[str, Any]], 
        conversation_type: str,
        is_offline_mode: bool
    ) -> Path:
        """Create professional HTML audio player"""
        
        engine_name = segments[0]['engine_used'] if segments else 'unknown'
        is_offline = segments[0]['is_offline'] if segments else False
        
        html_content = f'''<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IELTS Section 1 - {conversation_type.replace("_", " ").title()}</title>
    <style>
        * {{
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }}
        
        body {{
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            line-height: 1.6;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            padding: 20px;
        }}
        
        .container {{
            max-width: 1200px;
            margin: 0 auto;
        }}
        
        .header {{
            background: rgba(255, 255, 255, 0.95);
            color: #333;
            padding: 40px;
            border-radius: 20px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }}
        
        .header h1 {{
            font-size: 3em;
            font-weight: 300;
            margin-bottom: 10px;
            background: linear-gradient(135deg, #667eea, #764ba2);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
        }}
        
        .deployment-badge {{
            background: {('linear-gradient(135deg, #28a745, #20c997)' if is_offline else 'linear-gradient(135deg, #ffc107, #fd7e14)')};
            color: white;
            padding: 15px 25px;
            border-radius: 25px;
            display: inline-block;
            margin: 15px 0;
            font-weight: 600;
            box-shadow: 0 8px 20px rgba(0,0,0,0.2);
        }}
        
        .engine-info {{
            background: rgba(255,255,255,0.9);
            padding: 25px;
            border-radius: 15px;
            margin-bottom: 25px;
            text-align: center;
        }}
        
        .engine-info h3 {{
            color: #667eea;
            margin-bottom: 15px;
        }}
        
        .features {{
            background: rgba(255,255,255,0.95);
            padding: 30px;
            border-radius: 20px;
            margin-bottom: 30px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }}
        
        .features h3 {{
            color: #667eea;
            margin-bottom: 20px;
            font-size: 1.5em;
            display: flex;
            align-items: center;
            gap: 10px;
        }}
        
        .features-grid {{
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 15px;
        }}
        
        .feature {{
            padding: 15px;
            background: linear-gradient(135deg, #f8f9fa, #e9ecef);
            border-radius: 10px;
            border-left: 4px solid {('#28a745' if is_offline else '#667eea')};
            transition: transform 0.2s ease;
        }}
        
        .feature:hover {{
            transform: translateX(5px);
        }}
        
        .controls {{
            text-align: center;
            margin: 30px 0;
            padding: 30px;
            background: rgba(255,255,255,0.95);
            border-radius: 20px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }}
        
        .play-button {{
            background: linear-gradient(135deg, #667eea, #764ba2);
            color: white;
            border: none;
            padding: 18px 35px;
            border-radius: 30px;
            font-size: 18px;
            font-weight: 600;
            cursor: pointer;
            margin: 15px;
            transition: all 0.3s ease;
            box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }}
        
        .play-button:hover {{
            transform: translateY(-3px);
            box-shadow: 0 15px 30px rgba(102, 126, 234, 0.6);
        }}
        
        .play-button:active {{
            transform: translateY(-1px);
        }}
        
        .conversation {{
            background: rgba(255,255,255,0.95);
            padding: 40px;
            border-radius: 20px;
            box-shadow: 0 20px 40px rgba(0,0,0,0.1);
            backdrop-filter: blur(10px);
        }}
        
        .segment {{
            margin-bottom: 30px;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 5px 20px rgba(0,0,0,0.08);
            transition: all 0.3s ease;
            border: 1px solid rgba(255,255,255,0.2);
        }}
        
        .segment:hover {{
            transform: translateY(-5px);
            box-shadow: 0 15px 30px rgba(0,0,0,0.15);
        }}
        
        .receptionist {{
            background: linear-gradient(135deg, #e3f2fd, #bbdefb);
            border-left: 6px solid #2196f3;
        }}
        
        .customer {{
            background: linear-gradient(135deg, #f3e5f5, #e1bee7);
            border-left: 6px solid #9c27b0;
        }}
        
        .speaker-info {{
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            flex-wrap: wrap;
            gap: 15px;
        }}
        
        .speaker-label {{
            font-weight: bold;
            font-size: 1.2em;
            display: flex;
            align-items: center;
            gap: 10px;
            color: #333;
        }}
        
        .voice-info {{
            font-size: 0.95em;
            color: #666;
            font-style: italic;
            padding: 8px 15px;
            background: rgba(255,255,255,0.7);
            border-radius: 20px;
            border: 1px solid rgba(0,0,0,0.1);
        }}
        
        .text {{
            margin-bottom: 20px;
            line-height: 1.8;
            font-size: 1.15em;
            color: #333;
            text-align: justify;
        }}
        
        .audio-player {{
            width: 100%;
            height: 60px;
            border-radius: 15px;
            box-shadow: 0 5px 15px rgba(0,0,0,0.1);
        }}
        
        .progress-bar {{
            background: rgba(102, 126, 234, 0.2);
            height: 4px;
            border-radius: 2px;
            margin: 20px 0;
            overflow: hidden;
        }}
        
        .progress-fill {{
            background: linear-gradient(135deg, #667eea, #764ba2);
            height: 100%;
            width: 0%;
            border-radius: 2px;
            transition: width 0.3s ease;
        }}
        
        @media (max-width: 768px) {{
            .container {{
                padding: 10px;
            }}
            
            .header {{
                padding: 25px 20px;
            }}
            
            .header h1 {{
                font-size: 2em;
            }}
            
            .segment {{
                padding: 20px 15px;
            }}
            
            .speaker-info {{
                flex-direction: column;
                align-items: flex-start;
            }}
            
            .play-button {{
                padding: 15px 25px;
                font-size: 16px;
                margin: 10px 5px;
            }}
        }}
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🎧 IELTS Section 1</h1>
            <div class="deployment-badge">
                {'🇮🇷 Iranian Production Ready - Fully Offline' if is_offline else '🔗 Development Mode - Online Required'}
            </div>
            <p style="font-size: 1.2em; margin-top: 15px; color: #666;">
                {conversation_type.replace("_", " ").title()} Conversation
            </p>
        </div>
        
        <div class="engine-info">
            <h3>🎤 TTS Engine: {engine_name.upper()}</h3>
            <p>{'✅ Fully self-hosted and offline compatible' if is_offline else '⚠️ Requires internet connection'}</p>
        </div>
        
        <div class="features">
            <h3>🚀 Quality Features</h3>
            <div class="features-grid">
                <div class="feature">
                    <strong>🎭 Speaker Distinction:</strong> Different voices for receptionist and customer
                </div>
                <div class="feature">
                    <strong>🇬🇧 British English:</strong> Authentic pronunciation patterns
                </div>
                <div class="feature">
                    <strong>🎵 Natural Flow:</strong> Conversation-appropriate pacing
                </div>
                <div class="feature">
                    <strong>{'🔒 Self-Hosted' if is_offline else '🌐 High Quality'}:</strong> {'Complete data sovereignty' if is_offline else 'Professional-grade synthesis'}
                </div>
                <div class="feature">
                    <strong>📝 IELTS Format:</strong> Authentic exam-style conversation
                </div>
                <div class="feature">
                    <strong>✂️ Clean Audio:</strong> No artifacts or interruptions
                </div>
            </div>
        </div>
        
        <div class="controls">
            <button class="play-button" onclick="playFullConversation()">▶️ Play Complete Test</button>
            <button class="play-button" onclick="pauseAll()">⏸️ Pause All</button>
            <div class="progress-bar">
                <div class="progress-fill" id="progressFill"></div>
            </div>
            <p style="margin-top: 20px; color: #666; font-size: 1.1em;">
                {'🇮🇷 Ready for Iranian deployment - No external dependencies' if is_offline else '🔗 Development version with high-quality online TTS'}
            </p>
        </div>
        
        <div class="conversation">'''

        for segment in segments:
            speaker_class = segment['speaker']
            speaker_emoji = "👩‍💼" if segment['speaker'] == 'receptionist' else "👨‍🦰"
            speaker_title = "Receptionist (Sarah)" if segment['speaker'] == 'receptionist' else "Customer"
            
            html_content += f'''
            <div class="segment {speaker_class}">
                <div class="speaker-info">
                    <div class="speaker-label">
                        {speaker_emoji} {speaker_title}
                    </div>
                    <div class="voice-info">
                        {segment.get('voice_used', 'default')} ({engine_name})
                    </div>
                </div>
                <div class="text">{segment['text']}</div>
                <audio class="audio-player" controls preload="metadata" id="audio-{segment['segment_id']}">
                    <source src="{Path(segment['file']).name}" type="audio/wav">
                    Your browser does not support the audio element.
                </audio>
            </div>'''

        html_content += '''
        </div>
    </div>
    
    <script>
        let currentIndex = 0;
        const audioElements = document.querySelectorAll('audio');
        const progressFill = document.getElementById('progressFill');
        
        function playFullConversation() {
            currentIndex = 0;
            updateProgress(0);
            playNext();
        }
        
        function playNext() {
            if (currentIndex < audioElements.length) {
                const audio = audioElements[currentIndex];
                audio.currentTime = 0;
                
                // Scroll to current segment
                audio.closest('.segment').scrollIntoView({ 
                    behavior: 'smooth', 
                    block: 'center' 
                });
                
                audio.play();
                
                audio.onended = () => {
                    currentIndex++;
                    updateProgress((currentIndex / audioElements.length) * 100);
                    
                    setTimeout(() => {
                        playNext();
                    }, 1200); // Natural conversation pause
                };
            } else {
                updateProgress(100);
            }
        }
        
        function pauseAll() {
            audioElements.forEach(audio => {
                audio.pause();
            });
        }
        
        function updateProgress(percentage) {
            progressFill.style.width = percentage + '%';
        }
        
        // Pause other audio when one starts playing
        audioElements.forEach((audio, index) => {
            audio.addEventListener('play', () => {
                audioElements.forEach((otherAudio, otherIndex) => {
                    if (otherIndex !== index) {
                        otherAudio.pause();
                    }
                });
            });
            
            audio.addEventListener('timeupdate', () => {
                if (currentIndex === index) {
                    const progress = ((currentIndex + audio.currentTime / audio.duration) / audioElements.length) * 100;
                    updateProgress(progress);
                }
            });
        });
    </script>
</body>
</html>'''

        html_file = Path(f"ielts_{conversation_type}_{'offline' if is_offline_mode else 'online'}.html")
        with open(html_file, "w", encoding="utf-8") as f:
            f.write(html_content)
            
        return html_file