const io = require('socket.io-client');

console.log('Testing Socket.IO connection to localhost:5000...');

const socket = io('http://localhost:5000', {
    path: '/socket.io/',
    transports: ['websocket', 'polling']
});

socket.on('connect', () => {
    console.log('✅ Connected! Socket ID:', socket.id);
    
    // Test authentication
    console.log('Sending authentication...');
    socket.emit('authenticate', {
        userId: 8469,
        role: 'student'
    });
});

socket.on('authenticated', (data) => {
    console.log('✅ Authenticated:', data);
    socket.disconnect();
    process.exit(0);
});

socket.on('connect_error', (error) => {
    console.error('❌ Connection error:', error.message);
    process.exit(1);
});

socket.on('disconnect', () => {
    console.log('Disconnected');
});

// Timeout after 5 seconds
setTimeout(() => {
    console.log('❌ Connection timeout');
    process.exit(1);
}, 5000);