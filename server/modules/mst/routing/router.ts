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
 * Determine final CEFR band based on stage and performance
 * @param stage Current stage ('core', 'upper', 'lower')
 * @param p Final performance score
 * @param coreLevel The core level (e.g., 'B1')
 * @returns CEFR band with modifiers (e.g., 'B1+', 'A2-')
 */
export function determineFinalBand(
  stage: 'core' | 'upper' | 'lower',
  p: number,
  coreLevel: string = 'B1'
): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  const coreIndex = levels.indexOf(coreLevel);
  
  let baseLevel: string;
  
  switch (stage) {
    case 'upper':
      // Upper stage: B2/C1 level
      baseLevel = levels[Math.min(coreIndex + 1, levels.length - 1)];
      break;
    case 'lower':
      // Lower stage: A2/B1- level  
      baseLevel = levels[Math.max(coreIndex - 1, 0)];
      break;
    case 'core':
    default:
      // Core stage: B1 level
      baseLevel = coreLevel;
      break;
  }
  
  // Add modifiers based on performance
  if (p >= 0.8) {
    return `${baseLevel}+`;
  } else if (p <= 0.5) {
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