#!/usr/bin/env node

/**
 * Enhanced Games Management System Test Suite
 * Tests all new features added to the games management system
 */

import axios from 'axios';
const API_URL = 'http://localhost:5000';

// Login credentials
const ADMIN_CREDENTIALS = {
  email: 'admin@test.com',
  password: 'admin123'
};

let authToken = '';
let testGameId = null;
let testQuestionId = null;

// Color console output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m'
};

function log(message, color = 'reset') {
  console.log(colors[color] + message + colors.reset);
}

async function login() {
  try {
    log('\n=== LOGGING IN AS ADMIN ===', 'blue');
    const response = await axios.post(`${API_URL}/api/auth/login`, ADMIN_CREDENTIALS);
    
    // Check different possible token field names
    authToken = response.data.auth_token || response.data.token || response.data.accessToken || response.data.access_token;
    
    if (authToken) {
      log('✓ Login successful', 'green');
      log(`  Token: ${authToken.substring(0, 30)}...`, 'yellow');
      return true;
    } else {
      log('✗ Login successful but no token received', 'red');
      log('  Response: ' + JSON.stringify(response.data), 'yellow');
      return false;
    }
  } catch (error) {
    log('✗ Login failed: ' + error.message, 'red');
    if (error.response) {
      log('  Status: ' + error.response.status, 'red');
      log('  Data: ' + JSON.stringify(error.response.data), 'red');
    }
    return false;
  }
}

