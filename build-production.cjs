#!/usr/bin/env node

/**
 * Production Build Script for OKR Management System
 * Creates optimized production build for deployment
 */

const { writeFileSync, mkdirSync, existsSync } = require('fs');
const path = require('path');

console.log('🚀 Starting production build...');

// Create build directory
if (!existsSync('dist')) {
  mkdirSync('dist', { recursive: true });
}

// Create production start script (CommonJS)
const productionScript = `#!/usr/bin/env node

// Production server launcher
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 OKR Management System - Production Server');
console.log('🌍 Environment: production');
console.log('📡 Port:', process.env.PORT || 5000);

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('📍 Using system environment variables');
}

// Set production environment
process.env.NODE_ENV = 'production';

// Start server
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('⚡ Starting server...');

const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production'
  },
  cwd: path.resolve(__dirname, '..')
});

server.on('error', (err) => {
  console.error('❌ Server error:', err.message);
  process.exit(1);
});

// Graceful shutdown
const shutdown = (signal) => {
  console.log(\`📍 Received \${signal}, shutting down...\`);
  if (server && !server.killed) {
    server.kill(signal);
  }
  setTimeout(() => process.exit(0), 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));
`;

// Write production script
writeFileSync('dist/index.js', productionScript, { mode: 0o755 });

// Create package.json for deployment
const deployPackage = {
  name: "okr-management-system",
  version: "1.0.0",
  description: "OKR Management System - Production",
  main: "dist/index.js",
  scripts: {
    start: "node dist/index.js"
  },
  engines: {
    node: ">=18.0.0"
  }
};

writeFileSync('dist/package.json', JSON.stringify(deployPackage, null, 2));

// Create deployment info
const deployInfo = {
  buildTime: new Date().toISOString(),
  environment: "production",
  version: "1.0.0",
  nodeVersion: process.version,
  startCommand: "node dist/index.js",
  port: process.env.PORT || 5000
};

writeFileSync('dist/deploy-info.json', JSON.stringify(deployInfo, null, 2));

console.log('✅ Production build completed successfully!');
console.log('📋 Files created:');
console.log('  ✅ dist/index.js - Production server');
console.log('  ✅ dist/package.json - Deployment package');
console.log('  ✅ dist/deploy-info.json - Build information');
console.log('🚀 Ready for deployment!');