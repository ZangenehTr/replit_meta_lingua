// Rewrite Engine Service
// Generates improved versions of student utterances while maintaining meaning

import type { Utterance } from './transcript-parser';

export interface RewriteSuggestion {
  original: string;
  improved: string;
  cefrLevel: string;
  timestamp?: number;
  notes?: string;
  grammarPoints?: string[];
}

class RewriteEngine {
  // Generate improved versions of student utterances
  async generateRewrites(utterances: Utterance[]): Promise<RewriteSuggestion[]> {
    const rewrites: RewriteSuggestion[] = [];
    
    // Process only student utterances
    const studentUtterances = utterances.filter(u => u.speaker === 'student');
    
    for (const utterance of studentUtterances) {
      const rewrite = this.improveUtterance(utterance.text);
      if (rewrite) {
        rewrites.push({
          ...rewrite,
          timestamp: utterance.timestamp
        });
      }
    }
    
    return rewrites;
  }
  
  // Improve a single utterance
  private improveUtterance(text: string): RewriteSuggestion | null {
    // Common error patterns and corrections
    const corrections: Array<{
      pattern: RegExp;
      replacement: (match: string, ...groups: string[]) => string;
      notes: string;
      grammarPoint: string;
    }> = [
      // Verb tense corrections
      {
        pattern: /\byesterday i (go|come|see|do|make)\b/gi,
        replacement: (match, verb) => {
          const pastForms: { [key: string]: string } = {
            'go': 'went',
            'come': 'came',
            'see': 'saw',
            'do': 'did',
            'make': 'made'
          };
          return `yesterday I ${pastForms[verb.toLowerCase()] || verb}`;
        },
        notes: 'Past tense should be used with "yesterday"',
        grammarPoint: 'Past Simple Tense'
      },
      // Article corrections
      {
        pattern: /\ba ([aeiou])/gi,
        replacement: (match, vowel) => `an ${vowel}`,
        notes: 'Use "an" before vowel sounds',
        grammarPoint: 'Articles (a/an)'
      },
      // Subject-verb agreement
      {
        pattern: /\b(he|she|it) (are|were)\b/gi,
        replacement: (match, subject, verb) => {
          const correction = verb.toLowerCase() === 'are' ? 'is' : 'was';
          return `${subject} ${correction}`;
        },
        notes: 'Subject-verb agreement',
        grammarPoint: 'Subject-Verb Agreement'
      },
      // Double negatives
      {
        pattern: /\b(don't|doesn't|didn't|won't|wouldn't|can't|couldn't) (.*?)\s+no\b/gi,
        replacement: (match, aux, middle) => `${aux} ${middle} any`,
        notes: 'Avoid double negatives',
        grammarPoint: 'Negation'
      }
    ];
    
    let improved = text;
    const grammarPoints: string[] = [];
    const notes: string[] = [];
    let wasImproved = false;
    
    // Apply corrections
    for (const correction of corrections) {
      if (correction.pattern.test(improved)) {
        improved = improved.replace(correction.pattern, correction.replacement);
        notes.push(correction.notes);
        grammarPoints.push(correction.grammarPoint);
        wasImproved = true;
      }
    }
    
    // Additional improvements
    improved = this.improveCapitalization(improved);
    improved = this.improvePunctuation(improved);
    improved = this.improveWordChoice(improved);
    
    // Determine CEFR level of the improved version
    const cefrLevel = this.assessCEFRLevel(improved);
    
    if (!wasImproved && improved === text) {
      return null; // No improvements needed
    }
    
    return {
      original: text,
      improved,
      cefrLevel,
      notes: notes.join('; '),
      grammarPoints: [...new Set(grammarPoints)] // Remove duplicates
    };
  }
  
  // Improve capitalization
  private improveCapitalization(text: string): string {
    // Capitalize first letter
    text = text.charAt(0).toUpperCase() + text.slice(1);
    
    // Capitalize 'I'
    text = text.replace(/\bi\b/g, 'I');
    
    // Capitalize proper nouns (simple implementation)
    const properNouns = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday',
                         'january', 'february', 'march', 'april', 'may', 'june', 'july', 'august',
                         'september', 'october', 'november', 'december'];
    
    for (const noun of properNouns) {
      const regex = new RegExp(`\\b${noun}\\b`, 'gi');
      text = text.replace(regex, noun.charAt(0).toUpperCase() + noun.slice(1));
    }
    
    return text;
  }
  
  // Improve punctuation
  private improvePunctuation(text: string): string {
    // Ensure sentence ends with appropriate punctuation
    if (!/[.!?]$/.test(text.trim())) {
      // Add period if it's a statement
      if (!text.toLowerCase().startsWith('why') && 
          !text.toLowerCase().startsWith('what') &&
          !text.toLowerCase().startsWith('where') &&
          !text.toLowerCase().startsWith('when') &&
          !text.toLowerCase().startsWith('how') &&
          !text.toLowerCase().startsWith('who')) {
        text = text.trim() + '.';
      } else {
        text = text.trim() + '?';
      }
    }
    
    // Fix multiple spaces
    text = text.replace(/\s+/g, ' ');
    
    // Fix space before punctuation
    text = text.replace(/\s+([.!?,])/g, '$1');
    
    return text;
  }
  
  // Improve word choice
  private improveWordChoice(text: string): string {
    const improvements: { [key: string]: string } = {
      'very good': 'excellent',
      'very bad': 'terrible',
      'very big': 'huge',
      'very small': 'tiny',
      'a lot of': 'many',
      'lots of': 'many',
      'gonna': 'going to',
      'wanna': 'want to',
      'gotta': 'have to'
    };
    
    for (const [phrase, replacement] of Object.entries(improvements)) {
      const regex = new RegExp(`\\b${phrase}\\b`, 'gi');
      text = text.replace(regex, replacement);
    }
    
    return text;
  }
  
  // Assess CEFR level of text
  private assessCEFRLevel(text: string): string {
    // Simple assessment based on complexity indicators
    const words = text.split(/\s+/);
    const avgWordLength = words.reduce((sum, word) => sum + word.length, 0) / words.length;
    const sentenceLength = words.length;
    
    // Check for complex structures
    const hasSubordinate = /\b(because|although|while|when|if|unless)\b/i.test(text);
    const hasPassive = /\b(was|were|been|being)\s+\w+ed\b/i.test(text);
    const hasConditional = /\b(would|could|might|should)\b/i.test(text);
    
    // Simple heuristic for CEFR level
    if (hasPassive || (hasSubordinate && hasConditional)) {
      return 'C1';
    } else if (hasSubordinate || hasConditional || sentenceLength > 15) {
      return 'B2';
    } else if (avgWordLength > 5 || sentenceLength > 10) {
      return 'B1';
    } else if (sentenceLength > 5) {
      return 'A2';
    } else {
      return 'A1';
    }
  }
}

export const rewriteEngine = new RewriteEngine();