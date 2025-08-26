#!/usr/bin/env node
/**
 * Infrastructure Test Script
 * Tests Docker services (Redis, Whisper, Piper) and queue workers
 */

import { redisConnection, contentGenerationQueue, checkQueueHealth } from './services/queue-service';
import { OllamaService } from './services/ollama-service';
import { PiperTTSService } from './services/adaptive-kit/piper-service';
import { WhisperASRService } from './services/adaptive-kit/whisper-service';
import { AdaptiveContentGenerator } from './services/adaptive-kit/content-generator';
import { IRTService } from './services/irt-service';

async function testRedis() {
  console.log('\n🔴 Testing Redis Connection...');
  try {
    await redisConnection.ping();
    console.log('✅ Redis is connected');
    
    const health = await checkQueueHealth();
    console.log('✅ Queue health:', health);
    return true;
  } catch (error) {
    console.error('❌ Redis connection failed:', error);
    return false;
  }
}

async function testOllama() {
  console.log('\n🤖 Testing Ollama Service...');
  try {
    const ollama = new OllamaService();
    const response = await ollama.generateText('What is 2+2?', {
      maxTokens: 50,
      temperature: 0.1
    });
    console.log('✅ Ollama response:', response.content.substring(0, 100));
    return true;
  } catch (error) {
    console.error('❌ Ollama service failed:', error);
    return false;
  }
}

async function testPiperTTS() {
  console.log('\n🎵 Testing Piper TTS Service...');
  try {
    const piper = new PiperTTSService();
    const isHealthy = await piper.checkHealth();
    
    if (isHealthy) {
      console.log('✅ Piper TTS is healthy');
      
      // Test synthesis
      const audioBuffer = await piper.synthesize({
        text: 'سلام، این یک تست برای سیستم تبدیل متن به گفتار است.',
        voice: 'fa_IR-amir-medium'
      });
      console.log('✅ Generated audio buffer:', audioBuffer.length, 'bytes');
      return true;
    } else {
      console.log('⚠️ Piper TTS service is not responding');
      return false;
    }
  } catch (error) {
    console.error('❌ Piper TTS service failed:', error);
    return false;
  }
}

async function testWhisperASR() {
  console.log('\n🎤 Testing Whisper ASR Service...');
  try {
    const whisper = new WhisperASRService();
    const isHealthy = await whisper.checkHealth();
    
    if (isHealthy) {
      console.log('✅ Whisper ASR is healthy');
      return true;
    } else {
      console.log('⚠️ Whisper ASR service is not responding');
      return false;
    }
  } catch (error) {
    console.error('❌ Whisper ASR service failed:', error);
    return false;
  }
}

async function testIRTService() {
  console.log('\n📊 Testing IRT Service...');
  try {
    const irt = new IRTService();
    
    // Test probability calculation
    const prob = irt.calculateProbability(0, { id: 'test', difficulty: 0, discrimination: 1 });
    console.log('✅ Probability calculation:', prob);
    
    // Test ability update
    const newAbility = await irt.updateAbility({
      currentTheta: 0,
      currentSE: 1,
      responses: [
        { itemId: 'test1', correct: true, responseTime: 5000 },
        { itemId: 'test2', correct: false, responseTime: 3000 }
      ]
    });
    console.log('✅ Ability update:', newAbility);
    
    // Test item selection
    const nextItem = await irt.selectNextItem(0, ['test1']);
    console.log('✅ Next item selection:', nextItem);
    
    return true;
  } catch (error) {
    console.error('❌ IRT service failed:', error);
    return false;
  }
}

async function testContentGeneration() {
  console.log('\n📚 Testing Adaptive Content Generation...');
  try {
    const generator = new AdaptiveContentGenerator();
    
    // Add a test job to the queue
    const job = await contentGenerationQueue.add('test-generation', {
      sessionId: 1,
      studentId: 1,
      roadmapObjective: 'Test Basic English Conversation',
      sessionTranscript: 'Student: Hello teacher. Teacher: Hello, how are you today?',
      sessionMetrics: {
        duration: 30,
        tttRatio: 0.4,
        errorCount: 2,
        vocabularyUsed: ['hello', 'teacher', 'today']
      },
      irtScores: {
        theta: 0.5,
        standardError: 0.3
      },
      generationPolicy: {
        difficulty: 'intermediate',
        skills: ['speaking', 'listening'],
        contentTypes: ['reading', 'exercises', 'audio'],
        targetCEFR: 'B1'
      }
    });
    
    console.log('✅ Content generation job added:', job.id);
    
    // Wait for job to complete (with timeout)
    const result = await job.waitUntilFinished(contentGenerationQueue.events, 30000);
    console.log('✅ Content generation completed:', result);
    
    return true;
  } catch (error) {
    console.error('❌ Content generation failed:', error);
    return false;
  }
}

async function runAllTests() {
  console.log('🚀 Starting Infrastructure Tests...');
  console.log('===================================');
  
  const results = {
    redis: await testRedis(),
    ollama: await testOllama(),
    piper: await testPiperTTS(),
    whisper: await testWhisperASR(),
    irt: await testIRTService(),
    contentGeneration: false // Disabled for now as it requires workers running
  };
  
  console.log('\n📋 Test Results Summary:');
  console.log('===================================');
  for (const [service, status] of Object.entries(results)) {
    console.log(`${status ? '✅' : '❌'} ${service.toUpperCase()}: ${status ? 'PASSED' : 'FAILED'}`);
  }
  
  const allPassed = Object.values(results).every(r => r !== false);
  console.log('\n' + (allPassed ? '🎉 All tests passed!' : '⚠️ Some tests failed'));
  
  // Close connections
  await redisConnection.quit();
  process.exit(allPassed ? 0 : 1);
}

// Run tests if this file is executed directly
runAllTests().catch(error => {
  console.error('Fatal error:', error);
  process.exit(1);
});

export { runAllTests };