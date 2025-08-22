import http from 'http';
import https from 'https';

console.log('🚀 CallerN Performance Test');
console.log('===========================\n');

async function measureEndpoint(path, name) {
  return new Promise((resolve) => {
    const startTime = Date.now();
    
    const options = {
      hostname: 'localhost',
      port: 5000,
      path: `/api${path}`,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json'
      }
    };
    
    const req = http.request(options, (res) => {
      let data = '';
      
      res.on('data', (chunk) => {
        data += chunk;
      });
      
      res.on('end', () => {
        const endTime = Date.now();
        const duration = endTime - startTime;
        
        resolve({
          name,
          path,
          duration,
          status: res.statusCode,
          size: data.length
        });
      });
    });
    
    req.on('error', (error) => {
      const endTime = Date.now();
      const duration = endTime - startTime;
      
      resolve({
        name,
        path,
        duration,
        status: 'ERROR',
        error: error.message
      });
    });
    
    req.end();
  });
}

async function runTests() {
  console.log('Testing public endpoints (no auth required)...\n');
  
  // Test endpoints that don't require authentication
  const publicEndpoints = [
    { path: '/branding', name: 'Branding' },
    { path: '/student/callern-packages', name: 'Callern Packages' },
    { path: '/callern/online-teachers', name: 'Online Teachers' }
  ];
  
  const results = [];
  
  // Test each endpoint
  for (const endpoint of publicEndpoints) {
    const result = await measureEndpoint(endpoint.path, endpoint.name);
    results.push(result);
    
    const status = result.duration > 500 ? '⚠️ SLOW' : 
                   result.duration > 200 ? '⚠️ WARNING' : '✅ FAST';
    
    console.log(`${endpoint.name}:`);
    console.log(`  Duration: ${result.duration}ms ${status}`);
    console.log(`  Status: ${result.status}`);
    console.log(`  Size: ${Math.round(result.size / 1024)}KB`);
    console.log('');
  }
  
  // Summary
  console.log('📊 Summary');
  console.log('==========');
  
  const totalTime = results.reduce((sum, r) => sum + r.duration, 0);
  const avgTime = Math.round(totalTime / results.length);
  const slowEndpoints = results.filter(r => r.duration > 500);
  const warningEndpoints = results.filter(r => r.duration > 200 && r.duration <= 500);
  
  console.log(`Total Time: ${totalTime}ms`);
  console.log(`Average Time: ${avgTime}ms`);
  console.log(`Slow Endpoints (>500ms): ${slowEndpoints.length}`);
  console.log(`Warning Endpoints (200-500ms): ${warningEndpoints.length}`);
  
  if (slowEndpoints.length > 0) {
    console.log('\n⚠️ Slow Endpoints:');
    slowEndpoints.forEach(e => {
      console.log(`  - ${e.name}: ${e.duration}ms`);
    });
  }
  
  if (warningEndpoints.length > 0) {
    console.log('\n⚠️ Warning Endpoints:');
    warningEndpoints.forEach(e => {
      console.log(`  - ${e.name}: ${e.duration}ms`);
    });
  }
  
  // Performance diagnosis
  console.log('\n🔍 Diagnosis');
  console.log('============');
  
  if (avgTime > 500) {
    console.log('❌ CRITICAL: Server response times are very slow');
    console.log('Possible causes:');
    console.log('  - Database connection issues');
    console.log('  - Slow database queries (missing indexes)');
    console.log('  - Network latency to database');
    console.log('  - Server resource constraints');
  } else if (avgTime > 200) {
    console.log('⚠️ WARNING: Server response times are slower than optimal');
    console.log('Recommendations:');
    console.log('  - Add database query optimization');
    console.log('  - Implement server-side caching');
    console.log('  - Review database indexes');
  } else {
    console.log('✅ Server response times are good');
  }
  
  // Test parallel loading
  console.log('\n🔄 Testing Parallel Loading (like real app)...');
  const parallelStart = Date.now();
  
  const parallelResults = await Promise.all([
    measureEndpoint('/branding', 'Branding'),
    measureEndpoint('/student/callern-packages', 'Packages'),
    measureEndpoint('/callern/online-teachers', 'Teachers')
  ]);
  
  const parallelTime = Date.now() - parallelStart;
  console.log(`Parallel load time: ${parallelTime}ms`);
  
  if (parallelTime > 1000) {
    console.log('⚠️ Page will feel slow to users (>1 second)');
  }
}

runTests().catch(console.error);