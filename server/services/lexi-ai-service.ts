// ============================================================================
// LEXI AI TEACHING ASSISTANT SERVICE
// ============================================================================
// Comprehensive AI teaching assistant service that integrates with existing
// AI provider infrastructure to provide contextual learning assistance

import { EventEmitter } from 'events';
import { AIProviderManager } from '../ai-providers/ai-provider-manager';
import { db } from '../db';
import {
  lexiConversations,
  lexiMessages,
  lexiVideoAnalysis,
  lexiLearningInteractions,
  lexiVoiceInteractions,
  lexiRecommendations,
  lexiLearningAnalytics,
  lexiQuizzes,
  lexiQuizAttempts,
  type LexiConversation,
  type LexiMessage,
  type LexiConversationInsert,
  type LexiMessageInsert,
  type LexiVideoAnalysisInsert,
  type LexiLearningInteractionInsert,
  type LexiVoiceInteractionInsert,
  type LexiRecommendationInsert,
  type LexiQuizInsert
} from '@shared/schema';
import { eq, desc, and, sql } from 'drizzle-orm';

// Lexi service interfaces
export interface LexiChatRequest {
  message: string;
  conversationId?: number;
  userId: number;
  courseId?: number;
  videoLessonId?: number;
  videoTimestamp?: number;
  sessionType: 'video_learning' | 'general_chat' | 'vocabulary' | 'grammar' | 'pronunciation';
  language: string;
  userLevel?: string;
  culturalContext?: string;
  contextData?: any;
}

export interface LexiChatResponse {
  response: string;
  conversationId: number;
  messageId: number;
  suggestions?: string[];
  relatedConcepts?: string[];
  difficulty?: 'easy' | 'medium' | 'hard';
  metadata?: any;
}

export interface VideoAnalysisRequest {
  videoLessonId: number;
  courseId?: number;
  language: string;
  analysisType: 'content_summary' | 'vocabulary_extraction' | 'grammar_points' | 'cultural_context' | 'full_analysis';
  videoTranscript?: string;
  videoUrl?: string;
}

export interface VideoAnalysisResponse {
  analysisId: number;
  content: any;
  keyVocabulary: string[];
  grammarConcepts: string[];
  culturalNotes: string[];
  difficultyLevel: string;
  topicTags: string[];
  transcription?: string;
  subtitles?: any;
  analysisQuality: number;
}

export interface LearningStatsResponse {
  totalInteractions: number;
  conversationsStarted: number;
  messagesExchanged: number;
  vocabularyLearned: number;
  grammarConceptsExplored: number;
  pronunciationAttempts: number;
  averagePronunciationScore: number;
  learningStreak: number;
  engagementScore: number;
  strugglingAreas: string[];
  strengths: string[];
  nextRecommendations: string[];
}

export interface PersonalizedRecommendation {
  type: 'next_lesson' | 'practice_activity' | 'vocabulary_review' | 'grammar_focus' | 'cultural_tip';
  title: string;
  description: string;
  content: any;
  priority: number;
  difficulty: 'easy' | 'medium' | 'hard';
  estimatedTime: number;
  relatedConcepts: string[];
}

export class LexiAIService extends EventEmitter {
  private aiProviderManager: AIProviderManager;

  constructor() {
    super();
    this.aiProviderManager = new AIProviderManager();
  }

  async initialize(): Promise<void> {
    console.log('🤖 Initializing Lexi AI Service...');
    await this.aiProviderManager.initialize();
    console.log('✅ Lexi AI Service initialized');
  }

  // ============================================================================
  // CORE CHAT FUNCTIONALITY
  // ============================================================================

