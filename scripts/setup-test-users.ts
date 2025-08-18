import { Client } from 'pg';
import { drizzle } from 'drizzle-orm/node-postgres';
import * as schema from '../shared/schema';
import * as bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

// Database connection
const DATABASE_URL = process.env.DATABASE_URL;

if (!DATABASE_URL) {
  console.error('❌ DATABASE_URL not found in environment variables');
  process.exit(1);
}

const client = new Client({
  connectionString: DATABASE_URL
});

async function setupTestUsers() {
  console.log('🧹 Setting up test users for presentation...');
  
  await client.connect();
  const db = drizzle(client, { schema });

  try {
    // Hash password for all new users
    const hashedPassword = await bcrypt.hash('password123', 10);
    
    console.log('👤 Creating/updating test users...');
    
    // Test user data
    const testUsers = [
      { email: 'supervisor@test.com', firstName: 'Test', lastName: 'Supervisor', role: 'Supervisor', phoneNumber: '+989121234501' },
      { email: 'mentor@test.com', firstName: 'Test', lastName: 'Mentor', role: 'Mentor', phoneNumber: '+989121234502' },
      { email: 'accountant@test.com', firstName: 'Test', lastName: 'Accountant', role: 'Accountant', phoneNumber: '+989121234503' },
      { email: 'callcenter@test.com', firstName: 'Test', lastName: 'CallCenter', role: 'CallCenter', phoneNumber: '+989121234504' },
      { email: 'teacher1@test.com', firstName: 'Teacher', lastName: 'One', role: 'Teacher', phoneNumber: '+989121234505' },
      { email: 'teacher2@test.com', firstName: 'Teacher', lastName: 'Two', role: 'Teacher', phoneNumber: '+989121234506' },
      { email: 'student1@test.com', firstName: 'Student', lastName: 'One', role: 'Student', phoneNumber: '+989121234507' },
      { email: 'student2@test.com', firstName: 'Student', lastName: 'Two', role: 'Student', phoneNumber: '+989121234508' }
    ];
    
    const createdUsers: any[] = [];
    
    for (const userData of testUsers) {
      // Check if user exists
      const existingUser = await db.select().from(schema.users).where(eq(schema.users.email, userData.email)).limit(1);
      
      let user;
      if (existingUser.length > 0) {
        // Update existing user
        console.log(`  Updating existing user: ${userData.email}`);
        const [updatedUser] = await db.update(schema.users)
          .set({
            password: hashedPassword,
            firstName: userData.firstName,
            lastName: userData.lastName,
            role: userData.role as any,
            phoneNumber: userData.phoneNumber,
            isActive: true
          })
          .where(eq(schema.users.email, userData.email))
          .returning();
        user = updatedUser;
      } else {
        // Create new user
        console.log(`  Creating new user: ${userData.email}`);
        const [newUser] = await db.insert(schema.users).values({
          email: userData.email,
          password: hashedPassword,
          firstName: userData.firstName,
          lastName: userData.lastName,
          role: userData.role as any,
          isActive: true,
          phoneNumber: userData.phoneNumber
        }).returning();
        user = newUser;
      }
      
      createdUsers.push({ ...user, roleType: userData.role });
    }
    
    // Get the teacher users
    const teacher1 = createdUsers.find(u => u.email === 'teacher1@test.com');
    const teacher2 = createdUsers.find(u => u.email === 'teacher2@test.com');
    const student1 = createdUsers.find(u => u.email === 'student1@test.com');
    const student2 = createdUsers.find(u => u.email === 'student2@test.com');
    
    console.log('💼 Setting up Callern availability for teachers...');
    
    // Set up Callern availability for teachers
    const availableHours = ['08:00-12:00', '12:00-18:00', '18:00-24:00', '00:00-08:00'];
    
    // Check and update/create teacher availability
    const existingAvail1 = await db.select().from(schema.teacherCallernAvailability)
      .where(eq(schema.teacherCallernAvailability.teacherId, teacher1.id)).limit(1);
    
    if (existingAvail1.length > 0) {
      await db.update(schema.teacherCallernAvailability)
        .set({
          isOnline: true,
          lastActiveAt: new Date(),
          hourlyRate: '500000',
          availableHours: availableHours
        })
        .where(eq(schema.teacherCallernAvailability.teacherId, teacher1.id));
    } else {
      await db.insert(schema.teacherCallernAvailability).values({
        teacherId: teacher1.id,
        isOnline: true,
        lastActiveAt: new Date(),
        hourlyRate: '500000',
        availableHours: availableHours
      });
    }
    
    const existingAvail2 = await db.select().from(schema.teacherCallernAvailability)
      .where(eq(schema.teacherCallernAvailability.teacherId, teacher2.id)).limit(1);
    
    if (existingAvail2.length > 0) {
      await db.update(schema.teacherCallernAvailability)
        .set({
          isOnline: true,
          lastActiveAt: new Date(),
          hourlyRate: '450000',
          availableHours: availableHours
        })
        .where(eq(schema.teacherCallernAvailability.teacherId, teacher2.id));
    } else {
      await db.insert(schema.teacherCallernAvailability).values({
        teacherId: teacher2.id,
        isOnline: true,
        lastActiveAt: new Date(),
        hourlyRate: '450000',
        availableHours: availableHours
      });
    }
    
    console.log('💰 Adding wallet funds for students...');
    
    // Add wallet transactions for students
    await db.insert(schema.walletTransactions).values([
      {
        userId: student1.id,
        amount: 10000000,
        type: 'topup',
        status: 'completed',
        description: 'Test deposit for presentation',
        merchantTransactionId: `TEST-${Date.now()}-001`
      },
      {
        userId: student2.id,
        amount: 10000000,
        type: 'topup',
        status: 'completed',
        description: 'Test deposit for presentation',
        merchantTransactionId: `TEST-${Date.now()}-002`
      }
    ]);
    
    console.log('📚 Setting up Callern package and roadmap...');
    
    // Create a simple Callern package
    const [package1] = await db.insert(schema.callernPackages).values({
      packageName: 'English Conversation Starter',
      description: 'Perfect package for beginners to start conversational English',
      totalHours: 10,
      price: '2000000', // 2 million IRR
      targetLevel: 'beginner',
      isActive: true
    }).returning();
    
    // Create a roadmap for the package
    const [roadmap] = await db.insert(schema.callernRoadmaps).values({
      packageId: package1.id,
      roadmapName: 'Basic English Conversations',
      description: 'Learn essential English conversation skills',
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
        description: 'Master basic greetings and self-introduction',
        estimatedMinutes: 60,
        teacherAITips: 'Focus on pronunciation. Encourage repetition of common phrases. Help student feel comfortable speaking.',
        skillFocus: 'speaking'
      },
      {
        roadmapId: roadmap.id,
        stepNumber: 2,
        title: 'Daily Conversations',
        description: 'Practice talking about daily routines and activities',
        estimatedMinutes: 90,
        teacherAITips: 'Use role-play for real situations. Teach vocabulary for daily activities. Focus on natural conversation flow.',
        skillFocus: 'speaking'
      },
      {
        roadmapId: roadmap.id,
        stepNumber: 3,
        title: 'Expressing Opinions',
        description: 'Learn to express likes, dislikes, and preferences',
        estimatedMinutes: 60,
        teacherAITips: 'Encourage student to share personal opinions. Teach polite disagreement. Practice giving reasons.',
        skillFocus: 'speaking'
      }
    ]);
    
    console.log('✅ Test environment setup complete!');
    console.log('\n📋 Test Users Created/Updated:');
    console.log('  Admin: admin@test.com (existing)');
    console.log('  Supervisor: supervisor@test.com');
    console.log('  Mentor: mentor@test.com');
    console.log('  Accountant: accountant@test.com');
    console.log('  Call Center: callcenter@test.com');
    console.log('  Teacher 1: teacher1@test.com (Callern enabled, 500k IRR/hour)');
    console.log('  Teacher 2: teacher2@test.com (Callern enabled, 450k IRR/hour)');
    console.log('  Student 1: student1@test.com (10M IRR wallet added)');
    console.log('  Student 2: student2@test.com (10M IRR wallet added)');
    console.log('\n🔑 All passwords: password123');
    console.log('\n💰 Student wallets: Added 10,000,000 IRR to each');
    console.log('📚 Callern package: English Conversation Starter (2M IRR, 10 hours)');
    console.log('\n✨ Ready for presentation!');
    
  } catch (error) {
    console.error('❌ Error during setup:', error);
    throw error;
  } finally {
    await client.end();
  }
}

// Run the setup
setupTestUsers().catch(console.error);