#!/usr/bin/env node

/**
 * Test for Teacher Online/Offline Status
 * This test verifies that teacher status is correctly tracked via WebSocket
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

let teacherToken = null;
let studentToken = null;
let teacherSocket = null;
let studentSocket = null;

// Color codes for output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function login(credentials) {
  try {
    const response = await axios.post(`${API_URL}/api/login`, credentials);
    return response.data.token;
  } catch (error) {
    log(`Failed to login with ${credentials.email}: ${error.message}`, 'red');
    throw error;
  }
}

async function getOnlineTeachers(token) {
  try {
    const response = await axios.get(`${API_URL}/api/callern/online-teachers`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    return response.data;
  } catch (error) {
    log(`Failed to get online teachers: ${error.message}`, 'red');
    throw error;
  }
}

async function test1_TeacherOfflineByDefault() {
  log('\n=== Test 1: Teacher Offline by Default ===', 'blue');
  
  // Login as student and check online teachers before teacher connects
  studentToken = await login(STUDENT_CREDENTIALS);
  log('Student logged in successfully', 'green');
  
  const teachers = await getOnlineTeachers(studentToken);
  const teacher2 = teachers.find(t => t.email === 'teacher2@test.com');
  
  if (teacher2 && !teacher2.isOnline) {
    log('✓ Teacher 2 is offline by default', 'green');
    return true;
  } else {
    log('✗ Teacher 2 should be offline but is showing as online', 'red');
    return false;
  }
}

async function test2_TeacherOnlineAfterSocketConnect() {
  log('\n=== Test 2: Teacher Online After WebSocket Connection ===', 'blue');
  
  // Login as teacher
  teacherToken = await login(TEACHER_CREDENTIALS);
  log('Teacher logged in successfully', 'green');
  
  // Connect teacher via WebSocket
  return new Promise((resolve) => {
    teacherSocket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: { token: teacherToken }
    });
    
    teacherSocket.on('connect', () => {
      log('Teacher WebSocket connected', 'green');
      
      // Authenticate as teacher
      teacherSocket.emit('authenticate', {
        userId: 74, // Teacher 2's ID
        role: 'teacher'
      });
    });
    
    teacherSocket.on('authenticated', async () => {
      log('Teacher authenticated via WebSocket', 'green');
      
      // Wait a bit for status to propagate
      await new Promise(r => setTimeout(r, 1000));
      
      // Check if teacher is now online
      const teachers = await getOnlineTeachers(studentToken);
      const teacher2 = teachers.find(t => t.email === 'teacher2@test.com');
      
      if (teacher2 && teacher2.isOnline) {
        log('✓ Teacher 2 is now online after WebSocket connection', 'green');
        resolve(true);
      } else {
        log('✗ Teacher 2 should be online but is still showing as offline', 'red');
        resolve(false);
      }
    });
    
    teacherSocket.on('error', (error) => {
      log(`Teacher WebSocket error: ${error}`, 'red');
      resolve(false);
    });
    
    setTimeout(() => {
      log('✗ Teacher WebSocket connection timeout', 'red');
      resolve(false);
    }, 5000);
  });
}

async function test3_TeacherOfflineAfterDisconnect() {
  log('\n=== Test 3: Teacher Offline After Disconnect ===', 'blue');
  
  if (!teacherSocket) {
    log('✗ No teacher socket to disconnect', 'red');
    return false;
  }
  
  // Disconnect teacher
  teacherSocket.disconnect();
  log('Teacher WebSocket disconnected', 'yellow');
  
  // Wait for status to propagate
  await new Promise(r => setTimeout(r, 1500));
  
  // Check if teacher is now offline
  const teachers = await getOnlineTeachers(studentToken);
  const teacher2 = teachers.find(t => t.email === 'teacher2@test.com');
  
  if (teacher2 && !teacher2.isOnline) {
    log('✓ Teacher 2 is offline after disconnect', 'green');
    return true;
  } else {
    log('✗ Teacher 2 should be offline but is still showing as online', 'red');
    return false;
  }
}

async function test4_MultipleTeachersStatus() {
  log('\n=== Test 4: Multiple Teachers Status Tracking ===', 'blue');
  
  // This would test if multiple teachers can be tracked independently
  // For now, we'll just verify Teacher 1 stays offline while Teacher 2 connects
  
  const teachers = await getOnlineTeachers(studentToken);
  const teacher1 = teachers.find(t => t.email === 'teacher1@test.com');
  const teacher2 = teachers.find(t => t.email === 'teacher2@test.com');
  
  if (teacher1 && !teacher1.isOnline) {
    log('✓ Teacher 1 remains offline (not connected)', 'green');
  } else {
    log('✗ Teacher 1 should be offline', 'red');
    return false;
  }
  
  // Reconnect Teacher 2
  return new Promise((resolve) => {
    teacherSocket = io(WS_URL, {
      path: '/socket.io/',
      transports: ['websocket', 'polling'],
      auth: { token: teacherToken }
    });
    
    teacherSocket.on('connect', () => {
      teacherSocket.emit('authenticate', {
        userId: 74,
        role: 'teacher'
      });
    });
    
    teacherSocket.on('authenticated', async () => {
      await new Promise(r => setTimeout(r, 1000));
      
      const updatedTeachers = await getOnlineTeachers(studentToken);
      const t1 = updatedTeachers.find(t => t.email === 'teacher1@test.com');
      const t2 = updatedTeachers.find(t => t.email === 'teacher2@test.com');
      
      if (t1 && !t1.isOnline && t2 && t2.isOnline) {
        log('✓ Teacher 1 offline, Teacher 2 online - independent status tracking works', 'green');
        resolve(true);
      } else {
        log(`✗ Status mismatch - T1: ${t1?.isOnline}, T2: ${t2?.isOnline}`, 'red');
        resolve(false);
      }
    });
    
    setTimeout(() => {
      log('✗ Timeout during reconnection', 'red');
      resolve(false);
    }, 5000);
  });
}

async function runTests() {
  log('Starting Teacher Online/Offline Status Tests', 'yellow');
  log('=========================================', 'yellow');
  
  const results = [];
  
  try {
    results.push(await test1_TeacherOfflineByDefault());
    results.push(await test2_TeacherOnlineAfterSocketConnect());
    results.push(await test3_TeacherOfflineAfterDisconnect());
    results.push(await test4_MultipleTeachersStatus());
  } catch (error) {
    log(`\nTest suite failed: ${error.message}`, 'red');
  } finally {
    // Cleanup
    if (teacherSocket) teacherSocket.disconnect();
    if (studentSocket) studentSocket.disconnect();
  }
  
  // Summary
  log('\n=========================================', 'yellow');
  const passed = results.filter(r => r === true).length;
  const failed = results.filter(r => r === false).length;
  
  if (failed === 0) {
    log(`All ${passed} tests passed! ✓`, 'green');
  } else {
    log(`${passed} passed, ${failed} failed`, 'red');
  }
  
  process.exit(failed === 0 ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  log(`Fatal error: ${error.message}`, 'red');
  process.exit(1);
});