  async chat(request: LexiChatRequest): Promise<LexiChatResponse> {
    try {
      // Get or create conversation
      let conversationId = request.conversationId;
      if (!conversationId) {
        conversationId = await this.createConversation({
          userId: request.userId,
          courseId: request.courseId,
          videoLessonId: request.videoLessonId,
          sessionType: request.sessionType,
          language: request.language,
          contextData: request.contextData,
          proficiencyLevel: request.userLevel,
          culturalContext: request.culturalContext
        });
      }

      // Get conversation history for context
      const conversationHistory = await this.getConversationHistory(conversationId);
      
      // Build system prompt based on session type and context
      const systemPrompt = this.buildSystemPrompt(request, conversationHistory);
      
      // Prepare messages for AI
      const messages = [
        { role: 'system' as const, content: systemPrompt },
        ...conversationHistory.slice(-10).map(msg => ({
          role: msg.role as 'user' | 'assistant',
          content: msg.content
        })),
        { role: 'user' as const, content: request.message }
      ];

      // Get AI response
      const aiResponse = await this.aiProviderManager.createChatCompletion({
        messages,
        maxTokens: 1000,
        temperature: 0.7
      });

      // Parse and enhance response
      const enhancedResponse = this.enhanceResponse(aiResponse.content, request);

      // Save user message
      await this.saveMessage({
        conversationId,
        role: 'user',
        content: request.message,
        messageType: 'text',
        videoTimestamp: request.videoTimestamp ? request.videoTimestamp.toString() : null,
        metadata: { sessionType: request.sessionType, userLevel: request.userLevel }
      });

      // Save AI response
      const messageId = await this.saveMessage({
        conversationId,
        role: 'assistant',
        content: enhancedResponse.response,
        messageType: 'text',
        relatedConcepts: enhancedResponse.relatedConcepts,
        difficulty: enhancedResponse.difficulty,
        metadata: { suggestions: enhancedResponse.suggestions, aiModel: aiResponse.model }
      });

      // Log learning interaction
      await this.logLearningInteraction({
        userId: request.userId,
        conversationId,
        interactionType: this.getInteractionType(request.sessionType, request.message),
        content: request.message,
        context: request.videoTimestamp ? `Video timestamp: ${request.videoTimestamp}` : undefined,
        userResponse: request.message,
        lexiResponse: enhancedResponse.response,
        difficulty: enhancedResponse.difficulty
      });

      // Update conversation stats
      await this.updateConversationStats(conversationId);

      return {
        response: enhancedResponse.response,
        conversationId,
        messageId,
        suggestions: enhancedResponse.suggestions,
        relatedConcepts: enhancedResponse.relatedConcepts,
        difficulty: enhancedResponse.difficulty,
        metadata: enhancedResponse.metadata
      };

    } catch (error) {
      console.error('❌ Lexi chat error:', error);
      throw new Error('Failed to process chat request');
    }
  }

