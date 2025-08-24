#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

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
  const fetch = require('node-fetch');
  
  console.log('Running quick connectivity tests...\n');
  
  try {
    // Test 1: Server is running
    console.log('1. Testing server availability...');
    const serverResponse = await fetch('http://localhost:5000/api/branding');
    if (serverResponse.ok) {
      console.log('   ✓ Server is running');
    } else {
      console.log('   ✗ Server returned status:', serverResponse.status);
    }
    
    // Test 2: WebSocket endpoint
    console.log('2. Testing WebSocket endpoint...');
    const WebSocket = require('ws');
    const ws = new WebSocket('ws://localhost:5000/socket.io/?EIO=4&transport=websocket');
    
    await new Promise((resolve, reject) => {
      ws.on('open', () => {
        console.log('   ✓ WebSocket connection established');
        ws.close();
        resolve();
      });
      
      ws.on('error', (err) => {
        console.log('   ✗ WebSocket error:', err.message);
        reject(err);
      });
      
      setTimeout(() => {
        ws.close();
        resolve();
      }, 5000);
    });
    
    // Test 3: Login endpoint
    console.log('3. Testing login endpoint...');
    const loginResponse = await fetch('http://localhost:5000/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'student2@test.com',
        password: 'password123'
      })
    });
    
    if (loginResponse.ok) {
      console.log('   ✓ Login endpoint working');
    } else {
      console.log('   ✗ Login failed:', loginResponse.status);
    }
    
    // Test 4: Callern API endpoints
    console.log('4. Testing Callern API endpoints...');
    const teachersResponse = await fetch('http://localhost:5000/api/callern/online-teachers');
    if (teachersResponse.ok) {
      const teachers = await teachersResponse.json();
      console.log(`   ✓ Online teachers endpoint working (${teachers.length} teachers)`);
    } else {
      console.log('   ✗ Teachers endpoint failed:', teachersResponse.status);
    }
    
    console.log('\n✅ Quick tests completed successfully!\n');
    return true;
  } catch (error) {
    console.error('\n❌ Quick test failed:', error.message);
    return false;
  }
}

// Main execution
async function main() {
  const args = process.argv.slice(2);
  
  if (args.includes('--quick')) {
    // Run quick tests only
    await quickTest();
  } else if (args.includes('--full')) {
    // Run full E2E tests
    await runTests();
  } else {
    // Run both quick and full tests
    const quickPassed = await quickTest();
    
    if (quickPassed) {
      console.log('Starting full E2E tests...\n');
      await runTests();
    } else {
      console.log('Skipping full tests due to quick test failures.');
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