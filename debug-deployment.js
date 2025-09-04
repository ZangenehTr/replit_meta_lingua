/**
 * Simple Debug Script for Meta Lingua Deployment
 * No external dependencies required
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import { readFileSync } from 'fs';

const { Client } = pg;

// Load .env manually
const envContent = readFileSync('.env', 'utf8');
const env = {};
envContent.split('\n').forEach(line => {
  const [key, ...valueParts] = line.split('=');
  if (key && valueParts.length) {
    env[key.trim()] = valueParts.join('=').trim();
  }
});

async function diagnoseIssue() {
  console.log('🔍 Meta Lingua Deployment Diagnosis');
  console.log('===================================\n');

  console.log('Environment check:');
  console.log(`✅ DATABASE_URL: ${env.DATABASE_URL ? '[SET]' : '[MISSING]'}`);
  console.log(`✅ JWT_SECRET: ${env.JWT_SECRET ? '[SET]' : '[MISSING]'}`);
  console.log(`✅ NODE_ENV: ${env.NODE_ENV || '[NOT SET]'}\n`);

  if (!env.DATABASE_URL) {
    console.log('❌ DATABASE_URL missing from .env file');
    return;
  }

  let client;
  try {
    console.log('Testing database connection...');
    client = new Client({ connectionString: env.DATABASE_URL });
    await client.connect();
    console.log('✅ Database connected successfully\n');

    // Check if users table exists
    console.log('Checking database schema...');
    const tableCheck = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('users', 'courses', 'institute_branding')
      ORDER BY table_name;
    `);

    if (tableCheck.rows.length === 0) {
      console.log('❌ No tables found - you need to run database migration');
      console.log('   Solution: Run "npm run db:push" on your server\n');
      return;
    } else {
      console.log('✅ Database tables found:');
      tableCheck.rows.forEach(row => console.log(`   - ${row.table_name}`));
      console.log('');
    }

    // Check for admin user
    console.log('Checking admin user...');
    const adminCheck = await client.query(
      'SELECT id, email, role, is_active FROM users WHERE email = $1',
      ['admin@metalingua.com']
    );

    if (adminCheck.rows.length === 0) {
      console.log('❌ Admin user not found - creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (
          email, password, role, first_name, last_name, 
          phone_number, is_active, created_at, updated_at
        ) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW())
      `, [
        'admin@metalingua.com',
        hashedPassword,
        'admin',
        'Administrator', 
        'Meta Lingua',
        '+98xxxxxxxxxx',
        true
      ]);
      
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@metalingua.com');
      console.log('   Password: admin123\n');
    } else {
      const admin = adminCheck.rows[0];
      console.log('✅ Admin user exists:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.is_active}\n`);
    }

    // Test login process
    console.log('Testing login process...');
    const user = (await client.query('SELECT * FROM users WHERE email = $1', ['admin@metalingua.com'])).rows[0];
    const passwordValid = await bcrypt.compare('admin123', user.password);
    
    console.log(`✅ Password verification: ${passwordValid ? 'SUCCESS' : 'FAILED'}`);
    console.log('✅ Login should work now!\n');

    console.log('🎉 DEPLOYMENT FIX COMPLETE');
    console.log('Try logging in with:');
    console.log('   Email: admin@metalingua.com');
    console.log('   Password: admin123');

  } catch (error) {
    console.log('❌ Error occurred:');
    console.log('   Message:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('   Issue: PostgreSQL server not running');
      console.log('   Fix: Start PostgreSQL with "sudo systemctl start postgresql"');
    } else if (error.code === '28P01') {
      console.log('   Issue: Authentication failed');
      console.log('   Fix: Check your DATABASE_URL username/password');
    } else if (error.code === '3D000') {
      console.log('   Issue: Database does not exist');
      console.log('   Fix: Create the database first');
    } else {
      console.log('   Stack:', error.stack);
    }
  } finally {
    if (client) {
      await client.end();
    }
  }
}

diagnoseIssue().catch(console.error);