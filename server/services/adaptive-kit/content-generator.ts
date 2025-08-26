import { promises as fs } from 'fs';
import path from 'path';
import { nanoid } from 'nanoid';
import { OllamaService } from '../ollama-service';
import { PiperTTSService } from './piper-service';
import { WhisperASRService } from './whisper-service';

export interface ContentKit {
  id: string;
  sessionId: number;
  studentId: number;
  createdAt: Date;
  manifest: KitManifest;
  assets: KitAssets;
}

export interface KitManifest {
  roadmapObjective: string;
  targetLevel: string;
  skills: string[];
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  duration: number; // estimated minutes
  components: {
    audio: boolean;
    reading: boolean;
    grammar: boolean;
    exercises: boolean;
    miniGame: boolean;
  };
}

export interface KitAssets {
  audioUrl?: string;
  readingPassage?: {
    text: string;
    annotations: Annotation[];
    cefr: string;
  };
  grammarSnippet?: {
    title: string;
    explanation: string;
    examples: string[];
  };
  exercises?: Exercise[];
  miniGame?: MiniGameSpec;
}

export interface Annotation {
  start: number;
  end: number;
  type: 'vocabulary' | 'grammar' | 'idiom';
  level: string;
  explanation?: string;
}

export interface Exercise {
  id: string;
  type: 'gap-fill' | 'sentence-transform' | 'multiple-choice' | 'word-order';
  instructions: string;
  questions: any[];
  answers: any[];
}

export interface MiniGameSpec {
  type: 'drag-drop' | 'match' | 'quiz' | 'word-builder';
  config: any;
  data: any;
}

export class AdaptiveContentGenerator {
  private ollamaService: OllamaService;
  private piperService: PiperTTSService;
  private whisperService: WhisperASRService;
  private contentBasePath: string;

  constructor() {
    this.ollamaService = new OllamaService();
    this.piperService = new PiperTTSService();
    this.whisperService = new WhisperASRService();
    this.contentBasePath = process.env.CONTENT_PATH || './content';
  }

  async generateKit(params: {
    sessionId: number;
    studentId: number;
    roadmapObjective: string;
    sessionTranscript?: string;
    sessionMetrics?: any;
    irtScores?: { theta: number; standardError: number };
    generationPolicy?: any;
  }): Promise<ContentKit> {
    const kitId = nanoid();
    const { sessionId, studentId, roadmapObjective, irtScores, generationPolicy } = params;

    // Determine difficulty based on IRT scores
    const difficulty = this.calculateDifficulty(irtScores?.theta);
    
    // Create manifest
    const manifest: KitManifest = {
      roadmapObjective,
      targetLevel: generationPolicy?.targetCEFR || 'B1',
      skills: generationPolicy?.skills || ['speaking', 'listening'],
      difficulty,
      duration: this.calculateDuration(difficulty),
      components: {
        audio: true,
        reading: true,
        grammar: true,
        exercises: true,
        miniGame: true,
      },
    };

    // Generate content components
    const assets: KitAssets = {};

    // Generate reading passage
    if (manifest.components.reading) {
      assets.readingPassage = await this.generateReadingPassage({
        objective: roadmapObjective,
        level: manifest.targetLevel,
        difficulty,
        policy: generationPolicy,
      });
    }

    // Generate grammar snippet based on errors
    if (manifest.components.grammar && params.sessionTranscript) {
      assets.grammarSnippet = await this.generateGrammarSnippet({
        transcript: params.sessionTranscript,
        objective: roadmapObjective,
        errors: params.sessionMetrics?.errors || [],
      });
    }

    // Generate exercises
    if (manifest.components.exercises) {
      assets.exercises = await this.generateExercises({
        objective: roadmapObjective,
        difficulty,
        readingText: assets.readingPassage?.text,
        grammarFocus: assets.grammarSnippet?.title,
      });
    }

    // Generate audio narration
    if (manifest.components.audio && assets.readingPassage) {
      const audioPath = await this.generateAudio({
        text: assets.readingPassage.text,
        studentId,
        sessionId,
      });
      assets.audioUrl = audioPath;
    }

    // Generate mini-game
    if (manifest.components.miniGame) {
      assets.miniGame = await this.generateMiniGame({
        objective: roadmapObjective,
        difficulty,
        vocabulary: params.sessionMetrics?.vocabularyUsed || [],
      });
    }

    // Save kit to filesystem
    const kit: ContentKit = {
      id: kitId,
      sessionId,
      studentId,
      createdAt: new Date(),
      manifest,
      assets,
    };

    await this.saveKit(kit);
    return kit;
  }

  private calculateDifficulty(theta?: number): 'beginner' | 'intermediate' | 'advanced' {
    if (!theta) return 'intermediate';
    if (theta < -0.5) return 'beginner';
    if (theta > 0.5) return 'advanced';
    return 'intermediate';
  }

  private calculateDuration(difficulty: string): number {
    switch (difficulty) {
      case 'beginner': return 15;
      case 'advanced': return 30;
      default: return 20;
    }
  }

  private async generateReadingPassage(params: {
    objective: string;
    level: string;
    difficulty: string;
    policy?: any;
  }) {
    const prompt = `Generate a ${params.level} level reading passage about "${params.objective}".
    Difficulty: ${params.difficulty}
    Length: 150-200 words
    Include: ${params.policy?.includeElements?.join(', ') || 'vocabulary, idioms'}
    Format: Plain text suitable for language learners
    Topic should be engaging and culturally appropriate.`;

    const response = await this.ollamaService.generateText(prompt);
    const text = response.content || '';

    // Analyze text for annotations
    const annotations = await this.analyzeTextAnnotations(text, params.level);

    return {
      text,
      annotations,
      cefr: params.level,
    };
  }

