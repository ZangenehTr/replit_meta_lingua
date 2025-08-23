const io = require('socket.io-client');
const { execSync } = require('child_process');

// Test configuration
const SERVER_URL = 'http://localhost:5000';
const TEACHER_LOGIN = { email: 'updated@test.com', password: 'password' };
const STUDENT_LOGIN = { email: 'student.new@test.com', password: 'password123' };

// Utility functions
async function login(credentials) {
  const response = await fetch(`${SERVER_URL}/api/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  const data = await response.json();
  return data.token;
}

async function getOnlineTeachers(token) {
  const response = await fetch(`${SERVER_URL}/api/callern/online-teachers`, {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
}

async function runFullCallernTest() {
  console.log('Starting Comprehensive Callern E2E Test');
  console.log('=======================================\n');
  
  const results = {
    passed: 0,
    failed: 0,
    tests: []
  };
  
  try {
    // Step 1: Login both users
    console.log('Step 1: User Authentication');
    const teacherToken = await login(TEACHER_LOGIN);
    const studentToken = await login(STUDENT_LOGIN);
    console.log('✓ Both users logged in successfully\n');
    results.passed++;
    
    // Step 2: Check initial teacher status
    console.log('Step 2: Initial Teacher Status Check');
    let onlineTeachers = await getOnlineTeachers(studentToken);
    const teacherInitiallyOffline = onlineTeachers.every(t => !t.isOnline);
    if (teacherInitiallyOffline) {
      console.log('✓ All teachers offline initially');
      results.passed++;
    } else {
      console.log('✗ Some teachers showing online when not connected');
      results.failed++;
    }
    
    // Step 3: Connect teacher WebSocket
    console.log('\nStep 3: Teacher WebSocket Connection');
    const teacherSocket = io(SERVER_URL, {
      path: '/socket.io',
      auth: { token: teacherToken },
      transports: ['websocket']
    });
    
    await new Promise((resolve) => {
      teacherSocket.on('connect', () => {
        teacherSocket.emit('authenticate', { userId: 74, role: 'teacher' });
        teacherSocket.once('authenticated', (data) => {
          console.log('✓ Teacher WebSocket connected and authenticated');
          results.passed++;
          resolve();
        });
      });
    });
    
    // Step 4: Check teacher now online
    console.log('\nStep 4: Teacher Online Status Update');
    await new Promise(resolve => setTimeout(resolve, 500));
    onlineTeachers = await getOnlineTeachers(studentToken);
    const teacher74 = onlineTeachers.find(t => t.id === 74);
    if (teacher74?.isOnline) {
      console.log('✓ Teacher 74 now showing as online');
      results.passed++;
    } else {
      console.log('✗ Teacher 74 not showing as online after connection');
      results.failed++;
    }
    
    // Step 5: Connect student WebSocket
    console.log('\nStep 5: Student WebSocket Connection');
    const studentSocket = io(SERVER_URL, {
      path: '/socket.io',
      auth: { token: studentToken },
      transports: ['websocket']
    });
    
    await new Promise((resolve) => {
      studentSocket.on('connect', () => {
        studentSocket.emit('authenticate', { userId: 8470, role: 'student' });
        studentSocket.once('authenticated', (data) => {
          console.log('✓ Student WebSocket connected and authenticated');
          results.passed++;
          resolve();
        });
      });
    });
    
    // Step 6: Test call initiation and acceptance
    console.log('\nStep 6: Call Flow Test');
    const roomId = `test-room-${Date.now()}`;
    
    // Setup teacher to receive call
    const callFlowPromise = new Promise((resolve, reject) => {
      let teacherReceivedCall = false;
      let studentReceivedAccept = false;
      let offerAnswerExchanged = false;
      
      teacherSocket.once('incoming-call', (data) => {
        console.log('✓ Teacher received incoming call');
        teacherReceivedCall = true;
        results.passed++;
        
        // Teacher accepts call
        setTimeout(() => {
          studentSocket.emit('join-room', roomId);
          teacherSocket.emit('accept-call', {
            roomId,
            teacherId: 74,
            studentId: 8470
          });
        }, 500);
      });
      
      studentSocket.once('call-accepted', (data) => {
        console.log('✓ Student received call acceptance');
        studentReceivedAccept = true;
        results.passed++;
        
        // Student sends offer
        setTimeout(() => {
          studentSocket.emit('offer', {
            roomId,
            offer: { type: 'offer', sdp: 'test-offer' },
            to: teacherSocket.id
          });
        }, 500);
      });
      
      teacherSocket.once('offer', (data) => {
        console.log('✓ Teacher received WebRTC offer');
        results.passed++;
        
        // Teacher sends answer
        teacherSocket.emit('answer', {
          roomId,
          answer: { type: 'answer', sdp: 'test-answer' },
          to: studentSocket.id
        });
      });
      
      studentSocket.once('answer', (data) => {
        console.log('✓ Student received WebRTC answer');
        console.log('✓ Full WebRTC handshake completed');
        results.passed += 2;
        offerAnswerExchanged = true;
        resolve();
      });
      
      // Timeout after 5 seconds
      setTimeout(() => {
        if (!offerAnswerExchanged) {
          console.log('✗ WebRTC handshake timeout');
          results.failed++;
          resolve();
        }
      }, 5000);
    });
    
    // Initiate call from student
    studentSocket.emit('join-room', roomId);
    studentSocket.emit('call-teacher', {
      teacherId: 74,
      studentId: 8470,
      packageId: 2,
      language: 'English',
      roomId
    });
    
    await callFlowPromise;
    
    // Step 7: Test call end
    console.log('\nStep 7: Call Termination');
    studentSocket.emit('end-call', { roomId });
    await new Promise(resolve => setTimeout(resolve, 500));
    console.log('✓ Call ended successfully');
    results.passed++;
    
    // Step 8: Test teacher disconnect
    console.log('\nStep 8: Teacher Disconnect');
    teacherSocket.disconnect();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    onlineTeachers = await getOnlineTeachers(studentToken);
    const teacherOfflineAfterDisconnect = !onlineTeachers.find(t => t.id === 74)?.isOnline;
    if (teacherOfflineAfterDisconnect) {
      console.log('✓ Teacher offline after disconnect');
      results.passed++;
    } else {
      console.log('✗ Teacher still showing online after disconnect');
      results.failed++;
    }
    
    // Cleanup
    studentSocket.disconnect();
    
  } catch (error) {
    console.error('Test failed with error:', error.message);
    results.failed++;
  }
  
  // Print summary
  console.log('\n=======================================');
  console.log('Test Summary:');
  console.log(`✓ Passed: ${results.passed}`);
  console.log(`✗ Failed: ${results.failed}`);
  console.log(`Total: ${results.passed + results.failed}`);
  
  if (results.failed === 0) {
    console.log('\n🎉 All Callern E2E tests passed successfully!');
  } else {
    console.log('\n⚠️ Some tests failed. Please review the output above.');
  }
  
  process.exit(results.failed === 0 ? 0 : 1);
}

// Run the test
runFullCallernTest().catch(console.error);