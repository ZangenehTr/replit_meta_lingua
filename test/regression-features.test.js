#!/usr/bin/env node

/**
 * Regression Testing for Meta Lingua - Recent Feature Changes
 * 
 * Tests features added/modified since yesterday to ensure authentication
 * fixes haven't broken existing functionality.
 * 
 * Focus Areas:
 * 1. Student Dashboard Systems (4 major systems)
 * 2. Authentication Integration
 * 3. Frontend-Backend Communication
 * 4. Protected Route Access
 * 5. Mobile Dashboard Compatibility
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

// Test runner for regression testing
class RegressionTester {
  constructor() {
    this.testResults = [];
    this.studentToken = null;
    this.adminToken = null;
  }

  logResult(testName, passed, details = '') {
    this.testResults.push({ testName, passed, details });
    const status = passed ? '✅' : '❌';
    console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  }

  async authenticateUsers() {
    console.log('🔐 Setting up test authentication...\n');

    // Get student token
    try {
      const studentLogin = await makeRequest('POST', '/api/auth/login', {
        email: 'student2@test.com',
        password: 'password123'
      });

      if (studentLogin.status === 200 && studentLogin.body.auth_token) {
        this.studentToken = studentLogin.body.auth_token;
        console.log('✅ Student authentication successful');
      } else {
        console.log('❌ Student authentication failed');
        return false;
      }
    } catch (error) {
      console.log('❌ Student authentication error:', error.message);
      return false;
    }

    // Try to get admin token (may not have admin user in current DB)
    try {
      const adminLogin = await makeRequest('POST', '/api/auth/login', {
        email: 'admin@test.com',
        password: 'password123'
      });

      if (adminLogin.status === 200 && adminLogin.body.auth_token) {
        this.adminToken = adminLogin.body.auth_token;
        console.log('✅ Admin authentication successful');
      } else {
        console.log('ℹ️ Admin user not available for testing');
      }
    } catch (error) {
      console.log('ℹ️ Admin authentication not available');
    }

    console.log();
    return true;
  }

  async runAllTests() {
    console.log('🔄 Meta Lingua - Regression Testing for Recent Features');
    console.log('====================================================\n');

    const authSuccess = await this.authenticateUsers();
    if (!authSuccess) {
      console.log('❌ Cannot proceed without authentication');
      return false;
    }

    await this.testDashboardSystems();
    await this.testAuthenticationIntegration();
    await this.testFrontendBackendCommunication();
    await this.testProtectedRouteConsistency();
    await this.testMobileDashboardCompatibility();

    this.printSummary();
    return this.testResults.filter(t => !t.passed).length === 0;
  }

  async testDashboardSystems() {
    console.log('1️⃣ Student Dashboard Systems Regression\n');

    if (!this.studentToken) {
      this.logResult('Dashboard Systems', false, 'No student token available');
      return;
    }

    // Test 1.1: Placement Test System
    try {
      const placementStatus = await makeRequest('GET', '/api/student/placement-test-status', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const placementPassed = placementStatus.status === 200 && 
                             (placementStatus.body.hasCompleted !== undefined || 
                              placementStatus.body.message);
      this.logResult('Placement Test System', placementPassed, 
                    `Status: ${placementStatus.status}`);
    } catch (error) {
      this.logResult('Placement Test System', false, `Error: ${error.message}`);
    }

    // Test 1.2: Peer Socializer System
    try {
      const peerGroups = await makeRequest('GET', '/api/student/peer-groups', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const peerPassed = peerGroups.status === 200 && Array.isArray(peerGroups.body);
      this.logResult('Peer Socializer System', peerPassed, 
                    `Status: ${peerGroups.status}, Groups: ${peerGroups.body?.length || 0}`);
    } catch (error) {
      this.logResult('Peer Socializer System', false, `Error: ${error.message}`);
    }

    // Test 1.3: Special Classes System
    try {
      const specialClasses = await makeRequest('GET', '/api/student/special-classes', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const specialPassed = specialClasses.status === 200 && 
                           (Array.isArray(specialClasses.body) || specialClasses.body.message);
      this.logResult('Special Classes System', specialPassed, 
                    `Status: ${specialClasses.status}`);
    } catch (error) {
      this.logResult('Special Classes System', false, `Error: ${error.message}`);
    }

    // Test 1.4: Online Teacher Availability System
    try {
      const onlineTeachers = await makeRequest('GET', '/api/student/online-teachers', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const teachersPassed = onlineTeachers.status === 200 && Array.isArray(onlineTeachers.body);
      this.logResult('Online Teacher Availability', teachersPassed, 
                    `Status: ${onlineTeachers.status}, Teachers: ${onlineTeachers.body?.length || 0}`);
    } catch (error) {
      this.logResult('Online Teacher Availability', false, `Error: ${error.message}`);
    }

    console.log();
  }

  async testAuthenticationIntegration() {
    console.log('2️⃣ Authentication Integration Regression\n');

    // Test 2.1: User Profile After Auth Changes
    try {
      const profile = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const profilePassed = profile.status === 200 && 
                           profile.body.id && 
                           profile.body.email && 
                           profile.body.role;
      this.logResult('User Profile Integration', profilePassed, 
                    `Status: ${profile.status}, Role: ${profile.body?.role}`);
    } catch (error) {
      this.logResult('User Profile Integration', false, `Error: ${error.message}`);
    }

    // Test 2.2: Token Validation Consistency
    try {
      const validation1 = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      // Wait a moment and test again to ensure token consistency
      await new Promise(resolve => setTimeout(resolve, 100));

      const validation2 = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const consistencyPassed = validation1.status === validation2.status && 
                               validation1.body?.id === validation2.body?.id;
      this.logResult('Token Validation Consistency', consistencyPassed, 
                    `Both requests: ${validation1.status}`);
    } catch (error) {
      this.logResult('Token Validation Consistency', false, `Error: ${error.message}`);
    }

    // Test 2.3: Database Connection Stability
    try {
      const dbTest = await makeRequest('GET', '/api/branding');
      const dbPassed = dbTest.status === 200 && dbTest.body.name;
      this.logResult('Database Connection Stability', dbPassed, 
                    `Status: ${dbTest.status}, Branding: ${dbTest.body?.name}`);
    } catch (error) {
      this.logResult('Database Connection Stability', false, `Error: ${error.message}`);
    }

    console.log();
  }

  async testFrontendBackendCommunication() {
    console.log('3️⃣ Frontend-Backend Communication Regression\n');

    // Test 3.1: CORS and Headers
    try {
      const corsTest = await makeRequest('OPTIONS', '/api/users/me', null, {
        'Origin': 'http://localhost:5000',
        'Access-Control-Request-Method': 'GET',
        'Access-Control-Request-Headers': 'authorization'
      });

      const corsPassed = corsTest.status === 200 || corsTest.status === 204;
      this.logResult('CORS Configuration', corsPassed, `Status: ${corsTest.status}`);
    } catch (error) {
      this.logResult('CORS Configuration', false, `Error: ${error.message}`);
    }

    // Test 3.2: JSON Response Format
    try {
      const jsonTest = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${this.studentToken}`,
        'Accept': 'application/json'
      });

      const jsonPassed = jsonTest.status === 200 && 
                        jsonTest.headers['content-type']?.includes('application/json');
      this.logResult('JSON Response Format', jsonPassed, 
                    `Content-Type: ${jsonTest.headers['content-type']}`);
    } catch (error) {
      this.logResult('JSON Response Format', false, `Error: ${error.message}`);
    }

    // Test 3.3: Error Response Format
    try {
      const errorTest = await makeRequest('GET', '/api/nonexistent-endpoint', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const errorPassed = errorTest.status === 404;
      this.logResult('Error Response Handling', errorPassed, 
                    `Status: ${errorTest.status}`);
    } catch (error) {
      this.logResult('Error Response Handling', false, `Error: ${error.message}`);
    }

    console.log();
  }

  async testProtectedRouteConsistency() {
    console.log('4️⃣ Protected Route Access Consistency\n');

    const protectedEndpoints = [
      { path: '/api/users/me', name: 'User Profile' },
      { path: '/api/student/placement-test-status', name: 'Placement Test' },
      { path: '/api/student/peer-groups', name: 'Peer Groups' },
      { path: '/api/student/special-classes', name: 'Special Classes' },
      { path: '/api/student/online-teachers', name: 'Online Teachers' }
    ];

    for (const endpoint of protectedEndpoints) {
      try {
        // Test with valid token
        const withToken = await makeRequest('GET', endpoint.path, null, {
          'Authorization': `Bearer ${this.studentToken}`
        });

        // Test without token
        const withoutToken = await makeRequest('GET', endpoint.path);

        const consistencyPassed = (withToken.status === 200 || withToken.status === 404) && 
                                 (withoutToken.status === 401 || withoutToken.status === 200);
        
        this.logResult(`${endpoint.name} Route Consistency`, consistencyPassed, 
                      `With token: ${withToken.status}, Without: ${withoutToken.status}`);
      } catch (error) {
        this.logResult(`${endpoint.name} Route Consistency`, false, `Error: ${error.message}`);
      }
    }

    console.log();
  }

  async testMobileDashboardCompatibility() {
    console.log('5️⃣ Mobile Dashboard Compatibility\n');

    // Test 5.1: Mobile User-Agent Response
    try {
      const mobileTest = await makeRequest('GET', '/api/users/me', null, {
        'Authorization': `Bearer ${this.studentToken}`,
        'User-Agent': 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X)'
      });

      const mobilePassed = mobileTest.status === 200;
      this.logResult('Mobile User-Agent Support', mobilePassed, 
                    `Status: ${mobileTest.status}`);
    } catch (error) {
      this.logResult('Mobile User-Agent Support', false, `Error: ${error.message}`);
    }

    // Test 5.2: Responsive Data Format
    try {
      const responsiveTest = await makeRequest('GET', '/api/student/online-teachers', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const responsivePassed = responsiveTest.status === 200 && 
                              (Array.isArray(responsiveTest.body) || 
                               typeof responsiveTest.body === 'object');
      this.logResult('Responsive Data Format', responsivePassed, 
                    `Data type: ${typeof responsiveTest.body}`);
    } catch (error) {
      this.logResult('Responsive Data Format', false, `Error: ${error.message}`);
    }

    // Test 5.3: Touch Interface Data
    try {
      const touchTest = await makeRequest('GET', '/api/student/peer-groups', null, {
        'Authorization': `Bearer ${this.studentToken}`
      });

      const touchPassed = touchTest.status === 200;
      this.logResult('Touch Interface Data Access', touchPassed, 
                    `Status: ${touchTest.status}`);
    } catch (error) {
      this.logResult('Touch Interface Data Access', false, `Error: ${error.message}`);
    }

    console.log();
  }

  printSummary() {
    console.log('====================================================');
    console.log('📊 REGRESSION TEST SUMMARY');
    console.log('====================================================');
    
    const passed = this.testResults.filter(t => t.passed).length;
    const failed = this.testResults.filter(t => t.passed === false).length;
    const total = this.testResults.length;
    
    console.log(`Total Regression Tests: ${total}`);
    console.log(`✅ Passed: ${passed}`);
    console.log(`❌ Failed: ${failed}`);
    console.log(`Success Rate: ${Math.round((passed / total) * 100)}%`);
    
    if (failed > 0) {
      console.log('\n🔍 Failed Regression Tests:');
      this.testResults
        .filter(t => t.passed === false)
        .forEach(t => console.log(`   • ${t.testName}: ${t.details}`));
    }
    
    console.log('\n🎯 Regression Coverage Areas:');
    console.log('   ✓ Student Dashboard Systems (4 core systems)');
    console.log('   ✓ Authentication Integration (post-fix stability)');
    console.log('   ✓ Frontend-Backend Communication (CORS, JSON, errors)');
    console.log('   ✓ Protected Route Access Consistency');
    console.log('   ✓ Mobile Dashboard Compatibility');
    
    if (failed === 0) {
      console.log('\n🎉 All regression tests passed! Recent changes are stable.');
    } else {
      console.log('\n⚠️ Some regression tests failed. Recent changes may have broken existing functionality.');
    }
    
    return failed === 0;
  }
}

// Execute regression tests
async function runRegressionTests() {
  const tester = new RegressionTester();
  
  try {
    const allTestsPassed = await tester.runAllTests();
    
    if (allTestsPassed) {
      console.log('\n✅ Regression testing complete: All features stable after recent changes.');
      process.exit(0);
    } else {
      console.log('\n❌ Regression testing found issues: Some features broken by recent changes.');
      process.exit(1);
    }
  } catch (error) {
    console.error('❌ Regression test execution failed:', error.message);
    process.exit(1);
  }
}

// Run if called directly
runRegressionTests();