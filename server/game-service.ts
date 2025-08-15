import { db } from './db';
import { 
  games, gameLevels, gameQuestions, gameSessions, gameLeaderboards,
  userGameProgress, gameDailyChallenges, userDailyChallengeProgress,
  gameAnswerLogs, users
} from '@shared/schema';
import { eq, and, desc, sql, gte, lte, or, inArray } from 'drizzle-orm';
import type {
  Game, GameLevel, GameQuestion, GameSession, GameLeaderboard,
  UserGameProgress, GameDailyChallenge, UserDailyChallengeProgress,
  GameAnswerLog, InsertGameQuestion, InsertGameDailyChallenge
} from '@shared/schema';

export class GameService {
  // Generate questions for a game without requiring levels
  async generateQuestionsForGame(gameId: number, levelNumber: number, count: number = 10): Promise<GameQuestion[]> {
    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    
    if (!game[0]) {
      throw new Error('Game not found');
    }

    const gameData = game[0];
    
    // Generate questions based on game type
    const questions: Partial<InsertGameQuestion>[] = [];
    
    switch (gameData.gameType) {
      case 'vocabulary':
        questions.push(...this.generateVocabularyQuestionsForGame(gameData, levelNumber, count));
        break;
      case 'grammar':
        questions.push(...this.generateGrammarQuestionsForGame(gameData, levelNumber, count));
        break;
      default:
        questions.push(...this.generateMixedQuestionsForGame(gameData, levelNumber, count));
    }

    // Insert questions into database
    const insertedQuestions = [];
    for (const question of questions) {
      const completeQuestion = {
        gameId: gameId,
        levelNumber: levelNumber,
        difficulty: question.difficulty || 'medium',
        questionType: question.questionType || 'multiple-choice',
        skillFocus: question.skillFocus || 'general',
        question: question.question || '',
        language: gameData.language || 'en',
        ...question
      };
      const [inserted] = await db.insert(gameQuestions).values(completeQuestion as InsertGameQuestion).returning();
      insertedQuestions.push(inserted);
    }

    return insertedQuestions;
  }

  // Generate real game questions based on game type and level
  async generateGameQuestions(gameId: number, levelId: number, count: number = 10): Promise<GameQuestion[]> {
    const game = await db.select().from(games).where(eq(games.id, gameId)).limit(1);
    const level = await db.select().from(gameLevels).where(eq(gameLevels.id, levelId)).limit(1);
    
    if (!game[0] || !level[0]) {
      throw new Error('Game or level not found');
    }

    const gameData = game[0];
    const levelData = level[0];
    
    // Generate questions based on game type
    const questions: InsertGameQuestion[] = [];
    
    switch (gameData.gameType) {
      case 'vocabulary':
        questions.push(...this.generateVocabularyQuestions(gameData, levelData, count));
        break;
      case 'grammar':
        questions.push(...this.generateGrammarQuestions(gameData, levelData, count));
        break;
      case 'listening':
        questions.push(...this.generateListeningQuestions(gameData, levelData, count));
        break;
      case 'speaking':
        questions.push(...this.generateSpeakingQuestions(gameData, levelData, count));
        break;
      case 'reading':
        questions.push(...this.generateReadingQuestions(gameData, levelData, count));
        break;
      case 'writing':
        questions.push(...this.generateWritingQuestions(gameData, levelData, count));
        break;
      default:
        questions.push(...this.generateMixedQuestions(gameData, levelData, count));
    }

    // Insert questions into database
    const insertedQuestions = [];
    for (const question of questions) {
      const [inserted] = await db.insert(gameQuestions).values(question).returning();
      insertedQuestions.push(inserted);
    }

    return insertedQuestions;
  }

  // Generate vocabulary questions for game without levels
  private generateVocabularyQuestionsForGame(game: Game, levelNumber: number, count: number): Partial<InsertGameQuestion>[] {
    const questions: Partial<InsertGameQuestion>[] = [];
    const difficulties = ['easy', 'medium', 'hard'];
    
    // Sample vocabulary data
    const vocabData = {
      en: {
        easy: [
          { word: 'apple', translation: 'سیب', context: 'I eat an apple every day' },
          { word: 'book', translation: 'کتاب', context: 'She reads a book' },
          { word: 'water', translation: 'آب', context: 'We need water to live' }
        ],
        medium: [
          { word: 'accomplish', translation: 'انجام دادن', context: 'We will accomplish our goals' },
          { word: 'essential', translation: 'ضروری', context: 'Sleep is essential for health' },
          { word: 'demonstrate', translation: 'نشان دادن', context: 'Let me demonstrate how it works' }
        ],
        hard: [
          { word: 'ubiquitous', translation: 'همه جا حاضر', context: 'Smartphones are ubiquitous nowadays' },
          { word: 'pragmatic', translation: 'عملگرا', context: 'We need a pragmatic solution' },
          { word: 'ephemeral', translation: 'زودگذر', context: 'Social media posts are ephemeral' }
        ]
      }
    };

    for (let i = 0; i < count; i++) {
      const difficulty = difficulties[i % 3];
      const vocab = vocabData.en[difficulty][i % 3];
      
      questions.push({
        gameId: game.id,
        levelNumber: levelNumber,
        difficulty: difficulty,
        questionType: 'multiple-choice',
        skillFocus: 'vocabulary',
        question: `What is the meaning of "${vocab.word}"?`,
        optionsJson: JSON.stringify([vocab.translation, 'خانه', 'ماشین', 'درخت']),
        correctAnswer: vocab.translation,
        points: difficulty === 'easy' ? 5 : difficulty === 'medium' ? 10 : 15,
        timeLimit: 30,
        hint: vocab.context,
        orderIndex: i + 1
      });
    }

    return questions;
  }

