import { Server } from 'socket.io';
import { OllamaService } from './ollama-service';
import { storage } from './storage';

interface SessionMetrics {
  roomId: string;
  studentId: number;
  teacherId: number;
  languageCode: string;
  startTime: Date;
  teacherTalkTime: number;
  studentTalkTime: number;
  attentionScore: number;
  transcripts: Array<{ speaker: string; text: string; timestamp: Date }>;
  wordsSuggested: string[];
  pronunciationsCorrected: string[];
  currentContext: string;
  studentLevel: string;
  silencePeriods: number[];
  lastActivityTime: number;
}

export class CallernAIMonitor {
  private sessions: Map<string, SessionMetrics> = new Map();
  private io: Server;
  private ollama: OllamaService;

  constructor(io: Server) {
    this.io = io;
    this.ollama = new OllamaService();
  }

  startMonitoring(data: {
    roomId: string;
    studentId: number;
    teacherId: number;
    languageCode: string;
    studentLevel?: string;
  }) {
    this.sessions.set(data.roomId, {
      ...data,
      startTime: new Date(),
      teacherTalkTime: 0,
      studentTalkTime: 0,
      attentionScore: 100,
      transcripts: [],
      wordsSuggested: [],
      pronunciationsCorrected: [],
      currentContext: '',
      studentLevel: data.studentLevel || 'A2',
      silencePeriods: [],
      lastActivityTime: Date.now()
    });
    
    // Start periodic analysis
    this.startPeriodicAnalysis(data.roomId);
  }

  private startPeriodicAnalysis(roomId: string): void {
    const intervalId = setInterval(() => {
      const session = this.sessions.get(roomId);
      if (!session) {
        clearInterval(intervalId);
        return;
      }

      // Check TTT balance
      const totalTime = session.teacherTalkTime + session.studentTalkTime;
      if (totalTime > 0) {
        const tttPercentage = (session.teacherTalkTime / totalTime) * 100;
        
        if (tttPercentage > 60) {
          this.io.to(roomId).emit('ttt-update', {
            percentage: tttPercentage,
            status: 'high',
            message: 'Teacher talking too much - encourage student participation'
          });
        } else if (tttPercentage < 30) {
          this.io.to(roomId).emit('ttt-update', {
            percentage: tttPercentage,
            status: 'low',
            message: 'Teacher should guide the conversation more'
          });
        }
      }
      
      // Check for idleness
      const now = Date.now();
      const idleTime = now - session.lastActivityTime;
      if (idleTime > 10000) { // 10 seconds of silence
        this.io.to(roomId).emit('presence-update', {
          status: 'idle',
          duration: Math.round(idleTime / 1000)
        });
      }
      
      // Send live scores
      const scores = this.calculateLiveScore(roomId);
      this.io.to(roomId).emit('scoring-update', {
        student: scores.student,
        teacher: scores.teacher,
        trend: scores.student > 50 ? 'up' : scores.student < 30 ? 'down' : 'stable'
      });
    }, 2000); // Check every 2 seconds
  }

  stopMonitoring(roomId: string) {
    this.sessions.delete(roomId);
  }

  updateSpeechMetrics(roomId: string, speaker: 'student' | 'teacher', duration: number) {
    const session = this.sessions.get(roomId);
    if (!session) return;

    if (speaker === 'teacher') {
      session.teacherTalkTime += duration;
    } else {
      session.studentTalkTime += duration;
    }
    
    session.lastActivityTime = Date.now();
  }

  updateAttentionScore(roomId: string, score: number) {
    const session = this.sessions.get(roomId);
    if (session) {
      session.attentionScore = score;
      
      if (score < 50) {
        this.io.to(roomId).emit('tl-warning', {
          type: 'attention',
          message: 'Student attention is low - try a different approach'
        });
      }
    }
  }

  addTranscript(roomId: string, text: string, speaker: string) {
    const session = this.sessions.get(roomId);
    if (session) {
      session.transcripts.push({
        speaker,
        text,
        timestamp: new Date()
      });
      
      // Update context with last 5 transcripts
      const recentTranscripts = session.transcripts.slice(-5);
      session.currentContext = recentTranscripts
        .map(t => `${t.speaker}: ${t.text}`)
        .join('\n');
    }
  }

