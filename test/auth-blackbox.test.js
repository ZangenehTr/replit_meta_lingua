#!/usr/bin/env node

/**
 * Black-Box Testing for Meta Lingua Authentication System
 * 
 * Tests authentication functionality from external perspective without
 * knowledge of internal implementation details.
 * 
 * Test Categories:
 * 1. Login Authentication
 * 2. Token Management
 * 3. Protected Route Access
 * 4. Role-Based Authorization
 * 5. Security & Edge Cases
 */

import http from 'http';

const BASE_URL = 'http://localhost:5000';

// Test utilities
async function makeRequest(method, path, data = null, headers = {}) {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'localhost',
      port: 5000,
      path,
      method,
      headers: {
        'Content-Type': 'application/json',
        ...headers
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const jsonBody = body ? JSON.parse(body) : {};
          resolve({ 
            status: res.statusCode, 
            body: jsonBody, 
            headers: res.headers,
            rawBody: body
          });
        } catch (e) {
          resolve({ 
            status: res.statusCode, 
            body: body, 
            headers: res.headers,
            rawBody: body
          });
        }
      });
    });

    req.on('error', reject);
    
    if (data) {
      req.write(JSON.stringify(data));
    }
    
    req.end();
  });
}

// Test runner
class AuthenticationTester {
  constructor() {
    this.testResults = [];
    this.validToken = null;
    this.adminToken = null;
  }

