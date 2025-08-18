// Direct test of OpenAI integration without authentication
// Run with: npx tsx test-ai-direct.js

import OpenAI from 'openai';

console.log('Testing OpenAI Integration...');
console.log('API Key present:', !!process.env.OPENAI_API_KEY);

if (!process.env.OPENAI_API_KEY) {
  console.error('❌ OPENAI_API_KEY is not set in environment variables');
  process.exit(1);
}

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

async function testWordHelper() {
  console.log('\n📚 Testing Word Helper...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a language learning assistant. Suggest 5 helpful English words for discussing travel plans at B1 level. Return as JSON with 'words' array."
        },
        {
          role: "user",
          content: "Context: We are discussing travel plans"
        }
      ],
      temperature: 0.7,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('✅ Word Helper Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Word Helper Error:', error.message);
    return false;
  }
}

async function testGrammarCheck() {
  console.log('\n✏️ Testing Grammar Check...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "You are a grammar correction assistant. Correct the grammar and explain the corrections. Return as JSON with 'corrected' and 'explanation' fields."
        },
        {
          role: "user",
          content: "I have went to the store yesterday"
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('✅ Grammar Check Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Grammar Check Error:', error.message);
    return false;
  }
}

async function testTranslation() {
  console.log('\n🌍 Testing Translation...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Translate the following text to Persian/Farsi. Return as JSON with 'translation' and 'pronunciation' fields."
        },
        {
          role: "user",
          content: "Hello, how are you today?"
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('✅ Translation Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Translation Error:', error.message);
    return false;
  }
}

async function testPronunciation() {
  console.log('\n🗣️ Testing Pronunciation Guide...');
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: "Provide pronunciation guide for the word 'entrepreneur'. Return as JSON with 'pronunciation', 'syllables', and 'tips' fields."
        },
        {
          role: "user",
          content: "entrepreneur"
        }
      ],
      temperature: 0.3,
      response_format: { type: "json_object" }
    });

    const result = JSON.parse(response.choices[0].message.content);
    console.log('✅ Pronunciation Response:', result);
    return true;
  } catch (error) {
    console.error('❌ Pronunciation Error:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('Starting OpenAI API Tests...\n');
  
  const results = {
    wordHelper: await testWordHelper(),
    grammarCheck: await testGrammarCheck(),
    translation: await testTranslation(),
    pronunciation: await testPronunciation()
  };

  console.log('\n========== TEST SUMMARY ==========');
  console.log('Word Helper:', results.wordHelper ? '✅ PASSED' : '❌ FAILED');
  console.log('Grammar Check:', results.grammarCheck ? '✅ PASSED' : '❌ FAILED');
  console.log('Translation:', results.translation ? '✅ PASSED' : '❌ FAILED');
  console.log('Pronunciation:', results.pronunciation ? '✅ PASSED' : '❌ FAILED');
  
  const allPassed = Object.values(results).every(r => r === true);
  console.log('\nOverall:', allPassed ? '✅ ALL TESTS PASSED' : '❌ SOME TESTS FAILED');
  
  process.exit(allPassed ? 0 : 1);
}

runAllTests();