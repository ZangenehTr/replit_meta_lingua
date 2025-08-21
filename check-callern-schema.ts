import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from './shared/schema.js';

const client = postgres(process.env.DATABASE_URL);
const db = drizzle(client, { schema });

console.log('🔍 Checking CallerN-related database tables...\n');

// Check for CallerN tables
const callernTables = Object.keys(schema).filter(key => 
  key.toLowerCase().includes('callern') || 
  key.toLowerCase().includes('video') ||
  key.toLowerCase().includes('webrtc') ||
  key.toLowerCase().includes('scoring')
);

console.log('📊 CallerN-related tables found:');
callernTables.forEach(table => {
  console.log(`  - ${table}`);
});

// Check callernPackages table
if (schema.callernPackages) {
  const packages = await db.select().from(schema.callernPackages).limit(5);
  console.log('\n📦 Sample CallerN Packages:', packages.length);
}

// Check studentCallernPackages
if (schema.studentCallernPackages) {
  const studentPackages = await db.select().from(schema.studentCallernPackages).limit(5);
  console.log('👤 Student CallerN Packages:', studentPackages.length);
}

// Check callernCallHistory
if (schema.callernCallHistory) {
  const callHistory = await db.select().from(schema.callernCallHistory).limit(5);
  console.log('📞 CallerN Call History:', callHistory.length);
}

// Check callernRoadmaps
if (schema.callernRoadmaps) {
  const roadmaps = await db.select().from(schema.callernRoadmaps).limit(5);
  console.log('🗺️ CallerN Roadmaps:', roadmaps.length);
}

// Check videoCourses
if (schema.videoCourses) {
  const videoCourses = await db.select().from(schema.videoCourses).limit(5);
  console.log('🎥 Video Courses:', videoCourses.length);
}

// Check for scoring tables
if (schema.callernScoringRules) {
  console.log('✅ CallerN Scoring Rules table exists');
}

if (schema.callernSessionScores) {
  console.log('✅ CallerN Session Scores table exists');
}

console.log('\n✅ Database check complete');
await client.end();
