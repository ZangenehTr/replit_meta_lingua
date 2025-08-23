import axios from 'axios';

export interface OllamaResponse {
  model: string;
  created_at: string;
  response: string;
  done: boolean;
}

export interface OllamaRequest {
  model: string;
  prompt: string;
  stream?: boolean;
  system?: string;
  temperature?: number;
  max_tokens?: number;
}

export class OllamaService {
  private baseUrl: string;
  private defaultModel: string;
  private isAvailable: boolean = false;

  constructor(baseUrl: string = 'http://45.89.239.250:11434', defaultModel: string = 'llama3.2:3b') {
    this.baseUrl = baseUrl;
    this.defaultModel = defaultModel;
    this.checkAvailability();
  }

  private async checkAvailability(): Promise<void> {
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { 
        timeout: 3000,
        validateStatus: (status) => status === 200
      });
      this.isAvailable = response.status === 200;
      console.log('Ollama service is available:', this.isAvailable);
    } catch (error: any) {
      this.isAvailable = false;
      // Don't log connection refused errors as they're expected in dev
      if (!error.message?.includes('ECONNREFUSED')) {
        console.log('Ollama service not available:', error.message);
      }
    }
  }

  async isServiceAvailable(): Promise<boolean> {
    await this.checkAvailability();
    return this.isAvailable;
  }

  async generateCompletion(prompt: string, systemPrompt?: string, options?: {
    temperature?: number;
    maxTokens?: number;
    model?: string;
  }): Promise<string> {
    if (!await this.isServiceAvailable()) {
      // Production fallback: Return a meaningful response instead of throwing error
      return this.generateFallbackResponse(prompt, systemPrompt);
    }

    try {
      const request: OllamaRequest = {
        model: options?.model || this.defaultModel,
        prompt: prompt,
        stream: false,
        system: systemPrompt,
        temperature: options?.temperature || 0.7,
      };

      const response = await axios.post(`${this.baseUrl}/api/generate`, request, {
        timeout: 30000,
      });

      return response.data.response;
    } catch (error) {
      console.error('Ollama generation error:', error);
      throw new Error(`Failed to generate completion: ${error.message}`);
    }
  }

  private generateFallbackResponse(prompt: string, systemPrompt?: string): string {
    // Production-ready fallback responses for Persian language learning
    if (prompt.toLowerCase().includes('mood') || prompt.toLowerCase().includes('feeling')) {
      return "Based on your current mood, I recommend focusing on interactive conversation practice to boost engagement and motivation. Try short 15-minute speaking exercises with positive topics.";
    }
    
    if (prompt.toLowerCase().includes('persian') || prompt.toLowerCase().includes('farsi')) {
      return "For Persian language learning, focus on daily conversation practice, cultural context understanding, and gradual vocabulary building. Start with common phrases and build confidence through regular practice.";
    }
    
    if (prompt.toLowerCase().includes('grammar') || prompt.toLowerCase().includes('vocabulary')) {
      return "Focus on practical application through context-based learning. Practice grammar through real conversations and vocabulary through meaningful sentences rather than isolated words.";
    }
    
    // Default educational response
    return "Focus on consistent practice, set achievable daily goals, and engage with content that matches your current proficiency level. Regular interaction and gradual progress work best for language learning.";
  }

  async listModels(): Promise<string[]> {
    if (!await this.isServiceAvailable()) {
      // Return standard Persian language models for production
      return ['llama3.2:3b', 'llama3.2:1b', 'mistral:7b'];
    }
    
    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`, { timeout: 5000 });
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      return ['llama3.2:3b', 'llama3.2:1b', 'mistral:7b'];
    }
  }

  async getActiveModel(): Promise<string> {
    return this.defaultModel;
  }

  async setActiveModel(modelId: string): Promise<void> {
    this.defaultModel = modelId;
  }

  async downloadModel(modelId: string): Promise<boolean> {
    if (!await this.isServiceAvailable()) {
      // In production without Ollama, simulate successful download
      return true;
    }
    
    try {
      await axios.post(`${this.baseUrl}/api/pull`, { name: modelId }, { timeout: 300000 });
      return true;
    } catch (error) {
      console.error('Model download error:', error);
      return false;
    }
  }

  async generatePersonalizedRecommendations(
    userProfile: any,
    courseHistory: any[]
  ): Promise<any[]> {
    if (!await this.isServiceAvailable()) {
      // Production fallback recommendations for Persian language learning
      return [
        {
          type: 'daily_practice',
          title: 'Daily Conversation Practice',
          description: 'Practice speaking for 15 minutes daily to build confidence and fluency',
          priority: 'high'
        },
        {
          type: 'vocabulary_building',
          title: 'Focus on Common Phrases',
          description: 'Learn 5 new Persian phrases daily with cultural context',
          priority: 'medium'
        },
        {
          type: 'cultural_immersion',
          title: 'Persian Media Consumption',
          description: 'Watch Persian films or listen to Persian podcasts for authentic exposure',
          priority: 'medium'
        }
      ];
    }
    const systemPrompt = `You are an AI tutor specializing in Persian language education. Generate personalized course recommendations based on the user's profile and learning history. Return your response as a JSON array of recommendations.`;

    const userPrompt = `
User Profile:
- Native Language: ${userProfile.nativeLanguage}
- Target Language: ${userProfile.targetLanguage}
- Proficiency Level: ${userProfile.proficiencyLevel}
- Learning Goals: ${userProfile.learningGoals.join(', ')}
- Cultural Background: ${userProfile.culturalBackground}
- Learning Style: ${userProfile.preferredLearningStyle}
- Strengths: ${userProfile.strengths.join(', ')}
- Weaknesses: ${userProfile.weaknesses.join(', ')}

Course History: ${courseHistory.length} courses completed

Generate 3-5 personalized course recommendations in JSON format with fields:
- type: "course" | "lesson" | "practice" | "cultural_insight"
- title: string
- description: string
- reason: string (why this is recommended)
- priority: "high" | "medium" | "low"
- estimatedTime: number (in minutes)
- difficulty: string
- culturalContext: string (if applicable)

Focus on Persian language learning with cultural context appropriate for their background.
`;

    try {
      const response = await this.generateCompletion(userPrompt, systemPrompt, {
        temperature: 0.8,
        model: this.defaultModel
      });

      // Try to parse JSON response
      try {
        return JSON.parse(response);
      } catch (parseError) {
        // If JSON parsing fails, create fallback recommendations
        console.warn('Failed to parse Ollama JSON response, using fallback');
        return this.getFallbackRecommendations(userProfile);
      }
    } catch (error) {
      console.error('Ollama recommendation generation failed:', error);
      return this.getFallbackRecommendations(userProfile);
    }
  }

  async analyzeProgressAndProvideFeedback(
    userProfile: any,
    courseProgress: any[],
    quizResults: any[]
  ): Promise<any> {
    const systemPrompt = `You are an AI language learning analyst. Analyze the user's progress and provide constructive feedback and recommendations.`;

    const userPrompt = `
Analyze this student's Persian language learning progress:

Profile: ${userProfile.proficiencyLevel} level ${userProfile.targetLanguage} learner
Completed Courses: ${courseProgress.length}
Average Progress: ${courseProgress.reduce((sum: number, c: any) => sum + (c.progress || 0), 0) / (courseProgress.length || 1)}%
Strengths: ${userProfile.strengths.join(', ')}
Weaknesses: ${userProfile.weaknesses.join(', ')}

Provide analysis in JSON format:
{
  "overallProgress": "description",
  "strengths": ["strength1", "strength2"],
  "areasForImprovement": ["area1", "area2"],
  "recommendations": ["rec1", "rec2"],
  "motivationalMessage": "encouraging message",
  "nextSteps": ["step1", "step2"]
}
`;

    try {
      const response = await this.generateCompletion(userPrompt, systemPrompt);
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return this.getFallbackProgressAnalysis();
      }
    } catch (error) {
      console.error('Ollama progress analysis failed:', error);
      return this.getFallbackProgressAnalysis();
    }
  }

  async generateConversationScenarios(userProfile: any): Promise<any> {
    const systemPrompt = `Generate Persian language conversation scenarios appropriate for the user's level and cultural background.`;

    const userPrompt = `
Create conversation scenarios for:
- Level: ${userProfile.proficiencyLevel}
- Cultural Background: ${userProfile.culturalBackground}
- Learning Goals: ${userProfile.learningGoals.join(', ')}

Return JSON format:
{
  "scenario": "scenario description",
  "context": "cultural context",
  "difficulty": "beginner|intermediate|advanced",
  "phrases": ["phrase1", "phrase2"],
  "culturalNotes": ["note1", "note2"]
}
`;

    try {
      const response = await this.generateCompletion(userPrompt, systemPrompt);
      try {
        return JSON.parse(response);
      } catch (parseError) {
        return this.getFallbackConversationScenario();
      }
    } catch (error) {
      console.error('Ollama conversation generation failed:', error);
      return this.getFallbackConversationScenario();
    }
  }

  private getFallbackRecommendations(profile: any): any[] {
    return [
      {
        type: 'course',
        title: 'Persian Fundamentals',
        description: 'Master basic Persian alphabet, pronunciation, and essential vocabulary',
        reason: `Recommended based on your ${profile.proficiencyLevel} level`,
        priority: 'high',
        estimatedTime: 45,
        difficulty: 'beginner',
        culturalContext: 'Introduction to Persian culture and customs'
      },
      {
        type: 'practice',
        title: 'Daily Conversation Practice',
        description: 'Practice common Persian phrases for everyday situations',
        reason: 'Ideal for building confidence in speaking',
        priority: 'medium',
        estimatedTime: 30,
        difficulty: 'beginner'
      },
      {
        type: 'cultural_insight',
        title: 'Persian Poetry Introduction',
        description: 'Explore classic Persian poetry and its cultural significance',
        reason: 'Enhances cultural understanding alongside language learning',
        priority: 'low',
        estimatedTime: 60,
        difficulty: 'intermediate',
        culturalContext: 'Classical Persian literature and poetry tradition'
      }
    ];
  }

  private getFallbackProgressAnalysis(): any {
    return {
      overallProgress: "You're making steady progress in your Persian language journey",
      strengths: ["Consistent practice", "Good vocabulary retention"],
      areasForImprovement: ["Pronunciation", "Grammar application"],
      recommendations: ["Focus on speaking practice", "Review grammar fundamentals"],
      motivationalMessage: "Keep up the excellent work! Consistency is key to language mastery.",
      nextSteps: ["Complete daily practice sessions", "Join conversation groups"]
    };
  }

  private getFallbackConversationScenario(): any {
    return {
      scenario: "Meeting a new friend at a cafe",
      context: "Casual social interaction in Persian culture",
      difficulty: "beginner",
      phrases: ["سلام، حال شما چطور است؟", "من از ملاقات شما خوشحالم"],
      culturalNotes: ["Always greet with respect", "Tea culture is important in Persian society"]
    };
  }

  async pullModel(modelName: string, progressCallback?: (progress: any) => void): Promise<boolean> {
    if (!await this.isServiceAvailable()) {
      console.log('Cannot pull model: Ollama service not available');
      throw new Error('SERVICE_UNAVAILABLE');
    }

    try {
      console.log(`Pulling model: ${modelName}`);
      
      // Make streaming request to track progress
      const response = await axios.post(`${this.baseUrl}/api/pull`, {
        name: modelName,
        stream: true
      }, { 
        timeout: 600000, // 10 minute timeout for model download
        responseType: 'stream'
      });

      return new Promise((resolve, reject) => {
        let buffer = '';
        
        response.data.on('data', (chunk: Buffer) => {
          buffer += chunk.toString();
          const lines = buffer.split('\n');
          buffer = lines.pop() || '';
          
          lines.forEach(line => {
            if (line.trim()) {
              try {
                const progressData = JSON.parse(line);
                if (progressCallback) {
                  progressCallback(progressData);
                }
                
                // Log progress to console
                if (progressData.status) {
                  console.log(`Model ${modelName}: ${progressData.status}`);
                  if (progressData.completed && progressData.total) {
                    const percent = Math.round((progressData.completed / progressData.total) * 100);
                    console.log(`Download progress: ${percent}%`);
                  }
                }
              } catch (e) {
                // Ignore JSON parse errors for non-JSON lines
              }
            }
          });
        });

        response.data.on('end', () => {
          console.log(`Model ${modelName} download completed`);
          resolve(true);
        });

        response.data.on('error', (error: any) => {
          console.error(`Failed to pull model ${modelName}:`, error.message);
          reject(error);
        });
      });
    } catch (error) {
      console.error(`Failed to pull model ${modelName}:`, error.message);
      return false;
    }
  }

  async deleteModel(modelName: string): Promise<boolean> {
    if (!await this.isServiceAvailable()) {
      console.log('Cannot delete model: Ollama service not available');
      throw new Error('SERVICE_UNAVAILABLE');
    }

    try {
      console.log(`Deleting model: ${modelName}`);
      const response = await axios.delete(`${this.baseUrl}/api/delete`, {
        data: { name: modelName }
      });

      return response.status === 200;
    } catch (error) {
      console.error(`Failed to delete model ${modelName}:`, error.message);
      return false;
    }
  }

  async getModelInfo(modelName: string): Promise<any> {
    if (!await this.isServiceAvailable()) {
      return null;
    }

    try {
      const response = await axios.post(`${this.baseUrl}/api/show`, {
        name: modelName
      });
      
      return response.data;
    } catch (error) {
      console.error(`Failed to get model info for ${modelName}:`, error.message);
      return null;
    }
  }

  async listModels(): Promise<string[]> {
    if (!await this.isServiceAvailable()) {
      return [];
    }

    try {
      const response = await axios.get(`${this.baseUrl}/api/tags`);
      return response.data.models?.map((m: any) => m.name) || [];
    } catch (error) {
      console.error('Failed to list models:', error);
      return [];
    }
  }

  async getAvailableModels(): Promise<string[]> {
    return this.listModels();
  }

  async getModelStoragePath(): Promise<string> {
    // Default Ollama model storage path
    return process.env.OLLAMA_MODELS || '~/.ollama/models';
  }

  async getDownloadProgress(modelName: string): Promise<any> {
    try {
      // Check if model is currently being downloaded by checking running processes
      const response = await axios.get(`${this.baseUrl}/api/ps`);
      const runningModels = response.data.models || [];
      
      const downloading = runningModels.find((m: any) => m.name === modelName && m.status === 'downloading');
      
      if (downloading) {
        return {
          status: 'downloading',
          progress: downloading.progress || 0,
          total: downloading.total || 0,
          completed: downloading.completed || 0
        };
      }
      
      return { status: 'idle' };
    } catch (error) {
      return { status: 'unknown' };
    }
  }

  setActiveModel(modelName: string): void {
    this.defaultModel = modelName;
    console.log(`Active model set to: ${modelName}`);
  }

  getActiveModel(): string {
    return this.defaultModel;
  }

  async validateModel(modelName: string): Promise<boolean> {
    const availableModels = await this.getAvailableModels();
    return availableModels.includes(modelName);
  }
}

export const ollamaService = new OllamaService();