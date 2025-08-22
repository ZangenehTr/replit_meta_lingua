#!/usr/bin/env node

/**
 * Comprehensive test for Callern video call fixes
 * Tests:
 * 1. Teacher incoming call functionality
 * 2. Video/audio toggle persistence
 * 3. Scoring overlay visibility
 * 4. Video window sizing
 */

const puppeteer = require('puppeteer');
const { io } = require('socket.io-client');

const BASE_URL = 'http://localhost:5000';
const TEACHER_EMAIL = 'teacher1@test.com';
const TEACHER_PASSWORD = 'teacher123';
const STUDENT_EMAIL = 'student1@test.com';
const STUDENT_PASSWORD = 'student123';

// Test results
const results = {
  passed: [],
  failed: [],
  warnings: []
};

function log(message, type = 'info') {
  const timestamp = new Date().toISOString();
  const prefix = type === 'error' ? '❌' : type === 'success' ? '✅' : type === 'warning' ? '⚠️' : 'ℹ️';
  console.log(`[${timestamp}] ${prefix} ${message}`);
}

async function loginUser(page, email, password) {
  await page.goto(`${BASE_URL}/login`);
  await page.waitForSelector('input[type="email"]');
  await page.type('input[type="email"]', email);
  await page.type('input[type="password"]', password);
  await page.click('button[type="submit"]');
  await page.waitForNavigation();
  return true;
}

async function testTeacherIncomingCall() {
  log('Testing Teacher Incoming Call functionality...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  
  try {
    // Open teacher page
    const teacherPage = await browser.newPage();
    await teacherPage.setViewport({ width: 1280, height: 720 });
    
    // Grant permissions for media
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(BASE_URL, ['camera', 'microphone']);
    
    // Login as teacher
    await loginUser(teacherPage, TEACHER_EMAIL, TEACHER_PASSWORD);
    await teacherPage.waitForTimeout(2000);
    
    // Check if TeacherIncomingCall component is mounted
    const consoleMessages = [];
    teacherPage.on('console', msg => {
      const text = msg.text();
      consoleMessages.push(text);
      if (text.includes('TeacherIncomingCall component mounted')) {
        log('Teacher incoming call component mounted successfully', 'success');
        results.passed.push('Teacher incoming call component mounted');
      }
      if (text.includes('📡 Now listening for incoming calls')) {
        log('Teacher is listening for incoming calls', 'success');
        results.passed.push('Teacher listening for calls');
      }
    });
    
    await teacherPage.waitForTimeout(3000);
    
    // Simulate incoming call via WebSocket
    const socket = io(BASE_URL, { path: '/socket.io/' });
    
    socket.on('connect', () => {
      log('Test socket connected', 'success');
      
      // Simulate student calling teacher
      socket.emit('call-request', {
        teacherId: 73,
        studentId: 8469,
        packageId: 1,
        language: 'English',
        studentInfo: {
          firstName: 'Test',
          lastName: 'Student',
          email: 'student1@test.com'
        }
      });
    });
    
    await teacherPage.waitForTimeout(5000);
    
    // Check if incoming call dialog appears
    const hasIncomingCallDialog = await teacherPage.evaluate(() => {
      return document.querySelector('[role="dialog"]') !== null;
    });
    
    if (hasIncomingCallDialog) {
      log('Incoming call dialog appeared', 'success');
      results.passed.push('Incoming call dialog displayed');
    } else {
      log('Incoming call dialog did not appear', 'error');
      results.failed.push('Incoming call dialog not displayed');
    }
    
    socket.disconnect();
    await browser.close();
  } catch (error) {
    log(`Teacher incoming call test failed: ${error.message}`, 'error');
    results.failed.push(`Teacher incoming call test: ${error.message}`);
    await browser.close();
  }
}

async function testVideoCallInterface() {
  log('Testing Video Call Interface improvements...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    args: ['--use-fake-ui-for-media-stream', '--use-fake-device-for-media-stream']
  });
  
  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1920, height: 1080 });
    
    // Grant permissions
    const context = browser.defaultBrowserContext();
    await context.overridePermissions(BASE_URL, ['camera', 'microphone']);
    
    // Login as student
    await loginUser(page, STUDENT_EMAIL, STUDENT_PASSWORD);
    await page.waitForTimeout(2000);
    
    // Navigate to Callern page
    await page.goto(`${BASE_URL}/callern`);
    await page.waitForTimeout(3000);
    
    // Click on first available teacher to start call
    const teacherCard = await page.$('.cursor-pointer');
    if (teacherCard) {
      await teacherCard.click();
      await page.waitForTimeout(2000);
      
      // Check video window sizing
      const localVideoSize = await page.evaluate(() => {
        const localVideo = document.querySelector('video[muted]');
        if (localVideo) {
          const parent = localVideo.closest('div');
          return {
            width: parent?.offsetWidth,
            height: parent?.offsetHeight
          };
        }
        return null;
      });
      
      if (localVideoSize) {
        log(`Local video size: ${localVideoSize.width}x${localVideoSize.height}px`, 'info');
        
        // Check if video is larger than old size (was 192x144, now should be 320x240)
        if (localVideoSize.width >= 320 && localVideoSize.height >= 240) {
          log('Video window properly sized for education', 'success');
          results.passed.push('Video window sizing improved');
        } else {
          log('Video window still too small', 'warning');
          results.warnings.push('Video window may need further sizing adjustments');
        }
      }
      
      // Check scoring overlay visibility
      const scoringOverlay = await page.evaluate(() => {
        // Look for scoring overlay elements
        const overlay = document.querySelector('[class*="backdrop-blur"]');
        if (overlay) {
          const styles = window.getComputedStyle(overlay);
          return {
            exists: true,
            opacity: styles.opacity,
            backgroundColor: styles.backgroundColor,
            zIndex: styles.zIndex
          };
        }
        return { exists: false };
      });
      
      if (scoringOverlay.exists) {
        log('Scoring overlay found and visible', 'success');
        log(`Overlay styles: opacity=${scoringOverlay.opacity}, bg=${scoringOverlay.backgroundColor}, z-index=${scoringOverlay.zIndex}`, 'info');
        results.passed.push('Scoring overlay visible');
      } else {
        log('Scoring overlay not found', 'error');
        results.failed.push('Scoring overlay not visible');
      }
      
      // Test camera/mic toggle
      const micButton = await page.$('button:has([class*="Mic"])');
      const videoButton = await page.$('button:has([class*="Video"])');
      
      if (micButton && videoButton) {
        // Toggle mic off
        await micButton.click();
        await page.waitForTimeout(1000);
        
        // Toggle mic back on
        await micButton.click();
        await page.waitForTimeout(1000);
        
        // Check if mic re-enabled
        const micState = await page.evaluate(() => {
          const tracks = document.querySelector('video[muted]')?.srcObject?.getAudioTracks();
          return tracks && tracks[0]?.enabled;
        });
        
        if (micState) {
          log('Microphone toggle working correctly', 'success');
          results.passed.push('Microphone toggle fixed');
        } else {
          log('Microphone did not re-enable', 'error');
          results.failed.push('Microphone toggle issue');
        }
        
        // Toggle video off
        await videoButton.click();
        await page.waitForTimeout(1000);
        
        // Toggle video back on
        await videoButton.click();
        await page.waitForTimeout(1000);
        
        // Check if video re-enabled
        const videoState = await page.evaluate(() => {
          const tracks = document.querySelector('video[muted]')?.srcObject?.getVideoTracks();
          return tracks && tracks[0]?.enabled;
        });
        
        if (videoState) {
          log('Camera toggle working correctly', 'success');
          results.passed.push('Camera toggle fixed');
        } else {
          log('Camera did not re-enable', 'error');
          results.failed.push('Camera toggle issue');
        }
      }
    }
    
    await browser.close();
  } catch (error) {
    log(`Video call interface test failed: ${error.message}`, 'error');
    results.failed.push(`Video call interface test: ${error.message}`);
    await browser.close();
  }
}

