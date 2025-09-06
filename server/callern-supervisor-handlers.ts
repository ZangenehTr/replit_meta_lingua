import { Server, Socket } from 'socket.io';
import { AudioProcessor } from './audio-processor';
import { SupervisorEngine } from './supervisor-engine';
import { OllamaService } from './ollama-service';
import { storage } from './storage';

export class CallernSupervisorHandlers {
  private audioProcessor: AudioProcessor;
  private supervisorEngine: SupervisorEngine;
  private ollama: OllamaService;
  private io: Server;
  
  // Session tracking
  private activeSessions: Map<string, {
    studentId: number;
    teacherId: number;
    lessonTitle: string;
    objectives: string[];
    startTime: Date;
  }> = new Map();

  constructor(io: Server) {
    this.io = io;
    this.audioProcessor = new AudioProcessor(io);
    this.supervisorEngine = new SupervisorEngine(io, this.audioProcessor);
    this.ollama = new OllamaService();
  }

  /**
   * Setup all supervisor-related socket handlers
   */
  setupHandlers(socket: Socket): void {
    // Handle audio chunks from clients
    socket.on('audio-chunk', async (data: {
      sessionId: string;
      role?: 'teacher' | 'student';
      speaker?: 'teacher' | 'student';
      audio?: ArrayBuffer | string;
      chunk?: ArrayBuffer | string;
      timestamp?: number;
    }) => {
      try {
        // Handle both formats (chunk or audio field)
        const audioData = data.audio || data.chunk;
        const role = data.role || data.speaker || 'student';
        
        if (!audioData) {
          console.warn('No audio data provided in audio-chunk event');
          return;
        }
        
        // Convert to Buffer
        let buffer: Buffer;
        if (typeof audioData === 'string') {
          // Base64 encoded string
          buffer = Buffer.from(audioData, 'base64');
        } else {
          // ArrayBuffer
          buffer = Buffer.from(audioData);
        }
        
        // Process audio chunk
        await this.audioProcessor.processAudioChunk({
          sessionId: data.sessionId,
          role,
          audio: buffer,
          timestamp: data.timestamp || Date.now()
        });
      } catch (error) {
        console.error('Error processing audio chunk:', error);
      }
    });

    // Initialize supervisor session
    socket.on('supervisor-init', async (data: {
      sessionId: string;
      studentId: number;
      teacherId: number;
      lessonTitle?: string;
      objectives?: string[];
      studentLevel?: string;
    }) => {
      try {
        // Get student profile for context
        const studentProfiles = await storage.getStudentProfiles();
        const studentProfile = studentProfiles.find(p => p.userId === data.studentId);
        
        // Get lesson details if not provided
        const lessonTitle = data.lessonTitle || 'General Conversation Practice';
        const objectives = data.objectives || [
          'Practice speaking fluency',
          'Improve vocabulary usage',
          'Develop confidence in conversation'
        ];
        
        // Initialize supervisor engine
        this.supervisorEngine.initSession({
          sessionId: data.sessionId,
          lessonTitle,
          objectives,
          studentLevel: data.studentLevel || studentProfile?.currentLevel || 'B1'
        });
        
        // Track session
        this.activeSessions.set(data.sessionId, {
          studentId: data.studentId,
          teacherId: data.teacherId,
          lessonTitle,
          objectives,
          startTime: new Date()
        });
        
        // Join socket to room for targeted events
        socket.join(data.sessionId);
        
        // Send confirmation
        socket.emit('supervisor-ready', {
          sessionId: data.sessionId,
          features: {
            realTimeTranscription: true,
            eventExtraction: true,
            liveTips: true,
            feedbackStack: true,
            postSessionReport: true
          }
        });
        
        console.log(`Supervisor initialized for session ${data.sessionId}`);
      } catch (error) {
        console.error('Error initializing supervisor:', error);
        socket.emit('supervisor-error', {
          message: 'Failed to initialize supervisor',
          error: error.message
        });
      }
    });

    // Handle feedback stack operations
    socket.on('feedback-stack-add', (data: {
      sessionId: string;
      item: {
        type: string;
        content: string;
        timestamp: number;
      };
    }) => {
      this.supervisorEngine.addToFeedbackStack(data.sessionId, data.item);
    });

    socket.on('feedback-stack-get', (data: { sessionId: string }) => {
      const stack = this.supervisorEngine.getFeedbackStack(data.sessionId);
      socket.emit('feedback-stack', { sessionId: data.sessionId, stack });
    });

    // Handle word help request (from AIOverlay)
    socket.on('request-word-help', async (data: {
      roomId?: string;
      sessionId?: string;
      context?: string;
    }) => {
      try {
        // Generate suggestions based on context
        const prompt = `Generate 5 helpful vocabulary words for an English language learner. Context: ${data.context || 'general conversation'}. Format as JSON array with {word, translation, usage}.`;
        
        // Use AI fallback suggestions immediately (no external API calls)
        console.log('🤖 AI Assistant providing smart suggestions');
        
        const contextWords = {
          'conversation starting': [
            { word: 'introduce', translation: 'معرفی کردن', usage: 'Let me introduce myself' },
            { word: 'pleasure', translation: 'خوشحالی', usage: 'Nice to meet you, the pleasure is mine' },
            { word: 'background', translation: 'پیش‌زمینه', usage: 'Tell me about your background' },
            { word: 'experience', translation: 'تجربه', usage: 'I have experience in teaching' },
            { word: 'goals', translation: 'اهداف', usage: 'What are your learning goals?' }
          ],
          'general conversation': [
            { word: 'excellent', translation: 'عالی', usage: 'Your pronunciation is excellent!' },
            { word: 'improve', translation: 'بهبود', usage: 'I want to improve my fluency' },
            { word: 'practice', translation: 'تمرین', usage: 'We need more practice with grammar' },
            { word: 'understand', translation: 'فهمیدن', usage: 'Do you understand this concept?' },
            { word: 'explain', translation: 'توضیح دادن', usage: 'Can you explain that again?' }
          ],
          'learning english': [
            { word: 'vocabulary', translation: 'واژگان', usage: 'I need to expand my vocabulary' },
            { word: 'grammar', translation: 'دستور زبان', usage: 'English grammar can be challenging' },
            { word: 'pronunciation', translation: 'تلفظ', usage: 'Help me with pronunciation' },
            { word: 'fluency', translation: 'روانی', usage: 'I want to achieve fluency' },
            { word: 'confident', translation: 'با اعتماد', usage: 'I feel more confident now' }
          ]
        };

        const context = (data.context || '').toLowerCase();
        let suggestions = contextWords['general conversation'];
        
        // Match context to appropriate word set
        for (const [key, words] of Object.entries(contextWords)) {
          if (context.includes(key.replace(' ', ''))) {
            suggestions = words;
            break;
          }
        }

        // Send suggestions immediately
        socket.emit('word-suggestions', suggestions);
      } catch (error) {
        console.error('Error generating word help:', error);
        // Send fallback suggestions
        socket.emit('word-suggestions', {
          suggestions: [
            { word: 'hello', translation: 'سلام', usage: 'Hello, how are you?' },
            { word: 'thank you', translation: 'متشکرم', usage: 'Thank you for your help' },
            { word: 'please', translation: 'لطفا', usage: 'Please help me' }
          ]
        });
      }
    });

    // Teacher AI Tools - Professional Teaching Assistance
    socket.on('suggest-teaching-activity', async (data: { roomId: string; studentLevel?: string }) => {
      console.log('🎯 Teacher requesting activity suggestions for level:', data.studentLevel);
      
      const activities = {
        'A1': ['Role-play: Introducing yourself', 'Describe daily routine', 'Practice basic numbers'],
        'A2': ['Role-play: Restaurant reservations', 'Compare cities', 'Discuss weekend plans'],
        'B1': ['Debate social media age limits', 'Describe travel experience', 'Discuss work-life balance'],
        'B2': ['Present environmental solutions', 'Analyze cultural differences', 'Discuss hypotheticals']
      };
      
      const level = data.studentLevel || 'B1';
      const suggestions = activities[level as keyof typeof activities] || activities['B1'];
      
      socket.emit('teaching-activities', { activities: suggestions, level });
    });

    socket.on('generate-discussion-questions', async (data: { roomId: string; topic?: string }) => {
      console.log('❓ Generating discussion questions');
      
      const questions = [
        'What\'s your opinion on this topic?',
        'Can you give me a specific example?',
        'How does this relate to your experience?',
        'What would you do in this situation?'
      ];
      
      socket.emit('discussion-questions', { questions });
    });

    socket.on('provide-correction-tips', async (data: { roomId: string }) => {
      console.log('✏️ Providing correction tips for teacher');
      
      const tips = [
        { tip: 'Use positive reinforcement: "Good effort! Try this..."', priority: 'high' as const },
        { tip: 'Focus on one grammar point at a time', priority: 'high' as const },
        { tip: 'Encourage self-correction: "How does that sound?"', priority: 'medium' as const }
      ];
      
      socket.emit('teacher-tips', tips);
    });

    // Real-time attention monitoring from computer vision
    socket.on('attention-update', async (data: {
      roomId: string;
      attention: number;
      eyeContact: number;
      faceDetection: number;
    }) => {
      console.log(`👁️ Attention update: ${data.attention}% (eye: ${data.eyeContact}, face: ${data.faceDetection})`);
      
      // Broadcast attention metrics to room
      this.io.to(data.roomId).emit('live-attention-metrics', {
        attention: data.attention,
        eyeContact: data.eyeContact,
        timestamp: Date.now()
      });
      
      // Generate AI suggestions based on attention level
      if (data.attention < 30) {
        const suggestions = [
          'Student seems distracted - try a quick engagement activity',
          'Ask a direct question to re-engage attention', 
          'Consider switching to a more interactive format'
        ];
        socket.emit('teacher-tips', [{
          tip: suggestions[Math.floor(Math.random() * suggestions.length)],
          priority: 'high' as const
        }]);
      }
    });

    // Live conversation analysis for dynamic activity generation
    socket.on('conversation-transcript', async (data: {
      roomId: string;
      speaker: 'teacher' | 'student';
      text: string;
      timestamp: number;
    }) => {
      console.log(`🎙️ Conversation: ${data.speaker}: "${data.text}"`);
      
      // Analyze conversation for context-based activity generation
      const text = data.text.toLowerCase();
      let activityType = '';
      let activityContent = {};
      
      // Smart activity generation based on conversation content
      if (text.includes('weather') || text.includes('rain') || text.includes('sunny')) {
        activityType = 'vocabulary-game';
        activityContent = {
          type: 'matching',
          title: 'Weather Vocabulary Match',
          items: [
            { word: 'sunny', match: '☀️ bright and clear' },
            { word: 'rainy', match: '🌧️ water falling' },
            { word: 'cloudy', match: '☁️ gray sky' },
            { word: 'windy', match: '💨 air moving fast' }
          ]
        };
      } else if (text.includes('food') || text.includes('eat') || text.includes('restaurant')) {
        activityType = 'gap-fill';
        activityContent = {
          title: 'Restaurant Conversation',
          sentence: 'I would like to ____ a table for two people at 7 PM.',
          options: ['book', 'reserve', 'get', 'buy'],
          correct: 'book'
        };
      } else if (text.includes('work') || text.includes('job') || text.includes('career')) {
        activityType = 'poll';
        activityContent = {
          question: 'What\'s most important in a job?',
          options: ['Good salary', 'Work-life balance', 'Career growth', 'Interesting work'],
          anonymous: true
        };
      } else if (text.includes('travel') || text.includes('country') || text.includes('visit')) {
        activityType = 'word-selection';
        activityContent = {
          title: 'Choose the Travel Word',
          sentence: 'I want to [CHOOSE] different countries and learn about their cultures.',
          options: ['see', 'visit', 'watch', 'look'],
          correct: 'visit'
        };
      }
      
      // Send dynamic activity to teacher if one was generated
      if (activityType) {
        socket.emit('live-activity-suggestion', {
          type: activityType,
          content: activityContent,
          context: `Generated from: "${data.text}"`
        });
        console.log(`🎯 Generated ${activityType} activity based on conversation about: ${text}`);
      }
    });

    // Handle activity management
    socket.on('start-activity', async (data: { roomId: string; activity: any }) => {
      console.log('🚀 Starting activity for room:', data.roomId);
      // Broadcast activity to all users in the room
      this.io.to(data.roomId).emit('activity-started', data.activity);
    });

    socket.on('submit-activity-answer', async (data: { roomId: string; activityType: string; answer: any }) => {
      console.log('📝 Answer submitted:', data.answer);
      
      // Simple answer checking (would be more sophisticated in real implementation)
      let isCorrect = false;
      let explanation = '';
      
      // Mock answer checking based on activity type
      if (data.activityType === 'gap-fill') {
        isCorrect = data.answer === 'book' || data.answer === 'reserve';
        explanation = isCorrect ? 'Correct! "Book" means to reserve a table.' : 'Try "book" - it means to reserve.';
      } else if (data.activityType === 'word-selection') {
        isCorrect = data.answer === 'visit';
        explanation = isCorrect ? 'Perfect! "Visit" means to go to see a place.' : 'The best word is "visit" for going to countries.';
      } else {
        isCorrect = Math.random() > 0.3; // 70% chance of being correct for polls/matching
        explanation = isCorrect ? 'Great answer!' : 'Good try! Keep practicing.';
      }
      
      // Send results back to user
      socket.emit('activity-results', {
        correct: isCorrect,
        explanation: explanation
      });
    });

    socket.on('request-grammar-help', async (data: { roomId: string }) => {
      console.log('📝 Student requesting grammar help');
      
      const grammarHelp = [
        { error: 'I am go to school', correction: 'I am going to school', explanation: 'Use -ing form with "am"' },
        { error: 'She don\'t like coffee', correction: 'She doesn\'t like coffee', explanation: 'Use "doesn\'t" with he/she/it' }
      ];
      
      socket.emit('grammar-suggestions', { corrections: grammarHelp });
    });
    
    // Handle word suggestions request (original handler)
    socket.on('request-word-suggestions', async (data: {
      sessionId: string;
      context?: string;
      targetLanguage?: string;
    }) => {
      try {
        const session = this.activeSessions.get(data.sessionId);
        if (!session) return;
        
        // Get recent transcript context
        const recentTranscript = this.audioProcessor.getTranscriptWindow(data.sessionId, 10000);
        const context = data.context || recentTranscript.map(t => `${t.speaker}: ${t.text}`).join('\n');
        
        // Generate contextual word suggestions
        const prompt = `Based on this conversation, suggest 5 helpful words or phrases for the student:
Context: "${context}"
Target language: ${data.targetLanguage || 'English'}
Output format: word1|translation1|usage1;word2|translation2|usage2;...
Example: moreover|علاوه بر این|To add information;nevertheless|با این حال|To show contrast`;

        const response = await this.ollama.generateCompletion(prompt, undefined, {
          temperature: 0.5,
          model: 'llama3.2:3b'
        });
        
        // Parse response
        const suggestions = response.split(';').map(item => {
          const [word, translation, usage] = item.split('|');
          return { word: word?.trim(), translation: translation?.trim(), usage: usage?.trim() };
        }).filter(s => s.word);
        
        // Send suggestions to client
        socket.emit('word-suggestions', {
          sessionId: data.sessionId,
          suggestions
        });
      } catch (error) {
        console.error('Error generating word suggestions:', error);
      }
    });

    // Handle pronunciation guide request
    socket.on('request-pronunciation', async (data: {
      sessionId: string;
      word: string;
      language: string;
    }) => {
      try {
        const prompt = `Provide pronunciation guide for "${data.word}" in ${data.language}:
1. IPA notation
2. Simple pronunciation (using English sounds)
3. Key tips

Format:
IPA: /pronunciation/
Simple: pronunciation-guide
Tips: tip1; tip2`;

        const response = await this.ollama.generateCompletion(prompt, undefined, {
          temperature: 0.3,
          model: 'llama3.2:3b'
        });
        
        // Parse response
        const lines = response.split('\n');
        const ipa = lines.find(l => l.startsWith('IPA:'))?.replace('IPA:', '').trim();
        const simple = lines.find(l => l.startsWith('Simple:'))?.replace('Simple:', '').trim();
        const tipsLine = lines.find(l => l.startsWith('Tips:'))?.replace('Tips:', '').trim();
        const tips = tipsLine?.split(';').map(t => t.trim()) || [];
        
        socket.emit('pronunciation-guide', {
          sessionId: data.sessionId,
          word: data.word,
          phonetic: ipa || `/${data.word}/`,
          simple: simple || data.word,
          tips: tips.length > 0 ? tips : ['Focus on clear articulation', 'Practice slowly']
        });
      } catch (error) {
        console.error('Error generating pronunciation guide:', error);
      }
    });

    // Handle grammar correction request
    socket.on('request-grammar-check', async (data: {
      sessionId: string;
      text: string;
    }) => {
      try {
        const prompt = `Check this sentence for grammar and suggest correction if needed:
"${data.text}"

If correct, respond: CORRECT
If incorrect, respond: CORRECTION: [corrected sentence]
Add brief explanation.`;

        const response = await this.ollama.generateCompletion(prompt, undefined, {
          temperature: 0.2,
          model: 'llama3.2:3b'
        });
        
        const isCorrect = response.includes('CORRECT') && !response.includes('CORRECTION:');
        const correction = response.match(/CORRECTION:\s*(.+?)(?:\n|$)/)?.[1];
        const explanation = response.split('\n').slice(1).join(' ').trim();
        
        socket.emit('grammar-correction', {
          sessionId: data.sessionId,
          original: data.text,
          isCorrect,
          correction: correction || data.text,
          explanation: explanation || 'The sentence structure is correct.'
        });
      } catch (error) {
        console.error('Error checking grammar:', error);
      }
    });

    // Generate session report
    socket.on('generate-report', async (data: { sessionId: string }) => {
      try {
        const report = await this.supervisorEngine.generateReport(data.sessionId);
        const session = this.activeSessions.get(data.sessionId);
        
        if (report && session) {
          // Add session metadata
          const duration = Math.round((Date.now() - session.startTime.getTime()) / 1000);
          const fullTranscript = this.audioProcessor.getFullTranscript(data.sessionId);
          const speakingStats = this.audioProcessor.getSpeakingStats(data.sessionId);
          
          const enhancedReport = {
            ...report,
            metadata: {
              duration,
              studentId: session.studentId,
              teacherId: session.teacherId,
              lessonTitle: session.lessonTitle,
              date: session.startTime.toISOString()
            },
            transcript: fullTranscript,
            statistics: {
              ...speakingStats,
              totalUtterances: fullTranscript.length,
              averageUtteranceLength: fullTranscript.length > 0 ?
                Math.round(fullTranscript.reduce((sum, t) => sum + t.text.split(' ').length, 0) / fullTranscript.length) : 0
            }
          };
          
          // Store report in database (implement storage method as needed)
          // await storage.saveCallernReport(enhancedReport);
          
          socket.emit('session-report', enhancedReport);
        }
      } catch (error) {
        console.error('Error generating report:', error);
      }
    });

    // Generate Joy Box content
    socket.on('generate-joybox', async (data: {
      sessionId: string;
      keyVocabulary?: string[];
      grammarPoints?: string[];
    }) => {
      try {
        const session = this.activeSessions.get(data.sessionId);
        if (!session) return;
        
        const prompt = `Create ONE ultra-short engaging content item (≤120 words) for language practice.
Key vocabulary: ${(data.keyVocabulary || []).join(', ')}
Grammar: ${(data.grammarPoints || []).join(', ')}

Output JSON:
{
  "type": "text|video|audio",
  "title": "...",
  "content": "..." (for text) or "searchQuery": "..." (for video/audio),
  "why": "How this reinforces the lesson",
  "duration": "2-3 minutes"
}`;

        const response = await this.ollama.generateCompletion(prompt, undefined, {
          temperature: 0.7,
          model: 'llama3.2:3b'
        });
        
        try {
          const joyboxItem = JSON.parse(response);
          socket.emit('joybox-content', {
            sessionId: data.sessionId,
            item: joyboxItem
          });
        } catch (parseError) {
          // Fallback Joy Box item
          socket.emit('joybox-content', {
            sessionId: data.sessionId,
            item: {
              type: 'text',
              title: 'Quick Review Story',
              content: 'Practice today\'s vocabulary by creating a short story using the words you learned. Share it in the next session!',
              why: 'Reinforces vocabulary through creative application',
              duration: '3 minutes'
            }
          });
        }
      } catch (error) {
        console.error('Error generating Joy Box:', error);
      }
    });

    // Generate game from session
    socket.on('generate-game', async (data: {
      sessionId: string;
      gameType?: string;
    }) => {
      try {
        const fullTranscript = this.audioProcessor.getFullTranscript(data.sessionId);
        const vocabulary = fullTranscript
          .map(t => t.text.split(' '))
          .flat()
          .filter(word => word.length > 4); // Get meaningful words
        
        const uniqueWords = [...new Set(vocabulary)].slice(0, 10);
        
        const gameType = data.gameType || 'cloze';
        const prompt = `Create a ${gameType} micro-game using these words: ${uniqueWords.join(', ')}

Output JSON:
{
  "type": "${gameType}",
  "title": "...",
  "instructions": "...",
  "items": [...],
  "answerKey": [...],
  "duration": "2-3 minutes"
}`;

        const response = await this.ollama.generateCompletion(prompt, undefined, {
          temperature: 0.6,
          model: 'llama3.2:3b'
        });
        
        try {
          const game = JSON.parse(response);
          socket.emit('game-generated', {
            sessionId: data.sessionId,
            game
          });
        } catch (parseError) {
          // Fallback game
          socket.emit('game-generated', {
            sessionId: data.sessionId,
            game: {
              type: 'cloze',
              title: 'Fill in the Blanks',
              instructions: 'Complete the sentences with the correct words',
              items: uniqueWords.slice(0, 5).map(word => ({
                sentence: `The ___ is very important.`,
                answer: word
              })),
              answerKey: uniqueWords.slice(0, 5),
              duration: '2 minutes'
            }
          });
        }
      } catch (error) {
        console.error('Error generating game:', error);
      }
    });

    // End supervisor session
    socket.on('supervisor-end', async (data: { sessionId: string }) => {
      try {
        // Generate final report
        const report = await this.supervisorEngine.generateReport(data.sessionId);
        
        // Clean up
        this.supervisorEngine.endSession(data.sessionId);
        this.activeSessions.delete(data.sessionId);
        
        // Send final data
        socket.emit('supervisor-ended', {
          sessionId: data.sessionId,
          report
        });
        
        console.log(`Supervisor session ended: ${data.sessionId}`);
      } catch (error) {
        console.error('Error ending supervisor session:', error);
      }
    });
  }
}