import io from 'socket.io-client';

console.log('🎯 Testing CallerN Student-to-Teacher Call Flow');
console.log('==============================================\n');

const STUDENT_ID = 8469;
const TEACHER_ID = 73;
const PACKAGE_ID = 1;
const roomId = `callern-test-${Date.now()}`;

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
  studentConnected: false,
  teacherConnected: false,
  studentAuthenticated: false,
  teacherAuthenticated: false,
  callRequested: false,
  teacherReceivedCall: false,
  callAccepted: false,
  studentReceivedAcceptance: false
};

// Student socket setup
studentSocket.on('connect', () => {
  console.log(`✅ Student socket connected: ${studentSocket.id}`);
  testResults.studentConnected = true;
  
  studentSocket.emit('authenticate', {
    userId: STUDENT_ID,
    role: 'Student'
  });
});

studentSocket.on('authenticated', () => {
  console.log('✅ Student authenticated');
  testResults.studentAuthenticated = true;
  
  // Student joins room first
  studentSocket.emit('join-room', {
    roomId: roomId,
    userId: STUDENT_ID,
    role: 'student'
  });
  
  console.log(`Student joined room: ${roomId}`);
  
  // Wait a bit then make the call
  setTimeout(makeCall, 1000);
});

// Teacher socket setup
teacherSocket.on('connect', () => {
  console.log(`✅ Teacher socket connected: ${teacherSocket.id}`);
  testResults.teacherConnected = true;
  
  teacherSocket.emit('authenticate', {
    userId: TEACHER_ID,
    role: 'Teacher'
  });
});

teacherSocket.on('authenticated', () => {
  console.log('✅ Teacher authenticated');
  testResults.teacherAuthenticated = true;
});

// Teacher receives incoming call
teacherSocket.on('incoming-call', (data) => {
  console.log('📞 Teacher received incoming call:', data);
  testResults.teacherReceivedCall = true;
  
  // Auto-accept the call after 1 second
  setTimeout(() => {
    console.log('Teacher accepting call...');
    
    // Teacher joins the room
    teacherSocket.emit('join-room', {
      roomId: data.roomId,
      userId: TEACHER_ID,
      role: 'teacher'
    });
    
    // Teacher accepts the call
    teacherSocket.emit('accept-call', {
      roomId: data.roomId,
      studentId: data.studentId,
      teacherId: TEACHER_ID,
      teacherSocketId: teacherSocket.id
    });
    
    testResults.callAccepted = true;
    console.log('✅ Teacher accepted the call');
  }, 1000);
});

// Student receives call acceptance
studentSocket.on('call-accepted', (data) => {
  console.log('✅ Student received call acceptance:', data);
  testResults.studentReceivedAcceptance = true;
  
  // Test complete, check results
  setTimeout(checkResults, 1000);
});

// Handle errors
studentSocket.on('error', (error) => {
  console.error('❌ Student socket error:', error);
});

teacherSocket.on('error', (error) => {
  console.error('❌ Teacher socket error:', error);
});

function makeCall() {
  console.log('\n📱 Student initiating call to teacher...');
  
  // Emit call request
  studentSocket.emit('call-teacher', {
    teacherId: TEACHER_ID,
    studentId: STUDENT_ID,
    packageId: PACKAGE_ID,
    language: 'English',
    roomId: roomId
  });
  
  testResults.callRequested = true;
  console.log(`Call request sent - Room: ${roomId}`);
}

function checkResults() {
  console.log('\n========== TEST RESULTS ==========\n');
  
  let passed = 0;
  let failed = 0;
  
  const tests = [
    { name: 'Student Connected', result: testResults.studentConnected },
    { name: 'Teacher Connected', result: testResults.teacherConnected },
    { name: 'Student Authenticated', result: testResults.studentAuthenticated },
    { name: 'Teacher Authenticated', result: testResults.teacherAuthenticated },
    { name: 'Call Requested', result: testResults.callRequested },
    { name: 'Teacher Received Call', result: testResults.teacherReceivedCall },
    { name: 'Call Accepted', result: testResults.callAccepted },
    { name: 'Student Received Acceptance', result: testResults.studentReceivedAcceptance }
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
    console.log('\n🎉 All tests passed! CallerN call flow is working correctly.');
  } else {
    console.log('\n⚠️ Some tests failed. Check the WebSocket server and authentication.');
  }
  
  // End the call
  studentSocket.emit('end-call', { roomId: roomId });
  teacherSocket.emit('end-call', { roomId: roomId });
  
  // Cleanup
  setTimeout(() => {
    studentSocket.disconnect();
    teacherSocket.disconnect();
    process.exit(failed === 0 ? 0 : 1);
  }, 1000);
}

// Timeout handler
setTimeout(() => {
  console.error('\n❌ Test timeout - not all events were received');
  checkResults();
}, 10000);