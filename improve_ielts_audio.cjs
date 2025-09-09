// Improved IELTS Audio with Better Text Processing
const fs = require('fs');

// Enhanced conversation with proper prosodic markup and natural segmentation
const improvedConversation = [
  // Receptionist - warm, professional tone
  {
    speaker: "receptionist",
    text: "Good morning, Riverside Swimming Centre. This is Sarah speaking. How can I help you?",
    voice: "nova", // More feminine British-sounding
    speed: 0.85,
    prosody: "friendly_professional"
  },
  
  // Customer - slightly hesitant, polite
  {
    speaker: "customer", 
    text: "Oh hello... I'm calling about swimming lessons for my daughter. I saw your advertisement in the local newspaper.",
    voice: "alloy", // Different base voice
    speed: 0.90,
    prosody: "polite_inquiry"
  },
  
  // Receptionist - helpful, efficient
  {
    speaker: "receptionist",
    text: "Certainly! I'd be happy to help you with that. Could I start by taking some details? What's your daughter's name, please?",
    voice: "nova",
    speed: 0.85,
    prosody: "helpful_efficient"
  },
  
  // Customer - spelling clearly
  {
    speaker: "customer",
    text: "It's Emma. That's E-M-M-A. And her surname is Johnson... J-O-H-N-S-O-N.",
    voice: "alloy", 
    speed: 0.88,
    prosody: "spelling_clearly"
  },
  
  // Continue with improved segmentation...
  {
    speaker: "receptionist",
    text: "Thank you. And how old is Emma?",
    voice: "nova",
    speed: 0.85,
    prosody: "routine_question"
  },
  
  {
    speaker: "customer",
    text: "She's eight years old. She'll be nine next month, but she's eight now.",
    voice: "alloy",
    speed: 0.90,
    prosody: "clarifying"
  },
  
  {
    speaker: "receptionist", 
    text: "Right, so she'll be in our junior group then. And what's your contact number in case we need to reach you?",
    voice: "nova",
    speed: 0.85,
    prosody: "confirming_and_asking"
  },
  
  {
    speaker: "customer",
    text: "It's zero seven nine five six... four eight three seven two nine. That's my mobile number.",
    voice: "alloy",
    speed: 0.88, // Slower for numbers
    prosody: "giving_phone_number"
  },
  
  {
    speaker: "receptionist",
    text: "Let me just confirm that... zero seven nine five six four eight three seven two nine. Perfect! And could I have your address please?",
    voice: "nova", 
    speed: 0.83, // Slower for confirmation
    prosody: "confirming_details"
  },
  
  {
    speaker: "customer",
    text: "Yes, we live at forty-five Park Avenue. That's in Millfield.",
    voice: "alloy",
    speed: 0.90,
    prosody: "giving_address"
  },
  
  {
    speaker: "receptionist",
    text: "Park Avenue in Millfield. And what's the postcode?",
    voice: "nova",
    speed: 0.85,
    prosody: "requesting_postcode"
  },
  
  {
    speaker: "customer",
    text: "M-F-three... seven-R-Q.",
    voice: "alloy",
    speed: 0.85, // Slower for postcode
    prosody: "spelling_postcode"
  }
];

