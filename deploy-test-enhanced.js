#!/usr/bin/env node

// Enhanced deployment test script with comprehensive verification
import { spawn } from 'child_process';
import { existsSync, statSync, readFileSync } from 'fs';
import http from 'http';

console.log('🧪 Enhanced Deployment Test Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);

// Test configuration
const TEST_CONFIG = {
  port: process.env.PORT || 5000,
  host: '0.0.0.0',
  timeout: 30000, // 30 seconds
  healthCheckRetries: 10,
  healthCheckInterval: 2000 // 2 seconds
};

let testServer = null;
let testsPassed = 0;
let testsFailed = 0;

// Enhanced error handling
const testError = (message, error = null) => {
  console.error(`❌ Test Failed: ${message}`);
  if (error) {
    console.error(`📋 Error Details: ${error.message}`);
  }
  testsFailed++;
  return false;
};

const testSuccess = (message) => {
  console.log(`✅ ${message}`);
  testsPassed++;
  return true;
};

// HTTP request helper with timeout
const makeRequest = (options) => {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', (chunk) => {
        data += chunk;
      });
      res.on('end', () => {
        resolve({
          statusCode: res.statusCode,
          headers: res.headers,
          body: data
        });
      });
    });
    
    req.on('error', reject);
    req.setTimeout(TEST_CONFIG.timeout, () => {
      req.destroy();
      reject(new Error('Request timeout'));
    });
    
    req.end();
  });
};

