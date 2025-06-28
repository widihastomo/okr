// Quick deployment test script
import http from 'http';

// Test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/health', (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          console.log('✅ Health endpoint working:', JSON.parse(data));
          resolve(true);
        } else {
          reject(new Error(`Health check failed: ${res.statusCode}`));
        }
      });
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Health check timeout'));
    });
  });
}

// Test root endpoint
function testRootEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ Root endpoint working');
        resolve(true);
      } else {
        reject(new Error(`Root endpoint failed: ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('Root endpoint timeout'));
    });
  });
}

// Test API endpoint
function testAPIEndpoint() {
  return new Promise((resolve, reject) => {
    const req = http.get('http://localhost:5000/api/cycles', (res) => {
      if (res.statusCode === 200) {
        console.log('✅ API endpoint working');
        resolve(true);
      } else {
        reject(new Error(`API endpoint failed: ${res.statusCode}`));
      }
    });
    
    req.on('error', reject);
    req.setTimeout(5000, () => {
      req.destroy();
      reject(new Error('API endpoint timeout'));
    });
  });
}

async function runTests() {
  console.log('🚀 Testing deployment configuration...\n');
  
  try {
    await testHealthEndpoint();
    await testRootEndpoint();
    await testAPIEndpoint();
    
    console.log('\n✅ All deployment tests passed!');
    console.log('🎯 Server is ready for deployment');
    
    // Test environment variables
    console.log('\n📊 Environment Check:');
    console.log('NODE_ENV:', process.env.NODE_ENV || 'development');
    console.log('DATABASE_URL:', process.env.DATABASE_URL ? '✅ Set' : '❌ Not set');
    console.log('PORT:', process.env.PORT || '5000');
    
  } catch (error) {
    console.error('❌ Deployment test failed:', error.message);
    process.exit(1);
  }
}

runTests();