async function testGetAllGames() {
  try {
    log('\n=== TEST 1: GET ALL GAMES ===', 'blue');
    const response = await axios.get(`${API_URL}/api/admin/games`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (Array.isArray(response.data) && response.data.length > 0) {
      log(`✓ Retrieved ${response.data.length} games`, 'green');
      testGameId = response.data[0].id;
      log(`  Using game ID ${testGameId} for further tests`, 'yellow');
      return true;
    } else {
      log('✗ No games found', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to get games: ' + error.message, 'red');
    return false;
  }
}

async function testCreateGame() {
  try {
    log('\n=== TEST 2: CREATE NEW GAME ===', 'blue');
    const timestamp = Date.now();
    const newGame = {
      gameName: 'Test Enhanced Game',
      gameCode: `TEST-ENH-${timestamp}`,  // Use timestamp to ensure uniqueness
      description: 'Test game for enhanced features',
      gameType: 'vocabulary',
      ageGroup: '12-15',
      minLevel: 'A2',
      maxLevel: 'B1',
      language: 'en',
      gameMode: 'single_player',
      duration: 20,
      pointsPerCorrect: 10,
      bonusMultiplier: 1.5,
      livesSystem: true,
      timerEnabled: true,
      thumbnailUrl: '/images/test-game.png',
      totalLevels: 5,
      isActive: true
    };
    
    const response = await axios.post(`${API_URL}/api/admin/games`, newGame, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (response.data && response.data.id) {
      testGameId = response.data.id;
      log(`✓ Created game with ID: ${testGameId}`, 'green');
      return true;
    } else {
      log('✗ Failed to create game', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to create game: ' + error.message, 'red');
    return false;
  }
}

async function testGetGameQuestions() {
  try {
    log('\n=== TEST 3: GET GAME QUESTIONS ===', 'blue');
    const response = await axios.get(`${API_URL}/api/admin/games/${testGameId}/questions`, {
      headers: { Authorization: `Bearer ${authToken}` }
    });
    
    if (Array.isArray(response.data)) {
      log(`✓ Retrieved ${response.data.length} questions for game ${testGameId}`, 'green');
      if (response.data.length > 0) {
        testQuestionId = response.data[0].id;
        log(`  Using question ID ${testQuestionId} for further tests`, 'yellow');
      }
      return true;
    } else {
      log('✗ Invalid response format', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to get questions: ' + error.message, 'red');
    return false;
  }
}

async function testCreateGameQuestion() {
  try {
    log('\n=== TEST 4: CREATE GAME QUESTION ===', 'blue');
    const newQuestion = {
      gameId: testGameId,
      levelNumber: 1,
      questionType: 'multiple-choice',
      questionText: 'What is the capital of France?',
      optionsJson: JSON.stringify(['London', 'Paris', 'Berlin', 'Madrid']),
      correctAnswer: 'Paris',
      difficulty: 'medium',  // Added required field
      language: 'en',  // Added required field
      skillFocus: 'geography',  // Added required field
      question: 'What is the capital of France?',  // Added required field (same as questionText)
      points: 10,
      timeLimit: 30,
      hint: 'It is known as the City of Light',
      orderIndex: 1
    };
    
    const response = await axios.post(
      `${API_URL}/api/admin/games/${testGameId}/questions`, 
      newQuestion,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data && response.data.id) {
      testQuestionId = response.data.id;
      log(`✓ Created question with ID: ${testQuestionId}`, 'green');
      return true;
    } else {
      log('✗ Failed to create question', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to create question: ' + error.message, 'red');
    return false;
  }
}

async function testUpdateGameQuestion() {
  try {
    log('\n=== TEST 5: UPDATE GAME QUESTION ===', 'blue');
    
    if (!testQuestionId) {
      log('⚠ No question ID available, skipping test', 'yellow');
      return true;
    }
    
    const updatedQuestion = {
      questionText: 'What is the capital city of France?',
      hint: 'It is known as the City of Light and Love'
    };
    
    const response = await axios.put(
      `${API_URL}/api/admin/games/${testGameId}/questions/${testQuestionId}`,
      updatedQuestion,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data) {
      log(`✓ Updated question ${testQuestionId}`, 'green');
      return true;
    } else {
      log('✗ Failed to update question', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to update question: ' + error.message, 'red');
    return false;
  }
}

async function testGenerateQuestions() {
  try {
    log('\n=== TEST 6: GENERATE QUESTIONS ===', 'blue');
    const response = await axios.post(
      `${API_URL}/api/admin/games/${testGameId}/generate-questions`,
      { count: 5 },
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data && response.data.questions) {
      log(`✓ Generated ${response.data.questions.length} questions`, 'green');
      return true;
    } else {
      log('✗ Failed to generate questions', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to generate questions: ' + error.message, 'red');
    return false;
  }
}

async function testGetGameAnalytics() {
  try {
    log('\n=== TEST 7: GET GAME ANALYTICS ===', 'blue');
    const response = await axios.get(
      `${API_URL}/api/admin/games/${testGameId}/analytics`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data) {
      log('✓ Retrieved game analytics', 'green');
      log(`  Total plays: ${response.data.totalPlays || 0}`, 'yellow');
      log(`  Average score: ${response.data.averageScore || 0}`, 'yellow');
      log(`  Completion rate: ${response.data.completionRate || 0}%`, 'yellow');
      return true;
    } else {
      log('✗ Failed to get analytics', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to get analytics: ' + error.message, 'red');
    return false;
  }
}

async function testDeleteGameQuestion() {
  try {
    log('\n=== TEST 8: DELETE GAME QUESTION ===', 'blue');
    
    if (!testQuestionId) {
      log('⚠ No question ID available, skipping test', 'yellow');
      return true;
    }
    
    const response = await axios.delete(
      `${API_URL}/api/admin/games/${testGameId}/questions/${testQuestionId}`,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data) {
      log(`✓ Deleted question ${testQuestionId}`, 'green');
      return true;
    } else {
      log('✗ Failed to delete question', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to delete question: ' + error.message, 'red');
    return false;
  }
}

async function testUpdateGame() {
  try {
    log('\n=== TEST 9: UPDATE GAME ===', 'blue');
    const updatedGame = {
      description: 'Updated test game description',
      isActive: false
    };
    
    const response = await axios.put(
      `${API_URL}/api/admin/games/${testGameId}`,
      updatedGame,
      { headers: { Authorization: `Bearer ${authToken}` } }
    );
    
    if (response.data) {
      log(`✓ Updated game ${testGameId}`, 'green');
      return true;
    } else {
      log('✗ Failed to update game', 'red');
      return false;
    }
  } catch (error) {
    log('✗ Failed to update game: ' + error.message, 'red');
    return false;
  }
}

async function cleanup() {
  try {
    log('\n=== CLEANUP ===', 'blue');
    if (testGameId) {
      await axios.delete(`${API_URL}/api/admin/games/${testGameId}`, {
        headers: { Authorization: `Bearer ${authToken}` }
      });
      log(`✓ Cleaned up test game ${testGameId}`, 'green');
    }
  } catch (error) {
    log('⚠ Cleanup failed: ' + error.message, 'yellow');
  }
}

async function runTests() {
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║  ENHANCED GAMES MANAGEMENT SYSTEM TESTS   ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  
  const tests = [
    { name: 'Login', fn: login },
    { name: 'Get All Games', fn: testGetAllGames },
    { name: 'Create Game', fn: testCreateGame },
    { name: 'Get Game Questions', fn: testGetGameQuestions },
    { name: 'Create Game Question', fn: testCreateGameQuestion },
    { name: 'Update Game Question', fn: testUpdateGameQuestion },
    { name: 'Generate Questions', fn: testGenerateQuestions },
    { name: 'Get Game Analytics', fn: testGetGameAnalytics },
    { name: 'Delete Game Question', fn: testDeleteGameQuestion },
    { name: 'Update Game', fn: testUpdateGame }
  ];
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = await test.fn();
    if (result) {
      passed++;
    } else {
      failed++;
    }
  }
  
  await cleanup();
  
  log('\n╔════════════════════════════════════════════╗', 'blue');
  log('║              TEST RESULTS                  ║', 'blue');
  log('╚════════════════════════════════════════════╝', 'blue');
  log(`  ✓ Passed: ${passed}`, 'green');
  log(`  ✗ Failed: ${failed}`, failed > 0 ? 'red' : 'green');
  log(`  Total: ${passed + failed}`, 'blue');
  
  if (failed === 0) {
    log('\n🎉 ALL TESTS PASSED! 🎉', 'green');
  } else {
    log('\n⚠ Some tests failed. Please check the errors above.', 'yellow');
  }
  
  process.exit(failed > 0 ? 1 : 0);
}

// Run the tests
runTests().catch(error => {
  log('\n✗ Test suite crashed: ' + error.message, 'red');
  process.exit(1);
});