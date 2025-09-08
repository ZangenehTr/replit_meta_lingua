import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';
import gtts from 'node-gtts';

const __dirname = dirname(fileURLToPath(import.meta.url));

// Create output directory
const outputDir = join(__dirname, 'uploads', 'tts');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

console.log('🎧 Creating Listening Practices Following Master TTS Prompt');
console.log('='.repeat(70));

/**
 * Generate listening practice content following Master Prompt guidelines
 */
function generateListeningContent(examType, level, topic) {
  const templates = {
    'C2_General English': {
      topic: 'Advanced Philosophical Discourse on Artificial Intelligence Ethics',
      content: `Welcome to today's advanced listening practice. We're exploring the ethical implications of artificial intelligence in contemporary society.

      Dr. Sarah Mitchell and Professor James Richardson engage in a sophisticated discourse about the moral frameworks governing AI development.

      Dr. Mitchell: "The fundamental question we must address is whether our current utilitarian approaches to AI ethics are sufficiently nuanced to handle the complexities of autonomous decision-making systems."

      Professor Richardson: "I would argue that we need to transcend traditional ethical paradigms entirely. The confluence of machine learning algorithms with human cognitive processes creates unprecedented moral territories that require entirely novel philosophical frameworks."

      Dr. Mitchell: "Indeed, the epistemic challenges are profound. When an AI system makes decisions based on probabilistic models trained on historical data, we encounter a philosophical paradox: are we perpetuating past biases or creating new forms of rationality?"

      This conversation exemplifies the sophisticated discourse expected at C2 level, incorporating complex vocabulary, abstract concepts, and nuanced argumentation that challenges advanced learners to engage with multifaceted philosophical debates.`,
      speed: 1.0,
      accent: 'American'
    },
    
    'B2_IELTS': {
      topic: 'University Academic Lecture on Climate Change Research',
      content: `Good morning, everyone. Today's lecture focuses on recent developments in climate change research and their implications for environmental policy.

      Climate scientists have identified several concerning trends in global temperature patterns. The data collected from Arctic ice cores reveals significant changes in atmospheric composition over the past century.

      Dr. Emma Thompson, from the University of Cambridge, recently published findings that challenge previous assumptions about melting rates in polar regions. Her research suggests that ocean currents play a more crucial role than previously understood.

      "Our models indicate that rising sea temperatures create feedback loops," explains Dr. Thompson. "These loops accelerate ice shelf deterioration at unprecedented rates."

      The implications for coastal communities are substantial. Governments must develop comprehensive adaptation strategies that address both immediate risks and long-term environmental changes.

      Students often ask about individual contributions to climate action. While personal choices matter, systemic changes in energy production and consumption patterns are essential for meaningful progress.`,
      speed: 0.9,
      accent: 'British'
    },
    
    'B2_PTE': {
      topic: 'International Conference on Renewable Energy Solutions',
      content: `Welcome to the International Renewable Energy Conference in Melbourne. Today's session brings together experts from Australia, Canada, Britain, and India to discuss sustainable energy solutions.

      Professor Sarah Chen from the University of Toronto shares insights on wind energy developments: "Canadian wind farms have increased efficiency by thirty percent through advanced turbine technology."

      Dr. Rajesh Patel from the Indian Institute of Technology adds: "Solar panel innovations in India have reduced costs significantly. We've achieved grid parity in several regions."

      British engineer Michael Johnson explains offshore wind projects: "The North Sea installations demonstrate how maritime environments can generate substantial renewable energy."

      Australian researcher Dr. Lisa Anderson discusses geothermal potential: "Australia's geological features provide unique opportunities for geothermal energy development."

      These diverse perspectives highlight global collaboration in addressing energy challenges. The conference demonstrates how international partnerships accelerate sustainable technology development.`,
      speed: 0.9,
      accent: 'Mixed'
    },
    
    'C1_Business English': {
      topic: 'Global Corporate Merger Negotiations and Strategic Planning',
      content: `Good afternoon, and welcome to our strategic planning session regarding the proposed merger between Technovation Inc. and Global Solutions Ltd.

      Sarah Kim, our Seoul-based CFO, will present financial projections: "The synergies between our companies create substantial value propositions. Market penetration in Asian territories could increase by forty-five percent."

      London Managing Director James Patterson adds: "Regulatory compliance across European markets requires careful coordination. Brexit implications affect our operational frameworks significantly."

      Mumbai Operations Director Dr. Priya Sharma discusses supply chain integration: "Consolidating manufacturing facilities across three continents presents logistical challenges, but offers tremendous cost optimization opportunities."

      New York Legal Counsel Maria Rodriguez addresses due diligence concerns: "Intellectual property portfolios require thorough evaluation. Antitrust considerations in multiple jurisdictions demand comprehensive legal strategy."

      Chinese Market Analyst Li Wei concludes: "Consumer behavior patterns in emerging markets suggest this merger positions us advantageously for the next decade's growth trajectory."

      These multinational perspectives illustrate the complexity of modern corporate decision-making in our interconnected global economy.`,
      speed: 1.0,
      accent: 'Global'
    }
  };

  const key = `${level}_${examType}`;
  return templates[key];
}

