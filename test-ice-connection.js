// Test script to verify WebRTC ICE connection
const puppeteer = require('puppeteer');

async function testICEConnection() {
    console.log('Testing WebRTC ICE Connection...\n');
    
    const browser = await puppeteer.launch({ 
        headless: false,
        args: [
            '--use-fake-ui-for-media-stream',
            '--use-fake-device-for-media-stream'
        ]
    });

    try {
        // Open student page
        const studentPage = await browser.newPage();
        await studentPage.goto('http://localhost:5000/test-callern-complete.html');
        
        // Login as student
        await studentPage.type('#email', 'student1@test.com');
        await studentPage.type('#password', 'password123');
        await studentPage.click('#login-btn');
        await studentPage.waitForTimeout(2000);
        
        // Open teacher page
        const teacherPage = await browser.newPage();
        await teacherPage.goto('http://localhost:5000/test-callern-complete.html');
        
        // Login as teacher
        await teacherPage.type('#email', 'teacher1@test.com');
        await teacherPage.type('#password', 'password123');
        await teacherPage.click('#login-btn');
        await teacherPage.waitForTimeout(2000);
        
        // Student starts call
        console.log('Student starting call...');
        await studentPage.click('#start-call-btn');
        await studentPage.waitForTimeout(3000);
        
        // Teacher accepts call
        console.log('Teacher accepting call...');
        await teacherPage.click('#accept-call-btn');
        await teacherPage.waitForTimeout(5000);
        
        // Check connection status
        const studentStatus = await studentPage.$eval('#call-status-value', el => el.textContent);
        const teacherStatus = await teacherPage.$eval('#call-status-value', el => el.textContent);
        
        console.log(`\nConnection Status:`);
        console.log(`Student: ${studentStatus}`);
        console.log(`Teacher: ${teacherStatus}`);
        
        // Check for peer connection
        const studentLogs = await studentPage.$$eval('#log-container .log-entry', logs => 
            logs.map(l => l.textContent).filter(l => l.includes('Peer connection'))
        );
        
        const teacherLogs = await teacherPage.$$eval('#log-container .log-entry', logs =>
            logs.map(l => l.textContent).filter(l => l.includes('Peer connection'))
        );
        
        console.log(`\nPeer Connection Logs:`);
        console.log(`Student: ${studentLogs.join('\n')}`);
        console.log(`Teacher: ${teacherLogs.join('\n')}`);
        
        // Check for ICE errors
        const studentErrors = await studentPage.$$eval('#log-container .log-entry.error', logs =>
            logs.map(l => l.textContent)
        );
        
        const teacherErrors = await teacherPage.$$eval('#log-container .log-entry.error', logs =>
            logs.map(l => l.textContent)
        );
        
        if (studentErrors.length > 0 || teacherErrors.length > 0) {
            console.log('\n⚠️ Errors detected:');
            if (studentErrors.length > 0) {
                console.log('Student errors:', studentErrors);
            }
            if (teacherErrors.length > 0) {
                console.log('Teacher errors:', teacherErrors);
            }
        } else {
            console.log('\n✅ No errors detected!');
        }
        
        // Wait for manual inspection
        console.log('\nTest complete. Browser will close in 10 seconds...');
        await new Promise(r => setTimeout(r, 10000));
        
    } catch (error) {
        console.error('Test failed:', error.message);
    } finally {
        await browser.close();
    }
}

testICEConnection();