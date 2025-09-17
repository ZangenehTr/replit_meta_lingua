import { ollamaService } from '../ollama-service.js';
import type { DatabaseStorage } from '../database-storage';

export interface LessonKit {
  id: string;
  sessionId: number;
  teacherId: number;
  studentId: number;
  topic: string;
  level: string;
  objectives: string[];
  vocabulary: VocabularyItem[];
  exercises: Exercise[];
  speakingPrompts: string[];
  homework: HomeworkItem[];
  assessmentQuestions: AssessmentQuestion[];
  culturalNotes: string[];
  generatedAt: Date;
}

interface VocabularyItem {
  word: string;
  pronunciation: string;
  definition: string;
  example: string;
  difficulty: 'basic' | 'intermediate' | 'advanced';
}

interface Exercise {
  type: 'grammar' | 'listening' | 'reading' | 'writing';
  title: string;
  instructions: string;
  content: string;
  answers?: string[];
  duration: number; // in minutes
}

interface HomeworkItem {
  title: string;
  description: string;
  estimatedTime: number; // in minutes
  resources: string[];
}

interface AssessmentQuestion {
  question: string;
  type: 'multiple_choice' | 'fill_blank' | 'short_answer' | 'speaking';
  options?: string[];
  correctAnswer?: string;
  points: number;
}

export class LessonKitGenerator {
  constructor(private storage: DatabaseStorage) {}

  async generateLessonKit(params: {
    sessionId: number;
    teacherId: number;
    studentId: number;
    topic: string;
    level: string;
    duration: number;
    previousTopics?: string[];
    studentWeaknesses?: string[];
  }): Promise<LessonKit> {
    try {
      // Get student profile and learning history
      const studentProfile = await this.storage.getUserById(params.studentId);
      const studentProgress = await this.getStudentProgress(params.studentId);
      
      // Generate lesson content using Ollama AI
      const prompt = this.buildLessonPrompt(params, studentProgress);
      const aiResponse = await ollamaService.generateStructuredContent(prompt, {
        temperature: 0.7,
        maxTokens: 2000
      });

      // Parse and structure the lesson kit
      const lessonKit: LessonKit = {
        id: `kit_${Date.now()}_${params.sessionId}`,
        sessionId: params.sessionId,
        teacherId: params.teacherId,
        studentId: params.studentId,
        topic: params.topic,
        level: params.level,
        objectives: this.extractObjectives(aiResponse),
        vocabulary: this.generateVocabulary(params.topic, params.level),
        exercises: this.generateExercises(params.topic, params.level, params.duration),
        speakingPrompts: this.generateSpeakingPrompts(params.topic, params.level),
        homework: this.generateHomework(params.topic, params.level),
        assessmentQuestions: this.generateAssessmentQuestions(params.topic, params.level),
        culturalNotes: this.generateCulturalNotes(params.topic),
        generatedAt: new Date()
      };

      // Store the lesson kit
      await this.saveLessonKit(lessonKit);
      
      return lessonKit;
    } catch (error) {
      console.error('Error generating lesson kit:', error);
      // Return a basic lesson kit if AI generation fails
      return this.generateFallbackLessonKit(params);
    }
  }

  private buildLessonPrompt(params: any, studentProgress: any): string {
    return `Generate a comprehensive lesson kit for:
      Topic: ${params.topic}
      Level: ${params.level}
      Duration: ${params.duration} minutes
      Student weaknesses: ${params.studentWeaknesses?.join(', ') || 'General improvement'}
      Previous topics: ${params.previousTopics?.join(', ') || 'None'}
      
      Please provide:
      1. Learning objectives (3-5 clear objectives)
      2. Key vocabulary (10-15 words with definitions and examples)
      3. Interactive exercises (3-4 varied activities)
      4. Speaking discussion prompts (5-6 questions)
      5. Homework assignments (2-3 tasks)
      6. Assessment questions (5-10 questions)
      7. Cultural context notes if applicable
      
      Format the response as structured JSON.`;
  }

  private extractObjectives(aiResponse: string): string[] {
    try {
      const parsed = JSON.parse(aiResponse);
      return parsed.objectives || this.getDefaultObjectives();
    } catch {
      return this.getDefaultObjectives();
    }
  }

  private getDefaultObjectives(): string[] {
    return [
      'Master key vocabulary related to the topic',
      'Practice speaking with proper pronunciation and fluency',
      'Understand and apply relevant grammar structures',
      'Develop confidence in real-world communication',
      'Complete interactive exercises for reinforcement'
    ];
  }

