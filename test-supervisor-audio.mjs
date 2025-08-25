import { io } from 'socket.io-client';

console.log('Testing Callern AI Supervisor with Audio Stream...\n');

// Connect as student
const studentSocket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: false
});

const sessionId = 'test-audio-' + Date.now();

studentSocket.on('connect', () => {
  console.log('✅ Student connected');
  
  // Authenticate
  studentSocket.emit('authenticate', { 
    userId: 8470, 
    role: 'student' 
  });
  
  // Initialize supervisor session
  setTimeout(() => {
    console.log('📊 Initializing supervisor session...');
    studentSocket.emit('supervisor-init', {
      sessionId: sessionId,
      studentId: 8470,
      teacherId: 74,
      lessonTitle: 'English Conversation Practice',
      objectives: ['Practice speaking', 'Learn vocabulary'],
      studentLevel: 'B1'
    });
  }, 500);
});

// Listen for supervisor events
studentSocket.on('supervisor-ready', (data) => {
  console.log('✅ Supervisor ready');
  
  // Simulate audio streaming
  console.log('🎤 Simulating audio stream...');
  
  // Send mock audio chunks (simulate 5 seconds of audio)
  let chunksSent = 0;
  const audioInterval = setInterval(() => {
    // Create mock audio buffer (100ms of 16kHz audio)
    const mockAudioBuffer = new ArrayBuffer(3200);
    
    studentSocket.emit('audio-chunk', {
      sessionId: sessionId,
      role: 'student',
      audio: mockAudioBuffer,
      timestamp: Date.now()
    });
    
    chunksSent++;
    if (chunksSent >= 50) { // 5 seconds worth
      clearInterval(audioInterval);
      console.log('✅ Audio streaming complete');
      
      // Test feedback stack
      testFeedbackStack();
    }
  }, 100);
});

function testFeedbackStack() {
  console.log('\n📝 Testing feedback stack...');
  
  // Add feedback item
  studentSocket.emit('feedback-stack-add', {
    sessionId: sessionId,
    item: {
      type: 'pronunciation',
      content: 'Student mispronounced "schedule" as "sked-yool"',
      timestamp: Date.now()
    }
  });
  
  // Get feedback stack
  setTimeout(() => {
    studentSocket.emit('feedback-stack-get', { sessionId: sessionId });
  }, 500);
  
  // Generate session report
  setTimeout(() => {
    console.log('\n📊 Generating session report...');
    studentSocket.emit('generate-report', { sessionId: sessionId });
  }, 1000);
  
  // Generate JoyBox content
  setTimeout(() => {
    console.log('\n🎁 Generating JoyBox content...');
    studentSocket.emit('generate-joybox', {
      sessionId: sessionId,
      keyVocabulary: ['daily routine', 'schedule', 'appointment'],
      grammarPoints: ['present simple', 'time expressions']
    });
  }, 1500);
  
  // Generate game
  setTimeout(() => {
    console.log('\n🎮 Generating game from session...');
    studentSocket.emit('generate-game', {
      sessionId: sessionId,
      gameType: 'cloze'
    });
  }, 2000);
}

// Listen for all events
studentSocket.on('transcript', (data) => {
  console.log('📝 Transcript:', data.text, `(${data.speaker})`);
});

studentSocket.on('teacher-tip', (data) => {
  console.log('💡 Teacher tip:', data.text);
});

studentSocket.on('student-tip', (data) => {
  console.log('💡 Student tip:', data.text);
});

studentSocket.on('metrics-update', (data) => {
  console.log('📊 Metrics:', `TTT: ${data.ttt}%, STT: ${data.stt}%`);
});

studentSocket.on('feedback-stack', (data) => {
  console.log('📚 Feedback stack:', data.stack);
});

studentSocket.on('session-report', (data) => {
  console.log('📄 Session report generated:', {
    title: data.session_title,
    learned: data.what_student_learned?.slice(0, 100) + '...',
    scores: data.scores
  });
});

studentSocket.on('joybox-content', (data) => {
  console.log('🎁 JoyBox item:', data.item);
});

studentSocket.on('game-generated', (data) => {
  console.log('🎮 Game generated:', {
    type: data.game.type,
    title: data.game.title,
    items: data.game.items?.length || 0
  });
});

studentSocket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// End session and disconnect after 10 seconds
setTimeout(() => {
  console.log('\n🔚 Ending supervisor session...');
  studentSocket.emit('supervisor-end', { sessionId: sessionId });
  
  setTimeout(() => {
    console.log('🔌 Disconnecting...');
    studentSocket.disconnect();
    process.exit(0);
  }, 1000);
}, 10000);