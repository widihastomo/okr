#!/usr/bin/env node

import { spawn } from 'child_process';
import { readFileSync, existsSync } from 'fs';

console.log('🚀 Testing production deployment...\n');

// Function to test health endpoint
function testHealthEndpoint() {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', 'http://localhost:5000/health']);
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      try {
        const response = JSON.parse(output);
        if (response.status === 'ok') {
          console.log('✅ Health check: PASSED');
          resolve(true);
        } else {
          console.log('❌ Health check: Invalid response');
          resolve(false);
        }
      } catch (e) {
        console.log('❌ Health check: Failed to parse response');
        resolve(false);
      }
    });
  });
}

// Function to test root endpoint
function testRootEndpoint() {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', '-I', 'http://localhost:5000/']);
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      if (output.includes('200 OK') || output.includes('text/html')) {
        console.log('✅ Root endpoint: PASSED');
        resolve(true);
      } else {
        console.log('❌ Root endpoint: Failed');
        resolve(false);
      }
    });
  });
}

// Function to test API endpoint
function testAPIEndpoint() {
  return new Promise((resolve) => {
    const curl = spawn('curl', ['-s', 'http://localhost:5000/api/cycles']);
    
    let output = '';
    curl.stdout.on('data', (data) => {
      output += data.toString();
    });
    
    curl.on('close', (code) => {
      try {
        const response = JSON.parse(output);
        if (Array.isArray(response)) {
          console.log('✅ API endpoint: PASSED');
          resolve(true);
        } else {
          console.log('❌ API endpoint: Invalid response format');
          resolve(false);
        }
      } catch (e) {
        console.log('❌ API endpoint: Failed to parse JSON');
        resolve(false);
      }
    });
  });
}

// Function to test deployment config
function testDeploymentConfig() {
  console.log('📋 Deployment Configuration:');
  
  // Check critical files
  const criticalFiles = [
    'dist/index.js',
    'dist/public/index.html',
    'package.json'
  ];
  
  let allFilesExist = true;
  criticalFiles.forEach(file => {
    if (existsSync(file)) {
      console.log(`✅ ${file}: EXISTS`);
    } else {
      console.log(`❌ ${file}: MISSING`);
      allFilesExist = false;
    }
  });
  
  // Check package.json start script
  try {
    const packageJson = JSON.parse(readFileSync('package.json', 'utf-8'));
    if (packageJson.scripts && packageJson.scripts.start) {
      console.log(`✅ Start script: ${packageJson.scripts.start}`);
    } else {
      console.log('❌ Start script: MISSING');
      allFilesExist = false;
    }
  } catch (e) {
    console.log('❌ package.json: Invalid format');
    allFilesExist = false;
  }
  
  // Check environment variables
  console.log(`✅ NODE_ENV: ${process.env.NODE_ENV || 'not set'}`);
  console.log(`✅ PORT: ${process.env.PORT || '5000 (default)'}`);
  console.log(`✅ DATABASE_URL: ${process.env.DATABASE_URL ? 'SET' : 'NOT SET'}`);
  
  return allFilesExist;
}

// Main test function
async function runTests() {
  try {
    // Test deployment configuration first
    const configValid = testDeploymentConfig();
    if (!configValid) {
      console.log('\n❌ Deployment configuration issues detected');
      process.exit(1);
    }
    
    console.log('\n🚀 Starting production server...');
    
    // Start production server
    const server = spawn('node', ['dist/index.js'], {
      env: { ...process.env, NODE_ENV: 'production', PORT: '5000' },
      stdio: ['pipe', 'pipe', 'pipe']
    });
    
    // Wait for server to start
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n🧪 Running endpoint tests...');
    
    // Run tests
    const healthTest = await testHealthEndpoint();
    const rootTest = await testRootEndpoint();
    const apiTest = await testAPIEndpoint();
    
    // Kill server
    server.kill();
    
    // Results
    console.log('\n📊 Test Results:');
    const allPassed = healthTest && rootTest && apiTest;
    
    if (allPassed) {
      console.log('🎉 All tests PASSED - Ready for deployment!');
      process.exit(0);
    } else {
      console.log('❌ Some tests FAILED - Fix issues before deployment');
      process.exit(1);
    }
    
  } catch (error) {
    console.error('💥 Test failed:', error.message);
    process.exit(1);
  }
}

runTests();