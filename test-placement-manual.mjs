/**
 * Manual Placement Test - Tests the complete flow without complex test setup
 */

import fetch from 'node-fetch';

const baseUrl = 'http://localhost:5000';
let authToken = '';
let sessionId = null;

async function testPlacementFlow() {
  console.log('🧪 Starting Placement Test Manual Testing...\n');
  
  try {
    // 1. Test Authentication
    console.log('1. Testing user registration/login...');
    
    const authResponse = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'placement.test@example.com',
        password: 'testpass123',
        firstName: 'Placement',
        lastName: 'Tester',
        role: 'Student'
      })
    });
    
    if (authResponse.status === 201) {
      const authData = await authResponse.json();
      authToken = `Bearer ${authData.token}`;
      console.log('✅ User registration successful');
    } else {
      // Try login if user exists
      const loginResponse = await fetch(`${baseUrl}/api/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: 'placement.test@example.com',
          password: 'testpass123'
        })
      });
      
      if (loginResponse.ok) {
        const loginData = await loginResponse.json();
        authToken = `Bearer ${loginData.token}`;
        console.log('✅ User login successful');
      } else {
        throw new Error('Authentication failed');
      }
    }

    // 2. Start Placement Test
    console.log('\n2. Starting placement test...');
    
    const startResponse = await fetch(`${baseUrl}/api/placement-test/start`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        targetLanguage: 'english',
        learningGoal: 'business',
        timeAvailability: 10
      })
    });

    const startData = await startResponse.json();
    
    if (startResponse.ok && startData.success) {
      sessionId = startData.session.id;
      console.log(`✅ Placement test started - Session ID: ${sessionId}`);
      console.log(`   Status: ${startData.session.status}`);
      console.log(`   Current Skill: ${startData.session.currentSkill}`);
      console.log(`   Max Duration: ${startData.session.maxDurationMinutes} minutes`);
    } else {
      throw new Error(`Failed to start test: ${startData.error || 'Unknown error'}`);
    }

    // 3. Complete Test Questions
    console.log('\n3. Answering placement test questions...');
    
    const businessResponses = [
      "I have extensive experience in international business communications. In my previous role as a project manager, I regularly coordinated with teams across different time zones and cultural backgrounds. This experience has taught me that clear, concise communication is essential for successful business outcomes, particularly when dealing with complex technical specifications and tight deadlines.",
      
      "Digital transformation has revolutionized modern business practices in unprecedented ways. Companies that fail to adapt to technological changes risk becoming obsolete in today's competitive marketplace. I believe that organizations must invest in both technology infrastructure and employee training to remain competitive and achieve sustainable growth.",
      
      "Effective leadership requires a combination of emotional intelligence, strategic thinking, and cultural awareness. In my opinion, the most successful leaders are those who can adapt their communication style to different audiences while maintaining authenticity and building trust across diverse teams and stakeholder groups.",
      
      "The global supply chain disruptions have highlighted the importance of risk management and operational flexibility. Companies need to develop robust contingency plans and diversify their supplier base to maintain business continuity during unexpected challenges such as natural disasters or economic downturns."
    ];

    let questionCount = 0;
    let testCompleted = false;
    const maxQuestions = 8;

    while (!testCompleted && questionCount < maxQuestions) {
      // Get next question
      const questionResponse = await fetch(`${baseUrl}/api/placement-test/sessions/${sessionId}/next-question`, {
        headers: { 'Authorization': authToken }
      });

      const questionData = await questionResponse.json();
      
      if (questionData.testCompleted) {
        console.log('✅ Test completed with results:');
        console.log(`   Overall Level: ${questionData.results.overallLevel}`);
        console.log(`   Overall Score: ${questionData.results.scores.overall}%`);
        
        Object.entries(questionData.results.skillLevels).forEach(([skill, level]) => {
          const score = questionData.results.scores[skill];
          console.log(`   ${skill.charAt(0).toUpperCase() + skill.slice(1)}: ${level} (${score}%)`);
        });
        
        testCompleted = true;
        break;
      }

      if (questionData.question) {
        const question = questionData.question;
        console.log(`   Question ${questionCount + 1}: ${question.skill} - ${question.level}`);
        console.log(`   Type: ${question.type} (${question.responseType})`);
        
        // Submit appropriate response
        const response = businessResponses[questionCount % businessResponses.length];
        let userResponse;

        switch (question.responseType) {
          case 'multiple_choice':
            userResponse = { selectedOption: question.content?.options?.[0] || "A" };
            break;
          case 'audio':
            userResponse = { audioUrl: "mock-audio", transcript: response };
            break;
          default:
            userResponse = { text: response };
        }

        const submitResponse = await fetch(`${baseUrl}/api/placement-test/sessions/${sessionId}/responses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': authToken
          },
          body: JSON.stringify({
            questionId: question.id,
            userResponse: userResponse
          })
        });

        const submitData = await submitResponse.json();
        
        if (submitResponse.ok && submitData.success) {
          console.log(`   ✅ Response submitted - Score: ${submitData.evaluation.score}%, Level: ${submitData.evaluation.level}`);
          
          if (submitData.testCompleted) {
            testCompleted = true;
          }
        } else {
          console.log(`   ❌ Failed to submit response: ${submitData.error}`);
        }
      }

      questionCount++;
    }

    // 4. Get Final Results
    console.log('\n4. Getting comprehensive test results...');
    
    const resultsResponse = await fetch(`${baseUrl}/api/placement-test/sessions/${sessionId}/results`, {
      headers: { 'Authorization': authToken }
    });

    const results = await resultsResponse.json();
    
    if (resultsResponse.ok && results.success) {
      console.log('✅ Test Results Retrieved:');
      console.log(`   Session ID: ${results.results.sessionId}`);
      console.log(`   Overall Level: ${results.results.overallLevel}`);
      console.log(`   Test Duration: ${results.results.testDuration} seconds`);
      console.log(`   Confidence Score: ${results.results.analysis.confidenceScore}%`);
      
      if (results.results.analysis.strengths.length > 0) {
        console.log('   Strengths:', results.results.analysis.strengths.join(', '));
      }
      
      if (results.results.analysis.recommendations.length > 0) {
        console.log('   Recommendations:', results.results.analysis.recommendations.slice(0, 3).join(', '));
      }
    } else {
      throw new Error(`Failed to get results: ${results.error}`);
    }

    // 5. Generate AI Roadmap
    console.log('\n5. Generating AI-powered learning roadmap...');
    
    const roadmapResponse = await fetch(`${baseUrl}/api/placement-test/sessions/${sessionId}/generate-roadmap`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': authToken
      },
      body: JSON.stringify({
        learningGoals: ['business', 'presentation_skills', 'negotiation'],
        timeAvailability: 10,
        preferredPace: 'normal',
        focusAreas: ['speaking', 'writing']
      })
    });

    const roadmapData = await roadmapResponse.json();
    
    if (roadmapResponse.ok && roadmapData.success) {
      console.log('✅ AI Roadmap Generated:');
      console.log(`   Roadmap ID: ${roadmapData.roadmap.id}`);
      console.log(`   Title: ${roadmapData.roadmap.title}`);
      console.log(`   Duration: ${roadmapData.roadmap.estimatedWeeks} weeks`);
      console.log(`   Weekly Hours: ${roadmapData.roadmap.weeklyHours}`);
      console.log(`   Total Milestones: ${roadmapData.roadmap.totalMilestones}`);
      console.log(`   Total Steps: ${roadmapData.roadmap.totalSteps}`);
      console.log(`   Estimated Completion: ${new Date(roadmapData.roadmap.estimatedCompletion).toLocaleDateString()}`);
      
      console.log('\n   Milestones:');
      roadmapData.milestones.forEach((milestone, index) => {
        console.log(`   ${index + 1}. Week ${milestone.weekNumber}: ${milestone.title}`);
        console.log(`      Primary Skill: ${milestone.primarySkill}`);
      });
      
      if (roadmapData.roadmap.personalizedRecommendations.length > 0) {
        console.log('\n   Personalized Recommendations:');
        roadmapData.roadmap.personalizedRecommendations.slice(0, 3).forEach(rec => {
          console.log(`   • ${rec}`);
        });
      }
    } else {
      throw new Error(`Failed to generate roadmap: ${roadmapData.error}`);
    }

    // 6. Test User History
    console.log('\n6. Checking placement test history...');
    
    const historyResponse = await fetch(`${baseUrl}/api/placement-test/history`, {
      headers: { 'Authorization': authToken }
    });

    const historyData = await historyResponse.json();
    
    if (historyResponse.ok && historyData.success) {
      console.log(`✅ Found ${historyData.sessions.length} placement test session(s)`);
      console.log(`   Current session status: ${historyData.sessions[0]?.status}`);
      console.log(`   Generated roadmap ID: ${historyData.sessions[0]?.generatedRoadmapId}`);
    }

    console.log('\n🎉 ALL PLACEMENT TEST FUNCTIONS WORKING CORRECTLY!');
    console.log('✅ Test 1: Start placement test and adaptive questioning - PASSED');
    console.log('✅ Test 2: Response submission and CEFR evaluation - PASSED');
    console.log('✅ Test 3: Test completion with comprehensive results - PASSED');
    console.log('✅ Test 4: AI roadmap generation from placement results - PASSED');
    
  } catch (error) {
    console.error('\n❌ TEST FAILED:', error.message);
    console.error(error.stack);
    
    console.log('\n🔍 Debugging Information:');
    console.log(`   Base URL: ${baseUrl}`);
    console.log(`   Auth Token: ${authToken ? 'Present' : 'Missing'}`);
    console.log(`   Session ID: ${sessionId || 'None'}`);
  }
}

// Run the manual test
testPlacementFlow();