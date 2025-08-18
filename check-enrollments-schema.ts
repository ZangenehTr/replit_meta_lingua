import { Client } from 'pg';

async function checkEnrollmentsSchema() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Check enrollments table columns
    const columns = await client.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'enrollments'
      ORDER BY ordinal_position
    `);
    
    console.log('enrollments table columns:');
    columns.rows.forEach(c => console.log(`  - ${c.column_name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkEnrollmentsSchema();
