import bcrypt from 'bcrypt';
import { db } from './server/db.js';
import { users } from './shared/schema.js';
import { eq } from 'drizzle-orm';

async function resetStudentPassword() {
  try {
    // Find the student user
    const student = await db.query.users.findFirst({
      where: eq(users.email, 'student@test.com')
    });

    if (!student) {
      console.error('Student user not found');
      process.exit(1);
    }

    console.log('Found student:', student.email, 'ID:', student.id);

    // Hash the new password
    const hashedPassword = await bcrypt.hash('student123', 10);

    // Update the password
    await db.update(users)
      .set({ 
        password: hashedPassword,
        updatedAt: new Date()
      })
      .where(eq(users.id, student.id));

    console.log('✓ Password reset successfully for student@test.com');
    console.log('  New password: student123');
    
    // Verify the password works
    const updatedStudent = await db.query.users.findFirst({
      where: eq(users.email, 'student@test.com')
    });
    
    const isValid = await bcrypt.compare('student123', updatedStudent.password);
    console.log('  Password verification:', isValid ? '✓ VALID' : '✗ INVALID');
    
    process.exit(0);
  } catch (error) {
    console.error('Error resetting password:', error);
    process.exit(1);
  }
}

resetStudentPassword();