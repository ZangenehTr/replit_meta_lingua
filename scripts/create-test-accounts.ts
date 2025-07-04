import { db } from '../server/db';
import { users, userProfiles } from '../shared/schema';
import bcrypt from 'bcrypt';

async function createTestAccounts() {
  try {
    console.log('Creating test accounts...');
    
    // Test account credentials
    const testAccounts = [
      {
        email: 'admin@test.com',
        password: 'admin123',
        role: 'admin',
        firstName: 'Test',
        lastName: 'Admin'
      },
      {
        email: 'student@test.com',
        password: 'student123',
        role: 'student',
        firstName: 'Test',
        lastName: 'Student'
      },
      {
        email: 'teacher@test.com',
        password: 'teacher123',
        role: 'teacher',
        firstName: 'Test',
        lastName: 'Teacher'
      }
    ];

    for (const account of testAccounts) {
      // Hash the password
      const hashedPassword = await bcrypt.hash(account.password, 10);
      
      try {
        // Create user
        const [newUser] = await db.insert(users).values({
          email: account.email,
          password: hashedPassword,
          role: account.role,
          firstName: account.firstName,
          lastName: account.lastName,
          phoneNumber: '1234567890',
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        console.log(`Created ${account.role} account:`, {
          email: account.email,
          password: account.password,
          id: newUser.id
        });
        
        // Create user profile for students
        if (account.role === 'student') {
          await db.insert(userProfiles).values({
            userId: newUser.id,
            bio: 'Test student account',
            nativeLanguage: 'english',
            targetLanguage: 'farsi',
            proficiencyLevel: 'beginner',
            learningGoals: ['conversation', 'grammar'],
            culturalBackground: 'western',
            learningStyle: 'visual',
            learningChallenges: [],
            weeklyGoalHours: 5,
            preferredSessionTime: 'evening',
            timezone: 'UTC',
            createdAt: new Date(),
            updatedAt: new Date()
          });
        }
        
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          console.log(`Account ${account.email} already exists, skipping...`);
        } else {
          throw error;
        }
      }
    }
    
    console.log('\n✅ Test accounts created successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('─────────────────────────────────────');
    console.log('Admin:    admin@test.com / admin123');
    console.log('Student:  student@test.com / student123');
    console.log('Teacher:  teacher@test.com / teacher123');
    console.log('─────────────────────────────────────');
    
  } catch (error) {
    console.error('Error creating test accounts:', error);
  } finally {
    process.exit(0);
  }
}

createTestAccounts();