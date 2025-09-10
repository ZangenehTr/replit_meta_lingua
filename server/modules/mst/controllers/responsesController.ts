/**
 * MST Responses Controller
 * Handles response processing and quickscoring
 */

import { Item, Skill } from '../schemas/itemSchema';
import { QuickscoreResult, TelemetryLog } from '../schemas/resultSchema';
import { scoreListening } from '../scorers/listeningQuickscore';
import { scoreReading } from '../scorers/readingQuickscore';
import { scoreSpeaking } from '../scorers/speakingQuickscore';
import { scoreWriting } from '../scorers/writingQuickscore';
import { route } from '../routing/router';

export class MstResponsesController {
  private telemetryLogs: TelemetryLog[] = [];

  /**
   * Process response and return quickscore result
   */
  async processResponse(
    sessionId: string,
    userId: number,
    skill: Skill,
    stage: 'core' | 'upper' | 'lower',
    item: Item,
    responseData: any,
    timeSpentMs: number
  ): Promise<QuickscoreResult> {
    const startTime = Date.now();

    let result: QuickscoreResult;

    try {
      // Route to appropriate scorer based on skill
      switch (skill) {
        case 'listening':
          result = scoreListening(item as any, responseData);
          break;
        case 'reading':
          result = scoreReading(item as any, responseData);
          break;
        case 'speaking':
          result = scoreSpeaking(item as any, responseData);
          break;
        case 'writing':
          result = scoreWriting(item as any, responseData);
          break;
        default:
          throw new Error(`Unknown skill: ${skill}`);
      }

      // Validate routing decision
      if (!this.validateRouting(result.p, result.route)) {
        console.warn(`⚠️ Invalid routing decision: p=${result.p}, route=${result.route}`);
        result.route = route(result.p); // Correct the routing
      }

      // Log telemetry
      this.logTelemetry({
        sessionId,
        userId,
        skill,
        stage,
        itemId: item.id,
        p: result.p,
        route: result.route,
        timeSpentMs,
        timestamp: new Date(),
        features: result.features
      });

      const processingTime = Date.now() - startTime;
      
      // Ensure we meet the 200ms requirement
      if (processingTime > 200) {
        console.warn(`⚠️ Slow quickscore for ${skill}: ${processingTime}ms`);
      }

      return result;

    } catch (error) {
      console.error(`❌ Error processing ${skill} response:`, error);
      
      // Return safe fallback score
      return {
        p: 0.5,
        route: 'stay',
        features: { error: 1 },
        computeTimeMs: Date.now() - startTime
      };
    }
  }

  /**
   * Process audio response with Whisper ASR
   */
  async processAudioResponse(
    audioBuffer: Buffer,
    whisperService?: any
  ): Promise<{ text: string; confidence: number }> {
    try {
      if (whisperService && whisperService.transcribe) {
        // Use Whisper service if available
        const result = await whisperService.transcribe(audioBuffer);
        return {
          text: result.text || '',
          confidence: result.confidence || 0.8
        };
      } else {
        // Fallback: return empty transcript
        console.warn('⚠️ Whisper service not available, using fallback');
        return {
          text: '[Audio transcription not available]',
          confidence: 0.1
        };
      }
    } catch (error) {
      console.error('❌ Audio transcription failed:', error);
      return {
        text: '[Transcription failed]',
        confidence: 0.0
      };
    }
  }

  /**
   * Validate routing decision
   */
  private validateRouting(p: number, routeDecision: 'up' | 'down' | 'stay'): boolean {
    if (p >= 0.75 && routeDecision !== 'up') return false;
    if (p < 0.45 && routeDecision !== 'down') return false;
    if (p >= 0.45 && p < 0.75 && routeDecision !== 'stay') return false;
    return true;
  }

  /**
   * Log telemetry data
   */
  private logTelemetry(log: TelemetryLog): void {
    this.telemetryLogs.push(log);
    
    // Log to console for debugging
    console.log(`📊 MST Telemetry: ${log.skill}/${log.stage} - p=${log.p.toFixed(3)}, route=${log.route}, time=${log.timeSpentMs}ms`);
    
    // Keep only last 1000 logs to prevent memory leaks
    if (this.telemetryLogs.length > 1000) {
      this.telemetryLogs = this.telemetryLogs.slice(-1000);
    }
  }

  /**
   * Get telemetry logs for analysis
   */
  getTelemetryLogs(): TelemetryLog[] {
    return [...this.telemetryLogs];
  }

  /**
   * Export telemetry logs
   */
  exportTelemetry(): string {
    return JSON.stringify(this.telemetryLogs, null, 2);
  }

  /**
   * Clear old telemetry logs
   */
  clearTelemetry(olderThanDays: number = 7): void {
    const cutoffTime = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000);
    this.telemetryLogs = this.telemetryLogs.filter(log => log.timestamp > cutoffTime);
  }

  /**
   * Get performance statistics
   */
  getPerformanceStats(): {
    avgProcessingTimeMs: number;
    routingAccuracy: number;
    skillDistribution: Record<string, number>;
  } {
    if (this.telemetryLogs.length === 0) {
      return {
        avgProcessingTimeMs: 0,
        routingAccuracy: 1.0,
        skillDistribution: {}
      };
    }

    const avgProcessingTime = this.telemetryLogs.reduce((sum, log) => 
      sum + log.timeSpentMs, 0) / this.telemetryLogs.length;

    // Calculate routing accuracy (simplified)
    const correctRoutings = this.telemetryLogs.filter(log => 
      this.validateRouting(log.p, log.route)
    ).length;
    const routingAccuracy = correctRoutings / this.telemetryLogs.length;

    // Skill distribution
    const skillDistribution: Record<string, number> = {};
    this.telemetryLogs.forEach(log => {
      skillDistribution[log.skill] = (skillDistribution[log.skill] || 0) + 1;
    });

    return {
      avgProcessingTimeMs: Math.round(avgProcessingTime),
      routingAccuracy: Math.round(routingAccuracy * 100) / 100,
      skillDistribution
    };
  }
}