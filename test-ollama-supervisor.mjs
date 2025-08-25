import { io } from 'socket.io-client';

console.log('Testing Callern AI Supervisor with Live Ollama Integration...\n');

// Connect as student
const studentSocket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: false
});

const sessionId = 'ollama-test-' + Date.now();

studentSocket.on('connect', () => {
  console.log('✅ Connected to server');
  
  // Authenticate
  studentSocket.emit('authenticate', { 
    userId: 8470, 
    role: 'student' 
  });
  
  // Initialize supervisor session
  setTimeout(() => {
    console.log('🚀 Initializing AI Supervisor with Ollama...');
    studentSocket.emit('supervisor-init', {
      sessionId: sessionId,
      studentId: 8470,
      teacherId: 74,
      lessonTitle: 'Business English - Making Presentations',
      objectives: [
        'Learn presentation vocabulary',
        'Practice formal language',
        'Improve pronunciation of technical terms'
      ],
      studentLevel: 'B2'
    });
  }, 500);
});

// Track received features
let featuresReceived = {
  tips: false,
  suggestions: false,
  pronunciation: false,
  grammar: false,
  report: false
};

studentSocket.on('supervisor-ready', async (data) => {
  console.log('✅ AI Supervisor Ready with Ollama\n');
  console.log('Features enabled:', data.features);
  console.log('\n--- Testing Ollama-Powered Features ---\n');
  
  // Test 1: Word Suggestions with Context
  console.log('1️⃣ Testing Word Suggestions...');
  studentSocket.emit('request-word-suggestions', {
    sessionId: sessionId,
    context: 'I need to explain quarterly revenue projections',
    targetLanguage: 'English'
  });
  
  // Test 2: Pronunciation Guide
  setTimeout(() => {
    console.log('\n2️⃣ Testing Pronunciation Guide...');
    studentSocket.emit('request-pronunciation', {
      sessionId: sessionId,
      word: 'entrepreneurship',
      language: 'English'
    });
  }, 1000);
  
  // Test 3: Grammar Correction
  setTimeout(() => {
    console.log('\n3️⃣ Testing Grammar Correction...');
    studentSocket.emit('request-grammar-check', {
      sessionId: sessionId,
      text: 'The data shows that sales has increased significantly'
    });
  }, 2000);
  
  // Test 4: Simulate conversation for tip generation
  setTimeout(() => {
    console.log('\n4️⃣ Simulating Conversation for AI Tips...');
    
    // Send audio chunks to trigger transcription and analysis
    const sendAudioChunk = () => {
      const audioBuffer = new ArrayBuffer(16000); // 1 second of 16kHz audio
      studentSocket.emit('audio-chunk', {
        sessionId: sessionId,
        role: 'student',
        audio: audioBuffer,
        timestamp: Date.now()
      });
    };
    
    // Send multiple chunks to simulate conversation
    for (let i = 0; i < 5; i++) {
      setTimeout(sendAudioChunk, i * 500);
    }
  }, 3000);
  
  // Test 5: Generate comprehensive session report
  setTimeout(() => {
    console.log('\n5️⃣ Generating AI-Powered Session Report...');
    studentSocket.emit('generate-report', { 
      sessionId: sessionId,
      vocabulary: ['revenue', 'projections', 'quarterly', 'stakeholders'],
      grammarIssues: ['subject-verb agreement', 'article usage'],
      pronunciationChallenges: ['entrepreneurship', 'thoroughly']
    });
  }, 5000);
  
  // Test 6: Generate JoyBox content
  setTimeout(() => {
    console.log('\n6️⃣ Generating JoyBox Learning Content...');
    studentSocket.emit('generate-joybox', {
      sessionId: sessionId,
      keyVocabulary: ['business metrics', 'KPIs', 'ROI'],
      grammarPoints: ['passive voice in reports', 'conditional statements']
    });
  }, 6000);
  
  // Test 7: Generate interactive game
  setTimeout(() => {
    console.log('\n7️⃣ Generating Learning Game...');
    studentSocket.emit('generate-game', {
      sessionId: sessionId,
      gameType: 'business-vocabulary-match'
    });
  }, 7000);
});

