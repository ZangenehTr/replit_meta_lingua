/**
 * Test Student Briefing API for Callern Video Calls
 * This test verifies that teachers can see student briefing information
 * when they start a video call with a student.
 */

import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

// Test credentials
const teacherToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySWQiOjQyLCJlbWFpbCI6ImFkbWluQHRlc3QuY29tIiwicm9sZSI6ImFkbWluIiwiaWF0IjoxNzU1NDYwODExLCJleHAiOjE3NTU1NDcyMTF9.CYXEd8MJcPlWT3fda5ue9YwujE9Se7NSUs0qQ2L82wU';
const studentId = 1; // Test student ID

async function testStudentBriefing() {
  console.log('Testing Student Briefing API...\n');

  try {
    // Test 1: Fetch student briefing as a teacher
    console.log('Test 1: Fetching student briefing as teacher...');
    const response = await fetch(`${API_URL}/api/callern/student-briefing/${studentId}`, {
      headers: {
        'Authorization': `Bearer ${teacherToken}`,
        'Content-Type': 'application/json'
      }
    });

    if (response.ok) {
      const briefing = await response.json();
      
      console.log('✅ Student briefing fetched successfully!\n');
      
      // Display student profile
      if (briefing.profile) {
        console.log('Student Profile:');
        console.log(`  Name: ${briefing.profile.firstName} ${briefing.profile.lastName}`);
        console.log(`  Email: ${briefing.profile.email}`);
        console.log(`  Current Level: ${briefing.profile.currentLevel || 'Not set'}`);
        console.log(`  Target Language: ${briefing.profile.targetLanguage || 'Not set'}`);
      }
      
      // Display current package
      if (briefing.currentPackage) {
        console.log('\nCurrent Package:');
        console.log(`  Package: ${briefing.currentPackage.packageName}`);
        console.log(`  Total Hours: ${briefing.currentPackage.totalHours}`);
        console.log(`  Used Minutes: ${briefing.currentPackage.usedMinutes}`);
        console.log(`  Remaining Minutes: ${briefing.currentPackage.remainingMinutes}`);
        if (briefing.currentPackage.roadmapName) {
          console.log(`  Roadmap: ${briefing.currentPackage.roadmapName}`);
        }
      }
      
      // Display roadmap progress
      if (briefing.roadmapProgress && briefing.roadmapProgress.length > 0) {
        console.log('\nRoadmap Progress:');
        briefing.roadmapProgress.slice(0, 3).forEach(step => {
          console.log(`  Step ${step.stepNumber}: ${step.stepTitle} - ${step.status}`);
          if (step.teacherName) {
            console.log(`    Completed by: ${step.teacherName}`);
          }
        });
      }
      
      // Display past lessons
      if (briefing.pastLessons && briefing.pastLessons.length > 0) {
        console.log('\nRecent Lessons:');
        briefing.pastLessons.slice(0, 3).forEach(lesson => {
          console.log(`  ${new Date(lesson.startTime).toLocaleDateString()} - ${lesson.teacherName} (${lesson.durationMinutes} min)`);
          if (lesson.notes) {
            console.log(`    Notes: ${lesson.notes.substring(0, 50)}...`);
          }
        });
      }
      
      // Display performance metrics
      if (briefing.recentPerformance) {
        console.log('\nPerformance Metrics:');
        console.log(`  Total minutes (last 30 days): ${briefing.recentPerformance.totalMinutesLast30Days}`);
        console.log(`  Sessions (last 30 days): ${briefing.recentPerformance.sessionsLast30Days}`);
        console.log(`  Average session length: ${briefing.recentPerformance.averageSessionLength} min`);
      }
      
    } else {
      const error = await response.text();
      console.log(`❌ Failed to fetch student briefing: ${response.status} - ${error}`);
    }

    // Test 2: Try to fetch without authentication (should fail)
    console.log('\nTest 2: Attempting to fetch without authentication...');
    const unauthResponse = await fetch(`${API_URL}/api/callern/student-briefing/${studentId}`);
    
    if (unauthResponse.status === 401) {
      console.log('✅ Correctly rejected unauthorized request');
    } else {
      console.log('❌ Security issue: Unauthorized request was not rejected');
    }

  } catch (error) {
    console.error('Test failed:', error.message);
  }
}

// Run the test
testStudentBriefing();