async function runAllTests() {
  log('Starting Callern Video Call Tests', 'info');
  log('================================', 'info');
  
  // Check if server is running
  try {
    const response = await fetch(BASE_URL);
    if (!response.ok) {
      throw new Error('Server not responding');
    }
  } catch (error) {
    log('Server is not running. Please start the server first.', 'error');
    process.exit(1);
  }
  
  // Run tests
  await testTeacherIncomingCall();
  await testVideoCallInterface();
  
  // Print summary
  log('', 'info');
  log('Test Summary', 'info');
  log('============', 'info');
  log(`✅ Passed: ${results.passed.length}`, 'success');
  results.passed.forEach(test => log(`   - ${test}`, 'info'));
  
  if (results.warnings.length > 0) {
    log(`⚠️  Warnings: ${results.warnings.length}`, 'warning');
    results.warnings.forEach(warning => log(`   - ${warning}`, 'info'));
  }
  
  if (results.failed.length > 0) {
    log(`❌ Failed: ${results.failed.length}`, 'error');
    results.failed.forEach(test => log(`   - ${test}`, 'info'));
    process.exit(1);
  } else {
    log('', 'info');
    log('All critical tests passed! ✨', 'success');
    log('Callern video call improvements are working correctly.', 'success');
  }
}

// Run tests
runAllTests().catch(error => {
  log(`Test execution failed: ${error.message}`, 'error');
  process.exit(1);
});