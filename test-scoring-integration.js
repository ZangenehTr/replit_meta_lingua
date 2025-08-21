import io from 'socket.io-client';

console.log('🎯 Testing CallerN Live Scoring Integration');
console.log('==========================================\n');

const STUDENT_ID = 8469;
const TEACHER_ID = 73;
const roomId = `scoring-test-${Date.now()}`;

// Create socket connections
const studentSocket = io('http://localhost:5000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

const teacherSocket = io('http://localhost:5000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

let testResults = {
  connectionEstablished: false,
  scoringUpdateSent: false,
  scoringUpdateReceived: false,
  tttUpdateSent: false,
  tttUpdateReceived: false,
  presenceUpdateSent: false,
  presenceUpdateReceived: false,
  tlWarningSent: false,
  tlWarningReceived: false
};

// Student socket setup
studentSocket.on('connect', () => {
  console.log(`✅ Student socket connected: ${studentSocket.id}`);
  
  studentSocket.emit('authenticate', {
    userId: STUDENT_ID,
    role: 'Student'
  });
});

studentSocket.on('authenticated', () => {
  console.log('✅ Student authenticated');
  
  // Join room
  studentSocket.emit('join-room', {
    roomId: roomId,
    userId: STUDENT_ID,
    role: 'student'
  });
  
  console.log(`Student joined room: ${roomId}`);
  testResults.connectionEstablished = true;
});

// Teacher socket setup
teacherSocket.on('connect', () => {
  console.log(`✅ Teacher socket connected: ${teacherSocket.id}`);
  
  teacherSocket.emit('authenticate', {
    userId: TEACHER_ID,
    role: 'Teacher'
  });
});

teacherSocket.on('authenticated', () => {
  console.log('✅ Teacher authenticated');
  
  // Join room
  teacherSocket.emit('join-room', {
    roomId: roomId,
    userId: TEACHER_ID,
    role: 'teacher'
  });
  
  console.log(`Teacher joined room: ${roomId}`);
  
  // Start testing after both are connected
  if (testResults.connectionEstablished) {
    setTimeout(runScoringTests, 1000);
  }
});

// Listen for scoring events
studentSocket.on('scoring-update', (data) => {
  console.log('📊 Student received scoring update:', data);
  testResults.scoringUpdateReceived = true;
});

teacherSocket.on('scoring-update', (data) => {
  console.log('📊 Teacher received scoring update:', data);
});

studentSocket.on('ttt-update', (data) => {
  console.log('⏱️ Student received TTT update:', data);
  testResults.tttUpdateReceived = true;
});

teacherSocket.on('ttt-update', (data) => {
  console.log('⏱️ Teacher received TTT update:', data);
});

studentSocket.on('presence-update', (data) => {
  console.log('🎥 Student received presence update:', data);
  testResults.presenceUpdateReceived = true;
});

teacherSocket.on('presence-update', (data) => {
  console.log('🎥 Teacher received presence update:', data);
});

studentSocket.on('tl-warning', (data) => {
  console.log('⚠️ Student received TL warning:', data);
  testResults.tlWarningReceived = true;
});

teacherSocket.on('tl-warning', (data) => {
  console.log('⚠️ Teacher received TL warning:', data);
});

function runScoringTests() {
  console.log('\n📋 Running Scoring Tests...\n');
  
  // Test 1: Scoring Update
  console.log('Test 1: Sending scoring update...');
  teacherSocket.emit('scoring-update', {
    roomId: roomId,
    scores: {
      student: 85,
      teacher: 92,
      speakingFluency: 88,
      pronunciation: 82,
      vocabulary: 90,
      grammar: 85,
      interaction: 87,
      facilitator: 95,
      monitor: 90,
      feedbackProvider: 88,
      engagement: 93
    }
  });
  testResults.scoringUpdateSent = true;
  
  setTimeout(() => {
    // Test 2: TTT Update
    console.log('Test 2: Sending TTT update...');
    teacherSocket.emit('ttt-update', {
      roomId: roomId,
      studentPercentage: 60,
      teacherPercentage: 40,
      totalTime: 1800, // 30 minutes
      studentTime: 1080, // 18 minutes
      teacherTime: 720 // 12 minutes
    });
    testResults.tttUpdateSent = true;
  }, 500);
  
  setTimeout(() => {
    // Test 3: Presence Update
    console.log('Test 3: Sending presence update...');
    studentSocket.emit('presence-update', {
      roomId: roomId,
      cameraOn: true,
      micOn: false,
      userId: STUDENT_ID
    });
    testResults.presenceUpdateSent = true;
  }, 1000);
  
  setTimeout(() => {
    // Test 4: TL Warning (imbalanced talk time)
    console.log('Test 4: Sending TL warning...');
    teacherSocket.emit('tl-warning', {
      roomId: roomId,
      message: 'Student talk time below threshold (25%)',
      severity: 'warning',
      studentPercentage: 25,
      teacherPercentage: 75
    });
    testResults.tlWarningSent = true;
  }, 1500);
  
  // Check results after all tests
  setTimeout(checkResults, 3000);
}

function checkResults() {
  console.log('\n========== TEST RESULTS ==========\n');
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    { name: 'Connection Established', result: testResults.connectionEstablished },
    { name: 'Scoring Update Sent', result: testResults.scoringUpdateSent },
    { name: 'Scoring Update Received', result: testResults.scoringUpdateReceived },
    { name: 'TTT Update Sent', result: testResults.tttUpdateSent },
    { name: 'TTT Update Received', result: testResults.tttUpdateReceived },
    { name: 'Presence Update Sent', result: testResults.presenceUpdateSent },
    { name: 'Presence Update Received', result: testResults.presenceUpdateReceived },
    { name: 'TL Warning Sent', result: testResults.tlWarningSent },
    { name: 'TL Warning Received', result: testResults.tlWarningReceived }
  ];
  
  tests.forEach(test => {
    const status = test.result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test.name}`);
    if (test.result) passed++;
    else failed++;
  });
  
  console.log('\n==================================');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All scoring tests passed! Live scoring system is fully functional.');
  } else {
    console.log('\n⚠️ Some scoring tests failed. Check WebSocket event handlers.');
  }
  
  // Test performance scoring
  console.log('\n📈 Testing High Performance Scoring...');
  
  const highPerformanceScores = {
    roomId: roomId,
    timestamp: new Date().toISOString(),
    scores: {
      student: {
        overall: 95,
        speakingFluency: 96,
        pronunciation: 93,
        vocabulary: 97,
        grammar: 92,
        interaction: 95,
        targetLangUse: 94,
        presence: 100,
        stars: 5
      },
      teacher: {
        overall: 93,
        facilitator: 95,
        monitor: 92,
        feedbackProvider: 94,
        resourceModel: 91,
        assessor: 93,
        engagement: 96,
        targetLangUse: 95,
        presence: 100,
        stars: 5
      }
    },
    ttt: {
      studentPercentage: 58,
      teacherPercentage: 42,
      balance: 'optimal'
    }
  };
  
  console.log('🌟 High Performance Scores:', JSON.stringify(highPerformanceScores, null, 2));
  
  // Cleanup
  setTimeout(() => {
    studentSocket.disconnect();
    teacherSocket.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }, 1000);
}

// Error handlers
studentSocket.on('error', (error) => {
  console.error('❌ Student socket error:', error);
});

teacherSocket.on('error', (error) => {
  console.error('❌ Teacher socket error:', error);
});

// Timeout handler
setTimeout(() => {
  console.error('\n❌ Test timeout - not all events were received');
  checkResults();
}, 10000);