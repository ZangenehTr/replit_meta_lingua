import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock implementation of metrics calculation system
class DynamicMetricsCalculator {
  private sessionStartTime: number = Date.now();
  private speechActivityHistory: Array<{
    speaker: 'teacher' | 'student';
    duration: number;
    timestamp: number;
  }> = [];
  
  private attentionHistory: Array<{
    level: number;
    timestamp: number;
    source: 'face-detection' | 'eye-tracking' | 'engagement'
  }> = [];

  recordSpeechActivity(speaker: 'teacher' | 'student', duration: number) {
    this.speechActivityHistory.push({
      speaker,
      duration,
      timestamp: Date.now()
    });
  }

  recordAttentionLevel(level: number, source: 'face-detection' | 'eye-tracking' | 'engagement') {
    this.attentionHistory.push({
      level,
      timestamp: Date.now(),
      source
    });
  }

  calculateTalkTimeRatio(windowMs: number = 300000): { teacher: number; student: number } {
    const cutoff = Date.now() - windowMs;
    const recentActivity = this.speechActivityHistory.filter(a => a.timestamp > cutoff);
    
    const teacherTime = recentActivity
      .filter(a => a.speaker === 'teacher')
      .reduce((sum, a) => sum + a.duration, 0);
    
    const studentTime = recentActivity
      .filter(a => a.speaker === 'student')
      .reduce((sum, a) => sum + a.duration, 0);
    
    const totalTime = teacherTime + studentTime;
    
    if (totalTime === 0) {
      return { teacher: 50, student: 50 };
    }
    
    return {
      teacher: Math.round((teacherTime / totalTime) * 100),
      student: Math.round((studentTime / totalTime) * 100)
    };
  }

  calculateDynamicEngagement(): {
    current: number;
    trend: 'increasing' | 'stable' | 'decreasing';
    confidence: number;
  } {
    if (this.attentionHistory.length === 0) {
      return { current: 50, trend: 'stable', confidence: 0.3 };
    }

    // Get recent attention data (last 2 minutes)
    const recentCutoff = Date.now() - 120000;
    const recentAttention = this.attentionHistory.filter(a => a.timestamp > recentCutoff);
    
    if (recentAttention.length === 0) {
      return { current: 25, trend: 'stable', confidence: 0.2 };
    }

    // Calculate weighted average (more recent = higher weight)
    const now = Date.now();
    let weightedSum = 0;
    let totalWeight = 0;
    
    recentAttention.forEach(attention => {
      const age = now - attention.timestamp;
      const weight = Math.exp(-age / 60000); // Exponential decay over 1 minute
      weightedSum += attention.level * weight;
      totalWeight += weight;
    });
    
    const currentEngagement = Math.round(weightedSum / totalWeight);
    
    // Calculate trend
    const halfpoint = Math.floor(recentAttention.length / 2);
    const firstHalf = recentAttention.slice(0, halfpoint);
    const secondHalf = recentAttention.slice(halfpoint);
    
    const firstHalfAvg = firstHalf.reduce((sum, a) => sum + a.level, 0) / firstHalf.length || 0;
    const secondHalfAvg = secondHalf.reduce((sum, a) => sum + a.level, 0) / secondHalf.length || 0;
    
    let trend: 'increasing' | 'stable' | 'decreasing';
    if (secondHalfAvg > firstHalfAvg + 5) {
      trend = 'increasing';
    } else if (secondHalfAvg < firstHalfAvg - 5) {
      trend = 'decreasing';
    } else {
      trend = 'stable';
    }
    
    // Calculate confidence based on data consistency
    const variance = recentAttention.reduce((sum, a) => {
      return sum + Math.pow(a.level - currentEngagement, 2);
    }, 0) / recentAttention.length;
    
    const confidence = Math.max(0.1, 1 - (variance / 1000));
    
    return {
      current: Math.max(10, Math.min(100, currentEngagement)),
      trend,
      confidence: Math.round(confidence * 100) / 100
    };
  }

