import { io } from 'socket.io-client';

console.log('Testing Callern AI Supervisor...\n');

// Connect as student
const studentSocket = io('http://localhost:5000', {
  transports: ['websocket'],
  reconnection: false
});

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
      sessionId: 'test-session-' + Date.now(),
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
  console.log('✅ Supervisor ready:', data);
  
  // Request word suggestions
  console.log('🔤 Requesting word suggestions...');
  studentSocket.emit('request-word-suggestions', {
    sessionId: data.sessionId,
    context: 'I want to explain my daily routine',
    targetLanguage: 'English'
  });
  
  // Request pronunciation guide
  console.log('🗣️ Requesting pronunciation guide...');
  studentSocket.emit('request-pronunciation', {
    sessionId: data.sessionId,
    word: 'schedule',
    language: 'English'
  });
  
  // Request grammar check
  console.log('📝 Requesting grammar check...');
  studentSocket.emit('request-grammar-check', {
    sessionId: data.sessionId,
    text: 'I have went to school yesterday'
  });
});

studentSocket.on('word-suggestions', (data) => {
  console.log('✅ Word suggestions received:', data);
});

studentSocket.on('pronunciation-guide', (data) => {
  console.log('✅ Pronunciation guide received:', data);
});

studentSocket.on('grammar-correction', (data) => {
  console.log('✅ Grammar correction received:', data);
});

studentSocket.on('teacher-tip', (data) => {
  console.log('💡 Teacher tip:', data);
});

studentSocket.on('student-tip', (data) => {
  console.log('💡 Student tip:', data);
});

studentSocket.on('metrics-update', (data) => {
  console.log('📊 Metrics update:', data);
});

studentSocket.on('error', (error) => {
  console.error('❌ Error:', error);
});

// Disconnect after 10 seconds
setTimeout(() => {
  console.log('\n🔌 Disconnecting...');
  studentSocket.disconnect();
  process.exit(0);
}, 10000);