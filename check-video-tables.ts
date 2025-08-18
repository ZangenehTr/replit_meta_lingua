import { Client } from 'pg';

async function checkVideoTables() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    
    // Find video course related tables
    const tables = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND (table_name LIKE '%video%' OR table_name LIKE '%course%')
      ORDER BY table_name
    `);
    
    console.log('Video/Course related tables:');
    tables.rows.forEach(t => console.log(`  - ${t.table_name}`));
    
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

checkVideoTables();
