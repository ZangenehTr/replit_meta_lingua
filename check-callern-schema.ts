import { Client } from 'pg';

async function checkSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check student_callern_packages columns
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'student_callern_packages'
      ORDER BY ordinal_position
    `);
    
    console.log('student_callern_packages columns:');
    columns.rows.forEach(c => console.log(`  - ${c.column_name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkSchema();