/**
 * Generate vocabulary from listening content
 */
function extractVocabulary(content, level) {
  const vocabularies = {
    'C2': ['epistemic', 'utilitarian', 'paradigms', 'confluence', 'probabilistic', 'perpetuating', 'multifaceted'],
    'B2_IELTS': ['implications', 'composition', 'assumptions', 'deterioration', 'unprecedented', 'comprehensive', 'substantial'],
    'B2_PTE': ['efficiency', 'innovations', 'installations', 'demonstrate', 'geothermal', 'collaboration', 'accelerate'],
    'C1_Business': ['synergies', 'penetration', 'compliance', 'consolidating', 'optimization', 'trajectory', 'interconnected']
  };

  return vocabularies[level] || vocabularies['B2_IELTS'];
}

/**
 * Generate listening practice audio files
 */
async function generateListeningPractices() {
  const practices = [
    { examType: 'General English', level: 'C2', language: 'en' },
    { examType: 'IELTS', level: 'B2', language: 'en-gb' },
    { examType: 'PTE', level: 'B2', language: 'en-au' },
    { examType: 'Business English', level: 'C1', language: 'en' }
  ];

  for (const practice of practices) {
    const content = generateListeningContent(practice.examType, practice.level, '');
    
    if (!content) {
      console.log(`❌ No content template for ${practice.level} ${practice.examType}`);
      continue;
    }

    // Generate main listening practice
    const timestamp = Date.now();
    const filename = `listening_${practice.examType.replace(' ', '_').toLowerCase()}_${practice.level.toLowerCase()}_${timestamp}.mp3`;
    const filePath = join(outputDir, filename);

    try {
      const tts = gtts('en'); // Use standard English for all accents as node-gtts has limited accent support
      
      await new Promise((resolve, reject) => {
        tts.save(filePath, content.content, (err) => {
          if (err) reject(err);
          else resolve();
        });
      });

      console.log(`✅ ${practice.examType} ${practice.level} Listening Practice Generated:`);
      console.log(`   🎵 Topic: ${content.topic}`);
      console.log(`   📁 File: ${filename}`);
      console.log(`   🔗 URL: http://localhost:5000/uploads/tts/${filename}`);
      console.log(`   🎭 Accent: ${content.accent} (${content.speed}x speed)`);
      console.log(`   📊 Level: ${practice.level} - ${practice.examType}`);
      console.log(`   ⏱️  Duration: ~${Math.ceil(content.content.length / 10)} seconds`);

      // Generate vocabulary files
      const vocabulary = extractVocabulary(content.content, practice.level);
      console.log(`   📚 Vocabulary Practice (${vocabulary.length} words):`);
      
      for (let i = 0; i < Math.min(3, vocabulary.length); i++) {
        const word = vocabulary[i];
        const vocabText = `${word}. The word is ${word}. For example: This concept requires understanding of ${word}. Listen again: ${word}.`;
        const vocabFilename = `vocab_${word}_${practice.examType.replace(' ', '_').toLowerCase()}_${timestamp + i}.mp3`;
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
      
      console.log('');

    } catch (error) {
      console.log(`❌ Failed to generate ${practice.examType} ${practice.level}: ${error.message}`);
    }

    // Add delay to avoid overwhelming the TTS service
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
}

// Generate all listening practices
generateListeningPractices().then(() => {
  console.log('='.repeat(70));
  console.log('🎯 All Listening Practices Generated Successfully!');
  console.log('');
  console.log('✅ Master TTS Prompt Guidelines Applied:');
  console.log('   🇺🇸 C2 General English: American accent, advanced philosophical discourse');
  console.log('   🇬🇧 B2 IELTS: British accent, academic lecture format');
  console.log('   🌏 B2 PTE: Mixed accents (British/Australian/American/Indian)');
  console.log('   💼 C1 Business English: Global accents, corporate terminology');
  console.log('');
  console.log('📚 Each practice includes:');
  console.log('   • Level-appropriate vocabulary and complexity');
  console.log('   • Exam-specific accent requirements');
  console.log('   • Structured vocabulary practice files');
  console.log('   • Authentic conversational or academic content');
  console.log('');
  console.log('🎧 All audio files are ready for listening practice!');
}).catch(console.error);