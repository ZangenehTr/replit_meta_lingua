// Test script for AI services with OpenAI fallback
import fetch from 'node-fetch';

const BASE_URL = 'http://localhost:5000';

async function testAIService() {
  console.log('Testing AI Services with OpenAI fallback...\n');
  
  try {
    // 1. Test AI service availability
    console.log('1. Testing AI service availability...');
    const testResponse = await fetch(`${BASE_URL}/api/callern/ai/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });
    
    const testData = await testResponse.json();
    console.log('AI Service Status:', testData.status);
    console.log('Service Type:', testData.serviceType);
    console.log('Default Model:', testData.defaultModel);
    console.log('---\n');
    
    // 2. Test Translation
    console.log('2. Testing translation...');
    const translateResponse = await fetch(`${BASE_URL}/api/callern/ai/test/translate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello, how are you today?',
        targetLanguage: 'fa'
      })
    });
    
    const translateData = await translateResponse.json();
    console.log('Original:', 'Hello, how are you today?');
    console.log('Translation:', translateData.translation);
    console.log('Service Used:', translateData.serviceUsed);
    console.log('---\n');
    
    // 3. Test Word Helper
    console.log('3. Testing word suggestions...');
    const wordResponse = await fetch(`${BASE_URL}/api/callern/ai/test/word-helper`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        context: 'I am learning English and want to talk about travel',
        level: 'intermediate'
      })
    });
    
    const wordData = await wordResponse.json();
    console.log('Word Suggestions:');
    if (wordData.words && wordData.words.length > 0) {
      wordData.words.slice(0, 3).forEach((w, i) => {
        console.log(`  ${i + 1}. ${w.word} - ${w.definition}`);
        console.log(`     Example: ${w.example}`);
      });
    }
    console.log('Service Used:', wordData.serviceUsed);
    console.log('---\n');
    
    // 4. Test Grammar Check
    console.log('4. Testing grammar correction...');
    const grammarResponse = await fetch(`${BASE_URL}/api/callern/ai/test/grammar-check`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'I goes to school yesterday and learn many thing'
      })
    });
    
    const grammarData = await grammarResponse.json();
    console.log('Original:', 'I goes to school yesterday and learn many thing');
    console.log('Corrected:', grammarData.corrected);
    console.log('Explanation:', grammarData.explanation);
    console.log('Service Used:', grammarData.serviceUsed);
    console.log('---\n');
    
    // 5. Test Pronunciation
    console.log('5. Testing pronunciation guide...');
    const pronunciationResponse = await fetch(`${BASE_URL}/api/callern/ai/test/pronunciation`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        word: 'pronunciation'
      })
    });
    
    const pronunciationData = await pronunciationResponse.json();
    console.log('Word:', 'pronunciation');
    console.log('Phonetic:', pronunciationData.pronunciation);
    console.log('Syllables:', pronunciationData.syllables);
    console.log('Tips:', pronunciationData.tips);
    console.log('Service Used:', pronunciationData.serviceUsed);
    console.log('---\n');
    
    console.log('✅ All AI service tests completed!');
    console.log('The system is using', testData.serviceType === 'openai' ? 'OpenAI' : 'Ollama', 'for AI services.');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

// Run the test
testAIService();