#!/usr/bin/env node

// Comprehensive deployment verification script
import { existsSync, statSync, readFileSync } from 'fs';
import { spawn } from 'child_process';
// Using standard setTimeout

console.log('🔍 Deployment Verification Starting...');

// Test 1: Verify build output files
function testBuildOutput() {
  console.log('\n📁 Testing build output files...');
  
  const requiredFiles = [
    { path: 'dist/index.js', minSize: 10000, description: 'Server bundle' },
    { path: 'dist/public/index.html', minSize: 500, description: 'Frontend HTML' },
    { path: 'dist/deploy-info.json', minSize: 50, description: 'Deploy metadata' }
  ];

  let allValid = true;
  
  for (const file of requiredFiles) {
    if (!existsSync(file.path)) {
      console.error(`❌ Missing: ${file.path}`);
      allValid = false;
      continue;
    }
    
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      console.error(`❌ Too small: ${file.path} (${stats.size} bytes, expected minimum ${file.minSize})`);
      allValid = false;
      continue;
    }
    
    console.log(`✅ Valid: ${file.description} - ${file.path} (${stats.size.toLocaleString()} bytes)`);
  }
  
  return allValid;
}

// Test 2: Verify server can start
function testServerStart() {
  console.log('\n🚀 Testing server startup...');
  
  return new Promise((resolve) => {
    const server = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '5001' },
      stdio: 'pipe'
    });

    let output = '';
    let hasStarted = false;
    
    server.stdout.on('data', (data) => {
      output += data.toString();
      if (output.includes('Server listening') || output.includes('listening on') || output.includes('ready')) {
        hasStarted = true;
      }
    });
    
    server.stderr.on('data', (data) => {
      output += data.toString();
    });
    
    // Give server 10 seconds to start
    setTimeout(() => {
      if (hasStarted) {
        console.log('✅ Server started successfully');
        server.kill();
        resolve(true);
      } else {
        console.error('❌ Server failed to start');
        console.log('Server output:', output.slice(-500)); // Last 500 chars
        server.kill();
        resolve(false);
      }
    }, 10000);
    
    server.on('error', (err) => {
      console.error('❌ Server spawn error:', err.message);
      resolve(false);
    });
  });
}

// Test 3: Test HTTP endpoints
async function testEndpoints() {
  console.log('\n🌐 Testing HTTP endpoints...');
  
  const server = spawn('node', ['dist/index.js'], {
    env: { ...process.env, NODE_ENV: 'production', PORT: '5002' },
    stdio: 'pipe'
  });

  // Wait for server to start
  await new Promise(resolve => setTimeout(resolve, 5000));
  
  const testUrls = [
    { url: 'http://localhost:5002/health', expected: 200, name: 'Health check' },
    { url: 'http://localhost:5002/', expected: [200, 404], name: 'Root endpoint' },
    { url: 'http://localhost:5002/api/auth/me', expected: [200, 401], name: 'Auth endpoint' }
  ];

  let allPassed = true;
  
  for (const test of testUrls) {
    try {
      const response = await fetch(test.url);
      const expectedCodes = Array.isArray(test.expected) ? test.expected : [test.expected];
      
      if (expectedCodes.includes(response.status)) {
        console.log(`✅ ${test.name}: ${response.status} OK`);
      } else {
        console.error(`❌ ${test.name}: ${response.status} (expected ${test.expected})`);
        allPassed = false;
      }
    } catch (error) {
      console.error(`❌ ${test.name}: Connection failed - ${error.message}`);
      allPassed = false;
    }
  }
  
  server.kill();
  return allPassed;
}

// Test 4: Verify deployment metadata
function testDeploymentInfo() {
  console.log('\n📋 Testing deployment metadata...');
  
  if (!existsSync('dist/deploy-info.json')) {
    console.error('❌ Deploy info missing');
    return false;
  }
  
  try {
    const deployInfo = JSON.parse(readFileSync('dist/deploy-info.json', 'utf-8'));
    
    const requiredFields = ['buildTime', 'nodeVersion', 'files'];
    for (const field of requiredFields) {
      if (!deployInfo[field]) {
        console.error(`❌ Missing deploy info field: ${field}`);
        return false;
      }
    }
    
    console.log('✅ Deployment metadata valid');
    console.log(`   Build time: ${deployInfo.buildTime}`);
    console.log(`   Node version: ${deployInfo.nodeVersion}`);
    console.log(`   Files: ${deployInfo.files.length || Object.keys(deployInfo.files).length}`);
    
    return true;
  } catch (error) {
    console.error('❌ Invalid deployment metadata:', error.message);
    return false;
  }
}

// Main test execution
async function runAllTests() {
  console.log('🎯 Running comprehensive deployment tests...\n');
  
  const tests = [
    { name: 'Build Output', fn: testBuildOutput },
    { name: 'Deployment Info', fn: testDeploymentInfo },
    { name: 'Server Startup', fn: testServerStart },
    { name: 'HTTP Endpoints', fn: testEndpoints }
  ];
  
  let passedTests = 0;
  let totalTests = tests.length;
  
  for (const test of tests) {
    console.log(`\n⚡ Running ${test.name} test...`);
    try {
      const result = await test.fn();
      if (result) {
        passedTests++;
        console.log(`✅ ${test.name} test PASSED`);
      } else {
        console.log(`❌ ${test.name} test FAILED`);
      }
    } catch (error) {
      console.error(`❌ ${test.name} test ERROR:`, error.message);
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  
  if (passedTests === totalTests) {
    console.log('🎉 ALL TESTS PASSED - Deployment ready!');
    console.log('\nDeployment command: NODE_ENV=production node dist/index.js');
    return true;
  } else {
    console.log('⚠️  Some tests failed - Review issues above');
    return false;
  }
}

// Execute if run directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runAllTests()
    .then(success => process.exit(success ? 0 : 1))
    .catch(error => {
      console.error('Test execution failed:', error);
      process.exit(1);
    });
}