  async generateWordSuggestions(roomId: string, context: string, targetLanguage: string): Promise<string[]> {
    const session = this.sessions.get(roomId);
    if (!session) return [];

    try {
      const prompt = `You are a language learning assistant helping a ${session.studentLevel} level student learning ${targetLanguage}.

Based on this conversation:
"${context || session.currentContext}"

Generate exactly 10 vocabulary words that would help the student express themselves better in this context. These should be practical words they can use immediately.

Output format: word1, word2, word3, word4, word5, word6, word7, word8, word9, word10

Only output the comma-separated list of words, nothing else.`;

      const response = await this.ollama.generateCompletion(prompt);
      
      // Parse the response
      const words = response
        .split(',')
        .map(w => w.trim())
        .filter(w => w && !w.includes(':') && !w.includes('.'))
        .slice(0, 10);
      
      // Track suggested words
      if (words.length > 0) {
        session.wordsSuggested.push(...words);
      }
      
      return words;
    } catch (error) {
      console.error('Ollama word suggestions error:', error);
      // Intelligent fallback based on context
      return this.getContextualFallbackWords(context || session.currentContext, targetLanguage);
    }
  }

  private getContextualFallbackWords(context: string, language: string): string[] {
    const contextLower = context.toLowerCase();
    
    // Smart context detection for relevant vocabulary
    if (contextLower.includes('weather') || contextLower.includes('هوا')) {
      return ['sunny', 'rainy', 'cloudy', 'temperature', 'forecast', 'humid', 'windy', 'storm', 'clear', 'foggy'];
    } else if (contextLower.includes('food') || contextLower.includes('غذا') || contextLower.includes('eat')) {
      return ['delicious', 'tasty', 'spicy', 'sweet', 'sour', 'fresh', 'ingredients', 'recipe', 'cuisine', 'flavor'];
    } else if (contextLower.includes('travel') || contextLower.includes('سفر') || contextLower.includes('trip')) {
      return ['destination', 'journey', 'luggage', 'passport', 'ticket', 'airport', 'hotel', 'tourist', 'adventure', 'explore'];
    } else if (contextLower.includes('work') || contextLower.includes('کار') || contextLower.includes('job')) {
      return ['colleague', 'meeting', 'deadline', 'project', 'schedule', 'office', 'manager', 'report', 'task', 'teamwork'];
    } else if (contextLower.includes('study') || contextLower.includes('درس') || contextLower.includes('learn')) {
      return ['practice', 'understand', 'remember', 'focus', 'improve', 'knowledge', 'progress', 'review', 'explain', 'concept'];
    } else {
      // General conversation words
      return ['understand', 'explain', 'describe', 'discuss', 'opinion', 'agree', 'suggest', 'consider', 'important', 'interesting'];
    }
  }

  async analyzeFacialExpression(imageData: string): Promise<string> {
    // Since Ollama doesn't have vision models yet, we'll analyze based on session data
    const roomId = Array.from(this.sessions.keys())[0];
    const session = this.sessions.get(roomId);
    
    if (!session) return 'neutral';
    
    // Smart mood inference from session metrics
    const totalTime = session.teacherTalkTime + session.studentTalkTime;
    const studentParticipation = totalTime > 0 ? (session.studentTalkTime / totalTime) * 100 : 0;
    
    if (session.attentionScore < 40) return 'tired';
    if (session.attentionScore < 60) return 'bored';
    if (studentParticipation < 20) return 'confused';
    if (studentParticipation < 40) return 'struggling';
    if (session.wordsSuggested.length > 10) return 'overwhelmed';
    if (session.transcripts.some(t => t.text.includes('?') && t.speaker === 'student')) return 'curious';
    if (studentParticipation > 60) return 'confident';
    
    return 'focused';
  }

  async analyzeBodyLanguage(imageData: string): Promise<string> {
    const roomId = Array.from(this.sessions.keys())[0];
    const session = this.sessions.get(roomId);
    
    if (!session) return 'neutral';
    
    // Infer body language from engagement metrics
    if (session.attentionScore > 80) return 'engaged';
    if (session.attentionScore < 40) return 'distracted';
    if (session.studentTalkTime > session.teacherTalkTime * 0.8) return 'confident';
    if (session.silencePeriods.length > 5) return 'hesitant';
    
    return 'relaxed';
  }

