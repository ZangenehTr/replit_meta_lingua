#!/usr/bin/env node

/**
 * End-to-End WebRTC Connection Test
 * This test simulates a complete call flow between student and teacher
 */

import { io } from 'socket.io-client';
import axios from 'axios';

const API_URL = 'http://localhost:5000';
const WS_URL = 'http://localhost:5000';

// Test credentials
const TEACHER_CREDENTIALS = {
  email: 'teacher2@test.com',
  password: 'Test123!'
};

const STUDENT_CREDENTIALS = {
  email: 'student2@test.com',
  password: 'Test123!'
};

// Color codes
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  magenta: '\x1b[35m',
  cyan: '\x1b[36m'
};

function log(message, color = 'reset', prefix = '') {
  const timestamp = new Date().toISOString().split('T')[1].slice(0, 8);
  console.log(`${colors[color]}[${timestamp}]${prefix ? ` [${prefix}]` : ''} ${message}${colors.reset}`);
}

class CallParticipant {
  constructor(role, credentials) {
    this.role = role;
    this.credentials = credentials;
    this.token = null;
    this.socket = null;
    this.userId = role === 'teacher' ? 74 : 8470;
    this.events = [];
    this.roomId = null;
  }

  async login() {
    try {
      const response = await axios.post(`${API_URL}/api/login`, this.credentials);
      this.token = response.data.token;
      log(`${this.role} logged in successfully`, 'green', this.role.toUpperCase());
      return true;
    } catch (error) {
      log(`Failed to login: ${error.message}`, 'red', this.role.toUpperCase());
      return false;
    }
  }

  connectWebSocket() {
    return new Promise((resolve, reject) => {
      this.socket = io(WS_URL, {
        path: '/socket.io/',
        transports: ['websocket', 'polling'],
        auth: { token: this.token }
      });

      this.socket.on('connect', () => {
        log(`WebSocket connected`, 'green', this.role.toUpperCase());
        this.events.push('connected');
        
        // Authenticate
        this.socket.emit('authenticate', {
          userId: this.userId,
          role: this.role
        });
      });

      this.socket.on('authenticated', (data) => {
        log(`Authenticated: ${JSON.stringify(data)}`, 'green', this.role.toUpperCase());
        this.events.push('authenticated');
        resolve(true);
      });

      this.socket.on('error', (error) => {
        log(`WebSocket error: ${error}`, 'red', this.role.toUpperCase());
        this.events.push(`error: ${error}`);
      });

      this.socket.on('disconnect', (reason) => {
        log(`Disconnected: ${reason}`, 'yellow', this.role.toUpperCase());
        this.events.push(`disconnected: ${reason}`);
      });

      setTimeout(() => {
        reject(new Error('WebSocket connection timeout'));
      }, 5000);
    });
  }

