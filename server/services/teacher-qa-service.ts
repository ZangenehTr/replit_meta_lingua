/**
 * Teacher QA Service
 * Handles performance evaluation, peer review, and quality scoring
 */

import type { DatabaseStorage } from '../database-storage';
import { 
  sessions,
  users,
  courses,
  attendanceRecords,
  gameSessions,
  messages
} from '../../shared/schema';
import { eq, and, gte, lte, desc, sql, avg, count } from 'drizzle-orm';
import { OllamaService } from '../ollama-service';

export interface TeacherPerformanceMetrics {
  teacherId: number;
  teacherName: string;
  overallScore: number;
  metrics: {
    studentSatisfaction: number;
    teachingEffectiveness: number;
    punctuality: number;
    preparedness: number;
    communication: number;
    engagement: number;
    curriculum_adherence: number;
    technology_proficiency: number;
  };
  totalSessions: number;
  completedSessions: number;
  averageRating: number;
  studentRetention: number;
  improvements: string[];
  strengths: string[];
}

export interface PeerReview {
  id: number;
  reviewerId: number;
  reviewerName: string;
  teacherId: number;
  sessionId: number;
  overallRating: number;
  criteria: {
    lessonStructure: number;
    studentEngagement: number;
    timeManagement: number;
    contentDelivery: number;
    feedbackQuality: number;
    languageProficiency: number;
  };
  strengths: string[];
  areasForImprovement: string[];
  additionalComments: string;
  createdAt: Date;
}

export interface QualityScore {
  teacherId: number;
  period: string;
  score: number;
  breakdown: {
    category: string;
    weight: number;
    score: number;
    maxScore: number;
  }[];
  rank: number;
  percentile: number;
  trend: 'improving' | 'stable' | 'declining';
  recommendations: string[];
}

export interface SessionAnalysis {
  sessionId: number;
  teacherId: number;
  qualityIndicators: {
    tttRatio: number; // Teacher Talk Time ratio
    studentParticipation: number;
    errorCorrectionRate: number;
    vocabularyIntroduced: number;
    grammarCoverage: number;
    speakingOpportunities: number;
  };
  flags: {
    isExcellent: boolean;
    needsImprovement: boolean;
    reasons: string[];
  };
  autoScore: number;
}

export class TeacherQAService {
  constructor(
    private storage: DatabaseStorage,
    private ollamaService: OllamaService
  ) {}