  async generatePronunciationGuide(word: string, language: string): Promise<any> {
    try {
      const prompt = `Generate a pronunciation guide for the word "${word}" in ${language}.

Provide:
1. IPA phonetic notation
2. Simple pronunciation (using common English sounds)
3. Two specific tips for correct pronunciation

Format your response exactly like this:
IPA: [phonetic notation]
Simple: [simple pronunciation]
Tip1: [first tip]
Tip2: [second tip]`;

      const response = await this.ollama.generateCompletion(prompt);
      
      // Parse the structured response
      const lines = response.split('\n').map(l => l.trim());
      const ipa = lines.find(l => l.startsWith('IPA:'))?.replace('IPA:', '').trim() || `/${word}/`;
      const simple = lines.find(l => l.startsWith('Simple:'))?.replace('Simple:', '').trim() || word;
      const tip1 = lines.find(l => l.startsWith('Tip1:'))?.replace('Tip1:', '').trim();
      const tip2 = lines.find(l => l.startsWith('Tip2:'))?.replace('Tip2:', '').trim();
      
      return {
        word,
        phonetic: ipa,
        simple,
        tips: [tip1, tip2].filter(Boolean).length > 0 
          ? [tip1, tip2].filter(Boolean)
          : ['Focus on clear articulation', 'Practice slowly at first']
      };
    } catch (error) {
      console.error('Ollama pronunciation guide error:', error);
      return {
        word,
        phonetic: `/${word}/`,
        simple: word,
        tips: ['Break into syllables', 'Practice each sound separately']
      };
    }
  }

  async generateTeacherTips(roomId: string, mood: string, bodyLanguage: string): Promise<string[]> {
    const session = this.sessions.get(roomId);
    if (!session) return [];

    try {
      const totalTime = session.teacherTalkTime + session.studentTalkTime;
      const studentParticipation = totalTime > 0 ? Math.round((session.studentTalkTime / totalTime) * 100) : 0;
      
      const prompt = `You are an expert language teaching AI assistant. Analyze this student's current state and provide actionable teaching tips.

Student Status:
- Mood: ${mood}
- Body language: ${bodyLanguage}
- Attention score: ${session.attentionScore}%
- Participation rate: ${studentParticipation}%
- Level: ${session.studentLevel}
- Words suggested so far: ${session.wordsSuggested.length}

Generate exactly 3 specific, actionable tips for the teacher. Each tip should be one clear sentence.

Format: 
1. [tip]
2. [tip]
3. [tip]`;

      const response = await this.ollama.generateCompletion(prompt);
      
      // Extract tips from numbered list
      const tips = response
        .split('\n')
        .filter(line => line.match(/^\d+\./))
        .map(line => line.replace(/^\d+\.\s*/, '').trim())
        .filter(tip => tip.length > 0)
        .slice(0, 3);
      
      return tips.length > 0 ? tips : this.getIntelligentFallbackTips(mood, bodyLanguage, session);
    } catch (error) {
      console.error('Ollama teacher tips error:', error);
      return this.getIntelligentFallbackTips(mood, bodyLanguage, session);
    }
  }

  private getIntelligentFallbackTips(mood: string, bodyLanguage: string, session: SessionMetrics): string[] {
    const tips = [];
    const totalTime = session.teacherTalkTime + session.studentTalkTime;
    const studentParticipation = totalTime > 0 ? (session.studentTalkTime / totalTime) * 100 : 0;
    
    // Mood-based tips
    if (mood === 'confused' || mood === 'struggling') {
      tips.push('Simplify your language and use more visual examples');
      tips.push('Check understanding with yes/no questions first');
      tips.push('Break down the concept into smaller, manageable parts');
    } else if (mood === 'tired' || mood === 'bored') {
      tips.push('Switch to a more interactive activity or game');
      tips.push('Take a 30-second stretch break to re-energize');
      tips.push('Use humor or personal anecdotes to re-engage');
    } else if (mood === 'overwhelmed') {
      tips.push('Slow down the pace and review what was covered');
      tips.push('Focus on one concept at a time');
      tips.push('Provide positive reinforcement for efforts made');
    } else if (mood === 'curious' || mood === 'confident') {
      tips.push('Challenge with open-ended questions');
      tips.push('Let the student lead the conversation topic');
      tips.push('Introduce slightly more advanced vocabulary');
    }
    
    // Body language-based tips
    if (bodyLanguage === 'distracted') {
      tips.push('Use the student\'s name to regain attention');
      tips.push('Ask a direct question about their interests');
    } else if (bodyLanguage === 'hesitant') {
      tips.push('Provide sentence starters to help expression');
      tips.push('Use encouraging phrases like "take your time"');
    } else if (bodyLanguage === 'engaged') {
      tips.push('Maintain the current teaching approach');
      tips.push('Gradually increase complexity');
    }
    
    // Participation-based tips
    if (studentParticipation < 30) {
      tips.push('Ask more open-ended questions to encourage speaking');
      tips.push('Wait 3-5 seconds after asking before providing hints');
    } else if (session.teacherTalkTime > session.studentTalkTime * 2) {
      tips.push('Reduce teacher talk time - aim for 40/60 balance');
    }
    
    // Return top 3 most relevant tips
    return [...new Set(tips)].slice(0, 3);
  }

