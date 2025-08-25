import { describe, test, expect, beforeAll, afterAll } from 'vitest';
import { io as ioClient, Socket } from 'socket.io-client';

describe('Callern AI Supervisor Integration', () => {
  let studentSocket: Socket;
  let teacherSocket: Socket;
  const TEST_ROOM_ID = 'test-room-' + Date.now();
  const TEACHER_ID = 74;
  const STUDENT_ID = 8470;
  
  beforeAll(async () => {
    // Connect sockets
    studentSocket = ioClient('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: false
    });
    
    teacherSocket = ioClient('http://localhost:5000', {
      transports: ['websocket'],
      reconnection: false
    });
    
    // Wait for connections
    await new Promise((resolve) => {
      let connected = 0;
      studentSocket.on('connect', () => {
        connected++;
        if (connected === 2) resolve(null);
      });
      teacherSocket.on('connect', () => {
        connected++;
        if (connected === 2) resolve(null);
      });
    });
    
    // Authenticate sockets
    studentSocket.emit('authenticate', { userId: STUDENT_ID, role: 'student' });
    teacherSocket.emit('authenticate', { userId: TEACHER_ID, role: 'teacher' });
    
    await new Promise(resolve => setTimeout(resolve, 100));
  });
  
  afterAll(() => {
    studentSocket.disconnect();
    teacherSocket.disconnect();
  });
  
  test('Should initialize supervisor session', (done) => {
    studentSocket.on('supervisor-ready', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data.features).toHaveProperty('realTimeTranscription', true);
      expect(data.features).toHaveProperty('eventExtraction', true);
      expect(data.features).toHaveProperty('liveTips', true);
      expect(data.features).toHaveProperty('feedbackStack', true);
      expect(data.features).toHaveProperty('postSessionReport', true);
      done();
    });
    
    studentSocket.emit('supervisor-init', {
      sessionId: TEST_ROOM_ID,
      studentId: STUDENT_ID,
      teacherId: TEACHER_ID,
      lessonTitle: 'Test Conversation Practice',
      objectives: ['Practice speaking', 'Improve vocabulary'],
      studentLevel: 'B1'
    });
  });
  
  test('Should process audio chunks and generate transcripts', (done) => {
    let transcriptReceived = false;
    
    studentSocket.on('transcript', (data) => {
      expect(data).toHaveProperty('text');
      expect(data).toHaveProperty('speaker');
      expect(data).toHaveProperty('timestamp');
      expect(data).toHaveProperty('confidence');
      transcriptReceived = true;
      done();
    });
    
    // Send mock audio chunk
    const mockAudioBuffer = new ArrayBuffer(32000); // 1 second of 16kHz audio
    studentSocket.emit('audio-chunk', {
      sessionId: TEST_ROOM_ID,
      role: 'student',
      audio: mockAudioBuffer,
      timestamp: Date.now()
    });
    
    // Timeout after 3 seconds
    setTimeout(() => {
      if (!transcriptReceived) {
        done(new Error('No transcript received'));
      }
    }, 3000);
  });
  
  test('Should generate contextual teacher tips', (done) => {
    studentSocket.on('teacher-tip', (data) => {
      expect(data).toHaveProperty('text');
      expect(data).toHaveProperty('priority');
      expect(data.text.length).toBeLessThanOrEqual(100); // Tips should be concise
      done();
    });
    
    // Trigger conditions that would generate a tip
    studentSocket.emit('supervisor-init', {
      sessionId: TEST_ROOM_ID + '-tips',
      studentId: STUDENT_ID,
      teacherId: TEACHER_ID
    });
    
    setTimeout(() => done(new Error('No teacher tip received')), 25000); // Allow for 20s cooldown
  }, 30000);
  
  test('Should generate student scaffolding tips', (done) => {
    studentSocket.on('student-tip', (data) => {
      expect(data).toHaveProperty('text');
      expect(data).toHaveProperty('priority');
      done();
    });
    
    // Request should trigger student tips
    setTimeout(() => done(new Error('No student tip received')), 25000);
  }, 30000);
  
  test('Should track real TTT/STT metrics', (done) => {
    studentSocket.on('metrics-update', (data) => {
      expect(data).toHaveProperty('ttt');
      expect(data).toHaveProperty('stt');
      expect(data).toHaveProperty('turns');
      expect(data.ttt + data.stt).toBe(100); // Should sum to 100%
      done();
    });
    
    // Metrics should be emitted periodically
    setTimeout(() => done(new Error('No metrics update received')), 6000);
  });
  
  test('Should handle feedback stack operations', (done) => {
    const testItem = {
      type: 'grammar_error',
      content: 'Student said "I goed" instead of "I went"',
      timestamp: Date.now()
    };
    
    studentSocket.on('feedback-stack', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data.stack).toContainEqual(expect.objectContaining(testItem));
      done();
    });
    
    // Add item to feedback stack
    teacherSocket.emit('feedback-stack-add', {
      sessionId: TEST_ROOM_ID,
      item: testItem
    });
    
    // Request feedback stack
    setTimeout(() => {
      teacherSocket.emit('feedback-stack-get', { sessionId: TEST_ROOM_ID });
    }, 100);
  });
  
  test('Should generate word suggestions', (done) => {
    studentSocket.on('word-suggestions', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data.suggestions).toBeInstanceOf(Array);
      expect(data.suggestions.length).toBeGreaterThan(0);
      
      const suggestion = data.suggestions[0];
      expect(suggestion).toHaveProperty('word');
      expect(suggestion).toHaveProperty('translation');
      expect(suggestion).toHaveProperty('usage');
      done();
    });
    
    studentSocket.emit('request-word-suggestions', {
      sessionId: TEST_ROOM_ID,
      context: 'Student: I want to... um... how do you say...',
      targetLanguage: 'English'
    });
  });
  
  test('Should generate pronunciation guide', (done) => {
    studentSocket.on('pronunciation-guide', (data) => {
      expect(data).toHaveProperty('word');
      expect(data).toHaveProperty('phonetic');
      expect(data).toHaveProperty('simple');
      expect(data).toHaveProperty('tips');
      expect(data.tips).toBeInstanceOf(Array);
      done();
    });
    
    studentSocket.emit('request-pronunciation', {
      sessionId: TEST_ROOM_ID,
      word: 'difficult',
      language: 'English'
    });
  });
  
  test('Should check grammar and provide corrections', (done) => {
    studentSocket.on('grammar-correction', (data) => {
      expect(data).toHaveProperty('original');
      expect(data).toHaveProperty('isCorrect');
      expect(data).toHaveProperty('correction');
      expect(data).toHaveProperty('explanation');
      done();
    });
    
    studentSocket.emit('request-grammar-check', {
      sessionId: TEST_ROOM_ID,
      text: 'I have went to the store yesterday'
    });
  });
  
  test('Should generate session report', (done) => {
    studentSocket.on('session-report', (data) => {
      expect(data).toHaveProperty('session_title');
      expect(data).toHaveProperty('what_student_learned');
      expect(data).toHaveProperty('scores');
      expect(data).toHaveProperty('next_steps');
      expect(data.scores).toHaveProperty('accuracy');
      expect(data.scores).toHaveProperty('fluency');
      expect(data.scores).toHaveProperty('task_completion');
      done();
    });
    
    studentSocket.emit('generate-report', { sessionId: TEST_ROOM_ID });
  });
  
  test('Should generate Joy Box content', (done) => {
    studentSocket.on('joybox-content', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data.item).toHaveProperty('type');
      expect(data.item).toHaveProperty('title');
      expect(data.item).toHaveProperty('why');
      expect(data.item).toHaveProperty('duration');
      done();
    });
    
    studentSocket.emit('generate-joybox', {
      sessionId: TEST_ROOM_ID,
      keyVocabulary: ['present perfect', 'irregular verbs'],
      grammarPoints: ['past tense']
    });
  });
  
  test('Should generate game from session', (done) => {
    studentSocket.on('game-generated', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data.game).toHaveProperty('type');
      expect(data.game).toHaveProperty('title');
      expect(data.game).toHaveProperty('instructions');
      expect(data.game).toHaveProperty('items');
      expect(data.game).toHaveProperty('answerKey');
      expect(data.game).toHaveProperty('duration');
      done();
    });
    
    studentSocket.emit('generate-game', {
      sessionId: TEST_ROOM_ID,
      gameType: 'cloze'
    });
  });
  
  test('Should handle supervisor session end', (done) => {
    studentSocket.on('supervisor-ended', (data) => {
      expect(data.sessionId).toBe(TEST_ROOM_ID);
      expect(data).toHaveProperty('report');
      done();
    });
    
    studentSocket.emit('supervisor-end', { sessionId: TEST_ROOM_ID });
  });
});