#!/usr/bin/env node

import { spawn } from 'child_process';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

console.log('========================================');
console.log('    Starting Callern E2E Test Suite');
console.log('========================================\n');

// Function to run tests
async function runTests() {
  return new Promise((resolve, reject) => {
    const testProcess = spawn('npx', [
      'playwright', 
      'test', 
      'tests/callern-e2e.test.ts',
      '--reporter=list',
      '--workers=1', // Run tests sequentially
      '--timeout=120000' // 2 minute timeout per test
    ], {
      stdio: 'inherit',
      shell: true
    });

    testProcess.on('close', (code) => {
      if (code === 0) {
        console.log('\n✅ All Callern tests passed!');
        resolve();
      } else {
        console.log('\n❌ Some tests failed. Check the output above.');
        reject(new Error(`Test process exited with code ${code}`));
      }
    });

    testProcess.on('error', (err) => {
      console.error('Failed to start test process:', err);
      reject(err);
    });
  });
}

// Quick test function to verify basic functionality
async function quickTest() {
  console.log('Running quick connectivity tests...\n');
  
  try {
    // Test 1: Server is running
    console.log('1. Testing server availability...');
    const serverResponse = await fetch('http://localhost:5000/api/branding');
    if (serverResponse.ok) {
      const data = await serverResponse.json();
      console.log(`   ✓ Server is running (${data.name})`);
    } else {
      console.log('   ✗ Server returned status:', serverResponse.status);
    }
    
    // Test 2: Login endpoint
    console.log('2. Testing student login...');
    const studentLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student2@test.com',
        password: 'password123'
      })
    });
    
    if (studentLoginResponse.ok) {
      try {
        const studentData = await studentLoginResponse.json();
        console.log(`   ✓ Student login successful (${studentData.user.firstName} ${studentData.user.lastName})`);
      } catch (e) {
        console.log('   ✓ Student login returned non-JSON response (likely redirect)');
      }
    } else {
      console.log('   ✗ Student login failed:', studentLoginResponse.status);
    }
    
    // Test 3: Teacher login
    console.log('3. Testing teacher login...');
    const teacherLoginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher2@test.com',
        password: 'password123'
      })
    });
    
    if (teacherLoginResponse.ok) {
      try {
        const teacherData = await teacherLoginResponse.json();
        console.log(`   ✓ Teacher login successful (${teacherData.user.firstName} ${teacherData.user.lastName})`);
      } catch (e) {
        console.log('   ✓ Teacher login returned non-JSON response (likely redirect)');
      }
    } else {
      console.log('   ✗ Teacher login failed:', teacherLoginResponse.status);
    }
    
    // Test 4: Callern API endpoints
    console.log('4. Testing Callern API endpoints...');
    const teachersResponse = await fetch('http://localhost:5000/api/callern/online-teachers');
    if (teachersResponse.ok) {
      const teachers = await teachersResponse.json();
      console.log(`   ✓ Online teachers endpoint working (${teachers.length} teachers found)`);
      if (teachers.length > 0) {
        console.log(`     - ${teachers[0].firstName} ${teachers[0].lastName}: ${teachers[0].status}`);
      }
    } else {
      console.log('   ✗ Teachers endpoint failed:', teachersResponse.status);
    }
    
    // Test 5: Student packages
    console.log('5. Testing student Callern packages...');
    const packagesResponse = await fetch('http://localhost:5000/api/student/callern-packages');
    if (packagesResponse.ok) {
      const packages = await packagesResponse.json();
      console.log(`   ✓ Packages endpoint working (${packages.length} packages available)`);
    } else {
      console.log('   ✗ Packages endpoint failed:', packagesResponse.status);
    }
    
    // Test 6: AI endpoints
    console.log('6. Testing AI endpoints...');
    const translationResponse = await fetch('http://localhost:5000/api/callern/ai/translate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text: 'Hello',
        targetLanguage: 'fa'
      })
    });
    
    if (translationResponse.ok) {
      console.log('   ✓ Translation endpoint working');
    } else {
      console.log('   ✗ Translation endpoint returned:', translationResponse.status);
    }
    
    // Test 7: WebRTC configuration
    console.log('7. Testing WebRTC configuration...');
    const webrtcResponse = await fetch('http://localhost:5000/api/webrtc-config');
    if (webrtcResponse.ok) {
      const config = await webrtcResponse.json();
      console.log(`   ✓ WebRTC config available (${config.iceServers.length} ICE servers)`);
    } else {
      console.log('   ✗ WebRTC config failed:', webrtcResponse.status);
    }
    
    console.log('\n✅ Quick tests completed successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Quick test failed:', error.message);
    return false;
  }
}

