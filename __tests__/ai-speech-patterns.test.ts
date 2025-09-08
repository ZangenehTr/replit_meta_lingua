import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock AI Speech Pattern Recognition Service
class AISpeechPatternAnalyzer {
  private conversationHistory: Array<{
    speaker: 'teacher' | 'student';
    text: string;
    timestamp: number;
    confidence: number;
  }> = [];

  private patterns = {
    hesitation: [
      /\b(um|uh|er|hmm)\b/gi,
      /\b(how do I say|what's the word|I don't know how to)\b/gi,
      /\.{3,}|\b(pause|wait)\b/gi
    ],
    confusion: [
      /\b(I don't understand|confused|what do you mean)\b/gi,
      /\b(can you explain|I'm lost|not sure)\b/gi,
      /\?\s*\?+/gi // Multiple question marks
    ],
    engagement: [
      /\b(interesting|really|wow|amazing|cool)\b/gi,
      /\b(I think|in my opinion|I believe)\b/gi,
      /\b(yes|exactly|right|agree)\b/gi
    ],
    needsHelp: [
      /\b(help|can you|could you|assistance)\b/gi,
      /\b(don't know|not sure|unclear)\b/gi,
      /\b(repeat|again|slower)\b/gi
    ],
    fluency: [
      /\b(actually|specifically|furthermore|however|therefore)\b/gi,
      /\b(in addition|moreover|consequently|nevertheless)\b/gi,
      /[,;:].*\b(which|that|who|where|when)\b/gi // Complex sentence structures
    ]
  };

  analyzeText(speaker: 'teacher' | 'student', text: string): {
    patterns: string[];
    confidence: number;
    suggestions: string[];
    needsIntervention: boolean;
  } {
    const detectedPatterns: string[] = [];
    let totalMatches = 0;
    
    // Analyze each pattern category
    Object.entries(this.patterns).forEach(([patternType, regexes]) => {
      const matches = regexes.reduce((count, regex) => {
        const found = (text.match(regex) || []).length;
        return count + found;
      }, 0);
      
      if (matches > 0) {
        detectedPatterns.push(patternType);
        totalMatches += matches;
      }
    });

    // Calculate confidence based on text length and pattern density
    const confidence = Math.min(0.95, totalMatches / Math.max(text.split(' ').length, 5));
    
    // Generate contextual suggestions
    const suggestions = this.generateContextualSuggestions(detectedPatterns, speaker, text);
    
    // Determine if intervention is needed
    const needsIntervention = this.shouldIntervene(detectedPatterns, speaker, confidence);

    // Store in conversation history
    this.conversationHistory.push({
      speaker,
      text,
      timestamp: Date.now(),
      confidence
    });

    return {
      patterns: detectedPatterns,
      confidence,
      suggestions,
      needsIntervention
    };
  }

  private generateContextualSuggestions(patterns: string[], speaker: 'teacher' | 'student', text: string): string[] {
    const suggestions: string[] = [];
    
    if (patterns.includes('hesitation') && speaker === 'student') {
      if (text.toLowerCase().includes('travel')) {
        suggestions.push('Try: "I enjoy visiting different countries"');
        suggestions.push('Use: "explore" instead of "go to"');
      } else if (text.toLowerCase().includes('work')) {
        suggestions.push('Try: "I work in the field of..."');
        suggestions.push('Use: "career" instead of "job"');
      } else {
        suggestions.push('Take your time - use connecting words like "actually" or "specifically"');
        suggestions.push('Try: "What I mean is..." to clarify your thoughts');
      }
    }
    
    if (patterns.includes('confusion') && speaker === 'student') {
      suggestions.push('Ask: "Could you give me an example?"');
      suggestions.push('Say: "I need clarification on..."');
      suggestions.push('Try: "Let me rephrase what I understand..."');
    }
    
    if (patterns.includes('needsHelp') && speaker === 'student') {
      suggestions.push('Grammar help available - click the grammar button');
      suggestions.push('Word suggestions can help - try the vocabulary tool');
    }
    
    if (patterns.includes('hesitation') && speaker === 'teacher') {
      suggestions.push('Use visual aids or screen sharing');
      suggestions.push('Break down complex topics into smaller parts');
      suggestions.push('Ask comprehension questions: "Does that make sense?"');
    }

    return suggestions;
  }

  private shouldIntervene(patterns: string[], speaker: 'teacher' | 'student', confidence: number): boolean {
    // High confidence struggling patterns
    if (confidence > 0.3) {
      if (patterns.includes('confusion') || patterns.includes('needsHelp')) {
        return true;
      }
      
      // Multiple hesitation patterns indicate need for help
      if (patterns.includes('hesitation') && speaker === 'student') {
        const recentHesitation = this.getRecentPatternCount('hesitation', 60000); // Last minute
        return recentHesitation >= 3;
      }
    }
    
    return false;
  }

  generateLiveActivity(conversationContext: string[], topic: string): {
    activityType: 'poll' | 'gap-fill' | 'matching' | 'word-selection' | 'vocabulary-game';
    content: any;
    rationale: string;
  } | null {
    const recentTexts = conversationContext.join(' ').toLowerCase();
    
    // Analyze what type of activity would help based on conversation content
    if (recentTexts.includes('weather') || recentTexts.includes('rain') || recentTexts.includes('sunny')) {
      return {
        activityType: 'vocabulary-game',
        content: {
          type: 'matching',
          title: 'Weather Vocabulary Match',
          items: [
            { word: 'sunny', match: '☀️ bright and clear' },
            { word: 'rainy', match: '🌧️ water falling from clouds' },
            { word: 'cloudy', match: '☁️ gray sky with clouds' },
            { word: 'windy', match: '💨 air moving fast' }
          ]
        },
        rationale: 'Weather vocabulary practice based on conversation topic'
      };
    }
    
    if (recentTexts.includes('travel') || recentTexts.includes('visit') || recentTexts.includes('country')) {
      return {
        activityType: 'word-selection',
        content: {
          title: 'Choose the Best Travel Word',
          sentence: 'I want to [CHOOSE] different countries and learn about cultures.',
          options: ['see', 'visit', 'watch', 'look at'],
          correct: 'visit'
        },
        rationale: 'Travel vocabulary precision based on conversation context'
      };
    }
    
    if (recentTexts.includes('food') || recentTexts.includes('restaurant') || recentTexts.includes('eat')) {
      return {
        activityType: 'gap-fill',
        content: {
          title: 'Restaurant Conversation',
          sentence: 'I would like to ____ a table for two people at 7 PM.',
          options: ['book', 'reserve', 'get', 'buy'],
          correct: 'book'
        },
        rationale: 'Restaurant vocabulary practice from food discussion'
      };
    }
    
    if (recentTexts.includes('work') || recentTexts.includes('job') || recentTexts.includes('career')) {
      return {
        activityType: 'poll',
        content: {
          question: 'What\'s most important in choosing a career?',
          options: ['Good salary', 'Work-life balance', 'Career growth', 'Interesting work'],
          anonymous: true
        },
        rationale: 'Career discussion poll based on work conversation'
      };
    }
    
    return null;
  }

  analyzeConversationFlow(windowMs: number = 300000): {
    dominantSpeaker: 'teacher' | 'student' | 'balanced';
    engagementLevel: number;
    complexityLevel: 'beginner' | 'intermediate' | 'advanced';
    recommendedActions: string[];
  } {
    const cutoff = Date.now() - windowMs;
    const recentConversation = this.conversationHistory.filter(c => c.timestamp > cutoff);
    
    if (recentConversation.length === 0) {
      return {
        dominantSpeaker: 'balanced',
        engagementLevel: 50,
        complexityLevel: 'intermediate',
        recommendedActions: ['Start conversation to analyze patterns']
      };
    }
    
    // Calculate speaker balance
    const teacherCount = recentConversation.filter(c => c.speaker === 'teacher').length;
    const studentCount = recentConversation.filter(c => c.speaker === 'student').length;
    const totalCount = recentConversation.length;
    
    let dominantSpeaker: 'teacher' | 'student' | 'balanced';
    if (teacherCount / totalCount > 0.7) {
      dominantSpeaker = 'teacher';
    } else if (studentCount / totalCount > 0.7) {
      dominantSpeaker = 'student';
    } else {
      dominantSpeaker = 'balanced';
    }
    
    // Calculate engagement based on patterns and response length
    const engagementPatterns = recentConversation.filter(c => 
      c.speaker === 'student' && 
      this.patterns.engagement.some(regex => regex.test(c.text))
    ).length;
    
    const avgStudentResponseLength = recentConversation
      .filter(c => c.speaker === 'student')
      .reduce((sum, c) => sum + c.text.split(' ').length, 0) / Math.max(studentCount, 1);
    
    const engagementLevel = Math.min(100, Math.max(20, 
      (engagementPatterns * 15) + 
      (avgStudentResponseLength * 2) + 
      (dominantSpeaker === 'student' ? 20 : dominantSpeaker === 'balanced' ? 10 : 0)
    ));
    
    // Determine complexity level
    const studentTexts = recentConversation
      .filter(c => c.speaker === 'student')
      .map(c => c.text)
      .join(' ');
    
    const fluencyMatches = this.patterns.fluency.reduce((count, regex) => {
      return count + (studentTexts.match(regex) || []).length;
    }, 0);
    
    let complexityLevel: 'beginner' | 'intermediate' | 'advanced';
    if (fluencyMatches > 5 && avgStudentResponseLength > 15) {
      complexityLevel = 'advanced';
    } else if (fluencyMatches > 2 && avgStudentResponseLength > 8) {
      complexityLevel = 'intermediate';
    } else {
      complexityLevel = 'beginner';
    }
    
    // Generate recommendations
    const recommendedActions: string[] = [];
    
    if (dominantSpeaker === 'teacher') {
      recommendedActions.push('Encourage more student participation');
      recommendedActions.push('Ask open-ended questions');
    } else if (dominantSpeaker === 'student') {
      recommendedActions.push('Provide more guidance and structure');
    }
    
    if (engagementLevel < 40) {
      recommendedActions.push('Try interactive activities to boost engagement');
      recommendedActions.push('Change topic or use visual aids');
    }
    
    const recentHesitation = this.getRecentPatternCount('hesitation', windowMs);
    if (recentHesitation > 5) {
      recommendedActions.push('Provide vocabulary support');
      recommendedActions.push('Generate word suggestions for student');
    }
    
    return {
      dominantSpeaker,
      engagementLevel: Math.round(engagementLevel),
      complexityLevel,
      recommendedActions
    };
  }

  private getRecentPatternCount(patternType: string, windowMs: number): number {
    const cutoff = Date.now() - windowMs;
    return this.conversationHistory
      .filter(c => c.timestamp > cutoff)
      .reduce((count, c) => {
        const hasPattern = this.patterns[patternType as keyof typeof this.patterns]
          .some(regex => regex.test(c.text));
        return count + (hasPattern ? 1 : 0);
      }, 0);
  }

  getPersonalizedSuggestions(studentLevel: string, recentPerformance: number): {
    vocabularyLevel: string[];
    grammarFocus: string[];
    conversationTopics: string[];
  } {
    const baseVocabulary = {
      'A1': ['introduce', 'hello', 'thank you', 'please', 'excuse me'],
      'A2': ['actually', 'because', 'however', 'opinion', 'experience'],
      'B1': ['furthermore', 'nevertheless', 'consequently', 'elaborate', 'perspective'],
      'B2': ['sophisticated', 'comprehensive', 'substantial', 'inevitable', 'paradigm']
    };
    
    const grammarFocus = {
      'A1': ['present simple', 'basic questions', 'singular/plural'],
      'A2': ['past tense', 'future plans', 'comparatives'],  
      'B1': ['conditionals', 'reported speech', 'passive voice'],
      'B2': ['advanced conditionals', 'subjunctive', 'complex sentences']
    };
    
    const topics = {
      'A1': ['daily routine', 'family', 'food', 'weather'],
      'A2': ['travel', 'work', 'hobbies', 'health'],
      'B1': ['education', 'environment', 'culture', 'technology'],
      'B2': ['politics', 'philosophy', 'economics', 'global issues']
    };
    
    const level = studentLevel in baseVocabulary ? studentLevel : 'B1';
    
    // Adjust based on performance
    let vocabularyLevel = baseVocabulary[level as keyof typeof baseVocabulary];
    let currentGrammarFocus = grammarFocus[level as keyof typeof grammarFocus];
    let conversationTopics = topics[level as keyof typeof topics];
    
    if (recentPerformance > 85) {
      // High performance - challenge with next level
      const levels = ['A1', 'A2', 'B1', 'B2'];
      const currentIndex = levels.indexOf(level);
      if (currentIndex < levels.length - 1) {
        const nextLevel = levels[currentIndex + 1];
        vocabularyLevel = [...vocabularyLevel, ...baseVocabulary[nextLevel as keyof typeof baseVocabulary].slice(0, 2)];
        conversationTopics = [...conversationTopics, ...topics[nextLevel as keyof typeof topics].slice(0, 1)];
      }
    } else if (recentPerformance < 60) {
      // Lower performance - reinforce current level
      vocabularyLevel = vocabularyLevel.slice(0, 3); // Focus on fewer words
      currentGrammarFocus = currentGrammarFocus.slice(0, 2); // Fewer grammar points
    }
    
    return {
      vocabularyLevel,
      grammarFocus: currentGrammarFocus,
      conversationTopics
    };
  }
}

describe('Context-Aware AI Speech Pattern Recognition', () => {
  let speechAnalyzer: AISpeechPatternAnalyzer;

  beforeEach(() => {
    speechAnalyzer = new AISpeechPatternAnalyzer();
  });

  describe('Pattern Detection', () => {
    it('should detect hesitation patterns in student speech', () => {
      const hesitantText = "Um, I think... how do I say... I want to go to the store but, uh, I don't know the way.";
      
      const analysis = speechAnalyzer.analyzeText('student', hesitantText);
      
      expect(analysis.patterns).toContain('hesitation');
      expect(analysis.confidence).toBeGreaterThan(0.2);
      expect(analysis.suggestions).toContain(expect.stringContaining('connecting words'));
    });

    it('should detect confusion signals', () => {
      const confusedText = "I don't understand what you mean. Can you explain again? I'm confused about this topic.";
      
      const analysis = speechAnalyzer.analyzeText('student', confusedText);
      
      expect(analysis.patterns).toContain('confusion');
      expect(analysis.needsIntervention).toBe(true);
      expect(analysis.suggestions).toContain(expect.stringContaining('example'));
    });

    it('should detect engagement patterns', () => {
      const engagedText = "That's really interesting! I think this is amazing. In my opinion, this approach is exactly right.";
      
      const analysis = speechAnalyzer.analyzeText('student', engagedText);
      
      expect(analysis.patterns).toContain('engagement');
      expect(analysis.needsIntervention).toBe(false);
      expect(analysis.confidence).toBeGreaterThan(0.3);
    });

    it('should detect fluency markers', () => {
      const fluentText = "Actually, I believe that furthermore, this approach is sophisticated. However, we should consider the consequences.";
      
      const analysis = speechAnalyzer.analyzeText('student', fluentText);
      
      expect(analysis.patterns).toContain('fluency');
      expect(analysis.confidence).toBeGreaterThan(0.4);
    });
  });

  describe('Contextual Activity Generation', () => {
    it('should generate weather activities from weather conversation', () => {
      const conversationContext = [
        "Today is very sunny outside",
        "I love rainy days",
        "The weather is quite cloudy"
      ];
      
      const activity = speechAnalyzer.generateLiveActivity(conversationContext, 'weather');
      
      expect(activity).not.toBeNull();
      expect(activity?.activityType).toBe('vocabulary-game');
      expect(activity?.content.items).toEqual(expect.arrayContaining([
        expect.objectContaining({ word: 'sunny' }),
        expect.objectContaining({ word: 'rainy' })
      ]));
      expect(activity?.rationale).toContain('Weather vocabulary');
    });

    it('should generate travel activities from travel conversation', () => {
      const conversationContext = [
        "I love to travel to different countries",
        "Last year I visited France",
        "I want to explore more places"
      ];
      
      const activity = speechAnalyzer.generateLiveActivity(conversationContext, 'travel');
      
      expect(activity).not.toBeNull();
      expect(activity?.activityType).toBe('word-selection');
      expect(activity?.content.correct).toBe('visit');
      expect(activity?.content.options).toContain('visit');
    });

    it('should generate work activities from career discussion', () => {
      const conversationContext = [
        "I work in marketing",
        "My job is very interesting",
        "Career development is important"
      ];
      
      const activity = speechAnalyzer.generateLiveActivity(conversationContext, 'career');
      
      expect(activity).not.toBeNull();
      expect(activity?.activityType).toBe('poll');
      expect(activity?.content.question).toContain('career');
      expect(activity?.content.options).toContain('Work-life balance');
    });

    it('should return null for unmatched conversation topics', () => {
      const conversationContext = [
        "This is about quantum physics",
        "The mathematical equation is complex"
      ];
      
      const activity = speechAnalyzer.generateLiveActivity(conversationContext, 'science');
      
      expect(activity).toBeNull();
    });
  });

  describe('Conversation Flow Analysis', () => {
    it('should identify teacher-dominated conversation', () => {
      // Simulate teacher talking too much
      for (let i = 0; i < 8; i++) {
        speechAnalyzer.analyzeText('teacher', `Teacher explanation number ${i}. This is important to understand.`);
      }
      for (let i = 0; i < 2; i++) {
        speechAnalyzer.analyzeText('student', `Student response ${i}.`);
      }
      
      const flow = speechAnalyzer.analyzeConversationFlow();
      
      expect(flow.dominantSpeaker).toBe('teacher');
      expect(flow.recommendedActions).toContain('Encourage more student participation');
    });

    it('should detect low engagement and recommend actions', () => {
      // Simulate disengaged student responses
      for (let i = 0; i < 5; i++) {
        speechAnalyzer.analyzeText('student', 'Yes. OK. I see.');
        speechAnalyzer.analyzeText('teacher', 'What do you think about this topic? Can you elaborate more?');
      }
      
      const flow = speechAnalyzer.analyzeConversationFlow();
      
      expect(flow.engagementLevel).toBeLessThan(50);
      expect(flow.recommendedActions).toContain(expect.stringMatching(/interactive activities|engagement/));
    });

    it('should assess complexity level from student language', () => {
      // Simulate advanced student language
      const advancedTexts = [
        'Actually, I believe that furthermore, this perspective is quite sophisticated.',
        'However, we should consider the consequences of this approach.',
        'Nevertheless, I think the benefits outweigh the disadvantages.'
      ];
      
      advancedTexts.forEach(text => {
        speechAnalyzer.analyzeText('student', text);
      });
      
      const flow = speechAnalyzer.analyzeConversationFlow();
      
      expect(flow.complexityLevel).toBe('advanced');
    });

    it('should identify need for vocabulary support', () => {
      // Simulate multiple hesitation patterns
      const hesitantTexts = [
        'Um, I want to... what\'s the word... go to the place',
        'How do I say... the thing that you use for... um...',
        'I don\'t know how to express this... er... the concept is...'
      ];
      
      hesitantTexts.forEach(text => {
        speechAnalyzer.analyzeText('student', text);
      });
      
      const flow = speechAnalyzer.analyzeConversationFlow();
      
      expect(flow.recommendedActions).toContain('Provide vocabulary support');
    });
  });

  describe('Personalized Learning Suggestions', () => {
    it('should provide appropriate suggestions for A1 level student', () => {
      const suggestions = speechAnalyzer.getPersonalizedSuggestions('A1', 75);
      
      expect(suggestions.vocabularyLevel).toContain('hello');
      expect(suggestions.vocabularyLevel).toContain('thank you');
      expect(suggestions.grammarFocus).toContain('present simple');
      expect(suggestions.conversationTopics).toContain('daily routine');
    });

    it('should challenge high-performing students with next level content', () => {
      const suggestions = speechAnalyzer.getPersonalizedSuggestions('B1', 90);
      
      expect(suggestions.vocabularyLevel.length).toBeGreaterThan(5); // Should include B2 words
      expect(suggestions.conversationTopics.length).toBeGreaterThan(4); // Should include B2 topics
    });

    it('should simplify content for struggling students', () => {
      const suggestions = speechAnalyzer.getPersonalizedSuggestions('B1', 45);
      
      expect(suggestions.vocabularyLevel.length).toBe(3); // Focused on fewer words
      expect(suggestions.grammarFocus.length).toBe(2);    // Fewer grammar points
    });

    it('should handle invalid student levels gracefully', () => {
      const suggestions = speechAnalyzer.getPersonalizedSuggestions('C2', 75);
      
      expect(suggestions).toHaveProperty('vocabularyLevel');
      expect(suggestions).toHaveProperty('grammarFocus');
      expect(suggestions).toHaveProperty('conversationTopics');
    });
  });

  describe('Real-time Intervention Logic', () => {
    it('should trigger intervention for multiple confusion patterns', () => {
      const confusedTexts = [
        "I don't understand this",
        "Can you help me with this?",
        "I'm really confused about what you mean"
      ];
      
      const results = confusedTexts.map(text => 
        speechAnalyzer.analyzeText('student', text)
      );
      
      expect(results.some(r => r.needsIntervention)).toBe(true);
    });

    it('should not trigger intervention for minor hesitation', () => {
      const minorHesitation = "Um, I think this is good.";
      
      const result = speechAnalyzer.analyzeText('student', minorHesitation);
      
      expect(result.needsIntervention).toBe(false);
    });

    it('should provide contextual help based on conversation topic', () => {
      const travelHesitation = "Um, I want to... how do I say... travel to different places.";
      
      const result = speechAnalyzer.analyzeText('student', travelHesitation);
      
      expect(result.suggestions).toContain(expect.stringContaining('visit'));
      expect(result.suggestions).toContain(expect.stringContaining('explore'));
    });
  });
});