  private generateVocabulary(topic: string, level: string): VocabularyItem[] {
    // Generate vocabulary based on topic and level
    const vocabularyBank: Record<string, VocabularyItem[]> = {
      'basic': [
        { word: 'hello', pronunciation: '/həˈloʊ/', definition: 'A greeting', example: 'Hello, how are you?', difficulty: 'basic' },
        { word: 'goodbye', pronunciation: '/ɡʊdˈbaɪ/', definition: 'A farewell', example: 'Goodbye, see you tomorrow!', difficulty: 'basic' },
      ],
      'intermediate': [
        { word: 'conversation', pronunciation: '/ˌkɑːnvərˈseɪʃn/', definition: 'An informal talk', example: 'We had a long conversation about books.', difficulty: 'intermediate' },
        { word: 'opportunity', pronunciation: '/ˌɑːpərˈtuːnəti/', definition: 'A favorable chance', example: 'This job is a great opportunity.', difficulty: 'intermediate' },
      ],
      'advanced': [
        { word: 'ubiquitous', pronunciation: '/juːˈbɪkwɪtəs/', definition: 'Present everywhere', example: 'Smartphones have become ubiquitous in modern society.', difficulty: 'advanced' },
        { word: 'paradigm', pronunciation: '/ˈpærədaɪm/', definition: 'A typical pattern or model', example: 'The internet created a new paradigm for communication.', difficulty: 'advanced' },
      ]
    };

    const levelVocab = vocabularyBank[level.toLowerCase()] || vocabularyBank['intermediate'];
    return levelVocab.slice(0, 10);
  }

  private generateExercises(topic: string, level: string, duration: number): Exercise[] {
    const exerciseCount = Math.min(4, Math.floor(duration / 10));
    const exercises: Exercise[] = [];

    const exerciseTypes: Array<Exercise['type']> = ['grammar', 'reading', 'listening', 'writing'];
    
    for (let i = 0; i < exerciseCount; i++) {
      exercises.push({
        type: exerciseTypes[i % exerciseTypes.length],
        title: `${topic} - ${exerciseTypes[i % exerciseTypes.length]} Exercise`,
        instructions: `Complete the following ${exerciseTypes[i % exerciseTypes.length]} exercise related to ${topic}`,
        content: this.generateExerciseContent(exerciseTypes[i % exerciseTypes.length], topic, level),
        duration: 10
      });
    }

    return exercises;
  }

  private generateExerciseContent(type: string, topic: string, level: string): string {
    const templates: Record<string, string> = {
      grammar: `Fill in the blanks with the correct form:\n1. Yesterday, I ___ (go) to the ${topic}.\n2. She ___ (be) interested in ${topic}.\n3. They ___ (study) ${topic} for years.`,
      reading: `Read the following passage about ${topic} and answer the questions:\n\n[Short passage about ${topic}]\n\nQuestions:\n1. What is the main idea?\n2. List three key points.\n3. What is your opinion?`,
      listening: `Listen to the audio about ${topic} and complete the tasks:\n1. Note down 5 key words you hear\n2. Summarize the main points\n3. Answer comprehension questions`,
      writing: `Write a short paragraph (${level === 'basic' ? '50-75' : level === 'intermediate' ? '100-150' : '200-250'} words) about:\n"${topic} in your daily life"`
    };

    return templates[type] || `Practice exercise for ${topic}`;
  }

  private generateSpeakingPrompts(topic: string, level: string): string[] {
    const prompts = [
      `Describe your experience with ${topic}`,
      `What are the advantages and disadvantages of ${topic}?`,
      `How has ${topic} changed over the years?`,
      `Share a personal story related to ${topic}`,
      `What would you change about ${topic}?`,
      `Compare ${topic} in different cultures`
    ];

    return prompts.slice(0, level === 'basic' ? 3 : level === 'intermediate' ? 4 : 6);
  }

  private generateHomework(topic: string, level: string): HomeworkItem[] {
    return [
      {
        title: 'Vocabulary Practice',
        description: `Review and practice the new vocabulary from today's lesson on ${topic}. Create sentences using each word.`,
        estimatedTime: 20,
        resources: ['Vocabulary list', 'Online dictionary']
      },
      {
        title: 'Speaking Recording',
        description: `Record yourself speaking about ${topic} for 2-3 minutes. Focus on pronunciation and fluency.`,
        estimatedTime: 15,
        resources: ['Speaking prompts', 'Recording app']
      },
      {
        title: 'Writing Assignment',
        description: `Write a short essay about ${topic} (${level === 'basic' ? '100' : level === 'intermediate' ? '200' : '300'} words)`,
        estimatedTime: 30,
        resources: ['Essay template', 'Grammar guide']
      }
    ];
  }