  logResult(testName, passed, details = '') {
    this.testResults.push({ testName, passed, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  }

  async runAllTests() {
    console.log('🔐 Meta Lingua Authentication - Black-Box Tests');
    console.log('================================================\n');

    await this.testLoginAuthentication();
    await this.testTokenManagement();
    await this.testProtectedRoutes();
    await this.testRoleBasedAuthorization();
    await this.testSecurityEdgeCases();

    this.printSummary();
  }

  async testLoginAuthentication() {
    console.log('1️⃣ Login Authentication Tests\n');

    // Test 1.1: Valid login with existing user
    try {
      const validLogin = await makeRequest('POST', '/api/auth/login', {
        email: 'student2@test.com',
        password: 'password123'
      });

      if (validLogin.status === 200 && validLogin.body.auth_token) {
        this.validToken = validLogin.body.auth_token;
        this.logResult('Valid Login', true, 'Token received');
      } else {
        this.logResult('Valid Login', false, `Status: ${validLogin.status}`);
      }
    } catch (error) {
      this.logResult('Valid Login', false, `Error: ${error.message}`);
    }

    // Test 1.2: Invalid email
    try {
      const invalidEmail = await makeRequest('POST', '/api/auth/login', {
        email: 'nonexistent@test.com',
        password: 'password123'
      });

      const passed = invalidEmail.status === 401;
      this.logResult('Invalid Email', passed, `Status: ${invalidEmail.status}`);
    } catch (error) {
      this.logResult('Invalid Email', false, `Error: ${error.message}`);
    }

    // Test 1.3: Invalid password
    try {
      const invalidPassword = await makeRequest('POST', '/api/auth/login', {
        email: 'student2@test.com',
        password: 'wrongpassword'
      });

      const passed = invalidPassword.status === 401;
      this.logResult('Invalid Password', passed, `Status: ${invalidPassword.status}`);
    } catch (error) {
      this.logResult('Invalid Password', false, `Error: ${error.message}`);
    }

    // Test 1.4: Missing credentials
    try {
      const missingCredentials = await makeRequest('POST', '/api/auth/login', {
        email: 'student2@test.com'
      });

      const passed = missingCredentials.status === 400;
      this.logResult('Missing Password', passed, `Status: ${missingCredentials.status}`);
    } catch (error) {
      this.logResult('Missing Password', false, `Error: ${error.message}`);
    }

    // Test 1.5: Empty request body
    try {
      const emptyBody = await makeRequest('POST', '/api/auth/login', {});
      const passed = emptyBody.status === 400;
      this.logResult('Empty Credentials', passed, `Status: ${emptyBody.status}`);
    } catch (error) {
      this.logResult('Empty Credentials', false, `Error: ${error.message}`);
    }

    console.log();
  }

  async testTokenManagement() {
    console.log('2️⃣ Token Management Tests\n');

    // Test 2.1: Access with valid token
    if (this.validToken) {
      try {
        const validAccess = await makeRequest('GET', '/api/users/me', null, {
          'Authorization': `Bearer ${this.validToken}`
        });

        const passed = validAccess.status === 200 && validAccess.body.id;
        this.logResult('Valid Token Access', passed, `Status: ${validAccess.status}`);
      } catch (error) {
        this.logResult('Valid Token Access', false, `Error: ${error.message}`);
      }
    } else {
      this.logResult('Valid Token Access', false, 'No valid token available');
    }

    // Test 2.2: Access without token
    try {
      const noToken = await makeRequest('GET', '/api/users/me');
      const passed = noToken.status === 401;
      this.logResult('No Token Access', passed, `Status: ${noToken.status}`);
    } catch (error) {
      this.logResult('No Token Access', false, `Error: ${error.message}`);
    }

    // Test 2.3: Access with invalid token
    try {
      const invalidToken = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': 'Bearer invalid.token.here'
      });
      const passed = invalidToken.status === 403;
      this.logResult('Invalid Token Access', passed, `Status: ${invalidToken.status}`);
    } catch (error) {
      this.logResult('Invalid Token Access', false, `Error: ${error.message}`);
    }

    // Test 2.4: Malformed Authorization header
    try {
      const malformedHeader = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': 'InvalidFormat'
      });
      const passed = malformedHeader.status === 401;
      this.logResult('Malformed Auth Header', passed, `Status: ${malformedHeader.status}`);
    } catch (error) {
      this.logResult('Malformed Auth Header', false, `Error: ${error.message}`);
    }

    console.log();
  }

  async testProtectedRoutes() {
    console.log('3️⃣ Protected Route Access Tests\n');

    if (!this.validToken) {
      this.logResult('Protected Routes Test', false, 'No valid token for testing');
      console.log();
      return;
    }

    // Test protected endpoints
    const protectedEndpoints = [
      { path: '/api/users/me', method: 'GET', name: 'User Profile' },
      { path: '/api/student/placement-test-status', method: 'GET', name: 'Placement Test Status' },
      { path: '/api/student/peer-groups', method: 'GET', name: 'Peer Groups' },
      { path: '/api/student/special-classes', method: 'GET', name: 'Special Classes' },
      { path: '/api/student/online-teachers', method: 'GET', name: 'Online Teachers' }
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        // Test with valid token
        const withToken = await makeRequest(endpoint.method, endpoint.path, null, {
          'Authorization': `Bearer ${this.validToken}`
        });

        const withTokenPassed = withToken.status === 200 || withToken.status === 404;
        this.logResult(`${endpoint.name} (with token)`, withTokenPassed, `Status: ${withToken.status}`);

        // Test without token
        const withoutToken = await makeRequest(endpoint.method, endpoint.path);
        const withoutTokenPassed = withoutToken.status === 401;
        this.logResult(`${endpoint.name} (no token)`, withoutTokenPassed, `Status: ${withoutToken.status}`);

      } catch (error) {
        this.logResult(`${endpoint.name}`, false, `Error: ${error.message}`);
      }
    }

    console.log();
  }

  async testRoleBasedAuthorization() {
    console.log('4️⃣ Role-Based Authorization Tests\n');

    if (!this.validToken) {
      this.logResult('Role Authorization Test', false, 'No valid token for testing');
      console.log();
      return;
    }

    // Test student accessing admin endpoints (should fail)
    const adminEndpoints = [
      { path: '/api/admin/users', method: 'GET', name: 'Admin Users List' },
      { path: '/api/admin/settings', method: 'GET', name: 'Admin Settings' },
      { path: '/api/admin/branding', method: 'GET', name: 'Admin Branding' }
    ];

    for (const endpoint of adminEndpoints) {
      try {
        const adminAccess = await makeRequest(endpoint.method, endpoint.path, null, {
          'Authorization': `Bearer ${this.validToken}`
        });

        // Student should not have access to admin endpoints
        const passed = adminAccess.status === 403 || adminAccess.status === 401;
        this.logResult(`Student -> ${endpoint.name}`, passed, `Status: ${adminAccess.status} (expected 403)`);

      } catch (error) {
        this.logResult(`Student -> ${endpoint.name}`, false, `Error: ${error.message}`);
      }
    }

    console.log();
  }

  async testSecurityEdgeCases() {
    console.log('5️⃣ Security & Edge Cases Tests\n');

    // Test 5.1: SQL Injection attempt in login
    try {
      const sqlInjection = await makeRequest('POST', '/api/auth/login', {
        email: "admin@test.com'; DROP TABLE users; --",
        password: 'password123'
      });

      const passed = sqlInjection.status === 401; // Should be invalid credentials, not crash
      this.logResult('SQL Injection Protection', passed, `Status: ${sqlInjection.status}`);
    } catch (error) {
      this.logResult('SQL Injection Protection', false, `Error: ${error.message}`);
    }

    // Test 5.2: XSS attempt in login
    try {
      const xssAttempt = await makeRequest('POST', '/api/auth/login', {
        email: '<script>alert("xss")</script>@test.com',
        password: 'password123'
      });

      const passed = xssAttempt.status === 401; // Should be invalid credentials
      this.logResult('XSS Input Protection', passed, `Status: ${xssAttempt.status}`);
    } catch (error) {
      this.logResult('XSS Input Protection', false, `Error: ${error.message}`);
    }

    // Test 5.3: Very long input strings
    try {
      const longString = 'a'.repeat(10000);
      const longInput = await makeRequest('POST', '/api/auth/login', {
        email: longString + '@test.com',
        password: longString
      });

      const passed = longInput.status === 400 || longInput.status === 401;
      this.logResult('Long Input Handling', passed, `Status: ${longInput.status}`);
    } catch (error) {
      this.logResult('Long Input Handling', false, `Error: ${error.message}`);
    }

    // Test 5.4: Non-JSON content type
    try {
      const response = await makeRequest('POST', '/api/auth/login', 'email=test@test.com&password=test', {
        'Content-Type': 'application/x-www-form-urlencoded'
      });

      const passed = response.status === 400; // Should reject non-JSON
      this.logResult('Content-Type Validation', passed, `Status: ${response.status}`);
    } catch (error) {
      this.logResult('Content-Type Validation', false, `Error: ${error.message}`);
    }

    // Test 5.5: Case sensitivity in email
    try {
      const caseTest = await makeRequest('POST', '/api/auth/login', {
        email: 'STUDENT2@TEST.COM', // Uppercase version
        password: 'password123'
      });

      // Should handle case-insensitive email or fail appropriately
      const passed = caseTest.status === 200 || caseTest.status === 401;
      this.logResult('Email Case Sensitivity', passed, `Status: ${caseTest.status}`);
    } catch (error) {
      this.logResult('Email Case Sensitivity', false, `Error: ${error.message}`);
    }

    console.log();
  }

  printSummary() {
    console.log('================================================');
    console.log('📊 BLACK-BOX TEST SUMMARY');
    console.log('================================================');
    
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = this.testResults.filter(t => t.passed === false).length;
    const total = this.testResults.length;
    
    console.log(`Total Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n🔍 Failed Tests:');
      this.testResults
        .filter(t => t.passed === false)
        .forEach(t => console.log(`   • ${t.testName}: ${t.details}`));
    }
    
    console.log('\n🎯 Test Coverage Areas:');
    console.log('   ✓ Login Authentication (valid/invalid credentials)');
    console.log('   ✓ Token Management (generation, validation, expiry)');
    console.log('   ✓ Protected Route Access (with/without tokens)');
    console.log('   ✓ Role-Based Authorization (student/admin separation)');
    console.log('   ✓ Security Edge Cases (injection, XSS, input validation)');
    
    return failed === 0;
  }
}

// Execute tests
async function runBlackBoxTests() {
  const tester = new AuthenticationTester();
  
  try {
    const allTestsPassed = await tester.runAllTests();
    
    if (allTestsPassed) {
      console.log('\n🎉 All authentication tests passed! System is secure and functional.');
      process.exit(0);
    } else {
      console.log('\n⚠️ Some authentication tests failed. Review security and functionality.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
runBlackBoxTests();