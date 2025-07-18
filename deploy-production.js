#!/usr/bin/env node

// Production deployment script with automatic port detection
const { execSync } = require('child_process');
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

// Find available port
const findAvailablePort = (startPort) => {
  const net = require('net');
  
  return new Promise((resolve, reject) => {
    const server = net.createServer();
    
    server.listen(startPort, (err) => {
      if (err) {
        server.close();
        if (startPort < 65535) {
          resolve(findAvailablePort(startPort + 1));
        } else {
          reject(new Error('No available ports found'));
        }
      } else {
        const port = server.address().port;
        server.close();
        resolve(port);
      }
    });
  });
};

// Start production server
const startProductionServer = async () => {
  try {
    const availablePort = await findAvailablePort(process.env.PORT || 3030);
    console.log(`🔍 Found available port: ${availablePort}`);
    
    const env = {
      ...process.env,
      NODE_ENV: 'production',
      PORT: availablePort
    };
    
    console.log('🌐 Starting production server...');
    const { spawn } = require('child_process');
    
    const serverProcess = spawn('node', ['dist/index.cjs'], {
      stdio: 'inherit',
      env: env,
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
    
    console.log(`✅ Production server started on port ${availablePort}`);
    console.log(`🌍 Health check: http://localhost:${availablePort}/health`);
    
  } catch (error) {
    console.error('❌ Failed to start production server:', error.message);
    process.exit(1);
  }
};

startProductionServer();