  // Generate grammar questions for game without levels
  private generateGrammarQuestionsForGame(game: Game, levelNumber: number, count: number): Partial<InsertGameQuestion>[] {
    const questions: Partial<InsertGameQuestion>[] = [];
    
    const grammarData = [
      {
        question: 'Choose the correct form: She ___ to school every day.',
        options: ['go', 'goes', 'going', 'went'],
        correct: 'goes',
        difficulty: 'easy',
        hint: 'Third person singular present tense'
      },
      {
        question: 'Which sentence is grammatically correct?',
        options: [
          'I have been working here since 5 years',
          'I have been working here for 5 years',
          'I am working here since 5 years',
          'I work here since 5 years'
        ],
        correct: 'I have been working here for 5 years',
        difficulty: 'medium',
        hint: 'Use "for" with duration, "since" with specific time'
      }
    ];

    for (let i = 0; i < count; i++) {
      const data = grammarData[i % grammarData.length];
      questions.push({
        gameId: game.id,
        levelNumber: levelNumber,
        difficulty: data.difficulty,
        questionType: 'multiple-choice',
        skillFocus: 'grammar',
        question: data.question,
        optionsJson: JSON.stringify(data.options),
        correctAnswer: data.correct,
        points: data.difficulty === 'easy' ? 5 : 10,
        timeLimit: 45,
        hint: data.hint,
        orderIndex: i + 1
      });
    }

    return questions;
  }

  // Generate mixed questions for game without levels
  private generateMixedQuestionsForGame(game: Game, levelNumber: number, count: number): Partial<InsertGameQuestion>[] {
    const questions: Partial<InsertGameQuestion>[] = [];
    const vocabQuestions = this.generateVocabularyQuestionsForGame(game, levelNumber, Math.floor(count / 2));
    const grammarQuestions = this.generateGrammarQuestionsForGame(game, levelNumber, Math.ceil(count / 2));
    
    questions.push(...vocabQuestions, ...grammarQuestions);
    return questions.slice(0, count);
  }

