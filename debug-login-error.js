/**
 * Debug Script for Meta Lingua Login 500 Error
 * Run this on your Iranian server to identify the exact issue
 */

import pg from 'pg';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

const { Client } = pg;

async function debugDeploymentIssue() {
  console.log('🔍 Meta Lingua Deployment Debug Script');
  console.log('=====================================\n');

  // Step 1: Check Environment Variables
  console.log('1️⃣ Checking Environment Variables...');
  const requiredEnvVars = ['DATABASE_URL', 'JWT_SECRET', 'NODE_ENV'];
  
  for (const envVar of requiredEnvVars) {
    const value = process.env[envVar];
    if (value) {
      console.log(`✅ ${envVar}: ${envVar === 'JWT_SECRET' ? '[PRESENT]' : value}`);
    } else {
      console.log(`❌ ${envVar}: [MISSING]`);
    }
  }

  // Step 2: Test Database Connection
  console.log('\n2️⃣ Testing Database Connection...');
  let client;
  
  try {
    client = new Client({
      connectionString: process.env.DATABASE_URL,
    });
    
    await client.connect();
    console.log('✅ Database connection successful');
    
    // Test basic query
    const result = await client.query('SELECT NOW() as current_time');
    console.log(`✅ Database query test: ${result.rows[0].current_time}`);
    
  } catch (error) {
    console.log('❌ Database connection failed:');
    console.log('   Error:', error.message);
    console.log('   Check your DATABASE_URL and ensure PostgreSQL is running');
    return;
  }

  // Step 3: Check Users Table
  console.log('\n3️⃣ Checking Users Table...');
  try {
    const tableCheck = await client.query(`
      SELECT EXISTS (
        SELECT FROM information_schema.tables 
        WHERE table_name = 'users'
      );
    `);
    
    if (tableCheck.rows[0].exists) {
      console.log('✅ Users table exists');
      
      // Count users
      const userCount = await client.query('SELECT COUNT(*) as count FROM users');
      console.log(`✅ Total users in database: ${userCount.rows[0].count}`);
      
    } else {
      console.log('❌ Users table does not exist');
      console.log('   Run: npm run db:push to create database schema');
      return;
    }
  } catch (error) {
    console.log('❌ Error checking users table:');
    console.log('   Error:', error.message);
    return;
  }

  // Step 4: Check Admin User
  console.log('\n4️⃣ Checking Admin User...');
  try {
    const adminCheck = await client.query(
      'SELECT id, email, role, password, is_active FROM users WHERE email = $1',
      ['admin@metalingua.com']
    );
    
    if (adminCheck.rows.length > 0) {
      const admin = adminCheck.rows[0];
      console.log('✅ Admin user found:');
      console.log(`   ID: ${admin.id}`);
      console.log(`   Email: ${admin.email}`);
      console.log(`   Role: ${admin.role}`);
      console.log(`   Active: ${admin.is_active}`);
      console.log(`   Has Password: ${admin.password ? 'Yes' : 'No'}`);
      
      // Test password verification
      if (admin.password) {
        const testPassword = 'admin123';
        const isValidPassword = await bcrypt.compare(testPassword, admin.password);
        console.log(`   Password 'admin123' valid: ${isValidPassword}`);
      }
      
    } else {
      console.log('❌ Admin user not found');
      console.log('   Creating admin user...');
      
      const hashedPassword = await bcrypt.hash('admin123', 10);
      await client.query(`
        INSERT INTO users (email, password, role, first_name, last_name, phone_number, is_active)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
      `, ['admin@metalingua.com', hashedPassword, 'admin', 'Administrator', 'Meta Lingua', '+98xxxxxxxxxx', true]);
      
      console.log('✅ Admin user created successfully');
      console.log('   Email: admin@metalingua.com');
      console.log('   Password: admin123');
    }
  } catch (error) {
    console.log('❌ Error with admin user:');
    console.log('   Error:', error.message);
  }

  // Step 5: Test JWT Token Generation
  console.log('\n5️⃣ Testing JWT Token Generation...');
  try {
    const testPayload = { userId: 1, email: 'admin@metalingua.com', role: 'admin' };
    const token = jwt.sign(testPayload, process.env.JWT_SECRET, { expiresIn: '24h' });
    console.log('✅ JWT token generation successful');
    console.log(`   Token length: ${token.length} characters`);
    
    // Test token verification
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('✅ JWT token verification successful');
    console.log(`   Decoded payload: ${JSON.stringify(decoded)}`);
    
  } catch (error) {
    console.log('❌ JWT token generation/verification failed:');
    console.log('   Error:', error.message);
  }

  // Step 6: Test Full Login Flow
  console.log('\n6️⃣ Testing Full Login Flow...');
  try {
    // Simulate the login process
    const email = 'admin@metalingua.com';
    const password = 'admin123';
    
    console.log(`   Testing login for: ${email}`);
    
    // Get user
    const userResult = await client.query('SELECT * FROM users WHERE email = $1', [email]);
    if (userResult.rows.length === 0) {
      console.log('❌ User not found in login test');
      return;
    }
    
    const user = userResult.rows[0];
    console.log('✅ User found in login test');
    
    // Test password
    const isValidPassword = await bcrypt.compare(password, user.password);
    if (!isValidPassword) {
      console.log('❌ Password verification failed in login test');
      return;
    }
    
    console.log('✅ Password verification successful in login test');
    
    // Test JWT generation
    const token = jwt.sign(
      { userId: user.id, email: user.email, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    console.log('✅ Complete login flow test successful');
    console.log('✅ Your login should work now!');
    
  } catch (error) {
    console.log('❌ Login flow test failed:');
    console.log('   Error:', error.message);
    console.log('   Stack:', error.stack);
  }

  // Step 7: Final Recommendations
  console.log('\n🎯 FINAL DIAGNOSIS:');
  
  if (client) {
    try {
      const finalUserCheck = await client.query(
        'SELECT COUNT(*) as admin_count FROM users WHERE email = $1 AND role = $2 AND is_active = true',
        ['admin@metalingua.com', 'admin']
      );
      
      if (finalUserCheck.rows[0].admin_count > 0) {
        console.log('✅ Setup appears correct - try logging in again');
        console.log('   Email: admin@metalingua.com');
        console.log('   Password: admin123');
      } else {
        console.log('❌ Admin user setup issue detected');
      }
    } catch (finalError) {
      console.log('❌ Final check failed:', finalError.message);
    }
    
    await client.end();
  }
  
  console.log('\nIf issues persist, check your application logs for the specific error details.');
}

// Run the debug script
debugDeploymentIssue().catch(console.error);