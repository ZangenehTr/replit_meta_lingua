import { io } from 'socket.io-client';

console.log('🧹 Cleaning up teacher call state...\n');

// Login as teacher
const loginTeacher = await fetch('http://localhost:5000/api/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: 'teacher1@test.com', password: 'password' })
});

const teacherData = await loginTeacher.json();
console.log('✅ Teacher logged in');

// Create teacher socket
const teacherSocket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket']
});

teacherSocket.on('connect', () => {
    console.log('✅ Teacher socket connected:', teacherSocket.id);
    
    // Authenticate as teacher
    teacherSocket.emit('authenticate', {
        userId: teacherData.user.id,
        role: 'Teacher'
    });
});

teacherSocket.on('authenticated', (data) => {
    console.log('✅ Teacher authenticated:', data);
    
    // Emit end-call for any active rooms
    teacherSocket.emit('end-call', {
        roomId: 'test-room-1755797720866',
        reason: 'Teacher cleanup'
    });
    
    console.log('✅ Sent end-call for stale room');
    
    // Wait a bit then disconnect
    setTimeout(() => {
        teacherSocket.disconnect();
        console.log('✅ Cleanup complete');
        process.exit(0);
    }, 2000);
});

// Timeout after 5 seconds
setTimeout(() => {
    console.log('\n⏱️ Cleanup timeout');
    teacherSocket.disconnect();
    process.exit(0);
}, 5000);
