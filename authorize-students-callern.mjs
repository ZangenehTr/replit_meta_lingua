import pg from 'pg';
import dotenv from 'dotenv';

const { Client } = pg;
dotenv.config();

async function authorizeStudentsForCallern() {
  const client = new Client({
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  });

  try {
    await client.connect();
    console.log('Connected to database');

    // Get the student IDs
    const studentsResult = await client.query(`
      SELECT id, email, "firstName", "lastName" 
      FROM users 
      WHERE email IN ('student1@test.com', 'student2@test.com')
    `);
    
    console.log('Found students:', studentsResult.rows);

    // Get the Callern starter package
    const packageResult = await client.query(`
      SELECT * FROM "callernPackages" 
      WHERE "packageName" = 'English Conversation Starter'
      LIMIT 1
    `);
    
    const packageId = packageResult.rows[0].id;
    console.log('Using package:', packageResult.rows[0].packageName);

    // Authorize both students
    for (const student of studentsResult.rows) {
      // Check if already has this package
      const existing = await client.query(`
        SELECT * FROM "studentCallernPackages" 
        WHERE "studentId" = $1 AND "packageId" = $2
      `, [student.id, packageId]);

      if (existing.rows.length > 0) {
        console.log(`Student ${student.email} already has package, updating...`);
        await client.query(`
          UPDATE "studentCallernPackages" 
          SET "remainingMinutes" = 600, 
              "purchaseDate" = NOW(),
              "expirationDate" = NOW() + INTERVAL '90 days'
          WHERE "studentId" = $1 AND "packageId" = $2
        `, [student.id, packageId]);
      } else {
        console.log(`Authorizing ${student.email} for Callern starter package...`);
        await client.query(`
          INSERT INTO "studentCallernPackages" 
          ("studentId", "packageId", "remainingMinutes", "purchaseDate", "expirationDate")
          VALUES ($1, $2, 600, NOW(), NOW() + INTERVAL '90 days')
        `, [student.id, packageId]);
      }
    }

    // Verify the authorization
    const verifyResult = await client.query(`
      SELECT 
        u.email,
        u."firstName",
        scp."remainingMinutes",
        cp."packageName"
      FROM "studentCallernPackages" scp
      JOIN users u ON u.id = scp."studentId"
      JOIN "callernPackages" cp ON cp.id = scp."packageId"
      WHERE u.email IN ('student1@test.com', 'student2@test.com')
    `);

    console.log('\n✅ Authorization complete! Students now have:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.email}: ${row.packageName} with ${row.remainingMinutes} minutes remaining`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

authorizeStudentsForCallern();
