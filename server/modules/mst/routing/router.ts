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
  
  console.log(`🔍 determineFinalBand: stage=${stage}, p=${p} (${Math.round(p*100)}%)`);
  
  // Map performance score to CEFR level based on scientific assessment
  // These thresholds reflect actual proficiency levels
  let baseIndex: number;
  
  if (p >= 0.85) {
    // Excellent performance (85%+) - Advanced levels
    baseIndex = stage === 'upper' ? 5 : (stage === 'core' ? 4 : 3); // C2/C1/B2
    console.log(`  Excellent performance (85%+): ${stage} -> index ${baseIndex} (${levels[baseIndex]})`);
  } else if (p >= 0.70) {
    // Good performance (70-84%) - Upper intermediate
    baseIndex = stage === 'upper' ? 4 : (stage === 'core' ? 3 : 2); // C1/B2/B1
    console.log(`  Good performance (70-84%): ${stage} -> index ${baseIndex} (${levels[baseIndex]})`);
  } else if (p >= 0.55) {
    // Moderate performance (55-69%) - Intermediate
    baseIndex = stage === 'upper' ? 3 : (stage === 'core' ? 2 : 1); // B2/B1/A2
    console.log(`  Moderate performance (55-69%): ${stage} -> index ${baseIndex} (${levels[baseIndex]})`);
  } else if (p >= 0.35) {
    // Poor performance (35-54%) - Elementary
    baseIndex = stage === 'upper' ? 2 : (stage === 'core' ? 1 : 0); // B1/A2/A1
    console.log(`  Poor performance (35-54%): ${stage} -> index ${baseIndex} (${levels[baseIndex]})`);
  } else if (p >= 0.15) {
    // Very poor performance (15-34%) - Beginner
    baseIndex = stage === 'upper' ? 1 : 0; // A2/A1
    console.log(`  Very poor performance (15-34%): ${stage} -> index ${baseIndex} (${levels[baseIndex]})`);
  } else {
    // Extremely poor performance (<15%) - Always A1
    baseIndex = 0; // A1
    console.log(`  Extremely poor performance (<15%): -> index 0 (A1)`);
  }
  
  // Ensure index is within bounds
  baseIndex = Math.max(0, Math.min(baseIndex, levels.length - 1));
  const baseLevel = levels[baseIndex];
  
  // Add fine-grained modifiers based on performance within level
  const withinLevelScore = p % 0.15; // Performance within the level bracket
  
  let result: string;
  if (withinLevelScore >= 0.12) {
    result = `${baseLevel}+`;
  } else if (withinLevelScore <= 0.03) {
    result = `${baseLevel}-`;
  } else {
    result = baseLevel;
  }
  
  console.log(`🎯 determineFinalBand result: ${result} (within-level score: ${withinLevelScore.toFixed(3)})`);
  
  return result;
}

/**
 * Calculate overall CEFR level from skill results
 * @param skillBands Array of skill band results
 * @returns Overall CEFR band
 */
export function calculateOverallLevel(skillBands: string[]): string {
  const levels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
  
  console.log(`🔍 calculateOverallLevel input: ${skillBands.join(', ')}`);
  
  // Extract base levels (remove +/- modifiers)
  const baseLevels = skillBands.map(band => {
    const baseLevel = band.replace(/[+-]$/, '');
    const index = levels.indexOf(baseLevel);
    console.log(`  Band '${band}' -> Base '${baseLevel}' -> Index ${index}`);
    return index;
  }).filter(index => index !== -1);
  
  console.log(`  Valid indices: [${baseLevels.join(', ')}]`);
  
  if (baseLevels.length === 0) {
    console.warn('⚠️ No valid skill results found for overall calculation, defaulting to A1');
    return 'A1'; // Default to lowest level instead of hardcoded B1
  }
  
  // Use median for overall level
  baseLevels.sort((a, b) => a - b);
  const median = Math.floor(baseLevels.length / 2);
  const overallIndex = baseLevels.length % 2 === 0 
    ? Math.floor((baseLevels[median - 1] + baseLevels[median]) / 2)
    : baseLevels[median];
    
  console.log(`  Sorted indices: [${baseLevels.join(', ')}], median position: ${median}, overall index: ${overallIndex}`);
  
  const result = levels[Math.max(0, Math.min(overallIndex, levels.length - 1))];
  console.log(`🎯 calculateOverallLevel result: ${result}`);
  
  return result;
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