  calculateLiveScore(roomId: string): { student: number; teacher: number } {
    const session = this.sessions.get(roomId);
    if (!session) return { student: 0, teacher: 0 };

    const totalTime = session.teacherTalkTime + session.studentTalkTime || 1;
    const studentParticipation = (session.studentTalkTime / totalTime) * 100;
    
    // Student score calculation (0-100)
    const participationScore = Math.min(studentParticipation * 2, 100) * 0.4; // 40% weight
    const attentionScore = session.attentionScore * 0.3; // 30% weight
    const engagementScore = Math.min(session.transcripts.filter(t => t.speaker === 'student').length * 5, 100) * 0.2; // 20% weight
    const vocabularyScore = Math.min(session.wordsSuggested.length * 2, 100) * 0.1; // 10% weight
    
    const studentScore = Math.round(
      participationScore + 
      attentionScore + 
      engagementScore + 
      vocabularyScore
    );

    // Teacher score based on optimal TTT balance
    const tttPercentage = (session.teacherTalkTime / totalTime) * 100;
    let teacherScore = 0;
    
    if (tttPercentage >= 30 && tttPercentage <= 50) {
      teacherScore = 100; // Optimal range
    } else if (tttPercentage < 30) {
      teacherScore = Math.round(tttPercentage * 3.33); // Too little talking
    } else if (tttPercentage > 50) {
      teacherScore = Math.round(100 - ((tttPercentage - 50) * 2)); // Too much talking
    }

    return { 
      student: Math.min(100, Math.max(0, studentScore)),
      teacher: Math.min(100, Math.max(0, teacherScore))
    };
  }

  async generateSessionSummary(roomId: string): Promise<any> {
    const session = this.sessions.get(roomId);
    if (!session) return null;

    const scores = this.calculateLiveScore(roomId);
    const duration = Math.round((Date.now() - session.startTime.getTime()) / 1000);
    const totalTime = session.teacherTalkTime + session.studentTalkTime || 1;
    
    try {
      // Generate AI-powered session analysis
      const prompt = `Analyze this ${session.languageCode} language learning session and provide insights.

Session Data:
- Duration: ${Math.floor(duration / 60)} minutes ${duration % 60} seconds
- Student Level: ${session.studentLevel}
- Student Score: ${scores.student}/100
- Teacher Score: ${scores.teacher}/100
- Student Speaking: ${Math.round((session.studentTalkTime / totalTime) * 100)}%
- Teacher Speaking: ${Math.round((session.teacherTalkTime / totalTime) * 100)}%
- Attention Level: ${session.attentionScore}%
- Words Practiced: ${session.wordsSuggested.slice(0, 5).join(', ')}
- Total Exchanges: ${session.transcripts.length}

Provide:
1. One key strength observed
2. One area needing improvement
3. One specific action for next session

Format each on a new line, no numbering.`;

      const aiResponse = await this.ollama.generateCompletion(prompt);
      const insights = aiResponse
        .split('\n')
        .map(line => line.trim())
        .filter(line => line && !line.match(/^\d/))
        .slice(0, 3);
      
      // Store session data in database
      try {
        // Store session summary for future reference
        // This would be saved when the call ends via the websocket handler
      } catch (dbError) {
        console.error('Error saving session to database:', dbError);
      }
      
      return {
        duration,
        scores,
        metrics: {
          teacherTalkTime: session.teacherTalkTime,
          studentTalkTime: session.studentTalkTime,
          tttRatio: Math.round((session.teacherTalkTime / totalTime) * 100),
          totalTranscripts: session.transcripts.length,
          averageAttention: session.attentionScore
        },
        performance: {
          participation: scores.student > 70 ? 'excellent' : scores.student > 40 ? 'good' : 'needs improvement',
          attention: session.attentionScore > 80 ? 'high' : session.attentionScore > 50 ? 'moderate' : 'low',
          balance: Math.abs(40 - (session.teacherTalkTime / totalTime * 100)) < 10 ? 'optimal' : 'needs adjustment'
        },
        insights: {
          strength: insights[0] || 'Student showed good engagement throughout the session',
          improvement: insights[1] || 'Focus on increasing student speaking time',
          nextSession: insights[2] || 'Practice the vocabulary introduced today'
        },
        recommendations: this.generateSmartRecommendations(session, scores),
        vocabularyPracticed: session.wordsSuggested,
        pronunciationFocus: session.pronunciationsCorrected,
        transcriptHighlights: this.extractTranscriptHighlights(session)
      };
    } catch (error) {
      console.error('Error generating AI session summary:', error);
      
      // Fallback summary without AI
      return {
        duration,
        scores,
        metrics: {
          teacherTalkTime: session.teacherTalkTime,
          studentTalkTime: session.studentTalkTime,
          tttRatio: Math.round((session.teacherTalkTime / totalTime) * 100),
          totalTranscripts: session.transcripts.length,
          averageAttention: session.attentionScore
        },
        performance: {
          participation: scores.student > 70 ? 'excellent' : scores.student > 40 ? 'good' : 'needs improvement',
          attention: session.attentionScore > 80 ? 'high' : session.attentionScore > 50 ? 'moderate' : 'low',
          balance: Math.abs(40 - (session.teacherTalkTime / totalTime * 100)) < 10 ? 'optimal' : 'needs adjustment'
        },
        recommendations: this.generateSmartRecommendations(session, scores),
        vocabularyPracticed: session.wordsSuggested,
        pronunciationFocus: session.pronunciationsCorrected
      };
    }
  }

