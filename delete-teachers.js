// Script to delete all teachers except one test teacher
import axios from 'axios';

const API_BASE_URL = 'http://localhost:5000/api';

// Test credentials
const adminCredentials = {
  email: 'admin@test.com',
  password: 'admin123'
};

async function login() {
  try {
    const response = await axios.post(`${API_BASE_URL}/auth/login`, adminCredentials);
    console.log('Login response:', response.data);
    
    // The token is in response.data.auth_token
    const token = response.data.auth_token;
    if (!token) {
      throw new Error('No token received from login');
    }
    return token;
  } catch (error) {
    console.error('Login failed:', error.response?.data || error.message);
    throw error;
  }
}

async function deleteExtraTeachers() {
  try {
    // Login as admin
    const adminToken = await login();
    console.log('✓ Admin logged in successfully');

    // Get all users
    const usersResponse = await axios.get(
      `${API_BASE_URL}/admin/users`,
      { headers: { Authorization: `Bearer ${adminToken}` } }
    );

    // Filter teachers
    const teachers = usersResponse.data.filter(user => user.role === 'Teacher/Tutor');
    console.log(`Found ${teachers.length} teachers`);

    if (teachers.length <= 1) {
      console.log('Only one or no teachers found, nothing to delete');
      return;
    }

    // Keep the first teacher, delete the rest
    const teacherToKeep = teachers[0];
    console.log(`Keeping teacher: ${teacherToKeep.email} (ID: ${teacherToKeep.id})`);

    // Delete other teachers
    let deletedCount = 0;
    for (let i = 1; i < teachers.length; i++) {
      const teacher = teachers[i];
      try {
        await axios.delete(
          `${API_BASE_URL}/admin/users/${teacher.id}`,
          { headers: { Authorization: `Bearer ${adminToken}` } }
        );
        console.log(`✓ Deleted teacher: ${teacher.email} (ID: ${teacher.id})`);
        deletedCount++;
      } catch (error) {
        console.error(`✗ Failed to delete teacher ${teacher.email}:`, error.response?.data || error.message);
      }
    }

    console.log(`\n=====================================`);
    console.log(`TEACHER CLEANUP COMPLETE`);
    console.log(`=====================================`);
    console.log(`Teachers deleted: ${deletedCount}`);
    console.log(`Remaining teacher: ${teacherToKeep.email}`);
    console.log(`=====================================`);

  } catch (error) {
    console.error('Failed to delete teachers:', error);
    process.exit(1);
  }
}

// Run the cleanup
deleteExtraTeachers().then(() => {
  console.log('Teacher cleanup completed successfully');
  process.exit(0);
}).catch(error => {
  console.error('Teacher cleanup failed:', error);
  process.exit(1);
});