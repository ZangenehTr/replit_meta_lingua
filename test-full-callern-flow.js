import { io } from 'socket.io-client';

console.log('🎥 Testing Full CallerN Video Call Flow...\n');

// Login both users
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
console.log('✅ Both users logged in\n');

// Create sockets
const studentSocket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket']
});

const teacherSocket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket']
});

// Setup teacher socket first
teacherSocket.on('connect', () => {
    console.log('✅ Teacher socket connected:', teacherSocket.id);
    teacherSocket.emit('authenticate', {
        userId: teacherData.user.id,
        role: 'Teacher'
    });
});

teacherSocket.on('authenticated', (data) => {
    console.log('✅ Teacher authenticated and ready:', data);
});

teacherSocket.on('call-request', (data) => {
    console.log('\n📞 TEACHER: Incoming call from student', data.studentId);
    console.log('   Room ID:', data.roomId);
    console.log('   Student info:', data.studentInfo);
    
    // Auto-accept after 1 second
    setTimeout(() => {
        console.log('✅ TEACHER: Accepting call...');
        
        // Join room first
        teacherSocket.emit('join-room', {
            roomId: data.roomId,
            userId: teacherData.user.id,
            role: 'teacher'
        });
        
        // Then accept call
        teacherSocket.emit('accept-call', {
            roomId: data.roomId,
            teacherId: teacherData.user.id,
            studentId: data.studentId
        });
    }, 1000);
});

// Setup student socket after teacher is ready
setTimeout(() => {
    studentSocket.on('connect', () => {
        console.log('\n✅ Student socket connected:', studentSocket.id);
        studentSocket.emit('authenticate', {
            userId: studentData.user.id,
            role: 'Student'
        });
    });

    studentSocket.on('authenticated', (data) => {
        console.log('✅ Student authenticated:', data);
        
        // Start call after authentication
        const roomId = `test-room-${Date.now()}`;
        console.log('\n📞 STUDENT: Starting call with room:', roomId);
        
        // Join room first
        studentSocket.emit('join-room', {
            roomId: roomId,
            userId: studentData.user.id,
            role: 'student'
        });
        
        // Request call to teacher
        studentSocket.emit('call-teacher', {
            teacherId: teacherData.user.id,
            studentId: studentData.user.id,
            packageId: 1,
            language: 'english',
            roomId: roomId
        });
        
        console.log('📤 STUDENT: Call request sent to teacher');
    });

    studentSocket.on('call-accepted', (data) => {
        console.log('\n🎉 STUDENT: Call accepted by teacher!', data);
        console.log('✅ Video call connection established successfully!');
        
        // Clean up
        setTimeout(() => {
            studentSocket.disconnect();
            teacherSocket.disconnect();
            console.log('\n✅ Test completed successfully!');
            process.exit(0);
        }, 2000);
    });

    studentSocket.on('call-rejected', (data) => {
        console.log('❌ STUDENT: Call rejected:', data);
        studentSocket.disconnect();
        teacherSocket.disconnect();
        process.exit(1);
    });

    studentSocket.on('error', (error) => {
        console.log('❌ STUDENT ERROR:', error);
    });
}, 500);

// Timeout after 15 seconds
setTimeout(() => {
    console.log('\n⏱️ Test timeout (15s)');
    studentSocket.disconnect();
    teacherSocket.disconnect();
    process.exit(0);
}, 15000);
