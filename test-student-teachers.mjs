import fetch from 'node-fetch';

const API_URL = 'http://localhost:5000';

async function testStudentView() {
    console.log('=== Testing Student View of Teachers ===\n');
    
    // Step 1: Login as student
    console.log('1. Logging in as student1@test.com...');
    const loginResponse = await fetch(`${API_URL}/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            email: 'student1@test.com',
            password: 'password123'
        })
    });
    
    const loginData = await loginResponse.json();
    if (!loginData.token) {
        console.error('Login failed:', loginData);
        return;
    }
    
    const token = loginData.token;
    console.log('✓ Logged in successfully');
    console.log(`  User: ${loginData.user.firstName} ${loginData.user.lastName}`);
    console.log(`  Role: ${loginData.user.role}\n`);
    
    // Step 2: Check teachers
    console.log('2. Fetching available teachers...');
    const teachersResponse = await fetch(`${API_URL}/api/callern/online-teachers`, {
        headers: {
            'Cookie': `token=${token}`,
            'Authorization': `Bearer ${token}`
        }
    });
    
    const teachers = await teachersResponse.json();
    console.log(`✓ Found ${teachers.length} teachers:\n`);
    
    teachers.forEach(teacher => {
        console.log(`  ${teacher.firstName} ${teacher.lastName}:`);
        console.log(`    - Status: ${teacher.isOnline ? '🟢 Online' : '🔴 Offline'}`);
        console.log(`    - Languages: ${teacher.languages.join(', ')}`);
        console.log(`    - Specializations: ${teacher.specializations.join(', ')}`);
        console.log(`    - Rate: ${teacher.hourlyRate} IRR/hour`);
        console.log(`    - Rating: ${teacher.rating}/5 (${teacher.reviewCount} reviews)\n`);
    });
    
    // Step 3: Check packages
    console.log('3. Fetching student packages...');
    const packagesResponse = await fetch(`${API_URL}/api/student/my-callern-packages`, {
        headers: {
            'Cookie': `token=${token}`,
            'Authorization': `Bearer ${token}`
        }
    });
    
    const packages = await packagesResponse.json();
    console.log(`✓ Found ${packages.length} packages:\n`);
    
    packages.forEach(pkg => {
        console.log(`  ${pkg.packageName}:`);
        console.log(`    - Status: ${pkg.status}`);
        console.log(`    - Remaining: ${pkg.remainingMinutes}/${pkg.totalMinutes} minutes`);
        console.log(`    - Language: ${pkg.languageId}\n`);
    });
}

testStudentView().catch(console.error);