// Comprehensive file verification
const testFileVerification = () => {
  console.log('\n🔍 Testing File Verification...');
  
  const requiredFiles = [
    { 
      path: 'dist/index.cjs', 
      minSize: 2000, 
      description: 'Primary deployment target',
      contentChecks: ['spawn', 'tsx', 'production', 'server']
    },
    { 
      path: 'dist/index.js', 
      minSize: 1000, 
      description: 'ES module version',
      contentChecks: ['spawn', 'server']
    },
    { 
      path: 'dist/public/index.html', 
      minSize: 1000, 
      description: 'Production frontend',
      contentChecks: ['OKR Management System', 'api/auth/me']
    }
  ];
  
  let allFilesPassed = true;
  
  for (const file of requiredFiles) {
    console.log(`📋 Verifying ${file.path}...`);
    
    // Check existence
    if (!existsSync(file.path)) {
      testError(`Missing file: ${file.path}`);
      allFilesPassed = false;
      continue;
    }
    
    // Check size
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      testError(`File too small: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
      allFilesPassed = false;
      continue;
    }
    
    // Check content
    try {
      const content = readFileSync(file.path, 'utf8');
      const missingContent = file.contentChecks.filter(check => !content.includes(check));
      
      if (missingContent.length > 0) {
        testError(`Missing content in ${file.path}: ${missingContent.join(', ')}`);
        allFilesPassed = false;
        continue;
      }
      
      testSuccess(`${file.path} verified (${stats.size} bytes)`);
    } catch (readError) {
      testError(`Cannot read ${file.path}`, readError);
      allFilesPassed = false;
    }
  }
  
  return allFilesPassed;
};

// Test server startup
const testServerStartup = () => {
  return new Promise((resolve, reject) => {
    console.log('\n🚀 Testing Server Startup...');
    
    if (!existsSync('dist/index.cjs')) {
      return reject(new Error('dist/index.cjs not found'));
    }
    
    console.log('📡 Starting test server...');
    
    // Start server in test mode
    testServer = spawn('node', ['dist/index.cjs'], {
      stdio: 'pipe',
      env: {
        ...process.env,
        NODE_ENV: 'production',
        PORT: TEST_CONFIG.port,
        HOST: TEST_CONFIG.host
      }
    });
    
    let startupOutput = '';
    
    testServer.stdout.on('data', (data) => {
      const output = data.toString();
      startupOutput += output;
      console.log('📡 Server:', output.trim());
    });
    
    testServer.stderr.on('data', (data) => {
      const error = data.toString();
      console.error('📡 Server Error:', error.trim());
    });
    
    testServer.on('error', (error) => {
      console.error('❌ Server startup failed:', error.message);
      reject(error);
    });
    
    // Wait for server to start
    setTimeout(() => {
      if (testServer && !testServer.killed) {
        testSuccess('Server started successfully');
        resolve(true);
      } else {
        reject(new Error('Server failed to start within timeout'));
      }
    }, 5000);
  });
};

// Test health check endpoint
const testHealthCheck = async () => {
  console.log('\n🏥 Testing Health Check...');
  
  for (let attempt = 1; attempt <= TEST_CONFIG.healthCheckRetries; attempt++) {
    try {
      console.log(`📡 Health check attempt ${attempt}/${TEST_CONFIG.healthCheckRetries}...`);
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_CONFIG.port,
        path: '/health',
        method: 'GET',
        timeout: TEST_CONFIG.timeout
      });
      
      if (response.statusCode === 200) {
        const healthData = JSON.parse(response.body);
        if (healthData.status === 'ok') {
          testSuccess('Health check passed');
          console.log('📋 Health response:', JSON.stringify(healthData, null, 2));
          return true;
        } else {
          testError(`Health check returned invalid status: ${healthData.status}`);
          return false;
        }
      } else {
        console.log(`⚠️  Health check returned HTTP ${response.statusCode}, retrying...`);
      }
    } catch (error) {
      console.log(`⚠️  Health check attempt ${attempt} failed: ${error.message}`);
      
      if (attempt === TEST_CONFIG.healthCheckRetries) {
        testError('Health check failed after all retries', error);
        return false;
      }
    }
    
    // Wait before retry
    await new Promise(resolve => setTimeout(resolve, TEST_CONFIG.healthCheckInterval));
  }
  
  return false;
};

// Test root endpoint
const testRootEndpoint = async () => {
  console.log('\n🌐 Testing Root Endpoint...');
  
  try {
    const response = await makeRequest({
      hostname: 'localhost',
      port: TEST_CONFIG.port,
      path: '/',
      method: 'GET',
      timeout: TEST_CONFIG.timeout
    });
    
    if (response.statusCode === 200) {
      const bodyContains = [
        'OKR Management System',
        'Production Server Ready'
      ];
      
      const missingContent = bodyContains.filter(text => !response.body.includes(text));
      
      if (missingContent.length === 0) {
        testSuccess('Root endpoint returned valid content');
        return true;
      } else {
        testError(`Root endpoint missing content: ${missingContent.join(', ')}`);
        return false;
      }
    } else {
      testError(`Root endpoint returned HTTP ${response.statusCode}`);
      return false;
    }
  } catch (error) {
    testError('Root endpoint test failed', error);
    return false;
  }
};

// Test API endpoints
const testApiEndpoints = async () => {
  console.log('\n🔌 Testing API Endpoints...');
  
  const endpoints = [
    { path: '/api/auth/me', expectedStatus: [200, 401] },
    { path: '/api/objectives', expectedStatus: [200, 401] },
    { path: '/api/tasks', expectedStatus: [200, 401] }
  ];
  
  let allPassed = true;
  
  for (const endpoint of endpoints) {
    try {
      console.log(`📡 Testing ${endpoint.path}...`);
      
      const response = await makeRequest({
        hostname: 'localhost',
        port: TEST_CONFIG.port,
        path: endpoint.path,
        method: 'GET',
        timeout: TEST_CONFIG.timeout
      });
      
      if (endpoint.expectedStatus.includes(response.statusCode)) {
        testSuccess(`${endpoint.path} returned expected status ${response.statusCode}`);
      } else {
        testError(`${endpoint.path} returned unexpected status ${response.statusCode}`);
        allPassed = false;
      }
    } catch (error) {
      testError(`API endpoint ${endpoint.path} test failed`, error);
      allPassed = false;
    }
  }
  
  return allPassed;
};

// Cleanup function
const cleanup = () => {
  if (testServer && !testServer.killed) {
    console.log('\n🧹 Cleaning up test server...');
    testServer.kill('SIGTERM');
    
    setTimeout(() => {
      if (testServer && !testServer.killed) {
        console.log('🔴 Force killing test server...');
        testServer.kill('SIGKILL');
      }
    }, 5000);
  }
};

// Main test execution
const runTests = async () => {
  console.log('\n🎯 Starting Enhanced Deployment Tests...');
  
  try {
    // Test 1: File verification
    const filesOk = testFileVerification();
    if (!filesOk) {
      console.log('\n❌ File verification failed - deployment will not work');
      return false;
    }
    
    // Test 2: Server startup
    await testServerStartup();
    
    // Wait for server to fully initialize
    console.log('\n⏳ Waiting for server to initialize...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 3: Health check
    const healthOk = await testHealthCheck();
    if (!healthOk) {
      console.log('\n❌ Health check failed - server may not be responding');
      return false;
    }
    
    // Test 4: Root endpoint
    const rootOk = await testRootEndpoint();
    if (!rootOk) {
      console.log('\n❌ Root endpoint failed - frontend may not be working');
      return false;
    }
    
    // Test 5: API endpoints
    const apiOk = await testApiEndpoints();
    if (!apiOk) {
      console.log('\n❌ API endpoints failed - backend may not be working');
      return false;
    }
    
    return true;
    
  } catch (error) {
    testError('Test execution failed', error);
    return false;
  }
};

// Run the tests
runTests()
  .then((success) => {
    cleanup();
    
    console.log('\n📊 Test Results Summary:');
    console.log(`✅ Tests Passed: ${testsPassed}`);
    console.log(`❌ Tests Failed: ${testsFailed}`);
    console.log(`📊 Success Rate: ${Math.round((testsPassed / (testsPassed + testsFailed)) * 100)}%`);
    
    if (success) {
      console.log('\n🎉 All Deployment Tests Passed!');
      console.log('✅ Application is ready for production deployment');
      console.log('\n🚀 Deployment Commands:');
      console.log('  Build: node build-enhanced.js');
      console.log('  Start: node dist/index.cjs');
      console.log('  Monitor: curl http://localhost:5000/health');
      process.exit(0);
    } else {
      console.log('\n❌ Deployment Tests Failed');
      console.log('🔧 Please fix the issues above before deploying');
      process.exit(1);
    }
  })
  .catch((error) => {
    cleanup();
    console.error('\n❌ Test execution failed:', error.message);
    process.exit(1);
  });

// Handle process signals
process.on('SIGTERM', cleanup);
process.on('SIGINT', cleanup);
process.on('exit', cleanup);