/**
 * Content Bank Seeding Script
 * Populates the linguaquest_content_bank table with educational content
 */

import { db } from "../db";
import { linguaquestContentBank } from "../../shared/schema";
import { ALL_CONTENT, CONTENT_STATS } from "./linguaquest-seed-data";

export async function seedContentBank() {
  try {
    console.log('🌱 Starting Content Bank seeding...');
    console.log(`📊 Total items to seed: ${CONTENT_STATS.total}`);
    console.log('📚 Items by CEFR level:', CONTENT_STATS.byLevel);
    console.log('🎮 Items by game type:', CONTENT_STATS.gameTypes);

    // Check if content already exists
    const existingCount = await db.$count(linguaquestContentBank);
    
    if (existingCount > 0) {
      console.log(`⚠️  Content bank already has ${existingCount} items.`);
      console.log('   Skipping seed to avoid duplicates.');
      return {
        success: true,
        message: 'Content bank already seeded',
        existingCount
      };
    }

    // Insert all content (cast to any to handle type differences between insert schema and data)
    const inserted = await db.insert(linguaquestContentBank).values(ALL_CONTENT as any).returning();
    
    console.log(`✅ Successfully seeded ${inserted.length} content items!`);
    console.log('📋 Content breakdown:');
    console.log(`   - A1 (Beginner): ${CONTENT_STATS.byLevel.A1} items`);
    console.log(`   - A2 (Elementary): ${CONTENT_STATS.byLevel.A2} items`);
    console.log(`   - B1 (Intermediate): ${CONTENT_STATS.byLevel.B1} items`);
    console.log(`   - B2 (Upper-Intermediate): ${CONTENT_STATS.byLevel.B2} items`);
    console.log(`   - C1 (Advanced): ${CONTENT_STATS.byLevel.C1} items`);
    console.log(`   - C2 (Proficiency): ${CONTENT_STATS.byLevel.C2} items`);

    return {
      success: true,
      message: 'Content bank seeded successfully',
      itemsSeeded: inserted.length,
      stats: CONTENT_STATS
    };
  } catch (error) {
    console.error('❌ Error seeding content bank:', error);
    throw error;
  }
}