  private buildSystemPrompt(request: LexiChatRequest, history: LexiMessage[]): string {
    const basePrompt = `You are Lexi, an advanced AI teaching assistant specialized in language learning. You are knowledgeable, encouraging, and culturally aware.

Current Context:
- Session Type: ${request.sessionType}
- Language: ${request.language}
- User Level: ${request.userLevel || 'Unknown'}
- Cultural Context: ${request.culturalContext || 'General'}
- Video Context: ${request.videoLessonId ? 'Currently watching video lesson' : 'General learning session'}
- Video Timestamp: ${request.videoTimestamp || 'N/A'}

Your responsibilities:
1. Provide clear, helpful explanations tailored to the user's level
2. Offer vocabulary assistance with pronunciation guides
3. Explain grammar concepts with practical examples
4. Provide cultural context and usage tips
5. Generate learning recommendations based on user needs
6. Be encouraging and supportive in your responses
7. Adapt your language complexity to the user's proficiency level

Response Guidelines:
- Keep explanations clear and concise
- Provide practical examples
- Include pronunciation guides when relevant
- Offer cultural context when appropriate
- Suggest related learning activities
- Be encouraging and positive
- Use the user's native language for complex explanations if helpful`;

    // Add session-specific instructions
    switch (request.sessionType) {
      case 'video_learning':
        return basePrompt + `\n\nVideo Learning Mode:
- Help explain video content in context
- Answer questions about what's shown in the video
- Provide vocabulary from video content
- Suggest pausing points for practice
- Create mini-quizzes based on video content`;

      case 'vocabulary':
        return basePrompt + `\n\nVocabulary Mode:
- Focus on word meanings, usage, and pronunciation
- Provide example sentences and contexts
- Explain etymology when helpful
- Suggest memory techniques
- Offer related words and phrases`;

      case 'grammar':
        return basePrompt + `\n\nGrammar Mode:
- Explain grammar rules clearly with examples
- Show common usage patterns
- Highlight exceptions and special cases
- Provide practice exercises
- Connect to previously learned concepts`;

      case 'pronunciation':
        return basePrompt + `\n\nPronunciation Mode:
- Focus on phonetic guidance
- Explain mouth positioning and tongue placement
- Provide phonetic transcriptions
- Suggest practice techniques
- Address common pronunciation challenges`;

      default:
        return basePrompt + `\n\nGeneral Chat Mode:
- Answer any language learning questions
- Provide comprehensive support across all skills
- Adapt to the user's immediate needs
- Encourage continued learning`;
    }
  }

  private enhanceResponse(aiResponse: string, request: LexiChatRequest): any {
    // Extract suggestions and related concepts from AI response
    const suggestions: string[] = [];
    const relatedConcepts: string[] = [];
    let difficulty: 'easy' | 'medium' | 'hard' = 'medium';

    // Simple enhancement logic (can be made more sophisticated)
    if (request.sessionType === 'vocabulary') {
      suggestions.push('Practice using this word in sentences', 'Learn related synonyms', 'Try pronunciation practice');
    } else if (request.sessionType === 'grammar') {
      suggestions.push('Practice with example sentences', 'Try grammar exercises', 'Review related grammar points');
    } else if (request.sessionType === 'video_learning') {
      suggestions.push('Rewatch this section', 'Take notes on key points', 'Practice new vocabulary');
    }

    // Estimate difficulty based on content length and complexity
    if (aiResponse.length < 200) {
      difficulty = 'easy';
    } else if (aiResponse.length > 500) {
      difficulty = 'hard';
    }

    return {
      response: aiResponse,
      suggestions,
      relatedConcepts,
      difficulty,
      metadata: { enhanced: true, timestamp: new Date().toISOString() }
    };
  }

  // ============================================================================
  // VIDEO CONTENT ANALYSIS
  // ============================================================================

  async analyzeVideo(request: VideoAnalysisRequest): Promise<VideoAnalysisResponse> {
    try {
      const analysisPrompt = this.buildVideoAnalysisPrompt(request);
      
      const aiResponse = await this.aiProviderManager.createChatCompletion({
        messages: [
          { role: 'system', content: analysisPrompt },
          { role: 'user', content: request.videoTranscript || 'Analyze this video content for language learning.' }
        ],
        maxTokens: 2000,
        temperature: 0.3
      });

      // Parse AI analysis response
      const analysisContent = this.parseVideoAnalysis(aiResponse.content);

      // Save analysis to database
      const analysisResult = await db.insert(lexiVideoAnalysis).values({
        videoLessonId: request.videoLessonId,
        courseId: request.courseId,
        analysisType: request.analysisType,
        language: request.language,
        content: analysisContent,
        keyVocabulary: analysisContent.keyVocabulary || [],
        grammarConcepts: analysisContent.grammarConcepts || [],
        culturalNotes: analysisContent.culturalNotes || [],
        difficultyLevel: analysisContent.difficultyLevel || 'medium',
        topicTags: analysisContent.topicTags || [],
        transcription: request.videoTranscript,
        analysisQuality: 0.85 // Default quality score
      }).returning();

      return {
        analysisId: analysisResult[0].id,
        content: analysisContent,
        keyVocabulary: analysisContent.keyVocabulary || [],
        grammarConcepts: analysisContent.grammarConcepts || [],
        culturalNotes: analysisContent.culturalNotes || [],
        difficultyLevel: analysisContent.difficultyLevel || 'medium',
        topicTags: analysisContent.topicTags || [],
        transcription: request.videoTranscript,
        subtitles: analysisContent.subtitles,
        analysisQuality: 0.85
      };

    } catch (error) {
      console.error('❌ Video analysis error:', error);
      throw new Error('Failed to analyze video content');
    }
  }

