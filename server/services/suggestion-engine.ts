// Suggestion Engine Service
// Generates vocabulary suggestions based on context and keywords

export interface VocabSuggestion {
  term: string;
  partOfSpeech: string;
  cefrLevel: string;
  definition: string;
  example: string;
  relatedTerms?: string[];
}

class SuggestionEngine {
  private vocabularyDatabase: Map<string, VocabSuggestion>;
  
  constructor() {
    // Initialize with sample vocabulary database
    // In production, this would connect to a comprehensive language database
    this.vocabularyDatabase = new Map([
      ['accomplish', {
        term: 'accomplish',
        partOfSpeech: 'verb',
        cefrLevel: 'B2',
        definition: 'to succeed in doing something, especially after trying hard',
        example: 'She accomplished her goal of learning English in one year.',
        relatedTerms: ['achieve', 'complete', 'fulfill']
      }],
      ['elaborate', {
        term: 'elaborate',
        partOfSpeech: 'adjective/verb',
        cefrLevel: 'C1',
        definition: 'containing a lot of detail or careful planning; to explain in more detail',
        example: 'Could you elaborate on your answer?',
        relatedTerms: ['detailed', 'complex', 'explain']
      }],
      ['essential', {
        term: 'essential',
        partOfSpeech: 'adjective',
        cefrLevel: 'B1',
        definition: 'extremely important and necessary',
        example: 'Water is essential for life.',
        relatedTerms: ['necessary', 'vital', 'crucial']
      }],
      ['furthermore', {
        term: 'furthermore',
        partOfSpeech: 'adverb',
        cefrLevel: 'B2',
        definition: 'in addition to what has already been said',
        example: 'The plan is too expensive. Furthermore, it would take too long.',
        relatedTerms: ['moreover', 'additionally', 'besides']
      }],
      ['nevertheless', {
        term: 'nevertheless',
        partOfSpeech: 'adverb',
        cefrLevel: 'B2',
        definition: 'despite what has just been said',
        example: 'The weather was terrible. Nevertheless, we enjoyed our trip.',
        relatedTerms: ['however', 'nonetheless', 'still']
      }]
    ]);
  }
  
  // Generate suggestions based on keywords in the conversation
  async generateSuggestions(keywords: string[], targetLevel?: string): Promise<VocabSuggestion[]> {
    const suggestions: VocabSuggestion[] = [];
    
    // Find relevant vocabulary based on keywords
    for (const keyword of keywords) {
      const relatedTerms = this.findRelatedVocabulary(keyword, targetLevel);
      suggestions.push(...relatedTerms);
    }
    
    // Remove duplicates and limit to top suggestions
    const uniqueSuggestions = this.removeDuplicates(suggestions);
    return uniqueSuggestions.slice(0, 10);
  }
  
  // Find vocabulary related to a keyword
  private findRelatedVocabulary(keyword: string, targetLevel?: string): VocabSuggestion[] {
    const related: VocabSuggestion[] = [];
    
    // Direct match
    const directMatch = this.vocabularyDatabase.get(keyword.toLowerCase());
    if (directMatch) {
      related.push(directMatch);
    }
    
    // Find semantically related terms
    for (const [term, suggestion] of this.vocabularyDatabase) {
      // Check if target level matches (if specified)
      if (targetLevel && suggestion.cefrLevel !== targetLevel) {
        continue;
      }
      
      // Check for related terms
      if (suggestion.relatedTerms?.includes(keyword.toLowerCase())) {
        related.push(suggestion);
      }
      
      // Check if keyword appears in definition or example
      if (suggestion.definition.toLowerCase().includes(keyword.toLowerCase()) ||
          suggestion.example.toLowerCase().includes(keyword.toLowerCase())) {
        related.push(suggestion);
      }
    }
    
    return related;
  }
  
  // Generate contextual suggestions based on conversation topic
  async generateContextualSuggestions(topic: string, level: string = 'B1'): Promise<VocabSuggestion[]> {
    // Topic-based vocabulary suggestions
    const topicVocabulary: { [key: string]: VocabSuggestion[] } = {
      'travel': [
        {
          term: 'itinerary',
          partOfSpeech: 'noun',
          cefrLevel: 'B2',
          definition: 'a detailed plan of a journey',
          example: 'We planned our itinerary weeks before the trip.'
        },
        {
          term: 'accommodation',
          partOfSpeech: 'noun',
          cefrLevel: 'B1',
          definition: 'a place to stay, such as a hotel',
          example: 'We booked our accommodation online.'
        }
      ],
      'business': [
        {
          term: 'negotiate',
          partOfSpeech: 'verb',
          cefrLevel: 'B2',
          definition: 'to discuss something to reach an agreement',
          example: 'We need to negotiate the terms of the contract.'
        },
        {
          term: 'deadline',
          partOfSpeech: 'noun',
          cefrLevel: 'B1',
          definition: 'a time by which something must be done',
          example: 'The deadline for the project is next Friday.'
        }
      ],
      'education': [
        {
          term: 'curriculum',
          partOfSpeech: 'noun',
          cefrLevel: 'B2',
          definition: 'the subjects that are taught in a school or college',
          example: 'The curriculum includes math, science, and languages.'
        },
        {
          term: 'assignment',
          partOfSpeech: 'noun',
          cefrLevel: 'B1',
          definition: 'a piece of work given to students',
          example: 'The teacher gave us a difficult assignment.'
        }
      ]
    };
    
    const suggestions = topicVocabulary[topic.toLowerCase()] || [];
    
    // Filter by level if needed
    return suggestions.filter(s => {
      const levelOrder = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
      const targetIndex = levelOrder.indexOf(level);
      const suggestionIndex = levelOrder.indexOf(s.cefrLevel);
      // Return suggestions at or below target level
      return suggestionIndex <= targetIndex + 1;
    });
  }
  
  // Extract keywords from text for suggestion generation
  extractKeywords(text: string): string[] {
    // Simple keyword extraction
    // In production, would use NLP techniques
    const stopWords = new Set([
      'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
      'is', 'are', 'was', 'were', 'be', 'been', 'have', 'has', 'had',
      'do', 'does', 'did', 'will', 'would', 'could', 'should', 'may', 'might'
    ]);
    
    const words = text.toLowerCase()
      .replace(/[^\w\s]/g, '')
      .split(/\s+/)
      .filter(word => word.length > 3 && !stopWords.has(word));
    
    // Count frequency
    const frequency: { [key: string]: number } = {};
    for (const word of words) {
      frequency[word] = (frequency[word] || 0) + 1;
    }
    
    // Sort by frequency and return top keywords
    return Object.entries(frequency)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5)
      .map(([word]) => word);
  }
  
  // Remove duplicate suggestions
  private removeDuplicates(suggestions: VocabSuggestion[]): VocabSuggestion[] {
    const seen = new Set<string>();
    return suggestions.filter(s => {
      if (seen.has(s.term)) {
        return false;
      }
      seen.add(s.term);
      return true;
    });
  }
}

export const suggestionEngine = new SuggestionEngine();