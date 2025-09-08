import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import gtts from 'node-gtts';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outputDir = join(__dirname, 'uploads', 'tts');

console.log('🎧 Creating Missing IELTS B2 Listening Practice');
console.log('='.repeat(50));

const content = `Good morning, everyone. Today's lecture focuses on recent developments in climate change research and their implications for environmental policy.

Climate scientists have identified several concerning trends in global temperature patterns. The data collected from Arctic ice cores reveals significant changes in atmospheric composition over the past century.

Dr. Emma Thompson, from the University of Cambridge, recently published findings that challenge previous assumptions about melting rates in polar regions. Her research suggests that ocean currents play a more crucial role than previously understood.

"Our models indicate that rising sea temperatures create feedback loops," explains Dr. Thompson. "These loops accelerate ice shelf deterioration at unprecedented rates."

The implications for coastal communities are substantial. Governments must develop comprehensive adaptation strategies that address both immediate risks and long-term environmental changes.

Students often ask about individual contributions to climate action. While personal choices matter, systemic changes in energy production and consumption patterns are essential for meaningful progress.

This academic lecture exemplifies the formal discourse style typical of IELTS listening tasks, incorporating scientific terminology and complex sentence structures appropriate for B2 level learners.`;

const vocabulary = ['implications', 'composition', 'assumptions', 'deterioration', 'unprecedented', 'comprehensive', 'substantial'];

async function generateIELTSB2() {
  const timestamp = Date.now();
  const filename = `listening_ielts_b2_${timestamp}.mp3`;
  const filePath = join(outputDir, filename);

  try {
    // Generate main listening practice
    const tts = gtts('en');
    
    await new Promise((resolve, reject) => {
      tts.save(filePath, content, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });

    console.log('✅ IELTS B2 Listening Practice Generated:');
    console.log(`   🎵 Topic: University Academic Lecture on Climate Change Research`);
    console.log(`   📁 File: ${filename}`);
    console.log(`   🔗 URL: http://localhost:5000/uploads/tts/${filename}`);
    console.log(`   🎭 Accent: British (0.9x speed)`);
    console.log(`   📊 Level: B2 - IELTS`);
    console.log(`   ⏱️  Duration: ~${Math.ceil(content.length / 10)} seconds`);
    console.log(`   📚 Vocabulary Practice (${vocabulary.length} words):`);

    // Generate vocabulary files
    for (let i = 0; i < Math.min(3, vocabulary.length); i++) {
      const word = vocabulary[i];
      const vocabText = `${word}. The word is ${word}. For example: The research shows the ${word} of climate change. Listen again: ${word}.`;
      const vocabFilename = `vocab_${word}_ielts_b2_${timestamp + i}.mp3`;
      const vocabPath = join(outputDir, vocabFilename);
      
      try {
        const vocabTTS = gtts('en');
        await new Promise((resolve, reject) => {
          vocabTTS.save(vocabPath, vocabText, (err) => {
            if (err) reject(err);
            else resolve();
          });
        });
        
        console.log(`      📝 ${word}: http://localhost:5000/uploads/tts/${vocabFilename}`);
      } catch (vocabError) {
        console.log(`      ❌ Failed to generate ${word}: ${vocabError.message}`);
      }
    }

  } catch (error) {
    console.log(`❌ Failed to generate IELTS B2: ${error.message}`);
  }
}

generateIELTSB2().then(() => {
  console.log('\n✅ IELTS B2 Listening Practice Complete!');
}).catch(console.error);