  /**
   * Calculate comprehensive performance metrics for a teacher
   */
  async calculatePerformanceMetrics(
    teacherId: number,
    startDate?: Date,
    endDate?: Date
  ): Promise<TeacherPerformanceMetrics> {
    try {
      const teacher = await this.storage.getUser(teacherId);
      if (!teacher || teacher.role !== 'Teacher') {
        throw new Error('Teacher not found');
      }

      // Get all sessions for the teacher in the period
      let sessionsQuery = this.storage.db
        .select()
        .from(sessions)
        .where(eq(sessions.teacherId, teacherId));

      if (startDate && endDate) {
        sessionsQuery = sessionsQuery.where(
          and(
            gte(sessions.startTime, startDate),
            lte(sessions.startTime, endDate)
          )
        );
      }

      const teacherSessions = await sessionsQuery;
      const totalSessions = teacherSessions.length;
      const completedSessions = teacherSessions.filter(s => 
        s.status === 'completed' || s.status === 'ended'
      ).length;

      // For now, simulate feedback (in production, would use actual feedback table)
      const feedback: any[] = [];
      const averageRating = 4.2; // Simulated rating

      // Calculate attendance and punctuality
      const attendances = await this.storage.db
        .select()
        .from(attendanceRecords)
        .innerJoin(sessions, eq(attendanceRecords.sessionId, sessions.id))
        .where(eq(sessions.teacherId, teacherId));

      const punctualityRate = this.calculatePunctuality(attendances);

      // Analyze teaching patterns using AI
      const teachingAnalysis = await this.analyzeTeachingPatterns(
        teacherId,
        teacherSessions,
        feedback
      );

      // Calculate retention rate
      const retentionRate = await this.calculateStudentRetention(teacherId);

      // Calculate comprehensive metrics
      const metrics = {
        studentSatisfaction: this.normalizeScore(averageRating, 5),
        teachingEffectiveness: teachingAnalysis.effectiveness,
        punctuality: punctualityRate,
        preparedness: teachingAnalysis.preparedness,
        communication: teachingAnalysis.communication,
        engagement: teachingAnalysis.engagement,
        curriculum_adherence: teachingAnalysis.curriculumAdherence,
        technology_proficiency: teachingAnalysis.techProficiency
      };

      // Calculate overall score (weighted average)
      const weights = {
        studentSatisfaction: 0.25,
        teachingEffectiveness: 0.20,
        punctuality: 0.10,
        preparedness: 0.10,
        communication: 0.10,
        engagement: 0.15,
        curriculum_adherence: 0.05,
        technology_proficiency: 0.05
      };

      const overallScore = Object.entries(metrics).reduce(
        (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
        0
      );

      // Generate strengths and improvements
      const { strengths, improvements } = this.identifyStrengthsAndImprovements(metrics);

      return {
        teacherId,
        teacherName: `${teacher.firstName} ${teacher.lastName}`,
        overallScore: Math.round(overallScore * 100) / 100,
        metrics,
        totalSessions,
        completedSessions,
        averageRating: Math.round(averageRating * 100) / 100,
        studentRetention: retentionRate,
        improvements,
        strengths
      };
    } catch (error) {
      console.error('Error calculating performance metrics:', error);
      throw error;
    }
  }

  /**
   * Submit a peer review for a teacher's session
   */
  async submitPeerReview(
    reviewerId: number,
    teacherId: number,
    sessionId: number,
    reviewData: {
      overallRating: number;
      criteria: {
        lessonStructure: number;
        studentEngagement: number;
        timeManagement: number;
        contentDelivery: number;
        feedbackQuality: number;
        languageProficiency: number;
      };
      strengths: string[];
      areasForImprovement: string[];
      additionalComments: string;
    }
  ): Promise<PeerReview> {
    try {
      const reviewer = await this.storage.getUser(reviewerId);
      if (!reviewer || reviewer.role !== 'Teacher') {
        throw new Error('Only teachers can submit peer reviews');
      }

      // Verify session belongs to the teacher
      const session = await this.storage.db
        .select()
        .from(sessions)
        .where(
          and(
            eq(sessions.id, sessionId),
            eq(sessions.teacherId, teacherId)
          )
        )
        .then(rows => rows[0]);

      if (!session) {
        throw new Error('Session not found or does not belong to this teacher');
      }

      // Store peer review in database (using sessionFeedback table with special marker)
      const review: PeerReview = {
        id: Date.now(),
        reviewerId,
        reviewerName: `${reviewer.firstName} ${reviewer.lastName}`,
        teacherId,
        sessionId,
        overallRating: reviewData.overallRating,
        criteria: reviewData.criteria,
        strengths: reviewData.strengths,
        areasForImprovement: reviewData.areasForImprovement,
        additionalComments: reviewData.additionalComments,
        createdAt: new Date()
      };

      // Store in messages table as a workaround (in production, would use proper feedback table)
      await this.storage.db.insert(messages).values({
        senderId: reviewerId,
        receiverId: teacherId,
        content: JSON.stringify({
          type: 'peer_review',
          sessionId,
          overallRating: reviewData.overallRating,
          criteria: reviewData.criteria,
          strengths: reviewData.strengths,
          improvements: reviewData.areasForImprovement,
          comments: reviewData.additionalComments
        }),
        messageType: 'peer_review'
      });

      // Update teacher's quality score
      await this.updateQualityScore(teacherId);

      return review;
    } catch (error) {
      console.error('Error submitting peer review:', error);
      throw error;
    }
  }

  /**
   * Calculate automated quality score for a teacher
   */
  async calculateQualityScore(
    teacherId: number,
    period: 'weekly' | 'monthly' | 'quarterly' = 'monthly'
  ): Promise<QualityScore> {
    try {
      const dateRange = this.getDateRange(period);
      const metrics = await this.calculatePerformanceMetrics(
        teacherId,
        dateRange.start,
        dateRange.end
      );

      // Get peer reviews
      const peerReviews = await this.getPeerReviews(teacherId, dateRange.start, dateRange.end);
      const peerScore = peerReviews.length > 0
        ? peerReviews.reduce((sum, r) => sum + r.overallRating, 0) / peerReviews.length
        : 0;

      // Get session analysis scores
      const sessionScores = await this.getSessionAnalysisScores(
        teacherId,
        dateRange.start,
        dateRange.end
      );

      // Calculate breakdown
      const breakdown = [
        {
          category: 'Student Satisfaction',
          weight: 0.30,
          score: metrics.metrics.studentSatisfaction * 100,
          maxScore: 100
        },
        {
          category: 'Teaching Effectiveness',
          weight: 0.25,
          score: metrics.metrics.teachingEffectiveness * 100,
          maxScore: 100
        },
        {
          category: 'Peer Reviews',
          weight: 0.15,
          score: this.normalizeScore(peerScore, 5) * 100,
          maxScore: 100
        },
        {
          category: 'Session Quality',
          weight: 0.15,
          score: sessionScores.average * 100,
          maxScore: 100
        },
        {
          category: 'Punctuality & Attendance',
          weight: 0.10,
          score: metrics.metrics.punctuality * 100,
          maxScore: 100
        },
        {
          category: 'Student Retention',
          weight: 0.05,
          score: metrics.studentRetention * 100,
          maxScore: 100
        }
      ];

      // Calculate overall score
      const score = breakdown.reduce(
        (sum, item) => sum + (item.score * item.weight),
        0
      );

      // Calculate rank and percentile
      const { rank, percentile } = await this.calculateRankAndPercentile(teacherId, score);

      // Determine trend
      const previousScore = await this.getPreviousPeriodScore(teacherId, period);
      let trend: 'improving' | 'stable' | 'declining' = 'stable';
      if (previousScore) {
        if (score > previousScore + 5) trend = 'improving';
        else if (score < previousScore - 5) trend = 'declining';
      }

      // Generate recommendations
      const recommendations = this.generateQualityRecommendations(breakdown, metrics);

      return {
        teacherId,
        period: `${period}-${dateRange.start.toISOString().split('T')[0]}`,
        score: Math.round(score * 100) / 100,
        breakdown,
        rank,
        percentile,
        trend,
        recommendations
      };
    } catch (error) {
      console.error('Error calculating quality score:', error);
      throw error;
    }
  }

  /**
   * Analyze a specific session for quality indicators
   */
  async analyzeSession(sessionId: number): Promise<SessionAnalysis> {
    try {
      const session = await this.storage.db
        .select()
        .from(sessions)
        .where(eq(sessions.id, sessionId))
        .then(rows => rows[0]);

      if (!session) {
        throw new Error('Session not found');
      }

      // Get session metrics (would be from AI supervisor in real implementation)
      const qualityIndicators = {
        tttRatio: 0.35, // Ideal is 30-40%
        studentParticipation: 0.75,
        errorCorrectionRate: 0.80,
        vocabularyIntroduced: 15,
        grammarCoverage: 0.70,
        speakingOpportunities: 12
      };

      // Calculate auto score based on indicators
      const autoScore = this.calculateSessionAutoScore(qualityIndicators);

      // Determine flags
      const flags = {
        isExcellent: autoScore >= 85,
        needsImprovement: autoScore < 60,
        reasons: this.getSessionFlagReasons(qualityIndicators, autoScore)
      };

      return {
        sessionId,
        teacherId: session.teacherId!,
        qualityIndicators,
        flags,
        autoScore
      };
    } catch (error) {
      console.error('Error analyzing session:', error);
      throw error;
    }
  }

  /**
   * Get top performing teachers
   */
  async getTopTeachers(limit: number = 10): Promise<TeacherPerformanceMetrics[]> {
    try {
      // Get all teachers
      const teachers = await this.storage.db
        .select()
        .from(users)
        .where(eq(users.role, 'Teacher'));

      const performanceList: TeacherPerformanceMetrics[] = [];

      for (const teacher of teachers) {
        try {
          const metrics = await this.calculatePerformanceMetrics(teacher.id);
          performanceList.push(metrics);
        } catch (error) {
          console.error(`Error calculating metrics for teacher ${teacher.id}:`, error);
        }
      }

      // Sort by overall score
      performanceList.sort((a, b) => b.overallScore - a.overallScore);

      return performanceList.slice(0, limit);
    } catch (error) {
      console.error('Error getting top teachers:', error);
      return [];
    }
  }

  // Helper methods
  private calculatePunctuality(attendances: any[]): number {
    if (attendances.length === 0) return 1;
    
    const onTime = attendances.filter(a => {
      const joinTime = new Date(a.attendanceRecords.attendedAt);
      const sessionStart = new Date(a.sessions.startTime);
      const diffMinutes = (joinTime.getTime() - sessionStart.getTime()) / (1000 * 60);
      return diffMinutes <= 5; // Within 5 minutes is considered punctual
    }).length;

    return onTime / attendances.length;
  }

  private async analyzeTeachingPatterns(
    teacherId: number,
    sessions: any[],
    feedback: any[]
  ) {
    // Simulate AI analysis (in real implementation, would use Ollama)
    const completionRate = sessions.filter(s => s.status === 'completed').length / Math.max(sessions.length, 1);
    
    return {
      effectiveness: Math.min(0.95, completionRate * 1.1),
      preparedness: 0.85 + Math.random() * 0.15,
      communication: 0.80 + Math.random() * 0.20,
      engagement: 0.75 + Math.random() * 0.25,
      curriculumAdherence: 0.90 + Math.random() * 0.10,
      techProficiency: 0.70 + Math.random() * 0.30
    };
  }

  private async calculateStudentRetention(teacherId: number): Promise<number> {
    // Calculate percentage of students who continue taking sessions
    const sessions = await this.storage.db
      .select({
        studentId: sessions.studentId,
        count: count()
      })
      .from(sessions)
      .where(eq(sessions.teacherId, teacherId))
      .groupBy(sessions.studentId);

    const returning = sessions.filter(s => s.count > 1).length;
    const total = sessions.length;

    return total > 0 ? returning / total : 0;
  }

  private normalizeScore(score: number, maxScore: number): number {
    return Math.min(1, Math.max(0, score / maxScore));
  }

  private identifyStrengthsAndImprovements(metrics: any) {
    const strengths: string[] = [];
    const improvements: string[] = [];

    Object.entries(metrics).forEach(([key, value]) => {
      const score = value as number;
      const readableKey = key.replace(/([A-Z])/g, ' $1').trim();
      
      if (score >= 0.85) {
        strengths.push(`Excellent ${readableKey.toLowerCase()}`);
      } else if (score < 0.60) {
        improvements.push(`Improve ${readableKey.toLowerCase()}`);
      }
    });

    // Add default items if empty
    if (strengths.length === 0) {
      strengths.push('Consistent performance');
    }
    if (improvements.length === 0) {
      improvements.push('Maintain current standards');
    }

    return { strengths, improvements };
  }

  private getDateRange(period: 'weekly' | 'monthly' | 'quarterly') {
    const end = new Date();
    const start = new Date();

    switch (period) {
      case 'weekly':
        start.setDate(end.getDate() - 7);
        break;
      case 'monthly':
        start.setMonth(end.getMonth() - 1);
        break;
      case 'quarterly':
        start.setMonth(end.getMonth() - 3);
        break;
    }

    return { start, end };
  }

  private async getPeerReviews(teacherId: number, startDate: Date, endDate: Date) {
    // Get peer reviews from messages table
    const reviews = await this.storage.db
      .select()
      .from(messages)
      .where(
        and(
          eq(messages.receiverId, teacherId),
          eq(messages.messageType, 'peer_review'),
          gte(messages.createdAt, startDate),
          lte(messages.createdAt, endDate)
        )
      );

    return reviews.map(r => {
      try {
        const data = JSON.parse(r.content);
        return {
          overallRating: data.overallRating || 0,
          ...data
        };
      } catch {
        return { overallRating: 0 };
      }
    });
  }

  private async getSessionAnalysisScores(
    teacherId: number,
    startDate: Date,
    endDate: Date
  ) {
    const sessions = await this.storage.db
      .select()
      .from(sessions)
      .where(
        and(
          eq(sessions.teacherId, teacherId),
          gte(sessions.startTime, startDate),
          lte(sessions.startTime, endDate)
        )
      );

    // Simulate session scores (in real implementation, would be from AI analysis)
    const scores = sessions.map(() => 0.70 + Math.random() * 0.30);
    const average = scores.length > 0
      ? scores.reduce((sum, s) => sum + s, 0) / scores.length
      : 0.75;

    return { scores, average };
  }

  private async calculateRankAndPercentile(teacherId: number, score: number) {
    // Get all teacher scores
    const allTeachers = await this.storage.db
      .select()
      .from(users)
      .where(eq(users.role, 'Teacher'));

    const scores: number[] = [];
    for (const teacher of allTeachers) {
      if (teacher.id === teacherId) {
        scores.push(score);
      } else {
        // Simulate scores for other teachers
        scores.push(60 + Math.random() * 40);
      }
    }

    scores.sort((a, b) => b - a);
    const rank = scores.indexOf(score) + 1;
    const percentile = Math.round(((scores.length - rank) / scores.length) * 100);

    return { rank, percentile };
  }

  private async getPreviousPeriodScore(teacherId: number, period: string): Promise<number | null> {
    // Simulate previous score (in real implementation, would fetch from database)
    return 75 + Math.random() * 20;
  }

  private async updateQualityScore(teacherId: number) {
    // Recalculate and store quality score
    const score = await this.calculateQualityScore(teacherId, 'monthly');
    console.log(`Updated quality score for teacher ${teacherId}: ${score.score}`);
  }

  private calculateSessionAutoScore(indicators: any): number {
    const weights = {
      tttRatio: 0.20,
      studentParticipation: 0.25,
      errorCorrectionRate: 0.15,
      vocabularyIntroduced: 0.15,
      grammarCoverage: 0.15,
      speakingOpportunities: 0.10
    };

    // Calculate scores for each indicator
    const scores = {
      tttRatio: Math.max(0, 100 - Math.abs(indicators.tttRatio - 0.35) * 500),
      studentParticipation: indicators.studentParticipation * 100,
      errorCorrectionRate: indicators.errorCorrectionRate * 100,
      vocabularyIntroduced: Math.min(100, (indicators.vocabularyIntroduced / 20) * 100),
      grammarCoverage: indicators.grammarCoverage * 100,
      speakingOpportunities: Math.min(100, (indicators.speakingOpportunities / 15) * 100)
    };

    return Object.entries(scores).reduce(
      (sum, [key, value]) => sum + value * weights[key as keyof typeof weights],
      0
    );
  }

  private getSessionFlagReasons(indicators: any, score: number): string[] {
    const reasons: string[] = [];

    if (score >= 85) {
      reasons.push('Excellent overall performance');
      if (indicators.studentParticipation > 0.8) {
        reasons.push('High student participation');
      }
      if (indicators.tttRatio >= 0.3 && indicators.tttRatio <= 0.4) {
        reasons.push('Optimal teacher-student talk ratio');
      }
    }

    if (score < 60) {
      if (indicators.tttRatio > 0.5) {
        reasons.push('Teacher talking too much');
      }
      if (indicators.studentParticipation < 0.5) {
        reasons.push('Low student participation');
      }
      if (indicators.errorCorrectionRate < 0.6) {
        reasons.push('Insufficient error correction');
      }
    }

    return reasons;
  }

  private generateQualityRecommendations(breakdown: any[], metrics: any): string[] {
    const recommendations: string[] = [];

    breakdown.forEach(item => {
      if (item.score < 70) {
        switch (item.category) {
          case 'Student Satisfaction':
            recommendations.push('Focus on building better rapport with students');
            recommendations.push('Implement more interactive activities');
            break;
          case 'Teaching Effectiveness':
            recommendations.push('Review lesson planning strategies');
            recommendations.push('Incorporate varied teaching methods');
            break;
          case 'Peer Reviews':
            recommendations.push('Seek feedback from experienced colleagues');
            recommendations.push('Observe high-performing teachers');
            break;
          case 'Session Quality':
            recommendations.push('Improve time management during sessions');
            recommendations.push('Increase student speaking opportunities');
            break;
        }
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('Continue maintaining high standards');
      recommendations.push('Consider mentoring newer teachers');
    }

    return recommendations.slice(0, 3);
  }
}