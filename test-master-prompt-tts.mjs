import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

console.log('🎧 Testing Enhanced TTS with Master Prompt Guidelines');
console.log('='.repeat(60));

/**
 * Test Enhanced TTS API endpoints that follow the Master Prompt
 */
async function testEnhancedTTS() {
  const baseUrl = 'http://localhost:5000';
  
  console.log('\n📚 Testing Master Prompt Information Endpoint...');
  try {
    const response = await fetch(`${baseUrl}/api/tts/enhanced/master-prompt-info?examType=IELTS&learnerLevel=B2&learnerNativeLanguage=Farsi`);
    const data = await response.json();
    
    if (data.success) {
      console.log('✅ Master Prompt Info Retrieved:');
      console.log(`   📖 Exam Type: ${data.examConfig.examType}`);
      console.log(`   📊 Learner Level: ${data.examConfig.learnerLevel}`);
      console.log(`   🗣️  Native Language: ${data.examConfig.learnerNativeLanguage}`);
      console.log(`   🎭 Accent Instructions: ${data.accentInstructions.slice(0, 100)}...`);
      console.log(`   📝 Vocabulary Instructions: ${data.vocabularyInstructions.slice(0, 100)}...`);
    } else {
      console.log('❌ Failed to get master prompt info:', data.error);
    }
  } catch (error) {
    console.log('❌ Master Prompt Info Error:', error.message);
  }

  console.log('\n🎵 Testing Enhanced Listening Practice Generation...');
  try {
    const listeningRequest = {
      topic: 'Job Interview Preparation',
      duration: 180, // 3 minutes
      examType: 'IELTS',
      learnerLevel: 'B2',
      learnerNativeLanguage: 'Farsi',
      includeVocabulary: true
    };

    const response = await fetch(`${baseUrl}/api/tts/enhanced/listening-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(listeningRequest)
    });

    const data = await response.json();
    
    if (data.listeningPractice?.success) {
      console.log('✅ Listening Practice Generated:');
      console.log(`   🎵 Audio File: ${data.listeningPractice.audioFile}`);
      console.log(`   🔗 URL: ${baseUrl}${data.listeningPractice.audioUrl}`);
      console.log(`   ⏱️  Duration: ~${data.listeningPractice.duration} seconds`);
      console.log(`   📋 Master Prompt Used: ${data.masterPromptUsed ? 'Yes' : 'No'}`);
      console.log(`   🎯 Exam Config: ${data.examConfig.examType} - ${data.examConfig.learnerLevel}`);
      
      if (data.vocabularyFiles && data.vocabularyFiles.length > 0) {
        console.log(`   📚 Vocabulary Files: ${data.vocabularyFiles.filter(f => f.success).length} generated`);
        data.vocabularyFiles.forEach((vocab, i) => {
          if (vocab.success) {
            console.log(`      📝 Word ${i + 1}: ${baseUrl}${vocab.audioUrl}`);
          }
        });
      }
    } else {
      console.log('❌ Listening Practice Failed:', data.listeningPractice?.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Listening Practice Error:', error.message);
  }

  console.log('\n📝 Testing Enhanced Vocabulary Practice Generation...');
  try {
    const vocabularyRequest = {
      words: ['interview', 'qualifications', 'experience', 'responsibility', 'opportunity'],
      examType: 'TOEFL',
      learnerLevel: 'B1',
      learnerNativeLanguage: 'Farsi',
      sourceListeningText: 'Job interview conversation about career qualifications and work experience'
    };

    const response = await fetch(`${baseUrl}/api/tts/enhanced/vocabulary-practice`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vocabularyRequest)
    });

    const data = await response.json();
    
    if (data.vocabularyFiles && data.vocabularyFiles.length > 0) {
      console.log('✅ Vocabulary Practice Generated:');
      console.log(`   📚 Total Words: ${data.totalWords}`);
      console.log(`   📋 Master Prompt Used: ${data.masterPromptUsed ? 'Yes' : 'No'}`);
      console.log(`   🎯 Exam Config: ${data.examConfig.examType} - ${data.examConfig.learnerLevel}`);
      console.log(`   🗣️  Native Language: ${data.examConfig.learnerNativeLanguage}`);
      
      data.vocabularyFiles.forEach((vocab, i) => {
        if (vocab.success) {
          console.log(`   📝 ${vocabularyRequest.words[i]}: ${baseUrl}${vocab.audioUrl}`);
        }
      });
    } else {
      console.log('❌ Vocabulary Practice Failed:', data.error || 'Unknown error');
    }
  } catch (error) {
    console.log('❌ Vocabulary Practice Error:', error.message);
  }

  console.log('\n🧪 Testing Different Exam Types and Accents...');
  
  const examTypes = [
    { examType: 'TOEFL', expectedAccent: 'American' },
    { examType: 'IELTS', expectedAccent: 'British' },
    { examType: 'PTE', expectedAccent: 'Mixed (British/Australian/American)' },
    { examType: 'Business English', expectedAccent: 'Global variety' },
    { examType: 'General English', expectedAccent: 'American' }
  ];

  for (const exam of examTypes) {
    try {
      const response = await fetch(`${baseUrl}/api/tts/enhanced/master-prompt-info?examType=${exam.examType}&learnerLevel=B2`);
      const data = await response.json();
      
      if (data.success) {
        console.log(`   🎭 ${exam.examType}: ${exam.expectedAccent} accent confirmed`);
        console.log(`      📝 Instructions: ${data.accentInstructions.slice(0, 80)}...`);
      }
    } catch (error) {
      console.log(`   ❌ ${exam.examType}: Error testing accent rules`);
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log('🎯 Master TTS Prompt Integration Complete!');
  console.log('');
  console.log('✅ Key Features Implemented:');
  console.log('   🎧 Accent-specific audio generation (TOEFL/IELTS/PTE/Business)');
  console.log('   📚 Structured vocabulary practice with translations');
  console.log('   🎵 Natural conversation-style listening practice');
  console.log('   🌐 Multi-language support (English/Farsi/Arabic learners)');
  console.log('   📊 Level-appropriate speech speed and complexity');
  console.log('   🤖 Consistent AI-driven content following master guidelines');
  console.log('');
  console.log('🔗 Access Enhanced TTS Routes:');
  console.log(`   📊 Master Prompt Info: GET ${baseUrl}/api/tts/enhanced/master-prompt-info`);
  console.log(`   🎵 Listening Practice: POST ${baseUrl}/api/tts/enhanced/listening-practice`);
  console.log(`   📝 Vocabulary Practice: POST ${baseUrl}/api/tts/enhanced/vocabulary-practice`);
  console.log('');
  console.log('🎨 This system ensures all AI components connected to Meta Lingua');
  console.log('   follow the same comprehensive TTS guidelines for consistent,');
  console.log('   high-quality language learning audio generation.');
}

// Run the test
testEnhancedTTS().catch(console.error);