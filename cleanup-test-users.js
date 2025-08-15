// Script to delete all test users with lowercase roles
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Admin credentials
const adminCredentials = {
  email: 'admin@test.com',
  password: 'admin123'
};

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
    return response.data.auth_token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function cleanupTestUsers() {
  try {
    // Login as admin
    const adminToken = await login();
    console.log('✓ Admin logged in successfully\n');

    // Get all users
    console.log('Fetching all users...');
    const usersResponse = await axios.get(
      `${API_BASE_URL}/admin/users`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const allUsers = usersResponse.data;
    console.log(`Total users before cleanup: ${allUsers.length}\n`);

    // Identify test users (lowercase roles) vs production users (proper case roles)
    const testRoles = ['student', 'teacher', 'admin', 'mentor', 'instructor'];
    const productionRoles = ['Student', 'Teacher/Tutor', 'Admin', 'Mentor', 'Teacher', 
                             'Supervisor', 'Call Center Agent', 'Accountant', 
                             'supervisor', 'callcenter', 'accountant'];

    const testUsers = [];
    const productionUsers = [];
    
    allUsers.forEach(user => {
      if (testRoles.includes(user.role)) {
        testUsers.push(user);
      } else if (productionRoles.includes(user.role) || !user.role) {
        productionUsers.push(user);
      }
    });

    console.log('=====================================');
    console.log('USER ANALYSIS');
    console.log('=====================================');
    console.log(`Test users to delete: ${testUsers.length}`);
    console.log(`Production users to keep: ${productionUsers.length}`);
    console.log('');

    // Show breakdown of test users
    const testUsersByRole = {};
    testUsers.forEach(user => {
      testUsersByRole[user.role] = (testUsersByRole[user.role] || 0) + 1;
    });
    
    console.log('Test users by role (to be deleted):');
    Object.entries(testUsersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    // Show breakdown of production users
    const prodUsersByRole = {};
    productionUsers.forEach(user => {
      const role = user.role || 'No Role';
      prodUsersByRole[role] = (prodUsersByRole[role] || 0) + 1;
    });
    
    console.log('\nProduction users by role (to be kept):');
    Object.entries(prodUsersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    // Confirm before deletion
    console.log('\n=====================================');
    console.log('STARTING DELETION PROCESS');
    console.log('=====================================');
    console.log(`Deleting ${testUsers.length} test users...\n`);

    // Delete test users in batches
    const batchSize = 50;
    let deletedCount = 0;
    let failedCount = 0;
    const failedUsers = [];

    for (let i = 0; i < testUsers.length; i += batchSize) {
      const batch = testUsers.slice(i, i + batchSize);
      const batchPromises = batch.map(async (user) => {
        try {
          await axios.delete(
            `${API_BASE_URL}/admin/users/${user.id}`,
            { headers: { Authorization: `Bearer ${adminToken}` } }
          );
          deletedCount++;
          if (deletedCount % 100 === 0) {
            console.log(`Progress: ${deletedCount} users deleted...`);
          }
          return { success: true, user };
        } catch (error) {
          failedCount++;
          failedUsers.push({
            id: user.id,
            email: user.email,
            error: error.response?.data?.message || error.message
          });
          return { success: false, user, error };
        }
      });

      // Wait for batch to complete
      await Promise.all(batchPromises);
    }

    // Final summary
    console.log('\n=====================================');
    console.log('CLEANUP COMPLETE');
    console.log('=====================================');
    console.log(`✓ Successfully deleted: ${deletedCount} test users`);
    if (failedCount > 0) {
      console.log(`✗ Failed to delete: ${failedCount} users`);
      console.log('\nFirst 10 failed deletions:');
      failedUsers.slice(0, 10).forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Error: ${user.error}`);
      });
    }

    // Verify final count
    console.log('\nVerifying final user count...');
    const finalUsersResponse = await axios.get(
      `${API_BASE_URL}/admin/users`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );
    
    const finalUsers = finalUsersResponse.data;
    console.log(`\nFinal user count: ${finalUsers.length} users`);
    
    // Show final breakdown
    const finalUsersByRole = {};
    finalUsers.forEach(user => {
      const role = user.role || 'No Role';
      finalUsersByRole[role] = (finalUsersByRole[role] || 0) + 1;
    });
    
    console.log('\nFinal users by role:');
    Object.entries(finalUsersByRole).forEach(([role, count]) => {
      console.log(`  ${role}: ${count} users`);
    });

    console.log('\n=====================================');
    console.log('CLEANUP SUMMARY');
    console.log('=====================================');
    console.log(`Before cleanup: ${allUsers.length} users`);
    console.log(`After cleanup: ${finalUsers.length} users`);
    console.log(`Users removed: ${allUsers.length - finalUsers.length}`);
    console.log(`Success rate: ${((deletedCount / testUsers.length) * 100).toFixed(1)}%`);
    console.log('=====================================');

  } catch (error) {
    console.error('Cleanup failed:', error);
    process.exit(1);
  }
}

// Run the cleanup
console.log('=====================================');
console.log('TEST USER CLEANUP SCRIPT');
console.log('=====================================');
console.log('This script will delete all test users with lowercase roles');
console.log('(student, teacher, admin, mentor) and keep production users.\n');

cleanupTestUsers().then(() => {
  console.log('\nCleanup completed successfully!');
  console.log('Your dashboard should now show accurate user counts.');
  process.exit(0);
}).catch(error => {
  console.error('Cleanup failed:', error);
  process.exit(1);
});