  // Generate vocabulary questions with real content
  private generateVocabularyQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const vocabularyData = this.getVocabularyData(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const vocab = vocabularyData[i % vocabularyData.length];
      const questionType = ['multiple_choice', 'fill_blank', 'matching'][i % 3];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType,
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'vocabulary',
        question: this.generateVocabularyQuestion(vocab, questionType),
        options: this.generateVocabularyOptions(vocab, questionType),
        correctAnswer: vocab.translation,
        alternativeAnswers: vocab.synonyms || null,
        explanation: `The word "${vocab.word}" means "${vocab.translation}" in ${game.language}. ${vocab.context || ''}`,
        hint: vocab.hint || `Think about the context where you might use this word.`,
        teachingPoint: vocab.usage || null,
        basePoints: 10 + (level.levelNumber * 2),
        timeLimit: questionType === 'matching' ? 60 : 30,
        bonusPoints: 5,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate grammar questions with real content
  private generateGrammarQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const grammarRules = this.getGrammarRules(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const rule = grammarRules[i % grammarRules.length];
      const questionType = ['multiple_choice', 'fill_blank', 'ordering'][i % 3];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType,
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'grammar',
        question: this.generateGrammarQuestion(rule, questionType),
        options: this.generateGrammarOptions(rule, questionType),
        correctAnswer: rule.correctForm,
        alternativeAnswers: rule.acceptableVariants || null,
        explanation: `${rule.explanation}. This follows the ${rule.ruleName} rule in ${game.language}.`,
        hint: rule.hint || `Remember the ${rule.ruleName} rule.`,
        teachingPoint: rule.fullExplanation,
        basePoints: 15 + (level.levelNumber * 3),
        timeLimit: 45,
        bonusPoints: 7,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate listening questions
  private generateListeningQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const listeningContent = this.getListeningContent(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const content = listeningContent[i % listeningContent.length];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType: 'multiple_choice',
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'listening',
        question: content.question,
        questionAudio: content.audioUrl,
        options: content.options,
        correctAnswer: content.answer,
        alternativeAnswers: null,
        explanation: content.transcript,
        hint: 'Listen carefully to the pronunciation and intonation.',
        teachingPoint: content.focusPoint,
        basePoints: 20 + (level.levelNumber * 4),
        timeLimit: 90,
        bonusPoints: 10,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate speaking questions
  private generateSpeakingQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const speakingPrompts = this.getSpeakingPrompts(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const prompt = speakingPrompts[i % speakingPrompts.length];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType: 'speaking',
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'pronunciation',
        question: prompt.prompt,
        questionImage: prompt.imageUrl || null,
        options: null,
        correctAnswer: prompt.expectedResponse,
        alternativeAnswers: prompt.acceptableVariants,
        explanation: prompt.pronunciationGuide,
        hint: prompt.hint,
        teachingPoint: prompt.speakingTips,
        basePoints: 25 + (level.levelNumber * 5),
        timeLimit: 120,
        bonusPoints: 15,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate reading questions
  private generateReadingQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const readingPassages = this.getReadingPassages(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const passage = readingPassages[i % readingPassages.length];
      const questionData = passage.questions[i % passage.questions.length];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType: 'multiple_choice',
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'comprehension',
        question: `Read the passage:\n\n"${passage.text}"\n\n${questionData.question}`,
        options: questionData.options,
        correctAnswer: questionData.answer,
        alternativeAnswers: null,
        explanation: questionData.explanation,
        hint: 'Look for key words in the passage that relate to the question.',
        teachingPoint: passage.readingStrategy,
        basePoints: 30 + (level.levelNumber * 5),
        timeLimit: 180,
        bonusPoints: 15,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate writing questions
  private generateWritingQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const writingPrompts = this.getWritingPrompts(level.languageLevel, game.language);
    
    for (let i = 0; i < count; i++) {
      const prompt = writingPrompts[i % writingPrompts.length];
      
      questions.push({
        gameId: game.id,
        levelId: level.id,
        questionType: 'writing',
        difficulty: level.difficulty || 'medium',
        language: game.language,
        skillFocus: 'writing',
        question: prompt.task,
        questionImage: prompt.visualPrompt || null,
        options: null,
        correctAnswer: prompt.modelAnswer,
        alternativeAnswers: prompt.keyPoints,
        explanation: prompt.writingTips,
        hint: prompt.structureGuide,
        teachingPoint: prompt.grammarFocus,
        basePoints: 40 + (level.levelNumber * 7),
        timeLimit: 300,
        bonusPoints: 20,
        aiGenerated: false,
        isActive: true
      });
    }
    
    return questions;
  }

  // Generate mixed questions
  private generateMixedQuestions(game: Game, level: GameLevel, count: number): InsertGameQuestion[] {
    const questions: InsertGameQuestion[] = [];
    const typesPerCategory = Math.ceil(count / 6);
    
    questions.push(...this.generateVocabularyQuestions(game, level, typesPerCategory));
    questions.push(...this.generateGrammarQuestions(game, level, typesPerCategory));
    questions.push(...this.generateListeningQuestions(game, level, typesPerCategory));
    questions.push(...this.generateSpeakingQuestions(game, level, typesPerCategory));
    questions.push(...this.generateReadingQuestions(game, level, typesPerCategory));
    questions.push(...this.generateWritingQuestions(game, level, typesPerCategory));
    
    return questions.slice(0, count);
  }

  // Get vocabulary data based on level and language
  private getVocabularyData(level: string, language: string): any[] {
    const vocabularyDatabase = {
      'en': {
        'A1': [
          { word: 'hello', translation: 'سلام', hint: 'A greeting', context: 'Used when meeting someone', synonyms: ['hi', 'hey'] },
          { word: 'goodbye', translation: 'خداحافظ', hint: 'A farewell', context: 'Used when leaving', synonyms: ['bye', 'farewell'] },
          { word: 'please', translation: 'لطفا', hint: 'Polite request', context: 'Used when asking for something', usage: 'Please help me' },
          { word: 'thank you', translation: 'متشکرم', hint: 'Expression of gratitude', context: 'Used to show appreciation', synonyms: ['thanks'] },
          { word: 'water', translation: 'آب', hint: 'Essential liquid', context: 'Something you drink', usage: 'I need water' },
          { word: 'food', translation: 'غذا', hint: 'Something to eat', context: 'Needed for survival', usage: 'The food is delicious' },
          { word: 'house', translation: 'خانه', hint: 'Place to live', context: 'Where people live', synonyms: ['home'] },
          { word: 'family', translation: 'خانواده', hint: 'Related people', context: 'Parents and children', usage: 'My family is large' },
          { word: 'friend', translation: 'دوست', hint: 'Close companion', context: 'Someone you like', synonyms: ['buddy', 'pal'] },
          { word: 'school', translation: 'مدرسه', hint: 'Place of learning', context: 'Where students go', usage: 'I go to school' }
        ],
        'A2': [
          { word: 'adventure', translation: 'ماجراجویی', hint: 'Exciting experience', context: 'An exciting journey', usage: 'Life is an adventure' },
          { word: 'comfortable', translation: 'راحت', hint: 'Feeling at ease', context: 'Relaxed and cozy', synonyms: ['cozy', 'relaxed'] },
          { word: 'difficult', translation: 'سخت', hint: 'Not easy', context: 'Challenging task', synonyms: ['hard', 'challenging'] },
          { word: 'excellent', translation: 'عالی', hint: 'Very good', context: 'High quality', synonyms: ['outstanding', 'superb'] },
          { word: 'favorite', translation: 'مورد علاقه', hint: 'Most liked', context: 'Preferred choice', usage: 'My favorite color is blue' },
          { word: 'garden', translation: 'باغ', hint: 'Outdoor space', context: 'Place with plants', usage: 'The garden is beautiful' },
          { word: 'holiday', translation: 'تعطیلات', hint: 'Time off', context: 'Vacation period', synonyms: ['vacation'] },
          { word: 'important', translation: 'مهم', hint: 'Significant', context: 'Having value', synonyms: ['significant', 'crucial'] },
          { word: 'journey', translation: 'سفر', hint: 'Travel', context: 'Trip from one place to another', synonyms: ['trip', 'travel'] },
          { word: 'knowledge', translation: 'دانش', hint: 'Information', context: 'What you know', usage: 'Knowledge is power' }
        ],
        'B1': [
          { word: 'accomplish', translation: 'انجام دادن', hint: 'Complete successfully', context: 'Achieve a goal', synonyms: ['achieve', 'complete'] },
          { word: 'beneficial', translation: 'سودمند', hint: 'Helpful', context: 'Having positive effects', synonyms: ['advantageous', 'helpful'] },
          { word: 'consequence', translation: 'نتیجه', hint: 'Result', context: 'What happens as a result', synonyms: ['result', 'outcome'] },
          { word: 'determination', translation: 'عزم', hint: 'Strong will', context: 'Firm decision to succeed', usage: 'Success requires determination' },
          { word: 'efficient', translation: 'کارآمد', hint: 'Working well', context: 'Using resources wisely', synonyms: ['effective', 'productive'] },
          { word: 'fascinating', translation: 'جذاب', hint: 'Very interesting', context: 'Capturing attention', synonyms: ['captivating', 'intriguing'] },
          { word: 'gradually', translation: 'به تدریج', hint: 'Slowly', context: 'Little by little', synonyms: ['slowly', 'progressively'] },
          { word: 'hypothesis', translation: 'فرضیه', hint: 'Theory', context: 'Scientific assumption', usage: 'Test the hypothesis' },
          { word: 'influence', translation: 'تأثیر', hint: 'Effect on', context: 'Power to change', synonyms: ['impact', 'affect'] },
          { word: 'judgement', translation: 'قضاوت', hint: 'Opinion', context: 'Decision or conclusion', synonyms: ['decision', 'assessment'] }
        ],
        'B2': [
          { word: 'ambiguous', translation: 'مبهم', hint: 'Unclear', context: 'Having multiple meanings', synonyms: ['vague', 'unclear'] },
          { word: 'comprehensive', translation: 'جامع', hint: 'Complete', context: 'Including everything', synonyms: ['thorough', 'extensive'] },
          { word: 'deliberate', translation: 'عمدی', hint: 'Intentional', context: 'Done on purpose', synonyms: ['intentional', 'planned'] },
          { word: 'elaborate', translation: 'پیچیده', hint: 'Detailed', context: 'Complex and detailed', synonyms: ['complex', 'intricate'] },
          { word: 'fundamental', translation: 'اساسی', hint: 'Basic', context: 'Essential foundation', synonyms: ['essential', 'basic'] },
          { word: 'genuine', translation: 'اصیل', hint: 'Real', context: 'Authentic and sincere', synonyms: ['authentic', 'real'] },
          { word: 'hypothetical', translation: 'فرضی', hint: 'Theoretical', context: 'Based on assumption', usage: 'A hypothetical situation' },
          { word: 'implement', translation: 'اجرا کردن', hint: 'Put into action', context: 'Make something happen', synonyms: ['execute', 'carry out'] },
          { word: 'justify', translation: 'توجیه کردن', hint: 'Give reasons', context: 'Prove something is right', synonyms: ['validate', 'defend'] },
          { word: 'legitimate', translation: 'قانونی', hint: 'Legal', context: 'Allowed by law', synonyms: ['legal', 'valid'] }
        ]
      },
      'fa': {
        'A1': [
          { word: 'سلام', translation: 'hello', hint: 'احوالپرسی', context: 'هنگام دیدار', synonyms: ['درود'] },
          { word: 'خداحافظ', translation: 'goodbye', hint: 'وداع', context: 'هنگام رفتن', synonyms: ['بدرود'] },
          { word: 'لطفا', translation: 'please', hint: 'درخواست مودبانه', context: 'هنگام درخواست', usage: 'لطفا کمک کنید' },
          { word: 'متشکرم', translation: 'thank you', hint: 'قدردانی', context: 'نشان دادن سپاس', synonyms: ['ممنون', 'سپاسگزارم'] },
          { word: 'آب', translation: 'water', hint: 'مایع حیاتی', context: 'نوشیدنی', usage: 'آب می‌خواهم' },
          { word: 'غذا', translation: 'food', hint: 'خوردنی', context: 'برای زنده ماندن', usage: 'غذا خوشمزه است' },
          { word: 'خانه', translation: 'house', hint: 'محل زندگی', context: 'جایی که مردم زندگی می‌کنند', synonyms: ['منزل'] },
          { word: 'خانواده', translation: 'family', hint: 'اقوام', context: 'والدین و فرزندان', usage: 'خانواده من بزرگ است' },
          { word: 'دوست', translation: 'friend', hint: 'همراه', context: 'کسی که دوستش دارید', synonyms: ['رفیق', 'یار'] },
          { word: 'مدرسه', translation: 'school', hint: 'محل آموزش', context: 'جایی که دانش‌آموزان می‌روند', usage: 'به مدرسه می‌روم' }
        ]
      }
    };

    return vocabularyDatabase[language]?.[level] || vocabularyDatabase['en']['A1'];
  }

  // Get grammar rules based on level and language
  private getGrammarRules(level: string, language: string): any[] {
    const grammarDatabase = {
      'en': {
        'A1': [
          {
            ruleName: 'Present Simple',
            correctForm: 'I eat breakfast every day',
            incorrectForms: ['I eating breakfast every day', 'I eats breakfast every day'],
            explanation: 'Use present simple for regular actions',
            hint: 'For he/she/it, add -s to the verb',
            fullExplanation: 'Present simple is used for habits, facts, and regular actions',
            acceptableVariants: ['I have breakfast every day']
          },
          {
            ruleName: 'To Be',
            correctForm: 'She is a teacher',
            incorrectForms: ['She are a teacher', 'She be a teacher'],
            explanation: 'Conjugate "to be" correctly with the subject',
            hint: 'I am, you are, he/she/it is',
            fullExplanation: 'The verb "to be" changes based on the subject of the sentence'
          }
        ],
        'A2': [
          {
            ruleName: 'Past Simple',
            correctForm: 'I visited my grandmother yesterday',
            incorrectForms: ['I visit my grandmother yesterday', 'I was visiting my grandmother yesterday'],
            explanation: 'Use past simple for completed actions in the past',
            hint: 'Regular verbs add -ed, irregular verbs have special forms',
            fullExplanation: 'Past simple describes actions that started and finished in the past'
          },
          {
            ruleName: 'Present Continuous',
            correctForm: 'They are playing football now',
            incorrectForms: ['They playing football now', 'They play football now'],
            explanation: 'Use present continuous for actions happening now',
            hint: 'am/is/are + verb-ing',
            fullExplanation: 'Present continuous describes actions in progress at the moment'
          }
        ],
        'B1': [
          {
            ruleName: 'Present Perfect',
            correctForm: 'I have lived here for five years',
            incorrectForms: ['I lived here for five years', 'I am living here for five years'],
            explanation: 'Use present perfect for experiences or actions with present relevance',
            hint: 'have/has + past participle',
            fullExplanation: 'Present perfect connects past actions to the present moment'
          },
          {
            ruleName: 'First Conditional',
            correctForm: 'If it rains, I will stay home',
            incorrectForms: ['If it will rain, I stay home', 'If it rains, I stay home'],
            explanation: 'Use first conditional for real possibilities',
            hint: 'If + present simple, will + base verb',
            fullExplanation: 'First conditional expresses real or likely situations and their results'
          }
        ]
      }
    };

    return grammarDatabase[language]?.[level] || grammarDatabase['en']['A1'];
  }

  // Get listening content
  private getListeningContent(level: string, language: string): any[] {
    return [
      {
        audioUrl: '/audio/sample1.mp3',
        question: 'What is the speaker talking about?',
        options: [
          { id: 'a', text: 'The weather today' },
          { id: 'b', text: 'Their weekend plans' },
          { id: 'c', text: 'A shopping trip' },
          { id: 'd', text: 'A work meeting' }
        ],
        answer: 'b',
        transcript: 'The speaker is discussing their plans for the weekend, including a visit to the beach.',
        focusPoint: 'Listen for time markers and activity words'
      }
    ];
  }

  // Get speaking prompts
  private getSpeakingPrompts(level: string, language: string): any[] {
    return [
      {
        prompt: 'Describe your daily routine',
        expectedResponse: 'I wake up at 7 AM, have breakfast, go to work...',
        acceptableVariants: ['My day starts at...', 'Every morning I...'],
        pronunciationGuide: 'Focus on clear pronunciation of time expressions',
        hint: 'Use present simple tense',
        speakingTips: 'Organize your response chronologically',
        imageUrl: '/images/daily-routine.jpg'
      }
    ];
  }

  // Get reading passages
  private getReadingPassages(level: string, language: string): any[] {
    return [
      {
        text: 'The city park is a popular place for families. Every weekend, children play on the swings while parents sit on benches and chat. There is a small lake where ducks swim, and people often bring bread to feed them.',
        questions: [
          {
            question: 'What do parents do while children play?',
            options: [
              { id: 'a', text: 'Feed the ducks' },
              { id: 'b', text: 'Sit on benches and chat' },
              { id: 'c', text: 'Swim in the lake' },
              { id: 'd', text: 'Play on the swings' }
            ],
            answer: 'b',
            explanation: 'The text states that parents sit on benches and chat while children play.'
          }
        ],
        readingStrategy: 'Scan for specific information mentioned in the question'
      }
    ];
  }

  // Get writing prompts
  private getWritingPrompts(level: string, language: string): any[] {
    return [
      {
        task: 'Write a short email to a friend inviting them to your birthday party',
        modelAnswer: 'Dear [Friend], I hope you are well. I am writing to invite you to my birthday party next Saturday at 3 PM. We will have cake, games, and music. Please let me know if you can come. Best regards, [Your name]',
        keyPoints: ['Greeting', 'Purpose', 'Details', 'Request for response', 'Closing'],
        writingTips: 'Keep the tone friendly and include all necessary information',
        structureGuide: 'Start with greeting, state purpose, give details, end politely',
        grammarFocus: 'Future tense for plans, polite requests',
        visualPrompt: '/images/birthday-party.jpg'
      }
    ];
  }

  // Helper methods for generating questions
  private generateVocabularyQuestion(vocab: any, type: string): string {
    switch (type) {
      case 'multiple_choice':
        return `What does "${vocab.word}" mean?`;
      case 'fill_blank':
        return `Complete the sentence: I need a glass of _____ (${vocab.hint})`;
      case 'matching':
        return `Match the word "${vocab.word}" with its meaning`;
      default:
        return `Translate: ${vocab.word}`;
    }
  }

  private generateVocabularyOptions(vocab: any, type: string): any {
    if (type === 'multiple_choice') {
      return [
        { id: 'a', text: vocab.translation },
        { id: 'b', text: 'خطا' },
        { id: 'c', text: 'اشتباه' },
        { id: 'd', text: 'نادرست' }
      ];
    }
    return null;
  }

  private generateGrammarQuestion(rule: any, type: string): string {
    switch (type) {
      case 'multiple_choice':
        return `Choose the correct form: ${rule.incorrectForms[0].replace(rule.incorrectForms[0].split(' ')[2], '____')}`;
      case 'fill_blank':
        return `Fill in the blank: She ____ a teacher (${rule.hint})`;
      case 'ordering':
        return `Put the words in correct order: ${rule.correctForm.split(' ').sort(() => Math.random() - 0.5).join(' / ')}`;
      default:
        return `Correct this sentence: ${rule.incorrectForms[0]}`;
    }
  }

  private generateGrammarOptions(rule: any, type: string): any {
    if (type === 'multiple_choice') {
      const words = rule.correctForm.split(' ');
      return [
        { id: 'a', text: words[2] },
        { id: 'b', text: 'incorrect1' },
        { id: 'c', text: 'incorrect2' },
        { id: 'd', text: 'incorrect3' }
      ];
    }
    return null;
  }

  // Check answer and provide AI-enhanced feedback
  async checkAnswer(
    questionId: number,
    userAnswer: any,
    sessionId: number,
    userId: number
  ): Promise<{ isCorrect: boolean; feedback: string; points: number; aiResponse?: any }> {
    const [question] = await db.select().from(gameQuestions).where(eq(gameQuestions.id, questionId));
    
    if (!question) {
      throw new Error('Question not found');
    }

    const startTime = Date.now();
    let isCorrect = false;
    let points = 0;
    let feedback = '';

    // Check answer based on question type
    if (question.questionType === 'multiple_choice') {
      isCorrect = userAnswer === question.correctAnswer;
    } else if (question.questionType === 'fill_blank' || question.questionType === 'writing') {
      // For text answers, check exact match or alternatives
      isCorrect = userAnswer.toLowerCase() === question.correctAnswer.toLowerCase();
      if (!isCorrect && question.alternativeAnswers) {
        const alternatives = Array.isArray(question.alternativeAnswers) 
          ? question.alternativeAnswers 
          : [question.alternativeAnswers];
        isCorrect = alternatives.some((alt: string) => 
          userAnswer.toLowerCase() === alt.toLowerCase()
        );
      }
    } else if (question.questionType === 'matching' || question.questionType === 'ordering') {
      // For complex answer types
      isCorrect = JSON.stringify(userAnswer) === JSON.stringify(question.correctAnswer);
    }

    // Calculate points
    const responseTime = Date.now() - startTime;
    if (isCorrect) {
      points = question.basePoints;
      // Add bonus points for quick answers
      if (question.timeLimit && responseTime < question.timeLimit * 500) {
        points += question.bonusPoints || 0;
      }
      feedback = question.explanation || 'Correct! Well done!';
    } else {
      feedback = `Incorrect. ${question.hint || ''} The correct answer is: ${question.correctAnswer}. ${question.explanation || ''}`;
    }

    // Log the answer
    await db.insert(gameAnswerLogs).values({
      sessionId,
      questionId,
      userId,
      userAnswer,
      isCorrect,
      responseTime,
      pointsEarned: points,
      hintUsed: false,
      attemptsCount: 1,
      aiAssisted: false
    });

    // Update question statistics
    await this.updateQuestionStatistics(questionId, isCorrect, responseTime);

    return {
      isCorrect,
      feedback,
      points,
      aiResponse: question.teachingPoint ? {
        explanation: question.teachingPoint,
        relatedConcepts: this.getRelatedConcepts(question)
      } : undefined
    };
  }

  // Update question statistics
  private async updateQuestionStatistics(questionId: number, isCorrect: boolean, responseTime: number) {
    const [question] = await db.select().from(gameQuestions).where(eq(gameQuestions.id, questionId));
    
    if (question) {
      const timesUsed = (question.timesUsed || 0) + 1;
      const currentCorrectRate = question.correctRate ? parseFloat(question.correctRate) : 0;
      const newCorrectRate = ((currentCorrectRate * (timesUsed - 1)) + (isCorrect ? 100 : 0)) / timesUsed;
      
      const currentAvgTime = question.averageTime ? parseFloat(question.averageTime) : 0;
      const newAvgTime = ((currentAvgTime * (timesUsed - 1)) + responseTime / 1000) / timesUsed;
      
      await db.update(gameQuestions)
        .set({
          timesUsed,
          correctRate: newCorrectRate.toString(),
          averageTime: newAvgTime.toString(),
          updatedAt: new Date()
        })
        .where(eq(gameQuestions.id, questionId));
    }
  }

  // Get related concepts for AI teaching
  private getRelatedConcepts(question: GameQuestion): string[] {
    const concepts: string[] = [];
    
    if (question.skillFocus === 'vocabulary') {
      concepts.push('Word families', 'Synonyms and antonyms', 'Context clues');
    } else if (question.skillFocus === 'grammar') {
      concepts.push('Sentence structure', 'Tense usage', 'Subject-verb agreement');
    } else if (question.skillFocus === 'pronunciation') {
      concepts.push('Phonetics', 'Stress patterns', 'Intonation');
    }
    
    return concepts;
  }

  // Generate daily challenge based on user activity
  async generateDailyChallenge(): Promise<GameDailyChallenge> {
    const today = new Date().toISOString().split('T')[0];
    
    // Check if today's challenge already exists
    const [existing] = await db.select()
      .from(gameDailyChallenges)
      .where(eq(gameDailyChallenges.challengeDate, today));
    
    if (existing) {
      return existing;
    }

    // Analyze recent user activity to determine challenge type
    const recentActivity = await this.analyzeRecentActivity();
    const challengeType = this.determineChallengeType(recentActivity);
    
    // Get popular games for the challenge
    const [popularGame] = await db.select()
      .from(games)
      .where(eq(games.isActive, true))
      .orderBy(sql`${games.id} DESC`)
      .limit(1);

    if (!popularGame) {
      throw new Error('No active games found');
    }

    // Generate challenge based on type
    const challenge: InsertGameDailyChallenge = {
      challengeDate: today,
      challengeName: this.generateChallengeName(challengeType),
      description: this.generateChallengeDescription(challengeType),
      challengeType,
      targetGameId: popularGame.id,
      targetScore: this.calculateTargetScore(challengeType, recentActivity),
      targetTime: challengeType === 'time_based' ? 300 : null,
      targetAccuracy: challengeType === 'accuracy_based' ? '80' : null,
      targetStreak: challengeType === 'streak_based' ? 5 : null,
      difficulty: this.determineDifficulty(recentActivity),
      xpReward: 150,
      coinsReward: 75,
      featuredQuestions: await this.selectFeaturedQuestions(popularGame.id),
      bonusMultiplier: '2.0',
      isActive: true
    };

    const [created] = await db.insert(gameDailyChallenges).values(challenge).returning();
    return created;
  }

  // Analyze recent user activity
  private async analyzeRecentActivity(): Promise<any> {
    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    
    const recentSessions = await db.select({
      avgScore: sql<number>`AVG(${gameSessions.score})`,
      avgAccuracy: sql<number>`AVG(${gameSessions.accuracy})`,
      totalSessions: sql<number>`COUNT(*)`,
      avgDuration: sql<number>`AVG(${gameSessions.duration})`
    })
    .from(gameSessions)
    .where(gte(gameSessions.startedAt, oneDayAgo));
    
    return recentSessions[0] || {
      avgScore: 0,
      avgAccuracy: 0,
      totalSessions: 0,
      avgDuration: 0
    };
  }

  // Determine challenge type based on activity
  private determineChallengeType(activity: any): string {
    const types = ['score_based', 'time_based', 'accuracy_based', 'streak_based'];
    
    // Rotate challenge types based on day
    const dayIndex = new Date().getDay();
    
    // Adjust based on user performance
    if (activity.avgAccuracy < 70) {
      return 'accuracy_based';
    } else if (activity.avgDuration > 600) {
      return 'time_based';
    } else if (activity.totalSessions < 3) {
      return 'streak_based';
    }
    
    return types[dayIndex % types.length];
  }

  // Generate challenge name
  private generateChallengeName(type: string): string {
    const names = {
      'score_based': 'Score Master Challenge',
      'time_based': 'Speed Demon Challenge',
      'accuracy_based': 'Precision Expert Challenge',
      'streak_based': 'Streak Builder Challenge'
    };
    return names[type] || 'Daily Challenge';
  }

  // Generate challenge description
  private generateChallengeDescription(type: string): string {
    const descriptions = {
      'score_based': 'Achieve the target score to complete this challenge!',
      'time_based': 'Complete the game within the time limit!',
      'accuracy_based': 'Maintain high accuracy throughout the game!',
      'streak_based': 'Build a winning streak to claim your reward!'
    };
    return descriptions[type] || 'Complete today\'s special challenge!';
  }

  // Calculate target score
  private calculateTargetScore(type: string, activity: any): number | null {
    if (type !== 'score_based') return null;
    
    // Set target 20% higher than average
    const baseScore = activity.avgScore || 100;
    return Math.round(baseScore * 1.2);
  }

  // Determine difficulty
  private determineDifficulty(activity: any): string {
    if (activity.avgAccuracy > 85 && activity.avgScore > 150) {
      return 'hard';
    } else if (activity.avgAccuracy > 70 && activity.avgScore > 100) {
      return 'medium';
    }
    return 'easy';
  }

  // Select featured questions for the challenge
  private async selectFeaturedQuestions(gameId: number): Promise<number[]> {
    const questions = await db.select({ id: gameQuestions.id })
      .from(gameQuestions)
      .where(and(
        eq(gameQuestions.gameId, gameId),
        eq(gameQuestions.isActive, true)
      ))
      .orderBy(sql`RANDOM()`)
      .limit(10);
    
    return questions.map(q => q.id);
  }

  // Update leaderboard with real calculations
  async updateLeaderboard(
    userId: number,
    gameId: number,
    score: number,
    sessionId: number
  ): Promise<void> {
    const now = new Date();
    const period = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
    const week = `${now.getFullYear()}-W${Math.ceil(now.getDate() / 7).toString().padStart(2, '0')}`;
    
    // Update or create leaderboard entries
    const leaderboardTypes = [
      { type: 'daily', period: now.toISOString().split('T')[0] },
      { type: 'weekly', period: week },
      { type: 'monthly', period },
      { type: 'all_time', period: null }
    ];
    
    for (const { type, period: p } of leaderboardTypes) {
      const existing = await db.select()
        .from(gameLeaderboards)
        .where(and(
          eq(gameLeaderboards.userId, userId),
          eq(gameLeaderboards.gameId, gameId),
          eq(gameLeaderboards.leaderboardType, type),
          p ? eq(gameLeaderboards.period, p) : sql`${gameLeaderboards.period} IS NULL`
        ))
        .limit(1);
      
      if (existing[0]) {
        // Update existing entry
        await db.update(gameLeaderboards)
          .set({
            score: sql`${gameLeaderboards.score} + ${score}`,
            gamesPlayed: sql`${gameLeaderboards.gamesPlayed} + 1`,
            perfectGames: score > 90 ? sql`${gameLeaderboards.perfectGames} + 1` : gameLeaderboards.perfectGames
          })
          .where(eq(gameLeaderboards.id, existing[0].id));
      } else {
        // Create new entry
        await db.insert(gameLeaderboards).values({
          userId,
          gameId,
          leaderboardType: type,
          period: p,
          score,
          gamesPlayed: 1,
          perfectGames: score > 90 ? 1 : 0
        });
      }
    }
    
    // Calculate ranks
    await this.calculateLeaderboardRanks(gameId);
  }

  // Calculate leaderboard ranks
  private async calculateLeaderboardRanks(gameId: number): Promise<void> {
    const leaderboardTypes = ['daily', 'weekly', 'monthly', 'all_time'];
    
    for (const type of leaderboardTypes) {
      const entries = await db.select()
        .from(gameLeaderboards)
        .where(and(
          eq(gameLeaderboards.gameId, gameId),
          eq(gameLeaderboards.leaderboardType, type)
        ))
        .orderBy(desc(gameLeaderboards.score));
      
      // Update ranks
      for (let i = 0; i < entries.length; i++) {
        await db.update(gameLeaderboards)
          .set({ rank: i + 1 })
          .where(eq(gameLeaderboards.id, entries[i].id));
      }
    }
  }

  // Get comprehensive leaderboard data
  async getLeaderboard(
    gameId?: number,
    type: string = 'all_time',
    limit: number = 100
  ): Promise<any[]> {
    const query = db.select({
      rank: gameLeaderboards.rank,
      userId: gameLeaderboards.userId,
      username: users.firstName,
      avatar: users.avatar,
      score: gameLeaderboards.score,
      gamesPlayed: gameLeaderboards.gamesPlayed,
      perfectGames: gameLeaderboards.perfectGames
    })
    .from(gameLeaderboards)
    .leftJoin(users, eq(gameLeaderboards.userId, users.id))
    .where(and(
      gameId ? eq(gameLeaderboards.gameId, gameId) : undefined,
      eq(gameLeaderboards.leaderboardType, type)
    ))
    .orderBy(gameLeaderboards.rank)
    .limit(limit);
    
    return await query;
  }
}

export const gameService = new GameService();