// Enhanced event listeners with Ollama responses
studentSocket.on('word-suggestions', (data) => {
  console.log('\n✅ Ollama Word Suggestions:');
  if (data.suggestions && data.suggestions.length > 0) {
    data.suggestions.forEach((s, i) => {
      console.log(`  ${i+1}. ${s.word}: ${s.translation}`);
      console.log(`     Usage: ${s.usage}`);
    });
  }
  featuresReceived.suggestions = true;
});

studentSocket.on('pronunciation-guide', (data) => {
  console.log('\n✅ Ollama Pronunciation Guide:');
  console.log(`  Word: ${data.word}`);
  console.log(`  Phonetic: ${data.phonetic}`);
  console.log(`  Simple: ${data.simple}`);
  if (data.tips && data.tips.length > 0) {
    console.log('  Tips:', data.tips.join(', '));
  }
  featuresReceived.pronunciation = true;
});

studentSocket.on('grammar-correction', (data) => {
  console.log('\n✅ Ollama Grammar Analysis:');
  console.log(`  Original: "${data.original}"`);
  console.log(`  Correct: ${data.isCorrect ? 'Yes' : 'No'}`);
  if (!data.isCorrect) {
    console.log(`  Correction: "${data.correction}"`);
    console.log(`  Explanation: ${data.explanation}`);
  }
  featuresReceived.grammar = true;
});

studentSocket.on('teacher-tip', (data) => {
  console.log('\n💡 Ollama Teacher Tip:');
  console.log(`  Priority: ${data.priority}`);
  console.log(`  Tip: ${data.text}`);
  featuresReceived.tips = true;
});

studentSocket.on('student-tip', (data) => {
  console.log('\n💡 Ollama Student Tip:');
  console.log(`  Priority: ${data.priority}`);
  console.log(`  Tip: ${data.text}`);
});

studentSocket.on('session-report', (data) => {
  console.log('\n📊 Ollama Session Report Generated:');
  console.log(`  Title: ${data.session_title}`);
  console.log(`  Learning Summary: ${data.what_student_learned?.slice(0, 150)}...`);
  console.log('  Scores:', data.scores);
  console.log(`  Next Steps: ${data.next_steps?.slice(0, 100)}...`);
  featuresReceived.report = true;
});

studentSocket.on('joybox-content', (data) => {
  console.log('\n🎁 Ollama JoyBox Content:');
  console.log(`  Type: ${data.item.type}`);
  console.log(`  Title: ${data.item.title}`);
  console.log(`  Why: ${data.item.why}`);
  console.log(`  Duration: ${data.item.duration} minutes`);
});

studentSocket.on('game-generated', (data) => {
  console.log('\n🎮 Ollama Generated Game:');
  console.log(`  Type: ${data.game.type}`);
  console.log(`  Title: ${data.game.title}`);
  console.log(`  Items: ${data.game.items?.length || 0} questions`);
  console.log(`  Duration: ${data.game.duration} minutes`);
});

studentSocket.on('transcript', (data) => {
  console.log(`\n📝 Transcript: "${data.text}" (${data.speaker}, confidence: ${data.confidence})`);
});

studentSocket.on('metrics-update', (data) => {
  console.log(`📈 Metrics: TTT ${data.ttt}% | STT ${data.stt}% | Turns: ${data.turns}`);
});

studentSocket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Check results and disconnect
setTimeout(() => {
  console.log('\n\n=== Ollama Integration Test Results ===');
  console.log(`✅ Word Suggestions: ${featuresReceived.suggestions ? 'WORKING' : 'PENDING'}`);
  console.log(`✅ Pronunciation Guide: ${featuresReceived.pronunciation ? 'WORKING' : 'PENDING'}`);
  console.log(`✅ Grammar Correction: ${featuresReceived.grammar ? 'WORKING' : 'PENDING'}`);
  console.log(`✅ AI Tips Generation: ${featuresReceived.tips ? 'WORKING' : 'PENDING'}`);
  console.log(`✅ Session Reports: ${featuresReceived.report ? 'WORKING' : 'PENDING'}`);
  
  console.log('\n🔚 Ending session...');
  studentSocket.emit('supervisor-end', { sessionId: sessionId });
  
  setTimeout(() => {
    studentSocket.disconnect();
    process.exit(0);
  }, 500);
}, 12000);