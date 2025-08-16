const bcrypt = require('bcrypt');
const { db } = require('./server/database-storage');
const { users, students } = require('./shared/schema');

async function createTestStudent() {
  try {
    // Check if student already exists
    const existingUser = await db.select().from(users).where(eq(users.email, 'student@test.com'));
    
    if (existingUser.length > 0) {
      console.log('Test student already exists');
      return;
    }

    // Create user account
    const hashedPassword = await bcrypt.hash('Student123!', 10);
    const [newUser] = await db.insert(users).values({
      email: 'student@test.com',
      password: hashedPassword,
      firstName: 'Test',
      lastName: 'Student',
      role: 'Student',
      isActive: true,
      isBanned: false,
      emailVerified: false,
      language: 'fa',
      theme: 'light'
    }).returning();

    console.log('Created user:', newUser.id);

    // Create student record
    const [newStudent] = await db.insert(students).values({
      userId: newUser.id,
      studentCode: `STU${Date.now()}`,
      gender: 'male',
      dateOfBirth: new Date('2000-01-01'),
      phoneNumber: '+989120000001',
      country: 'Iran',
      city: 'Tehran',
      emergencyContact: '+989120000002',
      enrollmentDate: new Date(),
      status: 'active',
      languageLevel: 'beginner',
      preferredLanguage: 'fa',
      learningGoals: ['Conversational fluency'],
      weeklyStudyHours: 10,
      preferredLearningStyle: 'visual',
      interests: ['Technology', 'Travel'],
      culturalBackground: {}
    }).returning();

    console.log('Created student:', newStudent.id);
    console.log('Login credentials:');
    console.log('Email: student@test.com');
    console.log('Password: Student123!');
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

const { eq } = require('drizzle-orm');
createTestStudent();
