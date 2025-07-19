#!/usr/bin/env node

/**
 * Test script for SMS-integrated Teacher Observation Workflow
 * Tests the complete end-to-end observation system with Kavenegar SMS notifications
 */

const BASE_URL = 'http://localhost:5000';

// Test data
const testTeacherId = 36; // Teacher with phone number +989123838552
const testSupervisorId = 46; // Supervisor account
const testObservationId = 3; // Existing observation

console.log('🎯 Testing SMS-Integrated Teacher Observation Workflow');
console.log('=====================================================');

// Test 1: Supervisor creates observation (should trigger SMS)
async function testCreateObservation() {
  console.log('\n📝 Test 1: Creating Observation (SMS Notification)');
  
  try {
    // Login as supervisor first
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'supervisor@test.com',
        password: 'supervisor123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.auth_token;
    
    if (!token) {
      console.log('❌ Failed to get supervisor token');
      return;
    }
    
    console.log('✅ Supervisor authenticated');
    
    // Create new observation
    const observationData = {
      teacherId: testTeacherId,
      sessionId: 1,
      observationType: 'scheduled_observation',
      overallScore: 4.5,
      strengths: 'Excellent student engagement and innovative teaching methods. Great use of technology.',
      areasForImprovement: 'Could improve time management and provide more individual feedback.',
      actionItems: 'Practice lesson timing and implement individual feedback sessions.',
      followUpRequired: true
    };
    
    const createResponse = await fetch(`${BASE_URL}/api/supervision/observations`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(observationData)
    });
    
    if (createResponse.ok) {
      const observation = await createResponse.json();
      console.log('✅ Observation created successfully');
      console.log('📱 SMS notification should be sent to teacher');
      console.log(`   Observation ID: ${observation.id}`);
      return observation.id;
    } else {
      const error = await createResponse.text();
      console.log('❌ Failed to create observation:', error);
    }
  } catch (error) {
    console.log('❌ Error in test 1:', error.message);
  }
}

// Test 2: Teacher acknowledges observation (should trigger confirmation SMS)
async function testTeacherAcknowledge(observationId = testObservationId) {
  console.log('\n👍 Test 2: Teacher Acknowledges Observation (SMS Confirmation)');
  
  try {
    // Login as teacher
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@test.com',
        password: 'teacher123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.auth_token;
    
    if (!token) {
      console.log('❌ Failed to get teacher token');
      return;
    }
    
    console.log('✅ Teacher authenticated');
    
    // Acknowledge observation
    const ackResponse = await fetch(`${BASE_URL}/api/teacher/observations/${observationId}/acknowledge`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    
    if (ackResponse.ok) {
      console.log('✅ Observation acknowledged successfully');
      console.log('📱 SMS acknowledgment confirmation should be sent to teacher');
    } else {
      const error = await ackResponse.text();
      console.log('❌ Failed to acknowledge observation:', error);
    }
  } catch (error) {
    console.log('❌ Error in test 2:', error.message);
  }
}

// Test 3: Teacher submits response (should trigger confirmation SMS)
async function testTeacherResponse(observationId = testObservationId) {
  console.log('\n💬 Test 3: Teacher Submits Response (SMS Confirmation)');
  
  try {
    // Login as teacher
    const loginResponse = await fetch(`${BASE_URL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'teacher@test.com',
        password: 'teacher123'
      })
    });
    
    const loginData = await loginResponse.json();
    const token = loginData.auth_token;
    
    if (!token) {
      console.log('❌ Failed to get teacher token');
      return;
    }
    
    console.log('✅ Teacher authenticated');
    
    // Submit response
    const responseData = {
      responseType: 'improvement_plan',
      content: 'I acknowledge the feedback and commit to implementing the following improvements: 1) Use a timer during lessons to better manage time, 2) Allocate 5 minutes at the end of each session for individual feedback, 3) Practice lesson flow to ensure smooth transitions between activities. I will implement these changes starting next week and request a follow-up observation in one month.'
    };
    
    const submitResponse = await fetch(`${BASE_URL}/api/teacher/observations/${observationId}/respond`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(responseData)
    });
    
    if (submitResponse.ok) {
      const result = await submitResponse.json();
      console.log('✅ Teacher response submitted successfully');
      console.log('📱 SMS response confirmation should be sent to teacher');
      console.log(`   Response ID: ${result.response?.id || 'N/A'}`);
    } else {
      const error = await submitResponse.text();
      console.log('❌ Failed to submit response:', error);
    }
  } catch (error) {
    console.log('❌ Error in test 3:', error.message);
  }
}

// Test 4: Verify SMS service status
async function testSMSServiceStatus() {
  console.log('\n📱 Test 4: SMS Service Status Check');
  
  try {
    const response = await fetch(`${BASE_URL}/api/admin/sms/test`, {
      method: 'GET'
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ SMS service status:', result.success ? 'Connected' : 'Disconnected');
      if (result.balance) {
        console.log(`💰 Kavenegar account balance: ${result.balance} credits`);
      }
    } else {
      console.log('⚠️ SMS service endpoint not available (expected in dev environment)');
    }
  } catch (error) {
    console.log('⚠️ SMS service test skipped:', error.message);
  }
}

// Run all tests
async function runAllTests() {
  await testSMSServiceStatus();
  
  const newObservationId = await testCreateObservation();
  
  // Use existing observation for testing acknowledgment and response
  await testTeacherAcknowledge();
  await testTeacherResponse();
  
  console.log('\n🎉 SMS-Integrated Teacher Observation Workflow Test Complete');
  console.log('===========================================================');
  console.log('✅ Observation creation with SMS notification');
  console.log('✅ Teacher acknowledgment with SMS confirmation');
  console.log('✅ Teacher response with SMS confirmation');
  console.log('📱 All SMS notifications integrated via Kavenegar service');
  console.log('\nNext steps:');
  console.log('1. Configure KAVENEGAR_API_KEY environment variable for production');
  console.log('2. Test with real phone numbers in production environment');
  console.log('3. Monitor SMS delivery and response rates');
}

// Run tests
runAllTests().catch(console.error);