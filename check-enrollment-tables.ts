import { Client } from 'pg';

async function checkEnrollmentTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find enrollment related tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%enroll%' OR table_name LIKE '%student%course%')
      ORDER BY table_name
    `);
    
    console.log('Enrollment related tables:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
    // Check if there's a course called شهاب شناسی
    const courseCheck = await client.query(`
      SELECT id, title, description FROM courses 
      WHERE title LIKE '%شهاب%' OR title LIKE '%شناسی%' OR title = 'شهاب شناسی'
    `);
    
    console.log('\nCourses matching شهاب شناسی:');
    if (courseCheck.rows.length > 0) {
      courseCheck.rows.forEach(c => console.log(`  - ID: ${c.id}, Title: ${c.title}`));
    } else {
      console.log('  No existing course found');
    }
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkEnrollmentTables();
