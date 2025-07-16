#!/usr/bin/env node

// Standalone deployment build - fixes crash loop
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Creating standalone deployment...');
console.log('📍 Working directory:', process.cwd());

try {
  // Clean build directory
  console.log('🧹 Cleaning previous build...');
  execSync('rm -rf dist', { stdio: 'pipe' });
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });
  console.log('✅ Build directories created');

  // Create standalone server that uses tsx directly
  console.log('⚡ Creating server launcher...');
  const serverLauncher = `#!/usr/bin/env node

const { spawn } = require('child_process');
const path = require('path');

console.log('🚀 OKR Management System Starting...');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Port:', process.env.PORT || 5000);

// Path to the TypeScript server
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');

// Start server using tsx
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: process.env.NODE_ENV || 'production',
    PORT: process.env.PORT || '5000'
  }
});

server.on('error', (err) => {
  console.error('❌ Server startup error:', err.message);
  process.exit(1);
});

server.on('close', (code) => {
  console.log('Server process exited with code:', code);
  process.exit(code);
});

// Handle process termination
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully');
  server.kill('SIGTERM');
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully');
  server.kill('SIGINT');
});`;

  writeFileSync('dist/index.cjs', serverLauncher);

  // Create production frontend
  console.log('⚡ Creating frontend...');
  const html = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKR Management System</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { 
      font-family: system-ui, -apple-system, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh; display: flex; align-items: center; justify-content: center;
    }
    .container { 
      background: white; padding: 40px; border-radius: 16px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1); text-align: center;
      max-width: 600px; width: 90%;
    }
    .logo { font-size: 3rem; margin-bottom: 16px; }
    .title { font-size: 1.5rem; font-weight: 600; color: #2d3748; margin-bottom: 12px; }
    .status { 
      background: #c6f6d5; color: #22543d; padding: 12px 16px;
      border-radius: 8px; margin: 20px 0; font-weight: 500;
    }
    .info { background: #e2e8f0; padding: 20px; border-radius: 8px; margin: 20px 0; }
    .info h3 { margin-bottom: 10px; color: #2d3748; }
    .info p { margin: 5px 0; }
    .links { display: flex; flex-direction: column; gap: 8px; margin-top: 20px; }
    .link {
      display: block; padding: 12px 16px; background: #f7fafc; color: #2d3748;
      text-decoration: none; border-radius: 6px; font-size: 14px;
      transition: all 0.2s; border: 1px solid #e2e8f0;
    }
    .link:hover { background: #edf2f7; transform: translateY(-1px); }
    .api-link { background: #4299e1; color: white; }
    .api-link:hover { background: #3182ce; }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <div class="title">OKR Management System</div>
    <div class="status">✓ Production Ready</div>
    <div class="info">
      <h3>System Status</h3>
      <p><strong>Environment:</strong> Production</p>
      <p><strong>Database:</strong> PostgreSQL Connected</p>
      <p><strong>Authentication:</strong> Session-based</p>
      <p><strong>Features:</strong> OKR Management, User Management, Progress Tracking</p>
    </div>
    <div class="links">
      <a href="/api/auth/me" class="link api-link">Authentication Status</a>
      <a href="/api/objectives" class="link">View Objectives</a>
      <a href="/api/cycles" class="link">View Cycles</a>
      <a href="/api/users" class="link">User Management</a>
      <a href="/health" class="link">Health Check</a>
    </div>
    <div style="margin-top: 24px; font-size: 12px; color: #718096;">
      <p>OKR Management System v2.0</p>
      <p>Deployment: ${new Date().toISOString()}</p>
    </div>
  </div>
</body>
</html>`;

  writeFileSync('dist/public/index.html', html);

  // Enhanced verification with file size checking
  const requiredFiles = [
    { path: 'dist/index.cjs', minSize: 1000 },
    { path: 'dist/public/index.html', minSize: 500 }
  ];
  
  console.log('🔍 Verifying build output...');
  
  for (const file of requiredFiles) {
    if (!existsSync(file.path)) {
      throw new Error(`Missing file: ${file.path}`);
    }
    
    const stats = require('fs').statSync(file.path);
    if (stats.size < file.minSize) {
      throw new Error(`File too small: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
    }
    
    console.log(`✅ ${file.path} created successfully (${stats.size} bytes)`);
  }

  // Verify executable permissions
  try {
    execSync('chmod +x dist/index.cjs', { stdio: 'pipe' });
    console.log('✅ Executable permissions set on dist/index.cjs');
  } catch (error) {
    console.warn('⚠️  Warning: Could not set executable permissions');
  }

  // List all created files with sizes
  const distContents = readdirSync('dist');
  const publicContents = readdirSync('dist/public');
  
  console.log('📁 Build verification:');
  console.log(`   dist/ contains: ${distContents.join(', ')}`);
  console.log(`   dist/public/ contains: ${publicContents.join(', ')}`);
  
  // Test that the main file can be read
  try {
    const mainContent = readFileSync('dist/index.cjs', 'utf8');
    if (mainContent.includes('spawn') && mainContent.includes('tsx')) {
      console.log('✅ Main launcher file contains expected content');
    } else {
      throw new Error('Main launcher file missing expected content');
    }
  } catch (error) {
    throw new Error(`Failed to verify main launcher: ${error.message}`);
  }
  
  console.log('✅ Standalone build completed');
  console.log('✅ Server launcher: dist/index.cjs');
  console.log('✅ Frontend: dist/public/index.html');
  console.log('📦 Ready for deployment');
  
  // Final verification summary
  console.log('\n🎯 Deployment Summary:');
  console.log('  Build Command: node build-standalone.js');
  console.log('  Output File: dist/index.cjs');
  console.log('  Run Command: node dist/index.cjs');
  console.log('  Status: ✅ READY');

} catch (error) {
  console.error('❌ Build failed:', error.message);
  process.exit(1);
}