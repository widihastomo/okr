#!/usr/bin/env node

// Production deployment script (CommonJS)
const { execSync, spawn } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🚀 Starting production deployment...');

// Build the application
console.log('📦 Building production application...');
try {
  execSync('node build-production-fixed.js', { stdio: 'inherit' });
  console.log('✅ Production build successful');
} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}

// Test production server directly
console.log('🌐 Testing production server...');
const testPort = 3030;

const serverProcess = spawn('node', ['dist/index.cjs'], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: testPort
  },
  cwd: process.cwd()
});

serverProcess.on('error', (error) => {
  console.error('❌ Server error:', error.message);
  process.exit(1);
});

serverProcess.on('close', (code) => {
  console.log(`📍 Server exited with code ${code}`);
  process.exit(code);
});

// Handle shutdown signals
process.on('SIGTERM', () => {
  console.log('📍 Received SIGTERM, shutting down...');
  serverProcess.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('📍 Received SIGINT, shutting down...');
  serverProcess.kill('SIGINT');
});

console.log(`✅ Production server starting on port ${testPort}`);
console.log(`🌍 Health check: http://localhost:${testPort}/health`);