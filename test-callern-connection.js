import { io } from 'socket.io-client';

console.log('🎥 Testing CallerN Connection...\n');

// Login both users first
console.log('Logging in users...');
const [loginStudent, loginTeacher] = await Promise.all([
    fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'student1@test.com', password: 'Test@123' })
    }),
    fetch('http://localhost:5000/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: 'teacher1@test.com', password: 'password' })
    })
]);

const studentData = await loginStudent.json();
const teacherData = await loginTeacher.json();
console.log('✅ Student ID:', studentData.user.id);
console.log('✅ Teacher ID:', teacherData.user.id);

// Setup teacher first
const teacherSocket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket']
});

let teacherReady = false;

teacherSocket.on('connect', () => {
    console.log('\n✅ Teacher socket connected:', teacherSocket.id);
    teacherSocket.emit('authenticate', {
        userId: teacherData.user.id,
        role: 'Teacher'
    });
});

teacherSocket.on('authenticated', (data) => {
    console.log('✅ Teacher authenticated:', data);
    teacherReady = true;
    startStudentConnection();
});

teacherSocket.on('call-request', (data) => {
    console.log('\n📞 TEACHER: Incoming call!');
    console.log('   Student ID:', data.studentId);
    console.log('   Room ID:', data.roomId);
    
    // Accept the call
    console.log('✅ TEACHER: Accepting call...');
    
    // Join room
    teacherSocket.emit('join-room', {
        roomId: data.roomId,
        userId: teacherData.user.id,
        role: 'teacher'
    });
    
    // Accept call
    teacherSocket.emit('accept-call', {
        roomId: data.roomId,
        teacherId: teacherData.user.id,
        studentId: data.studentId
    });
});

// Function to start student connection
function startStudentConnection() {
    console.log('\n🎓 Starting student connection...');
    
    const studentSocket = io('http://localhost:5000', {
        path: '/socket.io/',
        transports: ['websocket']
    });
    
    studentSocket.on('connect', () => {
        console.log('✅ Student socket connected:', studentSocket.id);
        studentSocket.emit('authenticate', {
            userId: studentData.user.id,
            role: 'Student'
        });
    });
    
    studentSocket.on('authenticated', (data) => {
        console.log('✅ Student authenticated:', data);
        
        // Start call
        const roomId = `test-room-${Date.now()}`;
        console.log('\n📞 STUDENT: Starting call...');
        console.log('   Room ID:', roomId);
        
        // Join room
        studentSocket.emit('join-room', {
            roomId: roomId,
            userId: studentData.user.id,
            role: 'student'
        });
        
        // Request call
        studentSocket.emit('call-teacher', {
            teacherId: teacherData.user.id,
            studentId: studentData.user.id,
            packageId: 1,
            language: 'english',
            roomId: roomId
        });
        
        console.log('📤 Call request sent');
    });
    
    studentSocket.on('call-accepted', (data) => {
        console.log('\n🎉 SUCCESS: Call accepted!', data);
        console.log('✅ Video call flow working correctly!');
        
        setTimeout(() => {
            studentSocket.disconnect();
            teacherSocket.disconnect();
            process.exit(0);
        }, 1000);
    });
    
    studentSocket.on('error', (error) => {
        console.log('❌ Student error:', error);
    });
}

// Timeout
setTimeout(() => {
    console.log('\n⏱️ Test timeout');
    process.exit(0);
}, 10000);
