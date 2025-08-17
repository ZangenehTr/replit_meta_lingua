#!/usr/bin/env node

/**
 * Test OpenAI Integration for AI Word Suggestions
 * Tests the API endpoints for word suggestions, translation, grammar, and pronunciation
 */

import fs from 'fs';
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

// Read the admin token from file
let adminToken;
try {
  adminToken = fs.readFileSync('admin_token.txt', 'utf8').trim();
  console.log('✅ Admin token loaded');
} catch (error) {
  console.error('❌ Failed to read admin token. Please login first.');
  process.exit(1);
}

const BASE_URL = 'http://localhost:5000';

async function testWordSuggestions() {
  console.log('\n📚 Testing Word Suggestions...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/word-suggestions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        context: "I'm learning basic greetings in Persian",
        targetLanguage: "Persian",
        difficulty: "beginner"
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    console.log('✅ Word suggestions received:');
    console.log(JSON.stringify(data.suggestions, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Word suggestions failed:', error.message);
    return false;
  }
}

async function testTranslation() {
  console.log('\n🌐 Testing Translation...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/translate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        text: "Hello, how are you?",
        fromLang: "English",
        toLang: "Persian"
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    console.log('✅ Translation received:');
    console.log('  Original:', "Hello, how are you?");
    console.log('  Translated:', data.translation);
    if (data.alternatives) {
      console.log('  Alternatives:', data.alternatives.join(', '));
    }
    return true;
  } catch (error) {
    console.error('❌ Translation failed:', error.message);
    return false;
  }
}

async function testGrammarCheck() {
  console.log('\n✏️ Testing Grammar Check...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/grammar-check`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        text: "I are learning Persian language",
        language: "English"
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    console.log('✅ Grammar check received:');
    console.log('  Original:', "I are learning Persian language");
    console.log('  Corrected:', data.corrected);
    if (data.explanation) {
      console.log('  Explanation:', data.explanation);
    }
    return true;
  } catch (error) {
    console.error('❌ Grammar check failed:', error.message);
    return false;
  }
}

async function testPronunciation() {
  console.log('\n🗣️ Testing Pronunciation Guide...');
  
  try {
    const response = await fetch(`${BASE_URL}/api/ai/pronunciation`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${adminToken}`
      },
      body: JSON.stringify({
        word: "سلام",
        language: "Persian"
      })
    });
    
    if (!response.ok) {
      const error = await response.text();
      throw new Error(`HTTP ${response.status}: ${error}`);
    }
    
    const data = await response.json();
    console.log('✅ Pronunciation guide received:');
    console.log('  Word:', "سلام");
    console.log('  IPA:', data.ipa);
    console.log('  Simplified:', data.simplified);
    if (data.tips) {
      console.log('  Tips:', data.tips);
    }
    return true;
  } catch (error) {
    console.error('❌ Pronunciation guide failed:', error.message);
    return false;
  }
}

async function runAllTests() {
  console.log('\n=================================');
  console.log('OpenAI Integration Test Suite');
  console.log('=================================');
  
  const results = [];
  
  // Test each endpoint
  results.push(await testWordSuggestions());
  results.push(await testTranslation());
  results.push(await testGrammarCheck());
  results.push(await testPronunciation());
  
  // Summary
  console.log('\n=================================');
  console.log('Test Results Summary');
  console.log('=================================');
  
  const passed = results.filter(r => r).length;
  const total = results.length;
  
  console.log(`✅ Passed: ${passed}/${total}`);
  console.log(`❌ Failed: ${total - passed}/${total}`);
  
  if (passed === total) {
    console.log('\n🎉 All tests passed! OpenAI integration is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the OpenAI API key and configuration.');
  }
  
  return passed === total;
}

// Run the tests
runAllTests()
  .then(success => {
    process.exit(success ? 0 : 1);
  })
  .catch(error => {
    console.error('Unexpected error:', error);
    process.exit(1);
  });