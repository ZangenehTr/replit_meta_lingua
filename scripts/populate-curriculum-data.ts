#!/usr/bin/env tsx

/**
 * MetaLingua Curriculum Data Population Script
 * Populates the curriculum system with IELTS and Conversation tracks
 */

import { db } from '../server/db';
import { curriculums, curriculumLevels } from '../shared/schema';

const CURRICULUM_DATA = {
  // IELTS Preparation Curriculum
  ielts: {
    curriculum: {
      key: 'ielts',
      name: 'IELTS Preparation',
      language: 'persian',
      description: 'Comprehensive IELTS preparation track with progressive skill building',
      isActive: true,
      orderIndex: 1
    },
    levels: [
      {
        code: 'F1',
        name: 'Flash IELTS 1 (Preliminary)',
        orderIndex: 1,
        cefrBand: null, // IELTS specific levels don't map directly to CEFR
        prerequisites: [],
        description: 'Fundamental IELTS skills and basic test strategies',
        estimatedWeeks: 8,
        isActive: true
      },
      {
        code: 'F2',
        name: 'Flash IELTS 2 (Intermediate)',
        orderIndex: 2,
        cefrBand: null,
        prerequisites: ['F1'],
        description: 'Intermediate IELTS preparation with enhanced strategies',
        estimatedWeeks: 10,
        isActive: true
      },
      {
        code: 'PRO',
        name: 'IELTS Pro (Advanced)',
        orderIndex: 3,
        cefrBand: null,
        prerequisites: ['F2'],
        description: 'Advanced IELTS preparation for high band scores',
        estimatedWeeks: 12,
        isActive: true
      }
    ]
  },

  // General Conversation Curriculum (CEFR-based)
  conversation: {
    curriculum: {
      key: 'conversation',
      name: 'General Conversation',
      language: 'persian',
      description: 'CEFR-aligned conversation skills development from A1 to C2',
      isActive: true,
      orderIndex: 2
    },
    levels: [
      // A1 Level
      {
        code: 'A11',
        name: 'A1.1',
        orderIndex: 1,
        cefrBand: 'A1',
        prerequisites: [],
        description: 'Basic everyday expressions and very simple phrases',
        estimatedWeeks: 6,
        isActive: true
      },
      {
        code: 'A12',
        name: 'A1.2',
        orderIndex: 2,
        cefrBand: 'A1',
        prerequisites: ['A11'],
        description: 'Simple interactions and personal information exchange',
        estimatedWeeks: 6,
        isActive: true
      },

      // A2 Level
      {
        code: 'A21',
        name: 'A2.1',
        orderIndex: 3,
        cefrBand: 'A2',
        prerequisites: ['A12'],
        description: 'Routine tasks and familiar topics discussion',
        estimatedWeeks: 8,
        isActive: true
      },
      {
        code: 'A22',
        name: 'A2.2',
        orderIndex: 4,
        cefrBand: 'A2',
        prerequisites: ['A21'],
        description: 'Simple descriptions and immediate need communication',
        estimatedWeeks: 8,
        isActive: true
      },

      // B1 Level
      {
        code: 'B11',
        name: 'B1.1',
        orderIndex: 5,
        cefrBand: 'B1',
        prerequisites: ['A22'],
        description: 'Familiar topic discussions and travel situations',
        estimatedWeeks: 10,
        isActive: true
      },
      {
        code: 'B12',
        name: 'B1.2',
        orderIndex: 6,
        cefrBand: 'B1',
        prerequisites: ['B11'],
        description: 'Abstract topics and personal opinion expression',
        estimatedWeeks: 10,
        isActive: true
      },

      // B2 Level
      {
        code: 'B21',
        name: 'B2.1',
        orderIndex: 7,
        cefrBand: 'B2',
        prerequisites: ['B12'],
        description: 'Complex topics and technical field discussions',
        estimatedWeeks: 12,
        isActive: true
      },
      {
        code: 'B22',
        name: 'B2.2',
        orderIndex: 8,
        cefrBand: 'B2',
        prerequisites: ['B21'],
        description: 'Fluent interaction and detailed argumentation',
        estimatedWeeks: 12,
        isActive: true
      },

      // C1 Level
      {
        code: 'C11',
        name: 'C1.1',
        orderIndex: 9,
        cefrBand: 'C1',
        prerequisites: ['B22'],
        description: 'Effective language use for social and professional purposes',
        estimatedWeeks: 14,
        isActive: true
      },
      {
        code: 'C12',
        name: 'C1.2',
        orderIndex: 10,
        cefrBand: 'C1',
        prerequisites: ['C11'],
        description: 'Flexible and effective language for complex situations',
        estimatedWeeks: 14,
        isActive: true
      },

      // C2 Level (Extended)
      {
        code: 'C21',
        name: 'C2.1',
        orderIndex: 11,
        cefrBand: 'C2',
        prerequisites: ['C12'],
        description: 'Near-native proficiency with nuanced understanding',
        estimatedWeeks: 16,
        isActive: true
      },
      {
        code: 'C22',
        name: 'C2.2',
        orderIndex: 12,
        cefrBand: 'C2',
        prerequisites: ['C21'],
        description: 'Mastery of implicit meanings and cultural nuances',
        estimatedWeeks: 16,
        isActive: true
      },
      {
        code: 'C23',
        name: 'C2.3',
        orderIndex: 13,
        cefrBand: 'C2',
        prerequisites: ['C22'],
        description: 'Professional and academic mastery',
        estimatedWeeks: 16,
        isActive: true
      },
      {
        code: 'C24',
        name: 'C2.4',
        orderIndex: 14,
        cefrBand: 'C2',
        prerequisites: ['C23'],
        description: 'Expert-level communication and teaching capability',
        estimatedWeeks: 16,
        isActive: true
      }
    ]
  }
};

