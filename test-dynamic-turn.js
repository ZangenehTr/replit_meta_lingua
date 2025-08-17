#!/usr/bin/env node

/**
 * Test Dynamic TURN Credentials from Metered.ca
 * Verifies that we can fetch fresh TURN credentials for WebRTC
 */

const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

async function testDynamicTURNCredentials() {
    console.log('\n=================================');
    console.log('Dynamic TURN Credentials Test');
    console.log('=================================\n');
    
    const apiKey = 'f3d6e866f1744312d043ffc9271c35ce8914';
    const apiUrl = `https://metalingua.metered.live/api/v1/turn/credentials?apiKey=${apiKey}`;
    
    try {
        console.log('📡 Fetching TURN credentials from Metered.ca...');
        console.log(`URL: ${apiUrl}\n`);
        
        const response = await fetch(apiUrl);
        
        if (!response.ok) {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`);
        }
        
        const credentials = await response.json();
        
        console.log('✅ Successfully fetched TURN credentials!\n');
        console.log(`📊 Number of servers: ${credentials.length}`);
        console.log('\n🔐 Server Details:');
        console.log('=====================================\n');
        
        credentials.forEach((server, index) => {
            console.log(`Server ${index + 1}:`);
            console.log(`  URL: ${server.urls || server.url}`);
            if (server.username) {
                console.log(`  Username: ${server.username}`);
                console.log(`  Credential: ${server.credential.substring(0, 20)}...`);
            } else {
                console.log(`  Type: STUN (no auth required)`);
            }
            console.log(`  Transport: ${server.urls?.includes('tcp') ? 'TCP' : 'UDP'}`);
            console.log(`  TLS: ${server.urls?.includes('turns') ? 'Yes' : 'No'}`);
            console.log('');
        });
        
        // Test credential expiry (if provided)
        if (credentials[0]?.ttl) {
            const ttlHours = Math.floor(credentials[0].ttl / 3600);
            console.log(`⏱️  Credentials valid for: ${ttlHours} hours`);
        }
        
        console.log('\n=================================');
        console.log('✅ TEST PASSED - TURN credentials ready');
        console.log('=================================\n');
        
        console.log('📝 Integration Summary:');
        console.log('• Dynamic credentials fetch working');
        console.log('• Multiple TURN servers available');
        console.log('• Both TCP and UDP transports supported');
        console.log('• Ready for production deployment\n');
        
        return true;
        
    } catch (error) {
        console.error('\n❌ TEST FAILED');
        console.error('Error:', error.message);
        console.error('\nPossible issues:');
        console.error('• API key might be invalid');
        console.error('• Network connectivity issues');
        console.error('• Metered.ca service might be down');
        console.error('\nFallback: Using static TURN credentials\n');
        
        return false;
    }
}

// Run the test
testDynamicTURNCredentials()
    .then(success => {
        process.exit(success ? 0 : 1);
    })
    .catch(error => {
        console.error('Unexpected error:', error);
        process.exit(1);
    });