  calculateSessionProgress(): {
    duration: number;
    qualityScore: number;
    engagementTrend: number[];
    talkTimeBalance: number;
  } {
    const sessionDuration = Date.now() - this.sessionStartTime;
    
    // Quality score based on multiple factors
    const engagement = this.calculateDynamicEngagement();
    const talkTime = this.calculateTalkTimeRatio();
    
    // Ideal talk time ratio is 40% teacher, 60% student
    const talkTimeBalance = 100 - Math.abs(40 - talkTime.teacher);
    
    const qualityScore = Math.round(
      (engagement.current * 0.4) + 
      (talkTimeBalance * 0.3) + 
      (engagement.confidence * 100 * 0.3)
    );
    
    // Generate engagement trend over time (last 10 minutes in 1-minute intervals)
    const trendIntervals = 10;
    const intervalMs = 60000; // 1 minute
    const engagementTrend: number[] = [];
    
    for (let i = trendIntervals - 1; i >= 0; i--) {
      const intervalStart = Date.now() - (i + 1) * intervalMs;
      const intervalEnd = Date.now() - i * intervalMs;
      
      const intervalAttention = this.attentionHistory.filter(
        a => a.timestamp >= intervalStart && a.timestamp < intervalEnd
      );
      
      if (intervalAttention.length > 0) {
        const avgAttention = intervalAttention.reduce((sum, a) => sum + a.level, 0) / intervalAttention.length;
        engagementTrend.push(Math.round(avgAttention));
      } else {
        engagementTrend.push(engagementTrend[engagementTrend.length - 1] || 50);
      }
    }
    
    return {
      duration: sessionDuration,
      qualityScore: Math.max(10, Math.min(100, qualityScore)),
      engagementTrend,
      talkTimeBalance: Math.round(talkTimeBalance)
    };
  }

  getRealtimeMetrics() {
    return {
      engagement: this.calculateDynamicEngagement(),
      talkTime: this.calculateTalkTimeRatio(),
      sessionProgress: this.calculateSessionProgress()
    };
  }
}

