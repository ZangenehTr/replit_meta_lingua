/**
 * MST Routing Logic
 * Implements UP/DOWN/STAY decisions based on performance scores
 */

import { QuickscoreResult } from '../schemas/resultSchema';

/**
 * Route to next stage based on performance score
 * @param p Performance score (0-1)
 * @returns Routing decision
 */
export function route(p: number): 'up' | 'down' | 'stay' {
  if (p >= 0.75) return 'up';
  if (p < 0.45) return 'down';
  return 'stay';
}

/**
 * Determine final CEFR band based on performance score using scientific mapping
 * @param stage Current stage ('core', 'upper', 'lower')
 * @param p Final performance score (0-1)
 * @param coreLevel The core level (e.g., 'B1') - now used for calibration only
 * @returns CEFR band based on actual performance
 */
export function determineFinalBand(
  stage: 'core' | 'upper' | 'lower',
  p: number,
  coreLevel: string = 'B1'
): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Map performance score to CEFR level based on scientific assessment
  // These thresholds reflect actual proficiency levels
  let baseIndex: number;
  
  if (p >= 0.85) {
    // Excellent performance (85%+) - Advanced levels
    baseIndex = stage === 'upper' ? 5 : (stage === 'core' ? 4 : 3); // C2/C1/B2
  } else if (p >= 0.70) {
    // Good performance (70-84%) - Upper intermediate
    baseIndex = stage === 'upper' ? 4 : (stage === 'core' ? 3 : 2); // C1/B2/B1
  } else if (p >= 0.55) {
    // Moderate performance (55-69%) - Intermediate
    baseIndex = stage === 'upper' ? 3 : (stage === 'core' ? 2 : 1); // B2/B1/A2
  } else if (p >= 0.35) {
    // Poor performance (35-54%) - Elementary
    baseIndex = stage === 'upper' ? 2 : (stage === 'core' ? 1 : 0); // B1/A2/A1
  } else if (p >= 0.15) {
    // Very poor performance (15-34%) - Beginner
    baseIndex = stage === 'upper' ? 1 : 0; // A2/A1
  } else {
    // Extremely poor performance (<15%) - Always A1
    baseIndex = 0; // A1
  }
  
  // Ensure index is within bounds
  baseIndex = Math.max(0, Math.min(baseIndex, levels.length - 1));
  const baseLevel = levels[baseIndex];
  
  // Add fine-grained modifiers based on performance within level
  const withinLevelScore = p % 0.15; // Performance within the level bracket
  
  if (withinLevelScore >= 0.12) {
    return `${baseLevel}+`;
  } else if (withinLevelScore <= 0.03) {
    return `${baseLevel}-`;
  } else {
    return baseLevel;
  }
}

/**
 * Calculate overall CEFR level from skill results
 * @param skillBands Array of skill band results
 * @returns Overall CEFR band
 */
export function calculateOverallLevel(skillBands: string[]): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  // Extract base levels (remove +/- modifiers)
  const baseLevels = skillBands.map(band => {
    const baseLevel = band.replace(/[+-]$/, '');
    return levels.indexOf(baseLevel);
  }).filter(index => index !== -1);
  
  if (baseLevels.length === 0) return 'B1';
  
  // Use median for overall level
  baseLevels.sort((a, b) => a - b);
  const median = Math.floor(baseLevels.length / 2);
  const overallIndex = baseLevels.length % 2 === 0 
    ? Math.floor((baseLevels[median - 1] + baseLevels[median]) / 2)
    : baseLevels[median];
    
  return levels[Math.max(0, Math.min(overallIndex, levels.length - 1))];
}

/**
 * Validate routing decision for consistency
 * @param p Performance score
 * @param route Routing decision
 * @returns True if valid
 */
export function validateRouting(p: number, route: 'up' | 'down' | 'stay'): boolean {
  if (p >= 0.75 && route !== 'up') return false;
  if (p < 0.45 && route !== 'down') return false;
  if (p >= 0.45 && p < 0.75 && route !== 'stay') return false;
  return true;
}