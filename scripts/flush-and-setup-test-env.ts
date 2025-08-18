import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import * as bcrypt from 'bcrypt';
import { sql } from 'drizzle-orm';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL
});

async function flushAndSetup() {
  console.log('🧹 Starting database flush and setup...');
  
  await client.connect();
  const db = drizzle(client, { schema });

  try {
    console.log('📊 Cleaning up existing data...');
    
    // Helper function to safely delete from tables
    const safeDelete = async (tableName: string, condition?: string) => {
      try {
        const query = condition 
          ? sql.raw(`DELETE FROM ${tableName} WHERE ${condition}`)
          : sql.raw(`DELETE FROM ${tableName}`);
        await db.execute(query);
      } catch (error: any) {
        if (error.code !== '42P01') { // 42P01 is "table does not exist"
          console.warn(`⚠️ Could not delete from ${tableName}: ${error.message}`);
        }
      }
    };
    
    // Delete in correct order to avoid foreign key constraints
    // First delete all tables that reference other tables
    await safeDelete('call_recordings');
    await safeDelete('call_observations');
    await safeDelete('campaign_leads');
    await safeDelete('campaign_analytics');
    await safeDelete('campaigns');
    await safeDelete('sms_events');
    await safeDelete('placement_test_questions');
    await safeDelete('teacher_payments');
    await safeDelete('user_daily_challenge_progress');
    await safeDelete('game_answer_logs');
    await safeDelete('game_daily_challenges');
    await safeDelete('game_questions');
    await safeDelete('student_game_assignments');
    await safeDelete('course_games');
    await safeDelete('game_access_rules');
    await safeDelete('user_game_progress');
    await safeDelete('game_levels');
    await safeDelete('game_sessions');
    await safeDelete('games');
    await safeDelete('daily_challenges');
    await safeDelete('achievements');
    await safeDelete('callern_call_history');
    await safeDelete('callern_sessions');
    await safeDelete('callern_enrollments');
    await safeDelete('callern_roadmap_steps');
    await safeDelete('callern_roadmaps');
    await safeDelete('callern_packages');
    await safeDelete('teacher_callern_availability');
    await safeDelete('session_packages');
    await safeDelete('student_session_packages');
    await safeDelete('test_submissions');
    await safeDelete('test_results');
    await safeDelete('test_questions');
    await safeDelete('test_attempts');
    await safeDelete('tests');
    await safeDelete('course_sessions');
    await safeDelete('class_enrollments');
    await safeDelete('classes');
    await safeDelete('enrollments');
    await safeDelete('homework');
    await safeDelete('video_lessons');
    await safeDelete('courses');
    await safeDelete('wallet_transactions');
    await safeDelete('rooms');
    await safeDelete('teacher_schedules');
    await safeDelete('student_preferences');
    await safeDelete('user_profiles');
    await safeDelete('level_assessment_questions');
    await safeDelete('level_assessment_results');
    await safeDelete('mentor_assignments');
    await safeDelete('departments');
    
    // Now delete the test users specifically to reuse the emails
    await safeDelete('users', "email IN ('supervisor@test.com', 'mentor@test.com', 'accountant@test.com', 'callcenter@test.com', 'teacher1@test.com', 'teacher2@test.com', 'student1@test.com', 'student2@test.com')");
    
    // Finally delete all other users except admin
    await safeDelete('users', "email NOT IN ('admin@test.com')");
    
    console.log('✅ Cleanup complete');

    // Hash password for all new users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('👤 Creating test users...');
    
    // Create supervisor
    const [supervisor] = await db.insert(schema.users).values({
      email: 'supervisor@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Supervisor',
      role: 'Supervisor',
      isActive: true,
      phoneNumber: '+989121234501'
    }).returning();
    
    // Create mentor
    const [mentor] = await db.insert(schema.users).values({
      email: 'mentor@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Mentor',
      role: 'Mentor',
      isActive: true,
      phoneNumber: '+989121234502'
    }).returning();
    
    // Create accountant
    const [accountant] = await db.insert(schema.users).values({
      email: 'accountant@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Accountant',
      role: 'Accountant',
      isActive: true,
      phoneNumber: '+989121234503'
    }).returning();
    
    // Create call center agent
    const [callCenter] = await db.insert(schema.users).values({
      email: 'callcenter@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'CallCenter',
      role: 'CallCenter',
      isActive: true,
      phoneNumber: '+989121234504'
    }).returning();
    
    // Create 2 teachers
    const [teacher1] = await db.insert(schema.users).values({
      email: 'teacher1@test.com',
      password: hashedPassword,
      firstName: 'Teacher',
      lastName: 'One',
      role: 'Teacher',
      isActive: true,
      phoneNumber: '+989121234505'
    }).returning();
    
    const [teacher2] = await db.insert(schema.users).values({
      email: 'teacher2@test.com',
      password: hashedPassword,
      firstName: 'Teacher',
      lastName: 'Two',
      role: 'Teacher',
      isActive: true,
      phoneNumber: '+989121234506'
    }).returning();
    
    // Set up Callern availability for both teachers (all week, all hours)
    const availableHours = ['08:00-12:00', '12:00-18:00', '18:00-24:00', '00:00-08:00'];
    
    await db.insert(schema.teacherCallernAvailability).values({
      teacherId: teacher1.id,
      isOnline: true,
      lastActiveAt: new Date(),
      hourlyRate: '500000',
      availableHours: availableHours
    });
    
    await db.insert(schema.teacherCallernAvailability).values({
      teacherId: teacher2.id,
      isOnline: true,
      lastActiveAt: new Date(),
      hourlyRate: '450000',
      availableHours: availableHours
    });
    
    // Create 2 students
    const [student1] = await db.insert(schema.users).values({
      email: 'student1@test.com',
      password: hashedPassword,
      firstName: 'Student',
      lastName: 'One',
      role: 'Student',
      isActive: true,
      phoneNumber: '+989121234507'
    }).returning();
    
    const [student2] = await db.insert(schema.users).values({
      email: 'student2@test.com',
      password: hashedPassword,
      firstName: 'Student',
      lastName: 'Two',
      role: 'Student',
      isActive: true,
      phoneNumber: '+989121234508'
    }).returning();
    
    // Add initial deposit transactions for students
    await db.insert(schema.walletTransactions).values([
      {
        userId: student1.id,
        amount: 10000000,
        type: 'topup',
        status: 'completed',
        description: 'Initial test deposit',
        merchantTransactionId: 'TEST-DEPOSIT-001'
      },
      {
        userId: student2.id,
        amount: 10000000,
        type: 'topup',
        status: 'completed',
        description: 'Initial test deposit',
        merchantTransactionId: 'TEST-DEPOSIT-002'
      }
    ]);
    
    // Create a Callern package first
    const [package1] = await db.insert(schema.callernPackages).values({
      packageName: 'Starter Conversation Package',
      description: 'Perfect for beginners',
      totalHours: 10,
      price: '2000000', // 2 million IRR
      targetLevel: 'beginner',
      isActive: true
    }).returning();
    
    // Create a sample roadmap for the package
    const [roadmap] = await db.insert(schema.callernRoadmaps).values({
      packageId: package1.id,
      roadmapName: 'English Conversation Basics',
      description: 'Basic English conversation skills',
      totalSteps: 3,
      estimatedHours: 5,
      createdBy: teacher1.id
    }).returning();
    
    // Add roadmap steps
    await db.insert(schema.callernRoadmapSteps).values([
      {
        roadmapId: roadmap.id,
        stepNumber: 1,
        title: 'Greetings and Introductions',
        description: 'Learn basic greetings and how to introduce yourself',
        estimatedMinutes: 60,
        teacherAITips: 'Focus on pronunciation and natural flow. Encourage student to practice common phrases.',
        skillFocus: 'speaking'
      },
      {
        roadmapId: roadmap.id,
        stepNumber: 2,
        title: 'Daily Conversations',
        description: 'Practice everyday conversations about weather, family, and hobbies',
        estimatedMinutes: 90,
        teacherAITips: 'Use role-play scenarios. Help student with vocabulary for daily situations.',
        skillFocus: 'speaking'
      },
      {
        roadmapId: roadmap.id,
        stepNumber: 3,
        title: 'Making Requests and Offers',
        description: 'Learn polite ways to make requests and offers',
        estimatedMinutes: 60,
        teacherAITips: 'Teach polite forms and cultural context. Practice with real-life situations.',
        skillFocus: 'speaking'
      }
    ]);
    
    console.log('✅ Test environment setup complete!');
    console.log('\n📋 Created users:');
    console.log('  Admin: admin@test.com (existing)');
    console.log('  Supervisor: supervisor@test.com');
    console.log('  Mentor: mentor@test.com');
    console.log('  Accountant: accountant@test.com');
    console.log('  Call Center: callcenter@test.com');
    console.log('  Teacher 1: teacher1@test.com (Callern enabled, 500k IRR/hour)');
    console.log('  Teacher 2: teacher2@test.com (Callern enabled, 450k IRR/hour)');
    console.log('  Student 1: student1@test.com (10M IRR wallet balance)');
    console.log('  Student 2: student2@test.com (10M IRR wallet balance)');
    console.log('\n🔑 All passwords: password123');
    console.log('\n💰 Student wallets: 10,000,000 IRR each');
    console.log('📚 Created 1 Callern package: Starter Conversation Package (2M IRR)');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup
flushAndSetup().catch(console.error);