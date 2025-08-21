import { db } from './server/database.ts';
import { users } from './shared/schema.ts';
import { eq } from 'drizzle-orm';
import bcrypt from 'bcrypt';

async function resetPassword() {
  const hashedPassword = await bcrypt.hash('password', 10);
  
  await db.update(users)
    .set({ 
      password: hashedPassword 
    })
    .where(eq(users.email, 'student1@test.com'));
    
  console.log('Password reset for student1@test.com');
  process.exit(0);
}

resetPassword().catch(console.error);