  setupCallHandlers() {
    if (this.role === 'teacher') {
      this.socket.on('incoming-call', (data) => {
        log(`Incoming call from student ${data.studentId}`, 'cyan', 'TEACHER');
        this.events.push('incoming-call');
        this.roomId = data.roomId;
        
        // Auto-accept for testing
        setTimeout(() => {
          log(`Accepting call`, 'cyan', 'TEACHER');
          this.socket.emit('accept-call', {
            roomId: data.roomId,
            teacherId: this.userId,
            studentId: data.studentId
          });
          this.events.push('accepted-call');
        }, 1000);
      });

      this.socket.on('user-joined', (data) => {
        log(`User joined room: ${JSON.stringify(data)}`, 'cyan', 'TEACHER');
        this.events.push('user-joined');
      });

      this.socket.on('offer', (data) => {
        log(`Received offer from student`, 'magenta', 'TEACHER');
        this.events.push('offer-received');
        
        // Simulate sending answer
        setTimeout(() => {
          log(`Sending answer to student`, 'magenta', 'TEACHER');
          this.socket.emit('answer', {
            roomId: this.roomId,
            answer: { type: 'answer', sdp: 'fake-answer-sdp' },
            to: data.from
          });
          this.events.push('answer-sent');
        }, 500);
      });

    } else if (this.role === 'student') {
      this.socket.on('call-accepted', (data) => {
        log(`Call accepted by teacher ${data.teacherId}`, 'cyan', 'STUDENT');
        this.events.push('call-accepted');
        
        // Join room and initiate WebRTC
        this.socket.emit('join-room', {
          roomId: this.roomId,
          userId: this.userId,
          role: 'student'
        });
        
        // Simulate sending offer
        setTimeout(() => {
          log(`Sending offer to teacher`, 'magenta', 'STUDENT');
          this.socket.emit('offer', {
            roomId: this.roomId,
            offer: { type: 'offer', sdp: 'fake-offer-sdp' },
            to: data.teacherSocketId
          });
          this.events.push('offer-sent');
        }, 500);
      });

      this.socket.on('call-rejected', (data) => {
        log(`Call rejected: ${data.reason}`, 'red', 'STUDENT');
        this.events.push('call-rejected');
      });

      this.socket.on('user-joined', (data) => {
        log(`User joined room: ${JSON.stringify(data)}`, 'cyan', 'STUDENT');
        this.events.push('user-joined');
      });

      this.socket.on('answer', (data) => {
        log(`Received answer from teacher`, 'magenta', 'STUDENT');
        this.events.push('answer-received');
      });

      this.socket.on('ice-candidate', (data) => {
        log(`Received ICE candidate`, 'blue', this.role.toUpperCase());
        this.events.push('ice-candidate');
      });
    }
  }

  async initiateCall(teacherId) {
    if (this.role !== 'student') {
      throw new Error('Only students can initiate calls');
    }

    const roomId = `test-room-${Date.now()}`;
    this.roomId = roomId;

    log(`Initiating call to teacher ${teacherId}`, 'cyan', 'STUDENT');
    
    // First join the room
    this.socket.emit('join-room', {
      roomId: roomId,
      userId: this.userId,
      role: 'student'
    });

    // Then request the call
    setTimeout(() => {
      this.socket.emit('call-teacher', {
        teacherId: teacherId,
        studentId: this.userId,
        packageId: 2, // Student's package ID
        language: 'English',
        roomId: roomId
      });
      this.events.push('call-initiated');
    }, 500);
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      log(`Disconnected`, 'yellow', this.role.toUpperCase());
    }
  }

  getEventSummary() {
    return this.events.join(' -> ');
  }
}

async function test1_BasicCallFlow() {
  log('\n=== Test 1: Basic Call Flow ===', 'blue');
  
  const teacher = new CallParticipant('teacher', TEACHER_CREDENTIALS);
  const student = new CallParticipant('student', STUDENT_CREDENTIALS);
  
  try {
    // 1. Login both participants
    await teacher.login();
    await student.login();
    
    // 2. Connect WebSockets
    await teacher.connectWebSocket();
    await student.connectWebSocket();
    
    // 3. Setup call handlers
    teacher.setupCallHandlers();
    student.setupCallHandlers();
    
    // 4. Student initiates call
    await student.initiateCall(74);
    
    // 5. Wait for call flow to complete
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // 6. Check events
    log('\nTeacher events: ' + teacher.getEventSummary(), 'cyan');
    log('Student events: ' + student.getEventSummary(), 'cyan');
    
    // Verify critical events
    const teacherHasIncomingCall = teacher.events.includes('incoming-call');
    const teacherAccepted = teacher.events.includes('accepted-call');
    const studentGotAccepted = student.events.includes('call-accepted');
    const offerExchanged = teacher.events.includes('offer-received') && student.events.includes('offer-sent');
    const answerExchanged = teacher.events.includes('answer-sent') && student.events.includes('answer-received');
    
    if (teacherHasIncomingCall && teacherAccepted && studentGotAccepted) {
      log('✓ Call signaling completed successfully', 'green');
      
      if (offerExchanged && answerExchanged) {
        log('✓ WebRTC offer/answer exchange completed', 'green');
        return true;
      } else {
        log('✗ WebRTC offer/answer exchange failed', 'red');
        return false;
      }
    } else {
      log('✗ Call signaling failed', 'red');
      return false;
    }
    
  } finally {
    teacher.disconnect();
    student.disconnect();
  }
}