  private async analyzeTextAnnotations(text: string, level: string): Promise<Annotation[]> {
    const prompt = `Analyze this text and identify vocabulary, grammar points, and idioms suitable for ${level} learners:
    "${text}"
    
    Return as JSON array with format:
    [{start: number, end: number, type: "vocabulary|grammar|idiom", level: string, explanation: string}]`;

    try {
      const response = await this.ollamaService.generateJSON(prompt);
      return response.annotations || [];
    } catch (error) {
      console.error('Failed to generate annotations:', error);
      return [];
    }
  }

  private async generateGrammarSnippet(params: {
    transcript: string;
    objective: string;
    errors: any[];
  }) {
    const prompt = `Based on this conversation transcript and detected errors, generate a grammar lesson:
    Objective: ${params.objective}
    Common errors: ${params.errors.slice(0, 3).join(', ')}
    
    Create a brief grammar explanation with:
    1. Clear title
    2. Simple explanation (2-3 sentences)
    3. 3 example sentences
    
    Format as JSON: {title, explanation, examples[]}`;

    try {
      const response = await this.ollamaService.generateJSON(prompt);
      return {
        title: response.title || 'Grammar Focus',
        explanation: response.explanation || '',
        examples: response.examples || [],
      };
    } catch (error) {
      console.error('Failed to generate grammar snippet:', error);
      return {
        title: 'Grammar Review',
        explanation: 'Review the grammar points from your lesson.',
        examples: [],
      };
    }
  }

  private async generateExercises(params: {
    objective: string;
    difficulty: string;
    readingText?: string;
    grammarFocus?: string;
  }): Promise<Exercise[]> {
    const exercises: Exercise[] = [];

    // Gap-fill exercise
    const gapFillPrompt = `Create a gap-fill exercise for "${params.objective}".
    Difficulty: ${params.difficulty}
    Grammar focus: ${params.grammarFocus || 'general'}
    Create 5 sentences with blanks.
    Format as JSON: {instructions, questions[], answers[]}`;

    try {
      const gapFillResponse = await this.ollamaService.generateJSON(gapFillPrompt);
      exercises.push({
        id: nanoid(),
        type: 'gap-fill',
        instructions: gapFillResponse.instructions || 'Fill in the blanks',
        questions: gapFillResponse.questions || [],
        answers: gapFillResponse.answers || [],
      });
    } catch (error) {
      console.error('Failed to generate gap-fill exercise:', error);
    }

    // Multiple choice exercise
    const mcPrompt = `Create a multiple-choice exercise for "${params.objective}".
    Difficulty: ${params.difficulty}
    Create 5 questions with 4 options each.
    Format as JSON: {instructions, questions[{question, options[], correct}]}`;

    try {
      const mcResponse = await this.ollamaService.generateJSON(mcPrompt);
      exercises.push({
        id: nanoid(),
        type: 'multiple-choice',
        instructions: mcResponse.instructions || 'Choose the correct answer',
        questions: mcResponse.questions || [],
        answers: mcResponse.questions?.map((q: any) => q.correct) || [],
      });
    } catch (error) {
      console.error('Failed to generate multiple-choice exercise:', error);
    }

    return exercises;
  }

  private async generateAudio(params: {
    text: string;
    studentId: number;
    sessionId: number;
  }): Promise<string> {
    try {
      const audioBuffer = await this.piperService.synthesize({
        text: params.text,
        voice: 'fa_IR-amir-medium',
        speed: 0.9, // Slightly slower for learners
      });

      // Save audio file
      const filename = `audio_${params.sessionId}_${Date.now()}.wav`;
      const dirPath = path.join(this.contentBasePath, params.studentId.toString(), params.sessionId.toString());
      await fs.mkdir(dirPath, { recursive: true });
      
      const filepath = path.join(dirPath, filename);
      await fs.writeFile(filepath, audioBuffer);

      return `/content/${params.studentId}/${params.sessionId}/${filename}`;
    } catch (error) {
      console.error('Failed to generate audio:', error);
      return '';
    }
  }

  private async generateMiniGame(params: {
    objective: string;
    difficulty: string;
    vocabulary: string[];
  }): Promise<MiniGameSpec> {
    const prompt = `Create a language learning mini-game for "${params.objective}".
    Difficulty: ${params.difficulty}
    Vocabulary to include: ${params.vocabulary.slice(0, 10).join(', ')}
    Game type: word matching game
    
    Generate JSON with:
    - type: "match"
    - config: {timeLimit, points}
    - data: {pairs: [{word, match, hint}]}`;

    try {
      const response = await this.ollamaService.generateJSON(prompt);
      return {
        type: 'match',
        config: response.config || { timeLimit: 120, points: 10 },
        data: response.data || { pairs: [] },
      };
    } catch (error) {
      console.error('Failed to generate mini-game:', error);
      return {
        type: 'match',
        config: { timeLimit: 120, points: 10 },
        data: { pairs: [] },
      };
    }
  }

  private async saveKit(kit: ContentKit): Promise<void> {
    const dirPath = path.join(
      this.contentBasePath,
      kit.studentId.toString(),
      kit.sessionId.toString()
    );
    
    await fs.mkdir(dirPath, { recursive: true });
    
    const manifestPath = path.join(dirPath, 'manifest.json');
    await fs.writeFile(manifestPath, JSON.stringify(kit, null, 2));
  }

  async loadKit(studentId: number, sessionId: number): Promise<ContentKit | null> {
    try {
      const manifestPath = path.join(
        this.contentBasePath,
        studentId.toString(),
        sessionId.toString(),
        'manifest.json'
      );
      
      const data = await fs.readFile(manifestPath, 'utf-8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Failed to load kit:', error);
      return null;
    }
  }
}