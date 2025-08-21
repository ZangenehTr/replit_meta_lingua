import { io } from 'socket.io-client';

console.log('🎥 Testing CallerN Video Call Flow...\n');

// Login first to get auth token
const loginStudent = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'student1@test.com', password: 'Test@123' })
});

const studentData = await loginStudent.json();
console.log('✅ Student logged in');

// Create student socket
const studentSocket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket']
});

studentSocket.on('connect', () => {
    console.log('✅ Student socket connected:', studentSocket.id);
    
    // Authenticate as student
    studentSocket.emit('authenticate', {
        userId: studentData.user.id,
        role: 'Student'
    });
});

studentSocket.on('authenticated', (data) => {
    console.log('✅ Student authenticated:', data);
    
    // Try to call teacher
    const roomId = `test-room-${Date.now()}`;
    console.log('\n📞 Starting call with room:', roomId);
    
    // Join room first
    studentSocket.emit('join-room', {
        roomId: roomId,
        userId: studentData.user.id,
        role: 'student'
    });
    
    // Request call to teacher
    studentSocket.emit('call-teacher', {
        teacherId: 73,
        studentId: studentData.user.id,
        packageId: 1,
        language: 'english',
        roomId: roomId
    });
    
    console.log('📤 Call request sent to teacher 73');
});

studentSocket.on('error', (error) => {
    console.log('❌ Error:', error);
});

studentSocket.on('call-accepted', (data) => {
    console.log('✅ Call accepted by teacher!', data);
    studentSocket.disconnect();
    process.exit(0);
});

studentSocket.on('call-rejected', (data) => {
    console.log('❌ Call rejected:', data);
    studentSocket.disconnect();
    process.exit(1);
});

// Timeout after 10 seconds
setTimeout(() => {
    console.log('\n⏱️ Test completed (10s timeout)');
    studentSocket.disconnect();
    process.exit(0);
}, 10000);
