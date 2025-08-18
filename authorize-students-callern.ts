import { Client } from 'pg';

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
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE email IN ('student1@test.com', 'student2@test.com')
    `);
    
    console.log('Found students:', studentsResult.rows.map(s => s.email));

    // Get the Callern starter package
    const packageResult = await client.query(`
      SELECT * FROM callern_packages 
      WHERE package_name = 'English Conversation Starter'
      LIMIT 1
    `);
    
    if (packageResult.rows.length === 0) {
      console.log('Package not found');
      return;
    }
    
    const packageId = packageResult.rows[0].id;
    const packagePrice = packageResult.rows[0].price;
    console.log('Using package:', packageResult.rows[0].package_name);

    // Authorize both students
    for (const student of studentsResult.rows) {
      // Check if already has this package
      const existing = await client.query(`
        SELECT * FROM student_callern_packages 
        WHERE student_id = $1 AND package_id = $2
      `, [student.id, packageId]);

      if (existing.rows.length > 0) {
        console.log(`Student ${student.email} already has package, updating...`);
        await client.query(`
          UPDATE student_callern_packages 
          SET remaining_minutes = 600, 
              used_minutes = 0,
              total_hours = 10,
              status = 'active',
              purchased_at = NOW(),
              expires_at = NOW() + INTERVAL '90 days'
          WHERE student_id = $1 AND package_id = $2
        `, [student.id, packageId]);
      } else {
        console.log(`Authorizing ${student.email} for Callern starter package...`);
        await client.query(`
          INSERT INTO student_callern_packages 
          (student_id, package_id, total_hours, used_minutes, remaining_minutes, price, status, purchased_at, expires_at, created_at)
          VALUES ($1, $2, 10, 0, 600, $3, 'active', NOW(), NOW() + INTERVAL '90 days', NOW())
        `, [student.id, packageId, packagePrice]);
      }
    }

    // Verify the authorization
    const verifyResult = await client.query(`
      SELECT 
        u.email,
        u.first_name,
        scp.remaining_minutes,
        scp.status,
        cp.package_name
      FROM student_callern_packages scp
      JOIN users u ON u.id = scp.student_id
      JOIN callern_packages cp ON cp.id = scp.package_id
      WHERE u.email IN ('student1@test.com', 'student2@test.com')
      AND scp.status = 'active'
    `);

    console.log('\n✅ Authorization complete! Students now have:');
    verifyResult.rows.forEach(row => {
      console.log(`- ${row.email}: ${row.package_name} with ${row.remaining_minutes} minutes (${row.status})`);
    });

  } catch (error) {
    console.error('Error:', error);
  } finally {
    await client.end();
  }
}

authorizeStudentsForCallern();