async function test2_TeacherBusyScenario() {
  log('\n=== Test 2: Teacher Busy Scenario ===', 'blue');
  
  const teacher = new CallParticipant('teacher', TEACHER_CREDENTIALS);
  const student1 = new CallParticipant('student', STUDENT_CREDENTIALS);
  const student2 = new CallParticipant('student', STUDENT_CREDENTIALS);
  student2.userId = 8471; // Different student ID
  
  try {
    // Setup
    await teacher.login();
    await student1.login();
    await teacher.connectWebSocket();
    await student1.connectWebSocket();
    teacher.setupCallHandlers();
    student1.setupCallHandlers();
    
    // Student 1 initiates call
    await student1.initiateCall(74);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Student 2 tries to call while teacher is busy
    await student2.login();
    await student2.connectWebSocket();
    student2.setupCallHandlers();
    
    await student2.initiateCall(74);
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Check if student 2 got appropriate response
    const student2Rejected = student2.events.some(e => 
      e.includes('error') || e.includes('rejected') || e.includes('unavailable')
    );
    
    if (student2Rejected) {
      log('✓ Second call correctly rejected when teacher is busy', 'green');
      return true;
    } else {
      log('✗ Teacher accepted multiple calls simultaneously', 'red');
      return false;
    }
    
  } finally {
    teacher.disconnect();
    student1.disconnect();
    student2.disconnect();
  }
}

async function test3_RoomPersistence() {
  log('\n=== Test 3: Room Persistence ===', 'blue');
  
  const teacher = new CallParticipant('teacher', TEACHER_CREDENTIALS);
  const student = new CallParticipant('student', STUDENT_CREDENTIALS);
  
  try {
    await teacher.login();
    await student.login();
    await teacher.connectWebSocket();
    await student.connectWebSocket();
    
    teacher.setupCallHandlers();
    student.setupCallHandlers();
    
    // Track room joins
    let teacherJoinedRoom = false;
    let studentJoinedRoom = false;
    
    teacher.socket.on('user-joined', (data) => {
      if (data.role === 'student') {
        log('Teacher sees student joined room', 'cyan', 'TEACHER');
        teacherJoinedRoom = true;
      }
    });
    
    student.socket.on('user-joined', (data) => {
      if (data.role === 'teacher') {
        log('Student sees teacher joined room', 'cyan', 'STUDENT');
        studentJoinedRoom = true;
      }
    });
    
    await student.initiateCall(74);
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    if (teacherJoinedRoom || studentJoinedRoom) {
      log('✓ Room join notifications working', 'green');
      return true;
    } else {
      log('✗ Room join notifications not received', 'red');
      return false;
    }
    
  } finally {
    teacher.disconnect();
    student.disconnect();
  }
}

async function runTests() {
  log('Starting WebRTC Connection Tests', 'yellow');
  log('=================================', 'yellow');
  
  const results = [];
  
  try {
    results.push(await test1_BasicCallFlow());
    results.push(await test2_TeacherBusyScenario());
    results.push(await test3_RoomPersistence());
  } catch (error) {
    log(`\nTest suite failed: ${error.message}`, 'red');
  }
  
  // Summary
  log('\n=================================', 'yellow');
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  if (failed === 0) {
    log(`All ${passed} tests passed! ✓`, 'green');
  } else {
    log(`${passed} passed, ${failed} failed`, 'red');
    log('\nCommon issues to check:', 'yellow');
    log('1. Teacher socket not properly registered', 'yellow');
    log('2. Room not being created on call-teacher event', 'yellow');
    log('3. Socket IDs not matching between accept-call and WebRTC signaling', 'yellow');
    log('4. Teacher currentCall state not being cleared', 'yellow');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});