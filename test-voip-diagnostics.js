import net from 'net';
import dns from 'dns';
import util from 'util';

const lookup = util.promisify(dns.lookup);

async function runVoIPDiagnostics() {
    const server = '46.100.5.198';
    const port = 5038;
    
    console.log('=== CHECK-FIRST PROTOCOL: VoIP Diagnostics ===');
    console.log(`Target: ${server}:${port}`);
    console.log(`Time: ${new Date().toISOString()}`);
    console.log('');
    
    // Step 1: DNS Resolution
    console.log('1. DNS Resolution Test');
    try {
        const resolved = await lookup(server);
        console.log(`   ✓ ${server} resolves to ${resolved.address}`);
        console.log(`   ✓ Address family: ${resolved.family}`);
    } catch (error) {
        console.log(`   ✗ DNS resolution failed: ${error.message}`);
        return;
    }
    
    // Step 2: TCP Connection Test
    console.log('');
    console.log('2. TCP Connection Test');
    
    const connectionPromise = new Promise((resolve) => {
        const socket = new net.Socket();
        const startTime = Date.now();
        
        // Shorter timeout for faster diagnosis
        const timeout = setTimeout(() => {
            socket.destroy();
            resolve({
                success: false,
                duration: Date.now() - startTime,
                error: 'Connection timeout (2s)',
                status: 'timeout'
            });
        }, 2000);
        
        socket.connect(port, server, () => {
            clearTimeout(timeout);
            socket.destroy();
            resolve({
                success: true,
                duration: Date.now() - startTime,
                status: 'connected'
            });
        });
        
        socket.on('error', (error) => {
            clearTimeout(timeout);
            resolve({
                success: false,
                duration: Date.now() - startTime,
                error: error.message,
                status: 'connection_refused'
            });
        });
    });
    
    const result = await connectionPromise;
    
    if (result.success) {
        console.log(`   ✓ TCP connection successful (${result.duration}ms)`);
        console.log(`   ✓ Port ${port} is open and accepting connections`);
        console.log(`   ✓ Server appears to be running`);
    } else {
        console.log(`   ✗ TCP connection failed (${result.duration}ms)`);
        console.log(`   ✗ Error: ${result.error}`);
        console.log(`   ✗ Status: ${result.status}`);
    }
    
    // Step 3: Analysis and Recommendations
    console.log('');
    console.log('3. Analysis and Recommendations');
    
    if (result.success) {
        console.log('   ✓ Network connectivity confirmed');
        console.log('   ✓ VoIP server is reachable');
        console.log('   ⚠ VoIP protocol negotiation may still fail without proper SIP library');
        console.log('   → Recommendation: System should work with real SIP implementation');
    } else if (result.status === 'timeout') {
        console.log('   ⚠ Network timeout detected');
        console.log('   → Possible causes:');
        console.log('     - Server is down or unreachable');
        console.log('     - Firewall blocking connections');
        console.log('     - Network routing issues');
        console.log('   → Recommendation: Use development simulation mode');
    } else if (result.status === 'connection_refused') {
        console.log('   ⚠ Connection refused by server');
        console.log('   → Possible causes:');
        console.log('     - VoIP service not running on port 5038');
        console.log('     - Server firewall blocking port');
        console.log('     - Wrong port number');
        console.log('   → Recommendation: Verify server configuration');
    }
    
    console.log('');
    console.log('=== DIAGNOSTIC COMPLETE ===');
}

// Run diagnostics
runVoIPDiagnostics().catch(console.error);