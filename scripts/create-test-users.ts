import { db } from '../server/db.js';
import { users } from '../shared/schema.js';
import bcrypt from 'bcrypt';
import { eq } from 'drizzle-orm';

async function createTestUsers() {
  console.log('Creating test users...');
  
  const testUsers = [
    { email: 'admin@test.com', password: 'admin123', role: 'admin' as const, firstName: 'Admin', lastName: 'User' },
    { email: 'teacher@test.com', password: 'teacher123', role: 'teacher' as const, firstName: 'Teacher', lastName: 'User' },
    { email: 'student@test.com', password: 'student123', role: 'student' as const, firstName: 'Student', lastName: 'User' },
    { email: 'mentor@test.com', password: 'mentor123', role: 'mentor' as const, firstName: 'Mentor', lastName: 'User' },
    { email: 'supervisor@test.com', password: 'supervisor123', role: 'supervisor' as const, firstName: 'Supervisor', lastName: 'User' },
    { email: 'callcenter@test.com', password: 'callcenter123', role: 'callcenter' as const, firstName: 'Call Center', lastName: 'Agent' },
    { email: 'accountant@test.com', password: 'accountant123', role: 'accountant' as const, firstName: 'Accountant', lastName: 'User' }
  ];
  
  for (const user of testUsers) {
    // Check if user exists
    const existing = await db.select().from(users).where(eq(users.email, user.email));
    
    if (existing.length === 0) {
      const hashedPassword = await bcrypt.hash(user.password, 10);
      await db.insert(users).values({
        ...user,
        password: hashedPassword,
        status: 'active'
      });
      console.log(`✓ Created ${user.role} user: ${user.email}`);
    } else {
      console.log(`- ${user.role} user already exists: ${user.email}`);
    }
  }
  
  console.log('\nAll test users are ready!');
  console.log('You can now login with any of the test accounts.');
  process.exit(0);
}

createTestUsers().catch(console.error);