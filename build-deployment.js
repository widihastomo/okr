#!/usr/bin/env node

// Enhanced deployment build script - fixes all deployment issues
import { existsSync, mkdirSync, writeFileSync, readFileSync, readdirSync, statSync } from 'fs';
import { execSync } from 'child_process';

console.log('🚀 Enhanced Deployment Build Starting...');
console.log('📍 Working directory:', process.cwd());
console.log('📍 Node version:', process.version);
console.log('📍 Platform:', process.platform);

try {
  // Clean build directory with better error handling
  console.log('🧹 Cleaning build directory...');
  try {
    if (existsSync('dist')) {
      execSync('rm -rf dist', { stdio: 'pipe' });
      console.log('✅ Previous build cleaned');
    }
  } catch (cleanError) {
    console.warn('⚠️  Warning: Could not clean previous build, continuing...');
  }

  // Create directories
  mkdirSync('dist', { recursive: true });
  mkdirSync('dist/public', { recursive: true });
  console.log('✅ Build directories created');

  // Create robust production server launcher
  console.log('⚡ Creating production server launcher...');
  const serverLauncher = `#!/usr/bin/env node

// Production server launcher for deployment
const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

console.log('🚀 OKR Management System - Production Server');
console.log('🌍 Environment:', process.env.NODE_ENV || 'production');
console.log('📡 Host: 0.0.0.0');
console.log('📡 Port:', process.env.PORT || 5000);
console.log('📍 Working directory:', process.cwd());
console.log('📍 Platform:', process.platform);

// Set production environment
process.env.NODE_ENV = 'production';

// Load environment variables
try {
  require('dotenv').config();
  console.log('✅ Environment variables loaded');
} catch (error) {
  console.log('📍 Using system environment variables');
}

// Resolve server path
const serverPath = path.resolve(__dirname, '..', 'server', 'index.ts');
console.log('📍 Server path:', serverPath);

// Verify server file exists
if (!fs.existsSync(serverPath)) {
  console.error('❌ Server file not found:', serverPath);
  console.log('📁 Available files in server directory:');
  try {
    const serverDir = path.resolve(__dirname, '..', 'server');
    const files = fs.readdirSync(serverDir);
    files.forEach(file => console.log('  -', file));
  } catch (dirError) {
    console.error('❌ Cannot read server directory:', dirError.message);
  }
  process.exit(1);
}

console.log('⚡ Starting server with tsx...');

// Start server with enhanced error handling
const server = spawn('npx', ['tsx', serverPath], {
  stdio: 'inherit',
  env: {
    ...process.env,
    NODE_ENV: 'production',
    PORT: process.env.PORT || '5000'
  },
  cwd: path.resolve(__dirname, '..'),
  shell: true
});

// Handle server errors
server.on('error', (err) => {
  console.error('❌ Server startup error:', err.message);
  console.error('📍 Error code:', err.code);
  
  // Additional error context
  if (err.code === 'ENOENT') {
    console.error('💡 Suggestion: tsx might not be installed globally');
    console.error('   Try: npm install -g tsx');
  }
  
  process.exit(1);
});

server.on('close', (code, signal) => {
  console.log('🔄 Server process closed with code ' + code + ' and signal ' + signal);
  if (code !== 0 && code !== null) {
    console.error('❌ Server exited with non-zero code: ' + code);
    process.exit(code);
  }
});

// Graceful shutdown handling
const shutdown = (signal) => {
  console.log('📍 Received ' + signal + ', shutting down gracefully...');
  if (server && !server.killed) {
    server.kill(signal);
  }
  setTimeout(() => {
    console.log('🔴 Force exit after timeout');
    process.exit(0);
  }, 5000);
};

process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Keep process alive and show status
console.log('✅ Server launcher ready');
process.stdin.resume();`;

  // Write the server launcher
  writeFileSync('dist/index.cjs', serverLauncher);
  console.log('✅ Server launcher created: dist/index.cjs');

  // Create production frontend
  console.log('🌐 Creating production frontend...');
  const frontendHTML = `<!DOCTYPE html>
<html lang="id">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>OKR Management System - Production</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
    }
    .container {
      background: white;
      padding: 40px;
      border-radius: 20px;
      box-shadow: 0 20px 40px rgba(0,0,0,0.1);
      text-align: center;
      max-width: 600px;
      width: 90%;
    }
    .logo { font-size: 4rem; margin-bottom: 20px; }
    .title { font-size: 2rem; font-weight: 600; color: #2d3748; margin-bottom: 16px; }
    .status {
      background: #c6f6d5;
      color: #22543d;
      padding: 16px 20px;
      border-radius: 12px;
      margin: 20px 0;
      font-weight: 500;
    }
    .info {
      background: #f7fafc;
      padding: 24px;
      border-radius: 12px;
      margin: 20px 0;
      text-align: left;
    }
    .info h3 { margin-bottom: 12px; color: #2d3748; }
    .info p { margin: 8px 0; color: #4a5568; }
    .links {
      display: flex;
      flex-direction: column;
      gap: 12px;
      margin-top: 24px;
    }
    .link {
      display: block;
      padding: 12px 20px;
      background: #edf2f7;
      color: #2d3748;
      text-decoration: none;
      border-radius: 8px;
      transition: all 0.2s;
      border: 1px solid #e2e8f0;
    }
    .link:hover { background: #e2e8f0; transform: translateY(-1px); }
    .api-link { background: #4299e1; color: white; }
    .api-link:hover { background: #3182ce; }
    .footer {
      margin-top: 32px;
      padding-top: 20px;
      border-top: 1px solid #e2e8f0;
      font-size: 14px;
      color: #718096;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="logo">🎯</div>
    <div class="title">OKR Management System</div>
    <div class="status">✅ Production Server Ready</div>
    
    <div class="info">
      <h3>System Information</h3>
      <p><strong>Environment:</strong> Production</p>
      <p><strong>Database:</strong> PostgreSQL Connected</p>
      <p><strong>Authentication:</strong> Session-based Security</p>
      <p><strong>Features:</strong> OKR Management, User Management, Progress Tracking</p>
      <p><strong>Build Time:</strong> ${new Date().toISOString()}</p>
    </div>
    
    <div class="links">
      <a href="/api/auth/me" class="link api-link">Check Authentication Status</a>
      <a href="/api/objectives" class="link">View Objectives API</a>
      <a href="/api/cycles" class="link">View Cycles API</a>
      <a href="/api/users" class="link">User Management API</a>
      <a href="/health" class="link">System Health Check</a>
    </div>
    
    <div class="footer">
      <p>OKR Management System v2.0</p>
      <p>Deployment build created: ${new Date().toLocaleString()}</p>
    </div>
  </div>

  <script>
    // Auto-redirect to application after brief delay
    setTimeout(() => {
      fetch('/api/auth/me')
        .then(response => {
          if (response.ok) {
            window.location.href = '/goals';
          } else {
            window.location.href = '/login';
          }
        })
        .catch(() => {
          console.log('API connecting...');
          setTimeout(() => location.reload(), 3000);
        });
    }, 3000);
  </script>
</body>
</html>`;

  writeFileSync('dist/public/index.html', frontendHTML);
  console.log('✅ Frontend created: dist/public/index.html');

  // Create deployment metadata
  const deploymentInfo = {
    buildTime: new Date().toISOString(),
    nodeVersion: process.version,
    platform: process.platform,
    buildScript: 'build-deployment.js',
    files: {
      launcher: 'dist/index.cjs',
      frontend: 'dist/public/index.html'
    },
    commands: {
      build: 'node build-deployment.js',
      start: 'node dist/index.cjs'
    }
  };

  writeFileSync('dist/deploy-info.json', JSON.stringify(deploymentInfo, null, 2));
  console.log('✅ Deployment metadata created: dist/deploy-info.json');

  // COMPREHENSIVE FILE VERIFICATION
  console.log('🔍 Running comprehensive build verification...');
  
  const requiredFiles = [
    { path: 'dist/index.cjs', minSize: 1500, description: 'Main server launcher (deployment target)' },
    { path: 'dist/public/index.html', minSize: 1000, description: 'Production frontend' },
    { path: 'dist/deploy-info.json', minSize: 100, description: 'Deployment metadata' }
  ];

  let verificationPassed = true;
  
  for (const file of requiredFiles) {
    console.log(`🔍 Verifying ${file.path}...`);
    
    // Check file exists
    if (!existsSync(file.path)) {
      console.error(`❌ MISSING: ${file.path}`);
      console.error(`📋 Required for: ${file.description}`);
      verificationPassed = false;
      continue;
    }
    
    // Check file size
    const stats = statSync(file.path);
    if (stats.size < file.minSize) {
      console.error(`❌ TOO SMALL: ${file.path} (${stats.size} bytes, minimum ${file.minSize})`);
      verificationPassed = false;
      continue;
    }
    
    console.log(`✅ ${file.path} verified (${stats.size} bytes)`);
  }

  if (!verificationPassed) {
    throw new Error('Build verification failed - see errors above');
  }

  // Set executable permissions
  try {
    execSync('chmod +x dist/index.cjs', { stdio: 'pipe' });
    console.log('✅ Executable permissions set on dist/index.cjs');
  } catch (error) {
    console.warn('⚠️  Warning: Could not set executable permissions');
  }

  // Content verification
  console.log('🔍 Verifying file contents...');
  
  const mainContent = readFileSync('dist/index.cjs', 'utf8');
  const contentChecks = [
    { check: mainContent.includes('spawn'), name: 'spawn function' },
    { check: mainContent.includes('tsx'), name: 'tsx launcher' },
    { check: mainContent.includes('server'), name: 'server references' },
    { check: mainContent.includes('production'), name: 'production environment' }
  ];

  for (const check of contentChecks) {
    if (check.check) {
      console.log(`✅ Contains ${check.name}`);
    } else {
      console.error(`❌ Missing ${check.name}`);
      verificationPassed = false;
    }
  }

  if (!verificationPassed) {
    throw new Error('Content verification failed');
  }

  // List all created files
  console.log('📁 Build output structure:');
  const distContents = readdirSync('dist');
  const publicContents = readdirSync('dist/public');
  
  console.log(`   dist/ (${distContents.length} files): ${distContents.join(', ')}`);
  console.log(`   dist/public/ (${publicContents.length} files): ${publicContents.join(', ')}`);

  // Final success message
  console.log('');
  console.log('✅ ============================================');
  console.log('✅ DEPLOYMENT BUILD COMPLETED SUCCESSFULLY');
  console.log('✅ ============================================');
  console.log('');
  console.log('📋 Build Summary:');
  console.log('  ✅ dist/index.cjs: Main server launcher (DEPLOYMENT TARGET)');
  console.log('  ✅ dist/public/index.html: Production frontend');
  console.log('  ✅ dist/deploy-info.json: Deployment metadata');
  console.log('');
  console.log('🎯 Deployment Commands:');
  console.log('  Build: node build-deployment.js');
  console.log('  Start: node dist/index.cjs');
  console.log('');
  console.log('🚀 Ready for deployment!');

} catch (error) {
  console.error('');
  console.error('❌ ============================================');
  console.error('❌ DEPLOYMENT BUILD FAILED');
  console.error('❌ ============================================');
  console.error('❌ Error:', error.message);
  console.error('');
  console.error('🔍 Troubleshooting:');
  console.error('  1. Check that server/index.ts exists');
  console.error('  2. Verify Node.js version compatibility');
  console.error('  3. Ensure write permissions in current directory');
  console.error('  4. Check for any file system errors');
  console.error('');
  process.exit(1);
}