  private buildVideoAnalysisPrompt(request: VideoAnalysisRequest): string {
    return `You are an expert language learning content analyzer. Analyze the provided video content and extract learning-relevant information.

Analysis Type: ${request.analysisType}
Language: ${request.language}

Please provide a structured analysis including:
1. Key vocabulary words and phrases (with difficulty levels)
2. Grammar concepts demonstrated
3. Cultural context and notes
4. Overall difficulty assessment
5. Topic tags for categorization
6. Learning objectives
7. Suggested follow-up activities

Format your response as JSON with the following structure:
{
  "keyVocabulary": ["word1", "word2"],
  "grammarConcepts": ["concept1", "concept2"],
  "culturalNotes": ["note1", "note2"],
  "difficultyLevel": "easy|medium|hard",
  "topicTags": ["tag1", "tag2"],
  "learningObjectives": ["objective1"],
  "followUpActivities": ["activity1"]
}`;
  }

  private parseVideoAnalysis(aiResponse: string): any {
    try {
      // Try to parse JSON response
      const parsed = JSON.parse(aiResponse);
      return parsed;
    } catch (error) {
      // Fallback parsing if not JSON
      return {
        keyVocabulary: [],
        grammarConcepts: [],
        culturalNotes: [],
        difficultyLevel: 'medium',
        topicTags: [],
        learningObjectives: [],
        followUpActivities: []
      };
    }
  }

  // ============================================================================
  // LEARNING ANALYTICS AND RECOMMENDATIONS
  // ============================================================================

  async getLearningStats(userId: number, timeframe: 'day' | 'week' | 'month' = 'week'): Promise<LearningStatsResponse> {
    try {
      // Calculate date range
      const now = new Date();
      const startDate = new Date(now);
      
      switch (timeframe) {
        case 'day':
          startDate.setDate(now.getDate() - 1);
          break;
        case 'week':
          startDate.setDate(now.getDate() - 7);
          break;
        case 'month':
          startDate.setMonth(now.getMonth() - 1);
          break;
      }

      // Get analytics data
      const analytics = await db.select()
        .from(lexiLearningAnalytics)
        .where(and(
          eq(lexiLearningAnalytics.userId, userId),
          sql`${lexiLearningAnalytics.analyticsDate} >= ${startDate.toISOString().split('T')[0]}`
        ));

      // Aggregate stats
      const stats = analytics.reduce((acc, day) => ({
        totalInteractions: acc.totalInteractions + (day.totalInteractions || 0),
        conversationsStarted: acc.conversationsStarted + (day.conversationsStarted || 0),
        messagesExchanged: acc.messagesExchanged + (day.messagesExchanged || 0),
        vocabularyLearned: acc.vocabularyLearned + (day.vocabularyLearned || 0),
        grammarConceptsExplored: acc.grammarConceptsExplored + (day.grammarConceptsExplored || 0),
        pronunciationAttempts: acc.pronunciationAttempts + (day.pronunciationAttempts || 0)
      }), {
        totalInteractions: 0,
        conversationsStarted: 0,
        messagesExchanged: 0,
        vocabularyLearned: 0,
        grammarConceptsExplored: 0,
        pronunciationAttempts: 0
      });

      // Calculate averages and latest data
      const latestAnalytics = analytics[analytics.length - 1];
      
      return {
        ...stats,
        averagePronunciationScore: latestAnalytics?.averagePronunciationScore ? parseFloat(latestAnalytics.averagePronunciationScore.toString()) : 0,
        learningStreak: latestAnalytics?.learningStreak || 0,
        engagementScore: latestAnalytics?.engagementScore ? parseFloat(latestAnalytics.engagementScore.toString()) : 0,
        strugglingAreas: latestAnalytics?.strugglingAreas || [],
        strengths: latestAnalytics?.strengths || [],
        nextRecommendations: latestAnalytics?.nextRecommendations || []
      };

    } catch (error) {
      console.error('❌ Learning stats error:', error);
      throw new Error('Failed to get learning statistics');
    }
  }

