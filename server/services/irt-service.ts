/**
 * Item Response Theory (IRT) Service
 * Implements 2-Parameter Logistic (2PL) model for adaptive difficulty
 */

export interface IRTItem {
  id: string;
  difficulty: number; // b parameter (-3 to 3)
  discrimination: number; // a parameter (0.5 to 2.5)
}

export interface IRTResponse {
  itemId: string;
  correct: boolean;
  responseTime: number;
}

export interface StudentAbility {
  theta: number; // Ability estimate (-3 to 3)
  standardError: number; // Standard error of measurement
  totalResponses: number;
}

export class IRTService {
  /**
   * Calculate the probability of correct response using 2PL model
   * P(θ) = 1 / (1 + exp(-a(θ - b)))
   */
  calculateProbability(theta: number, item: IRTItem): number {
    const exponent = -item.discrimination * (theta - item.difficulty);
    return 1 / (1 + Math.exp(exponent));
  }

  /**
   * Calculate item information function
   * I(θ) = a² * P(θ) * Q(θ)
   */
  calculateInformation(theta: number, item: IRTItem): number {
    const p = this.calculateProbability(theta, item);
    const q = 1 - p;
    return Math.pow(item.discrimination, 2) * p * q;
  }

  /**
   * Update ability estimate using Maximum Likelihood Estimation (MLE)
   */
  async updateAbility(params: {
    currentTheta: number;
    currentSE: number;
    responses: IRTResponse[];
  }): Promise<StudentAbility> {
    const { currentTheta, responses } = params;
    
    // Get item parameters (in production, fetch from database)
    const items = await this.getItemParameters(responses.map(r => r.itemId));
    
    // Newton-Raphson iteration for MLE
    let theta = currentTheta;
    const maxIterations = 20;
    const tolerance = 0.001;
    
    for (let iter = 0; iter < maxIterations; iter++) {
      let firstDerivative = 0;
      let secondDerivative = 0;
      
      for (let i = 0; i < responses.length; i++) {
        const item = items[i];
        const p = this.calculateProbability(theta, item);
        const response = responses[i].correct ? 1 : 0;
        
        // Calculate derivatives
        firstDerivative += item.discrimination * (response - p);
        secondDerivative -= Math.pow(item.discrimination, 2) * p * (1 - p);
      }
      
      // Update theta
      const delta = firstDerivative / Math.abs(secondDerivative);
      theta = theta - delta;
      
      // Bound theta to reasonable range
      theta = Math.max(-3, Math.min(3, theta));
      
      // Check convergence
      if (Math.abs(delta) < tolerance) {
        break;
      }
    }
    
    // Calculate standard error
    let information = 0;
    for (const item of items) {
      information += this.calculateInformation(theta, item);
    }
    const standardError = 1 / Math.sqrt(information);
    
    return {
      theta,
      standardError,
      totalResponses: responses.length,
    };
  }

  /**
   * Select next item using Maximum Information criterion
   */
  async selectNextItem(theta: number, excludeItems: string[]): Promise<IRTItem | null> {
    // Get available items (in production, fetch from database)
    const availableItems = await this.getAvailableItems(excludeItems);
    
    if (availableItems.length === 0) return null;
    
    // Select item with maximum information at current theta
    let bestItem = availableItems[0];
    let maxInfo = this.calculateInformation(theta, bestItem);
    
    for (const item of availableItems) {
      const info = this.calculateInformation(theta, item);
      if (info > maxInfo) {
        maxInfo = info;
        bestItem = item;
      }
    }
    
    return bestItem;
  }

  /**
   * Calculate adaptive difficulty level based on theta
   */
  getDifficultyLevel(theta: number): 'beginner' | 'intermediate' | 'advanced' {
    if (theta < -0.5) return 'beginner';
    if (theta > 0.5) return 'advanced';
    return 'intermediate';
  }

  /**
   * Get recommended content difficulty based on ability
   */
  getRecommendedDifficulty(theta: number, standardError: number): {
    target: number;
    range: [number, number];
  } {
    // Target difficulty at ability level
    const target = theta;
    
    // Range based on standard error (wider range for less certain estimates)
    const range: [number, number] = [
      Math.max(-3, theta - standardError),
      Math.min(3, theta + standardError)
    ];
    
    return { target, range };
  }

  /**
   * Mock function to get item parameters
   * In production, this would fetch from the database
   */
  private async getItemParameters(itemIds: string[]): Promise<IRTItem[]> {
    // Default parameters for different item types
    const defaults: Record<string, IRTItem> = {
      vocabulary: { id: 'vocab', difficulty: 0, discrimination: 1.2 },
      grammar: { id: 'grammar', difficulty: 0.5, discrimination: 1.0 },
      listening: { id: 'listening', difficulty: -0.3, discrimination: 0.8 },
      speaking: { id: 'speaking', difficulty: 0.3, discrimination: 1.5 },
      reading: { id: 'reading', difficulty: 0.2, discrimination: 1.1 },
      writing: { id: 'writing', difficulty: 0.7, discrimination: 1.3 },
    };
    
    return itemIds.map(id => {
      const type = id.split('_')[0];
      return {
        ...defaults[type] || defaults.vocabulary,
        id,
        // Add some random variation
        difficulty: (defaults[type]?.difficulty || 0) + (Math.random() - 0.5) * 0.5,
        discrimination: (defaults[type]?.discrimination || 1) + (Math.random() - 0.5) * 0.3,
      };
    });
  }

  /**
   * Mock function to get available items
   * In production, this would fetch from the database
   */
  private async getAvailableItems(excludeItems: string[]): Promise<IRTItem[]> {
    const allItems: IRTItem[] = [
      { id: 'vocab_001', difficulty: -1.0, discrimination: 1.2 },
      { id: 'vocab_002', difficulty: -0.5, discrimination: 1.3 },
      { id: 'grammar_001', difficulty: 0.0, discrimination: 1.0 },
      { id: 'grammar_002', difficulty: 0.5, discrimination: 1.1 },
      { id: 'reading_001', difficulty: 0.3, discrimination: 0.9 },
      { id: 'reading_002', difficulty: 0.8, discrimination: 1.4 },
      { id: 'listening_001', difficulty: -0.2, discrimination: 0.8 },
      { id: 'speaking_001', difficulty: 0.6, discrimination: 1.5 },
      { id: 'writing_001', difficulty: 1.0, discrimination: 1.3 },
    ];
    
    return allItems.filter(item => !excludeItems.includes(item.id));
  }

  /**
   * Generate practice items at appropriate difficulty
   */
  async generatePracticeItems(
    theta: number,
    count: number,
    skillFocus?: string
  ): Promise<IRTItem[]> {
    const items: IRTItem[] = [];
    const targetDifficulty = this.getRecommendedDifficulty(theta, 0.5);
    
    for (let i = 0; i < count; i++) {
      // Generate items around the target difficulty
      const variation = (Math.random() - 0.5) * 0.5;
      const difficulty = targetDifficulty.target + variation;
      
      items.push({
        id: `${skillFocus || 'practice'}_gen_${i + 1}`,
        difficulty: Math.max(-3, Math.min(3, difficulty)),
        discrimination: 0.8 + Math.random() * 0.7, // 0.8 to 1.5
      });
    }
    
    return items;
  }
}