async function populateCurriculumData() {
  try {
    console.log('🚀 Starting curriculum data population...');

    // Insert IELTS curriculum
    console.log('📚 Creating IELTS curriculum...');
    const [ieltsCurriculum] = await db
      .insert(curriculums)
      .values(CURRICULUM_DATA.ielts.curriculum)
      .returning();

    console.log(`✅ Created IELTS curriculum with ID: ${ieltsCurriculum.id}`);

    // Insert IELTS levels
    console.log('📊 Creating IELTS levels...');
    for (const level of CURRICULUM_DATA.ielts.levels) {
      const [insertedLevel] = await db
        .insert(curriculumLevels)
        .values({
          ...level,
          curriculumId: ieltsCurriculum.id
        })
        .returning();
      
      console.log(`  ✅ Created IELTS level: ${insertedLevel.name} (${insertedLevel.code})`);
    }

    // Insert Conversation curriculum
    console.log('💬 Creating Conversation curriculum...');
    const [conversationCurriculum] = await db
      .insert(curriculums)
      .values(CURRICULUM_DATA.conversation.curriculum)
      .returning();

    console.log(`✅ Created Conversation curriculum with ID: ${conversationCurriculum.id}`);

    // Insert Conversation levels
    console.log('📊 Creating Conversation levels...');
    for (const level of CURRICULUM_DATA.conversation.levels) {
      const [insertedLevel] = await db
        .insert(curriculumLevels)
        .values({
          ...level,
          curriculumId: conversationCurriculum.id
        })
        .returning();
      
      console.log(`  ✅ Created Conversation level: ${insertedLevel.name} (${insertedLevel.code})`);
    }

    console.log('🎉 Curriculum data population completed successfully!');
    console.log(`📈 Summary:`);
    console.log(`   - IELTS curriculum: ${CURRICULUM_DATA.ielts.levels.length} levels`);
    console.log(`   - Conversation curriculum: ${CURRICULUM_DATA.conversation.levels.length} levels`);
    console.log(`   - Total levels: ${CURRICULUM_DATA.ielts.levels.length + CURRICULUM_DATA.conversation.levels.length}`);

  } catch (error) {
    console.error('❌ Error populating curriculum data:', error);
    process.exit(1);
  }
}

// Run the population script
populateCurriculumData()
  .then(() => {
    console.log('✨ All done! Curriculum system is ready.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('💥 Failed to populate curriculum data:', error);
    process.exit(1);
  });

export { populateCurriculumData, CURRICULUM_DATA };