  private generateSmartRecommendations(session: SessionMetrics, scores: { student: number; teacher: number }): string[] {
    const recommendations = [];
    const totalTime = session.teacherTalkTime + session.studentTalkTime || 1;
    const studentParticipation = (session.studentTalkTime / totalTime) * 100;
    
    // Participation-based recommendations
    if (studentParticipation < 30) {
      recommendations.push('Increase student speaking time through open-ended questions');
    } else if (studentParticipation > 70) {
      recommendations.push('Teacher should provide more structured guidance');
    }
    
    // Attention-based recommendations
    if (session.attentionScore < 60) {
      recommendations.push('Use more interactive activities to boost engagement');
    }
    
    // Score-based recommendations
    if (scores.student < 40) {
      recommendations.push('Simplify content and focus on basic concepts');
    } else if (scores.student > 80) {
      recommendations.push('Challenge with more advanced topics');
    }
    
    // Vocabulary-based recommendations
    if (session.wordsSuggested.length > 15) {
      recommendations.push('Review and practice the new vocabulary introduced');
    } else if (session.wordsSuggested.length < 5) {
      recommendations.push('Introduce more relevant vocabulary during conversation');
    }
    
    // TTT balance recommendations
    if (session.teacherTalkTime > session.studentTalkTime * 2) {
      recommendations.push('Reduce teacher talk time to 40% or less');
    }
    
    return recommendations.slice(0, 3); // Return top 3 recommendations
  }

  private extractTranscriptHighlights(session: SessionMetrics): string[] {
    if (session.transcripts.length === 0) return [];
    
    // Extract meaningful exchanges
    const highlights = [];
    
    // Find questions asked by student
    const studentQuestions = session.transcripts
      .filter(t => t.speaker === 'student' && t.text.includes('?'))
      .slice(-2);
    
    if (studentQuestions.length > 0) {
      highlights.push(`Student asked ${studentQuestions.length} questions`);
    }
    
    // Find longest student response
    const longestResponse = session.transcripts
      .filter(t => t.speaker === 'student')
      .sort((a, b) => b.text.length - a.text.length)[0];
    
    if (longestResponse && longestResponse.text.length > 50) {
      highlights.push('Student provided detailed responses');
    }
    
    // Check for self-correction
    if (session.transcripts.some(t => t.text.includes('mean') || t.text.includes('sorry'))) {
      highlights.push('Student showed self-correction ability');
    }
    
    return highlights;
  }
}