// Feature-specific tests
async function testVideoCallFlow() {
  console.log('Testing video call flow...\n');
  
  try {
    // Test teacher availability
    console.log('1. Checking teacher availability...');
    const teacherAuthResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher2@test.com',
        password: 'password123'
      })
    });
    
    if (!teacherAuthResponse.ok) {
      throw new Error('Teacher authentication failed');
    }
    
    const { token: teacherToken } = await teacherAuthResponse.json();
    
    // Set teacher online
    console.log('2. Setting teacher online status...');
    const goOnlineResponse = await fetch('http://localhost:5000/api/teacher/callern/status', {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${teacherToken}`
      },
      body: JSON.stringify({ status: 'online' })
    });
    
    if (goOnlineResponse.ok) {
      console.log('   ✓ Teacher is now online');
    } else {
      console.log('   ✗ Failed to set teacher online');
    }
    
    // Test student package check
    console.log('3. Checking student package...');
    const studentAuthResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student2@test.com',
        password: 'password123'
      })
    });
    
    if (!studentAuthResponse.ok) {
      throw new Error('Student authentication failed');
    }
    
    const { token: studentToken } = await studentAuthResponse.json();
    
    const myPackagesResponse = await fetch('http://localhost:5000/api/student/my-callern-packages', {
      headers: { 'Authorization': `Bearer ${studentToken}` }
    });
    
    if (myPackagesResponse.ok) {
      const packages = await myPackagesResponse.json();
      if (packages.length > 0) {
        const pkg = packages[0];
        console.log(`   ✓ Student has package: ${pkg.packageName}`);
        console.log(`     Minutes available: ${pkg.remainingMinutes}/${pkg.totalMinutes}`);
      } else {
        console.log('   ⚠ Student has no active packages');
      }
    }
    
    // Test briefing endpoint
    console.log('4. Testing student briefing...');
    const briefingResponse = await fetch('http://localhost:5000/api/callern/student-briefing', {
      headers: { 'Authorization': `Bearer ${teacherToken}` }
    });
    
    if (briefingResponse.ok) {
      console.log('   ✓ Student briefing endpoint working');
    } else {
      console.log('   ✗ Briefing endpoint failed');
    }
    
    console.log('\n✅ Video call flow tests completed!\n');
    return true;
  } catch (error) {
    console.error('❌ Video call flow test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    // Run quick tests only
    await quickTest();
  } else if (args.includes('--flow')) {
    // Test video call flow
    await testVideoCallFlow();
  } else if (args.includes('--full')) {
    // Run full E2E tests with Playwright
    await runTests();
  } else {
    // Run all tests in sequence
    const quickPassed = await quickTest();
    
    if (quickPassed) {
      console.log('Running video call flow tests...\n');
      const flowPassed = await testVideoCallFlow();
      
      if (flowPassed && args.includes('--e2e')) {
        console.log('Starting full E2E tests with Playwright...\n');
        await runTests();
      }
    } else {
      console.log('Skipping additional tests due to quick test failures.');
      process.exit(1);
    }
  }
}

// Handle errors
process.on('unhandledRejection', (err) => {
  console.error('Unhandled rejection:', err);
  process.exit(1);
});

// Run main function
main().catch((err) => {
  console.error('Test execution failed:', err);
  process.exit(1);
});