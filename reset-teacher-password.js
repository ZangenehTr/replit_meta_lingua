import { getDatabase } from './server/database-storage.js';
import bcrypt from 'bcrypt';

async function resetTeacherPassword() {
  const db = getDatabase();
  
  try {
    // Find the teacher
    const teacher = await db.query('users').filter({ email: 'updated@test.com' }).findFirst();
    
    if (!teacher) {
      console.log('Teacher not found');
      return;
    }
    
    // Reset password
    const hashedPassword = await bcrypt.hash('teacher123', 10);
    await db.query('users').filter({ id: teacher.id }).update({ password: hashedPassword });
    
    console.log('Password reset successfully for updated@test.com');
  } catch (error) {
    console.error('Error:', error);
  }
}

resetTeacherPassword();