  private generateAssessmentQuestions(topic: string, level: string): AssessmentQuestion[] {
    return [
      {
        question: `What is the meaning of the word related to ${topic}?`,
        type: 'multiple_choice',
        options: ['Option A', 'Option B', 'Option C', 'Option D'],
        correctAnswer: 'Option A',
        points: 10
      },
      {
        question: `Complete the sentence: The ${topic} is ___.`,
        type: 'fill_blank',
        correctAnswer: 'important',
        points: 10
      },
      {
        question: `Describe ${topic} in your own words.`,
        type: 'short_answer',
        points: 20
      },
      {
        question: `Have a 2-minute conversation about ${topic}`,
        type: 'speaking',
        points: 30
      }
    ];
  }

  private generateCulturalNotes(topic: string): string[] {
    return [
      `Cultural perspective on ${topic} varies across regions`,
      `Consider local customs when discussing ${topic}`,
      `Be aware of sensitive aspects related to ${topic}`
    ];
  }

  private async getStudentProgress(studentId: number): Promise<any> {
    try {
      const sessions = await this.storage.getSessionsByStudent(studentId);
      const tests = await this.storage.getUserQuizResults(studentId);
      
      return {
        totalSessions: sessions.length,
        completedTopics: sessions.map(s => s.topic || '').filter(Boolean),
        averageScore: tests.reduce((acc, t) => acc + (t.score || 0), 0) / Math.max(tests.length, 1),
        weakAreas: this.identifyWeakAreas(tests)
      };
    } catch (error) {
      console.error('Error getting student progress:', error);
      return { totalSessions: 0, completedTopics: [], averageScore: 0, weakAreas: [] };
    }
  }

  private identifyWeakAreas(tests: any[]): string[] {
    const weakAreas: string[] = [];
    // Analyze test results to identify weak areas
    tests.forEach(test => {
      if (test.score < 60) {
        weakAreas.push(test.category || 'General');
      }
    });
    return [...new Set(weakAreas)];
  }

  private async saveLessonKit(lessonKit: LessonKit): Promise<void> {
    try {
      // Store in database or file system
      const kitData = {
        id: lessonKit.id,
        sessionId: lessonKit.sessionId,
        teacherId: lessonKit.teacherId,
        studentId: lessonKit.studentId,
        content: JSON.stringify(lessonKit),
        generatedAt: lessonKit.generatedAt
      };
      
      // Store using the storage service
      await this.storage.createResourceMaterial({
        title: `Lesson Kit - ${lessonKit.topic}`,
        type: 'lesson_kit',
        fileType: 'json',
        fileUrl: `/lesson-kits/${lessonKit.id}.json`,
        description: `Automated lesson kit for ${lessonKit.topic}`,
        tags: [lessonKit.level, lessonKit.topic, 'automated'],
        isPublic: false,
        uploadedBy: lessonKit.teacherId,
        metadata: kitData
      });
    } catch (error) {
      console.error('Error saving lesson kit:', error);
    }
  }

  private generateFallbackLessonKit(params: any): LessonKit {
    return {
      id: `kit_${Date.now()}_${params.sessionId}`,
      sessionId: params.sessionId,
      teacherId: params.teacherId,
      studentId: params.studentId,
      topic: params.topic,
      level: params.level,
      objectives: this.getDefaultObjectives(),
      vocabulary: this.generateVocabulary(params.topic, params.level),
      exercises: this.generateExercises(params.topic, params.level, params.duration),
      speakingPrompts: this.generateSpeakingPrompts(params.topic, params.level),
      homework: this.generateHomework(params.topic, params.level),
      assessmentQuestions: this.generateAssessmentQuestions(params.topic, params.level),
      culturalNotes: this.generateCulturalNotes(params.topic),
      generatedAt: new Date()
    };
  }

  async generateBulkLessonKits(courseId: number, count: number = 10): Promise<LessonKit[]> {
    const kits: LessonKit[] = [];
    const course = await this.storage.getCourse(courseId);
    const sessions = await this.storage.getCourseSessions(courseId);
    
    for (let i = 0; i < Math.min(count, sessions.length); i++) {
      const session = sessions[i];
      const kit = await this.generateLessonKit({
        sessionId: session.id,
        teacherId: session.teacherId || 1,
        studentId: session.studentId || 1,
        topic: session.topic || course?.title || 'General English',
        level: course?.level || 'intermediate',
        duration: session.duration || 60
      });
      kits.push(kit);
    }
    
    return kits;
  }
}