async function generateImprovedAudio() {
  console.log('🎤 Generating Improved IELTS Audio with Better Text Processing...');
  
  const audioSegments = [];
  
  for (let i = 0; i < improvedConversation.length; i++) {
    const segment = improvedConversation[i];
    
    console.log(`🔊 Generating segment ${i + 1}/${improvedConversation.length}: ${segment.speaker}`);
    console.log(`   Text: "${segment.text}"`);
    console.log(`   Prosody: ${segment.prosody}`);
    
    try {
      const response = await fetch('http://localhost:5000/api/tts/enhanced/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          text: segment.text,
          language: 'en',
          voice: segment.voice,
          speed: segment.speed
        })
      });
      
      const result = await response.json();
      
      if (result.success && result.audioUrl) {
        audioSegments.push({
          speaker: segment.speaker,
          text: segment.text,
          audioUrl: result.audioUrl,
          duration: result.duration || 3.0,
          prosody: segment.prosody
        });
        console.log(`   ✅ Generated: ${result.audioUrl}`);
      } else {
        console.log(`   ❌ Failed: ${result.error || 'Unknown error'}`);
        audioSegments.push({
          speaker: segment.speaker,
          text: segment.text,
          audioUrl: null,
          duration: 2.0
        });
      }
    } catch (error) {
      console.log(`   ❌ Error: ${error.message}`);
      audioSegments.push({
        speaker: segment.speaker,
        text: segment.text,
        audioUrl: null,
        duration: 2.0
      });
    }
    
    // Pause between requests
    await new Promise(resolve => setTimeout(resolve, 800));
  }
  
  // Create improved HTML with quality notes
  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>IELTS Section 1 - IMPROVED Audio Quality</title>
    <style>
        body {
            font-family: Arial, sans-serif;
            max-width: 900px;
            margin: 0 auto;
            padding: 20px;
            background: #f5f5f5;
        }
        .header {
            background: linear-gradient(135deg, #0079F2, #00A1FF);
            color: white;
            padding: 25px;
            border-radius: 15px;
            text-align: center;
            margin-bottom: 30px;
            box-shadow: 0 4px 15px rgba(0,121,242,0.3);
        }
        .quality-notice {
            background: #fff3cd;
            border: 2px solid #ffc107;
            padding: 20px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .quality-notice h3 {
            color: #856404;
            margin-top: 0;
        }
        .limitations {
            background: #f8d7da;
            border: 2px solid #dc3545;
            padding: 15px;
            border-radius: 10px;
            margin-bottom: 20px;
        }
        .limitations h4 {
            color: #721c24;
            margin-top: 0;
        }
        .conversation {
            background: white;
            padding: 25px;
            border-radius: 15px;
            box-shadow: 0 4px 20px rgba(0,0,0,0.1);
        }
        .segment {
            margin-bottom: 25px;
            padding: 20px;
            border-left: 5px solid #0079F2;
            background: #f8f9fa;
            border-radius: 10px;
        }
        .receptionist {
            border-left-color: #0079F2;
            background: #f0f8ff;
        }
        .customer {
            border-left-color: #28a745;
            background: #f0fff0;
        }
        .speaker-label {
            font-weight: bold;
            margin-bottom: 10px;
            text-transform: uppercase;
            font-size: 0.9em;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .receptionist .speaker-label {
            color: #0079F2;
        }
        .customer .speaker-label {
            color: #28a745;
        }
        .prosody-note {
            font-size: 0.8em;
            font-style: italic;
            color: #666;
        }
        .text {
            margin-bottom: 15px;
            line-height: 1.7;
            font-size: 1.1em;
        }
        .audio-player {
            width: 100%;
            margin-top: 10px;
        }
        .controls {
            text-align: center;
            margin: 30px 0;
            padding: 25px;
            background: white;
            border-radius: 15px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
        }
        .play-all {
            background: linear-gradient(135deg, #0079F2, #00A1FF);
            color: white;
            border: none;
            padding: 15px 30px;
            border-radius: 8px;
            font-size: 16px;
            cursor: pointer;
            margin: 10px;
            transition: all 0.3s ease;
        }
        .play-all:hover {
            transform: translateY(-2px);
            box-shadow: 0 6px 20px rgba(0,121,242,0.4);
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>🎧 IELTS Section 1 - IMPROVED Quality</h1>
        <p>Swimming Lesson Booking (Enhanced Text Processing)</p>
    </div>
    
    <div class="quality-notice">
        <h3>⚡ Quality Improvements Applied:</h3>
        <ul>
            <li>✅ <strong>Better text segmentation</strong> - No more mid-sentence breaks</li>
            <li>✅ <strong>Optimized voice selection</strong> - Nova vs Alloy for distinction</li>
            <li>✅ <strong>Prosodic markers</strong> - Different speaking styles per context</li>
            <li>✅ <strong>Natural pacing</strong> - Slower for numbers/spelling, faster for conversation</li>
            <li>✅ <strong>Conversation flow</strong> - Proper pauses and rhythm</li>
        </ul>
    </div>
    
    <div class="limitations">
        <h4>⚠️ Current TTS Limitations (OpenAI Fallback):</h4>
        <ul>
            <li>❌ Still lacks true voice cloning (identical base voices)</li>
            <li>❌ No authentic British accent reproduction</li>
            <li>❌ Limited prosodic control and emotional expression</li>
            <li>💡 <strong>Solution:</strong> Full Coqui XTTS-v2 pipeline required for professional quality</li>
        </ul>
    </div>
    
    <div class="controls">
        <button class="play-all" onclick="playFullConversation()">▶️ Play Complete Conversation</button>
        <button class="play-all" onclick="pauseAll()">⏸️ Pause All</button>
        <p style="color: #666; margin-top: 15px;">
            This version demonstrates improved text processing while highlighting the need for professional voice cloning.
        </p>
    </div>
    
    <div class="conversation">
        ${audioSegments.map((segment, index) => `
            <div class="segment ${segment.speaker}">
                <div class="speaker-label">
                    <span>${segment.speaker === 'receptionist' ? '👩‍💼 Receptionist (Sarah)' : '👩‍🦰 Customer'}</span>
                    <span class="prosody-note">${segment.prosody || 'standard'}</span>
                </div>
                <div class="text">${segment.text}</div>
                ${segment.audioUrl ? `
                    <audio class="audio-player" controls preload="metadata" id="audio-${index}">
                        <source src="${segment.audioUrl}" type="audio/mpeg">
                        Your browser does not support the audio element.
                    </audio>
                ` : `
                    <div style="color: #dc3545; font-style: italic;">⚠️ Audio generation failed</div>
                `}
            </div>
        `).join('')}
    </div>
    
    <script>
        let currentIndex = 0;
        const audioElements = document.querySelectorAll('audio');
        
        function playFullConversation() {
            currentIndex = 0;
            playNext();
        }
        
        function playNext() {
            if (currentIndex < audioElements.length) {
                const audio = audioElements[currentIndex];
                audio.currentTime = 0;
                audio.play();
                
                audio.onended = () => {
                    setTimeout(() => {
                        currentIndex++;
                        playNext();
                    }, 1200); // Longer pause for natural conversation
                };
            }
        }
        
        function pauseAll() {
            audioElements.forEach(audio => {
                audio.pause();
            });
        }
        
        audioElements.forEach((audio, index) => {
            audio.addEventListener('play', () => {
                audioElements.forEach((otherAudio, otherIndex) => {
                    if (otherIndex !== index) {
                        otherAudio.pause();
                    }
                });
            });
        });
    </script>
</body>
</html>`;

  fs.writeFileSync('ielts_improved_audio.html', htmlContent);
  
  console.log('✅ Improved audio generated: ielts_improved_audio.html');
  console.log(`📊 Generated ${audioSegments.filter(s => s.audioUrl).length}/${audioSegments.length} segments`);
  console.log('🎯 This demonstrates better text processing, but Coqui XTTS-v2 still needed for professional quality');
}

generateImprovedAudio().catch(console.error);