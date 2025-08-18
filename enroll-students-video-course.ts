import { Client } from 'pg';

async function enrollStudentsInVideoCourse() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get the students
    const studentsResult = await client.query(`
      SELECT id, email, first_name 
      FROM users 
      WHERE email IN ('student1@test.com', 'student2@test.com')
    `);
    
    console.log('Found students:', studentsResult.rows.map(s => s.email));

    // Get the شهاب شناسی course
    const courseId = 200; // Using the existing course ID
    console.log('Using existing شهاب شناسی پیشرفته ۱ course (ID: 200)');

    // Enroll both students
    for (const student of studentsResult.rows) {
      // Check if already enrolled
      const existing = await client.query(`
        SELECT * FROM enrollments 
        WHERE user_id = $1 AND course_id = $2
      `, [student.id, courseId]);

      if (existing.rows.length > 0) {
        console.log(`${student.email} already enrolled, updating...`);
        await client.query(`
          UPDATE enrollments 
          SET enrolled_at = NOW(),
              progress = 0
          WHERE user_id = $1 AND course_id = $2
        `, [student.id, courseId]);
      } else {
        console.log(`Enrolling ${student.email} in شهاب شناسی پیشرفته ۱...`);
        await client.query(`
          INSERT INTO enrollments 
          (user_id, course_id, progress, enrolled_at)
          VALUES ($1, $2, 0, NOW())
        `, [student.id, courseId]);
      }
    }

    // Verify enrollment
    const verifyResult = await client.query(`
      SELECT 
        u.email,
        c.title,
        e.progress,
        e.enrolled_at
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      WHERE u.email IN ('student1@test.com', 'student2@test.com')
      AND c.id = 200
    `);

    console.log('\n✅ Enrollment complete! Students enrolled in video courses:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.email}: "${row.title}" (${row.progress}% complete)`);
    });

    // Also check all courses they're enrolled in
    const allCourses = await client.query(`
      SELECT 
        u.email,
        c.title
      FROM enrollments e
      JOIN users u ON u.id = e.user_id
      JOIN courses c ON c.id = e.course_id
      WHERE u.email IN ('student1@test.com', 'student2@test.com')
      ORDER BY u.email, c.title
    `);

    console.log('\n📚 All courses for both students:');
    let currentStudent = '';
    allCourses.rows.forEach(row => {
      if (currentStudent !== row.email) {
        currentStudent = row.email;
        console.log(`\n${row.email}:`);
      }
      console.log(`  - ${row.title}`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

enrollStudentsInVideoCourse();
