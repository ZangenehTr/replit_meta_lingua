// SRS (Spaced Repetition System) Service
// Implements SM-2 style algorithm for vocabulary review scheduling

export interface SRSUpdate {
  newStrength: number;
  nextDue: Date;
  interval: number; // days until next review
}

class SRSService {
  // SM-2 style intervals (in days)
  private readonly intervals = [1, 3, 7, 14, 30, 90];
  
  // Calculate initial due date for new items
  calculateInitialDue(): Date {
    const now = new Date();
    // New items are due in 1 day
    now.setDate(now.getDate() + 1);
    return now;
  }
  
  // Update strength and calculate next review date
  updateStrength(currentStrength: number, wasCorrect: boolean): SRSUpdate {
    let newStrength = currentStrength;
    let interval: number;
    
    if (wasCorrect) {
      // Increase strength (max 5)
      newStrength = Math.min(currentStrength + 1, 5);
      // Use corresponding interval
      interval = this.intervals[newStrength] || this.intervals[this.intervals.length - 1];
    } else {
      // Decrease strength (min 0) and reset to shorter interval
      newStrength = Math.max(currentStrength - 2, 0);
      // Shorter interval for incorrect answers
      interval = this.intervals[newStrength] || 1;
    }
    
    // Calculate next due date
    const nextDue = new Date();
    nextDue.setDate(nextDue.getDate() + interval);
    
    // Add some randomness to prevent clustering (+/- 20% of interval)
    const variance = interval * 0.2;
    const randomOffset = (Math.random() - 0.5) * variance * 2;
    nextDue.setHours(nextDue.getHours() + randomOffset * 24);
    
    return {
      newStrength,
      nextDue,
      interval
    };
  }
  
  // Get items due for review (with some flexibility)
  isDue(dueDate: Date | null): boolean {
    if (!dueDate) return false;
    
    const now = new Date();
    // Add 4 hour grace period
    const graceDate = new Date(dueDate);
    graceDate.setHours(graceDate.getHours() + 4);
    
    return now >= dueDate && now <= graceDate;
  }
  
  // Calculate review statistics
  calculateStats(reviewHistory: Array<{ wasCorrect: boolean; timestamp: Date }>): {
    accuracy: number;
    streak: number;
    totalReviews: number;
  } {
    if (reviewHistory.length === 0) {
      return { accuracy: 0, streak: 0, totalReviews: 0 };
    }
    
    const correct = reviewHistory.filter(r => r.wasCorrect).length;
    const accuracy = (correct / reviewHistory.length) * 100;
    
    // Calculate current streak
    let streak = 0;
    for (let i = reviewHistory.length - 1; i >= 0; i--) {
      if (reviewHistory[i].wasCorrect) {
        streak++;
      } else {
        break;
      }
    }
    
    return {
      accuracy: Math.round(accuracy),
      streak,
      totalReviews: reviewHistory.length
    };
  }
  
  // Determine question difficulty based on strength
  getQuestionType(strength: number): 'definition' | 'translation' | 'fill_blank' {
    if (strength <= 1) {
      // Easy: multiple choice or definition matching
      return 'definition';
    } else if (strength <= 3) {
      // Medium: translation
      return 'translation';
    } else {
      // Hard: fill in the blank
      return 'fill_blank';
    }
  }
  
  // Calculate optimal review time of day based on user patterns
  calculateOptimalReviewTime(userPreferredTime?: string): number {
    // Return hour of day (0-23) for optimal review
    const timeMap: { [key: string]: number } = {
      'morning': 9,
      'afternoon': 14,
      'evening': 19,
      'night': 21
    };
    
    return timeMap[userPreferredTime || 'evening'] || 19;
  }
  
  // Batch schedule reviews to avoid overwhelming the user
  batchScheduleReviews(items: Array<{ id: number; strength: number }>, maxPerDay: number = 20): Map<number, Date> {
    const schedule = new Map<number, Date>();
    const itemsByDay = new Map<string, number>();
    
    for (const item of items) {
      const { nextDue } = this.updateStrength(item.strength, true);
      const dateKey = nextDue.toISOString().split('T')[0];
      
      // Check if we've hit the daily limit
      const countForDay = itemsByDay.get(dateKey) || 0;
      if (countForDay >= maxPerDay) {
        // Push to next day
        nextDue.setDate(nextDue.getDate() + 1);
      }
      
      const newDateKey = nextDue.toISOString().split('T')[0];
      itemsByDay.set(newDateKey, (itemsByDay.get(newDateKey) || 0) + 1);
      schedule.set(item.id, nextDue);
    }
    
    return schedule;
  }
}

export const srsService = new SRSService();