#!/usr/bin/env tsx

/**
 * Generate Audio Files for LinguaQuest Content Bank
 * This script creates TTS audio for all LinguaQuest content items using Microsoft Edge TTS
 * 
 * Usage:
 *   npm run generate-linguaquest-audio
 *   npm run generate-linguaquest-audio -- --content-ids=1,2,3
 *   npm run generate-linguaquest-audio -- --regenerate
 */

import { linguaquestAudioService } from '../services/linguaquest-audio-service.js';
import { db } from '../db.js';
import { linguaquestContentBank } from '../../shared/schema.js';

async function main() {
  console.log('🎵 LinguaQuest Audio Generation Script');
  console.log('=====================================\n');

  // Parse command line arguments
  const args = process.argv.slice(2);
  const contentIdsArg = args.find(arg => arg.startsWith('--content-ids='));
  const regenerate = args.includes('--regenerate');

  let contentIds: number[] | undefined;

  if (contentIdsArg) {
    const idsString = contentIdsArg.split('=')[1];
    contentIds = idsString.split(',').map(id => parseInt(id.trim(), 10));
    console.log(`📋 Processing specific content IDs: ${contentIds.join(', ')}\n`);
  } else if (regenerate) {
    console.log(`🔄 Regenerating audio for ALL content items (including existing)\n`);
    const allContent = await db.select().from(linguaquestContentBank);
    contentIds = allContent.map(item => item.id);
  } else {
    console.log(`📋 Processing items without audio only\n`);
  }

  // Get initial stats
  console.log('📊 Current Statistics:');
  const initialStats = await linguaquestAudioService.getGenerationStats();
  console.log(`   Total content items: ${initialStats.totalContent}`);
  console.log(`   Items with audio: ${initialStats.withAudio}`);
  console.log(`   Items without audio: ${initialStats.withoutAudio}`);
  console.log(`   Total audio assets: ${initialStats.totalAudioAssets}`);
  console.log(`   Total file size: ${(initialStats.totalFileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total duration: ${(initialStats.totalDuration / 1000 / 60).toFixed(2)} minutes\n`);

  if (initialStats.withoutAudio === 0 && !contentIds && !regenerate) {
    console.log('✅ All content items already have audio!');
    console.log('   Use --regenerate to regenerate all audio');
    console.log('   Use --content-ids=1,2,3 to process specific items');
    process.exit(0);
  }

  // Run batch generation
  console.log('🚀 Starting batch audio generation...\n');
  const startTime = Date.now();

  const batchStats = await linguaquestAudioService.batchGenerateAudio(contentIds, 500);

  const endTime = Date.now();
  const durationSeconds = ((endTime - startTime) / 1000).toFixed(2);

  // Get final stats
  console.log('\n📊 Final Statistics:');
  const finalStats = await linguaquestAudioService.getGenerationStats();
  console.log(`   Total content items: ${finalStats.totalContent}`);
  console.log(`   Items with audio: ${finalStats.withAudio}`);
  console.log(`   Items without audio: ${finalStats.withoutAudio}`);
  console.log(`   Total audio assets: ${finalStats.totalAudioAssets}`);
  console.log(`   Total file size: ${(finalStats.totalFileSize / 1024 / 1024).toFixed(2)} MB`);
  console.log(`   Total duration: ${(finalStats.totalDuration / 1000 / 60).toFixed(2)} minutes`);

  console.log(`\n⏱️  Total execution time: ${durationSeconds}s`);
  console.log(`\n🎉 Audio generation complete!`);

  if (batchStats.failed > 0) {
    console.log(`\n⚠️  ${batchStats.failed} items failed. Check errors above.`);
    process.exit(1);
  }

  process.exit(0);
}

// Run the script
main().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
