// server/services/quiz-generation-service.ts
import { ollamaService } from '../ollama-service';
import type { DatabaseStorage } from '../database-storage';
import { randomUUID } from 'crypto';

export enum QuestionType {
  MULTIPLE_CHOICE = 'multiple_choice',
  TRUE_FALSE = 'true_false',
  FILL_BLANK = 'fill_blank',
  SHORT_ANSWER = 'short_answer',
  MATCHING = 'matching',
  ORDERING = 'ordering'
}

export enum DifficultyLevel {
  EASY = 'easy',
  MEDIUM = 'medium',
  HARD = 'hard'
}

export interface QuizQuestion {
  id: string;
  type: QuestionType;
  difficulty: DifficultyLevel;
  question: string;
  options?: string[];
  correctAnswer: string | string[];
  explanation?: string;
  points: number;
  tags: string[];
  cefrLevel?: string;
}

export interface GeneratedQuiz {
  id: string;
  sessionId: string;
  title: string;
  description: string;
  questions: QuizQuestion[];
  totalPoints: number;
  estimatedTime: number; // in minutes
  targetLevel: string;
  topics: string[];
  generatedAt: Date;
}

export interface SessionContent {
  sessionId: string;
  vocabulary: string[];
  topics: string[];
  grammarPoints: string[];
  speakingPhrases: string[];
  corrections: string[];
  studentLevel: string;
  duration: number;
}

export interface QuizResult {
  id: string;
  quizId: string;
  studentId: number;
  answers: {
    questionId: string;
    answer: string | string[];
    isCorrect: boolean;
    timeSpent: number;
  }[];
  score: number;
  totalPoints: number;
  completedAt: Date;
}

export class QuizGenerationService {
  constructor(private storage: DatabaseStorage) {}

  /**
   * Generate a quiz based on session content
   */
  async generateQuizFromSession(content: SessionContent): Promise<GeneratedQuiz> {
    const quizId = randomUUID();
    const questions: QuizQuestion[] = [];

    // Generate vocabulary questions
    if (content.vocabulary.length > 0) {
      const vocabQuestions = await this.generateVocabularyQuestions(
        content.vocabulary,
        content.studentLevel
      );
      questions.push(...vocabQuestions);
    }

    // Generate grammar questions
    if (content.grammarPoints.length > 0) {
      const grammarQuestions = await this.generateGrammarQuestions(
        content.grammarPoints,
        content.studentLevel
      );
      questions.push(...grammarQuestions);
    }

    // Generate comprehension questions based on topics
    if (content.topics.length > 0) {
      const comprehensionQuestions = await this.generateComprehensionQuestions(
        content.topics,
        content.studentLevel
      );
      questions.push(...comprehensionQuestions);
    }

    // Generate correction-based questions
    if (content.corrections.length > 0) {
      const correctionQuestions = await this.generateCorrectionQuestions(
        content.corrections,
        content.studentLevel
      );
      questions.push(...correctionQuestions);
    }

    // Calculate total points and estimated time
    const totalPoints = questions.reduce((sum, q) => sum + q.points, 0);
    const estimatedTime = Math.ceil(questions.length * 1.5); // 1.5 minutes per question

    const quiz: GeneratedQuiz = {
      id: quizId,
      sessionId: content.sessionId,
      title: `Session Review Quiz - ${new Date().toLocaleDateString()}`,
      description: `Practice quiz based on your recent session covering ${content.topics.join(', ')}`,
      questions,
      totalPoints,
      estimatedTime,
      targetLevel: content.studentLevel,
      topics: content.topics,
      generatedAt: new Date()
    };

    // Save quiz to database
    await this.saveQuiz(quiz);

    return quiz;
  }

  /**
   * Generate vocabulary-based questions
   */
  private async generateVocabularyQuestions(
    vocabulary: string[],
    level: string
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];
    const selectedWords = this.selectRandomItems(vocabulary, Math.min(5, vocabulary.length));

    for (const word of selectedWords) {
      // Generate different types of vocabulary questions
      const questionTypes = [
        this.createDefinitionQuestion,
        this.createSynonymQuestion,
        this.createContextQuestion,
        this.createSpellingQuestion
      ];

      const randomType = questionTypes[Math.floor(Math.random() * questionTypes.length)];
      const question = await randomType.call(this, word, level);
      questions.push(question);
    }

