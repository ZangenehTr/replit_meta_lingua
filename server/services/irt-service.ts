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
  private storage?: any;
  private adaptiveCache: Map<string, IRTItem[]>;
  
  constructor(storage?: any) {
    this.storage = storage;
    this.adaptiveCache = new Map();
  }
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
   * Get available items from database or generate adaptive items
   */
  private async getAvailableItems(excludeItems: string[]): Promise<IRTItem[]> {
    // Try to fetch from database first
    try {
      const dbItems = await this.storage?.query(
        `SELECT id, difficulty, discrimination FROM assessment_items 
         WHERE id NOT IN (${excludeItems.map(() => '?').join(',')})
         AND active = true
         LIMIT 50`,
        excludeItems
      );
      
      if (dbItems && dbItems.length > 0) {
        return dbItems as IRTItem[];
      }
    } catch (error) {
      console.log('Using generated items:', error);
    }
    
    // Generate adaptive items based on content types
    const allItems = await this.generateAdaptiveItems(excludeItems);
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
  
  /**
   * Generate adaptive assessment items based on student profile
   */
  private async generateAdaptiveItems(excludeItems: string[]): Promise<IRTItem[]> {
    const items: IRTItem[] = [];
    const skills = ['vocabulary', 'grammar', 'reading', 'listening', 'speaking', 'writing'];
    const difficulties = [-2, -1.5, -1, -0.5, 0, 0.5, 1, 1.5, 2];
    
    for (const skill of skills) {
      for (const difficulty of difficulties) {
        const id = `${skill}_${Math.abs(difficulty * 10)}_${Date.now()}`;
        if (!excludeItems.includes(id)) {
          items.push({
            id,
            difficulty,
            discrimination: 0.8 + Math.random() * 1.2 // 0.8 to 2.0
          });
        }
      }
    }
    
    return items;
  }
  
  /**
   * Complete adaptive assessment with stopping criteria
   */
  async runAdaptiveAssessment(params: {
    studentId: number;
    maxItems?: number;
    targetSE?: number;
    timeLimit?: number;
  }): Promise<{
    finalAbility: StudentAbility;
    itemsAdministered: string[];
    responses: IRTResponse[];
    stoppingReason: string;
  }> {
    const { studentId, maxItems = 20, targetSE = 0.3, timeLimit = 1800000 } = params;
    const startTime = Date.now();
    
    // Initialize student ability
    let currentAbility: StudentAbility = {
      theta: 0, // Start at average ability
      standardError: 1,
      totalResponses: 0
    };
    
    const itemsAdministered: string[] = [];
    const responses: IRTResponse[] = [];
    let stoppingReason = '';
    
    // Adaptive testing loop
    for (let i = 0; i < maxItems; i++) {
      // Check stopping criteria
      if (currentAbility.standardError <= targetSE) {
        stoppingReason = 'Target precision reached';
        break;
      }
      
      if (Date.now() - startTime >= timeLimit) {
        stoppingReason = 'Time limit reached';
        break;
      }
      
      // Select next item
      const nextItem = await this.selectNextItem(currentAbility.theta, itemsAdministered);
      if (!nextItem) {
        stoppingReason = 'No more items available';
        break;
      }
      
      // Simulate student response (in production, get actual response)
      const probability = this.calculateProbability(currentAbility.theta, nextItem);
      const correct = Math.random() < probability;
      const response: IRTResponse = {
        itemId: nextItem.id,
        correct,
        responseTime: 5000 + Math.random() * 25000 // 5-30 seconds
      };
      
      responses.push(response);
      itemsAdministered.push(nextItem.id);
      
      // Update ability estimate
      currentAbility = await this.updateAbility({
        currentTheta: currentAbility.theta,
        currentSE: currentAbility.standardError,
        responses: [response]
      });
    }
    
    if (!stoppingReason) {
      stoppingReason = 'Maximum items reached';
    }
    
    // Store assessment results
    if (this.storage) {
      await this.storage.query(
        `INSERT INTO irt_assessments 
         (student_id, final_theta, final_se, items_count, stopping_reason, assessment_data, created_at)
         VALUES ($1, $2, $3, $4, $5, $6, NOW())`,
        [
          studentId,
          currentAbility.theta,
          currentAbility.standardError,
          itemsAdministered.length,
          stoppingReason,
          JSON.stringify({ itemsAdministered, responses, currentAbility })
        ]
      );
    }
    
    return {
      finalAbility: currentAbility,
      itemsAdministered,
      responses,
      stoppingReason
    };
  }
  
  /**
   * Generate performance report based on IRT assessment
   */
  async generatePerformanceReport(assessmentData: {
    finalAbility: StudentAbility;
    responses: IRTResponse[];
  }): Promise<{
    level: string;
    strengths: string[];
    weaknesses: string[];
    recommendations: string[];
    detailedAnalysis: any;
  }> {
    const { finalAbility, responses } = assessmentData;
    const level = this.getDifficultyLevel(finalAbility.theta);
    
    // Analyze response patterns
    const skillPerformance = new Map<string, { correct: number; total: number }>();
    
    for (const response of responses) {
      const skill = response.itemId.split('_')[0];
      const current = skillPerformance.get(skill) || { correct: 0, total: 0 };
      current.total++;
      if (response.correct) current.correct++;
      skillPerformance.set(skill, current);
    }
    
    // Identify strengths and weaknesses
    const strengths: string[] = [];
    const weaknesses: string[] = [];
    
    skillPerformance.forEach((perf, skill) => {
      const accuracy = perf.correct / perf.total;
      if (accuracy >= 0.7) {
        strengths.push(`Strong ${skill} skills (${Math.round(accuracy * 100)}% accuracy)`);
      } else if (accuracy < 0.5) {
        weaknesses.push(`${skill} needs improvement (${Math.round(accuracy * 100)}% accuracy)`);
      }
    });
    
    // Generate recommendations
    const recommendations = this.generateRecommendations(level, strengths, weaknesses);
    
    return {
      level,
      strengths,
      weaknesses,
      recommendations,
      detailedAnalysis: {
        theta: finalAbility.theta,
        standardError: finalAbility.standardError,
        confidence: `${Math.round((1 - finalAbility.standardError) * 100)}%`,
        totalItems: responses.length,
        averageResponseTime: responses.reduce((sum, r) => sum + r.responseTime, 0) / responses.length,
        skillBreakdown: Object.fromEntries(skillPerformance)
      }
    };
  }
  
  private generateRecommendations(level: string, strengths: string[], weaknesses: string[]): string[] {
    const recommendations: string[] = [];
    
    // Level-based recommendations
    switch (level) {
      case 'beginner':
        recommendations.push('Focus on building foundational vocabulary');
        recommendations.push('Practice basic sentence structures');
        break;
      case 'intermediate':
        recommendations.push('Work on complex grammar patterns');
        recommendations.push('Increase reading comprehension practice');
        break;
      case 'advanced':
        recommendations.push('Challenge yourself with authentic materials');
        recommendations.push('Focus on nuanced expression and style');
        break;
    }
    
    // Weakness-based recommendations
    for (const weakness of weaknesses.slice(0, 2)) {
      if (weakness.includes('vocabulary')) {
        recommendations.push('Daily vocabulary practice with spaced repetition');
      } else if (weakness.includes('grammar')) {
        recommendations.push('Review grammar rules with focused exercises');
      } else if (weakness.includes('listening')) {
        recommendations.push('Increase exposure to native speaker content');
      }
    }
    
    return recommendations;
  }
}