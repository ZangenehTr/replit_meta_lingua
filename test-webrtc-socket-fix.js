import io from 'socket.io-client';

console.log('Testing WebRTC Socket Connection Fix');
console.log('=====================================\n');

const STUDENT_ID = 8469;
const TEACHER_ID = 73;

// Create socket connections for both student and teacher
const studentSocket = io('http://localhost:5000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

const teacherSocket = io('http://localhost:5000', {
  path: '/socket.io/',
  transports: ['websocket', 'polling']
});

let testResults = {
  studentAuthenticated: false,
  teacherAuthenticated: false,
  studentSocketStable: false,
  teacherSocketStable: false,
  callRequestSent: false,
  callAccepted: false,
  iceExchangeSuccessful: false,
  socketIdMatches: true
};

// Track socket IDs to verify they remain stable
let studentSocketId = null;
let teacherSocketId = null;
let roomId = `test-room-${Date.now()}`;

// Student socket setup
studentSocket.on('connect', () => {
  const newSocketId = studentSocket.id;
  console.log(`✅ Student socket connected: ${newSocketId}`);
  
  // Check if socket ID remains stable
  if (studentSocketId && studentSocketId !== newSocketId) {
    console.error(`❌ Student socket ID changed from ${studentSocketId} to ${newSocketId}`);
    testResults.socketIdMatches = false;
  }
  studentSocketId = newSocketId;
  
  // Authenticate as student
  studentSocket.emit('authenticate', {
    userId: STUDENT_ID,
    role: 'Student'
  });
});

studentSocket.on('authenticated', (data) => {
  console.log('✅ Student authenticated:', data);
  testResults.studentAuthenticated = true;
  testResults.studentSocketStable = true;
});

// Teacher socket setup
teacherSocket.on('connect', () => {
  const newSocketId = teacherSocket.id;
  console.log(`✅ Teacher socket connected: ${newSocketId}`);
  
  // Check if socket ID remains stable
  if (teacherSocketId && teacherSocketId !== newSocketId) {
    console.error(`❌ Teacher socket ID changed from ${teacherSocketId} to ${newSocketId}`);
    testResults.socketIdMatches = false;
  }
  teacherSocketId = newSocketId;
  
  // Authenticate as teacher
  teacherSocket.emit('authenticate', {
    userId: TEACHER_ID,
    role: 'Teacher'
  });
});

teacherSocket.on('authenticated', (data) => {
  console.log('✅ Teacher authenticated:', data);
  testResults.teacherAuthenticated = true;
  testResults.teacherSocketStable = true;
  
  // Start the test flow after both are authenticated
  if (testResults.studentAuthenticated) {
    startCallFlow();
  }
});

// Teacher listens for call requests
teacherSocket.on('call-request', (data) => {
  console.log('✅ Teacher received call request:', data);
  testResults.callRequestSent = true;
  
  // Teacher accepts the call
  setTimeout(() => {
    console.log('Teacher accepting call...');
    teacherSocket.emit('accept-call', {
      roomId: data.roomId,
      teacherId: TEACHER_ID,
      studentId: data.studentId
    });
  }, 1000);
});

// Student listens for call acceptance
studentSocket.on('call-accepted', (data) => {
  console.log('✅ Student received call-accepted:', data);
  console.log('  Teacher socket ID:', data.teacherSocketId);
  testResults.callAccepted = true;
  
  // Verify teacher socket ID is present
  if (!data.teacherSocketId) {
    console.error('❌ Teacher socket ID missing in call-accepted event');
    testResults.socketIdMatches = false;
  } else {
    console.log('✅ Teacher socket ID properly transmitted');
    
    // Simulate sending an ICE candidate to verify the connection
    setTimeout(() => {
      console.log('Student sending test ICE candidate...');
      studentSocket.emit('ice-candidate', {
        roomId: roomId,
        candidate: { type: 'test-candidate' },
        to: data.teacherSocketId
      });
    }, 500);
  }
});

// Teacher listens for ICE candidates
teacherSocket.on('ice-candidate', (data) => {
  console.log('✅ Teacher received ICE candidate:', data);
  console.log('  From socket:', data.from);
  console.log('  Candidate:', data.candidate);
  
  if (data.from && data.candidate) {
    testResults.iceExchangeSuccessful = true;
    console.log('✅ ICE exchange successful - WebRTC can proceed');
  } else {
    console.error('❌ ICE candidate missing required fields');
  }
  
  // Complete the test
  setTimeout(() => completeTest(), 1000);
});

// Handle errors
studentSocket.on('error', (error) => {
  console.error('❌ Student socket error:', error);
});

teacherSocket.on('error', (error) => {
  console.error('❌ Teacher socket error:', error);
});

function startCallFlow() {
  console.log('\n📞 Starting call flow test...\n');
  
  // Student joins room
  studentSocket.emit('join-room', {
    roomId: roomId,
    userId: STUDENT_ID,
    role: 'student'
  });
  
  // Student calls teacher
  setTimeout(() => {
    console.log('Student calling teacher...');
    studentSocket.emit('call-teacher', {
      teacherId: TEACHER_ID,
      studentId: STUDENT_ID,
      packageId: 1,
      language: 'English',
      roomId: roomId
    });
  }, 500);
}

function completeTest() {
  console.log('\n========== TEST RESULTS ==========\n');
  
  let passed = 0;
  let failed = 0;
  
  for (const [test, result] of Object.entries(testResults)) {
    const status = result ? '✅ PASS' : '❌ FAIL';
    console.log(`${status}: ${test}`);
    if (result) passed++;
    else failed++;
  }
  
  console.log('\n==================================');
  console.log(`Total: ${passed} passed, ${failed} failed`);
  
  if (failed === 0) {
    console.log('\n🎉 All tests passed! WebRTC connection should work properly.');
  } else {
    console.log('\n⚠️ Some tests failed. WebRTC connection may have issues.');
  }
  
  // Cleanup
  studentSocket.disconnect();
  teacherSocket.disconnect();
  process.exit(failed === 0 ? 0 : 1);
}

// Timeout handler
setTimeout(() => {
  console.error('\n❌ Test timeout - not all events were received');
  completeTest();
}, 10000);