    return questions;
  }

  /**
   * Create a definition-based multiple choice question
   */
  private async createDefinitionQuestion(word: string, level: string): Promise<QuizQuestion> {
    const prompt = `Generate a multiple choice question for the word "${word}" at ${level} level.
    Return a JSON object with:
    - question: asking for the definition
    - options: 4 possible definitions (one correct)
    - correctAnswer: the correct option
    - explanation: why this is correct`;

    const response = await ollamaService.generateText(prompt);
    const parsed = JSON.parse(response);

    return {
      id: randomUUID(),
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: this.mapLevelToDifficulty(level),
      question: parsed.question || `What is the meaning of "${word}"?`,
      options: parsed.options || [
        `Definition 1 for ${word}`,
        `Definition 2 for ${word}`,
        `Definition 3 for ${word}`,
        `Definition 4 for ${word}`
      ],
      correctAnswer: parsed.correctAnswer || parsed.options?.[0] || `Definition 1 for ${word}`,
      explanation: parsed.explanation || `This is the correct definition of ${word}`,
      points: 10,
      tags: ['vocabulary', word.toLowerCase()],
      cefrLevel: level
    };
  }

  /**
   * Create a synonym question
   */
  private async createSynonymQuestion(word: string, level: string): Promise<QuizQuestion> {
    const prompt = `Generate a synonym question for the word "${word}" at ${level} level.
    Return a JSON object with:
    - question: asking for a synonym
    - options: 4 words (one is a synonym)
    - correctAnswer: the synonym
    - explanation: why they are synonyms`;

    const response = await ollamaService.generateText(prompt);
    const parsed = JSON.parse(response);

    return {
      id: randomUUID(),
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: this.mapLevelToDifficulty(level),
      question: parsed.question || `Which word is a synonym of "${word}"?`,
      options: parsed.options || ['similar1', 'similar2', 'similar3', 'similar4'],
      correctAnswer: parsed.correctAnswer || 'similar1',
      explanation: parsed.explanation || 'These words have similar meanings',
      points: 10,
      tags: ['vocabulary', 'synonyms', word.toLowerCase()],
      cefrLevel: level
    };
  }

  /**
   * Create a context-based fill-in-the-blank question
   */
  private async createContextQuestion(word: string, level: string): Promise<QuizQuestion> {
    const prompt = `Create a fill-in-the-blank sentence using the word "${word}" at ${level} level.
    Return a JSON object with:
    - question: a sentence with a blank where the word fits
    - correctAnswer: the word that fills the blank
    - explanation: why this word fits the context`;

    const response = await ollamaService.generateText(prompt);
    const parsed = JSON.parse(response);

    return {
      id: randomUUID(),
      type: QuestionType.FILL_BLANK,
      difficulty: this.mapLevelToDifficulty(level),
      question: parsed.question || `The student _____ to school every day. (${word})`,
      correctAnswer: parsed.correctAnswer || word,
      explanation: parsed.explanation || `${word} fits this context`,
      points: 15,
      tags: ['vocabulary', 'context', word.toLowerCase()],
      cefrLevel: level
    };
  }

  /**
   * Create a spelling question
   */
  private async createSpellingQuestion(word: string, level: string): Promise<QuizQuestion> {
    // Create common misspellings
    const misspellings = this.generateMisspellings(word);
    
    return {
      id: randomUUID(),
      type: QuestionType.MULTIPLE_CHOICE,
      difficulty: DifficultyLevel.EASY,
      question: `Which is the correct spelling?`,
      options: this.shuffleArray([word, ...misspellings]),
      correctAnswer: word,
      explanation: `The correct spelling is "${word}"`,
      points: 5,
      tags: ['vocabulary', 'spelling', word.toLowerCase()],
      cefrLevel: level
    };
  }

  /**
   * Generate grammar-based questions
   */
  private async generateGrammarQuestions(
    grammarPoints: string[],
    level: string
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];

    for (const point of grammarPoints.slice(0, 3)) {
      const prompt = `Create a grammar question about "${point}" at ${level} level.
      Return a JSON object with:
      - type: "multiple_choice" or "fill_blank"
      - question: the grammar question
      - options: if multiple choice, 4 options
      - correctAnswer: the correct answer
      - explanation: grammar rule explanation`;

      const response = await ollamaService.generateText(prompt);
      const parsed = JSON.parse(response);

      questions.push({
        id: randomUUID(),
        type: parsed.type === 'fill_blank' ? QuestionType.FILL_BLANK : QuestionType.MULTIPLE_CHOICE,
        difficulty: this.mapLevelToDifficulty(level),
        question: parsed.question || `Question about ${point}`,
        options: parsed.options,
        correctAnswer: parsed.correctAnswer || 'Answer',
        explanation: parsed.explanation || `This relates to ${point}`,
        points: 15,
        tags: ['grammar', point.toLowerCase()],
        cefrLevel: level
      });
    }

    return questions;
  }

  /**
   * Generate comprehension questions
   */
  private async generateComprehensionQuestions(
    topics: string[],
    level: string
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];
    const topic = topics[0]; // Focus on main topic

    // True/False question
    const tfPrompt = `Create a true/false statement about "${topic}" at ${level} level.
    Return JSON with:
    - statement: a factual statement
    - correctAnswer: "true" or "false"
    - explanation: why it's true or false`;

    const tfResponse = await ollamaService.generateText(tfPrompt);
    const tfParsed = JSON.parse(tfResponse);

    questions.push({
      id: randomUUID(),
      type: QuestionType.TRUE_FALSE,
      difficulty: DifficultyLevel.EASY,
      question: tfParsed.statement || `Statement about ${topic}`,
      correctAnswer: tfParsed.correctAnswer || 'true',
      explanation: tfParsed.explanation || 'Explanation',
      points: 10,
      tags: ['comprehension', topic.toLowerCase()],
      cefrLevel: level
    });

    // Short answer question
    const saPrompt = `Create a short answer question about "${topic}" at ${level} level.
    Return JSON with:
    - question: an open-ended question
    - correctAnswer: acceptable answer
    - explanation: what makes a good answer`;

    const saResponse = await ollamaService.generateText(saPrompt);
    const saParsed = JSON.parse(saResponse);

    questions.push({
      id: randomUUID(),
      type: QuestionType.SHORT_ANSWER,
      difficulty: DifficultyLevel.MEDIUM,
      question: saParsed.question || `Describe ${topic}`,
      correctAnswer: saParsed.correctAnswer || 'Sample answer',
      explanation: saParsed.explanation || 'A good answer should...',
      points: 20,
      tags: ['comprehension', 'writing', topic.toLowerCase()],
      cefrLevel: level
    });

    return questions;
  }

  /**
   * Generate questions based on corrections
   */
  private async generateCorrectionQuestions(
    corrections: string[],
    level: string
  ): Promise<QuizQuestion[]> {
    const questions: QuizQuestion[] = [];

    for (const correction of corrections.slice(0, 2)) {
      questions.push({
        id: randomUUID(),
        type: QuestionType.MULTIPLE_CHOICE,
        difficulty: DifficultyLevel.MEDIUM,
        question: `Which is the correct form?`,
        options: this.generateCorrectionOptions(correction),
        correctAnswer: this.extractCorrectForm(correction),
        explanation: `This is the grammatically correct form`,
        points: 10,
        tags: ['corrections', 'grammar'],
        cefrLevel: level
      });
    }

    return questions;
  }

  /**
   * Save quiz to database
   */
  private async saveQuiz(quiz: GeneratedQuiz): Promise<void> {
    // Store quiz in database
    const quizData = {
      id: quiz.id,
      sessionId: quiz.sessionId,
      title: quiz.title,
      description: quiz.description,
      questions: JSON.stringify(quiz.questions),
      totalPoints: quiz.totalPoints,
      estimatedTime: quiz.estimatedTime,
      targetLevel: quiz.targetLevel,
      topics: JSON.stringify(quiz.topics),
      generatedAt: quiz.generatedAt
    };

    // Save to database (implement storage method)
    await this.storage.saveQuiz(quizData);
  }

  /**
   * Submit quiz answers and calculate results
   */
  async submitQuizAnswers(
    quizId: string,
    studentId: number,
    answers: { questionId: string; answer: string | string[]; timeSpent: number }[]
  ): Promise<QuizResult> {
    // Get quiz from database
    const quiz = await this.storage.getQuiz(quizId);
    if (!quiz) {
      throw new Error('Quiz not found');
    }

    const questions = JSON.parse(quiz.questions) as QuizQuestion[];
    let score = 0;
    const processedAnswers = [];

    // Check each answer
    for (const answer of answers) {
      const question = questions.find(q => q.id === answer.questionId);
      if (!question) continue;

      const isCorrect = this.checkAnswer(question, answer.answer);
      if (isCorrect) {
        score += question.points;
      }

      processedAnswers.push({
        questionId: answer.questionId,
        answer: answer.answer,
        isCorrect,
        timeSpent: answer.timeSpent
      });
    }

    const result: QuizResult = {
      id: randomUUID(),
      quizId,
      studentId,
      answers: processedAnswers,
      score,
      totalPoints: quiz.totalPoints,
      completedAt: new Date()
    };

    // Save result to database
    await this.storage.saveQuizResult(result);

    // Update student progress
    await this.updateStudentProgress(studentId, score, quiz.targetLevel);

    return result;
  }

  /**
   * Check if answer is correct
   */
  private checkAnswer(question: QuizQuestion, answer: string | string[]): boolean {
    if (Array.isArray(question.correctAnswer) && Array.isArray(answer)) {
      return JSON.stringify(question.correctAnswer.sort()) === JSON.stringify(answer.sort());
    }

    if (question.type === QuestionType.SHORT_ANSWER) {
      // For short answers, check if key concepts are present
      const correctLower = String(question.correctAnswer).toLowerCase();
      const answerLower = String(answer).toLowerCase();
      return answerLower.includes(correctLower) || correctLower.includes(answerLower);
    }

    return String(question.correctAnswer).toLowerCase() === String(answer).toLowerCase();
  }

  /**
   * Update student progress based on quiz results
   */
  private async updateStudentProgress(studentId: number, score: number, level: string): Promise<void> {
    // Add XP based on score
    const xpGained = Math.floor(score * 2);
    await this.storage.addStudentXP(studentId, xpGained);

    // Track quiz completion
    await this.storage.trackActivity({
      userId: studentId,
      activityType: 'quiz_completed',
      details: { score, level, xpGained },
      timestamp: new Date()
    });
  }

  /**
   * Get quiz history for student
   */
  async getStudentQuizHistory(studentId: number): Promise<QuizResult[]> {
    return this.storage.getQuizResultsByStudent(studentId);
  }

  /**
   * Get quiz analytics for teacher
   */
  async getQuizAnalytics(quizId: string): Promise<{
    totalAttempts: number;
    averageScore: number;
    questionStats: { questionId: string; correctRate: number }[];
  }> {
    const results = await this.storage.getQuizResults(quizId);
    
    if (results.length === 0) {
      return {
        totalAttempts: 0,
        averageScore: 0,
        questionStats: []
      };
    }

    const averageScore = results.reduce((sum, r) => sum + r.score, 0) / results.length;
    
    // Calculate per-question statistics
    const questionStats = new Map<string, { correct: number; total: number }>();
    
    for (const result of results) {
      for (const answer of result.answers) {
        if (!questionStats.has(answer.questionId)) {
          questionStats.set(answer.questionId, { correct: 0, total: 0 });
        }
        const stats = questionStats.get(answer.questionId)!;
        stats.total++;
        if (answer.isCorrect) stats.correct++;
      }
    }

    return {
      totalAttempts: results.length,
      averageScore,
      questionStats: Array.from(questionStats.entries()).map(([questionId, stats]) => ({
        questionId,
        correctRate: stats.total > 0 ? (stats.correct / stats.total) * 100 : 0
      }))
    };
  }

  // Helper methods

  private mapLevelToDifficulty(level: string): DifficultyLevel {
    if (level.includes('A1') || level.includes('A2')) return DifficultyLevel.EASY;
    if (level.includes('B1') || level.includes('B2')) return DifficultyLevel.MEDIUM;
    return DifficultyLevel.HARD;
  }

  private selectRandomItems<T>(items: T[], count: number): T[] {
    const shuffled = [...items].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, count);
  }

  private shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  private generateMisspellings(word: string): string[] {
    const misspellings = [];
    
    // Double a letter
    if (word.length > 3) {
      const pos = Math.floor(Math.random() * (word.length - 1));
      misspellings.push(word.slice(0, pos) + word[pos] + word.slice(pos));
    }

    // Remove a letter
    if (word.length > 4) {
      const pos = Math.floor(Math.random() * word.length);
      misspellings.push(word.slice(0, pos) + word.slice(pos + 1));
    }

    // Swap two adjacent letters
    if (word.length > 2) {
      const pos = Math.floor(Math.random() * (word.length - 1));
      const chars = word.split('');
      [chars[pos], chars[pos + 1]] = [chars[pos + 1], chars[pos]];
      misspellings.push(chars.join(''));
    }

    return misspellings.slice(0, 3);
  }

  private generateCorrectionOptions(correction: string): string[] {
    // Generate variations of the correction
    const options = [this.extractCorrectForm(correction)];
    
    // Add common mistakes
    options.push(
      correction.replace(/ed$/, 'ing'),
      correction.replace(/s$/, ''),
      correction + 's'
    );

    return this.shuffleArray(options).slice(0, 4);
  }

  private extractCorrectForm(correction: string): string {
    // Extract the correct form from a correction string
    // This is a simplified version - in production, parse more carefully
    return correction.split('->')[1]?.trim() || correction;
  }
}