describe('Dynamic Metrics Based on Actual Engagement', () => {
  let metricsCalculator: DynamicMetricsCalculator;

  beforeEach(() => {
    metricsCalculator = new DynamicMetricsCalculator();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('Speech Activity Tracking', () => {
    it('should track individual speech activities', () => {
      metricsCalculator.recordSpeechActivity('student', 15000); // 15 seconds
      metricsCalculator.recordSpeechActivity('teacher', 10000); // 10 seconds
      
      const talkTime = metricsCalculator.calculateTalkTimeRatio();
      
      expect(talkTime.student).toBe(60); // 15s / 25s total
      expect(talkTime.teacher).toBe(40); // 10s / 25s total
    });

    it('should calculate realistic talk-time ratios over time', () => {
      // Simulate a 5-minute conversation
      const activities = [
        { speaker: 'teacher' as const, duration: 30000, delay: 0 },      // Teacher introduces (30s)
        { speaker: 'student' as const, duration: 45000, delay: 30000 },  // Student responds (45s)
        { speaker: 'teacher' as const, duration: 20000, delay: 75000 },  // Teacher asks question (20s)
        { speaker: 'student' as const, duration: 60000, delay: 95000 },  // Student explains (60s)
        { speaker: 'teacher' as const, duration: 25000, delay: 155000 }, // Teacher clarifies (25s)
        { speaker: 'student' as const, duration: 40000, delay: 180000 }  // Student practices (40s)
      ];
      
      activities.forEach(activity => {
        vi.advanceTimersByTime(activity.delay);
        metricsCalculator.recordSpeechActivity(activity.speaker, activity.duration);
      });
      
      const talkTime = metricsCalculator.calculateTalkTimeRatio();
      
      // Student should have more talk time (ideal for language learning)
      expect(talkTime.student).toBeGreaterThan(55);
      expect(talkTime.teacher).toBeLessThan(45);
      expect(talkTime.student + talkTime.teacher).toBe(100);
    });

    it('should handle periods of silence appropriately', () => {
      metricsCalculator.recordSpeechActivity('teacher', 10000);
      
      // Long pause (no activity)
      vi.advanceTimersByTime(60000);
      
      metricsCalculator.recordSpeechActivity('student', 20000);
      
      const talkTime = metricsCalculator.calculateTalkTimeRatio();
      
      // Should only consider actual speech time, not silence
      expect(talkTime.teacher).toBe(33); // 10s / 30s total
      expect(talkTime.student).toBe(67); // 20s / 30s total
    });
  });

  describe('Attention Level Calculation', () => {
    it('should calculate engagement from face detection data', () => {
      // Simulate high attention period
      for (let i = 0; i < 10; i++) {
        metricsCalculator.recordAttentionLevel(85 + Math.random() * 10, 'face-detection');
        vi.advanceTimersByTime(1000);
      }
      
      const engagement = metricsCalculator.calculateDynamicEngagement();
      
      expect(engagement.current).toBeGreaterThan(80);
      expect(engagement.confidence).toBeGreaterThan(0.7);
    });

    it('should detect decreasing attention over time', () => {
      // Simulate attention dropping over 2 minutes
      const startAttention = 90;
      for (let i = 0; i < 24; i++) { // 24 readings over 2 minutes
        const attentionDrop = i * 2; // Drops by 2 each reading
        metricsCalculator.recordAttentionLevel(startAttention - attentionDrop, 'face-detection');
        vi.advanceTimersByTime(5000); // Every 5 seconds
      }
      
      const engagement = metricsCalculator.calculateDynamicEngagement();
      
      expect(engagement.trend).toBe('decreasing');
      expect(engagement.current).toBeLessThan(60);
    });

    it('should weight recent attention data more heavily', () => {
      // Low attention initially
      for (let i = 0; i < 5; i++) {
        metricsCalculator.recordAttentionLevel(30, 'face-detection');
        vi.advanceTimersByTime(10000);
      }
      
      // High attention recently
      vi.advanceTimersByTime(60000); // 1 minute later
      for (let i = 0; i < 10; i++) {
        metricsCalculator.recordAttentionLevel(85, 'face-detection');
        vi.advanceTimersByTime(1000);
      }
      
      const engagement = metricsCalculator.calculateDynamicEngagement();
      
      // Should be closer to recent high values than old low values
      expect(engagement.current).toBeGreaterThan(70);
    });

    it('should combine multiple attention sources', () => {
      vi.advanceTimersByTime(1000);
      
      // Different sources providing different readings
      metricsCalculator.recordAttentionLevel(80, 'face-detection');
      metricsCalculator.recordAttentionLevel(75, 'eye-tracking');  
      metricsCalculator.recordAttentionLevel(85, 'engagement');
      
      const engagement = metricsCalculator.calculateDynamicEngagement();
      
      // Should average the sources appropriately
      expect(engagement.current).toBeGreaterThan(75);
      expect(engagement.current).toBeLessThan(85);
    });
  });

  describe('Session Progress Metrics', () => {
    it('should calculate overall session quality', () => {
      // Simulate good session: balanced talk time, high engagement
      metricsCalculator.recordSpeechActivity('teacher', 120000); // 2 minutes
      metricsCalculator.recordSpeechActivity('student', 180000); // 3 minutes
      
      for (let i = 0; i < 20; i++) {
        metricsCalculator.recordAttentionLevel(80 + Math.random() * 15, 'face-detection');
        vi.advanceTimersByTime(15000);
      }
      
      const progress = metricsCalculator.calculateSessionProgress();
      
      expect(progress.qualityScore).toBeGreaterThan(70);
      expect(progress.talkTimeBalance).toBeGreaterThan(80); // Good balance
      expect(progress.engagementTrend.length).toBe(10);
    });

    it('should track engagement trends over session duration', () => {
      // Simulate session with varying engagement
      const engagementPattern = [90, 85, 80, 75, 70, 75, 80, 85, 90, 85]; // U-shaped curve
      
      engagementPattern.forEach((level, index) => {
        vi.advanceTimersByTime(60000); // Every minute
        
        // Multiple readings per minute
        for (let i = 0; i < 6; i++) {
          metricsCalculator.recordAttentionLevel(level + (Math.random() - 0.5) * 10, 'face-detection');
          vi.advanceTimersByTime(10000);
        }
      });
      
      const progress = metricsCalculator.calculateSessionProgress();
      
      expect(progress.engagementTrend).toHaveLength(10);
      expect(Math.min(...progress.engagementTrend)).toBeLessThan(80);
      expect(Math.max(...progress.engagementTrend)).toBeGreaterThan(80);
    });

    it('should penalize poor talk-time balance', () => {
      // Teacher dominates conversation (bad for language learning)
      metricsCalculator.recordSpeechActivity('teacher', 240000); // 4 minutes
      metricsCalculator.recordSpeechActivity('student', 60000);  // 1 minute
      
      // High attention but poor balance
      for (let i = 0; i < 10; i++) {
        metricsCalculator.recordAttentionLevel(90, 'face-detection');
        vi.advanceTimersByTime(5000);
      }
      
      const progress = metricsCalculator.calculateSessionProgress();
      
      expect(progress.talkTimeBalance).toBeLessThan(60); // Poor balance penalty
      expect(progress.qualityScore).toBeLessThan(80);    // Overall quality affected
    });
  });

  describe('Real-time Metrics Integration', () => {
    it('should provide comprehensive real-time metrics', () => {
      // Simulate active session
      vi.advanceTimersByTime(300000); // 5 minutes in
      
      metricsCalculator.recordSpeechActivity('teacher', 100000);
      metricsCalculator.recordSpeechActivity('student', 140000);
      
      for (let i = 0; i < 15; i++) {
        metricsCalculator.recordAttentionLevel(75 + Math.random() * 20, 'face-detection');
        vi.advanceTimersByTime(2000);
      }
      
      const metrics = metricsCalculator.getRealtimeMetrics();
      
      expect(metrics).toHaveProperty('engagement');
      expect(metrics).toHaveProperty('talkTime');
      expect(metrics).toHaveProperty('sessionProgress');
      
      expect(metrics.engagement.current).toBeGreaterThan(0);
      expect(metrics.engagement.current).toBeLessThanOrEqual(100);
      expect(metrics.talkTime.teacher + metrics.talkTime.student).toBe(100);
      expect(metrics.sessionProgress.duration).toBeGreaterThan(0);
    });

    it('should handle edge cases gracefully', () => {
      // No data yet
      const emptyMetrics = metricsCalculator.getRealtimeMetrics();
      
      expect(emptyMetrics.engagement.current).toBe(50); // Default
      expect(emptyMetrics.talkTime.teacher).toBe(50);   // Default
      expect(emptyMetrics.talkTime.student).toBe(50);   // Default
      expect(emptyMetrics.engagement.confidence).toBeLessThan(0.5); // Low confidence
    });

    it('should maintain performance with large datasets', () => {
      // Simulate very long session with lots of data
      for (let minute = 0; minute < 30; minute++) {
        vi.advanceTimersByTime(60000);
        
        // Speech activity
        if (minute % 3 === 0) {
          metricsCalculator.recordSpeechActivity(
            Math.random() > 0.5 ? 'teacher' : 'student',
            Math.random() * 30000 + 10000
          );
        }
        
        // Attention readings every 5 seconds for this minute
        for (let reading = 0; reading < 12; reading++) {
          metricsCalculator.recordAttentionLevel(
            Math.random() * 40 + 60, // 60-100 range
            'face-detection'
          );
          vi.advanceTimersByTime(5000);
        }
      }
      
      const start = performance.now();
      const metrics = metricsCalculator.getRealtimeMetrics();
      const end = performance.now();
      
      expect(end - start).toBeLessThan(10); // Should be very fast
      expect(metrics.engagement.current).toBeGreaterThan(40);
      expect(metrics.sessionProgress.duration).toBeGreaterThan(1800000); // 30+ minutes
    });
  });
});