  async generatePersonalizedRecommendations(userId: number, limit: number = 5): Promise<PersonalizedRecommendation[]> {
    try {
      // Get user's learning history and patterns
      const recentInteractions = await db.select()
        .from(lexiLearningInteractions)
        .where(eq(lexiLearningInteractions.userId, userId))
        .orderBy(desc(lexiLearningInteractions.createdAt))
        .limit(50);

      // Analyze patterns and generate recommendations
      const recommendations = await this.generateRecommendationsFromPatterns(userId, recentInteractions);

      // Save recommendations to database
      for (const rec of recommendations.slice(0, limit)) {
        await db.insert(lexiRecommendations).values({
          userId,
          recommendationType: rec.type,
          title: rec.title,
          description: rec.description,
          content: rec.content,
          priority: rec.priority,
          difficulty: rec.difficulty,
          estimatedTime: rec.estimatedTime,
          relatedConcepts: rec.relatedConcepts,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000) // Expire in 7 days
        });
      }

      return recommendations.slice(0, limit);

    } catch (error) {
      console.error('❌ Recommendations error:', error);
      throw new Error('Failed to generate personalized recommendations');
    }
  }

  private async generateRecommendationsFromPatterns(userId: number, interactions: any[]): Promise<PersonalizedRecommendation[]> {
    // Analyze interaction patterns
    const vocabularyInteractions = interactions.filter(i => i.interactionType === 'vocabulary_lookup');
    const grammarInteractions = interactions.filter(i => i.interactionType === 'grammar_question');
    const pronunciationInteractions = interactions.filter(i => i.interactionType === 'pronunciation_practice');

    const recommendations: PersonalizedRecommendation[] = [];

    // Generate vocabulary recommendations
    if (vocabularyInteractions.length > 5) {
      recommendations.push({
        type: 'vocabulary_review',
        title: 'Review Recent Vocabulary',
        description: 'Practice the vocabulary words you\'ve been learning',
        content: { words: vocabularyInteractions.slice(0, 10).map(i => i.content) },
        priority: 80,
        difficulty: 'medium',
        estimatedTime: 15,
        relatedConcepts: ['vocabulary', 'memory']
      });
    }

    // Generate grammar recommendations
    if (grammarInteractions.length > 3) {
      recommendations.push({
        type: 'grammar_focus',
        title: 'Grammar Practice Session',
        description: 'Focus on grammar concepts you\'ve been exploring',
        content: { concepts: grammarInteractions.slice(0, 5).map(i => i.content) },
        priority: 70,
        difficulty: 'medium',
        estimatedTime: 20,
        relatedConcepts: ['grammar', 'practice']
      });
    }

    // Generate pronunciation recommendations
    if (pronunciationInteractions.length > 2) {
      recommendations.push({
        type: 'practice_activity',
        title: 'Pronunciation Practice',
        description: 'Continue improving your pronunciation',
        content: { focus: 'pronunciation' },
        priority: 60,
        difficulty: 'medium',
        estimatedTime: 10,
        relatedConcepts: ['pronunciation', 'speaking']
      });
    }

    return recommendations;
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private async createConversation(data: LexiConversationInsert): Promise<number> {
    const result = await db.insert(lexiConversations).values({
      ...data,
      title: `${data.sessionType} session - ${new Date().toLocaleDateString()}`
    }).returning();
    return result[0].id;
  }

  private async getConversationHistory(conversationId: number): Promise<LexiMessage[]> {
    return await db.select()
      .from(lexiMessages)
      .where(eq(lexiMessages.conversationId, conversationId))
      .orderBy(lexiMessages.createdAt);
  }

  private async saveMessage(data: Omit<LexiMessageInsert, 'videoTimestamp'> & { videoTimestamp?: string | null }): Promise<number> {
    const result = await db.insert(lexiMessages).values({
      ...data,
      videoTimestamp: data.videoTimestamp ? data.videoTimestamp : null
    }).returning();
    return result[0].id;
  }

  private async logLearningInteraction(data: LexiLearningInteractionInsert): Promise<void> {
    await db.insert(lexiLearningInteractions).values(data);
  }

  private async updateConversationStats(conversationId: number): Promise<void> {
    await db.update(lexiConversations)
      .set({
        lastMessageAt: new Date(),
        updatedAt: new Date(),
        totalMessages: sql`${lexiConversations.totalMessages} + 2` // +2 for user and assistant message
      })
      .where(eq(lexiConversations.id, conversationId));
  }

  private getInteractionType(sessionType: string, message: string): string {
    if (message.toLowerCase().includes('what does') || message.toLowerCase().includes('meaning')) {
      return 'vocabulary_lookup';
    } else if (message.toLowerCase().includes('grammar') || message.toLowerCase().includes('how to')) {
      return 'grammar_question';
    } else if (sessionType === 'pronunciation') {
      return 'pronunciation_practice';
    } else {
      return 'explanation_request';
    }
  }

  // ============================================================================
  // QUIZ GENERATION
  // ============================================================================

  async generateQuizFromVideo(userId: number, videoLessonId: number, quizType: string = 'comprehension'): Promise<any> {
    try {
      // Get video analysis
      const analysis = await db.select()
        .from(lexiVideoAnalysis)
        .where(eq(lexiVideoAnalysis.videoLessonId, videoLessonId))
        .limit(1);

      if (!analysis.length) {
        throw new Error('Video analysis not found');
      }

      const videoData = analysis[0];
      
      // Generate quiz using AI
      const quizPrompt = `Generate a ${quizType} quiz based on this video content analysis:
        
Key Vocabulary: ${videoData.keyVocabulary.join(', ')}
Grammar Concepts: ${videoData.grammarConcepts.join(', ')}
Difficulty Level: ${videoData.difficultyLevel}

Create 5 questions in JSON format with the following structure:
{
  "questions": [
    {
      "question": "Question text",
      "type": "multiple_choice|fill_blank|true_false",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctAnswer": "Option 1",
      "explanation": "Why this is correct"
    }
  ]
}`;

      const aiResponse = await this.aiProviderManager.createChatCompletion({
        messages: [
          { role: 'system', content: 'You are an expert quiz generator for language learning.' },
          { role: 'user', content: quizPrompt }
        ],
        maxTokens: 1500,
        temperature: 0.5
      });

      const quizData = JSON.parse(aiResponse.content);

      // Save quiz to database
      const quiz = await db.insert(lexiQuizzes).values({
        userId,
        videoLessonId,
        title: `${quizType} Quiz`,
        description: `Quiz generated from video content`,
        quizType,
        language: videoData.language,
        difficulty: videoData.difficultyLevel,
        questions: quizData
      }).returning();

      return quiz[0];

    } catch (error) {
      console.error('❌ Quiz generation error:', error);
      throw new Error('Failed to generate quiz from video');
    }
  }
}

// Export singleton instance
export const lexiAIService = new LexiAIService();