// Script to analyze user distribution by role
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

async function analyzeUsers() {
  try {
    // Login as admin
    const adminToken = await login();
    console.log('✓ Admin logged in successfully\n');

    // Get all users
    const usersResponse = await axios.get(
      `${API_BASE_URL}/admin/users`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    const users = usersResponse.data;
    console.log(`Total users in database: ${users.length}\n`);

    // Count users by role
    const roleDistribution = {};
    const emailDomainDistribution = {};
    const usersWithoutRole = [];
    const duplicateEmails = {};
    
    users.forEach(user => {
      // Count by role
      const role = user.role || 'No Role Assigned';
      roleDistribution[role] = (roleDistribution[role] || 0) + 1;
      
      // Track users without role
      if (!user.role) {
        usersWithoutRole.push({
          id: user.id,
          email: user.email,
          firstName: user.firstName,
          lastName: user.lastName
        });
      }
      
      // Count by email domain
      if (user.email) {
        const domain = user.email.split('@')[1] || 'unknown';
        emailDomainDistribution[domain] = (emailDomainDistribution[domain] || 0) + 1;
        
        // Track duplicate emails
        const emailLower = user.email.toLowerCase();
        if (!duplicateEmails[emailLower]) {
          duplicateEmails[emailLower] = [];
        }
        duplicateEmails[emailLower].push(user.id);
      }
    });

    // Display role distribution
    console.log('=====================================');
    console.log('USER DISTRIBUTION BY ROLE');
    console.log('=====================================');
    
    const sortedRoles = Object.entries(roleDistribution)
      .sort((a, b) => b[1] - a[1]);
    
    sortedRoles.forEach(([role, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      console.log(`${role.padEnd(20)} : ${count.toString().padStart(6)} users (${percentage}%)`);
    });

    // Display email domain distribution (top 10)
    console.log('\n=====================================');
    console.log('TOP EMAIL DOMAINS');
    console.log('=====================================');
    
    const sortedDomains = Object.entries(emailDomainDistribution)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);
    
    sortedDomains.forEach(([domain, count]) => {
      const percentage = ((count / users.length) * 100).toFixed(1);
      console.log(`${domain.padEnd(30)} : ${count.toString().padStart(6)} users (${percentage}%)`);
    });

    // Check for duplicate emails
    const duplicates = Object.entries(duplicateEmails).filter(([email, ids]) => ids.length > 1);
    if (duplicates.length > 0) {
      console.log('\n=====================================');
      console.log('DUPLICATE EMAIL ADDRESSES');
      console.log('=====================================');
      console.log(`Found ${duplicates.length} email addresses used by multiple users:`);
      duplicates.slice(0, 10).forEach(([email, ids]) => {
        console.log(`  ${email}: used by ${ids.length} users (IDs: ${ids.join(', ')})`);
      });
    }

    // Sample of users without roles
    if (usersWithoutRole.length > 0) {
      console.log('\n=====================================');
      console.log('SAMPLE USERS WITHOUT ROLES');
      console.log('=====================================');
      console.log(`Total users without role: ${usersWithoutRole.length}`);
      console.log('First 10 users without role:');
      usersWithoutRole.slice(0, 10).forEach(user => {
        console.log(`  ID: ${user.id}, Email: ${user.email}, Name: ${user.firstName} ${user.lastName}`);
      });
    }

    // Summary statistics
    console.log('\n=====================================');
    console.log('SUMMARY STATISTICS');
    console.log('=====================================');
    console.log(`Total Users: ${users.length}`);
    console.log(`Users with Role: ${users.length - usersWithoutRole.length}`);
    console.log(`Users without Role: ${usersWithoutRole.length}`);
    console.log(`Unique Roles: ${Object.keys(roleDistribution).length}`);
    console.log(`Duplicate Emails: ${duplicates.length}`);
    
    // Check for test/demo data patterns
    const testPatterns = ['test', 'demo', 'example', 'sample', 'qqq', 'www', 'aaa'];
    let testUsers = 0;
    
    users.forEach(user => {
      const emailLower = (user.email || '').toLowerCase();
      const nameLower = ((user.firstName || '') + (user.lastName || '')).toLowerCase();
      
      if (testPatterns.some(pattern => 
        emailLower.includes(pattern) || nameLower.includes(pattern)
      )) {
        testUsers++;
      }
    });
    
    console.log(`\nPotential Test/Demo Users: ${testUsers} (${((testUsers / users.length) * 100).toFixed(1)}%)`);

    // Recommendations
    console.log('\n=====================================');
    console.log('RECOMMENDATIONS');
    console.log('=====================================');
    if (usersWithoutRole.length > 0) {
      console.log(`⚠️  ${usersWithoutRole.length} users have no role assigned - consider assigning roles or removing`);
    }
    if (duplicates.length > 0) {
      console.log(`⚠️  ${duplicates.length} duplicate email addresses found - consider data cleanup`);
    }
    if (testUsers > users.length * 0.1) {
      console.log(`⚠️  High percentage of test users (${((testUsers / users.length) * 100).toFixed(1)}%) - consider cleanup`);
    }
    
    // Specific role counts
    console.log('\n=====================================');
    console.log('EXPECTED ROLE COUNTS');
    console.log('=====================================');
    console.log(`Students: ${roleDistribution['Student'] || 0}`);
    console.log(`Teachers: ${roleDistribution['Teacher/Tutor'] || 0}`);
    console.log(`Mentors: ${roleDistribution['Mentor'] || 0}`);
    console.log(`Admins: ${roleDistribution['Admin'] || roleDistribution['admin'] || 0}`);
    console.log(`Supervisors: ${roleDistribution['Supervisor'] || 0}`);
    console.log(`Call Center Agents: ${roleDistribution['Call Center Agent'] || 0}`);
    console.log(`Accountants: ${roleDistribution['Accountant'] || 0}`);

  } catch (error) {
    console.error('Failed to analyze users:', error);
    process.exit(1);
  }
}

// Run the analysis
analyzeUsers().then(() => {
  console.log('\nUser analysis completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('User analysis failed:', error);
  process.exit(1);
});