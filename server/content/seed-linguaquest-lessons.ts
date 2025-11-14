/**
 * LinguaQuest Lessons Seeding Script
 * Populates the linguaquest_lessons table with 6 free lessons (B1, B2, C1)
 */

import { db } from "../db";
import { linguaquestLessons } from "../../shared/schema";
import { ALL_LINGUAQUEST_LESSONS, LESSON_SUMMARY } from "./linguaquest-lessons-seed";
import { inArray } from "drizzle-orm";

export async function seedLinguaquestLessons() {
  try {
    console.log('🌱 Starting LinguaQuest Lessons seeding...');
    console.log(`📊 Total lessons to seed: ${LESSON_SUMMARY.total}`);
    console.log('📚 Lessons by CEFR level:', LESSON_SUMMARY.byLevel);
    console.log(`🎁 All lessons are FREE (isPremium: ${!LESSON_SUMMARY.allFree ? 'mixed' : 'false'})`);
    console.log(`⏱️  Total estimated time: ${LESSON_SUMMARY.totalEstimatedMinutes} minutes`);
    console.log(`⭐ Total XP available: ${LESSON_SUMMARY.totalXP} XP`);

    // Check which specific lessons already exist by title
    const lessonTitles = ALL_LINGUAQUEST_LESSONS.map(l => l.title);
    const existingLessons = await db
      .select({ title: linguaquestLessons.title })
      .from(linguaquestLessons)
      .where(inArray(linguaquestLessons.title, lessonTitles));
    
    const existingTitles = new Set(existingLessons.map(l => l.title));
    const lessonsToInsert = ALL_LINGUAQUEST_LESSONS.filter(lesson => !existingTitles.has(lesson.title));
    
    if (lessonsToInsert.length === 0) {
      console.log(`✅ All ${ALL_LINGUAQUEST_LESSONS.length} LinguaQuest lessons already exist in database.`);
      console.log('   No new lessons to seed.');
      return {
        success: true,
        message: 'All lessons already seeded',
        existingCount: ALL_LINGUAQUEST_LESSONS.length,
        alreadyExists: lessonTitles
      };
    }

    console.log(`📝 Found ${lessonsToInsert.length} new lessons to insert (${existingTitles.size} already exist)`);

    // Insert only missing lessons
    const inserted = await db.insert(linguaquestLessons).values(lessonsToInsert as any).returning();
    
    console.log(`✅ Successfully seeded ${inserted.length} LinguaQuest lessons!`);
    console.log('📋 Lessons breakdown:');
    console.log(`   - B1 (Intermediate): ${LESSON_SUMMARY.byLevel.B1} lessons`);
    console.log(`   - B2 (Upper-Intermediate): ${LESSON_SUMMARY.byLevel.B2} lessons`);
    console.log(`   - C1 (Advanced): ${LESSON_SUMMARY.byLevel.C1} lessons`);
    console.log('');
    console.log('🎮 Game types included:');
    console.log('   ✓ Vocabulary Matching');
    console.log('   ✓ Grammar Battles');
    console.log('   ✓ Synonym/Antonym Matching');
    console.log('   ✓ Word Formation');
    console.log('   ✓ Timed Vocabulary Blitz');
    console.log('');
    console.log('📝 Lesson titles:');
    inserted.forEach((lesson, idx) => {
      console.log(`   ${idx + 1}. [${lesson.difficulty}] ${lesson.title}`);
    });

    return {
      success: true,
      message: 'LinguaQuest lessons seeded successfully',
      lessonsSeeded: inserted.length,
      stats: LESSON_SUMMARY,
      lessons: inserted.map(l => ({ id: l.id, title: l.title, difficulty: l.difficulty }))
    };
  } catch (error) {
    console.error('❌ Error seeding LinguaQuest lessons:', error);
    throw error;
  }
}
