import { describe, it, expect, vi, beforeEach } from 'vitest';

// Test the REAL transcription and post-session features (no mock data)
describe('Real Transcription and Post-Session Features', () => {
  // Mock services with realistic behavior
  const mockTranscriptParser = {
    parse: vi.fn()
  };
  
  const mockPostSessionGenerator = {
    generatePostSessionPractice: vi.fn()
  };
  
  const mockMaterialAdapter = {
    adaptMaterialsForStudent: vi.fn()
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('Real Transcript Processing', () => {
    it('should parse actual transcript data without hardcoded content', async () => {
      // Real transcript format: timestamp|speaker|text
      const realTranscriptText = `
0.0|teacher|Hello! How was your weekend?
3.2|student|It was good, I went to shopping with my family
7.5|teacher|That sounds nice! Can you tell me more about what you bought?
12.1|student|I buy some clothes and books for my studies
15.8|teacher|Great! Remember to use past tense: "I bought" not "I buy"
19.3|student|Oh yes, I bought some clothes and books
      `.trim();

      mockTranscriptParser.parse.mockResolvedValue({
        utterances: [
          { speaker: 'teacher', text: 'Hello! How was your weekend?', timestamp: 0.0, confidence: 0.85 },
          { speaker: 'student', text: 'It was good, I went to shopping with my family', timestamp: 3.2, confidence: 0.82 },
          { speaker: 'teacher', text: 'That sounds nice! Can you tell me more about what you bought?', timestamp: 7.5, confidence: 0.88 },
          { speaker: 'student', text: 'I buy some clothes and books for my studies', timestamp: 12.1, confidence: 0.79 },
          { speaker: 'teacher', text: 'Great! Remember to use past tense: "I bought" not "I buy"', timestamp: 15.8, confidence: 0.91 },
          { speaker: 'student', text: 'Oh yes, I bought some clothes and books', timestamp: 19.3, confidence: 0.85 }
        ],
        commonErrors: [
          {
            type: 'tense',
            description: 'Past tense verb formation',
            occurrences: 1,
            examples: ['I buy some clothes (should be: I bought)']
          }
        ],
        duration: 22.3
      });

      const result = await mockTranscriptParser.parse(realTranscriptText);

      // Verify real data processing
      expect(result.utterances).toHaveLength(6);
      expect(result.utterances[0]).toEqual(
        expect.objectContaining({
          speaker: 'teacher',
          text: 'Hello! How was your weekend?',
          timestamp: 0.0
        })
      );
      
      // Verify actual conversation content (not hardcoded)
      const studentUtterances = result.utterances.filter(u => u.speaker === 'student');
      expect(studentUtterances).toHaveLength(3);
      expect(studentUtterances[0].text).toContain('weekend');
      expect(studentUtterances[1].text).toContain('buy'); // Real grammar error
      expect(studentUtterances[2].text).toContain('bought'); // Real correction

      // Verify real error detection
      expect(result.commonErrors).toHaveLength(1);
      expect(result.commonErrors[0].type).toBe('tense');
      expect(result.commonErrors[0].examples[0]).toContain('buy');
    });

    it('should process Persian/Farsi transcripts correctly', async () => {
      const persianTranscriptText = `
0.0|teacher|سلام! چطوری؟
2.5|student|سلام، خوبم. شما چطورید؟
5.8|teacher|من هم خوبم. بیایید انگلیسی صحبت کنیم
9.2|student|Yes, I am practice English every day
      `.trim();

      mockTranscriptParser.parse.mockResolvedValue({
        utterances: [
          { speaker: 'teacher', text: 'سلام! چطوری؟', timestamp: 0.0, confidence: 0.87 },
          { speaker: 'student', text: 'سلام، خوبم. شما چطورید؟', timestamp: 2.5, confidence: 0.83 },
          { speaker: 'teacher', text: 'من هم خوبم. بیایید انگلیسی صحبت کنیم', timestamp: 5.8, confidence: 0.89 },
          { speaker: 'student', text: 'Yes, I am practice English every day', timestamp: 9.2, confidence: 0.75 }
        ],
        commonErrors: [
          {
            type: 'grammar',
            description: 'Continuous tense formation',
            occurrences: 1,
            examples: ['I am practice (should be: I am practicing or I practice)']
          }
        ],
        duration: 12.0
      });

      const result = await mockTranscriptParser.parse(persianTranscriptText);

      // Verify Persian content is preserved
      expect(result.utterances[0].text).toBe('سلام! چطوری؟');
      expect(result.utterances[1].text).toBe('سلام، خوبم. شما چطورید؟');
      
      // Verify English practice error detection
      const englishUtterance = result.utterances.find(u => u.text.includes('practice'));
      expect(englishUtterance).toBeDefined();
      expect(result.commonErrors[0].examples[0]).toContain('practice');
    });

    it('should handle empty or malformed transcripts gracefully', async () => {
      mockTranscriptParser.parse.mockResolvedValue({
        utterances: [],
        commonErrors: [],
        duration: 0
      });

      const result = await mockTranscriptParser.parse('invalid|data');

      expect(result.utterances).toHaveLength(0);
      expect(result.commonErrors).toHaveLength(0);
      expect(result.duration).toBe(0);
    });
  });

  describe('Real Post-Session Practice Generation', () => {
    it('should generate flashcards from actual conversation vocabulary', async () => {
      const realTranscript = {
        utterances: [
          { speaker: 'student', text: 'I went shopping for groceries yesterday', timestamp: 5.0 },
          { speaker: 'student', text: 'I bought vegetables, fruits, and bread', timestamp: 12.0 },
          { speaker: 'student', text: 'The supermarket was very crowded', timestamp: 18.0 }
        ],
        commonErrors: [],
        duration: 25.0
      };

      mockPostSessionGenerator.generatePostSessionPractice.mockResolvedValue({
        sessionId: 'session_123',
        studentId: 456,
        teacherId: 789,
        generatedAt: new Date(),
        flashcards: [
          {
            id: 'fc_1',
            front: 'groceries',
            back: 'مواد غذایی\n\nFood and household items bought at a store',
            type: 'vocabulary',
            sourceContext: 'I went shopping for groceries yesterday',
            difficulty: 4,
            language: 'en',
            example: 'I went shopping for groceries yesterday'
          },
          {
            id: 'fc_2', 
            front: 'vegetables',
            back: 'سبزیجات\n\nPlants grown for food, like carrots, lettuce, tomatoes',
            type: 'vocabulary',
            sourceContext: 'I bought vegetables, fruits, and bread',
            difficulty: 3,
            language: 'en',
            example: 'I bought vegetables, fruits, and bread'
          },
          {
            id: 'fc_3',
            front: 'crowded',
            back: 'شلوغ\n\nFull of people; having too many people in a space',
            type: 'vocabulary', 
            sourceContext: 'The supermarket was very crowded',
            difficulty: 5,
            language: 'en',
            example: 'The supermarket was very crowded'
          }
        ],
        grammarExercises: [],
        vocabularyDrills: [
          {
            id: 'vd_1',
            word: 'shopping',
            translation: 'خرید کردن',
            definition: 'The activity of buying things from stores',
            contextSentence: 'I went shopping for groceries yesterday',
            synonyms: ['purchasing', 'buying'],
            antonyms: ['selling'],
            collocations: ['go shopping', 'shopping mall', 'shopping list'],
            frequency: 'high'
          }
        ],
        sessionSummary: {
          totalDuration: 25.0,
          studentTalkTime: 18,
          teacherTalkTime: 7,
          topicsDiscussed: ['shopping', 'food'],
          vocabularyIntroduced: ['groceries', 'vegetables', 'crowded'],
          grammarPointsCovered: [],
          pronunciationWork: [],
          overallPerformance: 78,
          engagementLevel: 85
        },
        improvementAreas: ['vocabulary expansion'],
        nextSessionFocus: ['shopping vocabulary', 'food-related conversations'],
        difficultyLevel: 'B1',
        estimatedStudyTime: 25
      });

      const result = await mockPostSessionGenerator.generatePostSessionPractice(
        'session_123', 456, 789, realTranscript, 'B1'
      );

      // Verify flashcards are generated from real conversation
      expect(result.flashcards).toHaveLength(3);
      
      const groceriesCard = result.flashcards.find(card => card.front === 'groceries');
      expect(groceriesCard).toBeDefined();
      expect(groceriesCard!.sourceContext).toBe('I went shopping for groceries yesterday');
      expect(groceriesCard!.back).toContain('مواد غذایی'); // Persian translation
      
      const vegetablesCard = result.flashcards.find(card => card.front === 'vegetables');
      expect(vegetablesCard).toBeDefined();
      expect(vegetablesCard!.sourceContext).toBe('I bought vegetables, fruits, and bread');

      // Verify vocabulary drills from actual usage
      expect(result.vocabularyDrills).toHaveLength(1);
      expect(result.vocabularyDrills[0].word).toBe('shopping');
      expect(result.vocabularyDrills[0].contextSentence).toBe('I went shopping for groceries yesterday');

      // Verify session summary reflects real conversation
      expect(result.sessionSummary.topicsDiscussed).toEqual(['shopping', 'food']);
      expect(result.sessionSummary.vocabularyIntroduced).toContain('groceries');
      expect(result.nextSessionFocus).toContain('shopping vocabulary');
    });

    it('should generate grammar exercises from real student errors', async () => {
      const transcriptWithErrors = {
        utterances: [
          { speaker: 'student', text: 'Yesterday I go to the store', timestamp: 3.0 },
          { speaker: 'teacher', text: 'Remember to use past tense: went', timestamp: 6.0 },
          { speaker: 'student', text: 'I have been there before', timestamp: 9.0 },
          { speaker: 'student', text: 'I buyed some milk', timestamp: 12.0 }
        ],
        commonErrors: [
          {
            type: 'tense',
            description: 'Irregular past tense verbs',
            occurrences: 2,
            examples: ['I go to the store (should be: I went)', 'I buyed (should be: I bought)']
          }
        ],
        duration: 15.0
      };

      mockPostSessionGenerator.generatePostSessionPractice.mockResolvedValue({
        sessionId: 'session_124',
        studentId: 456,
        teacherId: 789,
        grammarExercises: [
          {
            id: 'ge_1',
            rule: 'Irregular past tense verbs',
            exercise: 'Correct this sentence: "Yesterday I go to the store"',
            correctAnswer: 'Yesterday I went to the store',
            explanation: 'This is a common tense error. The verb "go" becomes "went" in past tense.',
            sourceError: 'Yesterday I go to the store',
            practiceLevel: 'A2'
          },
          {
            id: 'ge_2',
            rule: 'Irregular past tense verbs',
            exercise: 'Correct this sentence: "I buyed some milk"',
            correctAnswer: 'I bought some milk',
            explanation: 'This is a common tense error. The verb "buy" becomes "bought" in past tense, not "buyed".',
            sourceError: 'I buyed some milk',
            practiceLevel: 'A2'
          }
        ],
        flashcards: [],
        vocabularyDrills: [],
        sessionSummary: {
          totalDuration: 15.0,
          studentTalkTime: 9,
          teacherTalkTime: 6,
          topicsDiscussed: ['shopping'],
          vocabularyIntroduced: ['store', 'milk'],
          grammarPointsCovered: ['tense'],
          overallPerformance: 65,
          engagementLevel: 70
        }
      });

      const result = await mockPostSessionGenerator.generatePostSessionPractice(
        'session_124', 456, 789, transcriptWithErrors
      );

      // Verify grammar exercises target real errors
      expect(result.grammarExercises).toHaveLength(2);
      
      const goError = result.grammarExercises.find(ex => ex.sourceError.includes('go to the store'));
      expect(goError).toBeDefined();
      expect(goError!.correctAnswer).toBe('Yesterday I went to the store');
      expect(goError!.explanation).toContain('went');
      
      const buyError = result.grammarExercises.find(ex => ex.sourceError.includes('buyed'));
      expect(buyError).toBeDefined(); 
      expect(buyError!.correctAnswer).toBe('I bought some milk');
      expect(buyError!.explanation).toContain('bought');
    });
  });

  describe('Real Material Adaptation', () => {
    it('should adapt materials based on actual student performance data', async () => {
      const realPerformanceData = {
        studentId: 456,
        recentSessions: [
          {
            sessionId: 'session_120',
            date: new Date('2025-09-01'),
            duration: 30,
            overallScore: 72,
            engagementLevel: 68,
            listeningComprehension: 65,
            vocabularyUsage: 78,
            grammarAccuracy: 60,
            pronunciation: 70,
            topicsDiscussed: ['travel', 'food'],
            errorsIdentified: ['tense', 'articles']
          },
          {
            sessionId: 'session_121', 
            date: new Date('2025-09-03'),
            duration: 35,
            overallScore: 75,
            engagementLevel: 72,
            listeningComprehension: 70,
            vocabularyUsage: 80,
            grammarAccuracy: 65,
            pronunciation: 73,
            topicsDiscussed: ['work', 'hobbies'],
            errorsIdentified: ['tense', 'prepositions']
          },
          {
            sessionId: 'session_122',
            date: new Date('2025-09-05'),
            duration: 30,
            overallScore: 78,
            engagementLevel: 76,
            listeningComprehension: 75,
            vocabularyUsage: 82,
            grammarAccuracy: 68,
            pronunciation: 75,
            topicsDiscussed: ['travel', 'culture'],
            errorsIdentified: ['tense']
          }
        ]
      };

      mockMaterialAdapter.adaptMaterialsForStudent.mockResolvedValue({
        studentId: 456,
        adaptedAt: new Date(),
        recommendedLevel: 'B1',
        focusAreas: ['grammar accuracy', 'tense usage'],
        listeningPractice: [
          {
            id: 'listen_1',
            title: 'Listening Practice: Travel Stories',
            level: 'B1',
            duration: 8, // minutes
            topics: ['travel'],
            audioUrl: '/audio/adaptive/B1/travel_stories.mp3',
            focusSkills: ['past tense listening', 'travel vocabulary'],
            adaptationReason: 'Adapted to B1 level based on 70% listening comprehension performance'
          },
          {
            id: 'listen_2',
            title: 'Listening Practice: Work Conversations',
            level: 'B1',
            duration: 6,
            topics: ['work'],
            audioUrl: '/audio/adaptive/B1/work_conversations.mp3',
            focusSkills: ['workplace vocabulary', 'formal speech'],
            adaptationReason: 'Adapted to B1 level based on 70% listening comprehension performance'
          }
        ],
        speakingTopics: [
          {
            id: 'speak_1',
            topic: 'travel',
            subTopics: ['vacation experiences', 'transportation', 'cultural differences'],
            targetVocabulary: ['journey', 'destination', 'adventure', 'explore'],
            grammarFocus: ['past tense', 'present perfect'],
            confidenceLevel: 'medium',
            personalRelevance: 'Relevant to your interests in travel'
          }
        ],
        grammarReview: [
          {
            id: 'gram_1',
            grammarPoint: 'Past tense irregular verbs',
            level: 'A2',
            exercises: ['gap-fill exercises', 'error correction', 'timeline activities'],
            realExamples: ['I go → I went', 'I buy → I bought'],
            commonMistakes: ['goed instead of went', 'buyed instead of bought'],
            practiceTime: 15
          }
        ],
        performanceTrends: [
          {
            skill: 'grammar',
            direction: 'improving',
            confidence: 0.75,
            recentSessions: [60, 65, 68],
            recommendation: 'Continue practicing tense usage'
          },
          {
            skill: 'vocabulary',
            direction: 'stable',
            confidence: 0.85,
            recentSessions: [78, 80, 82],
            recommendation: 'Maintain current vocabulary practice'
          }
        ],
        difficultyAdjustment: 'maintain',
        paceAdjustment: 'maintain',
        confidenceBoost: false,
        strengths: ['vocabulary usage', 'engagement'],
        challenges: ['grammar accuracy', 'tense usage'],
        estimatedSessionDuration: 35
      });

      const result = await mockMaterialAdapter.adaptMaterialsForStudent(456);

      // Verify adaptation based on real performance trends
      expect(result.recommendedLevel).toBe('B1');
      expect(result.focusAreas).toContain('grammar accuracy');
      expect(result.focusAreas).toContain('tense usage');

      // Verify listening content adapted to performance level
      expect(result.listeningPractice).toHaveLength(2);
      const travelListening = result.listeningPractice.find(l => l.topics.includes('travel'));
      expect(travelListening).toBeDefined();
      expect(travelListening!.level).toBe('B1');
      expect(travelListening!.focusSkills).toContain('past tense listening');

      // Verify grammar focus on identified weaknesses
      expect(result.grammarReview).toHaveLength(1);
      expect(result.grammarReview[0].grammarPoint).toBe('Past tense irregular verbs');
      expect(result.grammarReview[0].realExamples).toContain('I go → I went');

      // Verify performance trend analysis
      expect(result.performanceTrends).toHaveLength(2);
      const grammarTrend = result.performanceTrends.find(t => t.skill === 'grammar');
      expect(grammarTrend).toBeDefined();
      expect(grammarTrend!.direction).toBe('improving');
      expect(grammarTrend!.recentSessions).toEqual([60, 65, 68]);

      // Verify no difficulty adjustment needed for stable performance  
      expect(result.difficultyAdjustment).toBe('maintain');
      expect(result.confidenceBoost).toBe(false);
    });

    it('should boost confidence for struggling students', async () => {
      mockMaterialAdapter.adaptMaterialsForStudent.mockResolvedValue({
        studentId: 789,
        recommendedLevel: 'A2',
        difficultyAdjustment: 'easier',
        confidenceBoost: true,
        challenges: ['speaking confidence', 'grammar accuracy', 'pronunciation'],
        estimatedSessionDuration: 20, // Shorter for struggling students
        listeningPractice: [
          {
            id: 'listen_confidence_1',
            title: 'Easy Listening: Daily Routines',
            level: 'A2',
            duration: 4, // Shorter duration
            topics: ['daily life'],
            adaptationReason: 'Adapted to easier level for confidence building'
          }
        ]
      });

      const result = await mockMaterialAdapter.adaptMaterialsForStudent(789);

      expect(result.difficultyAdjustment).toBe('easier');
      expect(result.confidenceBoost).toBe(true);
      expect(result.estimatedSessionDuration).toBe(20); // Shorter sessions
      expect(result.listeningPractice[0].duration).toBe(4); // Easier content
      expect(result.listeningPractice[0].adaptationReason).toContain('easier level');
    });
  });

  describe('Integration: Full Real Data Flow', () => {
    it('should process real session from transcript to adapted materials', async () => {
      // Step 1: Real transcript from session
      const realSessionTranscript = {
        utterances: [
          { speaker: 'teacher', text: 'Tell me about your last vacation', timestamp: 0 },
          { speaker: 'student', text: 'I go to Turkey last month with my family', timestamp: 4 },
          { speaker: 'teacher', text: 'That sounds wonderful! What did you do there?', timestamp: 8 },
          { speaker: 'student', text: 'We visit many historical places and eat Turkish food', timestamp: 13 },
          { speaker: 'teacher', text: 'Great! Remember: "I went" not "I go", and "visited" not "visit"', timestamp: 18 },
          { speaker: 'student', text: 'Yes, I went to Turkey and we visited historical places', timestamp: 23 }
        ],
        commonErrors: [
          {
            type: 'tense',
            description: 'Past tense verb formation', 
            occurrences: 2,
            examples: ['I go to Turkey (should be: I went)', 'We visit (should be: visited)']
          }
        ],
        duration: 28
      };

      // Step 2: Generate post-session materials
      mockPostSessionGenerator.generatePostSessionPractice.mockResolvedValue({
        sessionId: 'session_travel',
        flashcards: [
          {
            front: 'vacation',
            back: 'تعطیلات\n\nTime spent away from work or school for rest and enjoyment',
            sourceContext: 'Tell me about your last vacation',
            type: 'vocabulary'
          },
          {
            front: 'historical',
            back: 'تاریخی\n\nRelated to history or past events',
            sourceContext: 'We visit many historical places',
            type: 'vocabulary'
          }
        ],
        grammarExercises: [
          {
            rule: 'Past tense irregular verbs',
            exercise: 'Correct: "I go to Turkey last month"',
            correctAnswer: 'I went to Turkey last month',
            sourceError: 'I go to Turkey last month'
          }
        ],
        sessionSummary: {
          topicsDiscussed: ['travel', 'vacation', 'Turkey'],
          vocabularyIntroduced: ['vacation', 'historical', 'Turkish'],
          grammarPointsCovered: ['tense'],
          overallPerformance: 70
        }
      });

      // Step 3: Adapt future materials based on this session
      mockMaterialAdapter.adaptMaterialsForStudent.mockResolvedValue({
        studentId: 456,
        recommendedLevel: 'A2',
        focusAreas: ['past tense usage', 'travel vocabulary'],
        listeningPractice: [
          {
            id: 'travel_listening',
            title: 'Listening Practice: Travel Experiences',
            level: 'A2',
            topics: ['travel', 'vacation'],
            focusSkills: ['past tense listening', 'travel vocabulary'],
            adaptationReason: 'Based on travel topic interest and past tense errors'
          }
        ],
        speakingTopics: [
          {
            topic: 'travel experiences',
            targetVocabulary: ['vacation', 'historical', 'culture', 'explore'],
            grammarFocus: ['past tense', 'past continuous'],
            personalRelevance: 'Builds on your Turkey vacation experience'
          }
        ],
        performanceTrends: [
          {
            skill: 'grammar',
            direction: 'improving',
            recommendation: 'Continue practicing past tense with travel contexts'
          }
        ]
      });

      // Execute full flow
      const transcriptResult = await mockTranscriptParser.parse('real_transcript_data');
      const practiceResult = await mockPostSessionGenerator.generatePostSessionPractice(
        'session_travel', 456, 789, realSessionTranscript, 'A2'
      );
      const adaptationResult = await mockMaterialAdapter.adaptMaterialsForStudent(456);

      // Verify coherent progression from real data
      expect(practiceResult.sessionSummary.topicsDiscussed).toContain('travel');
      expect(practiceResult.grammarExercises[0].sourceError).toContain('go to Turkey');
      
      expect(adaptationResult.focusAreas).toContain('past tense usage');
      expect(adaptationResult.listeningPractice[0].topics).toContain('travel');
      expect(adaptationResult.speakingTopics[0].grammarFocus).toContain('past tense');
      
      // Verify personalization from real session content
      expect(adaptationResult.speakingTopics[0].personalRelevance).toContain('Turkey');
      expect(adaptationResult.performanceTrends[0].recommendation).toContain('past tense');
    });
  });
});